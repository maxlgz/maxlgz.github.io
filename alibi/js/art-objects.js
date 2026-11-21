// Alibi — objets du plateau, style « Cartoon franc » (contours épais bleu nuit, aplats francs,
// une ombre découpée par forme, rehaut clair, trame de points). Module pur : aucun DOM, aucune police.
// objectSVG(type, { w, h }) → <svg viewBox="0 0 w*100 h*100"> ; 100 unités par case, marge ≈ 8.

import { INK, CREAM } from './palette.js';

// ------------------------------------------------------------------ teintes (aplat / ombre / rehaut)
const COR = '#FF6B5E', COR_D = '#D9493F', COR_L = '#FFB2AA';
const SUN = '#FFC83D', SUN_D = '#E0A01C', SUN_L = '#FFE7A6';
const MIN = '#4FCFA3', MIN_D = '#2FA27C', MIN_L = '#B6F0DA';
const SKY = '#57B8FF', SKY_D = '#2F86CC', SKY_L = '#B5DEFF';
const LIL = '#B58CFF', LIL_D = '#8F63E0', LIL_L = '#DCC9FF';
const ROS = '#FF8FC7', ROS_D = '#E0609F', ROS_L = '#FFD0E8';
const APP = '#A6D94A', APP_D = '#7BAF25';
const MAN = '#FF9F45', MAN_D = '#DB7A1F', MAN_L = '#FFD3A8';
const LAG = '#35C6D9', LAG_D = '#1A9DB0', LAG_L = '#A6EBF4';
const WD = '#F2A65A', WD_D = '#C97B32', WD_L = '#FFDDB0';
const ST = '#E9E2D6', ST_D = '#CFC6B8';
const GR = '#B9B0CC', GR_D = '#968BB0';
const DK = '#3B3F7A', DK_L = '#5A5F9E';
const WH = '#FFFFFF';

// ------------------------------------------------------------------ petits outils d'écriture SVG
const n = (v) => Math.round(v * 10) / 10;
const KEY = { sw: 'stroke-width', s: 'stroke', op: 'opacity', t: 'transform', lc: 'stroke-linecap' };
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
const ln = (d, sw = 3, s) => `<path${at({ d, sw, s })}/>`;          // trait seul (fond hérité : none)
const hl = (d, c, sw = 4.5) => ln(d, sw, c);                         // rehaut clair
const g = (t, inner) => `<g transform="${t}">${inner}</g>`;
const ground = (cx, cy, rx, ry) => el(cx, cy, rx, ry, INK, { s: 'none', op: 0.13 });
// Trame de points (liste plate x,y,x,y…) ; dz = points en quinconce dans un rectangle.
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
// Contour unifié d'un nuage de disques (feuillage) : trait épais derrière, aplat sombre, aplat clair décalé.
function cloud(L, dark, main) {
  let o = '', d = '', m = '';
  for (const [x, y, r] of L) {
    o += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    d += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    m += `<circle cx="${x - 3}" cy="${y - 3.5}" r="${r - 5.5}"/>`;
  }
  return `<g stroke-width="9">${o}</g><g stroke="none" fill="${dark}">${d}</g><g stroke="none" fill="${main}">${m}</g>`;
}
// Flamme (grande jaune + petite corail) posée sur (x, y), hauteur ≈ 34·k.
function flame(x, y, k = 1) {
  const P = (pts) => 'M' + pts.map(([a, b]) => `${n(x + a * k)} ${n(y + b * k)}`).join(' ');
  const big = P([[-11, 0]]) + ` Q${n(x - 15 * k)} ${n(y - 14 * k)} ${n(x - 5 * k)} ${n(y - 22 * k)} Q${n(x - 5 * k)} ${n(y - 13 * k)} ${n(x)} ${n(y - 14 * k)} Q${n(x - 2 * k)} ${n(y - 26 * k)} ${n(x + 6 * k)} ${n(y - 34 * k)} Q${n(x + 7 * k)} ${n(y - 20 * k)} ${n(x + 12 * k)} ${n(y - 12 * k)} Q${n(x + 16 * k)} ${n(y - 4 * k)} ${n(x + 10 * k)} ${n(y)} Z`;
  const small = P([[-6, 0]]) + ` Q${n(x - 7 * k)} ${n(y - 8 * k)} ${n(x - 1 * k)} ${n(y - 11 * k)} Q${n(x)} ${n(y - 6 * k)} ${n(x + 3 * k)} ${n(y - 7 * k)} Q${n(x + 3 * k)} ${n(y - 13 * k)} ${n(x + 7 * k)} ${n(y - 16 * k)} Q${n(x + 9 * k)} ${n(y - 7 * k)} ${n(x + 7 * k)} ${n(y)} Z`;
  return pa(big, SUN, NS) + pa(small, COR, NS);
}
// Feuille pointue de (x1,y1) à (x2,y2), largeur w.
function leaf(x1, y1, x2, y2, w, f, vein) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const px = -(y2 - y1) / L * w, py = (x2 - x1) / L * w;
  return pa(`M${x1} ${y1} Q${n(mx + px)} ${n(my + py)} ${x2} ${y2} Q${n(mx - px)} ${n(my - py)} ${x1} ${y1} Z`, f) +
    ln(`M${x1} ${y1} Q${n(mx + px * 0.2)} ${n(my + py * 0.2)} ${n(x1 + (x2 - x1) * 0.75)} ${n(y1 + (y2 - y1) * 0.75)}`, 2.5, vein);
}

// ------------------------------------------------------------------ les dessins
// k : 'fix'  → dessin 100×100 (carré n×n : agrandi ; autre taille : répété par case)
//     'row'  → vue de face de largeur W sur 100 de haut (une rangée par ligne de cases ; plus haut que large : par case)
//     'free' → f(W, H) gère toute taille
//     'rot'  → vue de dessus f(W, H) dans l'orientation canonique o ('h' large, 'v' haut), pivotée sinon

