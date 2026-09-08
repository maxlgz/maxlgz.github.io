// ================================================================
// Exports : bordereau CSV, fichier LDraw, liste BrickLink,
// coordonnées JSON et guide de montage.
// ================================================================

import { PARTS, COLORS, STAGES, GROUPS, STUD_MM, PLATE_MM, unitPrice } from './model.js';

const LDU_STUD = 20;   // 1 tenon = 20 LDU
const LDU_PLATE = 8;   // 1 plaque = 8 LDU

export function toCSV(stats) {
  const head = ['Pièce', 'Couleur', 'Réf. design', 'Réf. LDraw', 'Quantité', 'Prix unitaire (€)', 'Total (€)'];
  const rows = stats.rows.map((r) => [
    r.label, COLORS[r.color].name, r.design, r.ldraw,
    r.qty, r.price.toFixed(2), r.total.toFixed(2),
  ]);
  rows.push(['TOTAL', '', '', '', stats.count, '', stats.cost.toFixed(2)]);
  return [head, ...rows]
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

// Liste de manque BrickLink (importable sur bricklink.com).
export function toBrickLinkXML(stats) {
  const items = stats.rows.map((r) => [
    '  <ITEM>',
    '    <ITEMTYPE>P</ITEMTYPE>',
    `    <ITEMID>${r.design}</ITEMID>`,
    `    <COLOR>${COLORS[r.color].bl}</COLOR>`,
    `    <MINQTY>${r.qty}</MINQTY>`,
    '  </ITEM>',
  ].join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<INVENTORY>\n${items}\n</INVENTORY>\n`;
}

// Fichier LDraw (.ldr) — ouvrable dans Studio, LeoCAD ou LDView.
// Repère LDraw : Y vers le bas, origine de pièce sur sa face inférieure.
export function toLDraw(pieces, meta = {}) {
  const out = [
    '0 Sous-marin requin — BriQue Studio, modèle 002',
    '0 Name: sous-marin-requin.ldr',
    '0 Author: Brique Studio (generation parametrique)',
    '0 !LDRAW_ORG Model',
    '0 BFC CERTIFY CCW',
    `0 // ${meta.count || pieces.length} pieces — 1 stud = ${STUD_MM} mm`,
  ];
  for (const p of pieces) {
    const def = PARTS[p.part];
    if (!def) continue;
    const x = (p.x + p.dx / 2) * LDU_STUD;
    const z = (p.z + p.dz / 2) * LDU_STUD;
    const y = -(p.y * LDU_PLATE);
    // Les pièces LDraw sont définies avec leur grande dimension sur X.
    const rot = p.dx >= p.dz ? '1 0 0 0 1 0 0 0 1' : '0 0 1 0 1 0 -1 0 0';
    out.push(`1 ${COLORS[p.color].ldraw} ${x} ${y} ${z} ${rot} ${def.ldraw}`);
  }
  out.push('0');
  return out.join('\n');
}

export function toJSON(model) {
  return JSON.stringify({
    modele: 'Sous-marin requin — Brique Studio 002',
    unites: { tenon_mm: STUD_MM, plaque_mm: PLATE_MM },
    encombrement_mm: model.bbox.mm,
    pieces_total: model.stats.count,
    repere: 'x = museau -> queue, y = bas -> haut (plaques), z = bâbord -> tribord',
    pieces: model.pieces.map((p) => ({
      id: p.id, part: p.part, design: PARTS[p.part].design,
      couleur: p.color, x: p.x, y: p.y, z: p.z,
      dx: p.dx, dz: p.dz, h: p.h, etape: p.stage, ensemble: p.group,
    })),
  }, null, 1);
}

// Guide de montage en Markdown : une section par étape.
export function toGuide(model) {
  const { pieces, stats, bbox } = model;
  const L = [];
  L.push('# Sous-marin requin — guide de montage');
  L.push('');
  L.push(`Modèle 002 de Brique Studio. ${stats.count} pièces, ${stats.types} couples pièce/couleur.`);
  const cm = (v) => (v / 10).toFixed(1).replace('.', ',');
  L.push(`Encombrement : ${cm(bbox.mm.x)} × ${cm(bbox.mm.z)} × ${cm(bbox.mm.y)} cm.`);
  L.push('');
  L.push('Repère : **x** du museau vers la queue, **z** de bâbord à tribord (0 = plan de symétrie),');
  L.push('**y** en plaques depuis le bas du socle. 1 tenon = 8 mm, 1 plaque = 3,2 mm.');
  L.push('');
  for (const st of STAGES) {
    const sub = pieces.filter((p) => p.stage === st.id);
    if (!sub.length) continue;
    L.push(`## Étape ${st.id} — ${st.label} (${sub.length} pièces)`);
    L.push('');
    L.push(st.blurb);
    L.push('');
    const tally = new Map();
    for (const p of sub) {
      const k = `${p.part}|${p.color}`;
      tally.set(k, (tally.get(k) || 0) + 1);
    }
    L.push('| Pièce | Couleur | Réf. | Qté |');
    L.push('| --- | --- | --- | --- |');
    [...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => {
      const [part, color] = k.split('|');
      L.push(`| ${PARTS[part].label} | ${COLORS[color].name} | ${PARTS[part].design} | ${n} |`);
    });
    L.push('');
    const groups = [...new Set(sub.map((p) => p.group))];
    L.push(`Sous-ensembles concernés : ${groups.map((g) => GROUPS[g] ? GROUPS[g].label : g).join(', ')}.`);
    L.push('');
  }
  L.push('---');
  L.push('');
  L.push('Les coordonnées exactes de chaque pièce se trouvent dans le fichier JSON, et le');
  L.push('fichier `.ldr` s’ouvre directement dans Studio, LeoCAD ou LDView pour un montage pas à pas.');
  return L.join('\n');
}

// Guide de montage HTML autonome : une page par étape, avec le plan de
// pose de la couche vu de dessus (à poser en cyan, couche du dessous en
// gris), la liste à rassembler et les coordonnées. Imprimable en PDF
// depuis le navigateur.
export function toGuideHTML(model) {
  const { pieces, steps, stats, bbox } = model;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cm = (v) => (v / 10).toFixed(1).replace('.', ',');

  // plan d'une étape : emprise des pièces, x vers la droite, z vers le bas
  function plan(step) {
    const add = step.pieces.map((id) => pieces[id]);
    const yPrev = step.y - 1;
    const under = pieces.filter((p) => p.y + p.h - 1 === yPrev || (p.y <= yPrev && p.y + p.h > yPrev));
    const all = [...under, ...add];
    const x0 = Math.min(...all.map((p) => p.x)) - 1, x1 = Math.max(...all.map((p) => p.x + p.dx)) + 1;
    const z0 = Math.min(...all.map((p) => p.z)) - 1, z1 = Math.max(...all.map((p) => p.z + p.dz)) + 1;
    const U = 9;
    const w = (x1 - x0) * U, h = (z1 - z0) * U;
    const rect = (p, fill, stroke) =>
      `<rect x="${(p.x - x0) * U}" y="${(p.z - z0) * U}" width="${p.dx * U}" height="${p.dz * U}" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`;
    const studs = (p) => {
      let o = '';
      for (let a = 0; a < p.dx; a++) for (let c = 0; c < p.dz; c++)
        o += `<circle cx="${(p.x - x0 + a + 0.5) * U}" cy="${(p.z - z0 + c + 0.5) * U}" r="${U * 0.28}" fill="none" stroke="#0b7d8c" stroke-width="0.6"/>`;
      return o;
    };
    const grid = [];
    for (let x = x0; x <= x1; x++) grid.push(`<line x1="${(x - x0) * U}" y1="0" x2="${(x - x0) * U}" y2="${h}" stroke="#e3e8ee" stroke-width="0.5"/>`);
    for (let z = z0; z <= z1; z++) grid.push(`<line x1="0" y1="${(z - z0) * U}" x2="${w}" y2="${(z - z0) * U}" stroke="#e3e8ee" stroke-width="0.5"/>`);
    const axis = `<line x1="0" y1="${(0 - z0) * U}" x2="${w}" y2="${(0 - z0) * U}" stroke="#c92b30" stroke-width="0.7" stroke-dasharray="4 3"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${Math.min(w, 620)}" role="img" aria-label="Plan de la couche">
      ${grid.join('')}${z0 < 0 && z1 > 0 ? axis : ''}
      ${under.map((p) => rect(p, '#dfe4ea', '#b9c2cc')).join('')}
      ${add.map((p) => rect(p, '#8fdbe6', '#0b7d8c') + studs(p)).join('')}
      <text x="2" y="${h - 3}" font-size="7" fill="#607086">x ${x0 + 1} → ${x1 - 1} · z ${z0 + 1} → ${z1 - 1} · axe z = 0 en pointillé rouge</text>
    </svg>`;
  }

  const chapters = STAGES.map((st) => {
    const own = steps.filter((s) => s.stage === st.id);
    const body = own.map((s) => `
      <section class="step" id="etape-${s.id}">
        <header><span class="no">Étape ${s.id} / ${steps.length}</span><h3>${esc(s.title)}</h3>
          <span class="alloc">${s.allocated} / ${stats.count} pièces posées</span></header>
        <p class="lead">Dessous des pièces à <b>${s.y} plaques</b> (${cm(s.y * PLATE_MM)} cm) au-dessus de la base${s.yTop > s.y ? `, sur ${s.yTop - s.y + 1} couches` : ''}.
          ${s.first && s.unit !== 'coque' && s.unit !== 'socle' ? 'Premier rang du sous-ensemble : le monter à plat.' : ''}
          ${s.last && s.unit !== 'coque' && s.unit !== 'socle' ? 'Dernier rang : fixer le sous-ensemble sur la coque.' : ''}</p>
        <div class="cols">
          <div class="plan">${plan(s)}</div>
          <div>
            <p class="lab">À rassembler</p>
            <ul class="gather">${s.gather.map((g) => `<li><i style="background:${COLORS[g.color].hex}"></i><b>${g.qty} ×</b> ${esc(PARTS[g.part].label)} <span>${COLORS[g.color].name} · ${PARTS[g.part].design}</span></li>`).join('')}</ul>
            <p class="lab">Coordonnées</p>
            <table><thead><tr><th>Pièce</th><th>x</th><th>z</th><th>Sens</th></tr></thead><tbody>
              ${s.pieces.map((id) => pieces[id]).map((p) => `<tr><td>${esc(PARTS[p.part].label)} ${COLORS[p.color].name.toLowerCase()}</td><td>${p.x}</td><td>${p.z}</td><td>${p.dx === p.dz ? '—' : p.dx > p.dz ? 'en long' : 'en travers'}</td></tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      </section>`).join('');
    return `<h2 class="chapter" id="chapitre-${st.id}">0${st.id} · ${esc(st.label)}</h2><p class="blurb">${esc(st.blurb)}</p>${body}`;
  }).join('');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sous-marin requin — guide de montage</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#142338;margin:0;padding:32px 40px;max-width:1100px}
  h1{font-size:30px;margin:0 0 6px}.sub{color:#607086;margin:0 0 24px}
  .note{background:#fff7f4;border-left:3px solid #c92b30;padding:14px 18px;margin:0 0 28px;font-size:14px;line-height:1.6}
  .sommaire{columns:2;font-size:14px;margin-bottom:28px}.sommaire a{color:#142338}
  h2.chapter{font-size:22px;margin:40px 0 4px;padding-top:18px;border-top:1px solid #dbe1e8}.blurb{color:#607086;font-size:14px;margin:0 0 16px}
  .step{border:1px solid #dbe1e8;border-radius:8px;padding:16px 20px;margin:14px 0;break-inside:avoid;page-break-inside:avoid}
  .step header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.step h3{margin:0;font-size:18px}
  .no{font-size:11px;letter-spacing:.08em;color:#a52c32;font-weight:700}.alloc{margin-left:auto;font-size:12px;color:#607086}
  .lead{font-size:14px;color:#58697e;margin:8px 0 12px}
  .cols{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px;align-items:start}
  .plan svg{border:1px solid #dbe1e8;border-radius:6px;background:#fff;max-width:100%;height:auto}
  .lab{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#647185;font-weight:700;margin:0 0 6px}
  .gather{list-style:none;padding:0;margin:0 0 14px}.gather li{display:flex;align-items:center;gap:8px;font-size:13px;padding:4px 0}
  .gather i{display:inline-block;width:26px;height:12px;border-radius:2px;border:1px solid #0002}.gather span{color:#607086}
  table{border-collapse:collapse;font-size:12px;width:100%}th,td{text-align:left;padding:3px 6px;border-bottom:1px solid #eef1f5}th{color:#647185;font-weight:700}
  @media print{body{padding:0}.step{page-break-inside:avoid}h2.chapter{page-break-before:always}}
  @media(max-width:760px){.cols{grid-template-columns:1fr}.sommaire{columns:1}}
</style></head><body>
<h1>Sous-marin requin — guide de montage</h1>
<p class="sub">Brique Studio, modèle 002 · ${stats.count} pièces · ${steps.length} étapes · ${cm(bbox.mm.x)} × ${cm(bbox.mm.z)} × ${cm(bbox.mm.y)} cm</p>
<p class="note">Guide dérivé du modèle. Les positions sont contrôlées numériquement (0 chevauchement, ${model.check.largest} pièces solidaires par les tenons sur ${stats.count}) ; la tenue physique n’a pas été éprouvée. Repère : x du museau vers la queue, z de bâbord à tribord (0 = plan de symétrie), y en plaques depuis le dessus de la plaque de base. Sur chaque plan, x va vers la droite et z vers le bas ; la couche du dessous est en gris, les pièces à poser en cyan avec leurs tenons.</p>
<div class="sommaire">${STAGES.map((st) => `<div><a href="#chapitre-${st.id}">0${st.id} · ${esc(st.label)}</a> — ${steps.filter((s) => s.stage === st.id).length} étapes</div>`).join('')}</div>
${chapters}
<p class="sub" style="margin-top:40px">Création de fan indépendante. Non affiliée à LEGO® ni à Moulinsart / Tintinimaginatio.</p>
</body></html>`;
}

export function download(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
