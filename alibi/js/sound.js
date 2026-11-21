// Alibi — sons synthétisés (Web Audio). Aucun fichier, aucun réseau, aucune dépendance.
// Timbres ronds (marimba, pluck), enveloppes courtes, volume modéré.
// Un seul AudioContext, créé et repris paresseusement au premier geste ; jamais d'exception.

const SETTINGS_KEY = 'alibi:settings';

let enabled = true;
try {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (s && s.sound === false) enabled = false;
} catch { /* rien */ }

let ctx = null;
let master = null;
let noiseBuf = null;
let failed = false;
let lastPlace = 0;

/** Journal des sons demandés alors que le réglage est actif (vérifiable en test). */
export const __log = [];

export function setEnabled(on) { enabled = !!on; }
export function isEnabled() { return enabled; }

const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

function hasGesture() {
  try {
    const ua = navigator.userActivation;
    return !ua || ua.isActive || ua.hasBeenActive;
  } catch { return true; }
}

function ensure() {
  if (failed || !AC) return null;
  if (!ctx) {
    if (!hasGesture()) return null; // pas de contexte avant un geste : le navigateur le bloquerait
    try {
      ctx = new AC();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5200;
      lp.Q.value = 0.4;
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(lp);
      lp.connect(ctx.destination);
    } catch { failed = true; ctx = null; return null; }
  }
  if (ctx.state === 'suspended') {
    try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch { /* rien */ }
  }
  return ctx;
}

/** Contexte audio partagé (ambiances) : créé au premier geste, null avant ou si l'API manque. */
export function audioContext() { try { return ensure(); } catch { return null; } }

// Déverrouillage au premier geste de l'utilisateur.
if (typeof document !== 'undefined') {
  const unlock = () => {
    if (!enabled) return;
    const c = ensure();
    if (c && c.state === 'running') {
      ['pointerdown', 'keydown', 'touchend'].forEach((t) => document.removeEventListener(t, unlock, true));
    }
  };
  ['pointerdown', 'keydown', 'touchend'].forEach((t) => document.addEventListener(t, unlock, true));
}

/* ---------------- briques ---------------- */
const semi = (f, n) => f * 2 ** (n / 12);

/** Note percussive : fondamentale sinus + partiel aigu bref (façon marimba). */
function mallet(f, t, { dur = 0.32, gain = 0.5, bright = 0.22, type = 'sine' } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
  if (bright > 0) {
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 3.98, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(gain * bright, t + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.09, dur));
    o2.connect(g2); g2.connect(master);
    o2.start(t); o2.stop(t + 0.12);
  }
}

/** Pincé doux : triangle filtré qui s'éteint vite. */
function pluck(f, t, { dur = 0.16, gain = 0.35, cutoff = 2600 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f, t);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff / 4), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

/** Glissando sinus (« bloup »). */
function sweep(f0, f1, t, { dur = 0.14, gain = 0.4, type = 'sine' } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

/** Souffle filtré (gomme). */
function swish(t, { dur = 0.16, gain = 0.22, from = 1800, to = 600 } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  const bp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.02);
}

/* ---------------- palette ---------------- */
const C5 = 523.25;
const SOUNDS = {
  tap: (t) => mallet(semi(C5, 7), t, { dur: 0.12, gain: 0.28, bright: 0.12 }),
  note: (t) => { pluck(semi(C5, 19), t, { dur: 0.07, gain: 0.16, cutoff: 4200 }); pluck(semi(C5, 24), t + 0.045, { dur: 0.06, gain: 0.12, cutoff: 4200 }); },
  place: (t) => {
    // très légère variation de hauteur d'une pose à l'autre (± 40 cents), sans jamais répéter la même
    let d;
    do { d = Math.round((Math.random() * 0.8 - 0.4) * 100) / 100; } while (Math.abs(d - lastPlace) < 0.12);
    lastPlace = d;
    const f = semi(C5, d);
    sweep(f * 0.75, f * 1.02, t, { dur: 0.07, gain: 0.18 });
    mallet(f, t + 0.03, { dur: 0.4, gain: 0.5, bright: 0.25 });
    mallet(semi(f, 7), t + 0.1, { dur: 0.36, gain: 0.32, bright: 0.18 });
  },
  remove: (t) => sweep(semi(C5, 5), semi(C5, -7), t, { dur: 0.16, gain: 0.32 }),
  cross: (t) => { pluck(semi(C5, 12), t, { dur: 0.09, gain: 0.22 }); pluck(semi(C5, 9), t + 0.05, { dur: 0.1, gain: 0.18 }); },
  erase: (t) => swish(t),
  undo: (t) => { mallet(semi(C5, 9), t, { dur: 0.14, gain: 0.26, bright: 0.1 }); mallet(semi(C5, 4), t + 0.07, { dur: 0.18, gain: 0.24, bright: 0.1 }); },
  refuse: (t) => { sweep(220, 170, t, { dur: 0.1, gain: 0.34 }); sweep(200, 150, t + 0.11, { dur: 0.12, gain: 0.3 }); },
  hint: (t) => [0, 4, 7, 12].forEach((n, i) => mallet(semi(C5 * 2, n), t + i * 0.06, { dur: 0.22, gain: 0.18, bright: 0.3 })),
  fail: (t) => [7, 5, 2, 0].forEach((n, i) => mallet(semi(C5, n), t + i * 0.12, { dur: 0.28, gain: 0.3, bright: 0.1 })),
  ready: (t) => { mallet(semi(C5, 4), t, { dur: 0.3, gain: 0.34 }); mallet(semi(C5, 7), t + 0.09, { dur: 0.3, gain: 0.34 }); mallet(semi(C5, 12), t + 0.18, { dur: 0.5, gain: 0.38, bright: 0.3 }); },
  accuseWrong: (t) => { mallet(semi(C5, -1), t, { dur: 0.26, gain: 0.3, bright: 0.08 }); mallet(semi(C5, -5), t + 0.14, { dur: 0.34, gain: 0.28, bright: 0.08 }); },
  win: (t) => {
    const seq = [[0, 0], [4, 0.11], [7, 0.22], [12, 0.33]];
    seq.forEach(([n, d]) => mallet(semi(C5, n), t + d, { dur: 0.3, gain: 0.36, bright: 0.25 }));
    [0, 4, 7, 12, 16].forEach((n) => mallet(semi(C5, n), t + 0.5, { dur: 1.05, gain: 0.2, bright: 0.2 }));
    pluck(semi(C5, 24), t + 0.52, { dur: 0.5, gain: 0.12, cutoff: 5000 });
  },
  open: (t) => sweep(semi(C5, -5), semi(C5, 4), t, { dur: 0.12, gain: 0.2 }),
  close: (t) => sweep(semi(C5, 4), semi(C5, -5), t, { dur: 0.12, gain: 0.18 }),
  toggle: (t) => pluck(semi(C5, 14), t, { dur: 0.06, gain: 0.2, cutoff: 3800 }),
};
export const NAMES = Object.keys(SOUNDS);

/** Joue un son de la palette. Ne lève jamais d'exception. */
export function play(name) {
  if (!enabled || !SOUNDS[name]) return false;
  __log.push(name);
  if (__log.length > 300) __log.splice(0, __log.length - 300);
  try {
    const c = ensure();
    if (!c || c.state === 'closed') return false;
    SOUNDS[name](c.currentTime + 0.005);
    return true;
  } catch { return false; }
}
