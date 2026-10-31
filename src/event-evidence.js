/* Predicate-scoped evidence. Waiting, receiving and reading are different facts.
 * This bounded grammar records literal spans; it is not unrestricted Korean NLP. */
(function(root){'use strict';
 const self=/^(?:저|제|나|내|우리|저희)$/;
 const morphology=typeof module==='object'&&module.exports?require('./korean-morphology.js'):root.ARCANA_KOREAN_MORPHOLOGY;
 function actor(text,index,excluded=[]){
  const analysis=morphology.analyze(text.slice(0,index));
  if(analysis)return morphology.actor(text,index,excluded);
  const prefix=text.slice(0,index),matches=[];
  for(const m of prefix.matchAll(/(?:^|\s)([가-힣A-Za-z][가-힣A-Za-z0-9_-]{1,17})(이|가)(?=\s|$)/g)){
   const start=m.index+m[0].indexOf(m[1]);if(excluded.some(span=>start>=span.start&&start<span.end))continue;
   matches.push({actor:self.test(m[1])?'self':'other',evidence:m[1]+m[2],start});
  }
  const topic=prefix.match(/^\s*([가-힣A-Za-z][가-힣A-Za-z0-9_-]{1,17})(은|는|도)(?=\s|$)/);
  // Productive adnominal predicate endings are not nominal topic particles.
  // In particular X하는/되는/있는/없는/모르는 must not become an actor.
  const modifier=topic&&topic[2]==='는'&&/(?:하|되|있|없|르)$/.test(topic[1]);
  if(topic&&!modifier&&!/^(?:오늘|어제|지금|이번|다음|내일|당시|전날|현재)$/.test(topic[1])&&!/(?:에서|에게|에|으로|로)$/.test(topic[1])){
   const start=topic.index+topic[0].indexOf(topic[1]);if(!excluded.some(span=>start>=span.start&&start<span.end))matches.push({actor:self.test(topic[1])?'self':'other',evidence:topic[1]+topic[2],start});
  }
  return matches.sort((a,b)=>a.start-b.start).at(-1)||null;
 }
 function predicate(tail){
  const leading=tail.match(/^[은는이가을를도]+/),offset=leading?.[0].length||0,text=tail.slice(offset);
  const rules=[['receive',/^(?:받았|받은|받아|받지|받고|받을|받는|받겠|받습니다|왔|오지|오고|오는|오면|올|도착)/],['send',/^(?:보냈|보내|보낼|전했|전하|전할)/],['read',/^(?:읽었|읽은|읽지|읽고|읽을|읽는|읽어|읽습니다|열어보|펼쳐보)/],['make',/^(?:했|하(?:지|진|고|는|면|려|겠|셨|나(?:요|$))|할|해(?=요|서|도|줄|주|줬|보|\s|$))/]];
  for(const word of text.matchAll(/\S+/g)){
   const stripped=word[0].replace(/^(?:안|못)(?=[가-힣])/,'');
   for(const [action,rx]of rules){const m=stripped.match(rx);if(m)return {action,text:m[0],index:offset+word.index+word[0].length-stripped.length};}
  }
  return null;
 }
 function waiting(text){
  const match=/(?:기다(?:리|려|릴|린|립|렸|림)|대기하|대기\s*중)/.exec(text);if(!match)return null;
  const start=match.index,before=text.slice(0,start),tail=text.slice(start);
  const otherObject=before.match(/([가-힣A-Za-z0-9_-]+)[을를]\s*(?:(?:더는|이미|아직|계속|안|못|더|오래|다시)\s*)*$/);
  if(otherObject&&!/^(?:이|그것|그거|그걸)$/.test(otherObject[1]))return null;
  const inner=/(?:기다리|대기하)(?:지(?:는|도|만)?|진)\s*(?:않|못)|(?:기다리|대기하)고\s*있지(?:는|도)?\s*않|(?:기다리는|대기\s*중인?)\s*(?:상황|상태|처지|중)(?:이|가|은|는|도)?\s*아(?:니|닌|닙|닐|냐)|기다릴\s*(?:생각|계획|마음)(?:이|가|은|는|도)?\s*없/.exec(tail);
  const preceding=/(?:^|\s)(?:안|못)\s*$/.test(before),negated=!!inner||preceding;
  // An outer denial reverses the immediately preceding negative proposition.
  const outer=negated&&/(?:않|못)[가-힣]*\s*(?:것|게|건)(?:은|는|이|가|도)?\s*아(?:니|닌|닙|닐|냐)/.test(tail);
  const status=/(?:다면|경우|가정)|(?:기다렸|기다린|기다리)(?:으면|다면)|기다렸을\s*때|기다릴\s*때/.test(tail)?'conditional':/까\s*봐|꿈에서|(?:다고|다는)\s*(?:생각|추측|상상)|는지.{0,8}모르|(?:는|은)\s*것\s*같|일지도/.test(before+tail)?'uncertain':/(?:다고|다는)\s*(?:말|했|해|하)/.test(tail)?'reported':/^(?:기다릴(?:까|지|\s*(?:예정|계획))|기다리(?:려|고\s*싶|나요)|대기할)/.test(tail)?'planned':'asserted';
  return {value:outer?true:!negated,status,start,end:text.length,text:text.slice(start),tense:/기다렸|대기했/.test(tail)?'past':'current',negativeOperators:(negated?1:0)+(outer?1:0)};
 }
 function relative(text,nounStart,nounEnd,minimum=0){
  const prefix=text.slice(minimum,nounStart),rx=/(받은|받아\s*(?:둔|놓은)|보내\s*준|전해\s*준|보낸|전한|읽은|도착한|온|나온|확정된|제출한)\s*$/;let head=prefix,m=rx.exec(head);
  for(let i=0;!m&&i<3;i++){
   const token=head.trimEnd().match(/\S+$/);if(!token)break;
   const word=token[0],last=word.charCodeAt(word.length-1),modifier=last>=0xac00&&last<=0xd7a3&&(last-0xac00)%28===4||/^(?:제|내|그|이|저|아주|매우|조금|더|꽤)$/.test(word)||/의$/.test(word);
   const nominalModifier=morphology.analyze(word)?.tokens.every(t=>/^(?:NNG|NNP|SL|SH)$/.test(t.pos));
   if(!modifier&&!nominalModifier)break;head=head.slice(0,token.index);m=rx.exec(head);
  }
  if(!m)return null;const verb=m[1],after=text.slice(nounEnd),start=minimum+m.index,frame=text.slice(0,start);
  const conditional=/^(?:이|가|은|는|을|를|도)?\s*(?:이미\s*)?(?:있다면|있으면|있을\s*때|이라면|이라\s*가정|이\s*있다고\s*가정)/.test(after)||/(?:만약|가정)/.test(frame);
  const absent=/^(?:이|가|은|는|도)?\s*(?:아직\s*|전혀\s*)*없/.test(after);
  const status=conditional?'conditional':/꿈에서|(?:라고|다고)\s*(?:상상|추측)/.test(frame)?'uncertain':absent?'negated':'asserted';
  const action=/^(?:받|도착|온)/.test(verb)?'receive':/^(?:보낸|보내|전한|전해)/.test(verb)?'send':/^읽/.test(verb)?'read':/^제출/.test(verb)?'submit':'publish';
  return {action,predicate:verb,start,end:nounEnd,status,completed:status==='asserted',text:text.slice(start,nounEnd)};
 }
 function anaphoricWait(text,start){return /^(?:(?:저는|제가|나는|내가|지금은|이제는|이제|아직|더는|더|계속|줄곧|전혀|안|못|다시|그것을|이를|그걸)\s*)*$/.test(text.slice(0,start).trim());}
 function bindRequests(requests,events,question,state){
  if(state.received!==true)return;
  const sentences=typeof module==='object'&&module.exports?require('./question-text.js').sentences:root.ARCANA_QUESTION_TEXT.sentences;
  const barrier=fragment=>{
   if(/별개|별도로|다른\s*(?:일|문제|주제|질문)|한편|새\s*(?:질문|주제)|제쳐두|그\s*(?:답|내용)과\s*무관/.test(fragment))return true;
   const text=fragment.trim().replace(/^(?:(?:저는|제가|나는|내가|그리고|이제|지금)\s+)+/,'').replace(/^[가-힣]{1,12}(?:에게|한테|께)\s+/,'');
   if(/^(?:어떻게|어떡|무엇|뭘|어디|어떤|어느)/.test(text))return false;
   const head=text.match(/^([가-힣A-Za-z0-9_-]+(?:\s+[가-힣A-Za-z0-9_-]+){0,2}?)(?:은|는|을|를|이|가)(?=\s|어떻게|무엇|뭘|어떤|어느)/);
   return !!head&&!/(?:답변|답장|회신|대답|내용|말씀|질문|부분|이해|마음|감정|걱정|긴장|그것|이것)|(?:^|\s)답(?=하|해|했|은|는|을|이|가|도|\s|$)/.test(head[1]);
  };
  for(const task of requests){
   const receipt=events.findLast(e=>e.end<=task.end&&e.status==='asserted'&&e.completed&&!e.readingFromOtherReceipt&&e.actor!=='other'&&['receive','read'].includes(e.direction)&&(e.accepting||e.recipient?.actor!=='other'));
   if(!receipt)continue;
   const gap=question.slice(receipt.end,Math.max(receipt.end,task.start)),text=question.slice(task.start,task.end);
   const clauses=sentences(gap),continuation=clauses[0]||'',contrast=continuation.match(/(?:지만|반면|한편|그런데|그리고)\s*/);
   const possibleReview=task.frame?.informationGoal&&!/별개|별도로|제쳐두|다른\s*(?:일|문제|주제|질문)|(?:^|\s)(?:제|내)\s|안내문|문서|자료|서식|도표|포스터/.test(text)&&(state.read===false||/모호|불분명|이해.{0,8}(?:안|못|어려)/.test(text));
   const newHead=barrier(text);
   if(/별개|별도로|제쳐두|그\s*(?:답|내용)과\s*무관/.test(continuation)||contrast&&barrier(continuation.slice(contrast.index+contrast[0].length))||clauses.slice(1).some(barrier)||newHead&&!possibleReview)continue;
   task.context={type:'received-content',sourceEvent:{start:receipt.start,end:receipt.end,object:receipt.object,text:receipt.text},read:state.read,...(newHead?{relation:'possible-source-before-inquiry',inferred:true}:{})};
   if(task.kind==='open'&&state.read===false&&/(?:무엇|뭘|어디)(?:을|를)?(?:부터|먼저)|(?:무엇|뭘).{0,8}먼저/.test(text)){task.kind='action';task.goal='verify';}
  }
 }
 const api=Object.freeze({actor,predicate,waiting,relative,anaphoricWait,bindRequests});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_EVENT_EVIDENCE=api;
})(typeof globalThis==='object'?globalThis:this);
