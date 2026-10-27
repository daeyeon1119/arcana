/* Real, free loopback inference with a portable CPU runtime. Exits its own child on completion. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),core=require('../src/local-reader-core.js');
const postLocalJSON=require('./local-model-http.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const configAPI=require('./local-reader-config.cjs'),config=configAPI.setup(process.argv.slice(2));
const {resources,fixture,fixturePath,profileId,profile,staged,separated,selectedIds,limit,folder,cache}=config,planner=staged?require('../src/local-reader-planner.js'):null,separator=separated?require('../src/local-reader-separated.js'):null;
if(config.describe){console.log(JSON.stringify({profile:profileId,model:resources.model,folder,fixture:path.relative(process.cwd(),fixturePath),selectedCaseIds:fixture.cases.filter(c=>!selectedIds||selectedIds.includes(c.id)).slice(0,limit).map(c=>c.id),context:profile.context||8192,generation:profile.generation||{temperature:0.4,top_p:0.9},note:'Read-only description. No model starts, downloads or question uploads.'},null,2));process.exit(0);}
async function fileHash(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
(async()=>{
 if(process.env.ARCANA_MODEL_DIAGNOSTIC!=='1')throw Error('Explicitly set ARCANA_MODEL_DIAGNOSTIC=1 for free local inference.');
 const runtimeHashes=JSON.parse(fs.readFileSync(path.join(cache,'runtime-hashes.json'),'utf8'));
 for(const [name,sha]of Object.entries(runtimeHashes)){const file=path.resolve(cache,'runtime',name);assert(file.startsWith(path.join(cache,'runtime')+path.sep));assert.equal(await fileHash(file),sha,'Runtime changed: '+name);}
 const modelPath=path.join(cache,resources.model.filename);assert.equal(await fileHash(modelPath),resources.model.sha256,'Model hash mismatch');
 const binaries=Object.keys(runtimeHashes).filter(p=>path.basename(p)==='llama-server.exe');assert.equal(binaries.length,1);
 const executable=path.join(cache,'runtime',binaries[0]);
 fs.mkdirSync(folder,{recursive:true});
 const freeze=configAPI.freezeFor(config,{app:hash(fs.readFileSync('index.html')),contract:hash(canonical('src/local-reader-core.js')),fixture:hash(canonical(fixturePath)),planner:staged?hash(canonical('src/local-reader-planner.js')):undefined,separator:separated?hash(canonical('src/local-reader-separated.js')):undefined});
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
  const version=await (await fetch(endpoint+'/props')).json();assert.equal(path.resolve(version.model_path),modelPath,'Loopback server must run the verified local model');assert(String(version.build_info).startsWith('b11900-'),'Pinned runtime build required');const runtimeFile=folder+(fs.existsSync(folder+'/runtime.json')?'/runtime-resume-'+Date.now()+'.json':'/runtime.json');fs.writeFileSync(runtimeFile,JSON.stringify({loadMs:Date.now()-loadStarted,args:args.map(x=>x===modelPath?resources.model.filename:x),buildInfo:version.build_info||null,totalSlots:version.total_slots||null,modelPath:resources.model.filename,endpoint:'127.0.0.1 random port; this process only'},null,2));
  const complete=(messages,schema,options={})=>postLocalJSON(endpoint+'/v1/chat/completions',{model:'local',messages,temperature:freeze.temperature,top_p:freeze.top_p,...(profile.generation||{}),max_tokens:freeze.max_tokens,seed:freeze.seed,response_format:{type:'json_object',schema},chat_template_kwargs:{enable_thinking:false},...options});
  for(const c of fixture.cases.filter(c=>!selectedIds||selectedIds.includes(c.id)).slice(0,limit)){
   const outputPath=folder+'/'+c.id+'.json';if(fs.existsSync(outputPath)){results.push(JSON.parse(fs.readFileSync(outputPath,'utf8')));continue;}
   const stored=packets.find(x=>x.id===c.id),packet=core.packet(stored.input),started=Date.now();console.log('Generating '+c.id+' ('+c.spread+') on local CPU');
   let response,error,planResponse,questionPlan,planValidation,planMs,draftRecord;
   try{
    if(separated){
     const draftPath=folder+'/'+c.id+'.draft.json';
     if(fs.existsSync(draftPath)){draftRecord=JSON.parse(fs.readFileSync(draftPath,'utf8'));assert.deepEqual(draftRecord.packet,packet,'Persisted first draft belongs to another packet');}
     else{
      const draftStarted=Date.now(),draftResponse=await complete(separator.draftMessages(packet),separator.draftSchema(),{temperature:freeze.draftTemperature,max_tokens:freeze.draftMaxTokens});
      const draftRaw=draftResponse.choices?.[0]?.message?.content||'';let draft;try{draft=JSON.parse(draftRaw);}catch{}
      draftRecord={packet,draftRaw,draft,draftValidation:separator.validateDraft(packet,draft),draftUsage:draftResponse.usage,draftMs:Date.now()-draftStarted,draftFinishReason:draftResponse.choices?.[0]?.finish_reason};
      fs.writeFileSync(draftPath,JSON.stringify(draftRecord,null,2));
     }
     console.log(JSON.stringify({id:c.id,stage:'question-help',valid:draftRecord.draftValidation.ok,elapsedMs:draftRecord.draftMs}));
     if(draftRecord.draftValidation.ok&&draftRecord.draftFinishReason==='stop')response=await complete(separator.symbolicMessages(packet,draftRecord.draft),separator.symbolicSchema(packet));
    }
    if(staged){const planStarted=Date.now();planResponse=await complete(planner.planMessages(packet),planner.planSchema(),{temperature:freeze.planTemperature,max_tokens:freeze.planMaxTokens});planMs=Date.now()-planStarted;try{questionPlan=JSON.parse(planResponse.choices?.[0]?.message?.content||'');}catch{}planValidation=planner.validatePlan(packet,questionPlan);}
    if(!separated&&(!staged||planValidation.ok))response=await complete(staged?planner.readingMessages(packet,questionPlan):core.messages(packet),core.schema(packet));
   }catch(e){error=String(e.message||e);}
   const raw=response?.choices?.[0]?.message?.content||'';let parsed,parseError;try{parsed=JSON.parse(raw);}catch(e){parseError=e.message;}
   let validation=parsed?(separated?separator.validateSymbols(packet,parsed):core.validate(packet,parsed)):{ok:false,issues:['invalid-or-empty-json']};
   if(separated&&(!draftRecord?.draftValidation.ok||draftRecord.draftFinishReason!=='stop'))validation={ok:false,issues:[...validation.issues,'question-help-incomplete-or-invalid']};
   const result={...c,packet,baseline:stored.baseline,raw,parsed,parseError,error,validation,finishReason:response?.choices?.[0]?.finish_reason,usage:response?.usage,timings:response?.timings,elapsedMs:Date.now()-started};
   if(staged)Object.assign(result,{questionPlan,planValidation,planRaw:planResponse?.choices?.[0]?.message?.content,planUsage:planResponse?.usage,planMs});
   if(separated){Object.assign(result,draftRecord);if(validation.ok)result.generatedReport=separator.report(packet,draftRecord.draft,parsed);}
   fs.writeFileSync(outputPath,JSON.stringify(result,null,2));results.push(result);console.log(JSON.stringify({id:c.id,valid:validation.ok,issues:validation.issues,finishReason:result.finishReason,elapsedMs:result.elapsedMs}));
   fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,last:c.id,terminal:false},null,2));if(error)throw Error(error);
  }
  const summary={...freeze,note:fixture.note,readings:results.length,total:fixture.cases.length,structurePassed:results.filter(r=>r.validation.ok).length,qualityReviewed:0,network:'Only 127.0.0.1 inference. Browser external requests blocked. No provider API.',errors:results.filter(r=>r.error).map(r=>({id:r.id,error:r.error}))};
  fs.writeFileSync(folder+'/summary.json',JSON.stringify(summary,null,2));fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,terminal:true},null,2));console.log(JSON.stringify({...summary,runtime:resources.runtime.name,model:resources.model.name},null,2));
 }finally{if(child.exitCode===null){child.kill();await new Promise(resolve=>{const timer=setTimeout(resolve,5000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}fs.closeSync(out);fs.closeSync(err);}
})().catch(e=>{console.error(e);process.exitCode=1;});
