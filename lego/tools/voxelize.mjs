#!/usr/bin/env node
// ================================================================
// voxelize.mjs — d'un maillage STL au sous-marin en cellules
//
//   node lego/tools/voxelize.mjs modele.stl [autres.stl…] [options]
//
// Lit un ou plusieurs STL (binaire ou ASCII), oriente le modèle
// (grand axe -> x, museau en x = 0, dessus en +y), le met à l'échelle
// de 96 tenons, le voxelise par parité de rayons, classe les cellules
// et écrit lego/voxels.json, que la page charge à la place des profils
// paramétriques.
//
// Options :
//   --length 96        longueur en tenons, museau -> hélice
//   --up y|z|-y|-z     axe « dessus » du fichier (auto sinon)
//   --nose +x|-x       côté du museau (auto sinon)
//   --canopy 28:50     plage x (tenons) de la verrière
//   --keep-stand       garder le socle du fichier (sinon retiré)
//   --group nom=fichier  forcer le groupe d'un fichier (corps, verriere,
//                      dorsale, caudale, pectoraleG, socle, helice…)
//   --out chemin       sortie (défaut : lego/voxels.json)
// ================================================================

import fs from 'node:fs';
import path from 'node:path';

const STUD = 8, PLATE = 3.2;

// ---------------------------------------------------------------- STL
export function parseSTL(buf) {
  const head = buf.subarray(0, 5).toString('ascii');
  const isBinary = !(head === 'solid' && !looksBinary(buf));
  const tris = [];
  if (isBinary) {
    const n = buf.readUInt32LE(80);
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50;
      const v = [];
      for (let k = 0; k < 3; k++) {
        const p = o + 12 + k * 12;
        v.push([buf.readFloatLE(p), buf.readFloatLE(p + 4), buf.readFloatLE(p + 8)]);
      }
      tris.push(v);
    }
  } else {
    const txt = buf.toString('utf8');
    const re = /vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g;
    let m, cur = [];
    while ((m = re.exec(txt))) {
      cur.push([+m[1], +m[2], +m[3]]);
      if (cur.length === 3) { tris.push(cur); cur = []; }
    }
  }
  return tris;
}
function looksBinary(buf) {
  if (buf.length < 84) return false;
  const n = buf.readUInt32LE(80);
  return buf.length === 84 + n * 50;
}

// ---------------------------------------------------------- orientation
function bounds(tris) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (const v of t) for (let a = 0; a < 3; a++) {
    if (v[a] < lo[a]) lo[a] = v[a];
    if (v[a] > hi[a]) hi[a] = v[a];
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}

