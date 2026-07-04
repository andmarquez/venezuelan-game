import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { getUiViewport, pointerToUiSpace } from './viewportLayout';
import { getMobileLayoutInsets } from './scaleMode';
import { VirtualJoystick } from './VirtualJoystick';
import { onViewportChange } from './viewportMetrics';

export type TouchInput = {
  moveAxis: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  kiss: boolean;
};

type AbilityId = 'jump' | 'kiss';

type AbilityButton = {
  id: AbilityId;
  btn: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Graphics;
  radius: number;
};

const UI_DEPTH = 10000;

/**
 * MobileControls — Wild Rift–style layout anchored to Figma M02 gameplay zones.
 */
export class MobileControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private joystick: VirtualJoystick;
  private abilities: AbilityButton[] = [];
  private abilityPointers = new Map<number, AbilityId>();
  private jumpPressPending = false;
  private kissPressPending = false;
  private controlScale = 1;
  private offViewportChange?: () => void;

  input: TouchInput = {
    moveAxis: 0,
    left: false,
    right: false,
    jump: false,
    kiss: false,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scene.input.setTopOnly(false);
    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH);

    this.joystick = new VirtualJoystick(scene, this.container);
    this.createAbilityCluster();
    this.setupPointerHandlers();

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.offViewportChange = onViewportChange(() => this.layout());
    this.layout();
  }

  private createAbilityCluster(): void {
    const defs: { id: AbilityId; radius: number; primary?: boolean }[] = [
      { id: 'jump', radius: GAME_CONFIG.mobileWildRift.attackRadius, primary: true },
      { id: 'kiss', radius: GAME_CONFIG.mobileWildRift.abilityRadius },
    ];

    defs.forEach((def) => {
      const fill = def.primary ? 0x1a2332 : 0x2a1520;
      const alpha = def.primary ? 0.78 : 0.72;
      const stroke = def.primary ? 0xf5f0e1 : 0xf48fb1;

      const btn = this.scene.add.circle(0, 0, def.radius, fill, alpha);
      btn.setStrokeStyle(def.primary ? 3 : 2, stroke, def.primary ? 0.95 : 0.85);
      btn.setScrollFactor(0);

      const icon = this.scene.add.graphics();
      icon.setScrollFactor(0);
      if (def.id === 'jump') {
        this.drawJumpIcon(icon, def.radius);
      } else {
        this.drawHeartIcon(icon, def.radius);
      }

      this.container.add([btn, icon]);
      this.abilities.push({ id: def.id, btn, icon, radius: def.radius });
    });
  }

  private drawJumpIcon(g: Phaser.GameObjects.Graphics, radius: number): void {
    const s = radius * 0.38;
    g.fillStyle(0xffffff, 0.95);
    g.fillTriangle(0, -s, -s * 0.85, s * 0.55, s * 0.85, s * 0.55);
  }

  private drawHeartIcon(g: Phaser.GameObjects.Graphics, radius: number): void {
    const s = radius * 0.22;
    g.fillStyle(0xf48fb1, 1);
    g.fillCircle(-s, -s * 0.35, s);
    g.fillCircle(s, -s * 0.35, s);
    g.fillTriangle(-s * 2, -s * 0.1, s * 2, -s * 0.1, 0, s * 2.2);
  }

  private layout(): void {
    const vp = getUiViewport(this.scene.scale);
    const layout = getMobileLayoutInsets();
    const scale = layout.controlScale;
    this.controlScale = scale;

    this.joystick.layout(vp, layout);

    const jumpX = vp.x + vp.width * layout.jumpXRatio;
    const jumpY = vp.y + vp.height * layout.jumpYRatio;
    const kissX = vp.x + vp.width * layout.kissXRatio;
    const kissY = vp.y + vp.height * layout.kissYRatio;

    const jump = this.abilities.find((a) => a.id === 'jump')!;
    jump.btn.setPosition(jumpX, jumpY);
    jump.btn.setScale(scale);
    jump.icon.setPosition(jumpX, jumpY);
    jump.icon.setScale(scale);

    const kiss = this.abilities.find((a) => a.id === 'kiss')!;
    kiss.btn.setPosition(kissX, kissY);
    kiss.btn.setScale(scale);
    kiss.icon.setPosition(kissX, kissY);
    kiss.icon.setScale(scale);
  }

  private setupPointerHandlers(): void {
    this.scene.input.addPointer(3);
    const camera = this.scene.cameras.main;

    const hitAbility = (x: number, y: number): AbilityButton | null => {
      const sorted = [...this.abilities].sort((a, b) => a.radius - b.radius);
      for (const ability of sorted) {
        const dist = Phaser.Math.Distance.Between(x, y, ability.btn.x, ability.btn.y);
        if (dist <= (ability.radius + 16) * this.controlScale) return ability;
      }
      return null;
    };

    const press = (pointer: Phaser.Input.Pointer) => {
      const ui = pointerToUiSpace(pointer, camera);

      if (this.joystick.tryActivate(ui.x, ui.y, pointer)) {
        this.refreshInput();
        return;
      }

      const ability = hitAbility(ui.x, ui.y);
      if (!ability) return;

      this.abilityPointers.set(pointer.id, ability.id);
      if (ability.id === 'jump') this.jumpPressPending = true;
      if (ability.id === 'kiss') this.kissPressPending = true;
      this.highlightAbility(ability.id, true);
      this.refreshInput();
    };

    const move = (pointer: Phaser.Input.Pointer) => {
      const ui = pointerToUiSpace(pointer, camera);
      this.joystick.updatePointer(ui.x, ui.y, pointer);
      this.refreshInput();
    };

    const release = (pointer: Phaser.Input.Pointer) => {
      this.joystick.releasePointer(pointer);
      const abilityId = this.abilityPointers.get(pointer.id);
      if (abilityId) {
        this.abilityPointers.delete(pointer.id);
        this.highlightAbility(abilityId, false);
      }
      this.refreshInput();
    };

    this.scene.input.on('pointerdown', press);
    this.scene.input.on('pointermove', move);
    this.scene.input.on('pointerup', release);
    this.scene.input.on('pointerupoutside', release);
    this.scene.input.on('pointercancel', release);
  }

  /** Called each frame — clears ghost touches after iOS drops pointerup. */
  update(): void {
    this.joystick.releaseStalePointer();
    for (const [pointerId] of [...this.abilityPointers]) {
      const active = this.scene.input.manager.pointers.some(
        (p) => p.id === pointerId && p.isDown,
      );
      if (!active) {
        const abilityId = this.abilityPointers.get(pointerId);
        if (abilityId) this.highlightAbility(abilityId, false);
        this.abilityPointers.delete(pointerId);
      }
    }
    this.refreshInput();
  }

  private highlightAbility(id: AbilityId, pressed: boolean): void {
    const ability = this.abilities.find((a) => a.id === id);
    if (!ability) return;
    ability.btn.setAlpha(pressed ? 0.95 : id === 'jump' ? 0.78 : 0.72);
    ability.btn.setScale(pressed ? 0.93 : 1);
    ability.icon.setScale(pressed ? 0.93 : 1);
  }

  private refreshInput(): void {
    const axis = this.joystick.getAxisX();
    const deadzone = GAME_CONFIG.mobileWildRift.joystick.deadzone;

    this.input.moveAxis = Math.abs(axis) > deadzone ? axis : 0;
    this.input.left = this.input.moveAxis < -deadzone;
    this.input.right = this.input.moveAxis > deadzone;
    this.input.jump = false;
    this.input.kiss = false;

    for (const id of this.abilityPointers.values()) {
      this.input[id] = true;
    }
  }

  consumeJumpPress(): boolean {
    if (!this.jumpPressPending) return false;
    this.jumpPressPending = false;
    return true;
  }

  consumeKissPress(): boolean {
    if (!this.kissPressPending) return false;
    this.kissPressPending = false;
    return true;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.offViewportChange?.();
    this.container.destroy();
  }
}
