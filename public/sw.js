const CACHE='smart-adhkar-v16-trusted';
const ASSETS=['/','/styles.css','/v11.css','/v23.css','/app.js','/v23.js','/adhkar-1.json','/adhkar-2.json','/adhkar-3.json','/adhkar-4.json','/manifest.webmanifest','/icon.svg','/privacy.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==location.origin)return;if(url.pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(c=>c||caches.match('/'))))});
