import { useState } from 'react';
import { useApp } from '../store/appStore';
import { WeekPlanner } from '../components/WeekPlanner';
import { MonthPlanner } from '../components/MonthPlanner';
import { ScreenHeader } from '../components/PageHeader';

export function WeekScreen() {
  const {
    calendarEvents,
    scheduledBlocks,
    modes,
    settings,
    addTaskToDay,
    scheduleResult,
  } = useApp();

  const [view, setView] = useState<'week' | 'month'>('week');

  return (
    <div className="space-y-4 pb-4">
      <ScreenHeader
        title="Calendar"
        subtitle={view === 'week' ? 'Your week at a glance.' : 'Your month at a glance.'}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('week')}
          className={`flex-1 rounded-[22px] py-2.5 text-sm font-medium ${
            view === 'week' ? 'bg-navy text-white' : 'bg-white text-ink-nav card-surface'
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setView('month')}
          className={`flex-1 rounded-[22px] py-2.5 text-sm font-medium ${
            view === 'month' ? 'bg-navy text-white' : 'bg-white text-ink-nav card-surface'
          }`}
        >
          Month
        </button>
      </div>

      {view === 'week' ? (
        <WeekPlanner
          events={calendarEvents}
          scheduledBlocks={scheduledBlocks}
          modes={modes}
          defaultModeId={settings.currentModeId}
          bufferMinutes={settings.bufferMinutes}
          onAddTaskToDay={addTaskToDay}
          overloadedDays={scheduleResult?.overloadedDays ?? []}
        />
      ) : (
        <MonthPlanner
          events={calendarEvents}
          scheduledBlocks={scheduledBlocks}
          modes={modes}
          defaultModeId={settings.currentModeId}
          bufferMinutes={settings.bufferMinutes}
          overloadedDays={scheduleResult?.overloadedDays ?? []}
        />
      )}
    </div>
  );
}
