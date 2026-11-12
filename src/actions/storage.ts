'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { rateLimitServerAction } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createStorageProvider } from '@/features/storage/services/storageProvider'

// Security constants
const MAX_FILE_SIZE = 10_000_000 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
] as const

// Zod schemas for validation
const cidSchema = z.string().regex(
  /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z2-7]{55,})$/,
  'Invalid IPFS CID format'
)

const metadataSchema = z.record(z.string(), z.string()).optional()

const fileSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / 1_000_000}MB`),
  type: z.enum(ALLOWED_MIME_TYPES, {
    error: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  }),
})

export async function uploadFile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { success: allowed } = await rateLimitServerAction('expensive', `upload:${user.id}`, await headers())
  if (!allowed) {
    return { error: 'Upload limit reached. Please try again later.' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file size and MIME type
  const fileValidation = fileSchema.safeParse({
    size: file.size,
    type: file.type,
  })

  if (!fileValidation.success) {
    return { error: fileValidation.error.issues[0].message }
  }

  // Parse and validate metadata
  const metadataStr = formData.get('metadata') as string | null
  let metadata: Record<string, string> | undefined
  if (metadataStr) {
    try {
      const parsed: unknown = JSON.parse(metadataStr)
      const metadataValidation = metadataSchema.safeParse(parsed)

      if (!metadataValidation.success) {
        return { error: 'Invalid metadata format' }
      }

      metadata = metadataValidation.data
    } catch {
      return { error: 'Invalid JSON in metadata field' }
    }
  }

  try {
    const provider = createStorageProvider()
    const result = await provider.upload(file, metadata)

    // Record ownership so only this user can delete the pin later
    const { error: dbError } = await supabase.from('user_files').upsert(
      {
        user_id: user.id,
        cid: result.cid,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      },
      { onConflict: 'user_id,cid' },
    )
    if (dbError) {
      return { error: `File pinned but ownership not recorded: ${dbError.message}` }
    }

    return { cid: result.cid, url: result.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return { error: message }
  }
}

/**
 * Deletes a file the current user uploaded. Ownership comes from `user_files` (RLS):
 * users can only see and delete their own rows. The pin is removed from the storage
 * provider only when no other user references the same CID.
 */
export async function deleteFile(cid: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate CID format
  const cidValidation = cidSchema.safeParse(cid)

  if (!cidValidation.success) {
    return { error: cidValidation.error.issues[0].message }
  }

  const cidValue = cidValidation.data
  const { data: owned } = await supabase
    .from('user_files')
    .select('cid')
    .eq('user_id', user.id)
    .eq('cid', cidValue)
    .maybeSingle()

  if (!owned) {
    return { error: 'File not found' }
  }

  try {
    const { data: sharedCid } = await supabase.rpc('cid_has_other_owners', { p_cid: cidValue })
    if (sharedCid !== true) {
      await createStorageProvider().delete(cidValue)
    }

    const { error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('user_id', user.id)
      .eq('cid', cidValue)
    if (dbError) {
      return { error: dbError.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return { error: message }
  }
}

export async function getFileUrl(cid: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate CID format
  const cidValidation = cidSchema.safeParse(cid)

  if (!cidValidation.success) {
    return { error: cidValidation.error.issues[0].message }
  }

  try {
    const provider = createStorageProvider()
    const url = await provider.retrieve(cidValidation.data)
    return { url }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get URL'
    return { error: message }
  }
}
