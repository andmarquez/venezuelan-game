import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WinScene } from './scenes/WinScene';
import { GAME_CONFIG } from './config/gameConfig';
import { isLandscapeViewport, isMobileViewport, resolveScaleMode } from './ui/scaleMode';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: '#b8e0f5',
  scale: {
    mode: resolveScaleMode(),
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GAME_CONFIG.gravity },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
  input: {
    activePointers: 4,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
});

const applyScaleMode = () => {
  const next = resolveScaleMode();
  const mobile = isMobileViewport();
  const landscape = isLandscapeViewport();
  document.documentElement.classList.toggle('is-mobile-view', mobile);
  document.documentElement.classList.toggle('is-desktop-view', !mobile);
  document.documentElement.classList.toggle('is-landscape-view', landscape);
  document.documentElement.classList.toggle('is-portrait-view', !landscape);
  if (game.scale.scaleMode !== next) {
    game.scale.scaleMode = next;
  }
  game.scale.refresh();
};

window.addEventListener('resize', applyScaleMode);
window.addEventListener('orientationchange', applyScaleMode);
const bootMobile = isMobileViewport();
const bootLandscape = isLandscapeViewport();
document.documentElement.classList.add(bootMobile ? 'is-mobile-view' : 'is-desktop-view');
document.documentElement.classList.add(bootLandscape ? 'is-landscape-view' : 'is-portrait-view');

game.events.once('ready', () => {
  applyScaleMode();
  // Leave capture off so iOS delivers reliable tap/pointer events to the canvas.
  if (game.input.touch) {
    game.input.touch.capture = false;
  }
});

// Block page scroll during play — do NOT preventDefault on touchend (breaks Phaser taps on iOS).
document.addEventListener(
  'touchmove',
  (e) => {
    if (game.scene.isActive('GameScene') || game.scene.isActive('MenuScene')) {
      e.preventDefault();
    }
  },
  { passive: false },
);

export default game;
