import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

vi.mock('server-only', () => ({}))

const mockRateLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  rateLimitApi: (...args: unknown[]) => mockRateLimit(...args),
}))

import { GET } from '../route'
import { normalizarNasa } from '@/features/field-shift/services/nasa'

const SNAPSHOT_CARUMAS = readFileSync(
  resolve(__dirname, '../../../../../features/field-shift/data/carumas.json'),
  'utf-8',
)
const NASA_MINIMA = {
  properties: {
    parameter: {
      PRECTOTCORR: { '202001': 2, '202002': 1 },
      T2M: { '202001': 8, '202002': 8 },
      T2M_MIN: { '202001': -1, '202002': 0 },
      GWETROOT: { '202001': 0.4, '202002': 0.5 },
    },
  },
}

const pedir = (query: string) => new Request(`http://localhost/api/field-shift/nasa${query}`)

describe('GET /api/field-shift/nasa', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    mockRateLimit.mockResolvedValue({ success: true })
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('FIELD_SHIFT_OFFLINE', '')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('responde 200 con origen nasa cuando NASA contesta bien', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response(JSON.stringify(NASA_MINIMA), { status: 200 }))

    // Act
    const res = await GET(pedir('?zona=carumas'))
    const body = await res.json()

    // Assert
    expect(res.status).toBe(200)
    expect(body.zona).toBe('carumas')
    expect(body.origen).toBe('nasa')
    expect(body.meses).toHaveLength(2)
    expect(body.meses[0].lluvia).toBe(62)
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('latitude=-16.81')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 86400 } })
  })

  it('usa el snapshot si NASA responde 500', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response('error', { status: 500 }))

    // Act
    const res = await GET(pedir('?zona=carumas'))
    const body = await res.json()

    // Assert
    expect(res.status).toBe(200)
    expect(body.origen).toBe('offline')
    expect(body.meses).toHaveLength(300)
  })

  it('usa el snapshot si fetch rechaza (timeout)', async () => {
    // Arrange
    fetchMock.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))

    // Act
    const res = await GET(pedir('?zona=ubinas'))
    const body = await res.json()

    // Assert
    expect(res.status).toBe(200)
    expect(body.zona).toBe('ubinas')
    expect(body.origen).toBe('offline')
    expect(body.meses.length).toBeGreaterThan(0)
  })

  it('usa el snapshot si NASA devuelve un JSON sin properties', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ messages: ['x'] }), { status: 200 }))

    // Act
    const res = await GET(pedir('?zona=carumas'))
    const body = await res.json()

    // Assert
    expect(body.origen).toBe('offline')
    expect(body.meses).toHaveLength(300)
  })

  it('con FIELD_SHIFT_OFFLINE=true responde el snapshot sin llamar a fetch', async () => {
    // Arrange
    vi.stubEnv('FIELD_SHIFT_OFFLINE', 'true')

    // Act
    const res = await GET(pedir('?zona=carumas'))
    const body = await res.json()

    // Assert
    expect(fetchMock).not.toHaveBeenCalled()
    expect(body.origen).toBe('offline')
    expect(body.meses).toEqual(normalizarNasa(JSON.parse(SNAPSHOT_CARUMAS)))
  })

  it.each(['?zona=lima', '', '?lat=-16&lon=-70'])('responde 400 con zona inválida (%s)', async (query) => {
    // Act
    const res = await GET(pedir(query))

    // Assert
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('responde 429 cuando se supera el rate limit', async () => {
    // Arrange
    mockRateLimit.mockResolvedValue({ success: false })

    // Act
    const res = await GET(pedir('?zona=carumas'))

    // Assert
    expect(res.status).toBe(429)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
