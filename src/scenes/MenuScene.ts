import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';
import { getUiViewport } from '../ui/viewportLayout';

/**
 * MenuScene — title screen with keyboard and tap to start.
 */
export class MenuScene extends Phaser.Scene {
  private canStart = false;
  private titleGroup?: Phaser.GameObjects.Container;
  private preview?: Phaser.GameObjects.Image;
  private startBg?: Phaser.GameObjects.Rectangle;
  private startText?: Phaser.GameObjects.Text;
  private portraitHint?: Phaser.GameObjects.Text;
  private onWindowKeydown?: (event: KeyboardEvent) => void;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.drawBackground();
    this.createUi();
    this.layoutUi();

    this.canStart = true;
    this.setupKeyboard();
    this.setupPointer();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutUi, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus({ preventScroll: true });
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

  private createUi(): void {
    this.titleGroup = this.add.container(0, 0).setDepth(110);
    const title = this.add.text(0, 0, "Andsiosa's", {
      fontSize: '64px',
      fontFamily: 'Nunito, sans-serif',
      color: '#e91e63',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, 80, 'Creative Quest', {
      fontSize: '72px',
      fontFamily: 'Nunito, sans-serif',
      color: '#880e4f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.titleGroup.add([title, subtitle]);
    this.tweens.add({
      targets: this.titleGroup,
      y: '-=8',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.preview = this.add.image(0, 0, 'andsiosa-idle').setScale(2).setDepth(110);
    this.tweens.add({
      targets: this.preview,
      y: '-=10',
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const label = shouldShowMobileControls(this.game) ? 'Tap to Start' : 'Press Enter / Tap to Start';
    this.startBg = this.add
      .rectangle(0, 0, 420, 72, 0xffffff, 0.95)
      .setStrokeStyle(3, GAME_CONFIG.colors.uiAccent)
      .setInteractive({ useHandCursor: true })
      .setDepth(120);

    this.startText = this.add
      .text(0, 0, label, {
        fontSize: '26px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ad1457',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(121);

    const start = () => this.startGame();
    this.startBg.on('pointerdown', start);
    this.startBg.on('pointerup', start);

    this.tweens.add({
      targets: [this.startBg, this.startText],
      alpha: 0.65,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.portraitHint = this.add
      .text(0, 0, '', {
        fontSize: '18px',
        fontFamily: 'Nunito, sans-serif',
        color: '#880e4f',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(110);
  }

  private layoutUi = (): void => {
    const vp = getUiViewport(this.scale);
    const cx = vp.x + vp.width / 2;
    const btnW = Math.min(420, vp.width - 48);
    const label = shouldShowMobileControls(this.game) ? 'Tap to Start' : 'Press Enter / Tap to Start';

    const titleY = vp.y + vp.height * 0.22;
    const previewY = vp.y + vp.height * 0.52;
    const buttonY = vp.y + vp.height - 108;
    const hintY = vp.y + vp.height - 28;

    this.titleGroup?.setPosition(cx, titleY);
    this.preview?.setPosition(cx, previewY);
    this.startBg?.setPosition(cx, buttonY);
    this.startBg?.setSize(btnW, 72);
    this.startText?.setPosition(cx, buttonY);
    this.startText?.setText(label);
    this.portraitHint?.setPosition(cx, hintY);
    this.portraitHint?.setWordWrapWidth(vp.width - 40);

    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait && shouldShowMobileControls(this.game)) {
      this.portraitHint?.setText('Turn your phone sideways for the best experience.');
    } else if (!shouldShowMobileControls(this.game)) {
      this.portraitHint?.setText('On desktop: add ?mobile=1 to preview touch controls.');
    } else {
      this.portraitHint?.setText('');
    }
  };

  private setupKeyboard(): void {
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());

    this.onWindowKeydown = (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.startGame();
      }
    };
    window.addEventListener('keydown', this.onWindowKeydown);
  }

  private setupPointer(): void {
    const tryStart = () => this.startGame();
    this.input.on('pointerdown', tryStart);
    this.input.on('pointerup', tryStart);
  }

  private cleanup = (): void => {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutUi, this);
    if (this.onWindowKeydown) {
      window.removeEventListener('keydown', this.onWindowKeydown);
      this.onWindowKeydown = undefined;
    }
  };

  private startGame(): void {
    if (!this.canStart) return;
    this.canStart = false;
    this.scene.start('GameScene');
  }
}
