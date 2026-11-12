import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks - declared before imports so hoisting works correctly
// ---------------------------------------------------------------------------

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => 'http://localhost:3000'),
    }),
  ),
}))

vi.mock('@/i18n/routing', () => ({
  locales: ['en', 'es'] as const,
}))

const mockUpdateEq = vi.fn(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
  from: vi.fn(() => ({
    update: mockUpdate,
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// ---------------------------------------------------------------------------
// Imports under test (after mocks)
// ---------------------------------------------------------------------------

import {
  login,
  signup,
  signout,
  resetPassword,
  updatePassword,
  updateProfile,
  signInWithGoogle,
} from '../auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return formData
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // login
  // =========================================================================
  describe('login', () => {
    it('should return error for invalid email', async () => {
      // Arrange
      const formData = createFormData({
        email: 'not-an-email',
        password: 'password123',
        locale: 'en',
      })

      // Act
      const result = await login(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid email address' })
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should return error for short password', async () => {
      // Arrange
      const formData = createFormData({
        email: 'user@example.com',
        password: '12345',
        locale: 'en',
      })

      // Act
      const result = await login(formData)

      // Assert
      expect(result).toEqual({ error: 'Password must be at least 6 characters' })
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should return error for invalid locale', async () => {
      // Arrange
      const formData = createFormData({
        email: 'user@example.com',
        password: 'password123',
        locale: 'fr',
      })

      // Act
      const result = await login(formData)

      // Assert
      expect(result).toBeDefined()
      expect(result?.error).toBeDefined()
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should call signInWithPassword with valid data and redirect', async () => {
      // Arrange
      const formData = createFormData({
        email: 'user@example.com',
        password: 'password123',
        locale: 'en',
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      // Act
      await login(formData)

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/en/dashboard')
    })

    it('should return error when signInWithPassword fails', async () => {
      // Arrange
      const formData = createFormData({
        email: 'user@example.com',
        password: 'password123',
        locale: 'en',
      })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      })

      // Act
      const result = await login(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // signup
  // =========================================================================
  describe('signup', () => {
    it('should return error for invalid email', async () => {
      // Arrange
      const formData = createFormData({
        email: 'bad-email',
        password: 'password123',
        locale: 'en',
      })

      // Act
      const result = await signup(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid email address' })
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should call signUp with valid credentials and redirect to check-email', async () => {
      // Arrange
      const formData = createFormData({
        email: 'newuser@example.com',
        password: 'securepass',
        locale: 'es',
      })
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      // Act
      await signup(formData)

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'securepass',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/es/check-email')
    })

    it('should return error when signUp fails', async () => {
      // Arrange
      const formData = createFormData({
        email: 'existing@example.com',
        password: 'password123',
        locale: 'en',
      })
      mockSupabase.auth.signUp.mockResolvedValue({
        error: { message: 'User already registered' },
      })

      // Act
      const result = await signup(formData)

      // Assert
      expect(result).toEqual({ error: 'User already registered' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // signout
  // =========================================================================
  describe('signout', () => {
    it('should validate locale, sign out, and redirect to login', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      // Act
      await signout('es')

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/es/login')
    })

    it('should return error for invalid locale', async () => {
      // Arrange & Act
      const result = await signout('../../evil')

      // Assert
      expect(result).toEqual({ error: 'Invalid locale' })
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // resetPassword
  // =========================================================================
  describe('resetPassword', () => {
    it('should send the recovery link through the locale callback', async () => {
      // Arrange
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
      const formData = new FormData()
      formData.set('email', 'user@example.com')
      formData.set('locale', 'es')

      // Act
      await resetPassword(formData)

      // Assert
      const [, options] = mockSupabase.auth.resetPasswordForEmail.mock.calls[0] as [string, { redirectTo: string }]
      expect(options.redirectTo).toMatch(/\/es\/callback\?next=%2Fes%2Fupdate-password$/)
    })

    it('should return error for invalid email', async () => {
      // Arrange
      const formData = createFormData({ email: 'not-valid' })

      // Act
      const result = await resetPassword(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid email address' })
      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should return success for valid email', async () => {
      // Arrange
      const formData = createFormData({ email: 'user@example.com' })
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      // Act
      const result = await resetPassword(formData)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({ redirectTo: expect.any(String) }),
      )
    })
  })

  // =========================================================================
  // updatePassword
  // =========================================================================
  describe('updatePassword', () => {
    it('should return error for short password', async () => {
      // Arrange
      const formData = createFormData({ password: '12345', locale: 'en' })

      // Act
      const result = await updatePassword(formData)

      // Assert
      expect(result).toEqual({ error: 'Password must be at least 6 characters' })
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
    })

    it('should update password and redirect on success', async () => {
      // Arrange
      const formData = createFormData({ password: 'newSecure123', locale: 'en' })
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

      // Act
      await updatePassword(formData)

      // Assert
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newSecure123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/en/dashboard')
    })

    it('should return error when updateUser fails', async () => {
      // Arrange
      const formData = createFormData({ password: 'newpass123', locale: 'en' })
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Session expired' },
      })

      // Act
      const result = await updatePassword(formData)

      // Assert
      expect(result).toEqual({ error: 'Session expired' })
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // updateProfile
  // =========================================================================
  describe('updateProfile', () => {
    it('should return error when not authenticated', async () => {
      // Arrange
      const formData = createFormData({ full_name: 'John Doe' })
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      // Act
      const result = await updateProfile(formData)

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
    })

    it('should return error for short full_name', async () => {
      // Arrange
      const formData = createFormData({ full_name: 'J' })

      // Act
      const result = await updateProfile(formData)

      // Assert
      expect(result).toEqual({ error: 'Full name must be at least 2 characters' })
    })

    it('should update profile for valid data', async () => {
      // Arrange
      const formData = createFormData({ full_name: 'Jane Doe' })
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      mockUpdateEq.mockResolvedValue({ error: null })

      // Act
      const result = await updateProfile(formData)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'Jane Doe' }),
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-123')
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(result).toEqual({ success: true })
    })

    it('should return error when profile update fails', async () => {
      // Arrange
      const formData = createFormData({ full_name: 'Jane Doe' })
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      mockUpdateEq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      // Act
      const result = await updateProfile(formData)

      // Assert
      expect(result).toEqual({ error: 'Database error' })
    })
  })

  // =========================================================================
  // signInWithGoogle
  // =========================================================================
  describe('signInWithGoogle', () => {
    it('should return error for invalid locale', async () => {
      // Arrange & Act
      const result = await signInWithGoogle('invalid')

      // Assert
      expect(result).toEqual({ error: 'Invalid locale' })
      expect(mockSupabase.auth.signInWithOAuth).not.toHaveBeenCalled()
    })

    it('should call signInWithOAuth and redirect for valid locale', async () => {
      // Arrange
      const oauthUrl = 'https://accounts.google.com/o/oauth2/auth?...'
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: oauthUrl },
        error: null,
      })

      // Act
      await signInWithGoogle('en')

      // Assert
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/en/callback',
        },
      })
      expect(redirect).toHaveBeenCalledWith(oauthUrl)
    })

    it('should return error when signInWithOAuth fails', async () => {
      // Arrange
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: { message: 'OAuth provider error' },
      })

      // Act
      const result = await signInWithGoogle('en')

      // Assert
      expect(result).toEqual({ error: 'OAuth provider error' })
    })

    it('should return error when no OAuth URL is returned', async () => {
      // Arrange
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      })

      // Act
      const result = await signInWithGoogle('en')

      // Assert
      expect(result).toEqual({ error: 'Failed to get OAuth URL' })
    })
  })
})
