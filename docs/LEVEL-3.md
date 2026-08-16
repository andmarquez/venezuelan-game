# Level 3 — concrete code touch points

How levels 1–2 are wired today, and exactly what to change to ship a playable **level-3**.

---

## Layout JSON shapes (reference)

### Level 1 — `public/assets/world/level-1/layout-mobile.json`

**Top-level keys:** `level`, `variant`, `figmaArtboard`, `figmaNodeId`, `width`, `height`, `background`, `platforms`, `platformArt`, `clouds`, `markers`

**`markers` shape:**

| Key | Shape |
|-----|--------|
| `player_spawn` | `{ x, y }` |
| `portal_goal` | `{ x, y, size? }` |
| `kiss_collectibles` | `{ x, y }[]` |
| `timer_collectibles` | `{ x, y }[]` |
| `virgen_collectibles` | `{ x, y }[]` (optional) |
| `enemies` | `{ x, y, min, max }[]` |
| `final_boss` | `{ x, y, min, max }` (optional) |

Horizontal side-scroller: `width: 5335`, `height: 720`. Background is one section keyed `world:level-1-background`.

### Level 2 — `public/assets/world/level-2/layout-mobile.json`

Same core keys **plus** `"scroll": "vertical"`.

- Dims: `width: 1280`, `height: 4800`
- No `platformArt` / `clouds` in the current file
- **Important:** `scroll` is **not** typed on `LevelLayout` and **not** read by runtime. Vertical climb behavior is hard-coded on `getSelectedLevelId(…) === 'level-2'` in `GameScene`.

---

## 1. BootScene — layouts + backgrounds

**File:** `src/scenes/BootScene.ts`

| Step | Where | What |
|------|--------|------|
| Preload layout JSON | `preload()` | `this.load.json('level-N-layout-mobile' \| '…-desktop', …)` for each level |
| Preload music | `preload()` → `audioAssets` | e.g. `{ key: 'music-level-2', path: 'assets/audio/music-level-2.mp3' }` |
| Load BG PNGs | `loadWorldAssets()` | Reads `worldManifest.backgrounds` entries with `present: true`, loads `entry.key` / `entry.path` |
| Load platform art | `loadWorldAssets()` | Walks cached layouts’ `platformArt[]`, dedupes by `art.key` |

**Level-3 adds:**

```ts
// preload()
this.load.json('level-3-layout-mobile', assetUrl('assets/world/level-3/layout-mobile.json', v));
this.load.json('level-3-layout-desktop', assetUrl('assets/world/level-3/layout-desktop.json', v));
// optional: { key: 'music-level-3', path: 'assets/audio/music-level-3.mp3' }

// loadWorldAssets() — include both new layouts in the `layouts` array
```

Background PNG is **not** loaded from the layout path alone — it must be listed in `manifest.json` with `"present": true` (see §7). Layout `background.sections[].key` must match the manifest texture key (e.g. `world:level-3-background`).

---

## 2. MenuScene + menu-start-layout.json — Level 3 button

**Files:**

- `src/scenes/MenuScene.ts`
- `public/assets/ui/screens/menu-start-layout.json`

Level 3 **already exists** as coming-soon:

```json
{ "id": "level-3", "label": "Level 3 — Coming soon", "level": null, "comingSoon": true, "x": 460, "y": 504, "w": 340, "h": 115 }
```

`MenuScene` prefers cache key `menu-start-layout`; falls back to `FALLBACK_BUTTONS`.

**Unlock checklist:**

1. JSON: set `"level": "level-3"`, remove `"comingSoon"` (or `false`), update `label`.
2. Mirror the same object in `FALLBACK_BUTTONS`.
3. Widen types: `MenuButtonConfig.level` and `startLevel(level: …)` from `'level-1' \| 'level-2'` → include `'level-3'`.
4. Optional keyboard: `keydown-THREE` / `NUMPAD_THREE` → `startLevel('level-3')` (today only ONE/TWO).

`startLevel` sets `registry.set('currentLevel', level)` then `scene.start('GameScene')`.

---

