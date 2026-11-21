// Alibi — ambiances sonores par lieu, synthétisées en Web Audio.
// Aucun fichier, aucun réseau, aucune dépendance. Un seul AudioContext pour toute l'application
// (celui des effets sonores, voir sound.js), jamais créé avant un geste de l'utilisateur.
//
// Chaque ambiance est une « voix » construite sur n'importe quel contexte (réel ou hors ligne) :
//   build(ctx, id, dest, { start, rng }) → { schedule(t0, t1), fadeIn, fadeOut, dispose, … }
// Les textures continues sont des bruits filtrés et des oscillateurs modulés lentement ; les
// petits événements (oiseau, carillon, crépitement…) et les dérives aléatoires sont planifiés
// sur l'horloge audio, par fenêtres de quelques secondes (une minuterie espacée en direct,
// une seule fenêtre de toute la durée hors ligne).

import { audioContext } from './sound.js';

const SETTINGS_KEY = 'alibi:settings';

export const AMBIENCES = [
  { id: 'sea', label: 'Mer et vagues' },
  { id: 'river', label: 'Rivière, clapotis contre la coque' },
  { id: 'wind', label: 'Vent de montagne ou de banquise' },
  { id: 'birds', label: 'Campagne : brise et oiseaux' },
  { id: 'fire', label: 'Feu de cheminée' },
  { id: 'hall', label: 'Grand hall : rumeur et carillon' },
  { id: 'rooms', label: 'Intérieur calme, horloge' },
  { id: 'kitchen', label: 'Cuisine ou commerce' },
  { id: 'space', label: 'Base spatiale' },
  { id: 'night', label: 'Nuit d’été : grillons' },
  { id: 'music', label: 'Salle de musique' },
  { id: 'pool', label: 'Piscine couverte' },
  { id: 'saloon', label: 'Saloon : piano lointain' },
  { id: 'none', label: 'Silence' },
];
const IDS = new Set(AMBIENCES.map((a) => a.id));
export const isAmbience = (id) => IDS.has(id);

/** Ambiance d'un niveau : son champ `ambience`, sinon déduite de ses sols. */
export function ambienceOf(level) {
  if (level && IDS.has(level.ambience)) return level.ambience;
  return ambienceFromFloors(level);
}
export function ambienceFromFloors(level) {
  const f = new Set(((level && level.rooms) || []).map((r) => r && r.floor));
  if (f.has('water')) return 'sea';
  if (f.has('snow') || f.has('ice')) return 'wind';
  if (f.has('grass')) return 'birds';
  if (f.has('moon') || f.has('metal')) return 'space';
  return 'rooms';
}

/* ------------------------------------------------------------------ bruits */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Durées non rondes et différentes : les boucles de bruit ne se recalent jamais entre elles.
const NOISE_SECONDS = { white: 3.1, pink: 5.3, brown: 6.7 };
const BUFS = new WeakMap();
function noiseBuffers(ctx) {
  let b = BUFS.get(ctx);
  if (b) return b;
  const sr = ctx.sampleRate;
  const rnd = mulberry32(0xA11B1);
  b = {};
  for (const kind of Object.keys(NOISE_SECONDS)) {
    const n = Math.floor(sr * NOISE_SECONDS[kind]);
    const F = Math.floor(sr * 0.12); // fondu enchaîné fin → début : boucle sans couture
    const raw = new Float32Array(n + F);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, br = 0;
    for (let i = 0; i < raw.length; i++) {
      const w = rnd() * 2 - 1;
      if (kind === 'white') raw[i] = w;
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      } else { br = (br + 0.02 * w) / 1.02; raw[i] = br; }
    }
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = raw[i];
    for (let i = 0; i < F; i++) { const k = i / F; d[i] = raw[i] * k + raw[n + i] * (1 - k); }
    let mean = 0;
    for (let i = 0; i < n; i++) mean += d[i];
    mean /= n;
    let ss = 0;
    for (let i = 0; i < n; i++) { d[i] -= mean; ss += d[i] * d[i]; }
    const g = 0.25 / Math.sqrt(ss / n || 1); // toutes les sources au même RMS (≈ −12 dBFS)
    for (let i = 0; i < n; i++) d[i] *= g;
    b[kind] = buf;
  }
  BUFS.set(ctx, b);
  return b;
}

/* ------------------------------------------------------------------ bus de sortie */
// voix → bus (sourdine / coupure) → passe-haut 22 Hz (aucune composante continue) → limiteur → sortie
const BUSES = new WeakMap();
export function busOf(ctx, dest = ctx.destination) {
  let bus = BUSES.get(ctx);
  if (bus) return bus;
  const input = ctx.createGain();
  input.gain.value = 1;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 22; hp.Q.value = 0.6;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -8; lim.knee.value = 2; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.25;
  input.connect(hp); hp.connect(lim); lim.connect(dest);
  bus = { input, nodes: 3 };
  BUSES.set(ctx, bus);
  return bus;
}

