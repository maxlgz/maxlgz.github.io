// Staff renderer — minimal SVG staff with treble/bass clef and a note.
// Public:  window.STAFF.render(midi, opts) -> SVG string
//          window.STAFF.renderMulti([midi…], opts) -> SVG string

(function () {
  // Diatonic step indices: each white key has one slot on the staff.
  // Treble clef: bottom line = E4 (64), middle line B4 (71), top line F5 (77).
  // We compute "step" = number of diatonic steps from C4.
  // C4=0, D4=1, E4=2, F4=3, G4=4, A4=5, B4=6, C5=7, etc.

  const PC_TO_STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // C C# D D# E F F# G G# A A# B
  const PC_IS_SHARP = [false, true, false, true, false, false, true, false, true, false, true, false];

  function midiToStep(midi) {
    const oct = Math.floor(midi / 12) - 1;
    const pc = ((midi % 12) + 12) % 12;
    return (oct - 4) * 7 + PC_TO_STEP[pc];
  }

  function isSharp(midi) {
    return PC_IS_SHARP[((midi % 12) + 12) % 12];
  }

  // For treble clef, line E4 (step 2) is the bottom line.
  // Each "step" up moves the note half a line-spacing (ie, 1 step = half line gap).
  // Line spacing = LS. Bottom of staff (line E4) at y=4*LS, top (F5) at y=0.

  function render(midi, opts = {}) {
    return renderMulti([midi], opts);
  }

  function renderMulti(midis, opts = {}) {
    const W = opts.width || 220;
    const H = opts.height || 100;
    const clef = opts.clef || (Math.min(...midis) >= 60 ? 'treble' : 'bass');
    const LS = 8;                           // line spacing
    const stavTop = (H - 4 * LS) / 2;       // top line y
    const stavBot = stavTop + 4 * LS;       // bottom line y
    const ink = '#f1e6d0';
    const muted = '#5a4d36';

    // Anchor: which midi sits on which line.
    // Treble: F5 (77) on top line (step from C4 = 11). Step 11 → y=stavTop.
    // Bass: A3 (57) on top line. Step from C4 = -3 (since A3 is step (3-4)*7+5 = -2). Hmm let me recompute.
    // Actually let's compute step relative to a reference.
    // Treble bottom line E4 (step 2) at y=stavBot. Each step up = -LS/2.
    // Bass top line A3 (step -2) at y=stavTop. step diff from -2 → y=stavTop + (step - (-2)) * (-LS/2)
    function yForStep(step) {
      if (clef === 'treble') {
        const baseStep = 2;          // E4 on bottom line
        const baseY = stavBot;
        return baseY - (step - baseStep) * (LS / 2);
      } else {
        const baseStep = -2;         // A3 on top line
        const baseY = stavTop;
        return baseY - (step - baseStep) * (LS / 2);
      }
    }

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="staff-svg">`;

    // 5 lines.
    for (let i = 0; i < 5; i++) {
      const y = stavTop + i * LS;
      svg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${muted}" stroke-width="1"/>`;
    }

    // Clef glyph.
    const clefGlyph = clef === 'treble' ? '𝄞' : '𝄢';
    const clefY = clef === 'treble' ? stavBot + 6 : stavTop + 18;
    const clefSize = clef === 'treble' ? 44 : 32;
    svg += `<text x="6" y="${clefY}" fill="${ink}" font-family="serif" font-size="${clefSize}">${clefGlyph}</text>`;

    // Notes.
    const noteX = 60;
    const sortedMidis = [...midis].sort((a, b) => a - b);
    for (let idx = 0; idx < sortedMidis.length; idx++) {
      const midi = sortedMidis[idx];
      const step = midiToStep(midi);
      const y = yForStep(step);
      const x = noteX + idx * 22;

      // Ledger lines if outside staff range.
      const topLineStep = clef === 'treble' ? 11 : 4;     // F5 / G4-ish
      const botLineStep = clef === 'treble' ? 2 : -5;
      // For each line of pitch outside, draw ledger.
      const stepFromBot = step - botLineStep;
      if (step < botLineStep) {
        for (let s = botLineStep - 2; s >= step; s -= 2) {
          const ly = yForStep(s);
          svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="${muted}" stroke-width="1"/>`;
        }
      } else if (step > topLineStep) {
        for (let s = topLineStep + 2; s <= step; s += 2) {
          const ly = yForStep(s);
          svg += `<line x1="${x - 9}" y1="${ly}" x2="${x + 9}" y2="${ly}" stroke="${muted}" stroke-width="1"/>`;
        }
      }

      // Sharp accidental if needed.
      if (isSharp(midi)) {
        svg += `<text x="${x - 16}" y="${y + 4}" fill="${ink}" font-family="serif" font-size="16">♯</text>`;
      }

      // Note head (filled ellipse).
      svg += `<ellipse cx="${x}" cy="${y}" rx="6" ry="4.5" fill="${ink}" stroke="${ink}" stroke-width="0.5" transform="rotate(-20 ${x} ${y})"/>`;

      // Stem.
      const stemUp = step < (clef === 'treble' ? 6 : -1);
      if (stemUp) {
        svg += `<line x1="${x + 5}" y1="${y - 1}" x2="${x + 5}" y2="${y - 28}" stroke="${ink}" stroke-width="1.2"/>`;
      } else {
        svg += `<line x1="${x - 5}" y1="${y + 1}" x2="${x - 5}" y2="${y + 28}" stroke="${ink}" stroke-width="1.2"/>`;
      }
    }

    svg += '</svg>';
    return svg;
  }

  window.STAFF = { render, renderMulti };
})();
