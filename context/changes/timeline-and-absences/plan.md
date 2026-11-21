# Oś czasu, nieobecności i zmiana oceniającego — plan wdrożenia

## Overview

Plaster S-03 (US-03, FR-010, FR-011, FR-014, FR-033, FR-034). Kadry wpisują nieobecność ocenianego (tylko daty i „usprawiedliwiona”, decyzja 10m) i zmianę oceniającego. Silnik łączy nieobecności rozdzielone samymi dniami wolnymi, sprawdza próg „dłużej niż miesiąc” i przedłuża termin oceny. Każdy uczestnik cyklu widzi oś czasu, a przy każdej dacie przepis i wersję reguł. Przy przesuwaniu daty systemowej pojawia się przypomnienie o terminie oceny. Plaster jest budowany jako ostatni i wypada pierwszy, gdy zabraknie czasu (decyzja 10h), dlatego ma jasną wersję minimalną (niżej: „Kolejność cięcia”). Budżet: ok. 80 minut pracy jednego agenta.

## Current State Analysis

Stan w chwili budowy S-03 (po F-01, S-01, S-02, S-04, S-05, S-06; decyzje 8a i 10h):

- Silnik terminów jest w `src/engine/deadlines.ts` (przeniesiony przez F-01 z `src/silnik/terminy.ts`). Ma: dodawanie dni (art. 111 § 2 KC) i miesięcy (art. 112 KC), święta z Wielkanocą, test dnia wolnego (sobota, niedziela, święto), przesunięcie na dzień roboczy (art. 115 KC) i termin kolejnej oceny, który przyjmuje gotową liczbę dni długiej nieobecności (`terminKolejnejOceny(previous, daysOfLongAbsence)` przed tłumaczeniem). Test `terminKolejnejOceny("2024-03-16", 33) === "2026-04-20"` już istnieje.
- Nowego kodu wymaga: łączenie nieobecności przez dni wolne, próg „dłużej niż miesiąc” i wyliczenie liczby dni przedłużenia z listy wpisów. Dziś nikt tego nie liczy: funkcja terminu dostaje liczbę dni z zewnątrz.
- Plik reguł `rules/regulation-2016-470.json` ma w sekcji terminów podstawę „art. 81 ust. 4 ustawy” dla 24 miesięcy. Nie ma progu nieobecności (art. 81 ust. 7 ustawy) ani § 9 ust. 3 rozporządzenia (zmiana oceniającego); wiki projektu odnotowuje brak § 9 w JSON.
- Tabeli nieobecności, osi czasu, formularzy kadr ani przypomnień o terminie oceny nie ma.

### Key Discoveries:

- Przykład organizatora (zasady liczenia terminów KPRM, sekcja „Nieobecności”, pkt 2–3): 05.10.2026 (pn)–16.10.2026 (pt) i 19.10.2026 (pn)–06.11.2026 (pt) to jedna nieobecność od 05.10 do 06.11, dłuższa niż miesiąc, bo 17–18.10 to dni wolne. Każda z osobna jest krótsza niż miesiąc (12 i 19 dni), więc bez łączenia termin by się nie przesunął. To jest sedno kroku 3 pokazu.
- Liczba dni nieobecności to dni kalendarzowe od pierwszego do ostatniego dnia włącznie, razem z dniami wolnymi w środku: 05.10–06.11.2026 = 33 dni.
- Wyliczone ręcznie i sprawdzone obecnym silnikiem (`bun` na `src/silnik/terminy.ts`):
  - **Piotr:** poprzednia ocena 27.11.2024 (śr) → termin bazowy 27.11.2026 (pt, dzień roboczy). Przedłużenie 33 dni: 27.11.2026 + 33 dni = 30.12.2026 (śr, dzień roboczy) → **nowy termin 30.12.2026**.
  - **Ewa:** poprzednia ocena 20.11.2024 → termin bazowy 20.11.2026 (pt). Nieobecność 16.02.2026 (pn)–28.08.2026 (pt) = 13 + 31 + 30 + 31 + 30 + 31 + 28 = 194 dni. 20.11.2026 + 194 dni = 02.06.2027 (śr) → **nowy termin 02.06.2027**.
- Nowy termin liczy się od surowego końca 24 miesięcy, a nie od terminu bazowego już przesuniętego na dzień roboczy: `toWorkingDay(addDays(addMonths(start, 24), days))`. Tak działa istniejąca funkcja i tak ma zostać.
- FAQ DSC (pyt. 19): nieobecność nie przedłuża 6 miesięcy do ponownej oceny po ocenie negatywnej, bo art. 81 ust. 7 odsyła tylko do terminu z ust. 4. Ten plaster przedłuża wyłącznie termin 24-miesięczny.

## Desired End State

