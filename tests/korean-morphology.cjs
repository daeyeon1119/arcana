const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),save=require('../scripts/save-artifact.cjs'),m=require('../src/korean-morphology.js'),q=require('../src/question-model.js'),lex=require('../src/lexical-context.js');
const rows=[],checks=[];const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const [question,state]of [
 ['회신은 왔지만 아직 읽지 않았어요.',{received:true,read:false}],
 ['💬 Lin에게 정리한 의견을 보냈습니다.',{sent:true}],
 ['회신을 읽었지만 제 의견은 보내지 않았어요.',{received:true,read:true,sent:false}],
 ['보내 준 답은 읽었습니다.',{received:true,read:true,sent:null}]
]){const actual=q.parse(question);for(const [key,value]of Object.entries(state))assert.equal(actual.state[key],value,question+' '+key);rows.push({question,state:actual.state});}
assert.equal(lex.requestFrame('이해한 내용이 맞는지 여쭈려면 무엇을 준비할까요?').operation,'inquire');
checks.push('content exchange and adjacent past clauses retain separate polarity and unknown relative senders');
for(const question of ['식물을 관찰하다 기침이 계속돼요. 진료에서 무엇을 물을까요?','서버를 점검하던 중 가슴 통증이 있어요.','몸이 아프다는 뜻은 아니에요. 하지만 구토가 계속돼요.']){
 const actual=lex.resolve(question,q.parse(question),'health',true,()=>({domain:'general',medical:false}));assert.equal(actual.medical,true,question);
}
checks.push('nonhuman background and a denied proposition do not erase separately asserted clinical symptoms');
for(const text of ['제가 답변을 받았어요.','😊 민수가 답변을 받았어요.','🎴 저는 받은 답변을 아직 읽지 않았어요.','😊😊 어울리는 사람에게 문자를 보냈어요.','𠮷 씨에게 받은 회신을 읽었어요.','e\u0301 제가 답변을 받았어요.','“회신을 받았다”는 문장을 다듬어요.']){
 const a=m.analyze(text);assert(a.ready);for(const word of a.words){assert.equal(text.slice(word.start,word.end),word.text);assert(!/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(word.text));assert(word.start>=0&&word.end<=text.length);if(word.tokens.some(t=>t.text==='민수'))assert.equal(word.text,'민수가');}rows.push(a);
}checks.push('literal eojeol spans are valid UTF-16 across astral symbols, combining marks and quotations');
const roles=[
 ['😊 유리는 회신을 받았어요.',{received:null}],
 ['🎴 저는 받은 답변을 아직 읽지 않았어요.',{received:true,read:false}],
 ['어울리는 사람에게 문자를 보냈어요.',{sent:true}],
 ['어울리는 사람에게 문자를 보내지 않았어요.',{sent:false}],
 ['유리는 어울리는 사람에게 문자를 보냈어요.',{sent:null}],
 ['오늘 유리는 회신을 받았어요.',{received:null}],
 ['Alex는 회신을 받았어요.',{received:null}],
 ['Mina가 받은 답변을 제가 읽었어요.',{received:null,read:null}],
 ['王은 회신을 받았어요.',{received:null}]
];for(const [question,state]of roles){const actual=q.parse(question);for(const [k,v]of Object.entries(state))assert.equal(actual.state[k],v,question+' '+k);rows.push({question,state:actual.state});}checks.push('nominal subjects, temporal/symbol prefixes and adnominal predicates retain participant polarity');
const purposes=[
 ['무엇을 다시 물어볼까요?','inquire'],
 ['다시 물으려면 어떻게 준비할까요?','inquire'],
 ['처음에 여쭤보려면 무엇부터 준비할까요?','inquire'],
 ['이해한 내용이 맞는지 어떤 질문으로 확인할까요?','inquire'],
 ['조건을 살피려면 무엇부터 할까요?','verify'],
 ['숙련도를 알아보려고 확인할 질문을 어떻게 준비할까요?','inquire'],
 ['정확한 내용을 알아보려고 안내문을 어떻게 준비할까요?',null],
 ['설명을 확인하려면 어떻게 말할까요?',null],
 ['어떤 질문을 고쳐야 할까요?',null],
 ['무엇을 물어보고 어떻게 고칠까요?',null],
 ['질문을 하지 않으려면 어떻게 준비할까요?',null],
 ['강아지가 장난감을 물려면 어떻게 준비할까요?',null],
 ['말을 걸려면 어떤 조건을 확인할까요?',null]
];for(const [text,operation]of purposes){const actual=lex.requestFrame(text);assert.equal(actual?.operation||null,operation,text);rows.push({text,actual});}checks.push('purpose/means and requested question output differ from negative inquiry, biting and explicit condition checks');
const first=q.parse('🎴 저는 받은 회신을 읽지 않았어요. 무엇부터 살펴볼까요?');for(let i=0;i<540;i++)m.analyze('조각 번호 '+i+'를 살펴봅니다.');assert.deepEqual(q.parse(first.question),first);checks.push('cache eviction and preceding analysis do not change a canonical question model');
for(const [text,value]of [['의료진의 설명 등 확인 가능한 정보를 살펴보세요.',false],['관람객의 설명을 듣고 자료를 검토해 보세요.',false],['확인한 내용을 의료진에게 전해 보세요.',true],['전달할 요점과 근거를 짧게 정리해 보세요.',true],['자료의 핵심을 먼저 설명해 보세요.',true],['가능한 날짜를 말하고 방법을 함께 정해 보세요.',true],['일정 조정안을 상의해 보세요.',true]])assert.equal(lex.communicates(text),value,text);checks.push('a communication predicate, including nominal verbal forms, differs from a noun mention of someone else’s explanation');
assert.equal(lex.communicates('지출을 바꿀 때 먼저 상의할 기준을 정해 보세요.'),true);
const status=m.status();assert(status.ready&&!status.failed);assert.equal(status.modelSHA256,hash(fs.readFileSync('vendor/garu/0.11.0/base.gmdl')));assert.equal(status.wasmSHA256,hash(fs.readFileSync('vendor/garu/0.11.0/garu_wasm_bg.wasm')));checks.push('loaded model and WASM are the pinned unchanged vendored bytes');
const vm=require('node:vm'),isolated=vm.createContext({Uint8Array,atob:s=>Buffer.from(s,'base64').toString('binary'),ARCANA_GARU_ASSETS:{wasm:'AA==',model:'AA==',meta:{backend:'TEST ONLY',version:'fault-injection'}},ARCANA_GARU_VENDOR:{create:()=>({analyze:text=>{if(text==='FAULT')throw Error('TEST ONLY failure');return {tokens:[{text,pos:'NNG',start:0,end:[...text].length}]};}})}});
vm.runInContext(fs.readFileSync('src/korean-morphology.js','utf8'),isolated);const api=isolated.ARCANA_KOREAN_MORPHOLOGY;const valid=JSON.stringify(api.analyze('회신'));assert.equal(api.analyze('FAULT'),null);assert.equal(api.status().failed,false);assert.equal(JSON.stringify(api.analyze('회신')),valid);checks.push('synthetic per-input analysis failure does not contaminate later valid analysis or initialization status');
fs.mkdirSync('test-results/lexical',{recursive:true});save('test-results/lexical/unit-summary.json',JSON.stringify({version:require('../package.json').version,status,checks,records:rows.length,scope:'Known Unicode, grammatical-role and purpose development assertions. Not distinct unseen questions, semantic expert scores or a proof of unrestricted Korean analysis.'},null,2)+'\n');save('test-results/lexical/unit-examples.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({checks:checks.length,records:rows.length},null,2));
