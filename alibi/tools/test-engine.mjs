#!/usr/bin/env node
// Tests du moteur d'Alibi : node alibi/tools/test-engine.mjs
import assert from 'node:assert/strict';
import {
  OBJECTS, OBJECT_SIZES, FLOORS, CLUE_TYPES, prepare, dims, canPlace, clueHTML, personCluesHTML, checkClue,
  evaluate, murdererOf, solve, generateClues, validateLevel,
} from '../js/engine.js';
import { LEVELS } from '../js/levels.js';

let passed = 0, failedCount = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failedCount++; console.log(`  ✗ ${name}\n    ${e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n    ') : e}`); }
}
const strip = html => html.replace(/<\/?b>/g, '');
const fnv = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
// Non-régression : empreintes capturées avec le moteur d'AVANT les plans rectangulaires.
// Par niveau : fnv(JSON.stringify({ sol: solve(niveau, { max: 3 }), phrases: personCluesHTML de chaque personne })).
const REF_LEVELS = {
  peniche: '946e16dc', refuge: '95f5bb9b', librairie: '6533c825', boulangerie: '3b3a3c68', camping: '43f1ef3f',
  gare: 'd0cfde4d', serre: 'e2490077', marche: 'c159a63b', ecole: '1bba00d1', ferme: 'e9151c7b', piscine: '6fffc04d',
  coiffure: '3b6a0c8f', phare: 'a628fffb', vignoble: '6ae9d621', chapiteau: 'b32661f0', observatoire: '2addf192',
  musee: '00a1f512', station: '067dfe82', opera: '1e57c7fb', manoir: 'e49be0df', 'grand-hotel': '7b110764',
};
// generateClues sur ces 21 niveaux, difficultés 1 à 3, graines 1, 2, 3, 'abc' (dans l'ordre de LEVELS).
const REF_GEN = 'af0a0a0d';

// Petit niveau 5×5 de référence.
//   a a b b b      a : Atelier (une seule pièce à gauche), b : Grenier, c : Terrasse
//   a a b b b
//   a a c c c
//   a a c c c
//   a a c c c
function base(extra = {}) {
  return {
    id: 'test', title: 'Test', difficulty: 1, size: 5,
    rooms: [
      { key: 'a', name: 'Atelier', floor: 'wood' },
      { key: 'b', name: 'Grenier', floor: 'parquet' },
      { key: 'c', name: 'Terrasse', floor: 'deck' },
    ],
    roomMap: ['aabbb', 'aabbb', 'aaccc', 'aaccc', 'aaccc'],
    objects: [
      { type: 'sofa', r: 0, c: 0, w: 2, h: 1 },   // (0,0)-(0,1) dans a
      { type: 'tree', r: 2, c: 4 },               // c
      { type: 'barrel', r: 1, c: 2 },             // b
      { type: 'chair', r: 4, c: 2 },              // c
      { type: 'chair', r: 1, c: 4 },              // b
    ],
    people: [
      { id: 'A', name: 'Agathe', gender: 'f', clues: [] },
      { id: 'B', name: 'Bruno', gender: 'm', clues: [] },
      { id: 'C', name: 'Chloé', gender: 'f', clues: [] },
      { id: 'D', name: 'Denis', gender: 'm', clues: [] },
      { id: 'V', name: 'Victor', gender: 'm', victim: true, clues: [] },
    ],
    ...extra,
  };
}
const L = prepare(base());
const P = id => L.people.find(p => p.id === id);
const chk = (pl, id, clue) => checkClue(L, pl, P(id), clue);

console.log('Catalogue et préparation');
test('OBJECTS contient les 34 types du contrat d’origine et les 38 nouveaux, complets', () => {
  const ids = ['tree', 'bush', 'rock', 'plant', 'shelf', 'table', 'desk', 'counter', 'wardrobe', 'barrel', 'crate',
    'statue', 'fountain', 'piano', 'stove', 'fireplace', 'lamp', 'telescope', 'aquarium', 'well',
    'chair', 'armchair', 'sofa', 'stool', 'bench', 'bed', 'deckchair', 'hammock', 'rug', 'bathtub', 'boat', 'car', 'tent', 'stage'];
  assert.equal(Object.keys(OBJECTS).length, 34 + 38);
  for (const id of ids) {
    const o = OBJECTS[id];
    assert.ok(o, id);
    assert.ok(['m', 'f'].includes(o.g) && o.n && o.pl, id);
    assert.equal(typeof o.occ, 'boolean');
    if (o.occ) assert.ok(o.on, `${id} sans locution`);
  }
  assert.equal(ids.slice(0, 20).filter(i => OBJECTS[i].occ).length, 0);
  assert.equal(ids.slice(20).filter(i => !OBJECTS[i].occ).length, 0);
  assert.equal(OBJECTS.chair.on, 'assis sur');
  assert.equal(OBJECTS.tent.on, 'sous');
  assert.equal(OBJECTS.well.pl, 'puits');
  assert.equal(FLOORS.length, 12 + 9);
  assert.ok(CLUE_TYPES.length === 9 && CLUE_TYPES.every(c => c.t && c.label && Array.isArray(c.fields)));
});

test('prepare : cellules, objets multi-cases, sans modifier le niveau brut', () => {
  const raw = base();
  const snapshot = JSON.stringify(raw);
  const lv = prepare(raw);
  assert.equal(JSON.stringify(raw), snapshot);
  assert.equal(lv.cells.length, 5);
  assert.deepEqual(lv.cells[0][1], { room: 'a', objIndex: 0, objType: 'sofa', blocked: false });
  assert.deepEqual(lv.cells[2][4], { room: 'c', objIndex: 1, objType: 'tree', blocked: true });
  assert.deepEqual(lv.cells[3][3], { room: 'c', objIndex: null, objType: null, blocked: false });
  assert.equal(prepare(lv), lv, 'un niveau préparé est rendu tel quel');
  assert.equal(canPlace(lv, 2, 4), false);
  assert.equal(canPlace(lv, 0, 1), true);
  assert.equal(canPlace(raw, 1, 2), false, 'accepte un niveau brut');
  assert.equal(canPlace(lv, 5, 0), false);
});

