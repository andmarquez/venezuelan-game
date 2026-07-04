import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';

/**
 * MenuScene — title screen with keyboard and tap to start.
 */
export class MenuScene extends Phaser.Scene {
  private canStart = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.drawBackground();
    this.createTitle();
    this.createStartButton();
    this.createPortraitHint();

    this.canStart = true;

    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
  }

  private drawBackground(): void {
    const w = GAME_CONFIG.width;
    const h = GAME_CONFIG.height;
    const sky = this.add.graphics();
    sky.fillGradientStyle(
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyBottom,
      GAME_CONFIG.colors.skyBottom,
      1,
    );
    sky.fillRect(0, 0, w, h);

    for (let i = 0; i < 6; i++) {
      const cloud = this.add.ellipse(
        100 + i * 200,
        80 + (i % 3) * 40,
        120 + (i % 2) * 40,
        50,
        GAME_CONFIG.colors.cloud,
        0.85,
      );
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 30,
        duration: 3000 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const hill = this.add.ellipse(w / 2, h + 40, w * 1.2, 200, GAME_CONFIG.colors.hillNear, 0.6);
    hill.setDepth(-1);
  }

  private createTitle(): void {
    const w = GAME_CONFIG.width;
    const title = this.add.text(w / 2, 200, "Andsiosa's", {
      fontSize: '64px',
      fontFamily: 'Nunito, sans-serif',
      color: '#e91e63',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(w / 2, 280, 'Creative Quest', {
      fontSize: '72px',
      fontFamily: 'Nunito, sans-serif',
      color: '#880e4f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, subtitle],
      y: '-=8',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const preview = this.add.image(w / 2, 420, 'andsiosa-idle').setScale(2);
    this.tweens.add({
      targets: preview,
      y: preview.y - 10,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private createStartButton(): void {
    const w = GAME_CONFIG.width;
    const label = shouldShowMobileControls(this.game) ? 'Tap to Start' : 'Press Enter / Tap to Start';
    const btnW = 420;
    const btnH = 72;
    const cx = w / 2;
    const cy = 560;

    const bg = this.add
      .rectangle(cx, cy, btnW, btnH, 0xffffff, 0.95)
      .setStrokeStyle(3, GAME_CONFIG.colors.uiAccent)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(cx, cy, label, {
        fontSize: '26px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ad1457',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [bg, text],
      alpha: 0.65,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.startGame();
    bg.on('pointerup', start);
    bg.on('pointerdown', start);

    const zone = this.add.zone(cx, GAME_CONFIG.height / 2, w, GAME_CONFIG.height).setOrigin(0.5).setInteractive();
    zone.on('pointerup', start);
    zone.setDepth(-10);
  }

  private createPortraitHint(): void {
    const hint = this.add
      .text(GAME_CONFIG.width / 2, GAME_CONFIG.height - 40, '', {
        fontSize: '18px',
        fontFamily: 'Nunito, sans-serif',
        color: '#880e4f',
        align: 'center',
        wordWrap: { width: GAME_CONFIG.width - 40 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    const updateHint = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait && shouldShowMobileControls(this.game)) {
        hint.setText('Turn your phone sideways for the best experience.');
      } else if (!shouldShowMobileControls(this.game)) {
        hint.setText('On desktop: add ?mobile=1 to preview touch controls.');
      } else {
        hint.setText('');
      }
    };
    updateHint();
    this.scale.on(Phaser.Scale.Events.RESIZE, updateHint);
  }

  private startGame(): void {
    if (!this.canStart) return;
    this.canStart = false;
    this.scene.start('GameScene');
  }
}
