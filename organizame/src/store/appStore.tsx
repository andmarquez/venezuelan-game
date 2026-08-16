import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { addMinutes, format } from 'date-fns';
import { DEFAULT_MODES } from '../data/defaultModes';
import { calendarService } from '../services/calendarService';
import { reactionService } from '../services/reactionService';
import {
  isDailyTimeOffTask,
  isDailyWorkoutTask,
  syncDailyReservations,
} from '../services/dailyReservations';
import {
  generateSchedule,
  getWhatCanIDoNow,
  rebalanceWeek,
  type MonthWeekPlan,
  generateMonthPlan,
} from '../services/schedulingEngine';
import type {
  ActiveReaction,
  AndsiosaState,
  AppSettings,
  CalendarEvent,
  Mode,
  Period,
  ReactionGif,
  ReactionTrigger,
  ScheduleResult,
  ScheduledBlock,
  TabId,
  Task,
} from '../types';

const STORAGE_KEYS = {
  tasks: 'organizame.tasks',
  modes: 'organizame.modes',
  settings: 'organizame.settings',
  schedule: 'organizame.schedule',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Andrea',
  googleCalendarConnected: false,
  currentModeId: 'work',
  bufferMinutes: 10,
  dailyWorkoutEnabled: true,
  dailyWorkoutTime: '07:30',
  dailyWorkoutDurationMinutes: 60,
  dailyWorkoutSkippedDays: [],
  dailyTimeOffEnabled: true,
  dailyTimeOffTime: '20:00',
  dailyTimeOffDurationMinutes: 120,
  dailyTimeOffSkippedDays: [],
};

