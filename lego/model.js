// ================================================================
// BRIQUE STUDIO — MODÈLE 002 · SOUS-MARIN REQUIN
// Générateur paramétrique, d'après la maquette de Tintinimaginatio :
// dos noir, ventre crème séparés par une ligne ondulée, verrière
// transparente sur le dos, hélice dorée à l'extrême arrière.
//
// Chaîne de traitement :
//   1. fonctions de profil  -> solide implicite (coque, nageoires…)
//   2. voxelisation         -> cellules 1 × 1 × 1 plaque
//   3. évidement            -> peau + poutre longitudinale
//   4. livrée               -> noir / crème, gueule, œil, ouïes
//   5. pavage               -> rectangles = plaques réelles
//   6. fusion verticale     -> 3 plaques identiques = 1 brique
//
// Aucune dépendance : tourne dans le navigateur comme sous Node.
// ================================================================

export const STUD_MM = 8;      // 1 tenon = 8 mm
export const PLATE_MM = 3.2;   // 1 plaque = 3,2 mm (1 brique = 3 plaques)

// --- Enveloppe générale (tenons en X/Z, plaques en Y) ------------
export const HULL_LEN = 78;    // museau -> pédoncule caudal
export const TOTAL_LEN = 96;   // hélice comprise = 76,8 cm
export const HALF_W = 6.5;     // demi-largeur maximale
export const HALF_H = 18;      // demi-hauteur maximale (plaques)
export const AXIS_Y = 30;      // couche de l'axe longitudinal
export const NY = 78;
export const Z_MIN = -18;
export const Z_MAX = 18;
export const CROSS_N = 2.2;    // exposant de la super-ellipse de section