// Remappe les axes : renvoie une fonction v -> [x, y, z] modèle
export function orient(tris, opts) {
  const b = bounds(tris);
  const longest = b.size.indexOf(Math.max(...b.size));
  const others = [0, 1, 2].filter((a) => a !== longest);
  // « dessus » : parmi les deux axes restants, le plus étendu (la
  // caudale et la dorsale dépassent plus que les pectorales)
  let up = opts.up;
  let upAxis, upSign = 1;
  if (up) { upAxis = { x: 0, y: 1, z: 2 }[up.replace('-', '')]; upSign = up.startsWith('-') ? -1 : 1; }
  else { upAxis = b.size[others[0]] >= b.size[others[1]] ? others[0] : others[1]; }
  const sideAxis = [0, 1, 2].find((a) => a !== longest && a !== upAxis);
  // museau : l'extrémité dont le dernier dixième est le moins haut
  let noseSign = opts.nose ? (opts.nose === '+x' ? 1 : -1) : 0;
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
export function voxelize(tris, map, scale, opts) {
  const cells = new Map();   // "x|y|z" -> true
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
  for (const [k, list] of bin) {
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
    let w = 0, ok = true;
    const spans = [];
    for (let i = 0; i < hits.length; i++) {
      const before = w;
      w += hits[i][1];
      if (before <= 0 && w > 0) spans.push([hits[i][0], null]);
      if (before > 0 && w <= 0) spans[spans.length - 1][1] = hits[i][0];
    }
    if (w !== 0 || spans.some((s) => s[1] === null)) {
      ok = false;
      const uniq = [hits[0][0]];
      for (const [h] of hits) if (h - uniq[uniq.length - 1] > 1e-4) uniq.push(h);
      spans.length = 0;
      for (let i = 0; i + 1 < uniq.length; i += 2) spans.push([uniq[i], uniq[i + 1]]);
    }
    for (const [h0, h1] of spans) {
      const z0 = Math.ceil(h0 - 0.5), z1 = Math.floor(h1 - 0.5);
      for (let z = z0; z <= z1; z++) cells.set(`${x}|${y}|${z}`, true);
    }
  }
  return fillCavities({ cells, maxX: Math.ceil(maxX), maxY: Math.ceil(maxY), minZ: Math.floor(minZ), maxZ: Math.ceil(maxZ) });
}

// Tout ce qui n'est pas atteignable depuis l'extérieur est plein : un
// maillage creux (ou fait de blocs à faces internes) donne ainsi le même
// solide qu'un vrai volume. La page ré-évide la coque ensuite.
function fillCavities(vox) {
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
export function classify(vox, opts) {
  const { cells, maxX, maxY } = vox;
  const groups = new Map();
  // rangées (x, y) -> liste triée des z ; plage du corps = plage contiguë
  // qui contient l'axe (z = -1 ou 0)
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
  const [cx0, cx1] = (opts.canopy || '28:50').split(':').map(Number);
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

// ------------------------------------------------------------------ main
function main() {
  const args = process.argv.slice(2);
  const opts = { length: 96, out: 'lego/voxels.json', groupOf: {} };
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--length') opts.length = +args[++i];
    else if (a === '--up') opts.up = args[++i];
    else if (a === '--nose') opts.nose = args[++i];
    else if (a === '--canopy') opts.canopy = args[++i];
    else if (a === '--keep-stand') opts.keepStand = true;
    else if (a === '--out') opts.out = args[++i];
    else if (a === '--group') { const [g, f] = args[++i].split('='); opts.groupOf[path.basename(f)] = g; }
    else files.push(a);
  }
  if (!files.length) { console.error('usage : voxelize.mjs modele.stl [options]'); process.exit(1); }

  // tous les fichiers partagent le même repère : on oriente sur l'ensemble
  const parts = files.map((f) => ({ file: f, tris: parseSTL(fs.readFileSync(f)) }));
  const all = parts.flatMap((p) => p.tris);
  const { map, length, info } = orient(all, opts);
  const scale = (opts.length * STUD) / length;   // unités du fichier -> mm
  console.error(`triangles : ${all.length} · longueur fichier ${length.toFixed(2)} u -> ${opts.length} tenons (× ${scale.toFixed(4)}) · axes ${JSON.stringify(info)}`);

  const groups = new Map();
  let vox;
  if (parts.length === 1 && !opts.groupOf[path.basename(parts[0].file)]) {
    vox = voxelize(parts[0].tris, map, scale, opts);
    for (const [k, g] of classify(vox, opts)) groups.set(k, g);
  } else {
    for (const p of parts) {
      const v = voxelize(p.tris, map, scale, opts);
      const g = opts.groupOf[path.basename(p.file)] || 'coque';
      for (const k of v.cells.keys()) groups.set(k, g);
      vox = vox ? { ...vox, maxX: Math.max(vox.maxX, v.maxX), maxY: Math.max(vox.maxY, v.maxY) } : v;
    }
  }
  if (!opts.keepStand) for (const [k, g] of groups) if (g === 'socle') groups.delete(k);

  // séries le long de z, par groupe
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
  const out = { source: files.map((f) => path.basename(f)), length: opts.length, maxY: vox.maxY, cells: count, runs };
  fs.writeFileSync(opts.out, JSON.stringify(out));
  console.error(`cellules par groupe : ${JSON.stringify(count)} -> ${opts.out}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
