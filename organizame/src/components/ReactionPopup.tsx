import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/appStore';
import { AndsiosaCharacter } from './AndsiosaCharacter';

export function ReactionPopup() {
  const { activeReaction, dismissReaction, andsiosaState } = useApp();

  return (
    <AnimatePresence>
      {activeReaction?.visible && (
        <motion.div
          className="fixed inset-x-4 top-20 z-[60] mx-auto max-w-sm"
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-2 ring-coral/30">
            <div className="relative aspect-video bg-navy/5">
              <img
                src={activeReaction.reaction.url}
                alt={activeReaction.reaction.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2">
                <AndsiosaCharacter state={andsiosaState} size="sm" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-coral">
                {activeReaction.reaction.category}
              </p>
              <p className="font-display mt-1 text-base font-bold text-navy leading-snug">
                {activeReaction.reaction.message}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissReaction}
              className="w-full border-t border-cream py-3 text-sm font-semibold text-navy/60 hover:bg-cream"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
