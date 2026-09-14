# AGENTS.md

Guidance for AI agents working in this repository.

## Cursor Cloud specific instructions

### Live site (permanent — use on phone)

**GitHub Pages** is the canonical permanent URL for this app:

- **https://andmarquez.github.io/performingtypography/**

Deploys automatically via `.github/workflows/deploy-pages.yml` on push to **`main`** only (GitHub Pages branch policy). Requires **Settings → Pages → Source: GitHub Actions**.

Use this for phone access that does not depend on a running dev server or Cloudflare quick tunnel.

### Phone access during development (Cloudflare tunnel — temporary)

For HTTPS while editing locally, use the **Cloudflare quick tunnel**. Do **not** restart it when editing app code — Vite HMR pushes updates through the tunnel automatically.

```bash
npm run dev          # keep running on :5173
npm run phone:tunnel # writes URL to .phone-url
cat .phone-url
```

- Tunnel log: `/tmp/cloudflared.log`
- Only restart `npm run dev` after dependency changes; leave `cloudflared` running.
- `vite.config.js` sets `server.allowedHosts: true` so tunnel hostnames work.
- Fallback tunnels (localtunnel, tunnelmole) are optional; Cloudflare is canonical for this project.

### Branch note

The full Concert Kinetic Typography Vite app is on **`main`** (`package.json`, `src/`, `public/experience/`). No branch checkout is required for normal development.

### Services

| Service | Command | Port |
|---------|---------|------|
| Vite dev server (required) | `npm run dev` | 5173 (default) |
| Vite preview (optional) | `npm run build` then `npm run preview` | 4173 (default) |

The dev server binds `0.0.0.0` (see `package.json`), so it is reachable from other devices on the LAN via the Network URL Vite prints.

There is no backend, database, Docker stack, or separate API service.

### Dependencies

From the repo root (on a branch with `package.json`):

```bash
npm install
```

Node.js 18+ is sufficient; the cloud VM ships with Node 22.

### Lint and tests

This project does not define `lint` or `test` npm scripts. Validation is:

- `npm run build` — production bundle
- Manual or browser automation against `npm run dev`

### Camera / microphone in cloud VMs

The app requires `getUserMedia` (rear camera + mic) after **Start Experience**. Cloud/Linux VMs often have no physical devices, so Chrome may show `Requested device not found` unless fake devices are used.

For automated or headless verification in this environment, launch Chromium/Chrome with:

- `--use-fake-device-for-media-stream`
- `--use-fake-ui-for-media-stream`

Example (Playwright): pass those flags in `chromium.launch({ args: [...] })`, click **Start Experience**, then tap the `.phone-frame` to cycle words (LUX → MOTOMAMI → …) and swipe to change modes.

On real phones, use HTTPS or localhost; see `README.md` for mobile Safari notes.

### Hello-world smoke check

1. `npm run dev`
2. Open http://127.0.0.1:5173/
3. Start experience (with fake media flags in CI/cloud if needed)
4. Tap the stage — word index in the HUD should advance when kinetic text overlay is enabled
5. **Art tabs** (bottom, scroll horizontally) — should list all screens from `public/experience/screen-labels.json` (13 configured; only screens with a matching `.svg` on disk are tappable). Switch between available artwork (e.g. Saoko → Despechá); selection persists in `localStorage` (`experience.activeSlug`).

### Experience assets

- Drop SVGs in `public/experience/` using the exact filenames in `public/experience/screen-labels.json`.
- Run `npm run experience:manifest` (also runs on `npm run dev` / `build`). The manifest lists every configured screen; missing files appear as disabled tabs until uploaded.
- Splash PNGs live in `public/splash/` (`home-4`, `home-2`, `home-3`). After updating images, bump `SPLASH_ASSET_VERSION` in `src/components/SplashScreen.jsx` so phones bypass cache.
- In-experience HUD / Customize FAB use `.is-live` safe-area padding; splash stays edge-to-edge.
