// ---------- webring neighbours: kero's pond ----------
function frogX(g, cx, cy, o = {}) { const b = o.body || '#33cc33', d = o.dark || '#006600', eye = o.eye || '#000000';
  ell(g, d, cx, cy + 3, 11.5, 8.5); ell(g, b, cx, cy + 3, 10.5, 7.5); ell(g, d, cx - 6, cy - 4.5, 4.4, 4.4); ell(g, d, cx + 6, cy - 4.5, 4.4, 4.4); ell(g, '#ffffff', cx - 6, cy - 4.5, 3.3, 3.3); ell(g, '#ffffff', cx + 6, cy - 4.5, 3.3, 3.3);
  if (o.belly) ell(g, o.belly, cx, cy + 6, 6, 3.4);
  if (o.spots) [[-6, 3], [5, 1], [0, 6], [8, 6], [-9, 7]].forEach(p => R(g, cx + p[0], cy + p[1], 2, 2, o.spots));
  if (o.acc !== 'shades') { R(g, cx - 6, cy - 5, 2, 2, eye); R(g, cx + 5, cy - 5, 2, 2, eye); } else { R(g, cx - 10, cy - 6, 20, 2, '#000'); R(g, cx - 9, cy - 5, 7, 3, '#000'); R(g, cx + 2, cy - 5, 7, 3, '#000'); px(g, cx - 7, cy - 4, '#6699ff'); px(g, cx + 4, cy - 4, '#6699ff'); }
  for (let i = -6; i <= 5; i++) px(g, cx + i, cy + (Math.abs(i + .5) > 5 ? 4 : Math.abs(i + .5) > 4 ? 5 : 6), d);
  if (o.cheek !== false) { R(g, cx - 9, cy + 2, 2, 1, o.cheek || '#ff99cc'); R(g, cx + 8, cy + 2, 2, 1, o.cheek || '#ff99cc'); }
  if (o.acc === 'crown') { poly(g, '#996600', [[cx - 6, cy - 8], [cx - 6, cy - 15], [cx - 3, cy - 11], [cx, cy - 16], [cx + 3, cy - 11], [cx + 6, cy - 15], [cx + 6, cy - 8]]); poly(g, '#ffcc00', [[cx - 5, cy - 9], [cx - 5, cy - 13], [cx - 3, cy - 10], [cx, cy - 14.5], [cx + 3, cy - 10], [cx + 5, cy - 13], [cx + 5, cy - 9]]); px(g, cx, cy - 11, '#ff0033'); }
  if (o.acc === 'hat') { R(g, cx - 5, cy - 17, 10, 9, '#000000'); R(g, cx - 8, cy - 9, 16, 2, '#000000'); R(g, cx - 5, cy - 11, 10, 2, '#cc0000'); }
  if (o.acc === 'bow') { poly(g, '#ff3399', [[cx + 2, cy - 12], [cx + 7, cy - 9.5], [cx + 2, cy - 7]]); poly(g, '#ff3399', [[cx + 12, cy - 12], [cx + 7, cy - 9.5], [cx + 12, cy - 7]]); R(g, cx + 6, cy - 10, 2, 2, '#cc0066'); }
}
const FROGS = [{}, { body: '#3399ff', dark: '#003399', spots: '#000033', cheek: false }, { body: '#ff99cc', dark: '#cc3366', cheek: '#ff3366', acc: 'bow' }, { body: '#ffcc33', dark: '#996600', belly: '#ffee99', acc: 'crown' }, { body: '#99cc00', dark: '#336600', eye: '#cc0000', belly: '#ffffcc' }, { body: '#e0e0f0', dark: '#666688', cheek: false, acc: 'hat' }, { body: '#33cc33', dark: '#006600', acc: 'shades', cheek: false }];
ART.frogs = () => { const g = mk(26 * FROGS.length, 32); FROGS.forEach((f, i) => frogX(g, 13 + 26 * i, 19, f)); return g; };
ART.frog_hop = () => ({ frames: [0, 1, 2, 1].map(f => { const g = mk(26, 34); if (f) ell(g, 'rgba(0,60,30,.35)', 13, 31, 9 - f * 2, 2); frogX(g, 13, 21 - f * 4, {}); return g; }), delay: [900, 90, 140, 90] });
ART.t_pond = () => { const g = mk(64, 64); R(g, 0, 0, 64, 64, '#66cc99');
  crisp(g, '#99e6bb', t => { t.lineWidth = 1; for (const [x, y, r] of [[48, 14, 9], [48, 14, 5], [14, 46, 8]]) { t.beginPath(); t.arc(x, y, r, .3, 2.6); t.stroke(); } });
  const pad = (x, y, rx, ry, a) => { ell(g, '#1f7a3d', x, y, rx + 1, ry + 1); ell(g, '#33a352', x, y, rx, ry); poly(g, '#66cc99', [[x, y], [x + Math.cos(a) * (rx + 3), y + Math.sin(a) * (ry + 3)], [x + Math.cos(a + .6) * (rx + 3), y + Math.sin(a + .6) * (ry + 3)]]); px(g, x - 2, y - 2, '#7fd695'); px(g, x - 3, y - 1, '#7fd695'); };
  pad(17, 16, 9, 7, .4); pad(44, 44, 7, 5.5, 3.6); pad(58, 60, 4, 3, 2);
  [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => px(g, 47 + dx, 40 + dy, '#ff99cc')); px(g, 47, 40, '#ffff66'); px(g, 30, 30, '#99e6bb'); px(g, 5, 58, '#99e6bb'); px(g, 34, 6, '#99e6bb'); return g; };
ART.b_kero_ribbit = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#ccff99'); frogX(g, 15, 15 - f, {}); txt(g, 'RIBBIT', 56, 14, { font: 'p', color: '#006600', align: 'center' }); txt(g, f ? '* ! *' : '*   *', 56, 24, { font: 't', color: '#ff3399', align: 'center' }); }, { frames: 2, delay: 420, border: 'flat', edge: '#006600' });
ART.b_campaign = () => b88((g, f) => { R(g, 0, 0, 88, 31, '#ffffff'); txt(g, 'THE 85 HZ', 44, 12, { font: 'sb', color: '#cc0000', align: 'center' }); txt(g, 'CAMPAIGN', 44, 22, { font: 'sb', color: '#000000', align: 'center' }); if (f) txt(g, 'JOIN NOW', 44, 29, { font: 't', color: '#0000cc', align: 'center' }); }, { frames: 2, delay: 500, border: 'flat', edge: '#cc0000' });
// browser-tab icon: the monitor, glowing
ART.favicon = () => { const g = mk(32, 32); const s = crtIcon(g, 2, 3, 28, 21, { screen: '#330066' }); dgrad(g, s.x, s.y, s.w, s.h, [[0, '#1a0a4a'], [.55, '#99198c'], [1, '#ff66aa']]); R(g, s.x + 3, s.y + 3, 9, 2, '#ffffff'); R(g, s.x + 3, s.y + 7, 14, 1, '#66ffff'); return { frames: [g], kind: 'png' }; };
