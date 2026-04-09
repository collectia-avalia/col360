'use server'

import { resend } from '@/lib/resend'
import React from 'react'
import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'email_debug.log')
console.log(`[EMAIL_DEBUG] El archivo de log se encuentra en: ${LOG_FILE}`)

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

    const resendApiKey = process.env.RESEND_API_KEY;
    const keyLength = resendApiKey?.length || 0;

    try {
        const logMsg = `Intentando enviar a: ${to}, Asunto: ${subject} (Key length: ${keyLength})`
        console.log(`[EMAIL_DEBUG] ${logMsg}`)
        logToFile(logMsg)

        if (!resendApiKey) {
            const errorMsg = "ERROR: RESEND_API_KEY no está configurada en las variables de entorno."
            console.error(`[EMAIL_DEBUG] ${errorMsg}`)
            logToFile(errorMsg)
            return { success: false, error: 'Configuración de correo incompleta (Falta API Key).' }
        }

        const emailPayload: Parameters<typeof resend.emails.send>[0] = {
            from: SENDER_EMAIL,
            to,
            subject,
            ...(react ? { react } : { html: html! }),
        }

        const { data: result, error } = await resend.emails.send(emailPayload)

        if (error) {
            const errorMsg = `Error de Resend: ${JSON.stringify(error, null, 2)}`
            console.error(`[EMAIL_DEBUG] ${errorMsg}`)
            logToFile(errorMsg)
            
            // Si el error es sobre el dominio no verificado, dar un mensaje más claro
            if (error.message?.includes('not verified')) {
                return { 
                    success: false, 
                    error: `El dominio ${SENDER_EMAIL} no está verificado en Resend o estás intentando enviar a una dirección no autorizada en modo demo.` 
                }
            }
            
            return { success: false, error: error.message }
        }

        const successMsg = `Éxito. ID de mensaje: ${result?.id}`
        console.log(`[EMAIL_DEBUG] ${successMsg}`)
        logToFile(successMsg)
        return { success: true, messageId: result?.id }
    } catch (err: any) {
        const unexpectedMsg = `Error inesperado: ${err.message || err}`
        console.error(`[EMAIL_DEBUG] ${unexpectedMsg}`)
        logToFile(unexpectedMsg)
        return { success: false, error: 'Ocurrió un error inesperado al enviar el correo.' }
    }
}
