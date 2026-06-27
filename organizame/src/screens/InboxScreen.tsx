import { useState } from 'react';
import { useApp } from '../store/appStore';
import { TaskCard } from '../components/TaskCard';
import { ScreenHeader } from '../components/PageHeader';
import type { Task } from '../types';

export function InboxScreen() {
  const { inboxTasks, modes, addTask, updateTask, deleteTask, completeTask } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState('work');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addTask({
      name: name.trim(),
      durationMinutes: duration,
      category,
      priority,
      deadline: deadline || undefined,
      notes: notes || undefined,
      canSplit: true,
      preferredTimeOfDay: 'any',
      flexibility: 'flexible',
    });
    setName('');
    setDuration(60);
    setNotes('');
    setDeadline('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="relative">
        <ScreenHeader
          title="Inbox"
          subtitle="Unscheduled tasks. Safe to dump. Not safe to ignore forever."
        />
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="absolute top-8 right-14 rounded-[22px] bg-navy px-4 py-2 text-sm font-medium text-white"
        >
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface rounded-[22px] p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What needs doing?"
            className="w-full rounded-[14px] bg-bg px-3 py-3 text-sm font-medium text-ink"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
              className="rounded-[14px] bg-bg px-3 py-2 text-sm text-ink"
              min={15}
              step={15}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-[14px] bg-bg px-3 py-2 text-sm text-ink"
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="rounded-[14px] bg-bg px-3 py-2 text-sm text-ink"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-[14px] bg-bg px-3 py-2 text-sm text-ink"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-[14px] bg-bg px-3 py-2 text-sm resize-none text-ink"
          />
          <button type="submit" className="w-full rounded-[22px] bg-navy py-3 text-sm font-medium text-white">
            Add to inbox
          </button>
        </form>
      )}

      <p className="text-xs text-ink-nav">
        {inboxTasks.length} unscheduled task{inboxTasks.length !== 1 ? 's' : ''}
      </p>

      {inboxTasks.length === 0 ? (
        <div className="card-surface flex flex-col items-center rounded-[22px] p-8 text-center">
          <p className="text-xl text-ink">Inbox zero energy</p>
          <p className="text-sm text-ink-secondary mt-2">Add tasks here before organizing them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboxTasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              modes={modes}
              onUpdate={updateTask}
              onComplete={completeTask}
              onDelete={deleteTask}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
