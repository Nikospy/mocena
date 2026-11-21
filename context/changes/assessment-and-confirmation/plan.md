# Ocena z blokadami i potwierdzenie zapoznania — plan wdrożenia

## Overview

Oceniający przyznaje oceny cząstkowe, widzi wynik wyliczony przez silnik z podstawą prawną i zatwierdza ocenę dopiero po uzupełnieniu pól wymaganych przepisami. Oceniany potwierdza zapoznanie z oceną na własnym koncie i widzi zegar 7 dni na sprzeciw. Gdy nie potwierdza, oceniający stwierdza fikcję zapoznania, a kadry widzą ten wpis. To krok, na który patrzy jury (north star w roadmapie).

Nazwy tabel, kolumn, funkcji, zdarzeń, tras i plików pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`. Przy rozjeździe wygrywa kontrakt, a po zbudowaniu F-01 kod; rozjazd implementujący dopisuje w `## Progress` przy kroku, którego dotyczy. Ten plaster nie tworzy drugiej nazwy na nic, co nazywa kontrakt.

## Current State Analysis

- Silnik wyniku i terminów ma testy. Po F-01 leży w `src/engine/scoring.ts` (`computeAssessment(scores)` zwraca `{ mean, overallLevel, outcome, reasons, justificationRequired }`; `mandatoryCriteria(sheet)`, `criterion(id)`) i `src/engine/deadlines.ts` (`objectionDeadline`: 7 dni od zapoznania, przesunięte na dzień roboczy, art. 83 ust. 1 ustawy). `rulesVersion()` zwraca `{ version, effectiveFrom, act }`.
- Plik reguł `rules/regulation-2016-470.json` ma skalę ocen cząstkowych, przedziały poziomu ogólnego, termin sprzeciwu z podstawą i tematy rozmowy oceniającej (§ 10). Nie ma podstaw prawnych blokad zatwierdzenia ani reguł wniosku o stopień (§ 11 ust. 3–5, art. 81 ust. 5 i art. 89 ust. 1 ustawy).
- Ekranów oceny i zdarzeń oceny nie ma. Tabele, konto, `today()`, układ ekranu i listę spraw daje F-01; cykl z potwierdzoną częścią I daje S-01.
- Blokady z arkusza (pakiet organizatora, opisany w bazie wiedzy autora): wnioski do indywidualnego programu rozwoju zawodowego (IPRZ) blokują zatwierdzenie zawsze; puste uzasadnienie blokuje tylko przy ocenie negatywnej; puste umotywowanie blokuje, gdy dołączono wniosek o stopień. Wniosek o stopień: „nie dotyczy” dla pracownika, dla urzędnika „nie” przy ocenie negatywnej, a przy pozytywnej wybór „tak / nie”; przy stopniu IX kolejnego nie ma.

## Desired End State

Na koncie Marka, przy cyklu Piotra z potwierdzoną częścią I, ekran oceny pokazuje 7 kryteriów (5 obowiązkowych arkusza C i 2 dodatkowe) z wyborem 1, 3, 5, 7, 9. Po postawieniu „1” przy Rzetelności i „7” przy pozostałych oraz kliknięciu „Zapisz” wynik pokazuje średnią 6,14, poziom „powyżej oczekiwań”, ocenę negatywną i zdanie z § 11 ust. 1 pkt 4 (w pełnej wersji wynik zmienia się już przy wyborze, bez przeładowania). Pole uzasadnienia staje się wymagane. „Zatwierdź ocenę” bez wniosków do IPRZ zostawia ocenę niezatwierdzoną i mówi, czego brakuje i z jakiego przepisu. Po uzupełnieniu Marek zatwierdza; miejscowość (z `settings.office_city`), data i nazwisko wpisują się same, pola się blokują. Na koncie Piotra jest przycisk „Potwierdzam zapoznanie z oceną”; po kliknięciu 22.11.2026 widać termin sprzeciwu 30.11.2026 z liczbą dni i przepisem. W osobnym przebiegu od czystych danych Marek zamiast tego klika „Stwierdź fikcję zapoznania”, widzi ekran skutku („Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw”), wybiera „nie mógł” albo „nie chciał”, wpisuje, jak i kiedy doręczono kopię arkusza, i zapisuje; Joanna widzi ten wpis w podglądzie oceny. `bun test` przechodzi, w tym bezpośrednie żądania omijające formularz i test wniosku o stopień dla urzędnika mianowanego.

### Key Discoveries:

- `computeAssessment` rzuca wyjątek przy pustym zbiorze i punktach spoza skali (dziś `src/silnik/ocena.ts:73`); wynik liczy się więc tylko wtedy, gdy każde kryterium cyklu ma ocenę, a wcześniej ekran pokazuje „Wynik pojawi się, gdy każde kryterium będzie miało ocenę”.
- `justificationRequired` już niesie regułę § 11 ust. 3 (dziś `src/silnik/ocena.ts:62`); blokada uzasadnienia korzysta z niej, nie liczy jej drugi raz.
- `objectionDeadline` przesuwa koniec na dzień roboczy (dziś `src/silnik/terminy.ts:101`), więc data może wypaść później niż 7 dni kalendarzowych: potwierdzenie 21.11.2026 (sobota) albo 22.11.2026 (niedziela) daje 30.11.2026. Ekran pokazuje datę z silnika, a zdanie „7 dni” bierze wartość z klucza `deadlines.objectionDays` pliku reguł (`value`, podstawa z `basis`).
- Średnia jest porównywana na liczbach całkowitych, bez zaokrągleń; ekran tylko wyświetla ją z dwoma miejscami po przecinku.

## What We're NOT Doing

- Notatek przy kryteriach, akcji „Wstaw”, ostrzeżenia „fakty tylko z ostatniego miesiąca” i karty rozmowy oceniającej (S-04; ten plaster daje tylko `slots` w formularzu).
- Ekranu kadr ze stanem cykli, przypomnienia o stopniu obowiązkowym, historii ocen, podglądu i wydruku arkusza (S-06).
- Wgrywania ocen do danych pokazowych: obie oceny Tomasza wgrywa S-06 w `src/seed/assessments.ts` w kształcie migawki z tego planu. S-02 nie ma modułu w `src/seed/` i nie oczekuje ocen od F-01.
- Obiegu sprzeciwu, zmiany oceny po sprzeciwie, decyzji o stopniu (PRD Non-Goals; tylko stan w S-06).
- Automatu, który wpisuje fikcję po upływie czasu, i progu dni przed przyciskiem fikcji (decyzje 5b i 10n).
- Potwierdzania wpisu o fikcji przez kadry (decyzja 5b) i trybu korekty pól zablokowanych przez administratora.
- Rozpoczęcia kolejnego cyklu po zatwierdzonej ocenie.
- Podpisu w jakiejkolwiek formie: przyciski i teksty mówią „potwierdzenie”.
- Własnych stylów: ekrany używają układu `src/views/layout.tsx` i komponentów z design systemu autora (decyzja 10b).

## Implementation Approach

