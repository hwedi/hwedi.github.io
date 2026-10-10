// ---------- 88x31 buttons and blinkies ----------
function crtIcon(g, x, y, w, h, o = {}) {      // little beige tube monitor; returns its screen rect
  const body = o.body || '#d8d0b8', sh = o.shade || '#a8a088', hi = o.hi || '#f4eedc', edge = o.edge || '#4a4634';
  R(g, x, y, w, h, edge); R(g, x + 1, y + 1, w - 2, h - 2, body);
  hl(g, x + 1, y + 1, w - 2, hi); vl(g, x + 1, y + 1, h - 2, hi); hl(g, x + 1, y + h - 2, w - 2, sh); vl(g, x + w - 2, y + 1, h - 2, sh);
  const m = Math.max(2, Math.round(w * .13)), chin = Math.max(2, Math.round(h * .17));
  const sx = x + m, sy = y + m, sw = w - 2 * m, shh = h - m - chin - 1;
  R(g, sx - 1, sy - 1, sw + 2, shh + 2, edge); R(g, sx, sy, sw, shh, o.screen || '#001a33');
  if (o.led !== false) px(g, x + w - m - 1, y + h - Math.ceil(chin / 2) - 1, o.ledc || '#33ff33');
  const stw = Math.round(w * .4), sth = Math.max(1, Math.round(h * .1));
  R(g, x + Math.round((w - stw) / 2), y + h, stw, sth, sh); R(g, x + Math.round((w - stw * 1.6) / 2), y + h + sth, Math.round(stw * 1.6), Math.max(1, Math.round(sth * .7)), edge);
  return { x: sx, y: sy, w: sw, h: shh };
}
const stars = (g, r, n, x, y, w, h, cols = ['#ffffff', '#9999cc', '#666699']) => speckle(g, x, y, w, h, cols, n, r);
const SUNSET = [[0, '#000033'], [.42, '#330066'], [.72, '#990066'], [.9, '#ff3399'], [1, '#ff9966']];

ART.b_afterglow = () => b88((g, f) => { dgrad(g, 0, 0, 88, 21, SUNSET); R(g, 0, 21, 88, 10, '#990066'); hl(g, 0, 21, 88, '#ffcc66'); const r = rng(3); stars(g, r, 14, 2, 2, 84, 9);
  [[9, 5], [70, 4], [80, 9]].forEach((p, i) => { if ((f + i) % 3 === 0) { px(g, p[0], p[1], '#fff'); px(g, p[0] - 1, p[1], '#9999cc'); px(g, p[0] + 1, p[1], '#9999cc'); px(g, p[0], p[1] - 1, '#9999cc'); px(g, p[0], p[1] + 1, '#9999cc'); } });
  txt(g, 'AFTERGLOW', 46, 16, { font: 'p', color: '#330066', align: 'center' }); txt(g, 'AFTERGLOW', 45, 15, { font: 'p', color: ['#ffffff', '#ccffff', '#ffccff'][f], align: 'center' });
  txt(g, "NOX'S HOMEPAGE", 44, 28, { font: 't', color: '#ffffff', align: 'center' }); }, { frames: 3, delay: 450, lt: 'rgba(255,255,255,.35)' });

ART.b_afterglow2 = () => { const cols = ['#eeffee', '#99ffbb', '#33cc66', '#157a3a', '#0a3318', '#000000'];
  const r = b88((g, f) => { R(g, 0, 0, 88, 31, '#000000'); for (let x = 7; x < 88; x += 8) vl(g, x, 0, 31, '#041a0a'); for (let y = 7; y < 31; y += 8) hl(g, 0, y, 88, '#041a0a');
    if (f < 5) txt(g, 'AFTERGLOW', 44, 16, { font: 'p', color: cols[f], align: 'center' });
    txt(g, 'phosphor powered', 44, 26, { font: 't', color: '#1f8f48', align: 'center' }); if (f === 5) R(g, 8, 9, 7, 8, '#eeffee'); }, { frames: 6, border: 'flat', edge: '#1f8f48' });
  r.delay = [1400, 110, 110, 110, 140, 420]; return r; };

