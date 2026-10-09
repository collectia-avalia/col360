'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { denyUnlessPlatformAdmin } from '@/lib/auth/guards'
import { sendEmail } from '@/lib/email/send'
import WelcomeClientEmail from '@/components/emails/WelcomeClientEmail'
import React from 'react'

const createClientSchema = z.object({
  companyName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  nit: z.string().min(5, 'El NIT debe ser válido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  totalBag: z.coerce.number().min(0, 'El valor de la bolsa debe ser positivo'),
  maxExposure: z.coerce.number().min(0).max(100).default(100),
  creditStudyFee: z.coerce.number().min(0, 'El valor del estudio debe ser positivo').default(0),
})

export async function createClientAction(formData: FormData) {
  const denied = await denyUnlessPlatformAdmin()
  if (denied) return { error: { root: [denied.error] } }

  const adminSupabase = createAdminClient()

  const rawData = {
    companyName: formData.get('companyName'),
    nit: formData.get('nit'),
    email: formData.get('email'),
    password: formData.get('password'),
    totalBag: formData.get('totalBag'),
    maxExposure: formData.get('maxExposure'),
    creditStudyFee: formData.get('creditStudyFee'),
  }

  const validation = createClientSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  const { email, password, companyName, nit, totalBag, maxExposure, creditStudyFee } = validation.data

  // 0. Crear Empresa
  const { data: company, error: companyError } = await adminSupabase
    .from('companies')
    .insert({ 
      name: companyName, 
      nit: nit,
      credit_study_fee: creditStudyFee 
    })
    .select()
    .single()

  if (companyError || !company) {
    return { error: { root: ['Error creando la empresa: ' + companyError?.message] } }
  }

  // 1. Crear usuario en Auth. Rol y compañía van en app_metadata (solo service_role
  //    puede escribirlo); user_metadata es editable por el propio usuario.
  const { data: user, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: companyName,
      nit: nit,
    },
    app_metadata: {
      role: 'superadmin', // El primer usuario de la empresa es su superadmin
      company_id: company.id,
    },
  })

  if (authError) {
    return { error: { root: [authError.message] } }
  }

  if (!user.user) {
    return { error: { root: ['Error inesperado al crear usuario'] } }
  }

  // 2. Perfil explícito: no depende de la versión del trigger handle_new_user
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: user.user.id,
      email: email,
      company_name: companyName,
      role: 'superadmin',
      nit: nit,
      total_bag: totalBag,
      max_exposure: maxExposure,
      credit_study_fee: creditStudyFee,
      company_id: company.id
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Error crítico creando el perfil del cliente:', profileError)
    await adminSupabase.auth.admin.deleteUser(user.user.id)
    return { error: { root: ['No se pudo crear el perfil del cliente.'] } }
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
