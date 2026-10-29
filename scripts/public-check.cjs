/* Opt-in real HTTPS deployment check; never part of the offline default test suite. */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),url='https://daeyeon1119.github.io/arcana/';
const expected=JSON.parse(fs.readFileSync('release.json','utf8')),local=JSON.parse(fs.readFileSync('test-results/portable-summary.json','utf8'));
const fixture=JSON.parse(fs.readFileSync('tests/portable-cases.json','utf8')),shared=require('./portable-probe.cjs'),inputs=shared.inputs(fixture);
assert.deepEqual(local.release,expected,'Run the local portable checks for this release first');
assert.equal(local.fixtureSHA256,hash(JSON.stringify(fixture)),'Local and public inputs/settings must match');
assert.equal(local.probeSHA256,hash(fs.readFileSync('scripts/portable-probe.cjs','utf8').replace(/\r\n/g,'\n')),'Local and public collectors must match');
(async()=>{
 const response=await fetch(url+'release.json',{cache:'no-store'});assert(response.ok,'Public release metadata unavailable');const release=await response.json();assert.deepEqual(release,expected,'Public deployment is not the tested release yet');
 const browser=await require('./browser.cjs')(),checks=[],errors=[],origins=new Set();
 try{
 for(const options of [{name:'desktop',viewport:{width:1440,height:1000}},{name:'mobile-emulation',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}]){
  const {name,...profile}=options,context=await browser.newContext({...profile,locale:'ko-KR',reducedMotion:'reduce'});
  try{
   context.on('request',request=>{if(/^https?:/.test(request.url()))origins.add(new URL(request.url()).origin);});
   await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(url).origin?route.continue():route.abort());
   let page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   const navigation=await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});assert(navigation.ok());
   await page.waitForFunction(()=>document.getElementById('arcanaWebApp')?.dataset.state==='ready',{},{timeout:120000});
   await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
   // Large navigation bodies can be evicted from DevTools' inspector cache. Verify
   // the bytes actually saved by the service worker, independent of that buffer.
   const savedHashes=await page.evaluate(async()=>{const hashes=[],app=new URL('index.html',location.href).href;for(const name of await caches.keys()){if(!name.startsWith('arcana-web:'))continue;const response=await (await caches.open(name)).match(app);if(response)hashes.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join(''));}return hashes;});
   assert.deepEqual(savedHashes,[release.appSHA256]);checks.push(name+': public HTTPS app bytes in offline cache match tested local build');
   await context.setOffline(true);await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(url+'?launch=offline',{waitUntil:'domcontentloaded',timeout:90000});
   const actual=await page.evaluate(shared.probe,inputs);
   assert.equal(actual.length,local.questionCardCombinationsPerProfile);assert.equal(hash(JSON.stringify(actual)),local.readingParitySHA256);checks.push(name+': '+actual.length+' public/offline question/card/settings readings match local outputs exactly');
   assert.equal(await page.evaluate(async()=>{await Promise.all(CARDS.map(card=>{const image=new Image();image.src=card.img;return image.decode();}));return CARDS.length;}),78);checks.push(name+': 78 originals decode after public site is reopened offline');
   await page.locator('.nav-item[data-view="about"]').click();await page.locator('#arcanaWebApp').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.cache/public-'+name+'.png'});
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);assert([...origins].every(origin=>[new URL(url).origin,'https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(origin)));checks.push('public application makes no request to this PC or a model endpoint');
 const result={url,release,checks,errors,requestedOrigins:[...origins],browser:await browser.version(),note:'Actual public HTTPS download and offline browser runs. Mobile is a Chromium profile, not a physical phone/Safari test. Fonts were blocked; no claim of professional reading quality.'};
 fs.writeFileSync('.cache/public-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
