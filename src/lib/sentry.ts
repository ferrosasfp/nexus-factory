/**
 * src/lib/sentry.ts
 * Cliente centralizado de Sentry para NexusFactory.
 *
 * Inicialización condicional: solo activa Sentry si NEXT_PUBLIC_SENTRY_DSN está definido.
 * Esto permite que el proyecto funcione en desarrollo sin configuración de Sentry.
 *
 * Requiere: npm install @sentry/nextjs
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Inicializa Sentry con configuración de producción.
 * Llamar desde instrumentation-client.ts, sentry.server.config.ts y sentry.edge.config.ts.
 */
export function initSentry(options?: Partial<Parameters<typeof Sentry.init>[0]>) {
  if (!SENTRY_DSN) {
    // Sin DSN configurado → no inicializar. No rompe dev.
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Porcentaje de transacciones capturadas para performance monitoring (0.0 - 1.0)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Porcentaje de sesiones capturadas para replay (solo client)
    replaysSessionSampleRate: 0.1,

    // Captura 100% de sesiones con error para replay
    replaysOnErrorSampleRate: 1.0,

    // No capturar en desarrollo para no generar ruido
    enabled: process.env.NODE_ENV === 'production',

    // Ignora errores conocidos no accionables
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /^Network Error$/,
      /^Loading chunk \d+ failed/,
    ],

    // Permite sobreescribir con opciones específicas por entorno
    ...options,
  })
}

/**
 * Captura una excepción manualmente con contexto adicional.
 * Uso: captureException(error, { userId: '123', action: 'checkout' })
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): string | undefined {
  if (!SENTRY_DSN) return undefined

  return Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Captura un mensaje informativo o de warning.
 * Uso: captureMessage('Pago procesado', 'info')
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): string | undefined {
  if (!SENTRY_DSN) return undefined

  return Sentry.captureMessage(message, level)
}

/**
 * Establece el usuario actual en Sentry para asociar errores.
 * Llamar después del login.
 */
export function setSentryUser(user: { id: string; email?: string } | null) {
  if (!SENTRY_DSN) return

  if (user) {
    Sentry.setUser({ id: user.id, email: user.email })
  } else {
    Sentry.setUser(null)
  }
}

export { Sentry }
