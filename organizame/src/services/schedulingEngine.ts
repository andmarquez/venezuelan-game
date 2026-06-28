import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import type { Mode, Period, ScheduleResult, ScheduledBlock, Task, TimeBlock } from '../types';
import type { CalendarEvent } from '../types';
import { formatMissingTime, getMessageForTrigger, pickMessage, SUGGESTION_TEMPLATES } from '../data/assistantMessages';

const BUFFER_MINUTES = 10;
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;

interface ScheduleOptions {
  period: Period;
  customStart?: Date;
  customEnd?: Date;
  modes: Mode[];
  bufferMinutes?: number;
  userName?: string;
}

function getPeriodRange(period: Period, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfDay(now), end: endOfMonth(now) };
    case 'custom':
      return {
        start: customStart ?? startOfDay(now),
        end: customEnd ?? endOfDay(addDays(now, 7)),
      };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

function getBusyBlocks(events: CalendarEvent[]): TimeBlock[] {
  return events.map((e) => ({
    start: parseISO(e.start),
    end: parseISO(e.end),
    durationMinutes: differenceInMinutes(parseISO(e.end), parseISO(e.start)),
  }));
}

function getAvailableBlocks(
  rangeStart: Date,
  rangeEnd: Date,
  busyBlocks: TimeBlock[],
  bufferMinutes: number,
): TimeBlock[] {
  const available: TimeBlock[] = [];
  let current = startOfDay(rangeStart);

  while (isBefore(current, rangeEnd) || current.getTime() === rangeEnd.getTime()) {
    const dayStart = setMinutes(setHours(current, DAY_START_HOUR), 0);
    const dayEnd = setMinutes(setHours(current, DAY_END_HOUR), 0);
    let slotStart = isAfter(dayStart, rangeStart) ? dayStart : rangeStart;
    const slotEndLimit = isBefore(dayEnd, rangeEnd) ? dayEnd : rangeEnd;

    const dayBusy = busyBlocks
      .filter((b) => b.start < slotEndLimit && b.end > slotStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const busy of dayBusy) {
      const gapEnd = addMinutes(busy.start, -bufferMinutes);
      if (differenceInMinutes(gapEnd, slotStart) >= 15) {
        available.push({
          start: slotStart,
          end: gapEnd,
          durationMinutes: differenceInMinutes(gapEnd, slotStart),
        });
      }
      slotStart = addMinutes(busy.end, bufferMinutes);
      if (isAfter(slotStart, slotEndLimit)) break;
    }

    if (differenceInMinutes(slotEndLimit, slotStart) >= 15) {
      available.push({
        start: slotStart,
        end: slotEndLimit,
        durationMinutes: differenceInMinutes(slotEndLimit, slotStart),
      });
    }

    current = addDays(startOfDay(current), 1);
  }

  return available;
}

function priorityScore(p: Task['priority']): number {
  const map = { urgent: 4, high: 3, medium: 2, low: 1 };
  return map[p];
}

function modeAllowsTime(mode: Mode, hour: number): boolean {
  if (!mode.canScheduleAtNight && hour >= 21) return false;
  return hour >= mode.preferredTimeStart - 1 && hour <= mode.preferredTimeEnd + 1;
}

function findSlot(
  task: Task,
  mode: Mode,
  available: TimeBlock[],
  usedSlots: Set<string>,
): { block: TimeBlock; splitPart?: number; splitTotal?: number } | null {
  const sorted = [...available].sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const slot of sorted) {
    const key = `${slot.start.toISOString()}`;
    if (usedSlots.has(key)) continue;

    const hour = slot.start.getHours();
    if (!modeAllowsTime(mode, hour)) continue;

    if (slot.durationMinutes >= task.durationMinutes) {
      return { block: slot };
    }

    if (task.canSplit && mode.canSplit && slot.durationMinutes >= mode.minBlockMinutes) {
      const parts = Math.ceil(task.durationMinutes / mode.maxBlockMinutes);
      const partDuration = Math.min(slot.durationMinutes, mode.maxBlockMinutes);
      if (partDuration >= mode.minBlockMinutes) {
        return { block: slot, splitPart: 1, splitTotal: parts };
      }
    }
  }

  return null;
}

