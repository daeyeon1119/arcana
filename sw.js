/* Generated with the app hash. Cache only this app's public shell, never questions or records. */
'use strict';
const APP_HASH='734c5b56f427b9152b7a31180debf25e541bf23555eeeb23f49b4192189e5f9f';
const PREFIX='arcana-web:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+'b554a08eb980de4bac436228';
const url=path=>new URL(path,self.registration.scope).href;
const STATIC=['manifest.webmanifest','assets/app/icon-192.png','assets/app/icon-512.png','assets/app/apple-touch-icon.png','assets/app/icon.svg'];
async function prepare(){
 const response=await fetch(url('index.html'),{cache:'reload'});
 if(!response.ok)throw Error('App download failed');
 const bytes=await response.clone().arrayBuffer();
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(sha!==APP_HASH)throw Error('App and worker are from different releases');
 const cache=await caches.open(CACHE);
 try{await cache.put(url('index.html'),response);await cache.addAll(STATIC.map(url));}
 catch(error){await caches.delete(CACHE);throw error;}
}
self.addEventListener('install',event=>event.waitUntil(prepare()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ARCANA_APPLY_UPDATE')self.skipWaiting();
 if(event.data?.type==='ARCANA_CACHE_STATUS'||event.data?.type==='ARCANA_PREPARE_OFFLINE')event.waitUntil((async()=>{
  try{
   if(event.data.type==='ARCANA_PREPARE_OFFLINE')await prepare();
   const cache=await caches.open(CACHE),complete=await Promise.all(['index.html',...STATIC].map(path=>cache.match(url(path))));
   event.ports[0]?.postMessage({ready:complete.every(Boolean),appHash:APP_HASH});
  }catch{event.ports[0]?.postMessage({ready:false});}
 })());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const requestURL=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(requestURL.origin!==scope.origin)return;
 const shell=requestURL.pathname===scope.pathname||requestURL.pathname===scope.pathname+'index.html';
 const resource=STATIC.find(path=>requestURL.href===url(path));
 if(!shell&&!resource)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(shell?url('index.html'):url(resource))||fetch(event.request);})());
});
