import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Collectible } from '../objects/Collectible';
import { KissProjectile } from '../objects/KissProjectile';
import { MobileControls } from '../ui/MobileControls';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';
import {
  GAME_CONFIG,
  createInitialStats,
  type GameStats,
} from '../config/gameConfig';
import { WorldBuilder } from '../world/WorldBuilder';
import type { LevelLayout } from '../world/worldTypes';
import { getLevelLayoutCacheKey, isDebugMode } from '../world/layoutUtils';
import { depthFromFootY, WORLD_LAYERS } from '../world/layerConfig';
import { markerToFoot } from '../world/worldTypes';

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
  private gameEnded = false;
  private levelLayout!: LevelLayout;
  private toggleDebug?: () => void;
  private keyDebug!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.stats = createInitialStats();
    this.gameEnded = false;
    this.enemies = [];
    this.collectibles = [];
    this.kissProjectiles = [];

    this.levelLayout = this.cache.json.get(getLevelLayoutCacheKey(this.game)) as LevelLayout;
    const worldW = this.levelLayout?.width ?? GAME_CONFIG.worldWidth;
    const debug = isDebugMode();

    this.physics.world.setBounds(0, 0, worldW, GAME_CONFIG.worldHeight);
    this.cameras.main.setBounds(0, 0, worldW, GAME_CONFIG.worldHeight);
    this.cameras.main.setBackgroundColor('#b8e0f5');

    const world = WorldBuilder.build(this, this.levelLayout, { debug });
    this.platforms = world.platforms;
    this.toggleDebug = world.toggleDebug;
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createPortal();
    this.setupCollisions();
    this.createHUD();
    this.setupInput();
    this.createPortraitOverlay();

    const isMobile = shouldShowMobileControls(this.game);
    this.cameras.main.startFollow(this.player, true, GAME_CONFIG.cameraLerp, GAME_CONFIG.cameraLerp);
    this.cameras.main.setDeadzone(isMobile ? 100 : 200, isMobile ? 70 : 100);
  }

  private createPlayer(): void {
    const foot = markerToFoot(this.levelLayout.markers.player_spawn);
    this.player = new Player(this, foot.x, foot.y);
    this.player.setDepth(depthFromFootY(foot.y, WORLD_LAYERS.player));
  }

  private createCollectibles(): void {
    this.levelLayout.markers.kiss_collectibles.forEach(({ x, y }) => {
      const kiss = new Collectible(this, x, y, 'kiss');
      kiss.setDepth(WORLD_LAYERS.collectibles);
      this.collectibles.push(kiss);
    });
    this.levelLayout.markers.timer_collectibles.forEach(({ x, y }) => {
      const timer = new Collectible(this, x, y, 'timer');
      timer.setDepth(WORLD_LAYERS.collectibles);
      this.collectibles.push(timer);
    });
  }

  private createEnemies(): void {
    this.levelLayout.markers.enemies.forEach((e) => {
      const bug = new Enemy(this, e.x, e.y, e.min, e.max);
      bug.setDepth(WORLD_LAYERS.enemies);
      this.enemies.push(bug);
    });
  }

  private createPortal(): void {
    const { x, y } = this.levelLayout.markers.portal_goal;
    this.portal = this.physics.add.sprite(x, y, 'portal');
    this.portal.setImmovable(true);
    (this.portal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.portal.setDepth(WORLD_LAYERS.collectibles);
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
    this.keyDebug = this.input.keyboard.addKey('H');

    const showTouch = shouldShowMobileControls(this.game);
    if (showTouch) {
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
      moveAxis: 0,
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
      (this.mobileControls?.consumeJumpPress() ?? false);

    const kissJustDown =
      Phaser.Input.Keyboard.JustDown(this.keyA) ||
      (this.mobileControls?.consumeKissPress() ?? false);

    const highJumpHeld = this.keyX?.isDown || touch.boost;

    if (kissJustDown) {
      this.blowKiss();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyDebug)) {
      this.toggleDebug?.();
    }

    this.player.updateMovement(this.cursors, {
      left: (this.cursors.left?.isDown ?? false) || touch.left,
      right: (this.cursors.right?.isDown ?? false) || (this.keyD?.isDown ?? false) || touch.right,
      jump: jumpJustDown,
      highJump: highJumpHeld,
      moveAxis: touch.moveAxis,
    });

    this.enemies.forEach((e) => e.update());

    this.player.setDepth(depthFromFootY(this.player.y, WORLD_LAYERS.player));

    if (this.player.y > GAME_CONFIG.worldHeight + 50) {
      this.endGame('fall');
    }
  }

  shutdown(): void {
    this.scale.off('resize', this.layoutHUD, this);
    this.mobileControls?.destroy();
  }
}
