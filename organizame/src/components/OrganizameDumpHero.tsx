import { motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { ASSETS } from '../design/tokens';

const EXAMPLE = `Edit Flashforge video
Record 2 reels
Go to the gym 4 times
Cook 3 days
Work on my art toy collection for 6 hours
Prepare Adobe presentation
Keep one night free`;

interface OrganizameDumpHeroProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrganizameDumpHero({ value, onChange }: OrganizameDumpHeroProps) {
  const { settings, setShowSettings } = useApp();
  const lineCount = value.split('\n').filter((l) => l.trim()).length;

  return (
    <section className="relative pt-8">
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="absolute top-8 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_6px_rgba(0,0,0,0.02)]"
        aria-label="Settings"
      >
        <img src={ASSETS.settingsIcon} alt="" className="h-5 w-5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pr-14"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.55px] text-coral">
          <span aria-hidden>🧠</span>
          No filter zone
        </span>

        <h1 className="mt-4 text-[40px] font-light leading-[1.05] tracking-[-1.2px] text-ink">
          Dump
          <br />
          <span className="text-coral">everything.</span>
        </h1>

        <p className="mt-3 max-w-[290px] text-sm leading-relaxed text-ink-secondary">
          One task per line. I'll figure out durations—and whether you're delusional.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-5 overflow-hidden rounded-[26px] bg-white card-surface"
      >
        <div className="flex items-center justify-between border-b border-bg px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">
            Your brain dump
          </span>
          <span className="text-[11px] font-medium text-ink-nav">
            {lineCount > 0 ? `${lineCount} task${lineCount === 1 ? '' : 's'}` : 'Empty (for now)'}
          </span>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={EXAMPLE}
          rows={7}
          className="w-full resize-none bg-bg/40 px-4 py-4 text-sm leading-relaxed text-ink placeholder:text-ink-nav/70 focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2 border-t border-bg px-4 py-3">
          <p className="text-[11px] text-ink-nav">{settings.userName}… with love: be realistic.</p>
          {!value && (
            <button
              type="button"
              onClick={() => onChange(EXAMPLE)}
              className="shrink-0 rounded-full bg-ink-muted px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              Try example →
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
