export const MAX_IMPORTED_SVGS = 8;
export const MAX_SVG_BYTES = 180000;

export function sanitizeSvgMarkup(raw) {
  if (!raw?.trim()) {
    throw new Error('SVG file is empty.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');

  if (parseError) {
    throw new Error('Invalid SVG file.');
  }

  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') {
    throw new Error('File must contain an SVG root element.');
  }

  svg.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((node) => {
    node.remove();
  });

  svg.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || (name === 'href' && attribute.value.trim().toLowerCase().startsWith('javascript:'))) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  return svg.outerHTML;
}

export function createImportedSvg(name, markup, index = 0) {
  const spread = index % 5;
  return {
    id: crypto.randomUUID(),
    name,
    markup,
    x: 18 + spread * 16,
    y: 22 + (index % 3) * 18,
    scale: 0.55 + (index % 4) * 0.12,
    rotation: (index % 5) * 12 - 24,
    opacity: 0.88,
    beatPulse: true,
    visible: true,
  };
}

export async function importSvgFile(file, currentCount) {
  if (currentCount >= MAX_IMPORTED_SVGS) {
    throw new Error(`Maximum ${MAX_IMPORTED_SVGS} SVG graphics allowed.`);
  }

  if (file.size > MAX_SVG_BYTES) {
    throw new Error('SVG is too large. Try a file under 180KB.');
  }

  const isSvg =
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg');

  if (!isSvg) {
    throw new Error('Please choose an .svg file.');
  }

  const raw = await file.text();
  const markup = sanitizeSvgMarkup(raw);
  return createImportedSvg(file.name.replace(/\.svg$/i, ''), markup, currentCount);
}

export function updateImportedSvg(list, id, patch) {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeImportedSvg(list, id) {
  return list.filter((item) => item.id !== id);
}
