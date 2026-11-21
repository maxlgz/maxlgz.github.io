// Alibi — rendu statique du plateau (partagé par le jeu et l'éditeur).
import { prepare, OBJECTS } from './engine.js';
import { objectSVG, floorCSS, avatarSVG } from './art.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

function ensurePrepared(level) {
  if (level && Array.isArray(level.cells) && Array.isArray(level.cells[0])) return level;
  return prepare(level);
}

function roomKeyAt(level, r, c) {
  const row = level.roomMap && level.roomMap[r];
  return row ? row[c] : undefined;
}

/**
 * Construit le plateau d'un niveau (brut ou préparé).
 * @returns {{ el: HTMLDivElement, cells: HTMLButtonElement[][], level: object }}
 */
export function createBoard(rawLevel) {
  const level = ensurePrepared(rawLevel);
  const n = level.size;
  const rooms = new Map((level.rooms || []).map((room) => [room.key, room]));

  const el = document.createElement('div');
  el.className = 'board';
  el.style.setProperty('--n', String(n));
  el.setAttribute('role', 'grid');
  el.setAttribute('aria-label', `Plan ${n} × ${n}`);

  const grid = document.createElement('div');
  grid.className = 'board-grid';
  el.appendChild(grid);

  const cells = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) {
      const key = roomKeyAt(level, r, c);
      const room = rooms.get(key);
      const info = (level.cells[r] && level.cells[r][c]) || {};
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell';
      btn.dataset.r = String(r);
      btn.dataset.c = String(c);
      if (room && room.floor) btn.style.background = floorCSS(room.floor);
      if (r === 0 || roomKeyAt(level, r - 1, c) !== key) btn.classList.add('wall-n');
      if (r === n - 1 || roomKeyAt(level, r + 1, c) !== key) btn.classList.add('wall-s');
      if (c === 0 || roomKeyAt(level, r, c - 1) !== key) btn.classList.add('wall-w');
      if (c === n - 1 || roomKeyAt(level, r, c + 1) !== key) btn.classList.add('wall-e');
      if (r === 0) btn.classList.add('edge-n');
      if (r === n - 1) btn.classList.add('edge-s');
      if (c === 0) btn.classList.add('edge-w');
      if (c === n - 1) btn.classList.add('edge-e');
      if (info.blocked) btn.classList.add('blocked');
      const roomName = room ? room.name : '';
      const objName = info.objType ? ` — ${(OBJECTS[info.objType] && OBJECTS[info.objType].n) || info.objType}` : '';
      btn.setAttribute('aria-label', `Ligne ${r + 1}, colonne ${c + 1}${roomName ? ', ' + roomName : ''}${objName}`);
      const layer = document.createElement('span');
      layer.className = 'cell-layer';
      btn.appendChild(layer);
      grid.appendChild(btn);
      row.push(btn);
    }
    cells.push(row);
  }

  // Calque des objets (au-dessus des sols, sous les calques de cases).
  const objLayer = document.createElement('div');
  objLayer.className = 'board-objects';
  objLayer.setAttribute('aria-hidden', 'true');
  for (const obj of level.objects || []) {
    const w = obj.w || 1;
    const h = obj.h || 1;
    const o = document.createElement('div');
    o.className = 'board-object';
    o.dataset.type = obj.type;
    o.style.left = `${(obj.c / n) * 100}%`;
    o.style.top = `${(obj.r / n) * 100}%`;
    o.style.width = `${(w / n) * 100}%`;
    o.style.height = `${(h / n) * 100}%`;
    o.innerHTML = objectSVG(obj.type, { w, h });
    objLayer.appendChild(o);
  }
  el.appendChild(objLayer);

  // Calque des noms de pièces.
  const labelLayer = document.createElement('div');
  labelLayer.className = 'board-labels';
  labelLayer.setAttribute('aria-hidden', 'true');
  const done = new Set();
  // Pour chaque pièce : première case (ordre de lecture) sans objet, sinon la première.
  const candidates = new Map();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = roomKeyAt(level, r, c);
      if (!rooms.has(key)) continue;
      const info = (level.cells[r] && level.cells[r][c]) || {};
      const cur = candidates.get(key);
      if (!cur) candidates.set(key, { r, c, free: info.objIndex == null });
      else if (!cur.free && info.objIndex == null) candidates.set(key, { r, c, free: true });
    }
  }
  for (const [key, pos] of candidates) {
    if (done.has(key)) continue;
    done.add(key);
    let run = 1;
    while (pos.c + run < n && roomKeyAt(level, pos.r, pos.c + run) === key) run++;
    const lab = document.createElement('div');
    lab.className = 'room-label';
    lab.textContent = rooms.get(key).name;
    lab.style.left = `${(pos.c / n) * 100}%`;
    lab.style.top = `${(pos.r / n) * 100}%`;
    lab.style.maxWidth = `${(run / n) * 100}%`;
    labelLayer.appendChild(lab);
  }
  el.appendChild(labelLayer);

  return { el, cells, level };
}

/** Jeton rond d'un personnage : portrait + initiale. */
export function tokenHTML(person, { size = 64 } = {}) {
  const victim = person && person.victim ? ' token--victim' : '';
  return `<span class="token${victim}" data-person="${esc(person.id)}">`
    + `<span class="token-face">${avatarSVG(person, { size })}</span>`
    + `<span class="token-initial">${esc(person.id)}</span></span>`;
}
