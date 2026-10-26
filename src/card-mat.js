/* Compact logical positions shared by the draw mat, reading overview and history. */
function arc80MatLayout(spread){
 const small=matchMedia('(max-width:640px)').matches;
 if(spread==='one')return [[1,1]];
 if(spread==='three'||spread==='waiting3')return [[1,1],[2,1],[3,1]];
 if(spread==='celtic')return [[2,2],[2,2],[2,1],[2,3],[1,2],[3,2],[4,4],[4,3],[4,2],[4,1]];
 if(spread==='choice5')return [[2,1],[1,2],[3,2],[1,3],[3,3]];
 if(small)return [[1,1],[2,1],[3,1],[1,2],[2,2]];
 return [[1,1],[2,1],[3,1],[4,1],[5,1]];
}
v17StyleFor=function(index,spread){const p=arc80MatLayout(spread)[index]||[index+1,1];return `grid-column:${p[0]};grid-row:${p[1]};${spread==='celtic'&&index===1?'z-index:3;':''}`;};
function arc80CompactMats(){
 document.querySelectorAll('.v17-board-grid,.v17-overview-grid').forEach(board=>{
  const spread=board.dataset.layout,layout=arc80MatLayout(spread);
  board.style.setProperty('--mat-columns',Math.max(...layout.map(p=>p[0])));
  [...board.children].forEach((card,i)=>{card.style.cssText=v17StyleFor(i,spread);card.querySelector('.drawn-name')?.remove();card.querySelector('small')?.remove();});
 });
 document.querySelectorAll('#readingCards [data-flip]').forEach(button=>{
  const i=Number(button.dataset.flip),d=drawn[i];if(!d)return;
  button.setAttribute('aria-label',`${i+1}. ${SPREADS[selectedSpread].slots[i][0]} · ${opened.has(i)?`${readCard(d).ko} · ${d.rev?'역방향':'정방향'}`:'카드 뒤집기'}`);
 });
}
const ARC80_DRAW_MAT=renderDrawn;
renderDrawn=function(){ARC80_DRAW_MAT();arc80CompactMats();};
const ARC80_FLIP_CARD=flipCardAt;
flipCardAt=function(i){ARC80_FLIP_CARD(i);arc80CompactMats();};
const ARC80_MAT_REPORT=renderReport;
renderReport=function(){ARC80_MAT_REPORT();arc80CompactMats();};
const ARC80_MAT_HISTORY=openHistoryDetail;
openHistoryDetail=function(record){ARC80_MAT_HISTORY(record);arc80CompactMats();};
matchMedia('(max-width:640px)').addEventListener('change',arc80CompactMats);
