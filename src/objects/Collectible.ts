import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { assetUrl } from '../utils/assetUrl';
import { WORLD_LAYERS } from '../world/layerConfig';

export type CollectibleType = 'kiss' | 'timer' | 'spark';

const COLLECTIBLE_FILES: Record<CollectibleType, string> = {
  kiss: 'kiss.gif',
  timer: 'timer.gif',
  spark: 'magic-power.gif',
};

/** Display size in world pixels — marker (x,y) is the icon center on the map. */
const COLLECTIBLE_SIZE: Record<CollectibleType, number> = {
  kiss: 48,
  timer: 48,
  spark: 48,
};

/**
 * Map collectible — invisible physics sprite at Figma marker center + animated GIF DOM overlay.
 */
export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly collectibleType: CollectibleType;
  private collected = false;
  private domVisual?: Phaser.GameObjects.DOMElement;
  private readonly displaySize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: CollectibleType,
  ) {
    super(scene, x, y, 'particle');
    this.collectibleType = type;
    this.displaySize = COLLECTIBLE_SIZE[type];

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setAlpha(0);
    this.setDisplaySize(4, 4);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    const hit = this.displaySize * 0.72;
    body.setSize(hit, hit);

    const file = COLLECTIBLE_FILES[type];
    const src = `${assetUrl(`assets/collectibles/${file}`)}?v=${encodeURIComponent(GAME_CONFIG.collectibleAssetVersion)}`;
    this.domVisual = scene.add
      .dom(x, y)
      .createFromHTML(
        `<img src="${src}" width="${this.displaySize}" height="${this.displaySize}" style="pointer-events:none;object-fit:contain;display:block;" alt="" />`,
      );
    this.domVisual.setOrigin(0.5, 0.5);
    this.domVisual.setScrollFactor(1);
    this.domVisual.setDepth(WORLD_LAYERS.collectibles);

    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.domVisual?.active) {
      this.domVisual.setPosition(this.x, this.y);
    }
  }

  isCollected(): boolean {
    return this.collected;
  }

  override destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this);
    this.domVisual?.destroy();
    this.domVisual = undefined;
    super.destroy(fromScene);
  }

  collectEffect(): void {
    if (this.collected) return;
    this.collected = true;

    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);
    this.domVisual?.destroy();
    this.domVisual = undefined;
    this.setActive(false);
    this.setVisible(false);

    if (this.collectibleType === 'kiss') {
      this.spawnKissParticles();
    } else if (this.collectibleType === 'timer') {
      this.spawnTimerGlow();
    } else {
      this.spawnSparkBurst();
    }

    this.scene.tweens.add({
      targets: this,
      scale: 1.4,
      alpha: 0,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }

  private spawnKissParticles(): void {
    const emitter = this.scene.add.particles(
      this.x,
      this.y,
      'particle',
      {
        speed: { min: 40, max: 120 },
        scale: { start: 0.8, end: 0 },
        lifespan: 500,
        quantity: 8,
        tint: [GAME_CONFIG.colors.kiss, GAME_CONFIG.colors.kissGlow, 0xffffff],
        emitting: false,
      },
    );
    emitter.explode(10);
    this.scene.time.delayedCall(600, () => emitter.destroy());

    const heart = this.scene.add.text(this.x, this.y - 10, '♥', {
      fontSize: '24px',
      color: '#e91e63',
    });
    heart.setOrigin(0.5);
    this.scene.tweens.add({
      targets: heart,
      y: heart.y - 40,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      onComplete: () => heart.destroy(),
    });
  }

  private spawnTimerGlow(): void {
    const ring = this.scene.add.circle(
      this.x,
      this.y,
      20,
      GAME_CONFIG.colors.timerGlow,
      0.6,
    );
    this.scene.tweens.add({
      targets: ring,
      scale: 2.5,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
  }

  private spawnSparkBurst(): void {
    const emitter = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 140 },
      scale: { start: 0.9, end: 0 },
      lifespan: 550,
      quantity: 12,
      tint: [GAME_CONFIG.colors.bossSpark, GAME_CONFIG.colors.bossSparkGlow, 0xffffff],
      emitting: false,
    });
    emitter.explode(14);
    this.scene.time.delayedCall(600, () => emitter.destroy());

    const star = this.scene.add.text(this.x, this.y - 10, '✦', {
      fontSize: '28px',
      color: '#ffd54f',
    });
    star.setOrigin(0.5);
    this.scene.tweens.add({
      targets: star,
      y: star.y - 45,
      alpha: 0,
      scale: 1.8,
      duration: 650,
      onComplete: () => star.destroy(),
    });
  }
}
