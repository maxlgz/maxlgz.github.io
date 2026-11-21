// Alibi — illustrations générées par code (objets vus de dessus, sols, portraits).
// Module pur : aucune dépendance, aucun accès DOM. Toutes les fonctions renvoient des chaînes.

const INK = '#23212b';
const SHADOW = 'rgba(35,33,43,0.2)';
const M = 8; // marge intérieure (unités sur 100 par case)

// ---------------------------------------------------------------- utilitaires
const n = (v) => Math.round(v * 10) / 10;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function el(tag, a) {
  let s = '<' + tag;
  for (const k in a) {
    const v = a[k];
    if (v === undefined || v === null || v === false) continue;
    s += ` ${k}="${typeof v === 'number' ? n(v) : v}"`;
  }
  return s + '/>';
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UID_PREFIX = 'al' + Math.floor(Math.random() * 46656).toString(36);
let uidCounter = 0;
const uid = (tag) => `${UID_PREFIX}-${tag}-${(++uidCounter).toString(36)}`;

function pts(list) {
  return 'M' + list.map((p) => n(p[0]) + ' ' + n(p[1])).join(' L') + ' Z';
}

// Contour festonné (feuillage, buisson, afro…)
function blob(cx, cy, r, lobes, seed, jitter = 0.08) {
  const rand = rng(seed);
  const rot = rand() * Math.PI * 2;
  const p = [];
  for (let i = 0; i < lobes; i++) {
    const a = rot + (i / lobes) * Math.PI * 2;
    const rr = r * (1 - jitter * rand());
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${n(p[0][0])} ${n(p[0][1])}`;
  for (let i = 0; i < lobes; i++) {
    const a = p[i];
    const b = p[(i + 1) % lobes];
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ar = chord * 0.6;
    d += ` A${n(ar)} ${n(ar)} 0 0 1 ${n(b[0])} ${n(b[1])}`;
  }
  return d + ' Z';
}

// Peintre : accumule ombres portées (dessous) et formes (dessus).
function painter(sdx, sdy) {
  const shadows = [];
  const body = [];
  function add(tag, a, o) {
    if (o.sh) {
      const s = el(tag, { ...a, fill: SHADOW, stroke: 'none', transform: `translate(${sdx} ${sdy})${o.t ? ' ' + o.t : ''}` });
      (o.sh === 2 ? body : shadows).push(s);
    }
    const b = { ...a };
    b.fill = o.fill || 'none';
    if (o.ns) b.stroke = 'none';
    else if (o.stroke) b.stroke = o.stroke;
    if (o.sw != null) b['stroke-width'] = o.sw;
    if (o.op != null) b.opacity = o.op;
    if (o.dash) b['stroke-dasharray'] = o.dash;
    if (o.t) b.transform = o.t;
    body.push(el(tag, b));
  }
  return {
    rect(x, y, w, h, fill, o = {}) { add('rect', { x, y, width: Math.max(0, w), height: Math.max(0, h), rx: o.r || undefined }, { ...o, fill }); },
    circle(cx, cy, r, fill, o = {}) { add('circle', { cx, cy, r }, { ...o, fill }); },
    ellipse(cx, cy, rx, ry, fill, o = {}) { add('ellipse', { cx, cy, rx, ry }, { ...o, fill }); },
    path(d, fill, o = {}) { add('path', { d }, { ...o, fill }); },
    poly(list, fill, o = {}) { add('path', { d: pts(list) }, { ...o, fill }); },
    line(x1, y1, x2, y2, o = {}) { add('line', { x1, y1, x2, y2 }, { ...o, fill: undefined }); },
    raw(s) { body.push(s); },
    out() { return shadows.join('') + body.join(''); },
  };
}

// Pour les objets « ronds » : un seul grand motif si la zone est carrée, sinon un par case.
function eachCell(W, H, fn) {
  if (W === H) { fn(W / 2, H / 2, W / 100, 0); return; }
  let k = 0;
  for (let y = 0; y < H; y += 100) for (let x = 0; x < W; x += 100) fn(x + 50, y + 50, 1, k++);
}

// --------------------------------------------------------------- les objets
// o : orientation canonique ('h' = plus large que haut, 'v' = plus haut que large), null = indifférent.
// d(p, W, H) : dessine dans un repère W×H (multiples de 100).

const WOOD = '#c99460', WOOD_D = '#9a6840', WOOD_L = '#e2b98a';

const DRAW = {
  // ======================== bloquants
  tree: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s, k) => {
      const R = 42 * s;
      p.path(blob(cx, cy, R * 0.86, 9, 11 + k * 7, 0.07), '#5b8a56', { sh: 1 });
      p.path(blob(cx - 5 * s, cy - 6 * s, R * 0.58, 7, 23 + k, 0.1), '#78a265', { ns: 1 });
      p.path(blob(cx - 11 * s, cy - 12 * s, R * 0.26, 5, 5 + k, 0.1), '#9cc07f', { ns: 1 });
      for (let i = 0; i < 5; i++) {
        const a = -0.6 + i * 1.25;
        p.line(cx + 2 * s, cy + 2 * s, cx + 2 * s + Math.cos(a) * R * 0.45, cy + 2 * s + Math.sin(a) * R * 0.45, { stroke: '#3f6a40', sw: 2 * s });
      }
      p.circle(cx + 2 * s, cy + 2 * s, 4 * s, '#6e4b32', { sw: 2 });
    });
  } },

  bush: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s, k) => {
      p.path(blob(cx, cy + 2 * s, 33 * s, 7, 77 + k * 3, 0.16), '#8aac62', { sh: 1 });
      p.path(blob(cx - 4 * s, cy - 3 * s, 20 * s, 6, 91 + k, 0.15), '#a6c57c', { ns: 1 });
      const fl = [[-14, -10], [12, -14], [16, 10], [-8, 16], [2, 0], [-20, 6]];
      fl.forEach(([dx, dy], i) => {
        p.circle(cx + dx * s, cy + dy * s, 4 * s, i % 2 ? '#f4efe4' : '#e39aab', { sw: 1.5 });
        p.circle(cx + dx * s, cy + dy * s, 1.4 * s, '#c8973a', { ns: 1 });
      });
    });
  } },

  rock: { d(p, W, H) {
    const cx = W / 2, cy = H / 2, rx = W / 2 - M - 6, ry = H / 2 - M - 10;
    const rand = rng(hash('rock' + W + 'x' + H));
    const pl = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const f = 0.82 + rand() * 0.18;
      pl.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    p.poly(pl, '#a29e96', { sh: 1 });
    const top = pl.map(([x, y]) => [cx - rx * 0.14 + (x - cx) * 0.6, cy - ry * 0.18 + (y - cy) * 0.6]);
    p.poly(top, '#bfbbb3', { ns: 1 });
    p.poly(top.slice(4, 8).concat([[cx - rx * 0.14, cy - ry * 0.18]]), '#d2cec7', { ns: 1 });
    p.line(top[1][0], top[1][1], pl[1][0], pl[1][1], { sw: 1.6, stroke: '#6f6b64' });
    p.line(top[5][0], top[5][1], pl[5][0], pl[5][1], { sw: 1.6, stroke: '#6f6b64' });
    p.line(top[7][0], top[7][1], pl[7][0], pl[7][1], { sw: 1.6, stroke: '#6f6b64' });
    p.poly(pl, null, {});
  } },

  plant: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s, k) => {
      p.circle(cx, cy, 26 * s, '#c27352', { sh: 1 });
      p.circle(cx, cy, 20 * s, '#5e4636', { sw: 2 });
      const N = 7;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * 360 + k * 20;
        const L = (i % 2 ? 34 : 40) * s, wd = 10 * s;
        const d = `M${n(cx)} ${n(cy)} Q${n(cx + L * 0.5)} ${n(cy - wd)} ${n(cx + L)} ${n(cy)} Q${n(cx + L * 0.5)} ${n(cy + wd)} ${n(cx)} ${n(cy)} Z`;
        p.path(d, i % 2 ? '#86b26c' : '#679957', { sw: 2.2, t: `rotate(${n(a)} ${n(cx)} ${n(cy)})` });
        p.line(cx + 4 * s, cy, cx + L * 0.85, cy, { stroke: '#3f6b38', sw: 1.3, t: `rotate(${n(a)} ${n(cx)} ${n(cy)})` });
      }
      p.circle(cx, cy, 5 * s, '#86b26c', { sw: 2 });
    });
  } },

  shelf: { o: 'h', d(p, W, H) {
    const X = M, R = W - M, d = Math.min(H - 2 * M, 50 + (H - 100) * 0.4), y = (H - d) / 2;
    p.rect(X, y, R - X, d, '#8b6242', { r: 4, sh: 1 });
    const ix = X + 5, iy = y + 5, iw = R - X - 10, ih = d - 10;
    p.rect(ix, iy, iw, ih, '#4a3326', { ns: 1 });
    const cols = ['#b3262f', '#2f6f73', '#c8973a', '#3d4a6b', '#7a9a5a', '#d9c7a0', '#8a4a6a', '#e0b45a'];
    const rand = rng(hash('shelf' + W + H));
    const sections = Math.max(1, Math.round(iw / 90));
    const sw = iw / sections;
    for (let sct = 0; sct < sections; sct++) {
      let x = ix + sct * sw + (sct ? 3 : 1);
      const end = ix + (sct + 1) * sw - (sct < sections - 1 ? 3 : 1);
      while (x < end - 4) {
        const bw = Math.min(end - x, 6 + rand() * 6);
        const bh = ih * (0.7 + rand() * 0.3);
        p.rect(x, iy + ih - bh, bw - 1.2, bh, cols[Math.floor(rand() * cols.length)], { ns: 1 });
        x += bw;
      }
      if (sct < sections - 1) p.rect(ix + (sct + 1) * sw - 3, y, 6, d, '#8b6242', { sw: 2 });
    }
    p.rect(ix, iy, iw, ih, null, { sw: 2 });
    p.rect(X, y, R - X, d, null, { r: 4 });
  } },

  table: { d(p, W, H) {
    if (W === H) {
      const cx = W / 2, cy = H / 2, s = W / 100;
      p.circle(cx, cy, 40 * s, '#c08b55', { sh: 1 });
      p.circle(cx, cy, 33 * s, '#d29e68', { ns: 1 });
      p.circle(cx, cy, 33 * s, null, { stroke: '#a8743f', sw: 1.4 });
      p.circle(cx, cy, 17 * s, '#f4ede0', { sw: 2, dash: '3 2' });
      p.circle(cx - 5 * s, cy - 3 * s, 5 * s, '#c9534f', { sw: 1.6 });
      p.circle(cx + 5 * s, cy - 2 * s, 5 * s, '#e3a33f', { sw: 1.6 });
      p.circle(cx, cy + 5 * s, 5 * s, '#86b26c', { sw: 1.6 });
      return;
    }
    const X = M + 2, Y = M + 6, R = W - M - 2, B = H - M - 6;
    p.rect(X, Y, R - X, B - Y, '#c08b55', { r: 8, sh: 1 });
    const horiz = W >= H;
    if (horiz) {
      for (let y = Y + 16; y < B - 6; y += 16) p.line(X + 4, y, R - 4, y, { stroke: '#a8743f', sw: 1.3 });
      p.rect(X + 14, (Y + B) / 2 - 12, R - X - 28, 24, '#f1e9da', { sw: 2 });
      for (let x = 50; x < W; x += 100) p.circle(x, (Y + B) / 2, 8, '#ffffff', { sw: 1.8 });
    } else {
      for (let x = X + 16; x < R - 6; x += 16) p.line(x, Y + 4, x, B - 4, { stroke: '#a8743f', sw: 1.3 });
      p.rect((X + R) / 2 - 12, Y + 14, 24, B - Y - 28, '#f1e9da', { sw: 2 });
      for (let y = 50; y < H; y += 100) p.circle((X + R) / 2, y, 8, '#ffffff', { sw: 1.8 });
    }
  } },

  desk: { o: 'h', d(p, W, H) {
    const X = M + 2, Y = M + 8, R = W - M - 2, B = H - M - 8;
    p.rect(X, Y, R - X, B - Y, '#77543a', { r: 4, sh: 1 });
    p.rect(X + 4, Y + 4, R - X - 8, B - Y - 8, null, { stroke: '#9a7350', sw: 1.4 });
    const bw = Math.min(56, (R - X) * 0.5), bx = (W - bw) / 2 - 6;
    p.rect(bx, Y + 12, bw, B - Y - 24, '#5d8a6b', { r: 2, sw: 2 });
    p.rect(bx + bw * 0.25, Y + 18, bw * 0.45, B - Y - 32, '#f6f1e6', { sw: 1.6, t: `rotate(-8 ${n(bx + bw * 0.45)} ${n(H / 2)})` });
    p.circle(R - 14, Y + 14, 6, '#2b2a33', { sw: 2 });
    p.line(R - 14, Y + 14, R - 4, Y + 26, { stroke: '#f4efe4', sw: 2.5 });
    if (W >= 200) {
      p.circle(X + 22, Y + 18, 10, '#c8973a', { sw: 2 });
      p.circle(X + 22, Y + 18, 4, '#f3d77a', { ns: 1 });
    }
  } },

  counter: { o: 'h', d(p, W, H) {
    const X = M, Y = M + 6, R = W - M, B = H - M - 4;
    p.rect(X, Y, R - X, B - Y, '#8a5a3a', { r: 4, sh: 1 });
    const top = B - 20;
    for (let x = X + 25; x < R - 10; x += 25) p.line(x, top + 3, x, B - 3, { stroke: '#6e4529', sw: 1.6 });
    p.rect(X, Y, R - X, top - Y, '#ddd6c9', { r: 4 });
    p.line(X + 10, Y + 9, X + 30, Y + 16, { stroke: '#c5bdae', sw: 1.4 });
    p.line(R - 40, top - 8, R - 14, top - 14, { stroke: '#c5bdae', sw: 1.4 });
    const cells = W / 100, my = (Y + top) / 2;
    const cup = (x) => { p.circle(x, my, 8, '#f8f5ee', { sw: 2 }); p.circle(x, my, 4, '#7a4a2e', { ns: 1 }); };
    const till = (x) => { p.rect(x, Y + 6, 34, top - Y - 12, '#5b5766', { r: 3, sw: 2 }); p.rect(x + 5, Y + 10, 24, 7, '#a7d0a0', { ns: 1 }); p.rect(x + 5, Y + 21, 24, top - Y - 31, '#77737f', { ns: 1 }); };
    for (let i = 0; i < cells; i++) {
      const x = i * 100;
      if (i === cells - 1) { if (cells === 1) cup(x + 26); till(x + (cells === 1 ? 48 : 40)); }
      else {
        cup(x + 30);
        p.circle(x + 66, my, 8, '#c8973a', { sw: 2 });
        p.circle(x + 66, my, 2.5, INK, { ns: 1 });
      }
    }
  } },

  wardrobe: { d(p, W, H) {
    // vue de face (meuble haut contre un mur)
    const X = M + 6, R = W - M - 6, Y = M + 2, B = H - M - 2;
    p.rect(X + 4, B - 8, 7, 8, '#4f3324', { r: 1.5 });
    p.rect(R - 11, B - 8, 7, 8, '#4f3324', { r: 1.5 });
    p.rect(X + 2, Y + 6, R - X - 4, B - Y - 13, '#6c4732', { r: 3, sh: 1 });
    p.rect(X - 2, Y, R - X + 4, 10, '#583826', { r: 3, sh: 2 });
    const doors = Math.max(2, Math.round((R - X) / 42));
    const dw = (R - X - 12) / doors;
    for (let i = 0; i < doors; i++) {
      const dx = X + 6 + i * dw;
      p.rect(dx + 1, Y + 15, dw - 2, B - Y - 28, '#8a5c40', { r: 2, sw: 2 });
      p.rect(dx + 6, Y + 21, dw - 12, (B - Y - 40) / 2, null, { stroke: '#a97a55', sw: 1.6 });
      p.rect(dx + 6, Y + 25 + (B - Y - 40) / 2, dw - 12, (B - Y - 40) / 2 - 4, null, { stroke: '#a97a55', sw: 1.6 });
      p.circle(i % 2 ? dx + 6 : dx + dw - 6, (Y + B) / 2, 2.8, '#c8973a', { sw: 1.4 });
    }
  } },

  barrel: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      p.circle(cx, cy, 37 * s, '#9a6538', { sh: 1 });
      p.circle(cx, cy, 31.5 * s, null, { stroke: '#5d5a60', sw: 4.5 * s });
      p.circle(cx, cy, 27 * s, '#c08a55', { sw: 2 });
      for (const dx of [-13.5, 0, 13.5]) {
        const hh = Math.sqrt(27 * 27 - dx * dx) * s;
        p.line(cx + dx * s, cy - hh + 1, cx + dx * s, cy + hh - 1, { stroke: '#93603a', sw: 1.6 });
      }
      p.circle(cx + 6 * s, cy + 7 * s, 4 * s, '#5c3b24', { sw: 1.5 });
    });
  } },

  crate: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      const h = 35 * s;
      p.rect(cx - h, cy - h, 2 * h, 2 * h, '#d1a564', { r: 3, sh: 1 });
      const i = h - 8 * s;
      p.rect(cx - i, cy - i, 2 * i, 2 * i, '#e0bb7d', { sw: 2 });
      p.path(`M${n(cx - i)} ${n(cy - i + 9 * s)} L${n(cx - i + 9 * s)} ${n(cy - i)} L${n(cx + i)} ${n(cy + i - 9 * s)} L${n(cx + i - 9 * s)} ${n(cy + i)} Z`, '#c29352', { sw: 2 });
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) p.circle(cx + dx * (h - 4 * s), cy + dy * (h - 4 * s), 1.8 * s, INK, { ns: 1 });
    });
  } },

  statue: { d(p, W, H) {
    // vue de face sur son socle
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    const X = (v) => cx + v * s, Y = (v) => cy + v * s;
    p.rect(X(-34), Y(31), 68 * s, 10 * s, '#a29e95', { r: 2, sh: 1 });
    p.rect(X(-25), Y(12), 50 * s, 21 * s, '#bdb9b0', { r: 2, sh: 1 });
    p.line(X(-19), Y(19), X(19), Y(19), { stroke: '#9a968d', sw: 1.4 });
    const marble = '#f1efe9';
    p.rect(X(13), Y(-40), 8 * s, 26 * s, marble, { r: 4 * s, sh: 1, t: `rotate(18 ${n(X(14))} ${n(Y(-16))})` });
    p.path(`M${n(X(-12))} ${n(Y(-18))} Q${n(X(0))} ${n(Y(-22))} ${n(X(12))} ${n(Y(-18))} L${n(X(17))} ${n(Y(12))} L${n(X(-17))} ${n(Y(12))} Z`, marble, { sh: 1 });
    p.path(`M${n(X(-4))} ${n(Y(-12))} L${n(X(-7))} ${n(Y(10))} M${n(X(5))} ${n(Y(-10))} L${n(X(7))} ${n(Y(10))}`, null, { stroke: '#c9c5bb', sw: 1.6 });
    p.rect(X(-17), Y(-17), 7 * s, 24 * s, marble, { r: 3.5 * s, t: `rotate(8 ${n(X(-13))} ${n(Y(-17))})` });
    p.circle(X(0), Y(-27), 8.5 * s, marble, { sh: 2 });
    p.path(`M${n(X(-8))} ${n(Y(-30))} Q${n(X(0))} ${n(Y(-39))} ${n(X(8))} ${n(Y(-30))}`, null, { stroke: '#8fa06b', sw: 2.6 });
    p.circle(X(19), Y(-42), 5 * s, null, { stroke: '#c8973a', sw: 2.4 });
  } },

  fountain: { d(p, W, H) {
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    const oct = (r) => Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    p.poly(oct(43 * s), '#bdb5a5', { sh: 1 });
    p.poly(oct(34 * s), '#8fc2ce', { sw: 2 });
    p.circle(cx, cy, 25 * s, null, { stroke: '#e9f6f8', sw: 1.8, op: 0.9 });
    p.circle(cx, cy, 17 * s, null, { stroke: '#e9f6f8', sw: 1.6, op: 0.8 });
    p.circle(cx, cy, 9 * s, '#d4ccbd', { sw: 2.2 });
    p.circle(cx, cy, 4 * s, '#e9f6f8', { sw: 1.5 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      p.circle(cx + Math.cos(a) * 13 * s, cy + Math.sin(a) * 13 * s, 1.7 * s, '#ffffff', { ns: 1 });
    }
  } },

  piano: { o: 'v', d(p, W, H) {
    const x0 = M + 2, x1 = W - M - 2, y0 = M, yb = H - M - 2, w = x1 - x0, h = yb - y0;
    const d = `M${n(x0)} ${n(yb)} L${n(x1)} ${n(yb)} L${n(x1)} ${n(y0 + 0.6 * h)} C${n(x1)} ${n(y0 + 0.34 * h)} ${n(x0 + 0.72 * w)} ${n(y0 + 0.42 * h)} ${n(x0 + 0.64 * w)} ${n(y0 + 0.16 * h)} C${n(x0 + 0.58 * w)} ${n(y0 - 0.01 * h)} ${n(x0 + 0.12 * w)} ${n(y0 - 0.02 * h)} ${n(x0)} ${n(y0 + 0.16 * h)} Z`;
    p.path(d, '#2e2b35', { sh: 1 });
    p.path(`M${n(x0 + 6)} ${n(yb - 22)} L${n(x0 + 6)} ${n(y0 + 0.2 * h)} C${n(x0 + 0.16 * w)} ${n(y0 + 0.06 * h)} ${n(x0 + 0.5 * w)} ${n(y0 + 0.05 * h)} ${n(x0 + 0.56 * w)} ${n(y0 + 0.2 * h)}`, null, { stroke: '#5c5868', sw: 2.5 });
    const ky = yb - 15;
    p.rect(x0 + 3, ky, w - 6, 12, '#f6f2ea', { sw: 2 });
    const keys = Math.round((w - 6) / 6);
    const kw = (w - 6) / keys;
    for (let i = 1; i < keys; i++) {
      if (i % 7 === 3 || i % 7 === 0) continue;
      p.rect(x0 + 3 + i * kw - 1.4, ky, 2.8, 7, INK, { ns: 1 });
    }
    p.rect(x0 + 0.25 * w, ky - 9, 0.5 * w, 4, '#5c5868', { ns: 1 });
  } },

  stove: { d(p, W, H) {
    // poêle à bois en fonte, vue de face
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    const X = (v) => cx + v * s, Y = (v) => cy + v * s;
    p.rect(X(-24), Y(32), 6 * s, 9 * s, INK, { r: 1.5 });
    p.rect(X(18), Y(32), 6 * s, 9 * s, INK, { r: 1.5 });
    p.rect(X(-5), Y(-42), 10 * s, 22 * s, '#3a3940', { sh: 1 });
    p.rect(X(-9), Y(-44), 18 * s, 5 * s, '#4a4950', { r: 1.5 });
    p.rect(X(-17), Y(-24), 34 * s, 8 * s, '#55545c', { r: 2, sh: 1 });
    p.ellipse(X(0), Y(9), 27 * s, 25 * s, '#4a4950', { sh: 1 });
    p.rect(X(-30), Y(28), 60 * s, 7 * s, '#3a3940', { r: 2, sh: 2 });
    p.rect(X(-13), Y(0), 26 * s, 18 * s, '#e8883a', { r: 4 * s, sw: 2.2 });
    p.path(`M${n(X(-7))} ${n(Y(16))} C${n(X(-8))} ${n(Y(10))} ${n(X(-3))} ${n(Y(8))} ${n(X(-1))} ${n(Y(2))} C${n(X(3))} ${n(Y(8))} ${n(X(8))} ${n(Y(10))} ${n(X(7))} ${n(Y(16))} Z`, '#f6cf5c', { ns: 1 });
    p.line(X(-13), Y(9), X(13), Y(9), { stroke: '#3a3940', sw: 1.6 });
    p.path(`M${n(X(-20))} ${n(Y(-6))} Q${n(X(-24))} ${n(Y(8))} ${n(X(-19))} ${n(Y(22))}`, null, { stroke: '#77767e', sw: 2 });
  } },

  fireplace: { d(p, W, H) {
    const X = M, R = W - M, Y = M + 2, B = H - M - 4;
    const hearthY = B - 14;
    p.rect(X + 6, hearthY - 4, R - X - 12, B - hearthY + 4, '#b1aca3', { r: 3, sh: 1 });
    p.rect(X, Y, R - X, hearthY - Y, '#b26a52', { r: 3, sh: 1 });
    for (let y = Y + 14, row = 0; y < hearthY - 2; y += 10, row++) {
      p.line(X + 2, y, R - 2, y, { stroke: '#d9a592', sw: 1.2 });
      for (let x = X + (row % 2 ? 10 : 20); x < R - 4; x += 20) p.line(x, y - 10, x, y, { stroke: '#d9a592', sw: 1.2 });
    }
    p.rect(X, Y, R - X, 9, '#6f4732', { r: 3, sw: 2 });
    const ow = Math.min(56, (R - X) * 0.55), ox = W / 2 - ow / 2, oy = Y + 22;
    p.path(`M${n(ox)} ${n(hearthY)} L${n(ox)} ${n(oy + 12)} Q${n(ox)} ${n(oy)} ${n(ox + 12)} ${n(oy)} L${n(ox + ow - 12)} ${n(oy)} Q${n(ox + ow)} ${n(oy)} ${n(ox + ow)} ${n(oy + 12)} L${n(ox + ow)} ${n(hearthY)} Z`, '#2b2327', {});
    const fx = W / 2, fb = hearthY - 6;
    p.rect(fx - 16, fb - 2, 32, 6, '#7a4f33', { r: 3, sw: 1.5, t: `rotate(-12 ${fx} ${fb})` });
    p.rect(fx - 16, fb - 2, 32, 6, '#8d5d3d', { r: 3, sw: 1.5, t: `rotate(12 ${fx} ${fb})` });
    p.path(`M${fx - 13} ${fb} C${fx - 15} ${fb - 12} ${fx - 6} ${fb - 16} ${fx - 3} ${fb - 26} C${fx + 2} ${fb - 16} ${fx + 6} ${fb - 20} ${fx + 8} ${fb - 22} C${fx + 10} ${fb - 14} ${fx + 15} ${fb - 10} ${fx + 13} ${fb} Z`, '#e58a3a', { sw: 1.6 });
    p.path(`M${fx - 6} ${fb} C${fx - 7} ${fb - 7} ${fx - 2} ${fb - 9} ${fx} ${fb - 15} C${fx + 3} ${fb - 9} ${fx + 7} ${fb - 7} ${fx + 6} ${fb} Z`, '#f5cd5e', { ns: 1 });
  } },

  lamp: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      p.circle(cx, cy, 44 * s, '#f5d77e', { ns: 1, op: 0.35 });
      p.circle(cx, cy, 34 * s, '#f5d77e', { ns: 1, op: 0.45 });
      p.circle(cx, cy, 24 * s, '#f4e9c9', { sh: 1 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        p.line(cx + Math.cos(a) * 9 * s, cy + Math.sin(a) * 9 * s, cx + Math.cos(a) * 23 * s, cy + Math.sin(a) * 23 * s, { stroke: '#d8c697', sw: 1.4 });
      }
      p.circle(cx, cy, 8 * s, '#c8973a', { sw: 2 });
      p.circle(cx, cy, 24 * s, null, {});
    });
  } },

  telescope: { d(p, W, H) {
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2 + 4 * s;
    for (const a of [100, 220, 340]) {
      const r = (a * Math.PI) / 180;
      const ex = cx + Math.cos(r) * 38 * s, ey = cy + Math.sin(r) * 34 * s;
      p.line(cx, cy, ex, ey, { sw: 7.5 * s });
      p.line(cx, cy, ex, ey, { stroke: '#6b4b34', sw: 4.5 * s });
      p.circle(ex, ey, 3.6 * s, INK, { ns: 1 });
    }
    const rot = `rotate(-32 ${n(cx)} ${n(cy)})`;
    p.rect(cx - 36 * s, cy - 8 * s, 66 * s, 16 * s, '#c8973a', { r: 4 * s, sh: 1, t: rot });
    p.rect(cx + 22 * s, cy - 11 * s, 16 * s, 22 * s, '#a87a2e', { r: 3 * s, sh: 2, t: rot });
    p.rect(cx + 36 * s, cy - 8 * s, 4 * s, 16 * s, '#7fb8c9', { r: 1.5, sw: 1.5, t: rot });
    p.rect(cx - 46 * s, cy - 5 * s, 11 * s, 10 * s, '#3a3640', { r: 2, t: rot });
    p.line(cx - 6 * s, cy - 8 * s, cx - 6 * s, cy + 8 * s, { sw: 2, t: rot });
    p.line(cx + 8 * s, cy - 8 * s, cx + 8 * s, cy + 8 * s, { sw: 2, t: rot });
    p.circle(cx, cy, 4 * s, '#3a3640', { sw: 1.5 });
  } },

  aquarium: { o: 'h', d(p, W, H) {
    const X = M + 2, Y = M + 10, R = W - M - 2, B = H - M - 10;
    p.rect(X, Y, R - X, B - Y, '#3d4a54', { r: 4, sh: 1 });
    const ix = X + 5, iy = Y + 5, iw = R - X - 10, ih = B - Y - 10;
    p.rect(ix, iy, iw, ih, '#8cc3c9', { ns: 1 });
    p.rect(ix, iy + ih - 9, iw, 9, '#e2d1a2', { ns: 1 });
    for (let x = ix + 12; x < ix + iw - 6; x += 34) {
      p.path(`M${x} ${iy + ih - 6} q-5 -8 0 -15 q5 -7 0 -15`, null, { stroke: '#4f8a4f', sw: 3 });
      p.path(`M${x + 6} ${iy + ih - 5} q4 -6 0 -12`, null, { stroke: '#6fa864', sw: 2.5 });
    }
    const fishes = Math.max(2, Math.round(iw / 40));
    for (let i = 0; i < fishes; i++) {
      const fx = ix + iw * (i + 0.6) / (fishes + 0.2), fy = iy + ih * (i % 2 ? 0.62 : 0.32), dir = i % 2 ? -1 : 1;
      p.path(`M${n(fx - dir * 8)} ${n(fy)} l${n(-dir * 7)} -5 l0 10 Z`, '#e8833a', { sw: 1.4 });
      p.ellipse(fx, fy, 9, 5.5, '#ef9a4a', { sw: 1.4 });
      p.circle(fx + dir * 4.5, fy - 1, 1.2, INK, { ns: 1 });
    }
    p.circle(ix + iw - 10, iy + 9, 2.2, null, { stroke: '#ffffff', sw: 1.3 });
    p.circle(ix + iw - 14, iy + 16, 1.6, null, { stroke: '#ffffff', sw: 1.2 });
    p.line(ix + 4, iy + 3, ix + 20, iy + 3, { stroke: '#ffffff', sw: 2, op: 0.8 });
    p.rect(ix, iy, iw, ih, null, { sw: 1.6 });
  } },

  well: { d(p, W, H) {
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    p.circle(cx, cy, 40 * s, '#a69f92', { sh: 1 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      p.line(cx + Math.cos(a) * 26 * s, cy + Math.sin(a) * 26 * s, cx + Math.cos(a) * 40 * s, cy + Math.sin(a) * 40 * s, { sw: 1.6 });
    }
    p.circle(cx, cy, 33 * s, null, { stroke: '#857e72', sw: 1.4 });
    p.circle(cx, cy, 26 * s, '#24343f', { sw: 2.2 });
    p.path(`M${n(cx - 15 * s)} ${n(cy - 12 * s)} Q${n(cx - 4 * s)} ${n(cy - 19 * s)} ${n(cx + 8 * s)} ${n(cy - 16 * s)}`, null, { stroke: '#7fa7b8', sw: 2 });
    p.rect(cx - 46 * s, cy - 5 * s, 92 * s, 10 * s, '#8a5e3c', { r: 2, sh: 2 });
    p.rect(cx - 47 * s, cy - 9 * s, 11 * s, 18 * s, '#6b472d', { r: 2 });
    p.rect(cx + 36 * s, cy - 9 * s, 11 * s, 18 * s, '#6b472d', { r: 2 });
    p.circle(cx, cy + 14 * s, 6 * s, '#9c6a42', { sw: 2 });
    p.line(cx, cy + 5 * s, cx, cy + 8 * s, { sw: 1.5 });
    p.circle(cx, cy + 14 * s, 3 * s, '#3c5a6a', { ns: 1 });
  } },

  // ======================== occupables
  chair: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      const x = (v) => cx + (v - 50) * s, y = (v) => cy + (v - 50) * s;
      for (const [a, b] of [[26, 30], [74, 30], [26, 88], [74, 88]]) p.rect(x(a) - 4 * s, y(b) - 4 * s, 8 * s, 8 * s, WOOD_D, { r: 2, sh: 1 });
      p.rect(x(22), y(28), 56 * s, 58 * s, WOOD, { r: 9 * s, sh: 1 });
      p.rect(x(29), y(35), 42 * s, 44 * s, WOOD_L, { r: 7 * s, ns: 1 });
      p.rect(x(14), y(10), 72 * s, 15 * s, WOOD_D, { r: 7 * s, sh: 2 });
      p.line(x(36), y(14), x(36), y(21), { stroke: '#7d5230', sw: 2 });
      p.line(x(50), y(14), x(50), y(21), { stroke: '#7d5230', sw: 2 });
      p.line(x(64), y(14), x(64), y(21), { stroke: '#7d5230', sw: 2 });
    });
  } },

  armchair: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      const x = (v) => cx + (v - 50) * s, y = (v) => cy + (v - 50) * s;
      p.rect(x(9), y(10), 82 * s, 81 * s, '#8e464b', { r: 16 * s, sh: 1 });
      p.rect(x(26), y(30), 48 * s, 58 * s, '#c27378', { r: 9 * s, sw: 2.2 });
      p.rect(x(9), y(24), 19 * s, 67 * s, '#9e5157', { r: 9 * s, sw: 2.5 });
      p.rect(x(72), y(24), 19 * s, 67 * s, '#9e5157', { r: 9 * s, sw: 2.5 });
      p.path(`M${n(x(30))} ${n(y(17))} Q${n(x(50))} ${n(y(12))} ${n(x(70))} ${n(y(17))}`, null, { stroke: '#b9666c', sw: 2 });
      p.circle(x(18.5), y(80), 2, '#c8973a', { ns: 1 });
      p.circle(x(81.5), y(80), 2, '#c8973a', { ns: 1 });
    });
  } },

  sofa: { o: 'h', d(p, W, H) {
    const X = M, Y = M + 2, R = W - M, B = H - M - 2;
    const arm = 18;
    p.rect(X, Y, R - X, B - Y, '#4d7874', { r: 14, sh: 1 });
    const n2 = Math.max(1, Math.round((R - X - 2 * arm) / 85));
    const cw = (R - X - 2 * arm - 2) / n2;
    for (let i = 0; i < n2; i++) p.rect(X + arm + 1 + i * cw, Y + 22, cw, B - Y - 26, '#82aba5', { r: 8, sw: 2.2 });
    p.rect(X, Y + 8, arm + 2, B - Y - 8, '#5f8c88', { r: 9, sw: 2.5 });
    p.rect(R - arm - 2, Y + 8, arm + 2, B - Y - 8, '#5f8c88', { r: 9, sw: 2.5 });
    p.line(X + arm + 8, Y + 11, R - arm - 8, Y + 11, { stroke: '#6f9c97', sw: 2 });
  } },

  stool: { d(p, W, H) {
    eachCell(W, H, (cx, cy, s) => {
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        p.circle(cx + Math.cos(a) * 34 * s, cy + Math.sin(a) * 34 * s, 5.5 * s, '#7a5236', { sh: 1 });
      }
      p.circle(cx, cy, 30 * s, null, { sw: 6.5 * s });
      p.circle(cx, cy, 30 * s, null, { stroke: '#8d6040', sw: 3.5 * s });
      p.circle(cx, cy, 24 * s, WOOD, { sh: 2 });
      p.circle(cx, cy, 18 * s, null, { stroke: '#b07e4c', sw: 1.5 });
    });
  } },

  bench: { o: 'h', d(p, W, H) {
    const X = M, Y = M + 2, R = W - M, B = H - M - 2;
    const supports = [X + 6];
    for (let x = 100; x < W - 50; x += 100) supports.push(x);
    supports.push(R - 6);
    supports.forEach((sx) => p.rect(sx - 5, Y + 2, 10, B - Y - 4, '#3f3e45', { r: 3, sh: 1 }));
    const slat = (y, h) => p.rect(X + 2, y, R - X - 4, h, '#b8864f', { r: 3, sh: 1 });
    slat(Y + 4, 8);
    slat(Y + 16, 8);
    const sy = Y + 32, sh = B - 4 - sy, g = 4, h3 = (sh - 2 * g) / 3;
    for (let i = 0; i < 3; i++) slat(sy + i * (h3 + g), h3);
    for (let x = 30; x < W - 10; x += 50) p.line(x, sy + 3, x + 10, sy + 3, { stroke: '#d3a774', sw: 1.4 });
  } },

  bed: { o: 'v', d(p, W, H) {
    const X = M, Y = M, R = W - M, B = H - M;
    p.rect(X, Y, R - X, B - Y, '#8f6040', { r: 6, sh: 1 });
    p.rect(X + 4, Y + 12, R - X - 8, B - Y - 16, '#f3eee4', { r: 4, sw: 2 });
    const pillows = W > 150 ? 2 : 1;
    const pw = (R - X - 16 - (pillows - 1) * 6) / pillows;
    for (let i = 0; i < pillows; i++) p.rect(X + 8 + i * (pw + 6), Y + 15, pw, 16, '#ffffff', { r: 6, sw: 2 });
    const by = Y + 36 + (H > 100 ? 4 : 0);
    p.rect(X + 2, by, R - X - 4, B - by - 2, '#6f8fb8', { r: 4, sw: 2.2 });
    p.rect(X + 2, by, R - X - 4, 8, '#e8e2d4', { r: 3, sw: 2 });
    for (let y = by + 24; y < B - 8; y += 22) p.line(X + 6, y, R - 6, y, { stroke: '#5c7aa2', sw: 1.4, dash: '4 3' });
  } },

  deckchair: { o: 'v', d(p, W, H) {
    const cx = W / 2, Y = M + 2, B = H - M - 2;
    const half = Math.min(28, W / 2 - M - 6);
    p.rect(cx - half - 7, Y, 8, B - Y, '#a7784a', { r: 3, sh: 1 });
    p.rect(cx + half - 1, Y, 8, B - Y, '#a7784a', { r: 3, sh: 1 });
    const fx = cx - half + 1, fw = 2 * half - 2, fy = Y + 4, fh = B - Y - 16;
    const stripes = Math.max(5, Math.round(fh / 11));
    const st = fh / stripes;
    for (let i = 0; i < stripes; i++) p.rect(fx, fy + i * st, fw, st + 0.3, i % 2 ? '#f2e8d6' : '#c85b55', { ns: 1 });
    p.rect(fx, fy, fw, fh, null, { sw: 2.2 });
    p.rect(cx - half - 7, B - 8, 2 * half + 14, 7, '#8d6239', { r: 3 });
    p.rect(cx - half - 12, (Y + B) / 2 - 2, 7, 22, '#8d6239', { r: 3 });
    p.rect(cx + half + 5, (Y + B) / 2 - 2, 7, 22, '#8d6239', { r: 3 });
  } },

  hammock: { o: 'h', d(p, W, H) {
    const X = M, R = W - M, cy = H / 2, CH = H - 2 * M;
    const a = X + 20, b = R - 20, bulge = CH * 0.5;
    p.circle(X + 5, cy, 6, '#7a5236', { sh: 1 });
    p.circle(R - 5, cy, 6, '#7a5236', { sh: 1 });
    for (const dy of [-6, 0, 6]) {
      p.line(X + 7, cy, a + 2, cy + dy, { stroke: '#7c6a4c', sw: 1.6 });
      p.line(R - 7, cy, b - 2, cy + dy, { stroke: '#7c6a4c', sw: 1.6 });
    }
    const cx = (a + b) / 2;
    p.path(`M${a} ${cy} Q${cx} ${n(cy - bulge)} ${b} ${cy} Q${cx} ${n(cy + bulge)} ${a} ${cy} Z`, '#e6b46a', { sh: 1 });
    p.path(`M${a + 6} ${cy} Q${cx} ${n(cy - bulge * 0.74)} ${b - 6} ${cy} Q${cx} ${n(cy - bulge * 0.5)} ${a + 6} ${cy} Z`, '#c95a4b', { ns: 1 });
    p.path(`M${a + 6} ${cy} Q${cx} ${n(cy + bulge * 0.74)} ${b - 6} ${cy} Q${cx} ${n(cy + bulge * 0.5)} ${a + 6} ${cy} Z`, '#c95a4b', { ns: 1 });
    p.path(`M${a} ${cy} Q${cx} ${n(cy - bulge)} ${b} ${cy} Q${cx} ${n(cy + bulge)} ${a} ${cy} Z`, null, {});
  } },

  rug: { o: 'h', d(p, W, H) {
    const X = M, Y = M + 2, R = W - M, B = H - M - 2;
    for (let y = Y + 6; y <= B - 6; y += 6) {
      p.line(X, y, X + 8, y, { stroke: '#cdb88c', sw: 2 });
      p.line(R - 8, y, R, y, { stroke: '#cdb88c', sw: 2 });
    }
    p.rect(X + 6, Y, R - X - 12, B - Y, '#a8464c', { r: 3, sh: 1 });
    p.rect(X + 13, Y + 7, R - X - 26, B - Y - 14, '#e6cf9f', { r: 2, sw: 1.6 });
    const cx = W / 2, cy = H / 2, ix = X + 13, iy = Y + 7, iw = R - X - 26, ih = B - Y - 14;
    p.poly([[cx, iy + 6], [ix + iw - 7, cy], [cx, iy + ih - 6], [ix + 7, cy]], null, { stroke: '#2f6f73', sw: 2.5 });
    for (const [qx, qy] of [[ix + 7, iy + 7], [ix + iw - 7, iy + 7], [ix + iw - 7, iy + ih - 7], [ix + 7, iy + ih - 7]]) {
      p.rect(qx - 3.5, qy - 3.5, 7, 7, '#2f6f73', { ns: 1, t: `rotate(45 ${n(qx)} ${n(qy)})` });
    }
  } },

  bathtub: { o: 'h', d(p, W, H) {
    const X = M, Y = M + 6, R = W - M, B = H - M - 6, hh = B - Y;
    p.rect(X, Y, R - X, hh, '#f5f3ef', { r: hh * 0.42, sh: 1 });
    p.rect(X + 8, Y + 8, R - X - 22, hh - 16, '#a7d0d9', { r: (hh - 16) * 0.45, sw: 2 });
    p.path(`M${X + 18} ${Y + 16} Q${X + 30} ${Y + 12} ${X + 42} ${Y + 16}`, null, { stroke: '#ffffff', sw: 2 });
    p.path(`M${(X + R) / 2} ${B - 16} Q${(X + R) / 2 + 12} ${B - 12} ${(X + R) / 2 + 24} ${B - 16}`, null, { stroke: '#ffffff', sw: 2, op: 0.8 });
    const cy = (Y + B) / 2;
    p.rect(R - 11, cy - 5, 8, 10, '#b9bcc2', { r: 2, sw: 1.6 });
    p.circle(R - 7, cy - 11, 3, '#b9bcc2', { sw: 1.4 });
    p.circle(R - 7, cy + 11, 3, '#b9bcc2', { sw: 1.4 });
    p.circle(R - 22, cy, 2.4, '#5b5766', { ns: 1 });
  } },

  boat: { o: 'h', d(p, W, H) {
    const X = M, R = W - M, cy = H / 2, CH = H - 2 * M;
    const hh = CH * 0.36, xs = X + 2, xe = R - 2, L = xe - xs;
    const hull = (x0, x1, hy) => {
      const Lx = x1 - x0;
      return `M${n(x0 + 5)} ${n(cy - hy)} L${n(x1 - 0.4 * Lx)} ${n(cy - hy)} Q${n(x1 - 0.06 * Lx)} ${n(cy - hy * 0.9)} ${n(x1)} ${n(cy)} Q${n(x1 - 0.06 * Lx)} ${n(cy + hy * 0.9)} ${n(x1 - 0.4 * Lx)} ${n(cy + hy)} L${n(x0 + 5)} ${n(cy + hy)} Q${n(x0)} ${n(cy + hy)} ${n(x0)} ${n(cy + hy - 6)} L${n(x0)} ${n(cy - hy + 6)} Q${n(x0)} ${n(cy - hy)} ${n(x0 + 5)} ${n(cy - hy)} Z`;
    };
    const ox = xs + L * 0.45;
    for (const sgn of [-1, 1]) {
      const tipY = cy + sgn * (hh + 12), tipX = ox - 14;
      p.line(ox + 6, cy + sgn * (hh - 6), tipX, tipY, { sw: 5 });
      p.line(ox + 6, cy + sgn * (hh - 6), tipX, tipY, { stroke: '#c8a274', sw: 2.6 });
      p.ellipse(tipX - 2, tipY + sgn * 2, 4.5, 8, '#c8a274', { sw: 2, t: `rotate(${sgn * 55} ${n(tipX - 2)} ${n(tipY + sgn * 2)})` });
    }
    p.path(hull(xs, xe, hh), '#8f5f3c', { sh: 1 });
    p.path(hull(xs + 6, xe - 9, hh - 6.5), '#c99a66', { sw: 1.8 });
    for (let x = xs + 14; x < xe - 18; x += 12) p.line(x, cy - hh + 8, x, cy + hh - 8, { stroke: '#b78753', sw: 1.2 });
    p.rect(xs + 6 + L * 0.06, cy - hh + 6, 9, 2 * hh - 12, '#9b6b43', { sw: 1.8 });
    p.rect(xe - L * 0.3, cy - hh + 7, 9, 2 * hh - 14, '#9b6b43', { sw: 1.8 });
  } },

  car: { o: 'h', d(p, W, H) {
    const X = M, R = W - M, Y = M, B = H - M, L = R - X;
    const bt = Y + 7, bb = B - 7, bh = bb - bt;
    for (const fx of [0.17, 0.72]) for (const top of [true, false]) {
      p.rect(X + fx * L, top ? bt - 6 : bb - 4, Math.min(0.16 * L, 30), 10, '#2b2a30', { r: 3, sh: 1 });
    }
    p.rect(X, bt, L, bh, '#b5534e', { r: Math.min(22, bh * 0.36), sh: 1 });
    p.poly([[X + 0.6 * L, bt + 0.15 * bh], [X + 0.73 * L, bt + 0.08 * bh], [X + 0.73 * L, bb - 0.08 * bh], [X + 0.6 * L, bb - 0.15 * bh]], '#3c4e63', { sw: 2 });
    p.poly([[X + 0.26 * L, bt + 0.15 * bh], [X + 0.17 * L, bt + 0.1 * bh], [X + 0.17 * L, bb - 0.1 * bh], [X + 0.26 * L, bb - 0.15 * bh]], '#3c4e63', { sw: 2 });
    p.rect(X + 0.26 * L, bt + 0.13 * bh, 0.34 * L, bh * 0.74, '#c86f69', { r: 6, sw: 1.8 });
    p.line(X + 0.8 * L, bt + 0.25 * bh, X + 0.95 * L, bt + 0.3 * bh, { stroke: '#93413d', sw: 1.6 });
    p.line(X + 0.8 * L, bb - 0.25 * bh, X + 0.95 * L, bb - 0.3 * bh, { stroke: '#93413d', sw: 1.6 });
    p.ellipse(R - 4, bt + 0.2 * bh, 3, 6, '#f6dc84', { sw: 1.5 });
    p.ellipse(R - 4, bb - 0.2 * bh, 3, 6, '#f6dc84', { sw: 1.5 });
    p.rect(X + 1, bt + 0.14 * bh, 4, 9, '#7d2a2a', { r: 1.5, ns: 1 });
    p.rect(X + 1, bb - 0.14 * bh - 9, 4, 9, '#7d2a2a', { r: 1.5, ns: 1 });
  } },

  tent: { d(p, W, H) {
    // tente canadienne, vue de face
    const s = Math.min(W, H) / 100, cx = W / 2, cy = H / 2;
    const X = (v) => cx + v * s, Y = (v) => cy + v * s;
    const ax = X(0), ay = Y(-36), lx = X(-38), rx = X(38), gy = Y(32);
    for (const [px, py] of [[X(-46), Y(36)], [X(46), Y(36)]]) {
      p.line(ax, ay, px, py, { stroke: '#7c6a4c', sw: 1.4 });
      p.circle(px, py, 2.4 * s, INK, { ns: 1 });
    }
    p.line(ax, ay - 7 * s, ax, ay, { stroke: '#6b4b34', sw: 3 });
    p.poly([[ax, ay], [rx, gy], [lx, gy]], '#d39a55', { sh: 1 });
    p.poly([[ax, ay], [rx, gy], [ax, gy]], '#b57d3f', { ns: 1 });
    p.poly([[ax, Y(-14)], [X(15), gy], [X(-15), gy]], '#4e3420', { ns: 1 });
    p.poly([[ax, Y(-14)], [X(-15), gy], [X(-24), gy], [X(-4), Y(-12)]], '#e8b672', { sw: 1.8 });
    p.poly([[ax, ay], [rx, gy], [lx, gy]], null, {});
    p.line(X(-44), gy, X(44), gy, { stroke: '#7c6a4c', sw: 1.6 });
  } },

  stage: { o: 'h', d(p, W, H) {
    const X = M, Y = M, R = W - M, B = H - M;
    const py = B - 14;
    p.rect(X + 14, B - 9, R - X - 28, 8, '#8f6339', { r: 2, sh: 1 });
    p.rect(X + 7, py - 1, R - X - 14, 9, '#a77846', { r: 2, sh: 1 });
    p.rect(X, Y, R - X, py - Y, '#cc9e66', { r: 4, sh: 1 });
    for (let y = Y + 26; y < py - 6; y += 16) p.line(X + 3, y, R - 3, y, { stroke: '#b5874f', sw: 1.2 });
    p.rect(X, Y, R - X, 12, '#a9353c', { r: 4 });
    for (let x = X + 10; x < R - 4; x += 16) p.path(`M${x - 8} ${Y + 12} Q${x} ${Y + 21} ${x + 8} ${Y + 12}`, '#a9353c', { sw: 1.8 });
    for (let x = X + 14; x < R - 8; x += 24) p.circle(x, py - 5, 2.6, '#f4d06a', { sw: 1.2 });
  } },
};

function genericObject(W, H) {
  const p = painter(3, 4);
  p.rect(M + 6, M + 6, W - 2 * M - 12, H - 2 * M - 12, '#e8dfcd', { r: 10, sh: 1, dash: '6 4' });
  const s = Math.min(W, H) / 100;
  p.circle(W / 2, H / 2, 18 * s, '#f4ecdd', { sw: 2.5 });
  p.raw(`<text x="${n(W / 2)}" y="${n(H / 2 + 8 * s)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${n(24 * s)}" fill="${INK}" stroke="none">?</text>`);
  return p.out();
}

export function objectSVG(type, { w = 1, h = 1 } = {}) {
  w = Math.max(1, Math.round(Number(w) || 1));
  h = Math.max(1, Math.round(Number(h) || 1));
  const W = w * 100, H = h * 100;
  const def = Object.prototype.hasOwnProperty.call(DRAW, type) ? DRAW[type] : null;
  let body;
  if (!def) body = genericObject(W, H);
  else {
    const rot = (def.o === 'h' && h > w) || (def.o === 'v' && w > h);
    const LW = rot ? H : W, LH = rot ? W : H;
    const p = rot ? painter(4, -3) : painter(3, 4);
    try {
      def.d(p, LW, LH);
      body = p.out();
    } catch (e) {
      body = genericObject(W, H);
    }
    if (rot) body = `<g transform="translate(${W} 0) rotate(90)">${body}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" class="alibi-obj" data-type="${esc(type)}"><g fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
}

// --------------------------------------------------------------- les sols
// Chaque motif est un carreau périodique (viewBox 0 0 100 100) répété un nombre entier
// de fois par case : les cases voisines se raccordent donc parfaitement, quelle que soit leur taille.

function tileFrom(seed, count, fn) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) s += fn(r, i);
  return s;
}

