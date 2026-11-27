// Alibi — moteur logique pur (Node + navigateur, aucun accès DOM).
// Règles, format de niveau et API : voir le contrat partagé (SPEC).

const PREP = Symbol('alibi.prepared');

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const OBJECTS = {
  // Bloquants
  tree:      { occ: false, g: 'm', n: 'arbre',      pl: 'arbres' },
  bush:      { occ: false, g: 'm', n: 'buisson',    pl: 'buissons' },
  rock:      { occ: false, g: 'm', n: 'rocher',     pl: 'rochers' },
  plant:     { occ: false, g: 'f', n: 'plante',     pl: 'plantes' },
  shelf:     { occ: false, g: 'f', n: 'étagère',    pl: 'étagères' },
  table:     { occ: false, g: 'f', n: 'table',      pl: 'tables' },
  desk:      { occ: false, g: 'm', n: 'bureau',     pl: 'bureaux' },
  counter:   { occ: false, g: 'm', n: 'comptoir',   pl: 'comptoirs' },
  wardrobe:  { occ: false, g: 'f', n: 'armoire',    pl: 'armoires' },
  barrel:    { occ: false, g: 'm', n: 'tonneau',    pl: 'tonneaux' },
  crate:     { occ: false, g: 'f', n: 'caisse',     pl: 'caisses' },
  statue:    { occ: false, g: 'f', n: 'statue',     pl: 'statues' },
  fountain:  { occ: false, g: 'f', n: 'fontaine',   pl: 'fontaines' },
  piano:     { occ: false, g: 'm', n: 'piano',      pl: 'pianos' },
  stove:     { occ: false, g: 'm', n: 'poêle',      pl: 'poêles' },
  fireplace: { occ: false, g: 'f', n: 'cheminée',   pl: 'cheminées' },
  lamp:      { occ: false, g: 'm', n: 'lampadaire', pl: 'lampadaires' },
  telescope: { occ: false, g: 'm', n: 'télescope',  pl: 'télescopes' },
  aquarium:  { occ: false, g: 'm', n: 'aquarium',   pl: 'aquariums' },
  well:      { occ: false, g: 'm', n: 'puits',      pl: 'puits' },
  // Occupables
  chair:     { occ: true, g: 'f', n: 'chaise', pl: 'chaises', on: 'assis sur' },
  armchair:  { occ: true, g: 'm', n: 'fauteuil',  pl: 'fauteuils',  on: 'assis dans' },
  sofa:      { occ: true, g: 'm', n: 'canapé',    pl: 'canapés',    on: 'assis sur' },
  stool:     { occ: true, g: 'm', n: 'tabouret',  pl: 'tabourets',  on: 'assis sur' },
  bench:     { occ: true, g: 'm', n: 'banc',      pl: 'bancs',      on: 'assis sur' },
  bed:       { occ: true, g: 'm', n: 'lit',       pl: 'lits',       on: 'allongé sur' },
  deckchair: { occ: true, g: 'm', n: 'transat',   pl: 'transats',   on: 'allongé sur' },
  hammock:   { occ: true, g: 'm', n: 'hamac',     pl: 'hamacs',     on: 'allongé dans' },
  rug:       { occ: true, g: 'm', n: 'tapis',     pl: 'tapis',      on: 'sur' },
  bathtub:   { occ: true, g: 'f', n: 'baignoire', pl: 'baignoires', on: 'dans' },
  boat:      { occ: true, g: 'f', n: 'barque',    pl: 'barques',    on: 'dans' },
  car:       { occ: true, g: 'f', n: 'voiture',   pl: 'voitures',   on: 'dans' },
  tent:      { occ: true, g: 'f', n: 'tente',     pl: 'tentes',     on: 'sous' },
  stage:     { occ: true, g: 'f', n: 'estrade',   pl: 'estrades',   on: 'sur' },

  // Lot A — voyage et véhicules
  // Occupables
  seat:      { occ: true, g: 'm', n: 'siège',     pl: 'sièges',     on: 'assis sur' },
  bunk:      { occ: true, g: 'f', n: 'couchette', pl: 'couchettes', on: 'allongé sur' },
  stretcher: { occ: true, g: 'm', n: 'brancard',  pl: 'brancards',  on: 'allongé sur' },
  bike:      { occ: true, g: 'm', n: 'vélo',      pl: 'vélos',      on: 'sur' },
  tractor:   { occ: true, g: 'm', n: 'tracteur',  pl: 'tracteurs',  on: 'sur' },
  sled:      { occ: true, g: 'f', n: 'luge',      pl: 'luges',      on: 'sur' },
  // Bloquants
  suitcase:  { occ: false, g: 'f', n: 'valise',       pl: 'valises' },
  trolley:   { occ: false, g: 'm', n: 'chariot',      pl: 'chariots' },
  helm:      { occ: false, g: 'm', n: 'gouvernail',   pl: 'gouvernails' },
  buoy:      { occ: false, g: 'f', n: 'bouée',        pl: 'bouées' },
  anchor:    { occ: false, g: 'f', n: 'ancre',        pl: 'ancres' },
  console:   { occ: false, g: 'm', n: 'pupitre',      pl: 'pupitres' },
  locker:    { occ: false, g: 'm', n: 'casier',       pl: 'casiers' },
  ladder:    { occ: false, g: 'f', n: 'échelle',      pl: 'échelles' },
  robot:     { occ: false, g: 'm', n: 'robot',        pl: 'robots' },
  antenna:   { occ: false, g: 'f', n: 'antenne',      pl: 'antennes' },
  fridge:    { occ: false, g: 'm', n: 'frigo',        pl: 'frigos' },
  sink:      { occ: false, g: 'm', n: 'lavabo',       pl: 'lavabos' },
  vending:   { occ: false, g: 'm', n: 'distributeur', pl: 'distributeurs' },

  // Lot B — lieux et aventures
  // Occupables
  throne:    { occ: true, g: 'm', n: 'trône',      pl: 'trônes',      on: 'assis sur' },
  swing:     { occ: true, g: 'f', n: 'balançoire', pl: 'balançoires', on: 'assis sur' },
  towel:     { occ: true, g: 'f', n: 'serviette',  pl: 'serviettes',  on: 'allongé sur' },
  parasol:   { occ: true, g: 'm', n: 'parasol',    pl: 'parasols',    on: 'sous' },
  horse:     { occ: true, g: 'm', n: 'cheval',     pl: 'chevaux',     on: 'sur' },
  cushion:   { occ: true, g: 'm', n: 'coussin',    pl: 'coussins',    on: 'assis sur' },
  // Bloquants
  cactus:     { occ: false, g: 'm', n: 'cactus',            pl: 'cactus' },
  campfire:   { occ: false, g: 'm', n: 'feu de camp',       pl: 'feux de camp' },
  palm:       { occ: false, g: 'm', n: 'palmier',           pl: 'palmiers' },
  chest:      { occ: false, g: 'm', n: 'coffre',            pl: 'coffres' },
  cannon:     { occ: false, g: 'm', n: 'canon',             pl: 'canons' },
  pillar:     { occ: false, g: 'm', n: 'pilier',            pl: 'piliers' },
  cauldron:   { occ: false, g: 'm', n: 'chaudron',          pl: 'chaudrons' },
  blackboard: { occ: false, g: 'm', n: 'tableau',           pl: 'tableaux' },
  globe:      { occ: false, g: 'm', n: 'globe',             pl: 'globes' },
  tv:         { occ: false, g: 'f', n: 'télévision',        pl: 'télévisions' },
  snowman:    { occ: false, g: 'm', n: 'bonhomme de neige', pl: 'bonshommes de neige' },
  hay:        { occ: false, g: 'f', n: 'botte de foin',     pl: 'bottes de foin' },
  billiard:   { occ: false, g: 'm', n: 'billard',           pl: 'billards' },
};

// Tailles autorisées [w, h] par type (orientations listées) ; type absent = 1×1 seul.
// validateLevel n'en tire que des avertissements, sans tenir compte de l'orientation.
export const OBJECT_SIZES = {
  sofa: [[2, 1], [1, 2]], bench: [[2, 1], [1, 2]], bed: [[1, 1], [1, 2]],
  rug: [[1, 1], [2, 1], [1, 2], [2, 2]],
  boat: [[1, 1], [2, 1], [1, 2]], car: [[2, 1]],
  stage: [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1], [1, 3], [3, 2], [2, 3]],
  chair: [[1, 1]], armchair: [[1, 1]], stool: [[1, 1]], deckchair: [[1, 1]], hammock: [[1, 1]],
  bathtub: [[1, 1], [2, 1], [1, 2]], tent: [[1, 1]],
  // Lot A
  bunk: [[1, 1], [2, 1], [1, 2]], stretcher: [[1, 1], [2, 1], [1, 2]], tractor: [[1, 1], [2, 1], [1, 2]],
  console: [[1, 1], [2, 1], [1, 2]],
  // Lot B
  towel: [[1, 1], [1, 2], [2, 1]], blackboard: [[1, 1], [2, 1], [1, 2]], billiard: [[2, 1], [1, 2]],
};

export const FLOORS = ['grass', 'wood', 'parquet', 'tile', 'stone', 'carpet', 'sand', 'snow',
  'concrete', 'deck', 'marble', 'gravel',
  'metal', 'water', 'tatami', 'checker', 'dirt', 'ice', 'moon', 'brick', 'cobble'];

export const CLUE_TYPES = [
  { t: 'room',         label: 'Dans la pièce',                 fields: ['room'], negatable: true },
  { t: 'on',           label: 'Sur / dans un objet',           fields: ['obj'], occOnly: true, negatable: true },
  { t: 'beside',       label: 'À côté d’un objet',             fields: ['obj'], negatable: true },
  { t: 'besidePerson', label: 'À côté de quelqu’un',           fields: ['who'], negatable: true },
  { t: 'with',         label: 'Avec quelqu’un (même pièce)',   fields: ['who'], negatable: true },
  { t: 'alone',        label: 'Seul(e) dans sa pièce',         fields: [], negatable: true },
  { t: 'dir',          label: 'Position (au-dessus / en dessous / à gauche / à droite)', fields: ['dir', 'of', 'exact'], negatable: true,
    options: { dir: [['N', 'au-dessus'], ['S', 'en dessous'], ['W', 'à gauche'], ['E', 'à droite']] },
    help: 'Au-dessus / en dessous : sur une ligne plus haut / plus bas que la cible. À gauche / à droite : dans une colonne plus à gauche / à droite. Avec un écart exact : exactement ce nombre de lignes ou de colonnes.' },
  { t: 'sameRow',      label: 'Même ligne qu’un objet',        fields: ['obj'], negatable: true },
  { t: 'sameCol',      label: 'Même colonne qu’un objet',      fields: ['obj'], negatable: true },
  { t: 'sees',         label: 'Voyait',                        fields: ['obj'], negatable: true,
    help: 'Même ligne ou même colonne, dans la même pièce, sans rien entre les deux.' },
];

const CLUE_T = new Set(CLUE_TYPES.map(c => c.t));
// Indices « peu lisibles » : la négation d'une position relative (direction, même ligne / colonne,
// « voyait »). Le générateur n'en produit jamais ; validateLevel les signale par un avertissement.
const AWKWARD_NEG_T = new Set(['dir', 'sameRow', 'sameCol', 'sees']);
export function isAwkwardClue(clue) {
  return !!(clue && typeof clue === 'object' && clue.not && AWKWARD_NEG_T.has(clue.t));
}
const DIRS = ['N', 'S', 'E', 'W'];

/* ------------------------------------------------------------------ */
/* Préparation                                                         */
/* ------------------------------------------------------------------ */

function clone(x) {
  if (typeof structuredClone === 'function') return structuredClone(x);
  return JSON.parse(JSON.stringify(x));
}
const posInt = (v, d) => (Number.isInteger(v) && v > 0 ? v : d);

// Dimensions d'un niveau (brut ou préparé) : carré `size`, ou rectangle `rows` × `cols`.
function dimsOf(raw) {
  if (!raw || typeof raw !== 'object') return { rows: 0, cols: 0, count: 0 };
  if (raw[PREP]) { const x = raw[PREP]; return { rows: x.H, cols: x.W, count: x.count }; }
  let rows = 0, cols = 0;
  if (Number.isInteger(raw.size) && raw.size > 0) rows = cols = raw.size;
  else if (Number.isInteger(raw.rows) && raw.rows > 0 && Number.isInteger(raw.cols) && raw.cols > 0) { rows = raw.rows; cols = raw.cols; }
  return { rows, cols, count: Math.min(rows, cols) };
}

export function dims(level) {
  return dimsOf(level);
}