interface AppContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  modes: Mode[];
  updateMode: (id: string, updates: Partial<Mode>) => void;
  addMode: (mode: Mode) => void;
  tasks: Task[];
  inboxTasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  addTaskToDay: (
    day: Date,
    input: { name: string; durationMinutes: number; category: string; start: Date },
  ) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  calendarConnected: boolean;
  calendarEvents: CalendarEvent[];
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => void;
  scheduleResult: ScheduleResult | null;
  scheduledBlocks: ScheduledBlock[];
  generatePlan: (tasks: Task[], period: Period, customStart?: Date, customEnd?: Date) => void;
  rebalanceMyWeek: () => void;
  monthPlan: MonthWeekPlan[];
  reactions: ReactionGif[];
  addReaction: (reaction: Omit<ReactionGif, 'id'>) => void;
  deleteReaction: (id: string) => void;
  testReaction: (trigger: ReactionTrigger) => void;
  activeReaction: ActiveReaction | null;
  dismissReaction: () => void;
  andsiosaState: AndsiosaState;
  setAndsiosaState: (state: AndsiosaState) => void;
  assistantMessage: string;
  setAssistantMessage: (msg: string) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showQuickMenu: boolean;
  setShowQuickMenu: (show: boolean) => void;
  brainDumpText: string;
  setBrainDumpText: (text: string) => void;
  whatCanIDoNow: () => { task: Task | null; minutes: number; message: string };
  fixMyChaos: () => void;
  updateCalendarEvent: (
    id: string,
    updates: Partial<Pick<CalendarEvent, 'title' | 'start' | 'end' | 'mode'>>,
  ) => void;
  updateScheduledBlock: (
    id: string,
    updates: Partial<ScheduledBlock>,
    taskId?: string,
  ) => void;
  removeScheduledBlock: (id: string, taskId?: string) => void;
  deleteCalendarEvent: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJson<Partial<AppSettings>>(STORAGE_KEYS.settings, {}),
  }));
  const [modes, setModes] = useState<Mode[]>(() => loadJson(STORAGE_KEYS.modes, DEFAULT_MODES));
  const [tasks, setTasks] = useState<Task[]>(() => loadJson(STORAGE_KEYS.tasks, []));
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(() =>
    loadJson(STORAGE_KEYS.schedule, null),
  );
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>(
    () => scheduleResult?.scheduledBlocks ?? [],
  );
  const [reactions, setReactions] = useState<ReactionGif[]>(() => reactionService.getAll());
  const [activeReaction, setActiveReaction] = useState<ActiveReaction | null>(null);
  const [andsiosaState, setAndsiosaState] = useState<AndsiosaState>('idle');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [calendarState, setCalendarState] = useState(calendarService.getState());

  useEffect(() => {
    saveJson(STORAGE_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.modes, modes);
  }, [modes]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    if (scheduleResult) saveJson(STORAGE_KEYS.schedule, scheduleResult);
  }, [scheduleResult]);

  useEffect(() => {
    setTasks((prevTasks) => {
      setScheduledBlocks((prevBlocks) => {
        const synced = syncDailyReservations(settings, prevTasks, prevBlocks);
        setScheduleResult((prev) => (prev ? { ...prev, scheduledBlocks: synced.blocks } : prev));
        setTasks(synced.tasks);
        return synced.blocks;
      });
      return prevTasks;
    });
  }, [
    settings.dailyWorkoutEnabled,
    settings.dailyWorkoutTime,
    settings.dailyWorkoutDurationMinutes,
    settings.dailyWorkoutSkippedDays,
    settings.dailyTimeOffEnabled,
    settings.dailyTimeOffTime,
    settings.dailyTimeOffDurationMinutes,
    settings.dailyTimeOffSkippedDays,
  ]);

  const inboxTasks = useMemo(() => tasks.filter((t) => !t.scheduled && !t.completed), [tasks]);

  const triggerReaction = useCallback((trigger: ReactionTrigger, customMessage?: string) => {
    const reaction = reactionService.getByTrigger(trigger);
    if (reaction) {
      setActiveReaction({
        reaction: {
          ...reaction,
          message: customMessage ?? reaction.message,
        },
        visible: true,
      });
    }
    const stateMap: Partial<Record<ReactionTrigger, AndsiosaState>> = {
      'plan-fits': 'celebrating',
      'plan-does-not-fit': 'judging',
      overbooked: 'chaotic',
      'task-complete': 'celebrating',
      'day-complete': 'celebrating',
      'too-many-tasks': 'judging',
      'late-night-work': 'warning',
      'week-rebalance': 'focused',
    };
    setAndsiosaState(stateMap[trigger] ?? 'idle');
    setTimeout(() => setAndsiosaState('idle'), 4000);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...updates }));
  }, []);

  const updateMode = useCallback((id: string, updates: Partial<Mode>) => {
    setModes((m) => m.map((mode) => (mode.id === id ? { ...mode, ...updates } : mode)));
  }, []);

  const addMode = useCallback((mode: Mode) => {
    setModes((m) => [...m, mode]);
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((t) => [...t, newTask]);
  }, []);

  const addTaskToDay = useCallback(
    (day: Date, input: { name: string; durationMinutes: number; category: string; start: Date }) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const end = addMinutes(input.start, input.durationMinutes);

      const newTask: Task = {
        id: taskId,
        name: input.name,
        durationMinutes: input.durationMinutes,
        category: input.category,
        priority: 'medium',
        canSplit: true,
        preferredTimeOfDay: 'any',
        flexibility: 'flexible',
        scheduled: true,
        deadline: format(day, 'yyyy-MM-dd'),
        createdAt: new Date().toISOString(),
      };

      const newBlock: ScheduledBlock = {
        id: `sb-${taskId}-${Date.now()}`,
        taskId,
        taskName: input.name,
        mode: input.category,
        start: input.start.toISOString(),
        end: end.toISOString(),
        durationMinutes: input.durationMinutes,
      };

      setTasks((t) => [...t, newTask]);
      setScheduledBlocks((blocks) => {
        const updated = [...blocks, newBlock];
        setScheduleResult((prev) => ({
          fits: prev?.fits ?? true,
          scheduledBlocks: updated,
          unscheduledTasks: prev?.unscheduledTasks ?? [],
          totalAvailableMinutes: prev?.totalAvailableMinutes ?? 0,
          totalRequestedMinutes:
            (prev?.totalRequestedMinutes ??
              blocks.reduce((sum, b) => sum + b.durationMinutes, 0)) + input.durationMinutes,
          missingMinutes: prev?.missingMinutes ?? 0,
          overloadedDays: prev?.overloadedDays ?? [],
          suggestions: prev?.suggestions ?? [],
          message: prev?.message ?? '',
          assistantTone: prev?.assistantTone ?? 'info',
          trigger: prev?.trigger,
        }));
        return updated;
      });
      setAssistantMessage(`Added "${input.name}" to ${format(day, 'EEEE')}.`);
    },
    [],
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((t) => t.filter((task) => task.id !== id));
  }, []);

  const completeTask = useCallback(
    (id: string) => {
      setTasks((t) => t.map((task) => (task.id === id ? { ...task, completed: true } : task)));
      setAndsiosaState('celebrating');
      triggerReaction('task-complete');
      setTimeout(() => setAndsiosaState('idle'), 3000);

      const remaining = tasks.filter((t) => !t.completed && t.id !== id);
      const todayTasks = remaining.filter((t) => t.scheduled);
      if (todayTasks.length === 0 && remaining.length === 0) {
        triggerReaction('day-complete', 'You did it. Honestly, iconic.');
      }
    },
    [tasks, triggerReaction],
  );

  const connectCalendar = useCallback(async () => {
    setAndsiosaState('thinking');
    await calendarService.connectGoogleCalendar();
    setCalendarState(calendarService.getState());
    updateSettings({ googleCalendarConnected: true });
    setAssistantMessage('Google Calendar connected. I can see your chaos now.');
    setAndsiosaState('celebrating');
    setTimeout(() => setAndsiosaState('idle'), 2000);
  }, [updateSettings]);

  const disconnectCalendar = useCallback(() => {
    calendarService.disconnect();
    setCalendarState(calendarService.getState());
    updateSettings({ googleCalendarConnected: false });
  }, [updateSettings]);

  const generatePlan = useCallback(
    (planTasks: Task[], period: Period, customStart?: Date, customEnd?: Date) => {
      setAndsiosaState('thinking');
      const events = calendarState.events;
      setTimeout(() => {
        const result = generateSchedule(planTasks, events, {
          period,
          customStart,
          customEnd,
          modes,
          bufferMinutes: settings.bufferMinutes,
          userName: settings.userName,
        });
        setScheduleResult(result);
        setScheduledBlocks(result.scheduledBlocks);
        if (result.trigger) triggerReaction(result.trigger, result.message);
        setAndsiosaState(result.fits ? 'celebrating' : 'judging');
        setTimeout(() => setAndsiosaState('idle'), 4000);

        if (result.scheduledBlocks.length > 0) {
          setTasks((prev) =>
            prev.map((t) => {
              const scheduled = result.scheduledBlocks.some((b: ScheduledBlock) => b.taskId === t.id);
              return scheduled ? { ...t, scheduled: true } : t;
            }),
          );
        }
      }, 1200);
    },
    [calendarState.events, modes, settings.bufferMinutes, settings.userName, triggerReaction],
  );

  const rebalanceMyWeek = useCallback(() => {
    setAndsiosaState('thinking');
    const events = calendarState.events;
    const activeTasks = tasks.filter((t) => !t.completed);
    setTimeout(() => {
      const result = rebalanceWeek(activeTasks, events, modes, settings.userName);
      setScheduleResult(result);
      setScheduledBlocks(result.scheduledBlocks);
      triggerReaction('week-rebalance', result.message);
      setAndsiosaState('focused');
      setTimeout(() => setAndsiosaState('idle'), 4000);
    }, 1000);
  }, [calendarState.events, tasks, modes, settings.userName, triggerReaction]);

  const monthPlan = useMemo(
    () => generateMonthPlan(tasks.filter((t) => !t.completed), calendarState.events),
    [tasks, calendarState.events],
  );

  const addReaction = useCallback((reaction: Omit<ReactionGif, 'id'>) => {
    const added = reactionService.add(reaction);
    setReactions(reactionService.getAll());
    return added;
  }, []);

  const deleteReaction = useCallback((id: string) => {
    reactionService.delete(id);
    setReactions(reactionService.getAll());
  }, []);

  const testReaction = useCallback(
    (trigger: ReactionTrigger) => {
      triggerReaction(trigger);
    },
    [triggerReaction],
  );

  const dismissReaction = useCallback(() => {
    setActiveReaction(null);
  }, []);

  const whatCanIDoNow = useCallback(() => {
    return getWhatCanIDoNow(
      tasks.filter((t) => !t.completed),
      calendarState.events,
      modes,
    );
  }, [tasks, calendarState.events, modes]);

  const fixMyChaos = useCallback(() => {
    setActiveTab('organizame');
    setAssistantMessage("You're doing too much. Again. Let me fix it.");
    setAndsiosaState('chaotic');
    setTimeout(() => setAndsiosaState('focused'), 1500);
  }, []);

  const updateCalendarEvent = useCallback(
    (id: string, updates: Partial<Pick<CalendarEvent, 'title' | 'start' | 'end' | 'mode'>>) => {
      calendarService.updateEvent(id, updates);
      setCalendarState(calendarService.getState());
    },
    [],
  );

  const updateScheduledBlock = useCallback(
    (id: string, updates: Partial<ScheduledBlock>, taskId?: string) => {
      setScheduledBlocks((blocks) =>
        blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      );
      setScheduleResult((prev) =>
        prev
          ? {
              ...prev,
              scheduledBlocks: prev.scheduledBlocks.map((b) =>
                b.id === id ? { ...b, ...updates } : b,
              ),
            }
          : prev,
      );
      if (taskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  name: updates.taskName ?? t.name,
                  category: updates.mode ?? t.category,
                  durationMinutes: updates.durationMinutes ?? t.durationMinutes,
                }
              : t,
          ),
        );
      }
    },
    [],
  );

  const removeScheduledBlock = useCallback((id: string, taskId?: string) => {
    setScheduledBlocks((blocks) => {
      const updated = blocks.filter((b) => b.id !== id);
      setScheduleResult((prev) =>
        prev
          ? {
              ...prev,
              scheduledBlocks: updated,
              totalRequestedMinutes: updated.reduce((sum, b) => sum + b.durationMinutes, 0),
            }
          : prev,
      );
      return updated;
    });
    if (taskId) {
      if (isDailyWorkoutTask(taskId)) {
        const dayKey = taskId.replace(/^daily-workout-/, '');
        setSettings((s) => ({
          ...s,
          dailyWorkoutSkippedDays: [...new Set([...(s.dailyWorkoutSkippedDays ?? []), dayKey])],
        }));
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else if (isDailyTimeOffTask(taskId)) {
        const dayKey = taskId.replace(/^daily-timeoff-/, '');
        setSettings((s) => ({
          ...s,
          dailyTimeOffSkippedDays: [...new Set([...(s.dailyTimeOffSkippedDays ?? []), dayKey])],
        }));
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, scheduled: false } : t)),
        );
      }
    }
  }, []);

  const deleteCalendarEvent = useCallback((id: string) => {
    calendarService.deleteEvent(id);
    setCalendarState(calendarService.getState());
  }, []);

  const value: AppContextValue = {
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    modes,
    updateMode,
    addMode,
    tasks,
    inboxTasks,
    addTask,
    addTaskToDay,
    updateTask,
    deleteTask,
    completeTask,
    calendarConnected: calendarState.connected,
    calendarEvents: calendarState.events,
    connectCalendar,
    disconnectCalendar,
    scheduleResult,
    scheduledBlocks,
    generatePlan,
    rebalanceMyWeek,
    monthPlan,
    reactions,
    addReaction,
    deleteReaction,
    testReaction,
    activeReaction,
    dismissReaction,
    andsiosaState,
    setAndsiosaState,
    assistantMessage,
    setAssistantMessage,
    showSettings,
    setShowSettings,
    showQuickMenu,
    setShowQuickMenu,
    brainDumpText,
    setBrainDumpText,
    whatCanIDoNow,
    fixMyChaos,
    updateCalendarEvent,
    updateScheduledBlock,
    removeScheduledBlock,
    deleteCalendarEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel(): string {
  return format(new Date(), 'EEEE, MMMM d');
}
