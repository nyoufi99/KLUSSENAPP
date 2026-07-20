/* Klusmelding — service worker
   Minimale, veilige cache: alleen de app-shell (dit HTML-bestand) wordt
   offline beschikbaar gemaakt. Dit is voldoende om aan Chrome's
   installatie-eisen te voldoen (geregistreerde SW met fetch-handler),
   zonder dat het risico loopt om oude data te tonen — de data zelf komt
   nooit via de service worker, alleen via localStorage/Supabase.
*/
const CACHE_NAME = 'klusmelding-shell-v1';
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first met cache-fallback: gebruiker ziet altijd de nieuwste versie
// zolang er internet is, en de laatst bekende versie zodra dat niet zo is.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