/* ------------------------------------------------------------------ voix */
const semi = (f, n) => f * 2 ** (n / 12);
const A3 = 220;

function makeVoice(ctx, dest, { start = ctx.currentTime, rng = Math.random } = {}) {
  const bufs = noiseBuffers(ctx);
  const nodes = new Set(); // nœuds permanents de la voix
  const sources = new Set(); // sources permanentes (à arrêter)
  const live = new Map(); // événements en cours : source → nœuds
  const gens = [];
  const track = (n) => { nodes.add(n); return n; };
  const r = (a, b) => a + (b - a) * rng();
  const pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
  const out = track(ctx.createGain());
  out.gain.value = 0;
  out.connect(dest);
  const mix = track(ctx.createGain());
  mix.connect(out);

  const V = {
    ctx, rng, r, pick, out, mix, start,
    gain(v = 1, to = null) { const g = track(ctx.createGain()); g.gain.value = v; if (to) g.connect(to); return g; },
    filter(type, f, Q = 0.7, to = null) {
      const x = track(ctx.createBiquadFilter());
      x.type = type; x.frequency.value = f; x.Q.value = Q;
      if (to) x.connect(to);
      return x;
    },
    noise(kind, to, rate = 1) {
      const s = track(ctx.createBufferSource());
      s.buffer = bufs[kind]; s.loop = true; s.playbackRate.value = rate;
      s.connect(to);
      s.start(start, r(0, bufs[kind].duration - 0.01));
      sources.add(s);
      return s;
    },
    osc(type, f, to) {
      const o = track(ctx.createOscillator());
      o.type = type; o.frequency.value = f;
      o.connect(to);
      o.start(start);
      sources.add(o);
      return o;
    },
    /** Modulation lente et périodique d'un paramètre (oscillateur basse fréquence). */
    lfo(freq, depth, param) { const g = V.gain(depth, param); V.osc('sine', freq, g); },
    /** Événement planifié : génère ses instants (intervalle aléatoire) et le déclenche. */
    every(first, interval, fire) { gens.push({ next: start + first, interval, fire }); },
    /** Dérive aléatoire et douce d'un paramètre entre lo et hi. */
    drift(param, lo, hi, minS, maxS) {
      param.setValueAtTime(param.value, start);
      V.every(r(0, minS), () => r(minS, maxS), (t) => param.setTargetAtTime(r(lo, hi), t, r(minS, maxS) / 3));
    },
    /** Écho feutré (retard + réinjection filtrée) : effet de salle avec trois nœuds. */
    echo(time, fb, cutoff, wet = 0.5) {
      const input = V.gain(1);
      const dl = track(ctx.createDelay(1));
      dl.delayTime.value = time;
      const lp = V.filter('lowpass', cutoff, 0.5);
      const back = V.gain(fb);
      const w = V.gain(wet, mix);
      input.connect(dl); dl.connect(lp); lp.connect(back); back.connect(dl); lp.connect(w);
      input.connect(mix);
      return input;
    },
    /* ---- événements éphémères (libérés à la fin de leur son) ---- */
    ev(src, list, end) {
      live.set(src, list);
      src.onended = () => { list.forEach((n) => { try { n.disconnect(); } catch { /* rien */ } }); live.delete(src); };
      src.stop(end);
    },
    env(param, t, peak, a, d) {
      param.setValueAtTime(0.0001, t);
      param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      param.exponentialRampToValueAtTime(0.0001, t + a + d);
    },
    tone(t, f, { type = 'sine', dur = 0.3, peak = 0.1, a = 0.005, to = mix, f1 = 0, glide = 0, partial = 0, ratio = 2.76 } = {}) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0;
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + (glide || dur));
      V.env(g.gain, t, peak, a, dur);
      o.connect(g); g.connect(to);
      const list = [o, g];
      o.start(t);
      if (partial > 0) {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        g2.gain.value = 0;
        o2.frequency.setValueAtTime(f * ratio, t);
        V.env(g2.gain, t, peak * partial, a, dur * 0.35);
        o2.connect(g2); g2.connect(to);
        o2.start(t); o2.stop(t + a + dur * 0.35 + 0.05);
        list.push(o2, g2);
      }
      V.ev(o, list, t + a + dur + 0.05);
    },
    burst(t, { dur = 0.05, peak = 0.2, a = 0.002, to = mix, kind = 'white', bp = 0, Q = 1, rate = 1 } = {}) {
      const s = ctx.createBufferSource();
      s.buffer = bufs[kind]; s.loop = true; s.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = 0;
      const list = [s, g];
      let head = s;
      if (bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bp; f.Q.value = Q; s.connect(f); head = f; list.push(f); }
      V.env(g.gain, t, peak, a, dur);
      head.connect(g); g.connect(to);
      s.start(t, r(0, bufs[kind].duration - 0.5));
      V.ev(s, list, t + a + dur + 0.05);
    },
    /** Oscillateur unique piloté par une liste de notes [début, durée, f0, f1, crête] (oiseaux, bips). */
    seq(t, notes, { type = 'sine', to = mix } = {}) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      g.gain.value = 0;
      g.gain.setValueAtTime(0, t);
      let end = t;
      for (const [d, len, f0, f1, pk] of notes) {
        const s = t + d;
        o.frequency.setValueAtTime(f0, s);
        o.frequency.exponentialRampToValueAtTime(f1 || f0, s + len);
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(pk, s + Math.min(0.012, len / 3));
        g.gain.linearRampToValueAtTime(0, s + len);
        end = Math.max(end, s + len);
      }
      o.connect(g); g.connect(to);
      o.start(t);
      V.ev(o, [o, g], end + 0.05);
    },
    /** Note de piano stylisée (deux oscillateurs légèrement désaccordés pour le bastringue). */
    piano(t, f, { peak = 0.1, dur = 2.2, to = mix, detune = 0, type = 'triangle' } = {}) {
      const g = ctx.createGain();
      g.gain.value = 0;
      V.env(g.gain, t, peak, 0.006, dur);
      const list = [g];
      const oscs = detune ? [-detune, detune] : [0];
      let last;
      for (const c of oscs) {
        const o = ctx.createOscillator();
        o.type = type; o.frequency.value = f; o.detune.value = c;
        o.connect(g); o.start(t);
        list.push(o);
        last = o;
      }
      g.connect(to);
      list.filter((n) => n !== last && n.stop).forEach((o) => o.stop(t + dur + 0.06));
      V.ev(last, list, t + dur + 0.06);
    },
  };

  return {
    V,
    out,
    schedule(t0, t1) {
      for (const g of gens) {
        if (g.next < t0) g.next = t0 + rng() * 0.2;
        let guard = 0;
        while (g.next < t1 && guard++ < 400) {
          try { g.fire(g.next); } catch { /* un événement raté ne doit rien casser */ }
          g.next += Math.max(0.01, g.interval());
        }
      }
    },
    fadeIn(t, dur) {
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(1, t + dur);
    },
    fadeOut(t, dur) {
      const p = out.gain;
      const v = p.value;
      p.cancelScheduledValues(t);
      p.setValueAtTime(v, t);
      p.linearRampToValueAtTime(0, t + dur);
    },
    nodeCount() {
      let n = nodes.size;
      live.forEach((l) => { n += l.length; });
      return n;
    },
    dispose() {
      for (const [src, list] of live) {
        try { src.onended = null; src.stop(); } catch { /* rien */ }
        list.forEach((n) => { try { if (n.stop && n !== src) n.stop(); } catch { /* rien */ } try { n.disconnect(); } catch { /* rien */ } });
      }
      live.clear();
      sources.forEach((s) => { try { s.stop(); } catch { /* rien */ } });
      sources.clear();
      nodes.forEach((n) => { try { n.disconnect(); } catch { /* rien */ } });
      nodes.clear();
      gens.length = 0;
    },
  };
}

