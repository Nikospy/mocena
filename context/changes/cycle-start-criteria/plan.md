# Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I — plan wdrożenia

## Overview

Krok 1 pokazu. Marek otwiera cykl Piotra, widzi arkusz C z kryteriami obowiązkowymi, wybiera 2 kryteria dodatkowe z podpowiedzią „bo w opisie stanowiska jest obowiązek: …”, wpisuje oczekiwanie, otwiera kartę rozmowy rozpoczynającej i przekazuje część I. Piotr na telefonie potwierdza; miejscowość, data i nazwisko wpisują się same. Kryteria i termin są zablokowane już od przekazania (uproszczenie zapisane w kontrakcie wspólnym, część „Zasady wspólne tras”). Plaster pokrywa US-01, US-02 i FR-001–FR-007 oraz wgrywa pełną część I Ewy i Tomasza, na której stoją kolejne plastry.

## Current State Analysis

Stan przed tym plastrem to wynik F-01. Wszystkie nazwy tabel, funkcji, zdarzeń, tras i plików wspólnych pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`; przy rozjeździe wygrywa ten rozdział, a po zbudowaniu F-01 kod. Plik reguł ma listę 14 kryteriów z opisami, kryteria obowiązkowe arkuszy A/B/C (§ 3, § 4), limit 3 kryteriów dodatkowych, cztery tematy rozmowy o kryteriach (§ 5 ust. 1, klucz `criteriaConversation` z polami `basis` i `topics`) i terminy rozmowy: 30 dni (§ 7 pkt 1, `deadlines.criteriaTalkDays`) albo 7 dni po ocenie negatywnej (§ 7 pkt 2, `deadlines.criteriaTalkAfterNegativeDays`), oba od dnia sporządzenia poprzedniej oceny; każdy klucz terminu ma `value`, `basis` i `from`. Brakuje: rodzajów obowiązków przy stanowiskach, tabeli „rodzaj obowiązku → kryterium”, karty rozmowy, ekranu części I i potwierdzeń.

Silnik już robi najtrudniejszą część walidacji i terminów; ten plaster to głównie ekran, zdarzenia i dane urzędu.

## Desired End State

Przy dacie systemowej 9.12.2024 Marek ma na ekranie startowym sprawę „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024 (§ 7 pkt 1)”. Ekran części I pokazuje arkusz C z podstawą (§ 3 ust. 4), 5 kryteriów obowiązkowych (§ 4), listę kryteriów do wyboru z trzema podpowiedziami ze zdaniem „dlaczego” i dopiskiem „ustawienie urzędu”, pole oczekiwań przy każdym kryterium oraz termin oceny 27.11.2026 z podstawą (przed przekazaniem z `effectiveDeadline(cycleId)`, po przekazaniu z `part1_submitted.payload.dueDate` jako „Termin przekazany w części I”). Od przekazania część I jest zablokowana (kontrakt wspólny, „Zasady wspólne tras”). Piotr widzi sprawę „Potwierdź część I oceny”, klika „Potwierdzam” i pod częścią I stoją dwie linie potwierdzenia. Do potwierdzenia Marek widzi „Część I czeka na potwierdzenie od X dni”. Cykle Ewy i Tomasza mają po `bun run seed` pełną, potwierdzoną część I; z opcją `afterStep1` (`bun run seed -- --after-step-1`) także cykl Piotra, tak jak po kroku 1 pokazu. `bun test` przechodzi.

### Key Discoveries:

- `validateAdditionalCriteria(sheet, ids)` z `src/engine/scoring.ts` (dziś `sprawdzKryteriaDodatkowe` w `src/silnik/ocena.ts:37`): limit 3, bez powtórzeń, bez obowiązkowych. Używamy jej bez zmian, zamiast pisać drugą.
- `criteriaTalkDeadline(from, afterNegative)` z `src/engine/deadlines.ts` (dziś `src/silnik/terminy.ts:87`): 30 albo 7 dni z przesunięciem na dzień roboczy; dla Piotra (sporządzenie poprzedniej oceny 27.11.2024, wynik pozytywny) daje 27.12.2024.
- `nextAssessmentDeadline(start, 0)` daje dla 27.11.2024 termin 27.11.2026 (piątek); ekrany biorą go przez `effectiveDeadline(cycleId)`, a po przekazaniu części I jej ekran pokazuje termin przekazany ocenianemu z `part1_submitted.payload.dueDate` (tabela „Skąd ekran bierze termin oceny” w kontrakcie).
- Cztery tematy karty są przepisem, więc karta bierze je z pliku reguł (`criteriaConversation.topics`, podstawa z `criteriaConversation.basis`), a nie z `content/cards.json`.

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
4. Kolumny `people.position_kind`, `people.duty_types` i moduł `src/seed/part1.ts` z opcją `afterStep1` (ok. 7 min).
5. `src/cycles/part1.ts`: `savePart1` (sam zapis), `submitPart1` (uprawnienia i przekazanie w jednej transakcji), potwierdzenie, stan (ok. 10 min).
6. Trasy, jeden widok części I na zwykłym HTML, `LegalBasis` i `ConfirmationBlock` z oboma wariantami (`confirmation` i `fiction`) z testem renderowania każdego, sprawy na ekranie startowym, odnośniki cyklu (bez odnośnika dla `hr`), testy tras z przejściem kroku 1 (ok. 15 min).

### Kolejność cięcia

Wszystko poza wersją minimalną to faza 2 (ok. 15 min), budowana w tej kolejności; przy braku czasu wypada od końca listy:

1. Zdanie „Część I czeka na potwierdzenie od X dni” na ekranie części I i w sprawie na ekranie startowym (`waitingDays`, `waitingDaysText`; decyzja 10d). S-06 od tego nie zależy: liczy dni sam z daty `part1_submitted`.
2. Widok części I do odczytu dla kadr wraz z odnośnikiem cyklu „Część I” dla roli `hr` (w wersji minimalnej kadry dostają 403 i nie mają odnośnika).
3. Rozszerzenie listy obowiązków do co najmniej 8 rodzajów.
4. Sekcje „pytania” i „trudne sytuacje” karty rozmowy (w wersji minimalnej zostają cel i cztery tematy z § 5 ust. 1).
5. Rozwijane opisy kryteriów z załącznika nr 1.

Nie tniemy (to jest wersja minimalna): arkusz C, podpowiedź ze zdaniem „dlaczego” przez moduł podpowiedzi, wybór do 3, oczekiwanie, karta z czterema tematami, przekazanie, potwierdzenie z automatycznym wpisem, `ConfirmationBlock` z oboma wariantami (używają go S-02 i S-06), blokada, `GET /cycles/:id` z odnośnikami cyklu i moduł `src/seed/part1.ts` z opcją `afterStep1`. Moduł danych części I nie jest w kolejności cięcia, bo stoją na nim S-02, S-03, S-04 i S-06 (opcja `afterStep1` służy ich testom od późniejszych dat).

**Szacunek:** wersja minimalna ok. 50 min, faza 2 ok. 15 min, zrzuty 5 min.

## Założenia wobec wcześniejszych plastrów

Z F-01, wyłącznie nazwy z kontraktu wspólnego:

- **Tabele:** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`, `kind` = `mandatory` | `additional`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z kluczami `demo_date`, `office_city`, `office_name`. Terminu oceny nie ma w `cycles`.
- **Funkcje:** `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(type, cycleId, actorId, payload, date)` (data jest ostatnim argumentem; tylko w danych pokazowych i przygotowaniu testów), `getDb()` z `src/db.ts` (jedyne źródło połączenia; funkcje tego plastra nie biorą argumentu `db`), `visibleEvents(cycleId, { asOf })`, `effectiveDeadline(cycleId, { asOf })` z `src/cycles.ts` zwracające `{ date, basis: string[] }`, `openCycle(personId)` z `src/cycles.ts` (jedyne źródło „cyklu osoby”), `setting(key)`, `homeTasks(person)` i `registerHomeTasks(fn)` z `src/home-tasks.ts`, `cycleLinks(cycle, person)` i `registerCycleLinks(fn)` z `src/cycle-links.ts`, `rulesVersion()`, `createTestApp({ today, seedOptions })` z `src/test-helpers.ts`, `runSeed(db, options)` z `src/seed.ts`.
- **Silnik:** `mandatoryCriteria(sheet)`, `selectableCriteria(sheet)`, `validateAdditionalCriteria(sheet, ids)`, `criterion(id)` z `src/engine/scoring.ts`; `criteriaTalkDeadline(from, afterNegative)` z `src/engine/deadlines.ts`. Identyfikatory kryteriów jak w pliku reguł (np. `orientacja-na-klienta`).
- **Zdarzenie `cycle_started`** (dane F-01): `{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`; `reason`: `hired`, `appointed` albo `previous_assessment`; `previousOutcome`: `positive`, `negative` albo `null`. `previousAssessmentOn` to dzień sporządzenia poprzedniej oceny, `previousAcknowledgedOn` dzień zapoznania z nią.
- **Dane pokazowe (`src/seed/base.ts`):** osoby (w tym poprzedni naczelnik bez konta), data systemowa 2024-12-09, cykle Piotra (oceniający Marek, `period_start` 2024-11-27), Ewy (oceniający od początku Marek, 2024-11-20) i Tomasza (oceniająca Anna, 2024-11-12) ze zdarzeniami `cycle_started`; Piotr bez części I. `runSeed(db, options)` ustawia połączenie przez `setDb(db)`, woła moduły w kolejności `base`, `part1`, `notes`, `assessments`, `absences` i przekazuje im opcje; brakująca opcja ma wartość `false`.
- **Trasy:** `GET /`, `GET/POST /account`, `POST /demo/date`; testy przez `app.request()` na `createTestApp({ today, seedOptions })`. Zasady odpowiedzi tras i blokada części I od przekazania według części „Zasady wspólne tras” kontraktu: 303 tylko po udanym `POST`, który coś zapisuje; 302 dla `GET /cycles/:id`; błąd walidacji zawsze 422 z formularzem (nigdy 400); 403 brak uprawnień; 409 zamknięty krok.

