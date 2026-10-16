const firebaseConfig = { databaseURL: "https://posm-sale-default-rtdb.europe-west1.firebasedatabase.app/" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const saleIIst = ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','122','128','129','130','131','132','140','141','142','143','144','145','146','147'];
const saleIst = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','22','40','41','42','43','44','45','46','47','48','49','52','57B'];
const saleJazz = ['01','02','03','04','06','07','08'];
const saleInne = ['Koncertowa','Kameralna','Lustrzana','Kryształowa'];
const wszystkieSale = saleIIst.concat(saleIst, saleJazz, saleInne);
const saleFortepian = ['1','2','5','12','18','25','40','101','105','110','Kameralna','Koncertowa']; 

let aktualneStatusy = {};
let pelneDaneSal = {};
let aktywnyFiltr = 'wszystkie';
let zalogowanyUid = null;
let zalogowanyUczen = null;
let ulubioneSale = [];
let wybranaSalaModal = null;
let wszystkieAnkiety = {};
let wszystkiePropozycje = {};

function usunPolskieZnaki(str) {
    if (!str) return "";
    const mapa = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    return String(str).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, function(c) { return mapa[c] || c; }).toLowerCase().trim();
}

// Generuje login w formacie p.nowik lub a.avila.mikolajczyk
function wygenerujLoginZImienia(imieNazwisko) {
    if (!imieNazwisko) return "uczen";
    const czyste = usunPolskieZnaki(imieNazwisko).replace(/-/g, ' ');
    const czesci = czyste.split(/\s+/).filter(function(s) { return s.length > 0; });
    if (czesci.length === 0) return "uczen";
    if (czesci.length === 1) return czesci[0];
    const pierwszaLitera = czesci[0].charAt(0);
    const resztaNazwiska = czesci.slice(1).join('.');
    return pierwszaLitera + '.' + resztaNazwiska;
}

function normalizujWpisanyLogin(str) {
    return usunPolskieZnaki(str).replace(/[-\s]+/g, '.').replace(/\.+/g, '.');
}

function ucieczkaHtml(tekst) {
    if (!tekst) return "";
    return String(tekst).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function terazDataString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

document.getElementById('haslo-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') zalogujUcznia(); });

window.przelaczZakladkeUcznia = function(nazwa) {
    ['salki', 'glosowania', 'propozycje'].forEach(function(id) {
        const btn = document.getElementById('tab-uczen-' + id);
        const widok = document.getElementById('widok-' + id);
        if (id === nazwa) {
            btn.classList.add('active');
            widok.classList.remove('hidden');
            widok.classList.add('flex');
        } else {
            btn.classList.remove('active');
            widok.classList.add('hidden');
            widok.classList.remove('flex');
        }
    });
};

window.zalogujUcznia = function() {
    const surowyLogin = document.getElementById('login-input').value.trim();
    const loginWpisany = normalizujWpisanyLogin(surowyLogin);
    const hasloWpisane = document.getElementById('haslo-input').value.trim();
    const bladEl = document.getElementById('blad-logowania');

    if (!loginWpisany || !hasloWpisane) {
        bladEl.innerText = "Wpisz login oraz hasło.";
        bladEl.classList.remove('hidden');
        return;
    }

    db.ref('uczniowie').once('value', function(snap) {
        const uczniowie = snap.val() || {};
        let znalezionyUid = null;
        let znalezioneDane = null;

        for (const [uid, u] of Object.entries(uczniowie)) {
            if (!u || !u.imie_nazwisko) continue;
            const loginKrotki = wygenerujLoginZImienia(u.imie_nazwisko);
            const loginZBazy = u.login ? normalizujWpisanyLogin(u.login) : loginKrotki;
            if (loginWpisany === loginZBazy || loginWpisany === loginKrotki || surowyLogin.toUpperCase() === uid.toUpperCase()) {
                znalezionyUid = uid;
                znalezioneDane = u;
                break;
            }
        }

        if (!znalezionyUid) {
            bladEl.innerText = "Nie znaleziono konta.";
            bladEl.classList.remove('hidden');
            return;
        }

        const poprawneHaslo = String(znalezioneDane.haslo || 'posm123');
        if (hasloWpisane !== poprawneHaslo) {
            bladEl.innerText = "Błędne hasło.";
            bladEl.classList.remove('hidden');
            return;
        }

        bladEl.classList.add('hidden');
        zalogowanyUid = znalezionyUid;
        zalogowanyUczen = znalezioneDane;
        ulubioneSale = Array.isArray(znalezioneDane.ulubione) ? znalezioneDane.ulubione : [];

        if (znalezioneDane.zmieniono_haslo !== true) {
            document.getElementById('ekran-logowania').classList.add('hidden');
            const zmianaEl = document.getElementById('ekran-zmiany-hasla');
            zmianaEl.classList.remove('hidden');
            zmianaEl.classList.add('flex');
        } else {
            localStorage.setItem('posm_uczen_uid', zalogowanyUid);
            uruchomWidokTablicy();
        }
    });
};

