#!/usr/bin/env bash
# Primary phone access: Cloudflare quick tunnel → Vite dev server (HTTPS).
# Do NOT restart this when editing app code — Vite HMR updates through the tunnel.
set -euo pipefail
cd "$(dirname "$0")/.."

LOG="/tmp/cloudflared.log"
URL_FILE=".phone-url"

if ! curl -sf -o /dev/null http://127.0.0.1:5173/; then
  echo "Vite is not running on :5173. Start it first: npm run dev"
  exit 1
fi

if [ ! -x /tmp/cloudflared ]; then
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
fi

if pgrep -f "cloudflared tunnel --url http://127.0.0.1:5173" >/dev/null 2>&1; then
  URL=$(grep -o 'https://[^ ]*trycloudflare.com' "$LOG" 2>/dev/null | tail -1)
  if [ -n "$URL" ] && curl -sf -o /dev/null --connect-timeout 8 "$URL/"; then
    echo "$URL" | tee "$URL_FILE"
    echo "Cloudflare tunnel already running."
    exit 0
  fi
  echo "Stale tunnel detected — restarting cloudflared..."
  pkill -f "cloudflared tunnel --url http://127.0.0.1:5173" 2>/dev/null || true
  sleep 2
fi

: > "$LOG"
nohup /tmp/cloudflared tunnel --url http://127.0.0.1:5173 >> "$LOG" 2>&1 &

for _ in $(seq 1 20); do
  URL=$(grep -o 'https://[^ ]*trycloudflare.com' "$LOG" 2>/dev/null | tail -1)
  if [ -n "$URL" ]; then
    echo "$URL" | tee "$URL_FILE"
    exit 0
  fi
  sleep 1
done

echo "Tunnel failed to start. Check $LOG"
exit 1
