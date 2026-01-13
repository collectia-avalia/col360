'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, CheckCircle, AlertTriangle, Filter, Search, Wallet, AlertCircle, TrendingUp, MoreHorizontal, FileText } from 'lucide-react'
import { toggleInvoiceStatus } from './actions'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  issue_date: string
  due_date: string
  status: string
  is_guaranteed: boolean
  payers: {
    razon_social: string
  }
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterGuarantee, setFilterGuarantee] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Helper para calcular estado visual
  const getVisualStatus = (invoice: Invoice) => {
    if (invoice.status === 'pagada') return 'pagada'
    // Comparar fechas como cadenas YYYY-MM-DD para evitar problemas de zona horaria
    // Usamos la fecha local del navegador para "hoy"
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    
    return invoice.due_date < todayStr ? 'vencida' : 'vigente'
  }

  // Calcular métricas usando estado visual
  const activeInvoices = invoices.filter(inv => getVisualStatus(inv) === 'vigente')
  const overdueInvoices = invoices.filter(inv => getVisualStatus(inv) === 'vencida')
  
  const activeValue = activeInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const overdueValue = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalValue = activeValue + overdueValue

  // Filtrar
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.payers?.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    const visualStatus = getVisualStatus(inv)

    if (filterStatus !== 'todos' && visualStatus !== filterStatus) return false
    if (filterGuarantee === 'garantizada' && !inv.is_guaranteed) return false
    if (filterGuarantee === 'custodia' && inv.is_guaranteed) return false
    
    return true
  })

  // Acciones
  const handleStatusChange = async (id: string, currentStatus: string) => {
    if (updatingId) return
    setUpdatingId(id)
    
    // Toggle simple: vigente/vencida -> pagada -> original
    // Al reabrir, simplemente dejamos que el cálculo visual determine si es vencida o vigente
    // En BD guardamos 'vigente' (o 'vencida' si quisiéramos persistirlo, pero el requerimiento implica cálculo visual)
    // Para consistencia con backend, si "reabrimos", lo ponemos en 'vigente' en BD, 
    // y el frontend lo mostrará rojo si la fecha ya pasó.
    
    let newStatus = 'pagada'
    if (currentStatus === 'pagada') {
        newStatus = 'vigente' // Reset a vigente en BD, el visual se encarga del resto
    }

    await toggleInvoiceStatus(id, newStatus)
    setUpdatingId(null)
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - due.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    
    if (now <= due) return 0
    return diffDays
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Mini Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Vigentes</dt>
                        <dd className="text-lg font-bold text-gray-900">{activeInvoices.length} ({formatCurrency(activeValue)})</dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Vencidas</dt>
                        <dd className="text-lg font-bold text-gray-900">{overdueInvoices.length} ({formatCurrency(overdueValue)})</dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                    <Wallet className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Cartera</dt>
                        <dd className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</dd>
                    </dl>
                </div>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
                <option value="todos">Todos los Estados</option>
                <option value="vigente">Vigente</option>
                <option value="vencida">Vencida</option>
                <option value="pagada">Pagada</option>
            </select>

            <select 
                value={filterGuarantee}
                onChange={(e) => setFilterGuarantee(e.target.value)}
                className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
                <option value="todos">Todas las Garantías</option>
                <option value="garantizada">Garantizada</option>
                <option value="custodia">Solo Custodia</option>
            </select>
        </div>

        {/* Search */}
        <div className="relative rounded-md shadow-sm w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder="Buscar factura o cliente..."
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
                N° Factura
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagador
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimiento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mora (Días)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Garantía
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => {
                const visualStatus = getVisualStatus(invoice)
                const daysOverdue = visualStatus !== 'pagada' ? getDaysOverdue(invoice.due_date) : 0
                return (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.payers?.razon_social || 'Desconocido'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(invoice.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                    ${visualStatus === 'vigente' ? 'bg-blue-100 text-blue-800' : 
                      visualStatus === 'pagada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {visualStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {visualStatus !== 'pagada' && daysOverdue > 0 ? (
                        <span className="text-red-600 font-bold">{daysOverdue}</span>
                    ) : (
                        '-'
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invoice.is_guaranteed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Si
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="text-[#7c3aed] hover:text-[#6d28d9]">
                        Ver Detalle
                    </Link>
                    <button 
                        onClick={() => handleStatusChange(invoice.id, invoice.status)}
                        disabled={updatingId === invoice.id}
                        className="text-gray-500 hover:text-gray-900 disabled:opacity-50"
                    >
                        {updatingId === invoice.id ? '...' : (invoice.status === 'pagada' ? 'Reabrir' : 'Marcar Pagada')}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            {filteredInvoices.length === 0 && (
                <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                        No hay facturas que coincidan con los filtros.
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
