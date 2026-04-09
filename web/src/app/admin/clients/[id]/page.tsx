import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import EditClientForm from './edit-form'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

const STATUS_STYLES: Record<string, string> = {
  vigente: 'bg-green-100 text-green-800',
  vencida: 'bg-red-100 text-red-800',
  mora:    'bg-red-100 text-red-800',
  pagada:  'bg-gray-100 text-gray-600',
}

function getDisplayStatus(status: string, diasMora: number): string {
  if (diasMora > 0 && status !== 'pagada') return 'mora'
  return status
}

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

  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, issue_date, due_date, status, is_guaranteed, file_url, payer_id')
    .eq('client_id', id)
    .order('issue_date', { ascending: false })

  const invoices = invoicesRaw || []

  // Pagadores para mostrar nombre del deudor
  const payerIds = [...new Set(invoices.map(i => i.payer_id).filter(Boolean))]
  const { data: payersData } = payerIds.length
    ? await supabase.from('payers').select('id, razon_social').in('id', payerIds)
    : { data: [] }
  const payerMap = Object.fromEntries((payersData || []).map(p => [p.id, p.razon_social]))

  // URLs firmadas para PDFs
  const invoicesWithUrls = await Promise.all(
    invoices.map(async (inv) => {
      if (!inv.file_url) return { ...inv, signedUrl: null }
      try {
        if (inv.file_url.startsWith('http')) return { ...inv, signedUrl: inv.file_url }
        const { data } = await supabase.storage.from('invoices-docs').createSignedUrl(inv.file_url, 3600)
        return { ...inv, signedUrl: data?.signedUrl || null }
      } catch {
        return { ...inv, signedUrl: null }
      }
    })
  )

  const stats = {
    totalBag: client.total_bag || 0,
    approvedPayers: payers?.filter(p => p.risk_status === 'aprobado').length || 0,
    rejectedPayers: payers?.filter(p => p.risk_status === 'rechazado').length || 0,
    totalApprovedQuota: payers?.filter(p => p.risk_status === 'aprobado').reduce((acc, p) => acc + Number(p.approved_quota || 0), 0) || 0,
    securedInvoicesValue: invoices.filter(i => i.is_guaranteed).reduce((acc, i) => acc + Number(i.amount || 0), 0)
  }

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

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Facturas Aseguradas</h2>
          <p className="text-sm text-gray-500">{invoices.length} factura(s) registrada(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['# Factura', 'Deudor', 'Emisión', 'Vencimiento', 'Valor', 'Días Mora', 'Estado', 'PDF'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {invoicesWithUrls.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">
                    Este cliente no tiene facturas registradas.
                  </td>
                </tr>
              )}
              {invoicesWithUrls.map((inv) => {
                const today = new Date()
                const due   = new Date(inv.due_date)
                const diasMora = inv.status !== 'pagada' && due < today
                  ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
                  : 0
                return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {payerMap[inv.payer_id] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(inv.issue_date).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(inv.due_date).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(Number(inv.amount))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {diasMora > 0
                      ? <span className="text-xs font-bold text-red-600">{diasMora} días</span>
                      : <span className="text-xs text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => { const ds = getDisplayStatus(inv.status, diasMora); return (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[ds] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ds}
                    </span>
                    )})()}
                  </td>
                  <td className="px-4 py-3">
                    {inv.signedUrl ? (
                      <a
                        href={inv.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver / Descargar PDF"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
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
