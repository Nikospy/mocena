# Przewodnik pokazu dla jurora — plan wdrożenia

## Overview

Plaster S-08 (roadmapa M-1, kotwica MS-02, decyzje 13e i 13h). Juror otwiera link do żywej wersji i bez żadnej instrukcji przechodzi cały proces jednej oceny w ok. 3 minuty. Wejście pokazuje tezę i oś dwóch lat Piotra z pięcioma przystankami. Przycisk „Rozpocznij pokaz” prowadzi przez 7 przystanków, czyli 5 kroków z `context/foundation/demo.md`, przy czym kroki 1 i 5 mają po dwa przystanki. Na każdym przystanku jedno kliknięcie „Dalej” robi trzy rzeczy: ustawia dane pokazowe w stanie sprzed przystanku, przełącza konto i datę systemową oraz otwiera właściwy ekran. Karta boczna mówi, co się dzieje, na co patrzeć (numery widać też na ekranie) i który przepis działa.

Wzorzec wyglądu: `context/design/mockups/tour/v3-entry.html` (wejście) i `context/design/mockups/tour/v2-step.html` (karta kroku). Ekrany aplikacji pod kartą zostają bez zmian.

## Current State Analysis

- `GET /` bez konta przekierowuje na wybór konta (`src/index.tsx`). Konto siedzi w ciasteczku `person_id`, a dane każdego widza w osobnej bazie (Durable Object na Cloudflare, ciasteczko `mocena_demo`).
- `POST /demo/restart` czyści wszystkie tabele i woła `runSeed(db, { liveStep2: true })`. `POST /demo/date` przesuwa datę tylko do przodu (`settings.demo_date`).
- `runSeed` ma opcje `liveStep2` (bez notatki z 11.03.2026) i `afterStep1` (część I Piotra gotowa). Seedy: `src/seed/{base,part1,notes,absences,assessments}.ts`.
- Pasek „Pokaz” w `src/views/layout.tsx` ma formularz daty i restart.
- Aplikacja działa też na Cloudflare Workers: w trasach i modułach nie wolno używać `Bun.*`, `bun:sqlite` ani `node:fs`. Baza tylko przez `getDb()`.

## Desired End State

1. **Wejście.** `GET /` bez konta i `GET /tour` pokazują ekran wejścia według `v3-entry.html`:
   - nagłówek „Ten asystent nie pisze oceny.”;
   - zdanie tezy;
   - przycisk „Rozpocznij pokaz”;
   - dopisek „5 kroków na ocenie Piotra Wójcika, około 3 minut. Każdy krok sam przełącza konto i datę.”;
   - karta „Dwa lata Piotra w pięciu chwilach”: oś od XI 2024 do XI 2026 z przystankami 1–5 i wyróżnionym odcinkiem „ostatnie tygodnie”, pod nią 5 kart z datą, tytułem, osobą i pigułką przepisu;
   - drugi odnośnik „Wybierz konto i klikaj samodzielnie” prowadzi do `/account`;
   - stopka „Działa na regułach, bez modelu językowego. Osoby i zdarzenia są fikcyjne.”

   Gdy widz ma już konto, `GET /` pokazuje jego stronę główną jak dziś. Wejście jest wtedy pod `/tour`, a w nagłówku układu stoi odnośnik „Pokaz dla jury”.
2. **Przystanek.** `POST /tour/:stop` (stop: `1`, `1b`, `2`, `3`, `4`, `5`, `5b`) w jednej transakcji:
   - czyści bazę widza i buduje stan sprzed przystanku (sekcja „Stany danych”);
   - ustawia datę przystanku bezpośrednio w `settings`, bo reguła „tylko do przodu” dotyczy formularza daty, a nie przewodnika;
   - ustawia ciasteczka `person_id` i `mocena_tour=<stop>`;
   - przekierowuje (303) na ekran przystanku.

   Przystanki są niezależne: „Dalej” i „Wstecz” działają tak samo bez względu na to, czy juror coś kliknął w aplikacji.
