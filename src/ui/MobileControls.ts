import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { VirtualJoystick } from './VirtualJoystick';

export type TouchInput = {
  /** Horizontal stick axis −1 (left) to 1 (right) */
  moveAxis: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  kiss: boolean;
  boost: boolean;
};

type AbilityId = 'jump' | 'kiss' | 'boost';

type AbilityButton = {
  id: AbilityId;
  btn: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  radius: number;
};

/**
 * MobileControls — Wild Rift–style layout:
 * - Left: virtual joystick for movement
 * - Right: primary action + ability arc (jump, boost, kiss)
 */
export class MobileControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private joystick: VirtualJoystick;
  private abilities: AbilityButton[] = [];
  private abilityPointers = new Map<number, AbilityId>();
  private jumpPressPending = false;
  private kissPressPending = false;

  input: TouchInput = {
    moveAxis: 0,
    left: false,
    right: false,
    jump: false,
    kiss: false,
    boost: false,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.joystick = new VirtualJoystick(scene, this.container);
    this.createAbilityCluster();
    this.setupPointerHandlers();

    scene.scale.on('resize', this.layout, this);
    this.layout();
  }

  private createAbilityCluster(): void {
    const defs: { id: AbilityId; label: string; radius: number; primary?: boolean }[] = [
      { id: 'jump', label: '▲\n×2', radius: GAME_CONFIG.mobileWildRift.attackRadius, primary: true },
      { id: 'boost', label: '✦', radius: GAME_CONFIG.mobileWildRift.abilityRadius },
      { id: 'kiss', label: '♥', radius: GAME_CONFIG.mobileWildRift.abilityRadius - 2 },
    ];

    defs.forEach((def) => {
      const fill = def.primary ? 0x1a2332 : 0x121820;
      const alpha = def.primary ? 0.72 : 0.62;
      const stroke = def.primary ? 0xf5f0e1 : 0xc9a96e;

      const btn = this.scene.add.circle(0, 0, def.radius, fill, alpha);
      btn.setStrokeStyle(def.primary ? 3 : 2, stroke, def.primary ? 0.95 : 0.75);

      const label = this.scene.add.text(0, 0, def.label, {
        fontSize: def.primary ? '22px' : '24px',
        color: def.primary ? '#ffffff' : '#f8bbd0',
        fontFamily: 'Nunito, sans-serif',
        align: 'center',
        lineSpacing: def.primary ? -4 : 0,
        fontStyle: def.primary ? 'bold' : 'normal',
      }).setOrigin(0.5);

      this.container.add([btn, label]);
      this.abilities.push({ id: def.id, btn, label, radius: def.radius });
    });
  }

  private layout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const pad = GAME_CONFIG.safePadding;
    const lift = Math.max(GAME_CONFIG.mobileControlsLift, h * 0.16);
    const cfg = GAME_CONFIG.mobileWildRift;

    this.joystick.layout(w, h);

    // Primary "attack" button — bottom-right (Wild Rift basic attack position)
    const attackX = w - pad - cfg.attackInsetX;
    const attackY = h - lift - cfg.attackInsetY;
    const jump = this.abilities.find((a) => a.id === 'jump')!;
    jump.btn.setPosition(attackX, attackY);
    jump.label.setPosition(attackX, attackY);

    // Ability arc fanning up-left from the attack button
    const arc = cfg.abilityArc;
    const arcButtons = this.abilities.filter((a) => a.id !== 'jump');
    arcButtons.forEach((ability, i) => {
      const slot = arc[i];
      const rad = Phaser.Math.DegToRad(slot.angleDeg);
      const x = attackX + Math.cos(rad) * slot.distance;
      const y = attackY + Math.sin(rad) * slot.distance;
      ability.btn.setPosition(x, y);
      ability.label.setPosition(x, y);
    });
  }

  private setupPointerHandlers(): void {
    this.scene.input.addPointer(3);

    const hitAbility = (x: number, y: number): AbilityButton | null => {
      // Test smallest buttons first so arc abilities win over jump when overlapping
      const sorted = [...this.abilities].sort((a, b) => a.radius - b.radius);
      for (const ability of sorted) {
        const dist = Phaser.Math.Distance.Between(x, y, ability.btn.x, ability.btn.y);
        if (dist <= ability.radius + 6) return ability;
      }
      return null;
    };

    const press = (pointer: Phaser.Input.Pointer) => {
      if (this.joystick.tryActivate(pointer)) {
        this.refreshInput();
        return;
      }

      const ability = hitAbility(pointer.x, pointer.y);
      if (!ability) return;

      this.abilityPointers.set(pointer.id, ability.id);
      if (ability.id === 'jump') this.jumpPressPending = true;
      if (ability.id === 'kiss') this.kissPressPending = true;
      this.highlightAbility(ability.id, true);
      this.refreshInput();
    };

    const move = (pointer: Phaser.Input.Pointer) => {
      this.joystick.updatePointer(pointer);
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
    ability.btn.setAlpha(pressed ? 0.92 : id === 'jump' ? 0.72 : 0.62);
    ability.btn.setScale(pressed ? 0.93 : 1);
    ability.label.setScale(pressed ? 0.93 : 1);
  }

  private refreshInput(): void {
    const axis = this.joystick.getAxisX();
    const deadzone = GAME_CONFIG.mobileWildRift.joystick.deadzone;

    this.input.moveAxis = Math.abs(axis) > deadzone ? axis : 0;
    this.input.left = this.input.moveAxis < -deadzone;
    this.input.right = this.input.moveAxis > deadzone;
    this.input.jump = false;
    this.input.kiss = false;
    this.input.boost = false;

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
    this.scene.scale.off('resize', this.layout, this);
    this.container.destroy();
  }
}
