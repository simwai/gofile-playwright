/**
 * Orchestrates verification, re-upload of dead assets, and reporting.
 * No Playwright — fast enough for pre-commit.
 */
import { existsSync } from 'fs'
import { loadAssets } from './store.js'
import { verifyAsset } from './verifier.js'
import { uploadToGofile } from './upload.js'
import type { ReuploadOutcome, VerifyResult } from './types.js'

async function reuploadDead(result: VerifyResult): Promise<ReuploadOutcome> {
  if (!existsSync(result.asset.filePath)) return 'missing-file'
  await uploadToGofile(result.asset.filePath)
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
  for (const result of dead) {
    const outcome = await reuploadDead(result)
    if (outcome === 'reuploaded') {
      console.log(`✅  Re-uploaded "${result.asset.name}" — store updated.`)
    } else {
      console.error(`🚨  "${result.asset.name}" is dead and source file not found at: ${result.asset.filePath}`)
      console.error('    Remove it from .gofile-assets.json or restore the source file.')
      reuploadFailed = true
    }
  }

  return !reuploadFailed
}

// CLI entry point — isolated at the bottom so imports don't trigger side effects
const ok = await verifyAllAssets()
process.exit(ok ? 0 : 1)