## Co ten plaster udostępnia

Dla S-02, S-03, S-04, S-05 i S-06, zgodnie z kontraktem wspólnym:

- **Rozszerzenie tabeli:** `people.position_kind` (`head_of_office` | `manager` | `staff`) i `people.duty_types` (JSON, identyfikatory z `rules/office-settings.json`). `position_kind` jest ustawione dla każdej osoby z `src/seed/base.ts`. `cycles.sheet` wypełnia `savePart1` arkuszem dobranym z `people.position_kind` ocenianego przez `sheetForPosition`.
- **`cycle_criteria`:** po `part1_submitted` cykl ma komplet: 5 albo 6 obowiązkowych plus 0–3 dodatkowe, z oczekiwaniami.
- **Zdarzenia** (z ekranu z datą `today()`; w danych pokazowych z jawną datą historyczną):
  - `part1_submitted` — zapisuje je wyłącznie `savePart1`; `actor_id` = aktor podany do `savePart1` (z ekranu bieżący oceniający, w danych Ewy poprzedni naczelnik); `payload: { sheet, criteria: [{ id, kind, expectation }], dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }`; `rulesVersion` to cały obiekt `{ version, effectiveFrom, act }` z `rulesVersion()`, tak samo jak w migawce oceny. `dueDate` i `dueDateBasis` to migawka `effectiveDeadline(cycleId)` w dniu przekazania: termin przekazany ocenianemu w części I. Pokazują go ekran części I po przekazaniu („Termin przekazany w części I”) i wydruk części I; przed przekazaniem ekran części I, a także `/hr` i oś czasu czytają `effectiveDeadline(cycleId)` (tabela „Skąd ekran bierze termin oceny” w kontrakcie). Data zdarzenia = data rozmowy.
  - `part1_confirmed` — `actor_id` = oceniany; `payload: { place, appraiseeName }`.
