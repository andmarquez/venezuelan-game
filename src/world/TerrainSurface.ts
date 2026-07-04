import Phaser from 'phaser';
import { worldTextureKey } from './worldTypes';

export type SurfaceSegment = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SurfaceBuildOptions = {
  columnStep?: number;
  bodyHeight?: number;
  alphaThreshold?: number;
  yTolerance?: number;
  insetX?: number;
};

const DEFAULT_OPTS: Required<SurfaceBuildOptions> = {
  columnStep: 6,
  bodyHeight: 14,
  alphaThreshold: 24,
  yTolerance: 8,
  insetX: 0.06,
};

type ColumnSample = { x: number; topY: number };

/**
 * Scans transparent PNGs and builds horizontal collision slabs along visible top surfaces.
 */
export class TerrainSurface {
  private static cache = new Map<string, ColumnSample[]>();

  static buildSegments(
    scene: Phaser.Scene,
    assetKey: string,
    placement: { x: number; y: number; width: number; height: number },
    opts: SurfaceBuildOptions = {},
  ): SurfaceSegment[] {
    const o = { ...DEFAULT_OPTS, ...opts };
    const key = worldTextureKey(assetKey);

    if (!scene.textures.exists(key)) {
      return TerrainSurface.flatTopFallback(placement, o.bodyHeight);
    }

    const columns = TerrainSurface.sampleColumns(scene, key, placement, o);
    if (columns.length === 0) {
      return TerrainSurface.flatTopFallback(placement, o.bodyHeight);
    }

    return TerrainSurface.columnsToSegments(columns, o.bodyHeight, o.yTolerance, o.columnStep);
  }

  static flatTopSegment(
    placement: { x: number; y: number; width: number; height: number },
    bodyHeight = 14,
    topInsetRatio = 0.08,
  ): SurfaceSegment[] {
    const insetW = placement.width * topInsetRatio;
    const topY = placement.y + placement.height * topInsetRatio;
    return [
      {
        x: placement.x + placement.width / 2,
        y: topY,
        width: Math.max(placement.width - insetW, 8),
        height: bodyHeight,
      },
    ];
  }

  static findSurfaceYAtX(
    segments: SurfaceSegment[],
    worldX: number,
    footY?: number,
  ): number | null {
    let best: number | null = null;
    for (const seg of segments) {
      const left = seg.x - seg.width / 2;
      const right = seg.x + seg.width / 2;
      if (worldX < left || worldX > right) continue;

      const top = seg.y;
      if (footY !== undefined) {
        if (top > footY + 48) continue;
        if (best === null || top > best) best = top;
      } else if (best === null || top < best) {
        best = top;
      }
    }
    return best;
  }

  private static flatTopFallback(
    placement: { x: number; y: number; width: number; height: number },
    bodyHeight: number,
  ): SurfaceSegment[] {
    return TerrainSurface.flatTopSegment(placement, bodyHeight, 0.08);
  }

  private static sampleColumns(
    scene: Phaser.Scene,
    textureKey: string,
    placement: { x: number; y: number; width: number; height: number },
    o: Required<SurfaceBuildOptions>,
  ): ColumnSample[] {
    const cacheKey = `${textureKey}:${placement.width}x${placement.height}`;
    if (TerrainSurface.cache.has(cacheKey)) {
      return TerrainSurface.cache.get(cacheKey)!;
    }

    const texture = scene.textures.get(textureKey);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const texW = source.width;
    const texH = source.height;

    const canvas = document.createElement('canvas');
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(source, 0, 0, texW, texH);
    const data = ctx.getImageData(0, 0, texW, texH).data;

    const insetPx = Math.floor(placement.width * o.insetX);
    const columns: ColumnSample[] = [];

    for (let dx = insetPx; dx < placement.width - insetPx; dx += o.columnStep) {
      const u = dx / placement.width;
      const px = Math.min(texW - 1, Math.floor(u * texW));
      let topPy: number | null = null;

      for (let py = 0; py < texH; py++) {
        const idx = (py * texW + px) * 4;
        if (data[idx + 3] >= o.alphaThreshold) {
          topPy = py;
          break;
        }
      }

      if (topPy === null) continue;

      const topY = placement.y + (topPy / texH) * placement.height;
      columns.push({ x: placement.x + dx, topY });
    }

    TerrainSurface.cache.set(cacheKey, columns);
    return columns;
  }

  private static columnsToSegments(
    columns: ColumnSample[],
    bodyHeight: number,
    yTolerance: number,
    columnStep: number,
  ): SurfaceSegment[] {
    if (columns.length === 0) return [];

    const segments: SurfaceSegment[] = [];
    let start = columns[0];
    let prevY = columns[0].topY;
    let prevX = columns[0].x;

    const flush = (endX: number) => {
      const width = Math.max(endX - start.x + columnStep, columnStep);
      const avgY = (prevY + start.topY) / 2;
      segments.push({
        x: start.x + width / 2,
        y: avgY,
        width,
        height: bodyHeight,
      });
    };

    for (let i = 1; i < columns.length; i++) {
      const col = columns[i];
      const yClose = Math.abs(col.topY - prevY) <= yTolerance;
      const xClose = col.x - prevX <= columnStep * 2.5;

      if (!yClose || !xClose) {
        flush(prevX);
        start = col;
      }
      prevY = col.topY;
      prevX = col.x;
    }
    flush(prevX);

    return segments;
  }
}
