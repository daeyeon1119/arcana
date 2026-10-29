/* Balanced literal quotations shared by evidence, event and task parsing.
 * Masking preserves UTF-16 offsets; quoted statements are not personal facts. */
(function(root){'use strict';
 const pairs={'“':'”','"':'"','「':'」','『':'』','‘':'’',"'":"'"};
 function quotes(input){
  const text=String(input||''),result=[];
  for(let start=0;start<text.length;start++){
   const open=text[start],close=pairs[open];if(!close||open==="'"&&/[A-Za-z0-9]/.test(text[start-1]||''))continue;
   let end=start+1;
   for(;end<text.length;end++){
    if(text[end]==='\\'){end++;continue;}
    if(text[end]!==close)continue;
    if(/[’']/.test(close)&&/[A-Za-z]/.test(text[end-1]||'')&&/[A-Za-z]/.test(text[end+1]||''))continue;
    break;
   }
   if(end>=text.length)continue;
   result.push({start,end:end+1,text:text.slice(start+1,end),contentStart:start+1,contentEnd:end});start=end;
  }
  return result;
 }
 function mask(input){const text=String(input||''),spans=quotes(text);let result='',position=0;for(const span of spans){result+=text.slice(position,span.start)+' '.repeat(span.end-span.start);position=span.end;}return result+text.slice(position);}
 function sentences(input){
  const text=String(input||''),result=[];let start=0;
  for(let i=0;i<text.length;i++){
   if(!/[.!?。！？]/.test(text[i]))continue;
   if(text[i]==='.'&&/[^\s.,;!?。！？]/.test(text[i-1]||'')&&/[A-Za-z0-9_-]/.test(text[i+1]||''))continue;
   const value=text.slice(start,i).trim();if(value)result.push(value);start=i+1;
  }
  const last=text.slice(start).trim();if(last)result.push(last);return result;
 }
 function requestHead(input){const text=String(input||''),cue=text.search(/어떻게|어떡|어디|어느|어떤|무엇|뭘|뭐/),link=cue<0?null:[...text.matchAll(/(?:해야|[가-힣]*(?:아야|어야|여야|쳐야|춰야|려야|뤄야|봐야|돼야|내야|가야|와야|써야|줘야))\s+(?=[\s\S]*(?:수\s*있|좋을|가능))/g)].find(match=>match.index>=cue);return link?text.slice(0,link.index+link[0].trimEnd().length):text;}
 const api=Object.freeze({quotes,mask,sentences,requestHead});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_QUESTION_TEXT=api;
})(typeof globalThis==='object'?globalThis:this);
