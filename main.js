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
    }
  }
  const soundBtn = $('soundBtn');
  function paintSound() { soundBtn.textContent = muted ? 'Sound: off' : 'Sound: on'; soundBtn.setAttribute('aria-pressed', String(!muted)); }
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
      { id: 'hi', label: 'Say hi to Claire', n: Q.hi ? 1 : 0, of: 1 },
    ];
  }
  function renderQuests() {
    const ql = questList();
    const done = ql.filter((q) => q.n >= q.of).length;
    $('questTitle').textContent = 'Quests ' + done + '/4';
    $('questList').innerHTML = ql.map((q) => {
      const d = q.n >= q.of;
      const prog = q.of > 1 ? Math.min(q.n, q.of) + '/' + q.of : (d ? 'done' : '');
      return '<li class="' + (d ? 'done' : '') + '"><i aria-hidden="true"></i><span>' + esc(q.label) + '</span><small>' + prog + '</small></li>';
    }).join('');
    $('questAll').hidden = done < 4;
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
  if (CFG.links && CFG.links.github) $('githubLink').href = CFG.links.github;
  renderQuests();

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
    ['PyTorch', '#A54222', 'The contract risk model at Accenture AI Studio'],
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
    { id: 'bake', x: 6, y: 140, w: 50, h: 56, src: 'assets/obj_stove.png', stand: [86, 200], kicker: 'In the kitchen', title: 'Baking', word: 'baking', blurb: 'Weekend baking is my reset button. Signature bake: [your signature bake].' },
    { id: 'tv', x: 352, y: 56, w: 56, h: 56, src: IMG.tv, stand: [380, 162], kicker: 'By the sofa', title: 'What I’m watching', word: 'show', live: 'tv', blurb: 'Comfort TV is half of how I recharge.' },
    { id: 'skills', x: 632, y: 100, w: 50, h: 80, src: 'assets/obj_books.png', stand: [612, 200], kicker: 'On the bookshelf', title: 'My skill books', word: 'skills', skills: true, blurb: '' },
    { id: 'music', x: 140, y: 254, w: 27, h: 17, src: 'assets/obj_hp.png', stand: [153, 292], kicker: 'On the floor cushion', title: 'What I’m listening to', word: 'album', live: 'music', blurb: 'Usually something cozy while I code.', under: [IMG.poufTeal, 134, 256, 36, 22] },
    { id: 'games', x: 305, y: 286, w: 30, h: 14, src: 'assets/obj_gb.png', stand: [320, 324], kicker: 'On the beanbag', title: 'What I’m playing', word: 'game', live: 'games', blurb: 'Playing games is how I got into making them.', under: [IMG.poufRed, 302, 288, 36, 22] },
    { id: 'crochet', x: 575, y: 298, w: 54, h: 15, src: 'assets/obj_yarn.png', stand: [560, 334], kicker: 'In the yarn basket', title: 'Crochet', word: 'crochet', blurb: 'How I unwind. On my hook right now: [current crochet project].', under: [IMG.basket, 570, 304, 64, 22] },
    { id: 'cats', cat: true, src: 'assets/cat_portrait.png', kicker: 'Wandering the house', title: 'Cats', word: 'cat', blurb: 'The real managers of this house. Usually asleep exactly where I want to sit.' },
    { id: 'camping', x: 62, y: 425, w: 84, h: 62, src: IMG.tent, stand: [142, 526], kicker: 'In the backyard', title: 'Camping', word: 'camping', blurb: 'Tents, campfires and no signal. Favorite trip: [your favorite camping trip].' },
    { id: 'fish', x: 496, y: 490, w: 47, h: 42, src: 'assets/obj_rod.png', stand: [508, 562], kicker: 'On the dock', title: 'Fishing', word: 'fishing', blurb: 'Quiet mornings on the water, the opposite of a deadline. Head down to the lake to try it.' },
  ];
  HOUSE_SPOTS = OBJS.length;
  // Solid bits: [x1, y1, x2, y2]
  const BLOCKS = [
    [0, 0, 345, 142], [0, 0, 60, 345], [55, 298, 205, 345], [198, 98, 298, 238], [155, 135, 197, 238], [300, 135, 340, 188], [418, 0, 486, 140], [538, 0, 630, 136], [628, 100, 700, 316],
    [66, 452, 140, 492], [190, 484, 222, 502], [24, 562, 58, 592], [644, 432, 690, 462], [304, 428, 340, 454], [545, 496, 700, 604],
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
  div('tv-scr', 'left:358px;top:64px;width:38px;height:29px;background-image:url(' + IMG.bars + ')', 109);
  const tvTag = div('tv-tag', 'left:322px;top:36px;width:112px', 111);
  tvTag.textContent = '▶ ' + live.show;
  OBJS.filter((o) => o.under).forEach((o) => put(o.under[0], o.under[1], o.under[2], o.under[3], o.under[4], 'prop', o.y + o.h - 1));
  const fire = div('fire', 'left:192px;top:472px;width:28px;height:30px;background-image:url(' + IMG.fire + ')', 502);
  for (let i = 0; i < 6; i++) div('spark', 'left:' + (203 + (i % 3) * 3) + 'px;top:476px;animation-delay:' + (i * 0.55).toFixed(2) + 's;animation-duration:' + (1.8 + (i % 3) * 0.5).toFixed(2) + 's', 520);
  div('fire-glow', 'left:168px;top:450px;width:76px;height:76px', 4);
  (function () { const r = rng(21); for (let i = 0; i < 14; i++) div('ff', 'left:' + (30 + r() * 630).toFixed(0) + 'px;top:' + (400 + r() * 200).toFixed(0) + 'px;animation-delay:' + (-r() * 8).toFixed(2) + 's;animation-duration:' + (5 + r() * 5).toFixed(2) + 's', 700); })();
  const mark = div('mark', 'left:0;top:0', 700);
  OBJS.filter((o) => !o.cat).forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'obj';
    b.setAttribute('aria-label', 'Walk to: ' + o.title);
    b.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px;z-index:' + Math.round(o.y + o.h);
    b.innerHTML = '<img class="glow" src="' + o.src + '" alt="">';
    b.addEventListener('click', (e) => { e.stopPropagation(); goTo(o.stand[0], o.stand[1], o.id); });
    world.insertBefore(b, catBtn);
  });

  const p = { x: 360, y: 270, f: 'r', m: false };
  const c = { x: 440, y: 240, f: 'l', m: false, tx: 440, ty: 240, wait: 1.5 };
  const gal = {}, joy = { x: 0, y: 0, on: false };
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
    if (popup === id) return;
    popup = id;
    Q.visited.add(id);
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
    if (o.live === 'games') extra = '<div class="live"><span class="label">● Recently played on Steam</span><span class="value">' + esc(live.game) + (live.hours ? ' · ' + esc(live.hours) : '') + '</span><span class="sub">' + (live.gameLive ? 'Live from Steam' : 'Most recent game') + '</span></div>';
    if (o.live === 'tv') extra = '<div class="live"><span class="label">● Now watching</span><span class="value">' + esc(live.show) + '</span>' + (live.showNote ? '<span class="sub">' + esc(live.showNote) + '</span>' : '') + '</div>';
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
  function press(k) {
    unlock();
    if (k === 'a') interact();
    else if (k === 'b') closePop(true);
    else if (k === 'x') stepPhoto(1);
    else if (k === 'y') stepPhoto(-1);
  }
  document.addEventListener('keydown', (e) => {
    if (!consoleOn || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { closePop(true); return; }
    if (e.key === 'e' || e.key === 'E') { if (!e.repeat) interact(); return; }
    if (e.key === ']') { if (!e.repeat) stepPhoto(1); return; }
    if (e.key === '[') { if (!e.repeat) stepPhoto(-1); return; }
    const dir = KEYMAP[e.key]; if (!dir) return;
    e.preventDefault(); unlock();
    if (!keys[dir] && !e.repeat) { tapDir = [dir === 'r' ? 1 : dir === 'l' ? -1 : 0, dir === 'd' ? 1 : dir === 'u' ? -1 : 0]; tap = 0.16; }
    keys[dir] = true;
  });
  document.addEventListener('keyup', (e) => { const dir = KEYMAP[e.key]; if (dir) keys[dir] = false; });
  window.addEventListener('blur', () => { keys = {}; });

  const stick = $('stick'), knob = $('stickKnob'), KMAX = 28;
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
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); unlock(); joy.on = true; try { stick.setPointerCapture(e.pointerId); } catch (x) {} joyMove(e); });
  stick.addEventListener('pointermove', (e) => { if (joy.on) joyMove(e); });
  const joyEnd = () => { joy.on = false; joy.x = joy.y = 0; setKnob(0, 0); };
  stick.addEventListener('pointerup', joyEnd);
  stick.addEventListener('pointercancel', joyEnd);
  stick.addEventListener('lostpointercapture', joyEnd);
  document.querySelectorAll('.gbtn').forEach((b) => {
    b.addEventListener('pointerdown', () => { b.classList.add('down'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => b.classList.remove('down')));
    b.addEventListener('click', () => press(b.dataset.btn));
  });

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
    if (len > 0.01) { tgt = null; route = []; dest = null; const m = Math.min(1, len); vx = ix / len * SPD * m; vy = iy / len * SPD * m; }
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
      stepT += dt; if (moving && stepT > 0.3) { stepT = 0; sfx('step'); puff(p.x, p.y); }
    }
    if (!dest && mark.classList.contains('on')) mark.classList.remove('on');
    // cat
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
    if (an !== areaName) { areaName = an; hud.textContent = an; }
    // proximity dialogs
    let near = null, best = Infinity;
    spots().forEach((o) => { const d = Math.hypot(o.cx - p.x, o.cy - p.y); if (d < o.r && d < best) { best = d; near = o.id; } });
    if (dismissed && near !== dismissed) dismissed = null;
    if (near && near !== popup && near !== dismissed && !tgtOpen) openPop(near);
    else if (popup && !near && moving && !tgtOpen) closePop(false);
    if (tgtOpen && !tgt) tgtOpen = false;
  }

  /* ---------------- Fishing ---------------- */
  const PROJECTS = [
    { id: 'ai', name: 'Contract Risk Reviewer', fish: 'Guppy', src: 'assets/f_ai.png', tint: '#F6CE7B', media: '[Pipeline demo]', tag: 'Applied ML', blurb: 'Flags risky contract clauses by severity, with explanations a reviewer can trust.', points: ['Multi-label transformer covering 41 clause types', 'Trained on 510 CUAD contracts and 13,823 labeled spans', 'Explainable risk scores, checked with precision, recall and F1'], stack: 'Python and PyTorch', primary: 'Read the case study' },
    { id: 'veil', name: 'Veil-Sur', fish: 'Clownfish', src: 'assets/f_veil.png', tint: '#E1B79E', media: '[Gameplay clip]', tag: 'Game development', blurb: 'Photograph clues and escape mutants. My prototype became a year-long team project at DGA Studios.', points: ['Dialogue manager and tutorial tooltips', 'Reusable Unity UI components', 'Sprints and code review, 9+ hours a week'], stack: 'C# and Unity', primary: 'Play it' },
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
      '<div class="card-media pxs" style="background:' + pr.tint + '">' + media + '<span class="card-tag"><img src="' + pr.src + '" alt="">' + esc(pr.fish + ' · ' + pr.tag) + '</span></div>' +
      '<div class="card-body"><h3>' + esc(pr.name) + '</h3><p>' + esc(pr.blurb) + '</p><ul>' + pr.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<span class="card-stack">Made with ' + esc(pr.stack) + '</span><div class="card-links">' +
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
          im.addEventListener('animationend', () => { im.remove(); ripple(x, y, true); });
          lake.appendChild(im);
          ripple(x, y);
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
  if (CFG.steamWorkerUrl) {
    fetch(CFG.steamWorkerUrl).then((r) => r.json()).then((j) => {
      if (!j || !j.name) return;
      live.game = j.name; live.hours = j.hours || ''; live.gameLive = true;
      if (j.image) live.gameArt = j.image;
      if (popup === 'games') renderDialog();
    }).catch(() => {});
  }

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
    document.querySelectorAll('.intro, .work-head, .guide, .exp h2, .exp li, .about-photo, .about-text, .contact-card').forEach((el, i) => {
      el.classList.add('rv'); el.style.transitionDelay = ((i % 4) * 60) + 'ms'; io.observe(el);
    });
  })();

  /* ---------------- Loop ---------------- */
  let last = 0;
  function tick(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    stepHouse(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
