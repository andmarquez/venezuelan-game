import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { differenceInMinutes, parseISO, addMinutes } from 'date-fns';
import type { Mode } from '../types';
import { formatEventTime } from '../services/calendarService';

export interface TimelineEditItem {
  id: string;
  sourceId: string;
  type: 'event' | 'task';
  title: string;
  start: string;
  end: string;
  mode?: string;
  taskId?: string;
}

interface TimelineItemEditSheetProps {
  item: TimelineEditItem;
  modes: Mode[];
  onSave: (item: TimelineEditItem, updates: TimelineEditPayload) => void;
  onClose: () => void;
}

export interface TimelineEditPayload {
  title: string;
  start: string;
  end: string;
  mode: string;
  durationMinutes: number;
}

function toTimeValue(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function applyTime(iso: string, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = parseISO(iso);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function TimelineItemEditSheet({ item, modes, onSave, onClose }: TimelineItemEditSheetProps) {
  const [title, setTitle] = useState(item.title);
  const [startTime, setStartTime] = useState(toTimeValue(item.start));
  const [endTime, setEndTime] = useState(toTimeValue(item.end));
  const [mode, setMode] = useState(item.mode ?? 'work');

  useEffect(() => {
    setTitle(item.title);
    setStartTime(toTimeValue(item.start));
    setEndTime(toTimeValue(item.end));
    setMode(item.mode ?? 'work');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const start = applyTime(item.start, startTime);
    let end = applyTime(item.start, endTime);
    if (parseISO(end) <= parseISO(start)) {
      end = addMinutes(parseISO(start), Math.max(15, differenceInMinutes(parseISO(item.end), parseISO(item.start)))).toISOString();
    }

    onSave(item, {
      title: title.trim(),
      start,
      end,
      mode,
      durationMinutes: Math.max(15, differenceInMinutes(parseISO(end), parseISO(start))),
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
          <h2 className="text-xl text-ink mb-1">Edit {item.type === 'event' ? 'event' : 'task'}</h2>
          <p className="text-sm text-ink-secondary mb-4">
            {formatEventTime(item.start)} – {formatEventTime(item.end)}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Name</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">End</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-1 w-full rounded-[14px] bg-bg px-3 py-3 text-sm text-ink"
              >
                {modes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </label>

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
                className="flex-1 rounded-[22px] bg-navy py-3 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          </form>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