ART.b_midnight = () => b88((g) => { R(g, 0, 0, 88, 31, '#000044'); const r = rng(11); stars(g, r, 22, 2, 2, 84, 27);
  ell(g, '#ffff99', 13.5, 15.5, 8.2, 8.2); ell(g, '#000044', 17.2, 13.2, 7, 7);
  txt(g, 'BEST VIEWED', 54, 11, { font: 's', color: '#66ffff', align: 'center' }); txt(g, 'AFTER MIDNIGHT', 54, 20, { font: 't', color: '#ffff66', align: 'center' }); txt(g, '00:00 - 05:00', 54, 27, { font: 't', color: '#6666cc', align: 'center' }); }, { lt: '#3333aa', dk: '#000011' });

ART.b_800x600 = () => b88((g) => { R(g, 0, 0, 88, 31, '#c0c0c0'); const s = crtIcon(g, 6, 5, 19, 16, { screen: '#000080' }); R(g, s.x + 1, s.y + 1, 5, 1, '#ffffff'); R(g, s.x + 1, s.y + 3, 8, 1, '#66ccff');
  txt(g, '800x600', 57, 14, { font: 'sb', color: '#000000', align: 'center' }); txt(g, 'HI-COLOR', 57, 24, { font: 's', color: '#000080', align: 'center' }); }, { lt: '#ffffff', dk: '#808080' });

ART.b_notepad = () => b88((g) => { R(g, 0, 0, 88, 31, '#ffffff'); for (let y = 8; y < 30; y += 5) hl(g, 1, y, 86, '#cce0ff'); vl(g, 26, 1, 29, '#ffb3b3');
  R(g, 7, 6, 13, 19, '#000080'); R(g, 8, 7, 11, 17, '#ffffee'); for (let y = 10; y < 23; y += 3) hl(g, 10, y, 7, '#9999cc'); for (let x = 9; x < 19; x += 2) R(g, x, 5, 1, 3, '#666666');
  txt(g, 'MADE WITH', 57, 13, { font: 't', color: '#000080', align: 'center' }); txt(g, 'NOTEPAD', 57, 23, { font: 'sb', color: '#000000', align: 'center' }); }, { border: 'flat', edge: '#000080' });

ART.b_crt = () => b88((g, f) => { dgrad(g, 0, 0, 88, 31, [[0, '#003333'], [1, '#000000']]); const s = crtIcon(g, 5, 4, 22, 18, { screen: '#002211' }); hl(g, s.x, s.y + 1 + f * 3, s.w, '#66ffcc'); hl(g, s.x, s.y + 2 + f * 3, s.w, '#0a5540');
  txt(g, '100% CRT', 59, 14, { font: 'sb', color: '#ffff66', align: 'center', shadow: '#000' }); txt(g, 'POWERED', 59, 24, { font: 's', color: '#ffffff', align: 'center', shadow: '#000' }); }, { frames: 3, delay: 160, lt: '#339999', dk: '#000000' });

ART.b_85hz = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#000000'); txt(g, '60Hz', 5, 12, { font: 't', color: f ? '#660000' : '#ff0033' }); line(g, '#ffffff', 4, 13, 22, 5); txt(g, '85Hz', 85, 20, { font: 'p2', color: '#99ff33', align: 'right' });
  txt(g, 'FLICKER FREE CLUB', 44, 27, { font: 't', color: '#ffffff', align: 'center' }); }, { frames: 2, delay: 70, border: 'double', edge: '#99ff33', edge2: '#1a3300' });

ART.b_degauss = () => b88((g, f) => { dgrad(g, 0, 0, 88, 31, RB.concat(RB[0]).map((c, i) => [i / 6, c]), (x, y, w, h) => (((x + y * 1.6 + Math.sin(y / 4 + f) * 5 + f * 11) % 66) + 66) % 66 / 66);
  const wob = [0, 1, 0, -1, 0, 1][f], wx = [0, 1, -1, 0, 1, -1][f]; txt(g, 'DEGAUSS', 44 + wx, 16 + wob, { font: 'p', color: '#ffffff', align: 'center', outline: '#000000' }); txt(g, 'DAILY', 44 - wx, 26, { font: 's', color: '#ffff66', align: 'center', outline: '#000000' }); }, { frames: 6, delay: 90, border: 'flat' });

