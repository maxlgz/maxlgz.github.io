// ================================================================
// voxelize.js — d'un maillage STL au sous-marin en cellules
//
// Module partagé : tourne dans le navigateur (import de la page) comme
// sous Node (tools/voxelize.mjs). Lit des STL binaires ou ASCII, oriente
// le modèle (grand axe -> x, museau en x = 0, dessus en +y), le met à
// l'échelle demandée, le voxelise par enroulement de rayons, comble les
// cavités et classe les cellules (coque, verrière, dorsales, caudale,
// nageoires, hélice, socle). La sortie a le format de voxels.json.
// ================================================================

export const STUD = 8, PLATE = 3.2;

// ---------------------------------------------------------------- STL
// buf : ArrayBuffer, Uint8Array ou Buffer Node.
export function parseSTL(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const head = String.fromCharCode(...u8.subarray(0, 5));
  const isBinary = !(head === 'solid' && !looksBinary(u8, dv));
  const tris = [];
  if (isBinary) {
    const n = dv.getUint32(80, true);
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50;
      if (o + 50 > u8.byteLength) break;
      const v = [];
      for (let k = 0; k < 3; k++) {
        const p = o + 12 + k * 12;
        v.push([dv.getFloat32(p, true), dv.getFloat32(p + 4, true), dv.getFloat32(p + 8, true)]);
      }
      tris.push(v);
    }
  } else {
    const txt = new TextDecoder().decode(u8);
    const re = /vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g;
    let m, cur = [];
    while ((m = re.exec(txt))) {
      cur.push([+m[1], +m[2], +m[3]]);
      if (cur.length === 3) { tris.push(cur); cur = []; }
    }
  }
  return tris;
}
function looksBinary(u8, dv) {
  if (u8.byteLength < 84) return false;
  const n = dv.getUint32(80, true);
  return u8.byteLength === 84 + n * 50;
}

// ---------------------------------------------------------- orientation
export function bounds(tris) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (const v of t) for (let a = 0; a < 3; a++) {
    if (v[a] < lo[a]) lo[a] = v[a];
    if (v[a] > hi[a]) hi[a] = v[a];
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}

// Remappe les axes : renvoie une fonction v -> [x, y, z] modèle
export function orient(tris, opts = {}) {
  const b = bounds(tris);
  const longest = b.size.indexOf(Math.max(...b.size));
  const others = [0, 1, 2].filter((a) => a !== longest);
  // « dessus » : parmi les deux axes restants, le plus étendu (la
  // caudale et la dorsale dépassent plus que les pectorales)
  const up = opts.up && opts.up !== 'auto' ? opts.up : null;
  let upAxis, upSign = 1;
  if (up) { upAxis = { x: 0, y: 1, z: 2 }[up.replace('-', '')]; upSign = up.startsWith('-') ? -1 : 1; }
  if (upAxis === undefined || upAxis === longest) { upAxis = b.size[others[0]] >= b.size[others[1]] ? others[0] : others[1]; upSign = 1; }
  const sideAxis = [0, 1, 2].find((a) => a !== longest && a !== upAxis);
  // museau : l'extrémité dont le dernier dixième est le moins haut
  let noseSign = opts.nose === '+x' ? 1 : opts.nose === '-x' ? -1 : 0;
  if (!noseSign) {
    const span = b.size[longest];
    const tall = (from, to) => {
      let lo = Infinity, hi = -Infinity;
      for (const t of tris) for (const v of t) {
        if (v[longest] >= from && v[longest] <= to) { lo = Math.min(lo, v[upAxis]); hi = Math.max(hi, v[upAxis]); }
      }
      return hi - lo;
    };
    const lowEnd = tall(b.lo[longest], b.lo[longest] + span * 0.1);
    const highEnd = tall(b.hi[longest] - span * 0.1, b.hi[longest]);
    noseSign = lowEnd <= highEnd ? 1 : -1;   // museau côté bas -> x croît vers la queue
  }
  const map = (v) => [
    noseSign > 0 ? v[longest] - b.lo[longest] : b.hi[longest] - v[longest],
    upSign > 0 ? v[upAxis] - b.lo[upAxis] : b.hi[upAxis] - v[upAxis],
    v[sideAxis] - (b.lo[sideAxis] + b.hi[sideAxis]) / 2,
  ];
  return { map, length: b.size[longest], info: { longest, upAxis, sideAxis, noseSign, upSign } };
}

