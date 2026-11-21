// Alibi — palette « Cartoon franc », partagée par les visuels (art-*.js) et l'interface.

export const INK = '#1F2147';      // trait et texte : bleu nuit, jamais de noir pur
export const CREAM = '#FFF6E3';    // fond
export const VICTIM = '#E0463B';   // liseré et pastille de la victime

// Une couleur par personnage, attribuée selon son rang dans level.people (9 au plus).
// main = couleur franche (anneau du jeton, initiale), pastel = fond de fiche, dark = ombre / texte coloré lisible.
export const PERSON_COLORS = [
  { id: 'lilas',     main: '#B58CFF', pastel: '#E8DCFF', dark: '#6E44C9' },
  { id: 'tournesol', main: '#FFC83D', pastel: '#FFEDB8', dark: '#A86F00' },
  { id: 'menthe',    main: '#4FCFA3', pastel: '#CFF3E5', dark: '#1B8562' },
  { id: 'corail',    main: '#FF6B5E', pastel: '#FFD9D4', dark: '#C23A2E' },
  { id: 'ciel',      main: '#57B8FF', pastel: '#D3ECFF', dark: '#1A6FB8' },
  { id: 'rose',      main: '#FF8FC7', pastel: '#FFDDEE', dark: '#B93F82' },
  { id: 'pomme',     main: '#A6D94A', pastel: '#E6F5C4', dark: '#5C8A10' },
  { id: 'mandarine', main: '#FF9F45', pastel: '#FFE1C2', dark: '#B85A0E' },
  { id: 'lagon',     main: '#35C6D9', pastel: '#C9F1F6', dark: '#117C8C' },
];

export function personColor(index) {
  const n = PERSON_COLORS.length;
  return PERSON_COLORS[((index % n) + n) % n];
}

// Couleur d'un personnage dans un niveau (brut ou préparé) ; null si absent.
export function colorOf(level, personId) {
  const i = level && Array.isArray(level.people) ? level.people.findIndex((p) => p.id === personId) : -1;
  return i < 0 ? null : personColor(i);
}
