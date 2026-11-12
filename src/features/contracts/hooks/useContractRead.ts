'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { type Abi, type Address } from 'viem'
import { getPublicClient } from '@/shared/lib/web3/client'

interface UseContractReadParams {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  enabled?: boolean
  chainId?: number
}

interface ReadResult {
  data: unknown
  error: string | null
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Contract read failed'
}

export function useContractRead({ address, abi, functionName, args = [], enabled = true, chainId }: UseContractReadParams) {
  const [result, setResult] = useState<ReadResult>({ data: null, error: null })
  const [isLoading, setIsLoading] = useState(enabled)

  // Stabilize array/object references to prevent infinite re-renders
  const argsKey = JSON.stringify(args, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v))
  const stableArgs = useMemo(() => args, [argsKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const abiRef = useRef(abi)
  useEffect(() => {
    abiRef.current = abi
  }, [abi])

  const read = useCallback(
    () =>
      getPublicClient(chainId).readContract({
        address,
        abi: abiRef.current,
        functionName,
        args: stableArgs as unknown[],
      }),
    [address, functionName, stableArgs, chainId],
  )

  // Manual refetch (event handlers)
  const refetch = useCallback(async (): Promise<void> => {
    if (!enabled) return
    setIsLoading(true)
    try {
      setResult({ data: await read(), error: null })
    } catch (err) {
      setResult((prev) => ({ data: prev.data, error: toMessage(err) }))
    } finally {
      setIsLoading(false)
    }
  }, [enabled, read])

  // Automatic read: state is only set from async callbacks, and stale responses are ignored
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    read()
      .then((data) => {
        if (!cancelled) setResult({ data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult((prev) => ({ data: prev.data, error: toMessage(err) }))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, read])

  return { data: result.data, isLoading, error: result.error, refetch }
}
