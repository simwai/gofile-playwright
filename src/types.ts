export interface GofileAsset {
  /** Original filename without extension */
  name: string
  /** Full CDN download URL */
  url: string
  /** Gofile folder hash — the /d/{hash} segment */
  hash: string
  /** Absolute or relative path to the source file — required for auto re-upload */
  filePath: string
  /** ISO 8601 upload timestamp */
  uploadedAt: string
}