export function prepare(raw) {
  if (raw && raw[PREP]) return raw;
  const lvl = clone(raw || {});
  const { rows: H, cols: W, count } = dimsOf(lvl);
  lvl.rows = H; lvl.cols = W; lvl.count = count;
  if (H > 0 && H === W) lvl.size = H; else delete lvl.size;
  lvl.rooms = Array.isArray(lvl.rooms) ? lvl.rooms : [];
  lvl.roomMap = Array.isArray(lvl.roomMap) ? lvl.roomMap.map(s => String(s)) : [];
  lvl.objects = (Array.isArray(lvl.objects) ? lvl.objects : [])
    .map(o => ({ ...o, w: posInt(o && o.w, 1), h: posInt(o && o.h, 1) }));
  lvl.people = (Array.isArray(lvl.people) ? lvl.people : [])
    .map(p => ({ ...p, clues: Array.isArray(p && p.clues) ? p.clues : [] }));

  const roomIndex = new Map();
  const roomKeys = [];
  for (const rm of lvl.rooms) {
    if (rm && rm.key != null && !roomIndex.has(String(rm.key))) {
      roomIndex.set(String(rm.key), roomKeys.length); roomKeys.push(String(rm.key));
    }
  }
  const NN = H * W;
  const cellRoom = new Int16Array(NN).fill(-1);
  const cellObj = new Int16Array(NN).fill(-1);
  const cellType = new Array(NN).fill(null);
  const blocked = new Uint8Array(NN);
  const cells = [];
  for (let r = 0; r < H; r++) {
    const row = [];
    const line = lvl.roomMap[r] || '';
    for (let c = 0; c < W; c++) {
      const ch = c < line.length ? line[c] : null;
      let ri = -1;
      if (ch != null && ch !== ' ' && ch !== '.') {
        if (!roomIndex.has(ch)) { roomIndex.set(ch, roomKeys.length); roomKeys.push(ch); }
        ri = roomIndex.get(ch);
      }
      cellRoom[r * W + c] = ri;
      row.push({ room: ri >= 0 ? roomKeys[ri] : null, objIndex: null, objType: null, blocked: false });
    }
    cells.push(row);
  }
  const boxes = [];
  const typeCount = {};
  const typeBoxes = {};
  lvl.objects.forEach((o, k) => {
    const type = o && o.type;
    const box = { k, type, r0: o.r, c0: o.c, r1: o.r + o.h - 1, c1: o.c + o.w - 1 };
    boxes.push(box);
    typeCount[type] = (typeCount[type] || 0) + 1;
    (typeBoxes[type] || (typeBoxes[type] = [])).push(box);
    const occ = !!(OBJECTS[type] && OBJECTS[type].occ);
    if (!Number.isInteger(o.r) || !Number.isInteger(o.c)) return;
    for (let r = o.r; r < o.r + o.h; r++) {
      for (let c = o.c; c < o.c + o.w; c++) {
        if (r < 0 || c < 0 || r >= H || c >= W) continue;
        const cell = cells[r][c];
        if (cell.objIndex != null) continue; // chevauchement : le premier objet l'emporte
        cell.objIndex = k; cell.objType = type; cell.blocked = !occ;
        const i = r * W + c;
        cellObj[i] = k; cellType[i] = type; blocked[i] = occ ? 0 : 1;
      }
    }
  });
  const adj = [];
  for (let i = 0; i < NN; i++) {
    const r = (i / W) | 0, c = i % W, a = [];
    const push = (rr, cc) => {
      if (rr < 0 || cc < 0 || rr >= H || cc >= W) return;
      const j = rr * W + cc;
      if (cellRoom[j] === cellRoom[i] && cellRoom[i] >= 0) a.push(j);
    };
    push(r - 1, c); push(r + 1, c); push(r, c - 1); push(r, c + 1);
    adj.push(a);
  }
  const pidx = new Map();
  lvl.people.forEach((p, i) => { if (p && p.id != null && !pidx.has(String(p.id))) pidx.set(String(p.id), i); });
  let victim = lvl.people.findIndex(p => p && p.victim);
  lvl.cells = cells;
  const ctx = {
    H, W, count, NN, n: lvl.people.length, cellRoom, cellObj, cellType, blocked, adj, boxes, typeCount, typeBoxes,
    roomIndex, roomKeys, R: roomKeys.length, pidx, people: lvl.people, victim, lvl,
    // variantes : témoin menteur (change la règle de validité), arme du crime (bonus)
    liar: !!(lvl.twist && typeof lvl.twist === 'object' && lvl.twist.liar === true),
    weapon: !!(lvl.twist && typeof lvl.twist === 'object' && lvl.twist.weapon === true),
  };
  Object.defineProperty(lvl, PREP, { value: ctx, enumerable: false });
  return lvl;
}

const ctxOf = level => prepare(level)[PREP];

export function canPlace(level, r, c) {
  const ctx = ctxOf(level);
  if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= ctx.H || c >= ctx.W) return false;
  return !ctx.blocked[r * ctx.W + c];
}

/* ------------------------------------------------------------------ */
/* Sémantique des indices                                              */
/* ------------------------------------------------------------------ */

function dirBox(dir, k, r, c, b) {
  switch (dir) {
    case 'N': return k == null ? r < b.r0 : b.r0 - r === k;
    case 'S': return k == null ? r > b.r1 : r - b.r1 === k;
    case 'W': return k == null ? c < b.c0 : b.c0 - c === k;
    case 'E': return k == null ? c > b.c1 : c - b.c1 === k;
    default: return false;
  }
}

// Compile un indice pour la personne d'index p. Le résultat donne la vérité « de base »
// (avant négation) ; `not` est appliqué par l'appelant (base !== not).
function compileClue(ctx, p, clue) {
  const not = !!(clue && clue.not);
  const { H, W, cellRoom, cellType, cellObj, adj } = ctx;
  const K = (v) => ({ kind: 'const', v, not });
  if (!clue || !CLUE_T.has(clue.t)) return K(false);
  switch (clue.t) {
    case 'room': {
      const ri = ctx.roomIndex.get(String(clue.room));
      if (ri == null) return K(false);
      return { kind: 'unary', not, f: i => cellRoom[i] === ri };
    }
    case 'on': {
      const t = clue.obj;
      return { kind: 'unary', not, f: i => cellType[i] === t };
    }
    case 'beside': {
      const t = clue.obj;
      return {
        kind: 'unary', not,
        f: i => { const a = adj[i]; for (let x = 0; x < a.length; x++) { const j = a[x]; if (cellType[j] === t && (cellObj[i] < 0 || cellObj[j] !== cellObj[i])) return true; } return false; },
      };
    }
    case 'sameRow': case 'sameCol': {
      const t = clue.obj, has = new Uint8Array(clue.t === 'sameRow' ? H : W);
      for (let i = 0; i < ctx.NN; i++) if (cellType[i] === t) has[clue.t === 'sameRow' ? (i / W) | 0 : i % W] = 1;
      return clue.t === 'sameRow'
        ? { kind: 'unary', not, f: i => has[(i / W) | 0] === 1 }
        : { kind: 'unary', not, f: i => has[i % W] === 1 };
    }
    case 'with': case 'besidePerson': {
      const q = ctx.pidx.get(String(clue.who));
      if (q == null) return K(false);
      const f = clue.t === 'with'
        ? (i, j) => cellRoom[i] >= 0 && cellRoom[i] === cellRoom[j]
        : (i, j) => adj[i].indexOf(j) >= 0;
      if (q === p) return { kind: 'unary', not, f: i => f(i, i) };
      return { kind: 'binary', not, q, f };
    }
    case 'alone': return { kind: 'alone', not };
    case 'sees': {
      const lists = seesLists(ctx, clue.obj);
      return { kind: 'sees', not, f: i => lists[i] !== null, lists };
    }
    case 'dir': {
      const dir = clue.dir;
      if (!DIRS.includes(dir) || !clue.of) return K(false);
      const k = typeof clue.exact === 'number' ? clue.exact : null;
      const of = clue.of;
      const cellTest = (i, j) => dirBox(dir, k, (i / W) | 0, i % W, { r0: (j / W) | 0, r1: (j / W) | 0, c0: j % W, c1: j % W });
      if (of.who != null) {
        const q = ctx.pidx.get(String(of.who));
        if (q == null) return K(false);
        if (q === p) return K(false);
        return { kind: 'binary', not, q, f: cellTest };
      }
      if (of.obj != null) {
        const bs = ctx.typeBoxes[of.obj] || [];
        return { kind: 'unary', not, f: i => { const r = (i / W) | 0, c = i % W; for (const b of bs) if (dirBox(dir, k, r, c, b)) return true; return false; } };
      }
      if (of.on != null) return { kind: 'dirOn', not, type: of.on, test: cellTest };
      return K(false);
    }
  }
  return K(false);
}

// « Voyait » : pour chaque case, les lignes de vue (une par direction) qui aboutissent à un objet du
// type voulu dans la même pièce ; chaque ligne de vue = cases strictement intermédiaires (sans objet).
// null si aucune. L'objet sur lequel on se trouve ne compte pas et arrête le regard (case non vide).
// Une personne ne peut se trouver entre les deux que si elle partage la ligne ou la colonne du sujet :
// dans une disposition valable, l'indice ne dépend donc que de la case du sujet.
function seesLists(ctx, type) {
  const cache = ctx.seesCache || (ctx.seesCache = new Map());
  if (cache.has(type)) return cache.get(type);
  const { H, W, NN, cellRoom, cellObj, cellType } = ctx;
  const out = new Array(NN).fill(null);
  for (let i = 0; i < NN; i++) {
    const rm = cellRoom[i];
    if (rm < 0) continue;
    const r = (i / W) | 0, c = i % W;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const between = [];
      for (let rr = r + dr, cc = c + dc; rr >= 0 && cc >= 0 && rr < H && cc < W; rr += dr, cc += dc) {
        const j = rr * W + cc;
        if (cellRoom[j] !== rm) break;
        if (cellObj[j] >= 0) {
          if (cellObj[j] !== cellObj[i] && cellType[j] === type) (out[i] || (out[i] = [])).push(between);
          break;
        }
        between.push(j);
      }
    }
  }
  cache.set(type, out);
  return out;
}

function readPlacements(ctx, placements) {
  const pos = new Int16Array(ctx.n).fill(-1);
  if (!placements) return pos;
  ctx.people.forEach((p, i) => {
    const v = placements[p.id];
    if (Array.isArray(v) && Number.isInteger(v[0]) && Number.isInteger(v[1])
      && v[0] >= 0 && v[1] >= 0 && v[0] < ctx.H && v[1] < ctx.W) pos[i] = v[0] * ctx.W + v[1];
  });
  return pos;
}

// Vérité (true/false/null) d'un indice compilé, avec positions éventuellement partielles.
function evalCompiled(ctx, p, cc, pos) {
  const ip = pos[p];
  let base;
  switch (cc.kind) {
    case 'const': base = cc.v; break;
    case 'unary': if (ip < 0) return null; base = cc.f(ip); break;
    case 'binary': { const jq = pos[cc.q]; if (ip < 0 || jq < 0) return null; base = cc.f(ip, jq); break; }
    case 'sees': {
      // les personnes non posées ne peuvent pas s'interposer (elles partageraient la ligne ou la
      // colonne du sujet) : la vérité ne dépend que des personnes déjà posées
      if (ip < 0) return null;
      const lists = cc.lists[ip];
      base = false;
      if (lists) for (const between of lists) {
        let clear = true;
        for (let x = 0; x < between.length && clear; x++) for (let q = 0; q < ctx.n; q++) if (pos[q] === between[x]) { clear = false; break; }
        if (clear) { base = true; break; }
      }
      break;
    }
    case 'alone': {
      if (ip < 0) return null;
      let other = false, all = true;
      for (let q = 0; q < ctx.n; q++) {
        if (q === p) continue;
        if (pos[q] < 0) { all = false; continue; }
        if (ctx.cellRoom[pos[q]] === ctx.cellRoom[ip]) other = true;
      }
      if (other) base = false; else if (all) base = true; else return null;
      break;
    }
    case 'dirOn': {
      if (ip < 0) return null;
      let found = false, all = true;
      for (let q = 0; q < ctx.n; q++) {
        if (q === p) continue;
        if (pos[q] < 0) { all = false; continue; }
        if (ctx.cellType[pos[q]] === cc.type && cc.test(ip, pos[q])) { found = true; break; }
      }
      if (found) base = true; else if (all) base = false; else return null;
      break;
    }
    default: return null;
  }
  return base !== cc.not;
}

function personIndex(ctx, person) {
  const id = person && typeof person === 'object' ? person.id : person;
  const i = ctx.pidx.get(String(id));
  return i == null ? -1 : i;
}

export function checkClue(level, placements, person, clue) {
  const ctx = ctxOf(level);
  const p = personIndex(ctx, person);
  if (p < 0) return null;
  return evalCompiled(ctx, p, compileClue(ctx, p, clue), readPlacements(ctx, placements));
}

export function murdererOf(level, placements) {
  const ctx = ctxOf(level);
  return murdererIdx(ctx, readPlacements(ctx, placements));
}
function murdererIdx(ctx, pos) {
  const v = ctx.victim;
  if (v < 0 || pos[v] < 0) return null;
  const room = ctx.cellRoom[pos[v]];
  let found = null, count = 0;
  for (let q = 0; q < ctx.n; q++) {
    if (q === v || pos[q] < 0) continue;
    if (ctx.cellRoom[pos[q]] === room) { count++; found = q; }
  }
  return count === 1 ? ctx.people[found].id : null;
}

// Menteur d'une disposition (positions complètes) : l'unique suspect dont TOUS les indices (au moins un)
// sont faux, tous les autres indices (victime comprise) étant vrais ; -1 sinon.
function liarIndex(ctx, pos) {
  let liar = -1;
  for (let p = 0; p < ctx.n; p++) {
    const clues = ctx.people[p].clues;
    let allT = true, allF = clues.length > 0;
    for (const cl of clues) {
      const v = evalCompiled(ctx, p, compileClue(ctx, p, cl), pos);
      if (v !== true) allT = false;
      if (v !== false) allF = false;
    }
    if (allT) continue;
    if (!allF || p === ctx.victim || liar >= 0) return -1;
    liar = p;
  }
  return liar;
}

export function liarOf(level, placements) {
  const ctx = ctxOf(level);
  const pos = readPlacements(ctx, placements);
  if (ctx.n === 0 || pos.some(x => x < 0)) return null;
  const l = liarIndex(ctx, pos);
  return l < 0 ? null : ctx.people[l].id;
}

// Arme du crime : l'unique objet voisin (orthogonal, même pièce) du meurtrier, hors objet sur lequel
// il se trouve ; un objet multi-cases compte une fois. Index dans level.objects, ou null.
export function weaponOf(level, placements) {
  const ctx = ctxOf(level);
  const pos = readPlacements(ctx, placements);
  if (ctx.n === 0 || pos.some(x => x < 0)) return null;
  const m = murdererIdx(ctx, pos);
  if (m == null) return null;
  const i = pos[ctx.pidx.get(String(m))];
  const seen = new Set();
  for (const j of ctx.adj[i]) { const k = ctx.cellObj[j]; if (k >= 0 && k !== ctx.cellObj[i]) seen.add(k); }
  return seen.size === 1 ? seen.values().next().value : null;
}

export function evaluate(level, placements) {
  const L = prepare(level), ctx = L[PREP];
  const pos = readPlacements(ctx, placements);
  const { H, W, n } = ctx;
  // Complet quand tout le monde est posé (soit `count` personnes sur un niveau valide).
  let placed = 0;
  for (let p = 0; p < n; p++) if (pos[p] >= 0) placed++;
  const complete = n > 0 && placed === n;
  const rowCnt = new Array(H).fill(0), colCnt = new Array(W).fill(0);
  const blockedIds = [];
  for (let p = 0; p < n; p++) {
    if (pos[p] < 0) continue;
    rowCnt[(pos[p] / W) | 0]++; colCnt[pos[p] % W]++;
    if (ctx.blocked[pos[p]]) blockedIds.push(ctx.people[p].id);
  }
  // Chaque ligne et chaque colonne : au plus une personne.
  const rows = [], cols = [];
  for (let i = 0; i < H; i++) if (rowCnt[i] > 1) rows.push(i);
  for (let i = 0; i < W; i++) if (colCnt[i] > 1) cols.push(i);
  const lines = { ok: rows.length === 0 && cols.length === 0, rows, cols };
  let victimOk = null;
  const v = ctx.victim;
  if (v < 0) victimOk = false;
  else if (pos[v] >= 0) {
    let cnt = 0;
    for (let q = 0; q < n; q++) if (pos[q] >= 0 && ctx.cellRoom[pos[q]] === ctx.cellRoom[pos[v]]) cnt++;
    if (complete) victimOk = cnt === 2; else if (cnt > 2) victimOk = false;
  }
  const people = {};
  let allOk = true;
  ctx.people.forEach((person, p) => {
    const res = person.clues.map(cl => evalCompiled(ctx, p, compileClue(ctx, p, cl), pos));
    const ok = res.every(x => x === true) ? true : res.some(x => x === false) ? false : null;
    if (ok !== true) allOk = false;
    people[person.id] = { ok, clues: res };
  });
  if (ctx.liar) {
    // témoin menteur : `clues` reste factuel ; la disposition est valable s'il existe un menteur
    const li = complete ? liarIndex(ctx, pos) : -1;
    const liar = li < 0 ? null : ctx.people[li].id;
    const okL = complete && lines.ok && blockedIds.length === 0 && victimOk === true && liar !== null;
    return { complete, ok: okL, lines, victimOk, murderer: murdererIdx(ctx, pos), blocked: blockedIds, people, liar };
  }
  const ok = complete && lines.ok && blockedIds.length === 0 && victimOk === true && allOk;
  return { complete, ok, lines, victimOk, murderer: murdererIdx(ctx, pos), blocked: blockedIds, people };
}

