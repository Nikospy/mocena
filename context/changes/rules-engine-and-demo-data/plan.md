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

Jedna faza. Reguły zostają danymi (`rules/*.json` z `version` i `effectiveFrom`), kod czyta je przez jeden moduł. Baza to jeden plik `bun:sqlite`, schemat tworzony przy starcie, dane pokazowe wgrywane skryptem. Konto to ciasteczko z identyfikatorem osoby. Data systemowa leży w bazie, żeby pokaz mógł ją przesuwać; cały kod pyta o „dziś” jedną funkcję.

## Phase 1: Fundament

### Changes Required:

#### 1. Reguły i silnik

**File**: `rules/regulation-2016-470.json`, `src/engine/*.ts`

**Intent**: Przenieść silnik i testy, przetłumaczyć nazwy w kodzie i klucze pliku reguł na angielski (treść przepisów zostaje po polsku), przemianować w pliku reguł `wersja` i `obowiazujeOd` na `version` i `effectiveFrom` (wartość `2016-04-23`), wystawić je przez `src/engine/rules.ts`. Po przeniesieniu usunąć katalogi `reguly/` i `src/silnik/`.

**Contract**: `rulesVersion(): { version, effectiveFrom, act }`; `scoring.ts` (wynik oceny) i `deadlines.ts` (terminy) zachowują zachowanie sprawdzone 19 testami.

#### 2. Baza i dane pokazowe

**File**: `src/db.ts`, `src/seed.ts`

**Intent**: Schemat (`people`, `cycles`, `cycle_criteria`, `events`, `settings`) i skrypt, który wgrywa osoby z listy „Kto jest w danych pokazowych” w `context/foundation/demo.md` (jeden urząd). Osoby, daty i notatki bierze z `context/foundation/demo.md`; brakujące daty (sekcja „Do ustalenia przy wgrywaniu danych”) ustala autor skryptu i dopisuje do tego pliku.

**Contract**: `bun run seed` kasuje i odtwarza bazę; `today()` zwraca datę systemową z tabeli `settings`.

#### 3. Konto i szkielet ekranu

**File**: `src/index.tsx` (przemianowany z `src/index.ts`), `src/views/layout.tsx`, `public/style.css`

**Intent**: Wybór konta pokazowego, wspólny układ (nagłówek z kontem i datą systemową, nawigacja), ekran startowy z listą spraw zależną od roli, tokeny wyglądu w jednym pliku.

**Contract**: `GET /account`, `POST /account`, `GET /` (przekierowuje na `/account` bez ciasteczka), `POST /demo/date` (przesunięcie daty systemowej).

### Success Criteria:

#### Automated Verification:

- Testy silnika i żądań przechodzą: `bun test`
- Dane pokazowe wgrywają się bez błędu: `bun run seed`

#### Manual Verification:

- Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px)

## Testing Strategy

Reguły sprawdza `src/engine/scoring.test.ts` (przykłady organizatora, granice przedziałów). Wejście bez konta, wybór konta i ekran startowy sprawdza `src/app.test.ts` przez `app.request`.

## References

- `context/foundation/decisions.md` (decyzje 7 i 8)
- `context/foundation/demo.md` (osoby i dane pokazowe)
- `context/foundation/prd.md` (FR-033, Business Logic, Access Control)
- `context/foundation/roadmap.md` (F-01)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fundament

#### Automated

- [ ] 1.1 Testy silnika i żądań przechodzą: `bun test`
- [ ] 1.2 Dane pokazowe wgrywają się bez błędu: `bun run seed`

#### Manual

- [ ] 1.3 Ekran startowy czytelny na telefonie (360 px) i komputerze (1440 px)
