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

/** Gameplay collision — full Figma zone; feet stand on zone.y (top edge). */
export function getPlatformCollisionRect(zone: PlatformZone): PlatformZone {
  return zone;
}

/** Spawn marker y is the platform surface (foot Y). */
export const markerToFoot = (m: { x: number; y: number }) => ({ x: m.x, y: m.y });
