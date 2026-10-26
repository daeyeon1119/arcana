const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const phase=process.argv[2]||'after';
const cases=fs.readFileSync('tests/editorial-320.tsv','utf8').trim().split(/\r?\n/).slice(1).map((line,i)=>{const [category,question,intent,domain]=line.split('\t');return {id:i+1,category,question,intent,domain};});
if(cases.length!==320||new Set(cases.map(c=>c.question)).size!==320)throw Error('Expected 320 distinct authored questions');
(async()=>{const b=await require('./browser.cjs')();try{
 const p=await b.newPage({reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.goto(b.appURL,{waitUntil:'domcontentloaded',timeout:60000});
 const readings=await p.evaluate(cases=>{arc79ForcedIntent='auto';let seed=80320;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};const spreads=['three','five','relationship5','career5','choice5','waiting3','celtic','one'];return cases.map((c,i)=>{const spread=spreads[i%8],pool=CARDS.map(c=>c.id);for(let j=pool.length-1;j>0;j--){const k=Math.floor(rand()*(j+1));[pool[j],pool[k]]=[pool[k],pool[j]];}const cards=pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5}));try{const r=__arcana79Build(c.question,spread,cards);return {...c,spread,cards,actualIntent:r.arc79.intent.primary,actualDomain:r.arc79.domain,headline:r.headline,direct:r.direct,actions:r.actions,sections:r.sections,facts:r.arc79.facts};}catch(e){return {...c,error:e.message};}});},cases);
 const qualityChecks=[];
 if(phase==='after'){
  const find=id=>readings.find(r=>r.id===id),check=(name,ok)=>{qualityChecks.push({name,ok});if(!ok)errors.push('Editorial regression: '+name);};
  check('no foreign placeholder / broken text',readings.every(r=>!/[\u3040-\u30ff]|undefined|NaN|\[object Object\]|은는|을를/.test([r.direct,...(r.actions||[])].join(' '))));
  check('colleague apology is not an outgoing message',find(36).facts.sent===false&&!find(36).direct.includes('아직 답을 받지 못한'));
  check('mutual exchange preserves reply',find(41).facts.replied===true&&!find(41).direct.includes('아직 답을 받지 못한'));
  check('reply with 도 is preserved',find(291).facts.replied===true&&!find(291).direct.includes('아직 답을 받지 못한'));
  check('child question avoids friend advice',!find(86).direct.includes('친구')&&find(86).direct.includes('자녀'));
  check('borrowed item receives return advice',find(71).direct.includes('돌려받'));
  check('travel preparation avoids exam advice',!/(시험|문제 유형|기출)/.test(find(316).direct)&&find(316).direct.includes('이동'));
  check('commute question includes actual travel time',find(1).direct.includes('이동 시간'));
  check('workload includes deadlines and effort',find(21).direct.includes('마감')&&find(21).direct.includes('소요 시간'));
  check('already accepted job does not advise applying',!find(10).direct.includes('지원 자격')&&find(10).direct.includes('출근'));
  check('medication discomfort remains medical',find(206).actualDomain==='health'&&find(206).direct.includes('의료진'));
  check('completed assignment not submitted again',!find(128).direct.includes('제출 기준과 마감')&&find(128).direct.includes('피드백'));
 }
 fs.mkdirSync('test-results/editorial',{recursive:true});
 fs.writeFileSync(`test-results/editorial/${phase}-readings.jsonl.gz`,zlib.gzipSync(readings.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 fs.writeFileSync(`test-results/editorial/${phase}-readings.json`,JSON.stringify(readings,null,2));
 const summary={questions:readings.length,categories:[...new Set(readings.map(r=>r.category))],errors:[...errors,...readings.filter(r=>r.error)],intentMatches:readings.filter(r=>r.intent===r.actualIntent).length,domainMatches:readings.filter(r=>r.domain===r.actualDomain).length,qualityChecks,appSHA256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')};
 fs.writeFileSync(`test-results/editorial/${phase}-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(summary.errors.length)process.exitCode=1;
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
