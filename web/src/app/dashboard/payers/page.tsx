import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PayersList } from './PayersList'
import { InvitePayerModal } from './InvitePayerModal'

export const dynamic = 'force-dynamic'

export default async function PayersPage() {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)

  const { data: payers } = await supabase
    .from('payers')
    .select('*, invoices(*), payer_documents(id)')
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los clientes a los que deseas asignar cupo.</p>
        </div>
        {(profile?.role === 'superadmin' || profile?.role === 'comercial') && (
          <InvitePayerModal />
        )}
      </div>

      <PayersList payers={payers || []} role={profile?.role} />
    </div>
  )
}
