/* Bounded Korean predicate/target binding. These are user-stated facts, not
 * independently verified information or proof supplied by tarot cards. */
(function(root){
 'use strict';
 const normal=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const questionText=typeof module==='object'&&module.exports?require('./question-text.js'):root.ARCANA_QUESTION_TEXT,mask=questionText.mask;
 const person=/^(?:저|제|나|내|동료|친구|담당자|상대|학생|자녀|그사람)$/;
 const temporal=/^(?:오늘|현재|지금|이번|어제|작년|예전|과거|지난\s*(?:주|달|해))(?:에)?$/;
 const rootWord='(?:확인|대조|검토|검증|확정|점검|맞췄)';
 const predicate=new RegExp('(?:미'+rootWord+'(?:된|인)?|'+rootWord+'(?:(?:이|가)\\s*(?:끝난|끝났|완료된)|[을은는]?\\s*(?:(?:하지|되지)\\s*(?:못했|않았|못한|않은)|(?:안|못)\\s*(?:했|한)|완료했|완료한|완료된|완료|마쳤|마친|했|한|된|됐|중인|중|전))|맞췄)(?:습니다|어요|입니다|이다|다|고|으며|지만)?','g');
 const adverbs=/^(?:(?:이미|아직|오늘|지금|현재|이번|어제|작년|예전|먼저|실제로|정정하면|다시)\s+)+/;
 const relative=text=>/(?:만든|보낸|작성한|적힌|포함된|있는|없는|준|확인한)\s+/.test(text);
 function parts(text){
  const result=[];let start=0;
  const add=end=>{let a=start,b=end;while(a<b&&/\s/.test(text[a]))a++;while(b>a&&/\s/.test(text[b-1]))b--;if(a<b)result.push({start:a,end:b,text:text.slice(a,b)});};
  const cuts=[...text.matchAll(/[,;!?。！？]|(?:하지만|그러나|반면에)\s*|(?:했|됐|았|었)(?:고|으며|지만)\s*/g)].map(match=>({start:match.index,end:match.index+match[0].length,keep:/^(?:했|됐|았|었)/.test(match[0])}));
  for(let i=0;i<text.length;i++)if(text[i]==='.'&&!(/[^\s.,;!?。！？]/.test(text[i-1]||'')&&/[\w가-힣]/.test(text[i+1]||'')))cuts.push({start:i,end:i+1});
  cuts.sort((a,b)=>a.start-b.start);
  for(const cut of cuts){if(cut.start<start)continue;add(cut.keep?cut.end:cut.start);start=cut.end;}add(text.length);return result;
 }
 function framing(part,index,end){
  const before=part.text.slice(0,index),after=part.text.slice(end),local=part.text;
  const actors=[...before.matchAll(/(저|제|나|내|동료|친구|담당자|상대|학생|자녀)(?:는|은|이|가)\s*/g)].filter(match=>!relative(before.slice(match.index+match[0].length))),who=actors.at(-1)?.[1];
  const unknownAgent=[...before.matchAll(/([^\s,]+?)(?:는|은|이|가)\s+(?=[\s\S]*[을를]\s)/g)].some(match=>!temporal.test(match[1])&&!/(?:에|에서|에게)$/.test(match[1])&&!relative(before.slice(match.index+match[0].length)));
  const actor=who?/^(?:저|제|나|내)$/.test(who)?'self':'other':unknownAgent?'other':'unspecified';
  const modality=/만약|가정|(?:했|됐)(?:다면|으면)|이라면|라면|이면|(?:한|된)\s*경우/.test(local)?'conditional':/줄\s*알|생각했|(?:안\s*한|않은|못한)\s*(?:게|건|것(?:이|은)?)\s*(?:아니|아닙)/.test(local)?'uncertain':/^(?:고|는|며)\s*(?:들|전해)|다고\s*(?:말|했|하|들)|전해\s*들/.test(after)||/(?:다는|라고|다고)\s*(?:말|이야기|소식|얘기|주장|문구|표현|문장)/.test(local)?'reported':'asserted';
  const timeScope=/지금|현재|오늘|이번|이제/.test(local)?'current':/어제|지난|예전|과거|작년/.test(local)?'past':'unspecified';
  return {actor,modality,timeScope,correction:/정정|바로잡|알고\s*보니|실제로/.test(before),clauseStart:part.start,clauseEnd:part.end};
 }
 function prefixTarget(part,match){
  const prefix=part.text.slice(0,match.index),markers=[...prefix.matchAll(/([^\s,;]+?)(은|는|을|를|이|가)(?=\s|$)/g)].filter(item=>!person.test(item[1]));
  const last=markers.at(-1);if(!last)return null;
  let start=0,end=last.index+last[1].length;
  const actors=[...prefix.slice(0,end).matchAll(/(?:저|제|나|내|동료|친구|담당자|상대|학생|자녀)(?:는|은|이|가)\s+/g)].filter(item=>!relative(prefix.slice(item.index+item[0].length,end)));if(actors.length)start=actors.at(-1).index+actors.at(-1)[0].length;
  if(/[을를]$/.test(last[0].trim())){const subjects=[...prefix.slice(0,last.index).matchAll(/([^\s,]+?)(?:는|은|이|가)\s+/g)].filter(item=>!temporal.test(item[1])&&!/(?:에|에서|에게)$/.test(item[1])&&!relative(prefix.slice(item.index+item[0].length,end)));if(subjects.length)start=Math.max(start,subjects.at(-1).index+subjects.at(-1)[0].length);}
  const timePrefix=prefix.slice(start,end).match(/^(?:오늘|현재|지금|이번|어제|작년|예전|과거)(?:에는|은|는|에)?\s+/);if(timePrefix)start+=timePrefix[0].length;
  const leading=prefix.slice(start,end).match(adverbs);if(leading)start+=leading[0].length;
  while(start<end&&/\s/.test(prefix[start]))start++;
  const text=prefix.slice(start,end);if(!text||text.length>70||/까요|했|하면서|할\s*때|하려|아니라/.test(text))return null;
  return {start:part.start+start,end:part.start+end};
 }
 function suffixTarget(part,match,next){
  let start=match.index+match[0].length,end=next?.index??part.text.length;
  while(start<end&&/\s/.test(part.text[start]))start++;
  let fragment=part.text.slice(start,end);
  const stateTail=fragment.match(/(?:와|과|및|그리고)\s*(?:이미|아직|다시|현재)?\s*$/);if(stateTail)end=start+stateTail.index;
  fragment=part.text.slice(start,end);
  const marker=fragment.match(/(?:은|는|을|를)(?=\s|$)/);if(marker)end=start+marker.index;
  else{
   const stop=fragment.search(/\s+(?:구별|구분|어떻게|무엇|알려|살펴|준비|설명|확인|비교)/);if(stop>=0)end=start+stop;
  }
  while(end>start&&/\s/.test(part.text[end-1]))end--;
  const text=part.text.slice(start,end);if(!text||text.length>70||/^(?:줄|경우|것처럼|듯|적이|적은)|했|입니다|할까요|주세요/.test(text))return null;
  return {start:part.start+start,end:part.start+end};
 }
 function extract(input){
  const question=normal(input),text=mask(question),facts=[],unbound=[];
  for(const part of parts(text)){
   const matches=[...part.text.matchAll(predicate)];
   for(let index=0;index<matches.length;index++){
    const match=matches[index],verb=match[0],pending=/^미|못|않|안\s*(?:했|한)|중|전/.test(verb),attributive=/(?:한|않은|된|중인|마친|끝난)$/.test(verb),stateComplement=/^\s*(?:상태|것|걸로|사실)/.test(part.text.slice(match.index+verb.length));
    const target=(attributive||/^미/.test(verb)&&!/(?:입니다|이다|다)$/.test(verb))&&!stateComplement?suffixTarget(part,match,matches[index+1]):prefixTarget(part,match);
    const frame=framing(part,match.index,match.index+verb.length),predicateSpan={start:part.start+match.index,end:part.start+match.index+verb.length,text:question.slice(part.start+match.index,part.start+match.index+verb.length)};
    if(!target){unbound.push({predicate:predicateSpan,...frame});continue;}
    const start=Math.min(target.start,predicateSpan.start),end=Math.max(target.end,predicateSpan.end);
    facts.push({status:pending?'unverified':'verified',text:question.slice(start,end),start,end,target:{...target,text:question.slice(target.start,target.end)},predicate:predicateSpan,basis:'user-stated',...frame});
   }
   // Only a directly following contrasted target may omit the verification verb.
   // Without an adjacent asserted verification, "아직" has no inferred meaning.
   const elided=part.text.match(/^(.+?)(?:은|는)\s*(아직(?:이에요|입니다|이야|이요|요)?)$/),previous=facts.at(-1);
   if(!matches.length&&elided&&previous?.modality==='asserted'&&previous.actor!=='other'&&/^\s*(?:하지만|반면에)?\s*$/.test(text.slice(previous.clauseEnd,part.start))){
    const target={start:part.start,end:part.start+elided[1].length,text:elided[1]},start=part.start,end=part.end,predicateSpan={start:end-elided[2].length,end,text:elided[2]};
    facts.push({status:'unverified',text:question.slice(start,end),start,end,target,predicate:predicateSpan,basis:'user-stated',inferredPredicate:true,...framing(part,part.text.length-elided[2].length,part.text.length)});
   }
  }
  return {facts,unbound};
 }
 function current(facts){
  const groups=new Map();
  for(const fact of facts.filter(item=>item.modality==='asserted'&&item.timeScope!=='past'&&item.actor!=='other'&&(item.scope===undefined||item.scope==='question'))){
   const key=fact.target.text.replace(/\s+/g,' ').trim().toLowerCase();if(!groups.has(key))groups.set(key,[]);groups.get(key).push(fact);
  }
  return [...groups.values()].map(items=>{
   const currentItems=items.some(item=>item.timeScope==='current')?items.filter(item=>item.timeScope==='current'):items,last=currentItems.at(-1),states=new Set(currentItems.map(item=>item.status));
   return {target:last.target,status:states.size===1||last.correction?last.status:'conflict',facts:currentItems};
  });
 }
 function advice(facts,operation){
  const groups=current(facts),confirmed=groups.filter(item=>item.status==='verified'),pending=groups.filter(item=>item.status==='unverified'),conflicts=groups.filter(item=>item.status==='conflict');
  const labels=items=>items.map(item=>'‘'+item.target.text+'’').join('·'),topic=items=>{const code=items.at(-1).target.text.charCodeAt(items.at(-1).target.text.length-1);return code>=0xac00&&code<=0xd7a3&&(code-0xac00)%28?'은':'는';},sentences=[];
  if(confirmed.length)sentences.push(operation==='communicate'?`확인한 ${labels(confirmed)}부터 설명하고, 확인한 근거도 함께 남겨 보세요.`:`확인한 ${labels(confirmed)}${topic(confirmed)} 준비나 수정에 반영하고, 확인 근거를 남겨 보세요.`);
  if(pending.length)sentences.push(operation==='communicate'?`${labels(pending)}${topic(pending)} 아직 확인 중인 내용으로 구분해 전달하고, 확인할 출처나 담당자를 정해 보세요.`:`아직 확인하지 못한 ${labels(pending)}${topic(pending)} 별도 확인 항목으로 남기고, 사용할 자료에 미확인 상태를 표시해 보세요.`);
  if(conflicts.length)sentences.push(`${labels(conflicts)}의 확인 여부가 서로 다르게 적혀 있습니다. 현재 상태부터 확인해 주세요.`);
  return {text:sentences.join(' '),groups};
 }
 function practical(text){
  // Replace only generic verification steps which the bound facts now cover.
  // Preserve reader order, editing, completion and specialized content checks.
  return text.replace('읽는 사람이 필요한 정보를 찾을 수 있는 순서로 설명하고, 확인된 내용과 아직 확인 중인 내용을 구별해 표시해 보세요.','읽는 사람이 필요한 정보를 찾기 쉬운 순서로 설명해 보세요.')
   .replace('사실을 설명하는 문장은 내용 자체를 원자료와 대조하고, 확인되지 않은 주장과 확인된 내용을 구별해 보세요. ','')
   .replace('이 자료에 쓰인 조건과 수치의 출처·기준일을 확인하고, 이미 대조한 항목과 아직 검토 중인 항목을 표시해 보세요.','이 자료에 쓰인 조건과 수치의 출처·기준일을 확인해 보세요.');
 }
 const api=Object.freeze({extract,current,advice,practical});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_VERIFICATION_FACTS=api;
})(typeof globalThis==='object'?globalThis:this);
