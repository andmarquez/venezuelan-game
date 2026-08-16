import { motion } from 'framer-motion';
import type { Mode } from '../types';

interface ModeCardProps {
  mode: Mode;
  active?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export function ModeCard({ mode, active, onClick, onEdit }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick ?? onEdit}
      className={`w-full rounded-2xl p-4 text-left transition shadow-sm ${
        active ? 'ring-2 ring-navy ring-offset-2' : ''
      }`}
      style={{ backgroundColor: mode.bgColor }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{mode.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-navy">{mode.name}</h3>
          <p className="text-xs text-navy/60 mt-0.5">
            {mode.preferredTimeStart}:00 – {mode.preferredTimeEnd}:00 · {mode.energyLevel} energy
          </p>
        </div>
        <div
          className="h-8 w-8 rounded-full shrink-0"
          style={{ backgroundColor: mode.color }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold text-navy/70">
        <span className="rounded-full bg-white/60 px-2 py-0.5">
          {mode.minBlockMinutes}–{mode.maxBlockMinutes}m blocks
        </span>
        {mode.canSplit && <span className="rounded-full bg-white/60 px-2 py-0.5">splittable</span>}
        {mode.canScheduleAtNight && (
          <span className="rounded-full bg-white/60 px-2 py-0.5">night ok</span>
        )}
      </div>
    </motion.button>
  );
}