export function generateSchedule(
  tasks: Task[],
  events: CalendarEvent[],
  options: ScheduleOptions,
): ScheduleResult {
  const { period, customStart, customEnd, modes, bufferMinutes = BUFFER_MINUTES, userName = 'friend' } = options;
  const { start, end } = getPeriodRange(period, customStart, customEnd);

  const busyBlocks = getBusyBlocks(events);
  const available = getAvailableBlocks(start, end, busyBlocks, bufferMinutes);
  const totalAvailableMinutes = available.reduce((s, b) => s + b.durationMinutes, 0);
  const totalRequestedMinutes = tasks.reduce((s, t) => s + t.durationMinutes, 0);

  const sortedTasks = [...tasks].sort((a, b) => {
    const ps = priorityScore(b.priority) - priorityScore(a.priority);
    if (ps !== 0) return ps;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return b.durationMinutes - a.durationMinutes;
  });

  const scheduledBlocks: ScheduledBlock[] = [];
  const unscheduledTasks: Task[] = [];
  const usedSlotKeys = new Set<string>();
  const mutableAvailable = [...available];
  const overloadedDays = new Set<string>();

  for (const task of sortedTasks) {
    const mode = modes.find((m) => m.id === task.category) ?? modes[0];
    const slotResult = findSlot(task, mode, mutableAvailable, usedSlotKeys);

    if (!slotResult) {
      unscheduledTasks.push(task);
      continue;
    }

    const { block, splitPart, splitTotal } = slotResult;
    const duration = splitPart
      ? Math.min(block.durationMinutes, mode.maxBlockMinutes)
      : task.durationMinutes;
    const blockEnd = addMinutes(block.start, duration);

    scheduledBlocks.push({
      id: `sb-${task.id}-${scheduledBlocks.length}`,
      taskId: task.id,
      taskName: task.name,
      mode: task.category,
      start: block.start.toISOString(),
      end: blockEnd.toISOString(),
      durationMinutes: duration,
      isSplit: !!splitPart,
      splitPart,
      splitTotal,
    });

    usedSlotKeys.add(block.start.toISOString());

    const remaining = block.durationMinutes - duration;
    const idx = mutableAvailable.findIndex((s) => s.start.getTime() === block.start.getTime());
    if (idx >= 0) {
      if (remaining >= 15) {
        mutableAvailable[idx] = {
          start: blockEnd,
          end: block.end,
          durationMinutes: remaining,
        };
      } else {
        mutableAvailable.splice(idx, 1);
      }
    }
  }

  const scheduledMinutes = scheduledBlocks.reduce((s, b) => s + b.durationMinutes, 0);
  const missingMinutes = Math.max(0, totalRequestedMinutes - scheduledMinutes);

  if (unscheduledTasks.length > 0) {
    overloadedDays.add(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  }

  const fits = unscheduledTasks.length === 0 && missingMinutes === 0;
  const suggestions: string[] = [];

  if (!fits) {
    if (missingMinutes > 120) suggestions.push(SUGGESTION_TEMPLATES[0]);
    if (unscheduledTasks.some((t) => t.canSplit)) suggestions.push(SUGGESTION_TEMPLATES[2]);
    if (unscheduledTasks.some((t) => t.priority === 'low')) suggestions.push(SUGGESTION_TEMPLATES[3]);
    suggestions.push(SUGGESTION_TEMPLATES[4]);
    suggestions.push(SUGGESTION_TEMPLATES[5]);
    if (missingMinutes > 0) suggestions.push(SUGGESTION_TEMPLATES[6]);
  }

  let message: string;
  let assistantTone: ScheduleResult['assistantTone'];
  let trigger: ScheduleResult['trigger'];

  if (fits) {
    message = pickMessage('plan-fits', userName);
    assistantTone = 'success';
    trigger = 'plan-fits';
  } else if (missingMinutes > 180 || unscheduledTasks.length > 3) {
    message = `${pickMessage('plan-does-not-fit', userName)} You are missing ${formatMissingTime(missingMinutes)} for this to be humanly possible.`;
    assistantTone = 'error';
    trigger = 'overbooked';
  } else {
    message = `We can make this work, but something has to go. You're short ${formatMissingTime(missingMinutes)}.`;
    assistantTone = 'warning';
    trigger = 'plan-does-not-fit';
  }

  if (scheduledBlocks.some((b) => parseISO(b.start).getHours() >= 21)) {
    trigger = 'late-night-work';
    message += ' Also — are we really working past 9 PM?';
  }

  return {
    fits,
    scheduledBlocks,
    unscheduledTasks,
    totalAvailableMinutes,
    totalRequestedMinutes,
    missingMinutes,
    overloadedDays: [...overloadedDays],
    suggestions: [...new Set(suggestions)].slice(0, 5),
    message,
    assistantTone,
    trigger,
  };
}

export function rebalanceWeek(
  tasks: Task[],
  events: CalendarEvent[],
  modes: Mode[],
  userName = 'friend',
): ScheduleResult {
  const result = generateSchedule(tasks, events, { period: 'week', modes, userName });
  return {
    ...result,
    message: getMessageForTrigger('week-rebalance', userName),
    assistantTone: result.fits ? 'success' : 'warning',
    trigger: 'week-rebalance',
  };
}

export interface MonthWeekPlan {
  weekNumber: number;
  label: string;
  theme: string;
  focus: string;
  taskCount: number;
  totalMinutes: number;
}

export function generateMonthPlan(tasks: Task[], _events: CalendarEvent[]): MonthWeekPlan[] {
  const themes = [
    { label: 'Week 1', theme: 'Plan and prep', focus: 'Set priorities and gather resources' },
    { label: 'Week 2', theme: 'Create and record', focus: 'Execute the heavy creative work' },
    { label: 'Week 3', theme: 'Edit and review', focus: 'Refine, polish, and iterate' },
    { label: 'Week 4', theme: 'Publish and recover', focus: 'Ship it and protect rest time' },
  ];

  const totalMinutes = tasks.reduce((s, t) => s + t.durationMinutes, 0);
  const perWeek = Math.ceil(tasks.length / 4);

  return themes.map((t, i) => ({
    weekNumber: i + 1,
    label: t.label,
    theme: t.theme,
    focus: t.focus,
    taskCount: Math.min(perWeek, Math.max(0, tasks.length - i * perWeek)),
    totalMinutes: Math.round(totalMinutes / 4),
  }));
}

export function getFreeTimeToday(events: CalendarEvent[]): number {
  const now = new Date();
  const available = getAvailableBlocks(startOfDay(now), endOfDay(now), getBusyBlocks(events), BUFFER_MINUTES);
  return available.reduce((s, b) => s + b.durationMinutes, 0);
}

/** First open slot on a given day, or a sensible fallback after existing items. */
export function findSlotOnDay(
  day: Date,
  durationMinutes: number,
  events: CalendarEvent[],
  scheduledBlocks: ScheduledBlock[],
  bufferMinutes = BUFFER_MINUTES,
): Date {
  const dayStart = setMinutes(setHours(startOfDay(day), DAY_START_HOUR), 0);
  const dayEnd = setMinutes(setHours(startOfDay(day), DAY_END_HOUR), 0);

  const dayBusy: TimeBlock[] = [
    ...getBusyBlocks(events.filter((e) => isSameDay(parseISO(e.start), day))),
    ...scheduledBlocks
      .filter((b) => isSameDay(parseISO(b.start), day))
      .map((b) => ({
        start: parseISO(b.start),
        end: parseISO(b.end),
        durationMinutes: b.durationMinutes,
      })),
  ];

  const available = getAvailableBlocks(dayStart, dayEnd, dayBusy, bufferMinutes);
  const slot = available.find((s) => s.durationMinutes >= durationMinutes);
  if (slot) return slot.start;

  if (dayBusy.length === 0) {
    return setMinutes(setHours(startOfDay(day), 9), 0);
  }

  const lastEnd = dayBusy.reduce(
    (latest, b) => (b.end.getTime() > latest.getTime() ? b.end : latest),
    dayBusy[0].end,
  );
  const afterLast = addMinutes(lastEnd, bufferMinutes);
  if (isBefore(afterLast, dayEnd) && differenceInMinutes(dayEnd, afterLast) >= durationMinutes) {
    return afterLast;
  }

  return setMinutes(setHours(startOfDay(day), 9), 0);
}

export function getWhatCanIDoNow(
  tasks: Task[],
  events: CalendarEvent[],
  modes: Mode[],
): { task: Task | null; minutes: number; message: string } {
  const now = new Date();
  const available = getAvailableBlocks(now, endOfDay(now), getBusyBlocks(events), BUFFER_MINUTES);
  const nextSlot = available.find((b) => b.durationMinutes >= 15);
  const minutes = nextSlot?.durationMinutes ?? 0;

  if (!nextSlot || minutes < 15) {
    return { task: null, minutes: 0, message: 'No realistic block right now. Take a breather or check tomorrow.' };
  }

  const doable = tasks
    .filter((t) => !t.completed && !t.scheduled)
    .filter((t) => t.durationMinutes <= minutes)
    .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));

  const task = doable[0] ?? null;
  const mode = task ? modes.find((m) => m.id === task.category) : null;

  return {
    task,
    minutes,
    message: task
      ? `You've got ${minutes} min. Do "${task.name}" — ${mode?.icon ?? '✨'} ${mode?.name ?? 'task'} mode.`
      : `You've got ${minutes} min free, but nothing on your list fits. Add a quick win or enjoy the gap.`,
  };
}
