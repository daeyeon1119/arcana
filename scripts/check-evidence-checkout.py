"""Check committed public/evidence bytes in a real autocrlf=true Git checkout."""
from pathlib import Path
import subprocess,tempfile,json,hashlib

root=Path(__file__).resolve().parents[1]
def git(*args,cwd=root):
    return subprocess.check_output(['git',*args],cwd=cwd,stderr=subprocess.PIPE)
commit=git('rev-parse','HEAD').decode().strip()
paths=['.gitattributes','index.html','sw.js','release.json','test-results/portable-summary.json','test-results/v86-validation.json','test-results/verification/first/readings.json','test-results/verification/first/summary.json','test-results/verification/regression/readings.json','test-results/alignment/first/readings.json','test-results/grounding/first/readings.json']
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
result={'release':release,'sourceCommit':commit,'coreAutocrlf':True,'committedByteHashes':checks,'allByteEqual':True,'note':'Actual separate sparse Git clone/checkout with core.autocrlf=true. Public and first/regression evidence bytes equal committed blobs. No reading regeneration or semantic/expert score.'}
output=root/f'test-results/checkout-repro-v{release["readingEngine"]}.json'
temp=output.with_suffix('.json.tmp');temp.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n');temp.replace(output)
print(json.dumps(result,indent=2))
