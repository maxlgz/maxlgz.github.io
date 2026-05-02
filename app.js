const APP_VERSION = 'v0.37.2';

// Default keyboard window — overridable at runtime via setKeyboardLayout().
let FIRST_MIDI = 36; // C2
let LAST_MIDI = 84;  // C6

const KEYBOARD_LAYOUTS = {
  mini:  { first: 48, last: 72, label: '25 touches · C3–C5' },
  large: { first: 36, last: 84, label: '49 touches · C2–C6' },
};
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
const HAND_COLOR = { R: '#d4a049', L: '#5c98a7' };
const HIT_COLOR = '#8eba9b';
const MISS_COLOR = '#cd6555';

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
const sectionSelect = document.getElementById('lesson-section');
const speedInput = document.getElementById('lesson-speed');
const speedValueEl = document.getElementById('lesson-speed-value');

function getSpeedPct() {
  const v = speedInput ? parseInt(speedInput.value, 10) : 100;
  return Math.max(25, Math.min(200, v || 100));
}
function refreshSpeedLabel() {
  if (speedValueEl) speedValueEl.textContent = getSpeedPct() + ' %';
}
if (speedInput) {
  try {
    const saved = parseInt(localStorage.getItem('etude-lesson-speed'), 10);
    if (saved >= 25 && saved <= 200) speedInput.value = String(saved);
  } catch (_) {}
  speedInput.addEventListener('input', () => {
    refreshSpeedLabel();
    try { localStorage.setItem('etude-lesson-speed', String(getSpeedPct())); } catch (_) {}
  });
  refreshSpeedLabel();
}
const startBtn = document.getElementById('lesson-start');
const playBtn = document.getElementById('lesson-play');
const waitToggle = document.getElementById('lesson-wait');
const loopToggle = document.getElementById('lesson-loop');
const accompToggle = document.getElementById('lesson-accomp');
const importBtn = document.getElementById('lesson-import-btn');
const importInput = document.getElementById('lesson-import');
const dropOverlay = document.getElementById('drop-overlay');
const librarySearchInput = document.getElementById('library-search');
const librarySearchBtn = document.getElementById('library-search-btn');
const libraryResultsEl = document.getElementById('library-results');
const libraryStatusEl = document.getElementById('library-status');
const scoreEl = document.getElementById('lesson-score');
const comboEl = document.getElementById('lesson-combo');
const accuracyEl = document.getElementById('lesson-accuracy');
const highwayCanvas = document.getElementById('highway');
const highwayCtx = highwayCanvas.getContext('2d');
const seekBar = document.getElementById('seek-bar');
const seekTrack = document.getElementById('seek-track');
const seekProgress = document.getElementById('seek-progress');
const seekThumb = document.getElementById('seek-thumb');
const seekTime = document.getElementById('seek-time');
const seekBackBtn = document.getElementById('seek-back');
const seekForwardBtn = document.getElementById('seek-forward');

if (versionEl) versionEl.textContent = APP_VERSION;

const keyEls = new Map();
const held = new Set();
const whiteOrder = [];

function pitchClass(midi) { return ((midi % 12) + 12) % 12; }
function isBlack(midi) { return [1, 3, 6, 8, 10].includes(pitchClass(midi)); }
function midiToName(midi) { return NOTE_NAMES[pitchClass(midi)] + (Math.floor(midi / 12) - 1); }
function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

function setKeyboardLayout(name) {
  const def = KEYBOARD_LAYOUTS[name] || KEYBOARD_LAYOUTS.large;
  FIRST_MIDI = def.first;
  LAST_MIDI = def.last;
  // Wipe and rebuild the on-screen keyboard.
  while (pianoEl.firstChild) pianoEl.removeChild(pianoEl.firstChild);
  keyEls.clear();
  whiteOrder.length = 0;
  buildKeyboard();
  try { localStorage.setItem('etude-keyboard-layout', name); } catch (_) {}
  // Update toggle UI if present.
  document.querySelectorAll('[data-kb-layout]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.kbLayout === name)
  );
}

function loadKeyboardLayout() {
  let saved = 'large';
  try {
    const v = localStorage.getItem('etude-keyboard-layout');
    if (v && KEYBOARD_LAYOUTS[v]) saved = v;
  } catch (_) {}
  return saved;
}

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
const sfCache = new Map();           // by sf name (current voice select)
const sfByName = new Map();          // by sf name (per-track GM cache)
let sfLoadToken = 0;

// Load (or reuse) a Soundfont instrument by GM name. Used by accomp tracks.
async function ensureSoundfont(name) {
  if (!name) return null;
  if (sfByName.has(name)) return sfByName.get(name);
  if (!window.Soundfont) return null;
  ensureAudio();
  if (!audioCtx) return null;
  // Reuse instances already loaded via the instrument picker.
  if (sfCache.has(name)) {
    sfByName.set(name, sfCache.get(name));
    return sfCache.get(name);
  }
  try {
    const inst = await window.Soundfont.instrument(audioCtx, name, { soundfont: 'MusyngKite' });
    sfByName.set(name, inst);
    return inst;
  } catch (e) {
    console.warn('[soundfont] failed to load', name, e);
    return null;
  }
}

function preloadTrackSoundfonts(songDef) {
  if (!songDef || !songDef.tracks) return Promise.resolve();
  const names = new Set();
  for (const tr of songDef.tracks) {
    if (tr.soundfontName) names.add(tr.soundfontName);
  }
  return Promise.all([...names].map(ensureSoundfont));
}

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

function playAudio(midi, velocity, sfName) {
  ensureAudio();
  if (!audioCtx) return;
  stopAudio(midi, true);

  // Per-track soundfont path (accompaniment notes).
  if (sfName) {
    const inst = sfByName.get(sfName);
    if (inst) {
      try {
        const handle = inst.play(midi, audioCtx.currentTime, {
          gain: Math.max(0.1, (velocity / 127) * 1.4),
        });
        activeVoices.set(midi, { kind: 'sf', handle });
      } catch (e) { console.error(e); }
      return;
    }
    // Soundfont not yet loaded — kick off the load and fall through to default.
    ensureSoundfont(sfName);
  }

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
  const sorted = [...held].sort((a, b) => a - b);
  const names = sorted.map(midiToName);
  let text = names.join(' · ');
  if (held.size >= 2 && window.HARMONY) {
    const chord = window.HARMONY.identify(sorted);
    if (chord && chord.name) {
      text = `${names.join(' · ')}  →  ${chord.name}`;
    }
  }
  noteDisplayEl.textContent = text;
}

function triggerNote(midi, velocity = 100, sfName = null) {
  if (midi < FIRST_MIDI || midi > LAST_MIDI) { playAudio(midi, velocity, sfName); return; }
  held.add(midi);
  const el = keyEls.get(midi);
  if (el) el.classList.add('active');
  setNoteDisplay();
  playAudio(midi, velocity, sfName);
  if (lesson.running) registerLessonHit(midi);
  if (window.SCHOOL && window.SCHOOL.isActive()) window.SCHOOL.onNoteOn(midi);
}

