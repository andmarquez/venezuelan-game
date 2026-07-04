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

/** True when the device/browser viewport is wider than tall. */
export function isLandscapeViewport(): boolean {
  return window.innerWidth >= window.innerHeight;
}

/** Mobile landscape uses FIT so the full level (platforms + ground) stays visible. */
export function resolveScaleMode(): number {
  if (!isMobileViewport()) return Phaser.Scale.FIT;
  return isLandscapeViewport() ? Phaser.Scale.FIT : Phaser.Scale.ENVELOP;
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

export type MobileLayoutInsets = {
  controlsLift: number;
  hudTopInset: number;
  joystickBottomInset: number;
  attackInsetX: number;
  attackInsetY: number;
  controlScale: number;
};

/** Touch HUD/control spacing tuned for landscape vs portrait. */
export function getMobileLayoutInsets(): MobileLayoutInsets {
  if (isLandscapeViewport()) {
    return {
      controlsLift: 36,
      hudTopInset: 6,
      joystickBottomInset: 20,
      attackInsetX: 52,
      attackInsetY: 28,
      controlScale: 0.88,
    };
  }

  return {
    controlsLift: GAME_CONFIG.mobileControlsLift,
    hudTopInset: GAME_CONFIG.mobileHudTopInset,
    joystickBottomInset: GAME_CONFIG.mobileWildRift.joystick.bottomInset,
    attackInsetX: GAME_CONFIG.mobileWildRift.attackInsetX,
    attackInsetY: GAME_CONFIG.mobileWildRift.attackInsetY,
    controlScale: 1,
  };
}
