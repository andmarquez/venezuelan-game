import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { assetUrl } from '../utils/assetUrl';

export type CollectibleType = 'kiss' | 'timer' | 'spark';

const COLLECTIBLE_FILES: Record<CollectibleType, string> = {
  kiss: 'kiss.gif',
  timer: 'timer.gif',
  spark: 'magic-power.gif',
};

const COLLECTIBLE_SIZE: Record<CollectibleType, number> = {
  kiss: 48,
  timer: 48,
  spark: 48,
};

/**
 * World collectible — animated GIF from Figma (DOM layer) + arcade hitbox.
 */
export class Collectible extends Phaser.GameObjects.Container {
  readonly collectibleType: CollectibleType;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: CollectibleType,
  ) {
    super(scene, x, y);
    this.collectibleType = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const size = COLLECTIBLE_SIZE[type];
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(size * 0.65, size * 0.65);
    body.setOffset(-size * 0.325, -size * 0.65);

    const file = COLLECTIBLE_FILES[type];
    const src = `${assetUrl(`assets/collectibles/${file}`)}?v=${encodeURIComponent(GAME_CONFIG.collectibleAssetVersion)}`;
    const dom = scene.add
      .dom(0, -size * 0.5)
      .createFromHTML(
        `<img src="${src}" width="${size}" height="${size}" style="pointer-events:none;object-fit:contain;display:block;" alt="" />`,
      );
    dom.setOrigin(0.5, 0.5);
    this.add(dom);

    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collectEffect(): void {
    const scene = this.scene;

    if (this.collectibleType === 'kiss') {
      this.spawnKissParticles();
    } else if (this.collectibleType === 'timer') {
      this.spawnTimerGlow();
    } else {
      this.spawnSparkBurst();
    }

    scene.tweens.add({
      targets: this,
      scale: 1.4,
      alpha: 0,
      duration: 220,
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