console.log('Indices et négations');
test('room', () => {
  assert.equal(chk({ A: [0, 0] }, 'A', { t: 'room', room: 'a' }), true);
  assert.equal(chk({ A: [0, 3] }, 'A', { t: 'room', room: 'a' }), false);
  assert.equal(chk({ A: [0, 3] }, 'A', { t: 'room', room: 'a', not: true }), true);
  assert.equal(chk({}, 'A', { t: 'room', room: 'a' }), null);
});
test('on (objet multi-cases compris)', () => {
  assert.equal(chk({ A: [0, 1] }, 'A', { t: 'on', obj: 'sofa' }), true);
  assert.equal(chk({ A: [0, 0] }, 'A', { t: 'on', obj: 'sofa' }), true);
  assert.equal(chk({ A: [1, 0] }, 'A', { t: 'on', obj: 'sofa' }), false);
  assert.equal(chk({ A: [1, 0] }, 'A', { t: 'on', obj: 'sofa', not: true }), true);
});
test('beside : voisin orthogonal ET même pièce', () => {
  assert.equal(chk({ A: [1, 1] }, 'A', { t: 'beside', obj: 'sofa' }), true);
  assert.equal(chk({ A: [1, 1] }, 'A', { t: 'beside', obj: 'barrel' }), false, 'tonneau voisin mais autre pièce');
  assert.equal(chk({ A: [1, 1] }, 'A', { t: 'beside', obj: 'barrel', not: true }), true);
  assert.equal(chk({ A: [1, 3] }, 'A', { t: 'beside', obj: 'barrel' }), true);
  assert.equal(chk({ A: [2, 2] }, 'A', { t: 'beside', obj: 'barrel' }), false, 'voisin vertical, mais pièce différente');
  assert.equal(chk({ A: [3, 4] }, 'A', { t: 'beside', obj: 'tree' }), true);
  assert.equal(chk({ A: [3, 3] }, 'A', { t: 'beside', obj: 'tree' }), false, 'diagonale');
});
test('beside : l’objet sur lequel on se trouve ne compte pas, un autre du même type si', () => {
  const lv = prepare(base({ objects: [{ type: 'sofa', r: 0, c: 0, w: 2, h: 1 }, { type: 'bench', r: 1, c: 0, w: 2, h: 1 }, { type: 'bench', r: 2, c: 0 }] }));
  const pa = lv.people[0];
  assert.equal(checkClue(lv, { A: [0, 0] }, pa, { t: 'beside', obj: 'sofa' }), false);
  assert.equal(checkClue(lv, { A: [0, 0] }, pa, { t: 'beside', obj: 'bench' }), true);
  assert.equal(checkClue(lv, { A: [1, 0] }, pa, { t: 'beside', obj: 'bench' }), true, 'banc voisin distinct');
  assert.equal(checkClue(lv, { A: [1, 1] }, pa, { t: 'beside', obj: 'bench' }), false, 'seulement son propre banc');
});
test('besidePerson : même pièce exigée', () => {
  assert.equal(chk({ A: [1, 0], B: [1, 1] }, 'A', { t: 'besidePerson', who: 'B' }), true);
  assert.equal(chk({ A: [1, 1], B: [1, 2] }, 'A', { t: 'besidePerson', who: 'B' }), false, 'mur entre les deux');
  assert.equal(chk({ A: [1, 1], B: [1, 2] }, 'A', { t: 'besidePerson', who: 'B', not: true }), true);
  assert.equal(chk({ A: [1, 1] }, 'A', { t: 'besidePerson', who: 'B' }), null);
});
test('with', () => {
  assert.equal(chk({ A: [0, 0], B: [4, 1] }, 'A', { t: 'with', who: 'B' }), true);
  assert.equal(chk({ A: [0, 0], B: [4, 3] }, 'A', { t: 'with', who: 'B' }), false);
  assert.equal(chk({ A: [0, 0], B: [4, 3] }, 'A', { t: 'with', who: 'B', not: true }), true);
});
test('alone (et indétermination partielle)', () => {
  assert.equal(chk({ A: [0, 0], B: [4, 3] }, 'A', { t: 'alone' }), null);
  assert.equal(chk({ A: [0, 0], B: [4, 1] }, 'A', { t: 'alone' }), false);
  const full = { A: [0, 0], B: [1, 3], C: [2, 2], D: [3, 4], V: [4, 3] };
  assert.equal(chk(full, 'A', { t: 'alone' }), true);
  assert.equal(chk(full, 'A', { t: 'alone', not: true }), false);
  assert.equal(chk(full, 'C', { t: 'alone' }), false);
});
test('dir : personne, strict / exact', () => {
  const pl = { A: [0, 0], B: [3, 2] };
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'N', of: { who: 'B' } }), true);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'S', of: { who: 'B' } }), false);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'W', of: { who: 'B' } }), true);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'N', of: { who: 'B' }, exact: 3 }), true);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'N', of: { who: 'B' }, exact: 2 }), false);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'W', of: { who: 'B' }, exact: 2 }), true);
  assert.equal(chk(pl, 'B', { t: 'dir', dir: 'E', of: { who: 'A' }, exact: 2 }), true);
  assert.equal(chk(pl, 'A', { t: 'dir', dir: 'N', of: { who: 'B' }, not: true }), false);
  assert.equal(chk({ A: [3, 0], B: [3, 2] }, 'A', { t: 'dir', dir: 'N', of: { who: 'B' } }), false, 'même ligne');
});
test('dir : objet (boîte englobante, existence)', () => {
  // canapé (0,0)-(0,1) ; arbre (2,4) ; chaises (4,2) et (1,4)
  assert.equal(chk({ A: [3, 2] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'sofa' } }), true);
  assert.equal(chk({ A: [3, 1] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'sofa' } }), false, 'colonne 1 couverte par le canapé');
  assert.equal(chk({ A: [3, 2] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'sofa' }, exact: 1 }), true);
  assert.equal(chk({ A: [3, 3] }, 'A', { t: 'dir', dir: 'S', of: { obj: 'sofa' }, exact: 3 }), true);
  assert.equal(chk({ A: [0, 3] }, 'A', { t: 'dir', dir: 'N', of: { obj: 'chair' } }), true, 'au nord de l’une des chaises');
  assert.equal(chk({ A: [0, 3] }, 'A', { t: 'dir', dir: 'N', of: { obj: 'chair' }, exact: 4 }), true);
  assert.equal(chk({ A: [4, 3] }, 'A', { t: 'dir', dir: 'N', of: { obj: 'chair' } }), false);
  assert.equal(chk({ A: [4, 3] }, 'A', { t: 'dir', dir: 'N', of: { obj: 'chair' }, not: true }), true);
});
test('dir : quelqu’un sur un objet (une AUTRE personne)', () => {
  const clue = { t: 'dir', dir: 'E', of: { on: 'chair' }, exact: 2 };
  assert.equal(chk({ A: [3, 4], B: [4, 2] }, 'A', clue), true);
  assert.equal(chk({ A: [3, 4], B: [4, 1] }, 'A', clue), null, 'pas encore déterminable');
  const full = { A: [3, 4], B: [4, 1], C: [2, 0], D: [0, 3], V: [1, 2] };
  assert.equal(chk(full, 'A', clue), false);
  assert.equal(chk(full, 'A', { ...clue, not: true }), true);
  // soi-même sur une chaise ne compte pas
  const self = { A: [4, 2], B: [0, 0], C: [1, 1], D: [2, 3], V: [3, 4] };
  assert.equal(chk(self, 'A', { t: 'dir', dir: 'S', of: { on: 'chair' } }), false);
});
test('sameRow / sameCol', () => {
  assert.equal(chk({ A: [2, 0] }, 'A', { t: 'sameRow', obj: 'tree' }), true);
  assert.equal(chk({ A: [3, 0] }, 'A', { t: 'sameRow', obj: 'tree' }), false);
  assert.equal(chk({ A: [3, 0] }, 'A', { t: 'sameRow', obj: 'tree', not: true }), true);
  assert.equal(chk({ A: [3, 1] }, 'A', { t: 'sameCol', obj: 'sofa' }), true);
  assert.equal(chk({ A: [3, 3] }, 'A', { t: 'sameCol', obj: 'sofa' }), false);
});

console.log('Évaluation et règle de la victime');
const SOL = { A: [0, 1], B: [1, 0], C: [2, 2], D: [3, 3], V: [4, 4] };
// a : A, B ; c : C, D, V → 3 personnes dans la pièce de la victime
test('règle de la victime : exactement 2 personnes dans sa pièce', () => {
  let ev = evaluate(L, SOL);
  assert.equal(ev.complete, true);
  assert.equal(ev.lines.ok, true);
  assert.equal(ev.victimOk, false);
  assert.equal(ev.ok, false);
  assert.equal(ev.murderer, null);
  const good = { A: [0, 0], B: [1, 3], C: [2, 1], D: [3, 4], V: [4, 2] }; // C dans a, V sur une chaise
  ev = evaluate(L, good);
  assert.equal(ev.victimOk, true);
  assert.equal(ev.ok, true);
  assert.equal(ev.murderer, 'D');
  assert.equal(murdererOf(L, good), 'D');
  assert.equal(murdererOf(L, { V: [4, 3], D: [3, 4] }), 'D', 'partiel : une seule autre personne');
  assert.equal(murdererOf(L, { V: [4, 3] }), null);
});
test('evaluate : lignes/colonnes, cases bloquées, indices', () => {
  let ev = evaluate(L, { A: [0, 0], B: [0, 3] });
  assert.equal(ev.complete, false);
  assert.equal(ev.lines.ok, false);
  assert.deepEqual(ev.lines.rows, [0]);
  ev = evaluate(L, { A: [0, 0], B: [1, 3], C: [2, 4], D: [3, 1], V: [4, 2] }); // C sur l'arbre
  assert.equal(ev.ok, false);
  assert.deepEqual(ev.blocked, ['C']);
  const lv = prepare(base());
  lv.people[0].clues = [{ t: 'room', room: 'b' }];
  ev = evaluate(lv, { A: [0, 0], B: [1, 3], C: [2, 1], D: [3, 4], V: [4, 2] });
  assert.equal(ev.lines.ok, true);
  assert.equal(ev.victimOk, true);
  assert.equal(ev.ok, false, 'un indice faux suffit');
  assert.deepEqual(ev.people.A, { ok: false, clues: [false] });
  assert.deepEqual(ev.people.B, { ok: true, clues: [] });
  assert.deepEqual(evaluate(lv, {}).people.A, { ok: null, clues: [null] });
});

