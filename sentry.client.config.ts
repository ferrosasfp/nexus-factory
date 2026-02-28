/**
 * sentry.client.config.ts
 * Configuración de Sentry para el entorno CLIENT (browser).
 *
 * Next.js carga este archivo automáticamente en el bundle del cliente
 * cuando @sentry/nextjs está instalado y withSentryConfig está en next.config.mjs.
 *
 * Requiere: npm install @sentry/nextjs
 */

import { initSentry } from '@/lib/sentry'
import { Replay } from '@sentry/nextjs'

initSentry({
  // Integración de Session Replay (solo client)
  // Graba la sesión del usuario para reproducir errores
  integrations: [
    new Replay({
      // Enmascara texto de inputs para privacidad (PCI/GDPR)
      maskAllInputs: true,
      // No bloquea imágenes en el replay
      blockAllMedia: false,
    }),
  ],
})
