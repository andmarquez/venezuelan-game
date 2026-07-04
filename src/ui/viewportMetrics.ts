import Phaser from 'phaser';

/**
 * Reliable viewport + orientation helpers for mobile Safari and Android Chrome.
 * Prefer matchMedia / Screen Orientation API over innerWidth alone — iOS often
 * reports stale portrait dimensions briefly after rotating to landscape.
 */

export type ViewportSize = {
  width: number;
  height: number;
};

export function getViewportSize(): ViewportSize {
  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);
  return { width, height };
}

/** True when the browser reports landscape (width-first game layout). */
export function isLandscapeViewport(): boolean {
  if (typeof window.matchMedia === 'function') {
    if (window.matchMedia('(orientation: landscape)').matches) return true;
    if (window.matchMedia('(orientation: portrait)').matches) return false;
  }

  const orientationType = screen.orientation?.type ?? '';
  if (orientationType.includes('landscape')) return true;
  if (orientationType.includes('portrait')) return false;

  if (typeof window.orientation === 'number') {
    return Math.abs(window.orientation) === 90;
  }

  const { width, height } = getViewportSize();
  return width > height;
}

/** True for phone/tablet or forced mobile preview (`?mobile=1`). */
export function isMobileViewport(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mobile') === '1') return true;

  const { width, height } = getViewportSize();
  const shortSide = Math.min(width, height);
  const touch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return touch && shortSide <= 900;
}

/**
 * iPhone 16 / 16 Pro class (393–402 × 852–874 CSS px).
 * Used for tighter landscape HUD + Dynamic Island side inset.
 */
export function isIphone16Class(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('iphone16') === '1') return true;

  const { width, height } = getViewportSize();
  const short = Math.min(width, height);
  const long = Math.max(width, height);
  return short >= 390 && short <= 440 && long >= 840 && long <= 940;
}

/** Mobile fills screen (crop edges); desktop letterboxes — never stretches. */
export function resolveScaleMode(): number {
  return isMobileViewport() ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT;
}

/** Re-run after orientation/viewport settles (iOS needs delayed refresh). */
export function onViewportChange(onChange: () => void): () => void {
  const schedule = () => {
    onChange();
    requestAnimationFrame(onChange);
    window.setTimeout(onChange, 50);
    window.setTimeout(onChange, 200);
    window.setTimeout(onChange, 450);
  };

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);

  const portraitMql = window.matchMedia?.('(orientation: portrait)');
  const landscapeMql = window.matchMedia?.('(orientation: landscape)');
  portraitMql?.addEventListener('change', schedule);
  landscapeMql?.addEventListener('change', schedule);
  screen.orientation?.addEventListener('change', schedule);

  return () => {
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    portraitMql?.removeEventListener('change', schedule);
    landscapeMql?.removeEventListener('change', schedule);
    screen.orientation?.removeEventListener('change', schedule);
  };
}
