// ============================================================
// Service Worker — Scenews Culture Sénégal
// Version du cache et stratégies de mise en cache
// ============================================================

const CACHE_NAME = 'culte-v3';

// Ressources de l'app shell à pré-cacher lors de l'installation
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/seed.js',
  '/js/search-engine.js',
  '/js/voice-search.js',
  '/js/search-dialog.js',
  '/js/conversation-memory.js',
  '/js/geolocation-search.js',
  '/js/nlg-response.js',
  '/js/auto-suggest.js',
  '/js/voice-conversation.js',
  '/js/events-calendar.js',
  '/js/chatbot.js',
  '/js/social.js',
  '/js/recommendations.js',
  '/js/multilang.js',
  '/js/analytics.js',
  '/js/app.js',
  '/css/events.css',
  '/css/chatbot.css'
];

// Données JSON à pré-cacher
const DATA_FILES = [
  '/infrastructures_culturelles.json',
  '/centre_formation_arts.json'
];

// Toutes les ressources à pré-cacher
const PRE_CACHE = [...APP_SHELL, ...DATA_FILES];

// Page hors-ligne affichée quand rien n'est disponible
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hors connexion — Scenews</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1a2e; color: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 2rem;
    }
    .container { max-width: 420px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: .75rem; color: #0078c8; }
    p { line-height: 1.6; opacity: .85; margin-bottom: 1.5rem; }
    button {
      background: #0078c8; color: #fff; border: none;
      padding: .75rem 2rem; border-radius: 8px; font-size: 1rem;
      cursor: pointer; transition: opacity .2s;
    }
    button:hover { opacity: .85; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Vous êtes hors connexion</h1>
    <p>Impossible de charger cette page pour le moment.
       Vérifiez votre connexion internet puis réessayez.</p>
    <button onclick="location.reload()">Réessayer</button>
  </div>
</body>
</html>`;

// ============================================================
// INSTALLATION — Pré-cache de l'app shell et des données
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installation — mise en cache de l\'app shell');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // On utilise addAll pour cacher toutes les ressources d'un coup.
        // Si une ressource échoue, l'installation échoue aussi,
        // garantissant un cache complet.
        return cache.addAll(PRE_CACHE);
      })
      .then(() => {
        console.log('[SW] App shell et données pré-cachées avec succès');
      })
  );
});

// ============================================================
// ACTIVATION — Nettoyage des anciens caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation — nettoyage des anciens caches');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Suppression de l'ancien cache : ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Prendre le contrôle immédiatement de toutes les pages ouvertes
      return self.clients.claim();
    })
  );
});

// ============================================================
// INTERCEPTION DES REQUÊTES (FETCH)
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // On ne gère que les requêtes HTTP(S) du même origine
  // Les requêtes vers des API externes passent en network-only
  if (url.origin !== self.location.origin) {
    // Stratégie : Network-only pour les API externes
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Hors connexion' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Déterminer la stratégie selon le type de ressource
  if (request.mode === 'navigate' || request.destination === 'document') {
    // Stratégie : Network-first pour le HTML (pour recevoir les mises à jour)
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Stratégie : Cache-first pour les assets statiques (JS, CSS, JSON, images)
    event.respondWith(cacheFirstStrategy(request));
  }
});

// ============================================================
// STRATÉGIE CACHE-FIRST
// Cherche d'abord dans le cache, puis le réseau en fallback.
// Met en cache la réponse réseau pour les prochaines fois.
// ============================================================
async function cacheFirstStrategy(request) {
  try {
    // 1. Chercher dans le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 2. Pas en cache → aller sur le réseau
    const networkResponse = await fetch(request);

    // 3. Mettre en cache la nouvelle réponse (si valide)
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 4. Ni cache ni réseau → réponse d'erreur
    console.warn('[SW] Cache-first échoué pour :', request.url);
    return new Response('Ressource indisponible hors connexion', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ============================================================
// STRATÉGIE NETWORK-FIRST
// Tente le réseau en priorité, puis le cache en fallback.
// Met à jour le cache avec la dernière version réseau.
// ============================================================
async function networkFirstStrategy(request) {
  try {
    // 1. Tenter le réseau en premier
    const networkResponse = await fetch(request);

    // 2. Mettre à jour le cache avec la version fraîche
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 3. Réseau indisponible → chercher dans le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Réseau indisponible, réponse depuis le cache :', request.url);
      return cachedResponse;
    }

    // 4. Ni réseau ni cache → page hors-ligne
    console.warn('[SW] Hors connexion, affichage de la page offline');
    return new Response(OFFLINE_PAGE, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// ============================================================
// MESSAGES — Écoute des messages depuis l'application
// ============================================================
self.addEventListener('message', (event) => {
  // Permet de forcer la mise à jour immédiate du service worker
  // sans attendre la fermeture de tous les onglets
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING reçu — activation immédiate');
    self.skipWaiting();
  }
});
