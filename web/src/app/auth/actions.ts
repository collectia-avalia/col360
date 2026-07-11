'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/actions/email'
import { headers } from 'next/headers'


export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function sendPasswordResetEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El correo electrónico es requerido' }
  }

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Ambas contraseñas son requeridas' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function requestSignupOtpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyName = formData.get('companyName') as string
  const nit = formData.get('nit') as string
  const contactName = formData.get('contactName') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  if (!email || !password || !companyName || !nit || !contactName || !phone || !address) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Validar que el correo no esté ya registrado en auth
    const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      console.error('[SIGNUP_OTP] Error al listar usuarios:', listError.message)
    }
    const emailExists = listUsers?.users?.some(u => u.email === email)
    if (emailExists) {
      return { error: 'Este correo electrónico ya está registrado.' }
    }

    // 2. Generar OTP de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString() // 15 minutos

    const signupData = {
      email,
      password,
      companyName,
      nit,
      contactName,
      phone,
      address
    }

    // 3. Guardar en la tabla signup_otps (upsert en caso de que reenvíe)
    const { error: dbError } = await supabaseAdmin
      .from('signup_otps')
      .upsert({
        email,
        otp_code: otpCode,
        signup_data: signupData,
        expires_at: expiresAt
      })

    if (dbError) {
      console.error('[SIGNUP_OTP] Error guardando OTP en base de datos:', dbError.message)
      return { error: 'Error interno del servidor. Por favor intenta más tarde.' }
    }

    // 4. Enviar OTP por correo al usuario
    await sendEmail({
      to: email,
      subject: `Código de verificación de registro - Avalia`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px; font-weight: 800;">Verifica tu Registro en Avalia</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hola <strong>${contactName}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Estás a un paso de registrar a tu empresa <strong>${companyName}</strong> en Avalia.</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Utiliza el siguiente código de verificación de 6 dígitos para completar tu registro:</p>
          <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 0.4em; color: #1e293b; font-family: monospace; padding-left: 0.4em;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">Este código expirará en 15 minutos por seguridad.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">Mensaje automático enviado por Avalia SaaS. Todos los derechos reservados.</p>
        </div>
      `
    })
    console.log(`[SIGNUP_OTP_DEBUG] OTP enviado exitosamente para ${email}: ${otpCode}`)
  } catch (err: any) {
    console.error('[SIGNUP_OTP] Excepción crítica en registro OTP:', err.message || err)
    return { error: 'No se pudo enviar el correo de verificación. Revisa el correo o intenta nuevamente.' }
  }

  return { success: true }
}

export async function verifySignupOtpAction(email: string, otpCode: string) {
  if (!email || !otpCode) {
    return { error: 'Faltan datos de verificación' }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Consultar el OTP y los datos en signup_otps
  const { data: record, error: dbError } = await supabaseAdmin
    .from('signup_otps')
    .select('*')
    .eq('email', email)
    .single()

  if (dbError || !record) {
    return { error: 'Código de verificación no válido o expirado.' }
  }

  if (record.otp_code !== otpCode) {
    return { error: 'El código ingresado es incorrecto.' }
  }

  if (new Date(record.expires_at) < new Date()) {
    return { error: 'El código de verificación ha expirado. Solicita uno nuevo.' }
  }

  const signupData = record.signup_data

  try {
    // 2. Crear el usuario en Supabase Auth de forma pre-confirmada (email_confirm: true)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: signupData.email,
      password: signupData.password,
      email_confirm: true,
      user_metadata: {
        company_name: signupData.companyName,
        nit: signupData.nit,
        contact_name: signupData.contactName,
        phone: signupData.phone,
        address: signupData.address,
        role: 'admin' // Administrador de la empresa inquilina
      }
    })

    if (authError || !authData.user) {
      console.error('[SIGNUP_OTP] Error creando usuario en Supabase Auth:', authError?.message)
      return { error: `Error de registro: ${authError?.message || 'No se pudo crear el usuario'}` }
    }

    // 3. Eliminar el OTP temporal para no dejar registros basura
    await supabaseAdmin
      .from('signup_otps')
      .delete()
      .eq('email', email)

    // 4. Iniciar sesión automáticamente en el servidor
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: signupData.email,
      password: signupData.password
    })

    if (signInError) {
      console.error('[SIGNUP_OTP] Error al loguear usuario automáticamente:', signInError.message)
      // Redirigir a login para ingreso manual si falla el autologin
      return { success: true, redirect: '/login?signup=success' }
    }

    return { success: true, redirect: '/dashboard' }
  } catch (err: any) {
    console.error('[SIGNUP_OTP] Error en verificación de OTP:', err.message || err)
    return { error: 'Error inesperado durante la verificación del registro.' }
  }
}

