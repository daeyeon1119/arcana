// Frozen first-pass diagnostic. Results are recorded, including failures; they do not tune the engine.
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const fixture=JSON.parse(fs.readFileSync('tests/generalization-v81.json','utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const replay=process.argv[2]||'';assert(!replay||/^regression(?:-final)?$/.test(replay),'Use regression or regression-final for a named replay.');
const regression=!!replay;
const folder='test-results/generalization-v81'+(regression?'/'+replay:'');
(async()=>{const b=await require('./browser.cjs')();try{
 fs.mkdirSync(folder,{recursive:true});const errors=[];
 const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
 const evaluate=async(url)=>{await p.goto(b.appURL+url,{waitUntil:'domcontentloaded',timeout:60000});return p.evaluate(groups=>{
  let state=812026;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};const output=[];
  for(const g of groups)for(const spread of Object.keys(SPREADS)){
   const pool=CARDS.map(c=>c.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   const cards=pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5}));
   g.questions.forEach((q,i)=>{const r=__arcana79Build(q,spread,cards);output.push({group:g.id,variant:i,question:q,spread,cards,actualIntent:r.arc79.intent.primary,actualDomain:r.arc79.domain,facts:r.arc79.facts,boundary:arc79Scene(q).scene.boundary,direct:r.direct,actions:r.actions,sections:r.sections,synthesis:r.arc81||null});});
  }return output;
 },fixture.groups);};
 if(!fs.existsSync('.cache/v80.html')){fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/v80.html',require('node:child_process').execFileSync('git',['show','6ca8f8c:index.html'],{maxBuffer:40*1024*1024}));}
 assert.equal(hash(fs.readFileSync('.cache/v80.html')),'dca5e73e51865b4fd5911a8c9db4a5cf307ceb155e03c375f5853046efefda1d');
 const appSHA256=hash(fs.readFileSync('index.html')),fixtureSHA256=hash(fs.readFileSync('tests/generalization-v81.json'));
 const freezePath=folder+'/freeze.json';const freeze={appSHA256,fixtureSHA256,baselineSHA256:hash(fs.readFileSync('.cache/v80.html')),seed:812026};
 if(fs.existsSync(freezePath))assert.deepEqual(JSON.parse(fs.readFileSync(freezePath,'utf8')),freeze,'Frozen evaluation changed; create a new version rather than overwrite the first pass.');else fs.writeFileSync(freezePath,JSON.stringify(freeze,null,2));
 const before=await evaluate('/.cache/v80.html'),after=await evaluate('/');
 assert.equal(after.length,fixture.groups.reduce((n,g)=>n+g.questions.length,0)*8);
 assert(before.every((r,i)=>r.question===after[i].question&&r.spread===after[i].spread&&JSON.stringify(r.cards)===JSON.stringify(after[i].cards)));
 const score=rows=>{const questions=rows.filter(r=>r.spread==='three').map(r=>{const g=fixture.groups.find(g=>g.id===r.group);const intent=g.intent===null?null:r.actualIntent===g.intent,domain=g.domain===null?null:r.actualDomain===g.domain;const facts=Object.entries(g.facts||{}).map(([key,value])=>({key,expected:value,actual:r.facts[key],ok:r.facts[key]===value}));if(g.boundary!==undefined)facts.push({key:'boundary',expected:g.boundary,actual:r.boundary,ok:r.boundary===g.boundary});return {group:r.group,variant:r.variant,question:r.question,intent,domain,facts};});return {questions,intent:{passed:questions.filter(q=>q.intent===true).length,total:questions.filter(q=>q.intent!==null).length},domain:{passed:questions.filter(q=>q.domain===true).length,total:questions.filter(q=>q.domain!==null).length},facts:{passed:questions.flatMap(q=>q.facts).filter(f=>f.ok).length,total:questions.flatMap(q=>q.facts).length}};};
 const old=score(before),fresh=score(after);
 const changed=fresh.questions.flatMap((q,i)=>['intent','domain',...q.facts.map(f=>f.key)].flatMap(k=>{const left=['intent','domain'].includes(k)?old.questions[i][k]:old.questions[i].facts.find(f=>f.key===k)?.ok,right=['intent','domain'].includes(k)?q[k]:q.facts.find(f=>f.key===k)?.ok;return left===right?[]:[{group:q.group,variant:q.variant,dimension:k,before:left,after:right}];}));
 const consistency=fixture.groups.filter(g=>g.intent!==null).map(g=>{const variants=fresh.questions.filter(q=>q.group===g.id);return {group:g.id,allIntentsCorrect:variants.every(q=>q.intent),factsAllCorrect:variants.every(q=>q.facts.every(f=>f.ok))};});
 const summary={...freeze,note:regression?'Regression replay after the first pass revealed a cross-layout comparison regression. These questions have now informed a fix; they are not an untouched holdout.':fixture.note,uniqueQuestions:fresh.questions.length,readingsPerVersion:after.length,spreads:8,before:{intent:old.intent,domain:old.domain,facts:old.facts},after:{intent:fresh.intent,domain:fresh.domain,facts:fresh.facts},changed,consistency,failures:fresh.questions.filter(q=>q.intent===false||q.domain===false||q.facts.some(f=>!f.ok)),manualCases:fixture.groups.filter(g=>g.manualReview).map(g=>({group:g.id,note:g.manualReview})),pageErrors:errors};
 for(const [name,rows]of [['before',before],['after',after]])fs.writeFileSync(folder+'/'+name+'-readings.jsonl.gz',zlib.gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 fs.writeFileSync(folder+'/samples.json',JSON.stringify({before:before.filter(r=>r.spread==='three'),after:after.filter(r=>r.spread==='three')},null,2));fs.writeFileSync(folder+'/summary.json',JSON.stringify(summary,null,2));
 console.log(JSON.stringify({...summary,failures:summary.failures.map(q=>({group:q.group,variant:q.variant,intent:q.intent,domain:q.domain,failedFacts:q.facts.filter(f=>!f.ok)}))},null,2));
 assert.equal(errors.length,0);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
