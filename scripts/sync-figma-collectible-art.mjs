#!/usr/bin/env node
/**
 * Sync collectible GIFs from Figma → public/assets/collectibles/
 * Manifest: figma/export-collectible-manifest.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'figma/export-collectible-manifest.json');

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'venezuelan-game-asset-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
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
