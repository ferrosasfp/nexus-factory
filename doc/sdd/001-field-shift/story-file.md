# Story File — #001: Field Shift

> SDD: doc/sdd/001-field-shift/sdd.md (SPEC_APPROVED 2026-11-10)
> Fecha: 2026-11-10
> Branch: feat/001-field-shift
> **Dev: este es el ÚNICO documento que necesitas.** Si algo no está aquí, PARA y escala.

---

## Goal

Portar el MVP vanilla `field-shift-mvp` (fuente: `C:\Users\Usuario\Documents\AVAX-NASA\MVP\field-shift-mvp`) a una feature **pública** de NexusFactory en `/[locale]/field-shift`. Se usa en un workshop de NASA Space Apps en Moquegua (Perú) y como base del hackathon. Incluye: clima de la campaña con NASA POWER (respaldo offline), escenarios El Niño/La Niña, rotación recomendada por prioridades, backtest del seguro y un bloque opcional para la póliza paramétrica en Avalanche Fuji. Las recomendaciones deben dar **exactamente** lo mismo que el MVP; un golden test lo verifica.

## Ya hecho por Architect (W0, no rehacer)

- `src/features/field-shift/data/zonas.json`: `[{id, lat, lon}]` de carumas, ichuna, ubinas y yunga.
- `src/features/field-shift/data/{carumas,ichuna,ubinas,yunga}.json`: respuesta **cruda** de NASA POWER mensual 2001-2025 (`properties.parameter.{PRECTOTCORR,T2M,T2M_MIN,GWETROOT}["YYYYMM"]`; el mes `13` es el promedio anual).
- `scripts/field-shift-datos.mjs`: regenera los snapshots.
- `scripts/field-shift-golden.mjs` + `src/features/field-shift/services/__tests__/fixtures/golden.json`: salida del MVP original. Estructura:
  `golden.presets` (6 presets de prioridades); `golden.zonas[id] = { meses, escenarios: { todas|nino|nina: { clima, recomendaciones: { <preset>: Rotacion[3] } } | { error } }, umbralSugerido, backtests: { "<umbral>": PuntoBacktest[] } }`.
  Las razones del golden son **strings en español** del MVP.
- `contracts/lib/forge-std` y `contracts/lib/openzeppelin-contracts`, instalados con `forge install --no-git` (la carpeta está en .gitignore).

## Acceptance Criteria (EARS)

- **AC-1** WHEN se ejecutan `analizarClima`, `recomendarRotaciones`, `backtest` y `umbralSugerido` portados sobre los snapshots (4 zonas × 3 escenarios × presets), THE services SHALL igualar el golden (números con tolerancia 1e-9; razones ES string por string).
- **AC-2** IF hay < 5 campañas completas o < 3 en el escenario, THEN THE servicio SHALL lanzar `FieldShiftError` y THE UI SHALL mostrar el mensaje traducido sin romperse.
- **AC-3** WHEN se llama `GET /api/field-shift/nasa?zona=<id>`, THE handler SHALL consultar NASA POWER (mismos parámetros), normalizar, cachear 24 h y responder `{ zona, origen: 'nasa', meses }`.
- **AC-4** IF NASA falla, tarda > 8 s o devuelve JSON inválido (o `FIELD_SHIFT_OFFLINE=true`), THEN THE handler SHALL responder con el snapshot (`origen: 'offline'`) y THE UI SHALL mostrar el origen.
- **AC-5** IF `zona` no es válida, THEN THE handler SHALL responder 400. No acepta lat/lon.
- **AC-6** WHEN se corre `npm run field-shift:datos` con internet, THE script SHALL regenerar los snapshots (ya existe; solo falta el script npm).
- **AC-7** WHEN un visitante sin sesión abre `/es/field-shift` o `/en/field-shift`, THE app SHALL mostrar la página sin redirigir y sin llamar a Supabase.
- **AC-8** WHEN el usuario elige Carumas y presiona "Consultar NASA", THE página SHALL mostrar las 6 tarjetas del MVP con sus alertas.
- **AC-9** WHEN el escenario cambia a "Solo años El Niño", THE tarjetas y rotaciones SHALL recalcularse. El backtest no cambia.
- **AC-10** WHEN se mueve un slider de prioridad (0-3), THE top 3 SHALL recalcularse al instante (puntaje, barras y razones).
- **AC-11** WHEN se mueve el umbral (0.20-0.90, paso 0.005), THE gráfico SHALL marcar las campañas que pagan y con "N" las de El Niño, y mostrar el resumen.
- **AC-12** WHILE el locale sea `en`, THE página SHALL estar entera en inglés; `npm run i18n:sync` sin faltantes.
- **AC-13** WHILE no haya wallet conectada en Fuji (43113) o no exista `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT` válida, THE bloque de póliza SHALL estar oculto.
- **AC-14** WHEN hay wallet en Fuji, THE bloque SHALL mostrar la zona, la prima con y sin rotación, "Comprar póliza" y "Reclamar pago"; un resumen antes de firmar; y el hash con link a Snowtrace testnet.
- **AC-15** THE bloque y el README SHALL decir que el contrato es educativo, no auditado, y solo para Fuji con wallets de prueba.
- **AC-16** WHEN `npm run contracts:test`, THE suite SHALL pasar con los 6 tests portados + los existentes.
- **AC-17** WHEN `npm run contracts:sync-abi`, THE ABI de PolizaParametrica SHALL quedar en `src/features/contracts/abi/` (`.json` + `.ts` `as const`) y la feature lo usa tipado.
- **AC-18** THE repo SHALL tener `DeployPoliza.s.sol` y `ReportarIndice.s.sol` con sus scripts npm.
- **AC-19** THE rama SHALL cerrar con `npm run qa`, `npm run contracts:test` y `e2e/field-shift.spec.ts` en verde.
- **AC-20** THE README SHALL tener "Cómo levantar Field Shift localmente".

