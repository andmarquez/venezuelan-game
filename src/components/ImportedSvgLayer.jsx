export default function ImportedSvgLayer({ experienceArt, overlayItems = [], enabled }) {
  if (!enabled) {
    return null;
  }

  const overlays = overlayItems.filter((item) => item.visible);

  if (!experienceArt?.visible && !overlays.length) {
    return null;
  }

  const renderItem = (item) => (
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
  );

  return (
    <div className="imported-svg-layer" aria-hidden="true">
      {experienceArt?.visible ? renderItem(experienceArt) : null}
      {overlays.map(renderItem)}
    </div>
  );
}
