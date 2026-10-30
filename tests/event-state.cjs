const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib'),save=require('../scripts/save-artifact.cjs'),{parse}=require('../src/question-model.js');
const cases=require('./event-state-dev.json').cases.map(c=>({...c,family:'known-development'}));
const add=(family,question,state)=>cases.push({id:'p'+String(cases.length+1).padStart(3,'0'),family,question,state});
for(const noun of ['답변','회신','답장','대답']){
 for(const subject of ['저는','제가','연구자가','교수는'])for(const verb of ['받은','받아 둔'])for(const tail of ['이 있습니다.','을 아직 읽지 않았어요.','이 도움이 될지는 모르겠어요.'])add('relative receipt and independent processing',subject+' 담당자에게 '+verb+' '+noun+tail,{received:['저는','제가'].includes(subject)?true:null});
 for(const ending of ['읽지 않았어요.','읽지는 않았어요.','아직 못 읽었어요.'])add('unread does not mean unreceived',noun+'을 '+ending,{received:null,replyWaiting:false});
 for(const ending of ['읽었어요.','읽었습니다.'])add('positive reading entails receipt',noun+'을 '+ending,{received:true});
 for(const subject of ['연구자가','해설사는','동료가','민수는'])add('external receiver is not self',subject+' '+noun+'을 받았습니다.',{received:null});
 for(const ending of ['기다립니다.','기다리고 있어요.','기다려요.'])add('waiting does not establish a missing receipt',noun+'을 '+ending,{received:null,replyWaiting:true,replyWaitingSource:'explicit'});
 for(const ending of ['기다리지 않아요.','기다리지는 않습니다.','기다리진 않아요.','안 기다려요.','기다리고 있지는 않아요.','기다리는 상황이 아닙니다.','기다리는 중은 아니에요.','기다릴 생각은 없어요.'])add('negative waiting is not negative receipt',noun+'을 '+ending,{received:null,replyWaiting:false,replyWaitingSource:'denied'});
 for(const ending of ['기다리지 않는 것은 아니에요.','기다리지는 않는 것은 아닙니다.'])add('composed negative waiting operators',noun+'을 '+ending,{received:null,replyWaiting:true});
 for(const ending of ['기다릴까요?','기다린다면 어떻게 할까요?','기다리는 것 같아요.'])add('nonasserted waiting is not a present fact',noun+'을 '+ending,{received:null,replyWaiting:false});
 add('completed past waiting does not establish present waiting','지난주 '+noun+'을 기다렸어요.',{received:null,replyWaiting:false});
 for(const object of ['버스','택배','차'])add('a different object does not inherit reply waiting',noun+'은 아직 없지만 '+object+'를 기다리지 않아요.',{received:false,replyWaiting:true});
 for(const [left,right]of [['“','”'],['"','"'],['「','」'],['『','』'],['‘','’'],["'","'"]])add('quoted receipt is not a personal fact',left+noun+'을 받았습니다'+right+'라는 문장을 다듬고 있어요.',{received:null});
}
for(const subject of ['제가','나는','동료가'])for(const [noun,root]of [['연락','하'],['메시지','보내'],['문자','보내']])for(const focus of ['지','지는','지도','진'])add('focused verbal negation preserves direction',subject+' '+noun+(noun==='연락'?'을':'를')+' '+root+focus+' 않았어요.',{sent:subject==='동료가'?null:false});
for(const modifier of ['좋아하는','존경하는','모르는']){
 for(const negative of [false,true])add('adnominal predicates are not topical actors',modifier+' 사람에게 문자를 '+(negative?'보내지 않았어요.':'보냈어요.'),{sent:!negative});
 add('adnominal predicates do not hide explicit reply absence',modifier+' 사람에게 문자를 보냈는데 답장은 없어요.',{sent:true,received:false});
}
for(const modifier of ['긴','아주 긴','새로운','자세한','매우 자세한'])add('relative sender is not the reader','친구가 보내 준 '+modifier+' 답장을 읽었어요.',{received:true,read:true});
for(const [question,state]of [
 ['어머니는 친구가 보낸 답변을 읽었습니다.',{received:null,read:null}],
 ['저는 친구가 보낸 답변을 읽었습니다.',{received:true,read:true}],
 ['친구가 받은 답변을 제가 읽었습니다.',{received:null,read:null}],
 ['친구에게 온 답변을 제가 읽었습니다.',{received:null,read:null}],
 ['원고를 보냈어요. 답을 기다리는 동안 뭘 할까요?',{received:null,replyWaiting:true}],
 ['제안서를 보냈어요. 답을 기다리며 무엇을 할까요?',{received:null,replyWaiting:true}],
 ['답변을 기다릴 때 계속 확인하는 이유가 뭘까요?',{received:null,replyWaiting:false}]
])add('clause roles and predicate-local waiting modality',question,state);
const rows=cases.map(c=>({...c,actual:parse(c.question)})),failures=[];
for(const [question,bound]of [
 ['답변을 받았습니다. 그 내용을 어떻게 설명할까요?',true],
 ['받은 회신이 도움이 될지는 모르겠어요. 어떤 점을 다시 물어볼까요?',true],
 ['받은 답변을 아직 읽지 않았습니다. 무엇부터 살펴볼까요?',true],
 ['받은 답변은 있습니다. 별개로 회사 안내문을 어떻게 설명할까요?',false],
 ['받은 답변은 있습니다. 회사 안내문을 어떻게 설명할까요?',false],
 ['제가 답변을 받았습니다. 새 계획은 어떻게 준비할까요?',false],
 ['친구가 받은 답변이 있습니다. 무엇부터 살펴볼까요?',false],
 ['답변을 받을 예정입니다. 무엇부터 살펴볼까요?',false],
 ['답변을 받았다면 무엇부터 살펴볼까요?',false],
 ['받은 답변을 제쳐두고 다른 질문을 어떻게 준비할까요?',false]
]){const m=parse(question);assert.equal(m.requests.some(r=>r.context?.type==='received-content'),bound,'current topic binding: '+question);}
assert.equal(parse('받은 답변을 아직 읽지 않았습니다.').state.read,false);
assert.equal(parse('답변을 읽었습니다.').state.read,true);
assert.equal(parse('저는 받은 회신은 있지만 답하지는 않았어요. 이제 어떻게 정리할까요?').requests[0].context.sourceEvent.object,'회신');
for(const row of rows){
 for(const [key,value]of Object.entries(row.state))if(row.actual.state[key]!==value)failures.push({id:row.id,family:row.family,question:row.question,key,expected:value,actual:row.actual.state[key]});
 for(const event of row.actual.events){assert.equal(row.actual.question.slice(event.start,event.end),event.text,'event literal span');if(event.waitingEvidence)assert.equal(row.actual.question.slice(event.waitingEvidence.start,event.waitingEvidence.end),event.waitingEvidence.text,'waiting literal span');}
}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),folder='test-results/event-state/development';fs.mkdirSync(folder,{recursive:true});
const sources=Object.fromEntries(['src/event-evidence.js','src/question-model.js'].map(name=>[name,hash(fs.readFileSync(name,'utf8').replace(/\r\n/g,'\n'))]));
const summary={packageVersion:require('../package.json').version,sourceSHA256:sources,properties:rows.length,passed:rows.length-new Set(failures.map(f=>f.id)).size,topicAndReadAssertions:13,failures,note:'Known author-written grammar and metamorphic development properties plus 13 topic/read assertions. These are not distinct unseen user questions, semantic expert scores or a claim of unrestricted Korean understanding.'};
if(failures.length&&!fs.existsSync(folder+'/property-initial-failures.json'))save(folder+'/property-initial-failures.json',JSON.stringify(summary,null,2)+'\n');
save(folder+'/property-readings.jsonl.gz',zlib.gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));save(folder+'/property-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert.equal(failures.length,0,'event-state development properties');
