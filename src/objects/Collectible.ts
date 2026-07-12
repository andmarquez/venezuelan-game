import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { WORLD_LAYERS } from '../world/layerConfig';

export type CollectibleType = 'kiss' | 'timer' | 'virgen';

/** Same texture keys as the original working kisses — Figma art replaces BootScene placeholders. */
const COLLECTIBLE_TEXTURE: Record<CollectibleType, string> = {
  kiss: 'kiss',
  timer: 'timer',
  virgen: 'virgen',
};

/**
 * Map collectible — sits on Figma red-dot markers, floats, and pops on pickup.
 */
export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly collectibleType: CollectibleType;
  private collected = false;
  private glowFx?: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: CollectibleType,
  ) {
    const textureKey = COLLECTIBLE_TEXTURE[type];
    super(scene, x, y, textureKey);
    this.collectibleType = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setDepth(WORLD_LAYERS.collectibles);

    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (type === 'timer') {
      scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 4000,
        repeat: -1,
      });
    }
    if (type === 'virgen') {
      this.setDisplaySize(56, 56);
      this.addVirgenGlow();
    }
  }

  private addVirgenGlow(): void {
    this.glowFx = this.scene.add.ellipse(
      this.x,
      this.y,
      72,
      72,
      GAME_CONFIG.colors.virgenBlessingGlow,
      0.35,
    );
    this.glowFx.setDepth(this.depth - 1);
    this.glowFx.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: this.glowFx,
      alpha: { from: 0.25, to: 0.55 },
      scaleX: { from: 0.92, to: 1.12 },
      scaleY: { from: 0.92, to: 1.12 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.glowFx) {
      this.glowFx.setPosition(this.x, this.y);
      this.glowFx.setDepth(this.depth - 1);
    }
  }

  isCollected(): boolean {
    return this.collected;
  }

  override destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.tweens.killTweensOf(this);
      if (this.glowFx) {
        this.scene.tweens.killTweensOf(this.glowFx);
        this.glowFx.destroy();
        this.glowFx = undefined;
      }
    }
    super.destroy(fromScene);
  }

  collectEffect(): void {
    if (this.collected) return;
    this.collected = true;

    if (this.scene) {
      this.scene.tweens.killTweensOf(this);
      if (this.glowFx) {
        this.scene.tweens.killTweensOf(this.glowFx);
        this.glowFx.destroy();
        this.glowFx = undefined;
      }
    }
    this.disableBody(true, true);

    if (this.collectibleType === 'kiss') {
      this.spawnKissParticles();
    } else if (this.collectibleType === 'timer') {
      this.spawnTimerGlow();
    } else if (this.collectibleType === 'virgen') {
      this.spawnVirgenBurst();
    } else {
      this.destroy();
      return;
    }

    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 200,
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

  private spawnVirgenBurst(): void {
    const emitter = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 140 },
      scale: { start: 0.9, end: 0 },
      lifespan: 550,
      quantity: 12,
      tint: [GAME_CONFIG.colors.virgenGlow, GAME_CONFIG.colors.virgen, 0xffffff],
      emitting: false,
    });
    emitter.explode(14);
    this.scene.time.delayedCall(600, () => emitter.destroy());

    const halo = this.scene.add.text(this.x, this.y - 10, '✧', {
      fontSize: '28px',
      color: '#f5f5f5',
    });
    halo.setOrigin(0.5);
    this.scene.tweens.add({
      targets: halo,
      y: halo.y - 45,
      alpha: 0,
      scale: 1.8,
      duration: 650,
      onComplete: () => halo.destroy(),
    });
  }
}
