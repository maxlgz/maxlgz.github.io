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
};

// Tailles conseillées (w×h, orientation libre) — sert uniquement aux avertissements.
const OBJECT_SIZES = {
  sofa: [[2, 1]], bench: [[2, 1]], bed: [[1, 1], [1, 2]], rug: [[1, 1], [1, 2], [2, 2]],
  boat: [[1, 1], [2, 1]], car: [[2, 1]], stage: [[1, 1], [1, 2], [1, 3], [2, 2], [2, 3]],
  chair: [[1, 1]], armchair: [[1, 1]], stool: [[1, 1]], deckchair: [[1, 1]], hammock: [[1, 1]],
  bathtub: [[1, 1], [2, 1]], tent: [[1, 1]],
};

export const FLOORS = ['grass', 'wood', 'parquet', 'tile', 'stone', 'carpet', 'sand', 'snow',
  'concrete', 'deck', 'marble', 'gravel'];

export const CLUE_TYPES = [
  { t: 'room',         label: 'Dans la pièce',                 fields: ['room'], negatable: true },
  { t: 'on',           label: 'Sur / dans un objet',           fields: ['obj'], occOnly: true, negatable: true },
  { t: 'beside',       label: 'À côté d’un objet',             fields: ['obj'], negatable: true },
  { t: 'besidePerson', label: 'À côté de quelqu’un',           fields: ['who'], negatable: true },
  { t: 'with',         label: 'Avec quelqu’un (même pièce)',   fields: ['who'], negatable: true },
  { t: 'alone',        label: 'Seul(e) dans sa pièce',         fields: [], negatable: true },
  { t: 'dir',          label: 'Direction (nord/sud/est/ouest)', fields: ['dir', 'of', 'exact'], negatable: true },
  { t: 'sameRow',      label: 'Même ligne qu’un objet',        fields: ['obj'], negatable: true },
  { t: 'sameCol',      label: 'Même colonne qu’un objet',      fields: ['obj'], negatable: true },
];

const CLUE_T = new Set(CLUE_TYPES.map(c => c.t));
const DIRS = ['N', 'S', 'E', 'W'];

/* ------------------------------------------------------------------ */
/* Préparation                                                         */
/* ------------------------------------------------------------------ */

function clone(x) {
  if (typeof structuredClone === 'function') return structuredClone(x);
  return JSON.parse(JSON.stringify(x));
}
const posInt = (v, d) => (Number.isInteger(v) && v > 0 ? v : d);

export function prepare(raw) {
  if (raw && raw[PREP]) return raw;
  const lvl = clone(raw || {});
  const N = Number.isInteger(lvl.size) && lvl.size > 0 ? lvl.size : 0;
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
  const NN = N * N;
  const cellRoom = new Int16Array(NN).fill(-1);
  const cellObj = new Int16Array(NN).fill(-1);
  const cellType = new Array(NN).fill(null);
  const blocked = new Uint8Array(NN);
  const cells = [];
  for (let r = 0; r < N; r++) {
    const row = [];
    const line = lvl.roomMap[r] || '';
    for (let c = 0; c < N; c++) {
      const ch = c < line.length ? line[c] : null;
      let ri = -1;
      if (ch != null && ch !== ' ' && ch !== '.') {
        if (!roomIndex.has(ch)) { roomIndex.set(ch, roomKeys.length); roomKeys.push(ch); }
        ri = roomIndex.get(ch);
      }
      cellRoom[r * N + c] = ri;
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
        if (r < 0 || c < 0 || r >= N || c >= N) continue;
        const cell = cells[r][c];
        if (cell.objIndex != null) continue; // chevauchement : le premier objet l'emporte
        cell.objIndex = k; cell.objType = type; cell.blocked = !occ;
        const i = r * N + c;
        cellObj[i] = k; cellType[i] = type; blocked[i] = occ ? 0 : 1;
      }
    }
  });
  const adj = [];
  for (let i = 0; i < NN; i++) {
    const r = (i / N) | 0, c = i % N, a = [];
    const push = (rr, cc) => {
      if (rr < 0 || cc < 0 || rr >= N || cc >= N) return;
      const j = rr * N + cc;
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
    N, NN, n: lvl.people.length, cellRoom, cellObj, cellType, blocked, adj, boxes, typeCount, typeBoxes,
    roomIndex, roomKeys, R: roomKeys.length, pidx, people: lvl.people, victim, lvl,
  };
  Object.defineProperty(lvl, PREP, { value: ctx, enumerable: false });
  return lvl;
}

