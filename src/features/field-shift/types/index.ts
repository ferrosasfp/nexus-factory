// Tipos de Field Shift. Port de las estructuras de datos del MVP (web/rotacion.js).

/** Un mes de datos de NASA POWER ya normalizado. */
export interface Mes {
  anio: number
  mes: number
  /** Lluvia del mes en mm (mm/día × días del mes) */
  lluvia: number | null
  /** Temperatura del aire a 2 m (°C) */
  temp: number | null
  /** Temperatura mínima del aire a 2 m (°C) */
  tmin: number | null
  /** Humedad del suelo en la zona de raíces (0–1) */
  humedad: number | null
}

export type Escenario = 'todas' | 'nino' | 'nina'

export type Fase = 'nino' | 'nina' | 'neutro'

export type CultivoId = 'papa' | 'haba' | 'cebada' | 'avena' | 'quinua' | 'maiz'

export interface Cultivo {
  /** Lluvia aproximada que necesita el cultivo en la campaña (mm) */
  aguaMinima: number
  /** 1 (muy sensible) a 5 (muy tolerante) */
  toleranciaSequia: number
  /** 1 (muy sensible) a 5 (muy tolerante) */
  toleranciaHelada: number
  /** true si es leguminosa (devuelve nitrógeno al suelo) */
  fijaNitrogeno: boolean
  /** 1 a 5: aporte a la mesa de la familia */
  comida: number
  /** 1 a 5: aporte al bolsillo */
  ingreso: number
}

export type ZonaId = 'carumas' | 'ichuna' | 'ubinas' | 'yunga'

export interface Zona {
  id: ZonaId
  lat: number
  lon: number
}

export interface Campania {
  inicio: number
  etiqueta: string
  fase: Fase
  lluvia: number
  humedadCritica: number
  mesesHelada: number
  tmin: number
}

export interface Clima {
  campanias: Campania[]
  escenario: Escenario
  nCampanias: number
  lluvia: number
  lluviaNormal: number
  lluviaNino: number | null
  lluviaNina: number | null
  tminPromedio: number
  frecuenciaSequia: number
  campaniasSecas: string[]
  riesgoHelada: number
  tendencia: number
  periodo: [string, string]
}

export interface Prioridades {
  comida: number
  ingreso: number
  suelo: number
  clima: number
}

export interface Componentes {
  comida: number
  ingreso: number
  suelo: number
  clima: number
}

/** Razón de una recomendación, sin texto: la UI la traduce con formatearRazon(). */
export type Razon =
  | { clave: 'aguaCubre'; params: { cultivo: CultivoId; mm: number; escenario: Escenario } }
  | { clave: 'aguaParcial'; params: { cultivo: CultivoId; mm: number; escenario: Escenario; pct: number } }
  | { clave: 'sequiaTolerantes'; params: { pct: number; escenario: Escenario; cultivos: CultivoId[] } }
  | { clave: 'sequiaNinguno'; params: { pct: number; escenario: Escenario } }
  | { clave: 'heladaSensibles'; params: { pct: number; cultivos: CultivoId[] } }
  | { clave: 'heladaResistentes'; params: { pct: number; cultivos: CultivoId[] } }
  | { clave: 'leguminosa' }
  | { clave: 'papaPrimero' }
  | { clave: 'repite' }

export interface Rotacion {
  anio1: CultivoId
  anio2: CultivoId
  total: number
  componentes: Componentes
  razones: Razon[]
}

export interface PuntoBacktest {
  etiqueta: string
  fase: Fase
  indice: number
  paga: boolean
}

export type OrigenDatos = 'nasa' | 'offline'

export interface RespuestaNasa {
  zona: ZonaId
  origen: OrigenDatos
  meses: Mes[]
}
