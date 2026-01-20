'use client'

import { createInvoiceAction } from '../actions'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, UploadCloud, FileText, Calendar, DollarSign, ShieldCheck } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isPending ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
          Radicando...
        </>
      ) : (
        'Radicar Factura'
      )}
    </button>
  )
}

type PayerOption = {
  id: string
  razon_social: string
  nit: string
}

export default function NewInvoiceForm({ payers }: { payers: PayerOption[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const defaultPayerId = searchParams.get('payerId') || ''
  const [selectedPayerId, setSelectedPayerId] = useState(defaultPayerId)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<{
    invoiceNumber?: string
    amount?: number
    issueDate?: string
    dueDate?: string
    nit?: string
  } | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showFields, setShowFields] = useState(false)
  const [isPdf, setIsPdf] = useState(false)

  const normalizeNit = (nit: string | null | undefined) => {
    if (!nit) return ''
    return nit.replace(/[^0-9]/g, '')
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsAnalyzing(true)
    setParsedData(null)
    setSelectedPayerId('')
    setIsPdf(false)
    
    // Simular tiempo de análisis (UX "Mágica")
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (file.name.toLowerCase().endsWith('.pdf')) {
        setIsPdf(true)
        setIsAnalyzing(false)
        setShowFields(true)
        return
    }

    if (file.name.toLowerCase().endsWith('.xml')) {
      try {
        const text = await file.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, "text/xml")
        
        const getTagValue = (tagName: string) => {
            const tags = xmlDoc.getElementsByTagName(tagName)
            return tags.length > 0 ? tags[0].textContent : null
        }
        
        const invoiceNumber = getTagValue('ID') || getTagValue('cbc:ID')
        const issueDate = getTagValue('IssueDate') || getTagValue('cbc:IssueDate')
        const dueDate = getTagValue('DueDate') || getTagValue('cbc:DueDate')
        const payableAmount = getTagValue('PayableAmount') || getTagValue('cbc:PayableAmount')
        
        // --- Extracción del NIT del Pagador ---
        let payerNit = null
        
        // Estrategia 1: AccountingCustomerParty -> PartyTaxScheme -> CompanyID
        const customerParty = xmlDoc.getElementsByTagName('AccountingCustomerParty')[0] || xmlDoc.getElementsByTagName('cac:AccountingCustomerParty')[0]
        if (customerParty) {
            const taxScheme = customerParty.getElementsByTagName('PartyTaxScheme')[0] || customerParty.getElementsByTagName('cac:PartyTaxScheme')[0]
            if (taxScheme) {
                const companyID = taxScheme.getElementsByTagName('CompanyID')[0] || taxScheme.getElementsByTagName('cbc:CompanyID')[0]
                if (companyID) payerNit = companyID.textContent
            }
        }
        
        // Match Payer (Lógica Mejorada)
        if (payerNit) {
            const nPayerNit = normalizeNit(payerNit)
            
            const foundPayer = payers.find(p => {
                const nP = normalizeNit(p.nit)
                // Match exacto de base numérica
                if (nP === nPayerNit) return true
                // XML tiene dígito extra (posible DV)
                if (nPayerNit.length === nP.length + 1 && nPayerNit.startsWith(nP)) return true
                // DB tiene dígito extra (posible DV)
                if (nP.length === nPayerNit.length + 1 && nP.startsWith(nPayerNit)) return true
                
                return false
            })

            if (foundPayer) {
                setSelectedPayerId(foundPayer.id)
            }
        } else {
            // Estrategia 2: Buscar en todos los CompanyID si alguno coincide con nuestros payers normalizados
            const allCompanyIDs = Array.from(xmlDoc.getElementsByTagName('CompanyID'))
            for (const cid of allCompanyIDs) {
                const nCid = normalizeNit(cid.textContent)
                const found = payers.find(p => {
                    const nP = normalizeNit(p.nit)
                    return nP === nCid || (nCid.length === nP.length + 1 && nCid.startsWith(nP))
                })
                if (found) {
                    payerNit = cid.textContent // Mantener original para display
                    setSelectedPayerId(found.id)
                    break
                }
            }
        }

        if (invoiceNumber || payableAmount) {
            setParsedData({
                invoiceNumber: invoiceNumber || undefined,
                amount: payableAmount ? parseFloat(payableAmount) : undefined,
                issueDate: issueDate || undefined,
                dueDate: dueDate || undefined,
                nit: payerNit || undefined
            })
        }
      } catch (err) {
        console.error("Error parsing XML:", err)
      }
    }
    
    setIsAnalyzing(false)
    setShowFields(true)
  }

  const [successData, setSuccessData] = useState<{
    message: string
    invoiceNumber: string
    amount: number
    isGuaranteed: boolean
    fileUrl: string
  } | null>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    setSuccessData(null)
    
    startTransition(async () => {
      const result = await createInvoiceAction(formData)
      
      if (result?.error) {
        setError(result.error)
        toast(result.error, 'error')
      } else if (result?.success) {
        setSuccessData({
            message: result.message || 'Factura radicada correctamente',
            invoiceNumber: formData.get('invoiceNumber') as string,
            amount: parseFloat(formData.get('amount') as string),
            isGuaranteed: result.isGuaranteed || false,
            fileUrl: '' // No necesitamos la URL aquí para el comprobante simple
        })
        
        // Warning para garantía parcial
        if (result.warningMessage) {
            toast(result.warningMessage, 'success')
        } else {
            toast(result.message || 'Factura radicada correctamente', 'success')
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  if (successData) {
      return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-green-50 p-8 text-center border-b border-green-100">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <ShieldCheck className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">¡Factura Radicada Exitosamente!</h2>
                <p className="mt-2 text-green-700">{successData.message}</p>
            </div>
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Número de Factura</p>
                        <p className="font-semibold text-gray-900 text-lg">{successData.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500">Monto Total</p>
                        <p className="font-semibold text-gray-900 text-lg">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(successData.amount)}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Estado de Garantía</span>
                        {successData.isGuaranteed ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <ShieldCheck className="w-4 h-4 mr-1.5" />
                                Garantizada
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                Custodia Simple
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Link href="/dashboard/invoices" className="flex-1 text-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        Volver al Listado
                    </Link>
                    <button 
                        onClick={() => {
                            setSuccessData(null)
                            setFileName(null)
                            setParsedData(null)
                            setShowFields(false)
                            setIsPdf(false)
                            setSelectedPayerId('')
                        }}
                        className="flex-1 text-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors"
                    >
                        Radicar Otra Factura
                    </button>
                </div>
            </div>
        </div>
      )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            
            {/* Selección de Pagador (Siempre visible) */}
            <div className="sm:col-span-2">
              <label htmlFor="payerId" className="block text-sm font-medium text-gray-700">Seleccionar Pagador</label>
              <select 
                id="payerId" 
                name="payerId" 
                required 
                value={selectedPayerId} 
                onChange={(e) => setSelectedPayerId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm rounded-md border"
              >
                <option value="">-- Selecciona un pagador --</option>
                {payers.map(p => (
                    <option key={p.id} value={p.id}>{p.razon_social} (NIT: {p.nit})</option>
                ))}
              </select>
              {payers.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                      No tienes pagadores registrados. <Link href="/dashboard/payers/new" className="underline font-medium">Crea uno aquí</Link>.
                  </p>
              )}
            </div>

            {/* Zona de Carga (Siempre visible, ahora arriba) */}
            <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Archivo de Factura</label>
                <div className={`mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-dashed rounded-xl transition-all duration-300 relative
                    ${isAnalyzing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}>
                    
                    {isAnalyzing ? (
                        <div className="text-center py-4">
                            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                            <p className="mt-4 text-sm font-medium text-blue-600">Analizando documento...</p>
                            <p className="text-xs text-blue-400 mt-1">Extrayendo datos de la factura</p>
                        </div>
                    ) : (
                        <div className="space-y-1 text-center">
                            <UploadCloud className={`mx-auto h-12 w-12 ${fileName ? 'text-green-500' : 'text-gray-400'}`} />
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label htmlFor="fileInvoice" className="relative cursor-pointer rounded-md font-medium text-[#7c3aed] hover:text-[#6d28d9] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#7c3aed]">
                                    <span>{fileName ? 'Cambiar archivo' : 'Arrastra tu Factura (XML o PDF)'}</span>
                                    <input id="fileInvoice" name="fileInvoice" type="file" className="sr-only" accept=".pdf,.xml" required 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Sube el XML para autocompletado mágico
                            </p>
                            {fileName && (
                                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {fileName}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Campos con Progressive Disclosure */}
            {showFields && (
                <div className="sm:col-span-2 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    
                    {isPdf && (
                        <div className="sm:col-span-2 bg-yellow-50 p-4 rounded-md flex items-start mb-2">
                            <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Archivo PDF Cargado</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>Por favor diligencia los datos de la factura manualmente. No realizamos extracción automática de datos desde PDF.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {parsedData && (
                        <div className="sm:col-span-2 bg-blue-50 p-4 rounded-md flex items-start mb-2">
                            <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">¡Lectura Exitosa!</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>Hemos extraído los datos clave. 
                                    {parsedData.nit ? (
                                        <span className="font-bold block mt-1">Pagador identificado por NIT: {parsedData.nit}</span>
                                    ) : (
                                        <span className="block mt-1">No encontramos NIT coincidente, selecciona el pagador manualmente.</span>
                                    )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Número de Factura */}
                    <div>
                    <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">Número de Factura</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" required 
                        defaultValue={parsedData?.invoiceNumber}
                        className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" 
                        placeholder="FE-12345"
                        />
                    </div>
                    </div>

                    {/* Valor */}
                    <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor Total</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="number" name="amount" id="amount" required step="0.01"
                        defaultValue={parsedData?.amount}
                        className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" 
                        placeholder="0.00"
                        />
                    </div>
                    </div>

                    {/* Fecha Emisión */}
                    <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="date" name="issueDate" id="issueDate" required 
                        defaultValue={parsedData?.issueDate}
                        className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" 
                        />
                    </div>
                    </div>

                    {/* Fecha Vencimiento */}
                    <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="date" name="dueDate" id="dueDate" required 
                        defaultValue={parsedData?.dueDate}
                        className="focus:ring-[#7c3aed] focus:border-[#7c3aed] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" 
                        />
                    </div>
                    </div>

                    {/* Checkbox de Solicitud de Garantía */}
                    <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start">
                        <div className="flex items-center h-5">
                            <input 
                                id="wantsGuarantee" 
                                name="wantsGuarantee" 
                                type="checkbox" 
                                className="focus:ring-[#7c3aed] h-5 w-5 text-[#7c3aed] border-gray-300 rounded transition-all" 
                            />
                        </div>
                        <div className="ml-3">
                            <label htmlFor="wantsGuarantee" className="font-medium text-gray-900 flex items-center">
                                <ShieldCheck className="h-4 w-4 mr-2 text-indigo-600" />
                                Solicitar Garantía / Seguro
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                Marca esta opción si deseas que AvalIA asegure esta factura. Se validará el cupo disponible del pagador.
                            </p>
                        </div>
                    </div>

                    {/* Sección Legal */}
                    <div className="sm:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 mt-4">
                        <h3 className="text-sm font-semibold text-gray-900">Declaraciones Legales</h3>
                        
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id="funds_origin" name="funds_origin" type="checkbox" required className="focus:ring-[#7c3aed] h-4 w-4 text-[#7c3aed] border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="funds_origin" className="font-medium text-gray-700">Declaración de Origen de Fondos</label>
                                <p className="text-gray-500">Declaro bajo la gravedad de juramento que los fondos y activos relacionados con esta operación provienen de actividades lícitas.</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id="factoring_terms" name="factoring_terms" type="checkbox" required className="focus:ring-[#7c3aed] h-4 w-4 text-[#7c3aed] border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="factoring_terms" className="font-medium text-gray-700">Términos y Condiciones</label>
                                <p className="text-gray-500">Acepto los términos y condiciones del servicio de factoring y autorizo el endoso de la factura si aplica.</p>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2 pt-4 flex justify-end space-x-3">
                        <Link href="/dashboard/invoices" className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Cancelar
                        </Link>
                        <div className="w-full sm:w-auto">
                            <SubmitButton isPending={isPending} />
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>

        {/* Bloque original eliminado, reubicado dentro de showFields */}
        
        {error && (
            <div className="bg-red-50 p-4 rounded-md mt-4">
                <p className="text-sm text-red-700 font-medium">Error: {error}</p>
            </div>
        )}
    </form>
   )
 }
