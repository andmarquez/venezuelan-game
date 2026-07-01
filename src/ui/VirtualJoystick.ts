import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * Wild Rift–style virtual joystick for movement (left thumb).
 * Drag anywhere in the base ring to steer Andsiosa left/right.
 */
export class VirtualJoystick {
  private container: Phaser.GameObjects.Container;
  private base!: Phaser.GameObjects.Arc;
  private thumb!: Phaser.GameObjects.Arc;
  private baseRing!: Phaser.GameObjects.Arc;

  private centerX = 0;
  private centerY = 0;
  private pointerId: number | null = null;
  private axisX = 0;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.container = scene.add.container(0, 0);
    parent.add(this.container);

    const { baseRadius, thumbRadius } = GAME_CONFIG.mobileWildRift.joystick;

    // Outer faint ring (Wild Rift move area hint)
    this.baseRing = scene.add.circle(0, 0, baseRadius + 10, 0x000000, 0.12);
    this.baseRing.setStrokeStyle(2, 0xc9a96e, 0.35);

    this.base = scene.add.circle(0, 0, baseRadius, 0x0d1117, 0.42);
    this.base.setStrokeStyle(3, 0xc9a96e, 0.55);

    this.thumb = scene.add.circle(0, 0, thumbRadius, 0x1a2332, 0.75);
    this.thumb.setStrokeStyle(2, 0xf5f0e1, 0.85);

    const grip = scene.add.text(0, 0, '✥', {
      fontSize: '22px',
      color: '#e8dcc8',
      fontFamily: 'Nunito, sans-serif',
    }).setOrigin(0.5);

    this.container.add([this.baseRing, this.base, this.thumb, grip]);
    (this.thumb as Phaser.GameObjects.Arc & { grip?: Phaser.GameObjects.Text }).grip = grip;
  }

  layout(screenW: number, screenH: number): void {
    const cfg = GAME_CONFIG.mobileWildRift.joystick;
    const pad = GAME_CONFIG.safePadding;
    const lift = Math.max(GAME_CONFIG.mobileControlsLift, screenH * 0.16);

    this.centerX = screenW * cfg.xRatio + pad;
    this.centerY = screenH - lift - cfg.bottomInset;

    this.baseRing.setPosition(this.centerX, this.centerY);
    this.base.setPosition(this.centerX, this.centerY);
    this.resetThumb();

    const grip = (this.thumb as Phaser.GameObjects.Arc & { grip?: Phaser.GameObjects.Text }).grip;
    grip?.setPosition(this.thumb.x, this.thumb.y);
  }

  tryActivate(pointer: Phaser.Input.Pointer): boolean {
    if (this.pointerId !== null) return false;
    const cfg = GAME_CONFIG.mobileWildRift.joystick;
    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.centerX, this.centerY);
    if (dist > cfg.baseRadius + 28) return false;

    this.pointerId = pointer.id;
    this.updateThumb(pointer.x, pointer.y);
    this.highlight(true);
    return true;
  }

  updatePointer(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.updateThumb(pointer.x, pointer.y);
  }

  releasePointer(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.axisX = 0;
    this.resetThumb();
    this.highlight(false);
  }

  getAxisX(): number {
    return this.axisX;
  }

  isActive(): boolean {
    return this.pointerId !== null;
  }

  private updateThumb(x: number, y: number): void {
    const cfg = GAME_CONFIG.mobileWildRift.joystick;
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDrag = cfg.maxDrag;
    const clamped = Math.min(dist, maxDrag);
    const angle = Math.atan2(dy, dx);

    const thumbX = this.centerX + Math.cos(angle) * clamped;
    const thumbY = this.centerY + Math.sin(angle) * clamped;
    this.thumb.setPosition(thumbX, thumbY);

    const grip = (this.thumb as Phaser.GameObjects.Arc & { grip?: Phaser.GameObjects.Text }).grip;
    grip?.setPosition(thumbX, thumbY);

    this.axisX = Phaser.Math.Clamp(dx / maxDrag, -1, 1);
  }

  private resetThumb(): void {
    this.thumb.setPosition(this.centerX, this.centerY);
    const grip = (this.thumb as Phaser.GameObjects.Arc & { grip?: Phaser.GameObjects.Text }).grip;
    grip?.setPosition(this.centerX, this.centerY);
  }

  private highlight(active: boolean): void {
    this.base.setAlpha(active ? 0.58 : 0.42);
    this.thumb.setScale(active ? 1.05 : 1);
  }
}
