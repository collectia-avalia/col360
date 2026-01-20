import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PayersList } from './PayersList'
import { InvitePayerModal } from './InvitePayerModal'

export const dynamic = 'force-dynamic'

export default async function PayersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: payers } = await supabase
    .from('payers')
    .select('*, invoices(*)')
    .eq('created_by', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los clientes a los que deseas asignar cupo.</p>
        </div>
        <InvitePayerModal />
      </div>

      <PayersList payers={payers || []} />
    </div>
  )
}