Stan oceny to wyłącznie wiersze w `events` (bez nowej tabeli), zgodnie z decyzją 10i: szkic to ostatnie widoczne `assessment_draft_saved`, a zatwierdzenie, potwierdzenie i fikcja to osobne zdarzenia zapisane przez `recordEvent` z datą `today()`. Odczyt idzie wyłącznie przez `visibleEvents(cycleId)`. Zatwierdzenie zapisuje pełną migawkę oceny (punkty, wynik, teksty, okres, termin na dzień zatwierdzenia, stopień z datą jego przyznania, wersja reguł), żeby historia i wydruk (S-06) niczego nie przeliczały, a ocena pamiętała swoją wersję reguł (FR-033). Migawkę składa wyłącznie `buildAssessmentSnapshot(cycleId, draft, { asOf })`. Od widocznego `assessment_approved` termin tej oceny jest zamrożony w `AssessmentSnapshot.deadline` i ekrany tego plastra pokazują odtąd tę wartość, nie `effectiveDeadline`. Termin sprzeciwu liczy się raz, przy zapisie potwierdzenia albo fikcji, i jest odtąd czytany z payloadu tego zdarzenia.

Zapis do oceny wymaga otwartego cyklu: po widocznym `assessment_acknowledged` albo `acknowledgement_fiction` każda trasa zapisu tego plastra odpowiada 409. Rozstrzygnięcie sprzeciwu i odnotowanie przyznania stopnia następują po zamknięciu cyklu, należą do S-06 i ten plaster ich nie blokuje.

Wynik liczy wyłącznie silnik na serwerze. Zapis następuje tylko po kliknięciu „Zapisz”, „Zatwierdź ocenę”, „Potwierdzam zapoznanie z oceną” albo „Zapisz wpis” (zasada „nic bez kliknięcia człowieka”). Każda trasa zapisu sprawdza na serwerze aktora, etap i dane, niezależnie od tego, co pokazał formularz. Sprawdzenie etapu i zapis zdarzenia końcowego dzieją się w jednej transakcji SQLite, więc powtórzone albo konkurencyjne żądania zostawiają najwyżej jedno `assessment_approved` i najwyżej jedno z pary `assessment_acknowledged` / `acknowledgement_fiction`.

Ekrany (wygląd z design systemu autora, wspólny układ z F-01):

- ekran „Ocena” w trybie edycji (oceniający przed zatwierdzeniem), podglądu (po zatwierdzeniu: oceniający, oceniany, kadry) albo ze zdaniem zamiast formularza (brak potwierdzonej części I; oceniany przed zatwierdzeniem);
- ekran skutku fikcji zapoznania;
- komponenty w `src/views/assessment.tsx`: wiersz kryterium z wyborem punktów, ramka wyniku, lista blokad, zegar sprzeciwu;
- oba potwierdzenia (oceniającego i ocenianego) i wpis o fikcji rysuje `ConfirmationBlock` z `src/views/components.tsx` (tworzy S-01). `ConfirmationBlock` ma od S-01 oba warianty: `kind: "confirmation"` (`name, place, date`) i `kind: "fiction"` (`name, reason, deliveryMethod, deliveredOn, date`). Ten plaster tylko go używa: nie definiuje własnego bloku i niczego w komponencie nie zmienia.

### Wersja minimalna (ok. 50 minut)

Kroki 4 i 5 pokazu działają od początku do końca; wynik pokazuje się po „Zapisz”. To jest faza 1 i powstaje pierwsza:

- podstawy prawne blokad w pliku reguł; `approvalBlockers` ze wszystkimi blokadami, także regułą wniosku o stopień (czysta logika z testem);
- `assessmentState` z etapem i terminem sprzeciwu czytanym z payloadu;
- `buildAssessmentSnapshot(cycleId, draft, { asOf })` z testem: jedyne miejsce składania migawki;
- `GET/POST /cycles/:id/assessment`, `POST /cycles/:id/assessment/approve`, `POST /cycles/:id/assessment/acknowledge` z pełnymi kontrolami serwera i transakcją;
- widok edycji i podglądu z ramką wyniku po „Zapisz”, potwierdzeniami w `ConfirmationBlock`, zegarem sprzeciwu i pustymi `slots` dla S-04;
- pozycje listy spraw (`registerHomeTasks`) i odnośnik „Ocena” na ekranie części I (`registerCycleLinks`) dla oceniającego i ocenianego, bo bez nich Piotr nie trafi do oceny z telefonu; kadry w wersji minimalnej dostają 403 i nie mają odnośnika;
- testy bezpośrednich żądań i zegara (potwierdzenie 22.11.2026 → 30.11.2026).

### Kolejność cięcia

Po wersji minimalnej powstaje reszta w tej kolejności. Gdy zabraknie czasu, wypada od końca listy:

1. Fikcja zapoznania: ekran skutku, zapis, wpis w podglądzie (faza 2; potrzebne do wersji 5-minutowej pokazu). Powstaje zaraz po wersji minimalnej i wypada jako ostatnia.
2. Wgląd kadr w ocenę z wpisem o fikcji i odnośnikiem „Ocena” dla roli `hr` (faza 2; potrzebne do wersji 5-minutowej pokazu). Powstaje razem z fikcją i wypada razem z nią.
3. Pole wniosku o stopień na ekranie (faza 3; reguła i test bezpośredniego żądania są w wersji minimalnej, pokaz go nie klika).
4. Podgląd wyniku na żywo przez `POST /cycles/:id/assessment/preview` (faza 3; bez niego wynik i blokady odświeżają się po „Zapisz”).
5. Pole „Data rozmowy oceniającej” (faza 3; bez niego w migawce `interviewDate` = `today()`).

Nie wycinać niczego z wersji minimalnej: punktów, wyniku z przepisem, blokad uzasadnienia i IPRZ, kontroli serwera, zatwierdzenia, potwierdzenia ocenianego, zegara sprzeciwu.

## Założenia wobec wcześniejszych plastrów

Same nazwy z kontraktu wspólnego.

**F-01:**

