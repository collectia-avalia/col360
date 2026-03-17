'use server'

import React from 'react'

import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/supabase/profile'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/actions/email'
import InvitePayerEmail from '@/components/emails/InvitePayerEmail'
import ConfirmPayerCreationEmail from '@/components/emails/ConfirmPayerCreationEmail'

const payerSchema = z.object({
  razonSocial: z.string().min(3),
  contactName: z.string().min(3),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email(),
  nit: z.string().optional(),
  authContact: z.literal('on'),
})

// Esquema de validacion para edicion
const UpdatePayerSchema = z.object({
  id: z.string().uuid(),
  razon_social: z.string().min(1, "La razon social es obligatoria"),
  contact_name: z.string().min(3, "El nombre de contacto es obligatorio").optional(),
  contact_phone: z.string().min(7, "El celular es obligatorio").optional(),
  contact_email: z.string().email().optional(),
})

export async function createPayerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  // 1. Validar Datos Basicos
  const rawData = {
    razonSocial: formData.get('razonSocial'),
    contactName: formData.get('contactName'),
    contactPhone: formData.get('contactPhone'),
    contactEmail: formData.get('contactEmail'),
    nit: formData.get('nit') || undefined,
    authContact: formData.get('auth_contact'),
  }

  const validation = payerSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: 'Datos invalidos', details: validation.error.flatten().fieldErrors }
  }

  const { razonSocial, contactName, contactPhone, contactEmail, nit } = validation.data

  // --- COMPROBACIÓN DE NIT DUPLICADO ---
  if (nit) {
    const { data: existingPayer } = await supabase
      .from('payers')
      .select('id, razon_social')
      .eq('nit', nit)
      .eq('created_by', user.id)
      .maybeSingle()

    if (existingPayer) {
      return { 
        error: `Ya tienes registrado un cliente con el NIT ${nit} (${existingPayer.razon_social}).` 
      }
    }
  }
  // -------------------------------------

  // --- BLINDAJE DE PERFIL ---
  const profileResult = await ensureUserProfile(supabase, user.id)
  if (!profileResult.success) {
    return { error: 'Error de integridad: ' + profileResult.error }
  }
  // --------------------------

  const finalNit = nit || `PENDING-${Date.now()}`
  const invitationToken = crypto.randomUUID()

  // INSERTAR EN TABLA PAYERS (Sin crear usuario en Auth)
  const { data: payer, error: payerError } = await supabase
    .from('payers')
    .insert({
      razon_social: razonSocial,
      nit: finalNit,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      created_by: user.id,
      risk_status: 'pendiente',
      invitation_status: 'sent',
      invitation_token: invitationToken,
      terms_accepted: true
    })
    .select()
    .single()

  if (payerError) {
    console.error('Error creando pagador:', payerError)
    return { error: 'Error al guardar el pagador: ' + payerError.message }
  }

  // Construir URL del formulario directo
  let baseUrl = 'http://localhost:3000'
  if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`
  }

  const formularioLink = `${baseUrl}/formulario/${invitationToken}`

  // Enviar correo con link directo al formulario
  try {
    const result = await sendEmail({
      to: contactEmail,
      subject: 'Completa tu Estudio de Credito - Avalia',
      react: InvitePayerEmail({
        razonSocial: razonSocial,
        inviterEmail: user.email || 'Avalia',
        inviteLink: formularioLink,
      }) as React.ReactElement
    })

    if (!result.success) {
      console.error('Error enviando email de invitacion:', result.error)
    } else {
      console.log(`[AUDIT] Invitacion enviada a ${contactEmail}`)
    }

  } catch (err) {
    console.error('Excepcion enviando email de invitacion:', err)
  }

  // Enviar correo de confirmacion al admin
  if (user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Confirmacion de Registro de Pagador - Avalia SaaS',
        react: ConfirmPayerCreationEmail({
          payerName: razonSocial,
          payerEmail: contactEmail,
          userName: user.email
        }) as React.ReactElement
      })
      console.log(`[AUDIT] Email de confirmacion enviado al usuario ${user.email}`)
    } catch (err) {
      console.error('Error enviando email de confirmacion al usuario:', err)
    }
  }

  revalidatePath('/dashboard/payers')
  return { success: true, message: `Invitacion enviada correctamente a ${contactEmail}` }
}

export async function deletePayerAction(payerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { count, error: countError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('payer_id', payerId)

  if (countError) {
    console.error('Error verificando facturas:', countError)
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
    console.error('Error eliminando pagador:', error)
    return { error: 'Error eliminando el cliente' }
  }

  revalidatePath('/dashboard/payers')
  return { success: true }
}

export async function updatePayerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const rawFormData = {
    id: formData.get('id')?.toString(),
    razon_social: formData.get('razon_social')?.toString(),
    contact_name: formData.get('contact_name')?.toString() || undefined,
    contact_phone: formData.get('contact_phone')?.toString() || undefined,
    contact_email: formData.get('contact_email')?.toString() || undefined,
  }

  const validatedFields = UpdatePayerSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Error de validacion Zod:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Datos invalidos (Revisa consola del servidor)' }
  }

  const { id, ...dataToUpdate } = validatedFields.data

  const { error } = await supabase
    .from('payers')
    .update(dataToUpdate)
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error actualizando pagador:', error)
    return { error: 'Error actualizando el cliente' }
  }

  revalidatePath('/dashboard/payers')
  return { success: true }
}

export async function resendPayerInvitationAction(payerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // 1. Obtener datos del pagador
  const { data: payer, error: fetchError } = await supabase
    .from('payers')
    .select('*')
    .eq('id', payerId)
    .single()

  if (fetchError || !payer) {
    return { error: 'Payer no encontrado' }
  }

  // 2. Usar el token existente
  const invitationToken = payer.invitation_token

  // 3. Construir URL
  let baseUrl = 'http://localhost:3000'
  if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`
  }

  const formularioLink = `${baseUrl}/formulario/${invitationToken}`

  // 4. Enviar Email
  try {
    const result = await sendEmail({
      to: payer.contact_email,
      subject: 'Recordatorio: Completa tu Estudio de Credito - Avalia',
      react: React.createElement(InvitePayerEmail, {
        razonSocial: payer.razon_social,
        inviterEmail: user.email || 'Avalia',
        inviteLink: formularioLink,
      })
    })

    if (!result.success) {
      console.error('Error enviando email:', result.error)
      return { error: 'Error enviando el correo' }
    }

    return { success: true, message: `Invitación reenviada a ${payer.contact_email}` }
  } catch (err) {
    console.error('Error reenviando invitación:', err)
    return { error: 'Excepción al enviar el correo' }
  }
}