// ----------------------------------------------------------- voxelisation
// Cellules : x en tenons, y en plaques, z en tenons ; rayons le long de z.
export function voxelize(tris, map, scale, opts = {}) {
  const cells = new Map();   // "x|y|z" -> true
  const envelope = new Map();   // idem, plein du premier au dernier impact
  const bin = new Map();     // "x|y" -> [tri]
  const T = tris.map((t) => t.map((v) => { const m = map(v); return [m[0] * scale / STUD, m[1] * scale / PLATE, m[2] * scale / STUD]; }));
  let maxX = 0, maxY = 0, minZ = Infinity, maxZ = -Infinity;
  for (const t of T) {
    const xs = t.map((v) => v[0]), ys = t.map((v) => v[1]);
    for (const v of t) { maxX = Math.max(maxX, v[0]); maxY = Math.max(maxY, v[1]); minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]); }
    const x0 = Math.floor(Math.min(...xs)), x1 = Math.floor(Math.max(...xs));
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.floor(Math.max(...ys));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = `${x}|${y}`;
      if (!bin.has(k)) bin.set(k, []);
      bin.get(k).push(t);
    }
  }
  let done = 0;
  for (const [k, list] of bin) {
    if (opts.progress && (++done & 1023) === 0) opts.progress(done / bin.size);
    const [x, y] = k.split('|').map(Number);
    const px = x + 0.5, py = y + 0.5;
    const hits = [];   // [z, sens] : +1 on entre dans le solide, -1 on en sort
    for (const [a, b, c] of list) {
      const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(d) < 1e-9) continue;
      const l1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d;
      const l2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      // d > 0 : sommets dans le sens direct vus de +z, normale vers +z, on sort
      hits.push([l1 * a[2] + l2 * b[2] + l3 * c[2], d > 0 ? -1 : 1]);
    }
    if (hits.length < 2) continue;
    hits.sort((p, q) => p[0] - q[0]);
    // Enroulement : les faces internes d'un maillage fait de blocs
    // s'annulent deux à deux, ce que la parité ne sait pas faire. Si
    // l'enroulement ne retombe pas à zéro (normales incohérentes), on
    // revient à la parité sur les impacts dédoublonnés.
    let w = 0;
    const spans = [];
    for (let i = 0; i < hits.length; i++) {
      const before = w;
      w += hits[i][1];
      if (before <= 0 && w > 0) spans.push([hits[i][0], null]);
      if (before > 0 && w <= 0) spans[spans.length - 1][1] = hits[i][0];
    }
    if (w !== 0 || spans.some((s) => s[1] === null)) {
      const uniq = [hits[0][0]];
      for (const [h] of hits) if (h - uniq[uniq.length - 1] > 1e-4) uniq.push(h);
      spans.length = 0;
      for (let i = 0; i + 1 < uniq.length; i += 2) spans.push([uniq[i], uniq[i + 1]]);
    }
    for (const [h0, h1] of spans) {
      const z0 = Math.ceil(h0 - 0.5), z1 = Math.floor(h1 - 0.5);
      for (let z = z0; z <= z1; z++) cells.set(`${x}|${y}|${z}`, true);
    }
    const e0 = Math.ceil(hits[0][0] - 0.5), e1 = Math.floor(hits[hits.length - 1][0] - 0.5);
    for (let z = e0; z <= e1; z++) envelope.set(`${x}|${y}|${z}`, true);
  }
  // Une coque d'impression 3D est une paroi creuse, ouverte par le poste :
  // le solide n'en retient que la paroi. Si le volume trouvé est bien plus
  // petit que l'enveloppe (du premier au dernier impact de chaque rayon),
  // c'est l'enveloppe qui fait foi.
  const hollow = opts.fill === 'envelope' || (opts.fill !== 'solid' && cells.size < 0.6 * envelope.size);
  const out = fillCavities({ cells: hollow ? envelope : cells, maxX: Math.ceil(maxX), maxY: Math.ceil(maxY), minZ: Math.floor(minZ), maxZ: Math.ceil(maxZ) });
  out.fillMode = hollow ? 'envelope' : 'solid';
  // Deux moitiés d'impression se rejoignent sur une feuillure : la bande
  // autour du plan de coupe est vide de parois. On referme les vides
  // verticaux courts de chaque colonne.
  if (hollow) closeGaps(out, opts.closeGaps ?? 10);
  return out;
}

