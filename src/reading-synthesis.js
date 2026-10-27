/* v81: named semantic motifs, positional relationships and a traceable reading. */
// These are editorial classifications of ARC58_ATOMS, not probabilities or new events.
const ARC81_MOTIFS={
 start:['시작','완벽하게 준비된 뒤의 출발과 작게 시험해 보는 출발을 구분해 보세요.'],
 agency:['주도성','내가 정할 수 있는 일과 다른 사람의 몫을 나누어 보세요.'],
 skill:['역량','이미 가진 능력을 실제로 쓸 장면을 하나 골라 보세요.'],
 plan:['계획','크게 세운 방향을 확인 가능한 다음 단계로 나누어 보세요.'],
 speed:['속도','빨리 움직이는 것과 방향에 맞게 움직이는 것을 구별해 보세요.'],
 pause:['멈춤','잠시 멈출 이유와 다시 움직일 기준을 함께 정해 보세요.'],
 patience:['인내','기다리는 동안 유지할 일과 기다림을 끝낼 기준을 나누어 보세요.'],
 delay:['지연','외부 절차가 늦어지는 것과 결정을 미루는 일을 구별해 보세요.'],
 overload:['과부하','감당할 수 있는 범위와 추가로 떠안은 몫을 나누어 보세요.'],
 balance:['균형','둘 다 잘하려는 기준보다 지금 지속할 수 있는 비율을 살펴보세요.'],
 care:['돌봄','관심을 주는 일에 나 자신의 필요도 포함되어 있는지 돌아보세요.'],
 depleted:['소진','계속 버티는 방식이 회복할 여지를 남기는지 점검해 보세요.'],
 structure:['구조','역할과 약속, 완료 기준을 구체적으로 정하면 무엇이 달라질지 살펴보세요.'],
 rigid:['경직','지키려는 원칙과 바꾸어도 되는 방식을 나누어 보세요.'],
 bounds:['경계','내가 맡을 몫과 맡지 않을 몫을 구별해 보세요.'],
 autonomy:['자율성','익숙한 기대와 별개로 스스로 지키고 싶은 기준을 적어 보세요.'],
 attachment:['매임','계속 유지하는 이유와 달라진 현실을 따로 적어 보세요.'],
 connection:['교류','내 기대뿐 아니라 상대가 실제로 표현한 의사도 함께 살펴보세요.'],
 exchange:['상호성','주고받는 관심과 부담이 서로 감당할 수 있는지 점검해 보세요.'],
 support:['지원','혼자 해야 한다고 여긴 일 가운데 도움을 받을 수 있는 부분을 찾아보세요.'],
 isolation:['고립','혼자 있을 필요와 도움을 받기 어려운 상태를 구별해 보세요.'],
 conflict:['충돌','서로 다른 의견과 관계를 해치는 방식의 다툼을 나누어 보세요.'],
 clarity:['명료함','확인한 사실과 그 사실에 덧붙인 해석을 구별해 보세요.'],
 doubt:['의심','의심을 뒷받침하는 정보와 아직 모르는 부분을 따로 적어 보세요.'],
 uncertain:['불확실성','정보가 부족한 부분을 확신이나 최악의 예상으로 채우지 않아도 됩니다.'],
 intuition:['직관','직감이 알려 주는 마음과 실제로 확인해야 할 정보를 나누어 보세요.'],
 choice:['선택','서로 다른 안을 같은 기준으로 비교하고 있는지 확인해 보세요.'],
 values:['가치','내가 중요하게 여기는 것과 실제 선택의 기준이 이어지는지 살펴보세요.'],
 mismatch:['엇갈림','같은 말이나 약속을 서로 다르게 이해하는 부분이 있는지 확인해 보세요.'],
 transition:['전환','떠날 부분과 다음 단계에 가져갈 것을 나누어 보세요.'],
 closure:['마무리','끝난 일과 아직 처리할 과제를 분리해 보세요.'],
 avoidance:['회피','조금 더 기다려야 할 이유와 불편해서 미루는 이유를 구별해 보세요.'],
 grief:['상실','잃은 것을 인정할 시간과 아직 남아 있는 것을 함께 살펴보세요.'],
 recovery:['회복','회복을 서두르기보다 지금 달라진 작은 지점부터 확인해 보세요.'],
 hope:['희망','바라는 가능성과 그 가능성을 뒷받침할 조건을 나누어 보세요.'],
 joy:['만족','좋아 보이는 모습과 스스로 편안하게 느끼는 상태가 같은지 돌아보세요.'],
 recognition:['인정','외부의 평가와 내가 지키려는 목표를 나누어 보세요.'],
 comparison:['비교','다른 사람의 성과와 내 과정에서 확인할 기준을 분리해 보세요.'],
 practice:['연습','반복한 시간과 실제로 달라진 부분을 함께 확인해 보세요.'],
 perfection:['완벽주의','이번 단계에 필요한 완성도와 끝없이 고치고 싶은 부분을 구별해 보세요.'],
 security:['안정','지키려는 기반과 그 기반을 유지하는 데 드는 부담을 함께 살펴보세요.'],
 scarcity:['부족함','실제로 부족한 자원과 접근하지 못하고 있는 도움을 나누어 보세요.'],
 resources:['자원','쓸 수 있는 시간·경험·물질적 조건을 구체적으로 확인해 보세요.'],
 flexibility:['유연성','지킬 목적은 남기고 방식을 바꿀 수 있는 부분을 찾아보세요.'],
 review:['재검토','기존의 판단과 새로 알게 된 정보를 나란히 놓아 보세요.'],
 judgement:['자기평가','고칠 행동에 대한 평가와 나 자신에 대한 단정을 나누어 보세요.'],
 impulse:['충동','지금 움직이고 싶은 마음과 그 뒤 감당할 조건을 함께 살펴보세요.'],
 expression:['표현','내가 느끼는 것과 실제로 전달한 말 사이의 차이를 돌아보세요.'],
 suppression:['억제','감정을 조절하는 일과 감정을 드러내지 못하는 일을 구별해 보세요.'],
 ideals:['이상','기대하는 모습과 현재 확인할 수 있는 모습을 나누어 보세요.'],
 reality:['현실성','생각한 가능성을 실제 조건이나 작은 시도로 확인해 보세요.'],
 explore:['탐색','아직 정하지 않은 것을 실패로 보지 말고 알아볼 범위를 정해 보세요.'],
 dispersion:['분산','여러 가능성 가운데 이번 단계에서 집중할 한 가지를 골라 보세요.']
};
// Upright / reversed themes are explicit for every card. Reversal is not a negative score.
const ARC81_PROFILES={
 ar00:['start,explore','impulse,reality'],ar01:['agency,skill','dispersion,delay'],ar02:['intuition,uncertain','doubt,uncertain'],ar03:['care,resources','care,overload'],
 ar04:['structure,bounds','rigid,bounds'],ar05:['support,skill','review,autonomy'],ar06:['values,choice','mismatch,delay'],ar07:['agency,speed','speed,dispersion'],
 ar08:['patience,balance','doubt,suppression'],ar09:['pause,review','isolation,support'],ar10:['transition,flexibility','avoidance,delay'],ar11:['clarity,values','review,mismatch'],
 ar12:['pause,review','delay,overload'],ar13:['closure,transition','attachment,delay'],ar14:['balance,flexibility','mismatch,balance'],ar15:['attachment,review','autonomy,transition'],
 ar16:['transition,security','avoidance,delay'],ar17:['recovery,hope','doubt,hope'],ar18:['uncertain,intuition','clarity,review'],ar19:['clarity,joy','delay,ideals'],
 ar20:['review,agency','judgement,delay'],ar21:['closure,joy','delay,closure'],
 wa01:['start,agency','depleted,pause'],wa02:['plan,explore','choice,avoidance'],wa03:['explore,patience','delay,reality'],wa04:['security,connection','security,depleted'],
 wa05:['conflict,explore','conflict,avoidance'],wa06:['recognition,agency','recognition,doubt'],wa07:['bounds,agency','bounds,depleted'],wa08:['speed,expression','mismatch,delay'],
 wa09:['patience,bounds','depleted,bounds'],wa10:['overload,resources','overload,support'],wa11:['start,explore','impulse,reality'],wa12:['speed,agency','impulse,delay'],
 wa13:['expression,agency','comparison,doubt'],wa14:['agency,plan','rigid,dispersion'],
 cu01:['expression,connection','suppression,pause'],cu02:['connection,exchange','mismatch,exchange'],cu03:['connection,support','isolation,connection'],cu04:['pause,review','choice,impulse'],
 cu05:['grief,resources','recovery,transition'],cu06:['connection,review','attachment,review'],cu07:['choice,ideals','choice,reality'],cu08:['transition,autonomy','attachment,avoidance'],
 cu09:['joy,values','ideals,review'],cu10:['connection,security','ideals,mismatch'],cu11:['expression,connection','ideals,mismatch'],cu12:['expression,connection','ideals,mismatch'],
 cu13:['care,support','care,bounds'],cu14:['balance,pause','suppression,expression'],
 sw01:['clarity,review','uncertain,impulse'],sw02:['choice,pause','choice,delay'],sw03:['grief,clarity','grief,recovery'],sw04:['pause,recovery','depleted,delay'],
 sw05:['conflict,bounds','conflict,closure'],sw06:['transition,security','attachment,delay'],sw07:['plan,bounds','clarity,expression'],sw08:['uncertain,bounds','autonomy,review'],
 sw09:['doubt,uncertain','recovery,expression'],sw10:['grief,closure','grief,recovery'],sw11:['clarity,explore','doubt,impulse'],sw12:['speed,agency','speed,conflict'],
 sw13:['clarity,bounds','bounds,mismatch'],sw14:['clarity,structure','rigid,support'],
 pe01:['start,resources','scarcity,impulse'],pe02:['balance,flexibility','overload,depleted'],pe03:['skill,support','mismatch,structure'],pe04:['security,bounds','attachment,rigid'],
 pe05:['scarcity,isolation','support,recovery'],pe06:['exchange,support','exchange,mismatch'],pe07:['patience,practice','impulse,review'],pe08:['practice,skill','perfection,depleted'],
 pe09:['autonomy,resources','comparison,doubt'],pe10:['security,structure','mismatch,security'],pe11:['skill,plan','plan,delay'],pe12:['practice,patience','rigid,delay'],
 pe13:['care,resources','care,depleted'],pe14:['security,resources','attachment,rigid']
};
const ARC81_LINKS=[
 ['focus','complement',['agency','speed'],['clarity'],'추진력을 방향과 사실 확인에 연결하는 조합입니다. 힘을 더 쓰기 전에 무엇을 확인하면 다음 행동이 분명해질지 살펴보세요.'],
 ['threshold','tension',['uncertain','doubt'],['perfection'],'모르는 부분을 빈틈없이 해결하려다 보면 판단의 기준이 흐려질 수 있습니다. 실제로 더 알아볼 점과 지금 확인한 정도로 받아들일 점을 나누어 보세요.'],
 ['enough','complement',['clarity','review'],['perfection'],'명확히 확인할 점과 완벽히 알아낼 때까지 되짚고 싶은 부분을 구별하는 연결입니다. 어느 정도면 다음 단계로 넘어갈 수 있을지 기준을 정해 볼 수 있습니다.'],
 ['release','complement',['recovery','support'],['attachment','delay'],'도움과 회복의 여지를 활용하면서 오래 붙잡고 있는 부분을 살펴보는 조합입니다. 당장 끝내야 한다는 뜻보다, 다시 움직일 수 있는 작은 여지를 찾는 관점입니다.'],
 ['reflection','complement',['pause'],['clarity'],'멈추는 시간을 판단을 정리하는 시간으로 활용하는 연결입니다. 즉시 결론을 내리는 일보다 잠시 거리를 둔 뒤 확인할 사실을 분명히 해볼 수 있습니다.'],
 ['capacity','complement',['overload','depleted'],['support','exchange','bounds'],'부담을 더 견디는 방법보다 도움과 역할의 경계를 활용해 감당할 몫을 조정하는 관점으로 이어집니다.'],
 ['evidence','complement',['uncertain','doubt','ideals'],['clarity','reality'],'모호한 느낌을 곧바로 결론으로 삼기보다, 확인 가능한 정보를 통해 기대와 추측을 가려내는 연결입니다.'],
 ['pace','tension',['speed','impulse'],['pause','patience'],'빠르게 움직이려는 힘과 멈추어 살필 필요가 함께 있습니다. 진행할 부분과 기다릴 부분을 나누는 것이 두 상징을 함께 활용하는 방법입니다.'],
 ['readiness','complement',['start','speed','agency'],['plan','practice','skill'],'움직이려는 힘을 준비와 연습에 연결하는 조합입니다. 큰 결론을 한꺼번에 내리기보다 확인할 수 있는 작은 실행으로 옮겨 볼 수 있습니다.'],
 ['restoration','complement',['grief','depleted'],['recovery','hope','care'],'어려움을 바로 없애려는 시선에서 회복에 필요한 시간과 돌봄을 살피는 쪽으로 이어집니다. 힘든 경험이 저절로 좋은 결과로 바뀐다고 해석하지는 않습니다.'],
 ['space','tension',['autonomy','bounds'],['connection','care'],'함께하고 싶은 마음과 스스로 지킬 범위를 동시에 살펴보는 조합입니다. 가까워지는 정도보다 서로 감당할 수 있는 방식이 중요합니다.'],
 ['ending','tension',['closure','transition'],['attachment','avoidance'],'다음 단계로 옮겨가는 힘과 익숙한 것을 유지하려는 힘이 맞닿습니다. 이미 끝난 부분과 계속 선택할 수 있는 부분을 나누어 보면 망설임을 구체화할 수 있습니다.'],
 ['adaptation','complement',['rigid'],['flexibility','balance'],'기준 자체를 포기하기보다 같은 목적을 다른 방식으로 지킬 수 있는지 살펴보는 연결입니다.'],
 ['framework','tension',['structure','security'],['explore','flexibility'],'안정된 틀을 지키는 일과 새 가능성에 맞게 바꾸는 일 사이의 조율이 필요합니다. 유지할 기준과 시험해 볼 방식을 나누어 보세요.'],
 ['repair','complement',['conflict','isolation'],['support','exchange','connection'],'다른 사람을 이기거나 혼자 버티는 방향보다, 의견과 역할을 확인할 통로가 있는지 살피는 연결입니다. 관계 회복이나 상대의 동의를 보장하는 조합은 아닙니다.'],
 ['means','complement',['scarcity'],['resources','security'],'부족하다고 느끼는 부분과 실제로 쓸 수 있는 기반을 나란히 살피는 조합입니다. 마음의 불안과 확인 가능한 자원의 크기를 구별해 볼 수 있습니다.'],
 ['voice','tension',['expression'],['suppression'],'느끼는 마음을 드러내는 일과 조절하거나 숨기는 일 사이의 차이가 드러납니다. 무엇을 누구에게 어느 정도 전할지는 실제 상황에 맞춰 정해야 합니다.'],
 ['evaluation','tension',['recognition','comparison'],['values','autonomy'],'밖에서 받는 평가와 스스로 지키려는 기준을 구분할 필요가 있습니다. 인정받는 선택과 자신에게 맞는 선택이 항상 같지는 않다는 관점입니다.'],
 ['sustain','tension',['agency','start'],['pause','depleted'],'시작하거나 밀고 나가는 힘과 쉬어 갈 여지를 함께 보는 조합입니다. 계속할 의지와 지금 감당할 수 있는 양을 따로 살펴보세요.']
];
function arc81Profile(atom){
 const raw=ARC81_PROFILES[atom.id]?.[atom.reverse?1:0];
 if(!raw)throw new Error('카드 세부 주제가 없습니다: '+atom.id);
 return raw.split(',');
}
function arc81Anchor(atom,spread){return `‘${SPREADS[spread].slots[atom.index][0]}’의 ${atom.name} ${atom.reverse?'역방향':'정방향'}은 ‘${atom.main}’${arc58Josa(atom.main,'을','를')} 보여 줍니다.`;}
function arc81Relation(a,b,spread){
 const left=arc81Profile(a),right=arc81Profile(b),shared=left.filter(x=>right.includes(x));
 const match=ARC81_LINKS.find(([, ,x,y])=>left.some(m=>x.includes(m))&&right.some(m=>y.includes(m))||left.some(m=>y.includes(m))&&right.some(m=>x.includes(m)));
 let kind,axis,insight;
 if(match){[axis,kind]=match;insight=match[4];}
 else if(shared.length){kind='shared';axis=shared[0];insight=`두 카드에서는 ‘${ARC81_MOTIFS[axis][0]}’${arc58Josa(ARC81_MOTIFS[axis][0],'이라는','라는')} 주제를 함께 살펴볼 수 있습니다. ${ARC81_MOTIFS[axis][1]}`;}
 else{kind='distinct';axis=null;insight=`‘${a.main}’${arc58Josa(a.main,'과','와')} ‘${b.main}’${arc58Josa(b.main,'은','는')} 같은 뜻으로 합치기보다 각각 다룰 과제로 읽어 보세요. 한쪽에서는 ‘${a.support}’, 다른 쪽에서는 ‘${b.support}’${arc58Josa(b.support,'을','를')} 살펴봅니다.`;}
 const roles=[a.role,b.role];
 const semanticKind=kind;
 let positional='';
 if(roles.includes('optionA')&&roles.includes('optionB')){
  kind='alternatives';
  const optionA=a.role==='optionA'?a:b,optionB=a.role==='optionB'?a:b;
  insight=`A를 살필 때는 ${ARC81_MOTIFS[arc81Profile(optionA)[0]][1]} B를 살필 때는 ${ARC81_MOTIFS[arc81Profile(optionB)[0]][1]}`;
  positional='질문에 두 안을 적었다면 A와 B를 적은 순서로 읽어 보세요. 두 경로에서 실제로 감당할 조건을 같은 기준으로 비교해 보세요.';
 }
 else if(roles.includes('boundary'))positional='이미 진행된 외부 절차와 지금 조절할 수 있는 태도를 구분해 읽습니다.';
 else if(roles.includes('obstacle'))positional='제약의 자리는 그 문제가 이미 있다고 확정하기보다, 실제로 막히는 부분이 있는지 확인하는 질문으로 읽어 보세요.';
 else if(roles.includes('future')||roles.includes('outcome'))positional='이후의 카드는 고정된 결과보다 현재의 방향에서 이어서 점검할 관점으로 읽습니다.';
 return {refs:[a.index,b.index],kind,semanticKind,axis,shared,leftMotifs:left,rightMotifs:right,insight,positional,core:`${arc81Anchor(a,spread)} ${arc81Anchor(b,spread)} ${insight}`,body:`${arc81Anchor(a,spread)} ${arc81Anchor(b,spread)} ${insight}${positional?' '+positional:''}`};
}
function arc81Relations(pack,spread){
 const byRole=r=>pack.list.find(a=>a.role===r),pairs=[];
 const add=(a,b)=>{if(!a||!b||a.index===b.index)return;const key=[a.index,b.index].sort((x,y)=>x-y).join(':');if(!pairs.some(p=>p.key===key))pairs.push({key,...arc81Relation(a,b,spread)});};
 if(spread==='choice5'){add(byRole('optionA'),byRole('optionB'));add(byRole('criteria'),byRole('advice'));}
 else if(spread==='three'){add(byRole('now'),byRole('future'));add(byRole('past'),byRole('now'));}
 else if(spread==='waiting3'){add(byRole('feeling'),byRole('advice'));add(byRole('boundary'),byRole('advice'));}
 else if(spread==='celtic'){add(byRole('now'),byRole('obstacle'));add(byRole('goal'),byRole('root'));add(byRole('self'),byRole('outcome'));}
 else if(pack.list.length>1){add(pack.main,pack.limit);add(pack.limit,pack.advice);add(byRole('resource'),pack.advice);}
 if(!['choice5','three','waiting3','celtic'].includes(spread))pairs.sort((a,b)=>({distinct:0,shared:1,tension:2,complement:2}[b.kind]-{distinct:0,shared:1,tension:2,complement:2}[a.kind]));
 return pairs;
}

