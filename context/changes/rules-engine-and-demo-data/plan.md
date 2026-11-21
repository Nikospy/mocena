# Silnik reguł, dane pokazowe i wybór konta — plan wdrożenia

## Overview

Fundament pod wszystkie plastry: reguły rozporządzenia w pliku z wersją, silnik wyniku i terminów z testami, baza z danymi pokazowymi, wybór konta i wspólny szkielet ekranu.

## Current State Analysis

Repo ma starter Hono (`src/index.ts`, `GET /`). Silnik i plik reguł są już skopiowane do tego repo z nazwami po polsku: `reguly/rozporzadzenie-2016-470.json` (klucze po polsku, `wersja: 2016-470/1`, `obowiazujeOd: 2016-04-22`), `src/silnik/ocena.ts`, `src/silnik/terminy.ts`, `src/silnik/ocena.test.ts`. 19 testów na przykładach organizatora przechodzi. Data `2016-04-22` jest błędna: rozporządzenie ogłoszono 8.04.2016 i weszło w życie po upływie 14 dni, czyli 23.04.2016.

## Desired End State

`bun test` przechodzi; `bun run seed` tworzy bazę z wydziałem pokazowym; po wejściu na `/` użytkownik wybiera konto i widzi swój ekran startowy z listą spraw; data systemowa jest widoczna i daje się przesunąć.

## What We're NOT Doing

- Żadnych ekranów cyklu (S-01 i dalej).
- Logowania hasłem, ról i kont poza listą „Kto jest w danych pokazowych” z `context/foundation/demo.md`, edycji danych pracowników.
- Wdrożenia i CI.

## Implementation Approach

Jedna faza. Reguły zostają danymi (`rules/*.json` z `version` i `effectiveFrom`), kod czyta je przez jeden moduł. Baza to jeden plik `bun:sqlite`, schemat tworzony przy starcie, dane pokazowe wgrywane skryptem. Konto to ciasteczko z identyfikatorem osoby. Data systemowa leży w bazie, żeby pokaz mógł ją przesuwać; cały kod pyta o „dziś” jedną funkcję. Każde zdarzenie ma datę, a odczyty pokazują tylko zdarzenia z datą nie późniejszą niż „dziś” (decyzja 10i): wgrane dane z lat 2025–2026 odsłaniają się przy przesuwaniu daty, a zapis z ekranu dostaje datę systemową.

## Kontrakt wspólny dla wszystkich plastrów

Ten rozdział jest źródłem nazw dla planów S-01 do S-06. Przy rozjeździe wygrywa ten rozdział, a po zbudowaniu F-01 kod. Żaden plaster nie tworzy drugiej nazwy na to samo.

### Uruchomienie

- `package.json`: `dev` wskazuje `src/index.tsx`; `seed` to `bun run src/seed.ts`; `test` to `bun test`.
- Pliki z `public/` (style, style druku, małe skrypty) są serwowane lokalnie przez `serveStatic`; bez CDN i bez sieci.
- `createTestApp({ today, seedOptions })` w `src/test-helpers.ts`: aplikacja na bazie w pamięci, z wgranymi danymi i ustawioną datą systemową. Oba pola są opcjonalne.
- `runSeed(db, options)` w `src/seed.ts`: jedno wspólne wgranie danych. Wołają je `bun run seed` i `createTestApp`. Opcje: `liveStep2` (z wiersza poleceń `--live-step-2`) i `afterStep1` (`--after-step-1`); opis w części o danych pokazowych.

### Tabele

| Tabela | Kolumny | Właściciel |
|---|---|---|
| `people` | `id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade, grade_awarded_on` (`grade_awarded_on` może być puste) | F-01 |
| `cycles` | `id, person_id, appraiser_id, period_start, sheet` | F-01 |
| `cycle_criteria` | `cycle_id, criterion_id, kind, expectation` (`kind`: `mandatory` albo `additional`) | F-01 tworzy, S-01 wypełnia |
| `events` | `id, type, cycle_id, actor_id, date, payload` (`payload` to JSON, `cycle_id` może być puste) | F-01 |
| `settings` | `key, value`; klucze `demo_date`, `office_city`, `office_name` | F-01 |
| `notes` | `id, author_id, subject_id, cycle_id, criterion_id, date, text, rating, task_change, suggested_task_change, suggestion_source, created_at` | S-04 |
| `feedback_messages` | `id, note_id, author_id, recipient_id, sent_on, text` | S-04 |
| `absences` | `id, person_id, date_from, date_to, excused, recorded_on, recorded_by` | S-03 |

