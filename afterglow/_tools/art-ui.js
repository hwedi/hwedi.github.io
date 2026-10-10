// ---------- backgrounds, chrome bits, counters, signs, mascot, cursors, smilies ----------
ART.bg_stars = () => {
  const N = 150, r = rng(7), stars = [];
  for (let i = 0; i < 70; i++) stars.push({ x: Math.floor(r() * N), y: Math.floor(r() * N), m: r(), ph: Math.floor(r() * 3), c: r() });
  const frames = [];
  for (let f = 0; f < 3; f++) {
    const g = mk(N, N);
    dgrad(g, 0, 0, N, N, [[0, '#000000'], [1, '#1a0820']], (x, y) => { const a = Math.sin(2 * Math.PI * (x / N + .1)) * Math.sin(2 * Math.PI * (y / N + .35)), b = Math.sin(4 * Math.PI * (x - y) / N); return Math.max(0, a * .28 + b * .1 - .04); });
    for (const s of stars) {
      const t = s.ph === f, W = (v) => ((v % N) + N) % N;
      if (s.m < .58) px(g, s.x, s.y, t ? '#886688' : '#4a2a4a');
      else if (s.m < .87) px(g, s.x, s.y, t ? '#ffffff' : (s.c < .34 ? '#cc99c4' : s.c < .67 ? '#cccc99' : '#99cccc'));
      else { const core = t ? '#ffffff' : '#ffd6f2', arm = t ? '#aa66aa' : '#4a2a4a';
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { px(g, W(s.x + dx), W(s.y + dy), arm); if (t && s.m > .94) px(g, W(s.x + dx * 2), W(s.y + dy * 2), '#4a2a4a'); }
        px(g, s.x, s.y, core); }
    }
    frames.push(g);
  }
  return { frames, delay: 620 };
};
ART.hdr = () => { const g = mk(4, 15); dgrad(g, 0, 0, 4, 15, [[0, '#8a2f8a'], [.45, '#5a1a6a'], [1, '#2e0f38']]); hl(g, 0, 0, 4, '#d07fd0'); hl(g, 0, 14, 4, '#1a0820'); return g; };
ART.hdr_pk = () => { const g = mk(4, 15); dgrad(g, 0, 0, 4, 15, [[0, '#cc3399'], [.45, '#990066'], [1, '#330033']]); hl(g, 0, 0, 4, '#ff99cc'); hl(g, 0, 14, 4, '#330033'); return g; };
const CHEV = ['#.#....', '.#.#...', '..#.#..', '...#.#.', '..#.#..', '.#.#...', '#.#....'];
ART.bul = () => { const g = mk(7, 7); spr(g, 0, 0, CHEV, { '#': '#ffb38a' }); return g; };
ART.bul_on = () => ({ frames: [0, 1].map(f => { const g = mk(7, 7); spr(g, f, 0, CHEV, { '#': f ? P.yl : P.pk2 }); return g; }), delay: 180 });
ART.star = () => { const g = mk(7, 7); spr(g, 0, 0, ['...#...', '...#...', '.#####.', '#######', '.#####.', '..#.#..', '.#...#.'], { '#': P.yl }); px(g, 3, 3, '#fff'); return g; };
// 7-segment counter digits, 10 cells of 11x15
ART.digits = () => {
  const g = mk(110, 15), on = '#66ff66', off = '#0a330a', SEG = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];
  for (let n = 0; n < 10; n++) { const x = n * 11; R(g, x, 0, 11, 15, '#000000'); const s = SEG[n], c = (k) => s.includes(k) ? on : off;
    R(g, x + 3, 1, 5, 2, c('a')); R(g, x + 3, 6, 5, 2, c('g')); R(g, x + 3, 12, 5, 2, c('d'));
    R(g, x + 1, 2, 2, 5, c('f')); R(g, x + 8, 2, 2, 5, c('b')); R(g, x + 1, 8, 2, 5, c('e')); R(g, x + 8, 8, 2, 5, c('c')); }
  return g;
};
ART.uc_sign = () => {
  const mkf = (f) => { const g = mk(39, 39);
    poly(g, '#000000', [[19.5, 0], [39, 19.5], [19.5, 39], [0, 19.5]]); poly(g, '#ffcc00', [[19.5, 2.6], [36.4, 19.5], [19.5, 36.4], [2.6, 19.5]]); poly(g, '#ffee66', [[19.5, 4], [24, 8.5], [8.5, 24], [4, 19.5]]);
    const k = '#000000', st = (pts, w = 2) => crisp(g, k, t => { t.lineWidth = w; t.lineCap = 'round'; t.lineJoin = 'round'; t.beginPath(); pts.forEach((p, i) => i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1])); t.stroke(); }, 110);
    ell(g, k, 23.5, 10.5, 2.6, 2.6);                              // head
    st([[22.5, 13.5], [18.5, 21.5]], 3);                          // torso, leaning into the work
    st([[18.5, 21.5], [15.5, 28.5]]); st([[18.5, 21.5], [22.5, 28.5], [24.5, 28.5]]);   // legs
    if (!f) { st([[21.5, 15.5], [15.5, 18.5]]); st([[17.5, 13.5], [10.5, 25.5]], 1.4); poly(g, k, [[8, 24], [13, 26.5], [10, 29.5], [7, 28]]); }
    else { st([[21.5, 15.5], [14.5, 14.5]]); st([[18.5, 11.5], [9.5, 19.5]], 1.4); poly(g, k, [[7, 17], [11, 21.5], [8, 23], [5.5, 20]]); px(g, 8, 13, k); px(g, 11, 11, k); px(g, 6, 15, k); }
    poly(g, k, [[26, 29.5], [33, 29.5], [29.5, 25]]);              // dirt pile
    return g; };
  return { frames: [mkf(0), mkf(1)], delay: 380 };
};
ART.uc_bar = () => ({ frames: [0, 1, 2, 3].map(f => { const g = mk(16, 12); for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) px(g, x, y, ((x + y + f * 4) % 16) < 8 ? '#ffcc00' : '#000000'); hl(g, 0, 0, 16, '#665200'); hl(g, 0, 11, 16, '#665200'); return g; }), delay: 110 });
ART.new = () => ({ frames: [0, 1].map(f => { const g = mk(31, 15), pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, o = k % 2 ? [12.2, 4.6] : [15.4, 7.4]; pts.push([15.5 + Math.cos(a) * o[0], 7.5 + Math.sin(a) * o[1]]); }
  poly(g, f ? '#ffff00' : '#ff0033', pts); txt(g, 'NEW!', 16, 10, { font: 't', color: f ? '#ff0033' : '#ffff66', align: 'center' }); return g; }), delay: 420 });
