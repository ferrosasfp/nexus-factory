import { describe, it, expect } from 'vitest'
import { fase } from '../enso'

describe('fase', () => {
  it.each([
    [2015, 'nino'],
    [2022, 'nina'],
    [2019, 'neutro'],
  ])('fase(%i) = %s', (anio, esperado) => {
    // Act
    const resultado = fase(anio)

    // Assert
    expect(resultado).toBe(esperado)
  })
})
