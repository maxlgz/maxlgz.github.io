// Alibi — écran de jeu.
import { prepare, personCluesHTML, checkClue, evaluate, solve, canPlace, explain, weaponOf, OBJECTS, CLUE_TYPES } from './engine.js';
import { objectSVG } from './art.js';
import { createBoard, tokenHTML } from './board.js';
import { colorOf } from './palette.js';
import { play, setEnabled as setSoundEnabled } from './sound.js';

/* ------------------------------------------------------------------ */
/* Utilitaires partagés (aussi utilisés par main.js)                   */
/* ------------------------------------------------------------------ */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

export function readJSON(key, fallback, store = 'local') {
  try {
    const st = store === 'session' ? sessionStorage : localStorage;
    const raw = st.getItem(key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    return v == null ? fallback : v;
  } catch { return fallback; }
}
export function writeJSON(key, value, store = 'local') {
  try {
    const st = store === 'session' ? sessionStorage : localStorage;
    if (value === undefined) st.removeItem(key);
    else st.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}
export function removeKey(key) { try { localStorage.removeItem(key); } catch { /* rien */ } }

const SETTINGS_KEY = 'alibi:settings';
export function loadSettings() {
  const s = readJSON(SETTINGS_KEY, {});
  return s && typeof s === 'object' ? s : {};
}
export function saveSettings(patch) {
  const s = { ...loadSettings(), ...patch };
  writeJSON(SETTINGS_KEY, s);
  return s;
}

/** Thème clair / sombre : écrit sur <html> et dans <meta name="theme-color">. */
export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'dark' ? '#14162E' : '#FFF6E3');
}

export function formatTime(total) {
  const t = Math.max(0, Math.floor(total || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export const ICONS = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.2 7.5l2.3 1.3M17.5 15.2l2.3 1.3M4.2 16.5l2.3-1.3M17.5 8.8l2.3-1.3"/><circle cx="12" cy="12" r="7"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M14.5 4.5l5 5-9 9H6l-2.5-2.5a1.4 1.4 0 010-2z"/><path d="M9.5 9.5l5 5M12 18.5h8"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7H4V2"/><path d="M4.5 7.5A8 8 0 1 1 4 13"/></svg>',
  hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M10.5 7.5v3.5M10.5 13.6v.1"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5L19.5 7"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5z"/><path d="M13.5 7l3 3"/></svg>',
  legend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="6.5" r="1.8"/><circle cx="5.5" cy="12" r="1.8"/><circle cx="5.5" cy="17.5" r="1.8"/><path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 115 1c-.8 1-2.5 1.4-2.5 3"/><path d="M12 17.2v.1"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  mask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5c3-1.6 6-1.6 9 0 3-1.6 6-1.6 9 0-.3 4.6-2.6 7.5-5.6 7.5-1.6 0-2.6-1.2-3.4-2.6-.8 1.4-1.8 2.6-3.4 2.6C5.6 16 3.3 13.1 3 8.5z"/><path d="M6.6 10.6c.8-.5 1.7-.5 2.5 0M14.9 10.6c.8-.5 1.7-.5 2.5 0"/></svg>',
  knife: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 9.5L20.5 3.5c.6 3.8-.9 7.4-4 9.6z"/><path d="M14.5 9.5l2 3.6L8 21.5 4.5 18z"/><path d="M6.2 16.3l1.5 1.5"/></svg>',
};

/** Variantes d'un niveau brut : { liar, weapon } (champ `twist`, absent = niveau classique). */
export function twistOf(level) {
  const t = level && level.twist && typeof level.twist === 'object' ? level.twist : {};
  return { liar: t.liar === true, weapon: t.weapon === true };
}
export const TWIST_RULES = {
  liar: {
    pill: 'Un témoin ment', badge: 'Témoin menteur', title: 'Variante — témoin menteur',
    text: 'Un des suspects ment : tout ce qu’il dit est faux. Les autres disent vrai. Le menteur n’est pas forcément le coupable.',
  },
  weapon: {
    pill: 'Bonus : arme', badge: 'Arme du crime', title: 'Bonus — arme du crime',
    text: 'Après avoir démasqué le coupable, désignez l’arme : elle se trouvait à côté du meurtrier.',
  },
};
const ruleBoxHTML = (k) => `<p class="intro-rule intro-rule--${k}"><span class="rule-ico">${k === 'liar' ? ICONS.mask : ICONS.knife}</span><span><b>${esc(TWIST_RULES[k].title)}.</b> ${esc(TWIST_RULES[k].text)}</span></p>`;
const SEES_HELP = (CLUE_TYPES.find((x) => x.t === 'sees') || {}).help || 'Même ligne ou même colonne, dans la même pièce, sans rien entre les deux.';
const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
/** Groupe nominal défini d'un objet (« le piano », « l’horloge »). */
function objDef(type) {
  const o = OBJECTS[type];
  if (!o) return esc(type);
  if (/^[aeiouyéèêâîô]/i.test(o.n) || (/^h/i.test(o.n) && !/^h(all|angar|alle|amac|ublot|aut|ach|arpe|ibou|être|oux|otte)/i.test(o.n))) return `l’${esc(o.n)}`;
  return o.g === 'f' ? `la ${esc(o.n)}` : `le ${esc(o.n)}`;
}

// Croix « cartoon » : trait bleu nuit aux bouts arrondis, cerné d'un halo crème pour se détacher des sols.
const X_SVG = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2L2 8" stroke="var(--x-halo, #FFF6E3)" stroke-width="2.7" stroke-linecap="round" fill="none"/><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" fill="none"/></svg>';

/* ------------------------------------------------------------------ */
/* Fenêtres modales                                                    */
/* ------------------------------------------------------------------ */
/**
 * Ouvre une fenêtre modale. `build(body, close)` remplit le contenu.
 * `onCancel` est appelé quand l'utilisateur ferme par Échap.
 */
export function openModal(build, { label = 'Fenêtre', onCancel, className = '', silent = false } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = `modal ${className}`.trim();
  dlg.setAttribute('aria-label', label);
  const body = document.createElement('div');
  body.className = 'modal-body';
  dlg.appendChild(body);
  document.body.appendChild(dlg);
  let closed = false;
  const close = (quiet = false) => {
    if (closed) return;
    closed = true;
    if (quiet !== true) play('close');
    try { if (dlg.open) dlg.close(); } catch { /* rien */ }
    dlg.remove();
  };
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (onCancel === false) return;
    close();
    if (typeof onCancel === 'function') onCancel();
  });
  build(body, close);
  if (!silent) play('open');
  try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
  const auto = body.querySelector('[autofocus]');
  if (auto) auto.focus();
  return { el: dlg, body, close, get closed() { return closed; } };
}

export function confirmDialog({ kicker = '', title, text = '', ok = 'Confirmer', cancel = 'Annuler', danger = false }) {
  return new Promise((resolve) => {
    openModal((body, close) => {
      body.innerHTML = `${kicker ? `<div class="modal-kicker">${esc(kicker)}</div>` : ''}
        <h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}
        <div class="modal-actions">
          <button type="button" class="btn btn--ghost" data-v="0" autofocus>${esc(cancel)}</button>
          <button type="button" class="btn ${danger ? 'btn--accent' : 'btn--primary'}" data-v="1">${esc(ok)}</button>
        </div>`;
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        close();
        resolve(b.dataset.v === '1');
      });
    }, { label: title, onCancel: () => resolve(false) });
  });
}

/* ------------------------------------------------------------------ */
/* Écran de jeu                                                        */
/* ------------------------------------------------------------------ */
const LONG_MS = 450;
const RING_DELAY = 110;
const ERASE_HOLD_MS = 700;
const DIFF_LABEL = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' };

function signature(raw) {
  const people = (raw.people || []).map((p) => p.id).join('');
  return `${raw.size ?? `${raw.rows}x${raw.cols}`}|${(raw.roomMap || []).join('/')}|${people}|${(raw.objects || []).length}`;
}
const key = (r, c) => `${r},${c}`;
const fem = (p, m, f) => (p && p.gender === 'f' ? f : m);

