// ================================================================
// BRIQUE STUDIO — MODÈLE 002 · SOUS-MARIN REQUIN
// Générateur d'après la maquette de Tintinimaginatio, dont les contours
// ont été relevés sur les photos officielles (profile.js) : dos noir,
// ventre crème séparés par une ligne ondulée, verrière transparente sur
// le dos, hélice dorée à l'extrême arrière.
//
// Chaîne de traitement :
//   1. tables de profil     -> solide implicite (coque, nageoires…)
//   2. voxelisation         -> cellules 1 × 1 × 1 plaque
//   3. évidement            -> peau + poutre longitudinale
//   4. livrée               -> noir / crème, gueule, œil, ouïes
//   5. pavage               -> rectangles = plaques réelles
//   6. fusion verticale     -> 3 plaques identiques = 1 brique
//
// Aucune dépendance : tourne dans le navigateur comme sous Node.
// ================================================================

import { PROFILE as RAW } from './profile.js';

// Corrections des relevés photo : là où l'œil, une nageoire, l'hélice ou
// une tige du socle mordent sur le contour, la ligne est rétablie par
// interpolation entre les tenons sains voisins ; les pointes cachées sur
// la photo sont complétées à la main.
function interp(obj, from, to) {
  const a = obj[from - 1], b = obj[to + 1];
  for (let x = from; x <= to; x++) obj[x] = a + (b - a) * (x - from + 1) / (to - from + 2);
}
function patchProfile(raw) {
  const p = JSON.parse(JSON.stringify(raw));
  interp(p.bot, 10, 10);            // l'œil coupe le contour du ventre
  interp(p.bot, 23, 25);            // racine de la pectorale
  interp(p.halfw, 27, 34);          // pectorales vues de dessus
  interp(p.livery, 9, 10);          // œil
  interp(p.livery, 38, 42);         // reflets de la verrière
  interp(p.canopyHalfZ, 30, 34);    // passagers vus à travers la verrière
  interp(p.pectoralHalfZ, 28, 29);
  // pointe de la pectorale, derrière la tige du socle sur la photo :
  // bord de fuite libre puis pointe, mesurés sur le poster
  Object.assign(p.pectoral, { 31: [38.0, 28.4], 32: [32.0, 25.9], 33: [26.3, 23.4], 34: [23.0, 21.5] });
  // lobe inférieur de la caudale, symétrique du supérieur autour de l'arbre
  const ax = 68.7;
  for (const x of [90, 91, 92]) { const [y0, y1] = p.caudalV[x][0]; p.caudalV[x].push([2 * ax - y1, 2 * ax - y0]); }
  p.caudalV[96].push([2 * ax - 114.3, 2 * ax - 113.9]);
  // la verrière court sous la dorsale jusqu'à x = 49,5 ; son toit y
  // redescend et la dorsale naît dessus, à x = 44,5
  delete p.canopy[25]; delete p.canopy[50];
  for (const [x, t] of [[44, 101], [45, 101], [46, 100.5], [47, 99], [48, 96], [49, 92]]) p.canopy[x][0] = t;
  delete p.dorsal[42]; delete p.dorsal[43];
  delete p.caudalH[82];
  // les pointes de la lame horizontale sont rognées d'un demi-tenon : au
  // bout, une cellule seule ne s'agrafe à rien
  for (const x of Object.keys(p.caudalH)) {
    p.caudalH[x] = p.caudalH[x].map(([z0, z1]) => [Math.max(z0, -16.4), Math.min(z1, 16.4)]).filter(([z0, z1]) => z1 - z0 > 0.6);
    if (!p.caudalH[x].length) delete p.caudalH[x];
  }
  return p;
}
const PR = patchProfile(RAW);

export const STUD_MM = 8;      // 1 tenon = 8 mm
export const PLATE_MM = 3.2;   // 1 plaque = 3,2 mm (1 brique = 3 plaques)

// --- Enveloppe générale (tenons en X/Z, plaques en Y) ------------
// Toutes les cotes viennent de profile.js, relevé sur les photos
// officielles ; y = 0 est le dessus de la plaque du socle.
export const HULL_LEN = 83;    // museau -> racine de la caudale
export const TOTAL_LEN = 96;   // hélice comprise = 76,8 cm
export const AXIS_Y = 67;      // hauteur moyenne de l'axe, pour les bandes de montage
export const NY = 120;
export const Z_MIN = -19;
export const Z_MAX = 19;
export const CROSS_N = 2.2;    // exposant de la super-ellipse de section

// --- Couleurs LEGO utilisées -------------------------------------
export const COLORS = {
  black: { key: 'black', name: 'Noir',                 ldraw: 0,   bl: 11,  hex: '#1b1e21' },
  white: { key: 'white', name: 'Blanc',                ldraw: 15,  bl: 1,   hex: '#f2f3ee' },
  lgrey: { key: 'lgrey', name: 'Gris pierre clair',    ldraw: 71,  bl: 86,  hex: '#9aa1a6' },
  dgrey: { key: 'dgrey', name: 'Gris pierre foncé',    ldraw: 72,  bl: 85,  hex: '#5b6167' },
  gold:  { key: 'gold',  name: 'Or perlé',             ldraw: 297, bl: 115, hex: '#c9a13b' },
  trans: { key: 'trans', name: 'Transparent',          ldraw: 47,  bl: 12,  hex: '#d3e3ea', alpha: 0.4 },
};

