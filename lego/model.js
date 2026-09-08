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
// Cotes relevées sur la photo de la maquette (1 740 px pour 96 tenons).
export const HULL_LEN = 84;    // museau -> racine de la caudale
export const TOTAL_LEN = 96;   // hélice comprise = 76,8 cm
export const AXIS_Y = 62;      // couche de l'axe : le sous-marin flotte haut
                               // sur ses tiges, les nageoires plongent sous lui
export const NY = 120;
export const Z_MIN = -14;
export const Z_MAX = 14;
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
// 1. PROFILS — relevés sur la maquette, interpolés
// ================================================================

// Interpolation cubique monotone (Fritsch-Carlson) : passe par les
// cotes relevées sans onduler entre elles.
function pchip(xs, ys) {
  const n = xs.length, h = [], d = [];
  for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push((ys[i + 1] - ys[i]) / h[i]); }
  const m = new Array(n);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (xs[i + 1] < x) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i]
         + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// Demi-hauteurs en plaques, du museau (x = 0) à la racine de la
// caudale (x = 84). Museau en pointe, corps le plus haut vers x = 33,
// affinement franc jusqu'à un pédoncule de trois tenons.
// Le museau est un cône : la demi-hauteur monte d'environ 1,5 plaque
// par tenon sur les huit premiers tenons, puis s'arrondit vers le renflement.
// La cote en x = 0 garde la cellule de pointe : le modèle fait 96 tenons.
const XS = [0, 2, 4, 6, 8, 11, 16, 22, 28, 33, 40, 44, 50, 55, 60, 66, 72, 77, 84];
const TOP = pchip(XS, [1.7, 3, 6, 8.6, 11, 14.2, 17.2, 19.2, 19.9, 20.2, 19.4, 18, 16, 13.5, 11, 8.5, 6.5, 5, 3.5]);
const BOT = pchip(XS, [1.5, 2.6, 5.2, 7.6, 9.8, 12.8, 15.8, 17.6, 18.3, 18.6, 18, 17, 15.5, 13, 10.5, 8, 6, 4.5, 3.5]);

const mx = (x) => Math.max(0, Math.min(MESH.len - 1, Math.floor(x)));
export function halfTop(x) {
  if (MESH) { const t = MESH.top(mx(x)), b = MESH.bot(mx(x)); return t !== undefined ? (t - b) / 2 : 0; }
  return TOP(clamp(x, 0, HULL_LEN));
}
export function halfBottom(x) {
  if (MESH) return halfTop(x);
  return BOT(clamp(x, 0, HULL_LEN));
}
export function halfWidth(x) {
  if (MESH) { const w = MESH.wid(mx(x)); return w !== undefined ? Math.max(0.5, w) : 0.5; }
  return Math.max(0.5, 0.40 * halfTop(x));   // 20 plaques = 8 tenons : section ronde
}
export function axisY(x) {
  if (MESH) { const t = MESH.top(mx(x)), b = MESH.bot(mx(x)); return t !== undefined ? (t + b) / 2 : AXIS_Y; }
  return AXIS_Y + 2 * clamp(x / HULL_LEN, 0, 1);
}
export function hullTop(x)    { return axisY(x) + halfTop(x); }
export function hullBottom(x) { return axisY(x) - halfBottom(x); }

// Hauteur de la peau du dos à l'aplomb de (x, z)
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

// --- Verrière : une voûte de 22 tenons sur 13, haute de 17 plaques ------
// Sur la maquette, la bulle couvre presque toute la largeur du dos, avec
// trois arceaux chromés et un bandeau de base. Les extrémités sont
// arrondies, la section est un arc elliptique.
const CANOPY = { x0: 28, x1: 50, halfZ: 6.5, rise: 17, ribs: [33, 39, 45] };
function canopyEnd(x) {
  const t = (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0);
  return Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 6)));
}
function canopy(x, y, z) {
  if (x < CANOPY.x0 || x > CANOPY.x1) return false;
  const end = canopyEnd(x);
  const hz = CANOPY.halfZ * end;
  if (hz < 0.5 || Math.abs(z) > hz) return false;
  const top = hullTop(x) + CANOPY.rise * Math.sqrt(Math.max(0, 1 - Math.pow(z / hz, 2))) * end;
  return y > hullSurfaceTop(x, z) - 1.5 && y <= top;
}

// --- Lames verticales (dorsales, caudale) ---------------------------
// Une lame est décrite par ses bords d'attaque et de fuite en fonction
// de la hauteur relative t : bord d'attaque convexe qui recule en
// montant, bord de fuite concave, pointe rejetée en arrière — le profil
// d'une nageoire de requin, pas un triangle.
function blade(x, h, H, LE, TE) {
  if (h < -1 || h > H) return false;
  const t = clamp(h / H, 0, 1);
  return x >= LE(t) && x <= TE(t);
}
const DORSAL  = { H: 26, LE: (t) => 46 + 11 * Math.pow(t, 1.6), TE: (t) => 59 - 12 * t * Math.sqrt(1 - t) };
const DORSAL2 = { H: 10, LE: (t) => 70 + 5 * Math.pow(t, 1.5),  TE: (t) => 76 - 4 * t * (1 - t) };