/* ------------------------------------------------------------------ recettes */
// Chaque recette pose ses couches sur V.mix. `LEVEL` cale le niveau RMS de chaque ambiance
// (mesuré hors ligne, voir le rapport) pour viser environ −27 dBFS sur le bus.
const RECIPES = {
  sea(V) {
    const { r } = V;
    // Grondement de fond permanent.
    const rumble = V.gain(0.3, V.mix);
    V.noise('brown', V.filter('lowpass', 170, 0.6, rumble));
    V.drift(rumble.gain, 0.2, 0.36, 4, 9);
    // Vague : montée lente, déferlement, puis retrait sifflant (écume).
    const surfG = V.gain(0.1, V.mix);
    const surfF = V.filter('lowpass', 380, 0.7, surfG);
    V.noise('pink', surfF);
    const foamG = V.gain(0.01, V.mix);
    V.noise('white', V.filter('bandpass', 2600, 0.6, foamG));
    [surfG.gain, surfF.frequency, foamG.gain].forEach((p) => p.setValueAtTime(p.value, V.start));
    let P = r(6, 9.5);
    V.every(0.6, () => P, (t) => {
      const rise = r(1.6, 2.8), peak = r(0.55, 1), end = t + P - 0.15;
      surfG.gain.linearRampToValueAtTime(peak, t + rise);
      surfG.gain.linearRampToValueAtTime(0.1, end);
      surfF.frequency.linearRampToValueAtTime(r(900, 1500), t + rise);
      surfF.frequency.linearRampToValueAtTime(380, end);
      foamG.gain.linearRampToValueAtTime(0.01, t + rise * 0.8);
      foamG.gain.linearRampToValueAtTime(peak * r(0.25, 0.4), t + rise + r(0.5, 1));
      foamG.gain.linearRampToValueAtTime(0.01, end);
      P = r(6, 9.5);
    });
    // Mouette lointaine, rare.
    V.every(r(8, 16), () => r(20, 45), (t) => {
      const n = 2 + Math.floor(r(0, 3));
      const notes = [];
      for (let i = 0; i < n; i++) { const f = r(1300, 1600); notes.push([i * r(0.32, 0.42), 0.26, f * 1.35, f * 0.85, 0.035]); }
      V.seq(t, notes, { type: 'triangle' });
    });
  },

  river(V) {
    const { r } = V;
    const bed = V.gain(0.3, V.mix);
    V.noise('brown', V.filter('lowpass', 420, 0.6, bed));
    V.drift(bed.gain, 0.2, 0.36, 3, 7);
    // Clapotis : petites vagues filtrées, rapprochées, au timbre changeant.
    V.every(0.3, () => (V.rng() < 0.25 ? r(0.1, 0.25) : r(0.35, 0.95)), (t) => {
      V.burst(t, { kind: 'pink', dur: r(0.12, 0.35), a: r(0.03, 0.08), peak: r(0.25, 0.7), bp: r(260, 900), Q: r(2, 4) });
    });
    // Gouttes (« bloup »).
    V.every(1.2, () => r(1.2, 3.8), (t) => V.tone(t, r(320, 620), { f1: r(800, 1200), dur: 0.07, a: 0.004, peak: r(0.03, 0.06) }));
    // Coque qui cogne doucement.
    V.every(r(3, 7), () => r(6, 14), (t) => {
      V.tone(t, r(95, 120), { dur: 0.35, a: 0.01, peak: 0.12, partial: 0.4, ratio: 2.3 });
    });
  },

  wind(V) {
    const main = V.gain(0.6, V.mix);
    const bp = V.filter('bandpass', 500, 0.9, main);
    V.noise('pink', bp);
    V.drift(bp.frequency, 260, 900, 2, 5);
    V.drift(main.gain, 0.3, 1, 1.5, 4.5);
    // Sifflement des rafales (bande étroite).
    const howl = V.gain(0.3, V.mix);
    const hf = V.filter('bandpass', 760, 9, howl);
    V.noise('white', hf);
    V.drift(hf.frequency, 480, 1150, 2.5, 6);
    V.drift(howl.gain, 0, 0.9, 2, 5);
    const low = V.gain(0.25, V.mix);
    V.noise('brown', V.filter('lowpass', 140, 0.6, low));
  },

  birds(V) {
    const { r, pick } = V;
    const breeze = V.gain(0.3, V.mix);
    V.noise('pink', V.filter('lowpass', 650, 0.6, breeze));
    V.drift(breeze.gain, 0.15, 0.45, 2.5, 6);
    const leaves = V.gain(0.02, V.mix);
    V.noise('white', V.filter('bandpass', 4200, 0.6, leaves));
    V.drift(leaves.gain, 0, 0.06, 1.5, 4);
    V.every(r(0.5, 2), () => r(1.6, 6), (t) => {
      const kind = pick(['tui', 'trill', 'whistle', 'tui']);
      const notes = [];
      const pk = r(0.05, 0.1);
      if (kind === 'tui') {
        const f = r(2600, 3800), n = 2 + Math.floor(r(0, 3));
        for (let i = 0; i < n; i++) notes.push([i * r(0.13, 0.18), 0.075, f, f * 1.3, pk]);
      } else if (kind === 'trill') {
        const f = r(3800, 5000), n = 6 + Math.floor(r(0, 6));
        for (let i = 0; i < n; i++) notes.push([i * 0.055, 0.035, f + (i % 2 ? 250 : -150), f, pk * 0.8]);
      } else {
        const f = r(1800, 2300);
        notes.push([0, 0.22, f, f * 1.7, pk], [0.25, 0.3, f * 1.6, f * 1.15, pk * 0.9]);
      }
      V.seq(t, notes);
    });
  },

  fire(V) {
    const { r } = V;
    const roar = V.gain(0.35, V.mix);
    V.noise('brown', V.filter('lowpass', 300, 0.6, roar));
    V.drift(roar.gain, 0.2, 0.42, 1.2, 3.5);
    const hiss = V.gain(0.03, V.mix);
    V.noise('white', V.filter('bandpass', 2400, 0.5, hiss));
    V.drift(hiss.gain, 0.015, 0.05, 2, 5);
    // Crépitements : salves irrégulières de clics très courts.
    const crack = V.filter('highpass', 1700, 0.7, V.mix);
    V.every(0.2, () => (V.rng() < 0.35 ? r(0.02, 0.08) : r(0.12, 0.7)), (t) => {
      V.burst(t, { dur: r(0.003, 0.018), a: 0.001, peak: r(0.15, 0.85) ** 2 * 1.1, to: crack });
    });
    // Bûche qui claque.
    const pop = V.filter('bandpass', 850, 1, V.mix);
    V.every(r(2, 5), () => r(3, 9), (t) => V.burst(t, { dur: r(0.03, 0.06), a: 0.001, peak: r(0.5, 0.9), to: pop }));
  },

  hall(V) {
    const { r } = V;
    const murmurG = V.gain(0.55, V.mix);
    const babble = V.gain(1, murmurG);
    const mf = V.filter('bandpass', 450, 0.8, babble);
    V.noise('pink', mf);
    V.lfo(3.1, 0.18, babble.gain);
    V.lfo(4.7, 0.12, babble.gain);
    V.drift(mf.frequency, 360, 620, 2, 5);
    V.drift(murmurG.gain, 0.4, 0.7, 3, 7);
    const low = V.gain(0.35, V.mix);
    V.noise('brown', V.filter('lowpass', 200, 0.6, low));
    const room = V.echo(0.23, 0.45, 2400, 0.55);
    // Pas lointains, par moments.
    V.every(r(2, 6), () => r(6, 16), (t) => {
      const n = 5 + Math.floor(r(0, 8)), step = r(0.45, 0.62);
      for (let i = 0; i < n; i++) V.burst(t + i * step + r(-0.02, 0.02), { dur: 0.015, a: 0.002, peak: r(0.08, 0.14), bp: r(1600, 2400), Q: 1.5, to: room });
    });
    // Carillon d'annonce.
    const CHIMES = [[7, 4, 0], [0, 4, 7, 12], [12, 7, 4, 7]];
    V.every(r(6, 12), () => r(28, 50), (t) => {
      const seq = V.pick(CHIMES);
      seq.forEach((n, i) => V.tone(t + i * 0.55, semi(392, n), { dur: 1.6, a: 0.004, peak: 0.08, partial: 0.35, ratio: 2.76, to: room }));
    });
  },

  rooms(V) {
    const tone = V.gain(0.14, V.mix);
    V.noise('brown', V.filter('lowpass', 160, 0.6, tone));
    const air = V.gain(0.08, V.mix);
    V.noise('pink', V.filter('lowpass', 1300, 0.6, air));
    V.drift(air.gain, 0.05, 0.1, 4, 9);
    // Tic-tac : un seul filtre, dont la hauteur alterne (tic aigu, tac plus grave).
    const clk = V.filter('bandpass', 3200, 4, V.mix);
    let k = 0;
    V.every(0.5, () => 1, (t) => {
      clk.frequency.setValueAtTime(k % 2 ? 2300 : 3200, t - 0.004);
      V.burst(t, { dur: 0.006, a: 0.001, peak: k % 2 ? 0.3 : 0.36, to: clk });
      k++;
    });
    // Craquement de boiserie, rare.
    V.every(V.r(8, 16), () => V.r(15, 35), (t) => V.tone(t, V.r(85, 110), { type: 'triangle', f1: V.r(65, 80), dur: 0.5, a: 0.05, peak: 0.05 }));
  },

  kitchen(V) {
    const { r } = V;
    const murmurG = V.gain(0.45, V.mix);
    const babble = V.gain(1, murmurG);
    const mf = V.filter('bandpass', 700, 0.9, babble);
    V.noise('pink', mf);
    V.lfo(3.7, 0.2, babble.gain);
    V.lfo(5.3, 0.12, babble.gain);
    V.drift(murmurG.gain, 0.3, 0.6, 2, 6);
    V.drift(mf.frequency, 560, 900, 2, 5);
    const hum = V.gain(0.05, V.mix);
    V.osc('triangle', 98, V.filter('lowpass', 380, 0.7, hum));
    // Tintements (verres, couverts).
    V.every(0.8, () => r(0.8, 3.5), (t) => {
      const f = r(2200, 4200);
      V.tone(t, f, { dur: r(0.25, 0.6), a: 0.002, peak: r(0.04, 0.08), partial: 0.5, ratio: 2.71 });
      if (V.rng() < 0.3) V.tone(t + r(0.06, 0.12), f * r(0.9, 1.1), { dur: 0.3, a: 0.002, peak: 0.04 });
    });
    // Casserole posée, plus grave.
    V.every(r(4, 9), () => r(7, 16), (t) => V.tone(t, r(300, 420), { dur: 0.5, a: 0.003, peak: 0.06, partial: 0.6, ratio: 2.4 }));
  },

  space(V) {
    const { r } = V;
    const drone = V.gain(0.22, V.mix);
    const lp = V.filter('lowpass', 240, 0.8, drone);
    V.osc('sawtooth', 55, lp);
    V.osc('sawtooth', 55.35, lp);
    V.osc('sine', 110.2, lp);
    V.lfo(0.07, 80, lp.frequency);
    V.drift(drone.gain, 0.16, 0.26, 5, 10);
    const air = V.gain(0.15, V.mix);
    V.noise('pink', V.filter('lowpass', 900, 0.6, air));
    V.drift(air.gain, 0.08, 0.2, 3, 8);
    // Bips rares.
    V.every(r(3, 7), () => r(7, 18), (t) => {
      const f = V.pick([880, 1175, 1320, 1760]);
      const n = 1 + Math.floor(r(0, 3));
      const notes = [];
      for (let i = 0; i < n; i++) notes.push([i * 0.15, 0.07, f * (V.rng() < 0.3 ? 0.75 : 1), 0, 0.05]);
      V.seq(t, notes);
    });
  },

  night(V) {
    const { r } = V;
    const breeze = V.gain(0.14, V.mix);
    V.noise('pink', V.filter('lowpass', 480, 0.6, breeze));
    V.drift(breeze.gain, 0.08, 0.18, 3, 7);
    // Grillons : chacun son rythme et sa hauteur, avec des silences.
    [4300, 4750, 5150].forEach((f0, i) => {
      const per = r(0.55, 0.85);
      let rest = 0;
      V.every(r(0, 1) + i * 0.17, () => per * r(0.97, 1.03), (t) => {
        if (rest > 0) { rest--; return; }
        if (V.rng() < 0.04) { rest = 3 + Math.floor(r(0, 6)); return; }
        const pk = r(0.08, 0.12), n = 3 + (V.rng() < 0.5 ? 1 : 0);
        const notes = [];
        for (let k = 0; k < n; k++) notes.push([k * 0.03, 0.016, f0, f0 * 0.99, pk]);
        V.seq(t, notes);
      });
    });
    // Chouette lointaine.
    V.every(r(10, 20), () => r(25, 50), (t) => V.seq(t, [[0, 0.32, 430, 400, 0.05], [0.5, 0.5, 430, 380, 0.045]]));
  },

  music(V) {
    const { r, pick } = V;
    const room = V.gain(0.14, V.mix);
    V.noise('brown', V.filter('lowpass', 220, 0.6, room));
    const far = V.filter('lowpass', 1700, 0.6, V.echo(0.31, 0.35, 1800, 0.6));
    const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    V.every(0.6, () => r(1.4, 4.5), (t) => {
      const base = semi(130.81, pick(SCALE)); // à partir de do 3
      V.piano(t, base, { peak: r(0.1, 0.16), dur: r(1.8, 2.8), to: far });
      if (V.rng() < 0.3) V.piano(t + r(0, 0.04), semi(base, pick([3, 4, 7])), { peak: 0.1, dur: 2, to: far });
      if (V.rng() < 0.2) [1, 2].forEach((i) => V.piano(t + i * r(0.25, 0.35), semi(base, pick([2, 4, 5, 7])), { peak: 0.1, dur: 1.6, to: far }));
    });
    // Longue note de violon (vibrato), de temps en temps.
    V.every(r(5, 12), () => r(10, 20), (t) => {
      const f = semi(A3 * 2, pick([0, 2, 3, 7]));
      V.seq(t, [[0, 2.6, f, f * 1.001, 0.05]], { type: 'triangle', to: far });
    });
  },

  pool(V) {
    const { r } = V;
    const vent = V.gain(0.08, V.mix);
    V.noise('white', V.filter('lowpass', 2400, 0.6, vent));
    const water = V.gain(0.3, V.mix);
    V.noise('pink', V.filter('bandpass', 600, 0.7, water));
    V.drift(water.gain, 0.2, 0.4, 2, 5);
    const hallR = V.echo(0.09, 0.6, 3000, 0.7);
    V.every(0.3, () => r(0.3, 1.1), (t) => {
      V.burst(t, { kind: 'pink', dur: r(0.08, 0.25), a: r(0.01, 0.04), peak: r(0.2, 0.55), bp: r(500, 1800), Q: r(1.5, 3), to: hallR });
    });
    V.every(r(4, 10), () => r(10, 25), (t) => {
      V.burst(t, { dur: r(0.5, 0.8), a: 0.02, peak: r(0.25, 0.4), bp: 1200, Q: 0.7, to: hallR });
    });
  },

  saloon(V) {
    const { r, pick } = V;
    const murmurG = V.gain(0.5, V.mix);
    const babble = V.gain(1, murmurG);
    V.noise('pink', V.filter('bandpass', 500, 0.8, babble));
    V.lfo(3.3, 0.2, babble.gain);
    V.drift(murmurG.gain, 0.38, 0.6, 2, 6);
    const far = V.filter('lowpass', 1400, 0.6, V.echo(0.17, 0.25, 1500, 0.4));
    const CHORDS = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 7, 10]];
    V.every(r(0.5, 2), () => r(4, 10), (t) => {
      const ch = pick(CHORDS), n = 3 + Math.floor(r(0, 5));
      let d = 0;
      for (let i = 0; i < n; i++) {
        const f = semi(196, pick(ch) + (V.rng() < 0.3 ? 12 : 0));
        V.piano(t + d, f, { peak: r(0.05, 0.08), dur: 0.9, detune: 9, to: far });
        if (i === 0) V.piano(t, semi(98, ch[0]), { peak: 0.06, dur: 1.2, detune: 7, to: far });
        d += i % 2 ? 0.14 : 0.22; // croches inégales, façon ragtime
      }
    });
    V.every(r(3, 8), () => r(6, 15), (t) => V.tone(t, r(2600, 3600), { dur: 0.35, a: 0.002, peak: 0.05, partial: 0.5 }));
  },
};

