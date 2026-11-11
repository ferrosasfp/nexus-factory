// Descarga y ordena los datos de NASA POWER. Port de web/nasa.js.
// NASA POWER es una API pública de NASA: no pide registro ni llave.
// https://power.larc.nasa.gov
//
// Variables que usamos:
//   PRECTOTCORR -> lluvia (mm por día, promedio del mes)
//   T2M         -> temperatura del aire a 2 metros (°C)
//   T2M_MIN     -> temperatura mínima del aire a 2 metros (°C), para las heladas
//   GWETROOT    -> humedad del suelo en la zona de raíces (0 = seco, 1 = saturado)
//
// Ojo: cada dato cubre una celda de unos 50 km. En Moquegua, que sube de la costa
// a más de 4,000 m en poca distancia, una celda mezcla pisos ecológicos distintos.

import { z } from 'zod'
import type { Mes } from '../types'

export const ANIO_INICIO = 2001
export const ANIO_FIN = 2025

export const VARIABLES = ['PRECTOTCORR', 'T2M', 'T2M_MIN', 'GWETROOT'] as const

export function urlNasaPower(lat: number, lon: number): string {
  const params = new URLSearchParams({
    parameters: VARIABLES.join(','),
    community: 'AG',
    latitude: String(lat),
    longitude: String(lon),
    start: String(ANIO_INICIO),
    end: String(ANIO_FIN),
    format: 'JSON',
  })
  return `https://power.larc.nasa.gov/api/temporal/monthly/point?${params}`
}

const serie = z.record(z.string(), z.number())

export const nasaPowerSchema = z.object({
  properties: z.object({
    parameter: z.object({
      PRECTOTCORR: serie,
      T2M: serie.optional(),
      T2M_MIN: serie.optional(),
      GWETROOT: serie.optional(),
    }),
  }),
})

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate()
}

const valido = (v: number | undefined): number | null => (v === undefined || v <= -999 ? null : v)

// Convierte la respuesta de NASA en una lista simple:
// [{ anio, mes, lluvia (mm del mes), temp (°C), tmin (°C), humedad (0–1) }, ...]
export function normalizarNasa(json: unknown): Mes[] {
  const parsed = nasaPowerSchema.safeParse(json)
  if (!parsed.success) throw new Error('Respuesta de NASA POWER sin datos')
  const p = parsed.data.properties.parameter
  const meses: Mes[] = []
  for (const clave of Object.keys(p.PRECTOTCORR)) {
    const anio = Number(clave.slice(0, 4))
    const mes = Number(clave.slice(4, 6))
    if (mes < 1 || mes > 12) continue // el mes "13" es el promedio anual
    const lluviaDia = valido(p.PRECTOTCORR[clave])
    meses.push({
      anio,
      mes,
      lluvia: lluviaDia === null ? null : lluviaDia * diasDelMes(anio, mes),
      temp: valido(p.T2M?.[clave]),
      tmin: valido(p.T2M_MIN?.[clave]),
      humedad: valido(p.GWETROOT?.[clave]),
    })
  }
  return meses.sort((a, b) => a.anio - b.anio || a.mes - b.mes)
}
