# Początek cyklu: arkusz, kryteria, oczekiwania, potwierdzenie części I — plan wdrożenia

## Overview

Krok 1 pokazu. Marek otwiera cykl Piotra, widzi arkusz C z kryteriami obowiązkowymi, wybiera 2 kryteria dodatkowe z podpowiedzią „bo w opisie stanowiska jest obowiązek: …”, wpisuje oczekiwanie, otwiera kartę rozmowy rozpoczynającej i przekazuje część I. Piotr na telefonie potwierdza; miejscowość, data i nazwisko wpisują się same, a kryteria i termin się blokują. Plaster pokrywa US-01, US-02 i FR-001–FR-007.

## Current State Analysis

Stan przed tym plastrem to wynik F-01 (`context/changes/rules-engine-and-demo-data/plan.md`): silnik w `src/engine/{rules,scoring,deadlines}.ts`, reguły w `rules/regulation-2016-470.json`, baza z tabelami `people`, `cycles`, `cycle_criteria`, `events`, `settings`, `today()`, wybór konta i układ `src/views/layout.tsx`. Na dziś (przed F-01) w repo są jeszcze polskie nazwy: `sprawdzKryteriaDodatkowe` w `src/silnik/ocena.ts:37` (limit 3, bez powtórzeń, bez obowiązkowych), `terminRozmowyOKryteriach` i `terminKolejnejOceny` w `src/silnik/terminy.ts:82-90`. Plik reguł ma już listę 14 kryteriów z opisami, kryteria obowiązkowe arkuszy A/B/C z podstawą (§ 3, § 4), `maksKryteriowDodatkowych: 3` oraz cztery tematy rozmowy o kryteriach (`rozmowaOKryteriach`, § 5 ust. 1). Brakuje: rodzajów obowiązków przy stanowiskach, tabeli „rodzaj obowiązku → kryterium”, karty rozmowy, ekranu części I i potwierdzeń.

Silnik już robi najtrudniejszą część walidacji i terminów; ten plaster to głównie ekrany, zdarzenia i dane urzędu.

## Desired End State

Przy dacie systemowej 9.12.2024 Marek ma na ekranie startowym sprawę „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024 (§ 7 pkt 1)”. Ekran części I pokazuje arkusz C z podstawą (§ 3 ust. 4), 5 kryteriów obowiązkowych (§ 4), listę kryteriów do wyboru z trzema podpowiedziami ze zdaniem „dlaczego” i dopiskiem „ustawienie urzędu”, pole oczekiwań przy każdym kryterium oraz termin oceny 27.11.2026 (art. 81 ust. 4 ustawy). Po przekazaniu Piotr widzi sprawę „Potwierdź część I oceny”, klika „Potwierdzam” i od tej chwili część I jest zablokowana. Do potwierdzenia Marek widzi „Czeka na potwierdzenie od X dni”. `bun test` przechodzi.

### Key Discoveries:

- `src/silnik/ocena.ts:37` — walidacja kryteriów dodatkowych zwraca listę komunikatów po polsku; po F-01 pod angielską nazwą. Używamy jej bez zmian, zamiast pisać drugą.
- `src/silnik/terminy.ts:87` — termin rozmowy o kryteriach (30 dni, 7 po negatywnej) z przesunięciem na dzień roboczy; dla Piotra daje 27.12.2024.
- `src/silnik/terminy.ts:82` — termin oceny 24 miesiące od początku okresu; dla 27.11.2024 daje 27.11.2026 (piątek).
- Plik reguł, klucz `rozmowaOKryteriach` — cztery tematy karty są przepisem, więc karta bierze je z pliku reguł, a nie z `content/cards.json`.

## What We're NOT Doing

