'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Filter, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Users } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'

interface Payer {
  id: string
  razon_social: string
  nit: string
  contact_name: string
  risk_status: string
  approved_quota: number
  invoices: any[]
}

export function PayersList({ payers }: { payers: Payer[] }) {
  const [filter, setFilter] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Calcular métricas
  const totalClients = payers.length
  const approvedClients = payers.filter(p => p.risk_status === 'aprobado').length
  const totalApprovedQuota = payers
    .filter(p => p.risk_status === 'aprobado')
    .reduce((sum, p) => sum + (p.approved_quota || 0), 0)

  // Procesar datos para la tabla
  const processedPayers = payers.map(payer => {
    const activeInvoices = payer.invoices?.filter((inv: any) => inv.status === 'vigente') || []
    const overdueInvoices = payer.invoices?.filter((inv: any) => inv.status === 'vencida') || []
    
    const activeValue = activeInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
    const overdueValue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
    const invoiceCount = (payer.invoices?.length || 0)

    return {
      ...payer,
      stats: {
        invoiceCount,
        activeValue,
        overdueValue
      }
    }
  })

  // Filtrar
  const filteredPayers = processedPayers.filter(payer => {
    const matchesSearch = 
      payer.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payer.nit.includes(searchTerm)
    
    if (!matchesSearch) return false

    if (filter === 'todos') return true
    if (filter === 'aprobados') return payer.risk_status === 'aprobado'
    if (filter === 'vencidos') return payer.stats.overdueValue > 0
    if (filter === 'no_aprobados') return payer.risk_status === 'rechazado'
    if (filter === 'en_estudio') return payer.risk_status === 'pendiente'
    
    return true
  })

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Mini Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Clientes Estudiados</dt>
                        <dd className="text-2xl font-bold text-gray-900">{totalClients}</dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Clientes Aprobados</dt>
                        <dd className="text-2xl font-bold text-gray-900">{approvedClients}</dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Cupo Total Aprobado</dt>
                        <dd className="text-2xl font-bold text-gray-900">{formatCurrency(totalApprovedQuota)}</dd>
                    </dl>
                </div>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Filtros Visuales */}
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto">
            <button 
                onClick={() => setFilter('todos')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                Todos
            </button>
            <button 
                onClick={() => setFilter('aprobados')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'aprobados' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                Aprobados
            </button>
            <button 
                onClick={() => setFilter('vencidos')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'vencidos' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                Con Mora
            </button>
            <button 
                onClick={() => setFilter('en_estudio')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'en_estudio' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                En Estudio
            </button>
            <button 
                onClick={() => setFilter('no_aprobados')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'no_aprobados' ? 'bg-gray-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                No Aprobados
            </button>
        </div>

        {/* Search */}
        <div className="relative rounded-md shadow-sm w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado Riesgo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                # Facturas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                $ Vigente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                $ Vencido
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayers.map((payer) => (
              <tr key={payer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{payer.razon_social}</div>
                      <div className="text-xs text-gray-500">NIT: {payer.nit}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payer.risk_status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {payer.stats.invoiceCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(payer.stats.activeValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payer.stats.overdueValue > 0 ? (
                      <span className="text-red-600">{formatCurrency(payer.stats.overdueValue)}</span>
                  ) : (
                      <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/dashboard/payers/${payer.id}`} className="text-[#7c3aed] hover:text-[#6d28d9]">
                    Ver Detalles
                  </Link>
                </td>
              </tr>
            ))}
            
            {filteredPayers.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron clientes con los filtros actuales.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pendiente: 'bg-yellow-100 text-yellow-800',
        aprobado: 'bg-green-100 text-green-800',
        rechazado: 'bg-red-100 text-red-800',
    }
    
    const label = {
        pendiente: 'En Estudio',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado',
    }

    const currentStyle = styles[status as keyof typeof styles] || styles.pendiente
    const currentLabel = label[status as keyof typeof label] || status

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${currentStyle}`}>
            {currentLabel}
        </span>
    )
}
