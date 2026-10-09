'use server'

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWompiCheckoutUrl, WOMPI_PRICES_IN_CENTS } from '@/lib/wompi';

export async function createWompiSubscriptionSessionAction(plan: 'monthly' | 'annual') {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Usuario no autenticado' };
  }

  if (plan !== 'monthly' && plan !== 'annual') {
    return { error: 'Plan no válido' };
  }

  // 2. Determinar precio y periodo
  const isMonthly = plan === 'monthly';
  const amount = isMonthly ? WOMPI_PRICES_IN_CENTS.monthly : WOMPI_PRICES_IN_CENTS.annual;

  console.log(`[WOMPI_BILLING] Generando Checkout de Suscripción (${plan}) para usuario ${user.id}...`);

  let checkoutUrl = '';

  try {
    const reference = `sub-${user.id}-${plan}-${Date.now()}`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscription?payment=success`;

    checkoutUrl = getWompiCheckoutUrl({
      reference,
      amountInCents: amount,
      redirectUrl
    });
  } catch (err: any) {
    console.error('[WOMPI] Error al generar Checkout de Suscripción:', err.message || err);
    return { error: 'Error al generar enlace de pago.' };
  }

  // Redirigir a Wompi Checkout
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  return { error: 'No se pudo generar el enlace de pago.' };
}
