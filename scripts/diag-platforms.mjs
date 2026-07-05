#!/usr/bin/env node
/** Headless check: player feet vs platform collision tops. */
import puppeteer from 'puppeteer';

const URL = process.argv[2] || 'http://127.0.0.1:5173/?zones=1&mobile=1';

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--window-size=1280,720',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

page.on('console', (msg) => {
  const t = msg.text();
  if (t.startsWith('[diag]')) console.log(t);
});

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

// Tap to start from menu
await page.waitForSelector('canvas', { timeout: 15000 });
await page.click('canvas');
await new Promise((r) => setTimeout(r, 300));

const result = await page.evaluate(() => {
  const game = globalThis.__PHASER_GAME__;
  if (!game) {
    return { error: 'Set window.__PHASER_GAME__ in main.ts to run this diagnostic' };
  }

  const scene = game.scene.getScene('GameScene');
  if (!scene?.player) return { error: 'GameScene not active', scenes: game.scene.getScenes(true).map((s) => s.scene.key) };

  const player = scene.player;
  const body = player.body;
  const platforms = scene.platforms?.getChildren?.() ?? [];

  const platformData = platforms.slice(0, 12).map((p) => {
    const b = p.body;
    return {
      name: p.getData('platformName'),
      spriteY: Math.round(p.y),
      top: Math.round(b.top),
      bottom: Math.round(b.bottom),
      h: Math.round(b.height),
    };
  });

  const layout = game.cache.json.get('level-1-layout-mobile');
  const zones = (layout?.platforms ?? []).slice(0, 8).map((z) => ({
    name: z.name,
    y: z.y,
    h: z.height,
    bottom: z.y + z.height,
  }));

  const overlappingPlatforms = platforms
    .filter((p) => {
      const b = p.body;
      const pb = player.body;
      return !(
        pb.right < b.left ||
        pb.left > b.right ||
        pb.bottom < b.top ||
        pb.top > b.bottom
      );
    })
    .map((p) => ({
      name: p.getData('platformName'),
      top: Math.round(p.body.top),
      bottom: Math.round(p.body.bottom),
    }));

  return {
    layoutKey: game.cache.json.has('level-1-layout-mobile') ? 'mobile' : 'unknown',
    platformCount: platforms.length,
    overlappingPlatforms,
    player: {
      y: Math.round(player.y),
      displayH: Math.round(player.displayHeight),
      scaleY: player.scaleY,
      originY: player.originY,
      bodyTop: Math.round(body.top),
      bodyBottom: Math.round(body.bottom),
      bodyH: Math.round(body.height),
      bodyW: Math.round(body.width),
      bodyOffsetY: body.offset.y,
      frameH: player.frame.height,
      onFloor: body.blocked.down || body.touching.down,
      vy: Math.round(body.velocity.y),
      feetGap: Math.round(player.y - body.bottom),
    },
    spawn: layout?.markers?.player_spawn,
    zones,
    platformData,
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
