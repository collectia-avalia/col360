'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
                    file_path: fileName
                })
        }
    }

    return { success: true, message: 'Estudio de credito enviado correctamente' }
}
