/** Figma-driven level layout — synced from M02 — Gameplay (Level 1) */

export type GroundSegment = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional explicit walk surface Y (Figma top-left space). Defaults to near-bottom of rect. */
  surfaceY?: number;
};

export type WorldPlacement = {
  figmaId: string;
  assetKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LevelGameplay = {
  playerStart: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    figmaOrigin?: 'topLeft' | 'foot';
  };
  portal: { x: number; y: number };
  kisses: [number, number][];
  timers: [number, number][];
  enemies: { x: number; y: number; min: number; max: number }[];
};

export type LevelLayout = {
  level: string;
  variant: 'mobile' | 'desktop';
  figmaArtboard: string;
  figmaNodeId: string;
  width: number;
  height: number;
  ground: GroundSegment[];
  placements: WorldPlacement[];
  gameplay: LevelGameplay;
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
  layout: { level: string; width: number; height: number; placementCount: number } | null;
};

export const worldTextureKey = (assetKey: string): string => `world:${assetKey}`;