Kadry (Joanna) na komputerze otwierają cykl Piotra, wpisują dwie nieobecności i po zapisie lądują na osi czasu. Oś pokazuje jedną ciągłą nieobecność 05.10.2026–06.11.2026 (33 dni), dopisek „dłużej niż miesiąc”, termin bazowy 27.11.2026 i nowy termin 30.12.2026, a przy każdej z tych dat przepis i wersję reguł („Reguły 2016-470/1, obowiązują od 23.04.2016”). Oś Ewy pokazuje zmianę oceniającego („kryteria bez zmian, § 9 ust. 3 rozporządzenia”) i nieobecność 16.02–28.08.2026 z nowym terminem 02.06.2027. Gdy data systemowa wejdzie w okno przypomnienia, oceniający i oceniany widzą na ekranie startowym zdanie z terminem i przepisem. `bun test` przechodzi.

## What We're NOT Doing

- Rodzaju nieobecności, w żadnym miejscu i dla nikogo (decyzja 10m). Formularz ma tylko „od”, „do” i „usprawiedliwiona”.
- Analizy nieobecności: żadnych sum, liczników, serii ani zestawień nieobecności, żadnych etykiet ani liczb przy nazwisku (decyzja 3, zasada 7 w `AGENTS.md`). Liczba dni stoi tylko przy terminie, jako składnik jego wyliczenia.
- Edycji i usuwania wpisanej nieobecności (decyzja 4: „usunięcie danych” i „edycja danych pracownika” są poza prototypem). Pomyłkę poprawia się w danych pokazowych.
- Zmiany terminu przez oceniającego, wniosku ocenianego o zmianę terminu (art. 81 ust. 8; FR-012, FR-013): tylko stan na ekranie kadr w S-06.
- Przedłużania terminu ponownej oceny po ocenie negatywnej (FAQ pyt. 19).
- Nieobecności oceniającego, zastępstw, przekazywania notatek starego oceniającego nowemu (notatki widzi tylko autor, własność S-04).
- Wstecznego datowania wpisów: każdy zapis z ekranu dostaje datę systemową (`today()`).
- Wyglądu: tokeny i komponenty pochodzą z design systemu autora (decyzja 10b). Plan wskazuje tylko ekrany i nowe komponenty.

## Założenia wobec wcześniejszych plastrów

Implementator zaczyna od sprawdzenia tych nazw w kodzie (`grep` w `src/`). Gdy nazwa jest inna, używa istniejącej i nie zmienia cudzego kodu poza miejscami wskazanymi w tym planie.

- **F-01, tabele:** `people` (`id`, imię i nazwisko, rola: oceniający, oceniany, kadry, administrator), `cycles` (`id`, `person_id` = oceniany, `appraiser_id` = obecny oceniający, początek okresu = data poprzedniej oceny albo zatrudnienia, np. `period_start`), `cycle_criteria` (`cycle_id`, identyfikator kryterium), `events` (`id`, `type`, `cycle_id`, `actor_id`, `date`, `payload` JSON), `settings` (data systemowa).
- **F-01, funkcje:** `today()`; `rulesVersion(): { version, effectiveFrom, act }`; w `src/engine/deadlines.ts` angielskie odpowiedniki `dodajDni`, `dodajMiesiace`, `dzienWolny`, `naDzienRoboczy`, `terminKolejnejOceny` (np. `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`); odczyt pliku reguł przez `src/engine/rules.ts`.
- **F-01, ekran i trasy:** `src/views/layout.tsx` (wspólny układ), konto z ciasteczka (identyfikator osoby), `GET /` z listą spraw zależną od roli, `POST /demo/date` (tylko do przodu), `src/seed.ts` uruchamiany przez `bun run seed`. Schemat tabel tworzony przy starcie w `src/db.ts`.
- **F-01 albo S-01, dane:** osoba „poprzedni naczelnik” (bez konta) i cykl Ewy z okresem od 20.11.2024, kryteriami (arkusz C, w tym „Orientacja na klienta/interesanta”, bo przy nim jest notatka z 12.12.2024) i potwierdzoną częścią I. Jeśli cyklu Ewy nie ma w seedzie, S-03 dopisuje go w fazie 3.
- **S-01:** ekran cyklu `GET /cycles/:id` (tu S-03 dodaje odnośnik „Oś czasu”); zdarzenia rozpoczęcia cyklu i potwierdzenia części I w `events` (nazwy typów do odczytania z kodu, np. `cycle_started`, `part1_confirmed`); miejsce, w którym wyświetla termin oceny (S-03 podmienia je w fazie 2 na termin z przedłużeniem).
- **S-02:** zdarzenia zatwierdzenia oceny, zapoznania, fikcji zapoznania w `events` (np. `assessment_approved`, `assessment_acknowledged`, `acknowledgement_fiction`) i funkcja terminu sprzeciwu. Oś czasu tylko je czyta.
- **S-06:** ekran kadr z listą cykli (tu S-03 dodaje odnośniki „Wpisz nieobecność”, „Zmień oceniającego”, „Oś czasu”) i miejsce, w którym pokazuje termin oceny (podmiana jak przy S-01).
- **Wszyscy:** odczyty pokazują tylko wiersze z datą nie późniejszą niż `today()` (decyzja 10i); trasy cyklu pod `/cycles/:id/...`; testy tras przez `app.request()`.

