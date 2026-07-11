import crypto from 'crypto';

/**
 * Genera la firma de integridad requerida para el Web Checkout de Wompi.
 * Fórmula: SHA-256(referencia + monto_en_centavos + moneda + secreto_integridad)
 */
export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): string {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  
  if (!integritySecret) {
    console.warn('[WOMPI_WARN] WOMPI_INTEGRITY_SECRET no está configurada.');
    return '';
  }

  const concatString = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash('sha256').update(concatString).digest('hex');
}

/**
 * Genera la URL de redirección al Checkout Web de Wompi.
 */
export function getWompiCheckoutUrl(params: {
  reference: string;
  amountInCents: number;
  currency?: string;
  redirectUrl: string;
}): string {
  const publicKey = process.env.WOMPI_PUBLIC_KEY || '';
  const currency = params.currency || 'COP';
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = isProd ? 'https://checkout.wompi.co/p/' : 'https://sandbox.wompi.co/p/';

  const signature = generateIntegritySignature(params.reference, params.amountInCents, currency);

  const queryParams = new URLSearchParams({
    'public-key': publicKey,
    'currency': currency,
    'amount-in-cents': String(params.amountInCents),
    'reference': params.reference,
    'redirect-url': params.redirectUrl,
  });

  if (signature) {
    // Pasar signature:integrity sin que URLSearchParams lo rompa
    return `${baseUrl}?${queryParams.toString()}&signature:integrity=${signature}`;
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Valida la firma (checksum) recibida en el webhook de Wompi de forma dinámica y segura.
 * Reconstruye la cadena usando signature.properties y compara en tiempo constante.
 */
export function validateWebhookSignature(
  payload: any,
  receivedChecksum: string
): boolean {
  const eventSecret = process.env.WOMPI_EVENTS_SECRET;

  if (!eventSecret) {
    console.warn('[WOMPI_WARN] WOMPI_EVENTS_SECRET no configurada. Saltando verificación criptográfica para pruebas.');
    return true; // Bypass defensivo en desarrollo si no hay llaves configuradas
  }

  try {
    const data = payload.data;
    const timestamp = payload.timestamp;
    const properties = payload.signature?.properties || [];

    // 1. Reconstruir la cadena concatenando dinámicamente según el orden de properties
    let concatString = '';
    for (const prop of properties) {
      // prop viene como "transaction.id", "transaction.status", etc.
      const parts = prop.split('.');
      let current = data;
      for (const part of parts) {
        if (current) {
          current = current[part];
        }
      }
      concatString += current !== undefined ? String(current) : '';
    }

    // 2. Concatenar timestamp y secreto de eventos al final
    concatString += String(timestamp);
    concatString += eventSecret;

    // 3. Calcular hash SHA-256 local
    const calculatedChecksum = crypto.createHash('sha256').update(concatString).digest('hex');

    // 4. Comparar buffers en tiempo constante para evitar Timing Attacks
    const calculatedBuffer = Buffer.from(calculatedChecksum, 'hex');
    const receivedBuffer = Buffer.from(receivedChecksum, 'hex');

    if (calculatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  } catch (err: any) {
    console.error('[WOMPI_ERROR] Fallo al validar la firma del webhook:', err.message || err);
    return false;
  }
}
