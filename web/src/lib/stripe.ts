import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[STRIPE_WARN] STRIPE_SECRET_KEY no está definida en las variables de entorno.');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-01-27.acme' as any, // Usar la última API estable y compatible
  typescript: true,
});
