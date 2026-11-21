// Alibi — portraits « Cartoon franc ».
// Module pur (aucun DOM) : avatarSVG(person, { size, color }) renvoie une chaîne SVG autonome.
// Buste de face dans un médaillon rond : grosse tête ronde, grands yeux à reflet, sourcils expressifs,
// contours bleu nuit épais, aplats avec une teinte d'ombre découpée. Pas de <filter> ; ids uniques par appel.

import { INK } from './palette.js';

// ------------------------------------------------------------------ utilitaires
const n = (v) => Math.round(v * 10) / 10;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
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

function shade(hex, amt) {
  const v = parseInt(String(hex).slice(1), 16);
  if (!Number.isFinite(v)) return hex;
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

const isHex = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);

const UID_PREFIX = 'ap' + Math.floor(Math.random() * 46656).toString(36);
let uidCounter = 0;

// Ellipse en chemin (pour pouvoir la découper, la décaler, l'unir).
const ell = (cx, cy, rx, ry = rx) =>
  `M${n(cx - rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`;

// ------------------------------------------------------------------ catalogue
const SKINS = ['#FFE3CC', '#FFD0A6', '#F0B583', '#D28E5A', '#A8693F', '#6F4329'];
const HAIR_COLORS = ['#3B3552', '#5B3423', '#94502A', '#FFCF5A', '#F3EEE6', '#E8642F', '#B9B6CF', '#6B7FE6'];
// Fonds de médaillon quand aucune couleur de personnage n'est fournie : { pastel, main }.
const BGS = [
  { pastel: '#CFF3E5', main: '#4FCFA3' },
  { pastel: '#FFD9D4', main: '#FF6B5E' },
  { pastel: '#FFEDB8', main: '#FFC83D' },
  { pastel: '#E6F5C4', main: '#A6D94A' },
  { pastel: '#E8DCFF', main: '#B58CFF' },
  { pastel: '#D3ECFF', main: '#57B8FF' },
  { pastel: '#FFE1C2', main: '#FF9F45' },
  { pastel: '#FFDDEE', main: '#FF8FC7' },
];
const CLOTHES = ['#FF6B5E', '#57B8FF', '#4FCFA3', '#FFC83D', '#B58CFF', '#FF8FC7', '#A6D94A', '#FF9F45', '#35C6D9', '#4A5296', '#FFF6E3'];
const ACCESSORIES = ['none', 'glasses', 'hat', 'cap', 'beard', 'moustache', 'earrings', 'scarf', 'bow'];
const HAIR_COUNT = 10;

export const LOOK_OPTIONS = {
  skin: SKINS.length,
  hair: HAIR_COUNT,
  hairColor: HAIR_COLORS.length,
  accessory: ACCESSORIES.slice(),
  bg: BGS.length,
};

function clampInt(v, max, fallback) {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x >= 0 && x < max ? x : fallback;
}

// Apparence déterministe tirée du prénom (même tirage que la version précédente).
function deriveLook(person) {
  const name = String((person && (person.name || person.id)) || '?');
  const g = person && person.gender;
  const r = rng(hash(name.toLowerCase()) ^ 0x9e3779b9);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const hairF = [2, 3, 4, 6, 9, 5, 8, 0];
  const hairM = [0, 1, 7, 8, 5, 4, 6, 0];
  const accF = ['none', 'glasses', 'hat', 'earrings', 'scarf', 'bow', 'cap', 'earrings'];
  const accM = ['none', 'glasses', 'hat', 'cap', 'beard', 'moustache', 'scarf', 'bow', 'beard'];
  return {
    skin: Math.floor(r() * SKINS.length),
    hair: g === 'f' ? pick(hairF) : g === 'm' ? pick(hairM) : Math.floor(r() * HAIR_COUNT),
    hairColor: Math.floor(r() * HAIR_COLORS.length),
    accessory: g === 'f' ? pick(accF) : g === 'm' ? pick(accM) : pick(ACCESSORIES),
    bg: Math.floor(r() * BGS.length),
  };
}

