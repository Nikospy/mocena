# Oś czasu, nieobecności i zmiana oceniającego — plan wdrożenia

## Overview

Plaster S-03 (US-03, FR-010, FR-011, FR-014, FR-033, FR-034). Kadry wpisują nieobecność ocenianego (tylko daty i „usprawiedliwiona”, decyzja 10m) i zmianę oceniającego. Silnik łączy nieobecności rozdzielone samymi dniami wolnymi, sprawdza próg „dłużej niż miesiąc” i przedłuża termin oceny w tej samej funkcji `effectiveDeadline(cycleId, { asOf })`, z której od F-01 czyta każdy ekran otwartego cyklu. Uczestnicy cyklu widzą oś czasu, a przy każdej dacie przepis i wersję reguł. Przy przesuwaniu daty systemowej pojawia się przypomnienie o terminie oceny.

Plaster jest budowany jako ostatni i wypada pierwszy, gdy zabraknie czasu (decyzja 10h). **Jeśli budowa S-03 nie zacznie się do 05:45, plaster wypada z pokazu** (koniec budowy o 07:00, decyzja 10g; wersja minimalna z zapasem na naprawy to ok. 75 minut). Wtedy krok 3 pokazu odpada, a terminy na ekranach zostają takie, jak liczy F-01. Budżet: wersja minimalna ok. 45 minut, całość ok. 80 minut.

## Current State Analysis

Stan w chwili budowy S-03 (po F-01, S-01, S-02, S-04, S-05, S-06; decyzje 8a i 10h):

