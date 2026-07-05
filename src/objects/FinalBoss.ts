import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * FinalBoss — end-of-level guardian on the goal platform.
 * Requires the Creative Spark prize before kisses can damage it.
 */
export class FinalBoss extends Phaser.Physics.Arcade.Sprite {
  private direction: 1 | -1 = 1;
  private patrolMin: number;
  private patrolMax: number;
  private hp: number;
  private maxHp: number;
  private defeated = false;
  private hpBar!: Phaser.GameObjects.Graphics;
  private bobTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolMin: number,
    patrolMax: number,
  ) {
    super(scene, x, y, 'final-boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.patrolMin = patrolMin;
    this.patrolMax = patrolMax;
    this.maxHp = GAME_CONFIG.finalBossHp;
    this.hp = this.maxHp;

    this.setOrigin(0.5, 1);
    this.fitDisplaySize(80 * 1.35);
    this.setImmovable(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(52, 56);
    this.body!.setOffset(14, 8);

    this.hpBar = scene.add.graphics().setDepth(40);
    this.drawHpBar();

    this.bobTween = scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  isDefeated(): boolean {
    return this.defeated;
  }

  takeDamage(onDefeated?: () => void): boolean {
    if (this.defeated) return false;

    this.hp -= 1;
    this.drawHpBar();
    this.scene.tweens.add({
      targets: this,
      alpha: 0.55,
      duration: 60,
      yoyo: true,
      repeat: 1,
    });

    if (this.hp <= 0) {
      this.defeat(onDefeated);
      return true;
    }
    return false;
  }

  private defeat(onDefeated?: () => void): void {
    if (this.defeated) return;
    this.defeated = true;
    this.bobTween?.stop();
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.hpBar.destroy();

    const scene = this.scene;
    const burst = scene.add.particles(this.x, this.y - 30, 'particle', {
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 16,
      tint: [GAME_CONFIG.colors.bossGlow, GAME_CONFIG.colors.bossAccent, 0xffffff],
      emitting: false,
    });
    burst.explode(20);
    scene.time.delayedCall(700, () => burst.destroy());

    scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      angle: -25,
      duration: 500,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
        onDefeated?.();
      },
    });
  }

  private drawHpBar(): void {
    const barW = 64;
    const barH = 8;
    const x = this.x - barW / 2;
    const y = this.y - 78;
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.45);
    this.hpBar.fillRoundedRect(x - 1, y - 1, barW + 2, barH + 2, 4);
    this.hpBar.fillStyle(0x424242, 1);
    this.hpBar.fillRoundedRect(x, y, barW, barH, 3);
    this.hpBar.fillStyle(GAME_CONFIG.colors.bossAccent, 1);
    this.hpBar.fillRoundedRect(x, y, barW * pct, barH, 3);
  }

  update(): void {
    if (this.defeated) return;
    this.setVelocityX(this.direction * GAME_CONFIG.finalBossSpeed);
    this.drawHpBar();

    if (this.x <= this.patrolMin) {
      this.direction = 1;
      this.setFlipX(false);
    } else if (this.x >= this.patrolMax) {
      this.direction = -1;
      this.setFlipX(true);
    }
  }

  destroy(fromScene?: boolean): void {
    this.hpBar?.destroy();
    super.destroy(fromScene);
  }

  /** Scale 3× Figma exports down to logical gameplay size. */
  private fitDisplaySize(width: number, height = width): void {
    const frame = this.texture.get();
    if (!frame.width || !frame.height) return;
    this.setScale(width / frame.width, height / frame.height);
  }
}
