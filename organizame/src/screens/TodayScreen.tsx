import { isSameDay, parseISO } from 'date-fns';
import { useApp } from '../store/appStore';
import { getModeById } from '../data/defaultModes';
import { getFreeTimeToday } from '../services/schedulingEngine';
import { Timeline } from '../components/Timeline';
import { ScheduleBlock } from '../components/ScheduleBlock';
import { TodayHeader } from '../components/PageHeader';
import { ModeBanner } from '../components/ActionCards';
import { formatFreeTime } from '../design/tokens';

export function TodayScreen() {
  const {
    settings,
    modes,
    calendarEvents,
    calendarConnected,
    scheduledBlocks,
  } = useApp();

  const today = new Date();
  const todayEvents = calendarEvents.filter((e) => isSameDay(parseISO(e.start), today));
  const todayBlocks = scheduledBlocks.filter((b) => isSameDay(parseISO(b.start), today));
  const freeMinutes = calendarConnected ? getFreeTimeToday(calendarEvents) : 480;
  const currentMode = getModeById(modes, settings.currentModeId);

  return (
    <div className="space-y-5 pb-4">
      <TodayHeader />

      <ModeBanner mode={currentMode} />

      <Timeline
        events={todayEvents}
        scheduledBlocks={todayBlocks}
        modes={modes}
        freeMinutes={freeMinutes}
        freeLabel={formatFreeTime(freeMinutes)}
      />

      {todayBlocks.length > 0 && (
        <div>
          <h3 className="text-xl text-ink mb-3">Scheduled tasks</h3>
          <div className="space-y-2">
            {todayBlocks.map((block, i) => (
              <ScheduleBlock key={block.id} block={block} modes={modes} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
