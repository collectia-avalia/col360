import { createAdminClient } from '@/lib/supabase/admin'
import { Users, FileCheck, Clock, TrendingUp, Building2, CreditCard } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { InvoiceChart } from '@/components/dashboard/InvoiceChart'
import Link from 'next/link'
import { AdminSystemStatus } from './system-status'

const rangeOptions = [
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '3m', label: '3 meses', months: 3 },
  { key: '6m', label: '6 meses', months: 6 },
  { key: '1y', label: '1 año', years: 1 },
] as const

type RangeKey = typeof rangeOptions[number]['key']

function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === 'string' && rangeOptions.some((o) => o.key === value)
}

function getRangeStart(range: RangeKey) {
  const now = new Date()
  const start = new Date(now)
  const opt = rangeOptions.find((o) => o.key === range)
  if (opt && 'days' in opt) start.setDate(start.getDate() - opt.days)
  if (opt && 'months' in opt) start.setMonth(start.getMonth() - opt.months)
  if (opt && 'years' in opt) start.setFullYear(start.getFullYear() - opt.years)
  return start
}

function getPreviousRangeStart(range: RangeKey, rangeStart: Date) {
  const start = new Date(rangeStart)
  const opt = rangeOptions.find((o) => o.key === range)
  if (opt && 'days' in opt) start.setDate(start.getDate() - opt.days)
  if (opt && 'months' in opt) start.setMonth(start.getMonth() - opt.months)
  if (opt && 'years' in opt) start.setFullYear(start.getFullYear() - opt.years)
  return start
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const selectedRange: RangeKey = isRangeKey(params.range) ? params.range : '6m'
  const supabase = createAdminClient()
  const rangeStart = getRangeStart(selectedRange)
  const prevRangeStart = getPreviousRangeStart(selectedRange, rangeStart)
  const rangeLabel = rangeOptions.find((o) => o.key === selectedRange)?.label || '6 meses'

  // 1. Obtener Datos Globales
  const [
    { data: allClients },
    { count: pendingPayersCountTotal },
    { data: allPayers },
    { data: allInvoices },
  ] = await Promise.all([
    supabase.from('profiles').select('id, company_name, total_bag, created_at').eq('role', 'client'),
    supabase.from('payers').select('*', { count: 'exact', head: true }).eq('risk_status', 'pendiente'),
    supabase.from('payers').select('approved_quota, created_at, risk_status'),
    supabase.from('invoices').select('amount, created_at, is_guaranteed, status, due_date'),
  ])

  // 2. Procesar Métricas Globales
  const clientsList = allClients || []
  const payersList = allPayers || []
  const invoicesList = allInvoices || []

  const totalBagValue = clientsList.reduce((sum, c) => sum + (Number(c.total_bag) || 0), 0)
  const approvedPayers = payersList.filter(p => p.risk_status === 'aprobado')
  const totalApprovedQuota = approvedPayers.reduce((sum, p) => sum + (Number(p.approved_quota) || 0), 0)
  const totalApprovedCompanies = approvedPayers.length

  // Facturas
  const guaranteedInvoices = invoicesList.filter(i => i.is_guaranteed)
  const totalGuaranteedCount = guaranteedInvoices.length
  const totalGuaranteedValue = guaranteedInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  // Próximos Vencimientos (Mes en curso)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const upcomingExpirations = invoicesList.filter(i => {
    if (i.status === 'pagada') return false
    const d = new Date(i.due_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const upcomingValue = upcomingExpirations.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  // % Facturas Vencidas
  const activeInvoices = invoicesList.filter(i => i.status !== 'pagada')
  const overdueInvoices = activeInvoices.filter(i => i.status === 'vencida')
  const overduePercent = activeInvoices.length > 0 
    ? Math.round((overdueInvoices.length / activeInvoices.length) * 100) 
    : 0

  // 3. Procesar Histórico por Mes (Acumulado)
  const monthlyData = new Map<string, { bag: number; quota: number }>()

  // Agrupar por mes
  clientsList.forEach(c => {
    const month = new Date(c.created_at).toISOString().slice(0, 7) // YYYY-MM
    const current = monthlyData.get(month) || { bag: 0, quota: 0 }
    monthlyData.set(month, { ...current, bag: current.bag + (Number(c.total_bag) || 0) })
  })

  payersList.filter(p => p.risk_status === 'aprobado').forEach(p => {
    const month = new Date(p.created_at).toISOString().slice(0, 7)
    const current = monthlyData.get(month) || { bag: 0, quota: 0 }
    monthlyData.set(month, { ...current, quota: current.quota + (Number(p.approved_quota) || 0) })
  })

  const sortedMonths = Array.from(monthlyData.keys()).sort()
  let runningBag = 0
  let runningQuota = 0

  const chartData = sortedMonths.map(month => {
    const data = monthlyData.get(month)!
    runningBag += data.bag
    runningQuota += data.quota
    
    const [y, m] = month.split('-')
    const date = new Date(Number(y), Number(m) - 1, 1)
    const monthLabel = date.toLocaleString('es-CO', { month: 'short' })
    
    return {
      name: `${monthLabel} ${y}`,
      bag: runningBag,
      quota: runningQuota
    }
  })

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Centro de Comando</h1>
        <p className="mt-1 text-sm text-gray-500">Visión global operativa de AvalIA SaaS.</p>
      </div>

      {/* KPIs Globales - Fila 1 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Clientes Registrados" 
          value={clientsList.length} 
          icon={Users} 
          color="blue"
        />
        <KpiCard 
          title="Valor en Bolsa" 
          value={formatCurrency(totalBagValue)} 
          icon={Building2} 
          color="purple"
        />
        <KpiCard 
          title="Cupos Aprobados" 
          value={formatCurrency(totalApprovedQuota)} 
          icon={CreditCard} 
          color="green"
        />
        <KpiCard 
          title="Empresas Aprobadas" 
          value={totalApprovedCompanies} 
          icon={TrendingUp} 
          color="orange"
        />
      </div>

      {/* KPIs Globales - Fila 2 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Facturas Aseguradas (#)" 
          value={totalGuaranteedCount} 
          icon={FileCheck} 
          color="blue"
        />
        <KpiCard 
          title="Valor Asegurado" 
          value={formatCurrency(totalGuaranteedValue)} 
          icon={CreditCard} 
          color="green"
        />
        <KpiCard 
          title="Próximos Vencimientos" 
          value={formatCurrency(upcomingValue)} 
          icon={Clock} 
          color="purple"
        />
        <KpiCard 
          title="% Facturas Vencidas" 
          value={`${overduePercent}%`} 
          icon={Clock} 
          color="red"
        />
      </div>

      {/* Sección Principal: Gráfico y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Volumen Global */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Evolución de Bolsa y Cupos</h3>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                {rangeOptions.map((opt) => (
                  <Link
                    key={opt.key}
                    href={`/admin?range=${opt.key}`}
                    className={`text-xs px-2 py-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      opt.key === selectedRange
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
             <InvoiceChart data={chartData} />
          ) : (
             <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                Sin datos de transacciones
             </div>
          )}
        </div>

        {/* Accesos Rápidos / Estado del Sistema */}
        <div className="space-y-6">
            {/* Tarjeta de Acción */}
            <div className="bg-indigo-900 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Acciones Rápidas</h3>
                <p className="text-indigo-200 text-sm mb-6">Gestión prioritaria del sistema.</p>
                
                <div className="space-y-3">
                    <Link href="/admin/clients/new" className="block w-full text-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                        + Registrar Nuevo Cliente
                    </Link>
                    <Link href="/admin/approvals" className="block w-full text-center py-2 px-4 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-sm font-bold transition-colors">
                        Auditar Pendientes ({pendingPayersCountTotal || 0})
                    </Link>
                </div>
            </div>

            {/* Resumen Operativo */}
            <AdminSystemStatus
              range={selectedRange}
              rangeLabel={rangeLabel}
              totalClientsCount={clientsList.length}
              totalInvoicesCount={invoicesList.length}
            />
        </div>
      </div>
    </div>
  )
}
