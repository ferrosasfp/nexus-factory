'use client'

import { useCallback, useState } from 'react'
import { z } from 'zod'
import type { RespuestaNasa, ZonaId } from '../types'

const numeroONulo = z.number().nullable()

const respuestaSchema = z.object({
  zona: z.enum(['carumas', 'ichuna', 'ubinas', 'yunga']),
  origen: z.enum(['nasa', 'offline']),
  meses: z.array(
    z.object({
      anio: z.number(),
      mes: z.number(),
      lluvia: numeroONulo,
      temp: numeroONulo,
      tmin: numeroONulo,
      humedad: numeroONulo,
    }),
  ),
})

/** Pide al handler /api/field-shift/nasa los meses de una zona (NASA en vivo o snapshot). */
export function useClima() {
  const [datos, setDatos] = useState<RespuestaNasa | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const consultar = useCallback(async (zona: ZonaId) => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/field-shift/nasa?zona=${encodeURIComponent(zona)}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const parsed = respuestaSchema.safeParse(await r.json())
      if (!parsed.success) throw new Error('Respuesta inválida')
      setDatos(parsed.data)
      return parsed.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { datos, loading, error, consultar }
}
