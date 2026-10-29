/* Shared by local and real HTTPS checks; settings are part of every input. */
exports.inputs=fixture=>fixture.questions.map(question=>({question,focus:'auto',domain:'auto'})).concat(fixture.settings||[]);
exports.probe=inputs=>{
 const previous=arc79ForcedIntent;
 try{return inputs.flatMap(({question,focus,domain})=>Object.keys(SPREADS).map((spread,s)=>{
  arc79ForcedIntent=focus;
  const cards=Array.from({length:SPREADS[spread].slots.length},(_,i)=>({id:CARDS[(s*7+i)%CARDS.length].id,rev:i%2===1}));
  return {question,focus,domain,spread,cards,report:__arcana79Build(question,spread,cards,domain)};
 }));}finally{arc79ForcedIntent=previous;}
};
