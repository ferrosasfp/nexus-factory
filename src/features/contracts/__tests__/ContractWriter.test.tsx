import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContractWriter } from '../components/ContractWriter'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock useContractWrite hook
const mockWrite = vi.fn()
vi.mock('../hooks/useContractWrite', () => ({
  useContractWrite: () => ({
    hash: null,
    isLoading: false,
    error: null,
    write: mockWrite,
  }),
}))

describe('ContractWriter', () => {
  beforeEach(() => {
    mockWrite.mockClear()
  })

  it('should render form with address, function name, and args inputs', () => {
    // Arrange & Act
    render(<ContractWriter />)

    // Assert
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(3)

    // Check placeholders to identify each input
    expect(screen.getByPlaceholderText('address')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Function name (e.g. mint)')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Arguments as JSON (e.g. ["0x...", 100])')
    ).toBeInTheDocument()
  })

  it('should render submit button', () => {
    // Arrange & Act
    render(<ContractWriter />)

    // Assert
    const button = screen.getByRole('button', { name: 'write' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should disable submit when address is empty', () => {
    // Arrange & Act
    render(<ContractWriter />)

    // Assert
    const button = screen.getByRole('button', { name: 'write' })
    expect(button).toBeDisabled()
  })

  it('should disable submit when functionName is empty', () => {
    // Arrange
    render(<ContractWriter address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" />)

    // Act - address is pre-filled but functionName is still empty
    const button = screen.getByRole('button', { name: 'write' })

    // Assert
    expect(button).toBeDisabled()
  })

  it('should show parse error when invalid JSON is submitted', () => {
    // Arrange
    render(<ContractWriter address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" />)

    // Fill in required fields
    const functionNameInput = screen.getByPlaceholderText(
      'Function name (e.g. mint)'
    )
    const argsInput = screen.getByPlaceholderText(
      'Arguments as JSON (e.g. ["0x...", 100])'
    )

    // Act
    fireEvent.change(functionNameInput, { target: { value: 'mint' } })
    fireEvent.change(argsInput, { target: { value: 'not valid json {{{' } })

    // Submit the form
    const form = screen.getByRole('button', { name: 'write' }).closest('form')!
    fireEvent.submit(form)

    // Assert
    expect(screen.getByText('invalidJson')).toBeInTheDocument()
    expect(mockWrite).not.toHaveBeenCalled()
  })
})
