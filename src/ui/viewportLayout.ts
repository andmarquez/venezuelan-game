import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { getUiLayoutRect } from './scaleMode';
import { getViewportSize } from './viewportMetrics';

export type UiViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Visible UI region — cropped when ENVELOP, full frame when FIT. */
export function getUiViewport(scale: Phaser.Scale.ScaleManager): UiViewport {
  if (scale.scaleMode === Phaser.Scale.FIT) {
    return getUiLayoutRect(scale);
  }

  const gameW = scale.width || GAME_CONFIG.width;
  const gameH = scale.height || GAME_CONFIG.height;
  const parentW = scale.parentSize?.width || getViewportSize().width;
  const parentH = scale.parentSize?.height || getViewportSize().height;
  const zoom = Math.max(parentW / gameW, parentH / gameH);
  const visibleW = parentW / zoom;
  const visibleH = parentH / zoom;

  return {
    x: (gameW - visibleW) / 2,
    y: (gameH - visibleH) / 2,
    width: visibleW,
    height: visibleH,
  };
}

/** Map pointers to UI space (scrollFactor 0 objects ignore camera scroll). */
export function pointerToUiSpace(
  pointer: Phaser.Input.Pointer,
  camera: Phaser.Cameras.Scene2D.Camera,
): { x: number; y: number } {
  return {
    x: pointer.x - camera.scrollX,
    y: pointer.y - camera.scrollY,
  };
}