// Calage du niveau de chaque ambiance (gain du mélange), d'après les mesures hors ligne.
const LEVEL = {
  sea: 0.234, river: 0.372, wind: 0.355, birds: 0.562, fire: 0.38, hall: 0.272, rooms: 0.653, kitchen: 0.543, space: 0.124, night: 0.912, music: 0.684, pool: 0.912, saloon: 0.562,
};

/**
 * Construit une ambiance sur n'importe quel contexte (AudioContext ou OfflineAudioContext).
 * La voix démarre muette : appeler fadeIn(), puis schedule(t0, t1) pour planifier ses événements.
 */
export function build(ctx, id, dest, opts = {}) {
  const recipe = RECIPES[id];
  if (!recipe) return null;
  const voice = makeVoice(ctx, dest, opts);
  voice.id = id;
  voice.V.mix.gain.value = LEVEL[id] ?? 1;
  recipe(voice.V);
  return voice;
}

/* ------------------------------------------------------------------ pilotage en direct */
let enabled = true;
try {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (s && s.ambience === false) enabled = false;
} catch { /* rien */ }

const FADE_IN = 1.5;
const FADE_OUT = 0.8;
const FADE_HIDE = 0.4;
const LOOKAHEAD = 2.5; // secondes planifiées d'avance
const TICK_MS = 1000; // une minuterie par seconde, pas plus
const DUCK = 0.3; // sourdine (≈ −10 dB) pendant la victoire

