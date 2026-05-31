import { motion, AnimatePresence } from 'framer-motion';

export default function LyricStage({ line, metrics, languageStyle, beatKey }) {
  const fontSize = `calc(clamp(1.75rem, 9.5vw, 4.5rem) * ${(1 + metrics.volume * 0.42).toFixed(3)})`;
  const fontWeight = Math.round(300 + metrics.bass * 600);
  const letterSpacing = `${(-0.06 + metrics.treble * 0.28).toFixed(3)}em`;
  const glitchRotate = metrics.beatFlash > 0.35 ? metrics.beatFlash * 4.5 : metrics.beatFlash * 1.2;
  const skew = metrics.beatFlash * 3.5;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[34%] top-[28%] z-10 flex items-center justify-center px-4"
      dir={languageStyle.direction}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={`${beatKey}-${line}`}
          className="max-w-[95%] text-center uppercase leading-[0.88] tracking-tight"
          style={{
            fontFamily: languageStyle.fontFamily,
            fontSize,
            fontWeight,
            letterSpacing,
            color: '#ffffff',
            textShadow: `
              0 0 ${8 + metrics.volume * 40}px ${languageStyle.accent}aa,
              0 0 ${metrics.beatFlash * 36}px ${languageStyle.accent},
              ${metrics.beatFlash * 5}px 0 0 #ff006e88,
              ${-metrics.beatFlash * 4}px 0 0 #00f5d488
            `,
          }}
          initial={{ opacity: 0, y: 28, scale: 0.88, rotateX: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1 + metrics.beatFlash * 0.12,
            rotateX: 0,
            rotateZ: glitchRotate,
            skewX: skew,
          }}
          exit={{ opacity: 0, y: -20, scale: 1.06, filter: 'blur(6px)' }}
          transition={{
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {line}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
