#!/usr/bin/env node
/**
 * Extract M02 mobile gameplay zones from Figma into layout-mobile.json.
 *
 * Platforms frame (26:179) is at y=-100 inside artboard 13:2.
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

const PLATFORM_FRAME_Y = -100;
const MARKERS_FRAME_X = 35;
const WORLD_H = 720;

/**
 * Figma 26:179 — [nodeId, layoutName, zoneType, x, y, width, height]
 * zoneType: 'platform' | 'pipe'
 */
const PLATFORMS_RAW = [
  ['26:181', 'ground_floor', 'platform', -1, 786, 5336, 36],
  ['49:2', 'platform_start', 'platform', -1, 684, 231, 36],
  ['54:2', 'platform_start_1', 'platform', 303, 666, 174, 54],
  ['54:3', 'platform_start_2', 'platform', 540, 630, 113, 90],
  ['54:4', 'platform_start_3', 'platform', 653, 691, 195, 29],
  ['26:183', 'floating_platform_01', 'platform', 206, 569, 123, 35],
  ['26:185', 'platform_01', 'platform', 996, 657, 391, 132],
  ['26:187', 'floating_platform_02', 'platform', 935, 569, 122, 34],
  ['26:189', 'platform_02', 'platform', 1472, 686, 246, 35],
  ['54:5', 'pipe_1', 'pipe', 1564, 615, 56, 73],
  ['26:191', 'floating_platform_03', 'platform', 1395, 571, 124, 34],
  ['26:193', 'floating_platform_04', 'platform', 1860, 603, 98, 56],
  ['26:195', 'platform_03', 'platform', 1791, 655, 314, 114],
  ['54:7', 'pipe_2', 'pipe', 2131, 605, 56, 73],
  ['26:197', 'floating_platform_05', 'platform', 3105, 570, 120, 32],
  ['54:9', 'floating_platform_05b', 'platform', 2440, 589, 120, 32],
  ['26:199', 'floating_platform_06', 'platform', 4135, 603, 102, 70],
  ['26:201', 'platform_04', 'platform', 2101, 683, 465, 38],
  ['26:203', 'floating_platform_07', 'platform', 4308, 570, 122, 34],
  ['26:205', 'platform_05', 'platform', 2687, 677, 1442, 47],
  ['54:8', 'pipe_3', 'pipe', 3845, 618, 56, 73],
  ['24:448', 'platform_06', 'platform', 4089, 660, 541, 64],
  ['26:207', 'floating_platform_08', 'platform', 4748, 578, 195, 66],
];

const GOAL_PLATFORM = ['26:209', 'goal_platform', 'platform', 5172 + MARKERS_FRAME_X, 561, 163, 20];

/**
 * Figma 55:2 Clouds (decorative) — [nodeId, name, x, y, width, height]
 * No physics; white dashed boxes for art placement.
 */
const CLOUDS_RAW = [
  ['55:3', 'cloud_01', 120, 156, 180, 58],
  ['55:4', 'cloud_02', 450, 189, 220, 71],
  ['55:5', 'cloud_03', 900, 139, 200, 63],
  ['55:6', 'cloud_04', 1350, 173, 190, 56],
  ['55:7', 'cloud_05', 1800, 206, 240, 75],
  ['55:8', 'cloud_06', 2400, 148, 210, 66],
  ['55:9', 'cloud_07', 3100, 181, 200, 60],
  ['55:10', 'cloud_08', 3800, 135, 230, 73],
  ['55:11', 'cloud_09', 4500, 168, 195, 59],
  ['55:12', 'cloud_10', 5100, 198, 180, 54],
];

const COLLECTIBLES = {
  kiss: [
    [250, 500, 24, 24],
    [419, 429, 24, 24],
    [655, 405, 24, 24],
    [156, 631, 24, 24],
    [386, 631, 24, 24],
    [710, 631, 24, 24],
  ],
  timer: [[797, 473, 28, 28]],
  spark: [[4845, 448, 28, 28]],
  enemy: [[500, 510, 40, 32]],
};

const FINAL_BOSS = {
  x: 5172 + MARKERS_FRAME_X + Math.round(163 / 2),
  y: 561,
  min: 5215,
  max: 5365,
};

const PLAYER_SPAWN = { x: 231, y: 469 };

function toPlatform([_nodeId, name, zoneType, x, y, w, h], frameY = PLATFORM_FRAME_Y) {
  const artY = Math.round(y + frameY);
  let height = Math.round(h);
  if (artY + height > WORLD_H) {
    height = Math.max(1, WORLD_H - artY);
  }
  return {
    name,
    x: Math.max(0, Math.round(x)),
    y: artY,
    width: Math.round(w),
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

const goal = platforms.find((p) => p.name === 'goal_platform');
const pipeCount = platforms.filter((p) => p.type === 'pipe').length;
const clouds = CLOUDS_RAW.map((row) => toCloud(row));

/** Visual platform sprites — image fills on Figma collision rectangles. */
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
        y: 171,
        width: 5335,
        height: 449,
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
      y: goal.y - 10,
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
