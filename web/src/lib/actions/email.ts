'use server'

import { resend } from '@/lib/resend'
import React from 'react'
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'email_debug.log')

function logToFile(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`
    try {
        fs.appendFileSync(LOG_FILE, logMessage)
    } catch (err) {
        console.error('Error writing to log file:', err)
    }
}

/**
 * Define el email desde el cual se enviarán las notificaciones.
 * Asegúrate de tener este dominio verificado en Resend.
 */
/**
 * Define el email desde el cual se enviarán las notificaciones.
 * MODO PRODUCCIÓN: Dominio verificado 'avaliab2b.com'.
 */
const SENDER_EMAIL = 'Avalia <notificaciones@avaliab2b.com>'

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
        const keyLength = process.env.RESEND_API_KEY?.length || 0;
        const logMsg = `Intentando enviar a: ${to}, Asunto: ${subject} (Key length: ${keyLength})`
        console.log(`[EMAIL_DEBUG] ${logMsg}`)
        logToFile(logMsg)

        const { data: result, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to,
            subject,
            html: html || '',
            react: react,
        })

        if (error) {
            const errorMsg = `Error de Resend: ${JSON.stringify(error, null, 2)}`
            console.error(`[EMAIL_DEBUG] ${errorMsg}`)
            logToFile(errorMsg)
            return { success: false, error: error.message }
        }

        const successMsg = `Éxito. ID de mensaje: ${result?.id}`
        console.log(`[EMAIL_DEBUG] ${successMsg}`)
        logToFile(successMsg)
        return { success: true, messageId: result?.id }
    } catch (err) {
        const unexpectedMsg = `Error inesperado: ${err}`
        console.error(`[EMAIL_DEBUG] ${unexpectedMsg}`)
        logToFile(unexpectedMsg)
        return { success: false, error: 'Ocurrió un error inesperado al enviar el correo.' }
    }
}
