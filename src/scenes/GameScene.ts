import Phaser from 'phaser';
import { getSoundManager, bindSceneAudioUnlock } from '../audio/SoundManager';
import { isNativeMusicPlaying } from '../audio/nativeAudio';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { FinalBoss } from '../objects/FinalBoss';
import { Collectible } from '../objects/Collectible';
import { KissProjectile } from '../objects/KissProjectile';
import { PortalMagicEffects } from '../objects/PortalMagicEffects';
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
import {
  getLevelLayoutCacheKey,
  getRequiredProjects,
  getSelectedLevelId,
  shouldShowCloudZones,
  shouldShowPlatformZones,
} from '../world/layoutUtils';
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
  private portalFx?: PortalMagicEffects;
  private mobileControls?: MobileControls;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private kissProjectiles: KissProjectile[] = [];
  private lastKissBlowTime = 0;
  private lastBossDamageAt = 0;
  private lastFallRescueAt = 0;

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
    const worldH = this.levelLayout?.height ?? GAME_CONFIG.worldHeight;
    const debug = shouldShowPlatformZones();
    const cloudZones = shouldShowCloudZones();
    this.game.registry.set('currentLevel', getSelectedLevelId(this.game));

    // Tall vertical maps need extra climb time; Level 1 keeps the default.
    if (getSelectedLevelId(this.game) === 'level-2') {
      this.stats.timeRemaining = Math.max(this.stats.timeRemaining, 180);
    }

    this.physics.world.setBounds(0, 0, worldW, worldH, true, true, true, false);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
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
    const isVerticalClimb = getSelectedLevelId(this.game) === 'level-2';
    const climbCam = GAME_CONFIG.verticalClimbCamera;
    const deadzone = isVerticalClimb
      ? climbCam.deadzone
      : isMobile
        ? isLandscapeViewport()
          ? { width: 200, height: 100 }
          : GAME_CONFIG.mobileCameraDeadzone
        : GAME_CONFIG.desktopCameraDeadzone;
    const lerp = isVerticalClimb ? climbCam.lerp : GAME_CONFIG.cameraLerp;
    this.cameras.main.startFollow(this.player, true, lerp, lerp);
    this.cameras.main.setDeadzone(deadzone.width, deadzone.height);
    if (isVerticalClimb) {
      // Player sits lower; more of the climb route stays visible above.
      this.cameras.main.setFollowOffset(0, climbCam.followOffsetY);
    } else if (isMobile && isLandscapeViewport()) {
      this.cameras.main.setFollowOffset(0, GAME_CONFIG.mobileLandscapeCameraFollowOffsetY);
    }

    bindSceneAudioUnlock(this);
    this.sound.pauseOnBlur = false;

    if (!isNativeMusicPlaying()) {
      const sound = getSoundManager(this.game);
      sound?.unlock(this);
      sound?.playMusic('music-game', this);
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
    (this.levelLayout.markers.virgen_collectibles ?? []).forEach(({ x, y }) => {
      const virgen = new Collectible(this, x, y, 'virgen');
      virgen.setDepth(WORLD_LAYERS.collectibles);
      this.collectibles.push(virgen);
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
    const marker = this.levelLayout.markers.portal_goal;
    const size = marker.size ?? GAME_CONFIG.portalDisplaySize;
    this.portalFx = new PortalMagicEffects(this, {
      x: marker.x,
      y: marker.y,
      size,
    });
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

    this.physics.add.overlap(this.player, this.portalFx!.zone, () => {
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
    const stomping = this.finalBoss.isStompHit(this.player.x, this.player.y, falling);

    if (stomping && this.stats.hasVirgenBlessing) {
      this.damageBoss(true);
      return;
    }

    if (stomping && !this.stats.hasVirgenBlessing) {
      this.showFloatingMessage(GAME_CONFIG.blessingMessages.goGetBlessing);
      return;
    }

    this.handleEnemyHit();
  }

  private damageBoss(fromStomp = false): void {
    if (!this.finalBoss || this.finalBoss.isDefeated()) return;
    if (this.time.now - this.lastBossDamageAt < 280) return;
    this.lastBossDamageAt = this.time.now;

    if (fromStomp) {
      this.player.stompBounce();
    }

    const defeated = this.finalBoss.takeDamage(() => {
      this.onBossDefeated();
    });

    if (!defeated) {
      this.showFloatingMessage(fromStomp ? 'Boss hit!' : 'Blessed kiss lands!');
    }
  }

  private onBossDefeated(): void {
    this.stats.bossDefeated = true;
    this.finalBoss = undefined;
    this.stats.kisses += 1;
    this.updateHUD();
    this.showFloatingMessage('Final boss defeated!');

    this.portalFx?.celebrate();
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

    if (this.stats.hasVirgenBlessing) {
      getSoundManager(this.game)?.play('sfx-spark', this);
      this.convertEnemyToHeart(enemy, false);
      this.showFloatingMessage(GAME_CONFIG.blessingMessages.smiteBug);
      return;
    }

    this.handleEnemyHit();
  }

  private convertEnemyToHeart(enemy: Enemy, fromStomp = false): void {
    if (!enemy.active || enemy.isConverted()) return;

    if (fromStomp) {
      this.player.stompBounce();
      getSoundManager(this.game)?.play('sfx-stomp', this);
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
    getSoundManager(this.game)?.play('sfx-kiss', this, { volume: 0.4 });

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

  private checkKissBossHits(): void {
    if (!this.finalBoss || this.finalBoss.isDefeated()) return;

    for (const proj of this.kissProjectiles) {
      if (!proj.active || proj.wasBossHit()) continue;
      if (!this.finalBoss.isKissHit(proj.x, proj.y)) continue;
      this.handleKissBossHit(proj);
    }
  }

  private handleKissBossHit(proj: KissProjectile): void {
    proj.markBossHit();
    if (!this.stats.hasVirgenBlessing) {
      this.showFloatingMessage(GAME_CONFIG.blessingMessages.goGetBlessing);
      proj.destroy();
      this.kissProjectiles = this.kissProjectiles.filter((p) => p !== proj);
      return;
    }

    this.damageBoss(false);
    proj.destroy();
    this.kissProjectiles = this.kissProjectiles.filter((p) => p !== proj);
  }

  private handleCollectible(item: Collectible): void {
    if (item.isCollected() || !item.active || this.gameEnded) return;

    if (item.collectibleType === 'kiss') {
      this.stats.kisses += 1;
      this.stats.score += GAME_CONFIG.kissScore;
      getSoundManager(this.game)?.play('sfx-collect', this);
    } else if (item.collectibleType === 'virgen') {
      if (!this.stats.hasVirgenBlessing) {
        this.stats.hasVirgenBlessing = true;
        this.stats.score += GAME_CONFIG.virgenBlessingScore;
        getSoundManager(this.game)?.play('sfx-spark', this);
        this.showFloatingMessage(GAME_CONFIG.blessingMessages.blessed);
        this.player.setBlessedGlow(true);
      }
    } else {
      this.stats.timeRemaining += GAME_CONFIG.timerBonus;
      getSoundManager(this.game)?.play('sfx-timer', this);
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

    getSoundManager(this.game)?.play('sfx-hurt', this);
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
            this.stats.hasVirgenBlessing
              ? GAME_CONFIG.blessingMessages.defeatBoss
              : GAME_CONFIG.blessingMessages.needBlessingForBoss,
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
    getSoundManager(this.game)?.stopMusic(this);
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
    getSoundManager(this.game)?.stopMusic(this);
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

    // Figma HUD 13:3 — Kiss Pink labels on dark pill
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '14px',
      fontFamily: 'Nunito, Inter, sans-serif',
      color: '#e91e63',
      fontStyle: 'bold',
    };

    const kisses = this.add.text(pad + 8, pad + 8, '', style).setScrollFactor(0);
    const time = this.add
      .text(GAME_CONFIG.width / 2, pad + 8, '', { ...style, fontSize: '30px', fontStyle: '600' })
      .setScrollFactor(0)
      .setOrigin(0.5, 0.5);
    const projects = this.add
      .text(GAME_CONFIG.width / 2 + 80, pad + 8, '', style)
      .setScrollFactor(0)
      .setVisible(false);
    const lives = this.add
      .text(GAME_CONFIG.width - pad - 120, pad + 8, '', style)
      .setScrollFactor(0);
    const score = this.add
      .text(pad + 8, pad + 30, '', style)
      .setScrollFactor(0)
      .setVisible(false);

    this.hudTexts = { kisses, time, projects, lives, score };
    this.hud.add([this.hudBg, kisses, time, projects, lives, score]);
    this.updateHUD();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutHUD, this);
    this.layoutHUD();
  }

  private drawHudBackground(cx: number, cy: number, w: number, h: number): void {
    const r = Math.min(GAME_CONFIG.hudCornerRadius, h / 2);
    this.hudBg.clear();
    // No stroke — Figma HUD is fill-only (white at low alpha).
    this.hudBg.lineStyle(0, 0x000000, 0);
    this.hudBg.fillStyle(GAME_CONFIG.colors.hudBg, GAME_CONFIG.colors.hudBgAlpha);
    this.hudBg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
  }

  private layoutHUD(): void {
    const isMobile = shouldShowMobileControls(this.game);
    const pad = GAME_CONFIG.safePadding;
    const safe = safeAreaInsetsInGame(this.scale);
    const vp = getUiViewport(this.scale);
    // Figma HUD 13:3 — x=16, y=106, w=1248, h=52 on 1280×720
    const topY =
      vp.y +
      safe.top +
      (isMobile ? vp.height * GAME_CONFIG.mobileHudTopRatio : 8);
    const barH = isMobile ? GAME_CONFIG.hudBarHeight : 44;
    const barW = vp.width - pad * 2 - safe.left - safe.right;
    const barCx = vp.x + vp.width / 2;
    const barCy = topY + barH / 2;

    this.drawHudBackground(barCx, barCy, barW, barH);

    // Figma insets inside the bar: left text x≈67, right text ~x=1139 of 1248
    const innerLeft = vp.x + pad + safe.left + (isMobile ? 51 : 12);
    const innerRight = vp.x + vp.width - pad - safe.right - (isMobile ? 51 : 12);
    const scale = vp.width / GAME_CONFIG.width;
    const sideSize = Math.max(12, Math.round(14 * scale));
    const timerSize = Math.max(18, Math.round((isMobile ? 30 : 22) * scale));

    this.hudTexts.kisses.setOrigin(0, 0.5).setPosition(innerLeft, barCy).setFontSize(`${sideSize}px`);
    this.hudTexts.time
      .setOrigin(0.5, 0.5)
      .setPosition(barCx, barCy)
      .setFontSize(`${timerSize}px`);
    this.hudTexts.lives.setOrigin(1, 0.5).setPosition(innerRight, barCy).setFontSize(`${sideSize}px`);
    this.hudTexts.projects.setVisible(false);
    this.hudTexts.score.setVisible(false);
  }

  private updateHUD(): void {
    const blessing = this.stats.hasVirgenBlessing ? ' ✧' : '';
    // Figma HUD 13:4 — kisses + score on the left
    this.hudTexts.kisses.setText(
      `♥ ${this.stats.kisses}${blessing}   Score: ${this.stats.score}`,
    );
    // Figma HUD 13:5 — plain seconds, no clock emoji
    this.hudTexts.time.setText(`${Math.ceil(this.stats.timeRemaining)}s`);
    this.hudTexts.projects.setText(
      `Projects: ${this.stats.projectsCompleted}/${getRequiredProjects(this.levelLayout)}`,
    );
    this.hudTexts.lives.setText(`❤ x${this.stats.lives}`);
    this.hudTexts.score.setText('');

    if (this.stats.timeRemaining <= 10) {
      this.hudTexts.time.setColor('#ff8a80');
    } else {
      this.hudTexts.time.setColor('#e91e63');
    }
    this.hudTexts.kisses.setColor('#e91e63');
    this.hudTexts.lives.setColor('#e91e63');
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
    this.finalBoss?.update(_time, delta);
    this.checkKissBossHits();

    this.player.setDepth(depthFromFootY(this.player.y, WORLD_LAYERS.player));

    const fallDeathY = (this.levelLayout?.height ?? GAME_CONFIG.worldHeight) + 50;
    if (this.player.y > fallDeathY) {
      if (this.stats.hasVirgenBlessing) {
        if (this.time.now - this.lastFallRescueAt > 800) {
          this.lastFallRescueAt = this.time.now;
          this.rescuePlayerFromFall();
        }
        return;
      }
      this.endGame('fall');
    }
  }

  /** Blessed players are lifted to the nearest platform instead of dying from a fall. */
  private rescuePlayerFromFall(): void {
    const point = this.findClosestPlatformRescuePoint();
    this.player.setPosition(point.x, point.y);
    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    getSoundManager(this.game)?.play('sfx-spark', this);
  }

  private findClosestPlatformRescuePoint(): { x: number; y: number } {
    const px = this.player.x;
    const py = this.player.y;
    const spawn = this.levelLayout.markers.player_spawn;
    let best: { x: number; y: number } | null = null;
    let bestDistSq = Infinity;

    for (const platform of this.levelLayout.platforms) {
      const standY = platformStandY(platform) + 1;
      const minX = platform.x + 12;
      const maxX = platform.x + platform.width - 12;
      const standX = Phaser.Math.Clamp(px, minX, maxX);
      const dx = standX - px;
      const dy = standY - py;
      const distSq = dx * dx + dy * dy;

      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = { x: standX, y: standY };
      }
    }

    if (best) return best;

    const start = this.levelLayout.platforms.find((p) => p.name === 'platform_start');
    return {
      x: start ? start.x + Math.round(start.width / 2) : spawn.x,
      y: start ? platformStandY(start) + 1 : spawn.y,
    };
  }

  shutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutHUD, this);
    this.mobileControls?.destroy();
  }
}