let wanted = null; // ambiance demandée par l'écran courant
let voice = null; // voix en lecture
const fading = new Set(); // voix en fondu de sortie
const timers = new Set();
let ducked = false;
let preview = null; // { onEnd, timer }
let armed = false;
const GESTURES = ['pointerdown', 'keydown', 'touchend'];

function later(fn, ms) {
  const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
  timers.add(t);
  return t;
}
function cancel(t) { if (t != null) { clearTimeout(t); timers.delete(t); } }

const hidden = () => typeof document !== 'undefined' && document.hidden;

function onGesture() {
  const ctx = audioContext(); // crée ou relance le contexte partagé
  if (!ctx) return;
  if (ctx.state === 'running') disarm();
  else {
    try { const pr = ctx.resume(); if (pr && pr.then) pr.then(() => { if (ctx.state === 'running') disarm(); }, () => {}); } catch { /* rien */ }
  }
  sync();
}
function arm() {
  if (armed || typeof document === 'undefined') return;
  armed = true;
  GESTURES.forEach((t) => document.addEventListener(t, onGesture, true));
}
function disarm() {
  if (!armed) return;
  armed = false;
  GESTURES.forEach((t) => document.removeEventListener(t, onGesture, true));
}

function retire(v, dur) {
  if (!v) return;
  cancel(v.tick);
  v.tick = null;
  v.stopping = true;
  fading.add(v);
  try { v.fadeOut(v.ctx.currentTime, dur); } catch { /* rien */ }
  later(() => { try { v.dispose(); } catch { /* rien */ } fading.delete(v); }, dur * 1000 + 200);
}

