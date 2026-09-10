import {strict as assert} from 'assert';
import {buildModel} from '../model.js';
const {pieces,steps}=buildModel();
const neighbors=pieces.map(()=>new Set());
for(const p of pieces) for(const [,,q] of p.studs) if(q>=0){neighbors[p.id].add(q);neighbors[q].add(p.id);}
const units=new Map(), main=new Set(), allocated=new Set();
let underside=0;
for(const s of steps){
  if(s.context==='final') continue;
  if(s.context==='attach'){
    assert(s.pieces.some(id=>[...neighbors[id]].some(q=>main.has(q))),`attache flottante ${s.id}`);
    assert(s.pieces.every(id=>allocated.has(id)));
    s.pieces.forEach(id=>main.add(id));continue;
  }
  if(!units.has(s.unit))units.set(s.unit,new Set());
  const built=s.context==='main'?main:units.get(s.unit);
  const bottom=Math.min(...pieces.filter(p=>p.unit===s.unit).map(p=>p.y));
  assert(s.pieces.length<=6);
  assert.equal(s.placements.length,s.pieces.length);
  for(const item of s.placements){
    const p=pieces[item.id];assert(!allocated.has(p.id));
    if(item.mode==='table'){assert.equal(p.y,bottom);}
    else {assert(built.has(item.support),`support futur étape ${s.id}`);assert(neighbors[p.id].has(item.support));}
    if(item.mode==='below')underside++;
  }
  s.pieces.forEach(id=>{built.add(id);allocated.add(id);});
}
assert.equal(allocated.size,pieces.length);
console.log(`OK : ${steps.length} étapes, ${pieces.length} pièces une seule fois, six ajouts maximum, ${underside} poses par dessous explicites, aucun ajout sans attache disponible hors base sur table.`);
