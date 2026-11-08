importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyDGl7YAsigHECh3C_C6o98NEgTa-WsRYGM",
    authDomain: "posm-sale.firebaseapp.com",
    databaseURL: "https://posm-sale-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "posm-sale",
    storageBucket: "posm-sale.firebasestorage.app",
    messagingSenderId: "894727038124",
    appId: "1:894727038124:web:7504cfac4b3c7663d46b09"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Wymuszenie natychmiastowej aktywacji nowej wersji Service Workera
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Obsługa powiadomień, gdy aplikacja jest w tle lub całkowicie zamknięta
messaging.onBackgroundMessage((payload) => {
    const notif = payload.notification || payload.data || {};
    const notificationTitle = notif.title || 'Samorząd Solnej';
    const notificationOptions = {
        body: notif.body || '',
        icon: notif.icon || '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [200, 100, 200],
        tag: notif.tag || 'posm-notify',
        renotify: true,
        data: {
            url: (payload.fcmOptions && payload.fcmOptions.link) || (payload.data && payload.data.url) || '/'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Po kliknięciu w powiadomienie: przejdź do otwartej aplikacji lub otwórz nowe okno
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});