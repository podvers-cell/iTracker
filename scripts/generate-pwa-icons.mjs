/**
 * Generates 192×192 and 512×512 PNGs from app/icon.svg for the web manifest.
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

for (const size of [192, 512]) {
  await sharp(svgPath, { density: 300 })
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `icon-${size}.png`))
}

console.log("[pwa] wrote public/icons/icon-192.png and icon-512.png")
