#!/usr/bin/env node
// ================================================================
// voxelize.mjs — d'un maillage STL au sous-marin en cellules
//
//   node lego/tools/voxelize.mjs modele.stl [autres.stl…] [options]
//
// Ligne de commande du module voxelize.js (le même que celui de la page).
// Lit un ou plusieurs STL (binaire ou ASCII), oriente le modèle
// (grand axe -> x, museau en x = 0, dessus en +y), le met à l'échelle
// de 96 tenons, le voxelise par parité de rayons, classe les cellules
// et écrit lego/voxels.json, que la page charge à la place des profils
// paramétriques.
//
// Options :
//   --length 96        longueur en tenons, museau -> hélice
//   --up y|z|-y|-z     axe « dessus » du fichier (auto sinon)
//   --nose +x|-x       côté du museau (auto sinon)
//   --canopy 28:50     plage x (tenons) de la verrière
//   --keep-stand       garder le socle du fichier (sinon retiré)
//   --group nom=fichier  forcer le groupe d'un fichier (corps, verriere,
//                      dorsale, caudale, pectoraleG, socle, helice…)
//   --out chemin       sortie (défaut : lego/voxels.json)
// ================================================================

import fs from 'node:fs';
import path from 'node:path';
import { parseSTL, meshToVoxels } from '../voxelize.js';

// ------------------------------------------------------------------ main
function main() {
  const args = process.argv.slice(2);
  const opts = { length: 96, out: 'lego/voxels.json', groupOf: {} };
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--length') opts.length = +args[++i];
    else if (a === '--up') opts.up = args[++i];
    else if (a === '--nose') opts.nose = args[++i];
    else if (a === '--canopy') opts.canopy = args[++i];
    else if (a === '--keep-stand') opts.keepStand = true;
    else if (a === '--out') opts.out = args[++i];
    else if (a === '--group') { const [g, f] = args[++i].split('='); opts.groupOf[path.basename(f)] = g; }
    else files.push(a);
  }
  if (!files.length) { console.error('usage : voxelize.mjs modele.stl [options]'); process.exit(1); }

  // tous les fichiers partagent le même repère : on oriente sur l'ensemble
  const parts = files.map((f) => ({ name: path.basename(f), group: opts.groupOf[path.basename(f)] || 'auto', tris: parseSTL(fs.readFileSync(f)) }));
  const out = meshToVoxels(parts, { ...opts, progress: (phase) => console.error(phase + '…') });
  console.error(`triangles : ${out.triangles} · longueur fichier ${out.fileLength.toFixed(2)} u -> ${opts.length} tenons (× ${out.scale.toFixed(4)}) · axes ${JSON.stringify(out.axes)}`);
  fs.writeFileSync(opts.out, JSON.stringify(out));
  console.error(`cellules par groupe : ${JSON.stringify(out.cells)} -> ${opts.out}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
