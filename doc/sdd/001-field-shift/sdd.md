# SDD #001: Field Shift — NASA POWER + rotación + póliza paramétrica

> SPEC_APPROVED: no
> HU_APPROVED: sí (2026-11-10). Las 5 decisiones del Work Item quedaron con su opción por defecto.
> Fecha: 2026-11-10
> Tipo: feature
> SDD_MODE: full
> Branch: feat/001-field-shift (desde fix/hardening-mvp-base @ caa06e5)
> Artefactos: doc/sdd/001-field-shift/

---

## 1. Resumen

Se porta el MVP vanilla `field-shift-mvp` a una feature pública de NexusFactory, sin login ni Supabase. Los datos de NASA POWER se piden a un route handler con caché de 24 h y, si falla, se usan snapshots versionados. La lógica pura (campañas, escenarios ENSO, rotación y backtest) va a `services/` y se valida con golden tests contra el JS original. La UI usa next-intl (ES/EN) y respeta el flujo de 5 clics del workshop. La póliza paramétrica pasa a Foundry y solo se muestra con una wallet conectada en Fuji.

Las decisiones de HU_APPROVED aplicadas fueron estas: (1) API **mensual**, como en el MVP; (2) **4 prioridades** (comida, ingreso, suelo, clima); (3) snapshots descargados y versionados en F3; (4) early-return en el middleware; (5) gates HU/SPEC sin AR/CR formales.

## 2. Work Item

Ver `work-item.md`. Los ACs AC-1 a AC-20 aplican tal cual, con estos **ajustes de diseño** (no cambian la intención):
- **AC-3:** el campo `origen` toma los valores `nasa` (respuesta de NASA, en vivo o desde la caché de fetch de Next) u `offline` (snapshot). Next no expone si un `fetch` vino de la caché, así que no se distingue `live` de `cache`.
- **AC-16:** hoy `forge test` **falla en un checkout limpio**, porque `contracts/lib/` está en `.gitignore` y vacío (no hay forge-std ni OpenZeppelin). Se agrega `npm run contracts:install` y se documenta. Sin esto no se puede cumplir AC-16.

## 3. Context Map (Codebase Grounding)

### Archivos leídos
| Archivo | Por qué | Patrón extraído |
|---------|---------|-----------------|
| `middleware.ts` | Ruta pública | intl primero; `getUser()` en **todas** las rutas; listas `isProtectedRoute` / `isAuthRoute`; el matcher excluye `/api` |
| `src/app/[locale]/layout.tsx` | Providers | `NextIntlClientProvider` + `Web3Provider` (wagmi + react-query) envuelven todo `[locale]` |
| `src/app/[locale]/(main)/contracts/page.tsx` | Página exemplar | `async` page → `setRequestLocale(locale)` → componente con `useTranslations(ns)` |
| `src/features/wallet/hooks/useWallet.ts`, `useNetwork.ts` | Wallet | `useAccount` (address, isConnected, chain); `useNetwork().switchToDefault()`; `defaultChain = avalancheFuji` |
| `src/features/wallet/components/ConnectWallet.tsx` | Reutilizable | Botón conectar/desconectar con `useTranslations('wallet')` |
| `src/features/contracts/hooks/useContractWrite.ts` | Escritura | simulate → `walletClient.writeContract`; **no soporta `value`** (la compra de póliza lo necesita) |
| `src/shared/lib/web3/chains.ts`, `client.ts` | Chain / RPC | `getPublicClient(chainId)`; `avalancheFuji.blockExplorers` para el link a Snowtrace |
| `src/lib/rate-limit.ts` | Route handler | `rateLimitApi(request)` → `{ success }`; pasa siempre si no hay Redis |
| `scripts/sync-abi.mjs` | ABI | Copia `contracts/out/*.sol/*.json` → `src/features/contracts/abi/<Name>.json` (solo JSON, sin tipos `as const`) |
| `contracts/foundry.toml`, `script/DeployToken.s.sol`, `test/SampleToken.t.sol` | Foundry | solc 0.8.24; `vm.envUint("PRIVATE_KEY")` + `startBroadcast`; tests `test_*` con `vm.prank` / `vm.expectRevert` |
| `e2e/navigation.spec.ts`, `playwright.config.ts` | E2E | `test.describe`; webServer `npm run dev` en :3000, `reuseExistingServer` |
| `vitest.config.ts` | Unit | jsdom; `src/**/*.test.{ts,tsx}`; alias `@` |
| `messages/es.json` | i18n | Namespaces planos por feature (`wallet`, `contracts`, …) |
| MVP `web/*.js`, `contrato/**` | Fuente a portar | Ver §4.3 |