- Tabele: `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z kluczem `office_city`.
- Funkcje: `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)` (data `today()`), `seedEvent(type, cycleId, actorId, payload, date)` (data jest ostatnim argumentem; tylko dane pokazowe i przygotowanie testów, nigdy trasy), `visibleEvents(cycleId, { asOf })` (zdarzenia z `date <= today()` albo `<= asOf`, porządek `(date, id)`), `effectiveDeadline(cycleId, { asOf })` z `src/cycles.ts` zwracające `{ date, basis: string[] }`, `openCycle(personId)` z `src/cycles.ts`, `currentGrade(personId, { asOf })` z `src/people.ts` zwracające `{ grade, awardedOn }`, `registerHomeTasks(fn)` z `src/home-tasks.ts`, `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()` zwracające `{ version, effectiveFrom, act }`. Wszystkie funkcje biorą połączenie z bazą z `getDb()` w `src/db.ts`; funkcje tego plastra nie przyjmują argumentu `db`.
- Silnik: `computeAssessment(scores)`, `mandatoryCriteria(sheet)`, `criterion(id)` z `src/engine/scoring.ts`; `objectionDeadline` z `src/engine/deadlines.ts`; plik `rules/regulation-2016-470.json`.
- Układ `src/views/layout.tsx`, statyczne pliki z `public/`, `createTestApp({ today, seedOptions })` z `src/test-helpers.ts`.
- **Cykl osoby** pochodzi wyłącznie z `openCycle(personId)` (lista spraw, wejście ocenianego do oceny). Cykl przestaje być otwarty z chwilą widocznego `assessment_acknowledged` albo `acknowledgement_fiction`; od tej chwili `openCycle` go nie zwraca, a ekran oceny tego cyklu jest dostępny dalej pod `/cycles/:id/assessment` (trasa bierze cykl z adresu).
- Dane z `src/seed/base.ts`: cykl Piotra (arkusz C, oceniający Marek, `period_start` = 2024-11-27) bez części I, Piotr `appointed = 0`, Tomasz `appointed = 1` ze stopniem w `civil_service_grade`, data systemowa 2024-12-09.

**S-01:**

- `cycle_criteria(cycle_id, criterion_id, kind, expectation)` wypełnione dla cyklu; lista kryteriów oceny to te wiersze w kolejności: obowiązkowe (`kind = mandatory`, w kolejności `mandatoryCriteria(sheet)`), potem dodatkowe (`kind = additional`). Ta lista jest dokładnym zestawem, który musi mieć oceny.
- Zdarzenie `part1_confirmed` `{ place, appraiseeName }`. Bez widocznego `part1_confirmed` ekran oceny pokazuje „Ocena nie może powstać bez potwierdzonej części I” i nie ma formularza, a trasy zapisu odmawiają (PRD, Business Logic).
- `GET /cycles/:id/part1` to ekran wejściowy cyklu z `cycleLinks`; tam ten plaster dokłada odnośnik „Ocena”.
- `src/views/components.tsx` z `ConfirmationBlock` w obu wariantach: `kind: "confirmation"` (`name, place, date`) i `kind: "fiction"` (`name, reason, deliveryMethod, deliveredOn, date`); ten plaster tylko go używa.
- `src/seed/part1.ts`: pełna część I bieżącego cyklu Tomasza (potrzebna testowi wniosku o stopień); z opcją `afterStep1` także przekazana i potwierdzona 2024-12-09 część I Piotra z kryteriami dodatkowymi `orientacja-na-klienta` i `myslenie-analityczne`.

**S-06 (później, nie warunek tego plastra):** `src/seed/assessments.ts` wgrywa oceny Tomasza jako pełne łańcuchy zdarzeń w kształcie migawki `AssessmentSnapshot` z sekcji niżej; zdarzenie `mandatory_grade_awarded` `{ personId, fromGrade, toGrade, basis }` zmienia bieżący stopień.

**Bieżący stopień urzędnika** (do wniosku o stopień i do migawki) czyta się wyłącznie przez `currentGrade(personId, { asOf })` z `src/people.ts` (F-01); wniosek o stopień woła ją bez `asOf`, a `buildAssessmentSnapshot` z tą samą datą `asOf`, którą dostał. Ten plaster nie czyta `people.civil_service_grade` ani zdarzeń `mandatory_grade_awarded` bezpośrednio i nie pisze własnej kopii reguły. S-06 korzysta z tej samej funkcji.

## Co ten plaster udostępnia

**Według kontraktu:**

- Zdarzenie `assessment_draft_saved`, payload `AssessmentDraft`: `{ scores: Record<criterionId, number>, justification: string, developmentConclusions: string, interviewDate: string | null, gradeRequest: { attached: boolean, motivation: string } }`. Actor: oceniający.
- Zdarzenie `assessment_approved`, payload `AssessmentSnapshot` (typ eksportowany z `src/assessment/state.ts`). Pełna lista pól, bez innych:
  - `scores: Record<criterionId, number>`,
  - `justification: string`,
  - `developmentConclusions: string`,
  - `interviewDate: string` (data ISO; bez pola na ekranie data migawki),
  - `gradeRequest: { attached: boolean, motivation: string, targetGrade: number | null }` (`targetGrade` = stopień o jeden wyższy niż `grade`, gdy `attached`, inaczej `null`),
  - `sheet: string` (z `cycles.sheet`),
  - `criteria: { id: string, name: string, kind: "mandatory" | "additional", score: number }[]` w kolejności arkusza,
  - `result: { mean, overallLevel, outcome, reasons, justificationRequired }` (wynik `computeAssessment`),
  - `periodFrom: string` = `cycles.period_start` (dla Piotra 2024-11-27),
  - `periodTo: string` = data migawki,
  - `deadline: { date: string, basis: string[] }` = `effectiveDeadline(cycleId, { asOf })` na datę migawki; od widocznego `assessment_approved` to jedyne źródło terminu tej oceny na ekranach,
  - `grade: number | null` = `currentGrade(personId, { asOf }).grade` na datę migawki (`null` u osoby nie mianowanej),
  - `gradeAwardedOn: string | null` = `currentGrade(personId, { asOf }).awardedOn` na datę migawki (`null` u osoby nie mianowanej albo gdy data nie jest znana),
  - `rulesVersion: { version, effectiveFrom, act }` = `rulesVersion()`; ten sam obiekt co `part1_submitted.payload.rulesVersion`,
  - `confirmation: { place: string, date: string, name: string }` oceniającego (`place` z `settings.office_city`, `date` = data migawki, `name` = `people.name` oceniającego).
  Data migawki to `asOf`, a bez `asOf` `today()`, czyli dzień zatwierdzenia. Actor: oceniający. Migawkę składa wyłącznie `buildAssessmentSnapshot` (niżej); S-06 wgrywa historyczne oceny w `src/seed/assessments.ts`, wołając tę funkcję z historyczną datą.
- Zdarzenie `assessment_acknowledged`, payload `{ place, date, name, objectionDeadline }` (`place` z `settings.office_city`, `date` = `today()`, `name` = `people.name` ocenianego, `objectionDeadline` = `objectionDeadline(today())`). Actor: oceniany.
- Zdarzenie `acknowledgement_fiction`, payload `{ reason, deliveryMethod, deliveredOn, objectionDeadline }`: `reason` = `could_not` | `would_not` (etykiety „nie mógł” / „nie chciał”), `deliveryMethod` = `in_person` | `post` | `email` (osobiście, pocztą, pocztą elektroniczną), `deliveredOn` = data doręczenia kopii arkusza, `objectionDeadline` = `objectionDeadline(today())`. Actor: oceniający.
- Trasy: `GET /cycles/:id/assessment`, `POST /cycles/:id/assessment` (zapis szkicu), `POST /cycles/:id/assessment/preview` (fragment wyniku i blokad, bez zapisu), `POST /cycles/:id/assessment/approve`, `POST /cycles/:id/assessment/acknowledge`, `GET /cycles/:id/assessment/fiction` (ekran skutku), `POST /cycles/:id/assessment/fiction`.
- Wpisy do wspólnych list: `registerHomeTasks` (oceniający: „Wystaw ocenę: <imię i nazwisko>” w etapie `draft`, „Czeka na potwierdzenie zapoznania: <imię i nazwisko>” w etapie `approved`; oceniany: „Zapoznaj się z oceną” w etapie `approved`; bez wyniku i liczb przy nazwisku) oraz `registerCycleLinks` (odnośnik „Ocena” do `/cycles/:id/assessment` dla oceniającego i dla ocenianego od `approved`; dla roli `hr` od `approved` dopiero w fazie 2, w kroku wglądu kadr, bo wcześniej trasa `GET` odpowiada kadrom 403).
- `buildAssessmentSnapshot(cycleId, draft, { asOf })` w `src/assessment/snapshot.ts`: jedyne miejsce, które składa migawkę `AssessmentSnapshot`; woła je zatwierdzenie (bez `asOf`) i moduł danych S-06 (z historyczną datą). Z `asOf` czyta `effectiveDeadline(cycleId, { asOf })` i `currentGrade(personId, { asOf })`. Funkcja niczego nie zapisuje.
- `approvalBlockers(input): Blocker[]` w `src/engine/approval.ts` (czysta), `Blocker = { field, message, basis }`; tamże `gradeRequestOptions(...)`.
- `assessmentState(cycleId)` w `src/assessment/state.ts`: `{ stage: "no_part1" | "draft" | "approved" | "acknowledged" | "fiction", draft, snapshot, acknowledgement, fiction, objectionDeadline }`. `draft` to payload ostatniego `assessment_draft_saved` albo `null`; zapisane oceny cząstkowe są w `assessmentState(cycleId).draft.scores` (S-04 czyta je do ostrzeżenia). S-06 bierze stąd etap do ekranu kadr i migawkę do wydruku.

**Miejsca dla S-04 w formularzu** (jedyne miejsca, przez które S-04 dokłada coś do ekranu oceny):

- `src/views/assessment.tsx` eksportuje typ `Slots = { criterionAside?: (criterionId: string) => JSX.Element; justificationTools?: JSX.Element; conclusionsTools?: JSX.Element; beforeForm?: JSX.Element }`. `AssessmentView` przyjmuje prop `slots: Slots` (domyślnie pusty obiekt): `criterionAside(criterionId)` (notatki przy kryterium i ostrzeżenie FR-020), `justificationTools` (akcja „Wstaw” nad polem uzasadnienia), `conclusionsTools` (akcja „Wstaw” nad wnioskami do IPRZ; pole opcjonalne, o jego użyciu decyduje S-04), `beforeForm` (odnośnik do `GET /cycles/:id/cards/assessment-conversation`). S-04 importuje typ `Slots` i przekazuje `slots` w wywołaniu widoku w `src/routes/assessment.tsx`.
- Pola tekstowe to `<textarea name="justification" id="justification">` i `<textarea name="developmentConclusions" id="developmentConclusions">`: ta sama wartość jako `name` i `id`, i to są cele przycisków „Wstaw”. Pozostałe pola formularza: `score[<criterionId>]`, `interviewDate`, `gradeRequestAttached`, `gradeMotivation`.
- Wstawienie tekstu przez S-04 niczego nie zapisuje; zapis dalej wymaga „Zapisz” albo „Zatwierdź ocenę”.

## Phase 1: Wersja minimalna — ocena, zatwierdzenie, potwierdzenie

### Changes Required:

#### 1. Podstawy prawne pól oceny w pliku reguł

**File**: `rules/regulation-2016-470.json`

**Intent**: Dopisać podstawy prawne pól, które blokują zatwierdzenie, i regułę stopnia, żeby komunikaty brały przepis z danych, nie z kodu (NFR „każdy wynik ma obok podstawę prawną”).

**Contract**: klucz `approval`: `justification.basis = "§ 11 ust. 3"`, `developmentConclusions.basis = "art. 81 ust. 5 ustawy"`, `gradeRequest.basis = "§ 11 ust. 5, art. 89 ust. 1 ustawy"`, `gradeRequest.maxGrade = 9`, `acknowledgement.basis = "§ 12"`. `approval.gradeRequest.maxGrade` to jedyny klucz granicy stopnia w projekcie; S-06 czyta granicę z tego samego klucza i nie dopisuje własnego. Wersja pliku zostaje bez zmian (dodanie podstaw nie zmienia sposobu liczenia).

#### 2. Reguły zatwierdzenia

**File**: `src/engine/approval.ts`, `src/engine/approval.test.ts`

**Intent**: Jedna czysta funkcja, która dla szkicu, listy kryteriów cyklu i danych ocenianego zwraca listę blokad z komunikatem po polsku i przepisem. Ta sama lista służy ekranowi i odmowie zatwierdzenia na serwerze.

**Contract**: `approvalBlockers({ criteria: string[], draft: AssessmentDraft, appointed: boolean, grade: number | null }): Blocker[]`. Blokady:

- kryterium cyklu bez oceny → „Brakuje oceny cząstkowej: <nazwa kryterium>” (§ 11 ust. 1);
- ocena przy kryterium spoza cyklu albo wartość spoza skali z pliku reguł → blokada (zestaw ocen musi dokładnie równać się zestawowi kryteriów cyklu);
- puste (po przycięciu spacji) `developmentConclusions` → zawsze;
- puste `justification`, gdy `justificationRequired` (liczone tylko przy komplecie ocen);
- `gradeRequest.attached` u osoby nie mianowanej, przy wyniku negatywnym albo przy stopniu równym `approval.gradeRequest.maxGrade` → wniosku nie można dołączyć, z powodem;
- `gradeRequest.attached` z pustym `motivation` → brakuje umotywowania.

Pomocniczo `gradeRequestOptions({ appointed, grade, outcome }): "not_applicable" | "no_only" | "yes_or_no"` dla ekranu. Funkcja jest czysta: `grade` podaje wołający, który bierze go z `currentGrade(personId).grade`.

#### 3. Stan oceny z dziennika zdarzeń

**File**: `src/assessment/state.ts`, `src/assessment/state.test.ts`

**Intent**: Złożyć z `visibleEvents(cycleId)` etap oceny i dane do ekranów w jednym miejscu, z którego korzystają trasy tego plastra i ekran kadr S-06.

**Contract**: `assessmentState(cycleId)` jak w „Co ten plaster udostępnia”. Etapy: bez widocznego `part1_confirmed` → `no_part1`; potem `draft` (także bez żadnego szkicu); `assessment_approved` → `approved`; pierwsze z `assessment_acknowledged` / `acknowledgement_fiction` → `acknowledged` albo `fiction`. Szkic to ostatnie `assessment_draft_saved` w porządku `(date, id)`. `objectionDeadline` to wartość z payloadu zdarzenia potwierdzenia albo fikcji, bez ponownego liczenia; przed tym zdarzeniem `null`.

#### 4. Migawka oceny

**File**: `src/assessment/snapshot.ts`, `src/assessment/snapshot.test.ts`

**Intent**: Jedno miejsce, które ze szkicu i danych cyklu składa `AssessmentSnapshot`, żeby zatwierdzenie na żywo i historyczne oceny wgrywane przez S-06 miały ten sam kształt i te same reguły. Wersja minimalna: pełna lista pól z „Co ten plaster udostępnia”, bez niczego więcej.

**Contract**: `buildAssessmentSnapshot(cycleId, draft: AssessmentDraft, { asOf }?: { asOf?: string }): AssessmentSnapshot`. Data migawki to `asOf`, a bez niego `today()`. Czyta `cycles` i `cycle_criteria`, `computeAssessment(draft.scores)`, `effectiveDeadline(cycleId, { asOf })`, `currentGrade(cycles.person_id, { asOf })`, `rulesVersion()`, `setting("office_city")` i `people.name` oceniającego. Niczego nie zapisuje i nie sprawdza blokad (to robi wołający). Zatwierdzenie woła ją bez `asOf`; moduł `src/seed/assessments.ts` (S-06) z historyczną datą.

#### 5. Trasy oceny i potwierdzenia

**File**: `src/routes/assessment.tsx`, rejestracja w `src/index.tsx`

**Intent**: Ekran oceny, zapis szkicu, zatwierdzenie i potwierdzenie ocenianego. Każda trasa zapisu sprawdza wszystko sama, bo żądanie może przyjść z pominięciem formularza.

**Contract**:

- `GET /cycles/:id/assessment`: oceniający (`cycles.appraiser_id`) widzi formularz w etapie `draft`, podgląd w dalszych; oceniany (`cycles.person_id`) widzi podgląd od `approved`, wcześniej zdanie „Ocena nie jest jeszcze zatwierdzona”; inni, w tym rola `hr`, dostają 403 (wgląd kadr dochodzi w fazie 2). Przy `no_part1` zdanie z Business Logic i brak formularza.
- Kontrole wspólne dla `POST /cycles/:id/assessment` i `POST /cycles/:id/assessment/approve`: aktor = `cycles.appraiser_id`, inaczej 403; widoczne `part1_confirmed`, inaczej 409; etap `draft`, inaczej 409 (także po potwierdzeniu albo fikcji, gdy cykl nie jest już otwarty); każda ocena przy kryterium z `cycle_criteria` i z wartością ze skali, inaczej 422 z formularzem.
- `POST /cycles/:id/assessment`: zapisuje `assessment_draft_saved` i przekierowuje na ekran (303), gdzie ramka wyniku pokazuje wynik ze szkicu.
- `POST /cycles/:id/assessment/approve`: zapisuje szkic z formularza (kliknął człowiek), potem w jednej transakcji sprawdza ponownie etap i `approvalBlockers` dla stopnia z `currentGrade(cycles.person_id)`; gdy lista jest pusta, zapisuje `assessment_approved` z migawką z `buildAssessmentSnapshot(cycleId, draft)` (bez `asOf`) i przekierowuje (303); w przeciwnym razie 422 z formularzem i listą blokad. Wniosek o stopień przysłany, gdy `gradeRequestOptions` daje `not_applicable` albo `no_only`, to blokada (422), nie cicho pominięte pole.
- `POST /cycles/:id/assessment/acknowledge`: aktor = `cycles.person_id`, inaczej 403; w jednej transakcji etap `approved`, inaczej 409; zapisuje `assessment_acknowledged` z `objectionDeadline(today())`.

#### 6. Widok oceny i zegar sprzeciwu

**File**: `src/views/assessment.tsx`

**Intent**: Jeden widok w trybie edycji i podglądu. W edycji: kryteria w kolejności arkusza (obowiązkowe, potem dodatkowe) z wyborem punktów i nazwą poziomu przy każdej wartości; ramka wyniku pod kryteriami, liczona z ostatniego szkicu; uzasadnienie ze zdaniem „Ten tekst przeczyta pracownik” (decyzja 10f) i oznaczeniem „wymagane przy ocenie negatywnej, § 11 ust. 3”, które zmienia się na „wymagane” przy wyniku negatywnym; „Wnioski do indywidualnego programu rozwoju zawodowego” zawsze wymagane; lista blokad nad przyciskami; przyciski „Zapisz” i „Zatwierdź ocenę”. W podglądzie: te same dane z migawki bez pól, w tym termin oceny z `snapshot.deadline` (od widocznego `assessment_approved` termin jest zamrożony w migawce i ekrany tego plastra nie czytają już `effectiveDeadline`, więc nieobecność wpisana później go nie zmienia), potwierdzenie oceniającego w `ConfirmationBlock` (miejscowość, data, nazwisko z `snapshot.confirmation`), a u ocenianego w etapie `approved` oświadczenie z arkusza („Potwierdzam odbycie rozmowy oceniającej oraz zapoznanie z oceną i wnioskami do indywidualnego programu rozwoju zawodowego.”) i przycisk „Potwierdzam zapoznanie z oceną”; po potwierdzeniu potwierdzenie ocenianego w `ConfirmationBlock` (z payloadu `assessment_acknowledged`) i zegar sprzeciwu.

**Contract**: `AssessmentView({ mode: "edit" | "view", state, criteria, person, viewer, blockers, slots })`, `slots: Slots` jak w „Miejscach dla S-04”. Oba potwierdzenia rysuje `ConfirmationBlock` z `src/views/components.tsx` w wariancie `kind: "confirmation"` (`name, place, date`); ten plik nie definiuje własnego bloku potwierdzenia. `ResultPanel({ result | missing })` w elemencie `id="assessment-result"`: średnia (dwa miejsca po przecinku), poziom ogólny, „Ocena pozytywna” albo „Ocena negatywna”, `reasons` z paragrafami, nazwa aktu i wersja reguł. `ObjectionClock({ deadline, today })` z terminem z `assessmentState`: przed terminem „Sprzeciw do dyrektora generalnego urzędu możesz złożyć do <DD.MM.RRRR>. Zostało <n> dni. Art. 83 ust. 1 ustawy o służbie cywilnej.”; w ostatnim dniu „Dziś jest ostatni dzień na sprzeciw (<DD.MM.RRRR>).”; po terminie „Termin na sprzeciw minął <DD.MM.RRRR>.”; przed zdarzeniem potwierdzenia albo fikcji zegara nie ma. Zegar widzą oceniany i oceniający, a od fazy 2 także kadry. Wynik jest tylko na tym ekranie; listy spraw i nagłówki z nazwiskiem nie pokazują wyniku ani liczb.

#### 7. Lista spraw i odnośnik z części I

**File**: `src/assessment/home.ts` (rejestracje przy starcie aplikacji)

**Intent**: Piotr i Marek trafiają do oceny z ekranu startowego i z ekranu części I.

**Contract**: `registerHomeTasks` i `registerCycleLinks` z pozycjami z „Co ten plaster udostępnia”; pozycje linkują do `/cycles/:id/assessment`. Pozycje listy spraw biorą cykl osoby z `openCycle(personId)` (oceniany) albo z `openCycle(subordinateId)` każdej osoby, której oceniającym (`cycles.appraiser_id`) jest zalogowany (oceniający); po potwierdzeniu albo fikcji cykl nie jest otwarty, więc pozycje znikają. `registerCycleLinks` w tej fazie zwraca odnośnik tylko oceniającemu i ocenianemu; dla roli `hr` nie zwraca nic.

### Success Criteria:

#### Automated Verification:

- Testy reguł zatwierdzenia przechodzą: `bun test src/engine/approval.test.ts`
- Testy stanu oceny przechodzą: `bun test src/assessment/state.test.ts`
- Testy migawki przechodzą: `bun test src/assessment/snapshot.test.ts` (bez `asOf` migawka ma `periodTo`, `confirmation.date` i `deadline` z dnia `today()`; z historycznym `asOf` ma `deadline` = `effectiveDeadline(cycleId, { asOf })` oraz `grade` i `gradeAwardedOn` = `currentGrade(personId, { asOf })`, także gdy po dacie `asOf` jest zdarzenie `mandatory_grade_awarded` (migawka go nie uwzględnia); `rulesVersion` to obiekt `{ version, effectiveFrom, act }`; funkcja nie zmienia liczby zdarzeń)
- Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts` (scenariusze kroku 4: „1” przy Rzetelności i „7” przy pozostałych po „Zapisz” daje na ekranie „Ocena negatywna” i „powyżej oczekiwań”; zatwierdzenie bez wniosków do IPRZ → 422 i brak `assessment_approved`; z wnioskami, bez uzasadnienia przy wyniku negatywnym → 422; komplet → 303 i migawka z kompletem pól `AssessmentSnapshot`, w tym `periodFrom` = 2024-11-27, `deadline` równym `effectiveDeadline(cycleId)` w dniu zatwierdzenia (bez nieobecności Piotra 2026-11-27), `grade` = `null`, `gradeAwardedOn` = `null` i `rulesVersion` = `{ version, effectiveFrom, act }`; po zatwierdzeniu podgląd pokazuje termin z `snapshot.deadline`). Testy zaczynające od daty 2026-11-21 biorą potwierdzoną część I Piotra z `createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } })`
- Test etykiet przechodzi (ten sam plik): na ekranie oceny w trybie edycji i podglądu, na liście spraw i na ekranie części I element z imieniem i nazwiskiem ocenianego nie zawiera liczby, średniej, poziomu ani etykiety wyniku (zasada 7 z `AGENTS.md`); wynik stoi tylko w elemencie `id="assessment-result"`
- Testy bezpośrednich żądań przechodzą (te same pliki): zapis i zatwierdzenie przez osobę inną niż oceniający → 403; bez widocznego `part1_confirmed` → 409 i brak formularza na ekranie; ocena przy kryterium spoza cyklu albo wartość 4 → 422; brak oceny przy jednym kryterium przy zatwierdzeniu → 422; w każdym z tych przypadków brak `assessment_approved`; wniosek o stopień u Piotra → 422; dwa kolejne `approve` z kompletem → drugie 409, jedno `assessment_approved`; zapis szkicu po zatwierdzeniu → 409; zapis szkicu i `approve` po potwierdzeniu przez Piotra → 409. Żaden błąd walidacji nie odpowiada 400
- Test wniosku o stopień przechodzi: cykl Tomasza przy dacie 2026-11-10 (część I z `src/seed/part1.ts`, przed oceną z 12.11.2026); wynik pozytywny i wniosek bez umotywowania → 422, z umotywowaniem → zatwierdzone z `targetGrade` o jeden wyższym; ten sam wniosek przy wyniku negatywnym → 422; po wgranym w teście zdarzeniu `seedEvent("mandatory_grade_awarded", <cykl Tomasza>, <aktor>, { personId: <Tomasz>, fromGrade: 5, toGrade: 9, basis }, "2026-11-10")` → `currentGrade` zwraca 9 i wniosek → 422; migawka zatwierdzonej oceny Tomasza ma `grade` i `gradeAwardedOn` równe `currentGrade` z dnia zatwierdzenia
- Testy potwierdzenia i zegara przechodzą: potwierdzenie przez Piotra przy dacie 2026-11-22 zapisuje `objectionDeadline` = 2026-11-30 i ekran pokazuje 30.11.2026; potwierdzenie 2026-11-21 daje również 2026-11-30; po przesunięciu daty na 2026-11-30 ekran mówi „ostatni dzień”, na 2026-12-01 „Termin na sprzeciw minął 30.11.2026”, a payload się nie zmienia; w etapie `approved` zegara nie ma; potwierdzenie przez Marka → 403; przed zatwierdzeniem → 409; drugie potwierdzenie → 409 i jedno zdarzenie
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Kroki 4 i 5 pokazu: Marek 21.11.2026 po „1” przy Rzetelności i „Zapisz” widzi wynik negatywny, uzasadnienie oznaczone jako wymagane, „Zatwierdź ocenę” bez wniosków do IPRZ pokazuje blokadę z przepisem; po zatwierdzeniu Piotr 22.11.2026 na telefonie trafia z listy spraw do oceny, potwierdza i widzi zegar z 30.11.2026; ekrany czytelne przy 360 px i 1440 px w układzie z design systemu
- Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku, średniej ani etykiety poza samym ekranem oceny

