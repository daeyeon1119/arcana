/* Literal question evidence, independent of card meanings and UI.
 * A quoted user constraint is not an externally verified fact. No arithmetic,
 * personal history, missing actors, deadlines or outcomes are inferred here. */
(function(root){
 'use strict';
 const mask=text=>text.replace(/[“"「『][^”"」』]*[”"」』]/g,s=>' '.repeat(s.length));
 const normal=text=>String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();
 const sentenceEnd=(text,index)=>{
  if(!/[.!?。！？]/.test(text[index]))return false;
  if(text[index]==='.'&&/[A-Za-z0-9_-]/.test(text[index+1]||'')&&/[\w가-힣]/.test(text[index-1]||''))return false;
  return true;
 };
 const stopAt=(text,start)=>{for(let i=start;i<text.length;i++)if(sentenceEnd(text,i))return i;return text.length;};
 const timeScope=text=>/지금|현재|이번|이제/.test(text)?'current':/작년|예전|과거|지난|전에는/.test(text)?'past':'unspecified';
 function clauses(text){
  const result=[],cuts=[...text.matchAll(/(?:하지만|그러나|반면에)\s*|지만\s*/g)].map(match=>({index:match.index,length:match[0].length}));let start=0;
  for(let index=0;index<text.length;index++)if(sentenceEnd(text,index))cuts.push({index,length:1});cuts.sort((a,b)=>a.index-b.index);
  const add=end=>{let a=start,b=end;while(a<b&&/\s/.test(text[a]))a++;while(b>a&&/\s/.test(text[b-1]))b--;if(b>a)result.push({start:a,end:b,text:text.slice(a,b)});};
  for(const cut of cuts){if(cut.index<start)continue;add(cut.index);start=cut.index+cut.length;}add(text.length);return result;
 }
 function modality(text){
  if(/만약|가정|(?:다|라|으|이|하|되)면|할\s*경우|일\s*경우|한다고\s*치면/.test(text))return 'conditional';
  if(/전해\s*들|라고\s*(?:말|했|하)|다고\s*(?:말|했|하)|라는\s*말/.test(text))return 'reported';
  if(/예정|계획|할까|쓸까|가능할까|수\s*있을까|모르|모릅|줄\s*알았|생각했/.test(text))return 'uncertain';
  return 'asserted';
 }
 function extract(input){
  const question=normal(typeof input==='string'?input:input?.question),evidence=mask(question),parts=clauses(evidence),options=[],optionDefinitions=[];
  const partFor=index=>parts.find(part=>part.start<=index&&index<part.end)||{start:0,end:evidence.length,text:evidence};
  const labels=[...evidence.matchAll(/(^|[\s,.;])([A-Z])(?:안)?(?:은|는|:)\s*/g)];
  for(let i=0;i<labels.length;i++){
   const match=labels[i],label=match[2];
   let start=match.index+match[0].length,end=Math.min(labels[i+1]?.index??evidence.length,stopAt(evidence,start),partFor(start).end);
   while(start<end&&/\s/.test(evidence[start]))start++;
   const suffix=evidence.slice(start,end).match(/(?:이고|이며|또는|혹은)\s*$/);if(suffix)end=start+suffix.index;
   while(end>start&&/\s/.test(evidence[end-1]))end--;
   if(end>start&&!/^(?:어떨|어떤|무엇|왜|궁금)/.test(evidence.slice(start,end))){
    const text=question.slice(start,end),defined=!/^(?:아직\s*)?(?:정하지\s*않|고르지\s*않|미정|없|모르|모릅)/.test(evidence.slice(start,end));
    optionDefinitions.push({label,start,end,text,defined,status:modality(partFor(start).text),timeScope:timeScope(partFor(start).text),sourceStart:match.index+match[1].length,sourceEnd:end});
   }
  }
  // Keep superseded spans too: replaced values cannot become global resources.
  for(const definition of optionDefinitions){const existing=options.findIndex(item=>item.label===definition.label);if(existing<0)options.push(definition);else options[existing]=definition;}
  const scopeFor=index=>optionDefinitions.find(option=>option.sourceStart<=index&&index<option.sourceEnd)?.label||'question';
  const stateFor=(index,end)=>{
   const part=partFor(index),prefix=evidence.slice(part.start,index),tail=evidence.slice(end,Math.min(part.end,end+18));
   const explicitNegative=/^(?:이|가|은|는|도)?\s*(?:아니|아닌|말고|제외)/.test(tail);
   const status=explicitNegative?'negated':modality(part.text),scopeTime=timeScope(part.text);
   const subjects=[...prefix.matchAll(/(저|제|나|내|친구|동료|상대|학생|자녀|그\s*사람)(?:는|은|가|이)의?\s*/g)],subject=subjects.at(-1)?.[1];
   const actor=subject? /^(?:저|제|나|내)$/.test(subject)?'self':'other':'unspecified';
   return {status,timeScope:scopeTime,actor,scope:scopeFor(index),clauseStart:part.start,clauseEnd:part.end};
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
   const resourceConfidence=/(?:쓸|사용할|확보할|낼|투자할|준비할|연습할)\s*수\s*있/.test(part.text)?6:/(?:가용|가능한|연습|작업|준비)\s*시간/.test(part.text)?3:1;
   const constraintRole=kind==='money'&&/예산|상한|한도|쓸\s*수\s*있는\s*(?:돈|금액|비용)/.test(part.text)?'budget':kind==='count'&&/수량|필요한|제작|인쇄|참가|준비할|만들/.test(part.text)?'quantity':null;
   quantities.push({kind,text:question.slice(start,end),start,end,unit,...state,available,resourceConfidence,constraintRole});
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
   if(pending||confirmed)verification.push({status:pending?'unverified':'verified',text:question.slice(part.start,part.end),start:part.start,end:part.end,timeScope:timeScope(part.text)});
  }
  return {version:84,question,options,optionDefinitions,quantities,schedules,verification};
 }
 const usable=item=>item.status==='asserted'&&item.timeScope!=='past';
 function chooseTime(evidence,taskText=''){
  const candidates=evidence.quantities.filter(item=>item.available&&usable(item));
  const ignored=new Set(['어떻게','무엇','어떤','지금','현재','이번','방법','방식','시간','정도','있는','좋을까요','알려','주세요','관점']);
  const terms=[...new Set((String(taskText).match(/[가-힣A-Za-z]{2,}/g)||[]).map(term=>term.replace(/(?:에게서|에게|에서|으로|부터|까지|처럼|하고|하는|할까요|할까|하면|할|를|을|은|는|이|가|의|에|도|와|과)$/,'').toLowerCase()).filter(term=>term.length>=2&&!ignored.has(term)))];
  const ranked=candidates.map(item=>{const clause=evidence.question.slice(item.clauseStart,item.clauseEnd).toLowerCase(),overlap=terms.filter(term=>clause.includes(term));return {item,score:(item.resourceConfidence||1)+(item.actor==='self'?3:0)+overlap.length*2,overlap};}).sort((a,b)=>b.score-a.score);
  const best=ranked[0],tied=best&&ranked.filter(item=>item.score===best.score);
  const value=best&&best.score>=3&&tied.length===1?best.item:null;
  return {value,reason:value?'matched-request':ranked.length?'unbound-or-ambiguous':'no-available-time',candidates:ranked.map(({item,score,overlap})=>({text:item.text,start:item.start,end:item.end,score,overlap}))};
 }
 const api=Object.freeze({extract,usable,chooseTime});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_READING_EVIDENCE=api;
})(typeof globalThis==='object'?globalThis:this);
