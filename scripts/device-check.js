/* Standalone, opt-in, actual-browser parity check. No reading-history access. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),status=text=>{$('status').textContent=text;},hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
 const fetchText=async path=>{const response=await fetch(new URL(path,location.href),{cache:'no-store'});if(!response.ok)throw Error('검사 파일을 가져오지 못했습니다: '+path);return response.text();};
 const fetchJSON=async path=>JSON.parse(await fetchText(path));
 let frame=null;
 $('run').addEventListener('click',async()=>{
  $('run').disabled=true;$('result').hidden=true;frame?.remove();let result={kind:'arcana-actual-browser-check',userAgent:navigator.userAgent,language:navigator.language,screen:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},physicalDeviceConfirmedByUser:false,professionalQualityScore:null};
  try{
   status('배포 버전과 비교 자료를 확인하고 있습니다.');
   const [release,reference,fixture,source]=await Promise.all([fetchJSON('./release.json'),fetchJSON('./test-results/portable-summary.json'),fetchJSON('./tests/portable-cases.json'),fetchText('./scripts/portable-probe.cjs')]);result.release=release;
   if(JSON.stringify(reference.release)!==JSON.stringify(release))throw Error('비교 자료와 배포 버전이 다릅니다. 배포가 끝난 뒤 다시 검사해 주세요.');
   const encoder=new TextEncoder();if(await hash(encoder.encode(JSON.stringify(fixture)))!==reference.fixtureSHA256||await hash(encoder.encode(source.replace(/\r\n/g,'\n')))!==reference.probeSHA256)throw Error('검사 입력 또는 실행 함수가 배포 전 자료와 다릅니다.');
   // Only the committed, hash-checked, dependency-free shared collector runs.
   const shared=new Function('exports',source+'\nreturn exports;')({}),inputs=shared.inputs(fixture);
   status('원본 카드를 포함한 앱을 불러오고 있습니다. 처음에는 약 31MB를 내려받습니다.');frame=document.createElement('iframe');frame.title='기기 확인용 ARCANA';frame.src=new URL('./index.html?device-check=1',location.href).href;document.body.append(frame);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('앱을 불러오는 데 시간이 오래 걸립니다. 연결과 저장 공간을 확인한 뒤 다시 검사해 주세요.')),120000);frame.onload=()=>{clearTimeout(timer);resolve();};frame.onerror=()=>{clearTimeout(timer);reject(Error('앱을 불러오지 못했습니다.'));};});
   const app=frame.contentWindow,build=app.eval('ARCANA_WEB_BUILD');if(build.appVersion!==release.appVersion||build.readingEngine!==release.readingEngine)throw Error('저장된 앱 버전이 다릅니다. 일반 앱에서 새 버전을 적용한 뒤 다시 검사해 주세요.');
   const response=await fetch(new URL('./index.html',location.href),{cache:'no-store'});if(!response.ok)throw Error('앱 파일을 확인하지 못했습니다.');result.appSHA256=await hash(await response.arrayBuffer());if(result.appSHA256!==release.appSHA256)throw Error('앱 파일이 검증한 배포 파일과 다릅니다.');
   status('질문·카드·설정 조합의 전체 답변을 비교하고 있습니다.');await new Promise(resolve=>setTimeout(resolve,0));
   const reports=app.eval('('+shared.probe.toString()+')('+JSON.stringify(inputs)+')');result.readings=reports.length;result.readingParitySHA256=await hash(encoder.encode(JSON.stringify(reports)));if(result.readings!==reference.questionCardCombinationsPerProfile||result.readingParitySHA256!==reference.readingParitySHA256)throw Error('이 기기의 해석 결과가 배포 전 결과와 다릅니다. 결과를 복사해 알려 주세요.');
   const cards=app.eval('CARDS.map(card=>({id:card.id,img:card.img}))');if(cards.length!==78)throw Error('원본 카드 수가 다릅니다.');result.originalCardsDecoded=0;
   for(const card of cards){if(!card.img.startsWith('data:image/jpeg;base64,'))throw Error('내장 원본 JPEG가 아닙니다: '+card.id);const picture=new app.Image();picture.src=card.img;await picture.decode();if(!picture.naturalWidth||!picture.naturalHeight)throw Error('원본 카드를 열지 못했습니다: '+card.id);result.originalCardsDecoded++;picture.src='';status('전체 답변 일치 · 원본 카드 확인 '+result.originalCardsDecoded+' / 78');}
   result.passed=true;result.scope='Actual browser execution only. Physical device, manual touch, saving, installation and offline use require separate user confirmation.';status('전체 답변 '+result.readings+'개가 같고, 원본 카드 78장이 열렸습니다. 아래 결과를 복사해 전달해 주세요.');
  }catch(error){result.passed=false;result.error=error.message;status('검사를 완료하지 못했습니다.\n'+error.message);}
  finally{$('output').value=JSON.stringify(result,null,2);$('result').hidden=false;$('run').disabled=false;frame?.remove();frame=null;}
 });
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('output').value);$('copy').textContent='복사했습니다';}catch{$('output').focus();$('output').select();status('자동 복사가 지원되지 않습니다. 선택한 결과를 직접 복사해 주세요.');}});
})();
