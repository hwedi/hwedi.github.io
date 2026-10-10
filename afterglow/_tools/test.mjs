// Clicks through the site in a headless browser and checks the things that are easy to break.
// It starts its own little web server (serve.mjs) and leaves nothing behind.
//
//   cd afterglow/_tools && npm install       (once)
//   node test.mjs                            prints FAIL lines, then "N passed, M failed"
//
// Add a check when you add a feature. Two helpers do most of the work:
//   q(page, js)          runs js in the page and gives back the answer (never throws: a broken page is a FAIL line, not a crash)
//   until(page, js)      waits up to 5 seconds for js to become true. Use it for anything that takes a moment, never a fixed sleep.
// Each numbered part runs inside part(): if a click cannot happen because something earlier broke, that part stops with one FAIL line and the rest still run.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright'; import { serve } from './serve.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), site = path.join(here, '..');
const chrome = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const errs = [], outside = []; let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond === true) pass++; else { fail++; console.log('FAIL:', name, extra === undefined ? '' : extra); } };
const opened = [];
async function part(name, fn) { try { await fn(); } catch (e) { fail++; console.log('FAIL:', name, 'stopped early:', String(e && e.message).split('\n')[0]); } finally { for (const c of opened.splice(0)) await c.close().catch(() => {}); } }

