/* Opt-in real public Chrome UI flows. Mobile touch is emulated, not physical Android. */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),save=require('./save-artifact.cjs');
const base='https://daeyeon1119.github.io/arcana/',release=require('../release.json'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(/(?:^|[\\/])chrome(?:\.exe)?$/i.test(process.env.ARCANA_BROWSER||''),'Set ARCANA_BROWSER to the installed Chrome binary; this check must not label Edge as Chrome.');
const cases=[['one','이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?'],['three','이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?'],['five','이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?'],['celtic','이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?'],['relationship5','친구에게 이미 연락했는데 답장이 없어요. 어떻게 해야 할까요?'],['choice5','완성한 원고를 출판할지 공모전에 낼지 고민이에요.'],['waiting3','시험 결과가 아직 안 나왔어요. 합격할까요?'],['career5','이직할 때 무엇부터 해야 할까요?']];
async function ready(page){await page.waitForFunction(()=>document.getElementById('arcanaWebApp')?.dataset.state==='ready',{},{timeout:120000});await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});}
(async()=>{
 const response=await fetch(base+'release.json',{cache:'no-store'});assert(response.ok);assert.deepEqual(await response.json(),release);
 const browser=await require('./browser.cjs')(),results=[],errors=[],origins=new Set();try{
  for(const profile of [{name:'chrome-desktop',viewport:{width:1440,height:1000}},{name:'chrome-mobile-emulation',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}]){
   const {name,...options}=profile,context=await browser.newContext({...options,locale:'ko-KR',reducedMotion:'reduce'}),flows=[];
   try{
    context.on('request',request=>{if(/^https?:/.test(request.url()))origins.add(new URL(request.url()).origin);});await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    let page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});await ready(page);
    const cacheHashes=await page.evaluate(async()=>{const hashes=[];for(const name of await caches.keys()){if(!name.startsWith('arcana-web:'))continue;const entry=await (await caches.open(name)).match(new URL('index.html',location.href).href);if(entry)hashes.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await entry.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join(''));}return hashes;});assert.deepEqual(cacheHashes,[release.appSHA256]);
    const draw=async(spread,question,offline)=>{
     await page.locator('.nav-item[data-view="reader"]').click();await page.locator('#question').fill(question);
     const button=page.locator('#spreads [data-spread="'+spread+'"]');
     if(await button.isVisible())await button.click();else await page.locator('#arc78AutoSpread').click();
     assert.equal(await page.evaluate(()=>selectedSpread),spread,'actual visible/automatic spread selection');await page.locator('#startReading').click();await page.locator('.fan-card').first().waitFor();
     const count=await page.evaluate(()=>SPREADS[selectedSpread].slots.length);
     for(let i=0;i<count;i++){const card=page.locator('.fan-card').last();if(options.hasTouch)await card.tap();else await card.click();}
     await page.locator('#revealAll').waitFor({state:'visible'});await page.locator('#revealAll').click();await page.locator('#report.visible').waitFor();
     await page.waitForFunction(n=>document.getElementById('arc79-indicator')?.textContent.includes(n+'장'),count);
     const actual=await page.evaluate(async()=>{const stage=document.getElementById('readingCards'),board=stage.querySelector('.v17-board-grid');await Promise.all([...stage.querySelectorAll('img')].map(i=>{i.loading='eager';return i.decode();}));return {cards:drawn.map(c=>({id:c.id,rev:c.rev})),opened:opened.size,direct:document.getElementById('humanDirect').textContent.trim(),exportText:readingText(),overflow:document.documentElement.scrollWidth>innerWidth,stageWidth:stage.clientWidth,boardWidth:board.getBoundingClientRect().width,names:[...stage.querySelectorAll('.drawn-name')].filter(e=>getComputedStyle(e).display!=='none').length};});
     assert.equal(actual.cards.length,count);assert.equal(actual.opened,count);assert.equal(new Set(actual.cards.map(c=>c.id)).size,count);assert(actual.direct.length>0&&actual.exportText.includes(actual.direct));assert.equal(actual.names,0);assert.equal(actual.overflow,false);assert(actual.boardWidth<=actual.stageWidth+1);
     await page.locator('#saveReading').click();const stored=await page.evaluate(()=>{const record=storedRecords()[0];return {id:record.id,question:record.question,cards:record.drawn};});assert.equal(stored.question,question);assert.deepEqual(stored.cards.map(c=>({id:c.id,rev:c.rev})),actual.cards);
     await page.locator('.nav-item[data-view="history"]').click();await page.locator('#historyList [data-history]').first().click();assert((await page.locator('#historyDetailContent .human-direct').innerText()).includes(actual.direct));
     const row={spread,question,offline,inputMethod:options.hasTouch?'emulated touchscreen tap':'desktop pointer click',cards:actual.cards,direct:actual.direct,historyContainsSameAnswer:true,recordId:stored.id,opened:count,openedNames:actual.names,stageWidth:actual.stageWidth,boardWidth:actual.boardWidth};flows.push(row);
     console.log(name,offline?'offline':'online',spread,'draw/reveal/save/history OK');
    };
    for(const [spread,question] of cases)await draw(spread,question,false);
    const savedBefore=await page.evaluate(()=>storedRecords());assert.equal(savedBefore.length,8);
    await context.setOffline(true);await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));await page.goto(base+'?launch=offline-ui-check',{waitUntil:'domcontentloaded',timeout:90000});await ready(page);assert.deepEqual(await page.evaluate(()=>storedRecords()),savedBefore);
    await page.locator('.nav-item[data-view="history"]').click();await page.locator('#historyList [data-history]').first().click();assert((await page.locator('#historyDetailContent .human-direct').innerText()).includes(flows.at(-1).direct));
    await draw('three','오프라인에서도 이번 작업에서 배운 점을 돌아보려면 무엇을 살펴볼까요?',true);assert.equal(await page.evaluate(()=>storedRecords().length),9);
    await page.reload({waitUntil:'domcontentloaded'});await ready(page);assert.equal(await page.evaluate(()=>storedRecords().length),9);await page.locator('.nav-item[data-view="history"]').click();await page.locator('#historyList [data-history]').first().click();assert((await page.locator('#historyDetailContent .human-direct').innerText()).includes(flows.at(-1).direct));
    await page.screenshot({path:'.cache/'+name+'-public-offline-history.png',fullPage:true});results.push({name,userAgent:await page.evaluate(()=>navigator.userAgent),flows,offlineNewTabPreservesEightRecords:true,offlineDrawSaveAndReloadPreservesNinthRecord:true});
   }finally{await context.close();}
  }
  assert.deepEqual(errors,[]);assert([...origins].every(origin=>[new URL(base).origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(origin)));
  const result={url:base,release,collectorSHA256:hash(fs.readFileSync(__filename)),browser:await browser.version(),profiles:results,errors,requestedOrigins:[...origins],physicalAndroidControlled:false,airplaneModeOnPhysicalDeviceTested:false,scope:'Actual public HTTPS Google Chrome on Windows with isolated synthetic test profiles. One desktop pointer profile and one standard 390x844 mobile touch emulation. No personal device diagnostic or personal saved reading is collected. Network-offline uses browser network control, not physical airplane mode. No physical phone UI or professional quality claim.'};
  save('.cache/public-flow-check.json',JSON.stringify(result,null,2));console.log('All 18 actual UI flows and offline persistence checks passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
