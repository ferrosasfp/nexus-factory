import type { Address } from 'viem'
import { addressSchema } from '@/shared/lib/web3/validation'

/**
 * Configuración pública de la póliza Field Shift en Avalanche Fuji.
 * NEXT_PUBLIC_* se leen con su nombre literal para que Next.js los inyecte en el bundle.
 */

function leerContrato(valor: string | undefined): Address | null {
  const parsed = addressSchema.safeParse(valor)
  return parsed.success ? (parsed.data as Address) : null
}

function leerZonaId(valor: string | undefined): bigint {
  try {
    return BigInt(valor ?? '0')
  } catch {
    return 0n
  }
}

/** Dirección de PolizaParametrica en Fuji, o null si no está configurada o es inválida. */
export const FIELD_SHIFT_CONTRACT: Address | null = leerContrato(process.env.NEXT_PUBLIC_FIELD_SHIFT_CONTRACT)

/** Zona de la póliza (por defecto 0 = Carumas en el deploy de ejemplo). */
export const FIELD_SHIFT_ZONE_ID: bigint = leerZonaId(process.env.NEXT_PUBLIC_FIELD_SHIFT_ZONE_ID)
