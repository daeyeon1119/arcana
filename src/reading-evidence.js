/* Literal question evidence, independent of card meanings and UI.
 * A quoted user constraint is not an externally verified fact. No arithmetic,
 * personal history, missing actors, deadlines or outcomes are inferred here. */
(function(root){
 'use strict';
 const mask=text=>text.replace(/[“"「『][^”"」』]*[”"」』]/g,s=>' '.repeat(s.length));
 const normal=text=>String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const stopAt=(text,start)=>{for(let i=start;i<text.length;i++)if(/[.!?。！？]/.test(text[i])&&!(i>0&&/\d/.test(text[i-1])&&/\d/.test(text[i+1]||'')))return i;return text.length;};
 function clauses(text){
  const result=[],rx=/(?<!\d)[.!?。！？](?!\d)|(?:하지만|그러나|반면에)\s*|지만\s*/g;let start=0;
  const add=end=>{let a=start,b=end;while(a<b&&/\s/.test(text[a]))a++;while(b>a&&/\s/.test(text[b-1]))b--;if(b>a)result.push({start:a,end:b,text:text.slice(a,b)});};
  for(const match of text.matchAll(rx)){add(match.index);start=match.index+match[0].length;}add(text.length);return result;
 }
 function modality(text){
  if(/만약|가정|(?:다|라|으|이|하|되)면|할\s*경우|일\s*경우|한다고\s*치면/.test(text))return 'conditional';
  if(/전해\s*들|라고\s*(?:말|했|하)|다고\s*(?:말|했|하)|라는\s*말/.test(text))return 'reported';
  if(/예정|계획|할까|쓸까|가능할까|수\s*있을까|모르|모릅/.test(text))return 'uncertain';
  return 'asserted';
 }
 function extract(input){
  const question=normal(typeof input==='string'?input:input?.question),evidence=mask(question),parts=clauses(evidence),options=[];
  const labels=[...evidence.matchAll(/(^|[\s,.;])([AB])(?:안)?(?:은|는|:)\s*/g)];
  for(let i=0;i<labels.length;i++){
   const match=labels[i],label=match[2];if(options.some(item=>item.label===label))continue;
   let start=match.index+match[0].length,end=Math.min(labels[i+1]?.index??evidence.length,stopAt(evidence,start));
   while(start<end&&/\s/.test(evidence[start]))start++;
   const suffix=evidence.slice(start,end).match(/(?:이고|이며|또는|혹은)\s*$/);if(suffix)end=start+suffix.index;
   while(end>start&&/\s/.test(evidence[end-1]))end--;
   if(end>start)options.push({label,start,end,text:question.slice(start,end),sourceStart:match.index+match[1].length,sourceEnd:end});
  }
  const partFor=index=>parts.find(part=>part.start<=index&&index<part.end)||{start:0,end:evidence.length,text:evidence};
  const scopeFor=index=>options.find(option=>option.sourceStart<=index&&index<option.sourceEnd)?.label||'question';
  const stateFor=(index,end)=>{
   const part=partFor(index),prefix=evidence.slice(part.start,index),tail=evidence.slice(end,Math.min(part.end,end+18));
   const explicitNegative=/^(?:이|가|은|는|도)?\s*(?:아니|아닌|말고|제외)/.test(tail);
   const status=explicitNegative?'negated':modality(part.text),timeScope=/지금|현재|이번|이제/.test(part.text)?'current':/작년|예전|과거|지난|전에는/.test(part.text)?'past':'unspecified';
   const subjects=[...prefix.matchAll(/(저|제|나|내|친구|동료|상대|학생|자녀|그\s*사람)(?:는|은|가|이)의?\s*/g)],subject=subjects.at(-1)?.[1];
   const actor=subject? /^(?:저|제|나|내)$/.test(subject)?'self':'other':'unspecified';
   return {status,timeScope,actor,scope:scopeFor(index),clauseStart:part.start,clauseEnd:part.end};
  };
  const quantities=[],absoluteTimes=[];
  for(const [kind,rx]of [['clock',/(?:(?:오전|오후|아침|저녁|밤)\s*)?\d{1,2}시(?!간)(?:\s*\d{1,2}분)?/g],['date',/\d{1,2}월\s*\d{1,2}일/g]])for(const match of evidence.matchAll(rx)){
   const start=match.index,end=start+match[0].length;absoluteTimes.push({kind,text:question.slice(start,end),start,end,unit:kind,...stateFor(start,end),available:false});
  }
  const quantity=/(?:(?:매일|하루|주당|매주|주|월)\s*)?(?:(?:약|대략|최대|최소)\s*)?\d[\d,]*(?:\.\d+)?(?:\s*(?:~|〜|–|-|부터)\s*\d[\d,]*(?:\.\d+)?)?\s*(?:개월|시간|만\s*원|천\s*원|분|일|주|년|원|회|개|명|시)(?:\s*(?:정도|이내|이상|이하|밖에|내외))?/g;
  for(const match of evidence.matchAll(quantity)){
   if(absoluteTimes.some(item=>item.start<=match.index&&item.end>=match.index+match[0].length))continue;
   const start=match.index,end=start+match[0].length,unit=match[0].match(/개월|시간|만\s*원|천\s*원|분|일|주|년|원|회|개|명|시(?=\s|$)/g)?.at(-1),state=stateFor(start,end),part=partFor(start);
   const kind=/원/.test(unit||'')?'money':/분|시간|일|주|개월|년/.test(unit||'')?'duration':unit==='시'?'clock':'count';
   const available=kind==='duration'&&state.scope==='question'&&state.actor!=='other'&&state.status==='asserted'&&state.timeScope!=='past'&&/(?:쓸|사용할|확보할|낼)\s*수\s*있|(?:쓸|가용|가능한|연습|작업)\s*시간|시간(?:은|이|도)|시간.{0,12}(?:뿐|밖에)/.test(part.text);
   quantities.push({kind,text:question.slice(start,end),start,end,unit,...state,available});
  }
  quantities.push(...absoluteTimes);quantities.sort((a,b)=>a.start-b.start);
  const schedules=[];
  for(const match of evidence.matchAll(/(?:매주\s*)?(?:월|화|수|목|금|토|일)요일(?:\s*(?:오전|오후|저녁|아침|낮|밤))?|(?:평일|주말)(?:\s*(?:오전|오후|저녁|아침|낮|밤))?/g)){
   const start=match.index,end=start+match[0].length;schedules.push({kind:'schedule',text:question.slice(start,end),start,end,...stateFor(start,end)});
  }
  const verification=[];
  for(const part of parts){
   if(!/확인|대조|검토|검증|확정|맞췄/.test(part.text)||modality(part.text)!=='asserted')continue;
   const pending=/(?:아직|못|않|대조\s*중|확인\s*중|검토\s*중|검증\s*중)/.test(part.text),confirmed=/이미|마쳤|완료|맞췄|확인했|대조했|검토했|검증했|확정됐|확인했습니다|대조했습니다/.test(part.text);
   if(pending||confirmed)verification.push({status:pending?'unverified':'verified',text:question.slice(part.start,part.end),start:part.start,end:part.end});
  }
  return {version:84,question,options,quantities,schedules,verification};
 }
 const usable=item=>item.status==='asserted'&&item.timeScope!=='past';
 const api=Object.freeze({extract,usable});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_READING_EVIDENCE=api;
})(typeof globalThis==='object'?globalThis:this);
