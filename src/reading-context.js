/* Project explicit question evidence into the legacy reading, then cover every request. */
const ARC82_SCENE=arc79Scene;
arc79Scene=function(question,override='auto'){
 const parsed=ARC82_SCENE(question,override),scene=parsed.scene,model=ARCANA_QUESTION_MODEL.parse(question),state=model.state;
 if(model.evidenceQuestion!==model.question)scene.facts={...ARC82_SCENE(model.evidenceQuestion,override).scene.facts};
 const f=scene.facts;
 const contacts=model.events.filter(e=>e.kind==='contact'),replies=model.events.filter(e=>e.kind==='reply'),results=model.events.filter(e=>e.kind==='result');
 if(contacts.length||state.sent!==null)f.sent=state.sent===true;
 if(state.received!==null)f.replied=state.received;
 else if(replies.some(e=>e.status==='asserted'&&e.completed&&(e.actor==='other'&&['receive','read'].includes(e.direction)||e.readingFromOtherReceipt||e.direction==='receive'&&!e.accepting&&e.recipient?.actor==='other')))f.replied=false;
 if(replies.length||state.received!==null)f.noReply=state.received===false;
 f.replyUnknown=f.sent&&!f.replied&&!f.noReply;
 if(results.length){
  f.known=state.resultKnown===true;f.resultFailed=f.known&&state.outcome==='failed';f.resultPassed=f.known&&state.outcome==='passed';
 }
 if(state.previousOutcome){f.previousOutcome=state.previousOutcome;f.known=false;f.resultFailed=false;f.resultPassed=false;}
 if(f.known)scene.phase='known';
 else if(state.assessmentUpcoming&&!state.replyWaiting||state.previousOutcome!==undefined)scene.phase='active';
 else if(state.waiting)scene.phase='pending';
 else if(results.length&&state.resultKnown===null&&!state.resultWaiting)scene.phase='active';
 else if(state.received===true&&!state.resultWaiting)scene.phase='active';
 else if(!state.waiting&&(replies.length||state.replyWaitingSource==='denied'||state.resultWaitingSource==='denied'))scene.phase='active';
 f.waiting=scene.phase==='pending';
 if(override==='auto'&&model.entities.romantic&&!scene.medical&&!['health','finances'].includes(scene.domain))scene.domain='relationship';
 const requests=model.requests;
 if(arc79ForcedIntent==='auto'&&requests.length){parsed.intent={...parsed.intent,primary:requests[0].kind,secondary:requests[1]?.kind||null,confidence:'grammar'};scene.intent=parsed.intent.primary;}
 scene.arc82=model;return parsed;
};
function arc82Action(scene,pack,task){
 const model=scene.arc82||ARCANA_QUESTION_MODEL.parse(scene.question),state=model.state,goal=task?.goal||model.requests[0]?.goal;
 scene.arc82ActionTask=null;
 const support=(operation,text)=>{scene.arc82ActionTask=operation;return text;};
 if(scene.boundary||scene.abuse||scene.urgent||scene.medical||['health','finances'].includes(scene.domain)||scene.facts.known)return null;
 if(state.sent===true&&state.received===false&&state.replyWaitingSource!=='denied')return '이미 전한 내용을 반복해서 보내기보다, 응답을 기다리는 동안 내 일상을 이어 가고 언제까지 기다릴 수 있을지 정해 보세요.';
 if(state.replyWaiting&&state.received===null)return '답을 기다리는 동안 지금 이어 갈 일과 다음에 확인할 시점을 나누어 보세요. 회신의 내용이나 상대의 뜻은 확인한 범위에서 읽고, 아직 모르는 부분을 추측으로 채우지 않아도 됩니다.';
 if(state.received===false&&state.replyWaiting)return '아직 받지 못한 답을 확인할 경로와 시점을 정해 보세요. 응답이 오기 전에는 그 내용이나 상대의 뜻을 추측으로 채우지 않고, 내 일상을 이어 갈 일을 하나 골라 볼 수 있습니다.';
 if(state.waiting&&(state.resultWaiting||state.assessmentCompleted===true))return '공식 결과를 확인할 경로와 시간을 정하고, '+(state.assessmentCompleted===true||state.submitted===true?'이미 마친 절차와 지금 할 수 있는 일을 나누어 보세요.':'확인된 사실과 아직 모르는 결과를 나누어 보세요.')+' 오늘 이어갈 다른 일이나 쉴 시간도 하나 정해 보세요.';
 if(goal==='cope'||task?.kind==='emotion'||scene.intent==='emotion'){
  if(state.received===true)return support('cope','이미 받은 답의 내용과 그 뒤에도 남아 있는 마음을 나누어 적어 보세요. 답을 다시 확인받는 일보다 지금 필요한 휴식이나 지지를 먼저 살펴볼 수 있습니다.');
  if(task?.kind==='emotion'&&model.requests.length>1)return support('cope','지금 가장 큰 감정을 한 문장으로 적고, 바로 바꿀 수 있는 일과 잠시 내려놓을 걱정을 나누어 보세요. 쉬는 시간이나 도움을 청할 사람도 정해 볼 수 있습니다.');
  return null;
 }
 if(goal==='coordinate'&&!/(?:생활비|지출|돈)/.test(scene.question))return support('coordinate','함께 해야 할 일을 적고, 각 일의 담당자·마감·예상 소요 시간·완료 기준을 맞춰 보세요. 겹치는 일과 빠지는 일을 먼저 확인하면 나눌 몫을 구체적으로 정할 수 있습니다.');
 if(goal==='prioritize')return support('prioritize','할 일의 마감과 예상 소요 시간을 적고, 실제로 가능한 시간과 비교해 보세요. 먼저 할 일과 미룰 일을 정한 뒤 영향을 받는 사람과 일정을 맞춰 보세요.');
 if(goal==='finish'&&state.submitted!==true)return support('finish','이번 단계의 목적과 꼭 충족할 기준을 먼저 적어 보세요. 그 기준을 충족했다면 새로 떠오른 수정은 다음 단계 목록에 남기고, 이번 작업을 마칠 시점을 정해 볼 수 있습니다.');
 if(goal==='communicate'&&(model.requests.length>1||scene.domain==='general'))return support('communicate','전달할 결론과 그 이유 한 가지를 짧게 정리해 보세요. 내 선택을 설명하는 부분과 상대의 의견을 들어야 할 부분을 나누고, 상대가 답할 여지도 남겨 두세요.');
 if(goal==='prepare'&&model.requests.length>1)return support('prepare','시작할 때 필요한 조건·진행 순서·확인할 일정을 적어 보세요. 이미 준비된 것과 한 가지 더 알아볼 것을 나누고, 첫날 해볼 작은 단계부터 정해 보세요.');
 if(goal==='implement')return support('implement','결정을 내린 뒤 그 안에서 이번 주에 마칠 작은 일 하나를 정하고, 언제 할지와 끝났다고 볼 기준을 적어 보세요. 필요한 사람이나 준비물이 있다면 먼저 확인해 둘 수 있습니다.');
 if(goal==='improve'&&scene.domain==='general')return support('improve','사용하는 사람이 기대한 것과 실제로 불편했던 지점을 함께 확인해 보세요. 한 가지를 바꾼 작은 안을 만들어 같은 상황에서 다시 사용해 보고 달라진 점을 적어 보세요.');
 return null;
}
const ARC82_ACTION=arc79Action;
arc79Action=function(scene,pack){return arc82Action(scene,pack,scene.arc82?.requests[0])||ARC82_ACTION(scene,pack);};
const ARC82_REPORT=arc79CreateReport;
arc79CreateReport=function(question,spread,cards,override='auto'){
 const r=ARC82_REPORT(question,spread,cards,override),{scene,intent}=arc79Scene(question,override),model=scene.arc82,pack=arc79Pack(question,spread,cards);
 const manual=arc79ForcedIntent!=='auto',requests=manual?[{kind:intent.primary,goal:intent.primary,text:model.question,start:0,end:model.question.length,...(model.requests[0]?.context?{context:model.requests[0].context}:{})}]:model.requests;
 const answers=[];
 if(model.needsContext){r.headline='질문할 상황을 먼저 알려 주세요';r.direct=model.clarification;r.actions=[model.clarification];}
 else if(requests.length){
  const baseRefs=pack.list.filter(a=>r.direct.includes(a.name)).map(a=>a.index);
  answers.push({request:requests[0],text:r.direct,directText:r.direct,actionText:r.actions[0],actionTask:r.arc72?.scene?.arc82ActionTask||r.arc72?.scene?.arc81ActionTask||r.arc72?.scene?.arc80ActionTask||null,refs:baseRefs.length?baseRefs:[pack.main.index]});
  for(const task of requests.slice(1)){
   const taskScene={...scene,intent:task.kind};let text;
   if(task.kind==='action'||task.kind==='emotion')text=arc82Action(taskScene,pack,task)||ARC82_ACTION(taskScene,pack);
   else if(task.kind==='compare')text='각 선택의 목적·필요한 시간·감당할 부담을 같은 기준으로 적어 보세요. 아직 모르는 조건은 추측으로 채우지 않고 확인할 일로 남겨 두세요.';
   else if(task.kind==='cause')text='실제로 반복된 장면과 그때 내린 해석을 나누어 보세요. 카드의 연결은 가설로 활용하고 실제 원인은 확인 가능한 정보로 살펴보세요.';
   else if(task.kind==='forecast')text='현재 방향에서 이어서 볼 변화와 확인할 시점을 정해 보세요. 카드로 실제 결과나 시점을 확정할 수는 없습니다.';
   else text=ARC81_MOTIFS[arc81Profile(pack.main)[0]][1];
   const evidence=(task.kind==='action'||task.kind==='emotion')?pack.advice:pack.main;
   const body=text+' '+arc80CardSentence(evidence,spread),title={action:'함께 요청한 실천 방법',emotion:'함께 요청한 마음 돌보기',compare:'함께 요청한 선택 비교',cause:'함께 요청한 배경 살피기',forecast:'함께 요청한 앞으로의 관점',open:'함께 요청한 성찰'}[task.kind];
   r.direct+='\n\n'+text;r.sections.push({title,body,refs:[evidence.index],kind:'request'});
   answers.push({request:task,text:body,directText:text,actionText:['action','emotion'].includes(task.kind)?text:null,actionTask:taskScene.arc82ActionTask||taskScene.arc81ActionTask||taskScene.arc80ActionTask||null,refs:[evidence.index]});
   if(['action','emotion'].includes(task.kind)&&!r.actions.includes(text))r.actions.push(text);
  }
  if(requests.length>1)r.headline='요청한 관점을 함께 살펴볼게요';
 }
 r.arc82={version:82,model,manualFocus:manual,answers,needsContext:model.needsContext};
 // The public evidence flags describe only stated facts, rather than treating unknown as no reply.
 if(r.arc72){r.arc72.rules.noFirstContact=!!(scene.facts.sent&&scene.facts.noReply&&!scene.facts.replied);r.arc72.scene.facts={...scene.facts};}
 return r;
};

