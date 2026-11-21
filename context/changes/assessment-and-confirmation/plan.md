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
- `objectionDeadline` przesuwa koniec na dzień roboczy (dziś `src/silnik/terminy.ts:101`), więc data może wypaść później niż 7 dni kalendarzowych: potwierdzenie 21.11.2026 (sobota) albo 22.11.2026 (niedziela) daje 30.11.2026. Ekran pokazuje datę z silnika, a zdanie „7 dni” bierze wartość z pliku reguł.
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

Stan oceny to wyłącznie wiersze w `events` (bez nowej tabeli), zgodnie z decyzją 10i: szkic to ostatnie widoczne `assessment_draft_saved`, a zatwierdzenie, potwierdzenie i fikcja to osobne zdarzenia zapisane przez `recordEvent` z datą `today()`. Odczyt idzie wyłącznie przez `visibleEvents(cycleId)`. Zatwierdzenie zapisuje pełną migawkę oceny (punkty, wynik, teksty, okres, termin na dzień zatwierdzenia, wersja reguł), żeby historia i wydruk (S-06) niczego nie przeliczały, a ocena pamiętała swoją wersję reguł (FR-033). Termin sprzeciwu liczy się raz, przy zapisie potwierdzenia albo fikcji, i jest odtąd czytany z payloadu tego zdarzenia.

Wynik liczy wyłącznie silnik na serwerze. Zapis następuje tylko po kliknięciu „Zapisz”, „Zatwierdź ocenę”, „Potwierdzam zapoznanie z oceną” albo „Zapisz wpis” (zasada „nic bez kliknięcia człowieka”). Każda trasa zapisu sprawdza na serwerze aktora, etap i dane, niezależnie od tego, co pokazał formularz. Sprawdzenie etapu i zapis zdarzenia końcowego dzieją się w jednej transakcji SQLite, więc powtórzone albo konkurencyjne żądania zostawiają najwyżej jedno `assessment_approved` i najwyżej jedno z pary `assessment_acknowledged` / `acknowledgement_fiction`.

Ekrany (wygląd z design systemu autora, wspólny układ z F-01):

- ekran „Ocena” w trybie edycji (oceniający przed zatwierdzeniem), podglądu (po zatwierdzeniu: oceniający, oceniany, kadry) albo ze zdaniem zamiast formularza (brak potwierdzonej części I; oceniany przed zatwierdzeniem);
- ekran skutku fikcji zapoznania;
- komponenty w `src/views/assessment.tsx`: wiersz kryterium z wyborem punktów, ramka wyniku, lista blokad, blok potwierdzenia (miejscowość, data, nazwisko), zegar sprzeciwu, wpis o fikcji.

### Wersja minimalna (ok. 50 minut)

Kroki 4 i 5 pokazu działają od początku do końca; wynik pokazuje się po „Zapisz”. To jest faza 1 i powstaje pierwsza:

- podstawy prawne blokad w pliku reguł; `approvalBlockers` ze wszystkimi blokadami, także regułą wniosku o stopień (czysta logika z testem);
- `assessmentState` z etapem i terminem sprzeciwu czytanym z payloadu;
- `GET/POST /cycles/:id/assessment`, `POST /cycles/:id/assessment/approve`, `POST /cycles/:id/assessment/acknowledge` z pełnymi kontrolami serwera i transakcją;
- widok edycji i podglądu z ramką wyniku po „Zapisz”, blokami potwierdzenia, zegarem sprzeciwu i pustymi `slots` dla S-04;
- pozycje listy spraw (`registerHomeTasks`) i odnośnik „Ocena” na ekranie części I (`registerCycleLinks`), bo bez nich Piotr nie trafi do oceny z telefonu;
- testy bezpośrednich żądań i zegara (potwierdzenie 22.11.2026 → 30.11.2026).

### Kolejność cięcia

Po wersji minimalnej powstaje reszta w tej kolejności. Gdy zabraknie czasu, wypada od końca listy:

1. Fikcja zapoznania: ekran skutku, zapis, wpis w podglądzie (faza 2; potrzebna do wersji 5-minutowej).
2. Podgląd oceny na koncie kadr z wpisem o fikcji (faza 2; bez niego wpis pokaże S-06).
3. Pole wniosku o stopień na ekranie (faza 3; reguła i test bezpośredniego żądania są w wersji minimalnej, pokaz go nie klika).
4. Podgląd wyniku na żywo przez `POST /cycles/:id/assessment/preview` (faza 3; bez niego wynik i blokady odświeżają się po „Zapisz”).
5. Pole „Data rozmowy oceniającej” (faza 3; bez niego w migawce `interviewDate` = `today()`).

