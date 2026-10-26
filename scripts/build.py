"""Bundle the reviewed v78 baseline plus maintained v79 sources into one offline HTML."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
base = (root / 'ARCANA_tarot_v78_source/html/ARCANA_tarot_v78.html').read_text(encoding='utf-8')
css = (root / 'src/arcana79.css').read_text(encoding='utf-8')
js = (root / 'src/arcana79.js').read_text(encoding='utf-8')
assert 'if(f.noConflict)' not in js, 'Unresolved placeholder'
assert '</script' not in js.lower()
bundle = f'\n<!-- ARCANA v79 maintained enhancement -->\n<style>\n{css}\n</style>\n<script>\n{js}\n</script>\n'
base = base.replace('ARCANA 78.0 |', 'ARCANA 79.0 |', 1)
assert base.count('</body>') == 1
(root / 'index.html').write_text(base.replace('</body>', bundle+'</body>'), encoding='utf-8', newline='\n')
print('Built index.html (ARCANA 79)')
