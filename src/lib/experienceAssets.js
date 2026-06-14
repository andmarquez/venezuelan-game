import { fetchExperienceManifest, getCachedExperienceScreens, slugFromFilename } from './experienceManifest.js';
import { createImportedSvg, sanitizeSvgMarkup } from './svgImport.js';
import { enhanceExperienceMarkup, getExperienceTheme } from './svgEnhance.js';

const BASE = import.meta.env.BASE_URL;

function normalizeName(name) {
  return name.toLowerCase().replace(/\.svg$/i, '').trim();
}

function matchesScreen(screen, name) {
  const normalized = normalizeName(name);
  const fileStem = screen.filename.replace(/\.svg$/i, '').toLowerCase();
  const slugFromName = slugFromFilename(/\.svg$/i.test(name) ? name : `${name}.svg`);
  return (
    screen.slug === normalized ||
    screen.slug === slugFromName ||
    fileStem === normalized
  );
}

export function isBuiltInExperienceName(name, screens = getCachedExperienceScreens()) {
  if (!name || !screens.length) {
    return false;
  }

  return screens.some((screen) => matchesScreen(screen, name));
}

export function createExperienceSvg(name, markup, filename = '') {
  const theme = getExperienceTheme(filename || `${name}.svg`);

  return {
    ...createImportedSvg(name, markup, 0),
    id: `experience-${theme.slug}`,
    source: 'experience',
    slug: theme.slug,
    experienceClass: theme.experienceClass,
    fullScreen: theme.fullScreen,
    lockUpright: theme.lockUpright,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 1,
    beatPulse: true,
    visible: true,
  };
}

export async function loadExperienceAsset(slug) {
  const manifest = await fetchExperienceManifest();
  const screens = manifest.screens ?? [];
  const screen =
    screens.find((item) => item.slug === slug && item.available !== false) ??
    screens.find((item) => item.available !== false) ??
    screens[0];

  if (!screen || screen.available === false) {
    return null;
  }

  const assetFilename = screen.assetFilename ?? screen.filename;

  try {
    const assetUrl = `${BASE}experience/${encodeURIComponent(assetFilename)}`;
    const response = await fetch(assetUrl, { cache: 'no-cache' });

    if (!response.ok) {
      console.warn(`Experience SVG not found: ${assetFilename}`);
      return null;
    }

    const raw = await response.text();
    const sanitized = sanitizeSvgMarkup(raw);
    const markup = enhanceExperienceMarkup(sanitized, screen.filename);
    const name = screen.filename.replace(/\.svg$/i, '');
    return createExperienceSvg(name, markup, screen.filename);
  } catch (error) {
    console.warn(`Could not load experience SVG: ${assetFilename}`, error);
    return null;
  }
}

/** @deprecated Loads every file — prefer loadExperienceAsset for one screen at a time. */
export async function loadExperienceAssets() {
  const manifest = await fetchExperienceManifest();
  const screens = manifest.screens ?? [];
  const loaded = await Promise.all(screens.map((screen) => loadExperienceAsset(screen.slug)));
  return loaded.filter(Boolean);
}
