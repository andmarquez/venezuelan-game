import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import type { WorldManifest } from '../world/worldTypes';

/**
 * BootScene — loads Figma world background + generates gameplay placeholders.
 */
export class BootScene extends Phaser.Scene {
  private worldManifest: WorldManifest | null = null;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.json('world-manifest', '/assets/world/manifest.json');
    this.load.json('level-1-layout-mobile', '/assets/world/level-1/layout-mobile.json');
    this.load.json('level-1-layout-desktop', '/assets/world/level-1/layout-desktop.json');
  }

  create(): void {
    this.worldManifest = this.cache.json.get('world-manifest') as WorldManifest | null;
    this.loadWorldBackgrounds(() => {
      this.generatePlaceholderTextures();
      this.registry.set('worldManifest', this.worldManifest);
      this.scene.start('MenuScene');
    });
  }

  /** Load exported Figma background PNGs listed in manifest (skip missing files). */
  private loadWorldBackgrounds(onComplete: () => void): void {
    const backgrounds = this.worldManifest?.backgrounds ?? {};
    const entries = Object.values(backgrounds).filter((b) => b.present);

    if (entries.length === 0) {
      onComplete();
      return;
    }

    entries.forEach((entry) => {
      this.load.image(entry.key, entry.path);
    });

    this.load.once('complete', onComplete);
    this.load.start();
  }

  getWorldManifest(): WorldManifest | null {
    return this.worldManifest;
  }

  private generatePlaceholderTextures(): void {
    this.createPlayerTextures();
    this.createEnemyTexture();
    this.createKissTexture();
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

      g.generateTexture(`andsiosa-${state}`, w, h);
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

  private createKissTexture(): void {
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
    const g = this.make.graphics({ x: 0, y: 0 });
    const portal = GAME_CONFIG.colors.portal;
    const glow = GAME_CONFIG.colors.portalGlow;

    g.fillStyle(glow, 0.4);
    g.fillEllipse(40, 56, 72, 80);
    g.fillStyle(portal, 0.8);
    g.fillEllipse(40, 56, 56, 64);
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(40, 50, 30, 36);
    g.fillStyle(0xffffff, 1);
    this.drawStar(g, 20, 20, 4, 3, 1.5);
    this.drawStar(g, 60, 30, 4, 3, 1.5);
    this.drawStar(g, 40, 10, 4, 2, 1);

    g.generateTexture('portal', 80, 80);
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