// Preserve the last requested task, including requests phrased as choosing criteria or an attitude.
const ARC81_SCENE=arc79Scene;
arc79Scene=function(question,override='auto'){
 const parsed=ARC81_SCENE(question,override),s=parsed.scene,q=s.question,f=s.facts;
 const ask=q.split(/[.!?。！？]/).filter(x=>x.trim()).at(-1)||q;
 if(arc79ForcedIntent==='auto'&&!['cause','compare'].includes(parsed.intent.primary)&&/(?:어떤\s*(?:기준|태도)|무엇을|어디부터).{0,35}(?:받아들|도움|합의|조정|세울|정할)/.test(ask)){parsed.intent={...parsed.intent,primary:'action'};s.intent='action';}
 if(arc79ForcedIntent==='auto'&&/놓치고.{0,12}조건|확인할\s*조건/.test(ask)){parsed.intent={...parsed.intent,primary:'action'};s.intent='action';}
 if(/(?:친구|동료|연인|상대)(?:도|가|이).{0,22}(?:답했|대답했|회신했|답장했)/.test(q)){f.replied=true;f.noReply=false;f.replyUnknown=false;}
 if(/(?:다툰|싸운)\s*일(?:은|이|도)?\s*없/.test(q))f.noConflict=true;
 if(override==='auto'){
  if(/(?:연인|애인).{0,24}(?:생활비|지출|돈)/.test(q)&&/(?:합의|대화|이야기|소통)/.test(ask))s.domain='relationship';
  else if(s.domain==='general'&&/(?:호감|서로.{0,12}연락|관계를\s*서두르|상대.{0,12}연락)/.test(q))s.domain='relationship';
  else if(s.domain==='general'&&/(?:가게|매장|단골|손님)/.test(q))s.domain='career';
  else if(s.domain==='general'&&/(?:협업|피드백)/.test(q))s.domain='project';
 }
 return parsed;
};
const ARC81_ACTION=arc79Action;
arc79Action=function(scene,pack){
 const old=ARC81_ACTION(scene,pack),q=scene.question;
 scene.arc81ActionTask=null;
 const support=(operation,text)=>{scene.arc81ActionTask=operation;return text;};
 if(scene.boundary||scene.abuse||scene.urgent||scene.medical||scene.facts.known||scene.phase==='pending')return old;
 if(scene.domain==='relationship'&&/(?:생활비|지출|돈)/.test(q)&&/(?:합의|대화|이야기|소통)/.test(q))return support('coordinate','각자 부담할 수 있는 범위와 함께 쓸 항목을 나누고, 지출을 바꿀 때 먼저 상의할 기준을 정해 보세요.');
 if(scene.domain==='career'){
  if(/(?:옮길|이직).{0,60}(?:맡은|마무리)|(?:마무리).{0,60}(?:이직|옮길)/.test(q))return support('coordinate','현재 업무의 마감과 인수인계 범위, 새 일정에서 바꿀 수 없는 조건을 나란히 적고 조율할 담당자와 확인해 보세요.');
  if(/(?:업무|일).{0,30}(?:익히|배우)/.test(q)&&/질문/.test(q))return support('inquire','먼저 시도한 방법과 막힌 지점, 확인받을 기준을 짧게 적어 보세요. 반복해서 막히거나 다른 사람의 일정에 영향을 주는 부분부터 질문해 볼 수 있습니다.');
  if(/(?:가게|매장|단골|손님)/.test(q))return support('coordinate','기존 손님을 돕는 일과 새 손님을 맞는 일에 드는 시간을 나누고, 겹치는 시간대에 줄이거나 함께 맡을 일을 정해 보세요.');
 }
 if(scene.domain==='project'){
  if(/(?:원고|작품).{0,24}(?:투고|제출)/.test(q)&&/(?:접수|안내).{0,12}받/.test(q))return support('implement','받은 안내의 답변 일정만 기록해 두고, 새 작업에서 이번 주 마칠 수 있는 작은 단위를 정해 보세요.');
  if(/피드백|칭찬|비판/.test(q))return support('improve','작업의 목적과 직접 고칠 수 있는 피드백을 나누어 적고, 이번 수정에서 반영할 한 가지만 정해 보세요.');
  if(!/(?:소설|원고|집필|인물|장면|문장)/.test(q)&&/인물|장면|문장/.test(old))return support('improve','이번 작업의 목적과 막힌 지점을 적고, 작게 완성해 확인할 한 부분을 골라 보세요.');
 }
 return old;
};

