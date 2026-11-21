// Alibi — objets du lot A (voyage et véhicules), style « Cartoon franc » : contours épais bleu nuit,
// aplats francs, une ombre découpée par forme, rehaut clair, trame de points. Module pur : aucun DOM.
// objectSVG(type, { w, h }) → <svg viewBox="0 0 w*100 h*100"> ; 100 unités par case, marge ≈ 8.
// Autonome : les petits utilitaires de dessin sont recopiés de art-objects.js (même vocabulaire).

import { INK, CREAM } from './palette.js';

// ------------------------------------------------------------------ teintes (aplat / ombre / rehaut)
const COR = '#FF6B5E', COR_D = '#D9493F', COR_L = '#FFB2AA';
const SUN = '#FFC83D', SUN_D = '#E0A01C', SUN_L = '#FFE7A6';
const MIN = '#4FCFA3', MIN_D = '#2FA27C', MIN_L = '#B6F0DA';
const SKY = '#57B8FF', SKY_D = '#2F86CC', SKY_L = '#B5DEFF';
const LIL = '#B58CFF', LIL_D = '#8F63E0', LIL_L = '#DCC9FF';
const ROS = '#FF8FC7';
const APP = '#A6D94A', APP_D = '#7BAF25';
const MAN = '#FF9F45', MAN_D = '#DB7A1F', MAN_L = '#FFD3A8';
const LAG = '#35C6D9', LAG_D = '#1A9DB0', LAG_L = '#A6EBF4';
const WD = '#F2A65A', WD_D = '#C97B32', WD_L = '#FFDDB0';
const ST = '#E9E2D6', ST_D = '#CFC6B8';
const GR = '#B9B0CC', GR_D = '#968BB0', GR_L = '#E4DFF0';
const DK = '#3B3F7A', DK_L = '#5A5F9E';
const WH = '#FFFFFF';

// ------------------------------------------------------------------ petits outils d'écriture SVG
const n = (v) => Math.round(v * 10) / 10;
const KEY = { sw: 'stroke-width', s: 'stroke', op: 'opacity', t: 'transform', lc: 'stroke-linecap', fr: 'fill-rule' };
function at(o) {
  let s = '';
  for (const k in o) {
    const v = o[k];
    if (v === undefined || v === null || v === false) continue;
    s += ` ${KEY[k] || k}="${typeof v === 'number' ? n(v) : v}"`;
  }
  return s;
}
const NS = { s: 'none' };
const rc = (x, y, w, h, r, f, o) => `<rect${at({ x, y, width: Math.max(0, w), height: Math.max(0, h), rx: r || null, fill: f, ...o })}/>`;
const ci = (cx, cy, r, f, o) => `<circle${at({ cx, cy, r, fill: f, ...o })}/>`;
const el = (cx, cy, rx, ry, f, o) => `<ellipse${at({ cx, cy, rx, ry, fill: f, ...o })}/>`;
const pa = (d, f, o) => `<path${at({ d, fill: f, ...o })}/>`;
const ln = (d, sw = 3, s) => `<path${at({ d, sw, s })}/>`;
const hl = (d, c, sw = 4.5) => ln(d, sw, c);
const g = (t, inner) => `<g transform="${t}">${inner}</g>`;
const ground = (cx, cy, rx, ry) => el(cx, cy, rx, ry, INK, { s: 'none', op: 0.13 });
// Barre épaisse cernée : trait bleu nuit large puis aplat coloré par-dessus.
const bar = (d, c, w = 5) => ln(d, w + 4.5, INK) + ln(d, w, c);
const dt = (p) => {
  let s = '';
  for (let i = 0; i + 1 < p.length; i += 2) s += `<circle cx="${n(p[i])}" cy="${n(p[i + 1])}" r="1.4"/>`;
  return `<g fill="${INK}" stroke="none" opacity=".3">${s}</g>`;
};
function dz(x, y, w, h, st = 7) {
  const p = [];
  let row = 0;
  for (let yy = y + 3; yy <= y + h - 3; yy += st * 0.8, row++) {
    for (let xx = x + 3 + (row % 2 ? st / 2 : 0); xx <= x + w - 3; xx += st) p.push(xx, yy);
  }
  return dt(p);
}
// Anneau elliptique (contour extérieur + trou) et secteur d'anneau entre deux angles (degrés).
const ellD = (cx, cy, rx, ry) => `M${n(cx - rx)} ${n(cy)} a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0 a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0 Z`;
const ring = (cx, cy, R, r, k, f, o) => pa(ellD(cx, cy, R, R * k) + ellD(cx, cy, r, r * k), f, { fr: 'evenodd', ...o });
function sector(cx, cy, R, r, k, a0, a1, f) {
  const P = (rr, a) => `${n(cx + rr * Math.cos(a * Math.PI / 180))} ${n(cy + rr * k * Math.sin(a * Math.PI / 180))}`;
  return pa(`M${P(R, a0)} A${R} ${n(R * k)} 0 0 1 ${P(R, a1)} L${P(r, a1)} A${r} ${n(r * k)} 0 0 0 ${P(r, a0)} Z`, f, NS);
}
// Roue vue de profil : pneu épais, jante colorée, rayons, moyeu.
function wheel(x, y, r, rim, spokes = 6, tread = false) {
  let s = ci(x, y, r, DK) + ci(x, y, r * 0.62, rim, { sw: 3 });
  if (tread) {
    let d = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      d += `M${n(x + Math.cos(a) * r * 0.86)} ${n(y + Math.sin(a) * r * 0.86)} L${n(x + Math.cos(a) * r)} ${n(y + Math.sin(a) * r)}`;
    }
    s += ln(d, 2.5, DK_L);
  }
  let d = '';
  for (let i = 0; i < spokes; i++) {
    const a = i * 2 * Math.PI / spokes + 0.3;
    d += `M${x} ${y} L${n(x + Math.cos(a) * r * 0.6)} ${n(y + Math.sin(a) * r * 0.6)}`;
  }
  return s + ln(d, 2.2) + ci(x, y, Math.max(3, r * 0.18), SUN_L, { sw: 2.5 }) + hl(`M${n(x - r * 0.72)} ${n(y - r * 0.3)} Q${n(x - r * 0.6)} ${n(y - r * 0.66)} ${n(x - r * 0.22)} ${n(y - r * 0.76)}`, DK_L, 3);
}

