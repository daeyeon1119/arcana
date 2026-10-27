/* Actual browser cache/offline/update checks. Mobile profiles emulate devices; no physical phone claim. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const release=JSON.parse(fs.readFileSync('release.json','utf8')),checks=[],errors=[];
const specimen=path.resolve('.cache/portable-site/arcana');
assert(specimen.startsWith(path.resolve('.cache')+path.sep));
fs.mkdirSync(specimen,{recursive:true});
for(const file of ['index.html','sw.js','manifest.webmanifest','assets/app/icon.svg','assets/app/icon-192.png','assets/app/icon-512.png','assets/app/apple-touch-icon.png']){fs.mkdirSync(path.dirname(path.join(specimen,file)),{recursive:true});fs.copyFileSync(file,path.join(specimen,file));}
assert.equal(hash(fs.readFileSync('index.html')),release.appSHA256);
assert(fs.readFileSync('sw.js','utf8').includes(release.webRelease));checks.push('release metadata matches exact deployed HTML and worker');
const questions=JSON.parse(fs.readFileSync('tests/portable-cases.json','utf8')).questions;
async function outputs(page){return page.evaluate(questions=>{arc79ForcedIntent='auto';return questions.flatMap(question=>Object.keys(SPREADS).map((spread,s)=>{const cards=Array.from({length:SPREADS[spread].slots.length},(_,i)=>({id:CARDS[(s*7+i)%CARDS.length].id,rev:i%2===1}));return {question,spread,cards,report:__arcana79Build(question,spread,cards)};}));},questions);}
async function ready(page){await page.waitForFunction(()=>document.getElementById('arcanaWebApp')?.dataset.state==='ready',{},{timeout:90000});await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});}
async function draw(page){
 await page.locator('.nav-item[data-view="reader"]').click();await page.locator('#question').fill('이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?');
 await page.locator('#spreads [data-spread="three"]').click();await page.locator('#startReading').click();await page.locator('.fan-card').first().waitFor();
 for(let i=0;i<3;i++){await page.locator('.fan-card').first().focus();await page.keyboard.press('Enter');}
 await page.locator('#revealAll').click();await page.locator('#report.visible').waitFor();
}
(async()=>{
 const browser=await require('./browser.cjs')(),base=browser.appURL+'/.cache/portable-site/arcana/';
 const contexts=[];let reference,backup,backupReport;
 try{
 for(const profile of [{name:'desktop',viewport:{width:1440,height:1000},locale:'ko-KR',timezoneId:'Asia/Seoul'},{name:'android-emulation',viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'en-US',timezoneId:'UTC'},{name:'iphone-emulation',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,locale:'ko-KR',timezoneId:'America/New_York'}]){
  const {name,...options}=profile,context=await browser.newContext({...options,reducedMotion:'reduce'});contexts.push(context);
  await context.route('https://**/*',route=>route.abort());let page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  const actual=await outputs(page);if(!reference)reference=actual;else assert.deepEqual(actual,reference,name+' reading parity');checks.push(name+': 48 fixed question/card readings equal across locale, timezone and screen');
  await page.locator('.nav-item[data-view="about"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const urls=await page.evaluate(async()=>{const names=await caches.keys(),result=[];for(const name of names){if(!name.startsWith('arcana-web:'))continue;const cache=await caches.open(name);result.push(...(await cache.keys()).map(r=>new URL(r.url).pathname));}return result;});
  assert.equal(urls.length,6);assert(urls.every(url=>url.startsWith('/.cache/portable-site/arcana/')));checks.push(name+': complete app cache respects nested deployment scope');
  await context.setOffline(true);await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));await page.goto(base+'?launch=offline',{waitUntil:'domcontentloaded'});await ready(page);assert.deepEqual(await outputs(page),reference);checks.push(name+': offline new tab serves same 48 readings');
  const images=await page.evaluate(async()=>{await Promise.all(CARDS.map(card=>{const image=new Image();image.src=card.img;return image.decode();}));return CARDS.every(card=>card.img.startsWith('data:image/jpeg;base64,'));});assert(images);checks.push(name+': all 78 embedded original JPEGs decode offline');
  if(name==='desktop'){
   await draw(page);await page.locator('#saveReading').click();
   backup=await page.evaluate(()=>({format:'ARCANA_BACKUP',schema_version:2,records:storedRecords()}));assert.equal(backup.records.length,1);checks.push('offline draw/reveal/save works without a model server');
   backupReport=await page.evaluate(()=>withSavedReading(storedRecords()[0],()=>arcanaV5Build()));
  }else{
   const restored=await page.evaluate(data=>{const result=a22ImportData(data),record=storedRecords()[0];return {added:result.added,question:record.question,cards:record.drawn,report:withSavedReading(record,()=>arcanaV5Build())};},backup);
   assert.equal(restored.added,1);assert.equal(restored.question,backup.records[0].question);assert.deepEqual(restored.cards,backup.records[0].drawn);assert.deepEqual(restored.report,backupReport);checks.push(name+': backup restores the same question/cards/report without cloud sync');
  }
  await page.locator('.nav-item[data-view="about"]').click();await page.locator('#arcanaWebApp').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/portable-'+name+'.png'});
 }
 const context=contexts[0],page=context.pages()[0];await context.setOffline(false);
 const originalWorker=fs.readFileSync('sw.js','utf8'),originalApp=fs.readFileSync('index.html','utf8');
 await page.evaluate(async()=>{await caches.open('unrelated-test-cache');const reg=await navigator.serviceWorker.getRegistration();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant')window.__failedUpdate=true;});});});
 fs.writeFileSync(path.join(specimen,'sw.js'),originalWorker.replace(release.appSHA256,'0'.repeat(64)).replace(release.webRelease,'TEST_ONLY_BROKEN_RELEASE'));
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});await page.waitForFunction(()=>window.__failedUpdate===true,{},{timeout:90000});
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await ready(page);assert.deepEqual(await outputs(page),reference);assert.equal(await page.evaluate(()=>storedRecords().length),1);checks.push('mismatched update is rejected and old offline app and records survive');
 await context.setOffline(false);
 await draw(page);const inProgress=await page.evaluate(()=>({cards:drawn,question:document.getElementById('question').value}));
 const updatedApp=originalApp.replace('</head>','<meta name="arcana-test-release" content="updated"></head>'),updatedHash=hash(updatedApp);
 fs.writeFileSync(path.join(specimen,'index.html'),updatedApp);fs.writeFileSync(path.join(specimen,'sw.js'),originalWorker.replace(release.appSHA256,updatedHash).replace(release.webRelease,'TEST_ONLY_VALID_RELEASE'));
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});await page.waitForFunction(()=>document.getElementById('arcanaWebApp').dataset.state==='update',{},{timeout:90000});
 await page.locator('.nav-item[data-view="about"]').click();assert.equal(await page.locator('meta[name="arcana-test-release"]').count(),0);checks.push('new release waits for the user instead of replacing the current page');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#arcanaWebUpdate').click();assert.deepEqual(await page.evaluate(()=>({cards:drawn,question:document.getElementById('question').value})),inProgress);checks.push('declining update preserves the current unsaved reading');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#arcanaWebUpdate').click();await page.waitForSelector('meta[name="arcana-test-release"]',{state:'attached',timeout:90000});await ready(page);
 assert.equal(await page.evaluate(()=>storedRecords().length),1);assert.deepEqual(await outputs(page),reference);
 const cachesAfter=await page.evaluate(()=>caches.keys());assert(cachesAfter.includes('unrelated-test-cache'));assert.equal(cachesAfter.filter(name=>name.startsWith('arcana-web:')).length,1);checks.push('accepted update preserves records and removes only this app’s old cache');
 const blocked=await browser.newContext({serviceWorkers:'block'});contexts.push(blocked);const fallback=await blocked.newPage();await fallback.route('https://**/*',route=>route.abort());await fallback.goto(base,{waitUntil:'domcontentloaded'});await fallback.waitForFunction(()=>document.getElementById('arcanaWebApp').dataset.state==='unavailable');assert.deepEqual(await outputs(fallback),reference);checks.push('blocked service workers leave online reading available and never claim offline readiness');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('test-results/portable-summary.json',JSON.stringify({release,checks,errors,browser:await browser.version(),profiles:3,questionCardCombinationsPerProfile:48,readingParitySHA256:hash(JSON.stringify(reference)),note:'Actual browser cache, network-offline and update tests. Android/iPhone profiles are Chromium emulations, not physical phone or Safari tests. Reading equality does not prove professional quality.'},null,2));
 console.log(JSON.stringify({checks:checks.length,errors,readingParity:true,offline:true,update:true},null,2));
 }finally{for(const context of contexts)await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