- **Funkcje w `src/cycles/part1.ts`:** `part1Status(cycleId): { state: "not_started" | "draft" | "submitted" | "confirmed", submittedOn?, confirmedOn?, waitingDays? }` (`waitingDays` tylko dla `submitted`, od fazy 2); `cycleCriteria(cycleId)` (obowiązkowe, potem dodatkowe, z oczekiwaniem); `isPart1Locked(cycleId)` (prawda od `submitted`); `saveCriteria`, `savePart1(cycleId, actorId, input, date)` (sam zapis, bez sprawdzania aktora; arkusz dobiera z `people.position_kind` przez `sheetForPosition` i zapisuje w `cycles.sheet`, bez argumentu arkusza; woła go `submitPart1` i moduły danych pokazowych), `submitPart1(cycleId, actorId, input)` (sprawdza, że aktor jest bieżącym `cycles.appraiser_id`), `confirmPart1(cycleId, actorId)`; `waitingDaysText(days)` (faza 2). S-02 blokuje ocenę bez `part1_confirmed`, S-04 przypina notatki do `cycleCriteria`, S-05 bierze datę rozmowy z `part1_submitted`, S-06 pokazuje stan z `part1Status`.
- **Silnik:** `sheetForPosition(kind): { sheet, basis }` i `suggestAdditionalCriteria(sheet, dutyTypeIds)` w `src/engine/criteria.ts`.
- **Moduł podpowiedzi:** `src/suggestions/index.ts` z wejściem `suggestCriteria(sheet, dutyTypeIds): { source: "rules", items: [{ criterionId, because }] }`. S-04 dopisuje w tym pliku wejście dla notatki i `suggestionMode()`.
- **Pliki wspólne:** `rules/office-settings.json` z `officeSettings()` (S-01 zakłada klucze `label`, `note`, `dutyTypes`, `dutyToCriterion`; kolejne plastry dopisują swoje) i `content/cards.json` z `card(id)` (S-01 zakłada klucz `opening`; `assessment` dopisuje S-04, `taskChange`, `appreciation`, `beforeMeeting` S-05).
- **Trasy:** `GET /cycles/:id` (302 na `part1`), `GET /cycles/:id/part1` (ekran wejściowy cyklu, pokazuje `cycleLinks(cycle, person)`; tu S-03, S-04, S-05 i S-06 dopinają odnośniki przez `registerCycleLinks`), `POST /cycles/:id/part1/{criteria,submit,confirm}`, `GET /cycles/:id/cards/opening`.
- **Odnośniki cyklu** przez `registerCycleLinks`, według zasady kontraktu: plaster rejestruje odnośnik tylko dla ról, które jego trasa `GET` wpuszcza. Wersja minimalna: „Karta rozmowy rozpoczynającej” dla oceniającego i ocenianego cyklu; dla `hr` żadnego odnośnika, bo `GET /cycles/:id/part1` zwraca kadrom 403. Odnośnik „Część I” dla roli `hr` (widoczny też w wierszu cyklu na `/hr`) dochodzi dopiero z widokiem do odczytu dla kadr (faza 2, pkt 2).
- **Sprawy na ekranie startowym** przez `registerHomeTasks`: oceniający „Wyznacz kryteria oceny: …”, oceniany „Potwierdź część I oceny”.
- **Dane pokazowe:** moduł `src/seed/part1.ts` z opcją `afterStep1` (patrz faza 1, pkt 4).
- **Komponenty widoków** w `src/views/components.tsx` (tworzy je S-01, w wersji minimalnej): `LegalBasis` (dopisek z przepisem przy dacie) i `ConfirmationBlock`, czysty komponent widoku bez dostępu do bazy, od początku z oboma wariantami:
  - `kind: "confirmation"` z `name, place, date`: linia „Potwierdzenie w systemie: <miejscowość>, <DD.MM.RRRR>, <imię i nazwisko>” (jedna treść dla ekranów i wydruku, kontrakt), a bez danych „Jeszcze niepotwierdzone”;
  - `kind: "fiction"` z `name, reason, deliveryMethod, deliveredOn, date`: wpis o fikcji zapoznania (przyczyna, sposób i dzień doręczenia, data wpisu).
  S-02 i S-06 tylko używają `ConfirmationBlock`; nikt nie tworzy drugiego bloku ani nie dopisuje wariantu.