## Co ten plaster udostępnia

- Tabela `absences`: `id`, `person_id`, `date_from`, `date_to` (oba `RRRR-MM-DD`, włącznie), `excused` (0/1), `recorded_on` (data systemowa zapisu; odczyty filtrują `recorded_on <= today()`), `recorded_by` (osoba z kadr). Bez kolumny rodzaju.
- Typy zdarzeń w `events`: `absence_recorded` (payload: `absence_id`, `notified`: identyfikatory oceniającego i ocenianego) i `appraiser_changed` (payload: `from_id`, `to_id`).
- Silnik `src/engine/absences.ts`: `mergeAbsences`, `isLongerThanMonth`, `assessmentDeadline` (kontrakt w fazie 1).
- `src/cycle-deadline.ts`: `effectiveDeadline(cycleId)`: jedno miejsce, z którego każdy ekran bierze termin oceny z przedłużeniem, przepisem i wersją reguł.
- Trasy: `GET|POST /cycles/:id/absences`, `GET|POST /cycles/:id/appraiser`, `GET /cycles/:id/timeline`.
- Komponent `Timeline` (`src/views/timeline.tsx`) i funkcja `remindersFor(personId)` (`src/reminders.ts`) dla ekranu startowego.
- W pliku reguł: próg nieobecności i podstawa zmiany oceniającego; w `rules/office-settings.json`: liczba dni przypomnienia przed terminem.

## Implementation Approach

Cztery fazy, od tego, co niesie krok 3 pokazu. Silnik jest czystą funkcją na datach w formacie `RRRR-MM-DD` z testami na przykładach (bez bazy). Nieobecność to wiersz w `absences` z datą zapisu, więc dane wgrane z przyszłości odsłaniają się przy przesuwaniu daty jak zdarzenia (decyzja 10i). Termin oceny nigdy nie jest zapisywany: liczy go za każdym razem `effectiveDeadline` z początku okresu i widocznych nieobecności, dzięki czemu cofnięta data nie zostawia śladów, a każdy ekran pokazuje ten sam termin. Oś czasu składa wpisy z trzech źródeł: widoczne zdarzenia z `events`, widoczne nieobecności (już połączone) i terminy wyliczone (te pokazuje się także w przyszłości, bo to terminy, nie fakty). Każdy wpis ma przepis i wersję reguł. Zmiana oceniającego zapisuje zdarzenie i w tej samej transakcji ustawia `cycles.appraiser_id`: zapis z ekranu ma datę `today()`, a data idzie tylko do przodu, więc nie łamie to decyzji 10i, a uprawnienia w S-01, S-02 i S-04 działają bez zmian. Kryteria (`cycle_criteria`) nie są dotykane (§ 9 ust. 3). Ekrany używają wspólnego układu z `src/views/layout.tsx`; dopóki design system nie ma komponentu osi czasu, `Timeline` to semantyczna lista `<ol>` z `<time>`.

**Kolejność cięcia** (gdy brakuje czasu, wycinać od góry; krok 3 pokazu działa, dopóki stoją fazy 1 i 2):
1. Faza 4: przypomnienia na ekranie startowym.
2. Faza 3, pkt 2: formularz zmiany oceniającego (zostaje wgrana zmiana u Ewy i jej wpis na osi).
3. Faza 3, pkt 1: dane Ewy (wersja 5-minutowa pokazu traci oś Ewy).
4. Faza 2, pkt 5: podmiana terminu na ekranach S-01 i S-06 oraz wpisy osi z cudzych zdarzeń (zostają: początek okresu, nieobecność, próg, termin bazowy i nowy).

**Wersja minimalna:** faza 1 (silnik z testem przykładu organizatora) + faza 2, pkt 1–4 (tabela, formularz kadr, oś czasu z nieobecnością, progiem, nowym terminem, przepisem i wersją reguł).

## Phase 1: Silnik — łączenie nieobecności i nowy termin (ok. 20 min)

### Changes Required:

#### 1. Reguły jako dane

**File**: `rules/regulation-2016-470.json`, `src/engine/rules.ts`

