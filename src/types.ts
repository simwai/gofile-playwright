export interface GofileAsset {
  /** Original filename without extension */
  name: string
  /** Full CDN download URL */
  url: string
  /** Gofile folder hash — the /d/{hash} segment */
  hash: string
  /** ISO 8601 upload timestamp */
  uploadedAt: string
}
