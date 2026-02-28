import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, ShieldCheck } from 'lucide-react'
import { Copyright } from '@/components/ui/Copyright'
import CreditStudyFormDirect from './CreditStudyFormDirect'

interface Props {
    params: Promise<{ token: string }>
}

export default async function FormularioPage({ params }: Props) {
    const { token } = await params
    const supabaseAdmin = createAdminClient()

    // 1. Validar token directamente (sin auth, sin cookies, sin middleware)
    const { data: payer, error } = await supabaseAdmin
        .from('payers')
        .select('*')
        .eq('invitation_token', token)
        .single()

    if (error || !payer) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-xl p-8 text-center">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="text-red-500 w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Enlace No Valido</h2>
                    <p className="text-slate-500 mb-6">
                        Este enlace ha expirado o no es valido. Por favor solicita uno nuevo a tu contacto comercial.
                    </p>
                </div>
            </div>
        )
    }

    // Si el estudio ya fue completado
    if (payer.risk_status === 'en estudio') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center space-y-6">
                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Estudio Recibido</h2>
                    <p className="text-slate-500">
                        Ya hemos recibido tu informacion. Nuestro equipo esta evaluando tu solicitud.
                        Te notificaremos por correo cuando tengamos una respuesta.
                    </p>
                    <div className="pt-4 border-t border-slate-100">
                        <Copyright />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Building2 className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">AvalIA</span>
                            <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Estudio de Credito</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900">Hola, {payer.razon_social}</h2>
                    <p className="text-slate-500 mt-2">
                        Completa la siguiente informacion para habilitar tu cupo en AvalIA.
                    </p>
                </div>

                <CreditStudyFormDirect token={token} payerNit={payer.nit} />
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-100 bg-white">
                <Copyright className="py-8" />
            </footer>
        </div>
    )
}
