# Stan cykli dla kadr, stopień obowiązkowy i wydruk arkusza — plan wdrożenia

## Overview

Plaster S-06 zamyka pokaz (krok 5 w `context/foundation/demo.md`). Daje kadrom (Joanna) jeden ekran ze stanem wszystkich cykli, przypomnieniem o obowiązkowym stopniu służbowym Tomasza z terminem 30 dni i podstawą prawną, stanami uproszczonymi (sprzeciw, wniosek o zmianę terminu, statystyki bez nazwisk), a każdej uprawnionej osobie historię ocen, podgląd arkusza i druk z przeglądarki („Drukuj / pobierz PDF”). Niesie 5 z 15 czynności liczonych jako „działa” (decyzja 4): przypomnienie o obowiązkowym stopniu, historia ocen, podgląd, pobranie i wydruk arkusza, oraz widoczne stany dla FR-013, FR-028 i FR-030.

Czas: ok. 80 minut dla jednego agenta. Budowany po S-05 i przed S-03 (decyzja 10h), więc nie korzysta z osi czasu ani z tabeli nieobecności.

## Current State Analysis

Stan repo w chwili pisania planu (21.11.2026 wieczór): F-01 nie jest jeszcze zbudowany. Jest starter Hono (`src/index.ts`), silnik po polsku w `src/silnik/` i plik reguł `reguly/rozporzadzenie-2016-470.json`. Plaster S-06 powstaje po F-01, S-01, S-02, S-04 i S-05, więc opiera się na nazwach z ich planów. Nazwy zdarzeń i kolumn S-01 (`cycle-start-criteria`) i S-02 (`assessment-and-confirmation`) zostały sprawdzone w ich planach z 21.11.2026; S-03 (`timeline-and-absences`) planuje podmianę terminu na ekranie kadr przez `effectiveDeadline(cycleId)`. Wszystko, czego plaster potrzebuje od wcześniejszych plastrów, jest wypisane w sekcji „Założenia wobec wcześniejszych plastrów”. Pierwszy krok implementacji to sprawdzenie tych nazw w `src/` i w planach `context/changes/*/plan.md`; tam, gdzie kod ma inną nazwę, obowiązuje kod, a ten plan dopasowuje się w jednym miejscu (`src/hr/sheet-data.ts` i `src/hr/cycle-state.ts`).

Co jest pewne już dziś:

- Silnik terminów ma `naDzienRoboczy` (po F-01: odpowiednik w `src/engine/deadlines.ts`) i terminy sprzeciwu (art. 83 ust. 1 i 3 ustawy). Brakuje terminu stopnia obowiązkowego (art. 89 ust. 2 ustawy: z mocy prawa, w 30 dni od zapoznania z oceną).
- Plik reguł ma skalę 1/3/5/7/9 i pięć poziomów ogólnych. Dwa najwyższe to „powyżej oczekiwań” i „znacznie powyżej oczekiwań”.
- Układ arkusza A, B i C jest wspólny: część I, część II, dalsza część, część III tylko dla urzędnika mianowanego z dołączonym wnioskiem (zał. 2–4 do rozporządzenia).

## Desired End State

Przy dacie systemowej 27.11.2026 Joanna otwiera `/hr` i widzi:

1. Kartę „Stopień służbowy z mocy prawa”: Tomasz Kamiński, dwie kolejne oceny na jednym z dwóch najwyższych poziomów od ostatniego stopnia (12.11.2024 i 12.11.2026), stopień do przyznania do 14.12.2026 (30 dni od zapoznania 12.11.2026 wypada w sobotę 12.12.2026, więc przechodzi na poniedziałek), podstawa: art. 89 ust. 2 ustawy.
2. Tabelę cykli: osoba, oceniający, arkusz, stan procesu, termin z podstawą, link „Arkusz” i „Historia ocen”. Wśród stanów: „czeka na potwierdzenie części I od X dni” (decyzja 10d), „fikcja zapoznania stwierdzona … (nie mógł / nie chciał)” (decyzja 5b, tylko wgląd), „sprzeciw wniesiony 20.11.2026, rozpatrzenie do 04.12.2026”, „wniosek ocenianej o zmianę terminu czeka na rozpatrzenie”.
3. Blok „Liczniki terminowości (widok dyrektora generalnego, bez nazwisk)”.

Przy dacie 01.11.2026 karty Tomasza nie ma (decyzja 10i: ocena z 12.11.2026 jeszcze się nie odsłoniła). Strona `/cycles/:id/sheet` pokazuje arkusz ze wszystkimi polami w kolejności wzoru, a przycisk „Drukuj / pobierz PDF” otwiera druk przeglądarki; na wydruku nie ma nawigacji ani przycisków, jest słowo „potwierdzenie”, nigdzie „podpis”. `bun test` przechodzi.

### Key Discoveries

- Art. 89 ust. 2 ustawy liczy 30 dni od zapoznania z oceną. Przy fikcji zapoznania terminy biegną od dnia wpisu (decyzja 5b), więc datą „zapoznania” jest data `assessment_acknowledged` albo `acknowledgement_fiction`.
- Wzór arkusza ma pola „podpis”. Zasada 6 z `AGENTS.md` wymaga, żeby na ekranie i wydruku stało „Potwierdzenie w systemie” z miejscowością, datą i nazwiskiem.
- Nie ma konta dyrektora generalnego (Access Control i lista kont w `demo.md`), więc liczniki bez nazwisk pokazujemy na ekranie Joanny jako osobny blok z podpisem, dla kogo są.

