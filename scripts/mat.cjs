const fs=require('node:fs'),assert=require('node:assert/strict');
const phase=process.argv[2]||'after';
(async()=>{const b=await require('./browser.cjs')();const results=[];
 try{const p=await b.newPage({reducedMotion:'reduce'});await p.route('https://**/*',r=>r.abort());await p.goto(b.appURL,{waitUntil:'domcontentloaded',timeout:60000});
 fs.mkdirSync('test-results/mat',{recursive:true});
 for(const width of (phase==='before'?[390,1440]:[360,390,768,1440]))for(const spread of ['one','three','five','relationship5','choice5','waiting3','career5','celtic']){
  if(spread==='one')console.log(`Checking all 8 mats at ${width}px`, {phase});
  await p.setViewportSize({width,height:1000});
  await p.evaluate(s=>{selectedSpread=s;drawn=CARDS.slice(0,SPREADS[s].slots.length).map((c,i)=>({id:c.id,rev:i%3===0}));opened=new Set(drawn.map((_,i)=>i));ritualPhase='complete';document.getElementById('reading').classList.add('visible');document.getElementById('ritual').hidden=true;document.getElementById('readingCards').hidden=false;document.getElementById('readingBottom').hidden=false;renderDrawn();},spread);
  await p.locator('#readingCards').scrollIntoViewIfNeeded();
  await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#readingCards img')].map(i=>{i.loading='eager';return i.decode();}));if(typeof arc80CompactMats==='function')arc80CompactMats();});
  const geometry=await p.evaluate(()=>{const stage=document.getElementById('readingCards'),board=stage.querySelector('.v17-board-grid');return {stageWidth:stage.clientWidth,boardWidth:board.getBoundingClientRect().width,boardHeight:board.getBoundingClientRect().height,scrollWidth:stage.scrollWidth,names:[...stage.querySelectorAll('.drawn-name')].filter(e=>getComputedStyle(e).display!=='none').length,cards:[...board.querySelectorAll('.draw-card')].map(c=>({w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height,label:c.getAttribute('aria-label')}))};});
  results.push({width,spread,...geometry});
  if(phase==='after'){assert(geometry.boardWidth<=geometry.stageWidth+1,`${width} ${spread} overflows`);assert.equal(geometry.names,0);assert(geometry.cards.every(c=>c.label.includes('방향')));}
  if(['three','five','choice5','celtic'].includes(spread))await p.locator('#readingCards').screenshot({path:`test-results/mat/${phase}-${spread}-${width}.png`});
 }
 if(phase==='after'){
  await p.evaluate(()=>{selectedSpread='choice5';drawn=CARDS.slice(0,5).map(c=>({id:c.id,rev:false}));opened=new Set([0,2]);ritualPhase='revealing';renderDrawn();});
  assert.equal(await p.locator('#readingCards .draw-card.opened').count(),2);assert.equal(await p.locator('#readingCards .drawn-name:visible').count(),0);
  await p.evaluate(()=>{v17EnsureLiveOverview();arc80CompactMats();});
  assert.equal(await p.locator('#v17ReportOverview .v17-overview-card small').count(),0);
 }
 fs.writeFileSync(`test-results/mat/${phase}-geometry.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({phase,layouts:results.length,overflows:results.filter(r=>r.boardWidth>r.stageWidth+1).map(r=>({width:r.width,spread:r.spread}))},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
