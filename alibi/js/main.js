// Alibi — coquille : accueil, routage par hash, stockage.
import { LEVELS } from './levels.js';
import { floorColor } from './art.js';
import { tokenHTML } from './board.js';
import { colorOf, INK } from './palette.js';
import {
  mountGame, openModal, confirmDialog, loadSettings, saveSettings, applyTheme,
  readJSON, writeJSON, removeKey, esc, formatTime, ICONS,
} from './game.js';
import { play, setEnabled as setSoundEnabled } from './sound.js';
import { GUIDE_LEVEL } from './guide-level.js';
import { createGuide } from './guide.js';

const app = document.getElementById('app');
const DIFFS = [
  { d: 1, label: 'Facile', meta: 'pour se faire la main', tone: 'mint' },
  { d: 2, label: 'Moyen', meta: 'quelques détours', tone: 'sun' },
  { d: 3, label: 'Difficile', meta: 'pour fins limiers', tone: 'coral' },
];

/* ---------------- stockage ---------------- */
const getProgress = () => { const p = readJSON('alibi:progress', {}); return p && typeof p === 'object' ? p : {}; };
const getCustom = () => { const c = readJSON('alibi:custom', []); return Array.isArray(c) ? c.filter((l) => l && typeof l === 'object' && l.id) : []; };
const hasSave = (id) => { try { return localStorage.getItem(`alibi:save:${id}`) != null; } catch { return false; } };

function recordSolve(levelId, { seconds }) {
  const prog = getProgress();
  const prev = prog[levelId];
  const record = !prev || !prev.best || seconds < prev.best;
  prog[levelId] = { done: true, best: record ? seconds : prev.best };
  writeJSON('alibi:progress', prog);
  return { record: record && !!prev, best: prog[levelId].best };
}

const officialLevels = () => (Array.isArray(LEVELS) ? LEVELS : []);
function findLevel(id) {
  return officialLevels().find((l) => l.id === id) || getCustom().find((l) => l.id === id) || null;
}

/* ---------------- vignette ---------------- */
// Dimensions d'un niveau brut (carré : size ; rectangulaire : rows × cols).
function dimsOf(level) {
  const map = level.roomMap || [];
  const R = level.rows ?? level.size ?? (map.length || 5);
  const C = level.cols ?? level.size ?? ((map[0] && map[0].length) || R);
  return { R, C };
}
const sizeLabel = (level) => { const { R, C } = dimsOf(level); return `${R}×${C}`; };

function thumbSVG(level) {
  const { R, C } = dimsOf(level);
  const rooms = Object.fromEntries((level.rooms || []).map((r) => [r.key, r]));
  const map = level.roomMap || [];
  const at = (r, c) => (map[r] ? map[r][c] : undefined);
  let rects = '';
  let walls = '';
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const room = rooms[at(r, c)];
      let col = '#F2E6CC';
      try { if (room && room.floor) col = floorColor(room.floor) || col; } catch { /* rien */ }
      rects += `<rect x="${c * 10}" y="${r * 10}" width="10.4" height="10.4" fill="${esc(col)}"/>`;
      if (c < C - 1 && at(r, c + 1) !== at(r, c)) walls += `M${(c + 1) * 10} ${r * 10}v10`;
      if (r < R - 1 && at(r + 1, c) !== at(r, c)) walls += `M${c * 10} ${(r + 1) * 10}h10`;
    }
  }
  let objs = '';
  for (const o of level.objects || []) {
    objs += `<rect x="${o.c * 10 + 2.2}" y="${o.r * 10 + 2.2}" width="${(o.w || 1) * 10 - 4.4}" height="${(o.h || 1) * 10 - 4.4}" rx="2.4" fill="#FFFDF6" fill-opacity=".55" stroke="${INK}" stroke-opacity=".5" stroke-width=".8"/>`;
  }
  const sw = (0.03 * Math.max(R, C) * 10).toFixed(2);
  return `<svg viewBox="0 0 ${C * 10} ${R * 10}" aria-hidden="true" preserveAspectRatio="none">${rects}${objs}<path d="${walls}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/></svg>`;
}
/** Vignette d'un plan : carrée telle quelle ; rectangulaire, centrée dans le même emplacement carré. */
function thumbHTML(level) {
  const { R, C } = dimsOf(level);
  if (R === C) return `<span class="thumb">${thumbSVG(level)}</span>`;
  const w = (100 * Math.min(1, C / R)).toFixed(2);
  return `<span class="thumb thumb--rect"><span class="thumb-plan" style="width:${w}%;aspect-ratio:${C} / ${R}">${thumbSVG(level)}</span></span>`;
}

