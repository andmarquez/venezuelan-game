/**
 * Shared platform display sizing — fit PNG into Figma frame (bottom-aligned, width-first).
 */
import fs from 'node:fs';

/** @param {{ x: number, y: number, width: number, height: number }} frame */
export function computePlatformDisplayRect(frame, nativeW, nativeH) {
  const scaleW = frame.width / nativeW;
  let displayW = frame.width;
  let displayH = nativeH * scaleW;
  if (displayH > frame.height) {
    const scaleH = frame.height / nativeH;
    displayH = frame.height;
    displayW = nativeW * scaleH;
  }

  return {
    x: frame.x + (frame.width - displayW) / 2,
    y: frame.y + frame.height - displayH,
    width: displayW,
    height: displayH,
  };
}

export function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

export function roundPlatformRect(rect) {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}