/* ------------------------------------------------------------------ */
/* Solveur                                                             */
/* ------------------------------------------------------------------ */

function compileSet(ctx, cluesByIdx) {
  const n = ctx.n;
  const unary = [], bin = [], alonePos = new Uint8Array(n), aloneNeg = new Uint8Array(n), finals = [];
  let impossible = false;
  for (let p = 0; p < n; p++) { unary.push([]); bin.push([]); }
  for (let p = 0; p < n; p++) {
    for (const clue of cluesByIdx[p] || []) {
      const cc = compileClue(ctx, p, clue);
      addCompiled(cc, p);
    }
  }
  function addCompiled(cc, p) {
    const not = cc.not;
    switch (cc.kind) {
      case 'const': if (cc.v === not) impossible = true; break;
      case 'unary': case 'sees': unary[p].push(not ? i => !cc.f(i) : cc.f); break;
      case 'binary': {
        const q = cc.q, f = cc.f;
        bin[p].push({ o: q, t: not ? (a, b) => !f(a, b) : f });
        bin[q].push({ o: p, t: not ? (a, b) => !f(b, a) : (a, b) => f(b, a) });
        break;
      }
      case 'alone': if (not) aloneNeg[p] = 1; else alonePos[p] = 1; break;
      case 'dirOn': finals.push({ p, cc }); break;
    }
  }
  return { unary, bin, alonePos, aloneNeg, finals, impossible };
}

function solveCore(ctx, comp, max, rng = null, budget = Infinity, prio = 0) {
  const { H, W, NN, n, cellRoom, cellType, blocked } = ctx;
  const out = [];
  out.done = true; // recherche menée à terme (faux si le budget de nœuds est épuisé)
  if (n === 0 || n > Math.min(H, W) || comp.impossible || max <= 0) return out;
  const R = ctx.R + 1;
  const roomOf = new Int16Array(NN);
  for (let i = 0; i < NN; i++) roomOf[i] = cellRoom[i] + 1;
  const domains = [];
  for (let p = 0; p < n; p++) {
    const d = [];
    const us = comp.unary[p];
    outer: for (let i = 0; i < NN; i++) {
      if (blocked[i]) continue;
      for (let u = 0; u < us.length; u++) if (!us[u](i)) continue outer;
      d.push(i);
    }
    if (d.length === 0) return out;
    domains.push(d);
  }
  const { bin, alonePos, aloneNeg, finals } = comp;
  // Cohérence d'arc à la racine : chaque case doit avoir un support chez l'autre personne
  // de chaque contrainte binaire (sur une autre ligne et une autre colonne).
  for (let changed = true, guard = 0; changed && guard < 50; guard++) {
    changed = false;
    for (let p = 0; p < n; p++) {
      for (const b of bin[p]) {
        const od = domains[b.o];
        const kept = domains[p].filter(i => {
          const r = (i / W) | 0, c = i % W;
          for (let y = 0; y < od.length; y++) {
            const j = od[y];
            if ((j / W | 0) !== r && j % W !== c && b.t(i, j)) return true;
          }
          return false;
        });
        if (kept.length !== domains[p].length) {
          if (!kept.length) return out;
          domains[p] = kept; changed = true;
        }
      }
    }
  }
  const victim = ctx.victim;
  const pos = new Int16Array(n).fill(-1);
  const roomCount = new Int8Array(R);
  const aloner = new Int8Array(R);
  let rowUsed = 0, colUsed = 0;
  const fullRows = (1 << H) - 1, fullCols = (1 << W) - 1;
  // Au plus une personne par ligne et par colonne. Une dimension qui compte exactement `n` lignes
  // est entièrement couverte (sur un carré complet : les deux) : on élague alors par couplages.
  const rowsExact = n === H, colsExact = n === W;
  const exactLines = rowsExact || colsExact;
  // Dimension « primaire » du couplage lignes ↔ colonnes : les lignes si elles sont toutes couvertes.
  const primRows = rowsExact;
  const NP = primRows ? H : W;
  const NL = Math.max(H, W);
  const bufA = [], bufB = [];
  for (let d = 0; d <= n; d++) { bufA.push(new Int16Array(NN)); bufB.push(new Int16Array(NN)); }
  // Personnes qui exigent une autre personne dans leur pièce (victime, « pas seul »).
  const needers = [];
  for (let p = 0; p < n; p++) if (p === victim || aloneNeg[p]) needers.push(p);
  const negFinals = finals.filter(f => f.cc.not);
  const posFinals = finals.filter(f => !f.cc.not).map(f => {
    // personnes susceptibles de se trouver sur un objet de ce type
    const sitters = [];
    for (let q = 0; q < n; q++) if (q !== f.p && domains[q].some(i => cellType[i] === f.cc.type)) sitters.push(q);
    return { ...f, sitters };
  });
  for (const f of posFinals) if (!f.sitters.length) return out;
  const forbid = new Uint8Array(n * NN);
  const inDom = domains.map(d => { const m = new Uint8Array(NN); for (const i of d) m[i] = 1; return m; });
  const occupant = new Int16Array(NN).fill(-1);
  const typeCells = {};
  for (const f of posFinals) {
    if (!typeCells[f.cc.type]) { typeCells[f.cc.type] = []; for (let j = 0; j < NN; j++) if (cellType[j] === f.cc.type) typeCells[f.cc.type].push(j); }
    f.targets = new Array(NN);
  }
  function targetsOf(f, i) {
    let t = f.targets[i];
    if (!t) { t = f.targets[i] = typeCells[f.cc.type].filter(j => j !== i && f.cc.test(i, j)); }
    return t;
  }
  const roomMark = new Int32Array(R);
  const rcAdj = [], rcFree = [];
  for (let d = 0; d <= n; d++) { rcAdj.push(new Int32Array(NP)); rcFree.push(new Int32Array(NP)); }
  const pRows = new Int32Array(Math.max(n, NL)), pCols = new Int32Array(Math.max(n, NL));
  const matchOf = new Int8Array(NL);
  const roomCap = H !== W && R <= 31;
  const roomLines = [], forced = new Int8Array(R), fAl = new Int8Array(R), fV = new Int8Array(R);
  const pMask = new Int32Array(n), pIdx = new Int32Array(n);
  if (roomCap) for (let d = 0; d <= n; d++) roomLines.push(new Int32Array(R * NP));
  // Couplage parfait (Kuhn) : chaque élément gauche g reçoit un bit distinct de adjM[g].
  function matching(adjM, m, stopOnFail) {
    matchOf.fill(-1);
    let size = 0;
    for (let g = 0; g < m; g++) {
      let seen = 0;
      const tryG = (x) => {
        let a = adjM[x] & ~seen;
        while (a) {
          const bit = a & -a; a ^= bit;
          seen |= bit;
          const b = 31 - Math.clz32(bit);
          if (matchOf[b] < 0 || tryG(matchOf[b])) { matchOf[b] = x; return true; }
        }
        return false;
      };
      if (tryG(g)) size++;
      else if (stopOnFail) return -1;
    }
    return size;
  }
  const matchAll = (adjM, m) => matching(adjM, m, true) === m;
  const maxMatch = (adjM, m) => matching(adjM, m, false);
  let markStamp = 0;

  function feasible(p, i) {
    if (forbid[p * NN + i]) return false;
    const r = (i / W) | 0, c = i % W;
    if ((rowUsed >> r) & 1 || (colUsed >> c) & 1) return false;
    const room = roomOf[i];
    if (aloner[room] > 0) return false;
    if (alonePos[p] && roomCount[room] > 0) return false;
    if (victim >= 0) {
      if (p === victim) { if (roomCount[room] > 1) return false; }
      else if (pos[victim] >= 0 && roomOf[pos[victim]] === room && roomCount[room] >= 2) return false;
    }
    const bs = bin[p];
    for (let x = 0; x < bs.length; x++) {
      const o = pos[bs[x].o];
      if (o >= 0 && !bs[x].t(i, o)) return false;
    }
    for (let x = 0; x < posFinals.length; x++) {
      const f = posFinals[x];
      if (f.p === p) {
        // il doit rester une case-cible (objet du bon type, bien orientée) occupée ou occupable
        const tg = targetsOf(f, i);
        let found = false;
        for (let y = 0; y < tg.length && !found; y++) {
          const j = tg[y];
          const occ = occupant[j];
          if (occ >= 0) { found = occ !== p; continue; }
          const rj = (j / W) | 0, cj = j % W;
          if ((rowUsed >> rj) & 1 || (colUsed >> cj) & 1 || rj === r || cj === c) continue;
          for (const q of f.sitters) if (pos[q] < 0 && inDom[q][j]) { found = true; break; }
        }
        if (!found) return false;
      }
    }
    for (let x = 0; x < negFinals.length; x++) {
      const { p: s, cc } = negFinals[x];
      if (s === p) {
        for (let q = 0; q < n; q++) if (q !== p && pos[q] >= 0 && cellType[pos[q]] === cc.type && cc.test(i, pos[q])) return false;
      } else if (pos[s] >= 0 && cellType[i] === cc.type && cc.test(pos[s], i)) return false;
    }
    return true;
  }
  function finalOk() {
    if (victim >= 0 && roomCount[roomOf[pos[victim]]] !== 2) return false;
    for (let p = 0; p < n; p++) if (aloneNeg[p] && roomCount[roomOf[pos[p]]] < 2) return false;
    for (const { p, cc } of finals) {
      let found = false;
      for (let q = 0; q < n; q++) {
        if (q !== p && cellType[pos[q]] === cc.type && cc.test(pos[p], pos[q])) { found = true; break; }
      }
      if (found === cc.not) return false;
    }
    return true;
  }
  function place(p, i) {
    pos[p] = i; occupant[i] = p; rowUsed |= 1 << ((i / W) | 0); colUsed |= 1 << (i % W);
    const room = roomOf[i]; roomCount[room]++; if (alonePos[p]) aloner[room]++;
  }
  function unplace(p) {
    const i = pos[p]; pos[p] = -1; occupant[i] = -1;
    rowUsed &= ~(1 << ((i / W) | 0)); colUsed &= ~(1 << (i % W));
    const room = roomOf[i]; roomCount[room]--; if (alonePos[p]) aloner[room]--;
  }
  let nodes = 0;
  function dfs(depth) {
    if (++nodes > budget) return;
    if (depth === n) {
      if (finalOk()) out.push(new Int16Array(pos));
      return;
    }
    // Indices « {on:…} » positifs dont le sujet est placé mais pas encore satisfaits :
    // quelqu'un doit occuper l'une des cases-cibles ; on peut brancher directement dessus.
    let fOpts = null;
    for (let x = 0; x < posFinals.length; x++) {
      const f = posFinals[x];
      if (pos[f.p] < 0) continue;
      const tg = targetsOf(f, pos[f.p]);
      let sat = false;
      for (let y = 0; y < tg.length; y++) if (occupant[tg[y]] >= 0) { sat = true; break; }
      if (sat) continue;
      const opts = [];
      for (let y = 0; y < tg.length; y++) {
        const j = tg[y];
        for (const q of f.sitters) if (pos[q] < 0 && inDom[q][j] && feasible(q, j)) opts.push(q, j);
      }
      if (!opts.length) return;
      if (!fOpts || opts.length < fOpts.length) fOpts = opts;
    }
    // pièces où il manque encore quelqu'un
    const stamp = ++markStamp;
    let missing = 0;
    for (let x = 0; x < needers.length; x++) {
      const q = needers[x];
      if (pos[q] < 0) continue;
      const rm = roomOf[pos[q]];
      if (roomCount[rm] === 1 && roomMark[rm] !== stamp) { roomMark[rm] = stamp; missing++; }
    }
    let bestCnt = 0, best = -1, bestCount = 1e9, bestBuf = bufA[depth], scratch = bufB[depth];
    let rowsCov = 0, colsCov = 0, k = 0;
    const rc = rcAdj[depth], rcF = rcFree[depth];
    rc.fill(0); rcF.fill(0);
    const rl = roomCap ? roomLines[depth] : null;
    if (roomCap) rl.fill(0);
    const vRoomNow = victim >= 0 && pos[victim] >= 0 ? roomOf[pos[victim]] : -1;
    for (let p = 0; p < n; p++) {
      if (pos[p] >= 0) continue;
      const d = domains[p];
      let cnt = 0, pr = 0, pc = 0, pm = 0;
      for (let x = 0; x < d.length; x++) {
        const i = d[x];
        if (feasible(p, i)) {
          scratch[cnt++] = i;
          const r = (i / W) | 0, c = i % W;
          pr |= 1 << r; pc |= 1 << c;
          if (roomCap) { const rm = roomOf[i]; pm |= 1 << rm; if (primRows) rl[rm * NP + r] |= 1 << c; else rl[rm * NP + c] |= 1 << r; }
          if (primRows) { rc[r] |= 1 << c; if (roomOf[i] !== vRoomNow) rcF[r] |= 1 << c; }
          else { rc[c] |= 1 << r; if (roomOf[i] !== vRoomNow) rcF[c] |= 1 << r; }
          if (missing) { const rm = roomOf[i]; if (roomMark[rm] === stamp) { roomMark[rm] = -stamp; missing--; } }
        }
      }
      if (cnt === 0) return;
      rowsCov |= pr; colsCov |= pc;
      if (roomCap) { pMask[k] = pm; pIdx[k] = p; }
      pRows[k] = pr; pCols[k] = pc; k++;
      // ordres de branchement (plan rectangulaire) : 1 = la victime et les personnes seules d'abord
      // (effets globaux sur les pièces) ; 2 = domaine / nombre de contraintes avec des personnes non placées
      let eff = cnt;
      if (prio === 1) { if (alonePos[p] || p === victim) eff = cnt / 1000; }
      else if (prio === 2) { let deg = 1; const bs = bin[p]; for (let x = 0; x < bs.length; x++) if (pos[bs[x].o] < 0) deg++; eff = cnt / deg; }
      if (eff < bestCount) { bestCount = eff; best = p; const t = bestBuf; bestBuf = scratch; scratch = t; bestCnt = cnt; }
    }
    if (missing > 0) return;
    if (exactLines) {
      // la (ou les) dimension(s) de taille n doi(ven)t être entièrement couverte(s)
      if (rowsExact && (rowsCov | rowUsed) !== fullRows) return;
      if (colsExact && (colsCov | colUsed) !== fullCols) return;
      // couplages : personnes ↔ lignes, personnes ↔ colonnes, et lignes libres de la dimension
      // couverte ↔ lignes de l'autre dimension (cases encore utilisables)
      if (k > 1 && (!matchAll(pRows, k) || !matchAll(pCols, k))) return;
      if (k > 1) {
        const used = primRows ? rowUsed : colUsed;
        let m = 0;
        for (let r = 0; r < NP; r++) if (!((used >> r) & 1)) pRows[m++] = rc[r];
        if (!matchAll(pRows, m)) return;
        // la pièce de la victime n'accueille plus que (2 - occupants) personnes
        if (vRoomNow >= 0) {
          m = 0;
          for (let r = 0; r < NP; r++) if (!((used >> r) & 1)) pRows[m++] = rcF[r];
          if (maxMatch(pRows, m) < m - (2 - roomCount[vRoomNow])) return;
        }
      }
    }
    if (roomCap && k > 0) {
      // Capacité des pièces : nombre maximal de personnes encore plaçables dans chaque pièce
      // (couplage lignes ↔ colonnes sur ses cases utilisables), borné par les règles
      // (pièce de la victime : 2 en tout ; personne seule : 1). Les personnes dont toutes les
      // cases possibles sont dans une même pièce doivent y tenir, et tout le monde doit tenir quelque part.
      forced.fill(0); fAl.fill(0); fV.fill(0);
      for (let x = 0; x < k; x++) {
        const pm = pMask[x];
        if ((pm & (pm - 1)) === 0) {
          const rm = 31 - Math.clz32(pm), q = pIdx[x];
          forced[rm]++; if (alonePos[q]) fAl[rm] = 1; if (q === victim) fV[rm] = 1;
        }
      }
      const used = primRows ? rowUsed : colUsed;
      let tot = 0;
      for (let rm = 0; rm < R; rm++) {
        let m = 0, any = 0;
        for (let r = 0; r < NP; r++) if (!((used >> r) & 1)) { const b = rl[rm * NP + r]; any |= b; pRows[m++] = b; }
        let U = any ? maxMatch(pRows, m) : 0;
        if (rm === vRoomNow || fV[rm]) U = Math.min(U, 2 - roomCount[rm]);
        if (fAl[rm]) U = Math.min(U, 1 - roomCount[rm]);
        if (forced[rm] > U) return;
        tot += U;
      }
      if (tot < k) return;
    }
    if (fOpts && fOpts.length / 2 < bestCount) {
      // branche k : l'option k est vraie, les options précédentes sont interdites (pas de doublon)
      for (let x = 0; x < fOpts.length; x += 2) {
        const q = fOpts[x], j = fOpts[x + 1];
        if (!forbid[q * NN + j] && feasible(q, j)) {
          place(q, j);
          dfs(depth + 1);
          unplace(q);
        }
        forbid[q * NN + j]++;
        if (out.length >= max || nodes > budget) break;
      }
      for (let x = 0; x < fOpts.length; x += 2) forbid[fOpts[x] * NN + fOpts[x + 1]]--;
      return;
    }
    if (rng) for (let x = bestCnt - 1; x > 0; x--) { const y = Math.floor(rng() * (x + 1)); const t = bestBuf[x]; bestBuf[x] = bestBuf[y]; bestBuf[y] = t; }
    for (let x = 0; x < bestCnt; x++) {
      place(best, bestBuf[x]);
      dfs(depth + 1);
      unplace(best);
      if (out.length >= max || nodes > budget) return;
    }
  }
  dfs(0);
  out.done = out.length >= max || nodes <= budget;
  return out;
}

