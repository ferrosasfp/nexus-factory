'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatEther, type Account, type Address, type Chain, type Hash, type Transport, type WalletClient } from 'viem'
import { avalancheFuji } from 'viem/chains'
import { useAccount, useWalletClient } from 'wagmi'
import { getPublicClient } from '@/shared/lib/web3/client'
import { polizaParametricaAbi } from '@/features/contracts/abi/PolizaParametrica'
import { FIELD_SHIFT_CONTRACT, FIELD_SHIFT_ZONE_ID } from '../services/config'

export interface ZonaPoliza {
  nombre: string
  /** Umbral de humedad (0–1) */
  umbral: number
  /** Índice reportado (0–1) */
  indice: number
  cobertura: string
  primaBase: string
  reportada: boolean
  disparada: boolean
}

export interface PrimasPoliza {
  conRotacion: string
  sinRotacion: string
}

interface EstadoTx {
  hash: Hash | null
  pendiente: boolean
  error: string | null
}

const ZONE_ID = FIELD_SHIFT_ZONE_ID

function mensajeError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { shortMessage?: unknown; message?: unknown }
    if (typeof e.shortMessage === 'string') return e.shortMessage
    if (typeof e.message === 'string') return e.message
  }
  return 'Transaction failed'
}

interface Lectura {
  zona: ZonaPoliza
  primas: PrimasPoliza
  tienePoliza: boolean
}

async function leerPoliza(contrato: Address, cuenta: Address | undefined): Promise<Lectura> {
  const client = getPublicClient(avalancheFuji.id)
  const base = { address: contrato, abi: polizaParametricaAbi } as const
  const [z, conRotacion, sinRotacion, tiene] = await Promise.all([
    client.readContract({ ...base, functionName: 'zonas', args: [ZONE_ID] }),
    client.readContract({ ...base, functionName: 'prima', args: [ZONE_ID, true] }),
    client.readContract({ ...base, functionName: 'prima', args: [ZONE_ID, false] }),
    cuenta
      ? client.readContract({ ...base, functionName: 'tienePoliza', args: [ZONE_ID, cuenta] })
      : Promise.resolve(false),
  ])
  const [nombre, umbral, cobertura, primaBase, reportada, disparada, indice] = z
  return {
    zona: {
      nombre,
      umbral: Number(umbral) / 1000,
      indice: Number(indice) / 1000,
      cobertura: formatEther(cobertura),
      primaBase: formatEther(primaBase),
      reportada,
      disparada,
    },
    primas: { conRotacion: formatEther(conRotacion), sinRotacion: formatEther(sinRotacion) },
    tienePoliza: tiene,
  }
}

type ClienteWallet = WalletClient<Transport, Chain, Account>

/** Verifica la red, simula y firma. Lanza si la wallet no está en Fuji. */
async function firmar(
  walletClient: ClienteWallet,
  contrato: Address,
  functionName: 'comprarPoliza' | 'reclamar',
  conRotacion: boolean,
): Promise<Hash> {
  if (walletClient.chain?.id !== avalancheFuji.id) throw new Error('Wrong network: switch to Avalanche Fuji')
  const client = getPublicClient(avalancheFuji.id)
  const base = { address: contrato, abi: polizaParametricaAbi, account: walletClient.account } as const
  if (functionName === 'comprarPoliza') {
    const value = await client.readContract({ ...base, functionName: 'prima', args: [ZONE_ID, conRotacion] })
    const { request } = await client.simulateContract({
      ...base,
      functionName,
      args: [ZONE_ID, conRotacion],
      value,
    })
    return walletClient.writeContract(request)
  }
  const { request } = await client.simulateContract({ ...base, functionName, args: [ZONE_ID] })
  return walletClient.writeContract(request)
}

/** Lee y escribe la póliza paramétrica en Avalanche Fuji. Inerte si no hay contrato configurado. */
export function usePoliza() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [lectura, setLectura] = useState<Lectura | null>(null)
  const [tx, setTx] = useState<EstadoTx>({ hash: null, pendiente: false, error: null })

  const recargar = useCallback(async () => {
    if (!FIELD_SHIFT_CONTRACT) return
    try {
      setLectura(await leerPoliza(FIELD_SHIFT_CONTRACT, address))
    } catch (err) {
      setTx((t) => ({ ...t, error: mensajeError(err) }))
    }
  }, [address])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const enviar = useCallback(
    async (functionName: 'comprarPoliza' | 'reclamar', conRotacion: boolean) => {
      const contrato = FIELD_SHIFT_CONTRACT
      if (!contrato || !walletClient) return null
      setTx({ hash: null, pendiente: true, error: null })
      try {
        const hash = await firmar(walletClient, contrato, functionName, conRotacion)
        await getPublicClient(avalancheFuji.id).waitForTransactionReceipt({ hash })
        setTx({ hash, pendiente: false, error: null })
        await recargar()
        return hash
      } catch (err) {
        setTx({ hash: null, pendiente: false, error: mensajeError(err) })
        return null
      }
    },
    [walletClient, recargar],
  )

  const comprar = useCallback((conRotacion: boolean) => enviar('comprarPoliza', conRotacion), [enviar])
  const reclamar = useCallback(() => enviar('reclamar', false), [enviar])

  return {
    zona: lectura?.zona ?? null,
    primas: lectura?.primas ?? null,
    tienePoliza: lectura?.tienePoliza ?? false,
    ...tx,
    comprar,
    reclamar,
  }
}
