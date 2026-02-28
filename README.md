# NexusFactory

**El nexo entre Web2 y Web3.** Base universal para aplicaciones modernas con Next.js 16 + Supabase, extensible a blockchain EVM con un solo CLI.

---

## Dos Modos, Un Comando

| Modo | Stack | Para Quién |
|------|-------|------------|
| **Web2** | Next.js 16 + Supabase + Tailwind + i18n | Apps SaaS, dashboards, plataformas B2B |
| **Hybrid** | Web2 + Viem/Wagmi + Foundry + IPFS + AA | dApps, marketplaces NFT, DeFi, tokenización |

```bash
create-nexus mi-proyecto web2     # App Web2
create-nexus mi-proyecto hybrid   # App Web2 + Web3
```

---

## Metodologia incluida: NexusAgil

NexusFactory incluye **NexusAgil** preinstalado — la metodologia de desarrollo con IA anti-alucinacion.

### 3 modos de trabajo

Al inicio de cada sesion, Claude pregunta que estas construyendo:

| Modo | Para que | Activar con |
|------|----------|-------------|
| **FAST** | Fix trivial, 1-2 archivos | `"Quick flow: [cambio]"` |
| **LAUNCH** | MVP o prototipo nuevo | `"NexusAgil, modo LAUNCH: [descripcion]"` |
| **QUALITY** | Feature para produccion | `"NexusAgil, procesa esta HU: [descripcion]"` |

**Proyecto nuevo sin project-context.md → LAUNCH por defecto.**

### Lo que NexusAgil aporta
- **Codebase Grounding** — Claude lee codigo real antes de generar. Nunca inventa.
- **Anti-alucinacion** — Exemplar Pattern + Constraint Directives en cada SDD
- **Gates humanos** — HU_APPROVED y SPEC_APPROVED. "ok" y "dale" no cuentan.
- **Adversarial Review** — un agente ataca la solucion antes de aprobarla
- **QA con evidencia** — cada AC verificado con archivo:linea

Ver `.claude/skills/nexus-agil/SKILL.md` para el pipeline completo.

---

## Golden Path

Un solo stack perfeccionado. Sin decisiones técnicas.

### Base (ambos modos)

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Auth | Supabase (Google OAuth + Email/Password) |
| Database | Supabase PostgreSQL + RLS |
| Estilos | Tailwind CSS 3.4 |
| i18n | next-intl v4 (EN + ES, rutas `[locale]`) |
| Validación | Zod v4 |
| Testing | Vitest + Playwright |

### Hybrid (adicional)

| Capa | Tecnología |
|------|------------|
| Blockchain | Viem 2 + Wagmi (EVM agnóstico, Avalanche default) |
| Account Abstraction | permissionless / Pimlico (ERC-4337) |
| Smart Contracts | Foundry + OpenZeppelin |
| Storage | Agnóstico (Pinata/IPFS default) |
| Security | Slither + Zod validation on-chain inputs |

Agregar una chain EVM = 1 línea en `src/shared/lib/web3/chains.ts`.

---

## Arquitectura Feature-First

```
src/
├── app/[locale]/                # Rutas bajo locale dinámico (i18n)
│   ├── (auth)/                  # login, signup, callback, forgot-password
│   └── (main)/                  # dashboard, wallet*, contracts*, storage*
│
├── features/
│   ├── auth/                    # Google OAuth + Email/Password
│   ├── wallet/                  # * Connect, network, smart account
│   ├── contracts/               # * Reader, Writer, ABIs
│   ├── transactions/            # * TxStatus, TxHistory
│   └── storage/                 # * FileUploader, StorageViewer
│
├── shared/
│   ├── lib/supabase/            # Supabase client (server/browser)
│   ├── lib/web3/                # * Viem, Wagmi, chains, AA, validation
│   └── providers/               # * Web3Provider
│
├── actions/                     # Server Actions
│   ├── auth.ts                  # login, signup, signInWithGoogle
│   ├── wallet.ts                # * linkWallet, saveSmartAccount
│   └── storage.ts               # * uploadFile, deleteFile
│
├── i18n/                        # next-intl config
└── types/                       # Database types

contracts/                       # * Foundry workspace
├── src/                         # SampleToken.sol, SampleNFT.sol
├── test/                        # Forge tests
├── script/                      # Deploy scripts
└── foundry.toml

create-nexus/                    # CLI scaffolder interactivo

* = Solo en modo hybrid
```

---

## Quick Start

### 1. Clonar el repo (una sola vez)

```bash
git clone https://github.com/ferrosasfp/NexusFactory.git
cd NexusFactory
```

### 2. Instalar el CLI globalmente (una sola vez)

```bash
cd create-nexus
npm install -g .
cd ..
```

Esto registra el comando `create-nexus` en tu sistema. A partir de ahora puedes usarlo **desde cualquier carpeta** de tu terminal.

### 3. Crear un proyecto nuevo