// Recherche exacte (au plus `max` solutions). Carré : une seule recherche (comportement historique).
// Rectangle : la liberté des lignes non couvertes rend certaines recherches très inégales selon
// l'ordre de branchement ; on alterne trois ordres avec des budgets croissants (toute solution
// trouvée est valide ; la première recherche menée à terme donne la réponse exacte).
// `limit` (rectangle seulement) borne le budget : au-delà, le résultat porte done = false.
function solveExact(ctx, comp, max, limit = Infinity) {
  if (ctx.H === ctx.W) return solveCore(ctx, comp, max);
  const seen = new Map();
  for (let b = 3000; ; b *= 4) {
    for (const prio of [0, 1, 2]) {
      const res = solveCore(ctx, comp, max, null, b, prio);
      if (res.done) return res;
      for (const sol of res) { const key = sol.join(','); if (!seen.has(key)) seen.set(key, sol); }
      if (seen.size >= max) return Array.from(seen.values()).slice(0, max);
    }
    if (b >= limit) {
      const out = Array.from(seen.values());
      out.done = false;
      return out;
    }
  }
}

function posToPlacements(ctx, pos) {
  const o = {};
  ctx.people.forEach((p, i) => { o[p.id] = [(pos[i] / ctx.W) | 0, pos[i] % ctx.W]; });
  return o;
}

// Indices d'un suspect menteur : chacun est faux, c'est-à-dire que sa négation est vraie.
const negClue = c => (c && typeof c === 'object' ? { ...c, not: !c.not } : c);

// Témoin menteur : union, sur chaque suspect s ayant au moins un indice, des dispositions où les
// indices de s sont tous faux et tous les autres vrais (ensembles disjoints). `vacuous` (génération) :
// un suspect encore sans indice peut aussi « mentir » (un seul ensemble suffit pour eux tous : tous les
// indices vrais) ; c'est un sur-ensemble, donc prudent pour prouver l'unicité.
function solveLiar(ctx, cluesByIdx, max, limit = Infinity, vacuous = false) {
  const out = [];
  out.liars = [];
  let done = true, vac = false;
  for (let s = 0; s < ctx.n && out.length < max; s++) {
    if (s === ctx.victim) continue;
    const own = cluesByIdx[s] || [];
    if (!own.length) { if (!vacuous || vac) continue; vac = true; }
    const set = cluesByIdx.map((list, p) => (p === s ? (list || []).map(negClue) : list || []));
    const comp = compileSet(ctx, set);
    // plan carré : solveExact ignore `limit` ; un budget fini (génération) borne la recherche
    const res = ctx.H === ctx.W && limit !== Infinity ? solveCore(ctx, comp, max - out.length, null, limit) : solveExact(ctx, comp, max - out.length, limit);
    if (res.done === false) done = false;
    for (const sol of res) { out.push(sol); out.liars.push(s); }
  }
  out.done = done || out.length >= max;
  return out;
}

function solvePositions(ctx, max) {
  const clues = ctx.people.map(p => p.clues);
  if (ctx.liar) return solveLiar(ctx, clues, max);
  return solveExact(ctx, compileSet(ctx, clues), max);
}

export function solve(level, { max = 2 } = {}) {
  const L = prepare(level), ctx = L[PREP];
  return solvePositions(ctx, max).map(pos => posToPlacements(ctx, pos));
}

/* ------------------------------------------------------------------ */
/* Texte français                                                      */
/* ------------------------------------------------------------------ */

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const VOWEL = /^[aeiouyàâäæéèêëîïôöœùûü]/i;
const startsVowel = s => VOWEL.test(String(s));
// « h » muet : élision et contraction (« l'Hôtel », « de l'Horloge », « l'Herbier »), sauf pour les
// mots courants à « h » aspiré (« le Hall », « le Hangar », « la Halle », « le hamac », « le Hublot »).
const H_ASPIRE = new Set(('hache hachoir haie haillon haine halage halle hall halte hamac hamburger hameau hammam hamster '
  + 'hanche handball hangar hanneton harde hareng haricot harnais harpe hasard hâte hauban hausse haut hautbois hauteur '
  + 'havre hayon hennin héron héros hérisson hêtre heurtoir hibou hiboux hiérarchie hippie hobby hockey hollande homard '
  + 'honte hoquet horde hors hotte houblon houle houppe housse houx hublot huche huguenot huit hune hurlement hussard hutte').split(' '));
