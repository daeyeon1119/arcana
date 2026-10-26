/* Real, free loopback inference with a portable CPU runtime. Exits its own child on completion. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),core=require('../src/local-reader-core.js');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const resources=JSON.parse(fs.readFileSync('scripts/local-reader-resources.json','utf8')),fixture=JSON.parse(fs.readFileSync('tests/local-reader-first.json','utf8'));
const staged=process.argv.includes('--staged'),planner=staged?require('../src/local-reader-planner.js'):null;
const folder='test-results/local-reader/'+(staged?'native-staged-first':'native-first'),cache=path.resolve('.cache/local-reader');
async function fileHash(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
(async()=>{
 if(process.env.ARCANA_MODEL_DIAGNOSTIC!=='1')throw Error('Explicitly set ARCANA_MODEL_DIAGNOSTIC=1 for free local inference.');
 const runtimeHashes=JSON.parse(fs.readFileSync(path.join(cache,'runtime-hashes.json'),'utf8'));
 for(const [name,sha]of Object.entries(runtimeHashes)){const file=path.resolve(cache,'runtime',name);assert(file.startsWith(path.join(cache,'runtime')+path.sep));assert.equal(await fileHash(file),sha,'Runtime changed: '+name);}
 const modelPath=path.join(cache,resources.model.filename);assert.equal(await fileHash(modelPath),resources.model.sha256,'Model hash mismatch');
 const binaries=Object.keys(runtimeHashes).filter(p=>path.basename(p)==='llama-server.exe');assert.equal(binaries.length,1);
 const executable=path.join(cache,'runtime',binaries[0]);
 fs.mkdirSync(folder,{recursive:true});
 const freeze={appSHA256:hash(fs.readFileSync('index.html')),contractSHA256:hash(canonical('src/local-reader-core.js')),fixtureSHA256:hash(canonical('tests/local-reader-first.json')),runtime:resources.runtime,model:resources.model,temperature:0.4,top_p:0.9,max_tokens:1800,seed:830027,context:8192,threads:4};
 if(staged)Object.assign(freeze,{plannerSHA256:hash(canonical('src/local-reader-planner.js')),planTemperature:0.2,planMaxTokens:600,stages:['question-without-cards','grounded-reading']});
 if(fs.existsSync(folder+'/freeze.json'))assert.deepEqual(JSON.parse(fs.readFileSync(folder+'/freeze.json','utf8')),freeze,'Preserve first outputs; use another directory for another candidate.');
 else fs.writeFileSync(folder+'/freeze.json',JSON.stringify(freeze,null,2));
 let packets;
 const b=await require('./browser.cjs')();try{const p=await b.newPage();await p.route('https://**/*',r=>r.abort());await p.goto(b.appURL,{waitUntil:'domcontentloaded'});
  packets=await p.evaluate(cases=>cases.map(c=>({id:c.id,input:{question:c.question,spread:SPREADS[c.spread].title,cards:c.cards.map(([id,rev],i)=>{const card=CARD_BY_ID.get(id),slot=SPREADS[c.spread].slots[i];return {id,rev,name:card.ko,position:slot[0],positionMeaning:slot[1],meaning:rev?card.rev:card.up};})},baseline:__arcana79Build(c.question,c.spread,c.cards.map(([id,rev])=>({id,rev})))})),fixture.cases);
 }finally{await b.close();}
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
 const out=fs.openSync(path.join(cache,'server.stdout.log'),'w'),err=fs.openSync(path.join(cache,'server.stderr.log'),'w');
 const args=['-m',modelPath,'--host','127.0.0.1','--port',String(port),'-c',String(freeze.context),'-t','4','-tb','4','-np','1','-ngl','0','--no-webui','--jinja','--reasoning','off'];
 const child=spawn(executable,args,{windowsHide:true,stdio:['ignore',out,err]});
 let launchError;child.on('error',e=>launchError=e);
 const endpoint='http://127.0.0.1:'+port,results=[];
 try{
  const loadStarted=Date.now();let ready=false;
  while(Date.now()-loadStarted<180000){if(launchError)throw launchError;if(child.exitCode!==null)throw Error('Local model server exited: '+child.exitCode);try{const r=await fetch(endpoint+'/health',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  if(!ready)throw Error('Local model did not become ready.');
  const version=await (await fetch(endpoint+'/props')).json();fs.writeFileSync(folder+'/runtime.json',JSON.stringify({loadMs:Date.now()-loadStarted,args:args.map(x=>x===modelPath?resources.model.filename:x),buildInfo:version.build_info||null,totalSlots:version.total_slots||null,modelPath:resources.model.filename,endpoint:'127.0.0.1 random port; this process only'},null,2));
  const limit=Number(process.argv.find(x=>x.startsWith('--limit='))?.slice(8)||fixture.cases.length);
  const complete=async(messages,schema,options={})=>{const r=await fetch(endpoint+'/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'local',messages,temperature:freeze.temperature,top_p:freeze.top_p,max_tokens:freeze.max_tokens,seed:freeze.seed,response_format:{type:'json_object',schema},chat_template_kwargs:{enable_thinking:false},...options}),signal:AbortSignal.timeout(900000)});if(!r.ok)throw Error('Local response '+r.status+': '+(await r.text()).slice(0,700));return r.json();};
  for(const c of fixture.cases.slice(0,limit)){
   const outputPath=folder+'/'+c.id+'.json';if(fs.existsSync(outputPath)){results.push(JSON.parse(fs.readFileSync(outputPath,'utf8')));continue;}
   const stored=packets.find(x=>x.id===c.id),packet=core.packet(stored.input),started=Date.now();console.log('Generating '+c.id+' ('+c.spread+') on local CPU');
   let response,error,planResponse,questionPlan,planValidation,planMs;
   try{
    if(staged){const planStarted=Date.now();planResponse=await complete(planner.planMessages(packet),planner.planSchema(),{temperature:freeze.planTemperature,max_tokens:freeze.planMaxTokens});planMs=Date.now()-planStarted;try{questionPlan=JSON.parse(planResponse.choices?.[0]?.message?.content||'');}catch{}planValidation=planner.validatePlan(packet,questionPlan);}
    if(!staged||planValidation.ok)response=await complete(staged?planner.readingMessages(packet,questionPlan):core.messages(packet),core.schema(packet));
   }catch(e){error=String(e.message||e);}
   const raw=response?.choices?.[0]?.message?.content||'';let parsed,parseError;try{parsed=JSON.parse(raw);}catch(e){parseError=e.message;}
   const validation=parsed?core.validate(packet,parsed):{ok:false,issues:['invalid-or-empty-json']};
   const result={...c,packet,baseline:stored.baseline,raw,parsed,parseError,error,validation,finishReason:response?.choices?.[0]?.finish_reason,usage:response?.usage,timings:response?.timings,elapsedMs:Date.now()-started};
   if(staged)Object.assign(result,{questionPlan,planValidation,planRaw:planResponse?.choices?.[0]?.message?.content,planUsage:planResponse?.usage,planMs});
   fs.writeFileSync(outputPath,JSON.stringify(result,null,2));results.push(result);console.log(JSON.stringify({id:c.id,valid:validation.ok,issues:validation.issues,finishReason:result.finishReason,elapsedMs:result.elapsedMs}));
   fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,last:c.id,terminal:false},null,2));if(error)throw Error(error);
  }
  const summary={...freeze,note:fixture.note,readings:results.length,total:fixture.cases.length,structurePassed:results.filter(r=>r.validation.ok).length,qualityReviewed:0,network:'Only 127.0.0.1 inference. Browser external requests blocked. No provider API.',errors:results.filter(r=>r.error).map(r=>({id:r.id,error:r.error}))};
  fs.writeFileSync(folder+'/summary.json',JSON.stringify(summary,null,2));fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,terminal:true},null,2));console.log(JSON.stringify({...summary,runtime:resources.runtime.name,model:resources.model.name},null,2));
 }finally{if(child.exitCode===null){child.kill();await new Promise(resolve=>{child.once('exit',resolve);setTimeout(resolve,5000);});}fs.closeSync(out);fs.closeSync(err);}
})().catch(e=>{console.error(e);process.exitCode=1;});
