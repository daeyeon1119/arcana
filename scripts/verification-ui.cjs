/* Known regression inputs, real draw/reveal/render/export/save at 360px. */
const fs=require('node:fs'),assert=require('node:assert/strict'),save=require('./save-artifact.cjs');
(async()=>{const browser=await require('./browser.cjs')();try{
 const page=await browser.newPage({viewport:{width:360,height:900},reducedMotion:'reduce'}),errors=[],checks=[],cases=JSON.parse(fs.readFileSync('tests/verification-dev.json','utf8')).cases;
 page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());await page.goto(browser.appURL,{waitUntil:'domcontentloaded'});
 for(const id of ['d03','d07','d08']){
  await page.locator('#question').fill(cases.find(item=>item.id===id).question);await page.evaluate(()=>document.querySelector('[data-spread="five"]').click());await page.locator('#startReading').click();await page.locator('.fan-card').first().waitFor();
  for(let i=0;i<5;i++){await page.locator('.fan-card').first().focus();await page.keyboard.press('Enter');}
  await page.locator('#revealAll').waitFor({state:'visible'});await page.locator('#revealAll').click();await page.locator('#report.visible').waitFor();await page.waitForFunction(()=>!!document.getElementById('arc79-indicator'));
  const visible=await page.locator('#humanDirect').innerText();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>readingText().includes(document.getElementById('humanDirect').textContent)));
  if(id==='d03'){assert(visible.includes('확인한 ‘날짜’'));assert(visible.includes('아직 확인하지 못한 ‘장소’'));assert(visible.includes('시간 ‘25분’ 안'));assert(!visible.includes('시간 ‘2시간’ 안'));checks.push('bound date/place states and own 25-minute preparation budget in visible text and export');}
  if(id==='d07'){assert(visible.includes('‘장소’의 확인 여부가 서로 다르게'));assert(!visible.includes('확인한 ‘장소’'));checks.push('contradictory current place state asks for clarification');}
  if(id==='d08'){
   assert(await page.evaluate(()=>JSON.stringify(arcanaV5Build().arc82.answers.map(item=>item.request.goal))===JSON.stringify(['improve','communicate'])));assert.equal(visible.split('확인한 ‘날짜’').length-1,1);assert(!visible.includes('내 선택을 설명'));checks.push('editing and explanation both retained with shared document object and facts applied once');
   await page.locator('#saveReading').click();assert(await page.evaluate(()=>{const saved=storedRecords()[0],report=arcanaV5Build();return saved.engineVersion===ARCANA_WEB_BUILD.readingEngine&&withSavedReading(saved,()=>arcanaV5Build()).direct===report.direct;}));checks.push('saved reading reproduces the same complete direct answer and current engine version');
  }
 }
 assert.deepEqual(errors,[]);fs.mkdirSync('test-results/verification',{recursive:true});await page.locator('#report .human-reading').screenshot({path:'test-results/verification/compound-mobile.png'});
 const result={release:JSON.parse(fs.readFileSync('release.json','utf8')),checks,errors,browser:await browser.version(),note:'Actual UI, export and save checks in a 360px Chromium profile using development inputs. Not physical phone/Safari evidence or an interpretation quality score.'};save('test-results/verification/ui-summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