const ctxOf = level => prepare(level)[PREP];

export function canPlace(level, r, c) {
  const ctx = ctxOf(level);
  if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= ctx.N || c >= ctx.N) return false;
  return !ctx.blocked[r * ctx.N + c];
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
  const { N, cellRoom, cellType, cellObj, adj } = ctx;
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
      const t = clue.obj, has = new Uint8Array(N);
      for (let i = 0; i < ctx.NN; i++) if (cellType[i] === t) has[clue.t === 'sameRow' ? (i / N) | 0 : i % N] = 1;
      return clue.t === 'sameRow'
        ? { kind: 'unary', not, f: i => has[(i / N) | 0] === 1 }
        : { kind: 'unary', not, f: i => has[i % N] === 1 };
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
    case 'dir': {
      const dir = clue.dir;
      if (!DIRS.includes(dir) || !clue.of) return K(false);
      const k = typeof clue.exact === 'number' ? clue.exact : null;
      const of = clue.of;
      const cellTest = (i, j) => dirBox(dir, k, (i / N) | 0, i % N, { r0: (j / N) | 0, r1: (j / N) | 0, c0: j % N, c1: j % N });
      if (of.who != null) {
        const q = ctx.pidx.get(String(of.who));
        if (q == null) return K(false);
        if (q === p) return K(false);
        return { kind: 'binary', not, q, f: cellTest };
      }
      if (of.obj != null) {
        const bs = ctx.typeBoxes[of.obj] || [];
        return { kind: 'unary', not, f: i => { const r = (i / N) | 0, c = i % N; for (const b of bs) if (dirBox(dir, k, r, c, b)) return true; return false; } };
      }
      if (of.on != null) return { kind: 'dirOn', not, type: of.on, test: cellTest };
      return K(false);
    }
  }
  return K(false);
}

