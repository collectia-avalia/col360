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

        // 2. Obtener el archivo de la historia de crédito
        const { data: doc, error: docError } = await supabase
            .from('payer_documents')
            .select('*')
            .eq('payer_id', payerId)
            .eq('doc_type', 'historia_credito')
            .single()

        if (docError || !doc) {
            return { error: 'No se encontró una Historia de Crédito cargada para este pagador. Por favor, súbela primero.' }
        }

        // 3. Descargar el archivo desde Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('legal-docs')
            .download(doc.file_path)

        if (downloadError || !fileData) {
            console.error('[ANALYZE] Error al descargar archivo:', downloadError)
            return { error: 'No se pudo descargar el archivo de Historia de Crédito desde el Storage.' }
        }

        // 4. Parsea el texto del PDF
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const parsedPdf = await pdfParse(buffer)
        const pdfText = parsedPdf.text || ''

        console.log(`[ANALYZE] PDF parseado con éxito. Longitud del texto: ${pdfText.length} caracteres.`)

        // 5. Configurar llamada a la API de Gemini
        const geminiApiKey = process.env.GEMINI_API_KEY
        if (!geminiApiKey) {
            return { error: 'La clave de API de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno.' }
        }

        // Construcción del Prompt con la Metodología
        const promptText = `
Eres un analista experto de riesgo y crédito de AVALIA. Tu tarea es analizar la historia de crédito adjunta de una Persona Jurídica (PJ) colombiana, complementar con los datos financieros básicos del deudor y retornar un análisis estructurado de scoring según el modelo SARC Wy CF de Avalia.

METODOLOGÍA SARC WY CF Y REGLAS DE CUPO:
1. Ponderación por bloques:
   - Bloque 1 (Variables Financieras y de Riesgo): Peso 35%. Variables:
     * Disponible vs Capacidad de Pago: >55% (0 pts), 35%-55% (200 pts), 15%-35% (400 pts), 5%-15% (200 pts), <5% (0 pts).
     * Endeudamiento del Cliente (Pasivo total / (Activo total - Pasivo total)): >60% (0 pts), <=60% (200 pts).
     * Score PJ Experian:
       - Rango 10 a 600 o Acierta 1,3: -1000 pts.
         REGLA DE NEUTRALIZACIÓN DE DISASTER SCREENING (CRÍTICA): Si el score Experian está en rango 10-600 pero el comportamiento real detallado en el reporte es sano (moras vigentes en $0, historial intachable, sin reportes negativos activos), la variable Score PJ Experian se neutraliza a 0 en lugar de restar -1000. Se debe justificar detalladamente por escrito.
       - Rango 601 a 700: 200 pts.
       - Mayor a 700: 400 pts.
     * Composición de Deuda Consumo (Deuda Consumo / Deuda Total): <30% (100 pts), >30% (0 pts).
     * Variación de Endeudamiento (último trimestre): Inferior al 20% (100 pts), Superior al 20% (0 pts).
     * Nota: El Subtotal de Bloque 1 se normaliza sobre un máximo teórico de 1200 puntos a escala 0-1000.
   - Bloque 2 (Variables Propias del Negocio): Peso 35%. Variables:
     * Antigüedad del negocio: <40 meses (0 pts), 40-59 meses (200 pts), >=60 meses (400 pts).
     * Opera/Administra la empresa: Sí (400 pts), No (0 pts).
     * Crecimiento Ventas últimos 2 años: >5% (400 pts), 1%-5% (200 pts), <=1% o decrece (0 pts).
     * Nota: El Subtotal de Bloque 2 se normaliza sobre un máximo teórico de 1200 puntos a escala 0-1000.
   - Bloque 3 (Variables Adicionales PJ): Peso 30%. Variables:
     * Liquidez - Razón Corriente (Act. Corriente / Pas. Corriente): <1.5 (0 pts), 1.5-2.5 (200 pts), >2.5 (100 pts).
     * Liquidez - Prueba Ácida ((Act. Corriente - Inventarios) / Pas. Corriente): >=1.0 (o cercano a 0.98) (200 pts), otro valor (0 pts).
     * Endeudamiento - Cobertura de Intereses (EBITDA / Gastos Intereses): >3.0x (200 pts), <=3.0x (0 pts).
     * Rentabilidad - Margen Neto: Creciente últimos 2 años (200 pts), Estable (100 pts), Decreciente (0 pts).
     * Rentabilidad - ROE (Ut. Neta / Patrimonio): > Costo de oportunidad (200 pts), < Costo de oportunidad (0 pts).
     * Nota: El Subtotal de Bloque 3 se normaliza sobre un máximo teórico de 1000 puntos a escala 0-1000.
   - Score Final = (Normalizado Bloque 1 * 0.35) + (Normalizado Bloque 2 * 0.35) + (Normalizado Bloque 3 * 0.30).
   - Umbrales: >=750 (AA - Riesgo muy bajo), 500-749 (A - Riesgo bajo), <500 (No aprueba por modelo).

2. Criterio de Cupo y Plazo (Ancla Principal):
   - Utilidad Neta Mensualizada = Utilidad Neta / 12 meses (o meses del periodo analizado).
   - Nivel de Riesgo define el cupo máximo sugerido:
     * BAJO (AA / A limpio): Hasta 2.0x utilidad mensualizada. Plazo max 60 días.
     * MEDIO: Hasta 1.5x utilidad mensualizada. Plazo max 45 días.
     * MEDIO-ALTO: Hasta 1.0x utilidad mensualizada. Plazo max 30 días.
     * ALTO: No aprobar o máx 0.5x utilidad mensualizada. Plazo max 15 días.

DATOS FINANCIEROS DEL DEUDOR (REGISTRO EN BD):
- Razón Social: ${payer.razon_social}
- NIT: ${payer.nit}
- Ventas Anuales registradas: $${payer.annual_sales || 0} COP
- Activos Totales registrados: $${payer.total_assets || 0} COP
- Pasivos Totales registrados: $${payer.total_liabilities || 0} COP
- Utilidad Neta registrada: $${payer.net_utility || 0} COP
- Compra Mensual estimada por cliente: $${payer.monthly_purchase_value || 0} COP
- Plazo solicitado por cliente: ${payer.payment_term || 0} días

TEXTO DE LA HISTORIA DE CRÉDITO EXTRAÍDO:
\"\"\"
${pdfText.substring(0, 45000)}
\"\"\"

INSTRUCCIONES DE RESPUESTA:
Debes analizar detalladamente el texto de la historia de crédito (Experian/Datacrédito), extraer el Score de Experian (Score PJ), revisar si tiene moras vigentes, reportes negativos de cartera o embargos activos. Calcula todos los ratios financieros y el Score SARC Wy CF basándote en la metodología y las reglas de neutralización de disaster screening.

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "score": 730,
  "category": "A",
  "disasterScreening": {
    "applied": true,
    "neutralized": true,
    "justification": "Se detectó score Experian de 322. No obstante, el reporte no registra obligaciones en mora vigentes ni reportes negativos. El score bajo refleja utilización de líneas de crédito activas, por lo que se neutraliza a 0 de acuerdo con las políticas de Avalia."
  },
  "blocks": {
    "block1": {
      "subtotal": 400,
      "normalized": 333,
      "variables": [
        { "name": "Disponible vs Capacidad de Pago", "value": "12%", "points": 200 },
        { "name": "Endeudamiento del Cliente", "value": "52%", "points": 200 },
        { "name": "Score PJ - Experian", "value": "322 (Neutralizado)", "points": 0 },
        { "name": "Composición de Deuda Consumo", "value": "35%", "points": 0 },
        { "name": "Variación de Endeudamiento", "value": "25%", "points": 0 }
      ]
    },
    "block2": {
      "subtotal": 800,
      "normalized": 667,
      "variables": [
        { "name": "Antigüedad en el negocio", "value": "72 meses", "points": 400 },
        { "name": "Opera/Administra la empresa", "value": "Sí", "points": 400 },
        { "name": "Crecimiento Ventas - 2 años", "value": "-5%", "points": 0 }
      ]
    },
    "block3": {
      "subtotal": 600,
      "normalized": 600,
      "variables": [
        { "name": "Liquidez – Razón Corriente", "value": "1.8", "points": 200 },
        { "name": "Liquidez – Prueba Ácida", "value": "0.95", "points": 0 },
        { "name": "Endeudamiento – Cobertura Intereses", "value": "4.2x", "points": 200 },
        { "name": "Rentabilidad – Margen Neto", "value": "Estable", "points": 100 },
        { "name": "Rentabilidad – ROE", "value": "Mayor que costo de oportunidad", "points": 100 }
      ]
    }
  },
  "dimensions": [
    { "name": "Rentabilidad", "status": "green", "verdict": "Utilidad positiva de $..." },
    { "name": "Liquidez", "status": "yellow", "verdict": "Razón corriente de 1.8..." },
    { "name": "Flujo", "status": "green", "verdict": "Ventas mensuales promedio..." },
    { "name": "Endeudamiento", "status": "yellow", "verdict": "Endeudamiento general de..." },
    { "name": "Historial Crediticio", "status": "green", "verdict": "Experian 322 neutralizado, comportamiento de pago sano..." },
    { "name": "Legitimidad", "status": "green", "verdict": "Empresa con más de 6 años..." }
  ],
  "quota": {
    "netUtilityMonthly": 30000000,
    "riskLevel": "medio",
    "multiplier": 1.5,
    "recommendedQuota": 45000000,
    "recommendedTerm": 45
  },
  "executiveSummary": "Escribe aquí el resumen cualitativo formal para el comité de riesgos en formato markdown (usando negritas, saltos de línea, etc.) analizando el comportamiento crediticio, capacidad de pago, moras, embargos si los hay, y justificando el cupo y plazo recomendados."
}

No agregues texto introductorio ni explicaciones fuera del JSON. Devuelve únicamente el objeto JSON parseable.
`;

        // Realizar la llamada HTTP a Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: promptText }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('[ANALYZE] Error en la API de Gemini:', errText)
            return { error: 'Error en el servicio de IA de Gemini al procesar la solicitud.' }
        }

        const resJson = await response.json()
        const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textResponse) {
            return { error: 'La IA no devolvió un análisis procesable.' }
        }

        // 6. Deserializar el JSON y validar
        const analysisResult = JSON.parse(textResponse.trim())
        const scoreSarc = Number(analysisResult.score || 0)

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