## Files to Modify/Create

| # | Archivo | Acción | Qué hacer | Exemplar |
|---|---------|--------|-----------|----------|
| 1 | `src/features/field-shift/types/index.ts` | Crear | Tipos: `Mes {anio, mes, lluvia, temp, tmin, humedad: number\|null}`, `Escenario = 'todas'\|'nino'\|'nina'`, `Fase = 'nino'\|'nina'\|'neutro'`, `CultivoId`, `Cultivo`, `ZonaId`, `Zona`, `Campania`, `Clima`, `Prioridades {comida, ingreso, suelo, clima}`, `Componentes`, `Razon` (unión discriminada, ver §Razones), `Rotacion {anio1, anio2, total, componentes, razones: Razon[]}`, `PuntoBacktest {etiqueta, fase, indice, paga}`, `OrigenDatos = 'nasa'\|'offline'`, `RespuestaNasa {zona, origen, meses}` | MVP `web/rotacion.js` |
| 2 | `src/features/field-shift/services/cultivos.ts` | Crear | `CULTIVOS: Record<CultivoId, Cultivo>` con valores **idénticos** a MVP `web/cultivos.js`, **en el mismo orden de claves** (papa, haba, cebada, avena, quinua, maiz), sin `nombre` (el nombre sale de i18n `fieldShift.cultivos.<id>`). `ZONAS: readonly Zona[]` desde `../data/zonas.json`. `esZonaId(x)` | MVP `web/cultivos.js` |
| 3 | `src/features/field-shift/services/enso.ts` | Crear | `EL_NINO`, `LA_NINA`, `fase()`: copia exacta | MVP `web/enso.js` |
| 4 | `src/features/field-shift/services/nasa.ts` | Crear | `ANIO_INICIO=2001`, `ANIO_FIN=2025`, `VARIABLES`, `urlNasaPower(lat, lon)` (mismos params), `nasaPowerSchema` (Zod: `properties.parameter.PRECTOTCORR` es record<string, number>; las otras 3 opcionales), `normalizarNasa(json: unknown): Mes[]` = `ordenar()` del MVP (valida con el schema y lanza Error si falla) | MVP `web/nasa.js` |
| 5 | `src/features/field-shift/services/rotacion.ts` | Crear | `CAMPANIA`, `VENTANA_CRITICA`, `analizarClima`, `recomendarRotaciones`, `backtest`, `umbralSugerido`, `FieldShiftError` (`code: 'CAMPANIAS_INSUFICIENTES'\|'ESCENARIO_INSUFICIENTE'`). Port **línea por línea**. `explicar()` devuelve `Razon[]` (ver §Razones). Si una función pasa de 50 líneas, extrae helpers **sin cambiar el orden de las operaciones** | MVP `web/rotacion.js` |
| 6 | `src/features/field-shift/services/snapshots.ts` | Crear | `import 'server-only'`; imports estáticos de los 4 JSON; `obtenerSnapshot(zona: ZonaId): unknown` | `src/lib/rate-limit.ts` (módulo server) |
| 7 | `src/features/field-shift/services/config.ts` | Crear | `FIELD_SHIFT_CONTRACT`: lee `process.env.NEXT_PUBLIC_FIELD_SHIFT_CONTRACT` (nombre literal) → `addressSchema.safeParse` → `Address \| null`. `FIELD_SHIFT_ZONE_ID`: `BigInt(process.env.NEXT_PUBLIC_FIELD_SHIFT_ZONE_ID ?? '0')` con try/catch → 0n | `src/shared/lib/web3/chains.ts` (lectura de env literal) |
| 8 | `src/features/field-shift/services/razones.ts` | Crear | `formatearRazon(t, razon): string`: traduce una `Razon` con el traductor de next-intl (sirve con `useTranslations` y con `createTranslator`). Une las listas de cultivos con `t('conjuncion')` (" y " / " and ") | — |
| 9 | `src/features/field-shift/services/__tests__/rotacion.golden.test.ts` | Crear | AC-1. Por zona, escenario y preset: `normalizarNasa(snapshot)` deep-equal a `golden.meses`; `analizarClima` vs `golden.clima` (cada número con `toBeCloseTo(x, 9)`; arrays y strings iguales); recomendaciones: `anio1/anio2` iguales, `total` y componentes con 1e-9, y `formatearRazon(createTranslator({locale:'es', messages: es, namespace:'fieldShift'}), r)` **igual** al string del golden; escenarios con `error` → `toThrow(FieldShiftError)`. Backtests y `umbralSugerido` igual. Lee los snapshots con `readFileSync` (el test corre en node/jsdom) | `src/shared/lib/web3/__tests__/chains.test.ts` (AAA) |
| 10 | `src/features/field-shift/services/__tests__/rotacion.test.ts` | Crear | AC-2: < 5 campañas → `CAMPANIAS_INSUFICIENTES`; escenario con < 3 → `ESCENARIO_INSUFICIENTE`; un mes nulo descarta la campaña; oct-dic → campaña del año, ene-abr → año anterior; `backtest` paga si `indice < umbral` (estricto) | idem |
| 11 | `src/features/field-shift/services/__tests__/nasa.test.ts` | Crear | -999 → null; mes 13 ignorado; mm/día × días (feb 2024 = 29); orden por año y mes; JSON inválido → throw; `urlNasaPower` contiene `temporal/monthly/point` y los 4 parámetros | idem |
| 12 | `src/features/field-shift/services/__tests__/enso.test.ts` | Crear | `fase(2015)='nino'`, `fase(2022)='nina'`, `fase(2019)='neutro'` | idem |
| 13 | `src/app/api/field-shift/nasa/route.ts` | Crear | Ver §Route handler | uso en el docblock de `src/lib/rate-limit.ts` |
| 14 | `src/app/api/field-shift/nasa/__tests__/route.test.ts` | Crear | Mockea `global.fetch` y `@/lib/rate-limit`. Casos: 200 nasa; NASA 500 → offline; fetch rechaza (timeout) → offline; JSON sin `properties` → offline; `FIELD_SHIFT_OFFLINE=true` → offline sin llamar a fetch; `zona=lima` / sin zona → 400; rate limit → 429. **Nota:** vitest `include` es `src/**/*.test.{ts,tsx}`, así que cubre esta ruta. Si `server-only` rompe en Vitest, mockéalo con `vi.mock('server-only', () => ({}))` | idem |
| 15 | `middleware.ts` | Modificar | Ver §Middleware. **Solo** ese bloque | — |
| 16 | `src/app/[locale]/field-shift/page.tsx` | Crear | `async` page con `setRequestLocale(locale)` → `<FieldShiftDemo />`. `generateMetadata` con `getTranslations({ locale, namespace: 'fieldShift' })` → title y description | `src/app/[locale]/(main)/contracts/page.tsx` |
| 17 | `src/features/field-shift/hooks/useClima.ts` | Crear | `'use client'`; `consultar(zona)` → `fetch('/api/field-shift/nasa?zona=…')` → `{ meses, origen, zona }`; estados `loading` y `error` (string). Valida la respuesta con Zod (`origen` enum, `meses` array) | `src/features/contracts/hooks/useContractWrite.ts` (estado + try/catch) |
| 18 | `src/features/field-shift/hooks/usePoliza.ts` | Crear | Ver §Póliza | `useContractWrite.ts` |
| 19 | `src/features/field-shift/components/FieldShiftDemo.tsx` | Crear | Orquestador: estado `zonaId` (default `carumas`), `escenario` (default `todas`), `prioridades` (default `{comida:2, ingreso:1, suelo:1, clima:3}`) y `umbral`. `useMemo`: `clima = analizarClima(meses, escenario)` en try/catch (FieldShiftError → mensaje `t('errores.<code>')`); `climaTodas = analizarClima(meses,'todas')` para el backtest; al llegar datos nuevos, `umbral = umbralSugerido(climaTodas)`. Secciones visibles solo con datos. Encabezado: título, subtítulo y el aviso de que los valores agronómicos son aproximados (validar con un agrónomo) y que la celda NASA cubre ~50 km | `ConnectWallet.tsx` |
| 20 | `…/components/ZonaSelector.tsx` | Crear | `<select data-testid="fs-zona">` con `t('zonas.<id>')`; `<button data-testid="fs-consultar">` "Consultar NASA" (deshabilitado mientras carga); `<p data-testid="fs-estado" aria-live="polite">` con cargando / listo + origen (`t('origen.nasa'\|'origen.offline')`) / error | idem |
| 21 | `…/components/TarjetasClima.tsx` | Crear | Port de `pintarClima` (MVP `app.js`). `<select data-testid="fs-escenario">` con las 3 opciones; el texto del período; 6 tarjetas `data-testid="fs-tarjeta"` (la de El Niño solo si `lluviaNino !== null`), con clase de alerta en los mismos umbrales (El Niño ≤ -10 %, sequía ≥ 0.2, helada ≥ 0.2, tendencia ≤ -10 %). Valores preformateados igual que el MVP (`Math.round`, `toFixed(1)`, signo `+`) | idem |
| 22 | `…/components/Prioridades.tsx` | Crear | 4 `<input type="range" min=0 max=3 step=1 data-testid="fs-prioridad-<k>">` con `<label>` asociado y valor visible | idem |
| 23 | `…/components/Rotaciones.tsx` | Crear | Port de `pintarRecomendaciones`: 3 `<article data-testid="fs-rotacion">`; "1. Año 1: X → Año 2: Y", "Puntaje N/100" (`Math.round(total*100)`), barras por componente (`min(1,v)`), lista de razones con `formatearRazon(t, r)` | idem |
| 24 | `…/components/BacktestSeguro.tsx` | Crear | Port de `pintarBacktest`: `<input type="range" data-testid="fs-umbral" min=0.20 max=0.90 step=0.005>`, valor con `toFixed(3)`, SVG (mismas dimensiones; colores con clases Tailwind o `currentColor`), "N" sobre las barras El Niño, `<title>` por barra traducido, leyenda; resumen `<p data-testid="fs-backtest-resumen">` con `t('backtest.resumen', {pagos, total, lista, nino})` o `t('backtest.ninguno')` | idem |
| 25 | `…/components/PolizaFuji.tsx` | Crear | Ver §Póliza | idem |
| 26 | `…/components/__tests__/FieldShiftDemo.test.tsx` | Crear | Mock de `next-intl` (`useTranslations: () => (k, p) => p ? k + JSON.stringify(p) : k`), mock de `global.fetch` que devuelve `{zona:'carumas', origen:'offline', meses: golden.zonas.carumas.meses}`, mock de `../PolizaFuji` (retorna null). Flujo: clic en consultar → 6 tarjetas; cambiar escenario a `nino` → cambia el top 1 (`papa`→`haba` vs `haba`→`quinua` en todas, según el golden); cambiar el slider → cambia el ranking; cambiar el umbral → cambia el resumen. Error de fetch → mensaje de error | `src/features/contracts/__tests__/ContractWriter.test.tsx` |
| 27 | `…/components/__tests__/PolizaFuji.test.tsx` | Crear | Mock de `@/features/wallet/hooks/useWallet`, `../../hooks/usePoliza` y `../../services/config`. Sin conexión → solo el texto "opcional" + ConnectWallet (mockeado), sin `fs-poliza`; chain ≠ 43113 → aviso + botón cambiar red; sin contrato → no se muestra el bloque; Fuji + contrato → `fs-poliza` visible con el aviso "no auditado"; "Comprar" → muestra el resumen → "Confirmar" llama a `comprar(true)` | idem |
| 28 | `src/features/field-shift/index.ts` | Crear | `export { FieldShiftDemo } from './components/FieldShiftDemo'` | `src/features/wallet/components/index.ts` |
| 29 | `messages/es.json`, `messages/en.json` | Modificar | Agregar el namespace `fieldShift` (§i18n). Mismas claves en ambos | — |
| 30 | `contracts/src/PolizaParametrica.sol` | Crear | Copia **byte por byte** de MVP `contrato/contracts/PolizaParametrica.sol` | — |
| 31 | `contracts/test/PolizaParametrica.t.sol` | Crear | Ver §Forge tests | `contracts/test/SampleToken.t.sol` |
| 32 | `contracts/script/DeployPoliza.s.sol` | Crear | Ver §Forge scripts | `contracts/script/DeployToken.s.sol` |
| 33 | `contracts/script/ReportarIndice.s.sol` | Crear | Ver §Forge scripts | idem |
| 34 | `scripts/sync-abi.mjs` | Modificar | (a) Sincronizar solo los artefactos cuyo `artifact.ast?.absolutePath` empiece por `src/` (hoy copiaría Test, Vm, etc. de forge-std). (b) Además del `.json`, escribir `<Name>.ts`: `// Generado por scripts/sync-abi.mjs. No editar.\nexport const <camelName>Abi = <json> as const\n` (camelName: primera letra en minúscula, ej. `polizaParametricaAbi`) | el propio archivo |
| 35 | `src/features/contracts/abi/*.{json,ts}` | Generar | `npm run contracts:build && npm run contracts:sync-abi`; versionar el resultado | — |
| 36 | `package.json` | Modificar | Scripts: `"field-shift:datos": "node scripts/field-shift-datos.mjs"`, `"field-shift:golden": "node scripts/field-shift-golden.mjs"`, `"contracts:install": "cd contracts && forge install --no-git foundry-rs/forge-std@v1.9.4 OpenZeppelin/openzeppelin-contracts@v5.1.0"`, `"contracts:deploy:poliza:fuji": "cd contracts && forge script script/DeployPoliza.s.sol --rpc-url fuji --broadcast"`, `"contracts:reportar:fuji": "cd contracts && forge script script/ReportarIndice.s.sol --rpc-url fuji --broadcast"`. No toques los demás | — |
| 37 | `.env.example` | Modificar | Agregar al final la sección `# ─── Field Shift (demo pública) ───` con `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT=` (dirección en Fuji tras el deploy), `NEXT_PUBLIC_FIELD_SHIFT_ZONE_ID=0` y `FIELD_SHIFT_OFFLINE=` (true = usar snapshots sin red), con un comentario por línea | — |
| 38 | `e2e/field-shift.spec.ts` | Crear | Ver §E2E | `e2e/navigation.spec.ts` |
| 39 | `README.md` | Modificar | Agregar la sección `## Cómo levantar Field Shift localmente` (§README). No reescribas el resto | — |

