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
- `createTestApp({ today })` w `src/test-helpers.ts`: aplikacja na bazie w pamięci, z wgranymi danymi i ustawioną datą systemową.

### Tabele

| Tabela | Kolumny | Właściciel |
|---|---|---|
| `people` | `id, name, role, position_title, unit, supervisor_id, has_account, appointed, civil_service_grade` | F-01 |
| `cycles` | `id, person_id, appraiser_id, period_start, sheet` | F-01 |
| `cycle_criteria` | `cycle_id, criterion_id, kind, expectation` (`kind`: `mandatory` albo `additional`) | F-01 tworzy, S-01 wypełnia |
| `events` | `id, type, cycle_id, actor_id, date, payload` (`payload` to JSON, `cycle_id` może być puste) | F-01 |
| `settings` | `key, value`; klucze `demo_date`, `office_city`, `office_name` | F-01 |
| `notes` | `id, author_id, subject_id, cycle_id, criterion_id, date, text, rating, task_change, suggested_task_change, suggestion_source, created_at` | S-04 |
| `feedback_messages` | `id, note_id, author_id, recipient_id, sent_on, text` | S-04 |
| `absences` | `id, person_id, date_from, date_to, excused, recorded_on, recorded_by` | S-03 |

Rozszerzenia: S-01 dodaje `people.position_kind` i `people.duty_types` (JSON); S-06 dodaje `people.appointed_year` i `people.grade_awarded_on`. Role w `people.role`: `appraiser`, `employee`, `hr`, `admin`. Identyfikatory kryteriów zostają takie jak w pliku reguł (na przykład `orientacja-na-klienta`): to dane, nie nazwy w kodzie.

Terminu oceny nie zapisuje się w `cycles`. Każdy ekran czyta go z `effectiveDeadline(cycleId)`.

### Funkcje F-01

- `today()`: data systemowa z `settings.demo_date`.
- `currentPerson(c)`: osoba z ciasteczka albo `null`.
- `recordEvent(type, cycleId, actorId, payload)`: zapis z datą `today()`; `seedEvent(...)` z jawną datą tylko w skryptach danych.
- `visibleEvents(cycleId)`: zdarzenia z `date <= today()`, w porządku `(date, id)`. Ta sama granica obowiązuje notatki, nieobecności i cykle: cykl jest widoczny od swojego zdarzenia `cycle_started`.
- `effectiveDeadline(cycleId)` w `src/cycles.ts`: zwraca `{ date, basis: string[] }`. W F-01: dla zwykłego cyklu `nextAssessmentDeadline(period_start, 0)`, dla ponownej oceny po negatywnej `periodEndAfterNegative(previousAcknowledgedOn)`. S-03 dokłada nieobecności w tym samym miejscu, tylko dla zwykłego cyklu.
- `homeTasks(person)` w `src/home-tasks.ts`: lista spraw na `GET /`; każdy plaster dopisuje swoje pozycje przez `registerHomeTasks(fn)`.
- `cycleLinks(cycle, person)` w `src/cycle-links.ts`: odnośniki na ekranie cyklu; każdy plaster dopisuje swoje przez `registerCycleLinks(fn)`.
- `rulesVersion()`: `{ version, effectiveFrom, act }`.
- `setting(key)`: odczyt wartości z `settings` (na przykład `office_city`).
- `visibleEvents(null)` zwraca zdarzenia bez cyklu; `visibleEventsOfType(type)` zwraca widoczne zdarzenia danego typu ze wszystkich cykli.
- `currentGrade(personId)` w `src/people.ts`: zwraca `{ grade, awardedOn }` z ostatniego widocznego `mandatory_grade_awarded` tej osoby, a gdy go nie ma, z `people.civil_service_grade`. To jedyne źródło bieżącego stopnia dla S-02 i S-06.
- `createTestApp({ today, seedOptions })`: `seedOptions.liveStep2` odpowiada opcji `--live-step-2`.

### Nazwy silnika po przeniesieniu

- `src/engine/scoring.ts`: `computeAssessment(scores)` zwraca `{ mean, overallLevel, outcome, reasons, justificationRequired }`; `mandatoryCriteria(sheet)`, `selectableCriteria(sheet)`, `validateAdditionalCriteria(sheet, ids)`, `criterion(id)`.
- `src/engine/deadlines.ts`: `addDays`, `addMonths`, `isDayOff`, `toWorkingDay`, `nextAssessmentDeadline(start, longAbsenceDays)`, `criteriaTalkDeadline(from, afterNegative)`, `periodEndAfterNegative`, `objectionDeadline`, `objectionReviewDeadline`, `courtAppealDeadline`.