## Phase 1: Wersja minimalna

### Overview

Krok 1 pokazu od sprawy na ekranie startowym Marka do zablokowanej części I po potwierdzeniu Piotra, plus pełna część I Ewy i Tomasza w danych pokazowych.

### Changes Required:

#### 1. Ustawienia urzędu

**File**: `rules/office-settings.json`, `src/office-settings.ts`

**Intent**: Lista rodzajów obowiązków i tabela „rodzaj obowiązku → kryterium” (decyzja 6b). Treść pisze implementujący (decyzja 10e). Na górze `label: "ustawienie urzędu"` i jedno zdanie, że nie pochodzi z przepisów ani z materiałów organizatora.

**Contract**: `{ label, note, dutyTypes: [{ id, name }], dutyToCriterion: { [dutyTypeId]: criterionId } }`. W wersji minimalnej cztery rodzaje: `client-service` („obsługa interesantów”) → `orientacja-na-klienta`; `analyses-and-reports` („przygotowywanie analiz i zestawień”) → `myslenie-analityczne`; `inter-office-agreements` („uzgodnienia z innymi urzędami”) → `negocjowanie`; `official-correspondence` („prowadzenie korespondencji urzędowej”) → `komunikacja` (obowiązkowa w C, więc odpada w podpowiedzi). `officeSettings()` przy pierwszym odczycie sprawdza, że każdy `criterionId` istnieje w pliku reguł, i rzuca błąd, jeśli nie.

#### 2. Karta rozmowy rozpoczynającej

**File**: `content/cards.json`, `src/content.ts`

**Intent**: Treść karty z FR-005. Cztery wymagane tematy widok bierze z pliku reguł (`criteriaConversation.topics`, podstawa § 5 ust. 1 z `criteriaConversation.basis`), nie z karty.

**Contract**: `{ opening: { title, purpose, questions?: string[], hardSituations?: [{ situation, whatToDo }] } }`; `questions` i `hardSituations` dochodzą w fazie 2. `card(id)` rzuca błąd dla nieznanego klucza. Bez słowa „podpis”.

#### 3. Dobór arkusza i podpowiedź kryteriów

**File**: `src/engine/criteria.ts`, `src/engine/criteria.test.ts`, `src/suggestions/index.ts`

**Intent**: Czyste funkcje bez bazy. Arkusz z rodzaju stanowiska według § 3. Reguła podpowiedzi: dla każdego rodzaju obowiązku kryterium z tabeli urzędu; odrzuca obowiązkowe dla arkusza i powtórki; gdy dwa obowiązki prowadzą do tego samego kryterium, zdanie „dlaczego” łączy ich nazwy. Ekran woła wyłącznie `suggestCriteria` z modułu podpowiedzi; to miejsce, w którym urząd mógłby podmienić źródło, a model nigdy nie zaznacza kryterium za człowieka.

**Contract**:
- `sheetForPosition(kind: "head_of_office" | "manager" | "staff"): { sheet: "A" | "B" | "C", basis }` z podstawą `§ 3 ust. 2`, `§ 3 ust. 3`, `§ 3 ust. 4`.
- `suggestAdditionalCriteria(sheet, dutyTypeIds): [{ criterionId, because }]`, gdzie `because` = `bo w opisie stanowiska jest obowiązek: obsługa interesantów`; kolejność jak w opisie stanowiska.
- `suggestCriteria(sheet, dutyTypeIds): { source: "rules", items }` w `src/suggestions/index.ts`, opakowuje regułę.

#### 4. Kolumny i dane części I

**File**: `src/db.ts`, `src/seed/part1.ts`, jedno wywołanie modułu w `runSeed(db, options)` w `src/seed.ts` (zaraz po `base`), `src/seed/part1.test.ts`

