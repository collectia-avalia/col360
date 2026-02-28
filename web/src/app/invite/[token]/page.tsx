import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Building2, ShieldCheck, AlertCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import { Copyright } from '@/components/ui/Copyright'

interface Props {
    params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params
    const supabaseAdmin = createAdminClient()

    // 1. Buscar el pagador por token
    const { data: payer, error } = await supabaseAdmin
        .from('payers')
        .select('*, inviter:profiles!created_by(full_name, email)')
        .eq('invitation_token', token)
        .single()

    if (error || !payer) {
        console.error('Error buscando pagador por token (Admin):', error)
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-xl p-8 text-center">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="text-red-500 w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Enlace Inválido</h2>
                    <p className="text-slate-500 mb-6">
                        Este enlace de invitación ha expirado o no es válido. Por favor solicita uno nuevo a tu contacto comercial.
                    </p>
                    <a href="/login" className="inline-block px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors mt-6">
                        Ir al Inicio
                    </a>
                </div>
            </div>
        )
    }

    const isFirstTime = payer.nit.startsWith('PENDING-')
    const inviterName = payer.inviter?.full_name || 'Avalia'

    async function handleVerify(formData: FormData) {
        'use server'
        const nit = formData.get('nit') as string
        const token = formData.get('token') as string
        const isFirst = formData.get('isFirstTime') === 'true'

        const supabaseAdmin = createAdminClient()

        if (isFirst) {
            // Si es la primera vez, actualizamos el NIT del pagador
            const { error: updateError } = await supabaseAdmin
                .from('payers')
                .update({ nit: nit })
                .eq('invitation_token', token)

            if (updateError) {
                redirect(`/invite/${token}?error=update-failed`)
            }
        } else {
            // Validar NIT contra el token
            const { data: validPayer, error } = await supabaseAdmin
                .from('payers')
                .select('id, nit')
                .eq('invitation_token', token)
                .eq('nit', nit)
                .single()

            if (error || !validPayer) {
                redirect(`/invite/${token}?error=nit-invalid`)
            }
        }

        const { data: finalPayer } = await supabaseAdmin
            .from('payers')
            .select('id')
            .eq('invitation_token', token)
            .single()

        if (!finalPayer) redirect(`/invite/${token}?error=unexpected`)

        // Configurar cookies con máxima compatibilidad y persistencia
        const cookieStore = await cookies()

        // Usar opciones que aseguren la persistencia tras el redirect
        const cookieOptions = {
            maxAge: 60 * 60 * 24, // 24 horas
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const
        }

        cookieStore.set('payer_session_token', token, cookieOptions)
        cookieStore.set('payer_id', finalPayer.id, cookieOptions)

        console.log('[Invite] Cookies establecidas, redirigiendo a portal...')
        redirect('/portal')
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899]" />

            <div className="max-w-lg w-full z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AvalIA</h1>
                    <p className="text-slate-500 mt-2 lowercase tracking-widest text-xs font-bold uppercase tracking-widest">Portal de Gestión de Pagos</p>
                </div>

                <div className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl rounded-2xl p-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center rotate-3 border border-indigo-100 shadow-sm">
                            <Building2 className="text-indigo-600 w-10 h-10 -rotate-3" />
                        </div>
                    </div>
                    <h2 className="text-center text-2xl font-bold text-slate-900 tracking-tight">¡Hola, {payer.razon_social}!</h2>
                    <p className="text-center text-slate-600 mt-2 text-sm">
                        <strong>{inviterName}</strong> te ha invitado a gestionar tus facturas y cupos en nuestro portal.
                    </p>

                    {!isFirstTime ? (
                        <div className="space-y-6 mt-8">
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-sm text-indigo-900 font-medium">NIT Identificado</p>
                                <p className="text-xl font-bold text-indigo-600 mt-1">{payer.nit}</p>
                            </div>
                            <form action={handleVerify}>
                                <input type="hidden" name="token" value={token} />
                                <input type="hidden" name="nit" value={payer.nit} />
                                <input type="hidden" name="isFirstTime" value="false" />
                                <button type="submit" className="w-full h-12 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                                    Ingresar al Portal Directamente
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form action={handleVerify} className="space-y-6 mt-8">
                            <input type="hidden" name="token" value={token} />
                            <input type="hidden" name="isFirstTime" value="true" />

                            <div className="space-y-2">
                                <label htmlFor="nit" className="text-slate-700 font-bold text-xs uppercase tracking-wider block ml-1">
                                    Vincula tu Identidad
                                </label>
                                <div className="relative group">
                                    <input
                                        id="nit"
                                        name="nit"
                                        placeholder="Escribe tu NIT (Ej: 900.123.456)"
                                        required
                                        className="w-full pl-11 pr-4 h-12 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none bg-white font-medium"
                                    />
                                    <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>

                                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex gap-3 items-start mt-3">
                                    <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                                        Es tu primer ingreso. Por favor, suministra el NIT de tu empresa para vincularlo a esta invitación de forma segura.
                                    </p>
                                </div>
                            </div>

                            <button type="submit" className="w-full h-12 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                                Registrar y Acceder
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 italic text-center text-[11px] text-slate-400 leading-relaxed font-medium">
                        "Simplificamos la gestión de tus facturas para que te enfoques en lo que importa: hacer crecer tu negocio."
                    </div>
                </div>

                <div className="mt-8">
                    <Copyright />
                </div>
            </div>
        </div>
    )
}
