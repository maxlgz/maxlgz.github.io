# Brique Studio — modèle 002 · Sous-marin requin

Le sous-marin requin du professeur Tournesol (*Le Trésor de Rackham le Rouge*),
reconstruit en briques par un générateur paramétrique. Page statique, sans build.

    /lego/  →  https://maxlgz.github.io/lego/

## Comment le modèle est fabriqué

Rien n'est modélisé à la main. `model.js` enchaîne six étapes :

1. **Profils** — les demi-hauteurs du corps sont relevées sur les photos de la
   maquette (1 720 px pour 77 cm) et interpolées par une cubique monotone ; la
   section est ronde. Les nageoires sont des lames décrites par leurs bords
   d'attaque et de fuite (dorsales, croissant caudal) ou par leur profondeur
   (pectorales et pelviennes, presque verticales) ; la verrière est une voûte.
2. **Voxelisation** — l'espace est découpé en cellules de 1 tenon × 1 tenon ×
   1 plaque, et chaque cellule est testée contre la section super-elliptique.
3. **Évidement** — seules les cellules qui touchent le vide sont conservées :
   il reste une peau d'un tenon d'épaisseur, posée sur un plancher longitudinal.
4. **Livrée** — relevée sur la photo de profil : dos noir et ventre blanc
   séparés par une frontière qui court sous l'axe et remonte en sept pointes
   aux positions mesurées ; œil annulaire, ouïes, arceaux gris de la verrière,
   hélice en or perlé.
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
| `styles.css` | charte reprise du site de référence : fond blanc, Arial, accent rouge |
| `exports.js` | CSV, LDraw `.ldr`, liste de manque BrickLink, JSON, guide Markdown |
| `main.js` | câblage de la page |
| `vendor/` | three.js et OrbitControls embarqués — la page ne dépend d'aucun CDN |

## Exports

- **`.ldr`** — s'ouvre dans Studio, LeoCAD ou LDView.
- **`.xml`** — s'importe comme liste de manque sur BrickLink.
- **`.csv`**, **`.json`**, **`.md`** — bordereau, coordonnées de chaque pièce, guide de montage.

## Réserves

Les recouvrements et la connectivité des tenons sont vérifiés couche par couche
et le résultat est affiché sur la page, mais les nageoires en porte-à-faux,
l'ancrage de l'empennage et le montage de l'hélice sont des propositions non
éprouvées physiquement. Les prix sont une
estimation paramétrique (plancher par pièce + coût proportionnel à la surface),
pas un tarif relevé chez un revendeur.

Création de fan indépendante. Non affiliée à LEGO®, ni à Moulinsart /
Tintinimaginatio.
