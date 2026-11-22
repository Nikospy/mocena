# Paczka „wygląd” (gałąź `final-visual`)

Cel: ekrany pokazu mają wyglądać jak praca studia dla urzędu. Autor przejrzał 17 punktów przeglądu i przy każdym wybrał „Naprawić”. Decyzja autora: „wygląd A to tylko szkielet, można go zmieniać dowolnie, byle by to były zmiany na lepsze”. Zasady wspólne: `change.md` w tym katalogu.

Wolno zmieniać: `public/style.css`, `public/rodzina.css` (tylko nowe tokeny ról), `public/tour.js`, `src/views/` (znaczniki i klasy), testy widoków. Skrypt pomiaru należy do paczki „pomiar całości”: nie zmieniasz go, nowe możliwości (szerokości 320/768/1024, stany błędu, tryb pokazu) dostaniesz po `git merge main`. Tekstów interfejsu nie zmieniasz bez potrzeby (testy tras sprawdzają treść). Kolory, rozmiary i odstępy tylko z tokenów.

## Pomiar

`bun run scripts/design-audit.ts <katalog>` przechodzi 27 ekranów pokazu w 360 i 1440 px, zapisuje `metrics.json` i zrzuty (`<ekran>-<szerokość>.jpg`, zrzuty z zaznaczeniem `--<sprawdzenie>.jpg`, próba rozmycia `--blur.jpg`). Najpierw zrób pomiar stanu wyjściowego, potem pomiar po każdej grupie zmian. Zrzuty oglądaj (zmniejsz przez `magick … -resize 1100x`), liczby to połowa odbioru.

## Punkty i progi (liczby z `metrics.json`, wszystkie ekrany, obie szerokości)

Powłoka aplikacji (pierwsza w kolejności; autor: „sam nasz navbar wygląda źle, panel użytkownika itd.”)
- **N1** Nagłówek aplikacji i panel użytkownika projektujesz od nowa, w duchu rodziny mObywatel i wzorców usług publicznych (GOV.UK header, service navigation). Stan dziś (`src/views/layout.tsx`): znak, trzy odnośniki w jednym rzędzie bez zaznaczenia bieżącej strony (żaden nie dostaje `aria-current`), „Zmień konto” i „Pokaz dla jury” udają nawigację usługi, panel użytkownika to dwa wiersze drobnego tekstu przy prawej krawędzi, na telefonie dolny pasek z trzema napisami bez ikon. Wymagania:
  - znak usługi z jednozdaniowym opisem roli usługi obok albo pod spodem (na komputerze), wyraźna dolna krawędź nagłówka zamiast cienia;
  - nawigacja zawiera tylko miejsca usługi właściwe dla roli (np. oceniający: Sprawy, Notatki; kadry: Stan cykli, Pracownicy, Zastępstwa); bieżąca strona zaznaczona `aria-current="page"` i widocznym stanem (grubość i podkreślenie, nie sam kolor);
  - panel użytkownika: imię i nazwisko, rola, a „Zmień konto” jest jego częścią (menu na `details` albo odnośnik przy nazwisku), nie pozycją nawigacji;
  - „Pokaz dla jury” i data systemowa należą do paska pokazu (punkt K6), nie do nagłówka usługi;
  - telefon: nagłówek w jednej linii (znak + panel użytkownika), dolna nawigacja z ikonami (`.ico`, kreska 1,75) i podpisami, cel co najmniej 48 px, bieżąca pozycja zaznaczona;
  - te same wyrównania co treść: lewa krawędź znaku równa lewej krawędzi `h1`.
  Zrób dwa warianty nagłówka jako zrzuty (360 i 1440 px, ekran strony głównej oceniającego i kadr), wybierz lepszy według kanonu (jedna linia wyrównania, hierarchia położeniem i grubością, zero ozdób) i wdroż go; drugi zrzut zostaw do porównania dla autora.

