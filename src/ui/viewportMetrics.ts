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

/** Dev-only bypass — desktop preview with touch controls (`?mobile=1`). */
export function isMobilePreviewForced(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mobile') === '1';
}

/** iPadOS 13+ often reports a desktop Macintosh user agent. */
function isIPadLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints > 1 && /Macintosh|Mac OS X/i.test(navigator.userAgent);
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Primary touch-phone signal — ignores Windows precision touchpads
 * (`maxTouchPoints > 0` with fine pointer + hover).
 */
function isCoarseTouchDevice(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  return coarse && noHover;
}

/**
 * True for real phones/tablets, or forced preview (`?mobile=1`).
 * Desktop laptops (incl. touchpad-only Windows) return false.
 */
export function isMobileViewport(): boolean {
  if (isMobilePreviewForced()) return true;
  if (isIPadLike()) return true;
  if (isMobileUserAgent()) return true;
  return isCoarseTouchDevice();
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

  const onResize = () => schedule();
  const onOrientationChange = () => schedule();
  const onVisualViewportResize = () => schedule();
  const onVisualViewportScroll = () => schedule();
  const onPortraitChange = () => schedule();
  const onLandscapeChange = () => schedule();
  const onScreenOrientationChange = () => schedule();

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onOrientationChange);
  window.visualViewport?.addEventListener('resize', onVisualViewportResize);
  window.visualViewport?.addEventListener('scroll', onVisualViewportScroll);

  const portraitMql = window.matchMedia?.('(orientation: portrait)');
  const landscapeMql = window.matchMedia?.('(orientation: landscape)');
  portraitMql?.addEventListener('change', onPortraitChange);
  landscapeMql?.addEventListener('change', onLandscapeChange);
  screen.orientation?.addEventListener('change', onScreenOrientationChange);

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onOrientationChange);
    window.visualViewport?.removeEventListener('resize', onVisualViewportResize);
    window.visualViewport?.removeEventListener('scroll', onVisualViewportScroll);
    portraitMql?.removeEventListener('change', onPortraitChange);
    landscapeMql?.removeEventListener('change', onLandscapeChange);
    screen.orientation?.removeEventListener('change', onScreenOrientationChange);
  };
}
