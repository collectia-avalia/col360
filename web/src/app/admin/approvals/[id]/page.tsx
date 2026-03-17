import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, ShieldCheck, Award } from 'lucide-react'
import DecisionForm from './decision-form'
import { DigitalCertificate } from '@/components/DigitalCertificate'

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
                            <dt className="text-sm font-medium text-gray-500">Actividad de Negocio</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payer.business_activity || '-'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Producto/Servicio</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payer.product_service || '-'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Compra Mensual / Plazo</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {payer.monthly_purchase_value ? `$ ${new Intl.NumberFormat('es-CO').format(payer.monthly_purchase_value)}` : '-'} / {payer.payment_term || '-'} días
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Checklist de Debida Diligencia */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 sm:px-6 bg-slate-900 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-indigo-400" />
                       Resumen de Debida Diligencia
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CheckItem 
                      label="Información Completa" 
                      isDone={!!(payer.business_activity && payer.product_service && payer.monthly_purchase_value)} 
                    />
                    <CheckItem 
                      label="Documentos Cargados" 
                      isDone={docsWithUrls.length >= 5} 
                      sub={`(${docsWithUrls.length}/5)`}
                    />
                    <CheckItem 
                      label="Firma Electrónica" 
                      isDone={!!payer.signed_at} 
                    />
                </div>
            </div>

            {/* Tarjeta Documentos */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Documentación Legal</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Archivos adjuntos para análisis de debida diligencia.</p>
                    </div>
                    {payer.signed_at && (
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                           <ShieldCheck className="w-4 h-4 text-green-600" />
                           <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Firmado OTP</span>
                        </div>
                    )}
                </div>
                <ul className="divide-y divide-gray-200">
                    {docsWithUrls.map((doc) => (
                        <li key={doc.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="bg-slate-50 p-2 rounded-lg mr-4">
                                    <FileText className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 truncate capitalize">
                                        {doc.doc_type.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-gray-500">Subido el {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="ml-5 flex-shrink-0">
                                {doc.signedUrl ? (
                                    <a href={doc.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                        <Download className="h-3.5 w-3.5 mr-1.5" /> Ver DocumentO
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-sm italic">Ocurrió un error al generar link</span>
                                )}
                            </div>
                        </li>
                    ))}
                    {docsWithUrls.length === 0 && (
                        <li className="px-4 py-12 text-center">
                            <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">No hay documentos cargados por el pagador.</p>
                        </li>
                    )}
                </ul>
            </div>

            {/* Signature Proof if exists */}
            {payer.signed_at && (
                <DigitalCertificate 
                    payerName={payer.razon_social}
                    signedAt={payer.signed_at}
                    signedIp={payer.signed_ip}
                    signatureHash={payer.signature_hash}
                />
            )}
        </div>

        {/* Columna Derecha: Panel de Decisión */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Solicitante</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {payer.profiles?.company_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-tight">{payer.profiles?.company_name || 'Sin Nombre'}</p>
                            <p className="text-xs text-slate-500">{payer.profiles?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mostrar panel de decisión SOLO si está pendiente o en estudio */}
            {(payer.risk_status === 'pendiente' || payer.risk_status === 'en estudio') ? (
                <DecisionForm payerId={payerId} />
            ) : (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className={`h-2 ${payer.risk_status === 'aprobado' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Dictamen Final</h3>
                        <p className="text-sm text-slate-500 mb-6">Esta solicitud ya ha sido procesada por el comité de crédito.</p>
                        
                        <div className={`rounded-2xl p-6 ${payer.risk_status === 'aprobado' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            <p className={`text-xs font-black uppercase tracking-widest ${payer.risk_status === 'aprobado' ? 'text-green-600' : 'text-red-600'}`}>
                                Estado Final
                            </p>
                            <p className={`text-2xl font-black mt-1 ${payer.risk_status === 'aprobado' ? 'text-green-900' : 'text-red-900'}`}>
                                {payer.risk_status.toUpperCase()}
                            </p>
                            {payer.risk_status === 'aprobado' && (
                                <div className="mt-4 pt-4 border-t border-green-100">
                                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Cupo Autorizado</p>
                                    <p className="text-2xl font-black text-green-900">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payer.approved_quota)}
                                    </p>
                                </div>
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

function CheckItem({ label, isDone, sub }: { label: string, isDone: boolean, sub?: string }) {
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDone ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight">{label}</p>
        <p className="text-[10px] uppercase font-black opacity-60 tracking-wider">
          {isDone ? 'Completado' : 'Pendiente'} {sub}
        </p>
      </div>
    </div>
  )
}
