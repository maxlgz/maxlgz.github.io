const APP_VERSION = 'v0.2.0';

const FIRST_MIDI = 48; // C3
const LAST_MIDI = 84;  // C6
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INSTRUMENTS = [
  { id: 'piano',   label: 'Piano acoustique',  kind: 'soundfont', sf: 'acoustic_grand_piano' },
  { id: 'bright',  label: 'Piano droit',       kind: 'soundfont', sf: 'bright_acoustic_piano' },
  { id: 'rhodes',  label: 'Piano électrique',  kind: 'soundfont', sf: 'electric_piano_1' },
  { id: 'organ',   label: 'Orgue',             kind: 'soundfont', sf: 'church_organ' },
  { id: 'strings', label: 'Cordes',            kind: 'soundfont', sf: 'string_ensemble_1' },
  { id: 'guitar',  label: 'Guitare nylon',     kind: 'soundfont', sf: 'acoustic_guitar_nylon' },
  { id: 'celesta', label: 'Célesta',           kind: 'soundfont', sf: 'celesta' },
  { id: 'synth',   label: 'Synthé (triangle)', kind: 'oscillator' },
];
const DEFAULT_INSTRUMENT_ID = 'piano';

const pianoEl = document.getElementById('piano');
const noteDisplayEl = document.getElementById('note-display');
const deviceEl = document.getElementById('device-name');
const statusEl = document.getElementById('status');
const statusLabelEl = document.getElementById('status-label');
const connectBtn = document.getElementById('connect-btn');
const instrumentSelect = document.getElementById('instrument');
const instrumentStateEl = document.getElementById('instrument-state');
const versionEl = document.getElementById('version');

if (versionEl) versionEl.textContent = APP_VERSION;

const keyEls = new Map();
const held = new Set();

function pitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

function isBlack(midi) {
  return [1, 3, 6, 8, 10].includes(pitchClass(midi));
}

function midiToName(midi) {
  return NOTE_NAMES[pitchClass(midi)] + (Math.floor(midi / 12) - 1);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function buildKeyboard() {
  const whites = [];
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!isBlack(m)) whites.push(m);
  }
  const whiteCount = whites.length;

  for (const midi of whites) {
    const el = document.createElement('div');
    el.className = 'key white';
    el.dataset.midi = String(midi);
    if (pitchClass(midi) === 0) {
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = midiToName(midi);
      el.appendChild(label);
    }
    attachKeyPointerEvents(el, midi);
    pianoEl.appendChild(el);
    keyEls.set(midi, el);
  }

  const blackWidthPct = (100 / whiteCount) * 0.62;
  for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi++) {
    if (!isBlack(midi)) continue;
    const leftWhiteIdx = whites.indexOf(midi - 1);
    if (leftWhiteIdx === -1) continue;
    const leftPct = ((leftWhiteIdx + 1) * 100) / whiteCount - blackWidthPct / 2;
    const el = document.createElement('div');
    el.className = 'key black';
    el.dataset.midi = String(midi);
    el.style.left = leftPct + '%';
    el.style.width = blackWidthPct + '%';
    attachKeyPointerEvents(el, midi);
    pianoEl.appendChild(el);
    keyEls.set(midi, el);
  }
}

function attachKeyPointerEvents(el, midi) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    triggerNote(midi, 100);
  });
  const release = () => releaseNote(midi);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
}

let audioCtx = null;
let mediaSessionUnlocked = false;
const activeVoices = new Map();

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==';

