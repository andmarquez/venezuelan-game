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
        .text(16, layout.height - 36, 'Platform zones (H to toggle, ?zones=0 to hide)', {
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
    const sections = layout.background?.sections ?? [];
    for (const section of sections) {
      const key = section.key;
      if (!scene.textures.exists(key)) continue;

      const displayW = section.width;
      const img = scene.add.image(section.x + displayW / 2, section.y + section.height / 2, key);
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
      WorldBuilder.strokeDashedRect(g, zone.x, zone.y, zone.width, zone.height, 0x009650, 2, 8, 6);
    }

    return { graphics: g, labels: [] };
  }

  /** Figma-style dashed green outline for gameplay zones. */
  private static strokeDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    lineWidth: number,
    dash: number,
    gap: number,
  ): void {
    const edges: [number, number, number, number][] = [
      [x, y, x + w, y],
      [x + w, y, x + w, y + h],
      [x + w, y + h, x, y + h],
      [x, y + h, x, y],
    ];

    g.lineStyle(lineWidth, color, 0.95);
    for (const [x1, y1, x2, y2] of edges) {
      WorldBuilder.strokeDashedLine(g, x1, y1, x2, y2, dash, gap);
    }
  }

  private static strokeDashedLine(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dash: number,
    gap: number,
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ux = dx / len;
    const uy = dy / len;
    let dist = 0;
    let draw = true;

    while (dist < len) {
      const seg = Math.min(draw ? dash : gap, len - dist);
      const sx = x1 + ux * dist;
      const sy = y1 + uy * dist;
      const ex = x1 + ux * (dist + seg);
      const ey = y1 + uy * (dist + seg);
      if (draw) {
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
        g.strokePath();
      }
      dist += seg;
      draw = !draw;
    }
  }
}
