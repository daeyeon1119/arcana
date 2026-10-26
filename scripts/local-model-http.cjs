/* Loopback-only transport with an explicit total deadline; no redirects or paid endpoint. */
const http=require('node:http');
module.exports=function postLocalJSON(endpoint,data,{timeoutMs=900000,maxBytes=5*1024*1024}={}){
 const url=new URL(endpoint);
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password||url.search||url.hash||url.pathname!=='/v1/chat/completions')throw Error('Only the local model completion endpoint is allowed.');
 const body=JSON.stringify(data);
 return new Promise((resolve,reject)=>{
  let done=false;const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(result);};
  const req=http.request(url,{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},res=>{
   if(res.statusCode!==200){res.resume();finish(Error('Local model HTTP '+res.statusCode+'; redirects are not followed.'));return;}
   let count=0;const chunks=[];
   res.on('data',chunk=>{count+=chunk.length;if(count>maxBytes){res.destroy(Error('Local model response too large.'));return;}chunks.push(chunk);});
   res.on('error',error=>finish(error));res.on('aborted',()=>finish(Error('Local model response interrupted.')));
   res.on('end',()=>{try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{finish(Error('Local model returned invalid API JSON.'));}});
  });
  const timer=setTimeout(()=>{const error=Error('Local model deadline exceeded.');error.code='LOCAL_TIMEOUT';req.destroy(error);},timeoutMs);
  req.on('error',error=>finish(error));req.end(body);
 });
};
