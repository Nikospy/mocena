# Oś czasu, nieobecności i zmiana oceniającego — plan wdrożenia

## Overview

Plaster S-03 (US-03, FR-010, FR-011, FR-014, FR-033, FR-034). Kadry wpisują nieobecność ocenianego (tylko daty i „usprawiedliwiona”, decyzja 10m) i zmianę oceniającego. Silnik łączy nieobecności rozdzielone samymi dniami wolnymi, sprawdza próg „dłużej niż miesiąc” i przedłuża termin oceny w tej samej funkcji `effectiveDeadline(cycleId)`, z której od F-01 czyta każdy ekran. Uczestnicy cyklu widzą oś czasu, a przy każdej dacie przepis i wersję reguł. Przy przesuwaniu daty systemowej pojawia się przypomnienie o terminie oceny.

Plaster jest budowany jako ostatni i wypada pierwszy, gdy zabraknie czasu (decyzja 10h). **Jeśli budowa S-03 nie zacznie się do 05:45, plaster wypada z pokazu** (koniec budowy o 07:00, decyzja 10g; wersja minimalna z zapasem na naprawy to ok. 75 minut). Wtedy krok 3 pokazu odpada, a terminy na ekranach zostają takie, jak liczy F-01. Budżet: wersja minimalna ok. 45 minut, całość ok. 80 minut.

## Current State Analysis

Stan w chwili budowy S-03 (po F-01, S-01, S-02, S-04, S-05, S-06; decyzje 8a i 10h):

