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

let wszystkieLogi = [];
let aktualnieFiltrowaneLogi = [];
let statusySal = {};
let usterkiSal = {};
let bazaUczniow = {};
let zgodyWeekendowe = {};
let zgodyGoscie = {};
let aktywneWydania = {};
let obecnyTryb = 'last7';
let nazwaOkresu = 'Ostatnie_7_dni';
let trybWykresu1 = 'top'; 
let globalnyRankingSal = [];
let zaznaczeniUczniowieZgody = new Set();
let czyZaawansowaneZgodyOtwarte = false;

function ukryjEkran(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.classList.add('hidden');
    }
}
function pokazEkran(id, typ = 'flex') {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        el.style.setProperty('display', typ, 'important');
    }
}

// Funkcja parsująca czas (rozwiązuje problem wysypywania się sal)
function parsowacCzas(czasStr) {
    if (!czasStr) return Date.now();
    const bezpiecznyFormat = String(czasStr).replace(' ', 'T');
    const zdekodowany = Date.parse(bezpiecznyFormat);
    return isNaN(zdekodowany) ? Date.now() : zdekodowany;
}

// Funkcja pomocnicza dla Excela
function wyciagnijTekstKomorki(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && val.richText) {
        return val.richText.map(rt => rt.text).join('');
    }
    return String(val).trim();
}

