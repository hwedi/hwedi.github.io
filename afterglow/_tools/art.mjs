// Draws the site's pixel art and saves it as real GIF files in ../images (first frames of the animated ones go to ../images/still).
// You only need this when a picture changes. The website itself never runs it.
//
//   cd afterglow/_tools && npm install       (once)
//   node art.mjs                             draw everything
//   node art.mjs b_crt,new                   draw only these
//
// The drawings are code: art-ui.js, art-buttons.js, art-pictures.js, art-ring.js (helpers in artlib.js).
// Each entry is ART.name = () => canvas, or { frames: [...], delay } for an animation. The file name is the entry name.
// A contact sheet of what was drawn lands in out/sheet.png so you can look at it.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url); const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const here = path.dirname(fileURLToPath(import.meta.url)), images = path.join(here, '..', 'images');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const chrome = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

// exact-palette GIF encoder (pixel art has few colours, so nothing gets dithered or shifted)
function encodeGif(frames, w, h, delays, maxColors) {
  const map = new Map(); let transparent = false, over = false;
  for (const f of frames) { for (let i = 0; i < f.length; i += 4) { if (f[i + 3] < 128) { transparent = true; continue; } const k = (f[i] << 16) | (f[i + 1] << 8) | f[i + 2]; if (!map.has(k)) { map.set(k, map.size); if (map.size > 255) { over = true; break; } } } if (over) break; }
  let palette, idxs, tIndex = -1;
  if (!over && !maxColors) {
    palette = [...map.keys()].map(k => [k >> 16 & 255, k >> 8 & 255, k & 255]);
    if (transparent) { tIndex = palette.length; palette.push([0, 0, 0]); }
    while (palette.length < 2) palette.push([0, 0, 0]);
    idxs = frames.map(f => { const o = new Uint8Array(w * h); for (let i = 0, p = 0; i < f.length; i += 4, p++) o[p] = f[i + 3] < 128 ? tIndex : map.get((f[i] << 16) | (f[i + 1] << 8) | f[i + 2]); return o; });
  } else {
    const all = new Uint8Array(frames.reduce((n, f) => n + f.length, 0)); let o = 0; for (const f of frames) { all.set(f, o); o += f.length; }
    palette = quantize(all, maxColors || 256, { format: 'rgb565' }); idxs = frames.map(f => applyPalette(f, palette, 'rgb565'));
  }
  const gif = GIFEncoder();
  idxs.forEach((ix, i) => gif.writeFrame(ix, w, h, { palette: i === 0 ? palette : undefined, delay: delays[i] || 0, transparent: tIndex >= 0, transparentIndex: tIndex >= 0 ? tIndex : 0, dispose: tIndex >= 0 ? 2 : 1, repeat: frames.length > 1 ? 0 : -1 }));
  gif.finish(); return { buf: Buffer.from(gif.bytes()), colors: palette.length };
}

const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto('file://' + path.join(here, 'art.html'));
const res = await page.evaluate((only) => window.renderAll(only), only);
fs.mkdirSync(path.join(images, 'still'), { recursive: true }); fs.mkdirSync(path.join(here, 'out'), { recursive: true });
const drawn = [];
for (const [name, a] of Object.entries(res)) {
  if (a.error) { console.log('ERROR in', name, '\n', a.error); process.exitCode = 1; continue; }
  let file, info = '', bytes;
  if (a.kind === 'gif') {
    const frames = a.frames.map(s => new Uint8Array(Buffer.from(s, 'base64'))); const { buf, colors } = encodeGif(frames, a.w, a.h, a.delay, a.colors);
    file = name + '.gif'; bytes = buf; info = `${frames.length} frame${frames.length > 1 ? 's' : ''}, ${colors} colours`;
    if (frames.length > 1) fs.writeFileSync(path.join(images, 'still', file), encodeGif([frames[0]], a.w, a.h, [0], a.colors).buf);
  } else { file = name + '.' + a.kind; bytes = Buffer.from(a.url.slice(a.url.indexOf(',') + 1), 'base64'); }
  fs.writeFileSync(path.join(images, file), bytes); drawn.push({ name, file, w: a.w, h: a.h });
  console.log(file.padEnd(22), `${a.w}x${a.h}`.padEnd(9), info.padEnd(22), (bytes.length / 1024).toFixed(1) + 'k');
}
console.log(`\ndrew ${drawn.length} pictures into images/`);
// contact sheet, 3x, on a checkerboard so transparency shows
const z = 3;
await page.setContent(`<body style="margin:0;background:#101028;color:#fff;font:11px monospace"><div style="display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-items:flex-end">` +
  drawn.map(d => `<div><img src="file://${path.join(images, d.file)}" width="${d.w * z}" height="${d.h * z}" style="image-rendering:pixelated;display:block;background:repeating-conic-gradient(#222 0 25%,#333 0 50%) 0 0/16px 16px"><div>${d.file} ${d.w}x${d.h}</div></div>`).join('') + `</div>`);
await page.waitForTimeout(300); await page.screenshot({ path: path.join(here, 'out', 'sheet.png'), fullPage: true });
console.log('contact sheet: _tools/out/sheet.png');
await browser.close();