- Silnik terminów jest w `src/engine/deadlines.ts` (przeniesiony przez F-01 z `src/silnik/terminy.ts`): `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `periodEndAfterNegative` i pozostałe terminy. `nextAssessmentDeadline` liczy `toWorkingDay(addDays(addMonths(start, 24), longAbsenceDays))`: dni dodaje do surowego końca 24 miesięcy i dopiero potem przesuwa na dzień roboczy. Test `nextAssessmentDeadline("2024-03-16", 33) === "2026-04-20"` już istnieje.
- `effectiveDeadline(cycleId)` w `src/cycles.ts` istnieje od F-01 i zwraca `{ date, basis: string[] }`; dziś to `nextAssessmentDeadline(period_start, 0)`. Wszystkie ekrany (część I, ocena, kadry, wydruk) czytają termin tylko stąd.
- Nowego kodu wymaga: łączenie nieobecności przez dni wolne, próg „dłużej niż miesiąc”, wyliczenie dni przedłużenia z listy wpisów i rozróżnienie rodzaju cyklu. Dziś nikt tego nie liczy.
- Plik reguł `rules/regulation-2016-470.json` ma podstawę „art. 81 ust. 4 ustawy” dla 24 miesięcy. Nie ma progu nieobecności (art. 81 ust. 7 ustawy) ani § 9 ust. 3 rozporządzenia (zmiana oceniającego).
- Tabeli `absences`, osi czasu i formularzy kadr nie ma.

### Key Discoveries:

- Przykład organizatora (zasady liczenia terminów KPRM, sekcja „Nieobecności”, pkt 2–3): 05.10.2026 (pn)–16.10.2026 (pt) i 19.10.2026 (pn)–06.11.2026 (pt) to jedna nieobecność 05.10–06.11, dłuższa niż miesiąc, bo 17–18.10 to dni wolne. Każda z osobna jest krótsza niż miesiąc (12 i 19 dni), więc bez łączenia termin by się nie przesunął. To jest sedno kroku 3 pokazu.
- Liczba dni nieobecności to dni kalendarzowe od pierwszego do ostatniego dnia włącznie, razem z dniami wolnymi w środku: 05.10–06.11.2026 = 33 dni.
- Wyliczone obecnym silnikiem (`bun` na `src/silnik/terminy.ts`):
  - **Piotr:** okres od 27.11.2024 → termin bazowy 27.11.2026 (pt). Przedłużenie 33 dni: 27.11.2026 + 33 dni = 30.12.2026 (śr) → **nowy termin 30.12.2026**.
  - **Ewa:** okres od 20.11.2024 → termin bazowy 20.11.2026 (pt). Nieobecność 16.02.2026–28.08.2026 = 194 dni. 20.11.2026 + 194 dni = **02.06.2027** (śr).
  - **Zaokrąglenie dopiero po przedłużeniu:** okres od 14.03.2024, surowy koniec 14.03.2026 (sobota), 33 dni przedłużenia → 16.04.2026 (czw). Dodanie dni do terminu już przesuniętego na poniedziałek 16.03.2026 dałoby błędnie 20.04.2026.
- FAQ DSC (pyt. 19): nieobecność nie przedłuża 6 miesięcy do ponownej oceny po ocenie negatywnej, bo art. 81 ust. 7 odsyła tylko do terminu z ust. 4. Kotwicą ponownej oceny jest 6 miesięcy od zapoznania się z oceną negatywną (`periodEndAfterNegative`).
- Tabela „Access Control” w `prd.md`: „Nieobecności i zmiany podległości” — oceniający: wgląd w daty, oceniany: brak, kadry: edycja. FR-014 wymaga, żeby oceniany widział nowy termin i jego podstawę.

## Desired End State

Kadry (Joanna) przy dacie systemowej 10.11.2026 przechodzą z `/hr` na ekran cyklu Piotra, otwierają „Wpisz nieobecność”, zapisują pierwszy wpis, z osi czasu wracają do formularza i zapisują drugi. Oś pokazuje jedną ciągłą nieobecność 05.10.2026–06.11.2026 (33 dni), dopisek „dłużej niż miesiąc”, termin bazowy 27.11.2026 i nowy termin 30.12.2026, przy każdej dacie przepis, w stopce wersję reguł („Reguły 2016-470/1, obowiązują od 23.04.2016”). Ten sam termin 30.12.2026 pokazują ekran części I, ekran kadr i wydruk, bo czytają `effectiveDeadline`. Piotr na swojej osi widzi nowy termin i podstawę, bez dat nieobecności. Oś Ewy (konto Marka albo Joanny) pokazuje zmianę oceniającego 05.12.2024 („kryteria bez zmian, § 9 ust. 3 rozporządzenia”) i, od 28.08.2026, nieobecność 16.02–28.08.2026 z nowym terminem 02.06.2027. Gdy data systemowa wejdzie w okno przypomnienia, oceniający i oceniany widzą na ekranie startowym zdanie z terminem i przepisem. `bun test` przechodzi.

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

- **Tabele (F-01):** `people(id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade)`, role `appraiser`, `employee`, `hr`, `admin`; `cycles(id, person_id, appraiser_id, period_start, sheet)`; `cycle_criteria(cycle_id, criterion_id, kind, expectation)`; `events(id, type, cycle_id, actor_id, date, payload)`; `settings(key, value)` z `demo_date`.
- **Funkcje (F-01):** `today()`, `currentPerson(c)`, `recordEvent(type, cycleId, actorId, payload)`, `seedEvent(...)` (tylko w danych), `visibleEvents(cycleId)` (granica `date <= today()`, porządek `(date, id)`), `effectiveDeadline(cycleId)` w `src/cycles.ts`, `registerHomeTasks(fn)` w `src/home-tasks.ts`, `registerCycleLinks(fn)` w `src/cycle-links.ts`, `rulesVersion()`, `createTestApp({ today })` w `src/test-helpers.ts`.
- **Silnik (F-01):** `src/engine/deadlines.ts`: `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `periodEndAfterNegative`, `criteriaTalkDeadline`, `objectionDeadline`; odczyt reguł w `src/engine/rules.ts`.
- **Zdarzenia czytane przez oś:** `cycle_started { reason, periodStart, previousAssessmentOn, previousOutcome }` (F-01, S-01), `part1_submitted`, `part1_confirmed` (S-01), `assessment_approved`, `assessment_acknowledged { place, date, name, objectionDeadline }`, `acknowledgement_fiction` (S-02).
- **Trasy:** `GET /cycles/:id/part1` to ekran wejściowy cyklu, który pokazuje `cycleLinks` (S-01); `GET /hr` (S-06) prowadzi do cykli.
- **Dane (F-01 `src/seed/base.ts`, S-01 `src/seed/part1.ts`):** osoby, w tym poprzedni naczelnik bez konta; cykle Piotra (od 27.11.2024), Ewy (od 20.11.2024) i Tomasza ze zdarzeniami `cycle_started`; część I Ewy przekazana przez poprzedniego naczelnika 02.12.2024 i potwierdzona 03.12.2024.
- **Pliki wspólne:** `rules/office-settings.json` z `officeSettings()` (tworzy S-01, S-03 dopisuje klucz).

## Co ten plaster udostępnia

Zgodnie z kontraktem:

