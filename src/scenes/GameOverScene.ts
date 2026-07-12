import Phaser from 'phaser';
import { getSoundManager } from '../audio/SoundManager';
import {
  GAME_OVER_LOTTIE_CACHE_KEY,
  getCachedGameOverLayout,
} from '../ui/gameOverScreenConfig';
import { addCtaHitZone, layoutCoverScreenBackground, scalePx } from '../ui/endScreenLayout';
import {
  mountGameOverLottieOverlay,
  unmountGameOverLottieOverlay,
} from '../ui/endScreenLottieOverlay';

export type GameOverReason = 'time' | 'lives' | 'fall';

const PNG_FALLBACK_KEY = 'screen-game-over-screen';

/**
 * GameOverScene — playful Lottie M03 art + invisible Try Again tap zone.
 * Preview: ?gameOver=1
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(_data: { reason?: GameOverReason; score?: number; kisses?: number }): void {
    /* score/kisses kept for scene API compat; art is static in Lottie */
  }

  create(): void {
    getSoundManager(this.game)?.play('sfx-game-over', this);
    this.buildUi();
    this.setupRestart();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.buildUi, this);
      unmountGameOverLottieOverlay();
    });
  }

  private buildUi = (): void => {
    this.children.removeAll(true);

    const layout = getCachedGameOverLayout(this.game);
    const restart = () => {
      unmountGameOverLottieOverlay();
      const sound = getSoundManager(this.game);
      sound?.unlock(this);
      sound?.playMusic('music-game', this);
      this.scene.start('GameScene');
    };

    const lottieData = this.cache.json.get(GAME_OVER_LOTTIE_CACHE_KEY) as object | null;
    if (lottieData) {
      unmountGameOverLottieOverlay();
      this.cameras.main.setBackgroundColor(layout.bg);
      mountGameOverLottieOverlay(lottieData, layout, restart);
      return;
    }

    unmountGameOverLottieOverlay();
    const screen = layoutCoverScreenBackground(this, PNG_FALLBACK_KEY);
    const { cx, mapY } = screen;
    const px = (n: number) => scalePx(screen, n);
    this.cameras.main.setBackgroundColor(layout.bg);
    addCtaHitZone(this, cx, mapY(layout.ctaY), px(layout.ctaW), px(layout.ctaH), restart);
  };

  private setupRestart(): void {
    const restart = () => {
      unmountGameOverLottieOverlay();
      const sound = getSoundManager(this.game);
      sound?.unlock(this);
      sound?.playMusic('music-game', this);
      this.scene.start('GameScene');
    };
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
  }
}
