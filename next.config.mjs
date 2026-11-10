import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs/config'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Activa el MCP server en /_next/mcp (Next.js 16+)
    experimental: {
        mcpServer: true,
    },
}

const nextIntlConfig = withNextIntl(nextConfig)

/**
 * Configuración de Sentry para Next.js.
 * withSentryConfig wrappea la config de Next.js para:
 * - Subir source maps automáticamente en build
 * - Instrumentar automáticamente rutas y API handlers
 * - Habilitar tree-shaking del SDK en producción
 *
 * Si SENTRY_AUTH_TOKEN no está definido (dev), el build sigue funcionando
 * pero no se suben source maps.
 *
 * Requiere: npm install @sentry/nextjs
 */
export default withSentryConfig(nextIntlConfig, {
  // Organización y proyecto en sentry.io (SENTRY_ORG / SENTRY_PROJECT en .env)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Token para subir source maps (SENTRY_AUTH_TOKEN, solo en CI/Vercel)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silencia el output de Sentry fuera de CI
  silent: !process.env.CI,

  // Sube los source maps y los borra del build público
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel para evitar ad blockers que bloqueen sentry.io
  tunnelRoute: '/api/sentry-tunnel',
})
