import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import golden from '../../services/__tests__/fixtures/golden.json'
import { FieldShiftDemo } from '../FieldShiftDemo'

vi.mock('next-intl', () => ({
  useTranslations: () => (k: string, p?: Record<string, string>) => (p ? k + JSON.stringify(p) : k),
}))

vi.mock('../PolizaFuji', () => ({
  PolizaFuji: () => null,
}))

const RESPUESTA = { zona: 'carumas', origen: 'offline', meses: golden.zonas.carumas.meses }

type RotacionGolden = { anio1: string; anio2: string }
const recsGolden = (escenario: 'todas' | 'nino', preset: string): RotacionGolden[] => {
  const e = golden.zonas.carumas.escenarios[escenario] as { recomendaciones: Record<string, RotacionGolden[]> }
  return e.recomendaciones[preset]
}

const titulos = () => screen.getAllByTestId('fs-rotacion-titulo').map((el) => el.textContent ?? '')
const par = (r: RotacionGolden) => `"a":"cultivos.${r.anio1}","b":"cultivos.${r.anio2}"`

async function consultar() {
  fireEvent.click(screen.getByTestId('fs-consultar'))
  await screen.findAllByTestId('fs-tarjeta')
}

describe('FieldShiftDemo', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(JSON.stringify(RESPUESTA), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra las 6 tarjetas y el origen al consultar', async () => {
    // Arrange
    render(<FieldShiftDemo />)

    // Act
    await consultar()

    // Assert
    expect(screen.getAllByTestId('fs-tarjeta')).toHaveLength(6)
    expect(fetchMock).toHaveBeenCalledWith('/api/field-shift/nasa?zona=carumas')
    expect(screen.getByTestId('fs-estado').textContent).toContain('origen.offline')
    expect(screen.getAllByTestId('fs-rotacion')).toHaveLength(3)
  })

  it('recalcula el top 1 al cambiar el escenario a El Niño', async () => {
    // Arrange
    render(<FieldShiftDemo />)
    await consultar()
    expect(titulos()[0]).toContain(par(recsGolden('todas', 'default')[0]))

    // Act
    fireEvent.change(screen.getByTestId('fs-escenario'), { target: { value: 'nino' } })

    // Assert
    expect(titulos()[0]).toContain(par(recsGolden('nino', 'default')[0]))
    expect(titulos()[0]).toContain('"a":"cultivos.papa","b":"cultivos.haba"')
  })

  it('recalcula el ranking al mover los sliders de prioridad', async () => {
    // Arrange
    render(<FieldShiftDemo />)
    await consultar()
    const antes = titulos()

    // Act: llevar las prioridades al preset soloSuelo { 0, 0, 3, 0 }
    fireEvent.change(screen.getByTestId('fs-prioridad-comida'), { target: { value: '0' } })
    fireEvent.change(screen.getByTestId('fs-prioridad-ingreso'), { target: { value: '0' } })
    fireEvent.change(screen.getByTestId('fs-prioridad-suelo'), { target: { value: '3' } })
    fireEvent.change(screen.getByTestId('fs-prioridad-clima'), { target: { value: '0' } })

    // Assert
    const despues = titulos()
    expect(despues).not.toEqual(antes)
    recsGolden('todas', 'soloSuelo').forEach((r, i) => expect(despues[i]).toContain(par(r)))
    expect(screen.getByTestId('fs-prioridad-valor-suelo').textContent).toBe('3')
  })

  it('cambia el resumen del backtest al mover el umbral', async () => {
    // Arrange
    render(<FieldShiftDemo />)
    await consultar()
    const antes = screen.getByTestId('fs-backtest-resumen').textContent

    // Act
    fireEvent.change(screen.getByTestId('fs-umbral'), { target: { value: '0.6' } })

    // Assert
    const despues = screen.getByTestId('fs-backtest-resumen').textContent
    expect(despues).not.toBe(antes)
    expect(despues).toContain('"pagos":"24"')
    expect(screen.getByTestId('fs-umbral-valor').textContent).toBe('0.600')
  })

  it('muestra el error si falla la consulta', async () => {
    // Arrange
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<FieldShiftDemo />)

    // Act
    fireEvent.click(screen.getByTestId('fs-consultar'))

    // Assert
    expect(await screen.findByText('errorDatos')).toBeInTheDocument()
    expect(screen.queryAllByTestId('fs-tarjeta')).toHaveLength(0)
  })
})