## What We're NOT Doing

- Pełnego obiegu sprzeciwu, wniosku o zmianę terminu i decyzji o stopniu (roadmapa, „Parked”). Są widoczne stany i najwyżej jedno kliknięcie odnotowania.
- Generatora PDF. „Pobranie” to zapis do PDF w oknie druku przeglądarki (decyzja 7).
- Wierności 1:1 ze wzorem (PRD, Non-Goals). Jest komplet pól w kolejności wzoru.
- Notatek i informacji zwrotnej na arkuszu i wydruku: notatki są prywatne (S-04), na arkusz trafia tylko tekst uzasadnienia, który przełożony sam wstawił (decyzja 10f).
- Osi czasu, nieobecności i zmiany oceniającego (S-03). Termin w tabeli czyta jedna funkcja, którą S-03 później podmieni.
- Wyszukiwania, filtrów i sortowania po wyniku (decyzja 4: lista bez wyszukiwania). Sortujemy tylko po terminie.
- Przypomnienia o stopniu na ekranie oceniającej (Anny). PRD daje oceniającemu wgląd w „własny zespół”, ale FR-027 dotyczy kadr; funkcja reguły jest gotowa do użycia później.
- Stylów ekranu. Wygląd i komponenty pochodzą z design systemu autora (decyzja 10b); plan wymienia tylko ekrany i komponenty. Styl druku jest częścią tego planu.

## Implementation Approach

Trzy warstwy, jak w poprzednich plastrach:

1. **Reguła w silniku** (czysta funkcja, test bez bazy): `src/engine/grades.ts` liczy, czy urzędnikowi mianowanemu należy się stopień z mocy prawa i do kiedy. Liczby (30 dni, dwa najwyższe poziomy, najwyższy stopień) są w pliku reguł, z podstawą.
2. **Odczyt stanu z `events`** (`src/hr/`): stan procesu cyklu, historia ocen, dane arkusza i liczniki. Każdy odczyt bierze tylko zdarzenia z datą nie późniejszą niż `today()` (decyzja 10i). Tylko te moduły znają nazwy zdarzeń i kolumn z wcześniejszych plastrów.
3. **Trasy i widoki** w Hono JSX na wspólnym układzie `src/views/layout.tsx`, testowane przez `app.request()`.

Stan cyklu to opis kroku procesu („czeka na potwierdzenie części I od 12 dni”), a nie etykieta o człowieku. Na ekranie kadr przy nazwisku nie ma wyniku oceny, poziomu, kolorów ani liczb o osobie (zasada 7 z `AGENTS.md`). Wynik i poziom widać tylko w historii ocen i na arkuszu, czyli w dokumencie, do którego dana osoba ma wgląd z Access Control. Test pilnuje, że HTML ekranu `/hr` nie zawiera nazw poziomów ani słów „pozytywna” i „negatywna”.

**Kolejność cięcia** (gdy brakuje czasu; krok 5 pokazu ma działać do końca): 1) przyciski rozstrzygnięcia sprzeciwu (faza 2, zmiana 3), 2) przycisk „Odnotuj przyznanie stopnia” (faza 2, zmiana 2), 3) blok liczników bez nazwisk (zostaje zdanie „Statystyki: poza prototypem”), 4) wgrane poprzednie oceny Piotra i Ewy (historia działa na Tomaszu), 5) część III na arkuszu (zostaje pole „Czy dołączono wniosek o kolejny stopień”). Nie wolno ciąć: karty stopnia Tomasza, tabeli stanów z sprzeciwem i wnioskiem o termin, podglądu arkusza z przyciskiem druku i stylu druku.

## Założenia wobec wcześniejszych plastrów

Nazwy w nawiasach to założenie tego planu. Przy budowie sprawdź je w `src/`; inna nazwa w kodzie wygrywa i zmieniasz ją tylko w `src/hr/*.ts`.

**F-01**

- Tabele: `people` (`id`, `name`, `position`, `unit`, `role` z wartością `hr` dla Joanny, `supervisor_id`), `cycles` (`id`, `person_id`, `appraiser_id`, `sheet` ∈ A/B/C, `period_start`), `cycle_criteria` (`cycle_id`, `criterion_id`, `kind` ∈ `mandatory`/`additional`, `expectation`), `events` (`id`, `type`, `cycle_id`, `actor_id`, `date`, `payload` JSON), `settings` (klucz–wartość, w tym data systemowa).
- Funkcje: `today()`, `rulesVersion()`, odczyt konta z ciasteczka (`currentPerson(c)`), `db` z `src/db.ts`.
- Silnik: `src/engine/deadlines.ts` z `toWorkingDay(iso)` (dawne `naDzienRoboczy`), `addDays(iso, n)`, `nextAssessmentDeadline(start)` (art. 81 ust. 4), `objectionDeadline(ackOn)` (art. 83 ust. 1), `objectionReviewDeadline(filedOn)` (art. 83 ust. 3); `src/engine/scoring.ts` z wyliczeniem wyniku i nazwami poziomów; `src/engine/rules.ts` czyta `rules/regulation-2016-470.json`.
- Trasy: `GET /`, `GET/POST /account`, `POST /demo/date`. Ekran startowy Joanny dostaje link do `/hr` (jedna linia w widoku startowym).
- Seed: `src/seed.ts` wgrywa osoby z `demo.md`, w tym dyrektora generalnego urzędu jako osobę bez konta.