/* ---------------- tutoriel ---------------- */
function mini(n, rooms, marks = {}) {
  let html = `<div class="mini" style="--n:${n}" aria-hidden="true">`;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = rooms[r][c];
      const cls = [k === 'b' ? 'b' : 'a'];
      if (c < n - 1 && rooms[r][c + 1] !== k) cls.push('wr');
      if (r < n - 1 && rooms[r + 1][c] !== k) cls.push('wb');
      const m = marks[`${r},${c}`];
      let l = '';
      if (m) { cls.push(...m.cls.split(' ')); l = m.l || ''; }
      html += `<i class="${cls.join(' ')}"${l ? ` data-l="${esc(l)}"` : ''}></i>`;
    }
  }
  return `${html}</div>`;
}

const TUTO = [
  {
    title: 'Un crime, un plan',
    html: `<p>Quelqu'un a été tué. Toutes les personnes présentes figurent dans le dossier, et chacune a laissé un témoignage. Votre travail : retrouver <b>la case exacte</b> où se tenait chacune d'elles, puis démasquer le coupable.</p>
      <p>Les témoignages ne mentent jamais. À vous de les croiser.</p>`,
    fig: () => `<figure>${mini(4, ['aabb', 'aabb', 'aabb', 'aabb'], { '0,1': { cls: 'p', l: 'A' }, '2,3': { cls: 'p v', l: 'V' }, '1,2': { cls: 'obj' } })}<figcaption>Un plan, des pièces, des objets</figcaption></figure>`,
  },
  {
    title: 'Une seule personne par ligne et par colonne',
    html: `<p>Chaque ligne et chaque colonne du plan accueille <b>une seule personne</b>. Dès que vous posez quelqu'un, le reste de sa ligne et de sa colonne se barre de petites croix pâles pour vous le rappeler.</p>
      <p class="tuto-note">Sur un plan allongé, certaines lignes restent vides.</p>`,
    fig: () => `<figure>${mini(4, ['aaaa', 'aaaa', 'aaaa', 'aaaa'], {
      '0,2': { cls: 'p', l: 'A' }, '1,0': { cls: 'p', l: 'B' }, '2,3': { cls: 'p', l: 'C' }, '3,1': { cls: 'p', l: 'D' },
    })}<figcaption>Correct : une par ligne, une par colonne</figcaption></figure>
      <figure>${mini(4, ['aaaa', 'aaaa', 'aaaa', 'aaaa'], {
      '1,1': { cls: 'p', l: 'A' }, '1,0': { cls: 'x' }, '1,2': { cls: 'x' }, '1,3': { cls: 'x' }, '0,1': { cls: 'x' }, '2,1': { cls: 'x' }, '3,1': { cls: 'x' },
    })}<figcaption>Croix automatiques autour d'une pose</figcaption></figure>`,
  },
  {
    title: '« À côté », c’est collé… et dans la même pièce',
    html: `<p>Une case est <b>à côté</b> d'une autre si elle la touche par un bord (en haut, en bas, à gauche ou à droite) <b>et</b> qu'elle est dans la même pièce. Les diagonales ne comptent pas, et un mur sépare toujours.</p>
      <p>Les points sur les fiches s'allument en vert ou en rouge dès que vos poses suffisent à trancher un indice.</p>`,
    fig: () => `<figure>${mini(3, ['aab', 'aab', 'aab'], {
      '1,1': { cls: 'p', l: 'A' }, '0,1': { cls: 'ok' }, '2,1': { cls: 'ok' }, '1,0': { cls: 'ok' }, '1,2': { cls: 'no' }, '0,0': { cls: 'no' }, '2,2': { cls: 'no' },
    })}<figcaption>Vert : à côté de A. Rouge : diagonale ou derrière un mur</figcaption></figure>`,
  },
  {
    title: 'Noter ou poser',
    html: `<p>Choisissez d'abord une personne (sa fiche ou son jeton). Ensuite :</p>
      <ul><li><b>Toucher brièvement</b> une case y inscrit son initiale au crayon : une simple hypothèse. Plusieurs notes peuvent cohabiter ; retouchez pour effacer.</li>
      <li><b>Appuyer longuement</b> (ou double-clic, clic droit) pose réellement la personne. Ses notes ailleurs disparaissent.</li></ul>
      <p>Outils : croix manuelles, gomme (appui long = tout effacer), annuler, indice. Le réglage « pose en un toucher » inverse les deux gestes.</p>`,
    fig: () => `<figure>${mini(3, ['aaa', 'aaa', 'aaa'], { '0,0': { cls: 'n', l: 'A' }, '0,2': { cls: 'n', l: 'AB' }, '2,1': { cls: 'n', l: 'B' } })}<figcaption>Notes au crayon</figcaption></figure>
      <figure>${mini(3, ['aaa', 'aaa', 'aaa'], { '1,1': { cls: 'p', l: 'A' }, '1,0': { cls: 'x' }, '1,2': { cls: 'x' }, '0,1': { cls: 'x' }, '2,1': { cls: 'x' } })}<figcaption>Pose (appui long)</figcaption></figure>`,
  },
  {
    title: 'Seul à seul avec la victime',
    html: `<p>La victime se trouvait <b>seule avec son meurtrier</b> : sa pièce contient exactement deux personnes, ni plus ni moins. Quand tout le monde est posé, validez votre plan ; s'il tient, il ne reste qu'à désigner le coupable.</p>`,
    fig: () => `<figure>${mini(4, ['aabb', 'aabb', 'aaab', 'aaab'], {
      '0,3': { cls: 'p v', l: 'V' }, '1,2': { cls: 'p', l: 'M' }, '2,0': { cls: 'p', l: 'C' }, '3,1': { cls: 'p', l: 'D' },
    })}<figcaption>V et M seuls dans la pièce de droite : M est coupable</figcaption></figure>`,
  },
];