### Zdarzenia

| Typ | Payload | Właściciel |
|---|---|---|
| `cycle_started` | `{ reason, periodStart, previousAssessmentOn, previousAcknowledgedOn, previousOutcome }`; `reason`: `hired`, `appointed` albo `previous_assessment`; `previousOutcome`: `positive`, `negative` albo `null`; `previousAssessmentOn` to dzień sporządzenia poprzedniej oceny | F-01 (dane), S-01 |
| `part1_submitted` | `{ sheet, criteria, dueDate, dueDateBasis, criteriaBasis, rulesVersion, place, appraiserName }` | S-01 |
| `part1_confirmed` | `{ place, appraiseeName }` | S-01 |
| `assessment_draft_saved` | szkic oceny | S-02 |
| `assessment_approved` | migawka oceny; `periodFrom` to `cycles.period_start` | S-02 |
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

### Pliki wspólne

- `rules/office-settings.json` z `officeSettings()`: ustawienia urzędu; tworzy S-01, kolejne plastry dopisują klucze.
- `content/cards.json` z `card(id)`: treści kart; tworzy S-01. Klucze: `opening` (S-01), `assessment` (S-04), `taskChange`, `appreciation`, `beforeMeeting` (S-05).
- Miejscowość potwierdzeń pochodzi z `settings.office_city`. W `rules/office-settings.json` są tylko ustawienia wymyślone przez nas (tabela obowiązków, lista słów, progi, katalog form rozwoju).
- `src/suggestions/index.ts`: jedno wymienne miejsce podpowiedzi. Tworzy S-01 z wejściem `suggestCriteria(sheet, dutyTypeIds)`; S-04 dopisuje `suggestForNote(text)` i `suggestionMode()`, które zwraca `rules`, `local-model` albo `none` (te same wartości co `notes.suggestion_source`).
- `src/views/components.tsx`: `LegalBasis` i `ConfirmationBlock`; tworzy S-01, używają S-02 i S-06.
- Plik reguł po przeniesieniu ma klucze `criteriaConversation` i `assessmentConversation` (każdy z `basis` i `topics`); S-02 dopisuje `approval`, S-03 podstawy nieobecności i zmiany oceniającego.

### Co plastry udostępniają sobie nawzajem

| Plaster | Funkcje i kształty |
|---|---|
| S-01 | `part1Status(cycleId)`, `cycleCriteria(cycleId)`, `submitPart1(cycleId, actorId, input)` |
| S-02 | `assessmentState(cycleId)`, `approvalBlockers(input)`, migawka `AssessmentSnapshot` opisana w planie S-02, `slots` formularza: `criterionAside(criterionId)`, `justificationTools`, `conclusionsTools`, `beforeForm`; pola `justification` i `developmentConclusions` |
| S-04 | `notesAbout`, `notesByAuthor`, `notesForCycle`, `lastFeedbackDate`, `afterNoteSaved(note)`, `suggestForNote`, `suggestionMode` |
| S-05 | zdarzenie `task_change_answered` |
| S-06 | `cycleState(cycleId)`, `mandatoryGrade`, `sheetData`, `canViewSheet`, `assessmentHistory` |
| S-03 | `mergeAbsences`, `buildTimeline(cycleId)` |

### Dane pokazowe: jeden skrypt, jeden właściciel na zestaw

`bun run seed` uruchamia `src/seed.ts`, który kasuje bazę i woła po kolei moduły z `src/seed/`. Każdy plaster dokłada własny moduł.

| Moduł | Co wgrywa | Właściciel |
|---|---|---|
| `src/seed/base.ts` | osoby i podległość, ustawienia, data systemowa `2024-12-09`, cykle Piotra, Ewy i Tomasza ze zdarzeniami `cycle_started`; Piotr bez części I; oceniającym Ewy jest od początku Marek (wcześniejszą zmianę oceniającego dopisuje S-03 jako zdarzenie historyczne); Tomasz jest urzędnikiem mianowanym ze stopniem V | F-01 |
| `src/seed/part1.ts` | pełna część I Ewy i bieżącego cyklu Tomasza; `position_kind` i `duty_types` osób | S-01 |
| `src/seed/notes.ts` | 16 notatek z `demo.md` | S-04 |
| `src/seed/assessments.ts` | obie oceny Tomasza jako pełne łańcuchy zdarzeń, przykłady stanów uproszczonych (w tym zamknięty cykl Marii ze sprzeciwem) | S-06 (kształt migawki z S-02) |
| `src/seed/absences.ts` | nieobecność Ewy i zmiana jej oceniającego | S-03 |

