/* Question parsing is independent of cards and UI. Unknown is distinct from false.
 * This is a bounded Korean grammar, not a claim of unrestricted language understanding. */
(function(root){
 'use strict';
 const CONTACT=/(?:메시지|메세지|문자|연락|고백|사과|카톡|톡)/g;
 const REPLY=/(?:답장|회신|답변|대답|(?<!정|오|문)답(?=이|을|도|은|는|해|했|하|할))/g;
 const RESULT=/(?:검사\s*결과|채점\s*결과|결과|성적|점수|발표|합격|불합격|탈락|낙방|선발|승인|당선)/g;
 const ASSESS=/(?:시험|면접|평가|심사)/g;
 const ARTIFACT=/(?:원고|과제|제안서|신청서|신청|지원서|서류|작품|답안)/g;
 const OTHER='(?:친구|동료|상대(?:방)?|연인|애인|그\\s*사람|엄마|아빠|부모님|자녀|고객|담당자|회사|팀장|상사|동생|형제)';
 const SUBJECT=new RegExp(`(${OTHER}|저|제|나|내)(가|는|은|이|도)(?!게|라고|라)`,'g');
 const RECIPIENT=new RegExp(`(${OTHER}|저|제|나|내)(에게서|한테서|에게|한테|께)`,'g');
 const EMOTION=/(?:불안|걱정|두려|두렵|무섭|서운|속상|외롭|외로|허탈|자책|조마조마|민망|초조|공허|위축|슬프|지쳤|지쳐|마음이\s*무거|죄책감|긴장|답답|우울)/;
 const normalize=q=>String(q||'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const masked=q=>q.replace(/[“"「『][^”"」』]*[”"」』]/g,s=>' '.repeat(s.length));
 function segments(q){
  const text=masked(q),parts=[];let start=0;
  const rx=/[.!?。！？,;]+|(?:하지만|그런데|반면에|그러나)\s+|((?:했|았|었)(?:는데|지만|고|더니))\s*/g;let m;
  const add=end=>{let a=start,b=end;while(a<b&&/\s/.test(text[a]))a++;while(b>a&&/\s/.test(text[b-1]))b--;if(b>a)parts.push({text:text.slice(a,b),start:a,end:b,source:q.slice(a,b)});};
  while((m=rx.exec(text))){add(m.index+(m[1]?.length||0));start=rx.lastIndex;}add(text.length);return parts;
 }
 function actorAt(text,index){
  let actor='unspecified',evidence='';
  for(const m of text.slice(0,index).matchAll(SUBJECT)){actor=/^(?:저|제|나|내)$/.test(m[1])?'self':'other';evidence=m[0];}
  if(/서로/.test(text.slice(0,index)))return {actor:'mutual',evidence:'서로'};
  return {actor,evidence};
 }
 function recipientAt(text,index){
  const matches=[...text.slice(0,index).matchAll(RECIPIENT)];const m=matches.at(-1);
  if(!m)return null;
  return {actor:/^(?:저|제|나|내)$/.test(m[1])?'self':'other',incoming:/서$/.test(m[2]),evidence:m[0]};
 }
 function modality(text){
  if(/(?:면|다면|다면야|경우|가정|라고\s*가정|했으면|았으면|었으면|다면)\b|(?:했|됐|받았|보냈|왔)(?:으면|다면)|(?:했|받았|보냈|왔|제출했|접수됐)을\s*때/.test(text))return 'conditional';
  if(/(?:까\s*봐|을까\s*봐|다고\s*(?:생각|추측|상상)|일지도|인\s*것\s*같|했을까|왔을까|받았을까|보냈을까|꿈에서)|(?:했는지|보냈는지|왔는지|받았는지).{0,8}(?:모르|모릅|알지\s*못)/.test(text))return 'uncertain';
  if(/(?:다는|라는)\s*말|전해\s*들|다고\s*(?:했|하|해|말)/.test(text))return 'reported';
  const verbalNegative=/(?:^|\s|[은는을를이가도])(?:안|못)\s*(?:했|하|해|보냈|보내|전했|전하|받|왔|오|나왔|나오|읽|확인|제출|공개)|(?:하지|보내지|전하지|받지|오지|나오지|읽지|확인하지|제출하지|공개되지)\s*않/.test(text);
  const absentState=!completed(text)&&/(?:없|모르|모릅|모른|미정|미공개|미발표)/.test(text);
  if(verbalNegative||absentState)return 'negated';
  if(/(?:하려|할\s*예정|보낼\s*예정|받을\s*예정|계획|앞두|예정)|(?:할|보낼|전할|받을|올|나올|제출할)(?:까|지|까요|게|\s*예정)/.test(text))return 'planned';
  return 'asserted';
 }
 const completed=text=>/(?:했|해\s*줬|해\s*주었|왔|받았|받아서|보냈|전했|읽었|도착했|나왔|확정|통보|확인했|끝났|끝낸|끝냈|마쳤|치렀|쳤|봤|완료|제출했|투고했|접수됐)/.test(text);
 function eventsFrom(parts){
  const events=[];
  const add=(part,kind,noun,start,end,details={})=>{
   const text=part.text.slice(start,end),who=actorAt(part.text,start),recipient=recipientAt(part.text,start);
   const time=[...part.text.slice(0,start).matchAll(/지난|이전|저번|작년|이번|다음|재도전/g)].at(-1)?.[0];
   events.push({kind,object:noun,actor:who.actor,actorEvidence:who.evidence,recipient,timeScope:time===undefined?'unspecified':/지난|이전|저번|작년/.test(time)?'past':/다음|재도전/.test(time)?'next':'current',status:modality(text),completed:completed(text),text:part.source.slice(start,end),start:part.start+start,end:part.start+end,...details});
  };
  for(const part of parts){
   const nouns=[];
   for(const [kind,rx]of [['contact',CONTACT],['reply',REPLY],['result',RESULT],['assessment',ASSESS],['submission',ARTIFACT]])for(const m of part.text.matchAll(rx))nouns.push({kind,noun:m[0],index:m.index,end:m.index+m[0].length});
   nouns.sort((a,b)=>a.index-b.index||b.noun.length-a.noun.length);
   const unique=nouns.filter((n,i)=>!nouns.slice(0,i).some(p=>n.index>=p.index&&n.end<=p.end));
   for(let i=0;i<unique.length;i++){
    const n=unique[i],next=unique[i+1],end=Math.min(next?.index??part.text.length,n.end+45),tail=part.text.slice(n.end,end);
    const predicate=tail.match(/보냈|보내|보낼|전했|전하|전할|받았|받은|받|왔|오지|오|올|도착|읽|했|하|할|해/);
    if(n.kind==='contact'&&predicate)add(part,'contact',n.noun,n.index,end,{direction:/^(?:받|왔|도착)/.test(predicate[0])?'receive':'send',predicate:predicate[0]});
    if(n.kind==='reply'&&(predicate||/없|기다|못|않/.test(tail)))add(part,'reply',n.noun,n.index,end,{direction:/^(?:받|왔|도착|읽)/.test(predicate?.[0]||'')?'receive':'make',predicate:predicate?.[0]||null,accepting:/^(?:받|읽)/.test(predicate?.[0]||''),waiting:/^(?:[은는이가을를도]|\s)*(?:(?:아직|전혀|계속|줄곧|한참)\s*)*(?:기다|없|안\s*왔|못\s*받|오지\s*않)/.test(tail),benefactive:/해\s*(?:줬|주었)/.test(tail)});
    if(n.kind==='result'){
     const positive=/(?:합격|선발|당선|승인)/.test(n.noun)&&!/불합격/.test(n.noun),negative=/(?:불합격|탈락|낙방)/.test(n.noun);
     const known=/나왔|확정|통보|확인했|받았|했|됐|되었|나온/.test(tail),pending=/기다|아직|공개\s*전|발표\s*전|확인\s*전|미공개|미발표|모르|모릅|모른|안\s*나|못\s*받|나오지/.test(tail);
     if(known||pending||/(?:전이|전이에|전입니다)$/.test(tail.trim()))add(part,'result',n.noun,n.index,end,{known,pending:pending||/(?:전이|전이에|전입니다)$/.test(tail.trim()),outcome:negative?'failed':positive?'passed':null});
    }
    if(n.kind==='assessment'&&/끝|마쳤|치렀|쳤|봤|완료|앞두|예정/.test(tail))add(part,'assessment',n.noun,n.index,end,{upcoming:/앞두|예정/.test(tail)&&!/예정.{0,5}(?:아니|취소)/.test(tail)});
    if(n.kind==='submission'&&/제출|투고|보냈|보내|접수/.test(tail))add(part,'submission',n.noun,n.index,end);
   }
   // Verb-only replies retain the speaker; benefactive "답해 줬다" implies an incoming reply unless self is explicit.
   for(const m of part.text.matchAll(/(?:답해\s*(?:줬|주었)|답했|대답했|회신했|답장했|사과했)/g)){
    if(events.some(e=>e.start<=part.start+m.index&&e.end>=part.start+m.index+m[0].length))continue;
    add(part,m[0].startsWith('사과')?'contact':'reply',m[0].startsWith('사과')?'사과':'답',m.index,Math.min(part.text.length,m.index+20),{direction:'make',benefactive:/줬|주었/.test(m[0])});
   }
   // A following clause may omit the object: "답장을 보냈다지만 저는 받은 내용이 없어요".
   const priorReply=events.findLast(e=>e.kind==='reply'&&e.end<=part.start);
   const receipt=part.text.match(/받은\s*(?:것|내용|게)(?:은|는|이|가|도)?\s*없|못\s*받았|받지\s*않았/);
   if(priorReply&&receipt&&!unique.some(n=>n.kind==='reply'))add(part,'reply',priorReply.object,receipt.index,part.text.length,{direction:'receive',accepting:true,waiting:true,inferredObject:true});
   const priorResult=events.findLast(e=>e.kind==='result'&&e.end<=part.start);
   const unverified=/^(?:(?:저는|제가|나는|내가)\s*)?(?:아직\s*)?(?:(?:공식\s*)?(?:내용|결과)(?:은|는|을|를)?\s*)?(?:확인하지\s*않|확인\s*전)/.test(part.text);
   if(priorResult&&unverified&&!unique.some(n=>n.kind==='result'))add(part,'result',priorResult.object,0,part.text.length,{known:false,pending:true,outcome:null,inferredObject:true});
  }
  return events;
 }
 function summarize(events,requests,q){
  const state={sent:null,received:null,resultKnown:null,resultPublished:null,outcome:null,outcomeScope:null,assessmentCompleted:null,assessmentUpcoming:false,submitted:null,replyWaiting:false,resultWaiting:false};
  const relevant=e=>!['conditional','uncertain','planned','reported'].includes(e.status);
  for(const e of events){
   if(e.kind==='assessment'&&e.upcoming&&!e.completed&&!['conditional','uncertain','reported'].includes(e.status))state.assessmentUpcoming=true;
   if(!relevant(e))continue;
   const done=e.completed&&e.status==='asserted',missing=e.status==='negated';
   if(e.kind==='contact'){
    if(e.actor==='mutual'&&done){state.sent=true;state.received=true;}
    else if(e.direction==='send'&&e.actor!=='other'&&(done||missing))state.sent=done;
    else if(e.direction==='receive'&&e.actor!=='other'&&(done||missing))state.received=done;
    else if(e.actor==='other'&&done&&e.direction==='make')state.received=true;
   }
   if(e.kind==='reply'){
    const mine=e.actor==='self',toOther=e.recipient?.actor==='other'&&!e.recipient.incoming;
    const incoming=e.direction==='receive'&&(e.accepting||!toOther)&&e.actor!=='other'||e.direction==='make'&&!mine&&(e.actor==='other'||e.benefactive);
    if(mine&&e.direction==='make'&&done)state.sent=true;
    if(incoming&&done){state.received=true;state.replyWaiting=false;}
    else if((incoming||e.actor!=='self')&&(missing||e.waiting)){state.received=false;state.replyWaiting=true;}
   }
   if(e.kind==='result'){
    if(done&&e.known){state.resultKnown=true;state.resultPublished=true;state.outcome=e.outcome;state.outcomeScope=e.timeScope;state.resultWaiting=false;}
    else if(e.pending||missing){state.resultKnown=false;state.resultWaiting=true;}
   }
   if(e.kind==='assessment'&&(done||missing))state.assessmentCompleted=done;
   if(e.kind==='submission'&&(done||missing))state.submitted=done;
  }
  // Prior completed evaluations do not resolve a request about a later attempt.
  const futureAttempt=requests.some(r=>r.kind==='forecast'&&((/다음|재도전/.test(r.text)||state.outcomeScope==='past'&&/다음|재도전/.test(q))&&state.outcomeScope!=='next'||state.outcomeScope==='past'&&/이번/.test(r.text)));
  if(state.resultKnown&&futureAttempt){state.previousOutcome=state.outcome;state.resultKnown=null;state.outcome=null;state.assessmentCompleted=null;}
  state.waiting=state.received!==true&&state.replyWaiting||!state.assessmentUpcoming&&state.resultKnown!==true&&(state.resultWaiting||state.assessmentCompleted===true);
  return state;
 }
 function alternativeCount(text){return [...text.matchAll(/([가-힣]+)지(?=\s|,|$)/g)].filter(m=>(m[1].charCodeAt(m[1].length-1)-0xac00)%28===8).length;}
 function goalFor(text,kind){
  if(kind==='emotion')return 'cope';
  if(kind!=='action')return kind;
  if(/마음|감정|불안|걱정/.test(text)&&/다루|다룰|돌보|추스|관리|가라앉|달래|다스리|다스릴/.test(text))return 'cope';
  if(/(?:역할|담당|몫|일).{0,18}(?:나누|나눌|분담)|조율|협의|합의/.test(text))return 'coordinate';
  if(/우선순위|마감|업무량|감당할\s*(?:양|범위)|줄이|(?:업무|일정|분량|범위).{0,12}조정/.test(text))return 'prioritize';
  if(/수정.{0,12}(?:멈|끝)|(?:수정|작업|단계).{0,18}(?:마치|마쳐|끝내|끝낼|멈)|완성\s*기준|어디서.{0,12}멈|마칠|끝낼/.test(text))return 'finish';
  if(/보완|개선|바꾸|고치|고칠|손볼/.test(text))return 'improve';
  if(/(?:말할|말하|전할|전하|설명|이야기|대화|꺼낼|꺼내)/.test(text))return 'communicate';
  if(/준비|앞두|시작/.test(text))return 'prepare';
  if(/결정(?:한)?\s*(?:뒤|후)|선택(?:한)?\s*(?:뒤|후)|첫\s*(?:주|날|행동|단계)/.test(text))return 'implement';
  return 'action';
 }
 function requestsFrom(parts,q){
  const requests=[];const emit=(kind,part,goal)=>{if(!requests.some(r=>r.kind===kind&&r.goal===(goal||goalFor(part.text,kind))))requests.push({kind,goal:goal||goalFor(part.text,kind),text:part.source,start:part.start,end:part.end});};
  for(const original of parts){
   const correction=original.text.match(/(?:대신|말고|그보다(?:는)?|아니라|(?:이유|원인|예측|전망|비교)보다)\s*|(?:는지|인지|을지|할지)보다(?:는)?\s+/);
   const cut=correction?correction.index+correction[0].length:0,part={...original,text:original.text.slice(cut),source:original.source.slice(cut),start:original.start+cut};
   const t=part.text,explicitCompare=/비교(?:해(?:\s*주|줘|보고|볼)|하고(?:\s*싶|$)|할(?:까요|지)|를\s*(?:부탁|원|해))|(?:어떻게|어떤\s*기준).{0,20}비교/.test(t),ask=/(?:까|나요|가요|궁금|싶|알려|조언|봐\s*주|보아\s*주|말해\s*주|주세요|무엇|뭘|어떻게|어디|왜|언제|어떤)/.test(t)||explicitCompare||alternativeCount(t)>=2&&/고민|선택|결정/.test(t);
   if(!ask)continue;
   if(correction&&requests.length)requests.length=0;
   const cause=/(?:왜|어째서|까닭|원인)/.test(t)||/(?:이유|배경)/.test(t)&&!/이유로|배경으로|이유를\s*(?:말|전|설명)|돌아보|성찰/.test(t);
   const compare=explicitCompare||/두\s*(?:안|선택|경로).{0,20}차이|어느\s*쪽/.test(t)||alternativeCount(t)>=2;
   const reflective=/성찰|돌아보|살펴보|어떤\s*관점|배운\s*것|배울\s*수/.test(t)&&!/방법|어떻게\s*(?:말|설명|준비)/.test(t);
   const volitional=[...t.matchAll(/([가-힣]+)(?:까요|까|지)(?=\s|$)/g)].some(m=>(m[1].charCodeAt(m[1].length-1)-0xac00)%28===8);
   const howTo=/(?:어떻게|어떡|무엇을|뭘|뭐부터|어디서|어디부터)/.test(t)&&volitional&&!/어떻게\s*(?:될|흘러|바뀔)|어떤\s*(?:결과|흐름|마음)/.test(t);
   const action=howTo||/(?:어떻게|어떡|무엇|뭘|뭐부터|어디부터|어디서|어떤|무슨\s*말|어디까지).{0,60}(?:할|해야|좋|하나|쓸|쓰면|정할|고를|볼|찾을|손볼|잡을|설명|말할|필요|줄일|편집|정리|꺼내|바꿀|멈|고려|다룰|다스릴|세울|받아들)|어떤\s*(?:태도|행동|방법|준비|기준).{0,20}(?:도움|필요|좋|적절)|(?:할\s*일|행동|태도|방법|준비|기준).{0,16}(?:무엇|뭘|어떤|궁금)|(?:방법|준비할\s*일|할\s*행동|첫\s*행동|조언)|[가-힣]도\s*(?:될|괜찮)|(?:연락|고백|지원|이직|퇴사|신청|시작|보낼|쉴|갈)(?:할까|까요)/.test(t);
   const emotionalStatement=EMOTION.test(t)&&(/(?:두렵|걱정|불안|무섭|자책|초조).{0,10}(?:습니다|어요|에요|돼요|됩니다)$/.test(t)||/까\s*(?:봐)?\s*(?:걱정|불안|두려|무섭)/.test(t)&&!/궁금|가능성|전망/.test(t));
   const development=/오래갈까|이어질까|덜해질까|나아질까|좋아질까|편해질까|회복될까/.test(t);
   const forecast=(/언제|가능성|전망|(?:될|올|일|있을|이어질|좋아질|회복될|합격할|붙을|풀릴|생길)(?:까|지|까요)|어떨까|어떤\s*마음/.test(t)||development)&&!emotionalStatement&&!/까\s*봐|하지\s*말|예측.{0,8}(?:않|말)/.test(t);
   if(cause)emit('cause',part);
   else if(compare){
    const options=alternativeCount(t)>=2||/A.{0,40}B|(?:두|둘)\s*(?:가지|개|안|선택|경로|상품)|어느\s*쪽/.test(masked(q));
    if(/어떻게.{0,24}비교/.test(t)&&!options)emit('action',part,'compare-method');
    else emit('compare',part);
    if(action&&/(?:비교(?:해\s*주고|하고)|비교와|그리고).{0,50}(?:방법|행동|말할|전할)|(?:방법|행동)도/.test(t))emit('action',part);
   }
   else if(reflective&&!/준비할\s*일|첫\s*행동/.test(t))emit('open',part);
   else if(/어떤\s*흐름/.test(t)&&!forecast&&!action&&!/앞으로|미래|다음/.test(t))emit('open',part);
   else if((development||/어떤\s*(?:결과|미래|흐름|가능성|마음)|어떻게\s*(?:될|흘러)|결과.{0,8}기대/.test(t))&&!emotionalStatement&&!/(?:설명|물어|준비|바꿀|해야)/.test(t))emit('forecast',part);
   else if(action){
    const parallel=t.match(/(?:일|행동|준비|기준|방법)과\s*/);
    if(parallel&&/각각|함께|동시에/.test(t)){
     const end=parallel.index+parallel[0].indexOf('과'),start=parallel.index+parallel[0].length;
     emit('action',{...part,text:part.text.slice(0,end),source:part.source.slice(0,end),end:part.start+end});
     const right={...part,text:part.text.slice(start),source:part.source.slice(start),start:part.start+start};
     if(EMOTION.test(right.text)&&/다룰|다루|돌볼|돌보|추스/.test(right.text))emit('emotion',right,'cope');else emit('action',right);
    }
    else emit('action',part);
   }
   else if(forecast)emit('forecast',part);
   if(/각각|함께|동시에|그리고|방법도/.test(t)&&EMOTION.test(t)&&/다룰|다루|돌볼|돌보|추스/.test(t))emit('emotion',part,'cope');
  }
  if(!requests.length){const last=parts.at(-1);if(last&&EMOTION.test(last.text))emit('emotion',last);}
  // A final explicit request supersedes earlier background questions unless coordination is explicit.
  if(requests.length>1&&!/(?:그리고|각각|함께|동시에|방법도|행동도|비교(?:해\s*주고|하고)|알려\s*주고)/.test(masked(q))){const last=requests.at(-1);return [last];}
  return requests;
 }
 function parse(input){
  const question=normalize(input),parts=segments(question),requests=requestsFrom(parts,question),events=eventsFrom(parts),state=summarize(events,requests,question);
  const generic=question.replace(/[\s.!?。！？,]/g,'');
  const missingChoices=/(?:두\s*(?:가지|개)|둘)\s*중/.test(masked(question))&&/정해|고르|골라|선택|비교/.test(masked(question))&&!/A.{0,80}B|하나는.{1,80}(?:다른|하나는)|(?:첫째|첫\s*번째).{1,80}(?:둘째|두\s*번째)/i.test(masked(question));
  const needsContext=missingChoices||!!generic&&/^(?:(?:저는|제가|나는|내가|지금|이제|그|이|저|일|상황|사람|것|거|앞으로|어떻게|뭘|무엇을|할까요|해야할까요|해야하나요|하면좋을까요|해야|할지|모르겠어요|모르겠습니다|될까요|잘|풀릴까요|봐주세요|보아주세요|알려주세요|좀|요|은|는|이|가|을|를|과|와|하고|에|대해|입니다|이에요|예요))+$/u.test(generic)&&!/오늘|하루|전반|전체/.test(question);
  const romantic=/(?:연애|연인|애인|짝사랑|고백|호감|좋아하는\s*(?:사람|분|이)|좋아하.{0,6}사람)/.test(masked(question));
  return {version:82,question,evidenceQuestion:masked(question),requests,events,state,needsContext,clarification:needsContext?(missingChoices?'비교할 선택지의 내용이 필요합니다. 각 선택지와 중요하게 보는 기준을 한두 문장으로 알려 주세요.':'어떤 일에 관한 질문인가요? 지금 상황과 알고 싶은 점을 한두 문장으로 알려 주세요.'):null,entities:{romantic},unknowns:[...(state.sent===null?['outgoing-contact']:[]),...(state.received===null?['received-reply']:[]),...(state.resultKnown===null?['result']:[])]};
 }
 const api=Object.freeze({parse});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_QUESTION_MODEL=api;
})(typeof globalThis==='object'?globalThis:this);
