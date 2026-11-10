import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks - declared before imports so hoisting works correctly
// ---------------------------------------------------------------------------

const mockUpload = vi.fn()
const mockDelete = vi.fn()
const mockRetrieve = vi.fn()

vi.mock('@/features/storage/services/storageProvider', () => ({
  createStorageProvider: vi.fn(() => ({
    upload: mockUpload,
    delete: mockDelete,
    retrieve: mockRetrieve,
  })),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers({ 'x-real-ip': '127.0.0.1' }))),
}))

// Chainable, awaitable query builder: from().select().eq().eq().maybeSingle(),
// from().delete().eq().eq() (awaited), from().upsert() (awaited)
const mockMaybeSingle = vi.fn()
const mockUpsert = vi.fn()
const mockDbDelete = vi.fn()
const mockRpc = vi.fn()

function createQueryBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    delete: vi.fn(() => {
      mockDbDelete()
      return builder
    }),
    upsert: mockUpsert,
    maybeSingle: mockMaybeSingle,
    then: (resolve: (value: { error: null }) => unknown) => resolve({ error: null }),
  }
  return builder
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => createQueryBuilder()),
  rpc: mockRpc,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// ---------------------------------------------------------------------------
// Imports under test (after mocks)
// ---------------------------------------------------------------------------

import { uploadFile, deleteFile, getFileUrl } from '../storage'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ID = 'user-storage-001'
const VALID_CID_V0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
const VALID_CID_V1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

