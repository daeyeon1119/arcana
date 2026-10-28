/* v83: keep practical requests ahead of broad topic templates, with actual card evidence. */
const ARC83_PREVIOUS_REPORT=arc79CreateReport;
arc79CreateReport=function(question,spread,cards,override='auto'){
 const report=ARC83_PREVIOUS_REPORT(question,spread,cards,override),model=report.arc82?.model;
 if(!model||model.needsContext||!report.arc82.answers.length)return report;
 const {scene}=arc79Scene(question,override),pack=arc79Pack(question,spread,cards),plans=[],replacements=new Map();
 for(const answer of report.arc82.answers){
  const task={...answer.request,evidenceText:model.evidenceQuestion.slice(answer.request.start,answer.request.end)};
  const plan=ARCANA_TASK_POLICY.plan({question:model.question,evidenceQuestion:model.evidenceQuestion,task,scene,state:model.state});
  if(!plan){plans.push(null);continue;}
  const compatible=(operation,text)=>!(operation==='coordinate'&&plan.participants!==true)&&(operation===plan.operation||plan.operation==='communicate'&&operation==='coordinate'||plan.operation==='prepare'&&operation==='communicate'&&/근거|논거|설명|말할|말하|말을|할\s*말|이야기|대화|제안|질문|발표|협상/.test(task.evidenceText))&&ARCANA_TASK_POLICY.supports(plan,text,model.evidenceQuestion,task.evidenceText);
  const previousOperation=answer.actionTask||ARCANA_TASK_POLICY.operation({kind:'action',goal:'action',text:answer.actionText||''},model.evidenceQuestion);
  let supported=compatible(previousOperation,answer.actionText),practical=answer.actionText,actionSource='existing-operation-specific';
  if(!supported){
   const contextual={...scene,facts:{...scene.facts},intent:answer.request.kind};
   const contextText=ARC82_ACTION(contextual,pack),contextOperation=contextual.arc81ActionTask||contextual.arc80ActionTask||ARCANA_TASK_POLICY.operation({kind:'action',goal:'action',text:contextText},model.evidenceQuestion);
   if(compatible(contextOperation,contextText)){supported=true;practical=contextText;actionSource='context-operation-specific';}
  }
  if(supported&&actionSource==='existing-operation-specific'&&!['health','finances'].includes(scene.domain)){answer.actionTask=previousOperation;plans.push(null);continue;}
  // An existing operation-specific action wins over the generic fallback. Broad
  // topic introductions must not hide it; safety checks have already run above.
  if(!supported){practical=plan.text;actionSource='request-policy';}
  const card=answer.request.kind==='emotion'?pack.main:pack.advice;
  const shared=plans.length===0&&report.arc81?.directSynthesisUsed?arc81DirectRelation(pack,spread,answer.request.kind):null;
  const previous=answer.text;answer.actionText=practical;answer.directText=plan.boundaryText+practical+' '+(shared?.core||arc80CardSentence(card,spread));answer.text=answer.directText;answer.refs=shared?.refs||[card.index];replacements.set(previous,{body:answer.text,refs:answer.refs});plans.push({...plan,text:practical,actionSource});
 }
 if(plans.some(Boolean)){
  report.direct=report.arc82.answers.map(answer=>answer.directText||answer.text).join('\n\n');
  if(plans[0])report.headline=report.arc82.answers.length>1?'요청한 관점을 함께 살펴볼게요':plans[0].headline;
  report.actions=[...new Set(report.arc82.answers.filter(answer=>['action','emotion'].includes(answer.request.kind)).map((answer)=>{const index=report.arc82.answers.indexOf(answer);return plans[index]?.text||answer.actionText||answer.directText||answer.text;}))];
  report.sections=report.sections.map(section=>section.kind==='request'&&replacements.has(section.body)?{...section,...replacements.get(section.body)}:section);
 }
  report.arc83={version:83,policy:'request-first',handled:plans.map((plan,index)=>plan?{request:index,operation:plan.operation,target:plan.target,participants:plan.participants,source:plan.source,scope:plan.scope,actionSource:plan.actionSource}:null).filter(Boolean)};
 return report;
};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(item=>item.id===currentHistoryId);if(record){record.engineVersion=83;setStoredRecords(records);}});
