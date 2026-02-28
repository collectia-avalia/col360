'use client'

import React, { useState, useTransition, useRef } from 'react'
import { submitCreditStudyByTokenAction } from './actions'
import { Building2, Landmark, FileUp, ShieldCheck, Loader2 } from 'lucide-react'

interface StepData {
    legal_representative: string
    commercial_address: string
    annual_sales: string
    total_assets: string
    total_liabilities: string
    net_utility: string
}

export default function CreditStudyFormDirect({ token, payerNit }: { token: string, payerNit: string }) {
    const [step, setStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Guardar datos de cada paso en estado para que no se pierdan al cambiar de paso
    const [stepData, setStepData] = useState<StepData>({
        legal_representative: '',
        commercial_address: '',
        annual_sales: '',
        total_assets: '',
        total_liabilities: '',
        net_utility: '',
    })

    // Referencias a los archivos
    const fileRutRef = useRef<HTMLInputElement>(null)
    const fileCamaraRef = useRef<HTMLInputElement>(null)
    const fileFinancierosRef = useRef<HTMLInputElement>(null)

    function updateField(field: keyof StepData, value: string) {
        setStepData(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        // Construir FormData manualmente con TODOS los datos acumulados
        const formData = new FormData()
        formData.set('invitation_token', token)
        formData.set('legal_representative', stepData.legal_representative)
        formData.set('commercial_address', stepData.commercial_address)
        formData.set('annual_sales', stepData.annual_sales)
        formData.set('total_assets', stepData.total_assets)
        formData.set('total_liabilities', stepData.total_liabilities)
        formData.set('net_utility', stepData.net_utility)

        // Agregar archivos desde las refs
        if (fileRutRef.current?.files?.[0]) {
            formData.set('file_rut', fileRutRef.current.files[0])
        }
        if (fileCamaraRef.current?.files?.[0]) {
            formData.set('file_camara', fileCamaraRef.current.files[0])
        }
        if (fileFinancierosRef.current?.files?.[0]) {
            formData.set('file_financieros', fileFinancierosRef.current.files[0])
        }

        startTransition(async () => {
            const result = await submitCreditStudyByTokenAction(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
            }
        })
    }

    if (success) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-6">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-green-600 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Informacion Enviada</h3>
                <p className="text-slate-500">
                    Hemos recibido tu estudio de credito correctamente. Nuestro equipo lo revisara y te
                    notificara por correo electronico cuando tengamos una respuesta.
                </p>
            </div>
        )
    }

    const totalSteps = 3

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Indicador de Pasos */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <button
                            type="button"
                            onClick={() => s < step && setStep(s)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${s === step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : ''}
                                ${s < step ? 'bg-green-500 text-white cursor-pointer' : ''}
                                ${s > step ? 'bg-slate-100 text-slate-400' : ''}
                            `}
                        >
                            {s < step ? '\u2713' : s}
                        </button>
                        {s < totalSteps && (
                            <div className={`w-12 h-0.5 ${s < step ? 'bg-green-400' : 'bg-slate-200'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* PASO 1: Datos Empresa */}
            <div style={{ display: step === 1 ? 'block' : 'none' }}>
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Datos de la Empresa</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIT</label>
                            <input
                                defaultValue={payerNit?.startsWith('PENDING-') ? '' : payerNit}
                                disabled
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Representante Legal *</label>
                            <input
                                value={stepData.legal_representative}
                                onChange={(e) => updateField('legal_representative', e.target.value)}
                                required
                                placeholder="Nombre completo"
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direccion Comercial *</label>
                        <input
                            value={stepData.commercial_address}
                            onChange={(e) => updateField('commercial_address', e.target.value)}
                            required
                            placeholder="Direccion de la empresa"
                            className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* PASO 2: Datos Financieros */}
            <div style={{ display: step === 2 ? 'block' : 'none' }}>
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                            <Landmark className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Informacion Financiera</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Anuales (COP)</label>
                            <input
                                value={stepData.annual_sales}
                                onChange={(e) => updateField('annual_sales', e.target.value)}
                                type="number"
                                placeholder="0"
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Activos (COP)</label>
                            <input
                                value={stepData.total_assets}
                                onChange={(e) => updateField('total_assets', e.target.value)}
                                type="number"
                                placeholder="0"
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pasivos (COP)</label>
                            <input
                                value={stepData.total_liabilities}
                                onChange={(e) => updateField('total_liabilities', e.target.value)}
                                type="number"
                                placeholder="0"
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilidad Neta (COP)</label>
                            <input
                                value={stepData.net_utility}
                                onChange={(e) => updateField('net_utility', e.target.value)}
                                type="number"
                                placeholder="0"
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                        >
                            Atras
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {/* PASO 3: Documentos */}
            <div style={{ display: step === 3 ? 'block' : 'none' }}>
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-50 p-2 rounded-lg">
                            <FileUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Documentos Legales</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">RUT (PDF)</label>
                            <input
                                type="file"
                                ref={fileRutRef}
                                accept=".pdf"
                                className="w-full h-11 px-4 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Camara de Comercio (PDF)</label>
                            <input
                                type="file"
                                ref={fileCamaraRef}
                                accept=".pdf"
                                className="w-full h-11 px-4 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estados Financieros (PDF)</label>
                            <input
                                type="file"
                                ref={fileFinancierosRef}
                                accept=".pdf"
                                className="w-full h-11 px-4 py-2 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                        >
                            Atras
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Estudio de Credito'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
