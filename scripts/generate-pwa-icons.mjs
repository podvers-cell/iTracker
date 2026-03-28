/**
 * Generates PNGs from app/icon.svg: manifest sizes + iOS home screen (180×180).
 */
import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const svgPath = join(root, "app", "icon.svg")
const outDir = join(root, "public", "icons")

await mkdir(outDir, { recursive: true })

async function writePng(size, filename) {
  await sharp(svgPath, { density: 300 })
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, filename))
}

await writePng(180, "apple-touch-icon.png")
await writePng(192, "icon-192.png")
await writePng(512, "icon-512.png")
/* iOS often probes /apple-touch-icon.png at site root when adding to Home Screen */
await sharp(svgPath, { density: 300 })
  .resize(180, 180, { fit: "cover", position: "centre" })
  .png({ compressionLevel: 9 })
  .toFile(join(root, "public", "apple-touch-icon.png"))

console.log(
  "[pwa] wrote public/icons/apple-touch-icon.png, icon-192.png, icon-512.png, public/apple-touch-icon.png"
)
