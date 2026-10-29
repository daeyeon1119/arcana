"""Readable actual report pairs; review scope is recorded separately."""
from pathlib import Path
import sys,json,hashlib,html,os
root=Path(__file__).resolve().parents[1];phase=sys.argv[1] if len(sys.argv)>1 else 'development';version=int(sys.argv[2]) if len(sys.argv)>2 else 87
assert phase in {'development','first','regression'}
folder=root/'test-results/lens'/('' if version==87 else 'v'+str(version))/phase
raw=(folder/'readings.json').read_bytes();summary=json.loads((folder/'summary.json').read_text(encoding='utf-8'));assert hashlib.sha256(raw).hexdigest()==summary['readingsSHA256']
notes=json.loads((folder/'review-notes.json').read_text(encoding='utf-8')) if (folder/'review-notes.json').exists() else {};e=lambda x:html.escape(str(x),quote=True);articles=[]
for row in json.loads(raw):
    cards=' / '.join(a['id']+(' 역방향' if a['rev'] else ' 정방향') for a in row['cards'])
    sections=''.join('<h4>'+e(s['title'])+'</h4><p>'+e(s['body'])+'</p>' for s in row['after'].get('sections',[]))
    content='<h2>'+e(row['id']+' · '+row['question'])+'</h2><p>'+e(row['spread']+' · '+cards)+'</p>'+('<p class="note">'+e(notes.get(row['id'],{}).get('comment',''))+'</p>' if row['spread']=='five' else '')+'<div class="pair"><section><h3>v86 실제 출력</h3><p>'+e(row['before'].get('direct',row['before'].get('error')))+'</p></section><section><h3>후보 실제 출력</h3><p>'+e(row['after'].get('direct',row['after'].get('error')))+'</p></section></div><details><summary>전체 카드 근거와 요청·적용 기록</summary>'+sections+'<pre>'+e(json.dumps(row['after'].get('applications'),ensure_ascii=False,indent=2))+'</pre></details>'
    articles.append('<article>'+content+'</article>' if row['spread']=='five' else '<details class="variant"><summary>'+e(row['id']+' · '+row['spread'])+'</summary>'+content+'</details>')
doc='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>카드 관점의 실제 요청 적용</title><style>body{max-width:1100px;margin:auto;padding:20px;background:#f5f1e7;color:#243c30;font:15px/1.8 system-ui}article,.variant{background:white;padding:20px;margin:18px 0;border-radius:12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:19px}.note{background:#edf1e8;padding:12px}summary{cursor:pointer}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><h1>카드 관점과 실제 요청 · '+e(phase)+'</h1><p>'+e(summary['note'])+'</p><p>HTML SHA-256: '+summary['appSHA256']+'</p><p>직접 읽은 답변은 review-scope.json에 별도 기록합니다. 자동 계약은 의미 품질이나 전문가 점수가 아닙니다.</p>'+''.join(articles)+'</html>'
output=folder/'review.html';temporary=output.with_suffix('.html.'+str(os.getpid())+'.tmp');temporary.write_text(doc,encoding='utf-8',newline='\n');temporary.replace(output);print('Rendered',len(articles),'actual paired outputs.')