const grupySal = [
    { id: 'IIst', nazwa: 'Szkoła II stopnia', emblem: 'emblem-rose', sale: ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','122','128','129','130','131','132','140','141','142','143','144','145','146','147'] },
    { id: 'Ist', nazwa: 'Szkoła I stopnia', emblem: 'emblem-emerald', sale: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','22','40','41','42','43','44','45','46','47','48','49','52','57B'] },
    { id: 'Jazz', nazwa: 'Sale Jazzowe', emblem: 'emblem-blue', sale: ['01','02','03','04','06','07','08'] },
    { id: 'Inne', nazwa: 'Sale Inne', emblem: 'emblem-amber', sale: ['Koncertowa','Kameralna','Lustrzana','Kryształowa'] }
];

const konfWyk = {
    1: { idx: 0, opcje: [{id: 'bar', n: 'Słupkowy'}, {id: 'pie', n: 'Kołowy'}, {id: 'doughnut', n: 'Pierścień'}] },
    2: { idx: 0, opcje: [{id: 'line', n: 'Liniowy'}, {id: 'bar', n: 'Słupkowy'}] },
    3: { idx: 1, opcje: [{id: 'bar', n: 'Słupkowy'}, {id: 'pie', n: 'Kołowy'}, {id: 'doughnut', n: 'Pierścień'}] },
    4: { idx: 0, opcje: [{id: 'line', n: 'Liniowy'}, {id: 'bar', n: 'Słupkowy'}] }
};

const instancjeW = { 1: null, 2: null, 3: null, 4: null };
const daneWykresow = { 1: {}, 2: {}, 3: {}, 4: {} };

const poleHasla = document.getElementById("pole-hasla");
if (poleHasla) {
    poleHasla.addEventListener("keypress", function(e) {
        if (e.key === "Enter") zaloguj();
    });
}

function ucieczkaHtml(tekst) {
    if (!tekst) return "";
    return String(tekst).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function usunPolskieZnaki(str) {
    if (!str) return "";
    const mapa = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    return String(str).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => mapa[c] || c).toLowerCase().trim();
}

function formatujDateYMD(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatujDateKrotkaPL(ymd) {
    if (!ymd) return '';
    const p = ymd.split('-');
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : ymd;
}

function dataSprzedDni(ile, bazaDataStr) {
    const d = bazaDataStr ? new Date(bazaDataStr + 'T12:00:00') : new Date();
    d.setDate(d.getDate() - ile);
    return formatujDateYMD(d);
}

function dzisiajDataString() { return formatujDateYMD(new Date()); }
function biezacyMiesiacString() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function formatujDateTeraz() { const d = new Date(); return formatujDateYMD(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); }
function biezacyTydzienISO() {
    const d = new Date(); const t = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7; t.setDate(t.getDate() - dayNr + 3);
    const firstThursday = t.valueOf(); t.setMonth(0, 1);
    if (t.getDay() !== 4) { t.setMonth(0, 1 + ((4 - t.getDay()) + 7) % 7); }
    return d.getFullYear() + '-W' + String(1 + Math.ceil((firstThursday - t) / 604800000)).padStart(2, '0');
}

function czyPracownik(rola) {
    return ['nauczyciel', 'pracownik', 'administracja', 'obsluga'].includes(String(rola).toLowerCase());
}

function czyPojedynczyInstrumentJazzowy(nazwa) {
    const t = usunPolskieZnaki(nazwa || "");
    if (!t || t.includes("klasycz")) return false;
    const slowaJazz = ['jazz', 'rozrywk', 'big band', 'big-band', 'estradow', 'gitara elektryczna', 'gitara basowa', 'wokalistyka jazz', 'spiew jazz'];
    return slowaJazz.some(s => t.includes(s));
}

function czyUczenMaInstrumentJazzowy(uczen) {
    if (!uczen) return false;
    if (czyPracownik(uczen.rola) || uczen.jazz === true || uczen.wydzial_jazzowy === true) return true;
    return czyPojedynczyInstrumentJazzowy(uczen.instrument) || czyPojedynczyInstrumentJazzowy(uczen.instrument2 || uczen.instrument_2 || uczen.drugi_instrument);
}

function formatujInstrumentyUcznia(uczen) {
    if (!uczen) return "-";
    const i1 = (uczen.instrument || "").trim();
    const i2 = (uczen.instrument2 || uczen.instrument_2 || uczen.drugi_instrument || "").trim();
    if (i1 && i2) return `${i1} / ${i2}`;
    return i1 || i2 || "-";
}

function wygenerujLoginZImienia(imie) {
    if (!imie) return "uczen";
    const cz = usunPolskieZnaki(imie).replace(/-/g, ' ').split(/\s+/).filter(Boolean);
    if (cz.length > 1) { return cz[0].charAt(0) + '.' + cz.slice(1).join('.'); }
    return cz[0] || "uczen";
}

function losujHaslo9Cyfr() { return String(Math.floor(100000000 + Math.random() * 900000000)); }

function generujIdKonta(mapa) {
    const z = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let k = "";
    do { k = "U"; for (let i = 0; i < 7; i++) k += z.charAt(Math.floor(Math.random() * z.length)); } while (mapa && mapa[k]);
    return k;
}

firebase.auth().onAuthStateChanged(user => {
    const loader = document.getElementById('ekran-ladowania');
    if (user) {
        ukryjEkran('ekran-logowania');
        pokazEkran('ekran-dashboardu', 'flex');
        uruchomSystem();
    } else {
        ukryjEkran('ekran-dashboardu');
        pokazEkran('ekran-logowania', 'flex');
    }
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { ukryjEkran('ekran-ladowania'); }, 300);
    }
});

function zaloguj() {
    const h = document.getElementById('pole-hasla').value.trim();
    const errEl = document.getElementById('komunikat-bledu');
    
    if (!h) { errEl.innerText = "Proszę wpisać hasło."; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    
    const btn = document.querySelector('button[onclick="zaloguj()"]');
    const orgText = btn ? btn.innerText : 'Odblokuj Panel';
    if (btn) { btn.innerText = "Sprawdzanie..."; btn.disabled = true; }
    
    firebase.auth().signInWithEmailAndPassword("admin@posm.pl", h)
        .then(() => {
            if (btn) { btn.innerText = orgText; btn.disabled = false; }
            errEl.classList.add('hidden');
            ukryjEkran('ekran-logowania');
            pokazEkran('ekran-dashboardu', 'flex');
            uruchomSystem(); 
        })
        .catch((error) => {
            if (btn) { btn.innerText = orgText; btn.disabled = false; }
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') { errEl.innerText = "Nieprawidłowe hasło dostępu."; } 
            else if (error.code === 'auth/network-request-failed') { errEl.innerText = "Błąd sieci. Sprawdź połączenie z internetem."; } 
            else { errEl.innerText = "Wystąpił błąd autoryzacji: " + error.message; }
            errEl.classList.remove('hidden');
        });
}

function wyloguj() { firebase.auth().signOut().then(() => location.reload()); }

function zmienZakladke(nazwa) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const aktywnyBtn = document.getElementById('btn-tab-' + nazwa);
    if (aktywnyBtn) aktywnyBtn.classList.add('active');

    ['statystyki', 'podglad', 'zgody', 'logi', 'narzedzia'].forEach(id => {
        if (id === nazwa) { pokazEkran('zakladka-' + id); } 
        else { ukryjEkran('zakladka-' + id); }
    });
}

function sprawdzAutomatycznyResetPolnoc(dane) {
    const dzis = dzisiajDataString();
    const teraz = formatujDateTeraz();
    
    for (const [nr, info] of Object.entries(dane)) {
        if (info && typeof info === 'object' && info.status === 'ZAJĘTA' && info.czas) {
            const dataWpisu = info.czas.substring(0, 10);
            if (dataWpisu < dzis) {
                const opisAuto = info.kto ? (info.kto + ' [Zwrot automatyczny]') : 'Zwrot automatyczny';
                db.ref('sale_aktualne/' + nr).set({ status: 'WOLNA', kto: '', czas: teraz });
                db.ref('statystyki_logi').push({ sala: nr, akcja: 'WOLNA', czas: dataWpisu + ' 23:59:59', kto: opisAuto, auto_reset: true });
            }
        }
    }
}

function przetworzPobraneLogi(suroweDane) {
    if (suroweDane) {
        wszystkieLogi = Object.values(suroweDane)
            .filter(x => x && typeof x === 'object' && x.czas)
            .sort((a, b) => String(a.czas).localeCompare(String(b.czas)));
    } else {
        wszystkieLogi = [];
    }
    uzupelnijZwrotyLogow(wszystkieLogi);
    obliczAktywneWydania(wszystkieLogi);

    const zOd = document.getElementById('zeszyt-od');
    const zDo = document.getElementById('zeszyt-do');
    
    if (wszystkieLogi.length > 0) {
        const ostData = wszystkieLogi[wszystkieLogi.length - 1].czas.substring(0, 10);
        if (zOd && !zOd.dataset.zmieniono) zOd.value = dataSprzedDni(7, ostData);
        if (zDo && !zDo.dataset.zmieniono) zDo.value = ostData > dzisiajDataString() ? ostData : dzisiajDataString();
    }

    zastosujFiltry();
    odswiezWidokLive();
    odswiezTabelaLogow(wszystkieLogi);
}

let systemUruchomiony = false;
function uruchomSystem() {
    if (systemUruchomiony) return;
    systemUruchomiony = true;

    wygenerujNajblizszeWeekendy();
    const zgMies = document.getElementById('zgoda-miesiac');
    if (zgMies && !zgMies.value) zgMies.value = biezacyMiesiacString();

    const gDataOd = document.getElementById('gosc-data-od');
    const gDataDo = document.getElementById('gosc-data-do');
    if (gDataOd && !gDataOd.value) gDataOd.value = dzisiajDataString();
    if (gDataDo && !gDataDo.value) gDataDo.value = dzisiajDataString();

    db.ref('uczniowie').on('value', snap => {
        bazaUczniow = snap.val() || {};
        renderujTabeleKont();
        filtrujSelectUczniowZgody();
    });

    db.ref('statystyki_logi').limitToLast(1500).on('value', snap => {
        przetworzPobraneLogi(snap.val());
    }, err => {
        db.ref('statystyki_logi').on('value', snap2 => przetworzPobraneLogi(snap2.val()));
    });

    db.ref('sale_aktualne').on('value', snap => {
        statusySal = snap.val() || {};
        sprawdzAutomatycznyResetPolnoc(statusySal);
        odswiezWidokLive();
        szukajUcznia();
    });

    db.ref('usterki_sal').on('value', snap => {
        usterkiSal = snap.val() || {};
        renderujUsterkiLive();
        odswiezWidokLive();
    });

    db.ref('zgody_weekendowe').on('value', snap => {
        const raw = snap.val() || {};
        const dzis = dzisiajDataString();
        const bMies = biezacyMiesiacString();
        const aktywne = {};

        Object.entries(raw).forEach(([id, z]) => {
            if (!z || typeof z !== 'object') return;
            if (z.typ === 'miesiac' && z.miesiac && z.miesiac < bMies) { 
                db.ref('zgody_weekendowe/' + id).remove(); 
                return; 
            }
            if (z.typ !== 'miesiac') {
                const ost = (z.data_niedziela && z.data_niedziela > (z.data_sobota || '')) ? z.data_niedziela : (z.data_sobota || '');
                if (ost && ost < dzis) { 
                    db.ref('zgody_weekendowe/' + id).remove(); 
                    return; 
                }
            }
            aktywne[id] = z;
        });

        zgodyWeekendowe = aktywne;
        renderujZgodyAdmin();
    });

    db.ref('zgody_goscie').on('value', snap => {
        const raw = snap.val() || {};
        const dzis = dzisiajDataString();
        const aktywne = {};
        
        Object.entries(raw).forEach(([id, z]) => {
            if (z.data_do && z.data_do < dzis) {
                db.ref('zgody_goscie/' + id).remove();
            } else {
                aktywne[id] = z;
            }
        });
        
        zgodyGoscie = aktywne;
        renderujZgodyGosciAdmin();
    });

    setInterval(aktualizujLicznikiCzasu, 10000);
}

// --- LOGIKA ZGÓD GOŚCI (I Grup) ---
window.przelaczTabZgod = function(tab) {
    if(tab === 'uczniowie') {
        document.getElementById('tab-btn-uczniowie').className = "flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all";
        document.getElementById('tab-btn-goscie').className = "flex-1 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-bold transition-all";
        pokazEkran('form-zgody-uczniowie', 'flex');
        ukryjEkran('form-zgody-goscie');
    } else {
        document.getElementById('tab-btn-uczniowie').className = "flex-1 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-bold transition-all";
        document.getElementById('tab-btn-goscie').className = "flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold transition-all";
        ukryjEkran('form-zgody-uczniowie');
        pokazEkran('form-zgody-goscie', 'flex');
    }
};

window.dodajZgodeGoscia = async function() {
    const imie = document.getElementById('gosc-imie').value.trim();
    const osobaOdp = document.getElementById('gosc-osoba-odp').value.trim();
    const telefon = document.getElementById('gosc-telefon').value.trim();
    const dataOd = document.getElementById('gosc-data-od').value;
    const dataDo = document.getElementById('gosc-data-do').value;
    const godzOd = document.getElementById('gosc-godz-od').value;
    const godzDo = document.getElementById('gosc-godz-do').value;
    const kom = document.getElementById('gosc-komentarz').value.trim();
    const saleDoz = document.getElementById('gosc-sale-dozwolone').value.trim();
    const wystawil = document.getElementById('gosc-wystawil').value.trim();

    if(imie.length < 3) { alert("Podaj nazwę wydarzenia lub imię gościa."); return; }
    if(!dataOd || !dataDo) { alert("Wybierz zakres dat."); return; }
    if(dataOd > dataDo) { alert("Data 'do' nie może być wcześniejsza niż 'od'."); return; }
    if(!godzOd || !godzDo) { alert("Wybierz prawidłowe godziny wstępu."); return; }

    const teraz = formatujDateTeraz();
    
    await db.ref('zgody_goscie').push({
        imie_nazwisko: imie,
        osoba_odp: osobaOdp,
        telefon: telefon,
        data_od: dataOd,
        data_do: dataDo,
        godz_od: godzOd,
        godz_do: godzDo,
        komentarz: kom,
        sale_dozwolone: saleDoz,
        wystawil: wystawil,
        utworzono: teraz
    });

    document.getElementById('gosc-imie').value = '';
    document.getElementById('gosc-osoba-odp').value = '';
    document.getElementById('gosc-telefon').value = '';
    document.getElementById('gosc-komentarz').value = '';
    document.getElementById('gosc-sale-dozwolone').value = '';
    
    alert("Wydarzenie / Gość z zewnątrz dodany do systemu.");
};

window.usunZgodeGoscia = function(id) {
    if(confirm("Usunąć ten wpis z systemu?")) {
        db.ref('zgody_goscie/' + id).remove();
    }
};

window.otworzEdycjeGoscia = function(id) {
    const z = zgodyGoscie[id];
    if(!z) return;
    
    document.getElementById('edit-gosc-id').value = id;
    document.getElementById('edit-gosc-imie').value = z.imie_nazwisko || '';
    document.getElementById('edit-gosc-od').value = z.data_od || '';
    document.getElementById('edit-gosc-do').value = z.data_do || '';
    document.getElementById('edit-gosc-godz-od').value = z.godz_od || '';
    document.getElementById('edit-gosc-godz-do').value = z.godz_do || '';
    document.getElementById('edit-gosc-osoba').value = z.osoba_odp || '';
    document.getElementById('edit-gosc-tel').value = z.telefon || '';
    document.getElementById('edit-gosc-sale').value = z.sale_dozwolone || '';
    document.getElementById('edit-gosc-komentarz').value = z.komentarz || '';
    document.getElementById('edit-gosc-wystawil').value = z.wystawil || '';
    
    pokazEkran('modal-edycja-goscia');
};

window.zapiszEdycjeGoscia = function() {
    const id = document.getElementById('edit-gosc-id').value;
    if(!id) return;
    
    db.ref('zgody_goscie/' + id).update({
        imie_nazwisko: document.getElementById('edit-gosc-imie').value.trim(),
        data_od: document.getElementById('edit-gosc-od').value,
        data_do: document.getElementById('edit-gosc-do').value,
        godz_od: document.getElementById('edit-gosc-godz-od').value,
        godz_do: document.getElementById('edit-gosc-godz-do').value,
        osoba_odp: document.getElementById('edit-gosc-osoba').value.trim(),
        telefon: document.getElementById('edit-gosc-tel').value.trim(),
        sale_dozwolone: document.getElementById('edit-gosc-sale').value.trim(),
        komentarz: document.getElementById('edit-gosc-komentarz').value.trim(),
        wystawil: document.getElementById('edit-gosc-wystawil').value.trim()
    }).then(() => {
        ukryjEkran('modal-edycja-goscia');
    });
};

function renderujZgodyGosciAdmin() {
    const kontener = document.getElementById('lista-zgod-goscie-admin');
    if(!kontener) return;
    kontener.innerHTML = '';
    
    const lista = Object.entries(zgodyGoscie)
        .map(([id, val]) => Object.assign({ id }, val))
        .sort((a, b) => (b.utworzono || '').localeCompare(a.utworzono || ''));

    if (lista.length === 0) {
        kontener.innerHTML = '<p class="text-xs text-slate-400 text-center py-6 border border-white/5 bg-slate-950/40 rounded-xl">Brak zgłoszonych grup/gości.</p>';
        return;
    }

    lista.forEach(z => {
        const dataWyswietlana = (z.data_od === z.data_do) 
            ? formatujDateKrotkaPL(z.data_od) 
            : `${formatujDateKrotkaPL(z.data_od)} – ${formatujDateKrotkaPL(z.data_do)}`;
        
        kontener.innerHTML += `
            <div class="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div class="flex flex-col gap-1 w-full">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-extrabold text-white text-sm">${ucieczkaHtml(z.imie_nazwisko)} <span class="text-amber-400 font-normal text-xs bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Wydarzenie / Gość</span></span>
                        <span class="emblem emblem-amber bg-transparent border-0 p-0 shadow-none text-[11px]">${dataWyswietlana}</span>
                    </div>
                    <div class="text-xs text-slate-300 mt-0.5">
                        Dostęp: <b>${ucieczkaHtml(z.godz_od)} – ${ucieczkaHtml(z.godz_do)}</b>
                    </div>
                    ${z.osoba_odp ? `<div class="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20 mt-1 inline-block w-max">Odp: <b>${ucieczkaHtml(z.osoba_odp)}</b> ${z.telefon ? `(📞 ${ucieczkaHtml(z.telefon)})` : ''}</div>` : ''}
                    ${z.sale_dozwolone ? `<div class="text-[11px] text-blue-300 mt-1 font-bold">Dozwolone sale: ${ucieczkaHtml(z.sale_dozwolone)}</div>` : ''}
                    ${z.komentarz ? `<div class="text-[11px] text-amber-300 mt-1">Uwagi: ${ucieczkaHtml(z.komentarz)}</div>` : ''}
                    ${z.wystawil ? `<div class="text-[10px] text-zinc-500 mt-1 uppercase">Wystawił(a): ${ucieczkaHtml(z.wystawil)}</div>` : ''}
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="otworzEdycjeGoscia('${z.id}')" class="bg-blue-500/20 hover:bg-blue-600/30 text-blue-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">Edytuj</button>
                    <button onclick="usunZgodeGoscia('${z.id}')" class="bg-rose-500/15 hover:bg-rose-600/30 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">Usuń</button>
                </div>
            </div>`;
    });
}
// --- KONIEC LOGIKI ZGÓD GOŚCI ---

function wygenerujNajblizszeWeekendy() {
    const select = document.getElementById('zgoda-prosty-weekend');
    if (!select) return;
    
    select.innerHTML = '';
    const dzis = new Date();
    dzis.setHours(12, 0, 0, 0);
    const pierwszaSobota = new Date(dzis);
    
    if (dzis.getDay() === 0) {
        pierwszaSobota.setDate(dzis.getDate() - 1);
    } else {
        pierwszaSobota.setDate(dzis.getDate() + (6 - dzis.getDay()));
    }

    for (let i = 0; i < 8; i++) {
        const sob = new Date(pierwszaSobota);
        sob.setDate(pierwszaSobota.getDate() + i * 7);
        const ndz = new Date(sob);
        ndz.setDate(sob.getDate() + 1);

        const sobYMD = formatujDateYMD(sob);
        const ndzYMD = formatujDateYMD(ndz);

        const opt = document.createElement('option');
        opt.value = `${sobYMD}|${ndzYMD}`;
        opt.innerText = `${formatujDateKrotkaPL(sobYMD)} – ${formatujDateKrotkaPL(ndzYMD)}` + (i === 0 ? ' (Najbliższy weekend)' : '');
        select.appendChild(opt);
    }
}

window.wymusDzienTygodnia = function(inputEl, oczekiwanyDzien) {
    if (!inputEl.value) return;
    const p = inputEl.value.split('-');
    const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0);
    if (d.getDay() !== oczekiwanyDzien) {
        alert('W tym polu można wybrać wyłącznie ' + (oczekiwanyDzien === 6 ? 'sobotę' : 'niedzielę') + '!');
        inputEl.value = '';
    }
};

