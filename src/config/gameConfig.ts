/**
 * Central game configuration.
 * Tweak values here to balance difficulty, timing, and level size.
 */
export const GAME_CONFIG = {
  /** Internal design resolution — Phaser scales this to fit the screen */
  width: 1280,
  height: 720,

  /** World / level dimensions */
  worldWidth: 4800,
  worldHeight: 720,

  /** Player movement */
  playerSpeed: 280,
  playerJumpVelocity: -520,
  /** Hold X + jump for an extra-high leap */
  playerHighJumpVelocity: -700,
  playerBounce: 0.1,

  /** Kiss blow attack */
  kissBlowCooldownMs: 450,
  kissProjectileSpeed: 420,
  kissProjectileLifetimeMs: 900,

  /** Bounce after stomping an enemy */
  stompBounceVelocity: -340,

  /** Gravity (pixels per second²) */
  gravity: 1200,

  /** Starting lives */
  startingLives: 3,

  /** Countdown timer in seconds */
  startingTime: 90,
  timerBonus: 15,

  /** Projects needed to win */
  requiredProjects: 3,

  /** Score per kiss */
  kissScore: 100,

  /** Invulnerability after getting hurt (ms) */
  hurtInvulnMs: 1500,

  /** Enemy patrol speed */
  enemySpeed: 80,

  /** Camera follow smoothing (lower = snappier) */
  cameraLerp: 0.1,

  /** Safe area padding for mobile notches (CSS pixels, scaled in-game) */
  safePadding: 16,

  /** Timer pickup floating messages */
  timerMessages: [
    'More time to create!',
    'Project saved!',
    'Deadline extended!',
    'One more idea unlocked!',
  ],

  /** Colors — Andsiosa red & white identity */
  colors: {
    skyTop: 0xb8e0f5,
    skyBottom: 0xfce4ec,
    cloud: 0xffffff,
    hillFar: 0xf8bbd0,
    hillNear: 0xf48fb1,
    platform: 0xffcdd2,
    platformTop: 0xff8a80,
    ground: 0xe57373,
    groundTop: 0xffab91,
    kiss: 0xe91e63,
    kissGlow: 0xf48fb1,
    timer: 0xffd54f,
    timerGlow: 0xfff176,
    portal: 0xce93d8,
    portalGlow: 0xf8bbd0,
    enemy: 0x5d4037,
    enemyAccent: 0x8d6e63,
    playerRed: 0xe53935,
    playerWhite: 0xffffff,
    playerHair: 0xc62828,
    uiBg: 0xffffff,
    uiText: 0x880e4f,
    uiAccent: 0xe91e63,
  },
} as const;

export type GameStats = {
  score: number;
  kisses: number;
  timeRemaining: number;
  projectsCompleted: number;
  lives: number;
};

export const createInitialStats = (): GameStats => ({
  score: 0,
  kisses: 0,
  timeRemaining: GAME_CONFIG.startingTime,
  projectsCompleted: 0,
  lives: GAME_CONFIG.startingLives,
});
