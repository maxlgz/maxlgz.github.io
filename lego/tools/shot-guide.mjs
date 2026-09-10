// Captures Playwright de l'onglet Guide de montage.
//   node lego/tools/shot-guide.mjs
import { chromium } from 'playwright';   // npm i -g playwright, ou adapter le chemin
const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-certificate-errors'] });
const p = await b.newPage({ viewport:{width:1280,height:900}, deviceScaleFactor:1 });
p.setDefaultTimeout(180000);
await p.route('**fonts.googleapis.com**', r=>r.abort());
const errs=[];
p.on('console', m=>{ if(m.type()==='error') errs.push('[error] '+m.text()); });
p.on('pageerror', e=>errs.push('[pageerror] '+e.message));
await p.goto('http://127.0.0.1:8765/lego/index.html', { waitUntil:'networkidle' });
await p.waitForTimeout(5000);
await p.evaluate(()=>{document.querySelector('[data-tab="guide"]').click();window.scrollTo(0,0);});
await p.waitForTimeout(14000);
const info = async () => p.evaluate(()=>({no:document.getElementById('step-no').textContent,total:document.getElementById('step-total').textContent,title:document.getElementById('step-title').textContent,gather:document.querySelectorAll('#step-gather .assembly-part').length,chapitre:document.querySelector('[data-chapter][aria-current="true"]')?.textContent,err2:document.getElementById('canvas-error-2').hidden,bar:document.getElementById('progress-bar').style.width}));
console.log('étape 1 :', JSON.stringify(await info()));
await p.evaluate(()=>document.querySelector('.assembly-chapters').scrollIntoView({block:'start'}));
await p.waitForTimeout(2000);
await p.screenshot({ path:'guide-1.png' });
await p.evaluate(()=>{const s=document.getElementById('step-select'); s.value='60'; s.dispatchEvent(new Event('change'));});
await p.waitForTimeout(10000);
console.log('étape 40 :', JSON.stringify(await info()));
await p.screenshot({ path:'guide-40.png' });
await p.evaluate(()=>{document.querySelector('[data-chapter="5"]').click();});
await p.waitForTimeout(10000);
console.log('chapitre 4 :', JSON.stringify(await info()));
await p.screenshot({ path:'guide-ch4.png' });
console.log('--- console ---'); console.log(errs.join('\n')||'(rien)');
console.log('FINI');
await b.close();
