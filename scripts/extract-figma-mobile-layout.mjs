#!/usr/bin/env node
/**
 * Extract M02 mobile gameplay zones from Figma into layout-mobile.json.
 *
 * Platform zones: `public/assets/world/level-1/figma-platform-zones.json`
 * (synced from Figma overlay "🟢 Platform zones (edit here)", node 95:2).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public/assets/world/level-1/layout-mobile.json');
const OUT_DESKTOP = path.join(ROOT, 'public/assets/world/level-1/layout-desktop.json');
const ZONES_JSON = path.join(ROOT, 'public/assets/world/level-1/figma-platform-zones.json');
const DESKTOP_W = 4895;
const MOBILE_W = 5335;

const MARKERS_FRAME_X = 35;

/** Figma marker positions (M02 → Markers frame, node 26:180). */
const PORTAL_GOAL_MARKER = {
  x: MARKERS_FRAME_X + 5127 + 20,
  y: 484 + 20,
};

const FINAL_BOSS_MARKER = {
  x: PORTAL_GOAL_MARKER.x,
  y: PORTAL_GOAL_MARKER.y - 36,
  min: PORTAL_GOAL_MARKER.x - 80,
  max: PORTAL_GOAL_MARKER.x + 80,
};

/** Clouds frame removed from M02 — decorative clouds now baked into - 1 background. */
const CLOUDS_RAW = [];

const COLLECTIBLES = {
  kiss: [
    [250, 500, 46, 49],
    [367, 448, 46, 49],
    [655, 405, 46, 49],
    [182, 568, 24, 24],
    [363, 549, 24, 24],
    [702, 561, 24, 24],
  ],
  timer: [[797, 475, 28, 28]],
  spark: [[4845, 448, 28, 28]],
  enemy: [[535, 487, 40, 32]],
};

const PLAYER_SPAWN_FALLBACK = { x: 174, y: 630 };

function loadPlatformZones() {
  if (!fs.existsSync(ZONES_JSON)) {
    throw new Error(`Missing ${ZONES_JSON} — sync from Figma overlay first`);
  }
  const data = JSON.parse(fs.readFileSync(ZONES_JSON, 'utf8'));
  return data.zones.map((z) => ({
    name: z.name,
    x: Math.round(z.x),
    y: Math.round(z.y),
    width: Math.round(z.width),
    height: Math.round(z.height),
    type: z.type === 'pipe' ? 'pipe' : 'platform',
  }));
}

function center([x, y, w, h]) {
  return { x: Math.round(x + w / 2), y: Math.round(y + h / 2) };
}

function toCloud([_nodeId, name, x, y, w, h]) {
  return {
    name,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(w),
    height: Math.round(h),
  };
}

const platforms = loadPlatformZones();

/** Visual platform sprites — fit inside zone bounds (contain, bottom-aligned). */
const platformArt = platforms
  .filter((p) => p.type === 'platform' && p.name !== 'ground_floor')
  .map((p) => ({
    name: p.name,
    key: `platform-art:${p.name}`,
    path: `/assets/world/platforms/${p.name}.png`,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
  }));

const platformStart = platforms.find((p) => p.name === 'platform_start');
const PLAYER_SPAWN = platformStart
  ? {
      x: platformStart.x + Math.round(platformStart.width / 2),
      y: platformStart.y,
    }
  : PLAYER_SPAWN_FALLBACK;

const pipeCount = platforms.filter((p) => p.type === 'pipe').length;
const clouds = CLOUDS_RAW.map((row) => toCloud(row));

const layout = {
  level: 'level-1',
  variant: 'mobile',
  figmaArtboard: 'M02 — Gameplay (Level 1)',
  figmaNodeId: '13:2',
  width: 5335,
  height: 720,
  background: {
    mode: 'sections',
    sections: [
      {
        key: 'world:level-1-background',
        path: '/assets/world/background/level-1-mobile.png',
        x: 0,
        y: 55,
        width: 5335,
        height: 665,
      },
    ],
  },
  platforms,
  platformArt,
  clouds,
  markers: {
    player_spawn: PLAYER_SPAWN,
    portal_goal: PORTAL_GOAL_MARKER,
    kiss_collectibles: COLLECTIBLES.kiss.map(center),
    timer_collectibles: COLLECTIBLES.timer.map(center),
    boss_spark_collectibles: COLLECTIBLES.spark.map(center),
    enemies: COLLECTIBLES.enemy.map((rect) => ({
      ...center(rect),
      min: 120,
      max: 900,
    })),
    final_boss: FINAL_BOSS_MARKER,
  },
};

fs.writeFileSync(OUT, `${JSON.stringify(layout, null, 2)}\n`);
console.log(
  `Wrote ${OUT} — ${layout.platforms.length} zones (${pipeCount} pipes), ${platformArt.length} platform art, ${clouds.length} clouds, ${layout.markers.kiss_collectibles.length} kisses`,
);

/** Mirror clouds into desktop layout (scaled X/width). */
if (fs.existsSync(OUT_DESKTOP)) {
  const desktop = JSON.parse(fs.readFileSync(OUT_DESKTOP, 'utf8'));
  const scale = DESKTOP_W / MOBILE_W;
  desktop.clouds = clouds.map((c) => ({
    ...c,
    x: Math.round(c.x * scale),
    width: Math.round(c.width * scale),
  }));
  fs.writeFileSync(OUT_DESKTOP, `${JSON.stringify(desktop, null, 2)}\n`);
  console.log(`Updated ${OUT_DESKTOP} — ${desktop.clouds.length} clouds`);
}