## Razones (i18n estructurado)

`Razon` es una unión discriminada por `clave`. Los parámetros ya vienen **redondeados como en el MVP**, y las listas son `CultivoId[]` **deduplicadas** (equivale a `[...new Set(...)]`):

| clave | params | Cuándo (copia exacta de `explicar()`) |
|-------|--------|--------------------|
| `aguaCubre` | `cultivo, mm, escenario` | `a.agua >= 1` (a1 siempre; a2 solo si `distintos`) |
| `aguaParcial` | `cultivo, mm, escenario, pct` (`Math.round(a.agua*100)`) | si no |
| `sequiaTolerantes` | `pct, escenario, cultivos` | `frecuenciaSequia >= 0.2` y hay tolerantes (`toleranciaSequia >= 4`) |
| `sequiaNinguno` | `pct, escenario` | idem, sin tolerantes |
| `heladaSensibles` | `pct, cultivos` | `riesgoHelada >= 0.2` y hay sensibles (`<= 2`) |
| `heladaResistentes` | `pct, cultivos` | idem, sin sensibles y con resistentes (`>= 4`) |
| `leguminosa` | — | `leguminosa` |
| `papaPrimero` | — | `p === 'papa' && distintos` |
| `repite` | — | `!distintos` |

`mm = Math.round(clima.lluvia)`. **El orden de push es el del MVP.**