// --- Catalogue de pièces -----------------------------------------
// design = référence BrickLink / LEGO ; ldraw = fichier .dat
// dz × dx = emprise en tenons ; h = hauteur en plaques
export const PARTS = {
  'plate-1x1': { label: 'Plaque 1 × 1', design: '3024', ldraw: '3024.dat', dz: 1, dx: 1, h: 1, kind: 'plate' },
  'plate-1x2': { label: 'Plaque 1 × 2', design: '3023', ldraw: '3023.dat', dz: 1, dx: 2, h: 1, kind: 'plate' },
  'plate-1x3': { label: 'Plaque 1 × 3', design: '3623', ldraw: '3623.dat', dz: 1, dx: 3, h: 1, kind: 'plate' },
  'plate-1x4': { label: 'Plaque 1 × 4', design: '3710', ldraw: '3710.dat', dz: 1, dx: 4, h: 1, kind: 'plate' },
  'plate-1x6': { label: 'Plaque 1 × 6', design: '3666', ldraw: '3666.dat', dz: 1, dx: 6, h: 1, kind: 'plate' },
  'plate-1x8': { label: 'Plaque 1 × 8', design: '3460', ldraw: '3460.dat', dz: 1, dx: 8, h: 1, kind: 'plate' },
  'plate-2x2': { label: 'Plaque 2 × 2', design: '3022', ldraw: '3022.dat', dz: 2, dx: 2, h: 1, kind: 'plate' },
  'plate-2x3': { label: 'Plaque 2 × 3', design: '3021', ldraw: '3021.dat', dz: 2, dx: 3, h: 1, kind: 'plate' },
  'plate-2x4': { label: 'Plaque 2 × 4', design: '3020', ldraw: '3020.dat', dz: 2, dx: 4, h: 1, kind: 'plate' },
  'plate-2x6': { label: 'Plaque 2 × 6', design: '3795', ldraw: '3795.dat', dz: 2, dx: 6, h: 1, kind: 'plate' },
  'plate-2x8': { label: 'Plaque 2 × 8', design: '3034', ldraw: '3034.dat', dz: 2, dx: 8, h: 1, kind: 'plate' },
  'brick-1x1': { label: 'Brique 1 × 1', design: '3005', ldraw: '3005.dat', dz: 1, dx: 1, h: 3, kind: 'brick' },
  'brick-1x2': { label: 'Brique 1 × 2', design: '3004', ldraw: '3004.dat', dz: 1, dx: 2, h: 3, kind: 'brick' },
  'brick-1x3': { label: 'Brique 1 × 3', design: '3622', ldraw: '3622.dat', dz: 1, dx: 3, h: 3, kind: 'brick' },
  'brick-1x4': { label: 'Brique 1 × 4', design: '3010', ldraw: '3010.dat', dz: 1, dx: 4, h: 3, kind: 'brick' },
  'brick-1x6': { label: 'Brique 1 × 6', design: '3009', ldraw: '3009.dat', dz: 1, dx: 6, h: 3, kind: 'brick' },
  'brick-1x8': { label: 'Brique 1 × 8', design: '3008', ldraw: '3008.dat', dz: 1, dx: 8, h: 3, kind: 'brick' },
  'brick-2x2': { label: 'Brique 2 × 2', design: '3003', ldraw: '3003.dat', dz: 2, dx: 2, h: 3, kind: 'brick' },
  'brick-2x3': { label: 'Brique 2 × 3', design: '3002', ldraw: '3002.dat', dz: 2, dx: 3, h: 3, kind: 'brick' },
  'brick-2x4': { label: 'Brique 2 × 4', design: '3001', ldraw: '3001.dat', dz: 2, dx: 4, h: 3, kind: 'brick' },
  'brick-2x6': { label: 'Brique 2 × 6', design: '2456', ldraw: '2456.dat', dz: 2, dx: 6, h: 3, kind: 'brick' },
  'brick-2x8': { label: 'Brique 2 × 8', design: '3007', ldraw: '3007.dat', dz: 2, dx: 8, h: 3, kind: 'brick' },
};

// --- Chapitres de montage --------------------------------------------
// Le modèle se monte du bas vers le haut, toutes pièces confondues :
// chaque couche contient ce qui s'y trouve — coque, poutre, verrière,
// dorsales, caudale. Seules les nageoires pendantes (pectorales,
// pelviennes, lobe inférieur de la caudale), qui n'ont rien sous elles,
// se montent à plat d'abord, puis se pressent par en dessous au moment
// où la couche de coque qui les reçoit vient d'être posée. Le socle se
// monte en dernier et reçoit le sous-marin.
export const STAGES = [
  { id: 1, key: 'sous-ensembles', label: 'Sous-ensembles',  blurb: 'Les nageoires pendantes, montées à plat de la pointe vers l’attache : deux pectorales, deux pelviennes et le lobe inférieur de la caudale. Elles seront pressées sous la coque au fil du montage.' },
  { id: 2, key: 'ventre',         label: 'Ventre',          blurb: 'Les premières couches de la coque, depuis la quille, sur une planche plane. La peau suit la section du corps et s’élargit à chaque couche.' },
  { id: 3, key: 'flancs',         label: 'Flancs',          blurb: 'Les couches à hauteur d’axe : la poutre longitudinale s’intègre, les nageoires pendantes se fixent, la racine de la caudale se pose sur son lobe inférieur.' },
  { id: 4, key: 'dos',            label: 'Dos',             blurb: 'La coque se referme. La base de la verrière, la dorsale et la seconde dorsale démarrent sur les dernières couches de peau.' },
  { id: 5, key: 'superstructures', label: 'Verrière, dorsale, caudale', blurb: 'Tout ce qui dépasse du dos : la voûte et ses arceaux, la dorsale en faucille, le lobe supérieur de la caudale, l’arbre et l’hélice.' },
  { id: 6, key: 'socle',          label: 'Socle',           blurb: 'La plaque noire en deux couches croisées, les deux tiges, puis la pose du sous-marin.' },
];

