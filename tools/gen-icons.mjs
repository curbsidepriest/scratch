// Rasterize the vector app icon (src/app/icon.svg) into high-resolution PNGs so
// the PWA / "create desktop app from tab" dock icon is crisp instead of an
// upscaled favicon. Run: node tools/gen-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(resolve(root, "src/app/icon.svg"), "utf8");

// The source declares width/height="14"; sharp rasterizes at the SVG's intrinsic
// size, so scale those attributes to the target for a sharp render each time.
function atSize(size) {
  return Buffer.from(
    svg.replace(/width="14"/, `width="${size}"`).replace(/height="14"/, `height="${size}"`),
  );
}

const targets = [
  { file: "public/icon-512.png", size: 512 },
  { file: "public/icon-192.png", size: 192 },
  { file: "src/app/apple-icon.png", size: 180 },
  { file: "src/app/icon.png", size: 512 }, // high-res browser favicon fallback
];

for (const { file, size } of targets) {
  const png = await sharp(atSize(size), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(resolve(root, file), png);
  console.log(`wrote ${file} (${size}x${size}, ${png.length} bytes)`);
}
