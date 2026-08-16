import { motion } from 'framer-motion';
import type { AndsiosaState } from '../types';

interface AndsiosaCharacterProps {
  state?: AndsiosaState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = { sm: 48, md: 64, lg: 88 };

export function AndsiosaCharacter({ state = 'idle', size = 'md', className = '' }: AndsiosaCharacterProps) {
  const px = SIZE_MAP[size];

  const bodyAnim = {
    idle: { y: [0, -6, 0], transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' as const } },
    thinking: { rotate: [0, -5, 5, 0], transition: { repeat: Infinity, duration: 1.2 } },
    listening: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } },
    celebrating: { y: [0, -12, 0], rotate: [0, 10, -10, 0], transition: { repeat: 3, duration: 0.5 } },
    judging: { rotate: [0, -8, 0], transition: { repeat: Infinity, duration: 2 } },
    warning: { x: [0, -3, 3, -3, 0], transition: { repeat: Infinity, duration: 0.6 } },
    reminding: { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 1.5 } },
    tired: { y: [0, 2, 0], transition: { repeat: Infinity, duration: 3 } },
    focused: { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2 } },
    chaotic: { rotate: [0, 15, -15, 10, -10, 0], transition: { repeat: Infinity, duration: 0.8 } },
  };

  const eyeExpression = {
    idle: { scaleY: 1 },
    thinking: { scaleY: 0.6 },
    listening: { scaleY: 1.2 },
    celebrating: { scaleY: 0.3 },
    judging: { scaleY: 0.4 },
    warning: { scaleY: 1 },
    reminding: { scaleY: 0.8 },
    tired: { scaleY: 0.5 },
    focused: { scaleY: 0.7 },
    chaotic: { scaleY: 1.3 },
  };

  const mouthPaths: Record<AndsiosaState, string> = {
    idle: 'M 38 58 Q 50 64 62 58',
    thinking: 'M 40 60 Q 50 56 60 60',
    listening: 'M 42 58 Q 50 66 58 58',
    celebrating: 'M 38 56 Q 50 70 62 56',
    judging: 'M 42 62 L 58 62',
    warning: 'M 40 58 L 50 66 L 60 58',
    reminding: 'M 44 60 Q 50 64 56 60',
    tired: 'M 42 62 Q 50 58 58 62',
    focused: 'M 44 60 L 56 60',
    chaotic: 'M 36 58 Q 50 72 64 58',
  };

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={className}
      animate={bodyAnim[state]}
      aria-label="Andsiosa mascot"
    >
      {/* Hair - red bob with blunt bangs */}
      <ellipse cx="50" cy="42" rx="38" ry="36" fill="#e63946" />
      <rect x="14" y="28" width="72" height="22" rx="4" fill="#e63946" />
      {/* Face */}
      <ellipse cx="50" cy="52" rx="28" ry="30" fill="#ffe8d6" />
      {/* Bangs */}
      <path d="M 22 38 Q 30 52 38 40 Q 50 54 62 40 Q 70 52 78 38 L 78 32 Q 50 48 22 32 Z" fill="#e63946" />
      {/* Eyes - no eyebrows */}
      <motion.ellipse cx="38" cy="50" rx="5" ry="6" fill="#1a1f3c" animate={eyeExpression[state]} />
      <motion.ellipse cx="62" cy="50" rx="5" ry="6" fill="#1a1f3c" animate={eyeExpression[state]} />
      {/* Blush */}
      <ellipse cx="30" cy="58" rx="6" ry="3" fill="#ffb4a2" opacity="0.5" />
      <ellipse cx="70" cy="58" rx="6" ry="3" fill="#ffb4a2" opacity="0.5" />
      {/* Mouth */}
      <motion.path
        d={mouthPaths[state]}
        fill="none"
        stroke="#1a1f3c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Body hint */}
      <ellipse cx="50" cy="88" rx="20" ry="10" fill="#e63946" opacity="0.8" />
    </motion.svg>
  );
}
