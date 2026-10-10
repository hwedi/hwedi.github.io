// ---------- header banner, awards, "photos", tiles, globe, 80x15 badges ----------
ART.banner = () => {
  const W = 760, H = 140, g = mk(W, H), r = rng(1999); g.imageSmoothingEnabled = true;
  const sky = g.createLinearGradient(0, 0, 0, H);
  [[0, '#000008'], [.36, '#0a0033'], [.6, '#2a0a5e'], [.78, '#7d1a8c'], [.9, '#ff3399'], [1, '#ffb066']].forEach(s => sky.addColorStop(s[0], s[1])); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W / 2, H + 26, 8, W / 2, H + 26, 400); rg.addColorStop(0, 'rgba(255,214,140,.85)'); rg.addColorStop(.3, 'rgba(255,80,160,.38)'); rg.addColorStop(1, 'rgba(255,60,160,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 330; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * r() * H * .8), a = Math.max(0, 1 - y / (H * .78)) * (.25 + .75 * r()); g.fillStyle = `rgba(${220 + 35 * r() | 0},${220 + 35 * r() | 0},255,${a.toFixed(2)})`; g.fillRect(x, y, 1, 1);
    if (r() < .035 && y < 60) { g.fillStyle = `rgba(200,200,255,${(a * .5).toFixed(2)})`; g.fillRect(x - 2, y, 5, 1); g.fillRect(x, y - 2, 1, 5); g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); } }
  // crescent moon
  g.save(); g.shadowColor = '#ffffaa'; g.shadowBlur = 14; g.fillStyle = '#ffffcc'; g.beginPath(); g.arc(708, 58, 12, 0, 7); g.fill(); g.restore();
  g.fillStyle = '#1a0a4a'; g.beginPath(); g.arc(714, 54, 11, 0, 7); g.fill();
  // skyline silhouette with aerials, one lit window (that one is my room)
  const sil = '#06020e'; let x = -4; const tops = [];
  while (x < W) { const bw = 9 + Math.floor(r() * 26), bh = 7 + Math.floor(r() * r() * 30); R(g, x, H - bh, bw, bh, sil); tops.push([x, bw, bh]);
    if (r() < .34) { const ax = x + 3 + Math.floor(r() * (bw - 6)), ah = 6 + Math.floor(r() * 10); vl(g, ax, H - bh - ah, ah, sil); if (r() < .7) { hl(g, ax - 4, H - bh - ah + 1, 9, sil); hl(g, ax - 3, H - bh - ah + 3, 7, sil); hl(g, ax - 2, H - bh - ah + 5, 5, sil); } }
    if (r() < .1) { R(g, x + 2, H - bh - 7, 7, 5, sil); vl(g, x + 3, H - bh - 2, 2, sil); vl(g, x + 7, H - bh - 2, 2, sil); }
    for (let k = 0; k < 2; k++) if (r() < .28 && bh > 12) R(g, x + 2 + Math.floor(r() * (bw - 5)), H - bh + 3 + Math.floor(r() * (bh - 8)), 2, 2, r() < .5 ? '#ffcc66' : '#cc9933');
    x += bw; }
  const mine = tops.find(t => t[0] > 560 && t[2] > 16 && t[1] > 12) || tops[tops.length - 3];
  g.save(); g.shadowColor = '#66ffff'; g.shadowBlur = 7; R(g, mine[0] + 4, H - mine[2] + 5, 4, 4, '#aaffff'); g.restore(); R(g, mine[0] + 4, H - mine[2] + 5, 4, 4, '#ccffff');
  g.strokeStyle = sil; g.lineWidth = 1; for (let px0 = -30; px0 < W; px0 += 152) { R(g, px0, H - 44, 2, 44, sil); hl(g, px0 - 5, H - 42, 12, sil); hl(g, px0 - 4, H - 38, 10, sil); for (const o of [-5, 6]) { g.beginPath(); g.moveTo(px0 + o, H - 42); g.quadraticCurveTo(px0 + 76 + o, H - 26, px0 + 152 + o, H - 42); g.stroke(); } }
  // title with phosphor trails
  const title = 'AFTERGLOW', tx = W / 2, ty = 80; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '50px Michroma'; g.letterSpacing = '5px';
  for (let k = 9; k >= 1; k--) { g.save(); g.filter = `blur(${(k * .55).toFixed(1)}px)`; g.fillStyle = `rgba(${Math.round(90 + 14 * k)},${Math.round(230 - 22 * k)},255,${(.2 - k * .017).toFixed(3)})`; g.fillText(title, tx + k * 6 + 2, ty); g.restore(); }
  g.save(); g.shadowColor = '#ff2e9a'; g.shadowBlur = 20; g.fillStyle = '#ff66cc'; g.fillText(title, tx + 2, ty); g.shadowBlur = 8; g.fillText(title, tx + 2, ty); g.restore();
  const tg = g.createLinearGradient(0, ty - 38, 0, ty + 2); tg.addColorStop(0, '#ffffff'); tg.addColorStop(.48, '#d8f6ff'); tg.addColorStop(.5, '#8fd0ff'); tg.addColorStop(.78, '#ffe0f4'); tg.addColorStop(1, '#ffffff'); g.fillStyle = tg; g.fillText(title, tx + 2, ty);
  g.letterSpacing = '0px';
  // flare
  const fx = tx - 172, fy = ty - 36; let fl = g.createRadialGradient(fx, fy, 0, fx, fy, 26); fl.addColorStop(0, 'rgba(255,255,255,.95)'); fl.addColorStop(.12, 'rgba(255,220,255,.5)'); fl.addColorStop(1, 'rgba(255,120,220,0)'); g.fillStyle = fl; g.fillRect(fx - 30, fy - 30, 60, 60);
  fl = g.createLinearGradient(fx - 150, 0, fx + 190, 0); fl.addColorStop(0, 'rgba(255,255,255,0)'); fl.addColorStop(.44, 'rgba(255,255,255,.75)'); fl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = fl; g.fillRect(fx - 150, fy, 340, 1);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(fx, fy - 22, 1, 44);
  [[60, 26, 5, .12], [96, 42, 9, .07], [150, 66, 4, .14]].forEach(c => { g.fillStyle = `rgba(160,220,255,${c[3]})`; g.beginPath(); g.arc(fx + c[0], fy + c[1], c[2], 0, 7); g.fill(); });
  // crisp pixel type on top
  g.imageSmoothingEnabled = false;
  txt(g, "NOX'S NOCTURNAL HOMEPAGE", tx + 2, 99, { font: 's', color: '#000022', align: 'center', ls: 3, sx: 1, sy: 1 }); txt(g, "NOX'S NOCTURNAL HOMEPAGE", tx + 1, 98, { font: 's', color: '#aaffff', align: 'center', ls: 3 });
  txt(g, 'V3.2 "INSOMNIA"', W - 9, 14, { font: 't', color: '#8888ee', align: 'right' }); txt(g, '800X600 :: HI-COLOR :: 85HZ', W - 9, 23, { font: 't', color: '#5555aa', align: 'right' });
  txt(g, 'EST. 1999', 9, 14, { font: 't', color: '#8888ee' }); txt(g, 'BEST VIEWED AFTER MIDNIGHT', 9, 23, { font: 't', color: '#5555aa' });
  for (const [cx, cy] of [[4, 4], [W - 5, 4]]) { hl(g, cx - 2, cy, 5, '#5555aa'); vl(g, cx, cy - 2, 5, '#5555aa'); }
  // the moth, heading for the light
  const m = mk(17, 10); spr(m, 0, 0, MOTH[0], MOTHPAL); g.save(); g.shadowColor = '#cc99ff'; g.shadowBlur = 6; g.drawImage(m.canvas, 0, 0, 17, 10, tx + 214, 30, 34, 20); g.restore();
  const im = g.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 13; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0);
  return { frames: [g], kind: 'jpg', q: .74 };
};

