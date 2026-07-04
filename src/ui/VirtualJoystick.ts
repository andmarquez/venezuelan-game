import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { type MobileLayoutInsets } from './scaleMode';
import { type UiViewport } from './viewportLayout';

/**
 * Wild Rift–style virtual joystick for movement (left thumb).
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private base!: Phaser.GameObjects.Arc;
  private thumb!: Phaser.GameObjects.Arc;
  private baseRing!: Phaser.GameObjects.Arc;

  private centerX = 0;
  private centerY = 0;
  private pointerId: number | null = null;
  private axisX = 0;
  private hitScale = 1;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    parent.add(this.container);

    const { baseRadius, thumbRadius } = GAME_CONFIG.mobileWildRift.joystick;

    this.baseRing = scene.add.circle(0, 0, baseRadius + 10, 0x000000, 0.12);
    this.baseRing.setStrokeStyle(2, 0xc9a96e, 0.35);
    this.baseRing.setScrollFactor(0);

    this.base = scene.add.circle(0, 0, baseRadius, 0x0d1117, 0.42);
    this.base.setStrokeStyle(3, 0xc9a96e, 0.55);
    this.base.setScrollFactor(0);

    this.thumb = scene.add.circle(0, 0, thumbRadius, 0x1a2332, 0.75);
    this.thumb.setStrokeStyle(2, 0xf5f0e1, 0.85);
    this.thumb.setScrollFactor(0);

    this.container.add([this.baseRing, this.base, this.thumb]);
  }

  layout(viewport: UiViewport, insets: MobileLayoutInsets): void {
    const scale = insets.controlScale;
    this.hitScale = scale;

    this.centerX = viewport.x + viewport.width * insets.joystickXRatio;
    this.centerY = viewport.y + viewport.height * insets.joystickYRatio;

    this.baseRing.setPosition(this.centerX, this.centerY);
    this.base.setPosition(this.centerX, this.centerY);
    this.baseRing.setScale(scale);
    this.base.setScale(scale);
    this.thumb.setScale(scale);
    this.resetThumb();
  }

  tryActivate(uiX: number, uiY: number, pointer: Phaser.Input.Pointer): boolean {
    this.releaseStalePointer();

    if (this.pointerId !== null) return false;

    const cfg = GAME_CONFIG.mobileWildRift.joystick;
    const dist = Phaser.Math.Distance.Between(uiX, uiY, this.centerX, this.centerY);
    if (dist > (cfg.baseRadius + 40) * this.hitScale) return false;

    this.pointerId = pointer.id;
    this.updateThumb(uiX, uiY);
    this.highlight(true);
    return true;
  }

  updatePointer(uiX: number, uiY: number, pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.updateThumb(uiX, uiY);
  }

  releasePointer(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.clearPointer();
  }

  /** Recover when Safari drops pointerup while the camera scrolls. */
  releaseStalePointer(): void {
    if (this.pointerId === null) return;
    const active = this.scene.input.manager.pointers.some(
      (p) => p.id === this.pointerId && p.isDown,
    );
    if (!active) this.clearPointer();
  }

  getAxisX(): number {
    return this.axisX;
  }

  private clearPointer(): void {
    this.pointerId = null;
    this.axisX = 0;
    this.resetThumb();
    this.highlight(false);
  }

  private updateThumb(x: number, y: number): void {
    const cfg = GAME_CONFIG.mobileWildRift.joystick;
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDrag = cfg.maxDrag * this.hitScale;
    const clamped = Math.min(dist, maxDrag);
    const angle = Math.atan2(dy, dx);

    const thumbX = this.centerX + Math.cos(angle) * clamped;
    const thumbY = this.centerY + Math.sin(angle) * clamped;
    this.thumb.setPosition(thumbX, thumbY);

    this.axisX = Phaser.Math.Clamp(dx / maxDrag, -1, 1);
  }

  private resetThumb(): void {
    this.thumb.setPosition(this.centerX, this.centerY);
  }

  private highlight(active: boolean): void {
    this.base.setAlpha(active ? 0.58 : 0.42);
    this.thumb.setScale(active ? 1.05 * this.hitScale : this.hitScale);
  }
}