3. **Karta kroku.** Gdy jest ciasteczko `mocena_tour` z poprawnym przystankiem, układ rysuje kartę według `v2-step.html`:
   - na komputerze panel z prawej o szerokości ok. 380 px, treść aplikacji się zwęża i nic nie jest zasłonięte;
   - na telefonie (360 px) karta przyklejona u dołu, domyślnie zwinięta do paska z tytułem, „Krok N z 5” i „Dalej”, rozwijana bez JS (`<details>`);
   - zawartość: „Krok N z 5”, pasek 5 odcinków, chipy konta i daty, tytuł, zdanie główne, „Na co patrzeć” (lista numerowana), „Spróbuj” (jedna czynność, opcjonalna), pigułka przepisu, „Wstecz” i „Dalej: <następny przystanek>”, a pod przyciskiem drobny dopisek, co przełączy „Dalej” (np. „Przełączy na konto Piotra i datę 22 listopada 2026”);
   - gdy juror zszedł z ekranu przystanku, karta pokazuje odnośnik „Wróć do ekranu kroku”;
   - odnośnik „Zakończ pokaz” zdejmuje ciasteczko `mocena_tour` i prowadzi do zwykłej strony głównej.

   W trybie przewodnika pasek „Pokaz” (data, restart) jest schowany, bo datą steruje przewodnik.
4. **Numery na ekranie.** Każda pozycja „Na co patrzeć” może mieć selektor CSS elementu ekranu. Mały skrypt `public/tour.js` znajduje element, daje mu atrybut `data-look="N"` (styl numeru i obwódki jak w `v2-step.html`) i przewija pierwszy element w widok. Gdy elementu nie ma, pozycja zostaje tylko na liście. Strona działa bez JS, wtedy po prostu bez numerów.
5. **Koniec.** Po przystanku `5b` „Dalej: koniec” prowadzi do `GET /tour/done`, czyli ekranu „Koniec pokazu”:
   - 5 zdań „Co widziałeś” (po jednym na krok);
   - „W wersji 5-minutowej warto zobaczyć”: oś czasu Ewy ze zmianą oceniającego (§ 9 ust. 3), fikcja zapoznania, źródła podpowiedzi (`/admin/suggestion-sources`);
   - przyciski „Zacznij od nowa” (`POST /tour/1`) i „Klikaj samodzielnie” (`/account`, tryb przewodnika zdjęty).
6. Słowa „podpis” nie ma nigdzie w treści przewodnika. Przy nazwisku pracownika nie ma etykiet ani wskaźników. Przewodnik niczego nie zapisuje za jurora poza stanem danych pokazowych, który buduje na jego kliknięcie „Dalej”.

### Przystanki: treść

Daty i konta są w `demo.md`. Pigułki przepisów i liczby (terminy) **bierzesz z silnika i z pliku reguł** (`rules/regulation-2016-470.json`, `src/engine/*`). Tekst nie może podawać przepisu ani daty, których silnik nie potwierdza. Gdy przepisu nie ma w regułach, przystanek nie ma pigułki. Selektory podajesz według prawdziwego markupu ekranów; poniżej jest tylko opis elementu.

| Stop | Krok | Konto, data | Ekran | Tytuł |
|---|---|---|---|---|
| 1 | 1 z 5 | marek, 2024-12-09 | część I Piotra | Kryteria na początku cyklu |
| 1b | 1 z 5 | piotr, 2024-12-09 | część I Piotra (widok ocenianego) | Piotr potwierdza kryteria |
| 2 | 2 z 5 | marek, 2026-03-11 | nowa notatka o Piotrze | Notatka w dniu, w którym coś się stało |
| 3 | 3 z 5 | joanna, 2026-11-10 | nieobecności Piotra | Nieobecność przesuwa termin |
| 4 | 4 z 5 | marek, 2026-11-21 | formularz oceny Piotra | Jedna „1” przesądza o wyniku |
| 5 | 5 z 5 | piotr, 2026-11-22 | ocena Piotra (widok ocenianego) | Zapoznanie i 7 dni na sprzeciw |
| 5b | 5 z 5 | joanna, 2026-11-22 | `/hr` | Kadry widzą cały urząd |

Teksty, które można skrócić, ale nie zmieniać ich sensu:

- **1.**
  - Zdanie: „Marek zaczyna dwuletni cykl oceny Piotra. System sam dobrał arkusz i podpowiada kryteria dodatkowe, każde z powodem. Wybór należy do Marka.”
  - Na co patrzeć:
    1. termin rozmowy o kryteriach z przepisem;
    2. podpowiedzi kryteriów: ramka przerywana, powód, można odrzucić;
    3. karta rozmowy rozpoczynającej z tematami z przepisu.
  - Spróbuj: „Zaznacz »Orientacja na klienta/interesanta« i »Myślenie analityczne«, potem przekaż Piotrowi.”