## Phase 2: Fikcja zapoznania i wgląd kadr

### Changes Required:

#### 1. Fikcja zapoznania

**File**: `src/routes/assessment.tsx`, `src/views/acknowledgement-fiction.tsx`

**Intent**: Oceniający widzi przycisk „Stwierdź fikcję zapoznania” od razu po zatwierdzeniu, dopóki oceniany nie potwierdził (decyzja 10n). Przycisk prowadzi na ekran skutku: „Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw” (liczba z `deadlines.objectionDays.value`; brzmienie z decyzji 11a, ekran nie mówi „termin biegnie”), data końca terminu z silnika, zdanie, że kadry zobaczą wpis, wymagany wybór „nie mógł potwierdzić” albo „nie chciał potwierdzić” oraz wymagane pola „Jak doręczono kopię arkusza” (osobiście, pocztą, pocztą elektroniczną) i „Kiedy” (§ 12 ust. 2 rozporządzenia, decyzja 11a). Zapis tylko po wyborze i kliknięciu „Zapisz wpis”; obok „Wróć bez zapisu”. Po zapisie przycisk ocenianego znika, a w podglądzie oceny jest wpis „Stwierdzono fikcję zapoznania <data>: oceniany nie mógł / nie chciał potwierdzić. Kopia arkusza doręczona <data> (<sposób>). Stwierdził: <oceniający>” i zegar sprzeciwu z terminem z payloadu, opisany jako liczony od dnia przyjętego przez urząd jako dzień zapoznania.

