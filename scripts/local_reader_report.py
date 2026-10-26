"""Render only real persisted model responses; missing results stay visibly missing."""
from pathlib import Path
import html
import json
import sys
import re

root = Path(__file__).resolve().parents[1]
staged = '--staged' in sys.argv
folder = root / 'test-results/local-reader' / ('native-staged-first' if staged else 'native-first')
run_tag = next((arg[6:] for arg in sys.argv[1:] if arg.startswith('--run=')), None)
if run_tag:
    assert re.fullmatch(r'[a-z0-9][a-z0-9-]{0,50}', run_tag)
    folder = folder / run_tag
fixture = json.loads((root / 'tests/local-reader-first.json').read_text(encoding='utf-8'))
cases = fixture['cases']
freeze_path = folder / 'freeze.json'
if freeze_path.exists():
    selected = json.loads(freeze_path.read_text(encoding='utf-8')).get('selectedCaseIds')
    if selected:
        cases = [case for case in cases if case['id'] in selected]
notes_path = folder / 'review-notes.json'
notes = json.loads(notes_path.read_text(encoding='utf-8')) if notes_path.exists() else {}
target_path = root / 'test-results/local-reader/editorial-targets.json'
targets = json.loads(target_path.read_text(encoding='utf-8'))['targets'] if target_path.exists() else {}
esc = lambda value: html.escape(str(value))
blocks, complete, reviewed, answers, execution_failures = [], 0, 0, 0, 0
for case in cases:
    path = folder / (case['id'] + '.json')
    if not path.exists():
        blocks.append(f'<article data-kind="{esc(case["kind"])}"><small>{esc(case["id"])} · 아직 실행 결과 없음</small><h2>{esc(case["question"])}</h2></article>')
        continue
    row = json.loads(path.read_text(encoding='utf-8'))
    complete += 1
    answers += bool(row.get('raw'))
    execution_failures += bool(row.get('error'))
    note = notes.get(case['id'])
    reviewed += bool(note) and bool(row.get('raw')) and note.get('reviewScope') != 'question-plan-only'
    packet, parsed = row['packet'], row.get('parsed') or {}
    cards = '<br>'.join(esc(f'{c["ref"]} · {c["position"]} · {c["name"]} {c["orientation"]} · {c["meaning"]}') for c in packet['cards'])
    baseline = row['baseline']['direct']
    requests = ''.join(f'<h4>요청 원문: {esc(r.get("source", ""))}</h4><p>{esc(r.get("text", ""))}</p><small>{esc(", ".join(r.get("refs", [])))}</small>' for r in parsed.get('requests', []) if isinstance(r, dict))
    actions = '<br>'.join(esc(a.get('text', '')) for a in parsed.get('actions', []) if isinstance(a, dict))
    details = ''.join(f'<h4>{esc(c["position"])} · {esc(c["name"])} {esc(c["orientation"])}</h4><p>{esc(parsed.get("cards", {}).get(c["ref"], "출력 없음"))}</p>' for c in packet['cards'])
    valid = '구조 검사 통과' if row['validation']['ok'] else '구조 검사 실패: ' + ', '.join(row['validation']['issues'])
    review = esc(note['comment']) if note else '실제 문장 검토 전입니다. 구조 검사 통과를 의미·품질의 통과로 읽지 마세요.'
    plan = '' if not staged else '<h4>카드 없이 분석한 질문</h4><pre>' + esc(json.dumps(row.get('questionPlan'), ensure_ascii=False, indent=2)) + '</pre>'
    target = targets.get(case['id'])
    target_html = '' if not target else '<details><summary>저자의 편집 목표 예시 · 모델 출력이나 외부 전문가 답변이 아닙니다</summary><p>' + esc(target['focus']) + '</p><p>' + esc(target['answer']) + '</p><h4>실천</h4><p>' + esc(target['action']) + '</p><small>' + esc(target['limits']) + '</small></details>'
    blocks.append(f'''<article data-kind="{esc(case['kind'])}"><small>{esc(case['id'])} · {esc(case['kind'])} · {row['elapsedMs']/1000:.1f}초 · {esc(valid)}</small>
<h2>{esc(case['question'])}</h2><p class="cards">{cards}</p><p class="memo">검토할 점: {esc(case['review'])}<br>실제 검토: {review}</p>
<div class="compare"><section><h3>기존 v82 실제 답변</h3><p>{esc(baseline)}</p></section><section><h3>무료 로컬 모델의 실제 답변</h3>{requests}<h4>전체 흐름</h4><p>{esc(parsed.get('synthesis', {}).get('text', '출력 없음'))}</p><h4>실천</h4><p>{actions}</p></section></div>
<details><summary>전체 카드 설명 · 미확인 정보 · 원본 JSON</summary>{plan}{details}<h4>더 알아볼 점</h4><p>{esc(chr(10).join(parsed.get('unknowns', [])))}</p><pre>{esc(row['raw'])}</pre></details>{target_html}</article>''')

