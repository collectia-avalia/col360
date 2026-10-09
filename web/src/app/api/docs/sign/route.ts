import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, authzErrorResponse } from '@/lib/auth/guards'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_BUCKETS = ['legal-docs', 'invoices-docs'] as const
type Bucket = typeof ALLOWED_BUCKETS[number]

/**
 * GET /api/docs/sign?path=<file_path>&bucket=<bucket_name>
 *
 * Genera una URL firmada fresca en el momento en que el usuario hace clic,
 * evitando el problema de tokens expirados cuando la página fue renderizada
 * hace más de 1 hora.
 *
 * Autorización: el admin de plataforma puede abrir cualquier documento. Un usuario
 * de empresa solo los que figuran en BD como suyos (se valida por la fila en
 * payer_documents / invoices, no por el prefijo de la ruta, porque hay rutas antiguas
 * con otros prefijos). La historia de crédito es solo para el admin.
 */
export async function GET(request: NextRequest) {
  let ctx
  try {
    ctx = await requireUser()
  } catch (err) {
    const res = authzErrorResponse(err)
    if (res) return res
    throw err
  }

  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')
  const bucketParam = searchParams.get('bucket') || 'legal-docs'

  if (!filePath || filePath.includes('..') || filePath.startsWith('/')) {
    return NextResponse.json({ error: 'El parámetro "path" es inválido' }, { status: 400 })
  }

  if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucketParam)) {
    return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 })
  }
  const bucket = bucketParam as Bucket

  const supabase = createAdminClient()

  if (ctx.profile.role !== 'admin') {
    const companyId = ctx.profile.company_id
    let allowed = false

    if (companyId && bucket === 'invoices-docs') {
      const { data } = await supabase
        .from('invoices')
        .select('id')
        .eq('file_url', filePath)
        .eq('company_id', companyId)
        .limit(1)
      allowed = !!data && data.length > 0
    }

    if (companyId && bucket === 'legal-docs') {
      const { data } = await supabase
        .from('payer_documents')
        .select('id, doc_type, payers!inner(company_id)')
        .eq('file_path', filePath)
        .eq('payers.company_id', companyId)
        .neq('doc_type', 'historia_credito')
        .limit(1)
      allowed = !!data && data.length > 0
    }

    if (!allowed) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  // Token válido por 60 segundos — suficiente para abrir/descargar
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 60)

  if (error || !data?.signedUrl) {
    console.error('[sign-doc] Error generando URL firmada:', error)
    return NextResponse.json({ error: 'No se pudo generar el enlace al documento' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