**Intent**: Dopisać do sekcji terminów próg długiej nieobecności i podstawę zmiany oceniającego, żeby przepis przy dacie pochodził z pliku reguł (decyzja 7, NFR „zmiana reguł bez zmiany programu”). Klucze w stylu nadanym przez F-01. Wersji pliku nie zmieniać: to ten sam akt i ta sama data obowiązywania, uzupełnienie brakującej wartości.

**Contract**:

```json
"longAbsenceOverMonths": { "value": 1, "basis": "art. 81 ust. 7 ustawy" },
"appraiserChange": { "basis": "§ 9 ust. 3", "rule": "oceny dokonuje się na podstawie wcześniej wybranych kryteriów" },
"deadlineCounting": { "basis": "art. 110–115 Kodeksu cywilnego; koniec w sobotę albo dzień wolny przechodzi na następny dzień roboczy" }
```

#### 2. Łączenie nieobecności i termin z przedłużeniem

**File**: `src/engine/absences.ts` (nowy), `src/engine/absences.test.ts` (nowy)

**Intent**: Nowy moduł obok `deadlines.ts`, który z listy wpisów liczy ciągłe nieobecności i liczbę dni przedłużenia, a potem woła istniejącą funkcję terminu. `deadlines.ts` zostaje bez zmian (19 testów F-01 nienaruszone).

**Contract**:

```ts
type AbsenceInput = { id?: number; from: string; to: string; excused: boolean };
type MergedAbsence = { from: string; to: string; days: number; longerThanMonth: boolean; parts: AbsenceInput[] };

mergeAbsences(absences: AbsenceInput[]): MergedAbsence[]
isLongerThanMonth(from: string, to: string): boolean
assessmentDeadline(periodStart: string, absences: AbsenceInput[]): {
  base: string;            // nextAssessmentDeadline(periodStart, 0)
  extensionDays: number;   // suma dni z nieobecności dłuższych niż miesiąc
  deadline: string;        // nextAssessmentDeadline(periodStart, extensionDays)
  movedToWorkingDay: boolean; // deadline !== addDays(addMonths(periodStart, 24), extensionDays)
  merged: MergedAbsence[]; // wszystkie połączone nieobecności usprawiedliwione, do pokazania na osi
}
```

Reguły (każda ma test):
- `mergeAbsences` bierze tylko `excused: true`, sortuje po `from`, odrzuca wpis z `to < from` (rzuca błąd jak `naDate` przy złej dacie).
- Dwa sąsiednie wpisy łączą się, gdy nachodzą na siebie, stykają się (`next.from <= addDays(cur.to, 1)`) albo gdy każdy dzień ściśle między `cur.to` a `next.from` jest dniem wolnym (`isDayOff`: sobota, niedziela, święto). Połączony koniec to późniejszy z dwóch końców. Nieobecność nieusprawiedliwiona niczego nie łączy i niczego nie przedłuża (art. 81 ust. 7 mówi o usprawiedliwionej); jest tylko pokazana na osi.
- `days` = dni kalendarzowe od `from` do `to` włącznie, z dniami wolnymi w środku.
- `isLongerThanMonth(from, to)` ⇔ `to >= addMonths(from, value)`, gdzie `value` z `longAbsenceOverMonths` (domyślnie 1). Miesiąc nieobecności zaczętej 05.10 to dni 05.10–04.11 (art. 112 KC, „miesiąc liczony od pierwszego dnia”), więc 05.10–04.11 to nie „dłużej”, a 05.10–05.11 już tak. Patrz „Open Questions”, pkt 1.
- `assessmentDeadline`: połączone nieobecności kończące się przed `periodStart` pomija; zaczynające się wcześniej liczy od `periodStart` (próg sprawdza na całej nieobecności, dni liczy od `periodStart`); zaczynające się po terminie bazowym pomija. Przedłużenie liczy jednorazowo (bez pętli „nowy termin wciąga kolejną nieobecność”).

### Success Criteria:

#### Automated Verification:

- Testy silnika przechodzą: `bun test src/engine`
- Przykład organizatora: dwa wpisy 05.10–16.10.2026 i 19.10–06.11.2026 dają jedną nieobecność 05.10–06.11, 33 dni, `longerThanMonth: true`; okres od 27.11.2024 daje termin bazowy `2026-11-27` i nowy `2026-12-30`
- Ewa: okres od 20.11.2024 i nieobecność 16.02–28.08.2026 dają 194 dni i termin `2027-06-02`

## Phase 2: Nieobecności i oś czasu (ok. 30 min)

### Changes Required:

#### 1. Tabela nieobecności

**File**: `src/db.ts`

**Intent**: Dopisać do schematu tabelę `absences` (kolumny z „Co ten plaster udostępnia”), w tym samym stylu co tabele wcześniejszych plastrów. Funkcja `visibleAbsences(personId)` zwraca wiersze z `recorded_on <= today()`.

