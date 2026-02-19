'use server'

import React from 'react'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/actions/email'
import { InvoiceEmail } from '@/components/emails/InvoiceEmail'

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

  // Consultar Uso Actual del Cupo (Sumar guaranteed_amount de facturas vigentes)
  const { data: activeInvoices, error: quotaError } = await supabase
    .from('invoices')
    .select('guaranteed_amount')
    .eq('payer_id', payerId)
    .neq('status', 'pagada')
    .eq('is_guaranteed', true)

  const usedQuota = activeInvoices?.reduce((sum, inv) => sum + (inv.guaranteed_amount || 0), 0) || 0
  const availableQuota = (payer.approved_quota || 0) - usedQuota

  let isGuaranteed = false
  let guaranteedAmount = 0
  let warningMessage = null

  if (wantsGuarantee && payer.risk_status === 'aprobado') {
    if (availableQuota >= numericAmount) {
      // Caso A: Cupo Total
      isGuaranteed = true
      guaranteedAmount = numericAmount
    } else if (availableQuota > 0) {
      // Caso B: Garantía Parcial
      isGuaranteed = true
      guaranteedAmount = availableQuota

      const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
      warningMessage = `Factura parcialmente garantizada por límite de cupo (${formatter.format(guaranteedAmount)} de ${formatter.format(numericAmount)})`
    } else {
      // Caso C: Sin Cupo
      isGuaranteed = false
      guaranteedAmount = 0
      warningMessage = "Sin cupo disponible. Factura radicada en Custodia."
    }
  } else if (wantsGuarantee && payer.risk_status !== 'aprobado') {
    warningMessage = "El pagador no está aprobado para garantías. Factura radicada en Custodia."
  }

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
      guaranteed_amount: guaranteedAmount,
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
  revalidatePath('/dashboard/invoices')

  return {
    success: true,
    message: warningMessage || (isGuaranteed ? "Factura radicada y garantizada exitosamente." : "Factura radicada correctamente."),
    isGuaranteed,
    warningMessage
  }
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

export async function sendInvoiceEmailAction(invoiceId: string, email: string, subject: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Consultar detalles de la factura para la plantilla
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
            invoice_number,
            amount,
            due_date,
            payers (
                social_reason
            )
        `)
    .eq('id', invoiceId)
    .single()

  const payerData = invoice?.payers as any
  const payerName = payerData?.social_reason || (Array.isArray(payerData) && payerData[0]?.social_reason) || 'Cliente'
  const invoiceNumber = invoice?.invoice_number || 'N/A'
  const formattedAmount = invoice?.amount
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(invoice.amount)
    : '$ 0'
  const dueDate = invoice?.due_date || 'N/A'

  try {
    const result = await sendEmail({
      to: email,
      subject: subject,
      react: InvoiceEmail({
        invoiceNumber,
        amount: formattedAmount,
        dueDate,
        payerName,
        message: body
      }) as React.ReactElement
    })

    if (!result.success) {
      console.error('Error enviando email:', result.error)
      return { error: 'Error enviando el correo: ' + result.error }
    }

    console.log(`[AUDIT] Email enviado por ${user.email} para factura ${invoiceId} a ${email}`)

    return { success: true }

  } catch (err) {
    console.error('Excepción enviando email:', err)
    return { error: 'Error inesperado al enviar correo' }
  }
}
