import { addDays, format, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent, ScheduledBlock } from '../types';
import type { Mode } from '../types';
import { getModeById } from '../data/defaultModes';
import { formatDuration } from '../store/appStore';

interface WeekPlannerProps {
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  modes: Mode[];
  onRebalance: () => void;
  onDayClick?: (date: Date) => void;
  overloadedDays?: string[];
}

export function WeekPlanner({
  events,
  scheduledBlocks,
  modes,
  onRebalance,
  onDayClick,
  overloadedDays = [],
}: WeekPlannerProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onRebalance}
          className="rounded-[22px] bg-coral px-4 py-2 text-sm font-medium text-white"
        >
          Rebalance my week
        </button>
      </div>

      <div className="space-y-3">
        {days.map((day, i) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));
          const dayBlocks = scheduledBlocks.filter((b) => isSameDay(parseISO(b.start), day));
          const isOverloaded = overloadedDays.includes(dayKey);
          const totalMinutes =
            dayEvents.reduce((s, e) => {
              const start = parseISO(e.start);
              const end = parseISO(e.end);
              return s + (end.getTime() - start.getTime()) / 60000;
            }, 0) +
            dayBlocks.reduce((s, b) => s + b.durationMinutes, 0);

          return (
            <motion.button
              key={dayKey}
              type="button"
              onClick={() => onDayClick?.(day)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-full rounded-[22px] p-4 text-left card-surface ${
                isOverloaded ? 'ring-2 ring-red-300' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-nav">
                    {format(day, 'EEE')}
                  </p>
                  <p className="text-lg font-medium text-ink">{format(day, 'MMM d')}</p>
                </div>
                {isOverloaded && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
                    OVERLOAD
                  </span>
                )}
                <span className="text-xs font-medium text-navy/50">{formatDuration(Math.round(totalMinutes))}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {dayEvents.map((e) => {
                  const mode = getModeById(modes, e.mode ?? 'work');
                  return (
                    <span
                      key={e.id}
                      className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-navy truncate max-w-[120px]"
                      style={{ backgroundColor: mode?.bgColor ?? '#dbeafe' }}
                    >
                      {e.title}
                    </span>
                  );
                })}
                {dayBlocks.map((b) => {
                  const mode = getModeById(modes, b.mode);
                  return (
                    <span
                      key={b.id}
                      className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-navy truncate max-w-[120px] border border-dashed"
                      style={{ borderColor: mode?.color ?? '#2563eb' }}
                    >
                      {b.taskName}
                    </span>
                  );
                })}
                {dayEvents.length === 0 && dayBlocks.length === 0 && (
                  <span className="text-[10px] text-navy/40 italic">Open day ✨</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
