// ================================================================
// BRIQUE STUDIO — MODÈLE 002 · SOUS-MARIN REQUIN
// Générateur paramétrique : de la géométrie continue au bordereau
// de pièces LEGO®.
//
// Chaîne de traitement :
//   1. fonctions de profil  -> solide implicite (coque, nageoires…)
//   2. voxelisation         -> cellules 1 × 1 × 1 plaque
//   3. évidement            -> ne garder que la peau + le châssis
//   4. colorisation         -> livrée, gueule, dents, œil, ouïes
//   5. pavage               -> rectangles = plaques réelles
//   6. fusion verticale     -> 3 plaques identiques = 1 brique
//
// Aucune dépendance : ce module tourne aussi bien dans le navigateur
// que sous Node (tests, export hors ligne).
// ================================================================

export const STUD_MM = 8;      // 1 tenon = 8 mm
export const PLATE_MM = 3.2;   // 1 plaque = 3,2 mm (1 brique = 3 plaques)

// --- Enveloppe générale (unités : tenons en X/Z, plaques en Y) ----
export const HULL_LEN = 82;    // museau -> pédoncule caudal
export const TOTAL_LEN = 96;   // empennage compris = 76,8 cm
export const HALF_W = 8;       // demi-largeur maximale du corps
export const HALF_H = 26;      // demi-hauteur maximale (plaques)
export const AXIS_Y = 34;      // couche de l'axe longitudinal
export const NY = 86;          // nombre de couches
export const Z_MIN = -18;
export const Z_MAX = 18;       // exclu
export const CROSS_N = 2.35;   // exposant de la super-ellipse de section

// --- Couleurs LEGO utilisées -------------------------------------
export const COLORS = {
  yellow: { key: 'yellow', name: 'Jaune vif',            ldraw: 14, bl: 3,  hex: '#f5c400' },
  white:  { key: 'white',  name: 'Blanc',                ldraw: 15, bl: 1,  hex: '#f2f3ee' },
  black:  { key: 'black',  name: 'Noir',                 ldraw: 0,  bl: 11, hex: '#12181f' },
  dgrey:  { key: 'dgrey',  name: 'Gris pierre foncé',    ldraw: 72, bl: 85, hex: '#5b6167' },
  lgrey:  { key: 'lgrey',  name: 'Gris pierre clair',    ldraw: 71, bl: 86, hex: '#9aa1a6' },
  trans:  { key: 'trans',  name: 'Transparent',          ldraw: 47, bl: 12, hex: '#cfe6ef', alpha: 0.4 },
  red:    { key: 'red',    name: 'Rouge vif',            ldraw: 4,  bl: 5,  hex: '#b8362a' },
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
  { id: 1, key: 'chassis',  label: 'Châssis & quille',      blurb: 'La poutre longitudinale qui porte tout le reste : deux assises de briques à joints croisés, du museau au pédoncule caudal.' },
  { id: 2, key: 'avant',    label: 'Coque avant (la tête)',  blurb: 'La partie la plus dense du modèle. Les couches montent en terrasses ; le museau se ferme sur la couronne du hublot.' },
  { id: 3, key: 'arriere',  label: 'Coque arrière',          blurb: 'Le fuselage s’affine jusqu’au pédoncule caudal, large de deux tenons seulement.' },
  { id: 4, key: 'hublot',   label: 'Hublot & verrière',      blurb: 'Le nez transparent et la verrière du poste de pilotage, posés en dernier sur la coque avant.' },
  { id: 5, key: 'nageoires', label: 'Nageoires',             blurb: 'Pectorales, pelviennes et dorsales. Les pectorales sont des ailes plates de deux plaques, en flèche et légèrement tombantes.' },
  { id: 6, key: 'empennage', label: 'Empennage & hélice',    blurb: 'La caudale fourchue à lobe supérieur dominant, et l’hélice portée par un arbre qui traverse la racine de l’empennage.' },
  { id: 7, key: 'socle',     label: 'Socle & finitions',     blurb: 'Les deux berceaux de présentation, la gueule, les dents, l’œil et les ouïes.' },
];

