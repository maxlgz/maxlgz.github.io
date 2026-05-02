// Audio → MIDI transcription via Spotify's basic-pitch.
// Loaded on demand (the model is ~20 MB) and runs entirely in the browser.
//
// Public:
//   await window.AUDIO_TO_MIDI.transcribe(audioBuffer, onProgress)
//     -> File (.mid) ready to feed importMidiFile()
//   window.AUDIO_TO_MIDI.openYouTubeModal()  — guides the user through

(function () {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/model/model.json';
  const ESM_URL = 'https://esm.sh/@spotify/basic-pitch@1.0.1?bundle';

  let bpModulePromise = null;
  function loadBasicPitch() {
    if (!bpModulePromise) bpModulePromise = import(ESM_URL);
    return bpModulePromise;
  }

  function getMidiCtor() {
    return (window['@tonejs/midi'] && window['@tonejs/midi'].Midi) || window.Midi || null;
  }

  async function transcribe(audioBuffer, onProgress) {
    const mod = await loadBasicPitch();
    const { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } = mod;
    const basicPitch = new BasicPitch(MODEL_URL);

    const frames = [];
    const onsets = [];
    const contours = [];
    await basicPitch.evaluateModel(
      audioBuffer,
      (f, o, c) => { frames.push(...f); onsets.push(...o); contours.push(...c); },
      (p) => { if (onProgress) onProgress(p); }
    );

    const noteEvents = noteFramesToTime(
      addPitchBendsToNoteEvents(
        contours,
        outputToNotesPoly(frames, onsets, 0.25, 0.25, 5)
      )
    );
    return noteEvents; // [{startTimeSeconds, endTimeSeconds, pitchMidi, amplitude, ...}]
  }

  function notesToMidiFile(noteEvents, name = 'transcription.mid') {
    const Midi = getMidiCtor();
    if (!Midi) throw new Error('@tonejs/midi non chargé');
    const midi = new Midi();
    midi.header.setTempo(120);
    const track = midi.addTrack();
    track.name = 'Piano (transcribed)';
    track.instrument.name = 'acoustic_grand_piano';
    for (const n of noteEvents) {
      const dur = Math.max(0.05, n.endTimeSeconds - n.startTimeSeconds);
      track.addNote({
        midi: n.pitchMidi,
        time: n.startTimeSeconds,
        duration: dur,
        velocity: Math.min(1, Math.max(0.1, n.amplitude || 0.7)),
      });
    }
    const buffer = midi.toArray();
    return new File([buffer], name, { type: 'audio/midi' });
  }

  async function fileToAudioBuffer(file) {
    const ab = await file.arrayBuffer();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return await ctx.decodeAudioData(ab);
  }

  // ---------------------------------------------------------
  // UI: drop zone modal that handles both drag-drop and Youtube guide
  // ---------------------------------------------------------

  function openYouTubeModal() {
    let overlay = document.getElementById('modal-yt');
    if (!overlay) {
      overlay = buildModal();
      document.body.appendChild(overlay);
    }
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.classList.add('modal-locked');
  }

  function closeYouTubeModal() {
    const overlay = document.getElementById('modal-yt');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('modal-locked');
    setTimeout(() => { overlay.hidden = true; }, 220);
  }

  function buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-yt';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-yt-title">
        <header class="modal-head">
          <h2 id="modal-yt-title">Importer depuis YouTube</h2>
          <button type="button" class="modal-close" data-modal-close aria-label="Fermer">×</button>
        </header>
        <div class="modal-body">
          <ol class="yt-steps">
            <li><strong>Copie l'URL</strong> de la vidéo YouTube qui t'intéresse.</li>
            <li>Va sur <a href="https://cobalt.tools" target="_blank" rel="noopener">cobalt.tools</a>
              (site gratuit, sans pub, source ouverte). Colle l'URL, choisis <em>Audio → MP3</em>,
              télécharge.</li>
            <li><strong>Glisse le fichier MP3</strong> dans la zone ci-dessous (ou clique pour
              le sélectionner). L'app le transcrit en MIDI piano automatiquement.</li>
          </ol>
          <div class="yt-drop" id="yt-drop">
            <input type="file" id="yt-file" accept="audio/*" hidden />
            <span class="yt-drop-icon">⤓</span>
            <span class="yt-drop-text">Glisse un fichier audio ici<br>
              <em>ou clique pour parcourir</em></span>
          </div>
          <div class="yt-status" id="yt-status" hidden></div>
          <p class="yt-disclaimer">
            La transcription tourne <strong>localement</strong> dans ton navigateur via
            <em>basic-pitch</em> de Spotify (modèle ~20 MB chargé une fois).
            Qualité variable : excellente sur du piano solo, plus approximative sur des mixes complexes.
          </p>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.hasAttribute('data-modal-close')) closeYouTubeModal();
    });
    setTimeout(() => wireDropZone(overlay), 0);
    return overlay;
  }

  function wireDropZone(overlay) {
    const drop = overlay.querySelector('#yt-drop');
    const input = overlay.querySelector('#yt-file');
    const status = overlay.querySelector('#yt-status');
    if (!drop || !input || !status) return;

    drop.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files && input.files[0]) handle(input.files[0]);
    });
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('is-drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-drag');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handle(f);
    });

    async function handle(file) {
      try {
        setStatus('loading', `Décodage de ${file.name}…`);
        const buf = await fileToAudioBuffer(file);
        setStatus('loading', `Chargement du modèle (premier usage : ~20 MB)…`);
        const notes = await transcribe(buf, (p) => {
          const pct = Math.round(p * 100);
          setStatus('loading', `Transcription en cours… ${pct} %`);
        });
        if (!notes || notes.length === 0) {
          setStatus('error', 'Aucune note détectée. Le morceau est peut-être trop bruité ou trop court.');
          return;
        }
        setStatus('loading', `${notes.length} notes détectées — génération du MIDI…`);
        const baseName = file.name.replace(/\.[^.]+$/, '') + '.mid';
        const midiFile = notesToMidiFile(notes, baseName);
        if (typeof window.importMidiFile === 'function') {
          await window.importMidiFile(midiFile);
        }
        setStatus('ok', `Importé ! Va dans Difficulté → Importés pour le retrouver.`);
        setTimeout(() => closeYouTubeModal(), 1800);
      } catch (err) {
        console.error('[audio-to-midi]', err);
        setStatus('error', 'Échec : ' + (err.message || err));
      }
    }

    function setStatus(state, msg) {
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = msg;
    }
  }

  window.AUDIO_TO_MIDI = { transcribe, openYouTubeModal };
})();
