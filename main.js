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
  const HOUSE_SPOTS = 7;
  function questList() {
    return [
      { id: 'house', label: 'Explore the house', n: Q.visited.size, of: HOUSE_SPOTS },
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

  /* ---------------- House ---------------- */
  const W = 695, H = 380;
  const vp = $('vp'), world = $('world'), lia = $('lia'), catBtn = $('cat'), catSpr = $('catSpr'), dialog = $('dialog');
  const live = { song: (CFG.nowPlaying || {}).song || '[Song title]', artist: (CFG.nowPlaying || {}).artist || '[Artist]', game: (CFG.recentGame || {}).name || 'Overwatch', hours: (CFG.recentGame || {}).hours || '', albumArt: photos.music || '', gameArt: photos.games || '' };
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
  const OBJS = [
    { id: 'bake', x: 6, y: 140, w: 50, h: 56, src: 'assets/obj_stove.png', stand: [86, 200], kicker: 'In the kitchen', title: 'Baking', word: 'baking', blurb: 'Weekend baking is my reset button. Signature bake: [your signature bake].' },
    { id: 'crochet', x: 484, y: 120, w: 54, h: 15, src: 'assets/obj_yarn.png', stand: [512, 166], kicker: 'By the sofa', title: 'Crochet', word: 'crochet', blurb: 'How I unwind. On my hook right now: [current crochet project].' },
    { id: 'cats', cat: true, src: 'assets/cat_portrait.png', kicker: 'Wandering the house', title: 'Cats', word: 'cat', blurb: 'The real managers of this house. Usually asleep exactly where I want to sit.' },
    { id: 'fish', x: 530, y: 262, w: 47, h: 42, src: 'assets/obj_rod.png', stand: [505, 320], kicker: 'By the front door', title: 'Fishing', word: 'fishing', blurb: 'Quiet mornings on the water, the opposite of a deadline. Head down to the lake to try it.' },
    { id: 'music', x: 541, y: 108, w: 27, h: 17, src: 'assets/obj_hp.png', stand: [555, 154], kicker: 'On the coffee table', title: 'What I’m listening to', word: 'album', live: 'music', blurb: 'Usually something cozy while I code.' },
    { id: 'games', x: 588, y: 112, w: 30, h: 14, src: 'assets/obj_gb.png', stand: [606, 154], kicker: 'On the coffee table', title: 'What I’m playing', word: 'game', live: 'games', blurb: 'Playing games is how I got into making them.' },
    { id: 'skills', x: 632, y: 100, w: 50, h: 80, src: 'assets/obj_books.png', stand: [612, 200], kicker: 'On the bookshelf', title: 'My skill books', word: 'skills', skills: true, blurb: '' },
  ];
  const BLOCKS = [[0, 0, 345, 142], [0, 0, 60, 345], [55, 298, 205, 345], [198, 98, 298, 238], [155, 135, 197, 238], [300, 135, 340, 188], [418, 0, 486, 140], [538, 0, 630, 136], [628, 100, 700, 316], [528, 258, 580, 306]];
  function hit(x, y) {
    if (x < 62 || x > 655 || y < 140 || y > 340) return true;
    for (const b of BLOCKS) if (x + 7 > b[0] && x - 7 < b[2] && y + 3 > b[1] && y - 3 < b[3]) return true;
    return false;
  }
  OBJS.filter((o) => !o.cat).forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'obj';
    b.setAttribute('aria-label', 'Walk to: ' + o.title);
    b.style.cssText = 'left:' + o.x + 'px;top:' + o.y + 'px;width:' + o.w + 'px;height:' + o.h + 'px';
    b.innerHTML = '<img class="glow" src="' + o.src + '" alt="">';
    b.addEventListener('click', (e) => { e.stopPropagation(); goTo(o.stand[0], o.stand[1], o.id); });
    world.insertBefore(b, catBtn);
  });

  const p = { x: 360, y: 270, f: 'r', m: false };
  const c = { x: 440, y: 240, f: 'l', m: false, tx: 440, ty: 240, wait: 1.5 };
  let cam = null, keys = {}, tgt = null, tgtOpen = false, dismissed = null, popup = null, tap = 0, tapDir = null, stuck = 0, stepT = 0, book = null;

  function view() {
    const vw = vp.clientWidth || 1100, vh = vw * 9 / 16;
    const S = Math.max(1.6, vw / W * 1.75);
    const cl = (v, a, b) => (b < a ? (a + b) / 2 : Math.max(a, Math.min(b, v)));
    return { vw, vh, S, dx: cl(p.x * S - vw / 2, 0, W * S - vw), dy: cl((p.y - 30) * S - vh / 2, 0, H * S - vh) };
  }
  function goTo(x, y, openId) {
    unlock();
    tgt = [Math.max(66, Math.min(650, x)), Math.max(144, Math.min(336, y))];
    tgtOpen = !!openId;
    if (openId) { dismissed = null; openPop(openId); }
  }
  function spots() {
    return OBJS.map((o) => (o.cat ? { id: 'cats', cx: c.x, cy: c.y - 12 } : { id: o.id, cx: o.x + o.w / 2, cy: o.y + o.h / 2 }));
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
  function renderDialog() {
    const o = OBJS.find((q) => q.id === popup);
    if (!o) { dialog.hidden = true; return; }
    let photo = photos[o.id] || '';
    if (o.live === 'music' && live.albumArt) photo = live.albumArt;
    if (o.live === 'games' && live.gameArt) photo = live.gameArt;
    let extra = '';
    if (o.live === 'music') extra = '<div class="live"><span class="label">● Now playing</span><span class="value">' + esc(live.song) + ' — ' + esc(live.artist) + '</span><span class="sub">' + (live.isLive ? 'Live from Spotify' : 'Last song I had on repeat') + '</span></div>';
    if (o.live === 'games') extra = '<div class="live"><span class="label">● Recently played on Steam</span><span class="value">' + esc(live.game) + (live.hours ? ' · ' + esc(live.hours) : '') + '</span><span class="sub">' + (live.gameLive ? 'Live from Steam' : 'Most recent game') + '</span></div>';
    if (o.skills) {
      const bk = BOOKS.find((b) => b[0] === book);
      extra = '<div class="books">' + BOOKS.map((b) => '<button type="button" class="book" data-book="' + esc(b[0]) + '" aria-pressed="' + (book === b[0]) + '" style="background:' + b[1] + '">' + esc(b[0]) + '</button>').join('') + '</div><span class="book-text">' + (bk ? esc(bk[0] + ': ' + bk[2] + '.') : 'Pick a book to see where I used it.') + '</span>';
    }
    dialog.innerHTML =
      '<div class="portrait pxs">' + (photo ? '<img class="photo" src="' + esc(photo) + '" alt="' + esc(o.title) + '">' : '<img class="sprite" src="' + o.src + '" alt=""><span>Add your ' + esc(o.word) + ' photo</span>') + '</div>' +
      '<div class="dialog-body"><span class="dialog-kicker">' + esc(o.kicker) + '</span><span class="dialog-title">' + esc(o.title) + '</span><p>' + esc(o.blurb) + '</p>' + extra + '</div>' +
      '<button type="button" class="dialog-close" aria-label="Close">×</button>';
    dialog.setAttribute('aria-label', o.title);
    dialog.hidden = false;
    dialog.querySelector('.dialog-close').addEventListener('click', (e) => { e.stopPropagation(); closePop(true); vp.focus({ preventScroll: true }); });
    dialog.querySelectorAll('.book').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); book = b.dataset.book; sfx('select'); renderDialog(); }));
  }
  dialog.addEventListener('click', (e) => e.stopPropagation());
  catBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(c.x - 30, c.y + 18, 'cats'); });

  vp.addEventListener('click', (e) => {
    const r = vp.getBoundingClientRect(), v = view(), cm = cam || { x: v.dx, y: v.dy };
    vp.focus({ preventScroll: true });
    goTo((e.clientX - r.left + cm.x) / v.S, (e.clientY - r.top + cm.y) / v.S, null);
  });
  const KEYMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
  vp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePop(true); return; }
    const dir = KEYMAP[e.key]; if (!dir) return;
    e.preventDefault(); unlock();
    if (!keys[dir] && !e.repeat) { tapDir = [dir === 'r' ? 1 : dir === 'l' ? -1 : 0, dir === 'd' ? 1 : dir === 'u' ? -1 : 0]; tap = 0.16; }
    keys[dir] = true;
  });
  vp.addEventListener('keyup', (e) => { const dir = KEYMAP[e.key]; if (dir) keys[dir] = false; });
  vp.addEventListener('blur', () => { keys = {}; });

  function stepHouse(dt) {
    const SPD = 115;
    let vx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), vy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (tap > 0 && !vx && !vy && tapDir) { vx = tapDir[0]; vy = tapDir[1]; tap -= dt; }
    if (vx || vy) { tgt = null; const n = Math.hypot(vx, vy); vx = vx / n * SPD; vy = vy / n * SPD; }
    else if (tgt) {
      const ddx = tgt[0] - p.x, ddy = tgt[1] - p.y, d = Math.hypot(ddx, ddy);
      if (d < 2) tgt = null; else { const sp = Math.min(SPD, d / dt); vx = ddx / d * sp; vy = ddy / d * sp; }
    }
    let moving = !!(vx || vy);
    if (moving) {
      const ox = p.x, oy = p.y;
      const nx = p.x + vx * dt; if (!hit(nx, p.y)) p.x = nx;
      const ny = p.y + vy * dt; if (!hit(p.x, ny)) p.y = ny;
      if (Math.abs(vx) > 1) p.f = vx < 0 ? 'l' : 'r';
      const moved = Math.hypot(p.x - ox, p.y - oy);
      if (moved < 0.01) moving = false;
      if (tgt) { stuck = moved < SPD * dt * 0.2 ? stuck + dt : 0; if (stuck > 0.35) { tgt = null; stuck = 0; } }
      stepT += dt; if (moving && stepT > 0.3) { stepT = 0; sfx('step'); }
    }
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
    lia.style.transform = 'scaleX(' + (p.f === 'l' ? -1 : 1) + ')';
    if (p.m !== moving) lia.className = 'lia ' + (moving ? 'walk' : 'idle');
    p.m = moving;
    catBtn.style.left = (c.x - 29).toFixed(2) + 'px';
    catBtn.style.top = (c.y - 53).toFixed(2) + 'px';
    catSpr.style.transform = 'scaleX(' + (c.f === 'l' ? -1 : 1) + ')';
    const cc = c.m ? 'run' : 'idle';
    if (catSpr.className !== cc) catSpr.className = cc;
    // proximity dialogs
    let near = null, best = 52;
    spots().forEach((o) => { const d = Math.hypot(o.cx - p.x, o.cy - p.y); if (d < best) { best = d; near = o.id; } });
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
  const F = { phase: 'idle', bx: 50, by: 62, target: null, catchId: null, note: null, sel: null, timers: [] };
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
      F.target = b.dataset.id; F.note = null;
      if (Q.caught.indexOf(F.target) >= 0) { F.sel = F.target; renderCard(); }
      renderGuide(); renderLake();
    }));
  }
  function renderLake() {
    const ph = F.phase;
    const want = 'rod r-' + ph;
    if (rod.className !== want) rod.className = want;
    const msgs = { idle: F.target ? 'Bait set for the ' + byId(F.target).fish + '. Click the water to cast!' : 'Pick a fish from the Fish Guide to start.', cast: 'Casting...', wait: 'Waiting for a bite...', bite: 'A bite! Click now to reel in!', reel: 'Reeling it in...', caught: 'Nice catch!', miss: 'It got away. Cast again!' };
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
  function lakeClick(xp, yp) {
    unlock();
    const ph = F.phase;
    if (ph === 'idle' || ph === 'miss' || ph === 'caught') {
      if (!F.target) { F.note = 'Pick a fish from the Fish Guide first!'; renderLake(); return; }
      if (yp < 50) { F.note = 'Aim for the water.'; renderLake(); return; }
      if (xp < 34 && yp > 54) xp = 38;
      clearTimers();
      sfx('cast');
      Object.assign(F, { phase: 'cast', bx: Math.max(12, Math.min(58, xp)), by: Math.max(54, Math.min(88, yp)), note: null });
      renderLake();
      later(() => {
        sfx('splash'); F.phase = 'wait'; renderLake();
        later(() => {
          sfx('bite'); F.phase = 'bite'; renderLake();
          later(() => {
            if (F.phase !== 'bite') return;
            sfx('miss'); F.phase = 'miss'; renderLake();
            later(() => { if (F.phase === 'miss') { F.phase = 'idle'; renderLake(); } }, 1800);
          }, 1500);
        }, 1400 + Math.random() * 2200);
      }, 1500);
    } else if (ph === 'wait') {
      F.note = 'Patience... wait for the !'; renderLake();
    } else if (ph === 'bite') {
      clearTimers();
      const id = F.target;
      sfx('splash');
      Object.assign(F, { phase: 'reel', catchId: id, note: null });
      renderLake();
      later(() => {
        sfx('catch');
        if (Q.caught.indexOf(id) < 0) Q.caught.push(id);
        F.phase = 'caught'; F.sel = id;
        renderLake(); renderGuide(); renderCard(); checkQuests();
        later(() => { if (F.phase === 'caught') { F.phase = 'idle'; F.catchId = null; renderLake(); } }, 2600);
      }, 1000);
    }
  }
  lake.addEventListener('click', (e) => { const r = lake.getBoundingClientRect(); lakeClick((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); });
  lake.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lakeClick(42, 66); } });
  renderGuide(); renderLake();

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

  /* ---------------- Loop ---------------- */
  let last = 0;
  function tick(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    stepHouse(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