ART.b_antilcd = () => b88((g) => { R(g, 0, 0, 88, 31, '#000000'); R(g, 8, 8, 16, 11, '#888888'); R(g, 9, 9, 14, 9, '#b0c4d8'); R(g, 14, 19, 4, 3, '#888888'); R(g, 11, 22, 10, 1, '#888888');
  crisp(g, '#ff0033', t => { t.lineWidth = 2.4; t.beginPath(); t.arc(16, 15.5, 10.5, 0, 7); t.stroke(); t.beginPath(); t.moveTo(8.6, 8.1); t.lineTo(23.4, 22.9); t.stroke(); });
  txt(g, 'ANTI-LCD', 58, 14, { font: 'sb', color: '#ffff00', align: 'center' }); txt(g, 'LEAGUE', 58, 24, { font: 's', color: '#ffffff', align: 'center' }); }, { border: 'double', edge: '#ffcc00', edge2: '#000' });

ART.b_56k = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#001100'); txt(g, '56K', 3, 20, { font: 'p2', color: '#33ff33' }); txt(g, 'DIAL-UP', 85, 11, { font: 't', color: '#99ff99', align: 'right' }); txt(g, 'VETERAN', 85, 19, { font: 't', color: '#99ff99', align: 'right' });
  txt(g, 'CONNECT 49333', 5, 28, { font: 't', color: '#1f8f1f' }); if (!f) R(g, 62, 23, 4, 5, '#33ff33'); }, { frames: 2, delay: 500, border: 'flat', edge: '#33ff33' });

ART.b_y2k = () => b88((g) => { dgrad(g, 0, 0, 88, 31, [[0, '#ffee99'], [.45, '#ffcc00'], [1, '#996600']]); txt(g, 'Y2K', 5, 19, { font: 'p2', color: '#663300', shadow: '#ffee99', sx: -1, sy: -1 });
  [[60, 12], [61, 13], [62, 14], [63, 15], [64, 14], [65, 13], [66, 12], [67, 11], [68, 10], [69, 9], [70, 8], [71, 7]].forEach(p => { R(g, p[0], p[1], 1, 3, '#006600'); }); frame(g, 57, 4, 18, 15, '#663300');
  txt(g, 'COMPLIANT', 44, 28, { font: 't', color: '#ffffff', align: 'center', shadow: '#663300', ls: 2 }); }, { lt: '#ffffcc', dk: '#663300' });

ART.b_handcoded = () => b88((g) => { R(g, 0, 0, 88, 31, '#ffffff'); R(g, 1, 1, 34, 29, '#003399'); txt(g, 'HTML', 18, 13, { font: 'sb', color: '#ffffff', align: 'center' }); txt(g, '4.01', 18, 23, { font: 't', color: '#99ccff', align: 'center' });
  [[37, 16], [38, 17], [39, 18], [40, 17], [41, 16], [42, 15], [43, 14], [44, 13]].forEach(p => { px(g, p[0], p[1], '#cc0000'); px(g, p[0], p[1] + 1, '#cc0000'); });
  txt(g, 'HAND', 66, 13, { font: 'sb', color: '#000000', align: 'center' }); txt(g, 'CODED', 66, 23, { font: 'sb', color: '#000000', align: 'center' }); }, { border: 'flat', edge: '#666666' });

ART.b_navigatron = () => b88((g, f) => { dgrad(g, 0, 0, 88, 31, [[0, '#006666'], [1, '#001a1a']]); const cx = 15, cy = 15, L = f ? 9 : 7;
  crisp(g, '#ffffff', t => { t.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = k % 2 ? 2.2 : L; t.lineTo(cx + .5 + Math.cos(a) * rr, cy + .5 + Math.sin(a) * rr); } t.closePath(); t.fill(); }); ell(g, '#66ffff', cx + .5, cy + .5, 2.2, 2.2);
  txt(g, 'NAVIGATRON 4', 57, 13, { font: 't', color: '#ffffff', align: 'center', shadow: '#001a1a' }); txt(g, 'GET IT NOW!', 57, 23, { font: 's', color: f ? '#ffff66' : '#ff9933', align: 'center', shadow: '#001a1a' }); }, { frames: 2, delay: 380, lt: '#33cccc', dk: '#000' });

