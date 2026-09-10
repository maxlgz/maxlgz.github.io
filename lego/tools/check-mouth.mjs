import { strict as assert } from 'assert';
import { buildModel } from '../model.js';

const cells = new Map();
for (const p of buildModel().pieces) {
  if (p.group === 'socle') continue;
  for (let x=p.x;x<p.x+p.dx;x++) for(let y=p.y;y<p.y+p.h;y++)
    for(let z=p.z;z<p.z+p.dz;z++) cells.set(`${x}|${y}|${z}`,p.color);
}
// Le trait traverse le ventre, et le blanc le suit : pas seulement les flancs.
for (let z=-3;z<3;z++) {
  for (const [x,color] of [[13,'black'],[14,'white'],[15,'white'],[16,'white']]) {
    const bottom = Array.from({length:100},(_,y)=>y).find(y=>cells.has(`${x}|${y}|${z}`));
    assert.notEqual(bottom,undefined);
    assert.equal(cells.get(`${x}|${bottom}|${z}`),color,`bouche x${x} z${z}`);
  }
}
console.log('OK : contour noir et bouche blanche continus sous le museau.');
