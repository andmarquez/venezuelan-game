import { franc } from 'franc';

export const LANGUAGE_STYLES = {
  eng: {
    label: 'English',
    fontFamily: '"Syne", "Bebas Neue", Impact, sans-serif',
    direction: 'ltr',
    accent: '#00f5d4',
  },
  spa: {
    label: 'Spanish',
    fontFamily: 'Anton, "Bebas Neue", Impact, sans-serif',
    direction: 'ltr',
    accent: '#ff006e',
  },
  lat: {
    label: 'Latin',
    fontFamily: 'Ultra, "Passero One", Impact, serif',
    direction: 'ltr',
    accent: '#c1121f',
  },
  fra: {
    label: 'French',
    fontFamily: '"Oswald", Syne, Impact, sans-serif',
    direction: 'ltr',
    accent: '#4895ef',
  },
  por: {
    label: 'Portuguese',
    fontFamily: '"Righteous", Anton, Impact, sans-serif',
    direction: 'ltr',
    accent: '#06d6a0',
  },
  deu: {
    label: 'German',
    fontFamily: '"Archivo Black", Impact, sans-serif',
    direction: 'ltr',
    accent: '#ffd60a',
  },
  jpn: {
    label: 'Japanese',
    fontFamily: '"Noto Sans JP", "Rubik Mono One", sans-serif',
    direction: 'ltr',
    accent: '#ff6b6b',
  },
  ara: {
    label: 'Arabic',
    fontFamily: '"Noto Sans Arabic", "Syne", sans-serif',
    direction: 'rtl',
    accent: '#f77f00',
  },
  default: {
    label: 'Universal',
    fontFamily: '"Bebas Neue", Impact, Haettenschweiler, sans-serif',
    direction: 'ltr',
    accent: '#ff183d',
  },
};

export function getLanguageStyle(code) {
  return LANGUAGE_STYLES[code] ?? LANGUAGE_STYLES.default;
}

export function detectLanguageCode(text, fallback = 'eng') {
  if (!text?.trim()) {
    return fallback;
  }

  const detected = franc(text, { minLength: 3 });
  if (detected && detected !== 'und') {
    return detected;
  }

  return fallback;
}
