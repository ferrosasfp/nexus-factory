import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

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
  // Organización en sentry.io (SENTRY_ORG en .env)
  org: process.env.SENTRY_ORG,

  // Proyecto en sentry.io (SENTRY_PROJECT en .env)
  project: process.env.SENTRY_PROJECT,

  // Auth token para subir source maps (SENTRY_AUTH_TOKEN en .env)
  // Obtener en: https://sentry.io/settings/account/api/auth-tokens/
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silencia el output de Sentry en build (menos ruido en CI)
  silent: !process.env.CI,

  // Oculta source maps del bundle del cliente (seguridad)
  // Los source maps se suben a Sentry y se eliminan del build
  hideSourceMaps: true,

  // Deshabilita el logger de Sentry en producción
  disableLogger: true,

  // Tunnel para evitar ad blockers que bloqueen sentry.io
  // Las peticiones van a /api/sentry-tunnel en lugar de sentry.io directamente
  tunnelRoute: '/api/sentry-tunnel',

  // Instrumentación automática de rutas (recomendado para App Router)
  automaticVercelMonitors: true,
})