**Contract**: `CREATE TABLE IF NOT EXISTS absences (...)`; brak kolumny rodzaju; `excused` domyślnie 1.

#### 2. Wspólny termin cyklu

**File**: `src/cycle-deadline.ts` (nowy)

**Intent**: Jedna funkcja, która dla cyklu czyta początek okresu i widoczne nieobecności ocenianego i zwraca wynik `assessmentDeadline` uzupełniony o przepisy i wersję reguł. Z niej korzystają oś czasu, przypomnienia i (pkt 5) ekrany S-01 i S-06.

**Contract**: `effectiveDeadline(cycleId): { base, deadline, extensionDays, movedToWorkingDay, merged, basis: string[], rules: { version, effectiveFrom } }`.

#### 3. Formularz kadr: wpisanie nieobecności

**File**: `src/routes/absences.tsx`, `src/views/absence-form.tsx`

**Intent**: Kadry wpisują nieobecność ocenianego z cyklu. Pola: „Od”, „Do” (pole daty), „Nieobecność usprawiedliwiona” (zaznaczone domyślnie). Nad polami zdanie: „System zapisuje tylko daty. Rodzaju nieobecności nie podajesz”. Pod formularzem lista już wpisanych nieobecności tej osoby (same daty i „usprawiedliwiona / nieusprawiedliwiona”). Zapis dopiero po kliknięciu „Zapisz nieobecność”. Po zapisie: wiersz w `absences` z `recorded_on = today()` i `recorded_by` = konto, zdarzenie `absence_recorded` z `notified` = [oceniający, oceniany], przekierowanie na oś czasu z komunikatem „Zapisano. Nowy termin oceny widzą: Marek Zieliński (oceniający), Piotr Wójcik (oceniany)”. Tylko rola kadr; inne konta dostają 403.

**Contract**: `GET /cycles/:id/absences`; `POST /cycles/:id/absences` (pola `from`, `to`, `excused`) → 302 na `/cycles/:id/timeline`; błędy (brak daty, zła data, „Do” przed „Od”) → 400 z tym samym formularzem, komunikatem po polsku przy polu („Data końca nie może być wcześniejsza niż data początku”) i bez zapisu.

#### 4. Oś czasu cyklu

**File**: `src/routes/timeline.tsx`, `src/views/timeline.tsx`, `src/timeline.ts`

**Intent**: Ekran dla każdego uczestnika cyklu: ocenianego, obecnego oceniającego i kadr (inni: 403). `src/timeline.ts` składa wpisy, `Timeline` je rysuje w kolejności dat. Każdy wpis: data (format `DD.MM.RRRR`), tytuł, opcjonalne zdanie wyjaśnienia, przepis i wersja reguł. Wpisy w wersji minimalnej:
- początek okresu oceny (art. 81 ust. 4 ustawy);
- każda połączona nieobecność usprawiedliwiona: „Nieobecność 05.10.2026–06.11.2026 (33 dni)”, a gdy powstała z kilku wpisów, zdanie „Dwa wpisy liczą się jako jedna nieobecność, bo dzielą je tylko dni wolne” (art. 81 ust. 7 ustawy; zasady liczenia terminów KPRM); przy progu dopisek „dłużej niż miesiąc: termin oceny przedłuża się o 33 dni” albo „nie dłużej niż miesiąc: termin bez zmian”;
- nieobecność nieusprawiedliwiona: same daty i zdanie „nie przedłuża terminu (art. 81 ust. 7 dotyczy nieobecności usprawiedliwionej)”;
- termin bazowy (art. 81 ust. 4 ustawy), a gdy jest przedłużenie, przekreślony obok nowego terminu (art. 81 ust. 4 i 7 ustawy; przy `movedToWorkingDay` także art. 115 KC);
- stopka: „Reguły: 2016-470/1, obowiązują od 23.04.2016” z `rulesVersion()`.
Wpisy z cudzych zdarzeń (pkt 5 kolejności cięcia): rozpoczęcie cyklu i termin rozmowy o kryteriach (§ 7 pkt 1), potwierdzenie części I, zmiana oceniającego (§ 9 ust. 3; faza 3), zatwierdzenie oceny, zapoznanie albo fikcja zapoznania i termin sprzeciwu (art. 83 ust. 1). Mapa „typ zdarzenia → tytuł i przepis” jest jedną tablicą w `src/timeline.ts`; nieznane typy są pomijane. Przy nazwisku ocenianego w nagłówku nie ma żadnej etykiety ani liczby.

**Contract**: `GET /cycles/:id/timeline` → 200 dla uczestnika, 403 dla innych; `buildTimeline(cycleId): TimelineEntry[]`, gdzie `TimelineEntry = { date, title, detail?, basis, rulesVersion, kind: "fact" | "deadline" }`. Fakty tylko z datą `<= today()`, terminy zawsze.

