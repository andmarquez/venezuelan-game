import { motion } from 'framer-motion';
import type { ScheduleResult } from '../types';
import { formatDuration } from '../store/appStore';
import { ScheduleBlock } from './ScheduleBlock';
import type { Mode } from '../types';

interface GeneratedPlanProps {
  result: ScheduleResult;
  modes: Mode[];
  onAccept?: () => void;
}

export function GeneratedPlan({ result, modes, onAccept }: GeneratedPlanProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Available" value={formatDuration(result.totalAvailableMinutes)} />
        <StatCard label="Requested" value={formatDuration(result.totalRequestedMinutes)} />
        <StatCard
          label="Missing"
          value={result.missingMinutes > 0 ? formatDuration(result.missingMinutes) : '0m'}
          highlight={result.missingMinutes > 0}
        />
      </div>

      {result.scheduledBlocks.length > 0 && (
        <div>
          <h4 className="text-xl text-ink mb-2">
            Proposed schedule ({result.scheduledBlocks.length} blocks)
          </h4>
          <div className="space-y-2">
            {result.scheduledBlocks.map((block, i) => (
              <ScheduleBlock key={block.id} block={block} modes={modes} index={i} />
            ))}
          </div>
        </div>
      )}

      {result.unscheduledTasks.length > 0 && (
        <div className="rounded-[22px] bg-red-50 p-4">
          <h4 className="font-medium text-red-700 text-sm mb-2">
            Couldn't fit ({result.unscheduledTasks.length})
          </h4>
          <ul className="space-y-1">
            {result.unscheduledTasks.map((t) => (
              <li key={t.id} className="text-sm text-red-600">
                • {t.name} ({formatDuration(t.durationMinutes)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestions.length > 0 && !result.fits && (
        <div className="card-surface rounded-[22px] p-4">
          <h4 className="text-ink font-medium mb-2">How to fix this</h4>
          <ul className="space-y-2">
            {result.suggestions.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="text-coral">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.fits && onAccept && (
        <button
          type="button"
          onClick={onAccept}
          className="w-full rounded-[22px] bg-navy py-4 font-medium text-white"
        >
          Accept this plan ✓
        </button>
      )}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] p-3 text-center ${highlight ? 'bg-red-50' : 'bg-white card-surface'}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-nav">{label}</p>
      <p className="text-lg font-medium text-ink mt-0.5">{value}</p>
    </div>
  );
}
