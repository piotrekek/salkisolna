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
const db = firebase.database();

let messaging = null;
try {
    if (firebase.messaging && firebase.messaging.isSupported()) {
        messaging = firebase.messaging();
        messaging.onMessage((payload) => {
            if (payload.notification) {
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                pokazAlert(`🔔 ${payload.notification.title}`, payload.notification.body);
            }
        });
    }
} catch (e) {
    console.warn("Przeglądarka nie wspiera FCM: ", e);
}

const VAPID_KEY = "BG9oLto0h4gqnq4lSb1Ul13mgf1EqodsIpMJYxkLCmlx77d6rTRWmBiO2RQPND7CosS_APXuG5cFiq2J03hQ994";

const saleIIst = ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','122','128','129','130','131','132','140','141','142','143','144','145','146','147'];
const saleIst = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','22','40','41','42','43','44','45','46','47','48','49','52','57B'];
const saleJazz = ['01','02','03','04','06','07','08'];
const saleInne = ['Koncertowa','Kameralna','Lustrzana','Kryształowa'];
const wszystkieSale = saleIIst.concat(saleIst, saleJazz, saleInne);
const saleFortepian = ['Koncertowa', 'Lustrzana', 'Kameralna', 'Kryształowa', '16', '18', '113', '114', '116', '117', '118', '128', '129', '130', '131', '120', '01', '02', '20', '57B']; 

const UKLAD_TABLICY = [
    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120'],
    ['122', '128', '129', '130', '131', '132', '140', '141', '142', '143', '144', '145', '146', '147', null, 'Koncertowa', 'Kameralna', 'Lustrzana', 'Kryształowa', null],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    ['22', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '52', '57B', null, null, null, null, null, null, null],
    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, '08', '07', '06', '04', '03', '02', '01']
];

const DOSTEPNE_IKONY_ODZNAK = ['🎃', '👻', '🏆', '👑', '💎', '⚡', '🌟', '🔥', '🎵', '🎼', '🎹', '🎻', '🎷', '🎺', '🎸', '🎯', '🚀', '🏅'];
let wybranaIkonaOdznakiPiotr = '🎃';

let aktualneStatusy = {}, pelneDaneSal = {};
let aktywnyFiltr = 'wszystkie', obecnaWizualizacja = 'klasyczna';
let zalogowanyUid = null, zalogowanyUczen = null, wybranaSalaModal = null;
let ulubioneSale = [], wszystkieAnkiety = {}, wszystkiePropozycje = {}, wszystkieZgody = {};
let ustawieniaPush = { ulubione: false, ankiety: false, propozycje: false };
let pelnaBazaUczniow = {}; 
let otwarteKomentarze = new Set(); 
let mojeZnajomosci = { akceptowani: {}, zaproszenia: {}, zaproszenia_wyslane: {} };
let sortowanieZnajomych = 'streak';
let wybranyAvatarTymczasowy = null;
let domyslnyConfirmCallback = null;
let minutyTygodnioweMapa = {};
let zamrozoneDniSzkoly = {};

let cropState = {
    img: null,
    baseScale: 1,
    zoom: 1,
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    initialized: false
};

const tabOrderUcznia = ['start', 'znajomi', 'salki', 'glosowania', 'propozycje', 'panel-samorzadu'];
let aktywnaZakladkaId = 'start';
let isTabAnimating = false;
let czyStreakBylAnimowany = false;

let wrappedKartyHtml = [];
let aktywnaKartaWrapped = 0;
let wrappedTimer = null;
let wStats = {};

const DUO_OPCJE_MOTYWACJI = [
    { id: 'plomyk', ikona: '🔥', tytul: 'Przypomnienie o serii' },
    { id: 'salki', ikona: '🎹', tytul: 'Wolne sale czekają' },
    { id: 'czas', ikona: '⏳', tytul: 'Czas na rozgrzewkę' }
];

const DUO_OPCJE_BRAWA = [
    { id: 'brawa', ikona: '👏', tytul: 'Dobra robota' },
    { id: 'seria', ikona: '🔥', tytul: 'Mocna seria' },
    { id: 'hejo', ikona: '👋', tytul: 'Powodzenia w ćwiczeniu' }
];

let duoCelUid = null;
let duoCelImie = '';
let duoWybranaOpcja = null;
let duoTryb = 'motywacja';
let ostatniNadawcaZaczepkiUid = null;
let ostatniNadawcaZaczepkiImie = '';
let trwaAnimacjaZaczepki = false;

window.pokazAlert = function(tytul, tresc) {
    document.getElementById('custom-alert-title').innerText = tytul;
    document.getElementById('custom-alert-text').innerText = tresc;
    pokazEkran('custom-alert-modal');
    setTimeout(() => {
        document.getElementById('custom-alert-box').classList.remove('scale-95');
        document.getElementById('custom-alert-box').classList.add('scale-100');
    }, 10);
};

window.zamknijAlert = function() {
    document.getElementById('custom-alert-box').classList.remove('scale-100');
    document.getElementById('custom-alert-box').classList.add('scale-95');
    setTimeout(() => { ukryjEkran('custom-alert-modal'); }, 200);
};

window.pokazConfirm = function(tytul, tresc, potwierdzCallback) {
    document.getElementById('custom-confirm-title').innerText = tytul;
    document.getElementById('custom-confirm-text').innerText = tresc;
    domyslnyConfirmCallback = potwierdzCallback;
    document.getElementById('custom-confirm-btn').onclick = () => {
        if(domyslnyConfirmCallback) domyslnyConfirmCallback();
        zamknijConfirm();
    };
    pokazEkran('custom-confirm-modal');
    setTimeout(() => {
        document.getElementById('custom-confirm-box').classList.remove('scale-95');
        document.getElementById('custom-confirm-box').classList.add('scale-100');
    }, 10);
};

window.zamknijConfirm = function() {
    document.getElementById('custom-confirm-box').classList.remove('scale-100');
    document.getElementById('custom-confirm-box').classList.add('scale-95');
    setTimeout(() => {
        ukryjEkran('custom-confirm-modal');
        domyslnyConfirmCallback = null;
    }, 200);
};

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function ukryjEkran(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.classList.add('hidden');
    }
}

function pokazEkran(id, type = 'flex') {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.style.setProperty('display', type, 'important');
    }
}

function usunPolskieZnaki(str) {
    const mapa = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    return str ? String(str).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => mapa[c] || c).toLowerCase().trim() : "";
}

function wygenerujLoginZImienia(imieNazwisko) {
    if (!imieNazwisko) return "uczen";
    const czesci = usunPolskieZnaki(imieNazwisko).replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    return czesci.length > 1 ? czesci[0].charAt(0) + '.' + czesci.slice(1).join('.') : (czesci[0] || "uczen");
}

function ucieczkaHtml(tekst) {
    return tekst ? String(tekst).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
}

function formatujDateYMD(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function terazDataString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function biezacyMiesiacString() { 
    const d = new Date(); 
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); 
}

// Funkcja obliczająca pominięte dni robocze z uwzględnieniem zamrożonych dni szkoły oraz prywatnych zamrożeń ucznia
function dniRoboczePomiedzy(d1, d2, uzytkownikData = null) {
    let dni = 0;
    let obecna = new Date(d1.getTime());
    obecna.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);
    const prywatneZamrozone = (uzytkownikData && uzytkownikData.zamrozone_dni) ? uzytkownikData.zamrozone_dni : {};

    while (obecna < d2) {
        obecna.setDate(obecna.getDate() + 1);
        const day = obecna.getDay();
        const ymd = formatujDateYMD(obecna);
        if (day !== 0 && day !== 6) {
            if (!zamrozoneDniSzkoly[ymd] && !prywatneZamrozone[ymd]) {
                dni++;
            }
        }
    }
    return dni;
}

function czyDzienJestZamrozonyDlaUcznia(ymd, uzytkownikData) {
    if (!ymd) return false;
    if (zamrozoneDniSzkoly && zamrozoneDniSzkoly[ymd]) return true;
    if (uzytkownikData && uzytkownikData.zamrozone_dni && uzytkownikData.zamrozone_dni[ymd]) return true;
    return false;
}

function parsowacCzas(czasStr) {
    if (!czasStr) return Date.now();
    const bezpiecznyFormat = String(czasStr).replace(' ', 'T');
    const zdekodowany = Date.parse(bezpiecznyFormat);
    return isNaN(zdekodowany) ? Date.now() : zdekodowany;
}

function easeInOutPow(p, moc) {
    return p < 0.5 ? Math.pow(2, moc - 1) * Math.pow(p, moc) : 1 - Math.pow(-2 * p + 2, moc) / 2;
}

