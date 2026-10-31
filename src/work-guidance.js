/* Practical support chosen by requested work and object, never a case ID. */
(function(root){'use strict';
 function compose(work,{state={},task={},medical=false}={}){
  if(!work)return null;
  const op=work.operation,object=work.target||{},kind=object.kind;
  if(op==='inspect'&&kind==='unspecified'&&task.context?.type==='received-content')return null;
  if(op==='inspect'){
   if(kind==='evidence'&&object.subtype==='interpretation')return {headline:'관찰한 장면과 원인 해석 나누기',text:'직접 보고 들었거나 기록한 장면과, 그 장면이 생긴 이유에 대한 설명을 나누어 적어 보세요. 각 설명을 뒷받침하는 근거가 무엇인지 확인하고, 다른 설명도 가능한 부분은 가설로 남겨 두세요. 다음에 무엇을 관찰하거나 대조하면 두 설명을 구별할 수 있을지 정해 볼 수 있습니다.'};
   if(kind==='observation')return {headline:'기록에서 관찰과 빈틈을 살펴보기',text:'언제 무엇을 관찰했고 어떤 조건에서 기록했는지 항목을 맞춰 보세요. 실제로 본 내용과 그 원인에 대한 추정을 나누고, 기록이 빠진 때나 비교하기 어려운 조건은 별도로 표시해 보세요. 다음 관찰에서 확인할 한 가지를 정하면 빈틈을 좁힐 수 있습니다.'};
   if(kind==='evidence')return {headline:'확인한 자료와 해석을 나누기',text:'가지고 있는 자료와 아직 없는 자료를 먼저 나누고, 각 자료가 실제로 뒷받침하는 내용과 그 이상으로 추측한 내용을 구분해 보세요. 출처·작성 시점·직접 확인한 범위를 적고, 빠진 자료나 서로 맞지 않는 내용은 추가로 확인할 항목으로 남겨 보세요.'};
   if(kind==='document')return {headline:'전체 목적과 각 부분의 연결 점검하기',text:'이 자료가 전달하려는 핵심과 각 부분이 맡는 역할을 먼저 짚어 보세요. 전체 흐름에서 빠진 연결이나 중복을 찾은 뒤 문장과 세부 표현을 살피면, 구조 문제와 표현 문제를 구별하기 쉽습니다. 고칠 부분마다 왜 필요한지 한 줄씩 적고 가장 큰 혼란부터 확인해 보세요.'};
   return {headline:'점검할 항목과 근거를 나누기',text:'점검하려는 대상이 충족해야 할 기준을 먼저 적고, 각 기준에서 확인한 근거와 아직 모르는 부분을 구분해 보세요. 예상과 실제가 다른 한 지점을 골라 어떤 정보가 더 필요한지 살피고, 확인 뒤에 바꿀 부분을 정해 보세요.'};
  }
  if(op==='reflect'){
   if(kind==='evidence')return {headline:'기대와 관찰을 구분해 돌아보기',text:'실제로 보고 들은 일, 그 일에 붙인 해석, 바라는 결과를 따로 적어 보세요. 같은 장면을 다르게 읽을 가능성도 남겨 두고, 아직 확인하지 못한 마음이나 의도는 단정하지 마세요. 기대를 지키면서도 실제 정보에 맞춰 조정할 부분이 무엇인지 돌아볼 수 있습니다.'};
   if(kind==='message')return {headline:'표현에 담은 뜻과 실제 문장 돌아보기',text:object.owner==='self'?'전하려던 요점과 실제로 쓴 표현을 나란히 놓고, 같은 뜻이 전달되는지 돌아보세요. 분명히 말한 부분과 상대가 추측해야 하는 부분을 나누고, 상대의 반응은 실제로 확인한 범위에서만 참고해 보세요. 다시 표현한다면 남길 말과 달리 쓸 말 한 가지씩을 골라 볼 수 있습니다.':'실제로 담긴 말과 그 말에서 짐작한 뜻을 구분해 보세요. 표현의 의도나 상대의 반응이 확인되지 않았다면 단정하지 않고, 어떤 부분이 명확하고 어떤 부분이 더 확인되어야 하는지 돌아볼 수 있습니다.'};
   return {headline:'원했던 것과 실제 경험을 나누어 보기',text:'처음 중요하게 여긴 것, 실제로 경험한 것, 지금 다르게 느끼는 점을 나누어 적어 보세요. 잘됐거나 어려웠던 한 장면을 구체적으로 떠올리고, 앞으로도 지킬 기준과 조정할 기대를 하나씩 골라 볼 수 있습니다.'};
  }
  if(op==='compare')return {headline:'같은 기준으로 선택의 부담 비교하기',text:'각 방식을 같은 항목으로 나란히 적어 보세요. 필요한 시간·비용·내가 맡을 일·다른 사람과 조율할 일·변경할 여지를 비교하고, 꼭 지킬 기준과 양보할 수 있는 기준을 구분해 보세요. 확인한 조건과 기대에 그치는 부분을 나누면, 장점의 수보다 자신에게 중요한 차이를 살필 수 있습니다.'};
  if(op==='coordinate'&&kind==='interaction')return {headline:'서로 지킬 약속과 조정할 여지 맞추기',text:'서로 중요하게 여기는 약속을 구체적인 행동으로 적고, 합의되는 부분과 부담스러운 부분을 나누어 보세요. 각자가 지킬 수 있는 범위와 상황이 달라졌을 때 알릴 방법을 함께 정해 보세요. 이해가 다른 부분은 한쪽의 뜻을 추측하기보다 직접 확인할 질문으로 남겨 둘 수 있습니다.'};
  if(op==='verify'&&kind==='requirements'&&!state.submitted){
   const source=task.context?.type==='received-content',unread=source&&task.context.read===false;
   const prefix=unread?'아직 읽지 않은 안내를 먼저 살펴보세요. ':source?'받은 안내에서 확인한 내용과 더 알아볼 부분을 나누어 보세요. ':'공식 안내에서 이번에 적용되는 요건을 살펴보세요. ';
   const body=object.carrier?.kind==='document'&&object.subtype==='conditions'?'이 자료의 조건과 수치가 어느 출처와 기준일에 근거하는지 살펴보세요. 적용되는 범위와 예외를 나누고, 이미 대조한 항목과 아직 확인 중인 부분을 구별해 보세요. 근거가 빠지거나 서로 맞지 않는 항목은 별도 확인 목록으로 남겨 두면 좋습니다.':object.subtype==='documents'?'목록의 각 항목에 대해 자료의 이름·필요한 형식·확인 상태를 표시하고, 없는 자료와 목록 자체에서 설명이 빠진 부분을 나누어 보세요. 이름이 비슷해도 같은 자료인지 확인하고, 불명확한 항목은 확인할 출처와 질문으로 남겨 두면 좋습니다.':object.subtype==='conditions'?'확인하려는 조건을 필수 요건, 필요한 시간·비용, 변경하거나 중단할 때의 조건으로 나누어 보세요. 확인한 근거와 아직 모르는 항목을 따로 표시하고, 모르는 부분은 누구에게 어떤 질문으로 확인할지 적어 보세요.':'대상 자격과 필요한 자료·제출 방식·일정 중 질문과 관련 있는 항목을 골라, 나에게 적용되는 내용과 아직 모르는 점을 구분해 보세요. 불명확한 요건은 확인할 출처와 질문을 따로 적어 두면 좋습니다.';
   return {headline:'요건과 빠진 안내를 구분해 확인하기',text:prefix+body};
  }
  if(op==='communicate'&&kind==='message')return {headline:'요점과 근거를 구분해 전하기',text:'전하려는 요점과 그 근거를 짧게 정리해 보세요. 확인된 사실을 전하는 부분과 생각이나 선택을 설명하는 부분을 나누고, 상대의 의견을 들어야 할 점은 질문으로 남겨 두세요. 상대의 마음이나 의도가 확인되지 않았다면 미리 단정하지 않고 답할 여지를 두어도 좋습니다.'};
  // NIH/NIA, Talking With Your Doctor, p. 11: brief, honest symptom description.
  // https://order.nia.nih.gov/sites/default/files/2021-06/talking-with-your-doctor.pdf
  if(op==='improve'&&kind==='message')return {headline:'뜻을 유지하며 표현 다듬기',text:medical?'증상과 시작 시점·경과처럼 의료진의 판단에 필요한 내용은 남겨 두고, 같은 말을 반복한 부분이나 요점과 관계없는 설명부터 줄여 보세요. 실제 경험과 추정은 구분하고, 중요한 정보까지 빠지지 않았는지 의료진에게 확인해 보세요.':'먼저 전달하려는 요점과 받는 사람이 알아야 할 내용을 적어 보세요. 요점과 관계없는 문장이나 반복을 덜어 내고, 어려운 표현은 뜻을 유지하면서 풀어 써 보세요. 고친 뒤에는 내용이 달라지거나 필요한 근거가 빠지지 않았는지 다시 읽어 보세요.'};
  return null;
 }
 function supports(work,text){
  if(!work)return true;
  if(work.operation==='coordinate'&&work.target.kind==='interaction'&&/담당자|마감|업무|예상\s*소요|완료\s*기준/.test(text))return false;
  // New object-specific prose must not be replaced by an older topic fallback.
  if(['inspect','reflect','compare'].includes(work.operation)||work.operation==='verify'&&work.target.kind==='requirements'||['improve','communicate'].includes(work.operation)&&work.target.kind==='message')return false;
  return true;
 }
 const api=Object.freeze({compose,supports});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_WORK_GUIDANCE=api;
})(typeof globalThis==='object'?globalThis:this);
