import Phaser from 'phaser';
import {
  END_SCREEN,
  addCtaButton,
  addEndScreenBackground,
  addStatsPill,
  bindRestartInput,
  fitImageToSize,
  getScreenLayout,
  scalePx,
} from '../ui/endScreenLayout';

export type GameOverReason = 'time' | 'lives' | 'fall';

const REASON_COPY: Record<GameOverReason, string> = {
  time: 'The deadline ran out!',
  lives: 'Too many deadline bugs got you!',
  fall: 'Andsiosa fell off the creative world!',
};

/**
 * GameOverScene — Figma M03 layout with dynamic stats + reason.
 */
export class GameOverScene extends Phaser.Scene {
  private reason: GameOverReason = 'lives';
  private score = 0;
  private kisses = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { reason?: GameOverReason; score?: number; kisses?: number }): void {
    this.reason = data.reason ?? 'lives';
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
    const base = END_SCREEN.gameOver;
    const layout = getScreenLayout(this);
    const { cx, mapY } = layout;
    const px = (n: number) => scalePx(layout, n);

    this.cameras.main.setBackgroundColor('#fce4ec');
    addEndScreenBackground(this, base.bg);

    this.add
      .text(cx, mapY(base.reasonY), REASON_COPY[this.reason], {
        fontSize: `${px(base.reasonSize)}px`,
        fontFamily: 'Inter, Nunito, system-ui, sans-serif',
        color: base.reasonColor,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    const title = this.add
      .image(cx, mapY(base.titleY), 'screen-game-over-title')
      .setScrollFactor(0)
      .setDepth(11);
    fitImageToSize(title, px(base.titleMaxW), px(338));

    addStatsPill(
      this,
      cx,
      mapY(base.statsY),
      `Kisses: ${this.kisses}  |  Score: ${this.score}`,
      {
        statsW: px(base.statsW),
        statsH: px(base.statsH),
        statsColor: base.statsColor,
        statsTextSize: px(base.statsTextSize),
      },
    );

    const character = this.add
      .image(cx, mapY(base.characterY), 'screen-game-over-character')
      .setScrollFactor(0)
      .setDepth(12);
    fitImageToSize(character, px(base.characterW), px(base.characterH));

    const ctaY = mapY(base.ctaY);
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
