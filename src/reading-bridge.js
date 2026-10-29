/* Editorial task × symbolic-lens composition. Card profiles remain the source
 * of the lens; literal question evidence never becomes proof of a card claim. */
(function(root){
 'use strict';
 const groups={
  evidence:['clarity','doubt','uncertain','intuition','ideals','reality','review'],
  pace:['speed','impulse','pause','patience','delay','avoidance'],
  capacity:['overload','depleted','scarcity','resources'],
  boundary:['bounds','autonomy','rigid','structure'],
  exchange:['connection','exchange','support','isolation','mismatch','expression','suppression','conflict'],
  iteration:['practice','skill','perfection','dispersion','plan'],
  values:['choice','values','recognition','comparison','judgement','joy'],
  transition:['start','agency','explore','transition','closure','attachment','flexibility'],
  care:['care','grief','recovery','hope','balance','security']
 };
 const work={improve:'바꿀 방법',prepare:'준비 순서',coordinate:'할 일과 맡을 범위',prioritize:'우선순위',finish:'마칠 기준',implement:'다음 실행'};
 // Task families per lens. These do not select outcomes or invent a
 // question-specific event; the requested work still comes from the parser.
 const lenses={
  evidence:{
   communicate:'설명에서 확인한 내용과 아직 가정인 부분을 나누고, 결론을 뒷받침하는 근거부터 전달해 보세요.',
   inquire:'내 추측을 맞다고 확인받는 질문보다, 무엇을 알고 무엇이 미확인인지 구별할 질문을 먼저 적어 보세요.',
   verify:'조건의 출처와 기준일을 표시하고, 결정을 바꿀 만큼 중요한 미확인 항목부터 대조해 보세요.',
   work:'확인한 정보로 정할 수 있는 부분과 추가 근거가 있어야 정할 부분을 구분해 보세요.',
   cope:'떠오르는 예상과 실제 확인한 일을 따로 적어, 모르는 부분을 최악의 결론으로 채우지 않도록 살펴보세요.',
   compare:'각 안에서 확인된 조건과 기대에 그치는 부분을 같은 항목으로 나누어 보세요. 더 좋아 보이는 느낌을 실제 근거와 구별합니다.',
   option:'이 안의 확인된 조건과 기대에 그치는 부분을 나누고, 아직 모르는 점은 추가로 확인할 항목으로 남겨 보세요.'
  },
  pace:{
   communicate:'지금 꼭 전할 요점과 조금 뒤에 답해도 되는 내용을 나누고, 상대가 이해하거나 답할 여백을 남겨 보세요.',
   inquire:'한꺼번에 많은 답을 얻으려 하기보다 지금 필요한 질문부터 묻고, 답을 정리한 뒤 이어서 물을 순서를 정해 보세요.',
   verify:'서둘러 넘기면 되돌리기 어려운 조건을 먼저 확인하고, 기다려야 확인되는 항목에는 확인 시점을 따로 적어 보세요.',
   work:'지금 진행할 부분과 잠시 멈춰 확인할 부분을 나누고, 다음 판단을 할 시점을 정해 보세요.',
   cope:'결론을 재촉하는 마음이 올라올 때 바로 행동할 일과 잠시 보류할 일을 나누고, 기다리는 동안 지킬 일상을 정해 보세요.',
   compare:'각 안의 시작 시점과 지속할 속도를 실제 일정에 대입해 보세요. 빠른 진전과 오래 감당할 수 있는 방식은 따로 비교합니다.',
   option:'이 안의 시작 시점과 지속할 속도를 실제 일정에 대입하고, 서두를 부분과 시간을 두고 확인할 부분을 나누어 보세요.'
  },
  capacity:{
   communicate:'모든 사정을 한 번에 설명하기보다 핵심과 꼭 필요한 확인을 먼저 전하고, 설명에 쓸 시간과 힘도 감당할 범위로 정해 보세요.',
   inquire:'반드시 답이 필요한 질문과 나중에 확인해도 되는 질문을 나누고, 메모나 안내 자료로 대신 확인할 수 있는 부분도 살펴보세요.',
   verify:'필요한 비용·시간·노력이 실제로 확보된 범위에 들어가는지 확인하고, 부족한 항목은 추측으로 메우지 말고 미확인으로 남겨 보세요.',
   work:'필수 항목이 실제로 쓸 수 있는 시간과 힘 안에 들어가는지 살피고, 줄이거나 다음으로 미룰 부분을 정해 보세요.',
   cope:'지금의 부담을 더 견디는 방법만 찾기보다 줄일 몫과 회복할 시간을 나누고, 필요한 도움을 받을 통로가 있는지도 살펴보세요.',
   compare:'각 안의 시간·비용·회복 부담을 나란히 적고, 선택 뒤에도 남겨 둘 여유가 있는지 비교해 보세요.',
   option:'이 안에 필요한 시간·비용·노력을 적고, 선택 뒤에도 감당할 여유가 남는지 확인해 보세요.'
  },
  boundary:{
   communicate:'내가 설명할 수 있는 범위와 다른 확인이 필요한 부분을 구분하고, 약속할 수 없는 내용은 확답 대신 확인할 항목으로 남겨 보세요.',
   inquire:'답이 필요한 범위를 분명히 하되 상대가 답하기 어려운 부분이나 거절할 여지도 함께 확인해 보세요.',
   verify:'반드시 지켜야 할 요건과 조정 가능한 조건을 나누고, 변경·중단 때 누가 무엇을 확인해야 하는지 살펴보세요.',
   work:'스스로 정할 수 있는 범위와 추가 확인이 필요한 부분을 나누고, 지킬 기준과 바꿔도 되는 방식을 구분해 보세요.',
   cope:'내가 책임질 행동과 다른 사람의 선택을 나누어 보세요. 지킬 수 있는 경계를 정하는 일이 감정을 없애야 한다는 뜻은 아닙니다.',
   compare:'각 안에서 지킬 수 있는 자율성, 책임과 변경 조건을 비교해 보세요. 좋은 조건이라도 감당할 범위를 넘는지 함께 살펴봅니다.',
   option:'이 안을 택했을 때 지킬 수 있는 자율성과 맡을 책임, 변경 조건이 감당할 범위에 들어오는지 확인해 보세요.'
  },
  exchange:{
   communicate:'전할 내용만 정리하기보다 듣거나 읽는 사람이 무엇을 이해했는지 확인할 질문을 남기고, 서로 다른 이해를 조정할 통로를 마련해 보세요.',
   inquire:'답변을 재촉하거나 원하는 답을 유도하기보다 상대의 설명을 들을 수 있는 질문을 만들고, 이해가 다른 부분은 다시 확인해 보세요.',
   verify:'같은 조건을 다르게 이해할 여지가 있는지 문서나 안내에서 대조해 보세요. 함께 확인할 사람이 있다면 각자가 부담할 몫도 명확히 해 보세요.',
   work:'관계된 사람이 있다면 기대하는 결과와 완료 기준을 맞추고, 말하지 않은 기대를 이미 합의한 것으로 다루지 않도록 살펴보세요.',
   cope:'오간 말이 있다면 그 내용과 덧붙인 해석을 나누고, 마음을 나눌 때는 상대의 동의와 지금 가능한 범위도 확인해 보세요.',
   compare:'각 안에서 필요한 협력과 소통 방식이 어떤지 살펴보세요. 혼자 바꿀 수 있는 일과 상대의 동의가 필요한 일을 나누어 비교합니다.',
   option:'이 안에 필요한 협력과 소통 방식을 살피고, 혼자 정할 수 있는 일과 상대의 동의가 필요한 일을 나누어 보세요.'
  },
  iteration:{
   communicate:'전하려는 핵심 한 가지를 짧게 설명해 보고, 어느 부분이 어렵게 들리는지 확인한 뒤 그 부분부터 다듬어 보세요.',
   inquire:'먼저 해 본 방법과 막힌 지점을 붙여 질문을 구체화하고, 답을 얻은 뒤 실제로 확인할 작은 기준도 정해 보세요.',
   verify:'조건을 읽는 것에서 끝내지 말고, 가능한 범위에서 직접 따라 해 보거나 구체적인 사례로 확인할 항목을 정해 보세요.',
   work:'이번 단계에서 확인할 한 가지와 완료 기준을 정하고, 전체를 동시에 바꾸거나 끝없이 점검하지 않도록 범위를 좁혀 보세요.',
   cope:'결과 전체를 자기평가로 받아들이기보다 이번에 해 본 일과 달라진 작은 부분을 적고, 아직 배우는 과정도 남겨 두세요.',
   compare:'각 안을 작게 경험하거나 같은 질문으로 확인할 수 있는지 살펴보세요. 실제로 얻을 피드백과 반복할 기회를 비교합니다.',
   option:'이 안을 작게 경험할 방법과 실제 피드백을 얻을 통로가 있는지 확인하고, 배운 점을 반복해 적용할 기회도 살펴보세요.'
  },
  values:{
   communicate:'내가 꼭 전하려는 뜻과 선택의 기준을 짧고 구체적으로 말해 보세요. 인정받고 싶은 마음이 있다면 그 마음과 전달할 사실도 나누어 볼 수 있습니다.',
   inquire:'원하는 결론을 확인받기보다 자신에게 중요한 기준을 알아볼 질문을 만들고, 답을 들은 뒤 무엇을 판단할지 정해 보세요.',
   verify:'다른 사람에게 좋아 보이는 조건과 나에게 꼭 필요한 요건을 구분하고, 우선 지킬 기준부터 확인해 보세요.',
   work:'이번 일에서 꼭 지키려는 목적에 필요한 기준부터 정해 보세요. 외부 평가가 신경 쓰인다면 그 평가와 목적을 나누어 볼 수 있습니다.',
   cope:'평가나 비교가 마음에 걸린다면 그것이 나의 전체 가치를 정하는지 돌아보세요. 고칠 행동과 스스로에게 붙인 단정은 나누어 볼 수 있습니다.',
   compare:'선택지의 장점 수를 세기보다 자신에게 중요한 기준의 순서를 먼저 정해 보세요. 양보할 수 있는 조건과 지킬 조건을 구분합니다.',
   option:'이 안이 자신에게 중요한 기준에 맞는지 살피고, 외부에서 좋아 보이는 점과 스스로 지킬 조건을 구분해 보세요.'
  },
  transition:{
   communicate:'이미 정한 내용과 아직 열려 있는 부분을 구분하고, 이번 설명 뒤 무엇을 확인하거나 시작하려는지 분명히 해 보세요.',
   inquire:'이미 확인한 일을 되풀이해 묻는지, 다음 단계에 꼭 필요한 새 정보를 묻는지 나누어 보세요.',
   verify:'이미 마친 절차와 다음 단계에서 새로 필요한 조건을 나누고, 이전 조건이 그대로 적용되는지 공식 안내로 확인해 보세요.',
   work:'이미 끝난 부분과 이번에 마칠 부분, 다음 단계로 넘길 부분을 나누고, 이번 단계의 경계를 분명히 해 보세요.',
   cope:'달라진 부분이 있다면 바로 받아들여야 한다고 재촉하기보다, 끝난 일과 아직 선택할 수 있는 일을 나누고 이어 갈 작은 일상을 정해 보세요.',
   compare:'각 안을 택하면 남길 것과 달라질 것, 되돌릴 수 있는 범위를 나누어 보세요. 익숙함과 실제 적합성은 따로 비교합니다.',
   option:'이 안을 택하면 남길 것과 달라질 것, 되돌릴 수 있는 범위를 적고, 익숙함과 실제 적합성을 구분해 보세요.'
  },
  care:{
   communicate:'내용을 정확히 전하는 것과 감당할 수 있는 말의 양을 함께 살피고, 상대와 나 모두에게 필요한 속도로 설명해 보세요.',
   inquire:'불편하거나 걱정되는 점도 질문할 수 있도록 우선순위를 적고, 답을 놓쳤을 때 메모나 재설명을 부탁할 방법을 준비해 보세요.',
   verify:'시작할 때의 요건뿐 아니라 계속 이용하거나 실행할 때 생기는 부담과 중단할 때의 조건도 실제 일정과 함께 확인해 보세요.',
   work:'성과만으로 기준을 정하지 말고 계속 유지할 수 있는 분량과 회복할 여지도 함께 남겨 보세요.',
   cope:'힘든 마음이 바로 사라져야 한다고 재촉하지 말고, 지금 필요한 휴식과 지지, 이어 갈 수 있는 작은 일상을 구분해 보세요.',
   compare:'각 안이 생활의 안정과 회복할 여지를 얼마나 남기는지 살펴보세요. 기대하는 만족과 유지에 드는 부담을 함께 비교합니다.',
   option:'이 안이 생활의 안정과 회복할 여지를 얼마나 남기는지 살피고, 기대하는 만족과 유지에 드는 부담을 함께 확인해 보세요.'
  }
 };
 const relationGroups={focus:'evidence',threshold:'evidence',enough:'evidence',reflection:'evidence',evidence:'evidence',capacity:'capacity',means:'capacity',sustain:'capacity',pace:'pace',readiness:'iteration',restoration:'care',release:'care',space:'boundary',ending:'transition',adaptation:'boundary',framework:'boundary',repair:'exchange',voice:'exchange',evaluation:'values'};
 const selfLenses={exchange:{work:'원하는 결과와 실제 진행 상태를 나누어 보고, 어긋나는 부분이 있다면 이번 단계에서 바꿀 수 있는 조건부터 확인해 보세요.',cope:'기대한 모습과 실제로 겪은 일을 나누어 적고, 그 차이 때문에 느끼는 마음과 지금 바꿀 수 있는 행동을 구별해 보세요.',option:'이 안에서 기대하는 경험과 실제로 확인할 조건을 나누어 보세요. 다른 사람의 협력이나 확인이 필요한 부분이 있다면 별도 항목으로 남겨 보세요.'},boundary:{cope:'내가 선택할 수 있는 행동과 지금 조절하기 어려운 조건을 나누어 보세요. 경계를 정하는 일이 느끼는 감정을 없애야 한다는 뜻은 아닙니다.'}};
 function compose(operation,motifs,relationAxis,context={}){
  const primary=motifs?.[0],axisGroup=Object.keys(groups).find(key=>groups[key].includes(relationAxis)),group=relationGroups[relationAxis]||axisGroup||Object.keys(groups).find(key=>groups[key].includes(primary));
  if(!group)return null;
  const family=Object.hasOwn(work,operation)?'work':operation,selfLens=context.participants!==true&&selfLenses[group]?.[family],text=selfLens||lenses[group][family];if(!text)return null;
  const noun=work[operation],last=noun?.charCodeAt(noun.length-1),particle=last>=0xac00&&last<=0xd7a3&&(last-0xac00)%28===0?'를':'을';
  const relationUsed=!!(relationAxis&&(relationGroups[relationAxis]||axisGroup));
  return {operation,primary:relationUsed?null:primary,group,relationAxis:relationUsed?relationAxis:null,contextRule:selfLens?'self-or-unknown':null,text:family==='work'?noun+particle+' 정할 때는 '+text:text};
 }
 const api=Object.freeze({compose,groups});if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_READING_BRIDGE=api;
})(typeof globalThis==='object'?globalThis:this);