// --- Couleurs LEGO utilisées -------------------------------------
export const COLORS = {
  black: { key: 'black', name: 'Noir',                 ldraw: 0,   bl: 11,  hex: '#1b1e21' },
  tan:   { key: 'tan',   name: 'Beige',                ldraw: 19,  bl: 2,   hex: '#dcc9a4' },
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

// --- Étapes de montage -------------------------------------------
export const STAGES = [
  { id: 1, key: 'chassis',   label: 'Châssis & quille',        blurb: 'La poutre longitudinale qui porte tout le reste : deux assises de briques à joints croisés, du museau au pédoncule caudal.' },
  { id: 2, key: 'avant',     label: 'Coque avant (la tête)',   blurb: 'La partie la plus dense. Les couches montent en terrasses ; la ligne de livrée commence à onduler dès le museau.' },
  { id: 3, key: 'arriere',   label: 'Coque arrière',           blurb: 'Le fuselage s’affine jusqu’au pédoncule caudal, large de deux tenons seulement.' },
  { id: 4, key: 'verriere',  label: 'Verrière & poste',        blurb: 'La bulle transparente du poste de pilotage et ses montants gris, posés sur le dos une fois la coque fermée.' },
  { id: 5, key: 'nageoires', label: 'Nageoires',               blurb: 'Pectorales, pelviennes et les deux dorsales. Les pectorales sont des ailes plates en flèche, tombantes vers le bout.' },
  { id: 6, key: 'empennage', label: 'Empennage & hélice',      blurb: 'La grande caudale en faucille, puis l’hélice dorée à l’extrême arrière et ses deux barres de gouverne.' },
  { id: 7, key: 'socle',     label: 'Socle & finitions',       blurb: 'Les deux montants de présentation, la gueule, l’œil et les ouïes.' },
];

// --- Sous-ensembles (pour l'éclaté) ------------------------------
export const GROUPS = {
  chassis:    { label: 'Châssis',             stage: 1, dir: [0, -1, 0] },
  avant:      { label: 'Coque avant',         stage: 2, dir: [-1, 0.2, 0] },
  arriere:    { label: 'Coque arrière',       stage: 3, dir: [1, 0.2, 0] },
  verriere:   { label: 'Verrière',            stage: 4, dir: [0, 1, 0] },
  pectoraleD: { label: 'Pectorale tribord',   stage: 5, dir: [0, -0.2, 1] },
  pectoraleG: { label: 'Pectorale bâbord',    stage: 5, dir: [0, -0.2, -1] },
  pelvienneD: { label: 'Pelvienne tribord',   stage: 5, dir: [0, -0.6, 1] },
  pelvienneG: { label: 'Pelvienne bâbord',    stage: 5, dir: [0, -0.6, -1] },
  dorsale:    { label: 'Dorsale',             stage: 5, dir: [0, 1, 0] },
  dorsale2:   { label: 'Dorsale secondaire',  stage: 5, dir: [0, 1, 0] },
  caudale:    { label: 'Caudale',             stage: 6, dir: [1, 0.3, 0] },
  helice:     { label: 'Hélice',              stage: 6, dir: [1, 0, 0] },
  socle:      { label: 'Socle',               stage: 7, dir: [0, -1, 0] },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ================================================================
// 1. PROFILS — une torpille élancée, museau arrondi
// ================================================================

function taper(u, { nose, tail, peak = 0.30, front = 2.6, back = 1.6, fill = 0.55 }) {
  if (u <= peak) {
    const t = (peak - u) / peak;
    const s = Math.sqrt(Math.max(0, 1 - Math.pow(t, front)));
    return nose + (1 - nose) * s;
  }
  const t = (u - peak) / (1 - peak);
  const s = Math.pow(Math.max(0, 1 - Math.pow(t, back)), fill);
  return tail + (1 - tail) * s;
}

export function halfWidth(x) {          // tenons
  const u = clamp(x / HULL_LEN, 0, 1);
  return HALF_W * taper(u, { nose: 0.30, tail: 0.09, peak: 0.30 });
}
export function halfTop(x) {            // plaques, au-dessus de l'axe
  const u = clamp(x / HULL_LEN, 0, 1);
  return HALF_H * taper(u, { nose: 0.34, tail: 0.10, peak: 0.32, back: 1.7, fill: 0.58 });
}
export function halfBottom(x) {
  return 0.92 * halfTop(x);             // section quasi circulaire
}
export function axisY(x) {
  const u = clamp(x / HULL_LEN, 0, 1);
  return AXIS_Y + 4 * u * u;
}
export function hullTop(x)    { return axisY(x) + halfTop(x); }
export function hullBottom(x) { return axisY(x) - halfBottom(x); }

function insideHull(x, y, z) {
  if (x < 0 || x > HULL_LEN) return false;
  const W = halfWidth(x);
  const dy = y - axisY(x);
  const H = dy >= 0 ? halfTop(x) : halfBottom(x);
  if (W < 0.45 || H < 0.6) return false;
  return Math.pow(Math.abs(z / W), CROSS_N) + Math.pow(Math.abs(dy / H), CROSS_N) <= 1;
}

// --- Verrière du poste de pilotage -------------------------------
// Une bulle allongée posée sur le dos, entre le museau et la dorsale.
const CANOPY = { x0: 26, x1: 42, halfZ: 3.4, rise: 7 };
function canopyTop(x) {
  if (x < CANOPY.x0 || x > CANOPY.x1) return -Infinity;
  const t = (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0);
  return hullTop(x) + CANOPY.rise * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2)));
}
function canopy(x, y, z) {
  const top = canopyTop(x);
  if (top === -Infinity) return false;
  const t = (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0);
  const halfZ = CANOPY.halfZ * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2) * 0.8));
  if (Math.abs(z) > halfZ) return false;
  return y > hullTop(x) - 1.5 && y <= top;
}

// --- Nageoire dorsale, juste derrière la verrière -----------------
const DORSAL = { x0: 44, xPeak: 49, x1: 63, height: 17 };
function dorsalHeight(x) {
  if (x < DORSAL.x0 || x > DORSAL.x1) return 0;
  if (x <= DORSAL.xPeak) return DORSAL.height * Math.pow((x - DORSAL.x0) / (DORSAL.xPeak - DORSAL.x0), 0.55);
  return DORSAL.height * Math.pow(1 - (x - DORSAL.xPeak) / (DORSAL.x1 - DORSAL.xPeak), 1.5);
}
const DORSAL2 = { x0: 65, xPeak: 68, x1: 72, height: 6 };
function dorsal2Height(x) {
  if (x < DORSAL2.x0 || x > DORSAL2.x1) return 0;
  if (x <= DORSAL2.xPeak) return DORSAL2.height * Math.pow((x - DORSAL2.x0) / (DORSAL2.xPeak - DORSAL2.x0), 0.6);
  return DORSAL2.height * Math.pow(1 - (x - DORSAL2.xPeak) / (DORSAL2.x1 - DORSAL2.xPeak), 1.3);
}

