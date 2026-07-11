'use server'

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createWompiSubscriptionSessionAction(plan: 'monthly' | 'annual') {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Usuario no autenticado' };
  }

  // 2. Determinar precio y periodo
  const isMonthly = plan === 'monthly';
  const amount = isMonthly ? 3990000 : 39900000; // $39.900 o $399.000 COP en centavos

  console.log(`[WOMPI_BILLING] Generando Checkout de Suscripción (${plan}) para usuario ${user.id}...`);

  let checkoutUrl = '';

  try {
    const { getWompiCheckoutUrl } = require('@/lib/wompi');
    const reference = `sub-${user.id}-${plan}-${Date.now()}`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?payment=success`;

    checkoutUrl = getWompiCheckoutUrl({
      reference,
      amountInCents: amount,
      redirectUrl
    });
  } catch (err: any) {
    console.error('[WOMPI] Error al generar Checkout de Suscripción:', err.message || err);
    return { error: 'Error al generar enlace de pago: ' + err.message };
  }

  // Redirigir a Wompi Checkout
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

  console.log(`[WOMPI_SIMULATION] Simulando activación de suscripción para ${user.id}...`);

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
    console.error('[WOMPI_SIMULATION] Error en DB:', error.message);
    return { error: error.message };
  }

  return { success: true };
}
