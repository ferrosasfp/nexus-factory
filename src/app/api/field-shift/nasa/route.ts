/**
 * GET /api/field-shift/nasa?zona=<id>
 * Consulta NASA POWER (mensual 2001-2025) para una zona conocida, normaliza y cachea 24 h.
 * Si NASA falla, tarda más de 8 s o devuelve algo inválido (o FIELD_SHIFT_OFFLINE=true),
 * responde con el snapshot versionado en el repo (origen 'offline').
 * No acepta lat/lon: solo las zonas de ZONAS.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitApi } from '@/lib/rate-limit'
import { ZONAS, esZonaId } from '@/features/field-shift/services/cultivos'
import { urlNasaPower, normalizarNasa } from '@/features/field-shift/services/nasa'
import { obtenerSnapshot } from '@/features/field-shift/services/snapshots'
import type { Mes, OrigenDatos, RespuestaNasa, ZonaId } from '@/features/field-shift/types'

const querySchema = z.object({ zona: z.string().refine(esZonaId) })
const TIMEOUT_MS = 8_000
const REVALIDATE_S = 86_400

async function consultarNasa(zona: ZonaId): Promise<Mes[]> {
  const coords = ZONAS.find((x) => x.id === zona)
  if (!coords) throw new Error('zona sin coordenadas')
  const r = await fetch(urlNasaPower(coords.lat, coords.lon), {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: REVALIDATE_S },
  })
  if (!r.ok) throw new Error(`NASA POWER respondió ${r.status}`)
  return normalizarNasa(await r.json())
}

export async function GET(request: Request) {
  const { success } = await rateLimitApi(request)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const parsed = querySchema.safeParse({ zona: new URL(request.url).searchParams.get('zona') })
  if (!parsed.success || !esZonaId(parsed.data.zona)) {
    return NextResponse.json({ error: 'Zona inválida' }, { status: 400 })
  }
  const zona = parsed.data.zona

  let origen: OrigenDatos = 'offline'
  let meses: Mes[] | null = null
  if (process.env.FIELD_SHIFT_OFFLINE !== 'true') {
    try {
      meses = await consultarNasa(zona)
      origen = 'nasa'
    } catch (err) {
      const motivo = err instanceof Error ? err.name + ': ' + err.message.slice(0, 120) : 'desconocido'
      console.warn(`[field-shift] NASA POWER no disponible (${zona}), uso el snapshot. ${motivo}`)
    }
  }
  if (!meses) meses = normalizarNasa(obtenerSnapshot(zona))

  const body: RespuestaNasa = { zona, origen, meses }
  return NextResponse.json(body)
}
