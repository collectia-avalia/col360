'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, escapeHtml } from '@/lib/email/send'
import { generateOtp, hashOtp, verifyOtp, nextSendWindow, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp'


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

  // Origen fijo: el header Host lo controla el cliente
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Paso 1 del registro freemium. La contraseña NO se envía ni se guarda aquí:
 * el navegador la conserva y la manda en el paso 2 junto con el código.
 */
export async function requestSignupOtpAction(formData: FormData) {
  const field = (name: string) => {
    const value = formData.get(name)
    return typeof value === 'string' ? value.trim().slice(0, 200) : ''
  }
  const email = field('email').toLowerCase()
  const companyName = field('companyName')
  const nit = field('nit')
  const contactName = field('contactName')
  const phone = field('phone')
  const address = field('address')

  if (!email || !companyName || !nit || !contactName || !phone || !address) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (!EMAIL_RE.test(email)) {
    return { error: 'Correo electrónico inválido' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Validar que el correo no esté ya registrado
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()
    if (existingProfile) {
      return { error: 'Este correo electrónico ya está registrado.' }
    }

    // 2. Límite de envíos por correo
    const { data: current } = await supabaseAdmin
      .from('signup_otps')
      .select('sent_count, window_started_at')
      .eq('email', email)
      .maybeSingle()

    const window = nextSendWindow(current)
    if (!window) {
      return { error: 'Has solicitado demasiados códigos. Intenta de nuevo en una hora.' }
    }

    // 3. Guardar solo el hash del código y los datos de empresa (sin contraseña)
    const otpCode = generateOtp()
    const { error: dbError } = await supabaseAdmin
      .from('signup_otps')
      .upsert({
        email,
        otp_code: hashOtp(`signup:${email}`, otpCode),
        signup_data: { companyName, nit, contactName, phone, address },
        expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
        attempts: 0,
        ...window,
      })

    if (dbError) {
      console.error('[SIGNUP_OTP] Error guardando OTP en base de datos:', dbError)
      return { error: 'No se pudo iniciar el registro. Intenta de nuevo.' }
    }

    // 4. Enviar OTP por correo al usuario
    const emailResult = await sendEmail({
      to: email,
      subject: `Código de verificación de registro - Avalia`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px; font-weight: 800;">Verifica tu Registro en Avalia</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hola <strong>${escapeHtml(contactName)}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Estás a un paso de registrar a tu empresa <strong>${escapeHtml(companyName)}</strong> en Avalia.</p>
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

    if (!emailResult.success) {
      console.error('[SIGNUP_OTP] Error al enviar email:', emailResult.error)
      return { error: 'No se pudo enviar el código a tu correo. Verifica la dirección e intenta de nuevo.' }
    }
  } catch (err: unknown) {
    console.error('[SIGNUP_OTP] Excepción crítica en registro OTP:', err)
    return { error: 'Error inesperado al iniciar el registro.' }
  }

  return { success: true }
}

/** Paso 2: valida el código y crea la cuenta con la contraseña que envía el navegador. */
export async function verifySignupOtpAction(rawEmail: string, otpCode: string, password: string) {
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  if (!email || !otpCode) {
    return { error: 'Faltan datos de verificación' }
  }

  if (typeof password !== 'string' || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Consultar el OTP y los datos en signup_otps
  const { data: record } = await supabaseAdmin
    .from('signup_otps')
    .select('otp_code, signup_data, expires_at, attempts')
    .eq('email', email)
    .maybeSingle()

  if (!record) {
    return { error: 'Código de verificación no válido o expirado.' }
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { error: 'Demasiados intentos. Solicita un nuevo código.' }
  }

  if (new Date(record.expires_at) < new Date()) {
    return { error: 'El código de verificación ha expirado. Solicita uno nuevo.' }
  }

  if (!verifyOtp(`signup:${email}`, otpCode, record.otp_code)) {
    await supabaseAdmin
      .from('signup_otps')
      .update({ attempts: record.attempts + 1 })
      .eq('email', email)
    return { error: 'El código ingresado es incorrecto.' }
  }

  const signupData = record.signup_data as {
    companyName: string; nit: string; contactName: string; phone: string; address: string
  }

  try {
    // 2. Crear el usuario pre-confirmado. El rol va en app_metadata (no editable por el usuario).
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name: signupData.companyName,
        nit: signupData.nit,
        contact_name: signupData.contactName,
        phone: signupData.phone,
        address: signupData.address,
      },
      app_metadata: { role: 'client' },
    })

    if (authError || !authData.user) {
      console.error('[SIGNUP_OTP] Error creando usuario en Supabase Auth:', authError)
      return { error: 'No se pudo crear la cuenta. Si ya estás registrado, inicia sesión.' }
    }

    // 3. Perfil explícito (no depende de la versión del trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        company_name: signupData.companyName,
        nit: signupData.nit,
        full_name: signupData.contactName,
        role: 'client',
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[SIGNUP_OTP] Error creando perfil:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: 'No se pudo crear la cuenta. Intenta de nuevo.' }
    }

    // 4. Eliminar el OTP temporal
    await supabaseAdmin
      .from('signup_otps')
      .delete()
      .eq('email', email)

    // 5. Iniciar sesión automáticamente en el servidor
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      console.error('[SIGNUP_OTP] Error al loguear usuario automáticamente:', signInError.message)
      return { success: true, redirect: '/login?signup=success' }
    }

    return { success: true, redirect: '/dashboard' }
  } catch (err: unknown) {
    console.error('[SIGNUP_OTP] Error en verificación de OTP:', err)
    return { error: 'Error inesperado durante la verificación del registro.' }
  }
}
