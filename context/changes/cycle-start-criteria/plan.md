# Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I — plan wdrożenia

## Overview

Krok 1 pokazu. Marek otwiera cykl Piotra, widzi arkusz C z kryteriami obowiązkowymi, wybiera 2 kryteria dodatkowe z podpowiedzią „bo w opisie stanowiska jest obowiązek: …”, wpisuje oczekiwanie, otwiera kartę rozmowy rozpoczynającej i przekazuje część I. Piotr na telefonie potwierdza; miejscowość, data i nazwisko wpisują się same, a kryteria się blokują. Plaster pokrywa US-01, US-02 i FR-001–FR-007 oraz wgrywa pełną część I Ewy i Tomasza, na której stoją kolejne plastry.

## Current State Analysis

Stan przed tym plastrem to wynik F-01. Wszystkie nazwy tabel, funkcji, zdarzeń, tras i plików wspólnych pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`; przy rozjeździe wygrywa ten rozdział, a po zbudowaniu F-01 kod. Plik reguł ma listę 14 kryteriów z opisami, kryteria obowiązkowe arkuszy A/B/C (§ 3, § 4), limit 3 kryteriów dodatkowych, cztery tematy rozmowy o kryteriach (§ 5 ust. 1) i terminy rozmowy: 30 dni (§ 7 pkt 1) albo 7 dni po ocenie negatywnej (§ 7 pkt 2), oba od dnia sporządzenia poprzedniej oceny. Brakuje: rodzajów obowiązków przy stanowiskach, tabeli „rodzaj obowiązku → kryterium”, karty rozmowy, ekranu części I i potwierdzeń.

Silnik już robi najtrudniejszą część walidacji i terminów; ten plaster to głównie ekran, zdarzenia i dane urzędu.

## Desired End State

Przy dacie systemowej 9.12.2024 Marek ma na ekranie startowym sprawę „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024 (§ 7 pkt 1)”. Ekran części I pokazuje arkusz C z podstawą (§ 3 ust. 4), 5 kryteriów obowiązkowych (§ 4), listę kryteriów do wyboru z trzema podpowiedziami ze zdaniem „dlaczego” i dopiskiem „ustawienie urzędu”, pole oczekiwań przy każdym kryterium oraz termin oceny 27.11.2026 z podstawą (z `effectiveDeadline(cycleId)`). Po przekazaniu Piotr widzi sprawę „Potwierdź część I oceny”, klika „Potwierdzam” i od tej chwili część I jest zablokowana. Do potwierdzenia Marek widzi „Część I czeka na potwierdzenie od X dni”. Cykle Ewy i Tomasza mają po `bun run seed` pełną, potwierdzoną część I. `bun test` przechodzi.

### Key Discoveries:

- `validateAdditionalCriteria(sheet, ids)` z `src/engine/scoring.ts` (dziś `sprawdzKryteriaDodatkowe` w `src/silnik/ocena.ts:37`): limit 3, bez powtórzeń, bez obowiązkowych. Używamy jej bez zmian, zamiast pisać drugą.
- `criteriaTalkDeadline(from, afterNegative)` z `src/engine/deadlines.ts` (dziś `src/silnik/terminy.ts:87`): 30 albo 7 dni z przesunięciem na dzień roboczy; dla Piotra (sporządzenie poprzedniej oceny 27.11.2024, wynik pozytywny) daje 27.12.2024.
- `nextAssessmentDeadline(start, 0)` daje dla 27.11.2024 termin 27.11.2026 (piątek); ekrany biorą go wyłącznie przez `effectiveDeadline(cycleId)`.
- Cztery tematy karty są przepisem, więc karta bierze je z pliku reguł (klucz tematów rozmowy o kryteriach po przemianowaniu w F-01), a nie z `content/cards.json`.

## What We're NOT Doing

- Oceny, wyniku, blokad zatwierdzenia i potwierdzenia zapoznania (S-02).
- Notatek, wejścia podpowiedzi dla notatki i karty rozmowy oceniającej (S-04).
- Ekranu kadr ze stanem cykli i wydruku arkusza (S-06).
- Nieobecności, zmiany oceniającego, osi czasu i przesunięcia terminu (S-03); termin z nieobecnościami dokłada S-03 w `effectiveDeadline`.
- Cofnięcia przekazania, zmiany terminu przez oceniającego (FR-012) i wpisu za ocenianego, gdy ten nie potwierdza (decyzja 10d: luka zostaje).
- Osobnego pola „cele” (temat 4 z § 5 ust. 1); patrz „Pytania otwarte”.
- Edycji rodzajów obowiązków przy stanowisku z ekranu; są wgrane skryptem.
- Stylów: wygląd pochodzi z design systemu autora (decyzja 10b). Ten plan nazywa ekrany, nie projektuje wyglądu; bez osobnych komponentów na każdy fragment ekranu.
- Modelu językowego i jakiejkolwiek usługi zewnętrznej.

## Implementation Approach

Stan części I wynika wyłącznie ze zdarzeń zwróconych przez `visibleEvents(cycleId)` (decyzja 10i); bez kolumny statusu. Wybór kryteriów i oczekiwania (szkic) leżą w `cycle_criteria` i zapisują się dopiero po kliknięciu „Zapisz” albo „Potwierdzam rozmowę i przekazuję część I”. Podpowiedzi nie są zaznaczone z góry: stoją na początku listy ze zdaniem „dlaczego”, a zaznacza je człowiek.

Podpowiedź kryteriów idzie przez wspólny moduł podpowiedzi `src/suggestions/index.ts` (AGENTS.md, zasada 5). S-01 zakłada ten plik z osobnym wejściem dla reguł kryteriów; S-04 dopisuje w nim wejście dla notatki. Ekran nie woła reguł bezpośrednio. Do wejścia trafiają tylko arkusz i identyfikatory obowiązków, bez nazwisk.

### Wersja minimalna (ok. 50 min, buduje się pierwsza)

Faza 1. Krok 1 pokazu działa do końca na dwóch kontach, plus wgrana część I Ewy i Tomasza:

1. `rules/office-settings.json` z czterema rodzajami obowiązków Piotra i `officeSettings()` (ok. 5 min).
2. `content/cards.json` z kartą `opening` (tytuł i cel) i `card(id)`; widok karty z czterema tematami z pliku reguł (ok. 5 min).
3. `sheetForPosition`, reguła podpowiedzi i wejście `src/suggestions/index.ts` z testami (ok. 8 min).
4. Kolumny `people.position_kind`, `people.duty_types` i moduł `src/seed/part1.ts` (ok. 7 min).
5. `src/cycles/part1.ts`: zapis, przekazanie w jednej transakcji, potwierdzenie, stan (ok. 10 min).
6. Trasy, jeden widok części I na zwykłym HTML, sprawy na ekranie startowym, odnośniki cyklu, testy tras z przejściem kroku 1 (ok. 15 min).

### Kolejność cięcia

Wszystko poza wersją minimalną to faza 2 (ok. 15 min), budowana w tej kolejności; przy braku czasu wypada od końca listy:

1. Zdanie „Część I czeka na potwierdzenie od X dni” na ekranie części I i w sprawie na ekranie startowym (`waitingDays`, `waitingDaysText`; decyzja 10d, z niego korzysta S-06).
2. Widok części I do odczytu dla kadr (w wersji minimalnej kadry dostają 403).
3. Rozszerzenie listy obowiązków do co najmniej 8 rodzajów.
4. Sekcje „pytania” i „trudne sytuacje” karty rozmowy (w wersji minimalnej zostają cel i cztery tematy z § 5 ust. 1).
5. Rozwijane opisy kryteriów z załącznika nr 1.

Nie tniemy (to jest wersja minimalna): arkusz C, podpowiedź ze zdaniem „dlaczego” przez moduł podpowiedzi, wybór do 3, oczekiwanie, karta z czterema tematami, przekazanie, potwierdzenie z automatycznym wpisem, blokada, `GET /cycles/:id` z odnośnikami cyklu i moduł `src/seed/part1.ts`. Moduł danych części I nie jest w kolejności cięcia, bo stoją na nim S-02, S-03, S-04 i S-06.

**Szacunek:** wersja minimalna ok. 50 min, faza 2 ok. 15 min, zrzuty 5 min.

## Założenia wobec wcześniejszych plastrów

Z F-01, wyłącznie nazwy z kontraktu wspólnego:

- **Tabele:** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`, `kind` = `mandatory` | `additional`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z kluczami `demo_date`, `office_city`, `office_name`. Terminu oceny nie ma w `cycles`.
- **Funkcje:** `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(...)` (tylko w danych), `visibleEvents(cycleId)`, `effectiveDeadline(cycleId)` z `src/cycles.ts` zwracające `{ date, basis: string[] }`, `homeTasks(person)` i `registerHomeTasks(fn)` z `src/home-tasks.ts`, `cycleLinks(cycle, person)` i `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()`, `createTestApp({ today })` z `src/test-helpers.ts`.
- **Silnik:** `mandatoryCriteria(sheet)`, `selectableCriteria(sheet)`, `validateAdditionalCriteria(sheet, ids)`, `criterion(id)` z `src/engine/scoring.ts`; `criteriaTalkDeadline(from, afterNegative)` z `src/engine/deadlines.ts`. Identyfikatory kryteriów jak w pliku reguł (np. `orientacja-na-klienta`).
- **Zdarzenie `cycle_started`** (dane F-01): `{ reason, periodStart, previousAssessmentOn, previousOutcome }`. `previousAssessmentOn` to dzień sporządzenia poprzedniej oceny, a `previousOutcome` to wartość `outcome` z `computeAssessment`.
- **Dane pokazowe (`src/seed/base.ts`):** osoby (w tym poprzedni naczelnik bez konta), data systemowa 2024-12-09, cykle Piotra (oceniający Marek, `period_start` 2024-11-27), Ewy (2024-11-20) i Tomasza (oceniająca Anna, 2024-11-12) ze zdarzeniami `cycle_started`; Piotr bez części I.
- **Trasy:** `GET /`, `GET/POST /account`, `POST /demo/date`; testy przez `app.request()` na `createTestApp({ today })`.

