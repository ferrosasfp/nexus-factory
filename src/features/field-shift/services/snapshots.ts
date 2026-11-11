/**
 * Snapshots de NASA POWER versionados en el repo (respaldo offline del handler).
 * Respuesta cruda de la API mensual 2001-2025; se regeneran con `npm run field-shift:datos`.
 * Solo servidor: no se envían al bundle del cliente.
 */

import 'server-only'
import carumas from '../data/carumas.json'
import ichuna from '../data/ichuna.json'
import ubinas from '../data/ubinas.json'
import yunga from '../data/yunga.json'
import type { ZonaId } from '../types'

const SNAPSHOTS: Record<ZonaId, unknown> = { carumas, ichuna, ubinas, yunga }

export function obtenerSnapshot(zona: ZonaId): unknown {
  return SNAPSHOTS[zona]
}
