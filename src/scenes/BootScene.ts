import Phaser from 'phaser';
import { initNativeAudio } from '../audio/nativeAudio';
import { SoundManager } from '../audio/SoundManager';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  cacheGameOverLayout,
  GAME_OVER_LAYOUT_CACHE_KEY,
  GAME_OVER_LOTTIE_CACHE_KEY,
  resolveGameOverLayout,
  shouldPreviewGameOver,
  type GameOverLayoutJson,
} from '../ui/gameOverScreenConfig';
import type { LevelLayout, WorldManifest } from '../world/worldTypes';
import { assetUrl } from '../utils/assetUrl';

/**
 * BootScene — loads Figma world background + generates gameplay placeholders.
 */
export class BootScene extends Phaser.Scene {
  private worldManifest: WorldManifest | null = null;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const v = GAME_CONFIG.worldAssetVersion;
    const cv = GAME_CONFIG.characterAssetVersion;
    this.load.json('world-manifest', assetUrl('assets/world/manifest.json', v));
    this.load.json('level-1-layout-mobile', assetUrl('assets/world/level-1/layout-mobile.json', v));
    this.load.json('level-1-layout-desktop', assetUrl('assets/world/level-1/layout-desktop.json', v));

    const singleFrameStates = ['idle', 'jump', 'fall', 'hurt', 'victory'] as const;
    singleFrameStates.forEach((state) => {
      this.load.image(`andsiosa-${state}`, assetUrl(`assets/character/andsiosa-${state}.png`, cv));
    });
    this.load.spritesheet('andsiosa-run', assetUrl('assets/character/andsiosa-run.png', cv), {
      frameWidth: 144,
      frameHeight: 192,
    });

    const ev = GAME_CONFIG.enemyAssetVersion;
    this.load.image('deadline-bug', assetUrl('assets/enemy/deadline-bug.png', ev));
    this.load.image('final-boss', assetUrl('assets/enemy/final-boss.png', ev));

    const sv = GAME_CONFIG.screenAssetVersion;
    const screenAssets = [
      'menu-start',
      'game-over-screen',
      'win-screen',
    ] as const;
    screenAssets.forEach((key) => {
      this.load.image(`screen-${key}`, assetUrl(`assets/ui/screens/${key}.png`, sv));
    });
    this.load.json(
      GAME_OVER_LAYOUT_CACHE_KEY,
      assetUrl('assets/ui/screens/game-over-screen-layout.json', sv),
    );
    this.load.json(
      GAME_OVER_LOTTIE_CACHE_KEY,
      assetUrl('assets/ui/screens/game-over-screen-playful.json', sv),
    );

    const colv = GAME_CONFIG.collectibleAssetVersion;
    const collectibleImages = [
      { key: 'kiss', path: 'assets/collectibles/sheets/kiss-static.png' },
      { key: 'timer', path: 'assets/collectibles/sheets/timer-static.png' },
      { key: 'virgen', path: 'assets/collectibles/sheets/virgen-static.png' },
    ] as const;
    collectibleImages.forEach(({ key, path }) => {
      this.load.image(key, assetUrl(path, colv));
    });

