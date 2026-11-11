import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PolizaFuji } from '../PolizaFuji'

const estado = vi.hoisted(() => ({
  wallet: { isConnected: false, chain: undefined as { id: number } | undefined },
  contrato: null as string | null,
  comprar: vi.fn(),
  reclamar: vi.fn(),
  switchToDefault: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (k: string, p?: Record<string, string>) => (p ? k + JSON.stringify(p) : k),
}))

vi.mock('@/features/wallet/hooks/useWallet', () => ({
  useWallet: () => estado.wallet,
}))

vi.mock('@/features/wallet/hooks/useNetwork', () => ({
  useNetwork: () => ({ switchToDefault: estado.switchToDefault }),
}))

vi.mock('@/features/wallet/components', () => ({
  ConnectWallet: () => <button type="button">connect-wallet</button>,
}))

vi.mock('../../hooks/usePoliza', () => ({
  usePoliza: () => ({
    zona: {
      nombre: 'Carumas',
      umbral: 0.45,
      indice: 0,
      cobertura: '0.05',
      primaBase: '0.01',
      reportada: false,
      disparada: false,
    },
    primas: { conRotacion: '0.008', sinRotacion: '0.01' },
    tienePoliza: false,
    hash: null,
    pendiente: false,
    error: null,
    comprar: estado.comprar,
    reclamar: estado.reclamar,
  }),
}))

vi.mock('../../services/config', () => ({
  get FIELD_SHIFT_CONTRACT() {
    return estado.contrato
  },
  FIELD_SHIFT_ZONE_ID: 0n,
}))

const CONTRATO = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'

describe('PolizaFuji', () => {
  beforeEach(() => {
    estado.wallet = { isConnected: false, chain: undefined }
    estado.contrato = CONTRATO
    estado.comprar.mockReset()
    estado.reclamar.mockReset()
    estado.switchToDefault.mockReset()
  })

  it('sin wallet muestra solo el texto opcional y ConnectWallet', () => {
    // Arrange & Act
    render(<PolizaFuji />)

    // Assert
    expect(screen.getByText('poliza.opcional')).toBeInTheDocument()
    expect(screen.getByText('connect-wallet')).toBeInTheDocument()
    expect(screen.queryByTestId('fs-poliza')).not.toBeInTheDocument()
  })

  it('en otra red muestra el aviso y el botón para cambiar a Fuji', () => {
    // Arrange
    estado.wallet = { isConnected: true, chain: { id: 43114 } }
    render(<PolizaFuji />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'poliza.cambiarRed' }))

    // Assert
    expect(screen.getByText('poliza.redIncorrecta')).toBeInTheDocument()
    expect(estado.switchToDefault).toHaveBeenCalled()
    expect(screen.queryByTestId('fs-poliza')).not.toBeInTheDocument()
  })

  it('sin contrato configurado no muestra el bloque', () => {
    // Arrange
    estado.wallet = { isConnected: true, chain: { id: 43113 } }
    estado.contrato = null

    // Act
    render(<PolizaFuji />)

    // Assert
    expect(screen.queryByTestId('fs-poliza')).not.toBeInTheDocument()
  })

  it('en Fuji con contrato muestra el bloque con el aviso de no auditado', () => {
    // Arrange
    estado.wallet = { isConnected: true, chain: { id: 43113 } }

    // Act
    render(<PolizaFuji />)

    // Assert
    expect(screen.getByTestId('fs-poliza')).toBeInTheDocument()
    expect(screen.getByText('poliza.avisoNoAuditado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'poliza.comprar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'poliza.reclamar' })).toBeInTheDocument()
  })

  it('Comprar muestra el resumen y solo Confirmar llama a comprar(true)', () => {
    // Arrange
    estado.wallet = { isConnected: true, chain: { id: 43113 } }
    render(<PolizaFuji />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'poliza.comprar' }))

    // Assert: resumen previo, sin firmar todavía
    expect(screen.getByTestId('fs-poliza-resumen').textContent).toContain(
      'poliza.resumenCompra{"monto":"0.008","zona":"Carumas"}',
    )
    expect(estado.comprar).not.toHaveBeenCalled()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'poliza.confirmar' }))

    // Assert
    expect(estado.comprar).toHaveBeenCalledWith(true)
  })
})
