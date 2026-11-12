/**
 * Configuration for what files/dirs to include per mode.
 */

// Dirs and files to EXCLUDE when mode is "web2"
export const HYBRID_ONLY = [
  'contracts/',
  'scripts/sync-abi.mjs',
  'src/features/wallet/',
  'src/features/contracts/',
  'src/features/transactions/',
  'src/features/storage/',
  'src/shared/lib/web3/',
  'src/shared/providers/Web3Provider.tsx',
  'src/actions/wallet.ts',
  'src/actions/storage.ts',
  'src/app/[locale]/(main)/wallet/',
  'src/app/[locale]/(main)/contracts/',
  'src/app/[locale]/(main)/storage/',
  'supabase/migrations/00000000000002_wallet_addresses.sql',
  'supabase/migrations/00000000000003_wallet_constraints.sql',
  'supabase/migrations/00000000000005_hybrid_hardening.sql',
]

// Dependencies to remove from package.json when mode is "web2"
export const HYBRID_DEPS = [
  'wagmi',
  'viem',
  '@tanstack/react-query',
  'permissionless',
]

// Scripts to remove from package.json when mode is "web2"
export const HYBRID_SCRIPTS = [
  'contracts:build',
  'contracts:test',
  'contracts:slither',
  'contracts:sync-abi',
  'contracts:deploy:fuji',
  'qa:hybrid',
]

// Env vars for Web2 mode
export const WEB2_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL=',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=',
  'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
  'NEXT_PUBLIC_DEFAULT_LOCALE=en',
]

// Chain configs
export const CHAINS = {
  avalanche: {
    name: 'Avalanche',
    rpcMainnet: 'https://api.avax.network/ext/bc/C/rpc',
    rpcTestnet: 'https://api.avax-test.network/ext/bc/C/rpc',
  },
  polygon: {
    name: 'Polygon',
    rpcMainnet: 'https://polygon-rpc.com',
    rpcTestnet: 'https://rpc-amoy.polygon.technology',
  },
  base: {
    name: 'Base',
    rpcMainnet: 'https://mainnet.base.org',
    rpcTestnet: 'https://sepolia.base.org',
  },
  ethereum: {
    name: 'Ethereum',
    rpcMainnet: 'https://eth.llamarpc.com',
    rpcTestnet: 'https://rpc.sepolia.org',
  },
}

// .claude/commands/ to exclude from scaffold (factory-internal)
export const CLAUDE_COMMANDS_EXCLUDE = ['eject-sf.md', 'update-sf.md']

// .claude/agents/ only for hybrid mode
export const CLAUDE_AGENTS_HYBRID_ONLY = ['solidity-specialist.md', 'web3-specialist.md']

// .agent/workflows/ to exclude from scaffold (factory-internal)
export const AGENT_WORKFLOWS_EXCLUDE = ['eject-sf.md', 'update-sf.md']
