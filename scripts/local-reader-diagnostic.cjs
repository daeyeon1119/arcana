/* Opt-in, genuinely local inference. No paid API, no question upload, no mocked quality result. */
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const core=require('../src/local-reader-core.js'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const fixture=JSON.parse(fs.readFileSync('tests/local-reader-first.json','utf8'));
const folder='test-results/local-reader/first',canonical=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
(async()=>{
 if(process.env.ARCANA_MODEL_DIAGNOSTIC!=='1')throw Error('Set ARCANA_MODEL_DIAGNOSTIC=1 to explicitly run the free multi-GB on-device model diagnostic.');
 fs.mkdirSync(folder,{recursive:true});
 const freeze={appSHA256:hash(fs.readFileSync('index.html')),contractSHA256:hash(canonical('src/local-reader-core.js')),fixtureSHA256:hash(canonical('tests/local-reader-first.json')),runtime:fixture.runtime,model:fixture.model,temperature:0.4,top_p:0.9,max_tokens:1800,seed:830027};
 if(fs.existsSync(folder+'/freeze.json'))require('node:assert/strict').deepEqual(JSON.parse(fs.readFileSync(folder+'/freeze.json','utf8')),freeze,'First diagnostic must not be overwritten by a different prompt/fixture/runtime.');
 else fs.writeFileSync(folder+'/freeze.json',JSON.stringify(freeze,null,2));
 const b=await require('./browser.cjs')();try{
  const p=await b.newPage(),network=[],errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{if(!r.url().startsWith(b.appURL))network.push({method:r.method(),origin:new URL(r.url()).origin,hasBody:!!r.postData()});});
  let lastLog=0;p.on('console',m=>{if(m.type()==='error'||Date.now()-lastLog>15000){console.log(m.text().slice(0,350));lastLog=Date.now();}});
  await p.goto(b.appURL,{waitUntil:'domcontentloaded'});
  const packets=await p.evaluate(cases=>cases.map(c=>({id:c.id,input:{question:c.question,spread:SPREADS[c.spread].title,cards:c.cards.map(([id,rev],i)=>{const card=CARD_BY_ID.get(id),slot=SPREADS[c.spread].slots[i];if(!card||!slot)throw Error('Invalid fixed card');return {id,rev,name:card.ko,position:slot[0],positionMeaning:slot[1],meaning:rev?card.rev:card.up};})},baseline:__arcana79Build(c.question,c.spread,c.cards.map(([id,rev])=>({id,rev})))})),fixture.cases);
  const hardware=await p.evaluate(async()=>{const a=await navigator.gpu?.requestAdapter(),s=await navigator.storage?.estimate();return {secure:isSecureContext,adapter:!!a,adapterInfo:a?{vendor:a.info.vendor,architecture:a.info.architecture,device:a.info.device,description:a.info.description}:null,storage:s,features:a?[...a.features]:[]};});
  fs.writeFileSync(folder+'/environment.json',JSON.stringify(hardware,null,2));
  if(!hardware.adapter)throw Error('No WebGPU adapter; no quality outputs generated.');
  const loadStart=Date.now();const record=await p.evaluate(async({runtime,model})=>{const m=await import(runtime);globalThis.arc83DiagnosticEngine=await m.CreateMLCEngine(model,{initProgressCallback:x=>console.log(x.text),logLevel:'WARN'});return m.prebuiltAppConfig.model_list.find(x=>x.model_id===model);},fixture);
  const runtime={record,loadMs:Date.now()-loadStart};fs.writeFileSync(folder+'/runtime.json',JSON.stringify(runtime,null,2));
  const results=[];
  for(const c of fixture.cases){
   const outputPath=folder+'/'+c.id+'.json';
   if(fs.existsSync(outputPath)){results.push(JSON.parse(fs.readFileSync(outputPath,'utf8')));console.log(c.id+' preserved prior first output');continue;}
   const stored=packets.find(x=>x.id===c.id),packet=core.packet(stored.input),started=Date.now();console.log('Generating '+c.id+' ('+c.spread+')');
   let response,error;try{response=await p.evaluate(async({messages,schema,options})=>arc83DiagnosticEngine.chat.completions.create({...options,messages,response_format:{type:'json_object',schema:JSON.stringify(schema)},extra_body:{enable_thinking:false}}),{messages:core.messages(packet),schema:core.schema(packet),options:{temperature:freeze.temperature,top_p:freeze.top_p,max_tokens:freeze.max_tokens,seed:freeze.seed}});}catch(e){error=String(e.message||e);}
   const raw=response?.choices?.[0]?.message?.content||'';let parsed,parseError;try{parsed=JSON.parse(raw);}catch(e){parseError=e.message;}
   const validation=parsed?core.validate(packet,parsed):{ok:false,issues:['invalid-or-empty-json']};
   const result={...c,packet,baseline:stored.baseline,raw,parsed,parseError,error,validation,finishReason:response?.choices?.[0]?.finish_reason,usage:response?.usage,elapsedMs:Date.now()-started};
   fs.writeFileSync(outputPath,JSON.stringify(result,null,2));results.push(result);console.log(JSON.stringify({id:c.id,valid:validation.ok,issues:validation.issues,finishReason:result.finishReason,elapsedMs:result.elapsedMs}));
   fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,last:c.id,terminal:false},null,2));
   if(error)throw Error(error);
  }
  const summary={...freeze,note:fixture.note,readings:results.length,structurePassed:results.filter(r=>r.validation.ok).length,qualityReviewed:0,network:{requests:network.length,methods:[...new Set(network.map(x=>x.method))],questionUploadObserved:network.some(x=>x.hasBody),origins:[...new Set(network.map(x=>x.origin))]},errors};
  fs.writeFileSync(folder+'/summary.json',JSON.stringify(summary,null,2));fs.writeFileSync(folder+'/progress.json',JSON.stringify({completed:results.length,total:fixture.cases.length,terminal:true},null,2));console.log(JSON.stringify(summary,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
