const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const core=require('../src/local-reader-core.js'),checks=[];
const check=(name,f)=>{f();checks.push(name);};
const input={question:'답을 아직 못 받았어요. 오늘 무엇을 할까요?',spread:'과거 · 현재 · 미래',cards:[
 {id:'ar09',name:'은둔자',rev:false,position:'과거',positionMeaning:'지나온 영향',meaning:'거리를 두고 내면을 살피기'},
 {id:'ar02',name:'여사제',rev:true,position:'현재',positionMeaning:'현재 관점',meaning:'직감과 사실 구분'},
 {id:'pe08',name:'펜타클 8',rev:false,position:'미래',positionMeaning:'잠정적인 가능성',meaning:'기술과 꾸준한 연습'}
]};
const p=core.packet(input),good={requests:[{source:'오늘 무엇을 할까요?',text:'아직 오지 않은 답을 기다리며 오늘 이어갈 일을 하나 정해 보세요.',refs:['c1','c2']}],synthesis:{text:'거리를 두고 생각한 시간과 아직 모르는 사실을 구분하며, 지금 할 수 있는 작은 연습으로 시선을 옮겨 보세요.',refs:['c0','c1','c2']},cards:{c0:'혼자 돌아본 시간이 지금 내 선택에 남긴 영향을 살펴보세요.',c1:'추측을 상대의 확실한 뜻으로 바꾸지 말고 확인할 부분을 남겨 두세요.',c2:'답을 반복해서 확인하는 대신 오늘 완성할 작은 작업을 정해 보세요.'},actions:[{text:'답을 확인할 시간을 정하고 그 사이에 마칠 작은 일을 적어 보세요.',refs:['c2']}],unknowns:['상대가 응답할 수 있는 시점은 아직 모릅니다.']};
check('raw question and every card identity/direction/position are preserved',()=>{assert.equal(p.question,input.question);assert.deepEqual(p.cards.map(x=>[x.id,x.orientation,x.position]),input.cards.map(x=>[x.id,x.rev?'역방향':'정방향',x.position]));});
check('model sees no guessed domain, event facts or previous canned answer',()=>{const user=JSON.parse(core.messages(p)[1].content);assert.equal(user.topic,null);assert.equal(user.focus,null);assert(!('facts'in user));assert(!('previousAnswer'in user));});
check('manual focus and topic stay explicit',()=>{const manual=core.packet({...input,focus:'감정 돌보기',topic:'가족·친구'});assert.equal(manual.focus,'감정 돌보기');assert.notEqual(core.key(manual),core.key(p));});
check('each card change and direction change invalidates the packet key',()=>{for(let i=0;i<input.cards.length;i++)for(const field of ['id','rev']){const x=structuredClone(input);x.cards[i][field]=field==='id'?'other':!x.cards[i][field];assert.notEqual(core.key(core.packet(x)),core.key(p));}});
check('same packet is stable across caller mutation',()=>{const x=structuredClone(input),before=core.key(core.packet(x));x.cards[0].rev=true;assert.equal(core.key(p),before);});
check('valid grounded structure is accepted',()=>assert.equal(core.validate(p,good).ok,true));
const mutations=[
 ['invented request source',x=>x.requests[0].source='상대가 답장을 했어요'],
 ['wrong card reference',x=>x.synthesis.refs=['c9']],
 ['duplicate card reference',x=>x.actions[0].refs=['c1','c1']],
 ['missing card',x=>delete x.cards.c1],
 ['extra card',x=>x.cards.c8='없는 카드입니다.'],
 ['empty action',x=>x.actions=[]],
 ['empty request',x=>x.requests=[]],
 ['duplicate requests',x=>x.requests.push({...x.requests[0]})],
 ['bad root field',x=>x.secret='허용 안 됨'],
 ['invalid request type',x=>x.requests='wrong'],
 ['invalid action type',x=>x.actions={}],
 ['null card output',x=>x.cards=null],
 ['English-only text',x=>x.synthesis.text='This is not a Korean answer.'],
 ['malformed text',x=>x.synthesis.text='undefined 결과입니다.'],
 ['overlong text',x=>x.requests[0].text='가'.repeat(1801)],
 ['overlong unknowns',x=>x.unknowns=['가'.repeat(501)]]];
for(const [name,mutate]of mutations)check('reject '+name,()=>{const x=structuredClone(good);mutate(x);assert.equal(core.validate(p,x).ok,false);assert.throws(()=>core.report(p,x));});
check('arbitrary malformed roots do not throw',()=>{for(const x of [null,[],42,'text',{},false,{requests:4,actions:3,cards:8},{requests:[null],actions:[false],unknowns:7,synthesis:2}])assert.equal(core.validate(p,x).ok,false);});
check('empty question remains daily reflection',()=>assert.equal(core.packet({...input,question:''}).question,'오늘의 성찰'));
check('wrong card counts, duplicates and incomplete orientation are rejected',()=>{assert.throws(()=>core.packet({...input,cards:[]}));assert.throws(()=>core.packet({...input,cards:[input.cards[0],input.cards[0]]}));assert.throws(()=>core.packet({...input,cards:[{...input.cards[0],rev:null}]}));});
check('report derives literal card names and orientation from the packet',()=>{const r=core.report(p,good);assert.equal(r.direct,good.requests[0].text);for(let i=0;i<p.cards.length;i++){const s=r.sections.find(s=>s.kind==='card'&&s.refs[0]===i);assert(s.body.includes(p.cards[i].name));assert(s.body.includes(p.cards[i].orientation));}assert.equal(r.local.validation,'structure-and-literal-provenance-only');});
check('schema binds card output keys and allowed references',()=>{const s=core.schema(p);assert.deepEqual(s.properties.cards.required,['c0','c1','c2']);assert.deepEqual(s.properties.synthesis.properties.refs.items.enum,['c0','c1','c2']);});
// Intentionally demonstrate the limit: structural validity cannot prove this sentence true.
check('semantic contradiction is outside structural validator coverage',()=>{const x=structuredClone(good);x.requests[0].text='이미 받은 답의 내용을 적어 보세요.';assert.equal(core.validate(p,x).ok,true);});
const summary={checks:checks.map(name=>({name,ok:true})),total:checks.length,sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync('src/local-reader-core.js','utf8').replace(/\r\n/g,'\n')).digest('hex'),note:'Development protocol checks. Passing does not prove semantic truth or reading quality.'};
fs.mkdirSync('test-results/local-reader',{recursive:true});fs.writeFileSync('test-results/local-reader/contract-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
