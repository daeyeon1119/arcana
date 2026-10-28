/* Same bundled reading engine on every device. Optional web caching has no AI server. */
const ARCANA_WEB_BUILD=Object.freeze({appVersion:'__ARCANA_APP_VERSION__',readingEngine:__ARCANA_READING_ENGINE__});
(function(){
 'use strict';
 const panel=document.createElement('section');panel.className='arc-web';panel.id='arcanaWebApp';panel.setAttribute('aria-label','기기에서 앱 사용');
 panel.innerHTML='<h2>다른 기기에서도 사용하기</h2><p><a class="arc-web-link" href="https://daeyeon1119.github.io/arcana/" target="_blank" rel="noopener noreferrer">ARCANA 공개 앱 열기</a>에서 스마트폰과 PC로 같은 앱을 사용할 수 있습니다.</p><p>같은 질문·카드·방향·배열·설정에서는 같은 해석을 제공합니다. 추첨할 때 고르는 카드는 매번 달라질 수 있습니다.</p><p id="arcanaWebStatus" class="arc-web-status" role="status">오프라인 사용 가능 여부를 확인하고 있습니다.</p><small>원본 카드 78장을 포함해 약 31MB를 이 기기에 저장합니다. 기록은 기기별로 보관되며, 나의 기록의 백업·복원으로 옮길 수 있습니다.</small><div class="arc-web-actions"><button type="button" id="arcanaWebRetry" hidden>오프라인 저장 다시 시도</button><button type="button" id="arcanaWebUpdate" hidden>새 버전으로 업데이트</button><button type="button" id="arcanaWebInstall" hidden>이 기기에 앱 추가</button></div><small id="arcanaWebVersion"></small>';
 document.querySelector('#about .about-content').prepend(panel);
 document.getElementById('arcanaWebVersion').textContent='앱 '+ARCANA_WEB_BUILD.appVersion+' · 해석 엔진 v'+ARCANA_WEB_BUILD.readingEngine;
 const status=document.getElementById('arcanaWebStatus'),retry=document.getElementById('arcanaWebRetry'),update=document.getElementById('arcanaWebUpdate'),install=document.getElementById('arcanaWebInstall');
 let registration,installPrompt,updating=false,ready=false;
 function ask(worker,type,timeout=5000){return new Promise((resolve,reject)=>{
  const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('Worker timeout'));},timeout);
  channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
  worker.postMessage({type},[channel.port2]);
 });}
 function show(message,state){status.textContent=message;panel.dataset.state=state;}
 function waiting(){if(registration?.waiting){update.hidden=false;show('새 버전이 준비됐습니다. 현재 리딩을 저장한 뒤 업데이트할 수 있습니다.','update');}}
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{
  if(worker.state==='installed'){if(registration.active&&registration.waiting)waiting();else{ready=true;retry.hidden=true;show('오프라인 준비 완료 · 인터넷이 끊겨도 이 주소에서 다시 열 수 있습니다.','ready');}}
  if(worker.state==='activated'){ready=true;retry.hidden=true;update.hidden=true;show('오프라인 준비 완료 · 인터넷이 끊겨도 이 주소에서 다시 열 수 있습니다.','ready');}
  if(worker.state==='redundant'&&!ready){retry.hidden=false;show('오프라인 저장을 완료하지 못했습니다. 저장 공간과 연결을 확인해 주세요. 인터넷에 연결하면 앱을 사용할 수 있습니다.','unavailable');}
 });}
 async function register(){
  retry.hidden=true;show('오프라인 사용을 위해 원본 카드와 앱을 저장하고 있습니다.','preparing');
  try{
   registration=await navigator.serviceWorker.register(new URL('./sw.js',location.href).href,{updateViaCache:'none'});
   registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);
   if(registration.active){
    let cached=await ask(registration.active,'ARCANA_CACHE_STATUS');
    if(!cached.ready)cached=await ask(registration.active,'ARCANA_PREPARE_OFFLINE',90000);
    ready=!!cached.ready;
    if(ready)show('오프라인 준비 완료 · 인터넷이 끊겨도 이 주소에서 다시 열 수 있습니다.','ready');
    else{retry.hidden=false;show('오프라인 저장을 완료하지 못했습니다. 저장 공간과 연결을 확인해 주세요. 인터넷에 연결하면 앱을 사용할 수 있습니다.','unavailable');}
   }
   waiting();
  }catch{retry.hidden=false;show('이 브라우저에서는 오프라인 저장을 완료하지 못했습니다. 인터넷에 연결하면 앱을 사용할 수 있습니다.','unavailable');}
 }
 retry.addEventListener('click',register);
 update.addEventListener('click',()=>{
  if(!registration?.waiting)return;
  if(typeof drawn!=='undefined'&&drawn.length&&!confirm('업데이트하면 현재 화면이 초기화됩니다. 필요한 리딩은 나의 기록에 저장해 주세요. 지금 업데이트할까요?'))return;
  updating=true;update.disabled=true;registration.waiting.postMessage({type:'ARCANA_APPLY_UPDATE'});
 });
 if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating)location.reload();});
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;install.hidden=false;});
 install.addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;install.hidden=true;await prompt.prompt();});
 window.addEventListener('appinstalled',()=>{install.hidden=true;});
 if(location.protocol==='file:'){show('파일 모드 · 이 HTML에 원본 카드와 해석 기능이 모두 들어 있어 인터넷 없이 사용할 수 있습니다.','file');}
 else if(!window.isSecureContext||!('serviceWorker'in navigator)){show('이 브라우저에서는 오프라인 저장을 지원하지 않습니다. 인터넷에 연결하면 앱을 사용할 수 있습니다.','unsupported');}
 else register();
})();
// Final build metadata owns the saved version after historical save listeners.
$('saveReading').addEventListener('click',()=>{if(!readingSaved||!currentHistoryId)return;const records=storedRecords(),record=records.find(item=>item.id===currentHistoryId);if(record){record.engineVersion=ARCANA_WEB_BUILD.readingEngine;setStoredRecords(records);}});
