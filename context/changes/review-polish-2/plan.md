# Druga runda dopracowania (wygląd i dostępność) — plan wdrożenia

## Overview

Plaster S-14 (roadmapa M-1, kotwice MS-01 i MS-03). Drugi przegląd na lokalnej wersji po S-09–S-13 (22.11.2026, ok. 03:00) przeszedł przewodnik przy 1440 i 360 px, ekrany o jedno kliknięcie od przystanków, dodatki, dostępność (axe, klawiatura). Wcześniejsze poprawki trzymają się. Zostały usterki podzielone na 4 fazy **bez wspólnych plików** (oprócz własnych sekcji na końcu `public/style.css`). Każdą fazę buduje osobny job, równolegle.

Wszystkie fazy:
- przepisy i daty biorą się tylko z silnika i z `rules/regulation-2016-470.json`;
- słowo „potwierdzenie”, nigdy „podpis”; przy nazwisku pracownika bez etykiet;
- style w sekcji `/* review-polish-2-<faza> */` na końcu `public/style.css`, tylko na tokenach; nadpisywanie wcześniejszych reguł nowymi jest dozwolone;
- `bun run demo-check` przez `src/demo-check/run.test.ts` zostaje zielony.

## Phase 1: Ocena, część I, pigułka przepisu

Pliki: `src/views/assessment.tsx`, `src/engine/approval.ts`, `src/views/part1.tsx`, `src/cycle-links.ts`, `src/views/components.tsx`, `src/timeline.ts`.

1. **Pusta pigułka przepisu:** `LegalBasis` przy pustej liście zwraca `null`. Wpis osi czasu „Część I: potwierdzenie zapoznania z kryteriami” (`src/timeline.ts`, ok. linii 97) dostaje przepis z reguł, jeśli jest; jeśli nie ma, zostaje bez pigułki.
2. **Lista braków przed zatwierdzeniem:** zamiast osobnej linii na każde brakujące kryterium jedna linia „Brakuje ocen cząstkowych: 7” z jedną pigułką przepisu i rozwijaną listą nazw kryteriów. Pozostałe braki (uzasadnienie, wnioski do programu rozwoju) po jednej linii. Pigułka nie łamie się w środku.
3. **Nagłówek oceny:** zwarty jak `.hdr` w makiecie `ocena.html`, bez pustych odstępów.
4. **Kolumna ocen cząstkowych na ekranie ocenianego:** cyfry w jednej kolumnie (`tabular-nums`, stała szerokość, wyrównanie do końca); nagłówek karty z odstępem od krawędzi.
5. **„Potwierdzenie zapoznania z oceną: § 12”:** pigułka `LegalBasis` zamiast szarego tekstu.
6. **Odnośniki cyklu według fazy:** „Przed rozmową z pracownikiem” i „Docenienie” pokazują się dopiero w ostatnich 30 dniach przed terminem oceny albo po nim (ta sama reguła co sprawa „Wystaw ocenę”). Na 360 px rząd odnośników się zawija (`flex-wrap`), nic nie jest ucięte.

Testy: `src/routes/polish2-a.test.ts` dla 1, 2, 5, 6.

## Phase 2: Kadry i fikcja zapoznania

Pliki: `src/views/hr-overview.tsx`, `src/views/acknowledgement-fiction.tsx`, `src/routes/hr.tsx` (tylko jeśli potrzebne do danych widoku).

1. **`/hr` na telefonie:** poniżej ok. 40rem każdy cykl to karta: osoba, stan, termin z pigułką, 2–3 najważniejsze odnośniki. Bez przewijania w poziomie.
2. **`/hr` na komputerze:**
   - kolumny „Stan procesu” i „Termin” nie zawijają się do 4 linii;
   - odnośniki: najwyżej 3 widoczne, reszta pod „Więcej” (`<details>`).
3. **Karta stopnia Tomasza:** bez nawiasu wokół pigułki; zdanie kończy się kropką, pigułka stoi po nim.
4. **Fikcja zapoznania:**
   - „Powód” i „Jak doręczono” jako wybór z widocznym stanem zaznaczenia (wzorzec chipów z formularza notatki);
   - domyślnie zaznaczone „Osobiście” i dzisiejsza data;
   - bez pustej wysokiej ramki pod „Kiedy”.

