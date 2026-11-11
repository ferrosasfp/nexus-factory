// Catálogo de cultivos del MVP: cultivos andinos de la sierra de Moquegua.
// IMPORTANTE: son valores aproximados de referencia para demostrar la idea.
// Antes de usarlo con productores reales, valídalos con un agrónomo local.
// Port de web/cultivos.js: mismos valores y mismo orden de claves (el orden decide
// el desempate del ranking). El nombre visible sale de i18n: fieldShift.cultivos.<id>.

import zonas from '../data/zonas.json'
import type { Cultivo, CultivoId, Zona, ZonaId } from '../types'

export const CULTIVOS: Record<CultivoId, Cultivo> = {
  papa: {
    aguaMinima: 450,
    toleranciaSequia: 2,
    toleranciaHelada: 2,
    fijaNitrogeno: false,
    comida: 5,
    ingreso: 4,
  },
  haba: {
    aguaMinima: 350,
    toleranciaSequia: 2,
    toleranciaHelada: 3,
    fijaNitrogeno: true,
    comida: 4,
    ingreso: 3,
  },
  cebada: {
    aguaMinima: 300,
    toleranciaSequia: 3,
    toleranciaHelada: 4,
    fijaNitrogeno: false,
    comida: 3,
    ingreso: 2,
  },
  avena: {
    aguaMinima: 350,
    toleranciaSequia: 3,
    toleranciaHelada: 4,
    fijaNitrogeno: false,
    comida: 1, // alimenta al ganado y a las alpacas, no a la familia directamente
    ingreso: 3,
  },
  quinua: {
    aguaMinima: 300,
    toleranciaSequia: 5,
    toleranciaHelada: 4,
    fijaNitrogeno: false,
    comida: 4,
    ingreso: 3,
  },
  maiz: {
    aguaMinima: 500,
    toleranciaSequia: 2,
    toleranciaHelada: 1,
    fijaNitrogeno: false,
    comida: 4,
    ingreso: 3,
  },
}

const ZONA_IDS: readonly ZonaId[] = ['carumas', 'ichuna', 'ubinas', 'yunga']

/** Type guard: true si x es el id de una zona conocida. */
export function esZonaId(x: unknown): x is ZonaId {
  return typeof x === 'string' && (ZONA_IDS as readonly string[]).includes(x)
}

// Zonas de la sierra de Moquegua (coordenadas aproximadas de cada capital de distrito).
// Los valles con riego (Moquegua, Torata, Omate, Ilo) no están aquí a propósito.
export const ZONAS: readonly Zona[] = zonas.filter((z): z is Zona => esZonaId(z.id))
