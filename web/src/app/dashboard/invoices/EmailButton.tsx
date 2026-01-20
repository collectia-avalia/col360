'use client'

import { useState, useTransition } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { sendInvoiceEmailAction } from './actions'
import { useToast } from '@/components/ui/Toast'

interface EmailButtonProps {
    invoiceId: string
    email: string
    subject: string
    body: string
    disabled?: boolean
}

export function EmailButton({ invoiceId, email, subject, body, disabled = false }: EmailButtonProps) {
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()

    const handleSend = () => {
        if (!email) {
            toast('El pagador no tiene email de contacto configurado.', 'error')
            return
        }

        startTransition(async () => {
            const result = await sendInvoiceEmailAction(invoiceId, email, subject, body)
            
            if (result.error) {
                toast(result.error, 'error')
            } else {
                toast(`Correo enviado correctamente a ${email}`, 'success')
            }
        })
    }

    return (
        <button
            onClick={handleSend}
            disabled={isPending || disabled}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium transition-colors
                ${isPending || disabled 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
        >
            {isPending ? (
                <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Mail className="-ml-1 mr-2 h-4 w-4" />
            )}
            {isPending ? 'Enviando...' : 'Enviar Email'}
        </button>
    )
}