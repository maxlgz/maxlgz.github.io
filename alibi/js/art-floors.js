// Alibi — sols « Cartoon franc ».
// Module pur (aucun DOM) : floorCSS(floor) renvoie une valeur CSS `background`, floorColor(floor) une couleur hex.
//
// Chaque sol est un carreau SVG périodique (viewBox 0 0 100 100) qui couvre exactement UNE case
// (`0 0 / 100% 100%`). Le motif est raccordé bord à bord : tout ce qui déborde d'un côté est redessiné
// du côté opposé, et les joints posés sur un bord sont tracés des deux côtés à demi-épaisseur.
// Les cases voisines se raccordent donc sans couture, quelle que soit leur taille.
// Teintes pastel, traits dans un ton plus foncé de la teinte du sol (jamais en bleu nuit plein) :
// les objets, jetons et croix restent lisibles par-dessus.

const r1 = (v) => Math.round(v * 10) / 10;

// Dessine `draw(x, y)` en (x, y) et, si la forme (rayon d'encombrement r) déborde du carreau,
// ses copies décalées de ±100 pour qu'elle se raccorde avec la case voisine.
function wrap(x, y, r, draw) {
  let s = '';
  for (const dx of [-100, 0, 100]) {
    if (x + dx + r < 0 || x + dx - r > 100) continue;
    for (const dy of [-100, 0, 100]) {
      if (y + dy + r < 0 || y + dy - r > 100) continue;
      s += draw(r1(x + dx), r1(y + dy));
    }
  }
  return s;
}

// Générateur pseudo-aléatoire déterministe (motifs figés d'un appel à l'autre).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Points répartis (tirage avec distance minimale, sur le tore 100×100 pour un raccord propre).
function scatter(seed, count, minD) {
  const r = rng(seed), out = [];
  for (let tries = 0; out.length < count && tries < 4000; tries++) {
    const x = r() * 100, y = r() * 100;
    const ok = out.every((p) => {
      let dx = Math.abs(p.x - x), dy = Math.abs(p.y - y);
      dx = Math.min(dx, 100 - dx); dy = Math.min(dy, 100 - dy);
      return dx * dx + dy * dy >= minD * minD;
    });
    if (ok) out.push({ x, y, k: r(), k2: r() });
  }
  return out;
}

// ------------------------------------------------------------------ les 12 sols
// c = couleur représentative (floorColor), base = fond du carreau, svg() = motif.