**Intent**: Dołożyć `people.position_kind` i `people.duty_types`. Moduł `src/seed/part1.ts` (po `base.ts`):
- rodzaj stanowiska (`position_kind`) dla każdej osoby utworzonej w `src/seed/base.ts`, bez wyjątku, także dla osób bez konta i dla tych, których historyczne cykle wgrywa później S-06 (`savePart1` i dane S-06 dobierają z niego arkusz): `staff` mają Piotr, Ewa, Maria, Joanna, administrator i Katarzyna Lewandowska (arkusz C, jej zamknięty cykl wgrywa S-06); `manager` mają Marek, Anna, Tomasz (także jego poprzedni cykl z danych S-06), poprzedni naczelnik i dyrektor generalny urzędu. Test modułu sprawdza, że żadna osoba nie ma pustego `position_kind`;
- obowiązki (`duty_types`): Piotr `client-service`, `analyses-and-reports`, `inter-office-agreements`, `official-correspondence` (trzy podpowiedzi, czwarta odpada jako obowiązkowa); Ewa `client-service`; pozostali pusta lista;
- część I Ewy: arkusz C, 5 obowiązkowych plus `orientacja-na-klienta` (jest przy niej notatka z 12.12.2024); `savePart1` z aktorem = poprzedni naczelnik i datą 2024-12-02, potem `part1_confirmed` przez Ewę 2024-12-03. `cycles.appraiser_id` Ewy to od początku Marek (F-01, `src/seed/base.ts`); dlatego zapis idzie przez `savePart1`, który nie sprawdza aktora, a nie przez `submitPart1`;
- część I bieżącego cyklu Tomasza: arkusz B, 5 obowiązkowych, bez dodatkowych; `savePart1` z aktorem = Anna i datą 2024-12-02, potem `part1_confirmed` przez Tomasza 2024-12-03;
- z opcją `afterStep1` (z wiersza poleceń `--after-step-1`, w testach `createTestApp({ today, seedOptions: { afterStep1: true } })`) także część I Piotra tak, jak po kroku 1 pokazu: arkusz C, 5 obowiązkowych plus `orientacja-na-klienta` i `myslenie-analityczne`, oczekiwanie przy jednym z nich; `savePart1` z aktorem = Marek i datą 2024-12-09, potem `part1_confirmed` przez Piotra 2024-12-09. Bez opcji (brakująca opcja ma wartość `false`) cykl Piotra zostaje bez części I.

Zdarzenie `part1_confirmed` zapisuje `seedEvent("part1_confirmed", cycleId, actorId, { place, appraiseeName }, date)` z jawną datą jako ostatnim argumentem (miejscowość z `settings.office_city`, nazwisko z `people.name`).

**Contract**: moduł jest wołany wyłącznie z `runSeed(db, options)`, które wcześniej ustawia połączenie przez `setDb(db)`; moduł i `savePart1` piszą przez `getDb()` z `src/db.ts`, bez własnego argumentu `db`. `bun run seed` kasuje i odtwarza bazę; zdarzenia części I Ewy i Tomasza mają daty sprzed 2024-12-09, więc są widoczne od początku pokazu. Opcja `afterStep1` dochodzi do modułu przez `runSeed(db, options)`. Moduł nie jest w kolejności cięcia.

#### 5. Logika części I

**File**: `src/cycles/part1.ts`, `src/cycles/part1.test.ts`

**Intent**: Zapis wyboru (kasuje i wstawia wiersze `cycle_criteria` cyklu: obowiązkowe z arkusza plus wybrane dodatkowe, z oczekiwaniami; arkusz zawsze z `sheetForPosition(people.position_kind)` ocenianego, nigdy z argumentu), przekazanie, potwierdzenie, stan z `visibleEvents(cycleId)`. Walidacja wyłącznie przez `validateAdditionalCriteria`. Po przekazaniu zapis jest odrzucany (blokada od przekazania według części „Zasady wspólne tras” kontraktu). Zapis części I jest oddzielony od uprawnień: `savePart1` tylko zapisuje, `submitPart1` sprawdza i woła `savePart1`.

**Contract**:
- `input = { additional: string[], expectations: Record<criterionId, string> }`; wynik `saveCriteria` i `submitPart1`: `{ ok: true } | { ok: false, errors: string[] }`.
- `saveCriteria(cycleId, actorId, input)`: szkic; wymaga, by aktor był bieżącym `cycles.appraiser_id`, a część I nie była zablokowana.
- `savePart1(cycleId, actorId, input, date)`: nie przyjmuje arkusza; dobiera go z `people.position_kind` ocenianego (`cycles.person_id`) przez `sheetForPosition` i zapisuje w `cycles.sheet`, potem zapisuje wiersze `cycle_criteria` i zdarzenie `part1_submitted` z `actor_id` = `actorId` i datą `date`. Pisze przez `getDb()`. Nie sprawdza aktora ani stanu. Payload: `sheet` z `sheetForPosition`, `place` z `settings.office_city`, `appraiserName` z `people.name` aktora, `dueDate` i `dueDateBasis` z `effectiveDeadline(cycleId, { asOf: date })`, `criteriaBasis` z podstaw arkusza i kryteriów, `rulesVersion` = cały obiekt `rulesVersion()`, czyli `{ version, effectiveFrom, act }`. Wołają go tylko `submitPart1` i moduły danych pokazowych w `src/seed/` (S-01: `src/seed/part1.ts`).
- `submitPart1(cycleId, actorId, input)`: w jednej transakcji sprawdza, że aktor jest bieżącym `cycles.appraiser_id`, że część I nie jest zablokowana i że `input` przechodzi `validateAdditionalCriteria`, po czym woła `savePart1(cycleId, actorId, input, today())`; przy błędzie nie zapisuje nic.
- `confirmPart1(cycleId, actorId)`: tylko oceniany cyklu (`cycles.person_id`) i tylko w stanie `submitted`; zapisuje `part1_confirmed` z `place` z `settings.office_city` i `appraiseeName` z `people.name`.
- `part1Status`, `cycleCriteria`, `isPart1Locked` jak w „Co ten plaster udostępnia”.