function obliczPozostalyCzasZaczepki(uid) {
    const limitZaczepekMs = 2 * 60 * 60 * 1000;
    const ostatniaZaczepka = localStorage.getItem('poke_' + uid);
    if (!ostatniaZaczepka) return null;
    const roznica = Date.now() - parseInt(ostatniaZaczepka, 10);
    if (roznica >= limitZaczepekMs) return null;
    const zostaloMinut = Math.ceil((limitZaczepekMs - roznica) / 60000);
    const h = Math.floor(zostaloMinut / 60);
    const m = zostaloMinut % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Zawsze zwraca pełne imię i pierwszą literę nazwiska (np. "Aleksandra K.")
function sformatujImieINazwiskoKropka(imieNazwisko) {
    const czesci = (imieNazwisko || 'Uczeń').trim().split(/\s+/).filter(Boolean);
    const imie = czesci[0] || 'Uczeń';
    const nazwisko = czesci.length > 1 ? czesci[czesci.length - 1] : '';
    return nazwisko ? `${imie} ${nazwisko.charAt(0).toUpperCase()}.` : imie;
}

// --- LOGIKA POZIOMÓW PŁOMYKA (WZÓR DUOLINGO: 50, 100, 200, 300, 350-365) ---
function pobierzPoziomStreaka(dni, wymuszonyProg = null, czyZamrozony = false) {
    if (czyZamrozony) {
        return { klasa: 'streak-frozen', nazwa: 'Zamrożony', textClass: 'text-sky-300', outer: '#0ea5e9', core: '#e0f2fe' };
    }
    const n = (wymuszonyProg !== null && wymuszonyProg !== undefined) ? Number(wymuszonyProg) : (Number(dni) || 0);
    if (n >= 350) return { klasa: 'streak-tier-350', nazwa: 'Złoty', textClass: 'text-yellow-300', outer: '#eab308', core: '#fef08a' };
    if (n >= 300) return { klasa: 'streak-tier-300', nazwa: 'Szmaragdowy', textClass: 'text-emerald-300', outer: '#059669', core: '#6ee7b7' };
    if (n >= 200) return { klasa: 'streak-tier-200', nazwa: 'Błękitny', textClass: 'text-sky-300', outer: '#0284c7', core: '#7dd3fc' };
    if (n >= 100) return { klasa: 'streak-tier-100', nazwa: 'Fioletowy', textClass: 'text-purple-300', outer: '#9333ea', core: '#e9d5ff' };
    if (n >= 50) return { klasa: 'streak-tier-50', nazwa: 'Karmazynowy', textClass: 'text-rose-400', outer: '#e11d48', core: '#fda4af' };
    return { klasa: '', nazwa: 'Pomarańczowy', textClass: 'text-amber-400', outer: '#ff9600', core: '#ffc800' };
}

function generujMiniPlomykSvg(streakCount, isInactive, wymuszonyProg = null, czyZamrozony = false) {
    const maWymuszony = (wymuszonyProg !== null && wymuszonyProg !== undefined);
    const isAnim = !(!maWymuszony && !czyZamrozony && (isInactive || streakCount === 0));
    const info = pobierzPoziomStreaka(streakCount, wymuszonyProg, czyZamrozony);
    const outerCol = isAnim ? info.outer : '#52525b';
    const coreCol = isAnim ? info.core : '#71717a';
    const extraClass = czyZamrozony ? 'mini-flame-frozen' : '';

    return `<svg class="mini-flame-svg ${extraClass} ${isAnim ? '' : 'opacity-50'}" viewBox="0 0 100 120" fill="none">
        ${isAnim ? `<circle cx="48" cy="9" r="5" fill="${coreCol}"/><rect x="28" y="16" width="14" height="14" rx="3.5" transform="rotate(45 35 23)" fill="${coreCol}"/>` : ''}
        <path class="${isAnim && !czyZamrozony ? 'mini-outer' : ''}" d="M50 112 C29.5 112 17 98.5 17 78 L17 50 C17 42.5 25.5 39.5 30.8 45.2 L34.2 48.8 C34.8 49.4 35.8 49.2 36.3 48.4 L46 31.5 C49.8 25 58.2 25 62.5 31.5 C73.5 47.5 83 61.5 83 78 C83 98.5 70.5 112 50 112 Z" fill="${outerCol}"/>
        <path class="${isAnim && !czyZamrozony ? 'mini-core' : ''}" d="M50 97 C39.5 97 33 89.5 33 79.5 C33 72 39 64 46.8 56.5 C48.6 54.8 51.4 54.8 53.2 56.5 C61 64 67 72 67 79.5 C67 89.5 60.5 97 50 97 Z" fill="${coreCol}"/>
    </svg>`;
}

// --- MIESIĘCZNE DOŁADOWANIE ZAMROŻEŃ (+1 CO MIESIĄC, SUMUJĄ SIĘ) ---
function sprawdzMiesiecznyBonusZamrozenia(uid, daneUcznia) {
    if (!uid || !daneUcznia) return;
    const obecnyMies = biezacyMiesiacString();
    const ostMies = daneUcznia.ostatni_miesiac_zamrozenia || '';
    let obecnaLiczba = (daneUcznia.zamrozenia_liczba !== undefined && daneUcznia.zamrozenia_liczba !== null)
        ? Number(daneUcznia.zamrozenia_liczba)
        : 0;

    if (ostMies !== obecnyMies) {
        obecnaLiczba += 1;
        daneUcznia.zamrozenia_liczba = obecnaLiczba;
        daneUcznia.ostatni_miesiac_zamrozenia = obecnyMies;
        db.ref('uczniowie/' + uid).update({
            zamrozenia_liczba: obecnaLiczba,
            ostatni_miesiac_zamrozenia: obecnyMies
        }).catch(e => console.warn(e));
    }
}

// --- UŻYCIE ZAMROŻENIA PRZEZ UCZNIA ---
window.uzyjZamrozeniaStreaka = function() {
    if (!zalogowanyUid || !zalogowanyUczen) return;
    const dzisStr = formatujDateYMD(new Date());
    const cwiczylDzis = (zalogowanyUczen.ostatnia_aktywnosc === dzisStr);

    if (cwiczylDzis) {
        pokazAlert("Płomyk już płonie! 🔥", "Dzisiaj masz już zaliczone ćwiczenie — nie musisz zamrażać swojego płomyka!");
        return;
    }

    if (czyDzienJestZamrozonyDlaUcznia(dzisStr, zalogowanyUczen)) {
        pokazAlert("Dzień już zamrożony ❄️", "Dzisiejszy dzień jest już zamrożony! Twoja passa jest bezpieczna (a jeśli poćwiczysz, normalnie nabijesz kolejny dzień).");
        return;
    }

    const dostepne = Number(zalogowanyUczen.zamrozenia_liczba) || 0;
    if (dostepne <= 0) {
        pokazAlert("Brak zamrożeń ❄️", "Nie masz teraz dostępnych dni zamrożenia. Nowe zamrożenie (+1 ❄️) otrzymasz automatycznie na początku kolejnego miesiąca!");
        return;
    }

    pokazConfirm(
        "Zamrozić dzisiejszy dzień? ❄️",
        `Zużyjesz 1 zamrożenie (zostanie Ci: ${dostepne - 1} ❄️). Płomyczek zrobi się błękitny i trochę zmarznie, ale passa Ci nie przepadnie! Jeśli jednak dziś poćwiczysz, dzień normalnie doda się do serii.`,
        () => {
            const nowaLiczba = Math.max(0, dostepne - 1);
            if (!zalogowanyUczen.zamrozone_dni) zalogowanyUczen.zamrozone_dni = {};
            zalogowanyUczen.zamrozone_dni[dzisStr] = true;
            zalogowanyUczen.zamrozenia_liczba = nowaLiczba;

            const updates = {};
            updates[`uczniowie/${zalogowanyUid}/zamrozenia_liczba`] = nowaLiczba;
            updates[`uczniowie/${zalogowanyUid}/zamrozone_dni/${dzisStr}`] = true;

            db.ref().update(updates).then(() => {
                odswiezDaneProfiluUI();
                renderujZnajomych();
                pokazAlert("Płomyk zamrożony! ❄️", "Brrr! Płomykowi zrobiło się zimno, ale Twoja passa jest dzisiaj całkowicie bezpieczna.");
            }).catch(err => pokazAlert("Błąd bazy", err.message));
        }
    );
};

// --- PEŁNOEKRANOWA CELEBRACJA PO ĆWICZENIU ---
window.pokazCelebracjeStreaka = function(streakVal, wymusTest = false) {
    const modal = document.getElementById('modal-celebracja-streaka');
    if (!modal) return;

    const n = Math.max(1, Number(streakVal) || 1);
    const wymuszony = zalogowanyUczen ? zalogowanyUczen.wymuszony_kolor_streaka : null;
    const info = pobierzPoziomStreaka(n, wymuszony, false);

    const outerEl = document.getElementById('celebracja-flame-outer');
    const coreEl = document.getElementById('celebracja-flame-core');
    const dotEl = document.getElementById('celebracja-spark-dot');
    const diamEl = document.getElementById('celebracja-spark-diamond');
    const liczbaEl = document.getElementById('celebracja-streak-liczba');
    const slowoEl = document.getElementById('celebracja-streak-slowo');
    const opisEl = document.getElementById('celebracja-streak-opis');

    if (outerEl) outerEl.setAttribute('fill', info.outer);
    if (coreEl) coreEl.setAttribute('fill', info.core);
    if (dotEl) dotEl.setAttribute('fill', info.core);
    if (diamEl) diamEl.setAttribute('fill', info.core);

    if (liczbaEl) liczbaEl.innerText = n;
    if (slowoEl) slowoEl.innerText = (n === 1) ? 'dzień passy!' : 'dni passy z rzędu!';
    if (opisEl) {
        const minDzis = Number(zalogowanyUczen?.dzisiejsze_minuty) || 0;
        opisEl.innerText = minDzis > 0
            ? `Masz już dzisiaj wyćwiczone ${minDzis} min! Płomyczek aż rośnie z dumy.`
            : `Płomyczek cieszy się z Twojego dzisiejszego ćwiczenia! Tak trzymaj.`;
    }

    if (navigator.vibrate) navigator.vibrate([100, 60, 160]);
    pokazEkran('modal-celebracja-streaka', 'flex');

    if (!wymusTest && zalogowanyUid) {
        const dzisStr = formatujDateYMD(new Date());
        localStorage.setItem(`posm_celebrated_${zalogowanyUid}_${dzisStr}`, String(n));
    }
};

window.zamknijCelebracjeStreaka = function() {
    ukryjEkran('modal-celebracja-streaka');
};

function sprawdzCzyPokazacCelebracjePoWejsciu() {
    if (!zalogowanyUid || !zalogowanyUczen) return;
    const dzisStr = formatujDateYMD(new Date());
    const streakCount = Number(zalogowanyUczen.streak) || 0;

    if (zalogowanyUczen.ostatnia_aktywnosc === dzisStr && streakCount > 0) {
        const klucz = `posm_celebrated_${zalogowanyUid}_${dzisStr}`;
        const zapamietany = localStorage.getItem(klucz);
        if (!zapamietany || Number(zapamietany) < streakCount) {
            setTimeout(() => {
                pokazCelebracjeStreaka(streakCount, false);
            }, 450);
        }
    }
}

// --- SYSTEM ODZNAK I PANEL PIOTRA ---
function pobierzTabliceOdznak(uzytkownikData) {
    if (!uzytkownikData || !uzytkownikData.odznaki) return [];
    if (Array.isArray(uzytkownikData.odznaki)) return uzytkownikData.odznaki.filter(Boolean);
    return Object.values(uzytkownikData.odznaki).filter(Boolean);
}

window.otworzSekretnyPanelPiotra = function() {
    if (!zalogowanyUczen || !zalogowanyUczen.imie_nazwisko || !zalogowanyUczen.imie_nazwisko.includes('Piotr Nowik')) return;
    
    const sel = document.getElementById('piotr-odznaka-uczen');
    if (sel) {
        const obecnaWartosc = sel.value;
        const uczniowieLista = Object.entries(pelnaBazaUczniow)
            .filter(([, u]) => u && u.imie_nazwisko)
            .sort((a, b) => a[1].imie_nazwisko.localeCompare(b[1].imie_nazwisko, 'pl'));
        sel.innerHTML = `<option value="">Wybierz ucznia...</option>` + uczniowieLista.map(([uid, u]) => 
            `<option value="${uid}">${ucieczkaHtml(u.imie_nazwisko)} (${ucieczkaHtml(u.klasa || '-')})</option>`
        ).join('');
        if (obecnaWartosc) sel.value = obecnaWartosc;
    }

    const inpData = document.getElementById('piotr-zamroz-dzien-data');
    if (inpData && !inpData.value) inpData.value = formatujDateYMD(new Date());

    renderujZamrozoneDniSzkolyPiotr();
    renderujPaleteIkonOdznakPiotr();
    odswiezOdznakiWybranegoUczniaPiotr();
    pokazEkran('modal-sekretny-piotra');
};

function renderujZamrozoneDniSzkolyPiotr() {
    const lista = document.getElementById('piotr-zamrozone-dni-lista');
    if (!lista) return;
    const daty = Object.keys(zamrozoneDniSzkoly || {}).filter(d => zamrozoneDniSzkoly[d]).sort().reverse();
    if (daty.length === 0) {
        lista.innerHTML = `<span class="text-[11px] text-zinc-500 italic">Brak zamrożonych dni szkolnych.</span>`;
        return;
    }
    lista.innerHTML = daty.map(ymd => `
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/50 border border-sky-500/30 text-xs text-sky-200">
            <span>❄️ ${ucieczkaHtml(ymd)}</span>
            <button type="button" onclick="usunZamrozonyDzienSzkolyPiotr('${ymd}')" class="text-rose-400 hover:text-rose-300 font-bold ml-1" title="Odwołaj zamrożenie">✕</button>
        </div>
    `).join('');
}

window.dodajZamrozonyDzienSzkolyPiotr = function() {
    const inp = document.getElementById('piotr-zamroz-dzien-data');
    const ymd = inp ? inp.value : '';
    if (!ymd) {
        pokazAlert("Uwaga", "Wybierz datę z kalendarza.");
        return;
    }
    db.ref('zamrozone_dni_szkoly/' + ymd).set(true).then(() => {
        pokazAlert("Dzień zamrożony ❄️", `Data ${ymd} została zamrożona dla całej szkoły. Nikt nie straci przez ten dzień passy (a ćwiczącym normalnie nabije się dzień!).`);
    }).catch(e => pokazAlert("Błąd", e.message));
};

window.usunZamrozonyDzienSzkolyPiotr = function(ymd) {
    db.ref('zamrozone_dni_szkoly/' + ymd).remove();
};

window.zmienZamrozeniaUczniaPiotr = function(delta) {
    const uid = document.getElementById('piotr-odznaka-uczen')?.value;
    if (!uid || !pelnaBazaUczniow[uid]) return;
    const obecne = Number(pelnaBazaUczniow[uid].zamrozenia_liczba) || 0;
    const nowe = Math.max(0, obecne + delta);
    db.ref(`uczniowie/${uid}/zamrozenia_liczba`).set(nowe).then(() => {
        pelnaBazaUczniow[uid].zamrozenia_liczba = nowe;
        odswiezOdznakiWybranegoUczniaPiotr();
    });
};

function renderujPaleteIkonOdznakPiotr() {
    const grid = document.getElementById('piotr-odznaka-ikony');
    if (!grid) return;
    grid.innerHTML = DOSTEPNE_IKONY_ODZNAK.map(ik => `
        <button type="button" onclick="wybierzIkoneOdznakiPiotr('${ik}')" class="badge-icon-btn ${wybranaIkonaOdznakiPiotr === ik ? 'selected' : ''}">${ik}</button>
    `).join('');
}

window.wybierzIkoneOdznakiPiotr = function(ikona) {
    wybranaIkonaOdznakiPiotr = ikona;
    renderujPaleteIkonOdznakPiotr();
};

window.odswiezOdznakiWybranegoUczniaPiotr = function() {
    const uid = document.getElementById('piotr-odznaka-uczen')?.value;
    const box = document.getElementById('piotr-odznaki-aktualne-box');
    const lista = document.getElementById('piotr-odznaki-aktualne-lista');
    const zamBox = document.getElementById('piotr-zamrozenia-ucznia-box');
    const zamIlosc = document.getElementById('piotr-uczen-zamrozenia-ilosc');

    if (!uid || !pelnaBazaUczniow[uid]) {
        if (box) ukryjEkran('piotr-odznaki-aktualne-box');
        if (zamBox) ukryjEkran('piotr-zamrozenia-ucznia-box');
        return;
    }

    const u = pelnaBazaUczniow[uid];
    if (zamBox && zamIlosc) {
        pokazEkran('piotr-zamrozenia-ucznia-box', 'flex');
        zamIlosc.innerText = `${Number(u.zamrozenia_liczba) || 0} ❄️`;
    }

    if (!box || !lista) return;
    const odznaki = pobierzTabliceOdznak(u);
    if (odznaki.length === 0) {
        ukryjEkran('piotr-odznaki-aktualne-box');
        return;
    }
    pokazEkran('piotr-odznaki-aktualne-box', 'flex');
    lista.innerHTML = odznaki.map((odz, idx) => `
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs">
            <span>${ucieczkaHtml(odz.ikona)}</span>
            <span class="font-bold text-white">${ucieczkaHtml(odz.tytul)}</span>
            <button type="button" onclick="usunOdznakeUczniaPiotr('${uid}', ${idx})" class="text-rose-400 hover:text-rose-300 font-bold ml-1" title="Usuń odznakę">✕</button>
        </div>
    `).join('');
};

window.nadajOdznakeUczniowiPiotr = function() {
    const uid = document.getElementById('piotr-odznaka-uczen')?.value;
    const tytul = (document.getElementById('piotr-odznaka-tytul')?.value || '').trim();
    const opis = (document.getElementById('piotr-odznaka-opis')?.value || '').trim();

    if (!uid || !pelnaBazaUczniow[uid]) {
        pokazAlert("Uwaga", "Wybierz ucznia z listy.");
        return;
    }
    if (!tytul) {
        pokazAlert("Uwaga", "Wpisz nazwę odznaki (np. Halloween).");
        return;
    }

    const obecne = pobierzTabliceOdznak(pelnaBazaUczniow[uid]);
    obecne.push({
        id: 'bdg_' + Date.now(),
        ikona: wybranaIkonaOdznakiPiotr,
        tytul: tytul,
        opis: opis || 'Odznaka przyznana w Samorządzie Solnej.',
        czas: terazDataString()
    });

    db.ref(`uczniowie/${uid}/odznaki`).set(obecne).then(() => {
        document.getElementById('piotr-odznaka-tytul').value = '';
        document.getElementById('piotr-odznaka-opis').value = '';
        odswiezOdznakiWybranegoUczniaPiotr();
        pokazAlert("Nadano odznakę", `Przypisano odznakę "${tytul}" dla: ${pelnaBazaUczniow[uid].imie_nazwisko}`);
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

window.usunOdznakeUczniaPiotr = function(uid, idx) {
    if (!pelnaBazaUczniow[uid]) return;
    const obecne = pobierzTabliceOdznak(pelnaBazaUczniow[uid]);
    obecne.splice(idx, 1);
    db.ref(`uczniowie/${uid}/odznaki`).set(obecne.length > 0 ? obecne : null).then(() => {
        odswiezOdznakiWybranegoUczniaPiotr();
    });
};

window.otworzSzczegolyOdznaki = function(wlascicielUid, idx) {
    const u = (wlascicielUid === zalogowanyUid) ? zalogowanyUczen : pelnaBazaUczniow[wlascicielUid];
    if (!u) return;
    const odznaki = pobierzTabliceOdznak(u);
    const odz = odznaki[idx];
    if (!odz) return;

    document.getElementById('odznaka-modal-ikona').innerText = odz.ikona || '🏆';
    document.getElementById('odznaka-modal-tytul').innerText = odz.tytul || 'Odznaka';
    document.getElementById('odznaka-modal-opis').innerText = odz.opis || '';

    const sortBox = document.getElementById('odznaka-modal-sort-kontener');
    if (wlascicielUid === zalogowanyUid && odznaki.length > 1) {
        pokazEkran('odznaka-modal-sort-kontener', 'flex');
        const btnL = document.getElementById('btn-odznaka-lewo');
        const btnP = document.getElementById('btn-odznaka-prawo');
        btnL.disabled = (idx === 0);
        btnP.disabled = (idx === odznaki.length - 1);
        btnL.style.opacity = idx === 0 ? '0.4' : '1';
        btnP.style.opacity = idx === odznaki.length - 1 ? '0.4' : '1';
        btnL.onclick = () => przesunMojaOdznake(idx, -1);
        btnP.onclick = () => przesunMojaOdznake(idx, 1);
    } else if (sortBox) {
        ukryjEkran('odznaka-modal-sort-kontener');
    }

    pokazEkran('modal-szczegoly-odznaki');
};

function przesunMojaOdznake(idx, kierunek) {
    if (!zalogowanyUid || !zalogowanyUczen) return;
    const odznaki = pobierzTabliceOdznak(zalogowanyUczen);
    const nowyIdx = idx + kierunek;
    if (nowyIdx < 0 || nowyIdx >= odznaki.length) return;

    const temp = odznaki[idx];
    odznaki[idx] = odznaki[nowyIdx];
    odznaki[nowyIdx] = temp;

    zalogowanyUczen.odznaki = odznaki;
    db.ref(`uczniowie/${zalogowanyUid}/odznaki`).set(odznaki).then(() => {
        odswiezDaneProfiluUI();
        otworzSzczegolyOdznaki(zalogowanyUid, nowyIdx);
    });
}

window.ustawWymuszonyKolorPlomyka = function(prog) {
    if (!zalogowanyUid || !zalogowanyUczen) return;
    zalogowanyUczen.wymuszony_kolor_streaka = prog;
    db.ref('uczniowie/' + zalogowanyUid + '/wymuszony_kolor_streaka').set(prog);
    czyStreakBylAnimowany = true;
    przeliczStatusStreaka();
    renderujZnajomych();
};

window.otworzModalPoziomowStreaka = function() {
    const el = document.getElementById('modal-streak-liczba-zamrozen');
    if (el && zalogowanyUczen) {
        el.innerText = `Dostępne: ${Number(zalogowanyUczen.zamrozenia_liczba) || 0} ❄️`;
    }
    pokazEkran('modal-poziomy-streaka');
};
window.zamknijModalPoziomowStreaka = function() { ukryjEkran('modal-poziomy-streaka'); };

// --- SYSTEM AWATARÓW ---
function pobierzInicjaly(imieNazwisko) {
    const cz = (imieNazwisko || 'Uczeń').trim().split(/\s+/);
    return (cz[0].charAt(0) + (cz[1] ? cz[1].charAt(0) : '')).toUpperCase();
}

function wyrenderujWnetrzeAvataru(uzytkownikData, rozmiarTekstuKlasa = 'text-xs') {
    if (!uzytkownikData) return '-';
    const av = uzytkownikData.avatar || '';
    if (av.startsWith('data:image/')) {
        return `<img src="${av}" alt="Awatar" class="w-full h-full object-cover">`;
    }
    return `<span class="${rozmiarTekstuKlasa} font-black select-none">${ucieczkaHtml(pobierzInicjaly(uzytkownikData.imie_nazwisko))}</span>`;
}

window.otworzModalAvataru = function() {
    if (!zalogowanyUczen) return;
    const obecny = zalogowanyUczen.avatar || null;
    wybranyAvatarTymczasowy = (obecny && obecny.startsWith('data:image/')) ? obecny : null;
    ukryjEkran('avatar-cropper-kontener');
    const fileInp = document.getElementById('input-avatar-plik');
    if (fileInp) fileInp.value = '';
    odswiezPodgladAvataruWModalu();
    pokazEkran('modal-zmiana-avataru');
    inicjalizujZdarzeniaCroppera();
};

window.zamknijModalAvataru = function() { ukryjEkran('modal-zmiana-avataru'); };

function odswiezPodgladAvataruWModalu() {
    const prev = document.getElementById('avatar-modal-preview');
    if (!prev) return;
    const tymczasowyObiekt = {
        imie_nazwisko: zalogowanyUczen ? zalogowanyUczen.imie_nazwisko : 'Uczeń',
        avatar: wybranyAvatarTymczasowy
    };
    prev.innerHTML = wyrenderujWnetrzeAvataru(tymczasowyObiekt, 'text-xl');
}

window.usunWlasnyAvatar = function() {
    wybranyAvatarTymczasowy = null;
    cropState.img = null;
    ukryjEkran('avatar-cropper-kontener');
    const fileInput = document.getElementById('input-avatar-plik');
    if (fileInput) fileInput.value = '';
    odswiezPodgladAvataruWModalu();
};

function inicjalizujZdarzeniaCroppera() {
    if (cropState.initialized) return;
    const canvas = document.getElementById('avatar-crop-canvas');
    if (!canvas) return;
    cropState.initialized = true;

    const startDrag = (clientX, clientY) => {
        if (!cropState.img) return;
        cropState.dragging = true;
        cropState.startX = clientX - cropState.x;
        cropState.startY = clientY - cropState.y;
    };

    const moveDrag = (clientX, clientY) => {
        if (!cropState.dragging || !cropState.img) return;
        cropState.x = clientX - cropState.startX;
        cropState.y = clientY - cropState.startY;
        rysujCropCanvas();
    };

    const endDrag = () => { cropState.dragging = false; };

    canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            e.preventDefault();
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });
    window.addEventListener('touchmove', e => {
        if (cropState.dragging && e.touches.length === 1) {
            e.preventDefault();
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });
    window.addEventListener('touchend', endDrag);
}

function rysujCropCanvas() {
    const canvas = document.getElementById('avatar-crop-canvas');
    if (!canvas || !cropState.img) return;
    const ctx = canvas.getContext('2d');
    const size = 200;
    const scale = cropState.baseScale * cropState.zoom;
    const drawW = cropState.img.width * scale;
    const drawH = cropState.img.height * scale;

    const minX = size - drawW;
    const minY = size - drawH;
    cropState.x = Math.min(0, Math.max(minX, cropState.x));
    cropState.y = Math.min(0, Math.max(minY, cropState.y));

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(cropState.img, cropState.x, cropState.y, drawW, drawH);

    const outSize = 320;
    const ratio = outSize / size;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outSize;
    outCanvas.height = outSize;
    const outCtx = outCanvas.getContext('2d');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(cropState.img, cropState.x * ratio, cropState.y * ratio, drawW * ratio, drawH * ratio);
    wybranyAvatarTymczasowy = outCanvas.toDataURL('image/jpeg', 0.88);
    odswiezPodgladAvataruWModalu();
}

window.zmienZoomKadrowania = function(nowyZoom) {
    if (!cropState.img) return;
    const oldScale = cropState.baseScale * cropState.zoom;
    cropState.zoom = parseFloat(nowyZoom) || 1;
    const newScale = cropState.baseScale * cropState.zoom;

    const center = 100;
    cropState.x = center - ((center - cropState.x) / oldScale) * newScale;
    cropState.y = center - ((center - cropState.y) / oldScale) * newScale;
    rysujCropCanvas();
};

window.wczytajPlikAvataru = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        pokazAlert("Błąd pliku", "Wybierz poprawny plik graficzny (JPG, PNG, WebP).");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const size = 200;
            cropState.img = img;
            cropState.baseScale = Math.max(size / img.width, size / img.height);
            cropState.zoom = 1;
            cropState.x = (size - img.width * cropState.baseScale) / 2;
            cropState.y = (size - img.height * cropState.baseScale) / 2;

            const zoomSlider = document.getElementById('avatar-crop-zoom');
            if (zoomSlider) zoomSlider.value = '1';

            pokazEkran('avatar-cropper-kontener', 'flex');
            rysujCropCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.zapiszNowyAvatar = function() {
    if (!zalogowanyUid) return;
    db.ref('uczniowie/' + zalogowanyUid + '/avatar').set(wybranyAvatarTymczasowy || null).then(() => {
        zalogowanyUczen.avatar = wybranyAvatarTymczasowy || null;
        odswiezDaneProfiluUI();
        zamknijModalAvataru();
        pokazAlert("Zapisano", "Twój awatar profilowy został zaktualizowany.");
    }).catch(err => pokazAlert("Błąd zapisu", err.message));
};

window.otworzModalZmianyHasla = function() {
    document.getElementById('zmiana-obecne-haslo').value = '';
    document.getElementById('zmiana-nowe-haslo-1').value = '';
    document.getElementById('zmiana-nowe-haslo-2').value = '';
    pokazEkran('modal-zmiana-hasla-dobrowolna');
};

window.zamknijModalZmianyHasla = function() { ukryjEkran('modal-zmiana-hasla-dobrowolna'); };

window.zatwierdzDobrowolnaZmianeHasla = async function() {
    if (!zalogowanyUid || !zalogowanyUczen) return;
    const obecne = document.getElementById('zmiana-obecne-haslo').value.trim();
    const nowe1 = document.getElementById('zmiana-nowe-haslo-1').value.trim();
    const nowe2 = document.getElementById('zmiana-nowe-haslo-2').value.trim();

    if (!obecne || !nowe1 || !nowe2) { pokazAlert("Uwaga", "Wypełnij wszystkie pola."); return; }
    if (nowe1.length < 4) { pokazAlert("Uwaga", "Nowe hasło musi mieć minimum 4 znaki."); return; }
    if (nowe1 !== nowe2) { pokazAlert("Uwaga", "Nowe hasła nie są identyczne."); return; }

    const hashObecnego = await sha256(obecne);
    const zapisaneHaslo = String(zalogowanyUczen.haslo || '');
    const czyPoprawne = (zalogowanyUczen.zmieniono_haslo === true)
        ? (zapisaneHaslo === hashObecnego)
        : (zapisaneHaslo === obecne || zapisaneHaslo === hashObecnego);

    if (!czyPoprawne) { pokazAlert("Błąd autoryzacji", "Wpisane obecne hasło jest nieprawidłowe."); return; }

    const nowyHash = await sha256(nowe1);
    db.ref('uczniowie/' + zalogowanyUid).update({ haslo: nowyHash, zmieniono_haslo: true }).then(() => {
        zalogowanyUczen.haslo = nowyHash;
        zalogowanyUczen.zmieniono_haslo = true;
        zamknijModalZmianyHasla();
        pokazAlert("Hasło zmienione", "Twoje nowe hasło zostało bezpiecznie zapisane.");
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

// --- LOGIKA STREAKA, ZAMROŻENIA I UKRYWANIA PRZY 0 ---
let streakAnimateTimeout = null;
let streakAnimateInterval = null;

function aktualizujKolorPoziomuWProfilu(streakCount, czyZamrozonyDzis = false) {
    const wrapper = document.getElementById('start-streak-wrapper');
    if (!wrapper) return;
    const wymuszony = zalogowanyUczen ? zalogowanyUczen.wymuszony_kolor_streaka : null;
    wrapper.classList.remove('streak-tier-50', 'streak-tier-100', 'streak-tier-200', 'streak-tier-300', 'streak-tier-350', 'streak-frozen');
    const info = pobierzPoziomStreaka(streakCount, wymuszony, czyZamrozonyDzis);
    if (info.klasa) wrapper.classList.add(info.klasa);
}

function animujStreakWProfilu(streakCount, isSzary, czyZamrozonyDzis = false) {
    const fillContainer = document.getElementById('start-streak-icon-fill');
    const countEl = document.getElementById('start-streak-count');
    const wrapper = document.getElementById('start-streak-wrapper');
    if (!fillContainer || !countEl || !wrapper) return;
    
    clearTimeout(streakAnimateTimeout);
    clearInterval(streakAnimateInterval);

    const maWymuszonyKolor = zalogowanyUczen && zalogowanyUczen.wymuszony_kolor_streaka !== undefined && zalogowanyUczen.wymuszony_kolor_streaka !== null;

    // JEŻELI NIE MA PASSY (0 DNI) -> NIE POKAZUJEMY PŁOMYCZKA ANI CYFERKI
    if (streakCount <= 0 && !maWymuszonyKolor) {
        ukryjEkran('start-streak-wrapper');
        return;
    }

    pokazEkran('start-streak-wrapper', 'flex');
    aktualizujKolorPoziomuWProfilu(streakCount, czyZamrozonyDzis);
    
    if (!maWymuszonyKolor && !czyZamrozonyDzis && isSzary) {
        wrapper.classList.add('streak-lost');
        wrapper.classList.remove('streak-active');
        countEl.innerText = streakCount;
        fillContainer.style.transition = 'none';
        fillContainer.style.clipPath = 'inset(100% 0 0 0)';
    } else {
        wrapper.classList.remove('streak-lost');
        wrapper.classList.add('streak-active');
        
        if (czyStreakBylAnimowany) {
            fillContainer.style.transition = 'none';
            fillContainer.style.clipPath = 'none';
            countEl.innerText = streakCount;
        } else {
            fillContainer.style.transition = 'none';
            fillContainer.style.clipPath = 'inset(100% 0 0 0)';
            countEl.innerText = '0';
            void fillContainer.offsetWidth;
            
            streakAnimateTimeout = setTimeout(() => {
                fillContainer.style.transition = 'clip-path 2.6s cubic-bezier(0.2, 0.8, 0.4, 1)';
                fillContainer.style.clipPath = 'inset(0% 0 0 0)';
                
                const duration = 2600; 
                const stepTime = 30;
                const totalSteps = duration / stepTime;
                let currentStep = 0;
                
                streakAnimateInterval = setInterval(() => {
                    currentStep++;
                    const progress = currentStep / totalSteps;
                    const ease = easeInOutPow(progress, 1.5); 
                    const currentVal = Math.floor(ease * streakCount);
                    
                    countEl.innerText = currentVal;
                    aktualizujKolorPoziomuWProfilu(currentVal, czyZamrozonyDzis);
                    
                    if (currentStep >= totalSteps) {
                        clearInterval(streakAnimateInterval);
                        countEl.innerText = streakCount;
                        aktualizujKolorPoziomuWProfilu(streakCount, czyZamrozonyDzis);
                        fillContainer.style.clipPath = 'none';
                        czyStreakBylAnimowany = true;
                    }
                }, stepTime);
            }, 150); 
        }
    }
}

function przeliczStatusStreaka() {
    if (!zalogowanyUczen) return;

    const btnSekretny = document.getElementById('btn-sekretny-piotra');
    const badgeProfil = document.getElementById('badge-twoj-profil');
    if (zalogowanyUczen.imie_nazwisko && zalogowanyUczen.imie_nazwisko.includes('Piotr Nowik')) {
        if (btnSekretny) {
            btnSekretny.classList.remove('hidden');
            btnSekretny.style.display = 'inline-flex';
        }
        if (badgeProfil) badgeProfil.classList.add('cursor-pointer');
    } else {
        if (btnSekretny) btnSekretny.classList.add('hidden');
    }
    
    const dzis = new Date();
    dzis.setHours(0,0,0,0);
    const dzisStr = formatujDateYMD(dzis);
    
    const ostAktywnoscStr = zalogowanyUczen.ostatnia_aktywnosc;
    let streakCount = Number(zalogowanyUczen.streak) || 0;
    let minutyDzis = (ostAktywnoscStr === dzisStr) ? (Number(zalogowanyUczen.dzisiejsze_minuty) || 0) : 0;
    let pominieteDni = 0;
    
    if (ostAktywnoscStr) {
        const p = ostAktywnoscStr.split('-');
        if (p.length === 3) {
            const ostAkt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
            ostAkt.setHours(0,0,0,0);
            let wczoraj = new Date(dzis);
            wczoraj.setDate(wczoraj.getDate() - 1);
            if (ostAkt < wczoraj) pominieteDni = dniRoboczePomiedzy(ostAkt, wczoraj, zalogowanyUczen);
        }
    }
    
    if (pominieteDni > 2) {
        streakCount = 0;
        pominieteDni = 0;
        minutyDzis = 0;
        db.ref('uczniowie/' + zalogowanyUid).update({ streak: 0, ostatnia_aktywnosc: null, dzisiejsze_minuty: 0 });
    }

    const cwiczylDzis = (ostAktywnoscStr === dzisStr);
    const czyZamrozonyDzis = !cwiczylDzis && czyDzienJestZamrozonyDlaUcznia(dzisStr, zalogowanyUczen);
    const isSzary = pominieteDni > 0 && !czyZamrozonyDzis;

    // Aktualizacja przycisku zamrożenia w profilu
    const elLiczbaZamrozen = document.getElementById('start-liczba-zamrozen');
    const elTekstZamroz = document.getElementById('start-tekst-zamroz');
    if (elLiczbaZamrozen) elLiczbaZamrozen.innerText = Number(zalogowanyUczen.zamrozenia_liczba) || 0;
    if (elTekstZamroz) {
        if (czyZamrozonyDzis) elTekstZamroz.innerText = 'Zamrożony dziś 🥶';
        else if (cwiczylDzis) elTekstZamroz.innerText = 'Zaliczono dziś 🔥';
        else elTekstZamroz.innerText = 'Zamroź dziś';
    }

    if (aktywnaZakladkaId === 'start') animujStreakWProfilu(streakCount, isSzary, czyZamrozonyDzis);
    sprawdzCzyPokazacCelebracjePoWejsciu();
    
    const panelOdnowy = document.getElementById('panel-odnowy-streaka');
    if (panelOdnowy) {
        if (pominieteDni > 0 && streakCount > 0) {
            panelOdnowy.classList.remove('hidden');
            const wymaganeMinuty = pominieteDni * 60;
            const procent = Math.min(100, Math.round((minutyDzis / wymaganeMinuty) * 100));
            
            document.getElementById('streak-brakujacy-czas').innerText = `Do odrobienia: ${Math.floor(wymaganeMinuty/60)}h`;
            document.getElementById('streak-progress-text').innerText = `${minutyDzis} / ${wymaganeMinuty} min`;
            
            setTimeout(() => {
                const bar = document.getElementById('streak-progress-bar');
                if (bar) bar.style.width = `${procent}%`;
            }, 500);
            
            const btnOdzyskaj = document.getElementById('btn-odzyskaj-streak');
            if (btnOdzyskaj) {
                if (minutyDzis >= wymaganeMinuty) {
                    btnOdzyskaj.className = "w-full py-3 rounded-xl font-bold text-xs sm:text-sm btn-classic-primary transition-all relative z-10 shadow-lg";
                    btnOdzyskaj.disabled = false;
                } else {
                    btnOdzyskaj.className = "w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-zinc-800 text-zinc-500 cursor-not-allowed transition-all relative z-10 border border-transparent";
                    btnOdzyskaj.disabled = true;
                }
            }
        } else {
            panelOdnowy.classList.add('hidden');
        }
    }
}

window.odzyskajStreak = function() {
    db.ref('uczniowie/' + zalogowanyUid).update({
        ostatnia_aktywnosc: formatujDateYMD(new Date()),
        dzisiejsze_minuty: 0
    }).then(() => {
        pokazAlert("Seria przywrócona", "Twoja seria dni jest ponownie aktywna.");
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

window.przelaczZakladkeUcznia = function(nazwa) {
    if (nazwa === aktywnaZakladkaId || isTabAnimating) return;

    const oldIdx = tabOrderUcznia.indexOf(aktywnaZakladkaId);
    const newIdx = tabOrderUcznia.indexOf(nazwa);
    const direction = newIdx > oldIdx ? 'right' : 'left'; 

    isTabAnimating = true;
    const oldView = document.getElementById('widok-' + aktywnaZakladkaId);
    const newView = document.getElementById('widok-' + nazwa);

    tabOrderUcznia.forEach(id => {
        const btn = document.getElementById('tab-uczen-' + id);
        if(btn) {
            if (id === nazwa) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });

    if (oldView) {
        oldView.classList.remove('anim-slide-in-right', 'anim-slide-in-left', 'animate-fade-in');
        oldView.classList.add(direction === 'right' ? 'anim-slide-out-left' : 'anim-slide-out-right');
    }

    setTimeout(() => {
        if (oldView) {
            ukryjEkran('widok-' + aktywnaZakladkaId);
            oldView.classList.remove('anim-slide-out-left', 'anim-slide-out-right');
        }
        if (newView) {
            pokazEkran('widok-' + nazwa, 'flex');
            newView.classList.remove('anim-slide-out-left', 'anim-slide-out-right', 'animate-fade-in');
            newView.classList.add(direction === 'right' ? 'anim-slide-in-right' : 'anim-slide-in-left');
        }
        aktywnaZakladkaId = nazwa;
        
        setTimeout(() => {
            isTabAnimating = false;
            if (nazwa === 'start') {
                przeliczStatusStreaka();
            }
        }, 300);

        if (nazwa === 'glosowania') { localStorage.setItem('posm_last_seen_ankiety', terazDataString()); renderujWidokStart(); }
        if (nazwa === 'propozycje') { localStorage.setItem('posm_last_seen_propozycje', terazDataString()); renderujWidokStart(); }
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, 280); 
};

function sprawdzUprawnieniaSamorzadu() {
    if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad') {
        const btn = document.getElementById('tab-uczen-panel-samorzadu');
        if (btn) {
            btn.classList.remove('hidden');
            btn.style.setProperty('display', 'inline-flex', 'important'); 
        }
    }
}

function aktualizujTogglyPush() {
    const tU = document.getElementById('push-ulubione');
    const tA = document.getElementById('push-ankiety');
    const tP = document.getElementById('push-propozycje');
    const tS = document.getElementById('ustawienie-prywatnosc-sala');
    const tR = document.getElementById('ustawienie-prywatnosc-ranking');
    if (tU) tU.checked = ustawieniaPush.ulubione === true;
    if (tA) tA.checked = ustawieniaPush.ankiety === true;
    if (tP) tP.checked = ustawieniaPush.propozycje === true;
    if (tS && zalogowanyUczen.ustawienia_prywatnosci) tS.checked = zalogowanyUczen.ustawienia_prywatnosci.pokazuj_sale !== false;
    if (tR && zalogowanyUczen.ustawienia_prywatnosci) tR.checked = zalogowanyUczen.ustawienia_prywatnosci.pokazuj_w_rankingu === true;
}

window.zmienUstawieniePush = function(typ, wartosc) {
    if (!zalogowanyUid) return;
    ustawieniaPush[typ] = wartosc;
    db.ref(`uczniowie/${zalogowanyUid}/powiadomienia/${typ}`).set(wartosc);
};

window.zmienUstawienieRankingu = function(pokazujWRankingu) {
    if (!zalogowanyUid) return;
    if (!zalogowanyUczen.ustawienia_prywatnosci) zalogowanyUczen.ustawienia_prywatnosci = {};
    zalogowanyUczen.ustawienia_prywatnosci.pokazuj_w_rankingu = pokazujWRankingu;
    db.ref('uczniowie/' + zalogowanyUid + '/ustawienia_prywatnosci/pokazuj_w_rankingu').set(pokazujWRankingu).then(() => {
        renderujPodiumTygodnia();
    }).catch(e => pokazAlert("Błąd", e.message));
};

function uruchomAnimacjePowitania(daneUcznia, callback) {
    const ep = document.getElementById('ekran-powitania');
    const imie = daneUcznia.imie_nazwisko ? daneUcznia.imie_nazwisko.split(' ')[0] : 'Uczniu';
    ep.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full w-full relative">
            <h1 id="tekst-powitania" class="text-4xl sm:text-5xl font-black text-white text-glow opacity-0 transition-all duration-1000 transform translate-y-4 tracking-tight absolute">Cześć, ${ucieczkaHtml(imie)}</h1>
            <div id="loader-kontener" class="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden opacity-0 absolute transition-opacity duration-700">
                <div class="h-full bg-white w-0" id="powitanie-bar" style="transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
        </div>
    `;
    pokazEkran('ekran-powitania');
    setTimeout(() => { document.getElementById('tekst-powitania')?.classList.remove('opacity-0', 'translate-y-4'); }, 100);
    setTimeout(() => { document.getElementById('tekst-powitania')?.classList.add('opacity-0', '-translate-y-4'); }, 1800);
    setTimeout(() => {
        document.getElementById('loader-kontener')?.classList.remove('opacity-0');
        setTimeout(() => { const b = document.getElementById('powitanie-bar'); if(b) b.style.width = '100%'; }, 100);
    }, 2400);
    setTimeout(() => {
        ep.classList.add('opacity-0');
        setTimeout(() => { ukryjEkran('ekran-powitania'); ep.classList.remove('opacity-0'); ep.innerHTML = ''; callback(); }, 600);
    }, 4000);
}

window.zalogujUcznia = async function() {
    const loginWpisany = usunPolskieZnaki(document.getElementById('login-input').value.trim()).replace(/[-\s]+/g, '.').replace(/\.+/g, '.');
    const hasloWpisane = document.getElementById('haslo-input').value.trim();
    if (!loginWpisany || !hasloWpisane) { pokazAlert("Uwaga", "Wpisz login oraz hasło."); return; }

    db.ref('uczniowie').once('value', async snap => {
        const uczniowie = snap.val() || {};
        let znUid = null, znDane = null;
        for (const [uid, u] of Object.entries(uczniowie)) {
            if (!u || !u.imie_nazwisko) continue;
            const logKrotki = wygenerujLoginZImienia(u.imie_nazwisko);
            const logBazy = u.login ? usunPolskieZnaki(u.login).replace(/[-\s]+/g, '.').replace(/\.+/g, '.') : logKrotki;
            if (loginWpisany === logBazy || loginWpisany === logKrotki) { znUid = uid; znDane = u; break; }
        }
        if (!znUid) { pokazAlert("Błąd logowania", "Nie znaleziono konta."); return; }
        
        const hashedWpisane = await sha256(hasloWpisane);
        if (znDane.zmieniono_haslo === true) {
            if (String(znDane.haslo) !== hashedWpisane) { pokazAlert("Błąd logowania", "Błędne hasło."); return; }
        } else {
            if (String(znDane.haslo || 'posm123') !== hasloWpisane) { pokazAlert("Błąd logowania", "Błędne hasło (startowe)."); return; }
        }
        
        if (!znDane.kod_znajomego) {
            znDane.kod_znajomego = String(Math.floor(100000000 + Math.random() * 900000000)).replace(/(.{3})/g, '$1 ').trim();
            db.ref('uczniowie/' + znUid + '/kod_znajomego').set(znDane.kod_znajomego).catch(e => console.log(e));
        }
        if (!znDane.ustawienia_prywatnosci) {
            znDane.ustawienia_prywatnosci = { pokazuj_sale: true, pokazuj_w_rankingu: false };
            db.ref('uczniowie/' + znUid + '/ustawienia_prywatnosci').set(znDane.ustawienia_prywatnosci).catch(e=>console.log(e));
        }
        
        sprawdzMiesiecznyBonusZamrozenia(znUid, znDane);
        zalogowanyUid = znUid; zalogowanyUczen = znDane; czyStreakBylAnimowany = false;
        ulubioneSale = znDane.ulubione ? Object.values(znDane.ulubione).filter(Boolean) : [];
        ustawieniaPush = znDane.powiadomienia || { ulubione: false, ankiety: false, propozycje: false };

        if (znDane.zmieniono_haslo !== true) {
            ukryjEkran('ekran-logowania'); pokazEkran('ekran-zmiany-hasla');
        } else {
            ukryjEkran('ekran-logowania');
            localStorage.setItem('posm_uczen_uid', zalogowanyUid); 
            uruchomAnimacjePowitania(znDane, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
        }
    });
};

window.zapiszNoweHaslo = async function() {
    const h1 = document.getElementById('nowe-haslo-1').value.trim(), h2 = document.getElementById('nowe-haslo-2').value.trim();
    if (h1.length < 4) { pokazAlert("Uwaga", "Minimum 4 znaki."); return; }
    if (h1 === String(zalogowanyUczen.haslo || '') || h1.toLowerCase() === 'posm123') { pokazAlert("Uwaga", "Hasło musi różnić się od startowego."); return; }
    if (h1 !== h2) { pokazAlert("Uwaga", "Hasła nie są identyczne."); return; }

    const hashedHaslo = await sha256(h1);
    db.ref('uczniowie/' + zalogowanyUid).update({ login: wygenerujLoginZImienia(zalogowanyUczen.imie_nazwisko), haslo: hashedHaslo, zmieniono_haslo: true }).then(() => {
        zalogowanyUczen.haslo = hashedHaslo; zalogowanyUczen.zmieniono_haslo = true;
        localStorage.setItem('posm_uczen_uid', zalogowanyUid);
        ukryjEkran('ekran-zmiany-hasla');
        uruchomAnimacjePowitania(zalogowanyUczen, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

window.wylogujUcznia = function() { localStorage.removeItem('posm_uczen_uid'); location.reload(); };

window.addEventListener('DOMContentLoaded', () => {
    const zUid = localStorage.getItem('posm_uczen_uid');
    if (zUid) {
        ukryjEkran('ekran-logowania');
        db.ref('uczniowie/' + zUid).once('value', snap => {
            const dane = snap.val();
            if (dane && dane.zmieniono_haslo === true) {
                if (!dane.kod_znajomego) {
                    dane.kod_znajomego = String(Math.floor(100000000 + Math.random() * 900000000)).replace(/(.{3})/g, '$1 ').trim();
                    db.ref('uczniowie/' + zUid + '/kod_znajomego').set(dane.kod_znajomego).catch(e=>console.log(e));
                }
                if (!dane.ustawienia_prywatnosci) {
                    dane.ustawienia_prywatnosci = { pokazuj_sale: true, pokazuj_w_rankingu: false };
                    db.ref('uczniowie/' + zUid + '/ustawienia_prywatnosci').set(dane.ustawienia_prywatnosci).catch(e=>console.log(e));
                }
                sprawdzMiesiecznyBonusZamrozenia(zUid, dane);
                zalogowanyUid = zUid; zalogowanyUczen = dane; 
                ulubioneSale = dane.ulubione ? Object.values(dane.ulubione).filter(Boolean) : []; 
                ustawieniaPush = dane.powiadomienia || { ulubione: false, ankiety: false, propozycje: false };
                uruchomAnimacjePowitania(dane, () => { uruchomWidokTablicy(); sprawdzUprawnieniaSamorzadu(); });
            } else { pokazEkran('ekran-logowania'); }
        });
    } else { pokazEkran('ekran-logowania'); }
});

window.kopiujMojKod = function() {
    const el = document.getElementById('moj-kod-znajomego');
    if (!el || !navigator.clipboard) return;
    navigator.clipboard.writeText(el.innerText.trim()).then(() => {
        pokazAlert("Skopiowano kod", "Twój kod znajomego został skopiowany do schowka.");
    });
};

function odswiezDaneProfiluUI() {
    try {
        const i1 = zalogowanyUczen.instrument || '-';
        const i2 = (zalogowanyUczen.instrument2 || zalogowanyUczen.instrument_2 || zalogowanyUczen.drugi_instrument || '').trim();
        const czesciImienia = (zalogowanyUczen.imie_nazwisko || 'Uczeń').split(' ');
        const krotkaNazwa = sformatujImieINazwiskoKropka(zalogowanyUczen.imie_nazwisko);
        
        document.getElementById('nav-uczen-info').innerText = krotkaNazwa + ' (' + (zalogowanyUczen.klasa || '-') + ')';
        document.getElementById('start-powitanie').innerText = czesciImienia[0];
        document.getElementById('start-klasa').innerText = (zalogowanyUczen.rola === 'nauczyciel' || zalogowanyUczen.rola === 'pracownik' || zalogowanyUczen.rola === 'administracja' || zalogowanyUczen.rola === 'obsluga') ? 'Pracownik szkoły' : 'Klasa ' + (zalogowanyUczen.klasa || '-');
        
        const startAvatarBox = document.getElementById('start-avatar-box');
        if (startAvatarBox) startAvatarBox.innerHTML = wyrenderujWnetrzeAvataru(zalogowanyUczen, 'text-xl sm:text-2xl');

        const odznakiKont = document.getElementById('start-odznaki-kontener');
        const odznakiLista = document.getElementById('start-odznaki-lista');
        const mojeOdznaki = pobierzTabliceOdznak(zalogowanyUczen);
        if (odznakiKont && odznakiLista) {
            if (mojeOdznaki.length > 0) {
                pokazEkran('start-odznaki-kontener', 'flex');
                odznakiLista.innerHTML = mojeOdznaki.map((odz, idx) => `
                    <div onclick="otworzSzczegolyOdznaki('${zalogowanyUid}', ${idx})" class="badge-chip">
                        <span class="text-base leading-none">${ucieczkaHtml(odz.ikona)}</span>
                        <span>${ucieczkaHtml(odz.tytul)}</span>
                    </div>
                `).join('');
            } else {
                ukryjEkran('start-odznaki-kontener');
            }
        }

        const i1L = i1.toLowerCase();
        const czyPrzedmiot = i1L.includes('dyrygentur') || i1L.includes('lutnictw') || i1L.includes('kompozycj');
        const lbl = document.getElementById('label-instr-1');
        if (lbl) lbl.innerText = czyPrzedmiot ? 'Przedmiot główny' : 'Główny instrument';

        document.getElementById('start-instr-1').innerText = i1;
        document.getElementById('start-instr-2').innerText = i2 ? i2 : 'Brak';
        
        const mk = document.getElementById('moj-kod-znajomego');
        const imgQr = document.getElementById('img-qr-kod');
        if(mk && imgQr) {
            const samKod = String(zalogowanyUczen.kod_znajomego || '123456789').replace(/\s/g, '');
            mk.innerText = samKod.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
            imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${samKod}&bgcolor=ffffff`;
        }
        przeliczStatusStreaka();
    } catch (e) { console.error("Błąd odświeżania profilu: ", e); }
}

// --- PODIUM TYGODNIA (TOP 5 + TWÓJ WYNIK NA DOLE NAWET GDY ODZNACZONE) ---
function pobierzPoniedzialekTygodniaStr() {
    const teraz = new Date();
    const dzien = teraz.getDay();
    const diff = teraz.getDate() - dzien + (dzien === 0 ? -6 : 1);
    const pon = new Date(teraz.getFullYear(), teraz.getMonth(), diff);
    return formatujDateYMD(pon) + ' 00:00:00';
}

function odswiezStatystykiTygodniowe() {
    const startTygodnia = pobierzPoniedzialekTygodniaStr();
    db.ref('statystyki_logi').orderByChild('czas').startAt(startTygodnia).once('value', snap => {
        const logi = snap.val() ? Object.values(snap.val()) : [];
        przeliczMinutyTygodnioweZLogow(logi);
    }).catch(() => {
        db.ref('statystyki_logi').limitToLast(1500).once('value', snap => {
            const all = snap.val() ? Object.values(snap.val()) : [];
            przeliczMinutyTygodnioweZLogow(all.filter(l => l.czas && l.czas >= startTygodnia));
        });
    });
}

function przeliczMinutyTygodnioweZLogow(logi) {
    const aktywne = {};
    const mapa = {};
    logi.forEach(l => {
        const ms = parsowacCzas(l.czas);
        if (l.akcja === 'WOLNA') {
            if (aktywne[l.sala] && !l.auto_reset && !(l.kto && l.kto.includes('automatyczny'))) {
                const dt = (ms - aktywne[l.sala].czas) / 60000;
                if (dt >= 1 && dt <= 480) {
                    const czysteImie = (aktywne[l.sala].kto || '').split('(')[0].trim();
                    if (czysteImie) mapa[czysteImie] = (mapa[czysteImie] || 0) + dt;
                }
            }
            delete aktywne[l.sala];
        } else if (l.akcja === 'ZAJĘTA') {
            aktywne[l.sala] = { czas: ms, kto: l.kto || '' };
        }
    });
    minutyTygodnioweMapa = mapa;
    renderujPodiumTygodnia();
}

function pobierzMinutyTygodnioweUcznia(daneUcznia) {
    if (!daneUcznia || !daneUcznia.imie_nazwisko) return 0;
    const imieNazw = daneUcznia.imie_nazwisko.trim();
    let zLogow = Math.round(minutyTygodnioweMapa[imieNazw] || 0);
    const dzisStr = formatujDateYMD(new Date());
    const dzisMin = (daneUcznia.ostatnia_aktywnosc === dzisStr) ? (Number(daneUcznia.dzisiejsze_minuty) || 0) : 0;
    return Math.max(zLogow, dzisMin);
}

function wyrenderujWierszPodiumHtml(item, miejsce, czyDolnyWiersz = false) {
    const isMe = (item.uid === zalogowanyUid);
    const nazwa = sformatujImieINazwiskoKropka(item.u.imie_nazwisko);
    const instr = item.u.instrument || '';
    
    const h = Math.floor(item.minuty / 60);
    const m = item.minuty % 60;
    const czasTxt = h > 0 ? `${h}h ${m}m` : `${m} min`;

    let znaczekMiejsca = miejsce
        ? `<span class="w-7 text-center text-xs font-extrabold text-zinc-500">#${miejsce}</span>`
        : `<span class="w-7 text-center text-xs font-extrabold text-indigo-300">Ty</span>`;
    let stylWiersza = isMe ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5 bg-zinc-900/40';

    if (miejsce === 1) {
        znaczekMiejsca = `<span class="w-7 text-center text-base leading-none">🥇</span>`;
        if (!isMe) stylWiersza = 'border-yellow-400/30 bg-yellow-500/5';
    } else if (miejsce === 2) {
        znaczekMiejsca = `<span class="w-7 text-center text-base leading-none">🥈</span>`;
        if (!isMe) stylWiersza = 'border-zinc-400/25 bg-zinc-800/40';
    } else if (miejsce === 3) {
        znaczekMiejsca = `<span class="w-7 text-center text-base leading-none">🥉</span>`;
        if (!isMe) stylWiersza = 'border-amber-600/25 bg-amber-950/20';
    }

    const dopisekPoza = (!miejsce && czyDolnyWiersz) ? ' • poza tabelą' : '';

    return `
    <div class="px-3.5 py-2.5 rounded-xl border ${stylWiersza} flex items-center justify-between gap-3 transition-colors">
        <div class="flex items-center gap-3 min-w-0">
            ${znaczekMiejsca}
            <div class="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-[11px] font-bold text-white">
                ${wyrenderujWnetrzeAvataru(item.u, 'text-[11px]')}
            </div>
            <div class="flex items-center gap-2 min-w-0 flex-wrap">
                <span class="text-xs sm:text-sm font-bold ${isMe ? 'text-indigo-300' : 'text-white'}">${ucieczkaHtml(nazwa)}${isMe ? ' (Ty)' : ''}${dopisekPoza}</span>
                ${instr ? `<span class="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 hidden sm:inline-block">${ucieczkaHtml(instr)}</span>` : ''}
            </div>
        </div>
        <span class="text-xs font-black text-emerald-300 shrink-0">${czasTxt}</span>
    </div>`;
}

function renderujPodiumTygodnia() {
    const kon = document.getElementById('podium-tygodnia-render');
    if (!kon) return;

    const kandydaci = [];
    Object.entries(pelnaBazaUczniow).forEach(([uid, u]) => {
        if (!u || !u.imie_nazwisko) return;
        const zgoda = u.ustawienia_prywatnosci && u.ustawienia_prywatnosci.pokazuj_w_rankingu === true;
        if (!zgoda) return;
        const minuty = pobierzMinutyTygodnioweUcznia(u);
        kandydaci.push({ uid, u, minuty });
    });

    kandydaci.sort((a, b) => {
        if (b.minuty !== a.minuty) return b.minuty - a.minuty;
        return (Number(b.u.streak) || 0) - (Number(a.u.streak) || 0);
    });

    // Tylko TOP 5 osób na głównym podium
    const top5 = kandydaci.slice(0, 5);
    const czyJestemWTop5 = top5.some(k => k.uid === zalogowanyUid);
    const mojIndexWKandydatach = kandydaci.findIndex(k => k.uid === zalogowanyUid);
    const mojeMiejsce = mojIndexWKandydatach !== -1 ? (mojIndexWKandydatach + 1) : null;

    let html = '';
    if (top5.length === 0) {
        html += `<div class="text-xs text-zinc-500 text-center py-3">Brak osób w TOP 5. Możesz dołączyć do rankingu w ustawieniach prywatności.</div>`;
    } else {
        html += top5.map((item, idx) => wyrenderujWierszPodiumHtml(item, idx + 1, false)).join('');
    }

    // Jeśli nie ma nas w TOP 5 (bo mamy za mało minut lub wyłączoną zgodę na ranking) -> zawsze pokazujemy nasz wynik na samym dole
    if (!czyJestemWTop5 && zalogowanyUczen) {
        const mojeMinuty = pobierzMinutyTygodnioweUcznia(zalogowanyUczen);
        const mojObiekt = { uid: zalogowanyUid, u: zalogowanyUczen, minuty: mojeMinuty };
        html += `
            <div class="pt-2 mt-1 border-t border-dashed border-white/15 flex flex-col gap-1">
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">Twój czas w tym tygodniu</span>
                ${wyrenderujWierszPodiumHtml(mojObiekt, mojeMiejsce, true)}
            </div>
        `;
    }

    kon.innerHTML = html;
}

function uruchomWidokTablicy() {
    window.scrollTo(0, 0); 
    try {
        aktualizujTogglyPush();
        odswiezDaneProfiluUI(); 
        generujTabliceKlasyczna(); 
        renderujTabliceFizyczna(); 
        renderujUlubione();
        nasluchujZmianSal(); 
        nasluchujAnkietIPropozycji();
        odswiezStatystykiTygodniowe();

        db.ref('zamrozone_dni_szkoly').on('value', snap => {
            zamrozoneDniSzkoly = snap.val() || {};
            try { przeliczStatusStreaka(); } catch(e) {}
            try { renderujZamrozoneDniSzkolyPiotr(); } catch(e) {}
            if (!trwaAnimacjaZaczepki) { try { renderujZnajomych(); } catch(e) {} }
        });
        
        db.ref('uczniowie').on('value', snap => {
            pelnaBazaUczniow = snap.val() || {};
            if (zalogowanyUid && pelnaBazaUczniow[zalogowanyUid]) {
                zalogowanyUczen = pelnaBazaUczniow[zalogowanyUid];
                try { odswiezDaneProfiluUI(); } catch(e) {}
            }
            if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad') {
                if (typeof renderujAnkietyZarzadzanie === 'function') renderujAnkietyZarzadzanie();
                if (typeof renderujPropozycjeZarzadzanie === 'function') renderujPropozycjeZarzadzanie();
            }
            if (!trwaAnimacjaZaczepki) { try { renderujZnajomych(); } catch(e) {} }
            try { renderujPodiumTygodnia(); } catch(e) {}
            try {
                generujTabliceKlasyczna();
                if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna();
                ustawFiltr(aktywnyFiltr);
            } catch(e) {}
        });
        
        db.ref('znajomi/' + zalogowanyUid).on('value', snap => {
            mojeZnajomosci = snap.val() || { akceptowani: {}, zaproszenia: {}, zaproszenia_wyslane: {} };
            if (!trwaAnimacjaZaczepki) { try { renderujZnajomych(); } catch(e) {} }
            try {
                generujTabliceKlasyczna();
                if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna();
                ustawFiltr(aktywnyFiltr);
            } catch(e) {}
        });
        
        db.ref('zaczepki/' + zalogowanyUid).on('child_added', snap => {
            try {
                const data = snap.val();
                if (data && Date.now() - data.czas < 180000) { 
                    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
                    pokazOdebranaZaczepkeDuo(data);
                }
                snap.ref.remove();
            } catch (e) {}
        });

        setInterval(() => {
            if (!trwaAnimacjaZaczepki && aktywnaZakladkaId === 'znajomi') {
                try { renderujZnajomych(); } catch(e) {}
            }
        }, 30000);
    } catch (globalError) { console.error("Krytyczny błąd UI zignorowany:", globalError); }

    aktywnaZakladkaId = 'start';
    pokazEkran('ekran-glowny', 'flex');
}

window.zmienUstawieniePrywatnosci = function(pokazujSale) {
    if (!zalogowanyUid) return;
    if (!zalogowanyUczen.ustawienia_prywatnosci) zalogowanyUczen.ustawienia_prywatnosci = {};
    zalogowanyUczen.ustawienia_prywatnosci.pokazuj_sale = pokazujSale;
    db.ref('uczniowie/' + zalogowanyUid + '/ustawienia_prywatnosci/pokazuj_sale').set(pokazujSale).catch(e => pokazAlert("Błąd", e.message));
};

window.formatujInputKodu = function(el) {
    let val = el.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    let formated = '';
    for(let i=0; i<val.length; i++) {
        if(i > 0 && i % 3 === 0) formated += ' ';
        formated += val[i];
    }
    el.value = formated;
};

window.dodajZnajomegoPoKodie = function() {
    const input = document.getElementById('input-dodaj-znajomego');
    const wpisanyKod = input.value.replace(/\s/g, '');
    if (wpisanyKod.length !== 9) { pokazAlert("Błąd kodu", "Kod znajomego musi składać się dokładnie z 9 cyfr."); return; }
    if (wpisanyKod === String(zalogowanyUczen.kod_znajomego || '').replace(/\s/g, '')) { pokazAlert("Odrzucono", "Wpisałeś swój własny kod."); input.value = ''; return; }
    
    db.ref('uczniowie').once('value', snap => {
        const swiezaBaza = snap.val() || pelnaBazaUczniow;
        let znalezionyUid = null, znalezionyImie = null;
        for (const [uid, uData] of Object.entries(swiezaBaza)) {
            if (uData.kod_znajomego && String(uData.kod_znajomego).replace(/\s/g, '') === wpisanyKod) {
                znalezionyUid = uid; znalezionyImie = uData.imie_nazwisko; break;
            }
        }
        if (!znalezionyUid) { pokazAlert("Niepowodzenie", "Nie znaleziono osoby o takim kodzie w bazie."); return; }
        if (mojeZnajomosci.akceptowani && mojeZnajomosci.akceptowani[znalezionyUid]) { pokazAlert("Już dodano", "Ta osoba już znajduje się na Twojej liście znajomych."); input.value = ''; return; }
        
        const updates = {};
        updates[`znajomi/${znalezionyUid}/zaproszenia/${zalogowanyUid}`] = Date.now();
        updates[`znajomi/${zalogowanyUid}/zaproszenia_wyslane/${znalezionyUid}`] = Date.now();
        db.ref().update(updates).then(() => {
            pokazAlert("Zaproszenie wysłane", `Wysłano zaproszenie do: ${znalezionyImie.split(' ')[0]}`);
            input.value = '';
        }).catch(() => { pokazAlert("Błąd Bazy Firebase", "Serwer odrzucił zaproszenie. Odśwież stronę i spróbuj ponownie."); });
    });
};

window.anulujWyslaneZaproszenie = function(odbiorcaUid) {
    const updates = {};
    updates[`znajomi/${odbiorcaUid}/zaproszenia/${zalogowanyUid}`] = null;
    updates[`znajomi/${zalogowanyUid}/zaproszenia_wyslane/${odbiorcaUid}`] = null;
    db.ref().update(updates);
};

let html5Qrcode = null;
window.otworzSkanerQR = function() {
    pokazEkran('modal-qr-skaner');
    if(!html5Qrcode) {
        html5Qrcode = new Html5Qrcode("qr-reader");
        html5Qrcode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                document.getElementById('input-dodaj-znajomego').value = decodedText;
                zamknijSkanerQR();
                window.formatujInputKodu(document.getElementById('input-dodaj-znajomego'));
            },
            () => { }
        ).catch(() => {
            pokazAlert("Błąd aparatu", "Nie udało się uruchomić aparatu. Sprawdź uprawnienia kamery w przeglądarce.");
            zamknijSkanerQR();
        });
    }
};

window.zamknijSkanerQR = function() {
    ukryjEkran('modal-qr-skaner');
    if(html5Qrcode) {
        try { html5Qrcode.stop().then(() => { html5Qrcode.clear(); }); } catch(e) {}
        html5Qrcode = null;
    }
};

window.odpowiedzNaZaproszenie = function(nadawcaUid, czyAkceptuje) {
    const t = Date.now();
    const updates = {};
    updates[`znajomi/${zalogowanyUid}/zaproszenia/${nadawcaUid}`] = null;
    updates[`znajomi/${nadawcaUid}/zaproszenia_wyslane/${zalogowanyUid}`] = null;
    if (czyAkceptuje) {
        updates[`znajomi/${zalogowanyUid}/akceptowani/${nadawcaUid}`] = t;
        updates[`znajomi/${nadawcaUid}/akceptowani/${zalogowanyUid}`] = t;
    }
    db.ref().update(updates).catch(err => pokazAlert("Błąd", err.message));
};

window.usunZnajomego = function(znajomyUid) {
    pokazConfirm("Usunięcie ze znajomych", "Czy na pewno chcesz usunąć tę osobę z listy znajomych?", () => {
        const updates = {};
        updates[`znajomi/${zalogowanyUid}/akceptowani/${znajomyUid}`] = null;
        updates[`znajomi/${znajomyUid}/akceptowani/${zalogowanyUid}`] = null;
        db.ref().update(updates);
    });
};

window.zmienSortowanieZnajomych = function(tryb) {
    sortowanieZnajomych = tryb;
    const bStreak = document.getElementById('sort-znajomi-streak');
    const bDzis = document.getElementById('sort-znajomi-dzis');
    if (bStreak && bDzis) {
        if (tryb === 'dzis') {
            bDzis.className = "px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-white transition-all";
            bStreak.className = "px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-all";
        } else {
            bStreak.className = "px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-white transition-all";
            bDzis.className = "px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-all";
        }
    }
    renderujZnajomych();
};

// --- WIZYTÓWKA ZNAJOMEGO (SAMA CYFRA LUB "BRAK", ODZNAKI + POJEDYNEK 1V1) ---
window.otworzProfilZnajomego = function(uid) {
    const u = pelnaBazaUczniow[uid];
    if (!u) return;

    const avBox = document.getElementById('znajomy-modal-avatar');
    if (avBox) avBox.innerHTML = wyrenderujWnetrzeAvataru(u, 'text-2xl');

    document.getElementById('znajomy-modal-imie').innerText = sformatujImieINazwiskoKropka(u.imie_nazwisko);
    document.getElementById('znajomy-modal-klasa').innerText = u.klasa ? `Klasa ${u.klasa}` : '-';

    const odznakiBox = document.getElementById('znajomy-modal-odznaki');
    const odznakiZn = pobierzTabliceOdznak(u);
    if (odznakiBox) {
        if (odznakiZn.length > 0) {
            pokazEkran('znajomy-modal-odznaki', 'flex');
            odznakiBox.innerHTML = odznakiZn.map((odz, idx) => `
                <div onclick="otworzSzczegolyOdznaki('${uid}', ${idx})" class="badge-chip">
                    <span class="text-sm leading-none">${ucieczkaHtml(odz.ikona)}</span>
                    <span>${ucieczkaHtml(odz.tytul)}</span>
                </div>
            `).join('');
        } else {
            ukryjEkran('znajomy-modal-odznaki');
        }
    }

    const dzis = new Date();
    dzis.setHours(0,0,0,0);
    const dzisStr = formatujDateYMD(dzis);
    const znStreak = Number(u.streak) || 0;
    const dzisMin = (u.ostatnia_aktywnosc === dzisStr) ? (Number(u.dzisiejsze_minuty) || 0) : 0;
    const czyZamrozonyZn = (u.ostatnia_aktywnosc !== dzisStr) && czyDzienJestZamrozonyDlaUcznia(dzisStr, u);

    const tierInfo = pobierzPoziomStreaka(znStreak, u.wymuszony_kolor_streaka, czyZamrozonyZn);
    const streakEl = document.getElementById('znajomy-modal-streak');
    if (znStreak > 0) {
        streakEl.className = `text-lg font-black ${tierInfo.textClass} mt-0.5 block`;
        streakEl.innerText = czyZamrozonyZn ? `${znStreak} ❄️` : String(znStreak);
    } else {
        streakEl.className = `text-sm font-bold text-zinc-500 mt-0.5 block`;
        streakEl.innerText = 'Brak';
    }

    document.getElementById('znajomy-modal-dzis').innerText = `${dzisMin} min`;

    const sameImie = (u.imie_nazwisko || 'Znajomy').split(' ')[0];
    const mojeMinTydz = pobierzMinutyTygodnioweUcznia(zalogowanyUczen);
    const jegoMinTydz = pobierzMinutyTygodnioweUcznia(u);
    const sumaTydz = mojeMinTydz + jegoMinTydz;
    const procJa = sumaTydz > 0 ? Math.max(8, Math.min(92, Math.round((mojeMinTydz / sumaTydz) * 100))) : 50;

    document.getElementById('duel-znajomy-imie').innerText = sameImie;
    document.getElementById('duel-moje-min').innerText = `${mojeMinTydz}m`;
    document.getElementById('duel-znajomy-min').innerText = `${jegoMinTydz}m`;
    document.getElementById('duel-bar-ja').style.width = `${procJa}%`;
    document.getElementById('duel-bar-on').style.width = `${100 - procJa}%`;

    const i1 = (u.instrument || '').trim();
    const i2 = (u.instrument2 || u.instrument_2 || u.drugi_instrument || '').trim();
    document.getElementById('znajomy-modal-instrumenty').innerText = [i1, i2].filter(Boolean).join(' • ') || '-';

    const ulub = u.ulubione ? Object.values(u.ulubione).filter(Boolean) : [];
    document.getElementById('znajomy-modal-ulubione').innerText = ulub.length > 0 ? ulub.join(', ') : 'Brak wybranych';

    const btnZaczep = document.getElementById('znajomy-modal-btn-zaczep');
    if (btnZaczep) {
        const tryb = (dzisMin > 0) ? 'brawa' : 'motywacja';
        btnZaczep.onclick = () => {
            zamknijProfilZnajomego();
            otworzModalDuoZaczepki(uid, sameImie, tryb);
        };
    }
    pokazEkran('modal-profil-znajomego');
};

window.zamknijProfilZnajomego = function() { ukryjEkran('modal-profil-znajomego'); };

// --- SYSTEM ZACZEPEK ---
function odtworzAnimacjeZaczepkiNaKafelku(uid, opcja, tryb) {
    const tile = document.getElementById('friend-tile-' + uid);
    const avatar = document.getElementById('friend-avatar-' + uid);
    const btn = document.getElementById('friend-poke-btn-' + uid);
    if (!tile) return;

    trwaAnimacjaZaczepki = true;
    const isBrawa = (tryb === 'brawa');
    const glowBorder = isBrawa ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)';
    const glowShadow = isBrawa ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)';
    const sweepColor = isBrawa ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)';
    const sparkColors = isBrawa ? ['#34d399', '#6ee7b7', '#818cf8'] : ['#fbbf24', '#f59e0b', '#fde68a'];

    tile.style.setProperty('--glow-border', glowBorder);
    tile.style.setProperty('--glow-shadow', glowShadow);
    tile.style.setProperty('--sweep-color', sweepColor);

    tile.classList.remove('friend-tile-nudge');
    void tile.offsetWidth;
    tile.classList.add('friend-tile-nudge');

    if (avatar) {
        avatar.style.setProperty('--glow-border', isBrawa ? 'rgba(16, 185, 129, 0.65)' : 'rgba(245, 158, 11, 0.65)');
        avatar.classList.remove('avatar-ripple-ring');
        void avatar.offsetWidth;
        avatar.classList.add('avatar-ripple-ring');
    }

    if (btn) {
        btn.innerHTML = `${opcja.ikona} Wysłano`;
        btn.className = "px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 text-xs font-bold transition-all duration-500";
    }

    const rect = tile.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const badge = document.createElement('div');
    badge.className = 'floating-nudge-badge';
    badge.style.left = `${centerX}px`;
    badge.style.top = `${rect.top + 8}px`;
    badge.innerHTML = `<span>${opcja.ikona}</span> <span>${ucieczkaHtml(opcja.tytul)}</span>`;
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 2150);

    const sparkOriginX = btn ? (btn.getBoundingClientRect().left + btn.getBoundingClientRect().width / 2) : centerX;
    const sparkOriginY = btn ? (btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2) : centerY;

    for (let i = 0; i < 10; i++) {
        const dot = document.createElement('div');
        dot.className = 'spark-dot';
        dot.style.backgroundColor = sparkColors[i % sparkColors.length];
        dot.style.left = `${sparkOriginX}px`;
        dot.style.top = `${sparkOriginY}px`;
        const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.3;
        const dist = 28 + Math.random() * 42;
        dot.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
        dot.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 1450);
    }

    setTimeout(() => {
        tile.classList.remove('friend-tile-nudge');
        if (avatar) avatar.classList.remove('avatar-ripple-ring');
        trwaAnimacjaZaczepki = false;
        renderujZnajomych();
    }, 2000);
}

