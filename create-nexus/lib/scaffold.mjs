import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve, dirname, basename } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import {
  HYBRID_ONLY, HYBRID_DEPS, HYBRID_SCRIPTS,
  CLAUDE_COMMANDS_EXCLUDE, CLAUDE_AGENTS_HYBRID_ONLY, AGENT_WORKFLOWS_EXCLUDE,
} from './config.mjs'
import { generateClaudeMd, generateGeminiMd } from './ai-docs.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─── Helpers ─────────────────────────────────────────────────────────

function readJson(filePath) {
  if (!existsSync(filePath)) {
    console.error('  Error: Archivo no encontrado: ' + filePath)
    process.exit(1)
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error('  Error: JSON invalido en ' + filePath)
    console.error('  ' + err.message)
    process.exit(1)
  }
}

function writeJson(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
  } catch (err) {
    console.error('  Error: No se pudo escribir ' + filePath)
    console.error('  ' + err.message)
    process.exit(1)
  }
}

/**
 * Copies a directory, excluding files by name.
 */
function copyFilteredDir(srcDir, destDir, excludeFiles) {
  if (!existsSync(srcDir)) return
  mkdirSync(destDir, { recursive: true })
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (excludeFiles.includes(entry.name)) continue
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)
    if (entry.isDirectory()) {
      cpSync(srcPath, destPath, { recursive: true })
    } else {
      cpSync(srcPath, destPath)
    }
  }
}

/**
 * Copies a single file if it exists.
 */
function copyFileIfExists(src, dest) {
  if (!existsSync(src)) return
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest)
}

// ─── Template Root Discovery ─────────────────────────────────────────

/**
 * Finds the NexusFactory template root directory.
 * Supports multiple scenarios:
 *   1. NEXUS_TEMPLATE_ROOT env var (explicit override)
 *   2. Relative to __dirname (when running from inside the repo)
 *   3. .template-root marker file (written by postinstall when npm install -g)
 */
function findTemplateRoot() {
  if (process.env.NEXUS_TEMPLATE_ROOT) {
    const envRoot = resolve(process.env.NEXUS_TEMPLATE_ROOT)
    if (existsSync(join(envRoot, 'package.json'))) {
      return envRoot
    }
  }

  const relativeRoot = resolve(__dirname, '..', '..')
  const relPkgPath = join(relativeRoot, 'package.json')
  if (existsSync(relPkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(relPkgPath, 'utf-8'))
      if (pkg.name === 'nexus-factory') {
        return relativeRoot
      }
    } catch {
      // ignore parse errors
    }
  }

  const markerPath = resolve(__dirname, '..', '.template-root')
  if (existsSync(markerPath)) {
    const root = readFileSync(markerPath, 'utf-8').trim()
    if (existsSync(join(root, 'package.json'))) {
      return root
    }
  }

  console.error('')
  console.error('  Error: No se encontro el template de NexusFactory.')
  console.error('')
  console.error('  Opciones:')
  console.error('    1. Ejecuta create-nexus desde dentro del repo NexusFactory')
  console.error('    2. Exporta NEXUS_TEMPLATE_ROOT=/ruta/al/repo')
  console.error('    3. Reinstala: cd /ruta/repo/create-nexus && npm install -g .')
  console.error('')
  process.exit(1)
}

const TEMPLATE_ROOT = findTemplateRoot()

// ─── AI Assets Copy ──────────────────────────────────────────────────

