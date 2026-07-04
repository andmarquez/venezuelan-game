import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WinScene } from './scenes/WinScene';
import { GAME_CONFIG } from './config/gameConfig';
import { isMobileViewport, resolveScaleMode } from './ui/scaleMode';

/**
 * Entry point — creates the Phaser game instance.
 * All scenes are registered here; BootScene runs first.
 */
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
  document.documentElement.classList.toggle('is-mobile-view', isMobileViewport());
  if (game.scale.scaleMode !== next) {
    game.scale.scaleMode = next;
    game.scale.refresh();
  }
};

window.addEventListener('resize', applyScaleMode);
document.documentElement.classList.add(isMobileViewport() ? 'is-mobile-view' : 'is-desktop-view');

// Prevent accidental page scroll / zoom on mobile while playing
document.addEventListener(
  'touchmove',
  (e) => {
    if (game.scene.isActive('GameScene') || game.scene.isActive('MenuScene')) {
      e.preventDefault();
    }
  },
  { passive: false },
);

let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false },
);

export default game;