// La caudale est un croissant mince : lobe supérieur de 53 plaques,
// inférieur de 38, tous deux rejetés en arrière, deux à trois tenons
// de corde seulement. La racine s'ancre sur le pédoncule entre x = 84
// et 88, et l'échancrure du bord de fuite se creuse jusqu'à x = 88.
// La racine part de x = 80, quatre tenons avant la fin du pédoncule :
// la peau de la coque garde la priorité, la lame vient donc coiffer le
// pédoncule par-dessus et par-dessous, et s'y lie par les tenons.
const CAUD = {
  up:   { H: 53, LE: (t) => 80 + 14 * Math.pow(t, 1.3), TE: (t) => 88 + 8 * t - 2 * Math.sin(Math.PI * t) },
  down: { H: 38, LE: (t) => 80 + 13 * Math.pow(t, 1.3), TE: (t) => 88 + 8 * t - 2 * Math.sin(Math.PI * t) },
};
const SHAFT = { x0: 84 };   // ligne d'arbre de l'hélice
function caudal(x, y, z) {
  if (z < -1 || z >= 1) return false;
  const a = axisY(HULL_LEN);
  const dy = y - a;
  const lobe = dy >= 0 ? CAUD.up : CAUD.down;
  if (!blade(x, Math.abs(dy), lobe.H, lobe.LE, lobe.TE)) return false;
  // canal d'arbre : deux plaques percées dans la racine
  if (x >= SHAFT.x0 && y > a - 1 && y < a + 1) return false;
  return true;
}

// --- Nageoires latérales : lames pendantes -----------------------------
// La pectorale de la maquette est presque verticale : elle plonge de 37
// plaques sous son attache et ne s'écarte que de six tenons du flanc.
// On la décrit donc par la profondeur d, de 0 à D : à chaque couche, la
// lame occupe deux tenons de large autour d'une ligne qui s'écarte
// lentement du flanc, et une corde qui se resserre vers la pointe.
function hangingFin(x, y, z, cfg) {
  const root = axisY(x) - cfg.drop * halfBottom(x);
  const d = root - y;
  if (d < -1 || d > cfg.D) return false;
  const t = clamp(d / cfg.D, 0, 1);
  const zc = cfg.r0 + (cfg.r1 - cfg.r0) * t;
  if (Math.abs(Math.abs(z) - zc) > 1) return false;
  const xLE = cfg.xLE0 + (cfg.xLE1 - cfg.xLE0) * t;
  const xTE = cfg.xTE0 + (cfg.xTE1 - cfg.xTE0) * t;
  return x >= xLE && x <= xTE;
}
const PECTORAL = { D: 37, r0: 6.5, r1: 12.5, xLE0: 24, xLE1: 33, xTE0: 31, xTE1: 36.5, drop: 0.30 };
const PELVIC   = { D: 12, r0: 2.0, r1: 5.0,  xLE0: 67, xLE1: 71, xTE0: 72, xTE1: 73,   drop: 0.55 };

// --- Solide complet ----------------------------------------------
function solidAt(x, y, z) {
  if (insideHull(x, y, z)) return x < 38 ? 'avant' : 'arriere';
  if (canopy(x, y, z)) return 'verriere';
  if (caudal(x, y, z)) return 'caudale';
  if (z >= -1 && z < 1) {
    const h = y - hullTop(x);
    if (blade(x, h, DORSAL.H, DORSAL.LE, DORSAL.TE)) return 'dorsale';
    if (blade(x, h, DORSAL2.H, DORSAL2.LE, DORSAL2.TE)) return 'dorsale2';
  }
  if (hangingFin(x, y, z, PECTORAL)) return z > 0 ? 'pectoraleD' : 'pectoraleG';
  if (hangingFin(x, y, z, PELVIC))   return z > 0 ? 'pelvienneD' : 'pelvienneG';
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
const HOLLOW = new Set(['avant', 'arriere', 'verriere', 'coque']);
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
}

// ================================================================
// 4. LIVRÉE — dos noir, ventre blanc, frontière en pointes
// ================================================================

const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Relevé sur la photo de profil : la frontière court quatre plaques
// sous l'axe, et le blanc du ventre y monte en sept pointes vives,
// jusqu'à neuf plaques au-dessus de l'axe ; entre deux pointes, le noir
// redescend en lobes arrondis. Sur la tête, la ligne suit la gueule.
const PEAKS = [24, 31, 37, 50, 59, 69, 77];
export function liveryY(x) {
  const a = axisY(x);
  if (x < 12) {
    // gueule : du bout du museau, la ligne descend puis rejoint la base
    return a - 1 - 6 * smooth(0, 8, x) + 3 * smooth(8, 12, x);
  }
  // pointes en cosinus surélevé, 4,3 tenons de demi-base : des crêtes
  // pleines et des creux arrondis, comme sur la maquette, plutôt que
  // des aiguilles
  let P = 0;
  for (const px of PEAKS) {
    const d = Math.abs(x - px) / 4.3;
    if (d < 1) P = Math.max(P, Math.pow(0.5 * (1 + Math.cos(Math.PI * d)), 0.8));
  }
  return a - 4 + 12.5 * P;
}

