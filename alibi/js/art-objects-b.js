// Alibi — objets du lot B (lieux et aventures), style « Cartoon franc » : contours épais bleu nuit,
// aplats francs, une ombre découpée par forme, rehaut clair, trame de points. Module pur : aucun DOM.
// objectSVG(type, { w, h }) → <svg viewBox="0 0 w*100 h*100"> ; 100 unités par case, marge ≈ 8.
// Autonome : les petits outils de dessin sont recopiés de art-objects.js (même vocabulaire).

import { INK, CREAM } from './palette.js';

// ------------------------------------------------------------------ teintes (aplat / ombre / rehaut)
const COR = '#FF6B5E', COR_D = '#D9493F', COR_L = '#FFB2AA';
const SUN = '#FFC83D', SUN_D = '#E0A01C', SUN_L = '#FFE7A6';
const MIN = '#4FCFA3', MIN_D = '#2FA27C', MIN_L = '#B6F0DA';
const SKY = '#57B8FF', SKY_D = '#2F86CC', SKY_L = '#B5DEFF';
const LIL = '#B58CFF', LIL_D = '#8F63E0';
const ROS = '#FF8FC7', ROS_D = '#E0609F', ROS_L = '#FFD0E8';
const APP = '#A6D94A', APP_D = '#7BAF25', APP_L = '#DDF3A8';
const MAN = '#FF9F45', MAN_D = '#DB7A1F', MAN_L = '#FFD3A8';
const LAG = '#35C6D9', LAG_D = '#1A9DB0', LAG_L = '#A6EBF4';
const WD = '#F2A65A', WD_D = '#C97B32', WD_L = '#FFDDB0';
const ST = '#E9E2D6', ST_D = '#CFC6B8';
const GR = '#B9B0CC', GR_D = '#968BB0';
const DK = '#3B3F7A', DK_L = '#5A5F9E', DK_D = '#2A2D5C';
const WH = '#FFFFFF';
const CAC = '#5CC46E', CAC_D = '#38994C', CAC_L = '#BDEFC4';      // cactus
const CH = '#D97E3A', CH_D = '#AE5A1E', CH_L = '#F6B57C';          // bois du coffre
const BB = '#2F8A68', BB_D = '#236E52';                            // ardoise verte
const FELT = '#35B36B', FELT_D = '#23884F';                        // tapis de billard
const SN_D = '#CFE3F5';                                            // ombre de neige
const COC = '#9A5B2A';                                             // noix de coco

// ------------------------------------------------------------------ petits outils d'écriture SVG
const n = (v) => Math.round(v * 10) / 10;
const KEY = { sw: 'stroke-width', s: 'stroke', op: 'opacity', t: 'transform' };
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
const tube = (d, w, c) => ln(d, w + 8, INK) + ln(d, w, c);           // tige cernée (bois, corde, métal)
const g = (t, inner) => `<g transform="${t}">${inner}</g>`;
const ground = (cx, cy, rx, ry) => el(cx, cy, rx, ry, INK, { s: 'none', op: 0.13 });
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
// Flamme (grande jaune + petite corail) posée sur (x, y), hauteur ≈ 34·k.
function flame(x, y, k = 1, outline = false) {
  const P = (a, b) => `${n(x + a * k)} ${n(y + b * k)}`;
  const big = `M${P(-11, 0)} Q${P(-15, -14)} ${P(-5, -22)} Q${P(-5, -13)} ${P(0, -14)} Q${P(-2, -26)} ${P(6, -34)} Q${P(7, -20)} ${P(12, -12)} Q${P(16, -4)} ${P(10, 0)} Z`;
  const small = `M${P(-6, 0)} Q${P(-7, -8)} ${P(-1, -11)} Q${P(0, -6)} ${P(3, -7)} Q${P(3, -13)} ${P(7, -16)} Q${P(9, -7)} ${P(7, 0)} Z`;
  return pa(big, SUN, outline ? undefined : NS) + pa(small, COR, NS);
}
// Croissant d'ombre sur le côté droit d'un disque.
const crescent = (cx, cy, r, f, k = 0.55) => pa(`M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${n(r * k)} ${r} 0 0 0 ${cx} ${cy - r} Z`, f, NS);
// Palme : de la base (bx,by) à la pointe (tx,ty), soulevée de `lift`, demi-largeur w.
function frond(bx, by, tx, ty, lift, w, f, rib) {
  const mx = (bx + tx) / 2, my = (by + ty) / 2 - lift, L = Math.hypot(tx - bx, ty - by) || 1;
  const px = -(ty - by) / L * w, py = (tx - bx) / L * w;
  let s = pa(`M${bx} ${by} Q${n(mx + px)} ${n(my + py)} ${tx} ${ty} Q${n(mx - px)} ${n(my - py)} ${bx} ${by} Z`, f) +
    ln(`M${bx} ${by} Q${n(mx)} ${n(my)} ${n(bx + (tx - bx) * 0.85)} ${n(by + (ty - by) * 0.85 - lift * 0.3)}`, 2.5, rib);
  // folioles : petites encoches sur le bord
  for (const t of [0.35, 0.55, 0.75]) {
    const qx = (1 - t) * (1 - t) * bx + 2 * t * (1 - t) * (mx + px) + t * t * tx;
    const qy = (1 - t) * (1 - t) * by + 2 * t * (1 - t) * (my + py) + t * t * ty;
    const cx = (1 - t) * (1 - t) * bx + 2 * t * (1 - t) * mx + t * t * tx;
    const cy = (1 - t) * (1 - t) * by + 2 * t * (1 - t) * my + t * t * ty;
    s += ln(`M${n(qx)} ${n(qy)} L${n(cx + (qx - cx) * 0.35)} ${n(cy + (qy - cy) * 0.35)}`, 2.5);
  }
  return s;
}
// Petits chiffres à la craie (hauteur 12).
const GLY = {
  1: (x, y) => `M${x + 2} ${y + 3}L${x + 5} ${y}V${y + 12}`,
  2: (x, y) => `M${x} ${y + 3}Q${x + 4} ${y - 2} ${x + 8} ${y + 2}Q${x + 9} ${y + 6} ${x} ${y + 12}H${x + 9}`,
  3: (x, y) => `M${x} ${y}H${x + 8}L${x + 3} ${y + 5}Q${x + 10} ${y + 5} ${x + 8} ${y + 10}Q${x + 4} ${y + 14} ${x} ${y + 10}`,
  '+': (x, y) => `M${x} ${y + 6}H${x + 8}M${x + 4} ${y + 2}V${y + 10}`,
  '=': (x, y) => `M${x} ${y + 4}H${x + 8}M${x} ${y + 8}H${x + 8}`,
};

