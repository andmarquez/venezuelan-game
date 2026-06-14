const BASE = import.meta.env.BASE_URL;

let manifestCache = null;
let manifestPromise = null;

export function slugFromFilename(filename) {
  return filename
    .replace(/\.svg$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function screenFromFilename(filename, label = '', available = true) {
  const stem = filename.replace(/\.svg$/i, '');
  return {
    slug: slugFromFilename(filename),
    label: label || stem,
    filename,
    assetFilename: filename,
    available,
  };
}

function normalizeScreen(screen) {
  return {
    slug: screen.slug,
    label: screen.label,
    filename: screen.filename,
    assetFilename: screen.assetFilename ?? screen.filename,
    available: screen.available !== false,
  };
}

function normalizeScreens(manifest) {
  if (Array.isArray(manifest?.screens) && manifest.screens.length) {
    return manifest.screens.map(normalizeScreen);
  }

  const files = Array.isArray(manifest?.files) ? manifest.files : [];
  return files.map((filename) => screenFromFilename(filename));
}

async function fetchLabelConfig() {
  try {
    const response = await fetch(`${BASE}experience/screen-labels.json`, { cache: 'no-cache' });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

function mergeScreensWithLabelConfig(screens, labelConfig) {
  const order = Array.isArray(labelConfig?.order) ? labelConfig.order : [];
  if (!order.length) {
    return screens;
  }

  const labels = labelConfig.labels ?? {};
  const bySlug = new Map(screens.map((screen) => [screen.slug, screen]));
  const merged = order.map((filename) => {
    const slug = slugFromFilename(filename);
    const existing = bySlug.get(slug);
    if (existing) {
      return {
        ...existing,
        label: labels[filename] ?? existing.label,
        filename,
      };
    }

    const stem = filename.replace(/\.svg$/i, '');
    return screenFromFilename(filename, labels[filename] ?? stem, false);
  });

  const orderedSlugs = new Set(merged.map((screen) => screen.slug));
  const extras = screens.filter((screen) => !orderedSlugs.has(screen.slug));
  return [...merged, ...extras];
}

export async function fetchExperienceManifest(force = false) {
  if (!force && manifestCache) {
    return manifestCache;
  }

  if (!force && manifestPromise) {
    return manifestPromise;
  }

  manifestPromise = (async () => {
    try {
      const response = await fetch(`${BASE}experience/manifest.json`, { cache: 'no-cache' });

      if (!response.ok) {
        return { screens: [], files: [] };
      }

      const manifest = await response.json();
      let screens = normalizeScreens(manifest);
      const labelConfig = await fetchLabelConfig();
      if (labelConfig) {
        screens = mergeScreensWithLabelConfig(screens, labelConfig);
      }

      manifestCache = { ...manifest, screens };
      return manifestCache;
    } catch (error) {
      console.warn('Could not load experience manifest', error);
      return { screens: [], files: [] };
    } finally {
      manifestPromise = null;
    }
  })();

  return manifestPromise;
}

export function getCachedExperienceScreens() {
  return manifestCache?.screens ?? [];
}

export function invalidateExperienceManifestCache() {
  manifestCache = null;
  manifestPromise = null;
}
