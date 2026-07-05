/** Simplified level schema — visual background + invisible platform rectangles. */

export type PlatformZone = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** `pipe` = vertical pipe collision (same physics as platform) */
  type: 'platform' | 'pipe';
};

/** Decorative cloud placement — visual guide only, no physics */
export type CloudZone = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Platform image fill exported from Figma — visual only, aligned to collision zone. */
export type PlatformArt = {
  name: string;
  key: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Pixels from zone.y down to the visible walk surface (icing → body). */
  standInset?: number;
};

export type BackgroundSection = {
  key: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EnemyMarker = {
  x: number;
  y: number;
  min: number;
  max: number;
};

export type BossMarker = {
  x: number;
  y: number;
  min: number;
  max: number;
};

export type LevelMarkers = {
  player_spawn: { x: number; y: number };
  portal_goal: { x: number; y: number };
  kiss_collectibles: { x: number; y: number }[];
  timer_collectibles: { x: number; y: number }[];
  boss_spark_collectibles?: { x: number; y: number }[];
  enemies: EnemyMarker[];
  final_boss?: BossMarker;
};

export type LevelLayout = {
  level: string;
  variant: 'mobile' | 'desktop';
  figmaArtboard: string;
  figmaNodeId: string;
  width: number;
  height: number;
  /** Visual-only background (no physics). */
  background: {
    mode: 'sections';
    sections: BackgroundSection[];
  };
  /** Invisible gameplay rectangles — source of truth for collisions. */
  platforms: PlatformZone[];
  /** Figma image fills on platform rectangles — rendered above background. */
  platformArt?: PlatformArt[];
  /** Decorative cloud bounds — sync from Figma, no collision. */
  clouds?: CloudZone[];
  markers: LevelMarkers;
};

export type WorldBackgroundMeta = {
  key: string;
  path: string;
  figmaNodeId: string;
  figmaName: string;
  present: boolean;
};

export type WorldManifest = {
  generatedAt: string;
  figmaFileKey: string;
  figmaFileUrl: string;
  version: number;
  backgrounds: Record<string, WorldBackgroundMeta>;
  layout: { level: string; width: number; height: number; platformCount: number } | null;
};

/** Platform top-left (x,y) → Phaser static body center. */
export const platformTopLeftToCenter = (p: PlatformZone) => ({
  cx: p.x + p.width / 2,
  cy: p.y + p.height / 2,
});

/** Foot Y on the visible walk surface inside a Figma platform zone. */
export const platformStandY = (zone: PlatformZone, standInset = 0): number =>
  zone.y + standInset;

/** Gameplay collision — stand on the visible icing top, not the Figma box top. */
export function getPlatformCollisionRect(zone: PlatformZone, standInset = 0): PlatformZone {
  if (zone.type === 'pipe' || zone.name === 'ground_floor') {
    return zone;
  }
  const top = zone.y + standInset;
  const remain = Math.max(1, zone.height - standInset);
  const surfaceH = Math.min(remain, 18);
  return { ...zone, y: top, height: surfaceH };
}

/** Spawn marker y is the platform surface (foot Y). */
export const markerToFoot = (m: { x: number; y: number }) => ({ x: m.x, y: m.y });
