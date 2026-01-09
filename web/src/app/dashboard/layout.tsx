import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutWrapper } from '@/components/layouts/DashboardLayoutWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Obtener datos del perfil o metadata
  let companyName = 'Empresa'
  const email = user?.email || ''
  let fullName = ''
  
  if (user) {
     const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user.id)
        .single()
     
     companyName = profile?.company_name || user.user_metadata?.company_name || 'Empresa'
     fullName = profile?.full_name || companyName
  }

  const initials = companyName.substring(0, 2).toUpperCase()

  return (
    <DashboardLayoutWrapper
      email={email}
      initial={initials}
      fullName={fullName}
      companyName={companyName}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
