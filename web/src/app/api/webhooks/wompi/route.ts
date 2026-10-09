import { NextResponse } from 'next/server';
import { validateWebhookSignature, parseWompiReference, WOMPI_PRICES_IN_CENTS } from '@/lib/wompi';
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

    const { id: transactionId, reference, status, amount_in_cents, currency } = transaction;

    console.log(`[WOMPI_WEBHOOK] Transacción ID: ${transactionId}, Referencia: ${reference}, Estado: ${status}`);

    // Solo nos interesan las transacciones aprobadas para activar servicios
    if (status !== 'APPROVED') {
        console.log(`[WOMPI_WEBHOOK] Transacción con estado ${status}. No se requiere acción.`);
        return NextResponse.json({ received: true, message: 'Status is not APPROVED' });
    }

    const parsed = parseWompiReference(reference);
    if (!parsed) {
        console.error('[WOMPI_WEBHOOK] Formato de referencia inválido:', reference);
        return new NextResponse('Invalid reference format', { status: 400 });
    }

    // El monto pagado debe corresponder exactamente al producto de la referencia
    const expectedAmount = parsed.kind === 'study' ? WOMPI_PRICES_IN_CENTS.study : WOMPI_PRICES_IN_CENTS[parsed.plan];
    if (Number(amount_in_cents) !== expectedAmount || (currency && currency !== 'COP')) {
        console.error(`[WOMPI_WEBHOOK] Monto inesperado para ${reference}: ${amount_in_cents} ${currency}`);
        return new NextResponse('Amount mismatch', { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. Procesar según el tipo de referencia (Idempotente)
    try {
        // CASO A: Pago único por Estudio de Riesgo On-Demand
        if (parsed.kind === 'study') {
            const { payerId } = parsed;

            const { data: payer, error: selectError } = await supabaseAdmin
                .from('payers')
                .select('study_payment_status, stripe_session_id')
                .eq('id', payerId)
                .single();

            if (selectError || !payer) {
                console.error('[WOMPI_WEBHOOK] Error al consultar pagador:', selectError?.message);
                return new NextResponse('Database Lookup Error', { status: 500 });
            }

            if (payer.study_payment_status === 'paid') {
                return NextResponse.json({ received: true, message: 'Already processed as paid' });
            }

            // La referencia debe ser la última generada para este pagador
            if (payer.stripe_session_id && payer.stripe_session_id !== reference) {
                console.error(`[WOMPI_WEBHOOK] Referencia ${reference} no coincide con la registrada para el pagador ${payerId}`);
                return new NextResponse('Reference mismatch', { status: 400 });
            }

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
        else {
            const { profileId, plan } = parsed;
            const durationDays = plan === 'monthly' ? 30 : 365;

            const { data: profile, error: selectError } = await supabaseAdmin
                .from('profiles')
                .select('subscription_status, subscription_expires_at, last_payment_reference')
                .eq('id', profileId)
                .single();

            if (selectError || !profile) {
                console.error('[WOMPI_WEBHOOK] Error al consultar perfil del cliente:', selectError?.message);
                return new NextResponse('Database Lookup Error', { status: 500 });
            }

            // Idempotencia: Wompi reintenta el mismo evento
            if (profile.last_payment_reference === reference) {
                return NextResponse.json({ received: true, message: 'Already processed' });
            }

            // Renovación: se suma a la vigencia actual si sigue activa
            const now = new Date();
            const currentExpiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
            const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
            const expiresAt = new Date(base);
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    plan_type: plan,
                    subscription_status: 'active',
                    subscription_expires_at: expiresAt.toISOString(),
                    last_payment_reference: reference
                })
                .eq('id', profileId);

            if (updateError) {
                console.error('[WOMPI_WEBHOOK] Error al actualizar perfil del cliente:', updateError.message);
                return new NextResponse('Database Update Error', { status: 500 });
            }

            console.log(`[WOMPI_WEBHOOK] Suscripción SaaS para el cliente ${profileId} activada hasta ${expiresAt.toISOString()}.`);
        }
    } catch (err: unknown) {
        console.error('[WOMPI_WEBHOOK] Error crítico al procesar la lógica de negocio:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json({ received: true });
}