- Tabela `absences(id, person_id, date_from, date_to, excused, recorded_on, recorded_by)`: daty `RRRR-MM-DD` włącznie, `excused` 0/1, `recorded_on` = data zapisu (granica widoczności `recorded_on <= today()`), `recorded_by` = osoba z kadr. Bez kolumny rodzaju.
- Zdarzenia: `absence_recorded { absence_id, notified }` (`notified` = identyfikatory oceniającego i ocenianego) i `appraiser_changed { from_id, to_id }`.
- Trasy: `GET/POST /cycles/:id/absences`, `GET/POST /cycles/:id/appraiser`, `GET /cycles/:id/timeline`.
- `effectiveDeadline(cycleId)` w `src/cycles.ts`: ta sama sygnatura i kształt `{ date, basis: string[] }`, teraz z nieobecnościami.
- Moduł danych `src/seed/absences.ts`: nieobecność Ewy i zmiana jej oceniającego.
- Odnośniki przez `registerCycleLinks` i pozycje listy spraw przez `registerHomeTasks`.

Wewnętrzne (nikt poza S-03 z nich nie korzysta): `src/engine/absences.ts` (`mergeAbsences`, `isLongerThanMonth`, `assessmentDeadline`), `cycleDeadlineDetails(cycleId)` w `src/cycles.ts`, `buildTimeline` w `src/timeline.ts`, widok `src/views/timeline.tsx`, klucze w pliku reguł i `assessmentReminderDays` w `rules/office-settings.json`.

## Implementation Approach

Najpierw wersja minimalna, potem dodatki w kolejności, w jakiej się je tnie. Silnik jest czystą funkcją na datach `RRRR-MM-DD` z testami (bez bazy). Termin nigdy nie jest zapisywany: `effectiveDeadline` liczy go za każdym razem z `cycles.period_start`, rodzaju cyklu i widocznych nieobecności ocenianego, więc każdy ekran pokazuje ten sam termin bez zmian w cudzym kodzie. Szczegóły wyliczenia (połączone nieobecności, dni, termin bazowy) zwraca `cycleDeadlineDetails(cycleId)`; `effectiveDeadline` jest jego skrótem, więc nie ma drugiego źródła. Oś czasu składa wpisy z widocznych zdarzeń, widocznych nieobecności (już połączonych) i terminów wyliczonych (te widać także w przyszłości, bo to terminy, nie fakty). Widok zależy od roli: kadry i oceniający widzą daty nieobecności i zmianę oceniającego, oceniany tylko termin i podstawę. Zmiana oceniającego zapisuje zdarzenie i w tej samej transakcji ustawia `cycles.appraiser_id`; kryteria (`cycle_criteria`) nie są dotykane (§ 9 ust. 3). Ekrany używają `src/views/layout.tsx`; dopóki design system nie ma komponentu osi czasu, oś to semantyczna lista `<ol>` z `<time>`.

**Wersja minimalna (ok. 45 min) = Phase 1.** Silnik z testami, rozszerzone `effectiveDeadline`, tabela `absences`, formularz kadr, oś czasu z połączoną nieobecnością, progiem, nowym terminem, przepisem i wersją reguł, odnośniki na ekranie wejściowym cyklu. Krok 3 pokazu działa na samej fazie 1.

**Kolejność cięcia** (po wersji minimalnej; gdy brakuje czasu, wycinać od góry):
1. Phase 3: przypomnienia na ekranie startowym.
2. Phase 2, pkt 3: formularz zmiany oceniającego (zostaje wgrana zmiana u Ewy i jej wpis na osi).
3. Phase 2, pkt 2: wpisy osi z cudzych zdarzeń (część I, ocena, zapoznanie, sprzeciw, zmiana oceniającego).
4. Phase 2, pkt 1: dane Ewy w `src/seed/absences.ts` (wersja 5-minutowa pokazu traci oś Ewy).

Nie tniemy: łączenia przez dni wolne, wspólnego terminu w `effectiveDeadline`, ścieżki `/hr` → formularz → oś → drugi wpis, ograniczenia widoku ocenianego.

## Phase 1: Wersja minimalna — silnik, wspólny termin, formularz kadr i oś (ok. 45 min)

### Changes Required:

#### 1. Reguły jako dane

**File**: `rules/regulation-2016-470.json`, `src/engine/rules.ts`

**Intent**: Dopisać do sekcji terminów próg długiej nieobecności, podstawę zmiany oceniającego i sposób liczenia, żeby przepis przy dacie pochodził z pliku reguł (decyzja 7). Klucze w stylu nadanym przez F-01. Wersji pliku nie zmieniać: to uzupełnienie brakującej wartości tego samego aktu.

**Contract**:

```json
"longAbsenceOverMonths": { "value": 1, "basis": "art. 81 ust. 7 ustawy" },
"appraiserChange": { "basis": "§ 9 ust. 3", "rule": "oceny dokonuje się na podstawie wcześniej wybranych kryteriów" },
"deadlineCounting": { "basis": "art. 110–115 Kodeksu cywilnego; koniec w sobotę albo dzień wolny przechodzi na następny dzień roboczy" }
```

