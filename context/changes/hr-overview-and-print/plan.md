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
2. Tabelę cykli: osoba, oceniający, arkusz, stan procesu, termin z podstawą, odnośniki do cyklu („Część I”), arkusza i historii ocen. Wśród stanów: „sprzeciw wniesiony 20.11.2026, rozpatrzenie do 04.12.2026” (Maria), „wniosek ocenianej o zmianę terminu czeka na rozpatrzenie” z podstawą i zdaniem o zawiadomieniu na piśmie (Anna, decyzja 11d), „zapoznanie potwierdzone 22.11.2026, sprzeciw do 30.11.2026” (Piotr po kroku 5).
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
- Osi czasu, nieobecności i zmiany oceniającego (S-03). Termin w tabeli i na arkuszu czyta `effectiveDeadline(cycleId)`; S-03 dokłada w niej nieobecności i ekran kadr pokaże nowy termin bez zmian w tym plastrze.
- Wyszukiwania, filtrów i sortowania po wyniku (decyzja 4: lista bez wyszukiwania). Sortujemy tylko po terminie.
- Przypomnienia o stopniu na ekranie oceniającej (Anny). FR-027 dotyczy kadr; reguła jest gotowa do użycia później.
- Stylów ekranu. Wygląd i komponenty pochodzą z design systemu autora (decyzja 10b); plan wymienia tylko ekrany i komponenty. Styl druku jest częścią tego planu.

## Implementation Approach

Trzy warstwy, jak w poprzednich plastrach:

1. **Reguła w silniku** (czysta funkcja, test bez bazy): `src/engine/grades.ts` liczy, czy urzędnikowi mianowanemu należy się stopień z mocy prawa i do kiedy. Liczby (30 dni, dwa najwyższe poziomy, najwyższy stopień) są w pliku reguł, z podstawą.
2. **Odczyt stanu z widocznych zdarzeń** (`src/hr/`): stan procesu cyklu, historia ocen, bieżący stopień, dane arkusza i statystyki. Każdy odczyt idzie przez `visibleEvents(cycleId)` (granica `date <= today()`, porządek `(date, id)`); cykl istnieje dla ekranu od swojego widocznego `cycle_started`, część I pochodzi z migawki `part1_submitted`, ocena z migawki `assessment_approved` (decyzja 10i, uwaga 11).
3. **Trasy i widoki** w Hono JSX na wspólnym układzie `src/views/layout.tsx`, testowane przez `app.request()` na `createTestApp({ today })`.

Stan cyklu to opis kroku procesu („część I czeka na potwierdzenie ocenianego od 12 dni”), a nie etykieta o człowieku. Na ekranie kadr przy nazwisku nie ma wyniku oceny, poziomu, kolorów ani liczb o osobie (zasada 7 z `AGENTS.md`). Karta stopnia ma nazwisko w osobnym polu, a nagłówek i treść mówią o obowiązku urzędu (uwaga 18). Wynik i poziom widać tylko w historii ocen i na arkuszu, czyli w dokumentach, do których dana osoba ma wgląd z Access Control. Test pilnuje, że HTML ekranu `/hr` nie zawiera nazw poziomów ani słów „pozytywna” i „negatywna”.

### Wersja minimalna (faza 1, ok. 50 minut)

Karta stopnia Tomasza, tabela stanów cykli (z sprzeciwem Marii i wnioskiem Anny), podgląd arkusza ze stylem druku i pouczeniem, druk własnego egzemplarza przez ocenianego (część I i cały arkusz), historia ocen, odnośniki (`registerCycleLinks`, wiersze `/hr`, link na ekranie startowym Joanny) oraz dane pokazowe `src/seed/assessments.ts`. To jest krok 5 pokazu w każdej wersji. Historia i odnośniki są w minimum, bo bez nich arkusze i historia są osiągalne tylko przez wpisanie adresu (uwaga 4).

### Kolejność cięcia

Faza 2 powstaje po wersji minimalnej, w kolejności budowy odwrotnej do kolejności cięcia. Gdy brakuje czasu, tniemy od góry:

1. Przyciski rozstrzygnięcia sprzeciwu (faza 2, zmiana 4).
2. Blok statystyk bez nazwisk (faza 2, zmiana 3); zostaje zdanie „Statystyki: poza prototypem”.
3. Część III na arkuszu (faza 2, zmiana 2); zostaje pole „Czy dołączono wniosek o kolejny stopień”.
4. Wgrane poprzednie oceny Piotra i Ewy (faza 2, zmiana 2); historia działa na Tomaszu.
5. Przycisk „Odnotuj przyznanie stopnia” (faza 2, zmiana 1); bez niego wersja 5-minutowa traci kliknięcie stopnia obowiązkowego.

Nie wolno ciąć niczego z wersji minimalnej.

## Założenia wobec wcześniejszych plastrów

Same nazwy z kontraktu wspólnego.

**F-01**