const FLOORS = {
  // Carrelage : damier doux bleu ciel, 4 × 4 carreaux par case.
  tile: {
    c: '#D9EAFF', base: '#E9F4FF',
    svg() {
      let s = '';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if ((i + j) % 2) s += `<rect x='${i * 25}' y='${j * 25}' width='25' height='25' fill='#C8E1FF'/>`;
      }
      // petit reflet sur quelques carreaux clairs
      s += `<path d='M5 9 L12 4 M55 59 L62 54' stroke='#F8FBFF' stroke-width='2.4' stroke-linecap='round'/>`;
      return s;
    },
  },

  // Plancher : lattes miel horizontales, trois par case, joints décalés.
  wood: {
    c: '#FFDE97', base: '#FFE19C',
    svg() {
      const J = '#E0AE55';
      let s = `<rect x='0' y='33.3' width='100' height='33.4' fill='#FFDA8C'/>`;
      s += `<path d='M0 0 H100 M0 33.3 H100 M0 66.7 H100 M0 100 H100' stroke='${J}' stroke-width='2.6'/>`;
      s += `<path d='M70 0 V33.3 M26 33.3 V66.7 M88 66.7 V100' stroke='${J}' stroke-width='2.6'/>`;
      s += `<path d='M10 17 Q22 13 38 17 M78 50 Q86 47 96 50 M38 52 Q46 49 56 52 M20 84 Q32 81 46 84' stroke='#EFC36C' stroke-width='2.2' stroke-linecap='round' fill='none'/>`;
      return s;
    },
  },

  // Parquet : vannerie (blocs de trois lames alternés), caramel.
  parquet: {
    c: '#F6C293', base: '#F9CB9E',
    svg() {
      const J = '#CF8A4C';
      let s = '';
      for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
        const x0 = qx * 50, y0 = qy * 50, horiz = (qx + qy) % 2 === 0;
        for (let k = 0; k < 3; k++) {
          const fill = k === 1 ? '#F3BC86' : '#F9CB9E';
          const a = r1(k * 50 / 3), w = r1(50 / 3);
          s += horiz
            ? `<rect x='${x0}' y='${r1(y0 + a)}' width='50' height='${w}' fill='${fill}'/>`
            : `<rect x='${r1(x0 + a)}' y='${y0}' width='${w}' height='50' fill='${fill}'/>`;
        }
        // nœud / veine sur la lame centrale
        s += horiz
          ? `<path d='M${x0 + 12} ${y0 + 25} Q${x0 + 20} ${y0 + 22.5} ${x0 + 28} ${y0 + 25}' stroke='#E5A66A' stroke-width='2' stroke-linecap='round' fill='none'/>`
          : `<path d='M${x0 + 25} ${y0 + 14} Q${x0 + 22.5} ${y0 + 22} ${x0 + 25} ${y0 + 30}' stroke='#E5A66A' stroke-width='2' stroke-linecap='round' fill='none'/>`;
      }
      // joints : lames
      s += `<path d='M0 16.7 H50 M0 33.3 H50 M50 66.7 H100 M50 83.3 H100 M66.7 0 V50 M83.3 0 V50 M16.7 50 V100 M33.3 50 V100' stroke='${J}' stroke-width='1.8'/>`;
      // joints : blocs (bords à demi-épaisseur)
      s += `<path d='M0 0 H100 M0 50 H100 M0 100 H100 M0 0 V100 M50 0 V100 M100 0 V100' stroke='${J}' stroke-width='2.6'/>`;
      return s;
    },
  },

  // Terrasse : larges lattes verticales de teck rosé, interstices marqués, deux vis par aboutement.
  deck: {
    c: '#F5CBBB', base: '#F8D4C6',
    svg() {
      const J = '#D28A74';
      let s = `<rect x='25' y='0' width='25' height='100' fill='#F4C8B7'/><rect x='75' y='0' width='25' height='100' fill='#F4C8B7'/>`;
      s += `<path d='M0 0 V100 M25 0 V100 M50 0 V100 M75 0 V100 M100 0 V100' stroke='${J}' stroke-width='3.4'/>`;
      [34, 82, 12, 60].forEach((y, i) => {
        const x = i * 25;
        s += `<path d='M${x} ${y} H${x + 25}' stroke='${J}' stroke-width='2.4'/>`;
        s += `<circle cx='${x + 7}' cy='${y + 5}' r='1.8' fill='${J}'/><circle cx='${x + 18}' cy='${y + 5}' r='1.8' fill='${J}'/>`;
      });
      return s;
    },
  },

  // Pierre : moellons arrondis crème, en quinconce (planche validée).
  stone: {
    c: '#E3DACD', base: '#D3C8BA',
    svg() {
      const rows = [
        [[0, 58], [58, 42]],
        [[-22, 40], [18, 34], [52, 26]],
        [[10, 52], [62, 48]],
        [[-14, 36], [22, 34], [56, 30]],
      ];
      let s = '';
      rows.forEach((row, ri) => {
        const y = ri * 25;
        row.forEach(([x, w], k) => {
          const fill = (ri + k) % 2 ? '#E5DCCF' : '#EEE7DC';
          const cx = x + w / 2;
          s += wrap(cx, y + 12.5, w / 2 + 1, (X, Y) =>
            `<rect x='${r1(X - w / 2 + 2)}' y='${r1(Y - 10.5)}' width='${r1(w - 4)}' height='21' rx='6' fill='${fill}'/>` +
            `<path d='M${r1(X - w / 2 + 7)} ${r1(Y - 6)} H${r1(X - w / 2 + 15)}' stroke='#F8F4EE' stroke-width='2.2' stroke-linecap='round'/>`);
        });
      });
      s += `<circle cx='38' cy='9' r='1.8' fill='#C9BCAB'/><circle cx='80' cy='60' r='1.8' fill='#C9BCAB'/><circle cx='18' cy='86' r='1.8' fill='#C9BCAB'/>`;
      return s;
    },
  },

  // Béton : une grande dalle gris bleuté par case, trous de banche, fissure, mouchetis.
  concrete: {
    c: '#DCE1E8', base: '#E1E6EC',
    svg() {
      const J = '#AEB7C4';
      let s = `<path d='M0 0 H100 M0 100 H100 M0 0 V100 M100 0 V100' stroke='${J}' stroke-width='3.4'/>`;
      for (const [x, y] of [[20, 20], [80, 20], [20, 80], [80, 80]]) {
        s += `<circle cx='${x}' cy='${y}' r='3.4' fill='#C6CDD8' stroke='${J}' stroke-width='1.8'/>`;
      }
      s += `<path d='M56 40 L62 47 L59 53 L66 60' stroke='${J}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/>`;
      for (const p of scatter(43, 14, 12)) {
        s += wrap(p.x, p.y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='${r1(1 + p.k)}' fill='${p.k2 > 0.5 ? '#CBD2DC' : '#EEF1F5'}'/>`);
      }
      return s;
    },
  },

  // Marbre : losanges arlequin rose poudré, veines souples.
  marble: {
    c: '#FBE6EC', base: '#FFF5F7',
    svg() {
      let s = '';
      // losanges du ton soutenu : centres (x, y) multiples de 25 avec (x + y) / 25 pair
      for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
        if ((i + j) % 2) continue;
        const x = i * 25, y = j * 25;
        s += `<path d='M${x} ${y - 25} L${x + 25} ${y} L${x} ${y + 25} L${x - 25} ${y} Z' fill='#F6D6E1'/>`;
      }
      s += `<path d='M0 25 L25 0 M0 75 L75 0 M25 100 L100 25 M75 100 L100 75 M0 25 L75 100 M0 75 L25 100 M25 0 L100 75 M75 0 L100 25' stroke='#EDCAD6' stroke-width='1.2'/>`;
      s += `<path d='M0 38 C14 30 22 46 36 40 S58 22 70 32 S88 44 100 38' stroke='#DDA8BB' stroke-width='2' fill='none' stroke-linecap='round'/>`;
      s += `<path d='M36 40 C40 52 32 60 38 72' stroke='#E4B6C6' stroke-width='1.5' fill='none' stroke-linecap='round'/>`;
      s += `<path d='M0 86 C10 80 20 90 30 84 M70 80 C80 72 88 84 100 76' stroke='#E4B6C6' stroke-width='1.5' fill='none' stroke-linecap='round'/>`;
      return s;
    },
  },

  // Gravier : galets ronds cernés, kaki clair.
  gravel: {
    c: '#E2DDBA', base: '#E7E3C4',
    svg() {
      const fills = ['#F4F1DC', '#D9D3A9', '#ECE6C6', '#CFCDA6', '#E2DAB4'];
      let s = '';
      for (const p of scatter(57, 13, 22)) {
        const rx = 6 + p.k * 3, ry = 4.6 + p.k2 * 2.4, a = Math.round(p.k2 * 170);
        const f = fills[Math.floor(p.k * 97) % fills.length];
        s += wrap(p.x, p.y, rx + 2, (X, Y) =>
          `<ellipse cx='${X}' cy='${Y}' rx='${r1(rx)}' ry='${r1(ry)}' transform='rotate(${a} ${X} ${Y})' fill='${f}' stroke='#A9A07A' stroke-width='2'/>`);
      }
      for (const p of scatter(91, 8, 16)) {
        s += wrap(p.x, p.y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='1.3' fill='#B9B28A'/>`);
      }
      return s;
    },
  },

  // Moquette : lilas, fleurettes à quatre pétales en quinconce, points tissés.
  carpet: {
    c: '#E6DBFF', base: '#ECE3FF',
    svg() {
      const flower = (X, Y) =>
        `<g fill='#D0BCFA' stroke='#A487E8' stroke-width='2'>` +
        `<circle cx='${X}' cy='${Y - 7}' r='5.2'/><circle cx='${X + 7}' cy='${Y}' r='5.2'/><circle cx='${X}' cy='${Y + 7}' r='5.2'/><circle cx='${X - 7}' cy='${Y}' r='5.2'/></g>` +
        `<circle cx='${X}' cy='${Y}' r='3.6' fill='#FFEFB8' stroke='#A487E8' stroke-width='2'/>`;
      let s = wrap(50, 50, 14, flower) + wrap(0, 0, 14, flower);
      for (const [x, y] of [[50, 0], [0, 50], [25, 25], [75, 25], [25, 75], [75, 75]]) {
        s += wrap(x, y, 3, (X, Y) => `<circle cx='${X}' cy='${Y}' r='2.2' fill='#BEA5F4'/>`);
      }
      return s;
    },
  },

  // Herbe : menthe, touffes de trois brins (planche validée).
  grass: {
    c: '#C6EFDB', base: '#C9F0DC',
    svg() {
      const tuft = (x, y) => `<path d='M${x - 5} ${y} Q${x - 4} ${y - 7} ${x - 7} ${y - 12} M${x} ${y} Q${x + 1} ${y - 8} ${x + 5} ${y - 12} M${x + 5} ${y} Q${x + 6} ${y - 5} ${x + 10} ${y - 6}'/>`;
      let s = `<g stroke='#6FCDA6' stroke-width='2.8' stroke-linecap='round' fill='none'>`;
      s += tuft(20, 32) + tuft(70, 22) + tuft(44, 76) + tuft(86, 70);
      s += `</g>`;
      s += `<circle cx='52' cy='36' r='2.8' fill='#A6E6CA'/><circle cx='14' cy='64' r='2.8' fill='#A6E6CA'/><circle cx='78' cy='94' r='2.4' fill='#A6E6CA'/>`;
      return s;
    },
  },

  // Sable : ondulations dorées et grains.
  sand: {
    c: '#FFEFC9', base: '#FFF2D2',
    svg() {
      const wave = (y) => `M0 ${y} Q12.5 ${y - 5} 25 ${y} T50 ${y} T75 ${y} T100 ${y}`;
      let s = `<path d='${wave(28)} M0 ${r1(70)} Q12.5 75 25 70 T50 70 T75 70 T100 70' stroke='#EECB86' stroke-width='2.6' fill='none' stroke-linecap='round'/>`;
      for (const p of scatter(19, 16, 11)) {
        if (Math.abs(p.y - 28) < 6 || Math.abs(p.y - 70) < 6) continue;
        s += wrap(p.x, p.y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='${r1(1.1 + p.k * 0.9)}' fill='${p.k2 > 0.4 ? '#E9C07A' : '#FFFAEA'}'/>`);
      }
      return s;
    },
  },

  // Neige : blanc glacé teinté lagon, flocons étoilés.
  snow: {
    c: '#EAF8FB', base: '#F1FBFD',
    svg() {
      const flake = (x, y, r) => {
        let d = '';
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3 + Math.PI / 2;
          const dx = r1(Math.cos(a) * r), dy = r1(Math.sin(a) * r);
          d += `M${r1(x - dx)} ${r1(y - dy)} L${r1(x + dx)} ${r1(y + dy)} `;
        }
        return `<path d='${d.trim()}' stroke='#97D3E2' stroke-width='2.4' stroke-linecap='round'/>`;
      };
      let s = `<path d='M0 58 Q20 50 40 58 T80 58 T100 58 L100 100 L0 100 Z' fill='#E4F5F9'/>`;
      s += flake(26, 26, 7) + flake(74, 76, 7) + flake(80, 30, 4) + flake(18, 78, 4);
      for (const [x, y] of [[50, 12], [52, 46], [40, 90], [94, 52], [6, 42]]) {
        s += `<circle cx='${x}' cy='${y}' r='1.8' fill='#B9E3EE'/>`;
      }
      return s;
    },
  },

  // ---------------------------------------------------------------- extension « plus d'univers »

  // Tôle : plaque gris acier bleuté, larmes en chevrons, rangées de rivets le long des joints.
  metal: {
    c: '#C9D3DF', base: '#CCD5E1',
    svg() {
      const J = '#8D9AB0';
      let s = `<path d='M0 0 H100 M0 100 H100 M0 0 V100 M100 0 V100' stroke='${J}' stroke-width='3.4'/>`;
      s += `<path d='M4 3.6 H96' stroke='#E4EAF2' stroke-width='2.2' stroke-linecap='round'/>`;
      // tôle larmée : petits traits obliques alternés
      let d = '';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = 21 + i * 19.3, y = 21 + j * 19.3, up = (i + j) % 2 === 0;
        d += up ? `M${r1(x - 3.4)} ${r1(y + 3.4)} L${r1(x + 3.4)} ${r1(y - 3.4)} ` : `M${r1(x - 3.4)} ${r1(y - 3.4)} L${r1(x + 3.4)} ${r1(y + 3.4)} `;
      }
      s += `<path d='${d.trim()}' stroke='#A7B3C5' stroke-width='3' stroke-linecap='round'/>`;
      // rivets
      const rivet = (x, y) => `<circle cx='${x}' cy='${y}' r='2.8' fill='#DDE4EE' stroke='${J}' stroke-width='1.6'/><circle cx='${r1(x - 0.8)}' cy='${r1(y - 0.8)}' r='0.9' fill='#FFFFFF'/>`;
      for (const t of [10, 30, 50, 70, 90]) s += rivet(t, 8) + rivet(t, 92);
      for (const t of [30, 50, 70]) s += rivet(8, t) + rivet(92, t);
      return s;
    },
  },

  // Eau : bleu lagon, vaguelettes en arcs décalés et crêtes d'écume.
  water: {
    c: '#AEE6EF', base: '#B3E8F1',
    svg() {
      let s = `<path d='M0 0 H100 V22 Q75 30 50 22 T0 22 Z M0 50 Q25 58 50 50 T100 50 V72 Q75 80 50 72 T0 72 Z' fill='#A5E1EC'/>`;
      const ripple = (x, y) => `<path d='M${r1(x - 13)} ${y} Q${r1(x - 6.5)} ${r1(y - 6)} ${x} ${y} Q${r1(x + 6.5)} ${r1(y - 6)} ${r1(x + 13)} ${y}' stroke='#5DBFD0' stroke-width='2.8' fill='none' stroke-linecap='round'/>` +
        `<path d='M${r1(x - 9.5)} ${r1(y - 5.4)} Q${r1(x - 6.5)} ${r1(y - 7.2)} ${r1(x - 3.5)} ${r1(y - 5.4)}' stroke='#EFFCFE' stroke-width='2.4' fill='none' stroke-linecap='round'/>`;
      for (const [x, y] of [[22, 16], [72, 16], [47, 41], [97, 41], [22, 66], [72, 66], [47, 91], [97, 91]]) {
        s += wrap(x, y, 14, ripple);
      }
      for (const [x, y] of [[8, 30], [60, 56], [36, 80], [86, 4]]) {
        s += wrap(x, y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='1.6' fill='#E6FAFD'/>`);
      }
      return s;
    },
  },

  // Tatami : nattes vert paille en « moulinet » (période 3 × 3 demi-nattes), bordures vert foncé.
  tatami: {
    c: '#DCE7AE', base: '#DDE8B0',
    svg() {
      const u = 100 / 3;
      // [x, y, w, h] en unités ; horizontal si w > h
      const mats = [[0, 0, 2, 1], [2, 0, 1, 2], [1, 2, 2, 1], [0, 1, 1, 2], [1, 1, 1, 1]];
      let s = '';
      mats.forEach(([x, y, w, h], k) => {
        const X = r1(x * u), Y = r1(y * u), W = r1(w * u), H = r1(h * u);
        const horiz = w > h;
        s += `<rect x='${X}' y='${Y}' width='${W}' height='${H}' fill='${k % 2 ? '#D6E3A6' : '#DDE8B0'}'/>`;
        // tissage : traits fins perpendiculaires à la longueur
        let d = '';
        if (horiz) for (let t = X + 6; t < X + W - 3; t += 6.6) d += `M${r1(t)} ${r1(Y + 6)} V${r1(Y + H - 6)} `;
        else for (let t = Y + 6; t < Y + H - 3; t += 6.6) d += `M${r1(X + 6)} ${r1(t)} H${r1(X + W - 6)} `;
        s += `<path d='${d.trim()}' stroke='#CAD99A' stroke-width='1.3'/>`;
        // liserés (heri) sur les grands côtés
        if (k < 4) {
          s += horiz
            ? `<rect x='${X}' y='${Y}' width='${W}' height='4' fill='#A9C27A'/><rect x='${X}' y='${r1(Y + H - 4)}' width='${W}' height='4' fill='#A9C27A'/>`
            : `<rect x='${X}' y='${Y}' width='4' height='${H}' fill='#A9C27A'/><rect x='${r1(X + W - 4)}' y='${Y}' width='4' height='${H}' fill='#A9C27A'/>`;
        }
        s += `<rect x='${X}' y='${Y}' width='${W}' height='${H}' fill='none' stroke='#8FA962' stroke-width='1.6'/>`;
      });
      return s;
    },
  },

  // Damier : grands carreaux crème et lavande ardoise (2 × 2 par case), liseré doux.
  checker: {
    c: '#E3E2EE', base: '#FFF8EC',
    svg() {
      let s = `<rect x='50' y='0' width='50' height='50' fill='#C3C8E6'/><rect x='0' y='50' width='50' height='50' fill='#C3C8E6'/>`;
      s += `<path d='M0 0 H100 M0 50 H100 M0 100 H100 M0 0 V100 M50 0 V100 M100 0 V100' stroke='#ABB1D6' stroke-width='1.6'/>`;
      s += `<path d='M6 9 L13 4 M56 59 L63 54' stroke='#FFFFFF' stroke-width='2.4' stroke-linecap='round'/>`;
      s += `<path d='M56 9 L63 4 M6 59 L13 54' stroke='#D9DCF0' stroke-width='2.4' stroke-linecap='round'/>`;
      return s;
    },
  },

  // Terre battue : ocre, plaques tassées, petits cailloux cernés, grains.
  dirt: {
    c: '#E4C59C', base: '#E7CAA2',
    svg() {
      let s = '';
      for (const p of scatter(73, 5, 34)) {
        const rx = 13 + p.k * 7, ry = 7 + p.k2 * 4;
        s += wrap(p.x, p.y, rx + 1, (X, Y) => `<ellipse cx='${X}' cy='${Y}' rx='${r1(rx)}' ry='${r1(ry)}' fill='#DDBB90'/>`);
      }
      for (const p of scatter(29, 7, 26)) {
        const rx = 3 + p.k * 2.2, ry = 2.4 + p.k2 * 1.4;
        s += wrap(p.x, p.y, rx + 2, (X, Y) =>
          `<ellipse cx='${X}' cy='${Y}' rx='${r1(rx)}' ry='${r1(ry)}' fill='${p.k2 > 0.5 ? '#F3E3C9' : '#D9C2A0'}' stroke='#AE855A' stroke-width='1.7'/>`);
      }
      for (const p of scatter(61, 12, 12)) {
        s += wrap(p.x, p.y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='${r1(0.9 + p.k * 0.8)}' fill='#C29C6E'/>`);
      }
      s += `<path d='M58 30 L64 34 L63 40 M20 70 L27 72' stroke='#C29C6E' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' fill='none'/>`;
      return s;
    },
  },

  // Glace : bleu pervenche pâle, facettes, fêlures étoilées et reflets obliques.
  ice: {
    c: '#DCE7F8', base: '#E1EAF9',
    svg() {
      const J = '#9FB5DF';
      let s = `<path d='M0 0 H44 L30 38 L0 30 Z M100 30 L74 52 L86 100 H100 Z M0 30 V100 H20 L36 64 Z' fill='#D5E1F6'/>`;
      s += `<path d='M56 58 L46 48 M56 58 L70 50 M56 58 L60 72 M56 58 L44 66 M46 48 L42 38 M70 50 L80 46 M60 72 L56 80' stroke='${J}' stroke-width='2' stroke-linecap='round' fill='none'/>`;
      s += `<path d='M14 14 L22 20 L20 27' stroke='${J}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' fill='none'/>`;
      s += `<path d='M66 10 L80 24 M72 8 L82 18 M10 78 L22 90' stroke='#FAFCFF' stroke-width='2.8' stroke-linecap='round'/>`;
      s += `<path d='M0 0 H100 M0 100 H100 M0 0 V100 M100 0 V100' stroke='#C3D2EE' stroke-width='1.6'/>`;
      return s;
    },
  },

  // Sol lunaire : gris perle, cratères ronds (bord clair, creux ombré), poussière.
  moon: {
    c: '#E5E4EA', base: '#E8E7EC',
    svg() {
      const crater = (r) => (X, Y) =>
        `<circle cx='${X}' cy='${Y}' r='${r}' fill='#D2D1DB' stroke='#A9A8B8' stroke-width='2'/>` +
        `<path d='M${r1(X - r * 0.7)} ${r1(Y + r * 0.55)} A${r} ${r} 0 0 0 ${r1(X + r * 0.75)} ${r1(Y + r * 0.5)}' stroke='#F6F6F9' stroke-width='2' fill='none' stroke-linecap='round'/>` +
        `<circle cx='${r1(X - r * 0.2)}' cy='${r1(Y - r * 0.25)}' r='${r1(r * 0.55)}' fill='#C8C7D3'/>`;
      let s = '';
      for (const [x, y, r] of [[28, 30, 11], [76, 70, 8.5], [78, 18, 5], [22, 80, 5.5], [55, 50, 3.6]]) s += wrap(x, y, r + 2, crater(r));
      for (const p of scatter(37, 12, 12)) {
        s += wrap(p.x, p.y, 2, (X, Y) => `<circle cx='${X}' cy='${Y}' r='${r1(0.9 + p.k * 0.9)}' fill='${p.k2 > 0.5 ? '#C6C5D1' : '#F7F7FA'}'/>`);
      }
      return s;
    },
  },

  // Brique : terre cuite en appareil décalé, joints de mortier clair.
  brick: {
    c: '#EDB29A', base: '#F5DFD1',
    svg() {
      let s = '';
      for (let j = 0; j < 4; j++) {
        const off = j % 2 ? 25 : 0;
        for (let i = 0; i < 2; i++) {
          const fill = (i + j) % 3 === 1 ? '#E9A68B' : '#EEB098';
          const cx = off + i * 50 + 25, cy = j * 25 + 12.5;
          s += wrap(cx, cy, 26, (X, Y) =>
            `<rect x='${r1(X - 23.4)}' y='${r1(Y - 10.9)}' width='46.8' height='21.8' rx='2.6' fill='${fill}' stroke='#CF8467' stroke-width='1.6'/>` +
            `<path d='M${r1(X - 18)} ${r1(Y - 6.4)} H${r1(X - 8)}' stroke='#F6CDBC' stroke-width='2.2' stroke-linecap='round'/>`);
        }
      }
      return s;
    },
  },

  // Pavés : petits blocs bombés gris mauve, en rangs décalés.
  cobble: {
    c: '#D6CAD1', base: '#C3B4BE',
    svg() {
      const R = rng(83);
      let s = '';
      const u = 100 / 3;
      for (let j = 0; j < 3; j++) {
        // décalage d'une demi-case une rangée sur deux (rangée 3 → raccord par période verticale de 3 rangs)
        const off = [0, u / 2, u / 4][j];
        for (let i = 0; i < 3; i++) {
          const w = 27.4 + R() * 2.4, h = 26.6 + R() * 2.2, k = R();
          const fill = k > 0.6 ? '#DED3D9' : k > 0.3 ? '#D7CBD2' : '#E5DCE1';
          s += wrap(off + i * u + u / 2, j * u + u / 2, 18, (X, Y) =>
            `<rect x='${r1(X - w / 2)}' y='${r1(Y - h / 2)}' width='${r1(w)}' height='${r1(h)}' rx='10' fill='${fill}' stroke='#A897A2' stroke-width='1.8'/>` +
            `<path d='M${r1(X - w / 2 + 5)} ${r1(Y - 2)} Q${r1(X - w / 2 + 6)} ${r1(Y - h / 2 + 5)} ${r1(X - 1)} ${r1(Y - h / 2 + 4.4)}' stroke='#F4EFF2' stroke-width='2.4' fill='none' stroke-linecap='round'/>`);
        }
      }
      return s;
    },
  },
};

const FALLBACK = '#F3EBDC';
const cache = Object.create(null);
const has = (floor) => typeof floor === 'string' && Object.prototype.hasOwnProperty.call(FLOORS, floor);

export function floorColor(floor) {
  return has(floor) ? FLOORS[floor].c : FALLBACK;
}

export function floorCSS(floor) {
  if (!has(floor)) return FALLBACK;
  if (!cache[floor]) {
    const f = FLOORS[floor];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><rect width='100' height='100' fill='${f.base}'/>${f.svg()}</svg>`;
    cache[floor] = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 100% 100% repeat, ${f.c}`;
  }
  return cache[floor];
}
