import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import { InvoicesList } from './InvoicesList'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, payers(razon_social)')
    .eq('client_id', user?.id)
    .order('created_at', { ascending: false })

  const showSuccess = params['status'] === 'success'
  const isGuaranteed = params['guaranteed'] === 'true'
  const message = params['message'] as string | undefined

  return (
    <div className="max-w-6xl mx-auto">
      {showSuccess && (
        <div className={`mb-6 p-4 rounded-md flex items-start ${isGuaranteed ? (message ? 'bg-orange-50' : 'bg-green-50') : 'bg-yellow-50'}`}>
          <div className="flex-shrink-0">
            {isGuaranteed ? (
              message ? <AlertTriangle className="h-5 w-5 text-orange-400" /> : <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isGuaranteed ? (message ? 'text-orange-800' : 'text-green-800') : 'text-yellow-800'}`}>
              {isGuaranteed ? (message ? '¡Factura Radicada con Advertencia!' : '¡Factura Radicada y Garantizada!') : 'Factura Radicada para Custodia'}
            </h3>
            <div className={`mt-2 text-sm ${isGuaranteed ? (message ? 'text-orange-700' : 'text-green-700') : 'text-yellow-700'}`}>
              <p>
                {message || (isGuaranteed 
                  ? 'Tu factura cumple con los requisitos y el pagador tiene cupo disponible. Ha sido marcada como Garantizada.' 
                  : 'La factura ha sido guardada exitosamente, pero el pagador no tiene cupo disponible o no está aprobado. Se guardará solo para gestión.')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las facturas radicadas en el sistema.</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Radicar Nueva Factura
        </Link>
      </div>

      <InvoicesList invoices={invoices || []} />
    </div>
  )
}