- Oceny, wyniku, blokad zatwierdzenia i potwierdzenia zapoznania (S-02).
- Notatek, adaptera podpowiedzi `src/suggestions/` i karty rozmowy oceniającej (S-04).
- Ekranu kadr ze stanem cykli i wydruku arkusza (S-06); kadry widzą tu tylko część I w trybie do odczytu.
- Nieobecności, zmiany oceniającego, osi czasu i przesunięcia terminu (S-03).
- Cofnięcia przekazania, zmiany terminu przez oceniającego (FR-012) i wpisu za ocenianego, gdy ten nie potwierdza (decyzja 10d: luka zostaje).
- Osobnego pola „cele” (temat 4 z § 5 ust. 1); patrz „Pytania otwarte”.
- Edycji rodzajów obowiązków przy stanowisku z ekranu; są wgrane skryptem.
- Stylów: tokeny i komponenty wyglądu pochodzą z design systemu autora (decyzja 10b). Ten plan nazywa ekrany i komponenty, nie projektuje ich wyglądu.
- Modelu językowego i jakiejkolwiek usługi zewnętrznej.

## Implementation Approach

Trzy fazy, każda kończy się zielonym `bun test`:

1. Dane i reguły (bez ekranów): ustawienia urzędu, karta rozmowy, czyste funkcje dobierające arkusz i podpowiedzi, rozszerzenie schematu i danych pokazowych.
2. Ekran oceniającego: część I do wypełnienia, karta rozmowy, przekazanie, sprawa na ekranie startowym.
3. Ekran ocenianego: potwierdzenie, blokada, stan „czeka na potwierdzenie od X dni”.

Stan części I wynika wyłącznie ze zdarzeń w `events` widocznych przy `today()` (decyzja 10i); nie dokładamy kolumny ze statusem. Wybór kryteriów i oczekiwania (szkic) leżą w `cycle_criteria` i zapisują się dopiero po kliknięciu „Zapisz” albo „Potwierdzam rozmowę i przekazuję część I”. Podpowiedzi kryteriów nie są zaznaczone z góry: stoją na początku listy ze zdaniem „dlaczego”, a zaznacza je człowiek.

Podpowiedź kryteriów to czysta funkcja na regułach (decyzja 6b), zwracająca `source: "rules"` w tym samym duchu co adapter z S-04, żeby S-04 mógł ją później przepiąć przez adapter bez zmiany ekranu.

**Szacunek:** faza 1 ok. 25 min, faza 2 ok. 30 min, faza 3 ok. 20 min, zrzuty 5 min.

**Kolejność cięcia** (gdy brakuje czasu; krok 1 pokazu ma działać do końca): (1) wgrana część I Ewy i Tomasza w danych pokazowych (zostają same zdarzenia `cycle_started`; S-03 dopisze część I Ewy, jeśli jej potrzebuje); (2) widok do odczytu dla kadr; (3) zdanie „Czeka na potwierdzenie od X dni” na ekranie startowym (zostaje na ekranie części I); (4) rozwijane opisy kryteriów z załącznika nr 1; (5) sekcje „pytania” i „trudne sytuacje” karty rozmowy (zostają cel i cztery tematy z § 5 ust. 1). Nie tniemy: arkusz C, podpowiedź ze zdaniem „dlaczego”, wybór do 3, oczekiwanie, karta z czterema tematami, przekazanie, potwierdzenie z automatycznym wpisem i blokada.

## Założenia wobec wcześniejszych plastrów

Z F-01 (nazwy z jego planu i konwencji wspólnych; jeśli F-01 nazwał coś inaczej, implementujący bierze nazwę z kodu i nie tworzy drugiej):

