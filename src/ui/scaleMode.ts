import Phaser from 'phaser';

/** True for phone-sized or forced mobile preview (`?mobile=1`). */
export function isMobileViewport(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mobile') === '1') return true;

  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const touch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return touch && shortSide <= 720;
}

/** Full-screen crop on phones; letterboxed fit on desktop for uncropped HUD + gameplay. */
export function resolveScaleMode(): number {
  return isMobileViewport() ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT;
}
