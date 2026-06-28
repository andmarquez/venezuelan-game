import type { Mode } from '../types';

interface ModeBannerProps {
  mode: Mode | undefined;
}

export function ModeBanner({ mode }: ModeBannerProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-[22px] px-[18px] py-[18px]"
      style={{ backgroundColor: mode?.bgColor ?? '#e1eaff' }}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label whitespace-nowrap">
        Current mode:
      </span>
      <span className="text-base text-ink leading-[26px]">{mode?.name ?? 'Work Mode'}</span>
    </div>
  );
}

interface ActionCardsProps {
  onMakeItPossible: () => void;
  onFixChaos: () => void;
}

export function ActionCards({ onMakeItPossible, onFixChaos }: ActionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <button
        type="button"
        onClick={onMakeItPossible}
        className="flex h-[91px] flex-col justify-end rounded-[22px] bg-navy px-[18px] py-5 text-left"
      >
        <p className="text-base text-white leading-[26.25px]">Make it possible</p>
        <p className="text-[13px] text-navy-muted leading-[13px]">Add to schedule</p>
      </button>
      <button
        type="button"
        onClick={onFixChaos}
        className="flex flex-col justify-center gap-0.5 rounded-[22px] bg-coral px-[18px] py-3.5 text-left"
      >
        <p className="text-base text-white leading-[26.25px]">Fix my chaos</p>
        <p className="text-[13px] text-coral-muted leading-[13px] mt-1.5">Emergency mode</p>
      </button>
    </div>
  );
}
