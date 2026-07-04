import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { WORLD_LAYERS } from './layerConfig';
import type { LevelLayout, PlatformZone } from './worldTypes';
import { platformTopLeftToCenter } from './worldTypes';

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
    options: WorldBuildOptions = {},
  ): BuildResult {
    const platforms = scene.physics.add.staticGroup();
    const debugLabels: Phaser.GameObjects.Text[] = [];
    const debugGraphics: Phaser.GameObjects.Graphics[] = [];
    let debugVisible = options.debug ?? false;

    WorldBuilder.createSky(scene, layout.width);
    WorldBuilder.drawBackground(scene, layout);
    WorldBuilder.createPlatformBodies(platforms, layout.platforms);

    if (debugVisible) {
      const { graphics, labels } = WorldBuilder.drawPlatformDebug(scene, layout.platforms);
      debugGraphics.push(graphics);
      debugLabels.push(...labels);
    }

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
    sky.setScrollFactor(1);
    sky.setDepth(WORLD_LAYERS.sky);
  }

  private static drawBackground(scene: Phaser.Scene, layout: LevelLayout): void {
    for (const section of layout.background.sections) {
      if (!scene.textures.exists(section.key)) continue;

      const displayW = Math.min(section.width, layout.width);
      const texture = scene.textures.get(section.key);
      const frame = texture.get();
      const cropW =
        frame.width > displayW
          ? Math.round(frame.width * (displayW / section.width))
          : frame.width;

      const img = scene.add.image(
        section.x + displayW / 2,
        section.y + section.height / 2,
        section.key,
      );
      if (cropW < frame.width) {
        img.setCrop(0, 0, cropW, frame.height);
      }
      img.setDisplaySize(displayW, section.height);
      img.setDepth(WORLD_LAYERS.background);
      img.setScrollFactor(1);
    }
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

    for (const zone of zones) {
      g.fillStyle(0x00e676, 0.35);
      g.fillRect(zone.x, zone.y, zone.width, zone.height);
      g.lineStyle(2, 0x00c853, 0.95);
      g.strokeRect(zone.x, zone.y, zone.width, zone.height);
    }

    return { graphics: g, labels: [] };
  }
}
