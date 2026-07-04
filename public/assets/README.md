# Game Assets

## Figma world sync (Level 1)

**File:** https://www.figma.com/design/1zlB4dA4ktyuuBXzseo1ix

After you move or edit world components on **M02 — Gameplay (Level 1)**:

1. Keep component **names** aligned with `figma/world-asset-registry.json` (`Blocks-1` → `blocks-1`, `waves` → `waves`, etc.).
2. Re-export PNGs:
   - Ask Cursor to export via Figma MCP (writes `figma/export-urls.json`), **or**
   - `FIGMA_ACCESS_TOKEN=… npm run assets:export`
3. `npm run assets:sync` — downloads PNGs into `public/assets/world/components/` and rebuilds `manifest.json`.
4. Update `public/assets/world/level-1/layout.json` when placements change (re-extract from M02 artboard).

| Path | Purpose |
|------|---------|
| `figma/world-asset-registry.json` | Maps Figma component names → file names + node IDs |
| `figma/export-urls.json` | Temporary export URLs (regenerated each sync) |
| `public/assets/world/components/*.png` | Exported world sprites |
| `public/assets/world/level-1/layout.json` | Positions + gameplay markers from M02 |
| `public/assets/world/manifest.json` | Runtime index (auto-generated) |

## Debug collision overlays

Add `?debug=1` to the URL or press **H** during gameplay to toggle green collision slabs on terrain surfaces.

## Figma UI screens

| Page | Artboard size | Contents |
|------|---------------|----------|
| 🎨 Design Tokens | — | Brand colors + typography |
| 📱 Screens — Mobile Landscape | **1280 × 720** | M01–M04 + touch controls |
| 🖥️ Screens — Desktop | **1920 × 1080** | D01–D04 |
| 🧩 Components | — | Andsiosa, HUD, world components |

## Character / gameplay sprites

| File | Purpose |
|------|---------|
| `andsiosa.png` | Player spritesheet |
| `deadline-bug.png` | Enemy |
| `kiss.png` | Collectible |
| `timer.png` | Power-up |
| `portal.png` | Level end portal |

Swap placeholders in `src/scenes/BootScene.ts` — keep texture keys (`andsiosa-idle`, `kiss`, etc.).