const burst = (g, c, cx, cy, n, ro, ri) => poly(g, c, Array.from({ length: n * 2 }, (_, k) => { const a = k / (n * 2) * Math.PI * 2, rr = k % 2 ? ri : ro; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }));
ART.aw_cool = () => { const g = mk(100, 104);
  poly(g, '#000066', [[30, 60], [44, 60], [40, 103], [32, 96], [22, 101]]); poly(g, '#3366ff', [[31, 62], [43, 62], [39, 100], [32, 94], [24, 98]]);
  poly(g, '#000066', [[56, 60], [70, 60], [78, 101], [68, 96], [60, 103]]); poly(g, '#3366ff', [[57, 62], [69, 62], [76, 98], [68, 94], [61, 100]]);
  burst(g, '#663300', 50, 45, 26, 45, 40); burst(g, '#ffcc00', 50, 45, 26, 43.4, 38.6); ell(g, '#996600', 50, 45, 35, 35);
  dgrad(g, 16, 11, 68, 68, [[0, '#fff6b8'], [.5, '#ffdd44'], [1, '#cc8800']], (x, y) => { const dx = x - 34, dy = y - 34; return dx * dx + dy * dy > 33 * 33 ? null : (x + y) / 136; });
  for (let y = 11; y < 79; y++) for (let x = 16; x < 84; x++) { const dx = x - 50, dy = y - 45; const d2 = dx * dx + dy * dy; if (d2 > 33 * 33 && d2 <= 35.4 * 35.4) px(g, x, y, '#996600'); }
  txt(g, 'COOL SITE', 50, 31, { font: 'sb', color: '#663300', align: 'center' }); txt(g, 'OF THE', 50, 41, { font: 't', color: '#663300', align: 'center' });
  txt(g, 'NITE', 51, 61, { font: 'p2', color: '#ffffff', align: 'center' }); txt(g, 'NITE', 50, 60, { font: 'p2', color: '#cc0000', align: 'center' });
  txt(g, '* 2001 *', 50, 71, { font: 't', color: '#663300', align: 'center' }); return g; };