// The old category-only gate cannot judge event/request context. Its registered
// listener resolves this function at click time; the canonical gate below owns
// readiness for both complete questions and questions that need clarification.
a30IsAmbiguous=()=>false;
$('a30Clarifier').hidden=true;
// Ask for context before cards are selected. Empty questions intentionally remain daily readings.
const arc82ContextPanel=document.createElement('div');arc82ContextPanel.id='arc82ContextPanel';arc82ContextPanel.className='arc82-context';arc82ContextPanel.hidden=true;
arc82ContextPanel.innerHTML='<label for="arc82ContextInput">질문에 필요한 상황</label><p id="arc82ContextHint"></p><input id="arc82ContextInput" type="text" maxlength="350" autocomplete="off" aria-describedby="arc82ContextHint"><button id="arc82ContextContinue" type="button">질문에 반영하고 카드 뽑기</button><p id="arc82ContextError" role="status"></p>';
$('question').after(arc82ContextPanel);
const arc82Start=$('startReading');let arc82ContextBase='';
arc82Start.addEventListener('click',e=>{
 const model=ARCANA_QUESTION_MODEL.parse($('question').value);
 if(!model.needsContext){arc82ContextPanel.hidden=true;return;}
 e.preventDefault();e.stopImmediatePropagation();arc82ContextBase=model.question;arc82ContextPanel.hidden=false;
 $('arc82ContextHint').textContent=model.clarification;$('arc82ContextInput').focus();
},true);
$('arc82ContextContinue').addEventListener('click',()=>{
 const context=$('arc82ContextInput').value.trim();if(!context){$('arc82ContextError').textContent='현재 어떤 일이 있는지 한 문장으로 적어 주세요.';$('arc82ContextInput').focus();return;}
 const original=$('question').value.trim(),combined=original+(/[.!?。！？]$/.test(original)?' ':'. ')+context;
 if(combined.length>500){$('arc82ContextError').textContent='원래 질문과 추가한 상황을 합쳐 500자 이내로 적어 주세요.';return;}
 if(ARCANA_QUESTION_MODEL.parse(combined).needsContext){$('arc82ContextError').textContent='어떤 일인지 알아볼 수 있도록 상황을 조금 더 구체적으로 적어 주세요.';return;}
 $('question').value=combined;$('question').dispatchEvent(new Event('input',{bubbles:true}));arc82ContextPanel.hidden=true;$('arc82ContextInput').value='';$('arc82ContextError').textContent='';arc82Start.click();
});
$('arc82ContextInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('arc82ContextContinue').click();}});
$('question').addEventListener('input',()=>{const model=ARCANA_QUESTION_MODEL.parse($('question').value);if(model.question!==arc82ContextBase){$('arc82ContextInput').value='';$('arc82ContextError').textContent='';arc82ContextBase='';arc82ContextPanel.hidden=true;}else if(!model.needsContext)arc82ContextPanel.hidden=true;});
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(r=>r.id===currentHistoryId);if(record){record.engineVersion=82;setStoredRecords(records);}});
