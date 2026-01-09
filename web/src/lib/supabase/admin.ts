import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌ Error crítico: Faltan variables de entorno para Admin Client')
    // Retornamos un cliente dummy o lanzamos error para que sea visible
    throw new Error('Configuración de Supabase incompleta en servidor')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
