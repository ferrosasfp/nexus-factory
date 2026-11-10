import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { supportedChains, getRpcUrl } from './chains'

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected(), // MetaMask, Core, etc.
  ],
  // One transport per chain, each with its own RPC (never a testnet RPC for mainnet)
  transports: Object.fromEntries(
    supportedChains.map((chain) => [chain.id, http(getRpcUrl(chain.id))])
  ) as Record<number, ReturnType<typeof http>>,
})
