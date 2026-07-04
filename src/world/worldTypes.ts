/** Simplified level schema — visual background + invisible platform rectangles. */

export type PlatformZone = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'platform';
};

export type BackgroundSection = {
  /** Optional image path (stitched Figma export). Omitted when using composite sprites. */
  path?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualPlacement = {
  assetKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scrollFactor?: number;
};

export type EnemyMarker = {
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
  enemies: EnemyMarker[];
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
    mode: 'sections' | 'composite';
    sections?: BackgroundSection[];
    placements?: VisualPlacement[];
  };
  /** Invisible gameplay rectangles — source of truth for collisions. */
  platforms: PlatformZone[];
  /** Foreground decorations drawn above the player. */
  foreground?: VisualPlacement[];
  markers: LevelMarkers;
};

export type WorldTextureMeta = {
  key: string;
  figmaName: string;
  figmaNodeId: string;
  category: string;
  path: string;
  collider?: boolean;
  scrollFactor?: number;
  present: boolean;
};

export type WorldManifest = {
  generatedAt: string;
  figmaFileKey: string;
  figmaFileUrl: string;
  version: number;
  textures: Record<string, WorldTextureMeta>;
  layout: { level: string; width: number; height: number; platformCount: number } | null;
};

export const worldTextureKey = (assetKey: string): string => `world:${assetKey}`;

/** Platform top-left (x,y) → Phaser static body center. */
export const platformTopLeftToCenter = (p: PlatformZone) => ({
  cx: p.x + p.width / 2,
  cy: p.y + p.height / 2,
});

/** Spawn marker y is the platform surface (foot Y). */
export const markerToFoot = (m: { x: number; y: number }) => ({ x: m.x, y: m.y });