window.przelaczZaawansowaneZgody = function() {
    czyZaawansowaneZgodyOtwarte = !czyZaawansowaneZgodyOtwarte;
    const panel = document.getElementById('zgoda-panel-zaawansowany');
    const btn = document.getElementById('btn-zgoda-zaawansowane');
    
    if (!panel) return;
    
    if (czyZaawansowaneZgodyOtwarte) {
        pokazEkran('zgoda-panel-zaawansowany');
        if (btn) btn.innerText = 'Ukryj opcje zaawansowane';
    } else {
        ukryjEkran('zgoda-panel-zaawansowany');
        const zgodaTyp = document.getElementById('zgoda-typ');
        if (zgodaTyp) zgodaTyp.value = 'weekend_lista';
        przelaczTypZgodyUI();
        if (btn) btn.innerHTML = '<span>Zaawansowane (pojedyncze dni, godziny)</span>';
    }
};

window.przelaczTypZgodyUI = function() {
    const typ = document.getElementById('zgoda-typ')?.value || 'weekend_lista';
    const boxKonkretny = document.getElementById('zgoda-box-konkretny');
    const boxMiesiac = document.getElementById('zgoda-box-miesiac');
    const sekcjaProsta = document.getElementById('zgoda-sekcja-prosta');

    if (boxKonkretny) { ukryjEkran('zgoda-box-konkretny'); }
    if (boxMiesiac) { ukryjEkran('zgoda-box-miesiac'); }

    if (typ === 'miesiac' && boxMiesiac) {
        if (sekcjaProsta) ukryjEkran('zgoda-sekcja-prosta');
        pokazEkran('zgoda-box-miesiac', 'grid');
    } else if (typ === 'konkretny' && boxKonkretny) {
        if (sekcjaProsta) ukryjEkran('zgoda-sekcja-prosta');
        pokazEkran('zgoda-box-konkretny', 'grid');
    } else {
        if (sekcjaProsta) pokazEkran('zgoda-sekcja-prosta');
    }
};

function aktualizujLicznikZaznaczonychZgody() {
    const el = document.getElementById('zgoda-licznik-wybranych');
    if (el) el.innerText = zaznaczeniUczniowieZgody.size;
}

window.przelaczUczniaZgody = function(uid, isChecked) {
    if (isChecked) {
        zaznaczeniUczniowieZgody.add(uid);
    } else {
        zaznaczeniUczniowieZgody.delete(uid);
    }
    aktualizujLicznikZaznaczonychZgody();
};

window.zaznaczWidocznychUczniowZgody = function() {
    document.querySelectorAll('.checkbox-uczen-zgoda').forEach(cb => {
        cb.checked = true;
        zaznaczeniUczniowieZgody.add(cb.value);
    });
    aktualizujLicznikZaznaczonychZgody();
};

window.odznaczWszystkichUczniowZgody = function() {
    zaznaczeniUczniowieZgody.clear();
    document.querySelectorAll('.checkbox-uczen-zgoda').forEach(cb => {
        cb.checked = false;
    });
    aktualizujLicznikZaznaczonychZgody();
};

window.filtrujSelectUczniowZgody = function() {
    const kontener = document.getElementById('zgoda-lista-uczniow');
    const szukane = (document.getElementById('zgoda-szukaj-ucznia')?.value || '').trim().toLowerCase();
    
    const lista = Object.entries(bazaUczniow)
        .filter(e => e[1] && e[1].imie_nazwisko && !czyPracownik(e[1].rola))
        .sort((a, b) => a[1].imie_nazwisko.localeCompare(b[1].imie_nazwisko));

    if (kontener) {
        kontener.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        lista.forEach(([uid, u]) => {
            const opis = `${u.imie_nazwisko} (${u.klasa || '-'})`;
            if (szukane && !opis.toLowerCase().includes(szukane)) return;
            
            const czyZaznaczony = zaznaczeniUczniowieZgody.has(uid) ? 'checked' : '';
            const lbl = document.createElement('label');
            lbl.className = "flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer select-none text-xs rounded-lg";
            lbl.innerHTML = `<input type="checkbox" value="${ucieczkaHtml(uid)}" ${czyZaznaczony} onchange="przelaczUczniaZgody(this.value, this.checked)" class="checkbox-uczen-zgoda w-4 h-4 accent-emerald-500 rounded shrink-0">` +
                `<span class="font-semibold text-white truncate">${ucieczkaHtml(u.imie_nazwisko)} <span class="text-slate-400 font-normal">(${ucieczkaHtml(u.klasa || '-')})</span></span>`;
            fragment.appendChild(lbl);
        });
        kontener.appendChild(fragment);
    }
};

window.dodajZgodeWeekendowa = async function() {
    let wybrani = Array.from(zaznaczeniUczniowieZgody).filter(uid => bazaUczniow[uid]);
    
    if (wybrani.length === 0) { alert("Zaznacz przynajmniej jednego ucznia na liście."); return; }

    const prostyEl = document.getElementById('zgoda-prosty-weekend');
    const typ = (czyZaawansowaneZgodyOtwarte || !prostyEl) ? (document.getElementById('zgoda-typ')?.value || 'konkretny') : 'weekend_lista';
    const sobOd = document.getElementById('zgoda-sob-od')?.value || '17:00';
    const sobDo = document.getElementById('zgoda-sob-do')?.value || '19:00';
    const ndzOd = document.getElementById('zgoda-ndz-od')?.value || '08:00';
    const ndzDo = document.getElementById('zgoda-ndz-do')?.value || '19:00';
    const komentarz = (document.getElementById('zgoda-komentarz')?.value || '').trim();
    const wystawil = (document.getElementById('zgoda-wystawil')?.value || '').trim();

    let daneTerminu = {};

    if (typ === 'weekend_lista' && prostyEl) {
        const p = prostyEl.value;
        if (!p) { alert("Wybierz weekend."); return; }
        const czesci = p.split('|');
        daneTerminu = { typ: 'konkretny', data_sobota: czesci[0] || '', data_niedziela: czesci[1] || '' };
    } else if (typ === 'konkretny') {
        const dSob = document.getElementById('zgoda-data-sob')?.value || '';
        const dNdz = document.getElementById('zgoda-data-ndz')?.value || '';
        if (!dSob && !dNdz) { alert("Wybierz datę soboty lub niedzieli."); return; }
        daneTerminu = { typ: 'konkretny', data_sobota: dSob, data_niedziela: dNdz };
    } else {
        const mies = document.getElementById('zgoda-miesiac')?.value;
        if (!mies) { alert("Wybierz miesiąc obowiązywania zgody."); return; }
        daneTerminu = { typ: 'miesiac', miesiac: mies, dni_miesiaca: document.getElementById('zgoda-dni-miesiaca')?.value || 'oba' };
    }

    const teraz = formatujDateTeraz();
    const updates = {};

    wybrani.forEach(uid => {
        const u = bazaUczniow[uid];
        const nowyKlucz = db.ref('zgody_weekendowe').push().key;
        updates[nowyKlucz] = Object.assign({
            uid: uid, imie_nazwisko: u.imie_nazwisko, klasa: u.klasa || '-',
            sob_od: sobOd, sob_do: sobDo, ndz_od: ndzOd, ndz_do: ndzDo,
            komentarz: komentarz, wystawil: wystawil, utworzono: teraz
        }, daneTerminu);
    });

    await db.ref('zgody_weekendowe').update(updates);
    
    if (document.getElementById('zgoda-komentarz')) { document.getElementById('zgoda-komentarz').value = ''; }
    odznaczWszystkichUczniowZgody();
    alert("Wydano zgodę weekendową dla " + wybrani.length + " osób.");
};

window.usunZgodeWeekendowa = function(idZgody) { 
    if(confirm("Usunąć ten wpis z systemu?")) db.ref('zgody_weekendowe/' + idZgody).remove(); 
};
window.wyczyscWszystkieZgody = function() { if (confirm("Czy na pewno chcesz usunąć wszystkie wydane zgody weekendowe?")) { db.ref('zgody_weekendowe').remove(); } };

window.otworzEdycjeZgodyUcznia = function(id) {
    const z = zgodyWeekendowe[id];
    if(!z) return;
    
    document.getElementById('edit-zgoda-u-id').value = id;
    document.getElementById('edit-zu-imie').innerText = z.imie_nazwisko;
    document.getElementById('edit-zu-sob-od').value = z.sob_od || '';
    document.getElementById('edit-zu-sob-do').value = z.sob_do || '';
    document.getElementById('edit-zu-ndz-od').value = z.ndz_od || '';
    document.getElementById('edit-zu-ndz-do').value = z.ndz_do || '';
    document.getElementById('edit-zu-kom').value = z.komentarz || '';
    document.getElementById('edit-zu-wystawil').value = z.wystawil || '';
    
    pokazEkran('modal-edycja-zgody-uczen');
};

window.zapiszEdycjeZgodyUcznia = function() {
    const id = document.getElementById('edit-zgoda-u-id').value;
    if(!id) return;
    
    db.ref('zgody_weekendowe/' + id).update({
        sob_od: document.getElementById('edit-zu-sob-od').value,
        sob_do: document.getElementById('edit-zu-sob-do').value,
        ndz_od: document.getElementById('edit-zu-ndz-od').value,
        ndz_do: document.getElementById('edit-zu-ndz-do').value,
        komentarz: document.getElementById('edit-zu-kom').value.trim(),
        wystawil: document.getElementById('edit-zu-wystawil').value.trim()
    }).then(() => {
        ukryjEkran('modal-edycja-zgody-uczen');
    });
};

function renderujZgodyAdmin() {
    const kontener = document.getElementById('lista-zgod-admin');
    const badge = document.getElementById('badge-zgody-nav');
    
    if (!kontener) return;
    kontener.innerHTML = '';
    
    const lista = Object.entries(zgodyWeekendowe)
        .map(([id, val]) => Object.assign({ id }, val))
        .sort((a, b) => (b.utworzono || '').localeCompare(a.utworzono || ''));
        
    if (lista.length > 0) {
        if (badge) { badge.innerText = lista.length; pokazEkran('badge-zgody-nav', 'inline-flex'); }
    } else {
        if (badge) ukryjEkran('badge-zgody-nav');
        kontener.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Brak aktywnych zgód weekendowych.</p>';
        return;
    }

    lista.forEach(z => {
        let opisTerminu = '';
        if (z.typ === 'miesiac') {
            const dniTekst = z.dni_miesiaca === 'sobota' ? 'Soboty' : (z.dni_miesiaca === 'niedziela' ? 'Niedziele' : 'Soboty i Niedziele');
            opisTerminu = `<span class="emblem emblem-emerald">Miesiąc: ${ucieczkaHtml(z.miesiac)} (${dniTekst})</span>`;
        } else {
            const czesci = [];
            if (z.data_sobota) czesci.push('Sob ' + formatujDateKrotkaPL(z.data_sobota));
            if (z.data_niedziela) czesci.push('Ndz ' + formatujDateKrotkaPL(z.data_niedziela));
            opisTerminu = `<span class="emblem emblem-blue">${ucieczkaHtml(czesci.join(' – '))}</span>`;
        }

        kontener.innerHTML += `<div class="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="flex flex-col gap-1 w-full">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-extrabold text-white text-sm">${ucieczkaHtml(z.imie_nazwisko)} <span class="text-slate-400 font-normal">(${ucieczkaHtml(z.klasa)})</span></span>
                    ${opisTerminu}
                </div>
                <div class="text-xs text-slate-300 mt-0.5">
                    ${(z.data_sobota || z.typ === 'miesiac') ? `Sobota: <b>${ucieczkaHtml(z.sob_od)}–${ucieczkaHtml(z.sob_do)}</b> ` : ''}
                    ${(z.data_niedziela || z.typ === 'miesiac') ? `Niedziela: <b>${ucieczkaHtml(z.ndz_od)}–${ucieczkaHtml(z.ndz_do)}</b>` : ''}
                </div>
                ${z.komentarz ? `<div class="text-[11px] text-amber-300 mt-1">Uwagi: ${ucieczkaHtml(z.komentarz)}</div>` : ''}
                ${z.wystawil ? `<div class="text-[10px] text-zinc-500 mt-1 uppercase">Wystawił(a): ${ucieczkaHtml(z.wystawil)}</div>` : ''}
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="otworzEdycjeZgodyUcznia('${z.id}')" class="bg-blue-500/20 hover:bg-blue-600/30 text-blue-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">Edytuj</button>
                <button onclick="usunZgodeWeekendowa('${z.id}')" class="bg-rose-500/15 hover:bg-rose-600/30 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">Usuń</button>
            </div>
        </div>`;
    });
}

