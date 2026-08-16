import { useApp, getGreeting } from '../store/appStore';
import { formatEditorialDate, ASSETS } from '../design/tokens';

export function TodayHeader() {
  const { settings, setShowSettings } = useApp();
  const { line, day } = formatEditorialDate();

  return (
    <header className="flex items-start justify-between pt-8 pb-4">
      <div>
        <p className="text-xs font-medium text-ink-muted tracking-[-0.375px] leading-[22.5px]">
          {getGreeting()}, {settings.userName}
        </p>
        <div className="mt-1 text-ink">
          <p className="text-[22px] font-normal leading-[35.2px] tracking-[-0.8px]">{line}</p>
          <p className="text-[89px] font-light leading-[81.2px] tracking-[-0.8px] -mt-1">{day}</p>
        </div>
      </div>
      <SettingsButton onClick={() => setShowSettings(true)} />
    </header>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { setShowSettings } = useApp();

  return (
    <header className="flex items-start justify-between pt-8 pb-5">
      <div>
        <h1 className="text-[28px] font-normal text-ink tracking-[-0.5px] leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-secondary leading-relaxed max-w-[280px]">{subtitle}</p>
        )}
      </div>
      <SettingsButton onClick={() => setShowSettings(true)} />
    </header>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_6px_rgba(0,0,0,0.02)]"
      aria-label="Settings"
    >
      <img src={ASSETS.settingsIcon} alt="" className="h-5 w-5" />
    </button>
  );
}