**Contract**: `GET /cycles/:id/assessment/fiction` (ekran skutku; tylko oceniający, tylko etap `approved`, inaczej 403 albo 409). `POST /cycles/:id/assessment/fiction` z polami `reason` (`could_not` | `would_not`), `deliveryMethod` (`in_person` | `post` | `email`) i `deliveredOn` (data ISO nie wcześniejsza niż data zatwierdzenia i nie późniejsza niż `today()`): aktor inny niż oceniający → 403; brak albo inna wartość `reason` → 422 z tym samym ekranem i komunikatem „Wybierz, czy oceniany nie mógł, czy nie chciał potwierdzić”; brak albo zła wartość pól doręczenia → 422 z komunikatem „Wpisz, jak i kiedy doręczono kopię arkusza”; w jednej transakcji etap `approved`, inaczej 409; zapisuje `acknowledgement_fiction` `{ reason, deliveryMethod, deliveredOn, objectionDeadline: objectionDeadline(today()) }` i przekierowuje (303). Wpis o fikcji w podglądzie rysuje istniejący wariant `ConfirmationBlock` z S-01: `kind: "fiction"` z `reason`, `deliveryMethod`, `deliveredOn` z payloadu i `date` = data zdarzenia `acknowledgement_fiction`; nazwisko oceniającego („Stwierdził: …”) pochodzi z `actor_id` zdarzenia. Ten plaster komponentu nie zmienia.