```bash
# Desde CUALQUIER carpeta de tu terminal:
cd ~/mis-proyectos
create-nexus mi-app web2        # Modo Web2
create-nexus mi-dapp hybrid     # Modo Hybrid (Web2 + Web3)
```

El CLI copia los archivos template, limpia lo que no necesitas segun el modo, genera `.env.local` y ejecuta `npm install` automaticamente.

### 4. Configurar Supabase

#### 4a. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (o inicia sesion)
2. Click en **New Project**
3. Elige un nombre, password y region
4. Una vez creado, ve a **Settings → API** y copia:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 4b. Configurar `.env.local`

Entra al proyecto generado y edita `.env.local` (ya fue creado por el CLI):

```bash
cd mi-app
```

Completa las variables con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...tu-key
```

#### 4c. Ejecutar migraciones (crear tablas y RLS)

Necesitas autenticarte con Supabase CLI y linkear tu proyecto antes de pushear las migraciones.

**Paso 1: Login en Supabase CLI**

```bash
npx supabase login
```

Se abrira tu navegador automaticamente. Supabase te mostrara un **codigo de verificacion** en la pagina web. Copia ese codigo y pegalo en la terminal cuando lo pida.

> Si el navegador no se abre, la terminal mostrara un link que puedes abrir manualmente.

**Paso 2: Linkear tu proyecto**

Tu `project-ref` es el subdominio de tu Supabase URL. Por ejemplo, si tu URL es `https://abcdefgh.supabase.co`, tu ref es `abcdefgh`.

```bash
npx supabase link --project-ref tu-project-ref
```

**Paso 3: Push de migraciones**

```bash
npx supabase db push --include-all
```

Esto crea las tablas `profiles` y `wallet_addresses` (hybrid) con sus politicas RLS.

> Te pedira confirmacion antes de aplicar. Escribe `y` para continuar.

### 5. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Crear **OAuth 2.0 Client ID** (tipo: Web application)
3. En **Authorized redirect URIs** agrega: `http://localhost:3000/en/callback`
4. Ve a **Supabase Dashboard → Authentication → Providers → Google**
5. Pega el **Client ID** y **Client Secret** de Google

### 6. Variables adicionales (solo Hybrid)

