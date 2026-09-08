// ================================================================
// Câblage de la page : génération du modèle, remplissage des
// chiffres, onglets, catalogue, visualiseur, exports.
// ================================================================

import { buildModel, PARTS, COLORS, STAGES, GROUPS } from './model.js';
import { toCSV, toLDraw, toBrickLinkXML, toJSON, toGuide, download } from './exports.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nf = new Intl.NumberFormat('fr-FR');
const cf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const df = (v) => v.toFixed(1).replace('.', ',');

const model = buildModel();
const { pieces, stats, bbox, check } = model;

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
  creme: nf.format(countIn((p) => p.color === 'tan' && HULL.has(p.group))),
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
  if (name === 'modele') viewer?.resize();
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
  $$('#assembly-steps .assembly-step').forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.stage) === n)));
}
select.addEventListener('change', () => setStage(Number(select.value)));

// --- liste des étapes, onglet « guide » -------------------------
const byStage = new Map(stats.byStage);
$('#assembly-steps').innerHTML = STAGES.map((s) => `
  <button class="assembly-step" type="button" data-stage="${s.id}" aria-current="false">
    <span class="no">${s.id}</span>
    <span class="txt"><b>${s.label}</b><span>${s.blurb}</span></span>
    <span class="qty">${nf.format(byStage.get(s.id) || 0)}</span>
  </button>`).join('');
$$('#assembly-steps .assembly-step').forEach((b) => {
  b.addEventListener('click', () => {
    setStage(Number(b.dataset.stage));
    showTab('modele');
  });
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
};
$$('[data-dl]').forEach((btn) => {
  btn.addEventListener('click', () => download(...EXPORTS[btn.dataset.dl]()));
});

console.info(`Brique Studio 002 — ${stats.count} pièces, ${stats.types} couples pièce/couleur.`);
