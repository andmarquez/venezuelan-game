# Figma Gameplay Zones

Layer **🎯 Gameplay Zones** on:

- **M02 — Gameplay (Level 1)** (`13:2`) → `layout-mobile.json`
- **D02 — Gameplay** → **Game Viewport 1280×720** (`24:433`) → `layout-desktop.json`

## Contents

| Group | Items | Style |
|-------|-------|--------|
| **Platforms (collision)** | `platform_start`, `platform_01`…`07`, `floating_platform_01`…`08`, `pipe`, `goal_platform` | Green dashed rectangles (blue for pipes) |
| **Clouds (decorative)** | `cloud_01`…`cloud_10` | White fill, sky-blue dashed outline — **no collision** |
| **Markers** | `player_spawn`, `portal_goal`, `kiss_1`…, `timer_1`…, `enemy_1`… | Colored ellipses |

Move the green rectangles until they sit on the walkable tops in the artwork. The visible level art is the single **`- 1`** background image (`24:328`) — no per-component PNG exports.

## Sync to the game

Marker positions → `figma/figma-gameplay-markers.json` (kisses, timer, spark, enemies, portal).

Platform zones → `public/assets/world/level-1/figma-platform-zones.json`

Then run:

```bash
npm run assets:layout:mobile   # extract platforms/markers from Figma coords
npm run assets:download        # refresh background PNG from figma/export-urls.json
npm run assets:manifest
```

Or ask to **extract zones from Figma** and the agent will read positions from the artboard.

## Debug in-game

`?debug=1` or press **H** — green = platforms, blue = pipes. **Purple dashed = clouds** (look up in the sky area).

Force cloud boxes: `?clouds=1` (desktop). Hide all zones: `?zones=0&clouds=0`.

In Figma, open layer **Clouds (decorative)** on M02 — lavender dashed rounded rects.
