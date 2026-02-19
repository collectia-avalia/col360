'use server'

import React from 'react'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/actions/email'
import InvitePayerEmail from '@/components/emails/InvitePayerEmail'
import ConfirmPayerCreationEmail from '@/components/emails/ConfirmPayerCreationEmail'

const payerSchema = z.object({
  razonSocial: z.string().min(3),
  contactEmail: z.string().email(),
  authContact: z.literal('on'),
})

// Esquema de validación para edición
const UpdatePayerSchema = z.object({
  id: z.string().uuid(),
  razon_social: z.string().min(1, "La razón social es obligatoria"),
  contact_email: z.string().email().optional(),
})

export async function createPayerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  // 1. Validar Datos Básicos
  const rawData = {
    razonSocial: formData.get('razonSocial'),
    contactEmail: formData.get('contactEmail'),
    authContact: formData.get('auth_contact'),
  }

  const validation = payerSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors }
  }

  const { razonSocial, contactEmail } = validation.data

  const tempNit = `PENDING-${Date.now()}`
  const invitationToken = crypto.randomUUID()

  const { data: payer, error: payerError } = await supabase
    .from('payers')
    .insert({
      razon_social: razonSocial,
      nit: tempNit, // Placeholder
      contact_email: contactEmail,
      created_by: user.id,
      risk_status: 'pendiente',
      invitation_status: 'sent',
      invitation_token: invitationToken,
      terms_accepted: true // El cliente aceptó por el pagador inicial
    })
    .select()
    .single()

  if (payerError) {
    console.error('Error creando pagador:', payerError)
    if (payerError.message.includes('column "invitation_status" of relation "payers" does not exist')) {
      return { error: 'Error de base de datos: Faltan migraciones (invitation_status). Contacte soporte.' }
    }
    return { error: 'Error al guardar el pagador: ' + payerError.message }
  }

  // 3. Enviar Correo con Resend
  // Construir la URL base dinámicamente o desde variables de entorno
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const inviteLink = `${baseUrl}/invite/${invitationToken}`

  try {
    const result = await sendEmail({
      to: contactEmail,
      subject: 'Invitación al Portal de Pagos - Avalia',
      react: InvitePayerEmail({
        razonSocial: razonSocial,
        inviterEmail: user.email || 'Un usuario de Avalia',
        inviteLink: inviteLink
      }) as React.ReactElement
    })

    if (!result.success) {
      console.error('Error enviando email de invitación:', result.error)
      // No fallamos la request completa, pero logueamos el error
    } else {
      console.log(`[AUDIT] Invitación enviada a ${contactEmail} por ${user.email}`)
    }

  } catch (err) {
    console.error('Excepción enviando email de invitación:', err)
  }

  // 4. Enviar Correo de Confirmación al Usuario (Cliente)
  // Este correo le avisa al usuario que el proceso de registro del pagador inició correctamente.
  if (user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Confirmación de Registro de Pagador - Avalia SaaS',
        react: ConfirmPayerCreationEmail({
          payerName: razonSocial,
          payerEmail: contactEmail,
          userName: user.email
        }) as React.ReactElement
      })
      console.log(`[AUDIT] Email de confirmación enviado al usuario ${user.email}`)
    } catch (err) {
      console.error('Error enviando email de confirmación al usuario:', err)
      // No bloqueamos el flujo principal si este correo falla
    }
  }

  revalidatePath('/dashboard/payers')
  return { success: true, message: `Invitación enviada correctamente a ${contactEmail}` }
}

export async function deletePayerAction(payerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Check if invoices exist
  const { count, error: countError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('payer_id', payerId)

  if (countError) {
    console.error('Error checking invoices:', countError)
    return { error: 'Error verificando facturas del cliente' }
  }

  if (count && count > 0) {
    return { error: 'No se puede eliminar el cliente porque tiene facturas asociadas. Elimina las facturas primero.' }
  }

  const { error } = await supabase
    .from('payers')
    .delete()
    .eq('id', payerId)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error deleting payer:', error)
    return { error: 'Error eliminando el cliente' }
  }

  revalidatePath('/dashboard/payers')
  return { success: true }
}

export async function updatePayerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // 1. LIMPIEZA DE DATOS (Vital para evitar el error de NULL)
  const rawFormData = {
    id: formData.get('id')?.toString(),
    razon_social: formData.get('razon_social')?.toString(),
    // El truco: Si es null o vacío, enviamos undefined para que Zod lo acepte como opcional
    contact_name: formData.get('contact_name')?.toString() || undefined,
    contact_phone: formData.get('contact_phone')?.toString() || undefined,
    contact_email: formData.get('contact_email')?.toString() || undefined,
  }

  // 2. VALIDAR CON ZOD
  const validatedFields = UpdatePayerSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("❌ Zod Error Detallado:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Datos inválidos (Revisa consola del servidor)' }
  }

  const { id, ...dataToUpdate } = validatedFields.data

  const { error } = await supabase
    .from('payers')
    .update(dataToUpdate)
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error updating payer:', error)
    return { error: 'Error actualizando el cliente' }
  }

  revalidatePath('/dashboard/payers')
  return { success: true }
}
