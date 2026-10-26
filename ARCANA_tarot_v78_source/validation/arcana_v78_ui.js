/* Simplified spread choice: four visible manual options, a single auto-pick button.
   Specialized spreads remain available internally and through the button. */
(function(){
 const pick=document.getElementById('arc78AutoSpread');
 const status=document.getElementById('arc78ChosenSpread');
 const hint=document.getElementById('arc78SpreadHint');
 if(!pick||!status)return;
 let chosenByAuto=false;
 const names={one:'한 장의 메시지',three:'과거 · 현재 · 미래',five:'심층 분석',celtic:'켈틱 크로스',relationship5:'관계의 거리',choice5:'두 갈래의 선택',waiting3:'기다림의 시간',career5:'진로의 갈림길'};
 const lengths={one:1,three:3,five:5,celtic:10,relationship5:5,choice5:5,waiting3:3,career5:5};
 function sync(){
  let key=selectedSpread in names?selectedSpread:'three';
  status.textContent=`현재 배열: ${names[key]} · ${lengths[key]}장`;
  pick.classList.toggle('applied',chosenByAuto);
  pick.setAttribute('aria-pressed',String(chosenByAuto));
  if(chosenByAuto){hint.textContent='질문을 바꾸면 버튼을 다시 눌러 새 배열을 추천받을 수 있습니다.';}
  else{hint.textContent='원하는 배열을 직접 선택하거나, 버튼 한 번으로 질문에 맞게 추천받으세요.';}
 }
 function recommend(q){
  // Compare first: choices are most useful when the actual question contains alternatives.
  const detected=arc78Scene(q,{});
  const intent=detected.intent;
  const group=v12QuestionGroup(q);
  const ctx=$('contextOverride')?.value||'auto';
  if(intent.primary==='compare'||ctx==='decision')return 'choice5';
  if(group==='waiting'||ctx==='waiting')return 'waiting3';
  if(group==='relationship'||group==='family'||ctx==='relationship'||ctx==='family'||detected.scene.domain==='relationship'||detected.scene.domain==='family')return 'relationship5';
  if(group==='career'||ctx==='career'||detected.scene.domain==='career')return 'career5';
  if(ctx==='project'||group==='project'||detected.scene.domain==='project')return 'five';
  if(intent.primary==='cause'||intent.primary==='action')return 'five';
  return 'three';
 }
 pick.addEventListener('click',()=>{
  const q=$('question').value.trim();
  if(!q){hint.textContent='질문을 먼저 입력하면 적합한 배열을 바로 선택해 드립니다.';$('question').focus();return;}
  const spread=recommend(q);
  const btn=document.querySelector(`[data-spread="${spread}"]`);
  if(!btn){hint.textContent='배열을 선택하지 못했습니다. 위에서 직접 골라 주세요.';return;}
  btn.click(); // use the same handler as manual choice (including ritual reset)
  chosenByAuto=true;
  sync();
  hint.textContent=`${names[spread]} 배열을 선택했습니다. 카드 ${lengths[spread]}장을 직접 뽑게 됩니다.`;
 });
 document.querySelectorAll('#spreads [data-spread]').forEach(btn=>btn.addEventListener('click',()=>{chosenByAuto=false;sync();}));
 document.getElementById('question')?.addEventListener('input',()=>{
  if(chosenByAuto){hint.textContent='질문을 변경했습니다. 다른 배열을 원하면 자동 선택 버튼을 다시 눌러 주세요.';}
 });
 sync();
})();