## Co ten plaster udostępnia

Dla S-02, S-03, S-04, S-05 i S-06, zgodnie z kontraktem wspólnym:

- **Rozszerzenie tabeli:** `people.position_kind` (`head_of_office` | `manager` | `staff`) i `people.duty_types` (JSON, identyfikatory z `rules/office-settings.json`). `cycles.sheet` wypełnia się przy zapisie części I.
- **`cycle_criteria`:** po `part1_submitted` cykl ma komplet: 5 albo 6 obowiązkowych plus 0–3 dodatkowe, z oczekiwaniami.
- **Zdarzenia** (zapis z ekranu przez `recordEvent`, czyli z datą `today()`):
  - `part1_submitted` — `actor_id` = oceniający; `payload: { sheet, criteria: [{ id, kind, expectation }], dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }`. `dueDate` i `dueDateBasis` to migawka `effectiveDeadline(cycleId)` w dniu przekazania (termin przekazany w części I, do wydruku); bieżący termin każdy ekran czyta z `effectiveDeadline(cycleId)`. Data zdarzenia = data rozmowy.
  - `part1_confirmed` — `actor_id` = oceniany; `payload: { place, appraiseeName }`.
- **Funkcje w `src/cycles/part1.ts`:** `part1Status(cycleId): { state: "not_started" | "draft" | "submitted" | "confirmed", submittedOn?, confirmedOn?, waitingDays? }` (`waitingDays` tylko dla `submitted`, od fazy 2); `cycleCriteria(cycleId)` (obowiązkowe, potem dodatkowe, z oczekiwaniem); `isPart1Locked(cycleId)` (prawda od `submitted`); `saveCriteria`, `submitPart1(cycleId, actorId, input)`, `confirmPart1(cycleId, actorId)`; `waitingDaysText(days)` (faza 2). S-02 blokuje ocenę bez `part1_confirmed`, S-04 przypina notatki do `cycleCriteria`, S-05 bierze datę rozmowy z `part1_submitted`, S-06 pokazuje stan z `part1Status`.
- **Silnik:** `sheetForPosition(kind): { sheet, basis }` i `suggestAdditionalCriteria(sheet, dutyTypeIds)` w `src/engine/criteria.ts`.
- **Moduł podpowiedzi:** `src/suggestions/index.ts` z wejściem `suggestCriteria(sheet, dutyTypeIds): { source: "rules", items: [{ criterionId, because }] }`. S-04 dopisuje w tym pliku wejście dla notatki i `suggestionMode()`.
- **Pliki wspólne:** `rules/office-settings.json` z `officeSettings()` (S-01 zakłada klucze `label`, `note`, `dutyTypes`, `dutyToCriterion`; kolejne plastry dopisują swoje) i `content/cards.json` z `card(id)` (S-01 zakłada klucz `opening`; `assessment` dopisuje S-04, `taskChange`, `appreciation`, `beforeMeeting` S-05).
- **Trasy:** `GET /cycles/:id` (przekierowuje na `part1`), `GET /cycles/:id/part1` (ekran wejściowy cyklu, pokazuje `cycleLinks(cycle, person)`; tu S-03, S-04, S-05 i S-06 dopinają odnośniki przez `registerCycleLinks`), `POST /cycles/:id/part1/{criteria,submit,confirm}`, `GET /cycles/:id/cards/opening`.
- **Sprawy na ekranie startowym** przez `registerHomeTasks`: oceniający „Wyznacz kryteria oceny: …”, oceniany „Potwierdź część I oceny”.
- **Dane pokazowe:** moduł `src/seed/part1.ts` (patrz faza 1, pkt 4).
- **Komponenty widoków** w `src/views/components.tsx`: `LegalBasis` (dopisek z przepisem przy dacie) i `ConfirmationBlock` (linie „Potwierdził: imię i nazwisko, miejscowość, data” albo „Jeszcze niepotwierdzone”); S-02 i S-06 używają `ConfirmationBlock`, zamiast tworzyć drugi.

