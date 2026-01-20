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

  // 1. Obtener Datos Globales en Paralelo
  const [
    { count: clientsCountTotal },
    { count: pendingPayersCountTotal },
    { data: rangeInvoices },
    { data: prevInvoices },
    { count: newClientsInRange },
    { count: newClientsPrevRange },
    { count: newPendingInRange },
    { count: newPendingPrevRange },
    { count: totalInvoicesCount }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('payers').select('*', { count: 'exact', head: true }).eq('risk_status', 'pendiente'),
    supabase
      .from('invoices')
      .select('amount, created_at, is_guaranteed')
      .gte('created_at', rangeStart.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('invoices')
      .select('amount, created_at, is_guaranteed')
      .gte('created_at', prevRangeStart.toISOString())
      .lt('created_at', rangeStart.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', rangeStart.toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', prevRangeStart.toISOString())
      .lt('created_at', rangeStart.toISOString()),
    supabase
      .from('payers')
      .select('*', { count: 'exact', head: true })
      .eq('risk_status', 'pendiente')
      .gte('created_at', rangeStart.toISOString()),
    supabase
      .from('payers')
      .select('*', { count: 'exact', head: true })
      .eq('risk_status', 'pendiente')
      .gte('created_at', prevRangeStart.toISOString())
      .lt('created_at', rangeStart.toISOString()),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
  ])

  // 2. Procesar Métricas
  const chartInvoices = rangeInvoices || []
  const totalVolume = chartInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalFinanced = chartInvoices
    .filter((inv) => inv.is_guaranteed)
    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const groupByDay = selectedRange === '7d' || selectedRange === '30d'
  const prevInvoicesList = prevInvoices || []
  const prevVolume = prevInvoicesList.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const prevFinanced = prevInvoicesList.filter((inv) => inv.is_guaranteed).reduce((sum, inv) => sum + (inv.amount || 0), 0)

  const clientsRangeCount = newClientsInRange || 0
  const clientsPrevCount = newClientsPrevRange || 0
  const pendingRangeCount = newPendingInRange || 0
  const pendingPrevCount = newPendingPrevRange || 0



  const totalsByKey = new Map<string, number>()
  for (const inv of chartInvoices) {
    const date = new Date(inv.created_at)
    const key = groupByDay
      ? date.toISOString().slice(0, 10)
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    totalsByKey.set(key, (totalsByKey.get(key) || 0) + (inv.amount || 0))
  }

  const sortedKeys = Array.from(totalsByKey.keys()).sort()
  const chartData = sortedKeys.map((key) => {
    if (groupByDay) {
      const [y, m, d] = key.split('-')
      return { name: `${d}/${m}`, total: totalsByKey.get(key) || 0 }
    }

    const [y, m] = key.split('-')
    const date = new Date(Number(y), Number(m) - 1, 1)
    const monthLabel = date.toLocaleString('es-CO', { month: 'short' })
    return { name: `${monthLabel} ${y}`, total: totalsByKey.get(key) || 0 }
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

      {/* KPIs Globales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Clientes Registrados" 
          value={clientsRangeCount} 
          icon={Users} 
          color="blue"
          trend={{ value: percentDelta(clientsRangeCount, clientsPrevCount), label: `vs periodo anterior (${rangeLabel})`, positive: clientsRangeCount >= clientsPrevCount }}
        />
        <KpiCard 
          title="Volumen Procesado" 
          value={formatCurrency(totalVolume)} 
          icon={TrendingUp} 
          color="purple"
          trend={{ value: percentDelta(totalVolume, prevVolume), label: `vs periodo anterior (${rangeLabel})`, positive: totalVolume >= prevVolume }}
        />
        <KpiCard 
          title="Solicitudes Nuevas" 
          value={pendingRangeCount} 
          icon={Clock} 
          color="red"
          // Sin trend si es 0
          trend={{ value: percentDelta(pendingRangeCount, pendingPrevCount), label: `vs periodo anterior (${rangeLabel})`, positive: pendingRangeCount >= pendingPrevCount }}
        />
        <KpiCard 
          title="Monto Total Financiado" 
          value={formatCurrency(totalFinanced)} 
          icon={FileCheck} 
          color="green"
          trend={{ value: percentDelta(totalFinanced, prevFinanced), label: `vs periodo anterior (${rangeLabel})`, positive: totalFinanced >= prevFinanced }}
        />
      </div>

      {/* Sección Principal: Gráfico y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Volumen Global */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Volumen Transaccional Global</h3>
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
              totalClientsCount={clientsCountTotal || 0}
              totalInvoicesCount={totalInvoicesCount || 0}
            />
        </div>
      </div>
    </div>
  )
}
