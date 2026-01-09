# Documentación Maestra del Proyecto: Avalia SaaS

> **Versión del Documento:** 2.0  
> **Estado del Proyecto:** Fase 2 (Consolidación y Optimización)  
> **Última Actualización:** Enero 2026

---

## 1. Propósito y Objetivos del Proyecto

### 🎯 Propósito
**Avalia SaaS** nace con la misión de transformar la gestión financiera y el análisis de riesgo crediticio para empresas. Es una plataforma B2B diseñada para digitalizar, centralizar y agilizar el proceso de **radicación de facturas**, **evaluación de pagadores** y **aprobación de cupos de crédito**.

Su núcleo es servir como puente tecnológico entre **Proveedores (Clientes)** que buscan liquidez o gestión de cartera, y **Entidades Financieras/Administradores** que gestionan el riesgo y otorgan los recursos.

### 🚀 Objetivos Estratégicos
1.  **Centralización Operativa:** Eliminar el uso de correos y hojas de cálculo para la gestión de solicitudes de crédito.
2.  **Mitigación de Riesgo:** Implementar flujos de aprobación estrictos y validaciones de datos en tiempo real.
3.  **Escalabilidad Tecnológica:** Proveer una arquitectura capaz de procesar miles de transacciones simultáneas con seguridad bancaria.
4.  **Experiencia de Usuario (UX):** Ofrecer una interfaz moderna, intuitiva y responsiva que reduzca la curva de aprendizaje a minutos.

---

## 2. Roadmap de Desarrollo (Fases 0 a 5)

Este roadmap describe la evolución del producto desde su concepción hasta su madurez comercial.

### 🏗️ Fase 0: Cimientos y Arquitectura (Completada)
**Enfoque:** Infraestructura, Seguridad y Diseño Base.
*   **Entregables:**
    *   Configuración del repositorio y CI/CD básico (Vercel).
    *   Definición del Stack: Next.js 16 (App Router), Tailwind CSS 4, Supabase.
    *   **Brandbook:** Definición de identidad visual (Colores `Avalia Petrol`, Tipografía Geist).
    *   Esquema de Base de Datos inicial (PostgreSQL): Tablas `profiles`, `invoices`, `payers`.
    *   Sistema de Autenticación robusto con **SlideCaptcha** y Middleware de protección.
*   **Hito de Éxito:** Despliegue de "Hello World" con login funcional y conexión a base de datos segura.

### ⚡ Fase 1: MVP Funcional (Completada)
**Enfoque:** Funcionalidad Core para Administradores y Clientes.
*   **Entregables:**
    *   **Módulo Admin:** Dashboard con KPIs básicos, Gestión CRUD de Clientes (Crear/Editar empresas).
    *   **Módulo Cliente:** Dashboard de usuario, Formulario de radicación de facturas, Registro de nuevos pagadores.
    *   **Interfaz:** Diseño responsivo básico (Mobile-First).
    *   **Lógica de Negocio:** Validación de formularios con Zod, Server Actions para mutaciones seguras.
*   **Hito de Éxito:** Un cliente real puede registrarse, crear un pagador y radicar una factura sin errores.

### 🛡️ Fase 2: Gestión de Riesgo y Refinamiento (Estado Actual)
**Enfoque:** Flujos de Aprobación, Auditoría y UX Avanzada.
*   **Entregables:**
    *   **Sistema de Aprobaciones:** Flujo donde el Admin aprueba/rechaza pagadores y facturas (Estados: Pendiente, Aprobado, Rechazado).
    *   **Mejoras de UX/UI:** Tablas con scroll horizontal (responsive), Menú lateral con auto-cierre, Feedback visual (Toasts/Notificaciones).
    *   **Seguridad de Datos:** Políticas RLS (Row Level Security) optimizadas en Supabase.
    *   **Visualización:** Gráficos de tendencias financieras (`InvoiceChart`) y distribución de estados.
*   **Hito de Éxito:** Ciclo completo de aprobación operativo y visualización correcta en dispositivos móviles.

### 🤖 Fase 3: Automatización y Notificaciones (Próxima)
**Enfoque:** Reducción de carga operativa y Comunicación.
*   **Entregables:**
    *   **Sistema de Notificaciones:** Emails transaccionales (Bienvenida, Factura Aprobada/Rechazada) vía Resend/SendGrid.
    *   **Carga Masiva:** Importación de facturas desde Excel/CSV.
    *   **Logs de Auditoría:** Historial inmutable de quién hizo qué y cuándo.
    *   **Roles Granulares:** Diferenciación entre "Analista de Riesgo", "Tesorero" y "Super Admin".
*   **Hito de Éxito:** Reducción del 50% en el tiempo de gestión manual por parte del administrador.

### 🧠 Fase 4: Inteligencia y Conectividad
**Enfoque:** Valor Agregado mediante Datos e Integraciones.
*   **Entregables:**
    *   **Scoring Automático:** Algoritmo preliminar de riesgo basado en historial de pagos.
    *   **Integraciones API:** Conexión con Buros de Crédito o Entidades Fiscales (ej. DIAN) para validación de NITs.
    *   **Reportes Avanzados:** Exportación de estados de cuenta en PDF/Excel.
*   **Hito de Éxito:** El sistema sugiere automáticamente la aprobación/rechazo basado en reglas predefinidas.

### 🌍 Fase 5: Ecosistema Comercial y Expansión
**Enfoque:** Monetización y Escala Masiva.
*   **Entregables:**
    *   **Pasarela de Pagos:** Cobro de suscripciones SaaS o comisiones por transacción integrado.
    *   **White-Labeling:** Capacidad de personalizar el look & feel para bancos o financieras que compren el software.
    *   **App Móvil Nativa:** Versión iOS/Android (React Native) reutilizando el backend.
    *   **API Pública:** Para que ERPs (SAP, Oracle) envíen facturas directamente.
