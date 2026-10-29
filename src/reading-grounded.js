/* Connect literal constraints and requested work to actual card lenses. */
function arc87CardFacet(card,participants){
 const motif=arc81Profile(card)[0];
 const self={connection:'기대하는 경험과 실제로 이어 가는 방식을 나누어 살펴보세요.',exchange:'들이는 시간과 힘, 그 과정에서 얻는 만족이 어떤 관계인지 살펴보세요.',support:'이미 쓸 수 있는 자원과 새로 필요한 도움을 구별해 보세요.',isolation:'혼자 할 필요가 있는 일과 이용할 수 있는 자원을 나누어 보세요.',mismatch:'바라는 상태와 실제 진행 상태 사이에서 어떤 부분이 어긋나는지 살펴보세요.',expression:'느끼는 것과 실제 표현으로 옮길 내용을 구별해 보세요.',suppression:'감정을 느끼는 일과 행동으로 옮길 때의 조절을 나누어 보세요.',conflict:'서로 맞지 않는 요구가 있다면 각각의 목적과 감당할 범위를 나누어 보세요.'};
 return {motif,text:participants!==true&&self[motif]||ARC81_MOTIFS[motif][1]};
}
function arc87AppliedLens(card,relation,spread,plan,bridge,usedRefs){
 const cards=relation?relation.refs.map(index=>relation.cards[index]):[card];
 const anchor=atom=>`‘${SPREADS[spread].slots[atom.index][0]}’의 ${atom.name} ${atom.reverse?'역방향':'정방향'}에서 살필 관점은 ‘${arc81Profile(atom).map(motif=>ARC81_MOTIFS[motif][0]).join('·')}’입니다.`;
 const facet=relation?relation.insight:arc87CardFacet(card,plan.participants).text;
 const roles=cards.map(atom=>atom.role),roleFrame=roles.includes('boundary')?'이미 진행된 외부 절차와 조절할 태도를 나누어 보면, ':roles.some(role=>['future','outcome'].includes(role))?'현재 방향이 이어질 때 점검할 관점으로 읽으면, ':roles.includes('obstacle')?'실제로 막히는 부분이 있는지 살피는 관점으로, ':'';
 const refs=cards.map(atom=>atom.index),reused=refs.every(index=>usedRefs.has(index));for(const index of refs)usedRefs.add(index);
 const operationName={communicate:'설명',inquire:'질문 준비',verify:'조건 확인',improve:'수정',prepare:'준비',coordinate:'분담',prioritize:'우선순위',finish:'마무리',implement:'실행',cope:'마음 돌보기'}[plan.operation];
 const introduction=reused?`같은 카드의 관점을 ${operationName}에 적용하면, `:cards.map(anchor).join(' ')+' '+facet+' ';
 return {text:introduction+roleFrame+bridge.text,refs,operation:plan.operation,relationAxis:relation?.axis||null,facets:cards.map(atom=>({index:atom.index,id:atom.id,reverse:atom.reverse,motifs:arc81Profile(atom)})),roleFrame,reused};
}
const ARC84_PREVIOUS_REPORT=arc79CreateReport;
function arc84ConstraintText(evidence,operation,plan,taskText,usedVerification){
 const usable=ARCANA_READING_EVIDENCE.usable,timeBinding=ARCANA_READING_EVIDENCE.chooseTime(evidence,taskText),available=timeBinding.value;
 const clauses=[];let usedQuantity=null;
 if(available&&['improve','prepare','implement','coordinate','prioritize','finish'].includes(operation)){
  const aim={improve:'한 번에 바꿀 요소와 반복할 분량',prepare:'이번에 준비할 필수 단계',implement:'이번에 마칠 작은 일',coordinate:'이번에 맡을 범위와 단계',prioritize:'먼저 할 일과 미룰 일',finish:'이번 단계에서 마칠 범위'}[operation];
  clauses.push(`질문에 적은 시간 ‘${available.text}’ 안에 들어오도록 ${aim}${arc58Josa(aim,'을','를')} 정해 보세요.`);
  usedQuantity={start:available.start,end:available.end,text:available.text};
 }else if(timeBinding.candidates.length&&['improve','prepare','implement','coordinate','prioritize','finish'].includes(operation)){
  const values=[...new Set(timeBinding.candidates.map(item=>item.text))];
  clauses.push(values.length===1?`질문에 적은 ‘${values[0]}’${arc58Josa(values[0],'이','가')} 이번 요청에 쓸 수 있는 시간인지 먼저 확인해 보세요.`:`시간 조건 ‘${values.join(' · ')}’ 중 이번 요청에 쓸 수 있는 범위가 무엇인지 먼저 확인해 보세요.`);
 }
 let appliedVerification=[];
 if(plan?.target==='artifact'&&!usedVerification?.size&&['communicate','verify','improve','prepare','coordinate','prioritize','finish','implement','inquire'].includes(operation)){
  const result=ARCANA_VERIFICATION_FACTS.advice(evidence.verification,operation);
  if(result.text){clauses.push(result.text);appliedVerification=result.groups;for(const group of result.groups)usedVerification?.add(group.target.start+':'+group.target.end);}
 }
 if(['improve','prepare','implement','coordinate','verify'].includes(operation)){
  const resources=evidence.quantities.filter(item=>item.constraintRole&&item.scope==='question'&&item.actor!=='other'&&usable(item));
  if(resources.length){const labels=[...new Set(resources.map(item=>item.constraintRole==='budget'?'예산':'수량·규모'))].join('·');clauses.push(`질문에 적은 ${labels} 조건 ‘${resources.map(item=>item.text).join(' · ')}’${arc58Josa(resources.at(-1).text,'을','를')} 함께 두고, 실제 비용이나 실행 방법이 이 조건과 맞는지 원자료에서 확인해 보세요.`);}
 }
 return {text:clauses.join(' '),quantity:usedQuantity,timeBinding,verification:appliedVerification};
}
function arc84Compare(evidence,pack,spread,previous){
 const options=evidence.options;if(!options.length)return null;
 const byRole=role=>pack.list.find(card=>card.role===role),cardA=byRole('optionA'),cardB=byRole('optionB');
 if(options.length<2||options.some(item=>!item.defined))return {mode:'clarify',text:'비교할 선택지의 내용이 필요합니다. 아직 정하지 않은 안의 내용과 중요하게 보는 기준을 알려 주세요.',action:'아직 정하지 않은 선택지의 내용을 먼저 확인해 보세요.',comparisons:null,refs:[],options};
 const introduction='질문에 적은 선택지를 구분해 읽었습니다.\n'+options.map(item=>item.label+'안: '+item.text).join('\n');
 const available=evidence.quantities.filter(item=>item.available&&item.resourceConfidence>=3&&ARCANA_READING_EVIDENCE.usable(item)),schedule=evidence.schedules.filter(item=>item.scope==='question'&&item.actor!=='other'&&ARCANA_READING_EVIDENCE.usable(item));
 const constraints=[...schedule.map(item=>item.text),...available.map(item=>item.text)].slice(0,3);
 const criteria=(constraints.length?`공통 조건으로 적은 ‘${constraints.join(' · ')}’에 각 안의 시간대와 소요 시간을 대입해 보세요. `:'')+'각 안의 실제 조건과 아직 모르는 부분을 같은 항목으로 비교하세요. 카드의 의미는 확인할 관점이며 어느 안의 결과나 우열을 보장하지 않습니다.';
 let comparisons=null,refs=[];
 if(options.length>2){
  const common=byRole('criteria')||byRole('advice')||pack.main,lens=ARCANA_READING_BRIDGE.compose('compare',arc81Profile(common));
  return {mode:'common',text:introduction+'\n\n'+`선택지가 ${options.length}개이므로 각 안의 결과를 카드 한 장씩에 임의로 배정하지 않고 공통 기준으로 비교합니다. `+arc81Anchor(common,spread)+' '+(lens?.text||'같은 항목에서 확인한 조건과 아직 모르는 부분을 나누어 보세요.')+'\n\n'+criteria,action:criteria,comparisons:null,refs:[common.index],options};
 }
 const ordered=[...options].sort((a,b)=>a.sourceStart-b.sourceStart),namedA=options.find(item=>item.label==='A'),namedB=options.find(item=>item.label==='B'),[a,b]=namedA&&namedB?[namedA,namedB]:ordered;
 if(cardA&&cardB){
  const lensA=ARCANA_READING_BRIDGE.compose('option',arc81Profile(cardA)),lensB=ARCANA_READING_BRIDGE.compose('option',arc81Profile(cardB));
  comparisons=`${a.label}안: ${arc81Anchor(cardA,spread)} ${lensA?.text||ARC81_MOTIFS[arc81Profile(cardA)[0]][1]}\n\n${b.label}안: ${arc81Anchor(cardB,spread)} ${lensB?.text||ARC81_MOTIFS[arc81Profile(cardB)[0]][1]}`;
  refs=[cardA.index,cardB.index];
 }
 return {mode:'pair',text:introduction+'\n\n'+(comparisons||previous)+'\n\n'+criteria,action:criteria,comparisons,refs,options:[a,b]};
}
arc79CreateReport=function(question,spread,cards,override='auto'){
 const report=ARC84_PREVIOUS_REPORT(question,spread,cards,override),model=report.arc82?.model;
 if(!model||model.needsContext||!report.arc82.answers.length)return report;
 const {scene}=arc79Scene(question,override);if(scene.urgent||scene.boundary||scene.abuse)return report;
 const evidence=ARCANA_READING_EVIDENCE.extract(model),pack=arc79Pack(question,spread,cards),applications=[],replacements=new Map(),extra=[],usedVerification=new Set(),usedLensRefs=new Set();
 for(let index=0;index<report.arc82.answers.length;index++){
  const answer=report.arc82.answers[index],previous=answer.text;
  if(answer.request.kind==='compare'){
   const comparison=arc84Compare(evidence,pack,spread,answer.directText||answer.text);
   if(comparison&&!scene.medical&&!['health','finances'].includes(scene.domain)){
    answer.directText=comparison.text;answer.text=comparison.text;answer.actionText=comparison.action;if(comparison.refs.length)answer.refs=comparison.refs;replacements.set(previous,{body:answer.text,refs:answer.refs});
    applications.push({request:index,operation:'compare',mode:comparison.mode,options:comparison.options.map(item=>({label:item.label,start:item.start,end:item.end})),refs:comparison.refs});
    if(comparison.comparisons)report.sections=report.sections.map(section=>section.kind==='relational'&&section.refs.some(ref=>ref===comparison.refs[0])&&section.refs.some(ref=>ref===comparison.refs[1])?{...section,body:comparison.comparisons+' '+comparison.action}:section);
    if(comparison.mode==='common')report.sections=report.sections.filter(section=>!(section.kind==='relational'&&section.refs.some(ref=>pack.list[ref].role==='optionA')&&section.refs.some(ref=>pack.list[ref].role==='optionB'))).map(section=>section.kind==='card'&&section.refs.some(ref=>['optionA','optionB'].includes(pack.list[ref].role))?{...section,title:section.title+' (특정 안에 미배정)',body:'이 자리는 이번 선택지 중 하나의 결과로 임의 배정하지 않습니다. '+section.body}:section);
   }
   continue;
  }
  const task={...answer.request,evidenceText:model.evidenceQuestion.slice(answer.request.start,answer.request.end)},plan=ARCANA_TASK_POLICY.plan({question:model.question,evidenceQuestion:model.evidenceQuestion,task,scene,state:model.state});
  if(!plan||scene.medical&&plan.target!=='artifact')continue;
  const card=answer.request.kind==='emotion'?pack.main:pack.advice;
  const shared=index===0&&report.arc81?.directSynthesisUsed?arc81DirectRelation(pack,spread,answer.request.kind):null;
  const relation=shared&&!['alternatives','distinct'].includes(shared.kind)?shared:null;
  const bridge=ARCANA_READING_BRIDGE.compose(plan.operation,arc81Profile(card),relation?.axis,{participants:plan.participants});if(!bridge)continue;
  const usesPair=!!(relation&&bridge.relationAxis&&bridge.primary===null);
  const context=arc84ConstraintText(evidence,plan.operation,plan,task.evidenceText,usedVerification),handled=report.arc83?.handled.find(item=>item.request===index);
  const replaceGeneric=handled?.actionSource==='request-policy'&&plan.target==='unspecified'&&!plan.waitingReply&&!plan.submitted&&!plan.contentCheck&&!plan.boundaryText;
  const originalPractical=answer.actionText||plan.text;
  // Keep all practical steps, not only the first sentence. Card emphasis must
  // not remove completion lists, question examples or source-checking steps.
  let practical=context.verification.length?ARCANA_VERIFICATION_FACTS.practical(originalPractical):originalPractical;
  if(context.text)practical+=' '+context.text;
  const integrateLens=!scene.medical&&!['health','finances'].includes(scene.domain)&&!scene.facts.known;
  if(replaceGeneric&&!integrateLens)practical+='\n\n'+(usesPair?'카드의 연결을 더하면, ':`‘${SPREADS[spread].slots[card.index][0]}’ 카드의 관점을 더하면, `)+bridge.text;
  // Retain the previous boundaries, factual introductions and card connection.
  // Only the practical text is replaced, by its actual canonical source.
  const originalDirect=answer.directText||answer.text;
  if(originalDirect.includes(originalPractical))answer.directText=originalDirect.replace(originalPractical,()=>practical);
  else answer.directText=originalDirect+(context.text?' '+context.text:'');
  const appliedLens=integrateLens?arc87AppliedLens(card,usesPair?{...relation,cards:pack.list}:null,spread,plan,bridge,usedLensRefs):null;
  if(appliedLens){
   const previousLens=usesPair?relation.core:arc80CardSentence(card,spread);
   const lensStart=answer.directText.indexOf(previousLens);
   answer.directText=lensStart>=0?answer.directText.slice(0,lensStart).trimEnd()+'\n\n'+appliedLens.text+answer.directText.slice(lensStart+previousLens.length):answer.directText+'\n\n'+appliedLens.text;
  }
  answer.text=answer.directText;answer.actionText=practical;
  const refs=usesPair?relation.refs:[card.index],anchor=usesPair?relation.core:arc81Anchor(card,spread);
  const body=anchor+' '+bridge.text+(context.text?' '+context.text:'');
  if(!appliedLens&&!report.sections.some(section=>section.body===body)&&!extra.some(section=>section.body===body))extra.push({title:'질문에 적용할 관점',body,refs,kind:'contextual'});
  replacements.set(previous,{body:answer.text,refs:answer.refs});
  applications.push({request:index,operation:plan.operation,group:bridge.group,primaryMotif:bridge.primary,relationAxis:bridge.relationAxis,contextRule:bridge.contextRule,refs,replaceGeneric,quantity:context.quantity,timeBinding:context.timeBinding,verification:context.verification,directLens:appliedLens});
 }
 if(applications.length){
  report.direct=report.arc82.answers.map(answer=>answer.directText||answer.text).join('\n\n');
  report.actions=[...new Set(report.arc82.answers.filter(answer=>['action','emotion','compare'].includes(answer.request.kind)).map(answer=>answer.actionText||answer.directText||answer.text))];
  report.sections=[...report.sections.map(section=>section.kind==='request'&&replacements.has(section.body)?{...section,...replacements.get(section.body)}:section),...extra.map((section,index)=>({...section,title:extra.length>1?`질문에 적용할 관점 ${index+1}`:'질문에 적용할 관점'}))];
 }
 report.arc84={version:84,questionEvidence:evidence,applications};return report;
};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(item=>item.id===currentHistoryId);if(record){record.engineVersion=84;setStoredRecords(records);}});
