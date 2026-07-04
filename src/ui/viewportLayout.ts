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

/** Map pointer to fixed UI coordinates (scrollFactor 0 HUD / controls). */
export function pointerToUiSpace(
  pointer: Phaser.Input.Pointer,
  camera: Phaser.Cameras.Scene2D.Camera,
): { x: number; y: number } {
  // Fixed UI lives in viewport space — strip camera scroll from world coords.
  pointer.updateWorldPoint(camera);
  return {
    x: pointer.worldX - camera.scrollX,
    y: pointer.worldY - camera.scrollY,
  };
}
