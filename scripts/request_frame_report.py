"""Readable actual outputs; manual scope remains a separate, hashed record."""
from pathlib import Path
import html, json, hashlib, sys
from save_artifact import save_text

root = Path(__file__).resolve().parents[1]
phase = sys.argv[1] if len(sys.argv)>1 else 'development'
assert phase in {'baseline','development','first','regression'}
folder = root/'test-results/request-frame'/phase
raw = (folder/'readings.json').read_bytes()
summary = json.loads((folder/'summary.json').read_text(encoding='utf-8'))
assert hashlib.sha256(raw).hexdigest() == summary['readingsSHA256']
notes = json.loads((folder/'review-notes.json').read_text(encoding='utf-8')) if (folder/'review-notes.json').exists() else {}
e = lambda s:html.escape(str(s),quote=True)
articles=[]
for row in json.loads(raw):
    cards=' / '.join(c['id']+(' 역' if c['rev'] else ' 정')for c in row['cards'])
    content='<h2>'+e(row['id']+' · '+row['question'])+'</h2><p>'+e(row['spread']+' · '+cards)+'</p>'
    if row['spread']=='five':content+='<p class="note">'+e(notes.get(row['id'],''))+'</p>'
    content+='<div class="pair">'
    for side,label in [('before','v89 실제 출력'),('after','후보 실제 출력')]:
        r=row[side];content+='<section><h3>'+label+'</h3><p class="meta">'+e(r['domain']+' · 의료 경계 '+str(r['medical']))+'</p><p>'+e(r['direct'])+'</p></section>'
    content+='</div><details><summary>전체 카드 해석·요청·단어 근거</summary><pre>'+e(json.dumps(row['after'],ensure_ascii=False,indent=2))+'</pre></details>'
    articles.append('<article>'+content+'</article>'if row['spread']=='five'else'<details><summary>'+e(row['id']+' · '+row['spread'])+'</summary>'+content+'</details>')
doc='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>요청의 동작·대상·결과물의 실제 해석</title><style>body{max-width:1100px;margin:auto;padding:20px;background:#f5f1e7;color:#243c30;font:15px/1.8 system-ui}article,details{background:white;padding:18px;margin:16px 0;border-radius:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:22px}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:19px}.note{background:#edf1e8;padding:12px}.meta{font-size:13px}summary{cursor:pointer}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><h1>요청의 동작·대상·결과물 · '+e(phase)+'</h1><p>'+e(summary['note'])+'</p><p>직접 읽은 범위는 review-scope.json에 기록합니다. 자동 계약은 의미 품질·전문가 점수와 구별합니다.</p><p>후보 HTML SHA-256: '+e(summary['release']['appSHA256'])+'</p>'+''.join(articles)+'</html>'
save_text(folder/'review.html',doc)
print('Rendered',len(articles),'actual before/after report pairs.')
