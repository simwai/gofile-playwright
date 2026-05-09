export interface GofileAsset {
  /** Original filename without extension */
  name: string
  /** Full CDN download URL */
  url: string
  /** Gofile folder hash — the /d/{hash} segment */
  hash: string
  /** Absolute path to the source file — required for auto re-upload */
  filePath: string
  /** ISO 8601 upload timestamp */
  uploadedAt: string
}

export interface VerifyResult {
  asset: GofileAsset
  isAlive: boolean
  reason?: string
}

export type ReuploadOutcome = 'reuploaded' | 'missing-file'