Nie wycinać niczego z wersji minimalnej: punktów, wyniku z przepisem, blokad uzasadnienia i IPRZ, kontroli serwera, zatwierdzenia, potwierdzenia ocenianego, zegara sprzeciwu.

## Założenia wobec wcześniejszych plastrów

Same nazwy z kontraktu wspólnego.

**F-01:**

- Tabele: `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z kluczem `office_city`.
- Funkcje: `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `visibleEvents(cycleId)` (zdarzenia z `date <= today()`, porządek `(date, id)`), `effectiveDeadline(cycleId)` z `src/cycles.ts` zwracające `{ date, basis: string[] }`, `registerHomeTasks(fn)` z `src/home-tasks.ts`, `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()`.
- Silnik: `computeAssessment(scores)`, `mandatoryCriteria(sheet)`, `criterion(id)` z `src/engine/scoring.ts`; `objectionDeadline` z `src/engine/deadlines.ts`; plik `rules/regulation-2016-470.json`.
- Układ `src/views/layout.tsx`, statyczne pliki z `public/`, `createTestApp({ today })` z `src/test-helpers.ts`.
- Dane z `src/seed/base.ts`: cykl Piotra (arkusz C, oceniający Marek, `period_start` = 2024-11-27) bez części I, Piotr `appointed = 0`, Tomasz `appointed = 1` ze stopniem w `civil_service_grade`, data systemowa 2024-12-09.

**S-01:**

- `cycle_criteria(cycle_id, criterion_id, kind, expectation)` wypełnione dla cyklu; lista kryteriów oceny to te wiersze w kolejności: obowiązkowe (`kind = mandatory`, w kolejności `mandatoryCriteria(sheet)`), potem dodatkowe (`kind = additional`). Ta lista jest dokładnym zestawem, który musi mieć oceny.
- Zdarzenie `part1_confirmed` `{ place, appraiseeName }`. Bez widocznego `part1_confirmed` ekran oceny pokazuje „Ocena nie może powstać bez potwierdzonej części I” i nie ma formularza, a trasy zapisu odmawiają (PRD, Business Logic).
- `GET /cycles/:id/part1` to ekran wejściowy cyklu z `cycleLinks`; tam ten plaster dokłada odnośnik „Ocena”.
- `src/seed/part1.ts`: pełna część I bieżącego cyklu Tomasza (potrzebna testowi wniosku o stopień).

**S-06 (później, nie warunek tego plastra):** `src/seed/assessments.ts` wgrywa oceny Tomasza jako pełne łańcuchy zdarzeń w kształcie migawki z sekcji niżej; `mandatory_grade_awarded { fromGrade, toGrade, basis }` zmienia bieżący stopień.

**Bieżący stopień urzędnika** (do wniosku o stopień): `toGrade` z ostatniego widocznego zdarzenia `mandatory_grade_awarded` tej osoby, a gdy go nie ma, `people.civil_service_grade`. S-06 czyta stopień według tej samej reguły (ustalenie 9 z recenzji). Odczyt idzie przez `currentGrade(personId)` z `src/people.ts` (kontrakt wspólny, F-01); ten plaster nie pisze własnej kopii reguły.

## Co ten plaster udostępnia

**Według kontraktu:**

- Zdarzenie `assessment_draft_saved`, payload `AssessmentDraft`: `{ scores: Record<criterionId, number>, justification: string, developmentConclusions: string, interviewDate: string | null, gradeRequest: { attached: boolean, motivation: string } }`. Actor: oceniający.
- Zdarzenie `assessment_approved`, payload `AssessmentSnapshot`: wszystko z `AssessmentDraft` plus
  - `sheet` (z `cycles.sheet`),
  - `criteria: { id, name, kind, score }[]` w kolejności arkusza,
  - `result`: wynik `computeAssessment` (`mean, overallLevel, outcome, reasons, justificationRequired`),
  - `periodFrom` = `cycles.period_start` (dla Piotra 2024-11-27), `periodTo` = data zatwierdzenia,
  - `deadline: { date, basis }` = `effectiveDeadline(cycleId)` na dzień zatwierdzenia,
  - `rulesVersion` = `rulesVersion()` (`{ version, effectiveFrom, act }`),
  - `grade`: bieżący stopień w dniu zatwierdzenia albo `null`; `gradeRequest.targetGrade`: stopień o jeden wyższy albo `null`,
  - `confirmation: { place, date, name }` oceniającego (`place` z `settings.office_city`).
  Actor: oceniający. Ten kształt S-06 stosuje w `src/seed/assessments.ts`.
