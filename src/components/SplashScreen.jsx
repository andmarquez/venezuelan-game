const BASE = import.meta.env.BASE_URL;
/** Bump when splash PNGs change so devices reload cached assets. */
const SPLASH_ASSET_VERSION = '20260706b';

const SLIDES = [
  { id: 'home-4', src: `${BASE}splash/home-4.png?v=${SPLASH_ASSET_VERSION}` },
  { id: 'home-2', src: `${BASE}splash/home-2.png?v=${SPLASH_ASSET_VERSION}` },
  { id: 'home-3', src: `${BASE}splash/home-3.png?v=${SPLASH_ASSET_VERSION}` },
];

export default function SplashScreen({
  status,
  error,
  onStart,
}) {
  const showStatus = status && !status.startsWith('Ready');

  return (
    <button
      type="button"
      className="splash-screen"
      aria-label="Start Experience"
      onClick={onStart}
    >
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

      {showStatus || error ? (
        <div className="splash-feedback" aria-live="polite">
          {showStatus ? <p className="status splash-status">{status}</p> : null}
          {error ? <p className="error splash-error">{error}</p> : null}
        </div>
      ) : null}
    </button>
  );
}