#### 2. Łączenie nieobecności i termin z przedłużeniem

**File**: `src/engine/absences.ts` (nowy), `src/engine/absences.test.ts` (nowy)

**Intent**: Moduł obok `deadlines.ts`, który z listy wpisów liczy ciągłe nieobecności i dni przedłużenia, a termin wylicza przez `nextAssessmentDeadline`. `deadlines.ts` zostaje bez zmian (19 testów F-01 nienaruszone).

**Contract**:

```ts
type AbsenceInput = { id?: number; from: string; to: string; excused: boolean }; // z absences.date_from / date_to
type MergedAbsence = { from: string; to: string; days: number; longerThanMonth: boolean; counted: boolean; parts: AbsenceInput[] };
type CycleKind = "regular" | "after_negative";

mergeAbsences(absences: AbsenceInput[]): MergedAbsence[]
isLongerThanMonth(from: string, to: string): boolean
assessmentDeadline(periodStart: string, kind: CycleKind, absences: AbsenceInput[]): {
  base: string;               // nextAssessmentDeadline(periodStart, 0)
  extensionDays: number;      // suma dni z liczonych nieobecności
  deadline: string;           // nextAssessmentDeadline(periodStart, extensionDays)
  movedToWorkingDay: boolean; // deadline !== addDays(addMonths(periodStart, 24), extensionDays)
  merged: MergedAbsence[];    // połączone nieobecności usprawiedliwione, do osi
}
```

Reguły (każda ma test):
- `mergeAbsences` bierze tylko `excused: true`, sortuje po `from`, rzuca błąd przy `to < from` albo złej dacie.
- Dwa sąsiednie wpisy łączą się, gdy nachodzą na siebie, stykają się (`next.from <= addDays(cur.to, 1)`) albo gdy każdy dzień ściśle między `cur.to` a `next.from` jest dniem wolnym (`isDayOff`). Połączony koniec to późniejszy z dwóch końców. Nieobecność nieusprawiedliwiona niczego nie łączy i niczego nie przedłuża (art. 81 ust. 7 mówi o usprawiedliwionej): dzień roboczy przykryty takim wpisem przerywa ciągłość.
- `days` = dni kalendarzowe od `from` do `to` włącznie.
- **Próg.** Nieobecność zajmuje przedział od `from` do `addDays(to, 1)` (bez końca). „Dłużej niż miesiąc” ⇔ `addDays(to, 1) > addMonths(from, value)`, porównanie ścisłe, `value` z `longAbsenceOverMonths`. Przykłady: od 05.10 miesiąc kończy się 05.11, więc 05.10–04.11 to dokładnie miesiąc (nie), 05.10–05.11 to dłużej (tak). Od 31.01.2026 miesiąc kończy się 28.02.2026, więc 31.01–27.02.2026 to dokładnie miesiąc (nie), 31.01–28.02.2026 to dłużej (tak).
- **Przedłużenie, kolejno.** Dla `kind = "after_negative"` przedłużenia nie ma: `extensionDays = 0`, `deadline = base` (FAQ pyt. 19), a `merged` służy tylko osi. Dla `"regular"`: `rawEnd = addMonths(periodStart, 24)`; połączone nieobecności przetwarzane po kolei według `from`. Nieobecność kończącą się przed `periodStart` pomija. Nieobecność z `from > rawEnd` (bieżący surowy koniec) pomija i kończy pętlę. Dla nieobecności dłuższej niż miesiąc (próg na całej nieobecności, także z dniami sprzed okresu) dodaje dni liczone od `max(from, periodStart)` do `to` włącznie: `rawEnd = addDays(rawEnd, dni)`, `counted = true`. Dzięki temu druga długa nieobecność, która zaczyna się w już przedłużonym okresie, też przedłuża termin.
- **Dzień roboczy raz, na końcu.** `deadline = toWorkingDay(rawEnd)`, co jest równe `nextAssessmentDeadline(periodStart, extensionDays)`; przesunięcie na dzień roboczy nigdy nie wchodzi do `rawEnd` w trakcie pętli.

#### 3. Wspólny termin cyklu: rozszerzenie `effectiveDeadline`

**File**: `src/cycles.ts`

