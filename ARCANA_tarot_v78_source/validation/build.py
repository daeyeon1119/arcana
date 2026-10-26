from pathlib import Path
src=Path('/mnt/data/ARCANA_tarot_v72.html').read_text()
js=Path('/mnt/data/arcana_v78_work/arcana_v73_78.js').read_text()
css=Path('/mnt/data/arcana_v78_work/arcana_v78.css').read_text()
uijs=Path('/mnt/data/arcana_v78_work/arcana_v78_ui.js').read_text()
uicss=Path('/mnt/data/arcana_v78_work/arcana_v78_ui.css').read_text()
# The four specialized spreads are valid internal layouts but not a second visible menu.
old='<div class="v12-spread-subhead">질문별 전용 배열 <span>선택한 질문에 맞게 추천됩니다</span></div>\n<div class="spreads v12-special-spreads" id="specialSpreads">'
new='''<div class="arc78-spread-helper" aria-label="질문에 맞는 카드 배열 자동 선택">
<button type="button" class="arc78-spread-pick" id="arc78AutoSpread" aria-pressed="false">✦ 질문에 맞는 배열 자동 선택</button>
<div class="arc78-spread-helper-text"><strong id="arc78ChosenSpread" aria-live="polite">현재 배열: 과거 · 현재 · 미래 · 3장</strong><small>배열을 잘 모르겠다면 한 번만 눌러 주세요.</small></div>
<div id="arc78SpreadHint" class="arc78-spread-helper-status" role="status" aria-live="polite">원하는 배열을 직접 선택하거나, 버튼 한 번으로 질문에 맞게 추천받으세요.</div>
</div>
<div class="spreads v12-special-spreads" id="specialSpreads" hidden aria-hidden="true">'''
assert old in src, 'old markup missing'
src=src.replace(old,new,1)
for stage in range(73,79):
 out=src.replace('ARCANA 72.0 |','ARCANA %d.0 |'%stage,1)
 tag=f'<style>\n{css}\n{uicss}\n</style>\n<script>\n{js.replace("__ARC78_STAGE__",str(stage))}\n</script>\n<script>\n{uijs}\n</script>\n'
 out=out.replace('</body></html>',tag+'</body></html>')
 Path(f'/mnt/data/ARCANA_tarot_v{stage}.html').write_text(out)
 print(stage,len(out))
