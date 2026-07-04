import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WinScene } from './scenes/WinScene';
import { GAME_CONFIG } from './config/gameConfig';
import {
  getViewportSize,
  isLandscapeViewport,
  isMobileViewport,
  onViewportChange,
  resolveScaleMode,
} from './ui/viewportMetrics';

const applyViewportClasses = () => {
  const mobile = isMobileViewport();
  const landscape = isLandscapeViewport();
  const { width, height } = getViewportSize();

  document.documentElement.classList.toggle('is-mobile-view', mobile);
  document.documentElement.classList.toggle('is-desktop-view', !mobile);
  document.documentElement.classList.toggle('is-landscape-view', landscape);
  document.documentElement.classList.toggle('is-portrait-view', !landscape);
  document.documentElement.dataset.viewport = `${width}x${height}`;
  document.documentElement.dataset.orientation = landscape ? 'landscape' : 'portrait';
};

const syncGameContainerToVisualViewport = () => {
  const container = document.getElementById('game-container');
  if (!container) return;

  if (!isMobileViewport()) {
    container.style.width = '';
    container.style.height = '';
    container.style.left = '';
    container.style.top = '';
    return;
  }

  const vv = window.visualViewport;
  if (!vv) return;

  container.style.width = `${Math.round(vv.width)}px`;
  container.style.height = `${Math.round(vv.height)}px`;
  container.style.left = `${Math.round(vv.offsetLeft)}px`;
  container.style.top = `${Math.round(vv.offsetTop)}px`;
};

const applyScaleMode = () => {
  applyViewportClasses();
  syncGameContainerToVisualViewport();
  if (!game.isBooted) return;
  const next = resolveScaleMode();
  if (game.scale.scaleMode !== next) {
    game.scale.scaleMode = next;
  }
  game.scale.refresh();
};

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

applyViewportClasses();
onViewportChange(applyScaleMode);

game.events.once('ready', () => {
  applyScaleMode();
  if (game.input.touch) {
    game.input.touch.capture = false;
  }
});

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