- Silnik terminów jest w `src/engine/deadlines.ts` (przeniesiony przez F-01 z `src/silnik/terminy.ts`): `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `periodEndAfterNegative` i pozostałe terminy. `nextAssessmentDeadline` liczy `toWorkingDay(addDays(addMonths(start, 24), longAbsenceDays))`: dni dodaje do surowego końca 24 miesięcy i dopiero potem przesuwa na dzień roboczy. Test `nextAssessmentDeadline("2024-03-16", 33) === "2026-04-20"` już istnieje.
- `effectiveDeadline(cycleId, { asOf })` w `src/cycles.ts` istnieje od F-01 i zwraca `{ date, basis: string[] }`: dla zwykłego cyklu `nextAssessmentDeadline(period_start, 0)`, dla ponownej oceny po negatywnej `periodEndAfterNegative(previousAcknowledgedOn)`. Ekrany cyklu przed zatwierdzeniem oceny (`/hr`, ocena, oś czasu, wydruk otwartego cyklu) czytają termin tylko stąd. Termin przekazany w części I to `part1_submitted.payload.dueDate` (zamrożony w dniu przekazania), a termin zatwierdzonej oceny to `AssessmentSnapshot.deadline` (stan z dnia zatwierdzenia). Cykl zostaje otwarty między `assessment_approved` a zapoznaniem, ale termin tej oceny jest już zamrożony w migawce (zasada wspólna kontraktu).
- Nowego kodu wymaga: łączenie nieobecności przez dni wolne, próg „dłużej niż miesiąc”, wyliczenie dni przedłużenia z listy wpisów. Dziś nikt tego nie liczy.
- Plik reguł `rules/regulation-2016-470.json` ma podstawę „art. 81 ust. 4 ustawy” dla 24 miesięcy. Nie ma progu nieobecności (art. 81 ust. 7 ustawy) ani § 9 ust. 3 rozporządzenia (zmiana oceniającego).
- Tabeli `absences`, osi czasu i formularzy kadr nie ma.

### Key Discoveries:

- Przykład organizatora (zasady liczenia terminów KPRM, sekcja „Nieobecności”, pkt 2–3): 05.10.2026 (pn)–16.10.2026 (pt) i 19.10.2026 (pn)–06.11.2026 (pt) to jedna nieobecność 05.10–06.11, dłuższa niż miesiąc, bo 17–18.10 to dni wolne. Każda z osobna jest krótsza niż miesiąc (12 i 19 dni), więc bez łączenia termin by się nie przesunął. To jest sedno kroku 3 pokazu.
- Liczba dni nieobecności to dni kalendarzowe od pierwszego do ostatniego dnia włącznie, razem z dniami wolnymi w środku: 05.10–06.11.2026 = 33 dni.
- Wyliczone obecnym silnikiem (`bun` na `src/silnik/terminy.ts`):
  - **Piotr:** okres od 27.11.2024 → termin bazowy 27.11.2026 (pt). Przedłużenie 33 dni: 27.11.2026 + 33 dni = 30.12.2026 (śr) → **nowy termin 30.12.2026**.
  - **Ewa:** okres od 20.11.2024 → termin bazowy 20.11.2026 (pt). Nieobecność 16.02.2026–28.08.2026 = 194 dni. 20.11.2026 + 194 dni = **02.06.2027** (śr).
  - **Zaokrąglenie dopiero po przedłużeniu:** okres od 14.03.2024, surowy koniec 14.03.2026 (sobota), 33 dni przedłużenia → 16.04.2026 (czw). Dodanie dni do terminu już przesuniętego na poniedziałek 16.03.2026 dałoby błędnie 20.04.2026.
- FAQ DSC (pyt. 19): nieobecność nie przedłuża 6 miesięcy do ponownej oceny po ocenie negatywnej, bo art. 81 ust. 7 odsyła tylko do terminu z ust. 4. Kotwicą ponownej oceny jest 6 miesięcy od zapoznania się z oceną negatywną: `periodEndAfterNegative(previousAcknowledgedOn)`.
- Tabela „Access Control” w `prd.md`: „Nieobecności i zmiany podległości” — oceniający: wgląd w daty, oceniany: brak, kadry: edycja. FR-014 wymaga, żeby oceniany widział nowy termin i jego podstawę.

## Desired End State

Kadry (Joanna) przy dacie systemowej 10.11.2026 otwierają `/hr`, w wierszu cyklu Piotra klikają „Wpisz nieobecność” (`/cycles/:id/absences`), zapisują pierwszy wpis, z osi czasu wracają do formularza i zapisują drugi. Ścieżka nie przechodzi przez `/cycles/:id/part1`. Oś pokazuje jedną ciągłą nieobecność 05.10.2026–06.11.2026 (33 dni), dopisek „dłużej niż miesiąc”, termin bazowy 27.11.2026 i nowy termin 30.12.2026, przy każdej dacie przepis, w stopce wersję reguł („Reguły 2016-470/1, obowiązują od 23.04.2016”). Ten sam termin 30.12.2026 pokazują `/hr` i wydruk otwartego cyklu Piotra, bo czytają `effectiveDeadline(cycleId)`. Wydruk zatwierdzonej oceny pokazuje `AssessmentSnapshot.deadline` i późniejszy wpis nieobecności go nie zmienia. Od widocznego `assessment_approved` także oś pokazuje `AssessmentSnapshot.deadline`: nieobecność wpisana później zapisuje się i stoi na osi ze zdaniem, że ocena jest już zatwierdzona i jej termin się nie zmienia. Piotr na swojej osi widzi nowy termin i podstawę, bez dat nieobecności. Oś Ewy (konto Marka albo Joanny) pokazuje zmianę oceniającego 05.12.2024 („kryteria bez zmian, § 9 ust. 3 rozporządzenia”) i, od 28.08.2026, nieobecność 16.02–28.08.2026 z nowym terminem 02.06.2027. Gdy data systemowa wejdzie w okno przypomnienia, oceniający i oceniany widzą na ekranie startowym zdanie z terminem i przepisem. `bun test` przechodzi.

## What We're NOT Doing

- Rodzaju nieobecności, w żadnym miejscu i dla nikogo (decyzja 10m). Formularz ma tylko „od”, „do” i „usprawiedliwiona”.
- Analizy nieobecności: żadnych sum, liczników, serii ani zestawień, żadnych etykiet ani liczb przy nazwisku (decyzja 3, zasada 7 w `AGENTS.md`). Liczba dni stoi tylko przy terminie, jako składnik jego wyliczenia, i tylko w widoku kadr i oceniającego.
- Pokazywania ocenianemu dat nieobecności i zmiany podległości (tabela dostępu PRD).
- Edycji i usuwania wpisanej nieobecności (decyzja 4). Pomyłkę poprawia się w danych pokazowych.
- Zmiany terminu przez oceniającego i wniosku ocenianego o zmianę terminu (art. 81 ust. 8; FR-012, FR-013): stan na ekranie kadr w S-06.
- Przedłużania terminu ponownej oceny po ocenie negatywnej (FAQ pyt. 19).
- Nieobecności oceniającego, zastępstw, przekazywania notatek starego oceniającego nowemu (notatki czyta tylko autor, własność S-04).
- Wstecznego datowania wpisów z ekranu: każdy zapis dostaje datę `today()`.
- Drugiej funkcji terminu, zapisu terminu w `cycles` ani zmian w ekranach wcześniejszych plastrów.
- Wyglądu: tokeny i komponenty pochodzą z design systemu autora (decyzja 10b). Plan wskazuje tylko ekrany.

## Założenia wobec wcześniejszych plastrów

Wszystkie nazwy pochodzą z rozdziału „Kontrakt wspólny dla wszystkich plastrów” w `context/changes/rules-engine-and-demo-data/plan.md`. Gdy kod ma inną nazwę niż kontrakt, obowiązuje kod (zasada kontraktu), a rozjazd trzeba zgłosić; S-03 nie tworzy drugiej nazwy.

- **Tabele (F-01):** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z `demo_date`.
- **Funkcje (F-01):** `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(type, cycleId, actorId, payload, date)` (data jest piątym argumentem; tylko w danych i przygotowaniu testów), połączenie z bazą z `getDb()` w `src/db.ts` (funkcje nie biorą argumentu `db`), `visibleEvents(cycleId, { asOf })` (granica `date <= today()` albo `asOf`, porządek `(date, id)`), `effectiveDeadline(cycleId, { asOf })` i `openCycle(personId)` w `src/cycles.ts`, `registerHomeTasks(fn)` w `src/home-tasks.ts`, `registerCycleLinks(fn)` w `src/cycle-links.ts`, `rulesVersion()`, `createTestApp({ today, seedOptions })` w `src/test-helpers.ts`, `runSeed(db, options)` w `src/seed.ts`.
- **Silnik (F-01):** `src/engine/deadlines.ts`: `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `periodEndAfterNegative`, `criteriaTalkDeadline`, `objectionDeadline`; odczyt reguł w `src/engine/rules.ts`.
- **Zdarzenia czytane przez oś:** `cycle_started { reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }` (`reason`: `hired`, `appointed`, `previous_assessment`; `previousOutcome`: `positive`, `negative`, `null`; F-01, S-01), `part1_submitted` (z `dueDate` i `rulesVersion`, który jest całym obiektem `{ version, effectiveFrom, act }`), `part1_confirmed` (S-01), `assessment_approved` (migawka `AssessmentSnapshot` z `deadline`), `assessment_acknowledged { place, date, name, objectionDeadline }`, `acknowledgement_fiction { reason, deliveryMethod, deliveredOn, objectionDeadline }` (S-02).
- **Trasy:** `GET /hr` (S-06) renderuje w wierszu cyklu `cycleLinks(cycle, person)`; `GET /cycles/:id/part1` (S-01) też pokazuje `cycleLinks`, ale w wersji minimalnej odpowiada kadrom 403, więc ścieżka kadr do formularza idzie tylko przez `/hr`. `GET /cycles/:id/sheet` (S-06) to wydruk.
- **Dane (F-01 `src/seed/base.ts`, S-01 `src/seed/part1.ts`):** osoby, w tym poprzedni naczelnik bez konta; cykle Piotra (od 27.11.2024), Ewy (od 20.11.2024) i Tomasza ze zdarzeniami `cycle_started`; oceniającym Ewy (`cycles.appraiser_id`) jest od początku Marek; część I Ewy przekazana przez poprzedniego naczelnika 02.12.2024 i potwierdzona 03.12.2024.
- **Pliki wspólne:** `rules/office-settings.json` z `officeSettings()` (tworzy S-01, S-03 dopisuje klucz); plik reguł (S-03 dopisuje `deadlines.longAbsenceOverMonths`, `deadlines.deadlineCounting` i `appraiserChange`, każdy z `basis`; czyta istniejące `deadlines.assessmentEveryMonths` i `deadlines.reassessmentAfterNegativeMonths`).

## Co ten plaster udostępnia

Zgodnie z kontraktem S-03 udostępnia innym plastrom tylko:

- Zdarzenia `absence_recorded { absence_id, notified }` (`notified` = identyfikatory oceniającego i ocenianego) i `appraiser_changed { from_id, to_id }`.
- Trasy `GET/POST /cycles/:id/absences`, `GET/POST /cycles/:id/appraiser`, `GET /cycles/:id/timeline`, montowane w `src/index.tsx` (S-03 dopisuje import i montowanie na końcu).
- Rozszerzone `effectiveDeadline(cycleId, { asOf })` w `src/cycles.ts`: ta sama sygnatura i kształt `{ date, basis: string[] }`, teraz z nieobecnościami.

Poza tym S-03 dopisuje do plików wspólnych według kontraktu: tabelę `absences(id, person_id, date_from, date_to, excused, recorded_on, recorded_by)` w `src/db.ts` (daty `RRRR-MM-DD` włącznie, `excused` 0/1, `recorded_on` = data zapisu i granica widoczności, `recorded_by` = osoba z kadr, bez kolumny rodzaju), moduł danych `src/seed/absences.ts` z jednym wywołaniem w `runSeed`, odnośniki przez `registerCycleLinks` i pozycje listy spraw przez `registerHomeTasks`.

