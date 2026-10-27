"""Readable actual v82/v83 outputs. Routing metadata is not a quality score."""
from pathlib import Path
import html
import json
import sys

root = Path(__file__).resolve().parents[1]
phase = sys.argv[1] if len(sys.argv) > 1 else 'first'
assert phase in {'development', 'first', 'regression', 'fresh'}
folder = root / 'test-results/task-policy' / phase
rows = json.loads((folder / 'readings.json').read_text(encoding='utf-8'))
summary = json.loads((folder / 'summary.json').read_text(encoding='utf-8'))
notes_path = folder / 'review-notes.json'
notes = json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
esc = lambda value: html.escape(str(value))
grouped = {}
for row in rows:
    grouped.setdefault(row['id'], []).append(row)

def reading(row):
    before, after = row['before'], row['after']
    detail = ''.join(f'<h4>{esc(section["title"])}</h4><p>{esc(section["body"])}</p><small>카드 참조: {esc(section["refs"])}</small>' for section in after.get('sections', []))
    return f'''<section class="variant"><h3>{esc(row['spread'])} · 같은 카드와 방향</h3><p class="cards">{esc(chr(10).join(row.get('cardLabels', [])))}</p><div class="compare"><div><h4>v82.1 실제 답변</h4><p>{esc(before.get('direct', before.get('error', '출력 없음')))}</p></div><div><h4>v83 후보 실제 답변</h4><p>{esc(after.get('direct', after.get('error', '출력 없음')))}</p><h4>실천</h4><p>{esc(chr(10).join(after.get('actions', [])))}</p></div></div><details><summary>전체 카드 설명 · 실제 요청과 라우팅</summary>{detail}<pre>{esc(json.dumps({'requests':after.get('requests'),'policy':after.get('policy')},ensure_ascii=False,indent=2))}</pre></details></section>'''

blocks = []
for case_id, variants in grouped.items():
    primary = next((row for row in variants if row['spread'] == 'five'), variants[0])
    note = notes.get(case_id)
    review = esc(note.get('comment', '')) if note else '실제 문장 검토 전입니다. 라우팅 검사와 의미 품질을 구분합니다.'
    others = ''.join(reading(row) for row in variants if row is not primary)
    blocks.append(f'<article><small>{esc(case_id)} · {esc(phase)}</small><h2>{esc(primary["question"])}</h2><p class="memo">실제 검토 메모: {review}</p>{reading(primary)}<details><summary>같은 질문의 나머지 {len(variants)-1}종 배열</summary>{others}</details></article>')

doc = f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA v83 실제 답변 비교</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f6f2e8;color:#233d33;font:16px/1.85 system-ui,sans-serif}}main{{max-width:1200px;margin:auto;padding:24px}}article{{background:#fffdf7;border:1px solid #d9ceba;border-radius:12px;padding:22px;margin:24px 0}}h1{{font-size:28px}}h2{{font-size:21px}}h3,h4{{margin:12px 0 6px}}p{{white-space:pre-wrap}}.compare{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}.cards,.memo{{background:#f0f1e6;border-radius:8px;padding:12px}}small{{color:#637568}}summary{{cursor:pointer}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}}.variant{{border-top:1px solid #ded8c8;padding-top:10px;margin-top:16px}}@media(max-width:700px){{main{{padding:12px}}article{{padding:16px}}.compare{{grid-template-columns:1fr}}}}
</style><main><h1>ARCANA v83 · 실제 답변 비교</h1><p>질문 {len(grouped)}개 · 버전별 실제 해석 {len(rows)}개 · 검토 메모 {len(notes)}개 질문. 첫 평가와 이후 회귀 자료를 구분합니다. 기본 화면은 5장 배열이며 다른 배열의 원문도 모두 보존합니다.</p><p>{esc(summary['note'])}</p><p>원문·실제 카드·정역방향·배열을 동일하게 두고 비교합니다. 자동 라우팅 검사나 저자의 검토 메모는 전문 해석가와의 독립 평가가 아닙니다. 임의의 새 질문 전체에서 전문가 수준을 입증한 결과가 아닙니다.</p>{''.join(blocks)}</main></html>'''
(folder / 'review.html').write_text(doc, encoding='utf-8', newline='\n')
print(f'Rendered {len(grouped)} actual questions / {len(rows)} readings per version, {len(notes)} author review notes. No quality scores fabricated.')
