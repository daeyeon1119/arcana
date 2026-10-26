const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
// Reviewer UI checks always use an isolated context, never the model-cache profile.
process.env.ARCANA_MODEL_DIAGNOSTIC='0';
(async()=>{const b=await require('./browser.cjs')();try{
 const p=await b.newPage({viewport:{width:390,height:844}}),checks=[],errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(b.appURL)&&!r.url().startsWith('data:'))external.push(r.url());});
 const check=(name,ok)=>{checks.push({name,ok});assert(ok,name);};
 await p.goto(b.appURL+'/test-results/local-reader/native-first/blind-review.html');
 const metadata=await p.evaluate(()=>({cases:DATA.cases.length,records:DATA.cases.filter(c=>c.fingerprint).length,paired:DATA.cases.filter(c=>c.candidates?.every(Boolean)).length,art:Object.entries(DATA.art)}));
 check('every fixed case remains visible, including pending and failed runs',await p.locator('#caseSelect option').count()===15);
 check('source names are not visible in the answer panels',!/Qwen|v82|규칙 엔진/.test(await p.locator('#answers').innerText()));
 check('unrated scores start empty',await p.locator('[data-axis]').evaluateAll(es=>es.every(e=>e.value==='')));
 const manifest=JSON.parse(fs.readFileSync('assets/rws/manifest.json','utf8'));for(const [id,url]of metadata.art){const raw=Buffer.from(url.split(',')[1],'base64');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.cards.find(c=>c.id===id).sha256);}
 check('all embedded cards are exact original JPEGs',metadata.art.length>0);
 const slot=await p.locator('[data-axis]').first().getAttribute('data-candidate');await p.locator('[data-axis]').first().selectOption('0');await p.locator('#evidence-'+slot).fill('TEST ONLY: 실제 검토 점수로 집계하지 않는 브라우저 동작 검사입니다.');await p.locator('#preference').selectOption('neither');
 const [download]=await Promise.all([p.waitForEvent('download'),p.locator('#export').click()]);const review=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 check('export retains an explicit zero and leaves all other axes unrated',Object.values(review.records[0].ratings[slot].scores).length===1&&Object.values(review.records[0].ratings[slot].scores)[0]===0);
 check('review fingerprint binds to the exact compared answers',await p.evaluate(f=>DATA.cases[0].fingerprint===f,review.records[0].comparisonSHA256));
 check('source mapping is excluded from the reviewer export',!JSON.stringify(review).includes('Qwen')&&!JSON.stringify(review).includes('v82'));
 await p.reload();check('same comparison restores the local draft',await p.locator('[data-axis]').first().inputValue()==='0');
 const failed=await p.evaluate(()=>DATA.cases.findIndex(c=>c.candidates?.some(x=>!x)));if(failed>=0){await p.locator('#caseSelect').selectOption(String(failed));check('an unavailable answer has no score controls',await p.locator('[data-axis]').count()===6);}
 for(const width of [360,390,1440]){await p.setViewportSize({width,height:900});check('review layout stays inside '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:390,height:844});await p.locator('#caseSelect').selectOption('0');await p.locator('#tabB').click();check('mobile answer tabs switch without changing cards',await p.locator('[aria-label="답변 B"]').evaluate(e=>getComputedStyle(e).display!=='none'));
 await p.screenshot({path:'test-results/local-reader/native-first/blind-preview.png'});
 await p.evaluate(()=>{for(const c of DATA.cases)if(c.fingerprint)localStorage.removeItem('arcana-blind-'+c.fingerprint);});
 check('no page errors or external requests',errors.length===0&&external.length===0);
 fs.writeFileSync('test-results/local-reader/blind-ui-summary.json',JSON.stringify({checks,errors,externalRequests:external.length,caseCount:metadata.cases,recordCount:metadata.records,pairedCount:metadata.paired,note:'UI behavior tests use explicitly labeled test-only ratings in an isolated browser. They are not human or expert reviews and no reviewer export is committed.'},null,2));console.log(JSON.stringify({checks:checks.length,allPassed:true,...metadata,art:metadata.art.length},null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