function copyAiAssets(targetDir, mode) {
  const isHybrid = mode === 'hybrid'
  const claudeSrc = join(TEMPLATE_ROOT, '.claude')
  const agentSrc = join(TEMPLATE_ROOT, '.agent')

  // .claude/ — always-included directories (full copy)
  for (const dir of ['prompts', 'ai_templates', 'design-systems']) {
    const src = join(claudeSrc, dir)
    if (existsSync(src)) {
      cpSync(src, join(targetDir, '.claude', dir), { recursive: true })
    }
  }

  // .claude/PRPs/prp-base.md only
  copyFileIfExists(
    join(claudeSrc, 'PRPs', 'prp-base.md'),
    join(targetDir, '.claude', 'PRPs', 'prp-base.md')
  )

  // .claude/ root files
  for (const file of ['example.mcp.json', 'README.md']) {
    copyFileIfExists(
      join(claudeSrc, file),
      join(targetDir, '.claude', file)
    )
  }

  // .claude/commands/ — exclude factory-internal
  copyFilteredDir(
    join(claudeSrc, 'commands'),
    join(targetDir, '.claude', 'commands'),
    CLAUDE_COMMANDS_EXCLUDE
  )

  // .claude/agents/ — exclude hybrid-only for web2
  const agentExcludes = isHybrid ? [] : CLAUDE_AGENTS_HYBRID_ONLY
  copyFilteredDir(
    join(claudeSrc, 'agents'),
    join(targetDir, '.claude', 'agents'),
    agentExcludes
  )

  // .agent/ — README, rules
  for (const file of ['README.md', 'rules.md']) {
    copyFileIfExists(
      join(agentSrc, file),
      join(targetDir, '.agent', file)
    )
  }

  // .agent/blueprints/ (full copy)
  const blueprintsSrc = join(agentSrc, 'blueprints')
  if (existsSync(blueprintsSrc)) {
    cpSync(blueprintsSrc, join(targetDir, '.agent', 'blueprints'), { recursive: true })
  }

  // .agent/workflows/ — exclude factory-internal
  copyFilteredDir(
    join(agentSrc, 'workflows'),
    join(targetDir, '.agent', 'workflows'),
    AGENT_WORKFLOWS_EXCLUDE
  )
}

// ─── Main Scaffold ───────────────────────────────────────────────────

export async function scaffold(config) {
  const targetDir = resolve(process.cwd(), config.projectName)

  if (existsSync(targetDir)) {
    console.log(`  Error: Directory "${config.projectName}" already exists.`)
    process.exit(1)
  }

  // Step 1: Copy template files
  console.log('  Copiando archivos...')
  try {
    cpSync(TEMPLATE_ROOT, targetDir, {
      recursive: true,
      filter: (src) => {
        const rel = src.replace(TEMPLATE_ROOT, '').replace(/\\/g, '/')
        if (
          rel.includes('/node_modules') ||
          rel.includes('/.git') ||
          rel.includes('/.next') ||
          rel === '/create-nexus' ||
          rel.includes('/create-nexus/') ||
          rel === '/.claude' ||
          rel.includes('/.claude/') ||
          rel === '/.agent' ||
          rel.includes('/.agent/') ||
          rel === '/CLAUDE.md' ||
          rel === '/GEMINI.md' ||
          rel === '/ANTIGRAVITY_SETUP.md' ||
          rel.endsWith('.mcp_config.example.json') ||
          rel === '/tsconfig.tsbuildinfo' ||
          rel === '/package-lock.json' ||
          rel === '/nul'
        ) {
          return false
        }
        return true
      },
    })
  } catch (err) {
    console.error('  Error: Fallo al copiar archivos del template.')
    console.error('  ' + err.message)
    console.error('  Posibles causas: espacio insuficiente, permisos, path muy largo (Windows)')
    process.exit(1)
  }

  // Step 2: If web2, remove hybrid-only files
  if (config.mode === 'web2') {
    console.log('  Removiendo archivos hybrid...')
    for (const path of HYBRID_ONLY) {
      const fullPath = join(targetDir, path)
      if (existsSync(fullPath)) {
        rmSync(fullPath, { recursive: true, force: true })
      }
    }

    const pkgPath = join(targetDir, 'package.json')
    const pkg = readJson(pkgPath)

    for (const dep of HYBRID_DEPS) {
      delete pkg.dependencies[dep]
    }
    for (const script of HYBRID_SCRIPTS) {
      delete pkg.scripts[script]
    }

    // Remove Web3Provider wrap from locale layout
    const layoutPath = join(targetDir, 'src/app/[locale]/layout.tsx')
    if (existsSync(layoutPath)) {
      try {
        let layout = readFileSync(layoutPath, 'utf-8')
        layout = layout.replace(/import\s*\{[^}]*Web3Provider[^}]*\}\s*from\s*['"][^'"]*['"]\r?\n?/, '')
        layout = layout.replace(/\s*<Web3Provider>\r?\n?/, '\n')
        layout = layout.replace(/\s*<\/Web3Provider>\r?\n?/, '\n')
        writeFileSync(layoutPath, layout)
      } catch (err) {
        console.log('  Aviso: No se pudo limpiar Web3Provider del layout: ' + err.message)
      }
    }

    pkg.name = config.projectName
    writeJson(pkgPath, pkg)
  } else {
    const pkgPath = join(targetDir, 'package.json')
    const pkg = readJson(pkgPath)
    pkg.name = config.projectName
    writeJson(pkgPath, pkg)
  }

  // Step 3: Copy AI assets (.claude/ and .agent/ selective)
  console.log('  Copiando AI assets...')
  try {
    copyAiAssets(targetDir, config.mode)
  } catch (err) {
    console.log('  Aviso: Fallo parcial al copiar AI assets: ' + err.message)
  }

  // Step 4: Generate CLAUDE.md and GEMINI.md
  console.log('  Generando guias AI...')
  writeFileSync(join(targetDir, 'CLAUDE.md'), generateClaudeMd(config.projectName, config.mode))
  writeFileSync(join(targetDir, 'GEMINI.md'), generateGeminiMd(config.projectName, config.mode))

  // Step 5: Generate .env.local
  console.log('  Configurando .env.local...')
  generateEnv(targetDir, config)
  console.log('  Recuerda configurar .env.local:')
  console.log('    → NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Step 6: Install dependencies
  console.log('  Instalando dependencias (npm install)...')
  let npmFailed = false
  try {
    execSync('npm install', { cwd: targetDir, stdio: 'pipe' })
    console.log('  Dependencias instaladas')
  } catch (err) {
    npmFailed = true
    const stderr = err.stderr ? err.stderr.toString().trim() : ''
    console.log('  npm install fallo (exit code: ' + (err.status ?? '?') + ')')
    if (stderr) {
      const tail = stderr.split('\n').slice(-5).join('\n')
      console.log('  ' + tail.replace(/\n/g, '\n  '))
    }
    console.log('  Ejecuta manualmente: cd ' + config.projectName + ' && npm install')
  }

  // Step 7: Success message
  console.log('')
  console.log('  Proyecto creado exitosamente!')
  console.log('')
  console.log('  Proximos pasos:')
  console.log(`    cd ${config.projectName}`)
  if (npmFailed) {
    console.log('    npm install')
  }
  console.log('    npm run dev')
  console.log('')
  console.log('  Configurar servicios:')
  console.log('    → Supabase: https://supabase.com (crear proyecto, copiar URL + Key en .env.local)')
  console.log('    → Google OAuth: ver README.md seccion "Setup Google OAuth"')

  if (config.mode === 'hybrid') {
    if (config.storageProvider === 'pinata' && !config.pinataJwt) {
      console.log('    → Pinata: https://pinata.cloud (configurar JWT en .env.local)')
    }
    if (config.useAA && !config.bundlerUrl) {
      console.log('    → Pimlico: https://dashboard.pimlico.io (configurar Bundler URL en .env.local)')
    }
    console.log('    → Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup')
  }

  console.log('')
  console.log('  AI Guidance incluido:')
  console.log('    → CLAUDE.md / GEMINI.md (golden path, reglas, seguridad)')
  console.log('    → .claude/ (commands, agents, prompts, templates, design systems)')
  console.log('    → .agent/ (workflows para Antigravity)')
  console.log('    → Ejecuta /primer para contextualizar tu AI assistant')
  console.log('')
}