let tutoOpen = null;
function showTutorial() {
  if (tutoOpen) return;
  let step = 0;
  const finish = () => { tutoOpen = null; saveSettings({ tutoSeen: true }); };
  tutoOpen = openModal((body, close) => {
    const draw = () => {
      const s = TUTO[step];
      body.innerHTML = `<div class="modal-kicker">Comment jouer · ${step + 1}/${TUTO.length}</div>
        <h2>${s.title}</h2>
        <div class="tuto-fig">${s.fig()}</div>
        ${s.html}
        <div class="tuto-dots" aria-hidden="true">${TUTO.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="modal-actions">
          ${step === 0 ? '<button type="button" class="btn btn--ghost" data-t="skip">Passer</button>' : '<button type="button" class="btn btn--ghost" data-t="prev">Précédent</button>'}
          ${step < TUTO.length - 1 ? '<button type="button" class="btn btn--primary" data-t="next" autofocus>Suivant</button>' : '<button type="button" class="btn btn--accent" data-t="done" autofocus>C’est parti</button>'}
        </div>
        ${inGuide() ? '' : `<p class="tuto-guide">Envie d’apprendre en jouant ? <button type="button" class="btn btn--small" data-t="guide">${ICONS.help} Enquête guidée</button></p>`}`;
      const primary = body.querySelector('[data-t="next"],[data-t="done"]');
      if (primary) primary.focus();
    };
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      const t = b.dataset.t;
      if (t === 'next') { play('tap'); step++; draw(); } else if (t === 'prev') { play('tap'); step--; draw(); } else if (t === 'guide') { close(true); finish(); startGuide(); } else { close(); finish(); }
    });
    draw();
  }, { label: 'Comment jouer', className: 'modal--tuto', onCancel: finish });
}
/* ---------------- première visite : choisir sa façon d'apprendre ---------------- */
const inGuide = () => /^#\/guide\b/.test(location.hash || '');
function startGuide() {
  if (inGuide()) return;
  location.hash = '#/guide';
}
let welcomeOpen = null;
function showWelcome() {
  if (welcomeOpen || tutoOpen) return;
  const seen = () => { welcomeOpen = null; saveSettings({ tutoSeen: true }); };
  welcomeOpen = openModal((body, close) => {
    body.innerHTML = `<div class="modal-kicker">Bienvenue</div>
      <h2>Première enquête ?</h2>
      <p>Alibi se joue avec un peu de logique et beaucoup de flair. Comment voulez-vous commencer ?</p>
      <div class="welcome-choices">
        <button type="button" class="btn btn--accent welcome-main" data-w1="guide" autofocus>
          <span class="welcome-label">Enquête guidée</span><small>Recommandé · une petite affaire jouée pas à pas, 3 minutes</small></button>
        <button type="button" class="btn" data-w1="rules"><span class="welcome-label">Lire les règles</span><small>Le tutoriel illustré, en 5 fiches</small></button>
        <button type="button" class="btn btn--ghost" data-w1="skip"><span class="welcome-label">Je connais déjà</span></button>
      </div>`;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-w1]');
      if (!b) return;
      const v = b.dataset.w1;
      close(v !== 'skip');
      seen();
      if (v === 'guide') startGuide();
      else if (v === 'rules') showTutorial();
    });
  }, { label: 'Première enquête ?', className: 'modal--welcome', onCancel: seen });
}
function maybeFirstTutorial() {
  if (!loadSettings().tutoSeen) showWelcome();
}

