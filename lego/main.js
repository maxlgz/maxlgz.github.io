// ================================================================
// Câblage de la page : génération du modèle, remplissage des
// chiffres, onglets, catalogue, visualiseur, exports.
// ================================================================

import { buildModel, PARTS, COLORS, STAGES, GROUPS, HANGING_LABELS } from './model.js';
import { toCSV, toLDraw, toBrickLinkXML, toJSON, toGuide, toGuideHTML, download } from './exports.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nf = new Intl.NumberFormat('fr-FR');
const cf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const df = (v) => v.toFixed(1).replace('.', ',');

// Un maillage importé dans la page (conservé dans le navigateur), sinon
// un voxels.json (issu de tools/voxelize.mjs), prime sur les profils
// relevés sur les photos ; sans l'un ni l'autre, la page se construit
// comme avant.
const IMPORT_KEY = 'lego-voxels';
let voxels = null;
let imported = null;
try {
  const saved = localStorage.getItem(IMPORT_KEY);
  if (saved) { voxels = JSON.parse(saved); imported = voxels; }
} catch { /* stockage indisponible */ }
if (!voxels) {
  try {
    const r = await fetch('./voxels.json', { cache: 'no-cache' });
    if (r.ok) voxels = await r.json();
  } catch { /* pas de maillage : profils photo */ }
}
const model = buildModel(voxels);
const { pieces, steps, stats, bbox, check } = model;

// ---------------------------------------------------------------
// 0. Import d'un maillage : STL seul ou ZIP de STL, voxelisé dans un
//    Web Worker, conservé dans le navigateur, puis la page se
//    reconstruit dessus.
// ---------------------------------------------------------------
if (imported) {
  $('#import-banner').hidden = false;
  const done = (model.completed || imported.completed || []);
  $('#import-source').textContent = `${(imported.source || []).join(', ')} — ${nf.format(imported.triangles || 0)} triangles` +
    (done.length ? ` ; complété par le modèle photo : ${done.length} groupe${done.length > 1 ? 's' : ''}` : '');
}
$('#import-reset').addEventListener('click', () => {
  try { localStorage.removeItem(IMPORT_KEY); } catch { /* rien à retirer */ }
  location.reload();
});

