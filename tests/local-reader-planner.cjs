const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const core=require('../src/local-reader-core.js'),planner=require('../src/local-reader-planner.js'),checks=[];
const check=(name,f)=>{f();checks.push({name,ok:true});};
const p=core.packet({question:'발표는 다음 주이고 아직 자료는 완성하지 못했어요. 준비 순서와 긴장을 다룰 방법을 각각 알려 주세요.',spread:'한 장의 메시지',cards:[{id:'ar01',name:'마법사',rev:false,position:'핵심 메시지',positionMeaning:'질문 중심의 관점',meaning:'이미 가진 능력을 활용하는 시작'}]});
const good={requests:[{source:'준비 순서',purpose:'발표 전에 자료를 완성할 준비 단계'},{source:'긴장을 다룰 방법',purpose:'준비 중 느끼는 긴장을 돌볼 실천'}],stated:[{source:'발표는 다음 주이고',status:'planned'},{source:'아직 자료는 완성하지 못했어요.',status:'negated'}],missing:[],clarification:''};
check('question analysis is independent of all card identities and meanings',()=>{const altered=structuredClone(p);altered.cards=[{ref:'c0',id:'different',name:'다른 카드',orientation:'역방향',meaning:'다른 의미'}];assert.deepEqual(planner.planMessages(p),planner.planMessages(altered));});
check('question analysis carries the original request rather than an inferred domain',()=>{const data=JSON.parse(planner.planMessages(p)[1].content);assert.equal(data.question,p.question);assert.equal(data.chosenTopic,null);assert.equal(data.chosenFocus,null);assert(!('cards'in data));assert(!('facts'in data));});
check('literal compound request plan accepted',()=>assert(planner.validatePlan(p,good).ok));
for(const [name,mutate]of [
 ['made-up request',x=>x.requests[0].source='이미 발표를 마쳤어요'],
 ['made-up context',x=>x.stated[0].source='이미 발표를 마쳤어요'],
 ['unknown modality',x=>x.stated[0].status='definitely'],
 ['missing purpose',x=>x.requests[0].purpose=''],
 ['duplicate request',x=>x.requests.push({...x.requests[0]})],
 ['wrong clarification type',x=>x.clarification=null],
 ['unexpected top-level claim',x=>x.domain='career'],
 ['wrong requests type',x=>x.requests=3],
 ['wrong stated type',x=>x.stated='none']
])check('reject '+name,()=>{const x=structuredClone(good);mutate(x);assert(!planner.validatePlan(p,x).ok);assert.throws(()=>planner.readingMessages(p,x));});
check('malformed plans are rejected without crashing the validator',()=>{for(const x of [null,1,[],false,{},'plan',{requests:[null],stated:[false],missing:[],clarification:''}])assert(!planner.validatePlan(p,x).ok);});
check('reading sees raw question and oriented symbols, no old canned answer',()=>{const data=JSON.parse(planner.readingMessages(p,good)[1].content);assert.equal(data.question,p.question);assert.equal(data.cards[0].symbolicMeaning,p.cards[0].meaning);assert.equal(data.cards[0].orientation,'정방향');assert(!('meaning'in data.cards[0]));assert.deepEqual(data.questionAnalysis.requests,good.requests);assert(!('baseline'in data));});
check('original uncertainty remains visible even if model classifies it badly',()=>{const x=structuredClone(good);x.stated[0].status='affirmed';assert(planner.validatePlan(p,x).ok);const data=JSON.parse(planner.readingMessages(p,x)[1].content);assert.equal(data.question,p.question);assert.equal(data.questionAnalysis.stated[0].source,'발표는 다음 주이고');});
check('schema has no fixed question-domain vocabulary',()=>{const schema=JSON.stringify(planner.planSchema());assert(!schema.includes('career'));assert(!schema.includes('relationship'));});
const canonical=fs.readFileSync('src/local-reader-planner.js','utf8').replace(/\r\n/g,'\n');const out={total:checks.length,checks,sourceSHA256:crypto.createHash('sha256').update(canonical).digest('hex'),note:'Development protocol and source-preservation checks, not semantic accuracy or expert quality. No model output mocked as an actual answer.'};
require('../scripts/save-artifact.cjs') ('test-results/local-reader/planner-contract-summary.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
