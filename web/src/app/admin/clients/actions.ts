'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/actions/email'
import WelcomeClientEmail from '@/components/emails/WelcomeClientEmail'
import React from 'react'

const createClientSchema = z.object({
  companyName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  nit: z.string().min(5, 'El NIT debe ser válido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  totalBag: z.coerce.number().min(0, 'El valor de la bolsa debe ser positivo'),
})

export async function createClientAction(formData: FormData) {
  const adminSupabase = createAdminClient()

  const rawData = {
    companyName: formData.get('companyName'),
    nit: formData.get('nit'),
    email: formData.get('email'),
    password: formData.get('password'),
    totalBag: formData.get('totalBag'),
  }

  const validation = createClientSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  const { email, password, companyName, nit, totalBag } = validation.data

  // 1. Crear usuario en Auth
  const { data: user, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: companyName,
      nit: nit,
      total_bag: totalBag,
      role: 'client' // Aunque el trigger lo pone por defecto, aseguramos metadata
    }
  })

  if (authError) {
    return { error: { root: [authError.message] } }
  }

  if (!user.user) {
    return { error: { root: ['Error inesperado al crear usuario'] } }
  }

  // 2. El trigger 'handle_new_user' crea el perfil automáticamente.
  // Opcional: Si el trigger no guardara el NIT, haríamos un update aquí.
  // Pero asumiremos que el trigger es básico (solo company_name) y haremos un update por si acaso
  // para guardar el NIT u otros datos específicos si la tabla profiles los tiene.
  // En nuestro schema actual, profiles no tiene NIT (lo tiene payers).
  // REVISIÓN SCHEMA: profiles tiene: id, email, company_name, role.
  // El NIT es de la empresa deudora (payers), no del cliente (profiles) necesariamente, 
  // O ¿el cliente también tiene NIT? 
  // En el prompt FASE 0, 'profiles' NO tiene NIT. 'payers' SÍ.
  // Sin embargo, es lógico que el Cliente (Empresa usuaria del SaaS) tenga NIT.
  // Si no está en la tabla, no podemos guardarlo. Lo dejaremos en user_metadata.

  // 3. Enviar Correo de Bienvenida con Credenciales
  // Construir la URL base dinámicamente o desde variables de entorno
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const loginUrl = `${baseUrl}/login`

  try {
    const result = await sendEmail({
      to: email,
      subject: 'Bienvenido a Avalia SaaS - Credenciales de Acceso',
      react: WelcomeClientEmail({
        companyName: companyName,
        email: email,
        loginUrl: loginUrl,
        password: password // NOTA: En producción idealmente enviaríamos un link de activación/reset password
      }) as React.ReactElement
    })

    if (!result.success) {
      console.error('Error enviando email de bienvenida:', result.error)
      // No fallamos la creación del usuario, pero logueamos el error
    } else {
      console.log(`[AUDIT] Email de bienvenida enviado a ${email}`)
    }

  } catch (err) {
    console.error('Excepción enviando email de bienvenida:', err)
  }

  revalidatePath('/admin/clients')
  redirect('/admin/clients')
}