function uzupelnijZwrotyLogow(logi) {
    const ostKto = {};
    logi.forEach(l => {
        if (l.akcja === 'ZAJĘTA' && l.kto) {
            ostKto[l.sala] = l.kto;
        } else if (l.akcja === 'WOLNA') {
            if ((!l.kto || l.kto === '-' || l.kto === 'Zwrot klucza') && ostKto[l.sala]) {
                l.kto = ostKto[l.sala];
            }
            delete ostKto[l.sala];
        }
    });
}

function obliczAktywneWydania(logi) {
    aktywneWydania = {};
    logi.forEach(l => {
        if (l.akcja === 'ZAJĘTA') {
            aktywneWydania[l.sala] = parsowacCzas(l.czas);
        } else if (l.akcja === 'WOLNA' || l.akcja === 'ZABLOKOWANA') {
            delete aktywneWydania[l.sala];
        }
    });
}

function rozbijDaneUcznia(ktoStr) {
    let imie = ktoStr || '-', klasa = '-', instr = '-';
    try {
        const m = imie.match(/\(([^)]+)\)/);
        if (m) {
            klasa = m[1];
            imie = imie.replace(/\([^)]+\)/, '').trim();
        }
        if (imie.includes(' - ')) {
            const p = imie.split(' - ');
            imie = p[0].trim();
            instr = p.slice(1).join(' - ').trim();
        }
    } catch(e) {}
    return { imieNazwisko: imie, klasa: klasa, instrument: instr };
}

window.ustawTrybFiltru = function(tryb) {
    obecnyTryb = tryb;
    ['last7', 'day', 'week', 'month', 'range'].forEach(f => {
        const btn = document.getElementById('btn-' + f);
        if (btn) btn.classList.toggle('active', f === tryb);
        
        const inp = document.getElementById('in-' + f);
        if (inp) {
            if (f === tryb && tryb !== 'last7') {
                pokazEkran('in-' + f, f === 'range' ? 'flex' : 'block');
            } else {
                ukryjEkran('in-' + f);
            }
        }
    });

    const dDay = document.getElementById('in-day');
    if (tryb === 'day' && dDay && !dDay.value) dDay.value = dzisiajDataString();
    
    const dWeek = document.getElementById('in-week');
    if (tryb === 'week' && dWeek && !dWeek.value) dWeek.value = biezacyTydzienISO();
    
    const dMonth = document.getElementById('in-month');
    if (tryb === 'month' && dMonth && !dMonth.value) dMonth.value = biezacyMiesiacString();
    
    if (tryb === 'range') {
        const dStart = document.getElementById('range-start');
        const dEnd = document.getElementById('range-end');
        if (dStart && !dStart.value) dStart.value = dataSprzedDni(7);
        if (dEnd && !dEnd.value) dEnd.value = dzisiajDataString();
    }
    
    zastosujFiltry();
};

function wGetDateStrings(wStr) {
    if (!wStr || !wStr.includes('-W')) return { start: dataSprzedDni(7), end: dzisiajDataString() };
    const p = wStr.split('-W');
    const y = parseInt(p[0], 10);
    const w = parseInt(p[1], 10);
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    
    if (simple.getDay() <= 4) {
        simple.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        simple.setDate(simple.getDate() + 8 - simple.getDay());
    }
    
    const end = new Date(simple);
    end.setDate(simple.getDate() + 6);
    return { start: formatujDateYMD(simple), end: formatujDateYMD(end) };
}

function zastosujFiltry() {
    let sStr = dataSprzedDni(7);
    let eStr = dzisiajDataString();

    if (obecnyTryb === 'day') {
        sStr = eStr = document.getElementById('in-day').value || dzisiajDataString();
    } else if (obecnyTryb === 'week') {
        const r = wGetDateStrings(document.getElementById('in-week').value);
        sStr = r.start;
        eStr = r.end;
    } else if (obecnyTryb === 'month') {
        const v = document.getElementById('in-month').value || biezacyMiesiacString();
        sStr = v + '-01';
        eStr = v + '-31';
    } else if (obecnyTryb === 'range') {
        sStr = document.getElementById('range-start').value || dataSprzedDni(7);
        eStr = document.getElementById('range-end').value || dzisiajDataString();
    }

    const najstarszyWPamieci = wszystkieLogi.length > 0 ? (wszystkieLogi[0].czas || '').substring(0, 10) : dzisiajDataString();

    if (obecnyTryb !== 'last7' && sStr < najstarszyWPamieci && wszystkieLogi.length >= 1500) {
        const infSuma = document.getElementById('info-suma');
        if (infSuma) infSuma.innerText = '...';
        
        db.ref('statystyki_logi')
            .orderByChild('czas')
            .startAt(sStr + ' 00:00:00')
            .endAt(eStr + ' 23:59:59')
            .once('value', snap => {
                const d = snap.val();
                const dZak = d ? Object.values(d).filter(x => x && x.czas).sort((a, b) => String(a.czas).localeCompare(String(b.czas))) : [];
                uzupelnijZwrotyLogow(dZak);
                przetworzIDokrysuj(dZak);
            });
        return;
    }

    let wyfiltrowane = wszystkieLogi.filter(l => {
        const d = (l.czas || '').substring(0, 10);
        return d >= sStr && d <= eStr;
    });

    if (obecnyTryb === 'last7' && wyfiltrowane.length === 0 && wszystkieLogi.length > 0) {
        const ostData = wszystkieLogi[wszystkieLogi.length - 1].czas.substring(0, 10);
        const startOst = dataSprzedDni(7, ostData);
        wyfiltrowane = wszystkieLogi.filter(l => {
            const d = (l.czas || '').substring(0, 10);
            return d >= startOst && d <= ostData;
        });
    }

    przetworzIDokrysuj(wyfiltrowane);
}

window.przeliczTylkoWykres2 = function() {
    const el = document.getElementById('granulacja-czasu');
    const gran = el ? parseInt(el.value, 10) : 15;
    const mW = {};
    
    aktualnieFiltrowaneLogi.forEach(l => {
        if (l.akcja === 'ZAJĘTA') {
            const d = new Date(parsowacCzas(l.czas));
            const min = Math.floor(d.getMinutes() / gran) * gran;
            const strG = String(d.getHours()).padStart(2, '0') + ":" + String(min).padStart(2, '0');
            mW[strG] = (mW[strG] || 0) + 1;
        }
    });
    
    const cM = Object.entries(mW).sort((a, b) => a[0].localeCompare(b[0]));
    daneWykresow[2] = {
        e: cM.map(i => i[0]),
        w: cM.map(i => i[1]),
        k: ['#3b82f6', 'rgba(59,130,246,0.1)'],
        r: '#3b82f6'
    };
    rysuj(2);
};

function przetworzIDokrysuj(dane) {
    aktualnieFiltrowaneLogi = dane;
    const sW = {};
    const mW = {};
    const dW = {'Poniedziałek':0,'Wtorek':0,'Środa':0,'Czwartek':0,'Piątek':0,'Sobota':0,'Niedziela':0};
    const nDni = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
    const sesje = {};
    const rCzasu = {'10-20m':0,'20-30m':0,'30-40m':0,'40-50m':0,'50-60m':0,'60-90m':0,'90-120m':0,'>120m':0};
    
    let sCalk = 0;
    let ilCalk = 0;
    
    const granEl = document.getElementById('granulacja-czasu');
    const gran = granEl ? parseInt(granEl.value, 10) : 15;

    dane.forEach(l => {
        const ms = parsowacCzas(l.czas);
        if (l.akcja === 'ZAJĘTA') {
            sW[l.sala] = (sW[l.sala] || 0) + 1;
            const d = new Date(ms);
            const min = Math.floor(d.getMinutes() / gran) * gran;
            const strG = String(d.getHours()).padStart(2, '0') + ":" + String(min).padStart(2, '0');
            
            mW[strG] = (mW[strG] || 0) + 1;
            if (nDni[d.getDay()]) {
                dW[nDni[d.getDay()]]++;
            }
            sesje[l.sala] = ms;
        } else if (l.akcja === 'WOLNA') {
            if (sesje[l.sala] && !l.auto_reset && !(l.kto && l.kto.includes('Zwrot automatyczny'))) {
                const diff = (ms - sesje[l.sala]) / 60000;
                if (diff >= 10 && diff <= 480) {
                    sCalk += diff;
                    ilCalk++;
                    if (diff <= 20) rCzasu['10-20m']++;
                    else if (diff <= 30) rCzasu['20-30m']++;
                    else if (diff <= 40) rCzasu['30-40m']++;
                    else if (diff <= 50) rCzasu['40-50m']++;
                    else if (diff <= 60) rCzasu['50-60m']++;
                    else if (diff <= 90) rCzasu['60-90m']++;
                    else if (diff <= 120) rCzasu['90-120m']++;
                    else rCzasu['>120m']++;
                }
            }
            delete sesje[l.sala];
        }
    });

    globalnyRankingSal = Object.entries(sW).sort((a, b) => b[1] - a[1]);
    const pM = Object.entries(mW).sort((a, b) => b[1] - a[1]);
    const pD = Object.entries(dW).sort((a, b) => b[1] - a[1]);
    const avg = ilCalk > 0 ? Math.round(sCalk / ilCalk) : 0;

    const elSuma = document.getElementById('info-suma');
    if (elSuma) elSuma.innerText = dane.filter(l => l.akcja === 'ZAJĘTA').length;
    
    const elTopS = document.getElementById('info-ulubiona');
    if (elTopS) elTopS.innerText = globalnyRankingSal.length ? globalnyRankingSal[0][0] : '-';
    
    const elTopG = document.getElementById('info-godzina');
    if (elTopG) elTopG.innerText = pM.length ? pM[0][0] : '-';
    
    const elTopD = document.getElementById('info-dzien');
    if (elTopD) elTopD.innerText = pD[0][1] > 0 ? pD[0][0] : '-';
    
    const elSredn = document.getElementById('info-sredni-czas');
    if (elSredn) elSredn.innerText = avg > 0 ? (avg + ' min') : '-';

    odswiezTylkoRanking1();
    
    const cM = Object.entries(mW).sort((a, b) => a[0].localeCompare(b[0]));
    daneWykresow[2] = { e: cM.map(i => i[0]), w: cM.map(i => i[1]), k: ['#3b82f6', 'rgba(59,130,246,0.1)'], r: '#3b82f6' };
    
    const dniLabel = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];
    daneWykresow[3] = { e: dniLabel, w: dniLabel.map(d => dW[d]), k: ['#f59e0b', 'rgba(245,158,11,0.1)'], r: '#f59e0b' };
    
    daneWykresow[4] = { e: Object.keys(rCzasu), w: Object.values(rCzasu), k: ['#f43f5e', 'rgba(244,63,94,0.1)'], r: '#f43f5e' };

    rysuj(2);
    rysuj(3);
    rysuj(4);
    generujHeatmapPlynna(dane);
}