const RB = ['#ff0033', '#ff9900', '#ffff00', '#33ff33', '#3399ff', '#9933ff'];
ART.div_rainbow = () => ({ frames: [0, 1, 2, 3, 4, 5].map(f => { const g = mk(48, 4); for (let x = 0; x < 48; x++) { const c = RB[(Math.floor(x / 8) + 6 - f) % 6]; vl(g, x, 0, 4, c); px(g, x, 0, mix(c, '#ffffff', .55)); px(g, x, 3, mix(c, '#000000', .45)); } return g; }), delay: 90 });
ART.div_scope = () => ({ frames: [0, 1, 2, 3, 4, 5, 6, 7].map(f => { const g = mk(64, 17); R(g, 0, 0, 64, 17, '#000000');
  for (let x = 0; x < 64; x += 8) vl(g, x, 0, 17, '#062a06'); hl(g, 0, 8, 64, '#0a3a0a'); hl(g, 0, 0, 64, '#062a06'); hl(g, 0, 16, 64, '#062a06');
  let py = null; for (let x = 0; x < 64; x++) { const t = (x + f * 4) / 32 * Math.PI * 2, y = Math.round(8 - 5.6 * Math.sin(t) - 1.2 * Math.sin(t * 3 + 1)); const y0 = py === null ? y : py; for (let yy = Math.min(y0, y); yy <= Math.max(y0, y); yy++) { px(g, x, yy, '#66ff66'); } px(g, x, y - 1 < 0 ? 0 : y - 1, g.getImageData(x, Math.max(0, y - 1), 1, 1).data[1] > 200 ? '#66ff66' : '#1a7a1a'); py = y; }
  return g; }), delay: 70 });
// the mascot: static the moth. o outline, w wing, s spot, b body, a antenna
const MOTHPAL = { o: '#9966ff', w: '#eeeeff', s: '#ff66cc', b: '#663399', a: '#ccccff', e: '#ffff66' };
const MOTH = [[
  '.oo...........oo.', 'owwo..a...a..owwo', 'owswo..a.a..owswo', 'owwwwo..b..owwwwo', '.owwwwobebowwwwo.', '..owwwwbbbwwwwo..', '...oowwbbbwwoo...', '.....oobbboo.....', '.......bbb.......', '........b........'], [
  '......a...a......', '.......a.a.......', '........b........', 'ooooo..beb..ooooo', 'owwswoobbboowswwo', 'owwwwwwbbbwwwwwwo', '.ooowwwbbbwwwooo.', '....ooobbbooo....', '.......bbb.......', '........b........'], [
  '......a...a......', '.......a.a.......', '........b........', '.......beb.......', '....ooobbbooo....', '..oowwwbbbwwwoo..', '.owwwwobbbowwwwo.', 'owwswo.bbb.owswwo', 'owwwo...b...owwwo', '.ooo.........ooo.'], [
  '......a...a......', '.......a.a.......', '........b........', '.......oeo.......', '......owbwo......', '.....owwbwwo.....', '....owwsbswwo....', '...owwwwbwwwwo...', '..owwwwwbwwwwwo..', '..ooooooooooooo..']];
