'use client'

import React, { useState, useTransition } from 'react'
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  FileCheck,
  ArrowRight,
  Loader2,
  Mail
} from 'lucide-react'
import { 
  uploadPayerDocumentAction, 
  requestOtpAction, 
  updatePayerQuestionsAction,
  verifySignatureAction
} from './actions'
import { useRouter } from 'next/navigation'
import { Copyright } from '@/components/ui/Copyright'
import { DigitalCertificate } from '@/components/DigitalCertificate'

interface DocumentRequirement {
  id: string
  label: string
  description: string
  status: 'pending' | 'uploaded' | 'verified'
}

interface PayerDashboardProps {
  token: string
  payer: any
  documents: any[]
}

export default function PayerDashboard({ token, payer, documents }: PayerDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Initial requirements mapping to calculate progress
  const requirements: DocumentRequirement[] = [
    { id: 'rut', label: 'RUT', description: 'Registro Único Tributario actualizado', status: 'pending' },
    { id: 'camara_comercio', label: 'Cámara de Comercio', description: 'Certificado no mayor a 30 días', status: 'pending' },
    { id: 'cedula_rep_legal', label: 'Cédula Representante', description: 'Cédula de ciudadanía legible (150%)', status: 'pending' },
    { id: 'estados_financieros', label: 'Estados Financieros', description: 'Balance y P&G de los últimos 2 años', status: 'pending' },
    { id: 'renta', label: 'Declaración de Renta', description: 'Último periodo gravable declarado', status: 'pending' },
  ]

  const updatedRequirements = requirements.map(req => {
    const exists = documents.some(d => d.doc_type === req.id)
    return { ...req, status: exists ? 'uploaded' : 'pending' } as DocumentRequirement
  })

  const completedDocs = updatedRequirements.filter(r => r.status !== 'pending').length
  const isSigned = !!payer.signed_at
  const allDocsUploaded = completedDocs === updatedRequirements.length
  
  // Total steps: 5 documents + 1 signature = 6
  const totalSteps = updatedRequirements.length + 1
  const completedSteps = completedDocs + (isSigned ? 1 : 0)
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'signature'>(
    isSigned ? 'signature' : 
    (allDocsUploaded ? 'signature' : (payer.monthly_purchase_value ? 'docs' : 'info'))
  )
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [monthlyValue, setMonthlyValue] = useState(payer.monthly_purchase_value || '')
  
  // Financial fields state
  const [financialData, setFinancialData] = useState({
    legal_representative: payer.legal_representative || '',
    commercial_address: payer.commercial_address || '',
    annual_sales: payer.annual_sales?.toString() || '',
    total_assets: payer.total_assets?.toString() || '',
    total_liabilities: payer.total_liabilities?.toString() || '',
    net_utility: payer.net_utility?.toString() || '',
  })

  // Helper formatting
  const formatCOP = (val: string) => {
    const numeric = val.replace(/\D/g, '')
    if (!numeric) return ''
    return '$ ' + new Intl.NumberFormat('es-CO').format(parseInt(numeric))
  }

  // Solicitor name from join
  const solicitorName = payer.solicitor?.full_name || 'un asesor comercial'


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('token', token)
    formData.append('docType', docType)
    formData.append('file', file)

    setError(null)
    startTransition(async () => {
      const result = await uploadPayerDocumentAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Unformat currency for backend
    const rawValue = monthlyValue.replace(/\D/g, '')
    formData.set('monthly_purchase_value', rawValue)
    formData.append('token', token)

    // Add financial fields to formData
    Object.entries(financialData).forEach(([key, value]) => {
      formData.set(key, value)
    })

    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await updatePayerQuestionsAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage(result.message || 'Información guardada')
        // Auto-advance to next tab after delay
        setTimeout(() => setActiveTab('docs'), 1500)
      }
    })
  }

  const handleRequestOtp = async () => {
    setError(null)
    startTransition(async () => {
      const result = await requestOtpAction(token)
      if (result.error) {
        setError(result.error)
      } else {
        setOtpSent(true)
        setMessage(result.message || 'Código enviado')
      }
    })
  }

  const [showSuccess, setShowSuccess] = useState(false)

  const handleVerifyOtp = async () => {
    if (!otpValue) return
    setError(null)
    startTransition(async () => {
      const result = await verifySignatureAction(token, otpValue)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Firma completada exitosamente. Finalizando...')
        setShowSuccess(true)
        // Explicitly set isSigned locally to prevent flicker before reload
        setTimeout(() => {
           router.refresh()
        }, 500)
      }
    })
  }

  if (showSuccess || isSigned) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center space-y-6">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Proceso Completado con Éxito</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hemos recibido toda tu información y firma correctamente.
            Nuestro equipo evaluará la solicitud y <strong>vía correo electrónico te será confirmada la viabilidad del proceso.</strong>
          </p>

          <DigitalCertificate 
            payerName={payer.razon_social}
            signedAt={payer.signed_at || new Date().toISOString()}
            signedIp={payer.signed_ip || '127.0.0.1'}
            signatureHash={payer.signature_hash || 'PENDIENTE'}
          />

          <div className="pt-8 border-t border-slate-100 italic text-[10px] text-slate-400">
            Este documento es una prueba técnica de la validación realizada.
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Copyright />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {payer.razon_social}</h1>
          <p className="text-slate-500 flex items-center gap-2">
            Debida diligencia solicitada por: <span className="font-bold text-indigo-600">{solicitorName}</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-mono">v2.1</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso Total</p>
            <p className="text-2xl font-black text-indigo-600">{progressPercent}%</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 flex items-center justify-center -rotate-90">
             <span className="rotate-90 text-xs font-bold text-slate-600">{completedSteps}/{totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl max-w-lg mx-auto shadow-inner border border-slate-200">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Información
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'docs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Documentos
        </button>
        <button 
          onClick={() => setActiveTab('signature')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'signature' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Firma Digital
        </button>
      </div>

      {/* Global Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-green-600 text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {message}
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'info' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
           <form onSubmit={handleInfoSubmit} className="p-8 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Perfil de Negocio</h3>
                  <p className="text-sm text-slate-500">Cuéntanos un poco más sobre tu empresa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block text-center">¿A qué se dedica su negocio?</label>
                  <textarea 
                    name="business_activity" 
                    defaultValue={payer.business_activity}
                    required
                    rows={2}
                    placeholder="Ej: Comercialización de insumos médicos..."
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block text-center">¿Qué producto o servicio comprará?</label>
                  <textarea 
                    name="product_service" 
                    defaultValue={payer.product_service}
                    required
                    rows={2}
                    placeholder="Ej: Guantes quirúrgicos, jeringas..."
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block text-center">Valor compra mensual estimada</label>
                  <input 
                    type="text" 
                    name="monthly_purchase_value" 
                    value={formatCOP(monthlyValue)}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    required
                    placeholder="$ 0"
                    className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold text-indigo-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block text-center">Plazo solicitado (Días)</label>
                  <input 
                    type="text" 
                    name="payment_term" 
                    defaultValue={payer.payment_term}
                    required
                    placeholder="Ej: 30"
                    className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold"
                  />
                </div>
              </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isPending}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar y Continuar
                </button>
              </div>

              {/* Financial Section Integrated into Info */}
              <div className="pt-8 border-t border-slate-100 mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <CreditCard className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Información Financiera</h3>
                    <p className="text-sm text-slate-500">Estos datos son necesarios para el estudio de crédito.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Representante Legal</label>
                    <input 
                      type="text" 
                      value={financialData.legal_representative}
                      onChange={(e) => setFinancialData({...financialData, legal_representative: e.target.value})}
                      placeholder="Nombre Completo"
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Dirección Comercial</label>
                    <input 
                      type="text" 
                      value={financialData.commercial_address}
                      onChange={(e) => setFinancialData({...financialData, commercial_address: e.target.value})}
                      placeholder="Calle, Ciudad..."
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Ventas Anuales (BGE)</label>
                    <input 
                      type="number" 
                      value={financialData.annual_sales}
                      onChange={(e) => setFinancialData({...financialData, annual_sales: e.target.value})}
                      placeholder="0"
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Utilidad Neta</label>
                    <input 
                      type="number" 
                      value={financialData.net_utility}
                      onChange={(e) => setFinancialData({...financialData, net_utility: e.target.value})}
                      placeholder="0"
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Total Activos</label>
                    <input 
                      type="number" 
                      value={financialData.total_assets}
                      onChange={(e) => setFinancialData({...financialData, total_assets: e.target.value})}
                      placeholder="0"
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block text-center">Total Pasivos</label>
                    <input 
                      type="number" 
                      value={financialData.total_liabilities}
                      onChange={(e) => setFinancialData({...financialData, total_liabilities: e.target.value})}
                      placeholder="0"
                      className="w-full h-11 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm text-center font-bold"
                    />
                  </div>
                </div>
              </div>
           </form>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {updatedRequirements.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group">
              <div className={`p-3 rounded-xl transition-colors ${req.status === 'pending' ? 'bg-slate-50 text-slate-400' : 'bg-green-50 text-green-600'}`}>
                {req.status === 'pending' ? <Upload className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.label}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {req.status === 'pending' ? 'Pendiente' : 'Cargado'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{req.description}</p>
                <div className="pt-3">
                  <label className={`inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border shadow-sm
                    ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                    ${req.status === 'pending' 
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                  `}>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg" 
                      onChange={(e) => handleFileUpload(e, req.id)}
                      disabled={isPending}
                    />
                    {isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 mr-2" />}
                    {req.status === 'pending' ? 'Cargar Documento' : 'Actualizar Archivo'}
                  </label>
                </div>
              </div>
            </div>
          ))}
          
          <div className="md:col-span-2 flex justify-center gap-4 pt-8">
            <button 
              onClick={() => setActiveTab('info')}
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center gap-2"
            >
              Volver
            </button>
            <button 
              onClick={() => setActiveTab('signature')}
              className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:scale-105 flex items-center gap-3 uppercase tracking-wider"
            >
              Continuar a la Firma Digital
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'signature' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Validación de Identidad y Firma</h3>
                <p className="text-sm text-slate-500">Firma electrónicamente el contrato de servicio AvalIA.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 text-[13px] text-slate-600 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
              <p className="font-bold text-slate-900 uppercase tracking-tight mb-2">Autorización para el Tratamiento de Información</p>
              <p>
                Nosotros obrando en nuestra calidad de deudor y codeudor solidario respectivamente y en nuestro ejercicio del Derecho a la libertad y autodeterminación informática, autorizamos a <strong>Collectia BPO y Cobranzas S.A.S.</strong>, o a la entidad que nuestro acreedor delegue para representarlo o a su cesionario, endosatario o a quien ostente en el futuro la calidad de acreedor, previo a la relación comercial y contractual y de manera irrevocable, escrita, expresa, concreta, suficiente, voluntaria e informada, con la finalidad que la información comercial, crediticia, financiera y de servicios de la cual somos titulares, referida al nacimiento, ejecución y extinción de las obligaciones dinerarias, a nuestro comportamiento e historial crediticio, incluida la información positiva y negativa de mis hábitos de pagos, y aquella que se refiera a la información personal necesaria para el estudio, análisis y eventual otorgamiento de un crédito o celebración de un contrato, sea en general administrada y en especial capturada, tratada, operada, verificada, transmitida, transferida, usada o puesta en circulación y consultada por terceras personas autorizadas expresamente por la ley 1266 de 2008 (Ley de Habeas data).
              </p>
              <p>
                Includos los usuarios de la información, con estos mismos alcances, atributos y finalidad autorizamos expresamente para que tal información sea concernida y reportada en la base de datos de las fuentes de información de los operadores de bancos de datos de información financiera, crediticia, comercial, de servicios y la proveniente de terceros países (<strong>PROCREDITO, TRANSUNION, DATACREDITO, ETC.</strong>), de tal forma que también se autoriza acudir a entidades públicas, bases de datos, Internet, operadores de información de la planilla integrada de liquidación de aportes -Pila-, personas privadas que administren y pongan en conocimiento datos de Usuarios, compañías especializadas. 
              </p>
              <p>
                De la misma manera autorizamos a cualquier operador de banco de datos de información que tienen una finalidad estrictamente comercial, financiera, crediticia y de servicios, para que procese, opere y administre la información de la cual somos sus titulares, y para que la misma sea transferida y transmitida a usuarios, lo mismo que a otros operadores nacionales o extranjeros que tengan la misma finalidad.
              </p>
              <p>
                Certificamos que los datos personales suministrados por nosotros son veraces, completos, exactos, actualizados, reales y comprobables. Por tanto, cualquier error en la información suministrada será de nuestra única y exclusiva responsabilidad ante las autoridades judiciales y/o administrativas. 
              </p>
              <p>
                Declaramos expresamente que hemos leído y comprendido a cabalidad el contenido de la presente <strong>AUTORIZACIÓN</strong>, Y ACEPTAMOS la finalidad en ella descrita y las consecuencias que se deriven de ella. Autorizamos recibir información y notificación por parte de ustedes vía celular, correo electrónico u otros medios.
              </p>
            </div>

            {payer.signed_at ? (
              <div className="flex flex-col items-center justify-center py-12 bg-green-50 rounded-3xl border border-green-100 border-dashed space-y-3">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <div className="text-center">
                  <p className="text-xl font-black text-green-900">Firmado Electrónicamente</p>
                  <p className="text-sm text-green-600">Fecha: {new Date(payer.signed_at).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-6 border-2 border-dashed border-slate-100 rounded-3xl transition-all hover:bg-slate-50/50">
                {!otpSent ? (
                  <>
                    <Mail className="w-12 h-12 text-slate-300" />
                    <div className="text-center space-y-1 px-4">
                      <p className="font-bold text-slate-900 text-lg">Enviar código a su correo</p>
                      <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                        Se enviará un código de verificación a <strong>{payer.contact_email}</strong> para completar el proceso.
                      </p>
                    </div>
                    <button 
                      onClick={handleRequestOtp}
                      disabled={isPending}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Solicitar Código OTP
                    </button>
                  </>
                ) : (
                  <div className="w-full max-w-xs space-y-6 px-4">
                    <div className="text-center space-y-2">
                      <p className="font-bold text-slate-900">Ingrese el código</p>
                      <p className="text-xs text-slate-500">Enviamos un código de 6 dígitos a su correo</p>
                    </div>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="000000"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="w-full h-14 text-center text-3xl font-black tracking-[0.5em] border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all"
                    />
                    <button 
                      onClick={handleVerifyOtp}
                      disabled={isPending || otpValue.length < 6}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Verificar y Firmar
                    </button>
                    <button 
                      onClick={() => setOtpSent(false)}
                      className="w-full text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                      Volver a solicitar código
                    </button>
                    <button 
                      onClick={() => setActiveTab('docs')}
                      className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                      Volver a Documentos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
