'use client'

import { useState, useCallback } from 'react'
import { useWalletClient } from 'wagmi'
import { isAAConfigured, getSmartAccountAddress } from '@/shared/lib/web3/aa'
import { getWalletProofMessage, saveSmartAccount } from '@/actions/wallet'
import type { Address } from 'viem'

/**
 * Hook for Smart Account (ERC-4337) operations.
 * Requires Pimlico bundler to be configured (NEXT_PUBLIC_BUNDLER_URL).
 *
 * Does NOT create the account on mount -- the user must call
 * `createSmartAccount()` explicitly to derive and persist the address.
 */
export function useSmartAccount() {
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: walletClient } = useWalletClient()
  const isConfigured = isAAConfigured()

  const createSmartAccount = useCallback(async () => {
    if (!isConfigured) {
      setError('Account Abstraction not configured. Set NEXT_PUBLIC_BUNDLER_URL in .env.local')
      return null
    }

    if (!walletClient) {
      setError('Wallet not connected. Please connect your wallet first.')
      return null
    }

    setIsCreating(true)
    setError(null)

    try {
      const address = await getSmartAccountAddress(walletClient)
      setSmartAccountAddress(address)

      // Persist the derived address: the owner wallet signs a proof bound to this account
      const proofRequest = await getWalletProofMessage(address, 'link-smart-account')
      if ('error' in proofRequest) {
        setError(`Smart account derived but failed to save: ${proofRequest.error}`)
        return address
      }
      const signature = await walletClient.signMessage({
        account: walletClient.account,
        message: proofRequest.message,
      })
      const result = await saveSmartAccount({ address, issuedAt: proofRequest.issuedAt, signature })
      if ('error' in result) {
        // Address was derived successfully but persistence failed.
        // We still show the address and surface the save error.
        setError(`Smart account derived but failed to save: ${result.error}`)
      }

      return address
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create smart account'
      setError(message)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [isConfigured, walletClient])

  return {
    smartAccountAddress,
    isCreating,
    isConfigured,
    isWip: true,
    error,
    createSmartAccount,
  }
}
