'use client'

import { approvePayerAction, rejectPayerAction } from '@/lib/actions/admin'
import { useState, useTransition } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function DecisionForm({ payerId }: { payerId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (formData: FormData) => {
    setError(null)
    const amount = parseFloat(formData.get('amount') as string)
    
    if (!amount || amount <= 0) {
      setError('Debes ingresar un cupo válido mayor a 0')
      return
    }

    startTransition(async () => {
      const result = await approvePayerAction(payerId, amount)
      if (result?.error) setError(result.error)
    })
  }

  const handleReject = async (formData: FormData) => {
    setError(null)
    const reason = formData.get('reason') as string

    startTransition(async () => {
      const result = await rejectPayerAction(payerId, reason)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="bg-white shadow sm:rounded-lg mt-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Panel de Decisión</h3>
        <p className="mt-2 max-w-xl text-sm text-gray-500">Evalúa la información y toma una decisión.</p>
        
        <div className="mt-5 space-y-6">
          
          {/* Formulario APROBAR */}
          <form action={handleApprove} className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-bold text-green-900">Opción A: Aprobar Cupo</h4>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-green-800">
                Cupo Aprobado (COP)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mt-4">
                 <button
                   type="submit"
                   disabled={isPending}
                   className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                 >
                   {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Aprobar y Asignar Cupo'}
                 </button>
              </div>
            </div>
          </form>

          {/* Formulario RECHAZAR */}
          <form action={handleReject} className="bg-red-50 p-4 rounded-md border border-red-200">
            <div className="flex items-center mb-3">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-sm font-bold text-red-900">Opción B: Rechazar</h4>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-red-800">
                Motivo de rechazo (Opcional)
              </label>
              <div className="mt-1">
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Explica por qué se rechaza..."
                />
              </div>
              <div className="mt-4">
                 <button
                   type="submit"
                   disabled={isPending}
                   className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                 >
                   {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Rechazar Solicitud'}
                 </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="rounded-md bg-red-100 p-4">
              <p className="text-sm font-medium text-red-800">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
