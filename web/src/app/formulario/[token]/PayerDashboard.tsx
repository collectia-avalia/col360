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
  verifySignatureAction,
  updatePayerQuestionsAction
} from './actions'
import { useRouter } from 'next/navigation'

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
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'signature' | 'dashboard'>('info')
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [monthlyValue, setMonthlyValue] = useState(payer.monthly_purchase_value || '')

  // Helper formatting
  const formatCOP = (val: string) => {
    const numeric = val.replace(/\D/g, '')
    if (!numeric) return ''
    return '$ ' + new Intl.NumberFormat('es-CO').format(parseInt(numeric))
  }

  // Solicitor name from join
  const solicitorName = payer.solicitor?.full_name || 'un asesor comercial'

  // Initial requirements
  const requirements: DocumentRequirement[] = [
    { id: 'rut', label: 'RUT', description: 'Registro Único Tributario actualizado', status: 'pending' },
    { id: 'camara_comercio', label: 'Cámara de Comercio', description: 'Certificado no mayor a 30 días', status: 'pending' },
    { id: 'cedula_rep_legal', label: 'Cédula Representante', description: 'Cédula de ciudadanía legible (150%)', status: 'pending' },
    { id: 'estados_financieros', label: 'Estados Financieros', description: 'Balance y P&G de los últimos 2 años', status: 'pending' },
    { id: 'renta', label: 'Declaración de Renta', description: 'Último periodo gravable declarado', status: 'pending' },
  ]

  // Map existing documents to requirements
  const updatedRequirements = requirements.map(req => {
    const exists = documents.some(d => d.doc_type === req.id)
    return { ...req, status: exists ? 'uploaded' : 'pending' } as DocumentRequirement
  })

  const completedDocs = updatedRequirements.filter(r => r.status !== 'pending').length
  const progressPercent = Math.round((completedDocs / updatedRequirements.length) * 100)

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

  const handleVerifyOtp = async () => {
    if (!otpValue) return
    setError(null)
    startTransition(async () => {
      const result = await verifySignatureAction(token, otpValue)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Firma completada exitosamente')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido, {payer.razon_social}</h1>
          <p className="text-slate-500">
            Debida diligencia solicitada por: <span className="font-bold text-indigo-600">{solicitorName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso Total</p>
            <p className="text-2xl font-black text-indigo-600">{progressPercent}%</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 flex items-center justify-center -rotate-90">
             <span className="rotate-90 text-xs font-bold text-slate-600">{completedDocs}/5</span>
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
        <button 
          onClick={() => setActiveTab('dashboard')}
          disabled={payer.risk_status !== 'aprobado'}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
        >
          Mi Cupo
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1 group">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cupo Asignado</p>
            <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payer.approved_quota || 0)}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${payer.risk_status === 'aprobado' ? 'bg-green-500' : 'bg-amber-500'}`} />
              Estado: <span className="capitalize font-bold">{payer.risk_status}</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1 group cursor-pointer hover:border-indigo-200 transition-all">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facturas Radicadas</p>
            <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">0</p>
            <p className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-widest">
              Ver Detalles <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200 space-y-1 flex flex-col justify-center relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-110 group-hover:rotate-12">
               <FileCheck className="w-12 h-12" />
             </div>
             <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest relative z-10">Solicitudes Extra</p>
             <p className="text-xl font-bold relative z-10">Solicitar Aumento de Cupo</p>
             <p className="text-xs text-indigo-100 relative z-10">Disponible según comportamiento</p>
          </div>
        </div>
      )}
    </div>
  )
}