Wewnętrzne (nikt poza S-03 z nich nie korzysta): `src/engine/absences.ts` (`mergeAbsences`, `isLongerThanMonth`, `assessmentDeadline`), `cycleDeadlineDetails(cycleId, { asOf })` i `visibleAbsences` w `src/cycles.ts`, `buildTimeline(cycleId, viewer)` w `src/timeline.ts`, widok `src/views/timeline.tsx`, klucze `deadlines.longAbsenceOverMonths`, `deadlines.deadlineCounting` i `appraiserChange` w pliku reguł i `assessmentReminderDays` w `rules/office-settings.json`.

## Implementation Approach

Najpierw wersja minimalna, potem dodatki w kolejności budowy. Silnik jest czystą funkcją na datach `RRRR-MM-DD` z testami (bez bazy). Termin nigdy nie jest zapisywany: `effectiveDeadline` liczy go za każdym razem z `cycles.period_start`, payloadu `cycle_started` i widocznych nieobecności ocenianego, więc każdy ekran otwartego cyklu pokazuje ten sam termin bez zmian w cudzym kodzie. Szczegóły wyliczenia (połączone nieobecności, dni, termin bazowy) zwraca `cycleDeadlineDetails(cycleId, { asOf })`; `effectiveDeadline` jest jego skrótem, więc nie ma drugiego źródła. Oś czasu składa wpisy z widocznych zdarzeń, widocznych nieobecności (już połączonych) i terminów wyliczonych (te widać także w przyszłości, bo to terminy, nie fakty). Od widocznego `assessment_approved` oś bierze termin z `AssessmentSnapshot.deadline` tego zdarzenia, a nie z `effectiveDeadline`. Widok zależy od roli: kadry i oceniający widzą daty nieobecności i zmianę oceniającego, oceniany tylko termin i podstawę. Zmiana oceniającego z formularza zapisuje zdarzenie i w tej samej transakcji ustawia `cycles.appraiser_id`; kryteria (`cycle_criteria`) nie są dotykane (§ 9 ust. 3). Ekrany używają `src/views/layout.tsx`; dopóki design system nie ma komponentu osi czasu, oś to semantyczna lista `<ol>` z `<time>`.

Trasy stosują zasady wspólne kontraktu: po udanym `POST`, który coś zapisuje, przekierowanie 303; błąd walidacji zawsze 422 z formularzem (nigdy 400); brak uprawnień 403. Wpisanie nieobecności i zmiana oceniającego wymagają otwartego cyklu: gdy `openCycle(cycles.person_id)` nie zwraca tego cyklu, trasa odpowiada 409 bez zapisu. Cykl z widocznym `assessment_approved`, ale bez zapoznania i bez fikcji, jest nadal otwarty, więc nieobecność da się wpisać.

**Wersja minimalna (ok. 45 min) = Phase 1.** Silnik z testami, rozszerzone `effectiveDeadline`, tabela `absences`, formularz kadr, oś czasu z połączoną nieobecnością, progiem, nowym terminem, przepisem i wersją reguł, odnośniki w wierszu cyklu na `/hr`. Krok 3 pokazu działa na samej fazie 1.

**Kolejność cięcia** (po wersji minimalnej budować od góry; gdy brakuje czasu, wypada od dołu):
1. Phase 2, pkt 1: zmiana oceniającego Ewy na osi, czyli wgrane zdarzenie `appraiser_changed` i jego wpis na osi. **Potrzebne do wersji 5-minutowej pokazu.** Samo zdarzenie w danych nie wystarcza.
2. Phase 2, pkt 2: nieobecność Ewy w `src/seed/absences.ts`.
3. Phase 2, pkt 3: wpisy osi z pozostałych cudzych zdarzeń (część I, ocena, zapoznanie, fikcja).
4. Phase 2, pkt 4: formularz zmiany oceniającego.
5. Phase 3: przypomnienia na ekranie startowym.

Nie tniemy: łączenia przez dni wolne, wspólnego terminu w `effectiveDeadline`, ścieżki `/hr` → „Wpisz nieobecność” → oś → drugi wpis, ograniczenia widoku ocenianego.

## Phase 1: Wersja minimalna — silnik, wspólny termin, formularz kadr i oś (ok. 45 min)

### Changes Required:

#### 1. Reguły jako dane

**File**: `rules/regulation-2016-470.json`, `src/engine/rules.ts`

**Intent**: Dopisać próg długiej nieobecności i sposób liczenia do sekcji `deadlines` oraz podstawę zmiany oceniającego jako klucz główny, żeby przepis przy dacie pochodził z pliku reguł (decyzja 7). Nazwy kluczy z kontraktu: `deadlines.longAbsenceOverMonths`, `deadlines.deadlineCounting`, `appraiserChange`, każdy z `basis`. Istniejące `deadlines.assessmentEveryMonths` i `deadlines.reassessmentAfterNegativeMonths` zostają bez zmian. Wersji pliku nie zmieniać: to uzupełnienie brakującej wartości tego samego aktu.

**Contract**:

```json
"deadlines": {
  "longAbsenceOverMonths": { "value": 1, "basis": "art. 81 ust. 7 ustawy" },
  "deadlineCounting": { "basis": "art. 110–115 Kodeksu cywilnego; koniec w sobotę albo dzień wolny przechodzi na następny dzień roboczy" }
},
"appraiserChange": { "basis": "§ 9 ust. 3", "rule": "oceny dokonuje się na podstawie wcześniej wybranych kryteriów" }
```

Fragment pokazuje tylko nowe klucze; pozostałe klucze `deadlines` zostają na miejscu.

#### 2. Łączenie nieobecności i termin z przedłużeniem

**File**: `src/engine/absences.ts` (nowy), `src/engine/absences.test.ts` (nowy)

**Intent**: Moduł obok `deadlines.ts`, który z listy wpisów liczy ciągłe nieobecności i dni przedłużenia, a termin wylicza przez funkcje F-01. `deadlines.ts` zostaje bez zmian (19 testów F-01 nienaruszone).

**Contract**:

```ts
type AbsenceInput = { id?: number; from: string; to: string; excused: boolean }; // z absences.date_from / date_to
type MergedAbsence = { from: string; to: string; days: number; longerThanMonth: boolean; counted: boolean; parts: AbsenceInput[] };
type CycleKind = "regular" | "after_negative";
type CycleBasis = { kind: CycleKind; periodStart: string; previousAcknowledgedOn: string | null };

mergeAbsences(absences: AbsenceInput[]): MergedAbsence[]
isLongerThanMonth(from: string, to: string): boolean
assessmentDeadline(cycle: CycleBasis, absences: AbsenceInput[]): {
  base: string;               // regular: nextAssessmentDeadline(periodStart, 0); after_negative: periodEndAfterNegative(previousAcknowledgedOn)
  extensionDays: number;      // suma dni z liczonych nieobecności; after_negative: 0
  deadline: string;           // regular: nextAssessmentDeadline(periodStart, extensionDays); after_negative: base
  movedToWorkingDay: boolean; // regular: deadline !== addDays(addMonths(periodStart, 24), extensionDays)
  merged: MergedAbsence[];    // połączone nieobecności usprawiedliwione, do osi
}
```

