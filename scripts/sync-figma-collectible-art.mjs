#!/usr/bin/env node
/**
 * Sync collectible GIFs from Figma → public/assets/collectibles/
 * Builds transparent static PNGs + grid spritesheets for Phaser.
 * Manifest: figma/export-collectible-manifest.json
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'figma/export-collectible-manifest.json');
const GRID_COLS = 10;
/** Remove Figma GIF black matte — no square padding (avoids side bars on portrait art). */
const TRANSPARENT_FILTER = 'format=rgba,colorkey=black:0.12:0.06';

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'venezuelan-game-asset-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function countGifFrames(gifPath) {
  const out = execSync(
    `ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "${gifPath}"`,
    { encoding: 'utf8' },
  ).trim();
  const frames = Number.parseInt(out, 10);
  if (!Number.isFinite(frames) || frames < 1) {
    throw new Error(`Could not count frames for ${gifPath}`);
  }
  return frames;
}

function probeImageSize(imagePath) {
  const out = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${imagePath}"`,
    { encoding: 'utf8' },
  ).trim();
  const [w, h] = out.split(',').map((n) => Number.parseInt(n, 10));
  return { width: w, height: h };
}

function buildStaticFrame(gifPath, staticPath, displaySize) {
  const vf = ['fps=12', `scale=-1:${displaySize}`, TRANSPARENT_FILTER].join(',');
  execSync(`ffmpeg -y -i "${gifPath}" -vf "${vf}" -frames:v 1 -update 1 "${staticPath}"`, {
    stdio: 'pipe',
  });
  return probeImageSize(staticPath);
}

function buildSpritesheet(gifPath, sheetPath, displaySize) {
  const frameCount = countGifFrames(gifPath);
  const cols = GRID_COLS;
  const rows = Math.ceil(frameCount / cols);
  const vf = [
    'fps=12',
    `scale=-1:${displaySize}`,
    TRANSPARENT_FILTER,
    `pad=${displaySize}:${displaySize}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`,
    `tile=${cols}x${rows}`,
  ].join(',');
  execSync(`ffmpeg -y -i "${gifPath}" -vf "${vf}" -frames:v 1 "${sheetPath}"`, {
    stdio: 'pipe',
  });
  return { frameCount, cols, rows };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  let ok = 0;

  for (const [key, entry] of Object.entries(manifest.collectibles)) {
    const dest = path.join(ROOT, entry.dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = await fetchBuffer(entry.gif);
    fs.writeFileSync(dest, buf);
    console.log(`saved ${key} → ${entry.dest} (${buf.byteLength} bytes)`);

    const displaySize = entry.displaySize ?? 48;
    const sheetRel = `public/assets/collectibles/sheets/${key}-sheet.png`;
    const staticRel = `public/assets/collectibles/sheets/${key}-static.png`;
    const sheetPath = path.join(ROOT, sheetRel);
    const staticPath = path.join(ROOT, staticRel);
    fs.mkdirSync(path.dirname(sheetPath), { recursive: true });

    const { width, height } = buildStaticFrame(dest, staticPath, displaySize);
    const { frameCount, cols, rows } = buildSpritesheet(dest, sheetPath, displaySize);

    entry.sheet = sheetRel;
    entry.static = staticRel;
    entry.frameCount = frameCount;
    entry.frameWidth = width;
    entry.frameHeight = height;
    entry.sheetFrameSize = displaySize;
    entry.sheetCols = cols;
    entry.sheetRows = rows;
    entry.frameRate = 12;
    console.log(
      `static ${key} → ${staticRel} (${width}x${height}), sheet ${frameCount} frames (${cols}x${rows})`,
    );
    ok += 1;
  }

  manifest.syncedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Done — ${ok} collectible GIF(s). Bump collectibleAssetVersion in gameConfig.ts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
