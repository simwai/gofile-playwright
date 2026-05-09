import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { StoreError } from './errors.js'
import type { GofileAsset } from './types.js'

const DEFAULT_STORE_PATH = resolve(process.cwd(), '.gofile-assets.json')

export async function loadAssets(storePath = DEFAULT_STORE_PATH): Promise<GofileAsset[]> {
  try {
    const raw = await readFile(storePath, 'utf-8')
    return JSON.parse(raw) as GofileAsset[]
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw new StoreError(`Failed to read asset store at ${storePath}`, err)
  }
}

export async function saveAsset(asset: GofileAsset, storePath = DEFAULT_STORE_PATH): Promise<void> {
  const assets = await loadAssets(storePath)
  const idx = assets.findIndex((a) => a.name === asset.name)
  if (idx >= 0) assets[idx] = asset
  else assets.push(asset)
  try {
    await writeFile(storePath, JSON.stringify(assets, null, 2), 'utf-8')
  } catch (err) {
    throw new StoreError(`Failed to write asset store at ${storePath}`, err)
  }
}
