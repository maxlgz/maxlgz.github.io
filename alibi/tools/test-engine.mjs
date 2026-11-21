#!/usr/bin/env node
// Tests du moteur d'Alibi : node alibi/tools/test-engine.mjs
import assert from 'node:assert/strict';
import {
  OBJECTS, FLOORS, CLUE_TYPES, prepare, canPlace, clueHTML, personCluesHTML, checkClue,
  evaluate, murdererOf, solve, generateClues, validateLevel,
} from '../js/engine.js';
import { LEVELS } from '../js/levels.js';

let passed = 0, failedCount = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failedCount++; console.log(`  ✗ ${name}\n    ${e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n    ') : e}`); }
}
const strip = html => html.replace(/<\/?b>/g, '');

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
test('OBJECTS contient les 34 types du contrat, complets', () => {
  const ids = ['tree', 'bush', 'rock', 'plant', 'shelf', 'table', 'desk', 'counter', 'wardrobe', 'barrel', 'crate',
    'statue', 'fountain', 'piano', 'stove', 'fireplace', 'lamp', 'telescope', 'aquarium', 'well',
    'chair', 'armchair', 'sofa', 'stool', 'bench', 'bed', 'deckchair', 'hammock', 'rug', 'bathtub', 'boat', 'car', 'tent', 'stage'];
  assert.equal(Object.keys(OBJECTS).length, 34);
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
  assert.equal(FLOORS.length, 12);
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
function checkGenerated(level, sol, clues, label) {
  assert.ok(clues, `${label} : null`);
  const lv = { ...level, people: level.people.map(p => ({ ...p, clues: clues[p.id] })) };
  const victim = lv.people.find(p => p.victim);
  assert.deepEqual(clues[victim.id], [], `${label} : la victime n'a pas d'indice`);
  for (const p of lv.people) {
    if (p.victim) continue;
    assert.ok(clues[p.id].length >= 1 && clues[p.id].length <= 2, `${label} : ${p.id} a ${clues[p.id].length} indices`);
    for (const c of clues[p.id]) {
      assert.equal(checkClue(lv, sol, p, c), true, `${label} : indice faux ${JSON.stringify(c)}`);
      if (c.t === 'with' || c.t === 'besidePerson') assert.notEqual(c.who, victim.id, `${label} : indice visant la victime`);
    }
  }
  const s = solve(lv, { max: 2 });
  assert.equal(s.length, 1, `${label} : ${s.length} solutions`);
  assert.deepEqual(s[0], sol, `${label} : autre solution`);
  assert.equal(validateLevel(lv).errors.length, 0, `${label} : ${validateLevel(lv).errors}`);
  return lv;
}
test('generateClues : solution unique, déterministe, sur les niveaux d’exemple', () => {
  for (const lvl of LEVELS) for (const difficulty of [1, 2, 3]) for (const seed of [1, 2, 3, 'abc']) {
    const sol = Object.fromEntries(lvl.people.map(p => [p.id, lvl.solution[p.id]]));
    const a = generateClues(lvl, sol, { difficulty, seed });
    checkGenerated(lvl, sol, a, `${lvl.id} d${difficulty} s${seed}`);
    assert.deepEqual(generateClues(lvl, sol, { difficulty, seed }), a, 'déterministe');
  }
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

console.log(`\n${passed} réussi(s), ${failedCount} échoué(s).`);
process.exit(failedCount ? 1 : 0);
