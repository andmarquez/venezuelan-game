import { slugFromFilename } from './experienceManifest.js';

const SHAPE_SELECTOR =
  'path, rect, circle, ellipse, polygon, polyline, line';

export function getExperienceTheme(filename) {
  const slug = slugFromFilename(filename);

  return {
    slug,
    experienceClass: 'experience-art',
    fullScreen: true,
    lockUpright: true,
  };
}

function assignExperienceLayerClasses(groups, svg) {
  const count = groups.length;
  const pathCount = svg.querySelectorAll('path').length;
  const typographyHeavy = count <= 2 && pathCount >= 3;

  groups.forEach((group, index) => {
    const classes = ['experience-layer'];

    if (index === 0) {
      if (typographyHeavy && count === 1) {
        classes.push('experience-art-title-top');
      } else if (typographyHeavy && count === 2) {
        classes.push('experience-art-title-mid');
      } else {
        classes.push('experience-art-illustration');
      }
    } else if (count >= 3 && index === count - 2) {
      classes.push('experience-art-title-mid');
    } else if (index === count - 1) {
      classes.push('experience-art-title-top');
    } else if (index === 1 && count >= 4) {
      classes.push('experience-art-detail');
    } else if (index === 2 && count >= 5) {
      classes.push('experience-art-header');
    } else {
      classes.push(`experience-art-layer-${index}`);
    }

    group.classList.add(...classes);
  });
}

function normalizeExperienceShapes(svg) {
  svg.querySelectorAll(SHAPE_SELECTOR).forEach((shape) => {
    shape.removeAttribute('fill');
    shape.removeAttribute('stroke');
    shape.removeAttribute('style');

    shape.classList.forEach((className) => {
      if (/^(cls-|st\d|fil\d|cls_\d)/i.test(className)) {
        shape.classList.remove(className);
      }
    });

    if (shape.tagName === 'path') {
      shape.classList.add('experience-path');
    } else {
      shape.classList.add('experience-shape');
    }
  });
}

function wrapOrphanShapes(svg, doc, layerClass = 'experience-art-title-top') {
  const orphans = [
    ...svg.querySelectorAll(
      ':scope > path, :scope > rect, :scope > circle, :scope > ellipse, :scope > polygon, :scope > polyline, :scope > line',
    ),
  ];

  if (!orphans.length) {
    return;
  }

  const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
  wrapper.classList.add('experience-layer', layerClass);
  svg.insertBefore(wrapper, orphans[0]);
  orphans.forEach((shape) => wrapper.appendChild(shape));
}

export function enhanceExperienceMarkup(markup, filename) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;

  if (svg.querySelector('parsererror')) {
    return markup;
  }

  svg.querySelectorAll('style').forEach((node) => node.remove());
  svg.classList.add('experience-svg-root');

  const groups = [...svg.querySelectorAll(':scope > g')];
  if (groups.length) {
    assignExperienceLayerClasses(groups, svg);
  }

  wrapOrphanShapes(svg, doc);
  normalizeExperienceShapes(svg);

  return svg.outerHTML;
}
