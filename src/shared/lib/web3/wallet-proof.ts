/**
 * Proof-of-ownership messages for linking addresses to a user account.
 *
 * The server builds the message (it knows the user id), the wallet signs it,
 * and the server verifies the signature before writing the address.
 * The timestamp limits replay to a short window; the user id binds the
 * signature to one account.
 */

export type WalletProofPurpose = 'link-wallet' | 'link-smart-account'

export const WALLET_PROOF_TTL_MS = 5 * 60 * 1000

export interface WalletProofInput {
  purpose: WalletProofPurpose
  userId: string
  address: string
  issuedAt: string
}

const PURPOSE_TEXT: Record<WalletProofPurpose, string> = {
  'link-wallet': 'Link this wallet to my account',
  'link-smart-account': 'Link this smart account to my account',
}

export function buildWalletProofMessage({ purpose, userId, address, issuedAt }: WalletProofInput): string {
  return [
    PURPOSE_TEXT[purpose],
    '',
    `Address: ${address.toLowerCase()}`,
    `Account: ${userId}`,
    `Issued at: ${issuedAt}`,
  ].join('\n')
}

/** true if issuedAt is a valid ISO date inside the TTL window (small clock skew allowed). */
export function isFreshIssuedAt(issuedAt: string, now: number = Date.now()): boolean {
  const issued = Date.parse(issuedAt)
  if (Number.isNaN(issued)) return false
  const age = now - issued
  return age >= -30_000 && age <= WALLET_PROOF_TTL_MS
}
