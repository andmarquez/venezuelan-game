import Phaser from 'phaser';
import {
  END_SCREEN,
  addCtaHitZone,
  addStatsPill,
  layoutFitScreenBackground,
  scalePx,
} from '../ui/endScreenLayout';

/**
 * WinScene — full-frame Figma M04 art + dynamic stats; CTA is baked into art.
 */
export class WinScene extends Phaser.Scene {
  private score = 0;
  private kisses = 0;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data: { score?: number; kisses?: number; projects?: number }): void {
    this.score = data.score ?? 0;
    this.kisses = data.kisses ?? 0;
  }

  create(): void {
    this.buildUi();
    this.setupRestart();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    });
  }

  private buildUi = (): void => {
    this.children.removeAll(true);

    const base = END_SCREEN.win;
    const layout = layoutFitScreenBackground(
      this,
      'screen-win-screen',
      0,
      base.fitScale,
    );
    const { cx, mapY, vp } = layout;
    const px = (n: number) => scalePx(layout, n);

    this.cameras.main.setBackgroundColor('#fff5dc');

    const emitter = this.add.particles(cx, vp.y, 'particle', {
      x: { min: -vp.width / 2, max: vp.width / 2 },
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: 2000,
      frequency: 80,
      tint: [0xe91e63, 0xf48fb1, 0xffeb3b, 0xffffff, 0x3744a4],
    });
    emitter.setScrollFactor(0).setDepth(5);
    this.time.delayedCall(8000, () => emitter.stop());

    addStatsPill(
      this,
      cx,
      mapY(base.statsY),
      `Hearts: ${this.kisses}  |  Score: ${this.score}`,
      {
        statsW: px(base.statsW),
        statsH: px(base.statsH),
        statsBg: base.statsBg,
        statsTextColor: base.statsTextColor,
        statsTextSize: px(base.statsTextSize),
      },
    );

    const restart = () => this.scene.start('GameScene');
    addCtaHitZone(this, cx, mapY(base.ctaY), px(base.ctaW), px(base.ctaH), restart);
  };

  private setupRestart(): void {
    const restart = () => this.scene.start('GameScene');
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
  }
}
