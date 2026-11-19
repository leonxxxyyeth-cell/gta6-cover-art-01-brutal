// Takes the entry's screenshots: serves app/ on a local port, opens each
// scene from shots.json in headless Chromium and saves a JPEG (quality 80).
// Usage: node scripts/shots.mjs [port]
// Playwright comes from the shared node_modules; Chromium from the cache.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire('/home/hatch/workspace/octra/sesi-permanen/node_modules/playwright-core/package.json');
const { chromium } = require('playwright-core');

const root = new URL('..', import.meta.url).pathname;
const shots = JSON.parse(readFileSync(`${root}shots.json`, 'utf8'));
const port = Number(process.argv[2] ?? 8901);

const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve) => {
  server.stdout.on('data', (d) => { if (String(d).includes('app/ is on')) resolve(); });
  setTimeout(resolve, 8000);
});

const browser = await chromium.launch({
  executablePath: '/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
    await page.goto(`http://127.0.0.1:${port}/${shot.query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${root}screenshots/${shot.name}`, type: 'jpeg', quality: 80 });
    console.log('saved', shot.name, `${shot.w}x${shot.h}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log('done');