Wgrana notatka z 11.03.2026 o przejęciu kolejki dubluje notatkę pisaną na żywo w kroku 2 pokazu. `bun run seed -- --live-step-2` pomija tę jedną notatkę; pełny pokaz i wersja 5-minutowa używają tej opcji, wersja 90-sekundowa używa danych domyślnych.

### Daty pokazu (do prób i testów)

| Krok | Data systemowa |
|---|---|
| 1 | 2024-12-09 |
| 2 | 2026-03-11 |
| 3 | 2026-11-10 |
| 4 | 2026-11-21 |
| 5 | 2026-11-22 (termin sprzeciwu: 2026-11-30) |

Kliknięcie fikcji zapoznania w wersji 5-minutowej pokazuje się w osobnym przebiegu od czystych danych, zamiast potwierdzenia Piotra.

## Phase 1: Fundament

### Changes Required:

#### 1. Reguły i silnik

**File**: `rules/regulation-2016-470.json`, `src/engine/*.ts`

**Intent**: Przenieść silnik i testy, przetłumaczyć nazwy w kodzie i klucze pliku reguł na angielski (treść przepisów zostaje po polsku), przemianować w pliku reguł `wersja` i `obowiazujeOd` na `version` i `effectiveFrom` (wartość `2016-04-23`), wystawić je przez `src/engine/rules.ts`. Po przeniesieniu usunąć katalogi `reguly/` i `src/silnik/`.

**Contract**: `rulesVersion(): { version, effectiveFrom, act }`; `scoring.ts` (wynik oceny) i `deadlines.ts` (terminy) zachowują zachowanie sprawdzone 19 testami.

#### 2. Baza i dane pokazowe

**File**: `src/db.ts`, `src/seed.ts`

**Intent**: Schemat tabel F-01 z rozdziału „Kontrakt wspólny” i skrypt `src/seed.ts` z modułem `src/seed/base.ts`, który wgrywa osoby z listy „Kto jest w danych pokazowych” w `context/foundation/demo.md` (jeden urząd). Notatek, ocen i nieobecności F-01 nie wgrywa: robią to moduły kolejnych plastrów. Osoby i daty bierze z `context/foundation/demo.md`; daty i szczegóły scenariusza są w sekcji „Ustalenia do scenariusza” tego pliku. Nieobecność ma tylko daty i pole „usprawiedliwiona”, bez rodzaju (decyzja 10m). Zespół Marka to Ewa, Piotr i Maria (bez konta i bez notatek).

**Contract**: `bun run seed` kasuje i odtwarza bazę; `today()` zwraca datę systemową z tabeli `settings`; data systemowa po wgraniu to 2024-12-09; `POST /demo/date` przyjmuje tylko datę późniejszą niż bieżąca.

#### 3. Konto i szkielet ekranu

**File**: `src/index.tsx` (przemianowany z `src/index.ts`), `src/views/layout.tsx`, `src/home-tasks.ts`, `src/cycle-links.ts`, `src/cycles.ts`, `src/test-helpers.ts`, `package.json`, `public/style.css`

**Intent**: Wybór konta pokazowego, wspólny układ (nagłówek z kontem i datą systemową, nawigacja), ekran startowy z listą spraw zależną od roli. Tokeny i komponenty wyglądu pochodzą z design systemu autora (decyzja 10b), nie z własnych stylów agenta; dopóki nie ma go w repo, ekran powstaje na samym HTML z klasami, a zrzuty do akceptacji robi się po podpięciu.

**Contract**: `GET /account`, `POST /account`, `GET /` (przekierowuje na `/account` bez ciasteczka), `POST /demo/date` (przesunięcie daty systemowej), plik z `public/` zwracany lokalnie, funkcje z rozdziału „Kontrakt wspólny”.

### Success Criteria:

#### Automated Verification:

- Testy silnika i żądań przechodzą: `bun test`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`
- Test uruchomienia: `GET /account` odpowiada, a plik z `public/` jest zwracany

#### Manual Verification:

- Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px); autor akceptuje zrzuty przed powieleniem wyglądu (zasada 10 w `AGENTS.md`)

## Testing Strategy

Reguły sprawdza `src/engine/scoring.test.ts` (przykłady organizatora, granice przedziałów). Wejście bez konta, wybór konta i ekran startowy sprawdza `src/app.test.ts` przez `app.request`. Osobny test: wgrana notatka z 2025 roku nie jest widoczna przy dacie systemowej 2024-12-09 i jest widoczna po przesunięciu daty na 2026-03-11.

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

- [ ] 1.3 Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px)