#### 2. Wgląd kadr

**File**: `src/routes/assessment.tsx`, `src/assessment/home.ts`

**Intent**: Kadry (Joanna, `people.role = hr`) mają wgląd w zatwierdzoną ocenę z potwierdzeniem albo wpisem o fikcji w `ConfirmationBlock`, bez przycisków (PRD, Access Control). Szkicu przed zatwierdzeniem nie widzą. Pełny ekran kadr ze stanem wszystkich cykli robi S-06.

**Contract**: `GET /cycles/:id/assessment` dla roli `hr` od etapu `approved` daje podgląd, wcześniej zdanie „Ocena nie jest jeszcze zatwierdzona”; trasy zapisu dla `hr` → 403. W tym kroku, i dopiero w nim, `registerCycleLinks` zaczyna zwracać odnośnik „Ocena” dla roli `hr` od etapu `approved` (ekran cyklu i wiersz cyklu na `/hr` w S-06).

### Success Criteria:

#### Automated Verification:

- Testy fikcji przechodzą: `bun test src/routes/assessment.test.ts` (fikcja bez wyboru → 422 i brak zdarzenia; bez sposobu albo daty doręczenia, z datą po `today()` albo przed zatwierdzeniem → 422 i brak zdarzenia; przez Piotra albo Joannę → 403; z `would_not` przy dacie 2026-11-22 → zdarzenie z `objectionDeadline` = 2026-11-30, a potem potwierdzenie przez Piotra → 409; potwierdzenie, potem fikcja → 409; równoczesne żądania potwierdzenia i fikcji (`Promise.all`) → jedno zdarzenie końcowe; Joanna widzi wpis o fikcji i nie widzi przycisków; `cycleLinks` dla Joanny zawiera „Ocena” od `approved`, a przed `approved` nie; po fikcji `openCycle(Piotr)` zwraca `null`; ekran skutku nie zawiera słów „biegnie” ani „podpis”)
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Wersja 5-minutowa, osobny przebieg od czystych danych: `bun run seed -- --after-step-1` (bez `--live-step-2`, żeby notatka z 11.03.2026 istniała), potem daty jak w „Datach pokazu” kontraktu: krok 4 przy 2026-11-21, fikcja zamiast potwierdzenia Piotra przy 2026-11-22; albo kroki 1 i 2 odtworzone klikaniem. Marek przechodzi przez ekran skutku, wybiera powód i doręczenie kopii, a Joanna widzi wpis i zegar