window.toggleRankingMode = function() {
    trybWykresu1 = (trybWykresu1 === 'top') ? 'bot' : 'top';
    const btn = document.getElementById('btn-ranking-mode');
    if (btn) btn.innerText = (trybWykresu1 === 'top') ? "Najczęstsze" : "Najrzadsze";
    odswiezTylkoRanking1();
};

function odswiezTylkoRanking1() {
    const zbiur = trybWykresu1 === 'top' ? globalnyRankingSal.slice(0, 15) : globalnyRankingSal.slice().reverse().slice(0, 15);
    daneWykresow[1] = { 
        e: zbiur.map(i => String(i[0])), 
        w: zbiur.map(i => i[1]), 
        k: ['#3b82f6', '#4f46e5'], 
        r: '#3b82f6' 
    };
    rysuj(1);
}

function rysuj(nr) {
    const canvasEl = document.getElementById('wykres' + nr);
    if (!canvasEl) return;
    
    if (instancjeW[nr]) instancjeW[nr].destroy();
    
    const ctx = canvasEl.getContext('2d');
    const d = daneWykresow[nr] || { e: [], w: [], k: ['#3b82f6', 'transparent'], r: '#3b82f6' };
    const typ = konfWyk[nr].opcje[konfWyk[nr].idx].id;
    
    const paleta = ['#3b82f6','#6366f1','#10b981','#f59e0b','#a855f7','#f43f5e','#0ea5e9','#14b8a6','#fbbf24','#34d399'];
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, d.k[0]);
    grad.addColorStop(1, d.k[1] || 'transparent');

    instancjeW[nr] = new Chart(ctx, {
        type: typ,
        data: {
            labels: d.e.length ? d.e : ['Brak danych'],
            datasets: [{
                label: 'Ilość',
                data: d.w.length ? d.w : [0],
                backgroundColor: (typ === 'pie' || typ === 'doughnut') ? paleta : grad,
                borderColor: typ === 'line' ? d.r : '#0f172a',
                borderWidth: typ === 'line' ? 2.5 : 1,
                fill: typ === 'line',
                tension: 0.35,
                borderRadius: typ === 'bar' ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: typ !== 'bar' && typ !== 'line',
                    position: 'right',
                    labels: { color: '#cbd5e1' }
                }
            },
            scales: (typ === 'pie' || typ === 'doughnut') ? {} : {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', precision: 0 } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
            }
        }
    });
}

window.zmienTyp = function(nr, kier) {
    konfWyk[nr].idx = (konfWyk[nr].idx + kier + konfWyk[nr].opcje.length) % konfWyk[nr].opcje.length;
    const nazwaEl = document.getElementById('nazwa-typu-' + nr);
    if (nazwaEl) nazwaEl.innerText = konfWyk[nr].opcje[konfWyk[nr].idx].n;
    rysuj(nr);
};

function generujHeatmapPlynna(logi) {
    const gridG = document.getElementById('heatmap-godziny');
    const gridD = document.getElementById('heatmap-dni');
    const gridB = document.getElementById('heatmap-bg');
    const gridO = document.getElementById('heatmap-overlay');
    
    if (!gridG || !gridD || !gridB || !gridO) return;

    const dni = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];
    const sloty = [];
    for (let h = 7; h <= 20; h++) {
        for (let m = 0; m < 60; m += 15) {
            sloty.push(`${h}_${m}`);
        }
    }

    const heat = {};
    let maxV = 0;
    dni.forEach(d => {
        heat[d] = {};
        sloty.forEach(s => heat[d][s] = 0);
    });

    logi.forEach(l => {
        if (l.akcja === 'ZAJĘTA') {
            const d = new Date(parsowacCzas(l.czas));
            const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const h = d.getHours();
            
            if (idx >= 0 && idx <= 6 && h >= 7 && h <= 20) {
                const mFormat = Math.floor(d.getMinutes() / 15) * 15;
                const k = `${h}_${mFormat}`;
                heat[dni[idx]][k]++;
                if (heat[dni[idx]][k] > maxV) {
                    maxV = heat[dni[idx]][k];
                }
            }
        }
    });

    gridG.innerHTML = '';
    for (let h = 7; h <= 20; h++) {
        gridG.innerHTML += `<div class="flex-1 text-center text-xs font-bold text-slate-400">${h}:00</div>`;
    }
    
    gridD.innerHTML = '';
    dni.forEach(d => {
        gridD.innerHTML += `<div class="flex-1 flex items-center justify-end text-right">${d}</div>`;
    });

    const tmpl = `repeat(${sloty.length}, minmax(0, 1fr))`;
    gridB.style.gridTemplateColumns = tmpl;
    gridO.style.gridTemplateColumns = tmpl;
    gridB.innerHTML = '';
    gridO.innerHTML = '';

    function pobierzKolor(v, max) {
        if (!max || !v) return 'rgba(16, 185, 129, 0.85)';
        const r = v / max;
        const st = [
            {p:0, c:[16,185,129]},
            {p:0.2, c:[234,179,8]},
            {p:0.45, c:[249,115,22]},
            {p:0.7, c:[239,68,68]},
            {p:1, c:[127,29,29]}
        ];
        let s1 = st[0], s2 = st[st.length - 1];
        for (let i = 0; i < st.length - 1; i++) {
            if (r >= st[i].p && r <= st[i+1].p) {
                s1 = st[i];
                s2 = st[i+1];
                break;
            }
        }
        const pct = (s2.p - s1.p) === 0 ? 0 : (r - s1.p) / (s2.p - s1.p);
        const rC = Math.round(s1.c[0] + pct * (s2.c[0] - s1.c[0]));
        const gC = Math.round(s1.c[1] + pct * (s2.c[1] - s1.c[1]));
        const bC = Math.round(s1.c[2] + pct * (s2.c[2] - s1.c[2]));
        return `rgb(${rC}, ${gC}, ${bC})`;
    }

    dni.forEach(d => {
        sloty.forEach(s => {
            const v = heat[d][s];
            const kolorStr = pobierzKolor(v, maxV);
            gridB.innerHTML += `<div style="background-color:${kolorStr}; width:115%; height:115%;"></div>`;
            
            const tooltipStr = `${d} ${s.replace('_',':').replace(':0',':00')} (${v})`;
            gridO.innerHTML += `<div class="pointer-events-auto w-full h-full" title="${tooltipStr}"></div>`;
        });
    });
}

function pobierzUsterkiSali(nr) {
    return Object.entries(usterkiSal)
        .filter(([, u]) => u && u.sala === nr)
        .map(([id, u]) => Object.assign({ id }, u));
}

window.usunUsterke = function(id, nr) {
    db.ref('usterki_sal/' + id).remove().then(() => {
        if (nr) pokazHistorieSali(nr);
    });
};

function renderujUsterkiLive() {
    const lista = Object.entries(usterkiSal)
        .map(([id, u]) => Object.assign({ id }, u))
        .sort((a, b) => (b.czas || '').localeCompare(a.czas || ''));
        
    const badge = document.getElementById('badge-usterki-nav');
    const sekcja = document.getElementById('sekcja-usterek-live');
    const kontener = document.getElementById('lista-usterek-live');
    const licznik = document.getElementById('licznik-usterek');
    
    if (lista.length > 0) {
        if (badge) { badge.innerText = lista.length; pokazEkran('badge-usterki-nav', 'inline-flex'); }
        if (sekcja) { pokazEkran('sekcja-usterek-live'); }
        if (licznik) licznik.innerText = lista.length;
        
        if (kontener) {
            kontener.innerHTML = lista.map(u => {
                return `<div class="bg-slate-950/70 border border-amber-400/35 rounded-2xl p-4 flex flex-col justify-between gap-2">
                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <span onclick="pokazHistorieSali('${u.sala}')" class="cursor-pointer emblem emblem-amber">Sala ${u.sala}</span>
                            <span class="text-[11px] text-slate-400">${u.czas || '-'}</span>
                        </div>
                        <p class="text-xs sm:text-sm text-white font-semibold mb-1">${ucieczkaHtml(u.opis)}</p>
                        <p class="text-[11px] text-slate-300">Zgłosił(a): <strong class="text-white">${ucieczkaHtml(u.kto || 'Uczeń')}</strong></p>
                    </div>
                    <button onclick="usunUsterke('${u.id}')" class="mt-2 w-full btn-primary-gradient font-bold py-2 rounded-xl text-xs">Oznacz jako naprawione</button>
                </div>`;
            }).join('');
        }
    } else {
        if (badge) ukryjEkran('badge-usterki-nav');
        if (sekcja) { ukryjEkran('sekcja-usterek-live'); }
    }
}

window.zablokujSale = function(nr) {
    const el = document.getElementById('input-powod-blokady');
    const powod = (el && el.value.trim()) ? el.value.trim() : "Blokada administracyjna";
    const teraz = formatujDateTeraz();
    
    db.ref('sale_aktualne/' + nr).set({ status: 'ZABLOKOWANA', kto: powod, czas: teraz });
    db.ref('statystyki_logi').push({ 
        sala: nr, 
        akcja: 'ZABLOKOWANA', 
        czas: teraz, 
        kto: `Administracja (${powod})` 
    });
    
    setTimeout(() => pokazHistorieSali(nr), 150);
};

window.odblokujSale = function(nr) {
    const teraz = formatujDateTeraz();
    db.ref('sale_aktualne/' + nr).set({ status: 'WOLNA', kto: '', czas: teraz });
    db.ref('statystyki_logi').push({ 
        sala: nr, 
        akcja: 'ODBLOKOWANA', 
        czas: teraz, 
        kto: 'Administracja (Odblokowanie)' 
    });
    
    setTimeout(() => pokazHistorieSali(nr), 150);
};

