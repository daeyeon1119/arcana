"""Review actual outputs, including first-pass failures; never invent an evaluation score."""
from pathlib import Path
import html
import json

root = Path(__file__).resolve().parents[1]
e = lambda text: html.escape(str(text), quote=True)
read = lambda path: json.loads((root / path).read_text(encoding='utf-8'))

def report(path, title, intro, columns, labels, notes):
    articles = []
    assert len({len(rows) for rows in columns}) == 1
    for index, rows in enumerate(zip(*columns)):
        row = rows[-1]
        assert all(r['question'] == row['question'] and r['cards'] == row['cards'] and r['spread'] == row['spread'] for r in rows)
        key = str(row.get('group', row.get('id'))) + '.' + str(row['variant'])
        pair = ''.join('<section><h3>'+e(label)+'</h3><div class="meta">'+e(r['actualIntent'])+' · '+e(r['actualDomain'])+'</div><p>'+e(r['direct'])+'</p></section>' for label, r in zip(labels, rows))
        details = ''.join('<h4>'+e(s['title'])+'</h4><p>'+e(s['body'])+'</p>' for s in row['sections'])
        cards = ' · '.join(c['id'] + (' 逆' if c['rev'] else ' 正') for c in row['cards'])
        note = notes.get(key, notes.get(str(row.get('id')), ''))
        articles.append('<article data-spread="'+e(row['spread'])+'" data-note="'+str(int(bool(note)))+'"><div class="meta">'+e(key)+' · '+e(row['spread'])+'</div><h2>'+e(row['question'])+'</h2>'+('<p class="note">'+e(note)+'</p>' if note else '')+'<div class="pair" style="--columns:'+str(len(columns))+'">'+pair+'</div><details><summary>동일 카드와 마지막 버전의 전체 근거</summary><p>'+e(cards)+'</p>'+details+'</details></article>')
    options = ''.join('<option>'+e(s)+'</option>' for s in dict.fromkeys(r['spread'] for r in columns[-1]))
    template = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>__TITLE__</title><style>body{margin:0;background:#f5f1e7;color:#233d31;font:15px/1.8 system-ui,sans-serif}main{max-width:1260px;margin:auto;padding:24px 20px}h1{font-size:26px}h2{font-size:18px}h3,h4{font-size:13px}p{white-space:pre-wrap}article{background:#fffdf7;border:1px solid #d8d2c1;border-radius:12px;padding:20px;margin:18px 0}.pair{display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:22px}.meta{font-size:12px;color:#5f7468}.note{background:#e8eedf;padding:10px;font-size:13px}details{border-top:1px solid #ddd5c4;padding-top:10px}summary{cursor:pointer}.tools{display:flex;gap:12px;flex-wrap:wrap;align-items:center}input,select{padding:9px;border:1px solid #9bac9d;border-radius:6px;font:inherit;max-width:100%;box-sizing:border-box}@media(max-width:800px){.pair{grid-template-columns:1fr}main{padding:16px 12px}article{padding:15px}}</style><main><h1>__TITLE__</h1><p>__INTRO__</p><div class="tools"><input id="search" aria-label="질문과 답변 검색" placeholder="질문·실제 답변 검색"><select id="spread" aria-label="배열"><option value="">모든 배열</option>__OPTIONS__</select><label><input type="checkbox" id="notes"> 검토 메모가 있는 사례</label><b id="count">__COUNT__개</b></div>__ARTICLES__</main><script>function filter(){let n=0;const q=document.getElementById('search').value.trim().toLowerCase(),s=document.getElementById('spread').value,m=document.getElementById('notes').checked;document.querySelectorAll('article').forEach(a=>{a.hidden=!!((q&&!a.textContent.toLowerCase().includes(q))||(s&&a.dataset.spread!==s)||(m&&a.dataset.note!=='1'));if(!a.hidden)n++;});document.getElementById('count').textContent=n+'개';}document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',filter));</script></html>'''
    document = template.replace('__TITLE__', e(title)).replace('__INTRO__', e(intro)).replace('__OPTIONS__', options).replace('__COUNT__', str(len(articles))).replace('__ARTICLES__', ''.join(articles))
    (root / path).write_text(document, encoding='utf-8', newline='\n')

report('test-results/synthesis/review.html', '카드 통합 해석 · 24개 질문과 72개 조합', '개발·회귀 자료입니다. 같은 질문·카드·정역방향을 고정하여 v80과 v81을 비교합니다. 핵심 답변 72개와 각 질문 첫 조합의 연결 설명을 자체 검토했습니다. 외부 전문가 평가나 모든 새 질문에서의 품질 증거가 아닙니다.', [read('test-results/synthesis/before-readings.json'), read('test-results/synthesis/after-readings.json')], ['v80 실제 답변', 'v81 실제 답변'], {'2':'연락 속도와 호감의 맥락을 관계로 인식하도록 보완했습니다.','9':'기준을 묻는 질문의 행동 의도와 작업 피드백을 보존합니다.','10':'받은 답을 무시하고 추가 연락을 고민하게 하던 문제를 보완했습니다. 다른 표현에서는 같은 오류가 남아 일반화 보고서에 기록했습니다.','15':'생활비에 관한 대화를 관계 합의로 다룹니다.','17':'원고 접수 안내를 이미 받았다는 사실을 반영합니다.','20':'통합 문장이 상대의 연락 거부를 덮지 않도록 합니다.'})

first = read('test-results/generalization-v81/samples.json')
final = read('test-results/generalization-v81/regression-final/samples.json')
notes = {
 'pending.0':'성적 공개 전이라는 표현을 대기로 읽지 못했습니다. 이미 끝난 시험의 문제 풀이를 권합니다.',
 'pending.2':'제출 완료·결과 미확인을 보존하지 못해 제출 준비 조언이 나왔습니다.',
 'received.0':'받은 답을 뜻하는 표현을 사실 필드에서 놓쳤습니다.',
 'received.1':'조마조마하다는 감정을 성찰 요청으로 분류했습니다.',
 'received.2':'받은 대답을 놓치고 이미 전한 말을 다시 생각하라는 조언을 주었습니다.',
 'sent.1':'고백이 이미 끝났다는 사실을 놓쳐 아직 오지 않은 답에 먼저 답하라고 했습니다.',
 'compare.0':'최초 후보는 일반 배열의 시간 흐름으로 비교 기준을 덮었습니다. 최종본은 모든 배열에서 비교 의도의 답을 보존합니다. 이 수정 이후 이 자료는 회귀 자료입니다.',
 'compare.1':'같은 구조적 퇴행을 표현과 관계없이 수정했습니다.',
 'gardening.0':'공동 역할 배분에 관한 구체적인 조언이 부족합니다.',
 'accessibility.0':'새 제작 분야를 인식하지 못해 포괄적인 도움 요청만 권합니다.',
 'underspecified.0':'상황을 알 수 없는데 필요한 맥락을 먼저 묻지 않습니다.',
 'multiple-requests.0':'비교와 친구에게 말하는 방법 가운데 뒤의 요구가 빠집니다.',
 'multiple-requests.1':'준비와 감정 돌봄 중 감정에만 초점을 맞춥니다.',
 'multiple-requests.2':'선택 이후의 첫 행동을 별도로 다루지 못합니다.'
}
report('test-results/generalization-v81/review.html', '새 표현 54개 · 첫 평가와 수정 후 기록', '최초 평가는 구현을 고정한 뒤 작성한 54개 표현 × 8종 배열 432건에서 실행했습니다. 이 화면은 그중 3장 배열 54건의 실제 답변이며 전체 432건은 gzip 자료에 있습니다. 최초 기대 의도는 43/48, 분야 29/33, 사실·경계 19/24로 모두 해결되지 않았습니다. 이후 발견한 비교 의도 퇴행을 수정했으므로 최종 재검사는 회귀 자료입니다. 원래 실패·출력·구현은 커밋 8c611c6에 보존했습니다.', [first['before'], first['after'], final['after']], ['v80', '고정한 첫 후보', '구조적 퇴행 수정 후'], notes)
print('Created 72-case synthesis review and 54-case generalization review with failures')