`formatearRazon(t, r)` arma el string con estas claves (`t` con namespace `fieldShift`):
- Nombres de cultivo: `t('cultivos.<id>')`. Lista de cultivos: `nombres.join(t('conjuncion'))`.
- `cuando`: `t('razones.cuando.<escenario>')`; `de`: `t('razones.de.<escenario>')`.

Mensajes **ES** (deben reproducir el MVP carácter por carácter; el golden lo verifica):

```json
"cultivos": { "papa": "Papa", "haba": "Haba", "cebada": "Cebada", "avena": "Avena forrajera", "quinua": "Quinua", "maiz": "Maíz amiláceo" },
"conjuncion": " y ",
"razones": {
  "cuando": { "todas": "en promedio", "nino": "en años El Niño", "nina": "en años La Niña" },
  "de": { "todas": "de los años", "nino": "de los años El Niño", "nina": "de los años La Niña" },
  "aguaCubre": "{cultivo}: la lluvia de la campaña ({mm} mm {cuando}) cubre lo que necesita.",
  "aguaParcial": "{cultivo}: la lluvia de la campaña ({mm} mm {cuando}) cubre solo el {pct}% de lo que necesita.",
  "sequiaTolerantes": "Hubo campaña seca en {pct}% {de}; {cultivos} la resiste bien.",
  "sequiaNinguno": "Ojo: hubo campaña seca en {pct}% {de} y ninguno de estos cultivos la tolera bien.",
  "heladaSensibles": "Ojo con las heladas ({pct}% de los meses de campaña bajo 0 °C): {cultivos} es sensible al frío.",
  "heladaResistentes": "Hay heladas en {pct}% de los meses de campaña; {cultivos} las aguanta bien.",
  "leguminosa": "Incluye haba, una leguminosa que devuelve nitrógeno al suelo.",
  "papaPrimero": "Sigue la lógica de la rotación andina: la papa primero, cuando el suelo está más descansado.",
  "repite": "Repite el mismo cultivo: el suelo se cansa y las plagas se acumulan."
}
```