ART.moth = () => { const g = mk(17 * 4, 10); MOTH.forEach((m, i) => spr(g, i * 17, 0, m, MOTHPAL)); return g; };   // sheet: up, level, down, perched
ART.moth_gif = () => ({ frames: [0, 1, 2, 1].map(i => { const g = mk(17, 10); spr(g, 0, 0, MOTH[i], MOTHPAL); return g; }), delay: 90 });
// cursors. # black, o white
const CUR = { arrow: ['#', '##', '#o#', '#oo#', '#ooo#', '#oooo#', '#ooooo#', '#oooooo#', '#ooooooo#', '#oooooooo#', '#ooooooooo#', '#oooooo#####', '#ooo#oo#', '#oo##oo#', '#o#  #oo#', '##   #oo#', '#     #oo#', '      #oo#', '       ##'],
  hand: ['     ##', '    #oo#', '    #oo#', '    #oo#', '    #oo#', '    #oo###', '    #oo#oo###', '    #oo#oo#oo##', '    #oo#oo#oo#o#', '### #oo#oo#oo#o#', '#oo##oooooooooo#', '#ooo#oooooooooo#', ' #oo#oooooooooo#', '  #o#oooooooooo#', '  #oooooooooooo#', '   #ooooooooooo#', '   #oooooooooo#', '    #ooooooooo#', '    #ooooooooo#', '     #ooooooo#', '     #ooooooo#', '     #########'],
  ibeam: ['### ###', '#oo#oo#', '###o###', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '  #o#', '###o###', '#oo#oo#', '### ###'],
  wait: ['###########', '#ooooooooo#', '###########', ' #ooooooo#', ' #ooooooo#', ' #o#o#o#o#', '  #o#o#o#', '   #o#o#', '    #o#', '    #o#', '   #ooo#', '  #oo#oo#', ' #ooooooo#', ' #ooo#ooo#', ' #oo#o#oo#', '###########', '#ooooooooo#', '###########'] };
for (const k in CUR) ART['cur_' + k] = () => { const rows = CUR[k], w = Math.max(...rows.map(r => r.length)), g = mk(w, rows.length); spr(g, 0, 0, rows, { '#': '#000000', o: '#ffffff' }); return g; };
// smilies, 15x15
const smbase = () => { const g = mk(15, 15); ell(g, '#000000', 7.5, 7.5, 7.4, 7.4); ell(g, '#cc9900', 7.5, 7.5, 6.3, 6.3); ell(g, '#ffcc00', 7, 7, 5.6, 5.6); px(g, 4, 3, '#ffee99'); px(g, 5, 3, '#ffee99'); px(g, 3, 4, '#ffee99'); return g; };
const eyes = (g) => { R(g, 5, 4, 1, 3, '#000'); R(g, 9, 4, 1, 3, '#000'); };
const SM = {
  smile: g => { eyes(g); [[4, 8], [5, 9], [6, 10], [7, 10], [8, 10], [9, 9], [10, 8]].forEach(p => px(g, p[0], p[1], '#000')); },
  grin: g => { eyes(g); R(g, 4, 8, 7, 1, '#000'); R(g, 5, 9, 5, 1, '#fff'); R(g, 5, 10, 5, 1, '#000'); px(g, 4, 9, '#000'); px(g, 10, 9, '#000'); },
  wink: g => { R(g, 5, 4, 1, 3, '#000'); R(g, 8, 5, 3, 1, '#000'); [[4, 8], [5, 9], [6, 10], [7, 10], [8, 10], [9, 9], [10, 8]].forEach(p => px(g, p[0], p[1], '#000')); },
  tongue: g => { eyes(g); R(g, 4, 8, 7, 1, '#000'); R(g, 7, 9, 3, 2, '#ff3366'); px(g, 8, 11, '#ff3366'); },
  cool: g => { R(g, 3, 4, 9, 1, '#000'); R(g, 4, 5, 3, 2, '#000'); R(g, 8, 5, 3, 2, '#000'); px(g, 5, 5, '#6699ff'); px(g, 9, 5, '#6699ff'); [[5, 9], [6, 10], [7, 10], [8, 10], [9, 9]].forEach(p => px(g, p[0], p[1], '#000')); },
  shock: g => { R(g, 4, 4, 2, 2, '#000'); R(g, 9, 4, 2, 2, '#000'); px(g, 4, 4, '#fff'); px(g, 9, 4, '#fff'); R(g, 6, 8, 3, 3, '#000'); px(g, 7, 9, '#993300'); },
  sad: g => { eyes(g); [[4, 10], [5, 9], [6, 8], [7, 8], [8, 8], [9, 9], [10, 10]].forEach(p => px(g, p[0], p[1], '#000')); px(g, 10, 6, '#66ccff'); px(g, 10, 7, '#66ccff'); },
};
for (const k in SM) ART['sm_' + k] = () => { const g = smbase(); SM[k](g); return g; };
