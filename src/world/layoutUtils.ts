import { shouldShowMobileControls } from '../ui/mobileControlUtils';

/** Figma top-left frame coords → Phaser foot position (origin 0.5, 1). */
export const figmaFrameToFoot = (
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } => ({
  x: x + width / 2,
  y: y + height,
});

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('debug') === 'true';
}

export function getLevelLayoutCacheKey(game: Phaser.Game): string {
  return shouldShowMobileControls(game) ? 'level-1-layout-mobile' : 'level-1-layout-desktop';
}