window.zapiszNoweHaslo = function() {
    const h1 = document.getElementById('nowe-haslo-1').value.trim();
    const h2 = document.getElementById('nowe-haslo-2').value.trim();
    const bladEl = document.getElementById('blad-zmiany-hasla');
    const dotychczasowe = String(zalogowanyUczen.haslo || '');

    if (h1.length < 4) {
        bladEl.innerText = "Hasło musi składać się z minimum 4 znaków.";
        bladEl.classList.remove('hidden');
        return;
    }
    if (h1 === dotychczasowe || h1.toLowerCase() === 'posm123') {
        bladEl.innerText = "Nowe hasło musi różnić się od hasła startowego.";
        bladEl.classList.remove('hidden');
        return;
    }
    if (h1 !== h2) {
        bladEl.innerText = "Hasła nie są identyczne.";
        bladEl.classList.remove('hidden');
        return;
    }

    const loginDomyslny = wygenerujLoginZImienia(zalogowanyUczen.imie_nazwisko);
    db.ref('uczniowie/' + zalogowanyUid).update({
        login: loginDomyslny,
        haslo: h1,
        zmieniono_haslo: true
    }).then(function() {
        zalogowanyUczen.haslo = h1;
        zalogowanyUczen.zmieniono_haslo = true;
        localStorage.setItem('posm_uczen_uid', zalogowanyUid);
        document.getElementById('ekran-zmiany-hasla').classList.add('hidden');
        document.getElementById('ekran-zmiany-hasla').classList.remove('flex');
        uruchomWidokTablicy();
    });
};

window.wylogujUcznia = function() {
    localStorage.removeItem('posm_uczen_uid');
    location.reload();
};

window.addEventListener('DOMContentLoaded', function() {
    const zapisanyUid = localStorage.getItem('posm_uczen_uid');
    if (zapisanyUid) {
        db.ref('uczniowie/' + zapisanyUid).once('value', function(snap) {
            const dane = snap.val();
            if (dane && dane.zmieniono_haslo === true) {
                zalogowanyUid = zapisanyUid;
                zalogowanyUczen = dane;
                ulubioneSale = Array.isArray(dane.ulubione) ? dane.ulubione : [];
                uruchomWidokTablicy();
            }
        });
    }
});

function uruchomWidokTablicy() {
    document.getElementById('ekran-logowania').classList.add('hidden');
    const glowny = document.getElementById('ekran-glowny');
    glowny.classList.remove('hidden');
    glowny.classList.add('flex');

    document.getElementById('nav-uczen-info').innerText = zalogowanyUczen.imie_nazwisko + ' (' + (zalogowanyUczen.klasa || '-') + ')';
    generujTablice();
    renderujUlubione();
    nasluchujZmianSal();
    nasluchujAnkietIPropozycji();
}

