import 'server-only'

import { cache } from 'react'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Autorización central.
 *
 * Las server actions son endpoints POST públicos: el middleware NO las protege.
 * Toda acción o route handler que use createAdminClient() debe llamar primero a
 * uno de los require* de este módulo. El rol y la compañía se leen SIEMPRE de
 * public.profiles (nunca de user_metadata, que el propio usuario puede editar).
 */

export type AppRole = 'admin' | 'superadmin' | 'comercial' | 'cartera' | 'client'

export interface SessionProfile {
  id: string
  email: string | null
  role: AppRole
  company_id: string | null
  company_name: string | null
  full_name: string | null
}

export interface SessionContext {
  user: User
  profile: SessionProfile
}

export interface TenantContext extends SessionContext {
  companyId: string
}

export class AuthzError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message)
    this.name = 'AuthzError'
  }
}

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, role, company_id, company_name, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null
  return { user, profile: profile as SessionProfile }
})

export async function requireUser(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) throw new AuthzError(401, 'No autenticado')
  return ctx
}

/** Staff interno de Avalia (rutas /admin). */
export async function requirePlatformAdmin(): Promise<SessionContext> {
  const ctx = await requireUser()
  if (ctx.profile.role !== 'admin') throw new AuthzError(403, 'No autorizado')
  return ctx
}

/** Usuario de una empresa cliente con uno de los roles indicados y compañía asignada. */
export async function requireTenantRole(...roles: AppRole[]): Promise<TenantContext> {
  const ctx = await requireUser()
  if (!roles.includes(ctx.profile.role)) throw new AuthzError(403, 'No tienes permisos para esta operación')
  if (!ctx.profile.company_id) throw new AuthzError(403, 'Tu usuario no está asociado a una empresa')
  return { ...ctx, companyId: ctx.profile.company_id }
}

/**
 * Para server actions que devuelven `{ error }` a la UI:
 *   const denied = await denyUnlessPlatformAdmin(); if (denied) return { error: denied.error }
 */
export async function denyUnlessPlatformAdmin(): Promise<{ error: string } | null> {
  try {
    await requirePlatformAdmin()
    return null
  } catch (err) {
    if (err instanceof AuthzError) return { error: err.message }
    throw err
  }
}

/**
 * Variante para acciones de empresa (dashboard):
 *   const auth = await tenantOrError('superadmin', 'comercial')
 *   if ('error' in auth) return auth
 *   const { companyId } = auth
 */
export async function tenantOrError(...roles: AppRole[]): Promise<TenantContext | { error: string }> {
  try {
    return await requireTenantRole(...roles)
  } catch (err) {
    if (err instanceof AuthzError) return { error: err.message }
    throw err
  }
}

/**
 * Para páginas de /admin. Un layout no protege sus páginas (las navegaciones parciales
 * y las peticiones RSC directas no lo re-ejecutan), así que cada página lo llama.
 */
export async function requirePlatformAdminPage(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  if (ctx.profile.role !== 'admin') redirect('/dashboard')
  return ctx
}

/** Para route handlers: AuthzError → 401/403 JSON. */
export function authzErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof AuthzError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  return null
}