function readPlacements(ctx, placements) {
  const pos = new Int16Array(ctx.n).fill(-1);
  if (!placements) return pos;
  ctx.people.forEach((p, i) => {
    const v = placements[p.id];
    if (Array.isArray(v) && Number.isInteger(v[0]) && Number.isInteger(v[1])
      && v[0] >= 0 && v[1] >= 0 && v[0] < ctx.N && v[1] < ctx.N) pos[i] = v[0] * ctx.N + v[1];
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

export function evaluate(level, placements) {
  const L = prepare(level), ctx = L[PREP];
  const pos = readPlacements(ctx, placements);
  const { N, n } = ctx;
  const complete = n > 0 && Array.from(pos).every(x => x >= 0);
  const rowCnt = new Array(N).fill(0), colCnt = new Array(N).fill(0);
  const blockedIds = [];
  for (let p = 0; p < n; p++) {
    if (pos[p] < 0) continue;
    rowCnt[(pos[p] / N) | 0]++; colCnt[pos[p] % N]++;
    if (ctx.blocked[pos[p]]) blockedIds.push(ctx.people[p].id);
  }
  const rows = [], cols = [];
  for (let i = 0; i < N; i++) { if (rowCnt[i] > 1) rows.push(i); if (colCnt[i] > 1) cols.push(i); }
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
      case 'unary': unary[p].push(not ? i => !cc.f(i) : cc.f); break;
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

function solveCore(ctx, comp, max) {
  const { N, NN, n, cellRoom, cellType, blocked } = ctx;
  const out = [];
  if (n === 0 || n > N || comp.impossible || max <= 0) return out;
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
  const victim = ctx.victim;
  const pos = new Int16Array(n).fill(-1);
  const roomCount = new Int8Array(R);
  const aloner = new Int8Array(R);
  let rowUsed = 0, colUsed = 0;
  const full = (1 << N) - 1;
  const exactLines = n === N;
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
  const roomMark = new Int32Array(R);
  let markStamp = 0;

  function feasible(p, i) {
    const r = (i / N) | 0, c = i % N;
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
  function posFinalsAlive() {
    for (let x = 0; x < posFinals.length; x++) {
      const { p, cc, sitters } = posFinals[x];
      if (pos[p] < 0) continue;
      let open = false, found = false;
      for (const q of sitters) {
        if (pos[q] < 0) { open = true; continue; }
        if (cellType[pos[q]] === cc.type && cc.test(pos[p], pos[q])) { found = true; break; }
      }
      if (!found && !open) return false;
    }
    return true;
  }
  function place(p, i) {
    pos[p] = i; rowUsed |= 1 << ((i / N) | 0); colUsed |= 1 << (i % N);
    const room = roomOf[i]; roomCount[room]++; if (alonePos[p]) aloner[room]++;
  }
  function unplace(p) {
    const i = pos[p]; pos[p] = -1;
    rowUsed &= ~(1 << ((i / N) | 0)); colUsed &= ~(1 << (i % N));
    const room = roomOf[i]; roomCount[room]--; if (alonePos[p]) aloner[room]--;
  }
  function dfs(depth) {
    if (depth === n) {
      if (finalOk()) out.push(new Int16Array(pos));
      return;
    }
    if (posFinals.length && !posFinalsAlive()) return;
    // pièces où il manque encore quelqu'un
    const stamp = ++markStamp;
    let missing = 0;
    for (let x = 0; x < needers.length; x++) {
      const q = needers[x];
      if (pos[q] < 0) continue;
      const rm = roomOf[pos[q]];
      if (roomCount[rm] === 1 && roomMark[rm] !== stamp) { roomMark[rm] = stamp; missing++; }
    }
    let best = -1, bestCount = 1e9, bestBuf = bufA[depth], scratch = bufB[depth];
    let rowsCov = 0, colsCov = 0;
    for (let p = 0; p < n; p++) {
      if (pos[p] >= 0) continue;
      const d = domains[p];
      let cnt = 0;
      for (let x = 0; x < d.length; x++) {
        const i = d[x];
        if (feasible(p, i)) {
          scratch[cnt++] = i;
          rowsCov |= 1 << ((i / N) | 0); colsCov |= 1 << (i % N);
          if (missing) { const rm = roomOf[i]; if (roomMark[rm] === stamp) { roomMark[rm] = -stamp; missing--; } }
        }
      }
      if (cnt === 0) return;
      if (cnt < bestCount) { bestCount = cnt; best = p; const t = bestBuf; bestBuf = scratch; scratch = t; }
    }
    if (missing > 0) return;
    if (exactLines && ((rowsCov | rowUsed) !== full || (colsCov | colUsed) !== full)) return;
    for (let x = 0; x < bestCount; x++) {
      place(best, bestBuf[x]);
      dfs(depth + 1);
      unplace(best);
      if (out.length >= max) return;
    }
  }
  dfs(0);
  return out;
}

function posToPlacements(ctx, pos) {
  const o = {};
  ctx.people.forEach((p, i) => { o[p.id] = [(pos[i] / ctx.N) | 0, pos[i] % ctx.N]; });
  return o;
}

export function solve(level, { max = 2 } = {}) {
  const L = prepare(level), ctx = L[PREP];
  const comp = compileSet(ctx, ctx.people.map(p => p.clues));
  return solveCore(ctx, comp, max).map(pos => posToPlacements(ctx, pos));
}

/* ------------------------------------------------------------------ */
/* Texte français                                                      */
/* ------------------------------------------------------------------ */

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const VOWEL = /^[aeiouyàâäæéèêëîïôöœùûü]/i; // « h » non élidé (hamac, hall : h aspiré)
const startsVowel = s => VOWEL.test(String(s));

function objInfo(type) {
  return OBJECTS[type] || { g: 'm', n: String(type), pl: String(type) };
}
// Groupe nominal d'un objet : prep '' | 'de' | 'que'. Défini si l'objet est unique dans le niveau.
function objNP(ctx, type, prep = '') {
  const o = objInfo(type);
  const noun = `<b>${escapeHTML(o.n)}</b>`;
  const v = startsVowel(o.n), f = o.g === 'f';
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
  const m = 'salon bureau jardin dortoir grenier hall couloir atelier cellier garage bar parc verger potager patio porche perron vestibule cabinet studio débarras refuge quai pont port chalet kiosque belvédère préau réfectoire laboratoire labo observatoire boudoir fumoir hangar entrepôt magasin comptoir local lavoir chai cloître château donjon phare sous-sol palier balcon toit bassin bois champ sentier chemin camp campement ponton débarcadère embarcadère auditorium amphithéâtre théâtre foyer vestiaire office sauna solarium spa pavillon manoir moulin musée marché salle-de-bain wagon compartiment bivouac abri chantier dépôt grand petit vieux poste chenil poulailler pigeonnier jardinet square belvédère mess carré pont-promenade cockpit salonnet nid alpage col lac étang ruisseau rivage rocher sommet plateau vallon pré bosquet sous-bois verger cabanon'.split(' ');
  const f = 'cuisine chambre salle cave terrasse véranda bibliothèque buanderie serre cour galerie loge suite mezzanine piscine plage forêt clairière grange écurie étable remise cabane tour crypte chapelle nef sacristie alcôve antichambre roseraie pinède prairie rive berge jetée cale cabine passerelle dune grotte pergola tonnelle orangerie cantine réserve boutique vitrine scène coulisse salle-à-manger lingerie bergerie halle gare station cabane-perchée allée place esplanade digue baie crique falaise montagne colline grande petite vieille chaufferie infirmerie salle-de-jeux arrière-boutique arrière-cour basse-cour ferme maison villa auberge taverne guinguette verrière rotonde laverie mansarde soupente baraque hutte yourte caravane péniche barge écluse marina dépendance laiterie fromagerie boulangerie forge'.split(' ');
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
  if (g) return `${prep} ${startsVowel(name) ? "l'" : g === 'f' ? 'la ' : 'le '}${b}`;
  return `dans la pièce ${b}`;
}

const DIR_W = { N: 'au nord', S: 'au sud', E: "à l'est", W: "à l'ouest" };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

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
    case 'dir': {
      const dir = DIRS.includes(clue.dir) ? clue.dir : 'N';
      const of = clue.of || {};
      const exact = typeof clue.exact === 'number' ? clue.exact : null;
      const unit = exact == null ? '' : `${exact} ${dir === 'N' || dir === 'S' ? 'ligne' : 'colonne'}${exact > 1 ? 's' : ''}`;
      // Cible : who / obj / on
      let kind, target = prep => '';
      if (of.who != null) { kind = 'who'; target = prep => nameNP(nameOf(ctx, of.who), prep); }
      else if (of.obj != null) { kind = ctx.typeCount[of.obj] === 1 ? 'objDef' : 'objIndef'; target = prep => objNP(ctx, of.obj, prep); }
      else { kind = 'on'; target = prep => `${prep === 'de' ? 'de ' : prep === 'que' ? 'que ' : ''}quelqu'un se trouvant ${escapeHTML(onPrep(of.on))} ${objNP(ctx, of.on)}`; }
      if (!not) {
        if (exact == null) return `${S} était <b>plus ${DIR_W[dir]}</b> ${target('que')}.`;
        return `${S} était exactement <b>${unit} ${DIR_W[dir]}</b> ${target('de')}.`;
      }
      if (kind === 'who' || kind === 'objDef') {
        if (exact == null) return `${S} n'était <b>pas plus ${DIR_W[dir]}</b> ${target('que')}.`;
        return `${S} n'était <b>pas</b> exactement <b>${unit} ${DIR_W[dir]}</b> ${target('de')}.`;
      }
      // Négation avec cible indéfinie : on retourne la phrase pour éviter toute ambiguïté.
      const o = DIR_W[OPP[dir]];
      let subj;
      if (kind === 'objIndef') {
        const info = objInfo(of.obj);
        subj = `<b>${info.g === 'f' ? 'Aucune' : 'Aucun'} ${escapeHTML(info.n)}</b>`;
      } else {
        subj = `<b>Personne</b> se trouvant ${escapeHTML(onPrep(of.on))} ${objNP(ctx, of.on)}`;
      }
      if (exact == null) return `${subj} n'était <b>plus ${o}</b> ${fem ? "qu'elle" : 'que lui'}.`;
      return `${subj} n'était exactement <b>${unit} ${o}</b> ${fem ? "d'elle" : 'de lui'}.`;
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
  1: { room: 6, on: 6, beside: 6, with: 1.2, besidePerson: 0.8, alone: 1, dir: 0.15, dirExact: 0.04, dirOn: 0.03, same: 0.2, neg: 0.15 },
  2: { room: 3, on: 3, beside: 3, with: 3, besidePerson: 3, alone: 2, dir: 1.2, dirExact: 0.6, dirOn: 0.5, same: 1, neg: 0.7 },
  3: { room: 1.2, on: 1.2, beside: 2, with: 2, besidePerson: 2, alone: 1.5, dir: 3.5, dirExact: 3, dirOn: 2.5, same: 3, neg: 1.3 },
};

function enumerateCandidates(ctx, pos, p) {
  const { N, NN, n, cellRoom, cellType, blocked } = ctx;
  const victim = ctx.victim;
  const ip = pos[p], r = (ip / N) | 0, c = ip % N;
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
  for (const t of types) { add({ t: 'beside', obj: t }, 'beside'); add({ t: 'beside', obj: t, not: true }, 'beside'); }
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
  // dir : personnes
  for (let q = 0; q < n; q++) {
    if (q === p) continue;
    const who = ctx.people[q].id;
    const rq = (pos[q] / N) | 0, cq = pos[q] % N;
    const pair = p < q ? `${p}|${q}` : `${q}|${p}`;
    const axisSym = d => (d === 'N' || d === 'S' ? 'NS' : 'EW');
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { who } }, 'dir', `dir|${axisSym(d)}|${pair}`);
      add({ t: 'dir', dir: d, of: { who }, not: true }, 'dir', `dirN|${axisSym(d)}|${pair}`);
    }
    const dr = rq - r, dc = c - cq;
    if (dr !== 0 && Math.abs(dr) <= 3) add({ t: 'dir', dir: dr > 0 ? 'N' : 'S', of: { who }, exact: Math.abs(dr) }, 'dirExact', `dirX|NS|${pair}`);
    if (dc !== 0 && Math.abs(dc) <= 3) add({ t: 'dir', dir: dc > 0 ? 'E' : 'W', of: { who }, exact: Math.abs(dc) }, 'dirExact', `dirX|EW|${pair}`);
  }
  // dir : objets
  for (const t of types) {
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { obj: t } }, 'dir');
      add({ t: 'dir', dir: d, of: { obj: t }, not: true }, 'dir');
    }
    for (const b of ctx.typeBoxes[t]) {
      const ks = { N: b.r0 - r, S: r - b.r1, W: b.c0 - c, E: c - b.c1 };
      for (const d of DIRS) if (ks[d] > 0 && ks[d] <= 3) add({ t: 'dir', dir: d, of: { obj: t }, exact: ks[d] }, 'dirExact');
    }
  }
  // dir : quelqu'un sur un objet
  for (const t of occTypes) {
    const sitters = [];
    for (let q = 0; q < n; q++) if (q !== p && cellType[pos[q]] === t) sitters.push(q);
    if (!sitters.length) continue;
    for (const d of DIRS) {
      add({ t: 'dir', dir: d, of: { on: t } }, 'dirOn');
      add({ t: 'dir', dir: d, of: { on: t }, not: true }, 'dirOn');
    }
    for (const q of sitters) {
      const rq = (pos[q] / N) | 0, cq = pos[q] % N;
      const dr = rq - r, dc = c - cq;
      if (dr !== 0 && Math.abs(dr) <= 3) add({ t: 'dir', dir: dr > 0 ? 'N' : 'S', of: { on: t }, exact: Math.abs(dr) }, 'dirOn');
      if (dc !== 0 && Math.abs(dc) <= 3) add({ t: 'dir', dir: dc > 0 ? 'E' : 'W', of: { on: t }, exact: Math.abs(dc) }, 'dirOn');
    }
  }
  // Normalise les poids par catégorie (sinon les catégories nombreuses — directions — écrasent les autres).
  const per = {};
  for (const c of out) per[c.cat] = (per[c.cat] || 0) + 1;
  for (const c of out) c.norm = 1 / per[c.cat];
  return out;
}