function elides(s) {
  const w = String(s).trim();
  if (/^y[aeiouyàâéèêëîïôöùûü]/i.test(w)) return false; // « la yourte », « de Yasmine »
  if (VOWEL.test(w)) return true;
  if (!/^h/i.test(w)) return false;
  const first = w.split(/[\s'’-]+/)[0].toLowerCase();
  return !H_ASPIRE.has(first) && !H_ASPIRE.has(first.replace(/[sx]$/, ''));
}

function objInfo(type) {
  return OBJECTS[type] || { g: 'm', n: String(type), pl: String(type) };
}
// Groupe nominal d'un objet : prep '' | 'de' | 'que'. Défini si l'objet est unique dans le niveau.
function objNP(ctx, type, prep = '') {
  const o = objInfo(type);
  const noun = `<b>${escapeHTML(o.n)}</b>`;
  const v = elides(o.n), f = o.g === 'f';
  if (prep === 'pasde') return (v ? "d'" : 'de ') + noun; // négation de l'indéfini : « pas de piano »
  if (ctx.typeCount[type] === 1) {
    if (prep === 'de') return (v ? "de l'" : f ? 'de la ' : 'du ') + noun;
    if (prep === 'que') return (v ? "que l'" : f ? 'que la ' : 'que le ') + noun;
    return (v ? "l'" : f ? 'la ' : 'le ') + noun;
  }
  if (prep === 'de') return (f ? "d'une " : "d'un ") + noun;
  if (prep === 'que') return (f ? "qu'une " : "qu'un ") + noun;
  return (f ? 'une ' : 'un ') + noun;
}
function nameNP(name, prep = '') {
  const b = `<b>${escapeHTML(name)}</b>`;
  if (prep === 'de') return (startsVowel(name) ? "d'" : 'de ') + b;
  if (prep === 'que') return (startsVowel(name) ? "qu'" : 'que ') + b;
  return b;
}
function onLocution(type, g) {
  const o = objInfo(type);
  const words = (o.on || 'sur').split(' ');
  if (g === 'f' && words.length > 1) words[0] += 'e';
  return words.join(' ');
}
const onPrep = type => (objInfo(type).on || 'sur').split(' ').pop();

const ROOM_G = (() => {
  const m = 'salon bureau jardin dortoir grenier hall couloir atelier cellier garage bar parc verger potager patio porche perron vestibule cabinet studio débarras refuge quai pont port chalet kiosque belvédère préau réfectoire laboratoire labo observatoire boudoir fumoir hangar entrepôt magasin comptoir local lavoir chai cloître château donjon phare sous-sol palier balcon toit bassin bois champ sentier chemin camp campement ponton débarcadère embarcadère auditorium amphithéâtre théâtre foyer vestiaire office sauna solarium spa pavillon manoir moulin musée marché salle-de-bain wagon compartiment bivouac abri chantier dépôt grand petit vieux poste chenil poulailler pigeonnier jardinet square belvédère mess carré pont-promenade cockpit salonnet nid alpage col lac étang ruisseau rivage rocher sommet plateau vallon pré bosquet sous-bois verger cabanon habitat hôtel hôpital herbier hublot hémicycle héliport hippodrome hangar hammam'.split(' ');
  const f = 'cuisine chambre salle cave terrasse véranda bibliothèque buanderie serre cour galerie loge suite mezzanine piscine plage forêt clairière grange écurie étable remise cabane tour crypte chapelle nef sacristie alcôve antichambre roseraie pinède prairie rive berge jetée cale cabine passerelle dune grotte pergola tonnelle orangerie cantine réserve boutique vitrine scène coulisse salle-à-manger lingerie bergerie halle gare station cabane-perchée allée place esplanade digue baie crique falaise montagne colline grande petite vieille chaufferie infirmerie salle-de-jeux arrière-boutique arrière-cour basse-cour ferme maison villa auberge taverne guinguette verrière rotonde laverie mansarde soupente baraque hutte yourte caravane péniche barge écluse marina dépendance laiterie fromagerie boulangerie forge horloge hôtellerie halte'.split(' ');
  const p = 'combles coulisses douches toilettes thermes communs cuisines écuries jardins bains'.split(' ');
  const map = new Map();
  m.forEach(w => map.set(w, 'm')); f.forEach(w => map.set(w, 'f')); p.forEach(w => map.set(w, 'p'));
  return map;
})();

// Lieux « ouverts » où l'on est « sur » plutôt que « dans ».
const ROOM_SUR = new Set('terrasse balcon toit quai pont ponton jetée plage place esplanade digue passerelle scène palier perron parvis rivage berge rive sommet plateau falaise dune pont-promenade embarcadère débarcadère'.split(' '));

function roomPhrase(ctx, key) {
  const rm = ctx.lvl.rooms.find(r => r && String(r.key) === String(key));
  const name = String(rm && rm.name != null && rm.name !== '' ? rm.name : key);
  const prepOf = s => (ROOM_SUR.has(s.trim().split(/\s+/)[0].toLowerCase()) ? 'sur' : 'dans');
  let m = name.match(/^(le|la|les)\s+(.+)$/i);
  if (m) return `${prepOf(m[2])} ${m[1].toLowerCase()} <b>${escapeHTML(m[2])}</b>`;
  m = name.match(/^l['’]\s*(.+)$/i);
  if (m) return `${prepOf(m[1])} l'<b>${escapeHTML(m[1])}</b>`;
  let g = rm && ['m', 'f', 'p'].includes(rm.g) ? rm.g : null;
  if (!g) g = ROOM_G.get(name.trim().split(/\s+/)[0].toLowerCase()) || null;
  const b = `<b>${escapeHTML(name)}</b>`;
  const prep = prepOf(name);
  if (g === 'p') return `${prep} les ${b}`;
  if (g) return `${prep} ${elides(name) ? "l'" : g === 'f' ? 'la ' : 'le '}${b}`;
  return `dans la pièce ${b}`;
}

// Directions telles que le joueur les voit sur le plan (N = haut, S = bas, E = droite, W = gauche).
const DIR_REL = { N: 'au-dessus', S: 'en dessous', E: 'à droite', W: 'à gauche' };

function personOf(ctx, person) {
  if (person && typeof person === 'object') return person;
  const i = ctx.pidx.get(String(person));
  return i == null ? { id: person, name: String(person), gender: 'm' } : ctx.people[i];
}
function nameOf(ctx, id) {
  const i = ctx.pidx.get(String(id));
  return i == null ? String(id) : String(ctx.people[i].name ?? id);
}

export function clueHTML(level, person, clue) {
  const ctx = ctxOf(level);
  const P = personOf(ctx, person);
  const fem = P.gender === 'f';
  const S = fem ? 'Elle' : 'Il';
  const pron = fem ? 'elle' : 'lui';
  const not = !!(clue && clue.not);
  const v = not ? "n'était" : 'était';
  const pas = s => (not ? `pas ${s}` : s);
  if (!clue) return '';
  switch (clue.t) {
    case 'room':
      return `${S} ${v} ${not ? '<b>pas</b> ' : ''}${roomPhrase(ctx, clue.room)}.`;
    case 'on':
      return `${S} ${v} <b>${pas(onLocution(clue.obj, P.gender))}</b> ${objNP(ctx, clue.obj)}.`;
    case 'beside':
      return `${S} ${v} <b>${pas('à côté')}</b> ${objNP(ctx, clue.obj, 'de')}.`;
    case 'besidePerson':
      return `${S} ${v} <b>${pas('à côté')}</b> ${nameNP(nameOf(ctx, clue.who), 'de')}.`;
    case 'with':
      return `${S} ${v} <b>${pas('avec')} ${escapeHTML(nameOf(ctx, clue.who))}</b>.`;
    case 'alone':
      return `${S} ${v} <b>${pas(fem ? 'seule' : 'seul')}</b> dans sa pièce.`;
    case 'sameRow':
      return `${S} ${v} <b>${pas('sur la même ligne')}</b> ${objNP(ctx, clue.obj, 'que')}.`;
    case 'sameCol':
      return `${S} ${v} <b>${pas('dans la même colonne')}</b> ${objNP(ctx, clue.obj, 'que')}.`;
    case 'sees':
      if (!not) return `${S} <b>voyait</b> ${objNP(ctx, clue.obj)}.`;
      return `${S} <b>ne voyait pas</b> ${ctx.typeCount[clue.obj] === 1 ? objNP(ctx, clue.obj) : objNP(ctx, clue.obj, 'pasde')}.`;
    case 'dir': {
      // Lignes et colonnes, gauche / droite / au-dessus / en dessous (le nord du plan est en haut).
      const dir = DIRS.includes(clue.dir) ? clue.dir : 'N';
      const of = clue.of || {};
      const exact = typeof clue.exact === 'number' ? clue.exact : null;
      const vert = dir === 'N' || dir === 'S';
      let target;
      if (of.who != null) target = nameNP(nameOf(ctx, of.who), 'de');
      else if (of.obj != null) target = objNP(ctx, of.obj, 'de');
      else target = `de quelqu'un se trouvant ${escapeHTML(onPrep(of.on))} ${objNP(ctx, of.on)}`;
      const neg = not ? ' <b>pas</b>' : '';
      if (exact == null) {
        const frame = vert ? 'sur une ligne' : 'dans une colonne';
        return `${S} ${v}${neg} ${frame} <b>${DIR_REL[dir]}</b> de celle ${target}.`;
      }
      const unit = `${exact} ${vert ? 'ligne' : 'colonne'}${exact > 1 ? 's' : ''}`;
      return `${S} ${v}${neg} exactement <b>${unit} ${DIR_REL[dir]}</b> ${target}.`;
    }
  }
  return '';
}

export function victimHTML(level, person) {
  const ctx = ctxOf(level);
  const P = personOf(ctx, person);
  const fem = P.gender === 'f';
  return `<b>La victime.</b> ${fem ? 'Elle' : 'Il'} était <b>${fem ? 'seule' : 'seul'} avec</b> le meurtrier.`;
}

export function personCluesHTML(level, person) {
  const L = prepare(level), ctx = L[PREP];
  const P = personOf(ctx, person);
  const out = [];
  if (P.victim) out.push(victimHTML(L, P));
  for (const c of P.clues || []) out.push(clueHTML(L, P, c));
  return out;
}

/* ------------------------------------------------------------------ */
/* Génération d'indices                                                */
/* ------------------------------------------------------------------ */

function hashSeed(seed) {
  const s = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEIGHTS = {
  1: { room: 6, on: 6, beside: 6, with: 1.5, besidePerson: 1, alone: 1, dir: 0.12, dirExact: 0.03, dirOn: 0.02, same: 0.25, neg: 0.15 },
  2: { room: 3, on: 3, beside: 3, with: 3, besidePerson: 3, alone: 2, dir: 1, dirExact: 0.35, dirOn: 0.3, same: 1, neg: 0.7 },
  3: { room: 1.2, on: 1.2, beside: 2, with: 2, besidePerson: 2, alone: 1.5, dir: 3.5, dirExact: 2, dirOn: 2.5, same: 3, neg: 1.3 },
};

function enumerateCandidates(ctx, pos, p) {
  const { W, NN, n, cellRoom, cellType, blocked } = ctx;
  const victim = ctx.victim;
  const ip = pos[p], r = (ip / W) | 0, c = ip % W;
  // écart exact proposé : jusqu'à 3 sur un plan carré ; sans limite sur un plan rectangulaire, où
  // les grandes lignes vides rendent la victime difficile à situer autrement
  const XM = ctx.H === ctx.W ? 3 : Math.max(ctx.H, ctx.W) - 1;
  const unblocked = [];
  for (let i = 0; i < NN; i++) if (!blocked[i]) unblocked.push(i);
  const out = [];
  const seen = new Set();
  const add = (clue, cat, sym = null) => {
    const key = JSON.stringify(clue);
    if (seen.has(key)) return;
    seen.add(key);
    const cc = compileClue(ctx, p, clue);
    if (evalCompiled(ctx, p, cc, pos) !== true) return;
    let set = null;
    if (cc.kind === 'unary') {
      set = new Uint8Array(NN);
      let cnt = 0;
      for (const i of unblocked) if (cc.f(i) !== cc.not) { set[i] = 1; cnt++; }
      if (cnt === unblocked.length) return; // trivial
    }
    out.push({ clue, cat, neg: !!clue.not, cc, set, sym, sel: set ? 1 - set.reduce((a, b) => a + b, 0) / unblocked.length : 0.5 });
  };
  const types = Object.keys(ctx.typeCount).filter(t => OBJECTS[t]);
  const occTypes = types.filter(t => OBJECTS[t].occ);
  // room
  const myRoom = ctx.roomKeys[cellRoom[ip]];
  if (myRoom != null) add({ t: 'room', room: myRoom }, 'room');
  ctx.roomKeys.forEach((k, ri) => { if (ri !== cellRoom[ip]) add({ t: 'room', room: k, not: true }, 'room'); });
  // on
  if (cellType[ip] && OBJECTS[cellType[ip]] && OBJECTS[cellType[ip]].occ) add({ t: 'on', obj: cellType[ip] }, 'on');
  for (const t of occTypes) if (t !== cellType[ip]) add({ t: 'on', obj: t, not: true }, 'on');
  // beside
  // (pas d'indice « à côté » du type sur lequel la personne se trouve : vrai mais déroutant)
  for (const t of types) {
    if (t === cellType[ip]) continue;
    add({ t: 'beside', obj: t }, 'beside'); add({ t: 'beside', obj: t, not: true }, 'beside');
  }
  // sameRow / sameCol
  for (const t of types) {
    if (t === cellType[ip]) continue;
    for (const tt of ['sameRow', 'sameCol']) { add({ t: tt, obj: t }, 'same'); add({ t: tt, obj: t, not: true }, 'same'); }
  }
  // alone
  add({ t: 'alone' }, 'alone'); add({ t: 'alone', not: true }, 'alone');
  // with / besidePerson (jamais envers la victime)
  for (let q = 0; q < n; q++) {
    if (q === p || q === victim) continue;
    const who = ctx.people[q].id;
    const pair = p < q ? `${p}|${q}` : `${q}|${p}`;
    const sameRoom = cellRoom[pos[q]] === cellRoom[ip];
    add({ t: 'with', who }, 'with', `with|${pair}`);
    add({ t: 'with', who, not: true }, 'with', `withN|${pair}`);
    if (sameRoom) {
      add({ t: 'besidePerson', who }, 'besidePerson', `bp|${pair}`);
      add({ t: 'besidePerson', who, not: true }, 'besidePerson', `bpN|${pair}`);
    }
  }
  // dir : personnes (jamais envers la victime)
  for (let q = 0; q < n; q++) {
    if (q === p || q === victim) continue;
    const who = ctx.people[q].id;
    const rq = (pos[q] / W) | 0, cq = pos[q] % W;
    const pair = p < q ? `${p}|${q}` : `${q}|${p}`;
    const axisSym = d => (d === 'N' || d === 'S' ? 'NS' : 'EW');
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { who } }, 'dir', `dir|${axisSym(d)}|${pair}`);
      add({ t: 'dir', dir: d, of: { who }, not: true }, 'dir', `dirN|${axisSym(d)}|${pair}`);
    }
    const dr = rq - r, dc = c - cq;
    if (dr !== 0 && Math.abs(dr) <= XM) add({ t: 'dir', dir: dr > 0 ? 'N' : 'S', of: { who }, exact: Math.abs(dr) }, 'dirExact', `dirX|NS|${pair}`);
    if (dc !== 0 && Math.abs(dc) <= XM) add({ t: 'dir', dir: dc > 0 ? 'E' : 'W', of: { who }, exact: Math.abs(dc) }, 'dirExact', `dirX|EW|${pair}`);
  }
  // dir : objets
  for (const t of types) {
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { obj: t } }, 'dir');
      add({ t: 'dir', dir: d, of: { obj: t }, not: true }, 'dir');
    }
    for (const b of ctx.typeBoxes[t]) {
      const ks = { N: b.r0 - r, S: r - b.r1, W: b.c0 - c, E: c - b.c1 };
      for (const d of DIRS) if (ks[d] > 0 && ks[d] <= XM) add({ t: 'dir', dir: d, of: { obj: t }, exact: ks[d] }, 'dirExact');
    }
  }
  // dir : quelqu'un sur un objet
  for (const t of occTypes) {
    const sitters = [];
    for (let q = 0; q < n; q++) if (q !== p && cellType[pos[q]] === t) sitters.push(q);
    // (la victime sur un objet de ce type en ferait une cible déguisée)
    if (!sitters.length || (victim >= 0 && victim !== p && cellType[pos[victim]] === t)) continue;
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { on: t } }, 'dirOn');
      add({ t: 'dir', dir: d, of: { on: t }, not: true }, 'dirOn');
    }
    for (const q of sitters) {
      const rq = (pos[q] / W) | 0, cq = pos[q] % W;
      const dr = rq - r, dc = c - cq;
      if (dr !== 0 && Math.abs(dr) <= XM) add({ t: 'dir', dir: dr > 0 ? 'N' : 'S', of: { on: t }, exact: Math.abs(dr) }, 'dirOn');
      if (dc !== 0 && Math.abs(dc) <= XM) add({ t: 'dir', dir: dc > 0 ? 'E' : 'W', of: { on: t }, exact: Math.abs(dc) }, 'dirOn');
    }
  }
  // Normalise les poids par catégorie (sinon les catégories nombreuses — directions — écrasent les autres).
  const per = {};
  for (const c of out) per[c.cat] = (per[c.cat] || 0) + 1;
  for (const c of out) c.norm = 1 / per[c.cat];
  return out;
}

// Difficulté 1 : indices simples d'abord (pièce, objet, à côté, seul ; au plus un « avec » ou
// « même ligne / colonne » ; au plus une négation). Les autres types ne servent qu'en repli.
const SIMPLE_T = new Set(['room', 'on', 'beside', 'alone', 'with', 'sameRow', 'sameCol']);
const LIMITED_T = new Set(['with', 'sameRow', 'sameCol']);
const SIMPLE_TRIES = 12; // au-delà, presque aucune réussite supplémentaire (mesuré sur les 24 niveaux)

// Candidat « mensonge » : la négation d'un indice vrai (donc faux dans la solution).
function flipCandidate(ctx, p, cand, unblocked) {
  const clue = clone(cand.clue);
  if (clue.not) delete clue.not; else clue.not = true;
  const cc = compileClue(ctx, p, clue);
  let set = null, sel = 0.5;
  if (cand.set) {
    set = new Uint8Array(ctx.NN);
    let cnt = 0;
    for (const i of unblocked) if (!cand.set[i]) { set[i] = 1; cnt++; }
    sel = 1 - cnt / unblocked.length;
  }
  return { clue, cat: cand.cat, neg: !!clue.not, cc, set, sym: cand.sym, sel, norm: cand.norm };
}

