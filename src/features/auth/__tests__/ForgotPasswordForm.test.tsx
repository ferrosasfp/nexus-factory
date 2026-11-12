import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'es',
}))

// Mock auth actions with controllable fn
const mockResetPassword = vi.fn()

vi.mock('@/actions/auth', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}))

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    mockResetPassword.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  // --- Render Tests ---

  it('renders email field and submit button', () => {
    // Arrange & Act
    render(<ForgotPasswordForm />)

    // Assert
    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sendResetLink' })).toBeInTheDocument()
  })

  // --- Interaction Tests ---

  it('calls resetPassword on submit', async () => {
    // Arrange
    mockResetPassword.mockResolvedValue({ error: 'test' })
    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('email')

    // Act
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'sendResetLink' }))

    // Assert
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(1)
    })

    const formData = mockResetPassword.mock.calls[0][0] as FormData
    expect(formData.get('email')).toBe('user@example.com')
  })

  it('shows success message after reset', async () => {
    // Arrange - return success (no error)
    mockResetPassword.mockResolvedValue({ success: true })
    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('email')

    // Act
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'sendResetLink' }))

    // Assert - form is replaced with success message
    await waitFor(() => {
      expect(screen.getByText('resetLinkSent')).toBeInTheDocument()
    })

    // The form should no longer be visible
    expect(screen.queryByLabelText('email')).not.toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    // Arrange
    mockResetPassword.mockResolvedValue({ error: 'User not found' })
    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText('email')

    // Act
    fireEvent.change(emailInput, { target: { value: 'unknown@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'sendResetLink' }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })

    // Form should still be visible (not replaced by success)
    expect(screen.getByLabelText('email')).toBeInTheDocument()
  })
})
