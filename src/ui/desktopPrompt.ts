import { isMobileViewport, onViewportChange } from './viewportMetrics';

function updateDesktopPrompt(): void {
  const el = document.getElementById('desktop-prompt');
  const gameContainer = document.getElementById('game-container');
  if (!el) return;

  const mobile = isMobileViewport();
  el.hidden = mobile;
  if (gameContainer) {
    gameContainer.hidden = !mobile;
  }
}

/** Show the desktop gate and hide the game shell when not on a phone/tablet. */
export function bootstrapDesktopPrompt(): void {
  onViewportChange(updateDesktopPrompt);
  for (const ms of [0, 50, 150, 300, 600, 1000, 2000]) {
    window.setTimeout(updateDesktopPrompt, ms);
  }
  updateDesktopPrompt();
}