| Variable | Servicio | Como obtenerla |
|----------|----------|----------------|
| `NEXT_PUBLIC_BUNDLER_URL` | [Pimlico](https://dashboard.pimlico.io) | Crear cuenta (gratis, sin tarjeta) → Dashboard → API Key |
| `PINATA_JWT` | [Pinata](https://pinata.cloud) | Crear cuenta → API Keys → New Key |

Agregalas en tu `.env.local`:

```env
NEXT_PUBLIC_BUNDLER_URL=https://api.pimlico.io/v2/...
PINATA_JWT=eyJhbGciOi...
```

### 7. Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## Comandos

### Desarrollo

| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build producción |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run lint` | ESLint |
| `npm run qa` | typecheck + lint + test + build |

### Testing

| Comando | Acción |
|---------|--------|
| `npm run test` | Vitest (unit + component) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Cobertura de código |
| `npm run test:e2e` | Playwright E2E |

### i18n

| Comando | Acción |
|---------|--------|
| `npm run i18n:sync` | Detecta claves faltantes entre EN y ES |

### Smart Contracts (solo Hybrid)

| Comando | Acción |
|---------|--------|
| `npm run contracts:build` | Compilar contratos con Forge |
| `npm run contracts:test` | Tests de contratos |
| `npm run contracts:slither` | Análisis de seguridad estático |
| `npm run contracts:sync-abi` | Copiar ABIs compilados al frontend |
| `npm run contracts:deploy:fuji` | Deploy a Avalanche Fuji testnet |
| `npm run qa:hybrid` | QA completo (Web2 + contratos) |

---

## CLI: create-nexus

Scaffolder interactivo que genera proyectos listos para usar.

### Instalacion (una sola vez)

```bash
# Desde la raiz del repo clonado:
cd create-nexus
npm install -g .
```

Al instalar, el CLI guarda la ruta del repo template. Esto permite que funcione **desde cualquier carpeta** de tu terminal (Windows, Mac, Linux).

> **Si mueves el repo a otra ruta**, reinstala con `npm install -g .` desde la nueva ubicacion.

### Uso

```bash
# Desde CUALQUIER carpeta:
create-nexus mi-app web2       # Modo rapido Web2
create-nexus mi-dapp hybrid    # Modo rapido Hybrid

# Wizard interactivo (te guia paso a paso):
create-nexus
```

### Que hace el CLI

1. Copia los archivos template del repo clonado
2. Si es Web2: elimina archivos de blockchain (wallet, contracts, storage, web3)
3. Genera `.env.local` pre-configurado segun el modo
4. Ejecuta `npm install` automaticamente
5. Muestra los proximos pasos de configuracion

### Flujo del Wizard

**Web2 (3 pasos):** Nombre → Modo → Idioma → Listo

**Hybrid (7 pasos):** Nombre → Modo → Blockchain → RPC → Storage → Account Abstraction → Idioma → Listo

---

## Features Incluidas

### Auth (Google OAuth + Email/Password)

- Login/Signup con formularios validados (Zod)
- Google OAuth con callback automático
- Forgot password + update password
- Check email confirmation
- Middleware combinado: next-intl (locale) + Supabase (auth)
- Rutas protegidas: `/dashboard`, `/wallet`, `/contracts`, `/storage`

### Wallet (Hybrid)

- ConnectWallet: MetaMask, Core Wallet, injected
- WalletInfo: dirección, balance, red actual
- NetworkSwitcher: cambiar entre chains soportadas
- SmartAccountInfo: estado de la Smart Account (ERC-4337)
- Server actions: linkWallet, unlinkWallet, saveSmartAccount

### Contracts (Hybrid)

- SampleToken.sol: ERC-20 + Permit + Ownable (OpenZeppelin)
- SampleNFT.sol: ERC-721 + URIStorage + Ownable
- Tests completos con Forge
- Scripts de deploy para Fuji/Mainnet
- ContractReader: lee funciones view desde el frontend
- ContractWriter: ejecuta transacciones con simulación previa
- sync-abi.mjs: sincroniza ABIs compilados al frontend

### Storage (Hybrid)

- Interface `StorageProvider` agnóstica
- Implementación Pinata (IPFS) incluida
- FileUploader con drag & drop
- StorageViewer: recuperar archivos por CID
- Server actions (PINATA_JWT nunca expuesto al cliente)

### Transactions (Hybrid)

- TxStatus: seguimiento de transacciones (pending/confirmed/failed)
- TxHistory: historial de transacciones de la sesión
- useTx hook: checkStatus + waitForConfirmation
- txService: getTxDetails, waitForTx

### i18n

- next-intl v4 con rutas `[locale]`
- EN + ES completos (auth, dashboard, wallet, contracts, storage, transactions)
- Script `i18n:sync` para detectar claves faltantes
- Locale-aware redirects en middleware

---

## Dual-Brain AI Architecture

NexusFactory opera con dos cerebros de IA sobre el mismo código:

| Motor | Archivo de Identidad | Ubicación |
|-------|---------------------|-----------|
| **Claude Code** (Anthropic) | `CLAUDE.md` | `.claude/` (commands, agents, PRPs, skills) |
| **Antigravity** (Google) | `GEMINI.md` | `.agent/` (workflows, skills, rules) |

### Agentes Especializados

| Agente | Archivo | Función |
|--------|---------|---------|
| Web3 Specialist | `.claude/agents/web3-specialist.md` | Viem, Wagmi, AA, chains |
| Solidity Specialist | `.claude/agents/solidity-specialist.md` | Foundry, OpenZeppelin, Slither |

### Comandos

| Comando | Función |
|---------|---------|
| `/new-app` | Wizard de negocio (pregunta modo Web2/Hybrid) |
| `/translate` | Sincronizar traducciones entre locales |
| `/generar-prp` | Crear especificación de nueva feature |
| `/ejecutar-prp` | Implementar feature aprobada |

---

## Costos Aproximados (Producción)

### Web2

| Servicio | Free Tier | Pro |
|----------|-----------|-----|
| Supabase | 500MB DB, 50K auth users | $25/mes |
| Vercel | 100GB bandwidth | $20/mes |

### Hybrid (adicional)

| Servicio | Free Tier | Notas |
|----------|-----------|-------|
| Pimlico | 1M créditos/mes (~1,300 ops) | Sin tarjeta requerida |
| Pinata | 500 uploads/mes, 100MB | API key gratuita |
| Avalanche Fuji | Testnet gratuita | Faucet: faucet.avax.network |
| Avalanche C-Chain | Fees: ~$0.01/tx | Gas bajo vs Ethereum |

---

## Troubleshooting

### Puerto ocupado

```bash
npm run dev
# Turbopack auto-detecta puerto disponible
```

### TypeScript errors después de cambiar tsconfig

```bash
rm -rf .next/types tsconfig.tsbuildinfo
npx tsc --noEmit
```

### BigInt literals no disponibles

El target es `ES2022`. Si ves errores con `0n`, verifica que `tsconfig.json` tenga `"target": "ES2022"`.

### Foundry no instalado

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
cd contracts && forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

---

## Próximos Pasos

1. Configura Supabase y Google OAuth
2. Ejecuta `npm run dev` y navega a `http://localhost:3000`
3. Para Hybrid: configura Pimlico y Pinata en `.env.local`
4. Crea tu primera feature con `/generar-prp`
5. Deploy a Vercel: `npx vercel`

---

## Créditos

- **SaaS Factory**: La arquitectura original Feature-First y el concepto de "Fábrica" fueron creados por **[Daniel](https://github.com/daniel-carreon)**, cuyo trabajo desde la V1 hasta la V3 sirve de base e inspiración para NexusFactory.

---

**NexusFactory** | El nexo entre Web2 y Web3

## Licencia

MIT
