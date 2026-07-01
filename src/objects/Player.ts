import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

export type PlayerAnimState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'hurt'
  | 'victory';

/**
 * Andsiosa — the player character.
 *
 * SPRITE REPLACEMENT:
 * 1. Load a spritesheet in BootScene (e.g. 'andsiosa-sheet').
 * 2. In createAnimations(), swap placeholder keys for real frame names.
 * 3. Remove setTexture calls in setAnimState if using a single animated sprite.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private animState: PlayerAnimState = 'idle';
  private isHurt = false;
  private hurtTimer?: Phaser.Time.TimerEvent;
  private facingRight = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'andsiosa-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(GAME_CONFIG.playerBounce);
    this.setDragX(800);
    this.body!.setSize(28, 52);
    this.body!.setOffset(10, 10);
    this.setDepth(10);

    this.createAnimations();
    this.setAnimState('idle');
  }

  private createAnimations(): void {
    const states: PlayerAnimState[] = [
      'idle',
      'run',
      'jump',
      'fall',
      'hurt',
      'victory',
    ];

    states.forEach((state) => {
      const key = `andsiosa-anim-${state}`;
      if (!this.scene.anims.exists(key)) {
        // Single-frame placeholder anim — replace with multi-frame spritesheet later
        this.scene.anims.create({
          key,
          frames: [{ key: `andsiosa-${state}` }],
          frameRate: 8,
          repeat: state === 'idle' || state === 'run' ? -1 : 0,
        });
      }
    });
  }

  setAnimState(state: PlayerAnimState): void {
    if (this.isHurt && state !== 'hurt' && state !== 'victory') return;
    if (this.animState === state) return;

    this.animState = state;
    this.setTexture(`andsiosa-${state}`);
    const animKey = `andsiosa-anim-${state}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  updateMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: { left: boolean; right: boolean; jump: boolean; highJump: boolean },
  ): void {
    if (this.isHurt || this.animState === 'victory') return;

    const onFloor = this.body?.blocked.down || this.body?.touching.down;
    const left = cursors.left?.isDown || keys.left;
    const right = cursors.right?.isDown || keys.right;
    const jumpPressed = keys.jump;

    if (left) {
      this.setVelocityX(-GAME_CONFIG.playerSpeed);
      this.setFlipX(true);
      this.facingRight = false;
      if (onFloor) this.setAnimState('run');
    } else if (right) {
      this.setVelocityX(GAME_CONFIG.playerSpeed);
      this.setFlipX(false);
      this.facingRight = true;
      if (onFloor) this.setAnimState('run');
    } else {
      this.setVelocityX(0);
      if (onFloor) this.setAnimState('idle');
    }

    if (jumpPressed && onFloor) {
      const jumpPower = keys.highJump
        ? GAME_CONFIG.playerHighJumpVelocity
        : GAME_CONFIG.playerJumpVelocity;
      this.setVelocityY(jumpPower);
      this.setAnimState('jump');
    }

    if (!onFloor) {
      if ((this.body?.velocity.y ?? 0) < 0) {
        this.setAnimState('jump');
      } else {
        this.setAnimState('fall');
      }
    }
  }

  getFacingRight(): boolean {
    return this.facingRight;
  }

  hurt(onComplete?: () => void): void {
    if (this.isHurt) return;
    this.isHurt = true;
    this.setAnimState('hurt');
    this.setTint(0xffaaaa);
    this.setVelocityY(-200);
    this.setVelocityX(this.facingRight ? -120 : 120);

    this.hurtTimer?.remove();
    this.hurtTimer = this.scene.time.delayedCall(
      GAME_CONFIG.hurtInvulnMs,
      () => {
        this.isHurt = false;
        this.clearTint();
        this.setAnimState('idle');
        onComplete?.();
      },
    );
  }

  celebrate(): void {
    this.setAnimState('victory');
    this.setVelocity(0, 0);
    this.body!.enable = false;
  }

  isInvulnerable(): boolean {
    return this.isHurt;
  }

  /** Quick puff animation when blowing a kiss. */
  playKissBlow(): void {
    if (this.isHurt || this.animState === 'victory') return;
    this.scene.tweens.add({
      targets: this,
      y: this.y - 4,
      duration: 80,
      yoyo: true,
    });
  }

  stompBounce(): void {
    this.setVelocityY(GAME_CONFIG.stompBounceVelocity);
    this.setAnimState('jump');
  }
}
