const FIRST_MIDI = 48; // C3
const LAST_MIDI = 84;  // C6
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const pianoEl = document.getElementById('piano');
const noteDisplayEl = document.getElementById('note-display');
const deviceEl = document.getElementById('device-name');
const statusEl = document.getElementById('status');
const statusLabelEl = document.getElementById('status-label');
const connectBtn = document.getElementById('connect-btn');

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
const activeVoices = new Map();

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playAudio(midi, velocity) {
  ensureAudio();
  if (!audioCtx) return;
  stopAudio(midi, true);
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
  activeVoices.set(midi, { osc, gain });
}

function stopAudio(midi, immediate = false) {
  const v = activeVoices.get(midi);
  if (!v || !audioCtx) return;
  const now = audioCtx.currentTime;
  const tail = immediate ? 0.02 : 0.18;
  try {
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, now + tail);
    v.osc.stop(now + tail + 0.02);
  } catch (_) {}
  activeVoices.delete(midi);
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
    // Still play audio even if outside the visible range
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

connectBtn.addEventListener('click', connectMIDI);
buildKeyboard();

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
