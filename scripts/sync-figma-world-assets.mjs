#!/usr/bin/env node
/**
 * Sync world background from Figma → public/assets/world/background/
 *
 * WORKFLOW (after editing M02 in Figma):
 * 1. Export background layer "- 1" (node 24:328) via Figma MCP download_assets
 * 2. Save as public/assets/world/background/level-1-mobile.png
 * 3. Update layout-mobile.json platforms/markers from 🎯 Gameplay Zones (26:178)
 * 4. Regenerate manifest: npm run assets:manifest
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'figma/world-asset-registry.json');
const WORLD_DIR = path.join(ROOT, 'public/assets/world');
const MANIFEST_PATH = path.join(WORLD_DIR, 'manifest.json');
const EXPORT_URLS_PATH = path.join(ROOT, 'figma/export-urls.json');
const LAYOUT_MOBILE_PATH = path.join(WORLD_DIR, 'level-1/layout-mobile.json');

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

/** Build manifest.json from background files on disk + registry metadata */
function buildManifest() {
  const registry = readRegistry();
  const backgrounds = {};

  for (const bg of registry.backgrounds ?? []) {
    const abs = path.join(WORLD_DIR, bg.file);
    const exists = fs.existsSync(abs);
    backgrounds[bg.assetKey] = {
      key: bg.textureKey,
      path: `/assets/world/${bg.file}`,
      figmaNodeId: bg.figmaNodeId,
      figmaName: bg.figmaName,
      present: exists,
    };
  }

  const layout = fs.existsSync(LAYOUT_MOBILE_PATH)
    ? JSON.parse(fs.readFileSync(LAYOUT_MOBILE_PATH, 'utf8'))
    : null;

  const manifest = {
    generatedAt: new Date().toISOString(),
    figmaFileKey: registry.figmaFileKey,
    figmaFileUrl: registry.figmaFileUrl,
    version: registry.version,
    backgrounds,
    layout: layout
      ? {
          level: 'level-1',
          width: layout.width,
          height: layout.height,
          platformCount: layout.platforms?.length ?? 0,
        }
      : null,
  };

  fs.mkdirSync(WORLD_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  const present = Object.values(backgrounds).filter((b) => b.present).length;
  console.log(`manifest.json — ${present}/${registry.backgrounds?.length ?? 0} backgrounds on disk`);
}

/** Download PNGs from figma/export-urls.json { "level-1-mobile": "https://...", ... } */
async function downloadFromUrls() {
  if (!fs.existsSync(EXPORT_URLS_PATH)) {
    console.error('Missing figma/export-urls.json — export URL from Figma MCP first.');
    process.exit(1);
  }
  const urls = JSON.parse(fs.readFileSync(EXPORT_URLS_PATH, 'utf8'));
  const registry = readRegistry();
  let ok = 0;

  for (const bg of registry.backgrounds ?? []) {
    const url = urls[bg.assetKey];
    if (!url) {
      console.warn(`skip (no URL): ${bg.assetKey}`);
      continue;
    }
    const dest = path.join(WORLD_DIR, bg.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`fail ${bg.assetKey}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`saved ${bg.file} (${buf.length} bytes)`);
    ok++;
  }
  console.log(`Downloaded ${ok} backgrounds`);
  buildManifest();
}

/** Export via Figma REST API when FIGMA_ACCESS_TOKEN is set */
async function exportViaFigmaApi() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.error('Set FIGMA_ACCESS_TOKEN to use assets:export');
    process.exit(1);
  }

  const registry = readRegistry();
  const ids = (registry.backgrounds ?? []).map((b) => b.figmaNodeId).join(',');
  const url = `https://api.figma.com/v1/images/${registry.figmaFileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=1`;

  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    console.error(`Figma API error: HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const exportUrls = {};
  for (const bg of registry.backgrounds ?? []) {
    const imageUrl = data.images?.[bg.figmaNodeId];
    if (imageUrl) exportUrls[bg.assetKey] = imageUrl;
  }

  fs.mkdirSync(path.dirname(EXPORT_URLS_PATH), { recursive: true });
  fs.writeFileSync(EXPORT_URLS_PATH, JSON.stringify(exportUrls, null, 2));
  console.log(`Wrote ${Object.keys(exportUrls).length} URLs to figma/export-urls.json`);
  await downloadFromUrls();
}

function listRegistry() {
  const registry = readRegistry();
  for (const bg of registry.backgrounds ?? []) {
    const abs = path.join(WORLD_DIR, bg.file);
    const mark = fs.existsSync(abs) ? '✓' : ' ';
    console.log(`${mark} ${bg.assetKey.padEnd(16)} ${bg.figmaNodeId.padEnd(10)} ${bg.figmaName}`);
  }
}

const cmd = process.argv[2] ?? 'manifest';

if (cmd === 'manifest') {
  buildManifest();
} else if (cmd === 'download') {
  await downloadFromUrls();
} else if (cmd === 'export') {
  await exportViaFigmaApi();
} else if (cmd === 'list') {
  listRegistry();
} else {
  console.log('Usage: node scripts/sync-figma-world-assets.mjs [manifest|download|export|list]');
}