function setBus(ctx, value, tc = 0.12) {
  try {
    const p = busOf(ctx).input.gain;
    p.cancelScheduledValues(ctx.currentTime);
    p.setTargetAtTime(value, ctx.currentTime, tc);
  } catch { /* rien */ }
}

function spawn(id) {
  const ctx = audioContext();
  if (!ctx || ctx.state === 'closed') { arm(); return; }
  try {
    const bus = busOf(ctx);
    setBus(ctx, ducked ? DUCK : 1, 0.05);
    const t = ctx.currentTime + 0.04;
    const v = build(ctx, id, bus.input, { start: t, rng: Math.random });
    if (!v) return;
    v.ctx = ctx;
    v.fadeIn(t, FADE_IN);
    v.schedule(t, t + LOOKAHEAD);
    const tick = () => {
      if (voice !== v) return;
      const now = ctx.currentTime;
      v.schedule(now, now + LOOKAHEAD);
      v.tick = later(tick, TICK_MS);
    };
    v.tick = later(tick, TICK_MS);
    voice = v;
    // Contexte encore suspendu (navigateur sans geste reconnu) : on le relancera au prochain geste.
    if (ctx.state !== 'running') arm();
  } catch { voice = null; }
}

/** Accorde ce qui joue avec ce qui est voulu (ambiance demandée, réglage, onglet visible). */
function sync({ fade = FADE_OUT } = {}) {
  const want = (enabled || preview) && wanted && wanted !== 'none' && RECIPES[wanted] && !hidden() ? wanted : null;
  if (voice && (voice.id !== want)) { retire(voice, fade); voice = null; }
  if (want && !voice) spawn(want);
}

