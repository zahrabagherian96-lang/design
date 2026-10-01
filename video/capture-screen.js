// Records the site scrolling frame-by-frame on a virtual clock, so every
// GSAP / CSS animation is captured smoothly regardless of machine speed.
// Usage: node capture-screen.js <siteUrl> <outDir> [gsapDir]
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW || 'playwright');

const [, , url = 'http://localhost:8123/index.html', out = 'frames/screen', gsapDir] = process.argv;
const FPS = 30, W = 1440, H = 900;
const DURATION = 15; // seconds of screen footage

// scroll keyframes: [time s, fraction of max scroll] — eased between, with pauses
const KEYS = [[0, 0], [3.0, 0], [4.8, .14], [5.6, .14], [7.4, .32], [8.1, .32], [9.9, .52], [10.6, .52], [12.4, .74], [13.0, .74], [14.6, 1]];
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function scrollAt(t) {
  for (let i = 1; i < KEYS.length; i++) {
    const [t0, y0] = KEYS[i - 1], [t1, y1] = KEYS[i];
    if (t <= t1) return y0 + (y1 - y0) * ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
  }
  return KEYS[KEYS.length - 1][1];
}

const virtualClock = () => {
  let now = 0, id = 1;
  const t0 = Date.now(), timers = new Map(), rafs = new Map(), RealDate = Date;
  performance.now = () => now;
  Date.now = () => t0 + now;
  window.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [t0 + now])); } static now() { return t0 + now; } };
  window.setTimeout = (fn, d = 0, ...a) => { const i = id++; timers.set(i, { t: now + Math.max(0, +d || 0), fn, a }); return i; };
  window.setInterval = (fn, d = 0, ...a) => { const i = id++; timers.set(i, { t: now + Math.max(1, +d || 0), fn, a, every: Math.max(1, +d || 0) }); return i; };
  window.clearTimeout = window.clearInterval = i => timers.delete(i);
  window.requestAnimationFrame = fn => { const i = id++; rafs.set(i, fn); return i; };
  window.cancelAnimationFrame = i => rafs.delete(i);
  const syncCss = () => document.getAnimations().forEach(a => {
    if (a.__vt === undefined) { a.__vt = now; a.pause(); }
    a.currentTime = now - a.__vt;
  });
  window.__advance = ms => {
    const target = now + ms;
    for (;;) {
      let next = null;
      for (const [i, tm] of timers) if (tm.t <= target && (!next || tm.t < next[1].t)) next = [i, tm];
      if (!next) break;
      const [i, tm] = next; now = Math.max(now, tm.t);
      if (tm.every) tm.t += tm.every; else timers.delete(i);
      try { typeof tm.fn === 'function' ? tm.fn(...tm.a) : eval(tm.fn); } catch (e) { console.error(e); }
    }
    now = target;
    const cbs = [...rafs.values()]; rafs.clear();
    cbs.forEach(cb => { try { cb(now); } catch (e) { console.error(e); } });
    syncCss();
  };
};

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror', e.message));
  if (gsapDir) await page.route(/cdnjs\.cloudflare\.com\/.*gsap\/[\d.]+\/(.+\.js)$/, (r) => {
    const f = path.join(gsapDir, r.request().url().split('/').pop());
    r.fulfill({ path: f, contentType: 'application/javascript' });
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(virtualClock);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.fonts && document.fonts.ready; });
  await page.evaluate(() => document.fonts.ready);
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // only scroll through the main content, not the footer
  const endY = await page.evaluate(m => { const f = document.querySelector('footer, #layout-bottom'); return Math.min(m, f ? f.getBoundingClientRect().top + scrollY - innerHeight * .6 : m); }, maxY);
  console.log('maxY', maxY, 'endY', endY);

  const total = DURATION * FPS;
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    const y = Math.round(scrollAt(t) * endY);
    await page.evaluate(([y, dt]) => { if (scrollY !== y) scrollTo(0, y); window.__advance(dt); }, [y, f ? 1000 / FPS : 0]);
    await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93 });
    if (f % 60 === 0) console.log('frame', f, '/', total);
  }
  await browser.close();
})();
