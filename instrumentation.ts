/**
 * instrumentation.ts
 * Punto de entrada de Sentry para server y edge (Next.js carga register() al arrancar).
 */

import * as Sentry from '@sentry/nextjs'

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Reporta errores de Server Components, route handlers y middleware
export const onRequestError = Sentry.captureRequestError