function endPreview() {
  if (!preview) return;
  const p = preview;
  preview = null;
  cancel(p.timer);
  try { if (p.onEnd) p.onEnd(); } catch { /* rien */ }
}

/** Démarre l'ambiance `id` (fondu enchaîné si une autre joue). Attend un geste si besoin. */
export function start(id) {
  endPreview();
  const next = IDS.has(id) ? id : 'rooms';
  ducked = false;
  // Nouvelle entrée dans un lieu : on repart d'une voix neuve, même si l'ambiance est la même.
  if (voice) { retire(voice, FADE_OUT); voice = null; }
  wanted = next;
  sync();
}

/** Arrête l'ambiance en fondu (≈ 0,8 s). */
export function stop() {
  endPreview();
  wanted = null;
  ducked = false;
  disarm();
  sync();
}

/** Coupe ou rétablit l'ambiance (réglage « Ambiance »), en fondu, sans oublier le lieu. */
export function setEnabled(on) {
  enabled = !!on;
  sync();
}
export function isEnabled() { return enabled; }

/** Met l'ambiance en sourdine (victoire) ou lui rend son niveau. */
export function duck(on = true) {
  ducked = !!on;
  if (voice && voice.ctx) setBus(voice.ctx, ducked ? DUCK : 1, ducked ? 0.08 : 0.4);
}