### Exemplars
| Para crear/modificar | Seguir patrón de | Razón |
|---------------------|------------------|-------|
| `src/app/[locale]/field-shift/page.tsx` | `src/app/[locale]/(main)/contracts/page.tsx` | setRequestLocale + content |
| `src/features/field-shift/components/*` | `src/features/wallet/components/ConnectWallet.tsx` | `'use client'`, `useTranslations`, Tailwind |
| `src/features/field-shift/hooks/usePoliza.ts` | `src/features/contracts/hooks/useContractWrite.ts` | simulate antes de escribir, manejo de errores; agrega `value` |
| `src/app/api/field-shift/nasa/route.ts` | uso documentado en `src/lib/rate-limit.ts` | `rateLimitApi` + `NextResponse.json` |
| `contracts/test/PolizaParametrica.t.sol` | `contracts/test/SampleToken.t.sol` | forge-std Test, `test_*` |
| `contracts/script/DeployPoliza.s.sol` | `contracts/script/DeployToken.s.sol` | `PRIVATE_KEY` + broadcast |
| `e2e/field-shift.spec.ts` | `e2e/navigation.spec.ts` | describe/goto/expect |
| services + tests | MVP `web/rotacion.js` (lógica) + patrón AAA de CLAUDE.md | Port 1:1 |

### Estado de BD relevante
N/A: la feature no toca Supabase.

### Componentes reutilizables encontrados
- `ConnectWallet` (wallet), para conectar desde el bloque opcional.
- `useNetwork().switchToDefault()`, para pasar a Fuji si la wallet está en otra red.
- `getPublicClient(chainId)`, para `simulateContract` y `waitForTransactionReceipt`.
- `rateLimitApi`, en el route handler.

## 4. Diseño técnico

### 4.1 Archivos a crear/modificar