function releaseNote(midi) {
  if (!held.has(midi)) { stopAudio(midi); return; }
  held.delete(midi);
  const el = keyEls.get(midi);
  if (el) el.classList.remove('active');
  stopAudio(midi);
  setNoteDisplay();
  if (window.SCHOOL && window.SCHOOL.isActive()) window.SCHOOL.onNoteOff(midi);
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
  waitMode: false,
  loopMode: false,
  autoplay: false,   // app plays the song itself (preview / listen)
  timeShift: 0,      // accumulated pause time injected when waitMode blocks
  loopTimer: null,
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
    renderTracksPanel();
    return;
  }
  for (const s of matches) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.title;
    songSelect.appendChild(opt);
  }
  startBtn.disabled = false;
  renderTracksPanel();
}

// ---------- Tracks panel (per-song mixer) ----------

const TRACK_PREFS_KEY = 'etude-track-prefs-v1';

function loadTrackPrefs() {
  try { return JSON.parse(localStorage.getItem(TRACK_PREFS_KEY) || '{}'); }
  catch (_) { return {}; }
}
function saveTrackPrefs(prefs) {
  try { localStorage.setItem(TRACK_PREFS_KEY, JSON.stringify(prefs)); } catch (_) {}
}
function getSongPrefs(song) {
  if (!song || !song.tracks) return null;
  const all = loadTrackPrefs();
  let p = all[song.id];
  if (!p) {
    p = {
      enabled: { ...song.defaultEnabled },
      roles: { ...song.defaultRoles },
      userTrackId: song.defaultUserTrackId,
    };
    all[song.id] = p;
    saveTrackPrefs(all);
  }
  return p;
}
function updateSongPrefs(song, fn) {
  if (!song || !song.tracks) return;
  const all = loadTrackPrefs();
  const p = all[song.id] || {
    enabled: { ...song.defaultEnabled },
    roles: { ...song.defaultRoles },
    userTrackId: song.defaultUserTrackId,
  };
  fn(p);
  all[song.id] = p;
  saveTrackPrefs(all);
}

function getCurrentSongDef() {
  return (window.SONGS || []).find((s) => s.id === songSelect.value);
}

function renderTracksPanel() {
  const group = document.getElementById('tracks-group');
  const list = document.getElementById('track-list');
  const bulk = document.getElementById('track-bulk');
  if (!group || !list) return;
  const song = getCurrentSongDef();
  if (!song || !song.tracks || song.tracks.length === 0) {
    group.hidden = true;
    return;
  }
  group.hidden = false;
  const prefs = getSongPrefs(song);
  list.innerHTML = '';

  // Compute "all on" / "all off" state for the bulk row.
  const togglable = song.tracks.filter((t) => !t.isDrums);
  const allOn = togglable.every((t) => prefs.enabled[t.id] !== false);
  const allOff = togglable.every((t) => prefs.enabled[t.id] === false);
  if (bulk) {
    bulk.querySelector('[data-bulk="all"]').classList.toggle('is-active', allOn);
    bulk.querySelector('[data-bulk="none"]').classList.toggle('is-active', allOff);
  }

  for (const tr of song.tracks) {
    const enabled = prefs.enabled[tr.id] !== false;
    const role = prefs.roles[tr.id] || 'accomp';
    const row = document.createElement('div');
    row.className = 'track-row';
    if (!enabled) row.classList.add('is-off');
    if (role === 'user') row.classList.add('is-user');

    row.innerHTML = `
      <span class="track-swatch" style="background:${tr.color}" aria-hidden="true"></span>
      <div class="track-meta">
        <strong>${tr.name}</strong>
        <span>${tr.category}${tr.isDrums ? '' : ` · ${tr.noteCount} notes`}</span>
      </div>
      <div class="track-actions">
        <button type="button" class="track-mine ${role === 'user' ? 'is-active' : ''}" title="Définir comme ta partie" ${tr.isDrums ? 'disabled' : ''}>
          ${role === 'user' ? '★' : '☆'}
        </button>
        <label class="track-onoff" title="Activer / désactiver">
          <input type="checkbox" ${enabled ? 'checked' : ''} />
          <span class="track-onoff-track" aria-hidden="true"></span>
        </label>
      </div>
    `;

    const mineBtn = row.querySelector('.track-mine');
    mineBtn.addEventListener('click', () => {
      if (tr.isDrums) return;
      updateSongPrefs(song, (p) => {
        // Toggle: a track is either part of "ma partie" (user) or accompaniment.
        // Multiple tracks can be user simultaneously (e.g. one per hand).
        if (p.roles[tr.id] === 'user') {
          p.roles[tr.id] = 'accomp';
        } else {
          p.roles[tr.id] = 'user';
          p.enabled[tr.id] = true; // ensure enabled
          p.userTrackId = tr.id;
        }
      });
      renderTracksPanel();
    });

    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      updateSongPrefs(song, (p) => {
        p.enabled[tr.id] = checkbox.checked;
        // If we just disabled the user track, demote it.
        if (!checkbox.checked && p.roles[tr.id] === 'user') {
          p.roles[tr.id] = 'accomp';
        }
      });
      renderTracksPanel();
    });

    list.appendChild(row);
  }
}

if (songSelect) songSelect.addEventListener('change', renderTracksPanel);

function bulkSetTracks(action) {
  const song = getCurrentSongDef();
  if (!song || !song.tracks) return;
  updateSongPrefs(song, (p) => {
    for (const tr of song.tracks) {
      if (tr.isDrums) continue;
      if (action === 'all') {
        p.enabled[tr.id] = true;
      } else if (action === 'none') {
        p.enabled[tr.id] = false;
        if (p.roles[tr.id] === 'user') p.roles[tr.id] = 'accomp';
      } else if (action === 'reset') {
        p.enabled[tr.id] = song.defaultEnabled[tr.id];
        p.roles[tr.id] = song.defaultRoles[tr.id];
      }
    }
    if (action === 'reset') p.userTrackId = song.defaultUserTrackId;
  });
  renderTracksPanel();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-bulk]');
  if (!btn) return;
  bulkSetTracks(btn.dataset.bulk);
});