// --- Nageoires latérales -----------------------------------------
export function finMidY(x, z, cfg) {
  const r = Math.abs(z);
  return axisY(x) - cfg.drop * halfBottom(x) - cfg.slope * (r - cfg.r0);
}
function lateralFin(x, y, z, cfg) {
  const r = Math.abs(z);
  if (r < cfg.r0 || r > cfg.r1) return false;
  const t = (r - cfg.r0) / (cfg.r1 - cfg.r0);
  const xLE = cfg.xLE0 + (cfg.xLE1 - cfg.xLE0) * t;
  const xTE = cfg.xTE0 + (cfg.xTE1 - cfg.xTE0) * t;
  if (x < xLE || x > xTE) return false;
  return Math.abs(y - finMidY(x, z, cfg)) <= cfg.thick / 2;
}
const PECTORAL = { r0: 5.0, r1: 15, xLE0: 33, xLE1: 45, xTE0: 49, xTE1: 50, drop: 0.62, slope: 0.78, thick: 2.2 };
const PELVIC   = { r0: 3.0, r1: 9,  xLE0: 60, xLE1: 66, xTE0: 70, xTE1: 68, drop: 0.62, slope: 0.60, thick: 2.2 };

// --- Empennage : grande faucille verticale ------------------------
const SHAFT = { x0: 78, x1: TOTAL_LEN };   // ligne d'arbre de l'hélice
const CAUD = { x0: 70, x1: 94, upper: 40, lower: 26, forkAt: 82, fork: 20, halfThick: 1 };
function caudal(x, y, z) {
  if (x < CAUD.x0 || x > CAUD.x1) return false;
  if (z < -CAUD.halfThick || z >= CAUD.halfThick) return false;
  const xh = Math.min(x, HULL_LEN);
  const a = axisY(xh);
  const t = clamp((x - CAUD.x0) / (CAUD.x1 - CAUD.x0), 0, 1);
  const top = a + Math.max(halfTop(xh), CAUD.upper * Math.pow(t, 1.25));
  const bot = a - Math.max(halfBottom(xh), CAUD.lower * Math.pow(clamp((x - 74) / (CAUD.x1 - 74), 0, 1), 1.3));
  if (y > top || y < bot) return false;
  const notch = CAUD.fork * clamp((x - CAUD.forkAt) / (CAUD.x1 - CAUD.forkAt), 0, 1);
  if (Math.abs(y - a) < notch) return false;
  // canal d'arbre : deux plaques percées dans la racine de l'empennage
  if (x >= SHAFT.x0 && z >= -1 && z < 1 && y > a - 1 && y < a + 1) return false;
  return true;
}

