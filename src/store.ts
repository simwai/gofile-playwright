import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import type { GofileAsset } from './types.js'

const STORE_PATH = resolve(process.cwd(), '.gofile-assets.json')

export async function loadAssets(): Promise<GofileAsset[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8')
    return JSON.parse(raw) as GofileAsset[]
  } catch {
    return []
  }
}

export async function saveAsset(asset: GofileAsset): Promise<void> {
  const assets = await loadAssets()
  const idx = assets.findIndex((a) => a.name === asset.name)
  if (idx >= 0) assets[idx] = asset
  else assets.push(asset)
  await writeFile(STORE_PATH, JSON.stringify(assets, null, 2), 'utf-8')
}
