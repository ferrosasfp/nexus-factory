#!/usr/bin/env node

/**
 * ABI Sync Script
 * Copies compiled contract ABIs from contracts/out/ to src/features/contracts/abi/
 *
 * Usage: node scripts/sync-abi.mjs
 *
 * Run after `forge build` to keep frontend ABIs in sync with contracts.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

const CONTRACTS_OUT = resolve(process.cwd(), 'contracts/out')
const ABI_DIR = resolve(process.cwd(), 'src/features/contracts/abi')

/** Source path of the artifact relative to contracts/ (e.g. "src/SampleToken.sol"). */
function sourcePath(artifact) {
  const fromAst = artifact.ast?.absolutePath
  if (fromAst) return fromAst.replace(/\\/g, '/')
  const target = Object.keys(artifact.metadata?.settings?.compilationTarget ?? {})[0]
  return (target ?? '').replace(/\\/g, '/')
}

/** SampleToken -> sampleToken */
function camelName(name) {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

function main() {
  if (!existsSync(CONTRACTS_OUT)) {
    console.error('  contracts/out/ not found. Run `forge build` first.')
    process.exit(1)
  }

  // Ensure target dir exists
  if (!existsSync(ABI_DIR)) {
    mkdirSync(ABI_DIR, { recursive: true })
  }

  const contractDirs = readdirSync(CONTRACTS_OUT).filter(d =>
    d.endsWith('.sol') && !d.startsWith('.')
  )

  let synced = 0

  for (const dir of contractDirs) {
    const contractDir = join(CONTRACTS_OUT, dir)
    const jsonFiles = readdirSync(contractDir).filter(f => f.endsWith('.json') && !f.includes('.dbg.'))

    for (const jsonFile of jsonFiles) {
      const contractName = jsonFile.replace('.json', '')
      const fullPath = join(contractDir, jsonFile)
      const artifact = JSON.parse(readFileSync(fullPath, 'utf-8'))

      if (!artifact.abi) continue
      // Only the project's own contracts (src/), not forge-std/OpenZeppelin/tests/scripts.
      // Forge omits `ast` unless enabled, so fall back to the metadata compilation target.
      if (!sourcePath(artifact).startsWith('src/')) continue

      const abiContent = JSON.stringify(artifact.abi, null, 2)
      const targetPath = join(ABI_DIR, `${contractName}.json`)

      writeFileSync(targetPath, abiContent)
      writeFileSync(
        join(ABI_DIR, `${contractName}.ts`),
        `// Generado por scripts/sync-abi.mjs. No editar.\nexport const ${camelName(contractName)}Abi = ${abiContent} as const\n`
      )
      console.log(`  ✓ ${contractName}.json + ${contractName}.ts`)
      synced++
    }
  }

  if (synced === 0) {
    console.log('  No ABIs found. Make sure contracts compile successfully.')
  } else {
    console.log(`\n  Synced ${synced} ABI(s) to src/features/contracts/abi/`)
  }
}

main()
