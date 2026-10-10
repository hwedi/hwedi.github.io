// Tiny pixel-art toolkit, runs in Chromium at build time. Everything is drawn 1:1 in "2002 pixels".
const ART = {};            // name -> () => canvasCtx | {frames:[ctx], delay:ms|[ms], kind?:'gif'|'jpg', q?:number}
const P = {                // web-safe-ish palette used across the site
  k: '#000000', n0: '#000033', n1: '#000066', n2: '#003399', b: '#3366ff', b2: '#6699ff', lav: '#ccccff',
  cy: '#66ffff', cy2: '#33ccff', pk: '#ff3399', pk2: '#ff66cc', yl: '#ffff66', yl2: '#ffcc00', lm: '#99ff33',
  gr: '#66ff66', or: '#ff6600', pu: '#9933ff', pu2: '#6600cc', w: '#ffffff', rd: '#ff0033', si: '#c0c0c0',
};
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; return g; };
const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hex = (c) => { if (c[0] !== '#') { const t = mk(1, 1); t.fillStyle = c; t.fillRect(0, 0, 1, 1); const d = t.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; } const n = parseInt(c.slice(1), 16); return c.length === 4 ? [(n >> 8 & 15) * 17, (n >> 4 & 15) * 17, (n & 15) * 17] : [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const px = (g, x, y, c) => R(g, x, y, 1, 1, c);
const hl = (g, x, y, w, c) => R(g, x, y, w, 1, c), vl = (g, x, y, h, c) => R(g, x, y, 1, h, c);
// draw vector shapes without antialiasing: paint on a scratch canvas, threshold alpha, stamp in one flat colour
function crisp(g, color, fn, thr = 128) {
  const w = g.canvas.width, h = g.canvas.height, t = mk(w, h); t.fillStyle = '#fff'; t.strokeStyle = '#fff'; fn(t);
  const im = t.getImageData(0, 0, w, h), d = im.data, [r, gg, b] = hex(color);
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= thr) { d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
  t.putImageData(im, 0, 0); g.drawImage(t.canvas, 0, 0);
}
const FONT = { s: '8px Silkscreen', sb: '700 8px Silkscreen', p: '8px PS2P', p2: '16px PS2P', t: '8px Tiny5', t2: '16px Tiny5', m: '11px Micro5', m2: '22px Micro5', s2: '16px Silkscreen', sb2: '700 16px Silkscreen' };
function tw(str, font = 's', ls = 0) { const t = mk(1, 1); t.font = FONT[font] || font; return Math.round(t.measureText(str).width) + ls * (str.length - 1); }
// crisp text. y = baseline. opts: font key or css font, color, align, shadow, outline, ls (letter-spacing px)
function txt(g, str, x, y, o = {}) {
  const font = FONT[o.font || 's'] || o.font, ls = o.ls || 0, wdt = tw(str, o.font || 's', ls);
  if (o.align === 'center') x = Math.round(x - wdt / 2); else if (o.align === 'right') x = x - wdt;
  const draw = (ox, oy, col) => crisp(g, col, t => { t.font = font; t.textBaseline = 'alphabetic'; if (!ls) t.fillText(str, x + ox, y + oy); else { let cx = x + ox; for (const ch of str) { t.fillText(ch, cx, y + oy); cx += Math.round(t.measureText(ch).width) + ls; } } }, o.thr || 128);
  if (o.outline) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) draw(ox, oy, o.outline);
  if (o.shadow) draw(o.sx ?? 1, o.sy ?? 1, o.shadow);
  draw(0, 0, o.color || '#fff'); return wdt;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
// ordered-dither gradient between colour stops [[t,color],...]; f(x,y,w,h) -> t in 0..1 (default vertical)
function dgrad(g, x, y, w, h, stops, f) {
  const im = g.getImageData(x, y, w, h), d = im.data, S = stops.map(s => [s[0], hex(s[1])]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let t = f ? f(i, j, w, h) : (h > 1 ? j / (h - 1) : 0); if (t === null) continue; t = Math.max(0, Math.min(1, t));
    let k = 0; while (k < S.length - 2 && t > S[k + 1][0]) k++;
    const a = S[k], b = S[k + 1], u = (t - a[0]) / ((b[0] - a[0]) || 1), c = u > (BAYER[((y + j) & 3) * 4 + ((x + i) & 3)] + .5) / 16 ? b[1] : a[1], q = (j * w + i) * 4;
    d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255;
  }
  g.putImageData(im, x, y);
}
function bevel(g, x, y, w, h, lt, dk) { hl(g, x, y, w, lt); vl(g, x, y, h, lt); hl(g, x, y + h - 1, w, dk); vl(g, x + w - 1, y, h, dk); }
function frame(g, x, y, w, h, c) { hl(g, x, y, w, c); hl(g, x, y + h - 1, w, c); vl(g, x, y, h, c); vl(g, x + w - 1, y, h, c); }
// sprite from text rows; pal maps characters to colours, space/dot = transparent
function spr(g, x, y, rows, pal, flip) { rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = pal[row[i]]; if (c) px(g, x + (flip ? row.length - 1 - i : i), y + j, c); } }); }
function speckle(g, x, y, w, h, colors, n, r) { for (let i = 0; i < n; i++) px(g, x + Math.floor(r() * w), y + Math.floor(r() * h), colors[Math.floor(r() * colors.length)]); }
const ell = (g, c, cx, cy, rx, ry) => crisp(g, c, t => { t.beginPath(); t.ellipse(cx, cy, rx, ry, 0, 0, 7); t.fill(); });
const poly = (g, c, pts) => crisp(g, c, t => { t.beginPath(); pts.forEach((p, i) => i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1])); t.closePath(); t.fill(); });
const line = (g, c, x0, y0, x1, y1) => { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (;;) { px(g, x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
const copy = (g) => { const n = mk(g.canvas.width, g.canvas.height); n.drawImage(g.canvas, 0, 0); return n; };
// standard 88x31 button shell: draw(g, frameIndex) paints the 88x31 area, border style applied after
function b88(draw, o = {}) {
  const n = o.frames || 1, fr = [];
  for (let f = 0; f < n; f++) { const g = mk(88, 31); draw(g, f); const bd = o.border ?? 'bevel';
    if (bd === 'bevel') { frame(g, 0, 0, 88, 31, o.edge || '#000'); bevel(g, 1, 1, 86, 29, o.lt || 'rgba(255,255,255,.55)', o.dk || 'rgba(0,0,0,.55)'); }
    else if (bd === 'flat') frame(g, 0, 0, 88, 31, o.edge || '#000');
    else if (bd === 'double') { frame(g, 0, 0, 88, 31, o.edge || '#000'); frame(g, 2, 2, 84, 27, o.edge2 || '#fff'); }
    fr.push(g); }
  return n === 1 ? fr[0] : { frames: fr, delay: o.delay || 400 };
}