function startLesson(autoplay = false) {
  const diff = difficultySelect.value;
  const hand = handSelect.value;
  const songDef = (window.SONGS || []).find((s) => s.id === songSelect.value);
  if (!songDef) return;

  ensureAudio();

  const speedPct = getSpeedPct();
  // 100% = original tempo. 50% = half speed (notes last twice as long).
  const beatDur = (60 / songDef.bpm) * (100 / speedPct);
  const accompOn = !autoplay && !!(accompToggle && accompToggle.checked) && (hand === 'right' || hand === 'left');
  const otherHand = hand === 'right' ? 'L' : 'R';
  const section = sectionSelect ? sectionSelect.value : 'all';

  // Determine if the song has multi-track data (imported MIDI) or only flat notes.
  const hasTracks = !!(songDef.tracks && songDef.tracks.length > 0);
  const prefs = hasTracks ? getSongPrefs(songDef) : null;

  // Build the union of notes we care about, with metadata.
  // For multi-track: use tracks based on roles. For single: fall back to flat notes.
  const sourceNotes = [];
  if (hasTracks) {
    for (const tr of songDef.tracks) {
      const enabled = prefs.enabled[tr.id] !== false;
      const role = prefs.roles[tr.id] || 'accomp';
      if (!enabled || role === 'mute' || tr.isDrums) continue;
      for (const n of tr.notes) {
        sourceNotes.push({
          midi: n.midi, hand: n.hand, beat: n.beat, length: n.length,
          trackId: tr.id, trackColor: tr.color, role,
          trackSoundfont: tr.soundfontName,
        });
      }
    }
  } else {
    for (const n of songDef.notes) {
      sourceNotes.push({
        midi: n.midi, hand: n.hand, beat: n.beat, length: n.length,
        trackId: null, trackColor: null, role: 'user',
        trackSoundfont: null,
      });
    }
  }

  // Section filter on the unified set.
  const allBeats = sourceNotes.map((n) => n.beat);
  const songStart = allBeats.length ? Math.min(...allBeats, 0) : 0;
  const songEnd = allBeats.length
    ? Math.max(...sourceNotes.map((n) => n.beat + (n.length || 0)), 0)
    : 0;
  const songLen = songEnd - songStart;
  let from = songStart, to = songEnd;
  switch (section) {
    case 'first-half':     to = songStart + songLen / 2; break;
    case 'second-half':    from = songStart + songLen / 2; break;
    case 'first-quarter':  to = songStart + songLen / 4; break;
    case 'second-quarter': from = songStart + songLen / 4; to = songStart + songLen / 2; break;
    case 'third-quarter':  from = songStart + songLen / 2; to = songStart + 3 * songLen / 4; break;
    case 'fourth-quarter': from = songStart + 3 * songLen / 4; break;
  }
  function inSection(n) { return n.beat >= from - 0.001 && n.beat < to + 0.001; }
  function shiftBeat(b) { return b - from; }

  // Hand filter applies to user-role notes during practice. In autoplay we
  // play *everything* — the user is just listening, no filter.
  function matchesHand(n) {
    if (autoplay) return true;
    if (hand === 'both') return true;
    if (hand === 'right' && n.hand === 'R') return true;
    if (hand === 'left' && n.hand === 'L') return true;
    return false;
  }

  // User notes : role 'user' AND in section AND (matches hand filter).
  const userNotes = sourceNotes.filter((n) =>
    inSection(n) && n.role === 'user' && matchesHand(n)
  );

  // Accompaniment notes : everything else that should sound.
  // - Autoplay: play every accomp note + the user-track notes filtered out by hand.
  // - Multi-track practice: all enabled non-user, non-mute tracks.
  // - Single-track practice: the OTHER hand if accompOn is set (legacy behaviour).
  let accompNotes = [];
  if (hasTracks) {
    accompNotes = sourceNotes.filter((n) => inSection(n) && n.role === 'accomp');
    if (autoplay) {
      // Autoplay: nothing extra needed — every user note is already in userNotes
      // (matchesHand returns true). accompNotes already covers the rest.
    } else if (accompOn && (hand === 'right' || hand === 'left')) {
      const otherHandUserNotes = sourceNotes.filter((n) =>
        inSection(n) && n.role === 'user' && n.hand === otherHand
      );
      accompNotes = accompNotes.concat(otherHandUserNotes);
    }
  } else if (accompOn) {
    accompNotes = sourceNotes.filter((n) => inSection(n) && n.hand === otherHand);
  }

  lesson.song = songDef;
  lesson.hand = hand;
  lesson.tolerance = DIFFICULTY_TOLERANCE[diff] ?? 0.15;
  lesson.autoplay = autoplay;
  lesson.waitMode = autoplay ? false : !!(waitToggle && waitToggle.checked);
  lesson.loopMode = !!(loopToggle && loopToggle.checked);
  lesson.accompMode = accompOn;
  lesson.timeShift = 0;
  lesson.startTime = now() + LEAD_IN_SEC;
  lesson.notes = [
    ...userNotes.map((n) => ({
      midi: n.midi, hand: n.hand,
      expectedTime: lesson.startTime + shiftBeat(n.beat) * beatDur,
      duration: n.length * beatDur,
      resolved: null, flashUntil: 0, auto: false,
      trackColor: null,
      trackSoundfont: null,
    })),
    ...accompNotes.map((n) => ({
      midi: n.midi, hand: n.hand,
      expectedTime: lesson.startTime + shiftBeat(n.beat) * beatDur,
      duration: n.length * beatDur,
      resolved: null, flashUntil: 0, auto: true,
      trackColor: n.trackColor || null,
      trackSoundfont: n.trackSoundfont || null,
    })),
  ];

  // Préchargement des soundfonts de toutes les pistes audibles (best effort).
  if (hasTracks) preloadTrackSoundfonts(songDef);
  lesson.totalScorable = lesson.notes.filter((n) => !n.auto).length;
  lesson.hits = 0;
  lesson.misses = 0;
  lesson.combo = 0;
  lesson.totalDuration = lesson.notes.length > 0
    ? Math.max(...lesson.notes.map((n) => (n.expectedTime - lesson.startTime) + n.duration))
    : 0;
  lesson.running = true;
  lesson.finishing = false;
  if (lesson.loopTimer) { clearTimeout(lesson.loopTimer); lesson.loopTimer = null; }
  updateHud();

  if (autoplay) {
    playBtn.textContent = '■ Arrêter';
    playBtn.dataset.state = 'running';
    startBtn.disabled = true;
  } else {
    startBtn.textContent = 'Arrêter';
    startBtn.dataset.state = 'running';
    playBtn.disabled = true;
  }
  difficultySelect.disabled = true;
  songSelect.disabled = true;
  handSelect.disabled = true;
  if (sectionSelect) sectionSelect.disabled = true;
  if (seekBar) seekBar.hidden = false;
}

function stopLesson() {
  lesson.running = false;
  // Release any lingering autoplay-held notes.
  if (lesson.autoplay) {
    for (const n of lesson.notes) if (n.resolved === 'hit') releaseNote(n.midi);
  }
  lesson.autoplay = false;
  lesson.notes = [];
  if (lesson.loopTimer) { clearTimeout(lesson.loopTimer); lesson.loopTimer = null; }
  // Clear any wait hint left on keys.
  for (const el of keyEls.values()) el.classList.remove('wait-hint');
  startBtn.textContent = 'Démarrer';
  startBtn.dataset.state = '';
  startBtn.disabled = false;
  playBtn.textContent = '▶ Lecture';
  playBtn.dataset.state = '';
  playBtn.disabled = false;
  difficultySelect.disabled = false;
  songSelect.disabled = false;
  handSelect.disabled = false;
  if (sectionSelect) sectionSelect.disabled = false;
  if (seekBar) seekBar.hidden = true;
}