/** Écoute d'essai (éditeur) : joue `id` quelques secondes, même si le réglage est coupé. */
export function listen(id, { seconds = 7, onEnd = null } = {}) {
  endPreview();
  if (!RECIPES[id]) { if (onEnd) onEnd(); return false; }
  if (voice) { retire(voice, FADE_OUT); voice = null; }
  preview = { onEnd, timer: null };
  ducked = false;
  wanted = id;
  sync();
  preview.timer = later(() => { preview.timer = null; endPreview(); wanted = null; sync(); }, seconds * 1000);
  return true;
}
export const isListening = () => !!preview;

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => sync({ fade: FADE_HIDE }));
}

/** État pour les tests : ambiance voulue et jouée, gain cible, nœuds et minuteries vivants. */
export function __state() {
  let nodes = 0;
  const all = [...fading, ...(voice ? [voice] : [])];
  all.forEach((v) => { nodes += v.nodeCount(); });
  const ctx = voice && voice.ctx;
  return {
    id: voice ? voice.id : null,
    wanted,
    enabled,
    playing: !!(voice && ctx && ctx.state === 'running'),
    ctxState: ctx ? ctx.state : null,
    ducked,
    target: voice ? (ducked ? DUCK : 1) : 0,
    voices: all.length,
    fading: fading.size,
    nodes,
    timers: timers.size,
    armed,
    listening: !!preview,
  };
}