| # | Archivo | Acción | ACs |
|---|---------|--------|-----|
| 1 | `src/features/field-shift/types/index.ts` | crear: `Mes`, `Zona`, `Cultivo`, `Escenario`, `Fase`, `Campania`, `Clima`, `Prioridades`, `Rotacion`, `Razon`, `PuntoBacktest`, `DatosNasa` | 1 |
| 2 | `src/features/field-shift/services/cultivos.ts` | crear: `CULTIVOS`, `ZONAS` (valores idénticos; los nombres pasan a claves i18n) | 1, 8 |
| 3 | `src/features/field-shift/services/enso.ts` | crear: `EL_NINO`, `LA_NINA`, `fase()` | 1 |
| 4 | `src/features/field-shift/services/nasa.ts` | crear: `ANIO_INICIO=2001`, `ANIO_FIN=2025`, `urlNasaPower()`, `normalizarNasa(json)` (= `ordenar` del MVP), `nasaPowerSchema` (Zod) | 3, 4 |
| 5 | `src/features/field-shift/services/rotacion.ts` | crear: `CAMPANIA`, `VENTANA_CRITICA`, `analizarClima`, `recomendarRotaciones`, `backtest`, `umbralSugerido`, `FieldShiftError` | 1, 2, 9, 10, 11 |
| 6 | `src/features/field-shift/services/__tests__/*.test.ts` | crear: golden + casos borde (AAA) | 1, 2 |
| 7 | `src/features/field-shift/services/__tests__/fixtures/golden.json` | crear: salida del MVP original (4 zonas × 3 escenarios × presets de prioridades × umbrales) | 1 |
| 8 | `scripts/field-shift-golden.mjs` | crear: importa `web/rotacion.js` del MVP (ruta por env/arg) sobre los snapshots y escribe `golden.json` | 1 |
| 9 | `scripts/field-shift-datos.mjs` | crear: port de `descargar-datos.mjs`; escribe `src/features/field-shift/data/<zona>.json` | 6 |
| 10 | `src/features/field-shift/data/{carumas,ichuna,ubinas,yunga}.json` | crear (F3, con internet): respuesta cruda de NASA POWER | 4, 6 |
| 11 | `src/features/field-shift/services/snapshots.ts` | crear: `obtenerSnapshot(zonaId)` (import estático de los 4 JSON; solo servidor) | 4 |
| 12 | `src/app/api/field-shift/nasa/route.ts` | crear: GET; Zod `zona`; rate limit; fetch con `AbortSignal.timeout(8000)` + `next.revalidate: 86400`; respaldo con el snapshot; `FIELD_SHIFT_OFFLINE=true` fuerza el snapshot | 3, 4, 5 |
| 13 | `src/app/api/field-shift/nasa/__tests__/route.test.ts` | crear: ok / NASA 500 / timeout / JSON inválido / zona inválida (fetch mockeado) | 3, 4, 5 |
| 14 | `middleware.ts` | modificar: después de `intlResponse`, `if (stripLocale(...).startsWith('/field-shift')) return intlResponse` (antes de `createServerClient`) | 7 |
| 15 | `src/app/[locale]/field-shift/page.tsx` | crear: server page + `generateMetadata` traducida | 7, 12 |
| 16 | `src/features/field-shift/hooks/useClima.ts` | crear: fetch a `/api/field-shift/nasa`, estado `{ meses, origen, loading, error }` | 3, 8 |
| 17 | `src/features/field-shift/hooks/usePoliza.ts` | crear: lee `zonas(id)`, `prima(id,true/false)`, `tienePoliza`; `comprar(conRotacion)` con `value`; `reclamar()`; simulate → write → receipt | 14 |
| 18 | `src/features/field-shift/components/FieldShiftDemo.tsx` | crear: orquestador (estado de zona, escenario, prioridades y umbral) | 8-11 |
| 19 | `…/components/ZonaSelector.tsx` | crear: select + botón "Consultar NASA" + estado/origen | 8, 4 |
| 20 | `…/components/TarjetasClima.tsx` | crear: 6 tarjetas + selector de escenario | 8, 9 |
| 21 | `…/components/Prioridades.tsx` | crear: 4 sliders 0-3 | 10 |
| 22 | `…/components/Rotaciones.tsx` | crear: top 3, barras y razones (traduce `Razon[]`) | 10, 12 |
| 23 | `…/components/BacktestSeguro.tsx` | crear: slider 0.20-0.90, SVG (port de `pintarBacktest`), marca N y resumen | 11 |
| 24 | `…/components/PolizaFuji.tsx` | crear: bloque opcional; aviso "educativo, no auditado"; resumen antes de firmar; link a Snowtrace | 13, 14, 15 |
| 25 | `…/components/__tests__/*.test.tsx` | crear: FieldShiftDemo (flujo con fetch mockeado), PolizaFuji (oculto o visible según wagmi mockeado) | 8-14 |
| 26 | `src/features/field-shift/index.ts` | crear: barrel | — |
| 27 | `messages/es.json`, `messages/en.json` | modificar: namespace `fieldShift` (UI, cultivos, zonas, razones, errores) | 12 |
| 28 | `contracts/src/PolizaParametrica.sol` | crear: copia **verbatim** del MVP | 16 |
| 29 | `contracts/test/PolizaParametrica.t.sol` | crear: los 6 tests del MVP en forge-std | 16 |
| 30 | `contracts/script/DeployPoliza.s.sol` | crear: deploy + `crearZona("Carumas",450,0.05e18,0.01e18)` + fondea 0.2 AVAX; oráculo = deployer | 18 |
| 31 | `contracts/script/ReportarIndice.s.sol` | crear: `CONTRATO`, `ZONA`, `INDICE` y `HASH` opcional por env → `reportarIndice` | 18 |
| 32 | `scripts/sync-abi.mjs` | modificar: además del `.json`, emitir `<Name>.ts` con `export const <name>Abi = [...] as const` | 17 |
| 33 | `src/features/contracts/abi/PolizaParametrica.{json,ts}` | generar con `contracts:sync-abi` (versionado) | 17 |
| 34 | `package.json` | modificar: `field-shift:datos`, `field-shift:golden`, `contracts:install`, `contracts:deploy:poliza:fuji`, `contracts:reportar:fuji` | 6, 16, 18 |
| 35 | `.env.example` | modificar: `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT`, `NEXT_PUBLIC_FIELD_SHIFT_ZONE_ID=0`, `FIELD_SHIFT_OFFLINE=` | 13, 4 |
| 36 | `e2e/field-shift.spec.ts` | crear: 5 clics en `/es/field-shift` y smoke en `/en/field-shift` | 19 |
| 37 | `README.md` | modificar: sección "Cómo levantar Field Shift localmente" + aviso del contrato + ideas para el hackathon | 15, 20 |

### 4.2 Flujo de datos

