import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { FinalBoss } from '../objects/FinalBoss';
import { Collectible } from '../objects/Collectible';
import { KissProjectile } from '../objects/KissProjectile';
import { MobileControls } from '../ui/MobileControls';
import { shouldShowMobileControls } from '../ui/mobileControlUtils';
import { isLandscapeViewport } from '../ui/scaleMode';
import { safeAreaInsetsInGame } from '../ui/safeAreaUtils';
import { getUiViewport } from '../ui/viewportLayout';
import {
  GAME_CONFIG,
  createInitialStats,
  type GameStats,
} from '../config/gameConfig';
import { WorldBuilder } from '../world/WorldBuilder';
import type { LevelLayout } from '../world/worldTypes';
import { getLevelLayoutCacheKey, getRequiredProjects, shouldShowCloudZones, shouldShowPlatformZones } from '../world/layoutUtils';
import { depthFromFootY, WORLD_LAYERS } from '../world/layerConfig';
import { markerToFoot, platformStandY } from '../world/worldTypes';

/**
 * GameScene — main Level 1 gameplay.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private finalBoss?: FinalBoss;
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
  private hudBg!: Phaser.GameObjects.Graphics;
  private hudTexts!: {
    kisses: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
    projects: Phaser.GameObjects.Text;
    lives: Phaser.GameObjects.Text;
    score: Phaser.GameObjects.Text;
  };
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
    const debug = shouldShowPlatformZones();
    const cloudZones = shouldShowCloudZones();

    this.physics.world.setBounds(0, 0, worldW, GAME_CONFIG.worldHeight);
    this.cameras.main.setBounds(0, 0, worldW, GAME_CONFIG.worldHeight);
    this.cameras.main.setBackgroundColor('#b8e0f5');

    const world = WorldBuilder.build(this, this.levelLayout, { debug, cloudZones });
    this.platforms = world.platforms;
    this.toggleDebug = world.toggleDebug;
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createFinalBoss();
    this.createPortal();
    this.setupCollisions();
    this.settlePlayerOnSpawn();
    this.createHUD();
    this.setupInput();

    const isMobile = shouldShowMobileControls(this.game);
    const deadzone = isMobile
      ? isLandscapeViewport()
        ? { width: 200, height: 100 }
        : GAME_CONFIG.mobileCameraDeadzone
      : GAME_CONFIG.desktopCameraDeadzone;
    this.cameras.main.startFollow(this.player, true, GAME_CONFIG.cameraLerp, GAME_CONFIG.cameraLerp);
    this.cameras.main.setDeadzone(deadzone.width, deadzone.height);
    if (isMobile && isLandscapeViewport()) {
      this.cameras.main.setFollowOffset(0, GAME_CONFIG.mobileLandscapeCameraFollowOffsetY);
    }
  }

  private createPlayer(): void {
    const foot = markerToFoot(this.levelLayout.markers.player_spawn);
    this.player = new Player(this, foot.x, foot.y);
    this.player.setDepth(depthFromFootY(foot.y, WORLD_LAYERS.player));
  }

  /** Snap feet onto platform_start once colliders exist. */
  private settlePlayerOnSpawn(): void {
    const start = this.levelLayout.platforms.find((p) => p.name === 'platform_start');
    if (!start) return;

    const x = start.x + Math.round(start.width / 2);
    const y = platformStandY(start) + 1;
    this.player.setPosition(x, y);
    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
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
    (this.levelLayout.markers.boss_spark_collectibles ?? []).forEach(({ x, y }) => {
      const spark = new Collectible(this, x, y, 'spark');
      spark.setDepth(WORLD_LAYERS.collectibles);
      this.collectibles.push(spark);
    });
  }

  private createEnemies(): void {
    this.levelLayout.markers.enemies.forEach((e) => {
      const bug = new Enemy(this, e.x, e.y, e.min, e.max);
      bug.setDepth(WORLD_LAYERS.enemies);
      this.enemies.push(bug);
    });
  }

  private createFinalBoss(): void {
    const marker = this.levelLayout.markers.final_boss;
    if (!marker) return;

    this.finalBoss = new FinalBoss(this, marker.x, marker.y, marker.min, marker.max);
    this.finalBoss.setDepth(WORLD_LAYERS.enemies + 5);
  }

  private createPortal(): void {
    const { x, y } = this.levelLayout.markers.portal_goal;
    this.portal = this.physics.add.sprite(x, y, 'portal');
    this.portal.setImmovable(true);
    (this.portal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.portal.setDepth(WORLD_LAYERS.collectibles);
    this.portal.setScale(1.2);
    this.portal.setAlpha(0.45);

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
    if (this.finalBoss) {
      this.physics.add.collider(this.finalBoss, this.platforms);
    }

    this.collectibles.forEach((item) => {
      this.physics.add.overlap(this.player, item, () => {
        if (item.isCollected() || !item.active) return;
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

    if (this.finalBoss) {
      this.physics.add.overlap(this.player, this.finalBoss, () => {
        this.handleBossContact();
      });
    }
  }

  private handleBossContact(): void {
    if (!this.finalBoss || this.finalBoss.isDefeated() || this.gameEnded) return;
    if (this.player.isInvulnerable()) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const falling = playerBody.velocity.y > 0;
    const stomping = falling && this.player.y < this.finalBoss.y - 20;

    if (stomping && this.stats.hasBossSpark) {
      this.damageBoss(true);
      return;
    }

    if (stomping && !this.stats.hasBossSpark) {
      this.showFloatingMessage('Grab the Creative Spark first!');
      return;
    }

    this.handleEnemyHit();
  }

  private damageBoss(fromStomp = false): void {
    if (!this.finalBoss || this.finalBoss.isDefeated()) return;

    if (fromStomp) {
      this.player.stompBounce();
    }

    const defeated = this.finalBoss.takeDamage(() => {
      this.onBossDefeated();
    });

    if (!defeated) {
      this.showFloatingMessage(fromStomp ? 'Boss hit!' : 'Spark kiss lands!');
    }
  }

  private onBossDefeated(): void {
    this.stats.bossDefeated = true;
    this.finalBoss = undefined;
    this.stats.kisses += 1;
    this.updateHUD();
    this.showFloatingMessage('Final boss defeated!');

    this.tweens.add({
      targets: this.portal,
      alpha: 1,
      scale: 1.35,
      duration: 500,
      yoyo: true,
      repeat: 2,
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

    this.showFloatingMessage(
      fromStomp
        ? GAME_CONFIG.combatMessages.stomp
        : GAME_CONFIG.combatMessages.kissBlow,
    );
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
    if (this.finalBoss && !this.finalBoss.isDefeated()) {
      projectile.registerBossOverlap(this.finalBoss, (_boss, proj) => {
        if (!this.stats.hasBossSpark) {
          this.showFloatingMessage('Find the Creative Spark!');
          proj.destroy();
          this.kissProjectiles = this.kissProjectiles.filter((p) => p !== proj);
          return;
        }
        this.damageBoss(false);
        proj.destroy();
        this.kissProjectiles = this.kissProjectiles.filter((p) => p !== proj);
      });
    }
    this.kissProjectiles.push(projectile);
    this.player.playKissBlow();
  }

  private handleCollectible(item: Collectible): void {
    if (item.isCollected() || !item.active || this.gameEnded) return;

    if (item.collectibleType === 'kiss') {
      this.stats.kisses += 1;
      this.stats.score += GAME_CONFIG.kissScore;
    } else if (item.collectibleType === 'spark') {
      if (!this.stats.hasBossSpark) {
        this.stats.hasBossSpark = true;
        this.stats.score += GAME_CONFIG.bossSparkScore;
        this.showFloatingMessage('Creative Spark acquired!');
      }
    } else {
      this.stats.timeRemaining += GAME_CONFIG.timerBonus;
      if (this.stats.projectsCompleted < getRequiredProjects(this.levelLayout)) {
        this.stats.projectsCompleted += 1;
      }
      const unlockedTriple = this.player.grantTripleJump();
      this.showFloatingMessage(
        unlockedTriple
          ? GAME_CONFIG.unlockMessages.tripleJump
          : Phaser.Utils.Array.GetRandom([...GAME_CONFIG.timerMessages]),
      );
    }

    item.collectEffect();
    this.collectibles = this.collectibles.filter((c) => c !== item);
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

    if (this.stats.projectsCompleted < getRequiredProjects(this.levelLayout)) {
      if (!this.portalMessage) {
        this.portalMessage = this.add
          .text(this.player.x, this.player.y - 80, GAME_CONFIG.portalBlockedMessage, {
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

    if (!this.stats.bossDefeated) {
      if (!this.portalMessage) {
        this.portalMessage = this.add
          .text(
            this.player.x,
            this.player.y - 80,
            this.stats.hasBossSpark
              ? 'Defeat the final boss to open the portal!'
              : 'Collect the Creative Spark and defeat the boss!',
            {
              fontSize: '18px',
              fontFamily: 'Nunito, sans-serif',
              color: '#ffffff',
              backgroundColor: '#ad1457cc',
              padding: { x: 14, y: 8 },
              align: 'center',
              wordWrap: { width: 280 },
            },
          )
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
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(110);

    const pad = GAME_CONFIG.safePadding;
    this.hudBg = this.add.graphics().setScrollFactor(0);

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
    this.hud.add([this.hudBg, kisses, time, projects, lives, score]);
    this.updateHUD();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutHUD, this);
    this.layoutHUD();
  }

  private drawHudBackground(cx: number, cy: number, w: number, h: number): void {
    const r = Math.min(GAME_CONFIG.hudCornerRadius, h / 2);
    this.hudBg.clear();
    this.hudBg.fillStyle(0xffffff, 0.88);
    this.hudBg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
    this.hudBg.lineStyle(2, GAME_CONFIG.colors.uiAccent, 1);
    this.hudBg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
  }

  private layoutHUD(): void {
    const isMobile = shouldShowMobileControls(this.game);
    const pad = GAME_CONFIG.safePadding;
    const safe = safeAreaInsetsInGame(this.scale);
    const vp = getUiViewport(this.scale);
    const topY =
      vp.y +
      safe.top +
      (isMobile ? vp.height * GAME_CONFIG.mobileHudTopRatio : 8);
    const barH = isMobile ? 52 : 44;
    const barW = vp.width - pad * 2 - safe.left - safe.right;
    const barCx = vp.x + vp.width / 2;
    const barCy = topY + barH / 2;

    this.drawHudBackground(barCx, barCy, barW, barH);

    if (isMobile) {
      const rowY = topY + 16;
      const innerLeft = vp.x + pad + safe.left + 8;
      const innerRight = vp.x + vp.width - pad - safe.right - 8;
      this.hudTexts.kisses.setPosition(innerLeft, rowY);
      this.hudTexts.time.setPosition(vp.x + vp.width / 2, rowY).setOrigin(0.5, 0);
      this.hudTexts.lives.setPosition(innerRight, rowY).setOrigin(1, 0);
      this.hudTexts.projects.setVisible(false);
      this.hudTexts.score.setVisible(false);
      this.hudTexts.kisses.setFontSize('18px');
      this.hudTexts.time.setFontSize('18px');
      this.hudTexts.lives.setFontSize('18px');
    } else {
      const rowY = topY + 12;
      const left = vp.x + pad + 12;
      const right = vp.x + vp.width - pad - 12;
      const center = vp.x + vp.width / 2;

      this.hudTexts.kisses.setOrigin(0, 0);
      this.hudTexts.time.setOrigin(0.5, 0);
      this.hudTexts.projects.setOrigin(0.5, 0);
      this.hudTexts.lives.setOrigin(1, 0);
      this.hudTexts.projects.setVisible(true);
      this.hudTexts.score.setVisible(false);

      this.hudTexts.kisses.setPosition(left, rowY);
      this.hudTexts.time.setPosition(center - 70, rowY);
      this.hudTexts.projects.setPosition(center + 10, rowY);
      this.hudTexts.lives.setPosition(right, rowY);
      this.hudTexts.kisses.setFontSize('16px');
      this.hudTexts.time.setFontSize('16px');
      this.hudTexts.projects.setFontSize('16px');
      this.hudTexts.lives.setFontSize('16px');
    }
  }

  private updateHUD(): void {
    const isMobile = shouldShowMobileControls(this.game);
    if (isMobile) {
      const spark = this.stats.hasBossSpark ? ' ✦' : '';
      this.hudTexts.kisses.setText(`♥ ${this.stats.kisses}${spark}`);
    } else {
      this.hudTexts.kisses.setText(`♥ ${this.stats.kisses}   Score: ${this.stats.score}`);
    }
    this.hudTexts.time.setText(`⏱ ${Math.ceil(this.stats.timeRemaining)}s`);
    this.hudTexts.projects.setText(
      `Projects: ${this.stats.projectsCompleted}/${getRequiredProjects(this.levelLayout)}`,
    );
    this.hudTexts.lives.setText(`❤ x${this.stats.lives}`);

    if (!isMobile) {
      this.hudTexts.score.setText('');
    }

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

  update(_time: number, delta: number): void {
    if (this.gameEnded) return;

    this.mobileControls?.update();

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
    };

    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      (this.mobileControls?.consumeJumpPress() ?? false);

    const kissJustDown =
      Phaser.Input.Keyboard.JustDown(this.keyA) ||
      (this.mobileControls?.consumeKissPress() ?? false);

    const highJumpHeld = this.keyX?.isDown ?? false;

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
    this.finalBoss?.update();

    this.player.setDepth(depthFromFootY(this.player.y, WORLD_LAYERS.player));

    if (this.player.y > GAME_CONFIG.worldHeight + 50) {
      this.endGame('fall');
    }
  }

  shutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutHUD, this);
    this.mobileControls?.destroy();
  }
}
