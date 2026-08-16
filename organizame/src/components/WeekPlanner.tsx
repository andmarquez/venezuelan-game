import { useState } from 'react';
import { addDays, format, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { CalendarEvent, ScheduledBlock } from '../types';
import type { Mode } from '../types';
import { getModeById } from '../data/defaultModes';
import { DayAddTaskSheet, type DayTaskInput } from './DayAddTaskSheet';
import { DayDetailSheet } from './DayDetailSheet';
import { buildWorkoutInput, hasDailyWorkoutOnDay } from '../utils/dayPresets';

interface WeekPlannerProps {
  events: CalendarEvent[];
  scheduledBlocks: ScheduledBlock[];
  modes: Mode[];
  defaultModeId: string;
  bufferMinutes: number;
  onAddTaskToDay: (day: Date, input: DayTaskInput) => void;
  overloadedDays?: string[];
}

export function WeekPlanner({
  events,
  scheduledBlocks,
  modes,
  defaultModeId,
  bufferMinutes,
  onAddTaskToDay,
  overloadedDays = [],
}: WeekPlannerProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addingToDay, setAddingToDay] = useState<Date | null>(null);

  return (
    <>
      <div className="space-y-3">
        {days.map((day, i) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));
          const dayBlocks = scheduledBlocks.filter((b) => isSameDay(parseISO(b.start), day));
          const isOverloaded = overloadedDays.includes(dayKey);

          return (
            <motion.button
              key={dayKey}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedDay(day)}
              className={`w-full rounded-[22px] p-4 text-left card-surface ${
                isOverloaded ? 'ring-2 ring-red-300' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-nav">
                    {format(day, 'EEE')}
                  </p>
                  <p className="text-lg font-medium text-ink">{format(day, 'MMM d')}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isOverloaded && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
                      OVERLOAD
                    </span>
                  )}
                  {!hasDailyWorkoutOnDay(day, scheduledBlocks) && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTaskToDay(
                          day,
                          buildWorkoutInput(day, modes, events, scheduledBlocks, bufferMinutes),
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          onAddTaskToDay(
                            day,
                            buildWorkoutInput(day, modes, events, scheduledBlocks, bufferMinutes),
                          );
                        }
                      }}
                      className="rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-ink"
                      style={{ backgroundColor: '#ecfccb' }}
                      aria-label={`Add workout to ${format(day, 'EEEE')}`}
                    >
                      🏋️
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingToDay(day);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setAddingToDay(day);
                      }
                    }}
                    className="rounded-full bg-coral px-3 py-1.5 text-[11px] font-semibold text-white"
                    aria-label={`Add task to ${format(day, 'EEEE')}`}
                  >
                    + Add
                  </span>
                </div>
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
              </div>
            </motion.button>
          );
        })}
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

      <AnimatePresence>
        {addingToDay && (
          <DayAddTaskSheet
            day={addingToDay}
            modes={modes}
            defaultModeId={defaultModeId}
            events={events}
            scheduledBlocks={scheduledBlocks}
            bufferMinutes={bufferMinutes}
            onSave={(input) => onAddTaskToDay(addingToDay, input)}
            onClose={() => setAddingToDay(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
