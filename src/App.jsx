import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InteractiveGraphics from './components/InteractiveGraphics.jsx';
import ImportedSvgLayer from './components/ImportedSvgLayer.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import CustomizePanel from './components/CustomizePanel.jsx';
import ExperienceArtTabs from './components/ExperienceArtTabs.jsx';
import {
  applyBeatStyle,
  resolveActiveStyle,
  resolveGlow,
} from './config/defaults.js';
import { useSettings } from './hooks/useSettings.js';
import { useExperienceAssets } from './hooks/useExperienceAssets.js';

const MODES = [
  { id: 'pulse', label: 'Pulse with audio' },
  { id: 'stretch', label: 'Stretch' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'wave', label: 'Wave' },
  { id: 'explosion', label: 'Explosion' },
];

const LONG_PRESS_MS = 560;
const SWIPE_DISTANCE = 44;
const BEAT_COOLDOWN_MS = 155;
const BASS_HISTORY_SIZE = 36;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeFrequencyBands(frequencyData, sampleRate, fftSize) {
  const binWidth = sampleRate / fftSize;
  let bassSum = 0;
  let bassCount = 0;
  let midSum = 0;
  let midCount = 0;
  let highSum = 0;
  let highCount = 0;

  for (let index = 1; index < frequencyData.length; index += 1) {
    const frequency = index * binWidth;
    const normalized = frequencyData[index] / 255;

    if (frequency < 180) {
      bassSum += normalized;
      bassCount += 1;
    } else if (frequency < 2200) {
      midSum += normalized;
      midCount += 1;
    } else if (frequency < 9000) {
      highSum += normalized;
      highCount += 1;
    }
  }

  return {
    bass: bassCount ? bassSum / bassCount : 0,
    mid: midCount ? midSum / midCount : 0,
    high: highCount ? highSum / highCount : 0,
  };
}