```
[Cliente] ZonaSelector ──GET /api/field-shift/nasa?zona=carumas──▶ [route.ts]
                                                                     │ Zod(zona ∈ ZONAS) ─ no → 400
                                                                     │ rateLimitApi ─ no → 429
                                                                     │ FIELD_SHIFT_OFFLINE? → snapshot
                                                                     │ fetch NASA (8s, revalidate 24h)
                                                                     │   ok + nasaPowerSchema ✓ → normalizar → {origen:'nasa', meses}
                                                                     │   error/timeout/schema ✗ → snapshot → {origen:'offline', meses}
        ◀──────────────────────────── { zona, origen, meses: Mes[] } ┘
FieldShiftDemo: analizarClima(meses, escenario) → TarjetasClima
                recomendarRotaciones(clima, prioridades) → Rotaciones
                backtest(climaTodas, umbral) → BacktestSeguro   (siempre 'todas', RN-7)
                umbralSugerido(climaTodas) → valor inicial del slider
PolizaFuji: render ⇔ isConnected && chain.id===43113 && CONTRACT válido
```

`meses` se normaliza en el servidor, así que el cliente recibe unos 300 objetos pequeños y no el JSON crudo. El cálculo ocurre en el cliente (useMemo), así que los sliders responden al instante y sin red.

### 4.3 Reglas del port (paridad)

- **Fórmulas idénticas**, en el mismo orden de operaciones de punto flotante: `promedio`, `aptitud`, `componentes`, `total`, el orden del sort y `umbralSugerido` (incluido el `+0.0005`). No se "mejora" nada.
- **El sort es estable:** `Array.prototype.sort` es estable en V8 y se conserva el mismo orden de inserción (p, q sobre `Object.keys(CULTIVOS)` en el orden papa, haba, cebada, avena, quinua, maíz).
- **Las razones dejan de ser strings:** `explicar()` devuelve `Razon[]`, un `{ clave, params }` discriminado (`aguaCubre`, `aguaParcial`, `sequiaTolerantes`, `sequiaNinguno`, `heladaSensibles`, `heladaResistentes`, `leguminosa`, `papaPrimero`, `repite`), con params numéricos ya redondeados como en el MVP (`mm`, `pct`) y listas de claves de cultivo. **Paridad de texto:** un test formatea las `Razon[]` con `createTranslator` de next-intl y los mensajes ES, y las compara **string por string** con el golden del MVP. Así se prueba la lógica y la traducción ES a la vez.
- **Errores:** `FieldShiftError` con `code: 'CAMPANIAS_INSUFICIENTES' | 'ESCENARIO_INSUFICIENTE'` (son los mismos umbrales, 5 y 3).
- **Golden:** `scripts/field-shift-golden.mjs <ruta-mvp>` importa los módulos ESM del MVP sin modificarlos y les pasa los mismos snapshots. Los presets de prioridades son el default `{2,1,1,3}`, cada eje solo en 3 y todos en 0. Los umbrales son 0.30, 0.45 y el sugerido. El golden queda versionado; si alguien cambia la lógica, el test falla.

### 4.4 Póliza (on-chain, opcional)

- **Gating (AC-13):** `PolizaFuji` devuelve `null` si `!isConnected`, si `chain?.id !== avalancheFuji.id` (en ese caso muestra un aviso con "Cambiar a Fuji") o si `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT` no pasa `addressSchema`. Arriba del bloque siempre se muestra un `ConnectWallet` pequeño con el texto "Opcional: conecta una wallet de prueba en Fuji".
- **Escritura (AC-14):** el clic abre un resumen en línea ("Vas a pagar X AVAX en Avalanche Fuji (testnet) por la póliza de la zona Carumas. Confirmar / Cancelar"). Al confirmar: `getPublicClient(fuji.id).simulateContract({ value })` → `walletClient.writeContract` → `waitForTransactionReceipt`. Se muestra el hash con un link a `avalancheFuji.blockExplorers.default.url/tx/<hash>`. Los errores se muestran con `shortMessage`.
- **ABI tipado (AC-17):** `import { polizaParametricaAbi } from '@/features/contracts/abi/PolizaParametrica'` (`as const`).
- **Contrato:** se copia sin cambios (sin OZ, porque el original no lo usa). El aviso "educativo, no auditado, solo Fuji y wallets de prueba" aparece en la UI, en el README y en el NatSpec, que ya lo dice.

### 4.5 Test plan

