# Usar imagen base ligera de Node.js
FROM node:18-alpine AS base

# Dependencias necesarias para algunas librerías de sistema
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED 1

# Build de la aplicación
RUN npm run build

# Runner stage - Imagen final de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para standalone mode
COPY --from=builder /app/public ./public

# Configurar permisos
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar salida standalone de Next.js
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# El hostname "0.0.0.0" es crucial para Docker
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
