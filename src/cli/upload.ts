/**
 * CLI entry point: pnpm gofile:upload <path-to-file>
 */
import { uploadToGofile } from '../upload.js'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: pnpm gofile:upload <path-to-file>')
  process.exit(1)
}

try {
  const asset = await uploadToGofile(filePath)
  console.log('\n✅ Uploaded successfully!')
  console.log(`   Name : ${asset.name}`)
  console.log(`   URL  : ${asset.url}`)
  console.log(`   Hash : ${asset.hash}`)
  console.log('\n   Asset saved to .gofile-assets.json')
} catch (err) {
  console.error('❌ Upload failed:', err)
  process.exit(1)
}
