/**
 * Verifies gofile assets using plain HTTP fetch + HTML string search.
 * No Playwright — fast enough for pre-commit.
 * Dead assets are automatically re-uploaded if filePath is resolvable.
 */
import { existsSync } from 'fs'
import { loadAssets } from './store.js'
import { uploadToGofile } from './upload.js'
import type { GofileAsset } from './types.js'

interface VerifyResult {
  asset: GofileAsset
  isAlive: boolean
  reason?: string
}

async function verifyAsset(asset: GofileAsset): Promise<VerifyResult> {
  let html: string
  try {
    const res = await fetch(`https://gofile.io/d/${asset.hash}`, {
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

  if (!html.includes(asset.name)) {
    return {
      asset,
      isAlive: false,
      reason: `Filename "${asset.name}" not found in page HTML — asset may have been deleted`,
    }
  }

  return { asset, isAlive: true }
}

async function tryReupload(asset: GofileAsset): Promise<'reuploaded' | 'missing-file'> {
  if (!existsSync(asset.filePath)) {
    return 'missing-file'
  }
  // uploadToGofile handles the dead-asset case internally and overwrites the store
  await uploadToGofile(asset.filePath)
  return 'reuploaded'
}

export async function verifyAllAssets(): Promise<boolean> {
  const assets = await loadAssets()

  if (assets.length === 0) {
    console.log('✅ No gofile assets registered — nothing to verify.')
    return true
  }

  const results: VerifyResult[] = []
  for (const asset of assets) {
    const result = await verifyAsset(asset)
    results.push(result)
    const icon = result.isAlive ? '✅' : '❌'
    const detail = result.reason ? ` (${result.reason})` : ''
    console.log(`${icon}  ${asset.name}${detail}`)
  }

  const dead = results.filter((r) => !r.isAlive)
  if (dead.length === 0) {
    console.log('\n✅ All gofile assets verified.')
    return true
  }

  console.log(`\n⚠️  ${dead.length} dead asset(s) — attempting re-upload...\n`)

  let reuploadFailed = false
  for (const { asset } of dead) {
    const outcome = await tryReupload(asset)
    if (outcome === 'reuploaded') {
      console.log(`✅  Re-uploaded "${asset.name}" — store updated.`)
    } else {
      console.error(`🚨  "${asset.name}" is dead and source file not found at: ${asset.filePath}`)
      console.error('    Remove it from .gofile-assets.json or restore the source file.')
      reuploadFailed = true
    }
  }

  return !reuploadFailed
}

// Entry point when run directly
const ok = await verifyAllAssets()
process.exit(ok ? 0 : 1)
