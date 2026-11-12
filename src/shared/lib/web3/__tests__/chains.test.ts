import { vi, describe, it, expect } from 'vitest'
import { avalanche, avalancheFuji } from 'viem/chains'
import {
  supportedChains,
  defaultChain,
  getChainById,
  testnetChains,
  mainnetChains,
} from '../chains'

describe('Web3 Chains', () => {
  describe('supportedChains', () => {
    it('should contain exactly 2 chains', () => {
      // Arrange & Act (static export)
      const count = supportedChains.length

      // Assert
      expect(count).toBe(2)
    })
  })

  describe('defaultChain', () => {
    it('should be avalancheFuji', () => {
      // Assert
      expect(defaultChain).toBe(avalancheFuji)
      expect(defaultChain.id).toBe(43113)
    })
  })

  describe('getChainById', () => {
    it('should return avalanche for chainId 43114', () => {
      // Act
      const chain = getChainById(43114)

      // Assert
      expect(chain).toBeDefined()
      expect(chain).toBe(avalanche)
      expect(chain!.id).toBe(43114)
    })

    it('should return avalancheFuji for chainId 43113', () => {
      // Act
      const chain = getChainById(43113)

      // Assert
      expect(chain).toBeDefined()
      expect(chain).toBe(avalancheFuji)
      expect(chain!.id).toBe(43113)
    })

    it('should return undefined for unknown chainId', () => {
      // Act
      const chain = getChainById(99999)

      // Assert
      expect(chain).toBeUndefined()
    })
  })

  describe('testnetChains', () => {
    it('should contain only testnet chains', () => {
      // Assert
      expect(testnetChains.length).toBeGreaterThan(0)
      testnetChains.forEach((chain) => {
        expect(chain.testnet).toBe(true)
      })
    })

    it('should include avalancheFuji', () => {
      // Assert
      expect(testnetChains.some((c) => c.id === avalancheFuji.id)).toBe(true)
    })
  })

  describe('mainnetChains', () => {
    it('should contain only mainnet chains', () => {
      // Assert
      expect(mainnetChains.length).toBeGreaterThan(0)
      mainnetChains.forEach((chain) => {
        expect(chain.testnet).not.toBe(true)
      })
    })

    it('should include avalanche', () => {
      // Assert
      expect(mainnetChains.some((c) => c.id === avalanche.id)).toBe(true)
    })
  })

  describe('testnetChains + mainnetChains', () => {
    it('should equal total supportedChains length when combined', () => {
      // Act
      const combinedLength = testnetChains.length + mainnetChains.length

      // Assert
      expect(combinedLength).toBe(supportedChains.length)
    })
  })
})

describe('getRpcUrl', () => {
  it('should never reuse the testnet RPC for mainnet', async () => {
    // Arrange
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_RPC_TESTNET', 'https://fuji.example')
    vi.stubEnv('NEXT_PUBLIC_RPC_MAINNET', '')
    const { getRpcUrl: freshGetRpcUrl } = await import('../chains')

    // Act & Assert
    expect(freshGetRpcUrl(avalancheFuji.id)).toBe('https://fuji.example')
    expect(freshGetRpcUrl(avalanche.id)).toBeUndefined()
    vi.unstubAllEnvs()
  })
})
