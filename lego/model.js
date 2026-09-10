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
  tan:   { key: 'tan',   name: 'Beige',                ldraw: 19,  bl: 2,   hex: '#dcc79c' },
  lgrey: { key: 'lgrey', name: 'Gris pierre clair',    ldraw: 71,  bl: 86,  hex: '#9aa1a6' },
  dgrey: { key: 'dgrey', name: 'Gris pierre foncé',    ldraw: 72,  bl: 85,  hex: '#5b6167' },
  gold:  { key: 'gold',  name: 'Or perlé',             ldraw: 297, bl: 115, hex: '#c9a13b' },
  trans: { key: 'trans', name: 'Transparent',          ldraw: 47,  bl: 12,  hex: '#d3e3ea', alpha: 0.4 },
  blue:  { key: 'blue', name: 'Bleu', ldraw: 1, bl: 7, hex: '#287fba' },
  orange: { key: 'orange', name: 'Orange', ldraw: 25, bl: 4, hex: '#ed9a21' },
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
  { id: 1, key: 'sous-ensembles', label: 'Sous-ensembles',  blurb: 'Les nageoires pendantes, montées à plat de la pointe vers l’attache : deux pectorales, une nageoire ventrale centrale et le lobe inférieur de la caudale. Elles seront pressées sous la coque au fil du montage.' },
  { id: 2, key: 'ventre',         label: 'Ventre',          blurb: 'Les premières couches de la coque, depuis la quille, sur une planche plane. La peau suit la section du corps et s’élargit à chaque couche.' },
  { id: 3, key: 'flancs',         label: 'Flancs',          blurb: 'Les couches à hauteur d’axe : la poutre longitudinale s’intègre, les nageoires pendantes se fixent, la racine de la caudale se pose sur son lobe inférieur.' },
  { id: 4, key: 'dos',            label: 'Dos',             blurb: 'La coque se referme. La base de la verrière, la dorsale et la seconde dorsale démarrent sur les dernières couches de peau.' },
  { id: 5, key: 'superstructures', label: 'Verrière, dorsale, caudale', blurb: 'Tout ce qui dépasse du dos : la voûte et ses arceaux, la dorsale en faucille, le lobe supérieur de la caudale, l’arbre et l’hélice.' },
  { id: 6, key: 'socle',          label: 'Socle',           blurb: 'La plaque noire en deux couches croisées, les pieds évasés, les piliers et leurs berceaux, puis la pose du sous-marin.' },
];