/* ---------------- écrans ---------------- */
let current = null;
let routeToken = 0;
function unmount() {
  if (current && typeof current.destroy === 'function') { try { current.destroy(); } catch (e) { console.warn(e); } }
  current = null;
  app.innerHTML = '';
}

const svgi = (d) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ACT_ICONS = {
  play: svgi('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
  edit: svgi('<path d="M4 20l1-4L16.5 4.5a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8 19z"/><path d="M14.5 6.5l3 3"/>'),
  trash: svgi('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>'),
};
const VIEW_ICONS = {
  large: svgi('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
  compact: svgi('<rect x="3.5" y="4" width="17" height="4" rx="2"/><rect x="3.5" y="10" width="17" height="4" rx="2"/><rect x="3.5" y="16" width="17" height="4" rx="2"/>'),
};
const getHomeView = () => (loadSettings().homeView === 'compact' ? 'compact' : 'large');

function levelCard(l, prog) {
  const p = prog[l.id];
  const done = p && p.done;
  return `<a class="level-card${hasSave(l.id) && !done ? ' has-save' : ''}" href="#/jouer/${encodeURIComponent(l.id)}" aria-label="${esc(l.title)}, ${sizeLabel(l)}${done ? ', résolu' : ''}">
    ${thumbHTML(l)}
    ${done ? '<span class="stamp stamp--ok">Résolu</span>' : ''}
    <h3>${esc(l.title)}</h3>
    <span class="sub"><span class="size-pill">${sizeLabel(l)}</span> <span class="ppl">${(l.people || []).length} pers.</span></span>
    ${done && p.best ? `<span class="best">Record ${formatTime(p.best)}</span>` : ''}
  </a>`;
}

function setHomeView(v) {
  const el = document.querySelector('.home');
  if (!el || el.dataset.homeView === v) return;
  // Ancre : premier repère visible, pour garder la position dans la page.
  const anchor = [...el.querySelectorAll('.section-head, .level-card, .custom-item')].find((n) => n.getBoundingClientRect().bottom > 8);
  const before = anchor ? anchor.getBoundingClientRect().top : 0;
  el.dataset.homeView = v;
  saveSettings({ homeView: v });
  if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
}
const switchHTML = (key, title, hint, on) => `<button type="button" class="sw" role="switch" aria-checked="${on}" data-set="${key}">
  <span class="sw-text"><b>${title}</b>${hint ? `<small>${hint}</small>` : ''}</span>
  <span class="sw-ctl"><span class="sw-track" aria-hidden="true"><i></i></span><span class="sw-state">${on ? 'Activé' : 'Désactivé'}</span></span></button>`;

let homeSettingsOpen = null;
function openHomeSettings() {
  if (homeSettingsOpen && !homeSettingsOpen.closed) return;
  const back = () => { const b = document.querySelector('[data-act="home-settings"]'); if (b) b.focus(); };
  homeSettingsOpen = openModal((body, close) => {
    const st = loadSettings();
    const view = getHomeView();
    body.innerHTML = `<div class="modal-kicker">Accueil</div>
      <h2>Réglages</h2>
      <div class="set-group"><h3 id="set-view">Affichage des énigmes</h3>
        <div class="view-switch" role="group" aria-label="Affichage des énigmes">
          <button type="button" data-view="large" aria-pressed="${view === 'large'}">${VIEW_ICONS.large}<span>Grandes cartes</span></button>
          <button type="button" data-view="compact" aria-pressed="${view === 'compact'}">${VIEW_ICONS.compact}<span>Compact</span></button>
        </div></div>
      <div class="set-group"><h3>Thème</h3>${switchHTML('theme', 'Mode sombre', 'Fond sombre, plus reposant le soir.', st.theme === 'dark')}</div>
      <div class="set-group"><h3>Liste</h3>${switchHTML('hideSolved', 'Masquer les énigmes résolues', 'Les énigmes déjà résolues disparaissent de la liste.', !!st.hideSolved)}</div>
      <div class="set-group"><h3>En jeu</h3>${switchHTML('oneTap', 'Pose en un toucher', 'Toucher une case pose le personnage ; l’appui long ajoute une note.', !!st.oneTap)}
        ${switchHTML('sound', 'Sons', 'Petits bruitages pendant l’enquête.', st.sound !== false)}</div>
      <div class="modal-actions"><button type="button" class="btn btn--primary" data-close autofocus>Fermer</button></div>`;
    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { close(); back(); return; }
      const vb = e.target.closest('[data-view]');
      if (vb) {
        play('toggle');
        setHomeView(vb.dataset.view);
        body.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === vb)));
        return;
      }
      const sw = e.target.closest('[data-set]');
      if (!sw) return;
      const key = sw.dataset.set;
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
      sw.querySelector('.sw-state').textContent = on ? 'Activé' : 'Désactivé';
      if (key === 'sound') {
        if (on) { setSoundEnabled(true); play('toggle'); } else { play('toggle'); setSoundEnabled(false); }
        saveSettings({ sound: on });
        return;
      }
      play('toggle');
      if (key === 'theme') { saveSettings({ theme: on ? 'dark' : 'light' }); applyTheme(on ? 'dark' : 'light'); }
      else if (key === 'hideSolved') { saveSettings({ hideSolved: on }); if (document.querySelector('.home')) renderHome(); }
      else saveSettings({ [key]: on });
    });
  }, { label: 'Réglages', className: 'modal--settings', onCancel: back });
}

