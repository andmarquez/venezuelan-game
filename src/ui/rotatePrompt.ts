import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { assetUrl } from '../utils/assetUrl';
import { isLandscapeViewport, isMobileViewport, onViewportChange } from './viewportMetrics';

const ROTATE_PROMPT_SCENES = new Set([
  'BootScene',
  'MenuScene',
  'GameScene',
  'GameOverScene',
  'WinScene',
]);

let promptGame: Phaser.Game | null = null;

function applyRotateIconSrc(): void {
  const img = document.querySelector<HTMLImageElement>('#rotate-prompt .rotate-prompt__icon');
  if (!img) return;
  img.src = assetUrl('assets/ui/rotate-icon.png', GAME_CONFIG.screenAssetVersion);
}

function shouldShowRotatePrompt(): boolean {
  const el = document.getElementById('rotate-prompt');
  if (!el) return false;

  const portrait = isMobileViewport() && !isLandscapeViewport();
  if (!portrait) return false;

  // Before Phaser finishes booting, default to showing on portrait mobile (splash/boot).
  if (!promptGame?.isBooted) return true;

  for (const key of ROTATE_PROMPT_SCENES) {
    if (promptGame.scene.isActive(key)) return true;
  }
  return false;
}

function updateRotatePrompt(): void {
  const el = document.getElementById('rotate-prompt');
  if (!el) return;
  el.hidden = !shouldShowRotatePrompt();
}

/** Run before Phaser boots so portrait splash shows immediately and reliably. */
export function bootstrapRotatePrompt(): void {
  applyRotateIconSrc();
  onViewportChange(updateRotatePrompt);
  for (const ms of [0, 50, 150, 300, 600, 1000, 2000]) {
    window.setTimeout(updateRotatePrompt, ms);
  }
  updateRotatePrompt();
}

/** Wire Phaser scene transitions after the game is ready. */
export function mountRotatePrompt(game: Phaser.Game): void {
  promptGame = game;

  const bindScene = (scene: Phaser.Scene): void => {
    scene.events.on(Phaser.Scenes.Events.START, updateRotatePrompt);
    scene.events.on(Phaser.Scenes.Events.WAKE, updateRotatePrompt);
  };

  game.scene.getScenes(false).forEach(bindScene);
  game.events.on(Phaser.Scenes.Events.CREATE, (scene: Phaser.Scene) => {
    bindScene(scene);
    updateRotatePrompt();
  });
  game.events.on(Phaser.Scenes.Events.START, updateRotatePrompt);
  game.scale.on(Phaser.Scale.Events.RESIZE, updateRotatePrompt);
  game.events.once('ready', updateRotatePrompt);
  updateRotatePrompt();
}