Testy: `src/routes/polish2-b.test.ts` dla 1 (markup kart), 3, 4 (domyślne wartości).

## Phase 3: Przewodnik, układ, nagranie

Pliki: `src/views/tour-panel.tsx`, `public/tour.js`, `src/views/tour-done.tsx`, `src/views/tour-entry.tsx`, `src/views/layout.tsx`, `src/tour/stops.ts`, `scripts/record-demo.ts`.

1. **Kolejność fokusu:** z przystanku do „Dalej” najwyżej 3 naciśnięcia Tab. Drugi link pomijania „Przejdź do przewodnika” zaraz po „Przejdź do treści” albo karta wcześniej w DOM z zachowaniem wyglądu.
2. **Fokus po wejściu na przystanek:** po przewinięciu do pierwszego elementu fokus trafia na nagłówek strony (`tabindex="-1"`), więc pierwszy Tab nie omija linków pomijania.
3. **Przycisk „Dalej: …”** mieści się w jednej linii (krótsze etykiety albo `white-space: nowrap` i mniejszy krój w etykiecie). Tytuł przystanku z `text-wrap: balance`.
4. **Tekst przystanku 2:** „Po wpisaniu »przejął« pole »Zmiana zadań pracownika« zaznacza się samo jako podpowiedź; można je odznaczyć.” zamiast „zaznaczone jako podpowiedź”.
5. **Pasek pokazu** w układzie jest punktem orientacyjnym: `<aside aria-label="Pokaz">`. Data w pasku jest też podana słownie.
6. **Ekran końcowy:** treść wyśrodkowana w kontenerze jak inne ekrany, przyciski dodatków wyrównane do lewej krawędzi tekstu, w nagłówku nawigacja jak na wejściu.
7. **Nagranie (`scripts/record-demo.ts`):**
   - na przystanku 2 wpisuje notatkę z „Spróbuj” znak po znaku, tak żeby było widać, jak pole zmiany zadań zaznacza się samo, i zapisuje ją;
   - na przystanku 3 wpisuje obie nieobecności i otwiera oś czasu;
   - widoczny kursor (nakładka) przy kliknięciach.

Testy: `src/routes/tour.test.ts` rozszerzony o 1 (kolejność linków pomijania), 4, 5.

## Phase 4: Pola dat

Pliki: `src/views/note-form.tsx`, `src/views/absence-form.tsx`, `public/note-form.js`, nowy `public/date-words.js`.

1. Przeglądarka z językiem innym niż polski pokazuje w `<input type="date">` format amerykański („03/11/2026”). Obok każdego pola daty w formularzu notatki i nieobecności stoi data słownie („11 marca 2026”), aktualizowana na żywo przez `public/date-words.js`. Bez JS jest to wartość z serwera.
2. Nazwy pól, wartości i format wysyłany do serwera zostają bez zmian (ISO), więc trasy i automat pokazu działają jak dotąd.

Testy: `src/routes/polish2-d.test.ts`: formularze zawierają datę słownie dla wartości domyślnej i dołączają `/date-words.js`.

## Success Criteria (każda faza)

#### Automated Verification
- Testy fazy zielone, `bun test` zielony, `bun run seed` bez błędu, `wrangler deploy --dry-run` przechodzi.

#### Manual Verification
- Król przechodzi przewodnik przy 1440 i 360 px po scaleniu wszystkich faz; autor ocenia zrzuty.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Ocena, część I, pigułka przepisu

#### Automated

- [ ] 1.1 Testy fazy i cały zestaw: `bun test src/routes/polish2-a.test.ts`, `bun test`

### Phase 2: Kadry i fikcja zapoznania

#### Automated

- [ ] 2.1 Testy fazy i cały zestaw: `bun test src/routes/polish2-b.test.ts`, `bun test`

### Phase 3: Przewodnik, układ, nagranie

#### Automated

- [ ] 3.1 Testy fazy i cały zestaw: `bun test src/routes/tour.test.ts`, `bun test`

### Phase 4: Pola dat

#### Automated

- [ ] 4.1 Testy fazy i cały zestaw: `bun test src/routes/polish2-d.test.ts`, `bun test`

#### Manual

- [ ] 4.2 Przewodnik przy 1440 i 360 px po scaleniu faz 1–4, zrzuty ocenione przez autora
