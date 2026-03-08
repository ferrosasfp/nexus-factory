# Nexus Factory

**The bridge between Web2 and Web3.** Universal base for modern applications with Next.js + Supabase, extensible to blockchain EVM with a single CLI.

---

## Two Modes, One Command

| Mode | Stack | For |
|---|---|---|
| **Web2** | Next.js 16 + Supabase + Tailwind + i18n | SaaS apps, dashboards, B2B platforms |
| **Hybrid** | Web2 + Viem/Wagmi + Foundry + IPFS | dApps, NFT marketplaces, DeFi, tokenization |

```bash
create-nexus my-project web2     # Web2 app
create-nexus my-project hybrid   # Web2 + Web3 app
```

---

## Included Methodology: NexusAgil

NexusFactory ships with **NexusAgil** preinstalled — the AI-assisted development methodology, anti-hallucination by design.

> The NexusAgil included in NexusFactory is **stack-aware**: it already knows the Golden Path (Next.js, Supabase, Viem, Foundry). The `project-context.md` comes pre-configured — no bootstrap needed.
>
> The standalone [NexusAgil repo](https://github.com/ferrosasfp/NexusAgile) is **stack-agnostic**: it studies any project's stack at the beginning of each session to generate `project-context.md` from scratch.

### 3 Work Modes

| Mode | For | Activate with |
|---|---|---|
| **FAST** | Trivial fix, 1-2 files | `"Quick flow: [change]"` |
| **LAUNCH** | MVP or new prototype | `"NexusAgil, LAUNCH mode: [description]"` |
| **QUALITY** | Production feature | `"NexusAgil, process this HU: [description]"` |

New project without `project-context.md` → LAUNCH by default.

### What NexusAgil Brings

| Mechanism | What it prevents |
|---|---|
| **Codebase Grounding** | AI generating code without reading the real codebase |
| **Exemplar Pattern** | AI inventing patterns that don't match the project |
| **Constraint Directives** | AI ignoring explicit REQUIRED/FORBIDDEN rules |
| **Integration Contract** | Components communicating in incompatible formats |
| **Drift Detection** | Implementation diverging silently from the spec |
| **Anti-Hallucination Protocol** | Dev inventing imports or APIs that don't exist |
| **Auto-Blindaje** | Errors repeating across sessions |
| **Gates** | AI assuming the human approved something they didn't read |

**Gates:**

| Gate | Context | Effect |
|---|---|---|
| `HU_APPROVED` | After F1 Work Items + parallelism proposal | Architect starts F2 SDD (parallel where applicable) |
| `SPEC_APPROVED` | After F2 SDD | Architect generates Story File (F2.5) |
| `SPRINT_APPROVED` | After Sprint Planning | SM commits, Architect starts F0 |
| `REVIEW_APPROVED` | After Status Meeting | SM commits status, pipeline continues |
| `RETRO_APPROVED` | After Retrospective | SM runs Closure Checklist, sprint CLOSED |

"yes", "ok", "go", "sure" → do NOT activate any gate. Exact text only.

**Flow rule:** Between gates, the pipeline runs automatically — no asking "shall I continue?" between phases. Only stop at the 5 formal gates.

### Sprint Planning — SM responsibilities

During Planning, the SM:
1. Reviews backlog and velocity from previous sprint
2. Presents selected HUs with sizing and goal
3. Waits for `SPRINT_APPROVED` — then commits artifacts and hands off to Architect

> **Dependency analysis and parallelism proposal is the Architect's responsibility in F1** — not the SM's. The SM selects; the Architect decides what can run in parallel based on the real codebase.

### Sprint Closure Checklist (SM)

The SM runs this checklist before declaring any sprint CLOSED:

```
[ ] _INDEX.md       — all NNNs have status DONE / CARRY-OVER / CANCELLED / ABORTED
[ ] sprint-status.yaml — estado: CERRADO, completadas and deuda_tecnica documented
[ ] Issue tracker   — all sprint issues closed in Linear / GitHub Issues / Jira
[ ] project-context.md — new ADRs and Auto-Blindaje rules added
[ ] git commit + push — all closure artifacts committed
```

See `.claude/skills/nexus-agil/SKILL.md` for the full pipeline and all 9 agents.
Full methodology documentation → [NexusAgil repo](https://github.com/ferrosasfp/NexusAgile)

---

## Golden Path

One perfected stack. No technical decisions needed.

### Base (both modes)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Auth | Supabase (Google OAuth + Email/Password) |
| Database | Supabase PostgreSQL + RLS |
| Styles | Tailwind CSS 3.4 |
| i18n | next-intl v4 (EN + ES, `[locale]` routes) |
| Validation | Zod v4 |
| Testing | Vitest + Playwright |

### Hybrid (additional)

| Layer | Technology |
|---|---|
| Blockchain | Viem 2 + Wagmi (EVM agnostic, Avalanche default) |
| Account Abstraction | permissionless / Pimlico (ERC-4337) |
| Smart Contracts | Foundry + OpenZeppelin |
| Storage | Agnostic (Pinata/IPFS default) |
| Security | Slither + Zod validation on on-chain inputs |

Adding an EVM chain = 1 line in `src/shared/lib/web3/chains.ts`.

---

## Feature-First Architecture

```
src/
├── app/[locale]/                # Routes under dynamic locale (i18n)
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

.claude/skills/nexus-agil/       # NexusAgil methodology (preinstalled)

create-nexus/                    # Interactive CLI scaffolder

* = Hybrid mode only
```

---

## Quick Start

### 1. Clone the repo (once)

```bash
git clone https://github.com/ferrosasfp/NexusFactory.git
cd NexusFactory
```

### 2. Install the CLI globally (once)

```bash
cd create-nexus
npm install -g .
cd ..
```

### 3. Scaffold your project

```bash
create-nexus my-project web2     # Web2 only
create-nexus my-project hybrid   # Web2 + Web3
```

### 4. Start building

Open the project in Claude Code. NexusAgil loads automatically.

```
NexusAgil, process this HU: [your feature description]
```

---

## NexusFactory vs NexusAgil

| | NexusFactory | NexusAgil (standalone) |
|---|---|---|
| **What it is** | Opinionated project template | Stack-agnostic methodology |
| **Stack** | Fixed Golden Path | Any stack |
| **NexusAgil** | Preinstalled, stack-aware | Standalone, discovers stack |
| **project-context.md** | Pre-configured | Generated from scratch at bootstrap |
| **Use when** | Starting a new project on the Golden Path | Adding methodology to any existing project |

→ [NexusAgil standalone repo](https://github.com/ferrosasfp/NexusAgile)

---

## Credits

Created by [Fernando Rosas](https://github.com/ferrosasfp).

MIT License
