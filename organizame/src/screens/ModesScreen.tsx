import { useApp } from '../store/appStore';
import { ModeSettings } from '../components/ModeSettings';
import { ScreenHeader } from '../components/PageHeader';

export function ModesScreen() {
  const { modes, updateMode, addMode } = useApp();

  return (
    <div className="pb-4">
      <ScreenHeader title="Goals" subtitle="Life modes — how you actually operate, not how LinkedIn thinks you do." />
      <ModeSettings modes={modes} onUpdate={updateMode} onAdd={addMode} />
    </div>
  );
}