export function closeGaps(vox, maxGap) {
  const cols = new Map();
  for (const k of vox.cells.keys()) {
    const [x, y, z] = k.split('|').map(Number);
    const ck = `${x}|${z}`;
    if (!cols.has(ck)) cols.set(ck, []);
    cols.get(ck).push(y);
  }
  for (const [ck, ys] of cols) {
    ys.sort((a, b) => a - b);
    const [x, z] = ck.split('|');
    for (let i = 1; i < ys.length; i++) {
      const gap = ys[i] - ys[i - 1] - 1;
      if (gap > 0 && gap <= maxGap) for (let y = ys[i - 1] + 1; y < ys[i]; y++) vox.cells.set(`${x}|${y}|${z}`, true);
    }
  }
}

// Tout ce qui n'est pas atteignable depuis l'extérieur est plein : un
// maillage creux (ou fait de blocs à faces internes) donne ainsi le même
// solide qu'un vrai volume. La page ré-évide la coque ensuite.
export function fillCavities(vox) {
  const { cells, maxX, maxY, minZ, maxZ } = vox;
  const X0 = -1, X1 = maxX + 1, Y0 = -1, Y1 = maxY + 1, Z0 = minZ - 1, Z1 = maxZ + 1;
  const outside = new Set();
  const stack = [[X0, Y0, Z0]];
  const kk = (x, y, z) => `${x}|${y}|${z}`;
  outside.add(kk(X0, Y0, Z0));
  while (stack.length) {
    const [x, y, z] = stack.pop();
    for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx < X0 || nx > X1 || ny < Y0 || ny > Y1 || nz < Z0 || nz > Z1) continue;
      const k = kk(nx, ny, nz);
      if (outside.has(k) || cells.has(k)) continue;
      outside.add(k); stack.push([nx, ny, nz]);
    }
  }
  const filled = new Map();
  for (let x = X0 + 1; x < X1; x++) for (let y = Y0 + 1; y < Y1; y++) for (let z = Z0 + 1; z < Z1; z++) {
    const k = kk(x, y, z);
    if (!outside.has(k)) filled.set(k, true);
  }
  return { ...vox, cells: filled };
}

