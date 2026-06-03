export default function ImportedSvgLayer({ items, enabled, activeExperienceSlug }) {
  if (!enabled || !items?.length) {
    return null;
  }

  const visibleItems = items.filter((item) => item.visible);

  if (!visibleItems.length) {
    return null;
  }

  const experienceItems = visibleItems.filter((item) => item.source === 'experience');
  const overlayItems = visibleItems.filter((item) => item.source !== 'experience');

  let activeExperience = null;
  if (experienceItems.length) {
    const slug = activeExperienceSlug ?? experienceItems[0]?.slug;
    activeExperience =
      experienceItems.find((item) => item.slug === slug) ?? experienceItems[0];
  }

  const displayItems = [
    ...(activeExperience ? [activeExperience] : []),
    ...overlayItems,
  ];

  if (!displayItems.length) {
    return null;
  }

  return (
    <div className="imported-svg-layer" aria-hidden="true">
      {displayItems.map((item) => (
        <div
          key={item.id}
          className={`imported-svg-item ${item.beatPulse ? 'is-beat-reactive' : ''} ${item.source === 'experience' ? 'is-experience' : ''} ${item.fullScreen ? 'is-experience-full' : ''} ${item.lockUpright ? 'is-upright' : ''} ${item.experienceClass || ''}`}
          style={{
            '--svg-x': item.x,
            '--svg-y': item.y,
            '--svg-scale': item.scale,
            '--svg-rotation': item.lockUpright ? '0deg' : `${item.rotation}deg`,
            '--svg-opacity': item.opacity,
          }}
        >
          <div
            className={`imported-svg-markup ${item.experienceClass || ''}`}
            dangerouslySetInnerHTML={{ __html: item.markup }}
          />
        </div>
      ))}
    </div>
  );
}