**S-01**

- Zdarzenia: `cycle_started`, `part1_submitted` (oceniający potwierdził rozmowę i przekazał część I; payload `{ sheet, criteria: [{ id, kind, expectation }], dueDate, dueDateBasis, rulesVersion, place, appraiserName }`; data zdarzenia = data rozmowy), `part1_confirmed` (payload: `place`, `name`).
- Funkcje: `cycleCriteria(cycleId)` i `part1Status(cycleId)` z `src/cycles/part1.ts`.
- Termin oceny: `part1_submitted.payload.dueDate`; przed przekazaniem części I `nextAssessmentDeadline(cycles.period_start)`.
- Miejscowość urzędu w `settings.office_city`. Nazwy urzędu (`settings.office_name`) S-01 nie dodaje: dopisuje ją ten plaster w seedzie (fikcyjna nazwa).

**S-02**

- Zdarzenia: `assessment_approved` z payloadem `AssessmentSnapshot` (`scores`, `justification`, `developmentConclusions`, `interviewDate`, `gradeRequest: { attached, motivation, targetGrade }`, `result` z `computeAssessment` (średnia, poziom, wynik), `criteria: { id, name, kind, score }[]` w kolejności arkusza, `periodFrom`, `periodTo`, `rulesVersion`, `confirmation: { place, date, name }`), `assessment_acknowledged` (payload `{ place, date, name, objectionDeadline }`), `acknowledgement_fiction` (payload `{ reason: "could_not" | "would_not", objectionDeadline }`).
- Funkcja `assessmentState(cycleId)` z `src/assessment/state.ts`: `{ stage, draft, snapshot, acknowledgement, fiction, objectionDeadline }`.
- Kolumny urzędnika mianowanego w `people`: `appointed` (0/1) i `civil_service_grade` (1–9) od S-02. Ten plaster dopisuje `appointed_year` i `grade_awarded_on` w schemacie `src/db.ts` i w seedzie.
- Jeśli S-02 trzyma treść oceny w osobnej tabeli zamiast w payloadzie, czyta ją `src/hr/sheet-data.ts` i nic poza nim.

**S-04, S-05**: niczego nie używamy. Wymóg negatywny: tabela `notes` i wysłana informacja zwrotna nie trafiają na arkusz ani wydruk.

## Co ten plaster udostępnia

- `cycleState(cycleId): CycleState` w `src/hr/cycle-state.ts`: `{ step, text, deadline?, basis?, since? }`; `step` ∈ `criteria_due`, `part1_waiting`, `in_period`, `awaiting_acknowledgement`, `acknowledged`, `fiction`, `objection_filed`, `objection_resolved`, `due_change_requested`.
- `cycleDueDate(cycleId): { date, basis }` w `src/hr/cycle-state.ts`: dziś zwraca `part1_submitted.payload.dueDate` (albo `nextAssessmentDeadline(period_start)` przed przekazaniem) z podstawą art. 81 ust. 4 ustawy. **S-03 podmienia ciało tej funkcji** na `effectiveDeadline(cycleId)` (termin z nieobecnościami); ekran kadr i arkusz pokażą nowy termin bez innych zmian. Ekran kadr ma też miejsce na odnośniki S-03 w wierszu („Oś czasu”, „Wpisz nieobecność”, „Zmień oceniającego”).
- `mandatoryGrade(input): MandatoryGrade | null` w `src/engine/grades.ts` i `mandatoryGradeDeadline(ackOn)` w `src/engine/deadlines.ts`.
- `assessmentHistory(personId): HistoryEntry[]` w `src/hr/history.ts`.
- `sheetData(cycleId): SheetData` w `src/hr/sheet-data.ts` oraz `canViewSheet(viewer, cycle)`.
- Trasy: `GET /hr`, `GET /cycles/:id/sheet`, `GET /people/:id/history`, `POST /hr/grades/:personId`, `POST /cycles/:id/objection-outcome`.
- Zdarzenia: `objection_filed`, `objection_resolved`, `due_change_requested`, `mandatory_grade_awarded`.
- Plik `public/print.css` (styl druku dla każdego ekranu; S-03 może z niego korzystać przy osi czasu).

## Phase 1: Reguła stopnia, stan cyklu i dane pokazowe

### Changes Required:

#### 1. Reguła stopnia z mocy prawa

**File**: `rules/regulation-2016-470.json`, `src/engine/deadlines.ts`, `src/engine/grades.ts`, `src/engine/grades.test.ts`

