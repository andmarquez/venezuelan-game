import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { safeAreaInsetsInGame } from './safeAreaUtils';
import { getUiViewport, pointerToUiSpace } from './viewportLayout';
import { getMobileLayoutInsets } from './scaleMode';
import { VirtualJoystick } from './VirtualJoystick';

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

/**
 * MobileControls — Wild Rift–style layout:
 * - Left: virtual joystick for movement
 * - Right: jump (primary) + heart power (kiss blow)
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

  input: TouchInput = {
    moveAxis: 0,
    left: false,
    right: false,
    jump: false,
    kiss: false,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.joystick = new VirtualJoystick(scene, this.container);
    this.createAbilityCluster();
    this.setupPointerHandlers();

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
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

      const icon = this.scene.add.graphics();
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
    const safe = safeAreaInsetsInGame(this.scene.scale);
    const pad = GAME_CONFIG.safePadding;
    const layout = getMobileLayoutInsets();
    const cfg = GAME_CONFIG.mobileWildRift;
    const scale = layout.controlScale;
    this.controlScale = scale;

    this.joystick.layout(vp, safe.bottom, layout);

    const attackX = vp.x + vp.width - pad - safe.right - layout.attackInsetX;
    const attackY = vp.y + vp.height - safe.bottom - layout.controlsLift - layout.attackInsetY;
    const jump = this.abilities.find((a) => a.id === 'jump')!;
    jump.btn.setPosition(attackX, attackY);
    jump.btn.setScale(scale);
    jump.icon.setPosition(attackX, attackY);
    jump.icon.setScale(scale);

    const arcButtons = this.abilities.filter((a) => a.id !== 'jump');
    arcButtons.forEach((ability, i) => {
      const slot = cfg.abilityArc[i];
      const rad = Phaser.Math.DegToRad(slot.angleDeg);
      const x = attackX + Math.cos(rad) * slot.distance * scale;
      const y = attackY + Math.sin(rad) * slot.distance * scale;
      ability.btn.setPosition(x, y);
      ability.btn.setScale(scale);
      ability.icon.setPosition(x, y);
      ability.icon.setScale(scale);
    });
  }

  private setupPointerHandlers(): void {
    this.scene.input.addPointer(3);
    const camera = this.scene.cameras.main;

    const hitAbility = (x: number, y: number): AbilityButton | null => {
      const sorted = [...this.abilities].sort((a, b) => a.radius - b.radius);
      for (const ability of sorted) {
        const dist = Phaser.Math.Distance.Between(x, y, ability.btn.x, ability.btn.y);
        if (dist <= (ability.radius + 6) * this.controlScale) return ability;
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
    this.container.destroy();
  }
}