- Zdarzenie `assessment_acknowledged`, payload `{ place, date, name, objectionDeadline }` (`place` z `settings.office_city`, `date` = `today()`, `name` = `people.name` ocenianego, `objectionDeadline` = `objectionDeadline(today())`). Actor: oceniany.
- Zdarzenie `acknowledgement_fiction`, payload `{ reason, deliveryMethod, deliveredOn, objectionDeadline }`: `reason` = `could_not` | `would_not` (etykiety „nie mógł” / „nie chciał”), `deliveryMethod` = `in_person` | `post` | `email` (osobiście, pocztą, pocztą elektroniczną), `deliveredOn` = data doręczenia kopii arkusza, `objectionDeadline` = `objectionDeadline(today())`. Actor: oceniający.
- Trasy: `GET /cycles/:id/assessment`, `POST /cycles/:id/assessment` (zapis szkicu), `POST /cycles/:id/assessment/preview` (fragment wyniku i blokad, bez zapisu), `POST /cycles/:id/assessment/approve`, `POST /cycles/:id/assessment/acknowledge`, `GET /cycles/:id/assessment/fiction` (ekran skutku), `POST /cycles/:id/assessment/fiction`.
- Wpisy do wspólnych list: `registerHomeTasks` (oceniający: „Wystaw ocenę: <imię i nazwisko>” w etapie `draft`, „Czeka na potwierdzenie zapoznania: <imię i nazwisko>” w etapie `approved`; oceniany: „Zapoznaj się z oceną” w etapie `approved`; bez wyniku i liczb przy nazwisku) oraz `registerCycleLinks` (odnośnik „Ocena” do `/cycles/:id/assessment` dla oceniającego, ocenianego od `approved` i kadr od `approved`).

**Własne eksporty tego plastra (kontrakt ich nie wymienia):**

- `approvalBlockers(input): Blocker[]` w `src/engine/approval.ts` (czysta), `Blocker = { field, message, basis }`; tamże `gradeRequestOptions(...)`.
- `assessmentState(cycleId)` w `src/assessment/state.ts`: `{ stage: "no_part1" | "draft" | "approved" | "acknowledged" | "fiction", draft, snapshot, acknowledgement, fiction, objectionDeadline }`. S-06 bierze stąd etap do ekranu kadr i migawkę do wydruku.

**Miejsca dla S-04 w formularzu** (jedyne miejsca, przez które S-04 dokłada coś do ekranu oceny):

- `AssessmentView` w `src/views/assessment.tsx` przyjmuje prop `slots` (domyślnie pusty obiekt) z czterema opcjonalnymi polami: `criterionAside(criterionId)` (notatki przy kryterium i ostrzeżenie FR-020), `justificationTools` (akcja „Wstaw” nad polem uzasadnienia), `conclusionsTools` (to samo nad wnioskami do IPRZ, jeśli S-04 to zrobi), `beforeForm` (odnośnik do `GET /cycles/:id/cards/assessment-conversation`). S-04 przekazuje `slots` w wywołaniu widoku w `src/routes/assessment.tsx`.
- Pola tekstowe to `<textarea name="justification" id="justification">` i `<textarea name="developmentConclusions" id="developmentConclusions">`: ta sama wartość jako `name` i `id`, i to są cele przycisków „Wstaw”. Pozostałe pola formularza: `score[<criterionId>]`, `interviewDate`, `gradeRequestAttached`, `gradeMotivation`.
- Wstawienie tekstu przez S-04 niczego nie zapisuje; zapis dalej wymaga „Zapisz” albo „Zatwierdź ocenę”.

## Phase 1: Wersja minimalna — ocena, zatwierdzenie, potwierdzenie

### Changes Required:

#### 1. Podstawy prawne pól oceny w pliku reguł

**File**: `rules/regulation-2016-470.json`

**Intent**: Dopisać podstawy prawne pól, które blokują zatwierdzenie, i regułę stopnia, żeby komunikaty brały przepis z danych, nie z kodu (NFR „każdy wynik ma obok podstawę prawną”).

