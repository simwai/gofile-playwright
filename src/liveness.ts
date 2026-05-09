import { GOFILE_BASE_URL, TIMEOUTS } from './constants.js'
import type { GofileAsset } from './types.js'

export async function isAssetAlive(asset: GofileAsset): Promise<boolean> {
  try {
    const res = await fetch(`${GOFILE_BASE_URL}/d/${asset.hash}`, {
      headers: { 'User-Agent': 'gofile-verify/1.0' },
      signal: AbortSignal.timeout(TIMEOUTS.liveness),
    })
    if (!res.ok) return false
    const html = await res.text()
    return html.includes(asset.name)
  } catch {
    return false
  }
}
