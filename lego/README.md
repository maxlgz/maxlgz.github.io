# Brique Studio — modèle 002 · Sous-marin requin

Le sous-marin requin du professeur Tournesol (*Le Trésor de Rackham le Rouge*),
reconstruit en briques par un générateur qui lit les contours de la maquette,
relevés sur ses photos officielles. Page statique, sans build.

    /lego/  →  https://maxlgz.github.io/lego/

## Comment le modèle est fabriqué

Rien n'est modélisé à la main. `model.js` enchaîne six étapes :

1. **Profils** — `profile.js` contient, tenon par tenon, ce qui a été mesuré
   sur les photos de la maquette (1 640 px pour 96 tenons) : ligne du dos et du
   ventre, ligne de livrée, demi-largeur vue de dessus, toit et largeur de la
   verrière, bords des dorsales, bords d'attaque et de fuite des pectorales et
   des pelviennes, intervalles des deux croissants de la caudale (vertical de
   profil, horizontal de dessus), position de l'œil, des ouïes et de l'hélice.
   `model.js` corrige les quelques tenons où l'œil, une nageoire ou une tige
   du socle mordent sur le contour, puis interpole. La section du corps est une
   super-ellipse tendue entre ces lignes.
2. **Voxelisation** — l'espace est découpé en cellules de 1 tenon × 1 tenon ×
   1 plaque, et chaque cellule est testée contre le solide.
3. **Évidement** — seules les cellules qui touchent le vide sont conservées, la
   peau est dilatée de deux cellules en hauteur et d'une en longueur pour que
   les anneaux se recouvrent ; museau et pédoncule restent pleins, la bulle de
   la verrière aussi. Une poutre à mi-hauteur traverse la coque de bord à bord
   et se prolonge en arbre d'hélice à travers la racine de la caudale.
4. **Livrée** — la ligne noir / blanc relevée sur la photo de profil, tenon
   par tenon ; œil annulaire, ouïes, anneau de base et arceaux gris de la
   verrière, hélice en or perlé.
5. **Pavage** — un remplissage glouton remplace les cellules par les plus grands
   rectangles disponibles dans le catalogue de pièces réelles. Une assise sur
   deux est pavée en miroir, depuis l'autre bout du modèle, et la première
   pièce de chaque file y est raccourcie : les joints ne se superposent jamais
   d'une assise à l'autre. La lame horizontale de la caudale est pavée en rangs
   sur une couche et en colonnes sur la suivante.
6. **Fusion verticale** — trois plaques identiques empilées deviennent une brique.

Chaque chiffre affiché sur la page (nombre de pièces, encombrement, répartition
par étape, estimation de prix) est recalculé au chargement à partir du modèle
effectivement rendu à l'écran.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `model.js` | générateur : profils, voxelisation, pavage, catalogue de pièces, étapes |
| `profile.js` | contours relevés sur les photos, tenon par tenon |
| `tools/voxelize.mjs` | optionnel : voxelise un STL en `voxels.json`, qui prime alors sur les profils |
| `viewer.js` | rendu three.js par instanciation, cadrages, éclaté, sélection |
| `styles.css` | charte reprise du site de référence : fond blanc, Arial, accent rouge |
| `exports.js` | CSV, LDraw `.ldr`, liste de manque BrickLink, JSON, guide Markdown |
| `main.js` | câblage de la page |
| `vendor/` | three.js et OrbitControls embarqués — la page ne dépend d'aucun CDN |

## Guide de montage

L'onglet « Guide de montage » découpe le modèle en étapes, du bas vers le
haut toutes pièces confondues — rien ne s'insère après coup dans une coque
refermée. Les nageoires pendantes (pectorales, pelviennes, lobe inférieur de
la caudale) se montent d'abord à plat ; le guide indique l'étape exacte où
les presser sous la coque, juste après la couche qui les reçoit. Le socle
vient en dernier. Un second visualiseur grise le
déjà-monté et colore en cyan les pièces à poser ; chaque étape donne la
hauteur de pose, la liste à rassembler et les coordonnées.

## Exports

- **guide `.html`** — autonome, une section par étape avec le plan de pose de
  la couche vu de dessus ; imprimable en PDF depuis le navigateur.
- **`.ldr`** — s'ouvre dans Studio, LeoCAD ou LDView.
- **`.xml`** — s'importe comme liste de manque sur BrickLink.
- **`.csv`**, **`.json`**, **`.md`** — bordereau, coordonnées de chaque pièce, résumé par chapitre.

## Réserves

Les recouvrements et la connectivité des tenons sont vérifiés pièce par pièce
et le résultat est affiché sur la page (un seul bloc solidaire, aucun
chevauchement), mais les croissants de la caudale en porte-à-faux, l'ancrage
des pectorales et les tiges du socle sont des propositions non éprouvées
physiquement. Les prix sont une
estimation paramétrique (plancher par pièce + coût proportionnel à la surface),
pas un tarif relevé chez un revendeur.

Création de fan indépendante. Non affiliée à LEGO®, ni à Moulinsart /
Tintinimaginatio.