window.otworzModalDuoZaczepki = function(uid, imie, tryb) {
    const pozostalyCzas = obliczPozostalyCzasZaczepki(uid);
    const isPiotr = zalogowanyUczen && zalogowanyUczen.imie_nazwisko.includes('Piotr Nowik');
    if (!isPiotr && pozostalyCzas) {
        pokazAlert("Limit zaczepek", `Kolejną zaczepkę do tej osoby możesz wysłać za ${pozostalyCzas}.`);
        return;
    }

    duoCelUid = uid; duoCelImie = imie; duoTryb = tryb || 'motywacja';
    const badge = document.getElementById('duo-modal-badge');
    const subtitle = document.getElementById('duo-modal-subtitle');
    const title = document.getElementById('duo-modal-title');
    const lista = document.getElementById('duo-opcje-lista');

    const opcje = (duoTryb === 'brawa') ? DUO_OPCJE_BRAWA : DUO_OPCJE_MOTYWACJI;
    duoWybranaOpcja = opcje[0];

    badge.innerText = duoWybranaOpcja.ikona;
    subtitle.innerText = (duoTryb === 'brawa') ? 'Aktywność' : 'Przypomnienie';
    title.innerText = `Wyślij do: ${imie}`;

    lista.innerHTML = opcje.map((op, idx) => `
        <div onclick="wybierzOpcjeDuo(${idx})" class="poke-card-option p-3.5 flex items-center gap-3.5 ${idx === 0 ? 'selected' : ''}">
            <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-lg shrink-0">${op.ikona}</div>
            <div class="text-xs sm:text-sm font-bold text-white leading-tight text-left">${ucieczkaHtml(op.tytul)}</div>
        </div>
    `).join('');

    pokazEkran('modal-duo-zaczepka');
};

