const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const scenarios=fs.readFileSync('tests/scenarios.tsv','utf8').trim().split(/\r?\n/).slice(1).map((line,i)=>{const [question,intent,domain,facts='']=line.split('\t');return {id:i+1,question,intent,domain,checks:facts.split(';').filter(Boolean)}});
(async()=>{
 const browser=await require('./browser.cjs')();
 try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());
 await page.goto(browser.appURL,{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(scenarios=>{
  arc79ForcedIntent='auto';
  let state=790026;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const results=[],coverage=new Set(),before={intent:0,domain:0,facts:0},after={intent:0,domain:0,facts:0};
  const classify=(sample,expected)=>sample===expected;
  const checks=(parsed,c)=>c.checks.every(check=>{
   if(check==='boundary'||check==='abuse'||check==='urgent')return !!parsed.scene[check];
   const [key,value]=check.split('=');return !!parsed.scene.facts[key]===(value==='true');
  });
  const confusions=[];
  for(const c of scenarios){
   const old=arc78Scene(c.question,{}),fresh=arc79Scene(c.question);
   for(const [p,metrics] of [[old,before],[fresh,after]]){metrics.intent+=+classify(p.intent.primary,c.intent);metrics.domain+=+classify(p.scene.domain,c.domain);if(c.checks.length)metrics.facts+=+checks(p,c);}
   if(fresh.intent.primary!==c.intent||fresh.scene.domain!==c.domain||!checks(fresh,c))confusions.push({id:c.id,question:c.question,expected:{intent:c.intent,domain:c.domain,checks:c.checks},actual:{intent:fresh.intent.primary,domain:fresh.scene.domain,facts:fresh.scene.facts}});
   for(const spread of Object.keys(SPREADS)){
    const pool=CARDS.map(c=>c.id);for(let i=pool.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    const cards=pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5}));cards.forEach(c=>coverage.add(c.id+':'+c.rev));
    const issues=[];let r,previous,elapsedMs;
    try{
     const started=performance.now();r=__arcana79Build(c.question,spread,cards);elapsedMs=performance.now()-started;previous=__arcana78Build(c.question,spread,cards);
     const all=[r.headline,r.direct,...r.actions,...r.sections.map(s=>s.body)].join(' ');
     if(/undefined|NaN|\[object Object\]|교류을|도움이이|을를|은는|를을/.test(all))issues.push('malformed-output');
     if(new Set(r.sections.map(s=>s.body)).size!==r.sections.length)issues.push('duplicate-sections');
     if(r.sections.some(s=>!s.refs.length||s.refs.some(i=>!Number.isInteger(i)||i<0||i>=cards.length)))issues.push('invalid-evidence');
     if(new Set(r.sections.flatMap(s=>s.refs)).size!==cards.length)issues.push('missing-card');
     if(r.arc79.evidence.some((a,i)=>a.id!==cards[i].id||a.reverse!==cards[i].rev))issues.push('orientation-mismatch');
     if(r.arc79.facts.sent&&!r.arc79.facts.replied&&/(?:먼저|다시|추가로)\s*연락해\s*보세요/.test(all))issues.push('repeat-contact');
     if(r.arc79.facts.known&&/(?:아직\s*결과.{0,8}기다|발표\s*전)/.test(r.direct+' '+r.actions.join(' ')))issues.push('known-result-contradiction');
     if(/(?:반드시\s*합격|무조건\s*수익|확실히\s*완치|100%\s*성공)/.test(all))issues.push('unfounded-prediction');
     if(fresh.scene.boundary&&!/멈추|경계/.test(r.direct))issues.push('consent-boundary');
     if(fresh.scene.urgent&&!/응급/.test(r.direct))issues.push('urgent-health');
     // Preparing questions for a clinician is adequate medical grounding too;
     // requiring the literal word "diagnosis" would reject that useful support.
     if(r.arc79.domain==='health'&&!/진단|진료|응급|의료진|약사/.test(r.direct))issues.push('medical-limit');
     const identical=__arcana79Build(c.question,spread,cards);if(JSON.stringify(r)!==JSON.stringify(identical))issues.push('nondeterministic');
    }catch(e){issues.push('runtime: '+e.message);}
    results.push({caseId:`${c.id}-${spread}`,question:c.question,spread,cards,elapsedMs,expected:{intent:c.intent,domain:c.domain},issues,answer:r?{headline:r.headline,direct:r.direct,actions:r.actions,sections:r.sections,intent:r.arc79.intent.primary,domain:r.arc79.domain}:null,before:previous?{direct:previous.direct,action:previous.actions[0]}:null});
   }
  }
  // Change only one card, then only its direction, at every position of every spread.
  const sensitivity=[];
  for(const spread of Object.keys(SPREADS)){
   const cards=CARDS.slice(0,SPREADS[spread].slots.length).map(c=>({id:c.id,rev:false}));
   const original=__arcana79Build('지금 무엇을 해야 할까요?',spread,cards);
   for(let i=0;i<cards.length;i++)for(const mode of ['card','direction']){
    const altered=cards.map(c=>({...c}));if(mode==='card')altered[i].id=CARDS[60+i].id;else altered[i].rev=true;
    const changed=__arcana79Build('지금 무엇을 해야 할까요?',spread,altered);
    sensitivity.push({spread,index:i,mode,changed:original.sections.filter(s=>s.refs.includes(i)).some(s=>!changed.sections.some(t=>t.body===s.body)),replyChanged:original.direct!==changed.direct,actionChanged:original.actions.join(' ')!==changed.actions.join(' ')});
   }
  }
  return {scenarios:scenarios.length,total:results.length,before,after,confusions,coverage:[...coverage],results,sensitivity};
 },scenarios);
 const holdout=JSON.parse(fs.readFileSync('ARCANA_tarot_v78_source/validation/holdout_final_48.json','utf8'));
 const holdoutResults=await page.evaluate(cases=>cases.map(c=>({question:c.question,expected:c.expected,before:arc78Scene(c.question,{}).intent.primary,after:arc79Scene(c.question).intent.primary})),holdout);
 fs.mkdirSync('test-results',{recursive:true});
 const raw=result.results.map(r=>JSON.stringify(r)).join('\n')+'\n';
 require('./save-artifact.cjs') ('test-results/readings.jsonl.gz',zlib.gzipSync(raw));
 const failures=result.results.filter(r=>r.issues.length);
 const times=result.results.map(r=>r.elapsedMs).filter(Number.isFinite).sort((a,b)=>a-b);
 const summary={seed:790026,appSHA256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),scenarioCount:result.scenarios,readingCount:result.total,passed:result.total-failures.length,failed:failures.length,pageErrors:errors,coverage:{uniqueCards:new Set(result.coverage.map(c=>c.split(':')[0])).size,cardOrientations:result.coverage.length,spreads:8},classification:{before:result.before,after:result.after,denominator:result.scenarios,factDenominator:scenarios.filter(c=>c.checks.length).length},confusions:result.confusions,sensitivity:{total:result.sensitivity.length,passed:result.sensitivity.filter(s=>s.changed).length,details:result.sensitivity},holdout:{note:'Legacy 48 prompts; no tuning based on these results in this change.',count:holdout.length,before:holdoutResults.filter(c=>c.before===c.expected).length,after:holdoutResults.filter(c=>c.after===c.expected).length,results:holdoutResults},failures:failures.slice(0,30)};
 const rounded=x=>Math.round(x*100)/100;
 summary.holdout.note='Legacy 48 prompts. One known regression (까닭 misread as action) was used for this follow-up fix; final scores are regression data, not independent accuracy.';
 summary.holdout.improved=holdoutResults.filter(c=>c.before!==c.expected&&c.after===c.expected).length;
 summary.holdout.regressed=holdoutResults.filter(c=>c.before===c.expected&&c.after!==c.expected).length;
 summary.latencyMs={note:'Single local generation, excluding browser startup, UI animation and baseline comparison.',p50:rounded(times[Math.floor(times.length*.5)]),p95:rounded(times[Math.floor(times.length*.95)]),max:rounded(times.at(-1)),total:rounded(times.reduce((a,b)=>a+b,0))};
 require('./save-artifact.cjs') ('test-results/stress-summary.json',JSON.stringify(summary,null,2));
 const sample=result.results.filter((r,i)=>i%33===0).map(r=>({id:r.caseId,question:r.question,cards:r.cards,answer:r.answer}));
 require('./save-artifact.cjs') ('test-results/review-samples.json',JSON.stringify(sample,null,2));
 console.log(JSON.stringify({...summary,sensitivity:{...summary.sensitivity,details:undefined},holdout:{...summary.holdout,results:undefined},failures:failures.slice(0,4)},null,2));
 if(failures.length||errors.length||summary.sensitivity.passed!==summary.sensitivity.total)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
