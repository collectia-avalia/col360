import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EditClientForm from './edit-form'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  
  // Usamos admin client para obtener datos sin restricciones
  const { data: client, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">Error cargando cliente</h3>
        <p className="text-gray-500">{error?.message || 'Cliente no encontrado'}</p>
        <Link href="/admin/clients" className="mt-4 inline-block text-indigo-600 hover:underline">
            Volver al listado
        </Link>
      </div>
    )
  }

  // Consultar estadísticas
  const { data: payers } = await supabase
    .from('payers')
    .select('risk_status, approved_quota')
    .eq('created_by', id)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount, is_guaranteed')
    .eq('client_id', id)

  const stats = {
    totalBag: client.total_bag || 0,
    approvedPayers: payers?.filter(p => p.risk_status === 'aprobado').length || 0,
    rejectedPayers: payers?.filter(p => p.risk_status === 'rechazado').length || 0,
    totalApprovedQuota: payers?.filter(p => p.risk_status === 'aprobado').reduce((acc, p) => acc + Number(p.approved_quota || 0), 0) || 0,
    securedInvoicesValue: invoices?.filter(i => i.is_guaranteed).reduce((acc, i) => acc + Number(i.amount || 0), 0) || 0
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="mb-6">
        <Link href="/admin/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al listado
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.company_name || 'Empresa sin nombre'}</h1>
            <p className="text-gray-500">{client.email}</p>
          </div>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
            {client.role}
          </span>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Bolsa Total" 
          value={formatCurrency(stats.totalBag)} 
          description="Cupo global asignado" 
        />
        <StatCard 
          title="Pagadores" 
          value={`${stats.approvedPayers} Aprob / ${stats.rejectedPayers} Neg`} 
          description="Estado de solicitudes" 
        />
        <StatCard 
          title="Cupo Aprobado" 
          value={formatCurrency(stats.totalApprovedQuota)} 
          description="Suma de cuotas de pagadores" 
        />
        <StatCard 
          title="Facturas Aseguradas" 
          value={formatCurrency(stats.securedInvoicesValue)} 
          description="Valor total garantizado" 
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Cliente</h2>
        <EditClientForm client={client} />
      </div>
    </div>
  )
}

function StatCard({ title, value, description }: { title: string, value: string, description: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  )
}
