import { avalanche, avalancheFuji } from 'viem/chains'
import type { Chain } from 'viem'

/**
 * EVM Chain Registry
 * Avalanche is the default. To add a new chain:
 * 1. Import it from 'viem/chains'
 * 2. Add it to supportedChains (chainIdSchema in validation.ts derives from this list)
 * 3. Optional: add a custom RPC to RPC_URLS; otherwise the chain's public RPC is used
 *
 * Example: import { polygon, polygonAmoy } from 'viem/chains'
 */

export const supportedChains: readonly [Chain, ...Chain[]] = [
  avalancheFuji,
  avalanche,
  // polygon,
  // polygonAmoy,
  // base,
  // baseSepolia,
  // mainnet,
  // sepolia,
]

export const defaultChain = avalancheFuji

/**
 * Custom RPC per chain id. NEXT_PUBLIC_* must be read with literal names so
 * Next.js can inline them in the client bundle.
 */
const RPC_URLS: Partial<Record<number, string>> = {
  [avalancheFuji.id]: process.env.NEXT_PUBLIC_RPC_TESTNET,
  [avalanche.id]: process.env.NEXT_PUBLIC_RPC_MAINNET,
}

/** Custom RPC for the chain, or undefined to use the chain's default public RPC. */
export function getRpcUrl(chainId: number): string | undefined {
  return RPC_URLS[chainId] || undefined
}

export function getChainById(chainId: number): Chain | undefined {
  return supportedChains.find((chain) => chain.id === chainId)
}

export const testnetChains = supportedChains.filter((chain) =>
  chain.testnet === true
)

export const mainnetChains = supportedChains.filter((chain) =>
  chain.testnet !== true
)
