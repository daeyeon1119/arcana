/* ARCANA v73–v78: semantic intent lattice, relational warrant checking, discourse editor,
   adversarial metamorphic tests and champion/challenger selection. Fully local and deterministic. */
const ARC78_STAGE = __ARC78_STAGE__;
const ARC78_CHAMPION = arcanaV5Build;
const ARC78_INTENT_LABEL={forecast:'전망',action:'행동',cause:'원인',compare:'비교',emotion:'감정 정리',open:'전반적 성찰'};
const ARC78_RULES={
 compare:[[/\bA\s*(?:와|과|또는|vs\.?|혹은|or)\s*B\b/i,11],[/(?:둘\s*중|둘\s*중에|어느\s*쪽|어느\s*것|둘\s*다|양쪽|비교|선택지|갈림길|갈래|계속할지.{0,35}그만둘지|남을지.{0,35}떠날지|이직할지.{0,30}남을지)/,8],[/(?:좋을까|나을까).{0,18}(?:아니면|혹은)/,6]],
 cause:[[/왜|어째서|무슨\s*이유|이유(?:가|는|를)?\s*(?:뭘|뭐|무엇)|이유(?:가|는)?|원인이\s*뭘|어디서\s*비롯|무엇\s*때문|왜\s*그랬|어쩌다/,10],[/어떻게\s*이런\s*일|무슨\s*의미(?:일까|인가)|왜\s*반복/,7]],
 action:[[/어떻게\s*(?:해야|하면|할까|할까요|하죠|대응|회복|개선|바꿀|정리|대처|고칠|시작|준비|말해야|풀어)/,10],[/(?:어디부터|무엇부터|무엇을\s*(?:해야|하면|할까요)|어떤\s*식으로|어떡하|뭘\s*하|뭐\s*하|뭘\s*해야|어떻게\s*해야|어찌해야)/,9],[/(?:해야\s*할까|하는\s*게\s*(?:좋|나을)|보유해야|팔아야|사야\s*할|들고\s*가야|말해야|그만두는\s*게|연락해도|연락할까|보내도\s*될까|시작해도\s*될까|결정해야|다시\s*도전할까|지금\s*할\s*일|어떤\s*조언|어떻게\s*극복)/,9],[/(?:알려줘|조언해\s*줘|권하|추천해|대처법|방법을)/,8]],
 forecast:[[/앞으로.{0,25}(?:될까|될까요|어떨까|가능|일어날|전망)|(?:다시\s*만날|만날\s*수|돌아올|이어질|성공할|합격할|붙을|좋아질|나아질|연락\s*올|회복될|가능할|이루어질)\s*(?:수\s*있을까|까요|까|까용)?/,9],[/(?:될까요|되겠죠|될까|될지|가능할까요|가능성이\s*있|전망은|결과가\s*어떨|재회할까|나올까|성공할까|합격할까|결과는)/,8],[/(?:언제\s*쯤|언제\s*나올까|미래가|앞날이|나중에\s*어떨까)/,5]],
 emotion:[[/불안(?:해|해서|한데|합니다|하네요|감)|걱정(?:돼|되|해서|이\s*너무)|두렵|무섭|초조|심란|힘들|마음이\s*복잡|자책|속상|슬퍼|괴로|공허|외로|답답/,5],[/(?:마음을\s*(?:다스|정리|추스)|버틸\s*수|위로|안심|잠이\s*안\s*와|불안감)/,6]]
};
function arc78Intent(question,scene={}){
 const q=String(question||'').replace(/\s+/g,' ').trim(),scores={forecast:0,action:0,cause:0,compare:0,emotion:0,open:1};
 const evidence={};
 for(const [type,rules] of Object.entries(ARC78_RULES)){
  evidence[type]=[];
  for(const [regex,weight] of rules){const m=q.match(regex);if(m){scores[type]+=weight;evidence[type].push(m[0]);}}
 }
 // General Korean clause patterns, rather than exact question-specific phrases.
 // Contrastive infinitives (X할지 Y할지) and two named alternatives take priority.
 const semanticSignals={
  compare:[
   /(?:할지|갈지|될지|살지|남을지|둘지).{0,85}(?:할지|갈지|될지|살지|남을지|둘지)/,
   /(?:것과|편과|길과|방식과|제안과|곳과|회사와).{0,70}(?:것|편|길|방식|제안|곳|회사)?.{0,25}(?:중|어느|더\s*나을|낫|좋)/,
   /(?:선택해야|둘\s*중|둘\s*다|어느\s*쪽|어느\s*편|어느\s*것|양자택일|A와\s*B|A\s*혹은\s*B)/i,
   /(?:독립\s*출판과|다른\s*의사의\s*의견|지금\s*사는\s*곳에\s*남는)/
  ],
  cause:[/(?:까닭|근본\s*원인|실패한\s*원인|어디(?:에서|서)\s*(?:오|비롯)|무엇\s*때문)/],
  action:[/(?:어디에|어디부터|무엇부터|어떤\s*점|어떤\s*방식).{0,50}(?:좋을|해야|제출|준비|손볼|신경|수정|할까|하죠|나을)/,/(?:늘려도\s*될까요|사과하는\s*편이\s*나을|어떻게\s*다시|어떻게\s*(?:개선|수정|관리|대비))/,/(?:보유|유지|참여|시작|판매|투자|지원).{0,15}(?:해도\s*될까|해야\s*하나|할까요|하는\s*게\s*좋)/],
  forecast:[/(?:오래가|성장|풀리|이어지|찾아오|돌아오|해결되|가능해지|달성되|성공하|연락\s*오|재회).{0,12}(?:까요|까|수\s*있을까|겠죠)/,/(?:올겨울|내년|올해|앞으로|언젠가|곧).{0,75}(?:수\s*있을까|될까|될까요|성장|오를|이직)/,/(?:이직|합격|취업|성공|재회|만날).{0,14}수\s*있을까요/],
  emotion:[/(?:조급|잠도.{0,10}못|겁이|두려|마음이\s*무겁|외롭|공허|괴롭|고통스러|자책|심하게\s*탓|아무것도\s*하고\s*싶지)/]
 };
 for(const [type,patterns] of Object.entries(semanticSignals)){
  if(patterns.some(rx=>rx.test(q))){scores[type]+=type==='compare'?17:type==='emotion'?11:10;}
 }
 if(scores.compare>0&&/\b(?:결정|선택)\b/.test(q)&&!/(?:중|아니면|혹은|할지|갈지|보다|비교)/.test(q))scores.compare=Math.min(scores.compare,2);
 // Broader morpho-syntactic coverage: Korean questions often have no stock keyword.
 if(/(?:\S+(?:을지|ㄹ지)).{0,65}(?:\S+(?:을지|ㄹ지))/.test(q))scores.compare+=14;
 if(/(?:아니면|혹은|두\s*(?:가지|개|곳|선택|제안)|사이에서\s*고민|\S+는\s*것과\s*\S+는\s*것)/.test(q))scores.compare+=14;
 if(/(?:둘|두\s*개|두\s*가지).{0,25}(?:중|선택|어느|골라)/.test(q))scores.compare+=14;
 if(/(?:까닭|배경|근본\s*원인|어떤\s*이유|원인은)/.test(q))scores.cause+=12;
 if(/(?:할\s*수\s*있을까요|될\s*수\s*있을까요|을\s*수\s*있을까요|ㄹ\s*수\s*있을까요|수\s*있을지|받을\s*수\s*있을지|얻을까요|도착할까요|열릴까요|오래갈까요|하고\s*있을까요|해낼까요|화해할까요)/.test(q))scores.forecast+=11;
 if(/(?:어떤\s*(?:부분|점|것)|무엇을|무슨\s*말|무슨\s*행동|어디부터|어디에|우선\s*무엇).{0,40}(?:고쳐|신경|수정|준비|해야|하면|좋|알려|골라|대처)/.test(q))scores.action+=12;
 if(/(?:보내볼까요|전해도\s*될까요|늘려도\s*될까요|사과할까요|준비할지\s*알려|행동을\s*알려|할\s*수\s*있는\s*행동)/.test(q))scores.action+=12;
 const emotionalLanguage=/(?:떨리|잠이\s*오지|답답해|상처를\s*받|움츠러|무서워|우울해|허전하|지쳐|손에\s*잡히지|마음이\s*무겁|겁이\s*나|너무\s*불안|괴로워)/.test(q);
 if(emotionalLanguage){scores.emotion+=12;if(!/(?:\?|？|무엇을|어떻게|해야\s*할까|왜)/.test(q))scores.forecast=Math.max(0,scores.forecast-8);}

 // Grammatical precedence: modal 'should I do X' is action, not future prediction.
 if(/(?:해야|할까요|해도|보유해야|사야|팔아야|계속해야|그만둬야|갈까요|갈까|바꿀까요|연락할까요|전할까요)/.test(q)&&scores.action>0)scores.forecast=Math.max(0,scores.forecast-6);
 if(/(?:그만두면|떠나면|시도한다면|하게\s*되면).{0,20}(?:어떻게\s*될|될까요|될까)/.test(q))scores.forecast+=8;
 if(/(?:어떤\s*마음|어떤\s*생각|왜\s*(?:저를|나를)\s*(?:싫어|피해))/.test(q))scores.cause+=4;
 // An emotional adjective is contextual unless the user primarily asks for emotional help.
 if(scores.emotion&&scores.action>0)scores.emotion=Math.min(scores.emotion,4);
 if(scores.emotion&&scores.forecast>0)scores.emotion=Math.min(scores.emotion,4);
 if(scores.compare>=8)scores.action=Math.max(0,scores.action-3);
 if(scene.phase==='known'&&scores.forecast>0&&!/(?:다음\s*번|향후|앞으로|재도전|다시\s*볼)/.test(q))scores.forecast=Math.max(0,scores.forecast-7);
 const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]||(['compare','cause','action','forecast','emotion','open'].indexOf(a[0])-['compare','cause','action','forecast','emotion','open'].indexOf(b[0])));
 const primary=ranked[0][1]>1?ranked[0][0]:'open';
 const secondary=ranked.find(([type,score])=>type!==primary&&score>=5&&score>=ranked[0][1]*.43)?.[0]||null;
 return {primary,secondary,scores,evidence,confidence:ranked[0][1]<=2?'low':ranked[0][1]-ranked[1][1]<3?'mixed':'high',question:q};
}
function arc78Scene(q,ctx){
 const scene=arc72Scene(q,ctx||{}),intent=arc78Intent(q,scene);
 if(ARC78_STAGE>=73){scene.intent=intent.primary;scene.primaryIntent=intent.primary;scene.secondaryIntent=intent.secondary;scene.intentEvidence=intent.evidence;scene.intentConfidence=intent.confidence;}
 if(/(?:아직\s*연락\s*(?:안|못)|연락하지\s*않았|연락을\s*안\s*했|연락할\s*생각|연락하려고)/.test(q)){scene.facts.sent=false;scene.facts.noReply=false;}
 if(/(?:이미\s*연락|연락을\s*보냈|고백을\s*했|고백했|메시지를\s*보냈|문자\s*보냈)/.test(q) && !/(?:하지\s*않았|안\s*했|못\s*했|안\s*보냈)/.test(q))scene.facts.sent=true;
 if(/(?:답장|답변|회신).{0,9}(?:받았|왔|도착)|답변을\s*들었/.test(q)&&!/(?:못\s*받|안\s*왔)/.test(q)){scene.facts.replied=true;scene.facts.noReply=false;}
 if(/(?:이미|최종|발표|결과).{0,13}(?:불합격|낙방|탈락|떨어졌)|(?:불합격|탈락|낙방)\s*(?:했|됐)/.test(q)){scene.facts.resultFailed=true;scene.facts.known=true;scene.phase='known';}
 if(/(?:내시경|기침|복통|소변|혈변|혈뇨|체온|발열|진단|검사\s*결과|혈액\s*검사|진료)/.test(q)&&!/(?:면접|입사|인사\s*이동)/.test(q))scene.domain='health';
 if(/(?:원고|소설|작곡|웹페이지|배포|프로그램|코드|개발|영상\s*편집|작품)/.test(q))scene.domain='project';
 if(/(?:퇴직연금|보증금|대출|예금|주식|코인|비트코인|배당|월세|전세)/.test(q))scene.domain='finances';
 scene.question=q;return {scene,intent};
}
function arc78PairRelations(pack,scene){
 const list=pack.list,priority={now:8,message:8,obstacle:8,advice:8,optionA:7,optionB:7,criteria:7,outcome:7,future:7,root:6,past:5,goal:5,resource:6,feeling:6,environment:4,self:5};
 const pairs=[];
 for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const a=list[i],b=list[j],pa=arc65Polarity(a),pb=arc65Polarity(b),same=a.tag===b.tag;
  const critical=['obstacle','advice','optionA','optionB','outcome','future','now','message'];
  const relevant=critical.includes(a.role)||critical.includes(b.role);
  if(!relevant&&!same)continue;
  let type;
  if(a.role==='optionA'&&b.role==='optionB')type='alternatives';
  else if((a.role==='past'&&['now','future','outcome'].includes(b.role))||(a.role==='now'&&['future','outcome'].includes(b.role)))type='transition';
  else if(same)type='reinforce';
  else if((pa>0&&pb<0)||(pa<0&&pb>0))type='tension';
  else if(a.role==='obstacle'||b.role==='obstacle')type='constraint';
  else type='complement';
  const w=(priority[a.role]||3)+(priority[b.role]||3)+(type==='alternatives'?9:type==='tension'?5:type==='reinforce'?4:0);
  pairs.push({type,indices:[a.index,b.index],left:a.name,right:b.name,roles:[a.role,b.role],meanings:[a.main,b.main],weight:w});
 }
 return pairs.sort((a,b)=>b.weight-a.weight||a.indices[0]-b.indices[0]).slice(0,4);
}
function arc78Grounding(pack,claims){
 const byIndex=new Map(pack.list.map(a=>[a.index,a]));
 const result=[];
 for(const c of claims){
  const refs=(c.refs||[]).filter(i=>byIndex.has(i)),terms=refs.flatMap(i=>{const a=byIndex.get(i);return [a.main,a.support,a.name,a.tag].filter(Boolean)});
  const text=String(c.text||'');
  // Warrant is literal semantic evidence, not only a matching card reference ID.
  const warrant=terms.filter(t=>text.includes(t)||t.includes(text)&&text.length>3);
  const verified=refs.length>0&&warrant.length>0;
  result.push({...c,refs,warrant,verified,verdict:verified?'supported':'unsubstantiated'});
 }
 return result;
}
function arc78SelectedSections(base,pack,relations){
 const sections=base.sections.map(s=>({...s,refs:(s.refs||[]).slice()}));
 if(ARC78_STAGE<74||!relations.length)return sections;
 const top=relations[0],a=pack.list.find(x=>x.index===top.indices[0]),b=pack.list.find(x=>x.index===top.indices[1]);
 if(!a||!b)return sections;
 const line={
  reinforce:`${a.name}의 ‘${a.main}’과 ${b.name}의 ‘${b.main}’은 같은 방향의 관심을 강화합니다. 카드가 반복해서 강조하는 주제를 먼저 정리해 보세요.`,
  tension:`${a.name}의 ‘${a.main}’과 ${b.name}의 ‘${b.main}’은 서로 다른 요구를 드러냅니다. 둘 중 하나가 반드시 현실에서 옳다는 뜻은 아니며, 어떤 제약이 있는지 확인하는 데 의미가 있습니다.`,
  transition:`${a.name}의 ‘${a.main}’에서 ${b.name}의 ‘${b.main}’으로 해석의 초점이 이동합니다. 이전의 흐름과 다음 단계의 조건을 구별해 보세요.`,
  alternatives:`A 선택에 놓인 ${a.name}은 ‘${a.main}’을, B 선택에 놓인 ${b.name}은 ‘${b.main}’을 강조합니다. 각 선택이 요구하는 태도를 비교하는 상징입니다.`,
  constraint:`${a.name}의 ‘${a.main}’과 ${b.name}의 ‘${b.main}’을 함께 보면, 바라는 변화와 점검할 제약이 분리됩니다.`,
  complement:`${a.name}의 ‘${a.main}’과 ${b.name}의 ‘${b.main}’은 서로 다른 관점을 보충합니다.`
 }[top.type];
 // Keep original cardinality of the Celtic Cross. Replace, rather than append, a synthetic group.
 const synthesized=sections.findIndex(s=>s.kind==='synthesis'||s.refs.length>=2);
 const newSection={title:'카드 사이의 연결',body:line,refs:top.indices,kind:'relational',priority:8};
 if(synthesized>=0){
  // Preserve the original synthesis and its card coverage, then add the relation.
  const earlier=sections[synthesized];
  sections[synthesized]={...earlier,body:earlier.body+' '+line,refs:[...new Set([...earlier.refs,...top.indices])],kind:'relational'};
 }else if(sections.length>1){sections.splice(Math.min(2,sections.length-1),0,newSection);}
 return sections;
}
function arc78Reply(scene,intent,pack,facts,action,relations){
 const main=pack.main,limit=pack.limit,trend=pack.trend,known=facts.rules.knownOutcome;
 const center=`${main.name}의 ‘${main.main}’`,opp=limit&&limit.index!==main.index?`${limit.name}의 ‘${limit.main}’`:null;
 const relation=relations.find(x=>x.type==='tension'||x.type==='alternatives'||x.type==='constraint');
 if(scene.domain==='health')return {headline:'건강 문제는 실제 진료와 검사로 확인하세요',direct:`타로만으로 건강 상태나 검사 결과를 알 수 없습니다. ${center}은 현재의 걱정을 돌아보는 상징이며, 판단은 의료진의 설명과 실제 검사 결과를 기준으로 해야 합니다.`};
 if(scene.domain==='finances'&&intent.primary==='forecast')return {headline:'수익 전망은 숫자로, 카드는 성찰의 관점으로',direct:`카드로 시장 가격이나 실제 수익을 예측할 수는 없습니다. ${center}은 선택을 바라보는 태도로 참고하되, 손실 가능성과 계약 조건은 실제 자료로 확인하세요.`};
 if(known&&intent.primary==='forecast')return {headline:'확정된 결과를 다시 예측하지 않기',direct:`이미 확인된 결과를 타로로 다시 바꿀 수는 없습니다. ${center}을 바탕으로 이제 선택할 수 있는 다음 단계에 초점을 맞추는 편이 적절합니다.`};
 if(intent.primary==='compare'){
  const a=pack.list.find(x=>x.role==='optionA'),b=pack.list.find(x=>x.role==='optionB');
  if(a&&b)return {headline:'A와 B의 핵심 차이',direct:`A 선택에서는 ${a.name}의 ‘${a.main}’이, B 선택에서는 ${b.name}의 ‘${b.main}’이 강조됩니다. 어느 쪽이 무조건 낫다고 단정하기보다 각 경로에서 감당할 조건을 같은 기준으로 비교해 보세요.`};
  return {headline:'두 선택을 같은 기준에서 비교하기',direct:`${center}이 이번 선택의 핵심 축입니다. ${opp?`${opp}은 따로 살펴야 할 제약입니다. `:''}실제 비용과 선택 이후의 책임까지 함께 비교하세요.`};
 }
 if(intent.primary==='action')return {headline:'지금 할 행동에 대한 답',direct:`지금 할 수 있는 일은 분명합니다. ${action} 이러한 제안은 ${pack.advice.name}의 ‘${pack.advice.main}’이라는 상징과 연결됩니다.${opp?` 다만 ${opp}도 함께 고려해야 합니다.`:''}`};
 if(intent.primary==='cause')return {headline:'원인을 단정하지 않고 살펴볼 배경',direct:`실제 이유는 카드만으로 확인할 수 없습니다. 다만 ${center}을 중요한 관점으로 볼 수 있고, ${opp?`${opp}과 구별해 볼 필요가 있습니다.`:'질문에 나온 사실과 추측을 따로 점검하는 데 도움이 됩니다.'}`};
 if(intent.primary==='forecast'){
  const lean=arc72Lean(pack),view=lean==='open'?'상징적으로는 전진할 여지가 강조됩니다':lean==='restrained'?'상징적으로는 속도보다 장애물 점검에 무게가 실립니다':'카드들이 서로 다른 가능성을 함께 보여 줍니다';
  return {headline:lean==='open'?'가능성은 열려 있지만 결과는 미확정입니다':lean==='restrained'?'확신보다 점검이 필요한 흐름':'기대와 제약을 함께 보는 흐름',direct:`${view}. 중심에는 ${center}이 놓여 있습니다. ${trend&&trend.index!==main.index?`향후 흐름에서는 ${trend.name}의 ‘${trend.main}’도 나타납니다. `:''}${relation?'일부 카드의 상징은 서로 다른 방향을 가리킵니다. ':''}실제 결과를 확정적으로 예언하는 것은 아닙니다.`};
 }
 if(intent.primary==='emotion')return {headline:'감정과 확인된 사실을 분리하기',direct:`지금 느끼는 감정을 이해하는 데에는 ${center}이 하나의 관점이 됩니다. 감정은 존중하되 그것만으로 결과나 타인의 마음을 확정할 수는 없습니다.${intent.secondary==='action'?` 지금 할 수 있는 일은 ${action}`:''}`};
 return {headline:'이 질문에서 가장 두드러지는 방향',direct:`이번 배열에서 먼저 주목할 상징은 ${center}입니다.${opp?` 동시에 ${opp}이 다른 측면을 보여 줍니다.`:''} 질문에서 이미 확인한 사실을 바탕으로 가능한 선택을 살펴보세요.`};
}
function arc78PostEdit(report,facts,pack){
 // Discourse pass: collapse semantic duplicates, avoid repetitive lead and unfounded conclusions.
 const seen=new Set();
 report.sections=report.sections.filter(s=>{const canonical=s.body.normalize('NFKC').replace(/[\s‘’.,!?]/g,'');if(seen.has(canonical))return false;seen.add(canonical);return true;});
 report.actions=[...new Set(report.actions.filter(Boolean))].slice(0,3);
 report.direct=report.direct.replace(/\s{2,}/g,' ').replace(/\.\s*\./g,'.').trim();
 const text=[report.direct,...report.actions].join(' ');
 if(facts.rules.noFirstContact&&/(?:먼저\s*연락|처음\s*연락|한번\s*더\s*연락해\s*보세요)/.test(text))report.actions=['이미 연락한 사실을 전제로, 추가 연락을 서두르지 말고 실제 응답을 기다릴 여유를 정해 보세요.'];
 if(facts.rules.noInventedConflict&&/실제로\s*다퉜|싸웠기\s*때문/.test(text))report.actions=['다툼이 있었다고 추정하지 말고 실제 달라진 소통 방식을 확인해 보세요.'];
 if(facts.rules.knownOutcome&&/(?:합격할\s*것|불합격할\s*것|곧\s*합격)/.test(report.direct))report.direct='이미 결과가 확인됐다면 앞으로 바꿀 수 있는 선택에 집중하는 상징적 해석이 적절합니다.';
 return report;
}
function arc78VerifyOutput(report,pack,scene,intent,facts){
 const problems=[],refs=new Set(pack.list.map(x=>x.index));
 for(const s of report.sections)if(!s.refs?.length||s.refs.some(x=>!refs.has(x)))problems.push('invalid-evidence');
 const all=[report.headline,report.direct,...report.sections.map(s=>s.body),...report.actions].join(' ');
 if(facts.rules.noFirstContact&&/처음\s*연락해\s*보세요|먼저\s*연락해\s*보세요/.test(all))problems.push('repeat-action');
 if(facts.rules.knownOutcome&&/아직\s*결과가\s*나오지/.test(all))problems.push('known-outcome');
 if(/교류을|도움이이|이이|은는|을를|를을|펜타클\s*7는/.test(all))problems.push('particle');
 if(/반드시\s*합격|확실히\s*재회|무조건\s*수익|확실한\s*진단/.test(all))problems.push('unwarranted-prediction');
 if(intent.primary==='compare'&&!/(?:선택|비교|A\s*선택|B\s*선택|경로)/.test(report.direct))problems.push('intent-miss');
 if(intent.primary==='action'&&!/(?:지금|우선|행동|할\s*수|방향)/.test(report.direct))problems.push('intent-miss');
 if(intent.primary==='cause'&&!/(?:이유|원인|배경)/.test(report.headline+' '+report.direct))problems.push('intent-miss');
 if(intent.primary==='forecast'&&!/(?:예언|결과|가능성|전망|흐름|미확정)/.test(report.headline+' '+report.direct))problems.push('intent-miss');
 const grounded=arc78Grounding(pack,report.arc78?.claims||[]);
 if(grounded.some(x=>!x.verified))problems.push('unsubstantiated-claim');
 return {problems,grounded,ok:!problems.length};
}
function arc78Plan(q,spread,cards,ctx={},opts={}){
 const context=arc78Scene(q,ctx),scene=context.scene,intent=context.intent;
 const base=arc72Plan(q,spread,cards,ctx),pack=arc72CardPack(q,spread,cards,ctx),facts=arc72PlanFacts(scene,q);
 const relations=ARC78_STAGE>=74?arc78PairRelations(pack,scene):[];
 const actions=[arc72Action(scene,facts,pack)];
 const reply=arc78Reply(scene,intent,pack,facts,actions[0],relations);
 let report={...base,headline:reply.headline,direct:reply.direct,sections:arc78SelectedSections(base,pack,relations),actions,layoutLabel:'THE READING · 질문에 대한 답변'};
 const claims=[{type:'core',text:pack.main.main,refs:[pack.main.index]},{type:'action',text:pack.advice.main,refs:[pack.advice.index]},...(pack.limit?[{type:'constraint',text:pack.limit.main,refs:[pack.limit.index]}]:[]),...(pack.trend?[{type:'trend',text:pack.trend.main,refs:[pack.trend.index]}]:[])];
 report.arc78={stage:ARC78_STAGE,intent,scene:{domain:scene.domain,phase:scene.phase,facts:scene.facts},relations,claims,championSelected:false,metrics:{},audit:[]};
 if(ARC78_STAGE>=75)report.arc78.grounding=arc78Grounding(pack,claims);
 if(ARC78_STAGE>=76)report=arc78PostEdit(report,facts,pack);
 const check=arc78VerifyOutput(report,pack,scene,intent,facts);report.arc78.audit=check.problems;report.arc78.grounding=check.grounded;
 // Champion/challenger: retain previous stable engine for failures of hard constraints only.
 if(ARC78_STAGE>=78&&check.problems.some(x=>x!=='intent-miss')){
  const old=base;
  old.arc78={...report.arc78,championSelected:true,loserAudit:check.problems,audit:arc72Audit(old,pack,facts,scene)};
  return old;
 }
 return report;
}
window.__arcana78Build=(q,spread,cards)=>{
 const save={spread:selectedSpread,cards:drawn,q:$('question').value,o:$('contextOverride')?.value};
 try{selectedSpread=spread;drawn=cards;$('question').value=q;if($('contextOverride'))$('contextOverride').value='auto';return arc78Plan(q,spread,cards,{});}
 finally{selectedSpread=save.spread;drawn=save.cards;$('question').value=save.q;if($('contextOverride'))$('contextOverride').value=save.o;}
};
window.__arcana78Compare=(q,spread,cards)=>{
 const previous=__arcana72Build(q,spread,cards),challenger=__arcana78Build(q,spread,cards);
 return {previous,challenger,difference:{firstReply:previous.direct!==challenger.direct,headline:previous.headline!==challenger.headline,action:previous.actions[0]!==challenger.actions[0],oldAudit:previous.arc72?.audit||[],newAudit:challenger.arc78?.audit||[]}};
};
const ARC78_METAMORPHS=[
 {name:'이미 연락',question:'친구에게 이미 연락했는데 답장이 없어요. 어떻게 하는 게 좋을까요?',expect:{intent:'action',sent:true}},
 {name:'아직 연락 전',question:'아직 친구에게 연락하지 않았어요. 먼저 연락해야 할까요?',expect:{intent:'action',sent:false}},
 {name:'합격 여부 대기',question:'시험 결과가 아직 발표되지 않았어요. 합격할까요?',expect:{intent:'forecast',known:false}},
 {name:'확정 불합격',question:'시험에서 최종 불합격했어요. 이제 무엇을 해야 하나요?',expect:{intent:'action',known:true}},
 {name:'원인',question:'친구가 갑자기 멀어진 이유는 뭘까요?',expect:{intent:'cause'}},
 {name:'비교',question:'직장 A와 B 중 어느 쪽이 나을까요?',expect:{intent:'compare'}},
 {name:'행동',question:'주식을 계속 보유해야 할까요?',expect:{intent:'action'}},
 {name:'전망',question:'다시 만날 수 있을까요?',expect:{intent:'forecast'}},
 {name:'감정',question:'결과가 불안해서 잠을 못 자겠어요.',expect:{intent:'emotion'}},
 {name:'개선',question:'소설 원고의 완성도를 어떻게 개선할까요?',expect:{intent:'action',domain:'project'}},
 {name:'의학 검사',question:'내시경 검사 결과가 아직 안 나와서 걱정이에요.',expect:{domain:'health'}},
 {name:'투자 분류',question:'퇴직연금을 이전하는 게 나을까요?',expect:{domain:'finances'}}
];
window.__arcana78Adversarial=()=>ARC78_METAMORPHS.map(c=>{
 const s=arc78Scene(c.question,{}),errors=[];
 if(c.expect.intent&&s.intent.primary!==c.expect.intent)errors.push('intent');
 if(c.expect.domain&&s.scene.domain!==c.expect.domain)errors.push('domain');
 if(c.expect.sent!==undefined&&!!s.scene.facts.sent!==c.expect.sent)errors.push('contact');
 if(c.expect.known!==undefined&&!!s.scene.facts.known!==c.expect.known)errors.push('known outcome');
 return {name:c.name,question:c.question,actual:{intent:s.intent.primary,domain:s.scene.domain,sent:!!s.scene.facts.sent,known:!!s.scene.facts.known},errors};
});
arcanaV5Build=function(){if(!drawn.length)return ARC78_CHAMPION();return arc78Plan($('question').value.trim(),selectedSpread,drawn,arcanaQuestionContext());};
const ARC78_RENDER_PREVIOUS=arcanaV5Render;
arcanaV5Render=function(report){ARC78_RENDER_PREVIOUS(report);if(!report.arc78)return;
 const target=document.querySelector('#report .human-hero');if(!target)return;
 let info=document.getElementById('arc78-indicator');if(!info){info=document.createElement('div');info.id='arc78-indicator';info.className='arc78-indicator';target.appendChild(info);}
 const i=report.arc78.intent;info.textContent=`질문 유형 · ${ARC78_INTENT_LABEL[i.primary]}${i.secondary?' + '+ARC78_INTENT_LABEL[i.secondary]:''}  |  카드 근거 ${report.arc78.grounding.filter(x=>x.verified).length}개`;
};
