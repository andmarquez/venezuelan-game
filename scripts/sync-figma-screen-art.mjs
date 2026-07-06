#!/usr/bin/env node
/**
 * Sync M01 / M03 / M04 screen art from Figma → public/assets/ui/screens/
 * Run after updating splash, menu, game-over, or win frames in Figma.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'figma/export-screen-manifest.json');

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'performingtypography-asset-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  let ok = 0;

  for (const [key, entry] of Object.entries(manifest.screens)) {
    const dest = path.join(ROOT, entry.dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = await fetchBuffer(entry.export);
    fs.writeFileSync(dest, buf);
    console.log(`saved ${key} → ${entry.dest} (${buf.byteLength} bytes)`);
    ok += 1;
  }

  for (const [splashKey, splash] of Object.entries(manifest.splash ?? {})) {
    const source = manifest.screens[splash.source];
    if (!source) {
      console.warn(`skip splash ${splashKey}: unknown source ${splash.source}`);
      continue;
    }
    const srcPath = path.join(ROOT, source.dest);
    const dest = path.join(ROOT, splash.dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(srcPath, dest);
    console.log(`copied ${splash.source} → ${splash.dest} (${splashKey})`);
  }

  manifest.syncedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Done — ${ok} screen asset(s). Bump screenAssetVersion in gameConfig.ts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
