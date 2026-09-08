// ================================================================
// Câblage de la page : génération du modèle, remplissage des
// chiffres, onglets, catalogue, visualiseur, exports.
// ================================================================

import { buildModel, PARTS, COLORS, STAGES, GROUPS } from './model.js';
import { toCSV, toLDraw, toBrickLinkXML, toJSON, toGuide, toGuideHTML, download } from './exports.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nf = new Intl.NumberFormat('fr-FR');
const cf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const df = (v) => v.toFixed(1).replace('.', ',');

const model = buildModel();
const { pieces, steps, stats, bbox, check } = model;

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
  const lines = [];
  if (s.first) {
    lines.push(s.unit === 'coque'
      ? 'Commencer la coque sur une planche rigide et plane. Le museau est à x = 0, la queue vers x = 84 ; le plan de symétrie est z = 0.'
      : s.unit === 'socle'
        ? 'Monter la plaque de base à plat : c’est elle qui reçoit les deux tiges, puis le sous-marin.'
        : `Commencer ${s.unitLabel.toLowerCase()} à plat, sur une surface dégagée. Ce sous-ensemble sera fixé sur la coque à la fin du chapitre.`);
  }
  lines.push(`Poser ces ${s.pieces.length} pièce${s.pieces.length > 1 ? 's' : ''} avec le dessous à ${s.y} plaque${s.y > 1 ? 's' : ''} (${h} cm) au-dessus de la base${s.yTop > s.y ? `, sur ${s.yTop - s.y + 1} couches` : ''}. Respecter les emprises et coordonnées ci-dessous ; presser sur la couche du dessous.`);
  if (s.last && s.unit !== 'coque' && s.unit !== 'socle') {
    lines.push(s.unit.startsWith('pectorale') || s.unit.startsWith('pelvienne')
      ? 'Sous-ensemble terminé : le fixer sur le flanc par son attache haute, tenons vers le haut, contre la peau de la coque. Le tester avant de monter le second.'
      : s.unit === 'caudale'
        ? 'Sous-ensemble terminé : glisser le croissant sur le pédoncule, sa racine coiffe la coque par-dessus et par-dessous.'
        : s.unit === 'helice'
          ? 'Engager l’arbre dans le canal de la racine caudale ; l’hélice dépasse à l’extrême arrière.'
          : `Sous-ensemble terminé : le poser sur le dos, à sa place sur la coque.`);
  }
  if (s.last && s.unit === 'socle') lines.push('Descendre le sous-marin sur les deux tiges, ventre en appui ; vérifier l’aplomb avant de lâcher.');
  if (s.first && st) lines.unshift(`Chapitre ${st.id} — ${st.label} : ${st.blurb}`);
  return lines;
}

function showStep(i) {
  if (!steps.length) return;
  stepIndex = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[stepIndex];

  const built = new Set();
  for (let k = 0; k < stepIndex; k++) for (const id of steps[k].pieces) built.add(id);
  const add = new Set(s.pieces);
  guideViewer?.setBuild({ built, add, only: $('#only-step').checked }, DIRS[dirIndex]);

  $('#step-no').textContent = s.id;
  $('#step-alloc').textContent = nf.format(s.allocated);
  $('#progress-bar').style.width = `${(s.allocated / stats.count) * 100}%`;
  $('#step-select').value = String(stepIndex);
  $('#step-title').textContent = s.title;
  $('#step-text').innerHTML = stepText(s).map((t) => `<li>${t}</li>`).join('');
  $('#step-gather').innerHTML = s.gather.map((g) => `
    <div class="assembly-part">
      <i class="sw" style="background:${COLORS[g.color].hex}"></i>
      <div><b>${g.qty} × ${PARTS[g.part].label}</b><span>${COLORS[g.color].name} · réf. ${PARTS[g.part].design}</span></div>
    </div>`).join('');
  $('#step-coords').innerHTML = s.pieces.map((id) => pieces[id]).map((p) => `
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
