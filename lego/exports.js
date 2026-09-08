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

export function download(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