window.pokazHistorieSali = function(nr) {
    const modalNr = document.getElementById('modal-sala-nr');
    if (modalNr) modalNr.innerText = nr;
    
    const stanEl = document.getElementById('modal-obecny-stan');
    const ustEl = document.getElementById('modal-usterki-sali');
    const blokEl = document.getElementById('modal-panel-blokady');
    const listaEl = document.getElementById('modal-historia-lista');
    
    if (listaEl) listaEl.innerHTML = '';
    
    const dS = statusySal[nr];
    const st = (typeof dS === 'string') ? dS : (dS && dS.status ? dS.status : 'WOLNA');
    const kto = (dS && typeof dS === 'object') ? (dS.kto || "") : "";
    const czasPobrania = (dS && typeof dS === 'object') ? dS.czas : null;

    if (stanEl) {
        if (st === 'ZAJĘTA') {
            const start = aktywneWydania[nr] || (czasPobrania ? parsowacCzas(czasPobrania) : 0);
            const minuty = start > 0 ? Math.max(0, Math.floor((Date.now() - start) / 60000)) : 0;
            const parsed = rozbijDaneUcznia(kto);
            stanEl.innerHTML = `
                <div class="mb-2"><span class="emblem emblem-rose"><span class="status-dot dot-rose"></span>Zajęta</span></div>
                <div class="text-white font-bold">Osoba: ${ucieczkaHtml(parsed.imieNazwisko)} (${ucieczkaHtml(parsed.klasa)})</div>
                <div class="text-slate-300">Instrument: ${ucieczkaHtml(parsed.instrument)}</div>
                <div class="text-slate-400 mt-1">Czas: <span class="text-blue-300 font-bold">${minuty} min</span> (od ${czasPobrania || '-'})</div>`;
        } else if (st === 'ZABLOKOWANA') {
            stanEl.innerHTML = `
                <div class="mb-2"><span class="emblem emblem-purple"><span class="status-dot dot-purple"></span>Zablokowana</span></div>
                <div class="text-white font-bold">Powód: ${ucieczkaHtml(kto || 'Blokada')}</div>
                <div class="text-slate-400 mt-1">Od: ${czasPobrania || '-'}</div>`;
        } else {
            stanEl.innerHTML = '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Wolna</span>';
        }
    }

    const usterkiSali = pobierzUsterkiSali(nr);
    if (ustEl) {
        if (usterkiSali.length > 0) {
            pokazEkran('modal-usterki-sali');
            ustEl.innerHTML = usterkiSali.map(u => {
                return `<div class="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs">
                    <div class="flex justify-between font-bold text-amber-300 mb-1">
                        <span>Zgłoszona usterka</span>
                        <span>${u.czas || ''}</span>
                    </div>
                    <div class="text-white mb-2">${ucieczkaHtml(u.opis)}</div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-300">Zgłosił(a): <b>${ucieczkaHtml(u.kto || 'Uczeń')}</b></span>
                        <button onclick="usunUsterke('${u.id}', '${nr}')" class="btn-primary-gradient font-bold px-3 py-1 rounded-lg text-[11px]">Naprawione</button>
                    </div>
                </div>`;
            }).join('');
        } else {
            ukryjEkran('modal-usterki-sali');
        }
    }

    if (blokEl) {
        if (st === 'ZABLOKOWANA') {
            blokEl.innerHTML = `<button onclick="odblokujSale('${nr}')" class="btn-primary-gradient w-full font-bold py-2.5 rounded-xl text-xs">Odblokuj salę</button>`;
        } else {
            blokEl.innerHTML = `
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Zablokuj salę</label>
                <div class="flex gap-2">
                    <input type="text" id="input-powod-blokady" placeholder="Powód blokady..." class="input-modern flex-grow rounded-xl px-3 py-2 text-xs">
                    <button onclick="zablokujSale('${nr}')" class="btn-secondary-glass font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap">Zablokuj</button>
                </div>`;
        }
    }

    if (listaEl) {
        const dStr = dzisiajDataString();
        const logiDzisiaj = wszystkieLogi.filter(l => l.sala === nr && (l.czas || '').startsWith(dStr));

        if (logiDzisiaj.length === 0) {
            listaEl.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">Brak wpisów z dzisiaj.</p>';
        } else {
            logiDzisiaj.forEach(l => {
                const godzina = (l.czas.split(' ')[1] || '').substring(0, 5);
                const parsed = rozbijDaneUcznia(l.kto);
                
                let klasaEmblem = 'emblem-emerald';
                let znakText = 'Zwrócona';
                
                if (l.akcja === 'ZAJĘTA') { 
                    klasaEmblem = 'emblem-rose'; 
                    znakText = 'Wydana'; 
                } else if (l.akcja === 'ZABLOKOWANA') { 
                    klasaEmblem = 'emblem-purple'; 
                    znakText = 'Blokada'; 
                }

                listaEl.innerHTML += `
                    <div class="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-white/10 shrink-0 text-xs">
                        <span class="font-bold text-white">${godzina}</span>
                        <span class="emblem ${klasaEmblem}">${znakText}</span>
                        <span class="text-slate-300 truncate max-w-[150px]">${parsed.imieNazwisko !== '-' ? ucieczkaHtml(parsed.imieNazwisko) : ''}</span>
                    </div>`;
            });
            setTimeout(() => { listaEl.scrollTop = listaEl.scrollHeight; }, 50);
        }
    }

    pokazEkran('modal-historia');
};

window.zamknijHistorieSali = function() {
    ukryjEkran('modal-historia');
};

function odswiezWidokLive() {
    const con = document.getElementById('live-container');
    if (!con) return;
    con.innerHTML = '';
    
    grupySal.forEach(grupa => {
        const sekcja = document.createElement('div');
        let htmlStr = '';
        
        grupa.sale.forEach(nr => {
            const dS = statusySal[nr];
            const st = (typeof dS === 'string') ? dS : (dS && dS.status ? dS.status : 'WOLNA');
            const maUsterke = pobierzUsterkiSali(nr).length > 0;
            const znaczUsterki = maUsterke ? '<span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400" title="Usterka"></span>' : '';

            let sN = nr;
            if (nr === 'Koncertowa') sN = 'KON'; 
            else if (nr === 'Kameralna') sN = 'KAM'; 
            else if (nr === 'Lustrzana') sN = 'LUS'; 
            else if (nr === 'Kryształowa') sN = 'KRY';

            if (st === 'ZAJĘTA') {
                const start = aktywneWydania[nr] || (dS && dS.czas ? parsowacCzas(dS.czas) : 0);
                let odText = "-", trwText = "-";
                
                if (start > 0) { 
                    const dObj = new Date(start);
                    odText = String(dObj.getHours()).padStart(2,'0') + ':' + String(dObj.getMinutes()).padStart(2,'0'); 
                    trwText = Math.max(0, Math.floor((Date.now() - start) / 60000)) + ' min'; 
                }
                
                const ktoKrotki = (dS && dS.kto) ? rozbijDaneUcznia(dS.kto).imieNazwisko : '';
                
                htmlStr += `<div id="live-sala-${nr}" onclick="pokazHistorieSali('${nr}')" class="relative cursor-pointer transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-300 shadow-lg">
                    ${znaczUsterki}
                    <span class="font-extrabold text-sm sm:text-base leading-tight text-white">${sN}</span>
                    ${ktoKrotki ? `<span class="text-[9px] text-rose-200 truncate max-w-full px-1 font-medium">${ucieczkaHtml(ktoKrotki)}</span>` : ''}
                    <span class="text-[9px] text-rose-300/80 my-0.5">Od: ${odText}</span>
                    <span class="text-[10px] font-bold czas-trwania text-rose-200" data-start="${start || ''}">${trwText}</span>
                </div>`;
            } else if (st === 'ZABLOKOWANA') {
                const powodTekst = (dS && dS.kto) ? dS.kto : 'Blokada';
                htmlStr += `<div id="live-sala-${nr}" onclick="pokazHistorieSali('${nr}')" class="relative cursor-pointer transition-all hover:-translate-y-1 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/35 text-purple-300 shadow-lg">
                    ${znaczUsterki}
                    <span class="font-extrabold text-sm sm:text-base text-white">${sN}</span>
                    <span class="text-[9px] text-purple-200 mt-1 truncate w-full text-center font-semibold">${ucieczkaHtml(powodTekst)}</span>
                </div>`;
            } else {
                htmlStr += `<div id="live-sala-${nr}" onclick="pokazHistorieSali('${nr}')" class="relative cursor-pointer transition-all hover:-translate-y-1 flex flex-col items-center justify-center h-full min-h-[4.5rem] sm:min-h-[5.2rem] rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-lg">
                    ${znaczUsterki}
                    <span class="font-extrabold text-sm sm:text-base">${sN}</span>
                </div>`;
            }
        });
        
        sekcja.innerHTML = `
            <div class="mb-3">
                <span class="emblem ${grupa.emblem} mb-3">${grupa.nazwa}</span>
                <div class="grid grid-cols-3 min-[400px]:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3 mt-2">${htmlStr}</div>
            </div>`;
        con.appendChild(sekcja);
    });
    
    aktualizujLicznikiCzasu();
}

function aktualizujLicznikiCzasu() {
    document.querySelectorAll('.czas-trwania').forEach(el => {
        const sTimestamp = el.getAttribute('data-start');
        if (sTimestamp && sTimestamp > 0) {
            el.innerText = Math.max(0, Math.floor((Date.now() - parseInt(sTimestamp, 10)) / 60000)) + ' min';
        }
    });
}

window.wyczyscSzukanie = function() { 
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = ''; 
    szukajUcznia(); 
};

window.wyczyscZeszytLogow = function() {
    if(confirm('Usuwanie wszystkich logów\nCzy na pewno chcesz bezpowrotnie usunąć CAŁĄ historię z wirtualnego zeszytu (statystyki i logi)? Tej operacji nie można cofnąć.')) {
        db.ref('statystyki_logi').remove().then(() => {
            alert('Sukces: Zeszyt został całkowicie wyczyszczony.');
            wszystkieLogi = [];
            odswiezTabelaLogow([]);
            zastosujFiltry();
        }).catch(err => {
            alert('Błąd: ' + err.message);
        });
    }
};

function szukajUcznia() {
    const inpEl = document.getElementById('searchInput');
    const box = document.getElementById('wynikiSzukania');
    const clrBtn = document.getElementById('btn-clear-search');
    
    if (!inpEl || !box) return;
    
    document.querySelectorAll('[id^="live-sala-"]').forEach(el => el.classList.remove('podswietlona-sala'));
    
    const query = inpEl.value.trim().toLowerCase();
    
    if (!query) { 
        ukryjEkran('wynikiSzukania');
        if (clrBtn) clrBtn.classList.add('hidden'); 
        return; 
    }
    
    if (clrBtn) clrBtn.classList.remove('hidden'); 
    const znalezieni = [];
    
    for (const [nr, d] of Object.entries(statusySal)) {
        if (d && typeof d === 'object' && d.status === 'ZAJĘTA' && d.kto) {
            if (d.kto.toLowerCase().includes(query) || nr.toLowerCase() === query) {
                znalezieni.push({ sala: nr, kto: d.kto, czas: d.czas || "" });
                const salaLive = document.getElementById('live-sala-' + nr);
                if (salaLive) salaLive.classList.add('podswietlona-sala');
            }
        }
    }
    
    pokazEkran('wynikiSzukania', 'grid');
    
    if (znalezieni.length > 0) {
        box.innerHTML = znalezieni.map(z => {
            const minuty = z.czas ? Math.max(0, Math.floor((Date.now() - parsowacCzas(z.czas)) / 60000)) : 0;
            const parsed = rozbijDaneUcznia(z.kto);
            return `
                <div onclick="pokazHistorieSali('${z.sala}')" class="cursor-pointer p-3.5 bg-blue-500/15 hover:bg-blue-500/25 rounded-2xl border border-blue-400/40 flex justify-between items-center transition-all">
                    <div class="truncate mr-2">
                        <div class="font-bold text-white text-xs sm:text-sm truncate">${ucieczkaHtml(parsed.imieNazwisko)} <span class="text-blue-300">(${ucieczkaHtml(parsed.klasa)})</span></div>
                        <div class="text-xs text-slate-300 truncate">${ucieczkaHtml(parsed.instrument)} • ${minuty} min</div>
                    </div>
                    <span class="emblem emblem-blue shrink-0">Sala ${z.sala}</span>
                </div>`;
        }).join('');
    } else {
        box.innerHTML = `<div class="col-span-full text-xs text-slate-400 py-1">Brak wyników dla: <b class="text-white">${ucieczkaHtml(inpEl.value)}</b></div>`;
    }
}

