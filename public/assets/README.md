# Game Assets — Level 1

## Simplified level system

Gameplay is driven by **named invisible platform rectangles** in the layout JSON.
Background art is **visual only** (no physics).

| File | Purpose |
|------|---------|
| `level-1/layout-mobile.json` | M02 — platforms, markers, background (mobile) |
| `level-1/layout-desktop.json` | D02 — same structure (desktop) |
| `level-1/figma-visual-placements.json` | Figma sprite positions (visual rebuild source) |
| `components/*.png` | Individual art layers (composite background) |
| `background/level-1-section-*.png` | Optional stitched background strips |

## Edit gameplay (easy)

Open `layout-mobile.json` and edit the `platforms` array:

```json
{ "name": "platform_start", "x": 0, "y": 656, "width": 1000, "height": 20, "type": "platform" }
```

Markers for spawn, kisses, timers, enemies, portal:

```json
"markers": {
  "player_spawn": { "x": 198, "y": 656 },
  "portal_goal": { "x": 8459, "y": 545 },
  ...
}
```

Rebuild desktop copy: `npm run assets:layout`

## Debug

`?debug=1` or press **H** — shows green platform rectangles with names.

## Figma sync (visual art only)

1. Update components in Figma (M02 / D02)
2. `npm run assets:sync` — re-export PNGs
3. Update `figma-visual-placements.json` if positions moved
4. `npm run assets:layout` — regenerate layout files
5. Tune `platforms` rectangles to match the art