evaluation_note = '기존 15개 진단 질문을 두 단계 후보로 재사용합니다. 첫 후보의 새 상황 12개도 여기서는 재사용 진단 자료입니다.' if staged else '알려진 개발 질문 3개와 프롬프트 고정 뒤 작성한 새 상황 12개를 구분합니다.'
if run_tag:
    evaluation_note += ' 이 화면은 통신 장애 뒤 선택한 질문을 다시 실행한 별도 기록이며 원래 실패를 대체하지 않습니다.'
title = '무료 로컬 해석 모델 · 두 단계 후보 진단' if staged else '무료 로컬 해석 모델 · 첫 실제 진단'
doc = f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f5f2e9;color:#253d32;font:16px/1.85 system-ui,sans-serif}}main{{max-width:1200px;margin:auto;padding:24px}}h1{{font-size:28px}}h2{{font-size:20px}}h3,h4{{margin:12px 0 8px}}p{{white-space:pre-wrap;margin:8px 0}}article{{background:#fffdf7;border:1px solid #d5ccba;border-radius:12px;padding:22px;margin:22px 0}}small{{color:#5c7164}}.cards,.memo{{font-size:14px;padding:14px;background:#f1f1e5;border-radius:8px}}.compare{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}select{{font:inherit;min-height:44px;padding:8px}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}}summary{{cursor:pointer}}@media(max-width:700px){{main{{padding:12px}}article{{padding:16px}}.compare{{grid-template-columns:1fr}}}}</style><main>
<h1>{title}</h1><p>실행 기록 {complete}/{len(cases)}개 · 답변 생성 {answers}개 · 실행 오류 {execution_failures}개 · 실제 문장 검토 {reviewed}개. Qwen3-4B-Q4_K_M과 llama.cpp CPU를 이 기기에서 실행했습니다. 유료 API를 쓰거나 질문을 외부 추론 서버로 보내지 않습니다.</p>
<p>질문·프롬프트·카드·원본 출력을 보존합니다. {evaluation_note} 저자가 수행한 진단이며 전문가와의 독립 비교가 아닙니다. JSON 형태·원문 인용·카드 참조 검사는 답변의 의미나 품질을 보증하지 않습니다.</p>
<select id="filter" aria-label="평가 자료 구분"><option value="all">전체 자료</option><option value="fresh">새 상황 12개</option><option value="development">알려진 개발 질문 3개</option></select>
{''.join(blocks)}<script>document.getElementById('filter').onchange=e=>document.querySelectorAll('article[data-kind]').forEach(a=>a.hidden=e.target.value!=='all'&&a.dataset.kind!==e.target.value);</script></main></html>'''
folder.mkdir(parents=True, exist_ok=True)
(folder / 'review.html').write_text(doc, encoding='utf-8', newline='\n')
print(f'Records {complete}/{len(cases)}; received answers {answers}; execution errors {execution_failures}; reviewed answers {reviewed}. Missing outputs are not fabricated.')