## Phase 1: Wersja minimalna

### Overview

Krok 1 pokazu od sprawy na ekranie startowym Marka do zablokowanej części I po potwierdzeniu Piotra, plus pełna część I Ewy i Tomasza w danych pokazowych.

### Changes Required:

#### 1. Ustawienia urzędu

**File**: `rules/office-settings.json`, `src/office-settings.ts`

**Intent**: Lista rodzajów obowiązków i tabela „rodzaj obowiązku → kryterium” (decyzja 6b). Treść pisze implementujący (decyzja 10e). Na górze `label: "ustawienie urzędu"` i jedno zdanie, że nie pochodzi z przepisów ani z materiałów organizatora.

**Contract**: `{ label, note, dutyTypes: [{ id, name }], dutyToCriterion: { [dutyTypeId]: criterionId } }`. W wersji minimalnej cztery rodzaje: `client-service` („obsługa interesantów”) → `orientacja-na-klienta`; `analyses-and-reports` („przygotowywanie analiz i zestawień”) → myślenie analityczne; `inter-office-agreements` („uzgodnienia z innymi urzędami”) → negocjowanie; `official-correspondence` („prowadzenie korespondencji urzędowej”) → `komunikacja` (obowiązkowa w C, więc odpada w podpowiedzi). `officeSettings()` przy pierwszym odczycie sprawdza, że każdy `criterionId` istnieje w pliku reguł, i rzuca błąd, jeśli nie.

