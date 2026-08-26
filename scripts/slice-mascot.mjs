/**
 * Slices the 2x2 mascot sprite sheet (assets/image/mascot.png) into four
 * per-mood PNGs with a transparent background, and writes them into
 * apps/mobile/assets/mascot/.
 *
 * Background removal uses a flood fill starting from the image border:
 * only pixels connected to the border AND close to white are made
 * transparent. This avoids eating into the character's cream-colored fur,
 * which is light but not connected to the border.
 *
 * Run: node scripts/slice-mascot.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "assets/image/mascot.png");
const OUT_DIR = path.join(ROOT, "apps/mobile/assets/mascot");

// quadrant → mood, per assets/image/mascot.png layout (2x2, 627x627 each)
const QUADRANTS = [
  { mood: "neutral", left: 0, top: 0 },
  { mood: "thinking", left: 627, top: 0 },
  { mood: "celebrating", left: 0, top: 627 },
  { mood: "resting", left: 627, top: 627 },
];

const QUADRANT_SIZE = 627;
const WHITE_THRESHOLD = 240; // min channel value to be considered "background white"
const CHANNEL_SPREAD_MAX = 18; // max(R,G,B) - min(R,G,B), keeps colored edges out

function floodFillTransparent(raw, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const stack = [];

  const isWhiteish = (idx) => {
    const r = raw[idx];
    const g = raw[idx + 1];
    const b = raw[idx + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return min >= WHITE_THRESHOLD && max - min <= CHANNEL_SPREAD_MAX;
  };

  const pushIfWhite = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const idx = p * channels;
    if (isWhiteish(idx)) {
      visited[p] = 1;
      stack.push([x, y]);
    }
  };

  for (let x = 0; x < width; x++) {
    pushIfWhite(x, 0);
    pushIfWhite(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfWhite(0, y);
    pushIfWhite(width - 1, y);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    pushIfWhite(x + 1, y);
    pushIfWhite(x - 1, y);
    pushIfWhite(x, y + 1);
    pushIfWhite(x, y - 1);
  }

  for (let p = 0; p < width * height; p++) {
    if (visited[p]) {
      raw[p * channels + 3] = 0;
    }
  }

  return visited;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const { mood, left, top } of QUADRANTS) {
    const { data, info } = await sharp(SOURCE)
      .extract({ left, top, width: QUADRANT_SIZE, height: QUADRANT_SIZE })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    floodFillTransparent(data, info.width, info.height, info.channels);

    const outPath = path.join(OUT_DIR, `${mood}.png`);
    await sharp(data, { raw: info })
      .trim()
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