Pasa `mm` y `pct` **como string** (`String(n)`) para que ICU no aplique separadores de miles por locale. **EN:** traducción natural con los mismos placeholders (`conjuncion: " and "`; cultivos: Potato, Fava bean, Barley, Forage oats, Quinoa, Starchy maize).

## i18n — namespace `fieldShift` (resto de claves)

Traduce los textos del MVP (`web/index.html` y `web/app.js`) a claves. Las claves mínimas son las que usan los componentes: `title` ("Field Shift: adapta tu chacra con datos de NASA"), `subtitle`, `metaDescription`, `avisoDatos`, `zonas.<id>` ("Carumas, Mariscal Nieto", etc., de MVP `cultivos.js`), `consultar` ("Consultar NASA"), `cargando`, `listo` ("Listo: {zona} · {origen}"), `origen.nasa` ("NASA POWER (en vivo)"), `origen.offline` ("NASA POWER (copia guardada)"), `errorDatos`, `errores.CAMPANIAS_INSUFICIENTES`, `errores.ESCENARIO_INSUFICIENTE` (textos del MVP), `escenario.label`, `escenario.todas|nino|nina` (opciones del `<select>` de `index.html`), `escenario.periodo.*`, `tarjetas.*` (las 6 etiquetas de `pintarClima`), `prioridades.titulo`, `prioridades.comida|ingreso|suelo|clima` (`NOMBRES_PRIORIDAD`), `rotacion.titulo`, `rotacion.item` ("{n}. Año 1: {a} → Año 2: {b}"), `rotacion.puntaje`, `backtest.titulo`, `backtest.explicacion`, `backtest.umbral`, `backtest.leyendaUmbral`, `backtest.leyendaNino`, `backtest.barra`, `backtest.resumen`, `backtest.ninguno`, `poliza.*` (título, opcional, avisoNoAuditado, cambiarRed, zona, prima, primaRotacion, cobertura, adopto, comprar, reclamar, resumenCompra, resumenReclamo, confirmar, cancelar, confirmaWallet, exito, verTx, sinIndice, indiceReportado). **Corre `npm run i18n:sync`; no debe quedar ninguna clave faltante.**

