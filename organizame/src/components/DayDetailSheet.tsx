import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMinutes, differenceInMinutes, format, isSameDay, parseISO } from 'date-fns';
import type { CalendarEvent, Mode, ScheduledBlock } from '../types';
import { formatEventTime } from '../services/calendarService';
import { getModeById } from '../data/defaultModes';
import { formatDuration, useApp } from '../store/appStore';
import {
  TimelineItemEditSheet,
  type TimelineEditItem,
  type TimelineEditPayload,
} from './TimelineItemEditSheet';
import { DayAddTaskSheet, type DayTaskInput } from './DayAddTaskSheet';
import { buildWorkoutInput, hasDailyWorkoutOnDay } from '../utils/dayPresets';

interface DayDetailSheetProps {
  day: Date;
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  modes: Mode[];
  defaultModeId: string;
  bufferMinutes: number;
  onClose: () => void;
}

function buildItems(
  day: Date,
  events: CalendarEvent[],
  scheduledBlocks: ScheduledBlock[],
): TimelineEditItem[] {
  return [
    ...events
      .filter((e) => isSameDay(parseISO(e.start), day))
      .map((e) => ({
        id: `event-${e.id}`,
        sourceId: e.id,
        type: 'event' as const,
        title: e.title,
        start: e.start,
        end: e.end,
        mode: e.mode,
      })),
    ...scheduledBlocks
      .filter((b) => isSameDay(parseISO(b.start), day))
      .map((b) => ({
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
}

function applyItemUpdate(
  item: TimelineEditItem,
  updates: TimelineEditPayload,
  updateCalendarEvent: (id: string, updates: Partial<Pick<CalendarEvent, 'title' | 'start' | 'end' | 'mode'>>) => void,
  updateScheduledBlock: (id: string, updates: Partial<ScheduledBlock>, taskId?: string) => void,
) {
  if (item.type === 'event') {
    updateCalendarEvent(item.sourceId, {
      title: updates.title,
      start: updates.start,
      end: updates.end,
      mode: updates.mode,
    });
  } else {
    updateScheduledBlock(
      item.sourceId,
      {
        taskName: updates.title,
        start: updates.start,
        end: updates.end,
        mode: updates.mode,
        durationMinutes: updates.durationMinutes,
      },
      item.taskId,
    );
  }
}

export function DayDetailSheet({
  day,
  events,
  scheduledBlocks,
  modes,
  defaultModeId,
  bufferMinutes,
  onClose,
}: DayDetailSheetProps) {
  const {
    addTaskToDay,
    updateCalendarEvent,
    updateScheduledBlock,
    removeScheduledBlock,
    deleteCalendarEvent,
    setAssistantMessage,
  } = useApp();

  const [editingItem, setEditingItem] = useState<TimelineEditItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const items = useMemo(
    () => buildItems(day, events, scheduledBlocks),
    [day, events, scheduledBlocks],
  );

  const totalMinutes = items.reduce(
    (sum, item) => sum + differenceInMinutes(parseISO(item.end), parseISO(item.start)),
    0,
  );

  const handleSave = (item: TimelineEditItem, updates: TimelineEditPayload) => {
    applyItemUpdate(item, updates, updateCalendarEvent, updateScheduledBlock);
    setAssistantMessage(`Updated "${updates.title}". Looking cleaner already.`);
  };

  const handleDelete = (item: TimelineEditItem) => {
    if (item.type === 'event') {
      deleteCalendarEvent(item.sourceId);
    } else {
      removeScheduledBlock(item.sourceId, item.taskId);
    }
    setAssistantMessage(`Removed "${item.title}" from ${format(day, 'EEEE')}.`);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[index];
    const neighbor = items[targetIndex];
    const currentDur = differenceInMinutes(parseISO(current.end), parseISO(current.start));
    const neighborDur = differenceInMinutes(parseISO(neighbor.end), parseISO(neighbor.start));
    const neighborStart = parseISO(neighbor.start);
    const currentStart = parseISO(current.start);

    applyItemUpdate(
      current,
      {
        title: current.title,
        start: neighbor.start,
        end: addMinutes(neighborStart, currentDur).toISOString(),
        mode: current.mode ?? 'work',
        durationMinutes: currentDur,
      },
      updateCalendarEvent,
      updateScheduledBlock,
    );
    applyItemUpdate(
      neighbor,
      {
        title: neighbor.title,
        start: current.start,
        end: addMinutes(currentStart, neighborDur).toISOString(),
        mode: neighbor.mode ?? 'work',
        durationMinutes: neighborDur,
      },
      updateCalendarEvent,
      updateScheduledBlock,
    );
  };

  const handleAdd = (input: DayTaskInput) => {
    addTaskToDay(day, input);
    setShowAdd(false);
  };

  const handleAddWorkout = () => {
    addTaskToDay(
      day,
      buildWorkoutInput(day, modes, events, scheduledBlocks, bufferMinutes),
    );
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[45] bg-ink/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[46] mx-auto flex max-h-[88dvh] max-w-lg flex-col rounded-t-[22px] bg-white safe-bottom card-surface"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="shrink-0 border-b border-bg px-5 pb-4 pt-5">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-nav-border" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-nav">
                {format(day, 'EEEE')}
              </p>
              <h2 className="text-2xl font-light tracking-[-0.5px] text-ink">
                {format(day, 'MMMM d')}
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                {items.length} item{items.length === 1 ? '' : 's'} · {formatDuration(totalMinutes)} scheduled
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-ink-nav"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex-1 rounded-[22px] bg-coral py-3 text-sm font-medium text-white"
            >
              + Add task
            </button>
            <button
              type="button"
              onClick={handleAddWorkout}
              disabled={hasDailyWorkoutOnDay(day, scheduledBlocks)}
              className="flex-1 rounded-[22px] py-3 text-sm font-medium text-ink disabled:opacity-40"
              style={{ backgroundColor: '#ecfccb' }}
            >
              🏋️ Workout
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center rounded-[22px] bg-bg px-6 py-10 text-center">
              <p className="text-lg text-ink">Open day</p>
              <p className="mt-2 text-sm text-ink-secondary">
                Nothing scheduled yet. Add a task or connect your calendar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const mode = getModeById(modes, item.mode ?? 'work');
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-[22px] bg-bg/60 p-3"
                    style={{ borderLeft: `3px solid ${mode?.color ?? '#2563eb'}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-mode-label">
                          {item.type === 'event' ? 'Event' : 'Task'}
                        </span>
                        {mode && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-ink"
                            style={{ backgroundColor: mode.bgColor }}
                          >
                            {mode.icon} {mode.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-sm text-ink">{item.title}</p>
                      <p className="text-xs text-ink-secondary">
                        {formatEventTime(item.start)} – {formatEventTime(item.end)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-navy"
                      >
                        Edit
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-ink-nav disabled:opacity-30"
                          aria-label="Move earlier"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-ink-nav disabled:opacity-30"
                          aria-label="Move later"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {editingItem && (
        <TimelineItemEditSheet
          item={editingItem}
          modes={modes}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}

      <AnimatePresence>
        {showAdd && (
          <DayAddTaskSheet
            day={day}
            modes={modes}
            defaultModeId={defaultModeId}
            events={events}
            scheduledBlocks={scheduledBlocks}
            bufferMinutes={bufferMinutes}
            onSave={handleAdd}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
