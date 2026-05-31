import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './lyrics/lyrics.css';
import RecognitionPanel from './lyrics/components/RecognitionPanel.jsx';
import LyricStage from './lyrics/components/LyricStage.jsx';
import AudioMeters from './lyrics/components/AudioMeters.jsx';
import { useLiveAudioEngine } from './lyrics/hooks/useLiveAudioEngine.js';
import { useAutoRecognition } from './lyrics/hooks/useAutoRecognition.js';
import { detectLanguageCode, getLanguageStyle } from './lyrics/data/languageStyles.js';
import { MOCK_SONGS } from './lyrics/data/mockCatalog.js';

const PLACEHOLDER_LINES = MOCK_SONGS[0].lyrics;

export default function LyricsApp() {
  const [lineIndex, setLineIndex] = useState(0);
  const [beatKey, setBeatKey] = useState(0);
  const [started, setStarted] = useState(false);

  const { hasStarted, error, metrics, videoRef, streamRef, start, addBeatListener } =
    useLiveAudioEngine();

  const { phase, recognition, updateMetrics, reset, setPhase } = useAutoRecognition({
    streamRef,
    addBeatListener,
  });

  const lyrics = recognition?.lyrics ?? PLACEHOLDER_LINES;
  const currentLine = lyrics[lineIndex % lyrics.length] ?? 'LISTENING…';

  const detectedLang = useMemo(() => {
    const fromText = detectLanguageCode(currentLine, recognition?.language ?? 'eng');
    return fromText;
  }, [currentLine, recognition?.language]);

  const languageStyle = useMemo(() => {
    const style = getLanguageStyle(detectedLang);
    if (recognition?.palette?.[0]) {
      return { ...style, accent: recognition.palette[0] };
    }
    return style;
  }, [detectedLang, recognition?.palette]);

  useEffect(() => {
    updateMetrics({ bpm: metrics.bpm, volume: metrics.volume, bass: metrics.bass });
  }, [metrics.bpm, metrics.volume, metrics.bass, updateMetrics]);

  useEffect(() => {
    if (!hasStarted) {
      return undefined;
    }

    return addBeatListener(() => {
      setLineIndex((index) => (index + 1) % lyrics.length);
      setBeatKey((key) => key + 1);
    });
  }, [addBeatListener, hasStarted, lyrics.length]);

  const handleStart = useCallback(async () => {
    const stream = await start();
    if (stream) {
      setStarted(true);
      reset();
      setPhase('listening');
      setLineIndex(0);
    }
  }, [reset, setPhase, start]);

  const paletteGlow = recognition?.palette?.[1] ?? languageStyle.accent;

  return (
    <main className="lyrics-shell grid min-h-dvh w-full place-items-center bg-[#030303]">
      <section
        className="relative isolate aspect-[9/16] w-[min(100vw,calc(100dvh*0.5625))] max-w-[480px] overflow-hidden bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] touch-none select-none md:rounded-[2rem] md:border md:border-white/10"
        style={{
          boxShadow: `0 0 60px ${paletteGlow}22, 0 0 120px rgba(0,0,0,0.85)`,
        }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `scale(${1.04 + metrics.volume * 0.03})`,
            filter: `saturate(${0.85 + metrics.mid * 0.3}) contrast(${1.1 + metrics.bass * 0.15}) brightness(${0.82 + metrics.volume * 0.12})`,
          }}
          autoPlay
          muted
          playsInline
        />

        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.82)), radial-gradient(circle at 50% 35%, ${paletteGlow}22, transparent 55%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.12] mix-blend-screen [background-image:repeating-linear-gradient(90deg,transparent_0_2px,rgba(255,255,255,0.06)_2px_3px)]" />

        {!hasStarted ? (
          <div className="absolute inset-0 z-30 flex flex-col justify-end gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/55">
              Live lyrics lab
            </p>
            <h1 className="max-w-[10ch] text-5xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white">
              Music reads the room.
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              Automatic track detection, language-aware typography, and beat-synced lyrics.
              Classic mode stays at the home link.
            </p>
            <motion.button
              type="button"
              className="min-h-[4rem] w-full rounded-full border border-white/80 bg-white text-sm font-black uppercase tracking-[0.12em] text-black"
              whileTap={{ scale: 0.985 }}
              onClick={handleStart}
            >
              Start live session
            </motion.button>
            <Link
              to="/"
              className="text-[0.72rem] uppercase tracking-[0.12em] text-white/50 no-underline"
            >
              ← Classic mode (unchanged)
            </Link>
            {error ? <p className="text-xs uppercase tracking-wide text-[#ff314f]">{error}</p> : null}
          </div>
        ) : (
          <>
            <RecognitionPanel phase={phase} recognition={recognition} metrics={metrics} />

            <div className="absolute left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+7.5rem)] z-10 flex justify-end">
              <span
                className="rounded-full border px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.14em] backdrop-blur-md"
                style={{
                  borderColor: `${languageStyle.accent}66`,
                  color: languageStyle.accent,
                  backgroundColor: `${languageStyle.accent}18`,
                }}
              >
                {languageStyle.label}
              </span>
            </div>

            <LyricStage
              line={currentLine}
              metrics={metrics}
              languageStyle={languageStyle}
              beatKey={beatKey}
            />

            <AudioMeters metrics={metrics} accent={languageStyle.accent} />

            <div className="absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+3.5rem)] left-3 right-3 z-20 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[0.62rem] uppercase tracking-[0.1em] text-white/55 backdrop-blur-md">
              Lines advance on every beat · Typography follows volume, bass &amp; treble
            </div>

            <Link
              to="/"
              className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-30 text-[0.55rem] uppercase tracking-[0.12em] text-white/45 no-underline"
            >
              Classic
            </Link>
          </>
        )}

        {started && hasStarted ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[5] border-2 border-transparent"
            animate={{
              boxShadow:
                metrics.beatFlash > 0.2
                  ? `inset 0 0 0 ${metrics.beatFlash * 3}px ${languageStyle.accent}55`
                  : 'inset 0 0 0 0px transparent',
            }}
            transition={{ duration: 0.08 }}
          />
        ) : null}
      </section>
    </main>
  );
}