window.wybierzOpcjeDuo = function(idx) {
    const opcje = (duoTryb === 'brawa') ? DUO_OPCJE_BRAWA : DUO_OPCJE_MOTYWACJI;
    if (!opcje[idx]) return;
    duoWybranaOpcja = opcje[idx];
    document.querySelectorAll('.poke-card-option').forEach((el, i) => {
        if (i === idx) el.classList.add('selected');
        else el.classList.remove('selected');
    });
    const badge = document.getElementById('duo-modal-badge');
    if (badge) badge.innerText = duoWybranaOpcja.ikona;
};

window.zamknijModalDuoZaczepki = function() { ukryjEkran('modal-duo-zaczepka'); };

window.potwierdzWyslanieDuoZaczepki = function() {
    if (!duoCelUid || !duoWybranaOpcja) return;
    const teraz = Date.now();
    const celUidKopia = duoCelUid;
    const wybranaOpcjaKopia = Object.assign({}, duoWybranaOpcja);
    const trybKopia = duoTryb;

    zamknijModalDuoZaczepki();
    localStorage.setItem('poke_' + celUidKopia, teraz.toString());

    setTimeout(() => { odtworzAnimacjeZaczepkiNaKafelku(celUidKopia, wybranaOpcjaKopia, trybKopia); }, 100);

    db.ref('zaczepki/' + celUidKopia).push({
        od: zalogowanyUczen.imie_nazwisko.split(' ')[0],
        od_uid: zalogowanyUid,
        czas: teraz,
        ikona: wybranaOpcjaKopia.ikona,
        naglowek: wybranaOpcjaKopia.tytul,
        typ: trybKopia
    }).catch(err => pokazAlert("Błąd bazy", err.message));
};

function pokazOdebranaZaczepkeDuo(data) {
    ostatniNadawcaZaczepkiUid = data.od_uid || null;
    ostatniNadawcaZaczepkiImie = data.od || 'Znajomy';
    document.getElementById('odebrana-ikona').innerText = data.ikona || '🔥';
    document.getElementById('odebrana-od-kogo').innerText = `Od: ${data.od || 'Znajomy'}`;
    document.getElementById('odebrana-naglowek').innerText = data.naglowek || 'Zaczepka';
    
    const trescEl = document.getElementById('odebrana-tresc');
    if (trescEl && trescEl.parentElement) {
        trescEl.parentElement.style.display = 'none';
    }

    const btnOdmachaj = document.getElementById('btn-odmachaj-duo');
    if (ostatniNadawcaZaczepkiUid) btnOdmachaj.classList.remove('hidden');
    else btnOdmachaj.classList.add('hidden');

    pokazEkran('modal-odebrana-zaczepka');
}

window.zamknijOdebranaZaczepke = function() { ukryjEkran('modal-odebrana-zaczepka'); };

window.odmachajZnajomemu = function() {
    const celUid = ostatniNadawcaZaczepkiUid;
    zamknijOdebranaZaczepke();
    if (celUid) {
        const mojeImie = zalogowanyUczen.imie_nazwisko.split(' ')[0];
        const opcjaOdmachania = { ikona: '👋', tytul: 'Odmachano!' };
        localStorage.setItem('poke_' + celUid, Date.now().toString());
        setTimeout(() => { odtworzAnimacjeZaczepkiNaKafelku(celUid, opcjaOdmachania, 'brawa'); }, 100);
        db.ref('zaczepki/' + celUid).push({
            od: mojeImie,
            od_uid: zalogowanyUid,
            czas: Date.now(),
            ikona: '👋',
            naglowek: `${mojeImie} odmachuje`,
            typ: 'brawa'
        });
    }
};

