#!/usr/bin/env node
/**
 * Sync Enemy components from Figma → public/assets/enemy/
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'figma/export-enemy-manifest.json');
const OUT_DIR = path.join(ROOT, 'public/assets/enemy');
const PICKER = path.join(__dirname, 'pick-enemy-png.py');

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'performingtypography-asset-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function saveEnemy(key, entry) {
  const urls = [...(entry.raw ?? [])].filter(Boolean);
  const dest = path.join(OUT_DIR, `${key}.png`);

  if (!urls.length && entry.export) {
    urls.push(entry.export);
  }

  if (!urls.length) {
    console.warn(`skip ${key}: no URLs in manifest`);
    return false;
  }

  const picker = spawnSync('python3', [PICKER], {
    input: JSON.stringify({
      urls,
      figmaW: entry.figmaW ?? 40,
      figmaH: entry.figmaH ?? 32,
    }),
    maxBuffer: 20 * 1024 * 1024,
  });

  if (picker.status === 0 && picker.stdout?.length) {
    fs.writeFileSync(dest, picker.stdout);
    console.log(`saved ${key}.png (${picker.stdout.length} bytes)`);
    return true;
  }

  return fetchBuffer(urls[urls.length - 1])
    .then((buf) => {
      fs.writeFileSync(dest, buf);
      console.warn(`saved ${key}.png (${buf.byteLength} bytes, raw fallback)`);
      return true;
    })
    .catch((err) => {
      console.warn(`skip ${key}: ${err.message}`);
      return false;
    });
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const [key, entry] of Object.entries(manifest)) {
    if (await saveEnemy(key, entry)) ok++;
  }

  console.log(`Downloaded ${ok}/${Object.keys(manifest).length} enemy sprites`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
