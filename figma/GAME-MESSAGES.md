# Game Messages — Figma Components

**Figma file:** https://www.figma.com/design/1zlB4dA4ktyuuBXzseo1ix  
**Page:** `🧩 Components` (scroll below character/HUD section)

## Component sets (brand these)

| Component | Variants | Used in code |
|-----------|----------|--------------|
| **Message / Toast** | 8 messages (`kind=timer\|combat\|unlock\|portal`) | `GameScene.showFloatingMessage()` |
| **Message / Screen** | Game Over (3 reasons) + Win | `GameOverScene`, `WinScene` |
| **Message / CTA** | Try Again / Play Again | End-screen buttons |

### Message / Toast copy

| Variant kind | Text |
|--------------|------|
| timer | More time to create! |
| timer | Project saved! |
| timer | Deadline extended! |
| timer | One more idea unlocked! |
| unlock | Triple jump unlocked! |
| combat | Stomped with love! |
| combat | Bug turned to heart! |
| portal | Collect more timers to finish your projects! |

### Message / Screen copy

| screen | reason | Title | Body |
|--------|--------|-------|------|
| game-over | time | Game Over | The deadline ran out! |
| game-over | lives | Game Over | Too many deadline bugs got you! |
| game-over | fall | Game Over | Andsiosa fell off the creative world! |
| win | default | You Did It! | All creative projects finished before the deadline! |

## Default styles (from code)

- **Toast:** Nunito Bold 20px, white on `#E91E63` @ 80%, pill radius, padding 12×6
- **Screen title:** 64px bold — red `#C62828` (game over) or maroon `#880E4F` (win)
- **Screen body:** 26px semibold `#AD1457`
- **CTA:** Nunito Bold 26px, white on `#E91E63`, padding 24×14, radius 12

After branding in Figma, run `npm run assets:screens` and bump `screenAssetVersion` in `gameConfig.ts`. Layout lives in `src/ui/endScreenLayout.ts` (M03/M04) and `MenuScene.ts` (M01).
