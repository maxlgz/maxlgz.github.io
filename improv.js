// Improvisation guidée — joue une grille d'accords en boucle, affiche
// l'accord courant et les notes "qui sonnent bien" (gamme).
//
// Public:  window.IMPROV.start(gridId), .stop(), .isOn()

(function () {
  const GRIDS = [
    {
      id: 'ii-V-I',
      label: 'II–V–I en Do majeur',
      bpm: 90,
      scale: { name: 'Do majeur', notes: [60, 62, 64, 65, 67, 69, 71] },
      // Each step = 1 mesure de 4 temps.
      steps: [
        { name: 'Ré mineur 7',     chord: [50, 53, 57, 60] }, // Dm7
        { name: 'Sol 7',           chord: [55, 59, 62, 65] }, // G7
        { name: 'Do majeur 7',     chord: [48, 52, 55, 59] }, // Cmaj7
        { name: 'Do majeur 7',     chord: [48, 52, 55, 59] }, // Cmaj7
      ],
    },
    {
      id: 'blues-12',
      label: 'Blues en Do (12 mesures)',
      bpm: 110,
      scale: { name: 'Do blues', notes: [60, 63, 65, 66, 67, 70] },
      steps: [
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Fa 7', chord: [53, 57, 60, 63] },
        { name: 'Fa 7', chord: [53, 57, 60, 63] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Sol 7', chord: [55, 59, 62, 65] },
        { name: 'Fa 7', chord: [53, 57, 60, 63] },
        { name: 'Do 7', chord: [48, 52, 55, 58] },
        { name: 'Sol 7', chord: [55, 59, 62, 65] },
      ],
    },
  ];

  const state = {
    on: false,
    grid: null,
    pos: 0,
    timer: null,
    chordReleaseTimer: null,
  };

  function start(gridId) {
    const grid = GRIDS.find((g) => g.id === gridId) || GRIDS[0];
    if (state.on) stop();
    state.grid = grid;
    state.pos = 0;
    state.on = true;

    renderUI();
    playStep();
    const stepMs = (60000 / grid.bpm) * 4; // 4 beats per chord
    state.timer = setInterval(() => {
      if (!state.on) return;
      state.pos = (state.pos + 1) % grid.steps.length;
      playStep();
      renderUI();
      if (window.DAILY) window.DAILY.report('improv', 1);
    }, stepMs);
  }

  function stop() {
    state.on = false;
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    if (state.chordReleaseTimer) clearTimeout(state.chordReleaseTimer);
    state.chordReleaseTimer = null;
    if (state.grid) {
      // Release any held chord notes.
      for (const m of state.grid.steps[state.pos]?.chord || []) {
        if (typeof window.releaseNote === 'function') window.releaseNote(m);
      }
    }
    state.grid = null;
    state.pos = 0;
    hideUI();
  }

  function playStep() {
    if (!state.grid) return;
    const step = state.grid.steps[state.pos];
    if (!step) return;
    // Release prev chord notes before triggering new ones.
    if (state.chordReleaseTimer) clearTimeout(state.chordReleaseTimer);
    if (typeof window.SCHOOL_PLAY === 'function') {
      // Use SCHOOL_PLAY to play the chord with attack envelope.
      window.SCHOOL_PLAY([{ midi: step.chord[0], dur: (60 / state.grid.bpm) * 4 * 0.95, chord: step.chord }]);
    }
  }

  function renderUI() {
    const el = document.getElementById('improv-panel');
    if (!el || !state.grid) return;
    const step = state.grid.steps[state.pos];
    const scaleEl = state.grid.scale.notes
      .map((n) => `<button class="improv-note" data-midi="${n}">${noteName(n)}</button>`)
      .join('');
    const dots = state.grid.steps.map((s, i) =>
      `<span class="improv-step${i === state.pos ? ' is-active' : ''}">${s.name}</span>`
    ).join('');

    el.innerHTML = `
      <div class="improv-head">
        <span class="improv-eyebrow">Improvisation · ${state.grid.label}</span>
        <button class="lesson-close" id="improv-stop" aria-label="Arrêter">×</button>
      </div>
      <div class="improv-body">
        <div class="improv-current">
          <span class="improv-now-label">Accord courant</span>
          <strong class="improv-now">${step.name}</strong>
        </div>
        <p class="improv-tip">
          Improvise par-dessus avec les notes de la <strong>${state.grid.scale.name}</strong>.
          Toutes ces notes sonneront bien.
        </p>
        <div class="improv-scale">${scaleEl}</div>
        <div class="improv-grid">${dots}</div>
      </div>
    `;
    el.hidden = false;

    document.getElementById('improv-stop')?.addEventListener('click', stop);
    el.querySelectorAll('.improv-note').forEach((b) => {
      b.addEventListener('click', () => {
        const m = +b.dataset.midi;
        if (typeof window.triggerNote === 'function') {
          window.triggerNote(m, 95);
          setTimeout(() => window.releaseNote(m), 350);
        }
      });
    });
  }

  function hideUI() {
    const el = document.getElementById('improv-panel');
    if (el) el.hidden = true;
  }

  function noteName(midi) {
    const NAMES = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    return NAMES[((midi % 12) + 12) % 12];
  }

  function attach() {
    document.querySelectorAll('[data-improv]').forEach((b) => {
      b.addEventListener('click', () => start(b.dataset.improv));
    });
  }

  window.IMPROV = { start, stop, isOn: () => state.on };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
