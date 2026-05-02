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

  // basic-pitch was trained on 22050 Hz mono audio and refuses anything else.
  const TARGET_SR = 22050;

  async function fileToAudioBuffer(file) {
    const ab = await file.arrayBuffer();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const decoded = await ctx.decodeAudioData(ab);
    if (decoded.sampleRate === TARGET_SR && decoded.numberOfChannels === 1) {
      return decoded;
    }
    return resampleToMono(decoded, TARGET_SR);
  }

  // Render `buffer` through an OfflineAudioContext at the target sample rate,
  // mixed down to mono. Browsers handle the actual resampling.
  async function resampleToMono(buffer, sampleRate) {
    const length = Math.ceil(buffer.duration * sampleRate);
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) throw new Error('OfflineAudioContext non supporté par ce navigateur.');
    const offline = new Offline(1, length, sampleRate);
    const src = offline.createBufferSource();
    src.buffer = buffer;
    src.connect(offline.destination);
    src.start(0);
    return await offline.startRendering();
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
          <div class="yt-direct" id="yt-direct" hidden>
            <span class="yt-direct-eyebrow">Mode local — yt-dlp détecté</span>
            <p>Colle directement l'URL YouTube. Le serveur télécharge l'audio puis l'app le transcrit en MIDI.</p>
            <div class="yt-direct-row">
              <input type="url" id="yt-url" placeholder="https://www.youtube.com/watch?v=..." autocomplete="off" />
              <button type="button" id="yt-fetch-btn" class="btn btn-primary">Extraire →</button>
            </div>
          </div>

          <p class="yt-intro" id="yt-providers-intro">
            Utilise un de ces outils <strong>open source</strong> pour extraire l'audio MP3,
            puis glisse le fichier dans la zone ci-dessous.
          </p>

          <div class="yt-providers">
            <a href="https://cobalt.tools" target="_blank" rel="noopener" class="yt-provider">
              <strong>cobalt.tools</strong>
              <span>Source ouverte, sans pub. <em>(parfois indisponible)</em></span>
            </a>
            <a href="https://www.y2mate.nu" target="_blank" rel="noopener" class="yt-provider">
              <strong>y2mate.nu</strong>
              <span>Web simple, MP3 instantané, des pubs.</span>
            </a>
            <a href="https://savefrom.net" target="_blank" rel="noopener" class="yt-provider">
              <strong>savefrom.net</strong>
              <span>Web populaire, collage URL → MP3.</span>
            </a>
            <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener" class="yt-provider">
              <strong>yt-dlp</strong> <span class="yt-cli">CLI</span>
              <span>La référence open source. <code>yt-dlp -x --audio-format mp3 URL</code></span>
            </a>
          </div>

          <div class="yt-drop" id="yt-drop">
            <input type="file" id="yt-file" accept="audio/*" hidden />
            <span class="yt-drop-icon">⤓</span>
            <span class="yt-drop-text">Glisse un fichier audio ici<br>
              <em>ou clique pour parcourir</em> · MP3 / WAV / M4A / OGG</span>
          </div>
          <div class="yt-status" id="yt-status" hidden></div>
          <p class="yt-disclaimer">
            La transcription tourne <strong>localement dans ton navigateur</strong> via
            <a href="https://github.com/spotify/basic-pitch" target="_blank" rel="noopener"><em>basic-pitch</em> de Spotify</a>
            (open source, modèle TensorFlow.js ~20 MB chargé une fois).
            Qualité honnête : très bonne sur du piano solo, approximative sur les mixes complexes.
          </p>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.hasAttribute('data-modal-close')) closeYouTubeModal();
    });
    setTimeout(() => {
      wireDropZone(overlay);
      probeServerExtract(overlay);
    }, 0);
    return overlay;
  }

  // If a local /api/yt-extract endpoint is available (server.py running),
  // surface the URL field. Otherwise hide it and keep only providers.
  async function probeServerExtract(overlay) {
    const direct = overlay.querySelector('#yt-direct');
    if (!direct) return;
    try {
      // Cheap probe : POST with empty body should give 400 from the API.
      const res = await fetch('/api/yt-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      // Both 400 (handled) and 200 mean the endpoint is alive.
      // 404 / 405 / 500 / network error → no API.
      if (res.status === 400 || res.status === 200 || res.status === 500) {
        direct.hidden = false;
        wireDirectFetch(overlay);
      }
    } catch (_) {
      // No server → keep direct hidden.
    }
  }

  function wireDirectFetch(overlay) {
    const urlInput = overlay.querySelector('#yt-url');
    const goBtn = overlay.querySelector('#yt-fetch-btn');
    const status = overlay.querySelector('#yt-status');
    if (!urlInput || !goBtn) return;

    async function go() {
      const url = (urlInput.value || '').trim();
      if (!url) return;
      goBtn.disabled = true;
      try {
        setStatus('loading', 'Extraction de l\'audio via yt-dlp (peut prendre 30 s)…');
        const res = await fetch('/api/yt-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || ('HTTP ' + res.status));
        }
        const blob = await res.blob();
        const cd = res.headers.get('Content-Disposition') || '';
        const m = cd.match(/filename="?([^"]+)"?/);
        const name = m ? m[1] : 'youtube.mp3';
        const file = new File([blob], name, { type: 'audio/mpeg' });
        await transcribeFile(overlay, file);
      } catch (err) {
        console.error('[yt-extract]', err);
        setStatus('error', 'Échec : ' + (err.message || err));
      } finally {
        goBtn.disabled = false;
      }
    }

    function setStatus(state, msg) {
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = msg;
    }

    goBtn.addEventListener('click', go);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  // Shared transcription pipeline used by both drop and direct paths.
  async function transcribeFile(overlay, file) {
    const status = overlay.querySelector('#yt-status');
    function setStatus(state, msg) {
      status.hidden = false;
      status.dataset.state = state;
      status.textContent = msg;
    }
    setStatus('loading', `Décodage et conversion en 22 kHz mono de ${file.name}…`);
    const buf = await fileToAudioBuffer(file);
    setStatus('loading', `Chargement du modèle basic-pitch (premier usage : ~20 MB)…`);
    const notes = await transcribe(buf, (p) => {
      setStatus('loading', `Transcription en cours… ${Math.round(p * 100)} %`);
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
        await transcribeFile(overlay, file);
      } catch (err) {
        console.error('[audio-to-midi]', err);
        const status = overlay.querySelector('#yt-status');
        if (status) {
          status.hidden = false;
          status.dataset.state = 'error';
          status.textContent = 'Échec : ' + (err.message || err);
        }
      }
    }
  }

  window.AUDIO_TO_MIDI = { transcribe, openYouTubeModal };
})();
