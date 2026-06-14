import fs from 'node:fs';
import path from 'node:path';

const experienceDir = path.resolve('public/experience');
const labelsPath = path.join(experienceDir, 'screen-labels.json');

if (!fs.existsSync(experienceDir)) {
  fs.mkdirSync(experienceDir, { recursive: true });
}

function slugFromFilename(filename) {
  return filename
    .replace(/\.svg$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadLabelConfig() {
  if (!fs.existsSync(labelsPath)) {
    return { order: [], labels: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(labelsPath, 'utf8'));
  } catch {
    return { order: [], labels: {} };
  }
}

function resolveOnDisk(canonicalName, filesOnDisk) {
  if (filesOnDisk.includes(canonicalName)) {
    return canonicalName;
  }

  const target = canonicalName.toLowerCase();
  return filesOnDisk.find((name) => name.toLowerCase() === target) ?? null;
}

const labelConfig = loadLabelConfig();
const labels = labelConfig.labels ?? {};
const preferredOrder = Array.isArray(labelConfig.order) ? labelConfig.order : [];

const filesOnDisk = fs
  .readdirSync(experienceDir)
  .filter((name) => name.toLowerCase().endsWith('.svg'))
  .sort();

const usedOnDisk = new Set();

const screensFromOrder = preferredOrder.map((canonical) => {
  const onDisk = resolveOnDisk(canonical, filesOnDisk);
  if (onDisk) {
    usedOnDisk.add(onDisk);
  }

  const stem = canonical.replace(/\.svg$/i, '');

  return {
    slug: slugFromFilename(canonical),
    label: labels[canonical] ?? stem,
    filename: canonical,
    assetFilename: onDisk ?? canonical,
    available: Boolean(onDisk),
  };
});

const extraScreens = filesOnDisk
  .filter((name) => !usedOnDisk.has(name))
  .map((filename) => {
    const stem = filename.replace(/\.svg$/i, '');
    return {
      slug: slugFromFilename(filename),
      label: labels[filename] ?? stem,
      filename,
      assetFilename: filename,
      available: true,
    };
  });

const screens = preferredOrder.length
  ? [...screensFromOrder, ...extraScreens]
  : filesOnDisk.map((filename) => {
      const stem = filename.replace(/\.svg$/i, '');
      return {
        slug: slugFromFilename(filename),
        label: labels[filename] ?? stem,
        filename,
        assetFilename: filename,
        available: true,
      };
    });

const orderedFiles = screens
  .filter((screen) => screen.available)
  .map((screen) => screen.assetFilename);

const manifest = {
  files: orderedFiles,
  screens,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(experienceDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const availableCount = screens.filter((screen) => screen.available).length;
console.log(
  `Experience manifest: ${screens.length} screen(s), ${availableCount} SVG(s) on disk → public/experience/manifest.json`,
);