ART.aw_tube = () => { const g = mk(112, 84); R(g, 0, 0, 112, 84, '#000000'); frame(g, 0, 0, 112, 84, '#ffcc00'); frame(g, 2, 2, 108, 80, '#996600');
  const r = rng(77); stars(g, r, 26, 4, 4, 104, 76, ['#665200', '#332900', '#ffee99']);
  const s = crtIcon(g, 7, 17, 33, 28, { body: '#ffcc00', shade: '#996600', hi: '#ffff99', edge: '#4d3300', screen: '#1a1100', ledc: '#ff3333' });
  dgrad(g, s.x, s.y, s.w, s.h, [[0, '#664400'], [1, '#1a1100']]); const cx = s.x + 7, cy = s.y + 5; hl(g, cx - 4, cy, 9, '#ffffcc'); vl(g, cx, cy - 4, 9, '#ffffcc'); px(g, cx - 1, cy - 1, '#fff'); px(g, cx + 1, cy - 1, '#fff'); px(g, cx - 1, cy + 1, '#fff'); px(g, cx + 1, cy + 1, '#fff');
  txt(g, 'GOLDEN', 76, 24, { font: 'sb', color: '#ffee99', align: 'center' }); txt(g, 'TUBE', 108, 43, { font: 'p2', color: '#996600', align: 'right' }); txt(g, 'TUBE', 107, 42, { font: 'p2', color: '#ffcc00', align: 'right' }); txt(g, 'AWARD', 76, 54, { font: 'sb', color: '#ffee99', align: 'center' });
  txt(g, 'TUBE HEADS UNITED', 56, 68, { font: 't', color: '#ffcc00', align: 'center' }); txt(g, 'WEB LEAGUE - SPRING 2002', 56, 77, { font: 't', color: '#996600', align: 'center' }); return g; };
function frog(g, cx, cy) { ell(g, '#006600', cx, cy + 3, 11.5, 8.5); ell(g, '#33cc33', cx, cy + 3, 10.5, 7.5); ell(g, '#006600', cx - 6, cy - 4.5, 4.4, 4.4); ell(g, '#006600', cx + 6, cy - 4.5, 4.4, 4.4); ell(g, '#ffffff', cx - 6, cy - 4.5, 3.3, 3.3); ell(g, '#ffffff', cx + 6, cy - 4.5, 3.3, 3.3); R(g, cx - 6, cy - 5, 2, 2, '#000'); R(g, cx + 5, cy - 5, 2, 2, '#000');
  for (let i = -6; i <= 5; i++) px(g, cx + i, cy + (Math.abs(i + .5) > 5 ? 4 : Math.abs(i + .5) > 4 ? 5 : 6), '#006600'); R(g, cx - 9, cy + 2, 2, 1, '#ff99cc'); R(g, cx + 8, cy + 2, 2, 1, '#ff99cc'); }
