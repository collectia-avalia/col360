import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, DollarSign, ShieldCheck, TrendingUp, Download } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { InvoiceChart } from '@/components/dashboard/InvoiceChart'

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

export default async function AdminInvoicesPage() {
  const supabase = createAdminClient()

  // Facturas con datos del cliente y del deudor
  const { data: rawInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, issue_date, due_date, status, is_guaranteed, file_url, client_id, payer_id')
    .order('issue_date', { ascending: false })

  const invoices = rawInvoices || []

  // Perfiles de clientes únicos
  const clientIds = [...new Set(invoices.map(i => i.client_id).filter(Boolean))]
  const { data: profiles } = clientIds.length
    ? await supabase.from('profiles').select('id, company_name').in('id', clientIds)
    : { data: [] }

  // Pagadores únicos
  const payerIds = [...new Set(invoices.map(i => i.payer_id).filter(Boolean))]
  const { data: payers } = payerIds.length
    ? await supabase.from('payers').select('id, razon_social').in('id', payerIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.company_name]))
  const payerMap  = Object.fromEntries((payers  || []).map(p => [p.id, p.razon_social]))

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

  // KPIs
  const totalCount     = invoices.length
  const totalValue     = invoices.reduce((acc, i) => acc + Number(i.amount || 0), 0)
  const guaranteedCount = invoices.filter(i => i.is_guaranteed).length
  const guaranteedValue = invoices.filter(i => i.is_guaranteed).reduce((acc, i) => acc + Number(i.amount || 0), 0)

  // Datos del gráfico — agrupados por mes
  const monthlyMap: Record<string, { name: string; total: number }> = {}
  for (const inv of invoices) {
    const date  = new Date(inv.issue_date)
    const key   = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    if (!monthlyMap[key]) monthlyMap[key] = { name: label, total: 0 }
    monthlyMap[key].total += Number(inv.amount || 0)
  }
  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
        <p className="text-gray-500 mt-1">Visión global de todas las facturas del sistema.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Facturas"        value={totalCount}                    icon={FileText}    color="indigo" />
        <KpiCard title="Valor Total"           value={formatCurrency(totalValue)}    icon={DollarSign}  color="blue"   />
        <KpiCard title="Facturas Aseguradas"   value={guaranteedCount}               icon={ShieldCheck} color="green"  />
        <KpiCard title="Valor Asegurado"       value={formatCurrency(guaranteedValue)} icon={TrendingUp} color="purple" />
      </div>

      {/* Gráfico de evolución mensual */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Evolución Mensual de Facturas</h2>
        {chartData.length > 0 ? (
          <InvoiceChart data={chartData} />
        ) : (
          <p className="text-center text-gray-400 text-sm py-12">Sin datos disponibles.</p>
        )}
      </div>

      {/* Tabla de detalle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Detalle de Facturas</h2>
            <p className="text-sm text-gray-500">{totalCount} factura(s) en total</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['# Factura', 'Cliente', 'Deudor', 'Emisión', 'Vencimiento', 'Valor', 'Días Mora', 'Estado', 'PDF'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {invoicesWithUrls.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    No hay facturas registradas.
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
                    {profileMap[inv.client_id] || '—'}
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
