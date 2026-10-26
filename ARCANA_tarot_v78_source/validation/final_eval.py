from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path('/mnt/data/arcana_v78_work')
rows=json.loads((root/'holdout_final_48.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 page=b.new_page(reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(Path('/mnt/data/ARCANA_tarot_v78.html').read_text(),wait_until='domcontentloaded')
 j='''rows=>rows.map(r=>{
 const cs=[{id:'cu06',rev:false},{id:'sw04',rev:true},{id:'ar19',rev:false}];
 const old=__arcana65Build(r.question,'three',cs),base=__arcana72Build(r.question,'three',cs),test=__arcana78Build(r.question,'three',cs);
 return {q:r.question,expected:r.expected,v65:old.arc65.scene.intent,v72:base.arc72.scene.intent,v78:test.arc78.intent.primary};
 })'''
 data=page.evaluate(j,rows)
 stats={x:{'correct':sum(d[x]==d['expected'] for d in data),'total':len(data)} for x in ('v65','v72','v78')}
 out={'holdout':stats,'cases':data,'errors':errors}
 (root/'final_holdout_results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 print(json.dumps(stats,ensure_ascii=False,indent=2))
 print('misses',sum(x['v78']!=x['expected'] for x in data))
 b.close()
