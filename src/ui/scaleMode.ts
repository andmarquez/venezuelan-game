import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

/** True for phone/tablet or forced mobile preview (`?mobile=1`). */
export function isMobileViewport(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mobile') === '1') return true;

  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const touch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return touch && shortSide <= 900;
}

/** Mobile fills the screen; desktop keeps the full frame letterboxed. */
export function resolveScaleMode(): number {
  return isMobileViewport() ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT;
}

/** Full design canvas in game coordinates. */
export function getUiLayoutRect(scale: Phaser.Scale.ScaleManager) {
  return {
    x: 0,
    y: 0,
    width: scale.width || GAME_CONFIG.width,
    height: scale.height || GAME_CONFIG.height,
  };
}