#### 5. Odnośniki i jeden termin w aplikacji

**File**: widoki S-01 (`GET /cycles/:id`), S-06 (ekran kadr), ekran startowy ocenianego

**Intent**: Dodać odnośniki „Oś czasu” (wszyscy uczestnicy), „Wpisz nieobecność” i „Zmień oceniającego” (kadry). Tam, gdzie S-01 i S-06 pokazują termin oceny, podmienić źródło na `effectiveDeadline(cycleId).deadline`, żeby po wpisaniu nieobecności żaden ekran nie pokazywał starego terminu. Zmiana ogranicza się do wywołania funkcji i odnośników.

**Contract**: `grep` po starym wywołaniu funkcji terminu w `src/routes` i `src/views` nie zwraca miejsc wyświetlania terminu oceny poza `src/cycle-deadline.ts`.

### Success Criteria:

#### Automated Verification:

- Testy tras przechodzą: `bun test`
- Po zapisaniu dwóch nieobecności Piotra oś czasu zawiera „05.10.2026–06.11.2026”, „dłużej niż miesiąc”, „30.12.2026”, „art. 81 ust. 7” i wersję reguł

#### Manual Verification:

- Krok 3 pokazu na koncie Joanny: data systemowa 10.11.2026, dwie nieobecności, po zapisie oś czasu z jedną nieobecnością i nowym terminem; ten sam termin na ekranie cyklu i na ekranie kadr

## Phase 3: Zmiana oceniającego i dane Ewy (ok. 15 min)

### Changes Required:

#### 1. Dane pokazowe

**File**: `src/seed.ts`

**Intent**: Dopisać dane potrzebne osi Ewy. Nieobecności Piotra nie są wgrywane: Joanna wpisuje je na żywo w kroku 3.
- Zmiana oceniającego u Ewy: zdarzenie `appraiser_changed` z datą 05.12.2024, `from_id` = poprzedni naczelnik, `to_id` = Marek, `actor_id` = Joanna; `cycles.appraiser_id` Ewy = Marek. Data musi być po potwierdzeniu części I Ewy (przez poprzedniego naczelnika) i nie później niż 09.12.2024, bo od pierwszego dnia pokazu Ewa jest w zespole Marka, a Marek pisze o niej notatkę 12.12.2024.
- Jeśli seed nie ma cyklu Ewy: cykl z okresem od 20.11.2024, oceniający poprzedni naczelnik, kryteria obowiązkowe arkusza C i „Orientacja na klienta/interesanta”, rozmowa o kryteriach 02.12.2024, potwierdzenie części I 03.12.2024.
- Nieobecność Ewy: `absences` 2026-02-16–2026-08-28, `excused = 1`, `recorded_on = 2026-02-16`, `recorded_by` = Joanna; zdarzenie `absence_recorded` z tą samą datą.

**Contract**: po `bun run seed` i dacie systemowej 2024-12-09 oś Ewy pokazuje zmianę oceniającego i termin 20.11.2026, bez nieobecności; po przesunięciu daty na 2026-03-01 widać nieobecność i termin 02.06.2027.

#### 2. Formularz kadr: zmiana oceniającego

**File**: `src/routes/appraiser.tsx`, `src/views/appraiser-change-form.tsx`

**Intent**: Kadry wybierają nowego oceniającego z listy osób z rolą oceniającego (bez obecnego) i klikają „Zapisz zmianę oceniającego”. Przed przyciskiem zdanie: „Kryteria zostają bez zmian. Nowy oceniający ocenia na podstawie wcześniej wybranych kryteriów (§ 9 ust. 3 rozporządzenia)” i lista obecnych kryteriów cyklu. Zmiana obowiązuje od dziś (data systemowa). Zapis w jednej transakcji: zdarzenie `appraiser_changed` i `cycles.appraiser_id`. `cycle_criteria` nietknięte. Tylko kadry; inni 403.

**Contract**: `GET /cycles/:id/appraiser`; `POST /cycles/:id/appraiser` (pole `appraiser_id`) → 302 na `/cycles/:id/timeline`; ten sam oceniający albo osoba spoza listy → 400 bez zapisu. Na osi wpis „Zmiana oceniającego: poprzedni naczelnik → Marek Zieliński. Kryteria bez zmian” z przepisem § 9 ust. 3 rozporządzenia.

### Success Criteria:

#### Automated Verification:

- Testy tras przechodzą: `bun test`
- Po zmianie oceniającego `cycle_criteria` cyklu ma te same wiersze co przed zmianą, a `cycles.appraiser_id` wskazuje nowego oceniającego
- Dane pokazowe wgrywają się bez błędu: `bun run seed`

#### Manual Verification:

- Na koncie Ewy oś czasu pokazuje zmianę oceniającego z § 9 ust. 3 i, po przesunięciu daty, nieobecność z nowym terminem

## Phase 4: Przypomnienia przy przesuwaniu daty (ok. 15 min)

### Changes Required:

#### 1. Ustawienie urzędu

**File**: `rules/office-settings.json`

**Intent**: Dopisać liczbę dni przed terminem oceny, od której pojawia się przypomnienie. Wartość nie wynika z przepisów, więc na ekranie jest oznaczona jako „ustawienie urzędu”.

**Contract**: `"assessmentReminderDays": { "value": 30, "label": "ustawienie urzędu" }`.

#### 2. Przypomnienia na ekranie startowym

**File**: `src/reminders.ts`, widok ekranu startowego z F-01

**Intent**: Lista spraw na `GET /` dostaje pozycje liczone z `effectiveDeadline` przy bieżącej dacie systemowej (nic nie jest zapisywane):
- oceniający i oceniany, gdy `today()` jest w oknie `[deadline − assessmentReminderDays, deadline]`: „Termin oceny Piotra Wójcika: 30.12.2026 (art. 81 ust. 4 i 7 ustawy). Przypomnienie na 30 dni przed terminem: ustawienie urzędu”, z odnośnikiem do osi czasu;
- oceniający i oceniany, gdy termin jest przedłużony: „Termin oceny przesunięty z 27.11.2026 na 30.12.2026 z powodu nieobecności dłuższej niż miesiąc (art. 81 ust. 7 ustawy)”. Zdanie mówi o terminie, nie o pracowniku; nie ma w nim dat ani długości nieobecności.
Po przesunięciu daty systemowej (`POST /demo/date`) lista liczy się na nowo przy następnym wejściu na `/`.

**Contract**: `remindersFor(personId): { text: string; basis: string; href: string }[]`; dla kadr zwraca pustą listę (kadry mają ekran S-06).

### Success Criteria:

#### Automated Verification:

- Testy przechodzą: `bun test`
- Bez nieobecności przy dacie 2026-10-27 Marek nie ma przypomnienia o terminie Piotra, przy 2026-10-28 ma („27.11.2026”)

#### Manual Verification:

- Przesunięcie daty na koncie administratora i wejście na konto Marka pokazuje przypomnienie z przepisem i dopiskiem „ustawienie urzędu”

## Testing Strategy

`src/engine/absences.test.ts` (czyste funkcje, bez bazy):
- przykład organizatora: jedna nieobecność 05.10–06.11.2026, 33 dni, dłużej niż miesiąc; termin 27.11.2026 → 30.12.2026;
- każdy z tych wpisów osobno nie przekracza miesiąca (12 i 19 dni), przedłużenie 0;
- przerwa z dniem roboczym (05.10–16.10 i 20.10–06.11.2026) daje dwie nieobecności, przedłużenie 0;
- przerwa ze świętem w środku tygodnia (09.11–10.11.2026 i 12.11.2026–…, 11.11 to środa i święto) łączy się;
- wpisy nachodzące na siebie i stykające się łączą się; kolejność wejścia nie ma znaczenia;
- nieobecność nieusprawiedliwiona nie przedłuża i nie łączy dwóch usprawiedliwionych;
- granice progu: 05.10–04.11.2026 nie, 05.10–05.11.2026 tak; 31.01–27.02.2026 nie, 31.01–28.02.2026 tak (miesiąc od 31.01 kończy się 28.02);
- przesunięcie na dzień roboczy: okres od 16.03.2024, nieobecność 05.05–06.06.2025 (33 dni) → 20.04.2026, `movedToWorkingDay: true`;
- Ewa: 194 dni, 02.06.2027;
- nieobecność zaczęta przed początkiem okresu liczy dni od początku okresu; „Do” przed „Od” rzuca błąd.

`src/routes/*.test.ts` przez `app.request()` na świeżej bazie z seedem:
- kadry: `POST /cycles/:id/absences` dwa razy → 302, oś czasu zawiera jedną nieobecność, „dłużej niż miesiąc”, „30.12.2026”, przepis i wersję reguł;
- oceniający i oceniany: `POST /cycles/:id/absences` → 403, nic nie zapisane; zły zakres dat → 400, nic nie zapisane;
- oś czasu: oceniany, oceniający i kadry → 200; osoba spoza cyklu (Tomasz) → 403;
- decyzja 10i: przy dacie 2024-12-09 oś Ewy nie ma nieobecności, po `POST /demo/date` na 2026-03-01 ma;
- zmiana oceniającego: wpis na osi z „§ 9 ust. 3”, `cycle_criteria` bez zmian;
- przypomnienia: okno 30 dni wokół terminu Piotra (bez i z przedłużeniem).