ART.aw_kero = () => { const g = mk(112, 84); R(g, 0, 0, 112, 84, '#99ff33'); for (let y = 3; y < 84; y += 6) for (let x = 3 + (y % 12 ? 3 : 0); x < 112; x += 6) px(g, x, y, '#66cc00'); frame(g, 0, 0, 112, 84, '#006600');
  crisp(g, '#006600', t => { t.beginPath(); t.roundRect(7, 7, 98, 70, 9); t.fill(); }); crisp(g, '#ffffff', t => { t.beginPath(); t.roundRect(8.5, 8.5, 95, 67, 8); t.fill(); });
  frog(g, 30, 30); txt(g, "KERO'S", 74, 26, { font: 'sb', color: '#006600', align: 'center' }); txt(g, 'KEWL SITE', 74, 37, { font: 'sb', color: '#ff3399', align: 'center' }); txt(g, 'AWARD', 74, 48, { font: 'sb', color: '#006600', align: 'center' });
  txt(g, '"ur site makes me ribbit"', 56, 62, { font: 't', color: '#339933', align: 'center' }); txt(g, '~ 2002 ~', 56, 71, { font: 't', color: '#ff3399', align: 'center' });
  spr(g, 13, 62, HEART, { '#': '#ff99cc' }); spr(g, 92, 62, HEART, { '#': '#ff99cc' }); return g; };