function nasluchujAnkietIPropozycji() {
    db.ref('samorzad_ankiety').on('value', function(snap) {
        wszystkieAnkiety = snap.val() || {};
        renderujAnkietyUcznia();
    });
    db.ref('samorzad_propozycje').on('value', function(snap) {
        wszystkiePropozycje = snap.val() || {};
        renderujPropozycjeUcznia();
    });
}

function renderujAnkietyUcznia() {
    const kontener = document.getElementById('lista-ankiet-uczen');
    const badge = document.getElementById('badge-ankiety-count');
    if (!kontener) return;
    kontener.innerHTML = '';

    const lista = Object.entries(wszystkieAnkiety)
        .map(function(e) { return Object.assign({ id: e[0] }, e[1]); })
        .sort(function(a, b) { return (b.czas || '').localeCompare(a.czas || ''); });

    const aktywneNieglosowane = lista.filter(function(a) {
        const glosy = a.glosy || {};
        return a.aktywna !== false && glosy[zalogowanyUid] === undefined;
    }).length;

    if (aktywneNieglosowane > 0) {
        badge.innerText = aktywneNieglosowane;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if (lista.length === 0) {
        kontener.innerHTML = '<div class="glass-panel p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">Brak aktywnych głosowań</div>';
        return;
    }

    lista.forEach(function(ank) {
        const opcje = Array.isArray(ank.opcje) ? ank.opcje : [];
        const glosy = ank.glosy || {};
        const mojGlos = glosy[zalogowanyUid];
        const czyAktywna = ank.aktywna !== false;

        const licznikOpcji = opcje.map(function() { return 0; });
        let sumaGlosow = 0;
        Object.values(glosy).forEach(function(wyborIdx) {
            if (licznikOpcji[wyborIdx] !== undefined) {
                licznikOpcji[wyborIdx]++;
                sumaGlosow++;
            }
        });

        let opcjeHtml = '';
        opcje.forEach(function(opcjaTekst, idx) {
            const ile = licznikOpcji[idx] || 0;
            const proc = sumaGlosow > 0 ? Math.round((ile / sumaGlosow) * 100) : 0;
            const czyWybrana = (mojGlos === idx);

            if (mojGlos !== undefined || !czyAktywna) {
                const obramowanie = czyWybrana ? 'border-teal-400 bg-teal-500/15' : 'border-white/10 bg-slate-900/60';
                opcjeHtml += '<div class="relative overflow-hidden rounded-xl border ' + obramowanie + ' p-3.5 mb-2.5">' +
                    '<div class="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/25 to-blue-500/25 transition-all duration-500" style="width: ' + proc + '%;"></div>' +
                    '<div class="relative flex justify-between items-center text-xs sm:text-sm gap-2">' +
                        '<span class="font-semibold text-white flex items-center gap-2 flex-wrap">' + ucieczkaHtml(opcjaTekst) + (czyWybrana ? '<span class="emblem emblem-cyan">Twój głos</span>' : '') + '</span>' +
                        '<span class="font-bold text-teal-300 shrink-0">' + proc + '% (' + ile + ')</span>' +
                    '</div>' +
                '</div>';
            } else {
                opcjeHtml += '<button onclick="oddajGlosWAnkiecie(\'' + ank.id + '\', ' + idx + ')" class="w-full text-left rounded-xl border border-white/10 hover:border-teal-400 bg-slate-900/70 hover:bg-teal-500/10 p-3.5 mb-2.5 transition-all flex justify-between items-center text-xs sm:text-sm font-semibold text-white">' +
                    '<span>' + ucieczkaHtml(opcjaTekst) + '</span>' +
                    '<span class="emblem emblem-cyan shrink-0">Zagłosuj</span>' +
                '</button>';
            }
        });

        const statusBadge = czyAktywna 
            ? '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Aktywne</span>'
            : '<span class="emblem emblem-rose">Zakończone</span>';

        kontener.innerHTML += '<div class="glass-panel p-5 sm:p-7">' +
            '<div class="flex justify-between items-start gap-3 mb-2">' +
                '<h3 class="text-base sm:text-lg font-extrabold text-white">' + ucieczkaHtml(ank.tytul) + '</h3>' +
                statusBadge +
            '</div>' +
            (ank.opis ? '<p class="text-xs sm:text-sm text-slate-300 mb-4">' + ucieczkaHtml(ank.opis) + '</p>' : '') +
            '<div class="mt-3">' + opcjeHtml + '</div>' +
            '<div class="flex justify-between items-center text-[11px] text-slate-400 mt-4 pt-3 border-t border-white/10">' +
                '<span>Oddanych głosów: <b class="text-white">' + sumaGlosow + '</b></span>' +
                '<span>' + (ank.czas || '-') + '</span>' +
            '</div>' +
        '</div>';
    });
}

window.oddajGlosWAnkiecie = function(idAnkiety, idxOpcji) {
    if (!zalogowanyUid) return;
    const ank = wszystkieAnkiety[idAnkiety];
    if (!ank || ank.aktywna === false) return;
    if (ank.glosy && ank.glosy[zalogowanyUid] !== undefined) return;

    const ref = db.ref('samorzad_ankiety/' + idAnkiety + '/glosy/' + zalogowanyUid);
    ref.transaction(function(obecnyGlos) {
        if (obecnyGlos === null) return idxOpcji;
        return;
    });
};

window.dodajPropozycje = function() {
    const tytul = document.getElementById('prop-tytul').value.trim();
    const opis = document.getElementById('prop-opis').value.trim();
    const czyAnonim = document.getElementById('prop-anonim').checked;

    if (tytul.length < 4 || opis.length < 6) {
        alert("Wprowadź tytuł oraz treść propozycji.");
        return;
    }

    const prawdziwyAutor = zalogowanyUczen.imie_nazwisko + ' (' + (zalogowanyUczen.klasa || '-') + ')';
    db.ref('samorzad_propozycje').push({
        tytul: tytul,
        opis: opis,
        anonim: czyAnonim,
        autor_prawdziwy: prawdziwyAutor,
        autor_uid: zalogowanyUid,
        czas: terazDataString(),
        status: 'Nowa',
        odpowiedz_admina: ''
    }).then(function() {
        document.getElementById('prop-tytul').value = '';
        document.getElementById('prop-opis').value = '';
        document.getElementById('prop-anonim').checked = false;
    });
};

window.glosujNaPropozycje = function(idProp, typ) {
    if (!zalogowanyUid) return;
    const prop = wszystkiePropozycje[idProp];
    if (!prop) return;
    if (prop.glosy && prop.glosy[zalogowanyUid] !== undefined) return;

    const ref = db.ref('samorzad_propozycje/' + idProp + '/glosy/' + zalogowanyUid);
    ref.transaction(function(obecnyGlos) {
        if (obecnyGlos === null) return typ;
        return;
    });
};

function renderujPropozycjeUcznia() {
    const kontener = document.getElementById('lista-propozycji-uczen');
    if (!kontener) return;
    kontener.innerHTML = '';

    const lista = Object.entries(wszystkiePropozycje)
        .map(function(e) { return Object.assign({ id: e[0] }, e[1]); })
        .sort(function(a, b) { return (b.czas || '').localeCompare(a.czas || ''); });

    if (lista.length === 0) {
        kontener.innerHTML = '<div class="glass-panel p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">Brak propozycji</div>';
        return;
    }

    lista.forEach(function(p) {
        const glosy = p.glosy || {};
        let za = 0, przeciw = 0;
        Object.values(glosy).forEach(function(g) {
            if (g === 'za') za++;
            else if (g === 'przeciw') przeciw++;
        });
        const mojGlos = glosy[zalogowanyUid];
        const juzGlosowal = (mojGlos !== undefined);

        const autorBadge = p.anonim 
            ? '<span class="emblem emblem-cyan">Anonim</span>' 
            : '<span class="emblem emblem-emerald">' + ucieczkaHtml(p.autor_prawdziwy || 'Uczeń') + '</span>';

        const status = p.status || 'Nowa';
        let klasaEmblematu = 'emblem-amber';
        if (status === 'Zaakceptowana' || status === 'W realizacji') klasaEmblematu = 'emblem-emerald';
        else if (status === 'Odrzucona') klasaEmblematu = 'emblem-rose';

        const stylZa = (mojGlos === 'za') 
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 cursor-default' 
            : (juzGlosowal ? 'bg-slate-900/50 text-slate-500 border-white/5 cursor-not-allowed' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30');
        const stylPrzeciw = (mojGlos === 'przeciw') 
            ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25 cursor-default' 
            : (juzGlosowal ? 'bg-slate-900/50 text-slate-500 border-white/5 cursor-not-allowed' : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30');

        const odpowiedzHtml = p.odpowiedz_admina 
            ? '<div class="mt-3.5 p-3.5 rounded-xl bg-slate-900/90 border border-teal-400/30 text-xs">' +
                '<span class="font-bold text-teal-300 uppercase tracking-wider block mb-1">Odpowiedź Samorządu / Dyrekcji</span>' +
                '<span class="text-slate-100">' + ucieczkaHtml(p.odpowiedz_admina) + '</span>' +
              '</div>'
            : '';

        const atrybutDisabled = juzGlosowal ? 'disabled' : '';
        const akcjaZa = juzGlosowal ? '' : 'onclick="glosujNaPropozycje(\'' + p.id + '\', \'za\')"';
        const akcjaPrzeciw = juzGlosowal ? '' : 'onclick="glosujNaPropozycje(\'' + p.id + '\', \'przeciw\')"';

        kontener.innerHTML += '<div class="glass-panel p-5 sm:p-7">' +
            '<div class="flex flex-wrap justify-between items-start gap-2 mb-3">' +
                '<h3 class="text-base sm:text-lg font-extrabold text-white">' + ucieczkaHtml(p.tytul) + '</h3>' +
                '<span class="emblem ' + klasaEmblematu + '">' + ucieczkaHtml(status) + '</span>' +
            '</div>' +
            '<p class="text-xs sm:text-sm text-slate-200 whitespace-pre-line mb-3">' + ucieczkaHtml(p.opis) + '</p>' +
            odpowiedzHtml +
            '<div class="flex flex-wrap justify-between items-center gap-3 mt-4 pt-3.5 border-t border-white/10">' +
                '<div class="flex items-center gap-2.5">' +
                    autorBadge +
                    '<span class="text-[11px] text-slate-400">' + (p.czas || '-') + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<button ' + atrybutDisabled + ' ' + akcjaZa + ' class="px-4 py-2 rounded-xl border text-xs font-bold transition-all ' + stylZa + '">Za (' + za + ')</button>' +
                    '<button ' + atrybutDisabled + ' ' + akcjaPrzeciw + ' class="px-4 py-2 rounded-xl border text-xs font-bold transition-all ' + stylPrzeciw + '">Przeciw (' + przeciw + ')</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    });
}

window.otworzModalQR = function() {
    document.getElementById('qr-imie').innerText = zalogowanyUczen.imie_nazwisko;
    document.getElementById('qr-szczegoly').innerText = 'Klasa ' + (zalogowanyUczen.klasa || '-') + ' • ' + (zalogowanyUczen.instrument || '-');
    document.getElementById('qr-uid-tekst').innerText = zalogowanyUid;

    const box = document.getElementById('qrcode-box');
    box.innerHTML = '';
    new QRCode(box, {
        text: String(zalogowanyUid),
        width: 185,
        height: 185,
        colorDark: "#081018",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    const m = document.getElementById('modal-qr');
    m.classList.remove('hidden');
    m.classList.add('flex');
};

window.zamknijModalQR = function() {
    const m = document.getElementById('modal-qr');
    m.classList.add('hidden');
    m.classList.remove('flex');
};

function klasyKafelkaWgStatusu(status) {
    if (status === 'ZAJĘTA') {
        return "sala-kafelek kafelek-zajeta relative flex items-center justify-center p-2.5 h-14 sm:h-16 rounded-2xl font-extrabold text-sm sm:text-base cursor-pointer";
    } else if (status === 'ZABLOKOWANA') {
        return "sala-kafelek kafelek-zablokowana relative flex items-center justify-center p-2.5 h-14 sm:h-16 rounded-2xl font-extrabold text-sm sm:text-base cursor-pointer";
    }
    return "sala-kafelek kafelek-wolna relative flex items-center justify-center p-2.5 h-14 sm:h-16 rounded-2xl font-extrabold text-sm sm:text-base cursor-pointer";
}

function wnetrzeKafelka(nr) {
    const czyUlubiona = ulubioneSale.includes(nr);
    const znacznik = czyUlubiona ? '<span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>' : '';
    return znacznik + '<span>' + nr + '</span>';
}

function generujTablice() {
    wypelnijGrupe('grid-IIst', saleIIst, 'IIst');
    wypelnijGrupe('grid-Ist', saleIst, 'Ist');
    wypelnijGrupe('grid-jazz', saleJazz, 'jazz');
    wypelnijGrupe('grid-inne', saleInne, 'inne');
}

function wypelnijGrupe(id, lista, kat) {
    const kon = document.getElementById(id);
    kon.innerHTML = '';
    lista.forEach(function(nr) {
        const maF = saleFortepian.includes(nr) ? "true" : "false";
        const st = aktualneStatusy[nr] || 'WOLNA';
        kon.innerHTML += '<div id="sala-' + nr + '" onclick="otworzModalSali(\'' + nr + '\')" data-kategoria="' + kat + '" data-fortepian="' + maF + '" class="' + klasyKafelkaWgStatusu(st) + '">' + wnetrzeKafelka(nr) + '</div>';
    });
}

function renderujUlubione() {
    const sekcja = document.getElementById('sekcja-ulubione');
    const grid = document.getElementById('grid-ulubione');
    if (!ulubioneSale || ulubioneSale.length === 0) {
        sekcja.classList.add('hidden');
        return;
    }
    sekcja.classList.remove('hidden');
    grid.innerHTML = '';
    ulubioneSale.forEach(function(nr) {
        const st = aktualneStatusy[nr] || 'WOLNA';
        grid.innerHTML += '<div id="ulub-sala-' + nr + '" onclick="otworzModalSali(\'' + nr + '\')" class="' + klasyKafelkaWgStatusu(st) + '">' + wnetrzeKafelka(nr) + '</div>';
    });
}

window.ustawFiltr = function(filtr) {
    aktywnyFiltr = filtr;
    document.querySelectorAll('.filtr-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.getElementById('btn-' + filtr).classList.add('active');

    wszystkieSale.forEach(function(nr) {
        const kaf = document.getElementById('sala-' + nr);
        if (!kaf) return;
        let pokaz = false;
        if (filtr === 'wszystkie') pokaz = true;
        else if (filtr === 'wolne' && (aktualneStatusy[nr] === 'WOLNA' || !aktualneStatusy[nr])) pokaz = true;
        else if (filtr === 'fortepian' && kaf.dataset.fortepian === "true") pokaz = true;
        if (pokaz) kaf.classList.remove('ukryta'); else kaf.classList.add('ukryta');
    });
};

function nasluchujZmianSal() {
    db.ref('sale_aktualne').on('value', function(snap) {
        if(snap.val()) {
            const czyPierwsze = Object.keys(aktualneStatusy).length === 0;
            pelneDaneSal = snap.val();

            for (const [nr, daneSali] of Object.entries(snap.val())) {
                let status = (typeof daneSali === 'string') ? daneSali : (daneSali && daneSali.status ? daneSali.status : 'WOLNA');
                const czyZmiana = aktualneStatusy[nr] !== status;
                aktualneStatusy[nr] = status; 
                
                const kaf = document.getElementById('sala-' + nr);
                if(kaf) {
                    const czyU = kaf.classList.contains('ukryta');
                    kaf.className = klasyKafelkaWgStatusu(status);
                    kaf.innerHTML = wnetrzeKafelka(nr);
                    if (czyU) kaf.classList.add('ukryta');
                    
                    if (czyZmiana && !czyPierwsze) {
                        kaf.classList.remove('zaktualizowano'); 
                        void kaf.offsetWidth; 
                        kaf.classList.add('zaktualizowano');
                        setTimeout(function() { kaf.classList.remove('zaktualizowano'); }, 600);
                    }
                }
            }
            renderujUlubione();
            ustawFiltr(aktywnyFiltr);
        }
    });
}

window.otworzModalSali = function(nrSali) {
    wybranaSalaModal = nrSali;
    document.getElementById('akcja-sala-nr').innerText = nrSali;
    document.getElementById('opis-usterki-input').value = '';
    document.getElementById('potwierdzenie-usterki').classList.add('hidden');

    const st = aktualneStatusy[nrSali] || 'WOLNA';
    const statusEl = document.getElementById('akcja-sala-status');
    if (st === 'WOLNA') {
        statusEl.innerHTML = '<span class="emblem emblem-emerald"><span class="status-dot dot-emerald"></span>Wolna</span>';
    } else if (st === 'ZAJĘTA') {
        statusEl.innerHTML = '<span class="emblem emblem-rose"><span class="status-dot dot-rose"></span>Zajęta</span>';
    } else {
        const powod = (pelneDaneSal[nrSali] && pelneDaneSal[nrSali].kto) ? pelneDaneSal[nrSali].kto : 'Zablokowana';
        statusEl.innerHTML = '<span class="emblem emblem-purple"><span class="status-dot dot-purple"></span>' + ucieczkaHtml(powod) + '</span>';
    }

    aktualizujPrzyciskUlubioneModal();

    const m = document.getElementById('modal-sala-uczen');
    m.classList.remove('hidden');
    m.classList.add('flex');
};

function aktualizujPrzyciskUlubioneModal() {
    const btn = document.getElementById('btn-toggle-ulubiona');
    const czyUlub = ulubioneSale.includes(wybranaSalaModal);
    if (czyUlub) {
        btn.className = "w-full mb-5 py-3.5 rounded-xl font-bold text-xs border border-amber-400/50 bg-amber-500/20 text-amber-200 transition-all";
        btn.innerText = 'Usuń z ulubionych';
    } else {
        btn.className = "btn-primary-gradient w-full mb-5 py-3.5 rounded-xl font-bold text-xs";
        btn.innerText = 'Dodaj do ulubionych';
    }
}

window.przelaczUlubionaSale = function() {
    if (!wybranaSalaModal || !zalogowanyUid) return;
    const idx = ulubioneSale.indexOf(wybranaSalaModal);
    if (idx > -1) ulubioneSale.splice(idx, 1);
    else ulubioneSale.push(wybranaSalaModal);

    db.ref('uczniowie/' + zalogowanyUid + '/ulubione').set(ulubioneSale);
    aktualizujPrzyciskUlubioneModal();
    generujTablice();
    ustawFiltr(aktywnyFiltr);
    renderujUlubione();
};

window.wyslijZgloszenieUsterki = function() {
    const opis = document.getElementById('opis-usterki-input').value.trim();
    if (!opis) return;
    const zglaszajacy = zalogowanyUczen.imie_nazwisko + ' (' + (zalogowanyUczen.klasa || '-') + ')';

    db.ref('usterki_sal').push({
        sala: wybranaSalaModal,
        opis: opis,
        kto: zglaszajacy,
        uid: zalogowanyUid,
        czas: terazDataString()
    }).then(function() {
        document.getElementById('opis-usterki-input').value = '';
        document.getElementById('potwierdzenie-usterki').classList.remove('hidden');
    });
};

window.zamknijModalSali = function() {
    const m = document.getElementById('modal-sala-uczen');
    m.classList.add('hidden');
    m.classList.remove('flex');
};