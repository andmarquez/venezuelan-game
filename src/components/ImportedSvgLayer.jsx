export default function ImportedSvgLayer({ items, enabled }) {
  if (!enabled || !items?.length) {
    return null;
  }

  const visibleItems = items.filter((item) => item.visible);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div className="imported-svg-layer" aria-hidden="true">
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className={`imported-svg-item ${item.beatPulse ? 'is-beat-reactive' : ''}`}
          style={{
            '--svg-x': item.x,
            '--svg-y': item.y,
            '--svg-scale': item.scale,
            '--svg-rotation': `${item.rotation}deg`,
            '--svg-opacity': item.opacity,
          }}
        >
          <div className="imported-svg-markup" dangerouslySetInnerHTML={{ __html: item.markup }} />
        </div>
      ))}
    </div>
  );
}