const DRAW = {
  // ============================================================ bloquants
  tree: { k: 'fix', f: () =>
    ground(50, 91, 28, 5) +
    pa('M39 92 Q46 84 45 62 H55 Q54 84 61 92 Z', WD_D) + hl('M49 68 V84', WD, 3.5) +
    cloud([[50, 30, 22], [28, 44, 19], [72, 44, 19], [35, 60, 16], [65, 60, 16], [50, 52, 22]], MIN_D, MIN) +
    dt([62, 68, 70, 64, 78, 56, 56, 72, 84, 46]) +
    hl('M26 40 Q30 30 40 27', MIN_L, 5) + hl('M48 16 Q55 12 62 15', MIN_L, 4.5) +
    ln('M40 52 Q46 48 52 52 M58 36 Q64 33 70 37 M26 60 Q31 57 36 60', 3, MIN_D) },

  bush: { k: 'fix', f: () =>
    ground(50, 89, 42, 5) +
    cloud([[25, 66, 15], [40, 50, 18], [61, 48, 18], [77, 63, 14], [50, 70, 19], [30, 76, 12], [70, 77, 12]], APP_D, APP) +
    dt([60, 80, 68, 72, 76, 74, 84, 66, 52, 84]) +
    hl('M30 52 Q34 42 44 38', '#DDF3A8', 5) +
    [[38, 48, ROS], [64, 44, COR], [77, 66, ROS], [26, 70, COR], [52, 72, ROS]].map(([x, y, c]) =>
      ci(x, y, 6, c, { sw: 2.5 }) + ci(x, y, 2.2, SUN, NS)).join('') },

  rock: { k: 'fix', f: () => {
    const d = 'M12 80 Q6 60 20 46 Q28 22 54 20 Q80 20 86 44 Q96 62 88 80 Q70 92 48 90 Q24 92 12 80 Z';
    return ground(50, 88, 42, 5) + pa(d, GR, NS) +
      pa('M86 44 Q96 62 88 80 Q70 92 48 90 Q66 80 70 62 Q74 50 86 44 Z', GR_D, NS) + dt([76, 78, 82, 70, 70, 84, 84, 60]) +
      pa(d) + ln('M54 20 Q48 36 56 48 Q64 56 70 62 M56 48 Q40 54 30 72', 3) +
      hl('M24 50 Q30 34 44 28', '#E4DFF0', 5) +
      ln('M8 90 Q10 84 8 80 M12 90 Q14 84 19 82', 3, APP_D);
  } },

  plant: { k: 'fix', f: () =>
    leaf(48, 60, 14, 30, 8, MIN_D, INK) + leaf(52, 60, 86, 28, 8, MIN_D, INK) +
    leaf(49, 60, 28, 12, 9, MIN, MIN_D) + leaf(51, 60, 72, 12, 9, MIN, MIN_D) + leaf(50, 60, 50, 8, 8, MIN, MIN_D) +
    pa('M29 64 H71 L65 92 H35 Z', COR, NS) + pa('M58 66 H70 L64 90 H56 Z', COR_D, NS) + dt([60, 74, 64, 82, 60, 86]) +
    pa('M29 64 H71 L65 92 H35 Z') +
    rc(24, 55, 52, 13, 5, COR) + hl('M30 60 H44', COR_L, 4) },

  shelf: { k: 'free', f: (W, H) => {
    const rows = Math.max(1, Math.round((H - 28) / 26)), rh = (H - 28) / rows;
    const cols = [COR, SUN, MIN, LIL, ROS, MAN, CREAM, APP, LAG];
    const ws = [10, 8, 11, 9, 7, 10, 9], hs = [0, 4, 1, 5, 2, 3];
    let s = rc(8, 6, W - 16, H - 12, 8, SKY) + hl(`M14 10 H${Math.min(40, W - 20)}`, SKY_L, 4) +
      rc(16, 14, W - 32, H - 28, 4, SKY_D, { sw: 3 });
    let k = 0;
    for (let r = 0; r < rows; r++) {
      const yb = 14 + (r + 1) * rh;
      let x = 19;
      while (true) {
        const bw = ws[k % ws.length], bh = rh - 8 - hs[(k * 5 + r) % hs.length];
        if (x + bw > W - 19) break;
        s += rc(x, yb - 3 - bh, bw, bh, 2, cols[(k * 4 + r * 3) % cols.length], { sw: 2.5 });
        if (bw > 8) s += ln(`M${x + 2} ${n(yb - bh + 2)} H${x + bw - 2}`, 2);
        x += bw + (k % 4 === 3 ? 4 : 1);
        k++;
      }
      s += rc(12, yb - 4, W - 24, 7, 3, SKY, { sw: 3 });
    }
    return s;
  } },

  table: { k: 'fix', f: () =>
    ground(50, 91, 38, 5) +
    rc(45, 52, 10, 34, 3, WD_D) + rc(15, 56, 10, 35, 4, WD_D) + rc(75, 56, 10, 35, 4, WD_D) +
    dt([19, 72, 79, 72, 19, 82, 79, 82]) +
    el(50, 53, 44, 17, WD_D) + el(50, 46, 44, 17, WD) +
    hl('M14 44 Q20 34 38 30', WD_L, 5) + ln('M24 52 Q50 58 76 52', 2.5, WD_D) +
    pa('M42 46 Q35 36 44 28 H56 Q65 36 58 46 Z', LAG) + hl('M43 33 Q40 37 42 41', LAG_L, 3) +
    ln('M50 28 Q49 22 50 16 M50 24 Q44 20 40 21', 3) +
    leaf(50, 25, 61, 18, 3.5, MIN, MIN_D) +
    ci(50, 13, 7, COR, { sw: 3 }) + ci(50, 13, 2.8, SUN, NS) },

  desk: { k: 'row', f: (W) =>
    ground(W / 2, 92, W / 2 - 10, 4) +
    rc(W - 24, 46, 10, 44, 4, SUN_D) +
    rc(12, 46, 38, 44, 6, SUN) + rc(12, 80, 38, 10, 5, SUN_D) +
    ln('M12 62 H50 M12 77 H50', 3) + ln('M26 55 H36 M26 70 H36 M26 84 H36', 4) +
    rc(6, 36, W - 12, 13, 5, SUN) + hl(`M14 40 H${W * 0.35}`, SUN_L, 4) +
    rc(W - 40, 26, 8, 12, 2, DK, { sw: 3 }) +
    rc(W - 58, 5, 44, 27, 5, DK) + rc(W - 53, 10, 34, 17, 2, SKY, { sw: 2.5 }) + hl(`M${W - 49} 22 L${W - 41} 14`, SKY_L, 3) +
    rc(14, 25, 22, 11, 2, WH, { sw: 3 }) + ln('M18 29 H31', 2) +
    rc(W - 74, 27, 10, 10, 3, COR, { sw: 3 }) },

  counter: { k: 'row', f: (W) => {
    let s = ground(W / 2, 92, W / 2 - 8, 4) + rc(6, 46, W - 12, 44, 8, LIL) + rc(6, 76, W - 12, 14, 7, LIL_D) + dz(10, 77, W - 20, 12, 7);
    const np = Math.max(1, Math.round((W - 12) / 46)), pw = (W - 12) / np;
    for (let i = 0; i < np; i++) s += rc(6 + i * pw + 7, 54, pw - 14, 18, 4, LIL_L, { sw: 3 });
    s += rc(4, 36, W - 8, 16, 6, CREAM) + hl(`M10 41 H${W * 0.3}`, WH, 4) +
      ln('M10 32 L36 20', 16) + ln('M10 32 L36 20', 9, WD) + ln('M16 26 L19 30 M23 23 L26 27 M30 20 L33 24', 2.5, WD_D) +
      rc(W - 40, 5, 24, 10, 3, INK) + ln(`M${W - 35} 10 H${W - 22}`, 3, MIN) +
      rc(W - 47, 14, 40, 24, 5, SKY) + rc(W - 47, 30, 40, 8, 4, SKY_D);
    for (let i = 0; i < 3; i++) s += ci(W - 38 + i * 11, 21, 2.6, i === 2 ? COR : CREAM, NS) + ci(W - 38 + i * 11, 26.5, 2.6, i === 2 ? SUN : CREAM, NS);
    return s;
  } },

  wardrobe: { k: 'fix', f: () =>
    ground(50, 92, 38, 4) +
    rc(20, 82, 10, 10, 3, ROS_D) + rc(70, 82, 10, 10, 3, ROS_D) +
    rc(14, 12, 72, 74, 8, ROS, NS) + rc(72, 14, 12, 70, 4, ROS_D, NS) + dt([76, 30, 80, 42, 76, 54, 80, 66, 76, 78]) +
    rc(14, 12, 72, 74, 8) +
    ln('M50 18 V86', 3) +
    rc(21, 24, 23, 54, 5, ROS_L, { sw: 3 }) + rc(56, 24, 14, 54, 5, ROS_L, { sw: 3 }) +
    ci(45, 52, 3.8, SUN, { sw: 2.5 }) + ci(55, 52, 3.8, SUN, { sw: 2.5 }) +
    rc(9, 6, 82, 12, 5, ROS_D) + hl('M16 10 H40', ROS_L, 3.5) },

  barrel: { k: 'fix', f: () => {
    const d = 'M22 24 Q13 54 22 84 Q50 96 78 84 Q87 54 78 24 Z';
    return ground(50, 91, 34, 4) + pa(d, '#D98A45', NS) +
      pa('M62 20 Q74 54 64 91 Q73 88 78 84 Q87 54 78 24 Q70 21 62 20 Z', '#B0662B', NS) + dt([70, 32, 76, 60, 70, 76, 77, 50]) +
      ln('M38 32 Q35 58 38 88 M62 32 Q65 58 62 88', 2.6) +
      ln('M18 41 Q50 51 82 41 M18 70 Q50 80 82 70', 12, INK).replace('/>', ' stroke-linecap="butt"/>') +
      ln('M18 41 Q50 51 82 41 M18 70 Q50 80 82 70', 5.5, '#A9A6C8').replace('/>', ' stroke-linecap="butt"/>') +
      pa(d) + el(50, 24, 28, 10, '#F2B05E') + el(50, 24, 20, 6, null, { s: '#D98A45', sw: 3 }) +
      hl('M30 22 Q36 16 46 15', WD_L, 4);
  } },

  crate: { k: 'fix', f: () =>
    ground(50, 91, 42, 4) +
    rc(12, 68, 76, 22, 8, WD_D) + dz(16, 78, 68, 11, 7) +
    rc(12, 10, 76, 70, 8, '#F2B05E') + hl('M20 18 H40', '#FFE0AE', 5) +
    ln('M14 33 H86 M14 56 H86', 3) +
    ln('M22 71 L78 19', 15) + ln('M22 71 L78 19', 7.5, '#F7C98A') +
    ci(22, 19, 2.6, INK, NS) + ci(78, 71, 2.6, INK, NS) },

  statue: { k: 'fix', f: () =>
    ground(50, 92, 36, 4) +
    rc(24, 64, 52, 24, 3, LIL) + rc(62, 66, 12, 20, 0, LIL_D, NS) + rc(24, 64, 52, 24, 3) +
    rc(36, 71, 22, 9, 2, SUN, { sw: 2.5 }) +
    rc(18, 83, 64, 9, 4, LIL_D) + rc(15, 58, 70, 9, 4, LIL_D) +
    pa('M16 59 Q16 38 50 35 Q84 38 84 59 Z', ST) + pa('M66 39 Q83 44 83 58 H70 Q72 47 66 39 Z', ST_D, NS) +
    ln('M28 54 Q42 44 64 50', 3) +
    rc(43, 28, 14, 10, 0, ST) +
    ci(50, 20, 15, ST) + pa('M59 8 Q68 15 64 28 Q59 34 55 33 Q62 22 59 8 Z', ST_D, NS) +
    ci(50, 20, 15) +
    ln('M35 16 Q39 4 50 5 Q61 4 65 16', 3) + ln('M37 12 L41 14 M43 8 L45 11 M57 8 L55 11 M63 12 L59 14', 3, MIN_D) +
    ln('M43 21 Q45 23 47 21 M53 21 Q55 23 57 21 M46 28 H53', 2.5) },

  fountain: { k: 'fix', f: () =>
    ground(50, 92, 44, 4) +
    pa('M6 62 V76 Q8 92 50 94 Q92 92 94 76 V62 Z', ST_D) + dt([76, 82, 82, 76, 70, 88, 86, 70]) +
    ln('M26 78 V90 M50 80 V94 M74 78 V90', 3) +
    el(50, 62, 44, 16, ST) + el(50, 63, 35, 10, LAG) +
    hl('M26 64 Q32 61 38 64 M62 67 Q68 64 74 67', LAG_L, 3) +
    rc(44, 30, 12, 34, 3, ST) + rc(51, 32, 4, 30, 0, ST_D, NS) +
    el(50, 31, 17, 6, ST) +
    ln('M47 9 Q30 7 22 46 M53 9 Q70 7 78 46', 9) + ln('M47 9 Q30 7 22 46 M53 9 Q70 7 78 46', 4, LAG_L) +
    pa('M45 30 Q40 14 50 4 Q60 14 55 30 Z', LAG_L) +
    ci(16, 52, 3, LAG_L, { sw: 2.5 }) + ci(84, 52, 3, LAG_L, { sw: 2.5 }) + ci(30, 26, 2.6, LAG_L, { sw: 2.5 }) + ci(70, 26, 2.6, LAG_L, { sw: 2.5 }) },

  piano: { k: 'row', f: (W) => {
    let s = ground(W / 2, 92, W / 2 - 8, 4) +
      rc(12, 68, 10, 24, 3, DK) + rc(W - 22, 68, 10, 24, 3, DK) +
      rc(10, 56, W - 20, 22, 5, DK) + rc(W / 2 - 9, 72, 6, 4, 1, SUN, { sw: 2 }) + rc(W / 2 + 3, 72, 6, 4, 1, SUN, { sw: 2 }) +
      rc(8, 10, W - 16, 40, 7, DK) + hl('M16 18 V36', DK_L, 4) +
      rc(W / 2 - 14, 15, 28, 21, 2, CREAM, { sw: 3 }) + ln(`M${W / 2 - 9} 21 H${W / 2 + 9} M${W / 2 - 9} 27 H${W / 2 + 9}`, 2) +
      ci(W / 2 - 4, 27, 2.4, INK, NS) + ci(W / 2 + 5, 21, 2.4, INK, NS) +
      rc(4, 5, W - 8, 10, 5, DK_L) +
      rc(5, 44, W - 10, 18, 4, WH);
    const kn = Math.round((W - 10) / 9), kw = (W - 10) / kn, pat = [1, 1, 0, 1, 1, 1, 0];
    let d = '';
    for (let i = 1; i < kn; i++) d += `M${n(5 + i * kw)} 46 V60`;
    s += ln(d, 2);
    for (let i = 1; i < kn; i++) if (pat[(i - 1) % 7]) s += rc(5 + i * kw - 3, 44, 6, 11, 1.5, INK, NS);
    return s + rc(5, 44, W - 10, 18, 4);
  } },

  stove: { k: 'fix', f: () =>
    ground(50, 92, 34, 4) +
    rc(44, 4, 12, 28, 2, DK) + hl('M47 8 V24', DK_L, 3) + rc(40, 22, 20, 7, 3, DK) +
    rc(24, 78, 8, 14, 2, DK) + rc(68, 78, 8, 14, 2, DK) +
    rc(18, 30, 64, 52, 12, DK_L) + rc(66, 34, 12, 44, 6, DK, NS) + dt([70, 44, 74, 56, 70, 68]) + rc(18, 30, 64, 52, 12) +
    rc(13, 28, 74, 10, 4, DK) + hl('M24 44 V62', '#8E93CC', 4) +
    ci(48, 60, 17, INK) + flame(48, 72, 0.85) + rc(36, 71, 24, 6, 3, WD_D, { sw: 2.5 }) + ci(48, 60, 17) +
    ln('M70 50 V64', 4, SUN) },

  fireplace: { k: 'fix', f: () =>
    ground(50, 93, 46, 3) +
    rc(8, 20, 84, 70, 5, COR) + rc(76, 24, 14, 64, 0, COR_D, NS) + dt([80, 70, 86, 78, 80, 84]) +
    ln('M8 36 H26 M74 36 H92 M8 52 H26 M74 52 H92 M8 68 H26 M74 68 H92 M17 20 V36 M83 20 V36 M17 52 V68 M83 52 V68 M26 32 H74 M40 20 V32 M60 20 V32', 3) +
    rc(8, 20, 84, 70, 5) +
    pa('M26 90 V58 Q26 42 50 42 Q74 42 74 58 V90 Z', INK) +
    flame(50, 82, 1.15) + rc(32, 79, 36, 8, 4, WD_D, { sw: 2.5 }) +
    rc(13, 85, 74, 8, 3, ST) +
    rc(3, 13, 94, 11, 5, WD) + hl('M10 17 H40', WD_L, 4) +
    rc(18, 3, 6, 10, 2, CREAM, { sw: 2.5 }) + rc(74, 4, 12, 9, 3, LAG, { sw: 2.5 }) },

  lamp: { k: 'fix', f: () =>
    ground(50, 91, 24, 4) +
    pa('M22 48 H78 L90 80 H10 Z', SUN_L, { s: 'none', op: 0.75 }) +
    el(50, 87, 20, 6, LIL_D) + rc(46.5, 44, 7, 42, 2, LIL_D, { sw: 3 }) +
    pa('M32 10 H68 L82 46 H18 Z', SUN, NS) + pa('M60 10 H68 L82 46 H70 Z', SUN_D, NS) + dt([70, 22, 74, 32, 72, 40]) +
    pa('M32 10 H68 L82 46 H18 Z') + hl('M34 16 L26 38', SUN_L, 4.5) +
    rc(15, 42, 70, 8, 4, SUN_D) + ci(50, 8, 4, LIL_D, { sw: 3 }) +
    ln('M66 50 V62', 2.5) + ci(66, 65, 3, LIL_D, { sw: 2.5 }) },

  telescope: { k: 'fix', f: () =>
    ground(50, 92, 32, 4) +
    ln('M50 56 L24 90 M50 56 L76 90 M50 56 L51 93', 9) + ln('M50 56 L24 90 M50 56 L76 90 M50 56 L51 93', 4, WD) +
    g('rotate(-32 50 50)',
      rc(4, 44, 12, 12, 2, DK) +
      rc(14, 40, 64, 20, 7, SKY) + rc(14, 51, 64, 9, 4, SKY_D, NS) + rc(14, 40, 64, 20, 7) +
      hl('M24 45 H44', SKY_L, 4) +
      rc(30, 38, 6, 24, 2, SUN, { sw: 3 }) + rc(56, 38, 6, 24, 2, SUN, { sw: 3 }) +
      rc(76, 35, 14, 30, 5, SKY_D) + el(90, 50, 4, 12, SKY_L, { sw: 3 })) +
    ci(50, 56, 6, DK, { sw: 3 }) +
    pa('M18 6 Q20 14 28 16 Q20 18 18 26 Q16 18 8 16 Q16 14 18 6 Z', SUN, { sw: 3 }) },

  aquarium: { k: 'row', f: (W) => {
    let s = ground(W / 2, 92, W / 2 - 6, 4) +
      rc(10, 72, W - 20, 20, 4, WD) + rc(10, 82, W - 20, 10, 4, WD_D) + dz(14, 82, W - 28, 9, 7) +
      rc(6, 12, W - 12, 64, 7, LAG) + rc(10, 15, W - 20, 6, 2, LAG_L, NS) +
      pa(`M8 64 Q${W * 0.25} 58 ${W * 0.5} 64 T${W - 8} 64 V73 H8 Z`, SUN, { sw: 3 }) +
      ln('M20 66 Q14 56 20 46 Q26 36 20 28', 9) + ln('M20 66 Q14 56 20 46 Q26 36 20 28', 4.5, APP);
    const fish = (x, y, c, f) => {
      const q = f ? -1 : 1;
      return pa(`M${x - 9 * q} ${y} L${x - 18 * q} ${y - 7} V${y + 7} Z`, c, { sw: 3 }) + el(x, y, 11, 8, c, { sw: 3 }) +
        ci(x + 5 * q, y - 2, 2, INK, NS) + ln(`M${x - 2 * q} ${y - 6} Q${x + 1 * q} ${y} ${x - 2 * q} ${y + 6}`, 2);
    };
    const nf = Math.max(2, Math.round(W / 50));
    for (let i = 0; i < nf; i++) {
      const x = W * (i + 0.5) / nf + (i % 2 ? -4 : 8), y = i % 2 ? 50 : 34;
      s += fish(x, y, [MAN, SUN, ROS][i % 3], i % 2);
    }
    s += ci(W - 22, 30, 3, null, { s: WH, sw: 2.2 }) + ci(W - 17, 22, 2.2, null, { s: WH, sw: 2 }) +
      hl(`M14 30 L22 24`, WH, 3.5) + rc(6, 12, W - 12, 64, 7) + rc(3, 7, W - 6, 10, 4, LIL_D);
    return s;
  } },

  well: { k: 'fix', f: () =>
    ground(50, 93, 42, 3) +
    rc(14, 20, 8, 46, 2, WD_D) + rc(78, 20, 8, 46, 2, WD_D) +
    rc(10, 30, 80, 7, 3, WD) + ln('M90 33 H95 V41', 3.5) +
    ln('M50 37 V43', 3) +
    pa('M12 62 V82 Q50 100 88 82 V62 Z', ST_D) + dt([74, 80, 80, 74, 68, 88]) +
    ln('M24 70 V84 M42 72 V90 M60 72 V90 M78 70 V84 M12 76 Q50 90 88 76', 3) +
    el(50, 62, 38, 12, ST) + el(50, 63, 28, 7, INK) +
    pa('M41 43 H59 L56 57 H44 Z', WD) + ln('M42 48 H58', 2.5) + ln('M41 43 Q50 34 59 43', 2.5) +
    pa('M6 26 L50 4 L94 26 Z', COR) + pa('M50 4 L94 26 H70 Z', COR_D, NS) + pa('M6 26 L50 4 L94 26 Z') +
    ln('M26 18 L34 22 M44 12 L50 18 M58 14 L62 20', 2.5) +
    rc(3, 23, 94, 8, 4, COR_D) },

  // ============================================================ occupables
  chair: { k: 'fix', f: () =>
    ground(50, 93, 32, 3) +
    rc(22, 72, 9, 20, 3, MIN_D) + rc(69, 72, 9, 20, 3, MIN_D) +
    rc(16, 62, 68, 16, 7, MIN_D) + dz(20, 66, 60, 11, 7) +
    rc(16, 40, 68, 30, 9, MIN) + hl('M26 50 H46', MIN_L, 5) +
    rc(24, 22, 8, 22, 3, MIN_D, { sw: 3 }) + rc(68, 22, 8, 22, 3, MIN_D, { sw: 3 }) +
    rc(39, 24, 7, 18, 2, MIN_D, { sw: 3 }) + rc(54, 24, 7, 18, 2, MIN_D, { sw: 3 }) +
    rc(15, 6, 70, 22, 10, MIN) + hl('M26 13 H52', MIN_L, 4.5) },

  armchair: { k: 'fix', f: () =>
    ground(50, 93, 44, 3) +
    rc(14, 82, 9, 10, 3, MAN_D) + rc(77, 82, 9, 10, 3, MAN_D) +
    rc(14, 5, 72, 54, 22, MAN) + hl('M26 16 Q32 10 44 10', MAN_L, 5) +
    ci(36, 24, 2.6, MAN_D, NS) + ci(50, 20, 2.6, MAN_D, NS) + ci(64, 24, 2.6, MAN_D, NS) +
    rc(22, 44, 56, 32, 10, MAN_L) +
    rc(18, 68, 64, 18, 7, MAN_D) + dz(22, 72, 56, 12, 7) +
    rc(5, 30, 23, 56, 11, MAN) + rc(72, 30, 23, 56, 11, MAN) +
    hl('M11 38 V56', MAN_L, 4.5) + hl('M78 38 V56', MAN_L, 4.5) +
    ln('M5 70 H28 M72 70 H95', 3) },

  sofa: { k: 'rot', o: 'h', f: (W, H) => {
    const nc = Math.max(1, Math.round((W - 56) / 70)), cw = (W - 56) / nc;
    let s = ground(W / 2, H - 7, W / 2 - 6, 3) +
      rc(16, H - 18, 9, 10, 3, LAG_D) + rc(W - 25, H - 18, 9, 10, 3, LAG_D) +
      rc(10, 6, W - 20, H - 52, 18, LAG) + hl(`M24 16 H${Math.min(W * 0.4, 70)}`, LAG_L, 5);
    for (let i = 0; i < nc; i++) s += ci(28 + (i + 0.5) * cw, 26, 2.6, LAG_D, NS) + rc(28 + i * cw, 40, cw, H - 66, 9, LAG_L);
    return s + rc(14, H - 32, W - 28, 18, 7, LAG_D) + dz(18, H - 28, W - 36, 12, 7) +
      rc(5, 28, 24, H - 42, 11, LAG) + rc(W - 29, 28, 24, H - 42, 11, LAG) +
      hl(`M11 36 V${H - 46}`, LAG_L, 4.5) + hl(`M${W - 23} 36 V${H - 46}`, LAG_L, 4.5);
  } },

  stool: { k: 'fix', f: () =>
    ground(50, 93, 36, 3) +
    ln('M30 46 L15 91 M70 46 L85 91 M50 50 L50 93', 10) + ln('M30 46 L15 91 M70 46 L85 91 M50 50 L50 93', 5, WD) +
    el(50, 74, 28, 6, null, { sw: 9 }) + el(50, 74, 28, 6, null, { s: WD, sw: 4 }) +
    el(50, 42, 42, 15, SUN_D) + dt([24, 48, 76, 48, 32, 52, 68, 52]) +
    el(50, 35, 42, 15, SUN) + hl('M18 32 Q24 24 40 22', SUN_L, 5) + ci(50, 35, 3, SUN_D, NS) },

  bench: { k: 'rot', o: 'h', f: (W, H) =>
    ground(W / 2, H - 7, W / 2 - 6, 3) +
    rc(24, H - 24, 11, 16, 4, COR_D) + rc(W - 35, H - 24, 11, 16, 4, COR_D) +
    rc(8, H - 34, W - 16, 18, 8, COR_D) + dz(12, H - 26, W - 24, 9, 7) +
    rc(8, 32, W - 16, H - 58, 10, COR) +
    ln(`M12 46 H${W - 12} M12 60 H${W - 12}`, 3) + hl(`M20 39 H${Math.min(W * 0.35, 80)}`, COR_L, 4.5) +
    rc(26, 20, 10, 16, 3, COR_D, { sw: 3 }) + rc(W - 36, 20, 10, 16, 3, COR_D, { sw: 3 }) +
    rc(12, 6, W - 24, 20, 9, COR) + hl(`M22 12 H${Math.min(W * 0.35, 80)}`, COR_L, 4) },

  bed: { k: 'rot', o: 'v', f: (W, H) => {
    const bt = H <= 100 ? 50 : Math.round(H * 0.42);
    let s = ground(W / 2, H - 7, W / 2 - 8, 3) +
      rc(10, H - 22, W - 20, 14, 5, WD_D) +
      rc(12, 16, W - 24, H - 32, 10, CREAM) +
      rc(22, 24, W - 44, 22, 10, WH) + ln(`M30 35 Q${W / 2} 31 ${W - 30} 35`, 2.5, ST_D) +
      rc(12, bt, W - 24, H - bt - 16, 10, LIL) + rc(12, H - 30, W - 24, 14, 7, LIL_D, NS) + rc(12, bt, W - 24, H - bt - 16, 10) +
      rc(12, bt, W - 24, 11, 5, LIL_L);
    const p = [];
    for (let y = bt + 20; y < H - 24; y += 14) for (let x = 22 + ((y - bt) % 28 ? 9 : 0); x < W - 18; x += 18) p.push(x, y);
    for (let i = 0; i < p.length; i += 2) s += ci(p[i], p[i + 1], 3.2, LIL_L, NS);
    return s + rc(8, 6, W - 16, 18, 8, WD) + hl(`M16 12 H${W / 2}`, WD_L, 4) + ci(14, 15, 3, WD_D, NS) + ci(W - 14, 15, 3, WD_D, NS);
  } },

  deckchair: { k: 'fix', f: () => {
    const tl = 26, tr = 74, bl = 18, br = 82, ty = 10, by = 86, N = 7;
    let s = ground(50, 92, 40, 3) +
      ln('M22 6 L12 94 M78 6 L88 94', 9) + ln('M22 6 L12 94 M78 6 L88 94', 4.5, WD);
    for (let i = 0; i < N; i++) {
      const a = i / N, b = (i + 1) / N;
      s += pa(`M${n(tl + (tr - tl) * a)} ${ty} H${n(tl + (tr - tl) * b)} L${n(bl + (br - bl) * b)} ${by} H${n(bl + (br - bl) * a)} Z`, i % 2 ? CREAM : SKY, NS);
    }
    return s + pa(`M${tl} ${ty} H${tr} L${br} ${by} H${bl} Z`) +
      ln('M33 10 L28 86 M67 10 L72 86', 2) +
      rc(22, 6, 56, 9, 4, WD) +
      rc(3, 46, 20, 9, 4, WD) + rc(77, 46, 20, 9, 4, WD) +
      rc(12, 84, 76, 8, 4, WD);
  } },

  hammock: { k: 'fix', f: () => {
    const body = 'M24 38 Q50 52 76 38 L78 56 Q50 122 22 56 Z';
    return ground(50, 93, 44, 3) +
      rc(4, 10, 10, 82, 4, WD_D) + rc(86, 10, 10, 82, 4, WD_D) + hl('M8 16 V40', WD, 3) + hl('M90 16 V40', WD, 3) +
      ln('M13 22 L24 38 M13 22 L23 47 M13 22 L22 56 M87 22 L76 38 M87 22 L77 47 M87 22 L78 56', 3) +
      pa(body, SUN) +
      pa('M23 47 Q50 70 77 47 L77.6 52 Q50 92 22.4 52 Z', COR, NS) +
      pa('M22.2 56 Q50 108 77.8 56', null, { s: COR, sw: 6 }) +
      pa(body) + ln('M30 58 Q50 80 70 58', 2, '#B0662B') +
      rc(20, 34, 6, 26, 3, WD, { sw: 3 }) + rc(74, 34, 6, 26, 3, WD, { sw: 3 }) +
      ci(13, 22, 4, SUN, { sw: 3 }) + ci(87, 22, 4, SUN, { sw: 3 });
  } },

  rug: { k: 'free', f: (W, H) => {
    const hz = W >= H;
    let s = '', fr = '';
    if (hz) for (let y = 20; y <= H - 20; y += 7) fr += `M10 ${y} H3 M${W - 10} ${y} H${W - 3}`;
    else for (let x = 20; x <= W - 20; x += 7) fr += `M${x} 10 V3 M${x} ${H - 10} V${H - 3}`;
    const x0 = hz ? 10 : 12, y0 = hz ? 12 : 10;
    s += ln(fr, 3) + rc(x0, y0 + 4, W - 2 * x0, H - 2 * y0, 6, ROS_D) + rc(x0, y0, W - 2 * x0, H - 2 * y0, 6, ROS) +
      rc(x0 + 7, y0 + 7, W - 2 * x0 - 14, H - 2 * y0 - 14, 4, SUN, { sw: 3 }) +
      rc(x0 + 14, y0 + 14, W - 2 * x0 - 28, H - 2 * y0 - 28, 3, ROS, { sw: 3 });
    for (let y = 50; y < H; y += 100) for (let x = 50; x < W; x += 100) {
      s += pa(`M${x} ${y - 16} L${x + 16} ${y} L${x} ${y + 16} L${x - 16} ${y} Z`, LIL, { sw: 3 }) + ci(x, y, 4.5, SUN, { sw: 2.5 });
    }
    const cs = [[x0 + 7, y0 + 7], [W - x0 - 7, y0 + 7], [x0 + 7, H - y0 - 7], [W - x0 - 7, H - y0 - 7]];
    for (const [x, y] of cs) s += ci(x, y, 4, LAG, { sw: 2.5 });
    return s;
  } },

  bathtub: { k: 'rot', o: 'h', f: (W, H) =>
    ground(W / 2, H - 7, W / 2 - 10, 3) +
    rc(18, H - 22, 10, 13, 4, SUN) + rc(W - 28, H - 22, 10, 13, 4, SUN) +
    rc(6, 20, W - 12, H - 32, 28, '#C9C6DA') + dz(30, H - 22, W - 60, 8, 7) +
    rc(6, 10, W - 12, H - 30, 28, WH) +
    rc(17, 21, W - 34, H - 52, 19, LAG) + hl(`M30 34 Q36 30 42 34 M${W - 52} ${H - 40} Q${W - 46} ${H - 44} ${W - 40} ${H - 40}`, LAG_L, 3) +
    ci(W - 30, 30, 6, WH, { sw: 2.5 }) + ci(W - 22, 38, 5, WH, { sw: 2.5 }) + ci(W - 36, 38, 4, WH, { sw: 2.5 }) +
    rc(2, H / 2 - 18, 16, 14, 4, ST_D) + ln(`M16 ${H / 2 - 11} H24`, 6) + ln(`M16 ${H / 2 - 11} H23`, 2.5, ST) +
    ci(10, H / 2 - 26, 4.5, COR, { sw: 2.5 }) + ci(10, H / 2 + 2, 4.5, SKY, { sw: 2.5 }) +
    el(W - 22, H - 28, 8, 5.5, SUN, { sw: 2.5 }) + ci(W - 17, H - 35, 4.5, SUN, { sw: 2.5 }) +
    pa(`M${W - 13} ${H - 36} L${W - 8} ${H - 34} L${W - 13} ${H - 32} Z`, MAN, { sw: 2 }) },

  boat: { k: 'rot', o: 'h', f: (W, H) => {
    const c = W > 150 ? W / 2 - 14 : 50;
    const oar = (s) => {
      const y1 = s > 0 ? 44 : H - 44, y2 = s > 0 ? 9 : H - 9, x2 = c - 18;
      return ln(`M${c + 6} ${y1} L${x2} ${y2}`, 8) + ln(`M${c + 6} ${y1} L${x2} ${y2}`, 3.5, WD) +
        el(x2 - 1, y2 + (s > 0 ? -1 : 1), 5, 9, WD, { sw: 3, t: `rotate(${s > 0 ? -35 : 35} ${x2 - 1} ${y2})` });
    };
    return ln(`M4 ${H - 12} Q10 ${H - 16} 16 ${H - 12} M${W - 22} 14 Q${W - 16} 10 ${W - 10} 14`, 3, LAG) +
      pa(`M12 26 H${W - 42} Q${W - 14} 28 ${W - 6} 50 Q${W - 14} 72 ${W - 42} 74 H12 Q5 50 12 26 Z`, COR) +
      pa(`M19 33 H${W - 42} Q${W - 22} 35 ${W - 16} 50 Q${W - 22} 65 ${W - 42} 67 H19 Q14 50 19 33 Z`, WD, { sw: 3 }) +
      ln(`M20 50 H${W - 18}`, 2.5, WD_D) +
      rc(24, 33, 9, 34, 2, WD_D, { sw: 3 }) + rc(W - 52, 33, 9, 34, 2, WD_D, { sw: 3 }) +
      hl(`M18 30 H${W * 0.35}`, COR_L, 3) +
      oar(1) + oar(-1);
  } },

  car: { k: 'rot', o: 'h', f: (W, H) => {
    const f1 = W * 0.16, f2 = W * 0.84 - 26, r = W * 0.62, b = W * 0.26;
    return ground(W / 2, H - 6, W / 2 - 6, 3) +
      rc(f1, 8, 26, 14, 5, INK) + rc(f2, 8, 26, 14, 5, INK) + rc(f1, H - 22, 26, 14, 5, INK) + rc(f2, H - 22, 26, 14, 5, INK) +
      el(r - 4, 14, 6, 4, SKY, { sw: 3 }) + el(r - 4, H - 14, 6, 4, SKY, { sw: 3 }) +
      rc(6, 16, W - 12, H - 32, 26, SKY) + rc(10, H - 30, W - 20, 10, 5, SKY_D, NS) + rc(6, 16, W - 12, H - 32, 26) +
      pa(`M${r} 24 Q${r + W * 0.08} 26 ${r + W * 0.11} 34 V${H - 34} Q${r + W * 0.08} ${H - 26} ${r} ${H - 24} Z`, SKY_D) +
      pa(`M${b} 26 Q${b - W * 0.07} 28 ${b - W * 0.08} 36 V${H - 36} Q${b - W * 0.07} ${H - 28} ${b} ${H - 26} Z`, SKY_D) +
      hl(`M${r + W * 0.03} 32 L${r + W * 0.06} 42`, SKY_L, 3) +
      rc(b + 4, 26, r - b - 8, H - 52, 10, SKY_L, { sw: 3 }) +
      ln(`M${r + W * 0.14} 30 Q${W - 18} 50 ${r + W * 0.14} ${H - 30}`, 2.5) +
      el(W - 10, 30, 4, 6, SUN, { sw: 3 }) + el(W - 10, H - 30, 4, 6, SUN, { sw: 3 }) +
      rc(5, 26, 7, 12, 3, COR, { sw: 3 }) + rc(5, H - 38, 7, 12, 3, COR, { sw: 3 });
  } },

  tent: { k: 'fix', f: () =>
    ground(50, 92, 46, 3) +
    ln('M46 18 L4 90 M94 76 L97 88', 2.5) + ci(4, 90, 2.5, INK, NS) +
    pa('M46 18 L94 76 L82 88 Z', MAN_D) + dt([80, 72, 86, 78, 74, 64]) +
    pa('M46 18 L82 88 H8 Z', MAN) + hl('M40 30 L20 70', MAN_L, 4.5) +
    pa('M46 36 L62 88 H30 Z', INK) + pa('M46 36 L30 88 H23 Z', MAN_L, { sw: 3 }) +
    ln('M46 18 V5', 3) + pa('M46 5 L60 9 L46 13 Z', COR, { sw: 3 }) +
    rc(4, 86, 92, 6, 3, MAN_D, { sw: 3 }) },

  stage: { k: 'free', f: (W, H) => {
    let s = rc(6, H - 30, W - 12, 22, 5, COR_D) + dz(10, H - 18, W - 20, 9, 8) +
      rc(6, 12, W - 12, H - 36, 8, WD);
    let d = '';
    for (let y = 36, r = 0; y < H - 30; y += 13, r++) {
      d += `M8 ${y} H${W - 8}`;
      for (let x = 30 + (r % 2) * 26; x < W - 14; x += 52) d += `M${x} ${y} V${y + 13 > H - 30 ? H - 30 : y + 13}`;
    }
    s += ln(d, 2.5, WD_D) + rc(6, 12, W - 12, H - 36, 8) + hl(`M14 ${H - 36} H${Math.min(W * 0.4, 90)}`, WD_L, 3.5);
    for (let x = 18; x <= W - 18; x += Math.max(20, (W - 36) / Math.max(1, Math.round((W - 36) / 22)))) s += ci(x, H - 30, 4.5, SUN, { sw: 2.5 });
    let sc = `M5 20`;
    const nsc = Math.max(3, Math.round((W - 10) / 16)), sw = (W - 10) / nsc;
    for (let i = 0; i < nsc; i++) sc += ` Q${n(5 + (i + 0.5) * sw)} ${32} ${n(5 + (i + 1) * sw)} 20`;
    s += rc(4, 4, W - 8, 20, 6, COR) + pa(sc + ` V14 H5 Z`, COR, { sw: 3 });
    let f = '';
    for (let x = 16; x < W - 10; x += 12) f += `M${x} 7 V16`;
    return s + ln(f, 2.5, COR_D) + hl(`M12 9 H${Math.min(W * 0.3, 60)}`, COR_L, 3) +
      ci(10, 24, 4, SUN, { sw: 2.5 }) + ci(W - 10, 24, 4, SUN, { sw: 2.5 });
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
    case 'row':
      if (W >= H) {
        let s = '';
        for (let y = 0; y < H; y += 100) s += y ? g(`translate(0 ${y})`, def.f(W)) : def.f(W);
        return s;
      }
      return cells(W, H, () => def.f(100));
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