function registerLessonHit(midi) {
  const t = now();
  if (lesson.waitMode) {
    // Find the earliest non-hit user note with this midi.
    let target = null;
    for (const note of lesson.notes) {
      if (note.auto) continue;
      if (note.resolved === 'hit') continue;
      if (note.midi !== midi) continue;
      if (!target || note.expectedTime < target.expectedTime) target = note;
    }
    if (target) {
      // Mark target + every other user note with the same midi *at the same beat*
      // as hit too — covers the case where two user tracks contain the same
      // note simultaneously (e.g. shared note in multi-track imports).
      for (const note of lesson.notes) {
        if (note.auto || note.resolved === 'hit') continue;
        if (note.midi !== midi) continue;
        if (Math.abs(note.expectedTime - target.expectedTime) < 0.005) {
          note.resolved = 'hit';
          note.flashUntil = t + 0.35;
        }
      }
      lesson.hits++;
      lesson.combo++;
      updateHud();
      if (window.MASCOT) window.MASCOT.cheer('note');
      if (window.DAILY) window.DAILY.report('note-hit');
    }
    return;
  }
  let best = null;
  let bestDelta = Infinity;
  for (const note of lesson.notes) {
    if (note.auto) continue;
    if (note.resolved) continue;
    if (note.midi !== midi) continue;
    const d = Math.abs((note.expectedTime + lesson.timeShift) - t);
    if (d > lesson.tolerance) continue;
    if (d < bestDelta) { bestDelta = d; best = note; }
  }
  if (best) {
    best.resolved = 'hit';
    best.flashUntil = t + 0.35;
    lesson.hits++;
    lesson.combo++;
    updateHud();
    if (window.MASCOT) {
      window.MASCOT.cheer('note');
      if (lesson.combo > 0 && lesson.combo % 25 === 0) {
        window.MASCOT.celebrate('combo', { combo: lesson.combo });
        if (window.DAILY) window.DAILY.report('combo');
      }
    }
    if (window.DAILY) window.DAILY.report('note-hit');
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
  highwayCtx.fillStyle = '#0a0805';
  highwayCtx.fillRect(0, 0, W, H);
  const whiteW = W / whiteCount;
  highwayCtx.fillStyle = 'rgba(241, 230, 208, 0.018)';
  for (let i = 0; i < whiteCount; i += 2) {
    highwayCtx.fillRect(i * whiteW, 0, whiteW, H);
  }

  // hit line — brass accent
  const grad = highwayCtx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(212, 160, 73, 0)');
  grad.addColorStop(0.5, 'rgba(212, 160, 73, 0.55)');
  grad.addColorStop(1, 'rgba(212, 160, 73, 0)');
  highwayCtx.strokeStyle = grad;
  highwayCtx.lineWidth = 1.5;
  highwayCtx.beginPath();
  highwayCtx.moveTo(0, H - 1);
  highwayCtx.lineTo(W, H - 1);
  highwayCtx.stroke();

  if (!lesson.running) return;

  const t = now();

  // Wait mode: freeze time on the earliest unplayed user note that has reached the line.
  // Also flag the blocker midi(s) for visual cue on the on-screen keyboard.
  const waitHints = new Set();
  if (lesson.waitMode) {
    let blocker = null;
    for (const note of lesson.notes) {
      if (note.auto) continue;
      if (note.resolved === 'hit') continue;
      const adjusted = note.expectedTime + lesson.timeShift;
      if (adjusted <= t + 0.0001) {
        if (!blocker || note.expectedTime < blocker.expectedTime) blocker = note;
      }
    }
    if (blocker) {
      // Pin the blocker on the hit line (delta = 0) by extending the time shift.
      lesson.timeShift = t - blocker.expectedTime;
      // Find every user note expected at the same beat (chord support).
      for (const note of lesson.notes) {
        if (note.auto || note.resolved === 'hit') continue;
        if (Math.abs(note.expectedTime - blocker.expectedTime) < 0.005) {
          waitHints.add(note.midi);
        }
      }
    }
  }
  // Apply visual wait hint on keys.
  for (const [midi, el] of keyEls) {
    if (waitHints.has(midi)) el.classList.add('wait-hint');
    else el.classList.remove('wait-hint');
  }

  // Autoplay mode (full) — and accompaniment notes (n.auto = true) — are
  // triggered as they cross the hit line.
  for (const note of lesson.notes) {
    if (note.resolved) continue;
    const playMe = lesson.autoplay || note.auto;
    if (!playMe) continue;
    const adjusted = note.expectedTime + lesson.timeShift;
    if (adjusted > t) continue;
    note.resolved = 'hit';
    note.flashUntil = t + 0.35;
    triggerNote(note.midi, note.auto ? 80 : 95, note.trackSoundfont || null);
    const dur = Math.max(0.15, note.duration);
    setTimeout(() => releaseNote(note.midi), dur * 1000);
  }

  let allDone = true;
  for (const note of lesson.notes) {
    const delta = (note.expectedTime + lesson.timeShift) - t; // >0 future, <0 past
    if (delta > LOOKAHEAD_SEC) { allDone = false; continue; }
    if (delta < -1.0 && note.resolved) continue;
    if (note.resolved !== 'hit') allDone = false;

    if (!lesson.waitMode && !lesson.autoplay && !note.auto && !note.resolved && delta < -lesson.tolerance) {
      note.resolved = 'miss';
      note.flashUntil = t + 0.4;
      lesson.misses++;
      lesson.combo = 0;
      updateHud();
      if (window.MASCOT) window.MASCOT.oops();
    }

    const bounds = keyXBounds(note.midi);
    if (!bounds) continue;
    // y of note head (bottom edge): delta=LOOKAHEAD → y=0, delta=0 → y=H
    const yHead = H * (1 - delta / LOOKAHEAD_SEC);
    const noteH = Math.max(6, (note.duration / LOOKAHEAD_SEC) * H);
    const yTop = yHead - noteH;

    let color;
    if (note.auto && note.trackColor) {
      color = note.trackColor;
    } else {
      color = HAND_COLOR[note.hand] || '#888';
    }
    if (note.resolved === 'hit' && !lesson.autoplay) color = HIT_COLOR;
    else if (note.resolved === 'miss') color = MISS_COLOR;

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
      let stroke;
      if (note.resolved === 'miss') stroke = '#e08e80';
      else if (note.resolved === 'hit' && lesson.autoplay) stroke = 'rgba(241, 230, 208, 0.85)';
      else stroke = '#b5d8be';
      highwayCtx.strokeStyle = stroke;
      highwayCtx.lineWidth = 2;
      roundRect(highwayCtx, x - 1, yTop - 1, w + 2, noteH + 2, r + 1);
      highwayCtx.stroke();
    }
  }

  if (allDone && lesson.notes.length > 0 && !lesson.finishing) {
    lesson.finishing = true;
    const loop = lesson.loopMode;
    const wasAutoplay = lesson.autoplay;
    const delay = loop ? 2000 : 1500;
    if (!wasAutoplay && window.MASCOT && lesson.totalScorable > 0) {
      const acc = lesson.hits / lesson.totalScorable;
      const xp = Math.round(15 + acc * 25);
      window.MASCOT.celebrate('lesson', { xp });
    }
    if (!wasAutoplay && window.DAILY && lesson.totalScorable > 0) {
      window.DAILY.report('song-done');
    }
    lesson.loopTimer = setTimeout(() => {
      lesson.loopTimer = null;
      if (!lesson.running) return;
      if (loop) startLesson(wasAutoplay);
      else stopLesson();
    }, delay);
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
  updateSeek();
  requestAnimationFrame(animate);
}

function formatMmss(s) {
  s = Math.max(0, Math.floor(s));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm + ':' + (ss < 10 ? '0' : '') + ss;
}

function updateSeek() {
  if (!seekBar || seekBar.hidden) return;
  if (!lesson.running || !lesson.totalDuration) return;
  const t = now();
  const elapsed = Math.max(0, Math.min(lesson.totalDuration, t - lesson.startTime - lesson.timeShift));
  const pct = (elapsed / lesson.totalDuration) * 100;
  if (seekProgress) seekProgress.style.width = pct + '%';
  if (seekThumb) seekThumb.style.left = pct + '%';
  if (seekTime) seekTime.textContent = formatMmss(elapsed) + ' / ' + formatMmss(lesson.totalDuration);
}

function seekTo(posSec) {
  if (!lesson.running) return;
  const t = now();
  const target = Math.max(0, Math.min(lesson.totalDuration, posSec));
  const oldStartTime = lesson.startTime;
  const newStartTime = t - target;
  const delta = newStartTime - oldStartTime;
  // Rebase every note's expectedTime so the timeline aligns with the new origin.
  for (const n of lesson.notes) {
    n.expectedTime += delta;
  }
  lesson.startTime = newStartTime;
  lesson.timeShift = 0;
  lesson.finishing = false;
  if (lesson.loopTimer) { clearTimeout(lesson.loopTimer); lesson.loopTimer = null; }
  // Mark notes already gone past as resolved (so they don't replay), reset future ones.
  for (const n of lesson.notes) {
    if (n.expectedTime + n.duration < t) {
      n.resolved = 'hit';
      n.flashUntil = 0;
    } else {
      n.resolved = null;
      n.flashUntil = 0;
    }
  }
  // Stop any currently held autoplay/accomp notes (don't kill user-pressed keys).
  for (const m of [...activeVoices.keys()]) {
    if (held.has(m)) continue;
    stopAudio(m, true);
  }
}

function seekRelative(deltaSec) {
  if (!lesson.running) return;
  const t = now();
  const cur = t - lesson.startTime - lesson.timeShift;
  seekTo(cur + deltaSec);
}

if (seekBackBtn) seekBackBtn.addEventListener('click', () => seekRelative(-5));
if (seekForwardBtn) seekForwardBtn.addEventListener('click', () => seekRelative(+5));

if (seekTrack) {
  let dragging = false;
  function pickFromEvent(e) {
    const rect = seekTrack.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const pct = Math.max(0, Math.min(1, x));
    seekTo(pct * lesson.totalDuration);
  }
  seekTrack.addEventListener('pointerdown', (e) => {
    if (!lesson.running) return;
    dragging = true;
    seekTrack.setPointerCapture(e.pointerId);
    pickFromEvent(e);
  });
  seekTrack.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    pickFromEvent(e);
  });
  seekTrack.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    try { seekTrack.releasePointerCapture(e.pointerId); } catch (_) {}
  });
}

