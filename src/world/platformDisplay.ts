import type { PlatformArt, PlatformZone } from './worldTypes';

export type PlatformDisplayRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  displayW: number;
  displayH: number;
};

/** Fit platform PNG into Figma frame — same sizing as WorldBuilder.drawPlatformArt. */
export function computePlatformDisplayRect(
  art: Pick<PlatformArt, 'x' | 'y' | 'width' | 'height'>,
  nativeW: number,
  nativeH: number,
): PlatformDisplayRect {
  const scaleW = art.width / nativeW;
  let displayW = art.width;
  let displayH = nativeH * scaleW;
  if (displayH > art.height) {
    const scaleH = art.height / nativeH;
    displayH = art.height;
    displayW = nativeW * scaleH;
  }

  return {
    x: art.x + (art.width - displayW) / 2,
    y: art.y + art.height - displayH,
    width: displayW,
    height: displayH,
    displayW,
    displayH,
  };
}

export function displayRectToZone(
  name: string,
  rect: PlatformDisplayRect,
  type: PlatformZone['type'] = 'platform',
): PlatformZone {
  return {
    name,
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    type,
  };
}
