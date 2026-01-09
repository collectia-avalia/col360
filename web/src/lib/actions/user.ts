'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  // Nota: La foto de perfil requeriría subida a Storage, por simplicidad en este paso solo actualizamos texto
  // Si se implementa foto, sería un proceso de dos pasos: subir a storage -> obtener URL -> guardar en profile.

  try {
    // 1. Actualizar Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        // company_name: companyName // Si aplica
      })
      .eq('id', user.id)

    if (profileError) throw new Error(profileError.message)

    // 2. Actualizar Email (si cambió) - Requiere confirmación normalmente
    if (email && email !== user.email) {
       const { error: authError } = await supabase.auth.updateUser({ email })
       if (authError) throw new Error(authError.message)
    }

    // 3. Actualizar Contraseña (si se proporcionó)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password) {
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }
      
      const { error: passwordError } = await supabase.auth.updateUser({ password })
      if (passwordError) throw new Error(passwordError.message)
    }

    revalidatePath('/')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado al actualizar el perfil.'
    return { error: message }
  }
}
