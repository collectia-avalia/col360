# Endurecimiento de seguridad: BD (RLS) y autorización en código

Rama: `security/hardening-rls-authz` · Revisión: 2026-10-09
Plan validado por tres revisores (arquitectura, seguridad y QA) antes de implementarlo. La versión 1 del plan se rechazó con cambios; este documento recoge la versión 2, ya implementada.

## Modelo resultante

| | Antes | Ahora |
|---|---|---|
| RLS en `profiles` / `payers` | Desactivado | Activado en todas las tablas de negocio |
| Escrituras de usuario | Directas con la anon key | Solo desde el servidor (service_role), después de validar rol y empresa |
| `authenticated` | Lectura y escritura según políticas con `OR (true)` | Solo `SELECT` de su empresa; única escritura: `profiles.full_name` |
| `anon` | Acceso a tablas | Sin acceso |
| Fuente del rol | `user_metadata` (lo edita el usuario) | `public.profiles`; al crear usuario, `app_metadata` |
| OTP de firma | `payers.otp_code` en claro, legible por el acreedor | `payer_otps` con HMAC, solo service_role, 5 intentos y 5 envíos por hora |
| Registro freemium | Contraseña y OTP en claro en `signup_otps` | Sin contraseña en BD, OTP con HMAC, intentos limitados |
| Server actions de admin | Sin verificación de rol | `denyUnlessPlatformAdmin()` en cada acción y `requirePlatformAdminPage()` en cada página |

Roles: `admin` es el staff de Avalia (`/admin`). `superadmin`, `comercial` y `cartera` son usuarios de una empresa cliente (`/dashboard`). `client` es el usuario freemium sin empresa.

## Cambios

**Migraciones** (`supabase/migrations/`)
- `20240503000000_add_tenant_role_values.sql`: saca `comercial` y `cartera` a una migración previa, porque ahí daban el error 55P04.
- `20240107000003`: se añade `DROP POLICY IF EXISTS`. Con esto `supabase db reset` vuelve a funcionar.
- `20261009000000_add_admin_role.sql`: añade `'admin'` al enum.
- `20261009000001_security_hardening.sql`:
  - borra **todas** las políticas de las tablas de negocio y de los buckets `invoices-docs` y `legal-docs`;
  - crea los helpers `private.*` (`SECURITY DEFINER`, `search_path=''`);
  - crea las políticas de lectura por empresa;
  - aplica los `REVOKE`/`GRANT`;
  - reescribe `handle_new_user` para que lea `app_metadata`;
  - crea `payer_otps` y endurece `signup_otps`;
  - añade `profiles.last_payment_reference`;
  - crea índices.
- `20261009000002_drop_payer_otp_columns.sql`: elimina las columnas OTP viejas de `payers`. **Se aplica después de desplegar el código.**

**Código** (`web/src`)
- **Autorización y OTP:**
  - `lib/auth/guards.ts` (nuevo): `getSessionContext`, `requireUser`, `requirePlatformAdmin`, `requireTenantRole`, `denyUnlessPlatformAdmin`, `tenantOrError`, `requirePlatformAdminPage` y `authzErrorResponse`.
  - `lib/auth/otp.ts` (nuevo): genera los códigos con `crypto.randomInt`, los guarda como HMAC, compara en tiempo constante y limita los envíos.
- **Acciones de admin** (`lib/actions/admin.ts`, `admin/approvals/actions.ts`, `admin/clients/actions.ts`): guard de admin; además, no se puede borrar a otro admin.
- **Páginas `/admin/*`:** guard por página.
- **Acciones de empresa** (`dashboard/payers`, `dashboard/invoices`, `settings/users`):
  - guard de rol y empresa;
  - escrituras con service_role, siempre filtradas por `company_id`;
  - verificación de filas afectadas;
  - lista blanca de estados de factura;
  - validación de monto, fechas y archivo.
  - El correo de factura solo se envía al contacto del pagador.
- **Creación de usuarios:** rol y empresa van en `app_metadata`, con upsert explícito del perfil. Ya no depende de la versión del trigger.
- **`lib/supabase/profile.ts`:** la reparación del perfil crea siempre `client` sin empresa. Ya no lee `user_metadata`.
- **Middleware:**
  - toma el rol solo de `profiles`;
  - excluye `/api/cron/` y `/api/webhooks/`, que antes se redirigían a `/login` y nunca se ejecutaban;
  - se elimina el bypass por cualquier ruta con `.`.
- **Suscripción:** se eliminan la simulación de activación premium y el parámetro `?simulated=true`.
- **Webhook de Wompi:**
  - rechaza si falta el secreto;
  - interpreta bien las referencias con UUID;
  - valida monto y moneda;
  - es idempotente;
  - las renovaciones se suman a la vigencia actual.
