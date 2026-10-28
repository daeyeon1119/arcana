/* Actual known/development and post-freeze outputs, never overwrite a first run. */
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const phase=process.argv[2]||'development';assert(['development','first','regression'].includes(phase));
const known=[...JSON.parse(fs.readFileSync('tests/task-policy-new.json','utf8')).cases.filter(item=>['n05','n09','n15','n16','n21','n22','n24','n29','n31'].includes(item.id)),...JSON.parse(fs.readFileSync('tests/task-policy-fresh.json','utf8')).cases.filter(item=>['f08','f14','f16'].includes(item.id))];
const fixture=phase==='development'?{note:'12 known v83 questions, used as development material. Not an independent/unseen quality evaluation.',cases:known}:JSON.parse(fs.readFileSync('tests/grounding-first.json','utf8'));
const folder='test-results/grounding/'+phase,hash=value=>crypto.createHash('sha256').update(value).digest('hex');fs.mkdirSync(folder,{recursive:true});fs.mkdirSync('.cache',{recursive:true});
const save=async(path,data)=>{const temporary=path+'.'+process.pid+'.tmp';fs.writeFileSync(temporary,data);for(let attempt=0;;attempt++){try{fs.renameSync(temporary,path);return;}catch(error){if(attempt>=2)throw error;await new Promise(resolve=>setTimeout(resolve,150));}}};
if(phase==='first'&&fs.existsSync(folder+'/readings.json'))throw Error('First outputs already exist. Use regression.');
const baseline=execFileSync('git',['show','880916e:index.html'],{maxBuffer:40*1024*1024});assert.equal(hash(baseline),'734c5b56f427b9152b7a31180debf25e541bf23555eeeb23f49b4192189e5f9f');fs.writeFileSync('.cache/grounding-v83.html',baseline);
const freeze={phase,appSHA256:hash(fs.readFileSync('index.html')),baselineSHA256:hash(baseline),fixtureSHA256:hash(JSON.stringify(fixture)),collectorSHA256:hash(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')),seed:840031,note:fixture.note};
if(phase==='first'&&fs.existsSync(folder+'/freeze.json'))assert.deepEqual(JSON.parse(fs.readFileSync(folder+'/freeze.json','utf8')),freeze);fs.writeFileSync(folder+'/freeze.json',JSON.stringify(freeze,null,2));
(async()=>{const browser=await require('./browser.cjs')();try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());await page.goto(browser.appURL+'/.cache/grounding-v83.html',{waitUntil:'domcontentloaded'});
 const catalog=await page.evaluate(()=>({ids:CARDS.map(card=>card.id),names:Object.fromEntries(CARDS.map(card=>[card.id,card.ko])),motifs:ARC81_PROFILES,slots:Object.fromEntries(Object.entries(SPREADS).map(([key,value])=>[key,value.slots.map(slot=>slot[0])]))}));
 const cases=fixture.cases.flatMap(item=>Object.entries(catalog.slots).map(([spread,slots])=>{let seed=840031;for(const char of item.group||item.id)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pool=[...catalog.ids];for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return {...item,spread,cards:pool.slice(0,slots.length).map(id=>({id,rev:rand()<.5}))};}));
 const generate=()=>page.evaluate(cases=>{arc79ForcedIntent='auto';return cases.map(item=>{try{const r=__arcana79Build(item.question,item.spread,item.cards);return {headline:r.headline,direct:r.direct,actions:r.actions,sections:r.sections,requests:r.arc82.answers,evidence:r.arc79.evidence,facts:r.arc79.facts,grounding:r.arc84||null};}catch(error){return {error:error.message};}});},cases);
 const before=await generate();await page.goto(browser.appURL,{waitUntil:'domcontentloaded'});const after=await generate();
 const readings=cases.map((item,index)=>({...item,cardLabels:item.cards.map((card,i)=>catalog.slots[item.spread][i]+' · '+catalog.names[card.id]+' '+(card.rev?'역방향':'정방향')),before:before[index],after:after[index]})),failures=[];
 for(const row of readings){const r=row.after;if(r.error){failures.push({id:row.id,spread:row.spread,error:r.error});continue;}
  if(r.evidence.some((card,i)=>card.id!==row.cards[i].id||card.reverse!==row.cards[i].rev)||new Set(r.sections.flatMap(section=>section.refs)).size!==row.cards.length)failures.push({id:row.id,spread:row.spread,error:'card identity/direction/coverage'});
  if(r.sections.some(section=>!section.refs.length||section.refs.some(i=>!Number.isInteger(i)||i<0||i>=row.cards.length)))failures.push({id:row.id,spread:row.spread,error:'invalid card references'});
  if(/[\u3040-\u30ff]|undefined|\[object Object\]|을를|범위을|분량를|작은 일를|입니다’입니다|개’을|정도’이/.test([r.direct,...r.actions].join(' ')))failures.push({id:row.id,spread:row.spread,error:'malformed output'});
  if(row.before.error)failures.push({id:row.id,spread:row.spread,error:'baseline runtime: '+row.before.error});
  if(phase==='development'){
   const essential={n05:/조건/,n09:/혼자/,n15:/의료진|약사/,n29:/선택지/,f08:/하루\s*20분/}[row.id];
   if(essential&&!essential.test(r.direct))failures.push({id:row.id,spread:row.spread,error:'known essential request/fact omitted'});
  }
  const evidence=r.grounding?.questionEvidence;if(evidence)for(const item of [...evidence.options,...(evidence.optionDefinitions||[]),...evidence.quantities,...evidence.schedules,...evidence.verification])if(evidence.question.slice(item.start,item.end)!==item.text)failures.push({id:row.id,spread:row.spread,error:'literal evidence span mismatch'});
  for(const application of r.grounding?.applications||[])if(application.quantity&&!r.direct.includes(application.quantity.text))failures.push({id:row.id,spread:row.spread,error:'metadata claims an unused quantity'});
  for(const application of r.grounding?.applications||[]){
   if(application.primaryMotif){const card=row.cards[application.refs[0]],primary=card&&catalog.motifs[card.id][card.rev?1:0].split(',')[0];if(application.refs.length!==1||primary!==application.primaryMotif||application.relationAxis)failures.push({id:row.id,spread:row.spread,error:'single-card lens attribution mismatch'});}
   if(application.relationAxis&&application.refs.length!==2)failures.push({id:row.id,spread:row.spread,error:'relation lens attribution mismatch'});
   if(application.replaceGeneric){const practical=r.requests[application.request]?.actionText,beforeActions=row.before.actions||[];if(!beforeActions.some(action=>practical?.includes(action)))failures.push({id:row.id,spread:row.spread,error:'previous practical steps were discarded'});}
  }
  if(phase==='regression'){
   const contract={g09:()=>r.direct.includes('12만원')&&r.direct.includes('40개'),g10:()=>r.direct.includes('장소와 시간은 이미 확인')&&r.direct.includes('요금 숫자는 아직 대조'),g11:()=>r.direct.includes('장소와 시간은 아직 확인')&&r.direct.includes('요금 숫자는 이미 대조'),g16:()=>r.direct.includes('선택지의 내용이 필요'),g17:()=>evidence?.options.length===3&&r.grounding.applications.some(item=>item.operation==='compare'&&item.mode==='common'),g18:()=>r.direct.includes('60분')&&!/A안:\s*30분/.test(r.direct),g19:()=>r.grounding?.applications.some(item=>item.quantity?.text==='20분'),g20:()=>r.grounding?.applications.some(item=>item.quantity?.text==='2시간'),g24:()=>r.direct.includes('.pdf를 함께 읽는 방식')&&r.direct.includes('.pdf를 짧게 읽는 방식')}[row.id];
   if(contract&&!contract())failures.push({id:row.id,spread:row.spread,error:'known corrected fact/option contract'});
  }
 }
 const readingBytes=Buffer.from(JSON.stringify(readings,null,2)),compressed=zlib.gzipSync(readings.map(row=>JSON.stringify(row)).join('\n')+'\n');
 await save(folder+'/readings.json',readingBytes);await save(folder+'/readings.jsonl.gz',compressed);
 const failedReadings=new Set(failures.map(item=>item.id+':'+item.spread)).size;
 const summary={...freeze,readingsSHA256:hash(readingBytes),compressedSHA256:hash(compressed),questions:fixture.cases.length,readingsPerVersion:readings.length,errors,failures,mechanicalChecksPassed:readings.length-failedReadings,qualityReviewed:0,note:(phase==='regression'?'Known questions used for corrections; this is regression, not a new unseen evaluation. Original first-run fixture note follows: ':'')+fixture.note+' Mechanical invariants are not a semantic or professional quality score.'};await save(folder+'/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(errors.length||failures.length)process.exitCode=1;
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