const FLOORS = {
  grass: { c: '#b9c99c', size: '50%', svg: () => tileFrom(7, 7, (r, i) => {
    const x = 8 + r() * 84, y = 10 + r() * 80;
    return `<path d='M${n(x - 4)} ${n(y + 3)} L${n(x - 1)} ${n(y - 4)} M${n(x + 1)} ${n(y + 3)} L${n(x + 3)} ${n(y - 5)} M${n(x + 4)} ${n(y + 3)} L${n(x + 7)} ${n(y - 2)}' stroke='${i % 3 ? '#a3b685' : '#c9d8ae'}' stroke-width='2' stroke-linecap='round' fill='none'/>`;
  }) },
  wood: { c: '#d8bd91', size: '100%', svg: () => {
    let s = '';
    const seams = [22, 70, 44, 90];
    for (let i = 0; i < 4; i++) {
      const y = i * 25;
      s += `<rect x='0' y='${y}' width='100' height='25' fill='${i % 2 ? '#d3b688' : '#dbc196'}'/>`;
      s += `<line x1='0' y1='${y + 0.6}' x2='100' y2='${y + 0.6}' stroke='#bf9f6f' stroke-width='1.2'/>`;
      s += `<line x1='${seams[i]}' y1='${y}' x2='${seams[i]}' y2='${y + 25}' stroke='#bf9f6f' stroke-width='1.2'/>`;
      s += `<path d='M${seams[i] + 8} ${y + 12} q12 -3 24 0' stroke='#cdb084' stroke-width='1' fill='none'/>`;
    }
    return s;
  } },
  parquet: { c: '#c49a6e', size: '100%', svg: () => {
    let s = '';
    for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
      const x0 = qx * 50, y0 = qy * 50, horiz = (qx + qy) % 2 === 0;
      for (let k = 0; k < 3; k++) {
        const fill = ['#c79d71', '#bd9266', '#cba477'][(k + qx) % 3];
        if (horiz) s += `<rect x='${x0}' y='${y0 + k * 16.67}' width='50' height='16.67' fill='${fill}' stroke='#a98057' stroke-width='1'/>`;
        else s += `<rect x='${x0 + k * 16.67}' y='${y0}' width='16.67' height='50' fill='${fill}' stroke='#a98057' stroke-width='1'/>`;
      }
    }
    return s;
  } },
  tile: { c: '#d6e1dd', size: '50%', svg: () =>
    `<rect x='0' y='0' width='50' height='50' fill='#dde7e3'/><rect x='50' y='50' width='50' height='50' fill='#dde7e3'/>` +
    `<rect x='50' y='0' width='50' height='50' fill='#ccd9d4'/><rect x='0' y='50' width='50' height='50' fill='#ccd9d4'/>` +
    `<path d='M0 0.8 H100 M0 50 H100 M0.8 0 V100 M50 0 V100' stroke='#b4c4be' stroke-width='1.6'/>` },
  stone: { c: '#c9c2b3', size: '100%', svg: () => {
    const j = '#ada593';
    return `<path d='M0 34 L28 30 L40 0 M28 30 L36 58 L0 62 M36 58 L70 54 L64 30 L28 30 M64 30 L100 34 M64 30 L72 0 M70 54 L100 62 M36 58 L30 100 M70 54 L76 100 M30 82 L0 86 M76 100 L76 100' stroke='${j}' stroke-width='1.8' fill='none' stroke-linejoin='round'/>` +
      `<path d='M40 0 L72 0 L64 30 L28 30 Z' fill='#d1cbbd'/><path d='M36 58 L70 54 L76 100 L30 100 Z' fill='#c2bbab'/><path d='M0 62 L36 58 L30 82 L0 86 Z' fill='#cfc8b9'/>` +
      `<path d='M0 34 L28 30 L40 0 M28 30 L36 58 L0 62 M36 58 L70 54 L64 30 L28 30 M64 30 L100 34 M64 30 L72 0 M70 54 L100 62 M36 58 L30 100 M70 54 L76 100 M30 82 L0 86' stroke='${j}' stroke-width='1.8' fill='none' stroke-linejoin='round'/>`;
  } },
  carpet: { c: '#bf9fa2', size: '25%', svg: () =>
    `<path d='M50 30 L60 50 L50 70 L40 50 Z' fill='#b18d91'/><circle cx='0' cy='0' r='4' fill='#cdb0b2'/><circle cx='100' cy='0' r='4' fill='#cdb0b2'/><circle cx='0' cy='100' r='4' fill='#cdb0b2'/><circle cx='100' cy='100' r='4' fill='#cdb0b2'/>` },
  sand: { c: '#e7d6ab', size: '50%', svg: () =>
    `<path d='M0 30 Q25 22 50 30 T100 30 M0 75 Q25 67 50 75 T100 75' stroke='#ddc897' stroke-width='1.6' fill='none'/>` +
    tileFrom(19, 14, (r) => `<circle cx='${n(4 + r() * 92)}' cy='${n(4 + r() * 92)}' r='${n(0.9 + r() * 1.1)}' fill='#cfb882'/>`) },
  snow: { c: '#eef2f5', size: '50%', svg: () =>
    tileFrom(31, 10, (r, i) => `<circle cx='${n(5 + r() * 90)}' cy='${n(5 + r() * 90)}' r='${n(1 + r() * 1.6)}' fill='${i % 3 ? '#dce5ee' : '#ffffff'}'/>`) +
    `<path d='M30 30 l0 8 M26 34 l8 0 M72 70 l0 8 M68 74 l8 0' stroke='#d0dce8' stroke-width='1.4' stroke-linecap='round'/>` },
  concrete: { c: '#c2c1bc', size: '50%', svg: () =>
    tileFrom(43, 22, (r, i) => `<circle cx='${n(3 + r() * 94)}' cy='${n(3 + r() * 94)}' r='${n(0.7 + r() * 1.2)}' fill='${i % 2 ? '#afaea8' : '#d3d2cd'}'/>`) +
    `<path d='M62 18 l9 6 l4 9' stroke='#b0afa9' stroke-width='1' fill='none'/>` },
  deck: { c: '#ab9b83', size: '100%', svg: () => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const x = i * 20;
      s += `<rect x='${x}' y='0' width='20' height='100' fill='${['#ae9e86', '#a6957c', '#b2a38c', '#a9987f', '#ae9e86'][i]}'/>`;
      s += `<rect x='${x}' y='0' width='1.6' height='100' fill='#8c7c66'/>`;
      s += `<circle cx='${x + 6}' cy='${(i * 37) % 100 + 6}' r='1.1' fill='#7d6e5a'/><circle cx='${x + 14}' cy='${(i * 37) % 100 + 6}' r='1.1' fill='#7d6e5a'/>`;
    }
    return s;
  } },
  marble: { c: '#ece7e0', size: '100%', svg: () =>
    `<path d='M0 22 C20 30 30 10 50 18 S80 40 100 22' stroke='#d2c9bd' stroke-width='1.6' fill='none'/>` +
    `<path d='M0 70 C18 62 34 84 56 72 S84 60 100 70' stroke='#d9d1c6' stroke-width='1.2' fill='none'/>` +
    `<path d='M50 18 C46 34 60 46 56 72' stroke='#ddd5ca' stroke-width='1' fill='none'/>` +
    `<path d='M0 0 H100 M0 0 V100' stroke='#ddd6cc' stroke-width='1.2'/>` },
  gravel: { c: '#cdc0a8', size: '50%', svg: () =>
    tileFrom(57, 26, (r, i) => {
      const x = 6 + r() * 88, y = 6 + r() * 88, rx = 2 + r() * 2.6, ry = 1.6 + r() * 2;
      return `<ellipse cx='${n(x)}' cy='${n(y)}' rx='${n(rx)}' ry='${n(ry)}' transform='rotate(${Math.round(r() * 180)} ${n(x)} ${n(y)})' fill='${['#b9ab92', '#ddd2bd', '#a99c86', '#c7b89c'][i % 4]}'/>`;
    }) },
};