// Options : difficulty (1 à 3), seed, liar (témoin menteur). `sees: false` désactive le remplacement
// occasionnel par un « voyait » (difficultés 2 et 3 : on retrouve alors exactement l'ancien générateur).
export function generateClues(level, solution, { difficulty = 1, seed = 1, liar, sees = true } = {}) {
  const raw = clone(level && level[PREP] ? stripPrep(level) : (level || {}));
  // Sans précision, un niveau qui porte la variante « témoin menteur » reçoit des indices à menteur.
  if (liar === undefined) liar = !!(raw.twist && raw.twist.liar);
  (raw.people || []).forEach(p => { p.clues = []; });
  const L = prepare(raw), ctx = L[PREP];
  const { n, count } = ctx;
  if (n === 0 || n !== count || ctx.victim < 0) return null;
  const pos = readPlacements(ctx, solution);
  if (Array.from(pos).some(x => x < 0)) return null;
  const rows = new Set(), cols = new Set();
  for (let p = 0; p < n; p++) {
    if (ctx.blocked[pos[p]]) return null;
    rows.add((pos[p] / ctx.W) | 0); cols.add(pos[p] % ctx.W);
  }
  // Un plan rectangulaire laisse plus de liberté : un suspect peut y recevoir un 3e indice si nécessaire.
  const rect = ctx.H !== ctx.W;
  const maxCap = rect ? 3 : 2;
  const attempts = rect ? 40 : 30;
  if (rows.size !== n || cols.size !== n) return null;
  const vRoom = ctx.cellRoom[pos[ctx.victim]];
  let cntV = 0;
  for (let p = 0; p < n; p++) if (ctx.cellRoom[pos[p]] === vRoom) cntV++;
  if (cntV !== 2) return null;

  const dLevel = Math.min(3, Math.max(1, difficulty | 0));
  const W = WEIGHTS[dLevel] || WEIGHTS[1];
  const suspects = [];
  for (let p = 0; p < n; p++) if (p !== ctx.victim) suspects.push(p);
  if (liar && suspects.length < 2) return null;
  // Tous les indices vrais de chaque suspect ; jamais d'indice peu lisible (négation d'une position
  // relative) dans ce qui est proposé : un témoin sincère n'affirme que des indices lisibles, et le
  // menteur reçoit la négation d'un indice vrai seulement si elle reste lisible (affirmation fausse).
  const allCands = [];
  for (let p = 0; p < n; p++) allCands.push(p === ctx.victim ? [] : enumerateCandidates(ctx, pos, p));
  const baseCands = allCands.map(list => list.filter(c => !isAwkwardClue(c.clue)));
  const unblocked = [];
  for (let i = 0; i < ctx.NN; i++) if (!ctx.blocked[i]) unblocked.push(i);
  const liarCands = new Map();
  const candsFor = Lr => {
    if (Lr < 0) return baseCands;
    if (!liarCands.has(Lr)) {
      const c = baseCands.slice();
      c[Lr] = allCands[Lr].map(x => flipCandidate(ctx, Lr, x, unblocked)).filter(x => !isAwkwardClue(x.clue));
      liarCands.set(Lr, c);
    }
    return liarCands.get(Lr);
  };

  const samePos = a => { for (let p = 0; p < n; p++) if (a[p] !== pos[p]) return false; return true; };
  // Plan rectangulaire : budget de preuve par vérification d'unicité (le résultat rendu est toujours prouvé).
  const PROOF_LIMIT = 48000;
  // Recherche exacte (au plus 2) selon la règle du niveau : classique, ou témoin menteur `Lr`.
  const exactOf = (lists, Lr) => (Lr < 0
    ? solveExact(ctx, compileSet(ctx, lists), 2, PROOF_LIMIT)
    : solveLiar(ctx, lists, 2, PROOF_LIMIT, true));
  const isUniqueFor = (chosen, Lr) => {
    const res = exactOf(chosen.map(list => list.map(c => c.clue)), Lr);
    return res.done && res.length === 1;
  };

  // Une série de tentatives. `simple` : difficulté 1 restreinte ; `liarAt(attempt)` : menteur ou -1.
  const run = ({ simple = false, liarAt = () => -1, tries = attempts }) => {
    let strict = true, robust = false;
    const weightOf = cand => {
      if (simple && !SIMPLE_T.has(cand.clue.t)) return 0;
      const w = W[cand.cat];
      if (strict && w < 0.2) return 0;
      const v = w * cand.norm * (cand.neg ? W.neg : 1);
      return robust ? Math.sqrt(v) : v;
    };
    for (let attempt = 0; attempt < tries; attempt++) {
      const rng = mulberry32(hashSeed(`${seed}#${attempt}`));
      const Lr = liarAt(attempt);
      const cands = candsFor(Lr);
      strict = attempt < 8;
      robust = attempt >= (rect ? 8 : 18);
      // au plus 2 indices par suspect ; 3 sur un plan rectangulaire, seulement quand on est bloqué à 2
      let cap = 2;
      const chosen = Array.from({ length: n }, () => []);
      const usedSym = new Set();
      const usedCat = {};
      let usedLimited = 0, usedNeg = 0;
      const acceptable = (p, cand) => {
        const list = chosen[p];
        if (list.length >= cap) return false;
        if (simple) {
          if (LIMITED_T.has(cand.clue.t) && usedLimited >= 1) return false;
          if (cand.neg && usedNeg >= 1) return false;
        }
        for (const c of list) {
          if (c === cand) return false;
          if (c.clue.t === cand.clue.t) return false;
          if (c.cat === cand.cat) return false;
        }
        if (cand.sym && usedSym.has(cand.sym)) return false;
        if (cand.set) {
          // redondant si l'intersection des indices unaires actuels implique déjà ce nouvel indice
          const uns = list.filter(c => c.set);
          if (uns.length) {
            let implied = true;
            for (let i = 0; i < ctx.NN && implied; i++) {
              if (ctx.blocked[i]) continue;
              if (uns.every(c => c.set[i]) && !cand.set[i]) implied = false;
            }
            if (implied) return false;
            // et inversement : le nouvel indice rendrait un ancien superflu
            for (const u of uns) {
              let sub = true;
              for (let i = 0; i < ctx.NN; i++) if (cand.set[i] && !u.set[i]) { sub = false; break; }
              if (sub) return false;
            }
            // menteur : ses affirmations doivent rester compatibles entre elles (plausibles)
            if (p === Lr) {
              let some = false;
              for (const i of unblocked) if (cand.set[i] && uns.every(c => c.set[i])) { some = true; break; }
              if (!some) return false;
            }
          }
        }
        return true;
      };
      const pick = options => {
        options = options.filter(o => o.w > 0);
        let tot = 0;
        for (const o of options) tot += o.w;
        if (tot <= 0) return null;
        let x = rng() * tot;
        for (const o of options) { x -= o.w; if (x <= 0) return o; }
        return options[options.length - 1];
      };
      const variety = cand => 1 / (1 + 0.6 * (usedCat[cand.cat] || 0));
      const take = (p, cand) => {
        chosen[p].push(cand);
        if (cand.sym) usedSym.add(cand.sym);
        usedCat[cand.cat] = (usedCat[cand.cat] || 0) + 1;
        if (LIMITED_T.has(cand.clue.t)) usedLimited++;
        if (cand.neg) usedNeg++;
      };
      // échantillon aléatoire (borné) de solutions alternatives ; tags[k] = menteur de alts[k] (-1 : classique)
      const sample = (lists, comp, k, budget) => {
        if (Lr < 0) return { alts: solveCore(ctx, comp, k, rng, budget), tags: null };
        const alts = [], tags = [];
        const sets = [];
        let vac = false;
        for (const s of suspects) {
          if (!lists[s].length) { if (vac) continue; vac = true; }
          sets.push(s);
        }
        const ks = Math.max(3, Math.ceil(k / sets.length)), bs = Math.max(400, Math.ceil(2 * budget / sets.length));
        for (const s of sets) {
          const set = lists.map((l, p) => (p === s ? l.map(negClue) : l));
          for (const a of solveCore(ctx, compileSet(ctx, set), ks, rng, bs)) { alts.push(a); tags.push(s); }
        }
        return { alts, tags };
      };
      // 1) ajouter, tant qu'il reste plusieurs solutions, des indices qui en éliminent un maximum
      //    (échantillon aléatoire de solutions alternatives), pondérés selon la difficulté.
      let ok = false;
      for (let iter = 0, iterMax = (rect ? 3 : 2) * n + 4; iter < iterMax; iter++) {
        const lists = chosen.map(list => list.map(c => c.clue));
        const comp = Lr < 0 ? compileSet(ctx, lists) : null;
        const exact = Lr < 0 ? solveExact(ctx, comp, 2, PROOF_LIMIT) : solveLiar(ctx, lists, 2, PROOF_LIMIT, true);
        // (rectangle : une recherche trop longue reste indécise ; on continue d'ajouter des indices)
        if (exact.done && exact.length === 1) { ok = true; break; }
        if (exact.done && exact.length === 0) break;
        let { alts, tags } = sample(lists, comp, robust ? 60 : 24, robust ? 5000 : 1500);
        if (tags) { const keep = alts.map((a, k) => !samePos(a)); alts = alts.filter((a, k) => keep[k]); tags = tags.filter((t, k) => keep[k]); }
        else alts = alts.filter(x => !samePos(x));
        if (!alts.length) {
          alts = exact.filter(x => !samePos(x));
          if (exact.liars) tags = exact.liars.filter((t, k) => !samePos(exact[k]));
        }
        const opts = [];
        for (const p of suspects) {
          if (chosen[p].length >= cap) continue;
          let moved = false;
          for (const a of alts) if (a[p] !== pos[p]) { moved = true; break; }
          for (const c of cands[p]) {
            if (c.set && !moved && Lr < 0) continue;
            if (!acceptable(p, c)) continue;
            let elim = 0;
            for (let k = 0; k < alts.length; k++) {
              const v = evalCompiled(ctx, p, c.cc, alts[k]);
              if (tags && tags[k] === p ? v === true : v === false) elim++;
            }
            if (!elim) continue;
            const frac = elim / alts.length;
            opts.push({ p, c, w: robust ? weightOf(c) * frac ** 8 : weightOf(c) * variety(c) * frac * frac * (chosen[p].length ? 1 : 1.5) });
          }
        }
        const o = pick(opts);
        if (!o) {
          if (cap < maxCap) { cap = maxCap; continue; }
          break;
        }
        take(o.p, o.c);
      }
      if (ok) {
        // 2) chaque suspect doit avoir au moins un indice
        for (const p of suspects) {
          if (chosen[p].length) continue;
          const o = pick(cands[p].filter(c => acceptable(p, c)).map(c => ({ p, c, w: weightOf(c) * variety(c) * (0.15 + c.sel) })));
          if (!o) { ok = false; break; }
          take(p, o.c);
        }
        // (menteur : un indice ajouté peut ouvrir de nouvelles dispositions, on revérifie)
        if (ok && Lr >= 0 && !isUniqueFor(chosen, Lr)) ok = false;
      }
      if (!ok) continue;
      // 3) retirer les indices superflus (un suspect garde au moins un indice)
      const all = [];
      for (const p of suspects) for (const c of chosen[p]) all.push({ p, c });
      for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
      for (const { p, c } of all) {
        if (chosen[p].length < 2) continue;
        const idx = chosen[p].indexOf(c);
        chosen[p].splice(idx, 1);
        if (!isUniqueFor(chosen, Lr)) chosen[p].splice(idx, 0, c);
      }
      return { chosen, Lr };
    }
    return null;
  };

  let found = null;
  if (liar) {
    const h = hashSeed(`${seed}#liar`);
    const liarAt = attempt => suspects[(h + Math.floor(attempt / 5)) % suspects.length];
    if (dLevel === 1) found = run({ simple: true, liarAt, tries: SIMPLE_TRIES });
    if (!found) found = run({ liarAt });
  } else {
    if (dLevel === 1) found = run({ simple: true, tries: SIMPLE_TRIES });
    if (!found) found = run({});
  }
  if (!found) return null;
  const { chosen, Lr } = found;

  // 4) difficultés 2 et 3 : de temps en temps, un indice est remplacé par un « voyait » (avec parcimonie ;
  //    tirage séparé, le reste de la génération est inchangé)
  if (dLevel >= 2 && sees !== false) {
    const r2 = mulberry32(hashSeed(`${seed}#sees#${dLevel}#${(raw.roomMap || []).join('/')}#${ctx.people.map(p => p.id).join('')}`));
    if (r2() < (dLevel === 2 ? 0.2 : 0.3)) {
      const types = Object.keys(ctx.typeCount).filter(t => OBJECTS[t]);
      const opts = [];
      for (const p of suspects) {
        const want = p !== Lr; // vrai pour un témoin sincère, faux pour le menteur
        for (let idx = 0; idx < chosen[p].length; idx++) {
          if (chosen[p].some((c, k) => k !== idx && c.clue.t === 'sees')) continue;
          for (const t of types) {
            if (t === ctx.cellType[pos[p]]) continue;
            for (const neg of [false]) { // (« ne voyait pas » : peu lisible, jamais produit)
              const clue = neg ? { t: 'sees', obj: t, not: true } : { t: 'sees', obj: t };
              const cc = compileClue(ctx, p, clue);
              if (evalCompiled(ctx, p, cc, pos) !== want) continue;
              let cnt = 0;
              for (const i of unblocked) if (cc.f(i) !== cc.not) cnt++;
              if (cnt === 0 || cnt === unblocked.length) continue;
              opts.push({ p, idx, clue, w: (neg ? 0.3 : 1) * r2() });
            }
          }
        }
      }
      opts.sort((a, b) => b.w - a.w);
      for (const o of opts.slice(0, 10)) {
        const old = chosen[o.p][o.idx];
        chosen[o.p][o.idx] = { clue: o.clue };
        if (isUniqueFor(chosen, Lr)) break;
        chosen[o.p][o.idx] = old;
      }
    }
  }
  const res = {};
  ctx.people.forEach((person, p) => { res[person.id] = chosen[p].map(c => clone(c.clue)); });
  return res;
}

function stripPrep(level) {
  const o = {};
  for (const k of Object.keys(level)) if (k !== 'cells') o[k] = level[k];
  return o;
}

/* ------------------------------------------------------------------ */
/* Aide qui explique                                                   */
/* ------------------------------------------------------------------ */

