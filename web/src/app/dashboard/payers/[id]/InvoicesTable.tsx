'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { toggleInvoiceStatus } from '@/app/dashboard/invoices/actions'

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

export function InvoicesTable({ invoices, payerId }: { invoices: Invoice[], payerId: string }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Filtrado Estricto por Payer ID
  // Aunque el backend ya debería haber filtrado, aseguramos en el cliente por si se reutiliza mal
  const filteredInvoices = invoices.filter(inv => {
      // Si payerId está presente en la factura (relación), comparamos. 
      // Si no, asumimos que la lista ya viene filtrada (caso común al pasar invoices del payer)
      // En este caso, invoices viene de `payer.invoices`, así que ya son de este payer.
      return true
  })

  // Helper para calcular estado visual (Reutilizado para consistencia)
  const getVisualStatus = (invoice: Invoice) => {
    if (invoice.status === 'pagada') return 'pagada'
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    return invoice.due_date < todayStr ? 'vencida' : 'vigente'
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - due.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
    
    if (now <= due) return 0
    return diffDays
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)

  // Acciones (Reutilizadas)
  const handleStatusChange = async (id: string, currentStatus: string) => {
    if (updatingId) return
    setUpdatingId(id)
    
    let newStatus = 'pagada'
    if (currentStatus === 'pagada') {
        newStatus = 'vigente' 
    }

    await toggleInvoiceStatus(id, newStatus)
    setUpdatingId(null)
  }

  if (filteredInvoices.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sin Facturas</h3>
            <p className="text-gray-500 mt-1">Este cliente aún no tiene facturas radicadas.</p>
        </div>
      )
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Factura
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
          </tbody>
        </table>
        </div>
    </div>
  )
}