| Nivel | Archivo | Qué cubre |
|-------|---------|-----------|
| Unit | `services/__tests__/rotacion.golden.test.ts` | AC-1: igualdad numérica (1e-9) y de razones ES con el MVP, en las 4 zonas × 3 escenarios × presets |
| Unit | `services/__tests__/rotacion.test.ts` | AC-2: errores por < 5 o < 3 campañas; meses incompletos descartados; asignación oct-dic / ene-abr |
| Unit | `services/__tests__/nasa.test.ts` | normalización: -999 → null, mes 13 ignorado, mm/día × días (incluye febrero bisiesto) |
| Unit | `services/__tests__/enso.test.ts` | `fase()` |
| Unit | `api/field-shift/nasa/__tests__/route.test.ts` | AC-3/4/5 con fetch mockeado |
| Component | `components/__tests__/FieldShiftDemo.test.tsx` | AC-8/9/10/11 con fetch mockeado y snapshot de Carumas |
| Component | `components/__tests__/PolizaFuji.test.tsx` | AC-13/14/15 con wagmi mockeado |
| i18n | `npm run i18n:sync` | AC-12, sin claves faltantes |
| Forge | `contracts/test/PolizaParametrica.t.sol` | AC-16: 6 tests |
| E2E | `e2e/field-shift.spec.ts` | AC-7, AC-19: 5 clics en ES + EN, sin sesión |

## 5. Constraint Directives (anti-alucinación)

### OBLIGATORIO
- Copiar la lógica de `field-shift-mvp/web/*.js` **línea por línea** a TypeScript, con los mismos nombres de función (`analizarClima`, `recomendarRotaciones`, `backtest`, `umbralSugerido`). La paridad la decide el golden, no el criterio del dev.
- Páginas: patrón `setRequestLocale` de `contracts/page.tsx`. Componentes: `'use client'` + `useTranslations('fieldShift')`.
- Validar con Zod el query `zona`, la respuesta de NASA y la dirección del contrato (`addressSchema` de `shared/lib/web3/validation.ts`).
- Todo texto visible debe salir de `messages/*.json`. Nada de strings en JSX.
- Verificar `chainId === 43113` antes de firmar y mostrar un resumen previo.
- Tests en patrón AAA. Archivos de 500 líneas como máximo y funciones de 50 como máximo (`recomendarRotaciones` y `explicar` se parten en helpers si hace falta, sin cambiar las fórmulas).

### PROHIBIDO
- NO tocar `src/actions/**`, `src/features/auth/**`, `src/features/wallet/**` (solo se importa), `supabase/**` ni la lógica de auth del middleware (solo se agrega el early-return).
- NO agregar dependencias npm. Todo lo necesario ya está: zod, wagmi, viem y next-intl. Las librerías de Foundry se instalan con `forge install --no-git` en `contracts/lib/`, que sigue ignorado.
- NO cambiar valores agronómicos, listas ENSO, umbrales ni fórmulas del MVP.
- NO aceptar lat/lon libres en el route handler, para que no sea un proxy abierto.
- NO usar claves privadas en el frontend. Los scripts Forge leen `PRIVATE_KEY` del entorno y no se versiona ningún `.env`.
- NO desplegar a Fuji ni enviar transacciones desde esta sesión.
- NO usar `any`.

## 6. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| No hay internet en F3 para bajar los snapshots | Sin snapshots no hay golden ni modo offline. Si NASA POWER no responde en F3, me detengo y te aviso. |
| NASA POWER actualiza datos históricos (reprocesos) | Los golden usan los **snapshots versionados**, no la API en vivo, así que el test es determinista. |
| Next 16 cachea fetch distinto a lo esperado | `next: { revalidate: 86400 }` explícito; el test del handler mockea `fetch` y no depende de la caché. |
| Wi-fi del workshop | `FIELD_SHIFT_OFFLINE=true` sirve snapshots sin intentar la red (no espera 8 s por zona). |
| `forge install` necesita internet | Se corre en F3 y se documenta en el README como paso previo al workshop. |

## 7. Implementation Readiness Check

```
[x] Cada AC tiene al menos 1 archivo asociado (§4.1, columna ACs)
[x] Cada archivo tiene exemplar válido (§3, verificados con ls/cat)
[x] Sin [NEEDS CLARIFICATION] pendientes
[x] Constraint Directives con ≥ 3 PROHIBIDO (7)
[x] Context Map con ≥ 2 archivos leídos (13)
[x] Scope IN/OUT explícitos (work-item.md)
[x] BD: N/A (no se toca)
```

## 8. Pendientes fuera del SDD
- `git push -u origin fix/hardening-mvp-base`: lo corre Fer (falta de credenciales en esta sesión).
- Deploy a Fuji: lo hace Fer con una wallet de prueba; luego pone la dirección en `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT`.