#### 2. Karta rozmowy rozpoczynającej

**File**: `content/cards.json`, `src/content.ts`

**Intent**: Treść karty z FR-005. Cztery wymagane tematy widok bierze z pliku reguł z podstawą § 5 ust. 1, nie z karty.

**Contract**: `{ opening: { title, purpose, questions?: string[], hardSituations?: [{ situation, whatToDo }] } }`; `questions` i `hardSituations` dochodzą w fazie 2. `card(id)` rzuca błąd dla nieznanego klucza. Bez słowa „podpis”.

#### 3. Dobór arkusza i podpowiedź kryteriów

**File**: `src/engine/criteria.ts`, `src/engine/criteria.test.ts`, `src/suggestions/index.ts`

**Intent**: Czyste funkcje bez bazy. Arkusz z rodzaju stanowiska według § 3. Reguła podpowiedzi: dla każdego rodzaju obowiązku kryterium z tabeli urzędu; odrzuca obowiązkowe dla arkusza i powtórki; gdy dwa obowiązki prowadzą do tego samego kryterium, zdanie „dlaczego” łączy ich nazwy. Ekran woła wyłącznie `suggestCriteria` z modułu podpowiedzi; to miejsce, w którym urząd mógłby podmienić źródło, a model nigdy nie zaznacza kryterium za człowieka.

