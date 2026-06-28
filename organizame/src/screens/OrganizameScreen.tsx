import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { BrainDumpInput } from '../components/BrainDumpInput';
import { TaskCard } from '../components/TaskCard';
import { GeneratedPlan } from '../components/GeneratedPlan';
import { parseBrainDump } from '../services/taskParser';
import type { Period, Task } from '../types';
import { ScreenHeader } from '../components/PageHeader';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
];

export function OrganizameScreen() {
  const {
    brainDumpText,
    setBrainDumpText,
    modes,
    generatePlan,
    scheduleResult,
    andsiosaState,
    fixMyChaos,
    addTask,
  } = useApp();

  const [period, setPeriod] = useState<Period>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [parsedTasks, setParsedTasks] = useState<Task[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleParse = () => {
    const result = parseBrainDump(brainDumpText);
    const newTasks: Task[] = result.tasks.map((t, i) => ({
      id: `parsed-${Date.now()}-${i}`,
      name: t.name,
      durationMinutes: t.durationMinutes,
      category: t.category,
      priority: t.priority,
      canSplit: t.canSplit,
      preferredTimeOfDay: t.preferredTimeOfDay,
      flexibility: t.flexibility,
      deadline: t.deadline,
      createdAt: new Date().toISOString(),
    }));
    setParsedTasks(newTasks);
    setHasParsed(true);
  };

  const handleMakeItPossible = () => {
    const taskList = hasParsed ? parsedTasks : [];
    if (taskList.length === 0) {
      handleParse();
      return;
    }
    generatePlan(
      taskList,
      period,
      customStart ? new Date(customStart) : undefined,
      customEnd ? new Date(customEnd) : undefined,
    );
  };

  const totalRequested = useMemo(
    () => parsedTasks.reduce((s, t) => s + t.durationMinutes, 0),
    [parsedTasks],
  );

  const saveToInbox = () => {
    parsedTasks.forEach((t) => {
      addTask({
        name: t.name,
        durationMinutes: t.durationMinutes,
        category: t.category,
        priority: t.priority,
        canSplit: t.canSplit,
        preferredTimeOfDay: t.preferredTimeOfDay,
        flexibility: t.flexibility,
        deadline: t.deadline,
      });
    });
  };

  return (
    <div className="space-y-5 pb-4">
      <ScreenHeader
        title="Dump"
        subtitle="Paste everything you want to do. I'll tell you if it's humanly possible."
      />

      <BrainDumpInput value={brainDumpText} onChange={setBrainDumpText} />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label mb-2">
          Organize by
        </p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`pill-period ${period === p.id ? 'pill-period-active' : 'pill-period-inactive'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded-[14px] bg-white px-3 py-2.5 text-sm text-ink card-surface"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded-[14px] bg-white px-3 py-2.5 text-sm text-ink card-surface"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <motion.button
          type="button"
          onClick={() => {
            if (!hasParsed) handleParse();
            handleMakeItPossible();
          }}
          className="col-span-2 flex flex-col justify-center gap-0.5 rounded-[22px] bg-navy px-[18px] py-3.5 text-left"
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-base text-white">
            {andsiosaState === 'thinking' ? 'Thinking...' : 'Make it possible'}
          </p>
          <p className="text-[13px] text-navy-muted mt-1.5">Generate your schedule</p>
        </motion.button>
        <button
          type="button"
          onClick={fixMyChaos}
          className="col-span-2 flex h-[56px] items-center justify-center rounded-[22px] bg-coral text-sm font-medium text-white"
        >
          Fix my chaos
        </button>
      </div>

      {hasParsed && parsedTasks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl text-ink">Parsed tasks ({parsedTasks.length})</h3>
            <span className="text-sm text-ink-secondary">
              {Math.floor(totalRequested / 60)}h {totalRequested % 60}m total
            </span>
          </div>
          {parsedTasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              modes={modes}
              onUpdate={(id, updates) =>
                setParsedTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                )
              }
              onDelete={(id) => setParsedTasks((prev) => prev.filter((t) => t.id !== id))}
              index={i}
            />
          ))}
          <button
            type="button"
            onClick={saveToInbox}
            className="w-full rounded-[22px] border border-dashed border-ink-nav/30 py-3 text-sm font-medium text-ink-secondary"
          >
            Save all to Inbox
          </button>
        </motion.div>
      )}

      {scheduleResult && <GeneratedPlan result={scheduleResult} modes={modes} />}
    </div>
  );
}