- **`/api/docs/sign`:** lista blanca de buckets. Autoriza por la fila en BD, no por el prefijo de la ruta; la historia de crédito solo la ve el admin.
- **`/api/parse-invoice` y `/api/admin/system-status`:** guard, y límite de tamaño del PDF.
- **Formulario por token:**
  - columnas explícitas hacia el navegador;
  - lista blanca de tipos de documento (excluye `historia_credito`);
  - validación de los archivos;
  - no admite cambios después de firmar;
  - errores genéricos;
  - HTML de los correos escapado.
- **Registro:** la contraseña viaja solo en el paso de verificación, y el OTP queda limitado.
- **`sendEmail`:** pasa a `lib/email/send.ts`, con `server-only` y sin `'use server'`. Ya no escribe `email_debug.log`.
- **Rutas eliminadas:** el portal (`portal/actions.ts`, con IDOR por cookie). `/invite/[token]` ahora redirige a `/formulario/[token]`.

## Verificación realizada (Supabase local con Docker)

- `supabase db reset`: aplica las 28 migraciones desde cero, más un `seed.sql` reescrito con dos empresas y un usuario por rol.
- `supabase test db`: **24/24** pruebas pgTAP pasan (`supabase/tests/rls_hardening.test.sql`):
  - aislamiento entre las empresas A y B;
  - cartera ve los pagadores de toda su empresa;
  - el usuario `client` sin empresa no ve nada;
  - el admin lo ve todo;
  - la historia de crédito no es visible para la empresa;
  - un usuario no puede cambiar `role`, `company_id` ni `subscription_status`;
  - no se pueden insertar ni actualizar `payers` ni `invoices` directamente;
  - no se puede leer `payer_otps` ni `signup_otps`;
  - `anon` no tiene acceso.
- Pruebas de humo HTTP contra `next dev` y Supabase local, con sesiones reales por rol:
  - **Páginas y formulario:** SA-A no entra a `/admin`; el formulario no envía campos sensibles; `/invite` redirige.
  - **Endpoints:** `docs/sign` devuelve 403 entre empresas y para la historia de crédito; el webhook y el cron ya no rebotan al login.
  - **Server actions:** los guards de las acciones de empresa responden lo esperado. Una acción de admin invocada por un tenant no se ejecuta (la BD queda sin cambios).
- `tsc --noEmit` y `next build`: OK.

## Despliegue (orden)

1. **Antes de nada:**
   - Rotar la service_role key y la contraseña de Postgres (expuestas en el repo).
   - En Supabase Auth, desactivar "Allow new users to sign up": todos los usuarios se crean con la Admin API.
   - Definir `OTP_HASH_SECRET`, `WOMPI_EVENTS_SECRET` y `CRON_SECRET` en Vercel.
2. **Auditar producción (solo lectura):**
   ```sql
   select role, count(*), count(company_id) from profiles group by role;
   select id, email from profiles where role in ('admin','superadmin') and company_id is null;
   select subscription_status, count(*) from profiles group by 1;
   ```
   Confirmar quién es admin de plataforma; los scripts viejos `src/fix-admin-role.ts` lo marcaban como `superadmin`. Corregir lo que esté escalado antes del backfill.
3. **Aplicar las migraciones** `20240503000000`, `20261009000000` y `20261009000001`. Las de 2024 son no-ops si ya están aplicadas.
4. **Desplegar el código** justo después. Entre los pasos 3 y 4, las escrituras de empresa del código viejo fallan; es una ventana de minutos.
5. **Backfill:**
   ```sql
   update auth.users u
   set raw_app_meta_data = u.raw_app_meta_data || jsonb_strip_nulls(jsonb_build_object('role', p.role, 'company_id', p.company_id)),
       raw_user_meta_data = u.raw_user_meta_data - 'role' - 'company_id' - 'total_bag' - 'max_exposure'
   from public.profiles p where p.id = u.id;
   ```
6. **Aplicar** `20261009000002_drop_payer_otp_columns.sql`.
7. **Prueba manual en producción** con un usuario de cada rol. El login lleva el deslizador de verificación, que no se automatizó.

## Pendiente (fuera de este alcance)

- **Lógica de negocio:**
  - `approvePayerAction`, que usa la UI de aprobación, no valida la exposición máxima; `processPayerAction` sí la valida.
  - El cálculo de cupo no es atómico: debería pasar a una RPC.
  - `terms_accepted: true` lo fija el acreedor y no el pagador.
- **Datos:**
  - No hay políticas de storage por empresa, y no hacen falta mientras todo pase por el servidor.
  - Los tokens de invitación no expiran.
  - Hay archivos antiguos en `invoices-docs` con prefijo `user.id`.
- **Scripts sueltos:** `web/repair_*.ts`, `src/*-admin-role.ts` y `scratch/` todavía leen y escriben `user_metadata.role` con service_role. Hay que borrarlos.
- **Plataforma:** actualizar Next (CVE crítico en 16.1.1), CI con `tsc`, lint, build y `supabase test db`, y quitar `.env`, `node_modules` y `scratch/` del historial de git.
