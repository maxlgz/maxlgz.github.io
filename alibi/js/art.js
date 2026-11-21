// Alibi — visuels « Cartoon franc ». Point d'entrée unique : le jeu et l'éditeur importent d'ici.
import { objectSVG as baseObject, OBJECT_TYPES as BASE_TYPES } from './art-objects.js';
import { objectSVG as objectA, OBJECT_TYPES as TYPES_A } from './art-objects-a.js';
import { objectSVG as objectB, OBJECT_TYPES as TYPES_B } from './art-objects-b.js';

export { floorCSS, floorColor } from './art-floors.js';
export { avatarSVG, LOOK_OPTIONS } from './art-people.js';

// Les objets sont répartis en lots : le socle d'origine, « voyage » (a) et « lieux et aventures » (b).
const LOT_A = new Set(TYPES_A);
const LOT_B = new Set(TYPES_B);

export const OBJECT_TYPES = [...BASE_TYPES, ...TYPES_A, ...TYPES_B];

export function objectSVG(type, opts) {
  if (LOT_A.has(type)) return objectA(type, opts);
  if (LOT_B.has(type)) return objectB(type, opts);
  return baseObject(type, opts);
}
