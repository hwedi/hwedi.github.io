(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem('afterglow.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  num(k, d = 0) { const v = store.get(k, d); return typeof v === 'number' && isFinite(v) ? v : d; },   // a saved number, or the default when the save holds anything else
  set(k, v) { try { localStorage.setItem('afterglow.' + k, JSON.stringify(v)); } catch (e) { /* private window: settings just don't stick */ } },
};
// "less motion" can be switched on or off while the page is open. some browsers skip the change event if the value was read first, so it is also checked once a second
const RM = matchMedia('(prefers-reduced-motion: reduce)'), rmSubs = []; let rmWas = RM.matches;
const rmCheck = () => { const m = RM.matches; if (m !== rmWas) { rmWas = m; rmSubs.forEach(f => f(m)); } };
if (RM.addEventListener) RM.addEventListener('change', rmCheck); else if (RM.addListener) RM.addListener(rmCheck);
setInterval(rmCheck, 1000);
const monitor = $('#monitor'), tube = $('#tube'), geom = $('#geom'), pwr = $('#pwr'), raster = $('#raster'), scroller = $('#scroller'), page = $('#page'), hud = $('#hud');

/* =====================================================================
   SOUND: relay clunks, the degauss coil, and a four-channel "midi" player
   ===================================================================== */
const SND = (() => {
  let ctx = null, master, sfx, mus, bus = null, an, nbuf, fxOn = true;   // bus: the tune that is playing. each tune gets its own, so stopping one cuts every note it had queued
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = .85;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; master.connect(comp); comp.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = .55; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = .5; an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = .55; mus.connect(an); an.connect(master);
    const dl = ctx.createDelay(1); dl.delayTime.value = .31; const fb = ctx.createGain(); fb.gain.value = .26; const wet = ctx.createGain(); wet.gain.value = .22;
    mus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
    nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function noise(t, dur, o = {}) {
    const s = ctx.createBufferSource(); s.buffer = nbuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur); f.Q.value = o.q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .3, t + (o.a || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.out || sfx); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  function tone(t, dur, o = {}) {
    const s = ctx.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f || 440, t); if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.g || .2, t + (o.a || .005)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(g); g.connect(o.out || sfx); s.start(t); s.stop(t + dur + .02);
  }
  const ok = () => fxOn && ensure();
  const api = {
    set fx(v) { fxOn = !!v; }, get fx() { return fxOn; },
    click() { if (!ok()) return; const t = ctx.currentTime; noise(t, .012, { f: 2600, q: .8, g: .16 }); tone(t, .02, { f: 190, g: .1 }); },
    nav() { if (!ok()) return; const t = ctx.currentTime; noise(t, .016, { type: 'highpass', f: 2100, g: .1 }); tone(t, .012, { f: 1250, g: .035 }); },
    relay(at = 0, g = .4) { if (!ok()) return; const t = ctx.currentTime + at; noise(t, .03, { type: 'lowpass', f: 950, g }); tone(t, .07, { f: 74, f2: 48, g: g * .9 }); },
    degauss(k = 1) {
      if (!ok()) return; const t = ctx.currentTime, dur = .5 + 1.25 * k;
      api.relay(0, .34);
      const out = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 560; lp.Q.value = 1.2; lp.connect(out); out.connect(sfx);
      out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.85 * k + .05, t + .03); out.gain.exponentialRampToValueAtTime(.0001, t + dur);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.setValueAtTime(9, t); lfo.frequency.linearRampToValueAtTime(24, t + dur); lg.gain.setValueAtTime(.38 * k, t); lg.gain.exponentialRampToValueAtTime(.001, t + dur); lfo.connect(lg); lg.connect(out.gain); lfo.start(t); lfo.stop(t + dur);
      [[60, 'sawtooth', .55], [120, 'square', .22], [180, 'sawtooth', .1]].forEach(([f, type, g]) => { const o = ctx.createOscillator(), gg = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.linearRampToValueAtTime(-35, t + dur); gg.gain.value = g; o.connect(gg); gg.connect(lp); o.start(t); o.stop(t + dur + .05); });
      noise(t, .28, { f: 210, f2: 80, q: 7, g: .5 * k }); tone(t, .5, { f: 58, f2: 40, g: .5 * k });
      api.relay(dur + .55, .13);
    },
    powerOn() { if (!ok()) return; const t = ctx.currentTime; api.relay(0, .45); tone(t + .03, .6, { f: 46, f2: 36, g: .32 });
      for (let i = 0; i < 9; i++) noise(t + .08 + Math.random() * .7, .02 + Math.random() * .03, { type: 'highpass', f: 4200 + Math.random() * 3000, g: .05 + Math.random() * .05 }); },
    powerOff() { if (!ok()) return; const t = ctx.currentTime; api.relay(0, .4); tone(t + .02, .3, { f: 880, f2: 70, g: .09 }); for (let i = 0; i < 5; i++) noise(t + .05 + Math.random() * .35, .02, { type: 'highpass', f: 5000, g: .05 }); },
    ribbit() { if (!ok()) return; const t = ctx.currentTime; for (const [d, f] of [[0, 250], [.13, 300]]) { tone(t + d, .1, { type: 'sawtooth', f, f2: f * .55, g: .16 }); noise(t + d, .09, { f: 900, q: 3, g: .07 }); } },
    zap() { if (!ok()) return; const t = ctx.currentTime; noise(t, .09, { type: 'highpass', f: 3200, g: .07 }); },
  };

  /* ---- the midi player. three tunes, written for this page, so nobody can sue me ---- */
  const NN = { C: 0, 'C#': 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, Bb: 10, B: 11 };
  const hz = (n) => { const m = /^([A-G][#b]?)(\d)$/.exec(n); return 440 * Math.pow(2, (NN[m[1]] + (m[2] - 4) * 12 - 9) / 12); };
  function seq(inst, v, str, at = 0, def = 2) { let t = at; const out = []; for (const tok of str.trim().split(/\s+/)) { const [n, d] = tok.split(':'), len = d ? +d : def; if (n !== '-') out.push({ t, inst, f: hz(n), d: len, v }); t += len; } return out; }
  const drum = (k, v, steps, bar, len) => steps.map(s => ({ t: bar * len + s, inst: k, v, d: 1 }));
  function nightdrive() {
    const prog = [['A2', 'A3 C4 E4 A4'], ['F2', 'A3 C4 F4 A4'], ['C3', 'G3 C4 E4 G4'], ['G2', 'G3 B3 D4 G4'], ['A2', 'A3 C4 E4 A4'], ['F2', 'A3 C4 F4 A4'], ['D3', 'A3 D4 F4 A4'], ['E2', 'G#3 B3 E4 G#4']];
    const lead = ['E5:4 D5:2 C5:2 A4:4 C5:2 E5:2', 'F5:4 E5:2 C5:2 A4:6 -:2', 'G5:4 E5:2 C5:2 E5:4 G5:2 E5:2', 'D5:6 B4:2 G4:4 B4:2 D5:2', 'E5:2 A5:2 G5:2 E5:2 C5:4 E5:4', 'F5:2 A5:2 G5:2 F5:2 E5:2 C5:2 A4:4', 'D5:4 F5:2 A5:2 G5:4 F5:2 D5:2', 'E5:4 G#5:2 B5:2 G#5:4 E5:4'];
    let ev = [];
    prog.forEach(([b, ch], i) => { const o = i * 16, root = hz(b), tones = ch.split(' ').map(hz);
      [0, 0, 1, 0, 0, 1, 0, 1].forEach((up, k) => ev.push({ t: o + k * 2, inst: 'bass', f: root * (up ? 2 : 1), d: 1.6, v: .9 }));
      [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 1, 2, 3].forEach((x, k) => ev.push({ t: o + k, inst: 'arp', f: tones[x], d: 1, v: .3 }));
      ev = ev.concat(seq('lead', .5, lead[i], o), drum('k', .9, i % 4 === 3 ? [0, 8, 11] : [0, 8], i, 16), drum('s', .5, [4, 12], i, 16), drum('h', .2, [0, 2, 4, 6, 8, 10, 12, 14], i, 16), drum('h', .32, [2, 6, 10, 14], i, 16)); });
    return { step: 60 / 118 / 4, len: 128, ev };
  }
  function mothwaltz() {
    const prog = [['C3', 'E4 G4'], ['A2', 'E4 A4'], ['F2', 'F4 A4'], ['G2', 'D4 G4'], ['C3', 'E4 G4'], ['A2', 'E4 A4'], ['F2', 'F4 A4'], ['G2', 'D4 B4']];
    const lead = ['E5 G5 C6', 'B5 A5 E5', 'F5 A5 C6', 'B5:3 A5:1 G5', 'E5 G5 E6', 'D6 C6 A5', 'A5 G5 F5', 'G5:4 -:2'];
    let ev = [];
    prog.forEach(([b, ch], i) => { const o = i * 6, tones = ch.split(' ').map(hz);
      ev.push({ t: o, inst: 'bass', f: hz(b), d: 2, v: .55 }); for (const s of [2, 4]) tones.forEach(f => ev.push({ t: o + s, inst: 'arp', f, d: 1.4, v: .5 }));
      ev = ev.concat(seq('bell', .95, lead[i], o)); if (i % 2 === 0) ev.push({ t: o, inst: 'h', v: .14, d: 1 }); });
    return { step: 60 / 138 / 2, len: 48, ev };
  }
  function pixelrain() {
    const prog = [['D2', 'A4 D5 F5 A5 D5 F5 A5 C6', 'F5:6 E5:2 D5:8'], ['Bb1', 'Bb4 D5 F5 Bb5 D5 F5 Bb5 D6', 'D5:6 F5:2 Bb5:8'], ['F2', 'A4 C5 F5 A5 C5 F5 A5 C6', 'A5:6 G5:2 F5:8'], ['C2', 'G4 C5 E5 G5 C5 E5 G5 E5', 'E5:6 G5:2 C5:8']];
    let ev = [];
    prog.forEach(([b, arp, lead], i) => { const o = i * 16; ev.push({ t: o, inst: 'pad', f: hz(b) * 2, d: 15, v: .4 }, { t: o, inst: 'bass', f: hz(b), d: 14, v: .42 });
      ev = ev.concat(seq('bell', .5, arp, o), seq('lead', .34, lead, o), drum('h', .1, [4, 12], i, 16)); });
    return { step: 60 / 92 / 4, len: 64, ev };
  }
  const SONGS = [['nightdrive.mid', nightdrive], ['moth_waltz.mid', mothwaltz], ['pixel_rain.mid', pixelrain]];
  function voice(e, t, step) {
    const dur = e.d * step;
    if (e.inst === 'k') return tone(t, .13, { f: 150, f2: 44, g: .5 * e.v, out: bus });
    if (e.inst === 's') { noise(t, .12, { f: 1900, q: .7, g: .5 * e.v, out: bus }); return tone(t, .06, { f: 190, g: .25 * e.v, out: bus }); }
    if (e.inst === 'h') return noise(t, .035, { type: 'highpass', f: 7200, g: .5 * e.v, out: bus });
    const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.connect(g); g.connect(bus);
    const mk = (type, mul = 1, det = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = e.f * mul; o.detune.value = det; o.connect(f); o.start(t); return o; };
    let os = [], end = t + dur;
    if (e.inst === 'lead') { f.frequency.value = 2600; os = [mk('square')]; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(e.f * .006, t + Math.min(dur, .3)); l.connect(lg); lg.connect(os[0].frequency); l.start(t); l.stop(end + .1);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.42 * e.v, t + .012); g.gain.setTargetAtTime(.3 * e.v, t + .02, .08); g.gain.setTargetAtTime(.0001, end - .02, .03); end += .12; }
    else if (e.inst === 'arp') { f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(700, t + .16); os = [mk('square')]; g.gain.setValueAtTime(.3 * e.v, t); g.gain.exponentialRampToValueAtTime(.0001, t + Math.min(.2, dur + .08)); end = t + .24; }
    else if (e.inst === 'bass') { f.frequency.value = 520; os = [mk('triangle'), mk('sawtooth', 1, 4)]; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.15 * e.v, t + .008); g.gain.setTargetAtTime(.0001, end - .03, .03); end += .1; }
    else if (e.inst === 'bell') { f.frequency.value = 3400; os = [mk('sine'), mk('triangle', 2), mk('sine', 4.02)]; g.gain.setValueAtTime(.2 * e.v, t); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.5, dur * 1.8)); end = t + Math.max(.55, dur * 1.9); }
    else { f.frequency.value = 760; os = [mk('sawtooth', 1, -7), mk('sawtooth', 1, 8)]; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.07 * e.v, t + .25); g.gain.setTargetAtTime(.0001, end - .1, .12); end += .5; }
    os.forEach(o => o.stop(end));
  }
  let song = null, cur = 0, timer = 0, t0 = 0, idx = 0, lap = 0;
  function pump() { if (!song) return; const ahead = ctx.currentTime + (document.hidden ? 1.7 : .26);
    for (let guard = 0; guard < 600; guard++) { const e = song.ev[idx], t = t0 + (lap * song.len + e.t) * song.step; if (t > ahead) break; if (t > ctx.currentTime - .05) voice(e, Math.max(t, ctx.currentTime), song.step); if (++idx >= song.ev.length) { idx = 0; lap++; } } }
  api.songs = SONGS.map(s => s[0]);
  api.play = (i = cur) => { if (!ensure()) return false; api.stop(); cur = (i + SONGS.length) % SONGS.length; song = SONGS[cur][1](); song.ev.sort((a, b) => a.t - b.t); idx = 0; lap = 0; t0 = ctx.currentTime + .12; bus = ctx.createGain(); bus.connect(mus); timer = setInterval(pump, 45); pump(); return true; };
  api.select = (i) => { cur = (i + SONGS.length) % SONGS.length; };
  api.stop = () => { if (!song) return; clearInterval(timer); song = null; const old = bus; bus = null; old.gain.setTargetAtTime(.0001, ctx.currentTime, .03); setTimeout(() => old.disconnect(), 400); };   // fade the old tune out, then unplug it: notes it queued ahead never sound
  Object.defineProperties(api, { playing: { get: () => !!song }, track: { get: () => cur } });
  api.levels = (n) => { const out = new Array(n).fill(0); if (!song || !an) return out; const d = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(d); for (let i = 0; i < n; i++) { const a = Math.floor(Math.pow(i / n, 1.7) * 44), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / n, 1.7) * 44)); let m = 0; for (let k = a; k < b; k++) m = Math.max(m, d[k]); out[i] = m / 255; } return out; };
  return api;
})();

