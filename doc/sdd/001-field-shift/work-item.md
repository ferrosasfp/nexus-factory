# Work Item #001 — Field Shift

> Modo pedido: LAUNCH, con gates HU_APPROVED y SPEC_APPROVED a pedido del CTO.
> Dueño: Fer (CTO). Uso: workshop "Field Shift: Adapting Farms with NASA Data" (Team1 Avalanche, Moquegua) y base para los equipos del NASA Space Apps Challenge 2026 (14-15 nov).
> Referencia que se porta (no se reinventa): `C:\Users\Usuario\Documents\AVAX-NASA\MVP\field-shift-mvp`.

| Campo | Valor |
|-------|-------|
| **#** | 001 |
| **Tipo** | feature |
| **SDD_MODE** | full |
| **Objetivo** | Portar el MVP vanilla de Field Shift a una feature pública de NexusFactory (`/[locale]/field-shift`): clima de la campaña con NASA POWER, escenarios El Niño/La Niña, rotación recomendada según prioridades, backtest del seguro y, opcionalmente, la póliza paramétrica en Avalanche Fuji. |
| **Branch** | `feat/001-field-shift` (desde `fix/hardening-mvp-base`) |

## Historia de usuario

Como productor o participante del workshop, quiero elegir mi zona y ver la lluvia de la campaña, las campañas secas, las heladas y cómo fueron los años El Niño. También quiero ajustar mis prioridades y recibir una rotación recomendada. De forma opcional, quiero simular una póliza paramétrica en Avalanche Fuji.

## Reglas de negocio (heredadas del MVP, sin cambios)

- **RN-1 Campaña:** de octubre a abril. Octubre a diciembre pertenecen a la campaña que empieza ese año; enero a abril, a la del año anterior. Solo cuentan las campañas con 7 meses completos (lluvia, humedad y tmin no nulos). Hacen falta al menos 5.
- **RN-2 Índice del seguro:** humedad del suelo (GWETROOT) promedio de diciembre a febrero.
- **RN-3 Campaña seca:** lluvia de la campaña < 75 % del promedio de **todas** las campañas.
- **RN-4 Escenarios:** `todas`, `nino` o `nina` (listas RONI de `enso.js`). Un escenario necesita al menos 3 campañas. La tendencia y la "lluvia normal" se calculan siempre con todas las campañas.
- **RN-5 Riesgo de helada:** fracción de meses de la campaña con T2M_MIN < 0 °C.
- **RN-6 Rotación:** se evalúan las 36 combinaciones de año 1 → año 2 sobre 6 cultivos, con la misma fórmula de aptitud y los mismos componentes (`comida`, `ingreso`, `suelo`, `clima`) y razones. Se devuelve el top 3.
- **RN-7 Backtest:** la póliza paga si índice < umbral. El backtest usa siempre todas las campañas, aunque cambie el escenario. El umbral sugerido es el percentil 20 + 0.0005.
- **RN-8 Contrato:** 20 % de descuento por rotación resiliente, un solo oráculo y patrón pull para reclamar. Es **educativo y no está auditado**; solo se usa en Fuji con wallets de prueba.

## Acceptance Criteria (EARS)

### Paridad de lógica
- **AC-1** WHEN se ejecutan `analizarClima`, `recomendarRotaciones`, `backtest` y `umbralSugerido` portados sobre los datos precargados de las 4 zonas y los 3 escenarios, THE services de `src/features/field-shift/services/` SHALL devolver los mismos resultados que el JS original del MVP (golden tests Vitest en patrón AAA, con tolerancia de 1e-9).
- **AC-2** IF hay menos de 5 campañas completas, o menos de 3 en el escenario elegido, THEN THE servicio SHALL lanzar un error tipado y THE UI SHALL mostrar el mensaje traducido sin romper la página.

### Datos NASA POWER
- **AC-3** WHEN el cliente pide `GET /api/field-shift/nasa?zona=<id>`, THE route handler SHALL consultar NASA POWER (mismos parámetros que el MVP), normalizar la respuesta y cachearla (revalidación de 24 h). SHALL indicar el origen: `live`, `cache` o `offline`.
- **AC-4** IF NASA POWER falla, no responde en 8 s o devuelve datos inválidos, THEN THE route handler SHALL responder con el snapshot precargado en el repo para esa zona, con `origen: "offline"`, y THE UI SHALL mostrarlo.
- **AC-5** IF `zona` no es una de las 4 zonas válidas (validación Zod), THEN THE route handler SHALL responder 400. El handler no acepta coordenadas libres, para que no sirva como proxy abierto.
- **AC-6** WHEN se corre `npm run field-shift:datos` con internet, THE script SHALL regenerar los snapshots de las 4 zonas en el repo.

### Ruta pública
- **AC-7** WHEN un visitante sin sesión abre `/es/field-shift` o `/en/field-shift`, THE app SHALL mostrar la página sin redirigir a login y sin llamar a Supabase (el middleware se salta `getUser` para esa ruta).

### Flujo de demo en 5 clics (ES y EN)
- **AC-8** WHEN el usuario elige Carumas y presiona "Consultar NASA", THE página SHALL mostrar las tarjetas: lluvia de la campaña, lluvia en años El Niño vs. promedio, % de campañas secas con la lista, tmin típica, % de riesgo de helada y tendencia. Las alertas se marcan con los mismos umbrales del MVP.
- **AC-9** WHEN el usuario cambia el escenario a "Solo años El Niño", THE tarjetas y recomendaciones SHALL recalcularse con ese escenario. El backtest no cambia.
- **AC-10** WHEN el usuario mueve un slider de prioridad (0-3), THE top 3 de rotaciones SHALL recalcularse al instante, con puntaje, barras por componente y razones traducidas.
- **AC-11** WHEN el usuario mueve el slider del umbral (0.20-0.90), THE gráfico SHALL pintar las campañas que pagan, marcar con "N" las de El Niño y mostrar el resumen "pagó en X de Y campañas: …; Z en años El Niño".
- **AC-12** WHILE el locale sea `en`, THE página entera, incluidas las razones de la rotación, SHALL estar en inglés. Todas las claves deben existir en `messages/en.json` y `messages/es.json` (`npm run i18n:sync` sin faltantes).