function renderujZnajomych() {
    const kontZaproszen = document.getElementById('kontener-zaproszen');
    const kontWyslanych = document.getElementById('kontener-zaproszen-wyslanych');
    const kontLista = document.getElementById('lista-znajomych-render');
    const licznik = document.getElementById('licznik-znajomych');
    const badgeZapr = document.getElementById('badge-zaproszenia-count');
    if (!kontLista) return;

    const zaproszenia = Object.keys(mojeZnajomosci.zaproszenia || {});
    if (zaproszenia.length > 0) {
        if(badgeZapr) { badgeZapr.innerText = zaproszenia.length; badgeZapr.classList.remove('hidden'); }
        kontZaproszen.innerHTML = zaproszenia.map(uId => {
            const daneUcznia = pelnaBazaUczniow[uId];
            if(!daneUcznia) return '';
            return `
            <div class="glass-panel p-4 flex justify-between items-center bg-indigo-900/20 border border-indigo-500/30 shadow-lg">
                <div>
                    <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Nowe Zaproszenie</span>
                    <span class="font-bold text-white text-sm">${ucieczkaHtml(sformatujImieINazwiskoKropka(daneUcznia.imie_nazwisko))}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="odpowiedzNaZaproszenie('${uId}', true)" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors">Akceptuj</button>
                    <button onclick="odpowiedzNaZaproszenie('${uId}', false)" class="w-8 h-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold text-xs transition-colors">✕</button>
                </div>
            </div>`;
        }).join('');
        pokazEkran('kontener-zaproszen', 'flex');
    } else {
        if(badgeZapr) badgeZapr.classList.add('hidden');
        ukryjEkran('kontener-zaproszen');
    }

    if (kontWyslanych) {
        const wyslane = Object.keys(mojeZnajomosci.zaproszenia_wyslane || {});
        if (wyslane.length > 0) {
            kontWyslanych.innerHTML = wyslane.map(uId => {
                const daneUcznia = pelnaBazaUczniow[uId];
                if (!daneUcznia) return '';
                return `
                <div class="px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-white/5 flex justify-between items-center text-xs">
                    <span class="text-zinc-400">Oczekujące zaproszenie: <strong class="text-zinc-200">${ucieczkaHtml(sformatujImieINazwiskoKropka(daneUcznia.imie_nazwisko))}</strong></span>
                    <button onclick="anulujWyslaneZaproszenie('${uId}')" class="text-[11px] font-bold text-zinc-500 hover:text-rose-400 transition-colors">Cofnij</button>
                </div>`;
            }).join('');
            pokazEkran('kontener-zaproszen-wyslanych', 'flex');
        } else { ukryjEkran('kontener-zaproszen-wyslanych'); }
    }

    const akceptowani = Object.keys(mojeZnajomosci.akceptowani || {});
    if (licznik) licznik.innerText = `${akceptowani.length} osób`;

    if (akceptowani.length === 0) {
        kontLista.innerHTML = `<p class="text-xs text-zinc-500 text-center py-6">Nie masz jeszcze żadnych znajomych na swojej liście.</p>`;
        return;
    }

    const dzis = new Date();
    dzis.setHours(0,0,0,0);
    const dzisStr = formatujDateYMD(dzis);
    const isPiotr = zalogowanyUczen && zalogowanyUczen.imie_nazwisko.includes('Piotr Nowik');
    let paczkiDoRenderu = [];
    
    akceptowani.forEach(uId => {
        const daneUcznia = pelnaBazaUczniow[uId];
        if(!daneUcznia) return;
        
        let obecnaSala = null, minutyWSaliTeraz = 0;
        for (const [nr, info] of Object.entries(pelneDaneSal)) {
            if (info && typeof info === 'object' && info.status === 'ZAJĘTA' && info.kto && info.kto.includes(daneUcznia.imie_nazwisko)) {
                obecnaSala = nr;
                if (info.czas) minutyWSaliTeraz = Math.max(1, Math.floor((Date.now() - parsowacCzas(info.czas)) / 60000));
                break;
            }
        }
        
        let znStreak = Number(daneUcznia.streak) || 0;
        const cwiczylDzisiaj = (daneUcznia.ostatnia_aktywnosc === dzisStr);
        let dzisMinuty = cwiczylDzisiaj ? (Number(daneUcznia.dzisiejsze_minuty) || 0) : 0;
        let pominiete = 0;

        if (daneUcznia.ostatnia_aktywnosc) {
            const p = daneUcznia.ostatnia_aktywnosc.split('-');
            if (p.length === 3) {
                const ostAkt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
                ostAkt.setHours(0,0,0,0);
                let wczoraj = new Date(dzis);
                wczoraj.setDate(wczoraj.getDate() - 1);
                if (ostAkt < wczoraj) pominiete = dniRoboczePomiedzy(ostAkt, wczoraj, daneUcznia);
            }
        }
        if (pominiete > 2) znStreak = 0;

        const czesciImienia = (daneUcznia.imie_nazwisko || 'Uczeń').split(' ');
        const sameImie = czesciImienia[0];
        // ZAWSZE Imię i 1 litera nazwiska (np. "Aleksandra K.")
        const imieNazwiskoKropka = sformatujImieINazwiskoKropka(daneUcznia.imie_nazwisko);
        const instr = daneUcznia.instrument || '';
        const pozostalyCzas = obliczPozostalyCzasZaczepki(uId);
        const czyZamrozonyDzis = !cwiczylDzisiaj && czyDzienJestZamrozonyDlaUcznia(dzisStr, daneUcznia);

        paczkiDoRenderu.push({
            uId, daneUcznia, sameImie, imieNazwiskoKropka, instr, obecnaSala, minutyWSaliTeraz,
            ukrywajSale: daneUcznia.ustawienia_prywatnosci ? daneUcznia.ustawienia_prywatnosci.pokazuj_sale === false : false,
            znStreak, pominiete, cwiczylDzisiaj, dzisMinuty, pozostalyCzas, czyZamrozonyDzis
        });
    });

    paczkiDoRenderu.sort((a, b) => {
        const aLive = a.obecnaSala ? 1 : 0;
        const bLive = b.obecnaSala ? 1 : 0;
        if (bLive !== aLive) return bLive - aLive;
        if (sortowanieZnajomych === 'dzis' && b.dzisMinuty !== a.dzisMinuty) return b.dzisMinuty - a.dzisMinuty;
        return b.znStreak - a.znStreak;
    });

    kontLista.innerHTML = paczkiDoRenderu.map(item => {
        let statusBadge = `<span class="flex items-center gap-1.5 text-xs text-zinc-500"><span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>Brak aktywności dzisiaj</span>`;
        let trybZaczepki = 'motywacja';
        let domyslnyPrzyciskKlasy = 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30';
        let domyslnyTekstPrzycisku = 'Zaczep 🔥';

        if (item.obecnaSala) {
            const czasSaliTxt = item.minutyWSaliTeraz > 0 ? ` • od ${item.minutyWSaliTeraz} min` : '';
            const tekstSali = item.ukrywajSale ? `Ćwiczy teraz (sala ukryta)${czasSaliTxt}` : `W sali ${item.obecnaSala}${czasSaliTxt}`;
            statusBadge = `<span class="flex items-center gap-1.5 text-xs font-bold text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>${tekstSali}</span>`;
            trybZaczepki = 'brawa';
            domyslnyPrzyciskKlasy = 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30';
            domyslnyTekstPrzycisku = 'Zaczep 👋';
        } else if (item.cwiczylDzisiaj) {
            statusBadge = `<span class="flex items-center gap-1.5 text-xs text-zinc-300"><span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Aktywny(a) dzisiaj${item.dzisMinuty > 0 ? ` • ${item.dzisMinuty} min` : ''}</span>`;
            trybZaczepki = 'brawa';
            domyslnyPrzyciskKlasy = 'btn-classic-secondary';
            domyslnyTekstPrzycisku = 'Zaczep 👋';
        } else if (item.czyZamrozonyDzis && item.znStreak > 0) {
            statusBadge = `<span class="flex items-center gap-1.5 text-xs text-sky-300"><span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>Płomyk zamrożony na dziś ❄️</span>`;
        } else if (item.pominiete > 0 && item.znStreak > 0) {
            statusBadge = `<span class="flex items-center gap-1.5 text-xs text-amber-400/90"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Seria zagrożona</span>`;
        }

        let actionBtn = '';
        if (item.pozostalyCzas) {
            if (isPiotr) {
                actionBtn = `<button id="friend-poke-btn-${item.uId}" onclick="otworzModalDuoZaczepki('${item.uId}', '${ucieczkaHtml(item.sameImie)}', '${trybZaczepki}')" class="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-semibold transition-all" title="Tryb testowy: możesz wysłać ponownie">⏳ ${item.pozostalyCzas}</button>`;
            } else {
                actionBtn = `<button id="friend-poke-btn-${item.uId}" disabled class="px-3 py-1.5 rounded-xl bg-zinc-900/80 text-zinc-500 border border-white/5 text-xs font-semibold cursor-default">⏳ ${item.pozostalyCzas}</button>`;
            }
        } else {
            actionBtn = `<button id="friend-poke-btn-${item.uId}" onclick="otworzModalDuoZaczepki('${item.uId}', '${ucieczkaHtml(item.sameImie)}', '${trybZaczepki}')" class="px-3 py-1.5 rounded-xl ${domyslnyPrzyciskKlasy} text-xs font-bold transition-all">${domyslnyTekstPrzycisku}</button>`;
        }

        const wymuszonyKolor = item.daneUcznia.wymuszony_kolor_streaka;
        const isInactive = (wymuszonyKolor === null || wymuszonyKolor === undefined) && !item.czyZamrozonyDzis && (item.pominiete > 0 || item.znStreak === 0);
        const tierInfo = pobierzPoziomStreaka(item.znStreak, wymuszonyKolor, item.czyZamrozonyDzis);
        const kolorLiczby = isInactive ? 'text-zinc-500' : tierInfo.textClass;

        // Gdy znStreak === 0 -> NIE POKAZUJEMY PŁOMYCZKA ANI CYFERKI
        const streakWizualny = (item.znStreak > 0 || (wymuszonyKolor !== null && wymuszonyKolor !== undefined))
            ? `<span class="inline-flex items-center gap-1 font-bold text-xs ${kolorLiczby} shrink-0">${generujMiniPlomykSvg(item.znStreak, isInactive, wymuszonyKolor, item.czyZamrozonyDzis)} ${item.znStreak}${item.czyZamrozonyDzis ? ' ❄️' : ''}</span>`
            : '';

        const odznakiZn = pobierzTabliceOdznak(item.daneUcznia).slice(0, 3);
        const odznakiHtml = odznakiZn.length > 0
            ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] shrink-0" title="${ucieczkaHtml(odznakiZn.map(o => o.tytul).join(', '))}">${odznakiZn.map(o => ucieczkaHtml(o.ikona)).join('')}</span>`
            : '';

        return `
        <div id="friend-tile-${item.uId}" class="flex items-center justify-between gap-2.5 p-3.5 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div onclick="otworzProfilZnajomego('${item.uId}')" class="flex items-center gap-3 min-w-0 relative z-10 cursor-pointer group">
                <div id="friend-avatar-${item.uId}" class="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-200 border border-white/10 shrink-0 overflow-hidden shadow-inner group-hover:border-indigo-400/50 transition-colors">
                    ${wyrenderujWnetrzeAvataru(item.daneUcznia, 'text-xs')}
                </div>
                <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-white group-hover:text-indigo-300 transition-colors text-sm whitespace-nowrap" id="nazwa-znajomego-${item.uId}">${ucieczkaHtml(item.imieNazwiskoKropka)}</span>
                        ${streakWizualny}
                        ${odznakiHtml}
                        ${item.instr ? `<span class="text-[10px] text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 hidden sm:inline-block">${ucieczkaHtml(item.instr)}</span>` : ''}
                    </div>
                    <div class="mt-0.5">${statusBadge}</div>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 relative z-10">
                ${actionBtn}
                <button onclick="usunZnajomego('${item.uId}')" class="text-[10px] text-zinc-500 hover:text-rose-400 font-bold px-1.5 py-1 uppercase tracking-wider transition-colors">Usuń</button>
            </div>
        </div>`;
    }).join('');
}

function renderujZgodyUcznia() {
    const kon = document.getElementById('start-lista-zgod'); 
    if (!kon) return;
    if (zalogowanyUczen && (zalogowanyUczen.rola === 'nauczyciel' || zalogowanyUczen.rola === 'pracownik' || zalogowanyUczen.rola === 'administracja' || zalogowanyUczen.rola === 'obsluga')) {
        kon.innerHTML = '<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1"><span class="font-bold text-emerald-300">Nielimitowany dostęp</span><span class="text-xs text-zinc-300">Jako pracownik szkoły masz stały, nielimitowany dostęp do wszystkich sal.</span></div>';
        return;
    }
    const zgody = Object.values(wszystkieZgody).filter(z => z && z.uid === zalogowanyUid);
    if (zgody.length === 0) { kon.innerHTML = '<div class="text-xs text-zinc-500 py-2">Brak dodatkowych zgód weekendowych.</div>'; return; }
    kon.innerHTML = zgody.map(z => {
        const ter = z.typ === 'miesiac' 
            ? `Cały miesiąc ${ucieczkaHtml(z.miesiac)} (${z.dni_miesiaca === 'sobota' ? 'Soboty' : (z.dni_miesiaca === 'niedziela' ? 'Niedziele' : 'Soboty i Niedziele')})`
            : ucieczkaHtml([z.data_sobota ? 'Sobota '+z.data_sobota : null, z.data_niedziela ? 'Niedziela '+z.data_niedziela : null].filter(Boolean).join(' oraz '));
        return `<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <div class="text-xs font-bold text-emerald-300">${ter}</div>
                <div class="text-[11px] text-zinc-300 mt-0.5">Godziny: Sob <b>${ucieczkaHtml(z.sob_od)}–${ucieczkaHtml(z.sob_do)}</b> • Ndz <b>${ucieczkaHtml(z.ndz_od)}–${ucieczkaHtml(z.ndz_do)}</b></div>
            </div>
            <span class="emblem emblem-emerald shrink-0">Aktywna</span>
        </div>`;
    }).join('');
}

function renderujWidokStart() {
    const kon = document.getElementById('start-lista-powiadomien');
    const elWolne = document.getElementById('start-wolne-liczba');
    if (elWolne) {
        let wCount = 0;
        wszystkieSale.forEach(nr => { if (!aktualneStatusy[nr] || aktualneStatusy[nr] === 'WOLNA') wCount++; });
        elWolne.innerText = wCount;
    }
    if (!kon) return;

    const lastAnkiety = localStorage.getItem('posm_last_seen_ankiety') || "2000-01-01 00:00";
    const lastPropozycje = localStorage.getItem('posm_last_seen_propozycje') || "2000-01-01 00:00";
    let pow = [];

    Object.values(wszystkieAnkiety).forEach(a => {
        if (a.aktywna !== false && (!a.glosy || a.glosy[zalogowanyUid] === undefined)) {
            if ((a.czas || "2000-01-01 00:00") > lastAnkiety) {
                pow.push({ czas: a.czas, typ: 'Nowe głosowanie', emblem: 'emblem-indigo', tytul: a.tytul, opis: 'Trwa nowa ankieta Samorządu.', akcja: "przelaczZakladkeUcznia('glosowania')" });
            }
        }
    });

    Object.entries(wszystkiePropozycje).forEach(([id, p]) => {
        if (!p.glosy || p.glosy[zalogowanyUid] === undefined) {
            if ((p.czas || "2000-01-01 00:00") > lastPropozycje) {
                pow.push({ czas: p.czas, typ: p.odpowiedz_admina ? 'Odpowiedź Samorządu' : 'Propozycja ucznia', emblem: p.odpowiedz_admina ? 'emblem-emerald' : 'emblem-amber', tytul: p.tytul, opis: p.odpowiedz_admina || p.opis, akcja: "przelaczZakladkeUcznia('propozycje')" });
            }
        }
    });
    
    const dzisiaj = new Date();
    const dzienMiesiaca = dzisiaj.getDate();
    if (dzienMiesiaca >= 1 && dzienMiesiaca <= 3) {
        let pmM = dzisiaj.getMonth(); 
        let pmY = dzisiaj.getFullYear();
        if (pmM === 0) { pmM = 12; pmY--; }
        const popMiesiacStr = `${pmY}-${String(pmM).padStart(2, '0')}`;
        pow.push({
            czas: terazDataString(),
            typ: 'Podsumowanie Miesiąca',
            emblem: 'emblem-purple',
            tytul: 'Twoje Solna Wrapped',
            opis: 'Statystyki z ubiegłego miesiąca są gotowe! Otwórz podsumowanie.',
            akcja: `uruchomWrapped('${popMiesiacStr}', this)`
        });
    }

    pow.sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (pow.length === 0) { kon.innerHTML = '<div class="text-xs text-zinc-500 py-4 text-center">Brak nowych aktualności. Jesteś na bieżąco!</div>'; return; }
    kon.innerHTML = pow.map(i => `<div onclick="${i.akcja}" class="cursor-pointer p-4 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"><div><div class="flex items-center gap-2 mb-1"><span class="emblem ${i.emblem}">${ucieczkaHtml(i.typ)}</span><h4 class="font-bold text-white text-sm">${ucieczkaHtml(i.tytul)}</h4></div><p class="text-xs text-zinc-400 line-clamp-2">${ucieczkaHtml(i.opis)}</p></div><span class="text-xs font-bold text-indigo-400 shrink-0">Otwórz &rarr;</span></div>`).join('');
}

function nasluchujAnkietIPropozycji() {
    db.ref('samorzad_ankiety').on('value', snap => { 
        wszystkieAnkiety = snap.val() || {}; 
        renderujAnkietyUcznia(); 
        renderujWidokStart();
        if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad' && typeof renderujAnkietyZarzadzanie === 'function') renderujAnkietyZarzadzanie();
    });
    db.ref('samorzad_propozycje').on('value', snap => { 
        wszystkiePropozycje = snap.val() || {}; 
        renderujPropozycjeUcznia(); 
        renderujWidokStart();
        if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad' && typeof renderujPropozycjeZarzadzanie === 'function') renderujPropozycjeZarzadzanie();
    });
    db.ref('zgody_weekendowe').on('value', snap => { 
        wszystkieZgody = snap.val() || {}; 
        renderujZgodyUcznia(); 
    });
}

function renderujAnkietyUcznia() {
    const kon = document.getElementById('lista-ankiet-uczen');
    const b = document.getElementById('badge-ankiety-count'); 
    if (!kon) return;
    
    const lista = Object.entries(wszystkieAnkiety).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    const aktNie = lista.filter(a => a.aktywna !== false && (!a.glosy || a.glosy[zalogowanyUid] === undefined)).length;
    
    if (aktNie > 0) { b.innerText = aktNie; b.classList.remove('hidden'); } else b.classList.add('hidden');
    if (lista.length === 0) { kon.innerHTML = '<div class="glass-panel p-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-wider">Brak aktywnych głosowań</div>'; return; }

    kon.innerHTML = lista.map(ank => {
        const opc = Array.isArray(ank.opcje) ? ank.opcje : [], glosy = ank.glosy || {}, mG = glosy[zalogowanyUid], czyAkt = ank.aktywna !== false;
        const licz = opc.map(() => 0); let sum = 0;
        Object.values(glosy).forEach(idx => { if (licz[idx] !== undefined) { licz[idx]++; sum++; } });
        
        let opHtml = opc.map((t, idx) => {
            const ile = licz[idx] || 0, p = sum > 0 ? Math.round((ile / sum) * 100) : 0, czW = (mG === idx);
            if (mG !== undefined || !czyAkt) {
                return `<div class="relative overflow-hidden rounded-xl border ${czW ? 'border-indigo-500 bg-indigo-500/15' : 'border-white/10 bg-zinc-900/60'} p-3.5 mb-2.5"><div class="absolute inset-y-0 left-0 bg-indigo-500/25 transition-all duration-500" style="width: ${p}%;"></div><div class="relative flex justify-between items-center text-xs sm:text-sm gap-2"><span class="font-semibold text-white flex items-center gap-2 flex-wrap">${ucieczkaHtml(t)}${czW ? '<span class="emblem emblem-indigo">Twój głos</span>' : ''}</span><span class="font-bold text-indigo-300 shrink-0">${p}% (${ile})</span></div></div>`;
            }
            return `<button onclick="oddajGlosWAnkiecie('${ank.id}', ${idx})" class="w-full text-left rounded-xl border border-white/10 hover:border-indigo-500 bg-zinc-900/70 hover:bg-indigo-500/10 p-3.5 mb-2.5 transition-all flex justify-between items-center text-xs sm:text-sm font-semibold text-white"><span>${ucieczkaHtml(t)}</span><span class="emblem emblem-indigo shrink-0">Zagłosuj</span></button>`;
        }).join('');
        
        return `<div class="glass-panel p-5 sm:p-7"><div class="flex justify-between items-start gap-3 mb-2"><h3 class="text-base sm:text-lg font-bold text-white">${ucieczkaHtml(ank.tytul)}</h3>${czyAkt ? '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Aktywne</span>' : '<span class="emblem emblem-rose">Zakończone</span>'}</div>${ank.opis ? `<p class="text-xs sm:text-sm text-zinc-300 mb-4">${ucieczkaHtml(ank.opis)}</p>` : ''}<div class="mt-3">${opHtml}</div><div class="flex justify-between items-center text-[11px] text-zinc-400 mt-4 pt-3 border-t border-white/10"><span>Oddanych głosów: <b class="text-white">${sum}</b></span><span>${ank.czas || '-'}</span></div></div>`;
    }).join('');
}

window.oddajGlosWAnkiecie = (id, idx) => {
    if (!zalogowanyUid) return;
    const a = wszystkieAnkiety[id]; 
    if (!a || a.aktywna === false || (a.glosy && a.glosy[zalogowanyUid] !== undefined)) return;
    db.ref(`samorzad_ankiety/${id}/glosy/${zalogowanyUid}`).transaction(curr => curr === null ? idx : undefined);
};

window.otworzModalNowejPropozycji = () => { pokazEkran('modal-nowa-propozycja'); };
window.zamknijModalNowejPropozycji = () => { ukryjEkran('modal-nowa-propozycja'); };

window.dodajPropozycje = () => {
    const t = document.getElementById('prop-tytul').value.trim(), o = document.getElementById('prop-opis').value.trim(), a = document.getElementById('prop-anonim').checked;
    if (t.length < 4 || o.length < 6) { pokazAlert("Uwaga", "Wprowadź sensowny tytuł i treść."); return; }
    db.ref('samorzad_propozycje').push({ 
        tytul: t, opis: o, anonim: a, 
        autor_prawdziwy: `${zalogowanyUczen.imie_nazwisko} (${zalogowanyUczen.klasa || '-'})`, 
        autor_uid: zalogowanyUid, czas: terazDataString(), status: 'Nowa', odpowiedz_admina: '' 
    }).then(() => {
        document.getElementById('prop-tytul').value = ''; 
        document.getElementById('prop-opis').value = ''; 
        document.getElementById('prop-anonim').checked = false; 
        zamknijModalNowejPropozycji();
    });
};

window.glosujNaPropozycje = (id, typ) => {
    if (!zalogowanyUid) return;
    const p = wszystkiePropozycje[id]; 
    if (!p || (p.glosy && p.glosy[zalogowanyUid] !== undefined)) return;
    db.ref(`samorzad_propozycje/${id}/glosy/${zalogowanyUid}`).transaction(c => c === null ? typ : undefined);
};

window.toggleKomentarze = function(id) {
    if (otwarteKomentarze.has(id)) otwarteKomentarze.delete(id);
    else otwarteKomentarze.add(id);
    renderujPropozycjeUcznia();
};

window.wyslijKomentarz = function(id) {
    const el = document.getElementById('komentarz-input-' + id);
    const txt = el.value.trim();
    if (!txt) return;
    const kom = {
        autor: zalogowanyUczen.imie_nazwisko + ' (' + (zalogowanyUczen.klasa || '-') + ')',
        uid: zalogowanyUid,
        tresc: txt,
        czas: terazDataString()
    };
    db.ref(`samorzad_propozycje/${id}/komentarze`).push(kom).then(() => { el.value = ''; });
};

