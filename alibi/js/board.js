// Alibi — rendu statique du plateau (partagé par le jeu et l'éditeur).
import { prepare, OBJECTS } from './engine.js';
import { objectSVG, floorCSS, avatarSVG } from './art.js';
import { colorOf, VICTIM } from './palette.js';

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

  // Couleurs des personnages du dernier plateau construit : l'éditeur appelle tokenHTML(person)
  // sans couleur juste après createBoard(level) ; on lui retrouve ainsi la couleur de son rang.
  lastColors = new Map((level.people || []).map((p) => [p.id, colorOf(level, p.id)]));

  const el = document.createElement('div');
  el.className = 'board';
  el.style.setProperty('--n', String(n));
  el.dataset.n = String(n);
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

  // Murs entre pièces : un tracé SVG épais aux bouts arrondis (le cadre extérieur est la bordure CSS).
  const [shade, walls] = wallsSVG(level);
  el.appendChild(shade);
  el.appendChild(walls);

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
  // Pour chaque pièce : la rangée horizontale de cases assez longue pour le nom, la plus haute
  // possible ; à défaut la plus longue. On préfère démarrer sur une case sans objet.
  const runs = new Map();
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      const key = roomKeyAt(level, r, c);
      let len = 1;
      while (c + len < n && roomKeyAt(level, r, c + len) === key) len++;
      if (rooms.has(key)) {
        const info = (level.cells[r] && level.cells[r][c]) || {};
        if (!runs.has(key)) runs.set(key, []);
        runs.get(key).push({ r, c, len, free: info.objIndex == null });
      }
      c += len;
    }
  }
  for (const [key, list] of runs) {
    const name = String(rooms.get(key).name || '');
    const need = Math.min(n, Math.ceil(name.length * 0.14 + 0.2));
    let best = null, bestScore = -Infinity;
    for (const run of list) {
      const score = Math.min(run.len, need) * 100 - run.r * 3 + (run.free ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = run; }
    }
    const lab = document.createElement('div');
    lab.className = 'room-label' + (best.len < need ? ' wrap' : '');
    lab.textContent = name;
    // Posée à cheval sur le mur haut de la rangée : elle ne couvre que le bord des cases.
    lab.style.left = `calc(${(best.c / n) * 100}% + ${(100 / n) * 0.12}cqw)`;
    lab.style.top = `${(best.r / n) * 100}%`;
    lab.style.maxWidth = `calc(${(best.len / n) * 100}cqw - ${(100 / n) * 0.24}cqw)`;
    if (best.r === 0) lab.classList.add('at-top');
    labelLayer.appendChild(lab);
  }
  el.appendChild(labelLayer);

  return { el, cells, level };
}

let lastColors = new Map();

/** Tracé des murs intérieurs (unités : une case), avec un aplat d'ombre décalé côté pièce. */
function wallsSVG(level) {
  const n = level.size;
  const at = (r, c) => roomKeyAt(level, r, c);
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (c < n - 1 && at(r, c + 1) !== at(r, c)) d += `M${c + 1} ${r}v1`;
      if (r < n - 1 && at(r + 1, c) !== at(r, c)) d += `M${c} ${r + 1}h1`;
    }
  }
  // Épaisseur proportionnelle au plan entier (et non à la case) : même trait en 5×5 et en 9×9.
  const w = (0.019 * n).toFixed(3);
  const sh = (0.03 * n).toFixed(3);
  const off = (0.0085 * n).toFixed(3);
  const make = (cls, inner) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = inner;
    return svg;
  };
  // Aplat d'ombre décalé (sous les objets) le long des murs et du haut / de la gauche du cadre.
  const shade = make('board-shade', `<path d="M0 ${n}V0H${n}${d}" transform="translate(${off} ${off})" stroke-width="${sh}"/>`);
  const walls = make('board-walls', d ? `<path d="${d}" stroke-width="${w}"/>` : '');
  return [shade, walls];
}

/**
 * Jeton rond d'un personnage : portrait dans un anneau à sa couleur, initiale dans une languette.
 * `color` = { main, pastel, dark } (palette.js) ; à défaut, la couleur de son rang sur le dernier plateau.
 */
export function tokenHTML(person, { size = 64, color } = {}) {
  person = person || {};
  const col = color || lastColors.get(person.id) || null;
  const victim = person.victim ? ' token--victim' : '';
  const style = col ? ` style="--pc:${esc(col.main)};--pcp:${esc(col.pastel)};--pcd:${esc(col.dark)}"` : '';
  return `<span class="token${victim}" data-person="${esc(person.id)}"${style}>`
    + `<span class="token-face">${avatarSVG(person, { size, color: col ? col.main : undefined })}</span>`
    + `<span class="token-initial">${esc(person.id)}</span>`
    + (person.victim ? '<span class="token-tag">Victime</span>' : '')
    + '</span>';
}

/** Couleur d'un personnage pour un niveau donné (re-export pratique pour le jeu). */
export { colorOf, VICTIM };