## Route handler (`src/app/api/field-shift/nasa/route.ts`)

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitApi } from '@/lib/rate-limit'
// + ZONAS/esZonaId, urlNasaPower, normalizarNasa, obtenerSnapshot

const querySchema = z.object({ zona: z.string().refine(esZonaId) })
const TIMEOUT_MS = 8_000
const REVALIDATE_S = 86_400

export async function GET(request: Request) {
  const { success } = await rateLimitApi(request)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const parsed = querySchema.safeParse({ zona: new URL(request.url).searchParams.get('zona') })
  if (!parsed.success) return NextResponse.json({ error: 'Zona inválida' }, { status: 400 })
  // FIELD_SHIFT_OFFLINE === 'true' → snapshot directo
  // try { fetch(urlNasaPower(lat, lon), { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: REVALIDATE_S } }); !ok → throw; normalizarNasa(await r.json()) → origen 'nasa' }
  // catch → normalizarNasa(obtenerSnapshot(zona)) → origen 'offline'  (no loggear la respuesta completa; console.warn con el motivo corto)
  // return NextResponse.json({ zona, origen, meses })
}
```

## Middleware (`middleware.ts`)

Justo después de `if (intlResponse.status === 307 || …) return intlResponse` y **antes** de `createServerClient`:

```ts
  // Rutas públicas sin Supabase (demo Field Shift: sin login ni cookies de sesión)
  const publicLocale = extractLocaleFromPath(request.nextUrl.pathname) ?? routing.defaultLocale
  if (stripLocale(request.nextUrl.pathname, publicLocale).startsWith('/field-shift')) {
    return intlResponse
  }
