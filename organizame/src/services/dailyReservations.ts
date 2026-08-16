import {
  addMinutes,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import type { AppSettings } from '../types';
import type { ScheduledBlock, Task } from '../types';

export const DAILY_WORKOUT_PREFIX = 'daily-workout-';
export const DAILY_TIMEOFF_PREFIX = 'daily-timeoff-';

export function dailyWorkoutTaskId(day: Date): string {
  return `${DAILY_WORKOUT_PREFIX}${format(day, 'yyyy-MM-dd')}`;
}

export function dailyTimeOffTaskId(day: Date): string {
  return `${DAILY_TIMEOFF_PREFIX}${format(day, 'yyyy-MM-dd')}`;
}

export function isDailyWorkoutTask(taskId: string): boolean {
  return taskId.startsWith(DAILY_WORKOUT_PREFIX);
}

export function isDailyTimeOffTask(taskId: string): boolean {
  return taskId.startsWith(DAILY_TIMEOFF_PREFIX);
}

export function isDailyReservationTask(taskId: string): boolean {
  return isDailyWorkoutTask(taskId) || isDailyTimeOffTask(taskId);
}

export function getDailyReservationRange(): { start: Date; end: Date } {
  const today = new Date();
  return {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(addWeeks(today, 7), { weekStartsOn: 1 }),
  };
}

function buildSlotStart(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return setMinutes(setHours(startOfDay(day), h), m);
}

type ReservationSettings = Pick<
  AppSettings,
  | 'dailyWorkoutEnabled'
  | 'dailyWorkoutTime'
  | 'dailyWorkoutDurationMinutes'
  | 'dailyWorkoutSkippedDays'
  | 'dailyTimeOffEnabled'
  | 'dailyTimeOffTime'
  | 'dailyTimeOffDurationMinutes'
  | 'dailyTimeOffSkippedDays'
>;

function syncOneReservation(
  tasks: Task[],
  blocks: ScheduledBlock[],
  config: {
    enabled: boolean;
    time: string;
    durationMinutes: number;
    skippedDays: string[];
    taskIdFn: (day: Date) => string;
    name: string;
    mode: string;
    preferredTimeOfDay: Task['preferredTimeOfDay'];
    isWorkout: boolean;
  },
): { tasks: Task[]; blocks: ScheduledBlock[] } {
  const prefix = config.isWorkout ? DAILY_WORKOUT_PREFIX : DAILY_TIMEOFF_PREFIX;
  const without = {
    tasks: tasks.filter((t) => !t.id.startsWith(prefix)),
    blocks: blocks.filter((b) => !b.taskId.startsWith(prefix)),
  };

  if (!config.enabled) return without;

  const skipped = new Set(config.skippedDays);
  const existingTasks = new Map(tasks.filter((t) => t.id.startsWith(prefix)).map((t) => [t.id, t]));
  const { start, end } = getDailyReservationRange();
  const days = eachDayOfInterval({ start, end });

  const nextTasks = [...without.tasks];
  const nextBlocks = [...without.blocks];

  for (const day of days) {
    const dayKey = format(day, 'yyyy-MM-dd');
    if (skipped.has(dayKey)) continue;

    const taskId = config.taskIdFn(day);
    const startDate = buildSlotStart(day, config.time);
    const endDate = addMinutes(startDate, config.durationMinutes);
    const existing = existingTasks.get(taskId);

    nextTasks.push({
      id: taskId,
      name: config.name,
      durationMinutes: config.durationMinutes,
      category: config.mode,
      priority: 'medium',
      canSplit: false,
      preferredTimeOfDay: config.preferredTimeOfDay,
      flexibility: 'fixed',
      scheduled: true,
      deadline: dayKey,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });

    nextBlocks.push({
      id: `sb-${taskId}`,
      taskId,
      taskName: config.name,
      mode: config.mode,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      durationMinutes: config.durationMinutes,
    });
  }

  nextBlocks.sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  return { tasks: nextTasks, blocks: nextBlocks };
}

export function syncDailyReservations(
  settings: ReservationSettings,
  tasks: Task[],
  blocks: ScheduledBlock[],
): { tasks: Task[]; blocks: ScheduledBlock[] } {
  const afterWorkout = syncOneReservation(tasks, blocks, {
    enabled: settings.dailyWorkoutEnabled,
    time: settings.dailyWorkoutTime,
    durationMinutes: settings.dailyWorkoutDurationMinutes,
    skippedDays: settings.dailyWorkoutSkippedDays ?? [],
    taskIdFn: dailyWorkoutTaskId,
    name: 'Workout',
    mode: 'workout',
    preferredTimeOfDay: 'morning',
    isWorkout: true,
  });

  return syncOneReservation(afterWorkout.tasks, afterWorkout.blocks, {
    enabled: settings.dailyTimeOffEnabled,
    time: settings.dailyTimeOffTime,
    durationMinutes: settings.dailyTimeOffDurationMinutes,
    skippedDays: settings.dailyTimeOffSkippedDays ?? [],
    taskIdFn: dailyTimeOffTaskId,
    name: 'Time off',
    mode: 'time-off',
    preferredTimeOfDay: 'evening',
    isWorkout: false,
  });
}

/** @deprecated Use syncDailyReservations */
export function syncDailyWorkouts(
  settings: ReservationSettings,
  tasks: Task[],
  blocks: ScheduledBlock[],
): { tasks: Task[]; blocks: ScheduledBlock[] } {
  return syncDailyReservations(settings, tasks, blocks);
}

export function buildDailyWorkoutStart(day: Date, time: string): Date {
  return buildSlotStart(day, time);
}
