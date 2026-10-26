/* v79: one question context for the answer, evidence, export and follow-up. */
'use strict';
const ARC79_DOMAINS={general:'자기성찰',relationship:'연애·관계',family:'가족·친구',career:'일·진로',preparation:'시험·평가',waiting:'결과 기다리기',stress:'마음 돌보기',project:'창작·프로젝트',finances:'금전',health:'건강',decision:'선택'};
function arc79Intent(question,scene){
 const q=String(question).normalize('NFKC').trim();
 // The last explicit request takes precedence over background feelings or a quoted worry.
 const clauses=q.replace(/[“"「『][^”"」』]*[”"」』]/g,' ').split(/[.!?。！？\n]+/).filter(x=>x.trim());
 const ask=clauses.at(-1)||q;
 const result=arc78Intent(ask,scene);
 let primary=result.primary;
 if(/(?:비교|어느\s*(?:쪽|곳|것)|둘\s*중|A\s*(?:와|과|또는|vs)\s*B|[가-힣]*[을할갈낼볼둘날릴질]지.{0,50}[가-힣]*[을할갈낼볼둘날릴질]지|(?:아니면|혹은).{0,30}(?:나을|좋을|선택))/i.test(ask))primary='compare';
 else if(/(?:배울|깨달을|돌아보|성찰)/.test(ask)&&!/(?:방법|어떻게|해야)/.test(ask))primary='open';
 else if(/(?:어떻게|어떡|무엇부터|뭐부터|어디부터|무엇을|뭘|어떤\s*(?:준비|행동|방법|점)|조언|대처|준비할|고칠|손볼|보완할|줄일|다스릴|추스를|정리할|관리할|해야|해도\s*(?:될|괜찮)|하는\s*(?:게|것이)\s*(?:좋|나)|(?:연락|전화|지원|퇴사|도전|시작|이직|신청)할까요|볼까요|갈까요|보낼까요|쉴까요|그만둘까요)/.test(ask)&&!/(?:어떻게\s*(?:될|되었|됐|흘러)|왜|어째서|까닭|이유|원인|배경)/.test(ask))primary='action';
 else if(/(?:왜|어째서|까닭|원인|이유|배경|무슨\s*(?:뜻|의미))/.test(ask))primary='cause';
 else if(/(?:어도|아도)\s*(?:될까|괜찮)/.test(ask))primary='action';
 else if(/(?:불안|걱정|두렵|두려).{0,60}(?:어요|습니다|에요)$/.test(ask)&&!/(?:할까요|일까요|될까요|있을까요|언제)/.test(ask))primary='emotion';
 else if(/(?:될까|올까|오나요|있을까|가능|전망|언제|어떨까|이어질까|좋아질까|성공할까|합격할까|오를까|풀릴까|일까요|회복될까|어떤\s*마음|날\s*좋아|나를\s*좋아)/.test(ask))primary='forecast';
 else if(/(?:불안|걱정|두렵|무섭|외롭|외로|공허|답답|자책|잠.{0,8}(?:못|안)|우울|슬프|지쳤|지쳐|허전|괴롭|속상|떨려|마음이\s*무거)/.test(ask))primary='emotion';
 if(primary==='open'&&clauses.length>1){const context=arc78Intent(q,scene);primary=context.primary;}
 return {...result,primary,secondary:result.primary!==primary&&result.primary!=='open'?result.primary:result.secondary,confidence:primary==='open'?'low':'rule',question:q};
}
function arc79Scene(question,override='auto'){
 const q=String(question||'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const s=arc72Scene(q,{});s.question=q;
 const f={...s.facts,resultFailed:false,resultPassed:false,known:false};
 // Outcome *words* and feared outcomes are not reported facts.
 const failed=/(?:불합격|탈락|낙방)(?:을|이|으로)?\s*(?:했|됐|되었|확정|통보|나왔)|(?:시험|면접|최종|결과).{0,10}떨어졌/.test(q);
 const passed=/(?:합격|선발|당선|승인)(?:을|이|으로)?\s*(?:했|됐|되었|확정|통보|나왔)/.test(q);
 f.resultFailed=failed;f.resultPassed=passed;f.known=failed||passed||q.split(/[.!?]/).some(s=>/(?:결과|발표).{0,8}(?:이미\s*)?(?:나왔|확정됐|확인했)/.test(s)&&!/(?:안|못)\s*나왔|나오지\s*않|확인하지\s*않/.test(s));
 if(/(?:불합격|탈락|합격).{0,8}(?:하지\s*않|하진\s*않|안\s*했|아니라고)/.test(q)){f.resultFailed=false;f.resultPassed=false;f.known=false;}
 if(f.known&&/(?:다음\s*(?:시험|면접|번)|이번\s*(?:시험|면접)|재도전).{0,25}(?:합격할|붙을|가능|될까)/.test(q)){f.previousOutcome=f.resultFailed?'failed':f.resultPassed?'passed':'known';f.resultFailed=false;f.resultPassed=false;f.known=false;}
 const contact=/(?:연락|문자|메시지|고백|사과)(?:을|를)?\s*(?:이미\s*)?(?:했|보냈|전했)/.test(q);
 const unsent=/(?:연락|문자|메시지|고백|사과).{0,8}(?:안\s*했|못\s*했|하지\s*않았|안\s*보냈|못\s*보냈|보내지\s*않았)|아직.{0,8}(?:연락|고백)\s*(?:안|못)/.test(q);
 f.sent=contact&&!unsent;
 f.replied=/(?:답장|회신|답변|대답)(?:을|이|를)?\s*(?:이미\s*|방금\s*)?(?:왔|받았|도착했)/.test(q)&&!/(?:답장|회신|답변).{0,8}(?:안\s*왔|못\s*받았|받지\s*않았)/.test(q);
 f.noReply=!f.replied&&/(?:답장|회신|답변|대답).{0,12}(?:없|안\s*와|안\s*왔|오지\s*않|못\s*받|기다)/.test(q);
 f.noConflict=/(?:싸운|다툰|갈등을\s*겪은)\s*적.{0,5}없|(?:싸우|다투)지\s*않/.test(q);
 const waiting=/(?:결과|발표|답장|통보|합격).{0,18}(?:기다|아직|안\s*나|나오지|전이)|(?:아직|대기).{0,15}(?:결과|발표)/.test(q);
 s.phase=f.known?'known':(waiting||f.noReply)?'pending':'active';f.waiting=s.phase==='pending';
 if(/(?:내시경|진단|검사\s*결과|혈액\s*검사|진료|증상|치료|임신|복통|통증|가슴이\s*아|숨.{0,4}(?:안|못)\s*쉬|처방|복용|약을\s*끊)/.test(q)&&!/(?:병원|의사|간호사).{0,10}(?:입사|취업|채용|면접)/.test(q))s.domain='health';
 else if(/(?:주식|코인|대출|투자|연금|저축|적금|전세|보증금|월세|수익|매수|매도|비트코인)/.test(q))s.domain='finances';
 else if(/(?:소설|원고|작곡|그림|작품|코드|개발|앱|웹사이트|웹페이지|프로젝트|영상|디자인|집필)/.test(q))s.domain='project';
 else if(/(?:친구|부모|엄마|아빠|형제|동생|가족|자녀)/.test(q))s.domain='family';
 else if(/(?:연인|애인|전남친|전여친|짝사랑|재회|데이트|고백|이별|연애|그\s*사람|상대방)/.test(q))s.domain='relationship';
 else if(/(?:직장|취업|이직|면접|퇴사|업무|상사|직무|커리어|회사)/.test(q))s.domain='career';
 else if(/(?:시험|합격|불합격|수능|공부|성적|자격증|입시|과제)/.test(q))s.domain='preparation';
 else if(/(?:불안|자책|무기력|우울|외롭|외로|공허|자존감|번아웃)/.test(q))s.domain='stress';
 if(override!=='auto'&&Object.hasOwn(ARC79_DOMAINS,override))s.domain=override;
 // Health and immediate safety concerns remain factual even under a manual topic override.
 s.medical=/(?:진단|치료|검사\s*결과|증상|통증|임신|복용|처방|약을\s*끊)/.test(q)&&!/(?:입사|채용|면접)/.test(q);
 s.urgent=/(?:가슴.{0,8}(?:통증|아프)|호흡곤란|숨.{0,5}(?:안|못)\s*쉬|의식을\s*잃)/.test(q);
 s.boundary=/(?:연락하지\s*말|연락\s*그만|연락을\s*원치|차단|접근\s*금지)/.test(q);
 s.abuse=/(?:폭행|때려|때렸|스토킹|협박|폭력)/.test(q);
 s.facts=f;const intent=arc79Intent(question,s);s.intent=intent.primary;
 return {scene:s,intent};
}
function arc79Pack(q,spread,cards){
 if(!Object.hasOwn(SPREADS,spread))throw new Error('알 수 없는 카드 배열입니다.');
 if(!Array.isArray(cards)||cards.length!==SPREADS[spread].slots.length)throw new Error('배열의 카드 수가 맞지 않습니다.');
 if(cards.some(c=>!c||!CARD_BY_ID.has(c.id)||typeof c.rev!=='boolean')||new Set(cards.map(c=>c.id)).size!==cards.length)throw new Error('카드 ID·방향 또는 중복을 확인해 주세요.');
 return arc72CardPack(q,spread,cards,{});
}
function arc79Action(scene,pack){
 const facts=arc72PlanFacts(scene,scene.question);
 let action=arc72Action(scene,facts,pack);
 if(scene.intent==='emotion'&&scene.phase!=='pending'&&!facts.rules.knownOutcome&&!facts.rules.noFirstContact){
  const emotional={career:'이번 주 업무 중 줄이거나 도움을 요청할 일 하나와 회복할 시간을 구분해 보세요.',project:'완성도 평가를 잠시 멈추고, 작업 뒤의 감정을 적은 다음 쉬어 갈 시간을 정해 보세요.',family:'서운했던 실제 장면과 바라는 관계의 모습을 나누어 적고, 믿을 수 있는 사람과 마음을 나눠 보세요.',relationship:'상대의 반응과 별개로 지금 내 마음에 필요한 돌봄 한 가지를 정해 보세요.',stress:'지금 느끼는 감정을 한 문장으로 적고, 부담을 줄일 작은 일과 도움을 청할 사람을 정해 보세요.'};
  action=emotional[scene.domain]||action;
 }
 if(scene.domain==='career'&&scene.phase==='active'&&/(?:이직|취업|지원|면접).{0,25}(?:준비|무엇부터|뭐부터)/.test(scene.question))action+=' 관심 있는 직무의 공고 하나에서 필요한 역량과 지금 갖춘 경험을 나란히 적어 보세요.';
 if(scene.domain==='project'&&/(?:앱|코드|개발|웹페이지)/.test(scene.question)&&scene.intent==='action')action='문제가 생기는 동작 하나를 재현하고, 기대한 결과와 실제 결과를 적은 뒤 한 부분만 수정해 보세요.';
 if(scene.domain==='finances'&&/(?:월세|생활비|지출|저축|적금)/.test(scene.question)&&!/(?:전세|보증금|중|비교)/.test(scene.question))action='월 소득과 고정비·변동지출을 나누어 적고, 바꿀 수 있는 지출 한 가지의 실제 절감액을 계산해 보세요.';
 if(scene.domain==='finances'&&/대출/.test(scene.question)&&!/(?:중|비교)/.test(scene.question))action='대출 잔액·금리·상환일을 공식 내역으로 확인하고, 월 상환액을 감당할 수 있는지 계산해 보세요.';
 if(['family','relationship'].includes(scene.domain)&&scene.intent==='action'&&!scene.facts.sent&&!scene.facts.replied&&/(?:연락|문자|고백).{0,15}(?:할까|보낼까|전할까)/.test(scene.question))action=['advance','reconnect'].includes(pack.advice.tag)?'상대가 연락을 원치 않는다는 표시가 없다면, 답을 재촉하지 않는 짧은 안부 한 번을 보낼지 검토해 보세요.':'최근의 실제 소통과 상대의 경계를 확인하고, 답을 재촉하지 않는 짧은 말을 먼저 적어 보세요.';
 if(scene.domain==='health'){
  if(/(?:복용|처방|약을\s*끊)/.test(scene.question))action='처방받은 약의 변경·중단은 카드로 결정하지 말고, 처방한 의료진이나 약사에게 문의하세요.';
  else if(scene.intent==='compare')action='각 방법의 목적·기대 효과·위험·대안을 담당 의료진과 같은 기준으로 비교하세요.';
  else if(/(?:검사|내시경).{0,10}(?:전|준비)/.test(scene.question))action='검사 기관에서 받은 준비 안내를 확인하고, 복용약과 주의사항은 담당 의료진에게 문의하세요.';
  else if(/(?:무엇|어떤\s*점|물어|이해)/.test(scene.question))action='의료진에게 결과의 의미, 다음 확인 일정, 주의할 증상을 물어볼 질문을 적어 보세요.';
 }
 if(scene.boundary)action='상대가 원치 않는 연락은 멈추고, 그 경계를 존중하며 내 일상을 돌보세요.';
 if(scene.abuse)action='안전한 장소와 믿을 수 있는 사람의 도움을 먼저 확보하세요. 위험한 상대와 단둘이 해결하려 하지 마세요.';
 if(scene.urgent)action='카드 리딩보다 즉시 응급 의료 도움을 받는 것이 우선입니다.';
 return action;
}
function arc79CreateReport(question,spread,cards,override='auto'){
 const q=String(question||'').normalize('NFKC').trim();
 if(q.length>500)throw new Error('질문은 500자 이내로 입력해 주세요.');
 const {scene,intent}=arc79Scene(q,override),pack=arc79Pack(q,spread,cards);
 if(scene.medical)scene.domain='health';
 const facts=arc72PlanFacts(scene,q),relations=arc78PairRelations(pack,scene),action=arc79Action(scene,pack);
 const atom=a=>`${a.name} ${a.reverse?'역방향':'정방향'}의 ‘${a.main}’`;
 const center=atom(pack.main),guide=atom(pack.advice);
 let reply;
 if(intent.primary==='compare'){
  const a=pack.list.find(a=>a.role==='optionA'),b=pack.list.find(a=>a.role==='optionB');
  reply={headline:'선택을 같은 기준에서 비교하기',direct:a&&b?`첫 번째 선택의 상징은 ${atom(a)}이고, 두 번째 선택의 상징은 ${atom(b)}입니다. 비용·시간·되돌릴 수 있는 정도를 같은 기준으로 비교해 보세요. 카드가 어느 선택의 실제 결과를 보장하지는 않습니다.`:`이번 선택의 공통 기준으로 살펴볼 상징은 ${center}입니다. 두 선택의 비용·시간·되돌릴 수 있는 정도를 비교해 보세요. 각 선택을 따로 살펴보려면 ‘두 갈래의 선택’ 배열이 도움이 됩니다.`};
 }else if(intent.primary==='cause')reply={headline:'원인으로 단정하기 전에 확인할 배경',direct:`실제 이유는 카드만으로 알 수 없습니다. 이번 배열의 중심 상징은 ${center}입니다. ${pack.limit?`점검할 제약의 상징은 ${atom(pack.limit)}입니다. `:''}이 관점을 사실과 가설로 나누어 보고, 질문에 나온 상황과 맞는지 확인해 보세요.`};
 else {const lean=arc72Lean(pack);reply={headline:lean==='open'?'가능성을 살피되 결과는 열어 두기':lean==='restrained'?'흐름에서 점검할 제약':'기대와 제약을 함께 살피기',direct:`현재의 중심 상징은 ${center}입니다. ${pack.trend&&pack.trend.index!==pack.main.index?`이후 흐름의 상징은 ${atom(pack.trend)}입니다. `:''}${lean==='open'?'상징에서는 시도와 활용할 자원에':lean==='restrained'?'상징에서는 속도보다 점검과 정비에':'상징에서는 기대와 제약을 함께 살피는 일에'} 무게가 실립니다. 실제 결과·시점이나 타인의 마음을 확인한 것은 아닙니다.`};}
 // Acknowledge the user's concrete situation before moving to symbolic interpretation.
 const stated=facts.stated.filter(x=>!x.includes('다툰'));
 if(facts.rules.knownOutcome){reply={headline:'확인된 결과 이후의 다음 단계',direct:`${stated.join(' ')} 다음 계획에 연결해 볼 상징은 ${guide}입니다. ${action} 이미 나온 결과를 카드로 바꾸거나 다시 예측할 수는 없습니다.`};}
 else if(intent.primary==='action')reply={headline:'지금 선택할 수 있는 한 걸음',direct:`실천의 관점으로 읽은 상징은 ${guide}입니다. ${action}`};
 else if(intent.primary==='emotion')reply={headline:'마음을 돌보며 현실과 연결하기',direct:`지금 마음을 돌아보는 관점은 ${center}입니다. 감정만으로 실제 결과나 상대의 마음을 확정할 수는 없습니다. ${action}`};
 else if(intent.primary==='open')reply={headline:q?'질문을 바라보는 핵심 관점':'오늘 돌아볼 한 가지',direct:`${center}이 중심에 놓여 있습니다. 이 상징이 지금 내 상황과 맞닿는 부분을 살펴보세요. ${action}`};
 if(facts.rules.noFirstContact&&!facts.rules.knownOutcome)reply.direct='이미 마음을 전했고 아직 답을 받지 못한 상황입니다. '+reply.direct;
 if(scene.facts.noConflict)reply.direct='다툰 적이 없다는 점을 전제로 읽었습니다. '+reply.direct;
 if(scene.boundary||scene.abuse)reply={headline:scene.abuse?'안전이 먼저입니다':'상대의 경계를 존중하기',direct:`${action} 내 감정과 선택을 성찰하는 관점은 ${center}입니다. 카드가 상대의 동의나 마음을 대신 확인해 주지는 않습니다.`};
 if(scene.domain==='health')reply={headline:scene.urgent?'지금은 응급 의료 도움이 우선입니다':'건강은 진료와 검사로 확인하기',direct:`${scene.urgent?action:'카드로 진단·치료 여부나 검사 결과를 판단할 수 없습니다. '+action} 걱정을 돌아보는 상징은 ${center}입니다.`};
 if(scene.domain==='finances'){
  const limit=/(?:주식|코인|투자|수익|매수|매도)/.test(q)?'카드로 가격이나 수익을 예측하거나 매수·매도를 결정할 수 없습니다.':'금전 문제는 실제 금액과 계약 조건을 바탕으로 판단해야 합니다.';
  const focus=intent.primary==='compare'?' 두 선택의 비용·기간·위험을 같은 기준으로 비교해 보세요.':intent.primary==='cause'?' 원인을 카드로 단정하지 말고, 실제 기록과 당시 판단 기준을 나누어 살펴보세요.':'';
  reply={headline:'금전 판단은 실제 조건을 바탕으로',direct:`${limit}${focus} ${action} 결정을 대하는 태도를 살펴볼 상징은 ${guide}입니다.`};
 }
 const sections=arc72Sections(spread,pack,scene,72);
 if(relations.length){
  const top=relations[0],a=pack.list[top.indices[0]],b=pack.list[top.indices[1]];
  const link={reinforce:'반복되는 주제가 질문에서 얼마나 중요한지 살펴보세요.',tension:'서로 다른 요구를 비추므로, 기대와 제약을 따로 점검해 보세요.',transition:'시간에 따른 관점의 변화를 살피되, 실제 사건의 인과로 단정하지 마세요.',alternatives:'두 경로가 요구하는 태도를 같은 기준으로 비교해 보세요.',constraint:'바라는 변화와 현실에서 확인할 제약을 구별해 보세요.',complement:'각 위치의 관점이 질문의 다른 측면을 보충합니다.'}[top.type];
  const body=`함께 살펴볼 두 상징은 ${atom(a)}, ${atom(b)}입니다. ${link}`;
  const group=sections.find(s=>s.kind==='synthesis');
  if(group){group.body+=' '+body;group.refs=[...new Set([...group.refs,...top.indices])];group.kind='relational';}
  else sections.push({title:'카드 사이의 연결',body,refs:top.indices,kind:'relational'});
 }
 // Every card's position, orientation and actual symbol remain visible in detailed evidence.
 sections.forEach(s=>{s.body=s.body.replace(/‘([^’]+)’은/g,'‘$1’이라는 상징은');});
 const footer='타로는 상징을 통한 성찰입니다. 실제 미래·타인의 마음·검사 결과를 확인하는 수단이 아닙니다.';
 const report={ctx:{key:scene.domain},...reply,sections,actions:[action,`조언 카드의 상징은 ${guide}입니다. 이 행동이 지금 확인된 사실과 맞는지 적어 보세요.`],footer,layoutLabel:'THE READING · 질문에 대한 답변'};
 const influence=pack.list.map(a=>({index:a.index,name:a.name,role:a.role,sections:sections.flatMap((s,i)=>s.refs.includes(a.index)?[i]:[])}));
 report.arc72={scene:{...scene},influence,rules:facts.rules,stated:facts.stated,audit:[]};
 report.arc79={version:79,intent,domain:scene.domain,phase:scene.phase,facts:scene.facts,override,relations,evidence:pack.list.map(a=>({index:a.index,id:a.id,reverse:a.reverse,role:a.role,meaning:a.main})),audit:[]};
 return report;
}
function arc79Plan(question,spread,cards,override='auto'){
 // Some legacy card-pair helpers use the live draw. Bind it only for this synchronous
 // operation, then restore it even if validation or a helper throws.
 const previous={spread:selectedSpread,cards:drawn,question:$('question').value,override:$('contextOverride').value};
 try{selectedSpread=spread;drawn=cards;$('question').value=String(question||'');$('contextOverride').value=override;return arc79CreateReport(question,spread,cards,override);}
 finally{selectedSpread=previous.spread;drawn=previous.cards;$('question').value=previous.question;$('contextOverride').value=previous.override;}
}
window.__arcana79Build=arc79Plan;
const ARC79_OLD_BUILD=arcanaV5Build;
arcanaV5Build=function(){return drawn.length?arc79Plan($('question').value,selectedSpread,drawn,$('contextOverride').value):ARC79_OLD_BUILD();};

// A single plain-text view also powers the copy, download and saved-reading view.
readingText=function(){
 const report=arcanaV5Build();
 return [`ARCANA · ${SPREADS[selectedSpread].title}`,`질문: ${$('question').value.trim()||'오늘의 성찰'}`,`일시: ${new Date().toLocaleString('ko-KR')}`,'',report.headline,report.direct,'','[지금 해볼 일]',...report.actions.map((x,i)=>`${i+1}. ${x}`),'','[카드별 근거]',...report.sections.flatMap(s=>[s.title,s.body,'']),...drawn.map((d,i)=>`${i+1}. ${SPREADS[selectedSpread].slots[i][0]} · ${orName(d)} · ${cardMeaning(d)}`),'',report.footer,...(v11FollowupLog.length?['',v11FollowupText(v11FollowupLog)]:[])].join('\n');
};
v10AnswerFollowup=function(q){
 const report=arcanaV5Build(),pack=arc79Pack($('question').value,selectedSpread,drawn),category=v10FollowupCategory(q);
 let a=category==='warning'?pack.limit||pack.main:category==='resource'?pack.list.find(a=>a.role==='resource')||pack.main:category==='action'?pack.advice:category==='future'?pack.trend||pack.main:pack.main;
 const section=report.sections.find(s=>s.refs.includes(a.index));
 const future=['health','finances'].includes(report.arc79.domain)||report.arc79.facts.known?report.direct:(section?.body||report.direct);
 const unlinked=pack.list.length===1?'한 장에서는 카드 사이의 대립을 비교할 수 없습니다. ':'현재 배열에서는 카드별 근거를 나누어 읽습니다. 뚜렷한 공통 주제나 대립을 단정하지 않아도 됩니다. ';
 const answer=category==='action'?report.actions.join(' '):category==='conflict'?(report.sections.find(s=>s.kind==='relational')?.body||unlinked+report.direct):category==='future'?future+' '+report.footer:(section?.body||report.direct);
 return {category,question:q,answer,ref:`${a.name} ${a.reverse?'역방향':'정방향'}`};
};

// Storage may contain malformed or older data; never let it break the history screen.
const ARC79_VALIDATE_RECORD=a22ValidateRecord;
a22ValidateRecord=function(rec){return !!rec&&Object.hasOwn(SPREADS,rec.spread)&&ARC79_VALIDATE_RECORD(rec)&&new Set(rec.drawn.map(c=>c.id)).size===rec.drawn.length&&(!rec.followups||Array.isArray(rec.followups)&&rec.followups.every(x=>x&&typeof x.question==='string'&&typeof x.answer==='string'))&&(!rec.reframes||Array.isArray(rec.reframes)&&rec.reframes.every(x=>x&&typeof x.question==='string'&&x.report&&typeof x.report.headline==='string'&&typeof x.report.direct==='string'&&Array.isArray(x.report.sections)&&x.report.sections.every(s=>s&&typeof s.title==='string'&&typeof s.body==='string')&&Array.isArray(x.report.actions)&&x.report.actions.every(a=>typeof a==='string')));};
storedRecords=function(){try{const all=JSON.parse(localStorage.getItem('arcana_records_v1')||'[]');return Array.isArray(all)?all.filter(a22ValidateRecord).slice(0,100):[];}catch{return [];}};

function arc79UI(){
 const q=$('question');q.setAttribute('aria-describedby','arc79QuestionMeta');
 $('reversals').setAttribute('aria-label','역방향 카드 사용');$('reversals').setAttribute('role','switch');
 // Use the current question parser for recommendations as well as the answer.
 const oldAuto=$('arc78AutoSpread'),auto=oldAuto.cloneNode(true);oldAuto.replaceWith(auto);
 let autoApplied=false;
 auto.addEventListener('click',()=>{
  if(!q.value.trim()){$('arc78SpreadHint').textContent='질문을 먼저 입력하면 적합한 배열을 선택해 드립니다.';q.focus();return;}
  const {scene,intent}=arc79Scene(q.value,$('contextOverride').value);
  const domain=scene.domain;
  const spread=intent.primary==='compare'||domain==='decision'?'choice5':domain==='waiting'?'waiting3':['family','relationship'].includes(domain)?'relationship5':scene.phase==='pending'?'waiting3':domain==='career'?'career5':domain==='project'||['action','cause'].includes(intent.primary)?'five':'three';
  document.querySelector(`[data-spread="${spread}"]`).click();autoApplied=true;update();
  $('arc78SpreadHint').textContent=`${SPREADS[spread].title} 배열을 선택했습니다. 카드 ${SPREADS[spread].slots.length}장을 직접 뽑게 됩니다.`;
 });
 const tools=document.createElement('div');tools.className='arc79-question-tools';
 tools.innerHTML='<div class="arc79-examples" aria-label="질문 예시"><span>예시로 시작</span><button type="button" data-example="이직을 준비할 때 이번 주에 무엇부터 해야 할까요?">일과 진로</button><button type="button" data-example="친구와 소원해졌어요. 어떻게 대화를 시작하면 좋을까요?">관계와 소통</button><button type="button" data-example="결과를 기다리며 불안해요. 마음을 어떻게 돌볼까요?">마음 돌보기</button></div><p id="arc79QuestionMeta" role="status"><span id="arc79IntentHint"></span><span id="arc79Count">0 / 500</span></p>';
 q.after(tools);
 const intent=document.createElement('div');intent.className='arc79-intent';
 intent.innerHTML='<label for="arc79IntentOverride">답변의 초점 <small>원하는 관점으로 바꿀 수 있어요</small></label><select id="arc79IntentOverride"><option value="auto">질문에서 자동으로 읽기</option><option value="action">지금 할 행동</option><option value="forecast">앞으로의 흐름</option><option value="cause">원인과 배경</option><option value="compare">선택지 비교</option><option value="emotion">마음 돌보기</option><option value="open">전반적인 성찰</option></select>';
 $('contextOverride').closest('.context-control').after(intent);
 const summary=document.createElement('div');summary.className='arc79-ready';summary.id='arc79Ready';summary.setAttribute('role','status');
 $('startReading').closest('.actions').before(summary);
 const examples=tools.querySelectorAll('[data-example]');
 examples.forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.example;q.dispatchEvent(new Event('input',{bubbles:true}));q.focus();}));
 function update(){
  const parsed=arc79Scene(q.value,$('contextOverride').value),count=q.value.length;
  $('arc79Count').textContent=`${count} / 500`;
  $('arc79IntentHint').textContent=q.value.trim()?`${ARC79_DOMAINS[parsed.scene.domain]} · ${ARC78_INTENT_LABEL[$('arc79IntentOverride').value==='auto'?parsed.intent.primary:$('arc79IntentOverride').value]}`:'질문이 없어도 오늘의 성찰로 시작할 수 있어요.';
  $('v13DetectedTopic').textContent=q.value.trim()?`${$('contextOverride').value==='auto'?'자동 판별':'직접 선택'}: ${ARC79_DOMAINS[parsed.scene.domain]} · 필요하면 위에서 분야를 바꿔 주세요.`:'질문을 입력하면 분야를 자동으로 판별합니다.';
  $('arc79Ready').textContent=`${SPREADS[selectedSpread].title} · ${SPREADS[selectedSpread].slots.length}장 · ${$('reversals').checked?'정·역방향':'정방향만'} · 직접 선택`;
  $('arc78ChosenSpread').textContent=`현재 배열: ${SPREADS[selectedSpread].title} · ${SPREADS[selectedSpread].slots.length}장`;
  auto.classList.toggle('applied',autoApplied);auto.setAttribute('aria-pressed',String(autoApplied));
  document.querySelectorAll('#spreads [data-spread]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.spread===selectedSpread)));
 }
 q.addEventListener('input',update);$('contextOverride').addEventListener('change',update);$('arc79IntentOverride').addEventListener('change',update);$('reversals').addEventListener('change',update);
 document.querySelectorAll('[data-spread]').forEach(b=>b.addEventListener('click',()=>{autoApplied=false;update();}));
 q.addEventListener('input',()=>{if(autoApplied)$('arc78SpreadHint').textContent='질문을 변경했습니다. 자동 선택 버튼을 다시 누르면 새 질문에 맞춰 추천합니다.';});
 // Capture the question at draw time; later editing creates a new reading instead of
 // silently rewriting the report underneath cards that have already been selected.
 let snapshot=null;
 const form=document.querySelector('.form-shell');
 form.addEventListener('input',()=>{if(snapshot&&ritualPhase!=='idle'){resetRitual();snapshot=null;$('formStatus').textContent='질문이나 설정이 바뀌었습니다. 새로 카드를 선택해 주세요.';}},true);
 form.addEventListener('change',()=>{if(snapshot&&ritualPhase!=='idle'){resetRitual();snapshot=null;}},true);
 $('startReading').addEventListener('click',()=>{snapshot={question:q.value,spread:selectedSpread};});
 // Preserve the initial focus and trap keyboard navigation inside the card dialog.
 let previousFocus=null;
 const oldShow=showCard,oldClose=closeModal;
 showCard=function(id){previousFocus=document.activeElement;oldShow(id);};
 closeModal=function(){oldClose();if(previousFocus?.isConnected)previousFocus.focus();};
 $('modalClose').addEventListener('click',()=>previousFocus?.focus());
 $('modalBackdrop').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=[...$('modalBackdrop').querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(x=>!x.hidden);if(!f.length)return;if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus();}});
 $('toast').setAttribute('role','status');
 document.querySelector('#report .context-tag').textContent='질문과 카드의 근거';
 document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.setAttribute('aria-current',x===b?'page':'false'));}));
 // Advanced experimental model controls belong in the guide, away from the answer.
 const advanced=document.createElement('details');advanced.className='arc79-advanced';advanced.innerHTML='<summary>실험 기능 · 기기 내 언어모델</summary>';
 document.querySelector('#about').appendChild(advanced);
 const artCredit=document.createElement('p');artCredit.className='arc79-art-credit';
 artCredit.innerHTML='카드 그림: Pamela Colman Smith · 1909 RWS “Roses &amp; Lilies” 원본 스캔 · Saskia Jansen 소장본. <a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)" target="_blank" rel="noopener noreferrer">원본 출처 보기</a>. 78장 모두 앱에 내장되어 인터넷 없이도 원본이 표시됩니다.';
 $('deckGrid').before(artCredit);
 ['a33Panel','a34Panel'].forEach(id=>{if($(id))advanced.appendChild($(id));});
 update();
}
// Explicit intent selection is applied to the same planner, including saved records.
const ARC79_AUTO_INTENT=arc79Intent;
let arc79ForcedIntent='auto';
arc79Intent=function(q,s){const r=ARC79_AUTO_INTENT(q,s);return Object.hasOwn(ARC78_INTENT_LABEL,arc79ForcedIntent)?{...r,primary:arc79ForcedIntent,secondary:null,confidence:'manual'}:r;};
const ARC79_RENDER=arcanaV5Render;
arcanaV5Render=function(report){ARC79_RENDER(report);if(!report.arc79)return;let info=$('arc79-indicator');if(!info){info=document.createElement('p');info.id='arc79-indicator';document.querySelector('#report .human-hero').appendChild(info);}info.textContent=`${ARC79_DOMAINS[report.arc79.domain]} · ${ARC78_INTENT_LABEL[report.arc79.intent.primary]} · ${report.arc79.evidence.length}장 해석`;$('arc78-indicator')?.remove();};
const ARC79_REPORT=renderReport;
renderReport=function(){
 ARC79_REPORT();
 if(opened.size!==drawn.length||!drawn.length)return;
 const report=arcanaV5Build();
 // Keep the older expandable layout, but fill it from the same report as the hero.
 $('contextDetail').textContent=`${ARC79_DOMAINS[report.arc79.domain]} · ${ARC78_INTENT_LABEL[report.arc79.intent.primary]}`;
 $('centralAxis').textContent=report.direct;
 $('practicalSteps').innerHTML=report.actions.map(a=>`<li>${htmlSafe(a)}</li>`).join('');
 $('summary').textContent=report.direct;
 $('storyChapters').innerHTML=report.sections.map(s=>`<article class="story-chapter"><h3>${htmlSafe(s.title)}</h3><p>${htmlSafe(s.body)}</p></article>`).join('');
 $('connections').textContent=report.sections.find(s=>s.kind==='relational')?.body||(drawn.length===1?'한 장의 상징을 질문과 연결해 읽습니다.':'각 카드의 관점을 나누어 읽고, 실제 질문과 맞닿는 부분을 살펴보세요.');
 $('actionQuestions').textContent='지금 확인된 사실은 무엇이며, 내가 선택할 수 있는 작은 행동은 무엇인가요?';
 $('cardReads').innerHTML=drawn.map((d,i)=>`<article class="card-reading"><div><img alt="${htmlSafe(orName(d))}" data-card-id="${d.id}" class="${d.rev?'rev':''}" src="${readCard(d).img}" onerror="arcanaImageError(this)"></div><div><div class="mini-title">${htmlSafe(SPREADS[selectedSpread].slots[i][0])}</div><h4>${htmlSafe(orName(d))}</h4><p>${htmlSafe(cardMeaning(d))}</p><p>${htmlSafe(report.sections.find(s=>s.refs.includes(i))?.body||'')}</p></div></article>`).join('');
 $('v10Alignment').textContent='각 카드의 자리와 정·역방향을 함께 읽었습니다. 카드 수는 예측의 정확도를 뜻하지 않습니다.';
};
const ARC79_HISTORY=openHistoryDetail;
openHistoryDetail=function(record){
 ARC79_HISTORY(record);
 if($('historyDetail').hidden||!a22ValidateRecord(record))return;
 const report=withSavedReading(record,()=>arcanaV5Build());
 const evidence=document.querySelector('#historyDetailContent .history-evidence .evidence-content');
 if(evidence)evidence.innerHTML=report.sections.map(s=>`<div class="history-position"><h4>${htmlSafe(s.title)}</h4><p>${htmlSafe(s.body)}</p></div>`).join('');
};
arc79UI();
$('arc79IntentOverride').addEventListener('change',()=>{arc79ForcedIntent=$('arc79IntentOverride').value;});
const ARC79_WITH_SAVED=withSavedReading;
withSavedReading=function(record,callback){const previous=arc79ForcedIntent,log=v11FollowupLog;try{arc79ForcedIntent=record.intentOverride||'auto';v11FollowupLog=[];return ARC79_WITH_SAVED(record,callback);}finally{arc79ForcedIntent=previous;v11FollowupLog=log;}};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),r=records.find(x=>x.id===currentHistoryId);if(r){r.intentOverride=arc79ForcedIntent;r.engineVersion=79;setStoredRecords(records);}});
