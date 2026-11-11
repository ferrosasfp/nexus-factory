# Validación — HU #001 Field Shift

Fecha: 2026-11-10 · QA · Veredicto: **APROBADO CON OBSERVACIONES**

## Runtime / evidencia ejecutada
- Golden: respaldé golden.json, regeneré con `node scripts/field-shift-golden.mjs <MVP>`, `assert.deepStrictEqual` (sin `generado`) = IGUAL. Restauré el original, `cmp` OK (byte a byte).
- `npm run qa` exit 0: typecheck, eslint --max-warnings 0, vitest 17 archivos / 243 tests passed, build OK.
- `npm run contracts:test`: 22 passed, 0 failed (6 PolizaParametrica + 8 SampleToken + 8 SampleNFT).
- `npm run i18n:sync`: "All locales are in sync!".
- `FIELD_SHIFT_OFFLINE=true npx playwright test e2e/field-shift.spec.ts`: 2 passed.
- Dev server sin env Supabase (puerto 3000 libre antes): /es/field-shift 200 sin redirect, /en/field-shift 200 ("Query NASA"); /api/field-shift/nasa?zona=carumas 200 origen "nasa"; ?zona=lima 400; ?lat=1&lon=1 400; sin zona 400. Servidor detenido.
- NO VERIFICABLE por curl: dev con FIELD_SHIFT_OFFLINE=true (un taskkill global de node.exe fue bloqueado; no lo repetí). Cubierto por route.test y por el e2e, que corre con la variable.

## ACs
AC-1..AC-20: todos PASS. Evidencia: golden test (AC-1), rotacion.test (AC-2), route.test + curl (AC-3/4/5), script npm (AC-6), curl + middleware.ts:30-34 + e2e (AC-7), e2e + FieldShiftDemo.test (AC-8..11), i18n:sync + /en (AC-12), PolizaFuji.test + usePoliza.ts:87 chain check (AC-13/14), messages es/en.json:242 + README.md:237 (AC-15), forge 22/22 (AC-16), abi/PolizaParametrica.{json,ts} (AC-17), DeployPoliza/ReportarIndice + scripts npm (AC-18), qa+forge+e2e verdes (AC-19), README.md:199 (AC-20).

## Constraints
- middleware.ts: solo agrega el bloque público. Sin cambios en src/actions, features/auth, features/wallet, supabase/, playwright/vitest config, package-lock. package.json solo scripts (sin deps).
- Sin `any`; archivo más grande 249 líneas; PolizaParametrica.sol idéntico (cmp) al MVP; sin strings hardcodeadas en JSX (spot check); aria-live y role=img presentes; AAA en tests.

## Drift
- sync-abi compilationTarget fallback: OK. Claves i18n extra: OK. Umbral derivado: OK. Póliza tras carga de datos: OK. Link spaceappschallenge.org: OK.
- MENOR: README.md:118 reescribe la línea "Adding an EVM chain = 1 line…" (fuera de scope; Story File: no reescribir el resto).
- MENOR: test-results/ (artefacto Playwright) no está en .gitignore; no commitear.
Sin BLOQUEANTES.