**Intent**: Rozszerzyć istniejącą funkcję F-01, bez zmiany jej podpisu i kształtu. Nowe `cycleDeadlineDetails(cycleId)` czyta `cycles.period_start`, rodzaj cyklu z `payload` widocznego zdarzenia `cycle_started` (pola `reason` i `previousOutcome`; po ocenie negatywnej → `"after_negative"`, w pozostałych przypadkach → `"regular"`) i widoczne nieobecności ocenianego (`absences.recorded_on <= today()`), woła `assessmentDeadline` i dokłada podstawy. `effectiveDeadline(cycleId)` zwraca z niego `{ date: deadline, basis }`. Dla `"after_negative"` S-03 nie zmienia daty liczonej przez F-01 (kotwica: 6 miesięcy od zapoznania, `periodEndAfterNegative`) i nie dolicza nieobecności.

`basis` nie zawiera dat ani długości nieobecności, bo ten sam termin widzi oceniany: `["art. 81 ust. 4 ustawy"]`, przy przedłużeniu dodatkowo „art. 81 ust. 7 ustawy: termin przedłużony o czas usprawiedliwionej nieobecności dłuższej niż miesiąc”, przy `movedToWorkingDay` także „art. 115 Kodeksu cywilnego”.

**Contract**: `effectiveDeadline(cycleId): { date: string; basis: string[] }` (bez zmian); `cycleDeadlineDetails(cycleId)` = wynik `assessmentDeadline` + `{ kind, basis, rules: rulesVersion() }`. Wcześniejsze ekrany nie wymagają zmian.

#### 4. Tabela nieobecności

**File**: `src/db.ts`

**Intent**: Dopisać do schematu tabelę `absences` z kolumnami kontraktu. `visibleAbsences(personId)` zwraca wiersze z `recorded_on <= today()` (ta sama granica co `visibleEvents`).

**Contract**: `CREATE TABLE IF NOT EXISTS absences (id, person_id, date_from, date_to, excused DEFAULT 1, recorded_on, recorded_by)`; brak kolumny rodzaju.

#### 5. Formularz kadr: wpisanie nieobecności

**File**: `src/routes/absences.tsx`, `src/views/absence-form.tsx`

**Intent**: Kadry wpisują nieobecność ocenianego z cyklu. Pola: „Od”, „Do”, „Nieobecność usprawiedliwiona” (zaznaczone domyślnie). Nad polami: „System zapisuje tylko daty. Rodzaju nieobecności nie podajesz”. Pod formularzem lista wpisanych nieobecności tej osoby (same daty i „usprawiedliwiona / nieusprawiedliwiona”). Zapis dopiero po kliknięciu „Zapisz nieobecność”: wiersz w `absences` (`recorded_on = today()`, `recorded_by` = konto), zdarzenie `absence_recorded { absence_id, notified: [appraiser_id, person_id] }` przez `recordEvent`, przekierowanie na oś czasu z komunikatem „Zapisano. Nowy termin oceny widzą: Marek Zieliński (oceniający), Piotr Wójcik (oceniany)”. Tylko rola `hr`; inni 403.

**Contract**: `GET /cycles/:id/absences`; `POST /cycles/:id/absences` (pola `from`, `to`, `excused`) → 302 na `/cycles/:id/timeline`; brak daty, zła data albo „Do” przed „Od” → 400 z tym samym formularzem, komunikatem przy polu („Data końca nie może być wcześniejsza niż data początku”) i bez zapisu.

#### 6. Oś czasu cyklu

**File**: `src/routes/timeline.tsx`, `src/views/timeline.tsx`, `src/timeline.ts`

**Intent**: Ekran dla ocenianego (`cycles.person_id`), obecnego oceniającego (`cycles.appraiser_id`) i kadr; inni 403. `buildTimeline(cycleId, viewer)` składa wpisy z `cycleDeadlineDetails`, widok rysuje je w kolejności dat. Każdy wpis: data `DD.MM.RRRR`, tytuł, opcjonalne wyjaśnienie, przepis.

Widok kadr i oceniającego:
- początek okresu oceny (art. 81 ust. 4 ustawy);
- każda połączona nieobecność usprawiedliwiona: „Nieobecność 05.10.2026–06.11.2026 (33 dni)”, a gdy powstała z kilku wpisów, „Dwa wpisy liczą się jako jedna nieobecność, bo dzielą je tylko dni wolne” (art. 81 ust. 7 ustawy; zasady liczenia terminów KPRM); przy progu „dłużej niż miesiąc: termin oceny przedłuża się o 33 dni” albo „nie dłużej niż miesiąc: termin bez zmian”; w cyklu po ocenie negatywnej „nie przedłuża terminu ponownej oceny”;
- nieobecność nieusprawiedliwiona: same daty i „nie przedłuża terminu (art. 81 ust. 7 dotyczy nieobecności usprawiedliwionej)”;
- termin bazowy, a przy przedłużeniu przekreślony obok nowego terminu, z podstawami z `basis`;
- dla kadr pod listą odnośnik „Wpisz kolejną nieobecność” (`/cycles/:id/absences`): to drugi wpis w kroku 3.

