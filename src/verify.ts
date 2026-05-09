/**
 * Verifies gofile assets using plain HTTP fetch + HTML string search.
 * No Playwright — fast enough for pre-commit.
 */
import { loadAssets } from './store.js'
import type { GofileAsset } from './types.js'

interface VerifyResult {
  asset: GofileAsset
  isAlive: boolean
  reason?: string
}

async function verifyAsset(asset: GofileAsset): Promise<VerifyResult> {
  const url = `https://gofile.io/d/${asset.hash}`

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'gofile-verify/1.0' },
      signal: AbortSignal.timeout(10_000),
    })

    if (res.status === 404) {
      return { asset, isAlive: false, reason: 'Folder not found (404)' }
    }
    if (!res.ok) {
      return { asset, isAlive: false, reason: `HTTP ${res.status}` }
    }

    html = await res.text()
  } catch (err) {
    return { asset, isAlive: false, reason: `Fetch failed: ${String(err)}` }
  }

  // Gofile always renders the filename (without extension) in the page HTML
  if (!html.includes(asset.name)) {
    return {
      asset,
      isAlive: false,
      reason: `Filename "${asset.name}" not found in page HTML — asset may have been deleted`,
    }
  }

  return { asset, isAlive: true }
}

export async function verifyAllAssets(): Promise<boolean> {
  const assets = await loadAssets()

  if (assets.length === 0) {
    console.log('✅ No gofile assets registered — nothing to verify.')
    return true
  }

  // Sequential to avoid hammering gofile with concurrent requests
  const results: VerifyResult[] = []
  for (const asset of assets) {
    const result = await verifyAsset(asset)
    results.push(result)
    const icon = result.isAlive ? '✅' : '❌'
    const detail = result.reason ? ` (${result.reason})` : ''
    console.log(`${icon}  ${asset.name}${detail}`)
  }

  const dead = results.filter((r) => !r.isAlive)
  if (dead.length > 0) {
    console.error(`\n🚨 ${dead.length} asset(s) unreachable. Re-upload or remove from .gofile-assets.json before committing.`)
    return false
  }

  console.log('\n✅ All gofile assets verified.')
  return true
}

// Entry point when run directly
const ok = await verifyAllAssets()
process.exit(ok ? 0 : 1)
