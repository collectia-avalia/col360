'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const createClientSchema = z.object({
  companyName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  nit: z.string().min(5, 'El NIT debe ser válido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function createClientAction(formData: FormData) {
  const adminSupabase = createAdminClient()

  const rawData = {
    companyName: formData.get('companyName'),
    nit: formData.get('nit'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validation = createClientSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors }
  }

  const { email, password, companyName, nit } = validation.data

  // 1. Crear usuario en Auth
  const { data: user, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_name: companyName,
      nit: nit,
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

  revalidatePath('/admin/clients')
  redirect('/admin/clients')
}