function createUploadFormData(file: File, metadata?: string): FormData {
  const formData = new FormData()
  formData.append('file', file)
  if (metadata !== undefined) {
    formData.append('metadata', metadata)
  }
  return formData
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Storage Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
    })

    // Default: successful provider operations
    mockUpload.mockResolvedValue({
      cid: VALID_CID_V0,
      url: 'https://gateway.pinata.cloud/ipfs/QmTest',
    })
    mockDelete.mockResolvedValue(undefined)
    mockUpsert.mockResolvedValue({ error: null })
    mockMaybeSingle.mockResolvedValue({ data: { cid: VALID_CID_V0 } })
    mockRpc.mockResolvedValue({ data: false, error: null })
    mockRetrieve.mockResolvedValue('https://gateway.pinata.cloud/ipfs/QmTest')
  })

  // =========================================================================
  // uploadFile
  // =========================================================================
  describe('uploadFile', () => {
    it('should return error when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })
      const file = createMockFile('test.png', 1024, 'image/png')
      const formData = createUploadFormData(file)

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
      expect(mockUpload).not.toHaveBeenCalled()
    })

    it('should return error when no file provided', async () => {
      // Arrange
      const formData = new FormData()

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({ error: 'No file provided' })
    })

    it('should return error when file exceeds 10MB', async () => {
      // Arrange
      const largeFile = createMockFile('huge.png', 11_000_000, 'image/png')
      const formData = createUploadFormData(largeFile)

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error).toContain('10MB')
      expect(mockUpload).not.toHaveBeenCalled()
    })

    it('should return error for disallowed MIME type', async () => {
      // Arrange
      const exeFile = createMockFile('malware.exe', 1024, 'application/exe')
      const formData = createUploadFormData(exeFile)

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result.error).toBeDefined()
      expect(result.error).toContain('File type must be one of')
      expect(mockUpload).not.toHaveBeenCalled()
    })

    it('should return error for invalid metadata JSON', async () => {
      // Arrange
      const file = createMockFile('doc.pdf', 1024, 'application/pdf')
      const formData = createUploadFormData(file, '{not valid json}')

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid JSON in metadata field' })
      expect(mockUpload).not.toHaveBeenCalled()
    })

    it('should return error for invalid metadata format with non-string values', async () => {
      // Arrange
      const file = createMockFile('photo.jpg', 2048, 'image/jpeg')
      const formData = createUploadFormData(
        file,
        JSON.stringify({ key: 123, nested: { deep: true } }),
      )

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({ error: 'Invalid metadata format' })
      expect(mockUpload).not.toHaveBeenCalled()
    })

    it('should upload successfully with valid file and no metadata', async () => {
      // Arrange
      const file = createMockFile('image.png', 5000, 'image/png')
      const formData = createUploadFormData(file)

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({
        cid: VALID_CID_V0,
        url: 'https://gateway.pinata.cloud/ipfs/QmTest',
      })
      expect(mockUpload).toHaveBeenCalledWith(expect.any(File), undefined)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: USER_ID, cid: VALID_CID_V0, mime_type: 'image/png' }),
        { onConflict: 'user_id,cid' },
      )
    })

    it('should upload successfully with valid file and metadata', async () => {
      // Arrange
      const file = createMockFile('report.pdf', 2048, 'application/pdf')
      const metadata = JSON.stringify({ author: 'Alice', category: 'reports' })
      const formData = createUploadFormData(file, metadata)

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({
        cid: VALID_CID_V0,
        url: 'https://gateway.pinata.cloud/ipfs/QmTest',
      })
      expect(mockUpload).toHaveBeenCalledWith(expect.any(File), {
        author: 'Alice',
        category: 'reports',
      })
    })

    it('should return error when provider upload throws', async () => {
      // Arrange
      const file = createMockFile('image.png', 1024, 'image/png')
      const formData = createUploadFormData(file)
      mockUpload.mockRejectedValue(new Error('Pinata API unreachable'))

      // Act
      const result = await uploadFile(formData)

      // Assert
      expect(result).toEqual({ error: 'Pinata API unreachable' })
    })
  })

  // =========================================================================
  // deleteFile
  // =========================================================================
  describe('deleteFile', () => {
    it('should return error when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      // Act
      const result = await deleteFile(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ error: 'Not authenticated' })
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should return error for invalid CID format', async () => {
      // Arrange
      const invalidCid = 'not-a-valid-cid'

      // Act
      const result = await deleteFile(invalidCid)

      // Assert
      expect(result).toEqual({ error: 'Invalid IPFS CID format' })
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should delete successfully with valid CIDv0', async () => {
      // Arrange & Act
      const result = await deleteFile(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalledWith(VALID_CID_V0)
    })

    it('should delete successfully with valid CIDv1', async () => {
      // Arrange & Act
      const result = await deleteFile(VALID_CID_V1)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalledWith(VALID_CID_V1)
    })

    it('should not delete a CID the user does not own', async () => {
      // Arrange
      mockMaybeSingle.mockResolvedValue({ data: null })

      // Act
      const result = await deleteFile(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ error: 'File not found' })
      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockDbDelete).not.toHaveBeenCalled()
    })

    it('should keep the pin when another user references the same CID', async () => {
      // Arrange
      mockRpc.mockResolvedValue({ data: true, error: null })

      // Act
      const result = await deleteFile(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ success: true })
      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockDbDelete).toHaveBeenCalled()
    })

    it('should return error when provider delete throws', async () => {
      // Arrange
      mockDelete.mockRejectedValue(new Error('Pin not found'))

      // Act
      const result = await deleteFile(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ error: 'Pin not found' })
    })
  })

  // =========================================================================
  // getFileUrl
  // =========================================================================
  describe('getFileUrl', () => {
    it('should return error for invalid CID', async () => {
      // Arrange
      const invalidCid = '12345-bad'

      // Act
      const result = await getFileUrl(invalidCid)

      // Assert
      expect(result).toEqual({ error: 'Invalid IPFS CID format' })
      expect(mockRetrieve).not.toHaveBeenCalled()
    })

    it('should return url for valid CID', async () => {
      // Arrange
      mockRetrieve.mockResolvedValue(
        'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      )

      // Act
      const result = await getFileUrl(VALID_CID_V0)

      // Assert
      expect(result).toEqual({
        url: 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      })
      expect(mockRetrieve).toHaveBeenCalledWith(VALID_CID_V0)
    })

    it('should return error when provider retrieve throws', async () => {
      // Arrange
      mockRetrieve.mockRejectedValue(new Error('Gateway timeout'))

      // Act
      const result = await getFileUrl(VALID_CID_V0)

      // Assert
      expect(result).toEqual({ error: 'Gateway timeout' })
    })
  })
})