// ------------------------------------------------------------------ les dessins
// k : 'fix'  → dessin 100×100 (carré n×n : agrandi ; autre taille : répété par case)
//     'free' → f(W, H) gère toute taille
//     'rot'  → f(W, H) dans l'orientation canonique o ('h' large, 'v' haut), pivotée sinon

// Mise à l'échelle d'un dessin dont la petite dimension vaut 100 : f(L) reçoit la grande dimension.
const scaled = (s, inner) => (s === 1 ? inner : g(`scale(${n(s)})`, inner));

const DRAW = {
  // ============================================================ occupables
  // Siège de transport : haut dossier, appuie-tête à housse blanche, accoudoirs, pied sur rail.
  seat: { k: 'fix', f: () =>
    ground(50, 93, 42, 3) +
    rc(14, 86, 72, 7, 3, GR_D) +
    rc(26, 72, 9, 16, 3, GR) + rc(65, 72, 9, 16, 3, GR) +
    rc(19, 10, 62, 60, 15, SKY) + rc(65, 14, 14, 54, 7, SKY_D, NS) + dt([69, 32, 74, 42, 69, 52, 74, 60]) + rc(19, 10, 62, 60, 15) +
    hl('M27 30 V50', SKY_L, 5) +
    ln('M34 30 H66 M34 40 H66 M34 50 H66', 2.5, SKY_D) +
    rc(25, 3, 50, 21, 8, WH) + rc(27, 16, 46, 6, 3, ST_D, NS) + rc(25, 3, 50, 21, 8) + ln('M33 9 H50', 3, COR) +
    rc(12, 58, 76, 19, 8, SKY_D) + dz(16, 63, 68, 12, 7) + hl('M20 63 H34', SKY, 3.5) +
    rc(7, 50, 9, 28, 3, GR) + rc(84, 50, 9, 28, 3, GR) +
    rc(2, 40, 19, 12, 6, DK_L) + rc(79, 40, 19, 12, 6, DK_L) +
    hl('M7 44 H14 M84 44 H91', '#8E93CC', 3) + ci(89, 46, 2.4, SUN, NS) },

  // Couchette : lits superposés vus de face, montants, garde-corps, échelle sur le côté droit.
  // Hauteur 100 → 2 étages ; plus haute → un étage de plus par case.
  bunk: { k: 'free', f: (W, H) => {
    const T = H <= 100 ? 2 : Math.round(H / 100) + 1;
    const xr = W - 24, top = 8, bot = H - 9, th = (bot - top) / T;
    const blank = [LIL, MIN, SUN, ROS, LAG];
    let s = ground(W / 2, H - 5, W / 2 - 6, 3) +
      rc(5, 4, 10, H - 8, 4, WD) + rc(xr - 10, 4, 10, H - 8, 4, WD) + rc(10, 4, 5, H - 8, 2, WD_D, NS) + rc(xr - 5, 4, 5, H - 8, 2, WD_D, NS) +
      rc(5, 4, 10, H - 8, 4) + rc(xr - 10, 4, 10, H - 8, 4);
    for (let i = 0; i < T; i++) {
      const yb = top + (i + 1) * th, mh = Math.min(17, th * 0.42), ym = yb - 10 - mh;
      if (i < T - 1) s += bar(`M15 ${n(ym - 7)} H${n(Math.max(40, W * 0.5))}`, WD, 4);
      s += rc(14, ym, xr - 24, mh, 6, blank[i % blank.length]) +
        rc(14, ym + mh * 0.55, xr - 24, mh * 0.45, 4, i % 2 ? MIN_D : LIL_D, NS) + rc(14, ym, xr - 24, mh, 6) +
        rc(18, ym - 4, 20, mh, 6, WH) + hl(`M44 ${n(ym + 4)} H${n(Math.min(70, xr - 20))}`, i % 2 ? MIN_L : LIL_L, 3) +
        rc(12, yb - 11, xr - 20, 10, 3, WD) + ln(`M16 ${n(yb - 3)} H${n(xr - 12)}`, 2.5, WD_D);
    }
    // échelle à droite, dépassant du cadre
    const l1 = W - 21, l2 = W - 6;
    let rungs = '';
    for (let y = 18; y < H - 8; y += 15) rungs += `M${l1} ${y} H${l2}`;
    s += bar(rungs, SUN, 3.5) + bar(`M${l1} 10 V${H - 5} M${l2} 10 V${H - 5}`, SUN_D, 4.5) +
      ci(l1, 10, 3.5, SUN, { sw: 2.5 }) + ci(l2, 10, 3.5, SUN, { sw: 2.5 }) +
      hl(`M9 12 V${n(Math.min(40, H * 0.3))}`, WD_L, 3);
    return s;
  } },

  // Brancard (vu de dessus, long à la verticale) : toile, deux hampes, poignées rouges, croix, sangles.
  stretcher: { k: 'rot', o: 'v', f: (W, H) => {
    const s = W / 100, L = H / s;
    const cy = L / 2;
    let d = ground(50, L - 5, 40, 3) +
      // sangles qui dépassent sur les côtés
      bar(`M5 ${n(L * 0.3)} H95 M5 ${n(L * 0.7)} H95`, SUN, 4) +
      rc(22, 15, 56, L - 30, 6, CREAM) + rc(62, 17, 14, L - 34, 4, ST_D, NS) + dt([67, L * 0.42, 71, L * 0.5, 67, L * 0.58]) +
      rc(22, 15, 56, L - 30, 6) +
      rc(30, 20, 40, 13, 6, WH) + ln(`M30 ${n(L - 24)} H70`, 3, ST_D) +
      pa(`M44 ${n(cy - 15)} H56 V${n(cy - 6)} H65 V${n(cy + 6)} H56 V${n(cy + 15)} H44 V${n(cy + 6)} H35 V${n(cy - 6)} H44 Z`, COR, { sw: 3 });
    for (const x of [16, 84]) {
      d += rc(x - 5, 4, 10, L - 8, 5, GR) + rc(x - 1, 8, 4, L - 16, 2, GR_D, NS) + rc(x - 5, 4, 10, L - 8, 5) +
        rc(x - 6, 2, 12, 15, 5, COR) + rc(x - 6, L - 17, 12, 15, 5, COR) + hl(`M${x - 2} 6 V12`, COR_L, 2.5);
    }
    d += rc(9, L * 0.3 - 4, 14, 8, 2, SUN_D, { sw: 2.5 }) + rc(77, L * 0.7 - 4, 14, 8, 2, SUN_D, { sw: 2.5 });
    return scaled(s, d);
  } },

  // Vélo de profil : deux grandes roues, cadre corail, selle, guidon, panier.
  bike: { k: 'fix', f: () =>
    ground(50, 91, 46, 3) +
    wheel(23, 68, 21, LAG_L, 8) + wheel(77, 68, 21, LAG_L, 8) +
    bar('M23 68 L44 68 L68 40 M23 68 L38 38 L44 68 M38 40 H68 M68 40 L77 68', COR, 5.5) +
    bar('M38 38 L36 30', DK_L, 4) +
    rc(26, 23, 22, 8, 4, DK) + hl('M30 26 H38', DK_L, 2.5) +
    bar('M68 40 L66 26', DK_L, 4) + bar('M58 22 Q66 18 74 22', DK_L, 4) + rc(53, 19, 9, 6, 3, COR_D, { sw: 2.5 }) +
    pa('M74 28 H94 L91 44 H77 Z', WD) + ln('M78 34 H92 M80 39 H90', 2.5, WD_D) + ci(83, 25, 4, ROS, { sw: 2.5 }) +
    ci(44, 68, 6, SUN, { sw: 3 }) + bar('M44 68 L50 76', DK_L, 3) + rc(46, 75, 10, 5, 2, DK, { sw: 2.5 }) },

  // Tracteur de profil : grande roue arrière crantée, petite roue avant, cabine, capot, cheminée.
  // Plus long que haut : une remorque de foin s'accroche derrière.
  tractor: { k: 'rot', o: 'h', f: (W, H) => {
    const s = H / 100, L = W / s, x0 = L - 100;
    let d = '';
    if (x0 >= 30) {
      const tw = x0 - 4;
      d += ground(x0 / 2 + 2, 92, tw / 2, 3) +
        bar(`M${x0 - 8} 70 H${x0 + 10}`, DK_L, 3.5) +
        rc(6, 30, tw - 6, 26, 7, SUN) + rc(6, 44, tw - 6, 12, 4, SUN_D, NS) + rc(6, 30, tw - 6, 26, 7) +
        ln(`M14 38 H${tw - 10} M18 46 H${tw - 16}`, 2.5, SUN_D) +
        rc(4, 54, tw - 2, 18, 5, COR) + rc(4, 64, tw - 2, 8, 4, COR_D, NS) + rc(4, 54, tw - 2, 18, 5) +
        hl(`M12 34 H${Math.min(tw - 10, 40)}`, SUN_L, 4);
      const nw = Math.max(1, Math.round((tw - 8) / 46));
      for (let i = 0; i < nw; i++) d += wheel(6 + (tw - 2) * (i + 0.5) / nw, 78, 13, SUN, 5);
    }
    const tr = (inner) => (x0 ? g(`translate(${n(x0)} 0)`, inner) : inner);
    d += tr(
      ground(52, 92, 44, 3) +
      rc(70, 14, 9, 34, 3, DK) + hl('M73 18 V30', DK_L, 2.5) +
      ci(76, 9, 5, WH, { sw: 2.5 }) + ci(86, 6, 3.6, WH, { sw: 2.5 }) +
      rc(9, 6, 46, 9, 4, DK) +
      rc(14, 13, 34, 34, 5, COR) + rc(19, 17, 25, 24, 3, LAG_L, { sw: 3 }) + hl('M23 33 L32 22', WH, 3) +
      pa('M44 46 H92 Q96 46 96 54 V70 H44 Z', COR) + rc(44, 60, 52, 10, 0, COR_D, NS) + dt([78, 64, 86, 66, 70, 66]) +
      pa('M44 46 H92 Q96 46 96 54 V70 H44 Z') + ln('M86 50 V64 M91 50 V64', 2.5) + hl('M50 51 H72', COR_L, 3.5) +
      rc(10, 44, 40, 10, 4, COR_D) +
      wheel(30, 66, 27, SUN, 6, true) + wheel(80, 78, 15, SUN, 5));
    return scaled(s, d);
  } },

  // Luge de profil : siège à lattes sur montants, patins recourbés à l'avant, corde.
  sled: { k: 'fix', f: () =>
    ground(48, 92, 44, 3) +
    ln('M90 30 Q99 40 96 56 Q94 66 97 74', 3, COR_D) +
    bar('M28 50 L24 82 M50 50 V82 M72 50 L76 82', WD_D, 5) +
    bar('M24 66 H76', WD_D, 3) +
    pa('M10 32 L74 32 L86 46 L22 46 Z', WD) + pa('M22 46 H86 V54 Q86 57 82 57 H26 Q22 57 22 53 Z', WD_D) +
    ln('M27 32 L38 46 M44 32 L55 46 M61 32 L72 46', 3, WD_D) + hl('M17 35 H32', WD_L, 3) +
    bar('M5 85 H72 Q92 85 94 64 Q96 40 84 34 Q74 32 76 44', COR, 6) +
    hl('M12 85 H40', COR_L, 2.5) + dt([16, 91, 28, 91, 40, 91]) +
    ci(88, 30, 5, SUN, { sw: 2.5 }) },

  // ============================================================ bloquants
  // Valise à roulettes : poignée télescopique, coque nervurée, étiquette, autocollant.
  suitcase: { k: 'fix', f: () =>
    ground(50, 93, 36, 3) +
    bar('M38 28 V12 M62 28 V12', GR, 4) + rc(33, 5, 34, 10, 5, DK) + hl('M38 9 H50', DK_L, 2.5) +
    ci(28, 89, 5, DK, { sw: 3 }) + ci(72, 89, 5, DK, { sw: 3 }) +
    rc(15, 25, 70, 62, 12, COR) + rc(68, 29, 14, 54, 7, COR_D, NS) + dt([72, 44, 77, 54, 72, 64, 77, 72]) + rc(15, 25, 70, 62, 12) +
    ln('M31 32 V80 M50 32 V80 M69 32 V80', 3, COR_D) +
    hl('M22 36 V56', COR_L, 4.5) +
    rc(13, 50, 74, 7, 3, DK_L, { sw: 3 }) + rc(44, 48, 12, 11, 3, SUN, { sw: 2.5 }) +
    ci(31, 70, 8, SUN, { sw: 3 }) + pa('M31 65 L32.6 68.6 L36 69 L33.4 71.4 L34.2 75 L31 73.2 L27.8 75 L28.6 71.4 L26 69 L29.4 68.6 Z', WH, { sw: 1.6 }) +
    ln('M62 26 Q66 30 68 34', 2.5) + rc(62, 33, 14, 10, 3, LAG, { sw: 2.5 }) },

  // Chariot de service : deux plateaux sur roulettes, poignée, théière et tasses.
  trolley: { k: 'fix', f: () =>
    ground(52, 93, 42, 3) +
    bar('M20 40 L8 14', GR, 4.5) + rc(3, 8, 12, 9, 4, DK) +
    rc(18, 36, 7, 50, 3, GR) + rc(78, 36, 7, 50, 3, GR) +
    ci(22, 90, 4.5, DK, { sw: 2.5 }) + ci(82, 90, 4.5, DK, { sw: 2.5 }) +
    rc(12, 66, 80, 10, 4, MIN) + rc(12, 71, 80, 5, 2, MIN_D, NS) + rc(12, 66, 80, 10, 4) +
    rc(26, 56, 22, 10, 4, WH, { sw: 3 }) + ln('M30 61 H44', 2.5, ST_D) + rc(56, 58, 24, 8, 3, LAG, { sw: 3 }) +
    rc(10, 34, 84, 11, 4, MIN) + rc(10, 40, 84, 5, 2, MIN_D, NS) + rc(10, 34, 84, 11, 4) + hl('M18 37 H40', MIN_L, 3) +
    bar('M48 20 Q54 16 56 10', COR, 3.5) +
    pa('M24 34 Q20 14 36 12 Q52 14 48 34 Z', COR) + pa('M42 14 Q52 18 48 34 H40 Q44 24 42 14 Z', COR_D, NS) + pa('M24 34 Q20 14 36 12 Q52 14 48 34 Z') +
    ln('M20 22 Q14 22 18 30', 3) + rc(30, 6, 12, 6, 3, COR_D, { sw: 2.5 }) + hl('M28 20 Q28 16 31 15', COR_L, 3) +
    rc(60, 22, 12, 12, 3, SUN) + ln('M72 25 Q77 27 72 31', 2.5) + rc(76, 26, 12, 8, 3, SKY) +
    ln('M64 18 Q62 14 65 10', 2.5, GR_D) },

  // Gouvernail : roue de bois à rayons et poignées, sur un petit pied.
  helm: { k: 'fix', f: () => {
    const cx = 50, cy = 42;
    let spokes = '', knobs = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + Math.PI / 8, c = Math.cos(a), sn = Math.sin(a);
      spokes += `M${cx} ${cy} L${n(cx + c * 34)} ${n(cy + sn * 34)}`;
      knobs += rc(cx + c * 39 - 5.5, cy + sn * 39 - 5.5, 11, 11, 5.5, WD, { sw: 3.5 });
    }
    return ground(50, 93, 30, 3) +
      pa('M40 66 H60 L66 90 H34 Z', WD_D) + rc(28, 86, 44, 7, 3, WD_D) + hl('M44 72 L42 84', WD, 3) +
      bar(spokes, WD, 6) + knobs +
      ci(cx, cy, 26, null, { sw: 14 }) + ci(cx, cy, 26, null, { s: WD, sw: 7 }) +
      pa(`M${cx + 25} ${cy + 8} A26 26 0 0 1 ${cx - 8} ${cy + 25}`, null, { s: WD_D, sw: 4 }) +
      pa(`M${cx - 24} ${cy - 8} A26 26 0 0 1 ${cx + 6} ${cy - 25}`, null, { s: WD_L, sw: 3 }) +
      ci(cx, cy, 10, WD_D, { sw: 3.5 }) + ci(cx, cy, 4, SUN, { sw: 2.5 });
  } },

  // Bouée de sauvetage posée à plat (vue de trois-quarts) : quartiers rouges et blancs, corde.
  buoy: { k: 'fix', f: () => {
    const cx = 50, cy = 46, R = 41, r = 18, k = 0.74, dy = 9;
    let s = ground(50, 90, 44, 4) + ring(cx, cy + dy, R, r, k, ST_D);
    for (let a = -22.5; a < 337; a += 90) s += sector(cx, cy + dy, R, r, k, a, a + 45, COR_D);
    s += ring(cx, cy + dy, R, r, k) + ring(cx, cy, R, r, k, WH, NS);
    for (let a = -22.5; a < 337; a += 90) s += sector(cx, cy, R, r, k, a, a + 45, COR);
    s += ring(cx, cy, R, r, k);
    // corde en festons entre quatre ligatures
    let rope = '';
    const P = (rr, a) => [cx + rr * Math.cos(a * Math.PI / 180), cy + 3 + rr * k * Math.sin(a * Math.PI / 180)];
    for (let a = 45; a < 405; a += 90) {
      const [x0, y0] = P(R + 1, a), [x1, y1] = P(R + 1, a + 90), [mx, my] = P(R + 9, a + 45);
      rope += `M${n(x0)} ${n(y0)} Q${n(2 * mx - (x0 + x1) / 2)} ${n(2 * my - (y0 + y1) / 2)} ${n(x1)} ${n(y1)}`;
    }
    s += ln(rope, 7) + ln(rope, 3, SUN_L);
    for (let a = 45; a < 405; a += 90) {
      const [xo, yo] = P(R + 1, a), [xi, yi] = P(r + 2, a);
      s += ln(`M${n(xo)} ${n(yo)} L${n(xi)} ${n(yi - 3)}`, 7) + ln(`M${n(xo)} ${n(yo)} L${n(xi)} ${n(yi - 3)}`, 3, SUN_L);
    }
    return s + hl('M20 36 Q24 28 32 25', COR_L, 4);
  } },

  // Ancre marine : anneau, jas, verge, bras recourbés à pattes, corde enroulée.
  anchor: { k: 'fix', f: () =>
    ground(50, 93, 38, 3) +
    ci(50, 11, 7, null, { sw: 10.5 }) + ci(50, 11, 7, null, { s: GR, sw: 5 }) +
    bar('M50 74 V20', GR, 9) + rc(51, 22, 4, 52, 2, GR_D, NS) +
    bar('M14 52 Q18 84 50 86 Q82 84 86 52', GR, 8) +
    pa('M5 58 L14 42 L24 56 Q16 54 5 58 Z', GR) + pa('M95 58 L86 42 L76 56 Q84 54 95 58 Z', GR) +
    ci(50, 84, 7, GR_D) +
    rc(28, 23, 44, 10, 5, DK_L) + ci(26, 28, 6, DK_L, { sw: 3.5 }) + ci(74, 28, 6, DK_L, { sw: 3.5 }) +
    bar('M50 16 Q66 22 58 34 Q42 44 58 54 Q68 62 58 68', COR, 3.5) +
    hl('M47 40 V60', GR_L, 3) + dt([56, 44, 56, 62, 66, 80, 74, 76]) },

  // Pupitre de commande : panneau d'écrans, tablette inclinée à boutons et manettes, meuble.
  // Les écrans se répètent en largeur (une colonne par case) et en hauteur (une rangée de plus par case).
  console: { k: 'free', f: (W, H) => {
    const cols = Math.max(1, Math.round(W / 100)), cw = (W - 24) / cols;
    const pb = H - 48;
    const rows = Math.max(1, Math.round((pb - 12) / 44)), rh = (pb - 14) / rows;
    let s = ground(W / 2, H - 5, W / 2 - 6, 3) +
      rc(10, 6, W - 20, pb - 2, 8, DK) + hl(`M16 14 V${n(Math.min(pb - 12, 40))}`, DK_L, 3.5);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = 16 + c * cw + 2, y = 12 + r * rh + 1, w = cw - 8, h = rh - 6, k = (c + r * 2) % 3;
      s += rc(x, y, w, h, 4, k === 1 ? LAG : APP_D, { sw: 3 });
      if (k === 0) s += ln(`M${n(x + 4)} ${n(y + h * 0.65)} L${n(x + w * 0.3)} ${n(y + h * 0.35)} L${n(x + w * 0.5)} ${n(y + h * 0.6)} L${n(x + w * 0.72)} ${n(y + h * 0.25)} L${n(x + w - 4)} ${n(y + h * 0.45)}`, 2.5, '#DDF3A8');
      else if (k === 1) {
        const cx = x + w / 2, cy = y + h / 2, rr = Math.min(w, h) / 2 - 3;
        s += ci(cx, cy, rr, null, { s: LAG_L, sw: 2 }) + ci(cx, cy, rr * 0.5, null, { s: LAG_L, sw: 1.6 }) +
          ln(`M${n(cx)} ${n(cy)} L${n(cx + rr * 0.7)} ${n(cy - rr * 0.7)}`, 2.5, WH) + ci(cx - rr * 0.4, cy + rr * 0.3, 2, SUN, NS);
      } else {
        let b = '';
        for (let i = 0; i < 4; i++) { const bh = h * [0.5, 0.75, 0.35, 0.6][i]; b += rc(x + 5 + i * (w - 10) / 4, y + h - 3 - bh, (w - 10) / 4 - 3, bh, 1, '#DDF3A8', NS); }
        s += b;
      }
      s += hl(`M${n(x + 4)} ${n(y + 4)} H${n(x + 10)}`, WH, 2);
    }
    s += pa(`M10 ${pb} H${W - 10} L${W - 4} ${pb + 18} H4 Z`, ST) + pa(`M${W - 22} ${pb} H${W - 10} L${W - 4} ${pb + 18} H${W - 18} Z`, ST_D, NS) +
      pa(`M10 ${pb} H${W - 10} L${W - 4} ${pb + 18} H4 Z`);
    for (let c = 0; c < cols; c++) {
      const x0 = 12 + c * (W - 24) / cols, cwb = (W - 24) / cols;
      s += ci(x0 + cwb * 0.2, pb + 9, 4, [COR, SKY][c % 2], { sw: 2.5 }) + ci(x0 + cwb * 0.38, pb + 9, 4, SUN, { sw: 2.5 }) +
        ci(x0 + cwb * 0.56, pb + 9, 4, MIN, { sw: 2.5 }) +
        bar(`M${n(x0 + cwb * 0.78)} ${pb + 10} L${n(x0 + cwb * 0.84)} ${pb - 8}`, GR, 3) + ci(x0 + cwb * 0.84, pb - 10, 5, COR, { sw: 3 });
    }
    s += rc(6, pb + 17, W - 12, H - pb - 24, 6, LAG) + rc(6, H - 16, W - 12, 9, 4, LAG_D, NS) + rc(6, pb + 17, W - 12, H - pb - 24, 6) +
      ln(Array.from({ length: Math.max(1, Math.round((W - 40) / 12)) }, (_, i) => `M${n(20 + i * 12)} ${pb + 23} V${pb + 29}`).join(''), 3, LAG_D) +
      hl(`M12 ${pb + 22} H${n(Math.min(W * 0.2, 30))}`, LAG_L, 3);
    return s;
  } },

  // Casier métallique : une porte à aérations, poignée, cadenas jaune, étiquette ; vu de trois-quarts.
  locker: { k: 'fix', f: () =>
    ground(50, 93, 36, 3) +
    rc(22, 84, 8, 8, 2, DK) + rc(64, 84, 8, 8, 2, DK) +
    pa('M70 6 L84 12 V84 L70 88 Z', SKY_D) + dt([75, 30, 79, 42, 75, 54, 79, 66, 75, 76]) +
    rc(16, 6, 56, 82, 6, SKY) + hl('M21 12 V30', SKY_L, 4) +
    rc(23, 13, 42, 68, 4, SKY, { sw: 3 }) +
    ln('M32 21 H56 M32 28 H56 M32 35 H56', 4.5) + ln('M32 67 H56 M32 74 H56', 4.5) +
    rc(28, 43, 18, 11, 2, WH, { sw: 2.5 }) + ln('M32 48.5 H42', 2.5, SKY_D) +
    rc(55, 44, 6, 18, 3, GR, { sw: 2.5 }) +
    ln('M55 58 V53 Q55 47 61 47 Q67 47 67 53 V58', 3.5) +
    rc(51, 56, 20, 15, 4, SUN) + ci(61, 62, 2.2, INK, NS) + ln('M61 63 V67', 2.2) + hl('M54 59 V62', SUN_L, 2.5) },

  // Escabeau : montants jaunes, larges marches, pieds arrière en ombre, plateau à pot de peinture.
  ladder: { k: 'fix', f: () =>
    ground(52, 93, 38, 3) +
    bar('M62 20 L86 90', SUN_D, 5) + bar('M68 44 L60 44', GR, 2.5) +
    bar('M38 18 L18 90 M62 18 L82 90', SUN, 6.5) +
    rc(30, 36, 40, 7, 3, GR) + rc(26, 54, 48, 7, 3, GR) + rc(22, 72, 56, 7, 3, GR) +
    hl('M34 39 H50 M30 57 H46 M26 75 H42', GR_L, 2.5) +
    hl('M36 26 L33 38', SUN_L, 2.5) +
    rc(28, 14, 44, 10, 4, COR) + hl('M33 17 H46', COR_L, 2.5) +
    ln('M46 8 Q53 -1 60 8', 2.5) + pa('M45 6 H61 L59 15 H47 Z', LAG) + hl('M48 8 V12', LAG_L, 2) + pa('M45 6 H61 V8 H45 Z', SKY_L, { sw: 2.5 }) },

  // Robot : tête carrée à antenne, grands yeux, oreilles, torse à voyants, bras à pinces, chenilles.
  robot: { k: 'fix', f: () =>
    ground(50, 93, 34, 3) +
    ln('M50 14 V7', 3) + ci(50, 6, 4.5, COR, { sw: 3 }) +
    rc(16, 21, 8, 13, 3, COR) + rc(76, 21, 8, 13, 3, COR) +
    rc(23, 12, 54, 32, 10, GR) + rc(62, 15, 13, 27, 5, GR_D, NS) + rc(23, 12, 54, 32, 10) +
    ci(39, 26, 7, SUN_L, { sw: 3 }) + ci(61, 26, 7, SUN_L, { sw: 3 }) + ci(40, 27, 3, INK, NS) + ci(62, 27, 3, INK, NS) +
    rc(41, 35, 18, 5, 2, DK, { sw: 2.5 }) + hl('M29 17 H40', GR_L, 3) +
    rc(43, 43, 14, 5, 2, DK, { sw: 3 }) +
    bar('M24 54 L12 66 L12 74', GR_D, 4.5) + bar('M76 54 L88 66 L88 74', GR_D, 4.5) +
    ln('M6 78 Q12 72 18 78 M82 78 Q88 72 94 78', 6) + ln('M6 78 Q12 72 18 78 M82 78 Q88 72 94 78', 2.5, SKY) +
    rc(22, 47, 56, 34, 9, SKY) + rc(62, 50, 14, 29, 5, SKY_D, NS) + dt([66, 60, 70, 70, 66, 74]) + rc(22, 47, 56, 34, 9) +
    rc(31, 54, 26, 18, 4, DK, { sw: 3 }) + ci(37, 60, 2.8, COR, NS) + ci(44, 60, 2.8, SUN, NS) + ci(51, 60, 2.8, MIN, NS) +
    ln('M35 67 H53', 2.5, LAG_L) + hl('M27 53 V64', SKY_L, 3.5) +
    rc(20, 80, 60, 12, 6, DK) + ci(30, 86, 3, DK_L, NS) + ci(50, 86, 3, DK_L, NS) + ci(70, 86, 3, DK_L, NS) },

  // Antenne parabolique sur trépied : grande coupe blanche inclinée, bras et tête de réception, ondes.
  antenna: { k: 'fix', f: () =>
    ground(50, 93, 32, 3) +
    bar('M50 64 L26 91 M50 64 L74 91 M50 64 V93', GR_D, 4) +
    rc(44, 46, 12, 22, 3, GR) + ci(50, 48, 6, DK_L, { sw: 3 }) +
    g('rotate(-28 46 40)',
      pa('M4 40 Q46 92 88 40 Z', GR) + pa('M62 64 Q80 58 88 40 H72 Q70 56 62 64 Z', GR_D, NS) + dt([60, 56, 68, 52, 52, 60]) + pa('M4 40 Q46 92 88 40 Z') +
      el(46, 40, 42, 14, WH) + el(46, 41, 31, 8.5, ST, { s: ST_D, sw: 3 }) + hl('M14 38 Q20 32 32 30', ST, 3) +
      bar('M28 38 L46 6 M64 38 L46 6', DK_L, 2.5) + rc(39, 0, 14, 11, 3, COR) + ci(46, 40, 3.2, DK_L, NS)) +
    ln('M74 12 Q82 14 84 22 M78 4 Q92 8 94 22', 3, SKY_D) },

  // Frigo : grand bloc blanc arrondi, congélateur en haut, longues poignées, aimants et pense-bête.
  fridge: { k: 'fix', f: () =>
    ground(50, 94, 36, 3) +
    rc(24, 86, 8, 7, 2, DK) + rc(68, 86, 8, 7, 2, DK) +
    rc(18, 4, 64, 84, 14, WH) + rc(66, 8, 13, 76, 7, ST, NS) + dt([70, 44, 74, 56, 70, 66, 74, 76]) + rc(18, 4, 64, 84, 14) +
    ln('M18 33 H82', 3.5) +
    rc(25, 13, 7, 14, 3.5, LAG, { sw: 3 }) + rc(25, 40, 7, 30, 3.5, LAG, { sw: 3 }) +
    hl('M24 9 Q20 12 21 18', ST, 3) +
    rc(42, 40, 16, 18, 2, SUN_L, { sw: 2.5 }) + ln('M45 46 H55 M45 51 H52', 2) + ci(50, 40, 3, COR, { sw: 2 }) +
    ci(66, 46, 4.5, MIN, { sw: 2.5 }) + pa('M62 64 L65 58 L68 64 L74 65 L69 69 L70 75 L65 72 L60 75 L61 69 L56 65 Z', SUN, { sw: 2.5 }) +
    ci(50, 18, 4, ROS, { sw: 2.5 }) + rc(60, 14, 10, 7, 2, SKY, { sw: 2.5 }) +
    rc(18, 76, 64, 6, 0, ST_D, NS) + ln('M18 76 H82', 2.5) },

  // Lavabo sur colonne : vasque blanche, eau, robinet à deux croisillons, savon.
  sink: { k: 'fix', f: () =>
    ground(50, 93, 28, 3) +
    pa('M40 60 H60 L64 88 H36 Z', WH) + pa('M54 60 H60 L64 88 H56 Z', ST_D, NS) + pa('M40 60 H60 L64 88 H36 Z') +
    rc(32, 86, 36, 7, 3, ST) +
    rc(44, 14, 12, 16, 3, GR) + bar('M50 16 V8 Q50 4 56 4 H64 V10', GR, 4) + ci(64, 15, 2.6, SKY, { sw: 2 }) +
    pa('M7 34 H93 Q92 62 50 64 Q8 62 7 34 Z', WH) + pa('M70 52 Q84 46 92 36 Q90 60 54 63 Q66 60 70 52 Z', ST_D, NS) + dt([76, 54, 82, 50, 70, 58]) +
    pa('M7 34 H93 Q92 62 50 64 Q8 62 7 34 Z') +
    el(50, 34, 43, 11, WH) + el(50, 35, 32, 6.5, LAG, { sw: 3 }) + hl('M36 34 Q42 32 48 34', LAG_L, 2.5) +
    ci(64, 15, 2.6, SKY, { sw: 2 }) +
    ci(30, 22, 6, COR, { sw: 3 }) + ln('M24 22 H36 M30 16 V28', 2.5) +
    ci(70, 22, 6, SKY, { sw: 3 }) + ln('M64 22 H76 M70 16 V28', 2.5) +
    el(84, 30, 7, 3.5, ROS, { sw: 2.5 }) + hl('M14 42 Q18 50 26 53', WH, 3) },

  // Distributeur de boissons : grand meuble corail, vitrine à bouteilles, boutons et fente, trappe.
  vending: { k: 'fix', f: () => {
    let s = ground(50, 94, 38, 3) +
      rc(18, 86, 9, 7, 2, DK) + rc(73, 86, 9, 7, 2, DK) +
      rc(12, 4, 76, 84, 8, COR) + rc(76, 8, 10, 76, 5, COR_D, NS) + dt([79, 30, 83, 42, 79, 54, 83, 66]) + rc(12, 4, 76, 84, 8) +
      rc(18, 10, 64, 11, 4, SUN, { sw: 3 }) + pa('M28 12 L33 15.5 L28 19 Z M48 12 L53 15.5 L48 19 Z M68 12 L73 15.5 L68 19 Z', COR, NS) +
      rc(18, 26, 42, 46, 4, SKY_L, { sw: 3.5 });
    const C = [[MIN, SUN, ROS], [LAG, COR, APP], [SUN, LIL, MAN]];
    for (let r = 0; r < 3; r++) {
      const yb = 26 + (r + 1) * 15;
      for (let i = 0; i < 3; i++) {
        const x = 23 + i * 12.5;
        s += rc(x, yb - 12, 8, 11, 2.5, C[r][i], { sw: 2.2 }) + rc(x + 2, yb - 15, 4, 4, 1, WH, { sw: 1.8 });
      }
      if (r < 2) s += ln(`M19 ${yb} H59`, 2.5);
    }
    return s + hl('M22 34 L29 27', WH, 2.5) +
      rc(64, 26, 18, 46, 3, COR_D, { sw: 3 }) +
      ci(69, 33, 2.8, SUN, { sw: 1.8 }) + ci(77, 33, 2.8, SUN, { sw: 1.8 }) + ci(69, 41, 2.8, SUN, { sw: 1.8 }) + ci(77, 41, 2.8, SUN, { sw: 1.8 }) +
      rc(68, 50, 10, 9, 2, DK, { sw: 2.5 }) + ln('M73 52 V57', 2.2, SUN_L) +
      rc(67, 63, 12, 5, 2, DK, NS) +
      rc(22, 76, 38, 9, 3, DK, { sw: 3 }) + hl('M26 80 H40', DK_L, 2.5) + hl('M17 12 V22', COR_L, 3.5);
  } },
};

