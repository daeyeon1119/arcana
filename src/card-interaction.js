/* Select among authored card meanings; this does not estimate truth or quality. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ARCANA_CARD_INTERACTION=api;})(globalThis,function(){
 'use strict';
 function focus(motifs,opposite,reversed){
  const directional=motifs.filter(m=>!opposite.includes(m));
  const motif=reversed&&opposite.includes(motifs[0])&&directional.length?directional[0]:motifs[0];
  return {motif,rank:motifs.indexOf(motif),directional:!opposite.includes(motif),reason:motif!==motifs[0]?'reversal-specific-facet':'canonical-primary'};
 }
 function select(left,right,leftOpposite,rightOpposite,rules){
  const candidates=[];
  rules.forEach(([axis,kind,x,y],ruleIndex)=>{
   for(const [ls,rs]of [[x,y],[y,x]])for(const lm of left.filter(m=>ls.includes(m)))for(const rm of right.filter(m=>rs.includes(m))){
    const directional=Number(!leftOpposite.includes(lm))+Number(!rightOpposite.includes(rm)),primary=Number(left[0]===lm)+Number(right[0]===rm);
    if(!candidates.some(c=>c.ruleIndex===ruleIndex&&c.left===lm&&c.right===rm))candidates.push({ruleIndex,axis,kind,left:lm,right:rm,directional,primary});
   }
  });
  candidates.sort((a,b)=>b.directional-a.directional||b.primary-a.primary||a.ruleIndex-b.ruleIndex);
  return candidates.length?{version:91,selected:candidates[0],candidates,rule:'orientation-specific facets, then canonical primary coverage, then authored order; editorial selection, not confidence'}:null;
 }
 return Object.freeze({focus,select});
});
