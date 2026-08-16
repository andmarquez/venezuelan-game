import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import type { ScheduledBlock } from '../types';
import type { Mode } from '../types';
import { getModeById } from '../data/defaultModes';
import { formatDuration } from '../store/appStore';

interface ScheduleBlockProps {
  block: ScheduledBlock;
  modes: Mode[];
  index?: number;
}

export function ScheduleBlock({ block, modes, index = 0 }: ScheduleBlockProps) {
  const mode = getModeById(modes, block.mode);
  const start = parseISO(block.start);
  const end = parseISO(block.end);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl px-3 py-2 text-sm"
      style={{ backgroundColor: mode?.bgColor ?? '#dbeafe', borderLeft: `4px solid ${mode?.color ?? '#2563eb'}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span>{mode?.icon ?? '📌'}</span>
          <span className="font-semibold text-navy truncate">{block.taskName}</span>
        </div>
        <span className="text-xs font-medium text-navy/60 shrink-0">
          {formatDuration(block.durationMinutes)}
        </span>
      </div>
      <p className="text-xs text-navy/50 mt-0.5">
        {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
        {block.isSplit && block.splitPart && block.splitTotal && (
          <span className="ml-1">(part {block.splitPart}/{block.splitTotal})</span>
        )}
      </p>
    </motion.div>
  );
}
