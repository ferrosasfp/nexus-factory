#!/usr/bin/env node

/**
 * Field Shift: guarda una copia de los datos de NASA POWER para usar la demo sin internet.
 * Port de field-shift-mvp/scripts/descargar-datos.mjs.
 *
 * Uso (con internet, antes del workshop):  npm run field-shift:datos
 *
 * Escribe src/features/field-shift/data/<zona>.json con la respuesta cruda de la API
 * mensual de NASA POWER (2001-2025). El route handler los usa si la API falla.
 * Los parámetros deben coincidir con urlNasaPower() en services/nasa.ts.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DATA_DIR = resolve(process.cwd(), 'src/features/field-shift/data')
const ZONAS = JSON.parse(readFileSync(resolve(DATA_DIR, 'zonas.json'), 'utf-8'))

const ANIO_INICIO = 2001
const ANIO_FIN = 2025
const VARIABLES = ['PRECTOTCORR', 'T2M', 'T2M_MIN', 'GWETROOT']

function urlNasaPower(lat, lon) {
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

let fallos = 0
for (const zona of ZONAS) {
  process.stdout.write(`  Descargando ${zona.id}… `)
  try {
    const r = await fetch(urlNasaPower(zona.lat, zona.lon), { signal: AbortSignal.timeout(60_000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const json = await r.json()
    if (!json?.properties?.parameter?.PRECTOTCORR) throw new Error('respuesta sin datos')
    writeFileSync(resolve(DATA_DIR, `${zona.id}.json`), JSON.stringify(json))
    console.log('listo')
  } catch (e) {
    fallos++
    console.log(`error: ${e instanceof Error ? e.message : e}`)
  }
}

if (fallos > 0) process.exit(1)
