import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { isLandscapeViewport } from './viewportMetrics';
import { getUiViewport, type UiViewport } from './viewportLayout';

/** Figma M03/M04 — landscape 1280×720 artboard coordinates. */
export const END_SCREEN = {
  designW: GAME_CONFIG.width,
  designH: GAME_CONFIG.height,
  gameOver: {
    bg: 0xfce4ec,
    reasonY: 143,
    reasonSize: 23,
    reasonColor: '#880e4f',
    titleY: 349,
    titleMaxW: 568,
    statsY: 321,
    statsW: 309,
    statsH: 55,
    statsBg: 0xfffaa3,
    statsTextColor: '#3744a4',
    statsTextSize: 22,
    characterY: 543,
    characterW: 184,
    characterH: 246,
    platformY: 685,
    platformW: 274,
    platformH: 88,
    ctaY: 383,
    ctaW: 177,
    ctaH: 47,
    ctaColor: 0x0168f0,
    ctaHover: 0x0156c7,
    ctaRadius: 24,
    ctaTextSize: 22,
    ctaLabel: 'Try Again',
  },
  win: {
    gradientTop: 0xfff5dc,
    gradientBottom: 0xd6eaf8,
    titleY: 309,
    titleMaxW: 547,
    characterX: 674,
    characterY: 374,
    characterW: 178,
    characterH: 227,
    statsY: 523,
    statsW: 309,
    statsH: 55,
    statsBg: 0x3744a4,
    statsTextColor: '#ffffff',
    statsTextSize: 22,
    ctaY: 593,
    ctaW: 175,
    ctaH: 49,
    ctaColor: 0xfc72ac,
    ctaHover: 0xe91e63,
    ctaRadius: 44,
    ctaTextSize: 22,
    ctaLabel: 'Play Again',
    /** Nudge cover-fit art down (design px) so top title isn't cropped on phones. */
    artShiftY: 72,
  },
} as const;

const FONT_BODY = 'Inter, Nunito, system-ui, sans-serif';

export type ScreenLayout = {
  vp: UiViewport;
  cx: number;
  cy: number;
  /** Uniform contain scale — fits design in visible area without squish. */
  scale: number;
  landscape: boolean;
  mapY: (designY: number) => number;
  mapX: (designX: number) => number;
};

/** Cover-fit layout — fills viewport like MenuScene splash (no letterbox bars). */
export function getCoverScreenLayout(scene: Phaser.Scene, shiftDesignY = 0): ScreenLayout {
  const vp = getUiViewport(scene.scale);
  const landscape = isLandscapeViewport();
  const scaleX = vp.width / GAME_CONFIG.width;
  const scaleY = vp.height / GAME_CONFIG.height;
  const scale = Math.max(scaleX, scaleY);

  const contentW = GAME_CONFIG.width * scale;
  const contentH = GAME_CONFIG.height * scale;
  const offsetX = vp.x + (vp.width - contentW) / 2;
  const offsetY = vp.y + (vp.height - contentH) / 2 + shiftDesignY * scale;

  return {
    vp,
    cx: offsetX + contentW / 2,
    cy: offsetY + contentH / 2,
    scale,
    landscape,
    mapY: (designY: number) => offsetY + designY * scale,
    mapX: (designX: number) => offsetX + designX * scale,
  };
}

/** Responsive layout for static screens (portrait gate hides content until landscape). */
export function getScreenLayout(scene: Phaser.Scene): ScreenLayout {
  const vp = getUiViewport(scene.scale);
  const landscape = isLandscapeViewport();
  const scaleX = vp.width / GAME_CONFIG.width;
  const scaleY = vp.height / GAME_CONFIG.height;
  const scale = Math.min(scaleX, scaleY);

  const contentW = GAME_CONFIG.width * scale;
  const contentH = GAME_CONFIG.height * scale;
  const offsetX = vp.x + (vp.width - contentW) / 2;
  const offsetY = vp.y + (vp.height - contentH) / 2;

  return {
    vp,
    cx: offsetX + contentW / 2,
    cy: offsetY + contentH / 2,
    scale,
    landscape,
    mapY: (designY: number) => offsetY + designY * scale,
    mapX: (designX: number) => offsetX + designX * scale,
  };
}

export function getFullScreenRect() {
  const w = GAME_CONFIG.width;
  const h = GAME_CONFIG.height;
  return { width: w, height: h, cx: w / 2, cy: h / 2 };
}

export function layoutCoverScreenBackground(
  scene: Phaser.Scene,
  textureKey: string,
  depth = 0,
  shiftDesignY = 0,
): ScreenLayout {
  const layout = getCoverScreenLayout(scene, shiftDesignY);
  const bg = scene.add
    .image(layout.cx, layout.cy, textureKey)
    .setScrollFactor(0)
    .setDepth(depth);
  coverFitImage(bg, layout.vp.width, layout.vp.height);
  return layout;
}

export function coverFitImage(
  image: Phaser.GameObjects.Image,
  targetW: number,
  targetH: number,
): void {
  const fw = image.frame.width;
  const fh = image.frame.height;
  if (!fw || !fh) return;
  image.setScale(Math.max(targetW / fw, targetH / fh));
}

