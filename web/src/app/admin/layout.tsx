import { createClient } from '@/lib/supabase/server'
import { AdminLayoutWrapper } from '@/components/layouts/AdminLayoutWrapper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const email = user?.email || 'Superadmin'
  const initial = email[0].toUpperCase()
  // Fetch full name from profiles if available
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single()
  const fullName = profile?.full_name || email.split('@')[0]

  return (
    <AdminLayoutWrapper 
      email={email} 
      initial={initial} 
      fullName={fullName}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
