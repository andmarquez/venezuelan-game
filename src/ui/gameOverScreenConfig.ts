import Phaser from 'phaser';

export type GameOverLayoutJson = {
  screen?: string;
  variant?: string;
  designW?: number;
  designH?: number;
  bg?: string;
  statsY: number;
  statsW: number;
  statsH: number;
  statsBg: string;
  statsTextColor: string;
  statsTextSize: number;
  ctaY: number;
  ctaW: number;
  ctaH: number;
  ctaLabel?: string;
};

export type ResolvedGameOverLayout = {
  bg: number;
  statsY: number;
  statsW: number;
  statsH: number;
  statsBg: number;
  statsTextColor: string;
  statsTextSize: number;
  ctaY: number;
  ctaW: number;
  ctaH: number;
  ctaLabel: string;
  variant: 'production' | 'test';
};

const REGISTRY_KEY = 'gameOverLayout';
const TEST_MODE_STORAGE_KEY = 'gameOverTest';

function searchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

/** Use playful Lottie test screen (`?gameOverTest=1`, persisted on phone). */
export function isGameOverTestMode(): boolean {
  const params = searchParams();
  const param = params?.get('gameOverTest');
  if (param === '1' || param === 'true') {
    try {
      localStorage.setItem(TEST_MODE_STORAGE_KEY, '1');
    } catch {
      /* private browsing */
    }
    return true;
  }
  if (param === '0' || param === 'false') {
    try {
      localStorage.removeItem(TEST_MODE_STORAGE_KEY);
    } catch {
      /* private browsing */
    }
    return false;
  }
  try {
    return localStorage.getItem(TEST_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Jump straight to Game Over after boot (`?gameOver=1`). */
export function shouldPreviewGameOver(): boolean {
  const params = searchParams();
  return params?.get('gameOver') === '1' || params?.get('gameOver') === 'true';
}

export function getGameOverLayoutCacheKey(): string {
  return isGameOverTestMode()
    ? 'game-over-layout-test'
    : 'game-over-layout-production';
}

export function getGameOverTextureKey(): string {
  return isGameOverTestMode()
    ? 'screen-game-over-screen-test'
    : 'screen-game-over-screen';
}

export function getGameOverLottieCacheKey(): string {
  return 'game-over-lottie-playful';
}

/** Test mode uses the playful Jitter Lottie export instead of a static PNG. */
export function usesGameOverLottieTest(): boolean {
  return isGameOverTestMode();
}

function parseColor(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return fallback;
  const hex = value.replace('#', '');
  const parsed = Number.parseInt(hex, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveGameOverLayout(
  raw: GameOverLayoutJson | null | undefined,
  variant: 'production' | 'test',
): ResolvedGameOverLayout {
  return {
    bg: parseColor(raw?.bg, 0xfce4ec),
    statsY: raw?.statsY ?? 272,
    statsW: raw?.statsW ?? 364,
    statsH: raw?.statsH ?? 55,
    statsBg: parseColor(raw?.statsBg, 0xfffaa3),
    statsTextColor: raw?.statsTextColor ?? '#3744a4',
    statsTextSize: raw?.statsTextSize ?? 22,
    ctaY: raw?.ctaY ?? 369,
    ctaW: raw?.ctaW ?? 177,
    ctaH: raw?.ctaH ?? 47,
    ctaLabel: raw?.ctaLabel ?? 'Try Again',
    variant,
  };
}

export function cacheGameOverLayout(game: Phaser.Game, layout: ResolvedGameOverLayout): void {
  game.registry.set(REGISTRY_KEY, layout);
}

export function getCachedGameOverLayout(game: Phaser.Game): ResolvedGameOverLayout {
  const cached = game.registry.get(REGISTRY_KEY) as ResolvedGameOverLayout | undefined;
  if (cached) return cached;
  return resolveGameOverLayout(null, 'production');
}
