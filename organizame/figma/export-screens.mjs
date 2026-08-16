#!/usr/bin/env node
/**
 * Export Organízame screen PNGs for manual Figma import.
 * Requires dev server at http://127.0.0.1:5174
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'exports');
const BASE = process.env.ORGANIZAME_URL ?? 'http://127.0.0.1:5174';

const screens = [
  { name: '01-today', tab: 'today' },
  { name: '02-organizame', tab: 'organizame' },
  { name: '03-week', tab: 'week' },
  { name: '04-inbox', tab: 'inbox' },
  { name: '05-modes', tab: 'modes' },
];

async function clickTab(page, tab) {
  const nav = page.locator('nav').first();
  const tabButtons = {
    today: nav.getByRole('button', { name: /Today/i }),
    organizame: nav.getByRole('button', { name: /Organízame/i }),
    week: nav.getByRole('button', { name: /Week/i }),
    inbox: nav.getByRole('button', { name: /Inbox/i }),
    modes: nav.getByRole('button', { name: /Modes/i }),
  };
  await tabButtons[tab].click();
  await page.waitForTimeout(600);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });

  for (const { name, tab } of screens) {
    await clickTab(page, tab);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    console.log('Exported', name);
  }

  // Organízame with example list filled
  await clickTab(page, 'organizame');
  await page.getByRole('button', { name: /Try example list/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '06-organizame-parsed.png'), fullPage: true });

  // Settings overlay
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '07-settings.png'), fullPage: false });

  // Andsiosa quick menu
  await page.getByRole('button', { name: 'Settings' }).click().catch(() => {});
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Andsiosa quick actions/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '08-andsiosa-menu.png'), fullPage: false });

  await browser.close();
  console.log('Done →', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