function renderujPropozycjeUcznia() {
    const kon = document.getElementById('lista-propozycji-uczen'); 
    if (!kon) return;
    const lista = Object.entries(wszystkiePropozycje).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<div class="glass-panel p-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-wider">Brak propozycji</div>'; return; }

    kon.innerHTML = lista.map(p => {
        const g = p.glosy || {}; let za = 0, pr = 0;
        Object.values(g).forEach(v => { if (v === 'za') za++; else if (v === 'przeciw') pr++; });
        const mG = g[zalogowanyUid], jG = mG !== undefined, st = p.status || 'Nowa';
        const em = st === 'Zaakceptowana' || st === 'W realizacji' ? 'emblem-emerald' : (st === 'Odrzucona' ? 'emblem-rose' : 'emblem-amber');
        const sZ = mG === 'za' ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg cursor-default' : (jG ? 'bg-zinc-900/50 text-zinc-500 cursor-not-allowed border-white/5' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25');
        const sP = mG === 'przeciw' ? 'bg-rose-500 text-white border-rose-400 shadow-lg cursor-default' : (jG ? 'bg-zinc-900/50 text-zinc-500 cursor-not-allowed border-white/5' : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25');
        const komentyObj = p.komentarze ? Object.values(p.komentarze) : [];
        const isKomentyOpen = otwarteKomentarze.has(p.id);

        return `
        <div class="glass-panel p-5 sm:p-7 flex flex-col gap-3">
            <div class="flex justify-between items-center pb-3 border-b border-white/10">
                <div class="flex items-center gap-2.5">
                    ${p.anonim 
                        ? '<span class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">A</span><span class="text-sm font-bold text-indigo-300">Anonim</span>' 
                        : `<span class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold">${p.autor_prawdziwy.charAt(0)}</span><span class="text-sm font-bold text-white">${ucieczkaHtml(p.autor_prawdziwy)}</span>`
                    }
                </div>
                <div class="text-right flex flex-col items-end">
                    <span class="emblem ${em} mb-1 block w-max">${ucieczkaHtml(st)}</span>
                    <span class="text-[10px] text-zinc-500">${p.czas || '-'}</span>
                </div>
            </div>
            <div>
                <h3 class="text-lg font-bold text-white mb-2">${ucieczkaHtml(p.tytul)}</h3>
                <p class="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">${ucieczkaHtml(p.opis)}</p>
            </div>
            ${p.odpowiedz_admina ? `
            <div class="mt-2 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 relative">
                <div class="absolute -top-2.5 left-4 px-2 bg-[#090d16] text-[10px] font-bold text-indigo-400 uppercase">Odpowiedź Samorządu</div>
                <p class="text-sm text-indigo-100 mt-1.5">${ucieczkaHtml(p.odpowiedz_admina)}</p>
            </div>` : ''}
            <div class="flex flex-wrap justify-between items-center gap-3 mt-2 pt-3 border-t border-white/10">
                <div class="flex items-center gap-2">
                    <button ${jG ? 'disabled' : `onclick="glosujNaPropozycje('${p.id}', 'za')"`} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sZ}"><span>👍</span> <span>${za}</span></button>
                    <button ${jG ? 'disabled' : `onclick="glosujNaPropozycje('${p.id}', 'przeciw')"`} class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${sP}"><span>👎</span> <span>${pr}</span></button>
                </div>
                <button onclick="toggleKomentarze('${p.id}')" class="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    💬 Komentarze (${komentyObj.length})
                </button>
            </div>
            ${isKomentyOpen ? `
            <div class="mt-2 flex flex-col gap-2.5 pt-3 border-t border-white/5 animate-fade-in">
                <div class="max-h-[250px] overflow-y-auto no-scrollbar flex flex-col gap-2 pr-1">
                    ${komentyObj.length > 0 ? komentyObj.map(k => `
                        <div class="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-xs">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-emerald-300">${ucieczkaHtml(k.autor)}</span>
                                <span class="text-[9px] text-zinc-500">${k.czas}</span>
                            </div>
                            <p class="text-zinc-200 mt-1">${ucieczkaHtml(k.tresc)}</p>
                        </div>
                    `).join('') : '<p class="text-xs text-zinc-500 italic text-center py-2">Brak komentarzy. Bądź pierwszy!</p>'}
                </div>
                <div class="flex gap-2 mt-1">
                    <input type="text" id="komentarz-input-${p.id}" onkeypress="if(event.key === 'Enter') wyslijKomentarz('${p.id}')" placeholder="Napisz komentarz..." class="input-classic flex-grow rounded-xl px-3 py-2 text-xs">
                    <button onclick="wyslijKomentarz('${p.id}')" class="btn-classic-primary px-4 py-2 rounded-xl text-xs font-bold">Wyślij</button>
                </div>
            </div>` : ''}
        </div>`;
    }).join('');
}

// --- TABLICA SAL Z AWATARAMI ZNAJOMYCH ---
function znajdzZnajomegoWSali(nr) {
    const dane = pelneDaneSal[nr];
    if (!dane || typeof dane !== 'object' || dane.status !== 'ZAJĘTA' || !dane.kto) return null;
    const akceptowani = Object.keys(mojeZnajomosci.akceptowani || {});
    for (const uId of akceptowani) {
        const u = pelnaBazaUczniow[uId];
        if (u && u.imie_nazwisko && dane.kto.includes(u.imie_nazwisko)) {
            const ukrywaj = u.ustawienia_prywatnosci && u.ustawienia_prywatnosci.pokazuj_sale === false;
            if (!ukrywaj) return { uid: uId, uczen: u, czas: dane.czas };
        }
    }
    return null;
}

function generujTabliceKlasyczna() {
    wypelnijGrupe('grid-IIst', saleIIst, 'IIst'); wypelnijGrupe('grid-Ist', saleIst, 'Ist');
    wypelnijGrupe('grid-jazz', saleJazz, 'jazz'); wypelnijGrupe('grid-inne', saleInne, 'inne');
}

function wypelnijGrupe(id, lista, kat) {
    const kon = document.getElementById(id); if (!kon) return;
    kon.innerHTML = lista.map(nr => `<div id="sala-${nr}" onclick="otworzModalSali('${nr}')" data-kategoria="${kat}" data-fortepian="${saleFortepian.includes(nr)}" class="${klasyKafelkaWgStatusu(aktualneStatusy[nr] || 'WOLNA')}">${wnetrzeKafelka(nr)}</div>`).join('');
}

function klasyKafelkaWgStatusu(status) {
    const base = "relative flex items-center justify-center p-2.5 h-14 sm:h-16 rounded-2xl font-bold text-sm sm:text-base cursor-pointer hover:scale-105 transition-all border shadow-sm ";
    if (status === 'ZAJĘTA') return base + "bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25";
    if (status === 'ZABLOKOWANA') return base + "bg-purple-500/15 border-purple-500/35 text-purple-300 hover:bg-purple-500/25";
    return base + "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25";
}

function wnetrzeKafelka(nr) {
    const dane = pelneDaneSal[nr];
    const kto = dane && typeof dane === 'object' ? dane.kto || '' : '';
    const isTeacher = kto.toLowerCase().includes('nauczyciel') || kto.toLowerCase().includes('pracownik');
    const znajomy = znajdzZnajomegoWSali(nr);

    let sN = nr;
    if (nr === 'Koncertowa') sN = 'KON'; 
    else if (nr === 'Kameralna') sN = 'KAM'; 
    else if (nr === 'Lustrzana') sN = 'LUS'; 
    else if (nr === 'Kryształowa') sN = 'KRY';
    
    let wnetrze = '';
    if (ulubioneSale.includes(nr)) wnetrze += '<span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-sm"></span>';
    if (isTeacher) wnetrze += '<span class="absolute top-1.5 left-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white shadow-sm animate-pulse" title="Pracownik szkoły"></span>';
    if (znajomy) {
        const imieZn = znajomy.uczen.imie_nazwisko.split(' ')[0];
        wnetrze += `<div class="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-zinc-900 border border-indigo-400 text-white text-[8px] font-black flex items-center justify-center overflow-hidden shadow-md" title="W sali: ${ucieczkaHtml(imieZn)}">${wyrenderujWnetrzeAvataru(znajomy.uczen, 'text-[8px]')}</div>`;
    }
    wnetrze += `<span>${sN}</span>`;
    return wnetrze;
}

window.zmienWizualizacje = function(typ) {
    obecnaWizualizacja = typ;
    const bK = document.getElementById('btn-wiz-klasyczna'), bF = document.getElementById('btn-wiz-fizyczna');
    if (typ === 'fizyczna') {
        bK.className = "px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/2 md:w-auto text-center";
        bF.className = "px-4 py-2 rounded-lg text-xs font-bold bg-white/10 text-white transition-all w-1/2 md:w-auto text-center";
        ukryjEkran('kontener-klasyczny'); pokazEkran('kontener-fizyczny');
        renderujTabliceFizyczna();
    } else {
        bF.className = "px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-1/2 md:w-auto text-center";
        bK.className = "px-4 py-2 rounded-lg text-xs font-bold bg-white/10 text-white transition-all w-1/2 md:w-auto text-center";
        ukryjEkran('kontener-fizyczny'); pokazEkran('kontener-klasyczny');
    }
};

function renderujTabliceFizyczna() {
    const grid = document.getElementById('grid-fizyczny'); if (!grid) return;
    grid.innerHTML = '';
    UKLAD_TABLICY.forEach(rzad => {
        rzad.forEach(nr => {
            if (!nr) { grid.innerHTML += '<div class="h-10 sm:h-12 rounded-lg bg-transparent"></div>'; }
            else {
                const st = aktualneStatusy[nr] || 'WOLNA';
                let k = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25';
                if (st === 'ZAJĘTA') k = 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25';
                else if (st === 'ZABLOKOWANA') k = 'bg-purple-500/15 border-purple-500/35 text-purple-300 hover:bg-purple-500/25';
                let sN = nr;
                if(nr === 'Koncertowa') sN = 'KON'; else if(nr === 'Kameralna') sN = 'KAM'; else if(nr === 'Lustrzana') sN = 'LUS'; else if(nr === 'Kryształowa') sN = 'KRY';
                
                let wnetrze = '';
                if (ulubioneSale.includes(nr)) wnetrze += '<span class="absolute top-1.5 right-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400 shadow-sm"></span>';
                const kto = (pelneDaneSal[nr] && pelneDaneSal[nr].kto) ? pelneDaneSal[nr].kto.toLowerCase() : '';
                if (kto.includes('nauczyciel') || kto.includes('pracownik')) wnetrze += '<span class="absolute top-1.5 left-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shadow-sm animate-pulse"></span>';
                const znajomy = znajdzZnajomegoWSali(nr);
                if (znajomy) {
                    wnetrze += `<div class="absolute bottom-0.5 right-0.5 w-4 h-4 rounded bg-zinc-900 border border-indigo-400 text-white text-[7px] font-black flex items-center justify-center overflow-hidden shadow-sm">${wyrenderujWnetrzeAvataru(znajomy.uczen, 'text-[7px]')}</div>`;
                }
                wnetrze += `<span>${sN}</span>`;
                grid.innerHTML += `<div onclick="otworzModalSali('${nr}')" class="relative cursor-pointer flex items-center justify-center h-10 sm:h-12 rounded-lg border ${k} text-[11px] sm:text-xs font-bold transition-all hover:scale-105 shadow-sm">${wnetrze}</div>`;
            }
        });
    });
}

function renderujUlubione() {
    const sek = document.getElementById('sekcja-ulubione'), grid = document.getElementById('grid-ulubione');
    if (!sek || !grid) return;
    if (ulubioneSale.length === 0) { ukryjEkran('sekcja-ulubione'); return; }
    pokazEkran('sekcja-ulubione', 'block'); 
    grid.innerHTML = ulubioneSale.map(nr => `<div id="ulub-sala-${nr}" onclick="otworzModalSali('${nr}')" class="${klasyKafelkaWgStatusu(aktualneStatusy[nr] || 'WOLNA')}">${wnetrzeKafelka(nr)}</div>`).join('');
}

window.ustawFiltr = function(filtr) {
    aktywnyFiltr = filtr;
    document.querySelectorAll('.filtr-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + filtr)?.classList.add('active');
    wszystkieSale.forEach(nr => {
        const k = document.getElementById('sala-' + nr); if (!k) return;
        const st = aktualneStatusy[nr] || 'WOLNA', maF = k.dataset.fortepian === "true";
        if (filtr === 'wszystkie' || (filtr === 'wolne' && st === 'WOLNA') || (filtr === 'fortepian' && maF)) k.classList.remove('ukryta');
        else k.classList.add('ukryta');
    });
};

function nasluchujZmianSal() {
    db.ref('sale_aktualne').on('value', snap => {
        const dane = snap.val() || {};
        pelneDaneSal = dane;
        wszystkieSale.forEach(nr => {
            const dS = dane[nr], st = (typeof dS === 'string') ? dS : (dS && dS.status ? dS.status : 'WOLNA');
            aktualneStatusy[nr] = st; 
            const k = document.getElementById('sala-' + nr);
            if(k) {
                const czyU = k.classList.contains('ukryta');
                k.className = klasyKafelkaWgStatusu(st); k.innerHTML = wnetrzeKafelka(nr);
                if (czyU) k.classList.add('ukryta');
            }
        });
        if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna();
        renderujUlubione(); ustawFiltr(aktywnyFiltr); renderujWidokStart();
        odswiezStatystykiTygodniowe();
        if (!trwaAnimacjaZaczepki) { try { renderujZnajomych(); } catch(e) {} }
    });
}

window.otworzModalSali = function(nr) {
    wybranaSalaModal = nr;
    document.getElementById('akcja-sala-nr').innerText = nr;
    document.getElementById('opis-usterki-input').value = '';
    const st = aktualneStatusy[nr] || 'WOLNA', sEl = document.getElementById('akcja-sala-status');
    
    if (st === 'WOLNA') sEl.innerHTML = '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Wolna</span>';
    else if (st === 'ZAJĘTA') sEl.innerHTML = '<span class="emblem emblem-rose"><span class="status-dot dot-rose"></span>Zajęta</span>';
    else sEl.innerHTML = `<span class="emblem emblem-purple"><span class="status-dot dot-purple"></span>${ucieczkaHtml((pelneDaneSal[nr] && pelneDaneSal[nr].kto) ? pelneDaneSal[nr].kto : 'Blokada')}</span>`;
    
    const znBox = document.getElementById('akcja-sala-znajomy-box');
    const znajomy = znajdzZnajomegoWSali(nr);
    if (znBox) {
        if (znajomy) {
            const minuty = znajomy.czas ? Math.max(1, Math.floor((Date.now() - parsowacCzas(znajomy.czas)) / 60000)) : 0;
            pokazEkran('akcja-sala-znajomy-box', 'flex');
            znBox.innerHTML = `
                <div class="w-9 h-9 rounded-xl bg-zinc-900 border border-indigo-400/50 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-white">
                    ${wyrenderujWnetrzeAvataru(znajomy.uczen, 'text-xs')}
                </div>
                <div class="flex-grow min-w-0">
                    <span class="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Twój znajomy w sali</span>
                    <span class="text-xs font-bold text-white truncate block">${ucieczkaHtml(sformatujImieINazwiskoKropka(znajomy.uczen.imie_nazwisko))}${minuty > 0 ? ` • od ${minuty} min` : ''}</span>
                </div>
                <button type="button" onclick="zamknijModalSali(); otworzProfilZnajomego('${znajomy.uid}')" class="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-xs font-bold shrink-0">Profil</button>
            `;
        } else {
            ukryjEkran('akcja-sala-znajomy-box');
        }
    }

    const b = document.getElementById('btn-toggle-ulubiona');
    if (ulubioneSale.includes(nr)) { b.className = "w-full mb-5 py-3.5 rounded-xl font-bold text-xs border border-amber-400/50 bg-amber-500/20 text-amber-200 transition-all"; b.innerText = 'Usuń z ulubionych'; }
    else { b.className = "btn-classic-primary w-full mb-5 py-3.5 rounded-xl font-bold text-xs"; b.innerText = 'Dodaj do ulubionych'; }
    pokazEkran('modal-sala-uczen');
};

window.przelaczUlubionaSale = function() {
    if (!wybranaSalaModal || !zalogowanyUid) return;
    const i = ulubioneSale.indexOf(wybranaSalaModal);
    if (i > -1) ulubioneSale.splice(i, 1); else ulubioneSale.push(wybranaSalaModal);
    db.ref('uczniowie/' + zalogowanyUid + '/ulubione').set(ulubioneSale.length > 0 ? ulubioneSale : null);
    
    const b = document.getElementById('btn-toggle-ulubiona');
    if (ulubioneSale.includes(wybranaSalaModal)) { 
        b.className = "w-full mb-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm border transition-all border-amber-400/50 bg-amber-500/20 text-amber-200"; 
        b.innerText = 'Usuń z ulubionych'; 
    } else { 
        b.className = "btn-classic-primary w-full mb-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm"; 
        b.innerText = 'Dodaj do ulubionych'; 
    }
    generujTabliceKlasyczna(); if (obecnaWizualizacja === 'fizyczna') renderujTabliceFizyczna(); ustawFiltr(aktywnyFiltr); renderujUlubione();
};

window.wyslijZgloszenieUsterki = function() {
    const o = document.getElementById('opis-usterki-input').value.trim(); if (!o) return;
    db.ref('usterki_sal').push({ sala: wybranaSalaModal, opis: o, kto: `${zalogowanyUczen.imie_nazwisko} (${zalogowanyUczen.klasa || '-'})`, uid: zalogowanyUid, czas: terazDataString() }).then(() => {
        document.getElementById('opis-usterki-input').value = ''; 
        pokazAlert("Zgłoszenie wysłane", "Usterka została zarejestrowana i jest widoczna dla portierni oraz administracji.");
    });
};
window.zamknijModalSali = () => { ukryjEkran('modal-sala-uczen'); };

// ==========================================
// SOLNA WRAPPED (WARIANT B: KOŁO FORTUNY + PLAKATY BEZ CZARNEGO EKRANU)
// ==========================================
window.uruchomWrapped = async function(miesiac, btnEl) {
    if(btnEl) btnEl.style.opacity = '0.5';
    wstrzyknijStyleWrapped();

    try {
        let dane = [];
        try {
            const snap = await db.ref('statystyki_logi')
                .orderByChild('czas')
                .startAt(miesiac + '-01 00:00:00')
                .endAt(miesiac + '-31 23:59:59')
                .once('value');
            dane = snap.val() ? Object.values(snap.val()) : [];
        } catch(idxErr) {
            const snap = await db.ref('statystyki_logi').limitToLast(2500).once('value');
            const allData = snap.val() ? Object.values(snap.val()) : [];
            dane = allData.filter(l => l.czas && l.czas.startsWith(miesiac));
        }
        if(btnEl) btnEl.style.opacity = '1';
        if(dane.length === 0) { 
            pokazAlert("Brak logów", 'Masz zbyt mało wpisów na portierni w tym miesiącu, aby wygenerować podsumowanie.'); 
            return; 
        }
        przygotujDaneWrapped(dane, miesiac);
    } catch(e) {
        if(btnEl) btnEl.style.opacity = '1';
        pokazAlert("Krytyczny błąd bazy", "Treść błędu: " + e.message);
    }
};

function wstrzyknijStyleWrapped() {
    if (!document.getElementById('wrapped-styles-v8')) {
        const style = document.createElement('style');
        style.id = 'wrapped-styles-v8';
        style.innerHTML = `
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .anim-fade-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            .delay-100 { animation-delay: 0.15s; }
            .delay-200 { animation-delay: 0.3s; }
            .delay-300 { animation-delay: 0.45s; }
            .delay-400 { animation-delay: 0.6s; }
            .delay-800 { animation-delay: 1.2s; }
        `;
        document.head.appendChild(style);
    }
}

function sformatujCzasKrotki(minuty) {
    const zaokr = Math.max(1, Math.round(minuty));
    const h = Math.floor(zaokr / 60);
    const m = zaokr % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function generujKartaWspinaczkiHtml(tytul, podtytul, badgeTxt, twojaPozycja, sumaOsob, topProcent, czasMin, listaCzasow, kolorAkcentu) {
    const czasTxt = sformatujCzasKrotki(czasMin);
    const czySzczyt = twojaPozycja <= 3;
    const targetSlot = czySzczyt ? (twojaPozycja - 1) : 2;
    const startRank = czySzczyt ? 1 : (twojaPozycja - 2);

    const targetTopPx = 12 + targetSlot * 52;
    const startOffsetPx = 224 - targetTopPx;

    let wierszeTlaHtml = '';
    for (let s = 0; s < 5; s++) {
        const rankS = startRank + s;
        if (s === targetSlot) {
            wierszeTlaHtml += `<div class="h-[44px] w-full opacity-0 pointer-events-none"></div>`;
        } else {
            let minutyInnego = null;
            if (listaCzasow && listaCzasow[rankS - 1] !== undefined) {
                minutyInnego = listaCzasow[rankS - 1][1];
            } else {
                const roznicaMiejsc = rankS - twojaPozycja;
                minutyInnego = Math.max(12, Math.round(czasMin * Math.pow(0.84, roznicaMiejsc)));
            }
            const czasInnegoTxt = sformatujCzasKrotki(minutyInnego);

            wierszeTlaHtml += `
            <div class="h-[44px] flex items-center justify-between px-4 rounded-xl bg-white/5 border border-white/5 text-zinc-400 text-xs shrink-0">
                <div class="flex items-center gap-3">
                    <span class="font-extrabold text-zinc-300 w-7 text-left">#${rankS}</span>
                    <div class="w-7 h-7 rounded-lg bg-zinc-800/90 border border-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">?</div>
                    <span class="font-semibold tracking-widest text-zinc-400">??? ???</span>
                </div>
                <span class="text-[11px] font-bold text-zinc-300">${czasInnegoTxt}</span>
            </div>`;
        }
    }

    const startLicznik = Math.max(sumaOsob, twojaPozycja + 14);

    return `
    <div class="w-full h-full bg-gradient-to-br ${kolorAkcentu} flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
        <span class="emblem emblem-indigo mb-3 opacity-90 backdrop-blur-md anim-fade-up">${ucieczkaHtml(badgeTxt)}</span>
        <h2 class="text-2xl sm:text-3xl font-black text-white mb-1 drop-shadow-md anim-fade-up delay-100">${ucieczkaHtml(tytul)}</h2>
        <p class="text-xs sm:text-sm text-zinc-300 mb-5 max-w-xs anim-fade-up delay-200">${ucieczkaHtml(podtytul)}</p>

        <div class="w-full max-w-xs climb-board-box anim-fade-up delay-200 shadow-2xl">
            <div class="climb-hero-row flex items-center justify-between px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 border border-white/30 text-white" style="--target-top: ${targetTopPx}px; --start-offset: ${startOffsetPx}px;">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-sm font-black bg-black/30 px-2.5 py-0.5 rounded-lg">#<span data-cel="${twojaPozycja}" data-easing="wheel" data-opoznienie="250" data-czas="4800">${startLicznik}</span></span>
                    <div class="w-7 h-7 rounded-lg bg-zinc-900 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 text-[11px] font-bold">
                        ${wyrenderujWnetrzeAvataru(zalogowanyUczen, 'text-[11px]')}
                    </div>
                    <span class="font-extrabold text-xs sm:text-sm truncate">${ucieczkaHtml(zalogowanyUczen.imie_nazwisko.split(' ')[0])} (Ty)</span>
                </div>
                <span class="text-xs font-black text-indigo-100 shrink-0 ml-2">${czasTxt}</span>
            </div>

            <div class="climb-bg-rows">
                ${wierszeTlaHtml}
            </div>
        </div>

        <div class="mt-5 bg-black/35 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 max-w-xs anim-reveal-after-wheel">
            <p class="text-xs text-zinc-200">Jesteś w <b class="text-emerald-300">TOP ${topProcent}%</b> (${twojaPozycja}. miejsce na ${sumaOsob} aktywnych osób)</p>
        </div>

        <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-6 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-reveal-after-wheel shadow-lg relative z-20">Dalej &rarr;</button>
    </div>`;
}

function przygotujDaneWrapped(logi, miesiac) {
    let czasCalkowity = 0;
    let saleCount = {};
    let godzinyCount = {};
    let maxSesja = 0;
    let maxSesjaSala = '';
    let refleksCount = 0;
    let ostatniZwrot = {};
    let aktywne = {};
    let czasyWszystkich = {};
    let liczbaSesji = 0;
    
    const pelneImie = zalogowanyUczen.imie_nazwisko;
    const sameImie = pelneImie.split(' ')[0];
    
    logi.forEach(l => {
        const isMe = l.kto && l.kto.includes(pelneImie);
        const ms = parsowacCzas(l.czas);
        
        if (l.akcja === 'WOLNA') {
            ostatniZwrot[l.sala] = ms;
            if (aktywne[l.sala] && !l.auto_reset && !(l.kto && l.kto.includes('automatyczny'))) {
                const dt = (ms - aktywne[l.sala].czas) / 60000;
                if (dt >= 1 && dt <= 480) {
                    const czysteImieKto = (aktywne[l.sala].kto || '').split('(')[0].trim();
                    if (czysteImieKto) czasyWszystkich[czysteImieKto] = (czasyWszystkich[czysteImieKto] || 0) + dt;
                    if (aktywne[l.sala].isMe) {
                        czasCalkowity += dt;
                        liczbaSesji++;
                        saleCount[l.sala] = (saleCount[l.sala] || 0) + dt;
                        const g = new Date(aktywne[l.sala].czas).getHours();
                        godzinyCount[g] = (godzinyCount[g] || 0) + 1;
                        if (dt > maxSesja) { maxSesja = dt; maxSesjaSala = l.sala; }
                    }
                }
            }
            delete aktywne[l.sala];
        } else if (l.akcja === 'ZAJĘTA') {
            aktywne[l.sala] = { czas: ms, isMe: isMe, kto: l.kto || '' };
            if (isMe && ostatniZwrot[l.sala]) {
                const dtZwrot = (ms - ostatniZwrot[l.sala]) / 60000;
                if (dtZwrot > 0 && dtZwrot <= 4) refleksCount++;
            }
        }
    });
    
    if (czasCalkowity < 1) {
        pokazAlert("Brak danych", "Masz w zeszycie na ten miesiąc łącznie mniej niż minutę ćwiczeń. Pobierz na portierni jakąś salę, oddaj po chwili i spróbuj ponownie!");
        return;
    }

    czasyWszystkich[pelneImie] = Math.max(czasyWszystkich[pelneImie] || 0, czasCalkowity);

    const mapaInstrUczniow = {};
    Object.values(pelnaBazaUczniow).forEach(u => {
        if (u && u.imie_nazwisko) mapaInstrUczniow[u.imie_nazwisko.trim()] = (u.instrument || '').trim().toLowerCase();
    });

    const mojInstrument = (zalogowanyUczen.instrument || 'Instrument').trim();
    const mojInstrumentLow = mojInstrument.toLowerCase();

    const rankingSzkola = Object.entries(czasyWszystkich).sort((a, b) => b[1] - a[1]);
    const rankSzkolaIdx = rankingSzkola.findIndex(e => e[0].includes(pelneImie) || pelneImie.includes(e[0]));
    const mojaPozycjaSzkola = rankSzkolaIdx !== -1 ? rankSzkolaIdx + 1 : 1;
    const totalSzkola = Math.max(rankingSzkola.length, mojaPozycjaSzkola);
    const topProcentSzkola = Math.max(1, Math.round((mojaPozycjaSzkola / totalSzkola) * 100));

    const rankingInstr = rankingSzkola.filter(([imieNazw]) => {
        if (imieNazw.includes(pelneImie) || pelneImie.includes(imieNazw)) return true;
        return mapaInstrUczniow[imieNazw] && mapaInstrUczniow[imieNazw] === mojInstrumentLow;
    });
    const rankInstrIdx = rankingInstr.findIndex(e => e[0].includes(pelneImie) || pelneImie.includes(e[0]));
    const mojaPozycjaInstr = rankInstrIdx !== -1 ? rankInstrIdx + 1 : 1;
    const totalInstr = Math.max(rankingInstr.length, mojaPozycjaInstr);
    const topProcentInstr = Math.max(1, Math.round((mojaPozycjaInstr / totalInstr) * 100));
    
    const topSale = Object.entries(saleCount).sort((a,b) => b[1] - a[1]);
    const topSala = topSale[0][0];
    const topSalaCzasH = Math.round(topSale[0][1] / 60);
    
    let opcjeQuiz = [topSala];
    if (topSale.length > 1) opcjeQuiz.push(topSale[1][0]);
    if (topSale.length > 2) opcjeQuiz.push(topSale[2][0]);
    while(opcjeQuiz.length < 3) {
        const r = wszystkieSale[Math.floor(Math.random() * wszystkieSale.length)];
        if(!opcjeQuiz.includes(r)) opcjeQuiz.push(r);
    }
    opcjeQuiz.sort(() => Math.random() - 0.5); 
    
    const posortowaneGodziny = Object.entries(godzinyCount).sort((a,b) => b[1] - a[1]);
    const primeH = posortowaneGodziny[0][0];
    const rangeH = `${primeH}:00 - ${parseInt(primeH)+1}:00`;
    
    const unikalneSale = Object.keys(saleCount).length;
    const pctDomator = Math.round((topSale[0][1]/czasCalkowity)*100);
    const domator = (topSale[0][1] / czasCalkowity) > 0.6;

    wStats = { 
        czas: czasCalkowity,
        topSala: topSala,
        topSaleList: topSale.slice(0, 5),
        unikalneSale: unikalneSale,
        rangeH: rangeH, 
        imie: sameImie,
        pelneImie: pelneImie,
        instrument: mojInstrument,
        miesiac: miesiac,
        rankSzkola: mojaPozycjaSzkola,
        totalSzkola: totalSzkola,
        rankInstr: mojaPozycjaInstr,
        totalInstr: totalInstr,
        liczbaSesji: liczbaSesji
    };
    
    wrappedKartyHtml = [];
    
    wrappedKartyHtml.push(`
        <div class="w-full h-full bg-gradient-to-br from-[#1e1b4b] to-[#4c1d95] flex flex-col justify-center items-center p-6 text-center relative z-20">
            <div class="relative z-30 flex flex-col items-center">
                <div class="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-6 shadow-2xl anim-fade-up">
                    <img src="logo.png" alt="Logo" class="w-full h-full object-cover scale-110 drop-shadow-md">
                </div>
                <h2 class="text-5xl sm:text-6xl font-black text-white mb-2 drop-shadow-2xl anim-fade-up delay-100 tracking-tight leading-none">Solna<br>Wrapped</h2>
                <p class="text-xl font-bold text-white/90 drop-shadow-md anim-fade-up delay-200 uppercase tracking-widest mt-4 border-t border-white/20 pt-4">${miesiac}</p>
            </div>
        </div>
    `);

    wrappedKartyHtml.push(`
        <div class="w-full h-full bg-gradient-to-br from-[#0f172a] to-[#312e81] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden z-20">
            <span class="emblem emblem-purple mb-4 opacity-80 backdrop-blur-md anim-fade-up">Większość dni wygląda tak samo...</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-6 drop-shadow-lg anim-fade-up delay-100">Ale zostawiłeś ślad.</h2>
            <p class="text-lg text-indigo-100 mb-10 max-w-sm drop-shadow-md anim-fade-up delay-200">Jak myślisz, w której sali spędziłeś najwięcej czasu?</p>
            <div class="flex flex-col gap-4 w-full max-w-xs relative z-30 anim-fade-up delay-300" id="quiz-buttons">
                ${opcjeQuiz.map(o => `<button onclick="odpowiedzQuiz(this, '${o}', '${topSala}', ${topSalaCzasH}); event.stopPropagation();" class="quiz-btn p-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-xl border border-white/20 hover:bg-white/20 transition-all shadow-lg">${o}</button>`).join('')}
            </div>
            <div id="quiz-result" class="hidden mt-8 text-xl font-bold bg-black/40 backdrop-blur-xl px-6 py-5 rounded-3xl w-full max-w-xs transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 anim-fade-up"></div>
        </div>
    `);
    
    wrappedKartyHtml.push(`
        <div class="w-full h-full bg-gradient-to-br from-[#022c22] to-[#047857] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
            <span class="emblem emblem-emerald mb-4 opacity-80 backdrop-blur-md anim-fade-up">Krok po kroku</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-2 drop-shadow-md anim-fade-up delay-100">Ćwiczyłeś łącznie</h2>
            <p class="text-5xl sm:text-6xl font-black text-emerald-300 mb-8 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] anim-fade-up delay-200" id="wrapped-anim-czas-container">
                <span id="wrapped-anim-czas" data-total="${Math.round(czasCalkowity)}" data-czas="4000">0m</span>
            </p>
            <div class="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 max-w-sm shadow-2xl relative z-10 anim-fade-up delay-400">
                <p class="text-sm text-teal-100 mb-1">Twoje najczęstsze godziny to:</p>
                <p class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100 drop-shadow-sm">${rangeH}</p>
            </div>
            <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-8 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-fade-up delay-800 shadow-lg relative z-20">Dalej &rarr;</button>
        </div>
    `);

    wrappedKartyHtml.push(
        generujKartaWspinaczkiHtml(
            'Ranking Szkoły',
            'Sprawdźmy, na którym miejscu wśród uczniów POSM zatrzyma się Twój wynik...',
            'Klasyfikacja Ogólna',
            mojaPozycjaSzkola,
            totalSzkola,
            topProcentSzkola,
            czasCalkowity,
            rankingSzkola,
            'from-[#0f172a] via-[#1e1b4b] to-[#312e81]'
        )
    );

    wrappedKartyHtml.push(
        generujKartaWspinaczkiHtml(
            `Sekcja: ${mojInstrument}`,
            `Zobaczmy Twoją pozycję wśród wszystkich osób z instrumentu: ${mojInstrument}...`,
            'Twój Instrument',
            mojaPozycjaInstr,
            totalInstr,
            topProcentInstr,
            czasCalkowity,
            rankingInstr,
            'from-[#111827] via-[#064e3b] to-[#0f766e]'
        )
    );
    
    if (domator) {
        wrappedKartyHtml.push(`
            <div class="w-full h-full bg-gradient-to-br from-[#451a03] to-[#9a3412] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
                <span class="emblem emblem-amber mb-4 opacity-80 backdrop-blur-md anim-fade-up">Każdy ma swój styl</span>
                <h2 class="text-4xl sm:text-5xl font-black text-white mb-4 drop-shadow-md anim-fade-up delay-100">Syndrom Zasiedzenia</h2>
                <div class="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl mt-2 relative z-10 anim-fade-up delay-300">
                    <p class="text-lg text-amber-50 max-w-xs leading-relaxed">
                        Aż <b class="text-amber-300"><span data-cel="${pctDomator}" data-format="%" data-czas="4000">0%</span></b> czasu spędziłeś w sali <b class="text-amber-300">${topSala}</b>. Znalazłeś swoje miejsce i trzymałeś się go mocno.
                    </p>
                </div>
                <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-8 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-fade-up delay-800 shadow-lg relative z-20">Dalej &rarr;</button>
            </div>
        `);
    } else {
        wrappedKartyHtml.push(`
            <div class="w-full h-full bg-gradient-to-br from-[#451a03] to-[#9a3412] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
                <span class="emblem emblem-amber mb-4 opacity-80 backdrop-blur-md anim-fade-up">Każdy ma swój styl</span>
                <h2 class="text-4xl sm:text-5xl font-black text-white mb-4 drop-shadow-md anim-fade-up delay-100">Salkowy Nomada</h2>
                <div class="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl mt-2 relative z-10 anim-fade-up delay-300">
                    <p class="text-lg text-amber-50 max-w-xs leading-relaxed">
                        Odwiedziłeś w tym miesiącu aż <b class="text-amber-300"><span data-cel="${unikalneSale}" data-czas="4000">0</span></b> różnych sal. Dziś tu, jutro tam.
                    </p>
                </div>
                <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-8 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-fade-up delay-800 shadow-lg relative z-20">Dalej &rarr;</button>
            </div>
        `);
    }
    
    wrappedKartyHtml.push(`
        <div class="w-full h-full bg-gradient-to-br from-[#4c0519] to-[#be123c] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
            <span class="emblem emblem-rose mb-4 opacity-80 backdrop-blur-md anim-fade-up">Dni pełnego skupienia</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-2 drop-shadow-md anim-fade-up delay-100">Rekord posiedzenia</h2>
            <p class="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-100 mb-6 drop-shadow-lg anim-fade-up delay-200" id="wrapped-anim-max-container">
                <span id="wrapped-anim-max" data-total="${Math.round(maxSesja)}" data-czas="4000">0m</span>
            </p>
            <div class="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl relative z-10 anim-fade-up delay-400">
                <p class="text-base text-pink-50 max-w-xs leading-relaxed">
                    Twój najdłuższy nieprzerwany wpis w zeszycie. Sala <b class="text-rose-300">${maxSesjaSala}</b> była wtedy tylko Twoja.
                </p>
            </div>
            <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-8 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-fade-up delay-800 shadow-lg relative z-20">Dalej &rarr;</button>
        </div>
    `);

    if (refleksCount >= 2) {
        wrappedKartyHtml.push(`
            <div class="w-full h-full bg-gradient-to-br from-[#083344] to-[#0369a1] flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
                <span class="emblem emblem-indigo mb-4 opacity-80 backdrop-blur-md anim-fade-up">Refleks na korytarzu</span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 drop-shadow-md anim-fade-up delay-100">Snajper na portierni</h2>
                <div class="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 border border-cyan-400/50 shadow-xl relative z-10 anim-fade-up delay-200">
                    <span class="text-4xl font-black text-cyan-300"><span data-cel="${refleksCount}" data-format="x" data-czas="3500">0x</span></span>
                </div>
                <p class="text-base text-blue-50 max-w-xs leading-relaxed bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl relative z-10 anim-fade-up delay-400">
                    Tyle razy udało Ci się przejąć salę w mniej niż <b class="text-cyan-300">4 minuty</b> od jej zwrotu.
                </p>
                <button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-8 px-8 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold backdrop-blur-md hover:bg-white/20 transition-all anim-fade-up delay-800 shadow-lg relative z-20">Dalej &rarr;</button>
            </div>
        `);
    }

    wrappedKartyHtml.push(`
        <div class="w-full h-full bg-[#090d16] flex flex-col justify-center items-center p-4 z-20 overflow-y-auto no-scrollbar">
            <div class="flex gap-2 mb-3.5 w-full max-w-[320px] relative z-40 anim-fade-up delay-100">
                <button id="btn-motyw-spotify" onclick="zmienMotywWrapped('spotify'); event.stopPropagation();" class="btn-motyw flex-1 py-2 rounded-xl bg-[#f3f2ec] text-zinc-950 text-[10px] uppercase tracking-wider font-black shadow-lg transition-all ring-2 ring-indigo-400">Plakat</button>
                <button id="btn-motyw-graficzny" onclick="zmienMotywWrapped('graficzny'); event.stopPropagation();" class="btn-motyw flex-1 py-2 rounded-xl bg-[#dca608] text-zinc-950 text-[10px] uppercase tracking-wider font-black shadow-lg transition-all">Gold</button>
                <button id="btn-motyw-analityczny" onclick="zmienMotywWrapped('analityczny'); event.stopPropagation();" class="btn-motyw flex-1 py-2 rounded-xl bg-[#1dd1a1] text-zinc-950 text-[10px] uppercase tracking-wider font-black shadow-lg transition-all">Top 5</button>
            </div>
            
            <div class="w-full max-w-[320px] anim-fade-up delay-200 shrink-0">
                <div id="wrapped-share-canvas" class="rounded-[24px] w-full aspect-[4/5] relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                </div>
            </div>
            
            <div class="mt-4 flex flex-col gap-2.5 w-full max-w-[320px] relative z-40 anim-fade-up delay-300">
                <button onclick="udostepnijIG(); event.stopPropagation();" class="btn-classic-primary w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Pobierz Grafikę
                </button>
                <button onclick="zamknijWrapped(); event.stopPropagation();" class="w-full py-2.5 rounded-xl font-bold text-xs text-zinc-400 hover:text-white transition-colors bg-white/5 border border-white/5 hover:bg-white/10">Zamknij podsumowanie</button>
            </div>
        </div>
    `);

    aktywnaKartaWrapped = 0;
    renderujPasekWrapped();
    pokazKartaWrapped(0);
    pokazEkran('wrapped-overlay', 'flex');
}

window.zmienMotywWrapped = function(typ) {
    document.querySelectorAll('.btn-motyw').forEach(b => b.classList.remove('ring-2', 'ring-white', 'ring-indigo-400'));
    const btn = document.getElementById('btn-motyw-' + typ);
    if (btn) btn.classList.add('ring-2', 'ring-white');
    
    const st = wStats;
    const kontener = document.getElementById('wrapped-share-canvas');
    if (!kontener) return;

    const av = zalogowanyUczen && zalogowanyUczen.avatar ? zalogowanyUczen.avatar : '';
    const inicjaly = pobierzInicjaly(zalogowanyUczen ? zalogowanyUczen.imie_nazwisko : 'Uczeń');
    let centralFotoHtml = `<div class="w-full h-full bg-[#121212] flex items-center justify-center text-5xl font-extrabold text-[#f3f2ec] tracking-tight font-space-grotesk select-none">${ucieczkaHtml(inicjaly)}</div>`;
    if (av.startsWith('data:image/')) {
        centralFotoHtml = `<img src="${av}" class="w-full h-full object-cover">`;
    }

    const topSaleRows = [0, 1, 2, 3, 4].map(i => {
        const item = st.topSaleList && st.topSaleList[i];
        const nazwa = item ? `${item[0]}` : '—';
        return `<div class="truncate leading-snug"><span class="font-black mr-1.5">${i + 1}</span>${ucieczkaHtml(nazwa)}</div>`;
    }).join('');

    const statystykiRows = [
        `#${st.rankSzkola} w szkole`,
        `#${st.rankInstr} (${st.instrument})`,
        `Pora: ${st.rangeH.split(' - ')[0]}`,
        `Sesji: ${st.liczbaSesji}`,
        `Seria: ${Number(zalogowanyUczen?.streak) || 0} dni`
    ].map((txt, i) => `<div class="truncate leading-snug"><span class="font-black mr-1">${i + 1}</span>${ucieczkaHtml(txt)}</div>`).join('');

    const sformatowaneMinuty = Math.round(st.czas).toLocaleString('en-US');

    if (typ === 'spotify') {
        kontener.innerHTML = `
            <div class="w-full h-full spotify-wrapped-card flex flex-col justify-between p-5 relative select-none">
                <div class="relative w-full h-[46%] flex items-center justify-center">
                    <svg class="absolute left-0 top-0 h-full w-14 overflow-visible" viewBox="0 0 60 180">
                        <g transform="translate(42, 90) rotate(-90)">
                            <text x="0" y="0" text-anchor="middle" fill="#ff2424" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="42" letter-spacing="-1.5">${ucieczkaHtml(st.miesiac.replace('-', '.'))}</text>
                        </g>
                    </svg>
                    <svg class="absolute right-0 top-0 h-full w-28 rounded-lg overflow-hidden" viewBox="0 0 110 180" preserveAspectRatio="xMidYMid slice">
                        <rect width="110" height="180" fill="#f3f2ec"/>
                        <circle cx="110" cy="90" r="105" fill="#121212"/>
                        <circle cx="110" cy="90" r="91" fill="#f3f2ec"/>
                        <circle cx="110" cy="90" r="77" fill="#121212"/>
                        <circle cx="110" cy="90" r="63" fill="#f3f2ec"/>
                        <circle cx="110" cy="90" r="49" fill="#121212"/>
                        <circle cx="110" cy="90" r="35" fill="#f3f2ec"/>
                        <circle cx="110" cy="90" r="21" fill="#121212"/>
                        <circle cx="110" cy="90" r="8" fill="#f3f2ec"/>
                    </svg>
                    <div class="relative z-10 w-[138px] h-[138px] bg-[#121212] border-[2.5px] border-[#121212] shadow-[6px_6px_0px_#121212] overflow-hidden">
                        ${centralFotoHtml}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-1.5 text-left">
                    <div>
                        <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Top Sale</p>
                        <div class="text-[11px] font-extrabold text-[#121212] flex flex-col gap-0.5">
                            ${topSaleRows}
                        </div>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Statystyki</p>
                        <div class="text-[11px] font-extrabold text-[#121212] flex flex-col gap-0.5">
                            ${statystykiRows}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-black/15 text-left">
                    <div>
                        <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Wyćwiczone minuty</p>
                        <p class="text-2xl font-extrabold font-space-grotesk text-[#121212] leading-tight tracking-tight">${sformatowaneMinuty}</p>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Instrument</p>
                        <p class="text-lg font-extrabold font-space-grotesk text-[#121212] leading-tight truncate">${ucieczkaHtml(st.instrument)}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-1.5 border-t border-black/15">
                    <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 rounded-full bg-[#121212] text-white flex items-center justify-center text-[8px] font-black">♪</div>
                        <span class="text-[9px] font-black tracking-wider uppercase text-[#121212]">${ucieczkaHtml(st.imie)}</span>
                    </div>
                    <span class="text-[8px] font-black tracking-widest uppercase text-zinc-700">SOLNA WRAPPED</span>
                </div>
            </div>`;
    } else if (typ === 'graficzny') {
        kontener.innerHTML = `
            <div class="w-full h-full spotify-gold-card flex flex-col justify-between p-5 relative select-none overflow-hidden">
                <div class="flex items-center justify-between relative z-20">
                    <div class="flex items-center gap-1.5">
                        <div class="w-5 h-5 rounded-full bg-[#111111] text-[#dca608] flex items-center justify-center text-[10px] font-black">♪</div>
                        <span class="text-[11px] font-black tracking-tight text-[#111111]">Solna</span>
                    </div>
                    <span class="text-[10px] font-extrabold font-space-grotesk uppercase tracking-widest text-[#111111]/80">${ucieczkaHtml(st.miesiac.replace('-', '.'))}</span>
                </div>

                <div class="relative w-full h-[52%] flex items-center justify-center my-1">
                    <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 280 200">
                        <path d="M 10,30 L 85,15 L 45,80 L 105,65 L 55,140" fill="none" stroke="#ff1e1e" stroke-width="18" stroke-linecap="square" stroke-linejoin="miter"/>
                        <circle cx="220" cy="135" r="34" fill="#a855f7"/>
                        <circle cx="242" cy="105" r="24" fill="#ec4899"/>
                        <circle cx="195" cy="160" r="22" fill="#3b82f6"/>
                        <path d="M 175,25 C 235,-5 265,65 205,85 C 155,105 235,175 265,145" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round"/>
                        <path d="M 20,145 C -10,110 55,85 85,135 C 110,175 160,150 145,185" fill="none" stroke="#cbd5e1" stroke-width="9" stroke-linecap="round"/>
                    </svg>
                    <div class="relative z-10 w-36 h-36 bg-[#121212] border-[3px] border-[#111111] shadow-[8px_10px_0px_rgba(0,0,0,0.85)] overflow-hidden" style="transform: rotate(-5deg);">
                        ${centralFotoHtml}
                    </div>
                </div>

                <div class="text-center relative z-20 flex flex-col items-center">
                    <h3 class="text-2xl font-black text-[#111111] tracking-tight leading-none">${ucieczkaHtml(st.pelneImie)}</h3>
                    <p class="text-[11px] font-bold text-[#111111]/80 mt-1">Wyćwiczone: ${sformatowaneMinuty} min • Sala ${ucieczkaHtml(st.topSala)}</p>
                    <div class="mt-3 px-5 py-1.5 rounded-full bg-[#111111] text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                        #${st.rankSzkola} W SZKOLE • #${st.rankInstr} ${ucieczkaHtml(st.instrument)}
                    </div>
                </div>
            </div>`;
    } else {
        const duzeTopSale = [0, 1, 2, 3, 4].map(i => {
            const item = st.topSaleList && st.topSaleList[i];
            const nazwa = item ? `${item[0]}` : '—';
            const minutySali = item ? `${Math.round(item[1])} min` : '';
            return `
            <div class="flex items-baseline justify-between border-b border-black/10 pb-1">
                <span class="text-lg font-black text-[#111111] tracking-tight">${i + 1}. ${ucieczkaHtml(nazwa)}</span>
                <span class="text-[10px] font-extrabold text-[#111111]/70">${minutySali}</span>
            </div>`;
        }).join('');

        kontener.innerHTML = `
            <div class="w-full h-full spotify-aura-card flex flex-col justify-between p-5 relative select-none overflow-hidden">
                <div class="flex items-center justify-between relative z-20">
                    <div class="flex items-center gap-1.5">
                        <div class="w-5 h-5 rounded-full bg-[#111111] text-[#1dd1a1] flex items-center justify-center text-[10px] font-black">♪</div>
                        <span class="text-[11px] font-black tracking-tight text-[#111111]">Solna</span>
                    </div>
                    <span class="text-[10px] font-extrabold font-space-grotesk uppercase tracking-widest text-[#111111]/80">${ucieczkaHtml(st.miesiac.replace('-', '.'))}</span>
                </div>

                <div class="text-center mt-2 relative z-20">
                    <p class="text-[11px] font-bold text-[#111111]/80">Ćwiczyłeś łącznie <b class="text-[#111111] font-black">${sformatowaneMinuty} min</b> w <b class="text-[#111111] font-black">${st.unikalneSale} salach</b>.</p>
                    <p class="text-xs font-extrabold text-[#111111] mt-2 uppercase tracking-wider">Twoje Top 5 sal:</p>
                </div>

                <div class="flex flex-col gap-1.5 my-auto px-2 relative z-20 text-left">
                    ${duzeTopSale}
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-black/15 relative z-20">
                    <span class="text-[10px] font-black uppercase tracking-wider text-[#111111]">${ucieczkaHtml(st.imie)} • ${ucieczkaHtml(st.instrument)}</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#111111] text-[#1dd1a1] text-[9px] font-black">#${st.rankSzkola} POSM</span>
                </div>
            </div>`;
    }
};

