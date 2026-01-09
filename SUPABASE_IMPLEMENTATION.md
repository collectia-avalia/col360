# Documentación de Implementación Supabase (Fases 3 y 4)

Este documento detalla los cambios realizados en la base de datos Supabase, los flujos de datos implementados y las consideraciones de seguridad para las funcionalidades de "Invitación de Clientes" y "Radicación de Facturas con Legalidad".

## 1. Estructura de Base de Datos

### Tabla: `public.payers` (Clientes/Pagadores)
Se realizaron modificaciones para soportar el flujo de invitación simplificado donde no se tiene toda la información inicial (como el NIT) y para registrar aceptaciones legales.

| Columna | Tipo | Nullable | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `nit` | `text` | **Sí** | - | Se cambió a nullable para permitir crear registros solo con Razón Social y Email. |
| `invitation_status` | `text` | Sí | `'pending_info'` | Estado del flujo de invitación: `pending_info` (creado), `sent` (email enviado), `completed` (datos llenos). |
| `invitation_token` | `text` | Sí | - | Token único (UUID) enviado por correo para que el cliente complete su registro de forma segura. |
| `terms_accepted` | `boolean` | Sí | `false` | Indica si se aceptaron los términos y condiciones generales. |
| `central_auth_accepted` | `boolean` | Sí | `false` | Indica si se autorizó la consulta en centrales de riesgo. |

### Tabla: `public.invoices` (Facturas)
Se añadieron campos para almacenar las declaraciones juramentadas obligatorias por compliance.

| Columna | Tipo | Nullable | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `legal_declarations` | `jsonb` | Sí | `'{}'` | Objeto JSON que almacena las aceptaciones legales específicas de cada factura. |

**Estructura del JSON `legal_declarations`:**
```json
{
  "funds_origin": true,       // Declaración de origen lícito de fondos
  "factoring_terms": true,    // Aceptación de términos de factoring
  "accepted_at": "ISO8601",   // Fecha y hora exacta de la aceptación
  "ip_address": "x.x.x.x"     // (Opcional) IP desde donde se realizó la operación
}
```

## 2. Relaciones y Conexiones

*   **Payers -> Users:** La columna `created_by` en `payers` referencia a `auth.users.id`. Esto mantiene la relación de propiedad: un usuario del sistema "posee" los clientes que invita.
*   **Invoices -> Payers:** La columna `payer_id` es una Foreign Key a `payers.id`.
*   **Invoices -> Users:** La columna `client_id` es una Foreign Key a `auth.users.id` (el usuario que radica la factura).

## 3. Flujos de Datos

### A. Flujo de Invitación de Cliente (Nuevo)
1.  **Entrada:** El usuario ingresa `razonSocial`, `contactEmail` y marca `authContact`.
2.  **Procesamiento:**
    *   Se genera un `tempNit` (ej: `PENDING-1704...`) para tener un identificador temporal único.
    *   Se genera un `invitationToken`.
3.  **Persistencia:**
    *   `INSERT INTO payers` con estado `pending` y `invitation_status = 'sent'`.
    *   `terms_accepted` se marca como `true` (aceptado por el usuario invitante bajo representación).
4.  **Salida:** Se simula el envío de correo (log en servidor) con el link de invitación.

### B. Flujo de Radicación de Factura (Upload-First)
1.  **Entrada:** Archivo XML/PDF y selección de `payerId`.
2.  **Procesamiento (Frontend):**
    *   Parser XML extrae `invoiceNumber`, `amount`, fechas y `NIT`.
    *   Intento de matcheo automático de `payerId` basado en el NIT extraído.
3.  **Persistencia:**
    *   `INSERT INTO invoices` incluyendo el objeto `legal_declarations`.
    *   Cálculo automático de `is_guaranteed` basado en el cupo disponible del pagador (`approved_quota`).
    *   Subida del archivo al bucket `invoices-docs`.

## 4. Seguridad y RLS (Row Level Security)

Aunque la lógica de negocio se protege en los **Server Actions** (`actions.ts`) verificando siempre `supabase.auth.getUser()`, se recomienda encarecidamente tener las siguientes políticas RLS activas en la base de datos para prevenir accesos no autorizados directos:

```sql
-- Ejemplo de Políticas Recomendadas (Verificar existencia)

-- PAYERS: Ver solo los propios
CREATE POLICY "Users can view own payers" ON payers FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert own payers" ON payers FOR INSERT WITH CHECK (auth.uid() = created_by);

-- INVOICES: Ver solo las propias
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = client_id);
```

**Validación Actual en Código:**
*   Todos los `inserts` y `updates` inyectan explícitamente el `user.id` obtenido de la sesión segura.
*   Las consultas de lectura filtran por `.eq('created_by', user.id)` o `.eq('client_id', user.id)`.

## 5. Pruebas de Validación

### Caso 1: Invitación de Cliente
*   **Acción:** Ir a `/dashboard/payers/new`, llenar solo nombre y correo, aceptar checkbox, enviar.
*   **Resultado Esperado:**
    *   Redirección a lista de clientes.
    *   Nuevo cliente aparece en la tabla con estado "En Estudio" (o Pendiente).
    *   En BD: `nit` debe ser un string `PENDING-...`, `invitation_token` no debe ser nulo.

### Caso 2: Radicación XML con Auto-Match
*   **Acción:** Ir a `/dashboard/invoices/new`, subir XML con un NIT que coincida con un cliente existente.
*   **Resultado Esperado:**
    *   Campos (Número, Valor, Fechas) se autocompletan.
    *   Dropdown "Pagador" selecciona automáticamente la empresa correcta.
    *   Mensaje "Pagador identificado por NIT..." aparece.

### Caso 3: Validación Legal en Factura
*   **Acción:** Intentar radicar factura sin marcar los checkboxes de "Declaración de Origen" y "Términos".
*   **Resultado Esperado:**
    *   El navegador impide el envío (HTML5 `required`).
    *   Si se bypassea el frontend, el Server Action retorna error de validación Zod.
    *   En BD: Columna `legal_declarations` debe contener `{ "funds_origin": true, ... }`.

## 6. Instrucciones de Mantenimiento

*   **Migraciones:** Si se despliega en un nuevo entorno, ejecutar `supabase/migrations/20240109000001_phase3_legal.sql`.
*   **Storage:** Asegurar que el bucket `invoices-docs` exista y tenga políticas de acceso que permitan lectura/escritura solo a usuarios autenticados sobre su propia carpeta `user_id/*`.
