'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Filter, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Users, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { deletePayerAction, updatePayerAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Payer {
  id: string
  razon_social: string
  nit: string
  contact_email?: string
  contact_name: string
  risk_status: string
  approved_quota: number
  invoices: any[]
}

export function PayersList({ payers }: { payers: Payer[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [localPayers, setLocalPayers] = useState<Payer[]>(payers)

  // Sincronizar estado local con props (cuando el servidor revalida)
  useEffect(() => {
      setLocalPayers(payers)
  }, [payers])

  // Realtime Subscription
  useEffect(() => {
      const supabase = createClient()
      const channel = supabase
          .channel('payers-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payers' }, (payload) => {
              console.log('Cambio detectado en payers:', payload)
              
              if (payload.eventType === 'DELETE') {
                  // Actualización Optimista: Eliminar inmediatamente de la lista local
                  setLocalPayers(current => current.filter(p => p.id !== payload.old.id))
              } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                  // Para insert/update preferimos refrescar para traer relaciones complejas (invoices)
                  router.refresh()
              }
          })
          .subscribe()

      return () => {
          supabase.removeChannel(channel)
      }
  }, [router])
  
  // States for Edit/Delete
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers
  const handleEditClick = (payer: Payer) => {
      setSelectedPayer(payer)
      setIsEditModalOpen(true)
      setError(null)
  }

  const handleDeleteClick = (payer: Payer) => {
      setSelectedPayer(payer)
      setIsDeleteModalOpen(true)
      setError(null)
  }

  const confirmDelete = async () => {
      if (!selectedPayer) return
      setIsLoading(true)
      const res = await deletePayerAction(selectedPayer.id)
      setIsLoading(false)
      if (res?.error) {
          setError(res.error)
      } else {
          setIsDeleteModalOpen(false)
          setSelectedPayer(null)
      }
  }

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!selectedPayer) return
      setIsLoading(true)
      
      const formData = new FormData(e.currentTarget)
      const res = await updatePayerAction(formData)
      
      setIsLoading(false)
      if (res?.error) {
          setError(res.error)
      } else {
          setIsEditModalOpen(false)
          setSelectedPayer(null)
          router.refresh()
      }
  }

  // Calcular métricas
  const totalClients = localPayers.length
  const approvedClients = localPayers.filter(p => p.risk_status === 'aprobado').length
  const totalApprovedQuota = localPayers
    .filter(p => p.risk_status === 'aprobado')
    .reduce((sum, p) => sum + (p.approved_quota || 0), 0)

  // Helper para calcular estado visual (Misma lógica que en Facturas)
  const getVisualStatus = (invoice: any) => {
    if (invoice.status === 'pagada') return 'pagada'
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    return invoice.due_date < todayStr ? 'vencida' : 'vigente'
  }

  // Procesar datos para la tabla
  const processedPayers = localPayers.map(payer => {
    // Usar estado visual para clasificación
    const activeInvoices = payer.invoices?.filter((inv: any) => getVisualStatus(inv) === 'vigente') || []
    const overdueInvoices = payer.invoices?.filter((inv: any) => getVisualStatus(inv) === 'vencida') || []
    
    const activeValue = activeInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
    const overdueValue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
    const consumedQuota = activeValue + overdueValue // Total consumido (Vigente + Vencido)
    const invoiceCount = (payer.invoices?.length || 0)

    return {
      ...payer,
      stats: {
        invoiceCount,
        activeValue,
        overdueValue,
        consumedQuota
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                Cupo Aprobado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumido
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(payer.approved_quota || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   <div className="flex flex-col">
                      <span>{formatCurrency(payer.stats.consumedQuota)}</span>
                      <span className="text-xs text-gray-500">
                        {payer.approved_quota > 0 
                            ? `${Math.round((payer.stats.consumedQuota / payer.approved_quota) * 100)}% uso` 
                            : '0%'}
                      </span>
                   </div>
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
                  <div className="flex items-center justify-end space-x-2">
                    <Link 
                        href={`/dashboard/payers/${payer.id}`} 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500" 
                        title="Ver Detalles"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Ver Detalle
                    </Link>
                  </div>
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
      {/* Modals */}
      {/* Edit Modal */}
      {isEditModalOpen && selectedPayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Editar Cliente</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                    <input type="hidden" name="id" value={selectedPayer.id} />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                        <input 
                            name="razon_social" 
                            defaultValue={selectedPayer.razon_social}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                        <input 
                            value={selectedPayer.nit}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">El NIT no se puede modificar.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                        <input 
                            name="contact_email" 
                            type="email"
                            defaultValue={selectedPayer.contact_email}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center transition-colors shadow-sm"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">¿Eliminar Cliente?</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Estás a punto de eliminar a <span className="font-bold text-gray-700">{selectedPayer.razon_social}</span>. 
                        Esta acción no se puede deshacer y fallará si el cliente tiene facturas asociadas.
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg text-left">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center gap-3">
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center transition-colors shadow-sm"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Sí, Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
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
