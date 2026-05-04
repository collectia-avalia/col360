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
  maxExposure: z.coerce.number().min(0).max(100).default(100),
})

export async function createClientAction(formData: FormData) {
  const adminSupabase = createAdminClient()

  const rawData = {
    companyName: formData.get('companyName'),
    nit: formData.get('nit'),
    email: formData.get('email'),
    password: formData.get('password'),
    totalBag: formData.get('totalBag'),
    maxExposure: formData.get('maxExposure'),
  }

  const validation = createClientSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  const { email, password, companyName, nit, totalBag, maxExposure } = validation.data

  // 0. Crear Empresa
  const { data: company, error: companyError } = await adminSupabase
    .from('companies')
    .insert({ name: companyName, nit: nit })
    .select()
    .single()

  if (companyError || !company) {
    return { error: { root: ['Error creando la empresa: ' + companyError?.message] } }
  }

  // 1. Crear usuario en Auth
  const { data: user, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: companyName,
      nit: nit,
      total_bag: totalBag,
      max_exposure: maxExposure,
      role: 'superadmin', // El primer usuario es siempre superadmin
      company_id: company.id
    }
  })

  if (authError) {
    return { error: { root: [authError.message] } }
  }

  if (!user.user) {
    return { error: { root: ['Error inesperado al crear usuario'] } }
  }

  // 2. Verificar si el perfil se creó automáticamente (vía trigger)
  // Agregamos un pequeño reintento o verificación directa para evitar fallos silenciosos
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', user.user.id)
    .single()

  if (!profile) {
    console.log(`[AUDIT] Trigger falló para ${email}. Creando perfil manualmente...`)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: user.user.id,
        email: email,
        company_name: companyName,
        role: 'superadmin',
        nit: nit,
        total_bag: totalBag,
        max_exposure: maxExposure,
        company_id: company.id
      })

    if (profileError) {
      console.error('Error crítico: No se pudo crear ni el perfil manual:', profileError)
      // Opcional: Podríamos borrar el usuario de Auth aquí, pero es mejor dejarlo para debugging
    }
  } else {
    // Si el perfil existe pero queremos asegurar que campos como NIT o bolsa estén actualizados
    // (por si el trigger es una versión antigua que no los incluía)
    await adminSupabase
      .from('profiles')
      .update({
        nit: nit,
        total_bag: totalBag,
        max_exposure: maxExposure
      })
      .eq('id', user.user.id)
  }

  // 3. Enviar Correo de Bienvenida con Credenciales
  // Construir la URL base dinámicamente o desde variables de entorno
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
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
