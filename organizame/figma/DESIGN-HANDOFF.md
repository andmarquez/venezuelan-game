# Organízame → Figma handoff

Use this when pushing the current app into a new Figma file (Option C).

## Figma file (live)

**Organízame — Design Starter**

https://www.figma.com/design/GzkxjYxJpw6U94P1fv7k5I/Organizame-Design-Starter

Pages:
- **📱 Screens** — 8 mobile captures (390×844) from the running app
- **🎨 Design System** — color tokens, typography notes, component list

After editing, send the link back to Cursor to sync code.

## 1. Connect Figma in Cursor (required for auto-push)

1. Open **Cursor Desktop** (Figma MCP does not work in all cloud-only sessions).
2. Go to **Settings → MCP → Figma**.
3. Click **Connect** / **Authenticate** and approve access in the browser.
4. Return to this chat and say: **`Continue Option C — push to Figma`**.

I will then:

1. Call `whoami` → pick your Figma plan
2. Create **`Organízame — Design Starter`** via `create_new_file`
3. Run **`generate_figma_design`** against the running app (pixel-accurate mobile frames)
4. Add a **Design System** page with color + type tokens via `use_figma`
5. Send you the **Figma file URL**

## 2. Manual fallback (no MCP)

If you prefer to start now without MCP:

1. Open Figma → **New design file**
2. Create a frame: **390 × 844** (iPhone 14)
3. Drag PNGs from `figma/exports/` onto the canvas (one per screen)
4. Build components on top using tokens in `design-tokens.json`

## 3. Screens to include

| Frame name | Route / tab | Notes |
|------------|-------------|-------|
| Today | `today` | Greeting, mode card, timeline, CTA buttons |
| Organízame | `organizame` | Brain dump, period pills, task cards, generated plan |
| Week | `week` | 7-day cards, rebalance button |
| Month | `week` → Month toggle | 4 weekly strategy cards |
| Inbox | `inbox` | Task list + add form |
| Modes | `modes` | Mode cards grid |
| Settings | ⚙️ overlay | Calendar connect, Reaction Vault |
| Andsiosa FAB | floating | Quick action menu open state |
| Reaction popup | overlay | GIF + message |

## 4. Design tokens

See `design-tokens.json` in this folder.

## 5. After you edit in Figma

Send back:

```
Update Organízame from Figma:
Link: https://www.figma.com/design/FILE_KEY/...
Frames: Today, Organízame, …
Notes: what changed
```

I will update `src/index.css`, components, and screens to match.
