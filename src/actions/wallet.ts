'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildWalletProofMessage,
  isFreshIssuedAt,
  type WalletProofPurpose,
} from '@/shared/lib/web3/wallet-proof'
import { verifyMessage, type Address, type Hex } from 'viem'
import { z } from 'zod'

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

const proofSchema = z.object({
  address: addressSchema,
  issuedAt: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Invalid signature'),
})

export type WalletProof = z.infer<typeof proofSchema>

type ActionResult = { success: true } | { error: string }

const NOT_CONFIGURED = 'Wallet linking is not configured on the server (SUPABASE_SERVICE_ROLE_KEY)'

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Step 1: the client asks for the message to sign.
 * The message is bound to the authenticated user and to the address.
 */
export async function getWalletProofMessage(
  address: string,
  purpose: WalletProofPurpose,
): Promise<{ message: string; issuedAt: string } | { error: string }> {
  const validated = addressSchema.safeParse(address)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }

  const issuedAt = new Date().toISOString()
  return { message: buildWalletProofMessage({ purpose, userId, address: validated.data, issuedAt }), issuedAt }
}

async function verifyProof(
  proof: WalletProof,
  purpose: WalletProofPurpose,
  userId: string,
  signer: string,
): Promise<boolean> {
  if (!isFreshIssuedAt(proof.issuedAt)) return false
  const message = buildWalletProofMessage({ purpose, userId, address: proof.address, issuedAt: proof.issuedAt })
  try {
    return await verifyMessage({ address: signer as Address, message, signature: proof.signature as Hex })
  } catch {
    return false
  }
}

async function writeAddress(
  userId: string,
  column: 'wallet_address' | 'smart_account_address',
  address: string | null,
): Promise<ActionResult> {
  const admin = createAdminClient()
  if (!admin) return { error: NOT_CONFIGURED }

  if (address) {
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq(column, address)
      .neq('id', userId)
      .maybeSingle()
    if (existing) return { error: 'This address is already linked to another account' }
  }

  const { error } = await admin
    .from('profiles')
    .update({ [column]: address, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return error ? { error: error.message } : { success: true }
}

/** Step 2: link an EOA. The signature must come from that same address. */
export async function linkWallet(proof: WalletProof): Promise<ActionResult> {
  const parsed = proofSchema.safeParse(proof)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }

  const valid = await verifyProof(parsed.data, 'link-wallet', userId, parsed.data.address)
  if (!valid) return { error: 'Invalid or expired wallet signature' }

  return writeAddress(userId, 'wallet_address', parsed.data.address.toLowerCase())
}

export async function unlinkWallet(): Promise<ActionResult> {
  const userId = await getUserId()
  if (!userId) return { error: 'Not authenticated' }

  return writeAddress(userId, 'wallet_address', null)
}

/**
 * Link a smart account. It is signed by the already linked EOA (its owner),
 * so the wallet must be linked first.
 */
export async function saveSmartAccount(proof: WalletProof): Promise<ActionResult> {
  const parsed = proofSchema.safeParse(proof)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address')
    .eq('id', user.id)
    .single()
  const owner = profile?.wallet_address as string | null | undefined
  if (!owner) return { error: 'Link your wallet before saving a smart account' }

  const valid = await verifyProof(parsed.data, 'link-smart-account', user.id, owner)
  if (!valid) return { error: 'Invalid or expired wallet signature' }

  return writeAddress(user.id, 'smart_account_address', parsed.data.address.toLowerCase())
}

export async function getWalletInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_address, smart_account_address')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return {
    walletAddress: data.wallet_address,
    smartAccountAddress: data.smart_account_address,
  }
}
