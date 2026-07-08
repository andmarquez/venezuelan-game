# AGENTS.md

Guidance for AI agents working on **Venezuelan Game**.

## Live site (permanent — share this link)

**GitHub Pages** is the canonical permanent URL:

- **https://andmarquez.github.io/venezuelan-game/**

Deploys automatically via `.github/workflows/deploy-pages.yml` on push to **`main`** in the **`venezuelan-game`** repo. Requires **Settings → Pages → Source: GitHub Actions** (one-time).

This URL stays the same when you push updates — only the game content changes.

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
