import 'server-only'

import { resend } from '@/lib/resend'
import React from 'react'

/**
 * Módulo de solo servidor (NO es una server action): si llevara 'use server',
 * cualquiera podría invocarlo por POST y usar nuestro dominio como relay de correo.
 */

/** Dominio verificado en Resend. */
const SENDER_EMAIL = 'Avalia <notificaciones@avaliab2b.com>'

interface SendEmailParams {
    to: string | string[]
    subject: string
    html?: string
    react?: React.ReactElement
}

/** Escapa texto de usuario antes de interpolarlo en plantillas HTML de correo. */
export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export async function sendEmail(params: SendEmailParams) {
    const { to, subject, html, react } = params

    if (!html && !react) {
        throw new Error('Debes proporcionar contenido HTML o React para el email.')
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('[EMAIL] RESEND_API_KEY no está configurada.')
        return { success: false, error: 'Configuración de correo incompleta.' }
    }

    try {
        const emailPayload: Parameters<typeof resend.emails.send>[0] = {
            from: SENDER_EMAIL,
            to,
            subject,
            ...(react ? { react } : { html: html! }),
        }

        const { data: result, error } = await resend.emails.send(emailPayload)

        if (error) {
            console.error('[EMAIL] Error de Resend:', error)
            if (error.message?.includes('not verified')) {
                return {
                    success: false,
                    error: `El dominio ${SENDER_EMAIL} no está verificado en Resend o el destinatario no está autorizado en modo demo.`
                }
            }
            return { success: false, error: error.message }
        }

        return { success: true, messageId: result?.id }
    } catch (err: unknown) {
        console.error('[EMAIL] Error inesperado:', err)
        return { success: false, error: 'Ocurrió un error inesperado al enviar el correo.' }
    }
}
