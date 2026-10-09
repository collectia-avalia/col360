'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, escapeHtml } from '@/lib/email/send'
import { generateOtp, hashOtp, verifyOtp, nextSendWindow, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp'
import { getWompiCheckoutUrl, WOMPI_PRICES_IN_CENTS } from '@/lib/wompi'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

/**
 * Acciones del formulario público del pagador. La única credencial es el token de
 * invitación, así que cada acción:
 *   - resuelve el pagador por token con el cliente admin,
 *   - rechaza cambios si el proceso ya fue firmado o está en estudio,
 *   - nunca devuelve detalles internos de la BD.
 */

/** Documentos que el pagador puede cargar. `historia_credito` la carga solo Avalia. */
const PAYER_DOC_TYPES = ['rut', 'camara_comercio', 'cedula_rep_legal', 'balance', 'pyg', 'renta']
const ALLOWED_DOC_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const MAX_DOC_BYTES = 10 * 1024 * 1024

type TokenPayer = {
    id: string
    contact_email: string | null
    razon_social: string | null
    signed_at: string | null
    risk_status: string | null
}

async function findOpenPayerByToken(token: unknown): Promise<TokenPayer | { error: string }> {
    if (typeof token !== 'string' || token.length < 16) return { error: 'Token inválido' }

    const supabaseAdmin = createAdminClient()
    const { data: payer } = await supabaseAdmin
        .from('payers')
        .select('id, contact_email, razon_social, signed_at, risk_status')
        .eq('invitation_token', token)
        .maybeSingle()

    if (!payer) return { error: 'Token inválido' }
    if (payer.signed_at || payer.risk_status === 'en estudio' || payer.risk_status === 'aprobado' || payer.risk_status === 'rechazado') {
        return { error: 'Este proceso ya fue completado y no admite cambios.' }
    }
    return payer
}

function validateDocFile(file: unknown): { ext: string } | { error: string } {
    if (!(file instanceof File) || file.size === 0) return { error: 'Archivo inválido' }
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) return { error: 'Formato no permitido (PDF, JPG o PNG)' }
    if (file.size > MAX_DOC_BYTES) return { error: 'El archivo supera el tamaño máximo (10 MB)' }
    return { ext }
}

export async function uploadPayerDocumentAction(formData: FormData) {
    const token = formData.get('token')
    const docType = formData.get('docType')
    const file = formData.get('file')

    if (!token || !docType || !file) {
        return { error: 'Faltan datos requeridos' }
    }

    if (typeof docType !== 'string' || !PAYER_DOC_TYPES.includes(docType)) {
        return { error: 'Tipo de documento no válido' }
    }

    const payer = await findOpenPayerByToken(token)
    if ('error' in payer) return { error: payer.error }

    const fileCheck = validateDocFile(file)
    if ('error' in fileCheck) return { error: fileCheck.error }

    const supabaseAdmin = createAdminClient()
    const fileName = `${payer.id}/${docType}_${Date.now()}.${fileCheck.ext}`

    const { error: uploadError } = await supabaseAdmin.storage
        .from('legal-docs')
        .upload(fileName, file as File, { upsert: false })

    if (uploadError) {
        console.error('Error storage:', uploadError)
        return { error: 'Error al subir archivo' }
    }

    const { error: dbError } = await supabaseAdmin
        .from('payer_documents')
        .upsert({
            payer_id: payer.id,
            doc_type: docType,
            file_path: fileName,
            updated_at: new Date().toISOString()
        }, { onConflict: 'payer_id,doc_type' })

    if (dbError) {
        console.error('Error DB:', dbError)
        return { error: 'Error al registrar el documento' }
    }

    return { success: true }
}