// ------------------------------------------------------------------ les dessins
// k : 'fix'  → dessin 100×100 (carré n×n : agrandi ; autre taille : répété par case)
//     'free' → f(W, H) gère toute taille
//     'rot'  → vue de dessus f(W, H) dans l'orientation canonique o ('h' large, 'v' haut), pivotée sinon

const DRAW = {
  // ============================================================ occupables
  throne: { k: 'fix', f: () => {
    const back = 'M18 62 V26 L27 14 L38 24 L50 11 L62 24 L73 14 L82 26 V62 Z';
    return ground(50, 93, 42, 3) +
      rc(18, 80, 9, 12, 3, SUN_D) + rc(73, 80, 9, 12, 3, SUN_D) +
      pa(back, SUN, NS) + pa('M70 18 L73 14 L82 26 V62 H70 Z', SUN_D, NS) + dt([75, 34, 78, 44, 75, 54]) + pa(back) +
      ci(27, 10, 4.5, SUN, { sw: 3 }) + ci(50, 7, 5, SUN, { sw: 3 }) + ci(73, 10, 4.5, SUN, { sw: 3 }) +
      pa('M27 60 V32 L38 36 L50 26 L62 36 L73 32 V60 Z', COR, { sw: 3 }) +
      pa('M60 34.5 L62 36 L73 32 V60 H60 Z', COR_D, NS) +
      pa('M50 33 L56 40 L50 47 L44 40 Z', LAG, { sw: 2.5 }) + hl('M48 37 L47 40', LAG_L, 2) +
      hl('M22 32 V50', SUN_L, 3.5) +
      rc(16, 58, 68, 14, 7, COR) + hl('M24 62 H44', COR_L, 4) +
      rc(14, 68, 72, 15, 5, SUN) + rc(14, 76, 72, 7, 4, SUN_D, NS) + rc(14, 68, 72, 15, 5) +
      ci(50, 75, 3.5, ROS, { sw: 2.5 }) +
      rc(5, 46, 20, 36, 8, SUN) + rc(75, 46, 20, 36, 8, SUN) + rc(86, 50, 7, 30, 3, SUN_D, NS) + rc(75, 46, 20, 36, 8) +
      ci(15, 52, 6, SUN_L, { sw: 3 }) + ci(85, 52, 6, SUN_L, { sw: 3 }) + ci(15, 52, 2, INK, NS) + ci(85, 52, 2, INK, NS);
  } },

  swing: { k: 'fix', f: () =>
    ground(50, 94, 44, 3) +
    tube('M16 10 L5 92 M16 10 L27 92 M84 10 L73 92 M84 10 L95 92', 5.5, COR) +
    hl('M14 22 L9 50', COR_L, 2.5) +
    rc(6, 4, 88, 11, 5.5, COR) + rc(6, 10, 88, 5, 2.5, COR_D, NS) + rc(6, 4, 88, 11, 5.5) + hl('M14 8 H36', COR_L, 3) +
    tube('M30 15 V78 M70 15 V78', 2.5, WD) +
    ci(30, 15, 3, GR, { sw: 2.5 }) + ci(70, 15, 3, GR, { sw: 2.5 }) +
    rc(18, 76, 64, 11, 5, SUN) + rc(18, 82, 64, 5, 2.5, SUN_D, NS) + rc(18, 76, 64, 11, 5) + hl('M24 79.5 H40', SUN_L, 3) },

  towel: { k: 'rot', o: 'v', f: (W, H) => {
    const x0 = 13, y0 = 11, w = W - 26, h = H - 22;
    let fr = '';
    for (let x = x0 + 5; x <= x0 + w - 4; x += 7) fr += `M${n(x)} ${y0} V${y0 - 7} M${n(x)} ${y0 + h} V${y0 + h + 7}`;
    const nb = Math.max(5, Math.round(h / 13) | 1), bh = h / nb, cols = [SKY, CREAM, COR, CREAM, SUN, CREAM];
    let s = ln(fr, 3) + rc(x0 + 3, y0 + 4, w, h, 5, LAG_D) + rc(x0, y0, w, h, 5, CREAM, NS);
    let d = '';
    for (let i = 0; i < nb; i++) {
      const c = cols[i % cols.length];
      if (c !== CREAM) s += rc(x0, y0 + i * bh, w, bh, 0, c, NS);
      if (i) d += `M${x0} ${n(y0 + i * bh)} H${x0 + w}`;
    }
    return s + ln(d, 2) + hl(`M${x0 + 6} ${n(y0 + bh * 0.5)} H${x0 + 6 + Math.min(18, w / 4)}`, SKY_L, 3) +
      rc(x0, y0, w, h, 5);
  } },

  parasol: { k: 'fix', f: () => {
    const hem = 'Q15.5 60 27 50';
    return ground(50, 92, 24, 4) +
      el(50, 89, 16, 5, SUN_L, { sw: 3 }) +
      rc(46.5, 44, 7, 46, 3, WH) + ln('M46.5 60 H53.5 M46.5 74 H53.5', 2.5, COR) +
      pa(`M50 6 Q8 12 4 50 ${hem} Q28 14 50 6 Z`, COR, { sw: 3 }) +
      pa('M50 6 Q28 14 27 50 Q38.5 60 50 50 Z', CREAM, { sw: 3 }) +
      pa('M50 6 L50 50 Q61.5 60 73 50 Q72 14 50 6 Z', COR, { sw: 3 }) +
      pa('M50 6 Q72 14 73 50 Q84.5 60 96 50 Q92 12 50 6 Z', '#F3DDBF', { sw: 3 }) + dt([80, 36, 86, 44, 78, 46]) +
      pa('M50 6 Q8 12 4 50 Q15.5 60 27 50 Q38.5 60 50 50 Q61.5 60 73 50 Q84.5 60 96 50 Q92 12 50 6 Z') +
      hl('M14 36 Q18 22 32 15', COR_L, 4) + ci(50, 6, 4, SUN, { sw: 3 });
  } },

  horse: { k: 'fix', f: () =>
    ground(50, 93, 40, 3) +
    tube('M22 44 Q8 48 11 76', 7, DK) + hl('M15 52 Q12 60 13 68', DK_L, 2.5) +
    rc(24, 60, 8, 28, 3, WD_D) + rc(56, 60, 8, 28, 3, WD_D) + rc(23, 85, 10, 7, 2, DK, { sw: 3 }) + rc(55, 85, 10, 7, 2, DK, { sw: 3 }) +
    pa('M60 46 Q62 26 70 14 L84 20 Q76 34 76 52 Z', WD) +
    pa('M20 52 Q18 38 34 37 H62 Q77 37 77 51 Q77 66 60 66 H34 Q20 66 20 52 Z', WD, NS) +
    pa('M21 56 Q34 62 60 60 Q72 59 77 52 Q77 66 60 66 H34 Q22 66 21 56 Z', WD_D, NS) + dt([40, 63, 48, 63, 56, 63]) +
    pa('M20 52 Q18 38 34 37 H62 Q77 37 77 51 Q77 66 60 66 H34 Q20 66 20 52 Z') +
    rc(33, 60, 9, 30, 3, WD) + rc(65, 60, 9, 30, 3, WD) + rc(32, 85, 11, 7, 2, DK, { sw: 3 }) + rc(64, 85, 11, 7, 2, DK, { sw: 3 }) +
    pa('M72 12 L73 2 L79 9 Z', WD, { sw: 3 }) +
    pa('M70 18 Q73 8 83 9 Q90 11 96 28 Q98 37 90 38 Q84 38 80 32 L74 29 Z', WD) +
    el(91, 32, 6, 5, WD_L, { sw: 3 }) + ci(93, 31, 1.6, INK, NS) + ci(81, 18, 2.6, INK, NS) + ci(82, 17, 0.9, WH, NS) +
    pa('M71 7 Q62 14 61 26 Q57 34 56 44 L63 41 Q65 32 69 27 Q69 20 76 13 Z', DK, { sw: 3 }) +
    pa('M38 37 Q48 44 58 37 L60 47 Q48 53 36 47 Z', COR, { sw: 3 }) + rc(44, 50, 8, 4, 2, SUN, { sw: 2.5 }) +
    hl('M26 43 Q31 39 38 40', WD_L, 4) },

  cushion: { k: 'fix', f: () => {
    const P = (dy) => `M10 ${12 + dy} Q50 ${20 + dy} 90 ${12 + dy} Q83 ${46 + dy} 90 ${80 + dy} Q50 ${73 + dy} 10 ${80 + dy} Q17 ${46 + dy} 10 ${12 + dy} Z`;
    const tas = (x, y) => ln(`M${x - 4} ${y + 3} L${x - 7} ${y + 9} M${x} ${y + 4} V${y + 11} M${x + 4} ${y + 3} L${x + 7} ${y + 9}`, 2.5) +
      ci(x, y, 6, SUN, { sw: 3 }) + ci(x - 2, y - 2, 1.6, SUN_L, NS);
    return ground(50, 92, 44, 4) +
      pa(P(8), ROS_D) + dt([30, 86, 50, 85, 70, 86, 40, 87.5, 60, 87.5]) +
      pa(P(0), ROS) +
      ln('M50 46 L30 26 M50 46 L70 26 M50 46 L30 66 M50 46 L70 66', 2.5, ROS_D) +
      ci(50, 46, 4.5, ROS_D, { sw: 2.5 }) +
      ln('M20 22 Q50 29 80 22 Q74 46 80 70 Q50 64 20 70 Q26 46 20 22 Z', 2, ROS_D) +
      hl('M20 19 Q32 23 44 23', ROS_L, 4) +
      tas(10, 12) + tas(90, 12) + tas(10, 80) + tas(90, 80);
  } },

  // ============================================================ bloquants
  cactus: { k: 'fix', f: () =>
    ground(50, 92, 36, 4) +
    tube('M40 62 H29 Q21 62 21 54 V34', 13, CAC) + tube('M60 50 H71 Q79 50 79 42 V22', 13, CAC) +
    ln('M21 52 V36 M79 40 V24', 2.5, CAC_D) +
    rc(37, 12, 26, 82, 13, CAC, NS) + rc(53, 16, 9, 74, 4.5, CAC_D, NS) + dt([57, 40, 57, 56, 57, 72]) + rc(37, 12, 26, 82, 13) +
    ln('M45 20 V86', 2.5, CAC_D) + hl('M41.5 24 V40', CAC_L, 3) +
    ln('M37 30 l-5 -2 M37 48 l-5 -2 M37 74 l-5 -2 M63 36 l5 -2 M63 64 l5 -2 M16 42 l-5 -2 M84 30 l5 -2 M26 66 l-1 5 M70 54 l1 5', 2.5) +
    ci(50, 10, 6, ROS, { sw: 3 }) + ci(50, 10, 2.3, SUN, NS) + ci(21, 31, 3.5, ROS, { sw: 2.5 }) +
    pa('M14 94 Q24 82 40 84 Q50 78 60 84 Q76 82 86 94 Z', SUN_L) + ci(30, 89, 2, SUN_D, NS) + ci(70, 90, 2, SUN_D, NS) },

  campfire: { k: 'fix', f: () => {
    const st = (a) => {
      const x = 50 + Math.cos(a) * 42, y = 78 + Math.sin(a) * 13;
      return el(x, y, 8, 5.5, GR, { sw: 3 }) + pa(`M${n(x - 1)} ${n(y + 5)} Q${n(x + 7)} ${n(y + 4)} ${n(x + 8)} ${n(y)}`, null, { s: GR_D, sw: 2.5 });
    };
    let back = '', front = '';
    for (let i = 0; i < 10; i++) {
      const a = (i + 0.5) / 10 * Math.PI * 2;
      if (Math.sin(a) < 0) back += st(a); else front += st(a);
    }
    return ground(50, 84, 46, 10) + back +
      el(50, 78, 30, 8, MAN, NS) +
      tube('M24 66 L76 86 M76 66 L24 86', 10, WD_D) + hl('M30 69 L46 75 M70 69 L54 75', WD, 3) +
      el(76, 86, 5.5, 6, WD_L, { sw: 3 }) + el(24, 86, 5.5, 6, WD_L, { sw: 3 }) +
      ci(76, 86, 1.6, WD_D, NS) + ci(24, 86, 1.6, WD_D, NS) +
      flame(50, 80, 1.9, true) +
      front +
      ci(22, 24, 2.6, SUN, { sw: 2 }) + ci(80, 30, 2.2, SUN, { sw: 2 }) + ci(28, 10, 1.8, MAN, { sw: 2 });
  } },

  palm: { k: 'fix', f: () => {
    // tronc courbe et annelé : de (40,92) à (55,30), contrôle (30,58)
    const B = (t) => [(1 - t) * (1 - t) * 40 + 2 * t * (1 - t) * 30 + t * t * 55, (1 - t) * (1 - t) * 92 + 2 * t * (1 - t) * 58 + t * t * 30];
    const N = (t) => { const dx = 2 * (1 - t) * (30 - 40) + 2 * t * (55 - 30), dy = 2 * (1 - t) * (58 - 92) + 2 * t * (30 - 58), L = Math.hypot(dx, dy); return [-dy / L, dx / L]; };
    const L = [], R = [], M = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, [x, y] = B(t), [nx, ny] = N(t), hw = 9 - 3 * t;
      L.push(`${n(x - nx * hw)} ${n(y - ny * hw)}`); R.push(`${n(x + nx * hw)} ${n(y + ny * hw)}`); M.push(`${n(x + nx * hw * 0.2)} ${n(y + ny * hw * 0.2)}`);
    }
    const trunk = `M${L.join(' L')} L${R.reverse().join(' L')} Z`;
    let rings = '';
    for (let i = 1; i < 8; i++) {
      const t = i / 8.5, [x, y] = B(t), [nx, ny] = N(t), hw = 9 - 3 * t;
      rings += `M${n(x - nx * hw)} ${n(y - ny * hw)} Q${n(x + 3)} ${n(y + 4)} ${n(x + nx * hw)} ${n(y + ny * hw)}`;
    }
    return ground(50, 93, 30, 4) +
      frond(55, 28, 14, 14, 12, 8, MIN_D, INK) + frond(55, 28, 88, 10, 12, 8, MIN_D, INK) +
      pa(trunk, WD, NS) + pa(`M${M.join(' L')} L${R.join(' L')} Z`, WD_D, NS) + ln(rings, 3, WD_D) + pa(trunk) + ln(rings, 2.5) +
      ci(48, 36, 6, COC, { sw: 3 }) + ci(60, 37, 6, COC, { sw: 3 }) + ci(54, 43, 6, COC, { sw: 3 }) + hl('M46 34 L47 33', '#C98A55', 2.5) +
      frond(55, 28, 6, 46, 20, 8, MIN, MIN_D) + frond(55, 28, 95, 46, 20, 8, MIN, MIN_D) +
      frond(55, 28, 36, 4, 6, 7, MIN, MIN_D) + frond(55, 28, 70, 4, 4, 7, MIN, MIN_D) +
      ci(55, 27, 4, MIN_D, { sw: 3 }) +
      pa('M18 94 Q30 82 44 86 Q58 82 70 94 Z', SUN_L);
  } },

  chest: { k: 'fix', f: () =>
    ground(50, 92, 44, 4) +
    rc(10, 46, 80, 42, 6, CH) + rc(10, 76, 80, 12, 5, CH_D, NS) + dz(14, 78, 72, 9, 7) + rc(10, 46, 80, 42, 6) +
    ln('M12 62 H88', 2.5, CH_D) +
    pa('M10 48 V34 Q10 12 50 12 Q90 12 90 34 V48 Z', CH) + pa('M68 14 Q90 18 90 34 V48 H74 Q76 26 68 14 Z', CH_D, NS) +
    pa('M10 48 V34 Q10 12 50 12 Q90 12 90 34 V48 Z') + ln('M12 30 Q50 22 88 30', 2.5, CH_D) +
    hl('M18 30 Q22 20 34 17', CH_L, 4) +
    rc(19, 17, 10, 71, 2, SUN) + rc(71, 17, 10, 71, 2, SUN) + rc(76, 17, 5, 71, 0, SUN_D, NS) + rc(71, 17, 10, 71, 2) +
    rc(6, 42, 88, 9, 4, SUN) + rc(6, 47, 88, 4, 2, SUN_D, NS) + rc(6, 42, 88, 9, 4) +
    ci(24, 30, 1.8, INK, NS) + ci(76, 30, 1.8, INK, NS) + ci(24, 70, 1.8, INK, NS) + ci(76, 70, 1.8, INK, NS) +
    rc(40, 38, 20, 24, 5, SUN) + ci(50, 48, 3.2, INK, NS) + rc(48.5, 49, 3, 7, 1.2, INK, NS) +
    pa('M86 2 Q87 8 93 9 Q87 10 86 16 Q85 10 79 9 Q85 8 86 2 Z', SUN, { sw: 2.5 }) +
    el(84, 92, 7, 3.5, SUN, { sw: 2.5 }) + el(90, 88, 5, 3, SUN, { sw: 2.5 }) },

  cannon: { k: 'fix', f: () =>
    ground(52, 92, 44, 4) +
    ci(11, 85, 7, DK, { sw: 3 }) + ci(25, 85, 7, DK, { sw: 3 }) + ci(18, 73, 7, DK, { sw: 3 }) +
    ci(9, 83, 1.8, DK_L, NS) + ci(23, 83, 1.8, DK_L, NS) + ci(16, 71, 1.8, DK_L, NS) +
    pa('M32 86 V68 L46 54 H72 L84 70 V86 Z', WD) + pa('M32 78 H84 V86 H32 Z', WD_D, NS) + pa('M32 86 V68 L46 54 H72 L84 70 V86 Z') +
    g('rotate(-24 54 56)',
      rc(24, 45, 62, 22, 11, DK) + rc(28, 58, 58, 9, 4, DK_D, NS) + rc(24, 45, 62, 22, 11) +
      rc(80, 41, 12, 30, 5, DK_L) + el(92, 56, 3, 9, INK, NS) +
      ln('M44 45 V67 M66 45 V67', 3, DK_L) + hl('M32 50 H58', DK_L, 3.5) +
      ci(20, 56, 6, DK, { sw: 3.5 }) + ln('M14 56 L8 52', 3)) +
    pa('M8 37 L11 42 L16 40 L13 45 L17 49 L11 48 L8 53 L7 47 L2 45 L7 42 Z', SUN, { sw: 2.5 }) +
    ci(52, 74, 18, WD_D) + ci(52, 74, 11, WD, { sw: 3 }) + ln('M52 56 V92 M34 74 H70 M39.3 61.3 L64.7 86.7 M64.7 61.3 L39.3 86.7', 3) +
    ci(52, 74, 4.5, SUN, { sw: 3 }) + ci(78, 82, 9, WD_D) + ci(78, 82, 3, SUN, { sw: 2.5 }) },

  pillar: { k: 'fix', f: () =>
    ground(50, 94, 38, 3) +
    rc(16, 83, 68, 11, 3, ST) + rc(66, 83, 18, 11, 2, ST_D, NS) + rc(16, 83, 68, 11, 3) +
    rc(23, 75, 54, 10, 3, ST) + rc(64, 75, 13, 10, 2, ST_D, NS) + rc(23, 75, 54, 10, 3) +
    rc(28, 26, 44, 50, 0, ST, NS) + rc(58, 26, 14, 50, 0, ST_D, NS) + dt([63, 34, 67, 44, 63, 54, 67, 64]) + rc(28, 26, 44, 50, 0) +
    ln('M35 28 V73 M43 28 V73 M51 28 V73 M59 28 V73 M66 28 V73', 2.5) +
    hl('M31 30 V48', WH, 3) +
    rc(22, 16, 56, 11, 3, ST) + rc(62, 16, 16, 11, 2, ST_D, NS) + rc(22, 16, 56, 11, 3) +
    ci(20, 22, 7.5, ST) + ci(80, 22, 7.5, ST_D) + pa('M20 22 m-3 0 a3 3 0 1 1 3 3', null, { sw: 2.5 }) + pa('M80 22 m3 0 a3 3 0 1 0 -3 3', null, { sw: 2.5 }) +
    rc(14, 5, 72, 11, 3, ST) + rc(66, 5, 20, 11, 2, ST_D, NS) + rc(14, 5, 72, 11, 3) +
    ln('M30 74 Q36 62 31 52 Q28 44 34 36', 2.5, MIN_D) +
    pa('M34 62 Q42 58 42 64 Q38 68 34 62 Z', MIN, { sw: 2.5 }) + pa('M31 46 Q24 42 24 48 Q28 52 31 46 Z', MIN, { sw: 2.5 }) },

  cauldron: { k: 'fix', f: () =>
    ground(50, 93, 40, 3) +
    tube('M32 62 L16 92 M68 62 L84 92 M50 66 L50 94', 4.5, GR) +
    ln('M14 50 Q4 50 6 60 Q8 66 16 64 M86 50 Q96 50 94 60 Q92 66 84 64', 4.5) +
    pa('M13 42 Q9 84 50 86 Q91 84 87 42 Z', DK, NS) + pa('M64 44 H87 Q91 84 50 86 Q72 76 64 44 Z', DK_D, NS) + pa('M13 42 Q9 84 50 86 Q91 84 87 42 Z') +
    hl('M20 54 Q21 68 30 76', DK_L, 4) +
    el(50, 42, 40, 10, DK_L) + el(50, 42, 32, 6, APP, { sw: 3 }) +
    pa('M26 44 Q24 54 27 58 Q30 60 30 54 Q30 48 32 46 Z', APP, { sw: 2.5 }) +
    ci(38, 40, 4, APP_L, { sw: 2.5 }) + ci(60, 41, 3, APP_L, { sw: 2.5 }) +
    ci(44, 26, 6, APP, { sw: 3 }) + ci(60, 18, 7.5, APP, { sw: 3 }) + ci(48, 7, 4, APP, { sw: 2.5 }) + ci(70, 30, 3.5, APP, { sw: 2.5 }) +
    hl('M57 15 Q59 13 61 13 M42 24 L43 23', APP_L, 2.5) },

  blackboard: { k: 'free', f: (W, H) => {
    const fb = H - 30, x1 = 13, y1 = 13, iw = W - 26, ih = fb - 20;
    let s = ground(W / 2, H - 5, W / 2 - 8, 3) +
      tube(`M22 ${fb} L12 ${H - 6} M${W - 22} ${fb} L${W - 12} ${H - 6}`, 5, WD_D) +
      rc(6, 6, W - 12, fb - 2, 7, WD) + hl(`M12 10 H${Math.min(40, W / 3)}`, WD_L, 3) +
      rc(x1, y1, iw, ih, 3, BB) + rc(x1, y1 + ih - 9, iw, 9, 2, BB_D, NS) + rc(x1, y1, iw, ih, 3, null, { sw: 3 }) +
      el(W - 32, y1 + ih - 18, 12, 5, '#4F9E80', NS);
    let d = '', x = x1 + 7;
    for (const c of ['1', '+', '2', '=', '3']) { if (x + 9 > x1 + iw - 4) break; d += GLY[c](x, y1 + 7); x += 12; }
    for (let y = y1 + 30, j = 0; y < y1 + ih - 10 && j < 4; y += 15, j++) {
      let p = `M${x1 + 7} ${y}`, xx = x1 + 7;
      const end = Math.min(x1 + iw - 10, x1 + 7 + [64, 40, 56, 32][j] * Math.max(1, iw / 120));
      while (xx + 8 <= end) { p += ` Q${xx + 4} ${y - 5} ${xx + 8} ${y}`; xx += 8; }
      d += p;
    }
    s += ln(d, 3, WH);
    return s + rc(3, fb - 5, W - 6, 8, 3, WD_D) +
      rc(18, fb - 12, 15, 7, 2, SKY, { sw: 2.5 }) + rc(18, fb - 8, 15, 3, 1, CREAM, NS) +
      rc(W - 30, fb - 9, 12, 4, 2, WH, { sw: 2.5 });
  } },

  globe: { k: 'fix', f: () => {
    const cx = 48, cy = 44, r = 31, R = 38, a1 = -102 * Math.PI / 180, a2 = 78 * Math.PI / 180;
    const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
    const arc = `M${n(p1[0])} ${n(p1[1])} A${R} ${R} 0 0 1 ${n(p2[0])} ${n(p2[1])}`;
    return ground(50, 93, 26, 3) +
      el(50, 88, 22, 6, WD_D) + el(50, 86, 22, 6, WD) + rc(46, 76, 9, 11, 2, WD_D) +
      ci(cx, cy, r, SKY) + crescent(cx, cy, r, SKY_D, 0.45) + dt([70, 50, 66, 62, 72, 38]) +
      pa('M24 26 Q32 18 42 22 Q44 30 36 36 Q40 46 34 54 Q28 56 25 48 Q20 38 24 26 Z', APP, { sw: 3 }) +
      pa('M52 28 Q62 22 70 30 Q72 40 64 46 Q64 58 56 64 Q51 54 54 46 Q48 38 52 28 Z', APP, { sw: 3 }) +
      el(44, 66, 5, 3, APP, { sw: 2.5 }) +
      ci(cx, cy, r) + hl('M26 18 Q32 14 38 14', SKY_L, 4) +
      tube(arc, 4.5, SUN) + ci(p1[0], p1[1], 3.5, SUN, { sw: 2.5 }) + ci(p2[0], p2[1], 3.5, SUN, { sw: 2.5 });
  } },

  tv: { k: 'fix', f: () =>
    ground(50, 94, 40, 3) +
    ln('M50 22 L30 5 M50 22 L72 6', 3) + ci(30, 5, 3.5, COR, { sw: 2.5 }) + ci(72, 6, 3.5, COR, { sw: 2.5 }) +
    rc(19, 80, 8, 12, 3, DK) + rc(73, 80, 8, 12, 3, DK) +
    el(50, 22, 11, 5, DK) +
    rc(7, 22, 86, 62, 12, MAN, NS) + rc(7, 72, 86, 12, 6, MAN_D, NS) + dz(12, 74, 76, 9, 7) + rc(7, 22, 86, 62, 12) +
    hl('M16 26 H34', MAN_L, 3.5) +
    rc(14, 29, 54, 46, 11, SKY) + pa('M60 32 Q68 34 68 46 V64 Q68 75 56 75 H42 Q60 70 60 32 Z', SKY_D, NS) + rc(14, 29, 54, 46, 11) +
    hl('M21 40 Q22 34 28 33', SKY_L, 4) + ci(22, 47, 2, SKY_L, NS) +
    ci(81, 37, 5.5, CREAM, { sw: 3 }) + ln('M81 37 L84 34', 2.5) + ci(81, 53, 5.5, CREAM, { sw: 3 }) + ln('M81 53 L78 50', 2.5) +
    ln('M75 64 H87 M75 69 H87', 2.5) },

  snowman: { k: 'fix', f: () =>
    ground(50, 93, 32, 4) +
    tube('M28 58 L9 44 M15 49 L10 54 M72 58 L91 44 M85 49 L90 54', 3, WD_D) +
    ci(50, 67, 27, WH, NS) + crescent(50, 67, 27, SN_D) + dt([68, 80, 72, 70, 64, 88]) + ci(50, 67, 27) +
    ci(50, 61, 2.6, INK, NS) + ci(50, 72, 2.6, INK, NS) + ci(50, 83, 2.6, INK, NS) +
    ci(50, 32, 17, WH, NS) + crescent(50, 32, 17, SN_D) + ci(50, 32, 17) +
    hl('M38 26 Q40 21 45 19', SN_D, 3) +
    ci(44, 30, 2.4, INK, NS) + ci(56, 30, 2.4, INK, NS) +
    pa('M50 34 L66 38 L50 40 Z', MAN, { sw: 2.5 }) +
    ci(43, 41, 1.4, INK, NS) + ci(47, 43, 1.4, INK, NS) + ci(52, 43, 1.4, INK, NS) + ci(56, 41, 1.4, INK, NS) +
    pa('M31 47 Q50 54 69 47 L70 53 Q50 60 30 53 Z', COR, { sw: 3 }) + rc(56, 52, 9, 18, 3, COR, { sw: 3 }) + ln('M57 63 H64', 2, COR_D) +
    rc(30, 15, 40, 6, 3, DK) + rc(37, 2, 26, 15, 3, DK) + rc(37, 10, 26, 5, 0, COR, NS) + rc(37, 2, 26, 15, 3, null, { sw: 3 }) + hl('M41 5 V8', DK_L, 2.5) },

  hay: { k: 'fix', f: () => {
    const TW = '#8A5A2B';
    const front = 'M8 44 Q6 40 10 39 H76 Q80 40 78 44 V84 Q79 88 74 88 H12 Q7 88 8 84 Z';
    return ground(50, 92, 46, 4) +
      pa('M77 40 L91 26 Q94 26 93 30 V72 Q93 76 90 78 L78 88 Z', SUN_D) + dt([84, 50, 88, 60, 84, 70, 88, 42]) +
      pa('M9 40 L23 26 H91 L77 40 Z', SUN_L) +
      ln('M30 30 l10 -1 M52 33 l12 -2 M70 30 l8 0', 2.5, SUN_D) +
      pa(front, SUN) +
      ln('M14 50 l9 -2 M36 56 l11 2 M16 70 l9 -1 M46 76 l10 -2 M60 50 l9 2 M28 80 l8 1 M56 64 l9 -1 M28 62 l6 2 M66 78 l6 -1 M42 46 l7 -1', 2.5, SUN_D) +
      ln('M84 40 l4 -3 M84 56 l4 -3 M84 70 l4 -3', 2.5, '#B57E10') +
      ln('M27 40 V88 M59 40 V88 M27 40 L41 26 M59 40 L73 26', 3.5, TW) +
      ln('M10 40 l-5 -6 M18 32 l-4 -7 M34 26 l-1 -7 M50 26 l2 -7 M68 26 l2 -6 M88 27 l5 -5 M93 44 l5 -1 M93 62 l5 2 M7 56 l-5 -1 M7 74 l-5 2 M20 88 l-2 5 M44 88 l1 5 M68 88 l2 5', 3) +
      hl('M14 45 H30', SUN_L, 3.5);
  } },

  billiard: { k: 'rot', o: 'h', f: (W, H) => {
    const cy = H / 2;
    let s = ground(W / 2, H - 5, W / 2 - 8, 3) +
      rc(6, 6, W - 12, H - 14, 14, WD_D) + rc(6, 6, W - 12, H - 18, 14, '#B8652A') + hl(`M18 11 H${Math.min(W * 0.35, 90)}`, WD, 3) +
      rc(17, 17, W - 34, H - 38, 6, FELT) + rc(17, 17, W - 34, 6, 3, FELT_D, NS) + rc(17, 17, W - 34, H - 38, 6, null, { sw: 3 });
    const pk = [[16, 16], [W - 16, 16], [16, H - 22], [W - 16, H - 22]];
    if (W > 150) pk.push([W / 2, 13], [W / 2, H - 19]);
    for (const [x, y] of pk) s += ci(x, y, 6.5, INK, NS);
    for (const x of [W * 0.25, W * 0.75]) s += ci(x, 11.5, 1.8, CREAM, NS) + ci(x, H - 17, 1.8, CREAM, NS);
    const k = Math.min(1.7, H / 100), r = 7 * k, dx = 12 * k, dy = 7.2 * k, yc = cy - 2, bx = W - 24 - 31 * k, cue = Math.max(30, Math.min(W * 0.3, bx - 40 * k));
    const cols = [SUN, COR, SKY, LIL, MAN, ROS];
    const pos = [[0, 0], [1, -1], [1, 1], [2, -2], [2, 0], [2, 2]];
    pos.forEach(([c, rr], i) => { s += ci(bx + c * dx, yc + rr * dy, r, cols[i], { sw: 2.5 }); });
    s += ci(cue, yc, r, WH, { sw: 2.5 });
    return s + tube(`M${n(cue - 9)} ${n(yc + 3)} L${n(Math.max(14, cue - 60))} ${n(Math.min(H - 14, yc + 30))}`, 3, WD_L) +
      ln(`M${n(cue - 9)} ${n(yc + 3)} L${n(cue - 13)} ${n(yc + 4.6)}`, 3, SKY);
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
