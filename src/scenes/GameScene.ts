import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Collectible } from '../objects/Collectible';
import { KissProjectile } from '../objects/KissProjectile';
import { MobileControls } from '../ui/MobileControls';
import {
  GAME_CONFIG,
  createInitialStats,
  type GameStats,
} from '../config/gameConfig';

type PlatformDef = { x: number; y: number; width: number; height?: number };

/** Level 1 layout — platforms, gaps, collectibles, enemies */
const LEVEL = {
  groundSegments: [
    { x: 0, width: 900 },
    { x: 1050, width: 700 },
    { x: 1900, width: 600 },
    { x: 2650, width: 500 },
    { x: 3300, width: 800 },
    { x: 4250, width: 550 },
  ] as { x: number; width: number }[],
  platforms: [
    { x: 400, y: 520, width: 180 },
    { x: 700, y: 440, width: 140 },
    { x: 1150, y: 480, width: 160 },
    { x: 1400, y: 400, width: 120 },
    { x: 1650, y: 340, width: 140 },
    { x: 2100, y: 460, width: 180 },
    { x: 2400, y: 380, width: 140 },
    { x: 2750, y: 500, width: 160 },
    { x: 3000, y: 420, width: 120 },
    { x: 3450, y: 460, width: 200 },
    { x: 3800, y: 380, width: 140 },
    { x: 4050, y: 300, width: 160 },
    { x: 4400, y: 500, width: 200 },
  ] as PlatformDef[],
  kisses: [
    [200, 600], [450, 480], [750, 380], [500, 600], [1200, 420],
    [1500, 340], [1750, 280], [2200, 400], [2500, 320], [2850, 440],
    [3100, 360], [3550, 400], [3900, 320], [4200, 240], [4500, 440],
    [1000, 600], [2000, 600], [3200, 600], [3600, 600],
  ] as [number, number][],
  timers: [
    [850, 380], [1700, 280], [2550, 320], [3700, 320], [4100, 240],
  ] as [number, number][],
  enemies: [
    { x: 500, y: 640, min: 420, max: 780 },
    { x: 1300, y: 640, min: 1100, max: 1600 },
    { x: 2200, y: 640, min: 1950, max: 2400 },
    { x: 3000, y: 640, min: 2700, max: 3100 },
    { x: 3600, y: 428, min: 3450, max: 3620 },
    { x: 4500, y: 468, min: 4400, max: 4580 },
  ],
  portal: { x: 4680, y: 620 },
  playerStart: { x: 120, y: 600 },
};

