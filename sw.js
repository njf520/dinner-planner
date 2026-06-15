// Belly Up — service worker for offline support.
//
// Bump CACHE_NAME (alongside VERSION in index.html) on every deploy so old
// caches get cleaned up and clients pick up fresh assets.
const CACHE_NAME='belly-up-v3.4';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);

  // Only handle same-origin GET requests — leave the Anthropic API, GitHub
  // API, raw.githubusercontent.com, CORS proxies, and the Cloudflare Worker
  // proxy completely alone (cross-origin, and must never be served stale).
  if(req.method!=='GET'||url.origin!==self.location.origin) return;

  // Network-first for navigations and index.html itself, so the in-app
  // auto-update banner (checkForUpdate) keeps seeing the live page and a
  // fresh copy is cached for offline use. Fall back to cache if offline.
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(res=>res||caches.match('./index.html')))
    );
    return;
  }

  // Cache-first, falling back to network (and caching the result), for other
  // same-origin static assets (manifest, icons, sw.js itself).
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        return res;
      });
    })
  );
});
