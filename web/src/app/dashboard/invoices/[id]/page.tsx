import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, DollarSign, MessageSquare, Mail, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

import { EmailButton } from '../EmailButton'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener Factura con Pagador
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, payers(*)')
    .eq('id', id)
    .single()

  if (!invoice) {
    notFound()
  }

  // Cálculos de Mora y Probabilidad
  const now = new Date()
  const dueDate = new Date(invoice.due_date)
  const isOverdue = now > dueDate && invoice.status !== 'pagada'
  
  const diffTime = Math.abs(now.getTime() - dueDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
  const daysOverdue = isOverdue ? diffDays : 0

  // Probabilidad de Pago (Lógica simple por ahora)
  let paymentProbability = 'Alta'
  let probabilityColor = 'text-green-600 bg-green-100'
  
  if (daysOverdue > 30) {
    paymentProbability = 'Baja'
    probabilityColor = 'text-red-600 bg-red-100'
  } else if (daysOverdue > 0) {
    paymentProbability = 'Media'
    probabilityColor = 'text-yellow-600 bg-yellow-100'
  }

  if (invoice.status === 'pagada') {
      paymentProbability = 'Pagado'
      probabilityColor = 'text-blue-600 bg-blue-100'
  }

  // Generar Link de WhatsApp
  const contactPhone = invoice.payers?.contact_phone?.replace(/\D/g,'') || ''
  const whatsappMessage = `Hola ${invoice.payers?.contact_name}, te escribo por la factura ${invoice.invoice_number} de ${invoice.payers?.razon_social} que tiene fecha de vencimiento ${new Date(invoice.due_date).toLocaleDateString()}.`
  const whatsappLink = contactPhone ? `https://wa.me/${contactPhone}?text=${encodeURIComponent(whatsappMessage)}` : '#'

  // Formatear Moneda
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
  
  // Generar URL firmada para el documento (si existe)
  let signedFileUrl = null
  if (invoice.file_url) {
    // Si la URL ya es http (ej: mock o pública), la usamos directo
    if (invoice.file_url.startsWith('http')) {
        signedFileUrl = invoice.file_url
    } else {
        // Si es un path relativo de storage, generamos URL firmada
        const { data } = await supabase.storage
            .from('invoices-docs')
            .createSignedUrl(invoice.file_url, 3600) // 1 hora
        
        if (data?.signedUrl) {
            signedFileUrl = data.signedUrl
        }
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a Mis Facturas
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                Factura #{invoice.invoice_number}
                <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium capitalize 
                    ${invoice.status === 'vigente' ? 'bg-blue-100 text-blue-800' : 
                      invoice.status === 'pagada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {invoice.status}
                </span>
            </h1>
            <div className="mt-4 md:mt-0 flex space-x-3">
                <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors ${!contactPhone ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                    <MessageSquare className="-ml-1 mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                </a>
                <EmailButton 
                    invoiceId={invoice.id}
                    email={invoice.payers?.contact_email || ''}
                    subject={`Gestión Factura ${invoice.invoice_number}`}
                    body={whatsappMessage}
                    disabled={!invoice.payers?.contact_email}
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Información Detallada */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Alerta de Mora */}
            {isOverdue && daysOverdue > 30 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <span className="font-bold">¡Atención!</span> Esta factura ha superado el límite de riesgo. Se recomienda iniciar gestión de cobro pre-jurídico.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Detalles Financieros</h3>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Valor Factura</dt>
                        <dd className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Pagador</dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900">{invoice.payers?.razon_social}</dd>
                        <dd className="text-sm text-gray-500">NIT: {invoice.payers?.nit}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Fecha Emisión
                        </dt>
                        <dd className="mt-1 text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Fecha Vencimiento
                        </dt>
                        <dd className={`mt-1 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(invoice.due_date).toLocaleDateString()}
                            {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Vencida hace {daysOverdue} días</span>}
                        </dd>
                    </div>
                </div>
            </div>

            {/* Archivos Adjuntos */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Documentos</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    <li className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900">Factura Original (XML/PDF)</span>
                        </div>
                        {signedFileUrl ? (
                            <a 
                                href={signedFileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"
                            >
                                Ver documento
                                <span className="ml-1">↗</span>
                            </a>
                        ) : (
                            <span className="text-sm text-gray-400 cursor-not-allowed">No disponible</span>
                        )}
                    </li>
                    {/* Aquí se listarían más docs si hubiera */}
                </ul>
            </div>
        </div>

        {/* Columna Derecha: Timeline y Probabilidad */}
        <div className="space-y-6">
            
            {/* Probabilidad de Pago */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Probabilidad de Pago</h3>
                <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${probabilityColor}`}>
                        {paymentProbability}
                    </span>
                    <span className="text-xs text-gray-400">Basado en historial</span>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${probabilityColor.split(' ')[1]}`} style={{ width: paymentProbability === 'Alta' ? '90%' : paymentProbability === 'Media' ? '50%' : '20%' }}></div>
                </div>
            </div>

            {/* Timeline Vertical */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Historial de Gestión</h3>
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {/* Evento 1: Radicación */}
                        <li>
                            <div className="relative pb-8">
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                            <FileText className="h-5 w-5 text-white" aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Factura Radicada</p>
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                            <time dateTime={invoice.issue_date}>{new Date(invoice.issue_date).toLocaleDateString()}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>

                        {/* Evento 2: Vencimiento (Si pasó) */}
                        {isOverdue && (
                             <li>
                                <div className="relative pb-8">
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                                <AlertTriangle className="h-5 w-5 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Vencimiento de Factura</p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                <time dateTime={invoice.due_date}>{new Date(invoice.due_date).toLocaleDateString()}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )}

                        {/* Evento 3: Estado Actual */}
                        <li>
                            <div className="relative pb-8">
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white 
                                            ${invoice.status === 'pagada' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                            {invoice.status === 'pagada' ? (
                                                <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-white" aria-hidden="true" />
                                            )}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {invoice.status === 'pagada' ? 'Pago Confirmado' : 'En Gestión de Cobro'}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                            <time>Hoy</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