Reguły (każda ma test):
- `mergeAbsences` bierze tylko `excused: true`, sortuje po `from`, rzuca błąd przy `to < from` albo złej dacie.
- Dwa sąsiednie wpisy łączą się, gdy nachodzą na siebie, stykają się (`next.from <= addDays(cur.to, 1)`) albo gdy każdy dzień ściśle między `cur.to` a `next.from` jest dniem wolnym (`isDayOff`). Połączony koniec to późniejszy z dwóch końców. Nieobecność nieusprawiedliwiona niczego nie łączy i niczego nie przedłuża (art. 81 ust. 7 mówi o usprawiedliwionej): dzień roboczy przykryty takim wpisem przerywa ciągłość.
- `days` = dni kalendarzowe od `from` do `to` włącznie.
- **Próg.** Nieobecność zajmuje przedział od `from` do `addDays(to, 1)` (bez końca). „Dłużej niż miesiąc” ⇔ `addDays(to, 1) > addMonths(from, value)`, porównanie ścisłe, `value` z `deadlines.longAbsenceOverMonths`. Przykłady: od 05.10 miesiąc kończy się 05.11, więc 05.10–04.11 to dokładnie miesiąc (nie), 05.10–05.11 to dłużej (tak). Od 31.01.2026 miesiąc kończy się 28.02.2026, więc 31.01–27.02.2026 to dokładnie miesiąc (nie), 31.01–28.02.2026 to dłużej (tak).
- **Ponowna ocena po negatywnej.** Dla `kind = "after_negative"`: `base = deadline = periodEndAfterNegative(previousAcknowledgedOn)` (sześć miesięcy od zapoznania z oceną negatywną, `deadlines.reassessmentAfterNegativeMonths`), `extensionDays = 0`, nieobecności nie przedłużają terminu (FAQ pyt. 19), a `merged` służy tylko osi.
- **Przedłużenie, kolejno (`"regular"`).** `rawEnd = addMonths(periodStart, 24)` (24 to `deadlines.assessmentEveryMonths`); połączone nieobecności przetwarzane po kolei według `from`. Nieobecność kończącą się przed `periodStart` pomija. Nieobecność z `from > rawEnd` (bieżący surowy koniec) pomija i kończy pętlę. Dla nieobecności dłuższej niż miesiąc (próg na całej nieobecności, także z dniami sprzed okresu) dodaje dni liczone od `max(from, periodStart)` do `to` włącznie: `rawEnd = addDays(rawEnd, dni)`, `counted = true`. Dzięki temu druga długa nieobecność, która zaczyna się w już przedłużonym okresie, też przedłuża termin.
- **Dzień roboczy raz, na końcu.** `deadline = toWorkingDay(rawEnd)`, co jest równe `nextAssessmentDeadline(periodStart, extensionDays)`; przesunięcie na dzień roboczy nigdy nie wchodzi do `rawEnd` w trakcie pętli.

#### 3. Wspólny termin cyklu: rozszerzenie `effectiveDeadline`

**File**: `src/cycles.ts`

**Intent**: Rozszerzyć istniejącą funkcję F-01, bez zmiany jej podpisu i kształtu. Nowe wewnętrzne `cycleDeadlineDetails(cycleId, { asOf })` czyta `cycles.period_start` i payload widocznego zdarzenia `cycle_started`: rodzaj `"after_negative"`, gdy `reason = "previous_assessment"` i `previousOutcome = "negative"`, w pozostałych przypadkach `"regular"`; `previousAcknowledgedOn` przechodzi do silnika. Potem czyta widoczne nieobecności ocenianego (`visibleAbsences(personId, { asOf })`: `recorded_on <= asOf ?? today()`), woła `assessmentDeadline` i dokłada podstawy. `effectiveDeadline(cycleId, { asOf })` zwraca z niego `{ date: deadline, basis }`. Dla `"after_negative"` data jest ta sama co w F-01 (`periodEndAfterNegative(previousAcknowledgedOn)`), bez nieobecności.

`basis` nie zawiera dat ani długości nieobecności, bo ten sam termin widzi oceniany. Zwykły cykl: `["art. 81 ust. 4 ustawy"]`, przy przedłużeniu dodatkowo „art. 81 ust. 7 ustawy: termin przedłużony o czas usprawiedliwionej nieobecności dłuższej niż miesiąc”, przy `movedToWorkingDay` także „art. 115 Kodeksu cywilnego”. Ponowna ocena po negatywnej: podstawa z F-01 bez zmian.

**Contract**: `effectiveDeadline(cycleId, { asOf }): { date: string; basis: string[] }` (podpis bez zmian); `cycleDeadlineDetails(cycleId, { asOf })` = wynik `assessmentDeadline` + `{ kind, basis, rules: rulesVersion() }`. Wcześniejsze ekrany nie wymagają zmian.

#### 4. Tabela nieobecności

**File**: `src/db.ts`

**Intent**: Dopisać do schematu tabelę `absences` z kolumnami kontraktu. `visibleAbsences(personId, { asOf })` w `src/cycles.ts` zwraca wiersze z `recorded_on <= asOf ?? today()` (ta sama granica co `visibleEvents`).

**Contract**: `CREATE TABLE IF NOT EXISTS absences (id, person_id, date_from, date_to, excused DEFAULT 1, recorded_on, recorded_by)`; brak kolumny rodzaju.

#### 5. Formularz kadr: wpisanie nieobecności

**File**: `src/routes/absences.tsx`, `src/views/absence-form.tsx`, `src/index.tsx` (dopisanie montowania)

**Intent**: Kadry wpisują nieobecność ocenianego z cyklu. Pola: „Od”, „Do”, „Nieobecność usprawiedliwiona” (zaznaczone domyślnie). Nad polami: „System zapisuje tylko daty. Rodzaju nieobecności nie podajesz”. Pod formularzem lista wpisanych nieobecności tej osoby (same daty i „usprawiedliwiona / nieusprawiedliwiona”). Zapis dopiero po kliknięciu „Zapisz nieobecność”: wiersz w `absences` (`recorded_on = today()`, `recorded_by` = konto), zdarzenie `absence_recorded { absence_id, notified: [appraiser_id, person_id] }` przez `recordEvent`, przekierowanie na oś czasu z komunikatem zależnym od skutku. Gdy `effectiveDeadline` po zapisie jest inny niż przed nim: „Zapisano. Nowy termin oceny widzą: {imię i nazwisko} (oceniający), {imię i nazwisko} (oceniany)”, z nazwiskami z `cycles.appraiser_id` i `cycles.person_id`. Gdy termin się nie zmienił (na przykład pierwszy wpis kroku 3, krótszy niż miesiąc): „Zapisano. Termin oceny się nie zmienił”. Test sprawdza oba komunikaty na dwóch wpisach kroku 3. Trasa czyta z żądania tylko `from`, `to` i `excused`; inne pola (na przykład rodzaj nieobecności) są pomijane i nigdzie nie trafiają. Tylko rola `hr`; inni 403. S-03 dopisuje import i montowanie swoich tras w `src/index.tsx`.