// ---------- Init ----------

connectBtn.addEventListener('click', connectMIDI);
setKeyboardLayout(loadKeyboardLayout());
document.querySelectorAll('[data-kb-layout]').forEach((b) => {
  b.addEventListener('click', () => setKeyboardLayout(b.dataset.kbLayout));
});
populateInstrumentSelect();
setInstrumentState('idle', 'Tape une touche pour charger ' + getInstrument(DEFAULT_INSTRUMENT_ID).label);

difficultySelect.value = 'very-easy';
populateSongSelect();
difficultySelect.addEventListener('change', populateSongSelect);
startBtn.addEventListener('click', () => {
  if (lesson.running) { stopLesson(); return; }
  const songDef = (window.SONGS || []).find((s) => s.id === songSelect.value);
  if (songDef && songDef.tracks && songDef.tracks.length > 1) {
    openPrestartModal(songDef);
  } else {
    startLesson(false);
  }
});

// ---------- Prestart modal — pick the track you'll play ----------

function openPrestartModal(songDef) {
  const overlay = document.getElementById('modal-prestart');
  const list = document.getElementById('prestart-tracks');
  if (!overlay || !list) { startLesson(false); return; }
  const prefs = getSongPrefs(songDef);
  list.innerHTML = '';

  // Local pick set: which track ids are part of "my parts".
  const picks = new Set(
    Object.keys(prefs.roles).filter((id) => prefs.roles[id] === 'user')
  );
  if (picks.size === 0 && prefs.userTrackId) picks.add(prefs.userTrackId);

  function repaintRow(row, trId) {
    const isPicked = picks.has(trId);
    row.classList.toggle('is-selected', isPicked);
    const m = row.querySelector('.prestart-mark');
    if (m) m.textContent = isPicked ? '★' : '☆';
  }

  for (const tr of songDef.tracks) {
    if (tr.isDrums) continue;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'prestart-track';
    row.dataset.trackId = tr.id;
    row.innerHTML = `
      <span class="prestart-swatch" style="background:${tr.color}"></span>
      <div class="prestart-meta">
        <strong>${tr.name}</strong>
        <span>${tr.category} · ${tr.noteCount} notes</span>
      </div>
      <span class="prestart-mark" aria-hidden="true">☆</span>
    `;
    repaintRow(row, tr.id);
    row.addEventListener('click', () => {
      if (picks.has(tr.id)) picks.delete(tr.id);
      else picks.add(tr.id);
      repaintRow(row, tr.id);
    });
    list.appendChild(row);
  }

  document.getElementById('prestart-go').onclick = () => {
    if (picks.size === 0) {
      // Force at least one track if user clicked Démarrer with nothing selected.
      const first = songDef.tracks.find((t) => !t.isDrums);
      if (first) picks.add(first.id);
    }
    updateSongPrefs(songDef, (p) => {
      // Demote everything, then promote what's in picks.
      for (const id of Object.keys(p.roles)) {
        if (p.roles[id] === 'user') p.roles[id] = 'accomp';
      }
      for (const id of picks) {
        p.roles[id] = 'user';
        p.enabled[id] = true;
      }
      // userTrackId tracks the "primary" pick — use the first one in track order.
      const primary = songDef.tracks.find((t) => picks.has(t.id));
      if (primary) p.userTrackId = primary.id;
    });
    renderTracksPanel();
    closePrestartModal();
    startLesson(false);
  };
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  document.body.classList.add('modal-locked');
}

function closePrestartModal() {
  const overlay = document.getElementById('modal-prestart');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.classList.remove('modal-locked');
  setTimeout(() => { overlay.hidden = true; }, 220);
}
document.addEventListener('click', (e) => {
  const close = e.target.closest('#modal-prestart [data-modal-close], #modal-prestart');
  if (close && (e.target.hasAttribute('data-modal-close') || e.target.id === 'modal-prestart')) {
    closePrestartModal();
  }
});