function renderHome() {
  unmount();
  document.title = 'Alibi — jeu de déduction';
  const prog = getProgress();
  const levels = officialLevels();
  const custom = getCustom();
  const dots = (d) => `<span class="diff-dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= d ? 'on' : ''}"></i>`).join('')}</span>`;
  const hideSolved = !!loadSettings().hideSolved;
  const isDone = (l) => !!(prog[l.id] && prog[l.id].done);
  let hiddenCount = 0;
  const sections = DIFFS.map(({ d, label, meta, tone }) => {
    const all = levels.filter((l) => (l.difficulty || 1) === d);
    if (!all.length) return '';
    const solved = all.filter(isDone).length;
    const ls = hideSolved ? all.filter((l) => !isDone(l)) : all;
    if (hideSolved) hiddenCount += all.length - ls.length;
    return `<section class="home-section" data-tone="${tone}" aria-labelledby="h-d${d}">
      <div class="section-head"><h2 id="h-d${d}">${label}</h2>${dots(d)}<span class="meta">${meta} · <b>${solved}/${all.length}</b> résolus</span></div>
      ${ls.length ? `<div class="level-grid">${ls.map((l) => levelCard(l, prog)).join('')}</div>` : '<p class="all-solved">Toutes résolues</p>'}
    </section>`;
  }).join('');
  const customHTML = custom.length
    ? `<div class="custom-list">${custom.map((l) => {
      const p = prog[l.id];
      return `<div class="custom-item">
        ${thumbHTML(l)}
        <div><h3>${esc(l.title || 'Sans titre')}</h3><span class="sub">${sizeLabel(l)} · ${(l.people || []).length} pers.${p && p.done ? ` · résolu en ${formatTime(p.best)}` : ''}</span></div>
        <div class="actions">
          <a class="btn btn--small btn--primary" data-play href="#/jouer/${encodeURIComponent(l.id)}" aria-label="Jouer : ${esc(l.title || 'Sans titre')}">${ACT_ICONS.play}<span class="lbl">Jouer</span></a>
          <a class="btn btn--small" href="#/editeur/${encodeURIComponent(l.id)}" aria-label="Modifier : ${esc(l.title || 'Sans titre')}">${ACT_ICONS.edit}<span class="lbl">Modifier</span></a>
          <button type="button" class="btn btn--small btn--ghost" data-del="${esc(l.id)}" aria-label="Supprimer : ${esc(l.title || 'Sans titre')}">${ACT_ICONS.trash}<span class="lbl">Supprimer</span></button>
        </div></div>`;
    }).join('')}</div>`
    : '<p class="empty-note">Aucun niveau personnel pour l’instant. Dessinez le vôtre dans l’éditeur !</p>';

  const filterNote = hiddenCount
    ? `<p class="filter-note" role="status"><span>${hiddenCount} énigme${hiddenCount > 1 ? 's' : ''} résolue${hiddenCount > 1 ? 's' : ''} masquée${hiddenCount > 1 ? 's' : ''}</span> <button type="button" class="btn btn--small" data-act="show-solved">Afficher</button></p>`
    : '';

  // Quelques jetons du premier niveau, pour la vitrine de l'accueil.
  const first = levels[0];
  const cast = first ? (first.people || []).slice(0, 4).map((p) => tokenHTML(p, { size: 64, color: colorOf(first, p.id) })).join('') : '';
  const el = document.createElement('div');
  el.className = 'home';
  el.dataset.homeView = getHomeView();
  el.innerHTML = `
    <header class="hero">
      <span class="hero-tab">${levels.length} enquêtes</span>
      ${cast ? `<div class="hero-cast" aria-hidden="true">${cast}</div>` : ''}
      <h1>Alibi</h1>
      <p>Un crime, un plan, des témoins qui ne mentent jamais. Placez chacun à sa place : le coupable finira par se trahir.</p>
      <div class="hero-actions">
        <button type="button" class="btn btn--accent" data-home="tuto">${ICONS.help} Comment jouer</button>
        <a class="btn" href="#/editeur">${ICONS.pencil} Éditeur de niveaux</a>
        <button type="button" class="btn" data-act="home-settings" aria-haspopup="dialog">${ICONS.gear} Réglages</button>
      </div>
    </header>
    ${filterNote}
    ${sections || '<p class="empty-note">Aucun niveau officiel disponible.</p>'}
    <section class="home-section" aria-labelledby="h-perso">
      <div class="section-head"><h2 id="h-perso">Mes niveaux</h2><span class="meta">${custom.length} niveau${custom.length > 1 ? 'x' : ''}</span></div>
      ${customHTML}
      <a class="btn btn--small" href="#/editeur">+ Nouveau niveau</a>
    </section>
    <p class="home-foot">Alibi — une enquête logique, faite main.</p>`;
  app.appendChild(el);
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-act="home-settings"]')) { openHomeSettings(); return; }
    if (e.target.closest('[data-act="show-solved"]')) { play('tap'); saveSettings({ hideSolved: false }); renderHome(); return; }
    // En compact, toute la ligne d'un niveau perso ouvre le niveau (hors boutons d'action).
    const row = e.target.closest('.custom-item');
    if (row && el.dataset.homeView === 'compact' && !e.target.closest('a, button')) {
      const play = row.querySelector('[data-play]');
      if (play) { location.hash = play.getAttribute('href'); return; }
    }
    if (e.target.closest('[data-home="tuto"]')) { showTutorial(); return; }
    const del = e.target.closest('[data-del]');
    if (del) {
      const id = del.dataset.del;
      const lvl = getCustom().find((l) => l.id === id);
      const ok = await confirmDialog({
        kicker: 'Mes niveaux', title: 'Supprimer ce niveau ?',
        text: `« ${lvl ? lvl.title || 'Sans titre' : id} » sera définitivement supprimé de cet appareil.`,
        ok: 'Supprimer', danger: true,
      });
      if (!ok) return;
      writeJSON('alibi:custom', getCustom().filter((l) => l.id !== id));
      removeKey(`alibi:save:${id}`);
      const prog = getProgress();
      if (prog[id]) { delete prog[id]; writeJSON('alibi:progress', prog); }
      renderHome();
    }
  });
  current = { destroy() {} };
  maybeFirstTutorial();
}

function renderNotice(title, text) {
  unmount();
  app.innerHTML = `<div class="notice"><h1>${esc(title)}</h1><p>${esc(text)}</p><a class="btn btn--primary" href="#/">Retour à l’accueil</a></div>`;
}

function renderGame(level, { test = false } = {}) {
  unmount();
  document.title = `${level.title || 'Enquête'} — Alibi`;
  const levels = officialLevels();
  const idx = levels.findIndex((l) => l.id === level.id);
  const isOfficial = idx >= 0;
  const next = isOfficial ? levels.slice(idx + 1).find(Boolean) : null;
  const backToEditor = () => {
    const inCustom = getCustom().some((l) => l.id === level.id);
    location.hash = inCustom ? `#/editeur/${encodeURIComponent(level.id)}` : '#/editeur';
  };
  current = mountGame(app, {
    level,
    persist: !test,
    exitLabel: test ? 'Retour à l’éditeur' : 'Accueil',
    onExit: test ? backToEditor : () => { location.hash = '#/'; },
    onSolved: test ? () => null : (res) => recordSolve(level.id, res),
    onNext: next ? () => { location.hash = `#/jouer/${encodeURIComponent(next.id)}`; } : null,
    onHelp: showTutorial,
  });
  if (!test) maybeFirstTutorial();
}