Widok ocenianego: początek okresu, termin (przy przedłużeniu: termin bazowy przekreślony i nowy) z `basis`. Bez dat i długości nieobecności i bez wpisu o zmianie oceniającego (tabela dostępu PRD).

Stopka dla wszystkich: „Reguły: 2016-470/1, obowiązują od 23.04.2016” z `rulesVersion()`. Przy nazwisku ocenianego w nagłówku nie ma etykiety ani liczby.

**Contract**: `GET /cycles/:id/timeline` → 200 dla uczestnika i kadr, 403 dla innych; `buildTimeline(cycleId, viewer): TimelineEntry[]`, `TimelineEntry = { date, title, detail?, basis, kind: "fact" | "deadline" }`. Fakty tylko z widocznych zdarzeń i nieobecności, terminy zawsze.

#### 7. Odnośniki na ekranie wejściowym cyklu

**File**: `src/timeline.ts` (rejestracja przy starcie)

**Intent**: Przez `registerCycleLinks(fn)` dodać na `GET /cycles/:id/part1`: „Oś czasu” (oceniany, oceniający, kadry), „Wpisz nieobecność” i „Zmień oceniającego” (kadry; drugi odnośnik dopiero, gdy istnieje faza 2 pkt 3). Ścieżka kroku 3: `/hr` → ekran cyklu → „Wpisz nieobecność” → oś → „Wpisz kolejną nieobecność” → oś. Te odnośniki zostają w każdej wersji.

**Contract**: `cycleLinks(cycle, joanna)` zawiera `/cycles/:id/timeline` i `/cycles/:id/absences`; `cycleLinks(cycle, piotr)` zawiera tylko `/cycles/:id/timeline`.

### Success Criteria:

#### Automated Verification:

- Testy silnika przechodzą: `bun test src/engine`
- Przykład organizatora: dwa wpisy 05.10–16.10.2026 i 19.10–06.11.2026 dają jedną nieobecność 05.10–06.11, 33 dni, `longerThanMonth: true`; okres od 27.11.2024 daje termin bazowy `2026-11-27` i nowy `2026-12-30`
- Próg i kolejność: 31.01–27.02.2026 nie, 31.01–28.02.2026 tak; druga długa nieobecność w przedłużeniu przedłuża; okres od 14.03.2024 i 33 dni dają `2026-04-16`
- Po dwóch wpisach kadr ten sam termin 30.12.2026 zwracają `effectiveDeadline`, ekran części I, ekran kadr i oś czasu; oś zawiera „05.10.2026–06.11.2026”, „dłużej niż miesiąc”, „art. 81 ust. 7” i wersję reguł
- Oceniany widzi na osi 30.12.2026 i podstawę, bez „05.10.2026” i bez „33 dni”; odnośniki ze ścieżki `/hr` → formularz → oś → drugi wpis istnieją: `bun test`

#### Manual Verification:

- Krok 3 pokazu na koncie Joanny (data 10.11.2026): z `/hr` do formularza, dwa wpisy, oś z jedną nieobecnością i nowym terminem; ten sam termin na ekranie części I i kadr

## Phase 2: Dane Ewy, cudze zdarzenia na osi, zmiana oceniającego (ok. 20 min)

### Changes Required:

#### 1. Dane pokazowe

**File**: `src/seed/absences.ts` (wołany przez `src/seed.ts`)

**Intent**: Dane osi Ewy. Nieobecności Piotra nie są wgrywane: Joanna wpisuje je na żywo w kroku 3.
- Zmiana oceniającego: `seedEvent("appraiser_changed", ewaCycle, joanna, { from_id: poprzedni naczelnik, to_id: Marek })` z datą 2024-12-05 (przejęcie wydziału, `demo.md`) i `cycles.appraiser_id` Ewy = Marek. Data jest po potwierdzeniu części I Ewy (03.12.2024) i przed pierwszym dniem pokazu (09.12.2024).
- Nieobecność: wiersz `absences` 2026-02-16–2026-08-28, `excused = 1`, `recorded_on = 2026-08-28`, `recorded_by` = Joanna, oraz `absence_recorded` z datą 2026-08-28. Wpis jest retrospektywny i odsłania się w dniu końca nieobecności, nie wcześniej (decyzja 10i).

