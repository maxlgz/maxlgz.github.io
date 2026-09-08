# Brique Studio — modèle 002 · Sous-marin requin

Le sous-marin requin du professeur Tournesol (*Le Trésor de Rackham le Rouge*),
reconstruit en briques par un générateur paramétrique. Page statique, sans build.

    /lego/  →  https://maxlgz.github.io/lego/

## Comment le modèle est fabriqué

Rien n'est modélisé à la main. `model.js` enchaîne six étapes :

1. **Profils** — le corps est décrit par des fonctions continues : demi-largeur,
   demi-hauteur haute et basse, hauteur d'axe, le tout en fonction de la position
   le long du museau. Les nageoires et l'empennage sont des solides implicites
   séparés (aile en flèche, lame verticale, caudale fourchue).
2. **Voxelisation** — l'espace est découpé en cellules de 1 tenon × 1 tenon ×
   1 plaque, et chaque cellule est testée contre la section super-elliptique.
3. **Évidement** — seules les cellules qui touchent le vide sont conservées :
   il reste une peau d'un tenon d'épaisseur, posée sur un plancher longitudinal.
4. **Colorisation** — la livrée est peinte par des règles géométriques :
   ventre blanc, ligne de gueule et dents, œil cerclé, ouïes, hublot transparent.
5. **Pavage** — un remplissage glouton remplace les cellules par les plus grands
   rectangles disponibles dans le catalogue de pièces réelles.
6. **Fusion verticale** — trois plaques identiques empilées deviennent une brique.

Chaque chiffre affiché sur la page (nombre de pièces, encombrement, répartition
par étape, estimation de prix) est recalculé au chargement à partir du modèle
effectivement rendu à l'écran.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `model.js` | générateur : profils, voxelisation, pavage, catalogue de pièces |
| `viewer.js` | rendu three.js par instanciation, cadrages, éclaté, sélection |
| `exports.js` | CSV, LDraw `.ldr`, liste de manque BrickLink, JSON, guide Markdown |
| `main.js` | câblage de la page |
| `vendor/` | three.js et OrbitControls embarqués — la page ne dépend d'aucun CDN |

## Exports

- **`.ldr`** — s'ouvre dans Studio, LeoCAD ou LDView.
- **`.xml`** — s'importe comme liste de manque sur BrickLink.
- **`.csv`**, **`.json`**, **`.md`** — bordereau, coordonnées de chaque pièce, guide de montage.

## Réserves

Les recouvrements et la connectivité des tenons sont vérifiés couche par couche,
mais les nageoires en porte-à-faux, l'ancrage de l'empennage et le montage de
l'hélice sont des propositions non éprouvées physiquement. Les prix sont une
estimation paramétrique (plancher par pièce + coût proportionnel à la surface),
pas un tarif relevé chez un revendeur.

Création de fan indépendante. Non affiliée à LEGO®, ni à Moulinsart /
Tintinimaginatio.