#### 6. Trasy, widok, sprawy i odnośniki

**File**: `src/routes/cycle-start.tsx`, `src/views/part1.tsx`, `src/views/components.tsx`, `src/views/components.test.tsx`, wpięcie w `src/index.tsx`, `src/routes/cycle-start.test.tsx`

**Intent**: Jeden ekran części I zależny od konta i widok karty, w układzie `src/views/layout.tsx`, na zwykłym HTML z klasami (wygląd z design systemu, decyzja 10b). Brak konta → `/account`; osoba spoza cyklu (nie oceniający, nie oceniany) → 403. Na ekranie: arkusz z podstawą, obowiązkowe, lista do wyboru z podpowiedziami na początku (dopisek „Podpowiedź”, zdanie „dlaczego”, nad nimi zdanie „Podpowiedzi z tabeli urzędu „rodzaj obowiązku → kryterium” (ustawienie urzędu, nie przepis).”, checkboxy niezaznaczone), pole oczekiwania przy kryterium, termin oceny z `LegalBasis`, `ConfirmationBlock` (wariant `confirmation`), odnośniki z `cycleLinks(cycle, person)`. Termin oceny według tabeli „Skąd ekran bierze termin oceny” w kontrakcie: przed przekazaniem części I `effectiveDeadline(cycleId)` (data i `basis`) z etykietą „Termin oceny”; po przekazaniu `part1_submitted.payload.dueDate` i `dueDateBasis` z etykietą „Termin przekazany w części I”. Przy nazwisku Piotra żadnej etykiety ani liczby.

`ConfirmationBlock` powstaje w wersji minimalnej z oboma wariantami (`kind: "confirmation"` z `name, place, date` i `kind: "fiction"` z `name, reason, deliveryMethod, deliveredOn, date`). To czysty komponent widoku: dostaje dane w właściwościach, nie czyta bazy. Ekran części I używa tylko wariantu `confirmation`; wariantu `fiction` używają S-02 i S-06.

S-01 rejestruje:
- przez `registerCycleLinks`: „Karta rozmowy rozpoczynającej” → `/cycles/:id/cards/opening`, tylko dla oceniającego i ocenianego cyklu. Dla roli `hr` wersja minimalna nie rejestruje żadnego odnośnika, bo `GET /cycles/:id/part1` zwraca kadrom 403 (zasada kontraktu: odnośnik tylko dla ról, które trasa `GET` wpuszcza);
- przez `registerHomeTasks`: cykl osoby zawsze z `openCycle(personId)`; dla oceniającego są to otwarte cykle osób, których jest bieżącym `cycles.appraiser_id` (`openCycle` każdej z nich), dla ocenianego `openCycle(person.id)`. Dla oceniającego, gdy stan jest `not_started` albo `draft`, „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024” z podstawą. Termin: `criteriaTalkDeadline(from, afterNegative)`, gdzie dane bierze z payloadu widocznego `cycle_started` (`{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`): `from` = `previousAssessmentOn`, a gdy go nie ma, `periodStart`; `afterNegative` = `previousOutcome === "negative"`. Podstawa z pliku reguł przy wartości, która zadziałała: `deadlines.criteriaTalkDays.basis` (§ 7 pkt 1) albo `deadlines.criteriaTalkAfterNegativeDays.basis` (§ 7 pkt 2). Bez stałej liczby dni w kodzie plastra; liczbę dni zna tylko `criteriaTalkDeadline` przez `value` tych kluczy. Dla ocenianego w stanie `submitted`: „Potwierdź część I oceny”. Sprawy tylko z cykli, w których osoba jest oceniającym albo ocenianym.