## 3. getSelectedLevelId / layoutUtils

**File:** `src/world/layoutUtils.ts`

| Function | Role |
|----------|------|
| `getSelectedLevelId(game?)` | Registry `currentLevel`, else `?level=` query, else `'level-1'` |
| `getLevelLayoutCacheKey(game)` | `` `${level}-layout-${mobile\|desktop}` `` — must match BootScene load keys |
| `getRequiredProjects(layout)` | Counts `markers.timer_collectibles` (portal gate) |

**Level-3 adds** inside `getSelectedLevelId`:

- Accept registry / query: `'level-3'` / `'3'`
- Keep order: registry → query → default `'level-1'`

Without this, menu can set `currentLevel` but URL/`?level=3` and any scene that re-reads the id will ignore level-3.

---

## 4. GameScene — level-specific branching

**File:** `src/scenes/GameScene.ts` → `create()`

| Branch | Condition today | Behavior |
|--------|-----------------|----------|
| Extra timer | `=== 'level-2'` | `stats.timeRemaining = max(…, 180)` |
| Vertical camera | `isVerticalClimb = === 'level-2'` | Uses `GAME_CONFIG.verticalClimbCamera` deadzone / lerp / `setFollowOffset(0, followOffsetY)` |
| Music | always | `musicKeyForLevel(getSelectedLevelId(…))` |

Everything else is **layout-driven** (bounds from `width`/`height`, spawn/markers via `WorldBuilder` + marker helpers). Fall death uses `levelLayout.height + 50`.

**For level-3:**

- If horizontal (like L1): no climb camera branch needed.
- If vertical (like L2): either hard-code `level-3` alongside L2, or prefer reading `layout.scroll === 'vertical'` (requires typing `scroll?` on `LevelLayout`).
- Tune timer / camera in `GAME_CONFIG` if water / tall maps need different values.

---

## 5. Player.ts — movement / gravity / jump hooks

**File:** `src/objects/Player.ts`

**No level-id branching today.** All motion constants come from `GAME_CONFIG` (`src/config/gameConfig.ts`). World gravity is set once in `src/main.ts` (`arcade.gravity.y = GAME_CONFIG.gravity`).

| Hook / API | Notes |
|------------|--------|
| `updateMovement(cursors, keys)` | Speed `playerSpeed`; jump stack uses `playerJumpVelocity` / high / double / triple |
| Floor reset | `body.blocked.down \|\| body.touching.down` → refill `jumpsRemaining` |
| `grantTripleJump()` | Timer collectible unlocks 3rd jump |
| `stompBounce()` | Enemy stomp |
| `hurt` / `celebrate` / `setBlessedGlow` | Combat / win / Virgen |
| Body size | `fitDisplayScale()` — fixed collision box from display scale |

**Optional water physics (none exist yet):** natural hooks are:

1. `Player.updateMovement` — if submerged, cut gravity / drag, swap jump → swim impulse.
2. `GameScene` update — overlap vs water zones from layout; call into Player.
3. `WorldBuilder` — new zone type (e.g. `type: 'water'`) as sensor bodies (no walk collision).
4. `GAME_CONFIG` — `waterGravity`, `swimSpeed`, etc.
5. Optionally `body.setAllowGravity(false)` while swimming; restore on exit.

Do **not** expect `scroll` or level id to change Player today — any water/swim behavior is new code.

---

## 6. WorldBuilder / worldTypes — layout schema

**Files:**

- `src/world/worldTypes.ts` — `LevelLayout`, `LevelMarkers`, `PlatformZone`, `PlatformArt`, …
- `src/world/WorldBuilder.ts` — `WorldBuilder.build(scene, layout, options)`

**`LevelLayout` fields used at runtime:**

`level`, `variant`, `width`, `height`, `background.sections[]`, `platforms[]`, optional `platformArt[]`, optional `clouds[]`, `markers`

**`PlatformZone.type`:** `'platform' | 'pipe'` only (`getPlatformCollisionRect` treats pipes / `ground_floor` / `platform_start` as full-height).

