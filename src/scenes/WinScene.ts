import Phaser from 'phaser';
import {
  END_SCREEN,
  addCtaButton,
  addStatsPill,
  addWinGradientBackground,
  bindRestartInput,
  fitImageToSize,
  layoutCenterX,
} from '../ui/endScreenLayout';
import { getUiViewport } from '../ui/viewportLayout';

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
    const cfg = END_SCREEN.win;
    const vp = getUiViewport(this.scale);
    const cx = layoutCenterX(vp);

    addWinGradientBackground(this);

    const w = vp.width;
    const emitter = this.add.particles(cx, vp.y, 'particle', {
      x: { min: -w / 2, max: w / 2 },
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: 2000,
      frequency: 80,
      tint: [0xe91e63, 0xf48fb1, 0xffeb3b, 0xffffff, 0x3744a4],
    });
    emitter.setScrollFactor(0).setDepth(5);
    this.time.delayedCall(8000, () => emitter.stop());

    const title = this.add.image(cx, cfg.titleY, 'screen-win-title').setScrollFactor(0).setDepth(10);
    fitImageToSize(title, cfg.titleMaxW, 338);

    const character = this.add
      .image(cx + cfg.characterXOffset, cfg.characterY, 'screen-win-character')
      .setScrollFactor(0)
      .setDepth(12);
    fitImageToSize(character, cfg.characterW, cfg.characterH);

    addStatsPill(
      this,
      cx,
      cfg.statsY,
      `Hearts: ${this.kisses}  |  Score: ${this.score}`,
      cfg,
    );

    const restart = () => this.scene.start('GameScene');
    addCtaButton(this, cx, cfg.ctaY, cfg.ctaLabel, cfg, restart);
    bindRestartInput(this, restart, cfg.ctaY);
  };
}
