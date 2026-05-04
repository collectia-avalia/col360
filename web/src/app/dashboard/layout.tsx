import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { DashboardLayoutWrapper } from '@/components/layouts/DashboardLayoutWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  
  // Obtener datos del perfil
  const companyName = profile?.companies?.name || profile?.company_name || 'Empresa'
  const email = profile?.email || ''
  const fullName = profile?.full_name || companyName
  const role = profile?.role || 'client'

  const initials = companyName.substring(0, 2).toUpperCase()

  return (
    <DashboardLayoutWrapper
      email={email}
      initial={initials}
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      {children}
    </DashboardLayoutWrapper>
  )
}