// ------------------------------------------------------------ classement
// Pour chaque x, on lit la largeur de la tranche à chaque hauteur. Le
// corps est rond : depuis sa hauteur la plus large, la largeur décroît en
// montant comme en descendant. Un renflement qui s'élargit d'un coup
// au-dessus (la verrière) ou une lame de deux tenons (dorsales, caudale,
// nageoires pendantes) ne sont pas le corps.
export function classify(vox, opts = {}) {
  const { cells, maxX, maxY } = vox;
  const groups = new Map();
  const rows = new Map();
  for (const k of cells.keys()) {
    const [x, y, z] = k.split('|').map(Number);
    const kk = `${x}|${y}`;
    if (!rows.has(kk)) rows.set(kk, []);
    rows.get(kk).push(z);
  }
  const body = new Map();   // "x|y" -> [z0, z1] de la plage du corps, ou null
  for (const [kk, zs] of rows) {
    zs.sort((a, b) => a - b);
    let found = null;
    let s = zs[0], p = zs[0];
    for (let i = 1; i <= zs.length; i++) {
      if (i < zs.length && zs[i] === p + 1) { p = zs[i]; continue; }
      if (s <= 0 && p >= -1) found = [s, p];
      if (i < zs.length) { s = zs[i]; p = zs[i]; }
    }
    body.set(kk, found);
  }
  const bw = (x, y) => { const b = body.get(`${x}|${y}`); return b ? b[1] - b[0] + 1 : 0; };

  const bodyTop = new Array(maxX + 1).fill(-Infinity), bodyBot = new Array(maxX + 1).fill(Infinity);
  for (let x = 0; x <= maxX; x++) {
    let yMax = -1, wMax = 0;
    for (let y = 0; y <= maxY; y++) if (bw(x, y) > wMax) { wMax = bw(x, y); yMax = y; }
    if (wMax < 3) continue;   // pas de corps : pointe, arbre, hélice, lame seule
    let y = yMax;
    while (y + 1 <= maxY && bw(x, y + 1) > 2 && bw(x, y + 1) <= bw(x, y) + 2) y++;
    bodyTop[x] = y;
    y = yMax;
    while (y - 1 >= 0 && bw(x, y - 1) > 2 && bw(x, y - 1) <= bw(x, y) + 2) y--;
    bodyBot[x] = y;
  }
  const [cx0, cx1] = String(opts.canopy || '28:50').split(':').map(Number);
  // Sous la verrière, le dessus du corps s'interpole entre ses voisins :
  // la bulle s'élargit trop doucement à ses extrémités pour être
  // détectée comme un renflement.
  const l = cx0 - 1, r = cx1 + 1;
  if (isFinite(bodyTop[l]) && isFinite(bodyTop[r])) {
    for (let x = cx0; x <= cx1; x++) bodyTop[x] = Math.round(bodyTop[l] + (bodyTop[r] - bodyTop[l]) * (x - l) / (r - l));
  }
  const tailX = Math.round(maxX * 0.84);
  const axisAt = (x) => (bodyTop[x] + bodyBot[x]) / 2;
  const lateral = (x, z) => (x < maxX * 0.55 ? 'pectorale' : 'pelvienne') + (z + 0.5 > 0 ? 'D' : 'G');

  for (const k of cells.keys()) {
    const [x, y, z] = k.split('|').map(Number);
    const az = Math.abs(z + 0.5);
    const b = body.get(`${x}|${y}`);
    const inBody = b && z >= b[0] && z <= b[1];
    let g = 'coque';
    if (!isFinite(bodyTop[x])) {
      const ref = [tailX - 1, tailX - 2, tailX - 3].find((i) => isFinite(bodyTop[i]));
      const a = ref !== undefined ? axisAt(ref) : maxY / 2;
      g = x >= tailX ? (Math.abs(y + 0.5 - a) < 4 && x >= maxX - 6 ? 'helice' : 'caudale') : 'coque';
    } else if (y > bodyTop[x]) {
      g = !inBody ? 'coque'
        : bw(x, y) <= 2 ? (x >= tailX - 6 ? 'caudale' : x < maxX * 0.68 ? 'dorsale' : 'dorsale2')
        : (x >= cx0 && x <= cx1 ? 'verriere' : 'coque');
    } else if (y < bodyBot[x]) {
      // quille contiguë au ventre -> coque ; plus bas, une tige de socle
      g = inBody || az <= 1.5
        ? (x >= tailX - 10 ? 'caudale' : y >= bodyBot[x] - 6 ? 'coque' : 'socle')
        : lateral(x, z);
    } else if (!inBody) {
      g = lateral(x, z);
    }
    groups.set(k, g);
  }
  return groups;
}

