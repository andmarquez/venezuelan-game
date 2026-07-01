import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import type { Enemy } from './Enemy';

/**
 * KissProjectile — a blown kiss that converts deadline bugs into hearts.
 *
 * SPRITE REPLACEMENT: swap the 'kiss' texture key in BootScene for a
 * dedicated projectile sprite if desired.
 */
export class KissProjectile extends Phaser.Physics.Arcade.Sprite {
  private onHitEnemy?: (enemy: Enemy, projectile: KissProjectile) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: 1 | -1,
    onHitEnemy: (enemy: Enemy, projectile: KissProjectile) => void,
  ) {
    super(scene, x, y, 'kiss');
    this.onHitEnemy = onHitEnemy;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.9);
    this.setFlipX(direction === -1);
    this.setDepth(8);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.body!.setSize(20, 20);
    this.body!.setOffset(6, 6);

    this.setVelocityX(direction * GAME_CONFIG.kissProjectileSpeed);

    scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    scene.time.delayedCall(GAME_CONFIG.kissProjectileLifetimeMs, () => {
      if (this.active) this.destroy();
    });
  }

  registerEnemyOverlap(enemies: Enemy[]): void {
    enemies.forEach((enemy) => {
      this.scene.physics.add.overlap(this, enemy, () => {
        if (!this.active || !enemy.active || enemy.isConverted()) return;
        this.onHitEnemy?.(enemy, this);
      });
    });
  }
}
