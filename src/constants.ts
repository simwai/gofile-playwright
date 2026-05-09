export const GOFILE_BASE_URL = 'https://gofile.io'
export const GOFILE_FOLDER_URL_PATTERN = /gofile\.io\/d\/([a-f0-9-]{36})/

export const SELECTORS = {
  fileManagerButton: 'button:has-text("File Manager")',
  uploadButton: '#filemanager_mainbuttons_uploadFiles',
} as const

export const MEDIA_SELECTORS: Record<string, string> = {
  '.jpg': 'img[src*="gofile.io/download"]',
  '.jpeg': 'img[src*="gofile.io/download"]',
  '.png': 'img[src*="gofile.io/download"]',
  '.webp': 'img[src*="gofile.io/download"]',
  '.svg': 'img[src*="gofile.io/download"], object[data*="gofile.io/download"]',
  '.mp4': 'video[src*="gofile.io/download"]',
  '.webm': 'video[src*="gofile.io/download"]',
  '.mov': 'video[src*="gofile.io/download"]',
  '.pdf': 'iframe[src*="gofile.io/download"], embed[src*="gofile.io/download"]',
}

export const TIMEOUTS = {
  navigation: 15_000,
  upload: 30_000,
  liveness: 8_000,
  verify: 10_000,
  pasteSequence: 100,
} as const