**`WorldBuilder.build` pipeline:** `createSky` → `drawBackground` → `drawPlatformArt` → `createPlatformBodies` → optional debug overlays.

Level-3 needs **no WorldBuilder API change** if it only uses existing platform/pipe/markers. Add schema + builder paths only for water sensors, hazards, or new art layers.

---

## 7. manifest.json / world asset loading

**Files:**

- `public/assets/world/manifest.json` — Boot loads as `world-manifest`
- `figma/world-asset-registry.json` — source of truth for Figma export / sync notes

**Pattern (level-2 example):**

```json
"level-2-mobile": {
  "key": "world:level-2-background",
  "path": "/assets/world/background/level-2-mobile.png",
  "figmaNodeId": "…",
  "figmaName": "…",
  "present": true
}
```

PNG on disk: `public/assets/world/background/level-N-….png`.

`layout.background.sections[0].key` **must equal** manifest `key`. Boot only loads backgrounds with `present: true`.

Optional: mirror entry in `figma/world-asset-registry.json` for asset sync tooling.

Bump `GAME_CONFIG.worldAssetVersion` after shipping new PNGs so caches refresh.

---

## 8. Music key pattern

| Layer | File | Pattern |
|-------|------|---------|
| Phaser preload | `BootScene.preload` | `{ key: 'music-level-2', path: 'assets/audio/music-level-2.mp3' }` |
| Native HTMLAudio | `src/audio/nativeAudio.ts` | `MusicNativeKey`, `FILES`, `MUSIC_KEYS`, `isMusicKey` |
| Router | `src/audio/SoundManager.ts` → `musicKeyForLevel(levelId)` | `level-2` → `music-level-2`; else `music-game` |
| Call sites | `MenuScene`, `GameScene`, `GameOverScene`, `WinScene` | all use `musicKeyForLevel` |

**Level-3 music (optional):**

1. Add `public/assets/audio/music-level-3.mp3`
2. Extend `MusicNativeKey` + `FILES` + `MUSIC_KEYS` / `isMusicKey`
3. BootScene `audioAssets` entry
4. `musicKeyForLevel`: `level-3` → `music-level-3`
5. Bump `GAME_CONFIG.audioAssetVersion`

If omitted, level-3 keeps default `music-game` (gaita).

---

## Minimal implementation checklist

### Required for playable level-3

- [ ] **Layout JSON** — add `public/assets/world/level-3/layout-mobile.json` (+ desktop). Copy L1 or L2 structure; fill `platforms` + full `markers` (at least `player_spawn`, `portal_goal`, kisses/timers as needed). Include `"scroll": "vertical"` only if documenting a climb map (runtime still needs GameScene branch or typed `scroll` reader).
- [ ] **Background PNG** — `public/assets/world/background/level-3-mobile.png` (and desktop if used). Register in `manifest.json` with `key: "world:level-3-background"`, `present: true`. Match layout section `key`/`path`.
- [ ] **Menu unlock** — `menu-start-layout.json` + `MenuScene` `FALLBACK_BUTTONS` / types / `startLevel`; clear `comingSoon`.
- [ ] **Selection** — `getSelectedLevelId` accepts `level-3` / `3`.
- [ ] **Boot load** — preload both layout cache keys; append layouts in `loadWorldAssets()`; bump `worldAssetVersion` if needed.

### Optional

- [ ] **Music** — `music-level-3` through nativeAudio + SoundManager + BootScene (see §8).
- [ ] **GameScene** — timer / camera if vertical or longer than L1.
- [ ] **Water physics hooks** — new layout zone type + WorldBuilder sensors + Player swim path + GameScene overlap (see §5); nothing exists yet.
- [ ] **Figma registry** — `figma/world-asset-registry.json` entry for sync docs.
- [ ] **Keyboard** — digit `3` on menu.

### Smoke test

1. `npm run dev` → open with mobile gate / `?mobile=1` as needed.
2. Menu → Level 3 starts GameScene (no “Coming soon!”).
3. `?level=3` also selects level-3 after boot→menu→start (or set registry).
4. HUD / spawn / platforms / portal match layout; music if added.
