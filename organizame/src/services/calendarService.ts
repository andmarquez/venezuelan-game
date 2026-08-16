import {
  addDays,
  addMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { CalendarEvent } from '../types';

function makeEvent(
  id: string,
  title: string,
  dayOffset: number,
  startHour: number,
  startMin: number,
  durationMin: number,
  mode?: string,
): CalendarEvent {
  const base = addDays(startOfDay(new Date()), dayOffset);
  const start = setMinutes(setHours(base, startHour), startMin);
  const end = addMinutes(start, durationMin);
  return {
    id,
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    mode,
    source: 'google',
    googleEventId: `gcal-${id}`,
  };
}

export function generateMockCalendarEvents(): CalendarEvent[] {
  return [
    makeEvent('e1', 'Team standup', 0, 9, 0, 30, 'work'),
    makeEvent('e2', 'Client call', 0, 11, 0, 60, 'work'),
    makeEvent('e3', 'Lunch break', 0, 13, 0, 60, 'time-off'),
    makeEvent('e4', 'Yoga class', 1, 7, 30, 60, 'workout'),
    makeEvent('e5', 'Deep work block', 1, 10, 0, 120, 'work'),
    makeEvent('e6', 'Dentist', 2, 15, 0, 45, 'errands'),
    makeEvent('e7', 'Content planning', 3, 14, 0, 90, 'content'),
    makeEvent('e8', 'Dinner with friends', 4, 19, 0, 120, 'time-off'),
    makeEvent('e9', 'Weekend brunch', 6, 11, 0, 90, 'time-off'),
    makeEvent('e10', 'Admin: invoices', 0, 16, 0, 45, 'admin'),
    makeEvent('e11', 'Creative session', 2, 10, 0, 90, 'creative'),
    makeEvent('e12', 'Grocery run', 5, 10, 0, 60, 'errands'),
  ];
}

export interface CalendarServiceState {
  connected: boolean;
  events: CalendarEvent[];
  createdEventIds: string[];
}

const STORAGE_KEY = 'organizame.calendar';

let state: CalendarServiceState = {
  connected: false,
  events: [],
  createdEventIds: [],
};

function loadState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CalendarServiceState;
      state = { ...state, ...parsed };
    }
  } catch {
    // ignore
  }
}

function saveState(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

loadState();

export const calendarService = {
  getState(): CalendarServiceState {
    return { ...state, events: [...state.events], createdEventIds: [...state.createdEventIds] };
  },

  async connectGoogleCalendar(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 800));
    state.connected = true;
    state.events = generateMockCalendarEvents();
    saveState();
    return true;
  },

  disconnect(): void {
    state.connected = false;
    state.events = [];
    saveState();
  },

  getEvents(start: Date, end: Date): CalendarEvent[] {
    if (!state.connected) return [];
    return state.events.filter((e) => {
      const s = parseISO(e.start);
      const en = parseISO(e.end);
      return (
        isWithinInterval(s, { start, end }) ||
        isWithinInterval(en, { start, end }) ||
        (s <= start && en >= end)
      );
    });
  },

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.getEvents(startOfDay(date), endOfDay(date));
  },

  getEventsForWeek(date: Date): CalendarEvent[] {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return this.getEvents(start, end);
  },

  getEventsForMonth(date: Date): CalendarEvent[] {
    return this.getEvents(startOfMonth(date), endOfMonth(date));
  },

  async syncBlocksToCalendar(
    blocks: { title: string; start: string; end: string; mode?: string }[],
  ): Promise<string[]> {
    const newIds: string[] = [];
    for (const block of blocks) {
      const id = `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (!state.createdEventIds.includes(id)) {
        state.events.push({
          id,
          title: block.title,
          start: block.start,
          end: block.end,
          mode: block.mode,
          source: 'app',
        });
        state.createdEventIds.push(id);
        newIds.push(id);
      }
    }
    saveState();
    return newIds;
  },

  isDuplicate(title: string, start: string): boolean {
    return state.events.some(
      (e) => e.title === title && e.start === start,
    );
  },

  updateEvent(id: string, updates: Partial<Pick<CalendarEvent, 'title' | 'start' | 'end' | 'mode'>>): CalendarEvent | undefined {
    const idx = state.events.findIndex((e) => e.id === id);
    if (idx < 0) return undefined;
    state.events[idx] = { ...state.events[idx], ...updates };
    saveState();
    return state.events[idx];
  },

  deleteEvent(id: string): boolean {
    const before = state.events.length;
    state.events = state.events.filter((e) => e.id !== id);
    state.createdEventIds = state.createdEventIds.filter((cid) => cid !== id);
    if (state.events.length < before) {
      saveState();
      return true;
    }
    return false;
  },
};

export function formatEventTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatEventDate(iso: string): string {
  return format(parseISO(iso), 'EEE, MMM d');
}
