import Phaser from 'phaser';
import { getSoundManager } from '../audio/SoundManager';
import { addCtaHitZone, layoutCoverScreenBackground, scalePx } from '../ui/endScreenLayout';
import {
  mountWinLottieOverlay,
  unmountWinLottieOverlay,
} from '../ui/endScreenLottieOverlay';
import {
  getCachedWinLayout,
  WIN_LOTTIE_CACHE_KEY,
} from '../ui/winScreenConfig';

const PNG_FALLBACK_KEY = 'screen-win-screen';

/**
 * WinScene — playful Lottie M04 art + invisible Play Again tap zone.
 * Preview: ?win=1
 */
export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  init(_data: { score?: number; kisses?: number; projects?: number }): void {
    /* score/kisses kept for scene API compat; art is static in Lottie */
  }

  create(): void {
    getSoundManager(this.game)?.play('sfx-spark', this);
    this.buildUi();
    this.setupRestart();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.buildUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.buildUi, this);
      unmountWinLottieOverlay();
    });
  }

  private buildUi = (): void => {
    this.children.removeAll(true);

    const layout = getCachedWinLayout(this.game);
    const restart = () => {
      unmountWinLottieOverlay();
      const sound = getSoundManager(this.game);
      sound?.unlock(this);
      sound?.playMusic('music-game', this);
      this.scene.start('GameScene');
    };

    const lottieData = this.cache.json.get(WIN_LOTTIE_CACHE_KEY) as object | null;
    if (lottieData) {
      unmountWinLottieOverlay();
      this.cameras.main.setBackgroundColor(layout.bg);
      mountWinLottieOverlay(lottieData, layout, restart);
      return;
    }

    unmountWinLottieOverlay();
    const screen = layoutCoverScreenBackground(this, PNG_FALLBACK_KEY);
    const { cx, mapY } = screen;
    const px = (n: number) => scalePx(screen, n);
    this.cameras.main.setBackgroundColor(layout.bg);
    addCtaHitZone(this, cx, mapY(layout.ctaY), px(layout.ctaW), px(layout.ctaH), restart);
  };

  private setupRestart(): void {
    const restart = () => {
      unmountWinLottieOverlay();
      const sound = getSoundManager(this.game);
      sound?.unlock(this);
      sound?.playMusic('music-game', this);
      this.scene.start('GameScene');
    };
    this.input.keyboard?.on('keydown-ENTER', restart);
    this.input.keyboard?.on('keydown-SPACE', restart);
  }
}
