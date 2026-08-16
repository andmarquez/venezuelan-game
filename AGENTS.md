# AGENTS.md

Guidance for AI agents working on **Venezuelan Game**.

## Live site (permanent — share this link)

**GitHub Pages** is the canonical permanent URL:

- **https://andmarquez.github.io/venezuelan-game/**

Deploys automatically via `.github/workflows/deploy-pages.yml` on push to **`main`** in the **`venezuelan-game`** repo. Requires **Settings → Pages → Source: GitHub Actions** (one-time).

This URL stays the same when you push updates — only the game content changes.

## Figma design source (always use this file)

**Canonical UI file:** [Andsiosa's Creative Quest — UI](https://www.figma.com/design/1zlB4dA4ktyuuBXzseo1ix)

| Field | Value |
|-------|-------|
| File key | `1zlB4dA4ktyuuBXzseo1ix` |
| MCP account | Andsiosa (`andsiosa@gmail.com`) |
| Repo manifests | `figma/*.json` (all reference this file key) |

**Rules for agents**

- Treat this Figma file as the **design source of truth** for UI screens, character art, enemies, platforms, and gameplay markers.
- **Do not edit Figma** unless the user explicitly asks — read/sync from Figma into code instead.
- When the user updates designs in Figma, pull changes into the repo with the sync scripts below, then bump `screenAssetVersion` in `src/config/gameConfig.ts` if screen PNGs changed.

**Key screen nodes**

| Screen | Node ID | Manifest key |
|--------|---------|--------------|
| M01 Start | `150:117` | `menu-start` |
| M02 Gameplay (mobile) | `13:2` | — do not modify gameplay layout |
| M03 Game Over | `150:94` | `game-over-screen` |
| M04 Win | `150:2` | `win-screen` |

**Sync commands** (after Figma changes)

```bash
npm run assets:screens      # M01 / M03 / M04 full-screen PNGs
npm run assets:character    # Andsiosa sprite states
npm run assets:enemy        # Enemy art
npm run assets:platforms    # Platform art
npm run assets:sync         # World backgrounds + manifest
```

See also `figma/GAME-MESSAGES.md`, `figma/GAMEPLAY-ZONES.md`, `figma/CHARACTER-STATES.md`.

## Important — separate from Performing Typography

The Concert Kinetic Typography app lives in **`performingtypography`** — do not confuse with this game:

- https://andmarquez.github.io/performingtypography/ (different project)

## How to test this game

### Local / LAN

```bash
npm install
npm run dev   # http://127.0.0.1:5173
```

Use the Network URL Vite prints for other devices on the same Wi‑Fi.

### Phone over HTTPS (Cloudflare tunnel)

```bash
npm run dev          # keep running on :5173
npm run phone:tunnel # writes URL to .phone-url
cat .phone-url
```

- Tunnel log: `/tmp/cloudflared.log`
- Do **not** restart the tunnel when editing code — Vite HMR updates through it.
- `vite.config.ts` sets `server.allowedHosts: true` for tunnel hostnames.

### Desktop preview of mobile controls

Add `?mobile=1` to the URL (e.g. `http://127.0.0.1:5173/?mobile=1`). This is the **only** way to run the game on desktop — laptops without that param see a gate and Phaser does not boot.

## Mobile-only gate (live site)

Desktop/laptop visitors see a full-screen message; the game does not load. Detection uses coarse touch pointer + mobile UA (not Windows touchpad `maxTouchPoints`). Real phones and tablets pass through.

## Branch note

- **`main`** — game source; pushes deploy to https://andmarquez.github.io/venezuelan-game/
- Feature branches: `cursor/<name>-705a`

## Services

| Service | Command | Port |
|---------|---------|------|
| Vite dev server | `npm run dev` | 5173 |
| Vite preview | `npm run build` then `npm run preview` | 4173 |

No backend, database, or Docker.

## Validation

- `npm run build` — TypeScript check + production bundle
- Manual play on `npm run dev` or tunnel URL

## Smoke check

1. `npm run dev`
2. Open http://127.0.0.1:5173/
3. Browser tab title: **Venezuelan Game** → Enter / tap to start
4. HUD: kisses, timer, projects, lives
5. Mobile: Wild Rift layout — joystick left, jump + abilities right (`?mobile=1` on desktop)

## Replacing placeholder art

See `public/assets/README.md`. Load sprites in `BootScene.ts` using the same texture keys.
