from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
root=Path('/mnt/data/arcana_v78_work')
a=json.loads((root/'unseen_50.json').read_text())
b=json.loads((root/'robust_variants_150.json').read_text())
c=json.loads((root/'holdout_new_60.json').read_text())
rows=a+b+c
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1150,'height':760},reduced_motion='reduce')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(Path('/mnt/data/ARCANA_tarot_v78.html').read_text(),wait_until='domcontentloaded',timeout=60000)
 cl=page.evaluate('''rows=>rows.map(x=>({expected:x.expected,actual:arc78Intent(x.question,{}).primary,q:x.question}))''',rows)
 counts=[sum(x['actual']==x['expected'] for x in sl) for sl in (cl[:50],cl[50:200],cl[200:])]
 aggregate={'dev_original_50':{'correct':counts[0],'total':50},'dev_perturbed_150':{'correct':counts[1],'total':150},'new_holdout_60':{'correct':counts[2],'total':60},'readings':0,'runtime_errors':0,'invalid_refs':0,'fallbacks':0,'card_change_direct':0,'card_change_actions':0,'celtic_all_cards_covered':0,'celtic_readings':0,'samples':[], 'failed_intents_new_holdout':[x for x in cl[200:] if x['actual']!=x['expected']],'page_errors':[]}
 script='''(rows)=>{const output={readings:0,runtime_errors:0,invalid_refs:0,fallbacks:0,card_change_direct:0,card_change_actions:0,celtic_all_cards_covered:0,celtic_readings:0,samples:[]};
 for(const [qi,r] of rows.entries())for(const [si,spread] of Object.keys(SPREADS).entries()){
  const n=SPREADS[spread].slots.length,idx=qi*11+si*17;
  const cs=Array.from({length:n},(_,i)=>({id:CARDS[(idx+i*7)%78].id,rev:(i+qi+si)%5===0}));
  try{const a=__arcana78Build(r.question,spread,cs);const swap=cs.map((d,i)=>i===0?{id:CARDS[(idx+23)%78].id,rev:!d.rev}:d);const b=__arcana78Build(r.question,spread,swap);
   for(const res of [a,b]){output.readings++;if(res.arc78.audit?.some(x=>x==='invalid-evidence'))output.invalid_refs++;if(res.arc78.championSelected)output.fallbacks++;if(spread==='celtic'){output.celtic_readings++;if(new Set(res.sections.flatMap(x=>x.refs)).size===10)output.celtic_all_cards_covered++;}}
   if(a.direct!==b.direct)output.card_change_direct++;
   if(a.actions[0]!==b.actions[0])output.card_change_actions++;
   if(qi%14===0&&si===2&&output.samples.length<4)output.samples.push({q:r.question,spread,direct:a.direct,advice:a.actions[0]});
  }catch(e){output.runtime_errors++;}
 }
 return output;}'''
 t=time.time()
 # A chunk limits a single browser message and improves diagnostics.
 for off in range(0,len(rows),10):
  part=page.evaluate(script,rows[off:off+10])
  for k,v in part.items():
   if isinstance(v,int):aggregate[k]+=v
   elif isinstance(v,list):aggregate[k].extend(v)
  if off%40==0:print('checked',off+len(rows[off:off+10]),'of',len(rows),'readings',aggregate['readings'],flush=True)
 aggregate['page_errors']=errors
 aggregate['elapsed_seconds']=round(time.time()-t,2)
 (root/'quick_benchmark_results.json').write_text(json.dumps(aggregate,ensure_ascii=False,indent=2))
 print(json.dumps({k:v for k,v in aggregate.items() if k not in ('failed_intents_new_holdout','samples')},ensure_ascii=False,indent=2),flush=True)
 browser.close()