function colorAt(x, y, z, group) {
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

  if (group === 'socle') return 'black';
  if (group === 'chassis') return 'dgrey';
  if (group === 'helice') return 'gold';
  if (group === 'verriere') {
    const rib = CANOPY.ribs.some((r) => Math.abs(cx - r) < 0.6);
    return rib || cy < hullTop(cx) - 0.5 ? 'lgrey' : 'trans';
  }

  const onFlank = Math.abs(cz) > halfWidth(cx) - 1.5;

  // Œil : un anneau blanc à centre noir, sept plaques au-dessus de
  // l'axe, onze tenons derrière le museau
  const eyeX = 11, eyeY = axisY(eyeX) + 7;
  const dEye = Math.hypot(cx - eyeX, (cy - eyeY) * 0.4);
  if (onFlank && dEye < 1.55) return dEye < 0.6 ? 'black' : 'white';

  // Ouïes : quatre fentes fines derrière la tête, à hauteur d'axe
  if (onFlank && cy > axisY(cx) - 2 && cy < axisY(cx) + 6) {
    for (let i = 0; i < 4; i++) {
      if (Math.abs(cx - (19.5 + i * 2.2)) < 0.5) return 'lgrey';
    }
  }

  // Nageoires : entièrement noires, comme sur la maquette
  if (group !== 'avant' && group !== 'arriere') return 'black';

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

// L'hélice est à l'extrême arrière, derrière la caudale. L'arbre
// traverse la racine de l'empennage par un canal de deux plaques ;
// c'est un doublage à joints décalés, donc une poutre.
function propeller() {
  const out = [];
  const a = Math.round(axisY(HULL_LEN));
  const P = (x, y, z, dx, dz, h, color, part) =>
    out.push({ x, y, z, dx, dz, h, color, group: 'helice', part });

  for (const z of [-1, 0]) {
    P(84, a - 1, z, 8, 1, 1, 'dgrey', 'plate-1x8');    // couche basse
    P(92, a - 1, z, 4, 1, 1, 'dgrey', 'plate-1x4');
    P(84, a, z, 4, 1, 1, 'dgrey', 'plate-1x4');        // couche haute, joints décalés
    P(88, a, z, 8, 1, 1, 'dgrey', 'plate-1x8');
  }
  // plan de plongée horizontal, large et mince, à hauteur d'arbre
  P(90, a + 1, -4, 2, 8, 1, 'dgrey', 'plate-2x8');
  P(92, a + 1, -4, 2, 8, 1, 'dgrey', 'plate-2x8');
  // hélice : moyeu et pales en or perlé
  P(94, a + 1, -3, 1, 6, 1, 'gold', 'plate-1x6');
  P(94, a + 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(94, a + 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(94, a - 2, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(94, a - 3, -1, 1, 2, 1, 'gold', 'plate-1x2');
  P(95, a + 1, -1, 1, 2, 1, 'gold', 'plate-1x2');
  return out;
}

// Le socle de la maquette : une plaque noire de 54 × 22 tenons, et deux
// tiges qui portent le sous-marin dix-huit centimètres au-dessus.
// Les tiges sont des colonnes de briques 2 × 2 ; c'est le point le plus
// fragile du modèle en briques, et la page le dit.
function stand() {
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
  for (const cx of [25, 62]) {
    const topY = Math.floor(hullBottom(cx + 1));
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

export function buildModel(voxels = null) {
  let solid;
  if (voxels) {
    // le maillage part de y = 0 : on le surélève pour laisser la place au socle
    const lift = voxels.lift ?? 22;
    const lifted = {};
    for (const [g, runs] of Object.entries(voxels.runs)) lifted[g] = runs.map(([x, y, z0, z1]) => [x, y + lift, z0, z1]);
    useMesh(lifted);
    solid = new Map();
    for (const [g, runs] of Object.entries(lifted)) {
      for (const [x, y, z0, z1] of runs) for (let z = z0; z <= z1; z++) solid.set(key(x, y, z), g);
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
  for (const [y, layer] of byLayer) packed.set(y, packLayer(layer, Math.floor(y / 3) % 2));

  let pieces = mergeVertical(packed);
  // le maillage apporte sa propre hélice ; le socle, lui, est toujours posé ici
  pieces = pieces.concat(voxels ? [] : propeller(), stand());

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
  if (p.group === 'caudale' && p.y + p.h - 1 < Math.round(axisY(HULL_LEN))) return 'caudaleBas';
  if (p.group === 'socle') return 'socle';
  return 'main';
}

// Bande de hauteur -> chapitre, pour la séquence principale
function bandOf(y) {
  if (y < AXIS_Y - 6) return 2;                    // ventre
  if (y < AXIS_Y + 10) return 3;                   // flancs
  if (y <= AXIS_Y + Math.ceil(TOP(33)) + 1) return 4;   // dos
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
