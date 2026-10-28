const assert=require('node:assert/strict'),fs=require('node:fs');
const {parse}=require('../src/question-model.js');let checks=0;
const check=(name,fn)=>{try{fn();checks++;}catch(error){console.error('Failed: '+name);throw error;}};
// Vary roles, particles, tense and polarity; development properties, not an unseen benchmark.
for(const [noun,verb,negative]of [['연락','했어요','하지 않았어요'],['고백','했어요','하지 않았어요'],['사과','했어요','하지 않았어요'],['메시지','보냈어요','보내지 않았어요'],['문자','보냈어요','보내지 않았어요']])for(const particle of ['을','를','은','는','도'])for(const subject of ['제가','나는','동료가'])for(const negated of [false,true]){
 const q=subject+' '+noun+particle+' '+(negated?negative:verb);check(q,()=>{const r=parse(q);assert.equal(r.state.sent,subject==='동료가'?null:!negated);});
}
const facts=[
 ['연락은 했는데 답장은 오지 않았어요.',{sent:true,received:false}],
 ['답장을 받았지만 고백은 하지 않았어요.',{sent:false,received:true}],
 ['제가 답장했어요.',{received:null}],
 ['친구가 답장했어요.',{received:true}],
 ['친구에게 사과했더니 괜찮다고 답해 줬어요.',{sent:true,received:true}],
 ['친구한테 괜찮다는 회신을 받았어요.',{received:true}],
 ['친구에게 답장이 왔어요.',{received:null}],
 ['고백을 했으면 답을 받았을까요?',{sent:null,received:null}],
 ['문자를 보낼 예정이에요.',{sent:null}],
 ['문자를 보냈을까 봐 걱정돼요.',{sent:null}],
 ['시험 결과는 모릅니다.',{resultKnown:false,waiting:true}],
 ['시험 결과가 공개 전이에요.',{resultKnown:false,waiting:true}],
 ['시험은 끝났어요. 아직 점수를 모르겠어요.',{assessmentCompleted:true,resultKnown:false,waiting:true}],
 ['시험 결과가 확정됐어요.',{resultKnown:true}],
 ['불합격할까 봐 불안해요.',{resultKnown:null}],
 ['불합격했다고 상상했어요.',{resultKnown:null}],
 ['합격했으면 좋겠어요.',{resultKnown:null}],
 ['결과는 아직 나오지 않았어요.',{resultKnown:false}],
 ['원고를 제출했어요.',{submitted:true}],
 ['과제는 제출하지 않았어요.',{submitted:false}]
 ,['친구가 답장도 했는데 저는 불안해요.',{received:true}],['결과는 아직 안 나왔어요.',{resultKnown:false}],['연락을 했는지 모르겠어요.',{sent:null}],['연락을 했지만 자신이 없어요.',{sent:true}],['답장을 받았지만 자신이 없어요.',{received:true}]
];
for(const [q,expected]of facts)check(q,()=>{const state=parse(q).state;for(const [key,value]of Object.entries(expected))assert.equal(state[key],value,key);});
for(const q of ['어떻게 할까요?','그 일이 잘 풀릴까요?','지금 상황을 봐 주세요.'])check('clarify '+q,()=>assert(parse(q).needsContext));
for(const q of ['이직할까요?','오늘의 흐름을 보고 싶어요.','친구에게 어떻게 말할까요?',''])check('do not over-clarify '+q,()=>assert(!parse(q).needsContext));
for(const [q,kinds]of [
 ['모임을 옮길지 남을지 비교하고, 친구에게 결정을 말할 방법도 알려 주세요.',['compare','action']],
 ['새 수업을 시작하기 전에 준비할 일과 불안한 마음을 다룰 방법을 각각 보고 싶어요.',['action','emotion']],
 ['왜 불안할까요? 이유보다 지금 할 행동을 알려 주세요.',['action']],
 ['친구와 비교해서 위축되고 불안해요.',['emotion']],
 ['계속해 온 일을 어떤 관점으로 돌아보면 좋을까요?',['open']],
 ['“언제 합격할까?”라고만 생각했어요. 지금 무엇을 준비할까요?',['action']]
])check(q,()=>assert.deepEqual(parse(q).requests.map(r=>r.kind),kinds));
for(const q of facts.map(([q])=>q))check('evidence spans '+q,()=>{const r=parse(q);for(const event of r.events)assert.equal(r.question.slice(event.start,event.end),event.text);});
for(const noun of ['시험','면접','심사','평가'])for(const time of ['내일','다음 주'])check('upcoming '+noun+time,()=>{const r=parse(noun+'은 '+time+' 볼 예정이에요. 아직 결과는 모르는데 무엇을 준비할까요?');assert(r.state.assessmentUpcoming);assert.equal(r.state.waiting,false);});
check('the first reply predicate determines its direction',()=>{const r=parse('민수는 답장을 보냈다고 했지만 저는 아직 받은 내용이 없어요.');assert.notEqual(r.state.received,true);assert.equal(r.events.find(e=>e.kind==='reply').predicate,'보냈');});
check('completed assessment can still be awaiting a result',()=>{assert(parse('면접은 끝났어요. 결과를 기다립니다.').state.waiting);});
check('an explicitly missing receipt may inherit the previous reply object',()=>{assert.equal(parse('민수는 답장을 보냈다고 했지만 저는 아직 받은 내용이 없어요.').state.received,false);});
check('a missing object is not invented without a reply topic',()=>{assert.equal(parse('받은 내용이 없어요.').state.received,null);});
check('my completed reply is outgoing contact, not an incoming answer',()=>{const state=parse('제가 동생에게 답장했어요. 동생은 아직 대답하지 않았어요.').state;assert.equal(state.sent,true);assert.equal(state.received,false);});
check('reported publication is not a personally verified result',()=>{assert.notEqual(parse('결과가 나왔다는 말을 들었어요.').state.resultKnown,true);});
check('explicitly unverified content keeps a heard result unknown',()=>{assert.equal(parse('결과가 나왔다는 말을 들었지만 아직 공식 내용을 확인하지 않았어요.').state.resultKnown,false);});
check('a present flow is not automatically a future forecast',()=>{assert.equal(parse('지금 어떤 흐름을 살아가는지 카드 상징으로 알아보고 싶어요.').requests[0].kind,'open');assert.equal(parse('앞으로 어떤 흐름이 될까요?').requests[0].kind,'forecast');});
for(const task of ['설명할 방법','확인할 방법','준비할 일'])check('a parallel emotion request is not limited to preparation nouns: '+task,()=>{const parsed=parse('행사에서 '+task+'과 긴장을 다룰 방법을 각각 알려 주세요.');assert.deepEqual(parsed.requests.map(item=>item.kind),['action','emotion']);});
check('unidentified alternatives require their content before comparison',()=>{assert(parse('두 가지 중 하나를 골라 주세요.').needsContext);assert(!parse('두 가지 중 A는 오전 수업이고 B는 저녁 수업이에요. 비교해 주세요.').needsContext);});
check('parallel requests may contain two practical operations',()=>{const parsed=parse('조건 확인 방법과 역할을 분담할 방법을 각각 알려 주세요.');assert.deepEqual(parsed.requests.map(item=>item.kind),['action','action']);assert.equal(parsed.requests[1].goal,'coordinate');for(const task of parsed.requests)assert.equal(parsed.question.slice(task.start,task.end),task.text);});
check('a future when-clause does not turn a missing reply into a received reply',()=>{const parsed=parse('회신은 아직 없어요. 답을 받았을 때 물을 점을 정리해 주세요.');assert.equal(parsed.state.received,false);});
check('a completed application without a form noun retains the completed stage',()=>assert.equal(parse('전시 신청은 이미 접수됐습니다.').state.submitted,true));
fs.mkdirSync('test-results/question-model',{recursive:true});fs.writeFileSync('test-results/question-model/unit-summary.json',JSON.stringify({developmentChecks:checks,passed:checks,note:'Authored development/property checks. Includes regressions informed by actual first outputs. Not independent accuracy or professional evaluation.'},null,2));console.log('Question model development checks: '+checks+' passed');
