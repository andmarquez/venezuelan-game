import { EXPERIENCE_SCREENS } from '../config/defaults.js';

export default function ExperienceArtTabs({ activeSlug, onSelect, disabled }) {
  return (
    <div
      className="experience-art-tabs"
      role="tablist"
      aria-label="Experience artwork"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {EXPERIENCE_SCREENS.map((screen) => {
        const isActive = activeSlug === screen.slug;

        return (
          <button
            key={screen.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'is-active' : ''}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(screen.slug);
            }}
          >
            {screen.label}
          </button>
        );
      })}
    </div>
  );
}
