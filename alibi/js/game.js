// Alibi — écran de jeu.
import { prepare, personCluesHTML, checkClue, evaluate, solve, canPlace, OBJECTS } from './engine.js';
import { objectSVG } from './art.js';
import { createBoard, tokenHTML } from './board.js';

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
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 115 1c-.8 1-2.5 1.4-2.5 3"/><path d="M12 17.2v.1"/></svg>',
};

const X_SVG = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

/* ------------------------------------------------------------------ */
/* Fenêtres modales                                                    */
/* ------------------------------------------------------------------ */
/**
 * Ouvre une fenêtre modale. `build(body, close)` remplit le contenu.
 * `onCancel` est appelé quand l'utilisateur ferme par Échap.
 */
export function openModal(build, { label = 'Fenêtre', onCancel, className = '' } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = `modal ${className}`.trim();
  dlg.setAttribute('aria-label', label);
  const body = document.createElement('div');
  body.className = 'modal-body';
  dlg.appendChild(body);
  document.body.appendChild(dlg);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
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
  return `${raw.size}|${(raw.roomMap || []).join('/')}|${people}|${(raw.objects || []).length}`;
}
const key = (r, c) => `${r},${c}`;
const fem = (p, m, f) => (p && p.gender === 'f' ? f : m);

export function mountGame(root, opts = {}) {
  const { level: raw, onExit, onSolved, onNext, onHelp, persist = true, exitLabel = 'Retour' } = opts;
  const level = prepare(raw);
  const n = level.size;
  const people = level.people || [];
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const roomsByKey = Object.fromEntries((level.rooms || []).map((r) => [r.key, r]));
  const saveKey = `alibi:save:${raw.id || 'sans-id'}`;
  const sig = signature(raw);

  let settings = loadSettings();
  let st = { placements: {}, notes: {}, crosses: {}, seconds: 0, hints: 0, errors: 0 };
  let history = [];
  let selected = people.length ? people[0].id : null;
  let mode = null; // null | 'cross' | 'erase'
  let phase = 'play'; // 'intro' | 'play' | 'accuse' | 'won'
  let wrong = new Map(); // id -> Set(indices d'indices fautifs) ; -1 = phrase de la victime
  let hintWrong = null;
  let justPlaced = null;
  let solution;
  let modal = null;
  let destroyed = false;
  let lastPointerType = 'mouse';

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
      if (!byId[id] || !Array.isArray(p) || p[0] >= n || p[1] >= n) delete st.placements[id];
    }
    history = Array.isArray(saved.history) ? saved.history.slice(-80) : [];
    if (saved.selected && byId[saved.selected]) selected = saved.selected;
    resumed = true;
  }

  // ---------- DOM ----------
  root.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen game';
  const diff = DIFF_LABEL[level.difficulty] || '';
  screen.innerHTML = `
    <header class="topbar">
      <button type="button" class="icon-btn" data-act="exit" aria-label="${esc(exitLabel)}">${ICONS.back}</button>
      <div class="title"><h1>${esc(level.title || 'Enquête')}</h1>
        <span class="sub">${esc([diff, `${n}×${n}`, `${people.length} personnes`].filter(Boolean).join(' · '))}</span></div>
      <span class="timer" role="timer" aria-label="Temps écoulé">0:00</span>
      <button type="button" class="icon-btn" data-act="settings" aria-label="Réglages" aria-expanded="false">${ICONS.gear}</button>
    </header>
    <main class="game-main">
      <section class="game-board-col" aria-label="Plan">
        <div class="board-wrap"></div>
        <div class="picker" role="group" aria-label="Choisir un personnage"></div>
        <p class="status" role="status" aria-live="polite"></p>
      </section>
      <section class="game-side" aria-label="Dossier">
        <details class="legend" data-legend hidden>
          <summary>Légende du plan</summary>
          <div class="legend-body"></div>
        </details>
        <div class="cards-scroll">
          <div class="dossier-head"><h2>Témoignages</h2><span class="meta"></span></div>
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
  const cardsEl = $('.cards');
  const pickerEl = $('.picker');
  const metaEl = $('.dossier-head .meta');
  const topbar = $('.topbar');
  const tools = Object.fromEntries([...screen.querySelectorAll('[data-tool]')].map((b) => [b.dataset.tool, b]));

  const board = createBoard(level);
  $('.board-wrap').appendChild(board.el);
  board.el.classList.add('board--play');

  // légende des objets (construite une seule fois : le rendu ne la touche pas)
  (function buildLegend() {
    const det = $('[data-legend]');
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
    $('.legend-body').innerHTML = group(true, 'On peut s\'y placer') + group(false, 'Bloque la case');
    det.hidden = false;
    det.open = settings.legendOpen !== false;
    det.addEventListener('toggle', () => {
      if (det.open !== (settings.legendOpen !== false)) settings = saveSettings({ legendOpen: det.open });
    });
    let flashTimer = null;
    det.addEventListener('click', (e) => {
      const b = e.target.closest('.legend-chip');
      if (!b) return;
      board.el.querySelectorAll('.board-object.flash').forEach((x) => x.classList.remove('flash'));
      const hits = board.el.querySelectorAll(`.board-object[data-type="${b.dataset.type}"]`);
      void board.el.offsetWidth;
      hits.forEach((x) => x.classList.add('flash'));
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => hits.forEach((x) => x.classList.remove('flash')), 1500);
    });
  })();

  // jetons (HTML mis en cache)
  const tokenCache = {};
  const tok = (id) => (tokenCache[id] ||= tokenHTML(byId[id], { size: 64 }));

  // picker
  pickerEl.innerHTML = people.map((p) => `<button type="button" class="pick" data-pick="${esc(p.id)}" aria-pressed="false" aria-label="Choisir ${esc(p.name)}${p.victim ? ' (victime)' : ''}">${tokenHTML(p, { size: 40 })}</button>`).join('');

  // fiches
  const clueHTML = {};
  const clueOffset = {};
  cardsEl.innerHTML = people.map((p) => {
    const lines = personCluesHTML(level, p) || [];
    clueHTML[p.id] = lines;
    clueOffset[p.id] = lines.length - ((p.clues || []).length);
    return `<div class="card${p.victim ? ' victim' : ''}" role="button" tabindex="0" aria-pressed="false" data-card="${esc(p.id)}" aria-label="Fiche de ${esc(p.name)}${p.victim ? ', victime' : ''}">
      <div class="card-face">${tokenHTML(p, { size: 64 })}</div>
      <div class="card-name"><strong>${esc(p.name)}</strong><span class="placed-tag"></span></div>
      <ul>${lines.map((h, i) => `<li data-i="${i}">${h}</li>`).join('')}</ul>
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
  function setStatus(text, tone = '') {
    statusEl.textContent = text;
    if (tone) statusEl.dataset.tone = tone; else delete statusEl.dataset.tone;
  }
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
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
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
            html += `<span class="notes">${notes.map((nid) => `<span class="note${nid === selected ? ' sel' : ''}">${esc(nid)}</span>`).join('')}</span>`;
          }
        }
        if (layer.innerHTML !== html) layer.innerHTML = html;
        const label = id ? `${byId[id].name}` : (st.crosses[k] ? 'croix' : '');
        cell.dataset.state = label;
      }
    }
    justPlaced = null;

    // fiches + picker
    const placedCount = Object.keys(st.placements).length;
    const complete = placedCount === people.length && people.length > 0;
    let victimState = null;
    try { const v = evaluate(level, st.placements).victimOk; victimState = v === true || v === false ? v : null; } catch { victimState = null; }
    for (const p of people) {
      const card = cardEls[p.id];
      const isSel = p.id === selected;
      card.setAttribute('aria-pressed', String(isSel));
      pickEls[p.id].setAttribute('aria-pressed', String(isSel));
      const pl = st.placements[p.id];
      pickEls[p.id].classList.toggle('placed', !!pl);
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
    metaEl.textContent = `${placedCount}/${people.length} posés`;

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
    selected = id;
    render();
    if (announce) {
      const p = byId[id];
      const pl = st.placements[id];
      setStatus(pl ? `${p.name} est sélectionné${fem(p, '', 'e')} (${where(pl[0], pl[1])}).` : `${p.name} est sélectionné${fem(p, '', 'e')}. Appui long sur une case pour l'y poser.`);
    }
  }

  function refuse(r, c, msg = 'Cette case est occupée par un objet : personne ne peut s’y tenir.') {
    const cell = board.cells[r][c];
    cell.classList.remove('shake');
    void cell.offsetWidth;
    cell.classList.add('shake');
    setTimeout(() => cell.classList.remove('shake'), 350);
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
    if (!selected) { setStatus('Choisissez d’abord un personnage.'); return; }
    const k = key(r, c);
    const p = byId[selected];
    commit(() => {
      const list = (st.notes[k] || []).slice();
      const i = list.indexOf(selected);
      if (i >= 0) list.splice(i, 1); else { list.push(selected); list.sort(); }
      if (list.length) st.notes[k] = list; else delete st.notes[k];
    });
    setStatus(`Note : ${p.name} peut-être ${where(r, c)}.`);
  }

  function toggleCross(r, c) {
    if (isBlocked(r, c)) return refuse(r, c);
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (occupant) { select(occupant, true); return; }
    commit(() => { if (st.crosses[k]) delete st.crosses[k]; else st.crosses[k] = true; });
    setStatus(st.crosses[k] ? `Croix posée ${where(r, c)}.` : 'Croix retirée.');
  }

  function eraseCell(r, c) {
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (!occupant && !st.crosses[k] && !(st.notes[k] && st.notes[k].length)) return;
    commit(() => {
      if (occupant) delete st.placements[occupant];
      delete st.crosses[k];
      delete st.notes[k];
    });
    setStatus(occupant ? `${byId[occupant].name} retiré${fem(byId[occupant], '', 'e')} du plan.` : 'Case effacée.');
  }

  function placeAt(r, c, id = selected, { silent = false } = {}) {
    if (isBlocked(r, c)) return refuse(r, c);
    if (!id) { setStatus('Choisissez d’abord un personnage.'); return; }
    const k = key(r, c);
    const occupant = whoAtMap()[k];
    if (occupant === id) { select(id, true); return; }
    const p = byId[id];
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
    if (Object.keys(st.placements).length === people.length) {
      if (!silent) setStatus('Tout le monde est sur le plan. Vérifiez les fiches, puis validez.', 'ok');
    }
  }

  function shortAction(r, c) {
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
    restore(history.pop());
    wrong = new Map();
    hintWrong = null;
    render();
    save();
    setStatus('Dernière action annulée.');
  }

  async function clearAll() {
    const ok = await confirmDialog({
      kicker: 'Gomme', title: 'Tout effacer ?',
      text: 'Les poses, les notes et les croix seront retirées du plan. Le chrono continue.',
      ok: 'Tout effacer', danger: true,
    });
    if (!ok || destroyed) return;
    commit(() => { st.placements = {}; st.notes = {}; st.crosses = {}; });
    mode = null;
    render();
    setStatus('Plan remis à zéro.');
  }

  function getSolution() {
    if (solution === undefined) {
      try { solution = (solve(level, { max: 1 }) || [])[0] || null; } catch { solution = null; }
    }
    return solution;
  }

  function hint() {
    if (phase !== 'play') return;
    const sol = getSolution();
    if (!sol) { setStatus('Impossible de calculer un indice pour ce niveau.', 'error'); return; }
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
      setStatus(`Indice : ${p.name} n’est pas à sa place.${misplaced.length > 1 ? ' Et ce n’est pas la seule erreur.' : ''}`, 'hint');
      return;
    }
    let target = selected && !st.placements[selected] ? selected : null;
    if (!target) { const f = people.find((p) => !st.placements[p.id]); target = f ? f.id : null; }
    if (!target) { setStatus('Tout le monde est déjà à sa place : il ne reste qu’à valider !', 'ok'); return; }
    const [r, c] = sol[target];
    st.hints++;
    placeAt(r, c, target, { silent: true });
    const p = byId[target];
    setStatus(`Indice : ${p.name} se trouvait ${where(r, c)}.`, 'hint');
  }

  function validate() {
    if (phase !== 'play') return;
    if (Object.keys(st.placements).length !== people.length) return;
    let ev;
    try { ev = evaluate(level, st.placements); } catch (err) { console.warn(err); setStatus('Vérification impossible.', 'error'); return; }
    if (ev.ok) {
      phase = 'accuse';
      render();
      renderTimer();
      openAccuse(ev);
      return;
    }
    st.errors++;
    wrong = new Map();
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
    setStatus(`Pas encore… ${parts.join(' ')}`, 'error');
    const first = [...wrong.keys()][0];
    if (first && cardEls[first]) cardEls[first].scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function openAccuse(ev) {
    const suspects = people.filter((p) => !p.victim);
    const victim = people.find((p) => p.victim);
    modal = openModal((body, close) => {
      body.innerHTML = `<div class="modal-kicker">Plan reconstitué</div>
        <h2>Qui est le coupable ?</h2>
        <p>Votre plan tient debout : chaque témoignage est respecté.${victim ? ` Qui se trouvait seul à seul avec ${esc(victim.name)} ?` : ' Désignez le coupable.'}</p>
        <div class="suspects">${suspects.map((p) => `<button type="button" class="suspect" data-s="${esc(p.id)}">${tokenHTML(p, { size: 64 })}<span>${esc(p.name)}</span></button>`).join('')}</div>
        <p class="accuse-msg" role="status" aria-live="polite"></p>
        <div class="modal-actions"><button type="button" class="btn btn--ghost" data-back>Revenir au plan</button></div>`;
      const msg = body.querySelector('.accuse-msg');
      body.addEventListener('click', (e) => {
        if (e.target.closest('[data-back]')) { close(); backToPlay(); return; }
        const b = e.target.closest('[data-s]');
        if (!b || b.classList.contains('nope')) return;
        const id = b.dataset.s;
        if (id === ev.murderer) { close(); win(id); return; }
        st.errors++;
        save();
        b.classList.add('nope');
        b.disabled = true;
        const p = byId[id];
        msg.textContent = `Mauvaise piste : ${p.name} n’était pas seul${fem(p, '', 'e')} avec la victime. Erreurs : ${st.errors}.`;
        msg.style.color = 'var(--accent)';
      });
    }, { label: 'Qui est le coupable ?', onCancel: backToPlay });
  }
  function backToPlay() {
    modal = null;
    if (phase === 'accuse') { phase = 'play'; render(); renderTimer(); }
  }

  function win(murdererId) {
    phase = 'won';
    if (persist) removeKey(saveKey);
    render();
    renderTimer();
    const result = { seconds: st.seconds, hints: st.hints, errors: st.errors };
    let extra = null;
    try { extra = onSolved ? onSolved(result) : null; } catch (err) { console.warn(err); }
    const m = byId[murdererId];
    setStatus(`Affaire classée : ${m.name} était ${fem(m, 'le meurtrier', 'la meurtrière')}.`, 'ok');
    modal = openModal((body, close) => {
      body.innerHTML = `<div class="modal-kicker">Affaire classée</div>
        <h2>${esc(level.title || 'Enquête')} : résolu !</h2>
        <div class="win-reveal">${tokenHTML(m, { size: 96 })}
          <div><span class="stamp">Coupable</span><p style="margin:.4em 0 0"><strong>${esc(m.name)}</strong> était ${fem(m, 'le meurtrier', 'la meurtrière')}.</p></div></div>
        <dl class="win-stats">
          <div><dt>Temps</dt><dd>${formatTime(st.seconds)}</dd></div>
          <div><dt>Indices</dt><dd>${st.hints}</dd></div>
          <div><dt>Erreurs</dt><dd>${st.errors}</dd></div>
        </dl>
        ${extra && extra.record ? '<p class="win-record">Nouveau record personnel !</p>' : ''}
        <div class="modal-actions">
          <button type="button" class="btn btn--ghost" data-w="plan">Voir le plan</button>
          <button type="button" class="btn" data-w="home">${esc(exitLabel)}</button>
          ${onNext ? '<button type="button" class="btn btn--accent" data-w="next" autofocus>Niveau suivant</button>' : ''}
        </div>`;
      body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-w]');
        if (!b) return;
        close();
        modal = null;
        if (b.dataset.w === 'home') onExit && onExit();
        else if (b.dataset.w === 'next') onNext && onNext();
      });
    }, { label: 'Victoire', onCancel: () => { modal = null; } });
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
      const nr = Math.min(n - 1, Math.max(0, r + dr));
      const nc = Math.min(n - 1, Math.max(0, c + dc));
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
  cardsEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-card]');
    if (card) select(card.dataset.card, true);
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
    if (t === 'cross') {
      mode = mode === 'cross' ? null : 'cross';
      render();
      setStatus(mode ? 'Mode croix : touchez une case pour y mettre ou retirer une croix.' : 'Mode croix désactivé.');
    } else if (t === 'erase') {
      if (suppressEraseClick) { suppressEraseClick = false; return; }
      mode = mode === 'erase' ? null : 'erase';
      render();
      setStatus(mode ? 'Gomme : touchez une case pour l’effacer. Appui long sur la gomme pour tout effacer.' : 'Gomme désactivée.');
    } else if (t === 'undo') undo();
    else if (t === 'hint') hint();
    else if (t === 'validate') validate();
  });

  // en-tête
  let pop = null;
  function closePop() {
    if (!pop) return;
    pop.remove();
    pop = null;
    $('[data-act="settings"]').setAttribute('aria-expanded', 'false');
  }
  function openPop() {
    pop = document.createElement('div');
    pop.className = 'settings-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Réglages');
    pop.innerHTML = `<h2>Réglages</h2>
      <label class="switch"><input type="checkbox" data-set="oneTap" ${settings.oneTap ? 'checked' : ''}>
        <span>Pose en un toucher<small>Toucher une case pose le personnage ; l’appui long ajoute une note.</small></span></label>
      ${onHelp ? `<button type="button" class="btn btn--small" data-pop="help">${ICONS.help} Comment jouer</button>` : ''}
      <button type="button" class="btn btn--small btn--ghost" data-pop="clear">${ICONS.erase} Tout effacer</button>`;
    topbar.appendChild(pop);
    $('[data-act="settings"]').setAttribute('aria-expanded', 'true');
    pop.querySelector('input').focus();
    pop.addEventListener('change', (e) => {
      const inp = e.target.closest('[data-set]');
      if (!inp) return;
      settings = saveSettings({ [inp.dataset.set]: inp.checked });
      setStatus(settings.oneTap ? 'Pose en un toucher activée : toucher = poser, appui long = note.' : 'Toucher = note, appui long = poser.');
    });
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pop]');
      if (!b) return;
      closePop();
      if (b.dataset.pop === 'help') onHelp();
      else if (b.dataset.pop === 'clear' && phase === 'play') clearAll();
    });
  }
  topbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'exit') { save(); onExit && onExit(); }
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
  render();
  renderTimer();
  if (resumed) {
    setStatus(`Partie reprise (${formatTime(st.seconds)}). Bonne enquête !`);
  } else {
    setStatus(settings.oneTap
      ? 'Choisissez un personnage, puis touchez une case pour l’y poser. Appui long : note au crayon.'
      : 'Choisissez un personnage. Toucher une case = note au crayon ; appui long = poser.');
    if (level.intro) {
      phase = 'intro';
      render();
      renderTimer();
      const start = () => { modal = null; if (phase === 'intro') { phase = 'play'; render(); renderTimer(); } };
      modal = openModal((body, close) => {
        body.innerHTML = `<div class="modal-kicker">Dossier ouvert</div>
          <h2>${esc(level.title || 'Enquête')}</h2>
          <p>${esc(level.intro)}</p>
          <div class="modal-actions"><button type="button" class="btn btn--primary" data-go autofocus>Commencer l’enquête</button></div>`;
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
      closePop();
      if (modal) { try { modal.close(); } catch { /* rien */ } modal = null; }
      document.removeEventListener('pointerdown', onDocDown);
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onUnload);
      root.innerHTML = '';
    },
  };
}
