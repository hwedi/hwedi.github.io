// Takes pictures of the site so you can look at your work before you ship it.
//
//   cd afterglow/_tools && npm install       (once)
//   node shot.mjs                            desktop + phone, dark + light  ->  out/*.png
//   node shot.mjs tube                       the same, on one page (home, about, tube, test, journal, links, stuff, guest, kero, campaign)
//   node shot.mjs --og                       remakes ../images/og.jpg, the picture shown when the link is shared (1200 x 630)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright'; import { serve } from './serve.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, 'out');
const args = process.argv.slice(2), og = args.includes('--og'), pageName = (args.find(a => !a.startsWith('--')) || 'home').replace(/[^a-z0-9]/gi, '') || 'home';   // letters and digits only: it becomes part of a file name
const chrome = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const web = await serve(), browser = await chromium.launch({ executablePath: chrome });
async function shot(file, { w, h, dpr = 1, scheme = 'dark', touch = false, jpeg = false }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: scheme, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[page error]', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('[console error]', m.text()); });
  // a new visitor's tube arrives a little magnetised (a pink corner, top right). The pictures start with a clean tube so the page is easy to judge.
  await page.addInitScript(() => { try { localStorage.setItem('afterglow.mag', '[]'); } catch (e) { /* fine */ } });
  await page.goto(web.url + '#' + pageName); await page.waitForTimeout(2600);   // let the tube warm up
  await page.screenshot(jpeg ? { path: file, type: 'jpeg', quality: 88 } : { path: file }); await ctx.close(); console.log('saved', path.relative(process.cwd(), file));
}
if (og) await shot(path.join(here, '..', 'images', 'og.jpg'), { w: 1200, h: 630, jpeg: true });
else {
  fs.mkdirSync(out, { recursive: true });
  await shot(path.join(out, `desktop-dark-${pageName}.png`), { w: 1440, h: 900 });
  await shot(path.join(out, `desktop-light-${pageName}.png`), { w: 1440, h: 900, scheme: 'light' });
  await shot(path.join(out, `phone-dark-${pageName}.png`), { w: 390, h: 844, dpr: 2, touch: true });
  await shot(path.join(out, `phone-light-${pageName}.png`), { w: 390, h: 844, dpr: 2, touch: true, scheme: 'light' });
}
await browser.close(); await web.close();