Rozszerzenia: S-01 dodaje `people.position_kind` i `people.duty_types` (JSON); S-06 dodaje `people.appointed_year`. Role w `people.role`: `appraiser`, `employee`, `hr`, `admin`. Identyfikatory kryteriów zostają takie jak w pliku reguł (na przykład `orientacja-na-klienta`): to dane, nie nazwy w kodzie.

Terminu oceny nie zapisuje się w `cycles`. Skąd ekran go bierze, mówi tabela „Skąd ekran bierze termin oceny” niżej.

### Funkcje F-01

- `today()`: data systemowa z `settings.demo_date`.
- `currentPerson(c)`: osoba z ciasteczka albo `null`.
- `recordEvent(type, cycleId, actorId, payload)`: zapis z datą `today()`. `seedEvent(type, cycleId, actorId, payload, date)`: zapis z jawną datą (data jest ostatnim argumentem); wolno go używać w modułach danych pokazowych i w przygotowaniu testów, nigdy w trasach.
- Połączenie z bazą: wszystkie funkcje czytają je z `src/db.ts` przez `getDb()`. `runSeed(db, options)` i `createTestApp` ustawiają je przez `setDb(db)` przed wywołaniem modułów, więc funkcje bez argumentu `db` (na przykład `savePart1`) piszą do tej samej bazy. Brakujące opcje `runSeed` przyjmują wartość `false`.
- `visibleEvents(cycleId, { asOf })`: zdarzenia z `date <= today()`, w porządku `(date, id)`. Opcjonalne `asOf` zastępuje `today()` jawną datą; używają go tylko moduły danych pokazowych (składanie historycznych łańcuchów i migawek), `savePart1` (liczy termin na dzień zapisu) oraz testy. Ta sama granica obowiązuje pozostałe tabele, każda ma jedną kolumnę granicy: `notes.date` (nie `created_at`), `feedback_messages.sent_on`, `absences.recorded_on`; cykl jest widoczny od daty swojego zdarzenia `cycle_started`. Data systemowa przesuwa się tylko do przodu, więc zapis zrobiony na żywo nigdy nie znika.
- `effectiveDeadline(cycleId, { asOf })` w `src/cycles.ts`: zwraca `{ date, basis: string[] }`; `asOf` jak wyżej. W F-01: dla zwykłego cyklu `nextAssessmentDeadline(period_start, 0)`, dla ponownej oceny po negatywnej `periodEndAfterNegative(previousAcknowledgedOn)`. S-03 dokłada nieobecności w tym samym miejscu, tylko dla zwykłego cyklu.
- `openCycle(personId)` w `src/cycles.ts`: bieżący otwarty cykl osoby albo `null`. Otwarty to widoczny cykl bez widocznego `assessment_acknowledged` i bez `acknowledgement_fiction`; gdy jest ich kilka, ten z najpóźniejszym `period_start`. Notatki, uprawnienia i ekrany biorą cykl osoby tylko stąd, nigdy z „pierwszego widocznego”.
- `homeTasks(person)` w `src/home-tasks.ts`: lista spraw na `GET /`; każdy plaster dopisuje swoje pozycje przez `registerHomeTasks(fn)`.
- `cycleLinks(cycle, person)` w `src/cycle-links.ts`: odnośniki na ekranie cyklu i w wierszu cyklu na `/hr`; każdy plaster dopisuje swoje przez `registerCycleLinks(fn)`. Dwie zasady: plaster rejestruje odnośnik tylko dla ról, które jego trasa `GET` naprawdę wpuszcza, i żaden plaster nie wpisuje na sztywno odnośnika do trasy innego plastra.
- `rulesVersion()`: `{ version, effectiveFrom, act }`.
- `setting(key)`: odczyt wartości z `settings` (na przykład `office_city`).
- `visibleEvents(null)` zwraca zdarzenia bez cyklu; `visibleEventsOfType(type)` zwraca widoczne zdarzenia danego typu ze wszystkich cykli.
- `currentGrade(personId, { asOf })` w `src/people.ts`: zwraca `{ grade, awardedOn }` z ostatniego widocznego `mandatory_grade_awarded` tej osoby (`toGrade` i data zdarzenia, szukane po `payload.personId`), a gdy go nie ma, z `people.civil_service_grade` i `people.grade_awarded_on` (z `asOf` tylko wtedy, gdy `grade_awarded_on` nie jest późniejsze niż `asOf`; inaczej `{ grade: null, awardedOn: null }`). Powstaje w fazie 1 F-01. Opcjonalne `{ asOf }` daje stopień na jawną datę (dla migawek historycznych). To jedyne źródło bieżącego stopnia dla S-02 i S-06.