### Póliza en Fuji (opcional)
- **AC-13** WHILE no haya una wallet conectada en Fuji (chainId 43113), o no esté configurada `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT`, THE bloque de póliza SHALL estar oculto. El resto de la página funciona igual.
- **AC-14** WHEN hay una wallet conectada en Fuji, THE bloque SHALL mostrar los datos de la zona, la prima con y sin rotación y los botones "Comprar póliza" y "Reclamar pago". Antes de firmar SHALL mostrar un resumen (monto y red), y después, el hash con un link a Snowtrace testnet.
- **AC-15** THE UI (bloque de póliza) y el README SHALL indicar que el contrato es educativo, no está auditado y solo debe usarse con wallets de prueba en Fuji.

### Contrato
- **AC-16** WHEN se corre `npm run contracts:test`, THE suite Forge SHALL pasar con los 6 tests portados del MVP más los tests existentes (SampleToken y SampleNFT).
- **AC-17** WHEN se corre `npm run contracts:sync-abi`, THE ABI de `PolizaParametrica` SHALL quedar en `src/features/contracts/abi/`, y la feature SHALL usarlo tipado con viem/wagmi.
- **AC-18** THE repo SHALL incluir `contracts/script/DeployPoliza.s.sol`, con un script npm propio, que despliega, crea la zona Carumas (umbral 450, cobertura 0.05, prima 0.01) y deposita 0.2 AVAX, igual que el `deploy.js` del MVP. También SHALL incluir un script para reportar el índice como oráculo.

### Cierre
- **AC-19** THE rama SHALL cerrar con `npm run qa` y `npm run contracts:test` en verde, y con un spec Playwright `e2e/field-shift.spec.ts` que recorra los 5 clics en ES con datos offline.
- **AC-20** THE README SHALL tener la sección "Cómo levantar Field Shift localmente": dev, datos offline, tests, contrato y deploy a Fuji.

## Scope IN
- `src/features/field-shift/` (services, components, hooks, types, data y tests)
- `src/app/[locale]/field-shift/page.tsx` y `src/app/api/field-shift/nasa/route.ts`
- Una exclusión mínima en `middleware.ts` (solo para saltar Supabase en `/field-shift`)
- `messages/es.json` y `messages/en.json` (namespace `fieldShift`)
- `contracts/src/PolizaParametrica.sol`, `contracts/test/PolizaParametrica.t.sol` y `contracts/script/DeployPoliza.s.sol` + `ReportarIndice.s.sol`
- Scripts npm (`field-shift:datos`, `contracts:deploy:poliza:fuji`, `contracts:reportar:fuji`), README y `.env.example`
- `e2e/field-shift.spec.ts`

## Scope OUT
- Auth, wallet linking, `user_files`, migraciones y Supabase en general (restricción explícita)
- Coordenadas libres (lat/lon) del MVP: quedan como idea para el hackathon y por eso el handler no es un proxy abierto
- Valles con riego, NDVI, SMAP, Chainlink, mapa: todo lo de "Ideas para el hackathon" del MVP queda en el README
- Despliegue real a Fuji: dejo el script listo, pero el deploy lo hace Fer con su wallet de pruebas
- Cambios a la lógica o a los valores agronómicos del MVP

## Discrepancias detectadas entre el prompt y el MVP (requieren decisión)

1. **NASA POWER: el MVP usa la API mensual, no la diaria.** El prompt dice "diario", pero `nasa.js` llama a `/temporal/monthly/point` y convierte mm/día × días del mes. Toda la lógica (campañas, helada = mes con T2M_MIN < 0) es mensual. **Propuesta: mantener mensual**, porque es la única forma de cumplir "mismas recomendaciones que el MVP". Pasar a diario cambia los resultados y la definición de helada.
2. **Prioridades: el MVP tiene 4, la HU menciona 3.** Además de ingreso, suelo y sequía/heladas, el MVP incluye "Comida para la familia" (valores por defecto: comida 2, ingreso 1, suelo 1, clima 3). **Propuesta: mantener las 4** para tener paridad.
3. **El zip del MVP no trae los datos precargados** (no existe `web/data/`). **Propuesta:** en F3 corro el script de descarga (necesita internet) y versiono los 4 JSON (~25 años mensuales, unos pocos KB por zona) en `src/features/field-shift/data/`.
4. **El middleware no tiene una lista de "rutas públicas":** tiene listas de rutas protegidas y de auth, y llama a `supabase.auth.getUser()` en todas las rutas. **Propuesta:** un early-return para `/field-shift` antes de crear el cliente Supabase. No toca la lógica de auth.
5. **Gate de modo:** CLAUDE.md define LAUNCH con `LAUNCH_APPROVED`, pero pediste HU_APPROVED + SPEC_APPROVED. **Propuesta:** sigo tu pedido (gates de QUALITY), con SDD completo y sin AR/CR formales separados. Si quieres AR/CR, dímelo.

## Missing Inputs
- Las decisiones 1-5 (por defecto, las propuestas).
- `git push -u origin fix/hardening-mvp-base` está pendiente: falló por falta de credenciales en esta sesión no interactiva.
- Dirección del contrato en Fuji: después del deploy de Fer, va en `NEXT_PUBLIC_FIELD_SHIFT_CONTRACT`.
