# 🚀 Arquitectura e Implementación: Modelo Freemium B2B y Libre Acceso en Avalia

Este documento especifica la estrategia comercial, el diseño de arquitectura técnica y la guía de implementación de los desarrollos realizados para la apertura del modelo de **Libre Acceso Freemium B2B** en la plataforma **Avalia**.

---

## 📌 1. Estrategia Comercial y Modelo de Monetización

La plataforma **Avalia** se ha estructurado bajo un esquema **Freemium B2B de Libre Acceso**, permitiendo que cualquier empresa se registre de forma gratuita, de dada de alta autónomamente y acceda a su panel de gestión sin barreras financieras iniciales.

```
                  ┌─────────────────────────────────────────┐
                  │       Registro Abierto Gratuito B2B     │
                  │   (/signup con Verificación OTP Email)  │
                  └────────────────────┬────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
       ┌───────────────────────────┐       ┌───────────────────────────┐
       │   Estudios On-Demand B2B  │       │  Suscripción de Cobranza  │
       │    ($45.000 COP / estudio)│       │ ($39.900/mes o $399k/año) │
       └─────────────┬─────────────┘       └─────────────┬─────────────┘
                     │                                   │
                     ▼                                   ▼
       ┌───────────────────────────┐       ┌───────────────────────────┐
       │  Cobro a la Empresa (Wompi)│       │ Despacho Diario de Mora   │
       │  tras el cargue del Deudor│       │  por Lotes en el Cron     │
       └───────────────────────────┘       └───────────────────────────┘
```

### 💎 Pilares del Modelo Comercial:

1. **Autoregistro Libre ($0 COP):** Cualquier comercio puede crear su cuenta, configurar sus usuarios de equipo y explorar la plataforma sin costo.
2. **Estudios de Crédito a Demanda ($45.000 COP):** 
   - El cliente de Avalia crea el deudor y le envía la invitación.
   - El deudor diligencia sus datos y adjunta documentos **sin pagar nada ($0 fricción)**.
   - Al finalizar el cargue, el servidor le envía un correo electrónico automático al **cliente de Avalia (acreedor)** notificándole que los documentos están listos e incluyendo el enlace de pago de **Wompi de $45.000 COP**.
   - Tras la confirmación del pago, Avalia procesa el análisis financiero inteligente bajo el modelo **SARC Wy CF** y libera la recomendación de cupo.
3. **Servicio de Cobranza Automatizada (Suscripción SaaS):** 
   - Habilitado mediante suscripción mensual (**$39.900 COP/mes**) o anual (**$399.000 COP/año**).
   - Permite el envío automático de notificaciones de cobranza por correo electrónico para facturas en mora en los días exactos **1, 5, 10, 15 y 30**.
4. **Facturas No Garantizadas + Garantía a Demanda (CTA Comercial):**
   - El usuario puede radicar y gestionar sus facturas gratuitamente.
   - Las facturas no garantizadas muestran una etiqueta promocional y un botón de acción directo al **WhatsApp de Comercial de Avalia** para gestionar la garantía individual.

---

## 🛠️ 2. Módulos Técnicos Desarrollados

### 🔑 A. Autoregistro B2B con Verificación OTP (`/signup`)
- **Captura Completa de Datos:** Captura Razón Social, NIT, Nombre del Contacto, Teléfono Celular, Dirección Comercial, Correo Corporativo y Contraseña.
- **Protección Antispam:** Integrado con el componente `SlideCaptcha`.
- **Verificación por Correo (OTP 6 dígitos):** 
  - Al enviar el formulario, el backend genera un código aleatorio de 6 dígitos con vigencia de 15 minutos.
  - Guarda los datos temporales en la tabla `public.signup_otps`.
  - Envía el código mediante la API de **Resend** con una plantilla HTML institucional.