const floorCache = {};

export function floorColor(floor) {
  return FLOORS[floor] ? FLOORS[floor].c : '#eadfca';
}

export function floorCSS(floor) {
  const f = Object.prototype.hasOwnProperty.call(FLOORS, floor) ? FLOORS[floor] : null;
  if (!f) return '#eadfca';
  if (!floorCache[floor]) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><rect width='100' height='100' fill='${f.c}'/>${f.svg()}</svg>`;
    floorCache[floor] = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${f.size} ${f.size} repeat, ${f.c}`;
  }
  return floorCache[floor];
}

// --------------------------------------------------------------- les portraits

const SKINS = ['#f7dcc6', '#efc39f', '#dca47b', '#bb7f55', '#8e5839', '#5f3b27'];
const HAIR_COLORS = ['#2a2422', '#5a3925', '#8f5730', '#d8b46a', '#ebe2c8', '#b4502c', '#9b9ba2', '#4e5f8a'];
const BGS = ['#cfe0dc', '#efd3cf', '#f0e0b0', '#d4e0c2', '#ddd3ea', '#c9d7e8', '#ebc9ae', '#e3ddd1'];
const CLOTHES = ['#2f6f73', '#b3262f', '#3d4a6b', '#c8973a', '#5b7d4f', '#6b4f7a', '#8a5a3a', '#44475a', '#d27b5a', '#7d8a96'];
const ACCESSORIES = ['none', 'glasses', 'hat', 'cap', 'beard', 'moustache', 'earrings', 'scarf', 'bow'];

