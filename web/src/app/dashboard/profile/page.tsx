import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/ui/ProfileForm'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <div>No autorizado</div>

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Mi Perfil
          </h2>
          <p className="mt-1 text-sm text-gray-500">
             Información de la cuenta y detalles de la empresa.
          </p>
        </div>
      </div>

      <ProfileForm 
        user={{
            id: user.id,
            email: user.email!,
            fullName: profile?.full_name || '',
            companyName: profile?.company_name || ''
        }}
      />
    </div>
  )
}
