/* Requested predicate + object + output. Literal spans are evidence, not facts.
 * This bounded local grammar does not infer missing intentions or outcomes. */
(function(root){'use strict';
 const common=typeof module==='object'&&module.exports;
 const morph=common?require('./korean-morphology.js'):root.ARCANA_KOREAN_MORPHOLOGY;
 const qt=common?require('./question-text.js'):root.ARCANA_QUESTION_TEXT;
 const set=s=>new Set(s.split(' '));
 const generic=set('것 거 일 상황 사람 내용 부분 점 방향 방법 방식 순서 단계 기준 이유 원인 무엇 뭐 어디 언제 어떤 어느 지금 현재 이제 앞 앞으로 선택 선택지 대안 가지 쪽 수 필요 도움 질문 준비 정리 확인 검토 점검 진행 고려 결정 해결 생각');
 const documents=set('문서 자료 서류 안내문 안내서 계약서 양식 서식 문구 문장 문단 설명문 보고서 원고 목차 구조 초안 대본 목록 표 장부 책자 공지문 규칙 회칙');
 const observations=set('기록 일지 노트 관찰 관측 데이터 메모 기록장');
 const requirements=set('조건 요건 자격 규정 절차 준비물 필수 서류 기한 일정 비용 신청 예약');
 const evidence=set('근거 사실 정보 자료 관찰 관측 예상 기대 추측 짐작 해석 판단 원인 내용');
 const messages=set('설명 말 말씀 표현 의견 문자 메시지 답변 답장 회신 대답 편지 이유 요점');
 const creative=set('영상 사진 음악 노래 그림 작품 창작 연주');
 const work=set('일 업무 역할 몫 책임 작업 담당 범위 단계');
 const verbs={
  inspect:set('점검 검토 살피 살펴보 확인 대조 구별 구분 조사'),
  reflect:set('돌아보 돌이켜보 성찰'),
  communicate:set('설명 말하 말 전하 전달 표현 이야기 알리 알려주 대화'),
  inquire:set('묻 물어보 여쭈 여쭤 여쭤보 질문'),
  improve:set('고치 수정 다듬 편집 개선 보완 바꾸 손보 줄이 덜어내'),
  coordinate:set('나누 분담 조율 협의 합의'),
  compare:set('비교 견주'),
  cope:set('다루 다스리 돌보 달래 추스르 관리'),
  finish:set('마치 끝내 멈추 마무리'),
  implement:set('실행 착수'),
  prepare:set('준비 시작')
 };
 const nouns=a=>a.words.flatMap(word=>word.tokens.filter(t=>/^(?:NNG|NNP|NP|SL|SH)$/.test(t.pos)).map(t=>({term:t.text,word})));
 const roots=w=>w.tokens.filter(t=>t.pos==='VV'||t.pos==='VA'||t.pos==='XSV'||w.tokens.some(t=>t.pos==='XSV')&&t.pos==='NNG').map(t=>t.text);
 const asked=t=>/어떻게|어떡|어떤|어느|무엇|뭘|뭐|주세요|주십시오|줄래|까요|할까|해줘|싶어요|싶습니다|궁금해요|궁금합니다/.test(t);
 const explicitMode=t=>/(?:주세요|주십시오|해줘|싶어요|싶습니다|궁금해요|궁금합니다)[.!?。！？\s]*$/.test(t);
 const modality=t=>/가정|만약|(?:다면|경우)|꿈에서/.test(t)?'conditional':'requested';
 function operation(word,a){
  const terms=roots(word),all=nouns(a).map(n=>n.term);
  for(const [op,values]of Object.entries(verbs))if(terms.some(t=>values.has(t))){
   if(op==='cope'&&!a.tokens.some(t=>/마음|감정|불안|걱정|긴장|분노|슬픔|답답|슬프|두렵|속상|외롭|자책/.test(t.text)))continue;
   if(op==='coordinate'&&terms.includes('나누')&&!all.some(t=>work.has(t))){
    if(all.some(t=>evidence.has(t)))return all.includes('기대')?'reflect':'inspect';
    continue;
   }
   // Shortening work/time is prioritization, not editing a message.
   if(op==='improve'&&terms.includes('줄이')&&all.some(t=>/업무|일정|분량|시간/.test(t))&&!all.some(t=>documents.has(t)||messages.has(t)))return null;
   return op;
  }
  return null;
 }
 function predicate(a){
  const candidates=a.words.map((word,index)=>({word,index,op:operation(word,a)})).filter(x=>x.op);
  // ㄷ-irregular future asking may be tagged as the noun 물 + object particle.
  // A directly following question-content head resolves that local ambiguity.
  for(let index=0;index<a.words.length-1;index++){
   const word=a.words[index],next=a.words[index+1];
   if(/^물을$/.test(word.text)&&next.tokens.some(t=>t.pos==='NNG'&&/^(?:사항|점|내용|질문)$/.test(t.text))&&!next.tokens.some(t=>t.pos==='JKB'))candidates.push({word,index,op:'inquire',nominalInquiry:true});
  }
  candidates.sort((a,b)=>a.index-b.index);
  const finite=candidates.filter(x=>!x.word.tokens.some(t=>t.pos==='ETM'));
  let found=finite.at(-1);
  const wrapper=found&&/^(?:알리|알려주|말|설명)$/.test(roots(found.word)[0]||'')&&/주세요|주십시오|해줘/.test(a.text.slice(found.word.start));
  if(!found||wrapper){
   const nominal=candidates.findLast(x=>(x.nominalInquiry||x.word.tokens.some(t=>t.pos==='ETM'))&&a.words.slice(x.index+1,x.index+4).some(w=>w.tokens.some(t=>t.pos==='NNG'&&/^(?:방법|기준|순서|일|질문|항목|사항|점|부분|내용|것)$/.test(t.text))));
   if(nominal)found={...nominal,viaNominal:true};else if(wrapper&&!/어떻게|어떤\s*방법|어느\s*순서/.test(a.text))found=null;
  }
  if(!found)return null;
  if(!found.viaNominal){
   const later=a.words.slice(found.index+1).findLast(w=>!w.tokens.some(t=>t.pos==='ETM')&&w.tokens.some(t=>/^(?:VV|VA|XSV|XSA)$/.test(t.pos))&&!w.tokens.every(t=>!['VV','VA','XSV','XSA','NNG'].includes(t.pos)||set('하 되 있 없 보 않 주 좋 어떻 진행 정리').has(t.text)));
   if(later&&!operation(later,a))return null;
  }
  const tail=a.words.slice(found.index,found.index+4).map(w=>w.text).join(' ');
  if(/(?:하지|보지|기지|추지|내지|루지|누지|피지|지)\s*(?:않|말)/.test(tail))return null;
  return found;
 }
 function previous(question,start){
  const prefix=question.slice(0,start),text=qt.sentences(prefix).at(-1)||'';
  return text?{text,start:prefix.lastIndexOf(text),end:prefix.lastIndexOf(text)+text.length}:null;
 }
 function target(question,task,a,op,predicateStart=Infinity){
  const objects=parsed=>nouns(parsed).filter(n=>!n.word.tokens.some(t=>/^(?:VV|VA|XSV|XSA)$/.test(t.pos)));
  let source={text:task.text,start:task.start||0,end:task.end??(task.start||0)+task.text.length},analysis=a,terms=objects(a),inherited=null;
  const active=terms.filter(n=>!generic.has(n.term)&&!n.word.tokens.some(t=>/^(?:VV|VA|XSV|XSA)$/.test(t.pos))),explicit=active.some(n=>n.word.tokens.some(t=>t.pos==='JKO'||t.pos==='JKG'||t.pos==='JKB'&&/^(?:에|에서|으로|로)$/.test(t.text)));
  const anaphoric=/^(?:둘(?:을|의|은|다|\s)|두\s*내용|그\s*내용|이\s*내용|그것|이것|이를|그\s*자료|이\s*자료)/.test(task.text.trim());
  const known=terms.some(n=>documents.has(n.term)||observations.has(n.term)||messages.has(n.term)||requirements.has(n.term));
  const separateObject=active.some(n=>!set('자료 내용 문서 그것 이것 그거 이거 그걸 이를').has(n.term)&&n.word.tokens.some(t=>t.pos==='JKO'||t.pos==='JKG'||t.pos==='JKB'&&/^(?:에|에서|으로|로)$/.test(t.text)));
  const relationalScope=op==='coordinate'&&active.every(n=>set('범위 부분 정도 저 나 제 내').has(n.term));
  if((anaphoric&&!separateObject||!explicit&&!known||relationalScope)&&!/별개|별도로|무관|다른\s*(?:일|주제|문제)/.test(task.text)){
   const prior=previous(question,task.start||0),parsed=prior&&morph.analyze(qt.mask(prior.text));
   if(parsed&&(objects(parsed).some(n=>documents.has(n.term)||observations.has(n.term)||evidence.has(n.term)||op==='coordinate'&&set('약속 규칙 대화 관계').has(n.term))||anaphoric&&parsed.tokens.some(t=>evidence.has(t.text)))){source=prior;analysis=parsed;terms=objects(parsed);inherited=anaphoric?'anaphoric-content':'omitted-recent-object';}
  }
  const all=new Set(terms.map(n=>n.term)),has=s=>terms.some(n=>s.has(n.term));
  let primary=terms.filter(n=>n.word.tokens.some(t=>t.pos==='JKO')&&(inherited||n.word.start<predicateStart)&&(!generic.has(n.term)||messages.has(n.term))).at(-1);
  const scopedTopic=terms.findLast(n=>n.word.start>(primary?.word.end??-1)&&(inherited||n.word.start<predicateStart)&&n.word.tokens.some(t=>t.pos==='JKB'&&t.text==='에서')&&[documents,observations,requirements,messages,creative,set('약 용량 주식 코인 대출')].some(s=>s.has(n.term)));
  if(scopedTopic)primary=scopedTopic;
  const clinicalObject=primary&&set('약 약물 용량 복용량 증상 통증 치료 수술').has(primary.term);
  const assetObject=primary&&set('주식 코인 대출 예금 연금 보험 투자금').has(primary.term);
  const primaryKind=primary&&([[observations,'observation'],[documents,'document'],[messages,'message'],[creative,'creative'],[requirements,'requirements']].find(([terms])=>terms.has(primary.term))?.[1]);
  const modifier=primary&&analysis.words.findLast(w=>w.end<=primary.word.start);
  const requiredObject=primary&&set('자료 서류 준비물').has(primary.term)&&modifier?.tokens.some(t=>t.pos==='ETM')&&modifier.tokens.some(t=>/^(?:필요|준비|제출)$/.test(t.text));
  const mixed=analysis.tokens.some(t=>/^(?:기대|추측|짐작|해석|원인)$/.test(t.text))&&analysis.tokens.some(t=>/^(?:사실|관찰|관측|정보|자료|내용)$/.test(t.text));
  let kind='unspecified';
  if(clinicalObject)kind='clinical';else if(assetObject)kind='asset';else if(op==='compare')kind='comparison';
  else if(mixed&&['inspect','reflect'].includes(op)||op==='inspect'&&has(evidence)&&/구별|구분|가진|빠진/.test(task.text))kind='evidence';
  else if(op==='coordinate'&&/약속|규칙|대화|토론|관계/.test(source.text))kind='interaction';
  else if(['inspect','verify'].includes(op)&&requiredObject||op==='verify'&&(has(requirements)||task.output==='항목'))kind='requirements';
  else if(op==='reflect'&&primary&&set('태도 마음 감정 기준 경험 역할 가치 이유 동기 배움').has(primary.term))kind='experience';
  else if(primaryKind)kind=primaryKind;
  else if(op==='inspect'&&has(requirements)&&!has(observations))kind='requirements';
  else if(has(observations))kind='observation';
  else if(has(documents)&&!terms.some(n=>n.term==='설명'&&all.has('증상')))kind='document';
  else if(has(messages)||op==='communicate'&&all.has('선택'))kind='message';
  else if(has(creative))kind='creative';
  else if(op==='coordinate'&&has(work))kind='responsibility';
  else if(['reflect','cope'].includes(op))kind='experience';
  const relevant={evidence,observation:observations,document:documents,requirements,message:messages,creative,responsibility:work,interaction:set('약속 규칙 토론 대화 관계')};
  const n=['clinical','asset'].includes(kind)||requiredObject?primary:terms.findLast(n=>relevant[kind]?.has(n.term))||primary||terms.findLast(n=>!generic.has(n.term));
  const evidenceSpan=n?{start:source.start+n.word.start,end:source.start+n.word.end,text:question.slice(source.start+n.word.start,source.start+n.word.end)}:null;
  const prefix=qt.mask(source.text).slice(0,n?.word.start??source.text.length),localOwner=prefix.split(/보다|말고|아니라/).at(-1);
  const owner=/(?:^|\s)(?:제|내|저의|나의)\s/.test(localOwner)?'self':/(?:그의|상대의|다른\s*사람의)/.test(localOwner)?'other':'unspecified';
  const carrierWord=terms.findLast(t=>documents.has(t.term)&&t.word.tokens.some(p=>p.pos==='JKB'&&p.text==='에서')&&t.word.start<(n?.word.start??Infinity));
  const carrier=carrierWord?{kind:'document',head:carrierWord.term,evidence:{start:source.start+carrierWord.word.start,end:source.start+carrierWord.word.end,text:question.slice(source.start+carrierWord.word.start,source.start+carrierWord.word.end)}}:null;
  const subtype=kind==='requirements'?(terms.some(n=>/^(?:자격|요건|신청|대상)$/.test(n.term))?'eligibility':all.has('서류')?'documents':'conditions'):kind==='evidence'?(mixed&&!/(?:가진|빠진|없는|미확인)\s*(?:자료|정보)/.test(source.text)?'interpretation':'availability'):null;
  return {kind,subtype,head:n?.term||null,evidence:evidenceSpan,carrier,owner,...(inherited?{inherited}:{}),modality:modality(source.text)};
 }
 function describe(question,task){
  const text=qt.mask(task.text||''),a=morph.analyze(text);if(!a||!asked(text)&&!task.coordinated&&!task.output&&!['action','emotion','open'].includes(task.kind))return null;
  const p=predicate(a);let op=p?.op;
  if(task.output==='질문')op='inquire';
  if(task.output==='항목'&&/조건|요건|자격|규정|비용/.test(question.slice(Math.max(0,(task.start||0)-120),task.end)))op='verify';
  if(task.goal==='compare-method')op='compare';
  if(task.frame?.informationGoal&&['prepare','inspect','inquire'].includes(op))op=task.frame.operation;
  if(!op)return null;
  if(op==='inquire'&&/묻지\s*않|물어보지\s*않|질문하지\s*않/.test(text))return null;
  // Purpose/readiness requests already have a separately identified main goal.
  if(['finish','implement','prioritize','prepare','inquire'].includes(task.goal)&&['inspect','communicate'].includes(op)&&!/어떻게\s*(?:설명|말|전|알려)/.test(text))return null;
  const object=target(question,task,a,op,p?.word.start);
  if(p?.word.tokens.some(t=>t.pos==='EC'&&/면|려|고자/.test(t.text))&&object.kind==='unspecified'&&!task.frame?.informationGoal&&!task.output)return null;
  if(op==='coordinate'&&object.kind==='unspecified')return null;
  if(op==='improve'&&roots(p?.word||{tokens:[]}).includes('줄이')&&!['message','document','creative'].includes(object.kind))return null;
  if(op==='inspect'&&object.kind==='requirements')op='verify';
  const predicateSpan=p?{start:(task.start||0)+p.word.start,end:(task.start||0)+p.word.end,text:question.slice((task.start||0)+p.word.start,(task.start||0)+p.word.end)}:null;
  return {version:90,operation:op,target:object,predicate:predicateSpan,requestedOutput:task.output||null,scope:{start:task.start||0,end:task.end??(task.start||0)+task.text.length},reason:task.output?'coordinated-nominal-output':p?.viaNominal?'nominal-work-head':'predicate-and-object'};
 }
 function outputs(part,question){
  if(!asked(part.text))return [];
  const a=morph.analyze(part.text);if(!a)return [];
  const words=a.words,coordinators=words.filter(w=>w.tokens.some(t=>t.pos==='EC'&&(t.text==='고'||/^(?:며|으며)$/.test(t.text)&&/각각|함께|동시에/.test(part.text)))&&operation(w,a)&&!/^\s*(?:있|싶)/.test(part.text.slice(w.end)));
  const pieces=[];
  if(coordinators.length){
   let start=0;for(const end of [...coordinators.map(w=>w.end),part.text.length]){while(start<end&&/\s/.test(part.text[start]))start++;if(end>start)pieces.push({...part,start:part.start+start,end:part.start+end,text:question.slice(part.start+start,part.start+end),coordinated:true,sharedContext:part.text.slice(0,start)});start=end;}
   if(pieces.length>1&&pieces.every(p=>describe(question,p)))return pieces;
  }
  const conjunct=w=>w.tokens.some(t=>t.pos==='JC'||t.pos==='JKB'&&/^(?:과|와)$/.test(t.text)&&/각각|함께|동시/.test(part.text));
  const heads=words.filter(w=>w.tokens.some(t=>t.pos==='NNG'&&/^(?:항목|질문|방법|기준|순서)$/.test(t.text))&&(conjunct(w)||w.tokens.some(t=>t.pos==='JKO')));
  if(heads.length<2||!heads.slice(0,-1).some(conjunct))return [];
  let start=0;const nominal=[];
  for(const word of heads){let end=word.end;while(start<end&&/\s/.test(part.text[start]))start++;const output=word.tokens.find(t=>t.pos==='NNG'&&/^(?:항목|질문|방법|기준|순서)$/.test(t.text)).text;nominal.push({...part,start:part.start+start,end:part.start+end,text:question.slice(part.start+start,part.start+end),coordinated:true,output,sharedEnding:question.slice(part.start+heads.at(-1).end,part.end)});start=end;}
  return nominal.length>1&&nominal.every(p=>describe(question,p))?nominal:[];
 }
 function refine(question,requests,parts){
  let result=requests.map(t=>({...t}));
  const kindFor=operation=>operation==='reflect'?'open':operation==='cope'?'emotion':'action';
  const parallel=requests.length>1||/그리고|각각|함께|동시에|방법도|행동도|비교(?:해\s*주고|하고)|알려\s*주고/.test(qt.mask(question));
  for(const [partIndex,part]of parts.entries()){
   const units=outputs(part,question),overlap=result.filter(t=>t.start>=part.start&&t.end<=part.end);
   if(units.length>new Set(overlap.map(t=>t.start+':'+t.end)).size){result=result.filter(t=>!overlap.includes(t));for(const unit of units){const frame=describe(question,unit);result.push({...unit,kind:kindFor(frame.operation),goal:frame.operation,work:frame});}}
   else if(!overlap.length&&(explicitMode(part.text)||/어떻게|어떤\s*(?:방법|순서|기준)/.test(part.text)||asked(parts[partIndex+1]?.text||'')&&morph.analyze(part.text)?.words.at(-1)?.tokens.some(t=>t.pos==='EC'&&t.text==='고'))){
    const task={...part,text:question.slice(part.start,part.end),kind:'action',goal:'action'},frame=describe(question,task);
    const genericCardTail=/^(?:카드|타로)(?:를\s*통해|로)\s*(?:좀\s*)?(?:돌아보|살펴보|보|성찰하)(?:고\s*싶(?:어요|습니다)|아\s*주세요)$/.test(part.text);
    if(frame&&!(result.length&&genericCardTail))result.push({...task,kind:kindFor(frame.operation),goal:frame.operation,work:frame});
   }
  }
  for(const task of result){
   const frame=task.work||describe(question,task);if(!frame)continue;
   if(task.kind==='cause'&&/어떻게/.test(task.text)&&frame.operation==='communicate'&&!/왜|어째서/.test(task.text)){task.kind='action';task.goal='communicate';}
   if(task.kind==='forecast'&&(explicitMode(task.text)||frame.reason==='nominal-work-head'&&frame.operation==='reflect')){task.kind=kindFor(frame.operation);task.goal=frame.operation;}
   if(['action','emotion','open'].includes(task.kind))task.work=frame;
  }
  result=result.filter((t,i)=>!t.work||!result.slice(0,i).some(u=>u.start===t.start&&u.end===t.end&&u.work?.operation===t.work.operation));
  result.sort((a,b)=>a.start-b.start);
  return result.length>1&&!parallel&&!result.some(t=>t.coordinated)?[result.at(-1)]:result;
 }
 function lacksContext(question,events=[],requests=[]){
  const text=qt.mask(question);if(!text.trim()||/오늘|하루|전반|전체|일상/.test(text)||events.length||qt.quotes(question).some(q=>q.text.trim()))return false;
  const a=morph.analyze(text);if(!a)return false;
  if(requests.some(t=>t.work&&['responsibility','interaction'].includes(t.work.target.kind)))return false;
  if(a.tokens.some(t=>/불안|걱정|외롭|슬프|무섭|두렵|답답|속상|서운|공허|행복|지치/.test(t.text)))return false;
  // Concrete activities, experiences and feelings can supply context without a
  // noun topic (e.g. resting vs meeting someone). Generic request verbs cannot.
  const genericPredicates=set('하 되 있 없 보 모르 알 정하 고르 선택 결정 준비 확인 진행 정리 점검 검토 돌아보 살펴보 좋 나쁘 어떻 필요 궁금 원하 바라');
  if(a.tokens.some(t=>/^(?:VV|VA)$/.test(t.pos)&&!genericPredicates.has(t.text)))return false;
  return !nouns(a).some(n=>!generic.has(n.term)&&!set('저 나 우리 저희 이 그 뭐 무엇 누구 하나 둘 두 한 때문').has(n.term))&&!a.tokens.some(t=>t.pos==='VA'&&/불안|외롭|슬프|무섭|두렵|답답/.test(t.text));
 }
 const api=Object.freeze({describe,refine,lacksContext});if(common)module.exports=api;else root.ARCANA_REQUEST_FRAME=api;
})(typeof globalThis==='object'?globalThis:this);
