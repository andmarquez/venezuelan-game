import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  getViewportSize,
  isLandscapeViewport,
  isMobileViewport,
  onViewportChange,
  resolveScaleMode,
} from './viewportMetrics';

export {
  getViewportSize,
  isLandscapeViewport,
  isMobileViewport,
  onViewportChange,
  resolveScaleMode,
};

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
