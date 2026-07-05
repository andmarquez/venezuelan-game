#!/usr/bin/env node
/**
 * Extract M02 mobile gameplay zones from Figma into layout-mobile.json.
 *
 * Platforms frame (26:179) is at y=-66 inside artboard 13:2.
 * `pipe` zones are tall vertical collision (same arcade physics as platforms).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public/assets/world/level-1/layout-mobile.json');
const OUT_DESKTOP = path.join(ROOT, 'public/assets/world/level-1/layout-desktop.json');
const DESKTOP_W = 4895;
const MOBILE_W = 5335;

const PLATFORM_FRAME_Y = -66;
const MARKERS_FRAME_X = 35;
const WORLD_H = 720;

/**
 * Figma 26:179 — [nodeId, layoutName, zoneType, x, y, width, height]
 * zoneType: 'platform' | 'pipe'
 */
const PLATFORMS_RAW = [
  ['26:181', 'ground_floor', 'platform', -1, 786, 5336, 36],
  ['49:2', 'platform_start', 'platform', 11, 696, 207, 36],
  ['54:2', 'platform_start_1', 'platform', 300, 678, 174, 54],
  ['54:3', 'platform_start_2', 'platform', 516, 643, 113, 90],
  ['54:4', 'platform_start_3', 'platform', 600, 703, 203, 29],
  ['26:183', 'floating_platform_01', 'platform', 206, 519, 123, 35],
  ['26:185', 'platform_01', 'platform', 775, 674, 391, 59],
  ['26:187', 'floating_platform_02', 'platform', 1205, 519, 122, 34],
  ['26:189', 'platform_02', 'platform', 1334, 699, 246, 35],
  ['54:5', 'pipe_1', 'pipe', 1499, 639, 56, 73],
  ['26:191', 'floating_platform_03', 'platform', 1987, 519, 124, 34],
  ['26:193', 'floating_platform_04', 'platform', 1714, 620, 98, 56],
  ['26:195', 'platform_03', 'platform', 1643, 670, 314, 70],
  ['26:197', 'floating_platform_05', 'platform', 2968, 571, 120, 32],
  ['54:9', 'floating_platform_05b', 'platform', 2500, 589, 120, 32],
  ['26:199', 'floating_platform_06', 'platform', 4135, 624, 102, 70],
  ['26:201', 'platform_04', 'platform', 2159, 705, 219, 38],
  ['26:203', 'floating_platform_07', 'platform', 4358, 601, 122, 38],
  ['24:448', 'platform_06', 'platform', 4089, 675, 541, 68],
  ['26:205', 'platform_05', 'platform', 2687, 692, 1442, 51],
  ['54:8', 'pipe_3', 'pipe', 3845, 633, 56, 77],
  ['26:207', 'floating_platform_08', 'platform', 4590, 563, 195, 70],
];

const GOAL_X = 5080 + MARKERS_FRAME_X;
const GOAL_PLATFORM = ['26:209', 'goal_platform', 'platform', GOAL_X, 561, 163, 20];

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

const FINAL_BOSS = {
  x: GOAL_X + Math.round(163 / 2),
  y: 561,
  min: GOAL_X + 40,
  max: GOAL_X + 203,
};

const PLAYER_SPAWN_FALLBACK = { x: 174, y: 630 };

function toPlatform([_nodeId, name, zoneType, x, y, w, h], frameY = PLATFORM_FRAME_Y) {
  let artY = Math.round(y + frameY);
  let height = Math.round(h);
  const width = Math.round(w);

  if (name === 'ground_floor') {
    artY = WORLD_H - height;
    return {
      name,
      x: Math.max(0, Math.round(x)),
      y: artY,
      width,
      height,
      type: zoneType,
    };
  }

  if (artY + height > WORLD_H) {
    height = Math.max(1, WORLD_H - artY);
  }
  return {
    name,
    x: Math.max(0, Math.round(x)),
    y: artY,
    width,
    height,
    type: zoneType,
  };
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

const platforms = [
  ...PLATFORMS_RAW.map((row) => toPlatform(row)),
  toPlatform(GOAL_PLATFORM, 0),
];

/** Visual platform sprites — fill Figma frame rectangles (stretch in WorldBuilder). */
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
      y: platformStart.y + platformStart.height - Math.min(platformStart.height, 18),
    }
  : PLAYER_SPAWN_FALLBACK;

const goal = platforms.find((p) => p.name === 'goal_platform');
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
    portal_goal: {
      x: goal.x + Math.round(goal.width / 2),
      y: goal.y + goal.height - Math.min(goal.height, 18) - 10,
    },
    kiss_collectibles: COLLECTIBLES.kiss.map(center),
    timer_collectibles: COLLECTIBLES.timer.map(center),
    boss_spark_collectibles: COLLECTIBLES.spark.map(center),
    enemies: COLLECTIBLES.enemy.map((rect) => ({
      ...center(rect),
      min: 120,
      max: 900,
    })),
    final_boss: FINAL_BOSS,
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
