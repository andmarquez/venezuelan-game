import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * Deadline Bug — a cute enemy that patrols left and right.
 *
 * SPRITE REPLACEMENT:
 * Load 'deadline-bug-sheet' in BootScene and play a walk animation here.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private direction: 1 | -1 = 1;
  private patrolMin: number;
  private patrolMax: number;
  private bobTween?: Phaser.Tweens.Tween;
  private converted = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolMin: number,
    patrolMax: number,
  ) {
    super(scene, x, y, 'deadline-bug');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.patrolMin = patrolMin;
    this.patrolMax = patrolMax;
    this.setImmovable(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setOrigin(0.5, 1);
    this.fitDisplaySize(40, 32);
    this.body!.setSize(32, 28);
    this.body!.setOffset(4, 4);
    this.setDepth(5);
    this.setFlipX(this.direction === -1);

    // Gentle bob animation
    this.bobTween = scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  isConverted(): boolean {
    return this.converted;
  }

  /** Turn this deadline bug into a floating heart and remove it from play. */
  convertToHeart(onComplete?: () => void): void {
    if (this.converted) return;
    this.converted = true;
    this.bobTween?.stop();
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;

    const scene = this.scene;
    const heart = scene.add.text(this.x, this.y - 10, '♥', {
      fontSize: '36px',
      color: '#e91e63',
    });
    heart.setOrigin(0.5).setDepth(12);

    scene.tweens.add({
      targets: heart,
      y: heart.y - 50,
      scale: 1.6,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => heart.destroy(),
    });

    scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      angle: 20,
      duration: 280,
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  update(): void {
    if (this.converted) return;
    this.setVelocityX(this.direction * GAME_CONFIG.enemySpeed);

    if (this.x <= this.patrolMin) {
      this.direction = 1;
      this.setFlipX(false);
    } else if (this.x >= this.patrolMax) {
      this.direction = -1;
      this.setFlipX(true);
    }
  }

  /** Scale 3× Figma exports down to logical gameplay size. */
  private fitDisplaySize(width: number, height: number): void {
    const frame = this.texture.get();
    if (!frame.width || !frame.height) return;
    this.setScale(width / frame.width, height / frame.height);
  }
}