console.log('Texte français');
const T = (lv, id, clue) => strip(clueHTML(lv, lv.people.find(p => p.id === id), clue));
test('élisions, contractions, défini/indéfini', () => {
  const lv = prepare(base({
    objects: [
      { type: 'tree', r: 0, c: 0 }, { type: 'barrel', r: 0, c: 2 }, { type: 'shelf', r: 0, c: 3 }, { type: 'shelf', r: 0, c: 4 },
      { type: 'wardrobe', r: 1, c: 0 }, { type: 'aquarium', r: 2, c: 2 }, { type: 'stage', r: 3, c: 2, w: 2, h: 1 },
      { type: 'well', r: 4, c: 4 }, { type: 'chair', r: 4, c: 0 }, { type: 'boat', r: 4, c: 2 }, { type: 'boat', r: 4, c: 3 },
      { type: 'hammock', r: 2, c: 4 }, { type: 'bush', r: 1, c: 3 }, { type: 'bush', r: 1, c: 4 },
    ],
  }));
  assert.equal(T(lv, 'A', { t: 'beside', obj: 'tree' }), "Elle était à côté de l'arbre.");
  assert.equal(T(lv, 'A', { t: 'beside', obj: 'barrel' }), 'Elle était à côté du tonneau.');
  assert.equal(T(lv, 'B', { t: 'beside', obj: 'shelf', not: true }), "Il n'était pas à côté d'une étagère.");
  assert.equal(T(lv, 'B', { t: 'beside', obj: 'bush', not: true }), "Il n'était pas à côté d'un buisson.");
  assert.equal(T(lv, 'B', { t: 'beside', obj: 'wardrobe' }), "Il était à côté de l'armoire.");
  assert.equal(T(lv, 'B', { t: 'sameRow', obj: 'aquarium' }), "Il était sur la même ligne que l'aquarium.");
  assert.equal(T(lv, 'A', { t: 'on', obj: 'stage' }), "Elle était sur l'estrade.");
  assert.equal(T(lv, 'B', { t: 'dir', dir: 'N', of: { obj: 'well' } }), 'Il était plus au nord que le puits.');
  assert.equal(T(lv, 'B', { t: 'dir', dir: 'N', of: { obj: 'well' }, exact: 2 }), 'Il était exactement 2 lignes au nord du puits.');
  assert.equal(T(lv, 'B', { t: 'dir', dir: 'E', of: { obj: 'tree' }, exact: 1 }), "Il était exactement 1 colonne à l'est de l'arbre.");
  assert.equal(T(lv, 'B', { t: 'sameCol', obj: 'shelf' }), "Il était dans la même colonne qu'une étagère.");
  assert.equal(T(lv, 'B', { t: 'beside', obj: 'hammock' }), 'Il était à côté du hamac.', 'h aspiré : pas d’élision');
  assert.equal(T(lv, 'A', { t: 'dir', dir: 'E', of: { on: 'boat' }, exact: 2 }), "Elle était exactement 2 colonnes à l'est de quelqu'un se trouvant dans une barque.");
  assert.equal(T(lv, 'A', { t: 'dir', dir: 'W', of: { on: 'chair' } }), "Elle était plus à l'ouest que quelqu'un se trouvant sur la chaise.");
  // Négation d'une cible indéfinie : formulation non ambiguë
  assert.equal(T(lv, 'A', { t: 'dir', dir: 'N', of: { obj: 'shelf' }, not: true }), "Aucune étagère n'était plus au sud qu'elle.");
  assert.equal(T(lv, 'B', { t: 'dir', dir: 'W', of: { obj: 'bush' }, exact: 2, not: true }), "Aucun buisson n'était exactement 2 colonnes à l'est de lui.");
  assert.equal(T(lv, 'B', { t: 'dir', dir: 'S', of: { obj: 'well' }, not: true }), "Il n'était pas plus au sud que le puits.");
});
test('accords en genre (assis/assise, allongé/allongée, seul/seule)', () => {
  const lv = prepare(base({ objects: [{ type: 'chair', r: 0, c: 0 }, { type: 'bed', r: 1, c: 0 }, { type: 'hammock', r: 2, c: 0 }, { type: 'armchair', r: 3, c: 0 }, { type: 'tent', r: 4, c: 0 }] }));
  assert.equal(T(lv, 'A', { t: 'on', obj: 'chair' }), 'Elle était assise sur la chaise.');
  assert.equal(T(lv, 'B', { t: 'on', obj: 'chair' }), 'Il était assis sur la chaise.');
  assert.equal(T(lv, 'A', { t: 'on', obj: 'bed', not: true }), "Elle n'était pas allongée sur le lit.");
  assert.equal(T(lv, 'A', { t: 'on', obj: 'hammock' }), 'Elle était allongée dans le hamac.');
  assert.equal(T(lv, 'B', { t: 'on', obj: 'armchair' }), 'Il était assis dans le fauteuil.');
  assert.equal(T(lv, 'C', { t: 'on', obj: 'tent' }), 'Elle était sous la tente.');
  assert.equal(T(lv, 'A', { t: 'alone' }), 'Elle était seule dans sa pièce.');
  assert.equal(T(lv, 'B', { t: 'alone', not: true }), "Il n'était pas seul dans sa pièce.");
  const v = personCluesHTML(lv, lv.people.find(p => p.id === 'V'));
  assert.equal(v[0], '<b>La victime.</b> Il était <b>seul avec</b> le meurtrier.');
  const lvf = prepare(base({ people: base().people.map(p => (p.id === 'V' ? { ...p, gender: 'f' } : p)) }));
  assert.equal(strip(personCluesHTML(lvf, 'V')[0]), 'La victime. Elle était seule avec le meurtrier.');
});
test('personnes, pièces, HTML échappé, mots-clés en gras', () => {
  assert.equal(T(L, 'A', { t: 'with', who: 'B' }), 'Elle était avec Bruno.');
  assert.equal(clueHTML(L, P('A'), { t: 'with', who: 'B', not: true }), "Elle n'était <b>pas avec Bruno</b>.");
  assert.equal(T(L, 'B', { t: 'besidePerson', who: 'A' }), "Il était à côté d'Agathe.");
  assert.equal(T(L, 'A', { t: 'besidePerson', who: 'B' }), 'Elle était à côté de Bruno.');
  assert.equal(T(L, 'A', { t: 'dir', dir: 'S', of: { who: 'B' } }), 'Elle était plus au sud que Bruno.');
  assert.equal(T(L, 'B', { t: 'dir', dir: 'S', of: { who: 'A' }, exact: 1 }), "Il était exactement 1 ligne au sud d'Agathe.");
  assert.equal(T(L, 'B', { t: 'dir', dir: 'N', of: { who: 'A' } }), "Il était plus au nord qu'Agathe.");
  assert.equal(clueHTML(L, P('A'), { t: 'room', room: 'a' }), "Elle était dans l'<b>Atelier</b>.");
  assert.equal(T(L, 'A', { t: 'room', room: 'b', not: true }), "Elle n'était pas dans le Grenier.");
  assert.equal(T(L, 'A', { t: 'room', room: 'c' }), 'Elle était sur la Terrasse.');
  assert.equal(clueHTML(L, P('A'), { t: 'beside', obj: 'tree', not: true }), "Elle n'était <b>pas à côté</b> de l'<b>arbre</b>.");
  const evil = prepare(base({
    rooms: [{ key: 'a', name: '<i>Cave</i> & co', floor: 'stone' }, { key: 'b', name: 'Dortoir', floor: 'wood' }, { key: 'c', name: 'Zone 51', floor: 'sand' }],
    people: base().people.map(p => (p.id === 'B' ? { ...p, name: '<script>Bob' } : p)),
  }));
  const h1 = clueHTML(evil, evil.people[0], { t: 'room', room: 'a' });
  assert.ok(!h1.includes('<i>') && h1.includes('&lt;i&gt;Cave&lt;/i&gt; &amp; co'), h1);
  const h2 = clueHTML(evil, evil.people[0], { t: 'with', who: 'B' });
  assert.ok(!h2.includes('<script>') && h2.includes('&lt;script&gt;Bob'), h2);
  assert.equal(strip(clueHTML(evil, evil.people[0], { t: 'room', room: 'b' })), 'Elle était dans le Dortoir.');
  assert.equal(strip(clueHTML(evil, evil.people[0], { t: 'room', room: 'c' })), 'Elle était dans la pièce Zone 51.');
  // seules des balises <b> sont produites
  for (const lv of LEVELS) for (const p of prepare(lv).people) for (const h of personCluesHTML(lv, p)) {
    assert.ok(!/<(?!\/?b>)/.test(h), h);
  }
});

