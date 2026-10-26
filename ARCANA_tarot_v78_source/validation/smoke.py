from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1160,'height':800},reduced_motion='reduce')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(Path('/mnt/data/ARCANA_tarot_v78.html').read_text(),wait_until='domcontentloaded',timeout=45000)
 r=page.evaluate('''()=>{const cs=['ar19','cu06','sw04','ar08','pe07','ar15','cu08','sw08','ar17','ar18'].map((id,i)=>({id,rev:i%4===0}));return {adversarial:__arcana78Adversarial(),cases:Object.keys(SPREADS).map(s=>{let c=cs.slice(0,SPREADS[s].slots.length);let r=__arcana78Build('친구에게 이미 연락했는데 답장이 오지 않아요. 어떻게 해야 할까요?',s,c);return {spread:s,intent:r.arc78.intent.primary,headline:r.headline,direct:r.direct,action:r.actions[0],sections:r.sections.length,grounding:r.arc78.grounding,errors:r.arc78.audit,champion:r.arc78.championSelected}}),cards:CARDS.length};}''')
 print(json.dumps({'errors':errors,'adversarial':r['adversarial'],'cases':[{k:v for k,v in x.items() if k!='grounding'} for x in r['cases']]},ensure_ascii=False,indent=2))
 Path('/mnt/data/arcana_v78_work/smoke.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
 b.close()
