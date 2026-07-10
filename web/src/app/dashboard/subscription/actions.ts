'use server'

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export async function createStripeSubscriptionSessionAction(plan: 'monthly' | 'annual') {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Usuario no autenticado' };
  }

  // 2. Determinar precio y周期
  const isMonthly = plan === 'monthly';
  const amount = isMonthly ? 3990000 : 39900000; // $39.900 o $399.000 COP en centavos
  const interval = isMonthly ? 'month' : 'year';
  const planName = isMonthly ? 'Plan Mensual Avalia Cobros' : 'Plan Anual Avalia Cobros';

  console.log(`[STRIPE_BILLING] Generando Checkout de Suscripción (${plan}) para usuario ${user.id}...`);

  let checkoutUrl = '';

  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cop',
              product_data: {
                name: planName,
                description: 'Recordatorios y mensajería automática de cobro por correo electrónico (días 1, 5, 10, 15 y 30 de mora).',
              },
              unit_amount: amount,
              recurring: {
                interval: interval as 'month' | 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?payment=cancel`,
        client_reference_id: user.id, // Se utiliza en el webhook de confirmación para actualizar profiles
      });

      if (session.url) {
        checkoutUrl = session.url;
      }
    } else {
      console.warn('[STRIPE] STRIPE_SECRET_KEY no configurada. Simulando Checkout.');
      // En desarrollo sin claves, simular éxito inmediato agregando query params
      checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?payment=success&simulated=true`;
    }
  } catch (err: any) {
    console.error('[STRIPE] Error al crear sesión de Checkout de Suscripción:', err.message || err);
    return { error: 'Error de comunicación con Stripe: ' + err.message };
  }

  // Redirigir a Stripe Checkout
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  return { error: 'No se pudo generar el enlace de pago.' };
}

// Acción para simular activación rápida en desarrollo
export async function simulateSubscriptionActivationAction() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuario no autenticado' };

  console.log(`[STRIPE_SIMULATION] Simulando activación de suscripción para ${user.id}...`);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error } = await supabase
    .from('profiles')
    .update({
      plan_type: 'monthly',
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[STRIPE_SIMULATION] Error en DB:', error.message);
    return { error: error.message };
  }

  return { success: true };
}
