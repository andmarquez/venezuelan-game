#!/usr/bin/env node
/**
 * Sync world assets from Figma → public/assets/world/
 *
 * WORKFLOW (after editing components in Figma):
 * 1. Re-export PNGs: paste URLs in figma/export-urls.json (from Figma MCP export)
 *    OR set FIGMA_ACCESS_TOKEN and run: npm run assets:export
 * 2. Download:        npm run assets:download
 * 3. Manifest:        npm run assets:manifest
 *
 * Component names in Figma MUST match figma/world-asset-registry.json
 * (Blocks-1 → blocks-1.png, waves → waves.png, etc.) so re-exports overwrite files.
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
const LAYOUT_PATH = path.join(WORLD_DIR, 'level-1/layout.json');

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

/** Build manifest.json from files on disk + registry metadata */
function buildManifest() {
  const registry = readRegistry();
  const textures = {};

  for (const comp of registry.components) {
    const abs = path.join(WORLD_DIR, comp.file);
    const exists = fs.existsSync(abs);
    textures[comp.assetKey] = {
      key: comp.assetKey,
      figmaName: comp.figmaName,
      figmaNodeId: comp.figmaNodeId,
      category: comp.category,
      path: `/assets/world/${comp.file}`,
      file: comp.file,
      collider: comp.collider ?? false,
      scrollFactor: comp.scrollFactor ?? 1,
      present: exists,
    };
  }

  const layout = fs.existsSync(LAYOUT_PATH)
    ? JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf8'))
    : null;

  const manifest = {
    generatedAt: new Date().toISOString(),
    figmaFileKey: registry.figmaFileKey,
    figmaFileUrl: registry.figmaFileUrl,
    version: registry.version,
    textures,
    layout: layout
      ? { level: 'level-1', width: layout.width, height: layout.height, platformCount: layout.platforms?.length ?? 0 }
      : null,
  };

  fs.mkdirSync(WORLD_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  const present = Object.values(textures).filter((t) => t.present).length;
  console.log(`manifest.json — ${present}/${registry.components.length} textures on disk`);
}

/** Download PNGs from figma/export-urls.json { "blocks-1": "https://...", ... } */
async function downloadFromUrls() {
  if (!fs.existsSync(EXPORT_URLS_PATH)) {
    console.error('Missing figma/export-urls.json — export URLs from Figma MCP first.');
    process.exit(1);
  }
  const urls = JSON.parse(fs.readFileSync(EXPORT_URLS_PATH, 'utf8'));
  const registry = readRegistry();
  let ok = 0;

  for (const comp of registry.components) {
    const url = urls[comp.assetKey];
    if (!url) {
      console.warn(`skip (no URL): ${comp.assetKey}`);
      continue;
    }
    const dest = path.join(WORLD_DIR, comp.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`fail ${comp.assetKey}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`saved ${comp.file} (${buf.length} bytes)`);
    ok++;
  }
  console.log(`Downloaded ${ok} assets`);
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
  const ids = registry.components.map((c) => c.figmaNodeId).join(',');
  const url = `https://api.figma.com/v1/images/${registry.figmaFileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=2`;

  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    console.error(`Figma API error: HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const exportUrls = {};
  for (const comp of registry.components) {
    const imageUrl = data.images?.[comp.figmaNodeId];
    if (imageUrl) exportUrls[comp.assetKey] = imageUrl;
  }

  fs.mkdirSync(path.dirname(EXPORT_URLS_PATH), { recursive: true });
  fs.writeFileSync(EXPORT_URLS_PATH, JSON.stringify(exportUrls, null, 2));
  console.log(`Wrote ${Object.keys(exportUrls).length} URLs to figma/export-urls.json`);
  await downloadFromUrls();
}

function listRegistry() {
  const registry = readRegistry();
  for (const c of registry.components) {
    const abs = path.join(WORLD_DIR, c.file);
    const mark = fs.existsSync(abs) ? '✓' : ' ';
    console.log(`${mark} ${c.assetKey.padEnd(12)} ${c.figmaNodeId.padEnd(10)} ${c.figmaName}`);
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
