import { describe, it, expect } from 'vitest'
import { analizarClima, backtest, FieldShiftError } from '../rotacion'
import type { Mes } from '../../types'

const CAMPANIA = [10, 11, 12, 1, 2, 3, 4]

/** Meses completos de las campañas que empiezan en los años dados. */
function mesesDe(inicios: number[], valores: Partial<Mes> = {}): Mes[] {
  const meses: Mes[] = []
  for (const inicio of inicios) {
    for (const mes of CAMPANIA) {
      meses.push({
        anio: mes >= 10 ? inicio : inicio + 1,
        mes,
        lluvia: 20,
        temp: 8,
        tmin: 1,
        humedad: 0.4,
        ...valores,
      })
    }
  }
  return meses
}

function capturar(fn: () => unknown): unknown {
  try {
    fn()
  } catch (e) {
    return e
  }
  return null
}

describe('analizarClima', () => {
  it('lanza CAMPANIAS_INSUFICIENTES con menos de 5 campañas completas', () => {
    // Arrange
    const meses = mesesDe([2001, 2003, 2012, 2013])

    // Act
    const error = capturar(() => analizarClima(meses))

    // Assert
    expect(error).toBeInstanceOf(FieldShiftError)
    expect((error as FieldShiftError).code).toBe('CAMPANIAS_INSUFICIENTES')
  })

  it('lanza ESCENARIO_INSUFICIENTE con menos de 3 campañas del escenario', () => {
    // Arrange: 2002 y 2004 son El Niño; el resto, neutros
    const meses = mesesDe([2001, 2002, 2003, 2004, 2012, 2013])

    // Act
    const error = capturar(() => analizarClima(meses, 'nino'))

    // Assert
    expect(error).toBeInstanceOf(FieldShiftError)
    expect((error as FieldShiftError).code).toBe('ESCENARIO_INSUFICIENTE')
  })

  it('descarta la campaña que tiene un mes nulo', () => {
    // Arrange
    const meses = mesesDe([2001, 2003, 2012, 2013, 2019, 2025])
    const ultimo = meses.findIndex((m) => m.anio === 2026 && m.mes === 1)
    meses[ultimo] = { ...meses[ultimo], humedad: null }

    // Act
    const clima = analizarClima(meses)

    // Assert
    expect(clima.campanias.map((c) => c.inicio)).toEqual([2001, 2003, 2012, 2013, 2019])
  })

  it('asigna oct-dic a la campaña del año y ene-abr a la del año anterior', () => {
    // Arrange
    const meses = mesesDe([2001, 2003, 2012, 2013, 2019], { lluvia: 10 })
    const marcado = meses.findIndex((m) => m.anio === 2002 && m.mes === 3)
    meses[marcado] = { ...meses[marcado], lluvia: 100 }

    // Act
    const clima = analizarClima(meses)

    // Assert
    expect(clima.campanias[0].etiqueta).toBe('2001-02')
    expect(clima.campanias[0].lluvia).toBe(160)
    expect(clima.campanias[1].lluvia).toBe(70)
  })
})

describe('backtest', () => {
  it('paga solo si el índice es estrictamente menor que el umbral', () => {
    // Arrange
    const clima = analizarClima(mesesDe([2001, 2003, 2012, 2013, 2019], { humedad: 0.4 }))

    // Act
    const igual = backtest(clima, 0.4)
    const mayor = backtest(clima, 0.41)

    // Assert
    expect(igual.every((p) => !p.paga)).toBe(true)
    expect(mayor.every((p) => p.paga)).toBe(true)
  })
})
