/* Request-first practical support. This bounded policy is not a language model.
 * The topic never supplies personal facts or replaces an identified ordinary task. */
(function(root){
 'use strict';
 const actions={
  communicate:['설명할 내용을 먼저 정리하기','전하고 싶은 요점 한 가지와 그 근거가 되는 확인된 내용을 짧게 정리해 보세요. 듣거나 읽을 사람이 헷갈릴 부분을 찾아, 더 설명할 내용과 상대에게 확인할 내용을 나누어 볼 수 있습니다.'],
  inquire:['물어볼 질문을 준비하기','궁금한 점을 한 문장씩 적고, 이미 아는 내용과 아직 모르는 점을 나누어 보세요. “제가 이해한 내용이 맞나요?”, “더 확인할 점은 무엇인가요?”처럼 실제로 말할 질문을 만들고, 꼭 물을 것부터 순서를 정해 보세요. 답을 듣는 자리에서 메모하거나 다시 설명을 부탁할 방법도 정해 둘 수 있습니다.'],
  verify:['확인할 조건을 나누어 살피기','확인하려는 조건을 필수 요건, 필요한 시간·비용, 변경하거나 중단할 때의 조건으로 나누어 보세요. 확인한 근거와 아직 모르는 항목을 따로 표시하고, 모르는 부분은 누구에게 어떤 질문으로 확인할지 적어 보세요.'],
  improve:['작게 바꾸고 같은 상황에서 확인하기','바꾸고 싶은 부분 한 가지와 지금 어떤 점이 어려운지를 구체적으로 적어 보세요. 한 번에 한 가지를 바꾼 작은 방법을 시도하고, 전후의 차이를 같은 기준으로 확인해 보세요.'],
  prepare:['앞둔 일을 작은 단계로 준비하기','앞둔 일에서 꼭 필요한 준비와 확인할 일정을 나누어 보세요. 이미 갖춘 것은 남겨 두고, 아직 필요한 것 중 지금 할 수 있는 한 단계와 확인할 시점을 정해 보세요.'],
  coordinate:['맡을 몫과 기준 맞추기','할 일을 작은 단계로 나누고, 각 단계의 완료 기준과 감당할 시간·범위를 정해 보세요. 함께하는 사람이 있다면 담당할 몫과 조율이 필요한 부분을 확인해 보세요.'],
  prioritize:['지금 할 일과 미룰 일 나누기','각 일의 마감·중요도·예상 소요 시간을 실제로 쓸 수 있는 시간과 비교해 보세요. 먼저 할 일 한 가지와 미뤄도 되는 일을 나누고, 일정이 달라지면 영향을 받는 사람에게 확인해 보세요.'],
  finish:['마칠 기준과 다음 수정을 구분하기','이번 단계에서 꼭 충족해야 할 기준과 확인할 시점을 먼저 정해 보세요. 기준을 충족한 뒤 떠오르는 추가 수정은 다음 단계 목록에 남겨, 마무리와 계속 다듬을 일을 구분해 보세요.'],
  implement:['결정한 다음의 작은 실행 정하기','이미 정한 방향에서 가장 먼저 마칠 작은 일 하나를 골라 보세요. 언제 할지와 끝났다고 볼 기준을 정하고, 필요한 준비나 다른 사람의 확인이 있다면 그 부분부터 챙겨 보세요.'],
  cope:['느끼는 마음과 확인한 사실 나누기','지금 느끼는 마음을 한 문장으로 적고, 실제로 확인한 사실과 아직 모르는 부분을 나누어 보세요. 바로 바꿀 수 있는 일 한 가지와 잠시 내려놓을 걱정을 구분하고, 쉴 시간이나 도움을 청할 방법도 정해 볼 수 있습니다.']
 };
 const artifact=/(?:문서|자료|안내문|설명문|문구|서식|장부|보고서|화면|페이지|지도|도표|책자|포스터|규칙|대본|목록)/;
 function operation(task,question){
  if(!task||!['action','emotion'].includes(task.kind))return null;
  const original=task.evidenceText??task.text??'',cue=original.search(/어떻게|어떡|무엇|뭘|어떤|무슨|어디|언제/);
  const framed=cue>0&&/(?:려면|려고|고\s*싶|할\s*때|하는\s*때|앞두고|앞둔|하면서|한\s*뒤)/.test(original.slice(0,cue));
  const text=cue>=0?original.slice(cue):original;
  if(task.kind==='emotion')return 'cope';
  const questionTarget=/(?:질문|물어볼|물을\s*(?:것|내용|점)|여쭐|여쭤볼|궁금한\s*(?:점|내용))/;
  const negatedInquiry=/(?:묻지|물어보지|질문하지)\s*않/.test(original);
  const predicates=[['coordinate',/분담|조율|협의|합의/g],['prioritize',/우선순위|마감/g],['finish',/마치|마칠|끝내|끝낼|멈/g],['improve',/보완|개선|바꾸|바꿀|고칠|손볼|수정/g],['communicate',/말할|말하|전할|전하|설명|이야기|대화|꺼낼|꺼내/g],['prepare',/준비|앞두|시작/g],['implement',/실행|첫\s*(?:주|날|행동|단계)/g]];
  if(/(?:역할|담당|몫|책임|업무|할\s*일).{0,18}(?:나누|나눌)/.test(original))predicates.push(['coordinate',/나누|나눌/g]);
  if(/(?:업무|일정|분량|범위|할\s*일|시간).{0,12}(?:줄이|줄일|조정)|감당할\s*(?:양|범위)/.test(original))predicates.push(['prioritize',/줄이|줄일|조정|감당할/g]);
  if(!negatedInquiry)predicates.push(['inquire',/물어|여쭐|여쭤|묻|질문(?:해|하|할)/g]);
  if(/조건|기준|요건|규정|절차|준비물|사항/.test(original+' '+question))predicates.push(['verify',/확인|검토|점검|살펴|살피|알아/g]);
  if(/마음|감정|불안|걱정|긴장/.test(text))predicates.push(['cope',/다루|다룰|돌보|추스|관리|달래|다스리/g]);
  const matches=predicates.flatMap(([operation,rx])=>[...text.matchAll(rx)].map(match=>({operation,index:match.index})));
  const found=matches.sort((a,b)=>b.index-a.index)[0]?.operation;
  if(found)return found==='prepare'&&!negatedInquiry&&questionTarget.test(original+' '+question)?'inquire':found;
  if(!negatedInquiry&&questionTarget.test(original)&&/정리|준비|적|써|잊|기억/.test(text))return 'inquire';
  if(framed&&!/^어떻게\s*(?:할(?:까요|까|지)|하면|하나요|해야)/.test(text))return null;
  if(task.goal==='prepare'&&questionTarget.test(question)&&!negatedInquiry)return 'inquire';
  if(task.goal==='cope')return 'cope';
  return Object.hasOwn(actions,task.goal)?task.goal:null;
 }
 function plan({question='',evidenceQuestion=question,task,scene={},state={}}={}){
  const op=operation(task,evidenceQuestion);if(!op||scene.urgent||scene.boundary||scene.abuse)return null;
  if(state.sent===true&&state.received===false&&['communicate','inquire'].includes(op))return null;
  if(state.submitted===true&&op==='finish')return null;
  const text=task.evidenceText??task.text??'',hasArtifact=artifact.test(text);
  const clinicalChange=/(?:약|치료|수술|복용|용량|증상|통증).{0,18}(?:끊|중단|바꾸|늘리|줄이|끝내|시작|개선|선택)|(?:끊|중단|바꾸|늘리|줄이).{0,12}(?:약|치료|복용|용량)/.test(text);
  if(scene.medical||scene.domain==='health'){
   if(op!=='inquire'&&clinicalChange)return null;
   if(!['communicate','inquire','verify','cope','coordinate'].includes(op)&&!hasArtifact)return null;
  }
  if(scene.domain==='finances'&&!hasArtifact&&!['communicate','inquire','verify','cope','coordinate'].includes(op)&&/(?:투자|매수|매도|대출|주식|코인|보험|예금|수익|상환)/.test(evidenceQuestion))return null;
  const [headline,body]=actions[op];
  const prefix=state.received===true&&['communicate','cope'].includes(op)?'이미 받은 답에서 확인한 내용과 더 알아볼 부분을 구분해 보세요. ':'';
  return {operation:op,headline,text:prefix+body,source:task.text,scope:'ordinary-practical-support'};
 }
 const api=Object.freeze({operation,plan});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_TASK_POLICY=api;
})(typeof globalThis==='object'?globalThis:this);