### Nazwy silnika po przeniesieniu

- `src/engine/scoring.ts`: `computeAssessment(scores)` zwraca `{ mean, overallLevel, outcome, reasons, justificationRequired }`; `mandatoryCriteria(sheet)`, `selectableCriteria(sheet)`, `validateAdditionalCriteria(sheet, ids)`, `criterion(id)`.
- `src/engine/deadlines.ts`: `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `criteriaTalkDeadline(from, afterNegative)`, `periodEndAfterNegative`, `objectionDeadline`, `objectionReviewDeadline`, `courtAppealDeadline`.

### Zdarzenia

| Typ | Payload | Właściciel |
|---|---|---|
| `cycle_started` | `{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`; `reason`: `hired`, `appointed` albo `previous_assessment`; `previousOutcome`: `positive`, `negative` albo `null`; `previousAssessmentOn` to dzień sporządzenia poprzedniej oceny, `previousAcknowledgedOn` dzień zapoznania z nią (od niego liczy się ponowna ocena po negatywnej). Każdy plaster, który zapisuje albo wgrywa to zdarzenie, podaje wszystkie pięć pól | F-01 (dane), S-01 |
| `part1_submitted` | `{ sheet, criteria, dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }`; `rulesVersion` to cały obiekt `{ version, effectiveFrom, act }`, tak samo jak w migawce oceny | S-01 |
| `part1_confirmed` | `{ place, appraiseeName }`; w danych pokazowych zapisuje je `seedEvent` z jawną datą | S-01 |
| `assessment_draft_saved` | szkic oceny | S-02 |
| `assessment_approved` | migawka oceny `AssessmentSnapshot`; `periodFrom` to `cycles.period_start`, `deadline` to `effectiveDeadline` z dnia zatwierdzenia, `grade` i `gradeAwardedOn` to stopień z dnia zatwierdzenia | S-02 |
| `assessment_acknowledged` | `{ place, date, name, objectionDeadline }` | S-02 |
| `acknowledgement_fiction` | `{ reason, deliveryMethod, deliveredOn, objectionDeadline }` | S-02 |
| `task_change_answered` | `{ noteId, answer, developmentFormId }` | S-05 |
| `objection_filed`, `objection_resolved`, `due_change_requested` | `{ to }`, `{ outcome }`, `{ requestedDate, reason }` | S-06 |
| `mandatory_grade_awarded` | `{ personId, fromGrade, toGrade, basis }`, zapisane przy cyklu drugiej oceny z pary | S-06 |
| `absence_recorded`, `appraiser_changed` | `{ absence_id, notified }`, `{ from_id, to_id }` | S-03 |

### Trasy

| Obszar | Trasy | Właściciel |
|---|---|---|
| Konto i data | `GET /`, `GET/POST /account`, `POST /demo/date` | F-01 |
| Część I i karty | `GET /cycles/:id` (przekierowuje na `part1`), `GET /cycles/:id/part1` (ekran wejściowy cyklu, pokazuje `cycleLinks`), `POST /cycles/:id/part1/{criteria,submit,confirm}`, `GET /cycles/:id/cards/opening` | S-01 |
| Ocena | `GET/POST /cycles/:id/assessment`, `POST /cycles/:id/assessment/{preview,approve,acknowledge}`, `GET/POST /cycles/:id/assessment/fiction` | S-02 |
| Notatki | `GET /people/:personId/notes/new`, `POST /people/:personId/notes`, `GET /notes`, `GET/POST /notes/:id/feedback`, `GET /feedback`, `POST /suggestions/note`, `GET /cycles/:id/cards/assessment-conversation` | S-04 |
| HR partner | `GET/POST /notes/:noteId/task-change`, `GET /cycles/:id/before-meeting`, `GET /cycles/:id/appreciation`, `GET /admin/suggestion-sources` | S-05 |
| Kadry i wydruk | `GET /hr`, `GET /cycles/:id/sheet`, `GET /people/:id/history`, `POST /hr/grades/:personId`, `POST /cycles/:id/objection-outcome` | S-06 |
| Oś czasu | `GET/POST /cycles/:id/absences`, `GET/POST /cycles/:id/appraiser`, `GET /cycles/:id/timeline` | S-03 |

### Zasady wspólne tras

- Po udanym `POST`, który coś zapisuje, trasa odpowiada przekierowaniem 303. `POST`, który niczego nie zapisuje (`POST /suggestions/note`, `POST /cycles/:id/assessment/preview`), odpowiada 200. `GET /cycles/:id` przekierowuje kodem 302.
- `POST /cycles/:id/assessment/preview` niczego nie zapisuje, więc także przy ocenach spoza skali odpowiada 200 i pokazuje blokady w zwróconym fragmencie; 422 dotyczy tras, które zapisują.
- `POST /demo/date` może wysłać każde konto (przełącznik daty jest w nagłówku dla wszystkich); przyjmuje tylko datę późniejszą niż bieżąca.
- Odnośnik albo przycisk do czynności zapisu pokazuje się tylko wtedy, gdy zapis by przeszedł: przy czynnościach wymagających otwartego cyklu warunkiem jest `openCycle`, przy notatce `canWriteNoteAbout(viewer, subjectId)` z S-04.
- Błąd walidacji to zawsze 422 z formularzem (nigdy 400), brak uprawnień to 403, zasób, którego nie ma, to 404, próba powtórzenia zamkniętego kroku to 409.
- 409 za zapis do cyklu, który nie jest już otwarty, dotyczy tylko czynności wymagających otwartego cyklu: części I, oceny, nieobecności i zmiany oceniającego. Rozstrzygnięcie sprzeciwu i odnotowanie przyznania stopnia z natury następują po zamknięciu cyklu; ich warunki opisuje plan S-06.
- Po widocznym `assessment_approved` (kolejność zdarzeń z tego samego dnia rozstrzyga para `(date, id)`) termin tej oceny jest zamrożony w migawce: oś czasu i ekrany pokazują `AssessmentSnapshot.deadline`, a nieobecność wpisana później już go nie zmienia.
- `GET /cycles/:id/sheet` obsługuje oba stany: przy otwartym cyklu pokazuje część I z bieżącym terminem, po zatwierdzeniu cały arkusz z terminem z migawki.
- Kryteria i termin części I są zablokowane już od przekazania części I, czyli wcześniej, niż wymaga PRD (blokada po potwierdzeniu). To uproszczenie prototypu: nie budujemy wycofania przekazanej części I.

### Pliki wspólne

- `rules/office-settings.json` z `officeSettings()`: ustawienia urzędu; tworzy S-01, kolejne plastry dopisują klucze.
- `content/cards.json` z `card(id)`: treści kart; tworzy S-01. Klucze: `opening` (S-01), `assessment` (S-04), `taskChange`, `appreciation`, `beforeMeeting` (S-05).
- Miejscowość potwierdzeń pochodzi z `settings.office_city`. W `rules/office-settings.json` są tylko ustawienia wymyślone przez nas (tabela obowiązków, lista słów, progi, katalog form rozwoju).
- `src/suggestions/index.ts`: jedno wymienne miejsce podpowiedzi. Tworzy S-01 z wejściem `suggestCriteria(sheet, dutyTypeIds)`; S-04 dopisuje `suggestForNote(text)` i `suggestionMode()`, które zwraca `rules`, `local-model` albo `none` (te same wartości co `notes.suggestion_source`); S-05 dopisuje `suggestDevelopmentForm(note)`. W katalogu `developmentForms` dokładnie jedna forma ma `default: true`.
- `src/views/components.tsx`: `LegalBasis` i `ConfirmationBlock`; tworzy S-01. `ConfirmationBlock` ma od początku oba warianty: `kind: "confirmation"` (`name, place, date`; treść „Potwierdzenie w systemie: <miejscowość>, <DD.MM.RRRR>, <imię i nazwisko>”, bez danych „Jeszcze niepotwierdzone”) i `kind: "fiction"` (`name, reason, deliveryMethod, deliveredOn, date`; `name` to osoba, która stwierdziła fikcję). S-02 i S-06 tylko go używają; własnego bloku nie tworzy nikt.
- Plik reguł po przeniesieniu ma klucze `criteriaConversation` i `assessmentConversation` (każdy z `basis` i `topics`); S-02 dopisuje `approval`, w tym jedyny klucz granicy stopnia `approval.gradeRequest.maxGrade` (9); S-06 dopisuje `deadlines.mandatoryGradeDays` i czyta granicę stopnia z klucza S-02; S-03 dopisuje podstawy nieobecności i zmiany oceniającego. Klucze terminów po przeniesieniu: `deadlines.assessmentEveryMonths`, `deadlines.criteriaTalkDays`, `deadlines.criteriaTalkAfterNegativeDays`, `deadlines.reassessmentAfterNegativeMonths`, `deadlines.objectionDays`, `deadlines.objectionReviewDays`, `deadlines.courtAppealDays`, `deadlines.positionChangeMinMonths`; każdy ma `value`, `basis` i, gdzie było, `from`. S-03 dopisuje `deadlines.longAbsenceOverMonths`, `deadlines.deadlineCounting` i `appraiserChange`, każdy z `basis`.

### Co plastry udostępniają sobie nawzajem

| Plaster | Funkcje i kształty |
|---|---|
| S-01 | `part1Status(cycleId)`, `cycleCriteria(cycleId)`, `submitPart1(cycleId, actorId, input)` (sprawdza, że aktor jest bieżącym oceniającym), `savePart1(cycleId, actorId, input, date)` (sam zapis, bez sprawdzania aktora; woła go `submitPart1` i moduły danych pokazowych; arkusz dobiera z `people.position_kind` przez `sheetForPosition` i zapisuje w `cycles.sheet`) |
| S-02 | `assessmentState(cycleId)`, `approvalBlockers(input)`, `buildAssessmentSnapshot(cycleId, draft, { asOf })` (jedyne miejsce, które składa migawkę; woła je zatwierdzenie i moduł danych S-06), migawka `AssessmentSnapshot` opisana w planie S-02, typ `Slots` i prop `slots` formularza: `criterionAside(criterionId)`, `justificationTools`, `conclusionsTools`, `beforeForm`; pola `justification` i `developmentConclusions`; zapisane oceny cząstkowe w `assessmentState(cycleId).draft.scores` |
| S-04 | `canWriteNoteAbout(viewer, subjectId)`, `noteById(id)`, `notesAbout`, `notesByAuthor`, `notesForCycle`, `lastFeedbackDate`, `afterNoteSaved(note)`, `suggestForNote`, `suggestionMode` |
| S-05 | zdarzenie `task_change_answered` |
| S-06 | `cycleState(cycleId)`, `mandatoryGrade`, `sheetData(cycleId, options?)`, `canViewSheet`, `assessmentHistory` |
| S-03 | tylko zdarzenia, trasy i rozszerzony `effectiveDeadline`; funkcje osi czasu są wewnętrzne |

### Dane pokazowe: jeden skrypt, jeden właściciel na zestaw

`bun run seed` uruchamia `src/seed.ts`, który kasuje bazę i woła po kolei moduły z `src/seed/`. Każdy plaster dokłada własny moduł.

| Moduł | Co wgrywa | Właściciel |
|---|---|---|
| `src/seed/base.ts` | osoby i podległość, ustawienia, data systemowa `2024-12-09`, cykle Piotra, Ewy i Tomasza ze zdarzeniami `cycle_started`; Piotr bez części I; oceniającym Ewy jest od początku Marek (wcześniejszą zmianę oceniającego dopisuje S-03 jako zdarzenie historyczne); Tomasz jest urzędnikiem mianowanym ze stopniem V przyznanym 2022-12-01 (`grade_awarded_on`); wśród osób bez konta są dyrektor generalny urzędu (adresat sprzeciwu i oceniający Anny) oraz Katarzyna Lewandowska, podwładna Anny na stanowisku z arkuszem C, na której dane S-06 pokazują sprzeciw (Maria nie ma żadnego cyklu) | F-01 |
| `src/seed/part1.ts` | pełna część I Ewy i bieżącego cyklu Tomasza; `position_kind` wszystkich osób z `base.ts` (Katarzyna Lewandowska: `staff`) i `duty_types`. Część I Ewy zapisuje `savePart1` z jawnym aktorem (poprzedni naczelnik) i historyczną datą. Z opcją `afterStep1` dochodzi część I Piotra tak, jak po kroku 1 pokazu: przekazana i potwierdzona 2024-12-09, kryteria dodatkowe `orientacja-na-klienta` i `myslenie-analityczne` | S-01 |
| `src/seed/notes.ts` | 16 notatek z `demo.md` | S-04 |
| `src/seed/assessments.ts` | obie oceny Tomasza jako pełne łańcuchy zdarzeń, przykłady stanów uproszczonych (w tym zamknięty cykl Katarzyny Lewandowskiej ze sprzeciwem) | S-06 (kształt migawki z S-02) |
| `src/seed/absences.ts` | nieobecność Ewy i zmiana jej oceniającego | S-03 |

Opcja `afterStep1` służy testom i próbom plastrów budowanych po S-01: test S-02, S-04 albo S-05, który zaczyna od późniejszej daty, bierze `createTestApp({ today, seedOptions: { afterStep1: true } })` zamiast dopisywać część I Piotra własnym kodem. Próba ręczna od kroku 2 w górę używa `bun run seed -- --after-step-1` albo odtwarza krok 1 klikaniem.

Wgrana notatka z 11.03.2026 o przejęciu kolejki dubluje notatkę pisaną na żywo w kroku 2 pokazu. `bun run seed -- --live-step-2` pomija tę jedną notatkę; pełny pokaz i wersja 5-minutowa używają tej opcji, wersja 90-sekundowa używa danych domyślnych.

### Daty pokazu (do prób i testów)

| Krok | Data systemowa |
|---|---|
| 1 | 2024-12-09 |
| 2 | 2026-03-11 |
| 3 | 2026-11-10 |
| 4 | 2026-11-21 |
| 5 | 2026-11-22 (termin sprzeciwu: 2026-11-30) |

Kliknięcie fikcji zapoznania w wersji 5-minutowej pokazuje się w osobnym przebiegu od czystych danych, zamiast potwierdzenia Piotra. Ten przebieg odtwarza kroki 1 i 2 (albo wgrywa dane z `--after-step-1` bez `--live-step-2`), żeby notatka z 11.03.2026 istniała i krok 4 miał podział na notatki sprzed zmiany zadań i po niej.

### Co jest potrzebne do wersji 5-minutowej pokazu

Wersja minimalna każdego plastra utrzymuje wersję 90-sekundową i pełne kroki 1 do 5. Wersja 5-minutowa wymaga dodatkowo trzech rzeczy. W planach stoją one na początku listy „Kolejność cięcia”, czyli powstają zaraz po wersji minimalnej i wypadają jako ostatnie:

| Rzecz | Plaster |
|---|---|
| Fikcja zapoznania z ekranem skutku i wgląd kadr w ocenę | S-02 |
| Przycisk „Odnotuj przyznanie stopnia” | S-06 |
| Zmiana oceniającego Ewy widoczna na osi czasu (dane i jej wyświetlenie) | S-03 |

### Skąd ekran bierze termin oceny

| Sytuacja | Źródło |
|---|---|
| Termin przekazany ocenianemu w części I (ekran części I po przekazaniu, wydruk części I) | `part1_submitted.payload.dueDate` |
| Cykl przed zatwierdzeniem oceny (część I przed przekazaniem, `/hr`, oś czasu) | `effectiveDeadline(cycleId)` |
| Ocena zatwierdzona (arkusz, wydruk, statystyka terminowości) | `AssessmentSnapshot.deadline` |

### Pliki dotykane przez więcej niż jeden plaster

Plaster dopisuje swoją część i niczego cudzego nie zmienia ani nie przestawia.

| Plik | Zasada dopisywania |
|---|---|
| `src/seed.ts` | F-01 tworzy `runSeed` z listą wywołań i przekazywaniem opcji. Każdy plaster dopisuje jedno wywołanie swojego modułu, w kolejności: `base`, `part1`, `notes`, `assessments`, `absences`. |
| `src/index.tsx` | Każdy plaster dopisuje import i montowanie własnych tras. |
| `src/db.ts` | Każdy plaster dopisuje własną tabelę albo własne kolumny. Kolumna potrzebna wcześniejszemu plastrowi należy do F-01. |
| `rules/office-settings.json`, `content/cards.json` | S-01 zakłada pliki; kolejne plastry dopisują własne klucze. Czytelnik klucza działa także wtedy, gdy klucza jeszcze nie ma. |
| `rules/regulation-2016-470.json`, `src/engine/rules.ts` | F-01 ustala kształt po przeniesieniu; S-02, S-06 i S-03 dopisują klucze wymienione w części „Pliki wspólne”. |
| `src/suggestions/index.ts` | S-01 tworzy z `suggestCriteria`; S-04 i S-05 dopisują osobne wejścia. |
| `src/views/components.tsx`, `src/views/layout.tsx` | S-01 tworzy wspólne bloki z oboma wariantami `ConfirmationBlock`; S-02 i S-06 tylko ich używają; S-06 dopisuje w układzie odnośnik do stylu druku, bez zmiany istniejących właściwości. |
| `src/routes/assessment.tsx`, `src/routes/notes.tsx` | S-04 przekazuje `slots` do formularza S-02; S-05 dopina pytanie przez `afterNoteSaved(note)`. |
| `src/cycles.ts`, `src/engine/deadlines.ts`, `package.json` | S-03 rozszerza `effectiveDeadline`; S-06 dopisuje `mandatoryGradeDeadline`; S-04 dopisuje zależność testową `happy-dom`. |
| `public/` | Każdy plaster dodaje własne pliki: F-01 `style.css`, S-02 `assessment.js`, S-04 `note-form.js` i `insert-notes.js`, S-06 `print.css`. |

## Phase 1: Fundament

### Changes Required:

#### 1. Reguły i silnik

**File**: `rules/regulation-2016-470.json`, `src/engine/*.ts`

**Intent**: Przenieść silnik i testy, przetłumaczyć nazwy w kodzie i klucze pliku reguł na angielski (treść przepisów zostaje po polsku), przemianować w pliku reguł `wersja` i `obowiazujeOd` na `version` i `effectiveFrom` (wartość `2016-04-23`), wystawić je przez `src/engine/rules.ts`. Po przeniesieniu usunąć katalogi `reguly/` i `src/silnik/`.

**Contract**: `rulesVersion(): { version, effectiveFrom, act }`; `scoring.ts` (wynik oceny) i `deadlines.ts` (terminy) zachowują zachowanie sprawdzone 19 testami.

#### 2. Baza i dane pokazowe

**File**: `src/db.ts`, `src/seed.ts`, `src/seed/base.ts`, `src/people.ts`

**Intent**: Schemat tabel F-01 z rozdziału „Kontrakt wspólny” i skrypt `src/seed.ts` z modułem `src/seed/base.ts`, który wgrywa osoby z listy „Kto jest w danych pokazowych” w `context/foundation/demo.md` (jeden urząd). Notatek, ocen i nieobecności F-01 nie wgrywa: robią to moduły kolejnych plastrów. Osoby i daty bierze z `context/foundation/demo.md`; daty i szczegóły scenariusza są w sekcji „Ustalenia do scenariusza” tego pliku. Nieobecność ma tylko daty i pole „usprawiedliwiona”, bez rodzaju (decyzja 10m). Zespół Marka to Ewa, Piotr i Maria (bez konta i bez notatek).

**Contract**: `bun run seed` kasuje i odtwarza bazę; `today()` zwraca datę systemową z tabeli `settings`; data systemowa po wgraniu to 2024-12-09; `POST /demo/date` przyjmuje tylko datę późniejszą niż bieżąca.

#### 3. Konto i szkielet ekranu

**File**: `src/index.tsx` (przemianowany z `src/index.ts`), `src/views/layout.tsx`, `src/home-tasks.ts`, `src/cycle-links.ts`, `src/cycles.ts`, `src/test-helpers.ts`, `package.json`, `public/style.css`

**Intent**: Wybór konta pokazowego, wspólny układ (nagłówek z kontem i datą systemową, nawigacja), ekran startowy z listą spraw zależną od roli. Tokeny i komponenty wyglądu pochodzą z design systemu autora (decyzja 10b), nie z własnych stylów agenta; dopóki nie ma go w repo, ekran powstaje na samym HTML z klasami, a zrzuty do akceptacji robi się po podpięciu.

**Contract**: `GET /account`, `POST /account`, `GET /` (przekierowuje na `/account` bez ciasteczka), `POST /demo/date` (przesunięcie daty systemowej), plik z `public/` zwracany lokalnie. Ten krok buduje wszystkie pozycje z części „Funkcje F-01” kontraktu, każdą z testem: `getDb`/`setDb`, `runSeed(db, options)`, `createTestApp({ today, seedOptions })`, `today`, `setting`, `currentPerson`, `recordEvent`, `seedEvent`, `visibleEvents` (z `null` i z `asOf`), `visibleEventsOfType`, `effectiveDeadline` (z `asOf`), `openCycle`, `currentGrade` (z `asOf`), `homeTasks`/`registerHomeTasks`, `cycleLinks`/`registerCycleLinks`, `rulesVersion`.

### Success Criteria:

#### Automated Verification:

- Testy silnika i żądań przechodzą: `bun test`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Test uruchomienia: `GET /account` odpowiada, a plik z `public/` jest zwracany

#### Manual Verification:

- Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px); autor akceptuje zrzuty przed powieleniem wyglądu (zasada 10 w `AGENTS.md`)

## Testing Strategy

Reguły sprawdza `src/engine/scoring.test.ts` (przykłady organizatora, granice przedziałów). Wejście bez konta, wybór konta i ekran startowy sprawdza `src/app.test.ts` przez `app.request`. Osobny test granicy widoczności na własnej tabeli `events` (`src/events.test.ts`): zdarzenie wgrane przez `seedEvent` z datą 2025-06-02 nie jest zwracane przez `visibleEvents` przy dacie systemowej 2024-12-09 ani 2025-06-01, a jest zwracane 2025-06-02 i po przesunięciu daty na 2026-03-11; `visibleEvents(cycleId, { asOf })` zwraca je bez przesuwania daty. Test `currentGrade`: bez zdarzenia zwraca stopień i datę z `people`, po `mandatory_grade_awarded` zwraca `toGrade` i datę zdarzenia. Test `openCycle`: cykl z widocznym `assessment_acknowledged` nie jest otwarty.

## References

- `context/foundation/decisions.md` (decyzje 7, 8 i 10)
- `context/foundation/demo.md` (osoby i dane pokazowe)
- `context/foundation/prd.md` (FR-033, Business Logic, Access Control)
- `context/foundation/roadmap.md` (F-01)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fundament

#### Automated

- [ ] 1.1 Testy silnika i żądań przechodzą: `bun test`
- [ ] 1.2 Dane pokazowe wgrywają się bez błędu: `bun run seed`
- [ ] 1.4 Test uruchomienia: `GET /account` odpowiada, a plik z `public/` jest zwracany

#### Manual

- [ ] 1.3 Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px); autor akceptuje zrzuty przed powieleniem wyglądu (zasada 10 w `AGENTS.md`)
