import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent, ScheduledBlock, Mode } from '../types';
import { formatEventTime } from '../services/calendarService';
import { useApp } from '../store/appStore';
import {
  TimelineItemEditSheet,
  type TimelineEditItem,
  type TimelineEditPayload,
} from './TimelineItemEditSheet';

interface TimelineProps {
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  modes: Mode[];
  freeMinutes: number;
  freeLabel?: string;
}

export function Timeline({ events, scheduledBlocks, modes, freeMinutes, freeLabel }: TimelineProps) {
  const { updateCalendarEvent, updateScheduledBlock, setAssistantMessage } = useApp();
  const [editingItem, setEditingItem] = useState<TimelineEditItem | null>(null);

  const items: TimelineEditItem[] = [
    ...events.map((e) => ({
      id: `event-${e.id}`,
      sourceId: e.id,
      type: 'event' as const,
      title: e.title,
      start: e.start,
      end: e.end,
      mode: e.mode,
    })),
    ...scheduledBlocks.map((b) => ({
      id: `task-${b.id}`,
      sourceId: b.id,
      type: 'task' as const,
      title: b.taskName,
      start: b.start,
      end: b.end,
      mode: b.mode,
      taskId: b.taskId,
    })),
  ].sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  const label =
    freeLabel ?? `${Math.floor(freeMinutes / 60)}h ${freeMinutes % 60}m free`;

  const handleSave = (item: TimelineEditItem, updates: TimelineEditPayload) => {
    if (item.type === 'event') {
      updateCalendarEvent(item.sourceId, {
        title: updates.title,
        start: updates.start,
        end: updates.end,
        mode: updates.mode,
      });
    } else {
      updateScheduledBlock(item.sourceId, {
        taskName: updates.title,
        start: updates.start,
        end: updates.end,
        mode: updates.mode,
        durationMinutes: updates.durationMinutes,
      }, item.taskId);
    }
    setAssistantMessage(`Updated "${updates.title}". Looking cleaner already.`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl text-ink leading-[22px]">Today's timeline</h3>
        <span className="rounded-full bg-free-bg px-3 py-[7px] text-xs font-medium text-free-text tracking-[-0.3px]">
          {label}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card-surface flex min-h-[110px] items-center justify-center px-8 py-9 text-center">
          <p className="text-[14.5px] text-ink-secondary leading-[20.3px]">
            Nothing on the calendar yet. Connect
            <br />
            Google Calendar or add tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-surface rounded-[22px] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-medium text-sm text-ink">{item.title}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {formatEventTime(item.start)} – {formatEventTime(item.end)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="shrink-0 rounded-full bg-nav-active-bg px-3 py-1.5 text-[11px] font-semibold text-navy tracking-wide"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editingItem && (
        <TimelineItemEditSheet
          item={editingItem}
          modes={modes}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

export function NextEventBanner({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const upcoming = events
    .filter((e) => parseISO(e.end) > now)
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())[0];

  if (!upcoming) return null;

  return (
    <div className="card-surface rounded-[22px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Next up</p>
      <p className="text-base text-ink mt-1">{upcoming.title}</p>
      <p className="text-sm text-ink-secondary mt-1">
        {format(parseISO(upcoming.start), 'EEE')} at {formatEventTime(upcoming.start)}
      </p>
    </div>
  );
}
