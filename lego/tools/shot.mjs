// Captures Playwright de la page (http-server -p 8765 à la racine du dépôt).
//   node lego/tools/shot.mjs babord tete dessus empennage
import { chromium } from 'playwright';   // npm i -g playwright, ou adapter le chemin
const args = process.argv.slice(2);
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors'] });
const p = await b.newPage({ viewport:{width:1280,height:860}, deviceScaleFactor:1 });
p.setDefaultTimeout(180000);
await p.route('**fonts.googleapis.com**', r=>r.abort());
await p.route('**fonts.gstatic.com**', r=>r.abort());
const errs=[];
p.on('console', m=>{ if(m.type()==='error'||m.type()==='warning') errs.push('['+m.type()+'] '+m.text()); });
p.on('pageerror', e=>errs.push('[pageerror] '+e.message));
p.on('requestfailed', r=>errs.push('[reqfail] '+r.url()+' :: '+(r.failure()?.errorText)));
await p.goto('http://127.0.0.1:8765/lego/index.html', { waitUntil:'networkidle', timeout:60000 });
await p.evaluate(()=>document.querySelector('.workspace').scrollIntoView({block:'center'}));
await p.waitForTimeout(8000);
console.log('--- console ---'); console.log(errs.slice(0,25).join('\n')||'(rien)');
console.log('--- chiffres ---');
console.log(await p.evaluate(()=>{
  const o={}; document.querySelectorAll('[data-fill]').forEach(e=>o[e.dataset.fill]=e.textContent); 
  o.__rows = document.querySelectorAll('#catalog-body tr').length;
  o.__err = document.getElementById('canvas-error').hidden;
  return o;
}));
await p.screenshot({ path:'top.png' });
await p.screenshot({ path:'viewer.png', clip: await p.locator('.workspace').boundingBox() });
for (const v of args){
  await p.click(`[data-view="${v}"]`); await p.waitForTimeout(9000);
  await p.screenshot({ path:`view-${v}.png`, clip: await p.locator('.workspace').boundingBox() });
}
await b.close();
