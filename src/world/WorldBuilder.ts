import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import type { LevelLayout, WorldManifest, WorldPlacement } from './worldTypes';
import { worldTextureKey } from './worldTypes';

const CATEGORY_DEPTH: Record<string, number> = {
  parallax: -15,
  water: -8,
  island: -4,
  ground: 0,
  platform: 2,
  foliage: 4,
  prop: 5,
  character: 6,
};

const PARALLAX_KEYS = new Set(['bridge', 'm', 'm-1', 'm-2', 'm-3', 't-1', 't-2', 'island', 'c-1', 'c-2']);
const PLATFORM_KEYS = new Set(['blocks-1', 'blocks-2']);

type BuildResult = {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  layout: LevelLayout;
};

/**
 * Builds Level 1 from Figma layout + exported component PNGs.
 * Missing textures fall back to colored placeholders so the game still runs.
 */
export class WorldBuilder {
  static build(scene: Phaser.Scene, layout: LevelLayout, manifest: WorldManifest | null): BuildResult {
    const platforms = scene.physics.add.staticGroup();
    const metaByKey = manifest?.textures ?? {};

    WorldBuilder.createSky(scene, layout.width);

    const sorted = [...layout.placements].sort(
      (a, b) => (CATEGORY_DEPTH[metaByKey[a.assetKey]?.category ?? 'prop'] ?? 5) -
        (CATEGORY_DEPTH[metaByKey[b.assetKey]?.category ?? 'prop'] ?? 5),
    );

    for (const placement of sorted) {
      const meta = metaByKey[placement.assetKey];
      const category = meta?.category ?? 'prop';

      if (PLATFORM_KEYS.has(placement.assetKey)) {
        WorldBuilder.addPlatformCollider(platforms, placement, meta?.category ?? 'platform');
        WorldBuilder.spawnSprite(scene, placement, category, meta?.scrollFactor);
        continue;
      }

      if (PARALLAX_KEYS.has(placement.assetKey)) {
        WorldBuilder.spawnSprite(scene, placement, 'parallax', meta?.scrollFactor ?? 0.3);
        continue;
      }

      WorldBuilder.spawnSprite(scene, placement, category, meta?.scrollFactor);
    }

    for (const ground of layout.ground) {
      WorldBuilder.addGroundCollider(platforms, ground);
      WorldBuilder.drawGroundStrip(scene, ground);
    }

    return { platforms, layout };
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
    sky.setDepth(-20);
  }

  private static spawnSprite(
    scene: Phaser.Scene,
    placement: WorldPlacement,
    category: string,
    scrollFactor = 1,
  ): Phaser.GameObjects.GameObject | null {
    const key = worldTextureKey(placement.assetKey);
    const cx = placement.x + placement.width / 2;
    const cy = placement.y + placement.height / 2;
    const depth = CATEGORY_DEPTH[category] ?? 5;
    const factor = category === 'parallax' ? scrollFactor : 1;

    if (scene.textures.exists(key)) {
      const sprite = scene.add.image(cx, cy, key);
      sprite.setDisplaySize(placement.width, placement.height);
      sprite.setDepth(depth);
      sprite.setScrollFactor(factor);
      return sprite;
    }

    const alpha = category === 'parallax' ? 0.35 : 0.55;
    const color =
      category === 'water' ? 0x81d4fa :
      category === 'foliage' ? 0x66bb6a :
      category === 'island' ? 0xffcc80 :
      category === 'platform' ? GAME_CONFIG.colors.platform :
      0xc5cae9;

    const placeholder = scene.add.rectangle(cx, cy, placement.width, placement.height, color, alpha);
    placeholder.setDepth(depth);
    placeholder.setScrollFactor(factor);
    return placeholder;
  }

  private static addGroundCollider(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    ground: { x: number; y: number; width: number; height: number },
  ): void {
    const topY = ground.y;
    const bodyH = 24;
    const centerX = ground.x + ground.width / 2;
    const centerY = topY + bodyH / 2;

    const body = platforms.create(centerX, centerY, 'platform-tile') as Phaser.Physics.Arcade.Sprite;
    body.setDisplaySize(ground.width, bodyH);
    body.setVisible(false);
    body.refreshBody();
    body.setDepth(1);
  }

  private static drawGroundStrip(
    scene: Phaser.Scene,
    ground: { x: number; y: number; width: number; height: number },
  ): void {
    const cx = ground.x + ground.width / 2;
    const cy = ground.y + ground.height / 2;
    const strip = scene.add.rectangle(cx, cy, ground.width, ground.height, GAME_CONFIG.colors.ground, 0.92);
    strip.setDepth(0);
    strip.setStrokeStyle(2, GAME_CONFIG.colors.groundTop, 0.5);

    const grass = scene.add.rectangle(
      cx,
      ground.y + 6,
      ground.width,
      10,
      GAME_CONFIG.colors.groundTop,
      0.9,
    );
    grass.setDepth(1);
  }

  private static addPlatformCollider(
    platforms: Phaser.Physics.Arcade.StaticGroup,
    placement: WorldPlacement,
    category: string,
  ): void {
    const topY = placement.y;
    const bodyH = Math.min(placement.height, 20);
    const cx = placement.x + placement.width / 2;
    const cy = topY + bodyH / 2;

    const body = platforms.create(cx, cy, 'platform-tile') as Phaser.Physics.Arcade.Sprite;
    body.setDisplaySize(placement.width, bodyH);
    body.setVisible(false);
    body.refreshBody();
    body.setDepth(CATEGORY_DEPTH[category] ?? 2);
  }
}
