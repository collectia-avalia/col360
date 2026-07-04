'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPayerDocumentAdminAction, analyzeCreditStudyAction } from '../actions'
import { 
  FileText, Upload, Sparkles, AlertTriangle, ShieldCheck, 
  ChevronDown, ChevronUp, DollarSign, Calendar, Check, Play, RefreshCw 
} from 'lucide-react'

interface VariableDetail {
  name: string
  value: string | number
  points: number
}

interface BlockDetail {
  subtotal: number
  normalized: number
  variables: VariableDetail[]
}

interface CreditStudyResult {
  score: number
  category: string
  disasterScreening: {
    applied: boolean
    neutralized: boolean
    justification: string
  }
  blocks: {
    block1: BlockDetail
    block2: BlockDetail
    block3: BlockDetail
  }
  dimensions: {
    name: string
    status: 'green' | 'yellow' | 'red'
    verdict: string
  }[]
  quota: {
    netUtilityMonthly: number
    riskLevel: 'bajo' | 'medio' | 'medio-alto' | 'alto'
    multiplier: number
    recommendedQuota: number
    recommendedTerm: number
  }
  executiveSummary: string
}

export default function CreditStudyPanel({ 
  payerId, 
  payerName,
  historyDoc,
  studyResult 
}: { 
  payerId: string
  payerName: string
  historyDoc?: any
  studyResult?: CreditStudyResult | null
}) {
  const router = useRouter()
  const [isUploading, startUploadTransition] = useTransition()
  const [isAnalyzing, startAnalyzeTransition] = useTransition()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [showDesglose, setShowDesglose] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')

  // Controlar la subida manual de la historia de crédito
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('Por favor selecciona únicamente archivos PDF.')
      return
    }

    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('docType', 'historia_credito')

    startUploadTransition(async () => {
      const res = await uploadPayerDocumentAdminAction(payerId, formData)
      if (res?.error) {
        setUploadError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  // Ejecutar el análisis con Gemini
  const handleAnalyze = async () => {
    setAnalyzeError(null)
    
    // Simular pasos en el frontend mientras el backend ejecuta el fetch
    const steps = [
      'Descargando Historia de Crédito...',
      'Extrayendo texto del PDF con pdf-parse...',
      'Enviando informe de riesgo a Gemini 2.5 Flash...',
      'Calculando scoring SARC Wy CF...',
      'Generando veredicto cualitativo y justificación...',
      'Persitiendo informe final...'
    ]
    
    let currentStepIdx = 0
    setAnalysisStep(steps[0])
    
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++
        setAnalysisStep(steps[currentStepIdx])
      }
    }, 3000)

    startAnalyzeTransition(async () => {
      try {
        const res = await analyzeCreditStudyAction(payerId)
        clearInterval(interval)
        if (res?.error) {
          setAnalyzeError(res.error)
        } else {
          router.refresh()
        }
      } catch (err: any) {
        clearInterval(interval)
        setAnalyzeError(err.message || 'Error inesperado al ejecutar análisis.')
      } finally {
        setAnalysisStep('')
      }
    })
  }

  // Pre-rellenar el formulario lateral agregando parámetros de consulta a la URL
  const handlePreFill = () => {
    if (!studyResult) return
    const { quota, score, category } = studyResult
    
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set('suggestedQuota', quota.recommendedQuota.toString())
    
    const explanation = `Aprobado según scoring SARC Wy CF: Score ${score}/1000 (Categoría ${category}). Riesgo ${quota.riskLevel.toUpperCase()}. Cupo sugerido de $${new Intl.NumberFormat('es-CO').format(quota.recommendedQuota)} COP a un plazo de ${quota.recommendedTerm} días. Ancla basada en utilidad mensualizada de $${new Intl.NumberFormat('es-CO').format(quota.netUtilityMonthly)} COP con multiplicador de ${quota.multiplier}x.`
    
    searchParams.set('suggestedReason', explanation)
    
    router.push(`?${searchParams.toString()}`)
  }

  // Helper para pintar los colores del semáforo
  const getSemaphoreColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-green-500 text-white'
      case 'yellow': return 'bg-yellow-500 text-white'
      case 'red': return 'bg-red-500 text-white'
      default: return 'bg-slate-300'
    }
  }

  const getBadgeBg = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-green-50 border-green-200 text-green-700'
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'red': return 'bg-red-50 border-red-200 text-red-700'
      default: return 'bg-slate-50'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
      
      {/* Encabezado del Panel */}
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Estudio de Crédito Comercial
          </h2>
          <p className="text-xs text-slate-500 mt-1">Análisis e informe de riesgo bajo el modelo SARC Wy CF</p>
        </div>
        {historyDoc && !studyResult && !isAnalyzing && (
          <button
            onClick={handleAnalyze}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            Analizar con IA
          </button>
        )}
      </div>

      {/* CASO 1: NO TIENE HISTORIA DE CRÉDITO CARGADA */}
      {!historyDoc && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Cargar Historia de Crédito (Confidencial)</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            El analista debe cargar el PDF obtenido de Experian / DataCrédito. Este archivo es estrictamente privado y no será visible para el cliente.
          </p>

          <label className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors">
            {isUploading ? 'Subiendo archivo...' : 'Seleccionar PDF'}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* CASO 2: HISTORIA CARGADA, PERO PENDIENTE DE ANÁLISIS */}
      {historyDoc && !studyResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 capitalize">Historia de Crédito</p>
                <p className="text-xs text-slate-500">Cargada por el Analista. Lista para análisis.</p>
              </div>
            </div>
            
            <a
              href={`/api/docs/sign?path=${encodeURIComponent(historyDoc.file_path)}&bucket=legal-docs`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
            >
              Ver Archivo
            </a>
          </div>

          {isAnalyzing ? (
            <div className="border border-indigo-100 rounded-xl p-8 text-center bg-indigo-50/10 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-indigo-500 absolute top-3.5 left-3.5 animate-pulse" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Ejecutando Análisis Inteligente...</h3>
              <p className="text-xs text-indigo-600 font-medium animate-pulse">{analysisStep}</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                La IA está interpretando la historia crediticia, cruzando balances, calculando el score SARC Wy CF y aplicando reglas de neutralización de moras. Esto puede tardar 10-15 segundos.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 border border-slate-100 rounded-xl bg-slate-50/50">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-800">Scoring SARC Wy CF Disponible</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                Ejecuta el análisis con IA para calcular automáticamente los bloques de scoring y obtener sugerencias de cupo.
              </p>
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ejecutar Análisis
              </button>
            </div>
          )}

          {analyzeError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
              {analyzeError}
            </div>
          )}
        </div>
      )}

      {/* CASO 3: ANÁLISIS COMPLETADO (REPORTES DE IA) */}
      {studyResult && (
        <div className="space-y-6">
          
          {/* Fila de KPIs de Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* KPI Score */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score SARC PJ</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{studyResult.score}/1.000</p>
              </div>
              <div className="mt-4">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border
                  ${studyResult.score >= 750 ? 'bg-green-100 border-green-200 text-green-800' :
                    studyResult.score >= 500 ? 'bg-yellow-100 border-yellow-200 text-yellow-800' : 
                    'bg-red-100 border-red-200 text-red-800'}`}>
                  Categoría {studyResult.category}
                </span>
              </div>
            </div>

            {/* KPI Cupo Sugerido */}
            <div className="border border-slate-200 rounded-xl p-4 bg-indigo-50/30 flex flex-col justify-between overflow-hidden">
              <div>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Cupo Recomendado
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-indigo-950 mt-1 break-words leading-tight">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(studyResult.quota.recommendedQuota)}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Plazo sugerido: <strong className="text-indigo-700">{studyResult.quota.recommendedTerm} días</strong> ({studyResult.quota.riskLevel.toUpperCase()})
              </p>
            </div>

            {/* KPI Ancla Financiera */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between overflow-hidden">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Utilidad Neta Mensual
                </p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 mt-1 break-words leading-tight">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(studyResult.quota.netUtilityMonthly)}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Multiplicador aplicado: <strong className="text-slate-700">{studyResult.quota.multiplier}x</strong>
              </p>
            </div>

          </div>

          {/* Advertencia / Justificación Disaster Screening */}
          {studyResult.disasterScreening.applied && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Detección de Disaster Screening (Score Experian &lt; 600)
              </div>
              <p className="text-xs text-amber-900 font-medium">
                <strong>Estado de Neutralización:</strong> {studyResult.disasterScreening.neutralized ? '✅ Neutralizado a 0 (Aprobado)' : '❌ Aplicado castigo de -1.000'}
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed pt-1 font-medium italic">
                "{studyResult.disasterScreening.justification}"
              </p>
            </div>
          )}

          {/* Semáforos de las 6 Dimensiones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matriz de 6 Dimensiones (Semáforo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studyResult.dimensions.map((dim, idx) => (
                <div key={idx} className={`p-3 border rounded-xl flex items-start gap-2.5 ${getBadgeBg(dim.status)}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${getSemaphoreColor(dim.status)}`}>
                    {dim.status === 'green' ? 'G' : dim.status === 'yellow' ? 'Y' : 'R'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{dim.name}</h4>
                    <p className="text-[11px] text-slate-600 leading-snug mt-1 font-medium">{dim.verdict}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose de Score Ponderado */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDesglose(!showDesglose)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 font-bold text-xs uppercase tracking-wider"
            >
              <span>Desglose Detallado de Variables SARC Wy CF</span>
              {showDesglose ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDesglose && (
              <div className="divide-y divide-slate-100 bg-white">
                
                {/* Bloque 1 */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg">
                    <h4 className="text-xs font-bold text-indigo-950">Bloque 1: Variables Financieras y de Riesgo (35%)</h4>
                    <span className="text-xs font-bold text-indigo-700">Subtotal: {studyResult.blocks.block1.subtotal} pts · Normalizado: {studyResult.blocks.block1.normalized}/1000</span>
                  </div>
                  <table className="w-full text-xs text-left text-slate-600">
                    <tbody>
                      {studyResult.blocks.block1.variables.map((v, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                          <td className="py-2 text-slate-700 font-medium">{v.name}</td>
                          <td className="py-2 text-slate-500 font-bold text-center">{v.value}</td>
                          <td className="py-2 text-right font-bold text-slate-900">{v.points} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 2 */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg">
                    <h4 className="text-xs font-bold text-indigo-950">Bloque 2: Variables Propias del Negocio (35%)</h4>
                    <span className="text-xs font-bold text-indigo-700">Subtotal: {studyResult.blocks.block2.subtotal} pts · Normalizado: {studyResult.blocks.block2.normalized}/1000</span>
                  </div>
                  <table className="w-full text-xs text-left text-slate-600">
                    <tbody>
                      {studyResult.blocks.block2.variables.map((v, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                          <td className="py-2 text-slate-700 font-medium">{v.name}</td>
                          <td className="py-2 text-slate-500 font-bold text-center">{v.value}</td>
                          <td className="py-2 text-right font-bold text-slate-900">{v.points} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 3 */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg">
                    <h4 className="text-xs font-bold text-indigo-950">Bloque 3: Variables Adicionales PJ (30%)</h4>
                    <span className="text-xs font-bold text-indigo-700">Subtotal: {studyResult.blocks.block3.subtotal} pts · Normalizado: {studyResult.blocks.block3.normalized}/1000</span>
                  </div>
                  <table className="w-full text-xs text-left text-slate-600">
                    <tbody>
                      {studyResult.blocks.block3.variables.map((v, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                          <td className="py-2 text-slate-700 font-medium">{v.name}</td>
                          <td className="py-2 text-slate-500 font-bold text-center">{v.value}</td>
                          <td className="py-2 text-right font-bold text-slate-900">{v.points} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>

          {/* Resumen Ejecutivo */}
          <div className="space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/30">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen Ejecutivo de Riesgos</h3>
            <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line prose max-w-none">
              {studyResult.executiveSummary}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            
            <button
              onClick={handlePreFill}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors gap-2"
            >
              <Check className="w-4 h-4" />
              Pre-rellenar Dictamen en Panel
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-bold rounded-lg shadow-xs transition-all gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analizar
            </button>

            <a
              href={`/api/docs/sign?path=${encodeURIComponent(historyDoc.file_path)}&bucket=legal-docs`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-bold rounded-lg shadow-xs transition-all gap-1.5"
            >
              Ver PDF Original
            </a>

          </div>

        </div>
      )}

    </div>
  )
}
