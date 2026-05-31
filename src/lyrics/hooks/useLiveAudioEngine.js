import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeFrequencyBands, average, clamp } from '../../lib/audioAnalysis.js';

const BEAT_COOLDOWN_MS = 140;
const BASS_HISTORY_SIZE = 36;

export function useLiveAudioEngine() {
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    beatFlash: 0,
    bpm: 0,
    beatIntensity: 0,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const bassHistoryRef = useRef([]);
  const beatTimesRef = useRef([]);
  const lastBeatTimeRef = useRef(0);
  const beatFlashRef = useRef(0);
  const smoothedRef = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const beatListenersRef = useRef([]);
  const metricsRef = useRef(metrics);

  const addBeatListener = useCallback((listener) => {
    beatListenersRef.current.push(listener);
    return () => {
      beatListenersRef.current = beatListenersRef.current.filter((item) => item !== listener);
    };
  }, []);

  const notifyBeat = useCallback((smoothed) => {
    beatListenersRef.current.forEach((listener) => listener(smoothed));
  }, []);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;

    if (analyser && audioContext) {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      const { bass, mid, high } = analyzeFrequencyBands(
        frequencyData,
        audioContext.sampleRate,
        analyser.fftSize,
      );

      const boostedBass = clamp(bass * 2.5, 0, 1);
      const boostedMid = clamp(mid * 2.2, 0, 1);
      const boostedTreble = clamp(high * 2.6, 0, 1);
      const volume = clamp(boostedBass * 0.5 + boostedMid * 0.32 + boostedTreble * 0.18, 0, 1);

      const smoothed = smoothedRef.current;
      smoothed.bass = smoothed.bass * 0.44 + boostedBass * 0.56;
      smoothed.mid = smoothed.mid * 0.52 + boostedMid * 0.48;
      smoothed.treble = smoothed.treble * 0.58 + boostedTreble * 0.42;
      smoothed.volume = smoothed.volume * 0.5 + volume * 0.5;

      const bassHistory = bassHistoryRef.current;
      bassHistory.push(smoothed.bass);
      if (bassHistory.length > BASS_HISTORY_SIZE) {
        bassHistory.shift();
      }

      const bassAverage = average(bassHistory);
      const now = performance.now();
      const beatThreshold = bassAverage * 1.14 + 0.05;
      const snareHit = smoothed.mid > bassAverage * 1.32 + 0.1;
      const isBeat =
        bassHistory.length > 6 &&
        now - lastBeatTimeRef.current > BEAT_COOLDOWN_MS &&
        ((smoothed.bass > beatThreshold && smoothed.bass > 0.09) ||
          (snareHit && smoothed.bass > 0.07));

      if (isBeat) {
        lastBeatTimeRef.current = now;
        beatFlashRef.current = 1;
        beatTimesRef.current.push(now);
        if (beatTimesRef.current.length > 10) {
          beatTimesRef.current.shift();
        }
        notifyBeat(smoothed);
      } else {
        beatFlashRef.current *= 0.62;
      }

      let bpm = metricsRef.current.bpm;
      const beatTimes = beatTimesRef.current;
      if (beatTimes.length >= 3) {
        const intervals = [];
        for (let i = 1; i < beatTimes.length; i += 1) {
          intervals.push(beatTimes[i] - beatTimes[i - 1]);
        }
        const avgInterval = average(intervals);
        if (avgInterval > 0) {
          bpm = clamp(Math.round(60000 / avgInterval), 60, 190);
        }
      }

      const beatIntensity = clamp(smoothed.bass * 0.65 + beatFlashRef.current * 0.35, 0, 1);
      const nextMetrics = {
        volume: smoothed.volume,
        bass: smoothed.bass,
        mid: smoothed.mid,
        treble: smoothed.treble,
        beatFlash: beatFlashRef.current,
        bpm,
        beatIntensity,
      };

      metricsRef.current = nextMetrics;
      setMetrics(nextMetrics);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [notifyBeat]);

  const start = useCallback(async () => {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Use a modern mobile browser over HTTPS.');
      return null;
    }

    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        await DeviceMotionEvent.requestPermission();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass({ latencyHint: 'interactive' });
      const audioStream = new MediaStream(stream.getAudioTracks());
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.42;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -6;

      sourceRef.current = audioContext.createMediaStreamSource(audioStream);
      sourceRef.current.connect(analyser);
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      bassHistoryRef.current = [];
      beatTimesRef.current = [];
      lastBeatTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(analyze);
      setHasStarted(true);
      return stream;
    } catch (startError) {
      setError(startError?.message || 'Microphone access is required.');
      return null;
    }
  }, [analyze]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const setOnBeat = useCallback((callback) => addBeatListener(callback), [addBeatListener]);

  return {
    hasStarted,
    error,
    metrics,
    videoRef,
    streamRef,
    start,
    addBeatListener,
    setOnBeat,
  };
}
