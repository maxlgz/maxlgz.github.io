// Métronome — précis (Chris Wilson scheduler), accent on beat 1 in 4/4.
//
// Public API:
//   window.METRONOME.start(bpm, meter?)   — meter defaults to 4
//   window.METRONOME.stop()
//   window.METRONOME.toggle()
//   window.METRONOME.setBpm(bpm)
//   window.METRONOME.isOn()
//   window.METRONOME.onTick(cb)           — cb({beat, isAccent, audioTime})
//   window.METRONOME.offTick(cb)
//   window.METRONOME.getBpm()

(function () {
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD_S = 0.1;

  const state = {
    on: false,
    bpm: 80,
    meter: 4,
    audioCtx: null,
    nextNoteTime: 0,
    beat: 0,
    schedulerId: null,
    listeners: new Set(),
  };

  let els = null;
  function getEls() {
    if (els) return els;
    els = {
      btn: document.getElementById('metro-btn'),
      bpmInput: document.getElementById('metro-bpm'),
      bpmValue: document.getElementById('metro-bpm-value'),
      bpmDown: document.getElementById('metro-down'),
      bpmUp: document.getElementById('metro-up'),
      pulse: document.getElementById('metro-pulse'),
    };
    return els;
  }

  function ensureCtx() {
    if (!state.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new Ctx();
    }
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return state.audioCtx;
  }

  function scheduleClick(time, isAccent) {
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = isAccent ? 1600 : 1000;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.35 : 0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  function fireListeners(beat, isAccent, audioTime) {
    for (const cb of state.listeners) {
      try { cb({ beat, isAccent, audioTime }); } catch (e) { console.error(e); }
    }
  }

  function pulseUI(isAccent) {
    const e = getEls();
    if (!e.pulse) return;
    e.pulse.classList.remove('pulse-strong', 'pulse-weak');
    // Force reflow to restart the animation.
    void e.pulse.offsetWidth;
    e.pulse.classList.add(isAccent ? 'pulse-strong' : 'pulse-weak');
  }

  function scheduler() {
    const ctx = state.audioCtx;
    while (state.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const isAccent = state.beat === 0;
      scheduleClick(state.nextNoteTime, isAccent);
      // Schedule UI pulse + listeners at the audio time using setTimeout.
      const delayMs = (state.nextNoteTime - ctx.currentTime) * 1000;
      const beatNow = state.beat;
      const audioTime = state.nextNoteTime;
      setTimeout(() => {
        if (!state.on) return;
        pulseUI(isAccent);
        fireListeners(beatNow, isAccent, audioTime);
      }, Math.max(0, delayMs));

      state.nextNoteTime += 60.0 / state.bpm;
      state.beat = (state.beat + 1) % state.meter;
    }
  }

  function start(bpm, meter) {
    if (state.on) return;
    if (typeof bpm === 'number') state.bpm = clampBpm(bpm);
    if (typeof meter === 'number') state.meter = Math.max(1, Math.min(12, meter));
    const ctx = ensureCtx();
    state.on = true;
    state.beat = 0;
    state.nextNoteTime = ctx.currentTime + 0.06;
    state.schedulerId = setInterval(scheduler, LOOKAHEAD_MS);
    scheduler();
    syncUI();
  }

  function stop() {
    if (!state.on) return;
    state.on = false;
    if (state.schedulerId) clearInterval(state.schedulerId);
    state.schedulerId = null;
    const e = getEls();
    if (e.pulse) e.pulse.classList.remove('pulse-strong', 'pulse-weak');
    syncUI();
  }

  function toggle() { state.on ? stop() : start(); }

  function clampBpm(v) { return Math.max(40, Math.min(220, Math.round(v))); }

  function setBpm(v) {
    state.bpm = clampBpm(v);
    syncUI();
  }

  function syncUI() {
    const e = getEls();
    if (e.btn) {
      e.btn.classList.toggle('is-on', state.on);
      e.btn.setAttribute('aria-pressed', String(state.on));
      const lab = e.btn.querySelector('.metro-btn-label');
      if (lab) lab.textContent = state.on ? 'Arrêter' : 'Démarrer';
    }
    if (e.bpmInput) e.bpmInput.value = String(state.bpm);
    if (e.bpmValue) e.bpmValue.textContent = String(state.bpm);
  }

  function onTick(cb) { state.listeners.add(cb); }
  function offTick(cb) { state.listeners.delete(cb); }

  // ------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------

  function attach() {
    const e = getEls();
    if (e.btn) e.btn.addEventListener('click', toggle);
    if (e.bpmInput) e.bpmInput.addEventListener('input', () => setBpm(+e.bpmInput.value));
    if (e.bpmDown) e.bpmDown.addEventListener('click', () => setBpm(state.bpm - 4));
    if (e.bpmUp) e.bpmUp.addEventListener('click', () => setBpm(state.bpm + 4));
    syncUI();

    // Persist BPM.
    try {
      const saved = localStorage.getItem('etude-metro-bpm');
      if (saved) setBpm(+saved);
    } catch (_) {}
    onTick(() => {
      try { localStorage.setItem('etude-metro-bpm', String(state.bpm)); } catch (_) {}
    });
  }

  window.METRONOME = {
    start, stop, toggle, setBpm, isOn: () => state.on, getBpm: () => state.bpm,
    onTick, offTick,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
