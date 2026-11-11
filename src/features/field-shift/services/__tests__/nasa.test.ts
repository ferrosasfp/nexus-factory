import { describe, it, expect } from 'vitest'
import { normalizarNasa, urlNasaPower } from '../nasa'

function respuesta(parameter: Record<string, Record<string, number>>): unknown {
  return { properties: { parameter } }
}

describe('normalizarNasa', () => {
  it('convierte -999 en null', () => {
    // Arrange
    const json = respuesta({
      PRECTOTCORR: { '202001': -999 },
      T2M: { '202001': -999 },
      T2M_MIN: { '202001': -999 },
      GWETROOT: { '202001': -999 },
    })

    // Act
    const [mes] = normalizarNasa(json)

    // Assert
    expect(mes).toEqual({ anio: 2020, mes: 1, lluvia: null, temp: null, tmin: null, humedad: null })
  })

  it('ignora el mes 13 (promedio anual)', () => {
    // Arrange
    const json = respuesta({ PRECTOTCORR: { '202001': 1, '202013': 5 } })

    // Act
    const meses = normalizarNasa(json)

    // Assert
    expect(meses).toHaveLength(1)
    expect(meses[0].mes).toBe(1)
  })

  it('multiplica mm/día por los días del mes (feb 2024 = 29)', () => {
    // Arrange
    const json = respuesta({ PRECTOTCORR: { '202402': 2, '202302': 2, '202401': 1 } })

    // Act
    const meses = normalizarNasa(json)

    // Assert
    expect(meses.find((m) => m.anio === 2024 && m.mes === 2)?.lluvia).toBe(58)
    expect(meses.find((m) => m.anio === 2023 && m.mes === 2)?.lluvia).toBe(56)
    expect(meses.find((m) => m.anio === 2024 && m.mes === 1)?.lluvia).toBe(31)
  })

  it('ordena por año y mes', () => {
    // Arrange
    const json = respuesta({ PRECTOTCORR: { '202103': 1, '202012': 1, '202101': 1 } })

    // Act
    const meses = normalizarNasa(json)

    // Assert
    expect(meses.map((m) => [m.anio, m.mes])).toEqual([[2020, 12], [2021, 1], [2021, 3]])
  })

  it('lanza un error con JSON inválido', () => {
    // Arrange & Act & Assert
    expect(() => normalizarNasa({ messages: ['error'] })).toThrow()
    expect(() => normalizarNasa(null)).toThrow()
    expect(() => normalizarNasa(respuesta({ T2M: { '202001': 1 } }))).toThrow()
  })
})

describe('urlNasaPower', () => {
  it('apunta al endpoint mensual por punto con los 4 parámetros', () => {
    // Act
    const url = urlNasaPower(-16.81, -70.69)

    // Assert
    expect(url).toContain('temporal/monthly/point')
    for (const p of ['PRECTOTCORR', 'T2M', 'T2M_MIN', 'GWETROOT']) expect(url).toContain(p)
    expect(url).toContain('latitude=-16.81')
    expect(url).toContain('longitude=-70.69')
    expect(url).toContain('start=2001')
    expect(url).toContain('end=2025')
  })
})