export function mountGame(root, opts = {}) {
  const { level: raw, onExit, onSolved, onNext, onHelp, persist = true, exitLabel = 'Retour', guide = null } = opts;
  const level = prepare(raw);
  // Dimensions (plan carré : size ; plan rectangulaire : rows × cols).
  const R = level.rows ?? level.size;
  const C = level.cols ?? level.size;
  const rect = R !== C;
  const dimLabel = `${R}×${C}`;
  const people = level.people || [];
  const count = level.count ?? Math.min(R, C);
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  // Ordre d'affichage : les suspects dans l'ordre du niveau, la victime toujours en dernier.
  // (Les couleurs restent attribuées d'après le rang dans level.people.)
  const shown = [...people.filter((p) => !p.victim), ...people.filter((p) => p.victim)];
  const colors = Object.fromEntries(people.map((p) => [p.id, colorOf(level, p.id)]));
  const pcStyle = (id) => {
    const col = colors[id];
    return col ? `--pc:${col.main};--pcp:${col.pastel};--pcd:${col.dark}` : '';
  };
  const roomsByKey = Object.fromEntries((level.rooms || []).map((r) => [r.key, r]));
  const saveKey = `alibi:save:${raw.id || 'sans-id'}`;
  const sig = signature(raw);
  // Variantes (champ `twist` du niveau) : rien ne change sur un niveau classique.
  const tw = guide ? { liar: false, weapon: false } : twistOf(raw);
  const twistKeys = ['liar', 'weapon'].filter((k) => tw[k]);

  let settings = loadSettings();
  let st = { placements: {}, notes: {}, crosses: {}, seconds: 0, hints: 0, errors: 0 };
  let history = [];
  // Enquête guidée : personne n'est sélectionné d'avance, le guide le demande.
  let selected = people.length && !guide ? people[0].id : null;
  let mode = null; // null | 'cross' | 'erase'
  let phase = 'play'; // 'intro' | 'play' | 'accuse' | 'weapon' | 'won'
  let wrong = new Map(); // id -> Set(indices d'indices fautifs) ; -1 = phrase de la victime
  let hintWrong = null;
  let help = null; // panneau d'aide ouvert : { type: 'hint' | 'weapon', keys: Set('r,c'), … }
  let weaponState = null; // étape bonus de l'arme
  let ruleModal = null;
  let justPlaced = null;
  let solution;
  let modal = null;
  let destroyed = false;
  let lastPointerType = 'mouse';

  // Enquête guidée : le guide peut refuser une action hors sujet (il renvoie alors un rappel).
  function gate(action) {
    if (!guide) return true;
    let r = true;
    try { r = guide.allow(action); } catch (err) { console.warn(err); r = true; }
    if (r === true || r == null) return true;
    play('refuse');
    if (action.type !== 'accuse') { try { guide.remind(String(r)); } catch { /* rien */ } }
    return String(r);
  }
  const emit = (ev, data) => { if (guide) { try { guide.emit(ev, data); } catch (err) { console.warn(err); } } };

  // ---------- reprise ----------
  const saved = persist ? readJSON(saveKey, null) : null;
  let resumed = false;
  if (saved && saved.sig === sig && saved.placements) {
    st = {
      placements: saved.placements || {},
      notes: saved.notes || {},
      crosses: saved.crosses || {},
      seconds: saved.seconds || 0,
      hints: saved.hints || 0,
      errors: saved.errors || 0,
    };
    // on écarte ce qui ne correspond plus au niveau
    for (const id of Object.keys(st.placements)) {
      const p = st.placements[id];
      if (!byId[id] || !Array.isArray(p) || p[0] >= R || p[1] >= C) delete st.placements[id];
    }
    history = Array.isArray(saved.history) ? saved.history.slice(-80) : [];
    if (saved.selected && byId[saved.selected]) selected = saved.selected;
    resumed = true;
  }

  // ---------- DOM ----------
  root.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = `screen game${guide ? ' game--guided' : ''}${tw.liar ? ' game--liar' : ''}${tw.weapon ? ' game--weapon' : ''}`;
  const pillsHTML = twistKeys.length
    ? `<span class="twist-pills">${twistKeys.map((k) => `<button type="button" class="twist-pill twist-pill--${k}" data-twist="${k}" aria-label="${esc(TWIST_RULES[k].pill)} : revoir la règle">${k === 'liar' ? ICONS.mask : ICONS.knife}<span>${esc(TWIST_RULES[k].pill)}</span></button>`).join('')}</span>`
    : '';
  const diff = DIFF_LABEL[level.difficulty] || '';
  screen.innerHTML = `
    <header class="topbar">
      <button type="button" class="icon-btn" data-act="exit" aria-label="${esc(exitLabel)}">${ICONS.back}</button>
      <div class="title"><h1>${esc(level.title || 'Enquête')}</h1>
        <span class="sub">${esc([diff, dimLabel, `${people.length} personnes`].filter(Boolean).join(' · '))}</span></div>
      <span class="timer" role="timer" aria-label="Temps écoulé">0:00</span>
      <button type="button" class="icon-btn" data-act="legend" aria-label="Légende du plan" hidden>${ICONS.legend}</button>
      <button type="button" class="icon-btn" data-act="settings" aria-label="Réglages" aria-expanded="false">${ICONS.gear}</button>
    </header>
    <main class="game-main">
      <section class="game-board-col" aria-label="Plan">
        <div class="board-wrap"></div>
        <div class="picker" role="group" aria-label="Choisir un personnage"></div>
        <p class="status" role="status" aria-live="polite"></p>
        <section class="help-panel" aria-label="Aide" aria-live="polite" hidden></section>
      </section>
      <section class="game-side" aria-label="Dossier">
        <details class="legend" data-legend hidden>
          <summary>Légende du plan</summary>
          <div class="legend-body"></div>
        </details>
        <div class="cards-scroll">
          <div class="dossier-head"><h2>Témoignages</h2>${pillsHTML}<span class="meta"></span></div>
          <div class="cards"></div>
        </div>
        <nav class="toolbar" aria-label="Outils">
          <button type="button" class="tool" data-tool="cross" aria-pressed="false" aria-label="Mode croix">${ICONS.cross}<span>Croix</span></button>
          <button type="button" class="tool" data-tool="erase" aria-pressed="false" aria-label="Gomme (appui long : tout effacer)">${ICONS.erase}<span>Gomme</span><i class="hold"></i></button>
          <button type="button" class="tool" data-tool="undo" aria-label="Annuler">${ICONS.undo}<span>Annuler</span></button>
          <button type="button" class="tool" data-tool="hint" aria-label="Indice">${ICONS.hint}<span>Indice</span><span class="count"></span></button>
          <button type="button" class="tool tool--validate" data-tool="validate" aria-label="Valider">${ICONS.check}<span>Valider</span></button>
        </nav>
      </section>
    </main>`;
  root.appendChild(screen);

  const $ = (sel) => screen.querySelector(sel);
  const timerEl = $('.timer');
  const statusEl = $('.status');
  const wide = window.matchMedia('(min-width: 900px)');
  const cardsEl = $('.cards');
  const pickerEl = $('.picker');
  const metaEl = $('.dossier-head .meta');
  const topbar = $('.topbar');
  const tools = Object.fromEntries([...screen.querySelectorAll('[data-tool]')].map((b) => [b.dataset.tool, b]));

  const board = createBoard(level);
  const boardWrap = $('.board-wrap');
  // Forme du plan, pour que le plateau tienne dans la hauteur de l'écran (grand écran).
  boardWrap.style.setProperty('--rows', String(R));
  boardWrap.style.setProperty('--cols', String(C));
  boardWrap.appendChild(board.el);
  board.el.classList.add('board--play');

  // légende des objets (construite une seule fois : le rendu ne la touche pas)
  // Grand écran : panneau repliable dans la colonne de droite. Téléphone : fenêtre ouverte par le bouton d'en-tête.
  let legendModal = null;
  const closeLegendModal = () => { if (legendModal) { legendModal.close(true); legendModal = null; } };
  (function buildLegend() {
    const det = $('[data-legend]');
    const legendBtn = $('[data-act="legend"]');
    const seen = new Map();
    const objs = (level.objects || []).filter((o) => OBJECTS[o.type]);
    objs.slice().sort((a, b) => (a.r - b.r) || (a.c - b.c)).forEach((o) => {
      if (!seen.has(o.type)) seen.set(o.type, 0);
      seen.set(o.type, seen.get(o.type) + 1);
    });
    if (!seen.size) return;
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const group = (occ, title) => {
      const items = [...seen].filter(([t]) => !!OBJECTS[t].occ === occ);
      if (!items.length) return '';
      return `<div class="legend-group${occ ? '' : ' legend-group--block'}"><h3>${title}</h3><ul>${items.map(([t, k]) => {
        const o = OBJECTS[t];
        return `<li><button type="button" class="legend-chip" data-type="${esc(t)}" aria-label="Montrer ${k > 1 ? `les ${esc(o.pl)}` : (/^[aeiouyéèêâî]/i.test(o.n) ? `l’${esc(o.n)}` : o.g === 'f' ? `la ${esc(o.n)}` : `le ${esc(o.n)}`)} sur le plan">`
          + `<span class="legend-thumb" aria-hidden="true">${objectSVG(t, { w: 1, h: 1 })}</span>`
          + `<span class="legend-name">${esc(cap(o.n))}</span>${k > 1 ? `<span class="legend-count">×${k}</span>` : ''}</button></li>`;
      }).join('')}</ul></div>`;
    };
    const groupsHTML = group(true, 'On peut s\'y placer') + group(false, 'Bloque la case');
    $('.legend-body').innerHTML = groupsHTML;
    det.hidden = false;
    det.open = settings.legendOpen !== false;
    det.addEventListener('toggle', () => {
      if (!wide.matches) return; // l'état mémorisé ne suit que le panneau grand écran
      if (det.open !== (settings.legendOpen !== false)) settings = saveSettings({ legendOpen: det.open });
    });
    let flashTimer = null;
    const flashType = (type) => {
      board.el.querySelectorAll('.board-object.flash').forEach((x) => x.classList.remove('flash'));
      const hits = board.el.querySelectorAll(`.board-object[data-type="${type}"]`);
      void board.el.offsetWidth;
      hits.forEach((x) => x.classList.add('flash'));
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => hits.forEach((x) => x.classList.remove('flash')), 1500);
    };
    det.addEventListener('click', (e) => {
      const b = e.target.closest('.legend-chip');
      if (b) flashType(b.dataset.type);
    });
    // téléphone : bouton d'en-tête → fenêtre
    const syncBtn = () => { legendBtn.hidden = wide.matches; if (wide.matches) closeLegendModal(); };
    syncBtn();
    wide.addEventListener('change', syncBtn);
    legendBtn.addEventListener('click', () => {
      if (legendModal) return;
      legendModal = openModal((body, close) => {
        body.innerHTML = `<h2>Légende du plan</h2><div class="legend-body">${groupsHTML}</div>
          <div class="modal-actions"><button type="button" class="btn btn--ghost btn--small" data-close>Fermer</button></div>`;
        body.addEventListener('click', (e) => {
          if (e.target.closest('[data-close]')) { close(); return; }
          const b = e.target.closest('.legend-chip');
          if (!b) return;
          close();
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          $('.board-wrap').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
          flashType(b.dataset.type);
        });
      }, { label: 'Légende du plan', className: 'legend-modal' });
      const m = legendModal;
      const poll = () => { if (m.closed) { if (legendModal === m) legendModal = null; } else setTimeout(poll, 250); };
      poll();
    });
  })();

  // jetons (HTML mis en cache)
  const tokenCache = {};
  const tok = (id) => (tokenCache[id] ||= tokenHTML(byId[id], { size: 64, color: colors[id] }));

  // picker
  pickerEl.innerHTML = shown.map((p) => `<button type="button" class="pick" data-pick="${esc(p.id)}" aria-pressed="false" aria-label="Choisir ${esc(p.name)}${p.victim ? ' (victime)' : ''}">${tokenHTML(p, { size: 40, color: colors[p.id] })}</button>`).join('');

  // fiches
  const clueHTML = {};
  const clueOffset = {};
  cardsEl.innerHTML = shown.map((p) => {
    const lines = personCluesHTML(level, p) || [];
    clueHTML[p.id] = lines;
    clueOffset[p.id] = lines.length - ((p.clues || []).length);
    return `<div class="card${p.victim ? ' victim' : ''}" role="button" tabindex="0" aria-pressed="false" data-card="${esc(p.id)}" aria-label="Fiche de ${esc(p.name)}${p.victim ? ', victime' : ''}" style="${pcStyle(p.id)}">
      <div class="card-face">${tokenHTML(p, { size: 64, color: colors[p.id] })}</div>
      <div class="card-name"><strong>${esc(p.name)}</strong>${p.victim ? '<span class="victim-tag">Victime</span>' : ''}<span class="placed-tag"></span></div>
      <span class="card-letter" aria-hidden="true">${esc(p.id)}</span>
      <ul>${lines.map((h, i) => {
        const cl = i >= clueOffset[p.id] ? (p.clues || [])[i - clueOffset[p.id]] : null;
        if (cl && cl.t === 'sees') {
          // « voyait » : petite icône d'œil ; un appui (ou le focus clavier) rappelle la règle
          return `<li data-i="${i}" class="clue-sees" tabindex="0" aria-describedby="sees-${esc(p.id)}-${i}"><span class="sees-ico" aria-hidden="true">${ICONS.eye}</span>${h}<span class="sees-help" id="sees-${esc(p.id)}-${i}"><b>Voyait</b> : ${esc(SEES_HELP)}</span></li>`;
        }
        return `<li data-i="${i}">${h}</li>`;
      }).join('')}</ul>
    </div>`;
  }).join('');
  const cardEls = Object.fromEntries([...cardsEl.querySelectorAll('[data-card]')].map((el) => [el.dataset.card, el]));
  const pickEls = Object.fromEntries([...pickerEl.querySelectorAll('[data-pick]')].map((el) => [el.dataset.pick, el]));

  // ---------- état ----------
  const snapshot = () => JSON.stringify({ placements: st.placements, notes: st.notes, crosses: st.crosses });
  function restore(s) {
    const o = JSON.parse(s);
    st.placements = o.placements || {};
    st.notes = o.notes || {};
    st.crosses = o.crosses || {};
  }
  function whoAtMap() {
    const m = {};
    for (const [id, p] of Object.entries(st.placements)) m[key(p[0], p[1])] = id;
    return m;
  }
  function commit(fn) {
    history.push(snapshot());
    if (history.length > 400) history.shift();
    fn();
    wrong = new Map();
    hintWrong = null;
    closeHelp({ redraw: false }); // tout changement du plan ferme le panneau d'aide
    render();
    save();
  }
  function save() {
    if (!persist || phase === 'won' || destroyed) return;
    writeJSON(saveKey, {
      sig, placements: st.placements, notes: st.notes, crosses: st.crosses,
      seconds: st.seconds, hints: st.hints, errors: st.errors,
      selected, history: history.slice(-80), at: Date.now(),
    });
  }
  // `kind` : 'idle' = consigne d'attente (affichée seulement sur grand écran) ;
  // 'long' = message à lire plus longtemps (bulle ~5 s au lieu de ~3 s sur téléphone).
  let statusLast = { text: '', tone: '', kind: '' };
  let statusTimer = null;
  let statusClear = null;
  function paintStatus(text, tone) {
    statusEl.textContent = text;
    if (tone) statusEl.dataset.tone = tone; else delete statusEl.dataset.tone;
  }
  function hideBubble() {
    clearTimeout(statusTimer);
    clearTimeout(statusClear);
    statusEl.classList.remove('is-on');
    statusClear = setTimeout(() => { if (!statusEl.classList.contains('is-on')) paintStatus('', ''); }, 400);
  }
  function setStatus(text, tone = '', kind = '') {
    statusLast = { text, tone, kind };
    if (wide.matches) { paintStatus(text, tone); return; }
    if (kind === 'idle') { hideBubble(); return; }
    clearTimeout(statusTimer);
    clearTimeout(statusClear);
    paintStatus(text, tone);
    void statusEl.offsetWidth;
    statusEl.classList.add('is-on');
    statusTimer = setTimeout(hideBubble, kind === 'long' ? 5000 : 3000);
  }
  wide.addEventListener('change', () => {
    clearTimeout(statusTimer);
    clearTimeout(statusClear);
    statusEl.classList.remove('is-on');
    if (wide.matches) paintStatus(statusLast.text, statusLast.tone); else paintStatus('', '');
  });
  const roomName = (r, c) => {
    const k = level.roomMap[r] && level.roomMap[r][c];
    return (roomsByKey[k] && roomsByKey[k].name) || '';
  };
  const where = (r, c) => `ligne ${r + 1}, colonne ${c + 1}${roomName(r, c) ? ` (${roomName(r, c)})` : ''}`;

  // ---------- rendu ----------
  function render() {
    const at = whoAtMap();
    const rows = new Set();
    const cols = new Set();
    for (const p of Object.values(st.placements)) { rows.add(p[0]); cols.add(p[1]); }
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const cell = board.cells[r][c];
        const layer = cell.querySelector('.cell-layer');
        const k = key(r, c);
        const id = at[k];
        let html = '';
        if (id) {
          let cls = '';
          if (id === selected) cls += ' selected';
          if (id === hintWrong) cls += ' hint-wrong';
          if (id === justPlaced) cls += ' just-placed';
          html = tok(id).replace('class="token', `class="token${cls}`);
        } else if (!cell.classList.contains('blocked')) {
          if (st.crosses[k]) html += `<span class="mark-x manual">${X_SVG}</span>`;
          else if (rows.has(r) || cols.has(c)) html += `<span class="mark-x">${X_SVG}</span>`;
          const notes = st.notes[k];
          if (notes && notes.length) {
            html += `<span class="notes">${notes.map((nid) => `<span class="note${nid === selected ? ' sel' : ''}" style="${pcStyle(nid)}">${esc(nid)}</span>`).join('')}</span>`;
          }
        }
        if (help && help.keys.has(k)) html += '<span class="help-ring" aria-hidden="true"></span>';
        if (layer.innerHTML !== html) layer.innerHTML = html;
        cell.classList.toggle('is-help', !!(help && help.keys.has(k)));
        const label = id ? `${byId[id].name}` : (st.crosses[k] ? 'croix' : '');
        cell.dataset.state = label;
      }
    }
    justPlaced = null;

    // fiches + picker
    const placedCount = Object.keys(st.placements).length;
    const complete = placedCount === count && count > 0;
    let victimState = null;
    try { const v = evaluate(level, st.placements).victimOk; victimState = v === true || v === false ? v : null; } catch { victimState = null; }
    for (const p of people) {
      const card = cardEls[p.id];
      const isSel = p.id === selected;
      card.setAttribute('aria-pressed', String(isSel));
      pickEls[p.id].setAttribute('aria-pressed', String(isSel));
      const pl = st.placements[p.id];
      pickEls[p.id].classList.toggle('placed', !!pl);
      card.classList.toggle('placed', !!pl);
      card.querySelector('.placed-tag').textContent = pl ? `posé${fem(p, '', 'e')} · L${pl[0] + 1} C${pl[1] + 1}` : '';
      const bad = wrong.get(p.id);
      card.classList.toggle('wrong', !!bad);
      const lis = card.querySelectorAll('li');
      const off = clueOffset[p.id];
      lis.forEach((li, i) => {
        let s = null;
        if (i < off) s = p.victim ? victimState : null;
        else {
          const clue = p.clues[i - off];
          try { s = checkClue(level, st.placements, p, clue); } catch { s = null; }
        }
        if (s === true || s === false) li.dataset.state = String(s); else delete li.dataset.state;
        li.classList.toggle('culprit', !!(bad && bad.has(i)));
      });
    }
    metaEl.textContent = `${placedCount}/${count} posés`;

    // outils
    tools.cross.setAttribute('aria-pressed', String(mode === 'cross'));
    tools.erase.setAttribute('aria-pressed', String(mode === 'erase'));
    board.el.classList.toggle('mode-cross', mode === 'cross');
    board.el.classList.toggle('mode-erase', mode === 'erase');
    const playing = phase === 'play';
    tools.undo.disabled = !playing || history.length === 0;
    tools.validate.disabled = !playing || !complete;
    tools.hint.disabled = !playing;
    tools.cross.disabled = !playing;
    tools.erase.disabled = !playing;
    tools.hint.querySelector('.count').textContent = st.hints ? String(st.hints) : '';
    emit('render');
  }

  function renderTimer() {
    timerEl.textContent = formatTime(st.seconds);
    const paused = phase !== 'play' || document.hidden;
    timerEl.classList.toggle('paused', paused && phase !== 'won');
    timerEl.setAttribute('aria-label', `Temps écoulé : ${formatTime(st.seconds)}${paused && phase !== 'won' ? ' (en pause)' : ''}`);
  }

  // ---------- actions ----------
  function select(id, announce = false) {
    if (!byId[id]) return;
    if (announce && gate({ type: 'select', id }) !== true) return;
    if (announce) play('tap');
    selected = id;
    render();
    if (announce) emit('select', { id });
    if (announce) {
      const p = byId[id];
      const pl = st.placements[id];
      setStatus(pl ? `${p.name} est sélectionné${fem(p, '', 'e')} (${where(pl[0], pl[1])}).` : `${p.name} est sélectionné${fem(p, '', 'e')}. Appui long sur une case pour l'y poser.`, '', 'idle');
    }
  }

  function refuse(r, c, msg = 'Cette case est occupée par un objet : personne ne peut s’y tenir.') {
    const cell = board.cells[r][c];
    cell.classList.remove('shake');
    void cell.offsetWidth;
    cell.classList.add('shake');
    setTimeout(() => cell.classList.remove('shake'), 350);
    play('refuse');
    setStatus(msg, 'error');
  }

  function isBlocked(r, c) {
    try { return !canPlace(level, r, c); } catch { return !!(level.cells[r][c] && level.cells[r][c].blocked); }
  }

  function toggleNote(r, c) {
    if (isBlocked(r, c)) return refuse(r, c);
    const at = whoAtMap();
    const occupant = at[key(r, c)];
    if (occupant) { select(occupant, true); return; }
    if (gate({ type: 'note', r, c, id: selected }) !== true) return;
    if (!selected) { play('refuse'); setStatus('Choisissez d’abord un personnage.'); return; }
    const k = key(r, c);
    const p = byId[selected];
    play('note');
    commit(() => {
      const list = (st.notes[k] || []).slice();
      const i = list.indexOf(selected);
      if (i >= 0) list.splice(i, 1); else { list.push(selected); list.sort(); }
      if (list.length) st.notes[k] = list; else delete st.notes[k];
    });
    setStatus(`Note : ${p.name} peut-être ${where(r, c)}.`);
    emit('note', { r, c, id: p.id });
  }

  function toggleCross(r, c) {
    if (isBlocked(r, c)) return refuse(r, c);
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (occupant) { select(occupant, true); return; }
    if (gate({ type: 'cross', r, c }) !== true) return;
    play('cross');
    commit(() => { if (st.crosses[k]) delete st.crosses[k]; else st.crosses[k] = true; });
    setStatus(st.crosses[k] ? `Croix posée ${where(r, c)}.` : 'Croix retirée.');
    emit('cross', { r, c });
  }

  function eraseCell(r, c) {
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (!occupant && !st.crosses[k] && !(st.notes[k] && st.notes[k].length)) return;
    if (gate({ type: 'erase', r, c }) !== true) return;
    play(occupant ? 'remove' : 'erase');
    commit(() => {
      if (occupant) delete st.placements[occupant];
      delete st.crosses[k];
      delete st.notes[k];
    });
    setStatus(occupant ? `${byId[occupant].name} retiré${fem(byId[occupant], '', 'e')} du plan.` : 'Case effacée.');
    emit('erase', { r, c });
  }

  function placeAt(r, c, id = selected, { silent = false } = {}) {
    if (isBlocked(r, c)) return refuse(r, c);
    if (!id && !silent && gate({ type: 'place', r, c, id }) !== true) return;
    if (!id) { play('refuse'); setStatus('Choisissez d’abord un personnage.'); return; }
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (occupant === id) { select(id, true); return; }
    if (!silent && gate({ type: 'place', r, c, id }) !== true) return;
    const p = byId[id];
    const wasComplete = Object.keys(st.placements).length === count;
    commit(() => {
      if (occupant) delete st.placements[occupant];
      st.placements[id] = [r, c];
      delete st.crosses[k];
      for (const nk of Object.keys(st.notes)) {
        const list = st.notes[nk].filter((x) => x !== id);
        if (list.length) st.notes[nk] = list; else delete st.notes[nk];
      }
      selected = id;
      justPlaced = id;
    });
    if (!silent) {
      const extra = occupant ? ` ${byId[occupant].name} est retiré${fem(byId[occupant], '', 'e')} de la case.` : '';
      setStatus(`${p.name} posé${fem(p, '', 'e')} ${where(r, c)}.${extra}`);
    }
    const nowComplete = Object.keys(st.placements).length === count;
    if (!silent) play(nowComplete && !wasComplete ? 'ready' : 'place');
    if (nowComplete) {
      if (!silent) setStatus('Tout le monde est sur le plan. Vérifiez les fiches, puis validez.', 'ok');
    }
    if (!silent) emit('place', { r, c, id });
  }

  function shortAction(r, c) {
    if (phase === 'weapon') return pickWeapon(r, c);
    if (phase !== 'play') return;
    if (mode === 'cross') return toggleCross(r, c);
    if (mode === 'erase') return eraseCell(r, c);
    if (settings.oneTap) {
      const occupant = whoAtMap()[key(r, c)];
      if (occupant && occupant !== selected) return select(occupant, true);
      return placeAt(r, c);
    }
    return toggleNote(r, c);
  }
  function longAction(r, c) {
    if (phase !== 'play') return;
    if (settings.oneTap && !mode) return toggleNote(r, c);
    return placeAt(r, c);
  }

  function undo() {
    if (!history.length || phase !== 'play') return;
    play('undo');
    restore(history.pop());
    wrong = new Map();
    hintWrong = null;
    closeHelp({ redraw: false });
    render();
    save();
    setStatus('Dernière action annulée.');
  }

  async function clearAll() {
    if (gate({ type: 'clearAll' }) !== true) return;
    const ok = await confirmDialog({
      kicker: 'Gomme', title: 'Tout effacer et remettre le chronomètre à zéro ?',
      text: 'Les poses, les notes et les croix seront retirées du plan. Le chronomètre, les indices et les erreurs repartent de zéro : c’est une nouvelle tentative.',
      ok: 'Tout effacer', danger: true,
    });
    if (!ok || destroyed) return;
    play('erase');
    commit(() => { st.placements = {}; st.notes = {}; st.crosses = {}; st.seconds = 0; st.hints = 0; st.errors = 0; });
    tickCount = 0;
    mode = null;
    render();
    renderTimer();
    setStatus('Plan remis à zéro.');
  }

  function getSolution() {
    if (solution === undefined) {
      try { solution = (solve(level, { max: 1 }) || [])[0] || null; } catch { solution = null; }
    }
    return solution;
  }

  // ---------- panneau d'aide (indice qui explique) ----------
  const helpEl = $('.help-panel');
  const HELP_KICKER = {
    forced: 'Déduction', narrow: 'Piste', reveal: 'Coup de pouce', revealed: 'La bonne case',
    wrong: 'Erreur repérée', done: 'Tout est en place',
  };
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function closeHelp({ redraw = true } = {}) {
    if (!help) return;
    if (help.type === 'weapon') return; // le bandeau de l'arme ne se ferme qu'en répondant
    const was = help;
    help = null;
    helpEl.hidden = true;
    helpEl.innerHTML = '';
    delete helpEl.dataset.kind;
    screen.classList.remove('help-open');
    screen.style.removeProperty('--help-h');
    if (was.kind === 'wrong' && hintWrong === was.person) hintWrong = null;
    if (redraw) render();
  }
  function paintHelp({ kicker, kind, html, actions }) {
    helpEl.dataset.kind = kind;
    helpEl.innerHTML = `<div class="help-head"><span class="help-kicker">${esc(kicker)}</span>
        ${help.type === 'hint' ? `<button type="button" class="help-x" data-help="close" aria-label="Fermer l’aide">${ICONS.cross}</button>` : ''}</div>
      <p class="help-text">${html}</p>
      <div class="help-actions">${actions.map(([act, label, cls]) => `<button type="button" class="btn btn--small ${cls || ''}" data-help="${act}">${label}</button>`).join('')}</div>`;
    helpEl.hidden = false;
    screen.classList.add('help-open');
    hideBubble();
    render();
    // téléphone : on réserve sous le contenu la hauteur du panneau, pour pouvoir tout faire défiler
    screen.style.setProperty('--help-h', `${Math.ceil(helpEl.getBoundingClientRect().height)}px`);
    const first = helpEl.querySelector('.help-actions button');
    if (first) { try { first.focus({ preventScroll: true }); } catch { /* rien */ } }
    revealHelpCells();
  }
  // Le plateau défile en vue si une case mise en évidence est cachée (en-tête, panneau d'aide, bord).
  function revealHelpCells() {
    if (!help || !help.keys.size) return;
    const rects = [...help.keys].map((k) => { const [r, c] = k.split(',').map(Number); return board.cells[r][c].getBoundingClientRect(); });
    const topY = Math.min(...rects.map((x) => x.top));
    const botY = Math.max(...rects.map((x) => x.bottom));
    const minY = topbar.getBoundingClientRect().bottom + 8;
    const maxY = (wide.matches || helpEl.hidden ? window.innerHeight : helpEl.getBoundingClientRect().top) - 8;
    if (topY >= minY && botY <= maxY) return;
    const span = botY - topY;
    const delta = span > maxY - minY ? topY - minY : (topY + botY) / 2 - (minY + maxY) / 2;
    window.scrollBy({ top: delta, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  function showHelp(ex, { revealed = false } = {}) {
    const kind = revealed ? 'revealed' : ex.kind;
    const p = ex.person ? byId[ex.person] : null;
    const cells = (kind === 'wrong' ? [ex.cell] : ex.cells || []).filter((x) => Array.isArray(x));
    help = { type: 'hint', ex, kind, person: p ? p.id : null, cell: ex.cell || null, keys: new Set(cells.map(([r, c]) => key(r, c))) };
    if (p) selected = p.id;
    hintWrong = kind === 'wrong' && p ? p.id : null;
    let html = ex.html || '';
    let actions = [['ok', 'J’ai compris', 'btn--primary']];
    if ((kind === 'forced' || kind === 'reveal' || kind === 'revealed') && p && ex.cell) {
      actions = [['place', 'Poser pour moi', 'btn--accent'], ['ok', 'J’ai compris', '']];
    } else if (kind === 'narrow' && p) {
      actions = [['ok', 'J’ai compris', 'btn--primary'], ['show', 'Montrer la case', '']];
    } else if (kind === 'wrong' && p) {
      actions = [['remove', 'Retirer ce personnage', 'btn--accent'], ['ok', 'J’ai compris', '']];
    } else if (kind === 'done') {
      const complete = Object.keys(st.placements).length === count;
      html = `${html}${complete ? ' Touchez <b>Valider</b> pour confirmer votre plan.' : ''}`;
      actions = complete ? [['validate', 'Valider', 'btn--accent'], ['ok', 'Fermer', '']] : [['ok', 'Fermer', 'btn--primary']];
    }
    paintHelp({ kicker: HELP_KICKER[kind] || 'Indice', kind, html, actions });
  }
  helpEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-help]');
    if (!b || !help) return;
    const act = b.dataset.help;
    if (help.type === 'weapon') { weaponAction(act); return; }
    const h = help;
    if (act === 'close' || act === 'ok') { play('close'); closeHelp(); return; }
    if (act === 'place' && h.person && h.cell) { placeAt(h.cell[0], h.cell[1], h.person); return; }
    if (act === 'remove' && h.person && st.placements[h.person]) {
      const p = byId[h.person];
      play('remove');
      commit(() => { delete st.placements[h.person]; });
      selected = p.id;
      render();
      setStatus(`${p.name} retiré${fem(p, '', 'e')} du plan.`);
      return;
    }
    if (act === 'validate') { closeHelp(); validate(); return; }
    if (act === 'show' && h.person) {
      const sol = getSolution();
      const pos = sol && sol[h.person];
      if (!pos) return;
      play('hint');
      st.hints++;
      save();
      const p = byId[h.person];
      const [r, c] = pos;
      showHelp({
        kind: 'reveal', person: p.id, cell: [r, c], cells: [[r, c]],
        html: `La bonne case de <b>${esc(p.name)}</b>, c’est celle-ci : ${esc(where(r, c))}.`,
      }, { revealed: true });
    }
  });

  function hint() {
    if (guide) return legacyHint(); // enquête guidée : comportement d'origine
    if (phase !== 'play') return;
    let ex = null;
    try { ex = explain(level, st.placements, { prefer: selected || undefined }); } catch (err) { console.warn(err); ex = null; }
    if (!ex) { play('refuse'); setStatus('Impossible de calculer un indice pour ce niveau.', 'error'); return; }
    play('hint');
    if (ex.person || ex.kind === 'done') st.hints++;
    save();
    showHelp(ex);
  }

  function legacyHint() {
    if (phase !== 'play') return;
    const sol = getSolution();
    if (!sol) { play('refuse'); setStatus('Impossible de calculer un indice pour ce niveau.', 'error'); return; }
    play('hint');
    const misplaced = people.filter((p) => {
      const pl = st.placements[p.id];
      return pl && sol[p.id] && (pl[0] !== sol[p.id][0] || pl[1] !== sol[p.id][1]);
    });
    if (misplaced.length) {
      st.hints++;
      const p = misplaced[0];
      hintWrong = p.id;
      selected = p.id;
      render();
      save();
      setStatus(`Indice : ${p.name} n’est pas à sa place.${misplaced.length > 1 ? ' Et ce n’est pas la seule erreur.' : ''}`, 'hint', 'long');
      return;
    }
    let target = selected && !st.placements[selected] ? selected : null;
    if (!target) { const f = shown.find((p) => !st.placements[p.id]); target = f ? f.id : null; }
    if (!target) { setStatus('Tout le monde est déjà à sa place : il ne reste qu’à valider !', 'ok', 'long'); return; }
    const [r, c] = sol[target];
    st.hints++;
    placeAt(r, c, target, { silent: true });
    const p = byId[target];
    setStatus(`Indice : ${p.name} se trouvait ${where(r, c)}.`, 'hint', 'long');
  }

  function validate() {
    if (phase !== 'play') return;
    if (Object.keys(st.placements).length !== count) return;
    let ev;
    try { ev = evaluate(level, st.placements); } catch (err) { console.warn(err); setStatus('Vérification impossible.', 'error'); return; }
    if (ev.ok) {
      closeHelp({ redraw: false });
      phase = 'accuse';
      render();
      renderTimer();
      emit('validate', { ok: true });
      openAccuse(ev);
      return;
    }
    play('fail');
    st.errors++;
    wrong = new Map();
    if (tw.liar) {
      // Témoin menteur : un indice faux n'est pas une faute en soi ; aucune fiche n'est désignée.
      render();
      save();
      const parts = [];
      if (ev.lines && ev.lines.ok === false) parts.push('Une ligne ou une colonne contient plusieurs personnes.');
      if (ev.victimOk === false) parts.push('La victime doit être seule avec une seule autre personne dans sa pièce.');
      if (!parts.length) parts.push('Ça ne colle pas : il faut exactement un menteur dont tout est faux, et tous les autres doivent dire vrai.');
      setStatus(`Pas encore… ${parts.join(' ')}`, 'error', 'long');
      emit('validate', { ok: false });
      return;
    }
    for (const p of people) {
      const info = ev.people && ev.people[p.id];
      const off = clueOffset[p.id];
      const set = new Set();
      if (info && Array.isArray(info.clues)) info.clues.forEach((v, i) => { if (v === false) set.add(i + off); });
      if (p.victim && ev.victimOk === false) set.add(0);
      if (set.size || (info && info.ok === false)) wrong.set(p.id, set);
    }
    render();
    save();
    const parts = [];
    if (ev.lines && ev.lines.ok === false) parts.push('Une ligne ou une colonne contient plusieurs personnes.');
    const names = [...wrong.keys()].filter((id) => !byId[id].victim).map((id) => byId[id].name);
    if (names.length) parts.push(`${names.length > 1 ? 'Ces témoignages ne collent pas' : 'Ce témoignage ne colle pas'} : ${names.join(', ')}.`);
    if (ev.victimOk === false) parts.push('La victime doit être seule avec une seule autre personne dans sa pièce.');
    if (!parts.length) parts.push('Quelque chose cloche dans ce plan.');
    setStatus(`Pas encore… ${parts.join(' ')}`, 'error', 'long');
    emit('validate', { ok: false });
    const first = [...wrong.keys()][0];
    if (first && cardEls[first]) cardEls[first].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  const suspectsHTML = (attr, list) => `<div class="suspects">${list.map((p) => `<button type="button" class="suspect" data-${attr}="${esc(p.id)}" style="${pcStyle(p.id)}">${tokenHTML(p, { size: 64, color: colors[p.id] })}<span>${esc(p.name)}</span></button>`).join('')}</div>`;

  function openAccuse(ev) {
    const suspects = people.filter((p) => !p.victim);
    const victim = people.find((p) => p.victim);
    let murdererId = null;
    modal = openModal((body, close) => {
      let msg = null;
      const drawCulprit = () => {
        body.innerHTML = `<div class="modal-kicker">Plan reconstitué</div>
          <h2>Qui est le coupable ?</h2>
          <p>Votre plan tient debout : ${tw.liar ? 'un seul témoin ment, tous les autres disent vrai.' : 'chaque témoignage est respecté.'}${victim ? ` Qui se trouvait seul à seul avec ${esc(victim.name)} ?` : ' Désignez le coupable.'}</p>
          ${guide && guide.accuseHTML ? guide.accuseHTML() : ''}
          ${suspectsHTML('s', suspects)}
          <p class="accuse-msg" role="status" aria-live="polite"></p>
          <div class="modal-actions"><button type="button" class="btn btn--ghost" data-back>Revenir au plan</button></div>`;
        msg = body.querySelector('.accuse-msg');
      };
      // Témoin menteur : seconde question, avec les mêmes jetons de suspects.
      const drawLiar = () => {
        const m = byId[murdererId];
        body.innerHTML = `<div class="modal-kicker">Coupable démasqué</div>
          <h2>Et qui mentait ?</h2>
          <p>Bien vu : <b>${esc(m.name)}</b> était ${fem(m, 'le meurtrier', 'la meurtrière')}. Reste à désigner le témoin menteur, celui dont tout le témoignage est faux.</p>
          ${suspectsHTML('l', suspects)}
          <p class="accuse-msg" role="status" aria-live="polite"></p>
          <div class="modal-actions"><button type="button" class="btn btn--ghost" data-back>Revenir au plan</button></div>`;
        msg = body.querySelector('.accuse-msg');
        const h = body.querySelector('h2');
        if (h) { h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch { /* rien */ } }
      };
      const finish = (liarId) => {
        close(true);
        modal = null;
        if (tw.weapon) startWeapon(murdererId, liarId); else win(murdererId, { liarId });
      };
      const miss = (b, text) => {
        play('accuseWrong');
        st.errors++;
        save();
        b.classList.add('nope');
        b.disabled = true;
        msg.textContent = `${text} Erreurs : ${st.errors}.`;
        msg.dataset.tone = 'error';
      };
      body.addEventListener('click', (e) => {
        if (e.target.closest('[data-guide-quit]')) { close(true); if (guide) guide.quit(); return; }
        if (e.target.closest('[data-back]')) { close(); backToPlay(); return; }
        const lb = e.target.closest('[data-l]');
        if (lb && !lb.classList.contains('nope')) {
          const id = lb.dataset.l;
          if (id === ev.liar) { finish(id); return; }
          const p = byId[id];
          miss(lb, `Non : le témoignage de ${p.name} n’est pas entièrement faux.`);
          return;
        }
        const b = e.target.closest('[data-s]');
        if (!b || b.classList.contains('nope')) return;
        const id = b.dataset.s;
        const g = gate({ type: 'accuse', id, ok: id === ev.murderer });
        if (g !== true) { msg.textContent = g; msg.dataset.tone = 'hint'; return; }
        if (id === ev.murderer) {
          murdererId = id;
          if (tw.liar && ev.liar) { play('ready'); drawLiar(); return; }
          finish(null);
          return;
        }
        const p = byId[id];
        miss(b, `Mauvaise piste : ${p.name} n’était pas seul${fem(p, '', 'e')} avec la victime.`);
      });
      drawCulprit();
    }, { label: 'Qui est le coupable ?', onCancel: backToPlay });
  }
  function backToPlay() {
    modal = null;
    if (phase === 'accuse') { phase = 'play'; render(); renderTimer(); emit('back'); }
  }

  // ---------- bonus : l'arme du crime ----------
  const objEls = [...board.el.querySelectorAll('.board-object')];
  function objectAt(r, c) {
    const cell = level.cells[r] && level.cells[r][c];
    if (cell && cell.objIndex != null) return cell.objIndex;
    return (level.objects || []).findIndex((o) => r >= o.r && r < o.r + (o.h || 1) && c >= o.c && c < o.c + (o.w || 1));
  }
  function startWeapon(murdererId, liarId) {
    let answer = null;
    try { answer = weaponOf(level, st.placements); } catch (err) { console.warn(err); }
    if (answer == null || !level.objects[answer]) { win(murdererId, { liarId }); return; }
    phase = 'weapon';
    weaponState = { murdererId, liarId, answer, choice: null, ok: false, done: false };
    board.el.classList.add('board--weapon');
    help = { type: 'weapon', keys: new Set() };
    render();
    renderTimer();
    const m = byId[murdererId];
    paintHelp({
      kicker: 'Bonus', kind: 'weapon',
      html: `<b>Bonus : touchez l’objet qui a servi d’arme.</b> Il se trouvait à côté de ${esc(m.name)}. Une seule tentative, sans pénalité.`,
      actions: [['skip', 'Passer', 'btn--ghost']],
    });
    setStatus('Bonus : touchez l’objet qui a servi d’arme.', 'hint', 'idle');
    const reduce = reduceMotion();
    if (wide.matches) boardWrap.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
  function pickWeapon(r, c) {
    if (phase !== 'weapon' || !weaponState || weaponState.done) return;
    const k = objectAt(r, c);
    if (k == null || k < 0) {
      play('refuse');
      const cell = board.cells[r][c];
      cell.classList.remove('shake'); void cell.offsetWidth; cell.classList.add('shake');
      setTimeout(() => cell.classList.remove('shake'), 350);
      setStatus('Touchez un objet du plan.', 'hint');
      return;
    }
    weaponState.choice = k;
    weaponState.ok = k === weaponState.answer;
    endWeapon();
  }
  function endWeapon(skipped = false) {
    const ws = weaponState;
    ws.done = true;
    ws.skipped = skipped;
    board.el.classList.remove('board--weapon');
    board.el.classList.add('board--weapon-done');
    if (objEls[ws.answer]) objEls[ws.answer].classList.add('weapon-answer');
    if (!skipped && !ws.ok && objEls[ws.choice]) objEls[ws.choice].classList.add('weapon-miss');
    const o = level.objects[ws.answer];
    const m = byId[ws.murdererId];
    const name = objDef(o.type);
    play(ws.ok ? 'ready' : 'tap');
    let html;
    if (ws.ok) html = `<b>Bien vu !</b> ${cap1(name)} était l’arme du crime.`;
    else if (skipped) html = `L’arme du crime était <b>${name}</b>, à côté de ${esc(m.name)}.`;
    else html = `Ce n’était pas ça : l’arme était <b>${name}</b>, à côté de ${esc(m.name)}. Aucune pénalité.`;
    paintHelp({ kicker: ws.ok ? 'Bonus réussi' : 'Arme du crime', kind: ws.ok ? 'weapon-ok' : 'weapon-miss', html, actions: [['finish', 'Voir le bilan', 'btn--accent']] });
  }
  function weaponAction(act) {
    if (!weaponState) return;
    if (act === 'skip' && !weaponState.done) { endWeapon(true); return; }
    if (act === 'finish' && weaponState.done) {
      const ws = weaponState;
      help = null;
      helpEl.hidden = true;
      helpEl.innerHTML = '';
      screen.classList.remove('help-open');
      win(ws.murdererId, { liarId: ws.liarId, weapon: { index: ws.answer, ok: ws.ok } });
    }
  }
  board.el.addEventListener('click', (e) => {
    if (phase !== 'weapon' || e.detail === 0) return; // clavier : traité par onCellKey
    const cell = cellFrom(e);
    if (cell) pickWeapon(+cell.dataset.r, +cell.dataset.c);
  });

  // Vignette d'objet dans le bilan : 64 px sur la grande dimension, proportions respectées.
  const thumbBox = (o) => { const w = o.w || 1, h = o.h || 1, m = Math.max(w, h); return `width:${Math.round(64 * w / m)}px;height:${Math.round(64 * h / m)}px`; };
  function win(murdererId, { liarId = null, weapon = null } = {}) {
    phase = 'won';
    if (persist) removeKey(saveKey);
    render();
    renderTimer();
    const result = { seconds: st.seconds, hints: st.hints, errors: st.errors };
    if (weapon) result.bonus = !!weapon.ok;
    let extra = null;
    try { extra = onSolved ? onSolved(result) : null; } catch (err) { console.warn(err); }
    const m = byId[murdererId];
    const liarP = liarId ? byId[liarId] : null;
    play('win');
    setStatus(`Affaire classée : ${m.name} était ${fem(m, 'le meurtrier', 'la meurtrière')}.${liarP ? ` ${liarP.name} mentait.` : ''}`, 'ok');
    if (guide) { emit('won', { id: murdererId, ...result }); return; }
    const many = !!(liarP || weapon);
    const wObj = weapon ? level.objects[weapon.index] : null;
    modal = openModal((body, close) => {
      body.innerHTML = `<div class="modal-kicker">Affaire classée</div>
        <h2>${esc(level.title || 'Enquête')} : résolu !</h2>
        <div class="win-reveal${many ? ' win-reveal--compact' : ''}" style="${pcStyle(m.id)}">${tokenHTML(m, { size: 96, color: colors[m.id] })}
          <div><span class="stamp stamp--culprit">Coupable</span><p style="margin:.4em 0 0"><strong>${esc(m.name)}</strong> était ${fem(m, 'le meurtrier', 'la meurtrière')}.</p></div></div>
        ${liarP ? `<div class="win-reveal win-reveal--compact win-reveal--liar" style="${pcStyle(liarP.id)}">${tokenHTML(liarP, { size: 96, color: colors[liarP.id] })}
          <div><span class="stamp stamp--liar">${fem(liarP, 'Menteur', 'Menteuse')}</span><p style="margin:.4em 0 0"><strong>${esc(liarP.name)}</strong> mentait : tout son témoignage était faux.</p></div></div>` : ''}
        ${wObj ? `<div class="win-weapon${weapon.ok ? ' is-ok' : ''}"><span class="win-weapon-thumb" style="${thumbBox(wObj)}">${objectSVG(wObj.type, { w: wObj.w || 1, h: wObj.h || 1 })}</span>
          <div><span class="stamp ${weapon.ok ? 'stamp--bonus' : 'stamp--brass'}">${weapon.ok ? 'Bonus réussi' : 'Arme du crime'}</span><p style="margin:.4em 0 0"><strong>${cap1(objDef(wObj.type))}</strong> ${weapon.ok ? 'a servi d’arme : bien vu !' : 'a servi d’arme. Bonus manqué, sans pénalité.'}</p></div></div>` : ''}
        <dl class="win-stats">
          <div><dt>Temps</dt><dd>${formatTime(st.seconds)}</dd></div>
          <div><dt>Indices</dt><dd>${st.hints}</dd></div>
          <div><dt>Erreurs</dt><dd>${st.errors}</dd></div>
        </dl>
        ${extra && extra.record ? '<p class="win-record">Nouveau record personnel !</p>' : ''}
        <div class="modal-actions win-actions">
          ${onNext ? '<button type="button" class="btn btn--accent" data-w="next" autofocus>Niveau suivant</button>' : ''}
          <button type="button" class="btn btn--ghost" data-w="plan">Voir le plan</button>
          <button type="button" class="btn" data-w="home">${esc(exitLabel)}</button>
        </div>`;
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-w]');
        if (!b) return;
        close();
        modal = null;
        if (b.dataset.w === 'home') onExit && onExit();
        else if (b.dataset.w === 'next') onNext && onNext();
      });
    }, { label: 'Victoire', onCancel: () => { modal = null; }, silent: true });
  }

  // ---------- événements du plateau ----------
  let press = null;
  function cancelPress() {
    if (!press) return;
    clearTimeout(press.timer);
    clearTimeout(press.ringTimer);
    if (press.ring) press.ring.remove();
    press = null;
  }
  function cellFrom(e) {
    const cell = e.target.closest && e.target.closest('.cell');
    return cell && board.el.contains(cell) ? cell : null;
  }
  const onPointerDown = (e) => {
    const cell = cellFrom(e);
    if (!cell) return;
    lastPointerType = e.pointerType || 'mouse';
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelPress();
    if (phase !== 'play') return;
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    const p = { r, c, x: e.clientX, y: e.clientY, pid: e.pointerId, cell, fired: false, ring: null };
    press = p;
    if (!isBlocked(r, c)) {
      p.ringTimer = setTimeout(() => {
        if (press !== p) return;
        const ring = document.createElement('span');
        ring.className = 'press-ring';
        ring.style.setProperty('--press-ms', `${LONG_MS - RING_DELAY}ms`);
        ring.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40"/></svg>';
        cell.appendChild(ring);
        p.ring = ring;
      }, RING_DELAY);
    }
    p.timer = setTimeout(() => {
      if (press !== p) return;
      p.fired = true;
      if (p.ring) p.ring.remove();
      clearTimeout(p.ringTimer);
      if (navigator.vibrate && e.pointerType === 'touch') { try { navigator.vibrate(12); } catch { /* rien */ } }
      longAction(r, c);
    }, LONG_MS);
  };
  const onPointerMove = (e) => {
    if (!press || e.pointerId !== press.pid) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) cancelPress();
  };
  const onPointerUp = (e) => {
    if (!press || e.pointerId !== press.pid) return;
    const p = press;
    const fired = p.fired;
    cancelPress();
    if (!fired) shortAction(p.r, p.c);
  };
  const onDblClick = (e) => {
    const cell = cellFrom(e);
    if (!cell || lastPointerType !== 'mouse') return;
    e.preventDefault();
    longAction(+cell.dataset.r, +cell.dataset.c);
  };
  const onContextMenu = (e) => {
    const cell = cellFrom(e);
    e.preventDefault();
    if (!cell) return;
    if (lastPointerType === 'mouse' && e.button === 2) {
      cancelPress();
      longAction(+cell.dataset.r, +cell.dataset.c);
    }
  };
  const onCellKey = (e) => {
    const cell = cellFrom(e);
    if (!cell) return;
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      const nr = Math.min(R - 1, Math.max(0, r + dr));
      const nc = Math.min(C - 1, Math.max(0, c + dc));
      board.cells[nr][nc].focus();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey) longAction(r, c); else shortAction(r, c);
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault(); if (phase === 'play') placeAt(r, c);
    } else if (e.key === 'x' || e.key === 'X') {
      e.preventDefault(); if (phase === 'play') toggleCross(r, c);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault(); if (phase === 'play') eraseCell(r, c);
    }
  };
  board.el.addEventListener('pointerdown', onPointerDown);
  board.el.addEventListener('pointermove', onPointerMove);
  board.el.addEventListener('pointerup', onPointerUp);
  board.el.addEventListener('pointercancel', cancelPress);
  board.el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cancelPress(); });
  board.el.addEventListener('dblclick', onDblClick);
  board.el.addEventListener('contextmenu', onContextMenu);
  board.el.addEventListener('keydown', onCellKey);
  board.el.addEventListener('selectstart', (e) => e.preventDefault());

  // fiches / picker
  let seesPress = false;
  cardsEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-card]');
    if (card) select(card.dataset.card, true);
    // « voyait » : un appui sur l'indice affiche (ou masque) le rappel de la règle
    const sees = e.target.closest('.clue-sees');
    if (sees) {
      const on = !sees.classList.contains('show-help');
      cardsEl.querySelectorAll('.clue-sees.show-help').forEach((x) => x.classList.remove('show-help'));
      sees.classList.toggle('show-help', on);
    }
    seesPress = false;
  });
  // focus clavier : le rappel s'affiche ; au pointeur, c'est le clic (ci-dessus) qui bascule
  cardsEl.addEventListener('pointerdown', (e) => { seesPress = !!(e.target.closest && e.target.closest('.clue-sees')); });
  cardsEl.addEventListener('focusin', (e) => {
    const sees = e.target.closest && e.target.closest('.clue-sees');
    if (sees && e.target === sees && !seesPress) sees.classList.add('show-help');
    seesPress = false;
  });
  cardsEl.addEventListener('focusout', (e) => {
    const sees = e.target.closest && e.target.closest('.clue-sees');
    if (sees && e.target === sees) sees.classList.remove('show-help');
  });
  // pastilles de variante : rouvrent la règle
  screen.querySelector('.dossier-head').addEventListener('click', (e) => {
    const b = e.target.closest('[data-twist]');
    if (!b || (ruleModal && !ruleModal.closed)) return;
    const k = b.dataset.twist;
    const extra = k === 'liar'
      ? '<p class="tuto-note">Les puces des fiches restent factuelles : ✓ vrai, ✗ faux d’après votre plan. Sur cette enquête, un ✗ n’est pas forcément une erreur : c’est peut-être le menteur.</p>'
      : '<p class="tuto-note">Le bonus se joue après l’accusation. Le rater ne coûte rien.</p>';
    ruleModal = openModal((body, close) => {
      body.innerHTML = `<div class="modal-kicker">Enquête spéciale</div>
        <h2>${esc(k === 'liar' ? 'Un témoin ment' : 'Bonus : l’arme du crime')}</h2>
        ${ruleBoxHTML(k)}${extra}
        <div class="modal-actions"><button type="button" class="btn btn--primary" data-close autofocus>Compris</button></div>`;
      body.querySelector('[data-close]').addEventListener('click', () => { close(); b.focus(); });
    }, { label: TWIST_RULES[k].title });
  });
  cardsEl.addEventListener('keydown', (e) => {
    const card = e.target.closest('[data-card]');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(card.dataset.card, true); }
  });
  pickerEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) select(b.dataset.pick, true);
  });

  // outils
  let eraseHold = null;
  let suppressEraseClick = false;
  tools.erase.addEventListener('pointerdown', (e) => {
    if (tools.erase.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    suppressEraseClick = false;
    tools.erase.classList.add('holding');
    eraseHold = setTimeout(() => {
      eraseHold = null;
      tools.erase.classList.remove('holding');
      suppressEraseClick = true;
      clearAll();
    }, ERASE_HOLD_MS);
  });
  const endEraseHold = () => { clearTimeout(eraseHold); eraseHold = null; tools.erase.classList.remove('holding'); };
  tools.erase.addEventListener('pointerup', endEraseHold);
  tools.erase.addEventListener('pointerleave', endEraseHold);
  tools.erase.addEventListener('pointercancel', endEraseHold);
  tools.erase.addEventListener('contextmenu', (e) => e.preventDefault());

  screen.querySelector('.toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]');
    if (!b || b.disabled) return;
    const t = b.dataset.tool;
    if (t === 'erase' && suppressEraseClick) { suppressEraseClick = false; return; }
    if (gate({ type: 'tool', tool: t, on: (t === 'cross' || t === 'erase') ? mode !== t : undefined }) !== true) return;
    if (t === 'cross' || t === 'erase') play('tap');
    if (t === 'cross') {
      mode = mode === 'cross' ? null : 'cross';
      render();
      setStatus(mode ? 'Mode croix : touchez une case pour y mettre ou retirer une croix.' : 'Mode croix désactivé.');
      emit('mode', { mode });
    } else if (t === 'erase') {
      if (suppressEraseClick) { suppressEraseClick = false; return; }
      mode = mode === 'erase' ? null : 'erase';
      render();
      setStatus(mode ? 'Gomme : touchez une case pour l’effacer. Appui long sur la gomme pour tout effacer.' : 'Gomme désactivée.');
      emit('mode', { mode });
    } else if (t === 'undo') undo();
    else if (t === 'hint') hint();
    else if (t === 'validate') validate();
  });

  // en-tête
  let pop = null;
  function closePop(quiet = false) {
    if (!pop) return;
    if (quiet !== true) play('close');
    pop.remove();
    pop = null;
    $('[data-act="settings"]').setAttribute('aria-expanded', 'false');
  }
  function openPop() {
    pop = document.createElement('div');
    pop.className = 'settings-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Réglages');
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    pop.innerHTML = `<h2>Réglages</h2>
      <label class="switch"><input type="checkbox" role="switch" data-set="oneTap" ${settings.oneTap ? 'checked' : ''}>
        <span>Pose en un toucher<small>Toucher une case pose le personnage ; l’appui long ajoute une note.</small></span></label>
      <label class="switch"><input type="checkbox" role="switch" data-set="sound" ${settings.sound !== false ? 'checked' : ''}>
        <span>Sons<small>Petits bruitages pendant l’enquête.</small></span></label>
      <label class="switch"><input type="checkbox" role="switch" data-set="theme" ${dark ? 'checked' : ''}>
        <span>Mode sombre<small>Fond sombre, plus reposant le soir.</small></span></label>
      ${onHelp ? `<button type="button" class="btn btn--small" data-pop="help">${ICONS.help} Comment jouer</button>` : ''}
      <button type="button" class="btn btn--small btn--ghost" data-pop="clear">${ICONS.erase} Tout effacer</button>`;
    topbar.appendChild(pop);
    play('open');
    $('[data-act="settings"]').setAttribute('aria-expanded', 'true');
    pop.querySelector('input').focus();
    pop.addEventListener('change', (e) => {
      const inp = e.target.closest('[data-set]');
      if (!inp) return;
      const k = inp.dataset.set;
      if (k === 'sound') {
        if (inp.checked) { setSoundEnabled(true); play('toggle'); } else { play('toggle'); setSoundEnabled(false); }
        settings = saveSettings({ sound: inp.checked });
        setStatus(inp.checked ? 'Sons activés.' : 'Sons coupés.');
        return;
      }
      play('toggle');
      if (k === 'theme') {
        const t = inp.checked ? 'dark' : 'light';
        settings = saveSettings({ theme: t });
        applyTheme(t);
        setStatus(inp.checked ? 'Mode sombre activé.' : 'Mode clair activé.');
        return;
      }
      settings = saveSettings({ [k]: inp.checked });
      setStatus(settings.oneTap ? 'Pose en un toucher activée : toucher = poser, appui long = note.' : 'Toucher = note, appui long = poser.');
      emit('settings', { key: k });
    });
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pop]');
      if (!b) return;
      closePop(true);
      if (b.dataset.pop === 'help') onHelp();
      else if (b.dataset.pop === 'clear' && phase === 'play') clearAll();
    });
  }
  topbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'exit') { save(); play('tap'); onExit && onExit(); }
    else if (b.dataset.act === 'settings') { if (pop) closePop(); else openPop(); }
  });
  const onDocDown = (e) => {
    if (pop && !pop.contains(e.target) && !e.target.closest('[data-act="settings"]')) closePop();
  };
  const onDocKey = (e) => {
    if (e.key === 'Escape' && pop) { closePop(); $('[data-act="settings"]').focus(); }
  };
  document.addEventListener('pointerdown', onDocDown);
  document.addEventListener('keydown', onDocKey);

  // chrono
  const onVis = () => { renderTimer(); if (document.hidden) save(); };
  document.addEventListener('visibilitychange', onVis);
  const onUnload = () => save();
  window.addEventListener('pagehide', onUnload);
  let tickCount = 0;
  const timer = setInterval(() => {
    if (phase === 'play' && !document.hidden) {
      st.seconds++;
      if (++tickCount % 5 === 0) save();
    }
    renderTimer();
  }, 1000);

  // ---------- démarrage ----------
  if (guide) {
    guide.attach({
      screen, board, level, people, byId, cardEls, pickEls, tools, topbar, statusEl,
      wide: () => wide.matches,
      state: () => ({ placements: st.placements, notes: st.notes, crosses: st.crosses, selected, mode, phase }),
      settings: () => settings,
      setStatus,
      flashType: (type) => {
        board.el.querySelectorAll('.board-object.flash').forEach((x) => x.classList.remove('flash'));
        const hits = board.el.querySelectorAll(`.board-object[data-type="${type}"]`);
        void board.el.offsetWidth;
        hits.forEach((x) => x.classList.add('flash'));
        setTimeout(() => hits.forEach((x) => x.classList.remove('flash')), 1500);
      },
    });
  }
  render();
  renderTimer();
  if (guide) {
    setStatus('', '', 'idle');
  } else {
    if (resumed) setStatus(`Partie reprise (${formatTime(st.seconds)}). Bonne enquête !`);
    else {
      setStatus(settings.oneTap
        ? 'Choisissez un personnage, puis touchez une case pour l’y poser. Appui long : note au crayon.'
        : 'Choisissez un personnage. Toucher une case = note au crayon ; appui long = poser.', '', 'idle');
    }
    // Enquête spéciale : la règle de la variante s'affiche à chaque ouverture, même en reprise.
    if ((!resumed && (level.intro || rect)) || twistKeys.length) {
      phase = 'intro';
      render();
      renderTimer();
      const start = () => { modal = null; if (phase === 'intro') { phase = 'play'; render(); renderTimer(); } };
      modal = openModal((body, close) => {
        body.innerHTML = `<div class="modal-kicker">${twistKeys.length ? 'Enquête spéciale' : 'Dossier ouvert'}</div>
          <h2>${esc(level.title || 'Enquête')}</h2>
          ${twistKeys.map(ruleBoxHTML).join('')}
          ${rect ? `<p class="intro-rule"><b>Plan allongé (${dimLabel})</b> : au plus une personne par ligne et par colonne.</p>` : ''}
          ${level.intro ? `<p>${esc(level.intro)}</p>` : ''}
          <div class="modal-actions"><button type="button" class="btn btn--primary" data-go autofocus>${resumed ? 'Reprendre l’enquête' : 'Commencer l’enquête'}</button></div>`;
        body.querySelector('[data-go]').addEventListener('click', () => { close(); start(); });
      }, { label: 'Introduction', onCancel: start });
    }
  }

  return {
    destroy() {
      if (destroyed) return;
      save();
      destroyed = true;
      clearInterval(timer);
      cancelPress();
      closePop(true);
      closeLegendModal();
      if (guide) { try { guide.destroy(); } catch { /* rien */ } }
      clearTimeout(statusTimer);
      clearTimeout(statusClear);
      if (modal) { try { modal.close(true); } catch { /* rien */ } modal = null; }
      if (ruleModal && !ruleModal.closed) { try { ruleModal.close(true); } catch { /* rien */ } }
      document.removeEventListener('pointerdown', onDocDown);
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onUnload);
      root.innerHTML = '';
    },
  };
}