// --- Sous-ensembles (pour l'éclaté) ------------------------------
// dir = direction d'explosion, en repère modèle (x avant, y haut, z côté)
export const GROUPS = {
  chassis:   { label: 'Châssis',              stage: 1, dir: [0, -1, 0], hue: '#8a7a52' },
  avant:     { label: 'Coque avant',          stage: 2, dir: [-1, 0.2, 0], hue: '#f5c400' },
  arriere:   { label: 'Coque arrière',        stage: 3, dir: [1, 0.2, 0], hue: '#e0b400' },
  hublot:    { label: 'Hublot & verrière',    stage: 4, dir: [-0.6, 0.8, 0], hue: '#cfe6ef' },
  pectoraleD:{ label: 'Pectorale tribord',    stage: 5, dir: [0, -0.2, 1], hue: '#f0c02a' },
  pectoraleG:{ label: 'Pectorale bâbord',     stage: 5, dir: [0, -0.2, -1], hue: '#f0c02a' },
  pelvienneD:{ label: 'Pelvienne tribord',    stage: 5, dir: [0, -0.6, 1], hue: '#f0c02a' },
  pelvienneG:{ label: 'Pelvienne bâbord',     stage: 5, dir: [0, -0.6, -1], hue: '#f0c02a' },
  dorsale:   { label: 'Dorsale',              stage: 5, dir: [0, 1, 0], hue: '#f5c400' },
  dorsale2:  { label: 'Dorsale secondaire',   stage: 5, dir: [0, 1, 0], hue: '#f5c400' },
  caudale:   { label: 'Caudale',              stage: 6, dir: [1, 0.3, 0], hue: '#f5c400' },
  helice:    { label: 'Hélice',               stage: 6, dir: [1, 0, 0], hue: '#5b6167' },
  socle:     { label: 'Socle',                stage: 7, dir: [0, -1, 0], hue: '#12181f' },
  details:   { label: 'Détails',              stage: 7, dir: [0, 0.4, 1], hue: '#b8362a' },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ================================================================
// 1. PROFILS
// ================================================================

// Facteur longitudinal : renflé au tiers avant, effilé vers la queue.
function taper(u, { nose, tail, peak = 0.30, front = 2.4, back = 1.7, fill = 0.62 }) {
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
  return HALF_W * taper(u, { nose: 0.42, tail: 0.10, peak: 0.30 });
}
export function halfTop(x) {            // plaques, au-dessus de l'axe
  const u = clamp(x / HULL_LEN, 0, 1);
  return HALF_H * taper(u, { nose: 0.46, tail: 0.12, peak: 0.33, back: 1.9 });
}
export function halfBottom(x) {
  return 0.86 * halfTop(x);             // ventre plus plat que le dos
}
export function axisY(x) {              // la ligne de corps remonte vers la queue
  const u = clamp(x / HULL_LEN, 0, 1);
  return AXIS_Y + 6 * u * u;
}
export function hullTop(x)    { return axisY(x) + halfTop(x); }
export function hullBottom(x) { return axisY(x) - halfBottom(x); }

// Section : super-ellipse légèrement carrée -> lecture « mécanique »
function insideHull(x, y, z) {
  if (x < 0 || x > HULL_LEN) return false;
  const W = halfWidth(x);
  const dy = y - axisY(x);
  const H = dy >= 0 ? halfTop(x) : halfBottom(x);
  if (W < 0.45 || H < 0.6) return false;
  return Math.pow(Math.abs(z / W), CROSS_N) + Math.pow(Math.abs(dy / H), CROSS_N) <= 1;
}

// --- Nageoire dorsale --------------------------------------------
const DORSAL = { x0: 36, xPeak: 43, x1: 55, height: 18 };
function dorsalHeight(x) {
  if (x < DORSAL.x0 || x > DORSAL.x1) return 0;
  if (x <= DORSAL.xPeak) return DORSAL.height * Math.pow((x - DORSAL.x0) / (DORSAL.xPeak - DORSAL.x0), 0.65);
  return DORSAL.height * Math.pow(1 - (x - DORSAL.xPeak) / (DORSAL.x1 - DORSAL.xPeak), 1.35);
}
const DORSAL2 = { x0: 62, xPeak: 66, x1: 71, height: 7 };
function dorsal2Height(x) {
  if (x < DORSAL2.x0 || x > DORSAL2.x1) return 0;
  if (x <= DORSAL2.xPeak) return DORSAL2.height * Math.pow((x - DORSAL2.x0) / (DORSAL2.xPeak - DORSAL2.x0), 0.65);
  return DORSAL2.height * Math.pow(1 - (x - DORSAL2.xPeak) / (DORSAL2.x1 - DORSAL2.xPeak), 1.2);
}

// --- Nageoires latérales -----------------------------------------
// Aile plate en flèche : la corde se réduit et l'aile tombe vers le bout.
function lateralFin(x, y, z, cfg) {
  const r = Math.abs(z);
  if (r < cfg.r0 || r > cfg.r1) return false;
  const t = (r - cfg.r0) / (cfg.r1 - cfg.r0);
  const xLE = cfg.xLE0 + (cfg.xLE1 - cfg.xLE0) * t;
  const xTE = cfg.xTE0 + (cfg.xTE1 - cfg.xTE0) * t;
  if (x < xLE || x > xTE) return false;
  const yMid = axisY(x) - cfg.drop * halfBottom(x) - cfg.slope * (r - cfg.r0);
  return Math.abs(y - yMid) <= cfg.thick / 2;
}
export function finMidY(x, z, cfg) {
  const r = Math.abs(z);
  return axisY(x) - cfg.drop * halfBottom(x) - cfg.slope * (r - cfg.r0);
}
const PECTORAL = { r0: 6.5, r1: 17, xLE0: 25, xLE1: 38, xTE0: 45, xTE1: 41, drop: 0.26, slope: 0.42, thick: 2.2 };
const PELVIC   = { r0: 3.2, r1: 10, xLE0: 56, xLE1: 62, xTE0: 66, xTE1: 64, drop: 0.34, slope: 0.38, thick: 2.6 };

// --- Empennage caudal --------------------------------------------
const SHAFT = { x0: 83, x1: 95 };   // ligne d'arbre de l'hélice
const CAUD = { x0: 74, x1: TOTAL_LEN, upper: 40, lower: 25, forkAt: 86, fork: 22, halfThick: 1 };
function caudal(x, y, z) {
  if (x < CAUD.x0 || x > CAUD.x1) return false;
  if (z < -CAUD.halfThick || z >= CAUD.halfThick) return false;
  const t = clamp((x - CAUD.x0) / (CAUD.x1 - CAUD.x0), 0, 1);
  const a = axisY(Math.min(x, HULL_LEN));
  const top = a + Math.max(halfTop(Math.min(x, HULL_LEN)), CAUD.upper * Math.pow(t, 1.15));
  const bot = a - Math.max(halfBottom(Math.min(x, HULL_LEN)), CAUD.lower * Math.pow(clamp((x - 78) / (CAUD.x1 - 78), 0, 1), 1.25));
  if (y > top || y < bot) return false;
  // fourche : on évide le centre à l'arrière
  const notch = CAUD.fork * clamp((x - CAUD.forkAt) / (CAUD.x1 - CAUD.forkAt), 0, 1);
  if (Math.abs(y - a) < notch) return false;
  // canal d'arbre : deux plaques percées dans la racine de l'empennage,
  // pour que la ligne d'arbre soit tenue par le dessus et par le dessous
  if (x >= SHAFT.x0 && z >= -1 && z < 1 && y > a - 1 && y < a + 1) return false;
  return true;
}

// --- Solide complet ----------------------------------------------
// Renvoie la clé de sous-ensemble, ou null si la cellule est vide.
function solidAt(x, y, z) {
  if (insideHull(x, y, z)) return x < 40 ? 'avant' : 'arriere';
  if (caudal(x, y, z)) return 'caudale';
  // dorsales : lame de 2 tenons d'épaisseur au-dessus de la coque
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
  const solid = new Map();          // key -> group
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

// Ne garder que la peau ; l'intérieur reste creux. Les nageoires,
// minces par nature, sont conservées entières.
//
// La peau brute ne tient pas debout : sur le dos et sous le ventre, les
// anneaux de deux couches voisines sont côte à côte et non superposés,
// donc rien ne s'emboîte. On dilate donc la peau d'une cellule en
// hauteur — sans effet sur les flancs verticaux, où la cellule voisine
// appartient déjà à la peau. Les anneaux se recouvrent alors d'un
// tenon et le pavage les fusionne en bandes qui se tiennent.
function shell(solid) {
  const skin = new Map();
  for (const [k, g] of solid) {
    if (g !== 'avant' && g !== 'arriere') { skin.set(k, g); continue; }
    const [x, y, z] = k.split('|').map(Number);
    const exposed =
      !solid.has(key(x + 1, y, z)) || !solid.has(key(x - 1, y, z)) ||
      !solid.has(key(x, y + 1, z)) || !solid.has(key(x, y - 1, z)) ||
      !solid.has(key(x, y, z + 1)) || !solid.has(key(x, y, z - 1));
    if (exposed) skin.set(k, g);
  }
  const out = new Map(skin);
  for (const [k, g] of skin) {
    if (g !== 'avant' && g !== 'arriere') continue;
    const [x, y, z] = k.split('|').map(Number);
    for (const dy of [-1, 1]) {
      const kk = key(x, y + dy, z);
      if (solid.has(kk) && !out.has(kk)) out.set(kk, g);
    }
  }
  return out;
}

// Plancher longitudinal, sur six plaques : deux assises de briques à
// joints croisés. Une seule assise resterait un plancher flottant —
// des briques côte à côte, que rien ne solidarise. Avec deux, la coque
// se referme sur une vraie poutre.
function addChassis(cells) {
  for (let x = 0; x < HULL_LEN; x++) {
    const cx = x + 0.5;
    const a = Math.floor(axisY(cx));
    for (const y of [a - 3, a - 2, a - 1, a, a + 1, a + 2]) {
      for (let z = Z_MIN; z < Z_MAX; z++) {
        if (!insideHull(cx, y + 0.5, z + 0.5)) continue;
        const k = key(x, y, z);
        if (cells.has(k)) continue;   // la peau prime : le châssis reste interne
        cells.set(k, 'chassis');
      }
    }
  }
}

// ================================================================
// 4. COLORISATION
// ================================================================

// Ligne de gueule : elle part du museau et remonte derrière l'œil.
function mouthY(x) {
  const t = clamp(x / 26, 0, 1);
  return axisY(x) - halfBottom(x) * (0.72 - 0.30 * t * t);
}

function colorAt(x, y, z, group) {
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

  if (group === 'socle') return 'black';
  if (group === 'helice') return 'dgrey';
  if (group === 'chassis') return 'dgrey';

  // Nez transparent : le grand hublot circulaire du museau. Le museau
  // est franchement tronqué, la calotte avant est donc presque
  // entièrement vitrée — c'est par là que Tintin regarde.
  if (cx < 3.5) {
    const dy = (cy - axisY(cx) - 1) / 12, dz = cz / 5.5;
    if (dy * dy + dz * dz < 1) return 'trans';
  }
  // Verrière du poste de pilotage
  if (cx >= 14 && cx <= 25 && Math.abs(cz) < 3.6 && cy > hullTop(cx) - 5.5) return 'trans';

  // Œil : disque noir cerclé de blanc sur chaque flanc
  const eyeX = 13.5, eyeY = axisY(eyeX) + 5.5;
  const dEye = Math.hypot(cx - eyeX, (cy - eyeY) * 0.42);
  if (Math.abs(cz) > halfWidth(cx) - 1.6) {
    if (dEye < 1.5) return 'black';
    if (dEye < 2.6) return 'white';
  }

  // Ouïes : cinq fentes obliques derrière la tête
  if (Math.abs(cz) > halfWidth(cx) - 1.4 && cy > axisY(cx) - 4 && cy < axisY(cx) + 9) {
    for (let i = 0; i < 5; i++) {
      const gx = 27 + i * 3 + (cy - axisY(cx)) * 0.14;
      if (Math.abs(cx - gx) < 0.6) return 'dgrey';
    }
  }

  // Gueule : bande noire + rangée de dents blanches
  if (cx > 1.5 && cx < 27) {
    const my = mouthY(cx);
    if (cy > my && cy < my + 2.2) return 'black';
    if (cy > my - 2.2 && cy <= my) return (Math.floor(cx) % 2 === 0) ? 'white' : 'black';
  }

  // Nageoires latérales : jaune dessus, blanc dessous
  if (group === 'pectoraleD' || group === 'pectoraleG') return cy >= finMidY(cx, cz, PECTORAL) ? 'yellow' : 'white';
  if (group === 'pelvienneD' || group === 'pelvienneG') return cy >= finMidY(cx, cz, PELVIC) ? 'yellow' : 'white';

  // Ventre blanc
  if (cy < axisY(cx) - 0.42 * halfBottom(cx)) return 'white';
  return 'yellow';
}

// ================================================================
// 5. PAVAGE — rectangles = pièces réelles
// ================================================================

// (dz, dx) triés par surface décroissante ; les deux orientations
// d'une même pièce sont proposées.
const RECTS = [
  [2, 8], [8, 2], [2, 6], [6, 2],
  [2, 4], [4, 2], [1, 8], [8, 1],
  [2, 3], [3, 2], [1, 6], [6, 1],
  [2, 2], [1, 4], [4, 1],
  [1, 3], [3, 1], [1, 2], [2, 1], [1, 1],
];

// Même jeu, plafonné à quatre tenons : sert à démarrer une file par une
// pièce courte, une assise sur deux, pour décaler les joints.
const RECTS_SHORT = RECTS.filter(([dz, dx]) => dz <= 4 && dx <= 4);

function partKeyFor(dz, dx, kind) {
  const a = Math.min(dz, dx), b = Math.max(dz, dx);
  return `${kind}-${a}x${b}`;
}

// Pave une couche : renvoie des rectangles homogènes en couleur et
// en sous-ensemble.
//
// `phase` alterne d'une assise à l'autre (une assise = trois plaques =
// une brique). Sur les assises de phase 1, la première pièce de chaque
// file est plafonnée à quatre tenons : les joints tombent alors à
// contretemps de l'assise voisine, et les deux se verrouillent. Sans ce
// décalage, toutes les couches seraient pavées à l'identique et le
// modèle se réduirait à des piles de briques indépendantes.
function packLayer(layer, phase) {
  const used = new Set();
  const rects = [];
  const at = (x, z) => layer.get(`${x}|${z}`);

  for (let z = Z_MIN; z < Z_MAX; z++) {
    for (let x = 0; x < TOTAL_LEN; x++) {
      const k = `${x}|${z}`;
      if (used.has(k) || !layer.has(k)) continue;
      const cell = at(x, z);
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
  const index = new Map();  // signature -> [y…]
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

// L'hélice traverse la racine de l'empennage par un canal de deux
// plaques. La ligne d'arbre est un doublage de plaques à joints
// décalés : ancrée dans le massif de la caudale à l'avant, elle porte
// l'hélice en console au milieu de la fourche.
function propeller() {
  const out = [];
  const a = Math.round(axisY(HULL_LEN));
  const P = (x, y, z, dx, dz, h, color, part) =>
    out.push({ x, y, z, dx, dz, h, color, group: 'helice', part });

  for (const z of [-1, 0]) {
    P(83, a - 1, z, 8, 1, 1, 'dgrey', 'plate-1x8');   // couche basse
    P(91, a - 1, z, 4, 1, 1, 'dgrey', 'plate-1x4');
    P(83, a, z, 4, 1, 1, 'dgrey', 'plate-1x4');       // couche haute, joints décalés
    P(87, a, z, 8, 1, 1, 'dgrey', 'plate-1x8');
  }
  // pale horizontale, posée à cheval sur les deux rails de l'arbre
  P(94, a + 1, -3, 1, 6, 1, 'dgrey', 'plate-1x6');
  // pales verticales, empilées au-dessus et au-dessous
  P(94, a + 2, -1, 1, 2, 1, 'lgrey', 'plate-1x2');
  P(94, a + 3, -1, 1, 2, 1, 'dgrey', 'plate-1x2');
  P(94, a - 2, -1, 1, 2, 1, 'lgrey', 'plate-1x2');
  P(94, a - 3, -1, 1, 2, 1, 'dgrey', 'plate-1x2');
  return out;
}

// Deux berceaux noirs, hauteur ajustée au ventre de la coque. Les
// assises alternent leur sens de pose : les joints se croisent, le
// berceau tient tout seul.
function stand() {
  const out = [];
  for (const cx of [26, 64]) {
    const topY = Math.floor(hullBottom(cx + 4)) - 1;
    let course = 0;
    for (let y = 0; y < topY; y += 3, course++) {
      const h = Math.min(3, topY - y);
      const kind = h === 3 ? 'brick' : 'plate';
      const put = (x, z, dx, dz) =>
        out.push({ x, y, z, dx, dz, h, color: 'black', group: 'socle', part: partKeyFor(dz, dx, kind) });
      if (course % 2 === 0) {
        // en long, paires décalées d'un tenon pour enjamber l'axe
        put(cx, -6, 8, 1);
        for (let z = -5; z < 5; z += 2) put(cx, z, 8, 2);
        put(cx, 5, 8, 1);
      } else {
        // en travers, de part et d'autre de l'axe
        for (let x = cx; x < cx + 8; x += 2) { put(x, -6, 2, 6); put(x, 0, 2, 6); }
      }
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

  // colorisation
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

  // étape de montage + identifiant stable
  pieces.forEach((p, i) => {
    p.id = i;
    p.stage = GROUPS[p.group] ? GROUPS[p.group].stage : 7;
    if (p.color === 'trans') p.stage = 4, p.group = 'hublot';
  });
  pieces.sort((a, b) => a.stage - b.stage || a.y - b.y || a.x - b.x);
  pieces.forEach((p, i) => { p.id = i; });
  markVisibleStuds(pieces);

  return { pieces, stats: statsFor(pieces), bbox: bboxFor(pieces), check: analyze(pieces) };
}

// Un tenon n'est dessiné que s'il n'est pas coiffé par une pièce.
// Cela divise le nombre d'instances par trois et supprime les tenons
// qui traverseraient la couche du dessus.
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

// Contrôle de structure : chevauchements de corps et liaisons par
// tenons. Le résultat est affiché tel quel sur la page — il vaut mieux
// annoncer ce qui ne tient pas que de le passer sous silence.
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
  return {
    overlaps,
    components: sizes.length,
    largest: sizes[0] || 0,
    detached: pieces.length - (sizes[0] || 0),
  };
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

// Bordereau : une ligne par couple (pièce, couleur).
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

// Estimation paramétrique (et non un tarif officiel) : un plancher
// par pièce, plus un coût proportionnel à la surface en tenons.
// Les pièces spéciales portent une majoration de moule.
export function unitPrice(partKey) {
  const d = PARTS[partKey];
  if (!d) return 0;
  const area = d.dz * d.dx;
  const base = 0.045 + 0.021 * area;
  const factor = d.kind === 'brick' ? 1.25 : 1;
  return Math.round(base * factor * 100) / 100;
}