const NUM_F = ['aucune', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
const numF = k => (k <= 10 ? NUM_F[k] : String(k));
const NARROW_MAX = 6; // au-delà, une liste de cases n'aide plus : on révèle une case
const lowerFirst = h => h.replace(/^(<b>)?(.)/, (m, b, ch) => (b || '') + ch.toLowerCase());

function soleSolution(ctx) {
  if (!('soleSol' in ctx)) {
    const sols = solvePositions(ctx, 2);
    ctx.soleSol = sols.length === 1 ? sols[0] : null;
  }
  return ctx.soleSol;
}

// Phrase « <b>Nom</b> était … et … » à partir des indices de la personne P.
function subjectSentence(ctx, P, clues) {
  const name = `<b>${escapeHTML(P.name)}</b>`;
  const preds = [], texts = [];
  for (const c of clues) {
    const h = clueHTML(ctx.lvl, P, c).replace(/\.$/, '');
    const m = h.match(/^(Il|Elle) /);
    if (m) preds.push(h.slice(m[0].length)); else texts.push(lowerFirst(h));
  }
  if (!preds.length) return `D'après ${name}, ${texts.join(' et ')}`;
  // « était dans le Salon et dans la même colonne que la table » : le verbe n'est pas répété
  const drop = preds[0].startsWith('était ') && !preds[0].includes("quelqu'un");
  const joined = preds.map((x, k) => (k > 0 && drop && x.startsWith('était ') ? x.slice(6) : x));
  return `${name} ${joined.join(' et ')}${texts.length ? `, et ${texts.join(' et ')}` : ''}`;
}

// Options : `prefer` (id du personnage sélectionné par le joueur), `skip` (ids à ne pas proposer :
// « passer à une autre piste » ; ils reviennent quand il ne reste qu'eux à poser).
export function explain(level, placements, { prefer, skip = [] } = {}) {
  const L = prepare(level), ctx = L[PREP];
  const { n, H, W, cellRoom, cellType, blocked } = ctx;
  const pos = readPlacements(ctx, placements);
  const rc = i => [(i / W) | 0, i % W];
  const person = p => ctx.people[p];
  const nm = p => `<b>${escapeHTML(person(p).name)}</b>`;
  const deNm = p => `${elides(person(p).name) ? "d'" : 'de '}${nm(p)}`;
  const queNm = p => `${elides(person(p).name) ? "qu'" : 'que '}${nm(p)}`;
  const fem = p => person(p).gender === 'f';
  const prefIdx = prefer != null && ctx.pidx.has(String(prefer)) ? ctx.pidx.get(String(prefer)) : -1;
  const skipSet = new Set();
  for (const id of Array.isArray(skip) ? skip : []) if (ctx.pidx.has(String(id))) skipSet.add(ctx.pidx.get(String(id)));
  const roomOfCell = i => roomPhrase(ctx, ctx.roomKeys[cellRoom[i]]);
  const cellDesc = (i, p) => {
    let s = cellRoom[i] >= 0 ? roomOfCell(i) : `en ligne ${((i / W) | 0) + 1}, colonne ${(i % W) + 1}`;
    const t = cellType[i];
    if (t && OBJECTS[t] && OBJECTS[t].occ) s += `, ${escapeHTML(onLocution(t, person(p).gender))} ${objNP(ctx, t)}`;
    return s;
  };
  const sol = soleSolution(ctx);
  if (!sol) return { kind: 'reveal', person: null, cell: null, cells: [], html: "Cette enquête n'a pas de solution unique : l'aide n'est pas disponible." };
  const reveal = (p, intro) => ({
    kind: 'reveal', person: person(p).id, cell: rc(sol[p]), cells: [rc(sol[p])],
    html: `${intro} Coup de pouce : ${nm(p)} était ${cellDesc(sol[p], p)}.`,
  });

  // 1) personnage mal placé
  const wrong = [];
  for (let p = 0; p < n; p++) if (pos[p] >= 0 && pos[p] !== sol[p]) wrong.push(p);
  if (wrong.length) {
    const evalP = p => person(p).clues.map(c => evalCompiled(ctx, p, compileClue(ctx, p, c), pos));
    let p = wrong.includes(prefIdx) ? prefIdx : -1;
    if (p < 0 && !ctx.liar) p = wrong.find(q => evalP(q).includes(false)) ?? -1;
    if (p < 0) p = wrong[0];
    const i = pos[p], [r, c] = rc(i);
    const pr = fem(p) ? 'elle' : 'il';
    let why = null;
    if (blocked[i]) why = `${pr} est sur une case occupée par un objet`;
    for (let q = 0; q < n && !why; q++) {
      if (q === p || pos[q] < 0) continue;
      if (((pos[q] / W) | 0) === r) why = `${pr} est dans la même ligne ${queNm(q)}`;
      else if (pos[q] % W === c) why = `${pr} est dans la même colonne ${queNm(q)}`;
    }
    if (!why && ctx.victim >= 0 && pos[ctx.victim] >= 0) {
      let cnt = 0;
      for (let q = 0; q < n; q++) if (pos[q] >= 0 && cellRoom[pos[q]] === cellRoom[pos[ctx.victim]]) cnt++;
      if (cnt > 2 && cellRoom[i] === cellRoom[pos[ctx.victim]]) why = `la pièce de la victime compte plus de deux personnes`;
    }
    if (!why && !ctx.liar) {
      const res = evalP(p), k = res.indexOf(false);
      if (k >= 0) why = `ici, son indice « ${clueHTML(L, person(p), person(p).clues[k])} » n'est pas respecté`;
      for (let q = 0; q < n && !why; q++) {
        if (q === p || pos[q] < 0) continue;
        const cl = person(q).clues.find(c => evalCompiled(ctx, q, compileClue(ctx, q, c), pos) === false);
        if (cl) why = `l'indice de ${nm(q)} « ${clueHTML(L, person(q), cl)} » n'est alors pas respecté`;
      }
    }
    if (!why) why = `rien ne ${fem(p) ? 'la' : 'le'} contredit encore, mais sa bonne case est ailleurs`;
    return { kind: 'wrong', person: person(p).id, cell: [r, c], cells: [[r, c]], html: `${nm(p)} n'est pas à sa place : ${why}.` };
  }
  const unplaced = [];
  for (let p = 0; p < n; p++) if (pos[p] < 0) unplaced.push(p);
  if (!unplaced.length) return { kind: 'done', person: null, cell: null, cells: [], html: 'Tout le monde est à sa place : il ne reste plus qu’à désigner le coupable.' };
  // Personnages que l'on peut proposer : les non posés hors `skip`, ou tous s'il ne reste qu'eux.
  const avail = unplaced.filter(p => !skipSet.has(p));
  const pool = avail.length ? avail : unplaced;
  const inPool = p => pool.includes(p);
  const pref = skipSet.has(prefIdx) ? -1 : prefIdx; // la préférence ne vaut que hors `skip`
  if (ctx.liar) {
    const p = pool.includes(pref) ? pref : pool[0];
    return reveal(p, "Avec un témoin menteur, l'aide ne s'appuie pas sur les indices.");
  }

  // 2) cases possibles de chaque personnage non posé, par élimination à partir de ce qui est visible
  const rowOwner = new Int16Array(H).fill(-1), colOwner = new Int16Array(W).fill(-1);
  const placedIn = new Int16Array(ctx.R + 1);
  const occupant = new Int16Array(ctx.NN).fill(-1);
  for (let p = 0; p < n; p++) {
    if (pos[p] < 0) continue;
    rowOwner[(pos[p] / W) | 0] = p; colOwner[pos[p] % W] = p;
    placedIn[cellRoom[pos[p]] + 1]++; occupant[pos[p]] = p;
  }
  const lineFree = i => rowOwner[(i / W) | 0] < 0 && colOwner[i % W] < 0;
  const base = [];
  for (let i = 0; i < ctx.NN; i++) if (!blocked[i]) base.push(i);
  const v = ctx.victim, vRoom = v >= 0 && pos[v] >= 0 ? cellRoom[pos[v]] : null;
  const info = new Map();
  for (const p of unplaced) {
    const premises = [];
    person(p).clues.forEach(clue => {
      const cc = compileClue(ctx, p, clue);
      let test = null;
      switch (cc.kind) {
        case 'unary': case 'sees': test = i => cc.f(i) !== cc.not; break;
        case 'binary': if (pos[cc.q] >= 0) { const j = pos[cc.q]; test = i => cc.f(i, j) !== cc.not; } break;
        case 'alone':
          if (!cc.not) test = i => placedIn[cellRoom[i] + 1] === 0;
          else if (unplaced.length === 1) test = i => placedIn[cellRoom[i] + 1] > 0;
          break;
        case 'dirOn':
          if (cc.not) test = i => { for (let q = 0; q < n; q++) if (q !== p && pos[q] >= 0 && cellType[pos[q]] === cc.type && cc.test(i, pos[q])) return false; return true; };
          else test = i => {
            for (let j = 0; j < ctx.NN; j++) {
              if (j === i || cellType[j] !== cc.type || !cc.test(i, j)) continue;
              if (occupant[j] >= 0) { if (occupant[j] !== p) return true; continue; }
              if (lineFree(j) && ((j / W) | 0) !== ((i / W) | 0) && j % W !== i % W) return true;
            }
            return false;
          };
          break;
      }
      if (test) premises.push({ owner: p, clue, test, cost: 1 });
    });
    for (let q = 0; q < n; q++) {
      if (q === p || pos[q] < 0) continue;
      for (const clue of person(q).clues) {
        const cc = compileClue(ctx, q, clue), j = pos[q];
        let test = null;
        if (cc.kind === 'binary' && cc.q === p) test = i => cc.f(j, i) !== cc.not;
        else if (cc.kind === 'alone' && !cc.not) test = i => cellRoom[i] !== cellRoom[j];
        else if (cc.kind === 'dirOn' && cc.not) test = i => !(cellType[i] === cc.type && cc.test(j, i));
        if (test) premises.push({ owner: q, clue, test, cost: 1.5 });
      }
    }
    const elims = [{
      test: lineFree, cost: 1, line: true,
      attr: i => (rowOwner[(i / W) | 0] >= 0 ? { q: rowOwner[(i / W) | 0], k: 'ligne' } : { q: colOwner[i % W], k: 'colonne' }),
    }];
    if (p !== v && vRoom != null && placedIn[vRoom + 1] >= 2) {
      elims.push({ test: i => cellRoom[i] !== vRoom, cost: 1.5, attr: () => `${roomOfCell(pos[v])}, déjà occupé${fem(v) ? 'e' : ''} par la victime et son meurtrier` });
    } else if (p === v && placedIn.some(x => x >= 2)) {
      elims.push({ test: i => placedIn[cellRoom[i] + 1] < 2, cost: 1.5, attr: i => `${roomOfCell(i)}, où se trouvent déjà deux personnes (la victime était seule avec le meurtrier)` });
    }
    const D = base.filter(i => premises.every(s => s.test(i)) && elims.every(e => e.test(i)));
    if (!D.includes(sol[p])) return reveal(inPool(p) ? p : pool[0], 'Pas de déduction simple pour l’instant.'); // garde-fou
    info.set(p, { premises, elims, D });
  }

  // Pourquoi « cells » se réduit-il à {x} ? Plus petit ensemble d'indices et d'exclusions suffisant.
  // Raisons d'exclusion des cases, regroupées : « dans la ligne ou la colonne d'Agathe, ou dans … »
  const attrsText = (cells, Es) => {
    const byQ = new Map(), list = [];
    for (const i of cells) {
      const e = Es.find(e => !e.test(i));
      if (!e) continue;
      const a = e.attr(i);
      if (e.line) {
        if (!byQ.has(a.q)) { byQ.set(a.q, new Set()); list.push({ q: a.q }); }
        byQ.get(a.q).add(a.k);
      } else if (!list.some(x => x.text === a)) list.push({ text: a });
    }
    const lines = list.filter(x => x.q != null);
    if (lines.length > 3) return `dans la ligne ou la colonne de personnages déjà posés${list.length > lines.length ? `, ou ${list.find(x => x.text).text}` : ''}`;
    const parts = list.map(x => {
      if (x.text) return x.text;
      const ks = byQ.get(x.q);
      return `dans la ${ks.size === 2 ? 'ligne ou la colonne' : ks.has('ligne') ? 'ligne' : 'colonne'} ${deNm(x.q)}`;
    });
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, ou ${parts[parts.length - 1]}` : parts[0];
  };
  const premiseText = (p, T) => {
    const parts = [];
    const owners = [];
    for (const s of T) if (!owners.includes(s.owner)) owners.push(s.owner);
    owners.sort((a, b) => (a === p ? -1 : b === p ? 1 : a - b));
    for (const q of owners) parts.push(subjectSentence(ctx, person(q), T.filter(s => s.owner === q).map(s => s.clue)));
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, et ${parts[parts.length - 1]}` : parts[0];
  };
  const explainForced = p => {
    const { premises, elims, D } = info.get(p), x = D[0];
    const m = Math.min(premises.length, 10);
    let best = null;
    for (let mask = 0; mask < (1 << m); mask++) {
      const T = premises.filter((s, k) => k < m && (mask >> k) & 1);
      const cellsT = base.filter(i => T.every(s => s.test(i)));
      for (let em = 0; em < (1 << elims.length); em++) {
        const Es = elims.filter((e, k) => (em >> k) & 1);
        const cost = T.reduce((a, s) => a + s.cost, 0) + Es.reduce((a, e) => a + e.cost, 0);
        if (best && cost >= best.cost) continue;
        if (cellsT.filter(i => Es.every(e => e.test(i))).length === 1) best = { T, Es, cellsT, cost };
      }
    }
    if (!best) return null;
    const { T, Es, cellsT, cost } = best;
    let html;
    if (!T.length) {
      html = `Il ne reste qu'une case possible pour ${nm(p)} : toutes les autres sont ${attrsText(base.filter(i => i !== x), Es)}.`;
    } else if (!Es.length) {
      const cl = T.length === 1 && T[0].owner === p ? T[0].clue : null;
      const one = cl && cl.t === 'on' && !cl.not && ctx.typeCount[cl.obj] === 1 && cellsT.length === 1;
      const o = one ? objInfo(cl.obj) : null;
      html = `${premiseText(p, T)} : ${one ? `il n'y a qu'${o.g === 'f' ? 'une' : 'un'} <b>${escapeHTML(o.n)}</b> sur le plan` : `c'est la seule case possible`}.`;
    } else {
      const k = cellsT.length;
      const others = cellsT.filter(i => i !== x);
      if (k > 4 && Es.length === 1 && Es[0].line) html = `${premiseText(p, T)} : parmi les ${numF(k)} cases qui conviennent, une seule n'est pas dans la ligne ou la colonne d'un personnage déjà posé.`;
      else html = `${premiseText(p, T)} : ${numF(k)} cases conviennent, mais ${k === 2 ? "l'une est" : 'les autres sont'} ${attrsText(others, Es)}.`;
    }
    return { p, x, cost, html };
  };

  const forced = [], narrow = [];
  for (const p of pool) {
    const { D, premises } = info.get(p);
    if (D.length === 1) { const f = explainForced(p); if (f) forced.push(f); }
    else {
      const T = premises.filter(s => base.some(i => !s.test(i)));
      narrow.push({ p, cells: D, html: T.length ? `${premiseText(p, T)} : il lui reste ${numF(D.length)} cases possibles.` : `Il reste ${numF(D.length)} cases possibles pour ${nm(p)}.` });
    }
  }
  // Chaque ligne de la petite dimension doit recevoir quelqu'un.
  const lineChecks = [];
  if (n === H) for (let r = 0; r < H; r++) if (rowOwner[r] < 0) lineChecks.push({ label: `ligne ${r + 1}`, has: i => ((i / W) | 0) === r });
  if (n === W) for (let c = 0; c < W; c++) if (colOwner[c] < 0) lineChecks.push({ label: `colonne ${c + 1}`, has: i => i % W === c });
  for (const { label, has } of lineChecks) {
    const who = [];
    for (const p of unplaced) { const cs = info.get(p).D.filter(has); if (cs.length) who.push({ p, cs }); }
    if (who.length !== 1) continue;
    const { p, cs } = who[0];
    if (!inPool(p)) continue;
    if (info.get(p).D.length === cs.length) continue; // rien de neuf
    if (cs.length === 1) forced.push({ p, x: cs[0], cost: 3.5, html: `Dans la <b>${label}</b>, il ne reste qu'une case possible, pour ${nm(p)} (${cellDesc(cs[0], p)}).` });
    else narrow.push({ p, cells: cs, html: `Dans la <b>${label}</b>, seul${fem(p) ? 'e' : ''} ${nm(p)} peut encore se placer : il lui reste ${numF(cs.length)} cases possibles.` });
  }
  // La victime était seule avec le meurtrier : si elle est encore seule, quelqu'un doit la rejoindre.
  if (vRoom != null && placedIn[vRoom + 1] === 1) {
    const who = [];
    for (const p of unplaced) { const cs = info.get(p).D.filter(i => cellRoom[i] === vRoom); if (cs.length) who.push({ p, cs }); }
    if (who.length === 1 && inPool(who[0].p) && info.get(who[0].p).D.length !== who[0].cs.length) {
      const { p, cs } = who[0];
      const lead = `La victime, ${nm(v)}, était seule avec le meurtrier : quelqu'un doit ${fem(v) ? 'la' : 'le'} rejoindre ${roomOfCell(pos[v])}, et seul${fem(p) ? 'e' : ''} ${nm(p)} peut encore y aller`;
      if (cs.length === 1) forced.push({ p, x: cs[0], cost: 3.5, html: `${lead}.` });
      else narrow.push({ p, cells: cs, html: `${lead} : il lui reste ${numF(cs.length)} cases possibles.` });
    }
  }
  const order = p => unplaced.indexOf(p);
  if (forced.length) {
    const mine = forced.filter(f => f.p === pref);
    const pool = mine.length ? mine : forced;
    pool.sort((a, b) => a.cost - b.cost || order(a.p) - order(b.p));
    const f = pool[0];
    if (f.x !== sol[f.p]) return reveal(f.p, 'Pas de déduction simple pour l’instant.'); // garde-fou
    return { kind: 'forced', person: person(f.p).id, cell: rc(f.x), cells: [rc(f.x)], html: f.html };
  }
  narrow.sort((a, b) => a.cells.length - b.cells.length || (b.p === pref) - (a.p === pref) || order(a.p) - order(b.p));
  const nw = narrow[0];
  if (nw && nw.cells.length <= NARROW_MAX && nw.cells.includes(sol[nw.p])) {
    return { kind: 'narrow', person: person(nw.p).id, cell: null, cells: nw.cells.map(rc), html: nw.html };
  }
  const p = pool.includes(pref) ? pref
    : pool.slice().sort((a, b) => info.get(a).D.length - info.get(b).D.length || order(a) - order(b))[0];
  return reveal(p, 'Pas de déduction simple pour l’instant.');
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validateLevel(raw) {
  const errors = [], warnings = [];
  const E = m => errors.push(m), Wn = m => warnings.push(m);
  if (!raw || typeof raw !== 'object') return { errors: ['Le niveau doit être un objet.'], warnings };
  if (typeof raw.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(raw.id)) E('Identifiant (id) manquant ou invalide : utilisez un slug en minuscules (lettres, chiffres, tirets).');
  if (typeof raw.title !== 'string' || !raw.title.trim()) E('Titre manquant.');
  if (![1, 2, 3].includes(raw.difficulty)) Wn('Difficulté absente ou hors de 1 à 3.');
  // Dimensions : carré `size` (5 à 9) ou rectangle `rows` × `cols` (4 à 12 lignes, 4 à 9 colonnes).
  let H, W;
  const hasRC = raw.rows != null || raw.cols != null;
  if (raw.size != null || !hasRC) {
    const N = raw.size;
    if (!Number.isInteger(N) || N < 5 || N > 9) { E('La taille (size) doit être un entier entre 5 et 9.'); return { errors, warnings }; }
    if (hasRC && (raw.rows !== N || raw.cols !== N)) { E('Indiquez soit la taille (size) d\'un plan carré, soit ses lignes (rows) et colonnes (cols), mais pas des valeurs contradictoires.'); return { errors, warnings }; }
    H = W = N;
  } else {
    let bad = false;
    if (!Number.isInteger(raw.rows) || raw.rows < 4 || raw.rows > 12) { E('Le nombre de lignes (rows) doit être un entier entre 4 et 12.'); bad = true; }
    if (!Number.isInteger(raw.cols) || raw.cols < 4 || raw.cols > 9) { E('Le nombre de colonnes (cols) doit être un entier entre 4 et 9.'); bad = true; }
    if (bad) return { errors, warnings };
    H = raw.rows; W = raw.cols;
  }
  const count = Math.min(H, W);
  const rect = H !== W;
  // Variantes
  let twLiar = false, twWeapon = false;
  if (raw.twist != null) {
    if (typeof raw.twist !== 'object' || Array.isArray(raw.twist)) E('Variante (twist) : un objet { liar: true } et/ou { weapon: true } est attendu.');
    else for (const [k, v] of Object.entries(raw.twist)) {
      if (k !== 'liar' && k !== 'weapon') { Wn(`Variante (twist) inconnue : « ${k} ».`); continue; }
      if (typeof v !== 'boolean') { E(`Variante (twist) « ${k} » : true ou false attendu.`); continue; }
      if (k === 'liar') twLiar = v; else twWeapon = v;
    }
  }

  // Pièces
  const rooms = Array.isArray(raw.rooms) ? raw.rooms : [];
  if (!rooms.length) E('Aucune pièce définie.');
  const keys = new Set();
  rooms.forEach((rm, i) => {
    if (!rm || typeof rm.key !== 'string' || rm.key.length !== 1) { E(`Pièce n° ${i + 1} : la clé doit être un caractère unique.`); return; }
    if (keys.has(rm.key)) E(`Clé de pièce en double : « ${rm.key} ».`);
    keys.add(rm.key);
    if (typeof rm.name !== 'string' || !rm.name.trim()) E(`Pièce « ${rm.key} » : nom manquant.`);
    if (rm.floor != null && !FLOORS.includes(rm.floor)) Wn(`Pièce « ${rm.key} » : sol inconnu « ${rm.floor} ».`);
  });
  const map = raw.roomMap;
  let mapOk = Array.isArray(map) && map.length === H;
  if (!mapOk) E(`La carte des pièces (roomMap) doit contenir ${H} lignes.`);
  else {
    map.forEach((line, r) => {
      if (typeof line !== 'string' || line.length !== W) { E(`roomMap, ligne ${r + 1} : ${W} caractères attendus.`); mapOk = false; return; }
      for (const ch of line) if (!keys.has(ch)) { E(`roomMap, ligne ${r + 1} : pièce inconnue « ${ch} ».`); mapOk = false; break; }
    });
  }
  if (mapOk) {
    for (const k of keys) {
      const cells = [];
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (map[r][c] === k) cells.push([r, c]);
      if (!cells.length) { Wn(`La pièce « ${k} » n'apparaît pas sur la carte.`); continue; }
      const seen = new Set([cells[0].join()]), stack = [cells[0]];
      while (stack.length) {
        const [r, c] = stack.pop();
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= H || cc >= W || map[rr][cc] !== k || seen.has(`${rr},${cc}`)) continue;
          seen.add(`${rr},${cc}`); stack.push([rr, cc]);
        }
      }
      if (seen.size !== cells.length) Wn(`La pièce « ${k} » est en plusieurs morceaux.`);
    }
  }

  // Objets
  const objects = Array.isArray(raw.objects) ? raw.objects : [];
  const occ = Array.from({ length: H }, () => new Array(W).fill(-1));
  const typesPresent = new Set();
  objects.forEach((o, k) => {
    const label = `Objet n° ${k + 1}${o && o.type ? ` (${o.type})` : ''}`;
    if (!o || !OBJECTS[o.type]) { E(`${label} : type inconnu.`); return; }
    typesPresent.add(o.type);
    const w = o.w == null ? 1 : o.w, h = o.h == null ? 1 : o.h;
    if (!Number.isInteger(o.r) || !Number.isInteger(o.c)) { E(`${label} : position (r, c) invalide.`); return; }
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) { E(`${label} : dimensions invalides.`); return; }
    if (o.r < 0 || o.c < 0 || o.r + h > H || o.c + w > W) { E(`${label} : sort de la grille.`); return; }
    const sizes = OBJECT_SIZES[o.type];
    if (sizes && !sizes.some(([a, b]) => (a === w && b === h) || (a === h && b === w))) Wn(`${label} : taille ${w}×${h} inhabituelle pour cet objet.`);
    const roomsHit = new Set();
    for (let r = o.r; r < o.r + h; r++) for (let c = o.c; c < o.c + w; c++) {
      if (occ[r][c] >= 0) E(`${label} : chevauche l'objet n° ${occ[r][c] + 1} en (${r}, ${c}).`);
      else occ[r][c] = k;
      if (mapOk) roomsHit.add(map[r][c]);
    }
    if (roomsHit.size > 1) Wn(`${label} : s'étend sur plusieurs pièces.`);
  });

  // Personnes
  const people = Array.isArray(raw.people) ? raw.people : [];
  if (people.length !== count) E(`Il faut exactement ${count} personnes (actuellement ${people.length})${rect ? ` : autant que la plus petite dimension du plan (${H}×${W})` : ''}.`);
  const ids = new Set();
  let victims = 0;
  people.forEach((p, i) => {
    const label = `Personne n° ${i + 1}${p && p.name ? ` (${p.name})` : ''}`;
    if (!p || typeof p.id !== 'string' || !/^[A-Z]$/.test(p.id)) { E(`${label} : l'id doit être une lettre majuscule.`); return; }
    if (ids.has(p.id)) E(`${label} : id « ${p.id} » en double.`);
    ids.add(p.id);
    if (typeof p.name !== 'string' || !p.name.trim()) E(`${label} : prénom manquant.`);
    else if (p.name.trim()[0].toUpperCase().normalize('NFD')[0] !== p.id) Wn(`${label} : l'id « ${p.id} » n'est pas l'initiale du prénom.`);
    if (p.gender !== 'm' && p.gender !== 'f') E(`${label} : genre (gender) doit valoir 'm' ou 'f'.`);
    if (p.victim) victims++;
  });
  if (victims !== 1) E(`Il faut exactement une victime (actuellement ${victims}).`);
  const victimId = (people.find(p => p && p.victim) || {}).id;
  people.forEach((p, i) => {
    if (!p) return;
    const label = `${p.name || `Personne n° ${i + 1}`}`;
    const clues = p.clues == null ? [] : p.clues;
    if (!Array.isArray(clues)) { E(`${label} : clues doit être un tableau.`); return; }
    if (twLiar && !p.victim && clues.length < 1) E(`${label} : sur une enquête à témoin menteur, chaque suspect doit avoir au moins un indice.`);
    if (p.victim) { if (clues.length) Wn(`${label} (victime) : les indices de la victime sont inhabituels.`); }
    else if (!rect && (clues.length < 1 || clues.length > 2)) Wn(`${label} : un suspect devrait avoir 1 ou 2 indices (actuellement ${clues.length}).`);
    else if (rect && (clues.length < 1 || clues.length > 3)) Wn(`${label} : un suspect devrait avoir de 1 à 3 indices (actuellement ${clues.length}).`);
    clues.forEach((cl, j) => {
      const L = `${label}, indice ${j + 1}`;
      if (!cl || !CLUE_T.has(cl.t)) { E(`${L} : type d'indice inconnu.`); return; }
      const needObj = (t, occOnly) => {
        if (!OBJECTS[t]) { E(`${L} : type d'objet inconnu « ${t} ».`); return; }
        if (occOnly && !OBJECTS[t].occ) E(`${L} : « ${t} » n'est pas un objet occupable.`);
        if (!typesPresent.has(t)) Wn(`${L} : aucun objet « ${t} » dans le niveau.`);
      };
      const needWho = w => {
        if (!ids.has(w) && !people.some(q => q && q.id === w)) E(`${L} : personne inconnue « ${w} ».`);
        else if (w === p.id) E(`${L} : un indice ne peut pas viser la personne elle-même.`);
      };
      if (isAwkwardClue(cl)) Wn(`${L} : indice peu lisible (négation ${cl.t === 'dir' ? 'd\'une position relative' : cl.t === 'sees' ? 'de « voyait »' : cl.t === 'sameRow' ? 'de « même ligne »' : 'de « même colonne »'}) ; préférez une affirmation.`);
      switch (cl.t) {
        case 'room': if (!keys.has(cl.room)) E(`${L} : pièce inconnue « ${cl.room} ».`); break;
        case 'on': needObj(cl.obj, true); break;
        case 'beside': case 'sameRow': case 'sameCol': case 'sees': needObj(cl.obj, false); break;
        case 'with': case 'besidePerson':
          needWho(cl.who);
          if (cl.who === victimId && !p.victim) Wn(`${L} : cet indice vise la victime et désigne trop directement le meurtrier.`);
          break;
        case 'alone': break;
        case 'dir': {
          if (!DIRS.includes(cl.dir)) E(`${L} : direction invalide (N, S, E ou W).`);
          const span = cl.dir === 'E' || cl.dir === 'W' ? W : H;
          if (cl.exact != null && (!Number.isInteger(cl.exact) || cl.exact < 1 || cl.exact >= span)) E(`${L} : écart exact invalide.`);
          const of = cl.of;
          const n = of ? ['who', 'obj', 'on'].filter(k => of[k] != null).length : 0;
          if (n !== 1) { E(`${L} : la cible (of) doit avoir exactement un champ parmi who, obj, on.`); break; }
          if (of.who != null) needWho(of.who);
          if (of.obj != null) needObj(of.obj, false);
          if (of.on != null) needObj(of.on, true);
          break;
        }
      }
    });
  });

  // Solution indicative
  if (raw.solution != null) {
    if (typeof raw.solution !== 'object') E('solution doit être un objet { id: [r, c] }.');
    else for (const [id, v] of Object.entries(raw.solution)) {
      if (!ids.has(id)) E(`solution : personne inconnue « ${id} ».`);
      if (!Array.isArray(v) || !Number.isInteger(v[0]) || !Number.isInteger(v[1]) || v[0] < 0 || v[1] < 0 || v[0] >= H || v[1] >= W) E(`solution : position invalide pour « ${id} ».`);
      else if (occ[v[0]][v[1]] >= 0 && objects[occ[v[0]][v[1]]] && OBJECTS[objects[occ[v[0]][v[1]]].type] && !OBJECTS[objects[occ[v[0]][v[1]]].type].occ) E(`solution : « ${id} » est sur une case bloquée.`);
    }
  }
  // Arme du crime : vérifiable dès que la solution indicative est complète et le niveau sain
  if (twWeapon && !errors.length && raw.solution && typeof raw.solution === 'object'
    && people.every(p => Array.isArray(raw.solution[p.id]))) {
    if (weaponOf(raw, raw.solution) == null) E('Arme du crime : dans la solution, le meurtrier doit avoir exactement un objet à côté de lui.');
  }
  return { errors, warnings };
}
