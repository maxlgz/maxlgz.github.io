const APP_VERSION = 'v0.3.0';

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

const DIFFICULTY_TOLERANCE = {
  'very-easy': 0.30,
  'easy': 0.20,
  'medium': 0.15,
  'hard': 0.10,
};
const LOOKAHEAD_SEC = 3;
const LEAD_IN_SEC = 2;
const HAND_COLOR = { R: '#3d7dff', L: '#ff8b5a' };

const pianoEl = document.getElementById('piano');
const noteDisplayEl = document.getElementById('note-display');
const deviceEl = document.getElementById('device-name');
const statusEl = document.getElementById('status');
const statusLabelEl = document.getElementById('status-label');
const connectBtn = document.getElementById('connect-btn');
const instrumentSelect = document.getElementById('instrument');
const instrumentStateEl = document.getElementById('instrument-state');
const versionEl = document.getElementById('version');
const difficultySelect = document.getElementById('lesson-difficulty');
const songSelect = document.getElementById('lesson-song');
const handSelect = document.getElementById('lesson-hand');
const startBtn = document.getElementById('lesson-start');
const scoreEl = document.getElementById('lesson-score');
const comboEl = document.getElementById('lesson-combo');
const accuracyEl = document.getElementById('lesson-accuracy');
const highwayCanvas = document.getElementById('highway');
const highwayCtx = highwayCanvas.getContext('2d');

if (versionEl) versionEl.textContent = APP_VERSION;

const keyEls = new Map();
const held = new Set();
const whiteOrder = [];

function pitchClass(midi) { return ((midi % 12) + 12) % 12; }
function isBlack(midi) { return [1, 3, 6, 8, 10].includes(pitchClass(midi)); }
function midiToName(midi) { return NOTE_NAMES[pitchClass(midi)] + (Math.floor(midi / 12) - 1); }
function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

function buildKeyboard() {
  for (let m = FIRST_MIDI; m <= LAST_MIDI; m++) {
    if (!isBlack(m)) whiteOrder.push(m);
  }
  const whiteCount = whiteOrder.length;

  for (const midi of whiteOrder) {
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
    const leftWhiteIdx = whiteOrder.indexOf(midi - 1);
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

function getInstrument(id) { return INSTRUMENTS.find((i) => i.id === id); }

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
  if (!audioCtx) { setInstrumentState('error', 'Audio non disponible'); return; }
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
    const inst = await window.Soundfont.instrument(audioCtx, def.sf, { soundfont: 'MusyngKite' });
    if (token !== sfLoadToken) return;
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
    } catch (e) { console.error(e); }
    return;
  }
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
    try { if (v.handle && typeof v.handle.stop === 'function') v.handle.stop(); } catch (_) {}
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
  if (held.size === 0) { noteDisplayEl.textContent = '—'; return; }
  const names = [...held].sort((a, b) => a - b).map(midiToName);
  noteDisplayEl.textContent = names.join(' · ');
}

function triggerNote(midi, velocity = 100) {
  if (midi < FIRST_MIDI || midi > LAST_MIDI) { playAudio(midi, velocity); return; }
  held.add(midi);
  const el = keyEls.get(midi);
  if (el) el.classList.add('active');
  setNoteDisplay();
  playAudio(midi, velocity);
  if (lesson.running) registerLessonHit(midi);
}

function releaseNote(midi) {
  if (!held.has(midi)) { stopAudio(midi); return; }
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
  if (!navigator.requestMIDIAccess) { setStatus('error', 'Web MIDI non supporté par ce navigateur'); return; }
  try {
    ensureAudio();
    const access = await navigator.requestMIDIAccess();
    attachInputs(access);
    access.onstatechange = () => attachInputs(access);
    if (getInstrument(currentInstrumentId).kind === 'soundfont' && !sfInstrument) {
      selectInstrument(currentInstrumentId);
    }
  } catch (e) { setStatus('error', 'Accès MIDI refusé'); console.error(e); }
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
  if (type === 0x90 && velocity > 0) triggerNote(note, velocity);
  else if (type === 0x80 || (type === 0x90 && velocity === 0)) releaseNote(note);
}

function populateInstrumentSelect() {
  for (const inst of INSTRUMENTS) {
    const opt = document.createElement('option');
    opt.value = inst.id;
    opt.textContent = inst.label;
    instrumentSelect.appendChild(opt);
  }
  instrumentSelect.value = DEFAULT_INSTRUMENT_ID;
  instrumentSelect.addEventListener('change', () => selectInstrument(instrumentSelect.value));
}

