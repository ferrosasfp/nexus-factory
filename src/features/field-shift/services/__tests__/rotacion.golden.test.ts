import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createTranslator } from 'next-intl'
import es from '../../../../../messages/es.json'
import { normalizarNasa } from '../nasa'
import {
  analizarClima,
  recomendarRotaciones,
  backtest,
  umbralSugerido,
  FieldShiftError,
} from '../rotacion'
import { formatearRazon, type Traductor } from '../razones'
import type { Clima, Escenario, Mes, Prioridades, PuntoBacktest, ZonaId } from '../../types'

// Golden generado por scripts/field-shift-golden.mjs con el MVP original (vanilla JS).
interface RotacionGolden {
  anio1: string
  anio2: string
  total: number
  componentes: Record<string, number>
  razones: string[]
}

type EscenarioGolden =
  | { clima: Clima; recomendaciones: Record<string, RotacionGolden[]> }
  | { error: string }

interface ZonaGolden {
  meses: Mes[]
  escenarios: Record<Escenario, EscenarioGolden>
  umbralSugerido: number
  backtests: Record<string, PuntoBacktest[]>
}

interface Golden {
  presets: Record<string, Prioridades>
  zonas: Record<ZonaId, ZonaGolden>
}

const DATA_DIR = resolve(__dirname, '../../data')
const golden = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/golden.json'), 'utf-8')) as Golden
const leerSnapshot = (zona: string): unknown =>
  JSON.parse(readFileSync(resolve(DATA_DIR, `${zona}.json`), 'utf-8'))

const t = createTranslator({ locale: 'es', messages: es, namespace: 'fieldShift' }) as unknown as Traductor

const ZONAS = Object.keys(golden.zonas) as ZonaId[]
const ESCENARIOS: Escenario[] = ['todas', 'nino', 'nina']

/** Compara recursivamente: números con 1e-9, el resto con igualdad estricta. */
function expectCercano(actual: unknown, esperado: unknown, ruta: string): void {
  if (typeof esperado === 'number') {
    expect(typeof actual, ruta).toBe('number')
    expect(actual as number, ruta).toBeCloseTo(esperado, 9)
    return
  }
  if (Array.isArray(esperado)) {
    expect(Array.isArray(actual), ruta).toBe(true)
    expect((actual as unknown[]).length, ruta).toBe(esperado.length)
    esperado.forEach((e, i) => expectCercano((actual as unknown[])[i], e, `${ruta}[${i}]`))
    return
  }
  if (esperado !== null && typeof esperado === 'object') {
    const a = actual as Record<string, unknown>
    expect(Object.keys(a).sort(), ruta).toEqual(Object.keys(esperado).sort())
    for (const [k, v] of Object.entries(esperado)) expectCercano(a[k], v, `${ruta}.${k}`)
    return
  }
  expect(actual, ruta).toBe(esperado)
}

describe.each(ZONAS)('golden %s', (zona) => {
  const g = golden.zonas[zona]
  const meses = normalizarNasa(leerSnapshot(zona))

  it('normalizarNasa iguala los meses del MVP', () => {
    // Arrange
    const esperado = g.meses

    // Act
    const resultado = normalizarNasa(leerSnapshot(zona))

    // Assert
    expect(resultado).toEqual(esperado)
  })

  describe.each(ESCENARIOS)('escenario %s', (escenario) => {
    const ge = g.escenarios[escenario]

    if ('error' in ge) {
      it('lanza FieldShiftError como el MVP', () => {
        // Arrange & Act & Assert
        expect(() => analizarClima(meses, escenario)).toThrow(FieldShiftError)
      })
      return
    }

    it('analizarClima iguala el clima del MVP', () => {
      // Act
      const clima = analizarClima(meses, escenario)

      // Assert
      expectCercano(clima, ge.clima, 'clima')
    })

    it.each(Object.keys(golden.presets))('recomendaciones con preset %s', (preset) => {
      // Arrange
      const clima = analizarClima(meses, escenario)
      const esperadas = ge.recomendaciones[preset]

      // Act
      const recs = recomendarRotaciones(clima, { ...golden.presets[preset] })

      // Assert
      expect(recs).toHaveLength(esperadas.length)
      recs.forEach((r, i) => {
        const e = esperadas[i]
        expect(r.anio1).toBe(e.anio1)
        expect(r.anio2).toBe(e.anio2)
        expect(r.total).toBeCloseTo(e.total, 9)
        expectCercano(r.componentes, e.componentes, `componentes[${i}]`)
        expect(r.razones.map((x) => formatearRazon(t, x))).toEqual(e.razones)
      })
    })
  })

  it('umbralSugerido y backtests igualan al MVP', () => {
    // Arrange
    const climaTodas = analizarClima(meses, 'todas')

    // Act
    const sugerido = umbralSugerido(climaTodas)

    // Assert
    expect(sugerido).toBeCloseTo(g.umbralSugerido, 9)
    for (const [umbral, esperado] of Object.entries(g.backtests)) {
      expectCercano(backtest(climaTodas, Number(umbral)), esperado, `backtest ${umbral}`)
    }
  })
})