**Contract**:
- `sheetForPosition(kind: "head_of_office" | "manager" | "staff"): { sheet: "A" | "B" | "C", basis }` z podstawą `§ 3 ust. 2`, `§ 3 ust. 3`, `§ 3 ust. 4`.
- `suggestAdditionalCriteria(sheet, dutyTypeIds): [{ criterionId, because }]`, gdzie `because` = `bo w opisie stanowiska jest obowiązek: obsługa interesantów`; kolejność jak w opisie stanowiska.
- `suggestCriteria(sheet, dutyTypeIds): { source: "rules", items }` w `src/suggestions/index.ts`, opakowuje regułę.

#### 4. Kolumny i dane części I

**File**: `src/db.ts`, `src/seed/part1.ts`, wpis modułu w `src/seed.ts`

**Intent**: Dołożyć `people.position_kind` i `people.duty_types`. Moduł `src/seed/part1.ts` (po `base.ts`):
- rodzaj stanowiska i obowiązki: Piotr `staff` z `client-service`, `analyses-and-reports`, `inter-office-agreements`, `official-correspondence` (trzy podpowiedzi, czwarta odpada jako obowiązkowa); Ewa `staff` z `client-service`; Tomasz, Marek, Anna `manager`;
- część I Ewy: arkusz C, 5 obowiązkowych plus `orientacja-na-klienta` (jest przy niej notatka z 12.12.2024), `part1_submitted` przez poprzedniego naczelnika 2024-12-02, `part1_confirmed` przez Ewę 2024-12-03;
- część I bieżącego cyklu Tomasza: arkusz B, 5 obowiązkowych, bez dodatkowych, `part1_submitted` przez Annę 2024-12-02, `part1_confirmed` przez Tomasza 2024-12-03.

Wiersze `cycle_criteria`, `cycles.sheet` i payloady składa ten sam kod co `submitPart1` i `confirmPart1`, a zdarzenia zapisuje `seedEvent(...)` z jawną datą. Cykl Piotra zostaje bez części I.

**Contract**: `bun run seed` kasuje i odtwarza bazę; zdarzenia części I Ewy i Tomasza mają daty sprzed 2024-12-09, więc są widoczne od początku pokazu. Moduł nie jest w kolejności cięcia.

#### 5. Logika części I

**File**: `src/cycles/part1.ts`, `src/cycles/part1.test.ts`

**Intent**: Zapis wyboru (kasuje i wstawia wiersze `cycle_criteria` cyklu: obowiązkowe z arkusza plus wybrane dodatkowe, z oczekiwaniami; ustawia `cycles.sheet`), przekazanie, potwierdzenie, stan z `visibleEvents(cycleId)`. Walidacja wyłącznie przez `validateAdditionalCriteria`. Po przekazaniu zapis jest odrzucany.

**Contract**:
- `saveCriteria(cycleId, actorId, input)` i `submitPart1(cycleId, actorId, input)`, gdzie `input = { additional: string[], expectations: Record<criterionId, string> }`; wynik `{ ok: true } | { ok: false, errors: string[] }`. Oba wymagają, by aktor był `cycles.appraiser_id`, a część I nie była zablokowana.
- `submitPart1` w jednej transakcji: waliduje `input`, zapisuje kryteria i tworzy `part1_submitted`; przy błędzie nie zapisuje nic. Payload: `place` z `settings.office_city`, `appraiserName` z `people.name`, `dueDate` i `dueDateBasis` z `effectiveDeadline(cycleId)`, `criteriaBasis` z podstaw arkusza i kryteriów, `rulesVersion` = `rulesVersion().version`.
- `confirmPart1(cycleId, actorId)`: tylko oceniany cyklu (`cycles.person_id`) i tylko w stanie `submitted`; zapisuje `part1_confirmed` z `place` z `settings.office_city` i `appraiseeName` z `people.name`.
- `part1Status`, `cycleCriteria`, `isPart1Locked` jak w „Co ten plaster udostępnia”.

#### 6. Trasy, widok, sprawy i odnośniki

**File**: `src/routes/cycle-start.tsx`, `src/views/part1.tsx`, `src/views/components.tsx`, wpięcie w `src/index.tsx`, `src/routes/cycle-start.test.tsx`

