'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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
        approved_quota: 0
      })
      .eq('id', payerId)

    if (error) return { error: 'Error al rechazar: ' + error.message }
  }

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/approvals/${payerId}`)
  redirect('/admin/approvals')
}
