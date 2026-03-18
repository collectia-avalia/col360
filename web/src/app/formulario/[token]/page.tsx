import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, ShieldCheck } from 'lucide-react'
import { Copyright } from '@/components/ui/Copyright'
import PayerDashboard from './PayerDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
    params: Promise<{ token: string }>
}

export default async function FormularioPage({ params }: Props) {
    const { token } = await params
    const supabaseAdmin = createAdminClient()

    // 1. Validar token directamente (sin auth, sin cookies, sin middleware)
    const { data: payer, error } = await supabaseAdmin
        .from('payers')
        .select('*, solicitor:profiles(full_name)')
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
                    <h2 className="text-2xl font-bold text-slate-900">Proceso Finalizado</h2>
                    <p className="text-slate-500">
                        Hemos recibido tu firma correctamente. Nuestro equipo está evaluando tu solicitud.
                        Se te estará dando respuesta vía email.
                    </p>
                    <div className="pt-4 border-t border-slate-100">
                        <Copyright />
                    </div>
                </div>
            </div>
        )
    }

    // 2. Obtener documentos ya cargados
    const { data: documents } = await supabaseAdmin
        .from('payer_documents')
        .select('*')
        .eq('payer_id', payer.id)

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] cursor-default">
                            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
                                <Building2 className="text-white w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-slate-900 leading-none tracking-tight">AvalIA</span>
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Portal de Pagadores</span>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-6">
                            <div className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group">
                                <ShieldCheck className="w-4 h-4 group-hover:animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider">Conexión Segura</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
                <PayerDashboard token={token} payer={payer} documents={documents || []} />
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <Copyright />
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Términos</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span>Privacidad</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span>Soporte</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
