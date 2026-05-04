'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile } from '@/lib/supabase/profile'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  fullName: z.string().min(3, 'Nombre requerido'),
  role: z.enum(['superadmin', 'comercial', 'cartera'])
})

export async function createCompanyUserAction(formData: FormData) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  
  // 1. Verificar que quien invita sea Superadmin de su empresa
  const currentUserProfile = await getUserProfile(supabase)
  
  if (!currentUserProfile || currentUserProfile.role !== 'superadmin') {
    return { error: 'No autorizado. Solo el Superadmin de la empresa puede gestionar usuarios.' }
  }

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

  // 2. Crear usuario en Auth con el company_id del que invita
  const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      company_id: currentUserProfile.company_id,
      company_name: currentUserProfile.companies?.name || currentUserProfile.company_name,
      role: role
    }
  })

  if (authError) {
    console.error('Error Auth:', authError)
    return { error: 'Error al crear usuario: ' + authError.message }
  }

  // 3. Crear Perfil (El trigger debería hacerlo, pero aseguramos para el nuevo esquema)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .insert({
      id: newUser.user.id,
      email: email,
      full_name: fullName,
      company_id: currentUserProfile.company_id,
      role: role,
      company_name: currentUserProfile.companies?.name || currentUserProfile.company_name
    })

  if (profileError) {
    console.error('Error Profile:', profileError)
    // No fallamos si el trigger ya lo hizo (error de duplicado), pero si es otro error sí
    if (!profileError.message.includes('duplicate key')) {
        return { error: 'Error al crear perfil: ' + profileError.message }
    }
  }

  revalidatePath('/dashboard/settings/users')
  return { success: true }
}

export async function deleteCompanyUserAction(userId: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    const currentUserProfile = await getUserProfile(supabase)
    if (!currentUserProfile || currentUserProfile.role !== 'superadmin') {
      return { error: 'No autorizado' }
    }

    // No permitirse borrar a sí mismo
    if (userId === currentUserProfile.id) {
        return { error: 'No puedes eliminarte a ti mismo' }
    }

    // Verificar que el usuario a borrar pertenezca a la misma empresa
    const { data: targetUser } = await adminSupabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single()

    if (!targetUser || targetUser.company_id !== currentUserProfile.company_id) {
        return { error: 'Usuario no pertenece a tu empresa' }
    }

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)
    
    if (deleteError) {
        return { error: 'Error al eliminar usuario: ' + deleteError.message }
    }

    revalidatePath('/dashboard/settings/users')
    return { success: true }
}