- **Tabele i kolumny:**
  - `people(id, name, role, position_title, supervisor_id)`; `role` rozróżnia co najmniej oceniającego, ocenianego, kadry i administratora. Ten plaster **dokłada** `position_kind` (`head_of_office` | `manager` | `staff`) i `duty_types` (JSON, tablica identyfikatorów z `rules/office-settings.json`), jeśli ich nie ma.
  - `cycles(id, person_id, appraiser_id, period_start)`; `period_start` to dzień poprzedniej oceny albo zatrudnienia (dla Piotra 2024-11-27). Ten plaster **dokłada** `sheet` (`A` | `B` | `C`, null do pierwszego zapisu), jeśli go nie ma. Jeśli F-01 ma kolumnę statusu, ten plaster jej nie używa.
  - `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `kind` = `mandatory` | `additional`. Kolumny dokłada ten plaster, jeśli F-01 zostawił tabelę pustą w kształcie.
  - `events(id, type, cycle_id, actor_id, date, payload)`; `payload` to JSON.
  - `settings(key, value)`; ten plaster dokłada klucz `office_city` (miejscowość do potwierdzeń), jeśli F-01 go nie ma.
- **Funkcje:** `today(): string` (ISO), `rulesVersion(): { version, effectiveFrom, act }`; zapis zdarzenia z datą `today()` i odczyt zdarzeń cyklu z filtrem `date <= today()` (nazwy w kodzie F-01, w tym planie `recordEvent()` i `visibleEvents()`); odczyt bieżącego konta z ciasteczka (tu `currentPerson(c)`).
- **Silnik:** angielskie odpowiedniki `kryteriaObowiazkowe`, `kryteriaDoWyboru`, `sprawdzKryteriaDodatkowe`, `kryterium`, `terminRozmowyOKryteriach`, `terminKolejnejOceny` (tu: `mandatoryCriteria`, `selectableCriteria`, `validateAdditionalCriteria`, `criterion`, `criteriaTalkDeadline`, `nextAssessmentDeadline`). Identyfikatory kryteriów bierzemy z pliku reguł; jeśli F-01 je przetłumaczył (np. `orientacja-na-klienta` → inna nazwa), `rules/office-settings.json` i dane pokazowe używają nowych.
- **Dane pokazowe:** cykle Piotra, Ewy i Tomasza istnieją w `cycles` z `period_start` 2024-11-27, 2024-11-20 i 2024-11-12; oceniającym Piotra jest Marek; data systemowa po wgraniu 2024-12-09. Dla cyklu Piotra nie ma wierszy w `cycle_criteria` ani zdarzeń części I.
- **Ekran startowy:** `GET /` składa listę spraw zależnie od konta. Jeśli F-01 nie zostawił miejsca na sprawy z plastrów, ten plaster dodaje `src/home-tasks.ts` (patrz niżej) i wpina go w `GET /`.
- **Trasy:** `GET/POST /account`, `GET /`, `POST /demo/date`; testy tras przez `app.request()`.

## Co ten plaster udostępnia

Dla S-02, S-03, S-04, S-05 i S-06:

- **Zdarzenia** (wszystkie z `date = today()` przy zapisie z ekranu):
  - `cycle_started` — `payload: { from: "previous_assessment" | "permanent_employment" | "appointment", periodStart }`; w prototypie tylko wgrywane.
  - `part1_submitted` — oceniający potwierdził rozmowę i kryteria i przekazał część I. `actor_id` = oceniający. `payload: { sheet, criteria: [{ id, kind, expectation }], dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }`. Data zdarzenia = data rozmowy.
  - `part1_confirmed` — oceniany potwierdził rozmowę, kryteria i termin. `actor_id` = oceniany. `payload: { place, appraiseeName }`.
- **Funkcja stanu** `part1Status(cycleId): { state: "not_started" | "draft" | "submitted" | "confirmed", submittedOn?, confirmedOn?, waitingDays? }` w `src/cycles/part1.ts`. `waitingDays` tylko dla `submitted`. S-02 blokuje ocenę, gdy `state !== "confirmed"` (US-02); S-06 pokazuje z niej zdanie „czeka na potwierdzenie od X dni”.
- **Funkcje pomocnicze** w `src/cycles/part1.ts`: `cycleCriteria(cycleId)` (kryteria cyklu w kolejności: obowiązkowe, potem dodatkowe, z oczekiwaniem) i `isPart1Locked(cycleId)` (prawda od `submitted`). Po `part1_submitted` `cycle_criteria` danego cyklu ma komplet: 5 albo 6 obowiązkowych plus 0–3 dodatkowe. S-02 bierze z nich listę do ocen cząstkowych, S-04 przypina do nich notatki, S-03 zostawia je bez zmian przy zmianie oceniającego.
- **Termin oceny** zapisany w `part1_submitted.payload.dueDate` (z podstawą). S-03 liczy przesunięcie od tej daty.
- **Silnik:** `sheetForPosition(kind)` i `suggestAdditionalCriteria(sheet, dutyTypes)` w `src/engine/criteria.ts`; `waitingDaysText(days)` w `src/cycles/part1.ts` („od dziś”, „od 1 dnia”, „od X dni”).
- **Ustawienia urzędu:** `rules/office-settings.json` z polem `label: "ustawienie urzędu"` i loaderem `officeSettings()` w `src/office-settings.ts`. Ten plaster zakłada plik z kluczami `dutyTypes` i `dutyToCriterion`; S-04 i S-05 **dopisują** do niego własne klucze (lista słów, progi, katalog form rozwoju), nie zakładają drugiego pliku.
- **Karty rozmów:** `content/cards.json` z kluczem `opening` i loaderem `card(id)` w `src/content.ts`. S-04 dopisuje `assessment`, S-05 własne karty.
- **Sprawy na ekranie startowym:** jeśli powstaje, `src/home-tasks.ts` z `homeTasks(person): Task[]`, `Task = { text, href, basis? }`; kolejne plastry dopisują swoje źródła spraw do tej jednej funkcji.
- **Komponenty widoków** (do ponownego użycia, wygląd z design systemu): `LegalBasis` (dopisek z przepisem przy dacie i wyniku), `ConfirmationBlock` (linie „Potwierdził: imię i nazwisko, miejscowość, data” albo „Jeszcze niepotwierdzone”). S-02 może użyć `ConfirmationBlock` przy potwierdzeniu zapoznania.
- **Trasy:** `GET /cycles/:id/part1` (ekran części I; S-06 może z niego linkować), `GET /cycles/:id/cards/opening`.

## Phase 1: Dane, reguły i podpowiedź kryteriów

### Overview

Wszystko, co nie jest ekranem: tabela urzędu, karta rozmowy, dobór arkusza, podpowiedzi, schemat i dane pokazowe. Po tej fazie testy silnika pokazują, że Piotr dostaje arkusz C i trzy podpowiedzi.

### Changes Required:

#### 1. Ustawienia urzędu

**File**: `rules/office-settings.json`, `src/office-settings.ts`

**Intent**: Zamknięta lista rodzajów obowiązków i tabela „rodzaj obowiązku → kryterium” (decyzja 6b). Treść pisze implementujący (decyzja 10e: autor jej osobno nie przegląda). Plik ma na górze `label: "ustawienie urzędu"` i jednozdaniowy opis, że nie pochodzi z przepisów ani z materiałów organizatora.

**Contract**: `{ label, note, dutyTypes: [{ id, name }], dutyToCriterion: { [dutyTypeId]: criterionId } }`. Minimum 8 rodzajów, w tym te, które dają podpowiedzi w kroku 1: `client-service` („obsługa interesantów”) → orientacja na klienta/interesanta; `analyses-and-reports` („przygotowywanie analiz i zestawień”) → myślenie analityczne; `inter-office-agreements` („uzgodnienia z innymi urzędami”) → negocjowanie; `official-correspondence` („prowadzenie korespondencji urzędowej”) → komunikacja (obowiązkowe w C, więc odpada w podpowiedzi). Pozostałe: wystąpienia publiczne, sytuacje kryzysowe, usprawnienia (kreatywność), kierowanie zespołem (zarządzanie ludźmi). Loader sprawdza przy starcie, że każdy `criterionId` istnieje w pliku reguł, i rzuca błąd, jeśli nie.

#### 2. Karta rozmowy rozpoczynającej

**File**: `content/cards.json`, `src/content.ts`

**Intent**: Treść karty z FR-005: cel rozmowy, pytania do zadania pracownikowi, trudne sytuacje z jednym zdaniem „co zrobić”. Cztery wymagane tematy nie są tu powielane: widok bierze je z pliku reguł (`rozmowaOKryteriach.topics` albo nazwa po F-01) z podstawą § 5 ust. 1.

**Contract**: `{ opening: { title, purpose, questions: string[], hardSituations: [{ situation, whatToDo }] } }`; `card(id)` rzuca błąd dla nieznanego klucza. Bez słowa „podpis”.

#### 3. Dobór arkusza i podpowiedzi

**File**: `src/engine/criteria.ts`, `src/engine/criteria.test.ts`

**Intent**: Czyste funkcje bez bazy. Arkusz z rodzaju stanowiska według § 3. Podpowiedzi: dla każdego rodzaju obowiązku z tabeli kryterium; odrzuca obowiązkowe dla arkusza i powtórki; zdanie „dlaczego” łączy nazwy obowiązków, gdy dwa prowadzą do tego samego kryterium.

**Contract**:
- `sheetForPosition(kind: "head_of_office" | "manager" | "staff"): "A" | "B" | "C"` wraz z podstawą (`§ 3 ust. 2`, `§ 3 ust. 3`, `§ 3 ust. 4`), np. zwracając `{ sheet, basis }`.
- `suggestAdditionalCriteria(sheet, dutyTypeIds): { source: "rules", items: [{ criterionId, because }] }`, gdzie `because` = `bo w opisie stanowiska jest obowiązek: obsługa interesantów`. Kolejność jak w opisie stanowiska.

#### 4. Schemat i dane pokazowe

**File**: `src/db.ts`, `src/seed.ts`

**Intent**: Dołożyć brakujące kolumny (patrz „Założenia”) i dane: rodzaj stanowiska i obowiązki osób, `office_city`, zdarzenia `cycle_started` dla trzech cykli z datą `period_start`. Piotr: `staff`, obowiązki `client-service`, `analyses-and-reports`, `inter-office-agreements`, `official-correspondence` (trzy podpowiedzi, czwarta odpada jako obowiązkowa). Ewa: `staff`; Tomasz, Marek, Anna: `manager`. Część I Ewy (przekazana przez poprzedniego naczelnika 2.12.2024, potwierdzona 3.12.2024, dodatkowe: orientacja na klienta/interesanta) i Tomasza (Anna, te same daty, bez dodatkowych) wgrana jako `cycle_criteria` plus zdarzenia `part1_submitted` i `part1_confirmed`, żeby S-02, S-03 i S-06 miały gotowe cykle. Cykl Piotra zostaje bez części I.

**Contract**: `bun run seed` dalej kasuje i odtwarza bazę. Wgrane zdarzenia części I mają daty sprzed 2024-12-09, więc są widoczne od początku pokazu.

### Success Criteria:

#### Automated Verification:

- Testy doboru arkusza i podpowiedzi przechodzą: `bun test src/engine/criteria.test.ts`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Wszystkie testy przechodzą: `bun test`

## Phase 2: Część I u oceniającego

### Overview

Marek wypełnia część I, otwiera kartę i przekazuje. Ekran startowy przypomina o terminie wyznaczenia kryteriów.

### Changes Required:

#### 1. Logika części I

**File**: `src/cycles/part1.ts`, `src/cycles/part1.test.ts`

**Intent**: Zapis wyboru (kasuje i wstawia wiersze `cycle_criteria` danego cyklu: obowiązkowe z arkusza plus wybrane dodatkowe, z oczekiwaniami; ustawia `cycles.sheet`), przekazanie (zdarzenie `part1_submitted` z kompletem w `payload`), stan z widocznych zdarzeń. Walidacja przez `validateAdditionalCriteria` z silnika; żadnej drugiej. Po przekazaniu zapis jest odrzucany.

**Contract**: `saveCriteria(cycleId, actorId, { additional: string[], expectations: Record<criterionId, string> }): { ok: true } | { ok: false, errors: string[] }`; `submitPart1(cycleId, actorId)` (najpierw zapisuje bieżący formularz, potem tworzy zdarzenie; wymaga, by aktor był `appraiser_id` cyklu); `part1Status`, `cycleCriteria`, `isPart1Locked` jak w „Co ten plaster udostępnia”. `payload.place` z `settings.office_city`, `payload.appraiserName` z `people.name`, `payload.dueDate` = `nextAssessmentDeadline(period_start)` z podstawą „art. 81 ust. 4 ustawy”, `payload.rulesVersion` = `rulesVersion().version`.

#### 2. Trasy oceniającego

**File**: `src/routes/cycle-start.tsx`, `src/index.tsx` (wpięcie modułu)

**Intent**: Ekran części I zależny od konta, zapis, przekazanie i karta. Brak konta → `/account`; osoba spoza cyklu (nie oceniający, nie oceniany, nie kadry) → 403.

**Contract**:
- `GET /cycles/:id/part1` — oceniający przed przekazaniem: formularz; po przekazaniu i dla pozostałych: widok do odczytu.
- `POST /cycles/:id/part1/criteria` — pola `additional` (wiele) i `expectation[<criterionId>]`; błąd walidacji → 422 z ponownym formularzem i komunikatami z silnika; po przekazaniu → 409 z komunikatem „Część I jest już przekazana. Kryteriów i terminu nie można zmienić.”; sukces → 303 na `GET /cycles/:id/part1`.
- `POST /cycles/:id/part1/submit` — ten sam formularz (drugi przycisk z `formaction`); sukces → 303 na ekran części I.
- `GET /cycles/:id/cards/opening` — karta rozmowy rozpoczynającej.

#### 3. Widoki

**File**: `src/views/part1.tsx`, `src/views/opening-card.tsx`, `src/views/components.tsx` (jeśli F-01 nie ma pliku na wspólne komponenty)

**Intent**: Oba ekrany w układzie `src/views/layout.tsx`, wygląd z design systemu autora (decyzja 10b). Nowe komponenty: `SheetHeader` (arkusz i podstawa), `CriteriaList` (obowiązkowe, tylko do odczytu), `CriterionPicker` (lista do wyboru; podpowiedzi na początku z dopiskiem „Podpowiedź” i zdaniem „dlaczego”, nad nimi jedno zdanie „Podpowiedzi z tabeli urzędu „rodzaj obowiązku → kryterium” (ustawienie urzędu, nie przepis).”; checkboxy niezaznaczone; opisy kryteriów w rozwijanym `<details>`), `ExpectationField` (pole tekstowe przy kryterium), `LegalBasis`, `ConfirmationBlock`, `StatusLine`. Na ekranie: termin oceny z podstawą, link „Karta rozmowy rozpoczynającej”, przyciski „Zapisz” i „Potwierdzam rozmowę i przekazuję część I”. Przy nazwisku Piotra żadnej etykiety ani liczby; liczba dni oczekiwania stoi w zdaniu o stanie części I, nie przy nazwisku.

**Contract**: teksty interfejsu po polsku; w żadnym renderowanym HTML nie ma ciągu „podpis”.

#### 4. Sprawa na ekranie startowym

**File**: `src/home-tasks.ts` (albo miejsce na sprawy z F-01)

**Intent**: Dla oceniającego, gdy część I cyklu podwładnego jest `not_started` albo `draft`: „Wyznacz kryteria oceny: Piotr Wójcik, do 27.12.2024” z podstawą „§ 7 pkt 1” (termin z `criteriaTalkDeadline(period_start)`) i linkiem do części I.

**Contract**: `homeTasks(person)` zwraca sprawy wyłącznie z cykli, w których osoba jest oceniającym albo ocenianym.

### Success Criteria:

#### Automated Verification:

- Testy logiki części I przechodzą: `bun test src/cycles/part1.test.ts`
- Testy tras oceniającego przechodzą: `bun test src/routes/cycle-start.test.tsx`
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Marek przy dacie 9.12.2024 przechodzi krok 1 pokazu do przekazania części I w przeglądarce, bez błędów

## Phase 3: Potwierdzenie ocenianego i blokada

### Overview

Piotr potwierdza część I na swoim koncie; od tej chwili nic w niej nie da się zmienić. Do potwierdzenia oceniający widzi, od ilu dni część I czeka (decyzja 10d).

### Changes Required:

#### 1. Potwierdzenie

**File**: `src/cycles/part1.ts`, `src/routes/cycle-start.tsx`

**Intent**: Oceniany potwierdza jednym kliknięciem; system sam wpisuje miejscowość, datę (`today()`) i imię i nazwisko (decyzja 5a). Tylko oceniany danego cyklu i tylko w stanie `submitted`.

**Contract**: `confirmPart1(cycleId, actorId)`; `POST /cycles/:id/part1/confirm` — inny niż oceniany → 403; stan inny niż `submitted` → 409; sukces → zdarzenie `part1_confirmed` i 303 na ekran części I. Przycisk: „Potwierdzam rozmowę, kryteria i termin oceny”. Pod nim zdanie: „Miejscowość, data i Twoje imię i nazwisko wpiszą się same.”

#### 2. Widok ocenianego i stan oczekiwania

**File**: `src/views/part1.tsx`, `src/home-tasks.ts`

**Intent**: Oceniany widzi część I do odczytu z przyciskiem potwierdzenia (widok czytelny przy 360 px). Po potwierdzeniu `ConfirmationBlock` pokazuje dwie linie (oceniający i oceniany). Oceniający w stanie `submitted` widzi na ekranie części I i w sprawie na ekranie startowym zdanie „Część I czeka na potwierdzenie od X dni” (`waitingDaysText`). Oceniany ma sprawę „Potwierdź część I oceny” z linkiem. Kadry widzą część I do odczytu.

**Contract**: `waitingDays` = liczba dni kalendarzowych między `submittedOn` a `today()`; `waitingDaysText(0)` = „od dziś”, `(1)` = „od 1 dnia”, `(n)` = „od n dni”.

### Success Criteria:

#### Automated Verification:

- Testy potwierdzenia, blokady i stanu oczekiwania przechodzą: `bun test src/routes/cycle-start.test.tsx`
- Wszystkie testy przechodzą: `bun test`

#### Manual Verification:

- Krok 1 pokazu w całości (Marek na komputerze, Piotr na telefonie) przechodzi w przeglądarce przy 1440 px i 360 px, na wyglądzie z design systemu autora

## Testing Strategy

### Unit Tests:

- `src/engine/criteria.test.ts`: `staff` → C, `manager` → B, `head_of_office` → A, każde z podstawą; podpowiedzi dla obowiązków Piotra dają dokładnie orientację na klienta/interesanta, myślenie analityczne i negocjowanie, bez komunikacji (obowiązkowa w C); dwa obowiązki prowadzące do tego samego kryterium dają jedną podpowiedź ze złączonym zdaniem; `because` zaczyna się od „bo w opisie stanowiska jest obowiązek: ”; `source` = `rules`; każde kryterium z `office-settings.json` istnieje w pliku reguł.
- `src/cycles/part1.test.ts`: zapis 2 dodatkowych daje 7 wierszy `cycle_criteria`; 4 dodatkowe, powtórka albo obowiązkowe → błędy z silnika i brak zapisu; `part1Status` przechodzi `not_started` → `draft` → `submitted` → `confirmed`; zdarzenie z datą późniejszą niż `today()` nie zmienia stanu (decyzja 10i); `waitingDaysText` dla 0, 1, 2, 5.

### Integration Tests:

`src/routes/cycle-start.test.tsx` przez `app.request()` na bazie z `seed`:

- Marek, `GET /`: sprawa z „27.12.2024” i „§ 7 pkt 1”.
- Marek, `GET /cycles/<Piotr>/part1`: „Arkusz C”, 5 kryteriów obowiązkowych, 3 razy „bo w opisie stanowiska jest obowiązek”, „ustawienie urzędu”, „27.11.2026”, żaden checkbox nie jest zaznaczony.
- `POST …/criteria` z 4 dodatkowymi → 422 i komunikat o limicie 3; z orientacją na klienta/interesanta i myśleniem analitycznym oraz oczekiwaniem → 303, wiersze w bazie.
- `GET …/cards/opening`: cztery tematy z § 5 ust. 1.
- `POST …/submit` → zdarzenie `part1_submitted` z `dueDate` 2026-11-27, `place`, `appraiserName`, `rulesVersion`; potem `POST …/criteria` → 409.
- Ewa, `POST …/confirm` na cyklu Piotra → 403. Piotr, `GET /`: sprawa „Potwierdź część I oceny”. Piotr, `POST …/confirm` → 303, zdarzenie z datą 2024-12-09, miejscowością i nazwiskiem; drugi `POST …/confirm` → 409.
- Wariant oczekiwania: po przekazaniu `POST /demo/date` na 2024-12-11 → Marek widzi „od 2 dni”.
- Żaden z ekranów tego plastra nie zawiera „podpis” (sprawdzenie na tekście odpowiedzi, bez rozróżniania wielkości liter).

### Manual Testing Steps:

1. `bun run seed`, `bun run dev`.
2. Konto Marka, 9.12.2024: sprawa „Wyznacz kryteria oceny”, ekran części I, wybór orientacji na klienta/interesanta i myślenia analitycznego, oczekiwanie przy jednym, karta rozmowy, przekazanie.
3. Konto Piotra w oknie 360 px: sprawa, potwierdzenie, automatyczny wpis, brak pól do edycji.
4. Konto Marka: część I zablokowana, dwie linie potwierdzenia.

## Pytania otwarte

Dokumenty tego nie rozstrzygają; podany wariant domyślny obowiązuje, dopóki autor nie zdecyduje inaczej.

1. **Czy podpowiedź kryteriów ma iść przez adapter z S-04?** `AGENTS.md` (zasada 5) każe przepuszczać podpowiedzi przez jedno wymienne miejsce, a decyzja 9 nie wymienia kryteriów wśród miejsc adaptera. Domyślnie: czysta funkcja na regułach z `source: "rules"`; S-04 może ją przepiąć bez zmiany ekranu.
2. **Czy oceniający może cofnąć przekazanie przed potwierdzeniem?** Domyślnie nie: po przekazaniu część I jest tylko do odczytu, także dla oceniającego (prościej i spójnie z „edycja do zablokowania”).
3. **Czy przekazanie wymaga choć jednego oczekiwania?** Domyślnie nie (FR-004: „może zapisać”); pokaz i tak wpisuje jedno.
4. **Pole „cele” (temat 4 z § 5 ust. 1).** Domyślnie bez osobnego pola; karta wymienia temat, a cele można wpisać w oczekiwaniach. Jeśli S-06 potrzebuje pola do wydruku, dokłada je jako tekst do odczytu z pustą wartością.
5. **Data rozmowy.** Domyślnie dzień przekazania (`date` zdarzenia `part1_submitted`); bez osobnego pola daty.
6. **Miejscowość urzędu.** Domyślnie wartość `settings.office_city` z danych pokazowych; jeśli F-01 jej nie ustawił, ten plaster wpisuje fikcyjną nazwę miasta wojewódzkiego.

## References

- `context/foundation/decisions.md` (decyzje 5a, 6b, 10b, 10d, 10e, 10i)
- `context/foundation/prd.md` (US-01, US-02, FR-001–FR-007, Business Logic, Access Control)
- `context/foundation/roadmap.md` (S-01)
- `context/foundation/demo.md` (krok 1, „Daty w danych pokazowych”, „Ustalenia do scenariusza”)
- `context/changes/rules-engine-and-demo-data/plan.md` (F-01)
- `src/silnik/ocena.ts:26-51`, `src/silnik/terminy.ts:82-90` (przed przemianowaniem w F-01)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Dane, reguły i podpowiedź kryteriów

#### Automated

- [ ] 1.1 Testy doboru arkusza i podpowiedzi przechodzą: `bun test src/engine/criteria.test.ts`
- [ ] 1.2 Dane pokazowe wgrywają się bez błędu: `bun run seed`
- [ ] 1.3 Wszystkie testy przechodzą: `bun test`

### Phase 2: Część I u oceniającego

#### Automated

- [ ] 2.1 Testy logiki części I przechodzą: `bun test src/cycles/part1.test.ts`
- [ ] 2.2 Testy tras oceniającego przechodzą: `bun test src/routes/cycle-start.test.tsx`
- [ ] 2.3 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 2.4 Marek przy dacie 9.12.2024 przechodzi krok 1 pokazu do przekazania części I w przeglądarce, bez błędów

### Phase 3: Potwierdzenie ocenianego i blokada

#### Automated

- [ ] 3.1 Testy potwierdzenia, blokady i stanu oczekiwania przechodzą: `bun test src/routes/cycle-start.test.tsx`
- [ ] 3.2 Wszystkie testy przechodzą: `bun test`

#### Manual

- [ ] 3.3 Krok 1 pokazu w całości (Marek na komputerze, Piotr na telefonie) przechodzi w przeglądarce przy 1440 px i 360 px, na wyglądzie z design systemu autora
