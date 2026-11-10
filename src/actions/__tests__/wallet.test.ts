import { describe, it, expect, vi, beforeEach } from 'vitest'
import { privateKeyToAccount } from 'viem/accounts'

// ---------------------------------------------------------------------------
// Mocks - declared before imports so hoisting works correctly
// ---------------------------------------------------------------------------

// User client (RLS): auth + reading the caller's own profile
const mockUserSingle = vi.fn()
const mockUserSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockUserSingle })) })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockUserSupabase)),
}))

// Admin client (service role): duplicate check + privileged write
const mockAdminMaybeSingle = vi.fn()
const mockAdminUpdate = vi.fn()
const mockAdminUpdateEq = vi.fn()
const mockAdminSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ neq: vi.fn(() => ({ maybeSingle: mockAdminMaybeSingle })) })),
    })),
    update: (values: Record<string, unknown>) => {
      mockAdminUpdate(values)
      return { eq: mockAdminUpdateEq }
    },
  })),
}
const mockCreateAdminClient = vi.fn<() => typeof mockAdminSupabase | null>(() => mockAdminSupabase)

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}))

// ---------------------------------------------------------------------------
// Imports under test (after mocks)
// ---------------------------------------------------------------------------

import {
  getWalletProofMessage,
  linkWallet,
  unlinkWallet,
  saveSmartAccount,
  getWalletInfo,
} from '../wallet'

// ---------------------------------------------------------------------------
// Constants (well-known local test keys — never hold real funds)
// ---------------------------------------------------------------------------

const USER_ID = 'user-abc-123'
const owner = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
const attacker = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
const SMART_ACCOUNT = '0x742d35cc6634c0532925a3b844bc9e7595f2bd18'

async function signedProof(
  address: string,
  purpose: 'link-wallet' | 'link-smart-account',
  signer = owner,
) {
  const request = await getWalletProofMessage(address, purpose)
  if ('error' in request) throw new Error(request.error)
  const signature = await signer.signMessage({ message: request.message })
  return { address, issuedAt: request.issuedAt, signature }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wallet Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    mockUserSingle.mockResolvedValue({ data: { wallet_address: owner.address.toLowerCase() }, error: null })
    mockAdminMaybeSingle.mockResolvedValue({ data: null })
    mockAdminUpdateEq.mockResolvedValue({ error: null })
    mockCreateAdminClient.mockReturnValue(mockAdminSupabase)
  })

  describe('getWalletProofMessage', () => {
    it('should bind the message to the user and the address', async () => {
      // Act
      const result = await getWalletProofMessage(owner.address, 'link-wallet')

      // Assert
      expect('message' in result && result.message).toContain(USER_ID)
      expect('message' in result && result.message).toContain(owner.address.toLowerCase())
    })

    it('should reject an invalid address', async () => {
      // Act
      const result = await getWalletProofMessage('0x123', 'link-wallet')

      // Assert
      expect(result).toEqual({ error: 'Invalid Ethereum address' })
    })
  })

  describe('linkWallet', () => {
    it('should link the wallet when the signature matches', async () => {
      // Arrange
      const proof = await signedProof(owner.address, 'link-wallet')

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockAdminUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ wallet_address: owner.address.toLowerCase() }),
      )
    })

    it('should reject a signature from another wallet', async () => {
      // Arrange: attacker signs a proof claiming the owner's address
      const proof = await signedProof(owner.address, 'link-wallet', attacker)

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ error: 'Invalid or expired wallet signature' })
      expect(mockAdminUpdate).not.toHaveBeenCalled()
    })

    it('should reject an expired proof', async () => {
      // Arrange
      const proof = await signedProof(owner.address, 'link-wallet')
      const expired = { ...proof, issuedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }

      // Act
      const result = await linkWallet(expired)

      // Assert
      expect(result).toEqual({ error: 'Invalid or expired wallet signature' })
    })

    it('should reject a proof signed for another user', async () => {
      // Arrange: proof created while logged in as someone else
      mockUserSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'other-user' } } })
      const proof = await signedProof(owner.address, 'link-wallet')

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ error: 'Invalid or expired wallet signature' })
    })

    it('should return error when not authenticated', async () => {
      // Arrange
      const proof = await signedProof(owner.address, 'link-wallet')
      mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
    })

    it('should reject a wallet linked to another account', async () => {
      // Arrange
      const proof = await signedProof(owner.address, 'link-wallet')
      mockAdminMaybeSingle.mockResolvedValue({ data: { id: 'another-user' } })

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ error: 'This address is already linked to another account' })
      expect(mockAdminUpdate).not.toHaveBeenCalled()
    })

    it('should fail clearly when the service role key is missing', async () => {
      // Arrange
      const proof = await signedProof(owner.address, 'link-wallet')
      mockCreateAdminClient.mockReturnValue(null)

      // Act
      const result = await linkWallet(proof)

      // Assert
      expect(result).toEqual({ error: expect.stringContaining('SUPABASE_SERVICE_ROLE_KEY') })
    })
  })

  describe('unlinkWallet', () => {
    it('should clear the wallet address', async () => {
      // Act
      const result = await unlinkWallet()

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockAdminUpdate).toHaveBeenCalledWith(expect.objectContaining({ wallet_address: null }))
    })

    it('should return error when not authenticated', async () => {
      // Arrange
      mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act
      const result = await unlinkWallet()

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
    })
  })

  describe('saveSmartAccount', () => {
    it('should save when the linked owner wallet signs', async () => {
      // Arrange
      const proof = await signedProof(SMART_ACCOUNT, 'link-smart-account')

      // Act
      const result = await saveSmartAccount(proof)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockAdminUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ smart_account_address: SMART_ACCOUNT }),
      )
    })

    it('should require a linked wallet first', async () => {
      // Arrange
      const proof = await signedProof(SMART_ACCOUNT, 'link-smart-account')
      mockUserSingle.mockResolvedValue({ data: { wallet_address: null }, error: null })

      // Act
      const result = await saveSmartAccount(proof)

      // Assert
      expect(result).toEqual({ error: 'Link your wallet before saving a smart account' })
    })

    it('should reject a signature that is not from the linked wallet', async () => {
      // Arrange
      const proof = await signedProof(SMART_ACCOUNT, 'link-smart-account', attacker)

      // Act
      const result = await saveSmartAccount(proof)

      // Assert
      expect(result).toEqual({ error: 'Invalid or expired wallet signature' })
      expect(mockAdminUpdate).not.toHaveBeenCalled()
    })
  })

  describe('getWalletInfo', () => {
    it('should return the stored addresses', async () => {
      // Arrange
      mockUserSingle.mockResolvedValue({
        data: { wallet_address: owner.address.toLowerCase(), smart_account_address: SMART_ACCOUNT },
        error: null,
      })

      // Act
      const result = await getWalletInfo()

      // Assert
      expect(result).toEqual({
        walletAddress: owner.address.toLowerCase(),
        smartAccountAddress: SMART_ACCOUNT,
      })
    })

    it('should return error when not authenticated', async () => {
      // Arrange
      mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      // Act
      const result = await getWalletInfo()

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
    })
  })
})
