const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await require('./browser.cjs')(),manifest=JSON.parse(fs.readFileSync('assets/rws/manifest.json','utf8'));
 const checks=[],errors=[];
 try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('arcana_art_mode_v22','local');}catch{}});
 await p.route('https://**/*',r=>r.abort());
 await p.goto(browser.appURL,{waitUntil:'domcontentloaded',timeout:60000});
 const cards=await p.evaluate(async()=>{
  const result=[];
  for(const card of CARDS){
   if(!card.img.startsWith('data:image/jpeg;base64,'))throw Error('Non-original format: '+card.id);
   const raw=Uint8Array.from(atob(card.img.split(',')[1]),c=>c.charCodeAt(0));
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
   const img=new Image();img.src=card.img;await img.decode();
   result.push({id:card.id,sha256:hash,width:img.naturalWidth,height:img.naturalHeight,bytes:raw.length});
  }
  return result;
 });
 assert.equal(cards.length,78);
 for(const card of cards){const source=manifest.cards.find(c=>c.id===card.id);for(const key of ['sha256','width','height','bytes'])assert.equal(card[key],source[key],`${card.id}: ${key}`);}
 checks.push('78 embedded originals decode with matching Wikimedia JPEG hashes and dimensions');
 assert.equal(await p.locator('[data-mode="local"]').count(),0);
 assert(await p.evaluate(()=>typeof a22OfflineCard==='undefined'&&typeof arcanaArtPlaceholder==='undefined'));
 checks.push('legacy illustration preference cannot select a generated card / synthetic renderers removed');
 await p.locator('.nav-item[data-view="library"]').click();
 assert.equal(await p.locator('#deckGrid [data-card]').count(),78);
 await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#deckGrid img')].map(async img=>{img.loading='eager';await img.decode();}));scrollTo(0,0);});
 assert(await p.locator('#deckGrid img').evaluateAll(imgs=>imgs.length===78&&imgs.every(i=>i.naturalWidth>0&&i.src.startsWith('data:image/jpeg;base64,'))));
 checks.push('78 originals in library with all external HTTPS blocked');
 await p.screenshot({path:'test-results/original-rws-library.png'});
 await p.locator('#deckGrid [data-card="ar08"]').click();
 assert(await p.locator('#modalBody img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.src.startsWith('data:image/jpeg;base64,')));
 checks.push('original artwork in card detail');
 // Copy just the HTML into an empty folder: no adjacent assets and no network.
 fs.mkdirSync('.cache/standalone',{recursive:true});fs.copyFileSync('index.html','.cache/standalone/index.html');
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844},reducedMotion:'reduce'}),standalone=await context.newPage();
 standalone.on('pageerror',e=>errors.push(e.message));
 await standalone.goto(pathToFileURL(path.resolve('.cache/standalone/index.html')).href,{waitUntil:'domcontentloaded',timeout:60000});
 await standalone.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.hero-img')].map(i=>i.decode()));});
 assert(await standalone.locator('.hero-img').evaluateAll(imgs=>imgs.length===2&&imgs.every(i=>i.naturalWidth>0&&i.src.startsWith('data:image/jpeg;base64,'))));
 assert.equal(await standalone.evaluate(()=>CARDS.length),78);checks.push('standalone HTML opens offline with embedded original heroes and 78 cards');
 await standalone.locator('#spreads [data-spread="three"]').click();await standalone.locator('#startReading').click();await standalone.locator('.fan-card').first().waitFor();
 for(let i=0;i<3;i++){await standalone.locator('.fan-card').first().focus();await standalone.keyboard.press('Enter');}
 await standalone.locator('#revealAll').waitFor({state:'visible'});await standalone.locator('#revealAll').click();await standalone.locator('#report.visible').waitFor();
 await standalone.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#readingCards img,#cardReads img')].map(i=>i.decode()));});
 assert(await standalone.locator('#readingCards img,#cardReads img').evaluateAll(imgs=>imgs.length===6&&imgs.every(i=>i.naturalWidth>0&&i.src.startsWith('data:image/jpeg;base64,'))));
 checks.push('offline draw / reveal / report use original JPEGs');
 await standalone.locator('#saveReading').click();await standalone.locator('.nav-item[data-view="history"]').click();await standalone.locator('#historyList [data-history]').first().click();
 await standalone.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.history-cards img')].map(i=>i.decode()));});
 assert(await standalone.locator('.history-cards img').evaluateAll(imgs=>imgs.length===3&&imgs.every(i=>i.naturalWidth>0&&i.src.startsWith('data:image/jpeg;base64,'))));
 checks.push('offline saved reading uses originals');
 const preview=await browser.newPage({viewport:{width:1200,height:1200}});
 await preview.goto(browser.appURL,{waitUntil:'domcontentloaded',timeout:60000});
 await preview.evaluate(()=>{
  const ids=['ar00','ar08','ar11','ar17','cu01','sw12','pe14','wa13'];document.body.innerHTML='';
  const gallery=document.createElement('div');gallery.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:24px;background:#f6f2e8';
  for(const id of ids){const card=CARDS.find(c=>c.id===id),item=document.createElement('figure');item.style.cssText='margin:0;text-align:center;font:16px sans-serif';const img=new Image();img.src=card.img;img.style.cssText='height:470px;max-width:100%;object-fit:contain';item.append(img);const label=document.createElement('figcaption');label.textContent=card.ko+' · '+id;item.append(label);gallery.append(item);}document.body.append(gallery);
 });
 await preview.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});await preview.screenshot({path:'test-results/original-rws-preview.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const summary={checks,errors,originalCards:cards,totalJPEGBytes:manifest.cards.reduce((n,c)=>n+c.bytes,0),htmlBytes:fs.statSync('index.html').size};
 fs.writeFileSync('test-results/images-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({passed:checks.length,errors,cards:cards.length,htmlBytes:summary.htmlBytes},null,2));
 await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
