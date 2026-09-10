import {strict as assert} from 'assert';
import {buildModel} from '../model.js';
import {pickABrickList} from '../exports.js';
function cells(model){const out=new Map();for(const p of model.pieces)for(let x=p.x;x<p.x+p.dx;x++)for(let y=p.y;y<p.y+p.h;y++)for(let z=p.z;z<p.z+p.dz;z++){const k=`${x}|${y}|${z}`;assert(!out.has(k));out.set(k,p.color);}return out;}
const before=buildModel(null,{franceParts:false}),after=buildModel();
assert.deepEqual(cells(before),cells(after));
assert.equal(after.check.components,1);
assert.equal(pickABrickList(after.stats).missing.length,0);
console.log(`OK France : même volume, mêmes couleurs, une composante, ${before.pieces.length} → ${after.pieces.length} pièces, export intégral.`);