- **1b.**
  - Zdanie: „Piotr zna kryteria i oczekiwania, zanim zacznie się okres oceny. Potwierdza je jednym kliknięciem.”
  - Na co patrzeć:
    1. przycisk potwierdzenia;
    2. po potwierdzeniu miejscowość, data i nazwisko wpisują się same, a kryteria się blokują.
- **2.**
  - Zdanie: „Marek zapisuje fakt w dniu, w którym się zdarzył, a nie po dwóch latach z pamięci. Asystent nie ocenia notatki. Zauważa tylko słowo »przejął« i pyta, czy to stała zmiana zadań.”
  - Na co patrzeć:
    1. pole „Zmiana zadań pracownika” zaznaczone jako podpowiedź, do odznaczenia;
    2. po zapisie pytanie „To stała zmiana zadań?”, a po „Tak” karta rozmowy i forma rozwoju;
    3. przy nazwisku Piotra nie ma punktów ani etykiet.
  - Spróbuj: „Wpisz »Piotr przejął kolejkę wniosków po odejściu kolegi«, wybierz kryterium Rzetelność i zapisz.” Uwaga ze scenariusza: drugiej notatki nie przypisuj do „Myślenia analitycznego”, bo krok 4 pokazuje je jako kryterium bez notatek.
- **3.**
  - Zdanie: „Joanna wpisuje dwie nieobecności Piotra rozdzielone weekendem. System liczy je jako jedną, dłuższą niż miesiąc, i sam przesuwa termin oceny.”
  - Na co patrzeć:
    1. jedna ciągła nieobecność od 05.10 do 06.11.2026;
    2. nowy termin oceny z przepisem;
    3. na osi czasu kropka pełna to przepis, a pusta to wpis człowieka.
  - Spróbuj: „Wpisz 05.10–16.10.2026 i 19.10–06.11.2026, potem otwórz oś czasu.”
- **4.**
  - Zdanie: „Formularz oceny wypełnia się w ostatnim tygodniu, ale notatki są z 24 miesięcy. Punkty stawia Marek. System liczy wynik według przepisu i pilnuje braków.”
  - Na co patrzeć:
    1. notatki przy kryteriach, podzielone na sprzed zmiany zadań i po niej;
    2. ostrzeżenie, gdy fakty do kryterium są tylko z ostatniego miesiąca;
    3. po „1” przy Rzetelności wynik jest negatywny mimo średniej powyżej 4, a zatwierdzenie czeka na uzasadnienie i wnioski do programu rozwoju.
  - Spróbuj: „Postaw »1« przy Rzetelności i kliknij »Wstaw do uzasadnienia«.”
  - Dopisek: „»1« stawiamy na pokaz, żeby było widać regułę.”
- **5.**
  - Zdanie: „Piotr czyta ocenę z uzasadnieniem złożonym z notatek i potwierdza zapoznanie. Od tej chwili biegnie termin na sprzeciw.”
  - Na co patrzeć:
    1. przycisk potwierdzenia zapoznania;
    2. termin sprzeciwu z przepisem; gdy wypada w dzień wolny, przesuwa się na dzień roboczy.
  - Spróbuj: „Potwierdź zapoznanie.”
- **5b.**
  - Zdanie: „Joanna widzi stan wszystkich cykli w urzędzie. System przypomina o obowiązku urzędu: Tomaszowi należy się kolejny stopień służbowy z mocy prawa.”
  - Na co patrzeć:
    1. karta stopnia Tomasza z terminem i przepisem;
    2. stan cykli z terminami;
    3. „Drukuj / pobierz PDF” przy arkuszu.

Zdania „Co widziałeś” na ekranie końcowym (po jednym na krok):
1. Kryteria ustala człowiek, system podpowiada z powodem.
2. Fakty zapisuje się w dniu zdarzenia, nie z pamięci po dwóch latach.
3. Terminy liczy przepis, także po nieobecnościach.
4. Wynik liczy przepis, punkty stawia przełożony.
5. Zapoznanie i sprzeciw mają swoje terminy, a kadry widzą obowiązki urzędu.

### Stany danych (przed przystankiem)

Funkcja `applyTourStop(db, stop)` w `src/tour/state.ts` czyści tabele tak jak `/demo/restart` i buduje stan. Do kroków poprzednich używa istniejących funkcji domenowych i seedów (te same reguły co w trasach), a nie wywołań HTTP.

