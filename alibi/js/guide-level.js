// Alibi — niveau d'apprentissage de l'enquête guidée.
// Même format que js/levels.js, mais il ne figure pas dans la liste des énigmes
// et ne compte pas dans la progression. Solution unique (vérifiée avec le moteur).
//
// Déroulé prévu par le guide (voir js/guide.js) :
//  1-4. Firmin « sur le tabouret » → pose directe, croix de ligne et de colonne.
//  5.   Lison « dans la Tonnelle » → deux cases restent (2,0) et (4,1) : notes ;
//       « à côté du tonneau » tranche → (4,1).
//  6.   Firmin « seul dans sa pièce » → la dernière case libre de la Buvette (2,2) se barre.
//       Oscar « sur le transat » → (1,4).
//  7.   Restent (0,2) et (2,0) pour Nora et Barnabé : la victime doit être seule avec
//       une autre personne → Barnabé à la Tonnelle avec Lison, Nora en (0,2).
//  8.   Valider, puis désigner Lison.
export const GUIDE_LEVEL = {
  id: 'guide-guinguette', title: 'La guinguette', difficulty: 1, size: 5,
  ambience: 'river',
  intro: 'Bal du samedi soir au bord de l’eau. Barnabé, l’accordéoniste, ne jouera plus la dernière valse.',
  rooms: [
    { key: 'a', name: 'Salle de bal', floor: 'parquet' },
    { key: 'b', name: 'Ponton', floor: 'deck' },
    { key: 'c', name: 'Tonnelle', floor: 'grass' },
    { key: 'd', name: 'Buvette', floor: 'tile' },
  ],
  roomMap: ['aaabb', 'aaabb', 'ccdbb', 'ccddd', 'ccddd'],
  objects: [
    { type: 'piano', r: 0, c: 0 },
    { type: 'buoy', r: 0, c: 3 },
    { type: 'deckchair', r: 1, c: 4 },
    { type: 'bush', r: 2, c: 1 },
    { type: 'stool', r: 3, c: 3 },
    { type: 'barrel', r: 4, c: 0 },
    { type: 'plant', r: 4, c: 2 },
    { type: 'counter', r: 4, c: 4 },
  ],
  people: [
    { id: 'F', name: 'Firmin', gender: 'm', look: { skin: 2, hair: 2, hairColor: 1, accessory: 'moustache', bg: 0 }, clues: [{ t: 'on', obj: 'stool' }, { t: 'alone' }] },
    { id: 'L', name: 'Lison', gender: 'f', look: { skin: 4, hair: 7, hairColor: 3, accessory: 'bow', bg: 6 }, clues: [{ t: 'room', room: 'c' }, { t: 'beside', obj: 'barrel' }] },
    { id: 'O', name: 'Oscar', gender: 'm', look: { skin: 1, hair: 9, hairColor: 5, accessory: 'hat', bg: 2 }, clues: [{ t: 'on', obj: 'deckchair' }] },
    { id: 'N', name: 'Nora', gender: 'f', look: { skin: 5, hair: 0, hairColor: 0, accessory: 'scarf', bg: 7 }, clues: [{ t: 'room', room: 'b', not: true }] },
    { id: 'B', name: 'Barnabé', gender: 'm', victim: true, look: { skin: 3, hair: 3, hairColor: 6, accessory: 'beard', bg: 5 }, clues: [] },
  ],
  solution: { F: [3, 3], L: [4, 1], O: [1, 4], N: [0, 2], B: [2, 0] },
};
