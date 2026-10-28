/* v84: connect literal question constraints to actual card lenses. */
const ARC84_PREVIOUS_REPORT=arc79CreateReport;
function arc84ConstraintText(evidence,operation,plan){
 const usable=ARCANA_READING_EVIDENCE.usable,available=evidence.quantities.find(item=>item.available&&usable(item));
 const clauses=[];let usedQuantity=null;
 if(available&&['improve','prepare','implement','coordinate','prioritize','finish'].includes(operation)){
  const aim={improve:'한 번에 바꿀 요소와 반복할 분량',prepare:'이번에 준비할 필수 단계',implement:'이번에 마칠 작은 일',coordinate:'이번에 맡을 범위와 단계',prioritize:'먼저 할 일과 미룰 일',finish:'이번 단계에서 마칠 범위'}[operation];
  clauses.push(`질문에 적은 시간 ‘${available.text}’ 안에 들어오도록 ${aim}${arc58Josa(aim,'을','를')} 정해 보세요.`);
  usedQuantity={start:available.start,end:available.end,text:available.text};
 }
 if(plan?.target==='artifact'&&['communicate','verify','improve'].includes(operation)){
  if(evidence.verification.some(item=>item.status==='verified'))clauses.push('이미 확인했다고 적은 내용은 설명의 근거로 남기고, 새로 확인해야 할 부분과 구분해 보세요.');
  if(evidence.verification.some(item=>item.status==='unverified'))clauses.push('아직 대조하지 못했다고 적은 부분은 확정된 설명과 구분해 표시하고, 확인할 출처나 담당자를 정해 보세요.');
 }
 return {text:clauses.join(' '),quantity:usedQuantity};
}
function arc84Compare(evidence,pack,spread,previous){
 const a=evidence.options.find(item=>item.label==='A'),b=evidence.options.find(item=>item.label==='B');if(!a||!b)return null;
 const byRole=role=>pack.list.find(card=>card.role===role),cardA=byRole('optionA'),cardB=byRole('optionB');
 const introduction=`질문에 적은 선택지를 구분해 읽었습니다.\nA안: ${a.text}\nB안: ${b.text}`;
 const available=evidence.quantities.filter(item=>item.available&&ARCANA_READING_EVIDENCE.usable(item)),schedule=evidence.schedules.filter(item=>item.scope==='question'&&item.actor!=='other'&&ARCANA_READING_EVIDENCE.usable(item));
 const constraints=[...schedule.map(item=>item.text),...available.map(item=>item.text)].slice(0,3);
 const criteria=(constraints.length?`공통 조건으로 적은 ‘${constraints.join(' · ')}’에 각 안의 시간대와 소요 시간을 대입해 보세요. `:'')+'각 안의 실제 조건과 아직 모르는 부분을 같은 항목으로 비교하세요. 카드의 의미는 확인할 관점이며 어느 안의 결과나 우열을 보장하지 않습니다.';
 let comparisons=null,refs=[];
 if(cardA&&cardB){
  const lensA=ARCANA_READING_BRIDGE.compose('option',arc81Profile(cardA)),lensB=ARCANA_READING_BRIDGE.compose('option',arc81Profile(cardB));
  comparisons=`A안: ${arc81Anchor(cardA,spread)} ${lensA?.text||ARC81_MOTIFS[arc81Profile(cardA)[0]][1]}\n\nB안: ${arc81Anchor(cardB,spread)} ${lensB?.text||ARC81_MOTIFS[arc81Profile(cardB)[0]][1]}`;
  refs=[cardA.index,cardB.index];
 }
 return {text:introduction+'\n\n'+(comparisons||previous)+'\n\n'+criteria,action:criteria,comparisons,refs,options:[a,b]};
}
arc79CreateReport=function(question,spread,cards,override='auto'){
 const report=ARC84_PREVIOUS_REPORT(question,spread,cards,override),model=report.arc82?.model;
 if(!model||model.needsContext||!report.arc82.answers.length)return report;
 const {scene}=arc79Scene(question,override);if(scene.urgent||scene.boundary||scene.abuse)return report;
 const evidence=ARCANA_READING_EVIDENCE.extract(model),pack=arc79Pack(question,spread,cards),applications=[],replacements=new Map(),extra=[];
 for(let index=0;index<report.arc82.answers.length;index++){
  const answer=report.arc82.answers[index],previous=answer.text;
  if(answer.request.kind==='compare'){
   const comparison=arc84Compare(evidence,pack,spread,answer.directText||answer.text);
   if(comparison&&!scene.medical&&!['health','finances'].includes(scene.domain)){
    answer.directText=comparison.text;answer.text=comparison.text;answer.actionText=comparison.action;if(comparison.refs.length)answer.refs=comparison.refs;replacements.set(previous,{body:answer.text,refs:answer.refs});
    applications.push({request:index,operation:'compare',options:comparison.options.map(item=>({label:item.label,start:item.start,end:item.end})),refs:comparison.refs});
    if(comparison.comparisons)report.sections=report.sections.map(section=>section.kind==='relational'&&section.refs.some(ref=>ref===comparison.refs[0])&&section.refs.some(ref=>ref===comparison.refs[1])?{...section,body:comparison.comparisons+' '+comparison.action}:section);
   }
   continue;
  }
  const task={...answer.request,evidenceText:model.evidenceQuestion.slice(answer.request.start,answer.request.end)},plan=ARCANA_TASK_POLICY.plan({question:model.question,evidenceQuestion:model.evidenceQuestion,task,scene,state:model.state});
  if(!plan||scene.medical&&plan.target!=='artifact')continue;
  const card=answer.request.kind==='emotion'?pack.main:pack.advice;
  const shared=index===0&&report.arc81?.directSynthesisUsed?arc81Relations(pack,spread)[0]:null;
  const bridge=ARCANA_READING_BRIDGE.compose(plan.operation,arc81Profile(card),shared?.axis);if(!bridge)continue;
  const context=arc84ConstraintText(evidence,plan.operation,plan),handled=report.arc83?.handled.find(item=>item.request===index);
  const replaceGeneric=handled?.actionSource==='request-policy'&&plan.target==='unspecified'&&!plan.waitingReply&&!plan.submitted&&!plan.contentCheck&&!plan.boundaryText;
  const originalPractical=answer.actionText||plan.text;
  // Keep the essential request and stated stage, even when the card contributes
  // a different emphasis. A symbolic care lens must not erase condition checks.
  const essential=originalPractical.split(/(?<=[.!?。！？])\s+/)[0];
  let practical=replaceGeneric?essential+' 카드의 관점을 더하면, '+bridge.text:originalPractical;
  if(context.text)practical+=' '+context.text;
  // Retain the previous boundaries, factual introductions and card connection.
  // Only the practical text is replaced, by its actual canonical source.
  const originalDirect=answer.directText||answer.text;
  if(originalDirect.includes(originalPractical))answer.directText=originalDirect.replace(originalPractical,practical);
  else answer.directText=originalDirect+(context.text?' '+context.text:'');
  answer.text=answer.directText;answer.actionText=practical;
  const refs=shared?.refs||[card.index],anchor=shared?shared.core:arc81Anchor(card,spread);
  const body=anchor+' '+bridge.text+(context.text?' '+context.text:'');
  if(!report.sections.some(section=>section.body===body)&&!extra.some(section=>section.body===body))extra.push({title:'질문에 적용할 관점',body,refs,kind:'contextual'});
  replacements.set(previous,{body:answer.text,refs:answer.refs});
  applications.push({request:index,operation:plan.operation,group:bridge.group,primaryMotif:bridge.primary,relationAxis:bridge.relationAxis,refs,replaceGeneric,quantity:context.quantity});
 }
 if(applications.length){
  report.direct=report.arc82.answers.map(answer=>answer.directText||answer.text).join('\n\n');
  report.actions=[...new Set(report.arc82.answers.filter(answer=>['action','emotion','compare'].includes(answer.request.kind)).map(answer=>answer.actionText||answer.directText||answer.text))];
  report.sections=[...report.sections.map(section=>section.kind==='request'&&replacements.has(section.body)?{...section,...replacements.get(section.body)}:section),...extra.map((section,index)=>({...section,title:extra.length>1?`질문에 적용할 관점 ${index+1}`:'질문에 적용할 관점'}))];
 }
 report.arc84={version:84,questionEvidence:evidence,applications};return report;
};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(item=>item.id===currentHistoryId);if(record){record.engineVersion=84;setStoredRecords(records);}});