/* =====================================================================
   THE TUBE: picture maths, glass overlays, power, degauss, menu, pointer
   ===================================================================== */
const CRT = (() => {
  // real barrel distortion of live HTML needs an SVG displacement filter. Blink runs it on the GPU; elsewhere the glass is shaded instead.
  const blink = /Chrome\//.test(navigator.userAgent) || !!window.chrome;
  const DEF = { bright: 50, contrast: 70, focus: 70, temp: 0, phosphor: 0, hsize: 50, vsize: 50, hpos: 50, vpos: 50, tilt: 50, trap: 50, para: 50, vhold: 50,
    curve: blink ? 42 : 0, conv: 40, mask: 0, maskv: 55, scan: 55, glow: 55, noise: 40, flick: 1, sound: 1, lcd: 0 };
  // the on-screen menu. [setting, label] is a 0-100 slider, [setting, label, [choices]] is a choice, and '!name' is a button
  const MENU = {
    PICTURE: [['bright', 'BRIGHTNESS'], ['contrast', 'CONTRAST'], ['focus', 'FOCUS'], ['temp', 'COLOR TEMP', ['9300K', '6500K', '5000K']], ['phosphor', 'PHOSPHOR', ['RGB COLOR', 'P1 GREEN', 'P3 AMBER', 'P4 WHITE']]],
    GEOMETRY: [['hsize', 'H-SIZE'], ['vsize', 'V-SIZE'], ['hpos', 'H-POSITION'], ['vpos', 'V-POSITION'], ['tilt', 'ROTATION'], ['trap', 'TRAPEZOID'], ['para', 'PARALLELOGRAM'], ['vhold', 'V-HOLD']],
    TUBE: [['curve', 'CURVATURE'], ['conv', 'CONVERGENCE'], ['mask', 'MASK', ['GRILLE', 'SLOT MASK', 'DOT TRIAD', 'NONE']], ['maskv', 'MASK DEPTH'], ['scan', 'SCANLINES'], ['glow', 'GLOW'], ['noise', 'STATIC'], ['flick', 'FLICKER', ['OFF', 'ON']]],
    SETUP: [['sound', 'SOUND FX', ['OFF', 'ON']], ['lcd', 'LCD MODE', ['OFF', 'ON (BORING)']], ['!degauss', 'DEGAUSS'], ['!recall', 'RECALL FACTORY SETTINGS'], ['!exit', 'EXIT MENU']],
  };
  // saved settings come back one at a time, and only as a whole number inside the setting's range. an old or damaged save can never wreck the picture.
  // outside Chrome the bend is an experiment nobody has checked, so there CURVATURE always starts at 0: if it draws badly, a reload puts it right
  const st = Object.assign({}, DEF), saved = store.get('crt', null);
  if (saved && typeof saved === 'object') Object.values(MENU).flat().forEach(([k, , opts]) => { const v = saved[k]; if (k in DEF && typeof v === 'number' && isFinite(v) && (blink || k !== 'curve')) st[k] = clamp(Math.round(v), 0, opts ? opts.length - 1 : 100); });
  // eco: what had to be switched off to keep this device smooth. 0 = nothing. 1 = the bend and the glow. 2 = every blended glass layer too ("lite").
  // each level is only remembered after two slow visits in a row (the counters ecoN and liteN)
  const ecoN = store.num('eco') | 0, liteN = store.num('lite') | 0;
  let eco = liteN >= 2 ? 2 : ecoN >= 2 ? 1 : 0, on = true, S = 1, W = 0, H = 0, dpr = window.devicePixelRatio || 1;
  const fx = $('#crt-fx'), ovScan = $('#ov-scan'), ovMask = $('#ov-mask'), ovGain = $('#ov-gain'), ovTint = $('#ov-tint'), blk = $('#blk'), cur = $('#cur'), osd = $('#osd'), toastEl = $('#toast');
  const tileURL = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = fn(x, y), i = (y * w + x) * 4; im.data[i] = p[0] * 255; im.data[i + 1] = p[1] * 255; im.data[i + 2] = p[2] * 255; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c.toDataURL(); };
  const cache = {};
  const memo = (k, f) => cache[k] || (cache[k] = f());

  function scanTile() {
    const a = st.scan / 100 * .76, P = Math.max(2, Math.round((W < 560 ? 2.6 : 3) * dpr)), wd = .56, rows = [];
    for (let j = 0; j < P; j++) { let acc = 0; for (let k = 0; k < 16; k++) { const t = (j + (k + .5) / 16) / P; let d = Math.abs(t - (1 - .5 / P)); d = Math.min(d, 1 - d); acc += d < wd / 2 ? .5 + .5 * Math.cos(Math.PI * d / (wd / 2)) : 0; } rows.push(1 - a * acc / 16); }
    return { url: tileURL(1, P, (x, y) => [rows[y], rows[y], rows[y]]), w: 1 / dpr, h: P / dpr, t: rows.reduce((s, v) => s + v, 0) / P };
  }
  function maskTile() {
    const m = 1 - st.maskv / 100 * .56, w = Math.max(1, Math.round(dpr)), col = (i) => i === 0 ? [1, m, m] : i === 1 ? [m, 1, m] : [m, m, 1]; let url, tw, th, t = (1 + 2 * m) / 3;
    if (st.mask === 0) { tw = 3 * w; th = 1; url = tileURL(tw, th, (x) => col(Math.floor(x / w) % 3)); }
    else if (st.mask === 1) { tw = 6 * w; th = 6 * w; const gap = Math.max(1, Math.round(w * .8)); url = tileURL(tw, th, (x, y) => { const tri = Math.floor(x / (3 * w)), yy = (y + (tri ? 3 * w : 0)) % (6 * w); return yy >= 6 * w - gap ? [m * .7, m * .7, m * .7] : col(Math.floor(x / w) % 3); }); t *= 1 - .3 * gap / (6 * w); }
    else { tw = 6 * w; th = 4 * w; url = tileURL(tw, th, (x, y) => { const row = Math.floor(y / (2 * w)), xx = (x + (row ? Math.floor(1.5 * w) : 0)) % (3 * w), yy = y % (2 * w); const c = col(Math.floor(xx / w) % 3); return yy === 2 * w - 1 && w > 1 ? c.map(v => v * .8) : c; }); }
    return { url, w: tw / dpr, h: th / dpr, t };
  }

  /* --- filter graph: (roll) -> (line jitter) -> barrel, once per colour gun --- */
  const need = { roll: false, jit: false, mag: false }; let mapKey = '', mapURL = '', fxTok = 0, fxOn = false, kS = 0, kD = 0;
  const svgWanted = () => on && !st.lcd && !eco && (st.curve > 0 || (blink && need.mag));
  function makeMap(asp) { const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n), d = im.data, ax = asp >= 1 ? 1 / asp : 1, ay = asp >= 1 ? 1 : asp;   // the longer edge sags more, as on a real spherical tube
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const u = (x + .5) / n * 2 - 1, v = (y + .5) / n * 2 - 1, i = (y * n + x) * 4; d[i] = Math.round(127.5 + 127.5 * u * v * v * ax); d[i + 1] = Math.round(127.5 + 127.5 * v * u * u * ay); d[i + 2] = 128; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c.toDataURL('image/png'); }
  const jitMap = () => memo('jit', () => { const c = document.createElement('canvas'); c.width = 2; c.height = 160; const g = c.getContext('2d'), im = g.createImageData(2, 160); let v = 0;
    for (let y = 0; y < 160; y++) { if (Math.random() < .3) v = (Math.random() * 2 - 1) * (Math.random() < .25 ? 1 : .3); const r = Math.round(128 + 127 * v); for (let x = 0; x < 2; x++) { const i = (y * 2 + x) * 4; im.data[i] = r; im.data[i + 1] = 128; im.data[i + 2] = 128; im.data[i + 3] = 255; } }
    g.putImageData(im, 0, 0); return c.toDataURL('image/png'); });
  // the magnet's field: a swirl plus a pinch, fading to nothing at the rim (neutral grey = no push)
  const magMap = () => memo('mag', () => { const n = 128, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n), d = im.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const u = (x + .5) / n * 2 - 1, v = (y + .5) / n * 2 - 1, r = Math.hypot(u, v), w = r < 1 ? Math.pow(1 - r * r, 2) : 0, i = (y * n + x) * 4;
      d[i] = Math.round(127.5 + 127.5 * clamp(3 * w * (-v * .9 + u * .5), -1, 1)); d[i + 1] = Math.round(127.5 + 127.5 * clamp(3 * w * (u * .9 + v * .5), -1, 1)); d[i + 2] = 128; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c.toDataURL('image/png'); });
  async function buildFx() {
    const tok = ++fxTok;
    if (!svgWanted() || !W || !H) { fx.textContent = ''; fxOn = false; return paint(); }
    const key = String(Math.round(W / H * 160));
    if (key !== mapKey || !mapURL) { const url = makeMap(W / H), im = new Image(); im.src = url; try { await im.decode(); } catch (e) { /* draw anyway */ } if (tok !== fxTok) return; mapKey = key; mapURL = url; }
    const k = st.curve / 100 * .085; kS = k * Math.max(W, H); kD = st.conv / 100 * 3.4 * clamp(Math.max(W, H) / 1200, .5, 1.6);
    let src = 'SourceGraphic', h = '';
    if (need.roll) { h += `<feOffset id="fx-ra" in="SourceGraphic" dx="0" dy="0" result="ra"/><feOffset id="fx-rb" in="SourceGraphic" dx="0" dy="${H}" result="rb"/><feMerge result="roll"><feMergeNode in="ra"/><feMergeNode in="rb"/></feMerge>`; src = 'roll'; }
    if (need.jit) { h += `<feImage id="fx-jm" href="${jitMap()}" x="0" y="${-H}" width="${W}" height="${H * 2}" preserveAspectRatio="none" result="jm"/><feDisplacementMap id="fx-jd" in="${src}" in2="jm" scale="0" xChannelSelector="R" yChannelSelector="G" result="jit"/>`; src = 'jit'; }
    if (need.mag) h += `<feFlood flood-color="#808080" result="mn"/><feImage id="fx-mi" href="${magMap()}" x="-9" y="-9" width="4" height="4" preserveAspectRatio="none" result="mi"/><feMerge result="mm"><feMergeNode in="mn"/><feMergeNode in="mi"/></feMerge>`;
    const pre = (id) => need.mag ? `<feDisplacementMap id="fx-m${id}" in="${src}" in2="mm" scale="0" xChannelSelector="R" yChannelSelector="G" result="m${id}"/>` : '';
    const one = (id, sc, row) => pre(id) + `<feDisplacementMap id="fx-${id}" in="${need.mag ? 'm' + id : src}" in2="map" scale="${sc.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="d${id}"/><feColorMatrix in="d${id}" type="matrix" values="${row}" result="${id}"/>`;
    if (kD > .05) h += one('r', kS + kD, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0') + one('g', kS, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0') + one('b', kS - kD, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0') + '<feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/>';
    else h += pre('g') + `<feDisplacementMap id="fx-g" in="${need.mag ? 'mg' : src}" in2="map" scale="${kS.toFixed(2)}" xChannelSelector="R" yChannelSelector="G"/>`;
    let mp = document.getElementById('fx-map');
    if (!mp) { fx.innerHTML = '<feImage id="fx-map" x="0" y="0" preserveAspectRatio="none" result="map"/>'; mp = document.getElementById('fx-map'); }
    if (mp.getAttribute('href') !== mapURL) mp.setAttribute('href', mapURL); mp.setAttribute('width', W); mp.setAttribute('height', H);
    while (mp.nextSibling) mp.nextSibling.remove(); mp.insertAdjacentHTML('afterend', h); fxOn = true; paint(); if (need.mag) magApply();
  }
  const fxAttr = (id, a, v) => { const n = document.getElementById('fx-' + id); if (n) n.setAttribute(a, v); };
  function converge(extra) { if (!fxOn) return; fxAttr('r', 'scale', (kS + kD + extra).toFixed(2)); fxAttr('b', 'scale', (kS - kD - extra).toFixed(2)); }

  /* --- everything that depends on a setting --- */
  let wobble = { hue: 0, sat: 1 };
  function filterStr() {
    if (eco > 1) return 'none';   // lite: without a graphics chip even a plain colour filter over the whole picture costs half the frames
    const mono = st.phosphor > 0, gain = .55 + st.contrast / 100 * .75, low = st.bright < 25 ? .62 + .38 * st.bright / 25 : 1, blurPx = (100 - st.focus) / 100 * 1.3;
    return `${fxOn ? 'url(#crt-fx) ' : ''}${mono ? 'grayscale(1) ' : ''}${wobble.hue ? `hue-rotate(${wobble.hue.toFixed(1)}deg) ` : ''}blur(${blurPx.toFixed(2)}px) brightness(${(gain * low).toFixed(3)}) contrast(${(1 + (st.contrast - 70) / 220).toFixed(3)}) saturate(${mono ? 1 : (1.22 * wobble.sat).toFixed(2)})`;
  }
  function paint() {
    const lcd = !!st.lcd, mono = st.phosphor > 0, c = tube.classList;
    c.toggle('flat', lcd); c.toggle('no-mask', mono || st.mask === 3 || st.maskv === 0); c.toggle('no-scan', st.scan === 0); c.toggle('no-halo', st.glow === 0 || eco > 0); c.toggle('no-noise', st.noise === 0);
    c.toggle('no-flick', !st.flick || RM.matches); c.toggle('no-wires', st.mask !== 0 || mono); c.toggle('no-tint', !mono); c.toggle('bow', !fxOn && !lcd && eco < 2); c.toggle('lite', eco > 1 && !lcd);   // (the bowed edge is a rounded clip, which lite cannot afford either)
    if (lcd) { raster.style.filter = 'none'; geom.style.transform = ''; Hinv = null; return; }
    raster.style.filter = filterStr();
    const lift = Math.round(Math.max(0, st.bright - 25) * .56); blk.style.background = `rgb(${lift},${lift},${Math.round(lift * 1.18)})`;
    const sc = memo('s' + st.scan + '|' + dpr + '|' + (W < 560), scanTile), mk = memo('m' + st.mask + '|' + st.maskv + '|' + dpr, maskTile);
    ovScan.style.background = `url(${sc.url}) 0 0 / ${sc.w}px ${sc.h}px`; ovMask.style.background = `url(${mk.url}) 0 0 / ${mk.w}px ${mk.h}px`;
    const T = (st.scan ? sc.t : 1) * (c.contains('no-mask') ? 1 : mk.t), v = clamp(1 - T * 1.03, 0, .6), kt = mono ? [1, 1, 1] : [[.9, 1, 1.17], [1, 1, 1], [1.15, 1, .8]][st.temp];
    ovGain.style.background = `rgb(${kt.map(q => Math.round(255 * v * q)).join(',')})`;
    ovTint.style.background = ['', '#46ff78', '#ffb22a', '#e4ecff'][st.phosphor] || '';
    $('.ov-halo').style.opacity = (st.glow / 100 * .5).toFixed(3); $('.ov-noise').style.opacity = (st.noise / 100 * .17).toFixed(3);
    if (st.noise && eco < 2) tube.style.setProperty('--noise-img', `url(${memo('noise', () => tileURL(128, 128, () => { const v = Math.pow(Math.random(), 1.6); return [v, v, v]; }))})`);   // the snow: one small tile, drawn once, jumped around by css
    setGeom();
  }
  let Hinv = null;
  function setGeom() {
    const hs = 1 + (st.hsize - 50) / 50 * .06, vs = 1 + (st.vsize - 50) / 50 * .06, tx = (st.hpos - 50) / 50 * .03 * W, ty = (st.vpos - 50) / 50 * .03 * H, rot = (st.tilt - 50) / 50 * 2.4, sk = (st.para - 50) / 50 * 2.6, key = (st.trap - 50) / 50 * .07 / Math.max(1, H / 2);
    if (hs === 1 && vs === 1 && !tx && !ty && !rot && !sk && !key) { geom.style.transform = ''; Hinv = null; return; }
    const tf = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) skewX(${sk.toFixed(3)}deg) scale(${hs.toFixed(4)}, ${vs.toFixed(4)}) matrix3d(1,0,0,0, 0,1,0,${key.toExponential(4)}, 0,0,1,0, 0,0,0,1)`;
    geom.style.transform = tf;
    try { const m = new DOMMatrix(tf), a = m.m11, b = m.m21, c = m.m41, d = m.m12, e = m.m22, f = m.m42, g = m.m14, h = m.m24, i = m.m44, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      Hinv = [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]; } catch (err) { Hinv = null; }
  }
  // window coordinates -> picture coordinates (undoes the geometry settings; the tube bend needs no undoing because the pointer is drawn inside the picture)
  function toRaster(cx, cy) {
    const r = tube.getBoundingClientRect(); let x = cx - r.left - geom.offsetLeft, y = cy - r.top - geom.offsetTop;
    if (Hinv) { const ox = geom.offsetWidth / 2, oy = geom.offsetHeight / 2, X = x - ox, Y = y - oy, w = Hinv[6] * X + Hinv[7] * Y + Hinv[8]; x = (Hinv[0] * X + Hinv[1] * Y + Hinv[2]) / w + ox; y = (Hinv[3] * X + Hinv[4] * Y + Hinv[5]) / w + oy; }
    return { x, y };
  }

  /* --- virtual resolution: the page is laid out at about 800 "2002 pixels" wide and scaled up to the glass --- */
  const listeners = [];
  function layout() {
    const w = raster.clientWidth, h = raster.clientHeight; if (!w || !h) return; W = w; H = h;   // (zero while the tube is off: keep the last real size)
    const [s, mode] = window.__afterglowFit(W);
    S = s; tube.style.setProperty('--s', s.toFixed(4)); page.className = 'page w-' + mode;
    tube.style.setProperty('--osd-z', clamp(Math.min(W * .92 / 226, H * .9 / 178), .72, Math.max(1.6, s * 1.2)).toFixed(3));
    listeners.forEach(f => f(api.signal())); foot();
  }
  let rsT = 0;
  new ResizeObserver(() => { const d = window.devicePixelRatio || 1; if (d !== dpr) { dpr = d; } layout(); paint(); drawSpots(); clearTimeout(rsT); rsT = setTimeout(buildFx, 140); }).observe(raster);

  /* --- pointer drawn by the electron gun --- */
  let curType = '', curShown = false, mv = null, mvRaf = 0;
  const TXT = 'input[type="text"], textarea', LNK = 'a[href], .tiles button, .grab img, .pat, .pattern';
  function overText(x, y, t) {
    if (!t || !t.closest || !t.closest('.page') || t.closest('a, button, input, textarea, img, label')) return false; let node, off;
    if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); if (!c) return false; node = c.offsetNode; off = c.offset; }
    else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (!r) return false; node = r.startContainer; off = r.startOffset; } else return false;
    if (!node || node.nodeType !== 3) return false; const r = document.createRange(); r.setStart(node, Math.max(0, off - 1)); r.setEnd(node, Math.min(node.length, off + 1));
    // older browsers measure things inside the zoomed page in the page's own small pixels. k turns that back into window pixels (it is 1 in current browsers)
    const pw = page.getBoundingClientRect().width, k = pw > 0 && Math.abs(scroller.clientWidth / pw - 1) > .02 ? scroller.clientWidth / pw : 1;
    for (const q of r.getClientRects()) if (x >= q.left * k - 1 && x <= q.right * k + 1 && y >= q.top * k && y <= q.bottom * k) return true; return false;
  }
  function setCur(t) { if (t !== curType) { curType = t; cur.className = 'cur c-' + t; } }
  let busyUntil = 0;
  function flushMove() { mvRaf = 0; const e = mv; if (!e) return; const p = toRaster(e.x, e.y); cur.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; api.px = p.x; api.py = p.y;
    const t = e.t; setCur(performance.now() < busyUntil ? 'wait' : t && t.closest && t.closest(TXT) ? 'ibeam' : t && t.closest && t.closest(LNK) ? 'hand' : overText(e.x, e.y, t) ? 'ibeam' : 'arrow'); }
  function hideCur() { if (curShown) { curShown = false; tube.classList.remove('has-cur'); } }
  tube.addEventListener('pointermove', (e) => { api.lastPointer = performance.now(); api.touchy = e.pointerType !== 'mouse';
    if (e.pointerType !== 'mouse' || st.lcd || !on) { hideCur(); if (!on) return; const p = toRaster(e.clientX, e.clientY); api.px = p.x; api.py = p.y; return; }   // no drawn pointer (touch, or LCD mode), but the moth still wants to know where you are
    if (!curShown) { curShown = true; tube.classList.add('has-cur'); } mv = { x: e.clientX, y: e.clientY, t: e.target }; if (!mvRaf) mvRaf = requestAnimationFrame(flushMove); }, { passive: true });
  tube.addEventListener('pointerdown', (e) => { api.lastPointer = performance.now(); if (e.pointerType !== 'mouse' && on) { const p = toRaster(e.clientX, e.clientY); api.px = p.x; api.py = p.y; api.touchy = true; } }, { passive: true });
  tube.addEventListener('pointerleave', hideCur);
  scroller.addEventListener('scroll', () => { if (mv && curShown && !mvRaf) { mv.t = document.elementFromPoint(mv.x, mv.y); mvRaf = requestAnimationFrame(flushMove); } }, { passive: true });

  /* --- little animation driver --- */
  const anims = new Set(); let rafId = 0, lastT = 0;
  function tick(t) { const dt = Math.min(.05, (t - lastT) / 1000 || .016); lastT = t; for (const a of [...anims]) if (a(t, dt) === false) anims.delete(a); rafId = anims.size ? requestAnimationFrame(tick) : 0; }
  const run = (f) => { anims.add(f); if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(tick); } return f; };

  /* --- the magnet on the bezel: bends the picture, stains the colours, and leaves the grille magnetised until you degauss --- */
  const magEl = $('#magnet'), ovMag = $('#ov-mag'), ovRes = $('#ov-resid'), HUES = [322, 140, 214, 48], mag = { a: 0, x: .5, y: .5, cx: 0, cy: 0, R: 100 };
  let spots = store.get('mag', null); const num = (v) => typeof v === 'number' && isFinite(v);
  if (!Array.isArray(spots)) spots = [{ x: .93, y: .2, a: .62, h: 322 }, { x: .99, y: .52, a: .3, h: 140 }];   // a brand-new visitor's tube arrives slightly magnetised, top right. degauss fixes it
  else spots = spots.filter(q => q && num(q.x) && num(q.y) && num(q.a) && num(q.h)).slice(0, 6).map(q => ({ x: clamp(q.x, -.5, 1.5), y: clamp(q.y, -.5, 1.5), a: clamp(q.a, 0, .82), h: q.h % 360 }));   // a damaged save is tidied, never trusted
  function drawSpots() { const R = Math.round(Math.min(W, H) * .36) || 300; ovRes.style.background = spots.filter(q => q.a > .02).map(q => `radial-gradient(circle ${R}px at ${(q.x * 100).toFixed(1)}% ${(q.y * 100).toFixed(1)}%, hsla(${q.h}, 100%, 50%, ${q.a.toFixed(3)}) 0, hsla(${q.h + 70}, 100%, 50%, ${(q.a * .45).toFixed(3)}) 55%, transparent 100%)`).join(',') || 'none'; }
  function stain(x, y) { const q = spots.find(z => Math.hypot(z.x - x, z.y - y) < .16);
    if (q) { q.a = Math.min(.82, q.a + .05); q.x += (x - q.x) * .15; q.y += (y - q.y) * .15; } else { spots.push({ x, y, a: .12, h: HUES[spots.length % 4] }); if (spots.length > 6) { spots.sort((m, n) => n.a - m.a); spots.length = 6; } }
    drawSpots(); store.set('mag', spots); }
  function magApply() { if (!fxOn || !need.mag) return; const p = toRaster(mag.cx, mag.cy), R = mag.R; fxAttr('mi', 'x', (p.x - R).toFixed(1)); fxAttr('mi', 'y', (p.y - R).toFixed(1)); fxAttr('mi', 'width', 2 * R); fxAttr('mi', 'height', 2 * R);
    [['r', 1.24], ['g', 1], ['b', .78]].forEach(([c, f]) => fxAttr('m' + c, 'scale', (.54 * R * mag.a * f).toFixed(1))); }
  function magField(cx, cy) {
    const r = tube.getBoundingClientRect(); let a = 0;
    if (cx != null && on && !st.lcd) a = clamp(1 - Math.hypot(Math.max(r.left - cx, 0, cx - r.right), Math.max(r.top - cy, 0, cy - r.bottom)) / 110, 0, 1);
    mag.a = a; if (a <= 0) { ovMag.style.opacity = 0; if (need.mag) { need.mag = false; buildFx(); } return; }
    const R = mag.R = clamp(Math.min(W, H) * .3, 80, 250), D = R * 2.5; mag.cx = cx; mag.cy = cy; mag.x = (cx - r.left) / r.width; mag.y = (cy - r.top) / r.height;
    ovMag.style.opacity = a.toFixed(2); ovMag.style.width = ovMag.style.height = D + 'px'; ovMag.style.transform = `translate(${(cx - r.left - D / 2).toFixed(1)}px, ${(cy - r.top - D / 2).toFixed(1)}px) rotate(${(performance.now() / 7 % 360).toFixed(0)}deg)`;
    if (blink && !eco) { if (!need.mag) { need.mag = true; buildFx(); } else magApply(); }
  }
  let drag = null, stainT = 0;
  const magStart = () => { if (on && st.lcd) toast('LCD MODE: MAGNETS DO NOTHING', 1800); magEl.classList.add('held'); clearInterval(stainT); stainT = setInterval(() => { if (mag.a > .6) stain(clamp(mag.x, 0, 1), clamp(mag.y, 0, 1)); }, 170); };
  const magEnd = () => { clearInterval(stainT); magEl.classList.remove('held'); magEl.style.transform = ''; magField(null); drag = null; };
  magEl.addEventListener('pointerdown', (e) => { if (drag || sweeping) return; e.preventDefault(); try { magEl.setPointerCapture(e.pointerId); } catch (err) { /* keep going */ } const r = magEl.getBoundingClientRect(); drag = { id: e.pointerId, ox: e.clientX, oy: e.clientY, hx: r.left + r.width / 2, hy: r.top + r.height / 2, moved: false }; hideCur(); magStart(); });
  magEl.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.ox, dy = e.clientY - drag.oy; if (Math.hypot(dx, dy) > 4) drag.moved = true;
    magEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${clamp(dx * .04, -20, 20).toFixed(1)}deg) scale(1.18)`; magField(drag.hx + dx, drag.hy + dy); });
  const magUp = (e) => { if (!drag || e.pointerId !== drag.id) return; const moved = drag.moved; magEnd(); if (!moved && e.type === 'pointerup') magSweep(); };
  magEl.addEventListener('pointerup', magUp); magEl.addEventListener('pointercancel', magUp);
  magEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); magSweep(); } });
  let sweeping = false;
  function magSweep() { // no pointer? the magnet waves itself at the glass
    if (sweeping || drag || !on) return; if (st.lcd) { toast('LCD MODE: MAGNETS DO NOTHING', 1800); return; } sweeping = true; const r = tube.getBoundingClientRect(), hr = magEl.getBoundingClientRect(), hx = hr.left + hr.width / 2, hy = hr.top + hr.height / 2, t0 = performance.now(), T = RM.matches ? 700 : 2300; magStart();
    run((t) => { const u = (t - t0) / T; if (u >= 1) { sweeping = false; magEnd(); return false; }
      const e = Math.min(1, Math.sin(Math.PI * u) * 1.7), cx = r.left + r.width * (.5 + .33 * Math.sin(u * Math.PI * 3)), cy = r.top + r.height * (.52 - .27 * Math.cos(u * Math.PI * 2)), x = hx + (cx - hx) * e, y = hy + (cy - hy) * e;
      magEl.style.transform = `translate(${(x - hx).toFixed(1)}px, ${(y - hy).toFixed(1)}px) rotate(${(Math.sin(u * 9) * 14).toFixed(1)}deg) scale(1.18)`; magField(x, y); return true; }); }

  /* --- degauss: the coil shakes the picture, scrambles colour purity, and wipes the stains. a warm coil does half a job --- */
  let lastDg = -1e9, dgBusy = false; const purity = $('#ov-purity');
  function degauss(mode) {
    if (!on) return; if (st.lcd) { if (!mode) toast('LCD MODE: NOTHING TO DEGAUSS', 1800); return; }
    const now = performance.now(), k = mode ? .55 : clamp((now - lastDg) / 7000, .12, 1); lastDg = now;
    if (st.sound && mode !== 'boot') SND.degauss(k); if (!mode) toast(k < .5 ? 'DEGAUSS (COIL STILL WARM)' : 'DEGAUSS', 1300);
    if (mode !== 'boot') { monitor.classList.add('surge'); setTimeout(() => monitor.classList.remove('surge'), 380); }   // the coil pulls enough current to dim the power light
    const from = spots.map(q => q.a), keep = mode === 'boot' ? 1 : mode === 'power' ? 0 : clamp(1 - k * 1.25, 0, 1);
    const settle = () => { spots.forEach((q, i) => { q.a = from[i] * keep; }); spots = spots.filter(q => q.a > .03); drawSpots(); if (mode !== 'boot') store.set('mag', spots); };
    if (RM.matches) { purity.style.opacity = .5 * k; setTimeout(() => { purity.style.opacity = 0; }, 400); settle(); return; }
    if (dgBusy) { settle(); return; } dgBusy = true; const T = (1.1 + .7 * k) * 1000, t0 = now, ph = Math.random() * 6;
    run((t) => { const u = (t - t0) / T; if (u >= 1) { pwr.style.transform = ''; purity.style.opacity = 0; purity.style.transform = ''; wobble = { hue: 0, sat: 1 }; converge(0); settle(); paint(); dgBusy = false; return false; }
      const a = k * Math.exp(-4.2 * u) * (1 - u), s = (t - t0) / 1000, sz = Math.min(W, H) / 800;
      pwr.style.transform = `translate(${(a * 11 * sz * Math.sin(s * 107 + ph)).toFixed(2)}px, ${(a * 7 * sz * Math.sin(s * 83 + ph * 2)).toFixed(2)}px) rotate(${(a * .55 * Math.sin(s * 59)).toFixed(3)}deg) scale(${(1 + a * .016 * Math.sin(s * 131)).toFixed(4)}, ${(1 + a * .022 * Math.sin(s * 97 + 1)).toFixed(4)})`;
      purity.style.opacity = Math.min(1, a * 1.5).toFixed(3); purity.style.transform = `translate(${(a * 60 * Math.sin(s * 23)).toFixed(1)}px, ${(a * 44 * Math.cos(s * 31)).toFixed(1)}px) scale(1.25) rotate(${(s * 80).toFixed(1)}deg)`;
      if (keep < 1) { const f = keep + (1 - keep) * Math.pow(1 - u, 2); spots.forEach((q, i) => { q.a = from[i] * f; }); drawSpots(); }
      wobble = { hue: a * 150 * Math.sin(s * 41), sat: 1 + a * 1.4 }; converge(a * 16 * Math.sin(s * 67)); raster.style.filter = filterStr(); return true; });
  }

  /* --- interference: used when a page loads --- */
  let glT = 0;
  function glitch(ms = 150, amp = 1) {
    if (!on || st.lcd || RM.matches) return; const t0 = performance.now(); clearTimeout(glT);
    if (svgWanted() && fxOn !== false && mapURL) { if (!need.jit) { need.jit = true; buildFx(); }
      run((t) => { const u = (t - t0) / ms; if (u >= 1) { fxAttr('jd', 'scale', 0); glT = setTimeout(() => { need.jit = false; buildFx(); }, 900); return false; } fxAttr('jd', 'scale', ((1 - u) * 26 * amp * S).toFixed(1)); fxAttr('jm', 'y', (-Math.random() * H).toFixed(0)); return true; }); }
    else run((t) => { const u = (t - t0) / ms; if (u >= 1) { if (!dgBusy) pwr.style.transform = ''; return false; } if (!dgBusy) pwr.style.transform = `translateX(${((Math.random() - .5) * 9 * (1 - u) * amp).toFixed(1)}px) skewX(${((Math.random() - .5) * 1.4 * (1 - u)).toFixed(2)}deg)`; return true; });
  }

  /* --- vertical hold: off-centre and the picture rolls --- */
  let rollPos = 0, rolling = false;
  function vhold() {
    const v = st.vhold - 50; if (!v || !on || st.lcd || RM.matches) { if (rolling) { rolling = false; rollPos = 0; scroller.style.transform = ''; if (need.roll) { need.roll = false; buildFx(); } } return; }
    if (rolling) return; rolling = true; if (svgWanted()) { need.roll = true; buildFx(); }
    run((t, dt) => { const q = st.vhold - 50; if (!rolling || !q) return false; const gap = Math.round(H * .07), per = H + gap; rollPos = ((rollPos + Math.sign(q) * Math.pow(Math.abs(q) / 50, 1.6) * H * 2.6 * dt) % per + per) % per;
      if (fxOn && need.roll) { fxAttr('ra', 'dy', (-rollPos).toFixed(1)); fxAttr('rb', 'dy', (per - rollPos).toFixed(1)); scroller.style.transform = ''; } else scroller.style.transform = `translateY(${(rollPos < per / 2 ? -rollPos : per - rollPos).toFixed(1)}px)`; return true; });
  }

  /* --- power --- */
  const kPower = $('#k-power'), kMenu = $('#k-menu'), kDegauss = $('#k-degauss'), wake = $('#wake');
  function power(want) {
    if (want === on) return; on = want; monitor.classList.toggle('off', !on); kPower.setAttribute('aria-pressed', String(on)); closeOSD(); hideCur();
    tube.classList.remove('pw-on', 'pw-off', 'pw-warm');
    if (!on) { if (st.sound) SND.powerOff(); SND.stop(); listeners.forEach(f => f(api.signal())); rolling = false; tube.classList.add('pw-off'); setTimeout(() => { if (!on) { tube.classList.add('is-off'); tube.classList.remove('pw-off'); wake.hidden = false; } }, RM.matches ? 30 : 1250); }
    else { wake.hidden = true; tube.classList.remove('is-off'); void pwr.offsetWidth; tube.classList.add('pw-on'); if (st.sound) SND.powerOn(); buildFx(); setTimeout(() => degauss('power'), RM.matches ? 0 : 260); setTimeout(() => tube.classList.remove('pw-on'), 1600); vhold(); listeners.forEach(f => f(api.signal())); }
  }

  /* --- on-screen display (its rows are MENU, at the top next to DEF) --- */
  let tab = 'PICTURE', osdT = 0, saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => store.set('crt', st), 250); };
  function changed(k) {
    if (k === 'sound') SND.fx = st.sound; if (k === 'lcd') { hideCur(); if (st.lcd) { need.roll = false; rolling = false; scroller.style.transform = ''; } else govSoon(1600); }
    if (k === 'curve' || k === 'conv' || k === 'lcd') {
      if (k === 'curve' && st.curve > 0) {
        if (eco) { eco = 0; insist = true; store.set('eco', 0); store.set('lite', 0); }   // asked for the bend back after eco mode took it away: it stays, however slow
        else if (!bendOK) govSoon(700);   // the first time the bend is on in this visit (outside Chrome it starts off): check that the device keeps up
      }
      const nS = st.curve / 100 * .085 * Math.max(W, H), nD = st.conv / 100 * 3.4 * clamp(Math.max(W, H) / 1200, .5, 1.6);
      if (k !== 'lcd' && fxOn && svgWanted() && (nD > .05) === (kD > .05)) { kS = nS; kD = nD; fxAttr('g', 'scale', kS.toFixed(2)); converge(0); paint(); } else buildFx();
    }
    else paint();
    if (k === 'vhold' || k === 'lcd') vhold(); save();
  }
  function rowHTML([k, label, opts]) {
    if (k[0] === '!') return `<button type="button" class="osd-row" data-a="${k.slice(1)}"><span class="ev">[ ${label} ]</span></button>`;
    if (opts) return `<div class="osd-row" role="button" tabindex="0" data-k="${k}" data-n="${opts.length}" aria-label="${label}: ${opts[st[k]]}"><span class="lb">${label}</span><span class="val"><span class="arw" data-d="-1">&lt;</span><span class="ev">${opts[st[k]]}</span><span class="arw" data-d="1">&gt;</span></span></div>`;
    return `<div class="osd-row" role="slider" tabindex="0" data-k="${k}" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${st[k]}"><span class="lb">${label}</span><span class="val"><span class="bar"><i style="width:${Math.round(st[k] / 100 * 12) * 7}px"></i></span><span class="num">${st[k]}</span></span></div>`;
  }
  const footHTML = () => { const sg = api.signal(); return `<b>${sg.w}X${sg.h} @ ${sg.hz}HZ</b> :: FH ${sg.fh.toFixed(1)}KHZ${eco ? eco > 1 ? ' :: ECO+' : ' :: ECO' : ''}<br>ARROW KEYS ADJUST :: ESC EXITS`; };
  const foot = () => { const f = osd.querySelector('.osd-foot'); if (f) f.innerHTML = footHTML(); };   // the signal line, kept true while the menu is open
  function renderOSD(focusKey) {
    osd.innerHTML = `<div class="osd-head"><span>KILOVOLT K19</span><span>MENU</span></div><div class="osd-tabs" role="tablist">${Object.keys(MENU).map(t => `<button type="button" class="osd-tab" role="tab" aria-selected="${t === tab}" data-tab="${t}">${t}</button>`).join('')}</div><div class="osd-list" role="tabpanel">${MENU[tab].map(rowHTML).join('')}</div><div class="osd-foot">${footHTML()}</div>`;
    const f = focusKey && osd.querySelector(`[data-k="${focusKey}"], [data-a="${focusKey}"], [data-tab="${focusKey}"]`); if (f) f.focus({ preventScroll: true });
  }
  function nudgeOSD() { clearTimeout(osdT); osdT = setTimeout(closeOSD, 60000); }
  function openOSD() { if (!on) return; osd.hidden = false; kMenu.setAttribute('aria-expanded', 'true'); renderOSD(); const r = osd.querySelector('.osd-row'); if (r) r.focus({ preventScroll: true }); nudgeOSD(); }
  function closeOSD(refocus) { if (osd.hidden) return; osd.hidden = true; kMenu.setAttribute('aria-expanded', 'false'); clearTimeout(osdT); if (refocus) kMenu.focus({ preventScroll: true }); }
  function setVal(k, v, row) { v = clamp(Math.round(v), 0, 100); if (v === st[k]) return; st[k] = v; changed(k); if (row) { row.setAttribute('aria-valuenow', v); row.querySelector('.bar i').style.width = Math.round(v / 100 * 12) * 7 + 'px'; row.querySelector('.num').textContent = v; } }
  function cycle(k, d, n) { st[k] = ((st[k] + d) % n + n) % n; changed(k); renderOSD(k); }
  function action(a) { if (a === 'degauss') degauss(); else if (a === 'exit') closeOSD(true); else if (a === 'recall') { Object.assign(st, DEF); eco = 0; insist = false; store.set('eco', 0); store.set('lite', 0); SND.fx = st.sound; rolling = false; need.roll = false; scroller.style.transform = ''; buildFx(); vhold(); save(); renderOSD('recall'); toast('FACTORY SETTINGS RECALLED', 1600); govSoon(2200); } }
  osd.addEventListener('click', (e) => { nudgeOSD(); const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; renderOSD(tab); if (st.sound) SND.click(); return; }
    const row = e.target.closest('.osd-row'); if (!row) return; if (row.dataset.a) return action(row.dataset.a);
    if (row.dataset.n) { const a = e.target.closest('.arw'); cycle(row.dataset.k, a ? +a.dataset.d : 1, +row.dataset.n); } });
  osd.addEventListener('pointerdown', (e) => { const bar = e.target.closest('.bar'); if (!bar) return; const row = bar.closest('.osd-row'), k = row.dataset.k; row.focus({ preventScroll: true }); nudgeOSD();
    const at = (ev) => { const r = bar.getBoundingClientRect(); setVal(k, (ev.clientX - r.left) / r.width * 100, row); }; at(e); try { bar.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    const mvh = (ev) => at(ev), up = () => { bar.removeEventListener('pointermove', mvh); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); }; bar.addEventListener('pointermove', mvh); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up); e.preventDefault(); });
  osd.addEventListener('keydown', (e) => { nudgeOSD(); const row = e.target.closest('.osd-row'), rows = $$('.osd-row', osd), i = rows.indexOf(row);
    if (e.key === 'Escape') { closeOSD(true); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { const tabs = $$('.osd-tab', osd), n = e.target.closest('.osd-tab') ? (e.key === 'ArrowDown' ? rows[0] : null) : rows[i + (e.key === 'ArrowDown' ? 1 : -1)] || (e.key === 'ArrowUp' ? tabs.find(t => t.dataset.tab === tab) : rows[0]); if (n) n.focus({ preventScroll: true }); e.preventDefault(); return; }
    if (e.target.closest('.osd-tab') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { const ks = Object.keys(MENU); tab = ks[(ks.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : ks.length - 1)) % ks.length]; renderOSD(tab); e.preventDefault(); return; }
    if (!row || row.dataset.a) return; const k = row.dataset.k, d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (row.dataset.n) { if (d || e.key === 'Enter' || e.key === ' ') { cycle(k, d || 1, +row.dataset.n); e.preventDefault(); } }
    else if (d) { setVal(k, st[k] + d * (e.shiftKey ? 1 : 5), row); e.preventDefault(); } else if (e.key === 'Home') { setVal(k, 0, row); e.preventDefault(); } else if (e.key === 'End') { setVal(k, 100, row); e.preventDefault(); } });
  let toastT = 0;
  function toast(msg, ms = 1500) { if (!on) return; toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, ms); }

  /* --- front panel --- */
  const press = (b) => { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 120); if (st.sound) SND.click(); };
  kMenu.addEventListener('click', () => { press(kMenu); if (!on) return; if (osd.hidden) openOSD(); else closeOSD(); });
  kDegauss.addEventListener('click', () => { press(kDegauss); degauss(); });
  kPower.addEventListener('click', () => { press(kPower); power(!on); });
  $('#skip').addEventListener('click', () => kMenu.focus());   // the first Tab stop on the page: straight to the monitor's own buttons
  wake.addEventListener('click', () => { power(true); scroller.focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !osd.hidden && !e.defaultPrevented) { closeOSD(true); e.preventDefault(); } });

  /* --- the governor: if the picture costs too many frames, switch things off one level at a time, and say so ---
     it times a couple of seconds of frames. slow with the bend: the bend and the glow go (eco 1). still slow: the blended glass layers go too (eco 2).
     a device that draws 2 frames a second gives only a handful of samples, and those are the visitors who need this most, so few samples still count */
  let govT = 0, govBusy = false, insist = false, bendOK = false, flatOK = false;
  function governor() {
    if (govBusy || insist || bendOK || eco > 1 || navigator.webdriver || RM.matches || !on || st.lcd || document.hidden) return;
    const bent = svgWanted() && fxOn; if (!bent && flatOK) return; govBusy = true;
    const probe = $('#probe'), gaps = [], span = eco ? 1800 : 2600; let last = 0, n = 0, t0 = 0;
    const step = (t) => { if (!t0) t0 = t; if (!document.hidden && last) gaps.push(t - last); last = document.hidden ? 0 : t; probe.style.opacity = (n++ & 1) ? .98 : 1;   // nudging one pixel makes the whole picture redraw every frame
      if (t - t0 < span) return requestAnimationFrame(step); probe.style.opacity = 1; govBusy = false;
      if (insist || !on || st.lcd || RM.matches || gaps.reduce((a, b) => a + b, 0) < span * .55) return;   // the tab was hidden for most of it, or things changed meanwhile: no verdict
      gaps.sort((a, b) => a - b);
      if (gaps[gaps.length >> 1] <= 45) { if (bent) bendOK = true; else flatOK = true; if (eco < 1 && ecoN) store.set('eco', 0); if (eco < 2 && liteN) store.set('lite', 0); return; }
      if (eco < 1) { eco = 1; store.set('eco', ecoN + 1); buildFx(); toast(bent ? 'ECO MODE: CURVATURE OFF' : 'ECO MODE: GLOW OFF', 3600); }
      else { eco = 2; store.set('lite', liteN + 1); paint(); toast('ECO MODE: PLAIN GLASS', 3600); }
      foot(); if (eco < 2) govSoon(900); };
    requestAnimationFrame(step);
  }
  function govSoon(ms) { clearTimeout(govT); govT = setTimeout(governor, ms); }

  const api = {
    st, px: 0, py: 0, lastPointer: 0, touchy: false, toRaster, degauss, glitch, toast, power, run,
    menu() { if (on && osd.hidden) openOSD(); },
    get on() { return on; }, get scale() { return S; }, get size() { return { w: W, h: H }; },
    busy(ms = 240) { busyUntil = performance.now() + ms; if (curShown) { setCur('wait'); setTimeout(() => { if (mv && !mvRaf) mvRaf = requestAnimationFrame(flushMove); }, ms + 20); } },
    // the "video signal": the old-pixel size of the glass, and a refresh rate the K19 could really lock to (30 to 96 kHz across, 50 to 160 Hz down).
    // that is 85 Hz on ordinary screens. a very tall one has to drop to 75 or less, and a very short one gets to show off
    signal() { const w = Math.round(W / S), h = Math.round(H / S), lines = h * 1.052, hz = [85, 75, 72, 60, 100, 120, 140, 160].find(r => lines * r >= 30000 && lines * r <= 96000) || (lines * 85 > 96000 ? 50 : 160);
      return { w, h, hz, fh: lines * hz / 1000, on }; },
    onSignal(f) { listeners.push(f); if (W) f(api.signal()); },
    breathe(v) { tube.classList.toggle('breathe', !!v); },
  };
  // start-up: lay out, paint the glass, build the bend, let the tube "warm up" from a visible picture
  SND.fx = st.sound; layout(); paint(); drawSpots(); buildFx().then(() => { vhold(); govSoon(1600); });
  rmSubs.push((calm) => { paint(); vhold(); if (!calm) govSoon(1600); });   // "less motion" was switched on or off while the page is open
  if (!RM.matches) { tube.classList.add('pw-warm'); setTimeout(() => tube.classList.remove('pw-warm'), 1800); setTimeout(() => { if (on && !document.hidden) degauss('boot'); lastDg = -1e9; }, 380); }
  return api;
})();