// ---------- Lesson engine ----------

const lesson = {
  running: false,
  startTime: 0,      // performance.now()/1000 at which beat 0 starts
  notes: [],         // cloned from song with {midi, hand, expectedTime, duration, resolved, flashUntil}
  tolerance: 0.15,
  totalScorable: 0,
  hits: 0,
  misses: 0,
  combo: 0,
  song: null,
  hand: 'both',
};

function now() { return performance.now() / 1000; }

function populateSongSelect() {
  songSelect.innerHTML = '';
  const diff = difficultySelect.value;
  const matches = (window.SONGS || []).filter((s) => s.difficulty === diff);
  if (matches.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'Aucun morceau';
    opt.disabled = true;
    songSelect.appendChild(opt);
    startBtn.disabled = true;
    return;
  }
  for (const s of matches) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.title;
    songSelect.appendChild(opt);
  }
  startBtn.disabled = false;
}

function startLesson() {
  const diff = difficultySelect.value;
  const hand = handSelect.value;
  const songDef = (window.SONGS || []).find((s) => s.id === songSelect.value);
  if (!songDef) return;

  ensureAudio();

  const beatDur = 60 / songDef.bpm;
  const filtered = songDef.notes.filter((n) => hand === 'both' || (hand === 'right' && n.hand === 'R') || (hand === 'left' && n.hand === 'L'));

  lesson.song = songDef;
  lesson.hand = hand;
  lesson.tolerance = DIFFICULTY_TOLERANCE[diff] ?? 0.15;
  lesson.startTime = now() + LEAD_IN_SEC;
  lesson.notes = filtered.map((n) => ({
    midi: n.midi,
    hand: n.hand,
    expectedTime: lesson.startTime + n.beat * beatDur,
    duration: n.length * beatDur,
    resolved: null,        // null | 'hit' | 'miss'
    flashUntil: 0,
  }));
  lesson.totalScorable = lesson.notes.length;
  lesson.hits = 0;
  lesson.misses = 0;
  lesson.combo = 0;
  lesson.running = true;
  lesson.finishing = false;
  updateHud();
  startBtn.textContent = 'Arrêter';
  startBtn.dataset.state = 'running';
  difficultySelect.disabled = true;
  songSelect.disabled = true;
  handSelect.disabled = true;
}

function stopLesson() {
  lesson.running = false;
  lesson.notes = [];
  startBtn.textContent = 'Démarrer';
  startBtn.dataset.state = '';
  difficultySelect.disabled = false;
  songSelect.disabled = false;
  handSelect.disabled = false;
}

function registerLessonHit(midi) {
  const t = now();
  let best = null;
  let bestDelta = Infinity;
  for (const note of lesson.notes) {
    if (note.resolved) continue;
    if (note.midi !== midi) continue;
    const d = Math.abs(note.expectedTime - t);
    if (d > lesson.tolerance) continue;
    if (d < bestDelta) { bestDelta = d; best = note; }
  }
  if (best) {
    best.resolved = 'hit';
    best.flashUntil = t + 0.35;
    lesson.hits++;
    lesson.combo++;
    updateHud();
  }
}

function updateHud() {
  scoreEl.textContent = String(lesson.hits);
  comboEl.textContent = String(lesson.combo);
  const resolved = lesson.hits + lesson.misses;
  accuracyEl.textContent = resolved === 0
    ? '—'
    : Math.round((lesson.hits / resolved) * 100) + '%';
}

// ---------- Canvas rendering ----------

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = highwayCanvas.getBoundingClientRect();
  if (rect.width === 0) return;
  highwayCanvas.width = Math.round(rect.width * dpr);
  highwayCanvas.height = Math.round(rect.height * dpr);
  highwayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function keyXBounds(midi) {
  const whiteCount = whiteOrder.length;
  const rect = highwayCanvas.getBoundingClientRect();
  const W = rect.width;
  const whiteW = W / whiteCount;
  if (!isBlack(midi)) {
    const idx = whiteOrder.indexOf(midi);
    if (idx === -1) return null;
    return { x: idx * whiteW + whiteW * 0.08, w: whiteW * 0.84 };
  }
  const leftIdx = whiteOrder.indexOf(midi - 1);
  if (leftIdx === -1) return null;
  const blackW = whiteW * 0.55;
  const center = (leftIdx + 1) * whiteW;
  return { x: center - blackW / 2, w: blackW };
}