// 1. every file the pages point at exists
{
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8'), missing = [];
  const need = (rel, from) => { const f = path.join(from, rel.split(/[?#]/)[0]); if (!fs.existsSync(f)) missing.push(path.relative(site, f)); };
  for (const m of html.matchAll(/<(?:img|script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) if (!/^(?:[a-z]+:|#|\/\/)/i.test(m[1])) need(m[1], site);
  for (const css of fs.readdirSync(path.join(site, 'css'))) for (const m of fs.readFileSync(path.join(site, 'css', css), 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) if (!/^(?:data:|#|%23)/.test(m[1])) need(m[1], path.join(site, 'css'));
  for (const m of html.matchAll(/data-a="([a-z0-9_]+)"/g)) need(`images/still/${m[1]}.gif`, site);
  ok('every linked file exists', missing.length === 0, [...new Set(missing)].join(', '));
  ok('the share picture and the tab icon exist', fs.existsSync(path.join(site, 'images', 'og.jpg')) && fs.existsSync(path.join(site, 'images', 'favicon.png')));
}

const web = await serve(), index = web.url;
const launch = (extra = []) => chromium.launch({ executablePath: chrome, args: ['--autoplay-policy=no-user-gesture-required', ...extra] });
const browser = await launch();
// app.js bends the picture only in Chrome-family browsers (the line that starts "const blink ="). Switching that line off shows what Safari and Firefox get.
const appJS = fs.readFileSync(path.join(site, 'js', 'app.js'), 'utf8'), blinkLine = /const blink = [^;\n]+;/;
const plainJS = appJS.replace(blinkLine, 'const blink = false;');
ok('test can find the "const blink =" line in js/app.js', (appJS.match(new RegExp(blinkLine, 'g')) || []).length === 1);

async function open(opts = {}, hash = '') {
  const ctx = await (opts.browser || browser).newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: 1, hasTouch: !!opts.touch, isMobile: !!opts.touch, reducedMotion: opts.calm ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); opened.push(ctx); page.setDefaultTimeout(8000);
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('request', r => { const u = r.url(); if (!u.startsWith(index) && !/^(data|blob|about):/.test(u)) outside.push(u); });   // the site must not fetch anything from anywhere else
  if (opts.plain) await page.route('**/js/app.js', route => route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: plainJS }));   // the same script, told it is not running in Chrome
  if (opts.saved) await page.addInitScript((saved) => { for (const k in saved) localStorage.setItem('afterglow.' + k, saved[k]); }, opts.saved);   // start with this in the visitor's saved state
  await page.goto(index + hash); await page.waitForTimeout(2300); return { ctx, page };
}
const q = async (page, js) => { try { return await page.evaluate(js); } catch (e) { return 'page threw: ' + e.message.split('\n')[0]; } };
const until = async (page, js, ms = 5000) => { try { await page.waitForFunction(js, null, { timeout: ms, polling: 100 }); return true; } catch (e) { return false; } };
const mag = `(JSON.parse(localStorage.getItem('afterglow.mag') || 'null') || { length: -1 }).length`;   // how many stains the magnet has left (-1: nothing saved yet)

await part('desktop', async () => { // 2. desktop: pointer, menu, poll, guestbook, free stuff, test patterns, dead links, the moth, saved state
  const { ctx, page } = await open();
  ok('starts on home, and the address stays plain', await q(page, `!document.querySelector('#pg-home').hidden && document.querySelector('#page').dataset.site === 'main' && location.hash === ''`));
  ok('the bend is on (Chromium)', await q(page, `document.querySelector('#crt-fx').children.length > 3 && document.querySelector('#raster').style.filter.includes('crt-fx')`));
  ok('images loaded', await q(page, `[...document.images].every(i => i.complete && i.naturalWidth > 0)`), await q(page, `[...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')).join(', ')`));
  ok('fonts loaded', await q(page, `['Silkscreen', 'Michroma'].every(f => [...document.fonts].some(x => x.family.replace(/"/g, '') === f && x.status === 'loaded'))`), await q(page, `[...document.fonts].map(x => x.family + ' ' + x.status).join(', ')`));
  ok('the snow layer has its picture (STATIC setting)', await q(page, `getComputedStyle(document.querySelector('.ov-noise'), '::before').backgroundImage.startsWith('url("data:image/png')`));
  const lk = await (await page.$('#pg-home a[href="#tube"]')).boundingBox(); await page.mouse.move(lk.x + 8, lk.y + 6); await page.waitForTimeout(150);
  const c2 = await q(page, `document.querySelector('#cur').className`); await page.mouse.move(lk.x + 8, lk.y - 60); await page.waitForTimeout(150); const c1 = await q(page, `document.querySelector('#cur').className`);
  ok('pointer: hand over a link, I-beam over text', c2.includes('c-hand') && c1.includes('c-ibeam'), c2 + ' | ' + c1);
  await page.mouse.move(700, 880); await page.waitForTimeout(100); ok('pointer hides on the bezel', await q(page, `!document.querySelector('#tube').classList.contains('has-cur')`));
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  ok('keyboard: the first Tab stop skips to the MENU button', await q(page, `document.activeElement.id === 'k-menu'`), await q(page, `document.activeElement.id || document.activeElement.tagName`));
  await page.click('#k-menu'); await page.waitForTimeout(200);
  ok('menu opens and takes focus', await q(page, `!document.querySelector('#osd').hidden && document.activeElement.classList.contains('osd-row')`));
  const bb = await (await page.$('.osd-row[data-k="contrast"] .bar')).boundingBox();
  await page.mouse.move(bb.x + bb.width * .25, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(bb.x + bb.width * .5, bb.y + bb.height / 2, { steps: 4 }); await page.mouse.up();
  const cv = +(await q(page, `document.querySelector('.osd-row[data-k="contrast"]').getAttribute('aria-valuenow')`)); ok('menu bar drags', cv >= 42 && cv <= 58, 'got ' + cv);
  await page.click('.osd-tab[data-tab="TUBE"]'); await page.waitForTimeout(100); await page.click('.osd-row[data-k="mask"] .arw[data-d="1"]'); await page.waitForTimeout(150);
  ok('menu choice cycles', await q(page, `document.querySelector('.osd-row[data-k="mask"] .ev').textContent === 'SLOT MASK'`));
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowLeft');
  ok('menu arrow keys', await q(page, `document.activeElement.dataset.k === 'maskv' && document.activeElement.getAttribute('aria-valuenow') === '50'`));
  await page.click('.osd-tab[data-tab="SETUP"]'); await page.click('.osd-row[data-a="recall"]');
  ok('recall restores factory settings', await until(page, `(() => { const s = JSON.parse(localStorage.getItem('afterglow.crt') || '{}'); return s.contrast === 70 && s.mask === 0; })()`));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok('Esc closes the menu, focus back on MENU', await q(page, `document.querySelector('#osd').hidden && document.activeElement.id === 'k-menu'`));
  await page.click('#poll-1'); await page.click('#poll-vote'); await page.waitForTimeout(100);
  ok('poll shows results', await q(page, `!document.querySelector('#poll-res').hidden && document.querySelector('#poll-res').textContent.includes('218')`));
  await page.click('#nav a[href="#guest"]'); await page.waitForTimeout(500);
  await page.click('#gb-sign'); ok('guestbook asks for a name', await q(page, `document.querySelector('#gb-note').textContent.includes('forgot your name')`));
  await page.fill('#gb-name', 'test <b>visitor</b>'); await page.fill('#gb-from', 'a headless browser'); await page.fill('#gb-msg', 'hello & <script>alert(1)</script>\nsecond line'); await page.click('#gb-m4'); await page.click('#gb-sign'); await page.waitForTimeout(200);
  ok('guestbook entry shows, and is plain text', await q(page, `document.querySelectorAll('#gb-mine .entry').length === 1 && !document.querySelector('#gb-mine script') && document.querySelector('#gb-mine b').textContent.includes('<b>visitor</b>') && !!document.querySelector('#gb-mine .sm-cool')`));
  await page.click('#nav a[href="#stuff"]'); await page.waitForTimeout(500);
  await page.click('#tiles [data-tile="t_grid"]');
  ok('background try-on', await q(page, `document.querySelector('#page').dataset.tile === 't_grid' && getComputedStyle(document.querySelector('#page')).backgroundImage.includes('t_grid.gif') && document.querySelector('#tiles [data-tile="t_grid"]').getAttribute('aria-pressed') === 'true'`), await q(page, `getComputedStyle(document.querySelector('#page')).backgroundImage`));
  await page.click('#grab img[data-file="blinkie_crt.gif"]'); ok('click a graphic to get its code', await q(page, `document.querySelector('#code-grab').value.includes('blinkie_crt.gif') && document.querySelector('#code-grab').value.includes('width="150"')`));
  await page.goBack(); ok('Back returns to the page before (guestbook)', await until(page, `!document.querySelector('#pg-guest').hidden && location.hash === '#guest'`), await q(page, `location.hash`));
  await page.goBack(); ok('Back again returns to home with a plain address', await until(page, `!document.querySelector('#pg-home').hidden && location.hash === ''`), await q(page, `location.hash`));
  await page.goForward(); ok('Forward works too', await until(page, `!document.querySelector('#pg-guest').hidden`));
  await page.click('#nav a[href="#test"]'); await page.waitForTimeout(500);
  await page.focus('[data-pat="pure"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok('test pattern opens', await q(page, `!document.querySelector('#pattern').hidden && document.activeElement.id === 'pattern'`));
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  ok('purity pattern cycles to white', await q(page, `document.querySelector('#pattern .cap').textContent.includes('WHITE')`));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('test pattern closes, focus returns', await q(page, `document.querySelector('#pattern').hidden && getComputedStyle(document.querySelector('#pattern')).display === 'none' && document.activeElement.dataset.pat === 'pure'`));
  await page.keyboard.press('Enter'); await page.waitForTimeout(200); await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('Esc closes a test pattern even after the focus moved off it', await q(page, `document.querySelector('#pattern').hidden`));
  await page.focus('[data-pat="grid"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(200); await page.focus('#k-power'); await page.keyboard.press('Enter');
  ok('power off with a pattern open: off, pattern gone, focus stays on the power button', await until(page, `document.querySelector('#tube').classList.contains('is-off') && document.querySelector('#pattern').hidden && document.activeElement.id === 'k-power'`), await q(page, `document.activeElement.id || document.activeElement.tagName`));
  await page.keyboard.press('Enter'); ok('and the same key switches it back on', await until(page, `!document.querySelector('#tube').classList.contains('is-off') && !document.querySelector('#tube').classList.contains('pw-on')`));
  await page.click('#nav a[href="#links"]'); await page.waitForTimeout(400); await page.click('a[data-dead*="copper"]:visible'); await page.waitForTimeout(400);
  ok('dead links land on the 404 page', await q(page, `!document.querySelector('#pg-404').hidden && document.querySelector('#dead-url').textContent === '/mods/' && document.querySelector('#dead-host').textContent === 'www.copper.example'`));
  await page.click('#nav a[href="#home"]'); await page.waitForTimeout(300); await page.click('#moth-btn'); ok('the moth can be shooed', await q(page, `document.querySelector('#moth').hidden && document.querySelector('#moth-btn').textContent === 'call him back'`));
  await page.click('#mus-play'); ok('music plays', await until(page, `document.querySelector('#mus-play').textContent === 'stop' && [...document.querySelectorAll('#eq i')].some(b => parseInt(b.style.height) > 2)`));
  await page.click('#mus-next'); ok('next tune', await q(page, `document.querySelector('#trk').textContent.includes('moth_waltz.mid') && document.querySelector('#mus-play').textContent === 'stop'`)); await page.click('#mus-play');
  await page.click('#k-power'); ok('power off', await until(page, `document.querySelector('#tube').classList.contains('is-off') && !document.querySelector('#wake').hidden`));
  await page.click('#wake'); ok('power on', await until(page, `!document.querySelector('#tube').classList.contains('is-off') && document.querySelector('#crt-fx').children.length > 3`));
  await page.click('#k-menu'); await page.click('.osd-tab[data-tab="SETUP"]'); await page.click('.osd-row[data-k="lcd"]'); await page.keyboard.press('Escape'); await page.click('#k-degauss');
  ok('LCD mode: degauss says there is nothing to do', await until(page, `document.querySelector('#tube').classList.contains('flat') && !document.querySelector('#toast').hidden && document.querySelector('#toast').textContent.includes('NOTHING TO DEGAUSS')`));
  await page.click('#k-menu'); await page.click('.osd-tab[data-tab="SETUP"]'); await page.click('.osd-row[data-a="recall"]'); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.reload(); await page.waitForTimeout(2000);
  ok('poll, guestbook, background and counter survive a reload', await q(page, `!document.querySelector('#poll-res').hidden && document.querySelectorAll('#gb-mine .entry').length === 1 && document.querySelector('#page').dataset.tile === 't_grid' && document.querySelector('#ctr').getAttribute('aria-label') === '048214'`));
});
await part('addresses', async () => { // 3. addresses that point at one page, and addresses that point at nothing
  const a = await open({}, '#tube'); ok('address #tube', await q(a.page, `!document.querySelector('#pg-tube').hidden && document.querySelector('#nav a.here').getAttribute('href') === '#tube'`)); await a.ctx.close();
  const b = await open({}, '#kero'); ok('address #kero', await q(b.page, `!document.querySelector('#site-kero').hidden && document.querySelector('#page').dataset.site === 'kero' && getComputedStyle(document.querySelector('#page')).backgroundImage.includes('t_pond.gif')`));
  await b.page.click('#frogs button:nth-child(2)'); ok('frogs ribbit', await q(b.page, `document.querySelector('#ribbits').textContent === '1'`)); await b.ctx.close();
  for (const h of ['#nope', '#constructor', '#__proto__', '#toString']) { const c = await open({}, h); ok('unknown address ' + h + ' shows home', await q(c.page, `!document.querySelector('#site-main').hidden && !document.querySelector('#pg-home').hidden && location.hash === '#home'`), await q(c.page, `location.hash`)); await c.ctx.close(); }
});
await part('phone', async () => { // 4. phone: nothing scrolls sideways, the magnet stains, degauss cleans
  const { ctx, page } = await open({ w: 390, h: 844, touch: true });
  ok('phone: page fits', await q(page, `document.documentElement.scrollWidth <= 390 && document.querySelector('#scroller').scrollWidth <= document.querySelector('#scroller').clientWidth`));
  await page.tap('#nav a[href="#about"]'); await page.waitForTimeout(500); ok('phone: nav works, no drawn pointer', await q(page, `!document.querySelector('#pg-about').hidden && !document.querySelector('#tube').classList.contains('has-cur')`));
  for (const id of ['tube', 'test', 'journal', 'links', 'stuff', 'guest', 'kero', 'campaign']) { await q(page, `location.hash = '#${id}'`); await page.waitForTimeout(350); const w = await q(page, `document.querySelector('#scroller').scrollWidth - document.querySelector('#scroller').clientWidth`); ok('phone: no sideways scroll on ' + id, w <= 0, 'overflow ' + w); }
  await q(page, `location.hash = '#guest'`); await page.waitForTimeout(350);
  await page.fill('#gb-name', 'W'.repeat(32)); await page.fill('#gb-from', 'M'.repeat(40)); await page.fill('#gb-msg', 'x'.repeat(300)); await page.tap('#gb-sign'); await page.waitForTimeout(300);
  ok('phone: a long name with no spaces wraps', await q(page, `document.querySelectorAll('#gb-mine .entry').length === 1 && document.querySelector('#scroller').scrollWidth <= document.querySelector('#scroller').clientWidth`), await q(page, `document.querySelector('#scroller').scrollWidth - document.querySelector('#scroller').clientWidth`));
  ok('phone: text boxes have letters big enough that phones do not zoom in', await q(page, `parseFloat(getComputedStyle(document.querySelector('#gb-name')).fontSize) >= 16`), await q(page, `getComputedStyle(document.querySelector('#gb-name')).fontSize`));
  await page.tap('#magnet'); ok('phone: tapping the magnet waves it', await until(page, `document.querySelector('#magnet').classList.contains('held')`));
  ok('the magnet leaves stains', await until(page, mag + ' >= 3', 8000), await q(page, mag));
  await until(page, `!document.querySelector('#magnet').classList.contains('held')`, 6000); await page.tap('#k-degauss'); ok('degauss clears them', await until(page, mag + ' === 0', 8000), await q(page, mag));
});
await part('reduced motion', async () => { // 5. reduced motion: animated GIFs hold still, also when the setting changes while the page is open
  const { ctx, page } = await open({ calm: true });
  const stills = `[...document.querySelectorAll('img[data-a]')].every(i => i.getAttribute('src').startsWith('images/still/') && i.naturalWidth > 0) && getComputedStyle(document.querySelector('#page')).backgroundImage.includes('still/bg_stars.gif')`;
  ok('reduced motion: stills are used', await q(page, stills)); await ctx.close();
  const b = await open(); await b.page.emulateMedia({ reducedMotion: 'reduce' });
  ok('reduced motion switched on while the page is open: stills, and the moth sits', await until(b.page, stills + ` && document.querySelector('#moth').className === 'moth f3'`));
  await b.page.emulateMedia({ reducedMotion: 'no-preference' });
  ok('and switched off again: the GIFs move again', await until(b.page, `[...document.querySelectorAll('img[data-a]')].every(i => !i.getAttribute('src').includes('/still/'))`));
});
await part('other browsers', async () => { // 6. Safari and Firefox get flat glass (no bend). This is Chrome pretending; the real ones are not installed here.
  const { ctx, page } = await open({ plain: true });
  ok('other browsers: no bend filter, bowed glass instead', await q(page, `document.querySelector('#crt-fx').children.length === 0 && !document.querySelector('#raster').style.filter.includes('crt-fx') && document.querySelector('#tube').classList.contains('bow')`));
  await page.click('#nav a[href="#tube"]'); await page.waitForTimeout(500); ok('other browsers: the page still works', await q(page, `!document.querySelector('#pg-tube').hidden`));
  await page.click('#k-degauss'); ok('other browsers: degauss runs', await until(page, mag + ' === 0', 8000), await q(page, mag));
  await page.click('#k-menu'); await page.click('.osd-tab[data-tab="TUBE"]'); await page.focus('.osd-row[data-k="curve"]'); for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  ok('other browsers: CURVATURE can be tried', await until(page, `document.querySelector('#crt-fx').children.length > 0`)); await page.waitForTimeout(500); await page.reload(); await page.waitForTimeout(2000);
  ok('other browsers: but it is not remembered, so a reload always gives flat glass back', await q(page, `document.querySelector('#crt-fx').children.length === 0 && document.querySelector('#tube').classList.contains('bow')`));
});
await part('damaged saves', async () => { // 7. a damaged or out-of-date save must never break the page. If you change what gets saved, old saves are still out there.
  const junk = '"><img src=x onerror="window.__bad=1">', odd = '{"toString":1,"valueOf":2}';   // odd: an object that cannot be turned into a number or a string
  const saves = {
    'nonsense in every key': { crt: JSON.stringify({ bright: 'abc', curve: null, mask: 99, phosphor: -5, lcd: 'yes', extra: junk }), mag: JSON.stringify([null, 5, 'x', { x: 'a' }, { x: .5, y: .5, a: 'big', h: junk }]),
      gb: JSON.stringify([null, 5, 'text', { n: { a: 1 } }, { n: junk, f: junk, m: junk, mood: junk, d: junk, r: junk }]), tile: JSON.stringify(junk), hits: JSON.stringify(junk), poll: JSON.stringify(junk), eco: '{}', lite: '[]', moth: '[]', ribbits: JSON.stringify(junk), pet: '{bad' },
    'every setting far out of range': { crt: JSON.stringify(Object.fromEntries(['bright', 'contrast', 'focus', 'temp', 'phosphor', 'hsize', 'vsize', 'hpos', 'vpos', 'tilt', 'trap', 'para', 'vhold', 'curve', 'conv', 'mask', 'maskv', 'scan', 'glow', 'noise', 'flick', 'sound', 'lcd'].map((k, i) => [k, i % 2 ? 1e9 : -1e9]))),
      mag: JSON.stringify(Array.from({ length: 3000 }, (_, i) => ({ x: i, y: -i, a: 99, h: i }))), hits: '1e300' },
    'objects where numbers and words belong': { eco: odd, lite: odd, hits: odd, ribbits: odd, poll: odd, moth: odd, pet: odd, tile: odd, crt: `{"bright":${odd},"curve":${odd}}`, mag: `[{"x":${odd},"y":0,"a":1,"h":1}]`,
      gb: `[{"n":${odd},"f":${odd},"m":${odd},"mood":${odd},"d":${odd},"r":${odd}},{"n":"ok","m":"ok","mood":"x y","r":-7}]` },
  };
  for (const [name, saved] of Object.entries(saves)) {
    const before = errs.length, { ctx, page } = await open({ saved });
    let works = false; try { await page.click('#nav a[href="#guest"]', { timeout: 4000 }); await page.waitForTimeout(300); await page.click('#k-menu', { timeout: 4000 }); await page.waitForTimeout(200);
      works = await q(page, `!document.querySelector('#pg-guest').hidden && !document.querySelector('#osd').hidden && !window.__bad && !/NaN|Infinity/.test(document.querySelector('#raster').style.filter) && document.querySelector('#ctr').getAttribute('aria-label').length === 6 && document.querySelector('#now-time').textContent !== '--:--' && [...document.querySelectorAll('#gb-mine .sm')].every(i => /^sm sm-[a-z]+$/.test(i.className))`); } catch (e) { works = false; }
    ok('damaged save (' + name + '): the page still starts and works', works === true && errs.length === before, [works, ...errs.slice(before)].join(' | ')); await ctx.close();
  }
});
await part('eco mode', async () => { // 8. eco mode: remembered as "slow device, twice", the page must start plain and the menu must say so
  const { ctx, page } = await open({ saved: { eco: '2', lite: '2' } });
  ok('eco level 2: no bend, plain glass', await q(page, `document.querySelector('#crt-fx').children.length === 0 && document.querySelector('#tube').classList.contains('lite') && getComputedStyle(document.querySelector('.ov-mask')).display === 'none' && !document.querySelector('#raster').style.filter.includes('blur')`));
  await page.click('#k-menu'); ok('eco level 2: the menu shows it', await q(page, `document.querySelector('.osd-foot').textContent.includes('ECO+')`));
  await page.click('.osd-tab[data-tab="SETUP"]'); await page.click('.osd-row[data-a="recall"]');
  ok('RECALL switches eco mode off again', await until(page, `document.querySelector('#crt-fx').children.length > 3 && !document.querySelector('#tube').classList.contains('lite') && localStorage.getItem('afterglow.eco') === '0' && localStorage.getItem('afterglow.lite') === '0'`));
});
for (const w of [620, 700, 911, 1024, 1920]) await part('width ' + w, async () => { // 9. the layout fits at awkward widths
  const { ctx, page } = await open({ w, h: 800 }); const o = JSON.parse(await q(page, `JSON.stringify({ cls: document.querySelector('#page').className, over: document.querySelector('#scroller').scrollWidth - document.querySelector('#scroller').clientWidth, tb: Math.round(document.querySelector('table.shell').getBoundingClientRect().width), sc: document.querySelector('#scroller').clientWidth })`));
  ok('width ' + w + ' fits (' + o.cls + ')', o.over <= 0 && o.tb <= o.sc, JSON.stringify(o));
});
await part('short screen', async () => { // 10. a phone on its side: the whole monitor, buttons included, is still on screen
  const { ctx, page } = await open({ w: 640, h: 300, touch: true });
  ok('short screen: the MENU button is fully visible', await q(page, `(() => { const r = document.querySelector('#k-menu').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && document.documentElement.scrollHeight <= innerHeight; })()`), await q(page, `JSON.stringify(document.querySelector('#k-menu').getBoundingClientRect())`));
  await page.tap('#k-menu'); await page.waitForTimeout(200);
  ok('short screen: the menu fits on the glass', await q(page, `(() => { const o = document.querySelector('#osd').getBoundingClientRect(), t = document.querySelector('#tube').getBoundingClientRect(); return o.top >= t.top - 1 && o.bottom <= t.bottom + 1 && o.left >= t.left - 1 && o.right <= t.right + 1; })()`));
});
await part('older browsers', async () => { // 11. older browsers (Safari before 26.4, Chrome before 128) measure things inside a css-zoomed box differently. The menu slider must not care.
  const old = await launch(['--disable-blink-features=StandardizedBrowserZoom']); try { const { page } = await open({ browser: old });
  await page.click('#k-menu'); await page.waitForTimeout(200); const bb = await (await page.$('.osd-row[data-k="contrast"] .bar')).boundingBox();
  await page.mouse.click(bb.x + bb.width * .25, bb.y + bb.height / 2); const v = +(await q(page, `document.querySelector('.osd-row[data-k="contrast"]').getAttribute('aria-valuenow')`));
  ok('older browsers: clicking a quarter of the way along a menu bar gives about 25', v >= 17 && v <= 33, 'got ' + v);
  } finally { opened.length = 0; await old.close(); }
});
ok('no errors or warnings in the browser console', errs.length === 0, [...new Set(errs)].slice(0, 5).join(' | '));
ok('nothing was loaded from another website', outside.length === 0, [...new Set(outside)].slice(0, 5).join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close(); await web.close(); process.exit(fail ? 1 : 0);
