import { useState } from 'react';
import type { Mode } from '../types';
import { ModeCard } from './ModeCard';

interface ModeSettingsProps {
  modes: Mode[];
  onUpdate: (id: string, updates: Partial<Mode>) => void;
  onAdd: (mode: Mode) => void;
}

export function ModeSettings({ modes, onUpdate, onAdd }: ModeSettingsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const editing = modes.find((m) => m.id === editingId);

  const handleAddCustom = () => {
    const id = `custom-${Date.now()}`;
    onAdd({
      id,
      name: 'Custom Mode',
      color: '#a78bfa',
      bgColor: '#ede9fe',
      icon: '✨',
      preferredDays: [0, 1, 2, 3, 4, 5, 6],
      preferredTimeStart: 9,
      preferredTimeEnd: 18,
      minBlockMinutes: 30,
      maxBlockMinutes: 120,
      energyLevel: 'medium',
      canScheduleAtNight: false,
      canSplit: true,
      isCustom: true,
    });
    setEditingId(id);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-[22px] bg-navy px-3 py-2 text-sm font-medium text-white"
        >
          + Custom
        </button>
      </div>

      <div className="space-y-3">
        {modes.map((mode) => (
          <ModeCard key={mode.id} mode={mode} onEdit={() => setEditingId(mode.id)} />
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 max-h-[80vh] overflow-y-auto safe-bottom">
            <h3 className="font-display text-xl font-bold text-navy mb-4">Edit {editing.name}</h3>
            <div className="space-y-3">
              <Field label="Name">
                <input
                  value={editing.name}
                  onChange={(e) => onUpdate(editing.id, { name: e.target.value })}
                  className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Icon">
                <input
                  value={editing.icon}
                  onChange={(e) => onUpdate(editing.id, { icon: e.target.value })}
                  className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Color">
                <input
                  type="color"
                  value={editing.color}
                  onChange={(e) => onUpdate(editing.id, { color: e.target.value })}
                  className="h-10 w-full rounded-xl"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start hour">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={editing.preferredTimeStart}
                    onChange={(e) => onUpdate(editing.id, { preferredTimeStart: parseInt(e.target.value) })}
                    className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="End hour">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={editing.preferredTimeEnd}
                    onChange={(e) => onUpdate(editing.id, { preferredTimeEnd: parseInt(e.target.value) })}
                    className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min block (min)">
                  <input
                    type="number"
                    value={editing.minBlockMinutes}
                    onChange={(e) => onUpdate(editing.id, { minBlockMinutes: parseInt(e.target.value) })}
                    className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Max block (min)">
                  <input
                    type="number"
                    value={editing.maxBlockMinutes}
                    onChange={(e) => onUpdate(editing.id, { maxBlockMinutes: parseInt(e.target.value) })}
                    className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <Field label="Energy">
                <select
                  value={editing.energyLevel}
                  onChange={(e) =>
                    onUpdate(editing.id, { energyLevel: e.target.value as Mode['energyLevel'] })
                  }
                  className="w-full rounded-xl bg-cream px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.canScheduleAtNight}
                  onChange={(e) => onUpdate(editing.id, { canScheduleAtNight: e.target.checked })}
                />
                Can schedule at night
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.canSplit}
                  onChange={(e) => onUpdate(editing.id, { canSplit: e.target.checked })}
                />
                Tasks can be split
              </label>
            </div>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="mt-4 w-full rounded-2xl bg-navy py-3 font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="rounded-3xl bg-white p-6 max-w-sm w-full">
            <p className="font-display text-lg font-bold text-navy">Add a custom mode?</p>
            <p className="text-sm text-navy/60 mt-2">For the parts of life that don't fit a template.</p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl bg-cream py-3 font-semibold text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustom}
                className="flex-1 rounded-xl bg-coral py-3 font-bold text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
