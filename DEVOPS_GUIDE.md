
# Guía de DevOps y Desarrollo Local

Este documento detalla el flujo de trabajo profesional para el desarrollo, migraciones y despliegue de la base de datos de Avalia SaaS.

## 1. Configuración del Entorno Local

Para replicar la infraestructura de producción en tu máquina local, utilizamos **Supabase CLI** y Docker.

### Prerrequisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Debe estar corriendo)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (Instalado via `npm` en este proyecto)

### Comandos de Inicialización

```bash
# 1. Instalar dependencias (si no se ha hecho)
npm install

# 2. Iniciar Supabase Local (Requiere Docker)
npx supabase start
```

Esto levantará:
- Base de datos Postgres local (Puerto 54322)
- Supabase Studio (Panel visual local en http://localhost:54323)
- API Gateway, Auth, Storage y Edge Functions locales.

## 2. Gestión de Migraciones

Los cambios en la base de datos **NUNCA** deben hacerse manualmente en el dashboard de producción.

### Crear una nueva migración
Cuando necesites modificar la estructura (ej: agregar tabla `payments`):

```bash
npx supabase migration new add_payments_table
```
Esto crea un archivo SQL en `supabase/migrations/`. Edita este archivo con tus comandos SQL (`CREATE TABLE...`).

### Aplicar cambios localmente
Para ver tus cambios reflejados en tu entorno local:

```bash
npx supabase db reset
```
*(Esto reinicia la BD local y aplica todas las migraciones + seed.sql)*

### Sincronizar con Producción (Solo admins)
Para llevar cambios a producción:

```bash
# 1. Vincular proyecto (Una única vez)
npx supabase link --project-ref <PROJECT_ID>

# 2. Desplegar migraciones
npx supabase db push
```

## 3. Webhooks y Pagos (Stripe)

Para probar webhooks de Stripe localmente sin exponer tu máquina a internet:

```bash
npx supabase functions serve
```
Luego configura el CLI de Stripe para reenviar eventos a tu función local.

## 4. Variables de Entorno

Para desarrollo local, crea un archivo `.env.local` que apunte a tu instancia local:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_DE_OUTPUT_START>
```
*Las claves se muestran al finalizar `npx supabase start`.*