**Contract**: `GET /cycles/:id/absences`; `POST /cycles/:id/absences` (pola `from`, `to`, `excused`) → 303 na `/cycles/:id/timeline`; brak daty, zła data albo „Do” przed „Od” → 422 z tym samym formularzem, komunikatem przy polu („Data końca nie może być wcześniejsza niż data początku”) i bez zapisu; brak roli `hr` → 403; `openCycle(cycles.person_id)` nie zwraca tego cyklu → 409 bez zapisu. Cykl po `assessment_approved`, a przed zapoznaniem, jest otwarty: zapis przechodzi (303), a termin oceny się nie zmienia (pkt 6).

#### 6. Oś czasu cyklu

**File**: `src/routes/timeline.tsx`, `src/views/timeline.tsx`, `src/timeline.ts`

**Intent**: Ekran dla ocenianego (`cycles.person_id`), obecnego oceniającego (`cycles.appraiser_id`) i kadr; inni 403. Wewnętrzne `buildTimeline(cycleId, viewer)` składa wpisy z `cycleDeadlineDetails`, widok rysuje je w kolejności dat. Każdy wpis: data `DD.MM.RRRR`, tytuł, opcjonalne wyjaśnienie, przepis.

Widok kadr i oceniającego:
- początek okresu oceny (art. 81 ust. 4 ustawy);
- każda połączona nieobecność usprawiedliwiona: „Nieobecność 05.10.2026–06.11.2026 (33 dni)”, a gdy powstała z kilku wpisów, „Dwa wpisy liczą się jako jedna nieobecność, bo dzielą je tylko dni wolne” (art. 81 ust. 7 ustawy; zasady liczenia terminów KPRM); przy progu „dłużej niż miesiąc: termin oceny przedłuża się o 33 dni” albo „nie dłużej niż miesiąc: termin bez zmian”; w cyklu po ocenie negatywnej „nie przedłuża terminu ponownej oceny”;
- nieobecność nieusprawiedliwiona: same daty i „nie przedłuża terminu (art. 81 ust. 7 dotyczy nieobecności usprawiedliwionej)”;
- termin bazowy, a przy przedłużeniu przekreślony obok nowego terminu, z podstawami z `basis`;
- dla kadr pod listą odnośnik „Wpisz kolejną nieobecność” (`/cycles/:id/absences`): to drugi wpis w kroku 3.

**Termin po zatwierdzeniu oceny.** Od widocznego `assessment_approved` (dla wszystkich ról) wpis terminu pokazuje `AssessmentSnapshot.deadline` z payloadu tego zdarzenia, a nie `effectiveDeadline`. Nieobecność wpisana później (jej zdarzenie `absence_recorded` jest po `assessment_approved` w porządku `(date, id)`, więc także wpis z tego samego dnia zrobiony po zatwierdzeniu) jest zapisana i stoi na osi kadr i oceniającego ze swoimi datami, ale zamiast zdania o przedłużeniu ma zdanie „Ocena jest już zatwierdzona, jej termin się nie zmienia”. Nieobecność wpisana przed zatwierdzeniem jest już zawarta w terminie z migawki i dostaje zwykłe zdanie o progu.

Widok ocenianego: początek okresu, termin (przy przedłużeniu: termin bazowy przekreślony i nowy; po zatwierdzeniu termin z migawki) z `basis`. Bez dat i długości nieobecności i bez wpisu o zmianie oceniającego (tabela dostępu PRD).

Stopka dla wszystkich: wersja reguł z `part1_submitted.payload.rulesVersion`, gdy część I jest przekazana, w przeciwnym razie z `rulesVersion()`. Oba źródła mają ten sam kształt `{ version, effectiveFrom, act }`; stopka składa z niego tekst „Reguły: 2016-470/1, obowiązują od 23.04.2016” (`version` bez zmian, `effectiveFrom` w formacie `DD.MM.RRRR`). Przy nazwisku ocenianego w nagłówku i przy nazwiskach we wpisach nie ma etykiety ani liczby; liczba dni stoi tylko we wpisie nieobecności, przy jej datach.

**Contract**: `GET /cycles/:id/timeline` → 200 dla uczestnika i kadr, 403 dla innych. Wewnętrznie `buildTimeline(cycleId, viewer): TimelineEntry[]`, `TimelineEntry = { date, title, detail?, basis, kind: "fact" | "deadline" }`. Fakty tylko z widocznych zdarzeń i nieobecności, terminy zawsze.

#### 7. Odnośniki w wierszu cyklu na `/hr`

**File**: `src/timeline.ts` (rejestracja przy starcie)

**Intent**: Przez `registerCycleLinks(fn)` dodać odnośniki, które `cycleLinks(cycle, person)` zwraca na `/hr` i na ekranie wejściowym cyklu, każdy tylko dla ról wpuszczanych przez jego trasę `GET`: „Oś czasu” (oceniany, oceniający, kadry), „Wpisz nieobecność” (tylko `hr`) i „Zmień oceniającego” (tylko `hr`, dopiero gdy istnieje faza 2 pkt 4). Oba odnośniki zapisu („Wpisz nieobecność”, „Zmień oceniającego”) oraz przycisk „Wpisz kolejną nieobecność” na osi pokazują się tylko dla cyklu, który zwraca `openCycle(cycles.person_id)`; przy cyklu zamkniętym (na przykład cykl Piotra po zapoznaniu w kroku 5) kadry widzą samą „Oś czasu”. Test: po `assessment_acknowledged` `cycleLinks(cycle, joanna)` nie zawiera `/absences`. Ścieżka kroku 3: `/hr` → w wierszu cyklu Piotra „Wpisz nieobecność” → `/cycles/:id/absences` → oś → „Wpisz kolejną nieobecność” → oś. Ścieżka nie przechodzi przez `/cycles/:id/part1`. Te odnośniki zostają w każdej wersji.

**Contract**: `cycleLinks(cycle, joanna)` zawiera `/cycles/:id/timeline` i `/cycles/:id/absences`; `cycleLinks(cycle, piotr)` zawiera `/cycles/:id/timeline` i nie zawiera `/cycles/:id/absences` ani `/cycles/:id/appraiser` (lista ma też odnośniki wcześniejszych plastrów, na przykład kartę otwarcia z S-01 oraz arkusz i historię z S-06, więc test nie sprawdza, że odnośnik osi jest jedyny); `GET /hr` na koncie Joanny zawiera w wierszu cyklu Piotra odnośnik `/cycles/:id/absences` z tekstem „Wpisz nieobecność”.

### Success Criteria:

#### Automated Verification:

