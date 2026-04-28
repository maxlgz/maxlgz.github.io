// Live harmony analysis — identify a chord from held notes.
// Public:  window.HARMONY.identify([midi…]) -> string | null

(function () {
  const NOTE_FR = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

  // Chord shapes (sorted intervals from root, in semitones, including 0).
  const SHAPES = [
    { intervals: [0, 4, 7],         label: 'majeur',           short: '' },
    { intervals: [0, 3, 7],         label: 'mineur',           short: 'm' },
    { intervals: [0, 3, 6],         label: 'diminué',          short: '°' },
    { intervals: [0, 4, 8],         label: 'augmenté',         short: '+' },
    { intervals: [0, 5, 7],         label: 'sus4',             short: 'sus4' },
    { intervals: [0, 2, 7],         label: 'sus2',             short: 'sus2' },
    { intervals: [0, 4, 7, 11],     label: 'majeur 7',         short: 'maj7' },
    { intervals: [0, 4, 7, 10],     label: '7e (dominante)',   short: '7' },
    { intervals: [0, 3, 7, 10],     label: 'mineur 7',         short: 'm7' },
    { intervals: [0, 3, 6, 9],      label: 'diminué 7',        short: '°7' },
    { intervals: [0, 3, 6, 10],     label: 'demi-diminué',     short: 'ø7' },
    { intervals: [0, 4, 7, 9],      label: '6',                short: '6' },
    { intervals: [0, 3, 7, 9],      label: 'mineur 6',         short: 'm6' },
  ];

  // Identify chord from a list of MIDI notes.
  // Returns { name, root, label, short, inversion } or null.
  function identify(midis) {
    if (!midis || midis.length < 2) return null;

    // Distinct pitch classes.
    const pcSet = new Set(midis.map((m) => ((m % 12) + 12) % 12));
    const pcs = [...pcSet].sort((a, b) => a - b);

    if (pcs.length === 2) {
      const interval = ((pcs[1] - pcs[0]) + 12) % 12;
      const NAMES = {
        1: 'seconde mineure', 2: 'seconde majeure',
        3: 'tierce mineure',  4: 'tierce majeure',
        5: 'quarte juste',    6: 'triton',
        7: 'quinte juste',    8: 'sixte mineure', 9: 'sixte majeure',
        10: 'septième mineure', 11: 'septième majeure',
      };
      return { name: NAMES[interval] || 'intervalle', root: null, short: null };
    }

    // Try each pc as a possible root.
    let best = null;
    for (const root of pcs) {
      const intervals = pcs.map((p) => ((p - root) + 12) % 12).sort((a, b) => a - b);
      for (const shape of SHAPES) {
        if (sameSet(intervals, shape.intervals)) {
          // Determine inversion: actual lowest played note pc vs root.
          const lowestPc = ((Math.min(...midis) % 12) + 12) % 12;
          const inv = lowestPc === root ? 0 : 'inv';
          const cand = {
            root,
            label: shape.label,
            short: shape.short,
            name: NOTE_FR[root] + (shape.short ? ' ' + shape.short : ' ' + shape.label),
            inversion: inv,
          };
          // Prefer root-position match when ambiguous.
          if (!best || (inv === 0 && best.inversion !== 0)) best = cand;
        }
      }
    }
    return best;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  window.HARMONY = { identify };
})();