    const av = GAME_CONFIG.audioAssetVersion;
    const audioAssets = [
      { key: 'sfx-jump', path: 'assets/audio/sfx_jump.mp3' },
      { key: 'sfx-collect', path: 'assets/audio/sfx_coin.mp3' },
      { key: 'sfx-timer', path: 'assets/audio/sfx_gem.mp3' },
      { key: 'sfx-spark', path: 'assets/audio/sfx_magic.mp3' },
      { key: 'sfx-stomp', path: 'assets/audio/sfx_bump.mp3' },
      { key: 'sfx-hurt', path: 'assets/audio/sfx_hurt.mp3' },
      { key: 'sfx-select', path: 'assets/audio/sfx_select.mp3' },
      { key: 'sfx-game-over', path: 'assets/audio/sfx_disappear.mp3' },
      { key: 'sfx-kiss', path: 'assets/audio/sfx_throw.mp3' },
      { key: 'music-game', path: 'assets/audio/gaita-de-furro.mp3' },
    ] as const;
    audioAssets.forEach(({ key, path }) => {
      this.load.audio(key, assetUrl(path, av));
    });
  }

  create(): void {
    this.applyCharacterTextureFilters();
    this.applyEnemyTextureFilters();
    this.applyScreenTextureFilters();
    this.applyCollectibleTextureFilters();
    this.worldManifest = this.cache.json.get('world-manifest') as WorldManifest | null;
    this.loadWorldAssets(() => {
      this.generatePlaceholderTextures();
      this.registry.set('worldManifest', this.worldManifest);
      if (!this.registry.get('soundManager')) {
        initNativeAudio();
        this.registry.set('soundManager', new SoundManager(this.game));
      }
      this.applyGameOverLayoutConfig();
      if (shouldPreviewGameOver()) {
        this.scene.start('GameOverScene', { reason: 'time', score: 1200, kisses: 8 });
        return;
      }
      this.scene.start('MenuScene');
    });
  }

  /** Smooth scaling for 3× character exports on high-DPI phones. */
  private applyCharacterTextureFilters(): void {
    const keys = ['andsiosa-idle', 'andsiosa-run', 'andsiosa-jump', 'andsiosa-fall', 'andsiosa-hurt', 'andsiosa-victory'];
    for (const key of keys) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  /** Smooth scaling for enemy exports on high-DPI phones. */
  private applyEnemyTextureFilters(): void {
    for (const key of ['deadline-bug', 'final-boss']) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  /** Smooth scaling for Figma screen art on high-DPI phones. */
  private applyGameOverLayoutConfig(): void {
    const raw = this.cache.json.get(GAME_OVER_LAYOUT_CACHE_KEY) as GameOverLayoutJson | null;
    cacheGameOverLayout(this.game, resolveGameOverLayout(raw));
  }

  /** Smooth scaling for Figma screen art on high-DPI phones. */
  private applyScreenTextureFilters(): void {
    for (const key of [
      'screen-menu-start',
      'screen-game-over-screen',
      'screen-win-screen',
    ]) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  /** Smooth scaling for Figma collectible art on high-DPI phones. */
  private applyCollectibleTextureFilters(): void {
    for (const key of ['kiss', 'timer', 'virgen']) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  /** Load Figma background PNGs + platform art sprites from layout JSON. */
  private loadWorldAssets(onComplete: () => void): void {
    const backgrounds = this.worldManifest?.backgrounds ?? {};
    const bgEntries = Object.values(backgrounds).filter((b) => b.present);

    const mobile = this.cache.json.get('level-1-layout-mobile') as LevelLayout | null;
    const desktop = this.cache.json.get('level-1-layout-desktop') as LevelLayout | null;
    const artByKey = new Map<string, string>();
    for (const layout of [mobile, desktop]) {
      for (const art of layout?.platformArt ?? []) {
        if (!artByKey.has(art.key)) artByKey.set(art.key, art.path);
      }
    }

    if (bgEntries.length === 0 && artByKey.size === 0) {
      onComplete();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      timeout.remove(false);
      onComplete();
    };

    const timeout = this.time.delayedCall(12000, () => {
      console.warn('[BootScene] World asset load timed out — continuing to menu.');
      finish();
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[BootScene] Failed to load asset:', file.key);
    });

    const v = GAME_CONFIG.worldAssetVersion;
    bgEntries.forEach((entry) => {
      const path = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
      this.load.image(entry.key, assetUrl(path, v));
    });

    artByKey.forEach((assetPath, key) => {
      const path = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
      this.load.image(key, assetUrl(path, v));
    });

    this.load.once('complete', finish);
    this.load.start();
  }

  getWorldManifest(): WorldManifest | null {
    return this.worldManifest;
  }

  private generatePlaceholderTextures(): void {
    this.createPlayerTextures();
    this.createEnemyTexture();
    this.createFinalBossTexture();
    this.createKissTexture();
    this.createVirgenTexture();
    this.createTimerTexture();
    this.createPortalTexture();
    this.createParticleTexture();
    this.createPlatformTexture();
  }

  /** Andsiosa placeholder — red flat-vector style character */
  private createPlayerTextures(): void {
    const states = ['idle', 'run', 'jump', 'fall', 'hurt', 'victory'] as const;
    const w = 48;
    const h = 64;

    states.forEach((state) => {
      const key = `andsiosa-${state}`;
      if (this.textures.exists(key)) return;

      const g = this.make.graphics({ x: 0, y: 0 });
      const red = GAME_CONFIG.colors.playerRed;
      const white = GAME_CONFIG.colors.playerWhite;
      const hair = GAME_CONFIG.colors.playerHair;

      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(6, 56, 14, 6, 2);
      g.fillRoundedRect(28, 56, 14, 6, 2);
      g.fillStyle(0x212121, 1);
      g.fillRect(6, 58, 14, 2);
      g.fillRect(28, 58, 14, 2);

      g.fillStyle(white, 1);
      g.fillRoundedRect(10, 40, 12, 18, 3);
      g.fillRoundedRect(26, 40, 12, 18, 3);

      g.fillStyle(red, 1);
      g.fillRoundedRect(12, 30, 24, 16, 4);

      g.fillStyle(white, 1);
      g.fillRoundedRect(14, 22, 20, 12, 3);

      g.fillStyle(0xffccbc, 1);
      g.fillCircle(24, 16, 12);

      g.fillStyle(hair, 1);
      g.fillRoundedRect(10, 4, 28, 14, 6);
      g.fillRect(10, 10, 28, 6);

      g.lineStyle(2, 0x5d4037, 1);
      g.beginPath();
      g.arc(18, 16, 3, 0.2, Math.PI - 0.2, false);
      g.strokePath();
      g.beginPath();
      g.arc(30, 16, 3, 0.2, Math.PI - 0.2, false);
      g.strokePath();

      g.beginPath();
      g.arc(24, 20, 5, 0.3, Math.PI - 0.3, false);
      g.strokePath();

      if (state === 'run') {
        g.fillStyle(red, 0.5);
        g.fillEllipse(4, 48, 6, 4);
        g.fillEllipse(44, 48, 6, 4);
      }
      if (state === 'jump' || state === 'fall') {
        g.fillStyle(red, 0.4);
        g.fillTriangle(0, 30, 8, 34, 0, 38);
        g.fillTriangle(48, 30, 40, 34, 48, 38);
      }
      if (state === 'hurt') {
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(24, 16, 14);
      }
      if (state === 'victory') {
        g.fillStyle(0xffeb3b, 1);
        this.drawStar(g, 24, 0, 4, 4, 2);
      }

      g.generateTexture(key, w, h);
      g.destroy();
    });
  }

  private createEnemyTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const body = GAME_CONFIG.colors.enemy;
    const accent = GAME_CONFIG.colors.enemyAccent;

    g.fillStyle(body, 1);
    g.fillEllipse(20, 18, 32, 24);
    g.fillStyle(accent, 1);
    g.fillCircle(12, 14, 4);
    g.fillCircle(28, 14, 4);
    g.fillStyle(0xff5252, 1);
    g.fillCircle(12, 14, 2);
    g.fillCircle(28, 14, 2);
    g.lineStyle(2, accent, 1);
    g.lineBetween(14, 8, 10, 0);
    g.lineBetween(26, 8, 30, 0);
    g.fillStyle(0xffab91, 1);
    g.fillCircle(10, 0, 3);
    g.fillCircle(30, 0, 3);
    for (let i = 0; i < 3; i++) {
      g.lineBetween(10 + i * 10, 30, 6 + i * 10, 38);
      g.lineBetween(10 + i * 10, 30, 14 + i * 10, 38);
    }

    g.generateTexture('deadline-bug', 40, 40);
    g.destroy();
  }

  /** Final boss — larger deadline overlord guarding the portal */
  private createFinalBossTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const body = GAME_CONFIG.colors.bossBody;
    const accent = GAME_CONFIG.colors.bossAccent;
    const glow = GAME_CONFIG.colors.bossGlow;

    g.fillStyle(glow, 0.35);
    g.fillEllipse(40, 36, 72, 56);
    g.fillStyle(body, 1);
    g.fillEllipse(40, 38, 60, 48);
    g.fillStyle(accent, 1);
    g.fillCircle(24, 30, 8);
    g.fillCircle(56, 30, 8);
    g.fillStyle(0xff5252, 1);
    g.fillCircle(24, 30, 4);
    g.fillCircle(56, 30, 4);
    g.lineStyle(3, accent, 1);
    g.lineBetween(20, 18, 12, 2);
    g.lineBetween(60, 18, 68, 2);
    g.fillStyle(0xffab91, 1);
    g.fillCircle(12, 2, 5);
    g.fillCircle(68, 2, 5);
    g.fillStyle(0x212121, 1);
    g.fillRoundedRect(28, 48, 24, 8, 3);
    for (let i = 0; i < 4; i++) {
      g.lineBetween(16 + i * 16, 58, 10 + i * 16, 72);
      g.lineBetween(16 + i * 16, 58, 22 + i * 16, 72);
    }
    g.fillStyle(0xffffff, 0.85);
    this.drawStar(g, 40, 8, 5, 7, 3);

    g.generateTexture('final-boss', 80, 80);
    g.destroy();
  }

  /** Virgen blessing sphere — required to damage the final boss */
  private createVirgenTexture(): void {
    if (this.textures.exists('virgen')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(GAME_CONFIG.colors.virgenGlow, 0.55);
    g.fillCircle(18, 18, 16);
    g.fillStyle(GAME_CONFIG.colors.virgen, 1);
    g.fillCircle(18, 18, 12);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(14, 14, 3);
    g.generateTexture('virgen', 36, 36);
    g.destroy();
  }

  private createKissTexture(): void {
    if (this.textures.exists('kiss')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(GAME_CONFIG.colors.kissGlow, 0.5);
    g.fillCircle(16, 16, 14);
    g.fillStyle(GAME_CONFIG.colors.kiss, 1);
    g.fillEllipse(16, 14, 14, 10);
    g.fillStyle(0xf48fb1, 1);
    g.fillEllipse(12, 12, 5, 4);
    g.fillEllipse(20, 12, 5, 4);
    g.generateTexture('kiss', 32, 32);
    g.destroy();
  }

  private createTimerTexture(): void {
    if (this.textures.exists('timer')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(GAME_CONFIG.colors.timerGlow, 0.6);
    g.fillCircle(18, 18, 16);
    g.fillStyle(GAME_CONFIG.colors.timer, 1);
    g.fillCircle(18, 18, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(18, 18, 9);
    g.lineStyle(2, 0x5d4037, 1);
    g.lineBetween(18, 18, 18, 10);
    g.lineBetween(18, 18, 24, 18);
    g.fillStyle(GAME_CONFIG.colors.timer, 1);
    g.fillRect(12, 28, 4, 4);
    g.fillRect(20, 28, 4, 4);
    g.generateTexture('timer', 36, 36);
    g.destroy();
  }

  private createPortalTexture(): void {
    const size = GAME_CONFIG.portalDisplaySize;
    const g = this.make.graphics({ x: 0, y: 0 });
    const portal = GAME_CONFIG.colors.portal;
    const glow = GAME_CONFIG.colors.portalGlow;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 2;

    g.fillStyle(glow, 0.35);
    g.fillCircle(cx, cy, radius + 6);
    g.fillStyle(portal, 0.55);
    g.fillCircle(cx, cy, radius);
    g.lineStyle(2, portal, 1);
    g.strokeCircle(cx, cy, radius);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(cx - radius * 0.22, cy - radius * 0.22, radius * 0.18);

    g.generateTexture('portal', size, size);
    g.destroy();
  }

  private createParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  private createPlatformTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(GAME_CONFIG.colors.platform, 1);
    g.fillRoundedRect(0, 8, 64, 24, 8);
    g.fillStyle(GAME_CONFIG.colors.platformTop, 1);
    g.fillRoundedRect(0, 0, 64, 16, 8);
    g.generateTexture('platform-tile', 64, 32);
    g.destroy();
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    points: number,
    outer: number,
    inner: number,
  ): void {
    const step = Math.PI / points;
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = i * step - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
  }
}
