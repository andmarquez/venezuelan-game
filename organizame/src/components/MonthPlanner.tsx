import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import type { CalendarEvent, Mode, ScheduledBlock } from '../types';
import { getModeById } from '../data/defaultModes';
import { DayDetailSheet } from './DayDetailSheet';

interface MonthPlannerProps {
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  modes: Mode[];
  defaultModeId: string;
  bufferMinutes: number;
  overloadedDays?: string[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DaySummary {
  labels: { id: string; title: string; color: string; bgColor: string }[];
  total: number;
}

function summarizeDay(
  day: Date,
  events: CalendarEvent[],
  scheduledBlocks: ScheduledBlock[],
  modes: Mode[],
): DaySummary {
  const labels: DaySummary['labels'] = [];

  for (const e of events) {
    if (!isSameDay(parseISO(e.start), day)) continue;
    const mode = getModeById(modes, e.mode ?? 'work');
    labels.push({
      id: `e-${e.id}`,
      title: e.title,
      color: mode?.color ?? '#2563eb',
      bgColor: mode?.bgColor ?? '#dbeafe',
    });
  }

  for (const b of scheduledBlocks) {
    if (!isSameDay(parseISO(b.start), day)) continue;
    const mode = getModeById(modes, b.mode);
    labels.push({
      id: `b-${b.id}`,
      title: b.taskName,
      color: mode?.color ?? '#2563eb',
      bgColor: mode?.bgColor ?? '#dbeafe',
    });
  }

  return { labels, total: labels.length };
}

export function MonthPlanner({
  events,
  scheduledBlocks,
  modes,
  defaultModeId,
  bufferMinutes,
  overloadedDays = [],
}: MonthPlannerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const daySummaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    for (const day of calendarDays) {
      map.set(format(day, 'yyyy-MM-dd'), summarizeDay(day, events, scheduledBlocks, modes));
    }
    return map;
  }, [calendarDays, events, scheduledBlocks, modes]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-ink card-surface"
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="text-center">
            <h2 className="text-xl font-light tracking-[-0.5px] text-ink">
              {format(currentMonth, 'MMMM')}
            </h2>
            <p className="text-sm text-ink-secondary">{format(currentMonth, 'yyyy')}</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-ink card-surface"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="card-surface overflow-hidden rounded-[22px] p-2">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-nav"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const overloaded = overloadedDays.includes(dayKey);
              const summary = daySummaries.get(dayKey) ?? { labels: [], total: 0 };
              const visible = summary.labels.slice(0, 2);
              const overflow = summary.total - visible.length;

              return (
                <motion.button
                  key={dayKey}
                  type="button"
                  onClick={() => inMonth && setSelectedDay(day)}
                  whileTap={inMonth ? { scale: 0.96 } : undefined}
                  className={`flex min-h-[72px] flex-col rounded-[12px] p-1 text-left transition-colors ${
                    inMonth
                      ? today
                        ? 'bg-coral/12 ring-2 ring-coral/40'
                        : 'bg-bg/50 hover:bg-bg'
                      : 'bg-transparent opacity-40'
                  } ${overloaded && inMonth ? 'ring-1 ring-red-300' : ''}`}
                  disabled={!inMonth}
                >
                  <span
                    className={`mb-0.5 text-[11px] font-semibold leading-none ${
                      today ? 'text-coral' : inMonth ? 'text-ink' : 'text-ink-nav'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {visible.map((item) => (
                      <span
                        key={item.id}
                        className="truncate rounded px-0.5 text-[8px] font-semibold leading-tight text-ink"
                        style={{ backgroundColor: item.bgColor }}
                        title={item.title}
                      >
                        {item.title}
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-[8px] font-bold text-ink-nav">+{overflow} more</span>
                    )}
                    {summary.total === 0 && inMonth && (
                      <span className="mt-auto text-[8px] text-ink-nav/50">—</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-ink-nav">
          Tap a day to view, edit, or add tasks
        </p>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <DayDetailSheet
            day={selectedDay}
            events={events}
            scheduledBlocks={scheduledBlocks}
            modes={modes}
            defaultModeId={defaultModeId}
            bufferMinutes={bufferMinutes}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
