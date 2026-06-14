export default function ExperienceArtTabs({ screens, activeSlug, onSelect, disabled }) {
  if (!screens?.length) {
    return null;
  }

  return (
    <div
      className="experience-art-tabs"
      role="tablist"
      aria-label="Experience artwork"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {screens.map((screen) => {
        const isActive = activeSlug === screen.slug;
        const isUnavailable = screen.available === false;

        return (
          <button
            key={screen.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isUnavailable || undefined}
            title={isUnavailable ? `${screen.label} (artwork file missing)` : screen.label}
            className={`${isActive ? 'is-active' : ''} ${isUnavailable ? 'is-unavailable' : ''}`.trim()}
            disabled={disabled || isUnavailable}
            onClick={(event) => {
              event.stopPropagation();
              if (!isUnavailable) {
                onSelect(screen.slug);
              }
            }}
          >
            {screen.label}
          </button>
        );
      })}
    </div>
  );
}