function getGlyphVector(index, total) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + (index % 3) * 0.6;
  const distance = 90 + (index % 5) * 24;

  const rotation = Math.sin(index * 1.7) * 42;

  return {
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance}px`,
    r: `${rotation}deg`,
    orbitR: `${rotation * 0.2}deg`,
  };
}

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [hasStarted, setHasStarted] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [status, setStatus] = useState('Ready for camera, mic, and motion.');
  const [error, setError] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [modeIndex, setModeIndex] = useState(0);
  const [explosionKey, setExplosionKey] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [styleIndex, setStyleIndex] = useState(0);

  const frameRef = useRef(null);
  const graphicsRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const touchRef = useRef({
    x: 0,
    y: 0,
    longPressTimer: null,
    longPressFired: false,
  });
  const smoothedAudioRef = useRef(0);
  const smoothedBassRef = useRef(0);
  const smoothedMidRef = useRef(0);
  const smoothedHighRef = useRef(0);
  const beatFlashRef = useRef(0);
  const bassHistoryRef = useRef([]);
  const lastBeatTimeRef = useRef(0);
  const styleIndexRef = useRef(0);
  const lastUiAudioUpdateRef = useRef(0);
  const lastShakeRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const words = settings.words;
  const showTextOverlay = settings.typography.showOverlay && words.length > 0;
  const currentWord = showTextOverlay ? words[wordIndex % words.length] : '';
  const currentMode = MODES[modeIndex];
  const currentStyle = resolveActiveStyle(settings, styleIndex);
  const glyphs = useMemo(
    () => (showTextOverlay ? Array.from(currentWord) : []),
    [currentWord, showTextOverlay],
  );
  const showSvgLayer = settings.graphics.enabled && settings.graphics.showImportedSvgs;
  const activeExperienceSlug = settings.experience?.activeSlug ?? 'saoko';
  const activeExperienceSvg = useExperienceAssets(
    hasStarted && showSvgLayer,
    activeExperienceSlug,
  );
  const userImportedSvgs = useMemo(() => {
    if (settings.graphics.showUserImportedSvgs !== true) {
      return [];
    }
    return settings.importedSvgs.filter((item) => item.visible);
  }, [settings.importedSvgs, settings.graphics.showUserImportedSvgs]);

  const selectExperienceArt = useCallback(
    (slug) => {
      updateSettings({ experience: { activeSlug: slug } });
    },
    [updateSettings],
  );

  const nextWord = useCallback(() => {
    if (!settingsRef.current.typography.showOverlay || !settingsRef.current.words.length) {
      return;
    }
    setWordIndex((index) => (index + 1) % settingsRef.current.words.length);
  }, []);

  const changeMode = useCallback((direction = 1) => {
    setModeIndex((index) => (index + direction + MODES.length) % MODES.length);
  }, []);

  const triggerExplosion = useCallback(() => {
    setExplosionKey((key) => key + 1);
    setIsExploding(true);
    const frame = frameRef.current;
    const gfx = settingsRef.current.graphics;
    if (frame && gfx.enabled) {
      const rect = frame.getBoundingClientRect();
      graphicsRef.current?.burst(rect.width * 0.5, rect.height * 0.42);
      graphicsRef.current?.pulseBeat();
    }
    window.setTimeout(() => setIsExploding(false), 780);
  }, []);

  const updateFrameVariable = useCallback((name, value) => {
    if (frameRef.current) {
      frameRef.current.style.setProperty(name, value);
    }
  }, []);

  const analyzeAudio = useCallback(() => {
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

      const boostedBass = clamp(bass * 2.4, 0, 1);
      const boostedMid = clamp(mid * 2.1, 0, 1);
      const boostedHigh = clamp(high * 2.5, 0, 1);
      const combined = clamp(boostedBass * 0.55 + boostedMid * 0.3 + boostedHigh * 0.15, 0, 1);

      smoothedBassRef.current = smoothedBassRef.current * 0.48 + boostedBass * 0.52;
      smoothedMidRef.current = smoothedMidRef.current * 0.58 + boostedMid * 0.42;
      smoothedHighRef.current = smoothedHighRef.current * 0.64 + boostedHigh * 0.36;
      smoothedAudioRef.current = smoothedAudioRef.current * 0.55 + combined * 0.45;

      const bassHistory = bassHistoryRef.current;
      bassHistory.push(smoothedBassRef.current);
      if (bassHistory.length > BASS_HISTORY_SIZE) {
        bassHistory.shift();
      }

      const bassAverage = average(bassHistory);
      const now = performance.now();
      const beatThreshold = bassAverage * 1.16 + 0.055;
      const snareHit = smoothedMidRef.current > bassAverage * 1.35 + 0.12 && smoothedMidRef.current > 0.18;
      const isBeat =
        bassHistory.length > 8 &&
        now - lastBeatTimeRef.current > BEAT_COOLDOWN_MS &&
        ((smoothedBassRef.current > beatThreshold && smoothedBassRef.current > 0.1) ||
          (snareHit && smoothedBassRef.current > 0.08));

      if (isBeat) {
        lastBeatTimeRef.current = now;
        beatFlashRef.current = 1;
        const cfg = settingsRef.current;
        const styles = cfg.beatStyles;

        if (cfg.typography.autoCycle) {
          styleIndexRef.current = (styleIndexRef.current + 1) % styles.length;
          setStyleIndex(styleIndexRef.current);
        }

        const style = resolveActiveStyle(cfg, styleIndexRef.current);
        applyBeatStyle(style, updateFrameVariable);
        if (cfg.graphics.enabled) {
          graphicsRef.current?.pulseBeat();
        }
      } else {
        beatFlashRef.current *= 0.68;
      }

      const cfg = settingsRef.current;
      const style = resolveActiveStyle(cfg, styleIndexRef.current);
      const glow = resolveGlow(cfg, style);
      if (cfg.graphics.enabled) {
        graphicsRef.current?.setMetrics({
          bass: smoothedBassRef.current,
          mid: smoothedMidRef.current,
          high: smoothedHighRef.current,
          beatFlash: beatFlashRef.current,
          glow,
          color: style.color,
        });
      }

      updateFrameVariable('--audio', smoothedAudioRef.current.toFixed(3));
      updateFrameVariable('--bass', smoothedBassRef.current.toFixed(3));
      updateFrameVariable('--mid', smoothedMidRef.current.toFixed(3));
      updateFrameVariable('--high', smoothedHighRef.current.toFixed(3));
      updateFrameVariable('--beat-flash', beatFlashRef.current.toFixed(3));
      frameRef.current?.classList.toggle('is-beat-hit', beatFlashRef.current > 0.28);

      if (now - lastUiAudioUpdateRef.current > 90) {
        lastUiAudioUpdateRef.current = now;
        setAudioLevel(smoothedAudioRef.current);
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [updateFrameVariable]);

  const requestMotionAccess = useCallback(async () => {
    const motionNeedsPermission =
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function';
    const orientationNeedsPermission =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';

    try {
      if (motionNeedsPermission) {
        await DeviceMotionEvent.requestPermission();
      }

      if (orientationNeedsPermission) {
        await DeviceOrientationEvent.requestPermission();
      }

      return true;
    } catch (permissionError) {
      return false;
    }
  }, []);

  const startExperience = useCallback(async () => {
    setError('');
    setStatus('Requesting camera, microphone, and motion access...');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera and microphone access.');
      setStatus('Use a modern mobile browser over HTTPS or localhost.');
      return;
    }

    try {
      await requestMotionAccess();

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
      if (AudioContextClass) {
        const audioContext = new AudioContextClass({ latencyHint: 'interactive' });
        const audioTracks = stream.getAudioTracks();
        const audioStream = new MediaStream(audioTracks);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.48;
        analyser.minDecibels = -82;
        analyser.maxDecibels = -8;

        sourceRef.current = audioContext.createMediaStreamSource(audioStream);
        sourceRef.current.connect(analyser);
        analyserRef.current = analyser;
        audioContextRef.current = audioContext;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }

      applyBeatStyle(resolveActiveStyle(settingsRef.current, 0), updateFrameVariable);
      styleIndexRef.current = 0;
      setStyleIndex(0);
      setWordIndex(0);
      bassHistoryRef.current = [];
      lastBeatTimeRef.current = 0;
      beatFlashRef.current = 0;

      setHasStarted(true);
      setStatus('Live. Let the music move the type.');
    } catch (startError) {
      setError(startError?.message || 'Permissions were blocked or unavailable.');
      setStatus('Camera and microphone permissions are required to start.');
    }
  }, [analyzeAudio, requestMotionAccess, updateFrameVariable]);

  const addTouchGraphic = useCallback((clientX, clientY, strength = 1) => {
    const frame = frameRef.current;
    const gfx = settingsRef.current.graphics;
    if (!frame || !gfx.enabled || gfx.ripples === false) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    graphicsRef.current?.addRipple(clientX - rect.left, clientY - rect.top, strength);
  }, []);

  useEffect(() => {
    const style = resolveActiveStyle(settings, styleIndexRef.current);
    applyBeatStyle(style, updateFrameVariable);
  }, [settings, updateFrameVariable]);

  useEffect(() => {
    if (wordIndex >= words.length) {
      setWordIndex(0);
    }
  }, [wordIndex, words.length]);

  const handlePointerDown = useCallback(
    (event) => {
      touchRef.current.x = event.clientX;
      touchRef.current.y = event.clientY;
      touchRef.current.longPressFired = false;
      addTouchGraphic(event.clientX, event.clientY, 0.85);
      window.clearTimeout(touchRef.current.longPressTimer);
      touchRef.current.longPressTimer = window.setTimeout(() => {
        touchRef.current.longPressFired = true;
        triggerExplosion();
        const frame = frameRef.current;
        const gfx = settingsRef.current.graphics;
        if (frame && gfx.enabled) {
          const rect = frame.getBoundingClientRect();
          graphicsRef.current?.burst(
            event.clientX - rect.left,
            event.clientY - rect.top,
          );
        }
      }, LONG_PRESS_MS);
    },
    [addTouchGraphic, triggerExplosion],
  );

  const handlePointerUp = useCallback(
    (event) => {
      window.clearTimeout(touchRef.current.longPressTimer);

      if (touchRef.current.longPressFired) {
        return;
      }

      const deltaX = event.clientX - touchRef.current.x;
      const deltaY = event.clientY - touchRef.current.y;

      if (Math.abs(deltaX) > SWIPE_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY)) {
        changeMode(deltaX > 0 ? 1 : -1);
        return;
      }

      if (settingsRef.current.typography.showOverlay && settingsRef.current.words.length) {
        nextWord();
      }
    },
    [changeMode, nextWord],
  );

  const handlePointerCancel = useCallback(() => {
    window.clearTimeout(touchRef.current.longPressTimer);
  }, []);

  useEffect(() => {
    const handleOrientation = (event) => {
      const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
      const beta = Number.isFinite(event.beta) ? event.beta : 0;

      updateFrameVariable('--tilt-x', clamp(gamma / 35, -1, 1).toFixed(3));
      updateFrameVariable('--tilt-y', clamp(beta / 45, -1, 1).toFixed(3));
    };

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) {
        return;
      }

      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;
      const force = Math.sqrt(x * x + y * y + z * z);

      updateFrameVariable('--motion', clamp((force - 9.8) / 10, 0, 1).toFixed(3));

      const now = performance.now();
      if (force > 22 && now - lastShakeRef.current > 900) {
        lastShakeRef.current = now;
        triggerExplosion();
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, [triggerExplosion, updateFrameVariable]);

  useEffect(() => {
    return () => {
      window.clearTimeout(touchRef.current.longPressTimer);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className={`app ${hasStarted ? 'is-live' : ''}`}>
      {hasStarted ? (
        <button
          type="button"
          className="customize-fab"
          aria-label="Customize text, fonts, and graphics"
          onClick={() => setCustomizeOpen(true)}
        >
          Customize
        </button>
      ) : null}

      <CustomizePanel
        open={customizeOpen}
        settings={settings}
        onClose={() => setCustomizeOpen(false)}
        onChange={updateSettings}
        onReset={() => {
          resetSettings();
          setWordIndex(0);
          setStyleIndex(0);
          styleIndexRef.current = 0;
        }}
      />

      <section
        ref={frameRef}
        className={`phone-frame ${hasStarted ? 'is-live' : ''} mode-${currentMode.id} ${isExploding ? 'is-exploding' : ''} ${settings.graphics.shapes ? 'has-shapes' : ''}`}
        onPointerDown={hasStarted && !customizeOpen ? handlePointerDown : undefined}
        onPointerUp={hasStarted && !customizeOpen ? handlePointerUp : undefined}
        onPointerCancel={hasStarted && !customizeOpen ? handlePointerCancel : undefined}
        style={{
          '--audio': audioLevel,
          '--bass': 0,
          '--mid': 0,
          '--high': 0,
          '--beat-flash': 0,
          '--beat-font': currentStyle.family,
          '--beat-color': currentStyle.color,
          '--beat-glow': currentStyle.glow,
          '--beat-weight': currentStyle.weight,
          '--beat-size': currentStyle.size,
          '--beat-spacing': currentStyle.spacing,
          '--tilt-x': 0,
          '--tilt-y': 0,
          '--motion': 0,
        }}
        aria-label="Concert kinetic typography experience"
      >
        <video ref={videoRef} className="camera-feed" autoPlay muted playsInline />
        <div className="camera-fallback" />
        <div className="shade" />
        <div className="grain" />
        <InteractiveGraphics
          ref={graphicsRef}
          active={hasStarted && settings.graphics.enabled}
          config={settings.graphics}
        />
        <ImportedSvgLayer
          key={activeExperienceSlug}
          experienceArt={activeExperienceSvg}
          overlayItems={userImportedSvgs}
          enabled={showSvgLayer}
        />
        {settings.graphics.enabled && settings.graphics.shapes ? (
          <div className="graphic-shapes" aria-hidden="true">
            <span className="shape shape-a" />
            <span className="shape shape-b" />
            <span className="shape shape-c" />
          </div>
        ) : null}

        {!hasStarted ? (
          <SplashScreen
            status={status}
            error={error}
            onStart={startExperience}
          />
        ) : (
          <>
            {showTextOverlay ? (
              <div className="type-stage" key={`${currentWord}-${explosionKey}`}>
                <div className="kinetic-word" aria-live="polite" aria-label={currentWord}>
                  {glyphs.map((glyph, index) => {
                    const vector = getGlyphVector(index, glyphs.length);
                    return (
                      <span
                        className={glyph === ' ' ? 'glyph space' : 'glyph'}
                        key={`${glyph}-${index}`}
                        style={{
                          '--i': index,
                          '--blast-x': vector.x,
                          '--blast-y': vector.y,
                          '--blast-r': vector.r,
                          '--orbit-r': vector.orbitR,
                          '--alt': index % 2 === 0 ? -1 : 1,
                          '--glitch-x': (index % 3) - 1,
                          '--wave': Math.sin(index * 0.82).toFixed(3),
                          '--wave-r': `${((index % 5) - 2) * 2.5}deg`,
                        }}
                      >
                        {glyph === ' ' ? '\u00a0' : glyph}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {showSvgLayer ? (
              <ExperienceArtTabs
                activeSlug={activeExperienceSlug}
                onSelect={selectExperienceArt}
                disabled={customizeOpen}
              />
            ) : null}

            <div className="hud bottom" aria-hidden="true">
              <span className="meter meter-bass">
                <span />
              </span>
              <span className="meter meter-mid">
                <span />
              </span>
              <span>Beat sync · ANDSIOSA</span>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
