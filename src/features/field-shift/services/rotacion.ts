// Motor de rotación: reglas simples y explicables, a propósito.
// La idea del MVP es que cualquiera pueda leer este archivo y entender
// por qué la app recomienda lo que recomienda.
// Port línea por línea de web/rotacion.js (mismas fórmulas y mismo orden de operaciones).

import { CULTIVOS } from './cultivos'
import { fase } from './enso'
import type {
  Campania,
  Clima,
  Componentes,
  Cultivo,
  CultivoId,
  Escenario,
  Fase,
  Mes,
  Prioridades,
  PuntoBacktest,
  Razon,
  Rotacion,
} from '../types'

// Campaña agrícola de la sierra de Moquegua: se siembra con las primeras lluvias
// y se cosecha al terminar la temporada de lluvias.
export const CAMPANIA: readonly number[] = [10, 11, 12, 1, 2, 3, 4] // octubre a abril
export const VENTANA_CRITICA: readonly number[] = [12, 1, 2] // diciembre a febrero: el corazón de las lluvias

export type FieldShiftErrorCode = 'CAMPANIAS_INSUFICIENTES' | 'ESCENARIO_INSUFICIENTE'

export class FieldShiftError extends Error {
  readonly code: FieldShiftErrorCode

  constructor(code: FieldShiftErrorCode, message: string) {
    super(message)
    this.name = 'FieldShiftError'
    this.code = code
  }
}

type MesCompleto = Mes & { lluvia: number; humedad: number; tmin: number }

const promedio = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length

// Octubre a diciembre pertenecen a la campaña que empieza ese año;
// enero a abril, a la que empezó el año anterior.
const inicioCampania = (m: Mes): number => (m.mes >= 10 ? m.anio : m.anio - 1)
const etiqueta = (anio: number): string => `${anio}-${String((anio + 1) % 100).padStart(2, '0')}`

const mesCompleto = (m: Mes): m is MesCompleto =>
  m.lluvia !== null && m.humedad !== null && m.tmin !== null

// Agrupa los meses por campaña y descarta las campañas incompletas o con datos nulos.
function armarCampanias(meses: readonly Mes[]): Campania[] {
  const porCampania = new Map<number, Mes[]>()
  for (const m of meses) {
    if (!CAMPANIA.includes(m.mes)) continue
    const c = inicioCampania(m)
    if (!porCampania.has(c)) porCampania.set(c, [])
    porCampania.get(c)?.push(m)
  }

  const campanias: Campania[] = []
  for (const [inicio, todos] of [...porCampania].sort((a, b) => a[0] - b[0])) {
    if (todos.length !== CAMPANIA.length) continue
    const lista = todos.filter(mesCompleto)
    if (lista.length !== todos.length) continue
    const critica = lista.filter((m) => VENTANA_CRITICA.includes(m.mes))
    campanias.push({
      inicio,
      etiqueta: etiqueta(inicio),
      fase: fase(inicio),
      lluvia: lista.reduce((s, m) => s + m.lluvia, 0),
      humedadCritica: promedio(critica.map((m) => m.humedad)),
      mesesHelada: lista.filter((m) => m.tmin < 0).length,
      tmin: Math.min(...lista.map((m) => m.tmin)),
    })
  }
  return campanias
}

// 1. Resume 25 años de datos satelitales en pocos números que se pueden explicar.
// escenario: "todas" (promedio de todas las campañas), "nino" o "nina"
// (solo las campañas con El Niño o con La Niña).
export function analizarClima(meses: readonly Mes[], escenario: Escenario = 'todas'): Clima {
  const campanias = armarCampanias(meses)
  if (campanias.length < 5) {
    throw new FieldShiftError('CAMPANIAS_INSUFICIENTES', 'No hay suficientes campañas completas para analizar')
  }

  // "Normal" es siempre el promedio de todas las campañas, para comparar escenarios.
  const lluviaNormal = promedio(campanias.map((c) => c.lluvia))
  const lluviaDe = (f: Fase): number | null => {
    const xs = campanias.filter((c) => c.fase === f)
    return xs.length ? promedio(xs.map((c) => c.lluvia)) : null
  }

  const seleccion = escenario === 'todas' ? campanias : campanias.filter((c) => c.fase === escenario)
  if (seleccion.length < 3) {
    throw new FieldShiftError('ESCENARIO_INSUFICIENTE', 'Hay muy pocas campañas de ese escenario en los datos')
  }
  const secas = seleccion.filter((c) => c.lluvia < 0.75 * lluviaNormal)

  // Tendencia: compara la primera mitad del periodo con la segunda (siempre con todas).
  const mitad = Math.floor(campanias.length / 2)
  const antes = promedio(campanias.slice(0, mitad).map((c) => c.lluvia))
  const despues = promedio(campanias.slice(mitad).map((c) => c.lluvia))

  return {
    campanias,
    escenario,
    nCampanias: seleccion.length,
    lluvia: promedio(seleccion.map((c) => c.lluvia)),
    lluviaNormal,
    lluviaNino: lluviaDe('nino'),
    lluviaNina: lluviaDe('nina'),
    tminPromedio: promedio(seleccion.map((c) => c.tmin)),
    frecuenciaSequia: secas.length / seleccion.length,
    campaniasSecas: secas.map((c) => c.etiqueta),
    // Parte de los meses de campaña con temperatura mínima bajo 0 °C
    riesgoHelada: promedio(seleccion.map((c) => c.mesesHelada / CAMPANIA.length)),
    tendencia: (despues - antes) / antes, // ej. -0.08 = 8% menos lluvia
    periodo: [campanias[0].etiqueta, campanias[campanias.length - 1].etiqueta],
  }
}

