'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function submitCreditStudyAction(formData: FormData) {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const payerId = cookieStore.get('payer_id')?.value

    if (!payerId) {
        return { error: 'Sesión no válida' }
    }

    // 1. Recoger datos financieros y legales
    const updateData = {
        commercial_address: formData.get('commercial_address') as string,
        legal_representative: formData.get('legal_representative') as string,
        annual_sales: Number(formData.get('annual_sales')) || 0,
        total_assets: Number(formData.get('total_assets')) || 0,
        total_liabilities: Number(formData.get('total_liabilities')) || 0,
        net_utility: Number(formData.get('net_utility')) || 0,
        risk_status: 'en estudio' // Cambiar estado automáticamente
    }

    const { error: updateError } = await supabase
        .from('payers')
        .update(updateData)
        .eq('id', payerId)

    if (updateError) {
        console.error('Error actualizando pagador:', updateError)
        return { error: 'Error al guardar los datos financieros' }
    }

    // 2. Procesar Archivos
    const files = [
        { type: 'rut', file: formData.get('file_rut') as File },
        { type: 'camara_comercio', file: formData.get('file_camara') as File },
        { type: 'estados_financieros', file: formData.get('file_financieros') as File }
    ]

    for (const item of files) {
        if (item.file && item.file.size > 0) {
            const fileExt = item.file.name.split('.').pop()
            const fileName = `${payerId}/${item.type}_${Date.now()}.${fileExt}`
            const filePath = `legal-docs/${fileName}`

            // Subir a Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('legal-docs')
                .upload(fileName, item.file)

            if (uploadError) {
                console.error(`Error subiendo ${item.type}:`, uploadError)
                continue // Intentamos con el siguiente
            }

            // Registrar en payer_documents
            await supabase
                .from('payer_documents')
                .insert({
                    payer_id: payerId,
                    doc_type: item.type,
                    file_path: fileName
                })
        }
    }

    revalidatePath('/portal')
    return { success: true, message: 'Estudio de crédito enviado correctamente' }
}
