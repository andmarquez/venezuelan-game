import { useCallback, useState } from 'react';
import {
  DEFAULT_EXPERIENCE,
  DEFAULT_SETTINGS,
  EXPERIENCE_SCREENS,
  STORAGE_KEY,
} from '../config/defaults.js';

function normalizeImportedSvg(item) {
  if (!item?.id || !item?.markup) {
    return null;
  }

  return {
    id: item.id,
    name: item.name || 'SVG',
    markup: item.markup,
    x: Number.isFinite(item.x) ? item.x : 50,
    y: Number.isFinite(item.y) ? item.y : 50,
    scale: Number.isFinite(item.scale) ? item.scale : 1,
    rotation: Number.isFinite(item.rotation) ? item.rotation : 0,
    opacity: Number.isFinite(item.opacity) ? item.opacity : 0.88,
    beatPulse: item.beatPulse !== false,
    visible: item.visible !== false,
  };
}

function normalizeSettings(raw) {
  const importedSvgs = Array.isArray(raw?.importedSvgs)
    ? raw.importedSvgs.map(normalizeImportedSvg).filter(Boolean)
    : DEFAULT_SETTINGS.importedSvgs;

  const knownSlugs = new Set(EXPERIENCE_SCREENS.map((screen) => screen.slug));
  const activeSlugRaw = raw?.experience?.activeSlug ?? DEFAULT_EXPERIENCE.activeSlug;
  const activeSlug = knownSlugs.has(activeSlugRaw)
    ? activeSlugRaw
    : DEFAULT_EXPERIENCE.activeSlug;

  return {
    words: Array.isArray(raw?.words) ? raw.words : DEFAULT_SETTINGS.words,
    beatStyles:
      Array.isArray(raw?.beatStyles) && raw.beatStyles.length
        ? raw.beatStyles
        : DEFAULT_SETTINGS.beatStyles,
    typography: {
      ...DEFAULT_SETTINGS.typography,
      ...raw?.typography,
      showOverlay:
        typeof raw?.typography?.showOverlay === 'boolean'
          ? raw.typography.showOverlay
          : Array.isArray(raw?.words) && raw.words.length > 0,
      fixedStyle: {
        ...DEFAULT_SETTINGS.typography.fixedStyle,
        ...raw?.typography?.fixedStyle,
      },
    },
    graphics: {
      ...DEFAULT_SETTINGS.graphics,
      ...raw?.graphics,
    },
    importedSvgs,
    experience: {
      ...DEFAULT_EXPERIENCE,
      ...raw?.experience,
      activeSlug,
    },
  };
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return DEFAULT_SETTINGS;
    }
    return normalizeSettings(JSON.parse(saved));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => loadSettings());

  const updateSettings = useCallback((patch) => {
    setSettings((previous) => {
      const next = normalizeSettings({
        ...previous,
        ...patch,
        typography: { ...previous.typography, ...patch.typography },
        graphics: { ...previous.graphics, ...patch.graphics },
        experience: { ...previous.experience, ...patch.experience },
        importedSvgs: patch.importedSvgs ?? previous.importedSvgs,
      });

      if (patch.typography?.fixedStyle) {
        next.typography.fixedStyle = {
          ...previous.typography.fixedStyle,
          ...patch.typography.fixedStyle,
        };
      }

      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    persistSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings };
}
