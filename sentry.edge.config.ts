/**
 * sentry.edge.config.ts
 * Configuración de Sentry para el entorno EDGE (Middleware, Edge Runtime).
 *
 * Next.js carga este archivo automáticamente en Edge Runtime
 * cuando @sentry/nextjs está instalado y withSentryConfig está en next.config.mjs.
 *
 * Requiere: npm install @sentry/nextjs
 * Nota: Edge Runtime tiene APIs limitadas vs Node.js
 *
 * Requiere: npm install @sentry/nextjs
 */

import { initSentry } from '@/lib/sentry'

initSentry({
  // Edge Runtime: sin session replay, sin profiling
  // Solo error tracking básico
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
})