playBtn.addEventListener('click', () => {
  if (lesson.running) stopLesson();
  else startLesson(true);
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

// ---------- MIDI file import ----------

function getMidiCtor() {
  return (
    (window['@tonejs/midi'] && window['@tonejs/midi'].Midi) ||
    window.Midi ||
    null
  );
}

function ensureImportedDifficulty() {
  const exists = [...difficultySelect.options].some((o) => o.value === 'imported');
  if (exists) return;
  const opt = document.createElement('option');
  opt.value = 'imported';
  opt.textContent = 'Importés';
  difficultySelect.appendChild(opt);
}

// GM instrument category from program number (0-127). Returns short FR label.
function gmCategory(program) {
  if (program < 8)   return 'Piano';
  if (program < 16)  return 'Cloches / Mallets';
  if (program < 24)  return 'Orgue';
  if (program < 32)  return 'Guitare';
  if (program < 40)  return 'Basse';
  if (program < 48)  return 'Cordes';
  if (program < 56)  return 'Ensemble';
  if (program < 64)  return 'Cuivres';
  if (program < 72)  return 'Anches';
  if (program < 80)  return 'Bois';
  if (program < 88)  return 'Synthé lead';
  if (program < 96)  return 'Synthé pad';
  if (program < 104) return 'Synthé FX';
  if (program < 112) return 'Ethnique';
  if (program < 120) return 'Percussions';
  return 'Effets';
}

function prettifyInstrument(name, fallback) {
  if (!name) return fallback;
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// General MIDI program → soundfont name (gleitz/midi-js-soundfonts).
const GM_SOUNDFONT_NAMES = [
  // 0-7 piano
  'acoustic_grand_piano','bright_acoustic_piano','electric_grand_piano','honky_tonk_piano',
  'electric_piano_1','electric_piano_2','harpsichord','clavinet',
  // 8-15 chromatic percussion
  'celesta','glockenspiel','music_box','vibraphone','marimba','xylophone','tubular_bells','dulcimer',
  // 16-23 organ
  'drawbar_organ','percussive_organ','rock_organ','church_organ','reed_organ','accordion','harmonica','tango_accordion',
  // 24-31 guitar
  'acoustic_guitar_nylon','acoustic_guitar_steel','electric_guitar_jazz','electric_guitar_clean',
  'electric_guitar_muted','overdriven_guitar','distortion_guitar','guitar_harmonics',
  // 32-39 bass
  'acoustic_bass','electric_bass_finger','electric_bass_pick','fretless_bass',
  'slap_bass_1','slap_bass_2','synth_bass_1','synth_bass_2',
  // 40-47 strings
  'violin','viola','cello','contrabass','tremolo_strings','pizzicato_strings','orchestral_harp','timpani',
  // 48-55 ensemble
  'string_ensemble_1','string_ensemble_2','synth_strings_1','synth_strings_2',
  'choir_aahs','voice_oohs','synth_choir','orchestra_hit',
  // 56-63 brass
  'trumpet','trombone','tuba','muted_trumpet','french_horn','brass_section','synth_brass_1','synth_brass_2',
  // 64-71 reed
  'soprano_sax','alto_sax','tenor_sax','baritone_sax','oboe','english_horn','bassoon','clarinet',
  // 72-79 pipe
  'piccolo','flute','recorder','pan_flute','blown_bottle','shakuhachi','whistle','ocarina',
  // 80-87 synth lead
  'lead_1_square','lead_2_sawtooth','lead_3_calliope','lead_4_chiff',
  'lead_5_charang','lead_6_voice','lead_7_fifths','lead_8_bass__lead',
  // 88-95 synth pad
  'pad_1_new_age','pad_2_warm','pad_3_polysynth','pad_4_choir',
  'pad_5_bowed','pad_6_metallic','pad_7_halo','pad_8_sweep',
  // 96-103 fx
  'fx_1_rain','fx_2_soundtrack','fx_3_crystal','fx_4_atmosphere',
  'fx_5_brightness','fx_6_goblins','fx_7_echoes','fx_8_sci_fi',
  // 104-111 ethnic
  'sitar','banjo','shamisen','koto','kalimba','bag_pipe','fiddle','shanai',
  // 112-119 percussive
  'tinkle_bell','agogo','steel_drums','woodblock','taiko_drum','melodic_tom','synth_drum','reverse_cymbal',
  // 120-127 sound effects
  'guitar_fret_noise','breath_noise','seashore','bird_tweet','telephone_ring','helicopter','applause','gunshot'
];

function gmSoundfontName(program) {
  return GM_SOUNDFONT_NAMES[program] || 'acoustic_grand_piano';
}

// Assign each note to a hand (L/R) using voicing: notes that start at the
// same time form a chord (one hand if tight, split if there's a clear bass);
// isolated notes are attached to the voice whose last note is closest in
// pitch (tracks each hand's "last position" through time).
//
// Input/output: array of {midi, beat, length, ...}. Mutates `hand` field.
function assignHands(notes) {
  if (!notes || notes.length === 0) return notes;
  const sorted = notes.slice().sort((a, b) => a.beat - b.beat || a.midi - b.midi);

  // Initial guess for each voice's "current position" — use overall pitch range.
  const allPitches = sorted.map((n) => n.midi);
  const lo = Math.min(...allPitches);
  const hi = Math.max(...allPitches);
  let vLPitch = lo + (hi - lo) * 0.25;
  let vRPitch = lo + (hi - lo) * 0.75;
  // If range is narrow, fall back to a fixed middle-C-ish split.
  if (hi - lo < 10) {
    for (const n of sorted) n.hand = n.midi >= 60 ? 'R' : 'L';
    return sorted;
  }

  // Group simultaneous notes (within ~30 ms at typical bpm = 0.05 beat).
  const SIM_BEAT = 0.05;
  const BASS_GAP = 7; // semitones — gap below which a note is the bass of a chord

  let i = 0;
  while (i < sorted.length) {
    const grp = [sorted[i]];
    let j = i + 1;
    while (j < sorted.length && sorted[j].beat - sorted[i].beat < SIM_BEAT) {
      grp.push(sorted[j]);
      j++;
    }
    grp.sort((a, b) => a.midi - b.midi);

    if (grp.length === 1) {
      const n = grp[0];
      const dL = Math.abs(n.midi - vLPitch);
      const dR = Math.abs(n.midi - vRPitch);
      const assignR = (Math.abs(dL - dR) < 1) ? (n.midi >= (vLPitch + vRPitch) / 2) : (dR < dL);
      n.hand = assignR ? 'R' : 'L';
      if (assignR) vRPitch = n.midi; else vLPitch = n.midi;
    } else {
      const lowest = grp[0];
      const rest = grp.slice(1);
      const gap = rest[0].midi - lowest.midi;
      // Clear bass + chord above → split. Tight cluster → single hand.
      if (gap >= BASS_GAP) {
        lowest.hand = 'L';
        for (const n of rest) n.hand = 'R';
        vLPitch = lowest.midi;
        vRPitch = rest[rest.length - 1].midi;
      } else {
        // Single-hand chord: use mean and last-position bias.
        const mean = grp.reduce((a, n) => a + n.midi, 0) / grp.length;
        const dL = Math.abs(mean - vLPitch);
        const dR = Math.abs(mean - vRPitch);
        const isR = (Math.abs(dL - dR) < 1) ? (mean >= (vLPitch + vRPitch) / 2) : (dR < dL);
        for (const n of grp) n.hand = isR ? 'R' : 'L';
        if (isR) vRPitch = grp[grp.length - 1].midi;
        else vLPitch = lowest.midi;
      }
    }
    i = j;
  }
  return sorted;
}

// Track palette (assigned in order, cycles).
const TRACK_PALETTE = [
  '#d4a049', // brass
  '#5c98a7', // petrol
  '#8eba9b', // sage
  '#cd6555', // terra
  '#9c87b8', // muted purple
  '#e8b760', // brass-bright
  '#7cb6c4', // petrol-bright
  '#c9b894', // ivory dim
];

function midiFileToSong(file, midi) {
  const ppq = midi.header.ppq || 480;
  const tempos = midi.header.tempos || [];
  const bpm = Math.max(40, Math.round((tempos[0] && tempos[0].bpm) || 120));

  // Build a track per source MIDI track that has notes.
  const tracksWithNotes = midi.tracks.filter((t) => t.notes && t.notes.length > 0);
  if (tracksWithNotes.length === 0) return null;

  // Compute global shift on the union of all melodic (non-drum) notes.
  const allMelodic = [];
  for (const t of tracksWithNotes) {
    if (t.channel === 9) continue; // skip drums for shift calc
    for (const n of t.notes) allMelodic.push(n.midi);
  }
  const fullMin = allMelodic.length ? Math.min(...allMelodic) : 60;
  const fullMax = allMelodic.length ? Math.max(...allMelodic) : 60;
  const winCenter = (FIRST_MIDI + LAST_MIDI) / 2;
  const songCenter = (fullMin + fullMax) / 2;
  let shift = Math.round((winCenter - songCenter) / 12) * 12;
  for (let attempt = 0; attempt < 4; attempt++) {
    const min = fullMin + shift;
    const max = fullMax + shift;
    if (min >= FIRST_MIDI && max <= LAST_MIDI) break;
    if (max > LAST_MIDI && min - 12 >= FIRST_MIDI) shift -= 12;
    else if (min < FIRST_MIDI && max + 12 <= LAST_MIDI) shift += 12;
    else break;
  }

  // Find the global earliest tick to normalize start to 0.
  const allTicks = tracksWithNotes.flatMap((t) => t.notes.map((n) => n.ticks));
  const minTick = Math.min(...allTicks, 0);

  // Build per-track structures.
  const tracks = tracksWithNotes.map((src, idx) => {
    const isDrums = src.channel === 9;
    const program = (src.instrument && src.instrument.number) || 0;
    const rawName = (src.name && src.name.trim()) || (src.instrument && src.instrument.name);
    const niceName = isDrums ? 'Batterie' : prettifyInstrument(rawName, gmCategory(program));
    const category = isDrums ? 'Batterie' : gmCategory(program);
    const isPiano = !isDrums && program < 8;
    const trackShift = isDrums ? 0 : shift; // never transpose drum hits

    const noteMidis = src.notes.map((n) => n.midi);
    const lo = Math.min(...noteMidis);
    const hi = Math.max(...noteMidis);
    const avg = noteMidis.reduce((a, b) => a + b, 0) / noteMidis.length;

    // Build notes first (no hand yet), then run a voicing pass.
    let notes = src.notes.map((n) => ({
      midi: n.midi + trackShift,
      hand: 'R',
      beat: (n.ticks - minTick) / ppq,
      length: Math.max(0.1, n.durationTicks / ppq),
    }));
    if (isPiano && !isDrums) {
      notes = assignHands(notes);
    } else {
      notes.sort((a, b) => a.beat - b.beat);
      // Non-piano tracks: a single voice — assign by overall median.
      const median = noteMidis.length ? noteMidis.slice().sort((a, b) => a - b)[Math.floor(noteMidis.length / 2)] : 60;
      const splitFallback = avg + trackShift >= 60 ? 60 : (median + trackShift);
      for (const n of notes) n.hand = n.midi >= splitFallback ? 'R' : 'L';
    }

    return {
      id: 'tr' + idx,
      name: niceName,
      category,
      channel: src.channel,
      program,
      isDrums,
      isPiano,
      soundfontName: isDrums ? null : gmSoundfontName(program),
      color: TRACK_PALETTE[idx % TRACK_PALETTE.length],
      noteCount: notes.length,
      avg,
      lo: lo + trackShift,
      hi: hi + trackShift,
      notes,
    };
  });

  // Decide default user track : the highest-pitched piano track (typically RH).
  const pianoTracks = tracks.filter((t) => t.isPiano);
  const userTrackId = (pianoTracks.length
    ? pianoTracks.sort((a, b) => b.avg - a.avg)[0]
    : tracks.filter((t) => !t.isDrums).sort((a, b) => b.avg - a.avg)[0] || tracks[0]
  ).id;

  // Default roles: user track = 'user', other non-drum tracks = 'accomp', drums = 'mute'.
  const defaultRoles = {};
  const defaultEnabled = {};
  for (const t of tracks) {
    defaultRoles[t.id] = (t.id === userTrackId) ? 'user' : (t.isDrums ? 'mute' : 'accomp');
    defaultEnabled[t.id] = !t.isDrums;
  }

  // Flatten notes for legacy code paths (default = user track only, hands assigned by pitch).
  const userTrack = tracks.find((t) => t.id === userTrackId);
  const notes = userTrack ? userTrack.notes.map((n) => ({ ...n })) : [];

  // Stats.
  const fitted = tracks.flatMap((t) => t.notes.map((n) => n.midi));
  const offWindow = fitted.filter((m) => m < FIRST_MIDI || m > LAST_MIDI).length;

  const title = file.name.replace(/\.(mid|midi)$/i, '');
  return {
    song: {
      id: 'import-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      title,
      difficulty: 'imported',
      bpm,
      notes,
      tracks,
      defaultRoles,
      defaultEnabled,
      defaultUserTrackId: userTrackId,
    },
    folded: 0,
    offWindow,
    shift,
    originalRange: { min: fullMin, max: fullMax },
  };
}

async function importMidiFile(file, opts = {}) {
  const Ctor = getMidiCtor();
  if (!Ctor) {
    alert("Bibliothèque @tonejs/midi non chargée. Vérifie ta connexion internet.");
    return;
  }
  try {
    const buffer = await file.arrayBuffer();
    const midi = new Ctor(buffer);
    const result = midiFileToSong(file, midi);
    if (!result) { alert('Aucune note utilisable dans ' + file.name); return; }
    window.SONGS = window.SONGS || [];
    window.SONGS.push(result.song);
    ensureImportedDifficulty();
    if (!opts.skipPersist && window.MIDI_STORE) {
      try {
        const blob = new Blob([buffer], { type: 'audio/midi' });
        await window.MIDI_STORE.put({ name: file.name, blob });
      } catch (e) { console.warn('[storage] persist failed', e); }
    }
    if (!opts.skipFocus) {
      difficultySelect.value = 'imported';
      populateSongSelect();
      songSelect.value = result.song.id;
    }
    const orig = result.originalRange;
    const origRange = `${orig.min}–${orig.max}`;
    const fitMsg = result.offWindow > 0
      ? `${result.offWindow} note(s) hors clavier visible (jouées en audio mais non affichées)`
      : `toutes les notes dans le clavier visible`;
    console.info(`${file.name} importé · transposition globale ${result.shift} demi-tons · plage MIDI originale ${origRange} · ${fitMsg}.`);
  } catch (e) {
    console.error(e);
    alert('Échec d\'import : ' + (e.message || e));
  }
}

async function importMidiFiles(fileList) {
  const files = [...fileList].filter((f) => /\.(mid|midi)$/i.test(f.name) || f.type === 'audio/midi');
  for (const f of files) await importMidiFile(f);
}

// Restore previously imported MIDI files from IndexedDB at boot.
async function restoreImportedLibrary() {
  if (!window.MIDI_STORE) return;
  try {
    const items = await window.MIDI_STORE.list();
    if (!items || items.length === 0) return;
    items.sort((a, b) => a.importedAt - b.importedAt);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const file = new File([it.blob], it.name, { type: 'audio/midi' });
      await importMidiFile(file, { skipPersist: true, skipFocus: i < items.length - 1 });
    }
    console.info(`[storage] restored ${items.length} imported MIDI`);
  } catch (e) {
    console.warn('[storage] restore failed', e);
  }
}

async function clearImportedLibrary() {
  if (!window.MIDI_STORE) return;
  if (!confirm('Vider la bibliothèque d\'imports ? Les morceaux importés seront effacés.')) return;
  try { await window.MIDI_STORE.clear(); } catch (_) {}
  // Remove imported songs from in-memory list and refresh.
  window.SONGS = (window.SONGS || []).filter((s) => s.difficulty !== 'imported');
  // Hide the "Imported" option if it was added.
  const opt = [...difficultySelect.options].find((o) => o.value === 'imported');
  if (opt) opt.remove();
  if (difficultySelect.value === 'imported') difficultySelect.value = 'very-easy';
  populateSongSelect();
}

if (importBtn && importInput) {
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', () => {
    if (importInput.files && importInput.files.length) {
      importMidiFiles(importInput.files);
      importInput.value = '';
    }
  });
}

