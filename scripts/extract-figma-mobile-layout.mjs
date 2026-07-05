#!/usr/bin/env node
/**
 * Extract M02 mobile gameplay zones from Figma into layout-mobile.json.
 *
 * Platform zones: `public/assets/world/level-1/figma-platform-zones.json`
 * Markers (kisses, timer, enemies): `figma/figma-gameplay-markers.json`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public/assets/world/level-1/layout-mobile.json');
const OUT_DESKTOP = path.join(ROOT, 'public/assets/world/level-1/layout-desktop.json');
const ZONES_JSON = path.join(ROOT, 'public/assets/world/level-1/figma-platform-zones.json');
const MARKERS_JSON = path.join(ROOT, 'figma/figma-gameplay-markers.json');
const DESKTOP_W = 4895;
const MOBILE_W = 5335;

const PLAYER_SPAWN_FALLBACK = { x: 174, y: 630 };

function loadMarkers() {
  if (!fs.existsSync(MARKERS_JSON)) {
    throw new Error(`Missing ${MARKERS_JSON} — sync from Figma M02 first`);
  }
  return JSON.parse(fs.readFileSync(MARKERS_JSON, 'utf8'));
}

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

const platforms = loadPlatformZones();
const markersData = loadMarkers();

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
  clouds: [],
  markers: {
    player_spawn: PLAYER_SPAWN,
    portal_goal: markersData.portal_goal,
    kiss_collectibles: markersData.kisses,
    timer_collectibles: markersData.timer,
    boss_spark_collectibles: markersData.spark,
    enemies: markersData.enemies,
    final_boss: markersData.final_boss,
  },
};

fs.writeFileSync(OUT, `${JSON.stringify(layout, null, 2)}\n`);
console.log(
  `Wrote ${OUT} — ${layout.platforms.length} zones (${pipeCount} pipes), ${platformArt.length} platform art, ${layout.markers.kiss_collectibles.length} kisses`,
);

if (fs.existsSync(OUT_DESKTOP)) {
  const desktop = JSON.parse(fs.readFileSync(OUT_DESKTOP, 'utf8'));
  desktop.clouds = [];
  fs.writeFileSync(OUT_DESKTOP, `${JSON.stringify(desktop, null, 2)}\n`);
}
