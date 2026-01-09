import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import DecisionForm from './decision-form'

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const payerId = id

  // 1. Obtener Datos del Pagador
  const { data: payer } = await supabase
    .from('payers')
    .select(`
      *,
      profiles:created_by (
        email,
        company_name
      )
    `)
    .eq('id', payerId)
    .single()

  if (!payer) {
    return <div>Pagador no encontrado</div>
  }

  // 2. Obtener Documentos
  const { data: documents } = await supabase
    .from('payer_documents')
    .select('*')
    .eq('payer_id', payerId)

  // 3. Generar URLs firmadas para los documentos
  const docsWithUrls = await Promise.all((documents || []).map(async (doc) => {
    const { data } = await supabase.storage
      .from('legal-docs')
      .createSignedUrl(doc.file_path, 3600) // 1 hora de validez
    
    return {
      ...doc,
      signedUrl: data?.signedUrl
    }
  }))

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <Link
          href="/admin/approvals"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al tablero
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Análisis de Solicitud</h1>
        <div className="flex items-center mt-2 space-x-4">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${payer.risk_status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                  payer.risk_status === 'aprobado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {payer.risk_status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">Solicitado el {new Date(payer.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Info y Documentos */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Tarjeta Info Pagador */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Información del Pagador</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Razón Social</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payer.razon_social}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">NIT</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payer.nit}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Contacto</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {payer.contact_name}<br/>
                                <span className="text-gray-500">{payer.contact_email}</span><br/>
                                <span className="text-gray-500">{payer.contact_phone}</span>
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Datos Comerciales</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                Plazo: {payer.payment_terms || '-'}<br/>
                                Venta Mensual: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(payer.estimated_monthly_volume || 0)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Tarjeta Documentos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Documentación Legal</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Archivos adjuntos para análisis.</p>
                </div>
                <ul className="divide-y divide-gray-200">
                    {docsWithUrls.map((doc) => (
                        <li key={doc.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-indigo-600 truncate capitalize">
                                        {doc.doc_type.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-gray-500">Subido el {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="ml-5 flex-shrink-0">
                                {doc.signedUrl ? (
                                    <a href={doc.signedUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center text-sm">
                                        <Download className="h-4 w-4 mr-1" /> Descargar
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm">No disponible</span>
                                )}
                            </div>
                        </li>
                    ))}
                    {docsWithUrls.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-500">No hay documentos adjuntos.</li>
                    )}
                </ul>
            </div>
        </div>

        {/* Columna Derecha: Panel de Decisión */}
        <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitante</h3>
                    <div className="text-sm">
                        <p className="font-medium text-gray-900">{payer.profiles?.company_name || 'Sin Nombre'}</p>
                        <p className="text-gray-500">{payer.profiles?.email}</p>
                    </div>
                </div>
            </div>

            {/* Mostrar panel de decisión SOLO si está pendiente */}
            {payer.risk_status === 'pendiente' ? (
                <DecisionForm payerId={payerId} />
            ) : (
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Dictamen Final</h3>
                        <p className="text-sm text-gray-500 mb-4">Esta solicitud ya ha sido procesada.</p>
                        
                        <div className={`rounded-md p-4 ${payer.risk_status === 'aprobado' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className={`text-sm font-bold ${payer.risk_status === 'aprobado' ? 'text-green-800' : 'text-red-800'}`}>
                                Estado: {payer.risk_status.toUpperCase()}
                            </p>
                            {payer.risk_status === 'aprobado' && (
                                <p className="text-sm text-green-700 mt-1">
                                    Cupo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(payer.approved_quota)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