Typografia
- **T1** Treść (opisy kryteriów, notatki, objaśnienia, komórki tabel) ma 16 px i kolor `--text`. 14 px tylko dla metadanych (data, rodzaj, podpis pola). Próg: `under16Pct` mediana ≤ 30, żaden ekran > 50. Dziś: mediana 51–54, Część I 88–91.
- **T2** Najwyżej 4 rozmiary pisma na ekranie: 14, 16, 20, 28 (telefon: nagłówek strony 24 zamiast 28). Stopnie 12, 18 i 48 wychodzą z ekranów. Próg: `sizeCount` ≤ 4.
- **T3** Akapity, notatki i objaśnienia: `max-inline-size: 66ch`. Próg: `maxCpl` ≤ 80 przy 1440. Dziś do 142.

Hierarchia
- **H1** Jeden element w największym rozmiarze i jest nim `h1`. `h1` nazywa czynność i osobę („Ocena okresowa: Piotr Wójcik”), drobna linia kontekstu nad nim może zostać. Termin (dziś 48 px) i werdykt (28 px) schodzą do 20 px pogrubione. Próg: `biggestCount` = 1.
- **H2** Jedna akcja główna na ekranie. Strona główna to lista spraw: cały wiersz jest odnośnikiem, bez wypełnionego przycisku; sprawy z terminem na górze. Próg: `primaryCount` ≤ 1 (dziś strona główna 5, notatki 3, wejście do pokazu 6).
- **H3** Na telefonie `h1` zaczyna się najwyżej na 180 px (`h1Top`, 360 px). Dziś 217–320.

Układ
- **U1** Od ok. 1024 px ekrany cyklu (Część I, przed rozmową, karty rozmów, oś czasu, ocena) mają układ dwie trzecie plus jedna trzecia: po lewej treść, po prawej reguła, termin i akcja. Wzorem jest istniejący `.o-grid`.
- **U3** Jeden wzór nagłówka strony na wszystkich ekranach: linia kontekstu, `h1`, jedno zdanie objaśnienia, pod spodem jeden rząd odnośników w jednej postaci (zwykłe odnośniki tekstowe). Dziś są trzy wzory (strona główna, ocena, kadry).

Komponenty
- **K1** Grupowanie odstępem. Notatka w karcie to wiersz z cienką linią, bez własnej ramki i tła. Ramka zostaje dla karty sekcji i dla głosu reguły. Próg: `maxBoxDepth` ≤ 1, `boxes` ≤ 10 na ekran (dziś ocena 20, przed rozmową 22, kadry 24).
- **K2** Cień tylko dla nagłówka aplikacji i warstw nad treścią (menu, kalendarz, panel pokazu). Karty mają samą linię. Próg: `shadows` ≤ 2.
- **K3** Pigułka tylko dla stanu. Podstawa prawna to zwykły tekst z krótkim oznaczeniem („art. 81 ust. 7 ustawy”), dłuższe objaśnienie idzie do zdania obok, nie do pigułki. Odnośniki wyglądają jak odnośniki. Próg: `pillLinks` = 0.
- **K4** Telefon: notatki pod kryterium w formularzu oceny są zwinięte (`details`) z licznikiem, żeby ekran oceny miał najwyżej 4 ekrany przewijania przy 360 px (`screens`). Przepływu nie zmieniasz.
- **K5** Tabela kadr: w wierszu jeden odnośnik (nazwisko prowadzi do cyklu), kolumna „Odnośniki” znika, rozstrzygnięcie sprzeciwu przenosi się na ekran oceny tego cyklu (ten sam formularz i ta sama trasa `POST /cycles/:id/objection-outcome`).
- **K6** Pasek pokazu: jedna dyskretna linia („Pokaz · dziś 21 listopada 2026 · Zmień datę”), pole daty rozwija się po kliknięciu (`details`), na telefonie zwinięty. Nie wygląda jak część usługi.

Prawo i dostępność
- **L2** Brak przewijania w poziomie przy 360 i 320 px (`overflowPx` = 0).
- **L3** Żaden cel kliknięcia poniżej 24 px (`under24` = 0).
- **L4** Każdy ekran ma jeden widoczny `h1` (`h1Count` = 1; dziś arkusz przy 1440 ma 0).
- Bez zmian muszą zostać: kontrast (`contrastFails` = 0), etykiety pól (`unlabeled` = 0).