// --- Solide complet ----------------------------------------------
function solidAt(x, y, z) {
  if (insideHull(x, y, z)) return x < 38 ? 'avant' : 'arriere';
  if (canopy(x, y, z)) return 'verriere';
  if (caudal(x, y, z)) return 'caudale';
  if (z >= -1 && z < 1) {
    const hd = dorsalHeight(x);
    if (hd > 0 && y >= hullTop(x) - 1 && y <= hullTop(x) + hd) return 'dorsale';
    const hd2 = dorsal2Height(x);
    if (hd2 > 0 && y >= hullTop(x) - 1 && y <= hullTop(x) + hd2) return 'dorsale2';
  }
  if (lateralFin(x, y, z, PECTORAL)) return z > 0 ? 'pectoraleD' : 'pectoraleG';
  if (lateralFin(x, y, z, PELVIC))   return z > 0 ? 'pelvienneD' : 'pelvienneG';
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

// La peau brute ne tient pas debout : sur le dos et sous le ventre,
// les anneaux de deux couches voisines sont côte à côte et non
// superposés. On la dilate d'une cellule en hauteur — sans effet sur
// les flancs verticaux — pour que les anneaux se recouvrent.
const HOLLOW = new Set(['avant', 'arriere', 'verriere']);
function shell(solid) {
  const skin = new Map();
  for (const [k, g] of solid) {
    if (!HOLLOW.has(g)) { skin.set(k, g); continue; }
    const [x, y, z] = k.split('|').map(Number);
    const exposed =
      !solid.has(key(x + 1, y, z)) || !solid.has(key(x - 1, y, z)) ||
      !solid.has(key(x, y + 1, z)) || !solid.has(key(x, y - 1, z)) ||
      !solid.has(key(x, y, z + 1)) || !solid.has(key(x, y, z - 1));
    if (exposed) skin.set(k, g);
  }
  const out = new Map(skin);
  for (const [k, g] of skin) {
    if (!HOLLOW.has(g)) continue;
    const [x, y, z] = k.split('|').map(Number);
    for (const dy of [-1, 1]) {
      const kk = key(x, y + dy, z);
      if (solid.has(kk) && !out.has(kk)) out.set(kk, g);
    }
  }
  return out;
}

// Poutre longitudinale, sur six plaques : deux assises de briques à
// joints croisés. Une seule assise resterait un plancher flottant.
function addChassis(cells) {
  for (let x = 0; x < HULL_LEN; x++) {
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
}

// ================================================================
// 4. LIVRÉE — dos noir, ventre crème, frontière ondulée
// ================================================================

// La ligne de séparation. Elle descend bas sur la tête (presque tout
// noir) et remonte vers la queue, et ondule en pointes le long du
// flanc : trois sinusoïdes de périodes premières entre elles, pour
// que le motif ne se répète pas.
export function liveryY(x) {
  const u = clamp(x / HULL_LEN, 0, 1);
  const base = axisY(x) - halfBottom(x) * (0.80 - 0.95 * u);
  const amp = 0.34 * halfTop(x);
  // deux harmoniques seulement : cinq grandes pointes le long du flanc,
  // pas un bord dentelé. Trois en produisaient un liseré bruité.
  const w = Math.sin(u * 26.0 + 0.6) * 0.74
          + Math.sin(u * 11.0 + 2.1) * 0.26;
  return base + amp * w;
}

// Gueule : un trait crème qui part du museau et remonte derrière l'œil.
function mouthY(x) {
  const t = clamp(x / 20, 0, 1);
  return axisY(x) - halfBottom(x) * (0.78 - 0.34 * t * t);
}

function colorAt(x, y, z, group) {
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

  if (group === 'socle') return 'black';
  if (group === 'chassis') return 'dgrey';
  if (group === 'helice') return 'gold';
  if (group === 'verriere') {
    // montants gris tous les quatre tenons, verre entre les deux
    const rib = Math.abs(((cx - CANOPY.x0) % 7) - 0.5) < 0.6;
    return rib || cy < hullTop(cx) - 0.5 ? 'lgrey' : 'trans';
  }

  const onFlank = Math.abs(cz) > halfWidth(cx) - 1.5;

  // Œil : petit cercle blanc cerclé de noir, haut sur la joue. Un rayon
  // plus large donnait une tache carrée de trois tenons, très loin du
  // petit cercle de la maquette.
  const eyeX = 10.5, eyeY = axisY(eyeX) + 5;
  if (onFlank && Math.hypot(cx - eyeX, (cy - eyeY) * 0.42) < 1.0) return 'white';

  // Ouïes : quatre fentes fines derrière la tête
  if (onFlank && cy > axisY(cx) - 3 && cy < axisY(cx) + 6) {
    for (let i = 0; i < 4; i++) {
      const gx = 20 + i * 2.6;
      if (Math.abs(cx - gx) < 0.5) return 'lgrey';
    }
  }

  // Gueule : trait crème souligné de dents blanches
  if (cx > 1 && cx < 21) {
    const my = mouthY(cx);
    if (cy > my && cy < my + 1.6) return 'tan';
    if (cy > my - 1.8 && cy <= my) return Math.floor(cx) % 2 === 0 ? 'white' : 'black';
  }

  // Nageoires : entièrement noires, comme sur la maquette
  if (group !== 'avant' && group !== 'arriere') return 'black';

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
function packLayer(layer, phase) {
  const used = new Set();
  const rects = [];
  for (let z = Z_MIN; z < Z_MAX; z++) {
    for (let x = 0; x < TOTAL_LEN; x++) {
      const k = `${x}|${z}`;
      if (used.has(k) || !layer.has(k)) continue;
      const cell = layer.get(k);
      const left = layer.get(`${x - 1}|${z}`);
      const runStart = !left || left.color !== cell.color || left.group !== cell.group;
      const order = phase === 1 && runStart ? RECTS_SHORT : RECTS;
      let placed = null;
      for (const [dz, dx] of order) {
        let ok = true;
        for (let j = 0; j < dz && ok; j++) {
          for (let i = 0; i < dx; i++) {
            const kk = `${x + i}|${z + j}`;
            const c = layer.get(kk);
            if (!c || used.has(kk) || c.color !== cell.color || c.group !== cell.group) { ok = false; break; }
          }
        }
        if (ok) { placed = [dz, dx]; break; }
      }
      const [dz, dx] = placed;
      for (let j = 0; j < dz; j++) for (let i = 0; i < dx; i++) used.add(`${x + i}|${z + j}`);
      rects.push({ x, z, dx, dz, color: cell.color, group: cell.group });
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

// L'hélice est à l'extrême arrière, derrière la caudale, comme sur la
// maquette. L'arbre traverse la racine de l'empennage par un canal de
// deux plaques ; c'est un doublage à joints décalés, donc une poutre.
function propeller() {
  const out = [];
  const a = Math.round(axisY(HULL_LEN));
  const P = (x, y, z, dx, dz, h, color, part) =>
    out.push({ x, y, z, dx, dz, h, color, group: 'helice', part });

  for (const z of [-1, 0]) {
    P(78, a - 1, z, 8, 1, 1, 'dgrey', 'plate-1x8');    // couche basse
    P(86, a - 1, z, 8, 1, 1, 'dgrey', 'plate-1x8');
    P(78, a, z, 4, 1, 1, 'dgrey', 'plate-1x4');        // couche haute, joints décalés
    P(82, a, z, 8, 1, 1, 'dgrey', 'plate-1x8');
    P(90, a, z, 4, 1, 1, 'dgrey', 'plate-1x4');
  }
  // barres de gouverne, en croix devant l'hélice
  P(91, a + 1, -5, 1, 4, 1, 'dgrey', 'plate-1x4');
  P(91, a + 1, 1, 1, 4, 1, 'dgrey', 'plate-1x4');
  // hélice : moyeu et quatre pales en or perlé
  P(93, a + 1, -3, 1, 6, 1, 'gold', 'plate-1x6');
  P(93, a + 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(93, a + 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(93, a - 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(93, a - 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(94, a + 1, -1, 2, 2, 1, 'gold', 'plate-2x2');
  return out;
}

// Deux montants noirs, hauteur ajustée au ventre de la coque.
// Deux montants fins, comme les tiges de la maquette : une colonne de
// 2 × 4 tenons par appui, les assises alternant leur sens de pose pour
// que les joints se croisent.
function stand() {
  const out = [];
  for (const cx of [22, 58]) {
    const topY = Math.floor(hullBottom(cx + 2)) - 1;
    let course = 0;
    for (let y = 0; y < topY; y += 3, course++) {
      const h = Math.min(3, topY - y);
      const kind = h === 3 ? 'brick' : 'plate';
      const put = (x, z, dx, dz) =>
        out.push({ x, y, z, dx, dz, h, color: 'black', group: 'socle', part: partKeyFor(dz, dx, kind) });
      if (course % 2 === 0) { put(cx, -2, 4, 2); put(cx, 0, 4, 2); }
      else { put(cx, -2, 2, 4); put(cx + 2, -2, 2, 4); }
    }
  }
  return out;
}

// ================================================================
// ASSEMBLAGE
// ================================================================

export function buildModel() {
  const solid = voxelize();
  const cells = shell(solid);
  addChassis(cells);

  const byLayer = new Map();
  for (const [k, group] of cells) {
    const [x, y, z] = k.split('|').map(Number);
    const color = colorAt(x, y, z, group);
    if (!byLayer.has(y)) byLayer.set(y, new Map());
    byLayer.get(y).set(`${x}|${z}`, { color, group });
  }

  const packed = new Map();
  for (const [y, layer] of byLayer) packed.set(y, packLayer(layer, Math.floor(y / 3) % 2));

  let pieces = mergeVertical(packed);
  pieces = pieces.concat(propeller(), stand());

  pieces.forEach((p, i) => {
    p.id = i;
    p.stage = GROUPS[p.group] ? GROUPS[p.group].stage : 7;
  });
  pieces.sort((a, b) => a.stage - b.stage || a.y - b.y || a.x - b.x);
  pieces.forEach((p, i) => { p.id = i; });
  markVisibleStuds(pieces);

  return { pieces, stats: statsFor(pieces), bbox: bboxFor(pieces), check: analyze(pieces) };
}

// Un tenon n'est dessiné que s'il n'est pas coiffé par une pièce.
function markVisibleStuds(pieces) {
  const filled = new Set();
  for (const p of pieces) {
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        for (let k = 0; k < p.h; k++) filled.add(`${p.x + a}|${p.y + k}|${p.z + c}`);
      }
    }
  }
  for (const p of pieces) {
    const top = p.y + p.h;
    p.studs = [];
    for (let a = 0; a < p.dx; a++) {
      for (let c = 0; c < p.dz; c++) {
        if (!filled.has(`${p.x + a}|${top}|${p.z + c}`)) p.studs.push([a, c]);
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
