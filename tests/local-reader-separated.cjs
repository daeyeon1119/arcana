const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const core=require('../src/local-reader-core.js'),api=require('../src/local-reader-separated.js'),checks=[];
const check=(name,run)=>{run();checks.push({name,ok:true});};
// Synthetic contract specimens. These are not real model answers or quality ratings.
const packet=core.packet({question:'동료와 작업을 마쳤어요. 다음 단계와 배운 점을 돌아보는 방법이 궁금해요.',spread:'두 관점',cards:[
 {id:'ar01',name:'마법사',rev:false,position:'현재',positionMeaning:'현재 살필 관점',meaning:'가진 도구로 시작하는 힘'},
 {id:'ar21',name:'세계',rev:true,position:'다음 단계',positionMeaning:'다음에 살필 관점',meaning:'남은 마무리를 살피는 관점'}]});
const draft={requests:[{source:'다음 단계',purpose:'완료 후의 실천',answer:'남아 있는 후속 작업이 있는지 함께 확인해 보세요.'},{source:'배운 점을 돌아보는 방법',purpose:'경험 성찰',answer:'도움이 된 행동과 다음에 바꿀 행동을 하나씩 나누어 보세요.'}],anchors:[{source:'동료와 작업을 마쳤어요.',status:'affirmed'}],actions:['짧은 회고 시간을 정해 보세요.'],unknowns:[],clarification:''};
const symbols={synthesis:{connection:'시작의 힘과 마무리 점검이라는 서로 다른 강조점이 이어집니다.',invitation:'완료 이후에도 남겨 두고 싶은 도구나 방식을 살펴보세요.',refs:['c0','c1']},cards:{c0:{lens:'활용할 수 있는 도구',invitation:'이번에 도움이 된 방법 중 다음에도 쓸 것을 골라 보세요.'},c1:{lens:'끝맺음의 점검',invitation:'마쳤다고 여긴 일에 남은 확인이 있는지 살펴보세요.'}}};
check('question help is invariant to card identity, orientation, position and spread',()=>{const other=structuredClone(packet);other.spread='전혀 다른 배열';other.cards.reverse();other.cards[0]={...other.cards[0],id:'ar00',orientation:'정방향',position:'과거',meaning:'다른 의미'};assert.deepEqual(api.draftMessages(packet),api.draftMessages(other));});
check('question input contains original text and explicit choices without inferred facts',()=>{const input=JSON.parse(api.draftMessages(packet)[1].content);assert.deepEqual(Object.keys(input),['question','chosenFocus','chosenTopic']);assert.equal(input.question,packet.question);});
check('valid multi-request draft and symbols are accepted',()=>{assert(api.validateDraft(packet,draft).ok);assert(api.validateSymbols(packet,symbols).ok);});
for(const [name,mutate]of [
 ['invented source',x=>x.requests[0].source='다시 작업을 시작하세요'],
 ['invented anchor',x=>x.anchors[0].source='아직 작업을 안 했어요'],
 ['unknown status',x=>x.anchors[0].status='certain'],
 ['missing answer',x=>x.requests[0].answer=''],
 ['duplicate request',x=>x.requests.push({...x.requests[0]})],
 ['unsupported field',x=>x.domain='career'],
 ['malformed action',x=>x.actions=[null]]
])check('draft rejects '+name+' before the symbol stage',()=>{const x=structuredClone(draft);mutate(x);assert(!api.validateDraft(packet,x).ok);assert.throws(()=>api.symbolicMessages(packet,x));});
check('malformed draft values fail without a crash',()=>{for(const x of [null,{},[],true,'bad',{requests:[null],anchors:[null],actions:null,unknowns:null,clarification:''}])assert(!api.validateDraft(packet,x).ok);});
check('symbol stage sees actual cards and exact fallible draft',()=>{const input=JSON.parse(api.symbolicMessages(packet,draft)[1].content);assert.deepEqual(input.questionHelp,draft);assert.equal(input.cards[1].symbolicMeaning,packet.cards[1].meaning);assert.equal(input.cards[1].orientation,'역방향');assert(!('meaning'in input.cards[1]));assert(!('baseline'in input));});
for(const [name,mutate]of [
 ['replacement answer',x=>x.requests=[{answer:'덮어쓰기'}]],
 ['replacement action',x=>x.actions=['덮어쓰기']],
 ['missing card',x=>delete x.cards.c1],
 ['extra card',x=>x.cards.c2={...x.cards.c0}],
 ['wrong reference',x=>x.synthesis.refs=['c9']],
 ['duplicate references',x=>x.synthesis.refs=['c0','c0']],
 ['empty invitation',x=>x.cards.c0.invitation=''],
 ['invented card identity',x=>x.cards.c0.name='다른 카드']
])check('symbols reject '+name,()=>{const x=structuredClone(symbols);mutate(x);assert(!api.validateSymbols(packet,x).ok);assert.throws(()=>api.report(packet,draft,x));});
check('two different symbol readings cannot change the practical answer or actions',()=>{const x=structuredClone(symbols);x.cards.c0.invitation='어떤 도구를 남기고 싶은지 적어 보세요.';x.synthesis.invitation='다음에 쓸 수 있는 방법을 골라 보세요.';const a=api.report(packet,draft,symbols),b=api.report(packet,draft,x);assert.equal(a.direct,b.direct);assert.equal(a.direct,draft.requests.map(r=>r.answer).join('\n\n'));assert.deepEqual(a.actions,draft.actions);assert.deepEqual(a.actions,b.actions);assert.notDeepEqual(a.sections,b.sections);});
check('practical help is not given fabricated card citations',()=>{const r=api.report(packet,draft,symbols);assert(!('refs'in r.local.draft.requests[0]));assert(r.sections.filter(s=>s.kind==='card').every((s,i)=>s.refs[0]===i));assert(r.sections[2].body.includes('세계 역방향'));});
check('report snapshot cannot be changed by later caller mutation',()=>{const x=structuredClone(draft),s=structuredClone(symbols),r=api.report(packet,x,s);x.actions[0]='변경';s.cards.c0.lens='변경';assert.equal(r.local.draft.actions[0],draft.actions[0]);assert.equal(r.local.symbols.cards.c0.lens,symbols.cards.c0.lens);});
check('necessary clarification may have no prescribed action',()=>{const x=structuredClone(draft);x.actions=[];x.clarification='어떤 후속 작업을 생각하고 계신가요?';assert(api.validateDraft(packet,x).ok);assert.equal(api.report(packet,x,symbols).clarification,x.clarification);});
check('semantic fabrication can still pass and is explicitly outside validation coverage',()=>{const x=structuredClone(symbols);x.cards.c0.invitation='당신은 이미 상대의 속마음을 확실히 알고 있습니다.';assert(api.validateSymbols(packet,x).ok);const d=structuredClone(draft);d.requests[0].answer='동료가 이미 다시 시작해 달라고 요청했습니다.';assert(api.validateDraft(packet,d).ok);});
const source=fs.readFileSync('src/local-reader-separated.js','utf8').replace(/\r\n/g,'\n');
const result={total:checks.length,checks,sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),note:'Synthetic structural invariants. No actual model generation, semantic validation or professional evaluation.'};
require('../scripts/save-artifact.cjs') ('test-results/local-reader/separated-contract-summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
