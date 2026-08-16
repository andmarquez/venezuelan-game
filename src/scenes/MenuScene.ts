import Phaser from 'phaser';
import { getSoundManager, bindSceneAudioUnlock, musicKeyForLevel } from '../audio/SoundManager';
import { coverFitImage, getCoverScreenLayout, scalePx } from '../ui/endScreenLayout';
import { getUiViewport } from '../ui/viewportLayout';

type MenuButtonConfig = {
  id: string;
  label: string;
  level: 'level-1' | 'level-2' | null;
  comingSoon?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

const FALLBACK_BUTTONS: MenuButtonConfig[] = [
  { id: 'level-1', label: 'Maracaibo — Level 1', level: 'level-1', x: 462, y: 258, w: 340, h: 115 },
  { id: 'level-2', label: 'Salto Ángel — Level 2', level: 'level-2', x: 460, y: 381, w: 340, h: 115 },
  {
    id: 'level-3',
    label: 'Level 3 — Coming soon',
    level: null,
    comingSoon: true,
    x: 460,
    y: 504,
    w: 340,
    h: 115,
  },
];

/**
 * MenuScene — Figma M01 level select (Maracaibo / Salto Ángel / Coming soon).
 */
export class MenuScene extends Phaser.Scene {
  private canStart = false;
  private comingSoonText?: Phaser.GameObjects.Text;
  private comingSoonTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#b8e0f5');
    this.layoutScreen();
    this.canStart = true;
    this.setupKeyboard();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutScreen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus({ preventScroll: true });

    bindSceneAudioUnlock(this);
  }

  private getButtons(): MenuButtonConfig[] {
    const raw = this.cache.json.get('menu-start-layout') as { buttons?: MenuButtonConfig[] } | null;
    return raw?.buttons?.length ? raw.buttons : FALLBACK_BUTTONS;
  }

  private layoutScreen = (): void => {
    this.children.removeAll(true);
    this.comingSoonText = undefined;
    this.comingSoonTimer?.remove(false);
    this.comingSoonTimer = undefined;

    const vp = getUiViewport(this.scale);
    const layout = getCoverScreenLayout(this);
    const cx = vp.x + vp.width / 2;
    const cy = vp.y + vp.height / 2;
    const bg = this.add.image(cx, cy, 'screen-menu-start').setScrollFactor(0).setDepth(0);
    coverFitImage(bg, vp.width, vp.height);

    for (const button of this.getButtons()) {
      const hitCx = layout.mapX(button.x + button.w / 2);
      const hitCy = layout.mapY(button.y + button.h / 2);
      const hitW = scalePx(layout, button.w);
      const hitH = scalePx(layout, button.h);

      const zone = this.add
        .zone(hitCx, hitCy, hitW, hitH)
        .setScrollFactor(0)
        .setDepth(20)
        .setInteractive({ useHandCursor: !button.comingSoon });

      zone.on('pointerdown', () => {
        getSoundManager(this.game)?.unlock(this);
        if (button.comingSoon || !button.level) {
          this.showComingSoon(hitCx, hitCy);
          return;
        }
        this.startLevel(button.level);
      });
    }
  };

  private showComingSoon(x: number, y: number): void {
    getSoundManager(this.game)?.play('sfx-select', this);
    this.comingSoonTimer?.remove(false);
    this.comingSoonText?.destroy();

    this.comingSoonText = this.add
      .text(x, y, 'Coming soon!', {
        fontFamily: 'Nunito, Inter, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: '700',
        color: '#fff8e7',
        backgroundColor: '#6b3f91cc',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40)
      .setAlpha(0);

    this.tweens.add({
      targets: this.comingSoonText,
      alpha: 1,
      y: y - 24,
      duration: 220,
      ease: 'Quad.Out',
    });

    this.comingSoonTimer = this.time.delayedCall(1200, () => {
      if (!this.comingSoonText) return;
      this.tweens.add({
        targets: this.comingSoonText,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.comingSoonText?.destroy();
          this.comingSoonText = undefined;
        },
      });
    });
  }

  private setupKeyboard(): void {
    this.input.keyboard?.on('keydown-ONE', () => this.startLevel('level-1'));
    this.input.keyboard?.on('keydown-TWO', () => this.startLevel('level-2'));
    this.input.keyboard?.on('keydown-NUMPAD_ONE', () => this.startLevel('level-1'));
    this.input.keyboard?.on('keydown-NUMPAD_TWO', () => this.startLevel('level-2'));
  }

  private cleanup = (): void => {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutScreen, this);
    this.comingSoonTimer?.remove(false);
    this.comingSoonTimer = undefined;
  };

  private startLevel(level: 'level-1' | 'level-2'): void {
    if (!this.canStart) return;
    this.canStart = false;
    this.game.registry.set('currentLevel', level);

    const sound = getSoundManager(this.game);
    sound?.unlock(this);
    sound?.play('sfx-select', this);
    sound?.playMusic(musicKeyForLevel(level), this);
    this.scene.start('GameScene');
  }
}
