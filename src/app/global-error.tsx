/**
 * src/app/global-error.tsx
 * Error boundary global de Next.js App Router.
 *
 * Captura errores no controlados en el layout raíz y los reporta a Sentry.
 * Se renderiza en lugar del layout cuando ocurre un error crítico.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 * Requiere: npm install @sentry/nextjs
 */

'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Reporta el error a Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        {/* Usa el componente de error de Next.js como fallback visual */}
        <NextError statusCode={500} />

        {/* Botón para intentar recuperarse del error */}
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
