// Renders the laptop scene frame by frame, putting each captured screen frame on the laptop display.
// Usage: node render-scene.js <sceneUrl> <screenFramesUrl> <outDir> [onlyFrames e.g. "0,200,440"]
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW || 'playwright');

const [, , scene, frames, out = 'frames/final', only] = process.argv;
const FPS = 30, TOTAL = 15;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto(scene, { waitUntil: 'load' });
  const list = only ? only.split(',').map(Number) : [...Array(TOTAL * FPS).keys()];
  for (const f of list) {
    const src = `${frames}/f${String(f).padStart(4, '0')}.jpg`;
    await page.evaluate(([t, total, src]) => window.setFrame(t, total, src), [f / FPS, TOTAL, src]);
    await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.png`) });
    if (f % 60 === 0) console.log('frame', f);
  }
  await browser.close();
})();