**Intent**: Dopisać do pliku reguł w `deadlines`: `mandatoryGradeDays` (`value: 30`, `basis: "art. 89 ust. 2 ustawy"`, `from: "dzień zapoznania się z oceną"`), a w nowym kluczu `serviceGrade`: `topLevels: 2` (dwa najwyższe poziomy ogólne skali) i `max: 9`. Funkcja terminu liczy 30 dni i przenosi koniec z soboty lub dnia wolnego na dzień roboczy, jak pozostałe terminy. Reguła bierze oceny urzędnika mianowanego (`appointed = 1`) zatwierdzone po dacie ostatniego stopnia (z `grade_awarded_on` albo z ostatniego `mandatory_grade_awarded`), w kolejności dat, i sprawdza dwie ostatnie: obie muszą być na jednym z dwóch najwyższych poziomów (każda z osobna; zob. pytanie otwarte 1). Data zapoznania to data `assessment_acknowledged` albo `acknowledgement_fiction`; ocena bez zapoznania się nie liczy.

**Contract**: `mandatoryGradeDeadline(ackOn: string): string`. `mandatoryGrade({ isAppointed, serviceGrade, lastGradeOn, assessments: { date, level, acknowledgedOn | null, cycleId }[] }, today): null | { dueOn, basis: "art. 89 ust. 2 ustawy", fromGrade, toGrade | null, assessmentDates: [string, string], cycleId, overdue: boolean, atMaxGrade: boolean }`. Przy `serviceGrade === max` (z `civil_service_grade`) wynik ma `toGrade: null` i `atMaxGrade: true` (ekran pisze „ma najwyższy stopień, kolejnego nie można przyznać”).

#### 2. Stan cyklu, historia, liczniki

**File**: `src/hr/cycle-state.ts`, `src/hr/history.ts`, `src/hr/stats.ts`, `src/hr/cycle-state.test.ts`

**Intent**: Jedno miejsce, które czyta `events` (tylko `date <= today()`) i zamienia je na stan procesu z terminem i podstawą. Kolejność rozstrzygania od najpóźniejszego kroku: `objection_resolved`, `objection_filed`, potem etap z `assessmentState(cycleId)` z S-02 (`fiction`, `acknowledged`, `approved`), `due_change_requested` (gdy nierozpatrzony), `part1_confirmed`, `part1_submitted`, `cycle_started`. Etapów oceny nie liczymy drugi raz: bierzemy `stage`, `snapshot`, `acknowledgement`, `fiction` i `objectionDeadline` z S-02. Teksty stanów (po polsku, zdaniem o kroku procesu, bez oceny osoby):

| step | Tekst | Termin i podstawa |
|---|---|---|
| `criteria_due` | „Kryteria do wyznaczenia” | 30 dni od początku cyklu, § 7 pkt 1 |
| `part1_waiting` | „Część I czeka na potwierdzenie ocenianego od X dni” | bez terminu (decyzja 10d) |
| `in_period` | „Okres oceny” | `cycleDueDate()`, art. 81 ust. 4 ustawy |
| `awaiting_acknowledgement` | „Ocena zatwierdzona, czeka na potwierdzenie zapoznania” | — |
| `acknowledged` | „Zapoznanie potwierdzone DD.MM.RRRR” | sprzeciw do …, art. 83 ust. 1 ustawy |
| `fiction` | „Fikcja zapoznania stwierdzona DD.MM.RRRR przez oceniającego: oceniany nie mógł / nie chciał potwierdzić” | sprzeciw do …, art. 83 ust. 1 ustawy |
| `objection_filed` | „Sprzeciw wniesiony DD.MM.RRRR do dyrektora generalnego urzędu” | rozpatrzenie do …, art. 83 ust. 3 ustawy |
| `objection_resolved` | „Sprzeciw rozpatrzony: zmiana oceny / ponowne sporządzenie oceny / sprzeciw nieuwzględniony” | — |
| `due_change_requested` | „Wniosek ocenianego o zmianę terminu czeka na rozpatrzenie przez oceniającego” | art. 81 ust. 8 ustawy |

Termin po upływie dostaje dopisek „termin minął DD.MM.RRRR”, bez kolorów przy nazwisku. Historia: zatwierdzone oceny osoby (wszystkie jej cykle) z datą, arkuszem, średnią, poziomem, wynikiem, wersją reguł i datą zapoznania. Liczniki: liczba cykli w każdym kroku, oceny zatwierdzone w terminie i po terminie (`assessment_approved.date` względem `cycleDueDate(cycleId)`), cykle po terminie bez oceny. Liczniki są dla całego urzędu, bez podziału na komórki i bez nazwisk.

**Contract**: `cycleState(cycleId)`, `cycleDueDate(cycleId)` jak w „Co ten plaster udostępnia”; `assessmentHistory(personId): { cycleId, date, sheet, average, level, result, acknowledgedOn, rulesVersion }[]` (od najnowszej); `officeStats(): { byStep: Record<step, number>, onTime: number, late: number, overdueOpen: number }`.

#### 3. Dane pokazowe

**File**: `src/seed.ts` (i `src/db.ts`, jeśli brakuje kolumn z założeń S-02)

**Intent**: Dopisać zdarzenia z datami, które odsłaniają się przy przesuwaniu daty (decyzja 10i). Treść ocen pisze agent przy budowie (decyzja 10e). Jeśli cykl o danym okresie już jest w seedzie, dopisujesz zdarzenia do niego, nie tworzysz drugiego.

