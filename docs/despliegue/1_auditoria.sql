-- PASO 1 · Auditoría (solo lectura). Pegar en Supabase > SQL Editor y ejecutar.
-- Devuelve una sola tabla con todo lo necesario para decidir si migrar.

select 'enum user_role' as chequeo,
       (select string_agg(enumlabel, ', ' order by enumsortorder) from pg_enum where enumtypid = 'public.user_role'::regtype) as resultado
union all
select 'roles (total / con empresa)',
       (select string_agg(role::text || ': ' || total || ' / ' || con_empresa, ' | ')
        from (select role, count(*) total, count(company_id) con_empresa from public.profiles group by role order by 1) r)
union all
select 'admin/superadmin SIN empresa',
       (select coalesce(string_agg(role::text || ' ' || email, ' | '), 'ninguno')
        from public.profiles where role::text in ('admin', 'superadmin') and company_id is null)
union all
select 'suscripciones activas',
       (select count(*)::text from public.profiles where subscription_status = 'active')
union all
select 'tablas con RLS desactivado',
       (select coalesce(string_agg(c.relname, ', '), 'ninguna') from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity)
union all
select 'existe signup_otps',
       (select (count(*) > 0)::text from information_schema.tables where table_schema = 'public' and table_name = 'signup_otps')
union all
select 'invitation_token duplicados (debe ser 0)',
       (select count(*)::text from (select invitation_token from public.payers where invitation_token is not null
                                    group by 1 having count(*) > 1) d)
union all
select 'pagadores / facturas sin company_id',
       (select (select count(*) from public.payers where company_id is null) || ' / ' ||
               (select count(*) from public.invoices where company_id is null))
union all
select 'columnas faltantes que usa el código',
       (select coalesce(string_agg(t || '.' || c, ', '), 'ninguna') from (values
          ('payers', 'stripe_session_id'), ('payers', 'study_payment_status'), ('payers', 'signed_at'),
          ('payers', 'company_id'), ('profiles', 'plan_type'), ('profiles', 'subscription_status'),
          ('profiles', 'subscription_expires_at'), ('profiles', 'credit_study_fee'),
          ('payer_documents', 'updated_at'), ('invoices', 'guaranteed_amount')) req(t, c)
        where not exists (select 1 from information_schema.columns
                          where table_schema = 'public' and table_name = req.t and column_name = req.c));
