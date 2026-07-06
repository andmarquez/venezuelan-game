import Phaser from 'phaser';
import {
  END_SCREEN,
  addCtaButton,
  addStatsPill,
  addWinGradientBackground,
  bindRestartInput,
  fitImageToSize,
  getScreenLayout,
  scalePx,
} from '../ui/endScreenLayout';

/**
 * WinScene — Figma M04 layout with confetti + dynamic stats.
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
    this.scale.on(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    });
  }

  private buildUi = (): void => {
    this.children.removeAll(true);
    const base = END_SCREEN.win;
    const layout = getScreenLayout(this);
    const { cx, mapY, mapX } = layout;
    const px = (n: number) => scalePx(layout, n);

    this.cameras.main.setBackgroundColor('#fff5dc');
    addWinGradientBackground(this);

    const emitter = this.add.particles(cx, layout.vp.y, 'particle', {
      x: { min: -layout.vp.width / 2, max: layout.vp.width / 2 },
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: 2000,
      frequency: 80,
      tint: [0xe91e63, 0xf48fb1, 0xffeb3b, 0xffffff, 0x3744a4],
    });
    emitter.setScrollFactor(0).setDepth(5);
    this.time.delayedCall(8000, () => emitter.stop());

    const title = this.add
      .image(cx, mapY(base.titleY), 'screen-win-title')
      .setScrollFactor(0)
      .setDepth(10);
    fitImageToSize(title, px(base.titleMaxW), px(338));

    const character = this.add
      .image(mapX(END_SCREEN.designW / 2 + base.characterXOffset), mapY(base.characterY), 'screen-win-character')
      .setScrollFactor(0)
      .setDepth(12);
    fitImageToSize(character, px(base.characterW), px(base.characterH));

    const ctaY = mapY(base.ctaY);
    addStatsPill(
      this,
      cx,
      mapY(base.statsY),
      `Hearts: ${this.kisses}  |  Score: ${this.score}`,
      {
        statsW: px(base.statsW),
        statsH: px(base.statsH),
        statsColor: base.statsColor,
        statsTextSize: px(base.statsTextSize),
      },
    );

    const restart = () => this.scene.start('GameScene');
    addCtaButton(this, cx, ctaY, base.ctaLabel, {
      ctaW: px(base.ctaW),
      ctaH: px(base.ctaH),
      ctaColor: base.ctaColor,
      ctaHover: base.ctaHover,
      ctaTextSize: px(base.ctaTextSize),
    }, restart);
    bindRestartInput(this, restart, ctaY);
  };
}
