// Alibi — éditeur de niveaux.
// mountEditor(root, { level, onTest, onExit }) → { destroy() }
import {
  OBJECTS, CLUE_TYPES, FLOORS, prepare, canPlace, clueHTML, personCluesHTML,
  checkClue, solve, generateClues, validateLevel,
} from './engine.js';
// Espace de noms : lit sans erreur les exports qui n'existent pas encore (OBJECT_SIZES, nouveau moteur).
import * as ENGINE from './engine.js';
import { objectSVG, floorCSS, avatarSVG, LOOK_OPTIONS } from './art.js';
import { createBoard, tokenHTML } from './board.js';

/* ------------------------------------------------------------------ utilitaires */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = (f, d = null) => { try { return f(); } catch (e) { return d; } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const FLOOR_NAMES = {
  grass: 'Herbe', wood: 'Bois', parquet: 'Parquet', tile: 'Carrelage', stone: 'Pierre', carpet: 'Moquette',
  sand: 'Sable', snow: 'Neige', concrete: 'Béton', deck: 'Terrasse', marble: 'Marbre', gravel: 'Gravier',
};
const ACCESSORIES = ['none', 'glasses', 'hat', 'cap', 'beard', 'moustache', 'earrings', 'scarf', 'bow'];
const ACC_NAMES = {
  none: 'Aucun', glasses: 'Lunettes', hat: 'Chapeau', cap: 'Casquette', beard: 'Barbe', moustache: 'Moustache',
  earrings: "Boucles d'oreilles", scarf: 'Écharpe', bow: 'Nœud',
};
const LOOK_FIELDS = [['skin', 'Teint'], ['hair', 'Coiffure'], ['hairColor', 'Cheveux'], ['accessory', 'Accessoire'], ['bg', 'Fond']];
const SIZES = {
  sofa: [[2, 1], [1, 2]], bench: [[2, 1], [1, 2]], bed: [[1, 1], [1, 2]], rug: [[1, 1], [2, 1], [1, 2], [2, 2]],
  boat: [[1, 1], [2, 1]], car: [[2, 1]], stage: [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [3, 2]],
};
// Tailles autorisées : celles du moteur quand il les exporte (absent = 1×1 seul), sinon la table ci-dessus.
const sizesOf = (t) => {
  const table = ENGINE.OBJECT_SIZES && typeof ENGINE.OBJECT_SIZES === 'object' ? ENGINE.OBJECT_SIZES : SIZES;
  const list = table[t];
  return Array.isArray(list) && list.length ? list : [[1, 1]];
};
// Dimensions : lignes 4 à 12, colonnes 4 à 9 ; personnages = min(lignes, colonnes).
const ROWS_MIN = 4, ROWS_MAX = 12, COLS_MIN = 4, COLS_MAX = 9;
const clampInt = (v, lo, hi, d) => { const n = Number(v) | 0; return n ? Math.min(hi, Math.max(lo, n)) : d; };
const SQUARE_SIZES = [5, 6, 7, 8, 9];
const FORMATS = [['Bus', 4, 9], ['Avion', 6, 9], ['Bateau', 9, 6], ['Fusée', 12, 5]];
const NAME_POOL = [
  ['Agathe', 'f'], ['Bruno', 'm'], ['Clara', 'f'], ['Damien', 'm'], ['Emma', 'f'], ['Félix', 'm'], ['Gaëlle', 'f'],
  ['Hugo', 'm'], ['Inès', 'f'], ['Jules', 'm'], ['Karim', 'm'], ['Léa', 'f'], ['Marc', 'm'], ['Nora', 'f'],
  ['Oscar', 'm'], ['Paul', 'm'], ['Quentin', 'm'], ['Rita', 'f'], ['Sacha', 'm'], ['Théo', 'm'], ['Ursule', 'f'],
  ['Victor', 'm'], ['Wanda', 'f'], ['Xavier', 'm'], ['Yvonne', 'f'], ['Zoé', 'f'],
];
const DIRS = [['N', 'Nord'], ['S', 'Sud'], ['E', 'Est'], ['W', 'Ouest']];
const FALLBACK_CLUES = [
  { t: 'room', label: 'Dans une pièce' }, { t: 'on', label: 'Sur un objet' }, { t: 'beside', label: 'À côté d’un objet' },
  { t: 'besidePerson', label: 'À côté d’une personne' }, { t: 'with', label: 'Avec une personne' }, { t: 'alone', label: 'Seul(e)' },
  { t: 'dir', label: 'Position (N/S/E/O)' }, { t: 'sameRow', label: 'Même ligne qu’un objet' }, { t: 'sameCol', label: 'Même colonne qu’un objet' },
];
const clueTypes = () => (Array.isArray(CLUE_TYPES) && CLUE_TYPES.length ? CLUE_TYPES : FALLBACK_CLUES).map((x) => ({ t: x.t, label: x.label || x.t }));
const TABS = [['general', 'Général'], ['rooms', 'Pièces'], ['objects', 'Objets'], ['people', 'Personnages'], ['clues', 'Indices'], ['file', 'Fichier']];
const DRAFT_KEY = 'alibi:editdraft';

const initialOf = (name) => {
  const ch = String(name || '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '')[0];
  const up = ch ? ch.toUpperCase() : '';
  return /^[A-Z]$/.test(up) ? up : '';
};
const lookCount = (k) => {
  const o = LOOK_OPTIONS || {};
  if (k === 'accessory') return Array.isArray(o.accessory) && o.accessory.length ? o.accessory : ACCESSORIES;
  const v = o[k];
  return Array.isArray(v) ? v.length : (Number(v) || 1);
};
const randomLook = () => {
  const acc = lookCount('accessory');
  return {
    skin: Math.floor(Math.random() * lookCount('skin')), hair: Math.floor(Math.random() * lookCount('hair')),
    hairColor: Math.floor(Math.random() * lookCount('hairColor')), accessory: pick(acc), bg: Math.floor(Math.random() * lookCount('bg')),
  };
};

/* ------------------------------------------------------------------ niveau par défaut / import */
function newPersonFor(people) {
  const used = new Set(people.map((p) => p.id));
  const [name, gender] = NAME_POOL.find(([n]) => !used.has(initialOf(n))) || ['Zoé', 'f'];
  return { id: initialOf(name), name, gender, look: randomLook(), clues: [] };
}

function defaultState() {
  const grid = Array.from({ length: 6 }, () => ['a', 'a', 'a', 'b', 'b', 'b']);
  const names = ['Agathe', 'Bruno', 'Clara', 'Damien', 'Emma', 'Victor'];
  const people = names.map((n) => {
    const g = NAME_POOL.find(([x]) => x === n)[1];
    return { id: initialOf(n), name: n, gender: g, look: randomLook(), clues: [], ...(n === 'Victor' ? { victim: true } : {}) };
  });
  return {
    id: null, title: 'Nouvelle enquête', intro: '', difficulty: 1, rows: 6, cols: 6,
    rooms: [{ key: 'a', name: 'Salon', floor: 'wood' }, { key: 'b', name: 'Jardin', floor: 'grass' }],
    grid,
    objects: [
      { type: 'sofa', r: 1, c: 0, w: 2, h: 1 }, { type: 'table', r: 3, c: 1, w: 1, h: 1 }, { type: 'armchair', r: 4, c: 0, w: 1, h: 1 },
      { type: 'tree', r: 0, c: 5, w: 1, h: 1 }, { type: 'bench', r: 4, c: 4, w: 2, h: 1 }, { type: 'bush', r: 2, c: 4, w: 1, h: 1 },
    ],
    people, solution: {},
  };
}

function fromRaw(raw) {
  const rows = clampInt(raw.rows ?? raw.size, ROWS_MIN, ROWS_MAX, 6);
  const cols = clampInt(raw.cols ?? raw.size, COLS_MIN, COLS_MAX, 6);
  const rooms = (Array.isArray(raw.rooms) ? raw.rooms : []).map((r) => ({ key: String(r.key || 'a')[0], name: String(r.name || ''), floor: r.floor || 'wood' }));
  if (!rooms.length) rooms.push({ key: 'a', name: 'Pièce', floor: 'wood' });
  const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
    const ch = String((raw.roomMap || [])[r] || '')[c];
    return rooms.some((x) => x.key === ch) ? ch : rooms[0].key;
  }));
  const objects = (Array.isArray(raw.objects) ? raw.objects : []).map((o) => ({ type: o.type, r: o.r | 0, c: o.c | 0, w: o.w || 1, h: o.h || 1 }));
  const people = (Array.isArray(raw.people) ? raw.people : []).map((p) => ({
    id: p.id, name: p.name || p.id, gender: p.gender === 'm' ? 'm' : 'f', look: p.look ? clone(p.look) : randomLook(),
    clues: clone(p.clues || []), ...(p.victim ? { victim: true } : {}),
  }));
  const ids = new Set(people.map((p) => p.id));
  const solution = {};
  Object.entries(raw.solution || {}).forEach(([id, rc]) => {
    if (ids.has(id) && Array.isArray(rc) && rc[0] >= 0 && rc[0] < rows && rc[1] >= 0 && rc[1] < cols) solution[id] = [rc[0] | 0, rc[1] | 0];
  });
  return {
    id: typeof raw.id === 'string' && raw.id.startsWith('perso-') ? raw.id : null,
    title: String(raw.title || ''), intro: String(raw.intro || ''), difficulty: Math.min(3, Math.max(1, Number(raw.difficulty) | 0 || 1)),
    rows, cols, rooms, grid, objects, people, solution,
  };
}

