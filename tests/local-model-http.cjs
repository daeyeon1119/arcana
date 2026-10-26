const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs');
const post=require('../scripts/local-model-http.cjs');
(async()=>{const checks=[];let mode='ok',received;
 const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;received=JSON.parse(body);if(mode==='redirect'){res.writeHead(302,{Location:'https://example.com/paid'}).end();return;}if(mode==='invalid'){res.end('not json');return;}if(mode==='large'){res.end(JSON.stringify({text:'가'.repeat(1000)}));return;}if(mode==='slow'){setTimeout(()=>res.end('{}'),150);return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({echo:received,local:true}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const endpoint='http://127.0.0.1:'+server.address().port+'/v1/chat/completions';
 const check=async(name,f)=>{await f();checks.push({name,ok:true});};
 try{
  await check('real loopback POST preserves Korean JSON',async()=>{const data={messages:[{role:'user',content:'진짜 질문 원문'}]};const r=await post(endpoint,data);assert.deepEqual(r.echo,data);assert.deepEqual(received,data);});
  await check('reject remote destinations before a request',async()=>{for(const url of ['https://api.example.com/v1/chat/completions','http://localhost:8080/v1/chat/completions','http://127.0.0.1.evil:8080/v1/chat/completions','http://user:pass@127.0.0.1:8080/v1/chat/completions','http://127.0.0.1:8080/v1/chat/completions?to=cloud'])assert.throws(()=>post(url,{}));});
  await check('local redirects cannot forward a question to a cloud service',async()=>{mode='redirect';await assert.rejects(post(endpoint,{}),/302/);});
  await check('invalid API JSON rejected',async()=>{mode='invalid';await assert.rejects(post(endpoint,{}),/invalid API JSON/);});
  await check('oversized local response rejected',async()=>{mode='large';await assert.rejects(post(endpoint,{}, {maxBytes:100}),/too large|interrupted/);});
  await check('total deadline includes waiting for response headers',async()=>{mode='slow';await assert.rejects(post(endpoint,{}, {timeoutMs:30}),e=>e.code==='LOCAL_TIMEOUT');});
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 const summary={total:checks.length,checks,note:'Actual local HTTP integration checks with a test server. No test response is presented as model or quality evidence.'};fs.writeFileSync('test-results/local-reader/transport-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
