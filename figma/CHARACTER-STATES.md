# Andsiosa character components (Figma)

Frame **🧍 Character States (replaceable)** — below M02 artboard on the gameplay page.

## Components (48×48 px artboard, 48×64 game export)

| Component | Game texture key | When used |
|-----------|------------------|-----------|
| `Character/Andsiosa/idle` | `andsiosa-idle` | Standing still |
| `Character/Andsiosa/run` | `andsiosa-run` | Moving left/right |
| `Character/Andsiosa/jump` | `andsiosa-jump` | Jumping up |
| `Character/Andsiosa/fall` | `andsiosa-fall` | Falling |
| `Character/Andsiosa/hurt` | `andsiosa-hurt` | Hit / game over |
| `Character/Andsiosa/victory` | `andsiosa-victory` | Win screen |

## Replace art

1. In Figma, open **Assets** → search `Character/Andsiosa`
2. Double-click the state you want (e.g. `idle`)
3. Replace or edit layers inside the 48×64 component — keep the frame size
4. Export each component as **PNG @1x** named `andsiosa-{state}.png`

## Wire into game

Drop PNGs in `public/assets/character/` and load in `BootScene.ts` (or ask to sync exports from Figma).

Placeholder vectors match `BootScene.createPlayerTextures()` until real art is exported.
