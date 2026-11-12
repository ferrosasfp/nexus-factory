'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { type Abi, type Address } from 'viem'
import { useContractWrite } from '../hooks/useContractWrite'

interface ContractWriterProps {
  address?: Address
  abi?: Abi
}

export function ContractWriter({ address: defaultAddress, abi: defaultAbi }: ContractWriterProps) {
  const t = useTranslations('contracts')
  const tValidation = useTranslations('validation')
  const [address, setAddress] = useState(defaultAddress ?? '' as Address)
  const [functionName, setFunctionName] = useState('')
  const [argsInput, setArgsInput] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const { hash, isLoading, error, write } = useContractWrite({
    address: address as Address,
    abi: defaultAbi ?? [],
    functionName,
  })

  async function handleWrite(e: React.FormEvent) {
    e.preventDefault()
    setParseError(null)
    let args: unknown[] = []
    if (argsInput.trim()) {
      try {
        const parsed: unknown = JSON.parse(argsInput)
        if (!Array.isArray(parsed)) {
          setParseError('Arguments must be a JSON array (e.g. ["0x...", 100])')
          return
        }
        args = parsed
      } catch {
        setParseError(tValidation('invalidJson'))
        return
      }
    }
    await write(args)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{t('write')}</h3>

      <form onSubmit={handleWrite} className="space-y-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value as Address)}
          placeholder={t('address')}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <input
          type="text"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          placeholder="Function name (e.g. mint)"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div>
          <input
            type="text"
            value={argsInput}
            onChange={(e) => {
              setArgsInput(e.target.value)
              setParseError(null)
            }}
            placeholder='Arguments as JSON (e.g. ["0x...", 100])'
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {parseError && <p className="mt-1 text-sm text-red-600">{parseError}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || !address || !functionName}
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? '...' : t('write')}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {hash && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-800">Transaction sent!</p>
          <p className="mt-1 break-all font-mono text-xs text-green-700">{hash}</p>
        </div>
      )}
    </div>
  )
}
