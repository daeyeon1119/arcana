/* Actual v82/v83 outputs, with immutable first-run evidence separate from development. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process');
const phase=process.argv[2]||'development';assert(['development','first','regression','fresh'].includes(phase),'Unknown evaluation phase');
const fixturePath=phase==='development'?'tests/task-policy-dev.json':phase==='fresh'?'tests/task-policy-fresh.json':'tests/task-policy-new.json';
let fixtureText=fs.readFileSync(fixturePath,'utf8').replace(/\r\n/g,'\n');const fixture=JSON.parse(fixtureText),folder='test-results/task-policy/'+phase;
if(phase==='regression'){
 const expectations=JSON.parse(fs.readFileSync('tests/task-policy-regression-expectations.json','utf8'));
 for(const item of fixture.cases){const override=expectations.overrides[item.id];if(override){item.operation=override.operation;item.regressionExpectationReason=override.reason;}}
 fixture.note+=' '+expectations.note;fixtureText=JSON.stringify(fixture);
}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline=execFileSync('git',['show','56b357c:index.html'],{maxBuffer:40*1024*1024});assert.equal(hash(baseline),'fe5c43e5e612c67b5bfbee7b57f9d14b5ea56a05e94d626b47306aacc7aab3cb');
fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/task-v82.html',baseline);fs.mkdirSync(folder,{recursive:true});
const freeze={appSHA256:hash(fs.readFileSync('index.html')),baselineSHA256:hash(baseline),fixtureSHA256:hash(fixtureText),policySHA256:hash(fs.readFileSync('src/task-policy.js','utf8').replace(/\r\n/g,'\n')),collectorSHA256:hash(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')),seed:830031,phase,note:fixture.note};
if(['first','fresh'].includes(phase)&&fs.existsSync(folder+'/readings.json'))throw Error('First outputs already exist; use regression instead of replacing them.');
if(['first','fresh'].includes(phase)&&fs.existsSync(folder+'/freeze.json'))assert.deepEqual(JSON.parse(fs.readFileSync(folder+'/freeze.json','utf8')),freeze,'Frozen first evaluation changed');
fs.writeFileSync(folder+'/freeze.json',JSON.stringify(freeze,null,2));
(async()=>{
 const browser=await require('./browser.cjs')(),errors=[];try{
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());
 await page.goto(browser.appURL+'/.cache/task-v82.html',{waitUntil:'domcontentloaded'});
 const catalog=await page.evaluate(()=>({ids:CARDS.map(card=>card.id),names:Object.fromEntries(CARDS.map(card=>[card.id,card.ko])),positions:Object.fromEntries(Object.entries(SPREADS).map(([key,value])=>[key,value.slots.map(slot=>slot[0])])),spreads:Object.fromEntries(Object.entries(SPREADS).map(([key,value])=>[key,value.slots.length]))}));
 const specimens=fixture.cases.flatMap((item,index)=>Object.entries(catalog.spreads).map(([spread,count])=>{
  let seed=830031;for(const char of item.group||item.id)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pool=[...catalog.ids];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return {...item,spread,cards:pool.slice(0,count).map(id=>({id,rev:rand()<0.5}))};
 }));
 const generate=()=>page.evaluate(cases=>{arc79ForcedIntent='auto';return cases.map(item=>{try{const report=__arcana79Build(item.question,item.spread,item.cards);return {direct:report.direct,headline:report.headline,actions:report.actions,sections:report.sections,facts:report.arc79.facts,requests:report.arc82.answers,policy:report.arc83||null,evidence:report.arc79.evidence};}catch(error){return {error:error.message};}});},specimens);
 const before=await generate();await page.goto(browser.appURL,{waitUntil:'domcontentloaded'});const after=await generate();
 const readings=specimens.map((item,index)=>({...item,cardLabels:item.cards.map((card,position)=>catalog.positions[item.spread][position]+' · '+catalog.names[card.id]+' '+(card.rev?'역방향':'정방향')),before:before[index],after:after[index]})),failures=[];let routingPassed=0,cardPassed=0;
 for(const row of readings){
  const actual=row.after;if(actual.error||row.before.error){failures.push({id:row.id,spread:row.spread,error:actual.error||row.before.error});continue;}
  const tasks=actual.policy?.handled.map(task=>task.operation)||[],specialized=actual.requests.map(task=>task.actionTask).filter(Boolean);
  const matched=row.operation===null?tasks.length===0:tasks.includes(row.operation)||row.specialized&&specialized.includes(row.operation);
  if(matched)routingPassed++;else failures.push({id:row.id,spread:row.spread,expectedOperation:row.operation,actual:tasks,specialized});
  if(actual.evidence.some((card,index)=>card.id!==row.cards[index].id||card.reverse!==row.cards[index].rev)||new Set(actual.sections.flatMap(section=>section.refs)).size!==row.cards.length)failures.push({id:row.id,spread:row.spread,error:'card evidence mismatch'});else cardPassed++;
  if(/undefined|\[object Object\]|은는|을를/.test([actual.direct,...actual.actions].join(' ')))failures.push({id:row.id,spread:row.spread,error:'malformed visible text'});
 }
 fs.writeFileSync(folder+'/readings.json',JSON.stringify(readings,null,2));fs.writeFileSync(folder+'/readings.jsonl.gz',zlib.gzipSync(readings.map(row=>JSON.stringify(row)).join('\n')+'\n'));
 const summary={...freeze,questions:fixture.cases.length,readingsPerVersion:readings.length,errors,failures,checks:{routing:routingPassed,cardEvidence:cardPassed},qualityReviewed:0,note:fixture.note+' Routing checks are not semantic or professional quality scores.'};
 fs.writeFileSync(folder+'/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(errors.length||failures.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
