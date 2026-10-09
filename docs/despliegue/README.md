# Despliegue del endurecimiento de seguridad

Todo se ejecuta en **Supabase > SQL Editor** del proyecto de producción, **una ejecución por paso** (cada ejecución del editor es una transacción; el valor nuevo del enum necesita ir en una ejecución aparte).

| # | Qué | Dónde |
|---|---|---|
| 0 | Rotar la service_role key y la contraseña de BD (*Settings > API* y *Settings > Database*). Desactivar *Authentication > Sign In / Providers > Allow new users to sign up*. En Vercel: `SUPABASE_SERVICE_ROLE_KEY` (nueva), `OTP_HASH_SECRET` (cadena aleatoria larga), `WOMPI_EVENTS_SECRET`, `CRON_SECRET`. | Paneles de Supabase y Vercel |
| 1 | Ejecutar `1_auditoria.sql` y revisar el resultado (ver criterios abajo) | SQL Editor |
| 2 | Ejecutar `supabase/migrations/20240503000000_add_tenant_role_values.sql` | SQL Editor |
| 3 | Ejecutar `supabase/migrations/20261009000000_add_admin_role.sql` | SQL Editor |
| 4 | Ejecutar `supabase/migrations/20261009000001_security_hardening.sql` | SQL Editor |
| 5 | **Inmediatamente**: merge del PR a `main` (Vercel despliega) | GitHub |
| 6 | Ejecutar `2_backfill.sql` | SQL Editor |
| 7 | Probar login y flujos con un usuario de cada rol | App |
| 8 | Ejecutar `supabase/migrations/20261009000002_drop_payer_otp_columns.sql` | SQL Editor |

Entre los pasos 4 y 5 el código viejo no puede escribir pagadores/facturas: hacerlo seguido.

## Criterios de la auditoría (paso 1) — no seguir si falla alguno

- `enum user_role` incluye `admin` **o** el paso 3 lo añadirá; y la cuenta del staff de Avalia debe tener rol `admin`. Si aparece como `superadmin SIN empresa`, corregirla antes del paso 4:
  `update public.profiles set role = 'admin' where email = '<correo del staff>';` (después del paso 3).
- Ningún otro `superadmin` sin empresa: sería un tenant roto o una cuenta escalada.
- `suscripciones activas`: confirmar que todas corresponden a pagos reales (antes se podían activar gratis).
- `invitation_token duplicados` = 0 (si no, el índice único del paso 4 falla).
- `pagadores / facturas sin company_id`: tras el paso 4 esas filas dejan de verse en el dashboard; asignarles empresa.
- `columnas faltantes`: debe decir `ninguna`.

## Si algo sale mal en el paso 4

La migración corre en una sola transacción: si falla, no aplica nada. Si se aplicó y hay que volver atrás de urgencia (reabre los huecos de seguridad; solo como último recurso):
`alter table public.profiles disable row level security; alter table public.payers disable row level security;`
y revertir el merge.
