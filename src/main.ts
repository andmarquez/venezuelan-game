import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WinScene } from './scenes/WinScene';
import { GAME_CONFIG } from './config/gameConfig';
import { isMobileViewport, resolveScaleMode } from './ui/scaleMode';

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
  document.documentElement.classList.toggle('is-mobile-view', mobile);
  document.documentElement.classList.toggle('is-desktop-view', !mobile);
  if (game.scale.scaleMode !== next) {
    game.scale.scaleMode = next;
  }
  game.scale.refresh();
};

window.addEventListener('resize', applyScaleMode);
window.addEventListener('orientationchange', applyScaleMode);
document.documentElement.classList.add(isMobileViewport() ? 'is-mobile-view' : 'is-desktop-view');

game.events.once('ready', () => {
  if (game.input.touch) {
    game.input.touch.capture = true;
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
