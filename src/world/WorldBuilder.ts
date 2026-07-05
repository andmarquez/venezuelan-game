import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { WORLD_LAYERS } from './layerConfig';
import { getPlatformZoneVisualAlpha } from './layoutUtils';
import { getPlatformCollisionRect, platformTopLeftToCenter } from './worldTypes';
import type { LevelLayout, PlatformZone, CloudZone } from './worldTypes';

export type WorldBuildOptions = {
  debug?: boolean;
  cloudZones?: boolean;
};

export type BuildResult = {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  layout: LevelLayout;
  toggleDebug: () => void;
};

const CLOUD_FILL = 0xce93d8;
const CLOUD_STROKE = 0x8e24aa;

export class WorldBuilder {
  static build(
    scene: Phaser.Scene,
    layout: LevelLayout,
    options: WorldBuildOptions = {},
  ): BuildResult {
    const platforms = scene.physics.add.staticGroup();
    const platformGraphics: Phaser.GameObjects.Graphics[] = [];
    const platformLabels: Phaser.GameObjects.Text[] = [];
    const cloudGraphics: Phaser.GameObjects.Graphics[] = [];
    const cloudLabels: Phaser.GameObjects.Text[] = [];
    let platformDebugVisible = options.debug ?? false;

    WorldBuilder.createSky(scene, layout.width);
    WorldBuilder.drawBackground(scene, layout);
    WorldBuilder.drawPlatformArt(scene, layout);
    WorldBuilder.createPlatformBodies(platforms, layout.platforms);

    const renderPlatformDebug = () => {
      const { graphics, labels } = WorldBuilder.drawPlatformDebug(scene, layout.platforms);
      platformGraphics.push(graphics);
      platformLabels.push(...labels);
    };

    const renderCloudDebug = () => {
      if (!layout.clouds?.length) return;
      const { graphics, labels } = WorldBuilder.drawCloudDebug(scene, layout.clouds);
      cloudGraphics.push(graphics);
      cloudLabels.push(...labels);
    };

    if (platformDebugVisible && getPlatformZoneVisualAlpha() > 0) renderPlatformDebug();
    if (options.cloudZones) renderCloudDebug();

    const toggleDebug = () => {
      platformDebugVisible = !platformDebugVisible;
      if (platformDebugVisible && platformGraphics.length === 0) renderPlatformDebug();
      platformGraphics.forEach((g) => g.setVisible(platformDebugVisible));
      platformLabels.forEach((t) => t.setVisible(platformDebugVisible));
    };

    if (platformDebugVisible || options.cloudZones) {
      const hints: string[] = [];
      const zoneAlpha = getPlatformZoneVisualAlpha();
      if (platformDebugVisible && zoneAlpha > 0) hints.push('green=platform, blue=pipe');
      if (options.cloudZones) hints.push('purple=cloud');
      if (hints.length > 0) {
        scene.add
          .text(16, layout.height - 36, `Zones: ${hints.join(', ')}  |  ?zones=1  H toggles platforms`, {
            fontSize: '14px',
            fontFamily: 'Nunito, sans-serif',
            color: '#4a148c',
            backgroundColor: '#ffffffcc',
            padding: { x: 8, y: 4 },
          })
          .setScrollFactor(0)
          .setDepth(WORLD_LAYERS.debug);
      }
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

  private static drawPlatformArt(scene: Phaser.Scene, layout: LevelLayout): void {
    for (const art of layout.platformArt ?? []) {
      if (!scene.textures.exists(art.key)) continue;

      const img = scene.add.image(art.x + art.width / 2, art.y + art.height / 2, art.key);
      img.setDisplaySize(art.width, art.height);
      img.setDepth(WORLD_LAYERS.platformArt);
      img.setScrollFactor(1);
    }
  }

  private static createPlatformBodies(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    zones: PlatformZone[],
  ): void {
    for (const zone of zones) {
      const collision = getPlatformCollisionRect(zone);
      const { cx, cy } = platformTopLeftToCenter(collision);
      const body = platforms.create(cx, cy, 'platform-tile') as Phaser.Physics.Arcade.Sprite;
      body.setDisplaySize(collision.width, collision.height);
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
    const fillAlpha = getPlatformZoneVisualAlpha();
    const strokeAlpha = fillAlpha > 0 ? 0.95 : 0;

    for (const zone of zones) {
      const isPipe = zone.type === 'pipe';
      const collision = getPlatformCollisionRect(zone);
      const isPlatform = !isPipe && zone.name !== 'ground_floor';

      if (isPlatform) {
        g.fillStyle(0x00e676, fillAlpha * 0.25);
        g.fillRect(zone.x, zone.y, zone.width, zone.height);
      }

      g.fillStyle(isPipe ? 0x40c4ff : 0x00e676, fillAlpha);
      g.fillRect(collision.x, collision.y, collision.width, collision.height);
      WorldBuilder.strokeDashedRect(
        g,
        collision.x,
        collision.y,
        collision.width,
        collision.height,
        isPipe ? 0x0288d1 : 0x009650,
        2,
        8,
        6,
        strokeAlpha,
      );
    }

    return { graphics: g, labels: [] };
  }

  private static drawCloudDebug(
    scene: Phaser.Scene,
    zones: CloudZone[],
  ): { graphics: Phaser.GameObjects.Graphics; labels: Phaser.GameObjects.Text[] } {
    const g = scene.add.graphics();
    g.setDepth(WORLD_LAYERS.platformDebug);
    const labels: Phaser.GameObjects.Text[] = [];

    for (const zone of zones) {
      const r = Math.min(zone.height / 2, 40);
      g.fillStyle(CLOUD_FILL, 0.52);
      g.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, r);
      WorldBuilder.strokeDashedRoundedRect(
        g,
        zone.x,
        zone.y,
        zone.width,
        zone.height,
        r,
        CLOUD_STROKE,
        2,
        8,
        6,
      );

      const label = scene.add
        .text(zone.x + zone.width / 2, zone.y + zone.height / 2, zone.name.replace('cloud_', '☁'), {
          fontSize: '13px',
          fontFamily: 'Nunito, sans-serif',
          color: '#4a148c',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(WORLD_LAYERS.platformDebug + 1);
      labels.push(label);
    }

    return { graphics: g, labels };
  }

  private static strokeDashedRoundedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    color: number,
    lineWidth: number,
    dash: number,
    gap: number,
  ): void {
    const r = Math.min(radius, w / 2, h / 2);
    const edges: [number, number, number, number][] = [
      [x + r, y, x + w - r, y],
      [x + w, y + r, x + w, y + h - r],
      [x + w - r, y + h, x + r, y + h],
      [x, y + h - r, x, y + r],
    ];
    g.lineStyle(lineWidth, color, 0.95);
    for (const [x1, y1, x2, y2] of edges) {
      WorldBuilder.strokeDashedLine(g, x1, y1, x2, y2, dash, gap);
    }
  }

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
    alpha = 0.95,
  ): void {
    const edges: [number, number, number, number][] = [
      [x, y, x + w, y],
      [x + w, y, x + w, y + h],
      [x + w, y + h, x, y + h],
      [x, y + h, x, y],
    ];

    g.lineStyle(lineWidth, color, alpha);
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
