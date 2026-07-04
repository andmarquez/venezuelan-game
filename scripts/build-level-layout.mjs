#!/usr/bin/env node
/**
 * Build simplified level layouts from Figma placement export.
 * Visual art → background/foreground; gameplay → named platform rectangles.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LEGACY = path.join(ROOT, 'public/assets/world/level-1/figma-visual-placements.json');

const BACKGROUND_KEYS = new Set([
  'bridge', 'm', 'm-1', 'm-2', 'm-3', 't-1', 't-2', 'island', 'c-1', 'c-2',
  'waves', 'waves-2', 'i-2', 'i-3', 'i-4', 'i-5', 'i-6', 'i-7', 'i-8', 'i-9', 'i-10',
  'blocks-1', 'blocks-2',
]);

const FOREGROUND_KEYS = new Set([
  'g', 'g-1', 'g-2', 'g-3', 'g-4', 'g-5',
  'barril', 'flag', 'pipe-1', 'pipe-2', 'rocks',
]);

/** Named invisible platforms — edit these to tune gameplay (Figma top-left coords). */
const PLATFORMS = [
  { name: 'platform_start', x: 0, y: 656, width: 1000, height: 20, type: 'platform' },
  { name: 'floating_platform_01', x: 329, y: 531, width: 195, height: 20, type: 'platform' },
  { name: 'platform_01', x: 1000, y: 656, width: 500, height: 20, type: 'platform' },
  { name: 'floating_platform_02', x: 853, y: 600, width: 480, height: 20, type: 'platform' },
  { name: 'platform_02', x: 1500, y: 656, width: 1586, height: 20, type: 'platform' },
  { name: 'floating_platform_03', x: 1500, y: 531, width: 195, height: 20, type: 'platform' },
  { name: 'floating_platform_04', x: 2239, y: 533, width: 195, height: 20, type: 'platform' },
  { name: 'platform_03', x: 3086, y: 664, width: 1400, height: 20, type: 'platform' },
  { name: 'floating_platform_05', x: 2970, y: 530, width: 170, height: 20, type: 'platform' },
  { name: 'floating_platform_06', x: 3916, y: 553, width: 195, height: 20, type: 'platform' },
  { name: 'platform_04', x: 4486, y: 664, width: 2225, height: 20, type: 'platform' },
  { name: 'floating_platform_07', x: 4977, y: 531, width: 195, height: 20, type: 'platform' },
  { name: 'platform_05', x: 6711, y: 664, width: 1290, height: 20, type: 'platform' },
  { name: 'floating_platform_08', x: 6908, y: 531, width: 195, height: 20, type: 'platform' },
  { name: 'goal_platform', x: 8000, y: 664, width: 553, height: 20, type: 'platform' },
];

const MARKERS = {
  player_spawn: { x: 198, y: 656 },
  portal_goal: { x: 8459, y: 545 },
  kiss_collectibles: [
    { x: 262, y: 620 },
    { x: 427, y: 440 },
    { x: 762, y: 382 },
  ],
  timer_collectibles: [{ x: 864, y: 384 }],
  enemies: [{ x: 520, y: 640, min: 350, max: 750 }],
};

function toVisual(p) {
  return {
    assetKey: p.assetKey,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
  };
}

function buildLayout(variant, artboard, nodeId) {
  const source = JSON.parse(fs.readFileSync(LEGACY, 'utf8'));
  const placements = source.background ?? [];

  const background = placements
    .filter((p) => BACKGROUND_KEYS.has(p.assetKey))
    .map(toVisual);

  const foreground =
    source.foreground ??
    placements.filter((p) => FOREGROUND_KEYS.has(p.assetKey)).map(toVisual);

  return {
    level: 'level-1',
    variant,
    figmaArtboard: artboard,
    figmaNodeId: nodeId,
    width: source.width ?? 8553,
    height: source.height ?? 720,
    background: {
      mode: 'composite',
      placements: background,
      sections: [
        { path: '/assets/world/background/level-1-section-1.png', x: 0, y: 0, width: 2850, height: 720 },
        { path: '/assets/world/background/level-1-section-2.png', x: 2850, y: 0, width: 2850, height: 720 },
        { path: '/assets/world/background/level-1-section-3.png', x: 5700, y: 0, width: 2853, height: 720 },
      ],
    },
    platforms: PLATFORMS,
    foreground,
    markers: MARKERS,
  };
}

const outDir = path.join(ROOT, 'public/assets/world/level-1');
const mobile = buildLayout('mobile', 'M02 — Gameplay (Level 1)', '13:2');
const desktop = buildLayout('desktop', 'D02 — Gameplay', '13:2');

fs.writeFileSync(path.join(outDir, 'layout-mobile.json'), JSON.stringify(mobile, null, 2));
fs.writeFileSync(path.join(outDir, 'layout-desktop.json'), JSON.stringify(desktop, null, 2));
fs.writeFileSync(path.join(outDir, 'layout.json'), JSON.stringify(mobile, null, 2));
console.log(`Wrote layouts — ${PLATFORMS.length} platforms, ${mobile.background.placements.length} bg sprites`);
