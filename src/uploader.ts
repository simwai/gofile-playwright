import { chromium } from 'playwright'
import { basename, extname, resolve } from 'path'
import { saveAsset } from './store.js'
import { GofileUploadError } from './errors.js'
import { GOFILE_BASE_URL, GOFILE_FOLDER_URL_PATTERN, MEDIA_SELECTORS, SELECTORS, TIMEOUTS } from './constants.js'
import type { GofileAsset } from './types.js'
import type { Page } from 'playwright'

async function resolveCdnUrl(page: Page, filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  const name = basename(filePath, ext)
  const mediaSelector = MEDIA_SELECTORS[ext]

  await page.waitForFunction(
    () => !document.querySelector('[class*="progress"],[class*="uploading"]'),
    { timeout: TIMEOUTS.upload, polling: 500 },
  )

  if (mediaSelector) {
    try {
      const el = page.locator(mediaSelector).first()
      await el.waitFor({ state: 'visible', timeout: TIMEOUTS.upload })
      const url = (await el.getAttribute('src')) ?? (await el.getAttribute('data'))
      if (url) return url
    } catch {
      // Fall through to filename-row fallback
    }
  }

  await page.locator(`text=${name}`).first().waitFor({ state: 'visible', timeout: TIMEOUTS.upload })

  const downloadUrl = await page
    .locator(`a[href*="${GOFILE_BASE_URL}/download"][href*="${name}"]`)
    .first()
    .getAttribute('href')

  if (!downloadUrl) throw new GofileUploadError(`Could not resolve CDN URL for "${name}"`, filePath)
  return downloadUrl
}

export async function runUpload(filePath: string): Promise<GofileAsset> {
  const absolutePath = resolve(filePath)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(GOFILE_BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.click(SELECTORS.fileManagerButton)

    await page.waitForURL(GOFILE_FOLDER_URL_PATTERN, { timeout: TIMEOUTS.navigation })
    const hash = page.url().match(GOFILE_FOLDER_URL_PATTERN)?.[1]
    if (!hash) throw new GofileUploadError(`Could not extract folder hash from: ${page.url()}`, absolutePath)

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click(SELECTORS.uploadButton),
    ])
    await fileChooser.setFiles(absolutePath)

    const cdnUrl = await resolveCdnUrl(page, absolutePath)
    const ext = extname(absolutePath).toLowerCase()
    const name = basename(absolutePath, ext)

    const asset: GofileAsset = {
      name,
      url: cdnUrl,
      hash,
      filePath: absolutePath,
      uploadedAt: new Date().toISOString(),
    }

    await saveAsset(asset)
    return asset
  } finally {
    await browser.close()
  }
}
