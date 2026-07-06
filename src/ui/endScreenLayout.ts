import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { getUiViewport, type UiViewport } from './viewportLayout';

/** Figma M03/M04 layout at 1280×720 — positions are artboard centers / tops. */
export const END_SCREEN = {
  designW: GAME_CONFIG.width,
  designH: GAME_CONFIG.height,
  gameOver: {
    bg: 0xfce4ec,
    reasonY: 103,
    reasonSize: 23,
    reasonColor: '#880e4f',
    titleY: 313,
    titleMaxW: 568,
    statsY: 293,
    statsW: 309,
    statsH: 55,
    statsColor: 0x3744a4,
    statsTextSize: 22,
    characterY: 414,
    characterW: 171,
    characterH: 228,
    ctaY: 551,
    ctaW: 177,
    ctaH: 47,
    ctaColor: 0xe91e63,
    ctaHover: 0xc2185b,
    ctaTextSize: 22,
    ctaLabel: 'Try Again',
  },
  win: {
    gradientTop: 0xfff5dc,
    gradientBottom: 0xd6eaf8,
    titleY: 323,
    titleMaxW: 547,
    characterXOffset: 34,
    characterY: 334,
    characterW: 178,
    characterH: 227,
    statsY: 483,
    statsW: 420,
    statsH: 55,
    statsColor: 0x3744a4,
    statsTextSize: 22,
    ctaY: 553,
    ctaW: 175,
    ctaH: 49,
    ctaColor: 0xe91e63,
    ctaHover: 0xc2185b,
    ctaTextSize: 22,
    ctaLabel: 'Play Again',
  },
} as const;

const FONT_BODY = 'Inter, Nunito, system-ui, sans-serif';

export function layoutCenterX(vp: UiViewport): number {
  return vp.x + vp.width / 2;
}

export function fitImageToSize(
  image: Phaser.GameObjects.Image,
  maxW: number,
  maxH: number,
): void {
  const frame = image.frame;
  if (!frame.width || !frame.height) return;
  const scale = Math.min(maxW / frame.width, maxH / frame.height);
  image.setScale(scale);
}

export function addEndScreenBackground(
  scene: Phaser.Scene,
  color: number,
): Phaser.GameObjects.Rectangle {
  const vp = getUiViewport(scene.scale);
  return scene.add
    .rectangle(vp.x + vp.width / 2, vp.y + vp.height / 2, vp.width, vp.height, color)
    .setScrollFactor(0)
    .setDepth(0);
}

export function addWinGradientBackground(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const vp = getUiViewport(scene.scale);
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

export function addStatsPill(
  scene: Phaser.Scene,
  cx: number,
  y: number,
  text: string,
  cfg: { statsW: number; statsH: number; statsColor: number; statsTextSize: number },
): { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text } {
  const { statsW, statsH, statsColor, statsTextSize } = cfg;
  const radius = statsH / 2;
  const bg = scene.add.graphics().setScrollFactor(0).setDepth(20);
  bg.fillStyle(statsColor, 1);
  bg.fillRoundedRect(cx - statsW / 2, y - statsH / 2, statsW, statsH, radius);

  const label = scene.add
    .text(cx, y, text, {
      fontSize: `${statsTextSize}px`,
      fontFamily: FONT_BODY,
      color: '#ffffff',
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
  },
  onPress: () => void,
): EndScreenCta {
  const { ctaW, ctaH, ctaColor, ctaHover, ctaTextSize } = cfg;
  const radius = 14;

  const bg = scene.add.graphics().setScrollFactor(0).setDepth(30);
  const draw = (color: number) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - ctaW / 2, y - ctaH / 2, ctaW, ctaH, radius);
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

export function bindRestartInput(scene: Phaser.Scene, restart: () => void, ctaY: number): void {
  scene.input.keyboard?.once('keydown-ENTER', restart);
  scene.input.keyboard?.once('keydown-SPACE', restart);
  scene.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (pointer.y < ctaY - 40) return;
    restart();
  });
}