// ------------------------------------------------------------------ objet inconnu : pictogramme « ? »
function unknown(W, H) {
  const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
  return rc(8, 8, W - 16, H - 16, 12, CREAM, { sw: 3, 'stroke-dasharray': '7 6' }) +
    g(`translate(${cx} ${cy}) scale(${n(s)})`,
      ci(0, 0, 24, SUN) +
      ln('M-8 -6 Q-8 -15 0 -15 Q9 -15 9 -7 Q9 -1 0 2 V7', 6) + ci(0, 15, 3.6, INK, NS));
}

function cells(W, H, f) {
  let s = '';
  for (let y = 0; y < H; y += 100) for (let x = 0; x < W; x += 100) s += x || y ? g(`translate(${x} ${y})`, f()) : f();
  return s;
}

function render(def, W, H) {
  switch (def.k) {
    case 'fix':
      if (W === H) return W === 100 ? def.f() : g(`scale(${W / 100})`, def.f());
      return cells(W, H, def.f);
    case 'free':
      return def.f(W, H);
    case 'rot': {
      const rot = (def.o === 'h' && H > W) || (def.o === 'v' && W > H);
      return rot ? g(`translate(${W} 0) rotate(90)`, def.f(H, W)) : def.f(W, H);
    }
    default:
      return unknown(W, H);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

export const OBJECT_TYPES = Object.keys(DRAW);

export function objectSVG(type, { w = 1, h = 1 } = {}) {
  w = Math.max(1, Math.round(Number(w) || 1));
  h = Math.max(1, Math.round(Number(h) || 1));
  const W = w * 100, H = h * 100;
  const def = Object.prototype.hasOwnProperty.call(DRAW, type) ? DRAW[type] : null;
  let body;
  try {
    body = def ? render(def, W, H) : unknown(W, H);
  } catch (e) {
    body = unknown(W, H);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" class="alibi-obj" data-type="${esc(type)}"><g fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
}