Ręcznie: krok 3 pokazu i oś Ewy z wersji 5-minutowej, na komputerze i telefonie (360 px).

## Open Questions

Żadne nie blokuje budowy; implementator przyjmuje rekomendację.

1. **Jak liczyć „dłużej niż miesiąc”.** Przepisy i materiały mówią tylko „dłuższa niż miesiąc”; przykład organizatora (33 dni) spełnia każdą sensowną definicję. Rekomendacja: miesiąc według art. 112 KC liczony od pierwszego dnia nieobecności, „dłużej” ⇔ `to >= addMonths(from, 1)`. Odrzucona alternatywa: „więcej niż 30 dni” (nie zgadza się z liczeniem miesięcy w reszcie silnika).
2. **Nieobecność wykraczająca poza okres oceny.** Rekomendacja: dni sprzed początku okresu się nie liczą, próg sprawdza się na całej nieobecności, nieobecność zaczęta po terminie bazowym nie przedłuża (bez przeliczania w pętli).
3. **Czy oceniany widzi daty swojej nieobecności.** Tabela „Access Control” w `prd.md` daje ocenianemu „brak” przy „Nieobecności i zmiany podległości”, a FR-014 i persona Ewy wymagają, żeby widział nowy termin i jego podstawę. Rekomendacja: oceniany widzi na własnej osi połączoną nieobecność, próg i nowy termin (to jego dane i podstawa jego terminu), ale nie widzi formularza kadr ani listy pojedynczych wpisów.
4. **Data zmiany oceniającego u Ewy.** Dokumenty jej nie podają. Rekomendacja: 05.12.2024 (patrz faza 3; wymusza ją notatka Marka o Ewie z 12.12.2024).
5. **Data systemowa w kroku 3.** Rekomendacja: 10.11.2026 (Piotr wrócił 9.11, a krok 4 potrzebuje daty od 12.11, żeby była widoczna notatka z 12.11.2026).
6. **Wersja reguł przy dacie historycznej.** Jeśli cykl zapisuje własną wersję reguł (FR-033), oś pokazuje ją; jeśli nie, pokazuje `rulesVersion()`. W prototypie to ta sama wartość.

## References

- `context/foundation/decisions.md` (decyzje 3, 4, 6a, 7, 10b, 10h, 10i, 10m)
- `context/foundation/prd.md` (US-03, FR-010, FR-011, FR-014, FR-033, FR-034, Business Logic, Access Control)
- `context/foundation/roadmap.md` (S-03)
- `context/foundation/demo.md` (krok 3, daty Piotra i Ewy, wersja 5-minutowa)
- `context/changes/rules-engine-and-demo-data/plan.md` (F-01: tabele, `today()`, `rulesVersion()`, seed)
- `src/silnik/terminy.ts` i `src/silnik/ocena.test.ts` (po F-01: `src/engine/deadlines.ts`)
- Ustawa o służbie cywilnej: art. 81 ust. 4 i 7, art. 83 ust. 1; rozporządzenie Dz.U. 2016 poz. 470: § 7, § 9 ust. 3; Kodeks cywilny art. 110–115; zasady liczenia terminów KPRM (sekcja „Nieobecności”, pkt 2–3); FAQ DSC pyt. 19

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Silnik — łączenie nieobecności i nowy termin

#### Automated

- [ ] 1.1 Testy silnika przechodzą: `bun test src/engine`
- [ ] 1.2 Przykład organizatora daje nieobecność 05.10–06.11.2026 (33 dni) i termin 2026-12-30
- [ ] 1.3 Ewa: 194 dni i termin 2027-06-02

### Phase 2: Nieobecności i oś czasu

#### Automated

- [ ] 2.1 Testy tras przechodzą: `bun test`
- [ ] 2.2 Oś czasu Piotra po dwóch nieobecnościach pokazuje próg, nowy termin, przepis i wersję reguł

#### Manual

- [ ] 2.3 Krok 3 pokazu na koncie Joanny i ten sam termin na ekranie cyklu i kadr

### Phase 3: Zmiana oceniającego i dane Ewy

#### Automated

- [ ] 3.1 Testy tras przechodzą: `bun test`
- [ ] 3.2 Zmiana oceniającego zostawia kryteria bez zmian
- [ ] 3.3 Dane pokazowe wgrywają się bez błędu: `bun run seed`

#### Manual

- [ ] 3.4 Oś czasu Ewy ze zmianą oceniającego i nieobecnością

### Phase 4: Przypomnienia przy przesuwaniu daty

#### Automated

- [ ] 4.1 Testy przechodzą: `bun test`
- [ ] 4.2 Przypomnienie o terminie pojawia się 30 dni przed terminem

#### Manual

- [ ] 4.3 Przypomnienie na koncie Marka po przesunięciu daty
