// Microphone listener — detects piano notes from the Mac mic
// using monophonic pitch detection (autocorrelation, MPM-style).
//
// Public API:
//   window.MIC.toggle()  — start/stop
//   window.MIC.isOn()
//
// On detected note, calls window.MIC_EMIT(midi) (set by app.js) which
// flashes the on-screen key and notifies the École engine.

(function () {
  // ------------------------------------------------------------
  // Tunables
  // ------------------------------------------------------------
  const SAMPLE_BUFFER = 2048;          // analyser fft buffer
  const ONSET_COOLDOWN_MS = 120;       // min time between two detected notes
  const SAME_NOTE_REPEAT_MS = 220;     // min time before accepting same note again
  const PITCH_CLARITY = 0.92;          // 1 - threshold; higher = stricter
  const MIDI_LO = 36;                  // C2 — accept anything from a real piano
  const MIDI_HI = 96;                  // C7
  const VU_DECAY = 0.85;

  // Sensitivity 1..10 maps to MIN_RMS and ONSET_RATIO.
  let MIN_RMS = 0.012;
  let ONSET_RATIO = 1.6;
  function applySensitivity(s) {
    const v = Math.max(1, Math.min(10, s));
    // 1 = strict (less false positives), 10 = sensitive (catches softer notes)
    MIN_RMS = 0.030 - (v - 1) * 0.0028;     // 0.030 → 0.005
    ONSET_RATIO = 2.4 - (v - 1) * 0.13;     // 2.4 → 1.23
    try { localStorage.setItem('etude-mic-sens', String(v)); } catch (_) {}
  }
  function loadSensitivity() {
    try {
      const v = +localStorage.getItem('etude-mic-sens');
      if (v >= 1 && v <= 10) {
        applySensitivity(v);
        return v;
      }
    } catch (_) {}
    return 5;
  }

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------
  const state = {
    on: false,
    audioCtx: null,
    stream: null,
    source: null,
    analyser: null,
    rafId: null,
    buffer: null,
    lastEnergy: 0,
    armed: true,                       // ready to detect next attack
    lastEmitTime: 0,
    lastEmitMidi: -1,
    vu: 0,
  };

  let els = null;
  function getEls() {
    if (els) return els;
    els = {
      btn: document.getElementById('mic-btn'),
      btnLabel: document.querySelector('#mic-btn .mic-btn-label'),
      label: document.getElementById('mic-label'),
      meter: document.getElementById('mic-meter-fill'),
      note: document.getElementById('mic-last-note'),
      sens: document.getElementById('mic-sens'),
    };
    return els;
  }

  function setBtnLabel(text) {
    const e = getEls();
    if (e.btnLabel) e.btnLabel.textContent = text;
  }

  // ------------------------------------------------------------
  // Pitch detection — autocorrelation with parabolic interpolation
  // (Chris Wilson / WebAudio pitch-detect, robust on piano fundamentals)
  // ------------------------------------------------------------

  function autoCorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < MIN_RMS) return { freq: -1, rms };

    // Trim quiet edges.
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }
    const trimmed = buf.subarray(r1, r2);
    const N = trimmed.length;
    if (N < 64) return { freq: -1, rms };

    // Autocorrelation.
    const c = new Float32Array(N);
    for (let lag = 0; lag < N; lag++) {
      let sum = 0;
      const limit = N - lag;
      for (let j = 0; j < limit; j++) sum += trimmed[j] * trimmed[j + lag];
      c[lag] = sum;
    }

    // Find first descent then first peak (skips the lag-0 maximum).
    let d = 0;
    while (d + 1 < N && c[d] > c[d + 1]) d++;

    let maxVal = -1, maxPos = -1;
    for (let i = d; i < N; i++) {
      if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
    }
    if (maxPos <= 0 || maxPos >= N - 1) return { freq: -1, rms };

    // Parabolic interpolation around the peak.
    const x1 = c[maxPos - 1], x2 = c[maxPos], x3 = c[maxPos + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    let T0 = maxPos;
    if (a !== 0) T0 = maxPos - b / (2 * a);

    const clarity = c[0] > 0 ? maxVal / c[0] : 0;
    if (clarity < (1 - PITCH_CLARITY)) return { freq: -1, rms };

    return { freq: sampleRate / T0, rms, clarity };
  }

  function freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
  }

  // ------------------------------------------------------------
  // Detection loop
  // ------------------------------------------------------------

  function tick() {
    if (!state.on) return;
    state.rafId = requestAnimationFrame(tick);

    state.analyser.getFloatTimeDomainData(state.buffer);
    const { freq, rms } = autoCorrelate(state.buffer, state.audioCtx.sampleRate);

    // VU meter.
    state.vu = Math.max(rms, state.vu * VU_DECAY);
    updateMeter();

    // Onset gating: declare a new note when energy rises sharply
    // *and* enough time has passed since the last emission.
    const now = performance.now();
    const energyRose = rms > MIN_RMS && rms > state.lastEnergy * ONSET_RATIO;
    const cooledDown = now - state.lastEmitTime > ONSET_COOLDOWN_MS;

    if (rms < MIN_RMS * 0.6) {
      state.armed = true;
      state.lastEnergy = rms;
      return;
    }

    if (state.armed && energyRose && cooledDown && freq > 0) {
      const midiF = freqToMidi(freq);
      const midi = Math.round(midiF);
      if (midi >= MIDI_LO && midi <= MIDI_HI) {
        // Reject if it's the same note re-attacked within SAME_NOTE_REPEAT_MS
        // unless it's clearly a new attack with a big jump.
        const sameRecent = midi === state.lastEmitMidi
          && now - state.lastEmitTime < SAME_NOTE_REPEAT_MS;

        if (!sameRecent) {
          emit(midi, midiF);
          state.lastEmitTime = now;
          state.lastEmitMidi = midi;
          state.armed = false;
        }
      }
    }

    // Smooth the running energy reference.
    state.lastEnergy = rms;
  }

  function emit(midi, midiF) {
    const e = getEls();
    if (e.note) {
      const name = midiName(midi);
      const cents = Math.round((midiF - midi) * 100);
      e.note.textContent = name + (cents !== 0 ? ` (${cents > 0 ? '+' : ''}${cents}¢)` : '');
    }
    if (typeof window.MIC_EMIT === 'function') {
      window.MIC_EMIT(midi);
    }
  }

  function midiName(midi) {
    const names = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    const oct = Math.floor(midi / 12) - 1;
    return names[((midi % 12) + 12) % 12] + oct;
  }

  function updateMeter() {
    const e = getEls();
    if (!e.meter) return;
    // Map RMS (~0..0.3) to 0..100%.
    const pct = Math.min(100, Math.round(state.vu * 320));
    e.meter.style.width = pct + '%';
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------

  async function start() {
    if (state.on) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLabel('error', 'Mic non supporté');
      return;
    }
    try {
      setLabel('loading', 'Demande d\'accès…');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = SAMPLE_BUFFER;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      // NOTE: we DO NOT connect to ctx.destination — no echo.

      state.audioCtx = ctx;
      state.stream = stream;
      state.source = source;
      state.analyser = analyser;
      state.buffer = new Float32Array(analyser.fftSize);
      state.on = true;
      state.armed = true;
      state.lastEnergy = 0;
      state.lastEmitTime = 0;
      state.lastEmitMidi = -1;

      setLabel('on', 'À l\'écoute');
      const e = getEls();
      if (e.btn) e.btn.classList.add('is-on');
      setBtnLabel('Couper le micro');
      tick();
    } catch (err) {
      console.error('[mic]', err);
      setLabel('error', err.name === 'NotAllowedError' ? 'Accès refusé' : 'Erreur');
    }
  }

  function stop() {
    if (!state.on) return;
    state.on = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
    }
    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (_) {}
    }
    state.audioCtx = null;
    state.stream = null;
    state.source = null;
    state.analyser = null;
    state.buffer = null;
    state.vu = 0;
    setLabel('off', 'Désactivé');
    const e = getEls();
    if (e.btn) e.btn.classList.remove('is-on');
    setBtnLabel('Activer le micro');
    if (e.meter) e.meter.style.width = '0%';
    if (e.note) e.note.textContent = '—';
  }

  function setLabel(s, msg) {
    const e = getEls();
    if (!e.label) return;
    e.label.dataset.state = s;
    e.label.textContent = msg;
  }

  function toggle() {
    if (state.on) stop();
    else start();
  }

  // ------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------

  function attach() {
    const e = getEls();
    if (e.btn) e.btn.addEventListener('click', toggle);
    if (e.sens) {
      const initial = loadSensitivity();
      e.sens.value = String(initial);
      e.sens.addEventListener('input', () => applySensitivity(+e.sens.value));
    }
    setLabel('off', 'Désactivé');
  }

  window.MIC = {
    toggle,
    start,
    stop,
    isOn: () => state.on,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