const ARC81_REPORT=arc79CreateReport;
arc79CreateReport=function(q,spread,cards,override='auto'){
 const r=ARC81_REPORT(q,spread,cards,override),{scene,intent}=arc79Scene(q,override),pack=arc79Pack(q,spread,cards),relations=arc81Relations(pack,spread);
 const single=pack.list.map(a=>{
  const motif=arc81Profile(a)[0],slot=SPREADS[spread].slots[a.index][0];
  const role=a.role==='obstacle'?`‘${a.main}’과 관련해 실제로 막히는 부분이 있는지 확인해 보세요.`:a.role==='resource'?`이 관점을 활용할 사람·경험·조건이 실제로 있는지 살펴보세요.`:a.role==='past'?'이미 겪은 일을 바꾸기보다 현재에 남아 있는 영향을 돌아보는 자리입니다.':a.role==='future'||a.role==='outcome'?'현재의 방향이 이어질 때 점검할 관점이며, 결과가 확정됐다는 뜻은 아닙니다.':a.role==='environment'?'주변 사람의 마음을 추측하기보다 실제 말과 행동에서 확인할 수 있는 부분을 살펴보세요.':a.role==='boundary'?'이미 진행된 외부 절차를 내 행동으로 되돌릴 수 있다고 읽지는 않습니다.':'';
  return {title:slot,body:`${arc81Anchor(a,spread)} ${ARC81_MOTIFS[motif][1]}${role?' '+role:''}`,refs:[a.index],kind:'card'};
 });
 const relationTitle=(link,i)=>{
  const roles=link.refs.map(n=>pack.list[n].role);
  if(roles.includes('optionA'))return '두 선택을 함께 읽으면';
  if(i===0)return '카드가 만드는 중심 흐름';
  if(roles.includes('resource'))return '자원을 활용하는 방법';
  if(roles.includes('obstacle'))return '제약과 실천을 연결하기';
  if(roles.includes('goal'))return '바라는 것과 그 배경';
  if(roles.includes('self'))return '나의 태도와 다음 방향';
  if(roles.includes('past'))return '지나온 영향과 현재';
  return '조언으로 연결하기';
 };
 // Without a semantic link the individual cards carry the evidence; do not add filler pairs.
 r.sections=[...single,...relations.filter(link=>link.kind!=='distinct').map((link,i)=>({title:relationTitle(link,i),body:link.body,refs:link.refs,kind:'relational'}))];
 const protectedReading=scene.medical||['health','finances'].includes(scene.domain)||scene.boundary||scene.abuse||scene.urgent||scene.facts.known;
 const useDirectSynthesis=!protectedReading&&relations.length>0&&relations[0].kind!=='distinct'&&(intent.primary!=='compare'||spread==='choice5');
 if(useDirectSynthesis){
  const first=relations[0];
  // Avoid replacing a specific answer with a long list of card names. Put the connection after it.
  if(['action','emotion'].includes(intent.primary)){
   const prefix=scene.facts.sent&&!scene.facts.replied?(scene.facts.noReply?'이미 마음을 전했고 아직 답을 받지 못한 상황입니다. ':'이미 생각을 전했다는 점을 바탕으로 읽었습니다. '):'';
   r.direct=prefix+(scene.facts.noConflict?'다툰 적이 없다는 점을 전제로 읽었습니다. ':'')+r.actions[0]+' '+first.core;
  }else if(intent.primary==='compare')r.direct=first.body;
  else if(intent.primary==='forecast')r.direct=first.core+' 실제 결과와 시점은 이후의 변화로 확인해야 합니다. '+r.actions[0];
  else if(intent.primary==='cause')r.direct=(scene.facts.noConflict?'다툰 적이 없다는 점을 전제로 읽었습니다. ':'')+first.core+' 이 연결은 상황을 돌아볼 가설이며, 실제 이유는 관찰한 사실과 대화로 확인해야 합니다.';
  else if(intent.primary==='open')r.direct=first.core+' 이 두 관점 중 지금 상황에 더 맞닿는 부분은 무엇인가요?';
 }
 r.arc81={version:81,profileSource:'ARC58_ATOMS editorial motifs',directSynthesisUsed:useDirectSynthesis,relations:relations.map(({key,body,core,...x})=>x),cardMotifs:pack.list.map(a=>({index:a.index,id:a.id,reverse:a.reverse,motifs:arc81Profile(a)}))};
 return r;
};
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(r=>r.id===currentHistoryId);if(record){record.engineVersion=81;setStoredRecords(records);}});