const NOTE = ['..##', '..#.', '..#.', '..#.', '###.', '###.'];
ART.b_midi = () => b88((g, f) => { dgrad(g, 0, 0, 88, 31, [[0, '#6600cc'], [1, '#1a0033']]); [[6, 8], [15, 15], [72, 14], [80, 7]].forEach((p, i) => spr(g, p[0], p[1] + ((i + f) % 2 ? 2 : 0), NOTE, { '#': i % 2 ? '#ffff66' : '#66ffff' }));
  txt(g, 'MIDI', 45, 16, { font: 'p', color: '#ffffff', align: 'center', shadow: '#000' }); txt(g, 'INSIDE', 44, 26, { font: 's', color: '#ff99ff', align: 'center', shadow: '#000' }); }, { frames: 2, delay: 280, lt: '#cc66ff', dk: '#000' });

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
ART.b_pixels = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#ffffff'); for (let y = 0; y < 31; y++) for (let x = 0; x < 88; x++) if ((x < 4 || x > 83 || y < 4 || y > 26) && ((x >> 1) + (y >> 1)) % 2) px(g, x, y, '#ff99cc');
  txt(g, 'I', 12, 20, { font: 'p', color: '#000000' }); spr(g, 23, f ? 11 : 12, HEART, { '#': '#ff0066' }); if (f) { hl(g, 22, 13, 9, '#ff0066'); }
  txt(g, 'PIXELS', 34, 20, { font: 'p', color: '#000000' }); }, { frames: 2, delay: 420, border: 'flat', edge: '#ff0066' });

ART.b_guestbook = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#ffffcc'); R(g, 6, 8, 17, 15, '#663300'); R(g, 7, 9, 7, 13, '#ffffff'); R(g, 15, 9, 7, 13, '#ffffff'); for (let y = 11; y < 21; y += 2) { hl(g, 8, y, 5, '#9999cc'); hl(g, 16, y, 5, '#9999cc'); }
  line(g, '#cc0000', 22, 4, 17, 14); line(g, '#cc0000', 23, 4, 18, 14); px(g, 17, 15, '#000');
  txt(g, 'SIGN MY', 56, 12, { font: 't', color: '#663300', align: 'center' }); txt(g, 'GUESTBOOK', 56, 22, { font: 'sb', color: '#cc0000', align: 'center' }); if (f) txt(g, '>>', 79, 12, { font: 't', color: '#cc0000' }); }, { frames: 2, delay: 450, border: 'flat', edge: '#663300' });

ART.b_nightowls = () => { const r = b88((g, f) => { dgrad(g, 0, 0, 88, 31, [[0, '#000022'], [1, '#1a1a66']]); const rr = rng(5); stars(g, rr, 10, 30, 2, 54, 10);
    ell(g, '#553311', 16, 16, 12.5, 11); poly(g, '#553311', [[5, 8], [9, 3], [12, 8]]); poly(g, '#553311', [[20, 8], [23, 3], [27, 8]]);
    if (!f) { ell(g, '#ffcc00', 11, 15, 4.6, 4.6); ell(g, '#ffcc00', 21, 15, 4.6, 4.6); ell(g, '#000000', 11.5, 15.5, 2, 2); ell(g, '#000000', 21.5, 15.5, 2, 2); px(g, 10, 14, '#fff'); px(g, 20, 14, '#fff'); }
    else { hl(g, 7, 16, 8, '#ffcc00'); hl(g, 17, 16, 8, '#ffcc00'); }
    poly(g, '#ff6600', [[14.5, 18], [17.5, 18], [16, 22]]);
    txt(g, 'NIGHT OWLS', 58, 16, { font: 's', color: '#ffcc66', align: 'center' }); txt(g, 'WEBRING', 58, 25, { font: 't', color: '#9999ff', align: 'center' }); }, { frames: 2, lt: '#3333aa', dk: '#000' });
  r.delay = [2600, 160]; return r; };

ART.b_moonbyte = () => b88((g) => { R(g, 0, 0, 88, 31, '#000011'); const r = rng(21); stars(g, r, 24, 2, 2, 84, 27); ell(g, '#ccccff', 15.5, 15.5, 10.3, 10.3);
  dgrad(g, 5, 5, 21, 21, [[0, '#ccccff'], [1, '#6666aa']], (x, y) => { const dx = x - 10.5, dy = y - 10.5; return dx * dx + dy * dy > 104 ? null : (x + y) / 30 - .15; });
  ell(g, '#9999cc', 12, 12, 2, 2); ell(g, '#9999cc', 18, 18, 2.6, 2.4); px(g, 19, 10, '#9999cc');
  txt(g, 'MOONBYTE', 57, 15, { font: 'sb', color: '#ccccff', align: 'center' }); txt(g, 'lunar pixel shop', 57, 24, { font: 't', color: '#6666cc', align: 'center' }); }, { lt: '#333366', dk: '#000' });