// --- Sous-ensembles (pour l'éclaté) ------------------------------
export const GROUPS = {
  chassis:    { label: 'Poutre longitudinale', stage: 1, dir: [0, -1, 0] },
  avant:      { label: 'Coque avant',          stage: 1, dir: [-1, 0.2, 0] },
  arriere:    { label: 'Coque arrière',        stage: 1, dir: [1, 0.2, 0] },
  verriere:   { label: 'Verrière',             stage: 2, dir: [0, 1, 0] },
  pectoraleD: { label: 'Pectorale tribord',    stage: 3, dir: [0, -0.2, 1] },
  pectoraleG: { label: 'Pectorale bâbord',     stage: 3, dir: [0, -0.2, -1] },
  pelvienneD: { label: 'Pelvienne tribord',    stage: 3, dir: [0, -0.6, 1] },
  pelvienneG: { label: 'Pelvienne bâbord',     stage: 3, dir: [0, -0.6, -1] },
  dorsale:    { label: 'Dorsale',              stage: 3, dir: [0, 1, 0] },
  dorsale2:   { label: 'Dorsale secondaire',   stage: 3, dir: [0, 1, 0] },
  caudale:    { label: 'Caudale',              stage: 4, dir: [1, 0.3, 0] },
  helice:     { label: 'Hélice',               stage: 4, dir: [1, 0, 0] },
  socle:      { label: 'Socle',                stage: 5, dir: [0, -1, 0] },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ================================================================
// 1. PROFILS — tables relevées sur les photos, interpolées par tenon
// ================================================================

// Interpolation linéaire entre tenons entiers, valeur tenue aux bords.
function table(obj, shift = 0) {
  const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
  const get = (k) => obj[k];
  return (x) => {
    x -= shift;
    if (!keys.length) return undefined;
    if (x <= keys[0]) return get(keys[0]);
    if (x >= keys[keys.length - 1]) return get(keys[keys.length - 1]);
    let i = 0; while (keys[i + 1] < x) i++;
    const a = keys[i], b = keys[i + 1];
    if (b === undefined) return get(a);
    const va = get(a), vb = get(b);
    if (typeof va !== 'number') return va;
    return va + (vb - va) * (x - a) / (b - a);
  };
}
const inRange = (obj, x) => { const k = Object.keys(obj).map(Number); return x >= Math.min(...k) && x <= Math.max(...k) + 1; };

const T = {
  top: table(PR.top), bot: table(PR.bot), halfw: table(PR.halfw),
  livery: table(PR.livery),
  canopyHalfZ: table(PR.canopyHalfZ),
  dorsal: table(PR.dorsal), dorsal2: table(PR.dorsal2),
};

const mx = (x) => Math.max(0, Math.min(MESH.len - 1, Math.floor(x)));
export function halfTop(x) {
  if (MESH) { const t = MESH.top(mx(x)), b = MESH.bot(mx(x)); return t !== undefined ? (t - b) / 2 : 0; }
  return x > HULL_LEN ? 0 : (T.top(x) - T.bot(x)) / 2;
}
export function halfBottom(x) { return halfTop(x); }
export function halfWidth(x) {
  if (MESH) { const w = MESH.wid(mx(x)); return w !== undefined ? Math.max(0.5, w) : 0.5; }
  if (x > HULL_LEN) return 0;
  // au-delà de x = 79, la vue de dessus est parasitée par la caudale :
  // on file en ligne droite vers le pédoncule
  if (x > 79) return Math.max(0.8, T.halfw(79) * (1 - (x - 79) / 6));
  return Math.max(0.5, T.halfw(x));
}
export function axisY(x) {
  if (MESH) { const t = MESH.top(mx(x)), b = MESH.bot(mx(x)); return t !== undefined ? (t + b) / 2 : AXIS_Y; }
  return (T.top(Math.min(x, HULL_LEN)) + T.bot(Math.min(x, HULL_LEN))) / 2;
}
export function hullTop(x)    { return axisY(x) + halfTop(x); }
export function hullBottom(x) { return axisY(x) - halfBottom(x); }

function hullSurfaceTop(x, z) {
  const W = halfWidth(x);
  const k = Math.max(0, 1 - Math.pow(Math.abs(z / W), CROSS_N));
  return axisY(x) + halfTop(x) * Math.pow(k, 1 / CROSS_N);
}

function insideHull(x, y, z) {
  if (x < 0 || x > HULL_LEN) return false;
  const W = halfWidth(x);
  const dy = y - axisY(x);
  const H = dy >= 0 ? halfTop(x) : halfBottom(x);
  if (W < 0.45 || H < 0.6) return false;
  return Math.pow(Math.abs(z / W), CROSS_N) + Math.pow(Math.abs(dy / H), CROSS_N) <= 1;
}

// --- Verrière : contour de profil × demi-largeur vue de dessus ---------
// Le pare-brise monte en rampe douce sur sept tenons, et l'avant de la
// bulle est arrondi en plan ; derrière, le toit suit le relevé.
const CANOPY = { x0: Math.min(...Object.keys(PR.canopy).map(Number)) - 1, x1: Math.max(...Object.keys(PR.canopy).map(Number)) + 1, ramp: 7, ribs: [] };
{ const n = 3, len = CANOPY.x1 - CANOPY.x0; for (let i = 1; i <= n; i++) CANOPY.ribs.push(CANOPY.x0 + len * i / (n + 1)); }
const canopySide = table(Object.fromEntries(Object.entries(PR.canopy).map(([k, v]) => [k, v[0]])));
function canopy(x, y, z) {
  if (x < CANOPY.x0 || x > CANOPY.x1) return false;
  // vue de dessus (plus proche de l'objectif, donc plus longue) recalée
  // sur l'emprise mesurée de profil
  const keys = Object.keys(PR.canopyHalfZ).map(Number);
  const u = Math.min(...keys) + (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0) * (Math.max(...keys) - Math.min(...keys));
  const t = clamp((x - CANOPY.x0) / CANOPY.ramp, 0, 1);
  const hz = T.canopyHalfZ(u) * Math.sqrt(1 - (1 - t) * (1 - t));
  if (!hz || hz < 0.5 || Math.abs(z) > hz) return false;
  const ease = (1 - Math.cos(Math.PI * t)) / 2;
  const roof = hullTop(x) + (canopySide(Math.max(x, CANOPY.x0 + CANOPY.ramp)) - hullTop(x)) * ease;
  const top = hullTop(x) + (roof - hullTop(x)) * Math.sqrt(Math.max(0, 1 - Math.pow(z / hz, 2)));
  if (y > top || y <= hullSurfaceTop(x, z) - 1.5) return null;
  // sous la bulle, le dos est aplani en un pont : la bulle y repose à plat
  return y > hullTop(x) - 1 ? 'verriere' : 'pont';
}

// --- Dorsales : contour de profil, lame de deux tenons ------------------
function dorsalAt(x, y) {
  if (inRange(PR.dorsal, x) && y > hullTop(x) - 1 && y <= T.dorsal(x)) return 'dorsale';
  if (inRange(PR.dorsal2, x) && y > hullTop(x) - 1 && y <= T.dorsal2(x)) return 'dorsale2';
  return null;
}

// --- Caudale en croix : deux croissants identiques, l'un vertical (vu de
// profil), l'autre horizontal (vu de dessus). L'arbre de l'hélice est le
// prolongement de la poutre de châssis, posé par addChassis.
const SHAFT = { x0: HULL_LEN, x1: 95, hub: 93 };
function caudal(x, y, z) {
  const xi = Math.floor(x);
  const a = axisY(HULL_LEN);
  // lame verticale, deux tenons d'épaisseur ; la racine s'épaissit à quatre
  const thick = x >= 90 ? 1 : Math.abs(y - a) < 2.5 ? 3 : Math.abs(y - a) < 4.5 ? 2 : 1;
  if (z >= -thick && z < thick) {
    const runs = PR.caudalV[xi];
    if (runs) for (const [y0, y1] of runs) if (y >= y0 && y <= y1) return true;
  }
  // lame horizontale : intervalles en z, trois plaques d'épaisseur sur l'axe
  if (y >= a - 1 && y < a + 2) {
    const runs = PR.caudalH[xi];
    if (runs) for (const [z0, z1] of runs) if (z >= z0 && z <= z1) return true;
  }
  return false;
}

// --- Nageoires pendantes -------------------------------------------
// Vue de profil : bord de fuite et bord d'attaque par tenon. Vue de
// dessus : la nageoire s'écarte du flanc à mesure qu'elle descend, de
// zRoot (sous le flanc) à zTip (écartement mesuré à la pointe). Elle
// remonte jusqu'à la peau de la coque pour s'y agrafer sur toute sa
// racine ; deux tenons d'épaisseur.
const FINS = {
  pectoral: { side: PR.pectoral, yRoot: 47.5, depth: 25, zRoot: 6.3, zTip: 12.4 },
  pelvic:   { side: PR.pelvic,   yRoot: 55.5, depth: 7.5, zRoot: 4.3, zTip: 6.8 },
};
function hangingFin(x, y, z, fin) {
  const v = fin.side[Math.floor(x)];
  if (!v) return false;
  const [yHi, yLo] = v[0] > v[1] ? v : [v[1], v[0]];
  if (y < yLo - 0.5) return false;
  const az = Math.abs(z);
  const t = clamp((fin.yRoot - y) / fin.depth, 0, 1);
  const zc = fin.zRoot + (fin.zTip - fin.zRoot) * t;
  if (Math.abs(az - zc) > 1) return false;
  // sous la coque : jusqu'à la peau, à cet écartement
  const W = halfWidth(x);
  const zz = Math.min(az, Math.max(0, W - 0.8));
  const k = Math.max(0, 1 - Math.pow(zz / W, CROSS_N));
  const surf = axisY(x) - halfBottom(x) * Math.pow(k, 1 / CROSS_N);
  const yMax = yHi >= hullBottom(x) - 1.5 ? surf : yHi;   // racine sur le ventre : jusqu'à la peau
  return y <= yMax + 0.5;
}

// --- Solide complet ----------------------------------------------
function solidAt(x, y, z) {
  if (insideHull(x, y, z)) return x < 38 ? 'avant' : 'arriere';
  const c = canopy(x, y, z);
  if (c) return c === 'pont' ? (x < 38 ? 'avant' : 'arriere') : 'verriere';
  if (caudal(x, y, z)) return 'caudale';
  if (z >= -1 && z < 1) { const d = dorsalAt(x, y); if (d) return d; }
  if (hangingFin(x, y, z, FINS.pectoral)) return z > 0 ? 'pectoraleD' : 'pectoraleG';
  if (hangingFin(x, y, z, FINS.pelvic))   return z > 0 ? 'pelvienneD' : 'pelvienneG';
  return null;
}

// ================================================================
// 2-3. VOXELISATION + ÉVIDEMENT
// ================================================================

const key = (x, y, z) => `${x}|${y}|${z}`;

function voxelize() {
  const solid = new Map();
  for (let x = 0; x < TOTAL_LEN; x++) {
    const cx = x + 0.5;
    for (let y = 0; y < NY; y++) {
      const cy = y + 0.5;
      for (let z = Z_MIN; z < Z_MAX; z++) {
        const g = solidAt(cx, cy, z + 0.5);
        if (g) solid.set(key(x, y, z), g);
      }
    }
  }
  return solid;
}

// La peau brute ne tient pas debout : deux anneaux voisins sont côte à
// côte et non superposés, et deux colonnes voisines du flanc peuvent ne
// pas se toucher quand la largeur change d'un tenon. On dilate la peau
// de deux cellules en hauteur et d'une en longueur, vers l'intérieur :
// les anneaux se recouvrent et les colonnes se rejoignent. Museau et
// pédoncule, trop étroits pour être creux, restent pleins.
const HOLLOW = new Set(['avant', 'arriere', 'coque']);   // la verrière reste pleine
function shell(solid) {
  const skin = new Map();
  const exposedCells = [];
  for (const [k, g] of solid) {
    if (!HOLLOW.has(g)) { skin.set(k, g); continue; }
    const [x, y, z] = k.split('|').map(Number);
    if (!MESH && halfWidth(x + 0.5) < 4.5) { skin.set(k, g); exposedCells.push([x, y, z]); continue; }
    const exposed =
      !solid.has(key(x + 1, y, z)) || !solid.has(key(x - 1, y, z)) ||
      !solid.has(key(x, y + 1, z)) || !solid.has(key(x, y - 1, z)) ||
      !solid.has(key(x, y, z + 1)) || !solid.has(key(x, y, z - 1));
    if (exposed) { skin.set(k, g); exposedCells.push([x, y, z]); }
  }
  const out = new Map(skin);
  for (const [x, y, z] of exposedCells) {
    for (const [dx, dy] of [[0, -2], [0, -1], [0, 1], [0, 2], [-1, 0], [1, 0]]) {
      const kk = key(x + dx, y + dy, z);
      if (solid.has(kk) && !out.has(kk)) out.set(kk, solid.get(kk));
    }
  }
  return out;
}

// Poutre longitudinale, sur six plaques : deux assises de briques à
// joints croisés. Une seule assise resterait un plancher flottant.
// Au-delà de la coque, elle continue sur deux plaques et deux tenons :
// c'est l'arbre de l'hélice, qui traverse la racine de la caudale.
function addChassis(cells) {
  const len = MESH ? MESH.len : HULL_LEN;
  for (let x = 0; x < len; x++) {
    const cx = x + 0.5;
    const a = Math.floor(axisY(cx));
    for (const y of [a - 3, a - 2, a - 1, a, a + 1, a + 2]) {
      for (let z = Z_MIN; z < Z_MAX; z++) {
        if (!insideHull(cx, y + 0.5, z + 0.5)) continue;
        const k = key(x, y, z);
        if (cells.has(k)) continue;   // la peau prime
        cells.set(k, 'chassis');
      }
    }
  }
  if (MESH && !MESH.shaft) return;
  const a = Math.floor(axisY(HULL_LEN));
  for (let x = SHAFT.x0; x < SHAFT.x1; x++) {
    for (const [y, wide] of [[a - 1, 90], [a, 88]]) {
      for (const z of (x < wide ? [-2, -1, 0, 1] : [-1, 0])) cells.set(key(x, y, z), 'chassis');
    }
  }
}

// ================================================================
// 4. LIVRÉE — la frontière noir / blanc relevée au pixel sur le profil
// ================================================================
export function liveryY(x) { return T.livery(Math.min(x, HULL_LEN)); }

function colorAt(x, y, z, group) {
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

  if (group === 'socle') return 'black';
  if (group === 'helice') return 'gold';
  if (group === 'verriere') {
    // nervures chromées en surface seulement ; l'intérieur reste en verre
    const rib = CANOPY.ribs.some((r) => Math.abs(cx - r) < 0.6);
    const surface = !solidAt(cx, cy + 1, cz) || !solidAt(cx, cy, cz + 1) || !solidAt(cx, cy, cz - 1);
    return (rib && surface) || cy < hullTop(cx) + 0.5 ? 'lgrey' : 'trans';   // anneau de base chromé
  }

  const onFlank = Math.abs(cz) > halfWidth(cx) - 1.5;

  // Œil : anneau blanc à centre noir, à sa place sur la photo
  const dEye = Math.hypot(cx - PR.eye.x, (cy - PR.eye.y) * 0.4);
  if (onFlank && dEye < PR.eye.r + 0.6) return dEye < 0.55 ? 'black' : 'white';

  // Ouïes : la photo en montre quatre à un tenon d'écart, qui se
  // toucheraient en briques ; on en pose trois, noires, séparées de blanc
  if (onFlank && cy > PR.gills.y[0] && cy < PR.gills.y[1]) {
    const first = Math.round(Math.max(...PR.gills.x));
    for (const gx of [first, first - 2, first - 4]) if (Math.floor(cx) === gx) return 'black';
  }

  // Nageoires : entièrement noires, comme sur la maquette
  if (fam(group) !== 'coque') return 'black';

  return cy >= liveryY(cx) ? 'black' : 'white';
}

// ================================================================
// 5. PAVAGE — rectangles = pièces réelles
// ================================================================

const RECTS = [
  [2, 8], [8, 2], [2, 6], [6, 2],
  [2, 4], [4, 2], [1, 8], [8, 1],
  [2, 3], [3, 2], [1, 6], [6, 1],
  [2, 2], [1, 4], [4, 1],
  [1, 3], [3, 1], [1, 2], [2, 1], [1, 1],
];
const RECTS_SHORT = RECTS.filter(([dz, dx]) => dz <= 4 && dx <= 4);
// La lame horizontale de la caudale n'a que deux plaques d'épaisseur :
// on la pave en rangs sur une assise et en colonnes sur l'autre, pour
// que les deux nappes se croisent.
const RECTS_ROWS = RECTS.filter(([dz]) => dz <= 2);
const RECTS_COLS = RECTS.filter(([, dx]) => dx <= 2);
// Une assise sur deux est pavée en miroir, depuis l'autre bout du modèle :
// les joints des nappes plates (ventre, dos, caudale, socle) tombent
// ailleurs d'une assise à l'autre et les plaques s'agrafent.
function mirrored(layer, flip) {
  if (!flip) return layer;
  const m = new Map();
  for (const [k, v] of layer) { const [x, z] = k.split('|').map(Number); m.set(`${TOTAL_LEN - 1 - x}|${-1 - z}`, v); }
  return m;
}

function partKeyFor(dz, dx, kind) {
  const a = Math.min(dz, dx), b = Math.max(dz, dx);
  return `${kind}-${a}x${b}`;
}

// `phase` alterne d'une assise à l'autre (une assise = trois plaques).
// Sur les assises de phase 1, la première pièce de chaque file est
// plafonnée à quatre tenons : les joints tombent à contretemps et les
// assises se verrouillent. Sans ce décalage, toutes les couches
// seraient pavées à l'identique et le modèle se réduirait à des piles
// de briques indépendantes.
// La poutre de châssis se pave d'un seul tenant avec la peau des flancs :
// ses plaques traversent la coque de bord à bord, c'est ce qui la
// contrevente. Elle prend donc la couleur de la livrée.
const FAMILY = { avant: 'coque', arriere: 'coque', chassis: 'coque' };
const fam = (g) => FAMILY[g] || g;
function packLayer(layer0, phase, y) {
  const flip = phase === 1;
  const layer = mirrored(layer0, flip);
  const used = new Set();
  const rects = [];
  // ordre de balayage : par rangées en z sur une assise, par colonnes en
  // x sur l'autre, pour que la première pièce de chaque file change
  const cellsInOrder = [];
  if (phase === 0) { for (let z = Z_MIN; z < Z_MAX; z++) for (let x = 0; x < TOTAL_LEN; x++) cellsInOrder.push([x, z]); }
  else { for (let x = 0; x < TOTAL_LEN; x++) for (let z = Z_MIN; z < Z_MAX; z++) cellsInOrder.push([x, z]); }
  for (const [x, z] of cellsInOrder) {
    {
      const k = `${x}|${z}`;
      if (used.has(k) || !layer.has(k)) continue;
      const cell = layer.get(k);
      const left = layer.get(`${x - 1}|${z}`);
      const runStart = !left || left.color !== cell.color || fam(left.group) !== fam(cell.group);
      const blade = cell.group === 'caudale' && Math.abs(z + 0.5) > 1.5;
      const order = blade ? (y % 2 ? RECTS_COLS : RECTS_ROWS)
        : phase === 1 && runStart ? RECTS_SHORT : RECTS;
      let placed = null;
      for (const [dz, dx] of order) {
        let ok = true;
        for (let j = 0; j < dz && ok; j++) {
          for (let i = 0; i < dx; i++) {
            const kk = `${x + i}|${z + j}`;
            const c = layer.get(kk);
            if (!c || used.has(kk) || c.color !== cell.color || fam(c.group) !== fam(cell.group)) { ok = false; break; }
          }
        }
        if (ok) { placed = [dz, dx]; break; }
      }
      const [dz, dx] = placed;
      for (let j = 0; j < dz; j++) for (let i = 0; i < dx; i++) used.add(`${x + i}|${z + j}`);
      rects.push(flip
        ? { x: TOTAL_LEN - x - dx, z: -z - dz, dx, dz, color: cell.color, group: cell.group }
        : { x, z, dx, dz, color: cell.color, group: cell.group });
    }
  }
  return rects;
}

// 6. Trois plaques identiques empilées -> une brique.
function mergeVertical(byLayer) {
  const index = new Map();
  for (const [y, rects] of byLayer) {
    for (const r of rects) {
      const sig = `${r.x}|${r.z}|${r.dx}|${r.dz}|${r.color}|${r.group}`;
      if (!index.has(sig)) index.set(sig, []);
      index.get(sig).push(y);
    }
  }
  const pieces = [];
  for (const [sig, ys] of index) {
    ys.sort((a, b) => a - b);
    const [x, z, dx, dz, color, group] = sig.split('|');
    const base = { x: +x, z: +z, dx: +dx, dz: +dz, color, group };
    let i = 0;
    while (i < ys.length) {
      const y = ys[i];
      if (i + 2 < ys.length && ys[i + 1] === y + 1 && ys[i + 2] === y + 2) {
        pieces.push({ ...base, y, h: 3, part: partKeyFor(+dz, +dx, 'brick') });
        i += 3;
      } else {
        pieces.push({ ...base, y, h: 1, part: partKeyFor(+dz, +dx, 'plate') });
        i += 1;
      }
    }
  }
  return pieces;
}

// ================================================================
// SOUS-ENSEMBLES POSÉS À LA MAIN
// ================================================================

// L'hélice est à l'extrême arrière, au bout de l'arbre : quatre pales en
// croix et un moyeu, en or perlé, agrafés sur la poutre.
function propeller() {
  const out = [];
  const a = Math.floor(axisY(HULL_LEN));
  const P = (x, y, z, dx, dz, h, color, part) =>
    out.push({ x, y, z, dx, dz, h, color, group: 'helice', part });
  const hx = SHAFT.hub;
  P(hx, a + 1, -3, 1, 6, 1, 'gold', 'plate-1x6');
  P(hx, a - 2, -3, 1, 6, 1, 'gold', 'plate-1x6');
  P(hx, a + 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(hx, a + 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(hx, a - 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(hx, a - 4, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(hx + 1, a + 1, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(hx + 1, a - 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  return out;
}

// Le socle de la maquette : une plaque noire de 54 × 22 tenons, et deux
// tiges qui portent le sous-marin quinze centimètres au-dessus.
// Les tiges sont des colonnes de briques 2 × 2 ; c'est le point le plus
// fragile du modèle en briques, et la page le dit.
function stand(cells) {
  const out = [];
  const P = (x, y, z, dx, dz, h, part) =>
    out.push({ x, y, z, dx, dz, h, color: 'black', group: 'socle', part });
  // Plaque de base en deux couches croisées. Les joints du dessus sont
  // décalés d'un tenon en x et en z par rapport à ceux du dessous : sans
  // ce décalage, les deux couches se découpent en carreaux de 8 × 8 qui
  // ne se tiennent pas entre eux.
  const S = (y, x, z, dx, dz) => P(x, y, z, dx, dz, 1, partKeyFor(dz, dx, 'plate'));
  for (let z = -11; z < 11; z += 2) {
    for (let x = 17; x < 71; x += 8) S(0, x, z, Math.min(8, 71 - x), 2);
  }
  const columns = [[17, 1], ...Array.from({ length: 26 }, (_, i) => [18 + 2 * i, 2]), [70, 1]];
  for (const [x, dx] of columns) {
    for (const [z, dz] of [[-11, 1], [-10, 8], [-2, 8], [6, 4], [10, 1]]) S(1, x, z, dx, dz);
  }
  // deux tiges de briques 2 × 2, jusqu'au contact du ventre
  for (const cx of [24, 61]) {   // positions relevées sur la photo
    // la tige monte jusqu'à la première cellule de coque de son emprise
    let topY = NY;
    for (const x of [cx, cx + 1]) for (const z of [-1, 0]) {
      for (let y = 0; y < NY; y++) if (cells.has(key(x, y, z))) { topY = Math.min(topY, y); break; }
    }
    for (let y = 2; y < topY; y += 3) {
      const h = Math.min(3, topY - y);
      P(cx, y, -1, 2, 2, h, h === 3 ? 'brick-2x2' : 'plate-2x2');
    }
  }
  return out;
}

// ================================================================
// ASSEMBLAGE
// ================================================================

// Profils de coque relevés sur un maillage voxelisé : tables par x,
// substituées aux fonctions paramétriques quand un voxels.json est chargé.
let MESH = null;
function useMesh(runs) {
  const top = new Map(), bot = new Map(), wid = new Map();
  for (const [x, y, z0, z1] of runs.coque || []) {
    top.set(x, Math.max(top.get(x) ?? -Infinity, y + 1));
    bot.set(x, Math.min(bot.get(x) ?? Infinity, y));
    wid.set(x, Math.max(wid.get(x) ?? 0, Math.max(Math.abs(z0 + 0.5), Math.abs(z1 + 0.5))));
  }
  const smooth = (m) => (x) => {
    const xs = [x, x - 1, x + 1, x - 2, x + 2].filter((i) => m.has(i));
    return xs.length ? m.get(xs[0]) : undefined;
  };
  MESH = { top: smooth(top), bot: smooth(bot), wid: smooth(wid), len: Math.max(...top.keys()) + 1 };
}

// Groupes que le modèle photo sait fournir quand un maillage ne les a pas
const PARAM_GROUPS = ['verriere', 'dorsale', 'dorsale2', 'caudale', 'pectoraleG', 'pectoraleD', 'pelvienneG', 'pelvienneD'];

export function buildModel(voxels = null) {
  let solid;
  let addPropeller = !voxels;
  SHAFT.hub = 93; SHAFT.x1 = 95;
  if (voxels) {
    // Le maillage part de y = 0 : on le surélève pour que l'axe de sa coque
    // tombe à la hauteur de celui du modèle photo (ou d'un lift imposé).
    let lift = voxels.lift;
    if (lift === undefined) {
      const probe = {};
      for (const [g, runs] of Object.entries(voxels.runs)) probe[g] = runs;
      useMesh(probe);
      const xs = [40, 36, 44, 48, 32].filter((x) => MESH.top(x) !== undefined);
      const x = xs[0];
      lift = x === undefined ? 22 : Math.round(AXIS_Y - (MESH.top(x) + MESH.bot(x)) / 2);
      lift = Math.max(22, lift);
    }
    const lifted = {};
    for (const [g, runs] of Object.entries(voxels.runs)) lifted[g] = runs.map(([x, y, z0, z1]) => [x, y + lift, z0, z1]);
    useMesh(lifted);
    solid = new Map();
    for (const [g, runs] of Object.entries(lifted)) {
      for (const [x, y, z0, z1] of runs) for (let z = z0; z <= z1; z++) if (y < NY && z >= Z_MIN && z < Z_MAX) solid.set(key(x, y, z), g);
    }
    // Mode hybride : ce que le maillage n'apporte pas (nageoires, caudale,
    // bulle, hélice) vient du modèle photo, accroché à la coque importée.
    if (voxels.complete !== false) {
      const missing = new Set(PARAM_GROUPS.filter((g) => !(voxels.runs[g] && voxels.runs[g].length)));
      if (missing.has('caudale')) {
        MESH.shaft = true;
        // l'hélice se pose derrière la fin de la coque importée, si la place reste
        const hullEnd = Math.max(-1, ...(lifted.coque || []).map((r) => r[0]));
        SHAFT.hub = Math.max(93, hullEnd + 1); SHAFT.x1 = SHAFT.hub + 2;
        addPropeller = !(voxels.runs.helice && voxels.runs.helice.length) && SHAFT.hub <= TOTAL_LEN - 2;
      }
      if (missing.size) {
        for (let x = 0; x < TOTAL_LEN; x++) for (let y = 0; y < NY; y++) for (let z = Z_MIN; z < Z_MAX; z++) {
          const k = key(x, y, z);
          if (solid.has(k)) continue;
          const g = solidAt(x + 0.5, y + 0.5, z + 0.5);
          if (g && missing.has(g)) solid.set(k, g);
        }
      }
      voxels.completed = [...missing];
    }
  } else {
    MESH = null;
    solid = voxelize();
  }
  const cells = shell(solid);
  if (voxels) for (const [k, g] of cells) if (g === 'coque') cells.set(k, Number(k.split('|')[0]) < 38 ? 'avant' : 'arriere');
  addChassis(cells);

  const byLayer = new Map();
  for (const [k, group] of cells) {
    const [x, y, z] = k.split('|').map(Number);
    const color = colorAt(x, y, z, group);
    if (!byLayer.has(y)) byLayer.set(y, new Map());
    byLayer.get(y).set(`${x}|${z}`, { color, group });
  }

  const packed = new Map();
  for (const [y, layer] of byLayer) packed.set(y, packLayer(layer, Math.floor(y / 3) % 2, y));

  let pieces = mergeVertical(packed);
  // le maillage apporte sa propre hélice ; le socle, lui, est toujours posé ici
  pieces = pieces.concat(addPropeller ? propeller() : [], stand(cells));

  pieces.sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z);
  pieces.forEach((p, i) => { p.id = i; });
  markVisibleStuds(pieces);

  const steps = buildSteps(pieces);   // affecte aussi p.stage et p.unit
  return { pieces, steps, stats: statsFor(pieces), bbox: bboxFor(pieces), check: analyze(pieces) };
}

// ================================================================
// ÉTAPES DE MONTAGE
// ================================================================

// Sous-ensembles pendants : montés à plat, pressés par en dessous.
const HANGING = {
  pectoraleG: 'Pectorale bâbord', pectoraleD: 'Pectorale tribord',
  pelvienneG: 'Pelvienne bâbord', pelvienneD: 'Pelvienne tribord',
  caudaleBas: 'Lobe inférieur de la caudale',
};
export const HANGING_LABELS = HANGING;

function unitOf(p) {
  if (HANGING[p.group]) return p.group;
  if (p.group === 'caudale' && p.y + p.h - 1 < Math.floor(axisY(HULL_LEN)) - 1) return 'caudaleBas';
  if (p.group === 'socle') return 'socle';
  return 'main';
}

// Bande de hauteur -> chapitre, pour la séquence principale
function bandOf(y) {
  if (y < AXIS_Y - 6) return 2;                    // ventre
  if (y < AXIS_Y + 10) return 3;                   // flancs
  if (y <= Math.ceil(hullTop(33)) + 1) return 4;        // dos
  return 5;                                        // superstructures
}

export function buildSteps(pieces) {
  for (const p of pieces) p.unit = unitOf(p);
  const byId = pieces;
  const steps = [];
  let allocated = 0;
  const gatherOf = (list) => {
    const g = new Map();
    for (const p of list) { const k = `${p.part}|${p.color}`; g.set(k, (g.get(k) || 0) + 1); }
    return [...g.entries()].map(([k, qty]) => { const [part, color] = k.split('|'); return { part, color, qty }; })
      .sort((a, b) => b.qty - a.qty);
  };
  // Découpe une liste en couches, en regroupant jusqu'à trois couches
  // consécutives quand l'étape reste sous dix pièces (lames minces).
  const layersOf = (list, mergeSmall) => {
    const ys = [...new Set(list.map((p) => p.y))].sort((a, b) => a - b);
    const groups = [];
    for (const y of ys) {
      const n = list.filter((p) => p.y === y).length;
      const last = groups[groups.length - 1];
      if (mergeSmall && last && last.ys.length < 3 && last.n + n <= 10 && y === last.ys[last.ys.length - 1] + 1) {
        last.ys.push(y); last.n += n;
      } else groups.push({ ys: [y], n });
    }
    return groups.map((g) => ({ ys: g.ys, pieces: list.filter((p) => g.ys.includes(p.y)) }));
  };
  const push = (o) => {
    allocated += o.counts === false ? 0 : o.pieces.length;
    steps.push({ id: steps.length + 1, allocated, gather: gatherOf(o.pieces.map((id) => byId[id])), ...o });
  };

  // --- 1. sous-ensembles pendants, à plat ---------------------------
  const attachAt = {};   // unité -> couche principale après laquelle on la fixe
  for (const unit of Object.keys(HANGING)) {
    const own = pieces.filter((p) => p.unit === unit);
    if (!own.length) continue;
    // couche de la coque qui reçoit la couche haute du sous-ensemble :
    // la plus basse des pièces qui coiffent l'un de ses tenons
    let L = Infinity;
    for (const p of own) for (const [, , cover] of p.studs) {
      if (cover >= 0 && byId[cover].unit !== unit) L = Math.min(L, byId[cover].y);
    }
    attachAt[unit] = L === Infinity ? Math.max(...own.map((p) => p.y + p.h)) : L;
    const layers = layersOf(own, true);
    layers.forEach((l, li) => {
      for (const p of l.pieces) p.stage = 1;
      push({
        stage: 1, context: 'sub', unit, unitLabel: HANGING[unit],
        layer: li + 1, layers: layers.length, y: l.ys[0], yTop: l.ys[l.ys.length - 1],
        title: `${HANGING[unit]} · ${l.ys.length > 1 ? 'assise' : 'couche'} ${li + 1}`,
        pieces: l.pieces.map((p) => p.id), first: li === 0, last: li === layers.length - 1,
      });
    });
  }

  // --- 2 à 5. séquence principale, du bas vers le haut ---------------
  const main = pieces.filter((p) => p.unit === 'main');
  const layers = layersOf(main, false);
  // regroupement doux des couches hautes et minces (lobe, dorsale, arceaux)
  const merged = [];
  for (const l of layers) {
    const last = merged[merged.length - 1];
    if (last && last.ys.length < 3 && last.pieces.length + l.pieces.length <= 10
        && l.ys[0] === last.ys[last.ys.length - 1] + 1 && bandOf(l.ys[0]) === bandOf(last.ys[0])) {
      last.ys.push(...l.ys); last.pieces.push(...l.pieces);
    } else merged.push({ ys: [...l.ys], pieces: [...l.pieces] });
  }
  const pending = Object.entries(attachAt).sort((a, b) => a[1] - b[1]);
  const counters = {};
  for (const l of merged) {
    const stage = bandOf(l.ys[0]);
    counters[stage] = (counters[stage] || 0) + 1;
    const st = STAGES.find((x) => x.id === stage);
    for (const p of l.pieces) p.stage = stage;
    const groupsHere = [...new Set(l.pieces.map((p) => GROUPS[p.group].label))];
    push({
      stage, context: 'main', unit: 'main', unitLabel: st.label,
      layer: counters[stage], y: l.ys[0], yTop: l.ys[l.ys.length - 1],
      title: `${st.label} · ${l.ys.length > 1 ? 'assise' : 'couche'} ${counters[stage]}`,
      pieces: l.pieces.map((p) => p.id), groupsHere,
      first: counters[stage] === 1, last: false,
    });
    // les sous-ensembles dont la couche d'accueil vient d'être posée
    while (pending.length && pending[0][1] <= l.ys[l.ys.length - 1]) {
      const [unit] = pending.shift();
      push({
        stage, context: 'attach', unit, unitLabel: HANGING[unit], counts: false,
        y: l.ys[l.ys.length - 1], yTop: l.ys[l.ys.length - 1],
        title: `Fixer : ${HANGING[unit].toLowerCase()}`,
        pieces: pieces.filter((p) => p.unit === unit).map((p) => p.id),
      });
    }
  }

  // --- 6. socle, puis pose du modèle --------------------------------
  const socle = pieces.filter((p) => p.unit === 'socle');
  const sl = layersOf(socle, true);
  sl.forEach((l, li) => {
    for (const p of l.pieces) p.stage = 6;
    push({
      stage: 6, context: 'sub', unit: 'socle', unitLabel: 'Socle',
      layer: li + 1, layers: sl.length, y: l.ys[0], yTop: l.ys[l.ys.length - 1],
      title: `Socle · ${l.ys.length > 1 ? 'assise' : 'couche'} ${li + 1}`,
      pieces: l.pieces.map((p) => p.id), first: li === 0, last: li === sl.length - 1,
    });
  });
  push({
    stage: 6, context: 'final', unit: 'socle', unitLabel: 'Socle', counts: false,
    y: 0, yTop: 0, title: 'Poser le sous-marin sur ses tiges',
    pieces: pieces.filter((p) => p.unit !== 'socle').map((p) => p.id),
  });
  return steps;
}

// Pour chaque tenon, on note la pièce qui le coiffe (-1 si aucune). Le
// visualiseur le dessine quand cette pièce n'est pas affichée : dans le
// modèle complet, seuls les tenons libres apparaissent ; en montage, la
// dernière couche posée montre les siens.
function markVisibleStuds(pieces) {
  const occ = new Map();
  for (const p of pieces) {
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        for (let k = 0; k < p.h; k++) occ.set(`${p.x + a}|${p.y + k}|${p.z + c}`, p.id);
      }
    }
  }
  for (const p of pieces) {
    const top = p.y + p.h;
    p.studs = [];
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        const cover = occ.get(`${p.x + a}|${top}|${p.z + c}`);
        p.studs.push([a, c, cover === undefined ? -1 : cover]);
      }
    }
  }
}

// Contrôle de structure : chevauchements et liaisons par tenons.
export function analyze(pieces) {
  const occ = new Map();
  let overlaps = 0;
  for (const p of pieces) {
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        for (let k = 0; k < p.h; k++) {
          const kk = `${p.x + a}|${p.y + k}|${p.z + c}`;
          if (occ.has(kk)) overlaps++; else occ.set(kk, p.id);
        }
      }
    }
  }
  const parent = new Map(pieces.map((p) => [p.id, p.id]));
  const find = (a) => { while (parent.get(a) !== a) { parent.set(a, parent.get(parent.get(a))); a = parent.get(a); } return a; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(a, b); };
  for (const p of pieces) {
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        for (const q of [occ.get(`${p.x + a}|${p.y + p.h}|${p.z + c}`), occ.get(`${p.x + a}|${p.y - 1}|${p.z + c}`)]) {
          if (q !== undefined && q !== p.id) union(p.id, q);
        }
      }
    }
  }
  const size = new Map();
  for (const p of pieces) { const r = find(p.id); size.set(r, (size.get(r) || 0) + 1); }
  const sizes = [...size.values()].sort((a, b) => b - a);
  return { overlaps, components: sizes.length, largest: sizes[0] || 0, detached: pieces.length - (sizes[0] || 0) };
}

