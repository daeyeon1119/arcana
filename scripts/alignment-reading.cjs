/* Same-input actual reading comparisons. First outputs must never be replaced. */
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const phase=process.argv[2]||'development';assert(['development','first','regression'].includes(phase));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const existing=fs.readFileSync('tests/editorial-320.tsv','utf8').trim().split(/\r?\n/).slice(1).map((line,index)=>({id:'e'+(index+1),question:line.split('\t')[1]}));
const known=existing.filter(item=>['e114','e136','e141','e173','e179','e234','e293'].includes(item.id)).map(item=>({...item,expectedComparison:false}));
known.push(...JSON.parse(fs.readFileSync('tests/grounding-first.json','utf8')).cases.filter(item=>['g13','g14','g16','g17','g18'].includes(item.id)).map(item=>({...item,expectedComparison:true})));
const fixture=phase==='development'?{note:'12 existing questions used for development. Not unseen or independent expert evidence.',cases:known}:JSON.parse(fs.readFileSync('tests/alignment-first.json','utf8'));
const major=Number(JSON.parse(fs.readFileSync('package.json','utf8')).version.split('.')[0]);if(major!==85&&phase==='first')throw Error('The v85 fixture is known material; use regression.');
const folder='test-results/alignment/'+(major===85?'':'v'+major+'/')+phase;fs.mkdirSync(folder,{recursive:true});fs.mkdirSync('.cache',{recursive:true});
if(phase==='first'&&fs.existsSync(folder+'/readings.json'))throw Error('First outputs already exist. Use regression.');
const baseline=execFileSync('git',['show','40a9df9:index.html'],{maxBuffer:40*1024*1024});assert.equal(hash(baseline),'0b26b25e8fdb201d6298632c7c799293a1613a9d0f078b18a512c1563932aac0');fs.writeFileSync('.cache/alignment-v84.html',baseline);
const freeze={phase,appSHA256:hash(fs.readFileSync('index.html')),baselineSHA256:hash(baseline),fixtureSHA256:hash(JSON.stringify(fixture)),collectorSHA256:hash(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')),seed:850041,note:(phase==='regression'?'Known questions corrected after first evaluation. This run is regression, not a fresh holdout. ':'')+fixture.note};
if(phase==='first'&&fs.existsSync(folder+'/freeze.json'))assert.deepEqual(JSON.parse(fs.readFileSync(folder+'/freeze.json','utf8')),freeze);
fs.writeFileSync(folder+'/freeze.json',JSON.stringify(freeze,null,2));
const save=(name,bytes)=>{const target=folder+'/'+name,temporary=target+'.tmp';fs.writeFileSync(temporary,bytes);fs.renameSync(temporary,target);};
(async()=>{const browser=await require('./browser.cjs')();try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());await page.goto(browser.appURL+'/.cache/alignment-v84.html',{waitUntil:'domcontentloaded'});
 const catalog=await page.evaluate(()=>({ids:CARDS.map(card=>card.id),names:Object.fromEntries(CARDS.map(card=>[card.id,card.ko])),slots:Object.fromEntries(Object.entries(SPREADS).map(([key,value])=>[key,value.slots.map(slot=>slot[0])]))}));
 const cases=fixture.cases.flatMap(item=>Object.entries(catalog.slots).map(([spread,slots])=>{let seed=850041;for(const char of item.group||item.id)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},pool=[...catalog.ids];for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return {...item,spread,cards:pool.slice(0,slots.length).map(id=>({id,rev:rand()<.5}))};}));
 const generate=()=>page.evaluate(cases=>cases.map(item=>{try{arc79ForcedIntent=item.focus||'auto';return __arcana79Build(item.question,item.spread,item.cards,item.domain||'auto');}catch(error){return {error:error.message};}}),cases);
 const before=await generate();await page.goto(browser.appURL,{waitUntil:'domcontentloaded'});const after=await generate();
 const rows=cases.map((item,index)=>({...item,cardLabels:item.cards.map((card,i)=>catalog.slots[item.spread][i]+' · '+catalog.names[card.id]+' '+(card.rev?'역방향':'정방향')),before:before[index],after:after[index]})),failures=[],expectations=phase==='regression'?JSON.parse(fs.readFileSync('tests/alignment-regression-expectations.json','utf8')).cases:{};
 for(const row of rows){const report=row.after,fail=error=>failures.push({id:row.id,spread:row.spread,error});
  if(report.error){fail(report.error);continue;}
  if(row.before.error)fail('baseline: '+row.before.error);
  if(report.arc79.evidence.some((card,i)=>card.id!==row.cards[i].id||card.reverse!==row.cards[i].rev))fail('card identity or orientation changed');
  if(new Set(report.sections.flatMap(section=>section.refs)).size!==row.cards.length)fail('drawn card coverage lost');
  if(report.sections.some(section=>!section.refs.length||section.refs.some(i=>!Number.isInteger(i)||i<0||i>=row.cards.length)))fail('invalid card reference');
  if(/undefined|NaN|\[object Object\]|을를/.test(report.direct))fail('malformed direct text');
  const expected=expectations[row.id];if(expected){
   if(JSON.stringify(report.arc82.answers.map(answer=>answer.request.kind))!==JSON.stringify(expected.kinds))fail('known request coverage contract');
   if(expected.actions&&JSON.stringify(report.arc82.answers.filter(answer=>['action','emotion'].includes(answer.request.kind)).map(answer=>answer.actionTask))!==JSON.stringify(expected.actions))fail('known practical operation metadata contract');
   if(expected.needsContext&&!report.arc82.needsContext)fail('known missing context contract');
  }
  if(row.spread==='choice5'&&!report.arc82.needsContext){
   if(report.arc81.choiceAssignment.assigned!==row.expectedComparison)fail('comparison assignment disagrees with authored request expectation');
   if(!row.expectedComparison){
    if(report.arc81.relations.some(link=>link.kind==='alternatives')||/A를 살필|B를 살필/.test(report.direct))fail('non-comparison request inherits alternative interpretation');
    if(report.arc81.directRelationRefs.some(i=>i===1||i===2))fail('unassigned alternatives become a direct pair');
    if(!report.arc81.choiceAssignment.note||![1,2].every(i=>report.sections.some(section=>section.kind==='card'&&section.refs.length===1&&section.refs[0]===i&&section.title.includes('선택지 미지정'))))fail('unassigned positions are hidden or mislabeled');
   }
  }
 }
 const bytes=Buffer.from(JSON.stringify(rows,null,2)),compressed=zlib.gzipSync(rows.map(row=>JSON.stringify(row)).join('\n')+'\n');save('readings.json',bytes);save('readings.jsonl.gz',compressed);
 const summary={...freeze,readingsSHA256:hash(bytes),compressedSHA256:hash(compressed),questions:fixture.cases.length,readingsPerVersion:rows.length,errors,failures,mechanicalPassed:rows.length-new Set(failures.map(item=>item.id+':'+item.spread)).size,qualityScore:null,note:freeze.note+' Dispatch/position contracts are not semantic quality or expert scores.'};save('summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(errors.length||failures.length)process.exitCode=1;
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
