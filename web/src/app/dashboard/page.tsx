import { createClient } from '@/lib/supabase/server'
import { Wallet, ShieldCheck, AlertCircle, TrendingUp, Download, Filter, FileText } from 'lucide-react'
import Link from 'next/link'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { InvoiceChart } from '@/components/dashboard/InvoiceChart'
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart'
import { ExportButton } from '@/components/ui/ExportButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div className="p-8">Cargando sesión...</div>

  // 1. Obtener Datos
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const allInvoices = invoices || []

  // 2. Procesamiento de KPIs
  const getVisualStatus = (invoice: any) => {
    if (invoice.status === 'pagada') return 'pagada'
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    return invoice.due_date < todayStr ? 'vencida' : 'vigente'
  }

  const activeInvoices = allInvoices.filter(inv => getVisualStatus(inv) === 'vigente')
  const overdueInvoices = allInvoices.filter(inv => getVisualStatus(inv) === 'vencida')
  
  const totalPortfolio = activeInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) + overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const guaranteedAmount = allInvoices.filter(inv => inv.is_guaranteed && inv.status !== 'pagada').reduce((sum, inv) => sum + (inv.guaranteed_amount || 0), 0)
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  
  const coveragePercent = totalPortfolio > 0 ? Math.round((guaranteedAmount / totalPortfolio) * 100) : 0

  // 3. Procesamiento para Gráficos
  
  // Gráfico 1: Evolución Mensual (Simulada agrupando por fecha de emisión)
  // En un caso real haríamos un group by en SQL, aquí lo hacemos en JS
  const monthlyDataMap = new Map<string, number>()
  allInvoices.forEach(inv => {
    const date = new Date(inv.issue_date)
    const key = `${date.toLocaleString('default', { month: 'short' })}`
    monthlyDataMap.set(key, (monthlyDataMap.get(key) || 0) + inv.amount)
  })
  
  // Convertir a array y tomar últimos 6 meses (ordenados cronológicamente si fuera necesario, aquí simplificado)
  const chartData = Array.from(monthlyDataMap.entries())
    .map(([name, total]) => ({ name, total }))
    .slice(0, 6)

  // Gráfico 2: Distribución por Estado
  const statusCounts = {
    vigente: activeInvoices.length,
    vencida: overdueInvoices.length,
    pagada: allInvoices.filter(inv => getVisualStatus(inv) === 'pagada').length
  }
  
  const pieData = [
    { name: 'Vigente', value: statusCounts.vigente, color: '#3B82F6' }, // Blue
    { name: 'Vencida', value: statusCounts.vencida, color: '#EF4444' }, // Red
    { name: 'Pagada', value: statusCounts.pagada, color: '#10B981' },   // Green
  ].filter(d => d.value > 0)


  // Formateador
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)

  // Preparar datos para exportación
  const exportData = allInvoices.map(inv => ({
      Numero_Factura: inv.invoice_number,
      Monto: inv.amount,
      Fecha_Emision: inv.issue_date,
      Fecha_Vencimiento: inv.due_date,
      Estado: getVisualStatus(inv),
      Garantizada: inv.is_guaranteed ? 'SI' : 'NO'
  }))

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel Financiero</h1>
            <p className="mt-1 text-sm text-gray-500">Visión general de tu operación y estado de cartera.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
             {/* Filtros ocultos temporalmente hasta implementación completa */}
             {/* <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                Filtros
             </button> */}
             <ExportButton 
                data={exportData} 
                filename="informe_general_avalia.csv" 
                label="Exportar Informe" 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
             />
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <KpiCard 
            title="Cupo Disponible Global" 
            value={formatCurrency(150000000)} 
            icon={Wallet} 
            color="green"
            trend={{ value: 0, label: 'Bolsa Adquirida: $500M', positive: true }}
          />
           <KpiCard 
            title="Total Cartera Vigente" 
            value={formatCurrency(totalPortfolio - overdueAmount)} 
            icon={TrendingUp} 
            color="blue"
          />
          <KpiCard 
            title="Cartera Vencida" 
            value={formatCurrency(overdueAmount)} 
            icon={AlertCircle} 
            color="red"
            trend={{ value: overdueInvoices.length, label: 'facturas vencidas', positive: false }}
          />
          <KpiCard 
            title="Cobertura Garantía" 
            value={`${coveragePercent}%`} 
            icon={ShieldCheck} 
            color="purple"
            trend={{ value: guaranteedAmount, label: 'asegurado', positive: true }}
          />
          <KpiCard 
            title="Facturas Activas" 
            value={activeInvoices.length} 
            icon={FileText} 
            color="blue"
          />
           <KpiCard 
            title="Total Recaudado" 
            value={formatCurrency(statusCounts.pagada * 1500000)} // Simulado
            icon={Wallet} 
            color="green"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Chart 1: Evolución */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Facturación</h3>
            {chartData.length > 0 ? (
                <InvoiceChart data={chartData} />
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                    Sin datos suficientes para graficar
                </div>
            )}
          </div>

          {/* Chart 2: Distribución */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Cartera</h3>
            {pieData.length > 0 ? (
                <StatusDistributionChart data={pieData} />
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                    Sin datos
                </div>
            )}
          </div>
        </div>

        {/* Tabla Reciente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Operaciones Recientes</h3>
                <Link href="/dashboard/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Ver historial completo &rarr;
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente/Pagador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allInvoices.slice(0, 5).map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {inv.invoice_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(inv.issue_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {/* Aquí podríamos hacer un join con payers si quisiéramos mostrar nombre */}
                                    ID: {inv.payer_id?.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatCurrency(inv.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                        ${getVisualStatus(inv) === 'vigente' ? 'bg-blue-100 text-blue-800' : 
                                          getVisualStatus(inv) === 'pagada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {getVisualStatus(inv)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {allInvoices.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No hay movimientos registrados recientemente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  )
}
