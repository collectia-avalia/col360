import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PayersList } from './PayersList'

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
        <Link
          href="/dashboard/payers/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Estudiar cliente
        </Link>
      </div>

      <PayersList payers={payers || []} />
    </div>
  )
}
