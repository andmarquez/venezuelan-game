import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  depthFromFootY,
  getAssetRole,
  isPlayableTerrain,
  layerForRole,
  WORLD_LAYERS,
} from './layerConfig';
import { TerrainSurface, type SurfaceSegment } from './TerrainSurface';
import type { LevelLayout, WorldManifest, WorldPlacement } from './worldTypes';
import { worldTextureKey } from './worldTypes';

export type WorldBuildOptions = {
  debug?: boolean;
};

export type BuildResult = {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  layout: LevelLayout;
  surfaceSegments: SurfaceSegment[];
  toggleDebug: () => void;
};

export class WorldBuilder {
  static build(
    scene: Phaser.Scene,
    layout: LevelLayout,
    manifest: WorldManifest | null,
    options: WorldBuildOptions = {},
  ): BuildResult {
    const platforms = scene.physics.add.staticGroup();
    const metaByKey = manifest?.textures ?? {};
    const allSegments: SurfaceSegment[] = [];
    const debugGraphics: Phaser.GameObjects.Graphics[] = [];
    let debugVisible = options.debug ?? false;

    WorldBuilder.createSky(scene, layout.width);

    const buckets: Record<string, WorldPlacement[]> = {
      background: [],
      water: [],
      terrain: [],
      foreground: [],
      decoration: [],
    };

    for (const p of layout.placements) {
      const role = getAssetRole(p.assetKey, metaByKey[p.assetKey]?.category);
      buckets[role].push(p);
    }

    const drawPass = (role: keyof typeof buckets, scrollOverride?: number) => {
      for (const placement of buckets[role]) {
        const meta = metaByKey[placement.assetKey];
        const scroll =
          role === 'background' ? (meta?.scrollFactor ?? scrollOverride ?? 0.28) : 1;

        if (isPlayableTerrain(placement.assetKey, meta?.category)) {
          const segments = TerrainSurface.buildSegments(scene, placement.assetKey, placement, {
            columnStep: placement.assetKey.startsWith('blocks') ? 8 : 5,
            bodyHeight: 12,
          });
          allSegments.push(...segments);
          WorldBuilder.addSegmentsToPhysics(platforms, segments);
          if (debugVisible) {
            debugGraphics.push(WorldBuilder.drawDebugSegments(scene, segments));
          }
        }

        WorldBuilder.spawnSprite(scene, placement, role as import('./layerConfig').AssetRole, scroll);
      }
    };

    drawPass('background');
    drawPass('water');

    for (const ground of layout.ground) {
      const walkY = ground.surfaceY ?? ground.y + ground.height - 56;
      const segments = TerrainSurface.flatTopSegment(
        { x: ground.x, y: walkY - 4, width: ground.width, height: 8 },
        16,
        0,
      );
      allSegments.push(...segments);
      WorldBuilder.addSegmentsToPhysics(platforms, segments);
      if (debugVisible) {
        debugGraphics.push(WorldBuilder.drawDebugSegments(scene, segments, 0x4caf50));
      }
    }

    drawPass('terrain');
    drawPass('foreground');
    drawPass('decoration');

    const toggleDebug = () => {
      debugVisible = !debugVisible;
      if (debugVisible && debugGraphics.length === 0) {
        for (const seg of allSegments) {
          debugGraphics.push(WorldBuilder.drawDebugSegments(scene, [seg]));
        }
      }
      debugGraphics.forEach((g) => g.setVisible(debugVisible));
    };

    if (debugVisible) {
      scene.add
        .text(16, layout.height - 36, 'DEBUG: collision surfaces (H to toggle, ?debug=1)', {
          fontSize: '14px',
          fontFamily: 'Nunito, sans-serif',
          color: '#1b5e20',
          backgroundColor: '#ffffffcc',
          padding: { x: 8, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(WORLD_LAYERS.debug);
    }

    return { platforms, layout, surfaceSegments: allSegments, toggleDebug };
  }

  static snapFootToSurface(
    footX: number,
    footY: number,
    segments: SurfaceSegment[],
    playerHeight = 64,
  ): { x: number; y: number } {
    const surfaceY = TerrainSurface.findSurfaceYAtX(segments, footX, footY);
    if (surfaceY !== null) {
      return { x: footX, y: surfaceY };
    }
    return { x: footX, y: footY - playerHeight };
  }

  private static createSky(scene: Phaser.Scene, worldW: number): void {
    const h = GAME_CONFIG.height;
    const sky = scene.add.graphics();
    sky.fillGradientStyle(
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyBottom,
      GAME_CONFIG.colors.skyBottom,
      1,
    );
    sky.fillRect(0, 0, worldW, h);
    sky.setScrollFactor(0);
    sky.setDepth(WORLD_LAYERS.sky);
  }

  private static spawnSprite(
    scene: Phaser.Scene,
    placement: WorldPlacement,
    role: ReturnType<typeof getAssetRole>,
    scrollFactor: number,
  ): Phaser.GameObjects.GameObject {
    const key = worldTextureKey(placement.assetKey);
    const cx = placement.x + placement.width / 2;
    const footY = placement.y + placement.height;
    const cy = placement.y + placement.height / 2;
    const baseLayer = layerForRole(role);
    const depth = role === 'terrain' || role === 'foreground'
      ? depthFromFootY(footY, baseLayer)
      : baseLayer;

    if (scene.textures.exists(key)) {
      const sprite = scene.add.image(cx, cy, key);
      sprite.setDisplaySize(placement.width, placement.height);
      sprite.setDepth(depth);
      sprite.setScrollFactor(scrollFactor);
      return sprite;
    }

    if (role === 'terrain') {
      const placeholder = scene.add.rectangle(cx, cy, placement.width, placement.height, 0xffab91, 0.4);
      placeholder.setDepth(depth);
      return placeholder;
    }

    const alpha = role === 'background' ? 0.25 : 0.45;
    const color = role === 'water' ? 0x81d4fa : 0xc5cae9;
    const placeholder = scene.add.rectangle(cx, cy, placement.width, placement.height, color, alpha);
    placeholder.setDepth(depth);
    placeholder.setScrollFactor(scrollFactor);
    return placeholder;
  }

  private static addSegmentsToPhysics(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    segments: SurfaceSegment[],
  ): void {
    for (const seg of segments) {
      const body = platforms.create(
        seg.x,
        seg.y + seg.height / 2,
        'platform-tile',
      ) as Phaser.Physics.Arcade.Sprite;
      body.setDisplaySize(seg.width, seg.height);
      body.setVisible(false);
      body.refreshBody();
    }
  }

  private static drawDebugSegments(
    scene: Phaser.Scene,
    segments: SurfaceSegment[],
    color = 0x00e676,
  ): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.setDepth(WORLD_LAYERS.debug);

    for (const seg of segments) {
      g.fillStyle(color, 0.45);
      g.fillRect(seg.x - seg.width / 2, seg.y, seg.width, seg.height);
      g.lineStyle(2, color, 0.9);
      g.strokeRect(seg.x - seg.width / 2, seg.y, seg.width, seg.height);
    }
    return g;
  }
}
