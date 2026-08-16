import { setHours, setMinutes, startOfDay } from 'date-fns';
import type { CalendarEvent, Mode, ScheduledBlock } from '../types';
import { findSlotOnDay } from '../services/schedulingEngine';
import { dailyWorkoutTaskId } from '../services/dailyReservations';
import type { DayTaskInput } from '../components/DayAddTaskSheet';

const WORKOUT_DURATION = 60;

export function hasDailyWorkoutOnDay(day: Date, scheduledBlocks: ScheduledBlock[]): boolean {
  const taskId = dailyWorkoutTaskId(day);
  return scheduledBlocks.some((b) => b.taskId === taskId);
}

export function buildWorkoutInput(
  day: Date,
  modes: Mode[],
  events: CalendarEvent[],
  scheduledBlocks: ScheduledBlock[],
  bufferMinutes: number,
): DayTaskInput {
  const workoutMode = modes.find((m) => m.id === 'workout');
  const preferredStart = setMinutes(
    setHours(startOfDay(day), workoutMode?.preferredTimeStart ?? 7),
    30,
  );
  const openSlot = findSlotOnDay(day, WORKOUT_DURATION, events, scheduledBlocks, bufferMinutes);

  const start =
    openSlot.getHours() <= (workoutMode?.preferredTimeEnd ?? 20) &&
    openSlot.getHours() >= (workoutMode?.preferredTimeStart ?? 6)
      ? openSlot
      : preferredStart;

  return {
    name: 'Workout',
    durationMinutes: WORKOUT_DURATION,
    category: 'workout',
    start,
  };
}
