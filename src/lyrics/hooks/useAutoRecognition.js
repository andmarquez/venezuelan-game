import { useCallback, useEffect, useRef, useState } from 'react';
import { identifySongFromStream } from '../../lib/lyricsService.js';
import { pickMockSong } from '../data/mockCatalog.js';

const ANALYZE_AFTER_BEATS = 5;
const REIDENTIFY_MS = 30000;

function toRecognition(entry, source) {
  return {
    title: entry.title,
    artist: entry.artist,
    language: entry.language,
    languageLabel: entry.languageLabel,
    bpm: entry.bpm,
    palette: entry.palette,
    lyrics: entry.lyrics,
    source,
  };
}

export function useAutoRecognition({ streamRef, addBeatListener }) {
  const [phase, setPhase] = useState('idle');
  const [recognition, setRecognition] = useState(null);
  const beatCountRef = useRef(0);
  const lockedRef = useRef(false);
  const identifyLockRef = useRef(false);
  const metricsRef = useRef({ bpm: 0, volume: 0, bass: 0 });
  const auddToken = import.meta.env.VITE_AUDD_API_TOKEN ?? '';

  const runMockLock = useCallback((bpm, energy) => {
    const mock = pickMockSong(bpm, energy);
    setRecognition(toRecognition({ ...mock, bpm: bpm || mock.bpm }, 'mock'));
    setPhase('recognized');
    lockedRef.current = true;
  }, []);

  const tryRecognize = useCallback(async () => {
    if (identifyLockRef.current) {
      return;
    }

    const { bpm, volume } = metricsRef.current;
    identifyLockRef.current = true;
    setPhase('analyzing');

    try {
      const stream = streamRef.current;
      if (stream && auddToken) {
        const match = await identifySongFromStream(stream, auddToken);
        if (match) {
          const mock = pickMockSong(bpm || match.songTimeNow, volume);
          setRecognition(
            toRecognition(
              {
                title: match.title,
                artist: match.artist,
                language: mock.language,
                languageLabel: mock.languageLabel,
                bpm: bpm || mock.bpm,
                palette: mock.palette,
                lyrics: mock.lyrics,
              },
              'audd',
            ),
          );
          setPhase('recognized');
          lockedRef.current = true;
          return;
        }
      }

      runMockLock(bpm, volume);
    } finally {
      identifyLockRef.current = false;
    }
  }, [auddToken, runMockLock, streamRef]);

  useEffect(() => {
    if (!addBeatListener) {
      return undefined;
    }

    const onBeat = (smoothed) => {
      metricsRef.current = {
        ...metricsRef.current,
        volume: smoothed.volume,
        bass: smoothed.bass,
      };
      beatCountRef.current += 1;

      if (!lockedRef.current && beatCountRef.current >= ANALYZE_AFTER_BEATS) {
        tryRecognize();
      }
    };

    return addBeatListener(onBeat);
  }, [addBeatListener, tryRecognize]);

  const updateMetrics = useCallback((next) => {
    metricsRef.current = { ...metricsRef.current, ...next };
  }, []);

  useEffect(() => {
    if (phase !== 'listening' && phase !== 'recognized') {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (!lockedRef.current) {
        return;
      }
      tryRecognize();
    }, REIDENTIFY_MS);

    return () => window.clearInterval(interval);
  }, [phase, tryRecognize]);

  const reset = useCallback(() => {
    beatCountRef.current = 0;
    lockedRef.current = false;
    setRecognition(null);
    setPhase('listening');
  }, []);

  return { phase, recognition, updateMetrics, reset, setPhase };
}
