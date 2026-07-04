import { shouldShowMobileControls } from '../ui/mobileControlUtils';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('debug') === 'true';
}

export function getLevelLayoutCacheKey(game: Phaser.Game): string {
  return shouldShowMobileControls(game) ? 'level-1-layout-mobile' : 'level-1-layout-desktop';
}
