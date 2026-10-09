import 'server-only'

import crypto from 'crypto'

export const OTP_TTL_MS = 15 * 60_000
export const OTP_MAX_ATTEMPTS = 5
/** Máximo de envíos de OTP por destinatario dentro de OTP_SEND_WINDOW_MS. */
export const OTP_MAX_SENDS = 5
export const OTP_SEND_WINDOW_MS = 60 * 60_000

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

function otpKey(): string {
  const key = process.env.OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Falta OTP_HASH_SECRET')
  return key
}

/** HMAC del OTP ligado a su contexto (p. ej. `payer:<id>` o `signup:<email>`). */
export function hashOtp(scope: string, otp: string): string {
  return crypto.createHmac('sha256', otpKey()).update(`${scope}:${otp}`).digest('hex')
}

export function verifyOtp(scope: string, otp: unknown, expectedHash: string): boolean {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) return false
  const a = Buffer.from(hashOtp(scope, otp), 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Límite de reenvíos: devuelve los contadores a guardar, o null si se superó el límite.
 * Cada código admite OTP_MAX_ATTEMPTS intentos y solo se pueden pedir OTP_MAX_SENDS
 * códigos por ventana, así que la fuerza bruta queda acotada a 25 intentos/hora.
 */
export function nextSendWindow(
  current: { sent_count: number; window_started_at: string } | null,
  now = new Date()
): { sent_count: number; window_started_at: string } | null {
  if (!current || now.getTime() - new Date(current.window_started_at).getTime() > OTP_SEND_WINDOW_MS) {
    return { sent_count: 1, window_started_at: now.toISOString() }
  }
  if (current.sent_count >= OTP_MAX_SENDS) return null
  return { sent_count: current.sent_count + 1, window_started_at: current.window_started_at }
}