**Contract**: po `bun run seed`: przy dacie 2026-08-27 oś Ewy nie ma nieobecności, a termin to 20.11.2026; przy 2026-08-28 i 2026-08-29 jest nieobecność i termin 02.06.2027. Przy dacie 2024-12-09 oś Ewy (konto Marka) pokazuje zmianę oceniającego.

#### 2. Wpisy osi z cudzych zdarzeń

**File**: `src/timeline.ts`

**Intent**: Jedna tablica „typ zdarzenia → tytuł i przepis”, czytana z `visibleEvents(cycleId)`; nieznane typy są pomijane: `part1_submitted` (termin rozmowy o kryteriach, § 7), `part1_confirmed`, `appraiser_changed` („Zmiana oceniającego: <from> → <to>. Kryteria bez zmian”, § 9 ust. 3 rozporządzenia; tylko kadry i oceniający), `assessment_approved`, `assessment_acknowledged` i `acknowledgement_fiction` z terminem sprzeciwu z `payload.objectionDeadline` (art. 83 ust. 1).

**Contract**: oś Ewy na koncie Marka ma wpis z „§ 9 ust. 3”; na koncie Ewy go nie ma.

#### 3. Formularz kadr: zmiana oceniającego

**File**: `src/routes/appraiser.tsx`, `src/views/appraiser-change-form.tsx`

**Intent**: Kadry wybierają nowego oceniającego spośród osób z rolą `appraiser` (bez obecnego) i klikają „Zapisz zmianę oceniającego”. Przed przyciskiem: „Kryteria zostają bez zmian. Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów (§ 9 ust. 3 rozporządzenia)” i lista kryteriów cyklu. W jednej transakcji: `recordEvent("appraiser_changed", cycleId, actor, { from_id, to_id })` i `UPDATE cycles SET appraiser_id`. `cycle_criteria` nietknięte. Tylko `hr`; inni 403.

**Uwaga dla S-04:** autoryzacja notatki w cyklu idzie za `cycles.appraiser_id`, a nie za `people.supervisor_id` (ten tylko dla osoby bez cyklu, jak Maria); odczyt notatki zostaje ograniczony do autora, więc dawny oceniający nadal czyta swoje notatki, a nowy ich nie widzi.

**Contract**: `GET /cycles/:id/appraiser`; `POST /cycles/:id/appraiser` (pole `appraiser_id`) → 302 na `/cycles/:id/timeline`; ten sam oceniający albo osoba spoza listy → 400 bez zapisu.

### Success Criteria:

#### Automated Verification:

- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Nieobecność Ewy: dzień przed końcem (2026-08-27) niewidoczna, w dniu końca (2026-08-28) i dzień po (2026-08-29) widoczna z terminem `2027-06-02`
- Po zmianie oceniającego `cycle_criteria` ma te same wiersze, `cycles.appraiser_id` wskazuje nowego, nowy oceniający ma dostęp do osi, poprzedni nie; oceniany nie widzi wpisu o zmianie: `bun test`

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

**Intent**: Pozycje listy spraw liczone z `effectiveDeadline` przy bieżącej dacie systemowej (nic nie jest zapisywane), dla oceniającego i ocenianego cyklu:
- gdy `today()` jest w oknie `[date − assessmentReminderDays, date]`: „Termin oceny Piotra Wójcika: 30.12.2026 (art. 81 ust. 4 i 7 ustawy). Przypomnienie na 30 dni przed terminem: ustawienie urzędu”, z odnośnikiem do osi;
- gdy termin jest przedłużony: „Termin oceny przesunięty z 27.11.2026 na 30.12.2026 z powodu nieobecności dłuższej niż miesiąc (art. 81 ust. 7 ustawy)”. Zdanie mówi o terminie, nie o pracowniku; bez dat i długości nieobecności.
Dla kadr nic (mają `/hr`).

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
- cykl `after_negative`: długa nieobecność nie zmienia terminu, `extensionDays: 0`;
- nieobecność zaczęta przed początkiem okresu liczy dni od początku okresu; „Do” przed „Od” rzuca błąd.

`src/routes/absences.test.ts`, `src/routes/timeline.test.ts` przez `app.request()` na `createTestApp({ today })`:
- kadry przy 2026-11-10: `POST /cycles/:id/absences` dwa razy → 302; potem `effectiveDeadline(piotr).date`, `GET /cycles/:id/part1`, `GET /hr` i oś czasu pokazują ten sam termin 30.12.2026;
- oceniający i oceniany: `POST /cycles/:id/absences` → 403, nic nie zapisane; zły zakres dat → 400, nic nie zapisane;
- oś: oceniany, oceniający i kadry → 200; osoba spoza cyklu (Tomasz) → 403; oceniany nie widzi dat nieobecności ani zmiany oceniającego, oceniający i kadry widzą;
- `cycleLinks` dla kadr zawiera formularz i oś; oś dla kadr zawiera „Wpisz kolejną nieobecność”;
- widoczność (10i): nieobecność Ewy przy 2026-08-27, 2026-08-28, 2026-08-29;
- zmiana oceniającego: `cycle_criteria` bez zmian, `appraiser_id` nowy, dostęp do osi przechodzi na nowego;
- przypomnienia: okno 30 dni przed terminem Piotra (bez i z przedłużeniem).

