import Phaser from 'phaser';
import { resumeSharedAudioContext } from './sharedAudioContext';

const MUTE_KEY = 'venezuelan-game.soundMuted';

export type SfxKey =
  | 'sfx-jump'
  | 'sfx-collect'
  | 'sfx-timer'
  | 'sfx-spark'
  | 'sfx-stomp'
  | 'sfx-hurt'
  | 'sfx-select'
  | 'sfx-game-over'
  | 'sfx-kiss';

export type MusicKey = 'music-game';

type WebAudioManager = Phaser.Sound.WebAudioSoundManager & {
  context?: AudioContext;
  locked: boolean;
  unlocked?: boolean;
};

/**
 * Central audio helper — Kenney CC0 platformer SFX + looped gameplay music.
 * Pass the active scene; unlock during the same user tap that starts gameplay.
 */
export class SoundManager {
  private muted = false;
  private activeMusic?: MusicKey;

  constructor(private readonly game: Phaser.Game) {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  /** Resume Web Audio during a user gesture (required on iOS / Safari). */
  unlock(scene: Phaser.Scene): void {
    resumeSharedAudioContext();

    const sm = scene.sound as WebAudioManager;
    const ctx = sm.context ?? this.game.config.audio.context;
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }

    if (sm.locked) {
      sm.unlock();
    }

    // Phaser flips `locked` on the next update after context resumes — nudge it now.
    sm.unlocked = true;
    sm.locked = false;
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
    if (muted) {
      this.stopMusic(this.activeScene());
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(
    key: SfxKey,
    scene?: Phaser.Scene,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void {
    if (this.muted) return;
    const s = scene ?? this.activeScene();
    if (!s || !s.cache.audio.exists(key)) return;

    this.unlock(s);
    s.sound.play(key, { volume: 0.7, ...config });
  }

  playMusic(key: MusicKey, scene?: Phaser.Scene, volume = 0.42): void {
    if (this.muted) return;
    const s = scene ?? this.activeScene();
    if (!s || !s.cache.audio.exists(key)) return;

    const current = s.sound.get(key) as Phaser.Sound.WebAudioSound | undefined;
    if (this.activeMusic === key && current?.isPlaying) return;

    this.stopMusic(s);
    this.unlock(s);
    s.sound.play(key, { loop: true, volume });
    this.activeMusic = key;
  }

  stopMusic(scene?: Phaser.Scene): void {
    const s = scene ?? this.activeScene();
    if (!s) return;
    s.sound.stopByKey('music-game');
    this.activeMusic = undefined;
  }

  private activeScene(): Phaser.Scene | undefined {
    const scenes = this.game.scene.getScenes(true);
    return scenes.find((s) => s.sys.isActive()) ?? scenes[0];
  }
}

export function getSoundManager(game: Phaser.Game): SoundManager | undefined {
  return game.registry.get('soundManager') as SoundManager | undefined;
}

/** Call from scene create so the first tap on that scene unlocks audio. */
export function bindSceneAudioUnlock(scene: Phaser.Scene): void {
  scene.input.once('pointerdown', () => {
    getSoundManager(scene.game)?.unlock(scene);
  });
}