Stany i ekrany, których pierwszy przegląd nie objął (autor: „co jeszcze pominąłeś?”)
- **F1 Kontrolki.** Jedna wysokość pól i przycisków (48 px) i trzy postaci przycisku: wypełniony (akcja główna), z obrysem (drugorzędna), tekstowy. Małe pigułkowe przyciski („Szukaj”, „Dodaj pracownika”, „Edytuj”, „Historia ocen”, sortowanie w kadrach) znikają. Pasek akcji przyklejony do dołu zostaje tylko na telefonie; na komputerze przycisk stoi w przepływie formularza i nie zasłania pól (dziś „Zapisz notatkę” leży na żetonach kryteriów).
- **F2 Stany formularzy.** Błąd walidacji: podsumowanie błędów nad formularzem z odnośnikami do pól i komunikat przy polu (wzór GOV.UK error summary i error message), pola zachowują wpisane wartości. Stan pusty i komunikat sukcesu w tym samym języku wizualnym. Dodaj do pomiaru zrzuty po wysłaniu pustego formularza notatki, nieobecności i oceny.
- **F3 Tryb pokazu.** To główna ścieżka jury. Dodaj do pomiaru każdy krok pokazu z włączonym panelem przewodnika (360 i 1440) i doprowadź panel do tych samych reguł (pismo, przyciski, brak cienia poza samą warstwą panelu, nic nie zasłania treści).
- **F4 Pierwsze wrażenie.** Ekran wyboru konta (`/account`) i wejście do pokazu (`/tour`): hierarchia, jedna akcja główna, role jako zwykły tekst albo stan.
- **F5 Ekrany spoza pokazu.** Przejdź wszystkie trasy GET (`/hr/people/new`, edycja pracownika, `/hr/substitutions`, historia ocen, zaproszenia, docenienie, informacja zwrotna, zmiana terminu, fikcja zapoznania, `/admin/suggestion-sources`, strona błędu) i sprawdź na zrzutach, że używają tych samych wzorców nagłówka, kontrolek i odstępów.
- **F6 Szerokości i klawiatura.** Zrzuty przy 768 i 1024 px dla strony głównej, oceny i kadr (układ nie może się rozsypać między telefonem a komputerem). Fokus klawiatury widoczny na każdej kontrolce (zrzut po kilku naciśnięciach Tab).

Z zewnętrznego audytu
- W trybie pokazu (`/tour`, kolejne kroki) wokół nagłówka pojawia się czarna ramka: `public/tour.js` ustawia fokus na `h1`. Odtwórz na zrzucie w trybie pokazu i usuń ramkę (fokus zostaje dla czytników).
- Panel pokazu na komputerze zasłania tabelę kadr. Treść ma się mieścić obok panelu albo panel ma się zwijać.
- Stopka aplikacji z dwoma odnośnikami: „Wdrożenie i dane” (`/about`, trasa dojdzie z gałęzi `final-delivery`) i „Kod źródłowy” (`https://github.com/Nikospy/mocena`).

## Kolejność

0. Powłoka aplikacji (N1) razem z paskiem pokazu (K6).
1. Tokeny ról i skala pisma (T1, T2), szerokość tekstu (T3), cienie (K2).
2. Nagłówek strony i hierarchia (H1, U3), akcja główna i strona główna (H2).
3. Ramki i notatki (K1), pigułki i podstawy prawne (K3).
4. Układ szerokiego ekranu (U1), pasek pokazu i telefon (K6, H3, K4).
5. Kadry (K5), kontrolki i stany formularzy (F1, F2), drobne (L2, L3, L4), stopka.
6. Tryb pokazu i pierwsze wrażenie (F3, F4), ekrany spoza pokazu (F5), szerokości pośrednie i fokus (F6).

Po każdej grupie: pomiar, obejrzenie zrzutów, `bun test`, commit.

## Raport końcowy

Tabela „przed → po” dla progów wyżej (mediana i najgorszy ekran), lista commitów, lista punktów niezrobionych z powodem oraz ścieżki sześciu zrzutów „po” do pokazania autorowi: strona główna, Część I, ocena, przed rozmową, kadry (każdy 1440) i ocena 360. Ostatnia linia: `GOTOWE: final-visual <skrót commita>`.