**Contract**: klucz `approval`: `justification.basis = "§ 11 ust. 3"`, `developmentConclusions.basis = "art. 81 ust. 5 ustawy"`, `gradeRequest.basis = "§ 11 ust. 5, art. 89 ust. 1 ustawy"`, `gradeRequest.maxGrade = 9`, `acknowledgement.basis = "§ 12"`. Wersja pliku zostaje bez zmian (dodanie podstaw nie zmienia sposobu liczenia).

#### 2. Reguły zatwierdzenia

**File**: `src/engine/approval.ts`, `src/engine/approval.test.ts`

**Intent**: Jedna czysta funkcja, która dla szkicu, listy kryteriów cyklu i danych ocenianego zwraca listę blokad z komunikatem po polsku i przepisem. Ta sama lista służy ekranowi i odmowie zatwierdzenia na serwerze.

**Contract**: `approvalBlockers({ criteria: string[], draft: AssessmentDraft, appointed: boolean, grade: number | null }): Blocker[]`. Blokady:

- kryterium cyklu bez oceny → „Brakuje oceny cząstkowej: <nazwa kryterium>” (§ 11 ust. 1);
- ocena przy kryterium spoza cyklu albo wartość spoza skali z pliku reguł → blokada (zestaw ocen musi dokładnie równać się zestawowi kryteriów cyklu);
- puste (po przycięciu spacji) `developmentConclusions` → zawsze;
- puste `justification`, gdy `justificationRequired` (liczone tylko przy komplecie ocen);
- `gradeRequest.attached` u osoby nie mianowanej, przy wyniku negatywnym albo przy stopniu równym `maxGrade` → wniosku nie można dołączyć, z powodem;
- `gradeRequest.attached` z pustym `motivation` → brakuje umotywowania.

Pomocniczo `gradeRequestOptions({ appointed, grade, outcome }): "not_applicable" | "no_only" | "yes_or_no"` dla ekranu i bieżący stopień według reguły z „Założeń” (ostatnie widoczne `mandatory_grade_awarded.toGrade`, inaczej `people.civil_service_grade`).

#### 3. Stan oceny z dziennika zdarzeń

**File**: `src/assessment/state.ts`, `src/assessment/state.test.ts`

**Intent**: Złożyć z `visibleEvents(cycleId)` etap oceny i dane do ekranów w jednym miejscu, z którego korzystają trasy tego plastra i ekran kadr S-06.

**Contract**: `assessmentState(cycleId)` jak w „Co ten plaster udostępnia”. Etapy: bez widocznego `part1_confirmed` → `no_part1`; potem `draft` (także bez żadnego szkicu); `assessment_approved` → `approved`; pierwsze z `assessment_acknowledged` / `acknowledgement_fiction` → `acknowledged` albo `fiction`. Szkic to ostatnie `assessment_draft_saved` w porządku `(date, id)`. `objectionDeadline` to wartość z payloadu zdarzenia potwierdzenia albo fikcji, bez ponownego liczenia; przed tym zdarzeniem `null`.

#### 4. Trasy oceny i potwierdzenia

**File**: `src/routes/assessment.tsx`, rejestracja w `src/index.tsx`

**Intent**: Ekran oceny, zapis szkicu, zatwierdzenie i potwierdzenie ocenianego. Każda trasa zapisu sprawdza wszystko sama, bo żądanie może przyjść z pominięciem formularza.

**Contract**:

- `GET /cycles/:id/assessment`: oceniający (`cycles.appraiser_id`) widzi formularz w etapie `draft`, podgląd w dalszych; oceniany (`cycles.person_id`) widzi podgląd od `approved`, wcześniej zdanie „Ocena nie jest jeszcze zatwierdzona”; inni dostają 403 (kadry: faza 2). Przy `no_part1` zdanie z Business Logic i brak formularza.
- Kontrole wspólne dla `POST /cycles/:id/assessment` i `POST /cycles/:id/assessment/approve`: aktor = `cycles.appraiser_id`, inaczej 403; widoczne `part1_confirmed`, inaczej 409; etap `draft`, inaczej 409; każda ocena przy kryterium z `cycle_criteria` i z wartością ze skali, inaczej 400.
- `POST /cycles/:id/assessment`: zapisuje `assessment_draft_saved` i przekierowuje na ekran (303), gdzie ramka wyniku pokazuje wynik ze szkicu.
- `POST /cycles/:id/assessment/approve`: zapisuje szkic z formularza (kliknął człowiek), potem w jednej transakcji sprawdza ponownie etap i `approvalBlockers` dla bieżącego stopnia; gdy lista jest pusta, zapisuje `assessment_approved` z migawką i przekierowuje (303); w przeciwnym razie 422 z formularzem i listą blokad. Wniosek o stopień przysłany, gdy `gradeRequestOptions` daje `not_applicable` albo `no_only`, to blokada (422), nie cicho pominięte pole.
- `POST /cycles/:id/assessment/acknowledge`: aktor = `cycles.person_id`, inaczej 403; w jednej transakcji etap `approved`, inaczej 409; zapisuje `assessment_acknowledged` z `objectionDeadline(today())`.