console.log('Solveur');
// Force brute : toutes les affectations ligne/colonne, filtrées par evaluate().ok.
function brute(level) {
  const lv = prepare(level);
  const N = lv.size, ids = lv.people.map(p => p.id);
  const perms = [];
  const rec = (a, used) => { if (a.length === N) { perms.push(a.slice()); return; } for (let i = 0; i < N; i++) if (!used[i]) { used[i] = 1; a.push(i); rec(a, used); a.pop(); used[i] = 0; } };
  rec([], []);
  let count = 0;
  for (const rows of perms) for (const cols of perms) {
    const pl = {};
    ids.forEach((id, k) => { pl[id] = [rows[k], cols[k]]; });
    if (evaluate(lv, pl).ok) count++;
  }
  return count;
}
function lcg(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
test('solve compte correctement les solutions (comparaison à la force brute)', () => {
  const rnd = lcg(7);
  const pool = [
    { t: 'room', room: 'a' }, { t: 'room', room: 'c' }, { t: 'on', obj: 'chair' }, { t: 'beside', obj: 'sofa' },
    { t: 'beside', obj: 'tree' }, { t: 'with', who: 'B' }, { t: 'besidePerson', who: 'C' }, { t: 'alone' },
    { t: 'dir', dir: 'N', of: { who: 'D' } }, { t: 'dir', dir: 'E', of: { obj: 'barrel' } },
    { t: 'dir', dir: 'S', of: { on: 'chair' } }, { t: 'sameRow', obj: 'tree' }, { t: 'sameCol', obj: 'sofa' },
    { t: 'dir', dir: 'W', of: { who: 'A' }, exact: 1 },
  ];
  let checked = 0;
  for (let k = 0; k < 12; k++) {
    const lvRaw = base();
    for (const p of lvRaw.people) {
      if (p.victim) continue;
      const nb = Math.floor(rnd() * 2);
      for (let j = 0; j < nb; j++) {
        const c = { ...pool[Math.floor(rnd() * pool.length)] };
        if (c.who === p.id || (c.of && c.of.who === p.id)) continue;
        if (rnd() < 0.3) c.not = true;
        p.clues.push(c);
      }
    }
    const expected = brute(lvRaw);
    const got = solve(lvRaw, { max: 100000 }).length;
    assert.equal(got, expected, JSON.stringify(lvRaw.people.map(p => p.clues)));
    assert.equal(solve(lvRaw, { max: 2 }).length, Math.min(2, expected));
    for (const s of solve(lvRaw, { max: 5 })) assert.equal(evaluate(lvRaw, s).ok, true);
    checked++;
  }
  assert.equal(checked, 12);
});
test('solve : niveaux d’exemple uniques, solution conforme', () => {
  for (const lv of LEVELS) {
    const s = solve(lv, { max: 2 });
    assert.equal(s.length, 1, lv.id);
    if (lv.solution) assert.deepEqual(s[0], Object.fromEntries(lv.people.map(p => [p.id, lv.solution[p.id]])));
  }
  assert.deepEqual(solve(base({ people: base().people.map(p => (p.id === 'A' ? { ...p, clues: [{ t: 'room', room: 'zz' }] } : p)) })), []);
});

console.log('Génération d’indices');
function randomLevel(N, seed) {
  const R = lcg(seed);
  for (;;) {
    const K = 3 + Math.floor(R() * 3);
    const map = Array.from({ length: N }, () => Array(N).fill(null));
    const fr = [];
    for (let k = 0; k < K; k++) { let r, c; do { r = Math.floor(R() * N); c = Math.floor(R() * N); } while (map[r][c]); map[r][c] = 'abcdef'[k]; fr.push([r, c]); }
    let left = N * N - K;
    while (left > 0) {
      const [r, c] = fr[Math.floor(R() * fr.length)];
      const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
      const rr = r + d[0], cc = c + d[1];
      if (rr < 0 || cc < 0 || rr >= N || cc >= N || map[rr][cc]) continue;
      map[rr][cc] = map[r][c]; fr.push([rr, cc]); left--;
    }
    const types = Object.keys(OBJECTS), objects = [], used = new Set();
    for (let i = 0; i < Math.floor(N * N * 0.22); i++) {
      const r = Math.floor(R() * N), c = Math.floor(R() * N);
      if (used.has(r * N + c)) continue;
      used.add(r * N + c); objects.push({ type: types[Math.floor(R() * types.length)], r, c });
    }
    const names = ['Anna', 'Basile', 'Clara', 'David', 'Elsa', 'Firmin', 'Gaëlle', 'Henri', 'Iris'].slice(0, N);
    const people = names.map((name, i) => ({ id: name[0], name, gender: i % 2 ? 'm' : 'f', victim: i === 0, clues: [] }));
    const level = { id: 'rnd', title: 'Aléatoire', difficulty: 1, size: N, rooms: 'abcdef'.slice(0, K).split('').map(k => ({ key: k, name: `Salle ${k}`, floor: 'wood' })), roomMap: map.map(r => r.join('')), objects, people };
    const lv = prepare(level);
    for (let t = 0; t < 300; t++) {
      const perm = [...Array(N).keys()];
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
      const sol = {};
      if (people.some((p, i) => !canPlace(lv, i, perm[i]))) continue;
      people.forEach((p, i) => { sol[p.id] = [i, perm[i]]; });
      const room = id => lv.cells[sol[id][0]][sol[id][1]].room;
      if (people.filter(p => room(p.id) === room('A')).length !== 2) continue;
      return { level, sol };
    }
  }
}
function checkGenerated(level, sol, clues, label, { validate = true } = {}) {
  assert.ok(clues, `${label} : null`);
  const lv = { ...level, people: level.people.map(p => ({ ...p, clues: clues[p.id] })) };
  const victim = lv.people.find(p => p.victim);
  assert.deepEqual(clues[victim.id], [], `${label} : la victime n'a pas d'indice`);
  for (const p of lv.people) {
    if (p.victim) continue;
    const { rows, cols } = dims(level);
    const maxClues = rows === cols ? 2 : 3; // un 3e indice n'est permis que sur un plan rectangulaire
    assert.ok(clues[p.id].length >= 1 && clues[p.id].length <= maxClues, `${label} : ${p.id} a ${clues[p.id].length} indices`);
    for (const c of clues[p.id]) {
      assert.equal(checkClue(lv, sol, p, c), true, `${label} : indice faux ${JSON.stringify(c)}`);
      if (c.t === 'with' || c.t === 'besidePerson') assert.notEqual(c.who, victim.id, `${label} : indice visant la victime`);
    }
  }
  const s = solve(lv, { max: 2 });
  assert.equal(s.length, 1, `${label} : ${s.length} solutions`);
  assert.deepEqual(s[0], sol, `${label} : autre solution`);
  if (validate) assert.equal(validateLevel(lv).errors.length, 0, `${label} : ${validateLevel(lv).errors}`);
  return lv;
}
test('generateClues : solution unique, déterministe, sur les niveaux d’exemple (mêmes indices qu’avant l’extension)', () => {
  let acc = '';
  for (const lvl of LEVELS) for (const difficulty of [1, 2, 3]) for (const seed of [1, 2, 3, 'abc']) {
    const sol = Object.fromEntries(lvl.people.map(p => [p.id, lvl.solution[p.id]]));
    const a = generateClues(lvl, sol, { difficulty, seed });
    checkGenerated(lvl, sol, a, `${lvl.id} d${difficulty} s${seed}`);
    assert.deepEqual(generateClues(lvl, sol, { difficulty, seed }), a, 'déterministe');
    if (REF_LEVELS[lvl.id]) acc += JSON.stringify(a);
  }
  // empreinte des indices générés par le moteur d'avant les plans rectangulaires (21 niveaux carrés)
  if (Object.keys(REF_LEVELS).every(id => LEVELS.some(l => l.id === id))) assert.equal(fnv(acc), REF_GEN);
});
test('generateClues : grilles aléatoires 6×6 à 8×8, trois difficultés', () => {
  const stats = { 1: {}, 2: {}, 3: {} };
  let n = 0;
  for (const N of [6, 7, 8]) for (const difficulty of [1, 2, 3]) for (const seed of [1, 2]) {
    const { level, sol } = randomLevel(N, N * 1000 + seed * 17 + difficulty);
    const clues = generateClues(level, sol, { difficulty, seed });
    if (!clues) continue; // « null si impossible » est permis, mais doit rester rare
    checkGenerated(level, sol, clues, `${N}×${N} d${difficulty} s${seed}`);
    n++;
    for (const c of Object.values(clues).flat()) {
      const k = c.t === 'dir' ? 'dir' : c.t;
      stats[difficulty][k] = (stats[difficulty][k] || 0) + 1;
      if (c.not) stats[difficulty].not = (stats[difficulty].not || 0) + 1;
    }
  }
  assert.ok(n >= 16, `seulement ${n}/18 générations réussies`);
  const share = (d, keys) => keys.reduce((s, k) => s + (stats[d][k] || 0), 0) / Object.entries(stats[d]).filter(([k]) => k !== 'not').reduce((s, [, v]) => s + v, 0);
  // Difficulté 1 : surtout pièce / objet / à côté ; difficulté 3 : davantage de directions et de lignes/colonnes.
  assert.ok(share(1, ['room', 'on', 'beside']) > share(3, ['room', 'on', 'beside']), JSON.stringify(stats));
  assert.ok(share(3, ['dir', 'sameRow', 'sameCol']) > share(1, ['dir', 'sameRow', 'sameCol']), JSON.stringify(stats));
});
test('generateClues : null si la solution est invalide', () => {
  const lvl = LEVELS[0];
  assert.equal(generateClues(lvl, { A: [0, 1] }), null, 'incomplète');
  const bad = { ...Object.fromEntries(lvl.people.map(p => [p.id, lvl.solution[p.id]])) };
  bad.A = [1, 3]; bad.B = [0, 4]; // A sur la table (bloquée), ligne/colonnes cassées
  assert.equal(generateClues(lvl, bad), null);
});

console.log('Validation');
test('validateLevel : niveaux d’exemple sans erreur', () => {
  for (const lv of LEVELS) assert.deepEqual(validateLevel(lv).errors, [], lv.id);
});
test('validateLevel : erreurs structurelles lisibles', () => {
  const raw = base();
  raw.roomMap = ['aabbb', 'aabbb', 'aaccc', 'aaccx', 'aacc'];
  raw.objects.push({ type: 'dragon', r: 0, c: 0 }, { type: 'tree', r: 4, c: 4, w: 2 }, { type: 'rock', r: 0, c: 1 });
  raw.people[1].id = 'A';
  raw.people[4].victim = false;
  raw.people[0].clues = [{ t: 'room', room: 'q' }, { t: 'on', obj: 'tree' }, { t: 'dir', dir: 'X', of: {} }, { t: 'with', who: 'Z' }, { t: 'fly' }];
  const { errors } = validateLevel(raw);
  const all = errors.join('\n');
  for (const frag of ['pièce inconnue « x »', 'ligne 5', 'type inconnu', 'sort de la grille', 'chevauche', 'en double', 'exactement une victime',
    'pièce inconnue « q »', 'occupable', 'direction invalide', 'cible (of)', 'personne inconnue « Z »', "type d'indice inconnu"]) {
    assert.ok(all.includes(frag), `manque « ${frag} » dans :\n${all}`);
  }
  assert.ok(validateLevel({ size: 12 }).errors.length > 0);
  assert.ok(validateLevel(null).errors.length > 0);
});

/* ================================================================== */
/* Extension : plans rectangulaires, nouveaux objets et sols           */
/* ================================================================== */

// Plan 4×6 de référence (4 lignes, 6 colonnes, 4 personnes).
//   a a a b b b     a : Cabine, b : Pont, c : Cale
//   a a a b b b
//   c c c c b b
//   c c c c b b
function rect(extra = {}) {
  return {
    id: 'rect', title: 'Rect', difficulty: 1, rows: 4, cols: 6,
    rooms: [
      { key: 'a', name: 'Cabine', floor: 'wood' },
      { key: 'b', name: 'Pont', floor: 'deck' },
      { key: 'c', name: 'Cale', floor: 'metal' },
    ],
    roomMap: ['aaabbb', 'aaabbb', 'ccccbb', 'ccccbb'],
    objects: [
      { type: 'seat', r: 0, c: 0 },                 // a
      { type: 'bunk', r: 1, c: 1, w: 2, h: 1 },     // a : (1,1)-(1,2)
      { type: 'ladder', r: 0, c: 4 },               // b
      { type: 'helm', r: 3, c: 5 },                 // b
      { type: 'anchor', r: 2, c: 0 },               // c
      { type: 'seat', r: 3, c: 3 },                 // c
    ],
    people: [
      { id: 'A', name: 'Anna', gender: 'f', clues: [] },
      { id: 'B', name: 'Basile', gender: 'm', clues: [] },
      { id: 'C', name: 'Clara', gender: 'f', clues: [] },
      { id: 'V', name: 'Victor', gender: 'm', victim: true, clues: [] },
    ],
    ...extra,
  };
}
// Transposée : 6 lignes × 4 colonnes.
function transpose(raw) {
  const H = raw.rows, W = raw.cols;
  const map = Array.from({ length: W }, (_, c) => Array.from({ length: H }, (_, r) => raw.roomMap[r][c]).join(''));
  const tr = { N: 'W', W: 'N', S: 'E', E: 'S' };
  const tClue = cl => (cl.t === 'dir' ? { ...cl, dir: tr[cl.dir] } : cl.t === 'sameRow' ? { ...cl, t: 'sameCol' } : cl.t === 'sameCol' ? { ...cl, t: 'sameRow' } : cl);
  return {
    ...raw, rows: W, cols: H, roomMap: map,
    objects: raw.objects.map(o => ({ ...o, r: o.c, c: o.r, w: o.h || 1, h: o.w || 1 })),
    people: raw.people.map(p => ({ ...p, clues: (p.clues || []).map(tClue) })),
  };
}
const R = prepare(rect());
const RP = id => R.people.find(p => p.id === id);
const rchk = (pl, id, clue) => checkClue(R, pl, RP(id), clue);

console.log('Plans rectangulaires');
test('prepare / dims : rows, cols, count ; size seulement pour un carré', () => {
  const raw = rect();
  const snapshot = JSON.stringify(raw);
  assert.deepEqual(dims(raw), { rows: 4, cols: 6, count: 4 });
  assert.deepEqual(dims(R), { rows: 4, cols: 6, count: 4 });
  assert.deepEqual(dims(transpose(raw)), { rows: 6, cols: 4, count: 4 });
  assert.deepEqual(dims(base()), { rows: 5, cols: 5, count: 5 });
  assert.deepEqual(dims(L), { rows: 5, cols: 5, count: 5 });
  assert.deepEqual(dims({}), { rows: 0, cols: 0, count: 0 });
  assert.equal(JSON.stringify(raw), snapshot, 'le niveau brut n’est pas modifié');
  assert.equal(R.rows, 4); assert.equal(R.cols, 6); assert.equal(R.count, 4);
  assert.equal(R.size, undefined, 'pas de size pour un rectangle');
  assert.equal(L.size, 5); assert.equal(L.rows, 5); assert.equal(L.cols, 5); assert.equal(L.count, 5);
  assert.equal(prepare({ ...rect(), rows: 5, cols: 5, roomMap: ['aaaaa', 'aaaaa', 'aaaaa', 'aaaaa', 'aaaaa'] }).size, 5, 'rows = cols : carré');
  assert.equal(R.cells.length, 4);
  assert.ok(R.cells.every(row => row.length === 6));
  assert.deepEqual(R.cells[1][2], { room: 'a', objIndex: 1, objType: 'bunk', blocked: false });
  assert.deepEqual(R.cells[3][5], { room: 'b', objIndex: 3, objType: 'helm', blocked: true });
  assert.deepEqual(R.cells[2][4], { room: 'b', objIndex: null, objType: null, blocked: false });
  assert.equal(canPlace(R, 0, 5), true);
  assert.equal(canPlace(R, 3, 5), false, 'gouvernail');
  assert.equal(canPlace(R, 4, 0), false, 'hors grille (ligne 4)');
  assert.equal(canPlace(R, 0, 6), false, 'hors grille (colonne 6)');
  const T = prepare(transpose(rect()));
  assert.equal(T.cells.length, 6); assert.ok(T.cells.every(row => row.length === 4));
  assert.equal(canPlace(T, 5, 3), false); assert.equal(canPlace(T, 5, 0), true); assert.equal(canPlace(T, 0, 4), false);
  assert.ok(OBJECT_SIZES && OBJECT_SIZES.billiard && OBJECT_SIZES.sofa);
});
test('indices sur un rectangle : room, on, beside, besidePerson, with, alone', () => {
  assert.equal(rchk({ A: [0, 5] }, 'A', { t: 'room', room: 'b' }), true);
  assert.equal(rchk({ A: [3, 4] }, 'A', { t: 'room', room: 'c', not: true }), true);
  assert.equal(rchk({ A: [1, 2] }, 'A', { t: 'on', obj: 'bunk' }), true);
  assert.equal(rchk({ A: [3, 3] }, 'A', { t: 'on', obj: 'seat' }), true);
  assert.equal(rchk({ A: [1, 0] }, 'A', { t: 'on', obj: 'bunk' }), false);
  assert.equal(rchk({ A: [0, 5] }, 'A', { t: 'beside', obj: 'ladder' }), true, 'colonne 5');
  assert.equal(rchk({ A: [1, 4] }, 'A', { t: 'beside', obj: 'ladder' }), true);
  assert.equal(rchk({ A: [0, 2] }, 'A', { t: 'beside', obj: 'ladder' }), false);
  assert.equal(rchk({ A: [2, 5] }, 'A', { t: 'beside', obj: 'helm' }), true);
  assert.equal(rchk({ A: [3, 4] }, 'A', { t: 'beside', obj: 'helm' }), true);
  assert.equal(rchk({ A: [3, 2] }, 'A', { t: 'beside', obj: 'seat' }), true);
  assert.equal(rchk({ A: [2, 4] }, 'A', { t: 'beside', obj: 'seat' }), false, 'pièce différente');
  assert.equal(rchk({ A: [2, 4], B: [2, 5] }, 'A', { t: 'besidePerson', who: 'B' }), true);
  assert.equal(rchk({ A: [2, 3], B: [2, 4] }, 'A', { t: 'besidePerson', who: 'B' }), false, 'mur');
  assert.equal(rchk({ A: [0, 5], B: [3, 4] }, 'A', { t: 'with', who: 'B' }), true);
  assert.equal(rchk({ A: [0, 5], B: [3, 3] }, 'A', { t: 'with', who: 'B', not: true }), true);
  const full = { A: [0, 5], B: [1, 0], C: [2, 1], V: [3, 2] };
  assert.equal(rchk(full, 'A', { t: 'alone' }), true);
  assert.equal(rchk(full, 'C', { t: 'alone' }), false);
  assert.equal(rchk({ A: [0, 5], B: [1, 0] }, 'A', { t: 'alone' }), null);
});
test('indices sur un rectangle : dir (personne, objet, quelqu’un sur), sameRow / sameCol', () => {
  const pl = { A: [0, 5], B: [3, 1] };
  assert.equal(rchk(pl, 'A', { t: 'dir', dir: 'N', of: { who: 'B' } }), true);
  assert.equal(rchk(pl, 'A', { t: 'dir', dir: 'E', of: { who: 'B' }, exact: 4 }), true, 'écart de 4 colonnes');
  assert.equal(rchk(pl, 'B', { t: 'dir', dir: 'S', of: { who: 'A' }, exact: 3 }), true);
  assert.equal(rchk(pl, 'B', { t: 'dir', dir: 'W', of: { who: 'A' }, exact: 3 }), false);
  assert.equal(rchk({ A: [0, 5] }, 'A', { t: 'dir', dir: 'N', of: { obj: 'helm' }, exact: 3 }), true);
  assert.equal(rchk({ A: [0, 5] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'bunk' }, exact: 3 }), true, 'boîte (1,1)-(1,2)');
  assert.equal(rchk({ A: [0, 2] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'bunk' } }), false);
  assert.equal(rchk({ A: [1, 5] }, 'A', { t: 'dir', dir: 'E', of: { obj: 'seat' } }), true, 'l’un des sièges');
  const on = { A: [0, 5], B: [3, 3], C: [1, 0], V: [2, 1] };
  assert.equal(rchk(on, 'A', { t: 'dir', dir: 'E', of: { on: 'seat' }, exact: 2 }), true);
  assert.equal(rchk(on, 'A', { t: 'dir', dir: 'N', of: { on: 'seat' } }), true);
  assert.equal(rchk(on, 'C', { t: 'dir', dir: 'W', of: { on: 'seat' } }), true);
  assert.equal(rchk(on, 'B', { t: 'dir', dir: 'S', of: { on: 'seat' } }), false, 'soi-même ne compte pas');
  assert.equal(rchk({ A: [0, 1] }, 'A', { t: 'sameRow', obj: 'ladder' }), true);
  assert.equal(rchk({ A: [1, 5] }, 'A', { t: 'sameRow', obj: 'ladder' }), false);
  assert.equal(rchk({ A: [0, 5] }, 'A', { t: 'sameCol', obj: 'helm' }), true, 'colonne 5');
  assert.equal(rchk({ A: [2, 4] }, 'A', { t: 'sameCol', obj: 'ladder' }), true);
  assert.equal(rchk({ A: [2, 3] }, 'A', { t: 'sameCol', obj: 'seat' }), true);
  assert.equal(rchk({ A: [2, 5] }, 'A', { t: 'sameCol', obj: 'seat', not: true }), true);
  // la même chose sur la transposée (6×4)
  const T = prepare(transpose(rect()));
  const tc = (plc, id, clue) => checkClue(T, Object.fromEntries(Object.entries(plc).map(([k, [r, c]]) => [k, [c, r]])), T.people.find(p => p.id === id), transpose({ ...rect(), people: [{ clues: [clue] }] }).people[0].clues[0]);
  assert.equal(tc(pl, 'A', { t: 'dir', dir: 'E', of: { who: 'B' }, exact: 4 }), true);
  assert.equal(tc({ A: [0, 5] }, 'A', { t: 'sameCol', obj: 'helm' }), true);
  assert.equal(tc({ A: [0, 5] }, 'A', { t: 'beside', obj: 'ladder' }), true);
  assert.equal(tc(on, 'A', { t: 'dir', dir: 'E', of: { on: 'seat' }, exact: 2 }), true);
});
test('evaluate sur un rectangle : au plus une personne par ligne et par colonne, complet à count personnes', () => {
  const good = { A: [0, 0], B: [1, 3], C: [2, 1], V: [3, 4] }; // colonnes 2 et 5 vides ; B et V sur le Pont
  let ev = evaluate(R, good);
  assert.equal(ev.complete, true);
  assert.equal(ev.lines.ok, true);
  assert.equal(ev.victimOk, true);
  assert.equal(ev.murderer, 'B');
  assert.equal(ev.ok, true);
  assert.equal(murdererOf(R, good), 'B');
  ev = evaluate(R, { A: [0, 0], B: [1, 3], C: [2, 1] });
  assert.equal(ev.complete, false, '3 personnes sur 4');
  assert.equal(ev.ok, false);
  ev = evaluate(R, { A: [0, 5], B: [3, 5] });
  assert.deepEqual(ev.lines.cols, [5]); assert.deepEqual(ev.lines.rows, []); assert.equal(ev.lines.ok, false);
  ev = evaluate(R, { A: [2, 0], B: [2, 4] });
  assert.deepEqual(ev.lines.rows, [2]);
  ev = evaluate(R, { A: [0, 0], B: [1, 3], C: [2, 1], V: [3, 5] }); // V sur le gouvernail
  assert.deepEqual(ev.blocked, ['V']); assert.equal(ev.ok, false);
  const T = prepare(transpose(rect()));
  ev = evaluate(T, { A: [0, 0], B: [3, 1], C: [1, 2], V: [4, 3] });
  assert.equal(ev.complete && ev.lines.ok && ev.victimOk && ev.ok, true);
  assert.equal(ev.murderer, 'B');
  // victime : la règle reste « seule avec le meurtrier »
  ev = evaluate(R, { A: [0, 4], B: [1, 3], C: [2, 1], V: [3, 4] });
  assert.equal(ev.victimOk, false);
});
test('validateLevel : rectangles valides, dimensions, personnes, roomMap', () => {
  assert.deepEqual(validateLevel(rect()).errors, []);
  assert.deepEqual(validateLevel(transpose(rect())).errors, []);
  const errs = raw => validateLevel(raw).errors.join('\n');
  assert.match(errs({ ...rect(), rows: 3 }), /lignes \(rows\).*entre 4 et 12/);
  assert.match(errs({ ...rect(), rows: 13 }), /lignes \(rows\).*entre 4 et 12/);
  assert.match(errs({ ...rect(), cols: 10 }), /colonnes \(cols\).*entre 4 et 9/);
  assert.match(errs({ ...rect(), cols: 3 }), /colonnes \(cols\).*entre 4 et 9/);
  assert.match(errs({ ...rect(), cols: undefined }), /colonnes \(cols\)/);
  assert.match(errs({ ...rect(), rows: 4.5 }), /lignes \(rows\)/);
  assert.match(errs({ ...rect(), size: 6 }), /size|rows/, 'size et rows/cols contradictoires');
  assert.match(errs({ ...rect(), people: rect().people.concat({ id: 'E', name: 'Eva', gender: 'f', clues: [] }) }), /exactement 4 personnes \(actuellement 5\)/);
  assert.match(errs({ ...rect(), people: rect().people.slice(1) }), /exactement 4 personnes/);
  assert.match(errs({ ...rect(), roomMap: ['aaabbb', 'aaabbb', 'ccccbb'] }), /roomMap\) doit contenir 4 lignes/);
  assert.match(errs({ ...rect(), roomMap: ['aaabbb', 'aaabb', 'ccccbb', 'ccccbb'] }), /ligne 2 : 6 caractères attendus/);
  assert.match(errs({ ...rect(), roomMap: ['aaabbbb', 'aaabbbb', 'ccccbbb', 'ccccbbb'] }), /6 caractères attendus/);
  assert.match(errs({ ...rect(), objects: [{ type: 'seat', r: 0, c: 6 }] }), /sort de la grille/);
  assert.match(errs({ ...rect(), objects: [{ type: 'seat', r: 4, c: 0 }] }), /sort de la grille/);
  assert.match(errs({ ...rect(), objects: [{ type: 'billiard', r: 3, c: 4, w: 1, h: 2 }] }), /sort de la grille/);
  assert.deepEqual(validateLevel({ ...rect(), objects: [{ type: 'billiard', r: 2, c: 4, w: 1, h: 2 }] }).errors, []);
  assert.ok(validateLevel({ ...rect(), objects: [{ type: 'billiard', r: 2, c: 4 }] }).warnings.some(w => w.includes('inhabituelle')));
  assert.match(errs({ ...rect(), solution: { A: [0, 6] } }), /position invalide/);
  assert.deepEqual(validateLevel({ ...rect(), solution: { A: [0, 5], B: [1, 0], C: [2, 1], V: [3, 2] } }).errors, []);
  // écart exact borné par la dimension concernée
  const withClue = cl => ({ ...rect(), people: rect().people.map(p => (p.id === 'A' ? { ...p, clues: [cl] } : p)) });
  assert.deepEqual(validateLevel(withClue({ t: 'dir', dir: 'E', of: { who: 'B' }, exact: 5 })).errors, []);
  assert.match(errs(withClue({ t: 'dir', dir: 'S', of: { who: 'B' }, exact: 4 })), /écart exact invalide/);
  assert.match(errs(withClue({ t: 'dir', dir: 'W', of: { who: 'B' }, exact: 6 })), /écart exact invalide/);
  // plus grand rectangle permis : 12 × 9, 9 personnes
  const big = { id: 'grand', title: 'Grand', difficulty: 2, rows: 12, cols: 9, rooms: [{ key: 'a', name: 'Pont', floor: 'deck' }],
    roomMap: Array(12).fill('aaaaaaaaa'), objects: [], people: 'ABCDEFGHI'.split('').map((id, i) => ({ id, name: `${id}ui`, gender: 'm', victim: i === 0, clues: [] })) };
  assert.deepEqual(validateLevel(big).errors, []);
  assert.ok(validateLevel({ size: 4 }).errors.length > 0, 'size reste entre 5 et 9');
});

