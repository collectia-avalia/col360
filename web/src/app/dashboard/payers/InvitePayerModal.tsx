'use client'

import { useState, useTransition } from 'react'
import { Plus, Mail, AlertCircle, Loader2, X } from 'lucide-react'
import { createPayerAction } from './actions'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

export function InvitePayerModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const router = useRouter()

    const handleSubmit = (formData: FormData) => {
        setError(null)

        startTransition(async () => {
            const result = await createPayerAction(formData)

            if (result?.error) {
                setError(result.error)
                toast(result.error, 'error')
            } else if (result?.success) {
                toast(result.message || 'Invitación enviada correctamente', 'success')
                setIsOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition-colors"
            >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Estudiar cliente
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Invitar Nuevo Cliente</h3>
                                <p className="text-sm text-gray-500">Envía una invitación para estudio de crédito.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto">
                            <form action={handleSubmit} className="space-y-6">
                                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                                    <div className="flex items-center mb-5">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Datos de Contacto</h2>
                                            <p className="text-xs text-gray-500">A este correo llegará el enlace de registro.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">Razón Social</label>
                                            <input type="text" name="razonSocial" id="razonSocial" required
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm py-2 px-3 border"
                                                placeholder="Ej: Constructora Global S.A.S"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="nit" className="block text-sm font-medium text-gray-700">NIT (Opcional)</label>
                                            <input type="text" name="nit" id="nit"
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm py-2 px-3 border"
                                                placeholder="Ej: 900.123.456-1"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">Si lo ingresas ahora, el cliente no tendrá que validarlo al entrar.</p>
                                        </div>

                                        <div>
                                            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                                            <input type="email" name="contactEmail" id="contactEmail" required
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm py-2 px-3 border"
                                                placeholder="gerencia@cliente.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Legal */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input id="auth_contact" name="auth_contact" type="checkbox" required className="focus:ring-[#7c3aed] h-4 w-4 text-[#7c3aed] border-gray-300 rounded" />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor="auth_contact" className="font-medium text-gray-700">Confirmo relación comercial</label>
                                            <p className="text-gray-500 mt-1 text-xs">
                                                Certifico que tengo una relación comercial vigente y estoy autorizado.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 p-3 rounded-md flex items-start border border-red-100">
                                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        disabled={isPending}
                                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                Enviando...
                                            </>
                                        ) : (
                                            'Enviar Invitación'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