**Contract** (kody odpowiedzi według części „Zasady wspólne tras” kontraktu: 303 tylko po udanym `POST`, który coś zapisuje (wszystkie trzy `POST` tego plastra zapisują), 302 dla `GET /cycles/:id`, błąd walidacji zawsze 422 z formularzem, nigdy 400, 403 brak uprawnień, 409 zamknięty krok):
- `GET /cycles/:id` → 302 na `/cycles/:id/part1`.
- `GET /cycles/:id/part1` — oceniający przed przekazaniem: formularz z terminem z `effectiveDeadline(cycleId)`; po przekazaniu i dla ocenianego: widok do odczytu (kryteria i termin z migawki `part1_submitted`, termin z etykietą „Termin przekazany w części I”), u ocenianego w stanie `submitted` przycisk potwierdzenia. Rola `hr` i każda inna osoba spoza cyklu → 403 (kadry dostają widok do odczytu dopiero w fazie 2).
- `POST /cycles/:id/part1/criteria` — pola `additional` (wiele) i `expectation[<criterionId>]`; inny niż bieżący oceniający → 403; błąd walidacji → 422 z formularzem i komunikatami z silnika; po przekazaniu → 409 z komunikatem „Część I jest już przekazana. Kryteriów i terminu nie można zmienić.”; sukces → 303 na `/cycles/:id/part1`.
- `POST /cycles/:id/part1/submit` — ten sam formularz (drugi przycisk z `formaction`), woła `submitPart1` z wartościami formularza; inny niż bieżący oceniający → 403; część I już przekazana → 409; błąd walidacji → 422; sukces → 303.
- `POST /cycles/:id/part1/confirm` — inny niż oceniany → 403; stan inny niż `submitted` → 409; sukces → 303. Przycisk: „Potwierdzam rozmowę, kryteria i termin oceny”, pod nim: „Miejscowość, data i Twoje imię i nazwisko wpiszą się same.”
- `GET /cycles/:id/cards/opening` — tytuł, cel i cztery tematy z `criteriaConversation.topics` z podstawą z `criteriaConversation.basis` (§ 5 ust. 1).
- W żadnym renderowanym HTML nie ma ciągu „podpis”.

### Success Criteria:

#### Automated Verification:

- Testy doboru arkusza i podpowiedzi przechodzą: `bun test src/engine/criteria.test.ts`
- Testy logiki części I przechodzą: `bun test src/cycles/part1.test.ts`
- Testy tras i przejścia kroku 1 przechodzą: `bun test src/routes/cycle-start.test.tsx`
- Testy modułu danych części I (z opcją `afterStep1` i bez niej) przechodzą: `bun test src/seed/part1.test.ts`
- Testy renderowania obu wariantów `ConfirmationBlock` przechodzą: `bun test src/views/components.test.tsx`
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

**Intent**: Osoba z rolą `hr` dostaje `GET /cycles/:id/part1` w trybie do odczytu zamiast 403; zapis, przekazanie i potwierdzenie dalej 403. W tym samym kroku, i dopiero w nim, S-01 rejestruje przez `registerCycleLinks` odnośnik „Część I” → `/cycles/:id/part1` dla roli `hr` (pokazuje się m.in. w wierszu cyklu na `/hr`). Jeśli ten krok wypadnie przy cięciu, kadry nie mają ani widoku, ani odnośnika.

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

- `src/engine/criteria.test.ts`: `staff` → C, `manager` → B, `head_of_office` → A, każde z podstawą; podpowiedzi dla obowiązków Piotra dają dokładnie `orientacja-na-klienta`, `myslenie-analityczne` i `negocjowanie`, bez `komunikacja`; dwa obowiązki do tego samego kryterium dają jedną podpowiedź ze złączonym zdaniem; `because` zaczyna się od „bo w opisie stanowiska jest obowiązek: ”; `suggestCriteria` zwraca `source: "rules"`; każde kryterium z `office-settings.json` istnieje w pliku reguł.
- `src/cycles/part1.test.ts`: zapis 2 dodatkowych daje 7 wierszy `cycle_criteria`; 4 dodatkowe, powtórka albo obowiązkowe → błędy z silnika i brak zapisu; `submitPart1` z błędnym `input` nie zapisuje ani kryteriów, ani zdarzenia; `submitPart1` z aktorem innym niż bieżący `cycles.appraiser_id` → błąd i brak zapisu; `submitPart1` z poprawnym zapisuje kryteria z formularza i jedno `part1_submitted` z datą `today()`, którego `dueDate` równa się `effectiveDeadline(cycleId).date`, a `rulesVersion` jest obiektem równym `rulesVersion()` (pola `version`, `effectiveFrom`, `act`); `savePart1` ustawia `cycles.sheet` z `people.position_kind` ocenianego (`staff` → C, `manager` → B) bez argumentu arkusza; `savePart1` z aktorem innym niż `cycles.appraiser_id` i datą historyczną zapisuje zdarzenie z tym aktorem i tą datą; `part1Status` przechodzi `not_started` → `draft` → `submitted` → `confirmed`; zdarzenie z datą późniejszą niż `today()` nie zmienia stanu (decyzja 10i); termin rozmowy: `cycle_started` z kompletem pięciu pól payloadu, `previousOutcome: "negative"` i `previousAssessmentOn` innym niż `periodStart` daje 7 dni od `previousAssessmentOn` (§ 7 pkt 2), z `"positive"` 30 dni (§ 7 pkt 1); faza 2: `waitingDaysText` dla 0, 1, 2, 5.