function generateEnv(targetDir, config) {
  const lines = [
    '# Supabase',
    'NEXT_PUBLIC_SUPABASE_URL=',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=',
    `NEXT_PUBLIC_SITE_URL=http://localhost:3000`,
    '',
    '# i18n',
    `NEXT_PUBLIC_DEFAULT_LOCALE=${config.defaultLocale}`,
  ]

  if (config.mode === 'hybrid') {
    lines.push(
      '',
      '# Server-only: writes wallet addresses after signature verification. Never expose.',
      'SUPABASE_SERVICE_ROLE_KEY=',
      '',
      '# Web3 (EVM)',
      `NEXT_PUBLIC_DEFAULT_NETWORK=${config.chain}`,
      `NEXT_PUBLIC_RPC_MAINNET=${config.rpcMainnet}`,
      `NEXT_PUBLIC_RPC_TESTNET=${config.rpcTestnet}`,
      `NEXT_PUBLIC_ALCHEMY_API_KEY=${config.alchemyKey}`,
      '',
      '# Account Abstraction (ERC-4337)',
      `NEXT_PUBLIC_BUNDLER_URL=${config.bundlerUrl}`,
      `NEXT_PUBLIC_PAYMASTER_URL=${config.paymasterUrl}`,
      '',
      '# Storage',
      `STORAGE_PROVIDER=${config.storageProvider}`,
      `PINATA_JWT=${config.pinataJwt}`,
      `NEXT_PUBLIC_STORAGE_GATEWAY=${config.storageGateway}`,
    )
  }

  writeFileSync(join(targetDir, '.env.local'), lines.join('\n') + '\n')
}