export function generateClues(level, solution, { difficulty = 1, seed = 1 } = {}) {
  const raw = clone(level && level[PREP] ? stripPrep(level) : (level || {}));
  (raw.people || []).forEach(p => { p.clues = []; });
  const L = prepare(raw), ctx = L[PREP];
  const { n, N } = ctx;
  if (n === 0 || n !== N || ctx.victim < 0) return null;
  const pos = readPlacements(ctx, solution);
  if (Array.from(pos).some(x => x < 0)) return null;
  const rows = new Set(), cols = new Set();
  for (let p = 0; p < n; p++) {
    if (ctx.blocked[pos[p]]) return null;
    rows.add((pos[p] / N) | 0); cols.add(pos[p] % N);
  }
  if (rows.size !== n || cols.size !== n) return null;
  const vRoom = ctx.cellRoom[pos[ctx.victim]];
  let cntV = 0;
  for (let p = 0; p < n; p++) if (ctx.cellRoom[pos[p]] === vRoom) cntV++;
  if (cntV !== 2) return null;

  const W = WEIGHTS[Math.min(3, Math.max(1, difficulty | 0))] || WEIGHTS[1];
  const suspects = [];
  for (let p = 0; p < n; p++) if (p !== ctx.victim) suspects.push(p);
  const cands = [];
  for (let p = 0; p < n; p++) cands.push(p === ctx.victim ? [] : enumerateCandidates(ctx, pos, p));
  const weightOf = cand => W[cand.cat] * cand.norm * (cand.neg ? W.neg : 1);

  const samePos = a => { for (let p = 0; p < n; p++) if (a[p] !== pos[p]) return false; return true; };
  const isUnique = chosen => {
    const comp = compileSet(ctx, chosen.map(list => list.map(c => c.clue)));
    return solveCore(ctx, comp, 2);
  };

  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = mulberry32(hashSeed(`${seed}#${attempt}`));
    const chosen = Array.from({ length: n }, () => []);
    const usedSym = new Set();
    const usedCat = {};
    const acceptable = (p, cand) => {
      const list = chosen[p];
      if (list.length >= 2) return false;
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
        }
      }
      return true;
    };
    const pick = options => {
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
    };
    // 1) un indice par suspect
    const order = suspects.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (const p of order) {
      const opts = cands[p].filter(c => acceptable(p, c)).map(c => ({ p, c, w: weightOf(c) * variety(c) * (0.15 + c.sel) }));
      const o = pick(opts);
      if (o) take(p, o.c);
    }
    // 2) ajouter des indices qui éliminent une solution alternative
    let ok = false;
    for (let iter = 0; iter < 4 * n + 10; iter++) {
      if (suspects.some(p => chosen[p].length === 0)) {
        // un suspect sans indice : on le force
        const p = suspects.find(q => chosen[q].length === 0);
        const opts = cands[p].filter(c => acceptable(p, c)).map(c => ({ p, c, w: weightOf(c) }));
        const o = pick(opts);
        if (!o) break;
        take(p, o.c);
        continue;
      }
      const sols = solveCore(ctx, compileSet(ctx, chosen.map(list => list.map(c => c.clue))), 12);
      if (sols.length === 1) { ok = true; break; }
      if (sols.length === 0) break;
      const alts = sols.filter(x => !samePos(x));
      const opts = [];
      for (const p of suspects) {
        if (chosen[p].length >= 2) continue;
        let moved = 0;
        for (const a of alts) if (a[p] !== pos[p]) moved++;
        if (!moved) continue;
        for (const c of cands[p]) {
          if (!acceptable(p, c)) continue;
          let elim = 0;
          for (const a of alts) if (evalCompiled(ctx, p, c.cc, a) === false) elim++;
          if (!elim) continue;
          opts.push({ p, c, w: weightOf(c) * variety(c) * (0.2 + elim / alts.length) ** 2 });
        }
      }
      if (!opts.length) {
        // indices relationnels possibles même pour une personne bien placée
        for (const p of suspects) {
          if (chosen[p].length >= 2) continue;
          for (const c of cands[p]) {
            if (!acceptable(p, c) || c.set) continue;
            let elim = 0;
            for (const a of alts) if (evalCompiled(ctx, p, c.cc, a) === false) elim++;
            if (elim) opts.push({ p, c, w: weightOf(c) * (elim / alts.length) });
          }
        }
      }
      const o = pick(opts);
      if (!o) break;
      take(o.p, o.c);
    }
    if (!ok) continue;
    // 3) retirer les indices superflus
    const all = [];
    for (const p of suspects) for (const c of chosen[p]) all.push({ p, c });
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    for (const { p, c } of all) {
      if (chosen[p].length < 2) continue;
      const idx = chosen[p].indexOf(c);
      chosen[p].splice(idx, 1);
      if (isUnique(chosen).length !== 1) chosen[p].splice(idx, 0, c);
    }
    const res = {};
    ctx.people.forEach((person, p) => { res[person.id] = chosen[p].map(c => clone(c.clue)); });
    return res;
  }
  return null;
}

