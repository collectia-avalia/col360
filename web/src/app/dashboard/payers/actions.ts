'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789') // Placeholder seguro

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

  // 3. Enviar Correo con Resend
  console.log(`[EMAIL] Enviando invitación a ${contactEmail}...`)
  
  try {
    const { data, error: emailError } = await resend.emails.send({
        from: 'Avalia SaaS <onboarding@resend.dev>', // Usar dominio verificado en Prod
        to: [contactEmail],
        subject: 'Invitación al Portal de Pagos - Avalia',
        html: `
            <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Bienvenido a Avalia</h2>
                <p>Hola <strong>${razonSocial}</strong>,</p>
                <p><strong>${user.email}</strong> te ha invitado a gestionar tus facturas y cupos en nuestra plataforma.</p>
                <p>Para completar tu registro y acceder al portal, por favor haz clic en el siguiente enlace:</p>
                <div style="margin: 24px 0;">
                    <a href="http://localhost:3000/invite/${invitationToken}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Aceptar Invitación
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Si no esperabas este correo, puedes ignorarlo.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">© 2024 Avalia SaaS. Todos los derechos reservados.</p>
            </div>
        `
    })

    if (emailError) {
        console.error('Error enviando email (Resend):', emailError)
        // No bloqueamos el flujo, pero logueamos
    } else {
        console.log('Email enviado exitosamente:', data)
    }
  } catch (err) {
      console.error('Excepción enviando email:', err)
  }

  revalidatePath('/dashboard/payers')
  redirect('/dashboard/payers')
}
