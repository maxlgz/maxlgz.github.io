// Contrôle de structure : chevauchements, pièces sans liaison, composantes.
//   node lego/tools/check.mjs
import { buildModel } from '../model.js';
const { pieces } = buildModel();
const occ = new Map();               // cellule -> id de piece
let overlaps = 0;
for (const p of pieces) {
  for (let a=0;a<p.dx;a++) for(let c=0;c<p.dz;c++) for(let k=0;k<p.h;k++){
    const key=`${p.x+a}|${p.y+k}|${p.z+c}`;
    if (occ.has(key)) overlaps++;
    else occ.set(key, p.id);
  }
}
console.log('chevauchements de corps :', overlaps);

// connectivité : une pièce est liée si elle partage une face horizontale
// (dessus ou dessous) avec une autre pièce.
let loose = [];
for (const p of pieces) {
  let linked = false;
  for (let a=0;a<p.dx && !linked;a++) for(let c=0;c<p.dz && !linked;c++){
    const above = occ.get(`${p.x+a}|${p.y+p.h}|${p.z+c}`);
    const below = occ.get(`${p.x+a}|${p.y-1}|${p.z+c}`);
    if ((above!==undefined && above!==p.id) || (below!==undefined && below!==p.id)) linked = true;
  }
  if (!linked) loose.push(p);
}
console.log('pièces sans liaison verticale :', loose.length);
console.log(loose.slice(0,12).map(p=>`  ${p.part} ${p.color} @ x${p.x} y${p.y} z${p.z} [${p.group}]`).join('\n'));

// composantes connexes (liaison verticale uniquement)
const parent = new Map(pieces.map(p=>[p.id,p.id]));
const find=(a)=>{while(parent.get(a)!==a){parent.set(a,parent.get(parent.get(a)));a=parent.get(a);}return a;};
const uni=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(a,b);};
for (const p of pieces){
  for (let a=0;a<p.dx;a++) for(let c=0;c<p.dz;c++){
    for (const q of [occ.get(`${p.x+a}|${p.y+p.h}|${p.z+c}`), occ.get(`${p.x+a}|${p.y-1}|${p.z+c}`)])
      if (q!==undefined && q!==p.id) uni(p.id,q);
  }
}
const comp = new Map();
for (const p of pieces){ const r=find(p.id); comp.set(r,(comp.get(r)||0)+1); }
const sizes=[...comp.values()].sort((a,b)=>b-a);
console.log('composantes connexes :', sizes.length, '| tailles (top 8) :', sizes.slice(0,8).join(', '));

// composition des composantes
const members = new Map();
for (const p of pieces){ const r=find(p.id); if(!members.has(r)) members.set(r,[]); members.get(r).push(p); }
const list=[...members.values()].sort((a,b)=>b.length-a.length);
console.log('\n--- composantes, du plus gros au plus petit ---');
for (const c of list.slice(0,14)){
  const g = {}; c.forEach(p=>g[p.group]=(g[p.group]||0)+1);
  const xs = c.map(p=>p.x); const ys=c.map(p=>p.y);
  console.log(String(c.length).padStart(5), Object.entries(g).map(([k,v])=>k+':'+v).join(' '),
    `| x ${Math.min(...xs)}-${Math.max(...xs)} y ${Math.min(...ys)}-${Math.max(...ys)}`);
}
const tail = list.slice(14);
console.log('… et', tail.length, 'autres composantes,', tail.reduce((n,c)=>n+c.length,0), 'pièces');
const gg={}; tail.flat().forEach(p=>gg[p.group]=(gg[p.group]||0)+1);
console.log('   réparties en', JSON.stringify(gg));