| Osoba | Co wgrać | Daty |
|---|---|---|
| Tomasz (arkusz B, oceniająca Anna) | `appointed = 1`, `civil_service_grade = 5` (jeśli S-02 nie ustawił), `appointed_year = 2016`, `grade_awarded_on = 2022-12-01` | — |
| Tomasz | cykl 2022-11-14 → 2024-11-12: `part1_confirmed` 2022-12-05, `assessment_approved` 2024-11-12 (oceny 7, 7, 9, 7, 7; średnia 7,4; „powyżej oczekiwań”; `gradeRequest.attached: false`), `assessment_acknowledged` 2024-11-12 | widoczne od startu pokazu |
| Tomasz | bieżący cykl 2024-11-12 → 2026-11-12 (S-01 wgrał już część I: przekazana 02.12.2024, potwierdzona 03.12.2024): `assessment_approved` 2026-11-12 (oceny 7, 9, 7, 7, 7; średnia 7,4; „powyżej oczekiwań”; `gradeRequest.attached: false`; wnioski rozwojowe wpisane), `assessment_acknowledged` 2026-11-12 | odsłania się 12.11.2026; termin stopnia 14.12.2026 |
| Maria (arkusz C, oceniający Marek) | cykl z oceną: `assessment_approved` 2026-11-16 (pozytywna, „na poziomie oczekiwań”), `assessment_acknowledged` 2026-11-17, `objection_filed` 2026-11-20 (payload `to: "dyrektor generalny urzędu"`) | sprzeciw do 24.11.2026, rozpatrzenie do 04.12.2026 |
| Anna (arkusz B, oceniający dyrektor generalny) | cykl w okresie oceny: `part1_confirmed` 2025-01-15, `due_change_requested` 2026-10-05 (payload `requestedDate`, `reason` jednym zdaniem bez danych o zdrowiu) | widoczne od 05.10.2026 |
| Piotr, Ewa (cięcie 4) | poprzednia ocena w zamkniętym cyklu: Piotr `assessment_approved` i `assessment_acknowledged` 2024-11-27, Ewa 2024-11-20; obie pozytywne, „na poziomie oczekiwań” | widoczne od startu pokazu |

Stan „fikcja zapoznania” nie jest wgrywany: powstaje na żywo w wersji 5-minutowej (S-02). Stan „część I czeka” daje cykl Piotra między krokiem 1 a potwierdzeniem albo inny cykl z seeda; nie dopisujemy go osobno.

**Contract**: `bun run seed` kończy się bez błędu; po seedzie i dacie 2026-11-27 `mandatoryGrade` dla Tomasza zwraca `dueOn: "2026-12-14"`.

### Success Criteria:

#### Automated Verification:

- Testy reguły stopnia przechodzą: `bun test src/engine/grades.test.ts`
- Testy stanu cyklu przechodzą: `bun test src/hr/cycle-state.test.ts`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`

#### Manual Verification:

- Brak (faza bez ekranu).

## Phase 2: Ekran kadr

### Changes Required:

#### 1. Trasa i widok przeglądu

**File**: `src/routes/hr.tsx`, `src/views/hr-overview.tsx`, `src/index.tsx` (podpięcie trasy), widok startowy F-01 (link „Stan cykli” dla roli `hr`)

**Intent**: Ekran Joanny na wspólnym układzie. Od góry: karta stopnia z mocy prawa (jedna na osobę, której się należy), tabela cykli (najnowszy widoczny cykl każdej osoby, sortowana po terminie rosnąco, bez sortowania po wyniku), blok liczników. Wiersz tabeli: imię i nazwisko, oceniający, arkusz, tekst stanu, termin z podstawą, linki „Arkusz” (`/cycles/:id/sheet`) i „Historia ocen” (`/people/:personId/history`). Karta stopnia: „Tomasz Kamiński: stopień służbowy z mocy prawa” (nazwisko i obowiązek urzędu, bez poziomów), zdanie „Dwie kolejne oceny na jednym z dwóch najwyższych poziomów od ostatniego stopnia: 12.11.2024 i 12.11.2026”, „Przyznać do 14.12.2026 (30 dni od zapoznania z oceną, art. 89 ust. 2 ustawy)”, „Stopień V → VI”, zdanie „To obowiązek, nie wniosek”. Blok liczników ma nagłówek „Liczniki terminowości (widok dyrektora generalnego, bez nazwisk)”.

Nowe komponenty UI (wygląd z design systemu autora, decyzja 10b): `ReminderCard` (karta przypomnienia z terminem i podstawą), `CycleStateTable` (tabela stanów), `StatsBlock` (liczniki). Jeśli design system ma odpowiedniki (karta, tabela, licznik), używasz ich zamiast nowych.

**Contract**: `GET /hr` → 200 dla `role = hr`; 403 z krótkim komunikatem „Ten ekran widzą kadry.” dla pozostałych; bez konta przekierowanie na `/account`.

#### 2. Odnotowanie przyznania stopnia (cięcie 2)

**File**: `src/routes/hr.tsx`

**Intent**: Przycisk „Odnotuj przyznanie stopnia” na karcie. Zapis tylko po kliknięciu człowieka (zasada 7). Zdarzenie dostaje datę `today()`, `cycle_id` drugiej oceny i aktora Joannę. Po zapisie karta znika, bo reguła liczy oceny od nowego stopnia.

**Contract**: `POST /hr/grades/:personId` → event `mandatory_grade_awarded` (payload `{ fromGrade, toGrade, basis: "art. 89 ust. 2 ustawy" }`), przekierowanie 303 na `/hr`. Tylko `role = hr`.

#### 3. Odnotowanie rozstrzygnięcia sprzeciwu (cięcie 1)

**File**: `src/routes/hr.tsx`

**Intent**: Przy stanie `objection_filed` trzy przyciski: „Uwzględniony: zmiana oceny”, „Uwzględniony: ponowne sporządzenie oceny”, „Nieuwzględniony”. To stan uproszczony z decyzji 4 (FR-028); system nie prowadzi dalszego obiegu.

**Contract**: `POST /cycles/:id/objection-outcome` z polem `outcome` ∈ `changed`/`redone`/`rejected` → event `objection_resolved`, 303 na `/hr`. Tylko `role = hr`; inna wartość `outcome` → 400.

### Success Criteria:

#### Automated Verification:

- Testy ekranu kadr przechodzą: `bun test src/routes/hr.test.ts`

#### Manual Verification:

- Ekran `/hr` po seedzie i dacie 27.11.2026 pokazuje kartę Tomasza z terminem 14.12.2026, sprzeciw Marii i wniosek Anny

## Phase 3: Podgląd arkusza, druk i historia ocen

### Changes Required:

#### 1. Dane i widok arkusza

**File**: `src/hr/sheet-data.ts`, `src/routes/sheet.tsx`, `src/views/sheet.tsx`

**Intent**: Podgląd arkusza w dowolnym kroku cyklu: pola jeszcze niewypełnione pokazują „—”. Kolejność pól według wzoru z zał. 2–4 do rozporządzenia (nagłówki części i nazwy pól po polsku):

1. **Część I.** Nazwa urzędu. Oceniany: imię i nazwisko, stanowisko, komórka organizacyjna (B i C). Oceniający: imię i nazwisko, stanowisko, komórka organizacyjna (B i C). Kryteria obowiązkowe (lista arkusza). Kryteria dodatkowe (0–3, nazwy). Termin sporządzenia oceny. Oświadczenie o rozmowie z § 5 ust. 1 i zapoznaniu z kryteriami i terminem. Potwierdzenie oceniającego, potwierdzenie ocenianego.
2. **Część II.** Data rozmowy oceniającej. Okres podlegania ocenie od (data `part1_confirmed`) do (data `assessment_approved`). Macierz ocen cząstkowych: wiersz na kryterium obowiązkowe, potem dodatkowe; kolumny 1, 3, 5, 7, 9 z nazwami skali; „X” w wybranej. Średnia (bez zaokrąglania w obliczeniu, wyświetlana z dwoma miejscami). Ogólny poziom: pięć przedziałów, „X” przy wyliczonym. Ocena okresowa: POZYTYWNA albo NEGATYWNA, „X”.
3. **Dalsza część.** Uzasadnienie przyznanej oceny. Wnioski do indywidualnego programu rozwoju zawodowego. Dane poprzedniej oceny (tylko urzędnik mianowany; z `assessmentHistory`: wynik, poziom, data, albo „brak”). Czy dołączono wniosek o kolejny stopień: TAK / NIE / NIE DOTYCZY (NIE DOTYCZY dla `appointed = 0`). Dane oceniającego. Potwierdzenie oceniającego. Potwierdzenie ocenianego (rozmowa oceniająca, zapoznanie z oceną i wnioskami) albo wpis o fikcji zapoznania: „Stwierdzono fikcję zapoznania DD.MM.RRRR: oceniany nie mógł / nie chciał potwierdzić. Wpis oceniającego: imię i nazwisko”. Pouczenie: „Od oceny przysługuje sprzeciw do dyrektora generalnego urzędu w terminie 7 dni od dnia zapoznania się z oceną (art. 83 ust. 1 ustawy)”; dla arkusza A linia „do:” z kierownikiem urzędu.
4. **Część III** (tylko `appointed = 1` i `gradeRequest.attached`; cięcie 5). Imię i nazwisko, rok mianowania, posiadany stopień, data przyznania, zdanie wniosku z art. 89 ust. 1 ustawy, umotywowanie, potwierdzenie oceniającego.

Blok potwierdzenia ma postać „Potwierdzenie w systemie: <miejscowość>, <DD.MM.RRRR>, <imię i nazwisko>”. Tam, gdzie wzór ma „podpis”, stoi „Potwierdzenie w systemie”; słowo „podpis” nie pojawia się nigdzie w HTML. Pod arkuszem stopka: „Arkusz <A/B/C> · wersja reguł <rulesVersion cyklu> · stan na DD.MM.RRRR · potwierdzenia złożono w systemie mOcena”. Na stronie przycisk „Drukuj / pobierz PDF” (`onclick="window.print()"`, klasa `no-print`) i jedno zdanie pod nim: „Zapis do PDF wybierasz w oknie druku”.

Uprawnienia: oceniany i oceniający cyklu oraz rola `hr` (Access Control); pozostali 403. Na arkusz nie trafia nic z tabeli `notes` ani z wysłanych informacji zwrotnych.

Nowe komponenty UI: `SheetField` (etykieta i wartość, „—” gdy puste), `ScoreMatrix` (macierz z „X”), `ConfirmationBlock` (potwierdzenie albo wpis o fikcji), `PrintButton`.

**Contract**: `sheetData(cycleId): SheetData` (wszystkie pola powyżej w tej kolejności, puste jako `null`); `canViewSheet(viewer, cycle): boolean`; `GET /cycles/:id/sheet` → 200 / 403 / 404.

#### 2. Styl druku

**File**: `public/print.css`, `src/views/layout.tsx` (jedna linia `<link rel="stylesheet" href="/print.css" media="print">`)

**Intent**: Wydruk arkusza czytelny na A4, bez elementów aplikacji. Reguły:

- `@page { size: A4 portrait; margin: 15mm 15mm 18mm; }`
- Ukryte: nagłówek aplikacji, nawigacja, przełącznik daty systemowej, wybór konta, przyciski, formularze, elementy z klasą `.no-print`.
- Tekst czarny na białym, `font-size: 10.5pt`, `line-height: 1.35`; bez cieni i teł; linki bez podkreślenia i bez dopisywania adresu.
- Każda część arkusza (`.sheet-part`) od nowej strony z wyjątkiem pierwszej (`break-before: page`), jak we wzorze: część I, część II, dalsza część, część III.
- `break-inside: avoid` dla macierzy ocen, bloków potwierdzeń i pojedynczego pola; `break-after: avoid` dla nagłówków.
- Macierz i przedziały: obramowanie `0.5pt solid #000`, „X” wyśrodkowany.
- Stopka arkusza (`.print-footer`, `position: fixed; bottom: 0`) powtarza się na każdej stronie.
- Druk z innego ekranu (np. `/hr`) też ukrywa nawigację i przyciski; nie projektujemy dla niego osobnego układu.

