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
  private jumpsRemaining: number = GAME_CONFIG.maxJumps;
  private maxJumpsAllowed: number = GAME_CONFIG.maxJumps;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'andsiosa-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(GAME_CONFIG.playerBounce);
    this.setDragX(800);
    this.applyFootOrigin();

    this.fitDisplayScale();

    this.createAnimations();
    this.setAnimState('idle');
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.onAnimationUpdate, this);
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
      if (this.scene.anims.exists(key)) return;

      if (state === 'run') {
        const frameTotal = this.scene.textures.get('andsiosa-run').frameTotal;
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNumbers('andsiosa-run', {
            start: 0,
            end: Math.max(0, frameTotal - 1),
          }),
          frameRate: 10,
          repeat: -1,
        });
        return;
      }

      this.scene.anims.create({
        key,
        frames: [{ key: `andsiosa-${state}` }],
        frameRate: 8,
        repeat: state === 'idle' ? -1 : 0,
      });
    });
  }

  setAnimState(state: PlayerAnimState): void {
    if (this.isHurt && state !== 'hurt' && state !== 'victory') return;
    if (this.animState === state) return;

    this.animState = state;
    if (state === 'run') {
      this.setTexture('andsiosa-run', 0);
    } else {
      this.setTexture(`andsiosa-${state}`);
    }
    this.applyFootOrigin();
    this.fitDisplayScale();
    const animKey = `andsiosa-anim-${state}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  updateMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: {
      left: boolean;
      right: boolean;
      jump: boolean;
      highJump: boolean;
      /** Wild Rift joystick axis −1..1 (overrides left/right when set) */
      moveAxis?: number;
    },
  ): void {
    if (this.isHurt || this.animState === 'victory') return;

    const onFloor = this.body?.blocked.down || this.body?.touching.down;
    const axis = keys.moveAxis ?? 0;
    const useAxis = Math.abs(axis) > 0.01;
    const left = useAxis ? axis < 0 : cursors.left?.isDown || keys.left;
    const right = useAxis ? axis > 0 : cursors.right?.isDown || keys.right;
    const jumpPressed = keys.jump;

    if (onFloor) {
      this.jumpsRemaining = this.maxJumpsAllowed;
    }

    if (useAxis) {
      this.setVelocityX(axis * GAME_CONFIG.playerSpeed);
      this.setFlipX(axis < 0);
      this.facingRight = axis > 0;
      if (onFloor) this.setAnimState(Math.abs(axis) > 0.2 ? 'run' : 'idle');
    } else if (left) {
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

    if (jumpPressed && this.jumpsRemaining > 0) {
      const jumpsBefore = this.jumpsRemaining;
      let jumpPower: number = GAME_CONFIG.playerJumpVelocity;

      if (onFloor) {
        jumpPower = keys.highJump
          ? GAME_CONFIG.playerHighJumpVelocity
          : GAME_CONFIG.playerJumpVelocity;
      } else if (jumpsBefore === 1 && this.maxJumpsAllowed >= GAME_CONFIG.maxJumpsWithPrize) {
        jumpPower = GAME_CONFIG.playerTripleJumpVelocity;
      } else {
        jumpPower = GAME_CONFIG.playerDoubleJumpVelocity;
      }

      this.setVelocityY(jumpPower);
      this.jumpsRemaining -= 1;
      this.setAnimState('jump');

      if (!onFloor) {
        const uniform = this.getUniformScale();
        this.scene.tweens.add({
          targets: this,
          scaleY: uniform * 1.06,
          duration: 80,
          yoyo: true,
          onComplete: () => this.fitDisplayScale(),
        });
      }
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
    this.jumpsRemaining = this.maxJumpsAllowed - 1;
    this.setAnimState('jump');
  }

  /** Timer prize — unlock triple jump for the rest of the run. */
  grantTripleJump(): boolean {
    if (this.maxJumpsAllowed >= GAME_CONFIG.maxJumpsWithPrize) return false;

    this.maxJumpsAllowed = GAME_CONFIG.maxJumpsWithPrize;
    const onFloor = this.body?.blocked.down || this.body?.touching.down;
    if (onFloor) {
      this.jumpsRemaining = this.maxJumpsAllowed;
    } else {
      this.jumpsRemaining = Math.min(
        this.maxJumpsAllowed,
        this.jumpsRemaining + (GAME_CONFIG.maxJumpsWithPrize - GAME_CONFIG.maxJumps),
      );
    }
    return true;
  }

  hasTripleJump(): boolean {
    return this.maxJumpsAllowed >= GAME_CONFIG.maxJumpsWithPrize;
  }

  /** Soles are bottom-aligned in export cells — fixed anchor keeps run frames stable. */
  private applyFootOrigin(): void {
    this.setOrigin(0.5, 1);
  }

  private onAnimationUpdate(): void {
    if (this.animState !== 'run') return;
    this.setOrigin(0.5, 1);
    this.fitDisplayScale();
  }

  /** Scale trimmed Figma art to consistent on-screen height with transparent padding. */
  private getUniformScale(): number {
    const frame = this.texture.get();
    if (!frame.height) return GAME_CONFIG.playerDisplayScale;
    return (64 * GAME_CONFIG.playerDisplayScale) / frame.height;
  }

  private fitDisplayScale(): void {
    const frame = this.texture.get();
    if (!frame.width || !frame.height) return;

    const uniform = this.getUniformScale();
    this.setScale(uniform);

    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;

    const bodyW = 28 * GAME_CONFIG.playerDisplayScale;
    const bodyH = 52 * GAME_CONFIG.playerDisplayScale;
    const offsetX = (frame.width - bodyW) / 2;
    const offsetY = frame.height * this.originY - bodyH;

    body.setSize(bodyW, bodyH, false);
    body.setOffset(offsetX, offsetY);
  }
}