#### 5. Widok oceny i zegar sprzeciwu

**File**: `src/views/assessment.tsx`

**Intent**: Jeden widok w trybie edycji i podglądu. W edycji: kryteria w kolejności arkusza (obowiązkowe, potem dodatkowe) z wyborem punktów i nazwą poziomu przy każdej wartości; ramka wyniku pod kryteriami, liczona z ostatniego szkicu; uzasadnienie ze zdaniem „Ten tekst przeczyta pracownik” (decyzja 10f) i oznaczeniem „wymagane przy ocenie negatywnej, § 11 ust. 3”, które zmienia się na „wymagane” przy wyniku negatywnym; „Wnioski do indywidualnego programu rozwoju zawodowego” zawsze wymagane; lista blokad nad przyciskami; przyciski „Zapisz” i „Zatwierdź ocenę”. W podglądzie: te same dane z migawki bez pól, blok potwierdzenia oceniającego (miejscowość, data, nazwisko), a u ocenianego w etapie `approved` oświadczenie z arkusza („Potwierdzam odbycie rozmowy oceniającej oraz zapoznanie z oceną i wnioskami do indywidualnego programu rozwoju zawodowego.”) i przycisk „Potwierdzam zapoznanie z oceną”; po potwierdzeniu blok potwierdzenia ocenianego i zegar sprzeciwu.

**Contract**: `AssessmentView({ mode: "edit" | "view", state, criteria, person, viewer, blockers, slots })`, `slots` jak w „Miejscach dla S-04”. `ResultPanel({ result | missing })` w elemencie `id="assessment-result"`: średnia (dwa miejsca po przecinku), poziom ogólny, „Ocena pozytywna” albo „Ocena negatywna”, `reasons` z paragrafami, nazwa aktu i wersja reguł. `ObjectionClock({ deadline, today })` z terminem z `assessmentState`: przed terminem „Sprzeciw do dyrektora generalnego urzędu możesz złożyć do <DD.MM.RRRR>. Zostało <n> dni. Art. 83 ust. 1 ustawy o służbie cywilnej.”; w ostatnim dniu „Dziś jest ostatni dzień na sprzeciw (<DD.MM.RRRR>).”; po terminie „Termin na sprzeciw minął <DD.MM.RRRR>.”; przed zdarzeniem potwierdzenia albo fikcji zegara nie ma. Zegar widzą oceniany, oceniający i kadry. Wynik jest tylko na tym ekranie; listy spraw i nagłówki z nazwiskiem nie pokazują wyniku ani liczb.

#### 6. Lista spraw i odnośnik z części I

**File**: `src/assessment/home.ts` (rejestracje przy starcie aplikacji)

**Intent**: Piotr i Marek trafiają do oceny z ekranu startowego i z ekranu części I.

**Contract**: `registerHomeTasks` i `registerCycleLinks` z pozycjami z „Co ten plaster udostępnia”; pozycje linkują do `/cycles/:id/assessment`.

### Success Criteria:

#### Automated Verification:

- Testy reguł zatwierdzenia przechodzą: `bun test src/engine/approval.test.ts`
- Testy stanu oceny przechodzą: `bun test src/assessment/state.test.ts`
- Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts` (scenariusze kroku 4: „1” przy Rzetelności i „7” przy pozostałych po „Zapisz” daje na ekranie „Ocena negatywna” i „powyżej oczekiwań”; zatwierdzenie bez wniosków do IPRZ → 422 i brak `assessment_approved`; z wnioskami, bez uzasadnienia przy wyniku negatywnym → 422; komplet → 303 i migawka z `periodFrom` = 2024-11-27, `deadline` równym `effectiveDeadline(cycleId)` w dniu zatwierdzenia (bez nieobecności Piotra 2026-11-27) i `rulesVersion`)
- Testy bezpośrednich żądań przechodzą (te same pliki): zapis i zatwierdzenie przez osobę inną niż oceniający → 403; bez widocznego `part1_confirmed` → 409 i brak formularza na ekranie; ocena przy kryterium spoza cyklu albo wartość 4 → 400; brak oceny przy jednym kryterium przy zatwierdzeniu → 422; w każdym z tych przypadków brak `assessment_approved`; wniosek o stopień u Piotra → 422; dwa kolejne `approve` z kompletem → drugie 409, jedno `assessment_approved`; zapis szkicu po zatwierdzeniu → 409
- Test wniosku o stopień przechodzi: cykl Tomasza przy dacie 2026-11-10 (część I z `src/seed/part1.ts`, przed oceną z 12.11.2026); wynik pozytywny i wniosek bez umotywowania → 422, z umotywowaniem → zatwierdzone z `targetGrade` o jeden wyższym; ten sam wniosek przy wyniku negatywnym → 422; po wgranym w teście `mandatory_grade_awarded` z `toGrade = 9` → 422
- Testy potwierdzenia i zegara przechodzą: potwierdzenie przez Piotra przy dacie 2026-11-22 zapisuje `objectionDeadline` = 2026-11-30 i ekran pokazuje 30.11.2026; potwierdzenie 2026-11-21 daje również 2026-11-30; po przesunięciu daty na 2026-11-30 ekran mówi „ostatni dzień”, na 2026-12-01 „Termin na sprzeciw minął 30.11.2026”, a payload się nie zmienia; w etapie `approved` zegara nie ma; potwierdzenie przez Marka → 403; przed zatwierdzeniem → 409; drugie potwierdzenie → 409 i jedno zdarzenie
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Kroki 4 i 5 pokazu: Marek 21.11.2026 po „1” przy Rzetelności i „Zapisz” widzi wynik negatywny, uzasadnienie oznaczone jako wymagane, „Zatwierdź ocenę” bez wniosków do IPRZ pokazuje blokadę z przepisem; po zatwierdzeniu Piotr 22.11.2026 na telefonie trafia z listy spraw do oceny, potwierdza i widzi zegar z 30.11.2026; ekrany czytelne przy 360 px i 1440 px w układzie z design systemu
- Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku, średniej ani etykiety poza samym ekranem oceny

## Phase 2: Fikcja zapoznania i wgląd kadr

### Changes Required:

#### 1. Fikcja zapoznania

**File**: `src/routes/assessment.tsx`, `src/views/acknowledgement-fiction.tsx`

**Intent**: Oceniający widzi przycisk „Stwierdź fikcję zapoznania” od razu po zatwierdzeniu, dopóki oceniany nie potwierdził (decyzja 10n). Przycisk prowadzi na ekran skutku: „Urząd przyjmuje dzisiejszy dzień jako dzień zapoznania. Od dziś system liczy 7 dni na sprzeciw” (liczba z pliku reguł; brzmienie z decyzji 11a, ekran nie mówi „termin biegnie”), data końca terminu z silnika, zdanie, że kadry zobaczą wpis, wymagany wybór „nie mógł potwierdzić” albo „nie chciał potwierdzić” oraz wymagane pola „Jak doręczono kopię arkusza” (osobiście, pocztą, pocztą elektroniczną) i „Kiedy” (§ 12 ust. 2 rozporządzenia, decyzja 11a). Zapis tylko po wyborze i kliknięciu „Zapisz wpis”; obok „Wróć bez zapisu”. Po zapisie przycisk ocenianego znika, a w podglądzie oceny jest wpis „Stwierdzono fikcję zapoznania <data>: oceniany nie mógł / nie chciał potwierdzić. Kopia arkusza doręczona <data> (<sposób>). Stwierdził: <oceniający>” i zegar sprzeciwu z terminem z payloadu, opisany jako liczony od dnia przyjętego przez urząd jako dzień zapoznania.

**Contract**: `GET /cycles/:id/assessment/fiction` (ekran skutku; tylko oceniający, tylko etap `approved`, inaczej 403 albo 409). `POST /cycles/:id/assessment/fiction` z polami `reason` (`could_not` | `would_not`), `deliveryMethod` (`in_person` | `post` | `email`) i `deliveredOn` (data ISO nie wcześniejsza niż data zatwierdzenia i nie późniejsza niż `today()`): aktor inny niż oceniający → 403; brak albo inna wartość `reason` → 422 z tym samym ekranem i komunikatem „Wybierz, czy oceniany nie mógł, czy nie chciał potwierdzić”; brak albo zła wartość pól doręczenia → 422 z komunikatem „Wpisz, jak i kiedy doręczono kopię arkusza”; w jednej transakcji etap `approved`, inaczej 409; zapisuje `acknowledgement_fiction` `{ reason, deliveryMethod, deliveredOn, objectionDeadline: objectionDeadline(today()) }`.

#### 2. Wgląd kadr

**File**: `src/routes/assessment.tsx`

**Intent**: Kadry (Joanna, `people.role = hr`) mają wgląd w zatwierdzoną ocenę z blokiem potwierdzenia albo wpisem o fikcji, bez przycisków (PRD, Access Control). Szkicu przed zatwierdzeniem nie widzą. Pełny ekran kadr ze stanem wszystkich cykli robi S-06.

**Contract**: `GET /cycles/:id/assessment` dla roli `hr` od etapu `approved` daje podgląd, wcześniej zdanie „Ocena nie jest jeszcze zatwierdzona”; trasy zapisu dla `hr` → 403.

### Success Criteria:

#### Automated Verification:

- Testy fikcji przechodzą: `bun test src/routes/assessment.test.ts` (fikcja bez wyboru → 422 i brak zdarzenia; bez sposobu albo daty doręczenia, z datą po `today()` albo przed zatwierdzeniem → 422 i brak zdarzenia; przez Piotra albo Joannę → 403; z `would_not` przy dacie 2026-11-22 → zdarzenie z `objectionDeadline` = 2026-11-30, a potem potwierdzenie przez Piotra → 409; potwierdzenie, potem fikcja → 409; równoczesne żądania potwierdzenia i fikcji (`Promise.all`) → jedno zdarzenie końcowe; Joanna widzi wpis o fikcji i nie widzi przycisków; ekran skutku nie zawiera słów „biegnie” ani „podpis”)
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Wersja 5-minutowa, osobny przebieg od czystych danych (`bun run seed -- --live-step-2`, kroki 1 i 4, potem fikcja zamiast potwierdzenia Piotra): Marek przechodzi przez ekran skutku, wybiera powód i doręczenie kopii, a Joanna widzi wpis i zegar

## Phase 3: Dodatki — wniosek o stopień na ekranie, podgląd na żywo, data rozmowy

### Changes Required:

#### 1. Pole wniosku o stopień

**File**: `src/views/assessment.tsx`

**Intent**: Wniosek o stopień tylko dla urzędnika mianowanego, według `gradeRequestOptions`: „nie dotyczy”, samo „nie” albo wybór „tak / nie”, z polem umotywowania i nazwą stopnia docelowego. Pola `gradeRequestAttached` i `gradeMotivation`.

**Contract**: bez nowych tras; serwer sprawdza jak w fazie 1.

#### 2. Podgląd wyniku przy wypełnianiu

**File**: `src/routes/assessment.tsx`, `public/assessment.js`

**Intent**: Po każdej zmianie punktów albo pól tekstowych formularz wysyła się w tle na `POST /cycles/:id/assessment/preview` i podmienia ramkę wyniku i listę blokad. Bez skryptu ekran działa jak w wersji minimalnej. Gdy w repo jest już htmx z F-01 albo S-01, użyć go; inaczej kilkanaście linii zwykłego skryptu w `public/` (bez CDN).

**Contract**: `POST /cycles/:id/assessment/preview`: tylko oceniający (inaczej 403), zwraca fragment `ResultPanel` + lista blokad, nic nie zapisuje. Skrypt podmienia element `id="assessment-result"` i niczego nie zapisuje.

#### 3. Pole „Data rozmowy oceniającej”

**File**: `src/views/assessment.tsx`

**Intent**: Pole `interviewDate` domyślnie `today()`, nie późniejsze niż `today()`; trafia do szkicu i migawki.

**Contract**: data spoza zakresu → 400 przy zapisie.

### Success Criteria:

#### Automated Verification:

- Testy dodatków przechodzą: `bun test src/routes/assessment.test.ts` (podgląd z „1” przy Rzetelności zwraca „Ocena negatywna” i nie zmienia liczby zdarzeń; podgląd przez Piotra → 403; formularz Tomasza ma pole wniosku o stopień, formularz Piotra go nie ma; `interviewDate` z przyszłości → 400)
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 4 pokazu: po „1” przy Rzetelności wynik zmienia się na negatywny bez przeładowania

## Testing Strategy

- **Czysta logika** (`src/engine/approval.test.ts`): każda blokada osobno i komplet bez blokad; uzasadnienie wymagane tylko przy wyniku negatywnym (przypadek „1” przy średniej powyżej 4 i przypadek średniej równej dokładnie 4); teksty z samych spacji traktowane jako puste; zestaw ocen różny od zestawu kryteriów (brak jednego, jedno nadmiarowe); wniosek o stopień: pracownik, urzędnik z wynikiem negatywnym, urzędnik ze stopniem IX, urzędnik bez umotywowania, urzędnik z umotywowaniem; bieżący stopień z ostatniego widocznego `mandatory_grade_awarded`.
- **Stan oceny** (`src/assessment/state.test.ts`): kolejność etapów; ostatni szkic wygrywa; zdarzenie z datą późniejszą niż `today()` jest niewidoczne (decyzja 10i); `objectionDeadline` czytany z payloadu, nie przeliczany (test z payloadem celowo różnym od wyniku silnika).
- **Trasy** (`src/routes/assessment.test.ts`) przez `app.request()` na `createTestApp({ today })`, konto ustawiane ciasteczkiem, datę przesuwa `POST /demo/date`. Seed nie ma części I Piotra, więc test sam ją dopisuje: wiersze `cycle_criteria` (5 obowiązkowych arkusza C, „Orientacja na klienta/interesanta”, „Myślenie analityczne”) oraz `seedEvent` dla `part1_submitted` i `part1_confirmed` z datą 2024-12-09. Każdy test zapisu sprawdza także zdarzenia w `events`, nie tylko kod odpowiedzi. Wniosek o stopień (FR-023) jest sprawdzany tylko testem, na bieżącym cyklu Tomasza przy dacie 2026-11-10.
- **Ręcznie**: kroki 4 i 5 pokazu na prawdziwej aplikacji, telefon 360 px i komputer 1440 px; fikcja w osobnym przebiegu od czystych danych.

## Open Questions

Żadne nie blokuje; implementujący przyjmuje wartość domyślną.

1. **Czy htmx jest w repo?** Domyślnie: użyć, jeśli F-01 albo S-01 go dodał; inaczej zwykły skrypt w `public/assessment.js`.
2. **Czy po fikcji oceniany może jeszcze potwierdzić?** Domyślnie: nie; pierwsze z dwóch zdarzeń zamyka etap, a oceniany widzi wpis o fikcji i zegar.
3. **Czy „Wstaw” z notatek działa także we wnioskach do IPRZ?** FR-021 i roadmapa S-04 mówią o uzasadnieniu i wnioskach, decyzja 10f tylko o uzasadnieniu. Domyślnie: ten plaster daje miejsce `conclusionsTools`, decyzję podejmuje S-04.
4. **Liczba dni w zegarze, gdy termin przesunął się na dzień roboczy.** Domyślnie: ekran skutku fikcji mówi „7 dni” (zdanie z decyzji 11a), a datę końca podaje z silnika, więc może być późniejsza niż 7 dni kalendarzowych.

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
- [ ] 1.3 Testy tras oceny przechodzą: `bun test src/routes/assessment.test.ts`
- [ ] 1.4 Testy bezpośrednich żądań przechodzą
- [ ] 1.5 Test wniosku o stopień przechodzi
- [ ] 1.6 Testy potwierdzenia i zegara przechodzą
- [ ] 1.7 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 1.8 Kroki 4 i 5 pokazu: wynik negatywny po „Zapisz”, blokada bez wniosków do IPRZ, potwierdzenie Piotra z zegarem 30.11.2026, 360 px i 1440 px
- [ ] 1.9 Na żadnym ekranie nie pada słowo „podpis”, a przy nazwisku ocenianego nie ma wyniku ani etykiety poza ekranem oceny

### Phase 2: Fikcja zapoznania i wgląd kadr

#### Automated

- [ ] 2.1 Testy fikcji przechodzą: `bun test src/routes/assessment.test.ts`
- [ ] 2.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.3 Wersja 5-minutowa, osobny przebieg od czystych danych: fikcja z ekranem skutku i wpisem widocznym dla Joanny

### Phase 3: Dodatki — wniosek o stopień na ekranie, podgląd na żywo, data rozmowy

#### Automated

- [ ] 3.1 Testy dodatków przechodzą: `bun test src/routes/assessment.test.ts`
- [ ] 3.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 3.3 Krok 4 pokazu: wynik zmienia się bez przeładowania
