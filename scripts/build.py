"""Bundle the reviewed v78 baseline and maintained sources into one offline HTML."""
from pathlib import Path
import base64
import hashlib
import json
import re
from save_artifact import save_text
from build_morphology import build as build_morphology
root = Path(__file__).resolve().parents[1]
base = (root / 'ARCANA_tarot_v78_source/html/ARCANA_tarot_v78.html').read_text(encoding='utf-8')
css = '\n'.join((root / p).read_text(encoding='utf-8') for p in ['src/arcana79.css','src/card-mat.css','src/question-context.css','src/web-app.css'])
language_bundle, language_meta = build_morphology()
js = language_bundle + '\n' + '\n'.join((root / p).read_text(encoding='utf-8') for p in ['src/question-text.js','src/korean-morphology.js','src/lexical-context.js','src/request-frame.js','src/arcana79.js','src/reading-polish.js','src/reading-synthesis.js','src/verification-facts.js','src/reading-evidence.js','src/event-evidence.js','src/question-model.js','src/reading-context.js','src/reading-language.js','src/work-guidance.js','src/task-policy.js','src/reading-task.js','src/reading-bridge.js','src/reading-grounded.js','src/card-mat.js','src/web-app.js'])
app_version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
engine_version = int(app_version.split('.')[0])
assert js.count('__ARCANA_APP_VERSION__') == 1
js = js.replace('__ARCANA_APP_VERSION__', app_version)
assert js.count('__ARCANA_READING_ENGINE__') == 1
js = js.replace('__ARCANA_READING_ENGINE__', str(engine_version))
manifest = json.loads((root / 'assets/rws/manifest.json').read_text(encoding='utf-8'))
art = {}
for card in manifest['cards']:
    raw = (root / 'assets/rws' / (card['id']+'.jpg')).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == card['sha256'], card['id']
    art[card['id']] = 'data:image/jpeg;base64,' + base64.b64encode(raw).decode('ascii')
assert len(art) == 78
art_js = 'const ARCANA_ORIGINAL_ART = ' + json.dumps(art, indent=1) + ';\n' + (root / 'src/original-art.js').read_text(encoding='utf-8')
# Remove both generations of synthetic fallback and the online/local mode selector.
base, count = re.subn(r'<script>\s*// Public-domain RWS image mirrors\..*?</script>', lambda _: '<script>\n'+art_js+'\n</script>', base, count=1, flags=re.S)
assert count == 1, 'Original image loader marker missing'
start = base.index('/* ARCANA v28 — self-contained 78-card symbolic illustrations; online RWS optional. */')
end = base.index('/* Versioned, local-only backup and safe merge-import. No external storage. */', start)
base = base[:start] + 'arcanaUseOriginalArt();\n' + base[end:]
# Initial heroes must not request a remote image while the document is parsing.
base = re.sub(r'(<img\b[^>]*data-card-id="[^"]+"[^>]*?)\s+src="https://[^"]+"', r'\1', base)
card_script = re.search(r'<script>const CARDS = (\[.*?\]);</script>', base, re.S)
assert card_script
cards = json.loads(card_script[1])
assert {card['id'] for card in cards} == set(art)
for card in cards:
    card['img'] = ''
replacement = '<script>const CARDS = ' + json.dumps(cards, ensure_ascii=False, separators=(',',':')) + ';\nCARDS.forEach(card=>{card.img=arcanaOriginalArt(card.id);});</script>'
base = base[:card_script.start()] + replacement + base[card_script.end():]
assert 'a22OfflineCard' not in base and 'arcanaArtPlaceholder' not in base
assert 'if(f.noConflict)' not in js, 'Unresolved placeholder'
assert '</script' not in js.lower()
bundle = f'\n<!-- ARCANA v{engine_version} maintained enhancement -->\n<style>\n{css}\n</style>\n<script>\n{js}\n</script>\n'
base = base.replace('ARCANA 78.0 |', f'ARCANA {app_version} |', 1)
web_head = '<link rel="manifest" href="./manifest.webmanifest"><meta name="theme-color" content="#17382f"><link rel="icon" href="./assets/app/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="./assets/app/apple-touch-icon.png">'
base = base.replace('</head>', web_head + '</head>')
assert base.count('</body>') == 1
save_text(root / 'index.html', base.replace('</body>', bundle+'</body>'))
app_bytes = (root / 'index.html').read_bytes()
app_sha = hashlib.sha256(app_bytes).hexdigest()
worker_template = (root / 'src/service-worker.js').read_text(encoding='utf-8')
web_files = ['manifest.webmanifest','assets/app/icon-192.png','assets/app/icon-512.png','assets/app/apple-touch-icon.png','assets/app/icon.svg']
def web_asset_bytes(path):
    source = root / path
    return source.read_text(encoding='utf-8').encode('utf-8') if source.suffix in {'.webmanifest','.svg'} else source.read_bytes()
release_hash = hashlib.sha256((app_sha+worker_template).encode()+b''.join(web_asset_bytes(path) for path in web_files)).hexdigest()
worker = worker_template.replace('__ARCANA_APP_SHA256__', app_sha).replace('__ARCANA_RELEASE_ID__', release_hash[:24])
save_text(root / 'sw.js', worker)
save_text(root / 'release.json', json.dumps({'appVersion':app_version,'readingEngine':engine_version,'appSHA256':app_sha,'appBytes':len(app_bytes),'webRelease':release_hash[:24],'languageAnalysis':language_meta}, indent=2)+'\n')
print(f'Built index.html (app {app_version}, reading engine {engine_version}), web cache, 78 original JPEGs embedded ({sum(c["bytes"] for c in manifest["cards"]):,} source bytes)')
