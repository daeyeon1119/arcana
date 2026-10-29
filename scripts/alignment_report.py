"""Show actual before/after output and explicitly bounded manual-review notes."""
from pathlib import Path
import sys,json,hashlib,html
root=Path(__file__).resolve().parents[1]
phase=sys.argv[1] if len(sys.argv)>1 else 'development'
assert phase in {'development','first','regression'}
folder=root/'test-results/alignment'/phase
summary=json.loads((folder/'summary.json').read_text(encoding='utf-8'))
raw=(folder/'readings.json').read_bytes()
assert hashlib.sha256(raw).hexdigest()==summary['readingsSHA256']
assert json.loads((folder/'freeze.json').read_text())['appSHA256']==summary['appSHA256']
rows=json.loads(raw)
notes=json.loads((folder/'review-notes.json').read_text(encoding='utf-8')) if (folder/'review-notes.json').exists() else {}
escape=lambda value:html.escape(str(value),quote=True)
articles=[]
for row in rows:
 note=notes.get(row['id'],{}).get('comment','') if row['spread']=='choice5' else ''
 details=''.join('<h4>'+escape(section['title'])+'</h4><p>'+escape(section['body'])+'</p>' for section in row['after'].get('sections',[]))
 content='<h2>'+escape(row['id']+' · '+row['question'])+'</h2><p>'+escape(' / '.join(row['cardLabels']))+'</p>' + ('<p class="note">'+escape(note)+'</p>' if note else '')+'<div class="pair"><section><h3>v84 실제 출력</h3><p>'+escape(row['before'].get('direct',row['before'].get('error')))+'</p></section><section><h3>후보 실제 출력</h3><p>'+escape(row['after'].get('direct',row['after'].get('error')))+'</p></section></div><details><summary>후보의 전체 카드 근거</summary>'+details+'</details>'
 articles.append('<article>'+content+'</article>' if row['spread']=='choice5' else '<details class="variant"><summary>'+escape(row['id']+' · '+row['spread'])+'</summary>'+content+'</details>')
document='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA 요청과 배열 검토</title><style>body{margin:auto;padding:20px;max-width:1100px;background:#f5f1e7;color:#243c30;font:15px/1.8 system-ui}article,.variant{background:white;padding:20px;margin:18px 0;border-radius:12px}h2{font-size:19px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}p{white-space:pre-wrap;overflow-wrap:anywhere}.note{background:#eef2e8;padding:12px}summary{cursor:pointer}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><h1>요청과 카드 배열 · '+escape(phase)+'</h1><p>'+escape(summary['note'])+'</p><p>HTML SHA-256: '+summary['appSHA256']+'</p><p>점수 없는 작성자 검토입니다. 표시한 노트와 review-scope.json의 범위를 넘는 직접 검토를 주장하지 않습니다.</p>'+''.join(articles)+'</html>'
(folder/'review.html').write_text(document,encoding='utf-8',newline='\n')
print(f'Rendered {len(rows)} actual paired outputs; {len(notes)} author notes.')
