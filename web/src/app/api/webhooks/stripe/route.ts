import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        if (webhookSecret && signature) {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } else {
            // Fallback para pruebas de desarrollo local sin firma (ej. curl/postman/simulación)
            event = JSON.parse(body);
        }
    } catch (err: any) {
        console.error(`[STRIPE_WEBHOOK] Error verificando firma de webhook: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`[STRIPE_WEBHOOK] Evento recibido: ${event.type}`);

    const supabaseAdmin = createAdminClient();

    // Procesar evento de Checkout Completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const clientReferenceId = session.client_reference_id; // Contiene ID del pagador o perfil del cliente

        // CASO A: Pago único por Estudio a demanda ($45.000)
        if (session.mode === 'payment' && clientReferenceId) {
            console.log(`[STRIPE_WEBHOOK] Confirmación de pago por estudio de riesgo para deudor ID: ${clientReferenceId}`);
            
            const { error } = await supabaseAdmin
                .from('payers')
                .update({ study_payment_status: 'paid' })
                .eq('id', clientReferenceId);

            if (error) {
                console.error(`[STRIPE_WEBHOOK] Error en DB al actualizar deudor:`, error.message);
                return new NextResponse(`DB Error: ${error.message}`, { status: 500 });
            }
            
            console.log(`[STRIPE_WEBHOOK] Estudio de deudor ${clientReferenceId} habilitado exitosamente (PAID).`);
        } 
        // CASO B: Pago de Suscripción SaaS mensual/anual
        else if (session.mode === 'subscription' && clientReferenceId) {
            console.log(`[STRIPE_WEBHOOK] Confirmación de suscripción SaaS para inquilino perfil ID: ${clientReferenceId}`);
            
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            // Consultar datos de suscripción de Stripe para obtener el periodo de expiración exacto
            let expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 días fallback por defecto

            try {
                if (subscriptionId) {
                    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId as string);
                    expiresAt = new Date((stripeSub as any).current_period_end * 1000);
                }
            } catch (stripeErr: any) {
                console.error('[STRIPE_WEBHOOK] Error obteniendo vigencia de suscripción en Stripe:', stripeErr.message);
            }

            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    plan_type: 'monthly', // Por defecto monthly para este webhook
                    subscription_status: 'active',
                    subscription_expires_at: expiresAt.toISOString(),
                    stripe_customer_id: customerId as string
                })
                .eq('id', clientReferenceId);

            if (error) {
                console.error(`[STRIPE_WEBHOOK] Error en DB al activar suscripción:`, error.message);
                return new NextResponse(`DB Error: ${error.message}`, { status: 500 });
            }

            console.log(`[STRIPE_WEBHOOK] Suscripción del cliente ${clientReferenceId} activada hasta ${expiresAt.toISOString()}.`);
        }
    }

    return NextResponse.json({ received: true });
}
