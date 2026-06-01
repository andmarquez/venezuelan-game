# Concert Kinetic Typography

A mobile-first React + Vite web app for concert visuals. It uses the rear phone camera
as a live background, listens to microphone volume with the Web Audio API, reacts to
phone motion when available, and overlays animated editorial typography.

## Features

- Rear camera background through `getUserMedia`
- Real-time microphone volume analysis with `AudioContext` + `AnalyserNode`
- Device motion/orientation tilt and shake reactions on supported mobile browsers
- Touch controls:
  - Tap to change word
  - Swipe left/right to change animation mode
  - Long press to trigger a text explosion
- Five visual modes: Pulse with audio, Stretch, Glitch, Wave, Explosion
- 9:16 vertical, record-friendly layout
- Minimal cinematic styling with a transparent black overlay and white/red type

## Preset words

- LUX
- MOTOMAMI
- SAOKO
- DESPECHÁ
- DIVINA
- DIOS ES UNA MUJER

## Live website (permanent)

The app can be hosted on **GitHub Pages** so you always have the same HTTPS link on your phone — no dev server or Cloudflare tunnel required.

**Live URL:** [https://andmarquez.github.io/performingtypography/](https://andmarquez.github.io/performingtypography/)

The site deploys automatically when changes are pushed to **`main`**. GitHub Pages only allows deploys from that branch in this repo.

### One-time setup (already done if the link above works)

1. **GitHub → performingtypography → Settings → Pages**
2. **Source:** GitHub Actions
3. Push to **`main`** — the workflow builds and deploys in ~1 minute

Bookmark the URL on your phone. Camera and mic work over HTTPS without a dev tunnel.

For local development with hot reload, use `npm run dev` and optionally `npm run phone:tunnel` (temporary URL while your computer is running).

## Local setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Camera and microphone APIs work on `localhost`.

## Mobile testing

Mobile browsers require a user gesture and a secure context for camera, microphone,
and motion permissions.

1. Start the dev server on all interfaces:

   ```bash
   npm run dev
   ```

2. Put your phone and computer on the same Wi-Fi network.
3. Open the Network URL shown by Vite on your phone.
4. If the browser blocks camera or mic on a LAN URL, expose the dev server with an
   HTTPS tunnel such as ngrok, Cloudflare Tunnel, or a deployed Vite preview.
5. Tap **Start Experience** and allow camera, microphone, and motion permissions.

### iPhone Safari notes

- Use iOS Safari over HTTPS for the closest production behavior.
- Motion/orientation access may show a separate permission prompt after tapping
  **Start Experience**.
- If permissions are denied, reload the page or reset permissions in Safari settings.

## Build

```bash
npm run build
npm run preview
```
