"""Check committed public/evidence bytes in a real autocrlf=true Git checkout."""
from pathlib import Path
import subprocess,tempfile,json,hashlib

root=Path(__file__).resolve().parents[1]
def git(*args,cwd=root):
    return subprocess.check_output(['git',*args],cwd=cwd,stderr=subprocess.PIPE)
commit=git('rev-parse','HEAD').decode().strip()
committed_release=json.loads(git('show',commit+':release.json'))
major=int(committed_release['readingEngine'])
paths=['.gitattributes','index.html','sw.js','release.json','test-results/portable-summary.json',f'test-results/v{major}-validation.json','test-results/verification/first/readings.json','test-results/verification/first/summary.json','test-results/alignment/first/readings.json','test-results/grounding/first/readings.json']
if major>=87:
    paths+=['device-check.html','scripts/device-check.js','test-results/lens/first/readings.json','test-results/lens/first/summary.json','test-results/lens/regression/readings.json']
else:
    paths+=['test-results/verification/regression/readings.json']
if major>=88:
    paths+=['test-results/event-state/first/readings.json','test-results/event-state/first/summary.json']
if major>=89:
    paths+=['test-results/lexical/first/readings.json','test-results/lexical/first/summary.json']
if major>=90:
    paths+=['test-results/request-frame/first/readings.json','test-results/request-frame/first/summary.json','tests/request-frame-first.json']
if major>=91:
    paths+=['test-results/interaction/first/readings.json','test-results/interaction/first/summary.json','tests/interaction-first.json']

target=Path(tempfile.mkdtemp(prefix='evidence-checkout-',dir=root/'.cache'))
git('-c','core.autocrlf=true','clone','--shared','--no-checkout',str(root),str(target))
git('config','core.autocrlf','true',cwd=target)
git('sparse-checkout','init','--no-cone',cwd=target)
git('sparse-checkout','set',*['/'+name for name in paths],cwd=target)
git('checkout','--detach',commit,cwd=target)
assert git('config','--get','core.autocrlf',cwd=target).decode().strip()=='true'
checks={}
for name in paths:
    if name=='.gitattributes':continue  # Its own line endings are not hashed.
    expected=git('show',commit+':'+name)
    actual=(target/name).read_bytes();assert actual==expected,name
    checks[name]=hashlib.sha256(actual).hexdigest()
release=json.loads((target/'release.json').read_text(encoding='utf-8'))
assert checks['index.html']==release['appSHA256']
summary=json.loads((target/'test-results/verification/first/summary.json').read_text(encoding='utf-8'))
assert checks['test-results/verification/first/readings.json']==summary['readingsSHA256']
if major>=87:
    summary=json.loads((target/'test-results/lens/first/summary.json').read_text(encoding='utf-8'))
    assert checks['test-results/lens/first/readings.json']==summary['readingsSHA256']
if major>=88:
    summary=json.loads((target/'test-results/event-state/first/summary.json').read_text(encoding='utf-8'))
    assert checks['test-results/event-state/first/readings.json']==summary['readingsSHA256']
if major>=89:
    summary=json.loads((target/'test-results/lexical/first/summary.json').read_text(encoding='utf-8'))
    assert checks['test-results/lexical/first/readings.json']==summary['readingsSHA256']
if major>=90:
    summary=json.loads((target/'test-results/request-frame/first/summary.json').read_text(encoding='utf-8'))
    assert checks['test-results/request-frame/first/readings.json']==summary['readingsSHA256']
if major>=91:
    summary=json.loads((target/'test-results/interaction/first/summary.json').read_text(encoding='utf-8'))
    assert checks['test-results/interaction/first/readings.json']==summary['readingsSHA256']
result={'release':release,'sourceCommit':commit,'coreAutocrlf':True,'committedByteHashes':checks,'allByteEqual':True,'note':'Actual separate sparse Git clone/checkout with core.autocrlf=true. Public and first/regression evidence bytes equal committed blobs. No reading regeneration or semantic/expert score.'}
output=root/f'test-results/checkout-repro-v{release["readingEngine"]}.json'
temp=output.with_suffix('.json.tmp');temp.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n');temp.replace(output)
print(json.dumps(result,indent=2))
