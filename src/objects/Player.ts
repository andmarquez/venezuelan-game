import Phaser from 'phaser';
import { getSoundManager } from '../audio/SoundManager';
import { GAME_CONFIG } from '../config/gameConfig';
import { WORLD_LAYERS } from '../world/layerConfig';

export type PlayerAnimState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'hurt'
  | 'victory';

export type AquaticMode = 'land' | 'canoe' | 'swim';

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
  private maxJumpsAllowed: number = GAME_CONFIG.maxJumps;
  private jumpsRemaining: number = GAME_CONFIG.maxJumps;
  private blessingGlow?: Phaser.GameObjects.Container;
  private aquaticMode: AquaticMode = 'land';
  private waterSurfaceY = 280;
  private canoeSprite?: Phaser.GameObjects.Image;

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
      /** Hold down / S to dive or swim deeper */
      down?: boolean;
      /** Wild Rift joystick axis −1..1 (overrides left/right when set) */
      moveAxis?: number;
    },
  ): void {
    if (this.isHurt || this.animState === 'victory') return;

    if (this.aquaticMode === 'swim') {
      this.updateSwimMovement(cursors, keys);
      return;
    }
    if (this.aquaticMode === 'canoe') {
      this.updateCanoeMovement(cursors, keys);
      return;
    }

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
      getSoundManager(this.scene.game)?.play('sfx-jump', this.scene, { volume: 0.45 });

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

  /** Level 3 — land / canoe on surface / swim underwater. */
  setAquaticMode(mode: AquaticMode, surfaceY = this.waterSurfaceY): void {
    this.waterSurfaceY = surfaceY;
    if (this.aquaticMode === mode) {
      this.syncCanoeVisual();
      return;
    }
    this.aquaticMode = mode;
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;

    if (mode === 'swim' || mode === 'canoe') {
      body.setAllowGravity(false);
      this.setDragX(mode === 'canoe' ? 400 : 200);
      this.jumpsRemaining = this.maxJumpsAllowed;
    } else {
      body.setAllowGravity(true);
      this.setDragX(800);
      body.setMaxVelocityY(2000);
    }
    this.syncCanoeVisual();
  }

  getAquaticMode(): AquaticMode {
    return this.aquaticMode;
  }

  private updateCanoeMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: {
      left: boolean;
      right: boolean;
      jump: boolean;
      down?: boolean;
      moveAxis?: number;
    },
  ): void {
    const axis = keys.moveAxis ?? 0;
    const useAxis = Math.abs(axis) > 0.01;
    const left = useAxis ? axis < 0 : cursors.left?.isDown || keys.left;
    const right = useAxis ? axis > 0 : cursors.right?.isDown || keys.right;
    const speed = GAME_CONFIG.playerCanoeSpeed;

    if (useAxis) {
      this.setVelocityX(axis * speed);
      this.setFlipX(axis < 0);
      this.facingRight = axis > 0;
    } else if (left) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
      this.facingRight = false;
    } else if (right) {
      this.setVelocityX(speed);
      this.setFlipX(false);
      this.facingRight = true;
    } else {
      this.setVelocityX(0);
    }

    // Keep canoe floating on the surface band.
    const floatY = this.waterSurfaceY - 12;
    this.y = Phaser.Math.Linear(this.y, floatY, 0.25);
    this.setVelocityY(0);

    if (keys.down || cursors.down?.isDown) {
      // Dive — GameScene will switch to swim when below surface.
      this.setVelocityY(GAME_CONFIG.playerSwimSpeed);
      this.y = this.waterSurfaceY + 4;
    } else if (keys.jump) {
      this.setVelocityY(GAME_CONFIG.playerJumpVelocity * 0.55);
      getSoundManager(this.scene.game)?.play('sfx-jump', this.scene, { volume: 0.35 });
    }

    this.setAnimState(Math.abs(this.body?.velocity.x ?? 0) > 20 ? 'run' : 'idle');
    this.syncCanoeVisual();
  }

  private updateSwimMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: {
      left: boolean;
      right: boolean;
      jump: boolean;
      down?: boolean;
      moveAxis?: number;
    },
  ): void {
    const axis = keys.moveAxis ?? 0;
    const useAxis = Math.abs(axis) > 0.01;
    const left = useAxis ? axis < 0 : cursors.left?.isDown || keys.left;
    const right = useAxis ? axis > 0 : cursors.right?.isDown || keys.right;
    const up = keys.jump || cursors.up?.isDown || false;
    const down = keys.down || cursors.down?.isDown || false;
    const speed = GAME_CONFIG.playerSwimSpeed;

    if (useAxis) {
      this.setVelocityX(axis * speed);
      this.setFlipX(axis < 0);
      this.facingRight = axis > 0;
    } else if (left) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
      this.facingRight = false;
    } else if (right) {
      this.setVelocityX(speed);
      this.setFlipX(false);
      this.facingRight = true;
    } else {
      this.setVelocityX((this.body?.velocity.x ?? 0) * 0.9);
    }

    if (up && !down) {
      this.setVelocityY(-speed);
      this.setAnimState('jump');
    } else if (down && !up) {
      this.setVelocityY(speed);
      this.setAnimState('fall');
    } else {
      // Gentle sink like Mario water levels.
      const vy = this.body?.velocity.y ?? 0;
      this.setVelocityY(vy * 0.85 + 28);
      this.setAnimState(Math.abs(this.body?.velocity.x ?? 0) > 30 ? 'run' : 'idle');
    }

    // Soft ceiling at surface — pop into canoe when rising out.
    if (this.y < this.waterSurfaceY - 4 && (this.body?.velocity.y ?? 0) < 0) {
      this.y = this.waterSurfaceY - 4;
      this.setVelocityY(0);
    }

    this.syncCanoeVisual();
  }

  private syncCanoeVisual(): void {
    const show = this.aquaticMode === 'canoe';
    if (show && !this.canoeSprite) {
      if (!this.scene.textures.exists('canoe')) return;
      this.canoeSprite = this.scene.add
        .image(this.x, this.y + 8, 'canoe')
        .setDepth(WORLD_LAYERS.player - 1)
        .setOrigin(0.5, 0.5);
    }
    if (!this.canoeSprite) return;
    this.canoeSprite.setVisible(show);
    if (show) {
      this.canoeSprite.setPosition(this.x, this.y + 10);
      this.canoeSprite.setFlipX(!this.facingRight);
    }
  }

  /** Call each frame so canoe tracks the player. */
  updateCanoeFollow(): void {
    this.syncCanoeVisual();
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

  /** Soft golden halo while the Virgen blessing is active. */
  setBlessedGlow(active: boolean): void {
    this.clearBlessedGlow();
    if (!active) return;

    const liftY = -44 * GAME_CONFIG.playerDisplayScale;
    const outer = this.scene.add.ellipse(0, liftY, 104, 124, GAME_CONFIG.colors.virgenBlessingGlow, 0.28);
    const inner = this.scene.add.ellipse(0, liftY, 76, 92, 0xffffff, 0.38);
    outer.setBlendMode(Phaser.BlendModes.ADD);
    inner.setBlendMode(Phaser.BlendModes.ADD);

    this.blessingGlow = this.scene.add.container(this.x, this.y, [outer, inner]);
    this.blessingGlow.setDepth(this.depth - 1);

    this.scene.tweens.add({
      targets: [outer, inner],
      alpha: { from: 0.22, to: 0.58 },
      scaleX: { from: 0.94, to: 1.08 },
      scaleY: { from: 0.94, to: 1.08 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.blessingGlow) {
      this.blessingGlow.setPosition(this.x, this.y);
      this.blessingGlow.setDepth(this.depth - 1);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.clearBlessedGlow();
    super.destroy(fromScene);
  }

  private clearBlessedGlow(): void {
    if (!this.blessingGlow) return;
    this.blessingGlow.each((child: Phaser.GameObjects.GameObject) => {
      this.scene.tweens.killTweensOf(child);
    });
    this.blessingGlow.destroy();
    this.blessingGlow = undefined;
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
