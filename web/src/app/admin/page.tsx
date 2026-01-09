import { createAdminClient } from '@/lib/supabase/admin'
import { Users, FileCheck, Clock, TrendingUp, Building2, CreditCard } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { InvoiceChart } from '@/components/dashboard/InvoiceChart'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  // 1. Obtener Datos Globales en Paralelo
  const [
    { count: clientsCount },
    { count: pendingPayersCount },
    { data: globalInvoices }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('payers').select('*', { count: 'exact', head: true }).eq('risk_status', 'pendiente'),
    supabase.from('invoices').select('amount, created_at, is_guaranteed').order('created_at', { ascending: false }), // Traemos todo para calcular volumen (en producción real usaríamos RPC para sumar)
  ])

  // 2. Procesar Métricas
  const allInvoices = globalInvoices || []
  const totalVolume = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  
  // Calcular Monto Financiado (Suma de garantizadas)
  // Nota: En la query anterior pedía head: true, ahora pido los datos (amount) para sumar
  // Si guaranteedInvoices es muy grande, mejor usar RPC, pero para MVP está bien.
  const guaranteedInvoices = await supabase.from('invoices').select('amount').eq('is_guaranteed', true)
  const totalFinanced = (guaranteedInvoices.data || []).reduce((sum, inv) => sum + (inv.amount || 0), 0)
  
  // Agrupar volumen por mes (últimos 6 meses) para el gráfico
  const monthlyDataMap = new Map<string, number>()
  allInvoices.forEach(inv => {
    const date = new Date(inv.created_at)
    const key = `${date.toLocaleString('default', { month: 'short' })}`
    monthlyDataMap.set(key, (monthlyDataMap.get(key) || 0) + inv.amount)
  })
  
  const chartData = Array.from(monthlyDataMap.entries())
    .map(([name, total]) => ({ name, total }))
    .slice(0, 6)
    .reverse() // Para mostrar cronológico si el map se llenó al revés, o ajustar según orden de invoices

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
          title="Clientes Activos" 
          value={clientsCount || 0} 
          icon={Users} 
          color="blue"
          trend={{ value: 4, label: 'nuevos este mes', positive: true }}
        />
        <KpiCard 
          title="Volumen Procesado" 
          value={formatCurrency(totalVolume)} 
          icon={TrendingUp} 
          color="purple"
          trend={{ value: 12, label: 'vs mes anterior', positive: true }}
        />
        <KpiCard 
          title="Solicitudes Pendientes" 
          value={pendingPayersCount || 0} 
          icon={Clock} 
          color="red"
          // Sin trend si es 0
        />
        <KpiCard 
          title="Monto Total Financiado" 
          value={formatCurrency(totalFinanced)} 
          icon={FileCheck} 
          color="green"
          trend={{ value: 98, label: '% cobertura', positive: true }}
        />
      </div>

      {/* Sección Principal: Gráfico y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Volumen Global */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Volumen Transaccional Global</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Últimos 6 meses</span>
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
                        Auditar Pendientes ({pendingPayersCount})
                    </Link>
                </div>
            </div>

            {/* Resumen Operativo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Estado del Sistema</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            Empresas Registradas
                        </div>
                        <span className="font-medium text-gray-900">{clientsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                            Facturas Procesadas
                        </div>
                        <span className="font-medium text-gray-900">{allInvoices.length}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Estado de API</span>
                            <span className="text-green-600 font-medium flex items-center">
                                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                                Operativo
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
