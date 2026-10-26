const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const phase=process.argv[2]||'after';
const cases=fs.readFileSync('tests/synthesis-24.tsv','utf8').trim().split(/\r?\n/).slice(1).map(line=>{const [id,question,spread]=line.split('\t');return {id:Number(id),question,spread};});
const pools=[['ar07','ar12','sw01','wa10','pe03','ar18','cu02','ar13','ar14','pe08'],['ar18','sw01','pe08','cu02','wa10','ar19','sw04','ar15','pe09','ar17'],['sw09','pe05','ar13','cu08','ar19','wa08','ar04','cu06','sw02','pe07']];
(async()=>{const b=await require('./browser.cjs')();try{
 const p=await b.newPage(),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.goto(b.appURL,{waitUntil:'domcontentloaded',timeout:60000});
 const readings=await p.evaluate(({cases,pools})=>cases.flatMap(c=>pools.map((pool,v)=>{
  const cards=pool.slice(0,SPREADS[c.spread].slots.length).map((id,i)=>({id,rev:v===2||v===1&&i%3===2}));
  const r=__arcana79Build(c.question,c.spread,cards);
  return {...c,variant:v,cards,actualIntent:r.arc79.intent.primary,actualDomain:r.arc79.domain,direct:r.direct,actions:r.actions,sections:r.sections,synthesis:r.arc81||null};
 })),{cases,pools});
 const checks=[];const check=(name,ok)=>{checks.push({name,ok});assert(ok,name);};
 check('24 fixed new questions / 72 exact card combinations',cases.length===24&&readings.length===72);
 check('no browser runtime errors',pageErrors.length===0);
 if(phase==='after'){
  const before=JSON.parse(fs.readFileSync('test-results/synthesis/before-readings.json','utf8'));
  check('before/after use identical questions, positions and orientations',readings.every((r,i)=>r.question===before[i].question&&r.spread===before[i].spread&&JSON.stringify(r.cards)===JSON.stringify(before[i].cards)));
  check('every drawn card remains in detailed evidence',readings.every(r=>new Set(r.sections.flatMap(s=>s.refs)).size===r.cards.length));
  check('no ungrounded repeated-theme shortcut',readings.every(r=>r.synthesis&&r.synthesis.relations.every(x=>x.kind!=='shared'||x.shared.length>0)));
  check('same report generated twice',await p.evaluate(c=>JSON.stringify(__arcana79Build(c.question,c.spread,c.cards))===JSON.stringify(__arcana79Build(c.question,c.spread,c.cards)),readings[0]));
  const diagnostics=await p.evaluate(()=>{
   const atom=(id,reverse=false,index=0,role='now')=>({...arc58Atom({id,rev:reverse,i:index,role,card:CARD_BY_ID.get(id)})});
   const pair=(a,b)=>arc81Relation(a,b,'three');
   const pace=pair(atom('ar07'),atom('ar12',false,1,'future'));
   const evidence=pair(atom('ar18'),atom('sw01',false,1));
   const sameTag=pair(atom('ar02'),atom('ar11',false,1));
   const reversedAid=pair(atom('pe05',true),atom('ar17',false,1));
   const choices=[{id:'ar07',rev:false},{id:'ar18',rev:false},{id:'sw01',rev:false},{id:'wa10',rev:false},{id:'pe03',rev:false}];
   const a=__arcana79Build('두 선택을 비교해 주세요.','choice5',choices),swapped=choices.map(c=>({...c}));[swapped[1],swapped[2]]=[swapped[2],swapped[1]];
   const b=__arcana79Build('두 선택을 비교해 주세요.','choice5',swapped);
   const obstacle=__arcana79Build('무엇부터 할까요?','five',[{id:'ar18',rev:false},{id:'ar07',rev:false},{id:'ar19',rev:false},{id:'pe03',rev:false},{id:'sw01',rev:false}]);
   return {
    'all 78 cards / 156 orientations have named motifs':CARDS.every(c=>[false,true].every(rev=>arc81Profile(atom(c.id,rev)).length>=2&&arc81Profile(atom(c.id,rev)).every(k=>Object.hasOwn(ARC81_MOTIFS,k)))),
    'speed and pause produce a specific pacing tension':pace.kind==='tension'&&pace.axis==='pace'&&pace.body.includes('전차 정방향')&&pace.body.includes('매달린 사람 정방향'),
    'uncertainty and evidence produce a specific checking connection':evidence.axis==='evidence'&&evidence.kind==='complement',
    'same old action tag does not imply a shared theme':ARC58_ATOMS.ar02[4]===ARC58_ATOMS.ar11[4]&&sameTag.kind!=='shared',
    'reversal can express recovery and available help':arc81Profile(atom('pe05',true)).includes('recovery')&&reversedAid.body.includes('역방향')&&!reversedAid.body.includes('나쁜 결과'),
    'swapping A and B preserves positional ownership':a.direct.includes('‘A의 성격’의 달')&&b.direct.includes('‘A의 성격’의 소드 에이스')&&a.direct!==b.direct,
    'alternative routes are compared without claiming they act together':a.arc81.relations[0].kind==='alternatives'&&a.direct.includes('A를 살필 때는')&&a.direct.includes('B를 살필 때는'),
    'positive obstacle card retains its actual meaning':obstacle.sections.find(s=>s.refs.length===1&&s.refs[0]===2).body.includes('드러나는 명료함')&&!obstacle.sections.find(s=>s.refs.length===1&&s.refs[0]===2).body.includes('실패'),
    'one card does not invent a pair':__arcana79Build('오늘 돌아볼 관점은 무엇일까요?','one',[{id:'ar18',rev:false}]).arc81.relations.length===0,
    'new reply wording preserves the received answer':arc79Scene('이미 사과했고 친구도 괜찮다고 답했어요. 불안해요.').scene.facts.replied===true,
    'criteria requests remain action rather than forecast':arc79Scene('피드백을 어떤 기준으로 받아들일까요?').intent.primary==='action'
   };
  });
  for(const [name,ok]of Object.entries(diagnostics))check(name,ok);
  check('relationship synthesis does not invent a work task',!readings.find(r=>r.id===10&&r.variant===1).direct.includes('마칠 수 있는 작업'));
  check('shared living cost discussion receives agreement advice',readings.filter(r=>r.id===15).every(r=>r.direct.includes('상담')||r.direct.includes('상의할 기준')));
 }
 fs.mkdirSync('test-results/synthesis',{recursive:true});fs.writeFileSync(`test-results/synthesis/${phase}-readings.json`,JSON.stringify(readings,null,2));
 const summary={phase,questions:cases.length,readings:readings.length,checks,pageErrors,appSHA256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex')};fs.writeFileSync(`test-results/synthesis/${phase}-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