// "photo": byte the cat keeping warm on the monitor
ART.cat = () => { const W = 168, H = 124, g = mk(W, H);
  dgrad(g, 0, 0, W, H, [[0, '#46529a'], [.35, '#2a2360'], [.7, '#1a1440'], [1, '#100c28']], (x, y) => Math.hypot(x - 84, (y - 66) * 1.15) / 104);
  R(g, 12, 12, 30, 40, '#0c0920'); R(g, 13, 13, 28, 38, '#2b1a55'); ell(g, '#ff66cc', 27, 27, 8, 8); ell(g, '#2b1a55', 30, 25, 6.5, 6.5); txt(g, 'NITE', 27, 46, { font: 't', color: '#ff99dd', align: 'center' });       // poster
  R(g, 0, 98, W, 26, '#2e1c0e'); R(g, 0, 98, W, 3, '#6b4326'); hl(g, 0, 98, W, '#8a5a36'); dgrad(g, 20, 99, 128, 2, [[0, '#9a7a66'], [1, '#6b4326']], (x) => Math.abs(x - 64) / 64);
  const s = crtIcon(g, 48, 34, 72, 58, {});
  dgrad(g, s.x, s.y, s.w, s.h, [[0, '#0a1050'], [1, '#04061e']]); R(g, s.x + 3, s.y + 3, s.w - 6, 7, '#cc3399'); R(g, s.x + 5, s.y + 5, 18, 3, '#ffffff');
  R(g, s.x + 3, s.y + 13, 12, 19, '#102a88'); for (let y = 15; y < 30; y += 3) hl(g, s.x + 5, s.y + y, 8, '#66ffff');
  R(g, s.x + 18, s.y + 13, s.w - 21, 19, '#0c1c66'); for (let y = 15; y < 30; y += 2) hl(g, s.x + 20, s.y + y, (s.w - 26) - (y * 7 % 11), '#ccccff');
  hl(g, s.x, s.y, s.w, '#3a50c8'); vl(g, s.x, s.y, s.h, '#3a50c8'); px(g, 100, 86, '#4a4634'); px(g, 96, 86, '#4a4634'); px(g, 92, 86, '#4a4634'); txt(g, 'K19', 53, 89, { font: 't', color: '#7a745c' });
  R(g, 44, 101, 72, 7, '#4a4634'); R(g, 45, 101, 70, 5, '#d8d0b8'); for (let x = 47; x < 113; x += 3) { px(g, x, 102, '#a8a088'); px(g, x + 1, 104, '#a8a088'); }
  ell(g, '#4a4634', 131, 104, 6, 3.6); ell(g, '#d8d0b8', 131, 103.5, 5, 2.8); line(g, '#4a4634', 126, 101, 121, 97);
  R(g, 22, 86, 9, 12, '#aa0000'); R(g, 22, 86, 9, 2, '#dddddd'); R(g, 23, 90, 7, 3, '#ffffff');                                                                // soda can
  // the cat
  const o = '#5e2c0a', f = '#e8903a', lt = '#f6b86a', dk = '#b7601c';
  const tail = (c, w) => crisp(g, c, t => { t.lineWidth = w; t.lineCap = 'round'; t.beginPath(); t.moveTo(110, 27); t.bezierCurveTo(124, 28, 126, 40, 122, 52); t.bezierCurveTo(120, 60, 126, 62, 128, 58); t.stroke(); });
  tail(o, 6.4); tail(f, 4);
  ell(g, o, 88, 25, 27, 10.6); ell(g, f, 88, 25, 25.6, 9.3); ell(g, lt, 84, 21.5, 17, 4.2);
  for (const sx of [80, 88, 96, 104]) crisp(g, dk, t => { t.lineWidth = 1.6; t.beginPath(); t.moveTo(sx, 16.5); t.quadraticCurveTo(sx + 2.5, 20, sx + 1, 24); t.stroke(); });
  poly(g, o, [[54, 18], [56, 7], [63, 14]]); poly(g, o, [[66, 13], [73, 6], [75, 17]]); ell(g, o, 64.5, 22.5, 11, 9.6);
  poly(g, f, [[56, 17], [57, 10], [61, 14.5]]); poly(g, f, [[68, 14], [72, 9], [73.2, 16]]); ell(g, f, 64.5, 22.5, 9.7, 8.3); px(g, 58, 13, '#ffb0c0'); px(g, 71, 12, '#ffb0c0');
  ell(g, '#fff4e0', 64.5, 26, 5.2, 3.6); [[59, 21], [60, 22], [61, 22], [62, 21]].forEach(p => px(g, p[0], p[1], o)); [[67, 21], [68, 22], [69, 22], [70, 21]].forEach(p => px(g, p[0], p[1], o));
  px(g, 64, 24, '#ff8899'); px(g, 65, 24, '#ff8899'); px(g, 64, 25, o); px(g, 63, 26, o); px(g, 66, 26, o); hl(g, 52, 24, 4, '#fff4e0'); hl(g, 73, 24, 4, '#fff4e0'); hl(g, 53, 26, 3, '#fff4e0'); hl(g, 74, 26, 3, '#fff4e0');
  ell(g, o, 72, 33, 5, 2.6); ell(g, '#fff4e0', 72, 32.6, 4, 1.8); ell(g, o, 84, 33.4, 5, 2.4); ell(g, '#fff4e0', 84, 33, 4, 1.6);
  txt(g, 'z', 46, 14, { font: 't', color: '#ccccff' }); txt(g, 'Z', 39, 9, { font: 's', color: '#9999dd' }); txt(g, 'Z', 31, 4 + 4, { font: 'p', color: '#6666aa' });
  return g; };

ART.cam = () => ({ frames: [0, 1, 2, 3].map(f => { const W = 128, H = 96, g = mk(W, H), r = rng(900 + f * 31), sh = ['#111111', '#333333', '#666666', '#999999', '#dddddd'];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) R(g, x, y, 2, 2, sh[Math.floor(Math.pow(r(), 1.5) * 5)]);
  const by = (f * 29) % H; R(g, 0, by, W, 5, '#000000'); hl(g, 0, by + 5, W, '#eeeeee');
  R(g, 30, 36, 68, 24, '#000000'); frame(g, 31, 37, 66, 22, '#ffffff'); txt(g, 'NO SIGNAL', 64, 52, { font: 'sb', color: '#ffffff', align: 'center' });
  R(g, 3, 3, 46, 11, '#000000'); if (f % 2) ell(g, '#ff0000', 8.5, 8.5, 2.6, 2.6); txt(g, 'NOX-CAM', 14, 12, { font: 't', color: '#ffffff' }); return g; }), delay: 140 });

