/* Claire Cheng · cozy pixel portfolio
   House walking game, fishing game, quests and 8-bit sounds. No libraries. */
(function () {
  'use strict';
  const CFG = window.SITE_CONFIG || {};
  const photos = CFG.photos || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Sound (synthesized, no files) ---------------- */
  let ac = null;
  let muted = localStorage.getItem('cc-muted') === '1';
  function unlock() {
    if (!ac) { try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function sfx(n) {
    if (muted || !ac) return;
    const t = ac.currentTime;
    const tone = (f, d, type, v, when, slide) => {
      const o = ac.createOscillator(), g = ac.createGain(), w = t + (when || 0);
      o.type = type || 'square'; o.frequency.setValueAtTime(f, w);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, w + d);
      g.gain.setValueAtTime(v || 0.04, w); g.gain.exponentialRampToValueAtTime(0.0001, w + d);
      o.connect(g); g.connect(ac.destination); o.start(w); o.stop(w + d + 0.02);
    };
    const noise = (d, v, when, freq) => {
      const len = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), w = t + (when || 0);
      src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq || 1200;
      g.gain.setValueAtTime(v, w); g.gain.exponentialRampToValueAtTime(0.0001, w + d);
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start(w);
    };
    const seq = (fs, gap, d, type, v) => fs.forEach((f, i) => tone(f, d, type, v, i * gap));
    switch (n) {
      case 'step': noise(0.05, 0.035, 0, 700); break;
      case 'open': tone(660, 0.06, 'square', 0.035); tone(990, 0.09, 'square', 0.035, 0.06); break;
      case 'close': tone(520, 0.07, 'square', 0.03, 0, 330); break;
      case 'start': seq([523, 659, 784, 1047], 0.09, 0.14, 'square', 0.045); break;
      case 'select': tone(880, 0.05, 'square', 0.03); break;
      case 'cast': noise(0.3, 0.05, 0, 2500); tone(500, 0.25, 'triangle', 0.03, 0, 180); break;
      case 'splash': noise(0.35, 0.09, 0, 900); break;
      case 'bite': tone(1200, 0.08, 'square', 0.04); tone(1500, 0.1, 'square', 0.04, 0.1); break;
      case 'catch': seq([523, 659, 784, 1047, 1319], 0.07, 0.12, 'square', 0.045); break;
      case 'miss': tone(420, 0.35, 'triangle', 0.05, 0, 160); break;
      case 'quest': seq([784, 988, 1175, 1568], 0.11, 0.2, 'square', 0.05); tone(1568, 0.4, 'triangle', 0.04, 0.45); break;
      case 'meow': tone(700, 0.25, 'sawtooth', 0.025, 0, 450); break;
      case 'ding': tone(1760, 0.35, 'triangle', 0.04); tone(2349, 0.4, 'triangle', 0.03, 0.12); break;
      case 'zap': noise(0.18, 0.07, 0, 4000); tone(300, 0.06, 'square', 0.03, 0.05); tone(600, 0.06, 'square', 0.03, 0.12); break;
      case 'melody': seq([659, 784, 659, 523, 587], 0.1, 0.16, 'triangle', 0.04); break;
      case 'blip': seq([988, 1319, 1976], 0.06, 0.08, 'square', 0.035); break;
      case 'sizzle': noise(0.25, 0.04, 0, 3500); break;
      case 'burn': tone(220, 0.5, 'sawtooth', 0.04, 0, 70); noise(0.3, 0.05, 0, 800); break;
      case 'click': tone(700, 0.04, 'square', 0.03); tone(520, 0.05, 'square', 0.025, 0.03); break;
      case 'hover': tone(1300, 0.025, 'square', 0.01); break;
      case 'whoosh': noise(0.35, 0.05, 0, 3200); tone(300, 0.3, 'triangle', 0.02, 0, 900); break;
      case 'door': noise(0.1, 0.06, 0, 500); tone(190, 0.16, 'triangle', 0.045, 0, 120); tone(330, 0.22, 'sawtooth', 0.018, 0.1, 210); break;
      case 'grass': noise(0.07, 0.03, 0, 1900); break;
      case 'coin': tone(988, 0.06, 'square', 0.04); tone(1319, 0.28, 'square', 0.04, 0.06); break;
      case 'clunk': tone(170, 0.12, 'square', 0.05, 0, 80); noise(0.1, 0.04, 0, 600); break;
      case 'splashSm': noise(0.18, 0.05, 0, 1500); tone(900, 0.1, 'sine', 0.02, 0, 420); break;
      case 'paper': noise(0.14, 0.03, 0, 2600); break;
      case 'mail': tone(784, 0.07, 'square', 0.03); tone(1175, 0.12, 'square', 0.03, 0.07); break;
      case 'pop': tone(520, 0.05, 'sine', 0.05, 0, 1100); tone(1500, 0.04, 'sine', 0.025, 0.05); break;
      case 'crackle': for (let i = 0; i < 4; i++) noise(0.025 + Math.random() * 0.04, 0.055, Math.random() * 0.16, 2200 + Math.random() * 2600); tone(180 + Math.random() * 120, 0.05, 'square', 0.012, Math.random() * 0.1, 90); break;
      case 'crackleSoft': for (let i = 0; i < 2; i++) noise(0.02 + Math.random() * 0.03, 0.028, Math.random() * 0.18, 2400 + Math.random() * 2200); break;
      case 'chime': seq([523, 659, 784], 0.08, 0.22, 'triangle', 0.03); break;
    }
  }
  const soundBtn = $('soundBtn');
  function paintSound() { soundBtn.classList.toggle('off', muted); soundBtn.setAttribute('aria-checked', String(!muted)); soundBtn.title = muted ? 'Sound is off. Click to turn it on' : 'Sound is on. Click to turn it off'; }
  soundBtn.addEventListener('click', () => { unlock(); muted = !muted; localStorage.setItem('cc-muted', muted ? '1' : '0'); paintSound(); sfx('select'); });
  paintSound();

  /* ---------------- Quests ---------------- */
  const Q = { visited: new Set(), caught: [], resume: false, hi: false, done: {} };
  let HOUSE_SPOTS = 9;
  function questList() {
    return [
      { id: 'house', label: 'Explore the house and yard', n: Q.visited.size, of: HOUSE_SPOTS },
      { id: 'fish', label: 'Catch all 6 fish', n: Q.caught.length, of: 6 },
      { id: 'resume', label: 'Open the resume', n: Q.resume ? 1 : 0, of: 1 },
      { id: 'smore', label: 'Roast a perfect marshmallow', n: Q.smore ? 1 : 0, of: 1 },
      { id: 'hi', label: 'Say hi to Claire', n: Q.hi ? 1 : 0, of: 1 },
    ];
  }
  function renderQuests() {
    const ql = questList();
    const done = ql.filter((q) => q.n >= q.of).length;
    $('questTitle').textContent = 'Quests ' + done + '/' + ql.length;
    $('questList').innerHTML = ql.map((q) => {
      const d = q.n >= q.of;
      const prog = q.of > 1 ? Math.min(q.n, q.of) + '/' + q.of : (d ? 'done' : '');
      return '<li class="' + (d ? 'done' : '') + '"><i aria-hidden="true"></i><span>' + esc(q.label) + '</span><small>' + prog + '</small></li>';
    }).join('');
    $('questAll').hidden = done < ql.length;
  }
  let toastT = 0;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
  function checkQuests() {
    const ql = questList();
    const fresh = ql.filter((q) => q.n >= q.of && !Q.done[q.id]);
    renderQuests();
    if (!fresh.length) return;
    fresh.forEach((q) => { Q.done[q.id] = true; });
    sfx('quest');
    toast(ql.every((q) => q.n >= q.of) ? 'All quests complete! 100%' : 'Quest complete: ' + fresh[0].label);
  }
  $('questToggle').addEventListener('click', () => {
    const body = $('questBody'); body.hidden = !body.hidden;
    $('questToggle').setAttribute('aria-expanded', String(!body.hidden));
    $('questCaret').textContent = body.hidden ? '+' : '−';
  });
  const resumeLink = $('resumeLink');
  if (CFG.links && CFG.links.resume) resumeLink.href = CFG.links.resume;
  resumeLink.addEventListener('click', () => { unlock(); Q.resume = true; checkQuests(); });
  document.querySelectorAll('.js-hi').forEach((a) => a.addEventListener('click', () => { unlock(); Q.hi = true; checkQuests(); }));
  if (CFG.links && CFG.links.github) document.querySelectorAll('.js-gh').forEach((a) => { a.href = CFG.links.github; });
  /* tiny pixel icons, drawn in code */
  const ICONS = {
    mail: ['............', '############', '#..........#', '##........##', '#.##....##.#', '#...####...#', '#..........#', '#..........#', '#..........#', '############', '............', '............'],
    spk: ['............', '....#.......', '...##...#...', '.####....#..', '.####.#..#..', '.####.#..#..', '.####....#..', '...##...#...', '....#.......', '............', '............', '............'],
    spkx: ['............', '....#.......', '...##.......', '.####.#...#.', '.####..#.#..', '.####...#...', '.####..#.#..', '...##.#...#.', '....#.......', '............', '............', '............'],
    in: ['............', '.##.........', '.##.........', '............', '.##.#####...', '.##.######..', '.##.##..###.', '.##.##..###.', '.##.##..###.', '.##.##..###.', '............', '............'],
    gh: { d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" },
  };
  document.querySelectorAll('[data-ico]').forEach((el) => {
    const map = ICONS[el.dataset.ico]; if (!map) return;
    if (!Array.isArray(map)) { el.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" fill="currentColor" focusable="false"><path d="' + map.d + '"/></svg>'; return; }
    const rows = map;
    let r = '';
    rows.forEach((row, y) => { const re = /#+/g; let q; while ((q = re.exec(row))) r += '<rect x="' + q.index + '" y="' + y + '" width="' + q[0].length + '" height="1"/>'; });
    el.innerHTML = '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" width="100%" height="100%" fill="currentColor" shape-rendering="crispEdges" focusable="false">' + r + '</svg>';
  });
  renderQuests();

  /* ---------------- UI sounds: clicks, hovers and little flourishes ---------------- */
  (function () {
    const own = '.console, .arcade, .mallow, .dialog, .lake, .guide, .quests';
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('a, button, summary');
      if (!t) return;
      unlock();
      if (t.id === 'startBtn' || t.id === 'quickBtn' || t.id === 'soundBtn' || t.closest(own) && t.id !== 'questToggle') return;
      if (t.matches('a.btn[href="#work"]')) { sfx('whoosh'); setTimeout(() => sfx('splash'), 420); }
      else if (t.id === 'resumeLink') sfx('paper');
      else if (t.matches('.js-hi')) sfx('mail');
      else if (t.matches('.nav-ico a, .btn-sq, .contact-card .btn')) sfx('blip');
      else if (t.matches('a[href="#top"]')) sfx('whoosh');
      else if (t.matches('.navlink, .logo, summary, #questToggle, .btn')) sfx('click');
    });
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      let lastH = 0;
      document.addEventListener('mouseover', (e) => {
        const t = e.target.closest && e.target.closest('.btn, .navlink, .nav-ico a, .job');
        if (!t || t.contains(e.relatedTarget) || t.closest(own)) return;
        const n = performance.now(); if (n - lastH < 90) return; lastH = n;
        sfx(t.classList.contains('job') ? 'paper' : 'hover');
      });
    }
  })();

  /* ---------------- Title screen ---------------- */
  $('startBtn').addEventListener('click', () => {
    unlock(); sfx('start');
    $('home').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => vp.focus({ preventScroll: true }), 700);
  });
  $('quickBtn').addEventListener('click', () => { unlock(); sfx('select'); $('work').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  /* ---------------- Pixel sprites drawn in code ---------------- */
  const rng = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const mk = (w, h, fn) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); return cv.toDataURL(); };
  const R = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const ell = (g, col, cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y++) { const w = ry ? Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))) : rx; R(g, col, cx - w, cy + y, w * 2 + 1, 1); } };
  const SPR = {
    pouf: (col, dark, light) => mk(36, 22, (g) => { ell(g, 'rgba(0,0,0,.28)', 18, 19, 16, 3); ell(g, dark, 18, 12, 15, 8); ell(g, col, 18, 10, 15, 8); ell(g, light, 13, 7, 6, 3); }),
    basket: () => mk(64, 22, (g) => {
      ell(g, 'rgba(0,0,0,.28)', 32, 19, 29, 3);
      R(g, '#6b4423', 6, 8, 52, 11); R(g, '#8a5a2c', 6, 12, 52, 1); R(g, '#8a5a2c', 6, 16, 52, 1);
      for (let x = 8; x < 56; x += 5) R(g, '#8a5a2c', x, 9, 2, 10);
      R(g, '#c99a56', 4, 6, 56, 3); R(g, '#e3b872', 4, 6, 56, 1);
    }),
    tv: () => mk(56, 56, (g) => {
      ell(g, 'rgba(0,0,0,.28)', 28, 53, 24, 3);
      for (let i = 0; i < 4; i++) { R(g, '#8a8794', 20 - i * 2, 3 - i, 1, 1); R(g, '#8a8794', 35 + i * 2, 3 - i, 1, 1); }
      R(g, '#8a8794', 25, 3, 6, 1);
      R(g, '#7a4a26', 4, 41, 48, 5); R(g, '#a8693a', 4, 41, 48, 1); R(g, '#4a2a14', 8, 46, 4, 8); R(g, '#4a2a14', 44, 46, 4, 8);
      R(g, '#241c2c', 3, 4, 50, 37); R(g, '#3a3046', 3, 4, 50, 2); R(g, '#16111c', 3, 39, 50, 2);
      R(g, '#0a1124', 6, 8, 38, 29);
      R(g, '#4a4056', 46, 8, 5, 29); ell(g, '#d9c8ad', 48, 14, 2, 2); ell(g, '#d9c8ad', 48, 22, 2, 2); R(g, '#16111c', 47, 29, 3, 1); R(g, '#16111c', 47, 31, 3, 1); R(g, '#16111c', 47, 33, 3, 1);
    }),
    bars: () => mk(72, 20, (g) => { const cl = ['#e8d84a', '#4ad8e8', '#4ae85a', '#e84ae8', '#e84a4a', '#4a5ae8']; for (let i = 0; i < 12; i++) R(g, cl[i % 6], i * 6, 0, 6, 14); for (let i = 0; i < 12; i++) R(g, i % 2 ? '#1a1a24' : '#e8e8f0', i * 6, 14, 6, 6); }),
    tent: () => mk(84, 62, (g) => {
      const cx = 42;
      ell(g, 'rgba(0,0,0,.28)', cx, 59, 36, 3);
      for (let y = 0; y < 55; y++) { const hw = Math.round(4 + y * 0.69); R(g, '#5a2a12', cx - hw - 1, y + 4, hw * 2 + 3, 1); }
      for (let y = 0; y < 55; y++) { const hw = Math.round(4 + y * 0.69); R(g, y % 14 < 2 ? '#f2a85c' : '#e8944a', cx - hw, y + 4, hw, 1); R(g, y % 14 < 2 ? '#c97a38' : '#b86a2e', cx, y + 4, hw + 1, 1); }
      for (let y = 20; y < 55; y++) { const dh = Math.round((y - 18) * 0.3); R(g, '#3a2418', cx - dh, y + 4, dh * 2 + 1, 1); }
      for (let y = 20; y < 55; y++) { const dh = Math.round((y - 18) * 0.3); R(g, '#f6ce7b', cx - dh - 1, y + 4, 1, 1); R(g, '#f6ce7b', cx + dh + 1, y + 4, 1, 1); }
      R(g, '#3a2418', cx, 0, 1, 6); R(g, '#e8664f', cx + 1, 0, 6, 3); R(g, '#b5432e', cx + 1, 3, 4, 1);
    }),
    fire: () => mk(56, 30, (g) => {
      for (let f = 0; f < 2; f++) {
        const ox = f * 28, s = f;
        [[3, 24], [8, 26], [14, 27], [20, 26], [24, 24]].forEach((q) => { R(g, '#8a8794', ox + q[0], q[1], 5, 4); R(g, '#c4c1cd', ox + q[0], q[1], 5, 1); });
        R(g, '#4a2a14', ox + 6, 21, 17, 4); R(g, '#7a4a26', ox + 6, 21, 17, 1); R(g, '#5a3318', ox + 11, 19, 3, 4);
        R(g, '#d8431a', ox + 9, 12 - s, 10, 10 + s); R(g, '#f08a22', ox + 10, 8 + s, 8, 12); R(g, '#f6c94a', ox + 11, 10 - s, 6, 10); R(g, '#fff1a8', ox + 12, 14, 4, 6);
        R(g, '#f08a22', ox + 13, 3 + s * 2, 2, 7); R(g, '#d8431a', ox + 10 + s * 5, 6, 1, 4); R(g, '#f6c94a', ox + 14, 5 + s, 1, 3);
      }
    }),
    tree: (a, b, c) => mk(44, 62, (g) => {
      ell(g, 'rgba(0,0,0,.28)', 22, 59, 16, 3);
      R(g, '#4a2f18', 19, 40, 7, 19); R(g, '#6b4423', 19, 40, 3, 19);
      ell(g, a, 22, 27, 20, 19); ell(g, b, 20, 23, 16, 15); ell(g, c, 16, 17, 9, 7);
    }),
    log: () => mk(34, 12, (g) => { ell(g, 'rgba(0,0,0,.28)', 17, 10, 15, 2); R(g, '#5a3318', 3, 3, 28, 7); R(g, '#7a4a26', 3, 3, 28, 2); ell(g, '#c99a56', 4, 6, 2, 3); ell(g, '#8a5a2c', 4, 6, 1, 1); }),
    drinks: () => mk(56, 52, (g) => {
      ell(g, 'rgba(0,0,0,.28)', 28, 49, 26, 3);
      R(g, '#5a3318', 26, 38, 4, 10); ell(g, '#5a3318', 28, 48, 9, 2);
      ell(g, '#6b4423', 28, 36, 26, 8); ell(g, '#8a5a2c', 28, 35, 25, 7); ell(g, '#a8773d', 24, 33, 14, 3);
      // boba cup
      for (let i = 0; i < 22; i++) { const hw = 7 - Math.floor(i * 3 / 22); R(g, '#5a3a48', 16 - hw - 1, 12 + i, hw * 2 + 3, 1); }
      for (let i = 0; i < 22; i++) { const hw = 7 - Math.floor(i * 3 / 22); R(g, i < 4 ? '#f4fbff' : (i < 17 ? '#e2b88a' : '#d9a67a'), 16 - hw, 12 + i, hw * 2 + 1, 1); }
      R(g, '#fff6e0', 11, 16, 2, 10);
      [[11, 28], [14, 29], [17, 28], [12, 31], [15, 31], [18, 30], [13, 26]].forEach((q) => { R(g, '#2a1a12', q[0], q[1], 3, 3); R(g, '#5a4a3a', q[0], q[1], 1, 1); });
      ell(g, '#e8f4f8', 16, 11, 8, 2); R(g, '#ff5fa2', 19, 0, 2, 13); R(g, '#ff9fc6', 19, 0, 1, 13);
      // matcha cup
      for (let i = 0; i < 20; i++) { const hw = 6 - Math.floor(i * 2 / 20); R(g, '#4a5a48', 39 - hw - 1, 14 + i, hw * 2 + 3, 1); }
      for (let i = 0; i < 20; i++) { const hw = 6 - Math.floor(i * 2 / 20); R(g, i < 3 ? '#e6f2d2' : (i < 10 ? '#a8d08a' : '#7fb36a'), 39 - hw, 14 + i, hw * 2 + 1, 1); }
      R(g, '#d8f0c8', 35, 18, 2, 8); [[36, 28], [40, 30], [38, 25], [41, 26]].forEach((q) => { R(g, '#f0fbf0', q[0], q[1], 3, 3); R(g, '#ffffff', q[0], q[1], 1, 1); });
      R(g, '#ffffff', 42, 2, 2, 14); R(g, '#c4c1cd', 42, 2, 1, 14);
    }),
    cloud: () => mk(56, 18, (g) => { const w = 'rgba(255,244,230,.9)', sh = 'rgba(214,190,200,.9)'; ell(g, sh, 28, 14, 24, 3); ell(g, w, 14, 11, 12, 6); ell(g, w, 28, 8, 14, 7); ell(g, w, 42, 11, 11, 6); R(g, w, 6, 12, 44, 3); }),
    stickBase: () => mk(28, 28, (g) => { ell(g, '#2E1206', 14, 14, 14, 14); ell(g, '#5A2A12', 14, 14, 12, 12); ell(g, '#2E1206', 14, 14, 9, 9); [[13, 2], [13, 24], [2, 13], [24, 13]].forEach((q) => R(g, '#F6CE7B', q[0], q[1], 2, 2)); }),
    stickKnob: () => mk(20, 20, (g) => { ell(g, '#2E1206', 10, 10, 10, 10); ell(g, '#D88A3C', 10, 10, 9, 9); ell(g, '#F6CE7B', 9, 9, 7, 7); ell(g, '#FBE6B8', 7, 7, 3, 2); }),
    btn: () => mk(16, 16, (g) => { ell(g, '#2E1206', 8, 8, 8, 8); ell(g, '#D88A3C', 8, 8, 7, 7); ell(g, '#F6CE7B', 7, 7, 5, 5); ell(g, '#FBE6B8', 5, 5, 2, 1); }),
    yard: () => mk(348, 130, (g, w, h) => {
      const rnd = rng(7), ri = (n) => (rnd() * n) | 0;
      R(g, '#5f8f3e', 0, 0, w, h);
      const gr = ['#6a9a45', '#548338', '#74a64c', '#4d7a33'];
      for (let i = 0; i < 1100; i++) R(g, gr[ri(4)], ri(w), ri(h), 1 + ri(2), 1);
      for (let i = 0; i < 90; i++) { const x = ri(w), y = ri(h); R(g, '#3f6a2a', x, y, 1, 2); R(g, '#3f6a2a', x + 2, y + 1, 1, 1); }
      // dirt path: from the door, then along the yard to the camp and the dock
      const dirt = ['#b98d56', '#a3794a', '#cfa468', '#b98d56'];
      const band = (x0, y0, x1, y1) => { R(g, '#8c6638', x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) R(g, dirt[ri(4)], x, y, 1, 1); };
      band(223, 0, 266, 78); band(66, 60, 300, 80);
      for (let i = 0; i < 24; i++) { const x = ri(w), y = ri(h); R(g, '#8a8794', x, y, 2, 1); }
      // pond
      const pcx = 302, pcy = 83, prx = 36, pry = 26;
      for (let y = -pry - 2; y <= pry + 2; y++) for (let x = -prx - 3; x <= prx + 3; x++) {
        const d = (x * x) / (prx * prx) + (y * y) / (pry * pry), d2 = (x * x) / ((prx + 3) * (prx + 3)) + (y * y) / ((pry + 2) * (pry + 2));
        if (d <= 1) R(g, d > 0.8 ? '#4a78c4' : (d > 0.4 ? '#5880cc' : '#4f74be'), pcx + x, pcy + y, 1, 1);
        else if (d2 <= 1) R(g, d2 > 0.86 ? '#a98e5a' : '#d9c48a', pcx + x, pcy + y, 1, 1);
      }
      for (let i = 0; i < 26; i++) { const x = pcx - 28 + ri(56), y = pcy - 18 + ri(36); if ((x - pcx) * (x - pcx) / 1000 + (y - pcy) * (y - pcy) / 560 < 1) R(g, '#8fb2ee', x, y, 2 + ri(3), 1); }
      // dock
      R(g, '#3a2418', 251, 77, 33, 11);
      for (let x = 252; x < 283; x += 3) { R(g, '#a8773d', x, 78, 2, 9); R(g, '#c99a56', x, 78, 2, 1); }
      R(g, '#5a3318', 252, 78, 31, 1);
      // log seats' spots, flowers
      const fl = ['#f6e27b', '#f2a2b8', '#ffffff', '#c9a3f0'];
      for (let i = 0; i < 34; i++) { const x = ri(w), y = ri(h); if (x > 215 && x < 275 && y < 82) continue; R(g, fl[ri(4)], x, y, 1, 1); }
    }),
  };
  const IMG = {
    bars: SPR.bars(),
    poufTeal: SPR.pouf('#3fa7b8', '#2a7a89', '#8ddbe6'),
    poufRed: SPR.pouf('#d9604a', '#a84432', '#f4a08e'),
    basket: SPR.basket(),
    tv: SPR.tv(),
    tent: SPR.tent(),
    fire: SPR.fire(),
    log: SPR.log(),
    yard: SPR.yard(),
    tree1: SPR.tree('#2f6b34', '#3f8a42', '#5aa653'),
    tree2: SPR.tree('#3a6b2e', '#4f8a3a', '#7ab35a'),
    cloud: SPR.cloud(),
    drinks: SPR.drinks(),
  };
  $('stickBase').src = SPR.stickBase();
  $('stickKnob').src = SPR.stickKnob();
  const BTN = SPR.btn();
  document.querySelectorAll('.gbtn').forEach((b) => { b.style.backgroundImage = 'url(' + BTN + ')'; });

  /* ---------------- House ---------------- */
  const W = 695, H = 640;
  const vp = $('vp'), world = $('world'), lia = $('lia'), catBtn = $('cat'), catSpr = $('catSpr'), dialog = $('dialog'), hud = $('hud');
  const W_ = CFG.watching || {};
  const live = { song: (CFG.nowPlaying || {}).song || '[Song title]', artist: (CFG.nowPlaying || {}).artist || '[Artist]', game: (CFG.recentGame || {}).name || 'Overwatch', hours: (CFG.recentGame || {}).hours || '', albumArt: '', gameArt: '', show: W_.title || 'Brooklyn Nine-Nine', showNote: W_.note || '' };
  const BOOKS = [
    ['Python', '#3C3F61', 'Contract AI, the Ops Hub scraper and the smart-glasses app'],
    ['C#', '#70994D', 'Veil-Sur, BREWHAHA and Cornell XR’s VR scenes'],
    ['Unity', '#5A5866', 'Veil-Sur, BREWHAHA and Cornell XR'],
    ['Java', '#CE8137', 'Object-oriented programming and data structures coursework'],
    ['OCaml', '#B88A2A', 'Bracket City’s real-time backend'],
    ['JavaScript', '#8F7A1E', 'Bracket City, the Ops Hub and the accessible route planner'],
    ['SQL', '#4E6A8E', 'Database Systems coursework'],
    ['FastAPI', '#2D7F6A', 'The smart-glasses memory app'],
    ['Docker', '#3A64A0', 'Systems coursework and dev environments'],
    ['scikit-learn', '#B85C38', 'Data science consulting coursework'],
    ['Apps Script', '#3E7A3A', 'The Project Teams Ops Hub'],
  ];
  // x, y, w, h = where the sprite sits in the world. stand = where Claire walks to.
  // Spots are spread out so every hobby has its own corner of the house or yard.
  const OBJS = [
    { id: 'bake', x: 6, y: 140, w: 50, h: 56, src: 'assets/obj_stove.png', stand: [86, 200], kicker: 'In the kitchen', title: 'Baking', word: 'baking', blurb: 'Weekend baking is my favorite way to unwind. I love making cookies, tiramisu, and brownies! I\'ve also recently got into making ice cream!' },
    { id: 'tv', x: 352, y: 56, w: 56, h: 56, src: IMG.tv, stand: [380, 162], kicker: 'By the sofa', title: 'What I’m watching', word: 'show', live: 'tv', blurb: 'Comedy TV shows are my go-to. I love Brooklyn Nine-Nine, How I Met Your Mother, and The Good Place.' },
    { id: 'skills', x: 632, y: 100, w: 50, h: 80, src: 'assets/obj_books.png', stand: [612, 200], kicker: 'On the bookshelf', title: 'My skill books', word: 'skills', skills: true, blurb: '' },
    { id: 'music', x: 140, y: 254, w: 27, h: 17, src: 'assets/obj_hp.png', stand: [153, 292], kicker: 'On the floor cushion', title: 'What I’m listening to', word: 'album', live: 'music', blurb: 'Check it out!', under: [IMG.poufTeal, 134, 256, 36, 22] },
    { id: 'games', x: 305, y: 286, w: 30, h: 14, src: 'assets/obj_gb.png', stand: [320, 324], kicker: 'On the beanbag', title: 'What I’m playing', word: 'game', live: 'games', blurb: 'Playing games is how I got into making them. It\'s one of my favorite ways to catch up with my friends!', under: [IMG.poufRed, 302, 288, 36, 22] },
    { id: 'crochet', x: 575, y: 298, w: 54, h: 15, src: 'assets/obj_yarn.png', stand: [560, 334], kicker: 'In the yarn basket', title: 'Crochet', word: 'crochet', blurb: 'How I unwind. I love making clothing and stuffed animals.Currently working on a sweater based off my cat!', under: [IMG.basket, 570, 304, 64, 22] },
    { id: 'drinks', x: 430, y: 205, w: 56, h: 52, src: IMG.drinks, stand: [458, 284], kicker: 'At the café table', title: 'Drink making', word: 'drink', blurb: 'I love boba and matcha, making and drinking! Fun fact, I was a barista at a boba shop for 2 years!' },
    { id: 'cats', cat: true, src: 'assets/cat_portrait.png', kicker: 'Wandering the house', title: 'Astro!', word: 'cat', blurb: 'The love of my life, my cat Astro! His purring on my chest always makes me fall asleep instantly.' },
    { id: 'camping', x: 62, y: 425, w: 84, h: 62, src: IMG.tent, stand: [142, 526], kicker: 'In the backyard', title: 'Camping', word: 'camping', blurb: 'Barbeque, marshmallows, and starry nights. The times spent with my friends next to the campfire are some of my favorites.' },
    { id: 'fish', x: 496, y: 490, w: 47, h: 42, src: 'assets/obj_rod.png', stand: [508, 562], kicker: 'On the dock', title: 'Fishing', word: 'fishing', blurb: 'Quiet mornings on the water, or evenings at the lake. I primarily fresh water fish for bass and crappie.' },
  ];
  HOUSE_SPOTS = OBJS.length;
  // Solid bits: [x1, y1, x2, y2]
  const BLOCKS = [
    [0, 0, 345, 142], [0, 0, 60, 345], [55, 298, 205, 345], [198, 98, 298, 238], [155, 135, 197, 238], [300, 135, 340, 188], [418, 0, 486, 140], [538, 0, 630, 136], [628, 100, 700, 316],
    [436, 232, 484, 258], [66, 452, 140, 492], [190, 484, 222, 502], [24, 562, 58, 592], [644, 432, 690, 462], [304, 428, 340, 454], [545, 496, 700, 604],
  ];
  function hit(x, y) {
    if (y < 140 || y > 612) return true;
    if (y <= 340) { if (x < 62 || x > 655) return true; }
    else if (y < 390) { if (x < 450 || x > 526) return true; }
    else if (x < 28 || x > 667) return true;
    for (const b of BLOCKS) if (x + 7 > b[0] && x - 7 < b[2] && y + 3 > b[1] && y - 3 < b[3]) return true;
    return false;
  }

  /* world building */
  function put(src, x, y, w, h, cls, z) {
    const im = document.createElement('img');
    im.src = src; im.alt = ''; im.className = cls;
    im.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;z-index:' + Math.round(z);
    world.insertBefore(im, catBtn);
    return im;
  }
  function div(cls, css, z) {
    const d = document.createElement('div');
    d.className = cls; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = css + (z == null ? '' : ';z-index:' + Math.round(z));
    world.insertBefore(d, catBtn);
    return d;
  }
  put(IMG.yard, 0, 380, 695, 260, 'yard', 0);
  put(IMG.log, 152, 498, 34, 12, 'prop', 508);
  put(IMG.log, 226, 500, 34, 12, 'prop', 510);
  put(IMG.tree1, 18, 530, 44, 62, 'prop', 590);
  put(IMG.tree2, 638, 400, 44, 62, 'prop', 460);
  put(IMG.tree2, 298, 396, 44, 62, 'prop', 456);
  div('pond-sh', 'left:536px;top:496px;width:136px;height:100px', 5);
  div('tv-glow', 'left:330px;top:70px;width:100px;height:120px', 1);
  const tvScr = div('tv-scr', 'left:358px;top:64px;width:38px;height:29px;background-image:url(' + IMG.bars + ')', 109);
  const tvTag = div('tv-tag', 'left:322px;top:36px;width:112px', 111);
  tvTag.textContent = '▶ ' + live.show;
  OBJS.filter((o) => o.under).forEach((o) => put(o.under[0], o.under[1], o.under[2], o.under[3], o.under[4], 'prop', o.y + o.h - 1));
  const fire = div('fire', 'left:192px;top:472px;width:28px;height:30px;background-image:url(' + IMG.fire + ')', 502);
  for (let i = 0; i < 6; i++) div('spark', 'left:' + (203 + (i % 3) * 3) + 'px;top:476px;animation-delay:' + (i * 0.55).toFixed(2) + 's;animation-duration:' + (1.8 + (i % 3) * 0.5).toFixed(2) + 's', 520);
  div('fire-glow', 'left:168px;top:450px;width:76px;height:76px', 4);
  (function () { const r = rng(21); for (let i = 0; i < 14; i++) div('ff', 'left:' + (30 + r() * 630).toFixed(0) + 'px;top:' + (400 + r() * 200).toFixed(0) + 'px;animation-delay:' + (-r() * 8).toFixed(2) + 's;animation-duration:' + (5 + r() * 5).toFixed(2) + 's', 700); })();
  const mark = div('mark', 'left:0;top:0', 700);
  const objEls = {};
  OBJS.filter((o) => !o.cat).forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'obj';
    b.setAttribute('aria-label', 'Walk to: ' + o.title);
    b.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px;z-index:' + Math.round(o.y + o.h);
    b.innerHTML = '<img class="glow" src="' + o.src + '" alt="">';
    b.addEventListener('click', (e) => { e.stopPropagation(); goTo(o.stand[0], o.stand[1], o.id); });
    world.insertBefore(b, catBtn);
    objEls[o.id] = b;
  });
  const fireBtn = document.createElement('button');
  fireBtn.type = 'button'; fireBtn.className = 'obj'; fireBtn.title = 'Roast a marshmallow';
  fireBtn.setAttribute('aria-label', 'Walk to the campfire and roast a marshmallow');
  fireBtn.style.cssText = 'left:188px;top:468px;width:36px;height:36px;z-index:503';
  fireBtn.addEventListener('click', (e) => { e.stopPropagation(); goRoast(); });
  world.insertBefore(fireBtn, catBtn);

  const p ={ x: 360, y: 270, f: 'r', m: false };
  const c = { x: 400, y: 292, f: 'l', m: false, tx: 400, ty: 292, wait: 1.5 };
  const gal = {}, joy = { x: 0, y: 0, on: false };
  const mg = { open: false, hold: false, heat: 0, done: false, pending: false };
  let crT = 0, fireT = 0, promptFor = null;
  const promptBtn = document.createElement('button');
  promptBtn.type = 'button'; promptBtn.className = 'prompt'; promptBtn.hidden = true;
  vp.appendChild(promptBtn);
  let cam = null, keys = {}, tgt = null, route = [], dest = null, tgtOpen = false, dismissed = null, popup = null, tap = 0, tapDir = null, stuck = 0, stepT = 0, book = null, areaName = 'Home', knobKey = '';

  function view() {
    const vw = vp.clientWidth || 600, vh = vw * 9 / 16;
    const S = Math.max(1.3, vw / 380);
    const cl = (v, a, b) => (b < a ? (a + b) / 2 : Math.max(a, Math.min(b, v)));
    return { vw, vh, S, dx: cl(p.x * S - vw / 2, 0, W * S - vw), dy: cl((p.y - 30) * S - vh / 2, 0, H * S - vh) };
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  function goTo(x, y, openId) {
    unlock();
    let dx = x, dy = y;
    if (dy > 336 && dy < 392) dx = clampN(dx, 458, 518);
    else if (dy >= 392) { dx = clampN(dx, 34, 662); dy = clampN(dy, 392, 608); }
    else { dx = clampN(dx, 66, 650); dy = clampN(dy, 144, 336); }
    const inYard = (yy) => yy > 360;
    route = [];
    if (inYard(p.y) !== inYard(dy)) route.push(inYard(dy) ? [488, 330] : [488, 396], inYard(dy) ? [488, 396] : [488, 334]);
    if (!inYard(p.y) && inYard(dy)) route.push([440, 522]);   // follow the dirt path, around the campfire
    route.push([dx, dy]);
    tgt = route.shift();
    dest = [dx, dy];
    tgtOpen = !!openId;
    if (openId) { dismissed = null; openPop(openId); }
  }
  function spots() {
    return OBJS.map((o) => (o.cat ? { id: 'cats', cx: c.x, cy: c.y - 12, r: 52 } : { id: o.id, cx: o.stand[0], cy: o.stand[1], r: 46 }));
  }
  function nearest(maxD) {
    let best = null, bd = maxD;
    spots().forEach((o) => { const d = Math.hypot(o.cx - p.x, o.cy - p.y); if (d < bd) { bd = d; best = o.id; } });
    return best;
  }
  function openPop(id) {
    if (popup === id) { react(id); return; }
    popup = id;
    Q.visited.add(id);
    react(id);
    sfx(id === 'cats' ? 'meow' : 'open');
    renderDialog();
    checkQuests();
  }
  function closePop(byUser) {
    if (!popup) return;
    if (byUser) { dismissed = popup; sfx('close'); }
    popup = null; tgtOpen = false;
    dialog.hidden = true;
  }
  function photosFor(o) {
    let list = [].concat(photos[o.id] || []).filter(Boolean);
    if (o.live === 'music' && live.albumArt) list = [live.albumArt].concat(list.filter((u) => u !== live.albumArt));
    if (o.live === 'games' && live.gameArt) list = [live.gameArt].concat(list.filter((u) => u !== live.gameArt));
    return list;
  }
  function stepPhoto(d) {
    unlock();
    const o = popup && OBJS.find((q) => q.id === popup);
    if (!o) return;
    const n = photosFor(o).length;
    if (n < 2) { sfx('close'); return; }
    gal[o.id] = (((gal[o.id] || 0) + d) % n + n) % n;
    sfx('select');
    renderDialog();
  }
  function renderDialog() {
    const o = OBJS.find((q) => q.id === popup);
    if (!o) { dialog.hidden = true; return; }
    const list = photosFor(o), n = list.length, i = n ? ((gal[o.id] || 0) % n + n) % n : 0;
    let extra = '';
    if (o.live === 'music') extra = '<div class="live"><span class="label">● Now playing</span><span class="value">' + esc(live.song) + ' — ' + esc(live.artist) + '</span><span class="sub">' + (live.isLive ? 'Live from Spotify' : 'Last song I had on repeat') + '</span></div>';
    if (o.live === 'games') extra = '<div class="live"><span class="label">● Recently played</span><span class="value">' + esc(live.game) + (live.hours ? ' · ' + esc(live.hours) : '') + '</span><span class="sub">' + 'Most recent game' + '</span></div>';
    if (o.live === 'tv') extra = '<div class="live"><span class="label">● Now watching</span><span class="value">' + esc(live.show) + '</span>' + (live.showNote ? '<span class="sub">' + esc(live.showNote) + '</span>' : '') + '</div>';
    if (o.id === 'camping') extra = '<button type="button" class="btn btn-gold roast" data-act="mallow">Roast a marshmallow</button>';
    if (o.skills) {
      const bk = BOOKS.find((b) => b[0] === book);
      extra = '<div class="books">' + BOOKS.map((b) => '<button type="button" class="book" data-book="' + esc(b[0]) + '" aria-pressed="' + (book === b[0]) + '" style="background:' + b[1] + '">' + esc(b[0]) + '</button>').join('') + '</div><span class="book-text">' + (bk ? esc(bk[0] + ': ' + bk[2] + '.') : 'Pick a book to see where I used it.') + '</span>';
    }
    const portrait = n
      ? '<img class="photo" src="' + esc(list[i]) + '" alt="' + esc(o.title + ', photo ' + (i + 1) + ' of ' + n) + '">' +
        (n > 1 ? '<button type="button" class="arr arr-l" data-dir="-1" aria-label="Previous photo"></button><button type="button" class="arr arr-r" data-dir="1" aria-label="Next photo"></button><span class="count">' + (i + 1) + ' / ' + n + '</span>' : '')
      : '<img class="sprite" src="' + o.src + '" alt=""><span>Add your ' + esc(o.word) + ' photos</span>';
    dialog.innerHTML =
      '<div class="portrait pxs">' + portrait + '</div>' +
      '<div class="dialog-body"><span class="dialog-kicker">' + esc(o.kicker) + '</span><span class="dialog-title">' + esc(o.title) + '</span><p>' + esc(o.blurb) + '</p>' + extra + '</div>' +
      '<button type="button" class="dialog-close" aria-label="Close">×</button>';
    dialog.setAttribute('aria-label', o.title);
    dialog.hidden = false;
    dialog.querySelector('.dialog-close').addEventListener('click', (e) => { e.stopPropagation(); closePop(true); });
    dialog.querySelectorAll('[data-act="mallow"]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); closePop(true); goRoast(); }));
    dialog.querySelectorAll('.arr').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); stepPhoto(+b.dataset.dir); }));
    dialog.querySelectorAll('.book').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); book = b.dataset.book; sfx('select'); renderDialog(); }));
  }
  dialog.addEventListener('click', (e) => e.stopPropagation());
  catBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(c.x - 30, c.y + 18, 'cats'); });

  vp.addEventListener('click', (e) => {
    const r = vp.getBoundingClientRect(), v = view(), cm = cam || { x: v.dx, y: v.dy };
    vp.focus({ preventScroll: true });
    goTo((e.clientX - r.left + cm.x) / v.S, (e.clientY - r.top + cm.y) / v.S, null);
    mark.style.left = (dest[0] - 5) + 'px'; mark.style.top = (dest[1] - 3) + 'px';
    mark.classList.remove('on'); void mark.offsetWidth; mark.classList.add('on');
  });

  /* controls: keyboard (global while the console is on screen), joystick, buttons */
  const KEYMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
  let consoleOn = false;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { consoleOn = es[0].isIntersecting; if (!consoleOn) keys = {}; }, { threshold: 0.3 }).observe($('console'));
  else consoleOn = true;
  function interact() {
    unlock();
    const id = nearest(90);
    if (id) { dismissed = null; openPop(id); } else toast('Nothing nearby. Walk up to something glowing.');
  }
  promptBtn.addEventListener('click', (e) => { e.stopPropagation(); interact(); });
  function press(k) {
    unlock();
    if (mg.open) { if (k === 'b') closeMallow(); return; }
    if (k === 'a') interact();
    else if (k === 'b') { if (mg.open) closeMallow(); else closePop(true); }
    else if (k === 'x') stepPhoto(1);
    else if (k === 'y') stepPhoto(-1);
  }
  document.addEventListener('keydown', (e) => {
    if (!consoleOn || e.ctrlKey || e.metaKey || e.altKey) return;
    if (mg.open) {
      if (e.key === 'Escape') closeMallow();
      else if (e.key === ' ') { e.preventDefault(); if (!e.repeat) mgHold(true); }
      return;
    }
    if (e.key === 'Escape') { closePop(true); return; }
    if (e.key === 'e' || e.key === 'E') { if (!e.repeat) interact(); return; }
    if (e.key === ']') { if (!e.repeat) stepPhoto(1); return; }
    if (e.key === '[') { if (!e.repeat) stepPhoto(-1); return; }
    const dir = KEYMAP[e.key]; if (!dir) return;
    e.preventDefault(); unlock();
    if (!keys[dir] && !e.repeat) { tapDir = [dir === 'r' ? 1 : dir === 'l' ? -1 : 0, dir === 'd' ? 1 : dir === 'u' ? -1 : 0]; tap = 0.16; }
    keys[dir] = true;
  });
  document.addEventListener('keyup', (e) => { if (e.key === ' ' && mg.hold) mgHold(false); const dir = KEYMAP[e.key]; if (dir) keys[dir] = false; });
  window.addEventListener('blur', () => { keys = {}; });

  const stick = $('stick'), knob = $('stickKnob'), KMAX = 32;
  function setKnob(dx, dy) {
    const q = (v) => Math.round(v / 4) * 4, key = q(dx) + ',' + q(dy);
    if (key === knobKey) return;
    knobKey = key; knob.style.transform = 'translate(' + q(dx) + 'px,' + q(dy) + 'px)';
  }
  function joyMove(e) {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > KMAX) { dx *= KMAX / d; dy *= KMAX / d; }
    joy.x = dx / KMAX; joy.y = dy / KMAX;
    setKnob(dx, dy);
  }
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); unlock(); sfx('click'); joy.on = true; try { stick.setPointerCapture(e.pointerId); } catch (x) {} joyMove(e); });
  stick.addEventListener('pointermove', (e) => { if (joy.on) joyMove(e); });
  const joyEnd = () => { joy.on = false; joy.x = joy.y = 0; setKnob(0, 0); };
  stick.addEventListener('pointerup', joyEnd);
  stick.addEventListener('pointercancel', joyEnd);
  stick.addEventListener('lostpointercapture', joyEnd);
  document.querySelectorAll('.gbtn').forEach((b) => {
    b.addEventListener('pointerdown', () => { b.classList.add('down'); if (b.dataset.btn === 'a' && mg.open) mgHold(true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { b.classList.remove('down'); if (b.dataset.btn === 'a' && mg.hold) mgHold(false); }));
    b.addEventListener('click', () => press(b.dataset.btn));
  });

  /* ---------- things react when you poke them ---------- */
  const YARN = ['#E8664F', '#F6CE7B', '#7FB7C9', '#B58AD6', '#8CC28A'];
  function emit(o, kind, n) {
    const cx = o.x + o.w / 2, cy = o.y + o.h * 0.35;
    for (let i = 0; i < n; i++) {
      const d = div('pt ' + kind, 'left:' + (cx + (Math.random() - 0.5) * o.w * 0.6).toFixed(1) + 'px;top:' + cy.toFixed(1) + 'px;--dx:' + ((Math.random() - 0.5) * 26).toFixed(1) + 'px;--dy:' + (-(20 + Math.random() * 26)).toFixed(1) + 'px;animation-delay:' + (i * 70) + 'ms', 900);
      if (kind === 'note') d.textContent = Math.random() > 0.5 ? '♪' : '♫';
      if (kind === 'heart') d.textContent = '♥';
      if (kind === 'yarn') d.style.background = YARN[i % YARN.length];
      setTimeout(() => d.remove(), 1800);
    }
  }
  function wiggle(id) {
    const b = objEls[id]; if (!b) return;
    b.classList.remove('wig'); void b.offsetWidth; b.classList.add('wig');
    setTimeout(() => b.classList.remove('wig'), 500);
  }
  let zapT = 0;
  function zapTv() {
    tvScr.style.setProperty('--hue', Math.floor(Math.random() * 300) + 'deg');
    tvScr.classList.add('zap'); clearTimeout(zapT); zapT = setTimeout(() => tvScr.classList.remove('zap'), 700);
  }
  function react(id) {
    const o = OBJS.find((q) => q.id === id); if (!o) return;
    wiggle(id);
    if (id === 'bake') { emit(o, 'steam', 6); sfx('ding'); }
    else if (id === 'tv') { zapTv(); sfx('zap'); }
    else if (id === 'music') { emit(o, 'note', 5); sfx('melody'); }
    else if (id === 'games') { emit(o, 'spark', 6); sfx('blip'); }
    else if (id === 'crochet') { emit(o, 'yarn', 7); sfx('select'); }
    else if (id === 'cats') emit({ x: c.x - 8, y: c.y - 62, w: 16, h: 6 }, 'heart', 5);
    else if (id === 'camping') { emit(o, 'spark', 6); sfx('select'); }
    else if (id === 'drinks') { emit(o, 'bubble', 7); sfx('pop'); }
    else if (id === 'fish') { emit(o, 'splash', 8); sfx('splash'); }
    else { emit(o, 'spark', 4); sfx('paper'); }
  }

  /* ---------- campfire mini-game: roast a marshmallow ---------- */
  const mm = document.createElement('div');
  mm.className = 'sv mallow'; mm.hidden = true; mm.setAttribute('role', 'dialog'); mm.setAttribute('aria-label', 'Roast a marshmallow');
  mm.innerHTML =
    '<div class="mm-head"><b>Roast a marshmallow</b><button type="button" class="mm-x" aria-label="Close">×</button></div>' +
    '<p class="mm-hint" id="mmHint" aria-live="polite"></p>' +
    '<div class="mm-stage"><div class="mm-fire"></div><div class="mm-stick" id="mmStick"><i class="mm-m" id="mmM"></i></div></div>' +
    '<div class="mm-meter"><i class="mm-gold"></i><i class="mm-pin" id="mmPin"></i></div>' +
    '<div class="mm-scale"><span>raw</span><span>golden</span><span>burnt</span></div>' +
    '<div class="mm-btns"><button type="button" class="btn btn-gold" id="mmHold">Hold to roast</button><button type="button" class="btn btn-wood" id="mmAgain" hidden>Try again</button></div>';
  vp.appendChild(mm);
  mm.querySelector('.mm-fire').style.backgroundImage = 'url(' + IMG.fire + ')';
  const mmM = $('mmM'), mmPin = $('mmPin'), mmHint = $('mmHint'), mmStick = $('mmStick'), mmAgain = $('mmAgain');
  const MMC = [[0, [251, 244, 230]], [0.45, [243, 220, 168]], [0.7, [217, 152, 74]], [0.85, [138, 74, 30]], [1, [42, 26, 18]]];
  function mmColor(h) {
    for (let i = 1; i < MMC.length; i++) if (h <= MMC[i][0]) { const a = MMC[i - 1], b = MMC[i], t = (h - a[0]) / (b[0] - a[0]); return 'rgb(' + a[1].map((v, k) => Math.round(v + (b[1][k] - v) * t)).join(',') + ')'; }
    return 'rgb(42,26,18)';
  }
  function mmDraw() {
    mmM.style.background = mmColor(mg.heat);
    mmPin.style.left = (mg.heat * 100).toFixed(1) + '%';
    mmStick.classList.toggle('in', mg.hold);
  }
  function mmReset() {
    mg.heat = 0; mg.done = false; mg.hold = false;
    mmHint.textContent = 'Hold the button (or Space, or A) to toast. Let go when it is golden.';
    mmAgain.hidden = true; mmDraw();
  }
  function openMallow() { closePop(false); promptFor = null; promptBtn.hidden = true; mg.open = true; mm.hidden = false; mmReset(); sfx('open'); }
  function closeMallow() { if (!mg.open) return; mg.open = false; mg.hold = false; mg.pending = false; mm.hidden = true; sfx('close'); }
  function goRoast() { goTo(206, 522, null); mg.pending = true; tgtOpen = false; }
  const fireBox = { x: 192, y: 472, w: 28, h: 30 };
  function mmFinish(msg, ok) {
    mg.done = true; mg.hold = false; mmHint.textContent = msg; mmAgain.hidden = false; mmDraw();
    if (ok) { Q.smore = true; sfx('catch'); emit(fireBox, 'spark', 10); checkQuests(); }
  }
  function mgHold(on) {
    if (!mg.open || mg.done || on === mg.hold) return;
    if (on) { mg.hold = true; sfx('sizzle'); mmDraw(); return; }
    mg.hold = false;
    const h = mg.heat;
    if (h < 0.12) { mmDraw(); return; }
    if (h < 0.45) { sfx('miss'); mmFinish('Still raw in the middle. Try again!', false); }
    else if (h < 0.6) { sfx('miss'); mmFinish('Almost! It needed a little more time.', false); }
    else if (h <= 0.85) mmFinish('Perfect golden marshmallow!', true);
    else { sfx('miss'); mmFinish('A bit charred, but still tasty.', false); }
  }
  function stepMallow(dt) {
    if (mg.open) { crT -= dt; if (crT <= 0) { sfx(mg.hold && !mg.done ? 'crackle' : 'crackleSoft'); crT = (mg.hold ? 0.15 : 0.3) + Math.random() * (mg.hold ? 0.3 : 0.8); } }
    if (!mg.open || mg.done || !mg.hold) return;
    mg.heat = Math.min(1, mg.heat + 0.26 * dt);
    if (mg.heat >= 1) { sfx('burn'); emit(fireBox, 'spark', 8); mmFinish('It caught fire! Burnt to a crisp.', false); return; }
    mmDraw();
  }
  mm.addEventListener('click', (e) => e.stopPropagation());
  mm.querySelector('.mm-x').addEventListener('click', closeMallow);
  mmAgain.addEventListener('click', () => { sfx('select'); mmReset(); });
  const mmHold = $('mmHold');
  mmHold.addEventListener('pointerdown', (e) => { e.preventDefault(); mgHold(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => mmHold.addEventListener(ev, () => mgHold(false)));

  /* ---------- time of day: follows the visitor's clock, or tap to change ---------- */
  const todBtn = $('tod'), TOD_NAMES = ['Auto', 'Day', 'Dusk', 'Night'];
  let todMode = 0;
  function todVals() {
    if (todMode === 1) return [0, 0];
    if (todMode === 2) return [0, 1];
    if (todMode === 3) return [1, 0];
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    let n = 0;
    if (h >= 20.5 || h < 5.5) n = 1; else if (h >= 19) n = (h - 19) / 1.5; else if (h < 7) n = 1 - (h - 5.5) / 1.5;
    return [n, Math.max(0, 1 - Math.abs(h - 18.3) / 1.5, 1 - Math.abs(h - 6.3))];
  }
  function applyTod() {
    const v = todVals();
    vp.style.setProperty('--night', v[0].toFixed(2)); vp.style.setProperty('--dusk', v[1].toFixed(2));
    world.classList.toggle('lit', v[0] > 0.3);
    todBtn.textContent = 'Time: ' + TOD_NAMES[todMode];
  }
  todBtn.addEventListener('click', (e) => { e.stopPropagation(); unlock(); todMode = (todMode + 1) % 4; sfx('chime'); applyTod(); });
  applyTod(); setInterval(applyTod, 60000);

  /* glow the console buttons that do something right now: A near an object, X and Y when there are photos to flip */
  const gbA = document.querySelector('.gb-a'), gbX = document.querySelector('.gb-x'), gbY = document.querySelector('.gb-y');
  let glowA = false, glowXY = false;
  function updateGlow() {
    const o = popup && OBJS.find((q) => q.id === popup);
    const a = !!promptFor || (mg.open && !mg.done);
    const xy = !!(o && !mg.open && photosFor(o).length > 1);
    if (a !== glowA) { glowA = a; gbA.classList.toggle('glow', a); }
    if (xy !== glowXY) { glowXY = xy; gbX.classList.toggle('glow', xy); gbY.classList.toggle('glow', xy); }
  }
  function puff(x, y) {
    const d = div('puff', 'left:' + (x - 3).toFixed(0) + 'px;top:' + (y - 3).toFixed(0) + 'px', y - 1);
    setTimeout(() => d.remove(), 520);
  }

  function stepHouse(dt) {
    const SPD = 115;
    let ix = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), iy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (!ix && !iy && (Math.abs(joy.x) > 0.22 || Math.abs(joy.y) > 0.22)) { ix = joy.x; iy = joy.y; }
    let len = Math.hypot(ix, iy), vx = 0, vy = 0;
    if (!joy.on) setKnob(len ? ix / Math.max(1, len) * KMAX * 0.75 : 0, len ? iy / Math.max(1, len) * KMAX * 0.75 : 0);
    if (tap > 0 && !len && tapDir) { ix = tapDir[0]; iy = tapDir[1]; len = Math.hypot(ix, iy); tap -= dt; }
    if (mg.open) { len = 0; ix = iy = 0; tap = 0; }
    if (len > 0.01) { tgt = null; route = []; dest = null; mg.pending = false; const m = Math.min(1, len); vx = ix / len * SPD * m; vy = iy / len * SPD * m; }
    else if (tgt) {
      const ddx = tgt[0] - p.x, ddy = tgt[1] - p.y, d = Math.hypot(ddx, ddy);
      if (d < 2) { tgt = route.shift() || null; if (!tgt) dest = null; }
      else { const sp = Math.min(SPD, d / dt); vx = ddx / d * sp; vy = ddy / d * sp; }
    }
    let moving = !!(vx || vy);
    if (moving) {
      const ox = p.x, oy = p.y;
      const nx = p.x + vx * dt; if (!hit(nx, p.y)) p.x = nx;
      const ny = p.y + vy * dt; if (!hit(p.x, ny)) p.y = ny;
      if (Math.abs(vx) > 1) p.f = vx < 0 ? 'l' : 'r';
      const moved = Math.hypot(p.x - ox, p.y - oy);
      if (moved < 0.01) moving = false;
      if (tgt) { stuck = moved < SPD * dt * 0.2 ? stuck + dt : 0; if (stuck > 0.35) { tgt = null; route = []; dest = null; stuck = 0; } }
      stepT += dt; if (moving && stepT > 0.3) { stepT = 0; sfx(p.y > 380 ? 'grass' : 'step'); puff(p.x, p.y); }
    }
    if (!dest && mark.classList.contains('on')) mark.classList.remove('on');
    // cat (if it ever ends up inside something solid, hop out to the nearest free spot)
    if (hit(c.x, c.y)) {
      for (let r = 6, done = false; r < 140 && !done; r += 6) for (let a = 0; a < 16 && !done; a++) {
        const nx = c.x + Math.cos(a / 16 * 6.2832) * r, ny = c.y + Math.sin(a / 16 * 6.2832) * r;
        if (!hit(nx, ny)) { c.x = nx; c.y = ny; c.m = false; c.wait = 0.5; done = true; }
      }
    }
    c.wait -= dt;
    if (c.wait <= 0 && !c.m) {
      for (let i = 0; i < 12; i++) { const tx = 80 + Math.random() * 540, ty = 150 + Math.random() * 180; if (!hit(tx, ty)) { c.tx = tx; c.ty = ty; c.m = true; break; } }
      if (!c.m) c.wait = 1;
    }
    if (c.m) {
      const ddx = c.tx - c.x, ddy = c.ty - c.y, d = Math.hypot(ddx, ddy);
      if (d < 2) { c.m = false; c.wait = 2.5 + Math.random() * 3; }
      else {
        const sp = Math.min(62, d / dt), mx = ddx / d * sp * dt, my = ddy / d * sp * dt, bx = c.x, by = c.y;
        if (!hit(c.x + mx, c.y)) c.x += mx;
        if (!hit(c.x, c.y + my)) c.y += my;
        if (Math.abs(ddx) > 1) c.f = ddx < 0 ? 'l' : 'r';
        if (Math.hypot(c.x - bx, c.y - by) < 0.01) { c.m = false; c.wait = 0.5; }
      }
    }
    // camera + draw
    const v = view();
    if (!cam) cam = { x: v.dx, y: v.dy };
    const a = 1 - Math.exp(-dt * 7);
    cam.x += (v.dx - cam.x) * a; cam.y += (v.dy - cam.y) * a;
    world.style.transform = 'translate(' + (-cam.x).toFixed(2) + 'px,' + (-cam.y).toFixed(2) + 'px) scale(' + v.S.toFixed(3) + ')';
    const K = 1.4;
    lia.style.left = (p.x - 34 * K).toFixed(2) + 'px';
    lia.style.top = (p.y - 48 * K).toFixed(2) + 'px';
    lia.style.zIndex = Math.round(p.y);
    lia.style.transform = 'scaleX(' + (p.f === 'l' ? -1 : 1) + ')';
    if (p.m !== moving) lia.className = 'lia ' + (moving ? 'walk' : 'idle');
    p.m = moving;
    catBtn.style.left = (c.x - 29).toFixed(2) + 'px';
    catBtn.style.top = (c.y - 53).toFixed(2) + 'px';
    catBtn.style.zIndex = Math.round(c.y);
    catSpr.style.transform = 'scaleX(' + (c.f === 'l' ? -1 : 1) + ')';
    const cc = c.m ? 'run' : 'idle';
    if (catSpr.className !== cc) catSpr.className = cc;
    const an = p.y > 380 ? 'Backyard' : 'Home';
    if (an !== areaName) { areaName = an; hud.textContent = an; sfx('door'); }
    if (!mg.open && Math.hypot(p.x - 206, p.y - 490) < 170) { fireT -= dt; if (fireT <= 0) { sfx('crackleSoft'); fireT = 0.5 + Math.random() * 1.3; } }
    if (mg.pending && !tgt && !mg.open) { mg.pending = false; if (Math.hypot(p.x - 206, p.y - 522) < 16) openMallow(); }
    if (mg.open) return;
    // proximity dialogs
    let near = null, best = Infinity;
    spots().forEach((o) => { const d = Math.hypot(o.cx - p.x, o.cy - p.y); if (d < o.r && d < best) { best = d; near = o.id; } });
    if (dismissed && near !== dismissed) dismissed = null;
    // no automatic popups: close one when you walk away, and offer a 'press E' prompt when you are next to something
    if (popup && near !== popup && moving && !tgtOpen) closePop(false);
    const want = near && !popup && !tgtOpen ? near : null;
    if (want !== promptFor) {
      promptFor = want;
      if (want) { const po = OBJS.find((q) => q.id === want); promptBtn.innerHTML = '<kbd>E</kbd><span>' + esc(po ? po.title : '') + '</span>'; }
      promptBtn.hidden = !want;
    }
    if (tgtOpen && !tgt) tgtOpen = false;
  }

  /* ---------------- Fishing ---------------- */
  const PROJECTS = [
    { id: 'ai', name: 'Contract Risk Reviewer', fish: 'Guppy', src: 'assets/f_ai.png', tint: '#F6CE7B', media: '[Pipeline demo]', tag: 'Applied ML', blurb: 'Flags risky contract clauses by severity, with explanations a reviewer can trust.', points: ['Multi-label transformer covering 41 clause types', 'Trained on 510 CUAD contracts and 13,823 labeled spans', 'Explainable risk scores, checked with precision, recall and F1'], stack: 'Python and PyTorch', primary: 'Read the case study' },
    { id: 'veil', name: 'Veil-Sur', fish: 'Clownfish', src: 'assets/f_veil.png', tint: '#E1B79E', media: '[Gameplay clip]', tag: 'Game development', blurb: 'Photograph clues, escape mutants and solve puzzles. My group\'s prototype became a year-long team project at DGA Studios. Incoming 2027 Steam Release!', points: ['Dialogue manager and tutorial tooltips', 'Reusable Unity UI components', 'Sprints and code review, 9+ hours a week'], stack: 'C# and Unity', credit: 'Art by Pape', primary: 'Play it' },
    { id: 'bracket', name: 'Bracket City', fish: 'Golden Tench', src: 'assets/f_bracket.png', tint: '#BECE87', media: '[Game demo]', tag: 'Web', blurb: 'A real-time take on The Atlantic’s bracket word puzzle.', points: ['OCaml backend on Dream with WebSockets', 'Timers, input checks and adjustable difficulty', '90% test coverage with OUnit'], stack: 'OCaml, Dream and JavaScript', primary: 'Try it' },
    { id: 'xr', name: 'Smart-glasses memory app', fish: 'Axolotl', src: 'assets/f_xr.png', tint: '#BCB2AE', media: '[Glasses demo]', tag: 'Extended reality', blurb: 'Smart glasses that help you remember who you just met.', points: ['FastAPI service with face and speech recognition', 'Running on RayNeo X3 glasses', 'Earlier: VR scenes with real-time scent feedback'], stack: 'FastAPI, ML and Unity', primary: 'Watch the demo' },
    { id: 'ops', name: 'Project Teams Ops Hub', fish: 'Bluegill', src: 'assets/f_ops.png', tint: '#8EB1CC', media: '[Dashboard screenshot]', tag: 'Internal tools', blurb: 'The incident platform behind all 36 Cornell project teams.', points: ['Maintain and extend it in JavaScript and Apps Script', 'Python scraper across 36 team websites', 'Directory filterable by team and lead'], stack: 'JavaScript, Apps Script and Python', primary: 'Learn more' },
    { id: 'brew', name: 'BREWHAHA', fish: 'Atlantic Bass', src: 'assets/f_brew.png', tint: '#E8A450', media: '[Jam trailer]', tag: 'Game jam, first place', blurb: 'Twist the mayor’s words into a scandal. Built in seven hours for the DGA Fall Game Jam.', points: ['Word-transformation puzzle mechanic', 'Core systems and every piece of art', 'A complete build by the deadline'], stack: 'C# and Unity', primary: 'Play it' },
  ];
  const projCfg = CFG.projects || {};
  const lake = $('lake'), rod = $('rod'), bobber = $('bobber'), bang = $('bang'), leap = $('leap'), lakeMsg = $('lakeMsg'), banner = $('caughtBanner'), card = $('card');
  const F = { phase: 'idle', bx: 50, by: 62, target: null, pick: null, catchId: null, note: null, sel: null, timers: [] };
  const byId = (id) => PROJECTS.find((x) => x.id === id);
  function later(fn, ms) { F.timers.push(setTimeout(fn, ms)); }
  function clearTimers() { F.timers.forEach(clearTimeout); F.timers = []; }
  function renderGuide() {
    $('guide').innerHTML = PROJECTS.map((pr) => {
      const on = F.target === pr.id, got = Q.caught.indexOf(pr.id) >= 0;
      return '<button type="button" class="fish-opt" role="radio" aria-checked="' + on + '" data-id="' + pr.id + '">' +
        '<span class="fish-ico pxs"><img src="' + pr.src + '" alt=""></span>' +
        '<span class="fish-txt"><b>' + esc(pr.fish) + '</b><small>' + esc(pr.name) + '</small></span>' +
        '<span class="fish-badge">' + (on ? 'Bait set' : (got ? 'Caught' : '')) + '</span></button>';
    }).join('');
    $('caughtCount').textContent = Q.caught.length + ' / 6 caught';
    $('guide').querySelectorAll('.fish-opt').forEach((b) => b.addEventListener('click', () => {
      unlock(); sfx('select');
      F.target = F.target === b.dataset.id ? null : b.dataset.id; F.note = null;
      if (F.target && Q.caught.indexOf(F.target) >= 0) { F.sel = F.target; renderCard(); }
      renderGuide(); renderLake();
    }));
  }
  function renderLake() {
    const ph = F.phase;
    const want = 'rod r-' + ph;
    if (rod.className !== want) rod.className = want;
    const msgs = { idle: F.target ? 'Bait set for the ' + byId(F.target).fish + '. Click anywhere on the water!' : 'Click anywhere on the water to cast.', cast: 'Casting...', wait: 'Waiting for a bite... (click elsewhere to recast)', bite: 'A bite! Click now to reel in!', reel: 'Reeling it in...', caught: 'Nice catch!', miss: 'It got away. Cast again!' };
    lakeMsg.textContent = F.note || msgs[ph];
    const showB = ph === 'wait' || ph === 'bite';
    bobber.hidden = !showB;
    bobber.className = 'bobber ' + (ph === 'bite' ? 'dip' : 'bob');
    bobber.style.left = F.bx + '%'; bobber.style.top = F.by + '%';
    bang.hidden = ph !== 'bite';
    bang.style.left = F.bx + '%'; bang.style.top = (F.by - 12) + '%';
    const showL = ph === 'reel' && F.catchId;
    if (showL) { leap.src = byId(F.catchId).src; leap.style.left = F.bx + '%'; leap.style.top = F.by + '%'; leap.hidden = false; leap.style.animation = 'none'; void leap.offsetWidth; leap.style.animation = ''; }
    else leap.hidden = true;
    if (ph === 'caught' && F.catchId) {
      const pr = byId(F.catchId);
      banner.innerHTML = '<img src="' + pr.src + '" alt=""><div><small>You caught a ' + esc(pr.fish) + '!</small><b>' + esc(pr.name) + '</b></div>';
      banner.hidden = false;
    } else banner.hidden = true;
  }
  function renderCard() {
    const pr = F.sel && byId(F.sel);
    if (!pr) { card.hidden = true; return; }
    const pc = projCfg[pr.id] || {};
    const media = pc.media ? '<img class="media" src="' + esc(pc.media) + '" alt="' + esc(pr.name) + ' preview">' : esc(pr.media);
    card.innerHTML =
      '<div class="card-media pxs" style="background:' + pr.tint + '">' + media + '</div>' +
      '<div class="card-body"><h3>' + esc(pr.name) + '</h3><p>' + esc(pr.blurb) + '</p><ul>' + pr.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<span class="card-stack">Made with ' + esc(pr.stack) + '</span>' + (pr.credit ? '<span class="card-stack">' + esc(pr.credit) + '</span>' : '') + '<div class="card-links">' +
      (pc.link ? '<a class="btn btn-gold" href="' + esc(pc.link) + '" target="_blank" rel="noopener">' + esc(pr.primary) + '</a>' : '') +
      (pc.github ? '<a class="btn btn-wood" href="' + esc(pc.github) + '" target="_blank" rel="noopener">Source on GitHub</a>' : '') +
      '</div></div>';
    card.hidden = false;
  }
  function ripple(xp, yp, big) {
    const r = document.createElement('div');
    r.className = 'ripple' + (big ? ' big' : ''); r.setAttribute('aria-hidden', 'true');
    r.style.left = xp + '%'; r.style.top = yp + '%';
    r.addEventListener('animationend', () => r.remove());
    lake.appendChild(r);
  }
  function pickFish() {
    if (F.target) return F.target;
    const left = PROJECTS.filter((x) => Q.caught.indexOf(x.id) < 0);
    const pool = left.length ? left : PROJECTS;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }
  function startCast(xp, yp) {
    clearTimers();
    sfx('cast');
    if (xp < 30 && yp > 56 && yp < 84) xp = 33;   // keep the bobber off the boat
    Object.assign(F, { phase: 'cast', bx: Math.max(3, Math.min(97, xp)), by: Math.max(44, Math.min(96, yp)), note: null, pick: pickFish() });
    ripple(F.bx, F.by);
    renderLake();
    later(() => {
      sfx('splash'); F.phase = 'wait'; ripple(F.bx, F.by, true); renderLake();
      later(() => {
        sfx('bite'); F.phase = 'bite'; ripple(F.bx, F.by, true); renderLake();
        later(() => {
          if (F.phase !== 'bite') return;
          sfx('miss'); F.phase = 'miss'; renderLake();
          later(() => { if (F.phase === 'miss') { F.phase = 'idle'; renderLake(); } }, 1800);
        }, 1500);
      }, 1400 + Math.random() * 2200);
    }, 1500);
  }
  function lakeClick(xp, yp) {
    unlock();
    const ph = F.phase;
    if (ph === 'cast' || ph === 'reel') return;
    if (ph === 'bite') {
      clearTimers();
      const id = F.pick || pickFish();
      sfx('splash'); ripple(F.bx, F.by, true);
      Object.assign(F, { phase: 'reel', catchId: id, note: null });
      renderLake();
      later(() => {
        sfx('catch');
        if (Q.caught.indexOf(id) < 0) Q.caught.push(id);
        F.phase = 'caught'; F.sel = id;
        renderLake(); renderGuide(); renderCard(); checkQuests();
        later(() => { if (F.phase === 'caught') { F.phase = 'idle'; F.catchId = null; renderLake(); } }, 2600);
      }, 1000);
      return;
    }
    // idle, miss, caught or waiting: a click on the water casts there
    if (yp < 42) { F.note = 'Aim for the water.'; renderLake(); return; }
    startCast(xp, yp);
  }
  lake.addEventListener('click', (e) => { const r = lake.getBoundingClientRect(); lakeClick((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); });
  lake.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lakeClick(42, 66); } });
  renderGuide(); renderLake();

  /* lake ambience: drifting clouds, glints on the water, fish that hop now and then */
  (function () {
    const sky = lake.querySelector('.sky');
    [[6, 70, -10], [26, 105, -55], [14, 140, -90]].forEach((q) => {
      const im = document.createElement('img');
      im.className = 'cloud'; im.alt = ''; im.src = IMG.cloud; im.setAttribute('aria-hidden', 'true');
      im.style.cssText = 'top:' + q[0] + '%;animation-duration:' + q[1] + 's;animation-delay:' + q[2] + 's';
      sky.appendChild(im);
    });
    const r = rng(5);
    for (let i = 0; i < 16; i++) {
      const g = document.createElement('i');
      g.className = 'glint'; g.setAttribute('aria-hidden', 'true');
      g.style.cssText = 'left:' + (r() * 96 + 2).toFixed(1) + '%;top:' + (44 + r() * 52).toFixed(1) + '%;animation-delay:' + (-r() * 4).toFixed(2) + 's;animation-duration:' + (2.2 + r() * 2.5).toFixed(2) + 's';
      lake.appendChild(g);
    }
    let lakeOn = false;
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { lakeOn = es[0].isIntersecting; }, { threshold: 0.3 }).observe(lake);
    (function hop() {
      setTimeout(() => {
        if (lakeOn && F.phase === 'idle') {
          const x = 36 + Math.random() * 58, y = 52 + Math.random() * 38;
          const im = document.createElement('img');
          im.className = 'jumper'; im.alt = ''; im.setAttribute('aria-hidden', 'true');
          im.src = PROJECTS[Math.floor(Math.random() * PROJECTS.length)].src;
          im.style.left = x + '%'; im.style.top = y + '%';
          im.addEventListener('animationend', () => { im.remove(); ripple(x, y, true); sfx('splashSm'); });
          lake.appendChild(im);
          ripple(x, y); sfx('splashSm');
        }
        hop();
      }, 5000 + Math.random() * 6000);
    })();
  })();

  /* ---------------- About + inventory ---------------- */
  if (photos.about) $('aboutPhoto').innerHTML = '<img src="' + esc(photos.about) + '" alt="Claire Cheng">';
  const chips = ['#E8A450', '#A54222', '#748DAC', '#70994D', '#3C3F61', '#CE8137'];
  $('inventory').innerHTML = BOOKS.map((b, i) => '<span class="chip pxs"><i style="background:' + chips[i % chips.length] + '"></i>' + esc(b[0]) + '</span>').join('');

  /* ---------------- Live data ---------------- */
  const lf = CFG.lastfm || {};
  if (lf.user && lf.apiKey) {
    fetch('https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&format=json&user=' + encodeURIComponent(lf.user) + '&api_key=' + encodeURIComponent(lf.apiKey))
      .then((r) => r.json()).then((j) => {
        const tr = j && j.recenttracks && j.recenttracks.track && j.recenttracks.track[0];
        if (!tr) return;
        live.song = tr.name; live.artist = (tr.artist && (tr.artist['#text'] || tr.artist.name)) || live.artist; live.isLive = true;
        const img = (tr.image || []).filter((x) => x['#text']).pop();
        if (img) live.albumArt = img['#text'];
        if (popup === 'music') renderDialog();
      }).catch(() => {});
  }

  /* ---------------- Friends & fun stuff: the memory claw machine ---------------- */
  let clawStep = null;
  (function () {
    const list = (CFG.gallery || []).map((g) => (typeof g === 'string' ? { src: g, caption: '' } : g)).filter((g) => g && g.src);
    const glass = $('clawGlass'), pit = $('pit'), clawEl = $('claw'), cable = $('clawCable'), head = $('clawHead'), msgEl = $('clawMsg'), pol = $('polaroid');
    const board = $('board'), noteTitle = $('noteTitle'), noteText = $('noteText'), scMem = $('scMem'), scTry = $('scTry'), scBest = $('scBest');
    const shelf = $('shelfList'), shelfCount = $('shelfCount'), btnL = $('clawL'), btnR = $('clawR'), btnD = $('clawDrop'), allBtn = $('shelfAll');
    if (!list.length) {
      pit.innerHTML = '<div class="gal-empty">Add photos to <b>gallery</b> in config.js to fill the claw machine.</div>';
      $('shelfList').closest('.shelf').hidden = true; return;
    }
    const N = list.length;
    const clawSpr = (open) => mk(24, 20, (g) => {
      R(g, '#8a8794', 10, 0, 4, 3); R(g, '#c4c1cd', 8, 3, 8, 5); R(g, '#5a5866', 8, 7, 8, 1); R(g, '#e8e6f0', 9, 3, 2, 3);
      let last = 0;
      for (let k = 0; k < 10; k++) { const dx = open ? Math.round(k * 0.75) : -Math.round(k * 0.15); last = dx; R(g, '#c4c1cd', 7 - dx, 8 + k, 3, 1); R(g, '#c4c1cd', 14 + dx, 8 + k, 3, 1); R(g, '#8a8794', 7 - dx, 8 + k, 1, 1); R(g, '#8a8794', 16 + dx, 8 + k, 1, 1); }
      R(g, '#e8e6f0', 8 - last + (open ? 2 : 1), 17, 2, 2); R(g, '#e8e6f0', 14 + last - (open ? 2 : 1), 17, 2, 2);
    });
    const OPEN = clawSpr(true), CLOSED = clawSpr(false);
    head.src = OPEN;
    const HH = 60;
    const BALLS = ["#ff5fa2", "#4de0d0", "#F6CE7B", "#b58ad6", "#7fb7c9", "#e8664f", "#8cc28a"];
    const prizes = list.map((g, k) => {
      const el = document.createElement('div');
      el.className = 'prize';
      const lab = String(g.label || (g.caption || '').split(/\s+/)[0].replace(/[^\w'-]/g, '') || (k + 1)).slice(0, 10);
      el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Prize ball: ' + (g.caption || ('Memory ' + (k + 1))));
      el.style.setProperty('--c', BALLS[k % BALLS.length]);
      el.innerHTML = '<span class="ball-t">' + esc(lab) + '</span><img class="ball-photo" alt="" src="' + esc(g.src) + '">';
      pit.appendChild(el);
      return { k, el, s: 80, cw: 88, ch: 100, hx: 0, hy: 0, vx: 0, vy: 0, held: false, taken: false };
    });
    const rnd = rng(33);
    const homes = prizes.map(() => ({ jx: (rnd() - 0.5) * 12, jy: (rnd() - 0.5) * 6, rot: 0 }));
    const got = new Set();
    let gw = 0, gh = 0, cx = 0, tx = 0, hy = 0, railY = 0, restY = 0, minX = 0, maxX = 0, chuteX = 0, chuteY = 0, stopY = 0;
    let sel = null, tries = 0, cheated = false, best = 0;
    try { best = +localStorage.getItem('cc-claw-best') || 0; } catch (e) { best = 0; }
    let wanted = null, st = 'idle', stT = 0, target = null, carried = null, queueDrop = false, polOpen = false, keyL = false, keyR = false, bL = false, bR = false, stepT = 0, msgT = 0;
    const setMsg = (t) => { msgEl.textContent = t; };
    let physAwake = 0;
    function setZ(p) { p.el.style.zIndex = String(1 + Math.min(9, Math.max(0, Math.floor(p.hy / gh * 10)))); }
    function physics(dt, silent) {
      const live = prizes.filter((p) => !p.held && !p.taken);
      const g = gh * 3.2, floorY = gh * 0.93, lx = gw * 0.2, rx = gw - 6;
      live.forEach((p) => { p.vy += g * dt; p.hx += p.vx * dt; p.hy += p.vy * dt; p.vx *= 0.995; });
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
          const a = live[i], b = live[j], dx = b.hx - a.hx, dy = b.hy - a.hy, d = Math.hypot(dx, dy), min = (a.s + b.s) / 2;
          if (d >= min) continue;
          const nx = d < 0.01 ? 0 : dx / d, ny = d < 0.01 ? 1 : dy / d, pen = min - d;
          a.hx -= nx * pen / 2; a.hy -= ny * pen / 2; b.hx += nx * pen / 2; b.hy += ny * pen / 2;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const k2 = -rv * 0.55; a.vx -= nx * k2; a.vy -= ny * k2; b.vx += nx * k2; b.vy += ny * k2; }
        }
        live.forEach((p) => {
          const r = p.s / 2;
          if (p.hy > floorY - r) { p.hy = floorY - r; if (p.vy > 0) p.vy *= -0.15; p.vx *= 0.85; }
          if (p.hx < lx + r) { p.hx = lx + r; if (p.vx < 0) p.vx *= -0.2; }
          if (p.hx > rx - r) { p.hx = rx - r; if (p.vx > 0) p.vx *= -0.2; }
        });
      }
      let fast = 0; live.forEach((p) => { fast = Math.max(fast, Math.hypot(p.vx, p.vy)); });
      if (!silent) { live.forEach((p) => { place(p, p.hx, p.hy); setZ(p); }); if (fast > 25) physAwake = Math.max(physAwake, 0.25); }
      return fast;
    }
    function place(p, x, y) { p.el.style.left = (x - p.s / 2).toFixed(1) + 'px'; p.el.style.top = (y - p.s * 0.5).toFixed(1) + 'px'; }
    function layout() {
      const w = glass.clientWidth, h = glass.clientHeight;
      if (!w || !h) return;
      const fx = gw ? cx / gw : 0.5, ft = gw ? tx / gw : 0.5;
      gw = w; gh = h;
      railY = gh * 0.06 + 3; restY = railY + 4;
      minX = gw * 0.07; maxX = gw * 0.93;
      chuteX = gw * 0.105; chuteY = gh * 0.86;
      const left = gw * 0.24, regW = gw * 0.95 - left, cols = gw < 520 ? 3 : Math.max(Math.min(N, 5), Math.ceil(N / 3));
      const ts = Math.min(104, regW / cols * 1.05, gw * 0.19, Math.sqrt(regW * gh * 0.36 / N)), floor = gh * 0.93;
      prizes.forEach((p, i) => {
        const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, N - r * cols), rowW = regW * (inRow / cols);
        p.s = ts; p.cw = ts * 1.1; p.ch = ts * 1.25; p.vx = 0; p.vy = 0;
        p.hx = left + (regW - rowW) / 2 + (c + 0.5) * (rowW / inRow) + homes[i].jx;
        p.hy = floor - ts * 0.5 - r * ts * 0.78 + homes[i].jy;
        if (!p.held) { p.el.style.width = ts + 'px'; p.el.style.height = ts + 'px'; }
      });
      for (let n = 0; n < 160; n++) physics(1 / 60, true);
      physAwake = 1;
      prizes.forEach((p) => { if (!p.held && !p.taken) { place(p, p.hx, p.hy); setZ(p); } });
      cx = fx * gw; tx = ft * gw;
      if (st === 'idle') hy = restY;
      draw();
    }
    function draw() {
      clawEl.style.left = cx.toFixed(1) + 'px';
      cable.style.top = railY.toFixed(1) + 'px'; cable.style.height = Math.max(0, hy - railY).toFixed(1) + 'px';
      head.style.top = hy.toFixed(1) + 'px';
      if (carried) { carried.el.style.left = (cx - carried.cw / 2).toFixed(1) + 'px'; carried.el.style.top = (hy + 38).toFixed(1) + 'px'; }
    }
    function renderShelf() {
      board.style.setProperty('--pw', (N > 10 ? 58 : N > 6 ? 70 : 84) + 'px');
      shelf.innerHTML = list.map((g, k) => {
        const rot = ((k * 37) % 9) - 4;
        return got.has(k)
          ? '<button type="button" class="pin' + (sel === k ? ' sel' : '') + '" data-k="' + k + '" style="--r:' + rot + 'deg" aria-label="Open memory: ' + esc(g.caption || ('Photo ' + (k + 1))) + '"><img alt="" src="' + esc(g.src) + '"></button>'
          : '<span class="pin empty" style="--r:' + rot + 'deg" aria-hidden="true">?</span>';
      }).join('');
      shelfCount.textContent = got.size + ' / ' + N + ' pinned';
      allBtn.textContent = got.size >= N ? 'Refill machine' : 'Show all';
      shelf.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { unlock(); sel = +b.dataset.k; showNote(sel); renderShelf(); if (st === 'idle') showPol(sel, true); }));
      scMem.textContent = got.size + ' / ' + N; scTry.textContent = tries; scBest.textContent = best ? best + (best === 1 ? ' try' : ' tries') : '-';
    }
    function showNote(k) {
      const g = list[k];
      if (!g) { noteTitle.textContent = 'Memory wall'; noteText.textContent = 'Win a prize to pin it here. Click a pinned photo to read its story.'; return; }
      noteTitle.textContent = g.caption || ('Memory ' + (k + 1));
      noteText.textContent = g.story || '';
    }
    function showPol(k, fromShelf) {
      const g = list[k];
      polOpen = true;
      pol.innerHTML = '<div class="pol-card"><img alt="' + esc(g.caption || ('Memory ' + (k + 1))) + '" src="' + esc(g.src) + '"><p>' + esc(g.caption || ('Memory ' + (k + 1))) + '</p><button type="button" class="btn btn-wood pol-x">Back to the claw</button></div>';
      pol.hidden = false; sfx('open');
      pol.querySelector('.pol-x').addEventListener('click', (e) => { e.stopPropagation(); closePol(); });
      pol.querySelector('.pol-x').focus({ preventScroll: true });
      if (!fromShelf) { got.add(k); sel = k; renderShelf(); showNote(k); if (got.size === N) { setMsg('You collected every memory!'); sfx('quest'); if (!cheated && (!best || tries < best)) { best = tries; try { localStorage.setItem('cc-claw-best', String(best)); } catch (e) {} renderShelf(); toast('New best! Cleared in ' + tries + (tries === 1 ? ' try' : ' tries')); } } }
    }
    function closePol() { if (!polOpen) return; polOpen = false; pol.hidden = true; sfx('close'); setMsg(got.size >= N ? 'Machine empty! Tap Refill to play again.' : 'Grab another memory!'); glass.focus({ preventScroll: true }); }
    pol.addEventListener('click', (e) => { e.stopPropagation(); closePol(); });

    function calcStop() { stopY = target ? (target.hy - target.s * 0.5) - HH + 24 : gh * 0.84 - HH; }
    function startDrop() {
      tries++; scTry.textContent = tries;
      if (wanted && !wanted.taken && !wanted.held) target = wanted;
      else {
        const near = prizes.filter((p) => !p.taken && !p.held && Math.abs(p.hx - cx) < p.s * 0.5);
        near.sort((a, b) => a.hy - b.hy);
        target = near[0] || null;
      }
      wanted = null;
      calcStop();
      st = 'drop'; sfx('cast'); setMsg('Going down...');
    }
    function release() {
      const p = carried; carried = null;
      const k = p.k;
      p.el.classList.remove('held'); p.el.classList.add('falling');
      p.el.style.left = (chuteX - p.cw / 2) + 'px'; p.el.style.top = (chuteY - p.ch * 0.4) + 'px';
      setTimeout(() => { sfx('catch'); showPol(k, false); }, 650);
      setTimeout(() => { p.el.classList.remove('falling'); p.el.hidden = true; p.held = false; p.taken = true; physAwake = 3; }, 700);
    }
    clawStep = function (dt) {
      if (!gw) { layout(); return; }
      if (physAwake > 0) { physAwake -= dt; physics(dt); if (physAwake <= 0) prizes.forEach((p) => { p.vx = 0; p.vy = 0; }); }
      const sp = gw * 0.8;
      if (st === 'idle') {
        if (!polOpen) {
          const d = (keyR || bR ? 1 : 0) - (keyL || bL ? 1 : 0);
          if (d) tx = Math.max(minX, Math.min(maxX, tx + d * sp * dt));
          const dx = tx - cx;
          if (Math.abs(dx) > 0.5) {
            cx += Math.min(Math.abs(dx), sp * dt) * Math.sign(dx);
            stepT += dt; if (stepT > 0.16) { stepT = 0; sfx('step'); }
          } else if (queueDrop) { queueDrop = false; startDrop(); }
        } else queueDrop = false;
      } else if (st === 'drop') {
        calcStop(); hy += gw * 0.55 * dt;
        if (hy >= stopY) { hy = stopY; st = 'grab'; stT = 0; head.src = CLOSED; sfx('clunk'); }
      } else if (st === 'grab') {
        stT += dt;
        if (stT > 0.4) {
          if (target) { carried = target; target.held = true; target.taken = true; target.el.classList.add('held'); target.el.style.width = target.cw + 'px'; target.el.style.height = target.ch + 'px'; physAwake = 3; setMsg('Got one!'); }
          st = 'rise';
        }
      } else if (st === 'rise') {
        hy -= gw * 0.5 * dt;
        if (hy <= restY) {
          hy = restY;
          if (carried) st = 'haul';
          else { st = 'idle'; head.src = OPEN; tx = cx; sfx('miss'); setMsg('Missed! Try again.'); }
        }
      } else if (st === 'haul') {
        const dx = chuteX - cx;
        cx += Math.min(Math.abs(dx), gw * 0.55 * dt) * Math.sign(dx);
        if (Math.abs(chuteX - cx) < 1.5) { cx = chuteX; st = 'release'; stT = 0; head.src = OPEN; release(); }
      } else if (st === 'release') {
        stT += dt;
        if (stT > 0.8) { st = 'idle'; tx = cx; queueDrop = false; }
      }
      draw();
    };

    /* input: click the glass, arrow keys + space, or the buttons */
    const clampX = (v) => Math.max(minX, Math.min(maxX, v));
    glass.addEventListener('pointermove', (e) => { if (st !== 'idle' || polOpen || wanted || e.pointerType === 'touch') return; tx = clampX(e.clientX - glass.getBoundingClientRect().left); });
    glass.addEventListener('click', (e) => {
      unlock(); glass.focus({ preventScroll: true });
      if (polOpen || st !== 'idle') return;
      const ballEl = e.target.closest && e.target.closest('.prize');
      const ball = ballEl && prizes.find((p) => p.el === ballEl && !p.taken && !p.held);
      if (ball) { wanted = ball; tx = clampX(ball.hx); }
      else { wanted = null; tx = clampX(e.clientX - glass.getBoundingClientRect().left); }
      queueDrop = true;
    });
    glass.addEventListener('keydown', (e) => {
      if (polOpen) { if (e.key === 'Escape') closePol(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); unlock(); keyL = true; }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); unlock(); keyR = true; }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); unlock(); if (st === 'idle' && !e.repeat) { queueDrop = true; tx = cx; } }
    });
    glass.addEventListener('keyup', (e) => { if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyL = false; if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyR = false; });
    glass.addEventListener('blur', () => { keyL = keyR = false; });
    const hold = (b, set) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); unlock(); set(true); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => set(false))); };
    hold(btnL, (v) => { bL = v; }); hold(btnR, (v) => { bR = v; });
    btnD.addEventListener('click', () => { unlock(); if (st === 'idle' && !polOpen) { sfx('coin'); queueDrop = true; tx = cx; } });
    allBtn.addEventListener('click', () => {
      unlock();
      if (got.size >= N) {
        if (st !== 'idle' || polOpen) return;
        got.clear(); sfx('open'); tries = 0; cheated = false; sel = null; showNote(null);
        prizes.forEach((p) => { p.taken = false; p.held = false; p.el.hidden = false; p.el.classList.remove('pop'); void p.el.offsetWidth; p.el.classList.add('pop'); });
        layout();
        setMsg('Machine refilled!');
      } else {
        if (st !== 'idle') return;
        cheated = true; list.forEach((g, k) => { got.add(k); prizes[k].taken = true; prizes[k].el.hidden = true; });
        sfx('quest'); setMsg('Machine emptied. Every memory is on the shelf.');
      }
      renderShelf();
    });

    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(glass); else window.addEventListener('resize', layout);
    showNote(null); renderShelf(); layout();
    setMsg('Grab a memory!');
  })();

  /* ---------------- Life: twinkling stars and panels that slide in ---------------- */
  (function () {
    const bgT = document.querySelector('.title .bg'), r = rng(11);
    if (bgT) for (let i = 0; i < 46; i++) {
      const s = document.createElement('i');
      s.className = 'star'; s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'left:' + (r() * 100).toFixed(1) + '%;top:' + (r() * 55).toFixed(1) + '%;animation-delay:' + (-r() * 4).toFixed(2) + 's;animation-duration:' + (1.6 + r() * 2.4).toFixed(2) + 's' + (r() > 0.8 ? ';width:4px;height:4px' : '');
      bgT.appendChild(s);
    }
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.intro, .work-head, .guide, .job-sign, .jobs, .about-photo, .about-text, .contact-card').forEach((el, i) => {
      el.classList.add('rv'); el.style.transitionDelay = ((i % 4) * 60) + 'ms'; io.observe(el);
    });
  })();

  /* ---------------- Loop ---------------- */
  let last = 0;
  function tick(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    stepHouse(dt);
    stepMallow(dt);
    updateGlow();
    if (clawStep) clawStep(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
