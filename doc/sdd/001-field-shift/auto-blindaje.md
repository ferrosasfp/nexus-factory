# Auto-Blindaje — #001 Field Shift

### [2026-11-10 19:08] Wave 3 — Forge no emite `ast` en los artefactos
- **Error**: El filtro pedido para `scripts/sync-abi.mjs` (`artifact.ast?.absolutePath` empieza por `src/`) no sincronizaba ningún ABI: con la `foundry.toml` actual los artefactos de `contracts/out` no traen `ast` (solo `abi`, `bytecode`, `metadata`, etc.).
- **Causa raíz**: Foundry omite el AST salvo que se active `ast = true` / `extra_output`. El Story File asumía que venía por defecto.
- **Fix**: `sourcePath()` usa `artifact.ast?.absolutePath` si existe y, si no, la clave de `metadata.settings.compilationTarget` (ej. `src/PolizaParametrica.sol`). Resultado: solo PolizaParametrica, SampleNFT y SampleToken (sin forge-std, tests ni scripts). No se tocó `foundry.toml`.
- **Aplicar en**: Cualquier script que lea artefactos de Forge: no depender de `ast`; usar `metadata.settings.compilationTarget`.

### [2026-11-10 19:09] Wave 4 — Request de `simulateContract` como unión no se puede firmar
- **Error**: `tsc` falló (TS2345) en `usePoliza.ts` al pasar a `walletClient.writeContract` el `request` de un `simulateContract` elegido con un ternario (`comprarPoliza` | `reclamar`): el tipo resultante es una unión de ABIs incompatible.
- **Causa raíz**: Con ABI tipado (`as const`), viem tipa el request por función; una unión de requests no es asignable a ningún `WriteContractParameters`.
- **Fix**: Helper `firmar()` con una rama por función, cada una con su propio `simulateContract` → `writeContract`. El tipo del wallet client es `WalletClient<Transport, Chain, Account>` (`ReturnType<typeof useWalletClient>['data']` resolvía a `{}` por ser genérico).
- **Aplicar en**: Hooks que escriben contratos con ABI tipado y varias funciones.

### [2026-11-10 19:07] Wave 3 — forge-lint `unsafe-typecast` en ReportarIndice
- **Error**: `forge build` avisaba `unsafe-typecast` en `uint16(indice)`.
- **Causa raíz**: El lint no ve el `require(indice <= type(uint16).max)` previo.
- **Fix**: Comentario de justificación + `// forge-lint: disable-next-line(unsafe-typecast)`.
- **Aplicar en**: Scripts Forge que convierten env vars `uint256` a tipos más chicos.

### [2026-11-10 19:15] Wave 5 — Navegadores de Playwright desactualizados
- **Error**: `playwright test` falló con `Executable doesn't exist ... chromium_headless_shell-1254`: había instalados los binarios 1208 de una versión anterior.
- **Causa raíz**: `@playwright/test` se actualizó en el lockfile sin reinstalar navegadores.
- **Fix**: `npx playwright install chromium`.
- **Aplicar en**: Toda máquina tras `npm ci` con una versión nueva de Playwright (README / CI).
