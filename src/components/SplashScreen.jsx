const BASE = import.meta.env.BASE_URL;

const SLIDES = [
  { id: 'home-1', src: `${BASE}splash/home-1.png` },
  { id: 'home-2', src: `${BASE}splash/home-2.png` },
  { id: 'home-3', src: `${BASE}splash/home-3.png` },
];

export default function SplashScreen({
  status,
  error,
  onStart,
}) {
  const showStatus = status && !status.startsWith('Ready');

  return (
    <div className="splash-screen" aria-label="Welcome">
      <div className="splash-slides" aria-hidden="true">
        {SLIDES.map((slide) => (
          <div key={slide.id} className="splash-slide">
            <img
              className="splash-bg-image"
              src={slide.src}
              alt=""
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="splash-ui">
        <button
          className="start-button start-button--glass"
          type="button"
          aria-label="Start Experience"
          onClick={onStart}
        >
          <span className="start-button-shine start-button-shine--left" aria-hidden="true" />
          <span className="start-button-label">Start Experience</span>
          <span className="start-button-shine start-button-shine--right" aria-hidden="true" />
        </button>

        {showStatus ? <p className="status splash-status">{status}</p> : null}
        {error ? <p className="error splash-error">{error}</p> : null}
      </div>
    </div>
  );
}
