/**
 * src/lib/rate-limit.ts
 * Helper reutilizable de rate limiting usando Upstash Redis + @upstash/ratelimit.
 *
 * Graceful degradation: si Redis no está configurado (dev sin .env),
 * todas las funciones retornan { success: true } y no rompen el servidor.
 *
 * Requiere: npm install @upstash/ratelimit @upstash/redis
 *
 * USAGE en un route handler (Server Actions: rateLimitServerAction):
 * ─────────────────────────────────
 * import { rateLimitApi } from '@/lib/rate-limit'
 *
 * export async function GET(request: Request) {
 *   const { success } = await rateLimitApi(request)
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 *   // ... resto del handler
 * }
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface RateLimitResult {
  /** true = request permitido, false = request bloqueado */
  success: boolean
  /** Requests restantes en la ventana actual */
  remaining: number
  /** Timestamp (ms) cuando se resetea la ventana */
  reset: number
  /** Límite total de la ventana */
  limit: number
}

// ─── Inicialización condicional ───────────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Retorna null si Redis no está configurado (dev sin .env).
 * Retorna instancia de Redis si está configurado.
 */
function createRedis(): Redis | null {
  if (!REDIS_URL || !REDIS_TOKEN) return null
  return new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
}

const redis = createRedis()

/**
 * Resultado por defecto cuando Redis no está disponible.
 * Permite que el request pase (graceful degradation).
 */
const FALLBACK_RESULT: RateLimitResult = {
  success: true,
  remaining: 999,
  reset: Date.now() + 60_000,
  limit: 999,
}

// ─── Presets de Rate Limiting ─────────────────────────────────────────────────

/**
 * Crea un Ratelimit con ventana fija.
 * Retorna null si Redis no está configurado.
 */
function createLimiter(tokens: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
  })
}

// Instancias lazy (se crean una vez y se reutilizan)
let _apiLimiter: Ratelimit | null | undefined
let _authLimiter: Ratelimit | null | undefined
let _expensiveLimiter: Ratelimit | null | undefined

function getApiLimiter() {
  if (_apiLimiter === undefined) _apiLimiter = createLimiter(100, '1 m')
  return _apiLimiter
}

function getAuthLimiter() {
  if (_authLimiter === undefined) _authLimiter = createLimiter(10, '1 m')
  return _authLimiter
}

function getExpensiveLimiter() {
  if (_expensiveLimiter === undefined) _expensiveLimiter = createLimiter(20, '1 h')
  return _expensiveLimiter
}

// ─── Extracción de identificador ─────────────────────────────────────────────

type RateLimitPreset = 'api' | 'auth' | 'expensive'

const LIMITERS: Record<RateLimitPreset, () => Ratelimit | null> = {
  api: getApiLimiter,
  auth: getAuthLimiter,
  expensive: getExpensiveLimiter,
}

/**
 * Extrae el identificador para el rate limit.
 * Prioridad: x-real-ip (lo fija la plataforma, ej. Vercel) → x-forwarded-for → 'anonymous'
 */
function getIdentifierFromHeaders(headers: Headers): string {
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  )
}

async function limitByKey(preset: RateLimitPreset, key: string): Promise<RateLimitResult> {
  const limiter = LIMITERS[preset]()
  if (!limiter) return FALLBACK_RESULT

  const result = await limiter.limit(key)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  }
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * PRESET: API pública — 100 req/min por IP.
 * Usar en: endpoints públicos de lectura, búsquedas, listings.
 */
export async function rateLimitApi(request: Request): Promise<RateLimitResult> {
  return limitByKey('api', getIdentifierFromHeaders(request.headers))
}

/**
 * PRESET: Auth — 10 req/min por IP.
 * Ventana más estricta para prevenir brute force.
 */
export async function rateLimitAuth(request: Request): Promise<RateLimitResult> {
  return limitByKey('auth', getIdentifierFromHeaders(request.headers))
}

/**
 * PRESET: Operaciones costosas — 20 req/hora por IP.
 * Usar en: llamadas a IA, operaciones blockchain, procesamiento pesado.
 */
export async function rateLimitExpensive(request: Request): Promise<RateLimitResult> {
  return limitByKey('expensive', getIdentifierFromHeaders(request.headers))
}

/**
 * Rate limit para Server Actions (no reciben Request).
 * `scope` separa contadores por acción: 'login', 'signup', 'upload'...
 *
 * Uso:
 *   const rl = await rateLimitServerAction('auth', 'login')
 *   if (!rl.success) return { error: 'Too many requests' }
 */
export async function rateLimitServerAction(
  preset: RateLimitPreset,
  scope: string,
  headerList: Headers,
): Promise<RateLimitResult> {
  return limitByKey(preset, `${scope}:${getIdentifierFromHeaders(headerList)}`)
}

/**
 * Genera headers HTTP estándar de rate limit para incluir en la respuesta.
 * Útil para que los clientes sepan cuándo reintentar.
 *
 * Uso:
 *   const rl = await rateLimitApi(request)
 *   return NextResponse.json(data, { headers: rateLimitHeaders(rl) })
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    ...(result.success ? {} : { 'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)) }),
  }
}