/* ------------------------------------------------------------------ éditeur */
export function mountEditor(root, { level = null, onTest, onExit } = {}) {
  let destroyed = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!destroyed) fn(); }, ms); timers.add(t); return t; };

  /* ---- état ---- */
  const S = Object.assign(defaultState(), {
    tab: 'general', sub: 'fiches', brush: 'a', objTool: { type: 'chair', w: 1, h: 1 }, objMode: 'put', who: null, unplace: false,
    clueWho: null, openLook: -1, jsonText: '', fileMsgs: [], diag: { status: 'pending' }, savedSnap: '', prep: null, focusCell: null,
  });
  let board = null;
  let drag = null;
  let diagTimer = null;
  let toastTimer = null;

  function load(st, { clean = true } = {}) {
    Object.assign(S, st);
    S.brush = S.rooms[0].key;
    S.who = S.people[0]?.id || null;
    S.clueWho = S.people[0]?.id || null;
    S.objTool = { type: 'chair', w: 1, h: 1 };
    S.objMode = 'put'; S.unplace = false; S.openLook = -1; S.fileMsgs = [];
    if (clean) S.savedSnap = snapshot();
  }

  // Reprise après un test (le brouillon est consommé une seule fois).
  let draft = null;
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    sessionStorage.removeItem(DRAFT_KEY);
    if (d && d.returning) draft = d;
  } catch (e) { /* ignore */ }

  /* ---- sortie du niveau ---- */
  const placedList = () => S.people.filter((p) => S.solution[p.id]);
  const count = () => Math.min(S.rows, S.cols);
  const dimLabel = (r = S.rows, c = S.cols) => `${r}×${c}`;
  function solutionInfo() {
    const rows = {}; const cols = {}; const conflicts = []; const bad = new Set();
    const placed = placedList();
    placed.forEach((p) => {
      const [r, c] = S.solution[p.id];
      (rows[r] = rows[r] || []).push(p); (cols[c] = cols[c] || []).push(p);
    });
    Object.entries(rows).forEach(([r, ps]) => { if (ps.length > 1) { conflicts.push(`Ligne ${+r + 1} : ${ps.map((p) => p.name).join(', ')}`); ps.forEach((p) => bad.add(p.id)); } });
    Object.entries(cols).forEach(([c, ps]) => { if (ps.length > 1) { conflicts.push(`Colonne ${+c + 1} : ${ps.map((p) => p.name).join(', ')}`); ps.forEach((p) => bad.add(p.id)); } });
    placed.forEach((p) => {
      const [r, c] = S.solution[p.id];
      if (S.prep && !canPlace(S.prep, r, c)) { conflicts.push(`${p.name} est sur une case bloquée`); bad.add(p.id); }
    });
    return { placed, complete: placed.length === count(), conflicts, bad, ok: placed.length === count() && !conflicts.length };
  }

  function toRaw({ forCheck = false, noClues = false } = {}) {
    const o = {
      id: S.id || 'perso-brouillon', title: S.title.trim() || 'Sans titre', difficulty: S.difficulty,
      // Carré : `size` comme avant ; rectangle : `rows` et `cols`, sans `size`.
      ...(S.rows === S.cols ? { size: S.rows } : { rows: S.rows, cols: S.cols }),
      rooms: S.rooms.map((r) => ({ key: r.key, name: r.name, floor: r.floor })),
      roomMap: S.grid.map((r) => r.join('')),
      objects: S.objects.map((b) => (b.w > 1 || b.h > 1 ? { type: b.type, r: b.r, c: b.c, w: b.w, h: b.h } : { type: b.type, r: b.r, c: b.c })),
      people: S.people.map((p) => ({
        id: p.id, name: p.name.trim(), gender: p.gender, look: clone(p.look), ...(p.victim ? { victim: true } : {}),
        clues: noClues ? [] : clone(p.clues),
      })),
    };
    if (S.intro.trim()) o.intro = S.intro.trim();
    const placed = placedList();
    if (placed.length && (!forCheck || solutionInfo().ok)) {
      o.solution = {};
      placed.forEach((p) => { o.solution[p.id] = [...S.solution[p.id]]; });
    }
    return o;
  }
  const snapshot = () => JSON.stringify(toRaw());
  const isDirty = () => snapshot() !== S.savedSnap;

  /* ---- squelette DOM ---- */
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'ed-root';
  el.innerHTML = `
    <header class="ed-top">
      <button type="button" class="ed-btn" data-top="quit">← Quitter</button>
      <h1 class="ed-h1">Éditeur de niveaux</h1>
      <span class="ed-dirty" aria-live="polite"></span>
      <span class="ed-top-actions">
        <button type="button" class="ed-btn" data-top="save">Enregistrer</button>
        <button type="button" class="ed-btn ed-primary" data-top="test">Tester</button>
      </span>
    </header>
    <section class="ed-boardcol" aria-label="Plateau">
      <p class="ed-hint" aria-live="polite"></p>
      <div class="ed-board-host" data-tool="none"></div>
      <div class="ed-toast" role="status" aria-live="polite"></div>
      <div class="ed-diag" role="status" aria-live="polite"></div>
    </section>
    <section class="ed-panel" aria-label="Réglages du niveau">
      <div class="ed-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" class="ed-tab" id="ed-tab-${k}" data-act="tab" data-t="${k}" aria-controls="ed-tabpanel">${l}</button>`).join('')}</div>
      <div class="ed-tabpanel" id="ed-tabpanel" role="tabpanel"></div>
    </section>`;
  root.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const host = $('.ed-board-host');
  const hint = $('.ed-hint');
  const toast = $('.ed-toast');
  const diagEl = $('.ed-diag');
  const panel = $('.ed-tabpanel');

  /* ---- messages & dialogue ---- */
  function say(text, kind = 'info') {
    toast.textContent = text;
    toast.className = `ed-toast ed-toast-${kind} ${text ? 'on' : ''}`;
    clearTimeout(toastTimer);
    if (text) toastTimer = later(() => { toast.textContent = ''; toast.className = 'ed-toast'; }, kind === 'err' ? 6000 : 3500);
  }
  function ask(message, { ok = 'Continuer', cancel = 'Annuler' } = {}) {
    return new Promise((resolve) => {
      if (typeof HTMLDialogElement === 'undefined') { resolve(window.confirm(message)); return; }
      const d = document.createElement('dialog');
      d.className = 'ed-dialog';
      d.innerHTML = `<form method="dialog"><p class="ed-dialog-msg">${esc(message)}</p><div class="ed-row ed-row-end"><button type="submit" value="no" class="ed-btn">${esc(cancel)}</button><button type="submit" value="yes" class="ed-btn ed-primary">${esc(ok)}</button></div></form>`;
      el.appendChild(d);
      d.addEventListener('close', () => { const yes = d.returnValue === 'yes'; d.remove(); resolve(yes); });
      d.showModal();
    });
  }

  /* ---- outils selon l'onglet ---- */
  function currentTool() {
    switch (S.tab) {
      case 'rooms': return 'paint';
      case 'objects': return S.objMode === 'erase' ? 'erase' : 'obj';
      case 'people': return S.sub === 'sol' ? (S.unplace ? 'unplace' : 'place') : 'none';
      default: return 'none';
    }
  }
  const roomOf = (key) => S.rooms.find((r) => r.key === key);
  const objLabel = (t) => cap(OBJECTS[t]?.n || t);
  function updateHint() {
    const t = currentTool();
    host.dataset.tool = t;
    let h = 'Choisissez un outil dans les onglets Pièces, Objets ou Personnages pour modifier le plateau.';
    if (t === 'paint') h = `Pinceau : <b>${esc(roomOf(S.brush)?.name || '')}</b>. Touchez ou glissez sur les cases.`;
    if (t === 'obj') h = `Pose : <b>${esc(objLabel(S.objTool.type))} ${S.objTool.w}×${S.objTool.h}</b>. Touchez la case en haut à gauche.`;
    if (t === 'erase') h = 'Gomme : touchez un objet pour le retirer.';
    if (t === 'place') h = S.who ? `Solution : placez <b>${esc(S.people.find((p) => p.id === S.who)?.name || '')}</b> en touchant une case.` : 'Solution : choisissez un personnage.';
    if (t === 'unplace') h = 'Gomme : touchez un personnage pour le retirer de la solution.';
    hint.innerHTML = h;
  }

  /* ---- plateau ---- */
  function objectsAt(r, c) { return S.objects.filter((o) => r >= o.r && r < o.r + o.h && c >= o.c && c < o.c + o.w); }
  const personAt = (r, c) => S.people.find((p) => S.solution[p.id] && S.solution[p.id][0] === r && S.solution[p.id][1] === c);

  function refreshBoard() {
    const raw = toRaw();
    S.prep = safe(() => prepare(raw), null);
    board = createBoard(S.prep || raw);
    host.replaceChildren(board.el);
    host.style.setProperty('--rows', String(S.rows));
    host.style.setProperty('--cols', String(S.cols));
    const info = solutionInfo();
    for (let r = 0; r < S.rows; r += 1) {
      for (let c = 0; c < S.cols; c += 1) {
        const cell = board.cells[r][c];
        const p = personAt(r, c);
        const layer = cell.querySelector('.cell-layer');
        if (p && layer) {
          layer.innerHTML = `<span class="ed-tok${p.victim ? ' ed-tok-victim' : ''}${info.bad.has(p.id) ? ' ed-tok-bad' : ''}">${tokenHTML(p)}</span>`;
        }
        const objs = objectsAt(r, c).map((o) => objLabel(o.type)).join(', ');
        cell.setAttribute('aria-label', `Ligne ${r + 1}, colonne ${c + 1}, ${roomOf(S.grid[r][c])?.name || ''}${objs ? `, ${objs}` : ''}${p ? `, ${p.name}${p.victim ? ' (victime)' : ''}` : ''}`);
      }
    }
    if (S.focusCell) { board.cells[S.focusCell.r]?.[S.focusCell.c]?.focus(); S.focusCell = null; }
    updateHint();
  }

  function changed({ panel: rp = true } = {}) {
    refreshBoard();
    scheduleDiag();
    updateDirty();
    if (rp) renderPanel();
  }
  function updateDirty() { $('.ed-dirty').textContent = isDirty() ? '● modifications non enregistrées' : ''; }

  /* ---- interactions plateau ---- */
  function applyCell(r, c) {
    const t = currentTool();
    if (t === 'paint') {
      if (S.grid[r][c] !== S.brush) { S.grid[r][c] = S.brush; if (drag) drag.painted = true; changed({ panel: !drag }); }
    } else if (t === 'obj') {
      placeObject(r, c);
    } else if (t === 'erase') {
      const hit = objectsAt(r, c).pop();
      if (hit) { S.objects.splice(S.objects.indexOf(hit), 1); changed(); say(`${objLabel(hit.type)} retiré.`); }
    } else if (t === 'place' || t === 'unplace') {
      placePerson(r, c, t === 'unplace');
    }
  }
  function placeObject(r, c) {
    const { type, w, h } = S.objTool;
    if (r + h > S.rows || c + w > S.cols) { say('Cet objet sortirait de la grille.', 'err'); return; }
    for (let i = r; i < r + h; i += 1) for (let j = c; j < c + w; j += 1) {
      if (objectsAt(i, j).length) { say('Cet objet chevaucherait un autre objet.', 'err'); return; }
    }
    S.objects.push({ type, r, c, w, h });
    changed();
    if (!OBJECTS[type]?.occ && placedList().some((p) => { const [pr, pc] = S.solution[p.id]; return pr >= r && pr < r + h && pc >= c && pc < c + w; })) {
      say('Un personnage de la solution se trouve maintenant sur une case bloquée.', 'err');
    }
  }
  function placePerson(r, c, erase) {
    const occ = personAt(r, c);
    if (erase) { if (occ) { delete S.solution[occ.id]; changed(); } return; }
    const who = S.people.find((p) => p.id === S.who);
    if (!who) { say('Choisissez d’abord un personnage.', 'err'); return; }
    if (occ && occ.id === who.id) { delete S.solution[who.id]; changed(); return; }
    if (occ) { say(`${occ.name} occupe déjà cette case.`, 'err'); return; }
    if (S.prep && !canPlace(S.prep, r, c)) { say('Case bloquée : on ne peut pas y placer quelqu’un.', 'err'); return; }
    S.solution[who.id] = [r, c];
    const next = S.people.find((p) => !S.solution[p.id]);
    if (next) S.who = next.id;
    changed();
    const info = solutionInfo();
    if (info.conflicts.length) say(info.conflicts[0], 'err');
  }

  const cellFrom = (target) => {
    const cell = target && target.closest ? target.closest('.cell') : null;
    return cell && host.contains(cell) ? { r: +cell.dataset.r, c: +cell.dataset.c } : null;
  };
  host.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const p = cellFrom(e.target);
    if (!p) return;
    drag = { id: e.pointerId, key: `${p.r},${p.c}`, painted: false };
    try { host.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
    applyCell(p.r, p.c);
  });
  host.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId || currentTool() !== 'paint') return;
    const p = cellFrom(document.elementFromPoint(e.clientX, e.clientY));
    if (p && `${p.r},${p.c}` !== drag.key) { drag.key = `${p.r},${p.c}`; applyCell(p.r, p.c); }
  });
  const endDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const painted = drag.painted;
    drag = null;
    try { host.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (painted) { renderPanel(); updateDirty(); }
  };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('click', (e) => {
    if (e.detail !== 0) return; // la souris et le toucher sont traités au pointerdown ; ici : clavier
    const p = cellFrom(e.target);
    if (p) { S.focusCell = { r: p.r, c: p.c }; applyCell(p.r, p.c); }
  });

  /* ---- diagnostic ---- */
  function scheduleDiag() {
    S.diag = { ...S.diag, status: 'pending' };
    renderDiag();
    clearTimeout(diagTimer);
    diagTimer = later(runDiag, 320);
    timers.add(diagTimer);
  }
  const sameSol = (a, b) => S.people.every((p) => a[p.id] && b[p.id] && a[p.id][0] === b[p.id][0] && a[p.id][1] === b[p.id][1]);
  function runDiag() {
    const raw = toRaw({ forCheck: true });
    const v = safe(() => validateLevel(raw), { errors: ['Validation indisponible.'], warnings: [] });
    const d = { status: 'invalid', errors: v.errors || [], warnings: [...(v.warnings || [])], found: null, differs: false };
    const info = solutionInfo();
    if (!info.complete) d.warnings.push(`Solution posée : ${info.placed.length}/${count()} personnages.`);
    info.conflicts.forEach((c) => d.warnings.push(`Conflit : ${c}`));
    if (info.ok) {
      const vr = S.people.find((p) => p.victim);
      const vroom = vr ? S.grid[S.solution[vr.id][0]][S.solution[vr.id][1]] : null;
      const n = S.people.filter((p) => S.grid[S.solution[p.id][0]][S.solution[p.id][1]] === vroom).length;
      if (vr && n !== 2) d.warnings.push(`La pièce de la victime contient ${n} personne${n > 1 ? 's' : ''} : il en faut exactement 2.`);
    }
    if (!d.errors.length) {
      const sols = safe(() => solve(raw, { max: 2 }), null);
      if (!sols) { d.status = 'invalid'; d.errors.push('Le solveur a échoué sur ce niveau.'); } else if (sols.length === 0) d.status = 'none';
      else if (sols.length === 1) { d.status = 'unique'; d.found = sols[0]; d.differs = !(info.complete && sameSol(S.solution, sols[0])); } else { d.status = 'multi'; d.found = sols[0]; }
    }
    S.diag = d;
    renderDiag();
  }
  function renderDiag() {
    const d = S.diag;
    const chips = {
      pending: ['ed-pend', 'Analyse en cours…'], invalid: ['ed-bad', 'Niveau invalide'], none: ['ed-bad', 'Aucune solution'],
      multi: ['ed-warn', 'Plusieurs solutions'], unique: ['ed-ok', 'Solution unique ✓'],
    };
    const [cls, label] = chips[d.status] || chips.pending;
    let h = `<div class="ed-chip ${cls}">${label}</div>`;
    if (d.status === 'multi') h += '<p class="ed-note">Ajoutez des indices (ou générez-les) pour n’en garder qu’une.</p>';
    if (d.status === 'unique' && d.differs) {
      h += `<p class="ed-note ed-note-warn">La solution trouvée par le solveur ${placedList().length ? 'diffère de celle que vous avez posée' : 'n’est pas encore posée sur le plateau'}.</p>
        <button type="button" class="ed-btn ed-small" data-diag="adopt">Adopter la solution trouvée</button>`;
    }
    if (d.errors && d.errors.length) h += `<ul class="ed-msgs ed-msgs-err">${d.errors.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
    if (d.warnings && d.warnings.length) h += `<ul class="ed-msgs">${d.warnings.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
    diagEl.innerHTML = h;
  }
  diagEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-diag="adopt"]') && S.diag.found) {
      S.solution = {};
      Object.entries(S.diag.found).forEach(([id, rc]) => { S.solution[id] = [rc[0], rc[1]]; });
      changed();
      say('Solution du solveur adoptée.');
    }
  });

  /* ---- panneau : rendu ---- */
  const presentTypes = () => [...new Set(S.objects.map((o) => o.type))];
  function objOptions(onlyOcc, cur) {
    const all = Object.keys(OBJECTS).filter((t) => !onlyOcc || OBJECTS[t].occ);
    const here = all.filter((t) => presentTypes().includes(t));
    const others = all.filter((t) => !here.includes(t));
    const o = (t) => `<option value="${t}"${t === cur ? ' selected' : ''}>${esc(objLabel(t))}</option>`;
    return `${here.length ? `<optgroup label="Dans le niveau">${here.map(o).join('')}</optgroup>` : ''}<optgroup label="${here.length ? 'Autres' : 'Aucun posé pour l’instant'}">${others.map(o).join('')}</optgroup>`;
  }
  const selOpts = (list, cur) => list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('');

  function tabGeneral() {
    return `
      <label class="ed-field"><span>Titre</span><input class="ed-input" data-f="title" maxlength="60" value="${esc(S.title)}" autocomplete="off"></label>
      <label class="ed-field"><span>Texte d’introduction</span><textarea class="ed-input" data-f="intro" rows="3" maxlength="300">${esc(S.intro)}</textarea></label>
      <div class="ed-field"><span>Difficulté</span>
        <div class="ed-seg" role="group" aria-label="Difficulté">${[[1, 'Facile'], [2, 'Moyen'], [3, 'Difficile']].map(([v, l]) => `<button type="button" class="ed-btn" data-act="diff" data-v="${v}" aria-pressed="${S.difficulty === v}">${v} · ${l}</button>`).join('')}</div></div>
      <div class="ed-field"><span>Dimensions du plan</span>
        <div class="ed-dims">
          ${[['rows', 'Lignes', S.rows, ROWS_MIN, ROWS_MAX], ['cols', 'Colonnes', S.cols, COLS_MIN, COLS_MAX]].map(([k, l, v, lo, hi]) => `<div class="ed-step ed-dim"><span class="ed-step-l">${l}</span>
            <button type="button" class="ed-btn ed-icon" data-act="dim" data-k="${k}" data-d="-1" aria-label="${l} : une de moins"${v <= lo ? ' disabled' : ''}>−</button>
            <output class="ed-step-v" aria-label="${l}">${v}</output>
            <button type="button" class="ed-btn ed-icon" data-act="dim" data-k="${k}" data-d="1" aria-label="${l} : une de plus"${v >= hi ? ' disabled' : ''}>+</button></div>`).join('')}
        </div>
        <span class="ed-sub-l">Carré</span>
        <div class="ed-seg ed-seg-wrap" role="group" aria-label="Plans carrés">${SQUARE_SIZES.map((n) => `<button type="button" class="ed-btn" data-act="size" data-v="${n}" aria-pressed="${S.rows === n && S.cols === n}">${n}×${n}</button>`).join('')}</div>
        <span class="ed-sub-l">Plan allongé</span>
        <div class="ed-seg ed-seg-wrap" role="group" aria-label="Plans allongés">${FORMATS.map(([l, r, c]) => `<button type="button" class="ed-btn" data-act="dims" data-r="${r}" data-c="${c}" aria-pressed="${S.rows === r && S.cols === c}">${l} ${dimLabel(r, c)}</button>`).join('')}</div>
        <small class="ed-small-note">Plan ${dimLabel()} (${S.rows} ligne${S.rows > 1 ? 's' : ''} × ${S.cols} colonne${S.cols > 1 ? 's' : ''}) : ${count()} personnages, un par ${S.rows <= S.cols ? 'ligne' : 'colonne'}${S.rows !== S.cols ? ` ; ${Math.abs(S.rows - S.cols)} ${S.rows > S.cols ? 'ligne' : 'colonne'}${Math.abs(S.rows - S.cols) > 1 ? 's' : ''} reste${Math.abs(S.rows - S.cols) > 1 ? 'nt' : ''} vide${Math.abs(S.rows - S.cols) > 1 ? 's' : ''}` : ''}. Au plus une personne par ligne et par colonne.</small></div>`;
  }

  function tabRooms() {
    const counts = {};
    S.grid.flat().forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
    const cur = roomOf(S.brush);
    return `
      <p class="ed-lead">Sélectionnez une pièce (pinceau), puis peignez ses cases sur le plateau.</p>
      <ul class="ed-rooms">${S.rooms.map((r, i) => `
        <li class="ed-room${r.key === S.brush ? ' on' : ''}">
          <button type="button" class="ed-brush" data-act="brush" data-k="${r.key}" aria-pressed="${r.key === S.brush}" aria-label="Pinceau : ${esc(r.name)}" style="background:${esc(floorCSS(r.floor))}"></button>
          <input class="ed-input" data-f="rname" data-i="${i}" value="${esc(r.name)}" maxlength="24" aria-label="Nom de la pièce ${i + 1}" autocomplete="off">
          <span class="ed-count">${counts[r.key] || 0} c.</span>
          <button type="button" class="ed-btn ed-icon" data-act="rdel" data-k="${r.key}" aria-label="Supprimer la pièce ${esc(r.name)}"${S.rooms.length < 2 ? ' disabled' : ''}>✕</button>
        </li>`).join('')}</ul>
      <button type="button" class="ed-btn" data-act="radd"${S.rooms.length >= 12 ? ' disabled' : ''}>+ Ajouter une pièce</button>
      ${cur ? `<h3 class="ed-h3">Sol de « ${esc(cur.name)} »</h3>
      <div class="ed-floors">${FLOORS.map((f) => `<button type="button" class="ed-floor" data-act="floor" data-v="${f}" aria-pressed="${cur.floor === f}" title="${FLOOR_NAMES[f] || f}"><span class="ed-floor-sw" style="background:${esc(floorCSS(f))}"></span><span>${FLOOR_NAMES[f] || f}</span></button>`).join('')}</div>` : ''}`;
  }

  function tabObjects() {
    const keys = Object.keys(OBJECTS);
    const group = (title, list) => `<h3 class="ed-h3">${title}</h3><div class="ed-pal">${list.map((t) => `
      <button type="button" class="ed-palbtn" data-act="pal" data-t="${t}" aria-pressed="${S.objMode === 'put' && S.objTool.type === t}">
        <span class="ed-palimg">${objectSVG(t)}</span><span class="ed-paln">${esc(objLabel(t))}</span>
        <span class="ed-badge ${OBJECTS[t].occ ? 'occ' : 'blk'}">${OBJECTS[t].occ ? '✓ occupable' : '⊘ bloquant'}</span></button>`).join('')}</div>`;
    const sz = sizesOf(S.objTool.type);
    return `
      <p class="ed-lead">Choisissez un objet puis touchez le plateau. Les objets ne peuvent ni se chevaucher ni sortir de la grille.</p>
      <div class="ed-row"><button type="button" class="ed-btn" data-act="oerase" aria-pressed="${S.objMode === 'erase'}">Gomme</button>
        <span class="ed-lead ed-inline">${S.objects.length} objet${S.objects.length > 1 ? 's' : ''} sur le plateau</span></div>
      ${sz.length > 1 ? `<div class="ed-field"><span>Taille de « ${esc(objLabel(S.objTool.type))} »</span><div class="ed-seg" role="group">${sz.map(([w, h]) => `<button type="button" class="ed-btn" data-act="osize" data-w="${w}" data-h="${h}" aria-pressed="${S.objTool.w === w && S.objTool.h === h}">${w}×${h}</button>`).join('')}</div></div>` : ''}
      ${group('Occupables', keys.filter((t) => OBJECTS[t].occ))}
      ${group('Bloquants', keys.filter((t) => !OBJECTS[t].occ))}`;
  }

  function lookStepper(p, i) {
    return LOOK_FIELDS.map(([k, label]) => {
      const opts = lookCount(k);
      const isAcc = k === 'accessory';
      const n = isAcc ? opts.length : opts;
      const idx = isAcc ? Math.max(0, opts.indexOf(p.look[k])) : (p.look[k] | 0);
      const text = isAcc ? (ACC_NAMES[opts[idx]] || opts[idx]) : `${idx + 1} / ${n}`;
      return `<div class="ed-step"><span class="ed-step-l">${label}</span>
        <button type="button" class="ed-btn ed-icon" data-act="look" data-i="${i}" data-k="${k}" data-d="-1" aria-label="${label} précédent">‹</button>
        <output class="ed-step-v">${esc(text)}</output>
        <button type="button" class="ed-btn ed-icon" data-act="look" data-i="${i}" data-k="${k}" data-d="1" aria-label="${label} suivant">›</button></div>`;
    }).join('');
  }

  function tabPeople() {
    const sub = `<div class="ed-seg" role="group" aria-label="Vue">
      <button type="button" class="ed-btn" data-act="sub" data-v="fiches" aria-pressed="${S.sub === 'fiches'}">Fiches</button>
      <button type="button" class="ed-btn" data-act="sub" data-v="sol" aria-pressed="${S.sub === 'sol'}">Solution</button></div>`;
    if (S.sub === 'sol') {
      const info = solutionInfo();
      return `${sub}
        <p class="ed-lead">Choisissez un personnage, puis touchez sa case sur le plateau. Une personne par ligne et par colonne, jamais sur une case bloquée.</p>
        <div class="ed-roster">${S.people.map((p) => {
          const pos = S.solution[p.id];
          return `<button type="button" class="ed-rost${info.bad.has(p.id) ? ' bad' : ''}" data-act="who" data-id="${p.id}" aria-pressed="${!S.unplace && S.who === p.id}">
            <span class="ed-rost-tok">${tokenHTML(p)}</span><span class="ed-rost-n">${esc(p.name)}${p.victim ? ' (victime)' : ''}</span>
            <span class="ed-rost-s">${pos ? `ligne ${pos[0] + 1}, col. ${pos[1] + 1}` : 'à placer'}</span></button>`;
        }).join('')}</div>
        <div class="ed-row"><button type="button" class="ed-btn" data-act="unplace" aria-pressed="${S.unplace}">Gomme</button>
          <button type="button" class="ed-btn" data-act="clearsol"${info.placed.length ? '' : ' disabled'}>Tout retirer</button></div>
        <p class="ed-lead">${info.placed.length}/${count()} placés.</p>
        ${info.conflicts.length ? `<ul class="ed-msgs ed-msgs-err">${info.conflicts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}`;
    }
    return `${sub}
      <p class="ed-lead">${count()} personnages, dont une victime. L’identifiant est l’initiale du prénom : elles doivent toutes être différentes.</p>
      ${S.people.map((p, i) => `
        <section class="ed-card${p.victim ? ' victim' : ''}">
          <div class="ed-card-head">
            <span class="ed-av" data-av="${i}">${avatarSVG(p, { size: 64 })}</span>
            <div class="ed-card-body">
              <label class="ed-field"><span>Prénom (id : <b data-idout="${i}">${esc(p.id)}</b>)</span>
                <input class="ed-input" data-f="pname" data-i="${i}" value="${esc(p.name)}" maxlength="16" autocomplete="off"></label>
              <div class="ed-err" data-err="${i}" role="alert"></div>
              <div class="ed-row">
                <div class="ed-seg" role="group" aria-label="Genre de ${esc(p.name)}">
                  <button type="button" class="ed-btn" data-act="gender" data-i="${i}" data-v="f" aria-pressed="${p.gender === 'f'}">Femme</button>
                  <button type="button" class="ed-btn" data-act="gender" data-i="${i}" data-v="m" aria-pressed="${p.gender === 'm'}">Homme</button></div>
                <label class="ed-radio"><input type="radio" name="ed-victim" data-act="victim" data-i="${i}"${p.victim ? ' checked' : ''}><span>Victime</span></label>
              </div>
            </div>
          </div>
          <details class="ed-look" data-look="${i}"${S.openLook === i ? ' open' : ''}><summary>Apparence</summary>
            ${lookStepper(p, i)}
            <button type="button" class="ed-btn" data-act="rand" data-i="${i}">Aléatoire</button></details>
        </section>`).join('')}`;
  }

  function cluePerson() { return S.people.find((p) => p.id === S.clueWho) || S.people[0]; }
  function others(p) { return S.people.filter((q) => q.id !== p.id).map((q) => [q.id, q.name]); }
  function clueFields(p, pi, cl, ci) {
    const at = `data-p="${pi}" data-i="${ci}"`;
    const fs = (label, k, inner) => `<label class="ed-field ed-field-sm"><span>${label}</span><select class="ed-select" data-f="cset" data-k="${k}" ${at}>${inner}</select></label>`;
    switch (cl.t) {
      case 'room': return fs('Pièce', 'room', selOpts(S.rooms.map((r) => [r.key, r.name]), cl.room));
      case 'on': return fs('Objet', 'obj', objOptions(true, cl.obj));
      case 'beside': case 'sameRow': case 'sameCol': return fs('Objet', 'obj', objOptions(false, cl.obj));
      case 'besidePerson': case 'with': return fs('Personne', 'who', selOpts(others(p), cl.who));
      case 'dir': {
        const kind = cl.of && cl.of.who !== undefined ? 'who' : cl.of && cl.of.on !== undefined ? 'on' : 'obj';
        const val = cl.of ? cl.of[kind] : '';
        const valSel = kind === 'who' ? selOpts(others(p), val) : objOptions(kind === 'on', val);
        return fs('Direction', 'dir', selOpts(DIRS, cl.dir))
          + fs('Écart exact', 'exact', selOpts([['', 'Quelconque'], ...Array.from({ length: Math.max(S.rows, S.cols) - 1 }, (_, n) => [n + 1, `exactement ${n + 1}`])], cl.exact ?? ''))
          + fs('Cible', 'ofkind', selOpts([['who', 'Une personne'], ['obj', 'Un objet'], ['on', 'Quelqu’un sur un objet']], kind))
          + fs(kind === 'who' ? 'Personne' : 'Objet', 'ofval', valSel);
      }
      default: return '';
    }
  }
  function tabClues() {
    const p = cluePerson();
    const pi = S.people.indexOf(p);
    const placements = placementsMap();
    const lv = S.prep || toRaw();
    const types = clueTypes();
    return `
      <div class="ed-chips" role="group" aria-label="Personnage">${S.people.map((q) => `
        <button type="button" class="ed-chip-btn" data-act="cwho" data-id="${q.id}" aria-pressed="${q.id === p.id}">
          <span class="ed-rost-tok">${tokenHTML(q)}</span><span>${esc(q.name)}</span><span class="ed-chip-n">${q.clues.length}</span></button>`).join('')}</div>
      <h3 class="ed-h3">Indices de ${esc(p.name)}${p.victim ? ' (victime)' : ''}</h3>
      ${p.victim ? `<p class="ed-fixed">${safe(() => personCluesHTML(lv, p)[0], '<b>La victime.</b> Elle était seule avec le meurtrier.')}</p>` : ''}
      ${p.clues.length ? '' : '<p class="ed-lead">Aucun indice pour le moment.</p>'}
      ${p.clues.map((cl, ci) => {
        const ok = safe(() => checkClue(lv, placements, p, cl), null);
        const txt = safe(() => clueHTML(lv, p, cl), '(indice illisible)');
        const badge = ok === true ? ['ed-ok', '✓ vrai'] : ok === false ? ['ed-bad', '✗ faux'] : ['ed-pend', '? à vérifier'];
        return `<article class="ed-clue">
          <div class="ed-clue-top"><p class="ed-clue-txt">${txt}</p><span class="ed-chip ${badge[0]}" title="Par rapport à la solution posée">${badge[1]}</span></div>
          <div class="ed-clue-ctl">
            <label class="ed-field ed-field-sm"><span>Type</span><select class="ed-select" data-f="ctype" data-p="${pi}" data-i="${ci}">${selOpts(types.map((x) => [x.t, x.label]), cl.t)}</select></label>
            ${clueFields(p, pi, cl, ci)}
            <label class="ed-check"><input type="checkbox" data-f="cnot" data-p="${pi}" data-i="${ci}"${cl.not ? ' checked' : ''}><span>Négation (« pas… »)</span></label>
            <button type="button" class="ed-btn ed-small" data-act="cdel" data-p="${pi}" data-i="${ci}">Supprimer</button>
          </div></article>`;
      }).join('')}
      <div class="ed-row"><button type="button" class="ed-btn" data-act="cadd" data-p="${pi}">+ Ajouter un indice</button></div>
      <hr class="ed-hr">
      <p class="ed-lead">Le générateur écrit des indices vrais pour la solution posée, avec la difficulté du niveau (${S.difficulty}), et vise une solution unique.</p>
      <button type="button" class="ed-btn ed-primary" data-act="cgen">Générer les indices</button>`;
  }
  const placementsMap = () => { const m = {}; Object.entries(S.solution).forEach(([id, rc]) => { m[id] = [...rc]; }); return m; };

  function tabFile() {
    return `
      <p class="ed-lead">${S.id ? `Identifiant : <code>${esc(S.id)}</code>` : 'Pas encore enregistré dans ce navigateur.'}</p>
      <div class="ed-row">
        <button type="button" class="ed-btn ed-primary" data-act="save">Enregistrer</button>
        <button type="button" class="ed-btn" data-act="test">Tester</button>
        <button type="button" class="ed-btn" data-act="newlvl">Nouveau</button>
        <button type="button" class="ed-btn" data-act="quit">Quitter</button></div>
      <h3 class="ed-h3">Échange JSON</h3>
      <textarea class="ed-input ed-json" data-f="json" rows="8" spellcheck="false" aria-label="Contenu JSON du niveau" placeholder="Collez ici un niveau au format JSON, ou cliquez sur Exporter.">${esc(S.jsonText)}</textarea>
      <div class="ed-row">
        <button type="button" class="ed-btn" data-act="export">Exporter (copier)</button>
        <button type="button" class="ed-btn" data-act="download">Télécharger .json</button>
        <button type="button" class="ed-btn" data-act="import">Importer le texte</button>
        <label class="ed-btn ed-filebtn">Importer un fichier<input type="file" accept=".json,application/json" data-f="file" class="ed-sr"></label></div>
      ${S.fileMsgs.length ? `<ul class="ed-msgs ed-msgs-err">${S.fileMsgs.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}`;
  }

  const RENDER = { general: tabGeneral, rooms: tabRooms, objects: tabObjects, people: tabPeople, clues: tabClues, file: tabFile };
  const KEYATTRS = ['f', 'act', 'p', 'i', 'k', 'id', 't', 'v', 'd'];
  const focusKey = (n) => KEYATTRS.map((a) => n.dataset[a] ?? '').join('|');
  function renderPanel() {
    const a = document.activeElement;
    const key = a && panel.contains(a) && (a.dataset.f || a.dataset.act) ? focusKey(a) : null;
    el.querySelectorAll('.ed-tab').forEach((b) => {
      const on = b.dataset.t === S.tab;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `ed-tab-${S.tab}`);
    panel.innerHTML = RENDER[S.tab]();
    if (key) {
      const t = [...panel.querySelectorAll('[data-f],[data-act]')].find((n) => focusKey(n) === key);
      if (t && !t.disabled) t.focus();
    }
    updateHint();
  }

  /* ---- actions du panneau ---- */
  const nextRoomKey = () => 'abcdefghijklmnopqrstuvwxyz'.split('').find((k) => !S.rooms.some((r) => r.key === k));
  const refsId = (cl, ids) => ids.has(cl.who) || (cl.of && ids.has(cl.of.who));

  async function setDims(nr, nc) {
    nr = clampInt(nr, ROWS_MIN, ROWS_MAX, S.rows);
    nc = clampInt(nc, COLS_MIN, COLS_MAX, S.cols);
    const oldR = S.rows, oldC = S.cols;
    if (nr === oldR && nc === oldC) return;
    const n = Math.min(nr, nc);
    const lostObjs = S.objects.filter((o) => o.r + o.h > nr || o.c + o.w > nc);
    const dropped = n < S.people.length ? S.people.slice(n) : [];
    const dropIds = new Set(dropped.map((p) => p.id));
    const lostSol = Object.entries(S.solution).filter(([id, [r, c]]) => dropIds.has(id) || r >= nr || c >= nc).length;
    const parts = [];
    if (lostObjs.length) parts.push(`${lostObjs.length} objet${lostObjs.length > 1 ? 's' : ''}`);
    if (dropped.length) parts.push(`${dropped.length} personnage${dropped.length > 1 ? 's' : ''} (${dropped.map((p) => p.name).join(', ')})`);
    if (lostSol) parts.push(`${lostSol} position${lostSol > 1 ? 's' : ''} de la solution`);
    if (parts.length && !(await ask(`Passer en ${dimLabel(nr, nc)} supprimera : ${parts.join(', ')}. Continuer ?`, { ok: 'Réduire la grille' }))) return;
    // Grille : on garde ce qui tient ; les nouvelles cases prolongent la dernière colonne / ligne.
    S.grid = S.grid.slice(0, nr).map((row) => (nc <= row.length ? row.slice(0, nc) : [...row, ...Array(nc - row.length).fill(row[row.length - 1])]));
    while (S.grid.length < nr) S.grid.push([...S.grid[S.grid.length - 1]]);
    S.objects = S.objects.filter((o) => !lostObjs.includes(o));
    if (dropped.length) {
      S.people = S.people.slice(0, n);
      if (!S.people.some((p) => p.victim)) S.people[0].victim = true;
      S.people.forEach((p) => { p.clues = p.clues.filter((cl) => !refsId(cl, dropIds)); });
    }
    Object.keys(S.solution).forEach((id) => { const [r, c] = S.solution[id]; if (dropIds.has(id) || r >= nr || c >= nc) delete S.solution[id]; });
    while (S.people.length < n) S.people.push(newPersonFor(S.people));
    S.rows = nr; S.cols = nc;
    if (!S.people.some((p) => p.id === S.who)) S.who = S.people[0].id;
    if (!S.people.some((p) => p.id === S.clueWho)) S.clueWho = S.people[0].id;
    changed();
  }

  function renameId(oldId, newId) {
    S.people.forEach((p) => p.clues.forEach((cl) => {
      if (cl.who === oldId) cl.who = newId;
      if (cl.of && cl.of.who === oldId) cl.of.who = newId;
    }));
    if (S.solution[oldId]) { S.solution[newId] = S.solution[oldId]; delete S.solution[oldId]; }
    if (S.who === oldId) S.who = newId;
    if (S.clueWho === oldId) S.clueWho = newId;
  }

  function defaultClue(t, p) {
    const o = others(p)[0]?.[0];
    const anyObj = presentTypes()[0] || 'tree';
    const occ = presentTypes().find((x) => OBJECTS[x]?.occ) || 'chair';
    switch (t) {
      case 'room': return { t, room: S.rooms[0].key };
      case 'on': return { t, obj: occ };
      case 'beside': case 'sameRow': case 'sameCol': return { t, obj: anyObj };
      case 'besidePerson': case 'with': return { t, who: o };
      case 'dir': return { t, dir: 'N', of: { who: o } };
      default: return { t };
    }
  }

  async function generate() {
    const info = solutionInfo();
    if (!info.complete) { say('Posez d’abord la solution complète (onglet Personnages › Solution).', 'err'); return; }
    if (info.conflicts.length) { say(`Solution en conflit : ${info.conflicts[0]}.`, 'err'); return; }
    if (S.people.some((p) => p.clues.length) && !(await ask('Des indices existent déjà. Les remplacer par des indices générés ?', { ok: 'Remplacer' }))) return;
    say('Génération en cours…');
    await new Promise((r) => later(r, 30));
    const seed = Math.floor(Math.random() * 2147483000) + 1;
    const res = safe(() => generateClues(toRaw({ noClues: true }), placementsMap(), { difficulty: S.difficulty, seed }), null);
    if (!res) { say('Impossible de générer des indices uniques ici. Modifiez la solution, les objets ou les pièces, ou réessayez.', 'err'); return; }
    S.people.forEach((p) => { p.clues = clone(res[p.id] || []); });
    changed();
    say('Indices générés.');
  }

  function newId() { return `perso-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`; }
  function readCustom() {
    try { const a = JSON.parse(localStorage.getItem('alibi:custom') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  async function save() {
    const errs = safe(() => validateLevel(toRaw({ forCheck: true })).errors, []);
    if (errs.length && !(await ask(`Le niveau comporte ${errs.length} erreur${errs.length > 1 ? 's' : ''} (il ne sera peut-être pas jouable). Enregistrer quand même ?`, { ok: 'Enregistrer' }))) return;
    if (!S.id) S.id = newId();
    const raw = toRaw();
    const list = readCustom();
    const i = list.findIndex((l) => l && l.id === S.id);
    if (i >= 0) list[i] = raw; else list.push(raw);
    try { localStorage.setItem('alibi:custom', JSON.stringify(list)); } catch (e) { say('Enregistrement impossible (stockage du navigateur indisponible).', 'err'); return; }
    S.savedSnap = snapshot();
    safe(() => history.replaceState(null, '', `#/editeur/${S.id}`));
    updateDirty();
    if (S.tab === 'file') renderPanel();
    say('Niveau enregistré dans ce navigateur.', 'ok');
  }
  function test() {
    const errs = safe(() => validateLevel(toRaw({ forCheck: true })).errors, []);
    if (errs.length) { say(`Corrigez d’abord : ${errs[0]}`, 'err'); S.tab = 'file'; renderPanel(); return; }
    const raw = toRaw({ forCheck: true });
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ returning: true, raw: toRaw() })); } catch (e) { /* ignore */ }
    if (typeof onTest === 'function') onTest(raw);
  }
  async function quit() {
    if (isDirty() && !(await ask('Des modifications ne sont pas enregistrées. Quitter quand même ?', { ok: 'Quitter sans enregistrer' }))) return;
    if (typeof onExit === 'function') onExit();
  }
  async function newLevel() {
    if (isDirty() && !(await ask('Des modifications ne sont pas enregistrées. Repartir d’un niveau neuf ?', { ok: 'Nouveau niveau' }))) return;
    load(defaultState());
    safe(() => history.replaceState(null, '', '#/editeur'));
    S.tab = 'general';
    changed();
    say('Nouveau niveau.');
  }
  function download() {
    const text = JSON.stringify(toRaw(), null, 2);
    const a = document.createElement('a');
    const slug = (S.id || S.title || 'niveau').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'niveau';
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = `alibi-${slug}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    later(() => URL.revokeObjectURL(a.href), 2000);
    return text;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* repli */ }
    const ta = panel.querySelector('.ed-json');
    if (!ta) return false;
    ta.focus(); ta.select();
    return safe(() => document.execCommand('copy'), false);
  }
  async function exportJson() {
    S.jsonText = JSON.stringify(toRaw(), null, 2);
    S.fileMsgs = [];
    renderPanel();
    say((await copyText(S.jsonText)) ? 'JSON copié dans le presse-papiers.' : 'Copie automatique impossible : sélectionnez le texte et copiez-le.', 'ok');
  }
  async function importText(text) {
    S.fileMsgs = [];
    let o;
    try { o = JSON.parse(text); } catch (e) { S.fileMsgs = [`JSON illisible : ${e.message}`]; renderPanel(); return; }
    if (Array.isArray(o)) o = o[0];
    if (!o || typeof o !== 'object') { S.fileMsgs = ['Le contenu n’est pas un niveau.']; renderPanel(); return; }
    const probe = clone(o);
    probe.id = S.id || 'perso-brouillon';
    const st = safe(() => fromRaw(probe), null);
    const complete = st && Object.keys(st.solution).length === Math.min(st.rows, st.cols);
    if (!complete) delete probe.solution;
    const v = safe(() => validateLevel(probe), { errors: ['Validation impossible.'] });
    if (v.errors.length) { S.fileMsgs = v.errors.map((m) => `Import refusé : ${m}`); renderPanel(); return; }
    if (isDirty() && !(await ask('Remplacer le niveau en cours par le niveau importé ?', { ok: 'Remplacer' }))) return;
    const keepId = S.id;
    load(st, { clean: false });
    S.id = keepId;
    S.savedSnap = '';
    S.jsonText = '';
    changed();
    say('Niveau importé. Pensez à l’enregistrer.', 'ok');
  }

  const ACT = {
    tab: (b) => { S.tab = b.dataset.t; renderPanel(); },
    diff: (b) => { S.difficulty = +b.dataset.v; changed(); },
    size: (b) => setDims(+b.dataset.v, +b.dataset.v),
    dims: (b) => setDims(+b.dataset.r, +b.dataset.c),
    dim: (b) => setDims(S.rows + (b.dataset.k === 'rows' ? +b.dataset.d : 0), S.cols + (b.dataset.k === 'cols' ? +b.dataset.d : 0)),
    brush: (b) => { S.brush = b.dataset.k; renderPanel(); },
    radd: () => {
      const key = nextRoomKey();
      const floors = FLOORS.filter((f) => !S.rooms.some((r) => r.floor === f));
      S.rooms.push({ key, name: `Pièce ${S.rooms.length + 1}`, floor: floors[0] || 'tile' });
      S.brush = key; changed();
    },
    rdel: async (b) => {
      const key = b.dataset.k;
      const n = S.grid.flat().filter((k) => k === key).length;
      const left = S.rooms.find((r) => r.key !== key);
      if (n && !(await ask(`Supprimer cette pièce ? Ses ${n} cases seront rattachées à « ${left.name} ».`, { ok: 'Supprimer' }))) return;
      S.grid = S.grid.map((row) => row.map((k) => (k === key ? left.key : k)));
      S.people.forEach((p) => { p.clues = p.clues.filter((cl) => cl.room !== key); });
      S.rooms = S.rooms.filter((r) => r.key !== key);
      if (S.brush === key) S.brush = S.rooms[0].key;
      changed();
    },
    floor: (b) => { roomOf(S.brush).floor = b.dataset.v; changed(); },
    pal: (b) => { S.objMode = 'put'; S.objTool = { type: b.dataset.t, w: sizesOf(b.dataset.t)[0][0], h: sizesOf(b.dataset.t)[0][1] }; renderPanel(); },
    osize: (b) => { S.objTool.w = +b.dataset.w; S.objTool.h = +b.dataset.h; renderPanel(); },
    oerase: () => { S.objMode = S.objMode === 'erase' ? 'put' : 'erase'; renderPanel(); },
    sub: (b) => { S.sub = b.dataset.v; renderPanel(); },
    gender: (b) => { S.people[+b.dataset.i].gender = b.dataset.v; changed(); },
    victim: (b) => { S.people.forEach((p, i) => { if (i === +b.dataset.i) p.victim = true; else delete p.victim; }); changed(); },
    look: (b) => {
      const p = S.people[+b.dataset.i]; const k = b.dataset.k; const d = +b.dataset.d;
      const o = lookCount(k);
      if (k === 'accessory') { const i = Math.max(0, o.indexOf(p.look.accessory)); p.look.accessory = o[(i + d + o.length) % o.length]; } else p.look[k] = ((p.look[k] | 0) + d + o) % o;
      S.openLook = +b.dataset.i; changed();
    },
    rand: (b) => { S.people[+b.dataset.i].look = randomLook(); S.openLook = +b.dataset.i; changed(); },
    who: (b) => { S.who = b.dataset.id; S.unplace = false; renderPanel(); },
    unplace: () => { S.unplace = !S.unplace; renderPanel(); },
    clearsol: () => { S.solution = {}; S.who = S.people[0].id; changed(); },
    cwho: (b) => { S.clueWho = b.dataset.id; renderPanel(); },
    cadd: (b) => { const p = S.people[+b.dataset.p]; p.clues.push(defaultClue('room', p)); changed(); },
    cdel: (b) => { S.people[+b.dataset.p].clues.splice(+b.dataset.i, 1); changed(); },
    cgen: generate,
    save, test, quit, newlvl: newLevel, export: exportJson,
    download: () => { S.jsonText = download(); renderPanel(); },
    import: () => importText(panel.querySelector('.ed-json').value),
  };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled && b.tagName === 'BUTTON' && ACT[b.dataset.act]) ACT[b.dataset.act](b, e);
  });
  el.querySelector('.ed-top').addEventListener('click', (e) => {
    const b = e.target.closest('[data-top]');
    if (b) ACT[b.dataset.top]();
  });
  $('.ed-tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex(([k]) => k === S.tab);
    S.tab = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
    renderPanel();
    $(`#ed-tab-${S.tab}`).focus();
    e.preventDefault();
  });
  el.querySelector('.ed-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act="tab"]');
    if (b) ACT.tab(b);
  });
  panel.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.matches && d.matches('details[data-look]')) { const i = +d.dataset.look; if (d.open) S.openLook = i; else if (S.openLook === i) S.openLook = -1; }
  }, true);

  const onField = (e, isChange) => {
    const t = e.target;
    const f = t.dataset && t.dataset.f;
    if (!f) return;
    if (f === 'title') { S.title = t.value; changed({ panel: false }); } else if (f === 'intro') { S.intro = t.value; changed({ panel: false }); } else if (f === 'json') S.jsonText = t.value;
    else if (f === 'rname') { S.rooms[+t.dataset.i].name = t.value; changed({ panel: false }); } else if (f === 'pname') nameField(t, isChange);
    else if (isChange) clueField(t, f);
    else if (f === 'file') { /* géré au change */ }
  };
  panel.addEventListener('input', (e) => onField(e, false));
  panel.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'victim') { ACT.victim(e.target); return; }
    if (e.target.dataset.f === 'file') {
      const file = e.target.files && e.target.files[0];
      if (file) file.text().then((txt) => { S.jsonText = txt; importText(txt); }).catch(() => say('Lecture du fichier impossible.', 'err'));
      return;
    }
    onField(e, true);
  });

  function nameField(input, isChange) {
    const i = +input.dataset.i;
    const p = S.people[i];
    const errEl = panel.querySelector(`[data-err="${i}"]`);
    if (isChange) { if (input.value !== p.name) input.value = p.name; if (errEl) errEl.textContent = ''; return; }
    const nid = initialOf(input.value);
    let err = '';
    if (!nid) err = 'Le prénom doit commencer par une lettre (A–Z).';
    else {
      const clash = S.people.find((q) => q !== p && q.id === nid);
      if (clash) err = `L’initiale « ${nid} » est déjà prise par ${clash.name} : choisissez un autre prénom.`;
    }
    if (errEl) errEl.textContent = err;
    input.setAttribute('aria-invalid', err ? 'true' : 'false');
    if (err) { say(err, 'err'); return; }
    if (nid !== p.id) renameId(p.id, nid);
    p.id = nid; p.name = input.value;
    const out = panel.querySelector(`[data-idout="${i}"]`);
    if (out) out.textContent = nid;
    const av = panel.querySelector(`[data-av="${i}"]`);
    if (av) av.innerHTML = avatarSVG(p, { size: 64 });
    changed({ panel: false });
  }

  function clueField(t, f) {
    const p = S.people[+t.dataset.p];
    const cl = p && p.clues[+t.dataset.i];
    if (!cl) return;
    if (f === 'ctype') { const not = cl.not; p.clues[+t.dataset.i] = { ...defaultClue(t.value, p), ...(not ? { not: true } : {}) }; } else if (f === 'cnot') { if (t.checked) cl.not = true; else delete cl.not; } else if (f === 'cset') {
      const k = t.dataset.k;
      if (k === 'exact') { if (t.value) cl.exact = +t.value; else delete cl.exact; } else if (k === 'ofkind') {
        const o = others(p)[0]?.[0];
        cl.of = t.value === 'who' ? { who: o } : { [t.value]: t.value === 'on' ? (presentTypes().find((x) => OBJECTS[x]?.occ) || 'chair') : (presentTypes()[0] || 'tree') };
      } else if (k === 'ofval') { const kind = Object.keys(cl.of || { who: 1 })[0]; cl.of = { [kind]: t.value }; } else cl[k] = t.value;
    } else return;
    changed();
  }

  /* ---- démarrage ---- */
  if (draft && (!level || level.id === draft.raw.id)) { const st = safe(() => fromRaw(draft.raw), null); if (st) { load(st, { clean: false }); S.savedSnap = ''; } else load(defaultState()); } else if (level) load(fromRaw(level)); else load(defaultState());
  refreshBoard();
  renderPanel();
  renderDiag();
  scheduleDiag();
  updateDirty();

  return {
    destroy() {
      destroyed = true;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      el.remove();
    },
  };
}
