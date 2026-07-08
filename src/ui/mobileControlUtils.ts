import type Phaser from 'phaser';
import { isMobileViewport } from './scaleMode';

/**
 * Whether to show Wild Rift–style touch controls.
 * Game only boots on mobile; desktop preview uses `?mobile=1`.
 */
export function shouldShowMobileControls(_game?: Phaser.Game): boolean {
  return isMobileViewport();
}