- Testy silnika przechodzą: `bun test src/engine`
- Przykład organizatora: dwa wpisy 05.10–16.10.2026 i 19.10–06.11.2026 dają jedną nieobecność 05.10–06.11, 33 dni, `longerThanMonth: true`; okres od 27.11.2024 daje termin bazowy `2026-11-27` i nowy `2026-12-30`
- Próg i kolejność: 31.01–27.02.2026 nie, 31.01–28.02.2026 tak; druga długa nieobecność w przedłużeniu przedłuża; okres od 14.03.2024 i 33 dni dają `2026-04-16`; ponowna ocena po negatywnej ma termin `periodEndAfterNegative(previousAcknowledgedOn)` i długa nieobecność go nie zmienia
- Po dwóch wpisach kadr ten sam termin 30.12.2026 zwracają `effectiveDeadline`, `GET /hr` i oś czasu; oś zawiera „05.10.2026–06.11.2026”, „dłużej niż miesiąc”, „art. 81 ust. 7” i wersję reguł
- Ścieżka `/hr` → „Wpisz nieobecność” → `/cycles/:id/absences` → oś → drugi wpis działa na koncie kadr bez wejścia na `/cycles/:id/part1`; `POST` odpowiada 303; oceniany widzi na osi 30.12.2026 i podstawę, bez „05.10.2026” i bez „33 dni”: `bun test`
- Bez rodzaju nieobecności: tabela `absences` nie ma kolumny rodzaju, formularz nie ma takiego pola, a `POST` z dodatkowym polem rodzaju zapisuje wiersz bez tej wartości (decyzja 10m); oś i formularz nie mają liczby ani etykiety przy nazwisku osoby (zasada 7): `bun test`
- Termin po zatwierdzeniu: w cyklu Piotra z widocznym `assessment_approved` i bez zapoznania dwa wpisy nieobecności 05.10–06.11.2026 odpowiadają 303 i zapisują się; oś pokazuje `AssessmentSnapshot.deadline` (27.11.2026, nie 30.12.2026), nieobecność ze zdaniem „Ocena jest już zatwierdzona, jej termin się nie zmienia”; w cyklu zamkniętym zapis daje 409, a błąd walidacji 422: `bun test src/routes/absences.test.ts`

#### Manual Verification:

- Krok 3 pokazu na koncie Joanny (data 10.11.2026): z `/hr` przez „Wpisz nieobecność” do formularza, dwa wpisy, oś z jedną nieobecnością i nowym terminem; ten sam termin w wierszu Piotra na `/hr`

## Phase 2: Dane Ewy, cudze zdarzenia na osi, zmiana oceniającego (ok. 20 min)

### Changes Required:

#### 1. Zmiana oceniającego Ewy: dane i wpis na osi (potrzebne do wersji 5-minutowej pokazu)

**File**: `src/seed/absences.ts` (nowy), `src/seed.ts` (jedno wywołanie), `src/timeline.ts`

**Intent**: Wersja 5-minutowa pokazuje oś Ewy ze zmianą oceniającego, więc powstają razem dane i ich wyświetlenie.
- Dane: `src/seed/absences.ts` dopisuje `seedEvent("appraiser_changed", ewaCycle, joanna, { from_id: previousHead, to_id: marek }, "2024-12-05")` (data jako piąty argument; przejęcie wydziału, `demo.md`; `previousHead` to poprzedni naczelnik). Moduł korzysta z połączenia z `getDb()`. Data jest po potwierdzeniu części I Ewy (03.12.2024) i przed pierwszym dniem pokazu (09.12.2024). Moduł nie zmienia `cycles.appraiser_id`: Marek jest oceniającym Ewy od początku w `src/seed/base.ts` (F-01). Moduł jest wołany z `runSeed(db, options)`; S-03 dopisuje w `src/seed.ts` jedno wywołanie, jako ostatnie (po `base`, `part1`, `notes`, `assessments`).
- Wyświetlenie: `buildTimeline` zamienia widoczne `appraiser_changed` na wpis „Zmiana oceniającego: <from> → <to>. Kryteria bez zmian” z przepisem § 9 ust. 3 rozporządzenia, tylko w widoku kadr i oceniającego.

**Contract**: po `bun run seed` przy dacie 2024-12-09 oś Ewy na koncie Marka ma wpis 05.12.2024 z „§ 9 ust. 3”; na koncie Ewy go nie ma; `cycles.appraiser_id` Ewy wskazuje Marka przed wywołaniem modułu i po nim.

#### 2. Nieobecność Ewy w danych

**File**: `src/seed/absences.ts`

**Intent**: Nieobecności Piotra nie są wgrywane: Joanna wpisuje je na żywo w kroku 3. Moduł wgrywa przez `getDb()` wiersz `absences` 2026-02-16–2026-08-28, `excused = 1`, `recorded_on = 2026-08-28`, `recorded_by` = Joanna, oraz `seedEvent("absence_recorded", ewaCycle, joanna, { absence_id, notified: [marek, ewa] }, "2026-08-28")`. Wpis jest retrospektywny i odsłania się w dniu końca nieobecności, nie wcześniej (decyzja 10i).

**Contract**: po `bun run seed`: przy dacie 2026-08-27 oś Ewy nie ma nieobecności, a termin to 20.11.2026; przy 2026-08-28 i 2026-08-29 jest nieobecność i termin 02.06.2027.

#### 3. Wpisy osi z pozostałych cudzych zdarzeń

**File**: `src/timeline.ts`

**Intent**: Jedna tablica „typ zdarzenia → tytuł i przepis”, czytana z `visibleEvents(cycleId)` (ta sama, do której pkt 1 dopisał `appraiser_changed`); nieznane typy są pomijane: `part1_submitted` (termin rozmowy o kryteriach, § 7), `part1_confirmed`, `assessment_approved`, `assessment_acknowledged` i `acknowledgement_fiction` z terminem sprzeciwu z `payload.objectionDeadline` (art. 83 ust. 1).

**Contract**: oś Piotra po kroku 1 ma wpisy przekazania i potwierdzenia części I; oś cyklu z zapoznaniem ma termin sprzeciwu z `payload.objectionDeadline`.

#### 4. Formularz kadr: zmiana oceniającego

**File**: `src/routes/appraiser.tsx`, `src/views/appraiser-change-form.tsx`

**Intent**: Kadry wybierają nowego oceniającego spośród osób z rolą `appraiser` (bez obecnego) i klikają „Zapisz zmianę oceniającego”. Przed przyciskiem: „Kryteria zostają bez zmian. Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów (§ 9 ust. 3 rozporządzenia)” i lista kryteriów cyklu. W jednej transakcji: `recordEvent("appraiser_changed", cycleId, actor, { from_id, to_id })` i `UPDATE cycles SET appraiser_id`. `cycle_criteria` nietknięte. Tylko `hr`; inni 403.

**Uwaga dla S-04:** autoryzacja notatki w cyklu idzie za `cycles.appraiser_id`, a nie za `people.supervisor_id` (ten tylko dla osoby bez cyklu, jak Maria); odczyt notatki zostaje ograniczony do autora, więc dawny oceniający nadal czyta swoje notatki, a nowy ich nie widzi.

