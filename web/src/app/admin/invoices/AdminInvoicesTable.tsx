'use client'

import { useState } from 'react'
import { Download, AlertTriangle, CheckCircle, Search, Clock, FileText } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  issue_date: string
  due_date: string
  status: string
  is_guaranteed: boolean
  file_url: string | null
  client_id: string
  payer_id: string
  signedUrl: string | null
  legal_declarations?: any
}

interface AdminInvoicesTableProps {
  invoices: Invoice[]
  profileMap: Record<string, string>
  payerMap: Record<string, string>
}

const STATUS_STYLES: Record<string, string> = {
  vigente: 'bg-green-100 text-green-800 border border-green-200',
  vencida: 'bg-red-100 text-red-800 border border-red-200',
  mora:    'bg-red-100 text-red-800 border border-red-200',
  pagada:  'bg-gray-100 text-gray-600 border border-gray-200',
  anulada: 'bg-orange-100 text-orange-800 border border-orange-200',
}

function getDisplayStatus(status: string, diasMora: number, isAnulada?: boolean): string {
  if (isAnulada) return 'anulada'
  if (diasMora > 0 && status !== 'pagada') return 'mora'
  return status
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

export function AdminInvoicesTable({ invoices, profileMap, payerMap }: AdminInvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterAudit, setFilterAudit] = useState('todos')

  // Calcular las facturas filtradas
  const filteredInvoices = invoices.filter(inv => {
    const today = new Date()
    const due   = new Date(inv.due_date)
    const diasMora = inv.status !== 'pagada' && due < today
      ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
      : 0
    const isAnulada = inv.legal_declarations?.anulada === true
    const displayStatus = getDisplayStatus(inv.status, diasMora, isAnulada)

    const clientName = (profileMap[inv.client_id] || '').toLowerCase()
    const deudorName = (payerMap[inv.payer_id] || '').toLowerCase()
    const invoiceNum = inv.invoice_number.toLowerCase()

    // Búsqueda de texto
    const matchesSearch = 
      invoiceNum.includes(searchTerm.toLowerCase()) ||
      clientName.includes(searchTerm.toLowerCase()) ||
      deudorName.includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Filtro por Estado
    if (filterStatus !== 'todos') {
      if (filterStatus === 'vigente' && displayStatus !== 'vigente') return false
      if (filterStatus === 'mora' && displayStatus !== 'mora' && displayStatus !== 'vencida') return false
      if (filterStatus === 'pagada' && displayStatus !== 'pagada') return false
      if (filterStatus === 'anulada' && displayStatus !== 'anulada') return false
    }

    // Filtro de Auditoría (Fecha de Emisión > Fecha de Vencimiento)
    const hasAnomaly = inv.issue_date > inv.due_date
    if (filterAudit === 'anomalas' && !hasAnomaly) return false
    if (filterAudit === 'normales' && hasAnomaly) return false

    return true
  })

  // Contadores para el badge del filtro
  const totalAnomalies = invoices.filter(inv => inv.issue_date > inv.due_date).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cabecera con Buscador y Filtros */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Detalle de Facturas</h2>
            <p className="text-sm text-gray-500">
              Mostrando {filteredInvoices.length} de {invoices.length} factura(s)
            </p>
          </div>

          {totalAnomalies > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{totalAnomalies} factura(s) con fecha de emisión inválida</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar factura, cliente o deudor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="vigente">Vigentes</option>
              <option value="mora">En Mora / Vencidas</option>
              <option value="pagada">Pagadas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>

          {/* Filtro de auditoría */}
          <div>
            <select
              value={filterAudit}
              onChange={(e) => setFilterAudit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="todos">Auditoría: Todas las facturas</option>
              <option value="anomalas">Sólo con Emisión &gt; Vencimiento</option>
              <option value="normales">Sin anomalías de fecha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
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
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400 text-sm italic">
                  No se encontraron facturas con los filtros seleccionados.
                </td>
              </tr>
            )}
            {filteredInvoices.map((inv) => {
              const today = new Date()
              const due   = new Date(inv.due_date)
              const diasMora = inv.status !== 'pagada' && due < today
                ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
                : 0
              const isAnulada = inv.legal_declarations?.anulada === true
              const displayStatus = getDisplayStatus(inv.status, diasMora, isAnulada)
              
              // Verificar anomalía de fecha
              const hasAnomaly = inv.issue_date > inv.due_date

              return (
                <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${hasAnomaly ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {inv.invoice_number}
                      {hasAnomaly && (
                        <div className="group relative cursor-help">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-normal">
                            ¡Anomalía de Auditoría! La fecha de emisión es posterior a la fecha de vencimiento.
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {profileMap[inv.client_id] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {payerMap[inv.payer_id] || '—'}
                  </td>
                  <td className={`px-4 py-3 text-sm whitespace-nowrap ${hasAnomaly ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
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
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[displayStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {displayStatus}
                    </span>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