export const LOOK_OPTIONS = {
  skin: SKINS.length,
  hair: 10,
  hairColor: HAIR_COLORS.length,
  accessory: ACCESSORIES.slice(),
  bg: BGS.length,
};

function shade(hex, amt) {
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function clampInt(v, max, fallback) {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x >= 0 && x < max ? x : fallback;
}

function deriveLook(person) {
  const name = String((person && (person.name || person.id)) || '?');
  const g = person && person.gender;
  const r = rng(hash(name.toLowerCase()) ^ 0x9e3779b9);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const hairF = [2, 3, 4, 6, 9, 5, 8, 0];
  const hairM = [0, 1, 7, 8, 5, 4, 6, 0];
  const accF = ['none', 'glasses', 'hat', 'earrings', 'scarf', 'bow', 'cap', 'earrings'];
  const accM = ['none', 'glasses', 'hat', 'cap', 'beard', 'moustache', 'scarf', 'bow', 'beard'];
  const look = {
    skin: Math.floor(r() * SKINS.length),
    hair: g === 'f' ? pick(hairF) : g === 'm' ? pick(hairM) : Math.floor(r() * 10),
    hairColor: Math.floor(r() * HAIR_COLORS.length),
    accessory: g === 'f' ? pick(accF) : g === 'm' ? pick(accM) : pick(ACCESSORIES),
    bg: Math.floor(r() * BGS.length),
  };
  return look;
}

export function avatarSVG(person, { size = 96 } = {}) {
  person = person || {};
  const base = deriveLook(person);
  const lk = person.look && typeof person.look === 'object' ? person.look : {};
  const skinI = clampInt(lk.skin, SKINS.length, base.skin);
  const hairI = clampInt(lk.hair, 10, base.hair);
  const hcI = clampInt(lk.hairColor, HAIR_COLORS.length, base.hairColor);
  const bgI = clampInt(lk.bg, BGS.length, base.bg);
  const acc = ACCESSORIES.includes(lk.accessory) ? lk.accessory : base.accessory;
  const name = String(person.name || person.id || '?');
  const r2 = rng(hash('c:' + name.toLowerCase()));
  const cloth = CLOTHES[Math.floor(r2() * CLOTHES.length)];
  const mouthKind = Math.floor(r2() * 4);
  const male = person.gender === 'm';

  const skin = SKINS[skinI], skinD = shade(skin, -0.16), hair = HAIR_COLORS[hcI], hairD = shade(hair, -0.3);
  const bg = BGS[bgI];
  const clipId = uid('clip');
  const S = `stroke="${INK}" stroke-width="2.4"`;
  const HS = `fill="${hair}" ${S}`;
  const out = [];
  const push = (s) => out.push(s);

  // --- arrière des cheveux
  const back = {
    2: `<path d="M27 48 C26 26 38 19 50 19 C62 19 74 26 73 48 L74 66 C67 71 61 70 59 66 L41 66 C39 70 33 71 26 66 Z" ${HS}/>`,
    3: `<path d="M27 46 C25 23 38 18 50 18 C62 18 75 23 73 46 L77 94 C69 98 61 96 58 90 L42 90 C39 96 31 98 23 94 Z" ${HS}/>`,
    4: `<circle cx="50" cy="19" r="11" ${HS}/><path d="M43 20 Q50 15 57 20" fill="none" stroke="${hairD}" stroke-width="1.6"/>`,
    5: `<path d="${blob(50, 40, 31, 13, 5, 0.06)}" ${HS}/>`,
    6: `<path d="M60 25 C80 22 90 42 84 66 C82 74 74 76 74 69 C79 54 76 40 62 36 Z" ${HS}/><circle cx="66" cy="31" r="3.4" fill="#b3262f" ${S}/>`,
    9: [0, 1].map((side) => {
      const x = side ? 73 : 27;
      let s = '';
      for (let i = 0; i < 4; i++) s += `<ellipse cx="${x}" cy="${57 + i * 8.5}" rx="5.6" ry="5" ${HS}/>`;
      return s + `<path d="M${x - 4} ${92} l4 -4 l4 4 Z" fill="#b3262f" ${S}/>`;
    }).join(''),
  };
  if (back[hairI]) push(back[hairI]);

  // --- buste
  push(`<path d="M10 104 C10 83 27 74 50 74 C73 74 90 83 90 104 Z" fill="${cloth}" ${S}/>`);
  push(`<path d="M41 74.5 L50 87 L59 74.5 Z" fill="${skinD}" ${S}/>`);
  push(`<rect x="43" y="58" width="14" height="19" fill="${skinD}" ${S}/>`);
  push(`<path d="M40 76 L50 87 L60 76" fill="none" stroke="${shade(cloth, -0.35)}" stroke-width="2"/>`);
  // oreilles + tête
  push(`<ellipse cx="31" cy="50" rx="4.6" ry="5.6" fill="${skin}" ${S}/><ellipse cx="69" cy="50" rx="4.6" ry="5.6" fill="${skin}" ${S}/>`);
  push(`<ellipse cx="50" cy="47" rx="19" ry="22" fill="${skin}" ${S}/>`);
  // visage
  push(`<ellipse cx="39.5" cy="57" rx="4" ry="2.4" fill="#e07f7f" opacity="0.35"/><ellipse cx="60.5" cy="57" rx="4" ry="2.4" fill="#e07f7f" opacity="0.35"/>`);
  const browC = hcI === 4 ? '#8f8678' : hairD;
  push(`<path d="M38.5 42.5 L46 41.2 M54 41.2 L61.5 42.5" stroke="${browC}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`);
  push(`<circle cx="43" cy="48.5" r="3.1" fill="${INK}"/><circle cx="57" cy="48.5" r="3.1" fill="${INK}"/>`);
  push(`<circle cx="44" cy="47.4" r="1" fill="#fff"/><circle cx="58" cy="47.4" r="1" fill="#fff"/>`);
  push(`<path d="M50 51 L48.3 56 L51.2 56.6" stroke="${shade(skin, -0.32)}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);

  if (acc === 'beard') push(`<path d="M31.5 50 C31 68 40 76.5 50 76.5 C60 76.5 69 68 68.5 50 C66.5 58 63 63.5 57 63.5 C54 60.5 46 60.5 43 63.5 C37 63.5 33.5 58 31.5 50 Z" ${HS}/>`);
  const mouths = [
    `<path d="M44.5 61 Q50 65.5 55.5 61" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    `<path d="M45.5 62 L54.5 62" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
    `<path d="M45 60.5 Q50 66 55 60.5 Z" fill="#8a2f36" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M45 62 Q51 64 55.5 60" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  ];
  if (acc === 'moustache') push(`<path d="M41.5 59.5 C44 56 48.5 56.5 50 58 C51.5 56.5 56 56 58.5 59.5 C55.5 61.5 52.5 60.8 50 59.6 C47.5 60.8 44.5 61.5 41.5 59.5 Z" ${HS} stroke-width="1.6"/>`);
  push(acc === 'moustache' ? mouths[1].replace(/62/g, '63.5') : mouths[mouthKind]);

  // --- avant des cheveux
  const front = {
    0: `<path d="M30 48 C28 26 40 20 52 21 C64 22 72 30 70 48 C68 41 65 36 61 33 C53 36 42 36 34 38 C32 41 31 44 30 48 Z" ${HS}/>`,
    1: `<ellipse cx="44" cy="31" rx="6" ry="3" fill="#fff" opacity="0.35"/><path d="M30.5 52 C29.5 44 31 39 34 36 L36 47 Z M69.5 52 C70.5 44 69 39 66 36 L64 47 Z" ${HS} stroke-width="1.8"/>`,
    2: `<path d="M30 44 C29 27 40 22 50 22 C60 22 71 27 70 44 L69 38 L31 38 Z" ${HS}/>`,
    3: `<path d="M50 23 C40 23 31 30 30 50 L32.5 64 C34 48 38 36 50 27.5 C62 36 66 48 67.5 64 L70 50 C69 30 60 23 50 23 Z" ${HS}/>`,
    4: `<path d="M30 46 C29 27 40 22 50 22 C60 22 71 27 70 46 C66 36 58 31 50 31 C42 31 34 36 30 46 Z" ${HS}/>`,
    5: `<path d="M31 45 C31 31 40 26 50 26 C60 26 69 31 69 45 C64 38 57 35 50 35 C43 35 36 38 31 45 Z" ${HS}/>`,
    6: `<path d="M30 46 C30 26 44 21 54 22 C64 23 71 30 70 46 C66 36 60 30 52 30 C44 32 36 38 30 46 Z" ${HS}/>`,
    7: `<path d="M30 47 L28 31 L35 34 L35 20 L43 28 L48 13 L53 27 L61 17 L62 30 L71 25 L70 47 C66 39 58 35 50 35 C42 35 34 39 30 47 Z" ${HS}/>`,
    8: `<path d="M29 50 C24 24 42 11 58 15 C71 18 77 30 71 48 C68 38 63 33 57 31 C50 39 40 42 31 43 Z" ${HS}/><path d="M38 28 C46 22 56 22 63 27" fill="none" stroke="${hairD}" stroke-width="1.8"/>`,
    9: `<path d="M30 48 C29 27 40 22 50 22 C60 22 71 27 70 48 C67 38 60 30 50 30 C40 30 33 38 30 48 Z" ${HS}/><path d="M50 23 L50 30" stroke="${hairD}" stroke-width="1.8"/>`,
  };
  push(front[hairI]);

  // --- accessoires
  if (acc === 'glasses') push(`<g fill="#ffffff" fill-opacity="0.25" stroke="${INK}" stroke-width="2.2"><circle cx="43" cy="48.5" r="6.4"/><circle cx="57" cy="48.5" r="6.4"/></g><path d="M49.4 48 Q50 46.8 50.6 48 M36.6 47.5 L32 46 M63.4 47.5 L68 46" stroke="${INK}" stroke-width="2" fill="none"/>`);
  if (acc === 'hat') push(`<ellipse cx="50" cy="29.5" rx="31" ry="7" fill="#4a3f3a" ${S}/><path d="M34 29 C33 12 67 12 66 29 Z" fill="#5a4d46" ${S}/><path d="M34.3 23 L65.7 23 L66 28 L34 28 Z" fill="#b3262f" stroke="none"/><path d="M34 29 C33 12 67 12 66 29" fill="none" ${S}/>`);
  if (acc === 'cap') {
    const cc = cloth === '#2f6f73' ? '#b3262f' : '#2f6f73';
    push(`<path d="M30 37 C29 17 71 17 70 37 Z" fill="${cc}" ${S}/><path d="M27 37 C35 43 65 43 73 37 C64 39 36 39 27 37 Z" fill="${shade(cc, -0.3)}" ${S}/><circle cx="50" cy="20" r="2.4" fill="${shade(cc, -0.3)}" ${S} stroke-width="1.4"/><path d="M50 21 L50 37" stroke="${shade(cc, -0.25)}" stroke-width="1.4"/>`);
  }
  if (acc === 'earrings') push(`<circle cx="30.5" cy="58" r="2.8" fill="#c8973a" stroke="${INK}" stroke-width="1.4"/><circle cx="69.5" cy="58" r="2.8" fill="#c8973a" stroke="${INK}" stroke-width="1.4"/>`);
  if (acc === 'scarf') {
    const sc = cloth === '#b3262f' ? '#c8973a' : '#b3262f';
    push(`<path d="M35 69 C42 76 58 76 65 69 L67 78 C59 85 41 85 33 78 Z" fill="${sc}" ${S}/><path d="M54 79 L63 79 L65 99 L55 99 Z" fill="${shade(sc, -0.15)}" ${S}/><path d="M38 75 L62 75" stroke="${shade(sc, 0.3)}" stroke-width="1.6" stroke-dasharray="3 3"/>`);
  }
  if (acc === 'bow') {
    if (male) push(`<path d="M50 80 L39 74.5 L39 85.5 Z M50 80 L61 74.5 L61 85.5 Z" fill="#b3262f" ${S}/><rect x="47" y="77" width="6" height="6" rx="1.5" fill="#8f1e26" ${S} stroke-width="1.8"/>`);
    else push(`<path d="M64 24 L56 17 L55 30 Z M64 24 L74 18 L73 31 Z" fill="#b3262f" ${S}/><circle cx="64" cy="24" r="3.2" fill="#8f1e26" ${S} stroke-width="1.8"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="alibi-avatar" role="img" aria-label="${esc(name)}">` +
    `<defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="46.5"/></clipPath></defs>` +
    `<circle cx="50" cy="50" r="47" fill="${bg}"/>` +
    `<circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="5"/>` +
    `<g clip-path="url(#${clipId})" stroke-linejoin="round">${out.join('')}</g>` +
    `<circle cx="50" cy="50" r="47" fill="none" stroke="${INK}" stroke-width="3"/>` +
    `</svg>`;
}
