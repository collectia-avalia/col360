import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building, FileText, CheckCircle, XCircle, DollarSign, Clock, Pencil, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PayerActions } from './PayerActions'
import { InvoicesTable } from './InvoicesTable'
import { DigitalCertificate } from '@/components/DigitalCertificate'

export default async function PayerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Obtener detalles del pagador CON sus facturas
  const { data: payer, error } = await supabase
    .from('payers')
    .select('*, invoices(*), payer_documents(*)')
    .eq('id', id)
    .single()

  if (error || !payer) {
    notFound()
  }

  // Estilos y etiquetas según estado
  const statusConfig = {
    pendiente: {
      label: 'En Estudio',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      icon: Clock
    },
    aprobado: {
      label: 'Aprobado',
      color: 'text-green-700 bg-green-50 border-green-200',
      icon: CheckCircle
    },
    rechazado: {
      label: 'Rechazado',
      color: 'text-red-700 bg-red-50 border-red-200',
      icon: XCircle
    }
  }

  const status = statusConfig[payer.risk_status as keyof typeof statusConfig] || statusConfig.pendiente
  const StatusIcon = status.icon

  const documents = (payer.payer_documents || []) as any[]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/payers" 
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{payer.razon_social}</h1>
                <p className="text-sm text-slate-500">Detalles del pagador y estado de riesgo</p>
            </div>
        </div>
        
        {/* Acciones Client-Side */}
        <PayerActions payer={payer} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información Principal */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                        <Building className="w-4 h-4 mr-2 text-slate-400" />
                        Información de la Empresa
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">NIT</label>
                        <p className="text-base font-medium text-slate-900">{payer.nit}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Actividad</label>
                        <p className="text-base font-medium text-slate-900">{payer.business_activity || 'No especificado'}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Producto/Servicio</label>
                        <p className="text-base font-medium text-slate-900">{payer.product_service || 'No registrado'}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Compra Mensual / Plazo</label>
                        <p className="text-base font-medium text-slate-900">
                          {payer.monthly_purchase_value ? `$ ${new Intl.NumberFormat('es-CO').format(payer.monthly_purchase_value)}` : '-'} / {payer.payment_term || '-'} días
                        </p>
                    </div>
                </div>
            </div>

            {/* Checklist de Debida Diligencia */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-900">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-indigo-400" />
                       Progreso Debida Diligencia
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CheckItem 
                      label="Información" 
                      isDone={!!(payer.business_activity && payer.product_service && payer.monthly_purchase_value)} 
                    />
                    <CheckItem 
                      label="Documentos" 
                      isDone={documents.length >= 5} 
                      sub={`(${documents.length}/5)`}
                    />
                    <CheckItem 
                      label="Firma OTP" 
                      isDone={!!payer.signed_at} 
                    />
                </div>
            </div>

            {/* Documentos (Placeholder) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-slate-400" />
                        Documentos Adjuntos
                    </h3>
                </div>
                <div className="p-6 space-y-3">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-500 mr-4">
                              <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-slate-500">Subido el {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4 italic">No hay documentos cargados aún.</p>
                    )}
                </div>
            </div>

            {/* Visual Signature Certificate */}
            {payer.signed_at && (
              <DigitalCertificate 
                payerName={payer.razon_social}
                signedAt={payer.signed_at}
                signedIp={payer.signed_ip}
                signatureHash={payer.signature_hash}
              />
            )}
        </div>

        {/* Columna Derecha: Estado y Acciones */}
        <div className="space-y-6">
            {/* Tarjeta de Estado */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wide">Estado de Riesgo</h3>
                
                <div className={`flex items-center p-4 rounded-lg border ${status.color} mb-6`}>
                    <StatusIcon className="w-8 h-8 mr-3 opacity-80" />
                    <div>
                        <p className="font-bold text-lg">{status.label}</p>
                        <p className="text-xs opacity-80">
                            {payer.risk_status === 'pendiente' ? 'En proceso de análisis financiero.' : 
                             payer.risk_status === 'aprobado' ? 'Cupo disponible para uso inmediato.' : 
                             'No cumple con las políticas de riesgo.'}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-500">Cupo Aprobado</span>
                            <DollarSign className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(payer.approved_quota || 0)}
                        </p>
                    </div>
                    
                    {payer.risk_status === 'aprobado' && (
                        <div>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-500">Disponible</span>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">100%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-full"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <Link 
                        href={payer.risk_status === 'aprobado' ? `/dashboard/invoices/new?payerId=${payer.id}` : '#'}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors
                            ${payer.risk_status === 'aprobado' 
                                ? 'bg-avalia-blue hover:bg-avalia-violet' 
                                : 'bg-slate-300 cursor-not-allowed'
                            }`}
                        aria-disabled={payer.risk_status !== 'aprobado'}
                    >
                        Radicar Factura
                    </Link>
                    {payer.risk_status !== 'aprobado' && (
                        <p className="text-xs text-center text-slate-400 mt-2">
                            Disponible una vez aprobado el cupo.
                        </p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Historial de Facturas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Historial de Facturas</h2>
        <InvoicesTable invoices={payer.invoices || []} payerId={payer.id} />
      </div>
    </div>
  )
}

function CheckItem({ label, isDone, sub }: { label: string, isDone: boolean, sub?: string }) {
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDone ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-200 text-slate-400'}`}>
        <CheckCircle className="w-5 h-5" />
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