function renderGuide() {
  unmount();
  document.title = 'Enquête guidée — Alibi';
  saveSettings({ tutoSeen: true });
  const first = officialLevels()[0];
  const home = () => { location.hash = '#/'; };
  current = mountGame(app, {
    level: GUIDE_LEVEL,
    persist: false,
    exitLabel: 'Accueil',
    onExit: home,
    onSolved: () => null,
    onNext: null,
    onHelp: showTutorial,
    guide: createGuide({
      onQuit: home,
      onHome: home,
      onFirst: first ? () => { location.hash = `#/jouer/${encodeURIComponent(first.id)}`; } : home,
    }),
  });
}

async function renderEditor(id, token) {
  unmount();
  document.title = 'Éditeur — Alibi';
  app.innerHTML = '<p class="notice">Ouverture de l’éditeur…</p>';
  let mod;
  try {
    mod = await import('./editor.js');
  } catch (err) {
    if (token !== routeToken) return;
    console.warn('Éditeur indisponible :', err);
    renderNotice('Éditeur indisponible', 'Le module de l’éditeur n’a pas pu être chargé. Réessayez plus tard.');
    return;
  }
  if (token !== routeToken) return;
  if (!mod || typeof mod.mountEditor !== 'function') {
    renderNotice('Éditeur indisponible', 'Le module de l’éditeur est incomplet.');
    return;
  }
  app.innerHTML = '';
  const level = id ? getCustom().find((l) => l.id === id) || null : null;
  try {
    current = mod.mountEditor(app, {
      level: level ? JSON.parse(JSON.stringify(level)) : null,
      onTest: (raw) => {
        writeJSON('alibi:test', raw, 'session');
        location.hash = '#/test';
      },
      onExit: () => { location.hash = '#/'; },
    });
  } catch (err) {
    console.error(err);
    renderNotice('Éditeur indisponible', 'L’éditeur a rencontré une erreur au démarrage.');
  }
}

function route() {
  const token = ++routeToken;
  const hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  const parts = hash.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  if (!parts.length) return renderHome();
  if (parts[0] === 'jouer' && parts[1]) {
    const lvl = findLevel(parts.slice(1).join('/'));
    if (!lvl) return renderNotice('Dossier introuvable', 'Ce niveau n’existe pas (ou plus) sur cet appareil.');
    return renderGame(lvl);
  }
  if (parts[0] === 'test') {
    const lvl = readJSON('alibi:test', null, 'session');
    if (!lvl || !(lvl.size || (lvl.rows && lvl.cols))) return renderNotice('Aucun niveau à tester', 'Ouvrez l’éditeur et utilisez « Tester » pour jouer votre niveau.');
    return renderGame(lvl, { test: true });
  }
  if (parts[0] === 'editeur') return renderEditor(parts.slice(1).join('/') || null, token);
  if (parts[0] === 'guide') return renderGuide();
  return renderHome();
}

window.addEventListener('hashchange', route);
route();