Ręcznie: krok 3 pokazu i oś Ewy z wersji 5-minutowej, na komputerze i telefonie (360 px).

## Open Questions

Żadne nie blokuje budowy; implementator przyjmuje rekomendację.

1. **Nieobecność wykraczająca poza okres oceny.** Rekomendacja: dni sprzed początku okresu się nie liczą, próg sprawdza się na całej nieobecności, nieobecność zaczęta po bieżącym surowym końcu nie przedłuża.
2. **Wartości `cycle_started.payload.reason`.** Kontrakt nie wylicza wartości. Rekomendacja: rodzaj `"after_negative"`, gdy `previousOutcome` oznacza ocenę negatywną; pozostałe cykle `"regular"`. Wartości odczytać z kodu F-01 i S-01.
3. **Wersja reguł przy dacie historycznej.** Jeśli cykl zapisuje własną wersję reguł (FR-033, `part1_submitted.payload.rulesVersion`), oś pokazuje ją; jeśli nie, `rulesVersion()`. W prototypie to ta sama wartość.

## References

- `context/changes/rules-engine-and-demo-data/plan.md`, rozdział „Kontrakt wspólny dla wszystkich plastrów” (źródło nazw)
- `context/foundation/decisions.md` (decyzje 3, 4, 7, 10b, 10g, 10h, 10i, 10m)
- `context/foundation/prd.md` (US-03, FR-010, FR-011, FR-014, FR-033, FR-034, Business Logic, Access Control)
- `context/foundation/roadmap.md` (S-03)
- `context/foundation/demo.md` (krok 3, „Ustalenia do scenariusza”: przejęcie wydziału 5.12.2024, data kroku 3 10.11.2026)
- `src/silnik/terminy.ts` i `src/silnik/ocena.test.ts` (po F-01: `src/engine/deadlines.ts`)
- Ustawa o służbie cywilnej: art. 81 ust. 4, 7 i 9, art. 83 ust. 1; rozporządzenie Dz.U. 2016 poz. 470: § 7, § 9 ust. 3; Kodeks cywilny art. 110–115; zasady liczenia terminów KPRM (sekcja „Nieobecności”, pkt 2–3); FAQ DSC pyt. 19

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Wersja minimalna — silnik, wspólny termin, formularz kadr i oś

#### Automated

- [ ] 1.1 Testy silnika przechodzą: `bun test src/engine`
- [ ] 1.2 Przykład organizatora daje nieobecność 05.10–06.11.2026 (33 dni) i termin 2026-12-30
- [ ] 1.3 Próg na końcu miesiąca, druga nieobecność w przedłużeniu i zaokrąglenie po przedłużeniu (14.03.2024 → 2026-04-16)
- [ ] 1.4 Ten sam termin 30.12.2026 w `effectiveDeadline`, części I, kadrach i na osi po dwóch wpisach
- [ ] 1.5 Oceniany widzi termin i podstawę bez dat nieobecności; ścieżka `/hr` → formularz → oś → drugi wpis

#### Manual

- [ ] 1.6 Krok 3 pokazu na koncie Joanny i ten sam termin na ekranie części I i kadr

### Phase 2: Dane Ewy, cudze zdarzenia na osi, zmiana oceniającego

#### Automated

- [ ] 2.1 Dane pokazowe wgrywają się bez błędu: `bun run seed`
- [ ] 2.2 Nieobecność Ewy niewidoczna 2026-08-27, widoczna 2026-08-28 i 2026-08-29 (termin 2027-06-02)
- [ ] 2.3 Zmiana oceniającego zostawia kryteria, przenosi `appraiser_id` i dostęp; oceniany nie widzi wpisu

#### Manual

- [ ] 2.4 Oś Ewy na koncie Marka i na koncie Ewy

### Phase 3: Przypomnienia przy przesuwaniu daty

#### Automated

- [ ] 3.1 Przypomnienie o terminie pojawia się 30 dni przed terminem

#### Manual

- [ ] 3.2 Przypomnienie na koncie Marka po przesunięciu daty
