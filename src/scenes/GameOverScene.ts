import Phaser from 'phaser';
import {
  END_SCREEN,
  addCtaButton,
  addEndScreenBackground,
  addStatsPill,
  bindRestartInput,
  fitImageToSize,
  layoutCenterX,
} from '../ui/endScreenLayout';
import { getUiViewport } from '../ui/viewportLayout';

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
    const cfg = END_SCREEN.gameOver;
    const vp = getUiViewport(this.scale);
    const cx = layoutCenterX(vp);

    addEndScreenBackground(this, cfg.bg);

    this.add
      .text(cx, cfg.reasonY, REASON_COPY[this.reason], {
        fontSize: `${cfg.reasonSize}px`,
        fontFamily: 'Inter, Nunito, system-ui, sans-serif',
        color: cfg.reasonColor,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);

    const title = this.add.image(cx, cfg.titleY, 'screen-game-over-title').setScrollFactor(0).setDepth(11);
    fitImageToSize(title, cfg.titleMaxW, 338);

    addStatsPill(
      this,
      cx,
      cfg.statsY,
      `Kisses: ${this.kisses}  |  Score: ${this.score}`,
      cfg,
    );

    const character = this.add
      .image(cx, cfg.characterY, 'screen-game-over-character')
      .setScrollFactor(0)
      .setDepth(12);
    fitImageToSize(character, cfg.characterW, cfg.characterH);

    const restart = () => this.scene.start('GameScene');
    addCtaButton(this, cx, cfg.ctaY, cfg.ctaLabel, cfg, restart);
    bindRestartInput(this, restart, cfg.ctaY);
  };
}
