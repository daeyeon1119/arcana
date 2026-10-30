"""Build the pinned, network-free Garu adapter and inline asset block."""
from pathlib import Path
import json, hashlib, base64
from save_artifact import save_text

root = Path(__file__).resolve().parents[1]
vendor = root / 'vendor/garu/0.11.0'

def build():
    manifest = json.loads((vendor / 'manifest.json').read_text(encoding='utf-8'))
    for record in manifest['files']:
        data = (vendor / record['path']).read_bytes()
        assert len(data) == record['bytes'] and hashlib.sha256(data).hexdigest() == record['sha256'], record['path']
    source = (vendor / 'upstream/garu_wasm.js').read_text(encoding='utf-8')
    assert source.count('export class GaruWasm') == 1
    source = source.replace('export class GaruWasm', 'class GaruWasm')
    imported = 'import * as import1 from "./snippets/garu-core-4cd6f92ead9d35cd/inline0.js"'
    assert source.count(imported) == 1
    source = source.replace(imported, 'const import1={performance_now:()=>performance.now()};')
    # Only initSync is used: eliminate both unused network/URL loaders.
    a, b = source.index('async function __wbg_load('), source.index('function initSync(')
    source = source[:a] + source[b:]
    source = source[:source.index('async function __wbg_init(')]
    assert 'import.meta' not in source and 'fetch(' not in source and 'export ' not in source
    runtime = '''/* Generated from garu-ko 0.11.0. Copyright 2026 Yongjin Cho.
 * Apache-2.0 engine; see 0.11.0/LICENSE and data notices.
 * Adaptation: sync-only inline/CommonJS wrapper; unchanged WASM/model bytes. */
(function(root){'use strict';
 function create(wasmBytes,modelBytes){
''' + source + '''
  initSync({module:wasmBytes});
  const instance=new GaruWasm(modelBytes,false);
  return Object.freeze({analyze:text=>instance.analyze(text),free:()=>instance.free()});
 }
 const api=Object.freeze({create});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_GARU_VENDOR=api;
})(typeof globalThis==='object'?globalThis:this);
'''
    save_text(root / 'vendor/garu/runtime.cjs', runtime)
    meta = {'backend':'garu-ko','version':manifest['version'],'modelSHA256':hashlib.sha256((vendor/'base.gmdl').read_bytes()).hexdigest(),'wasmSHA256':hashlib.sha256((vendor/'garu_wasm_bg.wasm').read_bytes()).hexdigest()}
    encoded = {key:base64.b64encode((vendor/name).read_bytes()).decode('ascii') for key,name in [('wasm','garu_wasm_bg.wasm'),('model','base.gmdl')]}
    notices = '\n\n'.join((vendor/name).read_text(encoding='utf-8') for name in ['NOTICE','models/NOTICE.md','LICENSE','models/licenses/CC-BY-SA-2.0-KR.txt','models/licenses/MeCab-AUTHORS.txt','models/licenses/MeCab-CONTRIBUTORS.txt'])
    assets = 'const ARCANA_GARU_ASSETS='+json.dumps({**encoded,'meta':meta},ensure_ascii=False)+';\nconst ARCANA_MORPHOLOGY_NOTICES='+json.dumps(notices,ensure_ascii=False).replace('<','\\u003c')+';\n'
    assert '</script' not in (runtime+assets).lower()
    return runtime+assets, meta

if __name__ == '__main__':
    block, meta = build()
    print(json.dumps({'runtime':'vendor/garu/runtime.cjs','inlineBytes':len(block.encode('utf-8')),**meta},indent=2))
