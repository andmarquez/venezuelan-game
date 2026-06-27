import { isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { getModeById } from '../data/defaultModes';
import { getFreeTimeToday } from '../services/schedulingEngine';
import { Timeline } from '../components/Timeline';
import { ScheduleBlock } from '../components/ScheduleBlock';
import { TodayHeader } from '../components/PageHeader';
import { ModeBanner, ActionCards } from '../components/ActionCards';
import { formatFreeTime } from '../design/tokens';

export function TodayScreen() {
  const {
    settings,
    modes,
    calendarEvents,
    calendarConnected,
    scheduledBlocks,
    fixMyChaos,
    setActiveTab,
    assistantMessage,
  } = useApp();

  const today = new Date();
  const todayEvents = calendarEvents.filter((e) => isSameDay(parseISO(e.start), today));
  const todayBlocks = scheduledBlocks.filter((b) => isSameDay(parseISO(b.start), today));
  const freeMinutes = calendarConnected ? getFreeTimeToday(calendarEvents) : 480;
  const currentMode = getModeById(modes, settings.currentModeId);

  return (
    <div className="space-y-5 pb-4">
      <TodayHeader />

      {assistantMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[22px] bg-white px-4 py-3 card-surface"
        >
          <p className="text-sm text-ink-secondary italic leading-relaxed">"{assistantMessage}"</p>
        </motion.div>
      )}

      <ModeBanner mode={currentMode} />

      <ActionCards
        onMakeItPossible={() => setActiveTab('organizame')}
        onFixChaos={fixMyChaos}
      />

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
