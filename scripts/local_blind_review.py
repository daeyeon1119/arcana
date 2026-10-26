"""Prepare a source-masked review; no reviewer scores or expert results are invented."""
from pathlib import Path
import base64
import hashlib
import json
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
folder = root / 'test-results/local-reader/native-first'
fixture = json.loads((root / 'tests/local-reader-first.json').read_text(encoding='utf-8'))
manifest = json.loads((root / 'assets/rws/manifest.json').read_text(encoding='utf-8'))
art_by_id = {c['id']: c for c in manifest['cards']}
cards_by_id, cases, key = {}, [], []
seed = 'arcana-local-first-review-2026-10-27'

for case in fixture['cases']:
    path = folder / (case['id'] + '.json')
    if not path.exists():
        cases.append({'id':case['id'], 'question':case['question'], 'kind':case['kind'], 'pending':True})
        continue
    row = json.loads(path.read_text(encoding='utf-8'))
    packet = row['packet']
    assert packet['question'] == case['question']
    assert [[c['id'], c['orientation'] == '역방향'] for c in packet['cards']] == case['cards']
    for card in packet['cards']:
        card_id = card['id']
        if card_id not in cards_by_id:
            raw = (root / 'assets/rws' / (card_id + '.jpg')).read_bytes()
            assert hashlib.sha256(raw).hexdigest() == art_by_id[card_id]['sha256']
            cards_by_id[card_id] = 'data:image/jpeg;base64,' + base64.b64encode(raw).decode('ascii')
    baseline = row['baseline']
    old = {'direct':baseline['direct'], 'actions':baseline['actions'], 'sections':[{'title':s['title'], 'body':s['body']} for s in baseline['sections']]}
    new = None
    if row.get('parsed') and row['validation']['ok']:
        parsed = row['parsed']
        new = {'direct':'\n\n'.join(r['text'] for r in parsed['requests']), 'actions':[r['text'] for r in parsed['actions']], 'sections':[{'title':'카드가 만드는 전체 흐름','body':parsed['synthesis']['text']}] + [{'title':c['position'], 'body':c['name']+' '+c['orientation']+' · '+c['meaning']+'\n'+parsed['cards'][c['ref']]} for c in packet['cards']]}
        if parsed['unknowns']:
            new['sections'].append({'title':'더 알아볼 점', 'body':'\n'.join(parsed['unknowns'])})
    swap = hashlib.sha256((seed + case['id']).encode()).digest()[0] % 2 == 1
    candidates = [old,new] if not swap else [new,old]
    mapping = {'A':'v82-rule-engine', 'B':'Qwen3-4B-local-single-stage'} if not swap else {'A':'Qwen3-4B-local-single-stage','B':'v82-rule-engine'}
    fingerprint = hashlib.sha256(json.dumps({'question':case['question'], 'cards':packet['cards'], 'candidates':candidates},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    cases.append({'id':case['id'], 'question':case['question'], 'kind':case['kind'], 'cards':packet['cards'], 'candidates':candidates, 'fingerprint':fingerprint})
    key.append({'id':case['id'], 'fingerprint':fingerprint, 'sources':mapping})

data = {'schemaVersion':1, 'dataset':'local-native-first', 'seed':seed, 'cases':cases, 'art':cards_by_id}
payload = json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
template = (root / 'src/local-blind-review.html').read_text(encoding='utf-8')
assert template.count('/*__REVIEW_DATA__*/null') == 1
if shutil.which('node'):
    script = template.split('<script>',1)[1].rsplit('</script>',1)[0]
    subprocess.run(['node','--check','--input-type=commonjs'],input=script.encode('utf-8'),check=True)
output = folder / 'blind-review.html'
output.write_text(template.replace('/*__REVIEW_DATA__*/null',payload), encoding='utf-8', newline='\n')
(folder / 'blind-key.json').write_text(json.dumps({'note':'Source key only. No human or expert review has been performed by this generator. Ratings must refer to the per-case fingerprint.','seed':seed,'cases':key},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Prepared {len(key)} recorded cases / {len(cases)} total. Zero reviewer scores generated. {len(cards_by_id)} original JPEGs verified.')