/**
 * GameScene — main Level 1 gameplay.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private collectibles: Collectible[] = [];
  private portal!: Phaser.Physics.Arcade.Sprite;
  private mobileControls?: MobileControls;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private kissProjectiles: KissProjectile[] = [];
  private lastKissBlowTime = 0;
  private kissWasDown = false;

  private stats: GameStats = createInitialStats();
  private hud!: Phaser.GameObjects.Container;
  private hudTexts!: {
    kisses: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
    projects: Phaser.GameObjects.Text;
    lives: Phaser.GameObjects.Text;
    score: Phaser.GameObjects.Text;
  };
  private portraitOverlay?: Phaser.GameObjects.Container;
  private portalMessage?: Phaser.GameObjects.Text;
  private jumpWasDown = false;
  private gameEnded = false;
  private parallaxLayers: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.stats = createInitialStats();
    this.gameEnded = false;
    this.enemies = [];
    this.collectibles = [];
    this.kissProjectiles = [];
    this.parallaxLayers = [];

    this.physics.world.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.cameras.main.setBackgroundColor('#b8e0f5');

    this.createParallaxBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createPortal();
    this.setupCollisions();
    this.createHUD();
    this.setupInput();
    this.createPortraitOverlay();

    this.cameras.main.startFollow(this.player, true, GAME_CONFIG.cameraLerp, GAME_CONFIG.cameraLerp);
    this.cameras.main.setDeadzone(200, 100);
  }

  private createParallaxBackground(): void {
    const worldW = GAME_CONFIG.worldWidth;
    const h = GAME_CONFIG.height;

    const sky = this.add.graphics();
    sky.fillGradientStyle(
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyTop,
      GAME_CONFIG.colors.skyBottom,
      GAME_CONFIG.colors.skyBottom,
      1,
    );
    sky.fillRect(0, 0, worldW, h);
    sky.setScrollFactor(0);
    sky.setDepth(-20);

    for (let i = 0; i < 12; i++) {
      const cloud = this.add.ellipse(
        i * 420 + 80,
        60 + (i % 4) * 35,
        100 + (i % 3) * 30,
        44,
        GAME_CONFIG.colors.cloud,
        0.75,
      );
      cloud.setScrollFactor(0.1 + (i % 3) * 0.05);
      cloud.setDepth(-15);
      this.parallaxLayers.push(cloud);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 40,
        duration: 4000 + i * 300,
        yoyo: true,
        repeat: -1,
      });
    }

    for (let i = 0; i < 5; i++) {
      const hill = this.add.ellipse(
        i * 1100 + 200,
        h - 60,
        900,
        180,
        i % 2 === 0 ? GAME_CONFIG.colors.hillFar : GAME_CONFIG.colors.hillNear,
        0.5,
      );
      hill.setScrollFactor(0.2 + i * 0.05);
      hill.setDepth(-12);
      this.parallaxLayers.push(hill);
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    const groundY = 680;
    const groundH = 80;

    LEVEL.groundSegments.forEach((seg) => {
      this.addPlatform(seg.x + seg.width / 2, groundY, seg.width, groundH, true);
    });

    LEVEL.platforms.forEach((p) => {
      this.addPlatform(p.x, p.y, p.width, p.height ?? 32, false);
    });
  }

  private addPlatform(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    isGround: boolean,
  ): void {
    const tileW = 64;
    const tiles = Math.ceil(width / tileW);
    const startX = centerX - width / 2;

    for (let i = 0; i < tiles; i++) {
      const tile = this.platforms.create(
        startX + i * tileW + tileW / 2,
        centerY,
        'platform-tile',
      ) as Phaser.Physics.Arcade.Sprite;
      tile.setDisplaySize(tileW, height);
      tile.refreshBody();
      tile.setDepth(1);
    }

    if (isGround) {
      const grass = this.add.rectangle(
        centerX,
        centerY - height / 2 + 4,
        width,
        8,
        GAME_CONFIG.colors.groundTop,
      );
      grass.setDepth(2);
    }
  }

  private createPlayer(): void {
    this.player = new Player(
      this,
      LEVEL.playerStart.x,
      LEVEL.playerStart.y,
    );
  }

  private createCollectibles(): void {
    LEVEL.kisses.forEach(([x, y]) => {
      const kiss = new Collectible(this, x, y, 'kiss');
      this.collectibles.push(kiss);
    });
    LEVEL.timers.forEach(([x, y]) => {
      const timer = new Collectible(this, x, y, 'timer');
      this.collectibles.push(timer);
    });
  }

  private createEnemies(): void {
    LEVEL.enemies.forEach((e) => {
      const bug = new Enemy(this, e.x, e.y, e.min, e.max);
      this.enemies.push(bug);
    });
  }

  private createPortal(): void {
    const { x, y } = LEVEL.portal;
    this.portal = this.physics.add.sprite(x, y, 'portal');
    this.portal.setImmovable(true);
    (this.portal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.portal.setDepth(6);
    this.portal.setScale(1.2);

    this.tweens.add({
      targets: this.portal,
      scale: 1.35,
      alpha: 0.85,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    const glow = this.add.particles(x, y, 'particle', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.4, end: 0 },
      lifespan: 800,
      frequency: 120,
      tint: [GAME_CONFIG.colors.portal, GAME_CONFIG.colors.portalGlow],
      blendMode: 'ADD',
    });
    glow.setDepth(5);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.platforms);
    this.enemies.forEach((enemy) => {
      this.physics.add.collider(enemy, this.platforms);
    });

    this.collectibles.forEach((item) => {
      this.physics.add.overlap(this.player, item, () => {
        if (!item.active) return;
        this.handleCollectible(item);
      });
    });

    this.physics.add.overlap(this.player, this.portal, () => {
      this.tryEnterPortal();
    });

    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(this.player, enemy, () => {
        this.handleEnemyContact(enemy);
      });
    });
  }

  private handleEnemyContact(enemy: Enemy): void {
    if (!enemy.active || enemy.isConverted() || this.gameEnded) return;
    if (this.player.isInvulnerable()) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const falling = playerBody.velocity.y > 0;
    const stomping = falling && this.player.y < enemy.y - 8;

    if (stomping) {
      this.convertEnemyToHeart(enemy, true);
      return;
    }

    this.handleEnemyHit();
  }

  private convertEnemyToHeart(enemy: Enemy, fromStomp = false): void {
    if (!enemy.active || enemy.isConverted()) return;

    if (fromStomp) {
      this.player.stompBounce();
    }

    enemy.convertToHeart(() => {
      this.enemies = this.enemies.filter((e) => e !== enemy);
    });

    this.stats.kisses += 1;
    this.stats.score += GAME_CONFIG.kissScore;
    this.updateHUD();

    this.showFloatingMessage(fromStomp ? 'Stomped with love!' : 'Bug turned to heart!');
  }

  private blowKiss(): void {
    if (this.gameEnded || this.player.isInvulnerable()) return;

    const now = this.time.now;
    if (now - this.lastKissBlowTime < GAME_CONFIG.kissBlowCooldownMs) return;
    this.lastKissBlowTime = now;

    const direction = this.player.getFacingRight() ? 1 : -1;
    const offsetX = direction === 1 ? 28 : -28;
    const projectile = new KissProjectile(
      this,
      this.player.x + offsetX,
      this.player.y - 8,
      direction,
      (enemy, proj) => {
        this.convertEnemyToHeart(enemy, false);
        proj.destroy();
        this.kissProjectiles = this.kissProjectiles.filter((p) => p !== proj);
      },
    );

    projectile.registerEnemyOverlap(this.enemies);
    this.kissProjectiles.push(projectile);
    this.player.playKissBlow();
  }

  private handleCollectible(item: Collectible): void {
    if (!item.active || this.gameEnded) return;

    if (item.collectibleType === 'kiss') {
      this.stats.kisses += 1;
      this.stats.score += GAME_CONFIG.kissScore;
    } else {
      this.stats.timeRemaining += GAME_CONFIG.timerBonus;
      if (this.stats.projectsCompleted < GAME_CONFIG.requiredProjects) {
        this.stats.projectsCompleted += 1;
      }
      this.showFloatingMessage(
        Phaser.Utils.Array.GetRandom([...GAME_CONFIG.timerMessages]),
      );
    }

    item.collectEffect();
    this.updateHUD();
  }

  private showFloatingMessage(text: string): void {
    const msg = this.add
      .text(this.player.x, this.player.y - 50, text, {
        fontSize: '20px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffffff',
        backgroundColor: '#e91e63cc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: msg,
      y: msg.y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => msg.destroy(),
    });
  }

  private handleEnemyHit(): void {
    if (this.player.isInvulnerable() || this.gameEnded) return;

    this.stats.lives -= 1;
    this.updateHUD();

    if (this.stats.lives <= 0) {
      this.endGame('lives');
      return;
    }

    this.player.hurt();
  }

  private tryEnterPortal(): void {
    if (this.gameEnded) return;

    if (this.stats.projectsCompleted < GAME_CONFIG.requiredProjects) {
      if (!this.portalMessage) {
        this.portalMessage = this.add
          .text(this.player.x, this.player.y - 80, 'Collect more timers to finish your projects!', {
            fontSize: '18px',
            fontFamily: 'Nunito, sans-serif',
            color: '#ffffff',
            backgroundColor: '#ad1457cc',
            padding: { x: 14, y: 8 },
            align: 'center',
            wordWrap: { width: 280 },
          })
          .setOrigin(0.5)
          .setDepth(60);

        this.time.delayedCall(2500, () => {
          this.portalMessage?.destroy();
          this.portalMessage = undefined;
        });
      } else {
        this.portalMessage.setPosition(this.player.x, this.player.y - 80);
      }
      return;
    }

    this.winGame();
  }

  private winGame(): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.player.celebrate();
    this.cameras.main.stopFollow();

    this.time.delayedCall(800, () => {
      this.scene.start('WinScene', {
        score: this.stats.score,
        kisses: this.stats.kisses,
        projects: this.stats.projectsCompleted,
      });
    });
  }

  private endGame(reason: 'time' | 'lives' | 'fall'): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.scene.start('GameOverScene', {
      reason,
      score: this.stats.score,
      kisses: this.stats.kisses,
    });
  }

  private createHUD(): void {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(90);

    const pad = GAME_CONFIG.safePadding;
    const bg = this.add
      .rectangle(GAME_CONFIG.width / 2, pad + 22, GAME_CONFIG.width - pad * 2, 52, 0xffffff, 0.88)
      .setStrokeStyle(2, GAME_CONFIG.colors.uiAccent);
    bg.setScrollFactor(0);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '17px',
      fontFamily: 'Nunito, sans-serif',
      color: '#880e4f',
      fontStyle: 'bold',
    };

    const kisses = this.add.text(pad + 8, pad + 8, '', style).setScrollFactor(0);
    const time = this.add.text(GAME_CONFIG.width / 2 - 60, pad + 8, '', style).setScrollFactor(0);
    const projects = this.add
      .text(GAME_CONFIG.width / 2 + 80, pad + 8, '', style)
      .setScrollFactor(0);
    const lives = this.add
      .text(GAME_CONFIG.width - pad - 120, pad + 8, '', style)
      .setScrollFactor(0);
    const score = this.add
      .text(pad + 8, pad + 30, '', { ...style, fontSize: '14px' })
      .setScrollFactor(0);

    this.hudTexts = { kisses, time, projects, lives, score };
    this.hud.add([bg, kisses, time, projects, lives, score]);
    this.updateHUD();

    this.scale.on('resize', this.layoutHUD, this);
    this.layoutHUD();
  }

  private layoutHUD(): void {
    const pad = GAME_CONFIG.safePadding;
    const w = this.scale.width;
    const hudBg = this.hud.getAt(0) as Phaser.GameObjects.Rectangle;
    hudBg.setPosition(w / 2, pad + 22);
    hudBg.setSize(Math.min(w - pad * 2, GAME_CONFIG.width - pad * 2), 52);

    this.hudTexts.kisses.setPosition(pad + 8, pad + 8);
    this.hudTexts.time.setPosition(w / 2 - 80, pad + 8);
    this.hudTexts.projects.setPosition(w / 2 + 40, pad + 8);
    this.hudTexts.lives.setPosition(w - pad - 130, pad + 8);
    this.hudTexts.score.setPosition(pad + 8, pad + 30);
  }

  private updateHUD(): void {
    this.hudTexts.kisses.setText(`♥ ${this.stats.kisses}`);
    this.hudTexts.time.setText(`⏱ ${Math.ceil(this.stats.timeRemaining)}s`);
    this.hudTexts.projects.setText(
      `Projects: ${this.stats.projectsCompleted}/${GAME_CONFIG.requiredProjects}`,
    );
    this.hudTexts.lives.setText(`❤ x${this.stats.lives}`);
    this.hudTexts.score.setText(`Score: ${this.stats.score}`);

    if (this.stats.timeRemaining <= 10) {
      this.hudTexts.time.setColor('#c62828');
    } else {
      this.hudTexts.time.setColor('#880e4f');
    }
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey('A');
    this.keyD = this.input.keyboard.addKey('D');
    this.keyW = this.input.keyboard.addKey('W');
    this.keyX = this.input.keyboard.addKey('X');
    this.keySpace = this.input.keyboard.addKey('SPACE');

    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      this.mobileControls = new MobileControls(this);
    }
  }

  private createPortraitOverlay(): void {
    this.portraitOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);

    const bg = this.add
      .rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.55)
      .setScrollFactor(0);
    const msg = this.add
      .text(0, 0, 'Turn your phone sideways\nfor the best experience.', {
        fontSize: '24px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#e91e63cc',
        padding: { x: 24, y: 16 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.portraitOverlay.add([bg, msg]);

    const update = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const portrait = h > w;
      this.portraitOverlay?.setVisible(portrait);
      bg.setPosition(w / 2, h / 2);
      bg.setSize(w, h);
      msg.setPosition(w / 2, h / 2);
    };
    update();
    this.scale.on('resize', update);
  }

  update(_time: number, delta: number): void {
    if (this.gameEnded) return;

    // Countdown timer
    this.stats.timeRemaining -= delta / 1000;
    if (this.stats.timeRemaining <= 0) {
      this.stats.timeRemaining = 0;
      this.updateHUD();
      this.endGame('time');
      return;
    }
    this.updateHUD();

    const touch = this.mobileControls?.input ?? {
      left: false,
      right: false,
      jump: false,
      kiss: false,
      boost: false,
    };

    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      (touch.jump && !this.jumpWasDown);

    const kissJustDown =
      Phaser.Input.Keyboard.JustDown(this.keyA) ||
      (touch.kiss && !this.kissWasDown);

    const highJumpHeld = this.keyX?.isDown || touch.boost;

    this.jumpWasDown = touch.jump;
    this.kissWasDown = touch.kiss;

    if (kissJustDown) {
      this.blowKiss();
    }

    this.player.updateMovement(this.cursors, {
      left: (this.cursors.left?.isDown ?? false) || touch.left,
      right: (this.cursors.right?.isDown ?? false) || (this.keyD?.isDown ?? false) || touch.right,
      jump: jumpJustDown,
      highJump: highJumpHeld,
    });

    this.enemies.forEach((e) => e.update());

    if (this.player.y > GAME_CONFIG.worldHeight + 50) {
      this.endGame('fall');
    }
  }

  shutdown(): void {
    this.scale.off('resize', this.layoutHUD, this);
    this.mobileControls?.destroy();
  }
}
