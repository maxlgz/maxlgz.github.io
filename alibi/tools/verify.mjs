#!/usr/bin/env node
// Vérifie chaque niveau de alibi/js/levels.js : structure, unicité de la solution, meurtrier,
// et pour les variantes : le témoin menteur (twist.liar) et l'arme du crime (twist.weapon).
// Usage : node alibi/tools/verify.mjs [module.js]   (code de sortie ≠ 0 si un niveau n'a pas exactement une solution)
// Sans argument : alibi/js/levels.js ; sinon un module qui exporte LEVELS (essais de niveaux).
import { pathToFileURL } from 'node:url';
const { LEVELS } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : '../js/levels.js');
import { validateLevel, solve, murdererOf, evaluate, prepare, dims, liarOf, weaponOf, OBJECTS } from '../js/engine.js';

// « 6×6 » pour un carré ; « 6×9 » = lignes×colonnes pour un rectangle.
const planLabel = raw => { const { rows, cols } = dims(raw); return `${rows}×${cols}`; };

let failed = 0;
const ids = new Set();

for (const raw of LEVELS) {
  const label = `${raw.id ?? '?'}`.padEnd(24);
  const problems = [];
  if (ids.has(raw.id)) problems.push(`id en double « ${raw.id} »`);
  ids.add(raw.id);

  const { errors, warnings } = validateLevel(raw);
  if (errors.length) {
    failed++;
    console.log(`✗ ${label} ERREURS : ${errors.join(' | ')}`);
    continue;
  }
  const level = prepare(raw);
  const nClues = level.people.reduce((s, p) => s + p.clues.length, 0);
  const t0 = performance.now();
  const sols = solve(level, { max: 2 });
  const ms = performance.now() - t0;
  const status = sols.length === 0 ? 'aucune' : sols.length === 1 ? 'unique' : 'multiple';
  let murderer = '-';
  const extra = [];
  if (sols.length === 1) {
    const id = murdererOf(level, sols[0]);
    const person = level.people.find(p => p.id === id);
    murderer = person ? `${person.name} (${id})` : '?';
    if (!evaluate(level, sols[0]).ok) problems.push('evaluate() refuse la solution trouvée');
    if (raw.solution) {
      const same = level.people.every(p => {
        const a = raw.solution[p.id], b = sols[0][p.id];
        return a && a[0] === b[0] && a[1] === b[1];
      });
      if (!same) problems.push('la solution fournie ne correspond pas à celle du solveur');
    }
    const twist = raw.twist || {};
    if (twist.liar) {
      const id = liarOf(level, sols[0]);
      const person = level.people.find(p => p.id === id);
      if (!person) problems.push('aucun menteur identifiable dans la solution');
      else extra.push(`menteur : ${person.name} (${id})`);
    }
    if (twist.weapon) {
      const k = weaponOf(level, sols[0]);
      if (k == null) problems.push('arme du crime : le meurtrier n\'a pas exactement un objet à côté de lui');
      else {
        const o = level.objects[k];
        extra.push(`arme : ${(OBJECTS[o.type] && OBJECTS[o.type].n) || o.type} n° ${k + 1} (${o.r}, ${o.c})`);
      }
    }
  } else {
    failed++;
  }
  if (problems.length) failed++;
  const ok = sols.length === 1 && !problems.length;
  console.log(`${ok ? '✓' : '✗'} ${label} ${planLabel(raw).padEnd(4)}  ${String(nClues).padStart(2)} indices  ${status.padEnd(8)}  meurtrier : ${murderer.padEnd(14)} ${ms.toFixed(1)} ms`
    + (extra.length ? `  ${extra.join('  ')}` : '')
    + (problems.length ? `  ⚠ ${problems.join(' ; ')}` : '')
    + (warnings.length ? `\n    avertissements : ${warnings.join(' | ')}` : ''));
}

console.log(failed ? `\n${failed} problème(s).` : `\n${LEVELS.length} niveau(x) vérifié(s), tous à solution unique.`);
process.exit(failed ? 1 : 0);
