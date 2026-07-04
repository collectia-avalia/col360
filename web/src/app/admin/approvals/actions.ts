'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

const approvalSchema = z.object({
  payerId: z.string().uuid(),
  amount: z.string().optional(), // Obligatorio si aprueba
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export async function processPayerAction(formData: FormData) {
  // Usamos Admin Client para saltar RLS y asegurar la operación
  const supabase = createAdminClient()

  const rawData = {
    payerId: formData.get('payerId'),
    amount: formData.get('amount'),
    action: formData.get('action'),
    reason: formData.get('reason'), // Podríamos guardarlo en un log de auditoría
  }

  const validation = approvalSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: 'Datos inválidos' }
  }

  const { payerId, amount, action } = validation.data

  if (action === 'approve') {
    const approvalAmount = parseFloat(amount || '0')
    if (!amount || approvalAmount <= 0) {
      return { error: 'Debes asignar un cupo válido para aprobar.' }
    }

    // --- VALIDACIÓN DE EXPOSICIÓN MÁXIMA ---
    // 1. Obtener el creador del pagador (el cliente)
    const { data: payer, error: payerError } = await supabase
      .from('payers')
      .select('created_by, razon_social')
      .eq('id', payerId)
      .single()

    if (payerError || !payer) {
      return { error: 'No se pudo encontrar la información del pagador.' }
    }

    // 2. Obtener la bolsa y exposición del cliente
    const { data: clientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('total_bag, max_exposure, company_name')
      .eq('id', payer.created_by)
      .single()

    if (profileError || !clientProfile) {
      return { error: 'No se pudo encontrar la configuración de cupo del cliente.' }
    }

    // 3. Calcular el límite
    const totalBag = clientProfile.total_bag || 0
    const maxExposure = clientProfile.max_exposure || 100 // Default 100%
    const exposureLimit = totalBag * (maxExposure / 100)

    // 4. Validar
    if (approvalAmount > exposureLimit) {
      const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
      return { 
        error: `El cupo solicitado (${formatCurrency(approvalAmount)}) supera la exposición máxima permitida para este cliente (${maxExposure}% de la bolsa = ${formatCurrency(exposureLimit)}).` 
      }
    }
    // --- FIN VALIDACIÓN ---

    const { error } = await supabase
      .from('payers')
      .update({
        risk_status: 'aprobado',
        approved_quota: approvalAmount
      })
      .eq('id', payerId)

    if (error) return { error: 'Error al aprobar: ' + error.message }
  } 
  
  else if (action === 'reject') {
    const { error } = await supabase
      .from('payers')
      .update({
        risk_status: 'rechazado',
        approved_quota: 0,
        rejection_reason: validation.data.reason
      })
      .eq('id', payerId)

    if (error) return { error: 'Error al rechazar: ' + error.message }
  }

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/approvals/${payerId}`)
  redirect('/admin/approvals')
}

/**
 * Server Action para que el administrador pueda subir documentos manualmente (como la historia de crédito).
 */
export async function uploadPayerDocumentAdminAction(payerId: string, formData: FormData) {
    const file = formData.get('file') as File | null
    const docType = formData.get('docType') as string

    if (!payerId || !file || !docType) {
        return { error: 'Faltan parámetros requeridos' }
    }

    const supabase = createAdminClient()

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${payerId}/${docType}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('legal-docs')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error('[ADMIN_UPLOAD] Error en Storage:', uploadError)
            return { error: 'Error al subir el archivo al almacenamiento.' }
        }

        const { error: dbError } = await supabase
            .from('payer_documents')
            .upsert({
                payer_id: payerId,
                doc_type: docType,
                file_path: fileName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'payer_id,doc_type' })

        if (dbError) {
            console.error('[ADMIN_UPLOAD] Error en base de datos:', dbError)
            return { error: 'Error al registrar el documento en la base de datos.' }
        }

        revalidatePath(`/admin/approvals/${payerId}`)
        return { success: true }
    } catch (e: any) {
        console.error('[ADMIN_UPLOAD] Excepción:', e)
        return { error: 'Excepción inesperada en la subida del documento.' }
    }
}

/**
 * Server Action para ejecutar el análisis de crédito con IA (Gemini) basado en la historia de crédito cargada.
 */
export async function analyzeCreditStudyAction(payerId: string) {
    const supabase = createAdminClient()

    try {
        console.log(`[ANALYZE] Iniciando análisis de crédito para pagador: ${payerId}`)

        // 1. Obtener la información del pagador
        const { data: payer, error: payerError } = await supabase
            .from('payers')
            .select('*')
            .eq('id', payerId)
            .single()

        if (payerError || !payer) {
            return { error: 'No se pudo obtener la información del pagador.' }
        }

        // 2. Obtener todos los documentos del pagador
        const { data: docs, error: docsError } = await supabase
            .from('payer_documents')
            .select('*')
            .eq('payer_id', payerId)

        if (docsError || !docs || docs.length === 0) {
            return { error: 'No se encontraron documentos cargados para este pagador.' }
        }

        // Buscar la historia de crédito (obligatoria)
        const creditHistoryDoc = docs.find(d => d.doc_type === 'historia_credito')
        if (!creditHistoryDoc) {
            return { error: 'No se encontró una Historia de Crédito cargada para este pagador. Por favor, súbela primero.' }
        }

        // Buscar documentos financieros adicionales
        const balanceDoc = docs.find(d => d.doc_type === 'balance')
        const pygDoc = docs.find(d => d.doc_type === 'pyg')
        const eeffDoc = docs.find(d => d.doc_type === 'estados_financieros')

        // 3. Descargar y parsear la Historia de Crédito (obligatoria)
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('legal-docs')
            .download(creditHistoryDoc.file_path)

        if (downloadError || !fileData) {
            console.error('[ANALYZE] Error al descargar historia de crédito:', downloadError)
            return { error: 'No se pudo descargar el archivo de Historia de Crédito desde el Storage.' }
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const parsedPdf = await pdfParse(buffer)
        const pdfText = parsedPdf.text || ''
        console.log(`[ANALYZE] Historia de Crédito parseada con éxito. Longitud: ${pdfText.length} caracteres.`)

        // 4. Descargar y parsear documentos financieros de forma segura (opcionales)
        let balanceText = ''
        let pygText = ''
        let eeffText = ''

        if (balanceDoc) {
            try {
                const { data: bData } = await supabase.storage.from('legal-docs').download(balanceDoc.file_path)
                if (bData) {
                    const bBuffer = Buffer.from(await bData.arrayBuffer())
                    const bParsed = await pdfParse(bBuffer)
                    balanceText = bParsed.text || ''
                    console.log(`[ANALYZE] Balance General parseado con éxito. Longitud: ${balanceText.length} caracteres.`)
                }
            } catch (err) {
                console.error('[ANALYZE] Error parseando Balance:', err)
            }
        }

        if (pygDoc) {
            try {
                const { data: pData } = await supabase.storage.from('legal-docs').download(pygDoc.file_path)
                if (pData) {
                    const pBuffer = Buffer.from(await pData.arrayBuffer())
                    const pParsed = await pdfParse(pBuffer)
                    pygText = pParsed.text || ''
                    console.log(`[ANALYZE] Estado de Resultados (PYG) parseado con éxito. Longitud: ${pygText.length} caracteres.`)
                }
            } catch (err) {
                console.error('[ANALYZE] Error parseando PYG:', err)
            }
        }

        if (eeffDoc) {
            try {
                const { data: eData } = await supabase.storage.from('legal-docs').download(eeffDoc.file_path)
                if (eData) {
                    const eBuffer = Buffer.from(await eData.arrayBuffer())
                    const eParsed = await pdfParse(eBuffer)
                    eeffText = eParsed.text || ''
                    console.log(`[ANALYZE] Estados Financieros completos parseados con éxito. Longitud: ${eeffText.length} caracteres.`)
                }
            } catch (err) {
                console.error('[ANALYZE] Error parseando Estados Financieros:', err)
            }
        }

        // 5. Configurar llamada a la API de OpenAI
        const openaiApiKey = process.env.OPENAI_API_KEY
        if (!openaiApiKey) {
            return { error: 'La clave de API de OpenAI (OPENAI_API_KEY) no está configurada en las variables de entorno.' }
        }

        // Construcción del Prompt con la Metodología
        let financialDocsContext = ''
        if (balanceText) {
            financialDocsContext += `\nTEXTO DEL BALANCE GENERAL / ESTADO DE SITUACIÓN FINANCIERA DEL DEUDOR:\n"""\n${balanceText.substring(0, 25000)}\n"""\n`
        }
        if (pygText) {
            financialDocsContext += `\nTEXTO DEL ESTADO DE RESULTADOS (PYG) DEL DEUDOR:\n"""\n${pygText.substring(0, 25000)}\n"""\n`
        }
        if (eeffText) {
            financialDocsContext += `\nTEXTO DE ESTADOS FINANCIEROS COMPLETOS DEL DEUDOR:\n"""\n${eeffText.substring(0, 25000)}\n"""\n`
        }

        const promptText = `
Eres un analista experto de riesgo y crédito de AVALIA. Tu tarea es analizar la historia de crédito adjunta de una Persona Jurídica (PJ) colombiana, complementar con los datos financieros básicos del deudor y los documentos de balance o estados de resultados provistos, y retornar un análisis estructurado de scoring según el modelo SARC Wy CF de Avalia.

METODOLOGÍA SARC WY CF Y REGLAS DE CUPO (APLICACIÓN ESTRICTA):
ATENCIÓN AL ORDEN CRONOLÓGICO DE LAS COLUMNAS: En los documentos financieros provistos (Balance y PYG), la columna izquierda representa el año más reciente (dic-2025) y la columna derecha representa el año anterior (dic-2024). No confundas el orden temporal: el presente es la columna izquierda y el pasado es la columna derecha. Compara siempre el presente (izquierda) contra el pasado (derecha) para determinar si las variables son crecientes o decrecientes.
1. Ponderación por bloques:
   - Bloque 1 (Variables Financieras y de Riesgo): Peso 35%. Variables:
     * Disponible vs Capacidad de Pago (Efectivo y Equivalentes / Pasivo Corriente):
       - APLICA ESTRICTAMENTE esta fórmula: divide el Efectivo y Equivalentes de la caja del balance entre el Pasivo Corriente. No uses el margen neto ni el margen operacional.
       - Si el texto del balance no contiene o no se puede determinar de forma clara y explícita el Efectivo y Equivalentes o el Pasivo Corriente, califica la variable Disponible vs Capacidad de Pago con 0 puntos. Nunca uses el margen operacional o neto como fallback.
       - Si la Utilidad Operacional del negocio da pérdidas (es negativa), la variable debe calificarse con 0 puntos de inmediato.
       - En caso de utilidad operacional positiva, calcula el ratio de capacidad (Efectivo / Pasivo Corriente) y califica: >55% (0 pts), 35%-55% (200 pts), 15%-35% (400 pts), 5%-15% (200 pts), <5% (0 pts).
     * Endeudamiento del Cliente (Pasivo total / (Activo total - Pasivo total)):
       - APLICA ESTRICTAMENTE esta fórmula: divide el Pasivo Total entre el Patrimonio (Activo - Pasivo).
       - Si el resultado es superior al 60% (0.60) (ej. 136.6%), califica con 0 puntos.
       - Si el resultado es menor o igual al 60% (0.60), califica con 200 puntos.
     * Score PJ Experian:
       - Si el score Experian está en el rango de 10 a 600: Asigna base de -1000 pts.
         REGLA DE NEUTRALIZACIÓN (CONVERTIR A EXACTAMENTE 0 PTS): Este castigo de -1000 pts se puede neutralizar a EXACTAMENTE 0 puntos (bajo ninguna circunstancia asignes valores positivos como 200 o 400 si el score original está entre 10 y 600, incluso si se neutraliza) ÚNICAMENTE si el comportamiento de pago en la historia de crédito es 100% sano (moras vigentes en $0 COP y sin moras recientes). Si el reporte muestra moras vigentes mayores a $0 COP (como moras de 30, 60 o 90+ días) o moras recurrentes recientes, la neutralización NO APLICA y los puntos para esta variable deben ser exactamente -1000 pts.
       - Si el score Experian está en el rango de 601 a 700: Asigna exactamente 200 pts.
       - Si el score Experian es mayor a 700: Asigna exactamente 400 pts.
     * Composición de Deuda Consumo (Deuda Consumo / Deuda Total): <30% (100 pts), >30% (0 pts).
     * Variación de Endeudamiento (último trimestre): Compara el Saldo Total Actual de deuda del buró con el Saldo del trimestre anterior que figuran en el reporte de Experian (ej. para Tableros, la variación entre $386.806 y $354.952 es 9.0%). Si esta variación es inferior al 20%, califica con 100 pts. Si es superior, califica con 0 pts.
     * Nota: El Subtotal de Bloque 1 se normaliza sobre un máximo de 1200 puntos a escala 0-1000. Si el score Experian restó -1000 pts, el subtotal de Bloque 1 puede dar negativo; en tal caso, el puntaje normalizado del Bloque 1 es 0.
   - Bloque 2 (Variables Propias del Negocio): Peso 35%. Variables:
     * Antigüedad del negocio: <40 meses (0 pts), 40-59 meses (200 pts), >=60 meses (400 pts).
     * Opera/Administra la empresa: Sí (400 pts), No (0 pts).
     * Crecimiento Ventas últimos 2 años: >5% (400 pts), 1%-5% (200 pts), <=1% o decrece (0 pts).
     * Nota: El Subtotal de Bloque 2 se normaliza sobre un máximo de 1200 puntos a escala 0-1000.
   - Bloque 3 (Variables Adicionales PJ): Peso 30%. Variables (extrae del Balance, PYG y Estados Financieros provistos):
     * Liquidez - Razón Corriente (Act. Corriente / Pas. Corriente): <1.5 (0 pts), 1.5-2.5 (200 pts), >2.5 (100 pts).
     * Liquidez - Prueba Ácida ((Act. Corriente - Inventarios) / Pas. Corriente): >=1.0 (o cercano a 0.98) (200 pts), otro valor (0 pts).
     * Endeudamiento - Cobertura de Intereses (EBITDA / Gastos Intereses): >3.0x (200 pts), <=3.0x (0 pts). (Si la utilidad operacional es negativa, la cobertura es negativa y da 0 pts).
     * Rentabilidad - Margen Neto (Utilidad Neta / Ingresos Operacionales): Calcula el margen neto de dic-2025 (Utilidad Neta 2025 / Ingresos 2025) y compáralo con el de dic-2024. Si el margen neto de 2025 es superior al de 2024, la tendencia es Creciente (200 pts). Si es igual es Estable (100 pts), y si es menor es Decreciente (0 pts). No te dejes confundir por caídas en el total de ventas operacionales, el margen neto es un porcentaje.
     * Rentabilidad - ROE (Ut. Neta / Patrimonio): > Costo de oportunidad (200 pts), < Costo de oportunidad (0 pts).
     * Nota: El Subtotal de Bloque 3 se normaliza sobre un máximo de 1000 puntos a escala 0-1000.
   - Score Final = (Normalizado Bloque 1 * 0.35) + (Normalizado Bloque 2 * 0.35) + (Normalizado Bloque 3 * 0.30).
   - Umbrales: >=750 (AA - Riesgo muy bajo), 500-749 (A - Riesgo bajo), <500 (No aprueba por modelo - Riesgo Alto).

2. Criterio de Cupo y Plazo (Ancla Principal):
   - Utilidad Neta Mensualizada = Utilidad Neta / 12 meses (o meses del periodo analizado).
   - Nivel de Riesgo define el cupo máximo sugerido:
     * BAJO (AA / A limpio): Hasta 2.0x utilidad mensualizada. Plazo max 60 días.
     * MEDIO: Hasta 1.5x utilidad mensualizada. Plazo max 45 días.
     * MEDIO-ALTO: Hasta 1.0x utilidad mensualizada. Plazo max 30 días.
     * ALTO: No aprobar o máx 0.5x utilidad mensualizada. Plazo max 15 días.
   - ALERTA DE REESTRUCTURACIÓN / LEY 550 / INSOLVENCIA: Si la empresa se encuentra en Acuerdo de Reestructuración, insolvencia concursal o Ley 550 (lo cual puedes inferir de la razón social, Cámara de Comercio o texto extraído), esto invalida de forma cualitativa la viabilidad de aprobar cupos comerciales y requiere calificar con un score y cupo recomendados de 0, recomendando NO APROBAR.

DATOS FINANCIEROS DEL DEUDOR (REGISTRO EN BD):
- Razón Social: ${payer.razon_social}
- NIT: ${payer.nit}
- Ventas Anuales registradas: $${payer.annual_sales || 0} COP
- Activos Totales registrados: $${payer.total_assets || 0} COP
- Pasivos Totales registrados: $${payer.total_liabilities || 0} COP
- Utilidad Neta registrada: $${payer.net_utility || 0} COP
- Compra Mensual estimada por cliente: $${payer.monthly_purchase_value || 0} COP
- Plazo solicitado por cliente: ${payer.payment_term || 0} días

${financialDocsContext}

TEXTO DE LA HISTORIA DE CRÉDITO EXTRAÍDO (BURÓ DE RIESGO):
"""
${pdfText.substring(0, 35000)}
"""

INSTRUCCIONES DE RESPUESTA:
Calcula paso a paso todos los indicadores de los 3 bloques basándose en los textos provistos de balance, pyg e historia de crédito. Presta especial atención a si hay moras vigentes (saldo en mora > 0) o moras recurrentes recientes en la historia de crédito, y a si la utilidad operacional es negativa.

REGLA DE CONCILIACIÓN ARITMÉTICA: Debes asegurarte de que el subtotal de cada bloque sea exactamente la suma matemática de los puntos asignados a sus variables correspondientes. Por ejemplo, en el Bloque 3 si las variables sumaron 200 + 0 + 200 + 200 + 200, el subtotal del Bloque 3 debe ser exactamente 800. Verifica doblemente la suma de cada bloque antes de responder.

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (los valores son ilustrativos y deben ser calculados por ti a partir de los datos reales del deudor):
{
  "score": 0, // [Coloca aquí el Score total calculado de 10 a 1000 como número entero]
  "category": "Escribe aquí la categoría de riesgo (ej. 'A', 'AA', o 'No aprueba por modelo')",
  "disasterScreening": {
    "applied": true,
    "neutralized": false, // [true o false si se neutralizó el score]
    "justification": "Escribe aquí la justificación de por qué se aplicó y si se neutralizó o no el castigo de Experian"
  },
  "blocks": {
    "block1": {
      "subtotal": 0, // [Suma de puntos crudos del Bloque 1]
      "normalized": 0, // [Puntaje normalizado del Bloque 1 de 0 a 1000: (subtotal / 1200) * 1000]
      "variables": [
        { "name": "Disponible vs Capacidad de Pago", "value": "Escribe el porcentaje de disponible (Efectivo/Pas.Cte) o 'Operación con pérdida'", "points": 0 },
        { "name": "Endeudamiento del Cliente", "value": "Escribe el porcentaje de endeudamiento patrimonial Wy", "points": 0 },
        { "name": "Score PJ - Experian", "value": "Escribe el score de Experian (ej. '551' o '286')", "points": 0 },
        { "name": "Composición de Deuda Consumo", "value": "Escribe el porcentaje de deuda de consumo", "points": 0 },
        { "name": "Variación de Endeudamiento", "value": "Escribe el porcentaje de variación trimestral", "points": 0 }
      ]
    },
    "block2": {
      "subtotal": 0, // [Suma de puntos crudos del Bloque 2]
      "normalized": 0, // [Puntaje normalizado del Bloque 2 de 0 a 1000: (subtotal / 1200) * 1000]
      "variables": [
        { "name": "Antigüedad en el negocio", "value": "Escribe la antigüedad en meses (ej. '111 meses')", "points": 0 },
        { "name": "Opera/Administra la empresa", "value": "Escribe 'Sí' o 'No'", "points": 0 },
        { "name": "Crecimiento Ventas - 2 años", "value": "Escribe el porcentaje de crecimiento (ej. '-23.9%')", "points": 0 }
      ]
    },
    "block3": {
      "subtotal": 0, // [Suma de puntos crudos del Bloque 3]
      "normalized": 0, // [Puntaje normalizado del Bloque 3 de 0 a 1000: (subtotal / 1000) * 1000]
      "variables": [
        { "name": "Liquidez – Razón Corriente", "value": "Escribe el ratio de razón corriente", "points": 0 },
        { "name": "Liquidez – Prueba Ácida", "value": "Escribe el ratio de prueba ácida", "points": 0 },
        { "name": "Endeudamiento – Cobertura Intereses", "value": "Escribe el ratio de cobertura (ej. '4.0x')", "points": 0 },
        { "name": "Rentabilidad – Margen Neto", "value": "Escribe 'Creciente', 'Estable' o 'Decreciente'", "points": 0 },
        { "name": "Rentabilidad – ROE", "value": "Escribe 'Mayor que costo de oportunidad' o 'Menor que costo de oportunidad'", "points": 0 }
      ]
    }
  },
  "dimensions": [
    { "name": "Rentabilidad", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto cualitativo breve de rentabilidad" },
    { "name": "Liquidez", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto cualitativo breve de liquidez" },
    { "name": "Flujo", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto cualitativo de flujo" },
    { "name": "Endeudamiento", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto de endeudamiento" },
    { "name": "Historial Crediticio", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto de centrales" },
    { "name": "Legitimidad", "status": "Escribe 'green', 'yellow' o 'red'", "verdict": "Escribe el veredicto de legitimidad y legalidad" }
  ],
  "quota": {
    "netUtilityMonthly": 0, // [Utilidad Neta del periodo analizado dividida entre 12 meses como número entero]
    "riskLevel": "Escribe 'bajo', 'medio', 'medio-alto' o 'alto'",
    "multiplier": 0.0, // [Multiplicador a aplicar: 2.0 para bajo, 1.5 para medio, 1.0 para medio-alto, 0.5 o 0 para alto]
    "recommendedQuota": 0, // [netUtilityMonthly * multiplier redondeado a número entero]
    "recommendedTerm": 0 // [60 para bajo, 45 para medio, 30 para medio-alto, 15 o 0 para alto]
  },
  "executiveSummary": "Escribe aquí el resumen cualitativo formal para el comité de riesgos en formato markdown (usando negritas, saltos de línea, etc.) analizando detalladamente los puntos fuertes y de cautela del deudor, y justificando el cupo y plazo recomendados."
}

No agregues texto introductorio ni explicaciones fuera del JSON. Devuelve únicamente el objeto JSON parseable.
`;

        // Realizar la llamada HTTP a OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un analista experto de riesgo y crédito de AVALIA. Tu tarea es analizar historias de crédito y retornar un objeto JSON válido según el scoring SARC Wy CF.'
                    },
                    {
                        role: 'user',
                        content: promptText
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2
            })
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('[ANALYZE] Error en la API de OpenAI:', errText)
            return { error: 'Error en el servicio de IA de OpenAI al procesar la solicitud.' }
        }

        const resJson = await response.json()
        const textResponse = resJson.choices?.[0]?.message?.content

        if (!textResponse) {
            return { error: 'La IA no devolvió un análisis procesable.' }
        }

        // 6. Deserializar el JSON y validar
        const analysisResult = JSON.parse(textResponse.trim())

        // Recálculo determinista de scoring SARC Wy CF
        let scoreSarc = 0
        try {
            // A. Bloque 1
            const block1Vars = analysisResult.blocks?.block1?.variables || []
            let block1Subtotal = 0
            block1Vars.forEach((v: any) => {
                block1Subtotal += Number(v.points || 0)
            })
            let block1Normalized = Math.round((block1Subtotal / 1200) * 1000)
            if (block1Normalized < 0) block1Normalized = 0

            // B. Bloque 2
            const block2Vars = analysisResult.blocks?.block2?.variables || []
            let block2Subtotal = 0
            block2Vars.forEach((v: any) => {
                block2Subtotal += Number(v.points || 0)
            })
            let block2Normalized = Math.round((block2Subtotal / 1200) * 1000)
            if (block2Normalized < 0) block2Normalized = 0

            // C. Bloque 3
            const block3Vars = analysisResult.blocks?.block3?.variables || []
            let block3Subtotal = 0
            block3Vars.forEach((v: any) => {
                block3Subtotal += Number(v.points || 0)
            })
            let block3Normalized = Math.round((block3Subtotal / 1000) * 1000)
            if (block3Normalized < 0) block3Normalized = 0

            // D. Score Final = (Block1 * 35%) + (Block2 * 35%) + (Block3 * 30%)
            const finalScore = Math.round(
                (block1Normalized * 0.35) + 
                (block2Normalized * 0.35) + 
                (block3Normalized * 0.30)
            )

            // E. Ajustar categorías y cupos según el Score Final real
            let category = "No aprueba por modelo"
            let riskLevel = "alto"
            let multiplier = 0.0
            let recommendedTerm = 0

            if (finalScore >= 750) {
                category = "AA"
                riskLevel = "bajo"
                multiplier = 2.0
                recommendedTerm = 60
            } else if (finalScore >= 500) {
                category = "A"
                riskLevel = "medio"
                multiplier = 1.5
                recommendedTerm = 45
            }

            // Excepción por Ley 550 / Reestructuración (Cualitativo superior)
            const lowerSummary = (analysisResult.executiveSummary || '').toLowerCase()
            const lowerVerdict = (analysisResult.dimensions || []).map((d: any) => (d.verdict || '').toLowerCase()).join(' ')
            const isRestructured = lowerSummary.includes('ley 550') || lowerSummary.includes('reestructuracion') || lowerSummary.includes('reestructuración') ||
                                   lowerVerdict.includes('ley 550') || lowerVerdict.includes('reestructuracion') || lowerVerdict.includes('reestructuración')
            
            if (isRestructured) {
                category = "No aprueba por modelo"
                riskLevel = "alto"
                multiplier = 0.0
                recommendedTerm = 0
            }

            const netUtility = Number(payer.net_utility || 0)
            const netUtilityMonthly = Math.round(netUtility / 12)
            const recommendedQuota = Math.round(netUtilityMonthly * multiplier)

            // Re-escribir de forma exacta y matemática los valores reales en el JSON final
            analysisResult.score = finalScore
            analysisResult.category = category
            
            if (!analysisResult.blocks) analysisResult.blocks = {}
            if (!analysisResult.blocks.block1) analysisResult.blocks.block1 = {}
            analysisResult.blocks.block1.subtotal = block1Subtotal
            analysisResult.blocks.block1.normalized = block1Normalized

            if (!analysisResult.blocks.block2) analysisResult.blocks.block2 = {}
            analysisResult.blocks.block2.subtotal = block2Subtotal
            analysisResult.blocks.block2.normalized = block2Normalized

            if (!analysisResult.blocks.block3) analysisResult.blocks.block3 = {}
            analysisResult.blocks.block3.subtotal = block3Subtotal
            analysisResult.blocks.block3.normalized = block3Normalized

            if (!analysisResult.quota) analysisResult.quota = {}
            analysisResult.quota.netUtilityMonthly = netUtilityMonthly
            analysisResult.quota.riskLevel = riskLevel
            analysisResult.quota.multiplier = multiplier
            analysisResult.quota.recommendedQuota = recommendedQuota
            analysisResult.quota.recommendedTerm = recommendedTerm

            scoreSarc = finalScore
            console.log(`[ANALYZE_MATH] Aritmética recalculada con éxito. Score Final: ${finalScore}, Cupo: ${recommendedQuota}`)
        } catch (mathErr) {
            console.error('[ANALYZE_MATH] Falló recálculo de backend:', mathErr)
            scoreSarc = Number(analysisResult.score || 0)
        }

        console.log(`[ANALYZE] Análisis completado con éxito. Score SARC sugerido: ${scoreSarc}`)

        // 7. Persistir en la base de datos en la tabla payers
        const { error: updateError } = await supabase
            .from('payers')
            .update({
                credit_study_result: analysisResult,
                score_sarc: scoreSarc,
                risk_status: 'en estudio' // Mover a 'en estudio' automáticamente al ser analizado
            })
            .eq('id', payerId)

        if (updateError) {
            console.error('[ANALYZE] Error al guardar en base de datos:', updateError)
            return { error: 'Error al actualizar el resultado del análisis en la base de datos: ' + updateError.message }
        }

        revalidatePath(`/admin/approvals/${payerId}`)
        revalidatePath('/admin/approvals')

        return { success: true, score: scoreSarc }

    } catch (e: any) {
        console.error('[ANALYZE] Excepción:', e)
        return { error: 'Error inesperado durante el análisis con IA: ' + (e.message || e) }
    }
}
