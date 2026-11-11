#!/usr/bin/env node

/**
 * Field Shift: genera el golden de paridad a partir del MVP original (vanilla JS).
 *
 * Uso:  npm run field-shift:golden -- <ruta-a-field-shift-mvp>
 *       (por defecto ../field-shift-mvp, o la variable FIELD_SHIFT_MVP)
 *
 * Importa web/nasa.js y web/rotacion.js del MVP SIN modificarlos, les pasa los snapshots
 * versionados (src/features/field-shift/data/*.json) y guarda la salida en
 * src/features/field-shift/services/__tests__/fixtures/golden.json.
 * Los tests de Vitest comparan el port de TypeScript contra este archivo.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const mvp = resolve(process.argv[2] || process.env.FIELD_SHIFT_MVP || '../field-shift-mvp')
if (!existsSync(resolve(mvp, 'web/rotacion.js'))) {
  console.error(`  No encuentro web/rotacion.js en ${mvp}`)
  process.exit(1)
}

const DATA_DIR = resolve(process.cwd(), 'src/features/field-shift/data')
const OUT_DIR = resolve(process.cwd(), 'src/features/field-shift/services/__tests__/fixtures')
const ZONAS = JSON.parse(readFileSync(resolve(DATA_DIR, 'zonas.json'), 'utf-8'))

const importar = (rel) => import(pathToFileURL(resolve(mvp, rel)).href)
const { obtenerDatos } = await importar('web/nasa.js')
const { analizarClima, recomendarRotaciones, backtest, umbralSugerido } = await importar('web/rotacion.js')

export const ESCENARIOS = ['todas', 'nino', 'nina']
export const PRESETS = {
  default: { comida: 2, ingreso: 1, suelo: 1, clima: 3 },
  soloComida: { comida: 3, ingreso: 0, suelo: 0, clima: 0 },
  soloIngreso: { comida: 0, ingreso: 3, suelo: 0, clima: 0 },
  soloSuelo: { comida: 0, ingreso: 0, suelo: 3, clima: 0 },
  soloClima: { comida: 0, ingreso: 0, suelo: 0, clima: 3 },
  ceros: { comida: 0, ingreso: 0, suelo: 0, clima: 0 },
}
const UMBRALES_FIJOS = [0.3, 0.45]

const golden = { generado: new Date().toISOString(), escenarios: ESCENARIOS, presets: PRESETS, zonas: {} }

for (const zona of ZONAS) {
  const snapshot = readFileSync(resolve(DATA_DIR, `${zona.id}.json`), 'utf-8')
  // obtenerDatos() del MVP busca primero ./data/<zona>.json: le servimos el snapshot.
  globalThis.fetch = async () => new Response(snapshot, { status: 200 })
  const { meses } = await obtenerDatos(zona)

  const porEscenario = {}
  for (const escenario of ESCENARIOS) {
    try {
      const clima = analizarClima(meses, escenario)
      const recomendaciones = {}
      for (const [nombre, prioridades] of Object.entries(PRESETS)) {
        recomendaciones[nombre] = recomendarRotaciones(clima, { ...prioridades })
      }
      porEscenario[escenario] = { clima, recomendaciones }
    } catch (e) {
      porEscenario[escenario] = { error: e.message }
    }
  }

  const climaTodas = analizarClima(meses, 'todas')
  const sugerido = umbralSugerido(climaTodas)
  const backtests = {}
  for (const u of [...UMBRALES_FIJOS, sugerido]) backtests[String(u)] = backtest(climaTodas, u)

  golden.zonas[zona.id] = { meses, escenarios: porEscenario, umbralSugerido: sugerido, backtests }
  console.log(`  ✓ ${zona.id}: ${meses.length} meses`)
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(resolve(OUT_DIR, 'golden.json'), JSON.stringify(golden, null, 1))
console.log(`\n  Golden escrito en ${OUT_DIR}`)
