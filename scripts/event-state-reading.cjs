const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib'),save=require('./save-artifact.cjs');
const phase=process.argv[2]||'development',major=Number(require('../package.json').version.split('.')[0]);assert(['development','first','regression'].includes(phase));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),fixturePath='tests/event-state-'+(phase==='development'?'dev':'first')+'.json',fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const folder='test-results/event-state/'+(major===88?'':'v'+major+'/')+phase;fs.mkdirSync(folder,{recursive:true});
if(phase==='first'){assert.equal(major,88,'A later engine needs a newly frozen evaluation.');assert(!fs.existsSync(folder+'/readings.json')&&!fs.existsSync(folder+'/freeze.json'),'First execution already started; use regression, never overwrite first evidence.');}
fs.mkdirSync('.cache',{recursive:true});const baselinePath='.cache/event-state-v87.html',expectedBaseline='d7be73ee32f84493a35d72401ee4ffa06cc03d7aa3d452070f20c0d4af427052';
if(!fs.existsSync(baselinePath)||hash(fs.readFileSync(baselinePath))!==expectedBaseline)save(baselinePath,require('node:child_process').execFileSync('git',['show','4b97ca37eab031fd9f902698ed7923456f295041:index.html'],{maxBuffer:64*1024*1024}));
const release=require('../release.json'),baseline=fs.readFileSync(baselinePath),baselineSHA256=hash(baseline);assert.equal(baselineSHA256,expectedBaseline);assert.equal(hash(fs.readFileSync('index.html')),release.appSHA256);
const freeze={phase,release,baselineSHA256,fixtureSHA256:hash(fs.readFileSync(fixturePath,'utf8').replace(/\r\n/g,'\n')),collectorSHA256:hash(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')),seed:880031,note:fixture.note};
save(folder+'/freeze.json',JSON.stringify(freeze,null,2)+'\n');
(async()=>{const browser=await require('./browser.cjs')();try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',route=>route.abort());
 const run=async path=>{await page.goto(browser.appURL+path,{waitUntil:'domcontentloaded',timeout:90000});return page.evaluate(cases=>{
  let seed=880031;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  return cases.flatMap(c=>Object.keys(SPREADS).map(spread=>{
   const pool=CARDS.map(card=>card.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   const cards=pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5})),r=__arcana79Build(c.question,spread,cards);
   return {id:c.id,question:c.question,spread,cards,output:{headline:r.headline,direct:r.direct,actions:r.actions,sections:r.sections,facts:r.arc79.facts,model:r.arc82?.model||ARCANA_QUESTION_MODEL.parse(c.question),applications:r.arc84?.applications||[]}};
  }));
 },fixture.cases);};
 const before=await run('/.cache/event-state-v87.html'),after=await run('/');assert.equal(before.length,after.length);
 const rows=after.map((r,i)=>{assert.deepEqual([r.id,r.question,r.spread,r.cards],[before[i].id,before[i].question,before[i].spread,before[i].cards]);return {...r,after:r.output,before:before[i].output,output:undefined};});
 const failures=[];for(const row of rows){const expected=fixture.cases.find(c=>c.id===row.id);for(const [key,value]of Object.entries(expected.state||{}))if(row.after.model.state[key]!==value)failures.push({id:row.id,spread:row.spread,key,expected:value,actual:row.after.model.state[key]});for(const [key,value]of Object.entries(expected.facts||{}))if(row.after.facts[key]!==value)failures.push({id:row.id,spread:row.spread,key:'facts.'+key,expected:value,actual:row.after.facts[key]});}
 const raw=JSON.stringify(rows,null,2)+'\n';save(folder+'/readings.json',raw);save(folder+'/readings.jsonl.gz',zlib.gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 const summary={...freeze,readingsSHA256:hash(raw),questions:fixture.cases.length,readingsPerVersion:rows.length,errors,failures,mechanicalPassed:rows.length-new Set(failures.map(f=>f.id+'|'+f.spread)).size,qualityScore:null,note:phase==='regression'?fixture.note+' Known regression after first outputs informed changes.':fixture.note};save(folder+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert.deepEqual(errors,[]);assert.equal(failures.length,0,'event-state reading contracts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
