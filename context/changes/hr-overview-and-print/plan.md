# Stan cykli dla kadr, stopień obowiązkowy i wydruk arkusza — plan wdrożenia

## Overview

Plaster S-06 zamyka pokaz (krok 5 w `context/foundation/demo.md`). Daje kadrom (Joanna) jeden ekran ze stanem wszystkich cykli, przypomnieniem o obowiązku urzędu przyznania stopnia służbowego Tomaszowi z terminem 30 dni i podstawą prawną, stanami uproszczonymi (sprzeciw, wniosek o zmianę terminu, statystyki bez nazwisk), a każdej uprawnionej osobie (oceniany, oceniający, kadry) historię ocen, podgląd arkusza i druk z przeglądarki („Drukuj / pobierz PDF”). Niesie 5 z 15 czynności liczonych jako „działa” (decyzja 4): przypomnienie o obowiązkowym stopniu, historia ocen, podgląd, pobranie i wydruk arkusza, oraz widoczne stany dla FR-013, FR-028 i FR-030.

Czas: ok. 80 minut dla jednego agenta, z czego **wersja minimalna ok. 50 minut** (faza 1). Budowany po S-05 i przed S-03 (decyzja 10h), więc nie korzysta z osi czasu ani z tabeli nieobecności. Cała budowa ma za mało czasu (recenzja planów, uwaga 7), dlatego faza 1 jest kompletnym krokiem 5 pokazu, a faza 2 to dodatki w ustalonej kolejności cięcia.

## Current State Analysis