```

No cambies nada más del archivo.

## Póliza

**`usePoliza.ts`** (`'use client'`):
- Sale temprano si `FIELD_SHIFT_CONTRACT` es null. Lecturas con `getPublicClient(avalancheFuji.id).readContract`: `zonas(ZONE_ID)` (tupla: nombre, umbral, cobertura, primaBase, reportada, disparada, indice, hashDatos, asegurados), `prima(ZONE_ID, true)`, `prima(ZONE_ID, false)` y `tienePoliza(ZONE_ID, address)`. Expone `zona` (umbral/1000, indice/1000, montos con `formatEther`), `primas` y `tienePoliza`, y recarga tras cada tx.
- Escrituras con `useWalletClient()` (wagmi): `comprar(conRotacion)` → `simulateContract({ address, abi: polizaParametricaAbi, functionName: 'comprarPoliza', args: [ZONE_ID, conRotacion], value: prima, account })` → `walletClient.writeContract(request)` → `waitForTransactionReceipt`. `reclamar()`: igual con `reclamar`. **Antes de firmar verifica** `walletClient.chain?.id === avalancheFuji.id` y, si no, lanza un error. Errores: `err.shortMessage ?? err.message`. Estado: `{ hash, pendiente, error }`.

**`PolizaFuji.tsx`**:
- Siempre: título "Capa opcional: póliza en Avalanche Fuji" y "Conecta una wallet de prueba (Core o MetaMask) en Fuji" + `<ConnectWallet />` (import desde `@/features/wallet/components`).
- `useWallet()` → si `!isConnected` → nada más. Si `chain?.id !== avalancheFuji.id` → aviso + botón "Cambiar a Fuji" (`useNetwork().switchToDefault()`, import directo del hook en `@/features/wallet/hooks/useNetwork`). Si `!FIELD_SHIFT_CONTRACT` → nada más.
- Si no: `<section data-testid="fs-poliza">` con el aviso en caja amarilla `t('poliza.avisoNoAuditado')` ("Contrato educativo, no auditado. Úsalo solo en Fuji con una wallet de prueba, nunca con fondos reales."); la info de la zona; un checkbox "Adopto la rotación recomendada" (checked); los botones Comprar y Reclamar. El clic abre un **resumen inline** (`resumenCompra`: "Vas a pagar {monto} AVAX en Avalanche Fuji (testnet) por la póliza de la zona {zona}.") con Confirmar/Cancelar; solo Confirmar llama al hook. Tras el éxito: `t('poliza.exito')` + `<a href={`${avalancheFuji.blockExplorers.default.url}/tx/${hash}`} target="_blank" rel="noopener noreferrer">`.

## Forge tests (`contracts/test/PolizaParametrica.t.sol`)

`setUp`: `owner = address(this)`, `oraculo = makeAddr("oraculo")`, `productorA`, `productorB` y `extrano` con `makeAddr`; `poliza = new PolizaParametrica(oraculo)`; `vm.deal(address(this), 10 ether)`; enviar 5 ether a `poliza`; `crearZona("Carumas", 450, 1 ether, 0.1 ether)`; `vm.deal` de 1 ether a cada productor. `COBERTURA = 1 ether`, `PRIMA = 0.1 ether`, `HASH = keccak256("datos-nasa-power-carumas-2026")`. Los 6 tests son equivalentes 1:1 a MVP `contrato/test/PolizaParametrica.test.js`:
1. `test_DescuentoRotacion`: `prima(0,false)==0.1 ether`, `prima(0,true)==0.08 ether`.
2. `test_RechazaPrimaIncorrectaYSegundaPoliza`: `vm.expectRevert(abi.encodeWithSelector(PolizaParametrica.PrimaIncorrecta.selector, 0.08 ether))`; luego compra OK; segunda compra → `YaAsegurado.selector`.
3. `test_SoloOraculoReporta`: `extrano` → `SoloOraculo.selector`.
4. `test_PagaBajoUmbral`: A compra con rotación; `vm.expectEmit(true,false,false,true)` + `emit IndiceReportado(0, 380, true, HASH)`; `reclamar` → el balance de A sube 1 ether y el del contrato baja 1 ether; segundo reclamo de A → `SinPago`; B → `SinPago`.
5. `test_NoPagaSobreUmbral`: índice 520 → `SinPago`.
6. `test_NoVendeTrasReporte`: reporta 380 → comprar → `YaReportada`.
El test necesita `receive()` en el contrato de test solo si recibe ETH (no lo recibe). Para emitir el evento en el test, re-declara el evento en el contrato de test o usa `emit PolizaParametrica.IndiceReportado(...)` (Solidity ≥ 0.8.21).

## Forge scripts

- `DeployPoliza.s.sol`: `PRIVATE_KEY` por env (patrón de DeployToken); `new PolizaParametrica(deployer)` (deployer = oráculo, como en el MVP); `crearZona("Carumas", 450, 0.05 ether, 0.01 ether)`; `payable(address(poliza)).call{value: 0.2 ether}("")` con require; `console.log` de la dirección + "Copia esta direccion en NEXT_PUBLIC_FIELD_SHIFT_CONTRACT". Comentario: "Solo Fuji y wallet de pruebas".
- `ReportarIndice.s.sol`: `PRIVATE_KEY`, `vm.envAddress("CONTRATO")`, `vm.envOr("ZONA", uint256(0))`, `vm.envUint("INDICE")` (humedad × 1000; require ≤ type(uint16).max) y `vm.envOr("HASH", bytes32(0))` → `reportarIndice(zona, uint16(indice), hash)`; log de si quedó disparada.

## E2E (`e2e/field-shift.spec.ts`)

Funciona con y sin internet: no asertes números concretos, solo estructura y cambios.
1. `/es/field-shift` → `toHaveURL(/\/es\/field-shift/)` (sin redirect a login). Clic 1: `selectOption('carumas')` + clic en `fs-consultar` → `fs-estado` contiene "Listo" (timeout 20 s).
2. Clic 2: 6 `fs-tarjeta` visibles.
3. Clic 3: `fs-escenario` → `nino` → el texto del primer `fs-rotacion` cambia o el período dice "El Niño".
4. Clic 4: `fs-prioridad-ingreso` → `fill('3')` → existen 3 `fs-rotacion`.
5. Clic 5: `fs-umbral` → `fill('0.6')` → `fs-backtest-resumen` cambia de texto, el SVG tiene ≥ 1 `text` "N".
6. `fs-poliza` no existe (sin wallet).
Además, `/en/field-shift` muestra el botón "Query NASA" (o el texto EN que definas).

## README — sección nueva

`## Cómo levantar Field Shift localmente`, con: qué es (2 líneas + el link al reto); requisitos (Node 20+, Foundry opcional); `npm ci` + `npm run dev` → `http://localhost:3000/es/field-shift` (no requiere Supabase ni login); **sin wifi**: los datos ya vienen en el repo; `FIELD_SHIFT_OFFLINE=true npm run dev` evita esperar a la red y `npm run field-shift:datos` actualiza los snapshots; tests (`npm run test`, `npm run test:e2e -- field-shift`, `npm run field-shift:golden -- <ruta-mvp>`); contrato: `npm run contracts:install`, `npm run contracts:test`, `contracts/.env` con `PRIVATE_KEY` **de una wallet de pruebas**, `npm run contracts:deploy:poliza:fuji`, `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT` y `CONTRATO=0x… INDICE=380 npm run contracts:reportar:fuji`; el aviso en negrita "**Contrato educativo, no auditado; solo Fuji y wallets de prueba**"; las limitaciones del MVP (celda de 50 km, valores agronómicos aproximados, T2M_MIN mensual, lluvia NASA vs Senamhi); y las "Ideas para el hackathon" (lista del README del MVP).

