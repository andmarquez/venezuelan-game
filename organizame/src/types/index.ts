export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Flexibility = 'fixed' | 'flexible' | 'very-flexible';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
export type Period = 'today' | 'week' | 'month' | 'custom';
export type TabId = 'today' | 'organizame' | 'week' | 'inbox' | 'modes';

export type AndsiosaState =
  | 'idle'
  | 'thinking'
  | 'listening'
  | 'celebrating'
  | 'judging'
  | 'warning'
  | 'reminding'
  | 'tired'
  | 'focused'
  | 'chaotic';

export interface Mode {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  preferredDays: number[];
  preferredTimeStart: number;
  preferredTimeEnd: number;
  minBlockMinutes: number;
  maxBlockMinutes: number;
  energyLevel: 'low' | 'medium' | 'high';
  canScheduleAtNight: boolean;
  canSplit: boolean;
  isCustom?: boolean;
}

export interface Task {
  id: string;
  name: string;
  durationMinutes: number;
  category: string;
  priority: Priority;
  deadline?: string;
  canSplit: boolean;
  preferredTimeOfDay: TimeOfDay;
  flexibility: Flexibility;
  notes?: string;
  scheduled?: boolean;
  completed?: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  mode?: string;
  isAllDay?: boolean;
  source: 'google' | 'app';
  googleEventId?: string;
}

export interface ScheduledBlock {
  id: string;
  taskId: string;
  taskName: string;
  mode: string;
  start: string;
  end: string;
  durationMinutes: number;
  isSplit?: boolean;
  splitPart?: number;
  splitTotal?: number;
}

export interface TimeBlock {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface ScheduleResult {
  fits: boolean;
  scheduledBlocks: ScheduledBlock[];
  unscheduledTasks: Task[];
  totalAvailableMinutes: number;
  totalRequestedMinutes: number;
  missingMinutes: number;
  overloadedDays: string[];
  suggestions: string[];
  message: string;
  assistantTone: 'success' | 'warning' | 'error' | 'info';
  trigger?: ReactionTrigger;
}

export type ReactionTrigger =
  | 'plan-fits'
  | 'plan-does-not-fit'
  | 'overbooked'
  | 'task-complete'
  | 'day-complete'
  | 'reminder-start'
  | 'task-overdue'
  | 'too-many-tasks'
  | 'rest-removed'
  | 'late-night-work'
  | 'calendar-changed'
  | 'week-rebalance';

export interface ReactionGif {
  id: string;
  title: string;
  category: string;
  trigger: ReactionTrigger;
  message: string;
  url: string;
  isLocal?: boolean;
}

export interface AppSettings {
  userName: string;
  googleCalendarConnected: boolean;
  currentModeId: string;
  bufferMinutes: number;
  dailyWorkoutEnabled: boolean;
  dailyWorkoutTime: string;
  dailyWorkoutDurationMinutes: number;
  dailyWorkoutSkippedDays: string[];
  dailyTimeOffEnabled: boolean;
  dailyTimeOffTime: string;
  dailyTimeOffDurationMinutes: number;
  dailyTimeOffSkippedDays: string[];
}

export interface ActiveReaction {
  reaction: ReactionGif;
  visible: boolean;
}
