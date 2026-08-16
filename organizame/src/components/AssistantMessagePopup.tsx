import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { ASSETS } from '../design/tokens';

const AUTO_DISMISS_MS = 5500;

export function AssistantMessagePopup() {
  const { assistantMessage, setAssistantMessage, activeReaction, andsiosaState } = useApp();
  const visible = Boolean(assistantMessage) && !activeReaction?.visible;

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setAssistantMessage(''), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [assistantMessage, setAssistantMessage, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-4 bottom-[178px] z-[55] mx-auto max-w-sm"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_32px_rgba(10,18,55,0.12)] ring-1 ring-coral/25">
            <div className="flex items-start gap-3 p-4">
              <img
                src={ASSETS.mascot}
                alt=""
                className={`h-11 w-11 shrink-0 object-contain ${andsiosaState !== 'idle' ? 'animate-float' : ''}`}
              />
              <p className="text-sm leading-relaxed text-ink">{assistantMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setAssistantMessage('')}
              className="w-full border-t border-bg py-2.5 text-xs font-semibold text-ink-nav"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
