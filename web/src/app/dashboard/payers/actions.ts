'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const payerSchema = z.object({
  razonSocial: z.string().min(3),
  contactEmail: z.string().email(),
  authContact: z.literal('on'), // Checkbox value
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

  // Generar NIT Temporal (Placeholder para que pase la restricción NOT NULL si la migración no corrió)
  // En producción real, la migración haría la columna NULLABLE.
  // Aquí usamos un placeholder único.
  const tempNit = `PENDING-${Date.now()}`

  // 2. Crear Pagador en BD (Modo Invitación)
  // Intentamos insertar con los nuevos campos. Si falla (porque no existen), fallará la acción.
  // Asumimos que la migración se aplicará.
  
  // Generar Token (Mock)
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
    // Fallback por si las columnas nuevas no existen aun
    if (payerError.message.includes('column "invitation_status" of relation "payers" does not exist')) {
         return { error: 'Error de base de datos: Faltan migraciones (invitation_status). Contacte soporte.' }
    }
    return { error: 'Error al guardar el pagador: ' + payerError.message }
  }

  // 3. Simular Envío de Correo
  console.log(`[EMAIL MOCK] Enviando invitación a ${contactEmail} para completar datos de ${razonSocial}. Token: ${invitationToken}`)
  // Aquí iría la integración con Resend/SendGrid

  revalidatePath('/dashboard/payers')
  redirect('/dashboard/payers')
}
