/* v80: edit the answer for the question actually asked, without inventing events. */
function arc80Intent(q,previous){
 const clauses=q.replace(/[“"「『][^”"」』]*[”"」』]/g,' ').split(/[.!?。！？\n]+/).map(s=>s.trim()).filter(Boolean);
 const requests=clauses.filter(s=>/(?:까요|하나요|해야|궁금|고민|보고\s*싶|알고\s*싶|비교해|알려|조언|살펴보고)/.test(s));
 const ask=requests.at(-1)||clauses.at(-1)||q;
 const cause=/(?:왜|어째서|까닭|원인|배경|이유(?:는|가|를)?\s*(?:뭐|뭘|무엇|궁금|알고)|이유(?:를|가|는).{0,18}(?:알|궁금|뭘|무엇))/.test(ask);
 const alternatives=[...ask.matchAll(/([가-힣]+)지(?=\s|,|$)/g)].filter(m=>(m[1].charCodeAt(m[1].length-1)-0xac00)%28===8);
 const choices=alternatives.length>=2||/(?:(?:^|\s)A.{0,35}B|어느\s*(?:쪽|곳).{0,25}(?:맞|나을|좋|택|선택)|\s중(?:에서)?\s*(?:어디|무엇|어느|뭐).{0,20}(?:맞|나을|좋)|쪽과.{0,40}쪽의\s*차이)/i.test(ask)||/(?:두\s*(?:가지|개|선택|방법)|A와\s*B)/.test(q)&&/비교/.test(ask);
 const reflective=/(?:돌아보고\s*싶|살펴보고\s*싶|성찰|배운\s*것|배울\s*수|어떤\s*관점으로\s*볼)/.test(ask);
 const action=/(?:어떻게|어떡|무엇|뭘|뭐부터|어디부터|어떤|무슨\s*말|어디까지).{0,65}(?:할까|해야|좋을까|하나요|쓸까|쓰면|정할까|고를까|볼까|찾을까|손볼까|잡을까|설명|말할까|필요할까|줄일까|편집할까|정리할까|꺼내야|바꿀까)|(?:해야|해도|어도|아도|둬도)\s*(?:될까|할까|괜찮)|(?:더\s*보내야|조언|대처법|방법을\s*알려)/.test(ask);
 const emotion=/(?:불안|두려|두렵|걱정|무섭|허탈|위축|초라|한심|당황|지쳤|지쳐|지친|불편|서운|속상|자책|눈물|의심돼|부족한\s*사람|자신.{0,8}(?:없|떨어)|힘이\s*없|하기\s*싫|쉬지\s*못|그\s*장면만\s*떠올|긴장.{0,8}풀리지|아무\s*말도\s*못|외로|공허|답답|슬프)/.test(ask);
 const forecast=/(?:수\s*있을까|가능성|전망|언제|어떨까|끝난\s*걸까|이어질까|좋아질까|편해질까|나아질까|덜해질까|오래갈까|회복될까|느낄까|생길까|넓혀\s*줄까|답이\s*올까|기회가\s*올까)/.test(ask);
 let primary=previous.primary;
 if(cause)primary='cause';
 else if(reflective)primary='open';
 else if(choices||/(?:비교해\s*(?:주|보고)|비교하고\s*싶)/.test(ask))primary='compare';
 else if(action||previous.primary==='action'&&/(?:어떻게|어디부터)/.test(ask)&&!/어떻게\s*(?:될|흘러갈|바뀔)/.test(ask))primary='action';
 else if(forecast)primary='forecast';
 else if(emotion)primary='emotion';
 return {...previous,primary,secondary:null,question:q};
}
const ARC80_SCENE=arc79Scene;
arc79Scene=function(question,override='auto'){
 const q=String(question||'').normalize('NFKC').trim(),parsed=ARC80_SCENE(q,override),s=parsed.scene,f=s.facts;
 const medical=/(?:健康|건강|진단|치료|검사|증상|처방|복용|약을\s*(?:먹|끊)|두통|배가\s*아|병원|통증|호흡곤란)/.test(q)&&!/(?:병원|의사|간호사).{0,12}(?:입사|채용|취업|면접)/.test(q);
 if(override==='auto'){
  if(medical)s.domain='health';
  else if(/(?:연인|애인).{0,30}(?:돈|지출|생활비).{0,30}(?:말|대화|소통)/.test(q))s.domain='relationship';
  else if(/(?:생활비|소득|카드값|저축|대출|전세|보증금|월세|주식|코인|연금|매수|매도|투자|돈을\s*(?:쓰|쓸|써|빌|잃))/.test(q))s.domain='finances';
  else if(/(?:소설|원고|집필|작곡|멜로디|그림|작품|영상|전시|앱|웹사이트|웹페이지|코드|개발)/.test(q))s.domain='project';
  else if(/(?:친구|다른\s*사람).{0,20}비교.{0,20}(?:위축|초라|자책)/.test(q))s.domain='stress';
  else if(/(?:부모님|엄마|아빠|자녀|동생|형제|가족|친구)/.test(q))s.domain='family';
  else if(/(?:연인|애인|데이트|이별|연애|헤어진|소개팅|고백|재회|짝사랑)/.test(q))s.domain='relationship';
  else if(/(?:직장|회사|업무|동료|팀장|상사|팀의|새\s*팀|팀에|부서|취업|이직|면접|채용|연봉|공기업|스타트업|프리랜서|고객|사업|단가)/.test(q))s.domain='career';
  else if(/(?:시험|공부|학습|과제|성적|기출|수업|자격증|스터디|모의고사)/.test(q))s.domain='preparation';
  else if(/(?:선택|결정|두\s*제안|두\s*조건|신청할지|이사할지|옮기는\s*것)/.test(q))s.domain='decision';
  else if(/(?:발표|기다림|결과와\s*별개|답변을\s*기다)/.test(q))s.domain='waiting';
  else if(/(?:불안|자책|무기력|감정|기분|상담|외로|자존감|눈물|서운|허탈|위축|초라|한심|자신이\s*없|마음이\s*(?:불편|복잡)|제\s*마음|나를\s*대하는|도움을\s*청)/.test(q))s.domain='stress';
  else if(/(?:여행|운동|취미|습관|하루|주말|집\s*정리|모임|칭찬|혼자\s*시간)/.test(q))s.domain='general';
 }
 s.medical=s.medical||medical;
 // Identify who acted. Another person's apology or message is not an outgoing message.
 const sentMatches=[...q.matchAll(/(?:연락|문자|메시지|고백|사과)(?:을|를)?\s*(?:이미\s*)?(?:했|보냈|전했)/g)];
 f.sent=sentMatches.some(m=>{const prefix=q.slice(Math.max(0,m.index-22),m.index);const other=/(?:친구|동료|연인|상대|엄마|아빠|부모님|고객)(?:가|이|에게서).{0,12}$/.test(prefix);return !other;})&&!/(?:연락|문자|메시지|고백|사과).{0,10}(?:하지\s*않|안\s*했|못\s*했|안\s*보냈|못\s*보냈|보내지\s*않)/.test(q);
 if(/연락|문자|메시지|고백|사과/.test(q)&&/(?:저는|제가|내가|이미).{0,12}(?:한\s*번\s*)?보냈/.test(q)&&!/(?:친구|동료|연인|상대)(?:가|이).{0,15}보냈/.test(q))f.sent=true;
 f.replied=/(?:답장|회신|답변|대답)(?:을|이|를|도|은|는)?\s*(?:이미\s*|방금\s*|긴\s*)?(?:왔|받았|읽었|도착했)|(?:연인|친구|상대).{0,10}먼저\s*(?:안부를\s*물|연락했)|(?:친구|동료|연인|상대)(?:가|이)\s*사과했/.test(q)&&!/(?:답장|회신|답변).{0,8}(?:안\s*왔|못\s*받|받지\s*않)/.test(q);
 if(/서로.{0,14}연락했/.test(q)){f.sent=true;f.replied=true;}
 f.noReply=!f.replied&&/(?:답장|회신|답변|대답|답이|연락이).{0,14}(?:없|안\s*와|안\s*왔|오지\s*않|못\s*받|기다)/.test(q);
 if(f.replied)f.noReply=false;
 const awaiting=/(?:시험을\s*(?:치렀|쳤)|면접은?\s*끝|시험은?\s*끝|발표\s*전|발표만\s*남|결과만\s*남|공식\s*발표|(?:답|회신|답변|결과)(?:을|를|이|가)?\s*기다)/.test(q)||f.noReply||f.waiting;
 s.phase=f.known?'known':awaiting?'pending':'active';f.waiting=s.phase==='pending';
 f.replyUnknown=f.sent&&!f.replied&&!f.noReply;
 parsed.intent=arc79ForcedIntent==='auto'?arc80Intent(q,parsed.intent):parsed.intent;s.intent=parsed.intent.primary;
 return parsed;
};

const ARC80_ACTION=arc79Action;
arc79Action=function(scene,pack){
 const q=scene.question,f=scene.facts,previous=ARC80_ACTION(scene,pack);
 scene.arc80ActionTask=null;
 if(scene.boundary||scene.abuse||scene.urgent)return previous;
 if(scene.domain==='health'){
  if(/약을\s*먹|처방|복용/.test(q))return '복용 시각과 불편했던 점을 적어 두고, 약의 변경·중단은 처방한 의료진이나 약사에게 문의하세요.';
  if(/의료진.{0,12}증상.{0,10}설명/.test(q)){scene.arc80ActionTask='communicate';return '증상이 시작된 때와 이후의 변화, 복용 중인 약과 궁금한 점을 적어 의료진에게 전달해 보세요.';}
  if(/(?:검사\s*결과|진단).{0,30}(?:질문|준비|설명|이해|물어)/.test(q)){scene.arc80ActionTask='inquire';return '의료진에게 물어볼 내용을 결과의 의미, 다음 일정, 주의할 증상으로 나누어 적어 보세요.';}
  if(/검사\s*결과/.test(q)&&scene.phase==='pending')return '안내받은 결과 확인 시점과 문의 방법을 적어 두세요. 걱정이 커질 때 함께 이야기할 사람과 일상을 지킬 작은 일도 정해 볼 수 있습니다.';
  return previous;
 }
 if(f.known){
  if(scene.intent==='emotion'){scene.arc80ActionTask='cope';return '이미 확인한 결과와 자신에 대한 평가를 분리하고, 마음을 추스를 시간을 먼저 마련해 보세요.';}
  return previous;
 }
 if(f.sent&&f.noReply&&!f.replied)return previous;
 if(f.replyUnknown&&['family','relationship'].includes(scene.domain))return '이미 전한 내용과 다음에 묻고 싶은 내용을 나누어 적고, 같은 말을 더 보낼 필요가 있는지 살펴보세요.';
 if(scene.phase==='pending'&&['career','preparation','waiting'].includes(scene.domain))return '공식 확인 일정과 경로를 정해 두고, 오늘 할 수 있는 다른 일 하나를 골라 보세요. 이미 끝난 평가를 계속 되짚지 않아도 됩니다.';
 const emotion=scene.intent==='emotion';
 const first=(rules,operations)=>{if(rules.length!==operations.length)throw Error('Action operation metadata mismatch');const index=rules.findIndex(([rx])=>rx.test(q));if(index<0)return;scene.arc80ActionTask=operations[index];return rules[index][1];};
 if(emotion){
  scene.arc80ActionTask='cope';
  if(scene.domain==='finances')return '지금 느끼는 불안과 실제로 확인한 금액을 나누어 적어 보세요. 감정을 가라앉힐 시간과 숫자를 검토할 시간을 따로 정해도 됩니다.';
  if(['career','project','preparation'].includes(scene.domain))return '지금 가장 부담스러운 부분을 한 문장으로 적고, 오늘 줄일 일과 쉬어 갈 시간을 하나씩 정해 보세요.';
  if(['family','relationship'].includes(scene.domain))return '실제로 오간 말과 그때 느낀 마음을 나누어 적어 보세요. 당장 관계의 결론을 내리지 않아도 됩니다.';
  return '지금 느끼는 마음을 한 문장으로 적고, 오늘 덜어낼 부담과 도움을 청할 사람을 하나씩 정해 보세요. 감정을 바로 해결하지 못해도 괜찮습니다.';
 }
 const career=[
  [/입사.{0,10}수락|첫\s*출근/,'출근 시간과 장소, 준비할 서류를 담당자에게 확인하고, 첫날 물어볼 업무 질문을 짧게 정리해 보세요.'],
  [/출퇴근/,'늘어나는 이동 시간과 실제로 남는 수입을 계산하고, 평일에 지킬 수 있는 생활 시간을 함께 비교해 보세요.'],
  [/경력\s*공백/,'공백 동안 한 일, 지금 할 수 있는 일, 지원 직무와의 연결을 차례로 짧게 설명해 보세요.'],
  [/연봉|단가/,'맡을 업무와 책임, 이미 낸 성과를 정리하고 원하는 조건과 수락 가능한 범위를 나누어 적어 보세요.'],
  [/업무량|한꺼번|우선순위|업무\s*일정/,'맡은 일의 마감과 예상 소요 시간을 적고, 무엇을 먼저 처리하고 무엇을 늦출지 담당자와 구체적으로 맞춰 보세요.'],
  [/업무\s*범위|수정\s*요청/,'할 일, 납기, 수정 횟수와 추가 요청의 처리 방식을 문서로 나누어 합의해 보세요.'],
  [/대금/,'합의한 지급일과 업무 완료 기록을 확인하고, 필요한 확인 내용을 짧고 구체적으로 정리해 보세요.'],
  [/경력|직무/,'관심 있는 직무의 실제 업무와 내가 해 본 일을 나란히 적고, 연결해서 설명할 경험 하나를 골라 보세요.'],
  [/대신\s*처리|어디까지\s*받아/,'내가 맡은 일과 추가로 돕는 일을 구분하고, 대신 처리할 수 있는 범위와 돌려주어야 할 책임을 구체적으로 말해 보세요.'],
  [/피드백|실수/,'실제로 고칠 수 있는 행동 한 가지를 골라 보세요. 구체적인 사례를 물어보면 평가 전체를 자신에 대한 판단으로 받아들이지 않는 데 도움이 됩니다.'],
  [/인수인계/,'전달할 일, 완료 기준, 확인할 담당자를 한 문서에 적고 서로 같은 내용을 이해했는지 확인해 보세요.'],
  [/상사|팀장|동료|팀/,'상대가 실제로 한 말과 내가 요청할 내용을 구분한 뒤, 바꾸고 싶은 상황 한 가지를 구체적으로 말해 보세요.'],
  [/프리랜서|고객|사업/,'이번에 제공할 일과 끝났다고 볼 기준을 먼저 정하고, 시간·비용·서로의 책임을 확인해 보세요.']
 ];
 const relationship=[
  [/이미.{0,15}(?:생각을\s*말했|생각을\s*전했)/,'내 생각을 다시 반복하기보다, 상대가 어떻게 이해했는지 듣고 다음에 함께 정할 한 가지를 골라 보세요.'],
  [/(?:돈|지출|생활비).{0,30}(?:말|대화|소통)/,'각자 편하게 쓸 수 있는 범위와 부담스러운 점을 먼저 이야기하고, 함께 쓰는 비용의 기준을 맞춰 보세요.'],
  [/연락\s*간격/,'서로 편한 연락 빈도와 답하기 어려운 시간을 물어보고, 둘 다 지킬 수 있는 간격을 정해 보세요.'],
  [/약속.{0,12}취소/,'약속이 취소될 때 어떤 점이 아쉬운지 구체적으로 말하고, 다시 정할 수 있는 일정이 있는지 물어보세요.'],
  [/물건|돌려달/,'돌려받을 물건과 필요한 날짜를 분명히 말하고, 서로 가능한 반환 방법을 정해 보세요.'],
  [/혼자\s*있고|거리를\s*원/,'지금은 혼자 있을 시간을 존중하겠다고 전하고, 다음 대화의 시점은 상대가 편한지 확인하며 정해 보세요.'],
  [/자녀/,'대답을 재촉하기보다 자녀가 편한 시간과 대화 방식을 물어보고, 짧은 질문 하나부터 시작해 보세요.'],
  [/거절|경계|부탁/,'받아들일 수 있는 범위와 어려운 부분을 구분하고, 이번에 할 수 없는 부탁 하나를 분명하게 말해 보세요.'],
  [/부모님|엄마|아빠|가족|형제/,'가족이 걱정하는 점을 먼저 물어보고, 내가 원하는 것과 준비한 계획을 한 가지씩 설명해 보세요.'],
  [/약속|만남|제안/,'서로 가능한 일정 하나를 제안하고, 상대가 편하게 거절하거나 다른 시간을 말할 여지를 남겨 보세요.'],
  [/답장|답할|대답|안부/,'상대가 실제로 전한 내용에 먼저 답하고, 이어가고 싶은 이야기를 한 가지 덧붙여 보세요.'],
  [/연락|문자|고백/,'상대의 경계를 확인한 뒤, 답을 재촉하지 않는 짧은 말로 내 생각을 전할지 정해 보세요.']
 ];
 const preparation=[
  [/과제.{0,10}제출했/,'받고 싶은 피드백을 구체적으로 남겨 두고, 답을 기다리는 동안 이어갈 다음 학습 한 가지를 정해 보세요.'],
  [/일주일|공부량/,'남은 날짜에 꼭 복습할 내용과 덜어낼 내용을 나누고, 잠과 휴식을 포함해 하루에 가능한 분량을 정해 보세요.'],
  [/실기\s*시험/,'실제 시험의 준비물과 진행 순서를 확인하고, 한 번은 시간 안에 처음부터 끝까지 해보세요.'],
  [/쉬는\s*시간|공부와\s*운동|쉬면/,'공부를 끝낼 시각과 쉬는 시간을 먼저 정하고, 그 안에서 마칠 수 있는 분량으로 줄여 보세요.'],
  [/꾸준|습관|계획|목표/,'계속할 수 있는 최소 분량과 시작할 시간을 정해 보세요. 하루 계획을 못 지켜도 다음 작은 단위부터 다시 이어가면 됩니다.'],
  [/수업|이해|설명/,'막히는 개념 하나를 골라 내 말로 설명해 보고, 설명이 끊기는 부분을 자료나 질문으로 확인해 보세요.'],
  [/과제|제출/,'제출 기준과 마감부터 확인하고, 꼭 충족해야 할 부분과 추가로 다듬을 부분을 나누어 보세요.']
 ];
 const project=[
  [/(?:원고|작품).{0,20}(?:보냈|제출|투고)/,'접수 여부와 안내된 답변 일정을 확인해 두고, 기다리는 동안 진행할 다른 작업을 작게 정해 보세요.'],
  [/인물.{0,8}동기/,'이 장면에서 인물이 원하는 것과 그 때문에 하는 행동을 한 문장씩 적고, 둘이 연결되는지 읽어 보세요.'],
  [/문장과|전체\s*구조/,'장면의 순서와 인물의 선택이 이어지는지 먼저 읽은 뒤, 남길 장면의 문장을 다듬어 보세요.'],
  [/첫\s*장면|계속\s*고치/,'이번 수정에서 고칠 한 가지만 정하고, 정한 지점까지 읽은 뒤 다음 장면으로 넘어가 보세요.'],
  [/영상|편집/,'첫 장면에서 전달하려는 내용을 정하고, 그 내용에 이르기 전의 반복이나 설명을 한 구간씩 덜어 보세요.'],
  [/멜로디|작곡/,'같은 구절에서 리듬·음역·화성 중 한 가지만 바꾼 짧은 안을 만들고, 원래 안과 번갈아 들어 보세요.'],
  [/가입|사용자가|사용\s*흐름|휴대폰|버튼/,'사용자가 끝내야 할 행동 하나를 정하고, 처음부터 완료까지 직접 따라가며 막히는 화면과 그때 기대한 동작을 적어 보세요.'],
  [/범위|기능을\s*너무/,'이번에 사용자가 꼭 끝낼 수 있어야 하는 행동 하나를 남기고, 그 행동에 필요하지 않은 기능은 다음 단계로 미뤄 보세요.'],
  [/답변|질문에/,'질문과 실제 답변을 함께 놓고, 질문의 요구·이미 알려진 사실·제안한 행동이 서로 맞는지 한 항목씩 읽어 보세요.'],
  [/앱|코드|웹|개발/,'문제가 생기는 동작을 재현하고 기대한 결과와 실제 결과를 적은 뒤, 한 부분을 바꾸고 같은 동작을 다시 확인해 보세요.']
 ];
 const daily=[
  [/오늘|저를\s*위해|나를\s*위해/,'지금 나에게 필요한 것 한 가지를 고르고, 오늘 쓸 수 있는 시간 안에서 작게 해보세요.'],
  [/모임|먼저\s*말/,'상대가 이야기하는 내용에서 가벼운 질문 하나를 골라 시작하고, 반응을 보며 대화를 이어가 보세요.'],
  [/여행/,'이동·머무를 곳·돌아올 일정을 먼저 확인하고, 꼭 할 일과 바꿔도 되는 계획을 나누어 보세요.'],
  [/운동|습관|취미/,'바쁜 날에도 이어갈 수 있는 작은 분량과 시간을 정하고, 실제로 지킬 수 있는지 한 번 해보세요.'],
  [/집\s*정리/,'서랍이나 책상처럼 한 구역만 정하고, 남길 것·옮길 것·정리할 것을 나누어 보세요.'],
  [/휴대폰/,'휴대폰을 가장 자주 집어 드는 순간 하나를 찾아, 그때 대신할 짧은 행동을 정해 보세요.'],
  [/계획|하루|시간/,'오늘 꼭 할 일 하나와 미뤄도 되는 일을 나누고, 실제로 쓸 수 있는 시간 안에 넣어 보세요.']
 ];
 if(scene.domain==='career')return first(career,['prepare','compare','communicate','communicate','prioritize','coordinate','verify','communicate','coordinate','improve','communicate','communicate','coordinate'])||previous;
 if(scene.domain==='finances'){
  if(/주식.{0,10}이미\s*팔|이미.{0,10}팔았/.test(q)){scene.arc80ActionTask='cope';return '이미 한 매도의 이유를 기록하고, 가격을 확인할 시간을 정해 보세요. 지나간 선택을 매 순간의 가격으로 다시 평가하지 않아도 됩니다.';}
  if(/대출/.test(q)&&scene.intent==='compare'){scene.arc80ActionTask='compare';return '각 조건의 금리·상환 일정·수수료를 공식 자료로 확인하고, 같은 기간의 부담을 나란히 계산해 보세요.';}
  return previous;
 }
 if(['family','relationship'].includes(scene.domain))return first(relationship,['communicate','coordinate','coordinate','communicate','communicate','communicate','communicate','communicate','communicate','communicate','communicate','communicate'])||previous;
 if(scene.domain==='preparation')return first(preparation,['prepare','prioritize','prepare','prioritize','prepare','communicate','prepare'])||previous;
 if(scene.domain==='project')return first(project,['wait','improve','improve','improve','improve','improve','improve','prioritize','improve','improve'])||previous;
 if(scene.domain==='decision'){
  if(/이미\s*결정/.test(q))return '결정할 때의 이유와 그 뒤 새로 알게 된 사실을 나누어 적어 보세요. 새 정보 때문에 바꿀 부분인지, 불확실함이 불편한 것인지 구분해 볼 수 있습니다.';
  return '두 선택을 같은 기준으로 적고, 되돌릴 수 있는 작은 확인부터 해보세요. 아직 모르는 조건은 추측으로 채우지 않아도 됩니다.';
 }
 if(scene.domain==='stress'&&/상담/.test(q)){scene.arc80ActionTask='communicate';return '상담을 신청하게 된 이유와 최근 특히 힘들었던 장면을 적어 보세요. 처음부터 모든 이야기를 잘 정리해서 말할 필요는 없습니다.';}
 if(scene.domain==='stress'&&/도움.{0,8}청/.test(q)){scene.arc80ActionTask='communicate';return '지금 어려운 점과 부탁하고 싶은 도움을 한 가지씩 구체적으로 말해 보세요. 상대가 가능한 범위를 답할 여지도 남겨 두면 좋습니다.';}
 if(scene.domain==='stress'&&/목표/.test(q))return '오늘 에너지로 할 수 있는 가장 작은 일 하나를 정하고, 시작하거나 마친 사실 자체를 기록해 보세요.';
 if(scene.domain==='stress'&&/자책|표현|말을\s*줄/.test(q)){scene.arc80ActionTask='improve';return '나를 단정하는 말 대신 지금 어려운 상황을 설명하는 말로 바꿔 적어 보세요. 고칠 행동과 나 자신에 대한 평가는 나누어 볼 수 있습니다.';}
 if(scene.domain==='general')return first(daily,['prepare','communicate','prepare','prepare','prepare','improve','prioritize'])||previous;
 return previous;
};

function arc80CardSentence(a,spread){
 const label=SPREADS[spread].slots[a.index][0];
 return `‘${label}’에 놓인 ${a.name}${a.reverse?' 역방향':''}의 주제는 ‘${a.main}’입니다.`;
}
const ARC80_REPORT_TEXT=arc79CreateReport;
arc79CreateReport=function(q,spread,cards,override){
 const r=ARC80_REPORT_TEXT(q,spread,cards,override),{scene,intent}=arc79Scene(q,override),pack=arc79Pack(q,spread,cards),action=r.actions[0];
 const risky=scene.domain==='health'||scene.domain==='finances'||scene.boundary||scene.abuse||scene.urgent;
 const guide=arc80CardSentence(pack.advice,spread),center=arc80CardSentence(pack.main,spread);
 if(!risky&&!scene.facts.known){
  if(intent.primary==='action'||intent.primary==='emotion')r.direct=`${action} ${guide}`;
  else if(intent.primary==='open'){
   const reflect={family:'이 관계에서 내가 바라는 것과 실제로 표현한 것에는 어떤 차이가 있나요?',relationship:'관계에서 지키고 싶은 나의 기준과 상대에게 기대하는 것을 나누어 볼까요?',career:'지금 하는 일에서 계속 지키고 싶은 것과 바꾸고 싶은 조건은 무엇인가요?',project:'이 작업에서 지키고 싶은 중심과 내려놓아도 되는 기준은 무엇인가요?',preparation:'성적이나 결과와 별개로 이번 과정에서 달라진 내 태도는 무엇인가요?',stress:'지금 느끼는 마음을 평가하지 않고 설명한다면 어떤 말이 먼저 떠오르나요?',decision:'이 선택에서 꼭 지키고 싶은 기준은 무엇인가요?',waiting:'결과를 바꿀 수 없는 시간에도 내가 지킬 수 있는 일상은 무엇인가요?'}[scene.domain]||'이 주제를 내 일상과 연결하면 지금 가장 먼저 돌아보고 싶은 것은 무엇인가요?';
   r.direct=`${center} ${reflect}`;
  }
  else if(intent.primary==='cause')r.direct=`${center} 이 주제가 지금 상황과 맞닿는지, 실제로 반복된 장면을 떠올려 보세요. 실제 원인은 카드만으로 확인할 수 없으므로, 관찰한 사실과 나의 해석을 나누어 보세요.`;
  else if(intent.primary==='forecast')r.direct=`${center}${pack.trend&&pack.trend.index!==pack.main.index?' '+arc80CardSentence(pack.trend,spread):''} 이 흐름을 참고하되, 결과와 시점은 실제 변화로 확인해야 합니다. ${action}`;
  else if(intent.primary==='compare'){
   const a=pack.list.find(a=>a.role==='optionA'),b=pack.list.find(a=>a.role==='optionB');
   const criteria=/여행|이사|독립/.test(q)?'실제 비용, 쓸 수 있는 시간, 필요한 휴식을 같은 기준으로 비교해 보세요.':{family:'내가 감당할 수 있는 범위와 상대의 경계, 대화할 준비가 되었는지를 각각 살펴보세요.',relationship:'내가 원하는 관계와 상대의 의사, 지금 감당할 수 있는 감정적 부담을 나누어 보세요.',career:'실제로 맡을 일, 유지할 수 있는 생활, 배울 기회를 같은 기준으로 비교해 보세요.',preparation:'남은 시간과 지금 취약한 부분, 피드백을 받을 수 있는 방식을 같은 기준으로 비교해 보세요.',project:'작업의 목적과 준비할 시간, 피드백을 얻을 방법을 같은 기준으로 비교해 보세요.'}[scene.domain]||'각 선택에 필요한 시간과 부담, 되돌릴 수 있는 정도를 같은 기준으로 비교해 보세요.';
   r.direct=`${a&&b?arc80CardSentence(a,spread)+' '+arc80CardSentence(b,spread):center} ${criteria}`;
  }
  if(scene.facts.sent&&!scene.facts.replied)r.direct=(scene.facts.noReply?'이미 마음을 전했고 아직 답을 받지 못한 상황입니다. ':'이미 생각을 전했다는 점을 바탕으로 읽었습니다. ')+r.direct;
  if(scene.facts.noConflict)r.direct='다툰 적이 없다는 점을 전제로 읽었습니다. '+r.direct;
 }
 if(scene.domain==='health'&&scene.medical)r.direct=r.direct.replace('걱정을 돌아보는 상징은','마음을 돌아볼 때 참고할 카드의 주제는');
 if(!risky&&scene.facts.known)r.direct=`이미 확인한 결과를 바탕으로 다음 단계를 살펴볼게요. ${action} ${guide}`;
 if(scene.domain==='finances'&&intent.primary==='open')r.direct=`${center} 실제 지출과 내가 중요하게 여기는 기준이 같은 방향을 향하는지 돌아보세요.`;
 if(scene.domain==='finances'&&intent.primary==='emotion')r.direct=`${action} ${center}`;
 r.actions=[action];
 r.sections=r.sections.map(section=>{
  if(section.refs.length!==1){
   const atoms=section.refs.map(i=>pack.list[i]);
   const roles=new Set(atoms.map(a=>a.role));
   const connection=roles.has('optionA')&&roles.has('optionB')?'이 둘은 우열을 정하는 점수보다 각 선택에서 필요한 태도를 비교하는 데 활용해 보세요.':roles.has('obstacle')?'바라는 방향과 실제로 점검할 제약을 구별해 읽으면, 어느 부분부터 확인할지 정하는 데 도움이 됩니다.':roles.has('future')||roles.has('outcome')?'현재의 태도와 앞으로 살펴볼 방향을 연결하되, 한 카드가 다른 카드의 결과를 보장한다고 읽지는 않습니다.':'두 위치가 질문의 서로 다른 측면을 비춥니다. 같은 뜻으로 합치기보다 각 위치에서 확인할 점을 나누어 보세요.';
   return {...section,body:atoms.map(a=>arc80CardSentence(a,spread)).join(' ')+' '+connection};
  }
  const a=pack.list[section.refs[0]],slot=SPREADS[spread].slots[a.index];
  const context={past:'지금과 비슷했던 경험에서 무엇을 반복하고 있는지 돌아보세요.',now:'지금 가장 크게 영향을 주는 부분과 바꿀 수 있는 부분을 구분해 보세요.',future:'현재의 방향이 이어질 때 살펴볼 관점입니다. 실제 결과가 정해졌다는 뜻은 아닙니다.',outcome:'바라는 결과와 그 결과에 필요한 조건을 구별해 보세요.',obstacle:'이 부분이 실제 제약인지, 걱정 때문에 크게 느끼는 것인지 나누어 보세요.',resource:'이미 활용할 수 있는 사람·시간·경험 가운데 이 주제와 이어지는 것을 찾아보세요.',advice:'지금 선택할 수 있는 행동에 이 주제를 작게 적용해 보세요.',criteria:'두 선택에 같은 기준을 적용하고 있는지 확인해 보세요.',optionA:'첫 번째 선택에서 필요한 태도와 감당할 조건을 살펴보세요.',optionB:'두 번째 선택에서 필요한 태도와 감당할 조건을 살펴보세요.',goal:'내가 바라는 것과 주변에서 바라는 것을 나누어 생각해 보세요.',root:'지금 판단에 영향을 주는 익숙한 생각이나 경험을 돌아보세요.',feeling:'느끼는 마음과 실제로 확인한 결과를 구별해 보세요.',boundary:'이미 끝난 일과 앞으로 조절할 수 있는 일을 나누어 보세요.',environment:'주변에서 실제로 확인할 수 있는 말과 행동을 기준으로 살펴보세요.',self:'이 상황에서 내가 선택할 수 있는 태도를 돌아보세요.',fear:'바라는 것과 두려워하는 것을 따로 적어 보세요.',message:'지금 질문과 맞닿는 부분이 무엇인지 살펴보세요.'}[a.role]||'질문 속 상황과 맞닿는 부분을 살펴보세요.';
  return {...section,title:slot[0],body:`${arc80CardSentence(a,spread)} ${context}`};
 });
 r.arc80={editorialVersion:80};return r;
};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(r=>r.id===currentHistoryId);if(record){record.engineVersion=80;setStoredRecords(records);}});
