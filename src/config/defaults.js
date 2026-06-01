export const DEFAULT_WORDS = [
  'LUX',
  'MOTOMAMI',
  'SAOKO',
  'DESPECHÁ',
  'DIVINA',
  'DIOS ES UNA MUJER',
];

export const FONT_OPTIONS = [
  { id: 'impact', label: 'Impact', family: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' },
  { id: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue", Impact, sans-serif' },
  { id: 'anton', label: 'Anton', family: 'Anton, Impact, sans-serif' },
  { id: 'oswald', label: 'Oswald', family: '"Oswald", Impact, sans-serif' },
  { id: 'archivo', label: 'Archivo Black', family: '"Archivo Black", Impact, sans-serif' },
  { id: 'bungee', label: 'Bungee', family: 'Bungee, Impact, sans-serif' },
  { id: 'monoton', label: 'Monoton', family: 'Monoton, Impact, cursive' },
  { id: 'blackops', label: 'Black Ops One', family: '"Black Ops One", Impact, sans-serif' },
  { id: 'rubik', label: 'Rubik Mono One', family: '"Rubik Mono One", Impact, monospace' },
  { id: 'staatliches', label: 'Staatliches', family: 'Staatliches, Impact, sans-serif' },
  { id: 'syne', label: 'Syne', family: 'Syne, Impact, sans-serif' },
  { id: 'righteous', label: 'Righteous', family: 'Righteous, Impact, sans-serif' },
  { id: 'ultra', label: 'Ultra', family: 'Ultra, Impact, serif' },
  { id: 'passero', label: 'Passero One', family: '"Passero One", Impact, serif' },
  { id: 'wallpoet', label: 'Wallpoet', family: 'Wallpoet, Impact, cursive' },
];

export const DEFAULT_BEAT_STYLES = [
  { label: 'Impact', family: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif', color: '#ffffff', glow: '#ff183d', weight: 900, size: 1, spacing: '-0.08em' },
  { label: 'Bebas Red', family: '"Bebas Neue", Impact, sans-serif', color: '#ff183d', glow: '#ffffff', weight: 400, size: 1.14, spacing: '0.04em' },
  { label: 'Anton Gold', family: 'Anton, Impact, sans-serif', color: '#ffd400', glow: '#ff4d00', weight: 400, size: 1.08, spacing: '0.02em' },
  { label: 'Archivo', family: '"Archivo Black", Impact, sans-serif', color: '#ffffff', glow: '#00e5ff', weight: 400, size: 0.92, spacing: '-0.04em' },
  { label: 'Bungee', family: 'Bungee, Impact, sans-serif', color: '#00ffcc', glow: '#ff00aa', weight: 400, size: 0.88, spacing: '0.06em' },
  { label: 'Monoton', family: 'Monoton, Impact, cursive', color: '#ff6bff', glow: '#ffffff', weight: 400, size: 0.78, spacing: '0.12em' },
  { label: 'Oswald Thin', family: '"Oswald", Impact, sans-serif', color: '#ffffff', glow: '#ff183d', weight: 500, size: 1.22, spacing: '0.14em' },
  { label: 'Black Ops', family: '"Black Ops One", Impact, sans-serif', color: '#c8ff00', glow: '#ff183d', weight: 400, size: 0.96, spacing: '-0.02em' },
  { label: 'Rubik Mono', family: '"Rubik Mono One", Impact, monospace', color: '#ffffff', glow: '#ff183d', weight: 400, size: 0.82, spacing: '-0.06em' },
  { label: 'Staatliches', family: 'Staatliches, Impact, sans-serif', color: '#ff314f', glow: '#ffffff', weight: 400, size: 1.18, spacing: '0.08em' },
  { label: 'Syne', family: 'Syne, Impact, sans-serif', color: '#ffffff', glow: '#7c3aed', weight: 800, size: 1.06, spacing: '-0.1em' },
  { label: 'Righteous', family: 'Righteous, Impact, sans-serif', color: '#ff9500', glow: '#ffffff', weight: 400, size: 1, spacing: '0.03em' },
  { label: 'Ultra', family: 'Ultra, Impact, serif', color: '#ffffff', glow: '#00ff66', weight: 400, size: 0.9, spacing: '0.01em' },
  { label: 'Passero', family: '"Passero One", Impact, serif', color: '#ff4081', glow: '#ffe600', weight: 400, size: 1.12, spacing: '0.05em' },
  { label: 'Wallpoet', family: 'Wallpoet, Impact, cursive', color: '#e0e0ff', glow: '#ff183d', weight: 400, size: 1.04, spacing: '0.1em' },
];

export const DEFAULT_GRAPHICS = {
  enabled: true,
  particles: 1,
  spectrum: true,
  rings: true,
  ripples: true,
  shapes: true,
  glowColor: '',
  showImportedSvgs: true,
};

export const DEFAULT_IMPORTED_SVGS = [];

export const DEFAULT_TYPOGRAPHY = {
  autoCycle: true,
  fixedStyle: {
    label: 'Custom',
    family: '"Bebas Neue", Impact, sans-serif',
    color: '#ffffff',
    glow: '#ff183d',
    weight: 700,
    size: 1.05,
    spacing: '0.02em',
  },
};

export const DEFAULT_SETTINGS = {
  words: DEFAULT_WORDS,
  typography: DEFAULT_TYPOGRAPHY,
  beatStyles: DEFAULT_BEAT_STYLES,
  graphics: DEFAULT_GRAPHICS,
  importedSvgs: DEFAULT_IMPORTED_SVGS,
};

export const STORAGE_KEY = 'concert-kinetic-settings-v1';

export function applyBeatStyle(style, updateFrameVariable) {
  updateFrameVariable('--beat-font', style.family);
  updateFrameVariable('--beat-color', style.color);
  updateFrameVariable('--beat-glow', style.glow);
  updateFrameVariable('--beat-weight', String(style.weight));
  updateFrameVariable('--beat-size', String(style.size));
  updateFrameVariable('--beat-spacing', style.spacing);
}

export function parseWordsText(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function wordsToText(words) {
  return words.join('\n');
}

export function resolveActiveStyle(settings, styleIndex) {
  if (settings.typography.autoCycle) {
    const styles = settings.beatStyles.length ? settings.beatStyles : DEFAULT_BEAT_STYLES;
    return styles[styleIndex % styles.length];
  }
  return settings.typography.fixedStyle;
}

export function resolveGlow(settings, style) {
  return settings.graphics.glowColor || style.glow;
}
