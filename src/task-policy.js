/* Request-first practical support. This bounded policy is not a language model.
 * The topic never supplies personal facts or replaces an identified ordinary task. */
(function(root){
 'use strict';
 const actions={
  communicate:['설명할 내용을 먼저 정리하기','전하고 싶은 요점 한 가지와 그 근거가 되는 확인된 내용을 짧게 정리해 보세요. 듣거나 읽을 사람이 헷갈릴 부분을 찾아, 더 설명할 내용과 상대에게 확인할 내용을 나누어 볼 수 있습니다.'],
  inquire:['물어볼 질문을 준비하기','궁금한 점을 한 문장씩 적고, 이미 아는 내용과 아직 모르는 점을 나누어 보세요. “이 부분을 조금 더 설명해 주실 수 있나요?”, “아직 확인할 점은 무엇인가요?”처럼 실제로 말할 질문을 만들고, 꼭 물을 것부터 순서를 정해 보세요. 답을 듣는 자리에서 메모하거나 다시 설명을 부탁할 방법도 정해 둘 수 있습니다.'],
  verify:['확인할 조건을 나누어 살피기','확인하려는 조건을 필수 요건, 필요한 시간·비용, 변경하거나 중단할 때의 조건으로 나누어 보세요. 확인한 근거와 아직 모르는 항목을 따로 표시하고, 모르는 부분은 누구에게 어떤 질문으로 확인할지 적어 보세요.'],
  improve:['작게 바꾸고 같은 상황에서 확인하기','바꾸고 싶은 부분 한 가지와 지금 어떤 점이 어려운지를 구체적으로 적어 보세요. 한 번에 한 가지를 바꾼 작은 방법을 시도하고, 전후의 차이를 같은 기준으로 확인해 보세요.'],
  prepare:['앞둔 일을 작은 단계로 준비하기','앞둔 일에서 꼭 필요한 준비와 확인할 일정을 나누어 보세요. 이미 갖춘 것은 남겨 두고, 아직 필요한 것 중 지금 할 수 있는 한 단계와 확인할 시점을 정해 보세요.'],
  coordinate:['맡을 몫과 기준 맞추기','할 일을 작은 단계로 나누고, 각 단계의 완료 기준과 감당할 시간·범위를 정해 보세요. 함께하는 사람이 있다면 담당할 몫과 조율이 필요한 부분을 확인해 보세요.'],
  prioritize:['지금 할 일과 미룰 일 나누기','각 일의 마감·중요도·예상 소요 시간을 실제로 쓸 수 있는 시간과 비교해 보세요. 먼저 할 일 한 가지와 미뤄도 되는 일을 나누고, 일정이 달라지면 영향을 받는 사람에게 확인해 보세요.'],
  finish:['마칠 기준과 다음 수정을 구분하기','이번 단계에서 꼭 충족해야 할 기준과 확인할 시점을 먼저 정해 보세요. 기준을 충족한 뒤 떠오르는 추가 수정은 다음 단계 목록에 남겨, 마무리와 계속 다듬을 일을 구분해 보세요.'],
  implement:['결정한 다음의 작은 실행 정하기','이미 정한 방향에서 가장 먼저 마칠 작은 일 하나를 골라 보세요. 언제 할지와 끝났다고 볼 기준을 정하고, 필요한 준비나 다른 사람의 확인이 있다면 그 부분부터 챙겨 보세요.'],
  cope:['느끼는 마음과 확인한 사실 나누기','지금 느끼는 마음을 한 문장으로 적고, 실제로 확인한 사실과 아직 모르는 부분을 나누어 보세요. 바로 바꿀 수 있는 일 한 가지와 잠시 내려놓을 걱정을 구분하고, 쉴 시간이나 도움을 청할 방법도 정해 볼 수 있습니다.']
 };
 const artifact=/(?:문서|자료|안내문|설명문|문구|서식|장부|보고서|화면|페이지|도표|책자|포스터|규칙|회칙|대본|목록|목차|결산표|상환표|이\s*표)/;
 const mask=text=>String(text||'').replace(/[“"「『][^”"」』]*[”"」』]/g,s=>' '.repeat(s.length));
 function participants(question){
  let state=null,rank=-1;
  for(const text of mask(question).split(/[.!?,]|지만|그러나|반면/)){
   if(/(?:있|없)(?:다면|으면)|가정|경우/.test(text))continue;
   const absent=/(?:혼자|홀로|단독으로).{0,14}(?:일|처리|맡|진행)|(?:팀원|동료|협업자|함께할\s*사람)(?:이|가|은|는)?\s*(?:없|아직\s*없|없는)/.test(text);
   const present=/(?:서로|각자|함께|동료|팀원|공동|같이|분담|협의|합의|담당자|여럿|가족|부모님|엄마|아빠|친구|연인)/.test(text);
   const current=/지금|현재|이제|이번/.test(text),past=/작년|예전|과거|지난|전에는/.test(text),priority=current?2:past?0:1;
   if((absent||present)&&priority>=rank){state=!absent;rank=priority;}
  }
  return state;
 }
 function operation(task,question){
  if(!task||!['action','emotion'].includes(task.kind))return null;
  const original=task.evidenceText??task.text??'',cue=original.search(/어떻게|어떡|무엇|뭘|어떤|무슨|어디|언제/);
  const framed=cue>0&&/(?:려면|려고|고\s*싶|할\s*때|하는\s*때|앞두고|앞둔|하면서|한\s*뒤)/.test(original.slice(0,cue));
  const text=cue>=0?original.slice(cue):original;
  if(task.kind==='emotion')return 'cope';
  const questionTarget=/(?:질문|물어볼|물을\s*(?:것|내용|점|사항)|여쭐|여쭤볼|궁금한\s*(?:점|내용))/;
  const negatedInquiry=/(?:묻지|물어보지|질문하지)\s*않/.test(original);
  const predicates=[['coordinate',/분담|조율|협의|합의/g],['prioritize',/우선순위|마감/g],['finish',/마치|마칠|끝내|끝낼|멈|마무리/g],['improve',/보완|개선|바꾸|바꿀|고치|고칠|손볼|수정|다듬|편집/g],['communicate',/말할|말하|전할|전하|설명|이야기|대화|꺼낼|꺼내/g],['prepare',/준비|앞두|시작/g],['implement',/실행|첫\s*(?:주|날|행동|단계|작업)/g]];
  if(/(?:역할|담당|몫|책임|업무|할\s*일).{0,18}(?:나누|나눌)|(?:각자|서로).{0,60}(?:일|업무|범위).{0,25}(?:나누|나눌)/.test(original))predicates.push(['coordinate',/나누|나눌/g]);
  if(/(?:업무|일정|분량|범위|할\s*일|시간).{0,12}(?:줄이|줄일|조정)|감당할\s*(?:양|범위)/.test(original))predicates.push(['prioritize',/줄이|줄일|조정|감당할/g]);
  if(!negatedInquiry)predicates.push(['inquire',/물어|여쭐|여쭤|묻|질문(?:해|하|할)/g]);
  if(/조건|기준|요건|자격|규정|절차|준비물|사항/.test(original+' '+question))predicates.push(['verify',['finish','implement'].includes(task.goal)?/확인|검토|점검|알아/g:/확인|검토|점검|살펴|살피|알아/g]);
  if(/마음|감정|불안|걱정|긴장/.test(text))predicates.push(['cope',/다루|다룰|돌보|추스|관리|달래|다스리/g]);
  const matches=predicates.flatMap(([operation,rx])=>[...text.matchAll(rx)].map(match=>({operation,index:match.index})));
  const found=matches.sort((a,b)=>b.index-a.index)[0]?.operation;
  if(found)return found==='prepare'&&!negatedInquiry&&questionTarget.test(original+' '+question)?'inquire':found;
  if(!negatedInquiry&&questionTarget.test(original)&&/정리|준비|적|써|잊|기억/.test(text))return 'inquire';
  if(framed&&/^어떻게\s*(?:할(?:까요|까|지)|하면|하나요|해야)/.test(text)){
   const purpose=predicates.flatMap(([operation,rx])=>[...original.slice(0,cue).matchAll(rx)].map(match=>({operation,index:match.index}))).sort((a,b)=>b.index-a.index)[0];
   if(purpose)return purpose.operation==='prepare'&&!negatedInquiry&&questionTarget.test(original+' '+question)?'inquire':purpose.operation;
  }
  if(framed&&!/^어떻게\s*(?:할(?:까요|까|지)|하면|하나요|해야)/.test(text))return null;
  if(task.goal==='prepare'&&questionTarget.test(question)&&!negatedInquiry)return 'inquire';
  if(task.goal==='cope')return 'cope';
  return Object.hasOwn(actions,task.goal)?task.goal:null;
 }
 function plan({question='',evidenceQuestion=question,task,scene={},state={}}={}){
  const op=operation(task,evidenceQuestion);if(!op||scene.urgent||scene.boundary||scene.abuse)return null;
  const text=task.evidenceText??task.text??'',preparingQuestion=op==='inquire'&&/준비|정리|적|써|기억/.test(text)&&!/다시\s*(?:묻|물어|질문)|(?:보내|전송|연락)(?:도|면|할|하|해)/.test(text);
  if(state.sent===true&&state.received===false&&['communicate','inquire'].includes(op)&&!preparingQuestion)return null;
  if(state.submitted===true&&op==='finish')return null;
  const requiredResources=op==='verify'&&/자격|필요한\s*(?:자료|서류)|제출할\s*(?:자료|서류)|준비물/.test(text);
  const hasArtifact=!requiredResources&&(artifact.test(text)||/(?:이\s*(?:말|내용)|조건|요점)/.test(text)&&artifact.test(evidenceQuestion));
  const clinicalChange=/(?:약|치료|수술|복용|용량|증상|통증).{0,18}(?:끊|중단|바꾸|늘리|줄이|끝내|시작|개선|선택)|(?:끊|중단|바꾸|늘리|줄이).{0,12}(?:약|치료|복용|용량)/.test(text);
  if(scene.medical||scene.domain==='health'){
   if(op!=='inquire'&&clinicalChange)return null;
   if(!['communicate','inquire','verify','cope','coordinate'].includes(op)&&!hasArtifact)return null;
  }
  if(scene.domain==='finances'&&!hasArtifact&&!['communicate','inquire','verify','cope','coordinate'].includes(op)&&/(?:투자|매수|매도|대출|주식|코인|보험|예금|수익|상환)/.test(evidenceQuestion))return null;
  let [headline,body]=actions[op];
  const target=hasArtifact?'artifact':/(?:역할|담당할|담당\s*(?:범위|업무|일)|몫|책임)/.test(text)?'responsibility':'unspecified',people=participants(evidenceQuestion);
  if(target==='artifact'&&op==='communicate')body='자료에서 전달할 핵심과 그 근거를 짧게 정리해 보세요. 읽는 사람이 필요한 정보를 찾을 수 있는 순서로 설명하고, 확인된 내용과 아직 확인 중인 내용을 구별해 표시해 보세요.';
  if(target==='artifact'&&op==='improve')body='이 자료의 목적과 읽는 사람이 알아야 할 내용을 먼저 적어 보세요. 사실을 설명하는 문장은 내용 자체를 원자료와 대조하고, 확인되지 않은 주장과 확인된 내용을 구별해 보세요. 어려운 표현이나 빠진 정보를 한 부분씩 고친 뒤, 자료의 목적과 확인된 사실이 유지되는지 다시 읽어 보세요.';
  if(target==='artifact'&&op==='verify')body='이 자료에 쓰인 조건과 수치의 출처·기준일을 확인하고, 이미 대조한 항목과 아직 검토 중인 항목을 표시해 보세요. 원자료와 다른 부분이나 빠진 조건은 배포 전에 확인할 목록으로 남겨 두세요.';
  if(op==='communicate'&&target==='responsibility')body='달라지는 역할과 그 이유, 그대로 유지되는 부분을 나누어 정리해 보세요. 각자가 맡을 범위와 시작 시점을 설명하고, 이해가 다른 부분이 있는지 확인할 질문을 남겨 보세요.';
  if(op==='coordinate'&&people===false){headline='혼자 맡은 일을 감당할 단계로 나누기';body='지금 혼자 맡은 일을 작은 단계로 나누고, 각 단계의 완료 기준과 쓸 수 있는 시간을 적어 보세요. 이번에 할 범위와 미룰 범위를 구분해 일정에 넣어 보세요.';}
  if(op==='verify'&&state.submitted===true){headline='이미 접수한 뒤의 진행 조건 확인하기';body='이미 접수한 절차는 반복하지 않고, 이후 일정과 안내를 받을 경로, 추가 자료나 변경·철회가 필요한 경우의 조건을 공식 안내에서 확인해 보세요. 확인한 항목과 아직 모르는 항목을 나누어 적어 보세요.';}
  if(preparingQuestion&&state.received===false)body='아직 회신을 받지 못했다는 점을 전제로, 답이 오면 확인할 질문을 따로 준비해 보세요. '+body+' 준비한 질문을 바로 다시 보내라는 뜻은 아닙니다.';
  const quoted=[...String(question).matchAll(/[“"「『]([^”"」』]*)[”"」』]/g)].map(match=>match[1]).join(' '),contentChecks=[];
  if(target==='artifact'&&/(?:처방|복용|치료|용량)/.test(quoted))contentChecks.push('복약·치료에 관한 문구는 표현만 다듬기 전에 원자료와 의료진·약사의 검토로 내용의 정확성을 확인해 보세요. 확인 전에는 독자가 임의로 약이나 치료를 변경해도 된다고 읽을 표현을 그대로 사용하지 마세요.');
  if(target==='artifact'&&/(?:원금|수익|수익률|손실)/.test(quoted)&&/(?:항상|언제나|무조건|확실|100\s*%|절대|보장)/.test(quoted))contentChecks.push('보장 표현은 실제 근거와 적용 조건·예외를 원자료에서 확인해 보세요. 확인하지 않은 보장을 사실로 전달하지 않고, 확인된 범위와 아직 확인할 부분을 구별해 설명해 보세요.');
  if(contentChecks.length)body=contentChecks.join(' ')+' '+body;
  const prefix=state.received===true&&['communicate','cope'].includes(op)?'이미 받은 답에서 확인한 내용과 더 알아볼 부분을 구분해 보세요. ':'';
  const clinicalContext=/(?:진단|치료|검사\s*결과|증상|처방|복용|통증)/.test(evidenceQuestion)&&!hasArtifact;
  const boundaryText=clinicalContext&&(scene.medical||scene.domain==='health')?'진단·치료 판단은 의료진의 설명과 실제 검사 결과를 기준으로 하고, 카드는 마음과 준비를 살펴보는 데 활용해 보세요. ':'';
  return {operation:op,headline,text:prefix+body,source:task.text,scope:'ordinary-practical-support',target,participants:people,preparingQuestion,waitingReply:state.received===false,contentCheck:contentChecks.length>0,submitted:state.submitted===true,boundaryText};
 }
 function supports(plan,action,question,taskText=''){
  if(!plan||!action)return false;
  // Specialized prose must fit the requested object and its prerequisites, not
  // just share an activity label. Unknown participants are not asserted present.
  if(plan.contentCheck||plan.preparingQuestion&&plan.waitingReply||plan.submitted&&plan.operation==='verify')return false;
  if(plan.target==='artifact'&&['communicate','improve','verify'].includes(plan.operation))return artifact.test(action)&&!/(?:가족이\s*걱정|월\s*상환액|복용\s*시각)/.test(action);
  if(plan.target==='responsibility'&&plan.operation==='communicate')return /역할|담당|범위|몫/.test(action);
  if(plan.operation==='improve'&&plan.target==='unspecified'&&/사용하는\s*사람|사용자가/.test(action)&&!/사용자|이용자|고객|독자|관객/.test(mask(question)))return false;
  if(/금리|상환|대출\s*잔액/.test(action)&&!/(?:은행|금리|상환|금융|원리금|이자)/.test(mask(question)))return false;
  if(plan.operation==='verify'&&!/조건|요건|규정|절차|금리|상환|항목|비용/.test(action))return false;
  if(/함께\s*해야|각자|서로/.test(action)&&plan.participants!==true)return false;
  return true;
 }
 const api=Object.freeze({operation,plan,participants,supports});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_TASK_POLICY=api;
})(typeof globalThis==='object'?globalThis:this);