## Phase 3: Dodatki — wniosek o stopień na ekranie, podgląd na żywo, data rozmowy

### Changes Required:

#### 1. Pole wniosku o stopień

**File**: `src/views/assessment.tsx`

**Intent**: Wniosek o stopień tylko dla urzędnika mianowanego, według `gradeRequestOptions`: „nie dotyczy”, samo „nie” albo wybór „tak / nie”, z polem umotywowania i nazwą stopnia docelowego. Pola `gradeRequestAttached` i `gradeMotivation`.

**Contract**: bez nowych tras; serwer sprawdza jak w fazie 1.

#### 2. Podgląd wyniku przy wypełnianiu

**File**: `src/routes/assessment.tsx`, `public/assessment.js`

**Intent**: Po każdej zmianie punktów albo pól tekstowych formularz wysyła się w tle na `POST /cycles/:id/assessment/preview` i podmienia ramkę wyniku i listę blokad. Bez skryptu ekran działa jak w wersji minimalnej. Skrypt to kilkanaście linii zwykłego JavaScriptu w `public/assessment.js`, serwowanego lokalnie (bez CDN i bez biblioteki).

**Contract**: `POST /cycles/:id/assessment/preview`: tylko oceniający (inaczej 403); niczego nie zapisuje, więc odpowiada 200 z fragmentem HTML (`ResultPanel` + lista blokad), nigdy przekierowaniem 303. Oceny spoza kryteriów cyklu albo spoza skali pokazuje jako blokady w tym fragmencie. Skrypt podmienia element `id="assessment-result"` i niczego nie zapisuje.

#### 3. Pole „Data rozmowy oceniającej”

**File**: `src/views/assessment.tsx`

**Intent**: Pole `interviewDate` domyślnie `today()`, nie późniejsze niż `today()`; trafia do szkicu i migawki.

**Contract**: data spoza zakresu → 422 z formularzem przy zapisie szkicu i przy zatwierdzeniu.

### Success Criteria:

#### Automated Verification:

- Testy dodatków przechodzą: `bun test src/routes/assessment.test.ts` (podgląd z „1” przy Rzetelności odpowiada 200, zwraca „Ocena negatywna” i nie zmienia liczby zdarzeń; podgląd przez Piotra → 403; formularz Tomasza ma pole wniosku o stopień, formularz Piotra go nie ma; `interviewDate` z przyszłości → 422 i brak zdarzenia)
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 4 pokazu: po „1” przy Rzetelności wynik zmienia się na negatywny bez przeładowania

## Testing Strategy

- **Czysta logika** (`src/engine/approval.test.ts`): każda blokada osobno i komplet bez blokad; uzasadnienie wymagane tylko przy wyniku negatywnym (przypadek „1” przy średniej powyżej 4 i przypadek średniej równej dokładnie 4); teksty z samych spacji traktowane jako puste; zestaw ocen różny od zestawu kryteriów (brak jednego, jedno nadmiarowe); wniosek o stopień: pracownik, urzędnik z wynikiem negatywnym, urzędnik ze stopniem IX, urzędnik bez umotywowania, urzędnik z umotywowaniem; `approvalBlockers` dostaje stopień jako argument (z `currentGrade` liczy go wołający).
- **Stan oceny** (`src/assessment/state.test.ts`): kolejność etapów; ostatni szkic wygrywa; zdarzenie z datą późniejszą niż `today()` jest niewidoczne (decyzja 10i); `objectionDeadline` czytany z payloadu, nie przeliczany (test z payloadem celowo różnym od wyniku silnika).
- **Migawka** (`src/assessment/snapshot.test.ts`): komplet pól bez `asOf` i z historycznym `asOf`; termin i stopień czytane na datę `asOf`; brak zapisu.
- **Trasy** (`src/routes/assessment.test.ts`) przez `app.request()` na `createTestApp({ today })`, konto ustawiane ciasteczkiem, datę przesuwa `POST /demo/date`. Testy zaczynające od późniejszej daty biorą potwierdzoną część I Piotra z `createTestApp({ today, seedOptions: { afterStep1: true } })` i nie dopisują `cycle_criteria` ani zdarzeń części I własnym kodem; test `no_part1` używa danych domyślnych (Piotr bez części I). Jedyne zdarzenie wgrywane w teście to `mandatory_grade_awarded` przez `seedEvent(type, cycleId, actorId, payload, date)` z pełnym payloadem `{ personId, fromGrade, toGrade, basis }`. Każdy błąd walidacji ma jeden kod: 422. Każdy test zapisu sprawdza także zdarzenia w `events`, nie tylko kod odpowiedzi. Wniosek o stopień (FR-023) jest sprawdzany tylko testem, na bieżącym cyklu Tomasza przy dacie 2026-11-10.
- **Ręcznie**: kroki 4 i 5 pokazu na prawdziwej aplikacji, telefon 360 px i komputer 1440 px; fikcja w osobnym przebiegu od czystych danych.

## Open Questions

Żadne nie blokuje; implementujący przyjmuje wartość domyślną.

1. **Czy po fikcji oceniany może jeszcze potwierdzić?** Domyślnie: nie; pierwsze z dwóch zdarzeń zamyka etap, a oceniany widzi wpis o fikcji i zegar.
2. **Czy „Wstaw” z notatek działa także we wnioskach do IPRZ?** FR-021 i roadmapa S-04 mówią o uzasadnieniu i wnioskach, decyzja 10f tylko o uzasadnieniu. Domyślnie: ten plaster daje miejsce `conclusionsTools`, decyzję podejmuje S-04.
3. **Liczba dni w zegarze, gdy termin przesunął się na dzień roboczy.** Domyślnie: ekran skutku fikcji mówi „7 dni” (zdanie z decyzji 11a, liczba z `deadlines.objectionDays.value`), a datę końca podaje z silnika, więc może być późniejsza niż 7 dni kalendarzowych.

## References