// ------------------------------------------------------------------ dessin
// Coiffures (mêmes indices que le contrat d'origine) :
// 0 courte à raie · 1 dégarnie · 2 carré · 3 longs · 4 chignon · 5 afro · 6 queue de cheval
// 7 hérissés · 8 banane · 9 nattes
// Ordonnée du bord du chapeau / de la casquette selon la coiffure (les volumineuses le soulèvent).
const HAT_Y = { 0: 37, 1: 38, 2: 35, 3: 35, 4: 36, 5: 27, 6: 36, 7: 33, 8: 30, 9: 36 };

const SW = 3.2; // contour principal (sur 100)
// Le buste est grossi d'un dixième autour du visage pour rester lisible en jeton de 30 px.
const ZOOM = 'translate(50 58) scale(1.1) translate(-50 -58)';

export function avatarSVG(person, { size = 96, color } = {}) {
  person = person && typeof person === 'object' ? person : {};
  const base = deriveLook(person);
  const lk = person.look && typeof person.look === 'object' ? person.look : {};
  const skinI = clampInt(lk.skin, SKINS.length, base.skin);
  const hairI = clampInt(lk.hair, HAIR_COUNT, base.hair);
  const hcI = clampInt(lk.hairColor, HAIR_COLORS.length, base.hairColor);
  const bgI = clampInt(lk.bg, BGS.length, base.bg);
  const acc = ACCESSORIES.includes(lk.accessory) ? lk.accessory : base.accessory;
  const name = String(person.name || person.id || '?');
  const male = person.gender === 'm';
  const px = Number(size);
  const sizeAttr = Number.isFinite(px) && px > 0 ? n(px) : 96;

  // expression et vêtement : tirés du prénom (stables pour une même personne)
  const r2 = rng(hash('c:' + name.toLowerCase()));
  let cloth = CLOTHES[Math.floor(r2() * CLOTHES.length)];
  const mouthKind = Math.floor(r2() * 5);
  const browKind = Math.floor(r2() * 4);
  const lookDir = [-1, 0, 1][Math.floor(r2() * 3)];
  const accentI = Math.floor(r2() * 4);

  // médaillon
  const bgSet = BGS[bgI];
  const ringMain = color && isHex(color.main) ? color.main : bgSet.main;
  const disc = color && isHex(color.pastel) ? color.pastel : bgSet.pastel;
  if (cloth.toLowerCase() === ringMain.toLowerCase()) cloth = CLOTHES[(CLOTHES.indexOf(cloth) + 3) % CLOTHES.length];

  const skin = SKINS[skinI], skinD = shade(skin, -0.17);
  const hair = HAIR_COLORS[hcI], hairD = shade(hair, hcI === 4 ? -0.16 : -0.3), hairL = shade(hair, 0.45);
  const clothD = shade(cloth, cloth === '#FFF6E3' ? -0.14 : -0.24);
  // couleur d'accent (nœud, bandeau, écharpe, casquette) : franche, différente du vêtement et de l'anneau
  const ACCENTS = ['#FF6B5E', '#57B8FF', '#FFC83D', '#4FCFA3', '#B58CFF', '#FF8FC7'];
  let accent = ACCENTS[accentI];
  for (let k = 0; k < ACCENTS.length && (accent === cloth || accent.toLowerCase() === ringMain.toLowerCase()); k++) {
    accent = ACCENTS[(accentI + k + 1) % ACCENTS.length];
  }
  const accentD = shade(accent, -0.25);

  const id = `${UID_PREFIX}-${(++uidCounter).toString(36)}`;
  let clipN = 0;
  const out = [];
  const push = (s) => out.push(s);

  // Forme en aplat avec ombre découpée (bas-droite) et contour extérieur bleu nuit.
  // `d` peut réunir plusieurs sous-chemins (union) : le contour est tracé dessous, seul le bord externe reste.
  function shaded(d, fill, dark, { dx = -3, dy = -2.6, sw = SW, hi } = {}) {
    const cid = `${id}-c${++clipN}`;
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(sw * 2)}" stroke-linejoin="round"/>` +
      `<clipPath id="${cid}"><path d="${d}"/></clipPath>` +
      `<path d="${d}" fill="${dark}"/>` +
      `<g clip-path="url(#${cid})"><path d="${d}" fill="${fill}" transform="translate(${dx} ${dy})"/>${hi || ''}</g>`;
  }
  const line = (d, w = 2.6, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---------------------------------------------------------------- cheveux : arrière
  const HEAD = ell(50, 55, 19.5, 21);
  const hairHi = (d) => line(d, 2.6, hairL);
  const back = {
    2: 'M27 54 C25 30 35 25 50 25 C65 25 75 30 73 54 L74 77 C66 80 60 79 58 75 L42 75 C40 79 34 80 26 77 Z',
    3: 'M28 52 C25 30 36 24 50 24 C64 24 75 30 72 52 L78 98 C68 102 60 98 58 92 L42 92 C40 98 32 102 22 98 Z',
    5: [ell(50, 27, 13), ell(36, 32, 12), ell(64, 32, 12), ell(28, 45, 11), ell(72, 45, 11), ell(27, 58, 9.5), ell(73, 58, 9.5), ell(50, 40, 22)].join(' '),
    6: 'M60 30 C80 24 92 40 88 60 C86 72 80 80 74 84 C76 72 78 60 72 48 C70 42 66 38 60 37 Z',
  };
  if (hairI === 4 && acc !== 'hat' && acc !== 'cap') {
    push(shaded(ell(50, 24, 10), hair, hairD, { dx: -2.4, dy: -2 }));
    push(line('M43 26 Q50 21 57 26', 2.2, hairD));
  }
  if (hairI === 9) {
    for (const side of [-1, 1]) {
      const x = 50 + side * 22;
      const d = [0, 1, 2, 3].map((i) => ell(x + side * i * 0.8, 60 + i * 8, 5.6, 5)).join(' ');
      push(shaded(d, hair, hairD, { dx: -1.8, dy: -1.6, sw: 2.6 }));
      push(line(`M${x - 3} 64 Q${x} 66 ${x + 3} 64 M${x - 2.5} 72 Q${x + 0.6} 74 ${x + 3.5} 72`, 1.8, hairD));
      // élastique
      push(`<circle cx="${n(x + side * 3)}" cy="88" r="3.4" fill="${accent}" stroke="${INK}" stroke-width="2.2"/>`);
    }
  }
  if (back[hairI]) push(shaded(back[hairI], hair, hairD, { dx: -3.4, dy: -2.4 }));
  if (hairI === 6) push(`<circle cx="64" cy="37" r="4.4" fill="${accent}" stroke="${INK}" stroke-width="2.4"/>`);

  // ---------------------------------------------------------------- buste
  push(`<rect x="43.5" y="68" width="13" height="15" fill="${skinD}" stroke="${INK}" stroke-width="${SW}"/>`);
  push(shaded('M13 106 C14 86 28 79 50 79 C72 79 86 86 87 106 Z', cloth, clothD, { dx: -5, dy: -1 }));
  push(`<path d="M42 79.6 L50 88 L58 79.6 Z" fill="${skinD}"/>`);
  push(line('M41 80 L50 89 L59 80', 2.6));

  // écharpe / nœud papillon (sous le menton)
  if (acc === 'bow' && male) {
    push(shaded('M50 84 L39 78 L39 90 Z M50 84 L61 78 L61 90 Z', accent, accentD, { dx: -1.6, dy: -1.6, sw: 2.6 }));
    push(`<rect x="46.5" y="80.5" width="7" height="7" rx="2.2" fill="${accentD}" stroke="${INK}" stroke-width="2.4"/>`);
  }

  // ---------------------------------------------------------------- tête
  const earY = 58;
  push(`<circle cx="31" cy="${earY}" r="4.6" fill="${skin}" stroke="${INK}" stroke-width="${SW}"/><circle cx="69" cy="${earY}" r="4.6" fill="${skinD}" stroke="${INK}" stroke-width="${SW}"/>`);
  push(line(`M30 56 Q32 58 30.5 60.5`, 1.8, skinD));
  push(shaded(HEAD, skin, skinD, { dx: -3.4, dy: -2.4 }));
  if (hairI === 1) push(line('M40 40 Q45 36.5 51 37', 3, shade(skin, 0.55))); // reflet du crâne

  // barbe (sous la bouche)
  if (acc === 'beard') {
    push(shaded('M30.5 54 C29.5 72 38 82 50 82 C62 82 70.5 72 69.5 54 C67 62 63 66 58 66.5 C55 63.5 45 63.5 42 66.5 C37 66 33 62 30.5 54 Z', hair, hairD, { dx: -2.4, dy: -2.2, sw: 2.8 }));
    push(`<path d="M44 68.4 Q50 66 56 68.4 Q55 73.6 50 73.6 Q45 73.6 44 68.4 Z" fill="${skinD}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`);
  }

  if (acc === 'scarf') {
    const st = shade(accent, 0.5);
    push(shaded('M58 80 L67 79 L70 104 L58 104 Z', accentD, shade(accent, -0.4), { dx: -2, dy: 0, sw: 2.8 }));
    push(shaded('M29 72 C39 81 61 81 71 72 L73 82 C62 93 38 93 27 82 Z', accent, accentD, { dx: 0, dy: -2.6, sw: 2.8 }));
    push(line('M34 80 L33 86 M42 83 L41.5 89 M50 84 L50 90 M58 83 L58.5 89 M66 80 L67 86', 2.4, st));
  }

  // ---------------------------------------------------------------- visage
  push(`<ellipse cx="36" cy="65" rx="3.8" ry="2.8" fill="#FF8C84" opacity="0.6"/><ellipse cx="64" cy="65" rx="3.8" ry="2.8" fill="#FF8C84" opacity="0.6"/>`);
  // yeux : grands, ronds, pupille + reflet
  const ex = lookDir * 1.2;
  for (const x of [42.5, 57.5]) {
    push(`<circle cx="${x}" cy="56" r="5.6" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4"/>`);
    push(`<circle cx="${n(x + ex)}" cy="56.6" r="3.1" fill="${INK}"/>`);
    push(`<circle cx="${n(x + ex - 1.1)}" cy="55.3" r="1.15" fill="#FFFFFF"/>`);
  }
  // sourcils
  const BROWS = [
    'M37 48 Q41.5 44.5 46.5 46.5 M53.5 46.5 Q58.5 44.5 63 48',
    'M37 45.5 Q41.5 41.5 46.5 43.5 M53.5 43.5 Q58.5 41.5 63 45.5',
    'M37 45.5 L46.5 48.6 M63 45.5 L53.5 48.6',
    'M37 47.6 Q41.5 45.6 46.5 47.4 M53.5 44 Q58.5 41.4 63 44.6',
  ];
  const browC = hcI === 4 || hcI === 3 ? shade(hair, -0.45) : INK;
  push(line(BROWS[browKind], 3.2, browC));
  // nez
  push(line('M48.6 62 Q50 63.6 51.4 62', 2.2, shade(skin, -0.38)));
  // bouche / moustache
  const MOUTHS = [
    line('M44.5 67.5 Q50 72 55.5 67.5', 2.8),
    `<path d="M44 67 Q50 68 56 67 Q55.2 74 50 74 Q44.8 74 44 67 Z" fill="#C8414F" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M47 72.4 Q50 70.6 53 72.4" fill="none" stroke="#FF8C84" stroke-width="2" stroke-linecap="round"/>`,
    line('M45.5 69 H54.5', 2.8),
    line('M45 69.4 Q51 70.8 55.6 66.6', 2.8),
    `<ellipse cx="50" cy="69.4" rx="2.6" ry="3" fill="#C8414F" stroke="${INK}" stroke-width="2.2"/>`,
  ];
  if (acc === 'moustache') {
    push(line('M46 72.4 Q50 74.4 54 72.4', 2.6));
    push(shaded('M37.5 67.5 C38.5 61.5 46 60.5 50 64.5 C54 60.5 61.5 61.5 62.5 67.5 C60.5 65.5 58 66.5 56 68 C53.5 69.4 51.5 68.6 50 67.4 C48.5 68.6 46.5 69.4 44 68 C42 66.5 39.5 65.5 37.5 67.5 Z', hair, hairD, { dx: -1.4, dy: -1.6, sw: 2.6 }));
  } else if (acc === 'beard') {
    push(line('M46.5 70 Q50 71.6 53.5 70', 2.4));
  } else {
    push(MOUTHS[mouthKind]);
  }

  // ---------------------------------------------------------------- cheveux : avant
  const FRONT = {
    0: 'M30.5 56 C28 36 36 29 50 29 C64 29 72 36 69.5 56 C68.5 48 66.5 44 63.5 41 C55 45 43 45 35.5 41 C33.5 45 31.6 50 30.5 56 Z',
    1: 'M30 62 C27 54 28 47 32.5 43 C33.5 50 34 55 34.6 61 Z M70 62 C73 54 72 47 67.5 43 C66.5 50 66 55 65.4 61 Z',
    2: 'M30 52 C29 33 38 28.5 50 28.5 C62 28.5 71 33 70 52 L69 45.5 C60 47.4 40 47.4 31 45.5 Z',
    3: 'M50 29 C37 29 30 37 30 56 L33.4 70 C33 52 38 41 50 33.5 C62 41 67 52 66.6 70 L70 56 C70 37 63 29 50 29 Z',
    4: 'M30.5 55 C29 33 38 30 50 30 C62 30 71 33 69.5 55 C67 42 60 37.5 50 37.5 C40 37.5 33 42 30.5 55 Z',
    5: 'M32 50 C34 38 40 35.5 50 36 C60 35.5 66 38 68 50 C61 43.5 56 44.5 50 42.5 C44 44.5 39 43.5 32 50 Z',
    6: 'M30.5 56 C28 36 37 29 51 29 C64 29 72 36 69.5 54 C67 46 64 42 60 39 C52 44.5 42 41 36.5 38 C34 43 32 48 30.5 56 Z',
    7: 'M30.5 55 L26.5 35 L34.5 37.5 L32.5 22 L42 30.5 L47 14 L53.5 29 L62.5 18 L63.5 32 L73 27 L69.5 55 C66.5 44 59 40.5 50 40.5 C41 40.5 33.5 44 30.5 55 Z',
    8: 'M30.5 56 C27 38 32 28 42 26 C46 16 60 13 70 19 C77 23 76 31 70 33 C72.5 40 71 48 69.5 56 C68 48 65.5 42.5 61 38.5 C55 41 45 43.5 35 41.5 C33 45 31.5 50 30.5 56 Z',
    9: 'M30.5 56 C29 33 38 29.5 50 29.5 C62 29.5 71 33 69.5 56 C67 43 61 37.5 50 37 C39 37.5 33 43 30.5 56 Z',
  };
  const HI = {
    0: hairHi('M40 33.5 Q45 31.5 51 31.6'), 2: hairHi('M38 33.5 Q44 31 51 31'), 3: hairHi('M39 34.5 Q44 32 49 31.6'),
    4: hairHi('M38 35 Q44 32.6 50 32.6'), 6: hairHi('M39 33.4 Q45 31.4 51 31.6'), 7: hairHi('M44 33 L47 24'),
    8: hairHi('M45 23 Q54 17 64 20'), 9: hairHi('M38 35 Q44 32.4 50 32.4'),
  };
  push(shaded(FRONT[hairI], hair, hairD, { dx: -2.6, dy: -2.4, sw: 2.9, hi: HI[hairI] || '' }));
  if (hairI === 0) push(line('M44 30.5 Q40.5 35 39.5 41', 2.2, hairD));
  if (hairI === 3 || hairI === 9) push(line('M50 30 L50 34', 2.2, hairD));
  if (hairI === 8) push(line('M44 27 Q54 22 64 26', 2, hairD));
  if (hairI === 4) push(line('M40 35 Q45 33 50 33 M50 33 Q55 33 60 35', 1.8, hairD));

  // ---------------------------------------------------------------- accessoires (dans le médaillon)
  if (acc === 'glasses') {
    push(`<g fill="#FFFFFF" fill-opacity="0.35" stroke="${INK}" stroke-width="2.8"><circle cx="42.5" cy="56" r="7.6"/><circle cx="57.5" cy="56" r="7.6"/></g>`);
    push(line('M49.6 54.6 Q50 53.2 50.4 54.6 M35 54.4 L30.6 52.6 M65 54.4 L69.4 52.6', 2.6));
    push(line('M38.6 52.6 Q40 51 42 50.8 M53.6 52.6 Q55 51 57 50.8', 1.8, '#FFFFFF'));
  }
  if (acc === 'earrings') {
    for (const x of [30, 70]) {
      push(`<circle cx="${x}" cy="${earY + 9}" r="4.4" fill="none" stroke="${INK}" stroke-width="5.4"/><circle cx="${x}" cy="${earY + 9}" r="4.4" fill="none" stroke="#FFC83D" stroke-width="2.4"/>`);
    }
  }
  if (acc === 'bow' && !male) {
    push(shaded('M64 34 L55 26 L54 41 Z M64 34 L75 27 L74 42 Z', accent, accentD, { dx: -1.4, dy: -1.6, sw: 2.6 }));
    push(`<circle cx="64" cy="34" r="3.8" fill="${accentD}" stroke="${INK}" stroke-width="2.4"/>`);
  }

  // ---------------------------------------------------------------- composition
  const clipId = `${id}-m`;
  let hatOut = '';
  const hy = HAT_Y[hairI] ?? 36;
  if (acc === 'hat') {
    const hc = '#4A4E8A', hcD = shade(hc, -0.3);
    hatOut += shaded(`M33.5 ${hy + 1} C33 ${hy - 22} 67 ${hy - 22} 66.5 ${hy + 1} Z`, hc, hcD, { dx: -2.6, dy: -1, sw: 2.9,
      hi: `<rect x="30" y="${hy - 7}" width="40" height="6.6" fill="${accent}"/>` + line(`M38 ${hy - 12} Q40 ${hy - 17} 45 ${hy - 18}`, 2.6, '#7C82C4') });
    hatOut += line(`M33.6 ${hy - 7} H66.4 M33.6 ${hy - 0.4} H66.4`, 2.2);
    hatOut += shaded(ell(50, hy + 1.5, 30, 6.2), hc, hcD, { dx: 0, dy: -1.8, sw: 2.9 });
  }
  if (acc === 'cap') {
    const cc = accent, ccD = accentD;
    hatOut += shaded(`M30 ${hy + 4} C29 ${hy - 20} 71 ${hy - 20} 70 ${hy + 4} Z`, cc, ccD, { dx: -3, dy: -1.4, sw: 2.9,
      hi: line(`M37 ${hy - 6} Q40 ${hy - 12} 46 ${hy - 14}`, 2.6, shade(cc, 0.5)) });
    hatOut += line(`M50 ${hy - 15} V${hy + 3}`, 2);
    hatOut += `<circle cx="50" cy="${hy - 15.4}" r="2.6" fill="${ccD}" stroke="${INK}" stroke-width="2"/>`;
    hatOut += shaded(`M25 ${hy + 3} C36 ${hy + 16} 64 ${hy + 16} 75 ${hy + 3} C64 ${hy + 7} 36 ${hy + 7} 25 ${hy + 3} Z`, ccD, shade(cc, -0.42), { dx: 0, dy: -1.6, sw: 2.9 });
  }

  const ringHi = shade(ringMain, 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${sizeAttr}" height="${sizeAttr}" class="alibi-avatar" role="img" aria-label="${esc(name)}">` +
    `<defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="38.5"/></clipPath></defs>` +
    `<circle cx="50" cy="50" r="46.5" fill="${ringMain}" stroke="${INK}" stroke-width="3.6"/>` +
    `<path d="M14.6 38 Q21 17 40.5 10.6" fill="none" stroke="${ringHi}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<circle cx="50" cy="50" r="38.5" fill="${disc}"/>` +
    `<g clip-path="url(#${clipId})" stroke-linejoin="round" stroke-linecap="round"><g transform="${ZOOM}">${out.join('')}</g></g>` +
    `<circle cx="50" cy="50" r="38.5" fill="none" stroke="${INK}" stroke-width="3.4"/>` +
    (hatOut ? `<g transform="${ZOOM}" stroke-linejoin="round" stroke-linecap="round">${hatOut}</g>` : '') +
    `</svg>`;
}
