import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/docs/sign?path=<file_path>&bucket=<bucket_name>
 *
 * Genera una URL firmada fresca en el momento en que el usuario hace clic,
 * evitando el problema de tokens expirados cuando la página fue renderizada
 * hace más de 1 hora.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')
  const bucket = searchParams.get('bucket') || 'legal-docs'

  if (!filePath) {
    return NextResponse.json({ error: 'El parámetro "path" es requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Generamos un token válido por 60 segundos — suficiente para abrir/descargar
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 60)

  if (error || !data?.signedUrl) {
    console.error('[sign-doc] Error generando URL firmada:', error)
    return NextResponse.json({ error: 'No se pudo generar el enlace al documento' }, { status: 500 })
  }

  // Redirige directamente al documento — el navegador lo abre de inmediato
  return NextResponse.redirect(data.signedUrl)
}
