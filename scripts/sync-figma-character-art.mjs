#!/usr/bin/env node
/**
 * Sync Character/Andsiosa art from Figma → public/assets/character/
 * Run state: animated GIF → horizontal PNG spritesheet.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'figma/export-character-manifest.json');
const OUT_DIR = path.join(ROOT, 'public/assets/character');
const META_PATH = path.join(OUT_DIR, 'andsiosa-run.meta.json');
const PICKER = path.join(__dirname, 'pick-character-png.py');
const GIF_SHEET = path.join(__dirname, 'gif-to-spritesheet.py');

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'performingtypography-asset-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function pickAndSave(state, entry) {
  const urls = [...(entry.raw ?? [])].filter(Boolean);
  const dest = path.join(OUT_DIR, `andsiosa-${state}.png`);

  if (!urls.length) {
    return fetchBuffer(entry.export)
      .then((buf) => {
        fs.writeFileSync(dest, buf);
        console.warn(`saved andsiosa-${state}.png (${buf.byteLength} bytes, export only)`);
        return true;
      })
      .catch((err) => {
        console.warn(`skip ${state}: ${err.message}`);
        return false;
      });
  }

  const picker = spawnSync('python3', [PICKER], {
    input: JSON.stringify({ urls, overlays: entry.overlays ?? [] }),
    maxBuffer: 20 * 1024 * 1024,
  });

  if (picker.status === 0 && picker.stdout?.length) {
    fs.writeFileSync(dest, picker.stdout);
    console.log(`saved andsiosa-${state}.png (${picker.stdout.length} bytes, transparent raw)`);
    return Promise.resolve(true);
  }

  return fetchBuffer(urls[urls.length - 1])
    .then((buf) => {
      fs.writeFileSync(dest, buf);
      console.warn(`saved andsiosa-${state}.png (${buf.byteLength} bytes, raw fallback)`);
      return true;
    })
    .catch((err) => {
      console.warn(`skip ${state}: ${err.message}`);
      return false;
    });
}

function saveRunSpritesheet(entry) {
  const url = entry.export || entry.raw?.[0];
  if (!url) return false;

  const proc = spawnSync('python3', [GIF_SHEET], {
    input: JSON.stringify({ url }),
    maxBuffer: 30 * 1024 * 1024,
  });

  if (proc.status !== 0 || !proc.stdout?.length) {
    console.warn('run GIF spritesheet failed:', proc.stderr?.toString() || proc.status);
    return false;
  }

  const dest = path.join(OUT_DIR, 'andsiosa-run.png');
  fs.writeFileSync(dest, proc.stdout);

  const metaLine = proc.stderr?.toString().trim().split('\n').pop();
  let meta = { frameCount: entry.frameCount ?? 3, frameWidth: 144, frameHeight: 192 };
  try {
    if (metaLine) meta = { ...meta, ...JSON.parse(metaLine) };
  } catch {
    /* keep defaults */
  }
  fs.writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`saved andsiosa-run.png spritesheet (${proc.stdout.length} bytes, ${meta.frameCount} frames)`);
  return true;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const [state, entry] of Object.entries(manifest)) {
    if (state === 'run' && entry.animated) {
      if (saveRunSpritesheet(entry)) ok++;
      continue;
    }
    if (await pickAndSave(state, entry)) ok++;
  }

  console.log(`Downloaded ${ok}/${Object.keys(manifest).length} character sprites`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
