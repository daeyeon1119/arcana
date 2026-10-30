"""Rebuild a separate CRLF copy and compare exact public release bytes."""
from pathlib import Path
import tempfile,shutil,subprocess,sys,hashlib,json
from save_artifact import save_text

root=Path(__file__).resolve().parents[1]
(root/'.cache').mkdir(exist_ok=True)
target=Path(tempfile.mkdtemp(prefix='release-crlf-',dir=root/'.cache'))
for folder in ['src','assets','vendor','ARCANA_tarot_v78_source']:
    shutil.copytree(root/folder,target/folder)
(target/'scripts').mkdir()
for name in ['scripts/build.py','scripts/build_morphology.py','scripts/save_artifact.py','package.json','manifest.webmanifest']:
    shutil.copy2(root/name,target/name)
for folder in ['src','assets']:
    for path in (target/folder).rglob('*'):
        if path.is_file() and path.suffix in {'.js','.css','.svg','.json'}:
            path.write_bytes(path.read_text(encoding='utf-8').replace('\n','\r\n').encode('utf-8'))
path=target/'manifest.webmanifest'
path.write_bytes(path.read_text(encoding='utf-8').replace('\n','\r\n').encode('utf-8'))
subprocess.run([sys.executable,str(target/'scripts/build.py')],check=True,cwd=target)
checks={name:(root/name).read_bytes()==(target/name).read_bytes() for name in ['index.html','sw.js','release.json']}
assert all(checks.values()),checks
release=json.loads((root/'release.json').read_text(encoding='utf-8'))
assert hashlib.sha256((root/'index.html').read_bytes()).hexdigest()==release['appSHA256']
result={'release':release,'checks':checks,'note':'Actual rebuild in a separate copy with CRLF sources, manifest and SVG files. JPEG/PNG bytes unchanged. Public output bytes match exactly. Not a semantic quality or physical-device evaluation.'}
save_text(root/f'test-results/build-repro-v{release["readingEngine"]}.json',json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
