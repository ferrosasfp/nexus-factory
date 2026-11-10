/**
 * instrumentation-client.ts
 * Sentry en el navegador (Next.js 15.3+ / Sentry v9+ reemplazan sentry.client.config.ts).
 * Si NEXT_PUBLIC_SENTRY_DSN no está definido, initSentry no hace nada.
 */

import * as Sentry from '@sentry/nextjs'
import { initSentry } from '@/lib/sentry'

initSentry({
  integrations: [
    Sentry.replayIntegration({
      // Enmascara texto e inputs para privacidad (PCI/GDPR)
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
})

// Instrumenta las navegaciones del App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