export function bboxFor(pieces) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of pieces) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x + p.dx);
    y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y + p.h);
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z + p.dz);
  }
  return {
    studs: { x: x1 - x0, y: y1 - y0, z: z1 - z0 },
    mm: { x: (x1 - x0) * STUD_MM, y: (y1 - y0) * PLATE_MM, z: (z1 - z0) * STUD_MM },
    min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 },
  };
}

export function statsFor(pieces) {
  const rows = new Map();
  for (const p of pieces) {
    const k = `${p.part}|${p.color}`;
    if (!rows.has(k)) rows.set(k, { key: k, part: p.part, color: p.color, qty: 0 });
    rows.get(k).qty++;
  }
  const list = [...rows.values()].map((r) => {
    const def = PARTS[r.part];
    return { ...r, ...def, price: unitPrice(r.part), total: unitPrice(r.part) * r.qty };
  });
  list.sort((a, b) => b.qty - a.qty);
  const byStage = new Map();
  for (const p of pieces) byStage.set(p.stage, (byStage.get(p.stage) || 0) + 1);
  return {
    rows: list,
    count: pieces.length,
    types: list.length,
    cost: list.reduce((s, r) => s + r.total, 0),
    byStage: [...byStage.entries()].sort((a, b) => a[0] - b[0]),
  };
}

// Estimation paramétrique (et non un tarif officiel) : un plancher par
// pièce, plus un coût proportionnel à la surface en tenons.
export function unitPrice(partKey) {
  const d = PARTS[partKey];
  if (!d) return 0;
  const base = 0.045 + 0.021 * d.dz * d.dx;
  return Math.round(base * (d.kind === 'brick' ? 1.25 : 1) * 100) / 100;
}
