# Enemy components (Figma)

Frame **🐛 Enemy States (replaceable)** — below the Andsiosa character states on the gameplay page.

## Components

| Component | Game texture key | Size (Figma) | When used |
|-----------|------------------|--------------|-----------|
| `Enemy/DeadlineBug/idle` | `deadline-bug` | 40×32 px | Patrol enemies in level 1 |
| `Enemy/FinalBoss/idle` | `final-boss` | 80×80 px | Boss guarding the portal |

Figma node IDs (on **📱 Screens — Mobile Landscape**):

| Enemy | Node ID |
|-------|---------|
| Deadline Bug | `103:8` |
| Final Boss | `103:16` |

Sync: `npm run assets:enemy` (uses `figma/export-enemy-manifest.json`).

Exports are synced at **3×** for crisp display on phones.

## Replace art

1. In Figma, open **Assets** → search `Enemy/`
2. Double-click the enemy you want (e.g. `Enemy/DeadlineBug/idle`)
3. Replace or edit layers inside the component — keep the frame size
4. Run `npm run assets:enemy` to pull PNGs into `public/assets/enemy/`

## Wire into game

Enemy PNGs load in `BootScene.ts` when present; placeholder vectors are used until real art is synced.
