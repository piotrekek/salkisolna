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

// Inicjalizacja środowiska i to wszystko!
// Firebase sam wyświetli powiadomienie z ikoną i przekieruje użytkownika.
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();