// ------------------------------------------------- séries, format voxels.json
export function toRuns(groups) {
  const runs = {};
  const byRow = new Map();
  for (const [k, g] of groups) {
    const [x, y, z] = k.split('|').map(Number);
    const rk = `${g}|${x}|${y}`;
    if (!byRow.has(rk)) byRow.set(rk, []);
    byRow.get(rk).push(z);
  }
  const count = {};
  for (const [rk, zs] of byRow) {
    const [g, x, y] = rk.split('|');
    zs.sort((a, b) => a - b);
    (runs[g] ||= []);
    let s = zs[0], p = zs[0];
    for (let i = 1; i <= zs.length; i++) {
      if (i < zs.length && zs[i] === p + 1) { p = zs[i]; continue; }
      runs[g].push([+x, +y, s, p]); count[g] = (count[g] || 0) + (p - s + 1);
      if (i < zs.length) { s = zs[i]; p = zs[i]; }
    }
  }
  return { runs, count };
}

// En dessous, un groupe classé automatiquement n'est qu'un accident du contour
export const MIN_CELLS = { verriere: 800, dorsale: 150, dorsale2: 60, caudale: 400, pectoraleG: 100, pectoraleD: 100, pelvienneG: 40, pelvienneD: 40, helice: 4, socle: 200 };

// Groupes reconnus dans le nom d'un fichier : « canopy », « hull », etc.
export const GROUP_HINTS = [
  ['ignorer', /mold|mould|moule|smoke|fum|dashboard|steering|volant|cabin|interior|int[ée]rieur|figure|tintin|milou|snowy|eye|oeil|œil|yeux/i],
  ['verriere', /canop|verri|glass|dome|cockpit|bubble|window|vitre|bulle/i],
  ['helice', /prop|helic|hélice|screw/i],
  ['socle', /stand|socle|base|support|display|pied|tige|rod|plinth/i],
  ['caudale', /caud|tail|queue|fluke/i],
  ['dorsale', /dors|back.?fin/i],
  ['pelvienneD', /pelv|ventral|mid.?fin|small.?fin/i],
  ['pectoraleG', /(pector|wing|aile|side.?fin).*(left|gauche|_l\b|-l\b|\bl\b)/i],
  ['pectoraleD', /(pector|wing|aile|side.?fin).*(right|droit|_r\b|-r\b|\br\b)/i],
  ['pectoraleD', /pector|wing|aile|side.?fin/i],
  ['coque', /hull|body|coque|corps|shark|requin|sub|top|bottom|haut|bas/i],
];
export function guessGroup(name) {
  for (const [g, re] of GROUP_HINTS) if (re.test(name)) return g;
  return 'auto';
}
// Coché d'office ? Non pour le socle, les pièces à ignorer, et les
// morceaux (« part_01 ») quand un fichier « complete » existe à côté.
export function defaultUse(name, group, names = []) {
  if (group === 'ignorer' || group === 'socle') return false;
  if (/part[_-]?\d/i.test(name) && names.some((n) => /complete|full|entier|assembl/i.test(n))) return false;
  return true;
}
// Emprise d'un fichier, pour juger si les fichiers partagent un repère
export function inspect(tris) {
  const b = bounds(tris);
  return { triangles: tris.length, lo: b.lo, hi: b.hi, size: b.size };
}

// Une demi-coque d'impression est posée face de coupe sur le plateau :
// la retourner, c'est la réfléchir le long de son axe le plus court.
export function flipPart(tris) {
  const b = bounds(tris);
  const a = b.size.indexOf(Math.min(...b.size));
  return tris.map((t) => [t[2], t[1], t[0]].map((v) => { const w = v.slice(); w[a] = -w[a] + 2 * b.lo[a]; return w; }));
}
// Deux fichiers qui partagent leur emprise en plan et partent tous deux
// de zéro sur leur axe court sont deux moitiés posées chacune sur son
// plateau : celle qui se nomme « bottom », « bas »… est à retourner.
export function suggestFlips(files) {
  const out = new Map();
  const isBottom = (n) => /bottom|bas\b|lower|under|ventre|dessous/i.test(n);
  for (const f of files) {
    if (!f.box || !isBottom(f.name)) continue;
    const a = f.box.size.indexOf(Math.min(...f.box.size));
    const mate = files.find((g) => g !== f && g.box && !isBottom(g.name) &&
      [0, 1, 2].filter((i) => i !== a).every((i) => Math.abs(g.box.size[i] - f.box.size[i]) < 0.25 * f.box.size[i] && Math.abs(g.box.lo[i] - f.box.lo[i]) < 0.25 * f.box.size[i]) &&
      Math.abs(g.box.lo[a]) < 0.05 * g.box.size[a] && Math.abs(f.box.lo[a]) < 0.05 * f.box.size[a]);
    if (mate) out.set(f.name, true);
  }
  return out;
}