**Intent**: Jeden ekran części I zależny od konta i widok karty, w układzie `src/views/layout.tsx`, na zwykłym HTML z klasami (wygląd z design systemu, decyzja 10b). Brak konta → `/account`; osoba spoza cyklu (nie oceniający, nie oceniany) → 403. Na ekranie: arkusz z podstawą, obowiązkowe, lista do wyboru z podpowiedziami na początku (dopisek „Podpowiedź”, zdanie „dlaczego”, nad nimi zdanie „Podpowiedzi z tabeli urzędu „rodzaj obowiązku → kryterium” (ustawienie urzędu, nie przepis).”, checkboxy niezaznaczone), pole oczekiwania przy kryterium, termin oceny z `effectiveDeadline(cycleId)` z `LegalBasis`, `ConfirmationBlock`, odnośniki z `cycleLinks(cycle, person)`. Przy nazwisku Piotra żadnej etykiety ani liczby.

S-01 rejestruje:
- przez `registerCycleLinks`: „Karta rozmowy rozpoczynającej” → `/cycles/:id/cards/opening`;
- przez `registerHomeTasks`: dla oceniającego, gdy stan jest `not_started` albo `draft`, „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024” z podstawą. Termin: `criteriaTalkDeadline(from, afterNegative)`, gdzie dane bierze z widocznego `cycle_started`: `from` = `previousAssessmentOn`, a gdy go nie ma, `periodStart`; `afterNegative` = `previousOutcome === "negative"`. Podstawa (§ 7 pkt 1 albo pkt 2) z pliku reguł przy wartości, która zadziałała. Bez stałej liczby dni w kodzie plastra. Dla ocenianego w stanie `submitted`: „Potwierdź część I oceny”. Sprawy tylko z cykli, w których osoba jest oceniającym albo ocenianym.

**Contract**:
- `GET /cycles/:id` → 302 na `/cycles/:id/part1`.
- `GET /cycles/:id/part1` — oceniający przed przekazaniem: formularz; po przekazaniu i dla ocenianego: widok do odczytu (kryteria z migawki `part1_submitted`), u ocenianego w stanie `submitted` przycisk potwierdzenia.
- `POST /cycles/:id/part1/criteria` — pola `additional` (wiele) i `expectation[<criterionId>]`; błąd walidacji → 422 z formularzem i komunikatami z silnika; po przekazaniu → 409 z komunikatem „Część I jest już przekazana. Kryteriów i terminu nie można zmienić.”; sukces → 303 na `/cycles/:id/part1`.
- `POST /cycles/:id/part1/submit` — ten sam formularz (drugi przycisk z `formaction`), woła `submitPart1` z wartościami formularza; błąd → 422, sukces → 303.
- `POST /cycles/:id/part1/confirm` — inny niż oceniany → 403; stan inny niż `submitted` → 409; sukces → 303. Przycisk: „Potwierdzam rozmowę, kryteria i termin oceny”, pod nim: „Miejscowość, data i Twoje imię i nazwisko wpiszą się same.”
- `GET /cycles/:id/cards/opening` — tytuł, cel i cztery tematy z § 5 ust. 1.
- W żadnym renderowanym HTML nie ma ciągu „podpis”.

### Success Criteria:

#### Automated Verification:

- Testy doboru arkusza i podpowiedzi przechodzą: `bun test src/engine/criteria.test.ts`
- Testy logiki części I przechodzą: `bun test src/cycles/part1.test.ts`
- Testy tras i przejścia kroku 1 przechodzą: `bun test src/routes/cycle-start.test.tsx`
- Dane pokazowe wgrywają się bez błędu, z pełną częścią I Ewy i Tomasza: `bun run seed`
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 1 pokazu w przeglądarce: Marek przy dacie 9.12.2024 przekazuje część I, Piotr ją potwierdza, bez błędów

## Phase 2: Dopełnienie (po wersji minimalnej, w kolejności cięcia)

### Overview

Pozycje z „Kolejności cięcia”, budowane po kolei; każda kończy się zielonym `bun test`.

### Changes Required:

#### 1. Stan oczekiwania na potwierdzenie

**File**: `src/cycles/part1.ts`, `src/views/part1.tsx`, sprawa w `src/routes/cycle-start.tsx`

