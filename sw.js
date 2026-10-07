// OrçaPro — service worker: guarda o app no aparelho para abrir rápido e funcionar sem internet.
// A versão é preenchida pelo build. Quando o GitHub recebe um index.html novo, este arquivo muda,
// o navegador instala a versão nova "em espera" e o app mostra o aviso "Nova versão disponível".
const CACHE = 'orcapro-v6';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate';
  if (isPage) {
    // Página: sempre a versão deste cache (a atualização chega pelo aviso, não no meio do uso).
    e.respondWith(caches.match('./index.html').then(hit => hit || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    if (hit) return hit;
    return fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque') && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    });
  }));
});