Stan repo w chwili pisania planu (21.11.2026 wieczór): F-01 nie jest jeszcze zbudowany. Jest starter Hono (`src/index.ts`), silnik po polsku w `src/silnik/` i plik reguł `reguly/rozporzadzenie-2016-470.json`. Plaster S-06 powstaje po F-01, S-01, S-02, S-04 i S-05. Wszystkie nazwy tabel, kolumn, funkcji, zdarzeń, tras, plików wspólnych i modułów danych pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`. Przy rozjeździe wygrywa kontrakt, a po zbudowaniu F-01 kod (zasada kontraktu). Ten plan nie tworzy drugiej nazwy na nic, co kontrakt już nazywa.

Co jest pewne już dziś:

- Silnik terminów po F-01 ma w `src/engine/deadlines.ts` `toWorkingDay`, `objectionDeadline` (art. 83 ust. 1 ustawy), `objectionReviewDeadline` (art. 83 ust. 3) i `criteriaTalkDeadline(from, afterNegative)` (§ 7). Brakuje terminu stopnia z mocy prawa (art. 89 ust. 2 ustawy: 30 dni od zapoznania z oceną).
- Plik reguł ma skalę 1/3/5/7/9 i pięć poziomów ogólnych. Dwa najwyższe to „powyżej oczekiwań” i „znacznie powyżej oczekiwań”. `computeAssessment` zwraca `overallLevel` i `outcome` (`positive` | `negative`).
- Układ arkusza A, B i C jest wspólny: część I, część II, dalsza część, część III tylko dla urzędnika mianowanego z dołączonym wnioskiem (zał. 2–4 do rozporządzenia).

## Desired End State

Przy dacie systemowej 22.11.2026 (krok 5 pokazu) Joanna otwiera `/hr` i widzi:

1. Kartę „Obowiązek urzędu: stopień służbowy z mocy prawa”. Osobne pole „Urzędnik: Tomasz Kamiński”. Treść o obowiązku urzędu: „Urząd ma obowiązek przyznać kolejny stopień służbowy, bo od ostatniego stopnia są dwie kolejne oceny pozytywne na jednym z dwóch najwyższych poziomów: 12.11.2024 i 12.11.2026”. Termin: „do 14.12.2026 (30 dni od zapoznania z oceną 12.11.2026, koniec w sobotę 12.12.2026, więc poniedziałek; art. 89 ust. 2 ustawy)”. „Stopień V → VI”. Zdanie „To obowiązek, nie wniosek”.
2. Tabelę cykli: osoba, oceniający, arkusz, stan procesu, termin z podstawą i odnośniki z `cycleLinks(cycle, viewer)` (z tego plastra „Arkusz” i „Historia ocen”; resztę dopisują inne plastry, w tym „Wpisz nieobecność” z S-03). Wśród stanów: „sprzeciw wniesiony 20.11.2026, rozpatrzenie do 04.12.2026” (Katarzyna Lewandowska), „wniosek ocenianej o zmianę terminu czeka na rozpatrzenie” z podstawą i zdaniem o zawiadomieniu na piśmie (Anna, decyzja 11d), „zapoznanie potwierdzone 22.11.2026, sprzeciw do 30.11.2026” (Piotr po kroku 5).
3. (Faza 2) Blok „Statystyki terminowości (widok dyrektora generalnego, bez nazwisk)” i przyciski rozstrzygnięcia sprzeciwu.

Przy dacie 11.11.2026 karty Tomasza nie ma, przy 12.11.2026 jest (decyzja 10i). Strona `/cycles/:id/sheet` pokazuje arkusz ze wszystkimi polami w kolejności wzoru; przycisk „Drukuj / pobierz PDF” otwiera druk przeglądarki; na wydruku nie ma nawigacji ani przycisków, jest pouczenie o sprzeciwie (7 dni od zapoznania, art. 83 ust. 1 ustawy), słowo „potwierdzenie”, nigdzie „podpis”. Oceniany otwiera i drukuje własny egzemplarz części I i całego arkusza. `bun test` przechodzi.

### Key Discoveries

- Art. 89 ust. 2 ustawy liczy 30 dni od zapoznania z oceną. Przy fikcji zapoznania system liczy terminy od dnia wpisu (decyzja 5b po 11a), więc datą „zapoznania” jest data `assessment_acknowledged` albo `acknowledgement_fiction`. Ekran mówi „system liczy”, nie „biegnie termin” (decyzja 11a).
- Wzór arkusza ma pola „podpis”. Zasada 6 z `AGENTS.md` wymaga, żeby na ekranie i wydruku stało „Potwierdzenie w systemie” z miejscowością, datą i nazwiskiem.
- Nie ma konta dyrektora generalnego (Access Control i lista kont w `demo.md`), więc statystyki bez nazwisk pokazujemy na ekranie Joanny jako osobny blok z opisem, dla kogo są.
- Pouczenie o sprzeciwie jest częścią wzoru arkusza; wydruk bez niego byłby niepełny. Oceniany ma prawo do kopii arkusza (§ 12 ust. 2 rozporządzenia), więc sam ją drukuje.

## What We're NOT Doing

- Pełnego obiegu sprzeciwu, wniosku o zmianę terminu i decyzji o stopniu (roadmapa, „Parked”). Są widoczne stany i najwyżej jedno kliknięcie odnotowania.
- Generatora PDF. „Pobranie” to zapis do PDF w oknie druku przeglądarki (decyzja 7).
- Wierności 1:1 ze wzorem (PRD, Non-Goals). Jest komplet pól w kolejności wzoru.
- Notatek i informacji zwrotnej na arkuszu i wydruku: notatek ocenianemu nie pokazujemy (S-04, decyzja 11c), na arkusz trafia tylko tekst uzasadnienia, który przełożony sam wstawił (decyzja 10f).
- Osi czasu, nieobecności i zmiany oceniającego (S-03). Termin bierzemy według tabeli kontraktu „Skąd ekran bierze termin oceny”: termin przekazany w części I z `part1_submitted.payload.dueDate`, termin cyklu otwartego z `effectiveDeadline(cycleId)`, termin oceny zatwierdzonej (arkusz, wydruk, statystyka terminowości) z `AssessmentSnapshot.deadline`. S-03 dokłada nieobecności w `effectiveDeadline` i ekran kadr pokaże nowy termin bez zmian w tym plastrze.
- Wyszukiwania, filtrów i sortowania po wyniku (decyzja 4: lista bez wyszukiwania). Sortujemy tylko po terminie.
- Przypomnienia o stopniu na ekranie oceniającej (Anny). FR-027 dotyczy kadr; reguła jest gotowa do użycia później.
- Stylów ekranu. Wygląd i komponenty pochodzą z design systemu autora (decyzja 10b); plan wymienia tylko ekrany i komponenty. Styl druku jest częścią tego planu.

## Implementation Approach

Trzy warstwy, jak w poprzednich plastrach:

1. **Reguła w silniku** (czysta funkcja, test bez bazy): `src/engine/grades.ts` liczy, czy urzędnikowi mianowanemu należy się stopień z mocy prawa i do kiedy. Liczby są w pliku reguł: 30 dni w `deadlines.mandatoryGradeDays` (dopisuje S-06), najwyższy stopień w `approval.gradeRequest.maxGrade` (klucz S-02), dwa najwyższe poziomy to dwa ostatnie z listy poziomów ogólnych, która już jest w pliku.
2. **Odczyt stanu z widocznych zdarzeń** (`src/hr/`): stan procesu cyklu, historia ocen, bieżący stopień, dane arkusza i statystyki. Każdy odczyt idzie przez `visibleEvents(cycleId)` (granica `date <= today()`, porządek `(date, id)`); cykl istnieje dla ekranu od swojego widocznego `cycle_started`, część I pochodzi z migawki `part1_submitted`, ocena z migawki `assessment_approved` (decyzja 10i, uwaga 11).
3. **Trasy i widoki** w Hono JSX na wspólnym układzie `src/views/layout.tsx`, testowane przez `app.request()` na `createTestApp({ today })`.

Stan cyklu to opis kroku procesu („część I czeka na potwierdzenie ocenianego od 12 dni”), a nie etykieta o człowieku. Na ekranie kadr przy nazwisku nie ma wyniku oceny, poziomu, kolorów ani liczb o osobie (zasada 7 z `AGENTS.md`). Karta stopnia ma nazwisko w osobnym polu, a nagłówek i treść mówią o obowiązku urzędu (uwaga 18). Wynik i poziom widać tylko w historii ocen i na arkuszu, czyli w dokumentach, do których dana osoba ma wgląd z Access Control. Test pilnuje, że HTML ekranu `/hr` nie zawiera nazw poziomów ani słów „pozytywna” i „negatywna”.

### Wersja minimalna (faza 1, ok. 50 minut)

Karta stopnia Tomasza, tabela stanów cykli (ze sprzeciwem Katarzyny Lewandowskiej i wnioskiem Anny), podgląd arkusza ze stylem druku i pouczeniem, druk własnego egzemplarza przez ocenianego (część I i cały arkusz), historia ocen, odnośniki (`registerCycleLinks`, wiersze `/hr`, link na ekranie startowym Joanny) oraz dane pokazowe `src/seed/assessments.ts`. To jest krok 5 pokazu w każdej wersji. Historia i odnośniki są w minimum, bo bez nich arkusze i historia są osiągalne tylko przez wpisanie adresu (uwaga 4).

### Kolejność cięcia

Faza 2 powstaje po wersji minimalnej w kolejności tej listy. Gdy brakuje czasu, tniemy od dołu, więc pierwsza pozycja wypada jako ostatnia:

1. Przycisk „Odnotuj przyznanie stopnia” (faza 2, zmiana 1): **potrzebne do wersji 5-minutowej pokazu**. Powstaje zaraz po wersji minimalnej.
2. Wgrane poprzednie oceny Piotra i Ewy (faza 2, zmiana 2); bez nich historia działa na Tomaszu.
3. Część III na arkuszu (faza 2, zmiana 2); bez niej zostaje pole „Czy dołączono wniosek o kolejny stopień”.
4. Blok statystyk bez nazwisk (faza 2, zmiana 3); bez niego zostaje zdanie „Statystyki: poza prototypem”.
5. Przyciski rozstrzygnięcia sprzeciwu (faza 2, zmiana 4).

Nie wolno ciąć niczego z wersji minimalnej.

## Założenia wobec wcześniejszych plastrów

Same nazwy z kontraktu wspólnego.

**F-01**

- Tabele: `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)` z `role = 'hr'` dla Joanny (`grade_awarded_on` należy do schematu F-01 i może być puste); `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings` z kluczami `demo_date`, `office_city`, `office_name`.
- Funkcje: `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(...)` (tylko w danych pokazowych), `visibleEvents(cycleId, { asOf })` i `effectiveDeadline(cycleId, { asOf })` z `src/cycles.ts` (`asOf` tylko w danych pokazowych i testach; `effectiveDeadline` zwraca `{ date, basis: string[] }`), `visibleEventsOfType(type)`, `openCycle(personId)`, `currentGrade(personId)` z `src/people.ts` (zwraca `{ grade, awardedOn }`; jedyne źródło bieżącego stopnia), `homeTasks(person)` i `registerHomeTasks(fn)` z `src/home-tasks.ts`, `cycleLinks(cycle, person)` i `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()`, `setting(key)`, `createTestApp({ today, seedOptions })` z `src/test-helpers.ts`, `runSeed(db, options)` z `src/seed.ts`.
- Silnik: `src/engine/deadlines.ts` (`addDays`, `toWorkingDay`, `isDayOff`, `nextAssessmentDeadline`, `criteriaTalkDeadline(from, afterNegative)`, `objectionDeadline`, `objectionReviewDeadline`); `src/engine/scoring.ts` (`computeAssessment(scores)` → `{ mean, overallLevel, outcome, reasons, justificationRequired }`, `mandatoryCriteria(sheet)`, `criterion(id)`); `src/engine/rules.ts` czyta `rules/regulation-2016-470.json`.
- Trasy: `GET /`, `GET/POST /account`, `POST /demo/date`. Pliki z `public/` serwuje `serveStatic`.
- Dane: `runSeed(db, options)` woła moduły z `src/seed/` w kolejności `base`, `part1`, `notes`, `assessments`, `absences`. `src/seed/base.ts` wgrywa osoby (w tym dyrektora generalnego urzędu i Katarzynę Lewandowską, podwładną Anny, obie bez konta), datę `2024-12-09`, cykle Piotra, Ewy i Tomasza (bieżący, `period_start = 2024-11-12`) ze zdarzeniami `cycle_started` o pięciu polach `{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`. Tomasz jest urzędnikiem mianowanym ze stopniem V (`appointed = 1`, `civil_service_grade = 5`). Maria nie ma żadnego cyklu.

**S-01**

- Zdarzenia: `part1_submitted { sheet, criteria, dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }` (data zdarzenia = data rozmowy o kryteriach) i `part1_confirmed { place, appraiseeName }`.
- `savePart1(cycleId, actorId, input, date)`: zapis części I z jawnym aktorem i datą, bez sprawdzania aktora. Moduł danych S-06 zapisuje nim część I wgrywanych cykli historycznych.
- Trasa `GET /cycles/:id/part1` jako ekran wejściowy cyklu, który pokazuje `cycleLinks`. Odnośnik do części I w wierszu `/hr` rejestruje S-01 przez `registerCycleLinks`, o ile jego trasa wpuszcza kadry; S-06 nie wpisuje go na sztywno i działa tak samo z widokiem kadr części I i bez niego. Arkusz (`/cycles/:id/sheet`) zawiera całą część I.
- `src/views/components.tsx`: `ConfirmationBlock` (wariant wpisu o fikcji dopisuje S-02). S-06 tylko go używa i niczego w nim nie zmienia.
- `src/seed/part1.ts`: pełna część I bieżącego cyklu Tomasza (przekazana 02.12.2024, potwierdzona 03.12.2024) i cyklu Ewy.

**S-02**

- Zdarzenia: `assessment_approved` z migawką `AssessmentSnapshot` z planu S-02. Ten plaster czyta z niej: `sheet`, `criteria: { id, name, kind, score }[]` w kolejności arkusza, `result` (`mean`, `overallLevel`, `outcome`), `justification`, `developmentConclusions`, `interviewDate`, `gradeRequest: { attached, motivation, targetGrade }`, `periodFrom` (= `cycles.period_start`), `periodTo`, `deadline: { date, basis }` (`effectiveDeadline` z dnia zatwierdzenia), `grade` i `gradeAwardedOn` (stopień z dnia zatwierdzenia), `rulesVersion`, `confirmation: { place, date, name }`. `assessment_acknowledged { place, date, name, objectionDeadline }`; `acknowledgement_fiction { reason, deliveryMethod, deliveredOn, objectionDeadline }` (`reason` ∈ `could_not` | `would_not`, `deliveryMethod` ∈ `in_person` | `post` | `email`).
- `assessmentState(cycleId)` z `src/assessment/state.ts`: `{ stage, draft, snapshot, acknowledgement, fiction, objectionDeadline }`, `stage` ∈ `no_part1` | `draft` | `approved` | `acknowledged` | `fiction`.
- Termin sprzeciwu czytamy z payloadu zdarzenia zapoznania albo fikcji (`objectionDeadline`), nie liczymy go drugi raz (uwaga 15).

**S-04, S-05**: niczego nie używamy. Wymóg negatywny: tabele `notes` i `feedback_messages` nie trafiają na arkusz ani wydruk.

## Co ten plaster udostępnia

Zgodnie z kontraktem (trasy „Kadry i wydruk”, zdarzenia S-06, rozszerzenia `people`, moduł `src/seed/assessments.ts`):

- Rozszerzenie tabeli: tylko `people.appointed_year`.
- Klucz pliku reguł: tylko `deadlines.mandatoryGradeDays`. Granicę stopnia czyta z `approval.gradeRequest.maxGrade` (S-02).
- Trasy: `GET /hr`, `GET /cycles/:id/sheet` (z parametrem `?part=1` dla samej części I), `GET /people/:id/history`, `POST /hr/grades/:personId`, `POST /cycles/:id/objection-outcome`. Zasady wspólne tras: po udanym `POST` przekierowanie 303; błąd walidacji 422, brak uprawnień 403, powtórzenie zamkniętego kroku 409.
- Zdarzenia (payloady):
  - `objection_filed { to }` (adresat sprzeciwu, np. „dyrektor generalny urzędu”);
  - `objection_resolved { outcome }`, `outcome` ∈ `changed` | `redone` | `rejected`;
  - `due_change_requested { requestedDate, reason }`, `reason` to jeden z czterech powodów z art. 81 ust. 8 ustawy (lista zamknięta, decyzja 11d);
  - `mandatory_grade_awarded { personId, fromGrade, toGrade, basis }`, `cycle_id` = cykl drugiej oceny z pary, aktor = osoba z kadr.
- Dane pokazowe: `src/seed/assessments.ts` (obie oceny Tomasza jako pełne łańcuchy zdarzeń, przykłady stanów uproszczonych, w tym zamknięty cykl Katarzyny Lewandowskiej ze sprzeciwem; kształt migawki z S-02). `runSeed(db, options)` woła go jednym dopisanym wywołaniem po `notes`.
- Funkcje:
  - `mandatoryGradeDeadline(ackOn): string` w `src/engine/deadlines.ts`;
  - `mandatoryGrade(input, today)` w `src/engine/grades.ts`;
  - `cycleState(cycleId)` w `src/hr/cycle-state.ts`, `assessmentHistory(personId)` w `src/hr/history.ts`, `sheetData(cycleId, options?)` i `canViewSheet(viewer, cycle)` w `src/hr/sheet-data.ts`;
  - wewnętrznie `officeStats()` w `src/hr/stats.ts`.
- `currentGrade(personId)` pochodzi z `src/people.ts` (F-01). S-06 tylko go używa.
- Odnośniki przez `registerCycleLinks`, tylko dla ról, które wpuszcza trasa `GET`: „Arkusz” (`/cycles/:id/sheet`), gdy widz przechodzi `canViewSheet` (oceniany, oceniający cyklu, kadry); „Historia ocen” (`/people/:personId/history`), gdy widz przechodzi to samo sprawdzenie uprawnień co trasa historii (sama osoba, oceniający któregokolwiek jej cyklu, kadry). Pozycja „Stan cykli” (`/hr`) przez `registerHomeTasks` dla roli `hr`.
- Pliki wspólne, do których S-06 tylko dopisuje: `src/index.tsx` (import i montowanie tras `sheet`, `history`, `/hr` i obu tras `POST`), `src/db.ts` (kolumna `people.appointed_year`), `src/seed.ts` (wywołanie `assessments` po `notes`), `rules/regulation-2016-470.json` (`deadlines.mandatoryGradeDays`), `src/engine/deadlines.ts` (`mandatoryGradeDeadline`), `src/views/layout.tsx` (jedna linia z odnośnikiem do stylu druku, bez zmiany istniejących właściwości).
- Plik `public/print.css` (styl druku dla każdego ekranu; S-03 może z niego korzystać przy osi czasu).

## Phase 1: Wersja minimalna

### Changes Required:

#### 1. Reguła stopnia z mocy prawa i bieżący stopień

**File**: `rules/regulation-2016-470.json`, `src/engine/deadlines.ts`, `src/engine/grades.ts`, `src/engine/grades.test.ts`; `src/people.ts` (`currentGrade` z F-01) tylko do odczytu

**Intent**: Dopisać do pliku reguł w `deadlines` jeden klucz: `mandatoryGradeDays` (`value: 30`, `basis: "art. 89 ust. 2 ustawy"`, `from: "dzień zapoznania się z oceną"`). Najwyższy stopień czytamy z `approval.gradeRequest.maxGrade` (klucz S-02, wartość 9). Dwa najwyższe poziomy ogólne („powyżej oczekiwań”, „znacznie powyżej oczekiwań”) to dwa ostatnie z listy poziomów, która już jest w pliku reguł. Wersja pliku reguł zostaje (dodanie stałej nie zmienia liczenia ocen). `mandatoryGradeDeadline` liczy `toWorkingDay(addDays(ackOn, 30))`.

Reguła (uwaga 9):

1. Bieżący stopień i jego data pochodzą z `currentGrade(personId)` (F-01): ostatnie widoczne `mandatory_grade_awarded` tej osoby (`toGrade`, data zdarzenia, szukane po `payload.personId`), a gdy go nie ma, `people.civil_service_grade` i `people.grade_awarded_on`.
2. Bierzemy **wszystkie** zatwierdzone i widoczne oceny osoby z datą `assessment_approved` późniejszą niż data bieżącego stopnia, w pełnej chronologii (`(date, id)`), także negatywne i bez zapoznania. Niczego nie odfiltrowujemy przed sprawdzeniem kolejności, żeby nie skleić dwóch ocen rozdzielonych trzecią.
3. Idziemy po kolejnych parach (n, n+1). Para kwalifikuje się, gdy obie oceny mają `outcome = "positive"` i `overallLevel` wśród dwóch najwyższych poziomów. Wysoki poziom przy ocenie negatywnej się nie liczy.
4. Obowiązek powstaje z pierwszej kwalifikującej się pary, w której druga ocena ma zapoznanie albo fikcję; `dueOn = mandatoryGradeDeadline(data zapoznania albo fikcji drugiej oceny)`. Para bez zapoznania z drugą oceną jeszcze nie daje obowiązku.
5. Późniejsza ocena (także negatywna) nie kasuje obowiązku, który już powstał. Obowiązek wygasa tylko przez `mandatory_grade_awarded` (zmienia się data bieżącego stopnia).
6. Przy bieżącym stopniu równym `approval.gradeRequest.maxGrade` wynik ma `toGrade: null` i `atMaxGrade: true`; ekran pisze „ma najwyższy stopień, kolejnego nie można przyznać”, bez przycisku.

Ten krok nie pisze drugiej kopii odczytu stopnia. Zdarzenie `mandatory_grade_awarded { personId, fromGrade, toGrade, basis }` jest zapisane przy cyklu drugiej oceny z pary.

**Contract**: `mandatoryGradeDeadline(ackOn: string): string`. `mandatoryGrade({ isAppointed, currentGrade, currentGradeOn, assessments: { cycleId, approvedOn, outcome, overallLevel, acknowledgedOn: string | null }[] }, today): null | { dueOn, basis: "art. 89 ust. 2 ustawy", fromGrade, toGrade: number | null, assessmentDates: [string, string], acknowledgedOn, cycleId, overdue: boolean, atMaxGrade: boolean }`. Osoba z `appointed = 0` → `null`. Wejście `currentGrade` i `currentGradeOn` pochodzi z `currentGrade(personId)`.

#### 2. Stan cyklu i historia

**File**: `src/hr/cycle-state.ts`, `src/hr/history.ts`, `src/hr/cycle-state.test.ts`

**Intent**: Jedno miejsce, które czyta `visibleEvents(cycleId)` i zamienia je na stan procesu z terminem i podstawą. Lista cykli na ekranie kadr to cykle z widocznym `cycle_started`; dla każdej osoby najnowszy z nich. Kolejność rozstrzygania od najpóźniejszego kroku: `objection_resolved`, `objection_filed`, potem etap z `assessmentState(cycleId)` (`fiction`, `acknowledged`, `approved`), `due_change_requested` (gdy nierozpatrzony), `part1_confirmed`, `part1_submitted`, `cycle_started`. Etapów oceny nie liczymy drugi raz: bierzemy `stage`, `snapshot`, `acknowledgement`, `fiction` i `objectionDeadline` z S-02. Teksty stanów (po polsku, zdaniem o kroku procesu, bez oceny osoby):

| step | Tekst | Termin i podstawa |
|---|---|---|
| `criteria_due` | „Kryteria do wyznaczenia” | `criteriaTalkDeadline(previousAssessmentOn ?? periodStart, previousOutcome === "negative")` z payloadu `cycle_started`; podstawa § 7 rozporządzenia (30 dni albo 7 dni po ocenie negatywnej), bez wpisanych na sztywno 30 dni (uwaga 16) |
| `part1_waiting` | „Część I czeka na potwierdzenie ocenianego od X dni” | bez terminu (decyzja 10d); X od daty `part1_submitted` |
| `in_period` | „Okres oceny” | `effectiveDeadline(cycleId)`: `date` i `basis` |
| `awaiting_acknowledgement` | „Ocena zatwierdzona, czeka na potwierdzenie zapoznania” | — |
| `acknowledged` | „Zapoznanie potwierdzone DD.MM.RRRR” | sprzeciw do `objectionDeadline` z payloadu, art. 83 ust. 1 ustawy |
| `fiction` | „Fikcja zapoznania stwierdzona DD.MM.RRRR przez oceniającego: oceniany nie mógł / nie chciał potwierdzić. Kopię arkusza doręczono osobiście / pocztą / pocztą elektroniczną DD.MM.RRRR” | „system liczy sprzeciw do …” (`objectionDeadline` z payloadu), art. 83 ust. 1 ustawy (decyzja 11a) |
| `objection_filed` | „Sprzeciw wniesiony DD.MM.RRRR do <to>” | rozpatrzenie do `objectionReviewDeadline(data)`, art. 83 ust. 3 ustawy |
| `objection_resolved` | „Sprzeciw rozpatrzony: zmiana oceny / ponowne sporządzenie oceny / sprzeciw nieuwzględniony” | — |
| `due_change_requested` | „Wniosek ocenianego o zmianę terminu czeka na rozpatrzenie przez oceniającego. Po zmianie terminu oceniający zawiadamia pracownika pisemnie, a kopia pisma idzie do arkusza” | podstawa: art. 81 ust. 8 ustawy i § 8 rozporządzenia (decyzja 11d); obok bieżący termin z `effectiveDeadline(cycleId)` |

Termin po upływie dostaje dopisek „termin minął DD.MM.RRRR”, bez kolorów przy nazwisku. Historia: zatwierdzone i widoczne oceny osoby (wszystkie jej cykle) z datą, arkuszem, średnią, poziomem, wynikiem, wersją reguł i datą zapoznania albo wpisem o fikcji.

**Contract**: `cycleState(cycleId): { step, text, deadline?: { date, basis: string[] }, since? }`, `step` jak w tabeli; `assessmentHistory(personId): { cycleId, approvedOn, sheet, mean, overallLevel, outcome, acknowledgedOn, fiction: boolean, rulesVersion }[]` (od najnowszej).

#### 3. Dane pokazowe

**File**: `src/seed/assessments.ts`, `src/db.ts` (kolumna `people.appointed_year`), `src/seed.ts` (jedno wywołanie modułu w `runSeed(db, options)` po `notes`)

**Intent**: Każda ocena w danych jest pełnym łańcuchem zdarzeń z datami: `cycle_started`, `part1_submitted` (z kryteriami w `cycle_criteria`), `part1_confirmed`, `assessment_approved` z kompletną migawką złożoną przez `buildAssessmentSnapshot(cycleId, draft, { asOf })` z S-02 (moduł danych nie składa migawki własnym kodem), `assessment_acknowledged` (uwaga 10). Część I wgrywanych cykli historycznych zapisuje `savePart1(cycleId, actorId, input, date)` z S-01 z jawnym aktorem (oceniającym cyklu) i historyczną datą; `part1_confirmed` i pozostałe zdarzenia zapisuje `seedEvent(...)` z jawną datą, więc odsłaniają się przy przesuwaniu daty (decyzja 10i). Każde wgrywane `cycle_started` ma wszystkie pięć pól `{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`.

Moduł buduje łańcuchy historyczne przy dacie systemowej `2024-12-09`, czyli zanim data dojdzie do ich zdarzeń. Dlatego sprawdzanie i składanie migawek używa jawnej daty:

- Żadna osoba nie ma `assessment_approved` bez części I: moduł przerywa seed z komunikatem, jeśli `visibleEvents(cycleId, { asOf: data zatwierdzenia })` nie zawiera `part1_confirmed`.
- Migawkę składa jedna funkcja pomocnicza w module z `computeAssessment(scores)`, `mandatoryCriteria(sheet)` i `criterion(id)`: `sheet` z `cycles.sheet`, `periodFrom = cycles.period_start`, `periodTo` = data zatwierdzenia, `deadline = effectiveDeadline(cycleId, { asOf: data zatwierdzenia })`, `grade` i `gradeAwardedOn` = `people.civil_service_grade` i `people.grade_awarded_on` (w danych nie ma wcześniejszego `mandatory_grade_awarded`; dla osoby bez stopnia oba `null`), `rulesVersion` z `rulesVersion()`, `confirmation` z `setting("office_city")`, datą zatwierdzenia i nazwiskiem oceniającego.
- `objectionDeadline` w `assessment_acknowledged` = `objectionDeadline(data zapoznania)`.

Treść uzasadnień i wniosków pisze agent przy budowie (decyzja 10e).

| Osoba | Co wgrać | Daty |
|---|---|---|
| Tomasz (arkusz B, oceniająca Anna) | `appointed_year = 2016` w jego wierszu `people` (stopień V, `grade_awarded_on = 2022-12-01` i `appointed = 1` są z `base.ts`) | — |
| Tomasz, poprzedni cykl | nowy wiersz `cycles` (`period_start = 2022-11-14`, arkusz B, oceniająca Anna) i łańcuch: `cycle_started` 2022-11-14 (`reason: "previous_assessment"`, `periodStart: "2022-11-14"`, `previousAssessmentOn: "2022-11-14"`, `previousAcknowledgedOn: "2022-11-14"`, `previousOutcome: "positive"`), część I przez `savePart1` z datą 2022-12-05, `part1_confirmed` 2022-12-06, `assessment_approved` 2024-11-12 (oceny 7, 7, 9, 7, 7; średnia 7,4; „powyżej oczekiwań”; pozytywna; `grade: 5`, `gradeAwardedOn: "2022-12-01"`; `gradeRequest.attached: false`), `assessment_acknowledged` 2024-11-12 | widoczne od startu pokazu |
| Tomasz, bieżący cykl | do łańcucha z `base.ts` i `part1.ts` (cykl od 2024-11-12, część I 02.12.2024 / 03.12.2024): `assessment_approved` 2026-11-12 (oceny 7, 9, 7, 7, 7; średnia 7,4; „powyżej oczekiwań”; pozytywna; `grade: 5`, `gradeAwardedOn: "2022-12-01"`; `gradeRequest.attached: false`; wnioski rozwojowe wpisane), `assessment_acknowledged` 2026-11-12 | odsłania się 12.11.2026; termin stopnia 14.12.2026 |
| Katarzyna Lewandowska (osoba bez konta z `base.ts`, podwładna Anny; arkusz C, oceniająca Anna) | nowy wiersz `cycles` (`period_start = 2024-11-18`) i łańcuch: `cycle_started` 2024-11-18 (`reason: "previous_assessment"`, `periodStart: "2024-11-18"`, `previousAssessmentOn: "2024-11-18"`, `previousAcknowledgedOn: "2024-11-18"`, `previousOutcome: "positive"`), część I przez `savePart1` z datą 2024-11-25, `part1_confirmed` 2024-11-26, `assessment_approved` 2026-11-16 (pozytywna, „na poziomie oczekiwań”, `grade: null`, `gradeAwardedOn: null`), `assessment_acknowledged` 2026-11-17 (sprzeciw do 24.11.2026), `objection_filed` 2026-11-20 (`to: "dyrektor generalny urzędu"`) | cykl widoczny od 18.11.2024; sprzeciw od 20.11.2026, rozpatrzenie do 04.12.2026 |
| Anna (arkusz B, oceniający dyrektor generalny) | nowy wiersz `cycles` (`period_start = 2024-12-16`) i łańcuch: `cycle_started` 2024-12-16 (`reason: "previous_assessment"`, `periodStart: "2024-12-16"`, `previousAssessmentOn: "2024-12-16"`, `previousAcknowledgedOn: "2024-12-16"`, `previousOutcome: "positive"`), część I przez `savePart1` z aktorem dyrektor generalny i datą 2025-01-14, `part1_confirmed` 2025-01-15, `due_change_requested` 2026-10-05 (`requestedDate`, `reason` z listy art. 81 ust. 8, bez danych o zdrowiu) | cykl widoczny od 16.12.2024; wniosek od 05.10.2026 |

Daty Katarzyny są dobrane tak, żeby jej część I była potwierdzona przed krokiem 1 (09.12.2024), a ocena zatwierdzona przed terminem z `effectiveDeadline` (18.11.2026). Maria nie dostaje żadnego cyklu.

Stan „fikcja zapoznania” nie jest wgrywany: powstaje na żywo w osobnym przebiegu wersji 5-minutowej (S-02, `demo.md`). Stan „część I czeka” daje cykl Piotra w kroku 1 między przekazaniem a potwierdzeniem. Testy obu stanów dopisują zdarzenia przez `seedEvent` w teście.

**Contract**: `bun run seed` kończy się bez błędu; po seedzie przy dacie 2026-11-22 `mandatoryGrade` dla Tomasza zwraca `dueOn: "2026-12-14"`, `fromGrade: 5`, `toGrade: 6`.

#### 4. Ekran kadr: karta stopnia i tabela stanów

**File**: `src/routes/hr.tsx`, `src/views/hr-overview.tsx`, `src/index.tsx` (dopisany import i montowanie tras `/hr`, `sheet`, `history` i tras `POST` tego plastra), `src/hr/links.ts` (rejestracja w `registerHomeTasks` i `registerCycleLinks`)

**Intent**: Ekran Joanny na wspólnym układzie. Od góry: karta obowiązku stopnia (jedna na osobę, której się należy), tabela cykli (najnowszy widoczny cykl każdej osoby, sortowana po terminie rosnąco, bez sortowania po wyniku), w fazie 2 blok statystyk.

Karta stopnia (uwaga 18): nagłówek „Obowiązek urzędu: stopień służbowy z mocy prawa”; osobne pole „Urzędnik” z imieniem i nazwiskiem; treść „Urząd ma obowiązek przyznać kolejny stopień służbowy, bo od ostatniego stopnia są dwie kolejne oceny pozytywne na jednym z dwóch najwyższych poziomów: 12.11.2024 i 12.11.2026” (bez nazw poziomów); „Przyznać do 14.12.2026: 30 dni od zapoznania z oceną 12.11.2026, koniec w sobotę 12.12.2026, więc poniedziałek (art. 89 ust. 2 ustawy)”; „Stopień V → VI”; „To obowiązek, nie wniosek”. Nic nie stoi „przy nazwisku”: nazwisko jest wartością pola, a obowiązek dotyczy urzędu.

Wiersz tabeli: imię i nazwisko, oceniający, arkusz, tekst stanu, termin z podstawą (dla cyklu otwartego z `effectiveDeadline(cycleId)`) i odnośniki z `cycleLinks(cycle, viewer)`. Widok nie wpisuje na sztywno żadnego odnośnika do trasy innego plastra: część I (S-01), ocena (S-02) i „Wpisz nieobecność” (S-03) pojawiają się w wierszu tylko wtedy, gdy ich plastry zarejestrują je dla kadr.

Odnośniki (uwaga 4): `registerCycleLinks` dodaje „Arkusz” i „Historia ocen” według uprawnień ich tras `GET` (opis w „Co ten plaster udostępnia”); te same odnośniki widać na ekranie wejściowym cyklu `GET /cycles/:id/part1` i w wierszach `/hr`. `registerHomeTasks` dodaje Joannie pozycję „Stan cykli” prowadzącą do `/hr`.

Nowe komponenty UI (wygląd z design systemu autora, decyzja 10b): `ReminderCard` (karta przypomnienia z polami, terminem i podstawą), `CycleStateTable` (tabela stanów). Jeśli design system ma odpowiedniki (karta, tabela), używasz ich zamiast nowych.

**Contract**: `GET /hr` → 200 dla `role = 'hr'`; 403 z krótkim komunikatem „Ten ekran widzą kadry.” dla pozostałych; bez konta przekierowanie na `/account`.

#### 5. Dane i widok arkusza, druk własnego egzemplarza

**File**: `src/hr/sheet-data.ts`, `src/routes/sheet.tsx`, `src/views/sheet.tsx`

**Intent**: Podgląd arkusza w dowolnym kroku cyklu: pola jeszcze niewypełnione pokazują „—”. Dane tylko z widocznych zdarzeń: część I z migawki `part1_submitted` i `part1_confirmed`, ocena z migawki `assessment_approved`, zapoznanie albo fikcja z ich payloadów. Kolejność pól według wzoru z zał. 2–4 do rozporządzenia (nagłówki części i nazwy pól po polsku):

1. **Część I.** Nazwa urzędu (`settings.office_name`). Oceniany: imię i nazwisko, stanowisko (`people.position_title`), komórka organizacyjna (`people.unit`; B i C). Oceniający: imię i nazwisko (`part1_submitted.payload.appraiserName`), stanowisko, komórka organizacyjna (B i C). Kryteria obowiązkowe (lista arkusza). Kryteria dodatkowe (0–3, nazwy, oczekiwanie). Termin sporządzenia oceny: `part1_submitted.payload.dueDate` z `dueDateBasis` (termin przekazany w części I). Pod spodem, gdy data jest inna niż przekazana: w cyklu otwartym „Termin bieżący: DD.MM.RRRR (podstawa)” z `effectiveDeadline(cycleId)`, a po zatwierdzeniu „Termin w dniu zatwierdzenia: DD.MM.RRRR (podstawa)” z `AssessmentSnapshot.deadline`. Oświadczenie o rozmowie z § 5 ust. 1 i zapoznaniu z kryteriami i terminem. Potwierdzenie oceniającego (`place`, data `part1_submitted`, `appraiserName`), potwierdzenie ocenianego (`place`, data `part1_confirmed`, `appraiseeName`).
2. **Część II.** Data rozmowy oceniającej (`interviewDate`). Okres podlegania ocenie od `periodFrom` (= `cycles.period_start`; przed zatwierdzeniem wprost z `cycles.period_start`) do `periodTo`. Macierz ocen cząstkowych: wiersz na kryterium obowiązkowe, potem dodatkowe; kolumny 1, 3, 5, 7, 9 z nazwami skali; „X” w wybranej. Średnia (bez zaokrąglania w obliczeniu, wyświetlana z dwoma miejscami). Ogólny poziom: pięć przedziałów, „X” przy wyliczonym. Ocena okresowa: POZYTYWNA albo NEGATYWNA, „X”.
3. **Dalsza część.** Uzasadnienie przyznanej oceny. Wnioski do indywidualnego programu rozwoju zawodowego. Dane poprzedniej oceny (tylko urzędnik mianowany; z `assessmentHistory`: wynik, poziom, data, albo „brak w systemie”). Czy dołączono wniosek o kolejny stopień: TAK / NIE / NIE DOTYCZY (NIE DOTYCZY dla `appointed = 0`). Dane oceniającego. Potwierdzenie oceniającego (`confirmation`). Potwierdzenie ocenianego (rozmowa oceniająca, zapoznanie z oceną i wnioskami; z `assessment_acknowledged`) albo wpis o fikcji zapoznania: „Stwierdzono fikcję zapoznania DD.MM.RRRR: oceniany nie mógł / nie chciał potwierdzić. Kopię arkusza doręczono osobiście / pocztą / pocztą elektroniczną DD.MM.RRRR. Wpis oceniającego: imię i nazwisko” (decyzja 11a). **Pouczenie**: „Od oceny przysługuje sprzeciw do dyrektora generalnego urzędu w terminie 7 dni od dnia zapoznania się z oceną (art. 83 ust. 1 ustawy)”; dla arkusza A adresatem jest kierownik urzędu. Pouczenie jest zawsze w HTML i na wydruku (nie ma klasy `no-print`).
4. **Część III** (faza 2, zmiana 2).

Blok potwierdzenia ma postać „Potwierdzenie w systemie: <miejscowość>, <DD.MM.RRRR>, <imię i nazwisko>”. Tam, gdzie wzór ma „podpis”, stoi „Potwierdzenie w systemie”; słowo „podpis” nie pojawia się nigdzie w HTML. Pod arkuszem stopka: „Arkusz <A/B/C> · wersja reguł <rulesVersion cyklu> · stan na DD.MM.RRRR · potwierdzenia złożono w systemie mOcena”. Na stronie dwa przyciski (klasa `no-print`): „Drukuj / pobierz PDF” (`onclick="window.print()"`) i „Drukuj część I” (prowadzi do `?part=1`, gdzie strona zawiera tylko część I, stopkę i ten sam przycisk druku), oraz jedno zdanie pod nimi: „Zapis do PDF wybierasz w oknie druku”.

Uprawnienia: `canViewSheet` przepuszcza ocenianego (`cycles.person_id`), oceniającego cyklu (`cycles.appraiser_id`) i rolę `hr` (Access Control); pozostali 403. Oceniany drukuje własny egzemplarz części I i całego arkusza tymi samymi przyciskami. Na arkusz nie trafia nic z tabel `notes` ani `feedback_messages`.

Nowe komponenty UI: `SheetField` (etykieta i wartość, „—” gdy puste), `ScoreMatrix` (macierz z „X”), `PrintButton`. Blok potwierdzenia i wpis o fikcji to `ConfirmationBlock` z `src/views/components.tsx` (tworzy go S-01, wariant fikcji dopisuje S-02); S-06 tylko go używa i niczego w nim nie zmienia.

**Contract**: `sheetData(cycleId, options?: { part: 1 }): SheetData` (drugi argument opcjonalny; wszystkie pola powyżej w tej kolejności, puste jako `null`; termin według tabeli kontraktu „Skąd ekran bierze termin oceny”); `canViewSheet(viewer, cycle): boolean`; `GET /cycles/:id/sheet` i `GET /cycles/:id/sheet?part=1` → 200 / 403 / 404 (cykl bez widocznego `cycle_started` → 404).

#### 6. Styl druku

**File**: `public/print.css` (nowy), `src/views/layout.tsx` (dopisana jedna linia `<link rel="stylesheet" href="/print.css" media="print">`, bez zmiany istniejących właściwości układu)

**Intent**: Wydruk arkusza czytelny na A4, bez elementów aplikacji. Reguły:

- `@page { size: A4 portrait; margin: 15mm 15mm 18mm; }`
- Ukryte: nagłówek aplikacji, nawigacja, przełącznik daty systemowej, wybór konta, przyciski, formularze, elementy z klasą `.no-print`.
- Tekst czarny na białym, `font-size: 10.5pt`, `line-height: 1.35`; bez cieni i teł; linki bez podkreślenia i bez dopisywania adresu.
- Każda część arkusza (`.sheet-part`) od nowej strony z wyjątkiem pierwszej (`break-before: page`), jak we wzorze: część I, część II, dalsza część, część III.
- `break-inside: avoid` dla macierzy ocen, bloków potwierdzeń, pouczenia i pojedynczego pola; `break-after: avoid` dla nagłówków.
- Macierz i przedziały: obramowanie `0.5pt solid #000`, „X” wyśrodkowany.
- Stopka arkusza (`.print-footer`, `position: fixed; bottom: 0`) powtarza się na każdej stronie.
- Druk z innego ekranu (np. `/hr`) też ukrywa nawigację i przyciski; nie projektujemy dla niego osobnego układu.

**Contract**: plik serwowany lokalnie z `public/` przez `serveStatic` (kontrakt F-01, „Uruchomienie”).

#### 7. Historia ocen

**File**: `src/routes/history.tsx`, `src/views/history.tsx`

**Intent**: Lista zatwierdzonych i widocznych ocen osoby od najnowszej: data, arkusz, wynik, poziom, średnia, data zapoznania (albo wpis o fikcji), wersja reguł, odnośnik „Arkusz”. Widzą: sama osoba, oceniający któregokolwiek jej cyklu (`cycles.appraiser_id`), rola `hr` (FR-031, Access Control). Pusta historia: „Brak ocen w systemie”.

Nowy komponent UI: `HistoryList`.

**Contract**: `GET /people/:id/history` → 200 / 403 / 404.

### Success Criteria:

#### Automated Verification:

- Testy reguły stopnia przechodzą: `bun test src/engine/grades.test.ts`
- Testy stanu cyklu i widoczności przechodzą: `bun test src/hr/cycle-state.test.ts`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Testy ekranu kadr, arkusza, druku i historii przechodzą: `bun test src/routes/hr.test.ts src/routes/sheet.test.ts src/routes/history.test.ts`
- Test przejścia z `/hr` do arkuszy wgranych osób przechodzi: `bun test src/routes/hr-sheets.test.ts`

#### Manual Verification:

- Pełny przebieg pokazu do kroku 5 (data 2026-11-22): `/hr` pokazuje kartę Tomasza z terminem 14.12.2026, sprzeciw Katarzyny Lewandowskiej z rozpatrzeniem do 04.12.2026, wniosek Anny z podstawą i zdaniem o zawiadomieniu oraz zapoznanie Piotra z sprzeciwem do 30.11.2026
- Podgląd wydruku w przeglądarce (Chrome, A4) arkusza Piotra po potwierdzeniu zapoznania, z konta Piotra: bez nawigacji i przycisków, części od nowej strony, macierz nie łamie się między stronami, pouczenie o sprzeciwie jest, nigdzie słowo „podpis”
- Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024

## Phase 2: Po wersji minimalnej

Budowane w kolejności listy „Kolejność cięcia”; tniemy od dołu tej listy.

### Changes Required:

#### 1. Odnotowanie przyznania stopnia (pozycja 1 listy cięcia, potrzebne do wersji 5-minutowej pokazu)

**File**: `src/routes/hr.tsx`

**Intent**: Przycisk „Odnotuj przyznanie stopnia” na karcie (nie przy stopniu równym `approval.gradeRequest.maxGrade`). Zapis tylko po kliknięciu człowieka (zasada 7). Zdarzenie dostaje datę `today()`, `cycle_id` drugiej oceny z pary i aktora z kadr. Po zapisie karta znika, bo `currentGrade` zwraca nowy stopień z datą dzisiejszą, a reguła liczy oceny od niej; S-02 widzi ten sam nowy stopień. Ponowne kliknięcie (druga wysyłka formularza) nie tworzy drugiego zdarzenia: serwer sprawdza `mandatoryGrade` przed zapisem.

**Contract**: `POST /hr/grades/:personId` → `recordEvent("mandatory_grade_awarded", cycleId, actorId, { personId, fromGrade, toGrade, basis: "art. 89 ust. 2 ustawy" })`, przekierowanie 303 na `/hr`. Tylko `role = 'hr'` (inni 403). Brak obowiązku albo stopień najwyższy → 409 bez zapisu.

#### 2. Poprzednie oceny Piotra i Ewy oraz część III arkusza (pozycje 2 i 3 listy cięcia)

**File**: `src/hr/sheet-data.ts`, `src/views/sheet.tsx`, `src/seed/assessments.ts`

**Intent**: Poprzednie oceny Piotra (zatwierdzona i potwierdzona 27.11.2024) i Ewy (20.11.2024) jako pełne łańcuchy w zamkniętych cyklach (nowe wiersze `cycles` z `period_start` 24 miesiące wcześniej, część I przez `savePart1` w pierwszych 30 dniach, pozytywne, „na poziomie oczekiwań”, `grade` i `gradeAwardedOn` w migawce `null`), widoczne od startu pokazu; daty zgodne z `previousAssessmentOn` i `previousAcknowledgedOn` w `cycle_started` z `base.ts`. Każde z tych `cycle_started` ma pięć pól (`reason: "previous_assessment"`, `periodStart` = `period_start`, `previousAssessmentOn` i `previousAcknowledgedOn` = `period_start`, `previousOutcome: "positive"`); sprawdzanie i migawki jak w fazie 1, zmiana 3 (`asOf`).

Część III (tylko `appointed = 1` i `gradeRequest.attached`): imię i nazwisko, rok mianowania (`people.appointed_year`), posiadany stopień i data jego przyznania z migawki (`grade`, `gradeAwardedOn`, czyli stan z dnia zatwierdzenia, nie dzisiejszy `currentGrade`), zdanie wniosku z art. 89 ust. 1 ustawy, umotywowanie, potwierdzenie oceniającego.

**Contract**: część III w HTML tylko przy `gradeRequest.attached`; `assessmentHistory` Piotra przy 2024-12-09 zwraca jedną ocenę z 27.11.2024.

#### 3. Statystyki bez nazwisk (pozycja 4 listy cięcia)

**File**: `src/hr/stats.ts`, `src/views/hr-overview.tsx`

**Intent**: Blok z nagłówkiem „Statystyki terminowości (widok dyrektora generalnego, bez nazwisk)”: liczba cykli w każdym kroku, oceny zatwierdzone w terminie i po terminie (data `assessment_approved` względem `AssessmentSnapshot.deadline.date`), cykle otwarte po terminie bez oceny (`today()` względem `effectiveDeadline(cycleId).date`). Dla całego urzędu, bez podziału na komórki i bez nazwisk; tylko widoczne zdarzenia. Nowy komponent UI `StatsBlock` (albo odpowiednik z design systemu).

**Contract**: `officeStats(): { byStep: Record<step, number>, onTime: number, late: number, overdueOpen: number }`.

#### 4. Odnotowanie rozstrzygnięcia sprzeciwu (pozycja 5 listy cięcia)

**File**: `src/routes/hr.tsx`

**Intent**: Przy stanie `objection_filed` trzy przyciski: „Uwzględniony: zmiana oceny”, „Uwzględniony: ponowne sporządzenie oceny”, „Nieuwzględniony”. To stan uproszczony z decyzji 4 (FR-028); system nie prowadzi dalszego obiegu.

**Contract**: `POST /cycles/:id/objection-outcome` z polem `outcome` ∈ `changed` | `redone` | `rejected` → `recordEvent("objection_resolved", cycleId, actorId, { outcome })`, 303 na `/hr`. Tylko `role = 'hr'` (inni 403); inna wartość `outcome` → 422 bez zapisu; cykl bez widocznego `objection_filed` albo z już widocznym `objection_resolved` → 409.

### Success Criteria:

#### Automated Verification:

- Testy przycisków, części III, statystyk i poprzednich ocen przechodzą: `bun test src/routes/hr-actions.test.ts`
- Cały zestaw testów przechodzi: `bun test`

#### Manual Verification:

- Wersja 5-minutowa przy dacie 2026-11-22: kliknięcie „Odnotuj przyznanie stopnia” usuwa kartę Tomasza, a historia i arkusz nadal się otwierają

## Testing Strategy

Testy obok kodu, trasy przez `app.request()` na `createTestApp({ today, seedOptions })` (baza w pamięci z wgranymi przez `runSeed` danymi i datą systemową).

**Faza 1**

- `src/engine/grades.test.ts`: przypadek Tomasza (zapoznanie 2026-11-12 → `dueOn` 2026-12-14, przeniesienie z soboty 12.12.2026); wysoka ocena negatywna (poziom „powyżej oczekiwań”, `outcome: "negative"`) nie tworzy pary; ocena pośrodku (wysoka, „na poziomie”, wysoka) → `null`; brak zapoznania z drugą oceną → `null`, po dopisaniu zapoznania → obowiązek; fikcja zapoznania liczy się jak zapoznanie (data wpisu); późniejsza ocena „na poziomie” po powstałym obowiązku go nie kasuje; pracownik niemianowany → `null`; ocena sprzed bieżącego stopnia się nie liczy; stopień IX → `atMaxGrade: true`, `toGrade: null`; po `mandatory_grade_awarded` → `null` (przez `currentGrade`).
- `src/hr/cycle-state.test.ts`: każdy `step` z tabeli; `criteria_due` przy poprzedniej ocenie pozytywnej daje 30 dni, przy negatywnej 7 dni (wartość z `criteriaTalkDeadline`, różne daty sporządzenia i zapoznania); `in_period` pokazuje datę i podstawę z `effectiveDeadline`; „część I czeka od X dni” liczy dni od `part1_submitted`; stan fikcji ma sposób i datę doręczenia; widoczność (uwaga 11) dzień przed, w dniu i po zdarzeniu: cykl Anny przy 2024-12-15 / 2024-12-16 / 2024-12-17, sprzeciw Katarzyny Lewandowskiej przy 2026-11-19 / 2026-11-20 / 2026-11-21, historia Tomasza (1 / 2 / 2 oceny) i karta stopnia (brak / jest / jest) przy 2026-11-11 / 2026-11-12 / 2026-11-13.
- `src/routes/hr.test.ts`: Joanna przy 2026-11-22 widzi pole „Urzędnik” z „Tomasz Kamiński”, nagłówek „Obowiązek urzędu”, „14.12.2026” i „art. 89 ust. 2”; widzi stan sprzeciwu Katarzyny Lewandowskiej z „04.12.2026” i wniosek Anny z „art. 81 ust. 8” i zdaniem „zawiadamia pracownika pisemnie”; ekran startowy Joanny ma odnośnik do `/hr`; każdy wiersz ma odnośniki tego plastra „Arkusz” (`/cycles/:id/sheet`) i „Historia ocen” (`/people/:id/history`); test nie sprawdza odnośników innych plastrów, więc przechodzi z widokiem kadr części I z S-01 i bez niego; ekran `/cycles/:id/part1` cyklu Tomasza otwarty z konta Tomasza ma odnośniki „Arkusz” i „Historia ocen”; Piotr dostaje 403 na `/hr`; HTML `/hr` nie zawiera nazw poziomów („powyżej oczekiwań” itd.) ani słów „pozytywna”/„negatywna”.
- `src/routes/sheet.test.ts`: Piotr otwiera własny arkusz i `?part=1` (200; w `?part=1` jest „Część I” i nie ma „Część II”); Ewa dostaje 403 na arkusz Piotra, Joanna 200, Marek 200; kolejność w HTML: „Część I” < „Część II” < „Uzasadnienie” < „Wnioski do indywidualnego programu” < „Pouczenie”; pouczenie zawiera „7 dni” i „art. 83 ust. 1” i nie jest w elemencie `no-print`; HTML nie zawiera „podpis” (bez względu na wielkość liter); zatwierdzony tekst uzasadnienia z migawki jest na arkuszu (po „Wstaw” może być równy tekstowi notatki i to jest dozwolone), a test zabrania tylko tekstu notatki, którego nie ma w migawce; termin oceny zatwierdzonej na arkuszu pochodzi z `AssessmentSnapshot.deadline`; przy fikcji zapoznania jest wpis „nie mógł” albo „nie chciał” ze sposobem i datą doręczenia; okres od = `cycles.period_start` (Piotr: 27.11.2024, nie 09.12.2024).
- `src/routes/history.test.ts`: Tomasz przy 2026-11-22 widzi 2 oceny, przy 2026-01-01 jedną; Anna widzi historię Tomasza; Ewa dostaje 403 na historię Piotra.
- `src/routes/hr-sheets.test.ts` (uwaga 10): przy 2026-11-22 Joanna otwiera `/hr`, z HTML bierze odnośniki „Arkusz” Tomasza, Katarzyny Lewandowskiej i Anny oraz z historii Tomasza odnośnik do arkusza z 12.11.2024, otwiera każdy (200) i sprawdza: potwierdzenia części I oceniającego i ocenianego (nazwiska z `appraiserName` i `appraiseeName`); u Tomasza (obie oceny) i Katarzyny Lewandowskiej potwierdzenie oceniającego w części II i potwierdzenie zapoznania; u Tomasza z 12.11.2026 „Dane poprzedniej oceny” z datą 12.11.2024; u Tomasza z 12.11.2024 „brak w systemie”; u Anny część II pusta („—”). Osobno: w danych nie ma cyklu z `assessment_approved` bez `part1_confirmed`; każde wgrane `cycle_started` ma pięć pól; każda wgrana migawka ma `deadline`, `grade` i `gradeAwardedOn`; Maria nie ma żadnego cyklu.

**Faza 2**

- `src/routes/hr-actions.test.ts`: `POST /hr/grades/:id` przez Joannę → 303 na `/hr`, jedno `mandatory_grade_awarded` z payloadem `{ personId, fromGrade: 5, toGrade: 6, basis: "art. 89 ust. 2 ustawy" }` i karta znika; drugie kliknięcie → 409 i nadal jedno zdarzenie; po przyznaniu `currentGrade` Tomasza to 6 (to samo widzi S-02); Piotr → 403; `POST /cycles/:id/objection-outcome` z nieznaną wartością → 422 bez zapisu, z `rejected` → 303 i stan „sprzeciw nieuwzględniony”, powtórzenie → 409; blok statystyk nie zawiera żadnego nazwiska z danych i liczy terminowość z `AssessmentSnapshot.deadline`; część III tylko przy `gradeRequest.attached` i ze stopniem i datą z migawki; historia Piotra przy 2024-12-09 ma ocenę z 27.11.2024.

## Open questions

Każde ma domyślne rozstrzygnięcie, z którym implementacja idzie dalej.

1. **„Na jednym z dwóch najwyższych poziomów”** (art. 89 ust. 2): obie oceny na tym samym poziomie czy każda na którymkolwiek z dwóch? Domyślnie: każda na którymkolwiek z dwóch najwyższych. Tomasz ma dwa razy „powyżej oczekiwań”, więc pokaz działa przy obu odczytaniach.
2. **Termin 30 dni w sobotę lub dzień wolny.** Domyślnie przechodzi na następny dzień roboczy, jak pozostałe terminy w silniku (14.12.2026 zamiast 12.12.2026). Karta podaje oba fakty.
3. **Data ostatniego stopnia i rok mianowania Tomasza** nie są w `demo.md`. Domyślnie: stopień V przyznany 01.12.2022, mianowany w 2016 roku (dane pokazowe, decyzja 10e). Stopień V pochodzi z `base.ts` (F-01).
4. **Poprzednie oceny Piotra i Ewy** (27.11.2024 i 20.11.2024): `demo.md` podaje tylko daty. Domyślnie: pozytywne, „na poziomie oczekiwań”.
5. **Powód wniosku Anny o zmianę terminu.** Domyślnie jeden z czterech powodów z art. 81 ust. 8 ustawy, wybrany przy budowie po sprawdzeniu brzmienia przepisu w bazie wiedzy; bez danych o zdrowiu.

## References

- `context/changes/rules-engine-and-demo-data/plan.md`, rozdział „Kontrakt wspólny dla wszystkich plastrów”
- `context/foundation/decisions.md` (decyzje 4, 5b, 7, 10d, 10e, 10g, 10h, 10i, 11a, 11b, 11d)
- `context/foundation/prd.md` (FR-013, FR-026–FR-031, Access Control, Non-Goals)
- `context/foundation/roadmap.md` (S-06, „Parked”)
- `context/foundation/demo.md` (krok 5, „Ustalenia do scenariusza”, daty Tomasza, osoby)
- Rozporządzenie Prezesa Rady Ministrów z 4.04.2016 (Dz.U. 2016 poz. 470): § 7, § 8, § 12 ust. 2, zał. 2–4 (wzory arkuszy A, B, C)
- Ustawa o służbie cywilnej: art. 81 ust. 4 i 8, art. 83 ust. 1 i 3, art. 89 ust. 1 i 2

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wersja minimalna

#### Automated

- [ ] 1.1 Testy reguły stopnia przechodzą: `bun test src/engine/grades.test.ts`
- [ ] 1.2 Testy stanu cyklu i widoczności przechodzą: `bun test src/hr/cycle-state.test.ts`
- [ ] 1.3 Dane pokazowe wgrywają się bez błędu: `bun run seed`
- [ ] 1.4 Testy ekranu kadr, arkusza, druku i historii przechodzą: `bun test src/routes/hr.test.ts src/routes/sheet.test.ts src/routes/history.test.ts`
- [ ] 1.5 Test przejścia z `/hr` do arkuszy wgranych osób przechodzi: `bun test src/routes/hr-sheets.test.ts`

#### Manual

- [ ] 1.6 Pełny przebieg do kroku 5 (2026-11-22): `/hr` pokazuje kartę Tomasza (14.12.2026), sprzeciw Katarzyny Lewandowskiej (04.12.2026), wniosek Anny i zapoznanie Piotra (sprzeciw do 30.11.2026)
- [ ] 1.7 Podgląd wydruku arkusza Piotra z jego konta: bez nawigacji i przycisków, części od nowej strony, macierz w całości, pouczenie o sprzeciwie, bez słowa „podpis”
- [ ] 1.8 Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024

### Phase 2: Po wersji minimalnej

#### Automated

- [ ] 2.1 Testy przycisków, części III, statystyk i poprzednich ocen przechodzą: `bun test src/routes/hr-actions.test.ts`
- [ ] 2.2 Cały zestaw testów przechodzi: `bun test`

#### Manual

- [ ] 2.3 Wersja 5-minutowa przy 2026-11-22: „Odnotuj przyznanie stopnia” usuwa kartę Tomasza, historia i arkusz nadal się otwierają