**Intent**: Oceniający w stanie `submitted` widzi na ekranie części I i w sprawie na ekranie startowym zdanie „Część I czeka na potwierdzenie od X dni” (decyzja 10d). Liczba stoi w zdaniu o stanie, nie przy nazwisku.

**Contract**: `waitingDays` = dni kalendarzowe między `submittedOn` a `today()`; `waitingDaysText(0)` = „od dziś”, `(1)` = „od 1 dnia”, `(n)` = „od n dni”.

#### 2. Widok do odczytu dla kadr

**File**: `src/routes/cycle-start.tsx`

**Intent**: Osoba z rolą `hr` dostaje `GET /cycles/:id/part1` w trybie do odczytu zamiast 403; zapis i potwierdzenie dalej 403.

#### 3. Pełna lista obowiązków

**File**: `rules/office-settings.json`

**Intent**: Co najmniej 8 rodzajów: dochodzą wystąpienia publiczne, sytuacje kryzysowe, usprawnienia (kreatywność), kierowanie zespołem (zarządzanie ludźmi).

#### 4. Pytania i trudne sytuacje na karcie

**File**: `content/cards.json`, widok karty

**Intent**: `questions` i `hardSituations` z jednym zdaniem „co zrobić”.

#### 5. Opisy kryteriów

**File**: `src/views/part1.tsx`

**Intent**: Opis kryterium z pliku reguł w rozwijanym `<details>`.

### Success Criteria:

#### Automated Verification:

- Testy stanu oczekiwania, widoku kadr i karty przechodzą: `bun test src/routes/cycle-start.test.tsx src/cycles/part1.test.ts`
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 1 pokazu w całości (Marek na komputerze, Piotr na telefonie) przechodzi w przeglądarce przy 1440 px i 360 px, na wyglądzie z design systemu autora

## Testing Strategy

### Unit Tests:

- `src/engine/criteria.test.ts`: `staff` → C, `manager` → B, `head_of_office` → A, każde z podstawą; podpowiedzi dla obowiązków Piotra dają dokładnie `orientacja-na-klienta`, myślenie analityczne i negocjowanie, bez komunikacji; dwa obowiązki do tego samego kryterium dają jedną podpowiedź ze złączonym zdaniem; `because` zaczyna się od „bo w opisie stanowiska jest obowiązek: ”; `suggestCriteria` zwraca `source: "rules"`; każde kryterium z `office-settings.json` istnieje w pliku reguł.
- `src/cycles/part1.test.ts`: zapis 2 dodatkowych daje 7 wierszy `cycle_criteria`; 4 dodatkowe, powtórka albo obowiązkowe → błędy z silnika i brak zapisu; `submitPart1` z błędnym `input` nie zapisuje ani kryteriów, ani zdarzenia; `submitPart1` z poprawnym zapisuje kryteria z formularza i jedno `part1_submitted`, którego `dueDate` równa się `effectiveDeadline(cycleId).date`; `part1Status` przechodzi `not_started` → `draft` → `submitted` → `confirmed`; zdarzenie z datą późniejszą niż `today()` nie zmienia stanu (decyzja 10i); termin rozmowy: `cycle_started` z `previousOutcome` negatywnym i `previousAssessmentOn` innym niż `periodStart` daje 7 dni od `previousAssessmentOn` (§ 7 pkt 2), z pozytywnym 30 dni (§ 7 pkt 1); faza 2: `waitingDaysText` dla 0, 1, 2, 5.

### Integration Tests:

`src/routes/cycle-start.test.tsx` przez `app.request()` na `createTestApp({ today: "2024-12-09" })`:

