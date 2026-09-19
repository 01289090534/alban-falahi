const CACHE='alban-pwa-v3';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('push',e=>{
  let d={};try{d=e.data?.json()||{}}catch{try{d={body:e.data?.text()||''}}catch{}}
  const title=d.title||'ألبان فلاحي';
  const options={body:d.body||'لديك إشعار جديد ❤️',icon:d.icon||'/favicon.svg',badge:d.badge||'/favicon.svg',tag:d.tag||'alban-notification',data:{url:d.url||'/orders.html'}};
  e.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=e.notification?.data?.url||'/orders.html';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET')return;if(e.request.destination==='document')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone())).catch(()=>{});return r}).catch(()=>caches.match(e.request)))});
