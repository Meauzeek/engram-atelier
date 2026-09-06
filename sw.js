/* Content-addressed offline cache. Change code, then run tools/update_sw.py. */
const BUILD="5.0-07675e586af4";
const PREFIX='engram-shell:'+self.registration.scope+':';
const CACHE=PREFIX+BUILD,FONTS=PREFIX+'font-cache';
const ASSETS=["./", "./index.html", "./styles.css", "./core.js", "./view.js", "./app.js", "./fonts.js", "./seeds.js", "./examples.js", "./brand.js", "./exports.js", "./storage.js", "./pwa.js", "./vendor/jszip.min.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/maskable-512.png"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(ASSETS.map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE&&k!==FONTS).map(k=>caches.delete(k)));await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url),base=new URL(self.registration.scope);
 if(['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(url.origin)){
  event.respondWith((async()=>{const c=await caches.open(FONTS),stored=await c.match(req);if(stored)return stored;const res=await fetch(req);if(res.ok&&res.type!=='opaque')await c.put(req,res.clone());return res;})());return;
 }
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 const allowed=ASSETS.some(x=>new URL(x,base).pathname===url.pathname);
 if(req.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===new URL('./index.html',base).pathname)){
  event.respondWith((async()=>{const c=await caches.open(CACHE);return await c.match(new URL('./index.html',base))||fetch(req);})());return;
 }
 if(allowed)event.respondWith((async()=>{const c=await caches.open(CACHE);return await c.match(req,{ignoreSearch:true})||fetch(req);})());
});