- Marek, `GET /`: sprawa z „27.12.2024” i „§ 7 pkt 1”.
- Marek, `GET /cycles/<Piotr>` → przekierowanie na `/cycles/<Piotr>/part1`.
- Marek, `GET /cycles/<Piotr>/part1`: „Arkusz C”, 5 kryteriów obowiązkowych, 3 razy „bo w opisie stanowiska jest obowiązek”, „ustawienie urzędu”, „27.11.2026”, żaden checkbox nie jest zaznaczony, odnośnik do karty rozmowy.
- `POST …/criteria` z 4 dodatkowymi → 422 i komunikat o limicie 3; z `orientacja-na-klienta`, myśleniem analitycznym i oczekiwaniem → 303, wiersze w bazie.
- `GET …/cards/opening`: cztery tematy z § 5 ust. 1.
- `POST …/submit` → `part1_submitted` z `dueDate` 2026-11-27, `place`, `appraiserName`, `rulesVersion`; potem `POST …/criteria` → 409.
- Ewa, `POST …/confirm` na cyklu Piotra → 403. Piotr, `GET /`: sprawa „Potwierdź część I oceny”. Piotr, `POST …/confirm` → 303, zdarzenie z datą 2024-12-09, miejscowością i nazwiskiem; drugi `POST …/confirm` → 409.
- Po wgraniu: `part1Status` cykli Ewy i Tomasza = `confirmed`, `cycleCriteria` Ewy zawiera `orientacja-na-klienta`.
- Faza 2: po przekazaniu `POST /demo/date` na 2024-12-11 → Marek widzi „od 2 dni”; Joanna `GET …/part1` → 200 do odczytu.
- Żaden z ekranów plastra nie zawiera „podpis” (tekst odpowiedzi, bez rozróżniania wielkości liter).

### Manual Testing Steps:

1. `bun run seed`, `bun run dev`.
2. Konto Marka, 9.12.2024: sprawa „Wyznacz kryteria oceny”, ekran części I, wybór `orientacja-na-klienta` i myślenia analitycznego, oczekiwanie przy jednym, karta rozmowy, przekazanie.
3. Konto Piotra w oknie 360 px: sprawa, potwierdzenie, automatyczny wpis, brak pól do edycji.
4. Konto Marka: część I zablokowana, dwie linie potwierdzenia.

## Pytania otwarte

Dokumenty tego nie rozstrzygają; podany wariant domyślny obowiązuje, dopóki autor nie zdecyduje inaczej.

1. **Czy oceniający może cofnąć przekazanie przed potwierdzeniem?** Domyślnie nie: po przekazaniu część I jest tylko do odczytu, także dla oceniającego.
2. **Czy przekazanie wymaga choć jednego oczekiwania?** Domyślnie nie (FR-004: „może zapisać”); pokaz i tak wpisuje jedno.
3. **Pole „cele” (temat 4 z § 5 ust. 1).** Domyślnie bez osobnego pola; karta wymienia temat, a cele można wpisać w oczekiwaniach. Jeśli S-06 potrzebuje pola do wydruku, pokazuje je jako puste.
4. **Data rozmowy.** Domyślnie dzień przekazania (`date` zdarzenia `part1_submitted`); bez osobnego pola daty.

## References

- `context/changes/rules-engine-and-demo-data/plan.md`, rozdział „Kontrakt wspólny dla wszystkich plastrów”
- `context/foundation/decisions.md` (decyzje 5a, 6b, 9, 10b, 10d, 10e, 10i, 11b)
- `context/foundation/prd.md` (US-01, US-02, FR-001–FR-007, Business Logic, Access Control)
- `context/foundation/roadmap.md` (S-01)
- `context/foundation/demo.md` (krok 1, „Daty w danych pokazowych”, „Ustalenia do scenariusza”)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wersja minimalna

#### Automated

- [ ] 1.1 Testy doboru arkusza i podpowiedzi przechodzą: `bun test src/engine/criteria.test.ts`
- [ ] 1.2 Testy logiki części I przechodzą: `bun test src/cycles/part1.test.ts`
- [ ] 1.3 Testy tras i przejścia kroku 1 przechodzą: `bun test src/routes/cycle-start.test.tsx`
- [ ] 1.4 Dane pokazowe wgrywają się bez błędu, z pełną częścią I Ewy i Tomasza: `bun run seed`
- [ ] 1.5 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 1.6 Krok 1 pokazu w przeglądarce: Marek przy dacie 9.12.2024 przekazuje część I, Piotr ją potwierdza, bez błędów

### Phase 2: Dopełnienie (po wersji minimalnej, w kolejności cięcia)

#### Automated

- [ ] 2.1 Testy stanu oczekiwania, widoku kadr i karty przechodzą: `bun test src/routes/cycle-start.test.tsx src/cycles/part1.test.ts`
- [ ] 2.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.3 Krok 1 pokazu w całości (Marek na komputerze, Piotr na telefonie) przechodzi w przeglądarce przy 1440 px i 360 px, na wyglądzie z design systemu autora