const libraryClearBtn = document.getElementById('lesson-library-clear');
if (libraryClearBtn) {
  libraryClearBtn.addEventListener('click', clearImportedLibrary);
}

// Restore previously imported MIDI from IndexedDB.
restoreImportedLibrary();

// Drag and drop anywhere on the window
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault();
  dragDepth++;
  if (dropOverlay) dropOverlay.hidden = false;
});
window.addEventListener('dragover', (e) => {
  if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (e) => {
  if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0 && dropOverlay) dropOverlay.hidden = true;
});
window.addEventListener('drop', (e) => {
  if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
  e.preventDefault();
  dragDepth = 0;
  if (dropOverlay) dropOverlay.hidden = true;
  importMidiFiles(e.dataTransfer.files);
});

// ---------- MIDI library search (BitMidi) ----------

const BITMIDI_API = 'https://bitmidi.com/api/midi/search';
const BITMIDI_BASE = 'https://bitmidi.com';

function setLibraryStatus(state, msg) {
  if (!libraryStatusEl) return;
  if (!state) { libraryStatusEl.hidden = true; libraryStatusEl.textContent = ''; return; }
  libraryStatusEl.hidden = false;
  libraryStatusEl.dataset.state = state;
  libraryStatusEl.textContent = msg;
}

