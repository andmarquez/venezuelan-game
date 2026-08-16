import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMinutes, format, setHours, setMinutes, startOfDay } from 'date-fns';
import type { CalendarEvent, Mode, ScheduledBlock } from '../types';
import { findSlotOnDay } from '../services/schedulingEngine';
import { buildWorkoutInput } from '../utils/dayPresets';

export interface DayTaskInput {
  name: string;
  durationMinutes: number;
  category: string;
  start: Date;
}

interface DayAddTaskSheetProps {
  day: Date;
  modes: Mode[];
  defaultModeId: string;
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  bufferMinutes: number;
  onSave: (input: DayTaskInput) => void;
  onClose: () => void;
}

function toTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function applyTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return setMinutes(setHours(startOfDay(day), h), m);
}

export function DayAddTaskSheet({
  day,
  modes,
  defaultModeId,
  events,
  scheduledBlocks,
  bufferMinutes,
  onSave,
  onClose,
}: DayAddTaskSheetProps) {
  const defaultStart = useMemo(
    () => findSlotOnDay(day, 60, events, scheduledBlocks, bufferMinutes),
    [day, events, scheduledBlocks, bufferMinutes],
  );

  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState(() => toTimeValue(defaultStart));
  const [category, setCategory] = useState(defaultModeId);

  useEffect(() => {
    setStartTime(toTimeValue(defaultStart));
  }, [defaultStart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      durationMinutes: Math.max(15, duration),
      category,
      start: applyTime(day, startTime),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-[22px] bg-white p-5 safe-bottom card-surface"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-nav-border" />
          <h2 className="text-xl text-ink mb-1">Add to {format(day, 'EEEE')}</h2>
          <p className="text-sm text-ink-secondary mb-4">{format(day, 'MMMM d')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const preset = buildWorkoutInput(
                    day,
                    modes,
                    events,
                    scheduledBlocks,
                    bufferMinutes,
                  );
                  setName(preset.name);
                  setDuration(preset.durationMinutes);
                  setCategory(preset.category);
                  setStartTime(toTimeValue(preset.start));
                }}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-ink"
                style={{ backgroundColor: '#ecfccb' }}
              >
                🏋️ Workout · 60m
              </button>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">
                Task
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What needs doing?"
                className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                required
                autoFocus
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">
                  Duration (min)
                </span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 15)}
                  min={15}
                  step={15}
                  className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">
                  Start time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Mode</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
              >
                {modes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-[11px] text-ink-nav">
              Ends around {format(addMinutes(applyTime(day, startTime), duration), 'h:mm a')}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[22px] bg-bg py-3 text-sm font-medium text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-[22px] bg-coral py-3 text-sm font-medium text-white"
              >
                Add to day
              </button>
            </div>
          </form>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
