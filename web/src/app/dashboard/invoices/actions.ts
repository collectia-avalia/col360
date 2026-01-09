'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  payerId: z.string().uuid(),
  amount: z.string(), // Input number string
  issueDate: z.string(),
  dueDate: z.string(),
  fundsOrigin: z.literal('on'),
  factoringTerms: z.literal('on'),
})

export async function createInvoiceAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // 1. Validar Datos
  const rawData = {
    invoiceNumber: formData.get('invoiceNumber'),
    payerId: formData.get('payerId'),
    amount: formData.get('amount'),
    issueDate: formData.get('issueDate'),
    dueDate: formData.get('dueDate'),
    fundsOrigin: formData.get('funds_origin'),
    factoringTerms: formData.get('factoring_terms'),
  }

  const wantsGuarantee = formData.get('wantsGuarantee') === 'on'

  const validation = invoiceSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors }
  }

  const { invoiceNumber, payerId, amount, issueDate, dueDate } = validation.data
  const numericAmount = parseFloat(amount)

  // 2. Lógica de Negocio: Calcular Garantía
  // Consultar Pagador
  const { data: payer, error: payerError } = await supabase
    .from('payers')
    .select('risk_status, approved_quota')
    .eq('id', payerId)
    .single()

  if (payerError || !payer) {
    return { error: 'Error consultando el pagador' }
  }

  // Regla: Aprobado Y Cupo Suficiente Y Solicitado por Usuario
  const isGuaranteed = 
    wantsGuarantee &&
    payer.risk_status === 'aprobado' && 
    (payer.approved_quota || 0) >= numericAmount

  // 3. Subir Archivo
  const file = formData.get('fileInvoice') as File
  let fileUrl = null

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${payerId}/${invoiceNumber}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('invoices-docs')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error subiendo factura:', uploadError)
      return { error: 'Error subiendo el archivo de la factura' }
    }
    
    // Construir URL pública o privada (en este caso guardamos el path)
    fileUrl = filePath
  } else {
      return { error: 'Debes subir el archivo de la factura (PDF/XML)' }
  }

  // 4. Guardar Factura
  const { error: insertError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      payer_id: payerId,
      client_id: user.id,
      amount: numericAmount,
      issue_date: issueDate,
      due_date: dueDate,
      file_url: fileUrl,
      status: 'vigente',
      is_guaranteed: isGuaranteed,
      legal_declarations: {
        funds_origin: true,
        factoring_terms: true,
        accepted_at: new Date().toISOString(),
        ip_address: 'request_ip_placeholder' // En Next.js App Router obtener la IP requiere headers(), lo omitimos por ahora
      }
    })

  if (insertError) {
    console.error('Error guardando factura:', insertError)
    return { error: 'Error guardando la factura en base de datos' }
  }

  // Retornamos el estado para mostrar feedback en el cliente
  // No redirigimos inmediatamente para poder mostrar el Toast, 
  // o redirigimos con un parámetro de query.
  // El prompt pide: "Si la factura se radica exitosamente, muestra un Toast... Diferenciación: Si quedó Garantizada..."
  // La mejor forma con Server Actions + Redirección es usar cookies o query params.
  // Usaré query param: ?status=success&guaranteed=true
  
  revalidatePath('/dashboard/invoices')
  redirect(`/dashboard/invoices?status=success&guaranteed=${isGuaranteed}`)
}

export async function toggleInvoiceStatus(invoiceId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('invoices')
    .update({ status: newStatus })
    .eq('id', invoiceId)
    .eq('client_id', user.id)

  if (error) {
    return { error: 'Error actualizando estado' }
  }

  revalidatePath('/dashboard/invoices')
  return { success: true }
}
