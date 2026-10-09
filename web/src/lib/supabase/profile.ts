import { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Asegura que exista un perfil en public.profiles para el usuario autenticado.
 * Si no existe, lo crea como 'client' sin empresa ni bolsa: rol, compañía y cupos
 * NUNCA se toman de user_metadata, que el propio usuario puede modificar.
 * Un perfil con privilegios solo lo asigna un admin (o la creación vía Admin API).
 */
export async function ensureUserProfile(supabase: SupabaseClient, userId: string) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

    if (profile) return { success: true }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
        console.error('[PERFIL] No se pudo obtener la información del usuario para la reparación')
        return { success: false, error: 'No se pudo verificar el usuario' }
    }

    // Los pagadores no tienen perfil
    if (user.app_metadata?.role === 'payer_guest') {
        return { success: false, error: 'Usuario sin perfil de empresa' }
    }

    console.log('[PERFIL] Perfil no encontrado, creando perfil básico para:', userId)

    const admin = createAdminClient()
    const { error: insertProfileError } = await admin
        .from('profiles')
        .upsert({
            id: userId,
            email: user.email || '',
            company_name: user.user_metadata?.company_name || 'Empresa sin nombre',
            nit: user.user_metadata?.nit || null,
            role: 'client',
        }, { onConflict: 'id', ignoreDuplicates: true })

    if (insertProfileError) {
        console.error('[PERFIL] Error crítico reparando perfil:', insertProfileError)
        return { success: false, error: 'No se pudo crear el perfil' }
    }

    return { success: true }
}

export async function getUserProfile(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .maybeSingle()

    if (error || !profile) {
        if (error) console.error('[PERFIL] Error obteniendo perfil para ID:', user.id, error)
        const repair = await ensureUserProfile(supabase, user.id)
        if (repair.success) {
            const { data: rep } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).maybeSingle()
            return rep
        }
        return null
    }

    return profile
}