**Contract**: `GET /cycles/:id/appraiser`; `POST /cycles/:id/appraiser` (pole `appraiser_id`) → 303 na `/cycles/:id/timeline`; ten sam oceniający albo osoba spoza listy → 422 bez zapisu; brak roli `hr` → 403; `openCycle(cycles.person_id)` nie zwraca tego cyklu → 409 bez zapisu.

### Success Criteria:

#### Automated Verification:

- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Oś Ewy przy 2024-12-09: na koncie Marka wpis o zmianie oceniającego z „§ 9 ust. 3”, na koncie Ewy brak; `cycles.appraiser_id` Ewy = Marek: `bun test src/routes/timeline.test.ts`
- Nieobecność Ewy: dzień przed końcem (2026-08-27) niewidoczna, w dniu końca (2026-08-28) i dzień po (2026-08-29) widoczna z terminem `2027-06-02`
- Po zmianie oceniającego z formularza `cycle_criteria` ma te same wiersze, `cycles.appraiser_id` wskazuje nowego, nowy oceniający ma dostęp do osi, poprzedni nie; `POST` odpowiada 303: `bun test src/routes/appraiser.test.ts`

#### Manual Verification:

- Oś Ewy na koncie Marka ze zmianą oceniającego (§ 9 ust. 3) i nieobecnością z nowym terminem; na koncie Ewy tylko termin i podstawa

## Phase 3: Przypomnienia przy przesuwaniu daty (ok. 15 min)

### Changes Required:

#### 1. Ustawienie urzędu

**File**: `rules/office-settings.json`

**Intent**: Liczba dni przed terminem oceny, od której pojawia się przypomnienie. Wartość nie wynika z przepisów, więc na ekranie jest oznaczona jako „ustawienie urzędu”.

**Contract**: `"assessmentReminderDays": { "value": 30, "label": "ustawienie urzędu" }`.

#### 2. Przypomnienia na ekranie startowym

**File**: `src/reminders.ts` (rejestracja przez `registerHomeTasks`)

**Intent**: Pozycje listy spraw liczone z `effectiveDeadline` przy bieżącej dacie systemowej (nic nie jest zapisywane), dla oceniającego i ocenianego otwartego cyklu (`openCycle`):
- gdy `today()` jest w oknie `[date − assessmentReminderDays, date]`: „Termin oceny Piotra Wójcika: 30.12.2026 (art. 81 ust. 4 i 7 ustawy). Przypomnienie na 30 dni przed terminem: ustawienie urzędu”, z odnośnikiem do osi;
- gdy termin jest przedłużony: „Termin oceny przesunięty z 27.11.2026 na 30.12.2026 z powodu nieobecności dłuższej niż miesiąc (art. 81 ust. 7 ustawy)”. Zdanie mówi o terminie, nie o pracowniku; bez dat i długości nieobecności.
Dla kadr nic (mają `/hr`). Po widocznym `assessment_approved` przypomnienia o terminie tej oceny nie ma: ocena jest sporządzona, a jej termin jest zamrożony w migawce.

**Contract**: funkcja przekazana do `registerHomeTasks` zwraca `{ text, basis, href }[]`.

### Success Criteria:

#### Automated Verification:

- Bez nieobecności przy dacie 2026-10-27 Marek nie ma przypomnienia o terminie Piotra, przy 2026-10-28 ma („27.11.2026”): `bun test`

#### Manual Verification:

- Przesunięcie daty na koncie administratora i wejście na konto Marka pokazuje przypomnienie z przepisem i dopiskiem „ustawienie urzędu”

## Testing Strategy

`src/engine/absences.test.ts` (czyste funkcje, bez bazy):
- przykład organizatora: jedna nieobecność 05.10–06.11.2026, 33 dni, dłużej niż miesiąc; 27.11.2026 → 30.12.2026;
- każdy z tych wpisów osobno nie przekracza miesiąca (12 i 19 dni), przedłużenie 0;
- przerwa z dniem roboczym (05.10–16.10 i 20.10–06.11.2026) daje dwie nieobecności, przedłużenie 0;
- nieusprawiedliwiony wpis w przerwie: 05.10–16.10 (usprawiedliwiona), 19.10–20.10 (nieusprawiedliwiona), 21.10–06.11 (usprawiedliwiona) → dwie nieobecności (12 i 17 dni), przedłużenie 0;
- przerwa ze świętem w środku tygodnia (09.11–10.11.2026 i 12.11.2026–…, 11.11 to środa i święto) łączy się;
- wpisy nachodzące na siebie i stykające się łączą się; kolejność wejścia nie ma znaczenia;
- koniec miesiąca: 05.10–04.11.2026 nie, 05.10–05.11.2026 tak; 31.01–27.02.2026 nie, 31.01–28.02.2026 tak;
- druga długa nieobecność w przedłużeniu: okres od 27.11.2024, 05.10–06.11.2026 (33 dni) i 07.12.2026–15.01.2027 (40 dni; zaczyna się po 27.11.2026, ale przed 30.12.2026) → `2027-02-08`; nieobecność zaczęta po bieżącym surowym końcu nie przedłuża;
- zaokrąglenie dopiero po przedłużeniu: okres od 14.03.2024 (surowy koniec w sobotę), nieobecność 05.05–06.06.2025 (33 dni) → `2026-04-16`, nie `2026-04-20`; okres od 16.03.2024 z tą samą nieobecnością → `2026-04-20`, `movedToWorkingDay: true`;
- Ewa: 194 dni, `2027-06-02`;
- cykl `after_negative`: `base` i `deadline` równe `periodEndAfterNegative(previousAcknowledgedOn)`, nie terminowi 24-miesięcznemu; długa nieobecność ich nie zmienia, `extensionDays: 0`;
- nieobecność zaczęta przed początkiem okresu liczy dni od początku okresu; „Do” przed „Od” rzuca błąd.