## Constraint Directives

### OBLIGATORIO
- Lógica: copiar `web/rotacion.js`, `cultivos.js`, `enso.js` y `nasa.js` del MVP **línea por línea** (mismas fórmulas, mismo orden de operaciones y de claves). La paridad la decide el golden.
- Páginas: patrón `setRequestLocale` de `contracts/page.tsx`. Componentes: `'use client'` + `useTranslations('fieldShift')` + Tailwind.
- Zod para el query `zona`, la respuesta de NASA, la respuesta del handler en el cliente y la dirección del contrato (`addressSchema`).
- Cero strings visibles en JSX: todo sale de `messages/*.json`.
- `chainId === 43113` antes de firmar + resumen previo.
- Tests AAA (comentarios `// Arrange`, `// Act`, `// Assert`).
- Máximo 500 líneas por archivo y 50 por función. TypeScript estricto, sin `any`.
- Accesibilidad: labels asociados a cada input/select, `aria-live` en los estados y `role="img"` + `aria-label` en el SVG.

### PROHIBIDO
- NO tocar `src/actions/**`, `src/features/auth/**`, `src/features/wallet/**` (solo importar), `supabase/**`, ni la lógica de auth del middleware.
- NO agregar dependencias npm (ninguna).
- NO cambiar valores agronómicos, listas ENSO, umbrales ni fórmulas.
- NO aceptar lat/lon en el handler.
- NO poner claves privadas en el frontend ni versionar `.env`.
- NO desplegar a Fuji ni enviar transacciones reales.
- NO modificar el golden ni los snapshots para que un test pase. Si el golden no coincide, el port está mal: corrige el port.
- NO tocar `playwright.config.ts` ni `vitest.config.ts`.

## Waves

- **W1 (lógica):** #1-5, #8 y #9-12, más #29 (al menos `cultivos`, `conjuncion` y `razones` en ES/EN, que el golden necesita). Gate: `npx vitest run src/features/field-shift` en verde.
- **W2 (datos y ruta):** #6, #13, #14 y #15. Gate: tests del handler en verde.
- **W3 (contrato):** #30-35. Gate: `npm run contracts:test` y `contracts:sync-abi` OK.
- **W4 (UI):** #7, #16-28 y el resto de #29. Gate: tests de componentes + `npm run i18n:sync` + `npm run typecheck`.
- **W5 (cierre):** #36-39. Gate: `npm run qa` + `npm run contracts:test` + `FIELD_SHIFT_OFFLINE=true npx playwright test e2e/field-shift.spec.ts`.

## Out of Scope
Auth, wallet linking, `user_files`, migraciones, Supabase, coordenadas libres, valles con riego, NDVI/SMAP/Chainlink/mapa, deploy real, enlace desde el home y cambios de lógica.

## Escalation Rule
Si algo no está en este Story File, o el golden no cuadra después de revisar el port contra el MVP, **PARA y reporta**. No inventes ni "arregles" la lógica.