function stripPrep(level) {
  const o = {};
  for (const k of Object.keys(level)) if (k !== 'cells') o[k] = level[k];
  return o;
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
  const N = raw.size;
  if (!Number.isInteger(N) || N < 5 || N > 9) { E('La taille (size) doit être un entier entre 5 et 9.'); return { errors, warnings }; }

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
  let mapOk = Array.isArray(map) && map.length === N;
  if (!mapOk) E(`La carte des pièces (roomMap) doit contenir ${N} lignes.`);
  else {
    map.forEach((line, r) => {
      if (typeof line !== 'string' || line.length !== N) { E(`roomMap, ligne ${r + 1} : ${N} caractères attendus.`); mapOk = false; return; }
      for (const ch of line) if (!keys.has(ch)) { E(`roomMap, ligne ${r + 1} : pièce inconnue « ${ch} ».`); mapOk = false; break; }
    });
  }
  if (mapOk) {
    for (const k of keys) {
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (map[r][c] === k) cells.push([r, c]);
      if (!cells.length) { Wn(`La pièce « ${k} » n'apparaît pas sur la carte.`); continue; }
      const seen = new Set([cells[0].join()]), stack = [cells[0]];
      while (stack.length) {
        const [r, c] = stack.pop();
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= N || cc >= N || map[rr][cc] !== k || seen.has(`${rr},${cc}`)) continue;
          seen.add(`${rr},${cc}`); stack.push([rr, cc]);
        }
      }
      if (seen.size !== cells.length) Wn(`La pièce « ${k} » est en plusieurs morceaux.`);
    }
  }

  // Objets
  const objects = Array.isArray(raw.objects) ? raw.objects : [];
  const occ = Array.from({ length: N }, () => new Array(N).fill(-1));
  const typesPresent = new Set();
  objects.forEach((o, k) => {
    const label = `Objet n° ${k + 1}${o && o.type ? ` (${o.type})` : ''}`;
    if (!o || !OBJECTS[o.type]) { E(`${label} : type inconnu.`); return; }
    typesPresent.add(o.type);
    const w = o.w == null ? 1 : o.w, h = o.h == null ? 1 : o.h;
    if (!Number.isInteger(o.r) || !Number.isInteger(o.c)) { E(`${label} : position (r, c) invalide.`); return; }
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) { E(`${label} : dimensions invalides.`); return; }
    if (o.r < 0 || o.c < 0 || o.r + h > N || o.c + w > N) { E(`${label} : sort de la grille.`); return; }
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
  if (people.length !== N) E(`Il faut exactement ${N} personnes (actuellement ${people.length}).`);
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
    if (p.victim) { if (clues.length) Wn(`${label} (victime) : les indices de la victime sont inhabituels.`); }
    else if (clues.length < 1 || clues.length > 2) Wn(`${label} : un suspect devrait avoir 1 ou 2 indices (actuellement ${clues.length}).`);
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
      switch (cl.t) {
        case 'room': if (!keys.has(cl.room)) E(`${L} : pièce inconnue « ${cl.room} ».`); break;
        case 'on': needObj(cl.obj, true); break;
        case 'beside': case 'sameRow': case 'sameCol': needObj(cl.obj, false); break;
        case 'with': case 'besidePerson':
          needWho(cl.who);
          if (cl.who === victimId && !p.victim) Wn(`${L} : cet indice vise la victime et désigne trop directement le meurtrier.`);
          break;
        case 'alone': break;
        case 'dir': {
          if (!DIRS.includes(cl.dir)) E(`${L} : direction invalide (N, S, E ou W).`);
          if (cl.exact != null && (!Number.isInteger(cl.exact) || cl.exact < 1 || cl.exact >= N)) E(`${L} : écart exact invalide.`);
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
      if (!Array.isArray(v) || !Number.isInteger(v[0]) || !Number.isInteger(v[1]) || v[0] < 0 || v[1] < 0 || v[0] >= N || v[1] >= N) E(`solution : position invalide pour « ${id} ».`);
      else if (occ[v[0]][v[1]] >= 0 && objects[occ[v[0]][v[1]]] && OBJECTS[objects[occ[v[0]][v[1]]].type] && !OBJECTS[objects[occ[v[0]][v[1]]].type].occ) E(`solution : « ${id} » est sur une case bloquée.`);
    }
  }
  return { errors, warnings };
}
