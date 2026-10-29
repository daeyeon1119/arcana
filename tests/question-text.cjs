const assert=require('node:assert/strict'),fs=require('node:fs'),text=require('../src/question-text.js'),model=require('../src/question-model.js'),policy=require('../src/task-policy.js'),save=require('../scripts/save-artifact.cjs');let count=0;
const check=(name,fn)=>{try{fn();count++;}catch(error){console.error(name);throw error;}};
for(const [open,close]of [['“','”'],['"','"'],['「','」'],['『','』'],['‘','’'],["'","'"]]){
 for(const body of ['제가 답장을 받았습니다','날짜는 확인했습니다','이모지 🌱와 문자 $& $$'])check('literal spans and masking '+open+body,()=>{const q='문장 '+open+body+close+'를 고칠까요?',spans=text.quotes(q),masked=text.mask(q);assert.equal(spans.length,1);assert.equal(q.slice(spans[0].contentStart,spans[0].contentEnd),body);assert.equal(masked.length,q.length);assert(!masked.includes(body));assert.equal(masked.slice(spans[0].end),q.slice(spans[0].end));});
 check('quoted receipt is not my received reply '+open,()=>{const result=model.parse('자료의 '+open+'제가 답장을 받았습니다'+close+'라는 문장을 어떻게 고칠까요?');assert.equal(result.state.received,null);});
 check('clinical quotation is content to verify '+open,()=>{const question='자료의 '+open+'복용량을 마음대로 늘려도 된다'+close+'라는 문장을 어떻게 고칠까요?',m=model.parse(question),task=m.requests[0],plan=policy.plan({question,evidenceQuestion:m.evidenceQuestion,task:{...task,evidenceText:m.evidenceQuestion.slice(task.start,task.end)},scene:{domain:'health',medical:true},state:m.state});assert(plan.contentCheck);assert(plan.text.includes('의료진·약사'));});
}
for(const name of ["O'Neill", "artist's diary",'James’s notebook'])check('apostrophes do not create a quote '+name,()=>assert.equal(text.quotes(name).length,0));
check('a quoted English apostrophe stays inside its enclosing quotation',()=>assert.equal(text.quotes("'Don't change O'Neill's entry'")[0].text,"Don't change O'Neill's entry"));
check('an unfinished quotation is not assigned a fabricated closing delimiter',()=>assert.equal(text.quotes('‘날짜는 확인했습니다').length,0));
check('filenames and decimal numbers are not sentence boundaries',()=>assert.deepEqual(text.sentences('archive$&$$.pdf의 번호는 1.5입니다. 다음 문장입니다.'),['archive$&$$.pdf의 번호는 1.5입니다','다음 문장입니다']));
check('the requested action precedes a subordinate achievable outcome',()=>assert.equal(text.requestHead('어디를 고쳐야 완성할 수 있을까요?'),'어디를 고쳐야'));
check('a vocative name before the question is not its governing predicate',()=>assert.equal(text.requestHead('민아야 어디를 고쳐야 설명할 수 있을까요?'),'민아야 어디를 고쳐야'));
fs.mkdirSync('test-results/question-text',{recursive:true});save('test-results/question-text/unit-summary.json',JSON.stringify({total:count,passed:count,note:'Known development properties for quote provenance, non-factual quotations and explicit content checks. Not unseen/expert evidence.'},null,2));console.log(JSON.stringify({total:count,passed:count}));