function drawHighway() {
  const rect = highwayCanvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  highwayCtx.clearRect(0, 0, W, H);

  // vertical column tint per white key
  const whiteCount = whiteOrder.length;
  highwayCtx.globalAlpha = 1;
  highwayCtx.fillStyle = '#0c0f15';
  highwayCtx.fillRect(0, 0, W, H);
  const whiteW = W / whiteCount;
  highwayCtx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < whiteCount; i += 2) {
    highwayCtx.fillRect(i * whiteW, 0, whiteW, H);
  }

  // hit line
  highwayCtx.strokeStyle = 'rgba(255,255,255,0.25)';
  highwayCtx.lineWidth = 2;
  highwayCtx.beginPath();
  highwayCtx.moveTo(0, H - 1);
  highwayCtx.lineTo(W, H - 1);
  highwayCtx.stroke();

  if (!lesson.running) return;

  const t = now();
  let allDone = true;
  for (const note of lesson.notes) {
    const delta = note.expectedTime - t; // >0 future, <0 past
    if (delta > LOOKAHEAD_SEC) { allDone = false; continue; }
    if (delta < -1.0 && note.resolved) continue;
    if (note.resolved !== 'hit') allDone = false;

    if (!note.resolved && delta < -lesson.tolerance) {
      note.resolved = 'miss';
      note.flashUntil = t + 0.4;
      lesson.misses++;
      lesson.combo = 0;
      updateHud();
    }

    const bounds = keyXBounds(note.midi);
    if (!bounds) continue;
    // y of note head (bottom edge): delta=LOOKAHEAD → y=0, delta=0 → y=H
    const yHead = H * (1 - delta / LOOKAHEAD_SEC);
    const noteH = Math.max(6, (note.duration / LOOKAHEAD_SEC) * H);
    const yTop = yHead - noteH;

    let color = HAND_COLOR[note.hand] || '#888';
    if (note.resolved === 'hit') color = '#5bd47a';
    else if (note.resolved === 'miss') color = '#ff6b6b';

    const flash = note.flashUntil > t;
    highwayCtx.globalAlpha = note.resolved === 'miss' && !flash ? 0.35 : 1;

    // rounded rect
    const r = Math.min(6, bounds.w / 3);
    const x = bounds.x;
    const w = bounds.w;
    highwayCtx.fillStyle = color;
    roundRect(highwayCtx, x, yTop, w, noteH, r);
    highwayCtx.fill();

    // inner highlight
    highwayCtx.globalAlpha = 0.25;
    highwayCtx.fillStyle = '#ffffff';
    roundRect(highwayCtx, x + 2, yTop + 2, Math.max(0, w - 4), Math.min(6, noteH - 4), r / 2);
    highwayCtx.fill();
    highwayCtx.globalAlpha = 1;

    if (flash) {
      highwayCtx.strokeStyle = note.resolved === 'hit' ? '#8ef5a5' : '#ffb0b0';
      highwayCtx.lineWidth = 2;
      roundRect(highwayCtx, x - 1, yTop - 1, w + 2, noteH + 2, r + 1);
      highwayCtx.stroke();
    }
  }

  if (allDone && lesson.notes.length > 0 && !lesson.finishing) {
    lesson.finishing = true;
    setTimeout(() => { if (lesson.running) stopLesson(); }, 1500);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function animate() {
  resizeCanvas();
  drawHighway();
  requestAnimationFrame(animate);
}

// ---------- Init ----------

connectBtn.addEventListener('click', connectMIDI);
buildKeyboard();
populateInstrumentSelect();
setInstrumentState('idle', 'Tape une touche pour charger ' + getInstrument(DEFAULT_INSTRUMENT_ID).label);

difficultySelect.value = 'very-easy';
populateSongSelect();
difficultySelect.addEventListener('change', populateSongSelect);
startBtn.addEventListener('click', () => {
  if (lesson.running) stopLesson();
  else startLesson();
});

function firstGestureLoad() {
  window.removeEventListener('pointerdown', firstGestureLoad, true);
  window.removeEventListener('keydown', firstGestureLoad, true);
  selectInstrument(currentInstrumentId);
}
window.addEventListener('pointerdown', firstGestureLoad, true);
window.addEventListener('keydown', firstGestureLoad, true);

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(animate);

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(
    (access) => { attachInputs(access); access.onstatechange = () => attachInputs(access); },
    () => { setStatus('idle', 'MIDI en veille — clique pour autoriser'); }
  );
} else {
  setStatus('error', 'Web MIDI non supporté par ce navigateur');
}
