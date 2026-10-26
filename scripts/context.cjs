// Replay known v81 failures with the same cards. This is regression data, not a holdout.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const fixture=JSON.parse(fs.readFileSync('tests/generalization-v81.json','utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{const browser=await require('./browser.cjs')();try{
 fs.mkdirSync('.cache',{recursive:true});if(!fs.existsSync('.cache/v81.html'))fs.writeFileSync('.cache/v81.html',require('node:child_process').execFileSync('git',['show','0a8099d:index.html'],{maxBuffer:40*1024*1024}));
 assert.equal(hash(fs.readFileSync('.cache/v81.html')),'7b6a8293f68f568fb07962911e51748f10583b1134e59241c6504c6d7332aa67');
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 const run=async path=>{await page.goto(browser.appURL+path,{waitUntil:'domcontentloaded',timeout:60000});return page.evaluate(groups=>{
  let seed=822026;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},readings=[];
  for(const g of groups)for(const spread of Object.keys(SPREADS)){
   const pool=CARDS.map(c=>c.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   const cards=pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5}));
   g.questions.forEach((question,variant)=>{const r=__arcana79Build(question,spread,cards);readings.push({group:g.id,variant,question,spread,cards,actualIntent:r.arc79.intent.primary,actualDomain:r.arc79.domain,facts:r.arc79.facts,boundary:arc79Scene(question).scene.boundary,direct:r.direct,actions:r.actions,sections:r.sections,context:r.arc82||null});});
  }return readings;
 },fixture.groups);};
 const before=await run('/.cache/v81.html'),after=await run('/');assert.equal(after.length,432);
 assert(before.every((r,i)=>r.question===after[i].question&&r.spread===after[i].spread&&JSON.stringify(r.cards)===JSON.stringify(after[i].cards)));
 const score=rows=>{const questions=rows.filter(r=>r.spread==='three').map(r=>{const g=fixture.groups.find(g=>g.id===r.group),facts=Object.entries(g.facts||{}).map(([key,expected])=>({key,expected,actual:r.facts[key],ok:r.facts[key]===expected}));if(g.boundary!==undefined)facts.push({key:'boundary',expected:g.boundary,actual:r.boundary,ok:r.boundary===g.boundary});return {...r,intentMatch:g.intent===null?null:r.actualIntent===g.intent,domainMatch:g.domain===null?null:r.actualDomain===g.domain,factChecks:facts};});const count=key=>({passed:questions.filter(q=>q[key]===true).length,total:questions.filter(q=>q[key]!==null).length});return {questions,intent:count('intentMatch'),domain:count('domainMatch'),facts:{passed:questions.flatMap(q=>q.factChecks).filter(f=>f.ok).length,total:questions.flatMap(q=>q.factChecks).length}};};
 const old=score(before),fresh=score(after),checks=[];const check=(name,ok)=>{checks.push({name,ok});assert(ok,name);};
 check('all 432 readings preserve every card in detailed evidence',after.every(r=>new Set(r.sections.flatMap(s=>s.refs)).size===r.cards.length));
 check('all event spans point to literal source text',after.every(r=>r.context.model.events.every(e=>r.context.model.question.slice(e.start,e.end)===e.text)));
 check('known missing-context cases ask for context',after.filter(r=>r.group==='underspecified').every(r=>r.context.needsContext&&r.direct.includes('어떤 일')));
 check('both requests remain visible in compound cases',after.filter(r=>r.group==='multiple-requests').every(r=>r.context.answers.length===2&&r.sections.some(s=>s.kind==='request')));
 check('received reply is preserved across the old paraphrases',after.filter(r=>r.group==='received').every(r=>r.facts.replied&&!r.direct.includes('아직 답을 받지 못한')));
 check('waiting for results does not advise submitting the same work again',after.filter(r=>r.group==='pending').every(r=>r.facts.waiting&&!/제출 기준과 마감|문제 풀이를 설명/.test(r.direct)));
 check('sent and unsent remain distinct',after.filter(r=>r.group==='sent').every(r=>r.facts.sent&&r.facts.noReply)&&after.filter(r=>r.group==='unsent').every(r=>!r.facts.sent));
 check('no page errors',errors.length===0);
 // Exercise the real form: context is collected before a draw, then retained through save/export.
 await page.setViewportSize({width:390,height:844});await page.locator('#question').fill('어떻게 할까요?');await page.locator('#startReading').click();
 check('unclear question does not start a draw',await page.locator('.fan-card').count()===0&&await page.locator('#arc82ContextPanel').isVisible());
 await page.locator('#arc82ContextInput').fill('앞선 질문에만 해당하는 상황');await page.locator('#question').fill('그 일이 잘 풀릴까요?');check('changing the base question clears stale context',(await page.locator('#arc82ContextInput').inputValue())==='');await page.locator('#startReading').click();
 await page.locator('#arc82ContextContinue').click();check('empty context stays pending',(await page.locator('#arc82ContextError').innerText()).length>0);
 await page.screenshot({path:'.cache/context-form.png',fullPage:true});
 await page.locator('#arc82ContextInput').fill('친구와 모임을 함께 운영하는데 역할이 겹쳐요');await page.locator('#arc82ContextContinue').click();await page.locator('.fan-card').first().waitFor();
 check('context is added before the draw',(await page.locator('#question').inputValue()).includes('역할이 겹쳐요'));
 await page.locator('#question').fill('모임을 옮길지 남을지 비교하고, 친구에게 결정을 말할 방법도 알려 주세요.');await page.locator('#arc78AutoSpread').click();await page.locator('#startReading').click();await page.locator('.fan-card').first().waitFor();
 const count=await page.evaluate(()=>SPREADS[selectedSpread].slots.length);for(let i=0;i<count;i++){await page.locator('.fan-card').first().focus();await page.keyboard.press('Enter');}await page.locator('#revealAll').waitFor({state:'visible'});await page.locator('#revealAll').click();await page.locator('#report.visible').waitFor();
 const compound=await page.locator('#humanDirect').innerText();check('compound request renders both comparison and communication',compound.includes('비교')&&compound.includes('전달할 결론'));
 check('compound export uses the visible answer',await page.evaluate(()=>readingText().includes($('humanDirect').textContent)));
 await page.locator('#saveReading').click();check('engine version is saved as 82',await page.evaluate(()=>storedRecords()[0].engineVersion===82));
 await page.locator('.nav-item[data-view="history"]').click();await page.locator('#historyList [data-history]').first().click();check('saved reading retains both requests',(await page.locator('#historyDetailContent .human-direct').innerText()).includes('전달할 결론'));
 const folder='test-results/question-model';fs.mkdirSync(folder,{recursive:true});fs.copyFileSync('.cache/context-form.png',folder+'/context-form.png');
 for(const [name,rows]of [['before',before],['after',after]])fs.writeFileSync(folder+'/'+name+'-readings.jsonl.gz',zlib.gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 fs.writeFileSync(folder+'/samples.json',JSON.stringify({before:old.questions,after:fresh.questions},null,2));
 const summary={note:'54 known v81 questions, replayed as development/regression data. Classification scores do not measure professional quality.',appSHA256:hash(fs.readFileSync('index.html')),questions:54,readingsPerVersion:432,before:{intent:old.intent,domain:old.domain,facts:old.facts},after:{intent:fresh.intent,domain:fresh.domain,facts:fresh.facts},checks,errors,failures:fresh.questions.filter(q=>q.intentMatch===false||q.domainMatch===false||q.factChecks.some(f=>!f.ok)).map(q=>({group:q.group,variant:q.variant,question:q.question,intentMatch:q.intentMatch,domainMatch:q.domainMatch,facts:q.factChecks.filter(f=>!f.ok)}))};
 fs.writeFileSync(folder+'/regression-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
