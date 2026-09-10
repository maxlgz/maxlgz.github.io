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
   la verrière est traitée séparément. Une poutre à mi-hauteur traverse la coque de bord à bord
   et se prolonge en arbre d'hélice à travers la racine de la caudale.
   La verrière est désormais partiellement évidée entre ses trois arceaux,
   dont les assises restent contreventées pour conserver une seule composante.
4. **Livrée** — la ligne noir / beige relevée sur la photo de profil, tenon
   par tenon (le crème de la maquette devient du Tan) ; œil annulaire,
   bouche blanche bordée de noir, quatre ouïes, anneau de base et arceaux
   gris de la verrière, hélice en or perlé.
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

### Pavage économique du corps

Après le pavage initial, les assises de coque sont optimisées localement.
Une substitution n'est acceptée que si elle réduit le nombre de pièces,
n'augmente ni les petites emprises (1×1 et 1×2) ni les composantes connexes.
Les volumes rectangulaires complets sont ensuite fusionnés dans les pièces
du catalogue. Le volume occupé et les couleurs restent strictement identiques.
`node lego/tools/check-packing.mjs` compare les deux versions cellule par
cellule. La solidité physique et les tarifs réels des pièces restent à valider.

| Fichier | Rôle |
| --- | --- |
| `model.js` | générateur : profils, voxelisation, pavage, catalogue de pièces, étapes |
| `profile.js` | contours relevés sur les photos, tenon par tenon |
| `voxelize.js` | d'un maillage STL aux cellules : lecture, orientation, voxelisation, classement |
| `zip.js` | lecteur ZIP minimal (répertoire central + `DecompressionStream`) |
| `import.worker.js` | voxelisation dans un Web Worker, pour l'import depuis la page |
| `tools/voxelize.mjs` | la même chaîne en ligne de commande : écrit `voxels.json`, qui prime alors sur les profils |
| `viewer.js` | rendu three.js par instanciation, cadrages, éclaté, sélection |
| `styles.css` | charte reprise du site de référence : fond blanc, Arial, accent rouge |
| `exports.js` | CSV, LDraw `.ldr`, liste de manque BrickLink, JSON, guide Markdown |
| `main.js` | câblage de la page |
| `vendor/` | three.js et OrbitControls embarqués — la page ne dépend d'aucun CDN |

## Importer un maillage

Le panneau « Importer un maillage » de l'onglet Modèle 3D accepte un STL
(binaire ou ASCII) ou un ZIP de STL. Tout se passe dans le navigateur : le
ZIP est dézippé par `DecompressionStream`, chaque fichier est listé avec une
case à cocher et un groupe (coque, verrière, caudale, socle… ou « auto »),
puis le maillage est orienté (grand axe → x, museau en x = 0), mis à la
longueur demandée (77 cm par défaut), voxelisé par enroulement de rayons,
comblé et classé dans un Web Worker. Le résultat est conservé dans le
navigateur (`localStorage`) et la page se reconstruit dessus — visualiseur,
bordereau, guide et exports. Un bouton ramène au modèle photo.

Avec un seul fichier, le classement est automatique (coque, verrière, dorsales,
caudale, nageoires, hélice, socle). Avec plusieurs fichiers, c'est le groupe
choisi pour chacun qui compte ; ils doivent partager le même repère (export
« assemblé »). Les kits d'impression 3D posent souvent chaque pièce à plat sur
son plateau : la liste affiche l'emprise de chaque fichier et prévient quand
les fichiers cochés se superposent près de l'origine. Deux demi-coques
(« top » / « bottom ») posées chacune face de coupe en bas sont reconnues et
la seconde est retournée (case ↕) pour l'assemblage. Une coque d'impression
est une paroi creuse : si le volume trouvé est bien plus petit que
l'enveloppe des rayons, c'est l'enveloppe qui est retenue, et les vides
courts autour du plan de coupe sont refermés. Le **mode hybride** (coché
par défaut) complète ce qui manque — nageoires, caudale, bulle, hélice —
avec le modèle photo, accroché à la coque importée dont l'axe est aligné
sur le sien ; sans caudale dans le maillage, la coque est ramenée à sa part
de la longueur totale (83 tenons sur 96). Le même traitement existe en
ligne de commande :

    node lego/tools/voxelize.mjs modele.stl --length 96 --out lego/voxels.json

## Guide de montage

Les pectorales avant sont affinées : attache rentrée sous la coque,
épaisseur réduite et contour resserré. À l'arrière, le modèle photo possède
une seule petite nageoire ventrale médiane, à bord de fuite échancré.
Les anciens groupes de pelviennes restent reconnus pour les imports existants.

L'onglet « Guide de montage » découpe le modèle en étapes, du bas vers le
haut toutes pièces confondues — rien ne s'insère après coup dans une coque
refermée. Les nageoires pendantes (pectorales, ventrale, lobe inférieur de
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

### Révision des nageoires — 10 septembre 2026

Révision suivante, queue et habitacle : le carénage beige est prolongé
jusqu'au moyeu, sous la lame noire de l'empennage. L'hélice comporte trois
pales dans le plan transversal et une plaque 2×4 réservée assure sa liaison
au carénage. La verrière rejoint la surface arrondie de la coque sans
remplissage vertical noir ; son extrémité arrière se resserre. Son vitrage
est moins opaque et deux personnages stylisés en briques, Tintin et Milou,
sont intégrés au bordereau et aux couches du guide.

Ces personnages ne sont pas des figurines moulées. Les pales et le vitrage
restent constitués des plaques et briques du catalogue : leur courbure
n'est pas identique aux pièces lisses de la maquette de référence.

Le bord de fuite de la grande dorsale est maintenant concave, estimé sur
`tools/ref/profil.png`. Les pectorales utilisent deux contours continus
en hauteur : les anciens relevés contaminés par le socle produisaient des
pointes parasites. Leur racine est épaissie et leur extrémité affinée.
Ces corrections sont explicites dans `model.js` et ne modifient pas les
relevés bruts régénérés par `extract.py`.

Cette révision conserve les plaques et briques du catalogue existant :
elle ne remplace pas encore les escaliers par des slopes ou des wedges.
Le corps conserve ses sections super-elliptiques ; il ne s'agit pas d'une
reconstruction exacte en trois dimensions à partir de deux photographies.

Les recouvrements et la connectivité des tenons sont vérifiés pièce par pièce
et le résultat est affiché sur la page (un seul bloc solidaire, aucun
chevauchement), mais les croissants de la caudale en porte-à-faux, l'ancrage
des pectorales et les berceaux du socle sont des propositions non éprouvées
physiquement. Les prix sont une
estimation paramétrique (plancher par pièce + coût proportionnel à la surface),
pas un tarif relevé chez un revendeur.

Création de fan indépendante. Non affiliée à LEGO®, ni à Moulinsart /
Tintinimaginatio.
