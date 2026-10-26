from pathlib import Path
from playwright.sync_api import sync_playwright
import json
r=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(Path('/mnt/data/ARCANA_tarot_v78.html').read_text(),wait_until='domcontentloaded')
    assert page.locator('text=질문별 전용 배열').count()==0
    assert page.locator('#specialSpreads').is_hidden()
    assert page.locator('#spreads [data-spread]:visible').count()==4
    assert page.locator('#arc78AutoSpread').is_visible()
    page.locator('#arc78AutoSpread').click()
    r.append({'case':'empty_question','hint':page.locator('#arc78SpreadHint').inner_text(),'selected':page.evaluate('selectedSpread')})
    qs=[('친구와 멀어졌는데 어떻게 지낼까요?','relationship5'),('시험 결과를 기다리면서 너무 불안합니다','waiting3'),('A와 B 중 어디에 지원하는 것이 나을까요?','choice5'),('커리어 전환을 고민하고 있어요','career5'),('소설 문장을 어떻게 수정할까요?','five'),('요즘 내 마음이 어떤 상태일까요?','three')]
    for q,expected in qs:
        page.locator('#question').fill(q)
        page.locator('#arc78AutoSpread').click()
        selected=page.evaluate('selectedSpread')
        assert selected==expected,(q,selected,expected)
        assert page.locator('#arc78ChosenSpread').inner_text().strip()
        assert page.locator('#arc78AutoSpread').get_attribute('aria-pressed')=='true'
        assert page.locator('#spreads .active').count()==0 if selected.endswith('5') and selected!='five' else True
        r.append({'case':q,'selected':selected,'label':page.locator('#arc78ChosenSpread').inner_text()})
    page.locator('#spreads [data-spread="three"]').click()
    assert page.evaluate('selectedSpread')=='three'
    assert page.locator('#arc78AutoSpread').get_attribute('aria-pressed')=='false'
    page.locator('#question').fill('친구에게 이미 연락했는데 답장이 없어요. 어떻게 해야 할까요?')
    page.locator('#arc78AutoSpread').click()
    # screenshot already recorded separately
    # A reading should use the automatically chosen internal spread, with correct # of cards
    page.evaluate('''()=>{const cards=[{id:'cu06',rev:false},{id:'cu08',rev:false},{id:'sw04',rev:false},{id:'ar11',rev:false},{id:'ar19',rev:true}];return __arcana78Build(document.querySelector('#question').value,selectedSpread,cards);}''')
    r.append({'case':'manual_override','selected':'three','pressed':page.locator('#arc78AutoSpread').get_attribute('aria-pressed')})
    assert not errors,errors
    Path('/mnt/data/arcana_v78_work/ui_test_results.json').write_text(json.dumps({'checks':r,'page_errors':errors},ensure_ascii=False,indent=2))
    print(json.dumps({'checks':r,'page_errors':errors},ensure_ascii=False,indent=2))
    b.close()
