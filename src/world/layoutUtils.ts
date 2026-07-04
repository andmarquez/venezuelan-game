import type Phaser from 'phaser';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('debug') === 'true';
}

/** Show Figma-style green platform zones (default on mobile during layout tuning). */
export function shouldShowPlatformZones(game?: Phaser.Game): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('zones') === '0') return false;
  if (params.get('zones') === '1' || isDebugMode()) return true;
  return shouldShowMobileControls(game);
}

export function getLevelLayoutCacheKey(game: Phaser.Game): string {
  return shouldShowMobileControls(game) ? 'level-1-layout-mobile' : 'level-1-layout-desktop';
}
