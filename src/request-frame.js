/* Requested predicate + object + output. Literal spans are evidence, not facts.
 * This bounded local grammar does not infer missing intentions or outcomes. */
(function(root){'use strict';
 const common=typeof module==='object'&&module.exports;
 const morph=common?require('./korean-morphology.js'):root.ARCANA_KOREAN_MORPHOLOGY;
 const qt=common?require('./question-text.js'):root.ARCANA_QUESTION_TEXT;
 const set=s=>new Set(s.split(' '));
 const generic=set('것 거 일 상황 사람 내용 부분 점 방향 방법 방식 순서 단계 기준 이유 원인 무엇 뭐 어디 언제 어떤 어느 지금 현재 이제 앞 앞으로 선택 가지 쪽 수 필요 도움 질문 준비 정리 확인 검토 점검 진행 고려 결정 해결 생각');
 const documents=set('문서 자료 서류 안내문 안내서 계약서 양식 서식 문구 문장 설명문 보고서 원고 목차 구조 초안 대본 목록 표 장부 책자 공지문 규칙 회칙');
 const observations=set('기록 일지 노트 관찰 관측 데이터 메모 기록장');
 const requirements=set('조건 요건 자격 규정 절차 준비물 필수 서류 항목 기한 일정 비용 신청 예약');
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
 const asked=t=>/어떻게|어떡|어떤|어느|무엇|뭘|뭐|주세요|주십시오|줄래|까요|할까|해줘/.test(t);
 const modality=t=>/가정|만약|(?:다면|경우)|꿈에서/.test(t)?'conditional':'requested';
 function operation(word,a){
  const terms=roots(word),all=nouns(a).map(n=>n.term);
  for(const [op,values]of Object.entries(verbs))if(terms.some(t=>values.has(t))){
   if(op==='cope'&&!all.some(t=>/마음|감정|불안|걱정|긴장|분노|슬픔/.test(t)))continue;
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
  const finite=candidates.filter(x=>!x.word.tokens.some(t=>t.pos==='ETM'));
  let found=finite.at(-1);
  const wrapper=found&&/^(?:알리|알려주|말|설명)$/.test(roots(found.word)[0]||'')&&/주세요|주십시오|해줘/.test(a.text.slice(found.word.start));
  if(!found||wrapper){
   const nominal=candidates.findLast(x=>x.word.tokens.some(t=>t.pos==='ETM')&&a.words.slice(x.index+1,x.index+4).some(w=>w.tokens.some(t=>t.pos==='NNG'&&/^(?:방법|기준|순서|일|질문)$/.test(t.text))));
   if(nominal)found=nominal;
  }
  if(!found)return null;
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
  const anaphoric=/^(?:두\s*내용|그\s*내용|이\s*내용|그것|이것|이를|그\s*자료|이\s*자료)/.test(task.text.trim());
  const known=terms.some(n=>documents.has(n.term)||observations.has(n.term)||messages.has(n.term)||requirements.has(n.term));
  if((anaphoric||!explicit&&!known)&&!/별개|별도로|무관|다른\s*(?:일|주제|문제)/.test(task.text)){
   const prior=previous(question,task.start||0),parsed=prior&&morph.analyze(qt.mask(prior.text));
   if(parsed&&objects(parsed).some(n=>documents.has(n.term)||observations.has(n.term)||evidence.has(n.term))){source=prior;analysis=parsed;terms=objects(parsed);inherited=anaphoric?'anaphoric-content':'omitted-recent-object';}
  }
  const all=new Set(terms.map(n=>n.term)),has=s=>terms.some(n=>s.has(n.term));
  const primary=terms.filter(n=>n.word.tokens.some(t=>t.pos==='JKO')&&(inherited||n.word.start<predicateStart)&&(!generic.has(n.term)||messages.has(n.term))).at(-1);
  const clinicalObject=primary&&set('약 약물 용량 복용량 증상 통증 치료 수술').has(primary.term);
  const assetObject=primary&&set('주식 코인 대출 예금 연금 보험 투자금').has(primary.term);
  const mixed=terms.some(n=>/^(?:기대|추측|짐작|해석|원인)$/.test(n.term))&&terms.some(n=>/^(?:사실|관찰|관측|정보|자료|내용)$/.test(n.term));
  const kind=clinicalObject?'clinical':assetObject?'asset':op==='compare'?'comparison':mixed||op==='inspect'&&has(evidence)&&/구별|구분|가진|빠진/.test(task.text)?'evidence':op==='coordinate'&&/약속|규칙|대화|토론|관계/.test(task.text)?'interaction':op==='verify'&&has(requirements)||op==='inspect'&&has(requirements)&&!has(observations)?'requirements':has(observations)?'observation':has(documents)&&!terms.some(n=>n.term==='설명'&&all.has('증상'))?'document':has(messages)||op==='communicate'&&all.has('선택')?'message':has(creative)?'creative':op==='coordinate'&&has(work)?'responsibility':['reflect','cope'].includes(op)?'experience':'unspecified';
  const relevant={evidence,observation:observations,document:documents,requirements,message:messages,creative,responsibility:work,interaction:set('약속 규칙 토론 대화 관계')};
  const n=['clinical','asset'].includes(kind)?primary:terms.findLast(n=>relevant[kind]?.has(n.term))||primary||terms.findLast(n=>!generic.has(n.term));
  const evidenceSpan=n?{start:source.start+n.word.start,end:source.start+n.word.end,text:question.slice(source.start+n.word.start,source.start+n.word.end)}:null;
  const prefix=source.text.slice(0,n?.word.start??source.text.length),localOwner=prefix.split(/보다|말고|아니라/).at(-1);
  const owner=/(?:^|\s)(?:제|내|저의|나의)\s/.test(localOwner)?'self':/(?:그의|상대의|다른\s*사람의)/.test(localOwner)?'other':'unspecified';
  return {kind,head:n?.term||null,evidence:evidenceSpan,owner,...(inherited?{inherited}:{}),modality:modality(source.text)};
 }
 function describe(question,task){
  const text=qt.mask(task.text||''),a=morph.analyze(text);if(!a||!asked(text)&&!task.coordinated&&!task.output)return null;
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
  if(op==='coordinate'&&object.kind==='unspecified')return null;
  if(op==='improve'&&roots(p?.word||{tokens:[]}).includes('줄이')&&!['message','document','creative'].includes(object.kind))return null;
  if(op==='inspect'&&object.kind==='requirements')op='verify';
  const predicateSpan=p?{start:(task.start||0)+p.word.start,end:(task.start||0)+p.word.end,text:question.slice((task.start||0)+p.word.start,(task.start||0)+p.word.end)}:null;
  return {version:90,operation:op,target:object,predicate:predicateSpan,requestedOutput:task.output||null,scope:{start:task.start||0,end:task.end??(task.start||0)+task.text.length},reason:task.output?'coordinated-nominal-output':'predicate-and-object'};
 }
 function outputs(part,question){
  if(!asked(part.text))return [];
  const a=morph.analyze(part.text);if(!a)return [];
  const words=a.words,coordinators=words.filter(w=>w.tokens.some(t=>t.pos==='EC'&&/^(?:고|며|으며)$/.test(t.text))&&operation(w,a)&&!/^\s*(?:있|싶)/.test(part.text.slice(w.end)));
  const pieces=[];
  if(coordinators.length){
   let start=0;for(const end of [...coordinators.map(w=>w.end),part.text.length]){while(start<end&&/\s/.test(part.text[start]))start++;if(end>start)pieces.push({...part,start:part.start+start,end:part.start+end,text:part.text.slice(start,end),coordinated:true,sharedContext:part.text.slice(0,start)});start=end;}
   if(pieces.length>1&&pieces.every(p=>describe(question,p)))return pieces;
  }
  const heads=words.filter(w=>w.tokens.some(t=>t.pos==='NNG'&&/^(?:항목|질문|방법|기준|순서)$/.test(t.text))&&w.tokens.some(t=>t.pos==='JC'||t.pos==='JKO'));
  if(heads.length<2||!heads.slice(0,-1).some(w=>w.tokens.some(t=>t.pos==='JC')))return [];
  let start=0;const nominal=[];
  for(const word of heads){let end=word.end;while(start<end&&/\s/.test(part.text[start]))start++;const output=word.tokens.find(t=>t.pos==='NNG'&&/^(?:항목|질문|방법|기준|순서)$/.test(t.text)).text;nominal.push({...part,start:part.start+start,end:part.start+end,text:part.text.slice(start,end),coordinated:true,output,sharedEnding:part.text.slice(heads.at(-1).end)});start=end;}
  return nominal.length>1&&nominal.every(p=>describe(question,p))?nominal:[];
 }
 function refine(question,requests,parts){
  let result=requests.map(t=>({...t}));
  for(const part of parts){
   const units=outputs(part,question),overlap=result.filter(t=>t.start>=part.start&&t.end<=part.end);
   if(units.length>overlap.length){result=result.filter(t=>!overlap.includes(t));for(const unit of units){const frame=describe(question,unit);result.push({...unit,kind:frame.operation==='cope'?'emotion':'action',goal:frame.operation,work:frame});}}
  }
  for(const task of result){
   const frame=task.work||describe(question,task);if(!frame)continue;
   if(task.kind==='cause'&&/어떻게/.test(task.text)&&frame.operation==='communicate'&&!/왜|어째서/.test(task.text)){task.kind='action';task.goal='communicate';}
   if(['action','emotion','open'].includes(task.kind))task.work=frame;
  }
  return result.sort((a,b)=>a.start-b.start);
 }
 function lacksContext(question,events=[],requests=[]){
  const text=qt.mask(question);if(!text.trim()||/오늘|하루|전반|전체|일상/.test(text)||events.length||qt.quotes(question).some(q=>q.text.trim()))return false;
  const a=morph.analyze(text);if(!a)return false;
  if(requests.some(t=>t.work&&['responsibility','interaction'].includes(t.work.target.kind)))return false;
  if(a.tokens.some(t=>/불안|걱정|외롭|슬프|무섭|두렵|답답|속상|서운|공허|행복|지치/.test(t.text)))return false;
  return !nouns(a).some(n=>!generic.has(n.term)&&!set('저 나 우리 저희 이 그 뭐 무엇 누구 하나 둘 두 한 때문').has(n.term))&&!a.tokens.some(t=>t.pos==='VA'&&/불안|외롭|슬프|무섭|두렵|답답/.test(t.text));
 }
 const api=Object.freeze({describe,refine,lacksContext});if(common)module.exports=api;else root.ARCANA_REQUEST_FRAME=api;
})(typeof globalThis==='object'?globalThis:this);