export function fitImageToSize(
  image: Phaser.GameObjects.Image,
  maxW: number,
  maxH: number,
): void {
  const frame = image.frame;
  if (!frame.width || !frame.height) return;
  image.setScale(Math.min(maxW / frame.width, maxH / frame.height));
}

export function addViewportBackground(
  scene: Phaser.Scene,
  color: number,
  vp: UiViewport,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(vp.x + vp.width / 2, vp.y + vp.height / 2, vp.width, vp.height, color)
    .setScrollFactor(0)
    .setDepth(0);
}

export function addEndScreenBackground(
  scene: Phaser.Scene,
  color: number,
  layout: ScreenLayout,
): Phaser.GameObjects.Rectangle {
  const w = GAME_CONFIG.width * layout.scale;
  const h = GAME_CONFIG.height * layout.scale;
  return scene.add
    .rectangle(layout.cx, layout.cy, w, h, color)
    .setScrollFactor(0)
    .setDepth(0);
}

export function addViewportWinGradient(
  scene: Phaser.Scene,
  vp: UiViewport,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(0);
  g.fillGradientStyle(
    END_SCREEN.win.gradientTop,
    END_SCREEN.win.gradientTop,
    END_SCREEN.win.gradientBottom,
    END_SCREEN.win.gradientBottom,
    1,
  );
  g.fillRect(vp.x, vp.y, vp.width, vp.height);
  return g;
}

export function addWinGradientBackground(
  scene: Phaser.Scene,
  layout: ScreenLayout,
): Phaser.GameObjects.Graphics {
  const w = GAME_CONFIG.width * layout.scale;
  const h = GAME_CONFIG.height * layout.scale;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(0);
  g.fillGradientStyle(
    END_SCREEN.win.gradientTop,
    END_SCREEN.win.gradientTop,
    END_SCREEN.win.gradientBottom,
    END_SCREEN.win.gradientBottom,
    1,
  );
  g.fillRect(layout.cx - w / 2, layout.cy - h / 2, w, h);
  return g;
}

export function addStatsPill(
  scene: Phaser.Scene,
  cx: number,
  y: number,
  text: string,
  cfg: {
    statsW: number;
    statsH: number;
    statsBg: number;
    statsTextColor: string;
    statsTextSize: number;
  },
): { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text } {
  const { statsW, statsH, statsBg, statsTextColor, statsTextSize } = cfg;
  const radius = statsH / 2;
  const bg = scene.add.graphics().setScrollFactor(0).setDepth(20);
  bg.fillStyle(statsBg, 1);
  bg.fillRoundedRect(cx - statsW / 2, y - statsH / 2, statsW, statsH, radius);

  const label = scene.add
    .text(cx, y, text, {
      fontSize: `${statsTextSize}px`,
      fontFamily: FONT_BODY,
      color: statsTextColor,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(21);

  return { bg, label };
}

export type EndScreenCta = {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
};

export function addCtaButton(
  scene: Phaser.Scene,
  cx: number,
  y: number,
  labelText: string,
  cfg: {
    ctaW: number;
    ctaH: number;
    ctaColor: number;
    ctaHover: number;
    ctaTextSize: number;
    ctaRadius: number;
  },
  onPress: () => void,
): EndScreenCta {
  const { ctaW, ctaH, ctaColor, ctaHover, ctaTextSize, ctaRadius } = cfg;

  const bg = scene.add.graphics().setScrollFactor(0).setDepth(30);
  const draw = (color: number) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - ctaW / 2, y - ctaH / 2, ctaW, ctaH, ctaRadius);
  };
  draw(ctaColor);

  const label = scene.add
    .text(cx, y, labelText, {
      fontSize: `${ctaTextSize}px`,
      fontFamily: FONT_BODY,
      fontStyle: '500',
      color: '#ffffff',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(31);

  const hit = scene.add
    .zone(cx, y, ctaW + 24, ctaH + 24)
    .setScrollFactor(0)
    .setDepth(32)
    .setInteractive({ useHandCursor: true });

  hit.on('pointerover', () => draw(ctaHover));
  hit.on('pointerout', () => draw(ctaColor));
  hit.on('pointerdown', onPress);

  scene.tweens.add({
    targets: label,
    scale: 1.04,
    duration: 600,
    yoyo: true,
    repeat: -1,
  });

  return { bg, label, hit };
}

/** Invisible tap target over art that already includes a painted CTA. */
export function addCtaHitZone(
  scene: Phaser.Scene,
  cx: number,
  y: number,
  ctaW: number,
  ctaH: number,
  onPress: () => void,
): Phaser.GameObjects.Zone {
  const hit = scene.add
    .zone(cx, y, ctaW + 32, ctaH + 28)
    .setScrollFactor(0)
    .setDepth(32)
    .setInteractive({ useHandCursor: true });
  hit.on('pointerdown', onPress);
  return hit;
}

export function bindRestartInput(scene: Phaser.Scene, restart: () => void, ctaY: number): void {
  scene.input.keyboard?.once('keydown-ENTER', restart);
  scene.input.keyboard?.once('keydown-SPACE', restart);
  scene.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.y < ctaY - 40) return;
    restart();
  });
}

export function scalePx(layout: ScreenLayout, designPx: number): number {
  return designPx * layout.scale;
}
