// Sol — mascotte d'Étude.
// Une petite croche dorée qui réagit à ce que tu joues, te parle, te fait
// progresser de niveau en niveau.
//
// Public:
//   window.MASCOT.cheer(kind)        — bonne note / bon timing / etc.
//   window.MASCOT.oops()             — mauvaise note
//   window.MASCOT.celebrate(kind, p) — leçon terminée, palier, etc.
//   window.MASCOT.say(text, opts)    — bulle libre
//   window.MASCOT.addXp(n)
//   window.MASCOT.openCard()         — ouvre la carte de niveau

(function () {
  // ------------------------------------------------------------
  // Niveaux & XP
  // ------------------------------------------------------------

  // Seuils cumulés. xp >= seuil[lvl] ⇒ niveau lvl+1.
  // Croissance presque linéaire au début, plus exigeante ensuite.
  const LEVELS = [
    { title: 'Apprenti',      threshold: 0    },
    { title: 'Élève',         threshold: 80   },
    { title: 'Étudiant',      threshold: 200  },
    { title: 'Sonatiste',     threshold: 400  },
    { title: 'Concertiste',   threshold: 700  },
    { title: 'Virtuose',      threshold: 1100 },
    { title: 'Maestro',       threshold: 1700 },
    { title: 'Maestro · or',  threshold: 2500 },
    { title: 'Maestro · ✦',   threshold: 4000 },
  ];

  function levelFromXp(xp) {
    let lvl = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i].threshold) lvl = i;
    }
    return lvl;
  }

  function nextThreshold(lvl) {
    return lvl + 1 < LEVELS.length ? LEVELS[lvl + 1].threshold : Infinity;
  }

  // ------------------------------------------------------------
  // État
  // ------------------------------------------------------------

  const STORAGE = 'etude-mascot-v1';

  const state = {
    xp: 0,
    level: 0,
    streakNotes: 0,        // notes correctes consécutives (combo mascotte)
    lastSay: 0,
    sayCooldownMs: 1800,
    queue: [],
    busy: false,
    talking: false,
    cardOpen: false,
    expression: 'idle',
    expressionTimer: null,
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const p = JSON.parse(raw);
      state.xp = +p.xp || 0;
      state.level = levelFromXp(state.xp);
    } catch (_) {}
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify({ xp: state.xp })); } catch (_) {}
  }

  // ------------------------------------------------------------
  // SVG
  // ------------------------------------------------------------

  const SVG = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="mascot-svg" aria-hidden="true">
      <!-- shadow -->
      <ellipse class="m-shadow" cx="48" cy="92" rx="22" ry="3" fill="#0c0907" opacity="0.35"/>
      <!-- stem -->
      <rect class="m-stem" x="74" y="22" width="5" height="42" fill="#d4a049" rx="2"/>
      <!-- flag -->
      <path class="m-flag" d="M 78 22 Q 92 30 86 48" stroke="#d4a049" stroke-width="5"
            fill="none" stroke-linecap="round"/>
      <!-- body (note head) -->
      <ellipse class="m-body" cx="46" cy="62" rx="32" ry="30" fill="#d4a049"/>
      <!-- body inner glow -->
      <ellipse class="m-glow" cx="38" cy="54" rx="14" ry="10" fill="#f0c578" opacity="0.45"/>
      <!-- eyes (group, manipulable) -->
      <g class="m-eyes">
        <ellipse class="m-eye m-eye-l" cx="36" cy="58" rx="3.5" ry="4.6" fill="#0c0907"/>
        <ellipse class="m-eye m-eye-r" cx="54" cy="58" rx="3.5" ry="4.6" fill="#0c0907"/>
        <circle class="m-pupil m-pupil-l" cx="37" cy="56.5" r="1.2" fill="#f1e6d0"/>
        <circle class="m-pupil m-pupil-r" cx="55" cy="56.5" r="1.2" fill="#f1e6d0"/>
      </g>
      <!-- mouth -->
      <path class="m-mouth" d="M 38 72 Q 46 76 54 72" stroke="#0c0907" stroke-width="2"
            fill="none" stroke-linecap="round"/>
      <!-- sparkles for excited state -->
      <g class="m-sparkles" opacity="0">
        <path class="m-spark" d="M 12 16 l 2 -6 l 2 6 l 6 2 l -6 2 l -2 6 l -2 -6 l -6 -2 z" fill="#f0c578"/>
        <path class="m-spark" d="M 84 8 l 1.5 -4 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 z" fill="#f0c578"/>
      </g>
    </svg>
  `;

  // ------------------------------------------------------------
  // Dialogue
  // ------------------------------------------------------------

  const PHRASES = {
    welcome: [
      'Bonjour ! Prêt pour une leçon ?',
      'On y retourne ?',
      'Salut, c\'est Sol. On joue ?',
    ],
    welcomeBack: [
      'Te revoilà — j\'ai gardé ta progression au chaud.',
      'Hey ! Tu en étais à {lvlTitle}. On continue ?',
    ],
    cheerNote: [
      'Bien.', 'Joli.', 'Encore !', 'Tu chauffes.', 'Continue.',
    ],
    cheerCombo: [
      '{combo} d\'affilée — bravo !',
      'Streak ×{combo} 🔥',
      'On tient le rythme : {combo} sans erreur.',
    ],
    cheerRhythm: [
      'Pile dans le tempo.',
      'Bien en place.',
      'Ton métronome intérieur fait des progrès.',
    ],
    oops: [
      'Petit raté — pas grave.',
      'On respire et on recommence.',
      'Doucement, l\'erreur fait partie de l\'apprentissage.',
      'Hop, on retente.',
    ],
    lesson: [
      'Leçon acquise. +{xp} XP.',
      'Tu l\'as eue ! +{xp} XP.',
      'Bouclée. +{xp} XP au compteur.',
    ],
    levelUp: [
      'Tu passes {lvlTitle} ! ✦',
      'Niveau {lvlNum} atteint — {lvlTitle}.',
      'Bravo, te voilà {lvlTitle}.',
    ],
    idle: [
      'Tu joues quand tu veux.',
      'Un petit exercice de rythme ?',
      'Essaie une nouvelle leçon, ça change les idées.',
    ],
  };

  function phrase(category, vars = {}) {
    const list = PHRASES[category] || ['…'];
    const tmpl = list[Math.floor(Math.random() * list.length)];
    return tmpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  }

  // ------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------

  let root = null;
  let bubbleEl = null;
  let svgEl = null;
  let cardEl = null;

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'mascot';
    root.id = 'mascot';
    root.innerHTML = `
      <div class="mascot-bubble" id="mascot-bubble" hidden>
        <span class="mascot-bubble-text"></span>
      </div>
      <button type="button" class="mascot-body" aria-label="Ouvrir la carte de Sol" id="mascot-button">
        ${SVG}
        <span class="mascot-level-pill" id="mascot-level-pill">
          <span class="mascot-level-num">1</span>
        </span>
      </button>

      <div class="mascot-card" id="mascot-card" hidden>
        <header class="mascot-card-head">
          <div class="mascot-card-mini">${SVG}</div>
          <div class="mascot-card-id">
            <span class="mascot-card-name">Sol</span>
            <span class="mascot-card-title" id="mascot-card-title">Apprenti</span>
          </div>
          <button type="button" class="mascot-card-close" id="mascot-card-close" aria-label="Fermer">×</button>
        </header>
        <div class="mascot-card-body">
          <div class="mascot-xp">
            <div class="mascot-xp-bar"><div class="mascot-xp-fill" id="mascot-xp-fill"></div></div>
            <span class="mascot-xp-label" id="mascot-xp-label">0 / 80 XP</span>
          </div>
          <p class="mascot-card-tip">
            Joue des leçons, garde des combos, finis des morceaux.
            Chaque action te rapporte de l'XP — Sol monte de niveau avec toi.
          </p>
          <div class="mascot-levels" id="mascot-levels"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    bubbleEl = root.querySelector('#mascot-bubble');
    svgEl = root.querySelector('.mascot-body .mascot-svg');
    cardEl = root.querySelector('#mascot-card');

    const buttonEl = root.querySelector('#mascot-button');
    setupDrag(buttonEl);

    buttonEl.addEventListener('click', (e) => {
      if (state.justDragged) {
        state.justDragged = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      toggleCard();
    });
    root.querySelector('#mascot-card-close').addEventListener('click', closeCard);

    restorePosition();
    refreshCard();
    scheduleIdleBlinks();
    window.addEventListener('resize', clampPosition);
  }

  // ------------------------------------------------------------
  // Drag & drop
  // ------------------------------------------------------------

  const DRAG_THRESHOLD_PX = 6;
  const POS_STORAGE = 'etude-mascot-pos';

  function setupDrag(handle) {
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;
    let dragging = false, moved = false, pointerId = null;

    handle.addEventListener('pointerdown', (e) => {
      // Skip if click hit the close button or anything inside the card.
      if (e.target.closest('.mascot-card')) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      const rect = root.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      dragging = true;
      moved = false;
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        moved = true;
        root.classList.add('is-dragging');
      }
      if (moved) {
        e.preventDefault();
        applyAbsolutePosition(origLeft + dx, origTop + dy);
      }
    });

    const end = (e) => {
      if (!dragging) return;
      try { handle.releasePointerCapture(pointerId); } catch (_) {}
      dragging = false;
      pointerId = null;
      if (moved) {
        root.classList.remove('is-dragging');
        savePosition();
        // Block the click that follows pointerup after a drag.
        state.justDragged = true;
      }
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function applyAbsolutePosition(x, y) {
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    x = Math.max(8, Math.min(maxX, x));
    y = Math.max(8, Math.min(maxY, y));
    root.style.left = x + 'px';
    root.style.top = y + 'px';
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  }

  function savePosition() {
    try {
      const r = root.getBoundingClientRect();
      localStorage.setItem(POS_STORAGE, JSON.stringify({ x: r.left, y: r.top }));
    } catch (_) {}
  }

  function restorePosition() {
    try {
      const raw = localStorage.getItem(POS_STORAGE);
      if (!raw) return;
      const { x, y } = JSON.parse(raw);
      if (typeof x === 'number' && typeof y === 'number') applyAbsolutePosition(x, y);
    } catch (_) {}
  }

  function clampPosition() {
    if (!root) return;
    if (root.style.left) {
      // Already in absolute mode — re-clamp.
      const r = root.getBoundingClientRect();
      applyAbsolutePosition(r.left, r.top);
    }
  }

  function refreshCard() {
    if (!root) return;
    const lvl = state.level;
    const lvlDef = LEVELS[lvl];
    const next = nextThreshold(lvl);
    const lvlPill = root.querySelector('.mascot-level-num');
    if (lvlPill) lvlPill.textContent = String(lvl + 1);
    const titleEl = root.querySelector('#mascot-card-title');
    if (titleEl) titleEl.textContent = lvlDef.title;
    const fillEl = root.querySelector('#mascot-xp-fill');
    const labelEl = root.querySelector('#mascot-xp-label');
    if (fillEl && labelEl) {
      if (next === Infinity) {
        fillEl.style.width = '100%';
        labelEl.textContent = `${state.xp} XP — niveau max`;
      } else {
        const span = next - lvlDef.threshold;
        const into = state.xp - lvlDef.threshold;
        const pct = Math.max(0, Math.min(100, (into / span) * 100));
        fillEl.style.width = pct + '%';
        labelEl.textContent = `${state.xp} / ${next} XP`;
      }
    }
    const levelsEl = root.querySelector('#mascot-levels');
    if (levelsEl) {
      levelsEl.innerHTML = LEVELS.map((l, i) => `
        <div class="mascot-level-row${i === lvl ? ' is-current' : ''}${i < lvl ? ' is-done' : ''}">
          <span class="mascot-level-rank">${String(i + 1).padStart(2, '0')}</span>
          <span class="mascot-level-title">${l.title}</span>
          <span class="mascot-level-xp">${l.threshold} XP</span>
        </div>
      `).join('');
    }
  }

  // ------------------------------------------------------------
  // Animations / expressions
  // ------------------------------------------------------------

  function setExpression(name, durationMs = 1200) {
    if (!root) return;
    if (state.expressionTimer) clearTimeout(state.expressionTimer);
    root.dataset.expr = name;
    state.expression = name;
    state.expressionTimer = setTimeout(() => {
      root.dataset.expr = 'idle';
      state.expression = 'idle';
    }, durationMs);
  }

  function bounce() {
    if (!root) return;
    root.classList.remove('is-bounce');
    void root.offsetWidth;
    root.classList.add('is-bounce');
  }

  function shake() {
    if (!root) return;
    root.classList.remove('is-shake');
    void root.offsetWidth;
    root.classList.add('is-shake');
  }

  function sparkle() {
    if (!root) return;
    root.classList.remove('is-sparkle');
    void root.offsetWidth;
    root.classList.add('is-sparkle');
  }

  function scheduleIdleBlinks() {
    setInterval(() => {
      if (!root || state.expression !== 'idle') return;
      root.classList.remove('is-blink');
      void root.offsetWidth;
      root.classList.add('is-blink');
      setTimeout(() => root.classList.remove('is-blink'), 220);
    }, 4500);
    setInterval(() => {
      if (!root || state.expression !== 'idle') return;
      root.classList.remove('is-wiggle');
      void root.offsetWidth;
      root.classList.add('is-wiggle');
      setTimeout(() => root.classList.remove('is-wiggle'), 900);
    }, 9000);
  }

  // ------------------------------------------------------------
  // Bulle (queue + cooldown)
  // ------------------------------------------------------------

  function say(text, { force = false, durationMs = 2400, important = false } = {}) {
    if (!root) return;
    const now = performance.now();
    if (!force && now - state.lastSay < state.sayCooldownMs && !important) return;
    state.lastSay = now;
    bubbleEl.querySelector('.mascot-bubble-text').textContent = text;
    bubbleEl.hidden = false;
    bubbleEl.classList.remove('is-show');
    void bubbleEl.offsetWidth;
    bubbleEl.classList.add('is-show');
    clearTimeout(state.bubbleTimer);
    state.bubbleTimer = setTimeout(() => {
      bubbleEl.classList.remove('is-show');
      setTimeout(() => { bubbleEl.hidden = true; }, 250);
    }, durationMs);
  }

  // ------------------------------------------------------------
  // XP & level transitions
  // ------------------------------------------------------------

  function addXp(n) {
    if (!n) return;
    const before = state.level;
    state.xp += n;
    state.level = levelFromXp(state.xp);
    save();
    refreshCard();
    if (state.level > before) {
      const lvlDef = LEVELS[state.level];
      sparkle();
      bounce();
      setExpression('excited', 1800);
      say(phrase('levelUp', { lvlTitle: lvlDef.title, lvlNum: state.level + 1 }),
          { force: true, important: true, durationMs: 3500 });
    }
  }

  // ------------------------------------------------------------
  // Public reactions
  // ------------------------------------------------------------

  function cheer(kind) {
    state.streakNotes++;
    setExpression('happy', 800);
    bounce();
    if (kind === 'rhythm') {
      addXp(2);
      if (Math.random() < 0.25) say(phrase('cheerRhythm'));
      return;
    }
    addXp(1);
    if (state.streakNotes > 0 && state.streakNotes % 10 === 0) {
      say(phrase('cheerCombo', { combo: state.streakNotes }), { important: true });
      sparkle();
    } else if (Math.random() < 0.18) {
      say(phrase('cheerNote'));
    }
  }

  function oops() {
    state.streakNotes = 0;
    setExpression('oops', 700);
    shake();
    if (Math.random() < 0.4) say(phrase('oops'));
  }

  function celebrate(kind, params = {}) {
    setExpression('excited', 1800);
    bounce();
    sparkle();
    if (kind === 'lesson') {
      const xp = params.xp ?? 50;
      addXp(xp);
      say(phrase('lesson', { xp }), { force: true, important: true, durationMs: 3000 });
    } else if (kind === 'combo') {
      addXp(5);
      say(`Combo ×${params.combo} — joli !`, { important: true });
    } else {
      addXp(params.xp || 10);
    }
  }

  function toggleCard() {
    if (cardEl.hidden) openCard(); else closeCard();
  }
  function openCard() {
    refreshCard();
    cardEl.hidden = false;
    requestAnimationFrame(() => cardEl.classList.add('is-open'));
    state.cardOpen = true;
  }
  function closeCard() {
    cardEl.classList.remove('is-open');
    setTimeout(() => { cardEl.hidden = true; }, 220);
    state.cardOpen = false;
  }

  // ------------------------------------------------------------
  // Idle reminders
  // ------------------------------------------------------------

  let lastInteractionTs = performance.now();
  function noteInteraction() { lastInteractionTs = performance.now(); }
  ['click', 'keydown', 'pointerdown'].forEach((evt) =>
    window.addEventListener(evt, noteInteraction, { passive: true })
  );

  function scheduleIdleNudges() {
    setInterval(() => {
      if (!root) return;
      if (state.expression !== 'idle') return;
      const idleMs = performance.now() - lastInteractionTs;
      if (idleMs > 90000 && Math.random() < 0.5) {
        setExpression('thinking', 2000);
        say(phrase('idle'));
        lastInteractionTs = performance.now() - 30000; // avoid retrigger
      }
    }, 30000);
  }

  // ------------------------------------------------------------
  // Welcome
  // ------------------------------------------------------------

  function welcome() {
    if (state.xp > 0) {
      say(phrase('welcomeBack', { lvlTitle: LEVELS[state.level].title }),
          { force: true, important: true, durationMs: 4000 });
    } else {
      say(phrase('welcome'), { force: true, important: true, durationMs: 4000 });
    }
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------

  function attach() {
    load();
    build();
    setTimeout(welcome, 700);
    scheduleIdleNudges();
  }

  window.MASCOT = {
    cheer, oops, celebrate, say, addXp, openCard, closeCard,
    getXp: () => state.xp,
    getLevel: () => state.level,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
