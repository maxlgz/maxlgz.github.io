// Silhouettes ASCII (profil et dessus) du modèle généré.
//   node lego/tools/silhouette.mjs
import { buildModel, TOTAL_LEN, NY, Z_MIN, Z_MAX } from '../model.js';
const { pieces } = buildModel();
const CH = { black:'#', white:'o', tan:'.', lgrey:'-', dgrey:'+', gold:'*', trans:'=' };
const side = {}, top = {};
for (const p of pieces){
  for(let i=0;i<p.dx;i++) for(let j=0;j<p.dz;j++) for(let k=0;k<p.h;k++){
    const x=p.x+i, z=p.z+j, y=p.y+k;
    const sk=`${x}|${y}`; if(!side[sk] || z> side[sk].z) side[sk]={z,c:p.color};
    const tk=`${x}|${z}`; if(!top[tk] || y> top[tk].y) top[tk]={y,c:p.color};
  }
}
console.log('=== PROFIL, 1 car = 1 tenon x 2 plaques  (# noir . blanc = verre - gris * or)');
for(let y=NY-1;y>=0;y-=2){
  let row=''; for(let x=0;x<TOTAL_LEN;x++){ const c=side[`${x}|${y}`]||side[`${x}|${y-1}`]; row += c?CH[c.c]:' '; }
  if(row.trim()) console.log(String(y).padStart(3),row);
}
console.log('\n=== DESSUS');
for(let z=Z_MIN;z<Z_MAX;z++){
  let row=''; for(let x=0;x<TOTAL_LEN;x++){ const c=top[`${x}|${z}`]; row += c?CH[c.c]:' '; }
  if(row.trim()) console.log(String(z).padStart(3),row);
}