`src/routes/absences.test.ts` przez `app.request()` na `createTestApp({ today })`:
- kadry przy 2026-11-10: `GET /hr` zawiera w wierszu cyklu Piotra „Wpisz nieobecność” z adresem `/cycles/:id/absences`; `GET` tego adresu → 200; `POST /cycles/:id/absences` dwa razy → 303 na oś; żadne żądanie w tej ścieżce nie idzie do `/cycles/:id/part1`; potem `effectiveDeadline(piotr).date`, `GET /hr` i oś czasu pokazują ten sam termin 30.12.2026;
- oceniający i oceniany: `POST /cycles/:id/absences` → 403, nic nie zapisane; zły zakres dat → 422, nic nie zapisane; cykl zamknięty → 409, nic nie zapisane;
- decyzja 10m: `absences` nie ma kolumny rodzaju (`PRAGMA table_info`), formularz nie ma pola rodzaju, `POST` z dodatkowym polem `type=urlop` zapisuje wiersz, w którym tej wartości nie ma w żadnej kolumnie ani w payloadzie `absence_recorded`;
- zasada 7: na formularzu nieobecności przy nazwisku osoby nie stoi liczba ani etykieta;
- wydruk: `GET /cycles/:id/sheet` otwartego cyklu Piotra po dwóch wpisach pokazuje 30.12.2026; wydruk zatwierdzonej oceny pokazuje `AssessmentSnapshot.deadline` i nie zmienia się po wpisaniu nieobecności po dniu zatwierdzenia;
- termin po zatwierdzeniu: `createTestApp({ today: "2026-11-21", seedOptions: { afterStep1: true } })`, w przygotowaniu `seedEvent("assessment_approved", piotrCycle, marek, buildAssessmentSnapshot(piotrCycle, draft, { asOf: "2026-11-20" }), "2026-11-20")`; potem kadry wpisują 05.10–16.10.2026 i 19.10–06.11.2026 → oba `POST` 303 (cykl nadal otwarty), wiersze są w `absences`; oś kadr pokazuje termin 27.11.2026 z migawki, bez 30.12.2026, i nieobecność 05.10.2026–06.11.2026 ze zdaniem „Ocena jest już zatwierdzona, jej termin się nie zmienia”; oś Piotra pokazuje 27.11.2026.

`src/routes/timeline.test.ts` przez `app.request()` na `createTestApp({ today })`:
- oś: oceniany, oceniający i kadry → 200; osoba spoza cyklu (Tomasz) → 403; oceniany nie widzi dat nieobecności ani zmiany oceniającego, oceniający i kadry widzą;
- zasada 7: w nagłówku osi i we wpisach przy nazwisku osoby nie stoi liczba ani etykieta; liczba dni występuje tylko we wpisie nieobecności;
- `cycleLinks(cycle, joanna)` zawiera `/cycles/:id/timeline` i `/cycles/:id/absences`; `cycleLinks(cycle, piotr)` zawiera `/cycles/:id/timeline` i nie zawiera `/cycles/:id/absences` ani `/cycles/:id/appraiser` (odnośniki wcześniejszych plastrów mogą być na liście); oś dla kadr zawiera „Wpisz kolejną nieobecność”;
- zmiana oceniającego Ewy z danych: wpis z „§ 9 ust. 3” na koncie Marka, brak na koncie Ewy;
- widoczność (10i): nieobecność Ewy przy 2026-08-27, 2026-08-28, 2026-08-29.

`src/routes/appraiser.test.ts` przez `app.request()`:
- zmiana oceniającego zachowuje kryteria: `cycle_criteria` ma te same wiersze przed zmianą i po niej, `appraiser_id` wskazuje nowego, dostęp do osi przechodzi na nowego; `POST` → 303; ten sam oceniający → 422; inna rola niż `hr` → 403.

`src/reminders.test.ts`: okno 30 dni przed terminem Piotra (bez i z przedłużeniem).

Ręcznie: krok 3 pokazu i oś Ewy z wersji 5-minutowej, na komputerze i telefonie (360 px).

## Open Questions

Żadne nie blokuje budowy; implementator przyjmuje rekomendację.

1. **Nieobecność wykraczająca poza okres oceny.** Rekomendacja: dni sprzed początku okresu się nie liczą, próg sprawdza się na całej nieobecności, nieobecność zaczęta po bieżącym surowym końcu nie przedłuża.

## References

- `context/changes/rules-engine-and-demo-data/plan.md`, rozdział „Kontrakt wspólny dla wszystkich plastrów” (źródło nazw)
- `context/foundation/decisions.md` (decyzje 3, 4, 7, 10b, 10g, 10h, 10i, 10m)
- `context/foundation/prd.md` (US-03, FR-010, FR-011, FR-014, FR-033, FR-034, Business Logic, Access Control)
- `context/foundation/roadmap.md` (S-03)
- `context/foundation/demo.md` (krok 3, wersja 5-minutowa, „Ustalenia do scenariusza”: przejęcie wydziału 5.12.2024, data kroku 3 10.11.2026)
- `src/silnik/terminy.ts` i `src/silnik/ocena.test.ts` (po F-01: `src/engine/deadlines.ts`)
- Ustawa o służbie cywilnej: art. 81 ust. 4, 7 i 9, art. 83 ust. 1; rozporządzenie Dz.U. 2016 poz. 470: § 7, § 9 ust. 3; Kodeks cywilny art. 110–115; zasady liczenia terminów KPRM (sekcja „Nieobecności”, pkt 2–3); FAQ DSC pyt. 19

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wersja minimalna — silnik, wspólny termin, formularz kadr i oś

#### Automated

- [ ] 1.1 Testy silnika przechodzą: `bun test src/engine`
- [ ] 1.2 Przykład organizatora daje nieobecność 05.10–06.11.2026 (33 dni) i termin 2026-12-30
- [ ] 1.3 Próg na końcu miesiąca, druga nieobecność w przedłużeniu, zaokrąglenie po przedłużeniu (14.03.2024 → 2026-04-16) i termin ponownej oceny z `periodEndAfterNegative`
- [ ] 1.4 Ten sam termin 30.12.2026 w `effectiveDeadline`, na `/hr` i na osi po dwóch wpisach
- [ ] 1.5 Ścieżka `/hr` → „Wpisz nieobecność” → oś → drugi wpis bez `/cycles/:id/part1`, odpowiedzi 303; oceniany widzi termin i podstawę bez dat nieobecności
- [ ] 1.6 Brak rodzaju nieobecności w tabeli, formularzu i zapisie; brak liczb i etykiet przy nazwisku
- [ ] 1.7 Po widocznym `assessment_approved` oś pokazuje termin z migawki, a później wpisana nieobecność zapisuje się (303) ze zdaniem o niezmienionym terminie; cykl zamknięty 409, walidacja 422

#### Manual

- [ ] 1.8 Krok 3 pokazu na koncie Joanny i ten sam termin w wierszu Piotra na `/hr`

### Phase 2: Dane Ewy, cudze zdarzenia na osi, zmiana oceniającego

#### Automated

- [ ] 2.1 Dane pokazowe wgrywają się bez błędu: `bun run seed`
- [ ] 2.2 Zmiana oceniającego Ewy widoczna na osi Marka (§ 9 ust. 3), niewidoczna na osi Ewy; `appraiser_id` Ewy bez zmian
- [ ] 2.3 Nieobecność Ewy niewidoczna 2026-08-27, widoczna 2026-08-28 i 2026-08-29 (termin 2027-06-02)
- [ ] 2.4 Zmiana oceniającego z formularza zostawia kryteria, przenosi `appraiser_id` i dostęp (`src/routes/appraiser.test.ts`)

#### Manual

- [ ] 2.5 Oś Ewy na koncie Marka i na koncie Ewy

### Phase 3: Przypomnienia przy przesuwaniu daty

#### Automated

- [x] 3.1 Przypomnienie o terminie pojawia się 30 dni przed terminem (c60dfd9)

#### Manual

- [ ] 3.2 Przypomnienie na koncie Marka po przesunięciu daty
