export const WORLD_LAYERS = {
  sky: -30,
  background: -20,
  platformDebug: 5,
  collectibles: 30,
  enemies: 35,
  player: 50,
  foreground: 70,
  ui: 90,
  debug: 200,
} as const;

export const depthFromFootY = (footY: number, base = 0): number => base + footY * 0.05;

const PARALLAX_KEYS = new Set([
  'bridge', 'm', 'm-1', 'm-2', 'm-3', 't-1', 't-2', 'island', 'c-1', 'c-2',
]);

const FOREGROUND_KEYS = new Set([
  'g', 'g-1', 'g-2', 'g-3', 'g-4', 'g-5',
  'barril', 'flag', 'pipe-1', 'pipe-2', 'rocks',
]);

export function isBackgroundPlacement(assetKey: string): boolean {
  return (
    PARALLAX_KEYS.has(assetKey) ||
    assetKey.startsWith('i-') ||
    assetKey.startsWith('waves') ||
    assetKey === 'blocks-1' ||
    assetKey === 'blocks-2'
  );
}

export function isForegroundPlacement(assetKey: string): boolean {
  return FOREGROUND_KEYS.has(assetKey);
}

export function defaultScrollFactor(assetKey: string): number {
  if (PARALLAX_KEYS.has(assetKey)) return 0.28;
  if (assetKey.startsWith('m')) return 0.25;
  return 1;
}