function renderujPasekWrapped() {
    const p = document.getElementById('wrapped-progress');
    p.innerHTML = wrappedKartyHtml.map((_, i) => `<div class="h-1 flex-1 bg-white/20 rounded-full overflow-hidden shadow-sm"><div id="wrap-bar-${i}" class="h-full bg-white" style="width: 0%;"></div></div>`).join('');
}

function uruchomAnimacjeLiczb(kontener) {
    function easeInOutCubic(p) {
        return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }
    function easeOutWheel(p) {
        return 1 - Math.pow(1 - p, 4.2);
    }

    const numery = kontener.querySelectorAll('[data-cel]');
    numery.forEach(el => {
        const end = parseInt(el.getAttribute('data-cel'), 10);
        const startVal = parseInt(el.innerText, 10) || 0;
        const format = el.getAttribute('data-format') || '';
        const duration = parseInt(el.getAttribute('data-czas') || 3000, 10);
        const delay = parseInt(el.getAttribute('data-opoznienie') || 0, 10);
        const easingType = el.getAttribute('data-easing') || 'cubic';
        let startTimestamp = null;
        
        const runAnim = () => {
            const step = (t) => {
                if(!startTimestamp) startTimestamp = t;
                const p = Math.min((t - startTimestamp)/duration, 1);
                const eased = (easingType === 'wheel' || easingType === 'smooth') ? easeOutWheel(p) : easeInOutCubic(p); 
                const current = Math.round(startVal + eased * (end - startVal));
                
                if (easingType === 'wheel' && p > 0.72 && p < 0.97) {
                    el.innerHTML = '?';
                } else {
                    el.innerHTML = current + format;
                }

                if(p < 1) window.requestAnimationFrame(step);
                else el.innerHTML = end + format;
            };
            window.requestAnimationFrame(step);
        };

        if (delay > 0) setTimeout(runAnim, delay);
        else runAnim();
    });

    const timeTotal = kontener.querySelector('#wrapped-anim-czas');
    const timeMax = kontener.querySelector('#wrapped-anim-max');
    
    function animateTime(element, isMaxCard) {
        if (!element) return;
        const end = parseInt(element.getAttribute('data-total'), 10);
        const duration = parseInt(element.getAttribute('data-czas') || 4000, 10);
        let startTimestamp = null;
        
        const step = (t) => {
            if(!startTimestamp) startTimestamp = t;
            const p = Math.min((t - startTimestamp)/duration, 1);
            const eased = easeInOutCubic(p); 
            const minVal = Math.floor(eased * end);
            const h = Math.floor(minVal / 60);
            const m = minVal % 60;
            
            if (isMaxCard) {
                element.innerHTML = `<span class="text-white">${h}</span><span class="text-xl sm:text-2xl text-pink-200 mx-1">godz</span> <span class="text-white">${m}</span><span class="text-xl sm:text-2xl text-pink-200 ml-1">min</span>`;
            } else {
                element.innerHTML = `<span class="text-white">${h}</span><span class="text-2xl text-emerald-100 mx-1 sm:mx-2">h</span> <span class="text-white">${m}</span><span class="text-2xl text-emerald-100 ml-1">m</span>`;
            }
            if(p < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    animateTime(timeTotal, false);
    animateTime(timeMax, true);
}

function pokazKartaWrapped(idx) {
    const kontener = document.getElementById('wrapped-cards');
    kontener.innerHTML = wrappedKartyHtml[idx];
    
    if (idx === wrappedKartyHtml.length - 1) {
        window.zmienMotywWrapped('spotify');
    } else {
        setTimeout(() => { uruchomAnimacjeLiczb(kontener); }, 50);
    }

    for(let i=0; i<wrappedKartyHtml.length; i++) {
        const bar = document.getElementById(`wrap-bar-${i}`);
        if(!bar) continue;
        bar.style.transition = 'none';
        if(i < idx) bar.style.width = '100%';
        else bar.style.width = '0%';
    }
    
    document.querySelectorAll('[id^="wrapped-touch-"]').forEach(el => {
        if (idx === 1 || idx === wrappedKartyHtml.length - 1) el.style.display = 'none';
        else el.style.display = 'block';
    });

    clearTimeout(wrappedTimer);
    
    setTimeout(() => {
        const bar = document.getElementById(`wrap-bar-${idx}`);
        if(bar) { 
            let duration = 10;
            if(idx === 0) duration = 5; 
            if(idx === 1) duration = 15;
            if(idx === 3 || idx === 4) duration = 14; 
            if(idx === wrappedKartyHtml.length - 1) duration = 0; 
            
            if(duration > 0) {
                bar.style.transition = `width ${duration}s linear`;
                bar.style.width = '100%';
            }
        }
        
        if (idx !== wrappedKartyHtml.length - 1) {
            let timeoutMs = 10000;
            if(idx === 0) timeoutMs = 5000;
            if(idx === 1) timeoutMs = 15000;
            if(idx === 3 || idx === 4) timeoutMs = 14000;
            wrappedTimer = setTimeout(() => { wrappedNastepny(); }, timeoutMs);
        }
    }, 50);
}

window.wrappedPoprzedni = function() {
    if(aktywnaKartaWrapped > 0) {
        aktywnaKartaWrapped--;
        pokazKartaWrapped(aktywnaKartaWrapped);
    }
};

window.wrappedNastepny = function() {
    if(aktywnaKartaWrapped < wrappedKartyHtml.length - 1) {
        if (aktywnaKartaWrapped === 1 && document.getElementById('quiz-result') && document.getElementById('quiz-result').classList.contains('hidden')) return; 
        aktywnaKartaWrapped++;
        pokazKartaWrapped(aktywnaKartaWrapped);
    }
};

window.zamknijWrapped = function() {
    clearTimeout(wrappedTimer);
    const overlay = document.getElementById('wrapped-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        ukryjEkran('wrapped-overlay');
        overlay.style.opacity = '1';
        document.getElementById('wrapped-cards').innerHTML = '';
    }, 300);
};

window.odpowiedzQuiz = function(btnEl, wybrana, poprawna, czasGodziny) {
    const resEl = document.getElementById('quiz-result');
    const btns = document.querySelectorAll('.quiz-btn');
    
    btns.forEach(b => {
        b.onclick = null;
        if(b.innerText === poprawna) {
            b.classList.remove('border-white/20', 'bg-white/10', 'hover:bg-white/20', 'shadow-lg');
            b.classList.add('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-300');
        } else if(b.innerText === wybrana && wybrana !== poprawna) {
            b.classList.remove('border-white/20', 'bg-white/10', 'hover:bg-white/20', 'shadow-lg');
            b.classList.add('bg-rose-500/20', 'border-rose-500', 'text-rose-300');
        } else {
            b.classList.add('opacity-30');
        }
    });
    
    resEl.classList.remove('hidden');
    const nextBtnHtml = `<button onclick="wrappedNastepny(); event.stopPropagation();" class="mt-5 w-full px-6 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold backdrop-blur-md hover:bg-white/30 transition-all shadow-lg">Dalej &rarr;</button>`;
    
    if (wybrana === poprawna) {
        resEl.innerHTML = `<span class="text-emerald-400 block mb-1 text-2xl">Trafione!</span><span class="text-sm font-medium text-indigo-100 block mb-2">Spędziłeś tam aż <b class="text-white">${czasGodziny} godzin</b>.</span>` + nextBtnHtml;
    } else {
        resEl.innerHTML = `<span class="text-rose-400 block mb-1 text-2xl">Pudło.</span><span class="text-sm font-medium text-indigo-100 block mb-2">Twoim numerem jeden była <b class="text-white">sala ${poprawna}</b>.</span>` + nextBtnHtml;
    }
    
    clearTimeout(wrappedTimer);
    wrappedTimer = setTimeout(() => { wrappedNastepny(); }, 6000);
};

window.udostepnijIG = async function() {
    const btn = document.querySelector('button[onclick*="udostepnijIG"]');
    const origHtml = btn ? btn.innerHTML : 'Pobierz Grafikę';
    if (btn) {
        btn.innerHTML = 'Generowanie pliku...';
        btn.disabled = true;
    }
    
    const el = document.getElementById('wrapped-share-canvas');
    try {
        await new Promise(r => setTimeout(r, 120));
        const canvas = await html2canvas(el, { 
            scale: 3, 
            backgroundColor: '#f3f2ec', 
            useCORS: true, 
            logging: false,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById('wrapped-share-canvas');
                if (clonedEl) {
                    clonedEl.style.opacity = '1';
                    clonedEl.style.transform = 'none';
                    clonedEl.style.animation = 'none';
                    if (clonedEl.parentElement) {
                        clonedEl.parentElement.style.opacity = '1';
                        clonedEl.parentElement.style.transform = 'none';
                        clonedEl.parentElement.style.animation = 'none';
                    }
                }
            }
        });
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `solna_wrapped_${wStats.miesiac || 'posm'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        pokazAlert("Pobrano grafikę", "Grafika została zapisana na Twoim urządzeniu.");
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    } catch (e) {
        console.error("Błąd pobierania:", e);
        pokazAlert("Wystąpił błąd", "Nie udało się wygenerować obrazu. Spróbuj ponownie.");
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }
};

// ==========================================
// ZARZĄDZANIE SAMORZĄDU + PODGLĄD GŁOSÓW
// ==========================================
function pobierzNazweUczniaPoUid(uid) {
    const u = pelnaBazaUczniow[uid];
    if (u && u.imie_nazwisko) return `${u.imie_nazwisko} (${u.klasa || '-'})`;
    return `Użytkownik (${String(uid).substring(0, 6)})`;
}

window.otworzPodgladGlosowAnkiety = function(id) {
    const a = wszystkieAnkiety[id];
    if (!a) return;
    document.getElementById('podglad-glosow-tytul').innerText = a.tytul || 'Głosy w ankiecie';
    const kontener = document.getElementById('podglad-glosow-lista');
    const opcje = Array.isArray(a.opcje) ? a.opcje : [];
    const glosy = a.glosy || {};

    const grupy = opcje.map(() => []);
    Object.entries(glosy).forEach(([uid, opcIdx]) => {
        if (grupy[opcIdx]) grupy[opcIdx].push(pobierzNazweUczniaPoUid(uid));
    });

    kontener.innerHTML = opcje.map((nazwaOpcji, idx) => {
        const osoby = grupy[idx] || [];
        return `
        <div class="p-4 rounded-xl bg-zinc-900/70 border border-white/10">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                <span class="font-bold text-white text-xs sm:text-sm">${ucieczkaHtml(nazwaOpcji)}</span>
                <span class="emblem emblem-indigo">${osoby.length} gł.</span>
            </div>
            ${osoby.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${osoby.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów na tę opcję.</p>`
            }
        </div>`;
    }).join('');

    pokazEkran('modal-podglad-glosow');
};

window.otworzPodgladGlosowPropozycji = function(id) {
    const p = wszystkiePropozycje[id];
    if (!p) return;
    document.getElementById('podglad-glosow-tytul').innerText = p.tytul || 'Głosy w propozycji';
    const kontener = document.getElementById('podglad-glosow-lista');
    const glosy = p.glosy || {};

    const glosyZa = [], glosyPrzeciw = [];
    Object.entries(glosy).forEach(([uid, typ]) => {
        if (typ === 'za') glosyZa.push(pobierzNazweUczniaPoUid(uid));
        else if (typ === 'przeciw') glosyPrzeciw.push(pobierzNazweUczniaPoUid(uid));
    });

    kontener.innerHTML = `
        <div class="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-emerald-500/20">
                <span class="font-bold text-emerald-300 text-xs sm:text-sm">👍 Głosy ZA</span>
                <span class="emblem emblem-emerald">${glosyZa.length}</span>
            </div>
            ${glosyZa.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${glosyZa.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów poparcia.</p>`
            }
        </div>
        <div class="p-4 rounded-xl bg-rose-950/25 border border-rose-500/30">
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-rose-500/20">
                <span class="font-bold text-rose-300 text-xs sm:text-sm">👎 Głosy PRZECIW</span>
                <span class="emblem emblem-rose">${glosyPrzeciw.length}</span>
            </div>
            ${glosyPrzeciw.length > 0 
                ? `<div class="flex flex-wrap gap-1.5">${glosyPrzeciw.map(os => `<span class="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-200">${ucieczkaHtml(os)}</span>`).join('')}</div>`
                : `<p class="text-[11px] text-zinc-500 italic">Brak głosów sprzeciwu.</p>`
            }
        </div>
    `;
    pokazEkran('modal-podglad-glosow');
};

window.dodajAnkieteSamorzad = function() {
    const t = document.getElementById('nowa-ankieta-tytul').value.trim();
    const o = document.getElementById('nowa-ankieta-opis').value.trim();
    const opStr = document.getElementById('nowa-ankieta-opcje').value.trim();
    
    if (t.length < 5 || opStr.length < 3) { pokazAlert("Uwaga", "Wpisz tytuł i minimum 2 opcje po przecinku."); return; }
    const opcjeArr = opStr.split(',').map(s => s.trim()).filter(Boolean);
    if (opcjeArr.length < 2) { pokazAlert("Uwaga", "Podaj minimum 2 opcje oddzielone przecinkiem."); return; }

    db.ref('samorzad_ankiety').push({
        tytul: t, opis: o, opcje: opcjeArr, czas: terazDataString(), aktywna: true
    }).then(() => {
        document.getElementById('nowa-ankieta-tytul').value = '';
        document.getElementById('nowa-ankieta-opis').value = '';
        document.getElementById('nowa-ankieta-opcje').value = '';
        pokazAlert("Sukces", "Ankieta została opublikowana.");
    });
};

window.zmienStatusAnkiety = function(id, obecnyStatus) { db.ref(`samorzad_ankiety/${id}/aktywna`).set(!obecnyStatus); };

window.usunAnkiete = function(id) {
    pokazConfirm("Usuwanie", "Czy na pewno chcesz bezpowrotnie usunąć tę ankietę?", () => {
        db.ref(`samorzad_ankiety/${id}`).remove();
    });
};

window.renderujAnkietyZarzadzanie = function() {
    const kon = document.getElementById('lista-ankiet-zarzadzanie');
    if (!kon) return;
    const lista = Object.entries(wszystkieAnkiety).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Brak ankiet w systemie.</p>'; return; }

    kon.innerHTML = lista.map(a => {
        const czyAkt = a.aktywna !== false;
        const ileGlosow = a.glosy ? Object.keys(a.glosy).length : 0;
        return `
        <div class="p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h4 class="font-bold text-white text-sm leading-tight">${ucieczkaHtml(a.tytul)}</h4>
                    <p class="text-[10px] text-zinc-500 mt-1">${a.czas || '-'} • Oddanych głosów: <b class="text-zinc-300">${ileGlosow}</b></p>
                </div>
                <span class="emblem ${czyAkt ? 'emblem-emerald' : 'emblem-rose'} shrink-0 text-[9px] px-2 py-1">${czyAkt ? 'Aktywna' : 'Zakończona'}</span>
            </div>
            <div class="flex flex-wrap gap-2 mt-1">
                <button onclick="otworzPodgladGlosowAnkiety('${a.id}')" class="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 font-bold text-xs border border-white/10 transition-colors">👥 Kto głosował (${ileGlosow})</button>
                <button onclick="zmienStatusAnkiety('${a.id}', ${czyAkt})" class="flex-1 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 font-bold text-xs hover:bg-indigo-500/25 transition-colors border border-indigo-500/20">${czyAkt ? 'Zakończ' : 'Wznów'}</button>
                <button onclick="usunAnkiete('${a.id}')" class="px-3.5 py-2 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-xs hover:bg-rose-500/25 transition-colors border border-rose-500/20">Usuń</button>
            </div>
        </div>`;
    }).join('');
};

window.zmienStatusPropozycji = function(id, status) { db.ref(`samorzad_propozycje/${id}/status`).set(status); };

window.zapiszOdpowiedzSamorzadu = function(id) {
    const txt = document.getElementById(`odpowiedz-admina-${id}`).value.trim();
    db.ref(`samorzad_propozycje/${id}/odpowiedz_admina`).set(txt).then(() => {
        pokazAlert("Sukces", "Odpowiedź Samorządu została przypięta do tej propozycji.");
    });
};

window.usunPropozycje = function(id) {
    pokazConfirm("Usuwanie propozycji", "Czy na pewno usunąć tę propozycję zgłoszoną przez ucznia?", () => {
        db.ref(`samorzad_propozycje/${id}`).remove();
    });
};

window.renderujPropozycjeZarzadzanie = function() {
    const kon = document.getElementById('lista-propozycji-zarzadzanie');
    if (!kon) return;
    const lista = Object.entries(wszystkiePropozycje).map(e => Object.assign({ id: e[0] }, e[1])).sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
    if (lista.length === 0) { kon.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Nikt jeszcze nie zgłosił żadnej propozycji.</p>'; return; }

    kon.innerHTML = lista.map(p => {
        const st = p.status || 'Nowa';
        const ileGlosow = p.glosy ? Object.keys(p.glosy).length : 0;
        return `
        <div class="p-4 sm:p-5 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
                <div>
                    <h4 class="font-bold text-white text-sm">${ucieczkaHtml(p.tytul)}</h4>
                    <p class="text-[10px] text-zinc-400 mt-1">${ucieczkaHtml(p.anonim ? `Anonimowo (Autor: ${p.autor_prawdziwy})` : p.autor_prawdziwy)} • ${p.czas}</p>
                </div>
                <select onchange="zmienStatusPropozycji('${p.id}', this.value)" class="input-classic rounded-lg text-xs py-1.5 px-3 cursor-pointer w-full sm:w-auto font-bold text-amber-300">
                    <option value="Nowa" ${st === 'Nowa' ? 'selected' : ''}>📌 Nowa</option>
                    <option value="Zaakceptowana" ${st === 'Zaakceptowana' ? 'selected' : ''}>✅ Zaakceptowana</option>
                    <option value="W realizacji" ${st === 'W realizacji' ? 'selected' : ''}>⏳ W realizacji</option>
                    <option value="Odrzucona" ${st === 'Odrzucona' ? 'selected' : ''}>❌ Odrzucona</option>
                </select>
            </div>
            <div class="p-3 bg-[#0a0a0f] rounded-lg border border-white/5">
                <p class="text-xs text-zinc-300 italic whitespace-pre-line">"${ucieczkaHtml(p.opis)}"</p>
            </div>
            <div class="flex flex-col gap-2 mt-2">
                <label class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Oficjalna Odpowiedź Samorządu:</label>
                <textarea id="odpowiedz-admina-${p.id}" class="input-classic rounded-xl p-3 text-xs w-full resize-none leading-relaxed" rows="2" placeholder="Wpisz odpowiedź, która będzie widoczna dla wszystkich...">${ucieczkaHtml(p.odpowiedz_admina || '')}</textarea>
                <div class="flex flex-wrap gap-2 mt-1">
                    <button onclick="otworzPodgladGlosowPropozycji('${p.id}')" class="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 font-bold text-xs border border-white/10 transition-colors">👥 Kto głosował (${ileGlosow})</button>
                    <button onclick="zapiszOdpowiedzSamorzadu('${p.id}')" class="flex-1 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs hover:bg-indigo-500/30 transition-colors border border-indigo-500/30">Zapisz i Opublikuj</button>
                    <button onclick="usunPropozycje('${p.id}')" class="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 font-bold text-xs hover:bg-rose-500/25 transition-colors border border-rose-500/20">Usuń</button>
                </div>
            </div>
        </div>`;
    }).join('');
};

if (zalogowanyUczen && zalogowanyUczen.rola === 'samorzad') {
    renderujAnkietyZarzadzanie();
    renderujPropozycjeZarzadzanie();
}