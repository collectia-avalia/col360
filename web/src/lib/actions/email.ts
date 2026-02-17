'use server'

import { resend } from '@/lib/resend'
import React from 'react'

/**
 * Define el email desde el cual se enviarán las notificaciones.
 * Asegúrate de tener este dominio verificado en Resend.
 */
/**
 * Define el email desde el cual se enviarán las notificaciones.
 * MODO PRODUCCIÓN: Dominio verificado 'avaliab2b.com'.
 */
const SENDER_EMAIL = 'Avalia SaaS <notificaciones@avaliab2b.com>'

interface SendEmailParams {
    to: string | string[]
    subject: string
    html?: string
    react?: React.ReactElement
}

/**
 * Server Action para enviar correos electrónicos usando Resend.
 * Puede ser llamado desde Client Components o Server Components.
 */
export async function sendEmail(params: SendEmailParams) {
    const { to, subject, html, react } = params

    if (!html && !react) {
        throw new Error('Debes proporcionar contenido HTML o React para el email.')
    }

    try {
        const { data: result, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to,
            subject,
            html: html || '',
            react: react,
        })

        if (error) {
            console.error('Error enviando email con Resend:', error)
            return { success: false, error: error.message }
        }

        return { success: true, messageId: result?.id }
    } catch (err) {
        console.error('Error inesperado al enviar email:', err)
        return { success: false, error: 'Ocurrió un error inesperado al enviar el correo.' }
    }
}
