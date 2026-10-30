"""Render actual event-state outputs; manual review scope stays explicit."""
from pathlib import Path
import json, hashlib, html, sys
from save_artifact import save_text

root = Path(__file__).resolve().parents[1]
phase = sys.argv[1] if len(sys.argv) > 1 else 'development'
assert phase in {'development', 'first', 'regression'}
folder = root / 'test-results/event-state' / phase
raw = (folder / 'readings.json').read_bytes()
summary = json.loads((folder / 'summary.json').read_text(encoding='utf-8'))
assert hashlib.sha256(raw).hexdigest() == summary['readingsSHA256']
notes_path = folder / 'review-notes.json'
notes = json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
e = lambda value: html.escape(str(value), quote=True)
parts = []
for row in json.loads(raw):
    content = '<h2>' + e(row['id'] + ' · ' + row['question']) + '</h2><p>' + e(row['spread']) + '</p>'
    if row['spread'] == 'five':
        content += '<p class="note">' + e(notes.get(row['id'], '')) + '</p>'
    content += '<div class="pair">'
    for key, label in [('before', 'v87 실제 출력'), ('after', '후보 실제 출력')]:
        content += '<section><h3>' + label + '</h3><p>' + e(row[key]['direct']) + '</p></section>'
    content += '</div><details><summary>전체 카드 해석·사실·요청</summary><pre>' + e(json.dumps(row['after'], ensure_ascii=False, indent=2)) + '</pre></details>'
    parts.append('<article>' + content + '</article>' if row['spread'] == 'five' else '<details><summary>' + e(row['id'] + ' · ' + row['spread']) + '</summary>' + content + '</details>')
doc = '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사건 사실과 요청의 실제 해석</title><style>body{max-width:1100px;margin:auto;padding:20px;background:#f5f1e7;color:#243c30;font:15px/1.8 system-ui}article,details{background:white;padding:18px;margin:16px 0;border-radius:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:22px}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:19px}.note{background:#edf1e8;padding:12px}summary{cursor:pointer}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style><h1>사건 사실과 실제 요청 · ' + e(phase) + '</h1><p>' + e(summary['note']) + '</p><p>직접 검토한 범위는 review-scope.json에 기록합니다. 자동 계약은 전문가 점수나 일반화 성능을 뜻하지 않습니다.</p><p>앱 SHA-256: ' + e(summary['release']['appSHA256']) + '</p>' + ''.join(parts) + '</html>'
save_text(folder / 'review.html', doc)
print('Rendered', len(parts), 'actual report pairs.')
