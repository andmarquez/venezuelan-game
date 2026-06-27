import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { CalendarConnect } from '../components/CalendarConnect';
import { ReactionVault } from '../components/ReactionVault';

export function SettingsScreen() {
  const { showSettings, setShowSettings, settings, updateSettings } = useApp();

  return (
    <AnimatePresence>
      {showSettings && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-t-[22px] bg-bg p-5 safe-bottom"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-navy/20" />
            <h2 className="text-[28px] text-ink mb-4">Settings</h2>

            <div className="space-y-6">
              <section>
                <label className="text-[11px] font-bold uppercase tracking-[0.55px] text-mode-label">Your name</label>
                <input
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-white px-3 py-3 text-sm font-medium"
                  placeholder="Andrea"
                />
                <p className="text-xs text-navy/40 mt-1">Andsiosa uses this to roast you personally.</p>
              </section>

              <section>
                <label className="text-xs font-bold uppercase tracking-wide text-navy/50">Calendar</label>
                <div className="mt-2">
                  <CalendarConnect />
                </div>
              </section>

              <section>
                <label className="text-xs font-bold uppercase tracking-wide text-navy/50">
                  Buffer between tasks (minutes)
                </label>
                <input
                  type="number"
                  value={settings.bufferMinutes}
                  onChange={(e) => updateSettings({ bufferMinutes: parseInt(e.target.value) || 10 })}
                  className="mt-1 w-full rounded-xl bg-white px-3 py-3 text-sm"
                  min={0}
                  max={60}
                />
              </section>

              <section>
                <ReactionVault />
              </section>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full rounded-2xl bg-navy py-4 font-bold text-white"
            >
              Done
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