function clearLibraryResults() {
  if (!libraryResultsEl) return;
  libraryResultsEl.innerHTML = '';
  libraryResultsEl.hidden = true;
}

function prettyTitle(name) {
  return name
    .replace(/\.midi?$/i, '')
    .replace(/[_+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function searchMidiLibrary(query) {
  if (!query) return;
  clearLibraryResults();
  setLibraryStatus('loading', 'Recherche…');
  librarySearchBtn.disabled = true;

  try {
    const url = `${BITMIDI_API}?q=${encodeURIComponent(query)}&pageSize=20`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const results = (data && data.result && data.result.results) || [];
    if (results.length === 0) {
      setLibraryStatus('error', 'Aucun résultat');
      return;
    }
    renderLibraryResults(results);
    setLibraryStatus('ok', `${results.length} résultat${results.length > 1 ? 's' : ''}`);
  } catch (e) {
    console.error(e);
    setLibraryStatus('error', 'Erreur réseau (CORS / connexion)');
  } finally {
    librarySearchBtn.disabled = false;
  }
}

function renderLibraryResults(results) {
  libraryResultsEl.innerHTML = '';
  for (const r of results) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'library-result';
    const title = document.createElement('span');
    title.className = 'library-result-title';
    title.textContent = prettyTitle(r.name);
    title.title = r.name;
    const meta = document.createElement('span');
    meta.className = 'library-result-meta';
    const plays = (r.plays || 0).toLocaleString('fr-FR');
    meta.textContent = `▶ ${plays}`;
    btn.appendChild(title);
    btn.appendChild(meta);
    btn.addEventListener('click', () => downloadAndImportFromLibrary(btn, r));
    libraryResultsEl.appendChild(btn);
  }
  libraryResultsEl.hidden = false;
}

async function downloadAndImportFromLibrary(btn, result) {
  const downloadUrl = result.downloadUrl?.startsWith('http')
    ? result.downloadUrl
    : BITMIDI_BASE + (result.downloadUrl || '');
  if (!downloadUrl) {
    setLibraryStatus('error', 'Pas de lien de téléchargement');
    return;
  }
  btn.classList.add('is-loading');
  setLibraryStatus('loading', 'Téléchargement…');
  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    const file = new File([blob], result.name || 'imported.mid', { type: 'audio/midi' });
    await importMidiFile(file);
    setLibraryStatus('ok', 'Importé · prêt à jouer');
  } catch (e) {
    console.error(e);
    setLibraryStatus('error', 'Échec du téléchargement');
  } finally {
    btn.classList.remove('is-loading');
  }
}

if (librarySearchBtn && librarySearchInput) {
  const trigger = () => {
    const q = librarySearchInput.value.trim();
    if (q.length >= 2) searchMidiLibrary(q);
    else setLibraryStatus('error', 'Tape au moins 2 caractères');
  };
  librarySearchBtn.addEventListener('click', trigger);
  librarySearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); trigger(); }
  });
}

// ---------- Mic bridge ----------
// Called by mic.js when a note is detected from the microphone.
// We do NOT play audio (the acoustic piano already sounds): we just
// pulse the on-screen key and notify the lesson engine.

window.MIC_EMIT = function (midi) {
  // Fold to the on-screen window so a real piano (any octave) maps to
  // the curriculum range and lights the right visual key.
  const target = clampToScreenRange(midi);
  const el = keyEls.get(target);
  if (el) {
    el.classList.add('mic-flash');
    setTimeout(() => el.classList.remove('mic-flash'), 280);
  }
  if (window.SCHOOL && window.SCHOOL.isActive()) {
    window.SCHOOL.onNoteOn(target);
    setTimeout(() => window.SCHOOL.onNoteOff(target), 250);
  }
  if (lesson.running) registerLessonHit(target);
  noteDisplayEl.textContent = midiToName(target);
  setTimeout(() => {
    if (held.size === 0) noteDisplayEl.textContent = '—';
  }, 400);
};

// Map any MIDI note to the visible C3–C5 window by folding octaves.
// Used only for the visual flash; the lesson engine receives the real midi.
function clampToScreenRange(midi) {
  let m = midi;
  while (m > LAST_MIDI) m -= 12;
  while (m < FIRST_MIDI) m += 12;
  return m;
}

// ---------- School bridge ----------

window.SCHOOL_HELD = held;

window.SCHOOL_PLAY = function (sequence) {
  ensureAudio();
  const timeouts = [];
  let cancelled = false;
  let t = 0;

  for (const step of sequence) {
    const startAt = t * 1000;
    const dur = Math.max(0.15, step.dur || 0.4);
    const notes = step.chord || [step.midi];
    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      for (const m of notes) triggerNote(m, 95);
    }, startAt));
    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      for (const m of notes) releaseNote(m);
    }, startAt + dur * 1000));
    // Add a tiny gap between consecutive non-chord notes for clarity.
    t += dur + (step.chord ? 0.05 : 0.03);
  }

  return {
    cancel: () => {
      cancelled = true;
      for (const id of timeouts) clearTimeout(id);
    },
  };
};

// ---------- Boot ----------

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(
    (access) => { attachInputs(access); access.onstatechange = () => attachInputs(access); },
    () => { setStatus('idle', 'MIDI en veille — clique pour autoriser'); }
  );
} else {
  setStatus('error', 'Web MIDI non supporté par ce navigateur');
}