ART.b_kero = () => b88((g) => { R(g, 0, 0, 88, 31, '#99ff33'); for (let y = 3; y < 31; y += 6) for (let x = 3 + (y % 12 ? 3 : 0); x < 88; x += 6) px(g, x, y, '#66cc00');
  ell(g, '#006600', 16, 18, 11.5, 8.5); ell(g, '#33cc33', 16, 18, 10.5, 7.5); ell(g, '#006600', 10, 10.5, 4.4, 4.4); ell(g, '#006600', 22, 10.5, 4.4, 4.4); ell(g, '#ffffff', 10, 10.5, 3.3, 3.3); ell(g, '#ffffff', 22, 10.5, 3.3, 3.3); R(g, 10, 10, 2, 2, '#000'); R(g, 21, 10, 2, 2, '#000');
  [[10, 19], [11, 20], [12, 21], [13, 21], [14, 21], [15, 21], [16, 21], [17, 21], [18, 21], [19, 21], [20, 20], [21, 19]].forEach(p => px(g, p[0], p[1], '#006600')); px(g, 7, 17, '#ff99cc'); px(g, 8, 17, '#ff99cc'); px(g, 24, 17, '#ff99cc'); px(g, 25, 17, '#ff99cc');
  txt(g, "KERO'S", 59, 14, { font: 'sb', color: '#006600', align: 'center' }); txt(g, 'POND', 59, 24, { font: 'sb', color: '#ffffff', align: 'center', outline: '#006600' }); }, { border: 'flat', edge: '#006600' });

ART.b_copper = () => b88((g) => { R(g, 0, 0, 88, 31, '#000000'); const r = rng(42); stars(g, r, 30, 2, 2, 84, 27); ell(g, '#ff9933', 15.5, 15.5, 7.4, 7.4); dgrad(g, 8, 8, 15, 15, [[0, '#ffcc66'], [1, '#993300']], (x, y) => { const dx = x - 7.5, dy = y - 7.5; return dx * dx + dy * dy > 54 ? null : y / 14; });
  crisp(g, '#ccccff', t => { t.lineWidth = 1.2; t.beginPath(); t.ellipse(15.5, 15.5, 13, 3.4, -.35, .25, Math.PI - .25); t.stroke(); });
  txt(g, 'COPPER', 58, 17, { font: 'p', color: '#66ffff', align: 'center' }); txt(g, 'DEMOS + MODS', 58, 26, { font: 't', color: '#6699ff', align: 'center' }); }, { lt: '#336699', dk: '#000' });

ART.b_pxlcafe = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#663300'); for (let y = 2; y < 29; y += 2) hl(g, 1, y, 86, '#5a2d00');
  R(g, 8, 13, 13, 11, '#ffffff'); R(g, 9, 14, 11, 2, '#331a00'); R(g, 21, 15, 3, 1, '#fff'); R(g, 23, 16, 1, 4, '#fff'); R(g, 21, 20, 3, 1, '#fff'); R(g, 6, 24, 17, 2, '#ffffff');
  const st = f ? [[11, 10], [12, 8], [16, 11], [17, 9], [14, 6]] : [[12, 10], [11, 8], [17, 11], [16, 9], [14, 7]]; st.forEach(p => px(g, p[0], p[1], '#ffeecc'));
  txt(g, 'PIXEL', 57, 14, { font: 'sb', color: '#ffeecc', align: 'center' }); txt(g, 'CAFE', 57, 24, { font: 'sb', color: '#ffcc66', align: 'center' }); }, { frames: 2, delay: 330, lt: '#996633', dk: '#331a00' });

ART.b_static = () => b88((g, f) => { const r = rng(100 + f), sh = ['#000000', '#444444', '#888888', '#cccccc', '#ffffff']; for (let y = 0; y < 31; y++) for (let x = 0; x < 88; x += 2) R(g, x, y, 2, 1, sh[Math.floor(r() * r() * 5)]);
  R(g, 12, 8, 64, 15, '#000000'); frame(g, 12, 8, 64, 15, '#ffffff'); txt(g, 'RADIO STATIC', 44, 19, { font: 't', color: '#ffffff', align: 'center' }); }, { frames: 3, delay: 80, border: 'flat' });

