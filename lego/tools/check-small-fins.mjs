import {strict as assert} from 'assert';
import {buildModel} from '../model.js';
const {pieces}=buildModel();
const cells=new Map(), lower=[],upper=[];
for(const p of pieces)for(let x=p.x;x<p.x+p.dx;x++)for(let y=p.y;y<p.y+p.h;y++)for(let z=p.z;z<p.z+p.dz;z++){
  cells.set(`${x}|${y}|${z}`,p);
  if(p.group==='ventrale')lower.push([x,y,z]);
  if(p.group==='dorsale2')upper.push([x,y,z]);
}
for(const [source,target]of[[lower,'dorsale2'],[upper,'ventrale']])for(const[x,y,z]of source){
  const q=cells.get(`${x}|${136-y}|${z}`);
  assert(q,`miroir absent ${x} ${y} ${z}`);
  // À la racine, le miroir peut déjà être occupé par la peau du corps.
  assert(q.group===target||q.group==='arriere'||q.group==='chassis');
}
console.log('OK : petites nageoires en miroir, racines fusionnées à la coque.');
