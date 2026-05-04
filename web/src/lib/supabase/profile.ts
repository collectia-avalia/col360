import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Asegura que exista un perfil en la tabla public.profiles para el usuario autenticado.
 * Si no existe, lo crea usando la metadata de Auth.
 */
export async function ensureUserProfile(supabase: SupabaseClient, userId: string) {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

    if (profileError || !profile) {
        console.log('[PERFIL] Perfil no encontrado, intentando reparación automática para:', userId)

        // Obtener datos frescos del usuario para la reparación
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== userId) {
            console.error('[PERFIL] No se pudo obtener la información del usuario para la reparación')
            return { success: false, error: 'No se pudo verificar el usuario' }
        }

        const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: user.email || '',
                company_name: user.user_metadata?.company_name || 'Empresa sin nombre',
                role: (user.user_metadata?.role as any) || 'client',
                nit: user.user_metadata?.nit || null,
                total_bag: Number(user.user_metadata?.total_bag) || 0,
                company_id: user.user_metadata?.company_id || null
            })

        if (insertProfileError) {
            console.error('[PERFIL] Error crítico reparando perfil:', insertProfileError)
            return { success: false, error: insertProfileError.message }
        }

        console.log('[PERFIL] Perfil reparado exitosamente.')
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
        .single()

    if (error || !profile) {
        console.error('[PERFIL] Error obteniendo perfil:', error)
        // Intentar reparación si no existe
        const repair = await ensureUserProfile(supabase, user.id)
        if (repair.success) {
            // Re-intento recursivo (con precaución)
            const { data: rep } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
            return rep
        }
        return null
    }

    return profile
}