function odswiezTabelaLogow(lokalneLogi) {
    const tbody = document.getElementById('tabela-logow');
    if (!tbody) return;
    
    const odInp = document.getElementById('zeszyt-od');
    const doInp = document.getElementById('zeszyt-do');
    
    const odVal = odInp ? odInp.value : '';
    const doVal = doInp ? doInp.value : dzisiajDataString();
    
    const najstPam = wszystkieLogi.length > 0 ? (wszystkieLogi[0].czas || '').substring(0, 10) : dzisiajDataString();
    
    if (odVal && odVal < najstPam && wszystkieLogi.length >= 1500) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500 text-xs">Pobieranie z archiwum chmury...</td></tr>';
        if (odInp) odInp.dataset.zmieniono = "1";
        if (doInp) doInp.dataset.zmieniono = "1";
        
        db.ref('statystyki_logi').orderByChild('czas').startAt(odVal + ' 00:00:00').endAt(doVal + ' 23:59:59').once('value', snap => {
            const dData = snap.val();
            const posortowane = dData ? Object.values(dData).filter(x => x && x.czas).sort((a, b) => String(a.czas).localeCompare(String(b.czas))) : [];
            renderTbodyLogow(posortowane);
        });
        return;
    }

    let filtrowane = lokalneLogi;
    if (odVal && doVal) {
        filtrowane = lokalneLogi.filter(l => {
            const dStr = (l.czas || '').substring(0, 10);
            return dStr >= odVal && dStr <= doVal;
        });
    }
    
    if (filtrowane.length === 0 && lokalneLogi.length > 0 && (!odVal || !doVal)) {
        filtrowane = lokalneLogi.slice(-300);
    }
    
    renderTbodyLogow(filtrowane);
}

function renderTbodyLogow(daneTablicy) {
    const tbody = document.getElementById('tabela-logow');
    if (!tbody) return;
    
    if (daneTablicy.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500 text-xs">Brak zarejestrowanych operacji w wybranym okresie.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    daneTablicy.slice(-300).reverse().forEach(log => {
        let klBadge = 'emblem-emerald';
        if (log.akcja === 'ZAJĘTA') klBadge = 'emblem-rose';
        else if (log.akcja === 'ZABLOKOWANA') klBadge = 'emblem-purple';
        else if (log.akcja === 'ODBLOKOWANA') klBadge = 'emblem-blue';
        
        const parsed = rozbijDaneUcznia(log.kto);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        
        tr.innerHTML = `
            <td class="py-3 px-4 text-slate-400 whitespace-nowrap">${ucieczkaHtml(log.czas)}</td>
            <td class="py-3 px-4 font-extrabold text-white">${ucieczkaHtml(log.sala)}</td>
            <td class="py-3 px-4"><span class="emblem ${klBadge}">${ucieczkaHtml(log.akcja)}</span></td>
            <td class="py-3 px-4 text-white font-semibold whitespace-nowrap">${ucieczkaHtml(parsed.imieNazwisko)}</td>
            <td class="py-3 px-4 text-slate-300">${ucieczkaHtml(parsed.klasa)}</td>
            <td class="py-3 px-4 text-slate-300 min-w-[120px]">${ucieczkaHtml(parsed.instrument)}</td>`;
            
        fragment.appendChild(tr);
    });
    
    tbody.appendChild(fragment);
}

window.dodajUzytkownikaAdmin = function() {
    const imieEl = document.getElementById('nowy-user-imie');
    const klasaEl = document.getElementById('nowy-user-klasa');
    const rolaEl = document.getElementById('nowy-user-rola');
    const inst1El = document.getElementById('nowy-user-inst1');
    const inst2El = document.getElementById('nowy-user-inst2');
    
    const imie = (imieEl ? imieEl.value : '').trim();
    const rola = rolaEl ? rolaEl.value : 'uczen';
    
    let domyslnaKlasa = '-';
    if (rola === 'nauczyciel') domyslnaKlasa = 'Nauczyciel';
    else if (rola === 'administracja') domyslnaKlasa = 'Administracja';
    else if (rola === 'obsluga') domyslnaKlasa = 'Obsługa';
    
    const klasa = (rola !== 'uczen' && rola !== 'samorzad') ? domyslnaKlasa : (klasaEl ? klasaEl.value : '').trim() || '-';
    const inst1 = (inst1El ? inst1El.value : '').trim() || '-';
    const inst2 = (inst2El ? inst2El.value : '').trim() || '';

    if (imie.length < 3) {
        alert("Błąd: Wpisz poprawne imię i nazwisko.");
        return;
    }

    const nowyUid = generujIdKonta(bazaUczniow);
    const rekord = {
        imie_nazwisko: imie,
        klasa: klasa,
        rola: rola,
        instrument: inst1,
        instrument2: inst2,
        instrument_2: inst2,
        jazz: czyPracownik(rola) ? true : (czyPojedynczyInstrumentJazzowy(inst1) || czyPojedynczyInstrumentJazzowy(inst2)),
        login: wygenerujLoginZImienia(imie),
        haslo: losujHaslo9Cyfr(),
        zmieniono_haslo: false
    };

    db.ref('uczniowie/' + nowyUid).set(rekord).then(() => {
        if (imieEl) imieEl.value = '';
        if (klasaEl) klasaEl.value = '';
        if (inst1El) inst1El.value = '';
        if (inst2El) inst2El.value = '';
        alert("Sukces: Dodano konto do systemu: " + imie);
    });
};

window.otworzModalEdycjiUcznia = function(uid) {
    const u = bazaUczniow[uid];
    if (!u) return;
    
    document.getElementById('edit-uczen-uid').value = uid;
    document.getElementById('edit-uczen-imie').value = u.imie_nazwisko || '';
    document.getElementById('edit-uczen-klasa').value = u.klasa || '';
    
    const rolaSelect = document.getElementById('edit-uczen-rola');
    if (rolaSelect) rolaSelect.value = u.rola || 'uczen';
    
    document.getElementById('edit-uczen-inst1').value = u.instrument || '';
    document.getElementById('edit-uczen-inst2').value = u.instrument2 || u.instrument_2 || u.drugi_instrument || '';
    
    const cBox = document.getElementById('edit-uczen-jazz');
    if (cBox) {
        cBox.checked = czyUczenMaInstrumentJazzowy(u);
    }
    
    pokazEkran('modal-edycja-ucznia');
};

window.zamknijModalEdycjiUcznia = function() {
    ukryjEkran('modal-edycja-ucznia');
};

window.zapiszEdycjeUcznia = function() {
    const uid = document.getElementById('edit-uczen-uid')?.value;
    const imie = document.getElementById('edit-uczen-imie')?.value.trim();
    
    if (!uid || !imie) {
        alert("Błąd: Podaj imię i nazwisko użytkownika.");
        return;
    }
    
    const rola = document.getElementById('edit-uczen-rola')?.value || 'uczen';
    
    let domyslnaKlasa = '-';
    if (rola === 'nauczyciel') domyslnaKlasa = 'Nauczyciel';
    else if (rola === 'administracja') domyslnaKlasa = 'Administracja';
    else if (rola === 'obsluga') domyslnaKlasa = 'Obsługa';
    
    let klasa = document.getElementById('edit-uczen-klasa')?.value.trim();
    if (!klasa) klasa = '-';
    
    if ((rola !== 'uczen' && rola !== 'samorzad') && klasa === '-') {
        klasa = domyslnaKlasa;
    }
    
    const i1 = document.getElementById('edit-uczen-inst1')?.value.trim() || '-';
    const i2 = document.getElementById('edit-uczen-inst2')?.value.trim() || '';
    
    const cBox = document.getElementById('edit-uczen-jazz');
    const jazzRecznie = cBox ? cBox.checked : false;

    db.ref('uczniowie/' + uid).update({
        imie_nazwisko: imie,
        klasa: klasa,
        instrument: i1,
        instrument2: i2,
        instrument_2: i2,
        jazz: jazzRecznie,
        rola: rola,
        login: wygenerujLoginZImienia(imie)
    }).then(() => {
        zamknijModalEdycjiUcznia();
    });
};

window.usunKonto = function(uid, imie) {
    if(confirm(`Usuwanie konta\nCzy na pewno chcesz trwale usunąć konto: ${imie}? Tej operacji nie można cofnąć.`)) {
        db.ref('uczniowie/' + uid).remove().then(() => {
            alert(`Sukces: Konto ${imie} zostało pomyślnie usunięte z bazy.`);
        }).catch(err => {
            alert("Błąd: " + err.message);
        });
    }
};

window.synchronizujKontaUczniow = function() {
    const nowaBaza = {};
    let l = 0;
    
    for (const [uid, u] of Object.entries(bazaUczniow)) {
        if (!u || !u.imie_nazwisko) continue;
        
        const okHaslo = u.zmieniono_haslo === true || (u.haslo && /^\d{9}$/.test(String(u.haslo)));
        const inst2 = u.instrument2 || u.instrument_2 || u.drugi_instrument || "";
        
        nowaBaza[uid] = Object.assign({}, u, {
            login: wygenerujLoginZImienia(u.imie_nazwisko),
            haslo: okHaslo ? String(u.haslo) : losujHaslo9Cyfr(),
            instrument2: inst2,
            instrument_2: inst2,
            zmieniono_haslo: u.zmieniono_haslo === true
        });
        l++;
    }
    
    db.ref('uczniowie').set(nowaBaza).then(() => {
        alert('Sukces: Przebudowano poprawne loginy dla ' + l + ' kont.');
    });
};

window.resetujHasloUcznia = function(uid, imie) {
    const noweH = losujHaslo9Cyfr();
    if(confirm(`Reset hasła\nCzy na pewno chcesz zresetować hasło dla użytkownika: ${imie}? Nowe hasło będzie wynosić: ${noweH}`)) {
        db.ref('uczniowie/' + uid).update({
            login: wygenerujLoginZImienia(imie),
            haslo: noweH,
            zmieniono_haslo: false
        });
    }
};

function renderujTabeleKont() {
    const tbody = document.getElementById('tabela-kont-uczniow');
    if (!tbody) return;
    
    const inpFiltr = document.getElementById('filtr-kont-input');
    const filtrStr = (inpFiltr ? inpFiltr.value : '').trim().toLowerCase();
    
    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    const pUczniowie = Object.entries(bazaUczniow)
        .filter(e => e[1] && e[1].imie_nazwisko)
        .sort((a, b) => a[1].imie_nazwisko.localeCompare(b[1].imie_nazwisko));
        
    pUczniowie.forEach(([uid, u]) => {
        const lg = u.login || wygenerujLoginZImienia(u.imie_nazwisko);
        const insText = formatujInstrumentyUcznia(u);
        const czyJ = czyUczenMaInstrumentJazzowy(u);
        
        if (filtrStr) {
            const imieL = u.imie_nazwisko.toLowerCase();
            const klasaL = (u.klasa || '').toLowerCase();
            if (!imieL.includes(filtrStr) && !lg.includes(filtrStr) && !insText.toLowerCase().includes(filtrStr) && !klasaL.includes(filtrStr)) {
                return;
            }
        }
        
        const badgeHs = u.zmieniono_haslo === true 
            ? '<span class="emblem emblem-emerald">Własne hasło</span>' 
            : `<span class="emblem emblem-gold font-mono">${ucieczkaHtml(u.haslo || '-')}</span>`;
            
        let rolaBadge = '';
        if (u.rola === 'samorzad') rolaBadge = '<span class="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-1 mt-1">Samorząd</span>';
        else if (u.rola === 'nauczyciel') rolaBadge = '<span class="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-1 mt-1">Nauczyciel</span>';
        else if (u.rola === 'administracja') rolaBadge = '<span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-1 mt-1">Admin.</span>';
        else if (u.rola === 'obsluga') rolaBadge = '<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold ml-1 mt-1">Obsługa</span>';
            
        const jazzZn = czyJ ? ' <span class="emblem emblem-blue ml-1 mt-1">Jazz</span>' : '';
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5";
        
        tr.innerHTML = `
            <td class="py-3 px-3 whitespace-nowrap font-bold text-white">${ucieczkaHtml(u.imie_nazwisko)} <span class="text-slate-400 font-normal">(${ucieczkaHtml(u.klasa || '-')})</span></td>
            <td class="py-3 px-3 text-slate-200 min-w-[120px]">${ucieczkaHtml(insText)}<div class="flex flex-wrap">${jazzZn}${rolaBadge}</div></td>
            <td class="py-3 px-3 font-mono text-blue-300 font-semibold">${ucieczkaHtml(lg)}</td>
            <td class="py-3 px-3">${badgeHs}</td>
            <td class="py-3 px-3 text-right whitespace-nowrap">
                <button onclick="otworzModalEdycjiUcznia('${uid}')" class="btn-secondary-glass px-2.5 py-1.5 rounded-lg text-[11px] font-bold mr-1">Edytuj</button>
                <button onclick="resetujHasloUcznia('${uid}', '${u.imie_nazwisko.replace(/'/g, "\\'")}')" class="btn-secondary-glass px-2.5 py-1.5 rounded-lg text-[11px] font-bold mr-1">Zresetuj</button>
                <button onclick="usunKonto('${uid}', '${u.imie_nazwisko.replace(/'/g, "\\'")}')" class="bg-rose-500/20 text-rose-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors">Usuń</button>
            </td>`;
            
        fragment.appendChild(tr);
    });
    
    tbody.appendChild(fragment);
}

