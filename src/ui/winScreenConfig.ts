import Phaser from 'phaser';

export type WinLayoutJson = {
  screen?: string;
  format?: string;
  lottie?: string;
  designW?: number;
  designH?: number;
  bg?: string;
  ctaY: number;
  ctaW: number;
  ctaH: number;
  ctaLabel?: string;
};

export type ResolvedWinLayout = {
  bg: number;
  ctaY: number;
  ctaW: number;
  ctaH: number;
  ctaLabel: string;
};

const REGISTRY_KEY = 'winScreenLayout';
export const WIN_LOTTIE_CACHE_KEY = 'win-screen-lottie';
export const WIN_LAYOUT_CACHE_KEY = 'win-screen-layout';

function searchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

/** Jump straight to Win screen after boot (`?win=1`). */
export function shouldPreviewWin(): boolean {
  const params = searchParams();
  return params?.get('win') === '1' || params?.get('win') === 'true';
}

function parseColor(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return fallback;
  const hex = value.replace('#', '');
  const parsed = Number.parseInt(hex, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveWinLayout(raw: WinLayoutJson | null | undefined): ResolvedWinLayout {
  return {
    bg: parseColor(raw?.bg, 0xfff5dc),
    ctaY: raw?.ctaY ?? 610,
    ctaW: raw?.ctaW ?? 175,
    ctaH: raw?.ctaH ?? 49,
    ctaLabel: raw?.ctaLabel ?? 'Play Again',
  };
}

export function cacheWinLayout(game: Phaser.Game, layout: ResolvedWinLayout): void {
  game.registry.set(REGISTRY_KEY, layout);
}

export function getCachedWinLayout(game: Phaser.Game): ResolvedWinLayout {
  const cached = game.registry.get(REGISTRY_KEY) as ResolvedWinLayout | undefined;
  if (cached) return cached;
  return resolveWinLayout(null);
}
