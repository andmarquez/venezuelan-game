import { motion } from 'framer-motion';
import type { Task, Mode } from '../types';
import { formatDuration } from '../store/appStore';
import { getModeById } from '../data/defaultModes';

interface TaskCardProps {
  task: Task;
  modes: Mode[];
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  index?: number;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

export function TaskCard({
  task,
  modes,
  onUpdate,
  onComplete,
  onDelete,
  compact = false,
  index = 0,
}: TaskCardProps) {
  const mode = getModeById(modes, task.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`w-full rounded-[22px] border-l-4 bg-white p-4 card-surface ${task.completed ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: mode?.color ?? '#2563eb' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{mode?.icon ?? '📌'}</span>
            <h3 className={`font-medium text-ink truncate ${task.completed ? 'line-through' : ''}`}>
              {task.name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-bg px-2 py-0.5 font-medium text-ink-secondary">
              {formatDuration(task.durationMinutes)}
            </span>
            <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {mode && (
              <span className="rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: mode.bgColor }}>
                {mode.name}
              </span>
            )}
            {task.canSplit && (
              <span className="rounded-full bg-lavender/50 px-2 py-0.5 font-medium text-navy/70">
                splittable
              </span>
            )}
          </div>
          {!compact && task.deadline && (
            <p className="mt-2 text-xs text-navy/60">Deadline: {task.deadline}</p>
          )}
          {!compact && task.notes && (
            <p className="mt-1 text-xs text-navy/50">{task.notes}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {onComplete && !task.completed && (
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="rounded-xl bg-lime/30 px-2 py-1 text-xs font-bold text-navy hover:bg-lime/50"
            >
              ✓
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="rounded-xl bg-red-50 px-2 py-1 text-xs text-red-500 hover:bg-red-100"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!compact && onUpdate && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cream pt-3">
          <select
            value={task.priority}
            onChange={(e) => onUpdate(task.id, { priority: e.target.value as Task['priority'] })}
            className="rounded-xl bg-cream px-2 py-1.5 text-xs font-medium"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={task.category}
            onChange={(e) => onUpdate(task.id, { category: e.target.value })}
            className="rounded-xl bg-cream px-2 py-1.5 text-xs font-medium"
          >
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={task.durationMinutes}
            onChange={(e) => onUpdate(task.id, { durationMinutes: parseInt(e.target.value) || 15 })}
            className="rounded-xl bg-cream px-2 py-1.5 text-xs font-medium"
            min={15}
            step={15}
          />
          <select
            value={task.preferredTimeOfDay}
            onChange={(e) =>
              onUpdate(task.id, { preferredTimeOfDay: e.target.value as Task['preferredTimeOfDay'] })
            }
            className="rounded-xl bg-cream px-2 py-1.5 text-xs font-medium"
          >
            <option value="any">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>
      )}
    </motion.div>
  );
}
