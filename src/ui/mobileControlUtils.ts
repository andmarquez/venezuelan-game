import type Phaser from 'phaser';
import { getViewportSize } from './viewportMetrics';
import { isMobileViewport } from './scaleMode';

/**
 * Whether to show Wild Rift–style touch controls.
 * Phones always qualify; desktop can force with ?mobile=1 in the URL.
 */
export function shouldShowMobileControls(game?: Phaser.Game): boolean {
  if (isMobileViewport()) return true;

  if (game?.device.input.touch) {
    const { width, height } = getViewportSize();
    const shortSide = Math.min(width, height);
    return shortSide <= 900;
  }

  return false;
}