ART.t_grid = () => { const g = mk(32, 32); R(g, 0, 0, 32, 32, '#000033'); for (let i = 0; i < 32; i += 16) { hl(g, 0, i, 32, '#003399'); vl(g, i, 0, 32, '#003399'); px(g, i, i, '#66ccff'); px(g, i, (i + 16) % 32, '#66ccff'); } for (let i = 8; i < 32; i += 16) for (let j = 0; j < 32; j += 4) { px(g, j, i, '#001a66'); px(g, i, j, '#001a66'); } return g; };
ART.t_hearts = () => { const g = mk(26, 26); R(g, 0, 0, 26, 26, '#1a0011'); spr(g, 3, 4, HEART, { '#': '#ff3399' }); spr(g, 16, 17, HEART, { '#': '#ff99cc' }); px(g, 19, 5, '#660033'); px(g, 6, 19, '#660033'); px(g, 12, 12, '#660033'); return g; };
ART.t_circuit = () => { const g = mk(48, 48), a = '#0a4d0a', b = '#33cc33'; R(g, 0, 0, 48, 48, '#001400');
  const seg = (pts) => { for (let i = 0; i < pts.length - 1; i++) line(g, a, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); };
  seg([[0, 8], [14, 8], [22, 16], [22, 30], [30, 38], [47, 38]]); seg([[8, 0], [8, 4], [0, 4]]); seg([[0, 24], [10, 24], [14, 28], [14, 47]]); seg([[36, 0], [36, 10], [47, 21]]); seg([[0, 21], [2, 21]]); seg([[30, 47], [30, 44], [40, 44], [47, 44]]); seg([[0, 44], [4, 44], [8, 40], [8, 36]]); seg([[14, 0], [14, 2]]); seg([[30, 0], [30, 2]]); seg([[47, 8], [44, 8], [40, 12], [40, 26]]);
  [[22, 23], [8, 36], [40, 26], [36, 5], [14, 36], [30, 44]].forEach(p => { R(g, p[0] - 1, p[1] - 1, 3, 3, b); px(g, p[0], p[1], '#001400'); }); R(g, 26, 20, 9, 7, '#0a4d0a'); for (let x = 27; x < 35; x += 2) { px(g, x, 19, b); px(g, x, 27, b); } return g; };
ART.t_plasma = () => { const N = 64, g = mk(N, N), T = 2 * Math.PI / N; dgrad(g, 0, 0, N, N, [[0, '#0d001a'], [.34, '#330066'], [.67, '#660099'], [1, '#9933cc']], (x, y) => .5 + .26 * Math.sin(x * T + 1) * Math.cos(y * T * 2) + .22 * Math.sin((x + y) * T * 2 + 2) + .12 * Math.cos((x - y) * T + .5)); return g; };
ART.t_checker = () => { const g = mk(16, 16); R(g, 0, 0, 16, 16, '#14002b'); R(g, 0, 0, 8, 8, '#26004d'); R(g, 8, 8, 8, 8, '#26004d'); px(g, 0, 0, '#40007a'); px(g, 8, 8, '#40007a'); return g; };
ART.t_moths = () => { const g = mk(44, 36); R(g, 0, 0, 44, 36, '#0a0a1f'); spr(g, 3, 4, MOTH[0], { o: '#3d2d73', w: '#1e1e42', s: '#55224d', b: '#2a1650', a: '#2b2b55', e: '#3d2d73' }); spr(g, 25, 22, MOTH[2], { o: '#3d2d73', w: '#1e1e42', s: '#55224d', b: '#2a1650', a: '#2b2b55', e: '#3d2d73' }); px(g, 34, 7, '#333366'); px(g, 10, 27, '#333366'); return g; };

ART.globe = () => ({ frames: Array.from({ length: 12 }, (_, f) => { const N = 32, g = mk(N, N), rot = f / 12 * Math.PI * 2;
  const land = (lon, lat) => Math.sin(2 * lon + 1) * Math.cos(3 * lat) + Math.sin(3 * lon + 2.3) * Math.sin(2 * lat + 1) + .6 * Math.sin(5 * lon + lat * 4) > .42;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const nx = (x - 15.5) / 15, ny = (y - 15.5) / 15, q = nx * nx + ny * ny; if (q > 1.07) continue; if (q > .93) { px(g, x, y, '#000044'); continue; }
    const z = Math.sqrt(1 - q), lon = Math.atan2(nx, z) + rot, lat = Math.asin(Math.max(-1, Math.min(1, ny))), L = land(lon, lat), ice = Math.abs(lat) > 1.12;
    const light = (-nx * .5 - ny * .55 + z * .68), th = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16, br = light > .25 + th * .4;
    px(g, x, y, ice ? (br ? '#ffffff' : '#99ccff') : L ? (br ? '#66ff66' : '#009933') : (br ? '#3399ff' : '#003399')); }
  px(g, 10, 8, '#ffffff'); px(g, 11, 8, '#ccffff'); px(g, 10, 9, '#ccffff'); return g; }), delay: 110 });

