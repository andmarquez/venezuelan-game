import { motion } from 'framer-motion';

export default function RecognitionPanel({ phase, recognition, metrics }) {
  const palette = recognition?.palette ?? ['#ff183d', '#ffffff', '#1a1a1a'];
  const language = recognition?.languageLabel ?? '—';
  const bpm = recognition?.bpm ?? metrics.bpm ?? '—';
  const source = recognition?.source ?? 'listening';

  return (
    <motion.div
      className="absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-xl"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/50">
          {phase === 'listening' && 'Listening…'}
          {phase === 'analyzing' && 'Analyzing audio…'}
          {phase === 'recognized' && 'Track detected'}
          {phase === 'idle' && 'Stand by'}
        </span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-white/60">
          {source === 'audd' ? 'Live ID' : source === 'mock' ? 'AI Match' : '—'}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex shrink-0 flex-col gap-1">
          {palette.map((color) => (
            <span
              key={color}
              className="h-5 w-5 rounded-full border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black uppercase leading-none tracking-tight text-white">
            {recognition?.title ?? 'Unknown track'}
          </p>
          <p className="mt-1 truncate text-[0.72rem] uppercase tracking-[0.12em] text-white/65">
            {recognition?.artist ?? 'Scanning room audio'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/55">
            <span className="rounded-md bg-white/8 px-2 py-1">Lang {language}</span>
            <span className="rounded-md bg-white/8 px-2 py-1">BPM {bpm || metrics.bpm || '—'}</span>
            <span className="rounded-md bg-white/8 px-2 py-1">
              Beat {Math.round(metrics.beatIntensity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