/* =====================================================================
   THE HOMEPAGE: everything nox would have called "my DHTML scripts"
   ===================================================================== */
(() => {
  const PAGES = ['home', 'about', 'tube', 'test', 'journal', 'links', 'stuff', 'guest', '404'];
  const RING = Object.assign(Object.create(null), { kero: 'site-kero', campaign: 'site-campaign' });   // the neighbours. a bare list with nothing inherited, so an address like #constructor is just an unknown page
  let here = 'home', leave = () => {};   // leave: puts away whatever the old page had open (the test patterns set it, further down)
  // quiet = first load, Back or Forward. otherwise the visitor clicked: the picture glitches, the speaker blips, and the Back button gets a step to undo
  function go(id, quiet) {
    if (!PAGES.includes(id) && !RING[id]) id = 'home'; leave(); const was = here; here = id;
    const site = RING[id] || 'site-main'; $$('.site', page).forEach(s => { s.hidden = s.id !== site; }); page.dataset.site = RING[id] ? id : 'main';
    if (!RING[id]) { $$('.pg', page).forEach(p => { p.hidden = p.id !== 'pg-' + id; });
      $$('#nav a').forEach(a => { const me = a.getAttribute('href') === '#' + id; a.classList.toggle('here', me); if (me) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
    scroller.scrollTop = 0;
    if (!quiet) { CRT.glitch(RING[id] ? 260 : 150, RING[id] ? 1.5 : 1); CRT.busy(); if (CRT.st.sound) SND.nav(); }
    // the address follows the page. a plain /afterglow/ stays plain, and an unknown address is corrected
    try { const want = '#' + id, has = location.hash; if (!quiet && id !== was) history.pushState(null, '', want); else if (has !== want && (has || id !== 'home')) history.replaceState(null, '', want); } catch (e) { /* sandboxed frame: the page still works */ }
  }
  page.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault(); const h = a.getAttribute('href').slice(1);
    if (a.dataset.do === 'degauss') return CRT.degauss(); if (a.dataset.do === 'menu') return CRT.menu(); if (a.dataset.do === 'random') { const ring = Object.keys(RING); return go(ring[Math.floor(Math.random() * ring.length)]); }
    if (a.dataset.dead) { let u = a.dataset.dead, host = 'unknown host', path = u; try { const p = new URL(u); host = p.hostname; path = p.pathname + p.search; } catch (err) { /* keep raw */ } $('#dead-url').textContent = path; $('#dead-host').textContent = host; return go('404'); }
    if (h === 'top') { scroller.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); return; }
    go(h);
  });
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1) || 'home'; if (h !== here) go(h, true); });   // Back, Forward, or an address typed by hand
  go(location.hash.slice(1) || 'home', true);

  /* clock + "best viewed after midnight" */
  const pad = (n) => String(n).padStart(2, '0');
  function clock() { const d = new Date(), h = d.getHours(), hm = pad(h) + ':' + pad(d.getMinutes()); $('#now-time').textContent = hm;
    $('#clock-line').innerHTML = `it's <b class="grn">${hm}</b> where you are. ` + (h < 5 ? 'after midnight. <span class="yel">optimal viewing conditions.</span>' : h < 9 ? "either you're up early or you never stopped. respect." : h < 18 ? 'daylight. this site is <span class="yel">best viewed after midnight</span>, so close the curtains.' : 'getting dark. this site peaks <span class="yel">after midnight</span>.'); }
  clock(); setInterval(clock, 15000);
  CRT.onSignal((s) => { const d = Math.abs(s.w - 800) + Math.abs(s.h - 600);
    $('#res-line').textContent = `${s.w}x${s.h}` + (d < 90 ? ' (perfect)' : s.w < 640 ? ' (tiny! cute)' : d < 420 ? ' (close enough)' : ' (show-off)');
    $('#sig-line').textContent = `${s.w} x ${s.h} @ ${s.hz} Hz, ${s.fh.toFixed(1)} kHz horizontal`; $('#hz-line').textContent = Math.round(s.fh * 1000).toLocaleString('en-US'); });

  /* hit counter: one more every time you load the page, like the real ones */
  const hits = clamp(store.num('hits') | 0, 0, 900000) + 1; store.set('hits', hits);
  const count = String(48212 + hits).padStart(6, '0'); $('#ctr').innerHTML = [...count].map(c => `<i class="d${c}"></i>`).join(''); $('#ctr').setAttribute('aria-label', count);

  /* poll */
  const BASE = [217, 31, 64, 9], LAB = ['tube 4 life', 'flat is fine', "what's an LCD", "i'm on a toaster"];
  function pollResults(v) { const n = BASE.map((b, i) => b + (i === v ? 1 : 0)), tot = n.reduce((a, b) => a + b, 0);
    $('#poll-form').hidden = true; const r = $('#poll-res'); r.hidden = false;
    r.innerHTML = '<b>tube or flat?</b>' + n.map((c, i) => `<div class="res">${LAB[i]}${i === v ? ' <span class="yel">&lt; you</span>' : ''}<div class="pbar" role="img" aria-label="${c} votes"><i style="width:${(c / tot * 100).toFixed(1)}%"></i></div><span class="tiny dim">${c} (${Math.round(c / tot * 100)}%)</span></div>`).join('') + `<span class="tiny dim">${tot} votes. one each. i'm watching.</span>`; }
  const voted = store.get('poll', null); if (Number.isInteger(voted) && voted >= 0 && voted < BASE.length) pollResults(voted);
  $('#poll-form').addEventListener('submit', (e) => { e.preventDefault(); const c = $('input[name="poll"]:checked'); if (!c) { $('#poll-vote').textContent = 'pick one first'; return; } store.set('poll', +c.value); pollResults(+c.value); });

  /* guestbook: kept in this browser only */
  // everything a visitor typed is shown as plain text. anything in a save that is not text or a number (a damaged or hand-edited save) is shown as nothing
  const esc = (s) => (typeof s === 'string' || typeof s === 'number' ? String(s) : '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MOODS = ['smile', 'grin', 'wink', 'cool', 'shock', 'sad'];
  let mine = store.get('gb', []); mine = Array.isArray(mine) ? mine.filter(m => m && typeof m === 'object').slice(0, 30) : [];
  const REPLY = ['thanks for signing!! static says hi.', 'you are officially on record. welcome to the night shift.', 'best entry this week. (it is also the only entry this week)', 'noted, filed, and read out loud to byte.'];
  function drawMine() { $('#gb-mine').innerHTML = mine.map((m) => { const mood = MOODS.includes(m.mood) ? m.mood : 'smile', r = typeof m.r === 'number' && isFinite(m.r) ? Math.abs(m.r | 0) : 0;
    return `<article class="entry"><header><span><b>${esc(m.n)}</b>${esc(m.f) ? ' :: ' + esc(m.f) : ''}</span><span>${esc(m.d)}</span></header><div><i class="sm sm-${mood}" role="img" aria-label="${mood}"></i> ${esc(m.m).replace(/\n/g, '<br>')}<div class="re">nox: ${REPLY[r % REPLY.length]}</div></div></article>`; }).join(''); }
  drawMine();
  $('#gb-form').addEventListener('submit', (e) => { e.preventDefault(); const n = $('#gb-name').value.trim(), m = $('#gb-msg').value.trim(), note = $('#gb-note');
    if (!n || !m) { note.innerHTML = `<span class="yel">${!n ? 'you forgot your name.' : 'the message is empty. say anything.'}</span>`; (!n ? $('#gb-name') : $('#gb-msg')).focus(); return; }
    const d = new Date(); mine.unshift({ n, f: $('#gb-from').value.trim(), m, mood: ($('input[name="gb-mood"]:checked') || {}).value || 'smile', d: `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${pad(d.getFullYear() % 100)}`, r: mine.length });
    mine = mine.slice(0, 30); store.set('gb', mine); drawMine(); e.target.reset(); note.innerHTML = '<span class="grn">signed. it is saved on your computer and only you will see it.</span>'; if (CRT.st.sound) SND.nav(); });
  $('#gb-form').addEventListener('reset', () => { $('#gb-note').textContent = 'heads up: my host took cgi-bin away, so your entry is saved on your own computer and only you will see it.'; });

  /* copy-me code boxes and the free graphics */
  page.addEventListener('focusin', (e) => { if (e.target.matches('textarea.code')) e.target.select(); });
  page.addEventListener('click', (e) => { if (e.target.matches('textarea.code')) e.target.select(); });
  const grab = (img) => { $('#code-grab').value = `<img src="${img.dataset.file}" width="${img.naturalWidth}" height="${img.naturalHeight}" border="0" alt="${img.alt}">`; };
  $('#grab').addEventListener('click', (e) => { if (e.target.dataset.file) grab(e.target); });
  $('#grab').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.file) { grab(e.target); e.preventDefault(); } });
  function tile(name) { page.dataset.tile = name; $$('#tiles button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tile === name))); }
  const savedTile = store.get('tile', ''); if (typeof savedTile === 'string' && /^[a-z0-9_]+$/.test(savedTile) && $(`#tiles [data-tile="${savedTile}"]`)) tile(savedTile);
  $('#tiles').addEventListener('click', (e) => { const b = e.target.closest('[data-tile]'); if (b) { tile(b.dataset.tile); store.set('tile', b.dataset.tile); } });

  /* the bgsound player */
  const trk = $('#trk'), bPlay = $('#mus-play'), eq = $$('#eq i'); let eqT = 0;
  function musUI() { const p = SND.playing; trk.textContent = (p ? '> ' : '') + SND.songs[SND.track]; bPlay.textContent = p ? 'stop' : 'play'; $('#now-hear').textContent = p ? SND.songs[SND.track] : 'the fan';
    clearInterval(eqT); if (p) eqT = setInterval(() => { const l = SND.levels(eq.length); eq.forEach((b, i) => { b.style.height = Math.max(1, Math.round(l[i] * 12)) + 'px'; }); }, 90); else eq.forEach(b => { b.style.height = '1px'; }); }
  bPlay.addEventListener('click', () => { if (SND.playing) SND.stop(); else if (!SND.play()) trk.textContent = 'no sound card found'; musUI(); });
  $('#mus-next').addEventListener('click', () => { const was = SND.playing; SND.stop(); if (was) SND.play(SND.track + 1); else SND.select(SND.track + 1); musUI(); });
  $('#mus-prev').addEventListener('click', () => { const was = SND.playing; SND.stop(); if (was) SND.play(SND.track - 1); else SND.select(SND.track - 1); musUI(); });
  CRT.onSignal((s) => { if (!s.on) musUI(); });

  /* test patterns: drawn straight onto the picture */
  const pat = $('#pattern'); let patName = '', pure = 0, patFrom = null;
  const PURE = [['#ff0000', 'RED'], ['#00ff00', 'GREEN'], ['#0000ff', 'BLUE'], ['#ffffff', 'WHITE']];
  const steps = () => Array.from({ length: 16 }, (_, i) => `<i style="background:rgb(${i * 17},${i * 17},${i * 17})"></i>`).join('');
  const focusTxt = (n) => Array.from({ length: n }, (_, i) => 'mwe@#8'[i % 6]).join('');
  $('#th-steps').innerHTML = steps(); $('#th-focus').textContent = focusTxt(400);
  function drawPat() {
    const cap = (t) => `<span class="cap">${t} :: CLICK TO ${patName === 'pure' && pure < 3 ? 'CHANGE' : 'EXIT'}</span>`; pat.className = 'pattern p-' + patName; pat.style.background = '';
    if (patName === 'grid') pat.innerHTML = '<i style="left:50%;top:50%;height:74%;transform:translate(-50%,-50%)"></i><i style="left:6%;top:8%;height:20%"></i><i style="right:6%;top:8%;height:20%"></i><i style="left:6%;bottom:8%;height:20%"></i><i style="right:6%;bottom:8%;height:20%"></i>' + cap('CROSSHATCH');
    else if (patName === 'bars') pat.innerHTML = ['#fff', '#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f', '#000'].map(c => `<i style="background:${c}"></i>`).join('') + '<u></u><s></s>' + cap('COLOUR BARS');
    else if (patName === 'steps') pat.innerHTML = steps() + cap('16 GREY STEPS');
    else if (patName === 'dots') pat.innerHTML = cap('CONVERGENCE');
    else if (patName === 'moire') pat.innerHTML = cap('MOIRE');
    else if (patName === 'focus') { const s = CRT.signal(); pat.textContent = focusTxt(Math.ceil(s.w / 4.4) * Math.ceil(s.h / 8) + 200); pat.insertAdjacentHTML('beforeend', cap('FOCUS')); }
    else if (patName === 'bounce') pat.innerHTML = '<i></i>' + cap('HIGH VOLTAGE BOUNCE');
    else if (patName === 'pure') { pat.style.background = PURE[pure][0]; pat.innerHTML = cap('PURITY: ' + PURE[pure][1]); }
  }
  function openPat(name, from) { patName = name; pure = 0; patFrom = from; pat.hidden = false; pat.tabIndex = 0; pat.setAttribute('role', 'button'); pat.setAttribute('aria-label', 'Test pattern. Activate to close.'); drawPat(); CRT.breathe(name === 'bounce'); CRT.glitch(120, .6); pat.focus({ preventScroll: true }); }
  // stay = leave the keyboard focus where it is (the power button, or a page that is being left) instead of handing it back to the button that opened the pattern
  function closePat(stay) { if (pat.hidden) return; pat.hidden = true; pat.innerHTML = ''; CRT.breathe(false); CRT.glitch(120, .6); if (patFrom && !stay) patFrom.focus({ preventScroll: true }); }
  $('#pats').addEventListener('click', (e) => { const b = e.target.closest('[data-pat]'); if (b) openPat(b.dataset.pat, b); });
  const patStep = () => { if (patName === 'pure' && pure < 3) { pure++; drawPat(); } else closePat(); };
  pat.addEventListener('click', patStep);
  pat.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { patStep(); e.preventDefault(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pat.hidden && !e.defaultPrevented) { closePat(); e.preventDefault(); } });   // esc works wherever the focus has wandered to
  CRT.onSignal((s) => { if (!s.on) closePat(true); });
  leave = () => closePat(true);

  /* static the moth. he goes where the light is */
  const moth = $('#moth'), mBtn = $('#moth-btn'); let mOn = !!store.get('moth', 1), mx = -40, my = 60, hx = 0, hy = 0, fr = 0, frT = 0, perched = false, wanderT = 0, alive = false;
  function mothUI() { mBtn.setAttribute('aria-pressed', String(mOn)); mBtn.textContent = mOn ? 'shoo him away' : 'call him back'; moth.hidden = !mOn; if (mOn && !alive) fly(); }
  // with "less motion" he does not fly. he sits near the top right corner, wings folded
  const park = () => { const sz = CRT.size, s = CRT.scale; mx = sz.w - 60 * s; my = 26 * s; perched = true; moth.className = 'moth f3'; moth.style.transform = `translate(${mx.toFixed(0)}px, ${my.toFixed(0)}px)`; };
  function fly() { alive = true; let seeded = false;
    CRT.run((t, dt) => { if (!mOn) { alive = false; return false; } const sz = CRT.size, s = CRT.scale; if (!CRT.on || !sz.w) return true;
      if (RM.matches) { park(); alive = false; return false; }
      if (!seeded) { seeded = true; perched = false; mx = sz.w * .78; my = sz.h * .16; hx = mx; hy = my; }
      const idle = t - CRT.lastPointer;
      if (CRT.lastPointer && idle < 7000) { hx = CRT.px + 15 * s; hy = CRT.py - 13 * s; }
      else if (t > wanderT) { wanderT = t + 2600 + Math.random() * 3200; hx = sz.w * (.12 + Math.random() * .76); hy = sz.h * (.08 + Math.random() * .5); }
      hx = clamp(hx, 4, sz.w - 20 * s); hy = clamp(hy, 4, sz.h - 14 * s);
      const dx = hx - mx, dy = hy - my, d = Math.hypot(dx, dy);
      if (d < 3 * s) { if (!perched && idle > 700) { perched = true; moth.className = 'moth f3'; } if (perched) return true; }
      else if (perched && d > 12 * s) perched = false;
      if (perched) return true;
      const sp = Math.min(d * 4.2, 300 * s), w = Math.sin(t / 61) * 16 * s * Math.min(1, d / (50 * s));
      if (d > .01) { mx += (dx / d * sp + -dy / d * w) * dt; my += (dy / d * sp + dx / d * w) * dt; }
      frT += dt; if (frT > .07) { frT = 0; fr = (fr + 1) % 4; moth.className = 'moth f' + [0, 1, 2, 1][fr]; }
      moth.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`; return true; }); }
  mBtn.addEventListener('click', () => { mOn = !mOn; store.set('moth', mOn ? 1 : 0); mothUI(); });
  mothUI();
  CRT.onSignal(() => { if (mOn && RM.matches && CRT.on) park(); });   // the glass changed size: a parked moth moves with the corner

  /* the neighbours' scripts (kero's frogs, the campaign's petition) */
  let ribs = clamp(store.num('ribbits') | 0, 0, 999999); const ribEl = $('#ribbits'); ribEl.textContent = ribs;
  $('#frogs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; ribEl.textContent = ++ribs; store.set('ribbits', ribs); b.classList.remove('rib'); void b.offsetWidth; b.classList.add('rib'); setTimeout(() => b.classList.remove('rib'), 900); if (CRT.st.sound) SND.ribbit(); });
  const petBtn = $('#pet-btn'), signed = () => { $('#pet-n').textContent = '1,407'; petBtn.disabled = true; petBtn.textContent = 'SIGNED. THANK YOU.'; };
  if (store.get('pet', 0)) signed(); petBtn.addEventListener('click', () => { store.set('pet', 1); signed(); });

  /* people who asked for less motion get less motion: marquees stop, animated gifs hold their first frame */
  const live = new WeakMap();   // img -> its animated address, so motion can come back
  const calm = () => { const rm = RM.matches;
    $$('marquee', page).forEach(m => { try { if (rm) m.stop(); else m.start(); } catch (e) { /* no marquee support: it is plain text then */ } });
    $$('img[data-a]', page).forEach(im => { const st = 'images/still/' + im.dataset.a + '.gif'; if (rm) { if (!live.has(im)) live.set(im, im.getAttribute('src')); im.src = st; } else if (live.has(im)) im.src = live.get(im); }); };
  calm(); rmSubs.push(() => { calm(); if (mOn && !alive) fly(); });   // the setting can change while the page is open. fly() parks the moth, or lets him go
})();
})();
