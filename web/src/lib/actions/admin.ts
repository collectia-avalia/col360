'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// --- GESTIÓN DE CLIENTES ---

export async function deleteClientAction(userId: string) {
  const supabase = createAdminClient()

  try {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Error eliminando usuario de Auth:', authError)
      return { error: 'Error al eliminar usuario del sistema de autenticación.' }
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
    
    if (profileError) {
        console.warn('Advertencia: Error borrando perfil:', profileError)
    }

    revalidatePath('/admin/clients')
    return { success: true }
  } catch {
    return { error: 'Error inesperado al procesar la solicitud.' }
  }
}

export async function updateClientAction(userId: string, formData: FormData) {
    const supabase = createAdminClient()
    const companyName = formData.get('companyName') as string
    const email = formData.get('email') as string

    try {
        // 1. Actualizar Auth (Email) si cambió
        if (email) {
            const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
                email: email,
                email_confirm: true // Auto-confirmar cambio
            })
            if (authError) throw new Error('Error actualizando email: ' + authError.message)
        }

        // 2. Actualizar Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ company_name: companyName, email: email }) // Sincronizamos email en profile
            .eq('id', userId)
        
        if (profileError) throw new Error('Error actualizando perfil: ' + profileError.message)

        revalidatePath('/admin/clients')
        revalidatePath(`/admin/clients/${userId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error inesperado al procesar la solicitud.'
        return { error: message }
    }
}

// --- GESTIÓN DE APROBACIONES (RIESGO) ---

export async function approvePayerAction(payerId: string, amount: number) {
    const supabase = createAdminClient()

    try {
        const { error } = await supabase
            .from('payers')
            .update({
                risk_status: 'aprobado',
                approved_quota: amount
            })
            .eq('id', payerId)
        
        if (error) throw new Error(error.message)

        revalidatePath('/admin/approvals')
        revalidatePath(`/admin/approvals/${payerId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error inesperado al aprobar pagador.'
        return { error: 'Error aprobando pagador: ' + message }
    }
}

export async function rejectPayerAction(payerId: string, reason: string) {
    const supabase = createAdminClient()

    // Log the reason for audit purposes (even if not stored in DB yet)
    console.log(`Rejecting payer ${payerId} for reason: ${reason}`)

    try {
        // Podríamos guardar el motivo en una columna 'rejection_reason' si existiera
        const { error } = await supabase
            .from('payers')
            .update({
                risk_status: 'rechazado',
                approved_quota: 0
            })
            .eq('id', payerId)
        
        if (error) throw new Error(error.message)

        revalidatePath('/admin/approvals')
        revalidatePath(`/admin/approvals/${payerId}`)
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error inesperado al rechazar pagador.'
        return { error: 'Error rechazando pagador: ' + message }
    }
}
