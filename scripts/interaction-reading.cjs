/* Full v90/candidate reports. Known development cases are not an unseen evaluation. */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib'),cp=require('node:child_process'),save=require('./save-artifact.cjs');
const phase=process.argv[2]||'development',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(['baseline','development','first','regression'].includes(phase));
const major=Number(require('../package.json').version.split('.')[0]),folder='test-results/interaction/'+(['baseline','first'].includes(phase)?phase:'v'+major+'/'+phase);
fs.mkdirSync(folder,{recursive:true});fs.mkdirSync('.cache',{recursive:true});
if(['baseline','first'].includes(phase))assert(!fs.existsSync(folder+'/freeze.json'),'Immutable execution exists');
const baseline=cp.execFileSync('git',['show','5033a5e:index.html'],{maxBuffer:64*1024*1024});assert.equal(hash(baseline),'7123dc9c2c668978cb8743db51c46afe7c3c468ae2962c4c66e51479c2e239c4');save('.cache/interaction-v90.html',baseline);
const editorial=fs.readFileSync('tests/editorial-320.tsv','utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split('\t')[1]);
const definitions=[
 ['one',21,'ar03',true],['one',145,'cu13',true],['one',251,'pe13',true],['one',316,'pe05',true],
 ['three',161,'ar01',false,'ar07',true],['three',295,'ar03',true,'ar04',false],['three',168,'ar03',false,'wa07',true],['three',176,'ar18',false,'sw01',false],
 ['five',21,'ar03',true,'ar04',true],['five',128,'pe08',true,'ar17',false],['five',156,'cu13',true,'sw13',false],['five',240,'ar01',false,'ar07',false],
 ['relationship5',36,'cu02',false,'cu13',true],['relationship5',44,'ar03',false,'pe13',true],['relationship5',251,'cu01',true,'cu14',true],
 ['career5',274,'pe06',true,'pe05',true],['career5',21,'wa10',true,'ar04',false],
 ['waiting3',300,'ar20',true,'sw04',false],['waiting3',112,'ar18',true,'pe08',true],
 ['celtic',295,'ar03',true,'ar04',false],['celtic',206,'pe05',true,'ar17',false],['celtic',217,'ar09',true,'cu05',true],
 ['choice5',90,'ar01',false,'ar07',true],['choice5',44,'ar03',true,'ar04',false]
];
const fixture=['first','regression'].includes(phase)?JSON.parse(fs.readFileSync('tests/interaction-first.json','utf8')):null;
const freeze={phase,release:require('../release.json'),baselineSHA256:hash(baseline),collectorSHA256:hash(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')),fixtureSHA256:hash(JSON.stringify(fixture||definitions)),candidateCommit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),note:fixture?.note||'24 known questions/card layouts. Development diagnostics, not a professional quality score.'};
save(folder+'/freeze.json',JSON.stringify(freeze,null,2)+'\n');
(async()=>{const b=await require('./browser.cjs')();try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.goto(b.appURL+'/.cache/interaction-v90.html',{waitUntil:'domcontentloaded',timeout:90000});
 const inputs=await p.evaluate(({definitions,editorial,fixture})=>{let seed=910067;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  if(fixture)return fixture.cases.flatMap(c=>Object.keys(SPREADS).map(spread=>{const pool=CARDS.map(c=>c.id);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return {...c,spread,cards:pool.slice(0,SPREADS[spread].slots.length).map(id=>({id,rev:rand()<.5}))};}));
  return definitions.map(([spread,qid,a,ar,b,br],n)=>{const roles=SPREADS[spread].slots.map(slot=>slot[1]),pair=spread==='one'?[0]:spread==='three'?[1,2]:spread==='celtic'?[0,1]:spread==='choice5'?[1,2]:spread==='waiting3'?[1,2]:[0,2];const chosen=new Set([a,b]),pool=CARDS.filter(c=>!chosen.has(c.id));const cards=roles.map((_,i)=>({id:pool[i].id,rev:i%2===0}));cards[pair[0]]={id:a,rev:ar};if(b)cards[pair[1]]={id:b,rev:br};return {id:'d'+String(n+1).padStart(2,'0'),knownEditorialId:qid,question:editorial[qid-1],spread,cards};});
 },{definitions,editorial,fixture});
 const run=()=>p.evaluate(inputs=>inputs.map(c=>{arc79ForcedIntent='auto';const report=__arcana79Build(c.question,c.spread,c.cards),scene=arc79Scene(c.question).scene;return {report,protected:!!(scene.medical||['health','finances'].includes(scene.domain)||scene.boundary||scene.abuse||scene.urgent||scene.facts.known)};}),inputs);
 const before=await run();await p.goto(b.appURL,{waitUntil:'domcontentloaded',timeout:90000});const after=await run();
 const failures=[],rows=inputs.map((c,i)=>{const a=after[i].report,b=before[i].report,fail=reason=>failures.push({id:c.id,spread:c.spread,reason});
  if(JSON.stringify(a.actions)!==JSON.stringify(b.actions))fail('practical actions changed');
  if(JSON.stringify(a.arc79.facts)!==JSON.stringify(b.arc79.facts))fail('facts changed');
  if(JSON.stringify(a.arc82?.model)!==JSON.stringify(b.arc82?.model))fail('question interpretation changed');
  if(after[i].protected&&JSON.stringify(a)!==JSON.stringify(b))fail('protected full report changed');
  if(/undefined|\[object Object\]|을를|은는/.test(a.direct))fail('broken visible text');
  return {...c,before:before[i],after:after[i]};});
 const raw=JSON.stringify(rows,null,2)+'\n';save(folder+'/readings.json',raw);save(folder+'/readings.jsonl.gz',zlib.gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 const summary={...freeze,questions:fixture?.cases.length||24,readingsPerVersion:rows.length,readingsSHA256:hash(raw),errors,failures,qualityScore:null};save(folder+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
