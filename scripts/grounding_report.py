"""Render actual grounding outputs and separate author notes, without quality scores."""
from pathlib import Path
import sys,json,html,hashlib
root=Path(__file__).resolve().parents[1]
phase=sys.argv[1] if len(sys.argv)>1 else 'development'
assert phase in {'development','first','regression'}
version=int(sys.argv[2]) if len(sys.argv)>2 else 84
folder=root/'test-results/grounding'/('' if version==84 else 'v'+str(version))/phase
rows=json.loads((folder/'readings.json').read_text(encoding='utf-8'))
summary=json.loads((folder/'summary.json').read_text(encoding='utf-8'))
freeze=json.loads((folder/'freeze.json').read_text(encoding='utf-8'))
assert summary['appSHA256']==freeze['appSHA256'], 'Result and freeze belong to different builds'
assert summary['readingsSHA256']==hashlib.sha256((folder/'readings.json').read_bytes()).hexdigest(), 'Actual readings bytes do not match summary'
notes_path=folder/'review-notes.json'
notes=json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
esc=lambda value:html.escape(str(value))
grouped={}
for row in rows:grouped.setdefault(row['id'],[]).append(row)
def reading(row):
    sections=''.join(f'<h4>{esc(s["title"])}</h4><p>{esc(s["body"])}</p><small>카드 참조 {esc(s["refs"])}</small>' for s in row['after'].get('sections',[]))
    return f'''<section><h3>{esc(row['spread'])}</h3><p class="cards">{esc(chr(10).join(row['cardLabels']))}</p><div class="compare"><div><h4>v83 실제 출력</h4><p>{esc(row['before'].get('direct',row['before'].get('error','')))}</p></div><div><h4>v84 후보 실제 출력</h4><p>{esc(row['after'].get('direct',row['after'].get('error','')))}</p><h4>실천</h4><p>{esc(chr(10).join(row['after'].get('actions',[])))}</p></div></div><details><summary>전체 카드 설명 · 원문 근거 · 연결 메타데이터</summary>{sections}<pre>{esc(json.dumps(row['after'].get('grounding'),ensure_ascii=False,indent=2))}</pre></details></section>'''
blocks=[]
for key,variants in grouped.items():
    primary=next((row for row in variants if row['spread']=='five'),variants[0])
    comment=notes.get(key,{}).get('comment','핵심 문장 검토 전입니다. 자동 참조 검사는 의미 품질 점수가 아닙니다.')
    blocks.append(f'<article><small>{esc(key)} · {esc(phase)}</small><h2>{esc(primary["question"])}</h2><p class="memo">검토 메모: {esc(comment)}</p>{reading(primary)}<details><summary>다른 {len(variants)-1}종 배열의 실제 출력</summary>'+''.join(reading(row) for row in variants if row is not primary)+'</details></article>')
document=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA v84 실제 질문 근거 검토</title><style>*{{box-sizing:border-box}}body{{background:#f7f3e9;color:#233e33;font:16px/1.8 system-ui,sans-serif;margin:0}}main{{max-width:1200px;margin:auto;padding:24px}}article{{background:#fffdf7;border:1px solid #d8cfbb;border-radius:12px;padding:20px;margin:24px 0}}h2{{font-size:21px}}p,pre{{white-space:pre-wrap;overflow-wrap:anywhere}}.compare{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}.cards,.memo{{background:#edf0e4;padding:12px;border-radius:8px}}section{{border-top:1px solid #ddd4c4;padding-top:10px}}summary{{cursor:pointer}}pre{{font-size:12px}}@media(max-width:700px){{main{{padding:12px}}.compare{{grid-template-columns:1fr}}}}</style><main><h1>ARCANA v84 · 실제 출력 비교</h1><p>{len(grouped)}개 질문 · 버전별 {len(rows)}개 실제 해석 · 질문별 검토 메모 {len(notes)}개. 기본 화면은 5장 배열입니다.</p><p>{esc(summary['note'])}</p><p>질문·카드·방향·위치를 동일하게 두고 비교했습니다. 자동 참조 검사나 구현 작성자의 검토는 전문 해석가와의 독립 평가가 아닙니다. 첫 평가를 보고 수정한 이후 출력은 회귀 자료로 구분합니다.</p>{''.join(blocks)}</main></html>'''
(folder/'review.html').write_text(document,encoding='utf-8',newline='\n')
print(f'Rendered {len(grouped)} questions / {len(rows)} actual readings per version, {len(notes)} notes.')
