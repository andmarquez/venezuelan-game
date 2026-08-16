import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactionGif, ReactionTrigger } from '../types';
import { useApp } from '../store/appStore';
import { uploadReactionToStorage } from '../services/reactionService';

const TRIGGERS: { value: ReactionTrigger; label: string }[] = [
  { value: 'plan-fits', label: 'Plan fits' },
  { value: 'plan-does-not-fit', label: 'Plan does not fit' },
  { value: 'overbooked', label: 'Overbooked' },
  { value: 'task-complete', label: 'Task complete' },
  { value: 'day-complete', label: 'Day complete' },
  { value: 'reminder-start', label: 'Reminder starts' },
  { value: 'task-overdue', label: 'Task overdue' },
  { value: 'too-many-tasks', label: 'Too many tasks' },
  { value: 'rest-removed', label: 'Rest time removed' },
  { value: 'late-night-work', label: 'Late night work' },
  { value: 'calendar-changed', label: 'Calendar changed' },
  { value: 'week-rebalance', label: 'Week rebalance' },
];

const CATEGORIES = [
  'Too many tasks',
  'Overbooked',
  'Reminder',
  'Celebration',
  'Warning',
  'Focus mode',
  'Time off',
  'Workout',
  'Cooking',
  'Deadline panic',
  'You need a clone',
  'Be realistic',
  'You did it',
  'Plan fits',
  'Rebalance',
  'Rest protection',
];

export function ReactionVault() {
  const { reactions, addReaction, deleteReaction, testReaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [trigger, setTrigger] = useState<ReactionTrigger>('overbooked');
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = await uploadReactionToStorage(file);
    setUrl(objectUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !message) return;
    addReaction({ title, url, category, trigger, message, isLocal: url.startsWith('blob:') });
    setTitle('');
    setUrl('');
    setMessage('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy">Reaction Vault</h2>
          <p className="text-sm text-navy/60 mt-1">GIFs for when words aren't dramatic enough.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-2xl bg-coral px-4 py-2 text-sm font-bold text-white"
        >
          + Add GIF
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-4 shadow-sm space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="GIF title"
            className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
            required
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste GIF URL"
            className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
          />
          <label className="block">
            <span className="text-xs font-semibold text-navy/60">Or upload locally</span>
            <input type="file" accept="image/gif,image/*" onChange={handleFileUpload} className="mt-1 text-xs" />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as ReactionTrigger)}
            className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
          >
            {TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Custom Andsiosa message"
            rows={2}
            className="w-full rounded-xl bg-cream px-3 py-2 text-sm resize-none"
            required
          />
          {url && (
            <div className="aspect-video overflow-hidden rounded-xl bg-navy/5">
              <img src={url} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <button type="submit" className="w-full rounded-xl bg-navy py-3 font-bold text-white text-sm">
            Save reaction
          </button>
        </motion.form>
      )}

      <div className="grid gap-3">
        {reactions.map((reaction) => (
          <ReactionItem
            key={reaction.id}
            reaction={reaction}
            onTest={() => testReaction(reaction.trigger)}
            onDelete={() => deleteReaction(reaction.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReactionItem({
  reaction,
  onTest,
  onDelete,
}: {
  reaction: ReactionGif;
  onTest: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-navy/5">
        <img src={reaction.url} alt={reaction.title} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-navy truncate">{reaction.title}</p>
        <p className="text-[10px] font-bold uppercase text-coral">{reaction.category}</p>
        <p className="text-xs text-navy/60 mt-0.5 line-clamp-2">{reaction.message}</p>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onTest}
            className="rounded-lg bg-lime/30 px-2 py-1 text-[10px] font-bold text-navy"
          >
            Test
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
