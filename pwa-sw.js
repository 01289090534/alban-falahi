const CACHE='alban-pwa-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&e.request.destination!=='document')caches.open(CACHE).then(c=>c.put(e.request,r.clone())).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))))});
