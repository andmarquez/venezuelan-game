# Figma Gameplay Zones

Layer **🎯 Gameplay Zones** on:

- **M02 — Gameplay (Level 1)** (`13:2`) → `layout-mobile.json`
- **D02 — Gameplay** → **Game Viewport 1280×720** (`24:433`) → `layout-desktop.json`
- **M06 — Gameplay (Level 2 Vertical)** (`190:3`) → `level-2/layout-mobile.json`
- **M07 — Gameplay (Level 3 Underwater)** (`239:3`) → future `level-3/layout-*.json`

## Contents (Level 1 / 2)

| Group | Items | Style |
|-------|-------|--------|
| **Platforms (collision)** | `platform_start`, `platform_01`…`07`, `floating_platform_01`…`08`, `pipe`, `goal_platform` | Green dashed rectangles (blue for pipes) |
| **Clouds (decorative)** | `cloud_01`…`cloud_10` | White fill, sky-blue dashed outline — **no collision** |
| **Markers** | `player_spawn`, `portal_goal`, `kiss_1`…, `timer_1`…, `enemy_1`… | Colored ellipses |

Move the green rectangles until they sit on the walkable tops in the artwork. The visible level art is the single **`- 1`** background image (`24:328`) — no per-component PNG exports.

## Level 3 — Underwater (Canoe + Swim)

Page: **Level 3 — Underwater (Canoe + Swim)** (`239:2`)  
Artboard: **M07 — Gameplay (Level 3 Underwater)** (`239:3`) — **5335×720** horizontal (same shape as Level 1).

Water surface line ≈ **y = 280**.

| Group | Node | Items |
|-------|------|--------|
| **Water (canoe + swim)** | `239:47` | `water_surface` (canoe float band), `water_body` (swim volume) |
| **Platforms (collision)** | `239:50` | Surface docks (`platform_start`, `dock_*`, `goal_platform`) + underwater shelves (`uw_shelf_*`) + `seabed_*` |
| **Markers** | `239:73` | `player_spawn`, `canoe_spawn`, `dive_point_*`, `surface_exit_*`, surface/UW kisses, timers, enemies, `portal_goal` |

### Intended gameplay (design)

1. Start on dock → board **canoe** (`canoe_spawn`) and ride **on** `water_surface`.
2. At `dive_point_*`, leave canoe and **swim** inside `water_body` (Mario water-level style).
3. Collect underwater kisses/timers on coral shelves; return via `surface_exit_*`.
4. Reach `goal_platform` / `portal_goal` on the far island.

Hide **Gameplay Zones** + **Labels (hide before export)** before exporting background art.

Replaceable placeholders below the artboard: **Canoe + Swim States (replaceable)**.

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

Level 3 is Figma-ready; code wiring (`level-3` layouts, canoe/swim physics, menu unlock) is a follow-up.

## Debug in-game

`?debug=1` or press **H** — green = platforms, blue = pipes. **Purple dashed = clouds** (look up in the sky area).

Force cloud boxes: `?clouds=1` (desktop). Hide all zones: `?zones=0&clouds=0`.

In Figma, open layer **Clouds (decorative)** on M02 — lavender dashed rounded rects.