| Stop | Stan |
|---|---|
| 1 | `runSeed` z `liveStep2: true`, bez części I Piotra (jak `/demo/restart`). |
| 1b | Jak 1, plus część I Piotra przekazana przez Marka z kryteriami ze scenariusza (Orientacja na klienta/interesanta, Myślenie analityczne, oczekiwanie przy jednym), **jeszcze nie potwierdzona**. |
| 2 | Część I potwierdzona (jak `afterStep1`), bez notatki z 11.03.2026 (`liveStep2: true`). |
| 3 | Część I potwierdzona, wszystkie notatki (w tym ta z 11.03.2026 z odpowiedzią „tak” na pytanie o stałą zmianę zadań, jeśli dane to przewidują), bez nieobecności Piotra. |
| 4 | Jak 3, plus dwie nieobecności Piotra ze scenariusza. |
| 5 | Jak 4, plus ocena Piotra zatwierdzona przez Marka: oceny cząstkowe ze scenariusza z „1” przy Rzetelności, uzasadnienie z notatek, wnioski do programu rozwoju. Bez zapoznania. |
| 5b | Jak 5, plus zapoznanie Piotra z 22.11.2026. |

Gdy kod różni się od tabeli (na przykład `afterStep1` obejmuje już potwierdzenie), stan budujesz tak, żeby ekran przystanku pokazywał to, co opisuje „Na co patrzeć”, a rozjazd zapisujesz w raporcie.

### Key Discoveries

- Przystanki muszą być niezależne. Data idzie tylko do przodu, a juror może coś pominąć albo kliknąć coś innego. Dlatego każdy przystanek odbudowuje dane od zera.
- Notatki i nieobecności „z przyszłości” są widoczne dopiero, gdy data minie ich datę (`demo.md`). Stan danych może więc zawierać wpisy późniejsze niż data przystanku.

## What We're NOT Doing

- Nie zmieniamy ekranów aplikacji pod kartą. Ich poprawki idą w S-09 (`review-polish`). Wyjątek: atrybuty potrzebne selektorom, jeśli bez nich elementu nie da się wskazać (np. `data-tour="result"`).
- Bez nagrywania, bez dźwięku, bez automatycznego klikania za jurora.
- Bez nowych reguł prawnych: przewodnik tylko pokazuje to, co liczy silnik.

## Implementation Approach

Nowe pliki:
- `src/tour/stops.ts`: dane przystanków (id, krok, konto, data, adres ekranu, tytuł, zdanie, lista „Na co patrzeć” z selektorami, „Spróbuj”, przepis, następny i poprzedni);
- `src/tour/state.ts`: `applyTourStop`;
- `src/routes/tour.tsx`: `/tour`, `/tour/:stop`, `/tour/done`, `/tour/end`;
- `src/views/tour-entry.tsx`, `src/views/tour-panel.tsx`, `src/views/tour-done.tsx`;
- `public/tour.js`.

Zmiany w istniejących plikach:
- `src/views/layout.tsx`: karta, gdy jest przewodnik; odnośnik „Pokaz dla jury”; ukrycie paska „Pokaz”;
- `src/index.tsx`: wejście na `/` bez konta i podpięcie trasy.

Style: sekcja `/* guided-demo-tour */` na końcu `public/style.css`, tylko na tokenach z `rodzina.css`, według stylów z `<style>` makiet.

## Phase 1: Wersja minimalna

### Changes Required

1. `src/tour/stops.ts` i `src/tour/state.ts` dla wszystkich 7 przystanków.
2. Trasy `/tour`, `POST /tour/:stop`, `/tour/done`, `POST /tour/end`. `GET /` bez konta pokazuje wejście.
3. Karta kroku w układzie (komputer: panel z prawej; telefon: zwinięta karta u dołu) z treścią z tabeli, „Wstecz”, „Dalej”, „Zakończ pokaz”, „Wróć do ekranu kroku”.
4. Ekran wejścia według `v3-entry.html` (oś z 5 przystankami, 5 kart; na telefonie pionowa lista jak w `v3-entry-360`).
5. Ekran końcowy.

### Success Criteria

