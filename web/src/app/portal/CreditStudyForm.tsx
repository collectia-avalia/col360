'use client'

import React, { useState, useTransition } from 'react'
import { submitCreditStudyAction } from './actions'
import { Building2, Landmark, FileUp, ShieldCheck, Loader2 } from 'lucide-react'

export default function CreditStudyForm() {
    const [step, setStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await submitCreditStudyAction(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setMessage(result.message || 'Enviado con éxito')
                setStep(4) // Paso final
            }
        })
    }

    const inputClass = "w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-white text-sm"
    const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block"

    if (step === 4) {
        return (
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 text-center space-y-6">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-green-600 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">¡Información Recibida!</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                    Tu estudio de crédito ha sido enviado correctamente. Nuestro equipo revisará la documentación y te notificaremos pronto.
                </p>
                <div className="pt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                    >
                        Volver al Portal
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-10 px-4">
                {[1, 2, 3].map((num) => (
                    <div key={num} className="flex items-center group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= num ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {num}
                        </div>
                        {num < 3 && (
                            <div className={`w-20 md:w-32 h-1 mx-4 rounded-full transition-all ${step > num ? 'bg-indigo-600' : 'bg-slate-100'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2">
                        <Loader2 className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* PASO 1: LEGAL */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                                <Building2 className="text-indigo-600 w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Información Legal</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className={labelClass}>Representante Legal</label>
                                <input name="legal_representative" placeholder="Nombre completo" required className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Dirección Comercial</label>
                                <input name="commercial_address" placeholder="Ej: Calle 100 # 15-20" required className={inputClass} />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                Continuar a Datos Financieros
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 2: FINANCIERO */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-amber-50 p-2 rounded-lg">
                                <Landmark className="text-amber-600 w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Información Financiera (Anual)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className={labelClass}>Ventas Anuales ($)</label>
                                <input name="annual_sales" type="number" placeholder="Ej: 500000000" required className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Utilidad Neta ($)</label>
                                <input name="net_utility" type="number" placeholder="Ganancia después de impuestos" required className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Total Activos ($)</label>
                                <input name="total_assets" type="number" placeholder="Propiedades, efectivo, etc." required className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Total Pasivos ($)</label>
                                <input name="total_liabilities" type="number" placeholder="Deudas y obligaciones" required className={inputClass} />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-[2] h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                Continuar a Documentos
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 3: DOCUMENTOS */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                                <FileUp className="text-indigo-600 w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Documentos Adjuntos</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'RUT Actualizado', name: 'file_rut' },
                                { label: 'Cámara de Comercio (Cédula si es PN)', name: 'file_camara' },
                                { label: 'Estados Financieros (Últimos dos años)', name: 'file_financieros' }
                            ].map((doc) => (
                                <div key={doc.name} className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all">
                                    <label className="text-sm font-bold text-slate-700 block mb-2">{doc.label}</label>
                                    <input
                                        name={doc.name}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        required
                                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setStep(2)}
                                className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Atrás
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex-[2] h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando Estudio...
                                    </>
                                ) : 'Finalizar y Enviar Estudio'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