function unlockIosAudio() {
  if (mediaSessionUnlocked) return;
  mediaSessionUnlocked = true;
  try {
    const a = new Audio(SILENT_WAV);
    a.muted = false;
    a.playsInline = true;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (_) {}
}

function ensureAudio() {
  unlockIosAudio();
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

let currentInstrumentId = DEFAULT_INSTRUMENT_ID;
let sfInstrument = null;
const sfCache = new Map();
let sfLoadToken = 0;

function getInstrument(id) {
  return INSTRUMENTS.find((i) => i.id === id);
}

function setInstrumentState(state, label) {
  instrumentStateEl.dataset.state = state;
  instrumentStateEl.textContent = label;
}

async function selectInstrument(id) {
  const def = getInstrument(id);
  if (!def) return;
  currentInstrumentId = id;

  for (const midi of [...activeVoices.keys()]) stopAudio(midi, true);

  if (def.kind === 'oscillator') {
    sfInstrument = null;
    setInstrumentState('ready', def.label);
    instrumentSelect.disabled = false;
    return;
  }

  if (!window.Soundfont) {
    setInstrumentState('error', 'soundfont-player indisponible');
    return;
  }

  ensureAudio();
  if (!audioCtx) {
    setInstrumentState('error', 'Audio non disponible');
    return;
  }

  if (sfCache.has(def.sf)) {
    sfInstrument = sfCache.get(def.sf);
    setInstrumentState('ready', def.label);
    instrumentSelect.disabled = false;
    return;
  }

  const token = ++sfLoadToken;
  setInstrumentState('loading', 'Chargement ' + def.label + '…');
  instrumentSelect.disabled = true;
  try {
    const inst = await window.Soundfont.instrument(audioCtx, def.sf, {
      soundfont: 'MusyngKite',
    });
    if (token !== sfLoadToken) return; // superseded
    sfCache.set(def.sf, inst);
    sfInstrument = inst;
    setInstrumentState('ready', def.label);
  } catch (e) {
    console.error(e);
    if (token === sfLoadToken) setInstrumentState('error', 'Échec du chargement');
  } finally {
    if (token === sfLoadToken) instrumentSelect.disabled = false;
  }
}

function playAudio(midi, velocity) {
  ensureAudio();
  if (!audioCtx) return;
  stopAudio(midi, true);

  const def = getInstrument(currentInstrumentId);
  if (def && def.kind === 'soundfont' && sfInstrument) {
    try {
      const handle = sfInstrument.play(midi, audioCtx.currentTime, {
        gain: Math.max(0.1, (velocity / 127) * 1.6),
      });
      activeVoices.set(midi, { kind: 'sf', handle });
    } catch (e) {
      console.error(e);
    }
    return;
  }

  // Oscillator fallback / synth preset
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(midiToFreq(midi), now);
  const peak = Math.max(0.02, (velocity / 127) * 0.28);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(peak * 0.4, now + 0.35);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  activeVoices.set(midi, { kind: 'osc', osc, gain });
}

function stopAudio(midi, immediate = false) {
  const v = activeVoices.get(midi);
  if (!v || !audioCtx) return;
  activeVoices.delete(midi);

  if (v.kind === 'sf') {
    try {
      if (v.handle && typeof v.handle.stop === 'function') v.handle.stop();
    } catch (_) {}
    return;
  }

  const now = audioCtx.currentTime;
  const tail = immediate ? 0.02 : 0.18;
  try {
    v.gain.gain.cancelScheduledValues(now);
    const current = Math.max(v.gain.gain.value, 0.0001);
    v.gain.gain.setValueAtTime(current, now);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, now + tail);
    v.osc.stop(now + tail + 0.05);
  } catch (_) {}
}

function setNoteDisplay() {
  if (held.size === 0) {
    noteDisplayEl.textContent = '—';
    return;
  }
  const names = [...held].sort((a, b) => a - b).map(midiToName);
  noteDisplayEl.textContent = names.join(' · ');
}

function triggerNote(midi, velocity = 100) {
  if (midi < FIRST_MIDI || midi > LAST_MIDI) {
    playAudio(midi, velocity);
    return;
  }
  held.add(midi);
  const el = keyEls.get(midi);
  if (el) el.classList.add('active');
  setNoteDisplay();
  playAudio(midi, velocity);
}

function releaseNote(midi) {
  if (!held.has(midi)) {
    stopAudio(midi);
    return;
  }
  held.delete(midi);
  const el = keyEls.get(midi);
  if (el) el.classList.remove('active');
  stopAudio(midi);
  setNoteDisplay();
}

function setStatus(state, label) {
  statusEl.dataset.state = state;
  statusLabelEl.textContent = label;
}

async function connectMIDI() {
  if (!navigator.requestMIDIAccess) {
    setStatus('error', 'Web MIDI non supporté par ce navigateur');
    return;
  }
  try {
    ensureAudio();
    const access = await navigator.requestMIDIAccess();
    attachInputs(access);
    access.onstatechange = () => attachInputs(access);
    if (getInstrument(currentInstrumentId).kind === 'soundfont' && !sfInstrument) {
      selectInstrument(currentInstrumentId);
    }
  } catch (e) {
    setStatus('error', 'Accès MIDI refusé');
    console.error(e);
  }
}

function attachInputs(access) {
  const names = [];
  for (const input of access.inputs.values()) {
    input.onmidimessage = handleMIDI;
    names.push(input.name || 'Appareil MIDI');
  }
  if (names.length > 0) {
    setStatus('connected', names.length + ' appareil' + (names.length > 1 ? 's' : ''));
    deviceEl.textContent = names.join(', ');
    connectBtn.textContent = 'Reconnecter';
  } else {
    setStatus('ready', 'En attente d’un clavier');
    deviceEl.textContent = 'Aucun appareil — branche ton clavier en USB';
  }
}

function handleMIDI(msg) {
  const [status, note, velocity] = msg.data;
  const type = status & 0xf0;
  if (type === 0x90 && velocity > 0) {
    triggerNote(note, velocity);
  } else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
    releaseNote(note);
  }
}

function populateInstrumentSelect() {
  for (const inst of INSTRUMENTS) {
    const opt = document.createElement('option');
    opt.value = inst.id;
    opt.textContent = inst.label;
    instrumentSelect.appendChild(opt);
  }
  instrumentSelect.value = DEFAULT_INSTRUMENT_ID;
  instrumentSelect.addEventListener('change', () => {
    selectInstrument(instrumentSelect.value);
  });
}

connectBtn.addEventListener('click', connectMIDI);
buildKeyboard();
populateInstrumentSelect();
setInstrumentState('idle', 'Tape une touche pour charger ' + getInstrument(DEFAULT_INSTRUMENT_ID).label);

// Trigger soundfont load lazily on the first user gesture (also unlocks audio).
function firstGestureLoad() {
  window.removeEventListener('pointerdown', firstGestureLoad, true);
  window.removeEventListener('keydown', firstGestureLoad, true);
  selectInstrument(currentInstrumentId);
}
window.addEventListener('pointerdown', firstGestureLoad, true);
window.addEventListener('keydown', firstGestureLoad, true);

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(
    (access) => {
      attachInputs(access);
      access.onstatechange = () => attachInputs(access);
    },
    () => {
      setStatus('idle', 'MIDI en veille — clique pour autoriser');
    }
  );
} else {
  setStatus('error', 'Web MIDI non supporté par ce navigateur');
}
