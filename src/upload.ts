import { chromium } from 'playwright'
import { basename, extname, resolve } from 'path'
import { loadAssets, saveAsset } from './store.js'
import type { GofileAsset } from './types.js'
import type { Page } from 'playwright'

const MEDIA_SELECTORS: Record<string, string> = {
  '.jpg':  'img[src*="gofile.io/download"]',
  '.jpeg': 'img[src*="gofile.io/download"]',
  '.png':  'img[src*="gofile.io/download"]',
  '.webp': 'img[src*="gofile.io/download"]',
  '.svg':  'img[src*="gofile.io/download"], object[data*="gofile.io/download"]',
  '.mp4':  'video[src*="gofile.io/download"]',
  '.webm': 'video[src*="gofile.io/download"]',
  '.mov':  'video[src*="gofile.io/download"]',
  '.pdf':  'iframe[src*="gofile.io/download"], embed[src*="gofile.io/download"]',
}

async function isAssetAlive(asset: GofileAsset): Promise<boolean> {
  try {
    const res = await fetch(`https://gofile.io/d/${asset.hash}`, {
      headers: { 'User-Agent': 'gofile-verify/1.0' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return false
    const html = await res.text()
    return html.includes(asset.name)
  } catch {
    return false
  }
}

async function waitForUploadSettled(page: Page, filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  const name = basename(filePath, ext)
  const mediaSelector = MEDIA_SELECTORS[ext]

  // Phase 1: wait for any progress/uploading indicator to disappear
  await page.waitForFunction(
    () => !document.querySelector('[class*="progress"],[class*="uploading"]'),
    { timeout: 30_000, polling: 500 }
  )

  if (mediaSelector) {
    // Phase 2a: media preview element appeared — extract URL directly
    try {
      const el = page.locator(mediaSelector).first()
      await el.waitFor({ state: 'visible', timeout: 30_000 })
      const url = (await el.getAttribute('src')) ?? (await el.getAttribute('data'))
      if (url) return url
    } catch {
      // Fall through to filename-based fallback
    }
  }

  // Phase 2b: universal fallback — filename text row is always rendered
  await page.locator(`text=${name}`).first().waitFor({ state: 'visible', timeout: 30_000 })

  const downloadUrl = await page
    .locator(`a[href*="gofile.io/download"][href*="${name}"]`)
    .first()
    .getAttribute('href')

  if (!downloadUrl) throw new Error(`Could not resolve CDN URL for "${name}"`)
  return downloadUrl
}

async function runUpload(filePath: string): Promise<GofileAsset> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('https://gofile.io', { waitUntil: 'domcontentloaded' })
    await page.click('button:has-text("File Manager")')

    await page.waitForURL(/gofile\.io\/d\/[a-f0-9-]{36}/, { timeout: 15_000 })
    const folderUrl = page.url()
    const hash = folderUrl.match(/\/d\/([a-f0-9-]{36})/)?.[1]
    if (!hash) throw new Error(`Could not extract folder hash from: ${folderUrl}`)

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#filemanager_mainbuttons_uploadFiles'),
    ])
    await fileChooser.setFiles(resolve(filePath))

    const cdnUrl = await waitForUploadSettled(page, filePath)

    const ext = extname(filePath).toLowerCase()
    const name = basename(filePath, ext)
    const asset: GofileAsset = {
      name,
      url: cdnUrl,
      hash,
      uploadedAt: new Date().toISOString(),
    }

    await saveAsset(asset)
    return asset
  } finally {
    await browser.close()
  }
}

export async function uploadToGofile(filePath: string): Promise<GofileAsset> {
  const ext = extname(filePath).toLowerCase()
  const name = basename(filePath, ext)
  const existing = (await loadAssets()).find((a) => a.name === name)

  if (existing) {
    if (await isAssetAlive(existing)) {
      console.log(`⏭️  "${name}" already uploaded and alive — skipping.`)
      return existing
    }
    console.log(`⚠️  "${name}" found in store but unreachable — re-uploading.`)
  }

  return runUpload(filePath)
}
