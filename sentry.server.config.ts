/**
 * sentry.server.config.ts
 * Configuración de Sentry para el entorno SERVER (Node.js).
 *
 * Next.js carga este archivo automáticamente en el servidor
 * cuando @sentry/nextjs está instalado y withSentryConfig está en next.config.mjs.
 *
 * Requiere: npm install @sentry/nextjs
 */

import { initSentry } from '@/lib/sentry'

initSentry({
  // En servidor podemos capturar más transacciones sin impacto en UX
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
})