// Force brute sur un rectangle : toutes les affectations injectives personne → ligne et personne → colonne.
function bruteRect(level) {
  const lv = prepare(level);
  const { rows: H, cols: W } = dims(lv);
  const ids = lv.people.map(p => p.id), k = ids.length;
  const arr = (n) => { const out = []; const rec = (a, used) => { if (a.length === k) { out.push(a.slice()); return; } for (let i = 0; i < n; i++) if (!used[i]) { used[i] = 1; a.push(i); rec(a, used); a.pop(); used[i] = 0; } }; rec([], []); return out; };
  const rs = arr(H), cs = arr(W);
  const vi = lv.people.findIndex(p => p.victim);
  let count = 0;
  for (const rows of rs) for (const cols of cs) {
    let bad = false;
    for (let x = 0; x < k && !bad; x++) if (lv.cells[rows[x]][cols[x]].blocked) bad = true;
    if (bad) continue;
    const vr = lv.cells[rows[vi]][cols[vi]].room;
    let cnt = 0;
    for (let x = 0; x < k; x++) if (lv.cells[rows[x]][cols[x]].room === vr) cnt++;
    if (cnt !== 2) continue;
    const pl = {};
    ids.forEach((id, x) => { pl[id] = [rows[x], cols[x]]; });
    if (evaluate(lv, pl).ok) count++;
  }
  return count;
}
// Plan rectangulaire aléatoire (pièces par croissance, objets anciens et nouveaux) et une solution admissible.
function randomRect(H, W, seed, density = 0.2) {
  const Rn = lcg(seed);
  for (;;) {
    const K = 3 + Math.floor(Rn() * 3);
    const map = Array.from({ length: H }, () => Array(W).fill(null));
    const fr = [];
    for (let k = 0; k < K; k++) { let r, c; do { r = Math.floor(Rn() * H); c = Math.floor(Rn() * W); } while (map[r][c]); map[r][c] = 'abcdef'[k]; fr.push([r, c]); }
    let left = H * W - K;
    while (left > 0) {
      const [r, c] = fr[Math.floor(Rn() * fr.length)];
      const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Rn() * 4)];
      const rr = r + d[0], cc = c + d[1];
      if (rr < 0 || cc < 0 || rr >= H || cc >= W || map[rr][cc]) continue;
      map[rr][cc] = map[r][c]; fr.push([rr, cc]); left--;
    }
    const types = Object.keys(OBJECTS), objects = [], used = new Set();
    for (let i = 0; i < Math.floor(H * W * density); i++) {
      const r = Math.floor(Rn() * H), c = Math.floor(Rn() * W);
      if (used.has(r * W + c)) continue;
      used.add(r * W + c); objects.push({ type: types[Math.floor(Rn() * types.length)], r, c });
    }
    const n = Math.min(H, W);
    const names = ['Anna', 'Basile', 'Clara', 'David', 'Elsa', 'Firmin', 'Gaëlle', 'Henri', 'Iris'].slice(0, n);
    const people = names.map((name, i) => ({ id: name[0], name, gender: i % 2 ? 'm' : 'f', victim: i === 0, clues: [] }));
    const level = { id: 'rnd', title: 'Aléatoire', difficulty: 1, rows: H, cols: W, rooms: 'abcdef'.slice(0, K).split('').map(k => ({ key: k, name: `Salle ${k}`, floor: 'wood' })), roomMap: map.map(r => r.join('')), objects, people };
    const lv = prepare(level);
    for (let t = 0; t < 300; t++) {
      const big = Math.max(H, W);
      const perm = [...Array(big).keys()];
      for (let i = big - 1; i > 0; i--) { const j = Math.floor(Rn() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
      const at = i => (H <= W ? [i, perm[i]] : [perm[i], i]);
      if (people.some((p, i) => !canPlace(lv, ...at(i)))) continue;
      const sol = {};
      people.forEach((p, i) => { sol[p.id] = at(i); });
      const room = id => lv.cells[sol[id][0]][sol[id][1]].room;
      if (people.filter(p => room(p.id) === room('A')).length !== 2) continue;
      return { level, sol };
    }
  }
}
test('solve sur des rectangles = force brute (4×6, 6×4, 5×7, 7×5)', () => {
  let checked = 0, nonTrivial = 0;
  for (const [H, W, sets] of [[4, 6, 6], [6, 4, 6], [5, 7, 3], [7, 5, 3]]) {
    const rnd = lcg(H * 100 + W);
    for (let k = 0; k < sets; k++) {
      const { level } = randomRect(H, W, H * 977 + W * 13 + k, 0.15);
      const types = [...new Set(level.objects.map(o => o.type))];
      const occ = types.filter(t => OBJECTS[t].occ);
      const ids = level.people.map(p => p.id);
      const pick = a => a[Math.floor(rnd() * a.length)];
      for (const p of level.people) {
        if (p.victim) continue;
        const nb = Math.floor(rnd() * 3);
        for (let j = 0; j < nb; j++) {
          const who = pick(ids.filter(id => id !== p.id));
          const kind = Math.floor(rnd() * 11);
          const c = [
            () => ({ t: 'room', room: pick(level.rooms).key }),
            () => ({ t: 'beside', obj: pick(types) }),
            () => ({ t: 'sameRow', obj: pick(types) }),
            () => ({ t: 'sameCol', obj: pick(types) }),
            () => ({ t: 'with', who }),
            () => ({ t: 'besidePerson', who }),
            () => ({ t: 'alone' }),
            () => ({ t: 'dir', dir: pick(['N', 'S', 'E', 'W']), of: { who } }),
            () => ({ t: 'dir', dir: pick(['N', 'S', 'E', 'W']), of: { obj: pick(types) }, exact: 1 + Math.floor(rnd() * 3) }),
            () => (occ.length ? { t: 'on', obj: pick(occ) } : { t: 'alone' }),
            () => (occ.length ? { t: 'dir', dir: pick(['N', 'S', 'E', 'W']), of: { on: pick(occ) } } : { t: 'alone', not: true }),
          ][kind]();
          if (rnd() < 0.3) c.not = true;
          p.clues.push(c);
        }
      }
      const expected = bruteRect(level);
      const got = solve(level, { max: 1e6 });
      assert.equal(got.length, expected, `${H}×${W} n°${k} : ${JSON.stringify(level.people.map(p => p.clues))}`);
      assert.equal(new Set(got.map(s => JSON.stringify(s))).size, got.length, 'solutions distinctes');
      for (const s of got.slice(0, 20)) assert.equal(evaluate(level, s).ok, true);
      assert.equal(solve(level, { max: 2 }).length, Math.min(2, expected));
      if (expected > 0 && expected < 1000) nonTrivial++;
      checked++;
    }
  }
  assert.equal(checked, 18);
  assert.ok(nonTrivial >= 6, `trop peu de cas non triviaux (${nonTrivial})`);
});
test('generateClues : solution unique sur des rectangles 4×9, 6×9, 9×6, 5×12 (trois difficultés)', () => {
  let ok = 0, total = 0, three = 0;
  for (const [H, W] of [[4, 9], [6, 9], [9, 6], [5, 12]]) for (const difficulty of [1, 2, 3]) for (const seed of [1, 2]) {
    const { level, sol } = randomRect(H, W, H * 1000 + W * 31 + seed * 17 + difficulty);
    const clues = generateClues(level, sol, { difficulty, seed });
    total++;
    if (!clues) continue; // « null si impossible » est permis, mais doit rester rare
    // 5×12 dépasse la limite de 9 colonnes de validateLevel, mais le moteur doit le résoudre
    const lv = checkGenerated(level, sol, clues, `${H}×${W} d${difficulty} s${seed}`, { validate: W <= 9 });
    if (W > 9) assert.ok(validateLevel(lv).errors.some(e => e.includes('colonnes (cols)')));
    assert.deepEqual(generateClues(level, sol, { difficulty, seed }), clues, 'déterministe');
    three += lv.people.filter(p => p.clues.length === 3).length;
    ok++;
  }
  assert.ok(ok >= total - 2, `seulement ${ok}/${total} générations réussies`);
  // le 12×9 (plus grand plan permis) aussi
  const { level, sol } = randomRect(12, 9, 4242);
  checkGenerated(level, sol, generateClues(level, sol, { difficulty: 2, seed: 1 }), '12×9');
  // carré : jamais plus de 2 indices (vérifié par checkGenerated) ; rectangle : 3 seulement si nécessaire
  assert.ok(three <= ok * 3, `${three} suspects à 3 indices`);
});
test('generateClues : null si la solution d’un rectangle est invalide', () => {
  assert.equal(generateClues(rect(), { A: [0, 5], B: [1, 0], C: [2, 1] }), null, 'incomplète');
  assert.equal(generateClues(rect(), { A: [0, 5], B: [1, 5], C: [2, 1], V: [3, 2] }), null, 'même colonne');
  assert.equal(generateClues(rect(), { A: [0, 5], B: [1, 0], C: [2, 1], V: [3, 5] }), null, 'sur le gouvernail');
});