interface Aptitud {
  agua: number
  puntaje: number
}

// 2. ¿Qué tan bien le va a un cultivo con el clima de esta zona?
function aptitud(cultivo: Cultivo, clima: Clima): Aptitud {
  const agua = Math.min(1, clima.lluvia / cultivo.aguaMinima)
  const sequia = clima.frecuenciaSequia * ((5 - cultivo.toleranciaSequia) / 4)
  const helada = clima.riesgoHelada * ((5 - cultivo.toleranciaHelada) / 4)
  return { agua, puntaje: agua * (1 - sequia) * (1 - helada) }
}

// 3. Evalúa todas las rotaciones de dos años (año 1 → año 2) y devuelve las mejores.
// prioridades: { comida, ingreso, suelo, clima } con valores de 0 a 3
export function recomendarRotaciones(clima: Clima, prioridades: Prioridades, cuantas = 3): Rotacion[] {
  const claves = Object.keys(CULTIVOS) as CultivoId[]
  const opciones: Rotacion[] = []

  for (const p of claves) {
    for (const q of claves) {
      const c1 = CULTIVOS[p]
      const c2 = CULTIVOS[q]
      const a1 = aptitud(c1, clima)
      const a2 = aptitud(c2, clima)

      const leguminosa = c1.fijaNitrogeno || c2.fijaNitrogeno
      const distintos = p !== q

      const componentes: Componentes = {
        comida: (c1.comida + c2.comida) / 10,
        ingreso: (c1.ingreso + c2.ingreso) / 10,
        suelo: (leguminosa ? 0.6 : 0) + (distintos ? 0.4 : 0),
        clima: (a1.puntaje + a2.puntaje) / 2,
      }

      const pesoTotal = Object.values(prioridades).reduce((s: number, x: number) => s + x, 0) || 1
      const total =
        (Object.entries(componentes) as [keyof Prioridades, number][]).reduce(
          (s, [k, v]) => s + v * (prioridades[k] ?? 0),
          0,
        ) / pesoTotal

      opciones.push({
        anio1: p,
        anio2: q,
        total,
        componentes,
        razones: explicar(p, q, a1, a2, leguminosa, distintos, clima),
      })
    }
  }

  return opciones.sort((x, y) => y.total - x.total).slice(0, cuantas)
}

const unicos = (xs: readonly CultivoId[]): CultivoId[] => [...new Set(xs)]

function razonAgua(cultivo: CultivoId, a: Aptitud, mm: number, escenario: Escenario): Razon {
  return a.agua >= 1
    ? { clave: 'aguaCubre', params: { cultivo, mm, escenario } }
    : { clave: 'aguaParcial', params: { cultivo, mm, escenario, pct: Math.round(a.agua * 100) } }
}

function razonSequia(p: CultivoId, q: CultivoId, clima: Clima): Razon {
  const pct = Math.round(clima.frecuenciaSequia * 100)
  const escenario = clima.escenario
  const tolerantes = [p, q].filter((c) => CULTIVOS[c].toleranciaSequia >= 4)
  return tolerantes.length
    ? { clave: 'sequiaTolerantes', params: { pct, escenario, cultivos: unicos(tolerantes) } }
    : { clave: 'sequiaNinguno', params: { pct, escenario } }
}

function razonHelada(p: CultivoId, q: CultivoId, clima: Clima): Razon | null {
  const sensibles = [p, q].filter((c) => CULTIVOS[c].toleranciaHelada <= 2)
  const resistentes = [p, q].filter((c) => CULTIVOS[c].toleranciaHelada >= 4)
  const pct = Math.round(clima.riesgoHelada * 100)
  if (sensibles.length) return { clave: 'heladaSensibles', params: { pct, cultivos: unicos(sensibles) } }
  if (resistentes.length) return { clave: 'heladaResistentes', params: { pct, cultivos: unicos(resistentes) } }
  return null
}

function explicar(
  p: CultivoId,
  q: CultivoId,
  a1: Aptitud,
  a2: Aptitud,
  leguminosa: boolean,
  distintos: boolean,
  clima: Clima,
): Razon[] {
  const r: Razon[] = []
  const mm = Math.round(clima.lluvia)
  r.push(razonAgua(p, a1, mm, clima.escenario))
  if (distintos) r.push(razonAgua(q, a2, mm, clima.escenario))

  if (clima.frecuenciaSequia >= 0.2) r.push(razonSequia(p, q, clima))
  if (clima.riesgoHelada >= 0.2) {
    const helada = razonHelada(p, q, clima)
    if (helada) r.push(helada)
  }
  if (leguminosa) r.push({ clave: 'leguminosa' })
  if (p === 'papa' && distintos) r.push({ clave: 'papaPrimero' })
  if (!distintos) r.push({ clave: 'repite' })
  return r
}

// 4. Backtest del seguro: ¿en qué campañas habría pagado la póliza?
// El índice de cada campaña es la humedad promedio del suelo de diciembre a febrero.
export function backtest(clima: Clima, umbral: number): PuntoBacktest[] {
  return clima.campanias.map((c) => ({
    etiqueta: c.etiqueta,
    fase: c.fase,
    indice: c.humedadCritica,
    paga: c.humedadCritica < umbral,
  }))
}

// Umbral sugerido: el percentil 20 (la póliza pagaría aproximadamente 1 de cada 5 campañas).
export function umbralSugerido(clima: Clima, percentil = 0.2): number {
  const valores = clima.campanias.map((c) => c.humedadCritica).sort((a, b) => a - b)
  const i = Math.max(0, Math.ceil(percentil * valores.length) - 1)
  return valores[i] + 0.0005
}
