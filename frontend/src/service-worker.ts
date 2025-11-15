/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;
type ServiceWorkerGlobal = ServiceWorkerGlobalScope & typeof globalThis;
const sw = (self as unknown) as ServiceWorkerGlobal;

// Precache de assets estáticos
precacheAndRoute(self.__WB_MANIFEST);

// Cache de API com NetworkFirst strategy
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutos
            }),
        ],
    })
);

// Cache de imagens com CacheFirst strategy
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
            }),
        ],
    })
);

// Cache de arquivos estáticos com StaleWhileRevalidate
registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

// Offline fallback
const OFFLINE_URL = '/offline.html';

sw.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open('offline').then((cache) => cache.add(new Request(OFFLINE_URL)))
    );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match(OFFLINE_URL).then((response) => response ?? Response.error())
            )
        );
    }
});

// Notificações push (preparado para futuras implementações)
sw.addEventListener('push', (event: PushEvent) => {
    const options = {
        body: event.data?.text() || 'Nova atualização disponível',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
        },
    };

    event.waitUntil(
        self.registration.showNotification('Precificador de Receitas', options)
    );
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow('/')
    );
});

export { };
