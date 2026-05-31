# AGENTS.md

Guidance for AI agents working in this repository.

## Cursor Cloud specific instructions

### Phone access (Cloudflare tunnel — primary)

For HTTPS on a real phone, use the **Cloudflare quick tunnel** (user-preferred). Do **not** restart it when editing app code — Vite HMR pushes updates through the tunnel automatically.

```bash
npm run dev          # keep running on :5173
npm run phone:tunnel # writes URL to .phone-url
cat .phone-url
```

- Tunnel log: `/tmp/cloudflared.log`
- Only restart `npm run dev` after dependency changes; leave `cloudflared` running.
- `vite.config.js` sets `server.allowedHosts: true` so tunnel hostnames work.
- Fallback tunnels (localtunnel, tunnelmole) are optional; Cloudflare is canonical for this project.

### Routes

| Path | Mode |
|------|------|
| `/` | Classic kinetic typography (unchanged) |
| `/lyrics` | Live lyrics lab — auto song match, beat-synced placeholder lyrics, Tailwind + Framer Motion |

Phone URLs: append `/lyrics` to the Cloudflare tunnel base.

Lyrics mode:
- **Automatic** song panel (mock AI match from BPM/energy after ~5 beats; optional AudD with `VITE_AUDD_API_TOKEN`)
- **No search bar** — fully automatic
- Web Audio: volume, bass, mid, treble, BPM, beat intensity
- Typography: size←volume, weight←bass, spacing←treble, glitch rotation←beat peaks
- Language from `franc` on lyric text → typography preset
- Vite proxies: `/api/lrclib`, `/api/audd`

Do not restart Cloudflare tunnel when editing lyrics code; HMR applies on `/lyrics`.

### Branch note

`main` currently contains only a placeholder README. The Concert Kinetic Typography Vite app lives on `cursor/concert-kinetic-typography-1da3` (or any branch that includes `package.json` and `src/`). Check out that branch before installing dependencies or running scripts.

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
4. Tap the stage — word index in the HUD should advance (e.g. `01/6` → `02/6`)