ART.b_bookmark = () => b88((g) => { dgrad(g, 0, 0, 88, 31, [[0, '#ffff66'], [1, '#ff9900']]); const cx = 14.5, cy = 15.5; poly(g, '#000000', Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 4.6 : 10.5; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }));
  poly(g, '#ffffff', Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 3.2 : 8; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }));
  txt(g, 'BOOKMARK ME', 57, 13, { font: 't', color: '#000000', align: 'center' }); R(g, 37, 16, 40, 10, '#ffffff'); frame(g, 37, 16, 40, 10, '#000000'); hl(g, 38, 25, 39, '#999999'); txt(g, 'CTRL + D', 57, 24, { font: 't', color: '#000000', align: 'center' }); }, { lt: '#ffffcc', dk: '#994c00' });

ART.b_tubeshrine = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#000000'); const c = '#33ff66', d = '#0f662a'; frame(g, 5, 5, 22, 17, c); frame(g, 8, 8, 16, 11, d); hl(g, 9, 9 + f * 3, 14, c); R(g, 12, 22, 8, 2, d); hl(g, 9, 24, 14, c);
  txt(g, 'THE TUBE', 58, 14, { font: 's', color: c, align: 'center' }); txt(g, 'SHRINE', 58, 24, { font: 'sb', color: '#ccffdd', align: 'center' }); }, { frames: 3, delay: 200, border: 'flat', edge: '#33ff66' });

ART.b_frames = () => b88((g) => { R(g, 0, 0, 88, 31, '#330033'); R(g, 6, 6, 20, 19, '#ffffff'); R(g, 7, 7, 5, 17, '#ff99cc'); R(g, 13, 7, 12, 4, '#cc99ff'); R(g, 13, 12, 12, 12, '#eeeeee'); frame(g, 6, 6, 20, 19, '#000');
  txt(g, 'FRAMES', 58, 14, { font: 'sb', color: '#ff99cc', align: 'center' }); txt(g, 'ARE COOL OK', 58, 23, { font: 't', color: '#ffffff', align: 'center' }); }, { lt: '#993399', dk: '#000' });

// blinkies 150x20
function blinkie(draw, a, b, bg) { return { frames: [0, 1].map(f => { const g = mk(150, 20); R(g, 0, 0, 150, 20, bg); frame(g, 0, 0, 150, 20, '#000000');
  for (let x = 2; x < 148; x += 4) { R(g, x, 2, 2, 2, ((x >> 2) + f) % 2 ? a : b); R(g, x, 16, 2, 2, ((x >> 2) + f + 1) % 2 ? a : b); }
  for (let y = 6; y < 16; y += 4) { R(g, 2, y, 2, 2, ((y >> 2) + f) % 2 ? a : b); R(g, 146, y, 2, 2, ((y >> 2) + f + 1) % 2 ? a : b); }
  draw(g, f); return g; }), delay: 300 }; }
ART.bk_nightowl = () => blinkie((g, f) => { ell(g, '#ffff99', 16, 10, 4.2, 4.2); ell(g, '#000033', 18, 9, 3.6, 3.6); txt(g, 'NIGHT OWL', 80, 13, { font: 'sb', color: f ? '#ffff66' : '#ffffff', align: 'center' }); }, '#ffff66', '#3366ff', '#000033');
ART.bk_crt = () => blinkie((g, f) => { txt(g, 'CRT', 46, 13, { font: 'sb', color: '#66ff66', align: 'center' }); txt(g, '>', 68, 13, { font: 'sb', color: f ? '#ffffff' : '#66ff66', align: 'center' }); txt(g, 'LCD', 92, 13, { font: 's', color: '#337733', align: 'center' }); hl(g, 80, 10, 24, '#ff0033'); }, '#66ff66', '#0a330a', '#000000');
ART.bk_insomnia = () => blinkie((g, f) => { txt(g, 'CERTIFIED INSOMNIAC', 75, 13, { font: 't', color: f ? '#ffffff' : '#ffccee', align: 'center' }); }, '#ffffff', '#ff66cc', '#990066');
ART.bk_moth = () => blinkie((g, f) => { spr(g, 8, 5, MOTH[f ? 0 : 2], MOTHPAL); txt(g, 'MOTH MODE: ON', 84, 13, { font: 's', color: '#330066', align: 'center' }); }, '#9933ff', '#ffffff', '#ccccff');
