import { GOFILE_BASE_URL, TIMEOUTS } from './constants.js'
import type { GofileAsset, VerifyResult } from './types.js'

export async function verifyAsset(asset: GofileAsset): Promise<VerifyResult> {
  let html: string
  try {
    const res = await fetch(`${GOFILE_BASE_URL}/d/${asset.hash}`, {
      headers: { 'User-Agent': 'gofile-verify/1.0' },
      signal: AbortSignal.timeout(TIMEOUTS.verify),
    })

    if (res.status === 404) return { asset, isAlive: false, reason: 'Folder not found (404)' }
    if (!res.ok) return { asset, isAlive: false, reason: `HTTP ${res.status}` }

    html = await res.text()
  } catch (err) {
    return { asset, isAlive: false, reason: `Fetch failed: ${String(err)}` }
  }

  if (!html.includes(asset.name)) {
    return {
      asset,
      isAlive: false,
      reason: `Filename "${asset.name}" not found in page HTML — asset may have been deleted`,
    }
  }

  return { asset, isAlive: true }
}
