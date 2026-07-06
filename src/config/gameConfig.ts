/**
 * Central game configuration.
 * Tweak values here to balance difficulty, timing, and level size.
 */
export const GAME_CONFIG = {
  /** Bump after Figma asset sync so phones bypass CDN/browser cache */
  worldAssetVersion: '20260705s',
  characterAssetVersion: '20260705l',
  enemyAssetVersion: '20260705l',

  /** In-game Andsiosa display scale (Figma art is 48×64; 1.75 ≈ 84×112 px) */
  playerDisplayScale: 1.75,

  /** Internal design resolution — Phaser scales this to fit the screen */
  width: 1280,
  height: 720,

  /** World / level dimensions */
  worldWidth: 5335,
  worldHeight: 720,

  /** Player movement */
  playerSpeed: 280,
  playerJumpVelocity: -520,
  /** Hold X + jump for an extra-high leap */
  playerHighJumpVelocity: -700,
  /** Second jump in mid-air (tap jump again while airborne) */
  playerDoubleJumpVelocity: -500,
  /** Third jump after grabbing a timer prize */
  playerTripleJumpVelocity: -420,
  /** Total jumps before landing (2 = single + one double) */
  maxJumps: 2,
  /** Jumps allowed after collecting a timer prize */
  maxJumpsWithPrize: 3,
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

  /** Final boss at goal platform */
  finalBossHp: 5,
  finalBossSpeed: 55,
  bossSparkScore: 250,

  /** Camera follow smoothing (lower = snappier) */
  cameraLerp: 0.1,

  /** Desktop camera deadzone — keeps more level art visible while following */
  desktopCameraDeadzone: { width: 280, height: 120 },
  mobileCameraDeadzone: { width: 100, height: 70 },

  /** Safe area padding for mobile notches (CSS pixels, scaled in-game) */
  safePadding: 16,

  /** HUD top edge — Figma M02 HUD frame 13:3 y=106 */
  mobileHudTopRatio: 106 / 720,
  /** Pill radius — Figma rounded-[60px] capped to bar height */
  hudCornerRadius: 26,

  /** Padding from bottom of screen for touch controls (plus safe-area inset) */
  mobileControlsLift: 12,

  /** Bias camera down on mobile landscape so ENVELOP crop keeps ground visible */
  mobileLandscapeCameraFollowOffsetY: 48,

  /**
   * Wild Rift controls — X anchors from Figma M02; Y is bottom-anchored in MobileControls.
   * Joystick left, Jump + Kiss on the right along the bottom edge.
   */
  mobileWildRift: {
    joystick: {
      xRatio: 107 / 1280,
      yRatio: 572 / 720,
      baseRadius: 74,
      thumbRadius: 30,
      maxDrag: 52,
      deadzone: 0.18,
    },
    jumpXRatio: 1194 / 1280,
    jumpYRatio: 431 / 720,
    kissXRatio: 1094 / 1280,
    kissYRatio: 393 / 720,
    attackRadius: 56,
    abilityRadius: 44,
    /** Legacy arc offset — used when kissXRatio not applied */
    abilityArc: [{ angleDeg: 225, distance: 138 }],
  },

  /** Timer pickup floating messages */
  timerMessages: [
    'More time to create!',
    'Project saved!',
    'Deadline extended!',
    'One more idea unlocked!',
  ],

  /** Colors — Andsiosa red & white identity */
  colors: {
    /** Figma M02 sky — Token Swatches Sky Top #B8E0F5 */
    skyTop: 0xb8e0f5,
    skyBottom: 0xb8e0f5,
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
    bossBody: 0x4a148c,
    bossAccent: 0xce93d8,
    bossGlow: 0xf8bbd0,
    bossSpark: 0xffd54f,
    bossSparkGlow: 0xfff176,
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
  hasBossSpark: boolean;
  bossDefeated: boolean;
};

export const createInitialStats = (): GameStats => ({
  score: 0,
  kisses: 0,
  timeRemaining: GAME_CONFIG.startingTime,
  projectsCompleted: 0,
  lives: GAME_CONFIG.startingLives,
  hasBossSpark: false,
  bossDefeated: false,
});