export async function requestOtpAction(token: string) {
    const payer = await findOpenPayerByToken(token)
    if ('error' in payer) return { error: payer.error }
    if (!payer.contact_email) return { error: 'El pagador no tiene email de contacto' }

    const supabaseAdmin = createAdminClient()

    const { data: current } = await supabaseAdmin
        .from('payer_otps')
        .select('sent_count, window_started_at')
        .eq('payer_id', payer.id)
        .maybeSingle()

    const window = nextSendWindow(current)
    if (!window) {
        return { error: 'Has solicitado demasiados códigos. Intenta de nuevo en una hora.' }
    }

    const otp = generateOtp()

    const { error: otpError } = await supabaseAdmin
        .from('payer_otps')
        .upsert({
            payer_id: payer.id,
            otp_hash: hashOtp(`payer:${payer.id}`, otp),
            expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
            attempts: 0,
            ...window,
        }, { onConflict: 'payer_id' })

    if (otpError) {
        console.error('[OTP] Error guardando código:', otpError)
        return { error: 'No se pudo generar el código' }
    }

    const razonSocial = escapeHtml(payer.razon_social)
    await sendEmail({
        to: payer.contact_email,
        subject: `Código de verificación - ${payer.razon_social ?? ''}`.slice(0, 200),
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #4f46e5; text-align: center;">Verificación de Firma AvalIA</h2>
                <p>Hola <strong>${escapeHtml(payer.contact_email)}</strong>,</p>
                <p>Has solicitado un código para firmar electrónicamente la debida diligencia de <strong>${razonSocial}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 12px; margin: 25px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.5em; color: #1e293b;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">Este código expirará en 15 minutos por su seguridad.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este es un mensaje automático, por favor no lo respondas.</p>
            </div>
        `
    })

    return { success: true, message: 'Código enviado a ' + payer.contact_email }
}

export async function verifySignatureAction(token: string, otp: string) {
    const payer = await findOpenPayerByToken(token)
    if ('error' in payer) return { error: payer.error }

    const supabaseAdmin = createAdminClient()
    const { data: record } = await supabaseAdmin
        .from('payer_otps')
        .select('otp_hash, expires_at, attempts')
        .eq('payer_id', payer.id)
        .maybeSingle()

    if (!record) return { error: 'Solicita un código de verificación primero' }
    if (record.attempts >= OTP_MAX_ATTEMPTS) return { error: 'Demasiados intentos. Solicita un nuevo código.' }
    if (new Date(record.expires_at) < new Date()) return { error: 'Código expirado' }

    if (!verifyOtp(`payer:${payer.id}`, otp, record.otp_hash)) {
        await supabaseAdmin
            .from('payer_otps')
            .update({ attempts: record.attempts + 1 })
            .eq('payer_id', payer.id)
        return { error: 'Código incorrecto' }
    }

    const headerList = await headers()
    const ip = (headerList.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim()

    // Hash único de la firma (solo para auditoría/log por ahora)
    const signatureHash = crypto.createHash('sha256')
        .update(`${payer.id}-${payer.contact_email}-${new Date().toISOString()}-${ip}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase()

    console.log(`[SIGNATURE INFO] ID: ${payer.id}, Hash: ${signatureHash}, IP: ${ip}`)

    const { error: updateError } = await supabaseAdmin
        .from('payers')
        .update({
            signed_at: new Date().toISOString(),
            signed_ip: ip
        })
        .eq('id', payer.id)

    if (updateError) {
        console.error('❌ Error fatal al registrar firma:', updateError)
        return { error: 'No se pudo registrar la firma. Intenta de nuevo.' }
    }

    // El código ya se usó
    await supabaseAdmin.from('payer_otps').delete().eq('payer_id', payer.id)

    revalidatePath(`/formulario/${token}`)

    return { success: true }
}

export async function updatePayerQuestionsAction(formData: FormData) {
    const payer = await findOpenPayerByToken(formData.get('token'))
    if ('error' in payer) return { error: payer.error }

    const text = (name: string) => {
        const value = formData.get(name)
        return typeof value === 'string' ? value.slice(0, 500) : null
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
        .from('payers')
        .update({
            business_activity: text('business_activity'),
            product_service: text('product_service'),
            monthly_purchase_value: text('monthly_purchase_value'),
            payment_term: text('payment_term'),
            legal_representative: text('legal_representative'),
            commercial_address: text('commercial_address'),
            annual_sales: Number(formData.get('annual_sales')) || 0,
            total_assets: Number(formData.get('total_assets')) || 0,
            total_liabilities: Number(formData.get('total_liabilities')) || 0,
            net_utility: Number(formData.get('net_utility')) || 0
        })
        .eq('id', payer.id)

    if (error) {
        console.error('Error updating questions:', error)
        return { error: 'Error al guardar la información' }
    }

    return { success: true, message: 'Información guardada correctamente' }
}

export async function submitCreditStudyByTokenAction(formData: FormData) {
    const token = formData.get('invitation_token') as string

    if (!token) {
        return { error: 'Token de invitacion no proporcionado' }
    }

    const openPayer = await findOpenPayerByToken(token)
    if ('error' in openPayer) return { error: openPayer.error }

    const supabaseAdmin = createAdminClient()

    // 1. Pagador con relación al perfil del creador
    const { data: payer, error: findError } = await supabaseAdmin
        .from('payers')
        .select('id, razon_social, created_by, study_payment_status, profiles:created_by(email, company_name)')
        .eq('id', openPayer.id)
        .single()

    if (findError || !payer) {
        console.error('Error validando token:', findError)
        return { error: 'Token invalido o expirado' }
    }

    // Validar archivos antes de escribir nada
    const files = [
        { type: 'rut', file: formData.get('file_rut') },
        { type: 'camara_comercio', file: formData.get('file_camara') },
        { type: 'balance', file: formData.get('file_balance') },
        { type: 'pyg', file: formData.get('file_pyg') }
    ]
    const validFiles: { type: string; file: File; ext: string }[] = []
    for (const item of files) {
        if (item.file instanceof File && item.file.size > 0) {
            const check = validateDocFile(item.file)
            if ('error' in check) return { error: `${item.type}: ${check.error}` }
            validFiles.push({ type: item.type, file: item.file, ext: check.ext })
        }
    }

    const alreadyPaid = payer.study_payment_status === 'paid'

    // 2. Generar sesión de Wompi Checkout (salvo que el estudio ya esté pagado)
    const wompiReference = `study-${payer.id}-${Date.now()}`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/payers/${payer.id}?payment=success`;

    let checkoutUrl = '';
    if (!alreadyPaid) {
        try {
            checkoutUrl = getWompiCheckoutUrl({
                reference: wompiReference,
                amountInCents: WOMPI_PRICES_IN_CENTS.study,
                redirectUrl: redirectUrl
            });
        } catch (err: unknown) {
            console.error('[WOMPI] Error al generar Checkout URL:', err);
            checkoutUrl = redirectUrl; // Fallback
        }
    }

    // 3. Actualizar datos financieros, estado del estudio y la referencia de Wompi
    const text = (name: string) => {
        const value = formData.get(name)
        return typeof value === 'string' ? value.slice(0, 500) : null
    }
    const updateData: Record<string, unknown> = {
        commercial_address: text('commercial_address'),
        legal_representative: text('legal_representative'),
        annual_sales: Number(formData.get('annual_sales')) || 0,
        total_assets: Number(formData.get('total_assets')) || 0,
        total_liabilities: Number(formData.get('total_liabilities')) || 0,
        net_utility: Number(formData.get('net_utility')) || 0,
        invitation_status: 'completed',
        ...(alreadyPaid ? {} : { study_payment_status: 'pending', stripe_session_id: wompiReference }),
    };

    console.log('[FormularioAction] Guardando datos financieros y de Wompi para payer ID:', payer.id)

    const { error: updateError } = await supabaseAdmin
        .from('payers')
        .update(updateData)
        .eq('id', payer.id)

    if (updateError) {
        console.error('Error actualizando pagador:', updateError)
        return { error: 'Error al guardar los datos financieros' }
    }

    // 4. Enviar notificación por correo al cliente de Avalia con el link de pago
    if (!alreadyPaid) {
        try {
            const creator = (Array.isArray(payer.profiles) ? payer.profiles[0] : payer.profiles) as
                { email?: string; company_name?: string } | null
            const creatorEmail = creator?.email
            const creatorCompanyName = escapeHtml(creator?.company_name || 'Cliente')
            const razonSocial = escapeHtml(payer.razon_social)
            const safeCheckoutUrl = escapeHtml(checkoutUrl)

            if (creatorEmail) {
                console.log(`[FormularioAction] Enviando correo de cobro a ${creatorEmail} para el pagador ${payer.razon_social}`)
                await sendEmail({
                    to: creatorEmail,
                    subject: `Estudio de crédito listo para pago: ${payer.razon_social ?? ''} - Avalia`.slice(0, 200),
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                            <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px; font-weight: 800;">Estudio de Crédito Listo</h2>
                            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hola <strong>${creatorCompanyName}</strong>,</p>
                            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Tu cliente <strong>${razonSocial}</strong> ha terminado de diligenciar su formulario y cargar sus estados financieros.</p>
                            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Para activar el análisis inteligente bajo el modelo <strong>SARC Wy CF</strong> y ver las recomendaciones de cupo, debes realizar el pago del estudio por valor de <strong>$45.000 COP</strong>.</p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${safeCheckoutUrl}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); display: inline-block;">Pagar Estudio de Crédito ($45.000)</a>
                            </div>
                            <p style="color: #64748b; font-size: 12px; text-align: center;">Si tienes problemas con el botón, copia y pega el siguiente enlace:<br><a href="${safeCheckoutUrl}" style="color: #6366f1;">${safeCheckoutUrl}</a></p>
                            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                            <p style="color: #94a3b8; font-size: 11px; text-align: center;">Mensaje automático enviado por Avalia SaaS. Todos los derechos reservados.</p>
                        </div>
                    `
                })
            } else {
                console.warn('[FormularioAction] No se encontró correo de creador para notificar el estudio de', payer.razon_social)
            }
        } catch (emailErr: unknown) {
            console.error('[FormularioAction] Error enviando correo de cobro:', emailErr)
        }
    }

    // 5. Procesar Archivos
    for (const item of validFiles) {
        const fileName = `${payer.id}/${item.type}_${Date.now()}.${item.ext}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from('legal-docs')
            .upload(fileName, item.file)

        if (uploadError) {
            console.error(`Error subiendo ${item.type}:`, uploadError)
            continue
        }

        await supabaseAdmin
            .from('payer_documents')
            .upsert({
                payer_id: payer.id,
                doc_type: item.type,
                file_path: fileName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'payer_id,doc_type' })
    }

    return { success: true, message: 'Estudio de credito enviado correctamente' }
}