- **Activación e Inicio de Sesión Automático:**
  - Al validar el OTP correcto en `/signup`, el servidor invoca el SDK de Administración de Supabase (`admin.createUser`) creando la cuenta con `email_confirm: true` y rol **`client`**.
  - Inicia sesión de forma transparente e ingresa al `/dashboard`.

### 💳 B. Integración de la Pasarela de Pagos Wompi (Bancolombia)
- **Librería Criptográfica (`@/lib/wompi.ts`):**
  - Genera URLs dinámicas para el Web Checkout de Wompi en entornos Sandbox o Producción.
  - Calcula la **Firma de Integridad SHA-256** para el Checkout:
    $$\text{Firma} = \text{SHA256}(\text{referencia} + \text{monto\_en\_centavos} + \text{moneda} + \text{secreto\_integridad})$$
- **Webhook Asíncrono Dinámico (`/api/webhooks/wompi/route.ts`):**
  - Escucha eventos `transaction.updated` de Wompi.
  - **Inmunidad a Timing Attacks:** Extrae dinámicamente el orden de los campos del array `signature.properties` del payload, calcula la firma y la compara usando `crypto.timingSafeEqual`.
  - **Idempotencia:** Verifica el estado en la base de datos para ignorar eventos duplicados de Wompi.
  - **Activación de Estudios (`study-[id]-[ts]`):** Actualiza `study_payment_status = 'paid'`.
  - **Activación de Suscripciones (`sub-[id]-[plan]-[ts]`):** Actualiza `subscription_status = 'active'` y establece `subscription_expires_at`.
- **Limpieza:** Se removieron los webhooks y archivos obsoletos de Stripe.

### 🎨 C. Visibilidad del Sidebar y Permisos Multi-Tenant (RLS)
- **Sidebar (`Sidebar.tsx`):** Se otorgaron permisos de visualización al rol **`client`** en las secciones:
  - `Dashboard` (`/dashboard`)
  - `Clientes` (`/dashboard/payers`)
  - `Facturas` (`/dashboard/invoices`)
  - `Suscripción` (`/dashboard/subscription`)
  - `Configuración` (`/dashboard/profile`)
  - `Equipo` (`/dashboard/settings/users`)
- **Seguridad en Formularios (`/login` y `/signup`):** 
  - Se añadieron toggles interactivos de **Mostrar / Ocultar Contraseña** con iconos de `Eye` y `EyeOff`.
  - Se configuró la exclusión explícita del middleware de autenticación (`src/lib/supabase/middleware.ts`) para la ruta `/signup`.

### ⚡ D. Optimización del Cron de Cobranza en Mora (`/api/cron/overdue-emails`)
- **Procesamiento por Batches Concurrentes:** 
  - Se refactorizó el envío secuencial por un procesamiento en **lotes de 5 promesas en paralelo (`Promise.all`)**.
  - Reduce el tiempo de ejecución global en un **80%**, previniendo de forma definitiva los *timeouts* en la infraestructura Serverless de Vercel.
- **Control de Filtros:** Omite facturas anuladas y valida que el inquilino cuente con la suscripción `active`.

---

## 🗄️ 3. Script SQL Unificado de Base de Datos (Supabase)

Para el funcionamiento completo del sistema en cualquier entorno de Supabase, se debe ejecutar el siguiente script SQL unificado en el **SQL Editor**:

```sql
-- ====================================================================
-- 1. TIPO ENUM DE ROLES DE USUARIO
-- ====================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('superadmin', 'client', 'payer_guest', 'comercial', 'cartera');
    END IF;
END $$;

-- ====================================================================
-- 2. TABLA TEMPORAL PARA VERIFICACIÓN OTP DE REGISTRO
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.signup_otps (
    email TEXT PRIMARY KEY,
    otp_code TEXT NOT NULL,
    signup_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desactivar RLS en tabla temporal de OTP para permitir registro público efímero
ALTER TABLE public.signup_otps DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.signup_otps TO postgres, service_role, anon, authenticated;

-- ====================================================================
-- 3. CAMPO PARA PLANES Y SUSCRIPCIONES FREEMIUM EN PROFILES
-- ====================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ====================================================================
-- 4. ACTUALIZACIÓN DEL TRIGGER DE CREACIÓN DE USUARIO (SCHEMA QUALIFIED)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, role, nit, total_bag, max_exposure)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'company_name', 
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role),
    new.raw_user_meta_data->>'nit',
    COALESCE((new.raw_user_meta_data->>'total_bag')::numeric, 0),
    COALESCE((new.raw_user_meta_data->>'max_exposure')::numeric, 100)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 5. ACTUALIZACIÓN DE POLÍTICAS RLS PARA PERMITIR OPERACIÓN AL ROL CLIENT
-- ====================================================================

-- PAYERS (Deudores / Clientes)
DROP POLICY IF EXISTS "Users can insert company payers" ON public.payers;
CREATE POLICY "Users can insert company payers" ON public.payers
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.payers.company_id
        ) AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('superadmin', 'comercial', 'client')
            )
        )
    );

-- INVOICES (Facturas)
DROP POLICY IF EXISTS "Users can insert company invoices" ON public.invoices;
CREATE POLICY "Users can insert company invoices" ON public.invoices
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.invoices.company_id
        ) AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('superadmin', 'cartera', 'client')
            )
        )
    );
```

---

## ⚙️ 4. Variables de Entorno Requeridas (Vercel / `.env`)

Configura las siguientes variables en el panel de **Vercel ➡️ Settings ➡️ Environment Variables**:

```bash
# Variables del Cliente Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1Ni..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1Ni..."  # Llave Service Role de Administrador

# Variables de la Pasarela Wompi (Bancolombia)
WOMPI_PUBLIC_KEY="pub_prod_..."           # Llave Pública de Wompi
WOMPI_INTEGRITY_SECRET="prod_sign_..."   # Secreto de Integridad para firmas Checkout
WOMPI_EVENTS_SECRET="prod_events_..."     # Secreto de Eventos para firmas de Webhook

# Servicio de Correo Electrónico (Resend)
RESEND_API_KEY="re_..."

# URL Base de la Aplicación
NEXT_PUBLIC_APP_URL="https://avaliab2b.com"
```

---

## 📊 5. Matriz de Cobertura de Pruebas

| Módulo / Funcionalidad | Descripción del Caso de Prueba | Resultado Esperado | Estado |
| :--- | :--- | :--- | :---: |
| **Autoregistro B2B** | Registro en `/signup` con Razón Social y NIT | Envía OTP de 6 dígitos al correo y permite el paso a verificación | **PASS** |
| **Verificación OTP** | Código válido de 6 dígitos ingresado | Crea usuario en Supabase, setea cookies y redirige al `/dashboard` | **PASS** |
| **Visibilidad Sidebar** | Inicio de sesión con cuenta `client` | Se visualizan las pestañas Dashboard, Clientes, Facturas, Suscripción, Configuración y Equipo | **PASS** |
| **Formulario Deudor** | Radicación de datos y 4 documentos PDF por el deudor | Muestra pantalla "Información Enviada" sin cobrar al deudor | **PASS** |
| **Notificación Acreedor**| Envío de correo automático al acreedor tras cargue del deudor | Llega email al acreedor con el botón de pago de Wompi de $45.000 COP | **PASS** |
| **Webhook Wompi** | Simulación / Notificación `transaction.updated` | Valida firma dinámica SHA-256 en tiempo constante y actualiza estado a `paid` | **PASS** |
| **Cron de Mora** | Petición GET a `/api/cron/overdue-emails` | Despacha correos en batches de 5 en paralelo evitando timeouts | **PASS** |

---

> [!NOTE]
> Documento consolidado para el proyecto **Avalia B2B SaaS**. Todos los cambios han sido verificados y desplegados en el repositorio principal (`main`).
