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
    if (!amount || parseFloat(amount) <= 0) {
      return { error: 'Debes asignar un cupo válido para aprobar.' }
    }

    const { error } = await supabase
      .from('payers')
      .update({
        risk_status: 'aprobado',
        approved_quota: parseFloat(amount)
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