#### Automated Verification
- `bun test src/tour/state.test.ts`: dla każdego przystanku stan danych zgadza się z tabelą „Stany danych”. Sprawdzane: część I Piotra przekazana albo potwierdzona, liczba notatek Piotra i obecność notatki z 11.03.2026, nieobecności Piotra, stan oceny i wynik negatywny w 5, zapoznanie w 5b. Dwukrotne `applyTourStop` daje ten sam stan.
- `bun test src/routes/tour.test.ts`:
  - `GET /` bez ciasteczka zawiera „Ten asystent nie pisze oceny.” i „Rozpocznij pokaz”;
  - `POST /tour/4` daje 303 na ekran oceny Piotra i ustawia `person_id=marek` oraz `mocena_tour=4`;
  - ekran z ciasteczkiem przewodnika zawiera tytuł przystanku, „Krok 4 z 5” i formularz „Dalej” do `/tour/5`;
  - `POST /tour/5` po `POST /tour/4` działa (data 2026-11-22), a `POST /tour/1` po `POST /tour/5b` też działa (powrót w czasie przez przewodnik);
  - `POST /tour/end` zdejmuje ciasteczko;
  - nieznany przystanek daje 404;
  - w HTML żadnego przystanku, wejścia ani końca nie ma słowa „podpis”.
- `bun test` zielony, `bun run seed` bez błędu, `node_modules/.bin/wrangler deploy --dry-run --outdir dist` przechodzi.

#### Manual Verification
- Cały przewodnik kliknięty w Chromium przy 1440 px i 360 px. Zrzuty wejścia i przystanku 4 porównane z `context/design/mockups/tour/v3-entry.html` i `v2-step.html`.
- Na każdym przystanku numery „Na co patrzeć” stoją przy właściwych elementach ekranu.

## Phase 2: Dopracowanie

### Changes Required

1. `public/tour.js`: numery `data-look` przy elementach, przewinięcie do pierwszego, a na telefonie pamięć rozwinięcia karty między przystankami (`sessionStorage`).
2. Wejście: kliknięcie przystanku na osi albo karty uruchamia ten przystanek (`POST /tour/<stop>`).
3. Klawiatura: „Dalej” i „Wstecz” są przyciskami formularza z widocznym fokusem. Strzałki ←/→ działają, gdy fokus nie stoi w polu formularza.

### Success Criteria

#### Automated Verification
- `bun test src/routes/tour.test.ts`: wejście ma 5 formularzy przystanków (`/tour/1`, `/tour/2`, `/tour/3`, `/tour/4`, `/tour/5`), a układ w trybie przewodnika dołącza `/tour.js`.
- `bun test` zielony.

#### Manual Verification
- Na telefonie karta zwinięta nie zasłania przycisków aplikacji, a rozwinięta mieści całą treść przystanku.

## Testing Strategy

Trasy przez `app.request()` z ciasteczkami. Stany danych przez funkcje domenowe na świeżej bazie testowej (`createTestApp` albo istniejący pomocnik testów). Wygląd sprawdza człowiek na zrzutach (decyzja 13b).

## Open questions

- Czy w kroku 5 pokazywać fikcję zapoznania zamiast potwierdzenia? Domyślnie: nie, fikcja jest na ekranie końcowym jako „warto zobaczyć”.

## References

- `context/foundation/demo.md` (scenariusz, daty, ustalenia)
- `context/foundation/decisions.md` (sekcje 1 i 13)
- `context/design/mockups/tour/` (wzorzec wyglądu; wybrane `v3-entry.html` i `v2-step.html`)
- `context/design/README.md` (trzy głosy)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Wersja minimalna

#### Automated

- [x] 1.1 Testy stanów danych przystanków przechodzą: `bun test src/tour/state.test.ts` — 17f807d
- [x] 1.2 Testy tras przewodnika przechodzą: `bun test src/routes/tour.test.ts` — 17f807d
- [x] 1.3 Cały zestaw, dane pokazowe i wersja Cloudflare: `bun test`, `bun run seed`, `wrangler deploy --dry-run` — 17f807d

#### Manual

- [ ] 1.4 Cały przewodnik kliknięty w Chromium przy 1440 i 360 px, zrzuty porównane z makietami
- [ ] 1.5 Numery „Na co patrzeć” przy właściwych elementach na każdym przystanku

### Phase 2: Dopracowanie

#### Automated

- [x] 2.1 Testy wejścia z przystankami i skryptu przechodzą: `bun test src/routes/tour.test.ts` — 17f807d
- [x] 2.2 Cały zestaw testów przechodzi: `bun test` — 17f807d

#### Manual

- [ ] 2.3 Karta na telefonie nie zasłania przycisków aplikacji