- `context/changes/rules-engine-and-demo-data/plan.md`: rozdział „Kontrakt wspólny dla wszystkich plastrów”
- `context/foundation/decisions.md`: 5a, 5b, 10b, 10f, 10i, 10n, 11a, 11b
- `context/foundation/prd.md`: US-05, FR-018, FR-019, FR-022, FR-023, FR-024, FR-025, FR-033, Business Logic, Access Control
- `context/foundation/roadmap.md`: S-02
- `context/foundation/demo.md`: kroki 4 i 5, „Ustalenia do scenariusza”
- Recenzja planów: ustalenia 2, 3, 5, 7, 8, 9, 13, 15
- `src/silnik/ocena.ts:73`, `src/silnik/terminy.ts:101`; po F-01 `src/engine/scoring.ts` i `src/engine/deadlines.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wersja minimalna — ocena, zatwierdzenie, potwierdzenie

#### Automated

- [ ] 1.1 Testy reguł zatwierdzenia przechodzą: `bun test src/engine/approval.test.ts`
- [ ] 1.2 Testy stanu oceny przechodzą: `bun test src/assessment/state.test.ts`
- [ ] 1.3 Testy migawki przechodzą: `bun test src/assessment/snapshot.test.ts` (bez `asOf` migawka ma `periodTo`, `confirmation.date` i `deadline` z dnia `today()`; z historycznym `asOf` ma `deadline` = `effectiveDeadline(cycleId, { asOf })` oraz `grade` i `gradeAwardedOn` = `currentGrade(personId, { asOf })`, także gdy po dacie `asOf` jest zdarzenie `mandatory_grade_awarded` (migawka go nie uwzględnia); `rulesVersion` to obiekt `{ version, effectiveFrom, act }`; funkcja nie zmienia liczby zdarzeń)
- [ ] 1.4 Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts` (scenariusze kroku 4: „1” przy Rzetelności i „7” przy pozostałych po „Zapisz” daje na ekranie „Ocena negatywna” i „powyżej oczekiwań”; zatwierdzenie bez wniosków do IPRZ → 422 i brak `assessment_approved`; z wnioskami, bez uzasadnienia przy wyniku negatywnym → 422; komplet → 303 i migawka z kompletem pól `AssessmentSnapshot`, w tym `periodFrom` = 2024-11-27, `deadline` równym `effectiveDeadline(cycleId)` w dniu zatwierdzenia (bez nieobecności Piotra 2026-11-27), `grade` = `null`, `gradeAwardedOn` = `null` i `rulesVersion` = `{ version, effectiveFrom, act }`; po zatwierdzeniu podgląd pokazuje termin z `snapshot.deadline`). Testy zaczynające od daty 2026-11-21 biorą potwierdzoną część I Piotra z `createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } })`
- [ ] 1.5 Test etykiet przechodzi (ten sam plik): na ekranie oceny w trybie edycji i podglądu, na liście spraw i na ekranie części I element z imieniem i nazwiskiem ocenianego nie zawiera liczby, średniej, poziomu ani etykiety wyniku (zasada 7 z `AGENTS.md`); wynik stoi tylko w elemencie `id="assessment-result"`
- [ ] 1.6 Testy bezpośrednich żądań przechodzą (te same pliki): zapis i zatwierdzenie przez osobę inną niż oceniający → 403; bez widocznego `part1_confirmed` → 409 i brak formularza na ekranie; ocena przy kryterium spoza cyklu albo wartość 4 → 422; brak oceny przy jednym kryterium przy zatwierdzeniu → 422; w każdym z tych przypadków brak `assessment_approved`; wniosek o stopień u Piotra → 422; dwa kolejne `approve` z kompletem → drugie 409, jedno `assessment_approved`; zapis szkicu po zatwierdzeniu → 409; zapis szkicu i `approve` po potwierdzeniu przez Piotra → 409. Żaden błąd walidacji nie odpowiada 400
- [ ] 1.7 Test wniosku o stopień przechodzi: cykl Tomasza przy dacie 2026-11-10 (część I z `src/seed/part1.ts`, przed oceną z 12.11.2026); wynik pozytywny i wniosek bez umotywowania → 422, z umotywowaniem → zatwierdzone z `targetGrade` o jeden wyższym; ten sam wniosek przy wyniku negatywnym → 422; po wgranym w teście zdarzeniu `seedEvent("mandatory_grade_awarded", <cykl Tomasza>, <aktor>, { personId: <Tomasz>, fromGrade: 5, toGrade: 9, basis }, "2026-11-10")` → `currentGrade` zwraca 9 i wniosek → 422; migawka zatwierdzonej oceny Tomasza ma `grade` i `gradeAwardedOn` równe `currentGrade` z dnia zatwierdzenia
- [ ] 1.8 Testy potwierdzenia i zegara przechodzą: potwierdzenie przez Piotra przy dacie 2026-11-22 zapisuje `objectionDeadline` = 2026-11-30 i ekran pokazuje 30.11.2026; potwierdzenie 2026-11-21 daje również 2026-11-30; po przesunięciu daty na 2026-11-30 ekran mówi „ostatni dzień”, na 2026-12-01 „Termin na sprzeciw minął 30.11.2026”, a payload się nie zmienia; w etapie `approved` zegara nie ma; potwierdzenie przez Marka → 403; przed zatwierdzeniem → 409; drugie potwierdzenie → 409 i jedno zdarzenie
- [ ] 1.9 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 1.10 Kroki 4 i 5 pokazu: Marek 21.11.2026 po „1” przy Rzetelności i „Zapisz” widzi wynik negatywny, uzasadnienie oznaczone jako wymagane, „Zatwierdź ocenę” bez wniosków do IPRZ pokazuje blokadę z przepisem; po zatwierdzeniu Piotr 22.11.2026 na telefonie trafia z listy spraw do oceny, potwierdza i widzi zegar z 30.11.2026; ekrany czytelne przy 360 px i 1440 px w układzie z design systemu
- [ ] 1.11 Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku, średniej ani etykiety poza samym ekranem oceny

### Phase 2: Fikcja zapoznania i wgląd kadr

#### Automated

- [ ] 2.1 Testy fikcji przechodzą: `bun test src/routes/assessment.test.ts` (fikcja bez wyboru → 422 i brak zdarzenia; bez sposobu albo daty doręczenia, z datą po `today()` albo przed zatwierdzeniem → 422 i brak zdarzenia; przez Piotra albo Joannę → 403; z `would_not` przy dacie 2026-11-22 → zdarzenie z `objectionDeadline` = 2026-11-30, a potem potwierdzenie przez Piotra → 409; potwierdzenie, potem fikcja → 409; równoczesne żądania potwierdzenia i fikcji (`Promise.all`) → jedno zdarzenie końcowe; Joanna widzi wpis o fikcji i nie widzi przycisków; `cycleLinks` dla Joanny zawiera „Ocena” od `approved`, a przed `approved` nie; po fikcji `openCycle(Piotr)` zwraca `null`; ekran skutku nie zawiera słów „biegnie” ani „podpis”)
- [ ] 2.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.3 Wersja 5-minutowa, osobny przebieg od czystych danych: `bun run seed -- --after-step-1` (bez `--live-step-2`, żeby notatka z 11.03.2026 istniała), potem daty jak w „Datach pokazu” kontraktu: krok 4 przy 2026-11-21, fikcja zamiast potwierdzenia Piotra przy 2026-11-22; albo kroki 1 i 2 odtworzone klikaniem. Marek przechodzi przez ekran skutku, wybiera powód i doręczenie kopii, a Joanna widzi wpis i zegar

### Phase 3: Dodatki — wniosek o stopień na ekranie, podgląd na żywo, data rozmowy

#### Automated

- [ ] 3.1 Testy dodatków przechodzą: `bun test src/routes/assessment.test.ts` (podgląd z „1” przy Rzetelności odpowiada 200, zwraca „Ocena negatywna” i nie zmienia liczby zdarzeń; podgląd przez Piotra → 403; formularz Tomasza ma pole wniosku o stopień, formularz Piotra go nie ma; `interviewDate` z przyszłości → 422 i brak zdarzenia)
- [ ] 3.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 3.3 Krok 4 pokazu: po „1” przy Rzetelności wynik zmienia się na negatywny bez przeładowania
