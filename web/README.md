# Avalia SaaS - Plataforma de Gestión de Riesgo y Factoring

Plataforma SaaS diseñada para optimizar la gestión de facturas, análisis de riesgo de clientes y asignación de cupos de crédito. Construida con tecnologías modernas para ofrecer una experiencia rápida, segura y escalable.

## 🚀 Tecnologías Principales

Este proyecto utiliza el siguiente stack tecnológico:

- **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Email Service:** [Resend](https://resend.com/)
- **Componentes UI:** [Lucide React](https://lucide.dev/) (Iconos)
- **Validación:** [Zod](https://zod.dev/)

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (Gestor de paquetes)
- Una cuenta activa en [Supabase](https://supabase.com/)
- Una cuenta activa en [Resend](https://resend.com/) (Para envío de correos)

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/collectia-avalia/col360.git
    cd avaliasaas/web
    ```

2.  **Instalar dependencias:**

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**

    Crea un archivo `.env.local` en la raíz del proyecto (`web/`) y agrega las siguientes claves. Puedes usar `.env.example` como guía si existe.

    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
    
    # Resend Configuration (Email)
    RESEND_API_KEY=tu_resend_api_key
    ```

4.  **Ejecutar el servidor de desarrollo:**

    ```bash
    npm run dev
    ```

    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📂 Estructura del Proyecto

El proyecto sigue la arquitectura recomendada de Next.js App Router:

```
web/
├── src/
│   ├── app/                 # Rutas de la aplicación (App Router)
│   │   ├── auth/            # Rutas de autenticación (login, logout)
│   │   ├── dashboard/       # Panel principal protegido
│   │   │   ├── invoices/    # Módulo de Facturas
│   │   │   ├── payers/      # Módulo de Clientes (Pagadores)
│   │   │   └── page.tsx     # Vista principal del Dashboard
│   │   ├── layout.tsx       # Layout raíz
│   │   └── page.tsx         # Landing page (Login redirect)
│   ├── components/          # Componentes reutilizables
│   │   ├── dashboard/       # Componentes específicos del dashboard (Sidebar, KPIs)
│   │   └── ui/              # Componentes de interfaz genéricos (Botones, Inputs)
│   ├── lib/                 # Utilidades y configuración
│   │   └── supabase/        # Cliente y configuración de Supabase
│   └── middleware.ts        # Protección de rutas y manejo de sesiones
├── public/                  # Archivos estáticos (imágenes, fuentes)
├── .env.local               # Variables de entorno (No commitear)
├── next.config.ts           # Configuración de Next.js
├── package.json             # Dependencias y scripts
└── tsconfig.json            # Configuración de TypeScript
```

## ✨ Características Clave

### Gestión de Clientes (Payers)
- **CRUD Completo:** Crear, leer, actualizar y eliminar clientes.
- **Validación de Riesgo:** Estados visuales (Pendiente, Aprobado, Rechazado).
- **Análisis en Tiempo Real:** Actualización automática de listas al eliminar o modificar registros (vía Supabase Realtime).
- **Invitaciones por Correo:** Envío de correos transaccionales para onboarding de clientes usando Resend.

### Gestión de Facturas (Invoices)
- **Radicación Inteligente:** Lectura automática de XML de facturación electrónica.
- **Validación de NIT:** Algoritmo de normalización para match automático entre XML y Base de Datos.
- **Estados Visuales:** Cálculo dinámico de vencimiento ("Vencida" si Fecha < Hoy) independiente del estado en BD.
- **Garantía Parcial:** Lógica de negocio para calcular cobertura basada en el cupo disponible del pagador.

### Dashboard & UX
- **Diseño Responsive:** Interfaz adaptada a móviles, tablets y escritorio.
- **Gráficos y KPIs:** Visualización clara de métricas financieras.
- **Feedback Visual:** Modales, toasts y estados de carga para mejorar la experiencia del usuario.

## 🤝 Contribución

1.  Haz un Fork del proyecto.
2.  Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3.  Haz tus cambios y realiza commits descriptivos (`git commit -m 'feat: agrega nueva funcionalidad'`).
4.  Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5.  Abre un Pull Request.

## 📄 Licencia

Este proyecto es propiedad privada de **Avalia SaaS**. Todos los derechos reservados.