**Contract**: plik serwowany statycznie z `public/` (jak `public/style.css` z F-01).

#### 3. Historia ocen

**File**: `src/routes/history.tsx`, `src/views/history.tsx`

**Intent**: Lista zatwierdzonych ocen osoby od najnowszej: data, arkusz, wynik, poziom, średnia, data zapoznania (albo wpis o fikcji), wersja reguł, link „Arkusz”. Widzą: sama osoba, oceniający któregokolwiek jej cyklu, rola `hr` (FR-031, Access Control). Link „Historia ocen” dochodzi też do ekranu cyklu ocenianego i oceniającego, jeśli S-01/S-02 mają widok cyklu (jedna linia w ich widoku). Pusta historia: „Brak ocen w systemie”.

Nowy komponent UI: `HistoryList`.

**Contract**: `GET /people/:id/history` → 200 / 403 / 404.

### Success Criteria:

#### Automated Verification:

- Testy arkusza i historii przechodzą: `bun test src/routes/sheet.test.ts src/routes/history.test.ts`
- Cały zestaw testów przechodzi: `bun test`

#### Manual Verification:

- Podgląd wydruku w przeglądarce (Chrome, A4) arkusza Piotra po potwierdzeniu zapoznania: bez nawigacji i przycisków, części od nowej strony, macierz nie łamie się między stronami, nigdzie słowo „podpis”
- Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024

## Testing Strategy

Testy obok kodu, trasy przez `app.request()` na bazie z seeda i z ustawioną datą systemową (przez `POST /demo/date` albo zapis w `settings` w teście).

- `src/engine/grades.test.ts`: przypadek Tomasza (zapoznanie 2026-11-12 → `dueOn` 2026-12-14, przeniesienie z soboty); jedna ocena „powyżej”, druga „na poziomie” → `null`; pracownik niemianowany → `null`; ocena sprzed `grade_awarded_on` się nie liczy; ocena bez zapoznania się nie liczy; fikcja zapoznania liczy się jako zapoznanie (data wpisu); `civil_service_grade = 9` → `atMaxGrade`; po `mandatory_grade_awarded` → `null`.
- `src/hr/cycle-state.test.ts`: każdy `step` z tabeli; zdarzenie z datą po `today()` jest pomijane (decyzja 10i); „część I czeka od X dni” liczy dni od `part1_submitted`.
- `src/routes/hr.test.ts`: Joanna przy 2026-11-27 widzi „Tomasz Kamiński”, „14.12.2026” i „art. 89 ust. 2”; przy 2026-11-01 nie widzi karty; widzi stan sprzeciwu Marii z „04.12.2026” i wniosek Anny; Piotr dostaje 403; HTML `/hr` nie zawiera nazw poziomów („powyżej oczekiwań” itd.) ani słów „pozytywna”/„negatywna”; blok liczników nie zawiera żadnego nazwiska z seeda; `POST /hr/grades/:id` usuwa kartę; `POST /cycles/:id/objection-outcome` z nieznaną wartością → 400.
- `src/routes/sheet.test.ts`: Piotr widzi własny arkusz, Ewa dostaje 403 na arkusz Piotra, Joanna 200; kolejność w HTML: „Część I” < „Część II” < „Uzasadnienie” < „Wnioski do indywidualnego programu” < „Pouczenie”; HTML nie zawiera „podpis” (bez względu na wielkość liter) ani tekstu żadnej wgranej notatki; część III jest tylko przy `gradeRequest.attached`; przy fikcji zapoznania jest wpis „nie mógł” albo „nie chciał”.
- `src/routes/history.test.ts`: Tomasz przy 2026-11-27 widzi 2 oceny, przy 2026-01-01 jedną; Anna widzi historię Tomasza; Ewa dostaje 403 na historię Piotra.

