import type Phaser from 'phaser';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('debug') === 'true';
}

/** Show Figma-style platform zone overlays only with ?zones=1 or ?debug=1. */
export function shouldShowPlatformZones(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('zones') === '0') return false;
  return params.get('zones') === '1' || isDebugMode();
}

/** 0 = invisible collision tuning on mobile; 0.35 = visible green/blue boxes (?zones=1). */
export function getPlatformZoneVisualAlpha(): number {
  if (typeof window === 'undefined') return 0;
  const params = new URLSearchParams(window.location.search);
  if (params.get('zones') === '1' || isDebugMode()) return 0.35;
  return 0;
}

/** Lavender cloud placement boxes — visible with ?clouds=1 or ?debug=1 only. */
export function shouldShowCloudZones(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('clouds') === '0') return false;
  if (params.get('clouds') === '1' || isDebugMode()) return true;
  return false;
}

export function getLevelLayoutCacheKey(game: Phaser.Game): string {
  return shouldShowMobileControls(game) ? 'level-1-layout-mobile' : 'level-1-layout-desktop';
}
