// ================================================================
// Câblage de la page : génération du modèle, remplissage des
// chiffres, catalogue, visualiseur, exports.
// ================================================================

import { buildModel, PARTS, COLORS, STAGES, GROUPS, hullTop } from './model.js';
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
const FINS = new Set(['pectoraleD', 'pectoraleG', 'pelvienneD', 'pelvienneG', 'dorsale', 'dorsale2', 'caudale']);

const dorsalPeak = pieces.filter((p) => p.group === 'dorsale')
  .reduce((m, p) => Math.max(m, p.y + p.h), 0);
const dorsalCm = ((dorsalPeak - hullTop(43)) * 3.2) / 10;

const values = {
  count: nf.format(stats.count),
  types: nf.format(stats.types),
  stages: STAGES.length,
  layers: nf.format(new Set(pieces.map((p) => p.y)).size),
  coque: nf.format(countIn((p) => HULL.has(p.group))),
  chassis: nf.format(countIn((p) => p.group === 'chassis')),
  nageoires: nf.format(countIn((p) => FINS.has(p.group))),
  hublot: nf.format(countIn((p) => p.group === 'hublot')),
  caudale: nf.format(countIn((p) => p.group === 'caudale')),
  dorsale: df(dorsalCm),
  dimx: df(bbox.mm.x / 10),
  dimy: df(bbox.mm.y / 10),
  dimz: df(bbox.mm.z / 10),
  cost: cf.format(stats.cost),
  families: nf.format(new Set(stats.rows.map((r) => r.part)).size),
  colors: nf.format(new Set(stats.rows.map((r) => r.color)).size),
  studs: `${bbox.studs.x} × ${bbox.studs.z} tenons`,
  overlaps: nf.format(check.overlaps),
  components: nf.format(check.components),
  detached: nf.format(check.detached),
  linked: `${nf.format(check.largest)} (${df((check.largest / stats.count) * 100)} %)`,
};
$$('[data-fill]').forEach((el) => {
  const v = values[el.dataset.fill];
  if (v !== undefined) el.textContent = v;
});

// ---------------------------------------------------------------
// 2. Catalogue
// ---------------------------------------------------------------
const tbody = $('#catalog-body');
stats.rows.forEach((r) => {
  const tr = document.createElement('tr');
  tr.dataset.part = r.part;
  tr.dataset.color = r.color;
  tr.innerHTML = `
    <td class="part"><span class="swatch" style="background:${COLORS[r.color].hex}"></span>${r.label}</td>
    <td>${COLORS[r.color].name}</td>
    <td class="mono hide-sm"><a href="https://www.bricklink.com/v2/catalog/catalogitem.page?P=${r.design}" target="_blank" rel="noopener">${r.design} ↗</a></td>
    <td class="mono hide-sm">${r.ldraw}</td>
    <td class="num">${nf.format(r.qty)}</td>
    <td class="num mono hide-sm">${cf.format(r.price)}</td>
    <td class="num">${cf.format(r.total)}</td>`;
  tbody.appendChild(tr);
});

// ---------------------------------------------------------------
// 3. Visualiseur
// ---------------------------------------------------------------
// Chargé après coup : si WebGL manque ou si le module échoue, la page
// reste entièrement utilisable (chiffres, bordereau, exports).
let viewer = null;
try {
  const { createViewer } = await import('./viewer.js');
  viewer = createViewer($('#scene'), model);
  $('#loading').hidden = true;
} catch (err) {
  console.error(err);
  $('#loading').textContent = 'Le rendu 3D n’a pas pu démarrer sur cet appareil. Le bordereau et les exports restent disponibles.';
}

// --- sélection dans le catalogue -------------------------------
let selected = null;
function selectRow(tr) {
  const same = selected === tr;
  $$('#catalog-body tr').forEach((r) => r.classList.remove('on'));
  selected = same ? null : tr;
  if (selected) selected.classList.add('on');
  viewer?.setHighlight(selected ? { part: selected.dataset.part, color: selected.dataset.color } : null);
  if (selected) $('#modele').scrollIntoView({ block: 'center' });
}
tbody.addEventListener('click', (e) => {
  const tr = e.target.closest('tr');
  if (tr && !e.target.closest('a')) selectRow(tr);
});

// --- boutons « situer » ----------------------------------------
const LOCATE = {
  coque: [...HULL],
  chassis: ['chassis'],
  nageoires: [...FINS],
  hublot: ['hublot'],
};
let located = null;
$$('[data-locate]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const k = btn.dataset.locate;
    located = located === k ? null : k;
    $$('#catalog-body tr').forEach((r) => r.classList.remove('on'));
    selected = null;
    viewer?.setHighlight(located ? { groups: LOCATE[k] } : null);
    $('#modele').scrollIntoView({ block: 'center' });
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
select.addEventListener('change', () => {
  const n = Number(select.value);
  viewer?.setStage(n);
  const st = STAGES.find((s) => s.id === n);
  $('#stage-blurb').textContent = st ? st.blurb : BLURB_ALL;
  $('#stage-tag').textContent = st ? `Étapes 1 à ${st.id} · ${st.label}` : 'Toutes les pièces';
});

// --- répartition par étape --------------------------------------
$('#stage-table').innerHTML = stats.byStage.map(([id, n]) => {
  const st = STAGES.find((s) => s.id === id);
  return `<tr><td class="mono" style="padding:6px 0;border:0;color:var(--muted)">${id}</td>
    <td style="padding:6px 8px;border:0">${st ? st.label : '—'}</td>
    <td class="num mono" style="padding:6px 0;border:0;color:var(--yellow)">${nf.format(n)}</td></tr>`;
}).join('');

// --- éclaté ------------------------------------------------------
$('#explode').addEventListener('input', (e) => viewer?.setExplode(Number(e.target.value) / 100));

// --- pièce cliquée dans la scène ---------------------------------
const readout = $('#readout');
viewer?.onPick((p) => {
  if (!p) { readout.hidden = true; return; }
  const def = PARTS[p.part];
  const st = STAGES.find((s) => s.id === p.stage);
  readout.hidden = false;
  readout.innerHTML = `
    <b>${def.label}</b><br />
    <span class="k">Couleur</span> ${COLORS[p.color].name}<br />
    <span class="k">Réf.</span> ${def.design} · ${def.ldraw}<br />
    <span class="k">Position</span> x ${p.x} · y ${p.y} · z ${p.z}<br />
    <span class="k">Ensemble</span> ${GROUPS[p.group] ? GROUPS[p.group].label : p.group}<br />
    <span class="k">Étape</span> ${p.stage} — ${st ? st.label : '—'}`;
});

// ---------------------------------------------------------------
// 4. Exports
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

// petit repère en console, comme sur le reste du site
console.info(`Brique Studio 002 — ${stats.count} pièces, ${stats.types} couples pièce/couleur.`);