*   **Hito de Éxito:** Venta de la primera licencia Enterprise o White-Label.

---

## 3. Funcionalidad Detallada por Módulo

### 🔐 Autenticación & Seguridad
*   **Login Seguro:** Acceso mediante correo y contraseña.
*   **SlideCaptcha:** Mecanismo anti-bot personalizado que requiere interacción humana física (deslizar).
*   **Protección de Rutas:** Middleware inteligente que redirige según el rol (`/admin` vs `/dashboard`).

### 🏢 Panel de Administración (`/admin`)
Diseñado para el operador del sistema (La Financiera/Factor).
*   **Dashboard Principal:** Vista de pájaro con KPIs (Total Financiado, Solicitudes Pendientes) y Gráfico de Volumen Transaccional.
*   **Gestión de Clientes:** Directorio de empresas registradas. Permite dar de alta nuevos clientes y gestionar sus accesos.
*   **Centro de Aprobaciones:** Bandeja de entrada de solicitudes (Pagadores/Facturas). Permite filtrar por estado y tomar decisiones (Aprobar/Rechazar).
*   **Notificaciones:** Centro de alertas sobre actividades recientes del sistema.

### 📊 Panel de Cliente (`/dashboard`)
Diseñado para la empresa que busca financiación (El Usuario).
*   **Resumen Financiero:** Visualización de su cupo disponible, facturas en proceso y total financiado.
*   **Gestión de Pagadores:** Módulo para registrar a sus clientes (deudores) y solicitar cupos para ellos.
*   **Radicación de Facturas:** Formulario optimizado para cargar facturas individuales, asociarlas a un pagador y enviarlas a estudio.
*   **Perfil:** Gestión de datos corporativos y seguridad de la cuenta.

---

## 4. Aspectos Comerciales y Presentación

### 💼 ¿Cómo vender Avalia SaaS?
Avalia no se vende solo como un software, sino como **"Infraestructura Digital para Financiación Inteligente"**.

**El Pitch de Venta:**
> "Para entidades financieras y empresas de factoring que pierden días gestionando solicitudes en Excel y correos, Avalia es la plataforma de operación crediticia que automatiza la evaluación y centraliza la información. A diferencia de los desarrollos a medida costosos y lentos, Avalia ofrece una solución SaaS lista para usar, segura y escalable desde el día uno."

### 💎 Propuesta de Valor
1.  **Velocidad:** Implementación en días, no meses.
2.  **Seguridad:** Estándares de protección de datos empresariales.
3.  **Transparencia:** Tanto la financiera como el cliente ven el mismo estado en tiempo real.

---

## 5. Beneficios y Casos de Uso

### Para la Entidad Financiera (Admin)
*   **Beneficio:** Reducción drástica de errores operativos y fraude.
*   **Caso de Uso:** Un analista revisa 50 facturas en 10 minutos usando la bandeja de aprobaciones centralizada, en lugar de buscar en 50 correos diferentes.

### Para la Empresa Cliente (Usuario)
*   **Beneficio:** Liquidez más rápida y visibilidad total de su flujo de caja.
*   **Caso de Uso:** Un gerente financiero carga una factura desde su tablet mientras está en una reunión y recibe la notificación de aprobación antes de salir.

---

## 6. Arquitectura Técnica Simplificada

```mermaid
graph TD
    User[Usuario (Navegador/Móvil)] -->|HTTPS / Next.js| CDN[Vercel Edge Network]
    CDN -->|Server Actions| AppServer[Servidor Next.js (Lógica)]
    AppServer -->|Auth & Data| Supabase[Supabase BaaS]
    
    subgraph "Capa de Datos (Supabase)"
        Auth[Autenticación (JWT)]
        DB[(PostgreSQL)]
        Storage[Almacenamiento Archivos]
    end
    
    subgraph "Capa de Aplicación"
        Middleware[Middleware de Seguridad]
        Zod[Validación de Datos]
        UI[Componentes React/Tailwind]
    end
```

---

## 7. Requisitos del Sistema

### Técnicos (Para Desarrollo/Despliegue)
*   **Runtime:** Node.js 18+
*   **Control de Versiones:** Git
*   **Variables de Entorno:** Claves de API de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE`).
*   **Infraestructura:** Cuenta en Vercel (Frontend) y Supabase (Backend).

### No Técnicos (Para Operación)
*   **Definición de Reglas de Riesgo:** Criterios claros para aprobar/rechazar cupos.
*   **Brand Assets:** Logos e identidad visual para personalización.
*   **Términos Legales:** Documentos de habeas data y contratos para el footer/login.

---

## 8. Criterios de Éxito y Métricas

### Métricas de Validación (KPIs)
1.  **Time-to-Approval:** Tiempo promedio desde que se sube una factura hasta que se aprueba. (Meta Fase 3: < 4 horas).
2.  **Tasa de Adopción:** % de clientes invitados que completan su registro y suben al menos una factura.
3.  **Error Rate:** % de facturas rechazadas por datos incorrectos (Indica si el UX del formulario es claro).
4.  **Uptime:** Disponibilidad de la plataforma (Meta: 99.9%).

### Criterios de Calidad de Código
*   **Tipado Estricto:** Cero errores de TypeScript en compilación (`npm run build`).
*   **Performance:** Core Web Vitals en verde (LCP < 2.5s).
*   **Seguridad:** Ninguna exposición de claves privadas en cliente.