## Open questions

Każde ma domyślne rozstrzygnięcie, z którym implementacja idzie dalej.

1. **„Na jednym z dwóch najwyższych poziomów”** (art. 89 ust. 2): obie oceny na tym samym poziomie czy każda na którymkolwiek z dwóch? Domyślnie: każda na którymkolwiek z dwóch najwyższych. Tomasz ma dwa razy „powyżej oczekiwań”, więc pokaz działa przy obu odczytaniach.
2. **Termin 30 dni w sobotę lub dzień wolny.** Domyślnie przechodzi na następny dzień roboczy, jak pozostałe terminy w silniku (14.12.2026 zamiast 12.12.2026). Zdanie na ekranie podaje oba fakty: „30 dni od 12.11.2026, koniec w sobotę, więc 14.12.2026”.
3. **Data ostatniego stopnia Tomasza i jego stopień** nie są w `demo.md`. Domyślnie: stopień V przyznany 01.12.2022, mianowany w 2016 roku (dane pokazowe, decyzja 10e).
4. **Gdzie widać stany uproszczone** (sprzeciw, wniosek o termin): na kim w danych. Domyślnie: sprzeciw na ocenie Marii (osoba bez konta z zespołu Marka), wniosek o zmianę terminu w cyklu Anny (ocenia ją dyrektor generalny). Nie dotykamy ocen Piotra, Ewy i Tomasza, które niosą pokaz.
5. **Data systemowa w kroku 5 pokazu.** Domyślnie 26–27.11.2026. Po 04.12.2026 sprzeciw Marii pokaże „termin rozpatrzenia minął”, a po 14.12.2026 karta Tomasza „termin minął”; ekran nadal działa, zmienia się tylko zdanie.
6. **Poprzednie oceny Piotra i Ewy** (27.11.2024 i 20.11.2024): `demo.md` podaje tylko daty. Domyślnie: pozytywne, „na poziomie oczekiwań”.
7. **Podstawa prawna najwyższego stopnia IX** nie jest w pliku reguł. Domyślnie: wartość `max: 9` z polem `basis` uzupełnionym przy budowie po sprawdzeniu w ustawie; dopóki nie jest sprawdzona, ekran nie pokazuje tej podstawy (wymóg NFR „podstawa przy każdej dacie” dotyczy dat, a nie numeru stopnia).
8. **Podstawa wniosku o zmianę terminu.** Domyślnie art. 81 ust. 8 ustawy (zmiana terminu, gdy minęło ponad 6 miesięcy od ostatniej oceny).

## References

- `context/foundation/decisions.md` (decyzje 4, 5b, 7, 10d, 10e, 10g, 10h, 10i)
- `context/foundation/prd.md` (FR-013, FR-026–FR-031, Access Control, Non-Goals)
- `context/foundation/roadmap.md` (S-06, „Parked”)
- `context/foundation/demo.md` (krok 5, daty Tomasza, osoby)
- `context/changes/rules-engine-and-demo-data/plan.md` (F-01)
- Rozporządzenie Prezesa Rady Ministrów z 4.04.2016 (Dz.U. 2016 poz. 470), zał. 2–4: wzory arkuszy A, B, C
- Ustawa o służbie cywilnej: art. 81 ust. 4 i 8, art. 83 ust. 1 i 3, art. 89 ust. 1 i 2

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Reguła stopnia, stan cyklu i dane pokazowe

#### Automated

- [ ] 1.1 Testy reguły stopnia przechodzą: `bun test src/engine/grades.test.ts`
- [ ] 1.2 Testy stanu cyklu przechodzą: `bun test src/hr/cycle-state.test.ts`
- [ ] 1.3 Dane pokazowe wgrywają się bez błędu: `bun run seed`

### Phase 2: Ekran kadr

#### Automated

- [ ] 2.1 Testy ekranu kadr przechodzą: `bun test src/routes/hr.test.ts`

#### Manual

- [ ] 2.2 Ekran `/hr` po seedzie i dacie 27.11.2026 pokazuje kartę Tomasza z terminem 14.12.2026, sprzeciw Marii i wniosek Anny

### Phase 3: Podgląd arkusza, druk i historia ocen

#### Automated

- [ ] 3.1 Testy arkusza i historii przechodzą: `bun test src/routes/sheet.test.ts src/routes/history.test.ts`
- [ ] 3.2 Cały zestaw testów przechodzi: `bun test`

#### Manual

- [ ] 3.3 Podgląd wydruku arkusza Piotra: bez nawigacji i przycisków, części od nowej strony, macierz w całości, bez słowa „podpis”
- [ ] 3.4 Podgląd wydruku arkusza Tomasza z 12.11.2026: pole „Dane poprzedniej oceny” pokazuje ocenę z 12.11.2024
