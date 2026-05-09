import { basename, extname, resolve } from 'path'
import { loadAssets } from './store.js'
import { isAssetAlive } from './liveness.js'
import { runUpload } from './uploader.js'
import type { GofileAsset } from './types.js'

/**
 * Idempotent public upload API.
 * Skips upload if the asset is already alive; re-uploads if dead.
 */
export async function uploadToGofile(filePath: string): Promise<GofileAsset> {
  const absolutePath = resolve(filePath)
  const name = basename(absolutePath, extname(absolutePath))
  const existing = (await loadAssets()).find((a) => a.name === name)

  if (existing) {
    if (await isAssetAlive(existing)) {
      console.log(`⏭️  "${name}" already uploaded and alive — skipping.`)
      return existing
    }
    console.log(`⚠️  "${name}" found in store but unreachable — re-uploading.`)
  }

  return runUpload(absolutePath)
}
