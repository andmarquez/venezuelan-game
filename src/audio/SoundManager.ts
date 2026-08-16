import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  initNativeAudio,
  isNativeMusicPlaying,
  playNativeMusic,
  playNativeSfx,
  stopNativeMusic,
  unlockNativeAudio,
  type MusicNativeKey,
  type SfxNativeKey,
} from './nativeAudio';
import { resumeSharedAudioContext } from './sharedAudioContext';

const MUTE_KEY = 'venezuelan-game.soundMuted';

export type SfxKey = SfxNativeKey;
export type MusicKey = MusicNativeKey;

/** Level 1 keeps gaita; Level 2 uses tropical jungle loop. */
export function musicKeyForLevel(levelId: string): MusicKey {
  return levelId === 'level-2' ? 'music-level-2' : 'music-game';
}

/**
 * Low-latency audio via native HTMLAudioElement (iOS Safari).
 * Phaser audio is not played in parallel — that caused echo / perceived lag.
 */
export class SoundManager {
  private muted = false;
  private activeMusicKey: MusicKey | null = null;

  constructor(_game: Phaser.Game) {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
    initNativeAudio();
  }

  unlock(scene?: Phaser.Scene): void {
    unlockNativeAudio();
    resumeSharedAudioContext();

    if (scene) {
      scene.sound.pauseOnBlur = false;
      const sm = scene.sound as Phaser.Sound.WebAudioSoundManager & { locked?: boolean };
      if (sm.locked) sm.unlock();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (muted) this.stopMusic();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(key: SfxKey, _scene?: Phaser.Scene, config?: { volume?: number }): void {
    if (this.muted) return;
    playNativeSfx(key, config?.volume ?? GAME_CONFIG.sfxVolume);
  }

  playMusic(key: MusicKey, scene?: Phaser.Scene, volume = GAME_CONFIG.musicVolume): void {
    if (this.muted) return;
    if (this.activeMusicKey === key && isNativeMusicPlaying()) return;

    this.unlock(scene);
    playNativeMusic(key, volume);
    this.activeMusicKey = key;
  }

  stopMusic(_scene?: Phaser.Scene): void {
    stopNativeMusic();
    this.activeMusicKey = null;
  }
}

export function getSoundManager(game: Phaser.Game): SoundManager | undefined {
  return game.registry.get('soundManager') as SoundManager | undefined;
}

/** Unlock audio on the first tap in each scene. */
export function bindSceneAudioUnlock(scene: Phaser.Scene): void {
  scene.sound.pauseOnBlur = false;
  scene.input.once('pointerdown', () => {
    getSoundManager(scene.game)?.unlock(scene);
  });
}
