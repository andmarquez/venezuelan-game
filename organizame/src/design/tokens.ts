import { format } from 'date-fns';

export const ASSETS = {
  mascot: '/figma/mascot.png',
  navToday: '/figma/nav-today.png',
  navDump: '/figma/nav-dump.png',
  navCalendar: '/figma/nav-calendar.png',
  navGoals: '/figma/nav-goals.png',
  settingsIcon: '/figma/icon-settings.svg',
} as const;

export function formatEditorialDate(date = new Date()) {
  return {
    line: format(date, 'EEEE, MMMM'),
    day: format(date, 'd'),
  };
}

export function formatFreeTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m free`;
}