const IMPORT_GROUPS = [
  ['auto', 'auto'], ['coque', 'coque'], ['verriere', 'verrière'], ['dorsale', 'dorsale'], ['dorsale2', 'dorsale arrière'],
  ['caudale', 'caudale'], ['pectoraleG', 'pectorale bâbord'], ['pectoraleD', 'pectorale tribord'],
  ['pelvienneG', 'pelvienne bâbord'], ['pelvienneD', 'pelvienne tribord'], ['helice', 'hélice'], ['socle', 'socle'],
  ['ignorer', 'ignorer'],
];
let importParts = [];   // { name, size, group, use, data: () => Promise<ArrayBuffer> }
const importStatus = (msg) => { $('#import-status').textContent = msg; };
const kb = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mo` : `${Math.round(n / 1e3)} ko`);

const mm = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
function renderImportList() {
  const list = $('#import-list');
  list.innerHTML = '';
  list.hidden = importParts.length < 2;
  importParts.forEach((p, i) => {
    const label = document.createElement('label');
    const dims = p.box ? `${mm(p.box.size[0])} × ${mm(p.box.size[1])} × ${mm(p.box.size[2])} · origine ${p.box.lo.map(mm).join(' / ')}` : kb(p.size);
    label.innerHTML = `<input type="checkbox" ${p.use ? 'checked' : ''} /><span class="name" title="${p.name}">${p.name}</span>` +
      `<span class="size" title="dimensions et coin bas du fichier, dans ses unités">${dims}</span><select>${IMPORT_GROUPS.map(([v, t]) => `<option value="${v}" ${v === p.group ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    label.querySelector('input').addEventListener('change', (e) => { importParts[i].use = e.target.checked; });
    label.querySelector('select').addEventListener('change', (e) => { importParts[i].group = e.target.value; });
    list.appendChild(label);
  });
  $('#import-go').disabled = !importParts.length;
}

// Emprises mesurées dans le worker ; si les fichiers cochés se
// chevauchent tous près de l'origine, ils sont posés chacun sur son
// plateau d'impression et non assemblés : on prévient.
async function inspectImportParts() {
  if (importParts.length < 2) return;
  try {
    const files = [];
    for (const p of importParts) files.push({ name: p.name, buffer: await p.data() });
    const worker = new Worker(new URL('./import.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (ev) => {
      if (ev.data.type !== 'inspected') return;
      worker.terminate();
      for (const f of ev.data.files) { const p = importParts.find((q) => q.name === f.name); if (p && !f.error) p.box = f; }
      renderImportList();
      const used = importParts.filter((p) => p.use && p.box);
      if (used.length >= 2) {
        const big = Math.max(...used.map((p) => Math.max(...p.box.size)));
        const lo = [0, 1, 2].map((a) => Math.min(...used.map((p) => p.box.lo[a])));
        const hi = [0, 1, 2].map((a) => Math.max(...used.map((p) => p.box.hi[a])));
        const span = Math.max(...hi.map((h, a) => h - lo[a]));
        const near = used.filter((p) => p.box.lo.every((v) => Math.abs(v) < big * 0.05)).length;
        if (span < big * 1.15 && near >= 2) {
          importStatus('Attention : les fichiers cochés se superposent près de l’origine — ils sont sans doute posés chacun pour l’impression, pas assemblés. Garder un seul fichier de coque, le reste sera complété par le modèle photo.');
        }
      }
    };
    worker.postMessage({ type: 'inspect', files }, files.map((f) => f.buffer));
  } catch { /* mesure facultative */ }
}

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  importParts = [];
  renderImportList();
  if (!file) return;
  importStatus('Lecture…');
  try {
    const { guessGroup } = await import('./voxelize.js');
    if (/\.zip$/i.test(file.name)) {
      const { readZip } = await import('./zip.js');
      const entries = (await readZip(await file.arrayBuffer())).filter((en) => /\.stl$/i.test(en.name));
      if (!entries.length) throw new Error('aucun fichier .stl dans cette archive');
      importParts = entries.map((en) => {
        const g = guessGroup(en.name.split('/').pop());
        return { name: en.name.split('/').pop(), size: en.size, group: g, use: g !== 'socle', data: en.data };
      });
      const names = importParts.map((p) => p.name);
      const { defaultUse } = await import('./voxelize.js');
      for (const p of importParts) p.use = defaultUse(p.name, p.group, names);
      importStatus(`${entries.length} fichier${entries.length > 1 ? 's' : ''} STL dans l’archive — mesure des emprises…`);
      inspectImportParts();
    } else {
      importParts = [{ name: file.name, size: file.size, group: 'auto', use: true, data: () => file.arrayBuffer() }];
      importStatus(`${file.name} — ${kb(file.size)}.`);
    }
  } catch (err) {
    importStatus(`Impossible de lire ce fichier : ${err.message}`);
  }
  renderImportList();
});

$('#import-go').addEventListener('click', async () => {
  const parts = importParts.filter((p) => p.use);
  if (!parts.length) { importStatus('Cocher au moins un fichier.'); return; }
  $('#import-go').disabled = true;
  importStatus('Décompression…');
  try {
    const files = [];
    for (const p of parts) files.push({ name: p.name, group: p.group, buffer: await p.data() });
    const opts = {
      length: Math.round((Number($('#import-length').value) || 77) * 10 / 8),
      up: $('#import-up').value, nose: $('#import-nose').value,
      keepStand: $('#import-stand').checked,
    };
    const complete = $('#import-complete').checked;
    const worker = new Worker(new URL('./import.worker.js', import.meta.url), { type: 'module' });
    const PHASES = { orientation: 'Orientation du maillage', voxelisation: 'Voxelisation', classement: 'Classement des cellules', 'séries': 'Mise en forme' };
    worker.onmessage = (ev) => {
      const m = ev.data;
      if (m.type === 'progress') importStatus(`${PHASES[m.phase] || m.phase}… ${m.frac ? Math.round(m.frac * 100) + ' %' : ''}`);
      else if (m.type === 'error') { importStatus(`Échec : ${m.message}`); $('#import-go').disabled = false; worker.terminate(); }
      else if (m.type === 'done') {
        worker.terminate();
        const v = { ...m.voxels, complete, importedAt: new Date().toISOString() };
        try { localStorage.setItem(IMPORT_KEY, JSON.stringify(v)); }
        catch (err) { importStatus(`Le navigateur refuse de conserver le modèle (${err.message}).`); $('#import-go').disabled = false; return; }
        importStatus(`${nf.format(Object.values(v.cells).reduce((a, b) => a + b, 0))} cellules — reconstruction de la page…`);
        location.reload();
      }
    };
    worker.onerror = (err) => { importStatus(`Échec : ${err.message}`); $('#import-go').disabled = false; };
    worker.postMessage({ files, opts }, files.map((f) => f.buffer));
  } catch (err) {
    importStatus(`Échec : ${err.message}`);
    $('#import-go').disabled = false;
  }
});

// ---------------------------------------------------------------
// 1. Chiffres de la page
// ---------------------------------------------------------------
const countIn = (fn) => pieces.filter(fn).length;
const HULL = new Set(['avant', 'arriere']);

const values = {
  count: nf.format(stats.count),
  types: nf.format(stats.types),
  stages: STAGES.length,
  layers: nf.format(new Set(pieces.map((p) => p.y)).size),
  noir: nf.format(countIn((p) => p.color === 'black' && HULL.has(p.group))),
  blanc: nf.format(countIn((p) => p.color === 'white' && HULL.has(p.group))),
  verriere: nf.format(countIn((p) => p.group === 'verriere')),
  helice: nf.format(countIn((p) => p.group === 'helice')),
  dimx: df(bbox.mm.x / 10),
  dimy: df(bbox.mm.y / 10),
  dimz: df(bbox.mm.z / 10),
  cost: cf.format(stats.cost),
  families: nf.format(new Set(stats.rows.map((r) => r.part)).size),
  colors: nf.format(new Set(stats.rows.map((r) => r.color)).size),
  studs: `${bbox.studs.x} × ${bbox.studs.z} tenons`,
  overlaps: nf.format(check.overlaps),
  detached: nf.format(check.detached),
  linked: `${nf.format(check.largest)} (${df((check.largest / stats.count) * 100)} %)`,
};
$$('[data-fill]').forEach((el) => {
  const v = values[el.dataset.fill];
  if (v !== undefined) el.textContent = v;
});

// ---------------------------------------------------------------
// 2. Onglets
// ---------------------------------------------------------------
function showTab(name) {
  $$('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  viewer?.setActive(name === 'modele');
  if (name === 'modele') viewer?.resize();
  if (name === 'guide') openGuide();
  else guideViewer?.setActive(false);
}
$$('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
$$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  showTab(a.dataset.goto);
}));

// ---------------------------------------------------------------
// 3. Catalogue
// ---------------------------------------------------------------
const tbody = $('#catalog-body');
stats.rows.forEach((r) => {
  const tr = document.createElement('tr');
  tr.dataset.part = r.part;
  tr.dataset.color = r.color;
  tr.innerHTML = `
    <td><span class="part-name"><span class="part-swatch" style="background:${COLORS[r.color].hex}"></span>${r.label}</span></td>
    <td><span class="color-name">${COLORS[r.color].name}</span></td>
    <td class="mono hide-sm"><a href="https://www.bricklink.com/v2/catalog/catalogitem.page?P=${r.design}" target="_blank" rel="noopener">${r.design} ↗</a></td>
    <td class="mono hide-sm">${r.ldraw}</td>
    <td class="quantity">${nf.format(r.qty)}</td>
    <td class="mono right hide-sm">${cf.format(r.price)}</td>
    <td class="quantity">${cf.format(r.total)}</td>`;
  tbody.appendChild(tr);
});

// ---------------------------------------------------------------
// 4. Visualiseur — chargé après coup : si WebGL manque, la page
//    reste utilisable (chiffres, bordereau, exports).
// ---------------------------------------------------------------
let viewer = null;
try {
  const { createViewer } = await import('./viewer.js');
  viewer = createViewer($('#scene'), model);
} catch (err) {
  console.error(err);
  $('#canvas-error').hidden = false;
}

let selected = null;
function highlight(h) { viewer?.setHighlight(h); }

tbody.addEventListener('click', (e) => {
  const tr = e.target.closest('tr');
  if (!tr || e.target.closest('a')) return;
  const same = selected === tr;
  $$('#catalog-body tr').forEach((r) => r.classList.remove('on'));
  selected = same ? null : tr;
  if (selected) selected.classList.add('on');
  highlight(selected ? { part: selected.dataset.part, color: selected.dataset.color } : null);
  if (selected) showTab('modele');
});

// --- boutons « situer » ----------------------------------------
const LOCATE = {
  coque: [...HULL],
  verriere: ['verriere'],
  helice: ['helice'],
};
let located = null;
$$('[data-locate]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.locate;
    located = located === k ? null : k;
    $$('#catalog-body tr').forEach((r) => r.classList.remove('on'));
    selected = null;
    highlight(located ? { groups: LOCATE[k] } : null);
    $('.workspace').scrollIntoView({ block: 'center' });
  });
});

// --- cadrages ---------------------------------------------------
$$('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    viewer?.setView(btn.dataset.view);
  });
});

// --- étapes de montage ------------------------------------------
const select = $('#stage-select');
select.innerHTML = '<option value="0">Toutes les pièces — modèle complet</option>' +
  STAGES.map((s) => `<option value="${s.id}">Étapes 1 à ${s.id} — ${s.label}</option>`).join('');
const BLURB_ALL = 'Le modèle complet, toutes étapes confondues.';

function setStage(n) {
  select.value = String(n);
  viewer?.setStage(n);
  const st = STAGES.find((s) => s.id === n);
  $('#stage-blurb').textContent = st ? st.blurb : BLURB_ALL;
  $('#stage-tag').textContent = st ? `Étapes 1 à ${st.id} · ${st.label}` : 'Toutes les pièces';
}
select.addEventListener('change', () => setStage(Number(select.value)));

// ---------------------------------------------------------------
// Guide de montage : un second visualiseur en mode montage, une étape
// à la fois. Créé à la première ouverture de l'onglet seulement.
// ---------------------------------------------------------------
let guideViewer = null;
let guideReady = false;
let stepIndex = 0;
const DIRS = ['montage', 'dessus', 'profil', 'arriere'];
let dirIndex = 0;
const byStage = new Map(stats.byStage);

async function openGuide() {
  if (!guideReady) {
    guideReady = true;
    try {
      const { createViewer } = await import('./viewer.js');
      guideViewer = createViewer($('#scene2'), model);
    } catch (err) {
      console.error(err);
      $('#canvas-error-2').hidden = false;
    }
    showStep(0);
  }
  guideViewer?.setActive(true);
  guideViewer?.resize();
  showStep(stepIndex);
}

$('#chapters').innerHTML = STAGES.map((st) =>
  `<button type="button" data-chapter="${st.id}" aria-current="false">0${st.id} ${st.label}</button>`).join('');
$('#step-select').innerHTML = steps.map((s) => `<option value="${s.id - 1}">${s.id}. ${s.title}</option>`).join('');
$('#step-total').textContent = steps.length;

function stepText(s) {
  const st = STAGES.find((x) => x.id === s.stage);
  const h = (s.y * 3.2 / 10).toFixed(1).replace('.', ',');
  const n = s.pieces.length;
  const lines = [];
  if (s.context === 'attach') {
    const where = s.unit === 'caudaleBas'
      ? 'Glisser le lobe sous le pédoncule : ses pièces hautes se pressent sous la peau de la coque à x = 80–84, et sa racine dépasse derrière, prête à recevoir le lobe supérieur.'
      : `Presser ${s.unitLabel.toLowerCase()} par en dessous contre le flanc : les tenons de sa couche haute entrent sous les pièces de coque qui viennent d’être posées.`;
    return [
      `La couche qui reçoit ce sous-ensemble vient d’être posée (dessous à ${s.y} plaques, ${h} cm). C’est le moment de le fixer — une fois la couche suivante posée, il ne s’insère plus.`,
      where,
      `Le sous-ensemble a été monté au chapitre 1 (${n} pièces). Vérifier l’aplomb avant de poursuivre.`,
    ];
  }
  if (s.context === 'final') {
    return [
      'Le socle est terminé. Soulever le sous-marin par la coque, sous les pectorales, à deux mains.',
      'Le descendre sur les deux tiges : leur sommet vient sous le ventre, à x = 25 et x = 62, dans le plan de symétrie. Presser doucement jusqu’au contact.',
      'Vérifier l’aplomb et la stabilité. Les tiges 2 × 2 sont le point fragile du modèle : ne pas le déplacer par le socle.',
    ];
  }
  if (s.first) {
    lines.push(s.context === 'sub' && s.unit !== 'socle'
      ? `Commencer ${s.unitLabel.toLowerCase()} à plat, pointe sur la table : la couche 1 est la plus basse, l’attache viendra en dernier. Ce sous-ensemble sera pressé sous la coque au chapitre ${s.unit.startsWith('pelv') || s.unit === 'caudaleBas' ? '3' : '2'}.`
      : s.unit === 'socle'
        ? 'Monter la plaque de base à plat : c’est elle qui reçoit les deux tiges, puis le sous-marin.'
        : st.id === 2
          ? 'Commencer la coque sur une planche rigide et plane, quille en bas. Le museau est à x = 0, la queue vers x = 84 ; le plan de symétrie est z = 0.'
          : `Chapitre ${st.id} — ${st.label} : ${st.blurb}`);
  }
  lines.push(`Poser ces ${n} pièce${n > 1 ? 's' : ''} avec le dessous à ${s.y} plaque${s.y > 1 ? 's' : ''} (${h} cm) au-dessus de la base${s.yTop > s.y ? `, sur ${s.yTop - s.y + 1} couches` : ''}. Respecter les emprises et coordonnées ci-dessous ; presser sur la couche du dessous.`);
  if (s.groupsHere && s.groupsHere.length > 1) lines.push(`Cette couche contient : ${s.groupsHere.join(', ').toLowerCase()}.`);
  if (s.last && s.context === 'sub' && s.unit !== 'socle') lines.push('Sous-ensemble terminé : le mettre de côté, attache vers le haut. Il sera fixé à l’étape indiquée dans le chapitre de la coque.');
  return lines;
}

// Ce qui est déjà en place à une étape donnée dépend du contexte : un
// sous-ensemble à plat ne voit que ses propres couches ; la séquence
// principale voit tout ce qui a été posé et fixé avant elle.
function builtBefore(i) {
  const s = steps[i];
  const built = new Set();
  if (s.context === 'sub') {
    for (let k = 0; k < i; k++) if (steps[k].unit === s.unit && steps[k].context === 'sub') steps[k].pieces.forEach((id) => built.add(id));
    return built;
  }
  if (s.context === 'final') {
    for (let k = 0; k < i; k++) if (steps[k].unit === 'socle') steps[k].pieces.forEach((id) => built.add(id));
    return built;
  }
  for (let k = 0; k < i; k++) {
    const t = steps[k];
    if (t.context === 'main' || t.context === 'attach') t.pieces.forEach((id) => built.add(id));
  }
  return built;
}

function showStep(i) {
  if (!steps.length) return;
  stepIndex = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[stepIndex];

  const built = builtBefore(stepIndex);
  const add = new Set(s.pieces);
  // une nageoire pendante se lit de profil, pas d'en haut
  const dir = s.context === 'attach' && dirIndex === 0 ? 'profil' : DIRS[dirIndex];
  guideViewer?.setBuild({ built, add, only: $('#only-step').checked }, dir);

  $('#step-no').textContent = s.id;
  $('#step-alloc').textContent = nf.format(s.allocated);
  $('#progress-bar').style.width = `${(s.allocated / stats.count) * 100}%`;
  $('#step-select').value = String(stepIndex);
  $('#step-title').textContent = s.title;
  $('#step-text').innerHTML = stepText(s).map((t) => `<li>${t}</li>`).join('');
  const gatherEl = $('#step-gather');
  if (s.context === 'attach' || s.context === 'final') {
    gatherEl.innerHTML = `<div class="assembly-part" style="grid-column:1/-1"><i class="sw" style="background:#1fb6c9"></i><div><b>Rien à rassembler</b><span>${s.context === 'attach' ? 'Le sous-ensemble est déjà monté' : 'Le sous-marin est terminé'}</span></div></div>`;
  } else {
    gatherEl.innerHTML = s.gather.map((g) => `
      <div class="assembly-part">
        <i class="sw" style="background:${COLORS[g.color].hex}"></i>
        <div><b>${g.qty} × ${PARTS[g.part].label}</b><span>${COLORS[g.color].name} · réf. ${PARTS[g.part].design}</span></div>
      </div>`).join('');
  }
  $('#step-coords').innerHTML = (s.context === 'attach' || s.context === 'final') ? '' : s.pieces.map((id) => pieces[id]).map((p) => `
    <tr><td>${PARTS[p.part].label}</td><td>${COLORS[p.color].name}</td>
    <td class="right mono">${p.x}</td><td class="right mono">${p.z}</td>
    <td>${p.dx === p.dz ? '—' : p.dx > p.dz ? 'en long' : 'en travers'}</td></tr>`).join('');
  $$('[data-chapter]').forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.chapter) === s.stage)));
  $$('#step-prev, #step-prev-2').forEach((b) => { b.disabled = stepIndex === 0; });
  $$('#step-next, #step-next-2').forEach((b) => { b.disabled = stepIndex === steps.length - 1; });
}

$$('#step-prev, #step-prev-2').forEach((b) => b.addEventListener('click', () => showStep(stepIndex - 1)));
$$('#step-next, #step-next-2').forEach((b) => b.addEventListener('click', () => {
  showStep(stepIndex + 1);
  $('.assembly-layout').scrollIntoView({ block: 'start' });
}));
$('#step-select').addEventListener('change', (e) => showStep(Number(e.target.value)));
$('#only-step').addEventListener('change', () => showStep(stepIndex));
$('#cycle-view').addEventListener('click', () => { dirIndex = (dirIndex + 1) % DIRS.length; showStep(stepIndex); });
$$('[data-chapter]').forEach((b) => b.addEventListener('click', () => {
  const first = steps.findIndex((s) => s.stage === Number(b.dataset.chapter));
  if (first >= 0) showStep(first);
}));
document.addEventListener('keydown', (e) => {
  if ($('[data-panel="guide"]').hidden || e.target.matches('input, select, textarea')) return;
  if (e.key === 'ArrowRight') showStep(stepIndex + 1);
  if (e.key === 'ArrowLeft') showStep(stepIndex - 1);
});

// --- éclaté ------------------------------------------------------
$('#explode').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  $('#explode-val').textContent = `${v} %`;
  viewer?.setExplode(v / 100);
});

// --- pièce cliquée dans la scène ---------------------------------
viewer?.onPick((p) => {
  if (!p) { $('#stage-tag').textContent = select.value === '0' ? 'Toutes les pièces' : $('#stage-tag').textContent; return; }
  const def = PARTS[p.part];
  const g = GROUPS[p.group];
  $('#stage-tag').textContent = `${def.label} · ${COLORS[p.color].name} · ${g ? g.label : p.group}`;
});

// ---------------------------------------------------------------
// 5. Exports
// ---------------------------------------------------------------
const EXPORTS = {
  csv:  () => ['sous-marin-requin-pieces.csv', toCSV(stats), 'text/csv;charset=utf-8'],
  ldr:  () => ['sous-marin-requin.ldr', toLDraw(pieces, { count: stats.count }), 'text/plain;charset=utf-8'],
  xml:  () => ['sous-marin-requin-bricklink.xml', toBrickLinkXML(stats), 'application/xml;charset=utf-8'],
  json: () => ['sous-marin-requin-coordonnees.json', toJSON(model), 'application/json;charset=utf-8'],
  guide:() => ['sous-marin-requin-guide.md', toGuide(model), 'text/markdown;charset=utf-8'],
  html: () => ['sous-marin-requin-guide.html', toGuideHTML(model), 'text/html;charset=utf-8'],
};
$$('[data-dl]').forEach((btn) => {
  btn.addEventListener('click', () => download(...EXPORTS[btn.dataset.dl]()));
});

console.info(`Brique Studio 002 — ${stats.count} pièces, ${stats.types} couples pièce/couleur.`);