// --- Sous-ensembles (pour l'éclaté) ------------------------------
export const GROUPS = {
  chassis:    { label: 'Poutre longitudinale', stage: 1, dir: [0, -1, 0] },
  avant:      { label: 'Coque avant',          stage: 1, dir: [-1, 0.2, 0] },
  arriere:    { label: 'Coque arrière',        stage: 1, dir: [1, 0.2, 0] },
  verriere:   { label: 'Verrière',             stage: 2, dir: [0, 1, 0] },
  equipage:   { label: 'Tintin et Milou',      stage: 2, dir: [0, 1, 0] },
  pectoraleD: { label: 'Pectorale tribord',    stage: 3, dir: [0, -0.2, 1] },
  pectoraleG: { label: 'Pectorale bâbord',     stage: 3, dir: [0, -0.2, -1] },
  pelvienneD: { label: 'Pelvienne tribord',    stage: 3, dir: [0, -0.6, 1] },
  pelvienneG: { label: 'Pelvienne bâbord',     stage: 3, dir: [0, -0.6, -1] },
  ventrale:  { label: 'Nageoire ventrale centrale', stage: 3, dir: [0, -1, 0] },
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
const cabinColors = new Map();
function canopy(x, y, z) {
  if (x < CANOPY.x0 || x > CANOPY.x1) return false;
  // vue de dessus (plus proche de l'objectif, donc plus longue) recalée
  // sur l'emprise mesurée de profil
  const keys = Object.keys(PR.canopyHalfZ).map(Number);
  const u = Math.min(...keys) + (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0) * (Math.max(...keys) - Math.min(...keys));
  const t = clamp((x - CANOPY.x0) / CANOPY.ramp, 0, 1);
  const rear = clamp((CANOPY.x1 - x) / 5, 0, 1);
  // Le relevé de dessus incluait la largeur projetée de la bulle :
  // utilisé tel quel sur une section elliptique, il descendait jusqu'au
  // milieu du flanc. Limiter l'emprise au sommet arrondi du dos maintient
  // le raccord à environ trois plaques sous la crête, sans podium noir.
  const hz = T.canopyHalfZ(u) * 0.72 * Math.sqrt(1 - (1 - t) * (1 - t)) * Math.sqrt(1 - (1 - rear) ** 2);
  if (!hz || hz < 0.5 || Math.abs(z) > hz) return false;
  const ease = (1 - Math.cos(Math.PI * t)) / 2;
  const roof = hullTop(x) + (canopySide(Math.max(x, CANOPY.x0 + CANOPY.ramp)) - hullTop(x)) * ease;
  const top = hullTop(x) + (roof - hullTop(x)) * Math.sqrt(Math.max(0, 1 - Math.pow(z / hz, 2)));
  // L'assise longitudinale ne descend pas sous y=84 : les variations
  // sub-plaque du profil créaient sinon des languettes grises isolées.
  if (y > top || y < 84 || y <= hullSurfaceTop(x, z) - 1.5) return null;
  // Le vitrage rejoint directement la coque arrondie. Le remplissage
  // « pont » jusqu'au sommet du dos créait une haute paroi noire verticale.
  return 'verriere';
}

// --- Dorsales : contour de profil, lame de deux tenons ------------------
function dorsalAt(x, y) {
  // Bord de fuite concave estimé sur ref/profil.png : contrairement au
  // seul contour supérieur extrait, la nageoire n'est pas un triangle plein.
  if (inRange(PR.dorsal, x) && y > hullTop(x) - 1 && y <= T.dorsal(x) && x <= dorsalTrailing(y)) return 'dorsale';
  if (inRange(PR.dorsal2, x) && y > hullTop(x) - 1 && y <= T.dorsal2(x)) return 'dorsale2';
  return null;
}
const dorsalTrailing = table({ 86: 53, 90: 54, 92: 55.5, 94: 54,
  97: 52.8, 100: 52.9, 103: 53.6, 106: 54.7, 110: 56, 115: 57 });

// --- Caudale en croix : deux croissants identiques, l'un vertical (vu de
// profil), l'autre horizontal (vu de dessus). L'arbre de l'hélice est le
// prolongement de la poutre de châssis, posé par addChassis.
const SHAFT = { x0: HULL_LEN, x1: 95, hub: 93 };
const PHOTO_TAIL_AXIS = (T.top(HULL_LEN) + T.bot(HULL_LEN)) / 2;
function caudal(x, y, z) {
  const xi = Math.floor(x);
  const a = axisY(HULL_LEN);
  // les intervalles sont relevés sur la photo : sur une coque importée, on
  // les recale sur l'axe de son pédoncule
  if (MESH) y -= Math.round(a - PHOTO_TAIL_AXIS);
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
  pectoral: { side: PR.pectoral, yRoot: 47.5, depth: 25, zRoot: 5.3, zTip: 12.4 },
  pelvic:   { side: PR.pelvic,   yRoot: 55.5, depth: 7.5, zRoot: 4.3, zTip: 6.8 },
};
// Reconstruction continue des deux bords de la pectorale, sur le profil
// officiel. Les anciennes colonnes contaminées par la tige du socle
// dessinaient plusieurs pointes au lieu d'une seule aile courbe.
const pectoralFront = table({ 21: 33, 24: 30.5, 28: 28, 34: 26,
  40: 24.5, 47: 23, 58: 23 });
const pectoralBack = table({ 21: 34, 24: 34, 28: 33.5, 34: 32.5,
  40: 31.5, 47: 30, 58: 30 });
function hangingFin(x, y, z, fin) {
  const pectoral = fin === FINS.pectoral;
  if (pectoral) {
    const front = pectoralFront(y), back = pectoralBack(y);
    const inset = (back - front) * 0.08;
    if (y < 21.5 || x < front + inset || x > back - inset) return false;
  }
  const v = pectoral ? [fin.yRoot, 21.5] : fin.side[Math.floor(x)];
  if (!v) return false;
  const [yHi, yLo] = v[0] > v[1] ? v : [v[1], v[0]];
  if (y < yLo - 0.5) return false;
  const az = Math.abs(z);
  const t = clamp((fin.yRoot - y) / fin.depth, 0, 1);
  // sur une coque importée plus étroite, la racine se rapproche de l'axe
  const zRoot = Math.min(fin.zRoot, halfWidth(x) - 1);
  const zc = zRoot + (Math.max(fin.zTip, zRoot + 3) - zRoot) * t;
  // Racine épaisse, extrémité affinée ; la largeur diminue graduellement
  // pour conserver le recouvrement entre les assises de plaques.
  const thickness = pectoral ? 0.7 + 0.3 * Math.pow(1 - t, 1.4) : 1;
  if (Math.abs(az - zc) > thickness) return false;
  // sous la coque : jusqu'à la peau, à cet écartement
  const W = halfWidth(x);
  const zz = Math.min(az, Math.max(0, W - 0.8));
  const k = Math.max(0, 1 - Math.pow(zz / W, CROSS_N));
  const surf = axisY(x) - halfBottom(x) * Math.pow(k, 1 / CROSS_N);
  const yMax = pectoral || yHi >= hullBottom(x) - 1.5 ? surf : yHi;   // racine sur le ventre : jusqu'à la peau
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
  // Une seule nageoire médiane, sous la petite dorsale, et non une paire
  // de pelviennes latérales. Profil inférieur relevé sur la vue officielle.
  const ventral = PR.pelvic[Math.floor(x)];
  if (ventral && Math.abs(z) < 1 && y >= Math.min(...ventral) - 0.5
      && y <= hullBottom(x) + 0.5) {
    const trailing = table({ 48: 75, 50: 74.5, 52: 73.8, 54: 77, 57: 75 });
    if (x <= trailing(y)) return 'ventrale';
  }
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
const HOLLOW = new Set(['avant', 'arriere', 'coque', 'verriere']);
function shell(solid) {
  const skin = new Map();
  const exposedCells = [];
  for (const [k, g] of solid) {
    if (!HOLLOW.has(g)) { skin.set(k, g); continue; }
    const [x, y, z] = k.split('|').map(Number);
    // Les trois arceaux restent contreventés à l'intérieur de la bulle :
    // leurs petites pièces grises doivent s'agrafer aux assises voisines.
    if (g === 'verriere' && CANOPY.ribs.some(r => Math.abs(x + 0.5 - r) < 1.6)) {
      skin.set(k, g); exposedCells.push([x, y, z]); continue;
    }
    if (!MESH && g !== 'verriere' && halfWidth(x + 0.5) < 4.5) { skin.set(k, g); exposedCells.push([x, y, z]); continue; }
    // exposée au vide, ou en contact avec une nageoire, la bulle, une
    // dorsale : ce qui s'agrafe à la coque a besoin de sa peau
    const open = (kk) => { const gg = solid.get(kk); return gg === undefined || !HOLLOW.has(gg) || (g === 'verriere') !== (gg === 'verriere'); };
    const exposed =
      open(key(x + 1, y, z)) || open(key(x - 1, y, z)) ||
      open(key(x, y + 1, z)) || open(key(x, y - 1, z)) ||
      open(key(x, y, z + 1)) || open(key(x, y, z - 1));
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
  if (!MESH) {
    // Le carénage prolonge le ventre SOUS la lame horizontale noire.
    // Profil de référence : axe du moyeu vers y=64, lame vers y=69.
    // Une section pleine, effilée, relie la coque au moyeu sans tige noire nue.
    for (let x = 80; x < 95; x++) {
      const t = clamp((x - 80) / 14, 0, 1);
      const ry = 5 - t, rz = 2.8 - 1.6 * t;
      for (let y = a - 11; y < a; y++) for (let z = -3; z < 3; z++) {
        if (((y + 0.5 - (a - 5)) / ry) ** 2 + ((z + 0.5) / rz) ** 2 <= 1) {
          cells.set(key(x, y, z), 'arriere');
        }
      }
    }
    // Traverses internes de l'empennage : elles s'arrêtent avant l'hélice.
    for (let x = 83; x < 90; x++) for (let y = a - 1; y <= a; y++) {
      for (let z = -2; z < 2; z++) cells.set(key(x, y, z), 'chassis');
    }
    return;
  }
  for (let x = SHAFT.x0; x < SHAFT.x1; x++) {
    for (const [y, wide] of [[a - 1, 90], [a, 88]]) {
      const four = x < wide && (!MESH || halfWidth(x + 0.5) >= 2);   // à la largeur du pédoncule importé
      for (const z of (four ? [-2, -1, 0, 1] : [-1, 0])) cells.set(key(x, y, z), 'chassis');
    }
  }
}

// ================================================================
// 4. LIVRÉE — la frontière noir / blanc relevée au pixel sur le profil
// ================================================================
export function liveryY(x) { return T.livery(Math.min(x, HULL_LEN)); }

// Bouche, par tenon : plages de plaques blanches puis bord noir
const MOUTH = {
  16: { white: [52, 59], black: [60, 60] },
  15: { white: [52, 56], black: [57, 58] },
  14: { white: [52, 53], black: [54, 55] },
  13: { white: [0, -1], black: [52, 53] },
};
function colorAt(x, y, z, group) {
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

  if (group === 'socle') return 'black';
  if (group === 'helice') return 'gold';
  if (group === 'equipage') return cabinColors.get(key(x, y, z)) || 'white';
  if (!MESH && group === 'arriere' && x >= 80 && cy < Math.floor(axisY(HULL_LEN))) return 'tan';
  if (group === 'verriere') {
    // nervures chromées en surface seulement ; l'intérieur reste en verre
    const rib = CANOPY.ribs.some((r) => Math.abs(cx - r) < 0.6);
    const surface = !solidAt(cx, cy + 1, cz) || !solidAt(cx, cy, cz + 1) || !solidAt(cx, cy, cz - 1);
    return (rib && surface) || cy < hullSurfaceTop(cx, cz) + 2 ? 'lgrey' : 'trans';
  }

  // sur la peau du flanc, à la largeur locale de la section (le ventre
  // se resserre sous l'axe)
  const dyF = cy - axisY(cx);
  const HF = dyF >= 0 ? halfTop(cx) : halfBottom(cx);
  const localW = halfWidth(cx) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(dyF) / Math.max(HF, 0.1), CROSS_N)), 1 / CROSS_N);
  const onFlank = Math.abs(cz) > localW - 1.5;

  // Œil : anneau blanc à centre noir, à sa place sur la photo
  const dEye = Math.hypot(cx - PR.eye.x, (cy - PR.eye.y) * 0.4);
  if (onFlank && dEye < PR.eye.r + 0.6) return dEye < 0.55 ? 'black' : 'white';

  // Ouïes : quatre fentes noires. Sur la photo elles sont à un tenon
  // d'écart et se toucheraient en briques : on les espace de deux.
  if (onFlank && cy > PR.gills.y[0] && cy < PR.gills.y[1]) {
    const first = Math.round(Math.max(...PR.gills.x));
    for (const gx of [first, first - 2, first - 4, first - 6]) if (Math.floor(cx) === gx) return 'black';
  }

  // La bouche enveloppe aussi le dessous du museau : le trait transversal
  // rejoint les deux pointes du sourire, sans interrompre le blanc au ventre.
  if (fam(group) === 'coque') {
    if (x === 13 && cy < 54) return 'black';
    const col = MOUTH[Math.floor(cx)];
    if (col) {
      if (x >= 14 && cy < col.white[1] + 1) return 'white';
      if (onFlank) {
        if (cy > col.white[0] && cy < col.white[1] + 1) return 'white';
        if (cy > col.black[0] && cy < col.black[1] + 1) return 'black';
      }
    }
  }

  // Nageoires : entièrement noires, comme sur la maquette
  if (fam(group) !== 'coque') return 'black';

  // le ventre crème de la maquette : beige, la couleur LEGO la plus proche
  return cy >= liveryY(cx) ? 'black' : 'tan';
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

// Fusion de volumes complets : aucune pièce existante n'est découpée.
// Une fusion conserve exactement les cellules, la couleur et les faces
// externes où s'accrochent les voisins ; seuls les joints internes disparaissent.
function consolidateHull(pieces) {
  // Refaire une assise à la fois, en conservant les pièces qui traversent
  // sa frontière. N'accepter la substitution que si elle réduit le nombre
  // de pièces sans augmenter les composantes de l'assemblage.
  for(const offset of [0,1,2]) for(let y=45+offset;y<90;y+=3) {
    const selected=pieces.filter(p=>fam(p.group)==='coque'&&p.y>=y&&p.y+p.h<=y+3);
    const layers=[new Map(),new Map(),new Map()];
    for(const p of selected) for(let yy=p.y;yy<p.y+p.h;yy++) for(let x=p.x;x<p.x+p.dx;x++) for(let z=p.z;z<p.z+p.dz;z++) layers[yy-y].set(`${x}|${z}`,{color:p.color,group:p.group});
    const common=new Map([...layers[0]].filter(([k,c])=>layers[1].get(k)?.color===c.color&&layers[2].get(k)?.color===c.color));
    const replacement=packLayer(common,Math.floor(y/3)%2,y).map(r=>({...r,y,h:3,part:partKeyFor(r.dz,r.dx,'brick')}));
    for(const r of replacement) for(const l of layers) for(let x=r.x;x<r.x+r.dx;x++) for(let z=r.z;z<r.z+r.dz;z++) l.delete(`${x}|${z}`);
    for(let i=0;i<3;i++) replacement.push(...packLayer(layers[i],Math.floor(y/3)%2,y+i).map(r=>({...r,y:y+i,h:1,part:partKeyFor(r.dz,r.dx,'plate')})));
    const small = list => list.filter(p=>p.dx*p.dz<=2).length;
    if(replacement.length>=selected.length || small(replacement)>small(selected))continue;
    const set=new Set(selected), candidate=pieces.filter(p=>!set.has(p)).concat(replacement);
    pieces.forEach((p,i)=>p.id=i);
    const before=analyze(pieces).components;
    candidate.forEach((p,i)=>p.id=i);
    if(analyze(candidate).components<=before)pieces=candidate;
  }
  const live = new Set(pieces), occ = new Map();
  const visit = (p, fn) => {
    for(let x=p.x;x<p.x+p.dx;x++) for(let y=p.y;y<p.y+p.h;y++) for(let z=p.z;z<p.z+p.dz;z++) fn(key(x,y,z));
  };
  for (const p of pieces) visit(p, k=>occ.set(k,p));
  const candidates = Object.entries(PARTS).flatMap(([part,d]) => [
    {part,dx:d.dx,dz:d.dz,h:d.h}, ...(d.dx===d.dz ? [] : [{part,dx:d.dz,dz:d.dx,h:d.h}]),
  ]).sort((a,b)=>b.dx*b.dz*b.h-a.dx*a.dz*a.h);
  let changed=true;
  while(changed) {
    changed=false;
    for(const p of [...live]) {
      if(!live.has(p)||fam(p.group)!=='coque') continue;
      for(const d of candidates) {
        if(d.dx*d.dz*d.h<=p.dx*p.dz*p.h) continue;
        const q={...p,...d}, members=new Set(); let valid=true;
        visit(q,k=>{
          if(!valid)return;
          const r=occ.get(k);
          if(!r||fam(r.group)!=='coque'||r.color!==p.color||r.x<q.x||r.y<q.y||r.z<q.z
              ||r.x+r.dx>q.x+q.dx||r.y+r.h>q.y+q.h||r.z+r.dz>q.z+q.dz) valid=false;
          else members.add(r);
        });
        if(!valid||members.size<2) continue;
        for(const r of members) live.delete(r);
        live.add(q); visit(q,k=>occ.set(k,q)); changed=true; break;
      }
    }
  }
  return [...live];
}

// ================================================================
// SOUS-ENSEMBLES POSÉS À LA MAIN
// ================================================================

// L'hélice est à l'extrême arrière : trois pales transversales et un
// moyeu, en or perlé, raccordés au carénage inférieur beige.
function addPropellerCells(cells) {
  const a = Math.floor(axisY(HULL_LEN)) - (MESH ? 0 : 5);
  // Trois pales balayées autour de l'axe X, dans le plan transversal Y/Z.
  // Les distances sont exprimées en tenons (une plaque vaut 0,4 tenon).
  // Leur volume rejoint celui du moyeu avant pavage : pas de pièces
  // ajoutées après coup à travers l'arbre ou les autres pales.
  for (let x = SHAFT.hub; x < TOTAL_LEN; x++) {
    for (let y = a - 10; y <= a + 9; y++) for (let z = -4; z < 4; z++) {
      const dy = (y + 0.5 - a) * 0.4, dz = z + 0.5;
      const r = Math.hypot(dy, dz);
      let filled = r <= (x === TOTAL_LEN - 1 ? 0.85 : 1.25);
      if (x < TOTAL_LEN - 1 && r <= 3.4) {
        const theta = Math.atan2(dz, dy);
        for (let blade = 0; blade < 3; blade++) {
          const angle = blade * Math.PI * 2 / 3 + 0.32 * r;
          const delta = Math.atan2(Math.sin(theta - angle), Math.cos(theta - angle));
          if (Math.cos(delta) > 0 && Math.abs(Math.sin(delta) * r) < 1.2 - 0.1 * r) filled = true;
        }
      }
      if (filled) cells.set(key(x, y, z), 'helice');
    }
  }
  if (!MESH) {
    // Assise beige sous le moyeu : une même rangée traverse la jonction
    // coque/hélice et reçoit les pièces dorées par leurs tenons.
    for (let x = 90; x < 95; x++) for (let z = -1; z < 1; z++) {
      cells.set(key(x, a - 4, z), 'arriere');
    }
  }
}

// Petits personnages construits dans le même catalogue de briques que
// le sous-marin ; intégrés aux couches du guide avant de fermer la bulle.
function addCrew(cells) {
  const box = (x0, x1, y0, y1, z0, z1, color) => {
    for (let x=x0; x<x1; x++) for (let y=y0; y<y1; y++) for (let z=z0; z<z1; z++) {
      const k=key(x,y,z); cells.set(k,'equipage'); cabinColors.set(k,color);
    }
  };
  // Tintin, tourné vers le museau (−X) : pull bleu, visage et houppette.
  box(32,36,87,92,-2,2,'blue');
  box(32,36,92,97,-2,2,'tan');
  box(33,36,97,98,-2,2,'orange');
  box(32,34,98,100,-1,1,'orange');
  box(31,32,93,95,-1,1,'tan');
  box(32,33,95,96,-2,-1,'black');
  box(32,33,95,96,1,2,'black');
  // Milou derrière Tintin : corps, tête blanche, museau et oreilles.
  box(39,43,87,92,-2,2,'white');
  box(39,43,92,96,-2,2,'white');
  box(38,40,93,95,-1,1,'white');
  box(38,39,95,96,-1,1,'black');
  box(41,43,96,98,-2,-1,'white');
  box(41,43,96,98,1,2,'white');
  box(39,40,94,95,-2,-1,'black');
  box(39,40,94,95,1,2,'black');
}

// Proposition de socle LEGO : plaque noire 54×22 et deux piliers évasés.
// Les berceaux répartissent les contacts sous le ventre. Validation
// géométrique uniquement : un montage physique reste nécessaire.
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
  // Proposition de supports : noyau 4×4, pieds évasés 6×14 et
  // berceau 4×8 épousant le dessous du modèle. Pas de résistance garantie.
  const supports = new Map();
  for (const cx of [24, 61]) {
    const bottoms = new Map(); let keel = NY;
    for(let x=cx-2;x<cx+4;x++) for(let z=-7;z<7;z++) {
      let bottom=NY;
      for(let y=2;y<NY;y++) if(cells.has(key(x,y,z))) {bottom=y;break;}
      bottoms.set(`${x}|${z}`,bottom);
      if(x>=cx-1&&x<cx+3&&Math.abs(z+0.5)<2)keel=Math.min(keel,bottom);
    }
    for(let y=2;y<Math.min(NY,keel+10);y++) {
      const foot = y<11;
      const flare = y>=keel-6;
      const halfZ=foot?7-Math.floor((y-2)/3)*2:flare?Math.min(4,2+Math.floor((y-(keel-6))/2)):2;
      const x0=foot?cx-2:cx-1, x1=foot?cx+4:cx+3;
      for(let x=x0;x<x1;x++) for(let z=-halfZ;z<halfZ;z++) {
        if(y>=bottoms.get(`${x}|${z}`))continue;
        if(!supports.has(y))supports.set(y,new Map());
        supports.get(y).set(`${x}|${z}`,{color:'black',group:'socle'});
      }
    }
  }
  const packedSupports=new Map();
  for(const [y,layer] of supports)packedSupports.set(y,packLayer(layer,Math.floor((y-2)/3)%2,y));
  out.push(...mergeVertical(packedSupports));
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
const PARAM_GROUPS = ['verriere', 'dorsale', 'dorsale2', 'caudale', 'pectoraleG', 'pectoraleD', 'ventrale'];

export function buildModel(voxels = null, { optimizeHull = true } = {}) {
  let solid;
  let addPropeller = !voxels;
  SHAFT.x0 = HULL_LEN; SHAFT.hub = 93; SHAFT.x1 = 95;
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
        // l'arbre part de l'intérieur de la coque importée ; l'hélice se
        // pose derrière sa fin, si la place reste
        const hullEnd = Math.max(-1, ...(lifted.coque || []).map((r) => r[0]));
        SHAFT.x0 = Math.max(60, hullEnd - 5);
        SHAFT.hub = Math.max(93, hullEnd + 1); SHAFT.x1 = SHAFT.hub + 2;
        addPropeller = !(voxels.runs.helice && voxels.runs.helice.length) && SHAFT.hub <= TOTAL_LEN - 2;
      }
      if (missing.size) {
        const added = [];
        for (let x = 0; x < TOTAL_LEN; x++) for (let y = 0; y < NY; y++) for (let z = Z_MIN; z < Z_MAX; z++) {
          const k = key(x, y, z);
          if (solid.has(k)) continue;
          const g = solidAt(x + 0.5, y + 0.5, z + 0.5);
          if (g && missing.has(g)) { solid.set(k, g); added.push([x, y, z, g]); }
        }
        // La peau de la coque importée n'est pas exactement la section
        // supposée : les racines des nageoires pendantes montent jusqu'à
        // la première cellule de coque au-dessus d'elles.
        const tops = new Map();
        for (const [x, y, z, g] of added) {
          if (!/^(pectorale|pelvienne|ventrale)/.test(g)) continue;
          const ck = `${x}|${z}`;
          if (!tops.has(ck) || tops.get(ck)[0] < y) tops.set(ck, [y, g]);
        }
        for (const [ck, [y0, g]] of tops) {
          const [x, z] = ck.split('|').map(Number);
          let hit = -1;
          for (let y = y0 + 1; y <= y0 + 15 && y < NY; y++) if (solid.has(key(x, y, z))) { hit = y; break; }
          if (hit > 0) for (let y = y0 + 1; y < hit; y++) solid.set(key(x, y, z), g);
        }
      }
      voxels.completed = [...missing];
    }
  } else {
    MESH = null;
    solid = voxelize();
  }
  const cells = shell(solid);
  cabinColors.clear();
  if (!MESH) addCrew(cells);
  if (voxels) for (const [k, g] of cells) if (g === 'coque') cells.set(k, Number(k.split('|')[0]) < 38 ? 'avant' : 'arriere');
  addChassis(cells);
  if (addPropeller) addPropellerCells(cells);
  // Réserver une vraie plaque 2×4 traversant le joint du moyeu : le
  // pavage glouton peut sinon aligner toutes ses coutures en x=93.
  const hubBridge = !MESH && addPropeller ? {
    x: 91, y: Math.floor(axisY(HULL_LEN)) - 9, z: -1,
    dx: 4, dz: 2, h: 1, color: 'tan', group: 'arriere', part: 'plate-2x4',
  } : null;
  if (hubBridge) for (let x = 91; x < 95; x++) for (let z = -1; z < 1; z++) cells.delete(key(x, hubBridge.y, z));

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
  if (optimizeHull) pieces = consolidateHull(pieces);
  // le maillage apporte sa propre hélice ; le socle, lui, est toujours posé ici
  pieces = pieces.concat(hubBridge ? [hubBridge] : [], stand(cells));

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
  ventrale: 'Nageoire ventrale centrale',
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
    y: 0, yTop: 0, title: 'Poser le sous-marin sur ses berceaux',
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