console.log('Nouveaux objets et sols');
const NEW_A = ['seat', 'bunk', 'stretcher', 'bike', 'tractor', 'sled', 'suitcase', 'trolley', 'helm', 'buoy', 'anchor', 'console',
  'locker', 'ladder', 'robot', 'antenna', 'fridge', 'sink', 'vending'];
const NEW_B = ['throne', 'swing', 'towel', 'parasol', 'horse', 'cushion', 'cactus', 'campfire', 'palm', 'chest', 'cannon', 'pillar',
  'cauldron', 'blackboard', 'globe', 'tv', 'snowman', 'hay', 'billiard'];
const NEW = [...NEW_A, ...NEW_B];
// défini (objet unique), indéfini, forme « à côté de … »
const DEF = {
  seat: 'du siège', bunk: 'de la couchette', stretcher: 'du brancard', bike: 'du vélo', tractor: 'du tracteur', sled: 'de la luge',
  suitcase: 'de la valise', trolley: 'du chariot', helm: 'du gouvernail', buoy: 'de la bouée', anchor: "de l'ancre", console: 'du pupitre',
  locker: 'du casier', ladder: "de l'échelle", robot: 'du robot', antenna: "de l'antenne", fridge: 'du frigo', sink: 'du lavabo',
  vending: 'du distributeur', throne: 'du trône', swing: 'de la balançoire', towel: 'de la serviette', parasol: 'du parasol',
  horse: 'du cheval', cushion: 'du coussin', cactus: 'du cactus', campfire: 'du feu de camp', palm: 'du palmier', chest: 'du coffre',
  cannon: 'du canon', pillar: 'du pilier', cauldron: 'du chaudron', blackboard: 'du tableau', globe: 'du globe', tv: 'de la télévision',
  snowman: 'du bonhomme de neige', hay: 'de la botte de foin', billiard: 'du billard',
};
const PLURAL = {
  seat: 'sièges', bunk: 'couchettes', stretcher: 'brancards', bike: 'vélos', tractor: 'tracteurs', sled: 'luges', suitcase: 'valises',
  trolley: 'chariots', helm: 'gouvernails', buoy: 'bouées', anchor: 'ancres', console: 'pupitres', locker: 'casiers', ladder: 'échelles',
  robot: 'robots', antenna: 'antennes', fridge: 'frigos', sink: 'lavabos', vending: 'distributeurs', throne: 'trônes', swing: 'balançoires',
  towel: 'serviettes', parasol: 'parasols', horse: 'chevaux', cushion: 'coussins', cactus: 'cactus', campfire: 'feux de camp',
  palm: 'palmiers', chest: 'coffres', cannon: 'canons', pillar: 'piliers', cauldron: 'chaudrons', blackboard: 'tableaux', globe: 'globes',
  tv: 'télévisions', snowman: 'bonshommes de neige', hay: 'bottes de foin', billiard: 'billards',
};
// « Elle était … » / « Il était … » sur l'objet (occupables), objet unique
const ON = {
  seat: ['assise sur le siège', 'assis sur le siège'], bunk: ['allongée sur la couchette', 'allongé sur la couchette'],
  stretcher: ['allongée sur le brancard', 'allongé sur le brancard'], bike: ['sur le vélo', 'sur le vélo'],
  tractor: ['sur le tracteur', 'sur le tracteur'], sled: ['sur la luge', 'sur la luge'],
  throne: ['assise sur le trône', 'assis sur le trône'], swing: ['assise sur la balançoire', 'assis sur la balançoire'],
  towel: ['allongée sur la serviette', 'allongé sur la serviette'], parasol: ['sous le parasol', 'sous le parasol'],
  horse: ['sur le cheval', 'sur le cheval'], cushion: ['assise sur le coussin', 'assis sur le coussin'],
};
function catalogLevel(times) {
  const objects = [];
  let k = 0;
  for (let t = 0; t < times; t++) for (const type of NEW) { objects.push({ type, r: Math.floor(k / 9), c: k % 9 }); k++; }
  return prepare({ id: 'cat', title: 'Catalogue', rows: 12, cols: 9, rooms: [{ key: 'a', name: 'Hall', floor: 'tile' }],
    roomMap: Array(12).fill('aaaaaaaaa'), objects, people: base().people });
}
test('catalogue : 38 nouveaux objets, genres, pluriels, occupables, tailles, sols', () => {
  assert.equal(NEW.length, 38);
  for (const id of NEW) {
    const o = OBJECTS[id];
    assert.ok(o, id);
    assert.ok(['m', 'f'].includes(o.g) && o.n && o.pl, id);
    assert.equal(o.pl, PLURAL[id], `pluriel de ${id}`);
    assert.equal(o.occ, id in ON, `${id} occupable ?`);
    if (o.occ) assert.ok(o.on, `${id} sans locution`);
  }
  assert.equal(OBJECTS.horse.n, 'cheval'); assert.equal(OBJECTS.snowman.n, 'bonhomme de neige');
  assert.equal(OBJECTS.campfire.n, 'feu de camp'); assert.equal(OBJECTS.hay.n, 'botte de foin'); assert.equal(OBJECTS.hay.g, 'f');
  assert.equal(OBJECTS.tv.n, 'télévision'); assert.equal(OBJECTS.tv.g, 'f'); assert.equal(OBJECTS.blackboard.n, 'tableau');
  assert.equal(OBJECTS.seat.on, 'assis sur'); assert.equal(OBJECTS.bunk.on, 'allongé sur'); assert.equal(OBJECTS.parasol.on, 'sous');
  // tailles autorisées (orientation explicite) ; absent = 1×1 seul
  const sz = t => (OBJECT_SIZES[t] || [[1, 1]]).map(([w, h]) => `${w}x${h}`).sort().join(' ');
  for (const t of ['bunk', 'stretcher', 'tractor', 'console', 'towel', 'blackboard']) assert.equal(sz(t), '1x1 1x2 2x1', t);
  assert.equal(sz('billiard'), '1x2 2x1');
  for (const t of ['seat', 'bike', 'sled', 'suitcase', 'horse', 'snowman', 'hay', 'cactus']) assert.equal(sz(t), '1x1', t);
  assert.equal(sz('sofa'), '1x2 2x1'); assert.equal(sz('chair'), '1x1');
  for (const [t, list] of Object.entries(OBJECT_SIZES)) {
    assert.ok(OBJECTS[t], t);
    for (const s of list) assert.ok(Array.isArray(s) && s.length === 2 && s.every(v => Number.isInteger(v) && v >= 1), t);
  }
  for (const f of ['metal', 'water', 'tatami', 'checker', 'dirt', 'ice', 'moon', 'brick', 'cobble']) assert.ok(FLOORS.includes(f), f);
  assert.equal(new Set(FLOORS).size, FLOORS.length);
  // un plan qui les utilise est valide (sols et objets connus, pas d'avertissement de sol)
  const raw = { ...rect(), rooms: rect().rooms.map((r, i) => ({ ...r, floor: ['water', 'moon', 'cobble'][i] })) };
  assert.deepEqual(validateLevel(raw).errors, []);
  assert.ok(!validateLevel(raw).warnings.some(w => w.includes('sol inconnu')));
});
test('textes des 38 nouveaux objets : défini / indéfini, élisions, contractions, accords', () => {
  const one = catalogLevel(1), two = catalogLevel(2);
  const Tx = (lv, id, clue) => strip(clueHTML(lv, lv.people.find(p => p.id === id), clue));
  for (const t of NEW) {
    const o = OBJECTS[t];
    const def = DEF[t];
    const indef = (o.g === 'f' ? "d'une " : "d'un ") + o.n;
    const bare = def.replace(/^du /, 'le ').replace(/^de la /, 'la ').replace(/^de l'/, "l'");
    const que = def.replace(/^du /, 'que le ').replace(/^de la /, 'que la ').replace(/^de l'/, "que l'");
    assert.equal(Tx(one, 'A', { t: 'beside', obj: t }), `Elle était à côté ${def}.`, t);
    assert.equal(Tx(one, 'B', { t: 'beside', obj: t, not: true }), `Il n'était pas à côté ${def}.`, t);
    assert.equal(Tx(two, 'A', { t: 'beside', obj: t }), `Elle était à côté ${indef}.`, t);
    assert.equal(Tx(one, 'B', { t: 'sameRow', obj: t }), `Il était sur la même ligne ${que}.`, t);
    assert.equal(Tx(two, 'B', { t: 'sameCol', obj: t }), `Il était dans la même colonne ${o.g === 'f' ? "qu'une" : "qu'un"} ${o.n}.`, t);
    assert.equal(Tx(one, 'B', { t: 'dir', dir: 'N', of: { obj: t } }), `Il était plus au nord ${que}.`, t);
    assert.equal(Tx(one, 'B', { t: 'dir', dir: 'E', of: { obj: t }, exact: 2 }), `Il était exactement 2 colonnes à l'est ${def}.`, t);
    assert.equal(Tx(two, 'A', { t: 'dir', dir: 'N', of: { obj: t }, not: true }), `${o.g === 'f' ? 'Aucune' : 'Aucun'} ${o.n} n'était plus au sud qu'elle.`, t);
    if (o.occ) {
      const [fem, masc] = ON[t];
      assert.equal(Tx(one, 'A', { t: 'on', obj: t }), `Elle était ${fem}.`, t);
      assert.equal(Tx(one, 'B', { t: 'on', obj: t }), `Il était ${masc}.`, t);
      assert.equal(Tx(one, 'A', { t: 'on', obj: t, not: true }), `Elle n'était pas ${fem}.`, t);
      const prep = o.on.split(' ').pop();
      assert.equal(Tx(one, 'B', { t: 'dir', dir: 'W', of: { on: t } }), `Il était plus à l'ouest que quelqu'un se trouvant ${prep} ${bare}.`, t);
      assert.equal(Tx(two, 'B', { t: 'dir', dir: 'S', of: { on: t }, exact: 1 }), `Il était exactement 1 ligne au sud de quelqu'un se trouvant ${prep} ${o.g === 'f' ? 'une' : 'un'} ${o.n}.`, t);
    }
  }
  // quelques phrases complètes, en toutes lettres
  assert.equal(Tx(one, 'A', { t: 'beside', obj: 'ladder' }), "Elle était à côté de l'échelle.");
  assert.equal(Tx(one, 'A', { t: 'beside', obj: 'snowman' }), 'Elle était à côté du bonhomme de neige.');
  assert.equal(Tx(two, 'A', { t: 'beside', obj: 'hay' }), "Elle était à côté d'une botte de foin.");
  assert.equal(Tx(two, 'B', { t: 'beside', obj: 'anchor', not: true }), "Il n'était pas à côté d'une ancre.");
  assert.equal(Tx(one, 'A', { t: 'on', obj: 'seat' }), 'Elle était assise sur le siège.');
  assert.equal(Tx(one, 'A', { t: 'on', obj: 'bunk' }), 'Elle était allongée sur la couchette.');
  assert.equal(Tx(one, 'C', { t: 'on', obj: 'parasol' }), 'Elle était sous le parasol.');
  assert.equal(Tx(one, 'B', { t: 'on', obj: 'horse' }), 'Il était sur le cheval.');
  assert.equal(Tx(one, 'D', { t: 'on', obj: 'bike', not: true }), "Il n'était pas sur le vélo.");
  assert.equal(Tx(one, 'B', { t: 'dir', dir: 'E', of: { obj: 'antenna' }, exact: 1 }), "Il était exactement 1 colonne à l'est de l'antenne.");
  assert.equal(Tx(two, 'B', { t: 'dir', dir: 'W', of: { obj: 'campfire' }, exact: 2, not: true }), "Aucun feu de camp n'était exactement 2 colonnes à l'est de lui.");
  assert.equal(Tx(one, 'B', { t: 'dir', dir: 'S', of: { obj: 'tv' }, not: true }), "Il n'était pas plus au sud que la télévision.");
  assert.equal(clueHTML(one, one.people[0], { t: 'beside', obj: 'snowman' }), 'Elle était <b>à côté</b> du <b>bonhomme de neige</b>.');
  // pluriels irréguliers (utilisés par l'interface, ex. « les chevaux ») et contraction « des »
  assert.equal(`des ${OBJECTS.campfire.pl}`, 'des feux de camp');
  for (const [t, pl] of [['horse', 'chevaux'], ['blackboard', 'tableaux'], ['snowman', 'bonshommes de neige'], ['campfire', 'feux de camp'], ['hay', 'bottes de foin'], ['cactus', 'cactus']]) assert.equal(OBJECTS[t].pl, pl);
});

console.log('Non-régression des 21 niveaux carrés');
test('les 21 niveaux gardent leur solution unique et les mêmes phrases d’indices qu’avant l’extension', () => {
  for (const [id, hash] of Object.entries(REF_LEVELS)) {
    const raw = LEVELS.find(l => l.id === id);
    assert.ok(raw, `niveau « ${id} » absent de levels.js`);
    const lv = prepare(raw);
    const sols = solve(raw, { max: 3 });
    assert.equal(sols.length, 1, id);
    assert.equal(dims(raw).rows, raw.size); assert.equal(dims(raw).cols, raw.size);
    const phrases = lv.people.map(p => personCluesHTML(lv, p));
    assert.equal(fnv(JSON.stringify({ sol: sols, phrases })), hash, `${id} : solution ou phrases modifiées`);
  }
});

console.log(`\n${passed} réussi(s), ${failedCount} échoué(s).`);
process.exit(failedCount ? 1 : 0);
