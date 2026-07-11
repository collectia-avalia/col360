import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/wompi';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    let payload: any;
    try {
        payload = await request.json();
    } catch (err: any) {
        console.error('[WOMPI_WEBHOOK] Error al parsear JSON del payload:', err.message || err);
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    console.log(`[WOMPI_WEBHOOK] Recibido evento de tipo: ${payload.event}`);

    // 1. Extraer el checksum recibido (Wompi lo envía dentro de signature.checksum)
    const receivedChecksum = payload.signature?.checksum;
    if (!receivedChecksum) {
        console.error('[WOMPI_WEBHOOK] Checksum no encontrado en el payload de firma.');
        return new NextResponse('Checksum missing', { status: 400 });
    }

    // 2. Validar criptográficamente la firma con control de Timing Attacks
    const isValid = validateWebhookSignature(payload, receivedChecksum);
    if (!isValid) {
        console.error('[WOMPI_WEBHOOK] Validación de firma fallida. Intento sospechoso rechazado.');
        return new NextResponse('Unauthorized: Invalid Signature', { status: 401 });
    }

    const transaction = payload.data?.transaction;
    if (!transaction) {
        console.error('[WOMPI_WEBHOOK] Datos de la transacción ausentes.');
        return NextResponse.json({ received: true, error: 'No transaction data' });
    }

    const { id: transactionId, reference, status, amount_in_cents } = transaction;

    console.log(`[WOMPI_WEBHOOK] Transacción ID: ${transactionId}, Referencia: ${reference}, Estado: ${status}`);

    // Solo nos interesan las transacciones aprobadas para activar servicios
    if (status !== 'APPROVED') {
        console.log(`[WOMPI_WEBHOOK] Transacción con estado ${status}. No se requiere acción.`);
        return NextResponse.json({ received: true, message: 'Status is not APPROVED' });
    }

    const supabaseAdmin = createAdminClient();

    // 3. Procesar según el tipo de referencia (Idempotente)
    try {
        // CASO A: Pago único por Estudio de Riesgo On-Demand ($45.000 COP)
        if (reference.startsWith('study-')) {
            const parts = reference.split('-');
            const payerId = parts[1];

            if (!payerId) {
                console.error('[WOMPI_WEBHOOK] ID de pagador ausente en la referencia:', reference);
                return new NextResponse('Invalid reference format', { status: 400 });
            }

            console.log(`[WOMPI_WEBHOOK] Validando idempotencia para deudor ID: ${payerId}`);
            
            // Consultar estado actual
            const { data: payer, error: selectError } = await supabaseAdmin
                .from('payers')
                .select('study_payment_status')
                .eq('id', payerId)
                .single();

            if (selectError) {
                console.error('[WOMPI_WEBHOOK] Error al consultar pagador:', selectError.message);
                return new NextResponse('Database Lookup Error', { status: 500 });
            }

            // Si ya está marcado como pago, responder con 200 OK inmediatamente (Evita re-procesamiento)
            if (payer?.study_payment_status === 'paid') {
                console.log(`[WOMPI_WEBHOOK] Pago para deudor ${payerId} ya había sido procesado previamente. Saltando.`);
                return NextResponse.json({ received: true, message: 'Already processed as paid' });
            }

            // Actualizar a PAID
            const { error: updateError } = await supabaseAdmin
                .from('payers')
                .update({ study_payment_status: 'paid' })
                .eq('id', payerId);

            if (updateError) {
                console.error('[WOMPI_WEBHOOK] Error al actualizar deudor a paid:', updateError.message);
                return new NextResponse('Database Update Error', { status: 500 });
            }

            console.log(`[WOMPI_WEBHOOK] Estudio de deudor ${payerId} activado exitosamente.`);
        }

        // CASO B: Pago de Suscripción Premium SaaS mensual/anual
        else if (reference.startsWith('sub-')) {
            const parts = reference.split('-');
            const profileId = parts[1];
            const plan = parts[2]; // 'monthly' o 'annual'

            if (!profileId || !plan) {
                console.error('[WOMPI_WEBHOOK] Formato de referencia de suscripción inválido:', reference);
                return new NextResponse('Invalid reference format', { status: 400 });
            }

            console.log(`[WOMPI_WEBHOOK] Procesando suscripción para inquilino perfil ID: ${profileId}, Plan: ${plan}`);

            // Calcular expiración según plan
            const isMonthly = plan === 'monthly';
            const durationDays = isMonthly ? 30 : 365;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            // Consultar vigencia actual para evitar duplicación
            const { data: profile, error: selectError } = await supabaseAdmin
                .from('profiles')
                .select('subscription_status, subscription_expires_at')
                .eq('id', profileId)
                .single();

            if (selectError) {
                console.error('[WOMPI_WEBHOOK] Error al consultar perfil del cliente:', selectError.message);
                return new NextResponse('Database Lookup Error', { status: 500 });
            }

            // Si ya está activo y la expiración es lejana (evitar dobles notificaciones en el mismo minuto)
            if (profile?.subscription_status === 'active' && profile.subscription_expires_at) {
                const currentExpiry = new Date(profile.subscription_expires_at);
                const diffTime = Math.abs(currentExpiry.getTime() - new Date().getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Si ya fue renovado por este mismo webhook recientemente
                if (diffDays > 25 && isMonthly) {
                    console.log(`[WOMPI_WEBHOOK] Suscripción del cliente ${profileId} ya se encuentra activa y renovada. Saltando.`);
                    return NextResponse.json({ received: true, message: 'Subscription already renewed' });
                }
            }

            // Actualizar suscripción
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    plan_type: plan,
                    subscription_status: 'active',
                    subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', profileId);

            if (updateError) {
                console.error('[WOMPI_WEBHOOK] Error al actualizar perfil del cliente:', updateError.message);
                return new NextResponse('Database Update Error', { status: 500 });
            }

            console.log(`[WOMPI_WEBHOOK] Suscripción SaaS para el cliente ${profileId} activada exitosamente hasta ${expiresAt.toISOString()}.`);
        }
    } catch (err: any) {
        console.error('[WOMPI_WEBHOOK] Error crítico al procesar la lógica de negocio:', err.message || err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({ received: true });
}
