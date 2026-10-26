"""Readable side-by-side record of all 320 actual generated readings."""
import html
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
folder = root / 'test-results/editorial'
before = json.loads((folder / 'before-readings.json').read_text(encoding='utf-8'))
after = json.loads((folder / 'after-readings.json').read_text(encoding='utf-8'))
notes = {
    1:'연봉 언급만으로 협상 조언을 주던 문제를 고쳐 통근 시간과 실수입을 함께 다룹니다.',
    21:'업무량 협의에 퇴사·이직 조언을 붙이던 문제를 보완했습니다.',
    36:'동료의 사과를 사용자가 연락한 사실로 바꾸어 읽지 않도록 했습니다.',
    41:'서로 연락한 사실을 반영해 아직 답이 없다는 전제를 제거했습니다.',
    51:'존중의 ‘중’을 선택지 비교 신호로 읽는 오류를 보완했습니다.',
    71:'물건 반환 요청에 거리감을 지켜보라고 답하던 맥락 오류를 수정했습니다.',
    86:'자녀와의 대화에 친구 관계 조언을 붙이지 않습니다.',
    88:'이미 말한 내용을 반복해서 권하지 않도록 했습니다.',
    113:'비교하느라 위축된다는 감정 서술을 두 선택의 비교 요청과 구별합니다.',
    128:'과제 제출이 끝났다는 점을 보존해 다음 학습과 피드백에 초점을 둡니다.',
    148:'이미 보낸 원고에 다시 초고 작성 조언을 주지 않도록 했습니다.',
    151:'작곡의 리듬·음역·화성을 실제로 비교하는 작은 실천으로 구체화했습니다.',
    188:'이미 매도한 주식에 지출 정리 조언을 주던 문제를 보완했습니다.',
    206:'복약 후 불편함을 일반적인 자기성찰로만 읽지 않도록 했습니다.',
    228:'이미 내린 결정을 무조건 다시 비교하라고 권하지 않도록 했습니다.',
    248:'첫 상담 질문에 통제할 수 없는 것을 내려놓으라는 포괄적 문장만 주지 않습니다.',
    274:'늦어진 프리랜서 대금을 지급일과 완료 기록 확인으로 구체화했습니다.',
    291:'‘답장도 받았다’는 사실을 반영해 아직 답이 없다는 모순을 제거했습니다.',
    316:'여행 준비에 취약한 시험 문제를 풀라는 조언이 나오지 않도록 했습니다.',
    320:'자신을 위한 작은 일을 고르는 질문에 상대의 기대를 확인하라는 조언을 보완했습니다.',
}
e = lambda value: html.escape(str(value), quote=True)
articles = []
for old, new in zip(before, after):
    assert old['id'] == new['id'] and old['question'] == new['question'] and old['cards'] == new['cards']
    note = notes.get(new['id'], '')
    details = ''.join('<h4>'+e(s['title'])+'</h4><p>'+e(s['body'])+'</p>' for s in new['sections'])
    cards = ' · '.join(c['id']+(' 역' if c['rev'] else ' 정') for c in new['cards'])
    articles.append(f'''<article data-category="{e(new['category'])}" data-note="{int(bool(note))}">
<div class="meta">{new['id']:03} · {e(new['category'])} · {e(new['spread'])}</div><h2>{e(new['question'])}</h2>
<div class="meta">기대 의도 / 판별: {e(new['intent'])} / {e(new['actualIntent'])} · 기대 분야 / 판별: {e(new['domain'])} / {e(new['actualDomain'])}</div>
{('<p class="note">'+e(note)+'</p>') if note else ''}
<div class="pair"><section><h3>수정 전 실제 답변</h3><p>{e(old['direct'])}</p></section><section><h3>수정 후 실제 답변</h3><p>{e(new['direct'])}</p></section></div>
<details><summary>동일 카드 조합과 수정 후 전체 근거</summary><p>{e(cards)}</p>{details}<h4>실천 제안</h4>{''.join('<p>'+e(a)+'</p>' for a in new['actions'])}</details></article>''')
categories = ''.join('<option>'+e(c)+'</option>' for c in dict.fromkeys(r['category'] for r in after))
document = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARCANA 실제 질문 320개 검토</title>
<style>body{margin:0;background:#f5f1e7;color:#243c30;font:15px/1.8 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:28px 20px}header{margin-bottom:24px}h1{font-size:28px}h2{font-size:19px;margin:8px 0}h3,h4{font-size:13px}article{background:#fffdf7;border:1px solid #d8d2c1;border-radius:12px;padding:20px;margin-bottom:18px}p{white-space:pre-wrap}.meta{font-size:12px;color:#67796a}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}.note{padding:10px;background:#eaf0e1;font-size:13px}details{border-top:1px solid #d8d2c1;padding-top:12px}summary{cursor:pointer}input,select{padding:10px;font:inherit;border:1px solid #a6b2a2;border-radius:7px;max-width:100%}.tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center}#count{font-weight:600}@media(max-width:650px){.pair{grid-template-columns:1fr;gap:4px}main{padding:16px 12px}}</style><main><header><h1>서로 다른 질문 320개 · 실제 답변 검토</h1><p>16개 분야의 원문 질문 320개에 같은 카드와 방향을 고정하여 수정 전후를 비교했습니다. 핵심 답변 320개와 8종 배열을 포함한 40건의 상세 근거를 자체 검토했습니다. 이 자료는 수정 과정에 사용한 회귀 자료이며, 독립 전문가 평가나 전문가 동등성의 증거가 아닙니다.</p><div class="tools"><input id="search" placeholder="질문·답변 검색" aria-label="질문과 답변 검색"><select id="category" aria-label="질문 분야"><option value="">모든 분야</option>''' + categories + '''</select><label><input id="notes" type="checkbox"> 주요 수정 사례만</label><span id="count">320개</span></div></header>''' + ''.join(articles) + '''</main><script>function filter(){let n=0;const text=document.getElementById('search').value.trim().toLowerCase(),category=document.getElementById('category').value,notes=document.getElementById('notes').checked;document.querySelectorAll('article').forEach(a=>{const show=(!text||a.textContent.toLowerCase().includes(text))&&(!category||a.dataset.category===category)&&(!notes||a.dataset.note==='1');a.hidden=!show;if(show)n++;});document.getElementById('count').textContent=n+'개';}document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',filter));</script></html>'''
(folder / 'review.html').write_text(document, encoding='utf-8', newline='\n')
ledger = {'scope':{'coreAnswersRead':320,'detailedReadingIds':[i*8+i%8+1 for i in range(40)],'expertBlindReview':False},'notes':[{'id':i,'note':note} for i,note in notes.items()]}
(folder / 'review-notes.json').write_text(json.dumps(ledger, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print('Created review.html: 320 actual before/after readings, 20 annotated fixes')
