'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { tenantOrError } from '@/lib/auth/guards'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  fullName: z.string().min(3, 'Nombre requerido'),
  role: z.enum(['superadmin', 'comercial', 'cartera'])
})

export async function createCompanyUserAction(formData: FormData) {
  // 1. Solo el Superadmin de una empresa gestiona su equipo
  const auth = await tenantOrError('superadmin')
  if ('error' in auth) return { error: 'No autorizado. Solo el Superadmin de la empresa puede gestionar usuarios.' }
  const { companyId, profile } = auth

  const adminSupabase = createAdminClient()

  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  }

  const validation = createUserSchema.safeParse(rawData)
  if (!validation.success) {
    return { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors }
  }

  const { email, password, fullName, role } = validation.data

  const { data: company } = await adminSupabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle()
  const companyName = company?.name || profile.company_name

  // 2. Crear usuario en Auth. Rol y compañía en app_metadata (no editable por el usuario).
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      company_name: companyName,
    },
    app_metadata: {
      role,
      company_id: companyId,
    },
  })

  if (authError) {
    console.error('Error Auth:', authError)
    return { error: 'Error al crear usuario: ' + authError.message }
  }

  // 3. Perfil explícito (upsert): no depende de la versión del trigger handle_new_user
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: newUser.user.id,
      email: email,
      full_name: fullName,
      company_id: companyId,
      role: role,
      company_name: companyName
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Error Profile:', profileError)
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Error al crear el perfil del usuario.' }
  }

  revalidatePath('/dashboard/settings/users')
  return { success: true }
}

export async function deleteCompanyUserAction(userId: string) {
    const auth = await tenantOrError('superadmin')
    if ('error' in auth) return { error: 'No autorizado' }
    const { companyId, profile } = auth

    // No permitirse borrar a sí mismo
    if (userId === profile.id) {
        return { error: 'No puedes eliminarte a ti mismo' }
    }

    const adminSupabase = createAdminClient()

    // Verificar que el usuario a borrar pertenezca a la misma empresa
    const { data: targetUser } = await adminSupabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', userId)
        .maybeSingle()

    if (!targetUser || targetUser.company_id !== companyId || targetUser.role === 'admin') {
        return { error: 'Usuario no pertenece a tu empresa' }
    }

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
        return { error: 'Error al eliminar usuario: ' + deleteError.message }
    }

    revalidatePath('/dashboard/settings/users')
    return { success: true }
}
