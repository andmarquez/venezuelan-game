/** Layer ordering — matches Figma composition (back → front). */
export const WORLD_LAYERS = {
  sky: -30,
  parallaxFar: -22,
  parallaxMid: -16,
  water: -10,
  terrain: 10,
  player: 50,
  foreground: 70,
  ui: 90,
  debug: 200,
} as const;

/** Depth sort: objects lower on screen draw in front (2.5D). */
export const depthFromFootY = (footY: number, base = 0): number =>
  base + footY * 0.05;

export type AssetRole = 'background' | 'water' | 'terrain' | 'foreground' | 'decoration';

const TERRAIN_KEYS = new Set([
  'blocks-1',
  'blocks-2',
  'i-2',
  'i-3',
  'i-4',
  'i-5',
  'i-6',
  'i-7',
  'i-8',
  'i-9',
  'i-10',
]);

const BACKGROUND_KEYS = new Set([
  'bridge',
  'm',
  'm-1',
  'm-2',
  'm-3',
  't-1',
  't-2',
  'island',
  'c-1',
  'c-2',
]);

const WATER_KEYS = new Set(['waves', 'waves-2']);

const FOREGROUND_KEYS = new Set([
  'g',
  'g-1',
  'g-2',
  'g-3',
  'g-4',
  'g-5',
  'barril',
  'flag',
  'pipe-1',
  'pipe-2',
  'rocks',
]);

export function getAssetRole(assetKey: string, category?: string): AssetRole {
  if (TERRAIN_KEYS.has(assetKey) || category === 'platform' || category === 'terrain') {
    return 'terrain';
  }
  if (BACKGROUND_KEYS.has(assetKey) || category === 'parallax') return 'background';
  if (WATER_KEYS.has(assetKey) || category === 'water') return 'water';
  if (FOREGROUND_KEYS.has(assetKey) || category === 'foliage' || category === 'prop') {
    return 'foreground';
  }
  return 'decoration';
}

export function isPlayableTerrain(assetKey: string, category?: string): boolean {
  return getAssetRole(assetKey, category) === 'terrain';
}

export function layerForRole(role: AssetRole): number {
  switch (role) {
    case 'background':
      return WORLD_LAYERS.parallaxMid;
    case 'water':
      return WORLD_LAYERS.water;
    case 'terrain':
      return WORLD_LAYERS.terrain;
    case 'foreground':
      return WORLD_LAYERS.foreground;
    default:
      return WORLD_LAYERS.parallaxFar;
  }
}
