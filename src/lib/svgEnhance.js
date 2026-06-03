export const EXPERIENCE_ART_SLUGS = [
  'saoko',
  'despecha',
  'berghain',
  'bizcochito',
  'perla',
];

export function getExperienceTheme(filename) {
  const slug = filename.replace(/\.svg$/i, '').toLowerCase();

  return {
    slug,
    experienceClass: 'experience-art',
    fullScreen: true,
    lockUpright: true,
  };
}

function assignExperienceLayerClasses(groups) {
  const count = groups.length;

  groups.forEach((group, index) => {
    const classes = ['experience-layer'];

    if (index === 0) {
      classes.push('experience-art-illustration');
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
    assignExperienceLayerClasses(groups);
  }

  svg.querySelectorAll('path').forEach((path) => {
    path.classList.remove('cls-1');
    path.classList.add('experience-path');
  });

  return svg.outerHTML;
}
