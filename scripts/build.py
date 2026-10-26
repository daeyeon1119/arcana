"""Bundle the reviewed v78 baseline plus maintained v79 sources into one offline HTML."""
from pathlib import Path
import base64
import hashlib
import json
import re
root = Path(__file__).resolve().parents[1]
base = (root / 'ARCANA_tarot_v78_source/html/ARCANA_tarot_v78.html').read_text(encoding='utf-8')
css = (root / 'src/arcana79.css').read_text(encoding='utf-8')
js = (root / 'src/arcana79.js').read_text(encoding='utf-8')
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
bundle = f'\n<!-- ARCANA v79 maintained enhancement -->\n<style>\n{css}\n</style>\n<script>\n{js}\n</script>\n'
base = base.replace('ARCANA 78.0 |', 'ARCANA 79.0 |', 1)
assert base.count('</body>') == 1
(root / 'index.html').write_text(base.replace('</body>', bundle+'</body>'), encoding='utf-8', newline='\n')
print(f'Built index.html (ARCANA 79), 78 original JPEGs embedded ({sum(c["bytes"] for c in manifest["cards"]):,} source bytes)')
