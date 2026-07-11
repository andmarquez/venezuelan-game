/** One AudioContext for the whole game — Phaser scenes share it via `game.config.audio.context`. */
let sharedContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedContext) {
    const Ctor = window.AudioContext
      || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      throw new Error('Web Audio API is not available in this browser.');
    }
    sharedContext = new Ctor();
  }
  return sharedContext;
}

export function resumeSharedAudioContext(): void {
  const ctx = sharedContext;
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume();
  }
}

export function bindGlobalAudioUnlock(): void {
  const unlock = () => resumeSharedAudioContext();
  document.addEventListener('touchstart', unlock, { capture: true, passive: true });
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true, passive: true });
}
