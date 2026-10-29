/* Opt-in check of the deployed diagnostic page. Browser emulation, not phone evidence. */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),save=require('./save-artifact.cjs');
const base='https://daeyeon1119.github.io/arcana/',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const release=require('../release.json'),reference=require('../test-results/portable-summary.json'),assets={};
 for(const name of ['release.json','device-check.html','scripts/device-check.js']){
  const response=await fetch(base+name,{cache:'no-store'});assert(response.ok,name);const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(hash(bytes),hash(fs.readFileSync(name)),name+' public bytes');assets[name]=hash(bytes);
 }
 const browser=await require('./browser.cjs')();try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'ko-KR',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  await page.goto(base+'device-check.html',{waitUntil:'domcontentloaded',timeout:90000});await page.locator('#run').click();
  await page.waitForFunction(()=>!document.getElementById('result').hidden,{},{timeout:180000});const result=JSON.parse(await page.locator('#output').inputValue());
  assert(result.passed,result.error);assert.equal(result.readings,reference.questionCardCombinationsPerProfile);assert.equal(result.readingParitySHA256,reference.readingParitySHA256);assert.equal(result.originalCardsDecoded,78);assert.equal(result.physicalDeviceConfirmedByUser,false);
  assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'.cache/public-device-check.png',fullPage:true});
  const proof={url:base+'device-check.html',release,publicAssetSHA256:assets,result,errors,browser:await browser.version(),note:'Actual public HTTPS checker execution in Chromium mobile emulation. Not a physical Android phone or manual touch/install/offline test. No expert quality score.'};
  save('.cache/public-device-check.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
