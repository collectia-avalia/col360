import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResetPasswordForm from './ResetPasswordForm'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  
  // Obtener usuario autenticado (la sesión se establece tras validar el link en el callback)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=invalid_session')
  }

  return <ResetPasswordForm />
}
