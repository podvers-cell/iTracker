/**
 * Generates PNGs from app/icon.svg: manifest sizes + iOS home screen (180×180).
 * Uses `contain` + black matte so the full artwork matches favicon.svg (no `cover` crop).
 */
import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const svgPath = join(root, "app", "icon.svg")
const outDir = join(root, "public", "icons")

const BLACK = { r: 0, g: 0, b: 0, alpha: 1 }

await mkdir(outDir, { recursive: true })

async function writePng(size, filename) {
  await sharp(svgPath, { density: 480 })
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      background: BLACK,
    })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, filename))
}

await writePng(180, "apple-touch-icon.png")
await writePng(192, "icon-192.png")
await writePng(512, "icon-512.png")
/* iOS often probes /apple-touch-icon.png at site root when adding to Home Screen */
await sharp(svgPath, { density: 480 })
  .resize(180, 180, {
    fit: "contain",
    position: "centre",
    background: BLACK,
  })
  .png({ compressionLevel: 9 })
  .toFile(join(root, "public", "apple-touch-icon.png"))

console.log(
  "[pwa] wrote public/icons/apple-touch-icon.png, icon-192.png, icon-512.png, public/apple-touch-icon.png"
)