// ---------------------------------------------------- chaîne complète
// parts : [{ name, tris, group, flip }], group ∈ auto | ignorer | coque | … ;
// opts : { length (tenons), up, nose, canopy, keepStand, hullShare, progress(phase, frac) }
export function meshToVoxels(parts, opts = {}) {
  const progress = opts.progress || (() => {});
  const used = parts.filter((p) => p.group !== 'ignorer' && p.tris.length).map((p) => (p.flip ? { ...p, tris: flipPart(p.tris) } : p));
  if (!used.length) throw new Error('aucun triangle à voxeliser');
  const all = used.flatMap((p) => p.tris);
  progress('orientation', 0);
  const { map, length, info } = orient(all, opts);
  const studs = opts.length || 96;
  const scale = (studs * STUD) / length;   // unités du fichier -> mm
  const groups = new Map();
  let vox = null;
  let hullOnly = false;
  // un seul fichier, sans groupe imposé : le classement automatique
  // sépare coque, verrière, nageoires, hélice et socle
  const auto = used.length === 1 && (!used[0].group || used[0].group === 'auto' || used[0].group === 'coque');
  if (auto) {
    let s = scale;
    for (let pass = 0; pass < 2; pass++) {
      progress('voxelisation', 0);
      vox = voxelize(all, map, s, { ...opts, progress: (f) => progress('voxelisation', f) });
      progress('classement', 0);
      groups.clear();
      const count = {};
      for (const [k, g] of classify(vox, opts)) { groups.set(k, g); count[g] = (count[g] || 0) + 1; }
      // Un groupe trop petit n'en est pas un (bord du museau pris pour une
      // dorsale, rebord du poste pris pour la bulle) : il rejoint la coque.
      for (const [k, g] of groups) if (g !== 'coque' && (count[g] || 0) < (MIN_CELLS[g] ?? 0)) groups.set(k, 'coque');
      const hasTail = (count.caudale || 0) >= MIN_CELLS.caudale;
      // Sans caudale dans le maillage, c'est la coque seule qui a été
      // mise à la longueur totale : on la ramène à sa part (museau ->
      // pédoncule), la caudale et l'hélice viendront du modèle photo.
      if (pass === 0 && !hasTail && opts.hullShare && opts.hullShare < 1) { s = scale * opts.hullShare; hullOnly = true; continue; }
      break;
    }
  } else {
    // Sans classement automatique, les fichiers « auto » sont de la coque.
    // Sans fichier de caudale, la coque seule est ramenée à sa part de la
    // longueur totale.
    let s = scale;
    if (!used.some((p) => p.group === 'caudale') && opts.hullShare && opts.hullShare < 1) { s = scale * opts.hullShare; hullOnly = true; }
    used.forEach((p, i) => {
      progress('voxelisation', i / used.length);
      const v = voxelize(p.tris, map, s, { ...opts, progress: (f) => progress('voxelisation', (i + f) / used.length) });
      const g = !p.group || p.group === 'auto' ? 'coque' : p.group;
      for (const k of v.cells.keys()) groups.set(k, g);
      vox = vox ? { ...vox, maxX: Math.max(vox.maxX, v.maxX), maxY: Math.max(vox.maxY, v.maxY), fillMode: v.fillMode } : v;
    });
  }
  if (!opts.keepStand) for (const [k, g] of groups) if (g === 'socle') groups.delete(k);
  progress('séries', 0);
  const { runs, count } = toRuns(groups);
  return {
    source: used.map((p) => p.name), length: studs, hullOnly, maxY: vox.maxY, cells: count, runs, fillMode: vox.fillMode,
    triangles: all.length, fileLength: length, scale, axes: info,
  };
}
