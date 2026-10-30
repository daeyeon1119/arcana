/* Lexemes and request scope qualify inherited domain keywords. Not a diagnosis. */
(function(root){'use strict';
 const common=typeof module==='object'&&module.exports,morph=common?require('./korean-morphology.js'):root.ARCANA_KOREAN_MORPHOLOGY,qt=common?require('./question-text.js'):root.ARCANA_QUESTION_TEXT;
 const set=s=>new Set(s.split(' '));
 const clinical=set('설사 구토 기침 발열 두통 편두통 복통 위통 흉통 통증 호흡곤란 빈뇨 혈뇨 배뇨 배뇨통 소변 속쓰림 어지럼 어지러움 현기증 두근거림 저림 증상 질병 질환 임신 복용 처방 약 약물 용량 부작용 진단 치료 진료 수술 내시경 검진 건강검진 피검사 혈액검사 의료진 피로 피곤');
 const clinicalHeads=set('증상 질병 질환 환자 약 약물 진단 치료 진료 수술 내시경 검진 건강검진 검사 병원 의료진');
 const financial=set('투자 주식 주가 코인 비트코인 대출 연금 퇴직연금 저축 적금 예금 보증금 전세 월세 부동산 금리 이자 상환 채무 빚 보험 재테크 손실 수익 수익률 환율 자산 계좌 생활비 소득 카드값 지출 소비 월급 현금');
 const financeComposition=set('투자 거래 거래소 매수 매도 보유 시세 가격 수익 손실 금융 주가 계좌');
 const domains={
  project:set('소설 원고 집필 작곡 멜로디 음악 그림 작품 전시 사진전 영상 앱 웹사이트 웹페이지 코드 개발 창작 디자인 편집 출판 프로젝트 프로그래밍 코딩'),
  family:set('친구 우정 부모 엄마 아빠 자녀 동생 형제 가족 언니 선배 후배 사촌 친척'),
  relationship:set('관계 연애 연인 애인 데이트 이별 소개팅 고백 재회 짝사랑 전남친 전여친 결혼 호감'),
  career:set('직장 회사 업무 동료 팀장 상사 팀 부서 취업 이직 면접 채용 입사 퇴사 직무 연봉 프리랜서 고객 사업 단가 근무 직원 운영 직업 진로'),
  preparation:set('시험 공부 학습 과제 성적 기출 수업 자격증 스터디 모의고사 입시 수능 국시 오디션'),
  decision:set('선택 결정 제안 조건 이사'),
  stress:set('불안 자책 무기력 감정 기분 상담 외로움 자존감 눈물 긴장 걱정 마음 공허 번아웃'),
  waiting:set('발표 기다림 결과 회신 답장')
 };
 const nouns=w=>w.tokens.filter(t=>/^(?:NNG|NNP|NP)$/.test(t.pos));
 // Normalize inquiry inflections at the grammar boundary, without editing the
 // distributed dictionary. 물+으 is the asking stem's ㄷ-irregular surface;
 // the biting verb's regular ㄹ stem takes 려면 rather than 으려면.
 const inquiryWord=w=>w.tokens.some(t=>/^(?:VV|XSV)$/.test(t.pos)&&/^(?:묻|물어보|여쭈|여쭤|여쭤보|여쭈어보)$/.test(t.text))||w.tokens.some(t=>t.text==='질문'&&t.pos==='NNG')&&w.tokens.some(t=>t.pos==='XSV')||w.tokens.some(t=>t.text==='물'&&t.pos==='VV')&&w.tokens.some(t=>t.pos==='EC'&&/^으/.test(t.text));
 function communicates(text){
  const a=morph.analyze(qt.mask(String(text||'')));if(!a)return null;
  const verbalNouns=set('말 전달 설명 표현 이야기 대화 요청 공지 상의 의논 논의 공유 부탁 제안 협의 보고 알림 소통 상담 답변 대답 회신');
  return a.words.some(w=>w.tokens.some(t=>t.pos==='VV'&&/^(?:전하|말하|말|알리|이야기하|대화하|설명하|표현하|전달하)$/.test(t.text))||nouns(w).some(t=>verbalNouns.has(t.text))&&w.tokens.some(t=>t.pos==='XSV')||w.tokens.some(t=>/^(?:VV|XSV)$/.test(t.pos))&&[...verbalNouns].some(base=>new RegExp('^'+base+'(?:하|해|했|할|합니|하였|드리|드려|드릴)').test(w.text))||a.tokens.some(t=>t.text==='말씀'&&t.pos==='NNG')&&w.tokens.some(t=>t.pos==='VV'&&t.text==='드리')||w.tokens.some(t=>t.pos==='VV'&&t.text==='꺼내')&&a.tokens.some(t=>/^(?:말|이야기|주제|화제|고민|의견)$/.test(t.text)));
 }
 function requestFrame(original){
  const text=String(original||''),cue=text.search(/어떻게|어떡|무엇|뭘|어떤|무슨|어디|언제/),head=qt.requestHead(cue>=0?text.slice(cue):text),headAnalysis=morph.analyze(head),whole=morph.analyze(text);if(!whole||!headAnalysis)return null;
  const negative=/묻지\s*않|물어보지\s*않|질문하지\s*않/.test(text)||whole.tokens.some((t,i)=>/^(?:묻|물어보|여쭈)$/.test(t.text)&&whole.tokens.slice(i+1,i+5).some(t=>/^(?:않|말)$/.test(t.text)));
  const questionObject=headAnalysis.words.some(w=>nouns(w).some(t=>t.text==='질문')&&w.tokens.some(t=>t.pos==='JKO'||t.pos==='JKB'&&/^(?:으로|로)$/.test(t.text)));
  const headRoots=headAnalysis.tokens.map(t=>t.text),genericRoots=set('어떻 하 되 준비 정리 확인 점검 검토 시작 진행 순서 방법 단계 질문 일 것 필요 좋 보 수 있');
  const genericPredicate=!headAnalysis.tokens.some(t=>/^(?:NNG|VV|VA)$/.test(t.pos)&&!genericRoots.has(t.text));
  const generic=/^(?:어떻게|어떡|무엇부터|뭘부터|어디부터|어떤\s*(?:순서|방법))/.test(head)&&genericPredicate&&!headAnalysis.words.some(w=>w.tokens.some(t=>t.pos==='JKO')&&!nouns(w).every(t=>/^(?:준비|정리|질문|일|것)$/.test(t.text)));
  if(!negative&&questionObject&&genericPredicate&&headRoots.some(t=>/^(?:준비|정리|확인|점검|검토|하)$/.test(t)))return {operation:'inquire',reason:'requested-question-as-output-or-instrument',source:text,informationGoal:true};
  const prefix=cue>0?morph.analyze(text.slice(0,cue)):null;
  if(generic&&prefix){
   const purposeWord=prefix.words.findLast(w=>w.tokens.some(t=>t.pos==='EC'&&/(?:려면|려고|고자)/.test(t.text)));
   const output=prefix.words.findLast(w=>w.tokens.some(t=>t.pos==='JKO')&&(!purposeWord||w.start>=purposeWord.end));
   if(output){
    if(!negative&&nouns(output).some(t=>t.text==='질문'))return {operation:'inquire',reason:'explicit-main-clause-question-output',source:text,informationGoal:true};
    if(nouns(output).some(t=>!/^(?:준비|정리|일|것)$/.test(t.text)))return null;
   }
   if(purposeWord){
    const roots=purposeWord.tokens.map(t=>t.text),inquiry=inquiryWord(purposeWord),review=roots.some(t=>/^(?:살피|살펴보|확인|검토|점검|알아보)$/.test(t));
    if(!negative&&(inquiry||review)&&headRoots.some(t=>/^(?:준비|정리|확인|하)$/.test(t)))return {operation:inquiry?'inquire':'verify',reason:'purpose-before-generic-means',source:text,purpose:{start:purposeWord.start,end:purposeWord.end,text:purposeWord.text},informationGoal:true};
   }
  }
  const lastAction=headAnalysis.words.findLast(w=>inquiryWord(w)||w.tokens.some(t=>t.pos==='VV'&&!/^(?:하|되|보)$/.test(t.text))||w.tokens.some(t=>t.pos==='XSV')&&nouns(w).some(t=>!genericRoots.has(t.text)));
  if(!negative&&lastAction&&inquiryWord(lastAction))return {operation:'inquire',reason:'inflected-inquiry-lemma',source:text,informationGoal:true};
  return null;
 }
 function hits(analysis,terms,qualify=()=>true){return analysis.words.flatMap(word=>nouns(word).filter(t=>terms.has(t.text)&&qualify(t,word)).map(t=>({term:t.text,pos:t.pos,start:word.start,end:word.end,text:word.text})));}
 function focusedScope(question,model){
  const task=model?.requests?.at(-1);if(!task||!task.start||task.context)return {start:0,end:question.length,reason:'whole-question'};
  const prefix=question.slice(0,task.start),text=question.slice(task.start,task.end),analysis=morph.analyze(text),foreign=(model.events||[]).some(e=>e.end<=task.start&&e.actor==='other');
  const separate=/^(?:이와\s*별개로|별개로|다른\s*질문|그와\s*별도로)/.test(text);
  const self=/^(?:저는|제가|나는|내가|제\s|내\s)/.test(text),object=analysis?.words.some(w=>w.tokens.some(t=>t.pos==='JKO')&&nouns(w).some(t=>!/^(?:이|그|것|그것|이것|내용|답|답변|회신|결과)$/.test(t.text)));
  const anaphoric=/^(?:이를|이것|그것|그\s*(?:사람|일|내용|답|결과)|이\s*(?:상황|일|내용)|받은|전달받은)/.test(text);
  if(!anaphoric&&(separate||foreign&&self&&object))return {start:task.start,end:task.end,reason:separate?'explicit-separate-topic':'new-owned-task-after-other-actor'};
  return {start:0,end:question.length,reason:'whole-question'};
 }
 function resolve(question,model,legacyDomain='general',legacyMedical=false,reclassify=null){
  const scope=focusedScope(question,model),text=question.slice(scope.start,scope.end),analysis=morph.analyze(text);if(!analysis)return null;
  const qualified=(token,word)=>{const ns=nouns(word),head=ns.at(-1)?.text;return token===ns.at(-1)||clinicalHeads.has(head);};
  const health=hits(analysis,clinical,qualified);
  // 검사 is ambiguous: a human recipient is not a medical test.
  const checks=hits(analysis,set('검사'),(t,w)=>!w.tokens.some(t=>t.pos==='JKB'&&/에게|한테|께/.test(t.text))&&/(?:검사\s*결과|혈액\s*검사|CT\s*검사|MRI\s*검사|검사를\s*(?:받|했|할|하|앞두))/.test(text));health.push(...checks);
  const bodyPain=/(?:몸|배|가슴|머리|허리|목)(?:이|가|에)?\s*(?:아프|아파|아픈)|숨.{0,4}(?:못|안)\s*쉬/.test(text);
  const institution=hits(analysis,set('병원 의원 보건소 의사 의료진')).length>0;
  const clinicalVisit=institution&&/(?:진료|예약|상담|검사|치료|수술)/.test(text)&&!/(?:입사|취업|채용|면접)/.test(text);
  const jobOnly=/(?:입사|취업|채용|면접)/.test(text)&&!health.length&&!bodyPain;
  const detectedMedical=health.length>0||bodyPain||clinicalVisit&&!jobOnly;
  const finance=hits(analysis,financial,(token,word)=>{
   if(!/^(?:주식|코인)$/.test(token.text))return true;
   const ns=nouns(word);return token===ns.at(-1)||ns.some(t=>financeComposition.has(t.text));
  });
  const evidence=Object.fromEntries(Object.entries(domains).map(([domain,terms])=>[domain,hits(analysis,terms)]));
  const otherDomain=Object.entries(evidence).find(([key,rows])=>key!=='waiting'&&rows.length)?.[0];
  const wellness=hits(analysis,set('건강')).filter(h=>{const w=analysis.words.find(w=>w.start===h.start);return !w.tokens.some(t=>t.pos==='ETM')||!otherDomain;});
  // Absence from this bounded vocabulary is not evidence against a domain.
  // Require affirmative contradictory word/argument evidence, then replay the
  // existing classifier with only those unrelated words masked. Other clinical
  // or financial evidence remains available to that classifier.
  const rejectedHealth=analysis.words.filter(word=>{
   if(health.some(h=>h.start===word.start))return false;
   const ns=nouns(word),head=ns.at(-1),personCase=word.tokens.some(t=>t.pos==='JKS'||t.pos==='JX'||t.pos==='JKB'&&/에게|한테|께/.test(t.text));
   const unrelatedRole=head&&personCase&&/(?:사|자|원|관|인|님|씨|협회|회사|단체)$/.test(head.text)&&[...clinical].some(term=>head.text!==term&&head.text.includes(term));
   const humanExaminer=ns.some(t=>t.text==='검사')&&word.tokens.some(t=>t.pos==='JKB'&&/에게|한테|께/.test(t.text));
   const abstractModifier=ns.some(t=>t.text==='건강')&&word.tokens.some(t=>t.pos==='ETM')&&otherDomain&&!wellness.length;
   return unrelatedRole||humanExaminer||abstractModifier;
  });
  const rejectedFinance=analysis.words.filter(word=>/주식|코인/.test(word.text)&&nouns(word).length&&!finance.some(h=>h.start===word.start)&&![...financial,...financeComposition].some(term=>nouns(word).at(-1)?.text.endsWith(term)));
  let domain=legacyDomain,retainedMedical=legacyMedical,replayed=null;
  const rejected=legacyDomain==='health'||legacyMedical?rejectedHealth:legacyDomain==='finances'?rejectedFinance:[];
  if(rejected.length&&reclassify&&!detectedMedical){
   let cleaned=text;for(const word of [...rejected].sort((a,b)=>b.start-a.start))cleaned=cleaned.slice(0,word.start)+' '.repeat(word.end-word.start)+cleaned.slice(word.end);
   const checked=reclassify(cleaned);domain=checked.domain;retainedMedical=!!checked.medical;replayed={domain,medical:retainedMedical};
   if(domain==='general'&&otherDomain)domain=otherDomain;
  }
  const medical=detectedMedical||retainedMedical;if(medical)domain='health';
  return {domain,medical,scope,evidence:{health,financial:finance,domains:evidence},rejectedWords:rejected.map(w=>({start:w.start,end:w.end,text:w.text})),replayed,analysis:morph.status(),legacyDomain};
 }
 const api=Object.freeze({resolve,focusedScope,requestFrame,communicates});if(common)module.exports=api;else root.ARCANA_LEXICAL_CONTEXT=api;
})(typeof globalThis==='object'?globalThis:this);