window.importujUczniowZExcela = async function() {
    const fileInp = document.getElementById('excel-import-input');
    if (!fileInp || !fileInp.files || fileInp.files.length === 0) {
        alert("Błąd: Najpierw wybierz plik .xlsx z dysku.");
        return;
    }

    try {
        const arrayBuffer = await fileInp.files[0].arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);
        
        const sh = wb.worksheets[0];
        if (!sh) { alert("Błąd: Plik Excel jest pusty."); return; }
        
        const nowiUczniowie = {};
        let licznikDodanych = 0;

        sh.eachRow((row, nr) => {
            const c1 = wyciagnijTekstKomorki(row.getCell(1).value);
            const c2 = wyciagnijTekstKomorki(row.getCell(2).value);
            const c3 = wyciagnijTekstKomorki(row.getCell(3).value);
            const c4 = wyciagnijTekstKomorki(row.getCell(4).value);
            const c5 = wyciagnijTekstKomorki(row.getCell(5).value);

            if (!c1) return;
            if (nr === 1 && /imi|ucze|lp|nazwisko/i.test(c1)) return;

            let imieNazw = c1, klas = c2 || '-', inst1 = c3 || '-', inst2 = c4 || '';
            
            if (!c1.includes(' ') && c2 && !/\d/.test(c2)) {
                imieNazw = `${c1} ${c2}`;
                klas = c3 || '-';
                inst1 = c4 || '-';
                inst2 = c5 || '';
            }

            if (imieNazw.length < 3) return;

            let rola = 'uczen';
            let sprawdzKlase = String(klas).toLowerCase();
            
            if (sprawdzKlase.includes('nauczyciel') || sprawdzKlase.includes('dyrekcja')) { rola = 'nauczyciel'; klas = 'Nauczyciel'; }
            else if (sprawdzKlase.includes('administracja')) { rola = 'administracja'; klas = 'Administracja'; }
            else if (sprawdzKlase.includes('obslug') || sprawdzKlase.includes('obsług')) { rola = 'obsluga'; klas = 'Obsługa'; }
            else if (sprawdzKlase.includes('pracownik')) { rola = 'nauczyciel'; klas = 'Pracownik szkoły'; }

            const nowyKodUid = generujIdKonta(Object.assign({}, bazaUczniow, nowiUczniowie));
            nowiUczniowie[nowyKodUid] = {
                imie_nazwisko: imieNazw,
                klasa: klas,
                rola: rola,
                instrument: inst1,
                instrument2: inst2,
                instrument_2: inst2,
                jazz: czyPracownik(rola) ? true : (czyPojedynczyInstrumentJazzowy(inst1) || czyPojedynczyInstrumentJazzowy(inst2)),
                login: wygenerujLoginZImienia(imieNazw),
                haslo: losujHaslo9Cyfr(),
                zmieniono_haslo: false
            };
            licznikDodanych++;
        });

        if (licznikDodanych > 0) {
            await db.ref('uczniowie').update(nowiUczniowie);
            fileInp.value = '';
            alert("Ukończono! Pomyślnie zaimportowano uczniów/pracowników: " + licznikDodanych);
        } else {
            alert("Brak danych: Nie znaleziono poprawnych wierszy do importu.");
        }
    } catch (e) {
        alert("Błąd krytyczny: Wystąpił błąd odczytu pliku .xlsx:\n" + e.message);
    }
};

window.pobierzListeLoginowExcel = async function() {
    const wb = new ExcelJS.Workbook();
    const sh = wb.addWorksheet('Loginy Uczniów');
    
    sh.columns = [
        { header: 'Imię i Nazwisko', key: 'imie', width: 28 },
        { header: 'Klasa / Rola', key: 'klasa', width: 14 },
        { header: 'Instrument 1', key: 'i1', width: 22 },
        { header: 'Drugi instrument', key: 'i2', width: 22 },
        { header: 'Login', key: 'login', width: 24 },
        { header: 'Hasło startowe', key: 'haslo', width: 18 }
    ];
    
    sh.getRow(1).font = { bold: true };
    
    Object.values(bazaUczniow)
        .filter(u => u && u.imie_nazwisko)
        .sort((a, b) => a.imie_nazwisko.localeCompare(b.imie_nazwisko))
        .forEach(u => {
            sh.addRow({
                imie: u.imie_nazwisko,
                klasa: u.klasa || '-',
                i1: u.instrument || '-',
                i2: u.instrument2 || u.instrument_2 || '',
                login: u.login || wygenerujLoginZImienia(u.imie_nazwisko),
                haslo: u.zmieniono_haslo ? '(Własne hasło)' : (u.haslo || '-')
            });
        });
        
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Loginy_POSM.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.generujPDF = function() {
    const mcInp = document.getElementById('pdf-miesiac');
    const autInp = document.getElementById('pdf-autor');
    const komInp = document.getElementById('pdf-komentarz');
    
    const mc = mcInp ? mcInp.value : '';
    const autor = autInp ? autInp.value || 'Nie podano' : 'Nie podano';
    const kom = komInp ? komInp.value : '';
    
    if (!mc) { 
        alert("Brakuje danych: Wybierz najpierw miesiąc raportu z kalendarza."); 
        return; 
    }
    
    const btn = document.getElementById('btn-generuj-pdf');
    const staryTekst = btn ? btn.innerText : 'Generuj PDF';
    if (btn) { btn.innerText = "Pobieranie i Generowanie..."; btn.disabled = true; }

    const najstPam = wszystkieLogi.length > 0 ? (wszystkieLogi[0].czas || '').substring(0, 10) : dzisiajDataString();
    
    if (mc + '-01' < najstPam && wszystkieLogi.length >= 1500) {
        db.ref('statystyki_logi').orderByChild('czas').startAt(mc + '-01 00:00:00').endAt(mc + '-31 23:59:59').once('value', snap => {
            const pobrane = snap.val();
            const logiPdf = pobrane ? Object.values(pobrane).filter(x => x && x.czas).sort((a, b) => String(a.czas).localeCompare(String(b.czas))) : [];
            procesujPDF(logiPdf, mc, autor, kom, btn, staryTekst);
        });
    } else {
        const logiPdf = wszystkieLogi.filter(l => (l.czas || '').startsWith(mc));
        procesujPDF(logiPdf, mc, autor, kom, btn, staryTekst);
    }
};

function procesujPDF(lPdf, mc, autor, kom, btn, staryTekst) {
    if (lPdf.length === 0) { 
        alert("Brak logów: Brak danych operacji portierni w wybranym miesiącu (" + mc + ")."); 
        if (btn) { btn.innerText = staryTekst; btn.disabled = false; }
        return; 
    }
    
    setTimeout(() => {
        const sW = {}; const mW = {}; const dW = {'Poniedziałek':0,'Wtorek':0,'Środa':0,'Czwartek':0,'Piątek':0,'Sobota':0,'Niedziela':0};
        const nDni = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
        const sesjeTemp = {};
        
        let sumaMinut = 0; let iloscSesji = 0;
        
        lPdf.forEach(l => {
            const ms = parsowacCzas(l.czas);
            if (l.akcja === 'ZAJĘTA') {
                sW[l.sala] = (sW[l.sala] || 0) + 1;
                const dObj = new Date(ms);
                const sSzczyt = String(dObj.getHours()).padStart(2, '0') + ":" + String(Math.floor(dObj.getMinutes() / 15) * 15).padStart(2, '0');
                mW[sSzczyt] = (mW[sSzczyt] || 0) + 1;
                try { dW[nDni[dObj.getDay()]]++; } catch(e) {}
                sesjeTemp[l.sala] = ms;
            } else if (l.akcja === 'WOLNA') {
                if (sesjeTemp[l.sala] && !l.auto_reset && !(l.kto && l.kto.includes('Zwrot automatyczny'))) {
                    const dt = (ms - sesjeTemp[l.sala]) / 60000;
                    if (dt >= 10 && dt <= 480) { sumaMinut += dt; iloscSesji++; }
                }
                delete sesjeTemp[l.sala];
            }
        });
        
        const posSal = Object.entries(sW).sort((a, b) => b[1] - a[1]);
        const posGodz = Object.entries(mW).sort((a, b) => b[1] - a[1]);
        const posDni = Object.entries(dW).sort((a, b) => b[1] - a[1]);

        document.getElementById('pdf-out-miesiac').innerText = mc; 
        document.getElementById('pdf-out-autor').innerText = autor; 
        document.getElementById('pdf-out-data').innerText = new Date().toLocaleDateString('pl-PL'); 
        document.getElementById('pdf-out-kom').innerText = kom;
        
        document.getElementById('pdf-out-suma').innerText = lPdf.filter(x => x.akcja === 'ZAJĘTA').length;
        document.getElementById('pdf-out-top').innerText = posSal.length ? ('Sala ' + posSal[0][0]) : '-'; 
        document.getElementById('pdf-out-bot').innerText = posSal.length ? ('Sala ' + posSal[posSal.length - 1][0]) : '-';
        document.getElementById('pdf-out-godz').innerText = posGodz.length ? posGodz[0][0] : '-'; 
        document.getElementById('pdf-out-dzien').innerText = posDni[0][1] > 0 ? posDni[0][0] : '-';
        
        document.getElementById('pdf-out-total-godz').innerText = Math.round(sumaMinut / 60) + " h"; 
        document.getElementById('pdf-out-czas').innerText = (iloscSesji > 0 ? Math.round(sumaMinut / iloscSesji) : 0) + " min";

        const elementPdf = document.getElementById('pdf-template'); 
        elementPdf.style.top = "0"; elementPdf.style.left = "0"; elementPdf.style.zIndex = "9999";
        
        html2canvas(elementPdf, { scale: 2, useCORS: true }).then(canvas => {
            const pdfOut = new window.jspdf.jsPDF('p', 'mm', 'a4');
            const pageWidth = pdfOut.internal.pageSize.getWidth();
            const pageHeight = (canvas.height * pageWidth) / canvas.width;
            pdfOut.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight); 
            pdfOut.save(`Raport_POSM_${mc}.pdf`);
            elementPdf.style.top = "-9999px"; elementPdf.style.left = "-9999px"; elementPdf.style.zIndex = "-9999"; 
            if (btn) { btn.innerText = staryTekst; btn.disabled = false; }
        }).catch(() => { 
            elementPdf.style.top = "-9999px"; 
            if (btn) { btn.innerText = staryTekst; btn.disabled = false; }
            alert("Błąd: Błąd podczas generowania pliku PDF.");
        });
    }, 100);
}