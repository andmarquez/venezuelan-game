import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { defaultScrollFactor, depthFromFootY, WORLD_LAYERS } from './layerConfig';
import type { LevelLayout, PlatformZone, VisualPlacement, WorldManifest } from './worldTypes';
import { platformTopLeftToCenter, worldTextureKey } from './worldTypes';

export type WorldBuildOptions = {
  debug?: boolean;
};

export type BuildResult = {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  layout: LevelLayout;
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
    const debugLabels: Phaser.GameObjects.Text[] = [];
    const debugGraphics: Phaser.GameObjects.Graphics[] = [];
    let debugVisible = options.debug ?? false;

    WorldBuilder.createSky(scene, layout.width);
    WorldBuilder.drawBackground(scene, layout, metaByKey);
    WorldBuilder.createPlatformBodies(platforms, layout.platforms);

    if (debugVisible) {
      const { graphics, labels } = WorldBuilder.drawPlatformDebug(scene, layout.platforms);
      debugGraphics.push(graphics);
      debugLabels.push(...labels);
    }

    WorldBuilder.drawForeground(scene, layout, metaByKey);

    const toggleDebug = () => {
      debugVisible = !debugVisible;
      if (debugVisible && debugGraphics.length === 0) {
        const { graphics, labels } = WorldBuilder.drawPlatformDebug(scene, layout.platforms);
        debugGraphics.push(graphics);
        debugLabels.push(...labels);
      }
      debugGraphics.forEach((g) => g.setVisible(debugVisible));
      debugLabels.forEach((t) => t.setVisible(debugVisible));
    };

    if (debugVisible) {
      scene.add
        .text(16, layout.height - 36, 'DEBUG: platform zones (H to toggle, ?debug=1)', {
          fontSize: '14px',
          fontFamily: 'Nunito, sans-serif',
          color: '#1b5e20',
          backgroundColor: '#ffffffcc',
          padding: { x: 8, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(WORLD_LAYERS.debug);
    }

    return { platforms, layout, toggleDebug };
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

  private static drawBackground(
    scene: Phaser.Scene,
    layout: LevelLayout,
    metaByKey: WorldManifest['textures'],
  ): void {
    const bg = layout.background;

    if (bg.mode === 'sections' && bg.sections?.length) {
      for (const section of bg.sections) {
        if (section.path && scene.textures.exists(section.path)) {
          const img = scene.add.image(
            section.x + section.width / 2,
            section.y + section.height / 2,
            section.path,
          );
          img.setDisplaySize(section.width, section.height);
          img.setDepth(WORLD_LAYERS.background);
          img.setScrollFactor(1);
        }
      }
    }

    const placements = bg.placements ?? [];
    for (const p of placements) {
      const scroll = p.scrollFactor ?? metaByKey[p.assetKey]?.scrollFactor ?? defaultScrollFactor(p.assetKey);
      WorldBuilder.spawnVisual(scene, p, WORLD_LAYERS.background, scroll);
    }
  }

  private static drawForeground(
    scene: Phaser.Scene,
    layout: LevelLayout,
    _metaByKey: WorldManifest['textures'],
  ): void {
    for (const p of layout.foreground ?? []) {
      const footY = p.y + p.height;
      WorldBuilder.spawnVisual(
        scene,
        p,
        depthFromFootY(footY, WORLD_LAYERS.foreground),
        1,
      );
    }
  }

  private static spawnVisual(
    scene: Phaser.Scene,
    placement: VisualPlacement,
    depth: number,
    scrollFactor: number,
  ): Phaser.GameObjects.GameObject {
    const key = worldTextureKey(placement.assetKey);
    const cx = placement.x + placement.width / 2;
    const cy = placement.y + placement.height / 2;

    if (scene.textures.exists(key)) {
      const sprite = scene.add.image(cx, cy, key);
      sprite.setDisplaySize(placement.width, placement.height);
      sprite.setDepth(depth);
      sprite.setScrollFactor(scrollFactor);
      return sprite;
    }

    const placeholder = scene.add.rectangle(cx, cy, placement.width, placement.height, 0xb0bec5, 0.2);
    placeholder.setDepth(depth);
    placeholder.setScrollFactor(scrollFactor);
    return placeholder;
  }

  private static createPlatformBodies(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    zones: PlatformZone[],
  ): void {
    for (const zone of zones) {
      const { cx, cy } = platformTopLeftToCenter(zone);
      const body = platforms.create(cx, cy, 'platform-tile') as Phaser.Physics.Arcade.Sprite;
      body.setDisplaySize(zone.width, zone.height);
      body.setVisible(false);
      body.setData('platformName', zone.name);
      body.refreshBody();
    }
  }

  private static drawPlatformDebug(
    scene: Phaser.Scene,
    zones: PlatformZone[],
  ): { graphics: Phaser.GameObjects.Graphics; labels: Phaser.GameObjects.Text[] } {
    const g = scene.add.graphics();
    g.setDepth(WORLD_LAYERS.debug);
    const labels: Phaser.GameObjects.Text[] = [];

    for (const zone of zones) {
      g.fillStyle(0x00e676, 0.35);
      g.fillRect(zone.x, zone.y, zone.width, zone.height);
      g.lineStyle(2, 0x00c853, 0.95);
      g.strokeRect(zone.x, zone.y, zone.width, zone.height);

      const label = scene.add
        .text(zone.x + 4, zone.y - 14, zone.name, {
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#004d40',
          backgroundColor: '#e8f5e9cc',
          padding: { x: 3, y: 1 },
        })
        .setDepth(WORLD_LAYERS.debug);
      labels.push(label);
    }

    return { graphics: g, labels };
  }
}
