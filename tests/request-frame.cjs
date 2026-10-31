const assert=require('node:assert/strict'),fs=require('node:fs'),save=require('../scripts/save-artifact.cjs');
const q=require('../src/question-model.js'),policy=require('../src/task-policy.js'),bridge=require('../src/reading-bridge.js');
const checks=[],examples=[];const check=(name,run)=>{run();checks.push(name);};
const parse=text=>{const model=q.parse(text);examples.push(model);return model;};
const plan=(question,scene={})=>{const model=parse(question),task=model.requests.at(-1);return policy.plan({question:model.question,evidenceQuestion:model.evidenceQuestion,task,scene,state:model.state});};
check('literal predicate, object, inherited topic and compound task spans match normalized source',()=>{
 for(const c of require('./request-frame-dev.json').cases){const m=parse(c.question);for(const t of m.requests){assert.equal(m.question.slice(t.start,t.end),t.text);for(const s of [t.work?.predicate,t.work?.target?.evidence,t.work?.target?.carrier?.evidence].filter(Boolean))assert.equal(m.question.slice(s.start,s.end),s.text);}}
});
check('inspection works across document and observation nouns and inflected verbs',()=>{
 for(const [noun,kind]of [['보고서','document'],['안내문','document'],['목차','document'],['관찰 일지','observation'],['연습 기록','observation'],['조사 노트','observation']])for(const verb of ['점검할까요','검토할까요','살펴볼까요']){const p=plan(noun+'를 어떻게 '+verb+'?');assert.equal(p.operation,'inspect');assert.equal(p.object.kind,kind);assert(!/시간·비용|매수|담당자·마감/.test(p.text));}
});
check('the direct object wins over background material and metaphor words',()=>{
 for(const [text,kind]of [['자료의 조건을 확인하려고 작품을 어떻게 편집할까요?','creative'],['표현 방식을 참고해 음악을 어떻게 다듬을까요?','creative'],['과거 기록을 참고해 문서를 어떻게 고칠까요?','document'],['의견을 듣고 노트를 어떻게 점검할까요?','observation']])assert.equal(parse(text).requests.at(-1).work.target.kind,kind);
 const p=plan('자료의 조건을 확인하려고 작품을 어떻게 편집할까요?');assert.equal(p.target,'unspecified');assert(!p.text.includes('원자료와 대조'));
 const quoted=plan('자료의 “약 용량을 항상 바꿔도 된다”라는 문구를 참고해 영상을 어떻게 편집할까요?');assert(quoted.contentCheck);assert(quoted.text.includes('의료진·약사'));
});
check('a source document and its requested criteria remain separate and literal',()=>{
 for(const topic of ['신청','예약','등록','이용']){const p=plan(topic+' 조건에서 무엇을 확인할까요?');assert.equal(p.object.subtype,'conditions');for(const term of ['필수','시간','비용','변경','중단','질문'])assert(p.text.includes(term));}
 for(const topic of ['저축','시설 이용','강좌 등록']){const p=plan(topic+' 조건은 아직 확인 전이에요. 무엇을 살펴봐야 할까요?');assert.equal(p.operation,'verify');assert.equal(p.object.kind,'requirements');}
 const text='이 자료에서 어떤 조건을 확인해야 할까요?',p=plan(text);assert.equal(p.operation,'verify');assert.equal(p.object.kind,'requirements');assert.equal(p.object.carrier.kind,'document');assert.equal(p.target,'artifact');assert(p.text.includes('기준일'));
 const post=plan('신청은 이미 접수됐습니다. 추가 사진을 보낼 수 있는지 등 접수 뒤의 조건에서 무엇을 확인할까요?');assert.equal(post.operation,'verify');assert(post.text.includes('이미 접수한 절차는 반복하지'));
 const inquiry=plan('답을 받았을 때 다시 물을 사항을 정리하는 방법을 알려 주세요.');assert.equal(inquiry.operation,'inquire');
 const required=plan('신청 자격과 필요한 자료에서 무엇을 확인할까요?');assert.equal(required.operation,'verify');assert.equal(required.object.kind,'requirements');assert.equal(required.target,'unspecified');
});
check('specific clarification and repeated goals preserve each actual object',()=>{
 const clarified=parse('무엇부터 해야 할지 모르겠어요. 지금 어떤 방향이 좋을까요? 연습 기록을 점검하는 방법이 궁금합니다.');assert.equal(clarified.requests.length,1);assert.equal(clarified.requests[0].work.operation,'inspect');assert.equal(clarified.requests[0].work.target.kind,'observation');
 const both=parse('보고서의 구성을 점검하고 싶어요. 그리고 관찰 일지의 빈틈도 점검해 주세요.');assert.deepEqual(both.requests.map(t=>t.kind),['action','action']);assert.deepEqual(both.requests.map(t=>t.work.target.kind),['document','observation']);
 const genericTail=parse('안내문을 어떻게 고칠까요? 카드로 좀 돌아보고 싶어요.');assert.equal(genericTail.requests.length,1);assert.equal(genericTail.requests[0].work.operation,'improve');
 const forecast=parse('자료를 수정하면 앞으로 어떻게 흘러갈지 궁금해요.');assert.equal(forecast.requests[0].kind,'forecast');assert.equal(forecast.requests[0].work,undefined);
});
check('self and other expression reflection retain ownership without inventing responses',()=>{
 for(const [owner,expected]of [['제','self'],['그의','other'],['상대의','other']]){const p=plan(owner+' 표현을 어떻게 돌아볼까요?');assert.equal(p.operation,'reflect');assert.equal(p.object.owner,expected);assert(p.text.includes(expected==='self'?'실제로 쓴 표현':'확인되지 않았다면'));}
 const p=plan('상대의 속마음 추측보다 지금 가진 자료와 빠진 자료를 어떤 기준으로 구별할까요?');assert.equal(p.object.owner,'unspecified');
 assert.equal(plan('제 표현을 돌아보고 싶어요.').operation,'reflect');
});
check('separate nominal outputs and coordinated predicates both keep all requested work',()=>{
 for(const text of ['확인할 항목과 물어볼 질문을 각각 정리해 주세요.','연습 기록을 점검하고 불안한 마음을 다룰 방법을 각각 알려 주세요.']){const m=parse(text);assert.equal(m.requests.length,2);assert.equal(m.requests[0].work.operation,'inspect');assert.equal(m.requests[1].work.operation,text.startsWith('확인')?'inquire':'cope');}
});
check('method of explaining a reason differs from asking for its cause',()=>{
 const a=parse('제 선택의 이유를 가족에게 어떻게 설명할까요?');assert.equal(a.requests[0].kind,'action');assert.equal(a.requests[0].work.operation,'communicate');
 const b=parse('그 설명을 듣고 왜 불안한지 궁금해요.');assert.equal(b.requests[0].kind,'cause');
});
check('bare generic direction asks for context while topic and emotion remain usable',()=>{
 for(const text of ['무엇부터 해야 할지 모르겠어요. 지금 어떤 방향이 좋을까요?','내용은 아직 정하지 않았어요. 두 가지 중 어느 쪽을 고를까요?'])assert(parse(text).needsContext);
 for(const text of ['이직할까요?','불안한 마음을 어떻게 돌볼까요?','오늘 하루의 흐름을 돌아볼까요?','결정을 못 하는 제가 한심하게 느껴져요.','혼자 쉬는 것과 믿는 사람을 만나는 것 중 무엇이 나을까요?','지난 선택에서 배운 것을 돌아보고 싶어요.','기다림을 견디는 제 방식을 돌아보고 싶어요.'])assert(!parse(text).needsContext);
});
check('reflection keeps its personal object and simultaneous background is not a second request',()=>{
 for(const text of ['창작을 계속하는 제 이유를 돌아보고 싶어요.','직장 회의에서 말을 아끼게 되는 제 태도를 돌아보고 싶어요.'])assert.equal(plan(text).object.kind,'experience');
 const m=parse('이번 시험을 준비하며 제가 배운 태도를 돌아보고 싶어요.');assert.equal(m.requests.length,1);assert.equal(m.requests[0].work.operation,'reflect');
});
check('unreceived and hypothetical content never become an actually received answer',()=>{
 const m=parse('아직 답은 받지 못했습니다. 답을 읽었다고 가정하면 어떤 질문을 준비해야 할까요?');assert.equal(m.state.received,false);assert.notEqual(m.state.read,true);
});
check('clinical description editing cannot authorize changing clinical quantities',()=>{
 const p=plan('증상 설명을 간결하게 전하려면 어떤 점을 줄여야 할까요?',{domain:'health',medical:true});assert.equal(p.operation,'improve');assert.equal(p.object.kind,'message');assert(p.text.includes('중요한 정보'));assert(p.boundaryText.includes('의료진'));
 for(const text of ['설명은 읽었지만 약 용량을 어떻게 줄일까요?','자료는 완성했어요. 약을 어떻게 바꿀까요?'])assert.equal(plan(text,{domain:'health',medical:true}),null);
});
check('an earlier document cannot turn actual asset review into document editing',()=>{
 assert.equal(plan('문서를 읽고 주식을 어떻게 살필까요?',{domain:'finances'}),null);
});
check('alone work and interpersonal agreement use different objects and wording',()=>{
 const p=plan('함께 일하는 사람은 없습니다. 제가 맡은 일을 어떻게 나눠 진행할까요?');assert.equal(p.participants,false);assert(p.text.includes('혼자 맡은 일'));
 const a=plan('서로의 약속을 어떻게 조율할까요?');assert.equal(a.object.kind,'interaction');assert(!/담당자|마감|완료 기준/.test(a.text));
});
check('card lenses use the requested object without changing drawn motifs',()=>{
 const a=bridge.compose('coordinate',['structure'],null,{participants:true,object:{kind:'interaction'}});assert(a.text.includes('동의하지 않는 부분'));assert(!a.text.includes('할 일과 맡을 범위'));
 const b=bridge.compose('verify',['resources'],null,{object:{kind:'requirements'}});assert(b.text.includes('현재 자료'));assert(!b.text.includes('비용'));
 for(const op of ['inspect','reflect','compare'])for(const motifs of [['clarity'],['speed'],['resources'],['structure'],['exchange'],['skill'],['values'],['transition'],['care']])assert(bridge.compose(op,motifs));
});
fs.mkdirSync('test-results/request-frame',{recursive:true});save('test-results/request-frame/unit-summary.json',JSON.stringify({version:require('../package.json').version,checks,examples:examples.length,note:'Known grammar, object, scope, actor and safety development properties. No new evaluation or expert quality score.'},null,2)+'\n');save('test-results/request-frame/unit-examples.json',JSON.stringify(examples,null,2)+'\n');console.log(JSON.stringify({checks:checks.length,examples:examples.length},null,2));
