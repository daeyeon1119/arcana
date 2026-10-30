/* Pinned local Korean morphology. No fetch, worker service or question upload. */
(function(root){'use strict';
 const common=typeof module==='object'&&module.exports;
 let runtime=null,meta=null,failure=null;const cache=new Map();
 function source(){
  if(common){
   const fs=require('node:fs'),path=require('node:path'),base=path.join(__dirname,'../vendor/garu/0.11.0'),manifest=require('../vendor/garu/0.11.0/manifest.json');
   const record=name=>manifest.files.find(f=>f.path===name);
   return {factory:require('../vendor/garu/runtime.cjs'),wasm:new Uint8Array(fs.readFileSync(path.join(base,'garu_wasm_bg.wasm'))),model:new Uint8Array(fs.readFileSync(path.join(base,'base.gmdl'))),meta:{backend:'garu-ko',version:manifest.version,modelSHA256:record('base.gmdl').sha256,wasmSHA256:record('garu_wasm_bg.wasm').sha256}};
  }
  const assets=ARCANA_GARU_ASSETS,bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  return {factory:root.ARCANA_GARU_VENDOR,wasm:bytes(assets.wasm),model:bytes(assets.model),meta:assets.meta};
 }
 function ensure(){
  if(runtime)return true;if(failure)return false;
  try{const s=source();meta=Object.freeze({...s.meta});runtime=s.factory.create(s.wasm,s.model);return true;}
  catch(error){failure=String(error?.message||error);return false;}
 }
 function status(){return Object.freeze({...meta,ready:!!runtime,failed:!!failure});}
 function analyze(input){
  const text=String(input||'');if(!ensure())return null;
  if(!text.trim())return Object.freeze({text,tokens:[],words:[],ready:true});
  if(cache.has(text)){const value=cache.get(text);cache.delete(text);cache.set(text,value);return value;}
  try{
   // Rust reports scalar-value offsets. Convert once to JavaScript UTF-16 so
   // emoji and other astral characters do not shift literal evidence spans.
   const offsets=[0];for(const char of text)offsets.push(offsets.at(-1)+char.length);
   const tokens=runtime.analyze(text).tokens.map(t=>Object.freeze({text:t.text,pos:t.pos,start:offsets[t.start],end:offsets[t.end]})),groups=new Map();
   if(tokens.some(t=>!Number.isInteger(t.start)||!Number.isInteger(t.end)))throw new Error('Invalid language-analysis span');
   // Garu offsets describe whole eojeol spans, not individual morpheme offsets.
   // Keep literal word spans separate; do not pretend a particle owns the span.
   for(const token of tokens){const key=token.start+':'+token.end;if(!groups.has(key))groups.set(key,{start:token.start,end:token.end,text:text.slice(token.start,token.end),tokens:[]});groups.get(key).tokens.push(token);}
   const words=[...groups.values()].map(w=>Object.freeze({...w,tokens:Object.freeze(w.tokens)}));
   const result=Object.freeze({text,ready:true,tokens:Object.freeze(tokens),words:Object.freeze(words)});cache.set(text,result);if(cache.size>512)cache.delete(cache.keys().next().value);return result;
  }catch(error){return null;}
 }
 function actor(text,index,excluded=[]){
  const prefix=text.slice(0,index),analysis=analyze(prefix);if(!analysis)return null;
  const candidates=[];
  for(const word of analysis.words){
   if(excluded.some(s=>word.start>=s.start&&word.start<s.end))continue;
   const particle=word.tokens.find(t=>t.pos==='JKS'||t.pos==='JX'&&/^(?:은|는|도)$/.test(t.text));
   const nouns=word.tokens.filter(t=>/^(?:NNG|NNP|NP|SL|SH)$/.test(t.pos));if(!particle||!nouns.length)continue;
   if(word.tokens.some(t=>/^(?:VV|VA|VX|XSV|XSA|ETM)$/.test(t.pos)))continue;
   const leading=analysis.words.filter(w=>w.end<=word.start);
   if(particle.pos==='JX'&&leading.some(w=>w.tokens.some(t=>!/^(?:SW|SF|SP|SS|SSC|SSO|SE|SO|MAG|MAJ|JX|JKB)$/.test(t.pos)&&!/^(?:오늘|어제|지금|이번|다음|내일|당시|전날|현재)$/.test(t.text))))continue;
   const name=nouns.map(t=>t.text).join('');if(/^(?:오늘|어제|지금|이번|다음|내일|당시|전날|현재)$/.test(name))continue;
   const literal=word.text.replace(/[.!?。！？,;]+$/,'');
   candidates.push({actor:/^(?:저|제|나|내|우리|저희)$/.test(name)?'self':'other',evidence:literal,start:word.start,source:'morphological-nominal-subject'});
  }
  return candidates.at(-1)||null;
 }
 const api=Object.freeze({analyze,actor,status});if(common)module.exports=api;else root.ARCANA_KOREAN_MORPHOLOGY=api;
})(typeof globalThis==='object'?globalThis:this);