- `src/seed/part1.test.ts` na `createTestApp({ today: "2024-12-09" })` i `createTestApp({ today: "2024-12-09", seedOptions: { afterStep1: true } })`: bez opcji `part1Status` cyklu Piotra (z `openCycle`) = `not_started`; z opcją = `confirmed`, `part1_submitted` i `part1_confirmed` z datą 2024-12-09, `cycleCriteria` zawiera `orientacja-na-klienta` i `myslenie-analityczne`; w obu przypadkach `part1_submitted` Ewy ma `actor_id` poprzedniego naczelnika i datę 2024-12-02, a `cycles.appraiser_id` Ewy to Marek; każda osoba z `people` ma niepuste `position_kind`, Katarzyna Lewandowska ma `staff`; `cycles.sheet` Ewy = `C`, Tomasza = `B`.
- `src/views/components.test.tsx` (czysty render, bez bazy): `ConfirmationBlock` z `kind: "confirmation"` i `name, place, date` pokazuje imię i nazwisko, miejscowość i datę, a bez danych „Jeszcze niepotwierdzone”; z `kind: "fiction"` i `name, reason, deliveryMethod, deliveredOn, date` pokazuje przyczynę, sposób i dzień doręczenia oraz datę wpisu. Żaden wariant nie zawiera „podpis”.

### Integration Tests:

`src/routes/cycle-start.test.tsx` przez `app.request()` na `createTestApp({ today: "2024-12-09" })` (bez `seedOptions`, więc Piotr nie ma części I):

- Marek, `GET /`: sprawa z „27.12.2024” i „§ 7 pkt 1”.
- Marek, `GET /cycles/<Piotr>` → 302 na `/cycles/<Piotr>/part1` (cykl Piotra z `openCycle(personId)`).
- Marek, `GET /cycles/<Piotr>/part1`: „Arkusz C”, 5 kryteriów obowiązkowych, 3 razy „bo w opisie stanowiska jest obowiązek”, „ustawienie urzędu”, „27.11.2026” (z `effectiveDeadline`) z etykietą „Termin oceny”, bez „Termin przekazany w części I”, żaden checkbox nie jest zaznaczony, odnośnik do karty rozmowy.
- `POST …/criteria` z 4 dodatkowymi → 422 (nie 400) z formularzem i komunikatem o limicie 3; z `orientacja-na-klienta`, `myslenie-analityczne` i oczekiwaniem → 303, wiersze w bazie. Piotr, `POST …/criteria` → 403.
- `GET …/cards/opening`: cztery tematy z § 5 ust. 1.
- `POST …/submit` → 303 i `part1_submitted` z `dueDate` 2026-11-27, `place`, `appraiserName`, `rulesVersion` jako obiektem `{ version, effectiveFrom, act }`; potem `GET …/part1` (Marek i Piotr) pokazuje „Termin przekazany w części I” z datą 27.11.2026 z payloadu; potem `POST …/criteria` → 409 i drugi `POST …/submit` → 409.
- Joanna (`hr`), `GET /cycles/<Piotr>/part1` → 403, a `cycleLinks` cyklu Piotra dla Joanny nie zawiera żadnego odnośnika S-01.
- Ewa, `POST …/confirm` na cyklu Piotra → 403. Piotr, `GET /`: sprawa „Potwierdź część I oceny”. Piotr, `POST …/confirm` → 303, zdarzenie z datą 2024-12-09, miejscowością i nazwiskiem; drugi `POST …/confirm` → 409.
- Po wgraniu: `part1Status` cykli Ewy i Tomasza = `confirmed`, `cycleCriteria` Ewy zawiera `orientacja-na-klienta`.
- Faza 2: po przekazaniu `POST /demo/date` na 2024-12-11 → Marek widzi „od 2 dni”; Joanna `GET …/part1` → 200 do odczytu, `POST …/confirm` → 403, a `cycleLinks` cyklu Piotra dla Joanny zawiera „Część I”.
- Żaden z ekranów plastra nie zawiera „podpis” (tekst odpowiedzi, bez rozróżniania wielkości liter).

### Manual Testing Steps:

1. `bun run seed`, `bun run dev`.
2. Konto Marka, 9.12.2024: sprawa „Wyznacz kryteria oceny”, ekran części I, wybór „Orientacja na klienta/interesanta” i „Myślenie analityczne”, oczekiwanie przy jednym, karta rozmowy, przekazanie.
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
- [ ] 1.4 Testy modułu danych części I (z opcją `afterStep1` i bez niej) przechodzą: `bun test src/seed/part1.test.ts`
- [ ] 1.5 Testy renderowania obu wariantów `ConfirmationBlock` przechodzą: `bun test src/views/components.test.tsx`
- [ ] 1.6 Dane pokazowe wgrywają się bez błędu, z pełną częścią I Ewy i Tomasza: `bun run seed`
- [ ] 1.7 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 1.8 Krok 1 pokazu w przeglądarce: Marek przy dacie 9.12.2024 przekazuje część I, Piotr ją potwierdza, bez błędów

### Phase 2: Dopełnienie (po wersji minimalnej, w kolejności cięcia)

#### Automated

- [ ] 2.1 Testy stanu oczekiwania, widoku kadr i karty przechodzą: `bun test src/routes/cycle-start.test.tsx src/cycles/part1.test.ts`
- [ ] 2.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.3 Krok 1 pokazu w całości (Marek na komputerze, Piotr na telefonie) przechodzi w przeglądarce przy 1440 px i 360 px, na wyglądzie z design systemu autora
