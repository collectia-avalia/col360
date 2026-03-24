'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/actions/email'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function uploadPayerDocumentAction(formData: FormData) {
    const token = formData.get('token') as string
    const docType = formData.get('docType') as string
    const file = formData.get('file') as File

    if (!token || !docType || !file) {
        return { error: 'Faltan datos requeridos' }
    }

    const supabaseAdmin = createAdminClient()

    // 1. Validar token
    const { data: payer, error: findError } = await supabaseAdmin
        .from('payers')
        .select('id')
        .eq('invitation_token', token)
        .single()

    if (findError || !payer) return { error: 'Token inválido' }

    // 2. Subir a Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${payer.id}/${docType}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabaseAdmin.storage
        .from('legal-docs')
        .upload(fileName, file, { upsert: true })

    if (uploadError) {
        console.error('Error storage:', uploadError)
        return { error: 'Error al subir archivo' }
    }

    // 3. Registrar en base de datos
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
        return { error: `Error DB: ${dbError.message} (${dbError.code})` }
    }

    return { success: true }
}

export async function requestOtpAction(token: string) {
    const supabaseAdmin = createAdminClient()
    const { data: payer, error } = await supabaseAdmin
        .from('payers')
        .select('id, contact_email, razon_social')
        .eq('invitation_token', token)
        .single()

    if (error || !payer) return { error: 'No se encontró el pagador' }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    await supabaseAdmin
        .from('payers')
        .update({
            otp_code: otp,
            otp_expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        })
        .eq('id', payer.id)

    // Enviar email real con el OTP
    await sendEmail({
        to: payer.contact_email,
        subject: `Código de verificación - ${payer.razon_social}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #4f46e5; text-align: center;">Verificación de Firma AvalIA</h2>
                <p>Hola <strong>${payer.contact_email}</strong>,</p>
                <p>Has solicitado un código para firmar electrónicamente la debida diligencia de <strong>${payer.razon_social}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 12px; margin: 25px 0;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.5em; color: #1e293b;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">Este código expirará en 15 minutos por su seguridad.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este es un mensaje automático, por favor no lo respondas.</p>
            </div>
        `
    })

    console.log(`[OTP DEBUG] Código para ${payer.razon_social}: ${otp}`)

    return { success: true, message: 'Código enviado a ' + payer.contact_email }
}

export async function verifySignatureAction(token: string, otp: string) {
    const supabaseAdmin = createAdminClient()
    const { data: payer, error } = await supabaseAdmin
        .from('payers')
        .select('*')
        .eq('invitation_token', token)
        .single()

    if (error || !payer) return { error: 'Token inválido' }
    
    if (payer.otp_code !== otp) return { error: 'Código incorrecto' }
    if (new Date(payer.otp_expires_at) < new Date()) return { error: 'Código expirado' }

    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1'
    
    // Generar un Hash único de la firma para mayor tangibilidad
    // Generar un Hash único (solo para auditoría/log por ahora)
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
            // signature_hash: signatureHash, // Habilitar cuando la columna exista
            // risk_status: 'en estudio' // Habilitar cuando el enum sea actualizado
        })
        .eq('id', payer.id)

    if (updateError) {
        console.error('❌ Error fatal al registrar firma:', updateError)
        return { error: `Error de base de datos (${updateError.code}): ${updateError.message}` }
    }

    revalidatePath(`/formulario/${token}`)

    return { success: true }
}

export async function updatePayerQuestionsAction(formData: FormData) {
    const token = formData.get('token') as string
    const business_activity = formData.get('business_activity') as string
    const product_service = formData.get('product_service') as string
    const monthly_purchase_value = formData.get('monthly_purchase_value') as string
    const payment_term = formData.get('payment_term') as string
    
    // Additional financial fields
    const legal_representative = formData.get('legal_representative') as string
    const commercial_address = formData.get('commercial_address') as string
    const annual_sales = Number(formData.get('annual_sales')) || 0
    const total_assets = Number(formData.get('total_assets')) || 0
    const total_liabilities = Number(formData.get('total_liabilities')) || 0
    const net_utility = Number(formData.get('net_utility')) || 0

    if (!token) return { error: 'Token inválido' }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
        .from('payers')
        .update({
            business_activity,
            product_service,
            monthly_purchase_value,
            payment_term,
            legal_representative,
            commercial_address,
            annual_sales,
            total_assets,
            total_liabilities,
            net_utility
        })
        .eq('invitation_token', token)

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

    const supabaseAdmin = createAdminClient()

    // 1. Validar token y obtener pagador
    const { data: payer, error: findError } = await supabaseAdmin
        .from('payers')
        .select('id')
        .eq('invitation_token', token)
        .single()

    if (findError || !payer) {
        console.error('Error validando token:', findError)
        return { error: 'Token invalido o expirado' }
    }

    // 2. Actualizar datos financieros y legales
    const updateData: Record<string, unknown> = {
        commercial_address: formData.get('commercial_address') as string,
        legal_representative: formData.get('legal_representative') as string,
        annual_sales: Number(formData.get('annual_sales')) || 0,
        total_assets: Number(formData.get('total_assets')) || 0,
        total_liabilities: Number(formData.get('total_liabilities')) || 0,
        net_utility: Number(formData.get('net_utility')) || 0,
        invitation_status: 'completed'
    }

    console.log('[FormularioAction] Datos a guardar:', updateData)
    console.log('[FormularioAction] Payer ID:', payer.id)

    const { error: updateError } = await supabaseAdmin
        .from('payers')
        .update(updateData)
        .eq('id', payer.id)

    if (updateError) {
        console.error('Error actualizando pagador:', updateError)
        return { error: 'Error al guardar los datos financieros' }
    }

    // 3. Procesar Archivos
    const files = [
        { type: 'rut', file: formData.get('file_rut') as File },
        { type: 'camara_comercio', file: formData.get('file_camara') as File },
        { type: 'estados_financieros', file: formData.get('file_financieros') as File }
    ]

    for (const item of files) {
        if (item.file && item.file.size > 0) {
            const fileExt = item.file.name.split('.').pop()
            const fileName = `${payer.id}/${item.type}_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabaseAdmin.storage
                .from('legal-docs')
                .upload(fileName, item.file)

            if (uploadError) {
                console.error(`Error subiendo ${item.type}:`, uploadError)
                continue
            }

            await supabaseAdmin
                .from('payer_documents')
                .insert({
                    payer_id: payer.id,
                    doc_type: item.type,
                    file_path: fileName,
                    updated_at: new Date().toISOString()
                })
        }
    }

    return { success: true, message: 'Estudio de credito enviado correctamente' }
}