// the monitor itself, portrait for the shrine
ART.k19 = () => { const W = 150, H = 132, g = mk(W, H); dgrad(g, 0, 0, W, H, [[0, '#1c2d6e'], [.5, '#0c1238'], [1, '#04061a']], (x, y) => Math.hypot(x - 75, y - 58) / 110);
  ell(g, '#02030c', 75, 124, 62, 6);
  const s = crtIcon(g, 14, 8, 122, 100, {});
  const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'], bw = s.w / 7; bars.forEach((c, i) => R(g, s.x + Math.round(i * bw), s.y, Math.round((i + 1) * bw) - Math.round(i * bw), Math.round(s.h * .68), c));
  dgrad(g, s.x, s.y + Math.round(s.h * .68), s.w, s.h - Math.round(s.h * .68), [[0, '#000000'], [1, '#ffffff']], (x, y, w) => x / (w - 1));
  hl(g, s.x, s.y + Math.round(s.h * .68), s.w, '#000000'); R(g, s.x + s.w / 2 - 22, s.y + 22, 44, 13, '#000000'); txt(g, 'K19', s.x + s.w / 2, s.y + 33, { font: 'p', color: '#ffffff', align: 'center' });
  crisp(g, '#f8f8ff', t => { t.globalAlpha = 1; t.beginPath(); t.moveTo(s.x + 4, s.y + 12); t.quadraticCurveTo(s.x + 6, s.y + 4, s.x + 22, s.y + 3); t.lineTo(s.x + 14, s.y + 5); t.quadraticCurveTo(s.x + 7, s.y + 7, s.x + 4, s.y + 12); t.fill(); });
  txt(g, 'KILOVOLT', 26, 100, { font: 't', color: '#6e6850' }); for (let i = 0; i < 3; i++) { R(g, 92 + i * 9, 95, 6, 4, '#a8a088'); hl(g, 92 + i * 9, 95, 6, '#f4eedc'); } ell(g, '#a8a088', 126.5, 97, 3.4, 3.4); px(g, 126, 96, '#f4eedc');
  R(g, 20, 12, 13, 8, '#e8e8f8'); frame(g, 20, 12, 13, 8, '#8888aa'); hl(g, 22, 15, 9, '#cc3399'); hl(g, 22, 17, 6, '#3366ff');   // the feature sticker nobody peels off
  return g; };

// 80x15 two-tone badges
function ap(l, rt, cl, cr, o = {}) { const g = mk(80, 15), wl = tw(l, 's') + 7; R(g, 0, 0, 80, 15, '#ffffff'); frame(g, 0, 0, 80, 15, o.edge || '#666666'); R(g, 2, 2, wl, 11, cl); R(g, wl + 3, 2, 80 - wl - 5, 11, cr);
  txt(g, l, 2 + Math.round(wl / 2), 11, { font: 's', color: o.tl || '#ffffff', align: 'center' }); txt(g, rt, wl + 3 + Math.round((80 - wl - 5) / 2), 11, { font: 's', color: o.tr || '#ffffff', align: 'center' }); return g; }
ART.ap_crt = () => ap('CRT', '85 HZ', '#ff6600', '#898e79');
ART.ap_html = () => ap('HTML', 'BY HAND', '#003399', '#898e79');
ART.ap_56k = () => ap('56K', 'FRIENDLY', '#339900', '#898e79');
ART.ap_moth = () => ap('MOTH', 'INSIDE', '#9933ff', '#330066');
ART.ap_nite = () => ap('OPEN', 'ALL NITE', '#cc0066', '#000033', { tr: '#ffff66' });
ART.ap_noflash = () => ap('NO', 'INTROS', '#cc0000', '#898e79');
