import { strict as assert } from 'assert';
import { buildModel, PARTS } from '../model.js';
const before = buildModel(null, { optimizeHull: false });
const after = buildModel();
function occupancy(model) {
  const out = new Map();
  for (const p of model.pieces) {
    assert.ok(PARTS[p.part]);
    for(let x=p.x;x<p.x+p.dx;x++) for(let y=p.y;y<p.y+p.h;y++) for(let z=p.z;z<p.z+p.dz;z++) {
      const k=`${x}|${y}|${z}`; assert.ok(!out.has(k), `Overlap ${k}`); out.set(k,p.color);
    }
  }
  return out;
}
assert.deepEqual(occupancy(after), occupancy(before), 'Volume et couleurs inchangés');
assert.equal(after.check.components,1);
assert.equal(after.check.overlaps,0);
assert.ok(after.pieces.length < before.pieces.length);
const hull = m => m.pieces.filter(p=>['avant','arriere','chassis'].includes(p.group));
assert.ok(hull(after).filter(p=>p.dx*p.dz<=2).length <= hull(before).filter(p=>p.dx*p.dz<=2).length);
for(const [label,m] of [['Avant',before],['Après',after]]) {
  const h=hull(m);
  console.log(label,JSON.stringify({total:m.pieces.length,coque:h.length,briquesCoque:h.filter(p=>p.h===3).length,petitesCoque:h.filter(p=>p.dx*p.dz<=2).length,estimation:m.stats.cost,etapes:m.steps.length}));
}
console.log('OK : mêmes cellules et couleurs, sans chevauchement, une composante.');
