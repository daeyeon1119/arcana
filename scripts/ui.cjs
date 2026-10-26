const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await require('./browser.cjs')();const checks=[],errors=[];
 try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
 fs.mkdirSync('test-results',{recursive:true});
 await p.goto(browser.appURL+'/ARCANA_tarot_v78_source/html/ARCANA_tarot_v78.html',{waitUntil:'domcontentloaded'});
 await p.screenshot({path:'test-results/before-desktop.png',fullPage:true});
 await p.goto(browser.appURL,{waitUntil:'domcontentloaded'});
 for(const width of [360,390,768,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);checks.push(`no horizontal overflow ${width}`);}
 await p.setViewportSize({width:1440,height:1000});
 assert.equal(await p.locator('#spreads [data-spread]:visible').count(),4);
 assert.equal(await p.locator('#specialSpreads').isVisible(),false);checks.push('four visible spread choices');
 assert.equal(await p.locator('#arc79IntentOverride option').count(),7);
 for(const [question,expected] of [['완성한 원고를 출판할지 공모전에 낼지 고민이에요.','choice5'],['시험 결과가 아직 안 나왔어요. 합격할까요?','waiting3'],['이직할 때 무엇부터 해야 할까요?','career5']]){await p.locator('#question').fill(question);await p.locator('#arc78AutoSpread').click();assert.equal(await p.evaluate(()=>selectedSpread),expected);}
 await p.locator('#spreads [data-spread="three"]').click();assert.equal(await p.locator('#arc78AutoSpread').getAttribute('aria-pressed'),'false');checks.push('current parser in auto spread / manual override');
 await p.locator('[data-example]').first().click();assert((await p.locator('#question').inputValue()).includes('이직'));
 assert((await p.locator('#arc79Count').innerText()).includes('/ 500'));checks.push('question examples / count');
 await p.locator('#question').fill('친구에게 이미 연락했는데 답장이 없어요. 어떻게 해야 할까요?');
 await p.locator('#arc78AutoSpread').click();assert.equal(await p.evaluate(()=>selectedSpread),'relationship5');checks.push('automatic relationship spread');
 await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'test-results/after-desktop.png',fullPage:true});
 await p.setViewportSize({width:390,height:844});
 await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'test-results/after-mobile.png',fullPage:true});
 await p.locator('#reversals').uncheck();await p.locator('#arc79IntentOverride').selectOption('action');
 await p.locator('#startReading').click();await p.locator('.fan-card').first().waitFor();
 // Keyboard selection avoids overlapping fan faces and tests accessible button operation.
 for(let i=0;i<5;i++){await p.locator('.fan-card').first().focus();await p.keyboard.press('Enter');}
 await p.locator('#revealAll').waitFor({state:'visible'});await p.locator('#revealAll').click();
 await p.locator('#report.visible').waitFor();
 await p.waitForFunction(()=>!!document.getElementById('arc79-indicator'));
 assert.equal(await p.evaluate(()=>drawn.length),5);assert.equal(await p.evaluate(()=>drawn.every(c=>!c.rev)),true);
 const direct=await p.locator('#humanDirect').innerText();assert(direct.includes('이미 마음을 전했고'));
 assert.equal(await p.evaluate(()=>readingText().includes(document.getElementById('humanDirect').textContent)),true);
 assert.equal(await p.locator('#report #a33Panel').count(),0);checks.push('mobile draw / reveal / same answer in export / upright only');
 await p.locator('#report .human-reading').screenshot({path:'test-results/after-reading.png'});
 await p.locator('[data-followup="지금 구체적으로 무엇부터 해야 하나요?"]').click();
 assert((await p.locator('#followupResult').innerText()).includes('정방향'));
 assert.equal(await p.evaluate(()=>readingText().includes('[추가 질문]')),true);checks.push('follow-up uses current cards and appears in export');
 await p.locator('#saveReading').click();assert.equal(await p.evaluate(()=>storedRecords().length),1);
 assert.equal(await p.evaluate(()=>storedRecords()[0].intentOverride),'action');
 await p.locator('.nav-item[data-view="history"]').click();await p.locator('#historyList [data-history]').first().click();
 assert((await p.locator('#historyDetailContent .human-direct').innerText()).includes(direct));checks.push('saved reading / manual intent / follow-up retained');
 // Backup round trip, duplicates, invalid IDs, prototype keys and malformed storage.
 const backup=await p.evaluate(()=>{
  const record=storedRecords()[0],data={format:'ARCANA_BACKUP',schema_version:2,records:[record]};
  localStorage.removeItem('arcana_records_v1');const first=a22ImportData(data),second=a22ImportData(data);
  const bad={...record,spread:'constructor'};const invalid=a22ValidateRecord(bad)===false;
  const duplicate={...record,drawn:record.drawn.map(()=>record.drawn[0])};
  const unique=a22ValidateRecord(duplicate)===false;
  const live=v11FollowupLog;v11FollowupLog=[{question:'LIVE_ONLY',answer:'LIVE_ONLY',ref:'x'}];
  const isolated=!withSavedReading(record,()=>readingText()).includes('LIVE_ONLY');v11FollowupLog=live;
  localStorage.setItem('arcana_records_v1','{}');const safe=storedRecords().length===0;localStorage.setItem('arcana_records_v1',JSON.stringify([record]));
  return {added:first.added,duplicate:second.added,invalid,unique,safe,isolated};
 });assert.deepEqual(backup,{added:1,duplicate:0,invalid:true,unique:true,safe:true,isolated:true});checks.push('backup merge / invalid records / malformed storage / isolated follow-up logs');
 await p.locator('.nav-item[data-view="reader"]').click();
 await p.locator('#question').fill('다른 질문입니다.');assert.equal(await p.evaluate(()=>ritualPhase),'idle');assert.equal(await p.locator('#report').evaluate(e=>e.classList.contains('visible')),false);checks.push('editing question invalidates old draw');
 // All eight complete UI paths, including custom spread slot counts.
 for(const spread of await p.evaluate(()=>Object.keys(SPREADS))){
  await p.evaluate(s=>{document.querySelector(`[data-spread="${s}"]`).click();},spread);
  await p.locator('#startReading').click();await p.locator('.fan-card').first().waitFor();
  const count=await p.evaluate(()=>SPREADS[selectedSpread].slots.length);
  for(let i=0;i<count;i++){await p.locator('.fan-card').first().focus();await p.keyboard.press('Enter');}
  await p.locator('#revealAll').waitFor({state:'visible'});await p.locator('#revealAll').click();
  await p.waitForFunction(n=>document.getElementById('arc79-indicator')?.textContent.includes(n+'장'),count);
  assert.equal(await p.evaluate(()=>opened.size),count);checks.push(`draw/reveal ${spread} ${count}`);
 }
 // Modal focus is restored on Escape and Tab remains within it.
 await p.locator('.nav-item[data-view="library"]').click();await p.locator('[data-card]').first().click();
 await p.locator('#modalClose').waitFor({state:'visible'});await p.keyboard.press('Tab');assert.equal(await p.locator('#modalClose').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#modalBackdrop').evaluate(e=>e.classList.contains('show')),false);checks.push('card dialog keyboard trap / Escape');
 const edge=await p.evaluate(()=>{
  const cards=[{id:'ar00',rev:false}];
  const invalid=[()=>__arcana79Build('q','unknown',cards),()=>__arcana79Build('q','one',[]),()=>__arcana79Build('q','one',[{id:'bad',rev:false}]),()=>__arcana79Build('q','one',[{id:'ar00',rev:'false'}]),()=>__arcana79Build('가'.repeat(501),'one',cards)];
  const rejects=invalid.every(f=>{try{f();return false}catch{return true}});
  const next=arc79Scene('지난 시험은 불합격했어요. 다음 시험은 합격할까요?');
  const manual=__arcana79Build('오늘 나를 돌아봅니다.','one',cards,'career').arc79.domain;
  const empty=__arcana79Build('','one',cards).direct;
  return {rejects,next:next.scene.facts.known===false,manual,empty:!!empty};
 });assert.deepEqual(edge,{rejects:true,next:true,manual:'career',empty:true});checks.push('invalid inputs / next attempt / manual domain / empty question');
 assert.deepEqual(errors,[]);checks.push('no browser page errors / external requests blocked');
 fs.writeFileSync('test-results/ui-summary.json',JSON.stringify({checks,errors,browser:await browser.version()},null,2));console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
