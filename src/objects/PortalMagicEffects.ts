import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { WORLD_LAYERS } from '../world/layerConfig';

const PORTAL_COLORS = {
  core: GAME_CONFIG.colors.portal,
  glow: GAME_CONFIG.colors.portalGlow,
  bright: 0xffffff,
  accent: 0xff80ff,
};

type PortalMagicOptions = {
  x: number;
  y: number;
  size?: number;
};

/**
 * Layered magic light FX around the level-end portal (Figma portal_goal).
 */
export class PortalMagicEffects {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly size: number;
  private readonly emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private bloom?: Phaser.GameObjects.Arc;
  private ring?: Phaser.GameObjects.Arc;
  private rays?: Phaser.GameObjects.Graphics;
  private raySpin?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, options: PortalMagicOptions) {
    this.scene = scene;
    const { x, y } = options;
    this.size = options.size ?? GAME_CONFIG.portalDisplaySize;
    const depth = WORLD_LAYERS.collectibles;

    this.root = scene.add.container(x, y).setDepth(depth - 1);

    this.bloom = scene.add
      .circle(0, 0, this.size * 0.72, PORTAL_COLORS.glow, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.bloom);

    this.rays = scene.add.graphics();
    this.drawRays(this.rays, this.size * 0.95);
    this.rays.setAlpha(0.35);
    this.rays.setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.rays);

    this.ring = scene.add
      .circle(0, 0, this.size * 0.58, PORTAL_COLORS.accent, 0)
      .setStrokeStyle(3, PORTAL_COLORS.bright, 0.45)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add(this.ring);

    const orbitZone = new Phaser.GameObjects.Particles.Zones.EdgeZone(
      new Phaser.Geom.Circle(0, 0, this.size * 0.52),
      1,
    );
    const orbit = scene.add.particles(0, 0, 'particle', {
      speed: 0,
      lifespan: 1400,
      quantity: 1,
      frequency: 90,
      scale: { start: 0.55, end: 0.05 },
      alpha: { start: 0.9, end: 0 },
      tint: [PORTAL_COLORS.core, PORTAL_COLORS.glow, PORTAL_COLORS.bright],
      blendMode: 'ADD',
      emitZone: orbitZone,
    });
    this.root.add(orbit);
    this.emitters.push(orbit);

    const motes = scene.add.particles(0, 0, 'particle', {
      speed: { min: 12, max: 36 },
      angle: { min: 235, max: 305 },
      lifespan: { min: 700, max: 1200 },
      quantity: 1,
      frequency: 55,
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.85, end: 0 },
      tint: [PORTAL_COLORS.glow, PORTAL_COLORS.bright, PORTAL_COLORS.accent],
      blendMode: 'ADD',
    });
    this.root.add(motes);
    this.emitters.push(motes);

    const sparks = scene.add.particles(0, 0, 'particle', {
      speed: { min: 20, max: 55 },
      lifespan: 500,
      quantity: 1,
      frequency: 160,
      scale: { start: 0.35, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [PORTAL_COLORS.bright, PORTAL_COLORS.glow],
      blendMode: 'ADD',
      emitting: false,
    });
    this.root.add(sparks);
    this.emitters.push(sparks);

    this.timers.push(
      scene.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => sparks.explode(Phaser.Math.Between(2, 4)),
      }),
    );

    this.sprite = scene.physics.add.sprite(x, y, 'portal');
    this.sprite.setImmovable(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.sprite.setDepth(depth);
    this.sprite.setDisplaySize(this.size, this.size);
    this.sprite.setAlpha(0.72);

    this.tweens.push(
      scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.62, to: 0.95 },
        scaleX: { from: 0.96, to: 1.06 },
        scaleY: { from: 0.96, to: 1.06 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );

    this.tweens.push(
      scene.tweens.add({
        targets: this.bloom,
        alpha: { from: 0.14, to: 0.38 },
        scale: { from: 0.92, to: 1.18 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );

    this.tweens.push(
      scene.tweens.add({
        targets: this.ring,
        scale: { from: 0.9, to: 1.12 },
        alpha: { from: 0.35, to: 0.75 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeOut',
      }),
    );

    this.raySpin = scene.tweens.add({
      targets: this.rays,
      angle: 360,
      duration: 12000,
      repeat: -1,
      ease: 'Linear',
    });
    this.tweens.push(this.raySpin);

    this.timers.push(
      scene.time.addEvent({
        delay: 1200,
        loop: true,
        callback: () => this.pulseRing(),
      }),
    );
  }

  celebrate(): void {
    this.emitters.forEach((emitter) => {
      if (typeof emitter.frequency === 'number' && emitter.frequency > 0) {
        emitter.setFrequency(Math.max(25, emitter.frequency * 0.55));
      }
    });

    this.tweens.push(
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 420,
        yoyo: true,
        repeat: 3,
        ease: 'Back.easeOut',
      }),
    );

    if (this.bloom) {
      this.tweens.push(
        this.scene.tweens.add({
          targets: this.bloom,
          alpha: 0.55,
          scale: 1.35,
          duration: 500,
          yoyo: true,
          repeat: 2,
        }),
      );
    }

    if (this.raySpin) {
      this.raySpin.timeScale = 2.4;
      this.scene.time.delayedCall(2400, () => {
        if (this.raySpin?.isPlaying()) this.raySpin.timeScale = 1;
      });
    }
  }

  destroy(): void {
    this.timers.forEach((timer) => timer.destroy());
    this.tweens.forEach((tween) => tween.destroy());
    this.emitters.forEach((emitter) => emitter.destroy());
    this.root.destroy(true);
    this.sprite.destroy();
  }

  private pulseRing(): void {
    const pulse = this.scene.add
      .circle(this.sprite.x, this.sprite.y, this.size * 0.5, PORTAL_COLORS.glow, 0)
      .setStrokeStyle(2, PORTAL_COLORS.bright, 0.65)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(WORLD_LAYERS.collectibles - 1);

    this.tweens.push(
      this.scene.tweens.add({
        targets: pulse,
        scale: 1.65,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => pulse.destroy(),
      }),
    );
  }

  private drawRays(graphics: Phaser.GameObjects.Graphics, radius: number): void {
    graphics.clear();
    const rayCount = 10;
    for (let i = 0; i < rayCount; i += 1) {
      const angle = (i / rayCount) * Math.PI * 2;
      const x1 = Math.cos(angle) * radius * 0.2;
      const y1 = Math.sin(angle) * radius * 0.2;
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;
      graphics.lineStyle(3, PORTAL_COLORS.bright, 0.25);
      graphics.lineBetween(x1, y1, x2, y2);
      graphics.fillStyle(PORTAL_COLORS.glow, 0.18);
      graphics.fillCircle(x2, y2, 4);
    }
  }
}