- Tabele: `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade)` z `role = 'hr'` dla Joanny; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings` z kluczami `demo_date`, `office_city`, `office_name`.
- Funkcje: `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(...)` (tylko w danych pokazowych), `visibleEvents(cycleId)`, `effectiveDeadline(cycleId): { date, basis: string[] }` z `src/cycles.ts`, `homeTasks(person)` i `registerHomeTasks(fn)` z `src/home-tasks.ts`, `cycleLinks(cycle, person)` i `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()`, `createTestApp({ today })` z `src/test-helpers.ts`.
- Silnik: `src/engine/deadlines.ts` (`addDays`, `toWorkingDay`, `isDayOff`, `nextAssessmentDeadline`, `criteriaTalkDeadline(from, afterNegative)`, `objectionDeadline`, `objectionReviewDeadline`); `src/engine/scoring.ts` (`computeAssessment(scores)` → `{ mean, overallLevel, outcome, reasons, justificationRequired }`, `mandatoryCriteria(sheet)`, `criterion(id)`); `src/engine/rules.ts` czyta `rules/regulation-2016-470.json`.
- Trasy: `GET /`, `GET/POST /account`, `POST /demo/date`. Pliki z `public/` serwuje `serveStatic`.
- Dane: `src/seed.ts` woła moduły z `src/seed/`. `src/seed/base.ts` wgrywa osoby (w tym dyrektora generalnego urzędu bez konta), datę `2024-12-09`, cykle Piotra, Ewy i Tomasza (bieżący, `period_start = 2024-11-12`) ze zdarzeniami `cycle_started` o payloadzie `{ reason, periodStart, previousAssessmentOn, previousOutcome }`. Tomasz ma w `base.ts` `appointed = 1` i `civil_service_grade = 5` (zob. pytanie otwarte 3).

**S-01**

- Zdarzenia: `part1_submitted { sheet, criteria, dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }` (data zdarzenia = data rozmowy o kryteriach) i `part1_confirmed { place, appraiseeName }`.
- Trasa `GET /cycles/:id/part1` jako ekran wejściowy cyklu, który pokazuje `cycleLinks`. Widok do odczytu dla kadr jest w planie S-01 drugą pozycją do cięcia; jeśli go wycięto (kadry dostają 403), wiersz `/hr` nie pokazuje odnośnika „Część I”, a arkusz (`/cycles/:id/sheet`) zastępuje go jako wejście do cyklu, bo zawiera całą część I.
- `src/seed/part1.ts`: pełna część I bieżącego cyklu Tomasza (przekazana 02.12.2024, potwierdzona 03.12.2024) i cyklu Ewy.

**S-02**

- Zdarzenia: `assessment_approved` z migawką `AssessmentSnapshot` z planu S-02. Ten plaster czyta z niej: `criteria: { id, name, kind, score }[]` w kolejności arkusza, `result` (`mean`, `overallLevel`, `outcome`), `justification`, `developmentConclusions`, `interviewDate`, `gradeRequest: { attached, motivation, targetGrade }`, `periodFrom` (= `cycles.period_start`), `periodTo`, `rulesVersion`, `confirmation: { place, date, name }`. `assessment_acknowledged { place, date, name, objectionDeadline }`; `acknowledgement_fiction { reason, deliveryMethod, deliveredOn, objectionDeadline }` (`reason` ∈ `could_not` | `would_not`, `deliveryMethod` ∈ `in_person` | `post` | `email`).
- `assessmentState(cycleId)` z `src/assessment/state.ts`: `{ stage, draft, snapshot, acknowledgement, fiction, objectionDeadline }`, `stage` ∈ `no_part1` | `draft` | `approved` | `acknowledged` | `fiction`.
- Termin sprzeciwu czytamy z payloadu zdarzenia zapoznania albo fikcji (`objectionDeadline`), nie liczymy go drugi raz (uwaga 15).

**S-04, S-05**: niczego nie używamy. Wymóg negatywny: tabele `notes` i `feedback_messages` nie trafiają na arkusz ani wydruk.

## Co ten plaster udostępnia

Zgodnie z kontraktem (trasy „Kadry i wydruk”, zdarzenia S-06, rozszerzenia `people`, moduł `src/seed/assessments.ts`):

- Rozszerzenia tabeli: `people.appointed_year`, `people.grade_awarded_on` (stan początkowy stopnia).
- Trasy: `GET /hr`, `GET /cycles/:id/sheet` (z parametrem `?part=1` dla samej części I), `GET /people/:id/history`, `POST /hr/grades/:personId`, `POST /cycles/:id/objection-outcome`.
- Zdarzenia (payloady):
  - `objection_filed { to }` (adresat sprzeciwu, np. „dyrektor generalny urzędu”);
  - `objection_resolved { outcome }`, `outcome` ∈ `changed` | `redone` | `rejected`;
  - `due_change_requested { requestedDate, reason }`, `reason` to jeden z czterech powodów z art. 81 ust. 8 ustawy (lista zamknięta, decyzja 11d);
  - `mandatory_grade_awarded { fromGrade, toGrade, basis }`, `cycle_id` = cykl drugiej oceny z pary, aktor = osoba z kadr.
- Dane pokazowe: `src/seed/assessments.ts` (obie oceny Tomasza jako pełne łańcuchy zdarzeń, przykłady stanów uproszczonych; kształt migawki z S-02).
- Funkcje (nowe nazwy, których kontrakt jeszcze nie wymienia; zob. „Luki kontraktu” w raporcie z dopasowania):
  - `mandatoryGradeDeadline(ackOn): string` w `src/engine/deadlines.ts`;
  - `mandatoryGrade(input, today)` w `src/engine/grades.ts`;
  - `currentGrade(personId): { grade: number | null, awardedOn: string | null }` z `src/people.ts` (kontrakt wspólny, F-01): jedno źródło bieżącego stopnia dla S-02 i S-06; S-06 jej nie tworzy, tylko używa;
  - `cycleState(cycleId)` w `src/hr/cycle-state.ts`, `assessmentHistory(personId)` w `src/hr/history.ts`, `sheetData(cycleId)` i `canViewSheet(viewer, cycle)` w `src/hr/sheet-data.ts`, `officeStats()` w `src/hr/stats.ts`.
- Odnośniki przez `registerCycleLinks`: „Arkusz” (`/cycles/:id/sheet`) i „Historia ocen” (`/people/:personId/history`) dla każdego, kto przechodzi `canViewSheet`. Pozycja „Stan cykli” (`/hr`) przez `registerHomeTasks` dla roli `hr`.
- Plik `public/print.css` (styl druku dla każdego ekranu; S-03 może z niego korzystać przy osi czasu).

## Phase 1: Wersja minimalna

### Changes Required:

#### 1. Reguła stopnia z mocy prawa i bieżący stopień

**File**: `rules/regulation-2016-470.json`, `src/engine/deadlines.ts`, `src/engine/grades.ts`, `src/engine/grades.test.ts`, `src/people.ts` (`currentGrade` z F-01, tylko użycie), miejsce w S-02, które czyta stopień do wniosku (`approvalBlockers`, `gradeRequestOptions`, `gradeRequest.targetGrade`)

**Intent**: Dopisać do pliku reguł w `deadlines`: `mandatoryGradeDays` (`value: 30`, `basis: "art. 89 ust. 2 ustawy"`, `from: "dzień zapoznania się z oceną"`), a w nowym kluczu `serviceGrade`: `topLevels` (lista dwóch najwyższych poziomów ogólnych: „powyżej oczekiwań”, „znacznie powyżej oczekiwań”) i `max: 9`. Wersja pliku reguł zostaje (dodanie stałej nie zmienia liczenia ocen). `mandatoryGradeDeadline` liczy `toWorkingDay(addDays(ackOn, 30))`.

Reguła (uwaga 9):

1. Bieżący stopień i jego data pochodzą z `currentGrade(personId)`: ostatnie widoczne `mandatory_grade_awarded` w cyklach osoby (`toGrade`, data zdarzenia), a gdy go nie ma, `people.civil_service_grade` i `people.grade_awarded_on`.
2. Bierzemy **wszystkie** zatwierdzone i widoczne oceny osoby z datą `assessment_approved` późniejszą niż data bieżącego stopnia, w pełnej chronologii (`(date, id)`), także negatywne i bez zapoznania. Niczego nie odfiltrowujemy przed sprawdzeniem kolejności, żeby nie skleić dwóch ocen rozdzielonych trzecią.
3. Idziemy po kolejnych parach (n, n+1). Para kwalifikuje się, gdy obie oceny mają `outcome = "positive"` i `overallLevel` z `serviceGrade.topLevels`. Wysoki poziom przy ocenie negatywnej się nie liczy.
4. Obowiązek powstaje z pierwszej kwalifikującej się pary, w której druga ocena ma zapoznanie albo fikcję; `dueOn = mandatoryGradeDeadline(data zapoznania albo fikcji drugiej oceny)`. Para bez zapoznania z drugą oceną jeszcze nie daje obowiązku.
5. Późniejsza ocena (także negatywna) nie kasuje obowiązku, który już powstał. Obowiązek wygasa tylko przez `mandatory_grade_awarded` (zmienia się data bieżącego stopnia).
6. Przy bieżącym stopniu równym `max` wynik ma `toGrade: null` i `atMaxGrade: true`; ekran pisze „ma najwyższy stopień, kolejnego nie można przyznać”, bez przycisku.

Jedno źródło stopnia: `currentGrade(personId)` z `src/people.ts` (F-01) zwraca ostatnie widoczne `mandatory_grade_awarded.toGrade` tej osoby z datą zdarzenia, a gdy go nie ma, `people.civil_service_grade`. Ten krok nie pisze drugiej kopii. Zdarzenie `mandatory_grade_awarded` ma w payloadzie `personId` i jest zapisane przy cyklu drugiej oceny z pary.

**Contract**: `mandatoryGradeDeadline(ackOn: string): string`. `mandatoryGrade({ isAppointed, currentGrade, currentGradeOn, assessments: { cycleId, approvedOn, outcome, overallLevel, acknowledgedOn: string | null }[] }, today): null | { dueOn, basis: "art. 89 ust. 2 ustawy", fromGrade, toGrade: number | null, assessmentDates: [string, string], acknowledgedOn, cycleId, overdue: boolean, atMaxGrade: boolean }`. Osoba z `appointed = 0` → `null`. `currentGrade(personId): { grade, awardedOn }`.

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

**File**: `src/seed/assessments.ts`, `src/db.ts` (kolumny `people.appointed_year`, `people.grade_awarded_on`), `src/seed.ts` (wywołanie modułu po `part1.ts`)

**Intent**: Każda ocena w danych jest pełnym łańcuchem zdarzeń z datami: `cycle_started`, `part1_submitted` (z kryteriami w `cycle_criteria`), `part1_confirmed`, `assessment_approved` z kompletną migawką S-02, `assessment_acknowledged` (uwaga 10). Żadna osoba nie ma `assessment_approved` bez części I: moduł przerywa seed z komunikatem, jeśli cykl nie ma widocznego w łańcuchu `part1_confirmed` przed datą zatwierdzenia. Zdarzenia zapisuje `seedEvent(...)` z jawną datą, więc odsłaniają się przy przesuwaniu daty (decyzja 10i). Migawkę składa jedna funkcja pomocnicza w module z `computeAssessment(scores)`, `mandatoryCriteria(sheet)` i `criterion(id)`; `periodFrom = cycles.period_start`, `periodTo` = data zatwierdzenia, `rulesVersion` z `rulesVersion()`, `confirmation` z `settings.office_city`, datą i nazwiskiem oceniającego, `objectionDeadline` = `objectionDeadline(data zapoznania)`. Treść uzasadnień i wniosków pisze agent przy budowie (decyzja 10e).

| Osoba | Co wgrać | Daty |
|---|---|---|
| Tomasz (arkusz B, oceniająca Anna) | `appointed_year = 2016`, `grade_awarded_on = 2022-12-01` (`appointed = 1` i `civil_service_grade = 5` z `base.ts`) | — |
| Tomasz, poprzedni cykl | nowy wiersz `cycles` (`period_start = 2022-11-14`, arkusz B, oceniająca Anna) i łańcuch: `cycle_started` 2022-11-14 (`reason` jak w `base.ts` dla cyklu po poprzedniej ocenie, `previousAssessmentOn = 2022-11-14`, `previousOutcome = "positive"`), `part1_submitted` 2022-12-05, `part1_confirmed` 2022-12-06, `assessment_approved` 2024-11-12 (oceny 7, 7, 9, 7, 7; średnia 7,4; „powyżej oczekiwań”; pozytywna; `gradeRequest.attached: false`), `assessment_acknowledged` 2024-11-12 | widoczne od startu pokazu |
| Tomasz, bieżący cykl | do łańcucha z `base.ts` i `part1.ts` (cykl od 2024-11-12, część I 02.12.2024 / 03.12.2024): `assessment_approved` 2026-11-12 (oceny 7, 9, 7, 7, 7; średnia 7,4; „powyżej oczekiwań”; pozytywna; `gradeRequest.attached: false`; wnioski rozwojowe wpisane), `assessment_acknowledged` 2026-11-12 | odsłania się 12.11.2026; termin stopnia 14.12.2026 |
| Maria (arkusz C, oceniający Marek) | nowy wiersz `cycles` (`period_start = 2024-11-18`) i łańcuch: `cycle_started` 2024-11-18, `part1_submitted` 2024-11-25, `part1_confirmed` 2024-11-26, `assessment_approved` 2026-11-16 (pozytywna, „na poziomie oczekiwań”), `assessment_acknowledged` 2026-11-17 (sprzeciw do 24.11.2026), `objection_filed` 2026-11-20 (`to: "dyrektor generalny urzędu"`) | cykl widoczny od 18.11.2024; sprzeciw od 20.11.2026, rozpatrzenie do 04.12.2026 |
| Anna (arkusz B, oceniający dyrektor generalny) | nowy wiersz `cycles` (`period_start = 2024-12-16`) i łańcuch: `cycle_started` 2024-12-16, `part1_submitted` 2025-01-14, `part1_confirmed` 2025-01-15, `due_change_requested` 2026-10-05 (`requestedDate`, `reason` z listy art. 81 ust. 8, bez danych o zdrowiu) | cykl widoczny od 16.12.2024; wniosek od 05.10.2026 |

Daty Marii są dobrane tak, żeby jej część I była potwierdzona przed krokiem 1 (09.12.2024), a ocena zatwierdzona przed terminem 18.11.2026; w kroku 4 (21.11.2026) Maria nie ma otwartego cyklu, więc zdanie S-05 o Marii i formularz notatki S-04 bez cyklu działają jak w ich planach.

Stan „fikcja zapoznania” nie jest wgrywany: powstaje na żywo w osobnym przebiegu wersji 5-minutowej (S-02, `demo.md`). Stan „część I czeka” daje cykl Piotra w kroku 1 między przekazaniem a potwierdzeniem. Testy obu stanów dopisują zdarzenia przez `seedEvent` w teście.

**Contract**: `bun run seed` kończy się bez błędu; po seedzie przy dacie 2026-11-22 `mandatoryGrade` dla Tomasza zwraca `dueOn: "2026-12-14"`, `fromGrade: 5`, `toGrade: 6`.

#### 4. Ekran kadr: karta stopnia i tabela stanów

**File**: `src/routes/hr.tsx`, `src/views/hr-overview.tsx`, `src/index.tsx` (podpięcie trasy), `src/hr/links.ts` (rejestracja w `registerHomeTasks` i `registerCycleLinks`)

**Intent**: Ekran Joanny na wspólnym układzie. Od góry: karta obowiązku stopnia (jedna na osobę, której się należy), tabela cykli (najnowszy widoczny cykl każdej osoby, sortowana po terminie rosnąco, bez sortowania po wyniku), w fazie 2 blok statystyk.

Karta stopnia (uwaga 18): nagłówek „Obowiązek urzędu: stopień służbowy z mocy prawa”; osobne pole „Urzędnik” z imieniem i nazwiskiem; treść „Urząd ma obowiązek przyznać kolejny stopień służbowy, bo od ostatniego stopnia są dwie kolejne oceny pozytywne na jednym z dwóch najwyższych poziomów: 12.11.2024 i 12.11.2026” (bez nazw poziomów); „Przyznać do 14.12.2026: 30 dni od zapoznania z oceną 12.11.2026, koniec w sobotę 12.12.2026, więc poniedziałek (art. 89 ust. 2 ustawy)”; „Stopień V → VI”; „To obowiązek, nie wniosek”. Nic nie stoi „przy nazwisku”: nazwisko jest wartością pola, a obowiązek dotyczy urzędu.

Wiersz tabeli: imię i nazwisko, oceniający, arkusz, tekst stanu, termin z podstawą, odnośnik „Część I” (`/cycles/:id/part1`, ekran wejściowy cyklu) i odnośniki z `cycleLinks(cycle, joanna)` (arkusz i historia z tego plastra; S-03 dopisze tam swoje przez `registerCycleLinks`, bez zmian w tym widoku).

Odnośniki (uwaga 4): `registerCycleLinks` dodaje „Arkusz” i „Historia ocen” na ekranie wejściowym cyklu `GET /cycles/:id/part1` dla ocenianego, oceniającego i kadr; `registerHomeTasks` dodaje Joannie pozycję „Stan cykli” prowadzącą do `/hr`.

Nowe komponenty UI (wygląd z design systemu autora, decyzja 10b): `ReminderCard` (karta przypomnienia z polami, terminem i podstawą), `CycleStateTable` (tabela stanów). Jeśli design system ma odpowiedniki (karta, tabela), używasz ich zamiast nowych.

**Contract**: `GET /hr` → 200 dla `role = 'hr'`; 403 z krótkim komunikatem „Ten ekran widzą kadry.” dla pozostałych; bez konta przekierowanie na `/account`.

#### 5. Dane i widok arkusza, druk własnego egzemplarza

**File**: `src/hr/sheet-data.ts`, `src/routes/sheet.tsx`, `src/views/sheet.tsx`

**Intent**: Podgląd arkusza w dowolnym kroku cyklu: pola jeszcze niewypełnione pokazują „—”. Dane tylko z widocznych zdarzeń: część I z migawki `part1_submitted` i `part1_confirmed`, ocena z migawki `assessment_approved`, zapoznanie albo fikcja z ich payloadów. Kolejność pól według wzoru z zał. 2–4 do rozporządzenia (nagłówki części i nazwy pól po polsku):

1. **Część I.** Nazwa urzędu (`settings.office_name`). Oceniany: imię i nazwisko, stanowisko (`people.position_title`), komórka organizacyjna (`people.unit`; B i C). Oceniający: imię i nazwisko (`part1_submitted.payload.appraiserName`), stanowisko, komórka organizacyjna (B i C). Kryteria obowiązkowe (lista arkusza). Kryteria dodatkowe (0–3, nazwy, oczekiwanie). Termin sporządzenia oceny: `part1_submitted.payload.dueDate` z `dueDateBasis` (termin przekazany w części I); gdy ocena nie jest jeszcze zatwierdzona, a `effectiveDeadline(cycleId).date` jest inna, pod spodem „Termin bieżący: DD.MM.RRRR (podstawa)”. Oświadczenie o rozmowie z § 5 ust. 1 i zapoznaniu z kryteriami i terminem. Potwierdzenie oceniającego (`place`, data `part1_submitted`, `appraiserName`), potwierdzenie ocenianego (`place`, data `part1_confirmed`, `appraiseeName`).
2. **Część II.** Data rozmowy oceniającej (`interviewDate`). Okres podlegania ocenie od `periodFrom` (= `cycles.period_start`; przed zatwierdzeniem wprost z `cycles.period_start`) do `periodTo`. Macierz ocen cząstkowych: wiersz na kryterium obowiązkowe, potem dodatkowe; kolumny 1, 3, 5, 7, 9 z nazwami skali; „X” w wybranej. Średnia (bez zaokrąglania w obliczeniu, wyświetlana z dwoma miejscami). Ogólny poziom: pięć przedziałów, „X” przy wyliczonym. Ocena okresowa: POZYTYWNA albo NEGATYWNA, „X”.
3. **Dalsza część.** Uzasadnienie przyznanej oceny. Wnioski do indywidualnego programu rozwoju zawodowego. Dane poprzedniej oceny (tylko urzędnik mianowany; z `assessmentHistory`: wynik, poziom, data, albo „brak w systemie”). Czy dołączono wniosek o kolejny stopień: TAK / NIE / NIE DOTYCZY (NIE DOTYCZY dla `appointed = 0`). Dane oceniającego. Potwierdzenie oceniającego (`confirmation`). Potwierdzenie ocenianego (rozmowa oceniająca, zapoznanie z oceną i wnioskami; z `assessment_acknowledged`) albo wpis o fikcji zapoznania: „Stwierdzono fikcję zapoznania DD.MM.RRRR: oceniany nie mógł / nie chciał potwierdzić. Kopię arkusza doręczono osobiście / pocztą / pocztą elektroniczną DD.MM.RRRR. Wpis oceniającego: imię i nazwisko” (decyzja 11a). **Pouczenie**: „Od oceny przysługuje sprzeciw do dyrektora generalnego urzędu w terminie 7 dni od dnia zapoznania się z oceną (art. 83 ust. 1 ustawy)”; dla arkusza A adresatem jest kierownik urzędu. Pouczenie jest zawsze w HTML i na wydruku (nie ma klasy `no-print`).
4. **Część III** (faza 2, zmiana 2).

Blok potwierdzenia ma postać „Potwierdzenie w systemie: <miejscowość>, <DD.MM.RRRR>, <imię i nazwisko>”. Tam, gdzie wzór ma „podpis”, stoi „Potwierdzenie w systemie”; słowo „podpis” nie pojawia się nigdzie w HTML. Pod arkuszem stopka: „Arkusz <A/B/C> · wersja reguł <rulesVersion cyklu> · stan na DD.MM.RRRR · potwierdzenia złożono w systemie mOcena”. Na stronie dwa przyciski (klasa `no-print`): „Drukuj / pobierz PDF” (`onclick="window.print()"`) i „Drukuj część I” (prowadzi do `?part=1`, gdzie strona zawiera tylko część I, stopkę i ten sam przycisk druku), oraz jedno zdanie pod nimi: „Zapis do PDF wybierasz w oknie druku”.

Uprawnienia: `canViewSheet` przepuszcza ocenianego (`cycles.person_id`), oceniającego cyklu (`cycles.appraiser_id`) i rolę `hr` (Access Control); pozostali 403. Oceniany drukuje własny egzemplarz części I i całego arkusza tymi samymi przyciskami. Na arkusz nie trafia nic z tabel `notes` ani `feedback_messages`.

Nowe komponenty UI: `SheetField` (etykieta i wartość, „—” gdy puste), `ScoreMatrix` (macierz z „X”), `PrintButton`. Blok potwierdzenia to `ConfirmationBlock` z `src/views/components.tsx` (tworzy go S-01), rozszerzony tu o wpis o fikcji.

**Contract**: `sheetData(cycleId, { part?: 1 }): SheetData` (wszystkie pola powyżej w tej kolejności, puste jako `null`); `canViewSheet(viewer, cycle): boolean`; `GET /cycles/:id/sheet` i `GET /cycles/:id/sheet?part=1` → 200 / 403 / 404 (cykl bez widocznego `cycle_started` → 404).

#### 6. Styl druku

**File**: `public/print.css`, `src/views/layout.tsx` (jedna linia `<link rel="stylesheet" href="/print.css" media="print">`)

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

- Pełny przebieg pokazu do kroku 5 (data 2026-11-22): `/hr` pokazuje kartę Tomasza z terminem 14.12.2026, sprzeciw Marii z rozpatrzeniem do 04.12.2026, wniosek Anny z podstawą i zdaniem o zawiadomieniu oraz zapoznanie Piotra z sprzeciwem do 30.11.2026
- Podgląd wydruku w przeglądarce (Chrome, A4) arkusza Piotra po potwierdzeniu zapoznania, z konta Piotra: bez nawigacji i przycisków, części od nowej strony, macierz nie łamie się między stronami, pouczenie o sprzeciwie jest, nigdzie słowo „podpis”
- Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024

## Phase 2: Po wersji minimalnej

Budowane w tej kolejności; tniemy w odwrotnej (zob. „Kolejność cięcia”).

### Changes Required:

#### 1. Odnotowanie przyznania stopnia (cięcie 5)

**File**: `src/routes/hr.tsx`

**Intent**: Przycisk „Odnotuj przyznanie stopnia” na karcie (nie przy stopniu IX). Zapis tylko po kliknięciu człowieka (zasada 7). Zdarzenie dostaje datę `today()`, `cycle_id` drugiej oceny z pary i aktora z kadr. Po zapisie karta znika, bo `currentGrade` zwraca nowy stopień z datą dzisiejszą, a reguła liczy oceny od niej; S-02 widzi ten sam nowy stopień. Ponowne kliknięcie (druga wysyłka formularza) nie tworzy drugiego zdarzenia: serwer sprawdza `mandatoryGrade` przed zapisem.

**Contract**: `POST /hr/grades/:personId` → `recordEvent("mandatory_grade_awarded", cycleId, actorId, { fromGrade, toGrade, basis: "art. 89 ust. 2 ustawy" })`, przekierowanie 303 na `/hr`. Tylko `role = 'hr'` (inni 403). Brak obowiązku albo stopień IX → 409 bez zapisu.

#### 2. Część III arkusza i poprzednie oceny Piotra i Ewy (cięcia 3 i 4)

**File**: `src/hr/sheet-data.ts`, `src/views/sheet.tsx`, `src/seed/assessments.ts`

**Intent**: Część III (tylko `appointed = 1` i `gradeRequest.attached`): imię i nazwisko, rok mianowania (`people.appointed_year`), posiadany stopień i data przyznania (z `currentGrade` na dzień zatwierdzenia), zdanie wniosku z art. 89 ust. 1 ustawy, umotywowanie, potwierdzenie oceniającego. Poprzednie oceny Piotra (zatwierdzona i potwierdzona 27.11.2024) i Ewy (20.11.2024) jako pełne łańcuchy w zamkniętych cyklach (nowe wiersze `cycles` z `period_start` 24 miesiące wcześniej, część I w pierwszych 30 dniach, pozytywne, „na poziomie oczekiwań”), widoczne od startu pokazu; daty zgodne z `previousAssessmentOn` w `cycle_started` z `base.ts`.

**Contract**: część III w HTML tylko przy `gradeRequest.attached`; `assessmentHistory` Piotra przy 2024-12-09 zwraca jedną ocenę z 27.11.2024.

#### 3. Statystyki bez nazwisk (cięcie 2)

**File**: `src/hr/stats.ts`, `src/views/hr-overview.tsx`

**Intent**: Blok z nagłówkiem „Statystyki terminowości (widok dyrektora generalnego, bez nazwisk)”: liczba cykli w każdym kroku, oceny zatwierdzone w terminie i po terminie (data `assessment_approved` względem `effectiveDeadline(cycleId).date`), cykle po terminie bez oceny. Dla całego urzędu, bez podziału na komórki i bez nazwisk; tylko widoczne zdarzenia. Nowy komponent UI `StatsBlock` (albo odpowiednik z design systemu).

**Contract**: `officeStats(): { byStep: Record<step, number>, onTime: number, late: number, overdueOpen: number }`.

#### 4. Odnotowanie rozstrzygnięcia sprzeciwu (cięcie 1)

**File**: `src/routes/hr.tsx`

**Intent**: Przy stanie `objection_filed` trzy przyciski: „Uwzględniony: zmiana oceny”, „Uwzględniony: ponowne sporządzenie oceny”, „Nieuwzględniony”. To stan uproszczony z decyzji 4 (FR-028); system nie prowadzi dalszego obiegu.

**Contract**: `POST /cycles/:id/objection-outcome` z polem `outcome` ∈ `changed` | `redone` | `rejected` → `recordEvent("objection_resolved", cycleId, actorId, { outcome })`, 303 na `/hr`. Tylko `role = 'hr'`; inna wartość `outcome` → 400; cykl bez widocznego `objection_filed` → 409.

### Success Criteria:

#### Automated Verification:

- Testy przycisków, części III, statystyk i poprzednich ocen przechodzą: `bun test src/routes/hr-actions.test.ts`
- Cały zestaw testów przechodzi: `bun test`

#### Manual Verification:

- Wersja 5-minutowa przy dacie 2026-11-22: kliknięcie „Odnotuj przyznanie stopnia” usuwa kartę Tomasza, a historia i arkusz nadal się otwierają

## Testing Strategy

Testy obok kodu, trasy przez `app.request()` na `createTestApp({ today })` (baza w pamięci z wgranymi danymi i datą systemową).

**Faza 1**

- `src/engine/grades.test.ts`: przypadek Tomasza (zapoznanie 2026-11-12 → `dueOn` 2026-12-14, przeniesienie z soboty 12.12.2026); wysoka ocena negatywna (poziom „powyżej oczekiwań”, `outcome: "negative"`) nie tworzy pary; ocena pośrodku (wysoka, „na poziomie”, wysoka) → `null`; brak zapoznania z drugą oceną → `null`, po dopisaniu zapoznania → obowiązek; fikcja zapoznania liczy się jak zapoznanie (data wpisu); późniejsza ocena „na poziomie” po powstałym obowiązku go nie kasuje; pracownik niemianowany → `null`; ocena sprzed bieżącego stopnia się nie liczy; stopień IX → `atMaxGrade: true`, `toGrade: null`; po `mandatory_grade_awarded` → `null` (przez `currentGrade`).
- `src/hr/cycle-state.test.ts`: każdy `step` z tabeli; `criteria_due` przy poprzedniej ocenie pozytywnej daje 30 dni, przy negatywnej 7 dni (wartość z `criteriaTalkDeadline`, różne daty sporządzenia i zapoznania); `in_period` pokazuje datę i podstawę z `effectiveDeadline`; „część I czeka od X dni” liczy dni od `part1_submitted`; stan fikcji ma sposób i datę doręczenia; widoczność (uwaga 11) dzień przed, w dniu i po zdarzeniu: cykl Anny przy 2024-12-15 / 2024-12-16 / 2024-12-17, sprzeciw Marii przy 2026-11-19 / 2026-11-20 / 2026-11-21, historia Tomasza (1 / 2 / 2 oceny) i karta stopnia (brak / jest / jest) przy 2026-11-11 / 2026-11-12 / 2026-11-13.
- `src/routes/hr.test.ts`: Joanna przy 2026-11-22 widzi pole „Urzędnik” z „Tomasz Kamiński”, nagłówek „Obowiązek urzędu”, „14.12.2026” i „art. 89 ust. 2”; widzi stan sprzeciwu Marii z „04.12.2026” i wniosek Anny z „art. 81 ust. 8” i zdaniem „zawiadamia pracownika pisemnie”; ekran startowy Joanny ma odnośnik do `/hr`; każdy wiersz ma odnośnik do `/cycles/:id/part1`, arkusza i historii; ekran `/cycles/:id/part1` cyklu Tomasza ma odnośniki „Arkusz” i „Historia ocen”; Piotr dostaje 403; HTML `/hr` nie zawiera nazw poziomów („powyżej oczekiwań” itd.) ani słów „pozytywna”/„negatywna”.
- `src/routes/sheet.test.ts`: Piotr otwiera własny arkusz i `?part=1` (200; w `?part=1` jest „Część I” i nie ma „Część II”); Ewa dostaje 403 na arkusz Piotra, Joanna 200, Marek 200; kolejność w HTML: „Część I” < „Część II” < „Uzasadnienie” < „Wnioski do indywidualnego programu” < „Pouczenie”; pouczenie zawiera „7 dni” i „art. 83 ust. 1” i nie jest w elemencie `no-print`; HTML nie zawiera „podpis” (bez względu na wielkość liter) ani tekstu żadnej wgranej notatki; przy fikcji zapoznania jest wpis „nie mógł” albo „nie chciał” ze sposobem i datą doręczenia; okres od = `cycles.period_start` (Piotr: 27.11.2024, nie 09.12.2024).
- `src/routes/history.test.ts`: Tomasz przy 2026-11-22 widzi 2 oceny, przy 2026-01-01 jedną; Anna widzi historię Tomasza; Ewa dostaje 403 na historię Piotra.
- `src/routes/hr-sheets.test.ts` (uwaga 10): przy 2026-11-22 Joanna otwiera `/hr`, z HTML bierze odnośniki „Arkusz” Tomasza, Marii i Anny oraz z historii Tomasza odnośnik do arkusza z 12.11.2024, otwiera każdy (200) i sprawdza: potwierdzenia części I oceniającego i ocenianego (nazwiska z `appraiserName` i `appraiseeName`); u Tomasza (obie oceny) i Marii potwierdzenie oceniającego w części II i potwierdzenie zapoznania; u Tomasza z 12.11.2026 „Dane poprzedniej oceny” z datą 12.11.2024; u Tomasza z 12.11.2024 „brak w systemie”; u Anny część II pusta („—”). Osobno: w danych nie ma cyklu z `assessment_approved` bez `part1_confirmed`.

**Faza 2**

- `src/routes/hr-actions.test.ts`: `POST /hr/grades/:id` przez Joannę tworzy jedno `mandatory_grade_awarded` i usuwa kartę; drugie kliknięcie → 409 i nadal jedno zdarzenie; po przyznaniu `currentGrade` Tomasza to 6 (to samo widzi S-02); Piotr → 403; `POST /cycles/:id/objection-outcome` z nieznaną wartością → 400, z `rejected` → stan „sprzeciw nieuwzględniony”; blok statystyk nie zawiera żadnego nazwiska z danych; część III tylko przy `gradeRequest.attached`; historia Piotra przy 2024-12-09 ma ocenę z 27.11.2024.

## Open questions

Każde ma domyślne rozstrzygnięcie, z którym implementacja idzie dalej.

1. **„Na jednym z dwóch najwyższych poziomów”** (art. 89 ust. 2): obie oceny na tym samym poziomie czy każda na którymkolwiek z dwóch? Domyślnie: każda na którymkolwiek z dwóch najwyższych. Tomasz ma dwa razy „powyżej oczekiwań”, więc pokaz działa przy obu odczytaniach.
2. **Termin 30 dni w sobotę lub dzień wolny.** Domyślnie przechodzi na następny dzień roboczy, jak pozostałe terminy w silniku (14.12.2026 zamiast 12.12.2026). Karta podaje oba fakty.
3. **Stopień Tomasza i data ostatniego stopnia** nie są w `demo.md` ani w kontrakcie. Domyślnie: stopień V z `base.ts` (`civil_service_grade = 5`), przyznany 01.12.2022, mianowany w 2016 roku (dane pokazowe, decyzja 10e). Jeśli `base.ts` ustawi inny stopień, testy biorą go z bazy, a nie z tekstu.
4. **Gdzie widać stany uproszczone.** Domyślnie: sprzeciw na zamkniętym cyklu Marii (osoba bez konta z zespołu Marka), wniosek o zmianę terminu w cyklu Anny (ocenia ją dyrektor generalny). Nie dotykamy ocen Piotra, Ewy i bieżącej Tomasza poza danymi z tej tabeli. Między 18.11.2024 a 16.11.2026 Maria ma otwarty cykl, więc notatka o niej zapisana w tym czasie (np. krok 2) dostanie jego `cycle_id`; oceniającym jest ten sam Marek.
5. **Poprzednie oceny Piotra i Ewy** (27.11.2024 i 20.11.2024): `demo.md` podaje tylko daty. Domyślnie: pozytywne, „na poziomie oczekiwań”.
6. **Podstawa prawna najwyższego stopnia IX** nie jest w pliku reguł. Domyślnie: wartość `max: 9` z polem `basis` uzupełnionym przy budowie po sprawdzeniu w ustawie; dopóki nie jest sprawdzona, ekran nie pokazuje tej podstawy.
7. **Powód wniosku Anny o zmianę terminu.** Domyślnie jeden z czterech powodów z art. 81 ust. 8 ustawy, wybrany przy budowie po sprawdzeniu brzmienia przepisu w bazie wiedzy; bez danych o zdrowiu.

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

- [ ] 1.6 Pełny przebieg do kroku 5 (2026-11-22): `/hr` pokazuje kartę Tomasza (14.12.2026), sprzeciw Marii (04.12.2026), wniosek Anny i zapoznanie Piotra (sprzeciw do 30.11.2026)
- [ ] 1.7 Podgląd wydruku arkusza Piotra z jego konta: bez nawigacji i przycisków, części od nowej strony, macierz w całości, pouczenie o sprzeciwie, bez słowa „podpis”
- [ ] 1.8 Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024

### Phase 2: Po wersji minimalnej

#### Automated

- [ ] 2.1 Testy przycisków, części III, statystyk i poprzednich ocen przechodzą: `bun test src/routes/hr-actions.test.ts`
- [ ] 2.2 Cały zestaw testów przechodzi: `bun test`

#### Manual

- [ ] 2.3 Wersja 5-minutowa przy 2026-11-22: „Odnotuj przyznanie stopnia” usuwa kartę Tomasza, historia i arkusz nadal się otwierają
