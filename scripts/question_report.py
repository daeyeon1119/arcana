"""Readable evidence: old regression questions, first v82 failures, current replay."""
from pathlib import Path
import html
import json

root = Path(__file__).resolve().parents[1]
load = lambda name: json.loads((root / name).read_text(encoding='utf-8'))
e = lambda value: html.escape(str(value), quote=True)
known = load('test-results/question-model/samples.json')
first = load('test-results/question-model/unseen/samples.json')
latest = load('test-results/question-model/unseen/regression/samples.json')
notes = {
 'u02':'최초 후보는 다른 사람의 발신을 사용자의 수신으로 바꿨습니다. 첫 동사와 발신·수신 역할, 후속 절의 수신 부정을 함께 처리합니다.',
 'u03':'수신 표지는 맞아도 최초 답변은 아직 오지 않은 내용에 답하라고 했습니다. 실제 조언을 읽어 발견한 문제이며, 사용자의 발신 답장도 보낸 연락으로 처리합니다.',
 'u05':'전해 들은 발표와 직접 확인한 결과를 구별합니다. 이미 절차가 끝났다고 말할 근거가 없는 경우 그 문구를 쓰지 않습니다.',
 'u06':'예정된 평가를 완료 뒤 결과 대기로 오해한 퇴행을 수정했습니다.',
 'u07':'과거 평가 결과가 다음 평가의 결과를 대신하지 않도록 시간 범위를 구분합니다.',
 'u09':'아직 회신이 없는데 그 내용에 먼저 답하라는 조언을 막습니다.',
 'u11':'새 분야를 목록에 추가하기보다 역할을 나누는 요청에서 담당·시점·완료 기준을 제안합니다.',
 'u15':'비교 뒤 첫 행동도 따로 다룹니다. 비교를 다시 하라는 문장으로 둘째 요청을 채우지 않습니다.',
 'u19':'지시어만으로는 상황을 알 수 없어 추첨 전에 보충 상황을 묻습니다.',
 'u21':'남은 한계: 저축 조건을 확인하는 질문에 지출 절감 조언이 남아 있습니다.',
 'u22':'남은 한계: 진료 대화를 준비하는 질문에 일반적인 진단 주의 문구가 큰 비중을 차지합니다.',
 'u23':'남은 한계: 관계를 성찰하는 질문을 일·진로로 읽어 직장 맥락의 질문이 나옵니다. 분류 표지 점수에는 잡히지 않는 내용 오류입니다.'
}
articles = []
def add(old, new, group, candidate=None):
    key = new.get('id') or new['group']+'.'+str(new['variant'])
    assert old['question'] == new['question'] and old['cards'] == new['cards'] and old['spread'] == new['spread']
    if candidate:
        assert candidate['cards'] == new['cards'] and candidate['question'] == new['question']
    note = notes.get(key, '')
    pairs = ''.join('<section><h3>'+title+'</h3><p>'+e(row['direct'])+'</p></section>' for title,row in [('v81 실제 답변',old),('v82 수정 후 · 회귀 자료',new)])
    first_detail = '<details><summary>첫 후보의 실제 답변</summary><p>'+e(candidate['direct'])+'</p></details>' if candidate else ''
    sections = ''.join('<h4>'+e(s['title'])+'</h4><p>'+e(s['body'])+'</p>' for s in new['sections'])
    model = (new.get('context') or {}).get('model', {})
    requests = ''.join('<li>'+e(t['kind'])+' · '+e(t['goal'])+': '+e(t['text'])+'</li>' for t in model.get('requests', []))
    events = ''.join('<li>'+e(v['kind'])+' · '+e(v['actor'])+' · '+e(v['status'])+': '+e(v['text'])+'</li>' for v in model.get('events', []))
    cards = ' · '.join(c['id']+(' 역' if c['rev'] else ' 정') for c in new['cards'])
    articles.append('<article data-group="'+group+'" data-note="'+str(int(bool(note)))+'"><div class="meta">'+e(key)+' · '+group+' · '+e(new['spread'])+'</div><h2>'+e(new['question'])+'</h2>'+('<p class="note">'+e(note)+'</p>' if note else '')+'<div class="pair">'+pairs+'</div>'+first_detail+'<details><summary>질문 근거와 실제 카드별 설명</summary><p>'+e(cards)+'</p><h4>읽은 요청</h4><ul>'+requests+'</ul><h4>사건과 원문 근거</h4><ul>'+events+'</ul>'+sections+'</details></article>')

for old,new in zip(known['before'],known['after']):
    add(old,new,'기존 실패 54개')
for old,candidate,new in zip(first['before'],first['after'],latest['after']):
    add(old,new,'새 상황 첫 평가 24개',candidate)
document = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>v82 질문 이해 · 실제 답변과 실패</title><style>body{margin:0;background:#f6f2e9;color:#253f32;font:15px/1.8 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:24px 20px}h1{font-size:26px}h2{font-size:18px}h3,h4{font-size:13px}p{white-space:pre-wrap}.tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center}input,select{padding:10px;border:1px solid #9bac9d;border-radius:6px;font:inherit;box-sizing:border-box;max-width:100%}article{margin:18px 0;padding:20px;background:#fffdf8;border:1px solid #d8d2c1;border-radius:12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}.meta{font-size:12px;color:#64766a}.note{padding:10px;background:#e9eedf;font-size:13px}details{border-top:1px solid #e0d8c8;padding:10px 0;margin-top:8px}summary{cursor:pointer}ul{padding-left:20px}@media(max-width:760px){.pair{grid-template-columns:1fr}main{padding:16px 12px}article{padding:15px}}</style><main><h1>v82 · 질문 이해와 실제 출력 78개</h1><p>기존 실패 질문 54개와 새 상황 첫 평가 질문 24개의 핵심 답변을 비교합니다. 이 화면은 3장 배열 78건이며 전체 624건씩의 출력은 gzip 자료에 있습니다. 첫 후보는 커밋 4547802에 보존했습니다. 새 상황의 첫 실행은 의도 17/20, 사실 9/12였고 실패를 보고 수정했으므로 이후 결과는 회귀 자료입니다. 이 자료의 점수와 자동 검사 통과가 임의의 새 질문에 대한 품질이나 전문가 동등성을 증명하지는 않습니다.</p><div class="tools"><input id="search" aria-label="질문과 답변 검색" placeholder="질문·실제 답변 검색"><select id="group" aria-label="자료 구분"><option value="">모든 자료</option><option>기존 실패 54개</option><option>새 상황 첫 평가 24개</option></select><label><input id="notes" type="checkbox"> 검토 메모만</label><b id="count">78개</b></div>''' + ''.join(articles) + '''</main><script>function filter(){let n=0;const q=document.getElementById('search').value.trim().toLowerCase(),g=document.getElementById('group').value,m=document.getElementById('notes').checked;document.querySelectorAll('article').forEach(a=>{a.hidden=!!((q&&!a.textContent.toLowerCase().includes(q))||(g&&a.dataset.group!==g)||(m&&a.dataset.note!=='1'));if(!a.hidden)n++;});document.getElementById('count').textContent=n+'개';}document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',filter));</script></html>'''
(root / 'test-results/question-model/review.html').write_text(document, encoding='utf-8', newline='\n')
print('Created v82 review: 54 regression questions and 24 first-pass questions with original failures')
