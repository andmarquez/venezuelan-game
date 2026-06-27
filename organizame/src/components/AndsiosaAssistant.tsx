import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { QuickActionMenu } from './QuickActionMenu';
import { ASSETS } from '../design/tokens';

export function AndsiosaAssistant() {
  const { showQuickMenu, setShowQuickMenu } = useApp();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className="fixed bottom-[97px] right-5 z-50 flex h-[70px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] safe-bottom"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        aria-label="Open Andsiosa quick actions"
      >
        <img src={ASSETS.mascot} alt="Andsiosa" className="h-[72px] w-[72px] object-contain" />
      </motion.button>

      <AnimatePresence>
        {showQuickMenu && <QuickActionMenu onClose={() => setShowQuickMenu(false)} />}
      </AnimatePresence>
    </>
  );
}
